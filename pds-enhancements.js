/* =========================================================
   PDS ENHANCEMENTS
   Planning & Design Section
   ========================================================= */

(function () {
    "use strict";

    /* =====================================================
       CONFIGURATION
       ===================================================== */

    const PDS_CONFIG = {

        /* PUT YOUR ONE DRIVE MONITORING LINK HERE */
        oneDriveMonitoring:
            "YOUR_ONEDRIVE_MONITORING_LINK_HERE",

        /* Optional OneDrive links */
        oneDrivePlans:
            "YOUR_ONEDRIVE_PLANS_LINK_HERE",

        oneDrivePOW:
            "YOUR_ONEDRIVE_POW_LINK_HERE",

        oneDriveReports:
            "YOUR_ONEDRIVE_REPORTS_LINK_HERE",

        oneDrivePhotos:
            "YOUR_ONEDRIVE_PHOTOS_LINK_HERE"

    };


    /* =====================================================
       GLOBAL STATE
       ===================================================== */

    let enhancementProjects = [];
    let enhancementDocuments = [];


    /* =====================================================
       BRANDING
       CHANGE PDS HUB → PDS
       ===================================================== */

    function replaceBranding() {

        document.title =
            "PDS — Planning & Design Section";

        const replaceText = function (root) {

            const walker =
                document.createTreeWalker(
                    root,
                    NodeFilter.SHOW_TEXT
                );

            const nodes = [];

            let node;

            while (
                node = walker.nextNode()
            ) {
                nodes.push(node);
            }

            nodes.forEach(function (textNode) {

                if (
                    textNode.nodeValue &&
                    textNode.nodeValue.includes(
                        "PDS Hub"
                    )
                ) {

                    textNode.nodeValue =
                        textNode.nodeValue
                            .replace(
                                /PDS Hub/g,
                                "PDS"
                            );

                }

            });

        };

        replaceText(document.body);

        /*
           Also replace HTML attributes
           such as title and aria-label.
        */

        document
            .querySelectorAll(
                "[title], [aria-label], input[placeholder]"
            )
            .forEach(function (element) {

                [
                    "title",
                    "aria-label",
                    "placeholder"
                ].forEach(function (attribute) {

                    const value =
                        element.getAttribute(
                            attribute
                        );

                    if (
                        value &&
                        value.includes("PDS Hub")
                    ) {

                        element.setAttribute(
                            attribute,
                            value.replace(
                                /PDS Hub/g,
                                "PDS"
                            )
                        );

                    }

                });

            });

    }


    /* =====================================================
       BRANDING OBSERVER
       Handles dynamically-created Supabase content.
       ===================================================== */

    function setupBrandingObserver() {

        const observer =
            new MutationObserver(function () {

                replaceBranding();

            });

        observer.observe(
            document.body,
            {
                childList: true,
                subtree: true
            }
        );

    }


    /* =====================================================
       ADD NEW NAVIGATION
       ===================================================== */

    function addEnhancedNavigation() {

        const navigation =
            document.querySelector(
                ".navigation"
            );

        if (!navigation) {
            return;
        }

        if (
            document.getElementById(
                "managementNav"
            )
        ) {
            return;
        }


        /*
           Management Summary
        */

        const management =
            document.createElement("a");

        management.href = "#";

        management.className =
            "nav-item";

        management.dataset.page =
            "management";

        management.id =
            "managementNav";

        management.innerHTML = `
            <span>▦</span>
            <span>Management Summary</span>
        `;

        navigation.appendChild(
            management
        );


        /*
           OneDrive
        */

        const monitoring =
            document.createElement("a");

        monitoring.href =
            PDS_CONFIG.oneDriveMonitoring;

        monitoring.target =
            "_blank";

        monitoring.rel =
            "noopener noreferrer";

        monitoring.className =
            "nav-item";

        monitoring.innerHTML = `
            <span>☁</span>
            <span>OneDrive Monitoring</span>
        `;

        navigation.appendChild(
            monitoring
        );


        /*
           Updates
        */

        const updates =
            document.createElement("a");

        updates.href = "#";

        updates.className =
            "nav-item";

        updates.dataset.page =
            "updates";

        updates.id =
            "updatesNav";

        updates.innerHTML = `
            <span>●</span>
            <span>Updates</span>
            <span
                id="updatesBadge"
                class="badge"
            >
                0
            </span>
        `;

        navigation.insertBefore(
            updates,
            management
        );


        /*
           Event listeners
        */

        management.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                showPage(
                    "management"
                );

            }
        );


        updates.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                showPage(
                    "updates"
                );

            }
        );

    }


    /* =====================================================
       CREATE MANAGEMENT PAGE
       ===================================================== */

    function createManagementPage() {

        if (
            document.getElementById(
                "management"
            )
        ) {
            return;
        }

        const content =
            document.querySelector(
                ".content"
            );

        if (!content) {
            return;
        }


        const page =
            document.createElement("section");

        page.id =
            "management";

        page.className =
            "page";


        page.innerHTML = `

            <div class="page-title">

                <div>

                    <div class="eyebrow">
                        MANAGEMENT VIEW
                    </div>

                    <h1>
                        Management Summary
                    </h1>

                    <p>
                        Consolidated overview of
                        Planning & Design activities.
                    </p>

                </div>

                <button
                    class="button primary"
                    onclick="refreshPDSManagement()"
                >
                    ↻ Refresh
                </button>

            </div>


            <!-- MANAGEMENT CARDS -->

            <div class="management-grid">

                <div class="management-card">

                    <div class="management-icon">
                        P
                    </div>

                    <div>
                        <span>
                            TOTAL PROJECTS
                        </span>

                        <strong
                            id="managementTotalProjects"
                        >
                            0
                        </strong>
                    </div>

                </div>


                <div class="management-card">

                    <div class="management-icon">
                        ↗
                    </div>

                    <div>
                        <span>
                            ONGOING
                        </span>

                        <strong
                            id="managementOngoing"
                        >
                            0
                        </strong>
                    </div>

                </div>


                <div class="management-card">

                    <div class="management-icon">
                        ✓
                    </div>

                    <div>
                        <span>
                            COMPLETED
                        </span>

                        <strong
                            id="managementCompleted"
                        >
                            0
                        </strong>
                    </div>

                </div>


                <div class="management-card">

                    <div class="management-icon">
                        !
                    </div>

                    <div>
                        <span>
                            FOR REVIEW
                        </span>

                        <strong
                            id="managementReview"
                        >
                            0
                        </strong>
                    </div>

                </div>


                <div class="management-card">

                    <div class="management-icon">
                        D
                    </div>

                    <div>
                        <span>
                            DOCUMENTS
                        </span>

                        <strong
                            id="managementDocuments"
                        >
                            0
                        </strong>
                    </div>

                </div>


                <div class="management-card">

                    <div class="management-icon">
                        %
                    </div>

                    <div>
                        <span>
                            AVERAGE PROGRESS
                        </span>

                        <strong
                            id="managementProgress"
                        >
                            0%
                        </strong>
                    </div>

                </div>

            </div>


            <!-- PROJECT STATUS -->

            <div class="management-panel">

                <div class="management-panel-header">

                    <div>

                        <div class="eyebrow">
                            PROJECT STATUS
                        </div>

                        <h2>
                            Current Projects
                        </h2>

                    </div>

                    <button
                        class="small-button"
                        onclick="showPage('projects')"
                    >
                        Open Project Monitoring →
                    </button>

                </div>

                <div
                    id="managementProjectTable"
                    class="management-project-table"
                >
                    <div class="management-empty">
                        No project data available.
                    </div>
                </div>

            </div>


            <!-- ONEDRIVE -->

            <div class="management-panel">

                <div class="management-panel-header">

                    <div>

                        <div class="eyebrow">
                            CENTRAL FILE STORAGE
                        </div>

                        <h2>
                            OneDrive Monitoring
                        </h2>

                    </div>

                    <a
                        href="${PDS_CONFIG.oneDriveMonitoring}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="button primary"
                    >
                        Open OneDrive ↗
                    </a>

                </div>


                <div class="onedrive-grid">

                    <a
                        href="${PDS_CONFIG.oneDriveMonitoring}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="onedrive-card"
                    >
                        <strong>
                            📊 Project Monitoring
                        </strong>

                        <span>
                            Master monitoring files
                        </span>
                    </a>


                    <a
                        href="${PDS_CONFIG.oneDrivePlans}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="onedrive-card"
                    >
                        <strong>
                            📐 Plans & Drawings
                        </strong>

                        <span>
                            Plans and design files
                        </span>
                    </a>


                    <a
                        href="${PDS_CONFIG.oneDrivePOW}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="onedrive-card"
                    >
                        <strong>
                            📋 POW / ABC
                        </strong>

                        <span>
                            Program of Work and estimates
                        </span>
                    </a>


                    <a
                        href="${PDS_CONFIG.oneDriveReports}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="onedrive-card"
                    >
                        <strong>
                            📄 Reports
                        </strong>

                        <span>
                            Reports and submissions
                        </span>
                    </a>


                    <a
                        href="${PDS_CONFIG.oneDrivePhotos}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="onedrive-card"
                    >
                        <strong>
                            📷 Project Photos
                        </strong>

                        <span>
                            Progress photographs
                        </span>
                    </a>

                </div>

            </div>

        `;

        content.appendChild(
            page
        );

    }


    /* =====================================================
       CREATE UPDATES PAGE
       ===================================================== */

    function createUpdatesPage() {

        if (
            document.getElementById(
                "updates"
            )
        ) {
            return;
        }

        const content =
            document.querySelector(
                ".content"
            );

        if (!content) {
            return;
        }


        const page =
            document.createElement("section");

        page.id =
            "updates";

        page.className =
            "page";


        page.innerHTML = `

            <div class="page-title">

                <div>

                    <div class="eyebrow">
                        PDS NOTIFICATIONS
                    </div>

                    <h1>
                        Updates
                    </h1>

                    <p>
                        Latest documents, project
                        activity and section updates.
                    </p>

                </div>

                <button
                    class="button secondary"
                    onclick="showPage('content')"
                >
                    Open Document Library →
                </button>

            </div>


            <div
                id="updatesList"
                class="updates-list"
            ></div>

        `;

        content.appendChild(
            page
        );

    }


    /* =====================================================
       ADD UPDATES TO OVERVIEW
       ===================================================== */

    function addOverviewUpdates() {

        const overview =
            document.getElementById(
                "overview"
            );

        if (!overview) {
            return;
        }

        if (
            document.getElementById(
                "overviewUpdates"
            )
        ) {
            return;
        }


        const panel =
            document.createElement("div");

        panel.id =
            "overviewUpdates";

        panel.className =
            "overview-updates";


        panel.innerHTML = `

            <div class="section-heading">

                <div>

                    <div class="eyebrow">
                        LATEST ACTIVITY
                    </div>

                    <h2>
                        New Updates
                    </h2>

                </div>

                <button
                    class="small-button"
                    onclick="showPage('updates')"
                >
                    View all →
                </button>

            </div>


            <div
                id="overviewUpdatesList"
                class="updates-list compact"
            ></div>

        `;


        const announcement =
            overview.querySelector(
                ".announcement"
            );

        if (announcement) {

            announcement.before(
                panel
            );

        } else {

            overview.appendChild(
                panel
            );

        }

    }


    /* =====================================================
       UPDATE DATA
       ===================================================== */

    function buildUpdates() {

        const updates = [];


        /*
           Uploaded documents
        */

        enhancementDocuments
            .slice(0, 10)
            .forEach(function (doc) {

                const category =
                    doc.project_name ||
                    "Document";

                let title =
                    "New document uploaded";

                if (
                    category ===
                    "Department Order"
                ) {
                    title =
                        "New Department Order";
                }

                updates.push({

                    type:
                        category,

                    title:
                        title,

                    description:
                        doc.title ||
                        doc.file_name ||
                        "New document",

                    date:
                        doc.created_at ||
                        null,

                    icon:
                        category ===
                        "Department Order"
                            ? "DO"
                            : "DOC"

                });

            });


        /*
           Project updates
        */

        enhancementProjects
            .slice(0, 10)
            .forEach(function (project) {

                updates.push({

                    type:
                        "Project",

                    title:
                        "Project monitoring updated",

                    description:
                        (
                            project.project_code
                                ? project.project_code +
                                  " — "
                                : ""
                        ) +
                        (
                            project.name ||
                            "Project"
                        ),

                    date:
                        project.updated_at ||
                        project.created_at ||
                        null,

                    icon:
                        "PRJ"

                });

            });


        /*
           Sort newest first
        */

        updates.sort(
            function (a, b) {

                const dateA =
                    new Date(
                        a.date || 0
                    ).getTime();

                const dateB =
                    new Date(
                        b.date || 0
                    ).getTime();

                return dateB - dateA;

            }
        );


        return updates;

    }


    /* =====================================================
       FORMAT DATE
       ===================================================== */

    function formatUpdateDate(
        value
    ) {

        if (!value) {
            return "Recently";
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "Recently";
        }

        return date.toLocaleDateString(
            "en-PH",
            {
                month: "short",
                day: "numeric",
                year: "numeric"
            }
        );

    }


    /* =====================================================
       RENDER UPDATES
       ===================================================== */

    function renderUpdates() {

        const updates =
            buildUpdates();


        const full =
            document.getElementById(
                "updatesList"
            );

        const compact =
            document.getElementById(
                "overviewUpdatesList"
            );


        const html =
            updates.length
                ? updates
                    .slice(0, 12)
                    .map(function (item) {

                        return `

                            <div
                                class="update-card"
                            >

                                <div
                                    class="update-icon"
                                >
                                    ${item.icon}
                                </div>

                                <div
                                    class="update-content"
                                >

                                    <div
                                        class="update-top"
                                    >

                                        <strong>
                                            ${escapeUpdate(
                                                item.title
                                            )}
                                        </strong>

                                        <span>
                                            ${formatUpdateDate(
                                                item.date
                                            )}
                                        </span>

                                    </div>

                                    <p>
                                        ${escapeUpdate(
                                            item.description
                                        )}
                                    </p>

                                    <small>
                                        ${escapeUpdate(
                                            item.type
                                        )}
                                    </small>

                                </div>

                            </div>

                        `;

                    })
                    .join("")
                : `

                    <div
                        class="management-empty"
                    >

                        <div>
                            ✓
                        </div>

                        <strong>
                            No new updates
                        </strong>

                        <p>
                            New documents and project
                            activity will appear here.
                        </p>

                    </div>

                `;


        if (full) {
            full.innerHTML =
                html;
        }

        if (compact) {

            compact.innerHTML =
                updates.length
                    ? updates
                        .slice(0, 5)
                        .map(function (item) {

                            return `

                                <div
                                    class="update-card"
                                >

                                    <div
                                        class="update-icon"
                                    >
                                        ${item.icon}
                                    </div>

                                    <div
                                        class="update-content"
                                    >

                                        <div
                                            class="update-top"
                                        >

                                            <strong>
                                                ${escapeUpdate(
                                                    item.title
                                                )}
                                            </strong>

                                            <span>
                                                ${formatUpdateDate(
                                                    item.date
                                                )}
                                            </span>

                                        </div>

                                        <p>
                                            ${escapeUpdate(
                                                item.description
                                            )}
                                        </p>

                                    </div>

                                </div>

                            `;

                        })
                        .join("")
                    : html;

        }


        const badge =
            document.getElementById(
                "updatesBadge"
            );

        if (badge) {

            badge.textContent =
                Math.min(
                    updates.length,
                    99
                );

        }

    }


    /* =====================================================
       SAFE TEXT
       ===================================================== */

    function escapeUpdate(
        value
    ) {

        return String(
            value || ""
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


    /* =====================================================
       MANAGEMENT SUMMARY
       ===================================================== */

    function renderManagement() {

        const projects =
            enhancementProjects;


        const documents =
            enhancementDocuments;


        const total =
            projects.length;


        const ongoing =
            projects.filter(
                function (project) {

                    return (
                        project.status ===
                            "Ongoing" ||
                        project.status ===
                            "Planning"
                    );

                }
            ).length;


        const completed =
            projects.filter(
                function (project) {

                    return (
                        project.status ===
                        "Completed"
                    );

                }
            ).length;


        const review =
            projects.filter(
                function (project) {

                    return (
                        project.status ===
                        "For Review"
                    );

                }
            ).length;


        const average =
            total
                ? Math.round(
                    projects.reduce(
                        function (
                            sum,
                            project
                        ) {

                            return (
                                sum +
                                Number(
                                    project.progress ||
                                    0
                                )
                            );

                        },
                        0
                    ) / total
                )
                : 0;


        setManagementText(
            "managementTotalProjects",
            total
        );

        setManagementText(
            "managementOngoing",
            ongoing
        );

        setManagementText(
            "managementCompleted",
            completed
        );

        setManagementText(
            "managementReview",
            review
        );

        setManagementText(
            "managementDocuments",
            documents.length
        );

        setManagementText(
            "managementProgress",
            average + "%"
        );


        const table =
            document.getElementById(
                "managementProjectTable"
            );

        if (!table) {
            return;
        }


        if (!projects.length) {

            table.innerHTML = `

                <div
                    class="management-empty"
                >
                    No projects available.
                </div>

            `;

            return;

        }


        table.innerHTML = `

            <div
                class="management-table-header"
            >

                <span>
                    PROJECT
                </span>

                <span>
                    LOCATION
                </span>

                <span>
                    STATUS
                </span>

                <span>
                    PROGRESS
                </span>

            </div>


            ${projects
                .slice(0, 20)
                .map(function (project) {

                    const progress =
                        Math.max(
                            0,
                            Math.min(
                                100,
                                Number(
                                    project.progress ||
                                    0
                                )
                            )
                        );


                    return `

                        <div
                            class="management-table-row"
                        >

                            <div>

                                <strong>
                                    ${escapeUpdate(
                                        project.project_code ||
                                        project.name ||
                                        "Project"
                                    )}
                                </strong>

                                <small>
                                    ${escapeUpdate(
                                        project.name ||
                                        ""
                                    )}
                                </small>

                            </div>


                            <div>
                                ${escapeUpdate(
                                    project.location ||
                                    "—"
                                )}
                            </div>


                            <div>

                                <span
                                    class="management-status"
                                >
                                    ${escapeUpdate(
                                        project.status ||
                                        "Planning"
                                    )}
                                </span>

                            </div>


                            <div>

                                <div
                                    class="management-progress"
                                >

                                    <div
                                        style="
                                            width:${progress}%
                                        "
                                    ></div>

                                </div>

                                <small>
                                    ${progress}%
                                </small>

                            </div>

                        </div>

                    `;

                })
                .join("")}

        `;

    }


    function setManagementText(
        id,
        value
    ) {

        const element =
            document.getElementById(
                id
            );

        if (element) {

            element.textContent =
                value;

        }

    }


    /* =====================================================
       HOOK INTO EXISTING PROJECT RENDERER
       ===================================================== */

    function hookProjectRenderer() {

        if (
            typeof window.renderProjects !==
            "function"
        ) {
            return;
        }


        if (
            window.renderProjects.__pdsEnhanced
        ) {
            return;
        }


        const original =
            window.renderProjects;


        function enhancedRenderProjects(
            projects
        ) {

            enhancementProjects =
                Array.isArray(projects)
                    ? projects
                    : [];


            original(
                projects
            );


            renderManagement();
            renderUpdates();

        }


        enhancedRenderProjects
            .__pdsEnhanced = true;


        window.renderProjects =
            enhancedRenderProjects;

    }


    /* =====================================================
       HOOK INTO EXISTING DOCUMENT RENDERER
       ===================================================== */

    function hookDocumentRenderer() {

        if (
            typeof window.renderDocuments !==
            "function"
        ) {
            return;
        }


        if (
            window.renderDocuments.__pdsEnhanced
        ) {
            return;
        }


        const original =
            window.renderDocuments;


        function enhancedRenderDocuments(
            documents
        ) {

            enhancementDocuments =
                Array.isArray(documents)
                    ? documents
                    : [];


            original(
                documents
            );


            renderManagement();
            renderUpdates();

        }


        enhancedRenderDocuments
            .__pdsEnhanced = true;


        window.renderDocuments =
            enhancedRenderDocuments;

    }


    /* =====================================================
       OVERRIDE SHOW PAGE SO NEW PAGES WORK
       ===================================================== */

    function hookNavigation() {

        if (
            typeof window.showPage !==
            "function"
        ) {
            return;
        }


        if (
            window.showPage.__pdsEnhanced
        ) {
            return;
        }


        const original =
            window.showPage;


        function enhancedShowPage(
            pageId
        ) {

            original(
                pageId
            );


            if (
                pageId ===
                "management"
            ) {

                renderManagement();

            }


            if (
                pageId ===
                "updates"
            ) {

                renderUpdates();

            }

        }


        enhancedShowPage
            .__pdsEnhanced = true;


        window.showPage =
            enhancedShowPage;

    }


    /* =====================================================
       ONE DRIVE BUTTON
       ===================================================== */

    function addOneDriveQuickAccess() {

        const quickGrid =
            document.querySelector(
                ".quick-grid"
            );

        if (!quickGrid) {
            return;
        }


        if (
            document.getElementById(
                "oneDriveQuickCard"
            )
        ) {
            return;
        }


        const card =
            document.createElement(
                "a"
            );


        card.id =
            "oneDriveQuickCard";

        card.className =
            "quick-card quick-link-card";

        card.href =
            PDS_CONFIG.oneDriveMonitoring;

        card.target =
            "_blank";

        card.rel =
            "noopener noreferrer";


        card.innerHTML = `

            <div class="quick-icon">
                ☁
            </div>

            <div>

                <strong>
                    OneDrive Monitoring
                </strong>

                <span>
                    Central monitoring files
                </span>

            </div>

            <b>
                ↗
            </b>

        `;


        quickGrid.appendChild(
            card
        );

    }


    /* =====================================================
       INITIALIZE
       ===================================================== */

    function initializePDS() {

        replaceBranding();

        addEnhancedNavigation();

        createManagementPage();

        createUpdatesPage();

        addOverviewUpdates();

        addOneDriveQuickAccess();

        hookProjectRenderer();

        hookDocumentRenderer();

        hookNavigation();

        renderManagement();

        renderUpdates();

        setupBrandingObserver();

    }


    /* =====================================================
       RETRY
       Because the existing application loads
       Supabase data asynchronously.
       ===================================================== */

    let attempts = 0;

    const retry =
        setInterval(
            function () {

                attempts++;

                initializePDS();


                if (
                    attempts >= 20
                ) {

                    clearInterval(
                        retry
                    );

                }

            },
            500
        );


    /*
       Also initialize when DOM is ready.
    */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializePDS
        );

    } else {

        initializePDS();

    }

})();
