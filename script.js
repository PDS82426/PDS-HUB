/* =========================================================
   PDS HUB — SUPABASE CONNECTED VERSION
   ========================================================= */

/* =========================================================
   SUPABASE CONFIG
========================================================= */

const SUPABASE_URL = "https://zvwghoabsqfyakbqzhil.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_oJ3Zc3TplfYgePQEmTrJ8Q_qycxR0jQ";

const { createClient } = supabase;

const db = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


/* =========================================================
   GLOBAL STATE
========================================================= */

let currentUser = null;
let currentProfile = null;
let currentModalMode = "project";


/* =========================================================
   AUTH SCREEN
========================================================= */

function showLogin() {

    document.getElementById("loginPanel").style.display = "block";
    document.getElementById("registerPanel").style.display = "none";

    clearAuthMessages();
}


function showRegister() {

    document.getElementById("loginPanel").style.display = "none";
    document.getElementById("registerPanel").style.display = "block";

    clearAuthMessages();
}


function clearAuthMessages() {

    const loginMessage =
        document.getElementById("loginMessage");

    const registerMessage =
        document.getElementById("registerMessage");

    if (loginMessage) {
        loginMessage.textContent = "";
    }

    if (registerMessage) {
        registerMessage.textContent = "";
    }
}


/* =========================================================
   SIGN IN
========================================================= */

const loginForm =
    document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async function(event) {

        event.preventDefault();

        const email =
            document.getElementById("loginEmail").value.trim();

        const password =
            document.getElementById("loginPassword").value;

        const message =
            document.getElementById("loginMessage");

        message.textContent = "Signing in...";

        const { data, error } =
            await db.auth.signInWithPassword({
                email: email,
                password: password
            });

        if (error) {

            console.error(error);

            message.textContent =
                error.message;

            return;
        }

        currentUser = data.user;

        message.textContent =
            "Login successful.";

        await initializeApplication();

    });

}


/* =========================================================
   CREATE ACCOUNT
========================================================= */

const registerForm =
    document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", async function(event) {

        event.preventDefault();

        const name =
            document.getElementById("registerName").value.trim();

        const position =
            document.getElementById("registerPosition").value.trim();

        const email =
            document.getElementById("registerEmail").value.trim();

        const password =
            document.getElementById("registerPassword").value;

        const confirmPassword =
            document.getElementById("registerConfirm").value;

        const message =
            document.getElementById("registerMessage");


        if (password !== confirmPassword) {

            message.textContent =
                "Passwords do not match.";

            return;
        }


        if (password.length < 6) {

            message.textContent =
                "Password must contain at least 6 characters.";

            return;
        }


        message.textContent =
            "Creating account...";


        const { data, error } =
            await db.auth.signUp({

                email: email,

                password: password,

                options: {

                    data: {
                        full_name: name,
                        position: position
                    }

                }

            });


        if (error) {

            console.error(error);

            message.textContent =
                error.message;

            return;
        }


        /*
         * If email confirmation is disabled,
         * Supabase immediately provides a session.
         */

        if (data.user && data.session) {

            currentUser = data.user;

            await createProfile(
                data.user.id,
                name,
                position
            );

            message.textContent =
                "Account created successfully.";

            await initializeApplication();

        } else {

            message.textContent =
                "Account created. Please check your email to confirm your account.";

            showLogin();

        }

    });

}


/* =========================================================
   CREATE PROFILE
========================================================= */

async function createProfile(
    userId,
    fullName,
    position
) {

    const { data, error } =
        await db
            .from("profiles")
            .upsert(
                {
                    id: userId,
                    full_name: fullName,
                    position: position,
                    role: "member"
                },
                {
                    onConflict: "id"
                }
            )
            .select()
            .single();


    if (error) {

        console.error(
            "Profile creation error:",
            error
        );

        return null;
    }


    currentProfile = data;

    return data;
}


/* =========================================================
   INITIALIZE APPLICATION
========================================================= */

async function initializeApplication() {

    const {
        data: {
            session
        }
    } = await db.auth.getSession();


    if (!session) {

        showAuthScreen();

        return;
    }


    currentUser = session.user;


    await loadProfile();

    hideAuthScreen();

    updateUserInterface();

    await loadDashboard();

    await loadProjects();

    await loadDocuments();

    await loadTeam();

}


