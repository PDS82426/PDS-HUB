/* =========================================================
   PDS HUB
   Supabase + GitHub Pages
   ========================================================= */

const SUPABASE_URL = "https://zvwghoabsqfyakbqzhil.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_oJ3Zc3TplfYgePQEmTrJ8Q_qycxR0jQ";

const db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

console.log("PDS HUB SCRIPT LOADED");
console.log("Supabase client:", db);

let currentUser = null;
let currentProfile = null;
let modalMode = "project";


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

    const loginMessage = document.getElementById("loginMessage");
    const registerMessage = document.getElementById("registerMessage");

    if (loginMessage) loginMessage.textContent = "";
    if (registerMessage) registerMessage.textContent = "";
}


/* =========================================================
   AUTH MESSAGE
========================================================= */

function authMessage(elementId, message, success = false) {

    const el = document.getElementById(elementId);

    if (!el) return;

    el.textContent = message;

    el.style.color = success
        ? "#1d5b45"
        : "#b34b42";
}


/* =========================================================
   SIGN UP
========================================================= */

async function registerUser(event) {
    event.preventDefault();

    const name = document.getElementById("registerName").value.trim();
    const position = document.getElementById("registerPosition").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;
    const confirm = document.getElementById("registerConfirm").value;

    if (password !== confirm) {
        authMessage(
            "registerMessage",
            "Passwords do not match."
        );
        return;
    }

    if (password.length < 6) {
        authMessage(
            "registerMessage",
            "Password must be at least 6 characters."
        );
        return;
    }

    const button = document.querySelector(
        "#registerForm button[type='submit']"
    );

    button.disabled = true;
    button.textContent = "Creating...";

    authMessage(
        "registerMessage",
        "Creating account..."
    );

    try {

        const { data, error } = await db.auth.signUp({
            email: email,
            password: password,

            options: {
                data: {
                    full_name: name,
                    position: position
                },

                emailRedirectTo:
                    "https://christinedpwh2024-blip.github.io/PDS-HUB/"
            }
        });

        console.log("Supabase signup:", data);
        console.log("Supabase error:", error);

        if (error) {
            throw error;
        }

        if (!data.user) {
            throw new Error(
                "Supabase did not return a user."
            );
        }

        if (data.session) {

            await createProfile(
                data.user,
                name,
                position
            );

            authMessage(
                "registerMessage",
                "Account created successfully! You can now sign in.",
                true
            );

            document
                .getElementById("registerForm")
                .reset();

        } else {

            authMessage(
                "registerMessage",
                "Account created! Please check your email and click the confirmation link.",
                true
            );

            document
                .getElementById("registerForm")
                .reset();
        }

    } catch (error) {

        console.error(
            "CREATE ACCOUNT ERROR:",
            error
        );

        authMessage(
            "registerMessage",
            "Create account failed: " +
            error.message
        );

    } finally {

        button.disabled = false;
        button.textContent = "Create Account";

    }
}


    authMessage(
        "registerMessage",
        "Creating account..."
    );


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

        authMessage(
            "registerMessage",
            error.message
        );

        return;
    }


    /*
       Create profile if session already exists.
       If email confirmation is enabled, the profile
       will be created by the database trigger if available.
    */

    if (data.user && data.session) {

        await createProfile(
            data.user,
            name,
            position
        );
    }


    authMessage(
        "registerMessage",
        "Account created successfully. Check your email if confirmation is required.",
        true
    );


    document.getElementById("registerForm").reset();

}


/* =========================================================
   CREATE PROFILE
========================================================= */

async function createProfile(user, name, position) {

    if (!user) return;


    const { error } = await db
        .from("profiles")
        .upsert({

            id: user.id,

            full_name: name || user.email,

            position: position || "",

            role: "member"

        }, {

            onConflict: "id"

        });


    if (error) {

        console.error(
            "Profile creation error:",
            error
        );

    }

}


/* =========================================================
   SIGN IN
========================================================= */

async function loginUser(event) {

    event.preventDefault();


    const email =
        document.getElementById("loginEmail").value.trim();

    const password =
        document.getElementById("loginPassword").value;


    authMessage(
        "loginMessage",
        "Signing in..."
    );


    const { data, error } =
        await db.auth.signInWithPassword({

            email: email,

            password: password

        });


    if (error) {

        authMessage(
            "loginMessage",
            error.message
        );

        return;
    }


    currentUser = data.user;

    await loadApplication();


    document.getElementById("loginForm").reset();

}


/* =========================================================
   SIGN OUT
========================================================= */

