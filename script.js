// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut, sendPasswordResetEmail, updateProfile, reauthenticateWithCredential, EmailAuthProvider, deleteUser } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js"; // Added reauthenticateWithCredential, EmailAuthProvider, deleteUser
import { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp, collection, query, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js"; // Added collection, query, getDocs, deleteDoc

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
export const auth = getAuth(app); // Export auth if needed in other modules
export const db = getFirestore(app); // Export db if needed in other modules

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

// --- Wishlist Elements (assigned in DOMContentLoaded) ---
let featuredProductsGrid;
let wishlistItemsContainer;
let clearWishlistButton;
let wishlistInitialMessage;

// --- Profile Elements (assigned in DOMContentLoaded) ---
let profileEmailSpan;
let profileDisplayNameSpan; // Added for display name
let changePasswordBtn;
let updateProfileForm;
let firstNameInput; // New field
let lastNameInput;  // New field
let phoneInput;     // New field
let addressInput;   // New field
let cityInput;      // New field
let stateInput;     // New field
let zipInput;       // New field
let countryInput;   // New field
let saveProfileBtn;
let preferencesForm; // New form
let newsletterCheckbox; // New checkbox
let savePreferencesBtn; // New button
let orderHistoryList; // New list container
let profileSavedVehiclesList; // New list container
let noProfileVehiclesMessage; // New message
let deleteAccountBtn; // New button

// --- Contact Form Elements (assigned in DOMContentLoaded) ---
let contactForm;

// Global variable for selected vehicle
let selectedVehicleForSearch = null;

// Firebase Firestore constants
const FIRESTORE_VEHICLES_FIELD = 'vehicles';
const FIRESTORE_WISHLIST_FIELD = 'wishlist';
const FIRESTORE_USERS_COLLECTION = 'users'; // New Firestore collection for user profiles
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

    if (hamburgerMenu && hamburgerMenu.classList.contains('open')) { // Changed 'active' to 'open' for consistency with hamburger class
        hamburgerMenu.classList.remove('open');
        navLinks.classList.remove('active');
    }

    // Load data specific to the page being shown
    if (id === 'products') {
        loadVehicleForProducts();
    } else if (id === 'garage') {
        renderSavedVehicles();
    } else if (id === 'wishlist') {
        loadWishlist();
    } else if (id === 'profile') {
        loadProfile(); // This will now load all profile data
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
    console.log("Auth state changed. User:", user ? user.email : "none");
    // Ensure all necessary elements are available before updating UI
    if (!userEmailSpan) {
        document.addEventListener('DOMContentLoaded', () => { // Fallback if DOMContentLoaded hasn't fired yet
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

        // Load data for all relevant sections when user logs in
        renderSavedVehicles();
        loadWishlist();
        loadProfile(); // This will now fetch and populate all profile data

        // If currently on auth page, redirect to home
        if (document.querySelector('.page.active')?.id === 'auth') {
            showPage('home');
        }
        clearAuthFields();

        // --- NEW: Create initial user document in Firestore if it doesn't exist ---
        const userDocRef = doc(db, FIRESTORE_USERS_COLLECTION, user.uid);
        getDoc(userDocRef).then((docSnap) => {
            if (!docSnap.exists()) {
                console.log("Creating new user profile document in Firestore.");
                setDoc(userDocRef, {
                    email: user.email,
                    displayName: user.displayName || '',
                    createdAt: serverTimestamp(),
                    // Initialize other fields
                    firstName: '',
                    lastName: '',
                    phone: '',
                    address: '',
                    city: '',
                    state: '',
                    zip: '',
                    country: '',
                    newsletterSubscription: false,
                    // Note: Vehicles and Wishlist are usually subcollections or separate top-level collections
                    // but if they are directly in the user document, ensure they are initialized as arrays.
                    // [FIRESTORE_VEHICLES_FIELD]: [], // If vehicles are stored directly in user doc
                    // [FIRESTORE_WISHLIST_FIELD]: [], // If wishlist is stored directly in user doc
                }).then(() => {
                    console.log("User profile document created.");
                }).catch(error => {
                    console.error("Error creating user profile document:", error);
                });
            }
        }).catch(error => {
            console.error("Error checking user profile document:", error);
        });

    } else {
        emailSpanElement.textContent = "";
        // If logged out from a user-specific page, redirect to auth page
        if (document.querySelector(".page.active")?.id === "garage" ||
            document.querySelector(".page.active")?.id === "wishlist" ||
            document.querySelector(".page.active")?.id === "profile") {
            showPage("auth");
        }
        clearAuthFields();
        // Clear data displayed on user-specific sections upon logout
        renderSavedVehicles(); // Clears vehicles
        loadWishlist();       // Clears wishlist
        loadProfile();        // Clears profile fields
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
    passwordStrengthIndicator.className = 'password-strength';
    if (regPassInput) {
        regPassInput.parentNode.insertBefore(passwordStrengthIndicator, regPassInput.nextSibling);
    }

    // Assign Garage Form Elements
    garageForm = document.getElementById('garageForm');
    makeInput = document.getElementById("make");
    modelInput = document.getElementById("model");
    yearInput = document.getElementById("year");
    savedVehiclesContainer = document.getElementById('savedVehicles');
    noVehiclesMessage = document.getElementById('noVehiclesMessage');

    // Assign Wishlist Elements
    featuredProductsGrid = document.getElementById('featuredProductsGrid');
    wishlistItemsContainer = document.getElementById('wishlistItems');
    clearWishlistButton = document.getElementById('clearWishlistBtn');
    wishlistInitialMessage = document.querySelector('#wishlistItems .no-items-message');

    // Assign Profile Elements
    profileEmailSpan = document.getElementById('profileEmail');
    profileDisplayNameSpan = document.getElementById('profileDisplayName'); // New span for display name
    changePasswordBtn = document.getElementById('changePasswordBtn');
    updateProfileForm = document.getElementById('updateProfileForm');
    firstNameInput = document.getElementById('firstNameInput'); // New
    lastNameInput = document.getElementById('lastNameInput');   // New
    phoneInput = document.getElementById('phoneInput');     // New
    addressInput = document.getElementById('addressInput');   // New
    cityInput = document.getElementById('cityInput');       // New
    stateInput = document.getElementById('stateInput');     // New
    zipInput = document.getElementById('zipInput');         // New
    countryInput = document.getElementById('countryInput');   // New
    saveProfileBtn = document.getElementById('saveProfileBtn');

    preferencesForm = document.getElementById('preferencesForm'); // New form
    newsletterCheckbox = document.getElementById('newsletterCheckbox'); // New checkbox
    savePreferencesBtn = document.getElementById('savePreferencesBtn'); // New button

    orderHistoryList = document.getElementById('orderHistoryList'); // New order history list
    profileSavedVehiclesList = document.getElementById('profileSavedVehiclesList'); // New profile vehicles list
    noProfileVehiclesMessage = document.getElementById('noProfileVehiclesMessage'); // New message for profile vehicles
    deleteAccountBtn = document.getElementById('deleteAccountBtn'); // New delete account button

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
            console.log("Garage form submitted.");
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
                // Modified: Now storing vehicles in a subcollection under the user's document
                const userVehiclesCollectionRef = collection(db, FIRESTORE_USERS_COLLECTION, auth.currentUser.uid, FIRESTORE_VEHICLES_FIELD);
                const existingVehiclesSnapshot = await getDocs(userVehiclesCollectionRef);
                const vehicles = existingVehiclesSnapshot.docs.map(doc => doc.data());

                if (vehicles.length >= MAX_VEHICLES) {
                    showNotification(`You can save a maximum of ${MAX_VEHICLES} vehicles. Please delete one to add a new one.`, 'error', 5000);
                    setButtonLoading(submitBtn, false);
                    console.log("Max vehicles limit reached.");
                    return;
                }

                const newVehicle = { make, model, year, createdAt: serverTimestamp() }; // Add timestamp for order
                console.log("Attempting to save new vehicle:", newVehicle);

                // Prevent adding duplicate vehicles for better UX (checking against current fetched list)
                const isDuplicate = vehicles.some(v => v.make === newVehicle.make && v.model === newVehicle.model && v.year === newVehicle.year);
                if (isDuplicate) {
                    showNotification(`Vehicle "${year} ${make} ${model}" is already in your garage.`, "info");
                    setButtonLoading(submitBtn, false);
                    garageForm.reset();
                    return;
                }

                // Add a new document in the 'vehicles' subcollection with an auto-generated ID
                await setDoc(doc(userVehiclesCollectionRef), newVehicle);

                showNotification(`Vehicle "${year} ${make} ${model}" saved to your garage!`, "success");
                garageForm.reset();
                // MODIFIED: Added a small delay to allow Firestore to synchronize write operation
                setTimeout(async () => {
                    await renderSavedVehicles(); // Re-render garage list
                    await loadVehicleForProducts(); // Update products page vehicle selector
                    await loadProfileVehicles(auth.currentUser.uid); // Update profile page vehicle list
                }, 500); // 500ms delay
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
    } else { console.warn("Featured Products Grid not found for wishlist."); }

    // Event Listener for Wishlist Items (for Remove buttons)
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
            if (confirm("Are you sure you want to clear your entire wishlist? This cannot be undone.")) {
                await clearWishlist(clearWishlistButton);
            }
        });
    } else { console.warn("Clear Wishlist Button not found."); }


    // --- Profile Page Functionality ---
    if (updateProfileForm && firstNameInput && lastNameInput && phoneInput && addressInput && cityInput && stateInput && zipInput && countryInput && saveProfileBtn) {
        updateProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = auth.currentUser;
            const submitBtn = saveProfileBtn;

            clearFormErrors('updateProfileForm');

            if (!user) {
                showNotification("You must be logged in to update your profile.", "error");
                return;
            }

            // Get updated values from form fields
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
            // Add more specific validation for phone, address, etc. if needed
            // Example: if (!phone.match(/^\d{10}$/)) { displayFormError('phoneError', 'Invalid phone format.'); isValid = false; }

            if (!isValid) {
                showNotification('Please fill in all required profile fields.', 'error');
                return;
            }

            setButtonLoading(submitBtn, true);

            try {
                // Update Firebase Auth display name
                const fullDisplayName = `${firstName} ${lastName}`.trim();
                if (user.displayName !== fullDisplayName) {
                    await updateProfile(user, {
                        displayName: fullDisplayName
                    });
                }

                // Update user document in Firestore with new personal info
                const userDocRef = doc(db, FIRESTORE_USERS_COLLECTION, user.uid);
                await setDoc(userDocRef, {
                    firstName: firstName,
                    lastName: lastName,
                    phone: phone,
                    address: address,
                    city: city,
                    state: state,
                    zip: zip,
                    country: country,
                    lastUpdated: serverTimestamp()
                }, { merge: true }); // Use merge: true to avoid overwriting other fields like email, createdAt

                showNotification("Personal info updated successfully!", "success");
                loadProfile(); // Reload profile to reflect changes
            } catch (error) {
                console.error("Error updating profile personal info:", error);
                showNotification(`Failed to update personal info: ${error.message}`, "error");
            } finally {
                setButtonLoading(submitBtn, false);
            }
        });
    } else { console.warn("Update Profile Form or its elements not found."); }

    // --- NEW: Preferences Form Listener ---
    if (preferencesForm && newsletterCheckbox && savePreferencesBtn) {
        preferencesForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = auth.currentUser;
            const submitBtn = savePreferencesBtn;

            if (!user) {
                showNotification("You must be logged in to update preferences.", "error");
                return;
            }

            const isSubscribed = newsletterCheckbox.checked;

            setButtonLoading(submitBtn, true);

            try {
                const userDocRef = doc(db, FIRESTORE_USERS_COLLECTION, user.uid);
                await setDoc(userDocRef, {
                    newsletterSubscription: isSubscribed,
                    lastUpdated: serverTimestamp()
                }, { merge: true });

                showNotification("Preferences updated successfully!", "success");
            } catch (error) {
                console.error("Error updating preferences:", error);
                showNotification(`Failed to update preferences: ${error.message}`, "error");
            } finally {
                setButtonLoading(submitBtn, false);
            }
        });
    } else { console.warn("Preferences Form or its elements not found."); }


    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', async () => {
            const user = auth.currentUser;
            if (user) {
                showNotification("Sending password reset email...", "info");
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

    // --- NEW: Delete Account Button Listener ---
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', async () => {
            const user = auth.currentUser;
            if (!user) {
                showNotification("No user logged in to delete.", "error");
                return;
            }

            if (!confirm("Are you ABSOLUTELY sure you want to delete your account? This action is irreversible and will delete ALL your data (profile, vehicles, wishlist, etc.).")) {
                showNotification("Account deletion cancelled.", "info");
                return;
            }

            const password = prompt("To confirm, please enter your password:");
            if (!password) {
                showNotification("Account deletion cancelled.", "info");
                return;
            }

            setButtonLoading(deleteAccountBtn, true);

            try {
                // 1. Re-authenticate the user (Firebase security requirement)
                const credential = EmailAuthProvider.credential(user.email, password);
                await reauthenticateWithCredential(user, credential);
                showNotification("Re-authentication successful. Proceeding with deletion...", "info");

                // 2. Delete user's Firestore data (VERY IMPORTANT!)
                const userDocRef = doc(db, FIRESTORE_USERS_COLLECTION, user.uid);
                await deleteDoc(userDocRef); // Delete the main user profile document

                // Delete subcollection 'vehicles'
                const vehiclesCollectionRef = collection(db, FIRESTORE_USERS_COLLECTION, user.uid, FIRESTORE_VEHICLES_FIELD);
                const vehicleDocsSnapshot = await getDocs(vehiclesCollectionRef);
                const deleteVehiclePromises = vehicleDocsSnapshot.docs.map(d => deleteDoc(d.ref));
                await Promise.all(deleteVehiclePromises);

                // Delete subcollection 'wishlist' (assuming wishlist is also a subcollection)
                const wishlistCollectionRef = collection(db, FIRESTORE_USERS_COLLECTION, user.uid, FIRESTORE_WISHLIST_FIELD);
                const wishlistDocsSnapshot = await getDocs(wishlistCollectionRef);
                const deleteWishlistPromises = wishlistDocsSnapshot.docs.map(d => deleteDoc(d.ref));
                await Promise.all(deleteWishlistPromises);

                // NOTE: If orders or other data are stored in separate top-level collections
                // but linked by userId, you would need to query those collections and delete them here.
                // E.g., const ordersQuery = query(collection(db, 'orders'), where('userId', '==', user.uid));
                // const orderDocs = await getDocs(ordersQuery);
                // const deleteOrderPromises = orderDocs.docs.map(d => deleteDoc(d.ref));
                // await Promise.all(deleteOrderPromises);


                // 3. Delete Firebase Authentication account
                await deleteUser(user);

                showNotification("Your account and all associated data have been permanently deleted.", "success", 7000);
                // Auth state listener will handle UI redirect to home/auth
            } catch (error) {
                console.error("Error deleting account:", error);
                if (error.code === 'auth/requires-recent-login') {
                    showNotification("For security, please log in again just before deleting your account.", "error");
                } else if (error.code === 'auth/invalid-credential') {
                    showNotification("Incorrect password. Account deletion failed.", "error");
                } else if (error.code === 'auth/user-mismatch') {
                    showNotification("User mismatch. Please ensure you are logged in with the correct account.", "error");
                }
                else {
                    showNotification(`Account deletion failed: ${error.message}`, "error", 7000);
                }
            } finally {
                setButtonLoading(deleteAccountBtn, false);
            }
        });
    } else { console.warn("Delete Account button not found."); }


    // Contact Form
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            console.log("Contact form submitted.");
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

