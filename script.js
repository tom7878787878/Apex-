// ADDED FOR DEBUGGING: This alert will tell us if the script is being loaded and executed at all.
alert('Apex Auto Parts Script Loaded!');

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
const analytics = getAnalytics(app); // Note: analytics variable is declared but not used in the provided code.
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
let noVehiclesMessage; // ADDED/MODIFIED: This now directly references the P tag in HTML

// --- Wishlist Elements (assigned in DOMContentLoaded) ---
let featuredProductsGrid;
let wishlistItemsContainer;
let clearWishlistButton;
// ADDED/MODIFIED: Renamed for clarity, it's the initial message *within* the wishlistItemsContainer
let wishlistInitialMessage;

// --- Profile Elements (assigned in DOMContentLoaded) ---
let profileEmailSpan;
// let updateProfileBtn; // This was for a placeholder, now using updateProfileForm
let changePasswordBtn;
let updateProfileForm;
let displayNameInput;
let saveProfileBtn;

// --- Contact Form Elements (assigned in DOMContentLoaded) ---
let contactForm;

// NEW Global variable for selected vehicle
let selectedVehicleForSearch = null;

// ADDED: Firestore field name constants for consistency
const FIRESTORE_VEHICLES_FIELD = 'vehicles';
const FIRESTORE_WISHLIST_FIELD = 'wishlist';
const MAX_VEHICLES = 3;


// --- Page Navigation ---
window.showPage = function(id) {
    console.log(`Showing page: ${id}`);
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    const pageElement = document.getElementById(id);
    if (pageElement) {
        pageElement.classList.add("active");
    } else {
        console.error(`Page element with ID '${id}' not found!`);
    }

    if (hamburgerMenu && hamburgerMenu.classList.contains('active')) {
        hamburgerMenu.classList.remove('active');
        navLinks.classList.remove('active');
    }

    // ADDED/MODIFIED: Explicitly call load functions when their respective page is shown
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
        clearTimeout(timeoutId);
        notification.remove();
    });
    console.log(`Notification shown: ${message} (${type})`);
}


// --- Form Error Display Helper ---
function displayFormError(elementId, message) {
    const errorSpan = document.getElementById(elementId);
    if (errorSpan) {
        errorSpan.textContent = message;
    } else {
        console.warn(`Error span with ID ${elementId} not found.`);
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
    console.log("Attempting to clear auth fields.");
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
    // ADDED FOR DEBUGGING: Alert to check if auth state change is being processed
    alert('Auth State Changed! User: ' + (user ? user.email : 'None'));
    console.log("Auth state changed. User:", user ? user.email : "none");
    // ADDED/MODIFIED: Ensure userEmailSpan is available before trying to update it.
    // The DOMContentLoaded listener handles the initial assignment.
    // This `if` block prevents errors if onAuthStateChanged fires before DOM is ready.
    if (!userEmailSpan) {
        document.addEventListener('DOMContentLoaded', () => {
            const emailSpan = document.getElementById("userEmail");
            if (emailSpan) updateAuthStateUI(user, emailSpan);
        });
    } else {
        updateAuthStateUI(user, userEmailSpan);
    }
});

function updateAuthStateUI(user, emailSpanElement) {
    if (user) {
        emailSpanElement.textContent = `Logged in as: ${user.email}`;

        // ADDED/MODIFIED: Ensure these functions are called to update UI when auth state changes to logged in
        renderSavedVehicles();
        loadWishlist();
        loadProfile();

        // ADDED/MODIFIED: Only show login success if user was *just* logged in, not on page refresh
        // The individual auth handlers should show success. This state change is for UI updates.
        // showNotification(`Welcome, ${user.displayName || user.email}!`, 'success', 2000); // Removed from here

        if (document.querySelector('.page.active')?.id === 'auth') {
            showPage('home'); // Redirect if currently on the auth page
        }
        clearAuthFields();

    } else {
        emailSpanElement.textContent = "";
        // ADDED/MODIFIED: Redirect to auth page if user logs out from a protected page
        if (document.querySelector(".page.active")?.id === "garage" ||
            document.querySelector(".page.active")?.id === "wishlist" ||
            document.querySelector(".page.active")?.id === "profile") {
            showPage("auth");
        }
        clearAuthFields();
        // ADDED/MODIFIED: Clear UI sections when logging out
        renderSavedVehicles(); // Clears vehicles from UI
        loadWishlist(); // Clears wishlist from UI
        loadProfile(); // Clears profile info
        // showNotification("Logged out.", 'info', 2000); // Removed from here
    }
}