async function signOut() {

    await db.auth.signOut();

    currentUser = null;
    currentProfile = null;

    document.getElementById("app").style.display = "none";
    document.getElementById("authScreen").style.display = "flex";

    showLogin();

}


/* =========================================================
   LOAD APPLICATION
========================================================= */

async function loadApplication() {

    const {
        data: {
            user
        }
    } = await db.auth.getUser();


    if (!user) {

        document.getElementById("authScreen").style.display = "flex";
        document.getElementById("app").style.display = "none";

        return;
    }


    currentUser = user;


    await loadProfile();


    document.getElementById("authScreen").style.display = "none";
    document.getElementById("app").style.display = "flex";


    updateUserInterface();


    await refreshAll();


    showPage("overview");

}


/* =========================================================
   PROFILE
========================================================= */

async function loadProfile() {

    if (!currentUser) return;


    const { data, error } = await db
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


    if (data) {

        currentProfile = data;

    } else {

        await createProfile(
            currentUser,
            currentUser.user_metadata?.full_name || "",
            currentUser.user_metadata?.position || ""
        );


        const { data: profile } = await db
            .from("profiles")
            .select("*")
            .eq("id", currentUser.id)
            .maybeSingle();


        currentProfile = profile;

    }

}


/* =========================================================
   UPDATE USER INTERFACE
========================================================= */

function updateUserInterface() {

    const name =
        currentProfile?.full_name ||
        currentUser?.email ||
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


    if (welcomeName)
        welcomeName.textContent = name.split(" ")[0];


    if (sidebarName)
        sidebarName.textContent = name;


    if (sidebarPosition)
        sidebarPosition.textContent = position;


    if (sidebarAvatar)
        sidebarAvatar.textContent = initials;


    if (topAvatar)
        topAvatar.textContent = initials;

}


function getInitials(name) {

    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(word => word[0])
        .join("")
        .toUpperCase() || "U";

}


/* =========================================================
   PAGE NAVIGATION
========================================================= */

