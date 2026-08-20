/* =========================================================
   PDS HUB — SUPABASE VERSION
   GitHub Pages + Supabase
   ========================================================= */

/* =========================================================
   SUPABASE CONFIGURATION
   ========================================================= */

const SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);


/* =========================================================
   GLOBAL VARIABLES
   ========================================================= */

let currentUser = null;
let currentProfile = null;


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    showPage("overview");

    await checkUser();

    setupNavigation();
    setupSearch();
    setupKeyboardShortcuts();

});


/* =========================================================
   AUTHENTICATION
   ========================================================= */

async function checkUser() {

    const {
        data: { user },
        error
    } = await supabaseClient.auth.getUser();

    if (error) {
        console.error("Auth error:", error);
        return;
    }

    currentUser = user;

    if (!currentUser) {

        console.log("No user logged in.");

        showLoginState();

        return;
    }

    console.log("Logged in:", currentUser.email);

    await loadProfile();
    await loadDashboard();
    await loadProjects();
    await loadDocuments();

}


/* =========================================================
   LOAD PROFILE
   ========================================================= */

async function loadProfile() {

    if (!currentUser) return;

    const { data, error } = await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .maybeSingle();

    if (error) {

        console.error("Profile error:", error);

        return;
    }

    currentProfile = data;

    updateProfileUI();

}


/* =========================================================
   UPDATE PROFILE UI
   ========================================================= */

function updateProfileUI() {

    if (!currentUser) return;

    const name =
        currentProfile?.full_name ||
        currentUser.email?.split("@")[0] ||
        "User";

    const initials =
        name
            .split(" ")
            .map(word => word.charAt(0))
            .join("")
            .substring(0, 2)
            .toUpperCase();

    document.querySelectorAll(".profile-name").forEach(el => {
        el.textContent = name;
    });

    document.querySelectorAll(".profile-email").forEach(el => {
        el.textContent = currentUser.email || "";
    });

    document.querySelectorAll(".avatar").forEach(el => {
        el.textContent = initials;
    });

    document.querySelectorAll(".top-avatar").forEach(el => {
        el.textContent = initials;
    });

}


/* =========================================================
   DASHBOARD
   ========================================================= */

async function loadDashboard() {

    if (!currentUser) return;

    const { data: projects, error } = await supabaseClient
        .from("projects")
        .select("*")
        .eq("owner_id", currentUser.id);

    if (error) {

        console.error("Projects error:", error);

        return;
    }

    const { data: documents, error: documentError } =
        await supabaseClient
            .from("documents")
            .select("*")
            .eq("owner_id", currentUser.id);

    if (documentError) {

        console.error("Documents error:", documentError);

        return;
    }

    const totalProjects = projects?.length || 0;
    const totalDocuments = documents?.length || 0;

    const ongoing =
        projects?.filter(p =>
            ["Ongoing", "In Progress"].includes(p.status)
        ).length || 0;

    const completed =
        projects?.filter(p =>
            p.status === "Completed"
        ).length || 0;

    updateStat("totalProjects", totalProjects);
    updateStat("totalDocuments", totalDocuments);
    updateStat("ongoingProjects", ongoing);
    updateStat("completedProjects", completed);

}


/* =========================================================
   UPDATE STAT
   ========================================================= */

function updateStat(id, value) {

    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }

}


/* =========================================================
   PROJECTS
   ========================================================= */

async function loadProjects() {

    if (!currentUser) return;

    const { data, error } = await supabaseClient
        .from("projects")
        .select("*")
        .eq("owner_id", currentUser.id)
        .order("created_at", { ascending: false });

    if (error) {

        console.error("Project loading error:", error);

        return;
    }

    renderProjects(data || []);

}


/* =========================================================
   RENDER PROJECTS
   ========================================================= */

