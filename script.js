// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut, sendPasswordResetEmail, updateProfile, reauthenticateWithCredential, EmailAuthProvider, deleteUser } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp, collection, query, getDocs, deleteDoc, where, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCbASk2ttihM-k3Noo1uhTCCsuc2FBBiSc",
    authDomain: "apex-ad8c0.firebaseapp.com",
    projectId: "apex-ad8c0",
    storageBucket: "apex-ad8c0.firebasestorage.app",
    messagingSenderId: "243749227658",
    appId: "1:243749227658:web:3ac6fba9aac3100abcb173",
    measurementId: "G-SKZY7WC4E3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app); // Export auth for potential future modules
export const db = getFirestore(app); // Export db for potential future modules


// Amazon Affiliate Tag
const amazonTag = "everythi09e02-20";

// NEW: Combined whitelist for makes (cars and motorcycles)
const VALID_MAKES_WHITELIST = [
    "Ford", "Chevrolet", "Dodge", "Oldsmobile", "Alfa Romeo", "Subaru", "Kia", "Honda",
    "Toyota", "Nissan", "Isuzu", "Mazda", "Mitsubishi", "Hyundai",
    // Motorcycles
    "Harley-Davidson", "Kawasaki", "Ducati", "Buell"
];


// --- Global DOM Elements (assigned in DOMContentLoaded) ---
let navLinks;
let hamburgerMenu;
let userEmailSpan;
let notificationContainer;
// NEW: Grease Monkey Banner
let greaseMonkeyBanner; 

// --- Auth Form Elements (assigned in DOMContentLoaded) ---
let loginForm;
let loginEmailInput;
let loginPassInput;
let regForm;
let regEmailInput;
let regPassInput;
let googleLoginBtn;
let logoutBtn;
let toggleLoginPassBtn;
let toggleRegPassBtn;
let forgotPasswordLink;
let passwordStrengthIndicator;

// --- Garage Form Elements (assigned in DOMContentLoaded) ---
let garageForm;
let savedVehiclesContainer;
let noVehiclesMessage;
let makeSelect;
let modelSelect;
let yearSelect;
let vinInput;
let addVinButton;
let vinLookupMessage;

// --- Wishlist Elements (assigned in DOMContentLoaded) ---
let featuredProductsGrid;
let wishlistItemsContainer;
let clearWishlistButton;
let wishlistInitialMessage;

// --- Profile Elements (assigned in DOMContentLoaded) ---
let profileEmailSpan;
let profileDisplayNameSpan;
let changePasswordBtn;
let updateProfileForm;
let firstNameInput;
let lastNameInput;
let phoneInput;
let addressInput;
let cityInput;
let stateInput;
let zipInput;
let countryInput;
let saveProfileBtn;
let preferencesForm;
let newsletterCheckbox;
let savePreferencesBtn;
let orderHistoryList;
let profileSavedVehiclesList;
let noProfileVehiclesMessage;
let deleteAccountBtn;

// --- Contact Form Elements (assigned in DOMContentLoaded) ---
let contactForm;

// NEW: AI Assistant Elements
let aiAssistantForm;
let aiVehicleInfo;
let problemInput;
let aiSubmitBtn;
let aiResponseContainer;
let aiResponseContent;
let aiPartsLinks;
let aiVehicleSelect; // New select element for AI page

// Global variable for selected vehicle
let selectedVehicleForSearch = null;

// Firebase Firestore constants
const FIRESTORE_VEHICLES_FIELD = 'vehicles';
const FIRESTORE_WISHLIST_FIELD = 'wishlist';
const FIRESTORE_USERS_COLLECTION = 'users';
const FIRESTORE_GARAGES_COLLECTION = 'garages';
const MAX_VEHICLES = 3;


// --- Page Navigation ---
window.showPage = function(id) {
    console.log(`[NAV] Showing page: ${id}`);
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    const pageElement = document.getElementById(id);
    if (pageElement) {
        pageElement.classList.add("active");
    } else {
        console.error(`[NAV] Page element with ID '${id}' not found!`);
    }

    if (hamburgerMenu && hamburgerMenu.classList.contains('open')) {
        hamburgerMenu.classList.remove('open');
        navLinks.classList.remove('active');
        hamburgerMenu.setAttribute('aria-expanded', 'false');
    }

    // Load data specific to the page being shown
    if (id === 'products') {
        loadVehicleForProducts();
    } else if (id === 'garage') {
        renderSavedVehicles();
        fetchMakes();
    } else if (id === 'wishlist') {
        loadWishlist();
    } else if (id === 'profile') {
        loadProfile();
    } else if (id === 'ai-assistant') {
        loadAIAssistantPage(); // NEW: Load AI assistant page content
    }
}

// --- Notification System ---
function showNotification(message, type = 'info', duration = 3000) {
    if (!notificationContainer) {
        console.warn("[Notification] Container not found! Cannot display notification.");
        return;
    }
    const notification = document.createElement('div');
    notification.className = `notification-item notification-${type}`;
    notification.innerHTML = `
        <span class="notification-message">${message}</span>
        <button class="notification-close" aria-label="Close notification">&times;</button>
    `;
    notificationContainer.appendChild(notification);

    const timeoutId = setTimeout(() => {
        notification.remove();
    }, duration);

    notification.querySelector('.notification-close').addEventListener('click', () => {
        clearTimeout(timeoutId);
        notification.remove();
    });
    console.log(`[Notification] Shown: "${message}" (${type})`);
}


// --- Form Error Display Helper ---
function displayFormError(elementId, message) {
    const errorSpan = document.getElementById(elementId);
    if (errorSpan) {
        errorSpan.textContent = message;
    } else {
        console.warn(`[FormError] Error span with ID '${elementId}' not found.`);
    }
}

function clearFormErrors(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.querySelectorAll('.error-message').forEach(span => {
            span.textContent = '';
        });
    }
}