/* =========================================================
   LOAD PROFILE
========================================================= */

async function loadProfile() {

    if (!currentUser) {
        return;
    }


    const { data, error } =
        await db
            .from("profiles")
            .select("*")
            .eq("id", currentUser.id)
            .maybeSingle();


    if (error) {

        console.error(
            "Profile loading error:",
            error
        );

        return;
    }


    if (!data) {

        currentProfile =
            await createProfile(
                currentUser.id,
                currentUser.user_metadata?.full_name ||
                    currentUser.email?.split("@")[0] ||
                    "User",
                currentUser.user_metadata?.position ||
                    "Member"
            );

        return;
    }


    currentProfile = data;
}


/* =========================================================
   AUTH UI
========================================================= */

function showAuthScreen() {

    const authScreen =
        document.getElementById("authScreen");

    const app =
        document.getElementById("app");

    if (authScreen) {
        authScreen.style.display = "flex";
    }

    if (app) {
        app.style.display = "none";
    }

}


function hideAuthScreen() {

    const authScreen =
        document.getElementById("authScreen");

    const app =
        document.getElementById("app");

    if (authScreen) {
        authScreen.style.display = "none";
    }

    if (app) {
        app.style.display = "flex";
    }

}


/* =========================================================
   UPDATE USER INFORMATION
========================================================= */

function updateUserInterface() {

    const name =
        currentProfile?.full_name ||
        currentUser?.email?.split("@")[0] ||
        "User";

    const position =
        currentProfile?.position ||
        "Member";


    const initials =
        getInitials(name);


    const welcomeName =
        document.getElementById("welcomeName");

    const sidebarName =
        document.getElementById("sidebarName");

    const sidebarPosition =
        document.getElementById("sidebarPosition");

    const sidebarAvatar =
        document.getElementById("sidebarAvatar");

    const topAvatar =
        document.getElementById("topAvatar");


    if (welcomeName) {
        welcomeName.textContent = name;
    }

    if (sidebarName) {
        sidebarName.textContent = name;
    }

    if (sidebarPosition) {
        sidebarPosition.textContent = position;
    }

    if (sidebarAvatar) {
        sidebarAvatar.textContent = initials;
    }

    if (topAvatar) {
        topAvatar.textContent = initials;
    }

}


function getInitials(name) {

    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(word => word.charAt(0))
        .join("")
        .toUpperCase();

}


/* =========================================================
   SIGN OUT
========================================================= */

async function signOut() {

    const { error } =
        await db.auth.signOut();


    if (error) {

        console.error(error);

        alert(error.message);

        return;
    }


    currentUser = null;

    currentProfile = null;

    showAuthScreen();

    showLogin();

}


/* =========================================================
   SESSION LISTENER
========================================================= */

db.auth.onAuthStateChange(
    async function(event, session) {

        console.log(
            "Auth event:",
            event
        );


        if (session) {

            currentUser = session.user;

            /*
             * Avoid repeatedly rebuilding the application
             * during token refresh.
             */

            if (
                event === "SIGNED_IN" ||
                event === "INITIAL_SESSION"
            ) {

                await initializeApplication();

            }

        } else {

            currentUser = null;

            currentProfile = null;

            showAuthScreen();

        }

    }
);


/* =========================================================
   PAGE NAVIGATION
========================================================= */

