// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut, sendPasswordResetEmail, updateProfile } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCbASk2ttihM-k3Noo1uhTCCsuc2FBBiSc",
  authDomain: "apex-ad8c0.firebaseapp.com",
  projectId: "apex-ad8c0",
  storageBucket: "apex-ad8c0.firebasestorage.app",
  messagingSenderId: "243749227658",
  appId: "1:243749227658:web:3ac6fba9aac3105abcb173",
  measurementId: "G-SKZY7WC4E3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app); // Analytics might not be strictly necessary for basic functionality, but good to have
const auth = getAuth(app);
const db = getFirestore(app);


// Amazon Affiliate Tag
const amazonTag = "everythi09e02-20";

// --- Global DOM Elements (assigned in DOMContentLoaded) ---
let navLinks;
let hamburgerMenu;
let userEmailSpan;
let notificationContainer;

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
let makeInput;
let modelInput;
let yearInput;
let savedVehiclesContainer;
let noVehiclesMessage;

// --- Products Page Elements (assigned in DOMContentLoaded) ---
let productContentDiv; // Renamed for clarity
let featuredProductsGrid;

// --- Wishlist Elements (assigned in DOMContentLoaded) ---
let wishlistItemsContainer;
let clearWishlistButton;
let wishlistEmptyMessage; // Ensure this is also assigned if used

// --- Profile Elements (assigned in DOMContentLoaded) ---
let profileEmailSpan;
let changePasswordBtn;
let updateProfileForm;
let displayNameInput;
let saveProfileBtn;

// --- Contact Form Elements (assigned in DOMContentLoaded) ---
let contactForm;

// NEW Global variable for selected vehicle
let selectedVehicleForSearch = null;

// --- Firebase Firestore Constants ---
const FIRESTORE_VEHICLES_FIELD = 'vehicles';
const MAX_VEHICLES = 3;


// --- Page Navigation ---
window.showPage = function(id) {
    console.log(`Showing page: ${id}`);
    document.querySelectorAll(".page").forEach(p => {
        p.classList.remove("active");
        p.setAttribute('aria-hidden', 'true'); // Hide from screen readers when not active
    });
    const pageElement = document.getElementById(id);
    if (pageElement) {
        pageElement.classList.add("active");
        pageElement.setAttribute('aria-hidden', 'false'); // Show to screen readers when active
    } else {
        console.error(`Page element with ID '${id}' not found!`);
    }

    // Close hamburger menu on navigation for mobile
    if (hamburgerMenu && navLinks) {
        if (navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
            hamburgerMenu.classList.remove('open'); // Assuming 'open' class for hamburger icon animation
            hamburgerMenu.setAttribute('aria-expanded', 'false');
        }
    }

    // Trigger data loading for specific pages
    if (id === 'products') {
        loadVehicleForProducts();
    } else if (id === 'garage') {
        renderSavedVehicles();
    } else if (id === 'wishlist') {
        loadWishlist();
    } else if (id === 'profile') {
        loadProfile();
    }
}

// --- Notification System ---
function showNotification(message, type = 'info', duration = 3000) {
    if (!notificationContainer) {
        console.warn("Notification container not found! Cannot display notification.");
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
        clearTimeout(timeoutId); // Clear the auto-remove timeout if user closes manually
        notification.remove();
    });
    console.log(`Notification shown: ${message} (${type})`);
}


// --- Form Error Display Helper ---
function displayFormError(elementId, message) {
    const errorSpan = document.getElementById(elementId);
    if (errorSpan) {
        errorSpan.textContent = message;
        errorSpan.setAttribute('role', 'alert'); // Announce error to screen readers
    } else {
        console.warn(`Error span with ID ${elementId} not found.`);
    }
}

function clearFormErrors(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.querySelectorAll('.error-message').forEach(span => {
            span.textContent = '';
            span.removeAttribute('role'); // Remove role when no error
        });
    }
}

// Function to clear auth form fields
function clearAuthFields() {
    console.log("Attempting to clear auth fields.");
    if (loginEmailInput) loginEmailInput.value = "";
    if (loginPassInput) loginPassInput.value = "";
    if (regEmailInput) regEmailInput.value = "";
    if (regPassInput) regPassInput.value = "";

    if (passwordStrengthIndicator) {
        passwordStrengthIndicator.textContent = '';
        passwordStrengthIndicator.className = 'password-strength'; // Reset class
    }
    clearFormErrors('loginForm');
    clearFormErrors('registerForm');
    console.log("Auth fields clear attempt complete.");
}

// --- Button Loading State Management ---
const originalButtonTexts = new Map();

