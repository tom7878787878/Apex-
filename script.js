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
let savedVehiclesContainer;
let noVehiclesMessage;

let makeSelect;
let modelSelect;
let yearSelect;

// --- Wishlist Elements (assigned in DOMContentLoaded) ---
let featuredProductsGrid;
let wishlistItemsContainer;
let clearWishlistButton;
// Removed: wishlistInitialMessage; // This element is dynamically handled within loadWishlist

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

// Global variable for selected vehicle
let selectedVehicleForSearch = null;

// Firebase Firestore constants
const FIRESTORE_VEHICLES_FIELD = 'vehicles'; // Field name for vehicles array
const FIRESTORE_WISHLIST_FIELD = 'wishlist'; // Field name for wishlist array
const FIRESTORE_USERS_COLLECTION = 'users'; // Top-level collection for user profiles (general info)
const FIRESTORE_GARAGES_COLLECTION = 'garages'; // Top-level collection for vehicle/wishlist data
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
        hamburgerMenu.setAttribute('aria-expanded', 'false'); // Accessibility
    }

    // Load data specific to the page being shown
    if (id === 'products') {
        loadVehicleForProducts();
    } else if (id === 'garage') {
        renderSavedVehicles();
        fetchMakes(); // IMPORTANT: This triggers fetching and filtering
    } else if (id === 'wishlist') {
        loadWishlist(); // Ensure wishlist is loaded when navigating to it
    } else if (id === 'profile') {
        loadProfile();
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
        // Ensure error messages are visible
        errorSpan.style.display = 'block';
    } else {
        console.warn(`[FormError] Error span with ID '${elementId}' not found.`);
    }
}