function showPage(pageId) {

    const pages =
        document.querySelectorAll(".page");

    const navItems =
        document.querySelectorAll(".nav-item");


    pages.forEach(page => {

        page.classList.remove(
            "active-page"
        );

    });


    const selectedPage =
        document.getElementById(pageId);


    if (selectedPage) {

        selectedPage.classList.add(
            "active-page"
        );

    }


    navItems.forEach(item => {

        item.classList.remove(
            "active"
        );


        if (
            item.dataset.page === pageId
        ) {

            item.classList.add(
                "active"
            );

        }

    });


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =========================================================
   SIDEBAR NAVIGATION
========================================================= */

document
    .querySelectorAll(".nav-item")
    .forEach(item => {

        item.addEventListener(
            "click",
            function(event) {

                event.preventDefault();

                const page =
                    this.dataset.page;

                if (page) {

                    showPage(page);

                }

            }
        );

    });


/* =========================================================
   GLOBAL SEARCH
========================================================= */

const globalSearch =
    document.getElementById("globalSearch");


if (globalSearch) {

    globalSearch.addEventListener(
        "input",
        function() {

            const search =
                this.value
                    .toLowerCase()
                    .trim();


            if (!search) {
                return;
            }


            const pages =
                document.querySelectorAll(".page");


            pages.forEach(page => {

                const text =
                    page.innerText
                        .toLowerCase();


                if (
                    text.includes(search)
                ) {

                    showPage(page.id);

                }

            });

        }
    );

}


/* =========================================================
   CTRL + K
========================================================= */

document.addEventListener(
    "keydown",
    function(event) {

        if (
            (event.ctrlKey ||
                event.metaKey) &&
            event.key.toLowerCase() === "k"
        ) {

            event.preventDefault();

            focusSearch();

        }

    }
);


function focusSearch() {

    const search =
        document.getElementById(
            "globalSearch"
        );


    if (search) {

        search.focus();

        search.select();

    }

}


/* =========================================================
   PROJECT MODAL
========================================================= */

function openProjectModal() {

    currentModalMode =
        "project";


    document.getElementById(
        "modalTitle"
    ).textContent =
        "New project";


    document.getElementById(
        "modalDescription"
    ).textContent =
        "Create a new project for monitoring.";


    document.getElementById(
        "projectFields"
    ).style.display =
        "block";


    document.getElementById(
        "uploadFields"
    ).style.display =
        "none";


    document.getElementById(
        "modalSubmitButton"
    ).textContent =
        "Create Project";


    document.getElementById(
        "modal"
    ).classList.add("open");

}


/* =========================================================
   UPDATE MODAL
========================================================= */

function openUpdateModal() {

    currentModalMode =
        "update";


    document.getElementById(
        "modalTitle"
    ).textContent =
        "New update";


    document.getElementById(
        "modalDescription"
    ).textContent =
        "Add an update to your PDS Hub workspace.";


    document.getElementById(
        "projectFields"
    ).style.display =
        "none";


    document.getElementById(
        "uploadFields"
    ).style.display =
        "block";


    document.getElementById(
        "documentTitle"
    ).value =
        "";


    document.getElementById(
        "documentCategory"
    ).value =
        "General";


    document.getElementById(
        "modalSubmitButton"
    ).textContent =
        "Save Update";


    document.getElementById(
        "modal"
    ).classList.add("open");

}


/* =========================================================
   UPLOAD MODAL
========================================================= */

function openUploadModal(category = "General") {

    currentModalMode =
        "upload";


    document.getElementById(
        "modalTitle"
    ).textContent =
        "Upload document";


    document.getElementById(
        "modalDescription"
    ).textContent =
        "Add a document to your PDS Hub library.";


    document.getElementById(
        "projectFields"
    ).style.display =
        "none";


    document.getElementById(
        "uploadFields"
    ).style.display =
        "block";


    document.getElementById(
        "documentCategory"
    ).value =
        category;


    document.getElementById(
        "modalSubmitButton"
    ).textContent =
        "Upload";


    document.getElementById(
        "modal"
    ).classList.add("open");

}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeModal() {

    const modal =
        document.getElementById("modal");


    if (modal) {

        modal.classList.remove(
            "open"
        );

    }


    const form =
        document.getElementById(
            "modalForm"
        );


    if (form) {
        form.reset();
    }

}


/* =========================================================
   MODAL SUBMIT
========================================================= */

const modalForm =
    document.getElementById("modalForm");


if (modalForm) {

    modalForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            if (!currentUser) {

                alert(
                    "Please sign in first."
                );

                return;

            }


            if (
                currentModalMode === "project"
            ) {

                await createProject();

            }


            if (
                currentModalMode === "upload" ||
                currentModalMode === "update"
            ) {

                await uploadDocument();

            }

        }
    );

}