function setButtonLoading(button, isLoading) {
    if (!button) {
        console.warn("setButtonLoading: Button element is null or undefined.");
        return;
    }

    if (isLoading) {
        if (!originalButtonTexts.has(button)) {
            originalButtonTexts.set(button, button.textContent);
        }
        button.textContent = 'Loading...';
        button.classList.add('is-loading');
        button.disabled = true;
        // Optionally add a loading spinner or icon via CSS
    } else {
        if (originalButtonTexts.has(button)) {
            button.textContent = originalButtonTexts.get(button);
            originalButtonTexts.delete(button);
        }
        button.classList.remove('is-loading');
        button.disabled = false;
        // Optionally remove loading spinner/icon
    }
}

// --- Auth State Listener ---
onAuthStateChanged(auth, user => {
    console.log("Auth state changed. User:", user ? user.email : "none");
    // Ensure DOM elements are available before updating UI
    if (document.readyState === 'loading') { // If DOM not yet ready, wait for DOMContentLoaded
        document.addEventListener('DOMContentLoaded', () => {
            updateAuthStateUI(user);
        });
    } else { // If DOM is already ready
        updateAuthStateUI(user);
    }
});

function updateAuthStateUI(user) {
    // Ensure userEmailSpan is assigned before using it
    if (!userEmailSpan) {
        userEmailSpan = document.getElementById("userEmail");
    }

    if (userEmailSpan) {
        if (user) {
            userEmailSpan.textContent = `Logged in as: ${user.email}`;
            // Optional: Hide login/register links, show logout
            // You might manage this via CSS classes on nav-links
        } else {
            userEmailSpan.textContent = "";
            // Optional: Show login/register links, hide logout
        }
    }

    // Handle page redirection/updates based on auth state
    const currentPageId = document.querySelector(".page.active")?.id;

    if (user) {
        // If logged in, and on auth page, redirect to home
        if (currentPageId === 'auth') {
            showPage('home');
        }
        clearAuthFields(); // Clear auth form inputs
        // Load user-specific data
        renderSavedVehicles();
        loadWishlist();
        loadProfile();
        showNotification(`Welcome, ${user.displayName || user.email}!`, 'success', 2000);
    } else {
        // If logged out, and on a protected page, redirect to auth
        if (currentPageId === "garage" || currentPageId === "wishlist" || currentPageId === "profile") {
            showPage("auth");
        }
        clearAuthFields(); // Clear auth form inputs
        // Reset UI for logged-out state (e.g., clear saved vehicles display)
        renderSavedVehicles(); // Will show "No vehicles saved yet" or similar
        loadWishlist(); // Will show "Please log in"
        loadProfile(); // Will show "Not logged in"
        showNotification("Logged out.", 'info', 2000);
    }
}