// Function to clear auth form fields
function clearAuthFields() {
    console.log("[Auth] Attempting to clear auth fields.");
    if (loginEmailInput) loginEmailInput.value = "";
    if (loginPassInput) loginPassInput.value = "";
    if (regEmailInput) regEmailInput.value = "";
    if (regPassInput) regPassInput.value = "";

    // Reset password toggle icon and attributes
    if (toggleLoginPassBtn && loginPassInput) {
        loginPassInput.setAttribute('type', 'password');
        toggleLoginPassBtn.setAttribute('aria-label', 'Show password');
        toggleLoginPassBtn.setAttribute('aria-pressed', 'false');
        toggleLoginPassBtn.textContent = '👁️';
    }
    if (toggleRegPassBtn && regPassInput) {
        regPassInput.setAttribute('type', 'password');
        toggleRegPassBtn.setAttribute('aria-label', 'Show password');
        toggleRegPassBtn.setAttribute('aria-pressed', 'false');
        toggleRegPassBtn.textContent = '👁️';
    }


    if (passwordStrengthIndicator) {
        passwordStrengthIndicator.textContent = '';
        passwordStrengthIndicator.className = 'password-strength';
    }
    clearFormErrors('loginForm');
    clearFormErrors('registerForm');
    console.log("[Auth] Auth fields clear attempt complete.");
}

// --- Button Loading State Management ---
const originalButtonTexts = new Map();

function setButtonLoading(button, isLoading) {
    if (!button) {
        console.warn("[LoadingState] Button element is null or undefined.");
        return;
    }

    if (isLoading) {
        if (!originalButtonTexts.has(button)) {
            originalButtonTexts.set(button, button.textContent);
        }
        button.textContent = 'Loading...';
        button.classList.add('is-loading');
        button.disabled = true;
    } else {
        if (originalButtonTexts.has(button)) {
            button.textContent = originalButtonTexts.get(button);
            originalButtonTexts.delete(button);
        }
        button.classList.remove('is-loading');
        button.disabled = false;
    }
}

// --- Auth State Listener ---
onAuthStateChanged(auth, user => {
    console.log("[Auth] State changed. User:", user ? user.email : "none");
    if (!userEmailSpan) {
        document.addEventListener('DOMContentLoaded', () => {
            const emailSpan = document.getElementById("userEmail");
            if (emailSpan) updateAuthStateUI(user, emailSpan);
        });
    } else {
        updateAuthStateUI(user, userEmailSpan);
    }
});

// NEW: Checks if the Grease Monkey AI banner should be shown
async function checkAndShowGreaseMonkeyBanner() {
    if (!greaseMonkeyBanner) {
        console.warn("[GreaseMonkeyAI] Banner element not found.");
        return;
    }

    const user = auth.currentUser;
    if (user) {
        try {
            const vehicles = await getSavedVehiclesFromFirestore();
            if (vehicles && vehicles.length > 0) {
                greaseMonkeyBanner.style.display = 'block';
                console.log("[GreaseMonkeyAI] Banner shown.");
            } else {
                greaseMonkeyBanner.style.display = 'none';
                console.log("[GreaseMonkeyAI] Banner hidden (no vehicles saved).");
            }
        } catch (error) {
            console.error("[GreaseMonkeyAI] Error checking for vehicles:", error);
            greaseMonkeyBanner.style.display = 'none';
        }
    } else {
        greaseMonkeyBanner.style.display = 'none';
        console.log("[GreaseMonkeyAI] Banner hidden (user not logged in).");
    }
}

function updateAuthStateUI(user, emailSpanElement) {
    if (user) {
        emailSpanElement.textContent = `Logged in as: ${user.email}`;

        // Load data for all relevant sections when user logs in
        renderSavedVehicles();
        loadWishlist();
        loadProfile();

        // If currently on auth page, redirect to home
        if (document.querySelector('.page.active')?.id === 'auth') {
            showPage('home');
        }
        clearAuthFields();

        const userProfileDocRef = doc(db, FIRESTORE_USERS_COLLECTION, user.uid);
        getDoc(userProfileDocRef).then((docSnap) => {
            if (!docSnap.exists()) {
                console.log("[Firestore] Creating new user profile document in 'users' collection for:", user.uid);
                setDoc(userProfileDocRef, {
                    email: user.email,
                    displayName: user.displayName || '',
                    createdAt: serverTimestamp(),
                    firstName: '', lastName: '', phone: '', address: '', city: '', state: '', zip: '', country: '',
                    newsletterSubscription: false,
                }, { merge: true }).then(() => {
                    console.log("[Firestore] User profile document created successfully in 'users' collection.");
                }).catch(error => {
                    console.error("[Firestore ERROR] Error creating user profile document in 'users' collection:", error);
                    showNotification("Error setting up user profile.", "error");
                });
            } else {
                console.log("[Firestore] User profile document already exists in 'users' collection.");
            }
        }).catch(error => {
            console.error("[Firestore ERROR] Error checking user profile document in 'users' collection:", error);
            showNotification("Error accessing user profile data.", "error");
        });

        const userGarageDocRef = doc(db, FIRESTORE_GARAGES_COLLECTION, user.uid);
        getDoc(userGarageDocRef).then((docSnap) => {
            if (!docSnap.exists()) {
                console.log("[Firestore] Creating new user garage document in 'garages' collection for:", user.uid);
                setDoc(userGarageDocRef, {
                    [FIRESTORE_VEHICLES_FIELD]: [],
                    [FIRESTORE_WISHLIST_FIELD]: [],
                    createdAt: serverTimestamp()
                }).then(() => {
                    console.log("[Firestore] User garage document created successfully in 'garages' collection.");
                }).catch(error => {
                    console.error("[Firestore ERROR] Error creating user garage document in 'garages' collection:", error);
                    showNotification("Error setting up user garage.", "error");
                });
            } else {
                console.log("[Firestore] User garage document already exists in 'garages' collection.");
            }
        }).catch(error => {
            console.error("[Firestore ERROR] Error checking user garage document in 'garages' collection:", error);
            showNotification("Error accessing user garage data.", "error");
        });

    } else {
        emailSpanElement.textContent = "";
        if (document.querySelector(".page.active")?.id === "garage" ||
            document.querySelector(".page.active")?.id === "wishlist" ||
            document.querySelector(".page.active")?.id === "profile") {
            showPage("auth");
        }
        clearAuthFields();
        renderSavedVehicles();
        loadWishlist();
        loadProfile();
        showNotification("Logged out.", 'info', 2000);
        if (greaseMonkeyBanner) {
            greaseMonkeyBanner.style.display = 'none';
        }
    }
    checkAndShowGreaseMonkeyBanner();
}