function clearFormErrors(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.querySelectorAll('.error-message').forEach(span => {
            span.textContent = '';
            // Ensure error messages are hidden when cleared
            span.style.display = 'none';
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
    // Ensure all required DOM elements are assigned before calling updateAuthStateUI
    if (!userEmailSpan || !googleLoginBtn || !logoutBtn) {
        document.addEventListener('DOMContentLoaded', () => {
            updateAuthStateUI(user, userEmailSpan);
        }, { once: true });
    } else {
        updateAuthStateUI(user, userEmailSpan);
    }
});

function updateAuthStateUI(user, emailSpanElement) {
    // Style for Google Login and Logout buttons
    if (googleLoginBtn) {
        googleLoginBtn.style.padding = '10px 20px';
        googleLoginBtn.style.fontSize = '1.1em';
        googleLoginBtn.style.fontWeight = 'bold';
    }
    if (logoutBtn) {
        logoutBtn.style.padding = '10px 20px';
        logoutBtn.style.fontSize = '1.1em';
        logoutBtn.style.fontWeight = 'bold';
    }


    if (user) {
        emailSpanElement.textContent = `Logged in as: ${user.email}`;

        // Load data for all relevant sections when user logs in
        renderSavedVehicles(); // My Garage vehicles
        loadWishlist();       // My Wishlist items
        loadProfile();        // My Profile details and vehicles

        // If currently on auth page, redirect to home
        if (document.querySelector('.page.active')?.id === 'auth') {
            showPage('home');
        }
        clearAuthFields(); // Clear fields after successful login/registration

        // Create initial user document in 'users' collection if it doesn't exist
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

        // Create initial user garage/wishlist document in 'garages' collection if it doesn't exist
        const userGarageDocRef = doc(db, FIRESTORE_GARAGES_COLLECTION, user.uid);
        getDoc(userGarageDocRef).then((docSnap) => {
            if (!docSnap.exists()) {
                console.log("[Firestore] Creating new user garage document in 'garages' collection for:", user.uid);
                setDoc(userGarageDocRef, {
                    [FIRESTORE_VEHICLES_FIELD]: [], // Initialize vehicles array
                    [FIRESTORE_WISHLIST_FIELD]: [], // Initialize wishlist array
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
        // If logged out from a user-specific page, redirect to auth page
        if (document.querySelector(".page.active")?.id === "garage" ||
            document.querySelector(".page.active")?.id === "wishlist" ||
            document.querySelector(".page.active")?.id === "profile") {
            showPage("auth");
        }
        clearAuthFields(); // Clear fields upon logout
        // Clear data displayed on user-specific sections upon logout
        renderSavedVehicles(); // Clears vehicles in Garage
        loadWishlist();       // Clears wishlist
        loadProfile();        // Clears profile fields
        showNotification("Logged out.", 'info', 2000);
    }
}

// --- DOMContentLoaded: Assign elements and attach all listeners ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("[DOM] DOMContentLoaded fired. Assigning DOM elements and attaching listeners.");

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


    // Assign Wishlist Elements
    featuredProductsGrid = document.getElementById('featuredProductsGrid');
    wishlistItemsContainer = document.getElementById('wishlistItems');
    clearWishlistButton = document.getElementById('clearWishlistBtn');


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

    // --- Attach Event Listeners (only if elements exist) ---

    // Hamburger Menu Logic
    if (hamburgerMenu && navLinks) {
        hamburgerMenu.addEventListener('click', (event) => {
            event.stopPropagation();
            navLinks.classList.toggle('active');
            hamburgerMenu.classList.toggle('open');
            hamburgerMenu.setAttribute('aria-expanded', navLinks.classList.contains('active').toString()); // Accessibility
        });
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                    hamburgerMenu.classList.remove('open');
                    hamburgerMenu.setAttribute('aria-expanded', 'false'); // Accessibility
                }
            });
        });
        document.addEventListener('click', (event) => {
            if (!navLinks.contains(event.target) && !hamburgerMenu.contains(event.target) && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                hamburgerMenu.classList.remove('open');
                hamburgerMenu.setAttribute('aria-expanded', 'false'); // Accessibility
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
                clearAuthFields(); // Clear fields on successful login
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
                clearAuthFields(); // Clear fields on successful registration
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

        // Password Strength Indicator (for Registration Form)
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
                clearAuthFields(); // Clear fields on successful Google login
            } catch (err) {
                if (err.code === 'auth/popup-closed-by-user') {
                    showNotification("Google login cancelled.", "info");
                } else if (err.code === 'auth/cancelled-popup-request') {
                    showNotification("Login attempt already in progress.", "info");
                } else {
                    errorMessage = err.message; // Ensure errorMessage is defined
                    showNotification("Google login error: " + errorMessage, "error", 5000);
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
                clearAuthFields(); // Clear fields on logout (though auth state change will also trigger this)
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
            toggleLoginPassBtn.textContent = type === 'password' ? '👁️' : '🙈';
        });
    } else { console.warn("[DOM] Login password toggle not found."); }

    if (toggleRegPassBtn && regPassInput) {
        toggleRegPassBtn.addEventListener('click', () => {
            const type = regPassInput.getAttribute('type') === 'password' ? 'text' : 'password';
            regPassInput.setAttribute('type', type);
            toggleRegPassBtn.setAttribute('aria-label', type === 'password' ? 'Show password' : 'Hide password');
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

                // Wait for Firestore update to reflect, then re-render
                setTimeout(async () => {
                    await renderSavedVehicles();
                    await loadVehicleForProducts();
                    await loadProfileVehicles(auth.currentUser.uid);
                }, 500); // Small delay to allow Firestore to propagate
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
                // setDoc with merge:true will create the document if it doesn't exist
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
            }
            catch (error) {
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
                // setDoc with merge:true will create the document if it doesn't exist
                await setDoc(userProfileDocRef, {
                    newsletterSubscription: isSubscribed,
                    lastUpdated: serverTimestamp()
                }, { merge: true });

                showNotification("Preferences updated successfully!", "success");
            }
            catch (error) {
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
                // 1. Re-authenticate the user (Firebase security requirement)
                const credential = EmailAuthProvider.credential(user.email, password);
                await reauthenticateWithCredential(user, credential);
                console.log("[Profile] Re-authentication successful. Proceeding with deletion...");
                showNotification("Re-authentication successful. Deleting account...", "info");

                // 2. Delete user's Firestore data (VERY IMPORTANT!)
                // Delete the main user profile document from 'users' collection
                const userProfileDocRef = getUserProfileDocRef();
                if (userProfileDocRef) {
                    await deleteDoc(userProfileDocRef);
                    console.log("[Profile] User profile document deleted from 'users' collection.");
                }

                // Delete the user's garage document from 'garages' collection (which contains vehicles and wishlist arrays)
                const userGarageDocRef = getUserGarageDocRefForArrays();
                if (userGarageDocRef) {
                    await deleteDoc(userGarageDocRef);
                    console.log("[Profile] User garage/wishlist document deleted from 'garages' collection.");
                }


                // NOTE: If orders or other data are stored in separate top-level collections
                // but linked by userId, you would need to query those collections and delete them here.
                // Example:
                // const ordersCollectionRef = collection(db, 'orders');
                // const ordersQuery = query(ordersCollectionRef, where('userId', '==', user.uid));
                // const orderDocs = await getDocs(ordersQuery);
                // const deleteOrderPromises = orderDocs.docs.map(d => deleteDoc(d.ref));
                // await Promise.all(deleteOrderPromises);


                // 3. Delete Firebase Authentication account
                await deleteUser(user);
                console.log("[Profile] Firebase Auth user account deleted.");

                showNotification("Your account and all associated data have been permanently deleted.", "success", 7000);
                // Auth state listener will handle UI redirect to home/auth
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
                    const errorMessage = error.message;
                    showNotification(`Account deletion failed: ${errorMessage}`, "error", 7000);
                }
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
    showPage('home'); // This will trigger fetchMakes for the garage page implicitly
});

// --- Helper Functions (defined outside DOMContentLoaded so they are globally accessible) ---

// Get the DocumentReference for the current user's profile in the 'users' collection
function getUserProfileDocRef() {
    if (!auth.currentUser) {
        console.warn("[Helper] getUserProfileDocRef: No current user logged in.");
        return null;
    }
    return doc(db, FIRESTORE_USERS_COLLECTION, auth.currentUser.uid);
}

// Get the DocumentReference for the user's garage/wishlist data in the 'garages' collection
// This is for the structure where vehicles/wishlist are arrays directly in this document
function getUserGarageDocRefForArrays() {
    if (!auth.currentUser) {
        console.warn("[Helper] getUserGarageDocRefForArrays: No current user logged in.");
        return null;
    }
    return doc(db, FIRESTORE_GARAGES_COLLECTION, auth.currentUser.uid);
}


// Fetches vehicles from the user's dedicated 'garages' document (as an array field)
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

// Renders saved vehicles in the My Garage page
async function renderSavedVehicles() {
    const savedVehiclesContainer = document.getElementById('savedVehicles');
    const noVehiclesMessage = document.getElementById('noVehiclesMessage');

    if (!savedVehiclesContainer || !noVehiclesMessage) {
        console.warn("[DOM] Garage display elements not found for rendering (renderSavedVehicles).");
        return;
    }

    savedVehiclesContainer.innerHTML = ''; // Clear previous content
    noVehiclesMessage.textContent = 'Loading your vehicles...';
    noVehiclesMessage.style.display = 'block';
    savedVehiclesContainer.appendChild(noVehiclesMessage);


    if (!auth.currentUser) {
        noVehiclesMessage.textContent = 'Please log in to save your vehicles.';
        return;
    }

    try {
        const vehicles = await getSavedVehiclesFromFirestore();
        savedVehiclesContainer.innerHTML = ''; // Clear loading message now that data is fetched

        if (vehicles.length === 0) {
            noVehiclesMessage.textContent = 'No vehicles saved yet. Add one above!';
            noVehiclesMessage.style.display = 'block';
            savedVehiclesContainer.appendChild(noVehiclesMessage);
        } else {
            noVehiclesMessage.style.display = 'none'; // Hide the message if vehicles exist
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

            // Attach listeners after all cards are added
            document.querySelectorAll('#savedVehicles .delete-vehicle-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const vehicleToDelete = {
                        make: e.target.dataset.make,
                        model: e.target.dataset.model,
                        year: parseInt(e.target.dataset.year),
                        createdAt: parseInt(e.target.dataset.createdAt) // Crucial for arrayRemove to match exactly
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
}

// Deletes a vehicle from the array field within the garage document
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
        setTimeout(async () => { // Small delay for Firestore sync
            await renderSavedVehicles();
            await loadVehicleForProducts();
            await loadProfileVehicles(auth.currentUser.uid);
        }, 500);
    } catch (error) {
        console.error("[Garage ERROR] Error deleting vehicle from array:", error);
        showNotification("Error deleting vehicle: " + error.message, "error");
    } finally {
        setButtonLoading(button, false);
    }
}


// --- Vehicle API Integration (NHTSA API) ---

const NHTSA_API_BASE_URL = 'https://vpic.nhtsa.dot.gov/api/vehicles';

// IMPORTANT: Moved automobileMakesWhitelist to global scope for absolute certainty
const automobileMakesWhitelist = [
    "Acura", "Alfa Romeo", "Audi", "BMW", "Buick", "Cadillac", "Chevrolet", "Chrysler",
    "Dodge", "Fiat", "Ford", "Genesis", "GMC", "Honda", "Hyundai", "Infiniti", "Isuzu",
    "Jaguar", "Jeep", "Kia", "Land Rover", "Lexus", "Lincoln", "Lucid", "Maserati", "Mazda",
    "McLaren", "Mercedes-Benz", "Mini", "Mitsubishi", "Nissan", "Oldsmobile",
    "Polestar", "Porsche", "Ram", "Rivian", "Rolls-Royce", "Subaru", "Suzuki", "Tesla", "Toyota",
    "Volkswagen", "Volvo", "Hummer",
];


/**
 * Fetches vehicle makes from the NHTSA API and populates the makeSelect dropdown.
 */
async function fetchMakes() {
    if (!makeSelect) {
        console.warn("[API] Make select element not found.");
        return;
    }
    makeSelect.innerHTML = '<option value="">-- Loading Makes... --</option>';
    makeSelect.disabled = true; // Disable while loading

    try {
        const response = await fetch(`${NHTSA_API_BASE_URL}/GetAllMakes?format=json`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const makes = data.Results; // Array of { Make_ID, Make_Name }

        // Filter for common automobile makes using the globally defined whitelist
        const filteredMakes = makes.filter(make =>
            automobileMakesWhitelist.includes(make.Make_Name)
        );

        // Clear existing options
        makeSelect.innerHTML = '<option value="">-- Select Make --</option>';
        filteredMakes.sort((a, b) => a.Make_Name.localeCompare(b.Make_Name)); // Sort alphabetically
        filteredMakes.forEach(make => {
            const option = document.createElement('option');
            option.value = make.Make_Name;
            option.textContent = make.Make_Name;
            makeSelect.appendChild(option);
        });
        makeSelect.disabled = false; // Enable make selection
    } catch (error) {
        console.error('Error fetching makes:', error);
        showNotification('Failed to load vehicle makes. Please try again later.', 'error');
        makeSelect.innerHTML = '<option value="">-- Error Loading Makes --</option>';
        makeSelect.disabled = true; // Keep disabled on error
    }
}

/**
 * Fetches models for a given make from the NHTSA API and populates the modelSelect dropdown.
 * @param {string} makeName - The name of the selected vehicle make.
 */
async function fetchModelsByMake(makeName) {
    if (!modelSelect || !yearSelect) {
        console.warn("[API] Model or Year select elements not found.");
        return;
    }
    modelSelect.innerHTML = '<option value="">-- Loading Models... --</option>';
    modelSelect.disabled = true;
    yearSelect.innerHTML = '<option value="">-- Select Year --</option>';
    yearSelect.disabled = true;

    if (!makeName) { // If no make is selected, reset models and years
        modelSelect.innerHTML = '<option value="">-- Select Model --</option>';
        modelSelect.disabled = true;
        yearSelect.innerHTML = '<option value="">-- Select Year --</option>';
        yearSelect.disabled = true;
        return;
    }

    try {
        const encodedMakeName = encodeURIComponent(makeName);
        const response = await fetch(`${NHTSA_API_BASE_URL}/GetModelsForMake/${encodedMakeName}?format=json`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const models = data.Results;

        modelSelect.innerHTML = '<option value="">-- Select Model --</option>';
        if (models && models.length > 0) {
            models.sort((a, b) => a.Model_Name.localeCompare(b.Model_Name));
            models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.Model_Name;
                option.textContent = model.Model_Name;
                modelSelect.appendChild(option);
            });
            modelSelect.disabled = false;
        } else {
            showNotification(`No models found for ${makeName}.`, 'info');
            modelSelect.innerHTML = '<option value="">-- No Models Found --</option>';
            modelSelect.disabled = true;
        }
        yearSelect.innerHTML = '<option value="">-- Select Year --</option>';
        yearSelect.disabled = true;
    } catch (error) {
        console.error('Error fetching models:', error);
        showNotification(`Failed to load models for ${makeName}. Please try again.`, 'error');
        modelSelect.innerHTML = '<option value="">-- Error Loading Models --</option>';
        modelSelect.disabled = true;
        yearSelect.disabled = true;
    }
}

/**
 * Populates the yearSelect dropdown with a reasonable range of years.
 */
function populateYears() {
    if (!yearSelect) {
        console.warn("[API] Year select element not found.");
        return;
    }
    yearSelect.innerHTML = '<option value="">-- Select Year --</option>';
    const currentYear = new Date().getFullYear();
    for (let year = currentYear + 1; year >= currentYear - 30; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }
    yearSelect.disabled = false;
}


// Loads vehicle data for the Products page's search and filtering options
async function loadVehicleForProducts() {
    const productContentDiv = document.getElementById('productContent');
    if (!productContentDiv) {
        console.warn("[DOM] Product content div not found for loadVehicleForProducts.");
        return;
    }

    productContentDiv.innerHTML = '<p class="no-items-message">Loading vehicle search options...</p>';


    if (!auth.currentUser) {
        productContentDiv.innerHTML = `
            <div class="no-vehicle-message">
                <h3>Please Log In or Save Your Vehicle</h3>
                <p>To get personalized part searches, please <a href="#" onclick="showPage('auth')">log in</a> or go to <a href="#" onclick="showPage('garage')">My Garage</a> to save your vehicle details.</p>
            </div>
        `;
        selectedVehicleForSearch = null;
        return;
    }

    try {
        const vehicles = await getSavedVehiclesFromFirestore();

        if (vehicles.length > 0) {
            if (!selectedVehicleForSearch || !vehicles.some(v =>
                v.make === selectedVehicleForSearch.make &&
                v.model === selectedVehicleForSearch.model &&
                v.year === selectedVehicleForSearch.year)
            ) {
                selectedVehicleForSearch = vehicles[0];
            }

            let vehicleOptionsHtml = vehicles.map((v, index) => `
                <option value="${index}" ${
                    (selectedVehicleForSearch && vehicles.indexOf(selectedVehicleForSearch) === index)
                    ? 'selected' : ''
                }>
                    ${v.year} ${v.make} ${selectedVehicleForSearch.model}
                </option>
            `).join('');

            let htmlContent = `
                <div class="select-vehicle-container">
                    <label for="vehicleSelect">Select Your Vehicle:</label>
                    <select id="vehicleSelect">
                        ${vehicleOptionsHtml}
                    </select>
                </div>

                <h3 style="text-align: center; margin-top: 2rem;">Parts for Your <span id="currentSearchVehicle">${selectedVehicleForSearch.year} ${selectedVehicleForSearch.make} ${selectedVehicleForSearch.model}</span></h3>

                <div class="general-search-section">
                    <label for="generalProductSearch" class="sr-only">Search Parts by Keyword</label>
                    <input type="text" id="generalProductSearch" placeholder="Search for any part (e.g., 'alternator')" />
                    <button id="generalSearchButton">Search</button>
                </div>

                <p style="text-align: center; margin-top: 2rem; margin-bottom: 1.5rem;">Or click a category below to search Amazon directly for your vehicle:</p>
                <div class="category-buttons">
                    <button onclick="window.searchAmazonSpecific('${selectedVehicleForSearch.year}', '${selectedVehicleForSearch.make}', '${selectedVehicleForSearch.model}', 'Brake Pads')">Brake Pads</button>
                    <button onclick="window.searchAmazonSpecific('${selectedVehicleForSearch.year}', '${selectedVehicleForSearch.make}', '${selectedVehicleForSearch.model}', 'Oil Filter')">Oil Filter</button>
                    <button onclick="window.searchAmazonSpecific('${selectedVehicleForSearch.year}', '${selectedVehicleForSearch.make}', '${selectedVehicleForSearch.model}', 'Air Filter')">Air Filter</button>
                    <button onclick="window.searchAmazonSpecific('${selectedVehicleForSearch.year}', '${selectedVehicleForSearch.make}', '${selectedVehicleForSearch.model}', 'Spark Plugs')">Spark Plugs</button>
                    <button onclick="window.searchAmazonSpecific('${selectedVehicleForSearch.year}', '${selectedVehicleForSearch.make}', '${selectedVehicleForSearch.model}', 'Suspension Kit')">Suspension Kit</button>
                    <button onclick="window.searchAmazonSpecific('${selectedVehicleForSearch.year}', '${selectedVehicleForSearch.make}', '${selectedVehicleForSearch.model}', 'Headlights')">Headlights</button>
                    <button onclick="window.searchAmazonSpecific('${selectedVehicleForSearch.year}', '${selectedVehicleForSearch.make}', '${selectedVehicleForSearch.model}', 'Tail Lights')">Tail Lights</button>
                    <button onclick="window.searchAmazonSpecific('${selectedVehicleForSearch.year}', '${selectedVehicleForSearch.make}', '${selectedVehicleForSearch.model}', 'Windshield Wipers')">Wiper Blades</button>
                    <button onclick="window.searchAmazonSpecific('${selectedVehicleForSearch.year}', '${selectedVehicleForSearch.make}', '${selectedVehicleForSearch.model}', 'Radiator')">Radiator</button>
                    <button onclick="window.searchAmazonSpecific('${selectedVehicleForSearch.year}', '${selectedVehicleForSearch.make}', '${selectedVehicleForSearch.model}', 'Battery')">Battery</button>
                    </div>
            `;
            productContentDiv.innerHTML = htmlContent;

            const vehicleSelect = document.getElementById('vehicleSelect');
            const currentSearchVehicleSpan = document.getElementById('currentSearchVehicle');

            if (vehicleSelect) {
                vehicleSelect.addEventListener('change', (event) => {
                    const selectedIndex = parseInt(event.target.value);
                    selectedVehicleForSearch = vehicles[selectedIndex];
                    if (currentSearchVehicleSpan) {
                         currentSearchVehicleSpan.textContent = `${selectedVehicleForSearch.year} ${selectedVehicleForSearch.make} ${selectedVehicleForSearch.model}`;
                    }
                });
            }

            const generalSearchInput = document.getElementById('generalProductSearch');
            const generalSearchButton = document.getElementById('generalSearchButton');

            if (generalSearchInput && generalSearchButton) {
                generalSearchInput.addEventListener('keypress', (event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        window.searchAmazonGeneral(selectedVehicleForSearch.year, selectedVehicleForSearch.make, selectedVehicleForSearch.model);
                    }
                });

                generalSearchButton.addEventListener('click', () => {
                    window.searchAmazonGeneral(selectedVehicleForSearch.year, selectedVehicleForSearch.make, selectedVehicleForSearch.model);
                });
            }


        } else {
            productContentDiv.innerHTML = `
                <div class="no-vehicle-message">
                    <h3>No Vehicle Saved</h3>
                    <p>You haven't saved a vehicle yet. Please go to <a href="#" onclick="showPage('garage')">My Garage</a> to add your vehicle details to get personalized part suggestions.</p>
                </div>
            `;
             showNotification("No vehicle saved. Please add one in My Garage!", "info", 5000);
        }
    } catch (err) {
        console.error("[Product ERROR] Error loading vehicle for products page:", err);
        productContentDiv.innerHTML = `
            <div class="no-vehicle-message">
                <h3>Error Loading Vehicle</h3>
                <p>There was an error loading your vehicle data. Please try again or <a href="#" onclick="showPage('auth')">log in</a>.</p>
            </div>
        `;
        showNotification("Error loading vehicle data for products: " + err.message, "error", 5000);
    }
}

// --- NEW: Globally accessible search functions ---
window.searchAmazonSpecific = function(year, make, model, partType) {
    const query = `${partType} ${year} ${make} ${model}`;
    const url = `https://www.amazon.com/s?k=${encodeURIComponent(query)}&tag=${amazonTag}`;
    window.open(url, "_blank");
}

window.searchAmazonGeneral = function(year, make, model) {
    const searchInput = document.getElementById('generalProductSearch');
    let query = searchInput.value.trim();

    if (query) {
        query = `${query} ${year} ${make} ${model}`;
        const url = `https://www.amazon.com/s?k=${encodeURIComponent(query)}&tag=${amazonTag}`;
        window.open(url, "_blank");
        searchInput.value = '';
    } else {
        showNotification("Please enter a search term.", "info");
    }
}

// Adds a product to the 'wishlist' array field within the garage document
async function addToWishlist(product) {
    const userGarageDocRef = getUserGarageDocRefForArrays();
    if (!userGarageDocRef) {
        showNotification("Please log in to add items to your wishlist.", "error");
        return;
    }

    try {
        const userGarageDocSnap = await getDoc(userGarageDocRef);
        let currentWishlist = userGarageDocSnap.exists() ? userGarageDocSnap.data()[FIRESTORE_WISHLIST_FIELD] || [] : [];

        // Check if product already exists in wishlist using its 'id' field
        const exists = currentWishlist.some(item => item.id === product.id);

        if (!exists) {
            const productWithTimestamp = { ...product, addedAt: Date.now() };

            if (!userGarageDocSnap.exists()) {
                // If garage document doesn't exist, create it with this first wishlist item
                await setDoc(userGarageDocRef, {
                    [FIRESTORE_WISHLIST_FIELD]: [productWithTimestamp],
                    [FIRESTORE_VEHICLES_FIELD]: [], // Also initialize vehicles field as empty array
                    createdAt: serverTimestamp() // Add document creation timestamp
                });
            } else {
                // If garage document exists, just update the wishlist array
                await updateDoc(userGarageDocRef, {
                    [FIRESTORE_WISHLIST_FIELD]: arrayUnion(productWithTimestamp)
                });
            }
            showNotification(`${product.name} added to wishlist!`, "success");
            loadWishlist(); // Always reload the wishlist display after adding an item
        } else {
            showNotification(`${product.name} is already in your wishlist.`, "info");
        }
    } catch (error) {
        console.error("[Wishlist ERROR] Error adding to wishlist:", error);
        showNotification(`Failed to add ${product.name} to wishlist: ${error.message}`, "error");
    }
}

// Removes a product from the 'wishlist' array field within the garage document
async function removeFromWishlist(productId, button) {
    const userGarageDocRef = getUserGarageDocRefForArrays();
    if (!userGarageDocRef) {
        showNotification("Please log in to manage your wishlist.", "error");
        return;
    }

    setButtonLoading(button, true);

    try {
        const userGarageDocSnap = await getDoc(userGarageDocRef);
        const currentWishlist = userGarageDocSnap.exists() ? userGarageDocSnap.data()[FIRESTORE_WISHLIST_FIELD] || [] : [];

        // Find the exact item to remove from the array by its 'id'
        const itemToRemove = currentWishlist.find(item => item.id === productId);

        if (itemToRemove) {
            await updateDoc(userGarageDocRef, {
                [FIRESTORE_WISHLIST_FIELD]: arrayRemove(itemToRemove)
            });
            showNotification("Product removed from wishlist.", "info");
            loadWishlist(); // Always reload the wishlist display after removing
        } else {
            showNotification("Product not found in wishlist (already removed?).", "info");
        }
    } catch (error) {
        console.error("[Wishlist ERROR] Error removing from wishlist:", error);
        showNotification("Failed to remove product from wishlist: " + error.message, "error");
    } finally {
        setButtonLoading(button, false);
    }
}

// Clears all items from the 'wishlist' array field within the garage document
async function clearWishlist(button) {
    const userGarageDocRef = getUserGarageDocRefForArrays();
    if (!userGarageDocRef) {
        showNotification("Please log in to clear your wishlist.", "error");
        return;
    }

    setButtonLoading(button, true);

    try {
        // We only clear if the document exists. If it's empty, there's nothing to clear.
        const userGarageDocSnap = await getDoc(userGarageDocRef);
        if (userGarageDocSnap.exists()) {
            await updateDoc(userGarageDocRef, {
                [FIRESTORE_WISHLIST_FIELD]: []
            });
            showNotification("Wishlist cleared!", "info");
        } else {
            showNotification("Your wishlist is already empty.", "info");
        }
        loadWishlist(); // Always reload the wishlist display after clearing
    } catch (error) {
        console.error("[Wishlist ERROR] Error clearing wishlist:", error);
        showNotification("Failed to clear wishlist: " + error.message, "error");
    } finally {
        setButtonLoading(button, false);
    }
}

// Fetches wishlist items from the user's dedicated 'garages' document (as an array field)
async function getWishlistFromFirestore() {
    const userGarageDocRef = getUserGarageDocRefForArrays();
    if (!userGarageDocRef) {
        console.log("[Firestore] getWishlistFromFirestore: Not logged in, returning empty array.");
        return [];
    }

    try {
        const docSnap = await getDoc(userGarageDocRef);
        if (docSnap.exists()) {
            return docSnap.data()[FIRESTORE_WISHLIST_FIELD] || [];
        }
        return [];
    } catch (error) {
        console.error("[Firestore ERROR] Error getting wishlist from Firestore:", error);
        showNotification("Error loading wishlist.", "error");
        return [];
    }
}

// NEW: Refactored loadWishlist function for clearer rendering logic
async function loadWishlist() {
    const wishlistItemsContainer = document.getElementById('wishlistItems');
    const clearWishlistButton = document.getElementById('clearWishlistBtn');

    if (!wishlistItemsContainer || !clearWishlistButton) {
        console.warn("[DOM] Wishlist display elements not found (loadWishlist).");
        return;
    }

    wishlistItemsContainer.innerHTML = '<p class="no-items-message">Loading wishlist...</p>';
    clearWishlistButton.style.display = 'none'; // Hide clear button by default

    if (!auth.currentUser) {