// MODIFIED: Updated to use the new FIRESTORE_USERS_COLLECTION for user profiles
function getUserProfileDocRef() {
    if (!auth.currentUser) {
        return null;
    }
    return doc(db, FIRESTORE_USERS_COLLECTION, auth.currentUser.uid);
}

// MODIFIED: This now points to a subcollection under the user's profile
function getUserVehiclesCollectionRef() {
    if (!auth.currentUser) {
        return null;
    }
    return collection(db, FIRESTORE_USERS_COLLECTION, auth.currentUser.uid, FIRESTORE_VEHICLES_FIELD);
}

// MODIFIED: This now points to a subcollection under the user's profile
function getUserWishlistCollectionRef() {
    if (!auth.currentUser) {
        return null;
    }
    return collection(db, FIRESTORE_USERS_COLLECTION, auth.currentUser.uid, FIRESTORE_WISHLIST_FIELD);
}

// MODIFIED: Fetches vehicles from the new user subcollection
async function getSavedVehiclesFromFirestore() {
    const userVehiclesCollectionRef = getUserVehiclesCollectionRef();
    if (!userVehiclesCollectionRef) {
        console.log("getSavedVehiclesFromFirestore: Not logged in, returning empty array.");
        return [];
    }

    try {
        const querySnapshot = await getDocs(userVehiclesCollectionRef);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); // Return with document ID
    } catch (error) {
        console.error("Error getting vehicles from Firestore:", error);
        showNotification("Error loading saved vehicles.", "error");
        return [];
    }
}