// --- DOMContentLoaded: Assign elements and attach all listeners ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded fired. Assigning DOM elements and attaching listeners.");

    // Assign Global DOM Elements
    navLinks = document.getElementById('navLinks');
    hamburgerMenu = document.getElementById('hamburgerMenu');
    userEmailSpan = document.getElementById('userEmail');
    notificationContainer = document.getElementById('notificationContainer');

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
    passwordStrengthIndicator.className = 'password-strength'; // Base class for styling
    if (regPassInput && regPassInput.parentNode) { // Check for parentNode existence
        regPassInput.parentNode.insertBefore(passwordStrengthIndicator, regPassInput.nextElementSibling || null);
        // Using nextElementSibling for more robust insertion after the input
    } else {
        console.warn("Could not insert password strength indicator. regPassInput or its parent not found.");
    }

    // Assign Garage Form Elements
    garageForm = document.getElementById('garageForm');
    makeInput = document.getElementById("make");
    modelInput = document.getElementById("model");
    yearInput = document.getElementById("year");
    savedVehiclesContainer = document.getElementById('savedVehicles');
    noVehiclesMessage = document.getElementById('noVehiclesMessage');

    // Assign Products Page Elements
    productContentDiv = document.getElementById('productContent');
    featuredProductsGrid = document.getElementById('featuredProductsGrid');

    // Assign Wishlist Elements
    wishlistItemsContainer = document.getElementById('wishlistItems');
    clearWishlistButton = document.getElementById('clearWishlistBtn');
    wishlistEmptyMessage = document.querySelector('#wishlist .no-items-message'); // Ensure this is correctly assigned

    // Assign Profile Elements
    profileEmailSpan = document.getElementById('profileEmail');
    changePasswordBtn = document.getElementById('changePasswordBtn');
    updateProfileForm = document.getElementById('updateProfileForm');
    displayNameInput = document.getElementById('displayNameInput');
    saveProfileBtn = document.getElementById('saveProfileBtn');

    // Assign Contact Form Elements
    contactForm = document.getElementById('contactForm');


    // --- Attach Event Listeners (only if elements exist) ---

    // Hamburger Menu Logic
    if (hamburgerMenu && navLinks) {
        hamburgerMenu.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent click from bubbling to document and closing immediately
            navLinks.classList.toggle('active');
            hamburgerMenu.classList.toggle('open'); // For hamburger icon animation
            const isExpanded = navLinks.classList.contains('active');
            hamburgerMenu.setAttribute('aria-expanded', isExpanded);
        });
        // Close menu when a navigation link is clicked
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                    hamburgerMenu.classList.remove('open');
                    hamburgerMenu.setAttribute('aria-expanded', 'false');
                }
            });
        });
        // Close menu when clicking outside it
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
            console.log("Login form submitted.");
            e.preventDefault();
            const submitBtn = e.submitter;

            clearFormErrors('loginForm');
            let isValid = true;
            if (!loginEmailInput.value) { displayFormError('loginEmailError', 'Email is required.'); isValid = false; }
            if (!loginPassInput.value) { displayFormError('loginPassError', 'Password is required.'); isValid = false; }
            if (!isValid) {
                showNotification('Please fill in all required fields.', 'error');
                // No need to setButtonLoading(false) here, as it hasn't been set to true yet for this path
                return;
            }

            setButtonLoading(submitBtn, true);

            try {
                await signInWithEmailAndPassword(auth, loginEmailInput.value, loginPassInput.value);
                // Auth state listener handles success notification and UI update
            } catch (err) {
                let errorMessage = "An unknown error occurred.";
                if (err.code === 'auth/invalid-email') {
                    errorMessage = "Invalid email format.";
                    displayFormError('loginEmailError', errorMessage);
                } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                    // Combine these for security to prevent user enumeration
                    errorMessage = "Invalid email or password.";
                    displayFormError('loginEmailError', errorMessage); // Show on email field as primary entry point
                    displayFormError('loginPassError', ' '); // Clear any specific pass error
                } else if (err.code === 'auth/invalid-credential') {
                     errorMessage = "Invalid email or password."; // Firebase's more generic error
                     displayFormError('loginEmailError', errorMessage);
                }
                else {
                    errorMessage = err.message;
                }
                showNotification("Login failed: " + errorMessage, "error", 5000);
                console.error("Login error:", err.code, err.message);
            } finally {
                setButtonLoading(submitBtn, false);
            }
        });
    } else { console.warn("Login form or its inputs not found. Login functionality may be impaired."); }


    // Register Form
    if (regForm && regEmailInput && regPassInput) {
        regForm.addEventListener("submit", async (e) => {
            console.log("Register form submitted.");
            e.preventDefault();
            const submitBtn = e.submitter;

            clearFormErrors('registerForm');
            let isValid = true;
            if (!regEmailInput.value) { displayFormError('regEmailError', 'Email is required.'); isValid = false; }
            if (!regPassInput.value) { displayFormError('regPassError', 'Password is required.'); isValid = false; }
            // Add password strength check to validation
            const passwordStrength = checkPasswordStrength(regPassInput.value);
            if (passwordStrength === 'weak') {
                displayFormError('regPassError', 'Password is too weak. Please use at least 6 characters, including numbers, and mixed case.');
                isValid = false;
            }

            if (!isValid) {
                showNotification('Please correct the errors in the form.', 'error');
                return;
            }

            setButtonLoading(submitBtn, true);

            try {
                await createUserWithEmailAndPassword(auth, regEmailInput.value, regPassInput.value);
                // Auth state listener handles success notification and UI update
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
                console.error("Registration error:", err.code, err.message);
            } finally {
                setButtonLoading(submitBtn, false);
            }
        });

        // Password Strength Indicator (for Registration Form)
        if (regPassInput && passwordStrengthIndicator) {
            regPassInput.addEventListener('input', () => {
                const password = regPassInput.value;
                const strength = checkPasswordStrength(password);
                updatePasswordStrengthIndicator(strength);
            });
        }
    } else { console.warn("Register form or its inputs not found. Registration functionality may be impaired."); }


    // Google Login
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', async function() {
            console.log("Google Login clicked.");
            setButtonLoading(googleLoginBtn, true);

            const provider = new GoogleAuthProvider();
            try {
                await signInWithPopup(auth, provider);
                // Auth state listener handles success notification and UI update
            } catch (err) {
                if (err.code === 'auth/popup-closed-by-user') {
                    showNotification("Google login cancelled.", "info");
                } else if (err.code === 'auth/cancelled-popup-request') {
                    showNotification("Login attempt already in progress.", "info");
                } else {
                    showNotification("Google login error: " + err.message, "error", 5000);
                    console.error("Google login error:", err.code, err.message);
                }
            } finally {
                setButtonLoading(googleLoginBtn, false);
            }
        });
    } else { console.warn("Google Login button not found. Google login functionality may be impaired."); }

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function() {
            console.log("Logout clicked.");
            setButtonLoading(logoutBtn, true);

            try {
                await signOut(auth);
                // Auth state listener handles success notification and UI update
            } catch (err) {
                showNotification("Logout error: " + err.message, "error", 5000);
                console.error("Logout error:", err.code, err.message);
            } finally {
                setButtonLoading(logoutBtn, false);
            }
        });
    } else { console.warn("Logout button not found. Logout functionality may be impaired."); }

    // Forgot Password
    if (forgotPasswordLink && loginEmailInput) {
        forgotPasswordLink.addEventListener('click', async (e) => {
            console.log("Forgot Password clicked.");
            e.preventDefault();
            const email = loginEmailInput.value.trim();

            if (!email) {
                displayFormError('loginEmailError', 'Please enter your email to reset password.');
                showNotification('Please enter your email for password reset.', 'error');
                return; // Do not set loading state if validation fails immediately
            }

            setButtonLoading(forgotPasswordLink, true);

            try {
                await sendPasswordResetEmail(auth, email);
                showNotification(`Password reset email sent to ${email}. Please check your inbox.`, 'success', 7000);
                displayFormError('loginEmailError', ''); // Clear error after success
                loginEmailInput.value = ''; // Clear email input
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
                showNotification(`Password reset error: ${errorMessage}`, 'error', 7000);
                console.error("Password reset error:", error.code, error.message);
            } finally {
                setButtonLoading(forgotPasswordLink, false);
            }
        });
    } else { console.warn("Forgot Password link or login email input not found. Password reset functionality may be impaired."); }


    // Password Visibility Toggles
    if (toggleLoginPassBtn && loginPassInput) {
        toggleLoginPassBtn.addEventListener('click', () => {
            const type = loginPassInput.getAttribute('type') === 'password' ? 'text' : 'password';
            loginPassInput.setAttribute('type', type);
            toggleLoginPassBtn.setAttribute('aria-label', type === 'password' ? 'Show password' : 'Hide password');
            toggleLoginPassBtn.textContent = type === 'password' ? '👁️' : '🙈'; // Change icon
        });
    } else { console.warn("Login password toggle not found."); }

    if (toggleRegPassBtn && regPassInput) {
        toggleRegPassBtn.addEventListener('click', () => {
            const type = regPassInput.getAttribute('type') === 'password' ? 'text' : 'password';
            regPassInput.setAttribute('type', type);
            toggleRegPassBtn.setAttribute('aria-label', type === 'password' ? 'Show password' : 'Hide password');
            toggleRegPassBtn.textContent = type === 'password' ? '👁️' : '🙈'; // Change icon
        });
    } else { console.warn("Register password toggle not found."); }


    // --- My Garage Section (Firebase) ---
    if (garageForm && makeInput && modelInput && yearInput && savedVehiclesContainer && noVehiclesMessage) {
        garageForm.addEventListener('submit', async (e) => {
            console.log("Garage form submit handler triggered.");
            e.preventDefault();
            const submitBtn = e.submitter;

            clearFormErrors('garageForm');

            if (!auth.currentUser) {
                console.log("Auth check: User not logged in.");
                showNotification("Please log in to save your vehicle.", "error");
                // Don't set loading state if not logged in
                return;
            }

            const make = makeInput.value.trim();
            const model = modelInput.value.trim();
            const year = parseInt(yearInput.value);

            let isValid = true;
            if (!make) { displayFormError('makeError', 'Make is required.'); isValid = false; }
            if (!model) { displayFormError('modelError', 'Model is required.'); isValid = false; }
            if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 2) { // More realistic year validation
                displayFormError('yearError', `Please enter a valid year (e.g., 1900-${new Date().getFullYear() + 2}).`);
                isValid = false;
            }

            if (!isValid) {
                console.log("Validation failed.");
                showNotification('Please correct the errors in the form.', 'error');
                return; // Do not set loading state if validation fails immediately
            }

            setButtonLoading(submitBtn, true); // Set loading