/* =========================================================
   CREATE PROJECT
========================================================= */

async function createProject() {

    const code =
        document.getElementById(
            "projectCode"
        ).value.trim();


    const name =
        document.getElementById(
            "projectName"
        ).value.trim();


    const location =
        document.getElementById(
            "projectLocation"
        ).value.trim();


    const status =
        document.getElementById(
            "projectStatus"
        ).value;


    const progress =
        Number(
            document.getElementById(
                "projectProgress"
            ).value || 0
        );


    const targetDate =
        document.getElementById(
            "projectTargetDate"
        ).value ||
        null;


    const notes =
        document.getElementById(
            "projectNotes"
        ).value.trim();


    if (!name) {

        alert(
            "Project name is required."
        );

        return;

    }


    /*
     * Your database currently does NOT
     * have a progress column.
     *
     * Therefore progress is stored
     * inside notes temporarily.
     */

    let finalNotes = notes;

    if (progress > 0) {

        finalNotes =
            `[Progress: ${progress}%] ${notes}`;

    }


    const {
        data,
        error
    } =
        await db
            .from("projects")
            .insert({

                owner_id:
                    currentUser.id,

                project_code:
                    code || null,

                name:
                    name,

                location:
                    location || null,

                status:
                    status,

                target_date:
                    targetDate,

                notes:
                    finalNotes || null

            })
            .select()
            .single();


    if (error) {

        console.error(
            "Project creation error:",
            error
        );


        alert(
            "Unable to create project:\n\n" +
            error.message
        );


        return;

    }


    alert(
        "Project created successfully."
    );


    closeModal();

    await loadProjects();

    await loadDashboard();

}


/* =========================================================
   LOAD PROJECTS
========================================================= */

async function loadProjects() {

    if (!currentUser) {
        return;
    }


    const {
        data,
        error
    } =
        await db
            .from("projects")
            .select("*")
            .eq(
                "owner_id",
                currentUser.id
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Projects loading error:",
            error
        );

        return;

    }


    renderProjects(
        data || []
    );

}


/* =========================================================
   RENDER PROJECTS
========================================================= */

function renderProjects(projects) {

    const projectList =
        document.getElementById(
            "projectList"
        );


    const myProjectList =
        document.getElementById(
            "myProjectList"
        );


    const overviewProjects =
        document.getElementById(
            "overviewProjects"
        );


    if (projectList) {

        if (!projects.length) {

            projectList.innerHTML = `
                <div class="empty-card">
                    <div class="empty-icon">◫</div>
                    <h2>No projects yet</h2>
                    <p>Create your first project.</p>
                    <button
                        class="button primary"
                        onclick="openProjectModal()"
                    >
                        + New Project
                    </button>
                </div>
            `;

        } else {

            projectList.innerHTML =
                projects
                    .map(project =>
                        projectRow(project)
                    )
                    .join("");

        }

    }


    if (myProjectList) {

        if (!projects.length) {

            myProjectList.innerHTML = `
                <div class="empty-card">
                    <div class="empty-icon">✓</div>
                    <h2>No projects yet</h2>
                    <p>Your projects will appear here.</p>
                </div>
            `;

        } else {

            myProjectList.innerHTML =
                projects
                    .map(project =>
                        myProjectCard(project)
                    )
                    .join("");

        }

    }


    if (overviewProjects) {

        if (!projects.length) {

            overviewProjects.innerHTML = `
                <div class="empty-card">
                    <div class="empty-icon">◫</div>
                    <h2>No projects</h2>
                    <p>Create a project to start monitoring.</p>
                </div>
            `;

        } else {

            overviewProjects.innerHTML =
                projects
                    .slice(0, 5)
                    .map(project =>
                        deadlineRow(project)
                    )
                    .join("");

        }

    }


    updateProjectBadge(
        projects.length
    );

}


/* =========================================================
   PROJECT ROW
========================================================= */