// --- DOMContentLoaded: Assign elements and attach all listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // ADDED FOR DEBUGGING: Alert to check if DOMContentLoaded fired
    alert('DOMContentLoaded Fired!');
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

    // ADDED/MODIFIED: Create and insert password strength indicator here, ensuring regPassInput exists
    passwordStrengthIndicator = document.createElement('div');
    passwordStrengthIndicator.id = 'passwordStrength';
    passwordStrengthIndicator.className = 'password-strength';
    if (regPassInput) { // Check if regPassInput is found before trying to insert
        regPassInput.parentNode.insertBefore(passwordStrengthIndicator, regPassInput.nextSibling);
    }

    // Assign Garage Form Elements
    garageForm = document.getElementById('garageForm');
    makeInput = document.getElementById("make");
    modelInput = document.getElementById("model");
    yearInput = document.getElementById("year");
    savedVehiclesContainer = document.getElementById('savedVehicles');
    // ADDED/MODIFIED: Ensure noVehiclesMessage targets the specific P tag by ID
    noVehiclesMessage = document.getElementById('noVehiclesMessage');

    // Assign Wishlist Elements
    featuredProductsGrid = document.getElementById('featuredProductsGrid');
    wishlistItemsContainer = document.getElementById('wishlistItems');
    clearWishlistButton = document.getElementById('clearWishlistBtn');
    // ADDED/MODIFIED: Targets the initial message within the wishlistItemsContainer
    wishlistInitialMessage = document.querySelector('#wishlistItems .no-items-message');

    // Assign Profile Elements
    profileEmailSpan = document.getElementById('profileEmail');
    // updateProfileBtn was removed from HTML based on previous discussion, no need to assign here
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
            event.stopPropagation();
            navLinks.classList.toggle('active');
            hamburgerMenu.classList.toggle('open');
        });
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                    hamburgerMenu.classList.remove('open');
                }
            });
        });
        document.addEventListener('click', (event) => {
            if (!navLinks.contains(event.target) && !hamburgerMenu.contains(event.target) && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                hamburgerMenu.classList.remove('open');
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
                setButtonLoading(submitBtn, false);
                return;
            }

            setButtonLoading(submitBtn, true);

            try {
                await signInWithEmailAndPassword(auth, loginEmailInput.value, loginPassInput.value);
                // ADDED/MODIFIED: Notification moved here as this is the direct result of user action
                showNotification("Login successful!", "success");
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
    } else { console.warn("Login form or its inputs not found."); }


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
            if (regPassInput.value.length < 6) { displayFormError('regPassError', 'Password must be at least 6 characters long.'); isValid = false; }


            if (!isValid) {
                showNotification('Please fill in all required fields.', 'error');
                setButtonLoading(submitBtn, false);
                return;
            }

            setButtonLoading(submitBtn, true);

            try {
                await createUserWithEmailAndPassword(auth, regEmailInput.value, regPassInput.value);
                // ADDED/MODIFIED: Notification moved here as this is the direct result of user action
                showNotification("Registered successfully!", "success");
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
        // ADDED/MODIFIED: Check for passwordStrengthIndicator's existence here
        if (regPassInput && passwordStrengthIndicator) {
            regPassInput.addEventListener('input', () => {
                const password = regPassInput.value;
                const strength = checkPasswordStrength(password);
                updatePasswordStrengthIndicator(strength);
            });
        }
    } else { console.warn("Register form or its inputs not found."); }


    // Google Login
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', async function() {
            console.log("Google Login clicked.");
            setButtonLoading(googleLoginBtn, true);

            const provider = new GoogleAuthProvider();
            try {
                await signInWithPopup(auth, provider);
                // ADDED/MODIFIED: Notification moved here
                showNotification("Google login successful!", "success");
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
    } else { console.warn("Google Login button not found."); }

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function() {
            console.log("Logout clicked.");
            setButtonLoading(logoutBtn, true);

            try {
                await signOut(auth);
                // ADDED/MODIFIED: Notification moved here
                showNotification("Logged out successfully!", "info");
            } catch (err) {
                showNotification("Logout error: " + err.message, "error", 5000);
            } finally {
                setButtonLoading(logoutBtn, false);
            }
        });
    } else { console.warn("Logout button not found."); }

    // Forgot Password
    if (forgotPasswordLink && loginEmailInput) {
        forgotPasswordLink.addEventListener('click', async (e) => {
            console.log("Forgot Password clicked.");
            e.preventDefault();
            const email = loginEmailInput.value.trim();

            if (!email) {
                displayFormError('loginEmailError', 'Please enter your email to reset password.');
                showNotification('Please enter your email for password reset.', 'error');
                // ADDED/MODIFIED: Don't set loading state if input is invalid
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
                console.error("Password reset error:", error);
            } finally {
                setButtonLoading(forgotPasswordLink, false);
            }
        });
    } else { console.warn("Forgot Password link or login email input not found."); }


    // Password Visibility Toggles
    if (toggleLoginPassBtn && loginPassInput) {
        toggleLoginPassBtn.addEventListener('click', () => {
            const type = loginPassInput.getAttribute('type') === 'password' ? 'text' : 'password';
            loginPassInput.setAttribute('type', type);
            toggleLoginPassBtn.setAttribute('aria-label', type === 'password' ? 'Show password' : 'Hide password');
            toggleLoginPassBtn.textContent = type === 'password' ? '👁️' : '🙈';
        });
    } else { console.warn("Login password toggle not found."); }

    if (toggleRegPassBtn && regPassInput) {
        toggleRegPassBtn.addEventListener('click', () => {
            const type = regPassInput.getAttribute('type') === 'password' ? 'text' : 'password';
            regPassInput.setAttribute('type', type);
            toggleRegPassBtn.setAttribute('aria-label', type === 'password' ? 'Show password' : 'Hide password');
            toggleRegPassBtn.textContent = type === 'password' ? '👁️' : '🙈';
        });
    } else { console.warn("Register password toggle not found."); }


    // --- My Garage Section (Firebase) ---
    if (garageForm && makeInput && modelInput && yearInput && savedVehiclesContainer && noVehiclesMessage) {
        garageForm.addEventListener('submit', async (e) => {
            console.log("Garage form submit handler triggered.");
            e.preventDefault();
            const submitBtn = e.submitter;

            setButtonLoading(submitBtn, true);
            clearFormErrors('garageForm');

            if (!auth.currentUser) {
                console.log("Auth check: User not logged in.");
                showNotification("Please log in to save your vehicle.", "error");
                setButtonLoading(submitBtn, false);
                return;
            }

            const make = makeInput.value.trim();
            const model = modelInput.value.trim();
            const year = parseInt(yearInput.value);

            let isValid = true;
            if (!make) { displayFormError('makeError', 'Make is required.'); isValid = false; }
            if (!model) { displayFormError('modelError', 'Model is required.'); isValid = false; }
            if (isNaN(year) || year < 1900 || year > 2100) { displayFormError('yearError', 'Please enter a valid year (e.g., 2023).'); isValid = false; }

            if (!isValid) {
                console.log("Validation failed.");
                showNotification('Please correct the errors in the form.', 'error');
                setButtonLoading(submitBtn, false);
                return;
            }

            console.log("Validation passed, proceeding with save logic.");

            try {
                const userDocRef = getUserGarageDocRef();
                console.log("Fetching user document snapshot for save...");
                const userDocSnap = await getDoc(userDocRef);

                let vehicles = [];

                if (userDocSnap.exists()) {
                    vehicles = userDocSnap.data()[FIRESTORE_VEHICLES_FIELD] || [];
                    console.log("Existing vehicles data found:", vehicles);
                } else {
                    console.log("User document does not exist, will create.");
                }

                if (vehicles.length >= MAX_VEHICLES) {
                    showNotification(`You can save a maximum of ${MAX_VEHICLES} vehicles. Please delete one to add a new one.`, 'error', 5000);
                    setButtonLoading(submitBtn, false);
                    console.log("Max vehicles limit reached.");
                    return;
                }

                const newVehicle = { make, model, year };
                console.log("Attempting to save new vehicle:", newVehicle);

                // ADDED: Prevent adding duplicate vehicles for better UX
                const isDuplicate = vehicles.some(v => v.make === newVehicle.make && v.model === newVehicle.model && v.year === newVehicle.year);
                if (isDuplicate) {
                    showNotification(`Vehicle "${year} ${make} ${model}" is already in your garage.`, "info");
                    setButtonLoading(submitBtn, false);
                    garageForm.reset();
                    return;
                }


                if (!userDocSnap.exists()) { // ADDED/MODIFIED: Simplified logic for setDoc
                    console.log("Creating new document with initial vehicle.");
                    await setDoc(userDocRef, {
                        [FIRESTORE_VEHICLES_FIELD]: [newVehicle],
                        timestamp: serverTimestamp()
                    });
                } else {
                    console.log("Updating existing vehicles field with arrayUnion.");
                    await updateDoc(userDocRef, {
                        [FIRESTORE_VEHICLES_FIELD]: arrayUnion(newVehicle),
                        timestamp: serverTimestamp()
                    });
                }

                showNotification(`Vehicle "${year} ${make} ${model}" saved to your garage!`, "success");
                garageForm.reset();
                renderSavedVehicles(); // ADDED/MODIFIED: Re-render after successful save
                loadVehicleForProducts(); // ADDED/MODIFIED: Update products page vehicle selection
                console.log("Vehicle save process completed successfully.");
            } catch (err) {
                console.error("Unhandled error during garage form submission:", err);
                showNotification("Error saving vehicle: " + err.message, "error", 5000);
            } finally {
                setButtonLoading(submitBtn, false);
                console.log("Finally block executed, loading state removed.");
            }
        });
    } else { console.warn("Garage form or its elements not found."); }


    // Wishlist Buttons
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
    } else { console.warn("Featured Products Grid not found for wishlist."); }

    if (wishlistItemsContainer) {
        wishlistItemsContainer.addEventListener('click', async (event) => {
            if (event.target.classList.contains('remove-from-wishlist-btn')) {
                const productIdToRemove = event.target.dataset.productId;
                await removeFromWishlist(productIdToRemove, event.target);
            }
        });
    } else { console.warn("Wishlist Items Container not found."); }

    if (clearWishlistButton) {
        clearWishlistButton.addEventListener('click', async () => {
            // ADDED/MODIFIED: Confirmation before clearing
            if (confirm("Are you sure you want to clear your entire wishlist? This cannot be undone.")) {
                await clearWishlist(clearWishlistButton);
            }
        });
    } else { console.warn("Clear Wishlist Button not found."); }


    // Profile Page Functionality
    // ADDED/MODIFIED: Event listener for the updateProfileForm
    if (updateProfileForm && displayNameInput && saveProfileBtn) {
        updateProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = auth.currentUser;
            const newDisplayName = displayNameInput.value.trim();
            const submitBtn = saveProfileBtn;

            clearFormErrors('updateProfileForm');

            if (!user) {
                showNotification("You must be logged in to update your profile.", "error");
                return;
            }

            // Basic validation
            if (!newDisplayName) {
                displayFormError('displayNameError', 'Display name cannot be empty.');
                showNotification('Please enter a display name.', 'error');
                return;
            }

            setButtonLoading(submitBtn, true);

            try {
                await updateProfile(user, {
                    displayName: newDisplayName
                });
                showNotification("Profile updated successfully!", "success");
                loadProfile(); // Re-load profile to show updated display name immediately
            } catch (error) {
                console.error("Error updating profile:", error);
                showNotification(`Failed to update profile: ${error.message}`, "error");
            } finally {
                setButtonLoading(submitBtn, false);
            }
        });
    } else { console.warn("Update Profile Form or its elements not found."); }

    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', async () => {
            const user = auth.currentUser;
            if (user) {
                showNotification("Sending password reset email...", "info"); // ADDED/MODIFIED: More direct notification
                try {
                    await sendPasswordResetEmail(auth, user.email);
                    showNotification(`Password change email sent to ${user.email}. Please check your inbox.`, "success", 7000);
                } catch (error) {
                    console.error("Change password email error:", error);
                    showNotification(`Failed to send password change email: ${error.message}`, "error", 7000);
                }
            } else {
                showNotification("Please log in to change your password.", "error");
            }
        });
    } else { console.warn("Change Password button not found."); }


    // Contact Form
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            console.log("Contact form submit handler triggered.");
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
                console.error("Contact form submission error:", error);
            } finally {
                setButtonLoading(submitBtn, false);
            }
        });
    } else { console.warn("Contact form not found."); }


    // Footer Current Year
    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // Initial page load
    showPage('home');
});

