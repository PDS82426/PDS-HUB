/* =========================================================
   PDS HUB
   Supabase + GitHub Pages
   Authentication
   ========================================================= */

const SUPABASE_URL =
    "https://zvwghoabsqfyakbqzhil.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_oJ3Zc3TplfYgePQEmTrJ8Q_qycxR0jQ";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);


/* =========================================================
   AUTH STATE
   ========================================================= */

let currentUser = null;


/* =========================================================
   CHECK LOGIN
   ========================================================= */

async function checkAuth() {

    const {
        data: { session },
        error
    } = await supabaseClient.auth.getSession();

    if (error) {
        console.error("Auth error:", error);
        return;
    }

    if (session) {

        currentUser = session.user;

        await loadUserProfile();

        showApplication();

    } else {

        showLogin();

    }
}


/* =========================================================
   AUTH STATE LISTENER
   ========================================================= */

supabaseClient.auth.onAuthStateChange(
    async (event, session) => {

        console.log("Auth event:", event);

        if (session) {

            currentUser = session.user;

            await loadUserProfile();

            showApplication();

        } else {

            currentUser = null;

            showLogin();

        }

    }
);


/* =========================================================
   SIGN UP
   ========================================================= */

async function signUp() {

    const name =
        document.getElementById("signupName")?.value.trim();

    const email =
        document.getElementById("signupEmail")?.value.trim();

    const password =
        document.getElementById("signupPassword")?.value;

    const position =
        document.getElementById("signupPosition")?.value.trim();


    if (!name || !email || !password) {

        alert(
            "Please complete your name, email, and password."
        );

        return;

    }


    if (password.length < 6) {

        alert(
            "Password must contain at least 6 characters."
        );

        return;

    }


    const {
        data,
        error
    } = await supabaseClient.auth.signUp({

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

        alert(
            "Create Account failed:\n\n" +
            error.message
        );

        return;

    }


    /*
       If email confirmation is enabled,
       Supabase will require the user to
       confirm their email first.
    */

    if (!data.session) {

        alert(
            "Account created successfully!\n\n" +
            "Please check your email and confirm your account before signing in."
        );

        showLogin();

        return;

    }


    currentUser = data.user;

    await createProfile(
        data.user,
        name,
        position
    );

    showApplication();

}


/* =========================================================
   CREATE PROFILE
   ========================================================= */

async function createProfile(
    user,
    fullName,
    position
) {

    if (!user) return;


    const {
        data: existing,
        error: existingError
    } = await supabaseClient
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();


    if (existingError) {

        console.error(
            "Profile check error:",
            existingError
        );

        return;

    }


    if (existing) {

        return;

    }


    const {
        error
    } = await supabaseClient
        .from("profiles")
        .insert({

            id: user.id,

            full_name:
                fullName ||
                user.email?.split("@")[0] ||
                "PDS User",

            position:
                position || null,

            role: "member"

        });


    if (error) {

        console.error(
            "Profile creation error:",
            error
        );

    }

}


/* =========================================================
   LOAD USER PROFILE
   ========================================================= */

async function loadUserProfile() {

    if (!currentUser) return;


    const {
        data,
        error
    } = await supabaseClient
        .from("profiles")
        .select(
            "id, full_name, position, role"
        )
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

        await createProfile(
            currentUser,
            currentUser.user_metadata?.full_name,
            currentUser.user_metadata?.position
        );

        return;

    }


    window.currentProfile = data;

    updateUserInterface(data);

}


/* =========================================================
   UPDATE USER INTERFACE
   ========================================================= */

function updateUserInterface(profile) {

    const name =
        profile.full_name ||
        currentUser?.email ||
        "PDS User";


    const initials =
        getInitials(name);


    document
        .querySelectorAll(".user-name")
        .forEach(element => {

            element.textContent = name;

        });


    document
        .querySelectorAll(".user-email")
        .forEach(element => {

            element.textContent =
                currentUser?.email || "";

        });


    document
        .querySelectorAll(".user-role")
        .forEach(element => {

            element.textContent =
                profile.position ||
                profile.role ||
                "Member";

        });


    document
        .querySelectorAll(".avatar")
        .forEach(element => {

            element.textContent = initials;

        });


    document
        .querySelectorAll(".top-avatar")
        .forEach(element => {

            element.textContent = initials;

        });

}


/* =========================================================
   INITIALS
   ========================================================= */

function getInitials(name) {

    if (!name) return "PU";


    const parts =
        name
            .trim()
            .split(/\s+/);


    if (parts.length === 1) {

        return parts[0]
            .substring(0, 2)
            .toUpperCase();

    }


    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();

}


/* =========================================================
   SIGN IN
   ========================================================= */

async function signIn() {

    const email =
        document.getElementById("loginEmail")?.value.trim();

    const password =
        document.getElementById("loginPassword")?.value;


    if (!email || !password) {

        alert(
            "Please enter your email and password."
        );

        return;

    }


    const {
        data,
        error
    } = await supabaseClient.auth.signInWithPassword({

        email: email,

        password: password

    });


    if (error) {

        console.error(error);

        alert(
            "Sign in failed:\n\n" +
            error.message
        );

        return;

    }


    currentUser = data.user;

    await loadUserProfile();

    showApplication();

}


/* =========================================================
   SIGN OUT
   ========================================================= */

async function signOut() {

    const {
        error
    } = await supabaseClient.auth.signOut();


    if (error) {

        console.error(error);

        alert(
            "Unable to sign out:\n\n" +
            error.message
        );

        return;

    }


    currentUser = null;

    showLogin();

}


/* =========================================================
   LOGIN PAGE
   ========================================================= */

function showLogin() {

    const loginPage =
        document.getElementById("loginPage");

    const app =
        document.querySelector(".app");


    if (loginPage) {

        loginPage.style.display = "flex";

    }


    if (app) {

        app.style.display = "none";

    }

}


/* =========================================================
   SHOW APPLICATION
   ========================================================= */

function showApplication() {

    const loginPage =
        document.getElementById("loginPage");

    const app =
        document.querySelector(".app");


    if (loginPage) {

        loginPage.style.display = "none";

    }


    if (app) {

        app.style.display = "flex";

    }

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

        item.classList.remove("active");


        if (
            item.dataset.page ===
            pageId
        ) {

            item.classList.add("active");

        }

    });


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


/* =========================================================
   SIDEBAR
   ========================================================= */

document.addEventListener(
    "click",
    function(event) {

        const item =
            event.target.closest(".nav-item");


        if (!item) return;


        event.preventDefault();


        const page =
            item.dataset.page;


        if (page) {

            showPage(page);

        }

    }
);


/* =========================================================
   GLOBAL SEARCH
   ========================================================= */

const globalSearch =
    document.getElementById(
        "globalSearch"
    );


if (globalSearch) {

    globalSearch.addEventListener(
        "input",
        function() {

            const search =
                this.value
                    .toLowerCase()
                    .trim();


            if (!search) return;


            const pages =
                document.querySelectorAll(
                    ".page"
                );


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
   INITIALIZE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function() {

        console.log(
            "PDS HUB initializing..."
        );


        await checkAuth();


        /*
           Only show dashboard after
           authentication has been checked.
        */

        if (currentUser) {

            showPage("overview");

        }

    }
);