function projectRow(project) {

    const progress =
        getProjectProgress(project);


    return `
        <div class="project-row">

            <span>
                <strong>
                    ${escapeHtml(project.name)}
                </strong>

                ${
                    project.project_code
                    ? `<small>${escapeHtml(project.project_code)}</small>`
                    : ""
                }
            </span>


            <span>
                ${escapeHtml(project.location || "—")}
            </span>


            <span>
                <span class="status ${statusClass(project.status)}">
                    ${escapeHtml(project.status)}
                </span>
            </span>


            <span>

                <div class="progress">
                    <div
                        style="width:${progress}%"
                    ></div>
                </div>

                <small>
                    ${progress}%
                </small>

            </span>


            <button
                onclick="deleteProject('${project.id}')"
            >
                Delete
            </button>

        </div>
    `;

}


/* =========================================================
   MY PROJECT CARD
========================================================= */

function myProjectCard(project) {

    const progress =
        getProjectProgress(project);


    return `
        <div class="panel" style="margin-bottom:15px">

            <div class="panel-header">

                <div>

                    <div class="eyebrow">
                        ${escapeHtml(project.project_code || "PROJECT")}
                    </div>

                    <h2>
                        ${escapeHtml(project.name)}
                    </h2>

                </div>

                <span class="status ${statusClass(project.status)}">
                    ${escapeHtml(project.status)}
                </span>

            </div>

            <p>
                ${escapeHtml(project.location || "No location specified")}
            </p>

            <div class="progress">
                <div style="width:${progress}%"></div>
            </div>

            <small>
                ${progress}% complete
            </small>

        </div>
    `;

}


/* =========================================================
   PROJECT STATUS
========================================================= */

function statusClass(status) {

    switch (status) {

        case "Ongoing":
            return "ongoing";

        case "For Review":
            return "review";

        case "Completed":
            return "completed";

        case "Suspended":
            return "urgent";

        default:
            return "upcoming";

    }

}


/* =========================================================
   PROJECT PROGRESS
========================================================= */

function getProjectProgress(project) {

    const notes =
        project.notes || "";


    const match =
        notes.match(
            /\[Progress:\s*(\d+)%\]/i
        );


    if (match) {

        return Math.min(
            100,
            Math.max(
                0,
                Number(match[1])
            )
        );

    }


    if (
        project.status === "Completed"
    ) {
        return 100;
    }


    if (
        project.status === "Planning"
    ) {
        return 0;
    }


    return 50;

}


/* =========================================================
   DELETE PROJECT
========================================================= */

async function deleteProject(id) {

    if (
        !confirm(
            "Delete this project?"
        )
    ) {
        return;
    }


    const {
        error
    } =
        await db
            .from("projects")
            .delete()
            .eq(
                "id",
                id
            )
            .eq(
                "owner_id",
                currentUser.id
            );


    if (error) {

        alert(
            "Unable to delete project:\n\n" +
            error.message
        );

        return;

    }


    await loadProjects();

    await loadDashboard();

}


/* =========================================================
   OVERVIEW PROJECT ROW
========================================================= */

function deadlineRow(project) {

    const date =
        project.target_date
            ? new Date(
                project.target_date +
                "T00:00:00"
            )
            : null;


    const day =
        date
            ? date.getDate()
            : "—";


    const month =
        date
            ? date.toLocaleDateString(
                "en-US",
                {
                    month: "short"
                }
            ).toUpperCase()
            : "";


    return `
        <div class="deadline">

            <div class="deadline-date">

                <strong>
                    ${day}
                </strong>

                <span>
                    ${month}
                </span>

            </div>


            <div class="deadline-info">

                <strong>
                    ${escapeHtml(project.name)}
                </strong>

                <span>
                    ${escapeHtml(project.location || "No location")}
                </span>

            </div>


            <span class="status ${statusClass(project.status)}">
                ${escapeHtml(project.status)}
            </span>

        </div>
    `;

}


/* =========================================================
   UPDATE PROJECT BADGE
========================================================= */

function updateProjectBadge(count) {

    const badge =
        document.getElementById(
            "projectBadge"
        );


    if (badge) {

        badge.textContent =
            count;

    }

}


/* =========================================================
   DASHBOARD
========================================================= */