// --- Helper Functions (defined outside DOMContentLoaded so they are globally accessible) ---
// ADDED/MODIFIED: These constants were already defined globally, just moved them here for consistency.
// const FIRESTORE_VEHICLES_FIELD = 'vehicles'; // Already defined above, removed duplicate
// const MAX_VEHICLES = 3; // Already defined above, removed duplicate

function getUserGarageDocRef() {
    if (!auth.currentUser) {
        // ADDED/MODIFIED: Removed generic notification here, calling functions will handle specific messages
        return null;
    }
    return doc(db, "garages", auth.currentUser.uid);
}

async function getSavedVehiclesFromFirestore() {
    const userDocRef = getUserGarageDocRef();
    if (!userDocRef) { // ADDED/MODIFIED: Explicit check here. getUserGarageDocRef already shows notification
        console.log("getSavedVehiclesFromFirestore: Not logged in, returning empty array.");
        return [];
    }

    try {
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const data = userDoc.data();
            return data[FIRESTORE_VEHICLES_FIELD] || [];
        }
        return [];
    } catch (error) {
        console.error("Error getting vehicles from Firestore:", error);
        showNotification("Error loading saved vehicles.", "error"); // Keep notification here
        return [];
    }
}

async function renderSavedVehicles() {
    // ADDED/MODIFIED: Re-fetching elements to ensure they are current in case DOM was manipulated
    const savedVehiclesContainer = document.getElementById('savedVehicles');
    const noVehiclesMessage = document.getElementById('noVehiclesMessage');

    if (!savedVehiclesContainer || !noVehiclesMessage) {
        console.warn("Garage display elements not found for rendering.");
        return;
    }

    // ADDED/MODIFIED: Clear previous content and show loading state
    savedVehiclesContainer.innerHTML = '';
    noVehiclesMessage.textContent = 'Loading your vehicles...';
    noVehiclesMessage.style.display = 'block';


    if (!auth.currentUser) {
        noVehiclesMessage.textContent = 'Please log in to save your vehicles.'; // Update message for logged out state
        return; // Exit if not logged in
    }

    try {
        const vehicles = await getSavedVehiclesFromFirestore();
        savedVehiclesContainer.innerHTML = ''; // Clear loading message now that data is fetched

        if (vehicles.length === 0) {
            noVehiclesMessage.textContent = 'No vehicles saved yet. Add one above!'; // Restore default empty message
            noVehiclesMessage.style.display = 'block';
        } else {
            noVehiclesMessage.style.display = 'none'; // Hide the message if vehicles exist
            vehicles.forEach((vehicle, index) => {
                const vehicleCard = document.createElement('div');
                vehicleCard.className = 'vehicle-card';
                // ADDED/MODIFIED: Pass the full vehicle object data to the button to ensure exact match for arrayRemove
                // Using dataset for all properties needed for removal
                vehicleCard.innerHTML = `
                    <div class="vehicle-info">
                        <h4>${vehicle.year} ${vehicle.make} ${vehicle.model}</h4>
                        <p>Make: ${vehicle.make}</p>
                        <p>Model: ${vehicle.model}</p>
                        <p>Year: ${vehicle.year}</p>
                    </div>
                    <button class="delete-vehicle-btn"
                            data-make="${vehicle.make}"
                            data-model="${vehicle.model}"
                            data-year="${vehicle.year}"
                            aria-label="Delete ${vehicle.year} ${vehicle.make} ${vehicle.model}">Delete</button>
                `;
                savedVehiclesContainer.appendChild(vehicleCard);
            });

            // ADDED/MODIFIED: Attach listeners after all cards are added
            document.querySelectorAll('#savedVehicles .delete-vehicle-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const vehicleToDelete = { // Reconstruct the exact object to remove
                        make: e.target.dataset.make,
                        model: e.target.dataset.model,
                        year: parseInt(e.target.dataset.year)
                    };
                    await deleteVehicle(vehicleToDelete, e.target);
                });
            });
        }
    } catch (error) {
        console.error("Error in renderSavedVehicles:", error);
        noVehiclesMessage.textContent = 'Error loading your vehicles. Please try again.';
        noVehiclesMessage.style.display = 'block';
        showNotification("Error loading saved vehicles: " + error.message, "error", 5000);
    }
}