function showPage(pageId) {

    const pages =
        document.querySelectorAll(".page");

    const navItems =
        document.querySelectorAll(".nav-item");


    pages.forEach(page => {

        page.classList.remove("active-page");

    });


    const selectedPage =
        document.getElementById(pageId);


    if (selectedPage) {

        selectedPage.classList.add("active-page");

    }


    navItems.forEach(item => {

        item.classList.remove("active");


        if (item.dataset.page === pageId) {

            item.classList.add("active");

        }

    });


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =========================================================
   GLOBAL SEARCH
========================================================= */

const globalSearch =
    document.getElementById("globalSearch");


if (globalSearch) {

    globalSearch.addEventListener(
        "input",
        function () {

            const search =
                this.value.toLowerCase().trim();


            if (!search) {

                showPage("overview");

                return;
            }


            const pages =
                document.querySelectorAll(".page");


            let found = false;


            pages.forEach(page => {

                if (
                    !found &&
                    page.innerText
                        .toLowerCase()
                        .includes(search)
                ) {

                    showPage(page.id);

                    found = true;

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
    function (event) {

        if (
            (event.ctrlKey || event.metaKey) &&
            event.key.toLowerCase() === "k"
        ) {

            event.preventDefault();

            focusSearch();

        }

    }
);


function focusSearch() {

    const search =
        document.getElementById("globalSearch");


    if (search) {

        search.focus();
        search.select();

    }

}


/* =========================================================
   MODAL
========================================================= */

const modal =
    document.getElementById("modal");


function openModal(
    title,
    description
) {

    document.getElementById(
        "modalTitle"
    ).textContent = title;


    document.getElementById(
        "modalDescription"
    ).textContent = description;


    modal.classList.add("open");

}


function closeModal() {

    modal.classList.remove("open");

    document
        .getElementById("modalForm")
        .reset();

}


function openProjectModal() {

    modalMode = "project";


    document.getElementById(
        "projectFields"
    ).style.display = "block";


    document.getElementById(
        "uploadFields"
    ).style.display = "none";


    openModal(
        "New project",
        "Create a new project for monitoring."
    );

}


function openUploadModal(category = "General") {

    modalMode = "upload";


    document.getElementById(
        "projectFields"
    ).style.display = "none";


    document.getElementById(
        "uploadFields"
    ).style.display = "block";


    document.getElementById(
        "documentCategory"
    ).value = category;


    openModal(
        "Upload document",
        "Upload a PDF, Excel, or Word document."
    );

}


/* =========================================================
   SAVE PROJECT
========================================================= */

async function saveProject() {

    if (!currentUser) return;


   const project = {

    owner_id: currentUser.id,

    project_code:
        document.getElementById(
            "projectCode"
        ).value.trim() || null,

    name:
        document.getElementById(
            "projectName"
        ).value.trim(),

    location:
        document.getElementById(
            "projectLocation"
        ).value.trim() || null,

status:
    document.getElementById(
        "projectStatus"
    ).value,

progress:
    Math.min(
        100,
        Math.max(
            0,
            Number(
                document.getElementById(
                    "projectProgress"
                ).value
            ) || 0
        )
    ),

target_date:
        document.getElementById(
            "projectTargetDate"
        ).value || null,

    notes:
        document.getElementById(
            "projectNotes"
        ).value.trim() || null
};
    if (!project.name) {

        alert("Please enter a project name.");

        return;
    }


    const { error } =
        await db
            .from("projects")
            .insert(project);


    if (error) {

        console.error(error);

        alert(
            "Could not save project:\n\n" +
            error.message
        );

        return;
    }


    closeModal();


    await refreshAll();


    showPage("projects");

}


/* =========================================================
   UPLOAD DOCUMENT
========================================================= */

async function uploadDocument() {

    if (!currentUser) {

        alert("Please sign in first.");

        return;
    }


    const file =
        document.getElementById(
            "documentFile"
        ).files[0];


    const title =
        document.getElementById(
            "documentTitle"
        ).value.trim();


    const category =
        document.getElementById(
            "documentCategory"
        ).value;


    if (!file) {

        alert("Please select a file.");

        return;
    }


    if (!title) {

        alert("Please enter a document title.");

        return;
    }


    /*
       Create a unique path:

       user-id / timestamp / filename
    */

    const safeFileName =
        file.name
            .replace(
                /[^a-zA-Z0-9._-]/g,
                "_"
            );


    const filePath =
        currentUser.id +
        "/" +
        Date.now() +
        "_" +
        safeFileName;


    const submitButton =
        document.getElementById(
            "modalSubmitButton"
        );


    submitButton.disabled = true;
    submitButton.textContent = "Uploading...";


    try {

        /*
           1. Upload physical file
           to Supabase Storage
        */

        const {
            error: uploadError
        } = await db
            .storage
            .from("documents")
            .upload(
                filePath,
                file,
                {
                    cacheControl: "3600",
                    upsert: false,
                    contentType: file.type
                }
            );


        if (uploadError) {

            throw uploadError;

        }


        /*
           2. Save file metadata
           to documents table
        */

        const {
            error: databaseError
        } = await db
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
                    file.type,

                size_bytes:
                    file.size

            });


        /*
           If database insert fails,
           remove uploaded file so we
           don't leave orphaned files.
        */

        if (databaseError) {

            await db
                .storage
                .from("documents")
                .remove([
                    filePath
                ]);

            throw databaseError;

        }


        alert(
            "Document uploaded successfully."
        );


        closeModal();


        await refreshAll();


        showPage("content");


    } catch (error) {

        console.error(
            "Upload error:",
            error
        );


        alert(
            "Upload failed:\n\n" +
            error.message
        );


    } finally {

        submitButton.disabled = false;
        submitButton.textContent = "Save";

    }

}


/* =========================================================
   MODAL SUBMIT
========================================================= */

document
    .getElementById("modalForm")
    .addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            if (modalMode === "project") {

                await saveProject();

            } else {

                await uploadDocument();

            }

        }
    );


/* =========================================================
   LOAD PROJECTS
========================================================= */

async function loadProjects() {

    if (!currentUser) return;


    const {
        data,
        error
    } = await db
        .from("projects")
        .select("*")
        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(
            "Project error:",
            error
        );

        return;
    }


    renderProjects(data || []);

}


/* =========================================================
   RENDER PROJECTS
========================================================= */

function renderProjects(projects) {

    const list =
        document.getElementById(
            "projectList"
        );


    const myList =
        document.getElementById(
            "myProjectList"
        );


    const overview =
        document.getElementById(
            "overviewProjects"
        );


    if (!projects.length) {

        if (list) {

            list.innerHTML = `
                <div class="empty-card">
                    <div class="empty-icon">◫</div>
                    <h2>No projects yet</h2>
                    <p>Create your first project.</p>
                    <button
                        class="button primary"
                        onclick="openProjectModal()">
                        + New project
                    </button>
                </div>
            `;

        }


        if (myList) {

            myList.innerHTML = `
                <div class="empty-card">
                    <div class="empty-icon">✓</div>
                    <h2>No projects yet</h2>
                    <p>Your projects will appear here.</p>
                </div>
            `;

        }


        if (overview) {

            overview.innerHTML = `
                <div class="empty-card">
                    <div class="empty-icon">◫</div>
                    <h2>No projects</h2>
                    <p>Create a project to begin monitoring.</p>
                </div>
            `;

        }


        updateProjectStats([]);

        return;

    }


    if (list) {

        list.innerHTML =
            projects.map(
                projectRow
            ).join("");

    }


    if (myList) {

        const mine =
            projects.filter(
                project =>
                    project.owner_id ===
                    currentUser.id
            );


        myList.innerHTML =
            mine.length
                ? mine.map(projectCard).join("")
                : `
                    <div class="empty-card">
                        <div class="empty-icon">✓</div>
                        <h2>No projects assigned</h2>
                        <p>You don't have any projects yet.</p>
                    </div>
                `;

    }


    if (overview) {

        overview.innerHTML =
            projects
                .slice(0, 5)
                .map(
                    projectDeadline
                )
                .join("");

    }


    updateProjectStats(projects);

}


/* =========================================================
   PROJECT ROW
========================================================= */

function projectRow(project) {

    const progress =
        Number(
            project.progress || 0
        );


    return `
        <div class="project-row">

            <div>
                <strong>
                    ${escapeHTML(project.name)}
                </strong>

                <small>
                    ${escapeHTML(project.project_code || "")}
                </small>
            </div>

            <div>
                ${escapeHTML(project.location || "—")}
            </div>

            <div>
                <span class="status ${statusClass(project.status)}">
                    ${escapeHTML(project.status)}
                </span>
            </div>

            <div>

                <div class="progress">
                    <div style="width:${progress}%"></div>
                </div>

                <small>
                    ${progress}%
                </small>

            </div>

            <div>
                <button
                    onclick="deleteProject('${project.id}')">
                    Delete
                </button>
            </div>

        </div>
    `;

}


/* =========================================================
   PROJECT CARD
========================================================= */

function projectCard(project) {

    return `
        <div class="panel" style="margin-bottom:15px">

            <div class="panel-header">

                <div>
                    <div class="eyebrow">
                        ${escapeHTML(project.project_code || "PROJECT")}
                    </div>

                    <h2>
                        ${escapeHTML(project.name)}
                    </h2>

                    <p>
                        ${escapeHTML(project.location || "No location")}
                    </p>
                </div>

                <span class="status ${statusClass(project.status)}">
                    ${escapeHTML(project.status)}
                </span>

            </div>

            <div class="progress">
                <div style="width:${Number(project.progress || 0)}%"></div>
            </div>

            <p>
                Progress:
                <strong>
                    ${Number(project.progress || 0)}%
                </strong>
            </p>

        </div>
    `;

}


/* =========================================================
   OVERVIEW PROJECT
========================================================= */

function projectDeadline(project) {

    return `
        <div class="deadline">

            <div class="deadline-date">

                <strong>
                    ${project.target_date
                        ? new Date(project.target_date).getDate()
                        : "—"}
                </strong>

                <span>
                    ${project.target_date
                        ? new Date(project.target_date)
                            .toLocaleDateString(
                                "en-US",
                                {month:"short"}
                            )
                            .toUpperCase()
                        : ""}
                </span>

            </div>

            <div class="deadline-info">

                <strong>
                    ${escapeHTML(project.name)}
                </strong>

                <span>
                    ${escapeHTML(project.location || "No location")}
                </span>

            </div>

            <span class="status ${statusClass(project.status)}">
                ${escapeHTML(project.status)}
            </span>

        </div>
    `;

}


/* =========================================================
   PROJECT STATS
========================================================= */

function updateProjectStats(projects) {

    const active =
        projects.filter(
            p =>
                p.status !== "Completed"
        ).length;


    const review =
        projects.filter(
            p =>
                p.status === "For Review"
        ).length;


    const completed =
        projects.filter(
            p =>
                p.status === "Completed"
        ).length;


    const total =
        projects.length;


    const progress =
        total
            ? Math.round(
                projects.reduce(
                    (sum, p) =>
                        sum +
                        Number(p.progress || 0),
                    0
                ) / total
            )
            : 0;


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
        "workspaceProgress",
        progress + "%"
    );


    setText(
        "projectBadge",
        total
    );

}