async function loadDashboard() {

    if (!currentUser) {
        return;
    }


    const {
        data: projects,
        error: projectError
    } =
        await db
            .from("projects")
            .select("*")
            .eq(
                "owner_id",
                currentUser.id
            );


    if (projectError) {

        console.error(
            projectError
        );

        return;

    }


    const {
        count: documentCount,
        error: documentError
    } =
        await db
            .from("documents")
            .select(
                "id",
                {
                    count: "exact",
                    head: true
                }
            )
            .eq(
                "owner_id",
                currentUser.id
            );


    if (documentError) {

        console.error(
            documentError
        );

    }


    const active =
        projects.filter(
            project =>
                project.status !== "Completed"
        ).length;


    const review =
        projects.filter(
            project =>
                project.status === "For Review"
        ).length;


    const completed =
        projects.filter(
            project =>
                project.status === "Completed"
        ).length;


    setText(
        "activeProjectsCount",
        active
    );


    setText(
        "reviewProjectsCount",
        review
    );


    setText(
        "completedProjectsCount",
        completed
    );


    setText(
        "documentsCount",
        documentCount || 0
    );


    const averageProgress =
        projects.length
            ? Math.round(
                projects.reduce(
                    (
                        total,
                        project
                    ) =>
                        total +
                        getProjectProgress(project),
                    0
                ) /
                projects.length
            )
            : 0;


    setText(
        "workspaceProgress",
        averageProgress + "%"
    );

}


/* =========================================================
   DOCUMENT UPLOAD
========================================================= */

async function uploadDocument() {

    const title =
        document.getElementById(
            "documentTitle"
        ).value.trim();


    const category =
        document.getElementById(
            "documentCategory"
        ).value;


    const fileInput =
        document.getElementById(
            "documentFile"
        );


    const file =
        fileInput.files[0];


    if (!file) {

        alert(
            "Please select a file."
        );

        return;

    }


    if (!title) {

        alert(
            "Please enter a document title."
        );

        return;

    }


    const safeFileName =
        sanitizeFileName(
            file.name
        );


    const filePath =
        `${currentUser.id}/${Date.now()}_${safeFileName}`;


    /*
     * Upload to Supabase Storage.
     *
     * IMPORTANT:
     * The storage bucket must be named:
     *
     * documents
     */

    const {
        error: uploadError
    } =
        await db.storage
            .from("documents")
            .upload(
                filePath,
                file,
                {
                    cacheControl: "3600",
                    upsert: false
                }
            );


    if (uploadError) {

        console.error(
            "Storage error:",
            uploadError
        );


        alert(
            "File upload failed:\n\n" +
            uploadError.message
        );


        return;

    }


    /*
     * Save document information
     * to public.documents
     */

    const {
        error: databaseError
    } =
        await db
            .from("documents")
            .insert({

                owner_id:
                    currentUser.id,

                title:
                    title,

                project_name:
                    category,

                file_name:
                    file.name,

                file_path:
                    filePath,

                mime_type:
                    file.type || null,

                size_bytes:
                    file.size

            });


    if (databaseError) {

        console.error(
            "Document database error:",
            databaseError
        );


        /*
         * Remove uploaded file if
         * database insert fails.
         */

        await db.storage
            .from("documents")
            .remove([
                filePath
            ]);


        alert(
            "Document record could not be saved:\n\n" +
            databaseError.message
        );


        return;

    }


    alert(
        "Document uploaded successfully."
    );


    closeModal();

    await loadDocuments();

    await loadDashboard();

}


/* =========================================================
   LOAD DOCUMENTS
========================================================= */

async function loadDocuments() {

    if (!currentUser) {
        return;
    }


    const {
        data,
        error
    } =
        await db
            .from("documents")
            .select("*")
            .eq(
                "owner_id",
                currentUser.id
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Documents loading error:",
            error
        );

        return;

    }


    renderDocuments(
        data || []
    );

}


/* =========================================================
   RENDER DOCUMENTS
========================================================= */