function renderProjects(projects) {

    const container =
        document.getElementById("projectList");

    if (!container) return;

    if (!projects.length) {

        container.innerHTML = `
            <div class="empty-card">
                <div class="empty-icon">+</div>

                <h2>No projects yet</h2>

                <p>
                    Create your first project to start monitoring.
                </p>

                <button
                    class="button primary"
                    onclick="openProjectModal()">
                    + New Project
                </button>
            </div>
        `;

        return;
    }

    container.innerHTML = projects.map(project => {

        const progress =
            getProjectProgress(project.status);

        return `
            <div class="project-row">

                <div>
                    <strong>${escapeHTML(project.name)}</strong>
                    <small>
                        ${escapeHTML(project.project_code || "")}
                    </small>
                </div>

                <div>
                    ${escapeHTML(project.location || "—")}
                </div>

                <div>
                    <span class="status ${getStatusClass(project.status)}">
                        ${escapeHTML(project.status)}
                    </span>
                </div>

                <div>
                    <div class="progress">
                        <div style="width:${progress}%"></div>
                    </div>
                </div>

                <div>
                    <button onclick="viewProject('${project.id}')">
                        View
                    </button>
                </div>

            </div>
        `;

    }).join("");

}


/* =========================================================
   PROJECT PROGRESS
   ========================================================= */

function getProjectProgress(status) {

    switch (status) {

        case "Planning":
            return 10;

        case "Ongoing":
            return 50;

        case "In Progress":
            return 50;

        case "Completed":
            return 100;

        case "On Hold":
            return 25;

        default:
            return 0;

    }

}


/* =========================================================
   STATUS CLASS
   ========================================================= */

function getStatusClass(status) {

    switch (status) {

        case "Completed":
            return "completed";

        case "Ongoing":
        case "In Progress":
            return "ongoing";

        case "On Hold":
            return "review";

        case "Planning":
            return "upcoming";

        default:
            return "";

    }

}


/* =========================================================
   CREATE PROJECT
   ========================================================= */

async function createProject(event) {

    event.preventDefault();

    if (!currentUser) {

        alert("Please sign in first.");

        return;
    }

    const name =
        document.getElementById("projectName")?.value.trim();

    const code =
        document.getElementById("projectCode")?.value.trim();

    const location =
        document.getElementById("projectLocation")?.value.trim();

    const status =
        document.getElementById("projectStatus")?.value ||
        "Planning";

    const targetDate =
        document.getElementById("projectTargetDate")?.value ||
        null;

    const notes =
        document.getElementById("projectNotes")?.value.trim();

    if (!name) {

        alert("Please enter a project name.");

        return;
    }

    const { data, error } = await supabaseClient
        .from("projects")
        .insert({

            owner_id: currentUser.id,

            project_code: code || null,

            name: name,

            location: location || null,

            status: status,

            target_date: targetDate,

            notes: notes || null

        })
        .select()
        .single();

    if (error) {

        console.error(error);

        alert(
            "Unable to create project.\n\n" +
            error.message
        );

        return;
    }

    alert("Project created successfully.");

    closeModal();

    await loadProjects();
    await loadDashboard();

}


/* =========================================================
   DOCUMENTS
   ========================================================= */

async function loadDocuments() {

    if (!currentUser) return;

    const { data, error } = await supabaseClient
        .from("documents")
        .select("*")
        .eq("owner_id", currentUser.id)
        .order("created_at", { ascending: false });

    if (error) {

        console.error("Documents error:", error);

        return;
    }

    renderDocuments(data || []);

}


/* =========================================================
   RENDER DOCUMENTS
   ========================================================= */