/* =========================================================
   DELETE PROJECT
========================================================= */

async function deleteProject(id) {

    if (
        !confirm(
            "Delete this project?"
        )
    ) return;


    const {
        error
    } = await db
        .from("projects")
        .delete()
        .eq(
            "id",
            id
        );


    if (error) {

        alert(
            "Could not delete project:\n\n" +
            error.message
        );

        return;

    }


    await refreshAll();

}


/* =========================================================
   DOCUMENTS
========================================================= */

async function loadDocuments() {

    if (!currentUser) return;


    const {
        data,
        error
    } = await db
        .from("documents")
        .select("*")
        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(
            "Document error:",
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


    if (library) {

        library.innerHTML =
            documents.length
                ? documents.map(
                    libraryItem
                ).join("")
                : `
                    <div class="empty-card">
                        <div class="empty-icon">D</div>
                        <h2>No documents</h2>
                        <p>Upload your first document.</p>
                    </div>
                `;

    }


    setText(
        "documentsCount",
        documents.length
    );


    renderCategory(
        documents,
        "Department Order",
        "ordersDocuments"
    );


    renderCategory(
        documents,
        "Standard / Template",
        "standardsDocuments"
    );


    renderCategory(
        documents,
        "Form",
        "formsDocuments"
    );


    const recent =
        document.getElementById(
            "recentFiles"
        );


    if (recent) {

        recent.innerHTML =
            documents
                .slice(0, 5)
                .map(
                    recentFile
                )
                .join("");

    }

}


/* =========================================================
   CATEGORY DOCUMENTS
========================================================= */

function renderCategory(
    documents,
    category,
    elementId
) {

    const container =
        document.getElementById(
            elementId
        );


    if (!container) return;


    const filtered =
        documents.filter(
            doc =>
                doc.project_name ===
                category
        );


    container.innerHTML =
        filtered.length
            ? filtered.map(
                documentCard
            ).join("")
            : `
                <div class="empty-card">
                    <div class="empty-icon">D</div>
                    <h2>No documents</h2>
                    <p>
                        Upload a document to this category.
                    </p>
                </div>
            `;

}


/* =========================================================
   DOCUMENT CARD
========================================================= */

function documentCard(document) {

    return `
        <div class="document-card">

            <div class="document-icon">
                ${fileExtension(document.file_name)}
            </div>

            <h3>
                ${escapeHTML(document.title)}
            </h3>

            <p>
                ${escapeHTML(document.file_name)}
            </p>

            <span>
                ${formatBytes(document.size_bytes)}
            </span>

            <br><br>

            <button
                class="button secondary"
                onclick="openDocument('${document.id}')">
                Open
            </button>

            <button
                class="button secondary"
                onclick="deleteDocument('${document.id}')">
                Delete
            </button>

        </div>
    `;

}


/* =========================================================
   LIBRARY ITEM
========================================================= */

function libraryItem(document) {

    const type =
        fileExtension(
            document.file_name
        );


    return `
        <div
            class="library-item"
            data-type="${type}"
        >

            <div class="library-icon">
                ${type}
            </div>

            <div>

                <strong>
                    ${escapeHTML(document.title)}
                </strong>

                <span>
                    ${escapeHTML(document.file_name)}
                    ·
                    ${formatBytes(document.size_bytes)}
                </span>

            </div>

            <button
                onclick="openDocument('${document.id}')">
                Open
            </button>

            <button
                onclick="deleteDocument('${document.id}')">
                Delete
            </button>

        </div>
    `;

}


/* =========================================================
   RECENT FILE
========================================================= */

function recentFile(document) {

    return `
        <div class="file-row">

            <div class="file-icon">
                ${fileExtension(document.file_name)}
            </div>

            <div class="file-info">

                <strong>
                    ${escapeHTML(document.title)}
                </strong>

                <span>
                    ${formatBytes(document.size_bytes)}
                </span>

            </div>

            <span class="file-tag">
                ${fileExtension(document.file_name)}
            </span>

            <button
                class="download"
                onclick="openDocument('${document.id}')">
                ↗
            </button>

        </div>
    `;

}


/* =========================================================
   OPEN DOCUMENT
========================================================= */

async function openDocument(id) {

    const {
        data: document,
        error
    } = await db
        .from("documents")
        .select("*")
        .eq(
            "id",
            id
        )
        .single();


    if (error) {

        alert(
            "Could not find document."
        );

        return;
    }


    /*
       Private bucket:
       create temporary signed URL.
    */

    const {
        data,
        error: storageError
    } = await db
        .storage
        .from("documents")
        .createSignedUrl(
            document.file_path,
            3600
        );


    if (storageError) {

        alert(
            "Could not open document:\n\n" +
            storageError.message
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

async function deleteDocument(id) {

    if (
        !confirm(
            "Delete this document?"
        )
    ) return;


    const {
        data: document,
        error
    } = await db
        .from("documents")
        .select(
            "file_path"
        )
        .eq(
            "id",
            id
        )
        .single();


    if (error) {

        alert(
            error.message
        );

        return;
    }


    const {
        error: storageError
    } = await db
        .storage
        .from("documents")
        .remove([
            document.file_path
        ]);


    if (storageError) {

        alert(
            "Could not delete file:\n\n" +
            storageError.message
        );

        return;
    }


    const {
        error: databaseError
    } = await db
        .from("documents")
        .delete()
        .eq(
            "id",
            id
        );


    if (databaseError) {

        alert(
            databaseError.message
        );

        return;
    }


    await refreshAll();

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
        searchInput.value
            .toLowerCase()
            .trim();


    const type =
        typeFilter.value;


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
            text.includes(search);


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
   TEAM
========================================================= */

async function loadTeam() {

    const {
        data,
        error
    } = await db
        .from("profiles")
        .select("*")
        .order(
            "full_name"
        );


    if (error) {

        console.error(
            "Team error:",
            error
        );

        return;
    }


    const container =
        document.getElementById(
            "teamList"
        );


    if (!container) return;


    container.innerHTML =
        (data || [])
            .map(
                teamMember
            )
            .join("");

}


function teamMember(member) {

    const name =
        member.full_name ||
        "User";


    return `
        <div class="team-card">

            <div class="team-avatar">
                ${getInitials(name)}
            </div>

            <h3>
                ${escapeHTML(name)}
            </h3>

            <p>
                ${escapeHTML(member.position || "Member")}
            </p>

        </div>
    `;

}


/* =========================================================
   REFRESH EVERYTHING
========================================================= */

async function refreshAll() {

    await Promise.all([

        loadProjects(),

        loadDocuments(),

        loadTeam()

    ]);

}


/* =========================================================
   HELPERS
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


function escapeHTML(value) {

    return String(
        value ?? ""
    )
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


function statusClass(status) {

    switch (status) {

        case "Completed":
            return "completed";

        case "For Review":
            return "review";

        case "Ongoing":
            return "ongoing";

        case "Suspended":
            return "urgent";

        default:
            return "upcoming";

    }

}


function fileExtension(filename) {

    const ext =
        filename
            .split(".")
            .pop()
            .toUpperCase();


    if (ext === "XLS")
        return "XLSX";

    if (ext === "DOC")
        return "DOCX";

    return ext;

}


function formatBytes(bytes) {

    if (!bytes)
        return "0 KB";


    const units =
        [
            "Bytes",
            "KB",
            "MB",
            "GB"
        ];


    const index =
        Math.floor(
            Math.log(bytes) /
            Math.log(1024)
        );


    return (
        parseFloat(
            (
                bytes /
                Math.pow(
                    1024,
                    index
                )
            ).toFixed(1)
        ) +
        " " +
        units[index]
    );

}


/* =========================================================
   SIDEBAR LINKS
========================================================= */

document
    .querySelectorAll(".nav-item")
    .forEach(item => {

        item.addEventListener(
            "click",
            function (event) {

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
   ESC CLOSE MODAL
========================================================= */

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape" &&
            modal.classList.contains("open")
        ) {

            closeModal();

        }

    }
);


/* =========================================================
   AUTH EVENTS
========================================================= */

document
    .getElementById("loginForm")
    .addEventListener(
        "submit",
        loginUser
    );


document
    .getElementById("registerForm")
    .addEventListener(
        "submit",
        registerUser
    );


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        const {
            data: {
                session
            }
        } =
            await db.auth.getSession();


        if (session) {

            await loadApplication();

        } else {

            document
                .getElementById(
                    "authScreen"
                )
                .style.display = "flex";


            document
                .getElementById(
                    "app"
                )
                .style.display = "none";

        }

    }
);


/* =========================================================
   AUTH STATE LISTENER
========================================================= */

db.auth.onAuthStateChange(
    async (event, session) => {

        if (
            event === "SIGNED_IN" &&
            session
        ) {

            currentUser =
                session.user;

        }


        if (
            event === "SIGNED_OUT"
        ) {

            currentUser = null;
            currentProfile = null;

        }

    }
);