function renderDocuments(documents) {

    const library =
        document.getElementById(
            "libraryList"
        );


    const recent =
        document.getElementById(
            "recentFiles"
        );


    const orders =
        document.getElementById(
            "ordersDocuments"
        );


    const standards =
        document.getElementById(
            "standardsDocuments"
        );


    const forms =
        document.getElementById(
            "formsDocuments"
        );


    if (library) {

        library.innerHTML =
            documents.length
                ? documents
                    .map(
                        documentItem
                    )
                    .join("")
                :
                    `
                    <div class="empty-card">
                        <div class="empty-icon">▤</div>
                        <h2>No documents</h2>
                        <p>Upload your first document.</p>
                    </div>
                    `;

    }


    if (recent) {

        recent.innerHTML =
            documents
                .slice(0, 5)
                .map(
                    recentFile
                )
                .join("");

    }


    renderCategory(
        orders,
        documents,
        "Department Order"
    );


    renderCategory(
        standards,
        documents,
        "Standard / Template"
    );


    renderCategory(
        forms,
        documents,
        "Form"
    );


    filterLibrary();

}


/* =========================================================
   DOCUMENT ITEM
========================================================= */

function documentItem(document) {

    const type =
        getFileType(
            document.file_name
        );


    return `
        <div
            class="library-item"
            data-type="${type}"
        >

            <div class="library-icon">
                ${fileIcon(type)}
            </div>


            <div>

                <strong>
                    ${escapeHtml(document.title)}
                </strong>

                <span>
                    ${escapeHtml(document.file_name)}
                    ·
                    ${formatFileSize(document.size_bytes)}
                </span>

            </div>


            <button
                onclick="openDocument('${document.file_path}')"
            >
                Open
            </button>


            <button
                onclick="deleteDocument('${document.id}', '${document.file_path}')"
            >
                Delete
            </button>

        </div>
    `;

}


/* =========================================================
   RECENT FILE
========================================================= */

function recentFile(document) {

    const type =
        getFileType(
            document.file_name
        );


    return `
        <div class="file-row">

            <div class="file-icon">
                ${fileIcon(type)}
            </div>

            <div class="file-info">

                <strong>
                    ${escapeHtml(document.title)}
                </strong>

                <span>
                    ${escapeHtml(document.file_name)}
                </span>

            </div>

            <span class="file-tag">
                ${type}
            </span>

            <button
                class="download"
                onclick="openDocument('${document.file_path}')"
            >
                ↗
            </button>

        </div>
    `;

}


/* =========================================================
   CATEGORY DOCUMENTS
========================================================= */

function renderCategory(
    container,
    documents,
    category
) {

    if (!container) {
        return;
    }


    const filtered =
        documents.filter(
            document =>
                document.project_name ===
                category
        );


    if (!filtered.length) {

        container.innerHTML = `
            <div class="empty-card">
                <div class="empty-icon">▤</div>
                <h2>No documents yet</h2>
                <p>
                    Upload a ${escapeHtml(category.toLowerCase())}.
                </p>
            </div>
        `;

        return;

    }


    container.innerHTML =
        filtered
            .map(document => {

                const type =
                    getFileType(
                        document.file_name
                    );


                return `
                    <div class="document-card">

                        <div class="document-icon">
                            ${fileIcon(type)}
                        </div>

                        <h3>
                            ${escapeHtml(document.title)}
                        </h3>

                        <p>
                            ${escapeHtml(document.file_name)}
                        </p>

                        <span>
                            ${type}
                            ·
                            ${formatFileSize(document.size_bytes)}
                        </span>

                        <br><br>

                        <button
                            class="button secondary"
                            onclick="openDocument('${document.file_path}')"
                        >
                            Open
                        </button>

                    </div>
                `;

            })
            .join("");

}


/* =========================================================
   OPEN DOCUMENT
========================================================= */

async function openDocument(filePath) {

    const {
        data,
        error
    } =
        await db.storage
            .from("documents")
            .createSignedUrl(
                filePath,
                3600
            );


    if (error) {

        alert(
            "Unable to open document:\n\n" +
            error.message
        );

        return;

    }


    window.open(
        data.signedUrl,
        "_blank"
    );

}


/* =========================================================
   DELETE DOCUMENT
========================================================= */