async function renderSavedVehicles() {
    const savedVehiclesContainer = document.getElementById('savedVehicles');
    const noVehiclesMessage = document.getElementById('noVehiclesMessage');

    if (!savedVehiclesContainer || !noVehiclesMessage) {
        console.warn("Garage display elements not found for rendering.");
        return;
    }

    savedVehiclesContainer.innerHTML = ''; // Clear previous content
    noVehiclesMessage.textContent = 'Loading your vehicles...';
    noVehiclesMessage.style.display = 'block';
    savedVehiclesContainer.appendChild(noVehiclesMessage); // Ensure loading message is in container


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
            savedVehiclesContainer.appendChild(noVehiclesMessage); // Ensure the message is actually inside the container
        } else {
            noVehiclesMessage.style.display = 'none'; // Hide the message if vehicles exist
            vehicles.forEach((vehicle) => { // Removed index as we'll use Firestore doc ID for deletion
                const vehicleCard = document.createElement('div');
                vehicleCard.className = 'vehicle-card';
                // Store the Firestore document ID for deletion
                vehicleCard.setAttribute('data-vehicle-firestore-id', vehicle.id);
                vehicleCard.innerHTML = `
                    <div class="vehicle-info">
                        <h4>${vehicle.year} ${vehicle.make} ${vehicle.model}</h4>
                        <p>Make: ${vehicle.make}</p>
                        <p>Model: ${vehicle.model}</p>
                        <p>Year: ${vehicle.year}</p>
                    </div>
                    <button class="delete-vehicle-btn"
                            data-vehicle-firestore-id="${vehicle.id}"
                            aria-label="Delete ${vehicle.year} ${vehicle.make} ${vehicle.model}">Delete</button>
                `;
                savedVehiclesContainer.appendChild(vehicleCard);
            });

            // Attach listeners after all cards are added
            document.querySelectorAll('#savedVehicles .delete-vehicle-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const firestoreIdToDelete = e.target.dataset.vehicleFirestoreId; // Get the Firestore document ID
                    await deleteVehicle(firestoreIdToDelete, e.target);
                });
            });
        }
    } catch (error) {
        console.error("Error in renderSavedVehicles:", error);
        noVehiclesMessage.textContent = 'Error loading your vehicles. Please try again.';
        noVehiclesMessage.style.display = 'block';
        savedVehiclesContainer.appendChild(noVehiclesMessage); // Ensure error message is in container
        showNotification("Error loading saved vehicles: " + error.message, "error", 5000);
    }
}