function renderDocuments(documents) {

    const container =
        document.getElementById("documentList");

    if (!container) return;

    if (!documents.length) {

        container.innerHTML = `
            <div class="empty-card">

                <div class="empty-icon">
                    📁
                </div>

                <h2>No documents yet</h2>

                <p>
                    Upload project documents to your library.
                </p>

                <button
                    class="button primary"
                    onclick="openUploadModal()">
                    Upload Document
                </button>

            </div>
        `;

        return;
    }

    container.innerHTML = documents.map(document => {

        const type =
            getFileType(document.file_name);

        return `
            <div class="library-item"
                 data-type="${type}">

                <div class="library-icon">
                    ${type.toUpperCase()}
                </div>

                <div>

                    <strong>
                        ${escapeHTML(document.title)}
                    </strong>

                    <span>
                        ${escapeHTML(document.file_name)}
                    </span>

                </div>

                <button
                    onclick="openDocument('${document.file_path}')">
                    Open
                </button>

            </div>
        `;

    }).join("");

}


/* =========================================================
   FILE TYPE
   ========================================================= */

function getFileType(filename) {

    if (!filename) return "other";

    const extension =
        filename.split(".").pop().toLowerCase();

    if (extension === "pdf")
        return "pdf";

    if (
        extension === "xlsx" ||
        extension === "xls" ||
        extension === "csv"
    )
        return "excel";

    if (
        extension === "doc" ||
        extension === "docx"
    )
        return "word";

    return "other";

}


/* =========================================================
   OPEN DOCUMENT
   ========================================================= */