// --- DOMContentLoaded: Assign elements and attach all listeners ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("[DOM] DOMContentLoaded fired. Assigning DOM elements and attaching listeners.");

    // Assign Global DOM Elements
    navLinks = document.getElementById('navLinks');
    hamburgerMenu = document.getElementById('hamburgerMenu');
    userEmailSpan = document.getElementById('userEmail');
    notificationContainer = document.getElementById('notificationContainer');
    greaseMonkeyBanner = document.getElementById('greaseMonkeyBanner');

    // Assign Auth Form Elements
    loginForm = document.getElementById('loginForm');
    loginEmailInput = document.getElementById("loginEmail");
    loginPassInput = document.getElementById("loginPass");
    regForm = document.getElementById('registerForm');
    regEmailInput = document.getElementById("regEmail");
    regPassInput = document.getElementById("regPass");
    googleLoginBtn = document.getElementById('googleLoginBtn');
    logoutBtn = document.getElementById('logoutBtn');
    toggleLoginPassBtn = document.getElementById('toggleLoginPass');
    toggleRegPassBtn = document.getElementById('toggleRegPass');
    forgotPasswordLink = document.querySelector('.forgot-password-link');

    // Create and insert password strength indicator here
    passwordStrengthIndicator = document.createElement('div');
    passwordStrengthIndicator.id = 'passwordStrength';
    passwordStrengthIndicator.className = 'password-strength';
    if (regPassInput) {
        regPassInput.parentNode.insertBefore(passwordStrengthIndicator, regPassInput.nextSibling);
    }

    // Assign Garage Form Elements
    garageForm = document.getElementById('garageForm');
    savedVehiclesContainer = document.getElementById('savedVehicles');
    noVehiclesMessage = document.getElementById('noVehiclesMessage');
    makeSelect = document.getElementById('makeSelect');
    modelSelect = document.getElementById('modelSelect');
    yearSelect = document.getElementById('yearSelect');
    vinInput = document.getElementById('vinInput');
    addVinButton = document.getElementById('addVinButton');
    vinLookupMessage = document.getElementById('vinLookupMessage');

    // Assign Wishlist Elements
    featuredProductsGrid = document.getElementById('featuredProductsGrid');
    wishlistItemsContainer = document.getElementById('wishlistItems');
    clearWishlistButton = document.getElementById('clearWishlistBtn');
    wishlistInitialMessage = document.querySelector('#wishlistItems .no-items-message');

    // Assign Profile Elements
    profileEmailSpan = document.getElementById('profileEmail');
    profileDisplayNameSpan = document.getElementById('profileDisplayName');
    changePasswordBtn = document.getElementById('changePasswordBtn');
    updateProfileForm = document.getElementById('updateProfileForm');
    firstNameInput = document.getElementById('firstNameInput');
    lastNameInput = document.getElementById('lastNameInput');
    phoneInput = document.getElementById('phoneInput');
    addressInput = document.getElementById('addressInput');
    cityInput = document.getElementById('cityInput');
    stateInput = document.getElementById('stateInput');
    zipInput = document.getElementById('zipInput');
    countryInput = document.getElementById('countryInput');
    saveProfileBtn = document.getElementById('saveProfileBtn');
    preferencesForm = document.getElementById('preferencesForm');
    newsletterCheckbox = document.getElementById('newsletterCheckbox');
    savePreferencesBtn = document.getElementById('savePreferencesBtn');
    orderHistoryList = document.getElementById('orderHistoryList');
    profileSavedVehiclesList = document.getElementById('profileSavedVehiclesList');
    noProfileVehiclesMessage = document.getElementById('noProfileVehiclesMessage');
    deleteAccountBtn = document.getElementById('deleteAccountBtn');

    // Assign Contact Form Elements
    contactForm = document.getElementById('contactForm');

    // NEW: Assign AI Assistant Elements
    aiAssistantForm = document.getElementById('aiAssistantForm');
    aiVehicleInfo = document.getElementById('aiVehicleInfo');
    problemInput = document.getElementById('problemInput');
    aiSubmitBtn = document.getElementById('aiSubmitBtn');
    aiResponseContainer = document.getElementById('aiResponseContainer');
    aiResponseContent = document.getElementById('aiResponseContent');
    aiPartsLinks = document.getElementById('aiPartsLinks');

    // --- Attach Event Listeners (only if elements exist) ---
    // Hamburger Menu Logic
    if (hamburgerMenu && navLinks) {
        hamburgerMenu.addEventListener('click', (event) => {
            event.stopPropagation();
            navLinks.classList.toggle('active');
            hamburgerMenu.classList.toggle('open');
            const isExpanded = hamburgerMenu.getAttribute('aria-expanded') === 'true';
            hamburgerMenu.setAttribute('aria-expanded', !isExpanded);
        });
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                    hamburgerMenu.classList.remove('open');
                    hamburgerMenu.setAttribute('aria-expanded', 'false');
                }
            });
        });
        document.addEventListener('click', (event) => {
            if (!navLinks.contains(event.target) && !hamburgerMenu.contains(event.target) && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                hamburgerMenu.classList.remove('open');
                hamburgerMenu.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // Login Form
    if (loginForm && loginEmailInput && loginPassInput) {
        loginForm.addEventListener("submit", async (e) => {
            console.log("[Auth] Login form submitted.");
            e.preventDefault();
            const submitBtn = e.submitter;

            clearFormErrors('loginForm');
            let isValid = true;
            if (!loginEmailInput.value) { displayFormError('loginEmailError', 'Email is required.'); isValid = false; }
            if (!loginPassInput.value) { displayFormError('loginPassError', 'Password is required.'); isValid = false; }
            if (!isValid) {
                showNotification('Please fill in all required fields.', 'error');
                setButtonLoading(submitBtn, false);
                return;
            }

            setButtonLoading(submitBtn, true);

            try {
                await signInWithEmailAndPassword(auth, loginEmailInput.value, loginPassInput.value);
                showNotification("Login successful!", "success");
                clearAuthFields();
            } catch (err) {
                let errorMessage = "An unknown error occurred.";
                if (err.code === 'auth/invalid-email') {
                    errorMessage = "Invalid email format.";
                    displayFormError('loginEmailError', errorMessage);
                } else if (err.code === 'auth/user-not-found') {
                    errorMessage = "No user found with that email.";
                    displayFormError('loginEmailError', errorMessage);
                } else if (err.code === 'auth/wrong-password') {
                    errorMessage = "Incorrect password.";
                    displayFormError('loginPassError', errorMessage);
                } else if (err.code === 'auth/invalid-credential') {
                    errorMessage = "Invalid email or password.";
                    displayFormError('loginEmailError', errorMessage);
                    displayFormError('loginPassError', ' ');
                }
                else {
                    errorMessage = err.message;
                }
                showNotification("Login failed: " + errorMessage, "error", 5000);
            } finally {
                setButtonLoading(submitBtn, false);
            }
        });
    } else { console.warn("[DOM] Login form or its inputs not found."); }


    // Register Form
    if (regForm && regEmailInput && regPassInput) {
        regForm.addEventListener("submit", async (e) => {
            console.log("[Auth] Register form submitted.");
            e.preventDefault();
            const submitBtn = e.submitter;

            clearFormErrors('registerForm');
            let isValid = true;
            if (!regEmailInput.value) { displayFormError('regEmailError', 'Email is required.'); isValid = false; }
            if (!regPassInput.value) { displayFormError('regPassError', 'Password is required.'); isValid = false; }
            if (regPassInput.value.length < 6) { displayFormError('regPassError', 'Password must be at least 6 characters long.'); isValid = false; }

            if (!isValid) {
                showNotification('Please fill in all required fields.', 'error');
                setButtonLoading(submitBtn, false);
                return;
            }

            setButtonLoading(submitBtn, true);

            try {
                await createUserWithEmailAndPassword(auth, regEmailInput.value, regPassInput.value);
                showNotification("Registered successfully!", "success");
                clearAuthFields();
            } catch (err) {
                let errorMessage = "An unknown error occurred.";
                if (err.code === 'auth/invalid-email') {
                    errorMessage = "Invalid email format.";
                    displayFormError('regEmailError', errorMessage);
                } else if (err.code === 'auth/email-already-in-use') {
                    errorMessage = "Email is already in use.";
                    displayFormError('regEmailError', errorMessage);
                } else if (err.code === 'auth/weak-password') {
                    errorMessage = "Password is too weak (min 6 characters).";
                    displayFormError('regPassError', errorMessage);
                } else {
                    errorMessage = err.message;
                }
                showNotification("Registration error: " + errorMessage, "error", 5000);
            } finally {
                setButtonLoading(submitBtn, false);
            }
        });

        if (regPassInput && passwordStrengthIndicator) {
            regPassInput.addEventListener('input', () => {
                const password = regPassInput.value;
                const strength = checkPasswordStrength(password);
                updatePasswordStrengthIndicator(strength);
            });
        }
    } else { console.warn("[DOM] Register form or its inputs not found."); }


    // Google Login
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', async function() {
            console.log("[Auth] Google Login clicked.");
            setButtonLoading(googleLoginBtn, true);

            const provider = new GoogleAuthProvider();
            try {
                await signInWithPopup(auth, provider);
                showNotification("Google login successful!", "success");
                clearAuthFields();
            } catch (err) {
                if (err.code === 'auth/popup-closed-by-user') {
                    showNotification("Google login cancelled.", "info");
                } else if (err.code === 'auth/cancelled-popup-request') {
                    showNotification("Login attempt already in progress.", "info");
                } else {
                    showNotification("Google login error: " + err.message, "error", 5000);
                }
            } finally {
                setButtonLoading(googleLoginBtn, false);
            }
        });
    } else { console.warn("[DOM] Google Login button not found."); }

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function() {
            console.log("[Auth] Logout clicked.");
            setButtonLoading(logoutBtn, true);

            try {
                await signOut(auth);
                showNotification("Logged out successfully!", "info");
                clearAuthFields();
            } catch (err) {
                showNotification("Logout error: " + err.message, "error", 5000);
            } finally {
                setButtonLoading(logoutBtn, false);
            }
        });
    } else { console.warn("[DOM] Logout button not found."); }

    // Forgot Password
    if (forgotPasswordLink && loginEmailInput) {
        forgotPasswordLink.addEventListener('click', async (e) => {
            console.log("[Auth] Forgot Password clicked.");
            e.preventDefault();
            const email = loginEmailInput.value.trim();

            if (!email) {
                displayFormError('loginEmailError', 'Please enter your email to reset password.');
                showNotification('Please enter your email for password reset.', 'error');
                return;
            }

            setButtonLoading(forgotPasswordLink, true);

            try {
                await sendPasswordResetEmail(auth, email);
                showNotification(`Password reset email sent to ${email}. Please check your inbox.`, 'success', 7000);
                displayFormError('loginEmailError', '');
                loginEmailInput.value = '';
            } catch (error) {
                let errorMessage = "Failed to send reset email.";
                if (error.code === 'auth/invalid-email') {
                    errorMessage = "Invalid email address.";
                    displayFormError('loginEmailError', errorMessage);
                } else if (error.code === 'auth/user-not-found') {
                    errorMessage = "No user found with that email.";
                    displayFormError('loginEmailError', errorMessage);
                } else {
                    errorMessage = error.message;
                }
                showNotification(`Password reset error: ${errorMessage}`, "error", 7000);
                console.error("[Auth ERROR] Password reset error:", error);
            } finally {
                setButtonLoading(forgotPasswordLink, false);
            }
        });
    } else { console.warn("[DOM] Forgot Password link or login email input not found."); }


    // Password Visibility Toggles
    if (toggleLoginPassBtn && loginPassInput) {
        toggleLoginPassBtn.addEventListener('click', () => {
            const type = loginPassInput.getAttribute('type') === 'password' ? 'text' : 'password';
            loginPassInput.setAttribute('type', type);
            toggleLoginPassBtn.setAttribute('aria-label', type === 'password' ? 'Show password' : 'Hide password');
            toggleLoginPassBtn.setAttribute('aria-pressed', type !== 'password');
            toggleLoginPassBtn.textContent = type === 'password' ? '👁️' : '🙈';
        });
    } else { console.warn("[DOM] Login password toggle not found."); }

    if (toggleRegPassBtn && regPassInput) {
        toggleRegPassBtn.addEventListener('click', () => {
            const type = regPassInput.getAttribute('type') === 'password' ? 'text' : 'password';
            regPassInput.setAttribute('type', type);
            toggleRegPassBtn.setAttribute('aria-label', type === 'password' ? 'Show password' : 'Hide password');
            toggleRegPassBtn.setAttribute('aria-pressed', type !== 'password');
            toggleRegPassBtn.textContent = type === 'password' ? '👁️' : '🙈';
        });
    } else { console.warn("[DOM] Register password toggle not found."); }


    // --- My Garage Section (Firebase) ---
    if (garageForm && makeSelect && modelSelect && yearSelect && savedVehiclesContainer && noVehiclesMessage) {
        garageForm.addEventListener('submit', async (e) => {
            console.log("[Garage] Form submitted.");
            e.preventDefault();
            const submitBtn = e.submitter;

            setButtonLoading(submitBtn, true);
            clearFormErrors('garageForm');

            if (!auth.currentUser) {
                console.log("[Garage] Auth check: User not logged in.");
                showNotification("Please log in to save your vehicle.", "error");
                setButtonLoading(submitBtn, false);
                return;
            }

            const make = makeSelect.value;
            const model = modelSelect.value;
            const year = parseInt(yearSelect.value);

            let isValid = true;
            if (!make) { displayFormError('makeError', 'Please select a Make.'); isValid = false; }
            if (!model) { displayFormError('modelError', 'Please select a Model.'); isValid = false; }
            if (isNaN(year) || !year) { displayFormError('yearError', 'Please select a Year.'); isValid = false; }

            if (!isValid) {
                console.log("[Garage] Validation failed.");
                showNotification('Please correct the errors in the form.', 'error');
                setButtonLoading(submitBtn, false);
                return;
            }

            console.log("[Garage] Validation passed, proceeding with save logic.");

            try {
                const userGarageDocRef = getUserGarageDocRefForArrays();
                if (!userGarageDocRef) {
                    showNotification("Error: Could not access user's garage document.", "error");
                    setButtonLoading(submitBtn, false);
                    return;
                }

                const newVehicle = { make, model, year, createdAt: Date.now() };
                console.log("[Garage] Attempting to save new vehicle:", newVehicle);

                const userGarageDocSnap = await getDoc(userGarageDocRef);
                let vehicles = [];

                if (userGarageDocSnap.exists()) {
                    vehicles = userGarageDocSnap.data()[FIRESTORE_VEHICLES_FIELD] || [];
                    console.log("[Garage] Existing garage document found.");
                } else {
                    console.log("[Garage] No existing garage document found. Creating a new one.");
                }

                if (vehicles.length >= MAX_VEHICLES) {
                    showNotification(`You can save a maximum of ${MAX_VEHICLES} vehicles. Please delete one to add a new one.`, 'error', 5000);
                    setButtonLoading(submitBtn, false);
                    console.log("[Garage] Max vehicles limit reached.");
                    return;
                }

                const isDuplicate = vehicles.some(v => v.make === newVehicle.make && v.model === newVehicle.model && v.year === newVehicle.year);
                if (isDuplicate) {
                    showNotification(`Vehicle "${year} ${make} ${model}" is already in your garage.`, "info");
                    setButtonLoading(submitBtn, false);
                    return;
                }

                if (!userGarageDocSnap.exists()) {
                    await setDoc(userGarageDocRef, {
                        [FIRESTORE_VEHICLES_FIELD]: [newVehicle],
                        [FIRESTORE_WISHLIST_FIELD]: [],
                        createdAt: serverTimestamp()
                    });
                } else {
                    await updateDoc(userGarageDocRef, {
                        [FIRESTORE_VEHICLES_FIELD]: arrayUnion(newVehicle)
                    });
                }

                showNotification(`Vehicle "${year} ${make} ${model}" saved to your garage!`, "success");
                makeSelect.value = '';
                modelSelect.innerHTML = '<option value="">-- Select Model --</option>';
                modelSelect.disabled = true;
                yearSelect.innerHTML = '<option value="">-- Select Year --</option>';
                yearSelect.disabled = true;

                setTimeout(async () => {
                    await renderSavedVehicles();
                    await loadVehicleForProducts();
                    await loadProfileVehicles(auth.currentUser.uid);
                }, 500);
                console.log("[Garage] Vehicle save process completed successfully.");
            } catch (err) {
                console.error("[Garage ERROR] Unhandled error during garage form submission:", err);
                showNotification("Error saving vehicle: " + err.message, "error", 5000);
            } finally {
                setButtonLoading(submitBtn, false);
                console.log("[Garage] Finally block executed, loading state removed.");
            }
        });

        makeSelect.addEventListener('change', () => {
            const selectedMake = makeSelect.value;
            fetchModelsByMake(selectedMake);
        });

        modelSelect.addEventListener('change', () => {
            const selectedModel = modelSelect.value;
            if (selectedModel) {
                populateYears();
            } else {
                yearSelect.innerHTML = '<option value="">-- Select Year --</option>';
                yearSelect.disabled = true;
            }
        });

    } else { console.warn("[DOM] Garage form or its elements not found."); }

    // NEW: Event Listener for Add by VIN Button
    if (addVinButton && vinInput) {
        addVinButton.addEventListener('click', async () => {
            console.log("[Garage] Add by VIN button clicked.");
            const vin = vinInput.value.trim().toUpperCase();
            clearFormErrors('vinInputError');
            if (vinLookupMessage) vinLookupMessage.textContent = '';

            if (!vin) {
                showNotification("Please enter a VIN to look up vehicle details.", "error");
                displayFormError('vinInputError', 'VIN is required.');
                return;
            }
            const vinPattern = /^[A-HJ-NPR-Z0-9]{17}$/;
            if (vin.length !== 17 || !vinPattern.test(vin)) {
                showNotification("Please enter a valid 17-character VIN.", "error");
                displayFormError('vinInputError', 'Invalid VIN format or length (must be 17 characters, no I, O, Q).');
                return;
            }

            setButtonLoading(addVinButton, true);
            if (vinLookupMessage) vinLookupMessage.textContent = 'Looking up VIN...';

            try {
                const vehicleDetails = await fetchVehicleDetailsByVin(vin);
                if (vehicleDetails) {
                    showNotification(`Vehicle details found: ${vehicleDetails.year} ${vehicleDetails.make} ${vehicleDetails.model}`, 'success', 5000);
                    if (vinLookupMessage) vinLookupMessage.textContent = `Found: ${vehicleDetails.year} ${vehicleDetails.make} ${vehicleDetails.model}`;
                    if (makeSelect) makeSelect.value = vehicleDetails.make;
                    if (modelSelect) {
                        await fetchModelsByMake(vehicleDetails.make);
                        modelSelect.value = vehicleDetails.model;
                    }
                    if (yearSelect) {
                        populateYears();
                        yearSelect.value = vehicleDetails.year;
                    }
                    vinInput.value = '';
                } else {
                    showNotification("Could not find details for that VIN. Please check the number or try manual entry.", "error", 7000);
                    if (vinLookupMessage) vinLookupMessage.textContent = 'No details found.';
                    displayFormError('vinInputError', 'VIN not found or invalid.');
                }
            } catch (error) {
                console.error("[VIN Lookup ERROR]", error);
                showNotification("Error looking up VIN: " + error.message, "error", 7000);
                if (vinLookupMessage) vinLookupMessage.textContent = 'Error during lookup.';
                displayFormError('vinInputError', 'Error during VIN lookup.');
            } finally {
                setButtonLoading(addVinButton, false);
            }
        });
    } else { console.warn("[DOM] Add VIN button or input not found."); }


    // Wishlist Buttons (Event Listener for General Featured Products)
    if (featuredProductsGrid) {
        featuredProductsGrid.addEventListener('click', (event) => {
            if (event.target.classList.contains('add-to-wishlist-btn')) {
                const productCard = event.target.closest('.card');
                const product = {
                    id: productCard.dataset.productId,
                    name: productCard.dataset.productName,
                    price: parseFloat(productCard.dataset.productPrice),
                    amazonUrl: productCard.dataset.amazonUrl,
                    imageUrl: productCard.dataset.imageUrl,
                    brand: productCard.querySelector('p') ? productCard.querySelector('p').textContent.split(' – ')[0] : 'N/A'
                };
                addToWishlist(product);
            }
        });
    } else { console.warn("[DOM] Featured Products Grid not found for wishlist."); }

    // Event Listener for Wishlist Items (for Remove buttons)
    if (wishlistItemsContainer) {
        wishlistItemsContainer.addEventListener('click', async (event) => {
            if (event.target.classList.contains('remove-from-wishlist-btn')) {
                const productIdToRemove = event.target.dataset.productId;
                await removeFromWishlist(productIdToRemove, event.target);
            }
        });
    } else { console.warn("[DOM] Wishlist Items Container not found."); }

    if (clearWishlistButton) {
        clearWishlistButton.addEventListener('click', async () => {
            if (confirm("Are you sure you want to clear your entire wishlist? This cannot be undone.")) {
                await clearWishlist(clearWishlistButton);
            }
        });
    } else { console.warn("[DOM] Clear Wishlist Button not found."); }


    // --- Profile Page Functionality ---
    if (updateProfileForm && firstNameInput && lastNameInput && phoneInput && addressInput && cityInput && stateInput && zipInput && countryInput && saveProfileBtn) {
        updateProfileForm.addEventListener('submit', async (e) => {
            console.log("[Profile] Update Personal Info Form submitted.");
            e.preventDefault();
            const user = auth.currentUser;
            const submitBtn = saveProfileBtn;

            clearFormErrors('updateProfileForm');

            if (!user) {
                showNotification("You must be logged in to update your profile.", "error");
                setButtonLoading(submitBtn, false);
                return;
            }

            const firstName = firstNameInput.value.trim();
            const lastName = lastNameInput.value.trim();
            const phone = phoneInput.value.trim();
            const address = addressInput.value.trim();
            const city = cityInput.value.trim();
            const state = stateInput.value.trim();
            const zip = zipInput.value.trim();
            const country = countryInput.value.trim();

            let isValid = true;
            if (!firstName) { displayFormError('firstNameError', 'First name is required.'); isValid = false; }
            if (!lastName) { displayFormError('lastNameError', 'Last name is required.'); isValid = false; }
            if (!isValid) {
                showNotification('Please fill in all required profile fields.', 'error');
                setButtonLoading(submitBtn, false);
                return;
            }

            setButtonLoading(submitBtn, true);

            try {
                const fullDisplayName = `${firstName} ${lastName}`.trim();
                if (user.displayName !== fullDisplayName) {
                    await updateProfile(user, {
                        displayName: fullDisplayName
                    });
                    console.log("[Profile] Firebase Auth display name updated.");
                }

                const userProfileDocRef = getUserProfileDocRef();
                if (!userProfileDocRef) {
                    showNotification("Error: Could not access user profile document.", "error");
                    setButtonLoading(submitBtn, false);
                    return;
                }
                await setDoc(userProfileDocRef, {
                    firstName: firstName,
                    lastName: lastName,
                    phone: phone,
                    address: address,
                    city: city,
                    state: state,
                    zip: zip,
                    country: country,
                    lastUpdated: serverTimestamp()
                }, { merge: true });

                showNotification("Personal info updated successfully!", "success");
                loadProfile();
            } catch (error) {
                console.error("[Profile ERROR] Error updating profile personal info:", error);
                showNotification(`Failed to update personal info: ${error.message}`, "error");
            } finally {
                setButtonLoading(submitBtn, false);
            }
        });
    } else { console.warn("[DOM] Update Profile Form or its elements not found."); }

    // --- NEW: Preferences Form Listener ---
    if (preferencesForm && newsletterCheckbox && savePreferencesBtn) {
        preferencesForm.addEventListener('submit', async (e) => {
            console.log("[Profile] Preferences Form submitted.");
            e.preventDefault();
            const user = auth.currentUser;
            const submitBtn = savePreferencesBtn;

            if (!user) {
                showNotification("You must be logged in to update preferences.", "error");
                setButtonLoading(submitBtn, false);
                return;
            }

            const isSubscribed = newsletterCheckbox.checked;

            setButtonLoading(submitBtn, true);

            try {
                const userProfileDocRef = getUserProfileDocRef();
                if (!userProfileDocRef) {
                    showNotification("Error: Could not access user profile document for preferences.", "error");
                    setButtonLoading(submitBtn, false);
                    return;
                }
                await setDoc(userProfileDocRef, {
                    newsletterSubscription: isSubscribed,
                    lastUpdated: serverTimestamp()
                }, { merge: true });

                showNotification("Preferences updated successfully!", "success");
            } catch (error) {
                console.error("[Profile ERROR] Error updating preferences:", error);
                showNotification(`Failed to update preferences: ${error.message}`, "error");
            } finally {
                setButtonLoading(submitBtn, false);
            }
        });
    } else { console.warn("[DOM] Preferences Form or its elements not found."); }


    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', async () => {
            console.log("[Profile] Change Password button clicked.");
            const user = auth.currentUser;
            if (user && user.email) {
                showNotification("Sending password reset email...", "info");
                try {
                    await sendPasswordResetEmail(auth, user.email);
                    showNotification(`Password change email sent to ${user.email}. Please check your inbox.`, "success", 7000);
                } catch (error) {
                    console.error("[Profile ERROR] Change password email error:", error);
                    showNotification(`Failed to send password change email: ${error.message}`, "error", 7000);
                }
            } else {
                showNotification("Please log in to change your password.", "error");
            }
        });
    } else { console.warn("[DOM] Change Password button not found."); }

    // --- NEW: Delete Account Button Listener ---
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', async () => {
            console.log("[Profile] Delete Account button clicked.");
            const user = auth.currentUser;
            if (!user) {
                showNotification("No user logged in to delete.", "error");
                return;
            }

            if (!confirm("Are you ABSOLUTELY sure you want to delete your account? This action is irreversible and will delete ALL your data (profile, vehicles, wishlist, etc.).")) {
                showNotification("Account deletion cancelled.", "info");
                return;
            }

            const password = prompt("For security, please enter your password to confirm deletion:");
            if (!password) {
                showNotification("Account deletion cancelled.", "info");
                return;
            }

            setButtonLoading(deleteAccountBtn, true);

            try {
                const credential = EmailAuthProvider.credential(user.email, password);
                await reauthenticateWithCredential(user, credential);
                console.log("[Profile] Re-authentication successful. Proceeding with deletion...");
                showNotification("Re-authentication successful. Deleting account...", "info");

                const userProfileDocRef = getUserProfileDocRef();
                if (userProfileDocRef) {
                    await deleteDoc(userProfileDocRef);
                    console.log("[Profile] User profile document deleted from 'users' collection.");
                }

                const userGarageDocRef = getUserGarageDocRefForArrays();
                if (userGarageDocRef) {
                    await deleteDoc(userGarageDocRef);
                    console.log("[Profile] User garage/wishlist document deleted from 'garages' collection.");
                }

                await deleteUser(user);
                console.log("[Profile] Firebase Auth user account deleted.");

                showNotification("Your account and all associated data have been permanently deleted.", "success", 7000);
            } catch (error) {
                console.error("[Profile ERROR] Error deleting account:", error);
                if (error.code === 'auth/requires-recent-login') {
                    showNotification("For security, please log in again just before deleting your account.", "error");
                } else if (error.code === 'auth/invalid-credential') {
                    showNotification("Incorrect password. Account deletion failed.", "error");
                } else if (error.code === 'auth/user-mismatch') {
                    showNotification("User mismatch. Please ensure you are logged in with the correct account.", "error");
                }
                else {
                    errorMessage = error.message;
                }
                showNotification(`Account deletion failed: ${errorMessage}`, "error", 7000);
            } finally {
                setButtonLoading(deleteAccountBtn, false);
            }
        });
    } else { console.warn("[DOM] Delete Account button not found."); }


    // Contact Form
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            console.log("[Contact] Form submitted.");
            e.preventDefault();
            const submitBtn = e.submitter;

            clearFormErrors('contactForm');

            let isValid = true;
            const contactName = contactForm.contactName.value.trim();
            const contactEmail = contactForm.contactEmail.value.trim();
            const contactMessage = contactForm.contactMessage.value.trim();

            if (!contactName) { displayFormError('contactNameError', 'Name is required.'); isValid = false; }
            if (!contactEmail || !contactEmail.includes('@')) { displayFormError('contactEmailError', 'A valid email is required.'); isValid = false; }
            if (!contactMessage) { displayFormError('contactMessageError', 'Message cannot be empty.'); isValid = false; }

            if (!isValid) {
                showNotification('Please fill in all required fields.', 'error');
                return;
            }

            setButtonLoading(submitBtn, true);

            try {
                const response = await fetch(contactForm.action, {
                    method: contactForm.method,
                    body: new FormData(contactForm),
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    showNotification("Message sent successfully! We'll get back to you soon.", "success");
                    contactForm.reset();
                } else {
                    const data = await response.json();
                    if (data && data.errors) {
                        showNotification(`Error sending message: ${data.errors.map(err => err.message).join(', ')}`, "error", 5000);
                    } else {
                        showNotification("Failed to send message. Please try again later.", "error", 5000);
                    }
                }
            } catch (error) {
                showNotification("Network error or failed to send message. Please check your connection.", "error", 5000);
                console.error("[Contact ERROR] Contact form submission error:", error);
            } finally {
                setButtonLoading(submitBtn, false);
            }
        });
    } else { console.warn("[DOM] Contact form not found."); }


    // Footer Current Year
    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // Initial page load
    showPage('home');
});