// MODIFIED: Delete vehicle by Firestore document ID
async function deleteVehicle(firestoreIdToDelete, button) {
    const userVehiclesCollectionRef = getUserVehiclesCollectionRef();
    if (!userVehiclesCollectionRef) {
        return;
    }

    setButtonLoading(button, true);

    try {
        // Delete the specific vehicle document from the subcollection
        await deleteDoc(doc(userVehiclesCollectionRef, firestoreIdToDelete));
        showNotification(`Vehicle deleted.`, 'info');
        // MODIFIED: Reload both garage and profile lists after deletion
        await renderSavedVehicles();
        await loadVehicleForProducts();
        await loadProfileVehicles(auth.currentUser.uid); // Update profile vehicles
    } catch (error) {
        console.error("Error deleting vehicle:", error);
        showNotification("Error deleting vehicle: " + error.message, "error");
    } finally {
        setButtonLoading(button, false);
    }
}

// MODIFIED: loadVehicleForProducts to work with new vehicle structure
async function loadVehicleForProducts() {
    const productContentDiv = document.getElementById('productContent');
    if (!productContentDiv) return;

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
            // Ensure selectedVehicleForSearch is a valid vehicle from the current list
            if (!selectedVehicleForSearch || !vehicles.some(v =>
                v.make === selectedVehicleForSearch.make &&
                v.model === selectedVehicleForSearch.model &&
                v.year === selectedVehicleForSearch.year)
            ) {
                // If selectedVehicleForSearch is null or no longer in the list, default to the first vehicle
                selectedVehicleForSearch = vehicles[0];
            }

            let vehicleOptionsHtml = vehicles.map((v) => `
                <option value="${v.id}" ${ // Use Firestore doc ID as value
                    (selectedVehicleForSearch &&
                     v.id === selectedVehicleForSearch.id) // Compare by ID now
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
                    const selectedVehicleId = event.target.value;
                    selectedVehicleForSearch = vehicles.find(v => v.id === selectedVehicleId); // Find by ID
                    currentSearchVehicleSpan.textContent = `${selectedVehicleForSearch.year} ${selectedVehicleForSearch.make} ${selectedVehicleForSearch.model}`;
                    // MODIFIED: No need to reload full page, just update the span
                    // loadVehicleForProducts();
                });
            }

            const generalSearchInput = document.getElementById('generalProductSearch');
            const generalSearchButton = document.getElementById('generalSearchButton');

            if (generalSearchInput && generalSearchButton) {
                generalSearchInput.addEventListener('keypress', (event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        searchAmazonGeneral(selectedVehicleForSearch.year, selectedVehicleForSearch.make, selectedVehicleForSearch.model);
                    }
                });

                generalSearchButton.addEventListener('click', () => {
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

// MODIFIED: addToWishlist to use user's subcollection for wishlist
async function addToWishlist(product) {
    const userWishlistCollectionRef = getUserWishlistCollectionRef();
    if (!userWishlistCollectionRef) {
        showNotification("Please log in to add items to your wishlist.", "error");
        return;
    }

    try {
        // Check if product already exists in wishlist using its ID
        const q = query(userWishlistCollectionRef, where('id', '==', product.id));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            showNotification(`${product.name} is already in your wishlist.`, "info");
            return;
        }

        // Add a new document to the wishlist subcollection
        await setDoc(doc(userWishlistCollectionRef), { ...product, addedAt: serverTimestamp() });
        showNotification(`${product.name} added to wishlist!`, "success");
        if (document.querySelector('.page.active')?.id === 'wishlist') {
            loadWishlist();
        }
    } catch (error) {
        console.error("Error adding to wishlist:", error);
        showNotification(`Failed to add ${product.name} to wishlist: ${error.message}`, "error");
    }
}

// MODIFIED: removeFromWishlist to use user's subcollection for wishlist
async function removeFromWishlist(productId, button) {
    const userWishlistCollectionRef = getUserWishlistCollectionRef();
    if (!userWishlistCollectionRef) {
        showNotification("Please log in to manage your wishlist.", "error");
        return;
    }

    setButtonLoading(button, true);

    try {
        // Query for the specific wishlist item by its 'id' field
        const q = query(userWishlistCollectionRef, where('id', '==', productId));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            // Get the document reference of the first matching item and delete it
            const docToDelete = querySnapshot.docs[0];
            await deleteDoc(doc(userWishlistCollectionRef, docToDelete.id)); // Delete by Firestore document ID
            showNotification("Product removed from wishlist.", "info");
            loadWishlist();
        } else {
            showNotification("Product not found in wishlist (already removed?).", "info");
        }
    } catch (error) {
        console.error("Error removing from wishlist:", error);
        showNotification("Failed to remove product from wishlist: " + error.message, "error");
    } finally {
        setButtonLoading(button, false);
    }
}

// MODIFIED: clearWishlist to use user's subcollection for wishlist
async function clearWishlist(button) {
    const userWishlistCollectionRef = getUserWishlistCollectionRef();
    if (!userWishlistCollectionRef) {
        showNotification("Please log in to clear your wishlist.", "error");
        return;
    }

    setButtonLoading(button, true);

    try {
        const querySnapshot = await getDocs(userWishlistCollectionRef);
        const deletePromises = querySnapshot.docs.map(d => deleteDoc(d.ref));
        await Promise.all(deletePromises); // Delete all documents in the subcollection

        showNotification("Wishlist cleared!", "info");
        loadWishlist();
    } catch (error) {
        console.error("Error clearing wishlist:", error);
        showNotification("Failed to clear wishlist: " + error.message, "error");
    } finally {
        setButtonLoading(button, false);
    }
}

// MODIFIED: getWishlistFromFirestore to use user's subcollection for wishlist
async function getWishlistFromFirestore() {
    const userWishlistCollectionRef = getUserWishlistCollectionRef();
    if (!userWishlistCollectionRef) {
        console.log("getWishlistFromFirestore: Not logged in, returning empty array.");
        return [];
    }

    try {
        const querySnapshot = await getDocs(userWishlistCollectionRef);
        return querySnapshot.docs.map(doc => doc.data()); // Return just the data
    } catch (error) {
        console.error("Error getting wishlist from Firestore:", error);
        showNotification("Error loading wishlist.", "error");
        return [];
    }
}

async function loadWishlist() {
    const wishlistItemsContainer = document.getElementById('wishlistItems');
    const clearWishlistButton = document.getElementById('clearWishlistBtn');
    const wishlistInitialMessage = document.querySelector('#wishlistItems .no-items-message');

    if (!wishlistItemsContainer || !wishlistInitialMessage || !clearWishlistButton) {
        console.warn("Wishlist display elements not found for rendering.");
        return;
    }

    wishlistItemsContainer.innerHTML = '';
    wishlistInitialMessage.textContent = 'Loading your wishlist...';
    wishlistInitialMessage.style.display = 'block';
    clearWishlistButton.style.display = 'none';
    wishlistItemsContainer.appendChild(wishlistInitialMessage);


    if (!auth.currentUser) {
        wishlistInitialMessage.textContent = 'Please log in to see your wishlist, or add some products from the Products page!';
        return;
    }

    try {
        const wishlist = await getWishlistFromFirestore();
        wishlistItemsContainer.innerHTML = ''; // Clear loading message now that data is fetched

        if (wishlist.length === 0) {
            wishlistInitialMessage.textContent = 'Your wishlist is empty. Add some products from the Products page!';
            wishlistInitialMessage.style.display = 'block';
            clearWishlistButton.style.display = 'none';
            wishlistItemsContainer.appendChild(wishlistInitialMessage);
        } else {
            wishlistInitialMessage.style.display = 'none';
            clearWishlistButton.style.display = 'block';

            wishlist.forEach(product => {
                const productCard = document.createElement('div');
                productCard.className = 'card wishlist-card';
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
        // Append initial message again in case it was removed
        if (wishlistItemsContainer.querySelector('.no-items-message') === null) {
             wishlistItemsContainer.appendChild(wishlistInitialMessage);
        }
        showNotification("Error loading wishlist: " + error.message, "error", 5000);
    }
}

// --- MODIFIED: loadProfile to fetch and populate all profile data ---
async function loadProfile() {
    // Basic account info
    const profileEmailSpan = document.getElementById('profileEmail');
    const profileDisplayNameSpan = document.getElementById('profileDisplayName'); // Span for display name

    // Personal Info inputs
    const firstNameInput = document.getElementById('firstNameInput');
    const lastNameInput = document.getElementById('lastNameInput');
    const phoneInput = document.getElementById('phoneInput');
    const addressInput = document.getElementById('addressInput');
    const cityInput = document.getElementById('cityInput');
    const stateInput = document.getElementById('stateInput');
    const zipInput = document.getElementById('zipInput');
    const countryInput = document.getElementById('countryInput');

    // Preferences
    const newsletterCheckbox = document.getElementById('newsletterCheckbox');

    if (!profileEmailSpan || !profileDisplayNameSpan || !firstNameInput || !newsletterCheckbox) { // Check essential elements
        console.warn("Profile page elements not fully loaded for profile data operations.");
        // Attempt to load essential elements again if they weren't ready
        document.addEventListener('DOMContentLoaded', loadProfile);
        return;
    }

    const user = auth.currentUser;
    if (user) {
        profileEmailSpan.textContent = user.email;
        profileDisplayNameSpan.textContent = user.displayName || 'Not set';

        const userDocRef = getUserProfileDocRef(); // Get the reference to the main user document in 'users' collection

        try {
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
                const userData = docSnap.data();
                // Populate personal info fields
                firstNameInput.value = userData.firstName || '';
                lastNameInput.value = userData.lastName || '';
                phoneInput.value = userData.phone || '';
                addressInput.value = userData.address || '';
                cityInput.value = userData.city || '';
                stateInput.value = userData.state || '';
                zipInput.value = userData.zip || '';
                countryInput.value = userData.country || '';

                // Populate preferences
                newsletterCheckbox.checked = userData.newsletterSubscription || false;
            } else {
                console.log("No custom profile data found for this user. Initializing fields.");
                // Clear fields if no custom data exists
                firstNameInput.value = '';
                lastNameInput.value = '';
                phoneInput.value = '';
                addressInput.value = '';
                cityInput.value = '';
                stateInput.value = '';
                zipInput.value = '';
                countryInput.value = '';
                newsletterCheckbox.checked = false;
                // You might create an empty user document here if you want it to exist immediately upon profile visit
                // setDoc(userDocRef, { email: user.email, displayName: user.displayName || '', createdAt: serverTimestamp() }, { merge: true });
            }

            // Load saved vehicles for the profile page
            await loadProfileVehicles(user.uid);
            // Load order history (placeholder for now)
            loadOrderHistory(user.uid); // This function needs to be implemented

        } catch (error) {
            console.error("Error loading profile data:", error);
            showNotification("Error loading profile data. Please try again.", "error");
        }

    } else {
        // Clear all profile display elements and inputs if no user is logged in
        profileEmailSpan.textContent = 'Not logged in';
        profileDisplayNameSpan.textContent = 'Not set';
        firstNameInput.value = '';
        lastNameInput.value = '';
        phoneInput.value = '';
        addressInput.value = '';
        cityInput.value = '';
        stateInput.value = '';
        zipInput.value = '';
        countryInput.value = '';
        newsletterCheckbox.checked = false;

        // Clear vehicles and order history on profile page
        if (profileSavedVehiclesList) {
            profileSavedVehiclesList.innerHTML = '<p id="noProfileVehiclesMessage" class="no-items-message">Please log in to see your saved vehicles.</p>';
        }
        if (orderHistoryList) {
            orderHistoryList.innerHTML = '<p class="no-items-message">Please log in to see your order history.</p>';
        }
        showNotification("Please log in to view your profile.", "info");
    }
}

// --- NEW: Function to load and display vehicles on the profile page ---
async function loadProfileVehicles(userId) {
    const vehiclesListDiv = document.getElementById('profileSavedVehiclesList');
    const noVehiclesMessage = document.getElementById('noProfileVehiclesMessage'); // New ID for consistency

    if (!vehiclesListDiv || !noVehiclesMessage) {
        console.warn("Profile vehicles display elements not found.");
        return;
    }

    vehiclesListDiv.innerHTML = ''; // Clear previous content
    noVehiclesMessage.textContent = 'Loading your saved vehicles...';
    noVehiclesMessage.style.display = 'block';
    vehiclesListDiv.appendChild(noVehiclesMessage);

    const userVehiclesCollectionRef = collection(db, FIRESTORE_USERS_COLLECTION, userId, FIRESTORE_VEHICLES_FIELD);

    try {
        const querySnapshot = await getDocs(userVehiclesCollectionRef);
        if (querySnapshot.empty) {
            noVehiclesMessage.textContent = 'No vehicles saved yet. Go to My Garage to add one!';
            noVehiclesMessage.style.display = 'block';
            vehiclesListDiv.appendChild(noVehiclesMessage);
            return;
        }

        vehiclesListDiv.innerHTML = ''; // Clear loading message
        querySnapshot.forEach((docSnap) => {
            const vehicle = docSnap.data();
            const vehicleId = docSnap.id; // Get the Firestore document ID
            const vehicleCard = document.createElement('div');
            vehicleCard.className = 'vehicle-card-profile card'; // Use the new class and card style
            vehicleCard.setAttribute('data-vehicle-id', vehicleId);
            vehicleCard.innerHTML = `
                <div class="vehicle-info">
                    <h5>${vehicle.year} ${vehicle.make} ${vehicle.model}</h5>
                    <p>Make: ${vehicle.make}</p>
                    <p>Model: ${vehicle.model}</p>
                    <p>Year: ${vehicle.year}</p>
                </div>
                <button class="delete-vehicle-btn-profile" data-vehicle-id="${vehicleId}">Remove</button>
            `;
            vehiclesListDiv.appendChild(vehicleCard);
        });

        // Attach event listeners for the "Remove" buttons on profile page vehicles
        vehiclesListDiv.querySelectorAll('.delete-vehicle-btn-profile').forEach(button => {
            button.addEventListener('click', async (e) => {
                const idToDelete = e.target.dataset.vehicleId;
                if (confirm('Are you sure you want to remove this vehicle from your garage?')) {
                    const user = auth.currentUser;
                    if (user) {
                        try {
                            // Call the existing deleteVehicle function (which works with Firestore IDs)
                            await deleteVehicle(idToDelete, e.target);
                            showNotification('Vehicle removed from your garage.', 'success');
                            loadProfileVehicles(user.uid); // Reload profile's vehicle list
                        } catch (error) {
                            console.error('Error removing vehicle from profile:', error);
                            showNotification('Failed to remove vehicle from profile.', 'error');
                        }
                    }
                }
            });
        });

    } catch (error) {
        console.error("Error loading profile vehicles:", error);
        noVehiclesMessage.textContent = 'Error loading your saved vehicles. Please try again.';
        noVehiclesMessage.style.display = 'block';
        vehiclesListDiv.appendChild(noVehiclesMessage);
        showNotification("Error loading saved vehicles for profile: " + error.message, "error");
    }
}


// --- NEW: Order History Placeholder Function ---
function loadOrderHistory(userId) {
    const orderListDiv = document.getElementById('orderHistoryList');
    if (!orderListDiv) {
        console.warn("Order history list element not found.");
        return;
    }
    // This is a placeholder. In a real app, you'd fetch orders from Firestore
    // For now, it just displays the static message from HTML
    if (userId) {
        orderListDiv.innerHTML = '<p class="no-items-message">No past orders found. Start shopping today!</p>';
        // Example of how you might fetch and render orders:
        /*
        const ordersCollectionRef = collection(db, 'orders'); // Assuming a top-level 'orders' collection
        const q = query(ordersCollectionRef, where('userId', '==', userId), orderBy('timestamp', 'desc'));

        getDocs(q).then(snapshot => {
            if (snapshot.empty) {
                orderListDiv.innerHTML = '<p class="no-items-message">No past orders found. Start shopping today!</p>';
                return;
            }
            orderListDiv.innerHTML = ''; // Clear message
            snapshot.forEach(orderDoc => {
                const order = orderDoc.data();
                const orderCard = document.createElement('div');
                orderCard.className = 'card order-card';
                orderCard.innerHTML = `
                    <h5>Order #${orderDoc.id.substring(0, 8)}</h5>
                    <p>Date: ${order.timestamp ? new Date(order.timestamp.toDate()).toLocaleDateString() : 'N/A'}</p>
                    <p>Total: $${order.total ? order.total.toFixed(2) : 'N/A'}</p>
                    <p>Status: ${order.status || 'Processing'}</p>
                    <button class="view-order-details-btn">View Details</button>
                `;
                orderListDiv.appendChild(orderCard);
            });
        }).catch(error => {
            console.error("Error loading order history:", error);
            orderListDiv.innerHTML = '<p class="no-items-message">Error loading order history.</p>';
            showNotification("Error loading order history.", "error");
        });
        */
    } else {
        orderListDiv.innerHTML = '<p class="no-items-message">Please log in to see your order history.</p>';
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
