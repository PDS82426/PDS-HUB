/* =========================================================
   PDS HUB - DEPARTMENT ORDERS
   Planning & Design Section
   ========================================================= */


/*
   IMPORTANT:
   Department Orders are listed here so they are easy
   to maintain and update later.

   "url" should point to the official DPWH document/page.
*/

const departmentOrders = [

    {
        number: "DO 75",
        year: "2024",
        title:
            "Guidelines for the Conduct of Geotechnical Investigation for all DPWH Infrastructure",

        description:
            "Guidelines for geotechnical investigation prior to the preparation of design documents and plans for proposed DPWH infrastructure projects.",

        category: "geotechnical",

        categoryName: "Geotechnical",

        url:
            "https://www.dpwh.gov.ph/dpwh/sites/default/files/issuances/do_075_s2024.pdf"
    },


    {
        number: "DO 18",
        year: "2020",
        title:
            "Technical Manuals and Guidelines on Bridge Seismic Design",

        description:
            "Technical reference related to seismic design considerations for DPWH bridge infrastructure.",

        category: "bridges",

        categoryName: "Bridges & Structures",

        url:
            "https://www.dpwh.gov.ph/"
    },


    {
        number: "DO 120",
        year: "2019",
        title:
            "Updating of the Road Network Definition and Inventory Update Manual and Visual Road Condition Assessment Manual under the Road and Bridge Information Application (RBIA)",

        description:
            "Reference for road network information, inventory, and visual road condition assessment activities.",

        category: "roads",

        categoryName: "Roads",

        url:
            "https://www.dpwh.gov.ph/"
    },


    {
        number: "DO 27",
        year: "2019",
        title:
            "Manual on Streamflow 2018 Edition",

        description:
            "Technical reference for streamflow information useful in hydrologic studies and infrastructure planning.",

        category: "hydrology",

        categoryName: "Hydrology & Drainage",

        url:
            "https://www.dpwh.gov.ph/"
    },


    {
        number: "DO 24",
        year: "2019",
        title:
            "Technical Manuals and Guidelines on Road and Bridge Maintenance and Inspection",

        description:
            "Technical guidance related to inspection and maintenance considerations for road and bridge infrastructure.",

        category: "standards",

        categoryName: "Standards & Manuals",

        url:
            "https://www.dpwh.gov.ph/"
    },


    {
        number: "DO 110",
        year: "2019",
        title:
            "Clarifying and Amending Department Order No. 65, Series of 2017, and Amending Department Order No. 56, Series of 2019, on Infrastructure Right-of-Way Matters",

        description:
            "Reference for Infrastructure Right-of-Way matters relevant to project development and implementation.",

        category: "right-of-way",

        categoryName: "Right-of-Way",

        url:
            "https://www.dpwh.gov.ph/"
    },


    {
        number: "DO 37",
        year: "2021",
        title:
            "Clarifying Department Order No. 110, Series of 2019 on Infrastructure Right-of-Way Matters",

        description:
            "Related guidance on Infrastructure Right-of-Way matters and project requirements.",

        category: "right-of-way",

        categoryName: "Right-of-Way",

        url:
            "https://www.dpwh.gov.ph/"
    },


    {
        number: "DO 159",
        year: "2022",
        title:
            "Implementation of the Social and Environmental Management System Operations Manual",

        description:
            "Environmental and social management reference that may be considered during project planning and development.",

        category: "planning",

        categoryName: "Planning & Project Development",

        url:
            "https://www.dpwh.gov.ph/dpwh/issuances/department-order/26980"
    }

];


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const ordersContainer =
    document.getElementById("ordersContainer");

const searchInput =
    document.getElementById("searchInput");

const clearSearch =
    document.getElementById("clearSearch");

const categoryFilter =
    document.getElementById("categoryFilter");

const yearFilter =
    document.getElementById("yearFilter");

const resultCount =
    document.getElementById("resultCount");

const noResults =
    document.getElementById("noResults");

const resetFilters =
    document.getElementById("resetFilters");

const resetNoResults =
    document.getElementById("resetNoResults");

const mobileMenu =
    document.getElementById("mobileMenu");

const sidebar =
    document.querySelector(".sidebar");


/* =========================================================
   DISPLAY ORDERS
   ========================================================= */

function displayOrders(orders) {

    ordersContainer.innerHTML = "";

    resultCount.textContent = orders.length;

    if (orders.length === 0) {

        noResults.classList.remove("hidden");

        return;
    }

    noResults.classList.add("hidden");


    orders.forEach(order => {

        const card =
            document.createElement("article");

        card.className = "order-card";


        card.innerHTML = `

            <div class="order-top">

                <span class="order-number">
                    ${order.number}
                </span>

                <span class="order-year">
                    Series of ${order.year}
                </span>

            </div>


            <h3>
                ${order.title}
            </h3>


            <p>
                ${order.description}
            </p>


            <span class="order-category">
                ${order.categoryName}
            </span>


            <div class="order-footer">

                <span class="source">
                    Official DPWH
                </span>

                <a
                    class="view-button"
                    href="${order.url}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    View Document ↗
                </a>

            </div>

        `;


        ordersContainer.appendChild(card);

    });

}


/* =========================================================
   FILTER
   ========================================================= */

function filterOrders() {

    const searchTerm =
        searchInput.value
            .toLowerCase()
            .trim();

    const selectedCategory =
        categoryFilter.value;

    const selectedYear =
        yearFilter.value;


    const filteredOrders =
        departmentOrders.filter(order => {

            const searchableText = `

                ${order.number}

                ${order.year}

                ${order.title}

                ${order.description}

                ${order.categoryName}

            `.toLowerCase();


            const matchesSearch =
                searchableText.includes(searchTerm);


            const matchesCategory =
                selectedCategory === "all" ||
                order.category === selectedCategory;


            const matchesYear =
                selectedYear === "all" ||
                order.year === selectedYear;


            return (
                matchesSearch &&
                matchesCategory &&
                matchesYear
            );

        });


    displayOrders(filteredOrders);


    if (searchTerm.length > 0) {

        clearSearch.style.display =
            "block";

    } else {

        clearSearch.style.display =
            "none";

    }

}


/* =========================================================
   RESET FILTERS
   ========================================================= */

function resetAllFilters() {

    searchInput.value = "";

    categoryFilter.value = "all";

    yearFilter.value = "all";

    clearSearch.style.display = "none";

    filterOrders();

}


/* =========================================================
   EVENT LISTENERS
   ========================================================= */

searchInput.addEventListener(
    "input",
    filterOrders
);


categoryFilter.addEventListener(
    "change",
    filterOrders
);


yearFilter.addEventListener(
    "change",
    filterOrders
);


clearSearch.addEventListener(
    "click",
    function () {

        searchInput.value = "";

        filterOrders();

        searchInput.focus();

    }
);


resetFilters.addEventListener(
    "click",
    resetAllFilters
);


resetNoResults.addEventListener(
    "click",
    resetAllFilters
);


/* =========================================================
   MOBILE SIDEBAR
   ========================================================= */

mobileMenu.addEventListener(
    "click",
    function () {

        sidebar.classList.toggle("open");

    }
);


/* Close mobile sidebar after selecting a link */

document
    .querySelectorAll(".sidebar-nav a")
    .forEach(link => {

        link.addEventListener(
            "click",
            function () {

                sidebar.classList.remove("open");

            }
        );

    });


/* =========================================================
   INITIALIZE
   ========================================================= */

displayOrders(departmentOrders);