async function openDocument(path) {

    if (!path) {

        alert("File path is missing.");

        return;
    }

    const { data, error } =
        await supabaseClient.storage
            .from("documents")
            .createSignedUrl(path, 3600);

    if (error) {

        console.error(error);

        alert(
            "Unable to open document.\n\n" +
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
   UPLOAD DOCUMENT
   ========================================================= */

async function uploadDocument(event) {

    event.preventDefault();

    if (!currentUser) {

        alert("Please sign in first.");

        return;
    }

    const file =
        document.getElementById("documentFile")?.files[0];

    const title =
        document.getElementById("documentTitle")?.value.trim();

    const projectName =
        document.getElementById("documentProject")?.value.trim();

    if (!file) {

        alert("Please select a file.");

        return;
    }

    if (!title) {

        alert("Please enter a document title.");

        return;
    }

    const safeName =
        file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

    const filePath =
        `${currentUser.id}/${Date.now()}_${safeName}`;

    const { error: uploadError } =
        await supabaseClient.storage
            .from("documents")
            .upload(filePath, file);

    if (uploadError) {

        console.error(uploadError);

        alert(
            "Upload failed.\n\n" +
            uploadError.message
        );

        return;
    }

    const { error: databaseError } =
        await supabaseClient
            .from("documents")
            .insert({

                owner_id: currentUser.id,

                title: title,

                project_name:
                    projectName || null,

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

        console.error(databaseError);

        alert(
            "File uploaded, but database record failed.\n\n" +
            databaseError.message
        );

        return;
    }

    alert("Document uploaded successfully.");

    closeModal();

    await loadDocuments();
    await loadDashboard();

}


/* =========================================================
   VIEW PROJECT
   ========================================================= */

async function viewProject(id) {

    const { data, error } =
        await supabaseClient
            .from("projects")
            .select("*")
            .eq("id", id)
            .single();

    if (error) {

        alert(error.message);

        return;
    }

    alert(
        "PROJECT\n\n" +

        "Name: " +
        data.name +

        "\nCode: " +
        (data.project_code || "—") +

        "\nLocation: " +
        (data.location || "—") +

        "\nStatus: " +
        data.status +

        "\nTarget Date: " +
        (data.target_date || "—") +

        "\n\nNotes:\n" +
        (data.notes || "—")
    );

}


/* =========================================================
   DELETE PROJECT
   ========================================================= */

async function deleteProject(id) {

    if (!confirm(
        "Are you sure you want to delete this project?"
    )) {
        return;
    }

    const { error } =
        await supabaseClient
            .from("projects")
            .delete()
            .eq("id", id);

    if (error) {

        alert(error.message);

        return;
    }

    await loadProjects();
    await loadDashboard();

}


/* =========================================================
   PAGE NAVIGATION
   ========================================================= */

function showPage(pageId) {

    document.querySelectorAll(".page")
        .forEach(page => {

            page.classList.remove("active-page");

        });

    const page =
        document.getElementById(pageId);

    if (page) {

        page.classList.add("active-page");

    }

    document.querySelectorAll(".nav-item")
        .forEach(item => {

            item.classList.toggle(
                "active",
                item.dataset.page === pageId
            );

        });

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNavigation() {

    document.querySelectorAll(".nav-item")
        .forEach(item => {

            item.addEventListener("click", event => {

                event.preventDefault();

                const page =
                    item.dataset.page;

                if (page) {

                    showPage(page);

                }

            });

        });

}


/* =========================================================
   SEARCH
   ========================================================= */

function setupSearch() {

    const search =
        document.getElementById("globalSearch");

    if (!search) return;

    search.addEventListener("input", function () {

        const value =
            this.value.toLowerCase().trim();

        if (!value) return;

        document.querySelectorAll(".page")
            .forEach(page => {

                if (
                    page.innerText
                        .toLowerCase()
                        .includes(value)
                ) {

                    showPage(page.id);

                }

            });

    });

}


/* =========================================================
   CTRL + K
   ========================================================= */

function setupKeyboardShortcuts() {

    document.addEventListener("keydown", event => {

        if (
            (event.ctrlKey || event.metaKey) &&
            event.key.toLowerCase() === "k"
        ) {

            event.preventDefault();

            focusSearch();

        }

        if (event.key === "Escape") {

            closeModal();

        }

    });

}


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

function openModal(
    title,
    description,
    inputPlaceholder
) {

    const modal =
        document.getElementById("modal");

    if (!modal) return;

    const titleElement =
        document.getElementById("modalTitle");

    const descriptionElement =
        document.getElementById("modalDescription");

    const input =
        document.getElementById("modalInput");

    if (titleElement)
        titleElement.textContent = title;

    if (descriptionElement)
        descriptionElement.textContent = description;

    if (input) {

        input.placeholder =
            inputPlaceholder || "";

        input.focus();

    }

    modal.classList.add("open");

}


/* =========================================================
   CLOSE MODAL
   ========================================================= */

function closeModal() {

    const modal =
        document.getElementById("modal");

    if (modal) {

        modal.classList.remove("open");

    }

    const form =
        document.getElementById("modalForm");

    if (form) {

        form.reset();

    }

}


/* =========================================================
   MODAL ACTIONS
   ========================================================= */

function openUpdateModal() {

    openModal(
        "New Update",
        "Add an update to your PDS Hub workspace.",
        "Update title"
    );

}


function openProjectModal() {

    openModal(
        "New Project",
        "Create a new project for monitoring.",
        "Project name"
    );

}


function openUploadModal() {

    openModal(
        "Upload Document",
        "Add a document to your PDS Hub library.",
        "Document name"
    );

}


/* =========================================================
   LIBRARY FILTER
   ========================================================= */

function filterLibrary() {

    const searchInput =
        document.getElementById("librarySearch");

    const typeFilter =
        document.getElementById("fileTypeFilter");

    const search =
        searchInput
            ? searchInput.value.toLowerCase().trim()
            : "";

    const type =
        typeFilter
            ? typeFilter.value
            : "all";

    document.querySelectorAll(".library-item")
        .forEach(item => {

            const text =
                item.innerText.toLowerCase();

            const itemType =
                item.dataset.type;

            const matchesSearch =
                text.includes(search);

            const matchesType =
                type === "all" ||
                itemType === type;

            item.style.display =
                matchesSearch && matchesType
                    ? "flex"
                    : "none";

        });

}


/* =========================================================
   LOGIN STATE
   ========================================================= */

function showLoginState() {

    console.log(
        "PDS Hub requires authentication."
    );

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {

    if (value === null || value === undefined)
        return "";

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}