async function deleteDocument(
    id,
    filePath
) {

    if (
        !confirm(
            "Delete this document?"
        )
    ) {
        return;
    }


    const {
        error: storageError
    } =
        await db.storage
            .from("documents")
            .remove([
                filePath
            ]);


    if (storageError) {

        console.error(
            storageError
        );

    }


    const {
        error
    } =
        await db
            .from("documents")
            .delete()
            .eq(
                "id",
                id
            )
            .eq(
                "owner_id",
                currentUser.id
            );


    if (error) {

        alert(
            "Unable to delete document:\n\n" +
            error.message
        );

        return;

    }


    await loadDocuments();

    await loadDashboard();

}


/* =========================================================
   LIBRARY SEARCH
========================================================= */

function filterLibrary() {

    const searchInput =
        document.getElementById(
            "librarySearch"
        );


    const typeFilter =
        document.getElementById(
            "fileTypeFilter"
        );


    const search =
        searchInput
            ? searchInput.value
                .toLowerCase()
                .trim()
            : "";


    const type =
        typeFilter
            ? typeFilter.value
            : "all";


    const items =
        document.querySelectorAll(
            ".library-item"
        );


    items.forEach(item => {

        const text =
            item.innerText
                .toLowerCase();


        const itemType =
            item.dataset.type;


        const matchesSearch =
            text.includes(
                search
            );


        const matchesType =
            type === "all" ||
            itemType === type;


        item.style.display =
            matchesSearch &&
            matchesType
                ? "flex"
                : "none";

    });

}


/* =========================================================
   TEAM DIRECTORY
========================================================= */

async function loadTeam() {

    const {
        data,
        error
    } =
        await db
            .from("profiles")
            .select(
                "id, full_name, position, role"
            )
            .order(
                "full_name",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "Team loading error:",
            error
        );

        return;

    }


    const teamList =
        document.getElementById(
            "teamList"
        );


    if (!teamList) {
        return;
    }


    if (!data.length) {

        teamList.innerHTML = `
            <div class="empty-card">
                <h2>No team members</h2>
            </div>
        `;

        return;

    }


    teamList.innerHTML =
        data.map(member => {

            const initials =
                getInitials(
                    member.full_name ||
                    "User"
                );


            return `
                <div class="team-card">

                    <div class="team-avatar">
                        ${initials}
                    </div>

                    <h3>
                        ${escapeHtml(
                            member.full_name ||
                            "User"
                        )}
                    </h3>

                    <p>
                        ${escapeHtml(
                            member.position ||
                            member.role ||
                            "Member"
                        )}
                    </p>

                </div>
            `;

        }).join("");

}


/* =========================================================
   FILE TYPE
========================================================= */

function getFileType(fileName) {

    const extension =
        fileName
            .split(".")
            .pop()
            .toLowerCase();


    if (extension === "pdf") {
        return "PDF";
    }

    if (
        extension === "xlsx" ||
        extension === "xls"
    ) {
        return "XLSX";
    }

    if (
        extension === "docx" ||
        extension === "doc"
    ) {
        return "DOCX";
    }


    return extension
        .toUpperCase();

}


/* =========================================================
   FILE ICON
========================================================= */

function fileIcon(type) {

    switch (type) {

        case "PDF":
            return "PDF";

        case "XLSX":
            return "XLS";

        case "DOCX":
            return "DOC";

        default:
            return "FILE";

    }

}


/* =========================================================
   FILE SIZE
========================================================= */

function formatFileSize(bytes) {

    if (!bytes) {
        return "0 KB";
    }


    const units = [
        "B",
        "KB",
        "MB",
        "GB"
    ];


    let size =
        Number(bytes);

    let index = 0;


    while (
        size >= 1024 &&
        index < units.length - 1
    ) {

        size /= 1024;

        index++;

    }


    return (
        size.toFixed(
            index === 0 ? 0 : 1
        ) +
        " " +
        units[index]
    );

}


/* =========================================================
   SANITIZE FILE NAME
========================================================= */

function sanitizeFileName(name) {

    return name
        .replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
        );

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHtml(value) {

    return String(value ?? "")
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   SET TEXT
========================================================= */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value;

    }

}


/* =========================================================
   ESC CLOSE MODAL
========================================================= */

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Escape"
        ) {

            closeModal();

        }

    }
);


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function() {

        showPage("overview");

        await initializeApplication();

    }
);