// --- Helper Functions (defined outside DOMContentLoaded so they are globally accessible) ---

function getUserProfileDocRef() {
    if (!auth.currentUser) {
        console.warn("[Helper] getUserProfileDocRef: No current user logged in.");
        return null;
    }
    return doc(db, FIRESTORE_USERS_COLLECTION, auth.currentUser.uid);
}

function getUserGarageDocRefForArrays() {
    if (!auth.currentUser) {
        console.warn("[Helper] getUserGarageDocRefForArrays: No current user logged in.");
        return null;
    }
    return doc(db, FIRESTORE_GARAGES_COLLECTION, auth.currentUser.uid);
}


async function getSavedVehiclesFromFirestore() {
    const userGarageDocRef = getUserGarageDocRefForArrays();
    if (!userGarageDocRef) {
        console.log("[Firestore] getSavedVehiclesFromFirestore: Not logged in, returning empty array.");
        return [];
    }

    try {
        const docSnap = await getDoc(userGarageDocRef);
        if (docSnap.exists()) {
            return docSnap.data()[FIRESTORE_VEHICLES_FIELD] || [];
        }
        return [];
    } catch (error) {
        console.error("[Firestore ERROR] Error getting vehicles from Firestore:", error);
        showNotification("Error loading saved vehicles.", "error");
        return [];
    }
}