// ADDED/MODIFIED: Modified deleteVehicle to use arrayRemove based on the actual vehicle object
async function deleteVehicle(vehicleToDelete, button) {
    const userDocRef = getUserGarageDocRef();
    if (!userDocRef) { // getUserGarageDocRef already shows notification
        return;
    }

    setButtonLoading(button, true);

    try {
        // Use arrayRemove with the exact object to remove it from the Firestore array
        await updateDoc(userDocRef, {
            [FIRESTORE_VEHICLES_FIELD]: arrayRemove(vehicleToDelete)
        });
        showNotification(`Vehicle "${vehicleToDelete.year} ${vehicleToDelete.make} ${vehicleToDelete.model}" deleted.`, 'info');
        renderSavedVehicles(); // Re-render after successful delete
        loadVehicleForProducts(); // Update products page vehicle selection
    } catch (error) {
        console.error("Error deleting vehicle:", error);
        showNotification("Error deleting vehicle: " + error.message, "error");
    } finally {
        setButtonLoading(button, false);
    }
}

async function loadVehicleForProducts() {
    const productContentDiv = document.getElementById('productContent');
    if (!productContentDiv) return;

    // ADDED/MODIFIED: Clear and show loading state
    productContentDiv.innerHTML = '<p class="no-items-message">Loading vehicle search options...</p>';


    if (!auth.currentUser) {
        productContentDiv.innerHTML = `
            <div class="no-vehicle-message">
                <h3>Please Log In or Save Your Vehicle</h3>
                <p>To get personalized part searches, please <a href="#" onclick="showPage('auth')">log in</a> or go to <a href="#" onclick="showPage('garage')">My Garage</a> to save your vehicle details.</p>
            </div>
        `;
        selectedVehicleForSearch = null; // Reset selected vehicle if user logs out or is not logged in
        return;
    }

    try {
        const vehicles = await getSavedVehiclesFromFirestore();

        if (vehicles.length > 0) {
            // Set the initially selected vehicle (either the first one, or the previously selected one)
            // ADDED/MODIFIED: More robust check to ensure selectedVehicleForSearch is actually in the *current* vehicles list
            if (!selectedVehicleForSearch || !vehicles.some(v => v.make === selectedVehicleForSearch.make && v.model === selectedVehicleForSearch.model && v.year === selectedVehicleForSearch.year)) {
                selectedVehicleForSearch = vehicles[0]; // Default to the first vehicle if none selected or old one removed
            }

            let vehicleOptionsHtml = vehicles.map((v, i) => `
                <option value="${i}" ${
                    (selectedVehicleForSearch && v.make === selectedVehicleForSearch.make && v.model === selectedVehicleForSearch.model && v.year === selectedVehicleForSearch.year)
                    ? 'selected' : ''
                }>
                    ${v.year} ${v.make} ${v.model}
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
                    <button onclick="searchAmazonSpecific('${selectedVehicleForSearch.year}', '${selectedVehicleForSearch.make}', '${selectedVehicleForSearch.model}', 'Brake Pads')">Brake Pads</button>
                    <button onclick="searchAmazonSpecific('${selectedVehicleForSearch.year}', '${selectedVehicleForSearch.make}', '${selectedVehicleForSearch.model}', 'Oil Filter')">Oil Filter</button>
                    <button onclick="searchAmazonSpecific('${selectedVehicleForSearch.year}', '${selectedVehicleForSearch.make}', '${selectedVehicleForSearch.model}', 'Air Filter')">Air Filter</button>
                    <button onclick="searchAmazonSpecific('${selectedVehicleForSearch.year}', '${selectedVehicleForSearch.make}', '${selectedVehicleForSearch.model}', 'Spark Plugs')">Spark Plugs</button>
                    <button onclick="searchAmazonSpecific('${selectedVehicleForSearch.year}', '${selectedVehicleForSearch.make}', '${selectedVehicleForSearch.model}', 'Suspension Kit')">Suspension Kit</button>
                    <button onclick="searchAmazonSpecific('${selectedVehicleForSearch.year}', '${selectedVehicleForSearch.make}', '${selectedVehicleForSearch.model}', 'Headlights')">Headlights</button>
                    <button onclick="searchAmazonSpecific('${selectedVehicleForSearch.year}', '${selectedVehicleForSearch.make}', '${selectedVehicleForSearch.model}', 'Tail Lights')">Tail Lights</button>
                    <button onclick="searchAmazonSpecific('${selectedVehicleForSearch.year}', '${selectedVehicleForSearch.make}', '${selectedVehicleForSearch.model}', 'Windshield Wipers')">Wiper Blades</button>
                    <button onclick="searchAmazonSpecific('${selectedVehicleForSearch.year}', '${selectedVehicleForSearch.make}', '${selectedVehicleForSearch.model}', 'Radiator')">Radiator</button>
                    <button onclick="searchAmazonSpecific('${selectedVehicleForSearch.year}', '${selectedVehicleForSearch.make}', '${selectedVehicleForSearch.model}', 'Battery')">Battery</button>
                    </div>
            `;
            productContentDiv.innerHTML = htmlContent;

            const vehicleSelect = document.getElementById('vehicleSelect');
            const currentSearchVehicleSpan = document.getElementById('currentSearchVehicle');

            if (vehicleSelect) {
                vehicleSelect.addEventListener('change', (event) => {
                    const selectedIndex = parseInt(event.target.value);
                    selectedVehicleForSearch = vehicles[selectedIndex];
                    currentSearchVehicleSpan.textContent = `${selectedVehicleForSearch.year} ${selectedVehicleForSearch.make} ${selectedVehicleForSearch.model}`;
                    // ADDED/MODIFIED: Re-call loadVehicleForProducts to regenerate the category buttons with the new vehicle's data
                    loadVehicleForProducts();
                });
            }

            const generalSearchInput = document.getElementById('generalProductSearch');
            const generalSearchButton = document.getElementById('generalSearchButton');

            if (generalSearchInput && generalSearchButton) { // ADDED/MODIFIED: Check both elements exist
                generalSearchInput.addEventListener('keypress', (event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        // setButtonLoading is not strictly needed here since it's an external link
                        searchAmazonGeneral(selectedVehicleForSearch.year, selectedVehicleForSearch.make, selectedVehicleForSearch.model);
                    }
                });

                generalSearchButton.addEventListener('click', () => {
                    // setButtonLoading not strictly needed here
                    searchAmazonGeneral(selectedVehicleForSearch.year, selectedVehicleForSearch.make, selectedVehicleForSearch.model);
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
        console.error("Error loading vehicle for products page:", err);
        productContentDiv.innerHTML = `
            <div class="no-vehicle-message">
                <h3>Error Loading Vehicle</h3>
                <p>There was an error loading your vehicle data. Please try again or <a href="#" onclick="showPage('auth')">log in</a>.</p>
            </div>
        `;
        showNotification("Error loading vehicle data for products: " + err.message, "error", 5000);
    }
}

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

async function addToWishlist(product) {
    const userDocRef = getUserGarageDocRef();
    if (!userDocRef) {
        // ADDED/MODIFIED: Show notification if not logged in
        showNotification("Please log in to add items to your wishlist.", "error");
        return;
    }

    try {
        const currentWishlist = await getWishlistFromFirestore();
        const exists = currentWishlist.some(item => item.id === product.id);

        if (!exists) {
            await updateDoc(userDocRef, {
                [FIRESTORE_WISHLIST_FIELD]: arrayUnion(product) // ADDED/MODIFIED: Use constant
            });
            showNotification(`${product.name} added to wishlist!`, "success");
            // ADDED/MODIFIED: Only load wishlist if currently on wishlist page
            if (document.querySelector('.page.active')?.id === 'wishlist') {
                loadWishlist();
            }
        } else {
            showNotification(`${product.name} is already in your wishlist.`, "info");
        }
    } catch (error) {
        console.error("Error adding to wishlist:", error);
        showNotification(`Failed to add ${product.name} to wishlist: ${error.message}`, "error");
    }
}

async function removeFromWishlist(productId, button) {
    const userDocRef = getUserGarageDocRef();
    if (!userDocRef) {
        // ADDED/MODIFIED: Show notification if not logged in
        showNotification("Please log in to manage your wishlist.", "error");
        return;
    }

    setButtonLoading(button, true);

    try {
        const currentWishlist = await getWishlistFromFirestore();
        // ADDED/MODIFIED: Find the exact item object to remove using arrayRemove.
        // `arrayRemove` requires an exact match of the object in the array.
        const itemToRemove = currentWishlist.find(item => item.id === productId);

        if (itemToRemove) {
            await updateDoc(userDocRef, {
                [FIRESTORE_WISHLIST_FIELD]: arrayRemove(itemToRemove) // ADDED/MODIFIED: Use constant
            });
            showNotification("Product removed from wishlist.", "info");
            loadWishlist(); // ADDED/MODIFIED: Re-render after removal
        } else {
            showNotification("Product not found in wishlist (it might have been removed already).", "info");
        }
    } catch (error) {
        console.error("Error removing from wishlist:", error);
        showNotification("Failed to remove product from wishlist: " + error.message, "error");
    } finally {
        setButtonLoading(button, false);
    }
}

async function clearWishlist(button) {
    const userDocRef = getUserGarageDocRef();
    if (!userDocRef) {
        // ADDED/MODIFIED: Show notification if not logged in
        showNotification("Please log in to clear your wishlist.", "error");
        return;
    }

    setButtonLoading(button, true);

    try {
        await updateDoc(userDocRef, {
            [FIRESTORE_WISHLIST_FIELD]: [] // ADDED/MODIFIED: Use constant to set the wishlist array to empty
        });
        showNotification("Wishlist cleared!", "info");
        loadWishlist(); // ADDED/MODIFIED: Re-render after clearing
    } catch (error) {
        console.error("Error clearing wishlist:", error);
        showNotification("Failed to clear wishlist: " + error.message, "error");
    } finally {
        setButtonLoading(button, false);
    }
}

async function getWishlistFromFirestore() {
    const userDocRef = getUserGarageDocRef();
    if (!userDocRef) { // ADDED/MODIFIED: Explicit check here. getUserGarageDocRef already shows notification
        console.log("getWishlistFromFirestore: Not logged in, returning empty array.");
        return [];
    }

    try {
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const data = userDoc.data();
            return data[FIRESTORE_WISHLIST_FIELD] || []; // ADDED/MODIFIED: Use constant
        }
        return [];
    } catch (error) {
        console.error("Error getting wishlist from Firestore:", error);
        showNotification("Error loading wishlist.", "error"); // Keep notification here
        return [];
    }
}

// ADDED/MODIFIED: Completed loadWishlist function
async function loadWishlist() {
    // ADDED/MODIFIED: Re-fetching elements to ensure they are current in case DOM was manipulated
    const wishlistItemsContainer = document.getElementById('wishlistItems');
    const clearWishlistButton = document.getElementById('clearWishlistBtn');
    const wishlistInitialMessage = document.querySelector('#wishlistItems .no-items-message');

    if (!wishlistItemsContainer || !wishlistInitialMessage || !clearWishlistButton) {
        console.warn("Wishlist display elements not found for rendering.");
        return;
    }

    // Clear previous content and show loading state
    wishlistItemsContainer.innerHTML = '';
    wishlistInitialMessage.textContent = 'Loading your wishlist...';
    wishlistInitialMessage.style.display = 'block'; // Ensure the loading message is visible
    clearWishlistButton.style.display = 'none'; // Hide clear button during loading

    if (!auth.currentUser) {
        wishlistInitialMessage.textContent = 'Please log in to see your wishlist, or add some products from the Products page!';
        // Ensure only the message is shown if logged out
        wishlistItemsContainer.appendChild(wishlistInitialMessage);
        return;
    }

    try {
        const wishlist = await getWishlistFromFirestore();
        wishlistItemsContainer.innerHTML = ''; // Clear loading message now that data is fetched

        if (wishlist.length === 0) {
            wishlistInitialMessage.textContent = 'Your wishlist is empty. Add some products from the Products page!';
            wishlistInitialMessage.style.display = 'block';
            clearWishlistButton.style.display = 'none'; // No items, no clear button
            wishlistItemsContainer.appendChild(wishlistInitialMessage); // Re-add the specific message
        } else {
            wishlistInitialMessage.style.display = 'none'; // Hide the message if items exist
            clearWishlistButton.style.display = 'block'; // Show clear button if items exist

            wishlist.forEach(product => {
                const productCard = document.createElement('div');
                productCard.className = 'card wishlist-card'; // Add a specific class
                productCard.innerHTML = `
                    <img src="${product.imageUrl || 'https://via.placeholder.com/100x100?text=Product'}" alt="${product.name}">
                    <h4>${product.name}</h4>
                    <p>${product.brand || 'N/A'} – $${product.price ? product.price.toFixed(2) : 'N/A'}</p>
                    <a href="${product.amazonUrl}" target="_blank" rel="noopener noreferrer" aria-label="Buy ${product.name} on Amazon">Buy on Amazon</a>
                    <button class="remove-from-wishlist-btn" data-product-id="${product.id}" aria-label="Remove ${product.name} from wishlist">Remove</button>
                `;
                wishlistItemsContainer.appendChild(productCard);
            });
        }
    } catch (error) {
        console.error("Error in loadWishlist:", error);
        wishlistItemsContainer.innerHTML = '<p class="no-items-message">Error loading your wishlist.</p>';
        clearWishlistButton.style.display = 'none';
        showNotification("Error loading wishlist: " + error.message, "error", 5000);
    }
}

// ADDED: loadProfile function
async function loadProfile() {
    const profileEmailSpan = document.getElementById('profileEmail');
    const displayNameInput = document.getElementById('displayNameInput');

    if (!profileEmailSpan || !displayNameInput) {
        console.warn("Profile elements not found for loading.");
        return;
    }

    const user = auth.currentUser;
    if (user) {
        profileEmailSpan.textContent = user.email;
        displayNameInput.value = user.displayName || ''; // Populate display name input
    } else {
        profileEmailSpan.textContent = 'Not logged in';
        displayNameInput.value = '';
    }
}


function checkPasswordStrength(password) {
    let score = 0;
    if (password.length > 5) score++;
    if (password.length > 7) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score < 3) return 'weak';
    if (score < 5) return 'medium';
    return 'strong';
}

function updatePasswordStrengthIndicator(strength) {
    if (document.getElementById('passwordStrength')) {
        document.getElementById('passwordStrength').textContent = `Strength: ${strength.charAt(0).toUpperCase() + strength.slice(1)}`;
        document.getElementById('passwordStrength').className = `password-strength ${strength}`;
    }
}