async function renderSavedVehicles() {
    const savedVehiclesContainer = document.getElementById('savedVehicles');
    const noVehiclesMessage = document.getElementById('noVehiclesMessage');

    if (!savedVehiclesContainer || !noVehiclesMessage) {
        console.warn("[DOM] Garage display elements not found for rendering (renderSavedVehicles).");
        return;
    }

    savedVehiclesContainer.innerHTML = '';
    noVehiclesMessage.textContent = 'Loading your vehicles...';
    noVehiclesMessage.style.display = 'block';
    savedVehiclesContainer.appendChild(noVehiclesMessage);


    if (!auth.currentUser) {
        noVehiclesMessage.textContent = 'Please log in to save your vehicles.';
        return;
    }

    try {
        const vehicles = await getSavedVehiclesFromFirestore();
        savedVehiclesContainer.innerHTML = '';

        if (vehicles.length === 0) {
            noVehiclesMessage.textContent = 'No vehicles saved yet. Add one above!';
            noVehiclesMessage.style.display = 'block';
            savedVehiclesContainer.appendChild(noVehiclesMessage);
        } else {
            noVehiclesMessage.style.display = 'none';
            vehicles.forEach((vehicle, index) => {
                const vehicleCard = document.createElement('div');
                vehicleCard.className = 'vehicle-card';
                vehicleCard.setAttribute('data-vehicle-index', index);
                vehicleCard.innerHTML = `
                    <div class="vehicle-info">
                        <h4>${vehicle.year} ${vehicle.make} ${vehicle.model}</h4>
                        <p>Make: ${vehicle.make}</p>
                        <p>Model: ${vehicle.model}</p>
                        <p>Year: ${vehicle.year}</p>
                    </div>
                    <button class="delete-vehicle-btn"
                            data-vehicle-index="${index}"
                            data-make="${vehicle.make}"
                            data-model="${vehicle.model}"
                            data-year="${vehicle.year}"
                            data-created-at="${vehicle.createdAt}"
                            aria-label="Delete ${vehicle.year} ${vehicle.make} ${vehicle.model}">Delete</button>
                `;
                savedVehiclesContainer.appendChild(vehicleCard);
            });

            document.querySelectorAll('#savedVehicles .delete-vehicle-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const vehicleToDelete = {
                        make: e.target.dataset.make,
                        model: e.target.dataset.model,
                        year: parseInt(e.target.dataset.year),
                        createdAt: vehicles[parseInt(e.target.dataset.vehicleIndex)].createdAt
                    };
                    await deleteVehicleFromArray(vehicleToDelete, e.target);
                });
            });
        }
    } catch (error) {
        console.error("[Garage ERROR] Error in renderSavedVehicles:", error);
        noVehiclesMessage.textContent = 'Error loading your vehicles. Please try again.';
        noVehiclesMessage.style.display = 'block';
        savedVehiclesContainer.appendChild(noVehiclesMessage);
        showNotification("Error loading saved vehicles: " + error.message, "error", 5000);
    }
    checkAndShowGreaseMonkeyBanner();
}

async function deleteVehicleFromArray(vehicleToDelete, button) {
    const userGarageDocRef = getUserGarageDocRefForArrays();
    if (!userGarageDocRef) {
        showNotification("Please log in to delete vehicles.", "error");
        return;
    }

    setButtonLoading(button, true);

    try {
        await updateDoc(userGarageDocRef, {
            [FIRESTORE_VEHICLES_FIELD]: arrayRemove(vehicleToDelete)
        });
        showNotification(`Vehicle "${vehicleToDelete.year} ${vehicleToDelete.make} ${vehicleToDelete.model}" deleted.`, 'info');
        setTimeout(async () => {
                        await renderSavedVehicles();
                        await loadVehicleForProducts();
                    });
                }
                catch (error) {
                    console.error("[Garage ERROR] Error deleting vehicle:", error);
                    showNotification("Error deleting vehicle: " + error.message, "error", 5000);
                }
                finally {
                    setButtonLoading(button, false);
                }
            }