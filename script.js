// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js"; 
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
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);


// Amazon Affiliate Tag
const amazonTag = "everythi09e02-20"; 

// --- Global DOM Elements (initially null, assigned in DOMContentLoaded) ---
let navLinks;
let hamburgerMenu;
let userEmailSpan;
let notificationContainer;

// --- Auth Form Elements (assigned in DOMContentLoaded) ---
let loginForm;
let loginEmailInput;
let loginPassInput;
let regForm; // Renamed for clarity: registerForm to regForm
let regEmailInput;
let regPassInput;
let googleLoginBtn;
let logoutBtn;
let toggleLoginPassBtn;
let toggleRegPassBtn;
let forgotPasswordLink;
let passwordStrengthIndicator; // Declared globally for strength meter

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
let wishlistEmptyMessage;

// --- Profile Elements (assigned in DOMContentLoaded) ---
let profileEmailSpan;
let updateProfileBtn;
let changePasswordBtn;

// --- Contact Form Elements (assigned in DOMContentLoaded) ---
let contactForm;


// --- Page Navigation ---
window.showPage = function(id) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(id).classList.add("active");

    if (hamburgerMenu && hamburgerMenu.classList.contains('active')) { 
        hamburgerMenu.classList.remove('active');
        navLinks.classList.remove('active');
    }

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
    if (!userEmailSpan) { // Ensure userEmailSpan exists before trying to use it
        console.warn("userEmailSpan not found, delaying auth state update.");
        document.addEventListener('DOMContentLoaded', () => { // Retry after DOM is ready
            const emailSpan = document.getElementById("userEmail");
            if (emailSpan) updateAuthStateUI(user, emailSpan);
        });
    } else {
        updateAuthStateUI(user, userEmailSpan);
    }
});

function updateAuthStateUI(user, emailSpanElement) {
    console.log("Auth state changed. User:", user ? user.email : "none");
    if (user) {
        emailSpanElement.textContent = `Logged in as: ${user.email}`;
        
        if (document.querySelector('.page.active')?.id === 'auth') {
            showPage('home'); 
        }
        clearAuthFields(); 
        renderSavedVehicles(); 
        loadWishlist(); 
        loadProfile(); 
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
    }
}

// --- DOMContentLoaded for Element Retrieval and Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // Assign Global DOM Elements
    navLinks = document.getElementById('navLinks');
    hamburgerMenu = document.getElementById('hamburgerMenu');
    userEmailSpan = document.getElementById('userEmail');
    notificationContainer = document.getElementById('notificationContainer');

    // Assign Auth Form Elements
    loginForm = document.getElementById('loginForm');
    loginEmailInput = document.getElementById("loginEmail");
    loginPassInput = document.getElementById("loginPass");
    regForm = document.getElementById('registerForm'); // Corrected name
    regEmailInput = document.getElementById("regEmail");
    regPassInput = document.getElementById("regPass");
    googleLoginBtn = document.getElementById('googleLoginBtn');
    logoutBtn = document.getElementById('logoutBtn');
    toggleLoginPassBtn = document.getElementById('toggleLoginPass');
    toggleRegPassBtn = document.getElementById('toggleRegPass');
    forgotPasswordLink = document.querySelector('.forgot-password-link');
    passwordStrengthIndicator = document.getElementById('passwordStrength'); // Already defined globally, but ensure it's in DOM

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
    wishlistEmptyMessage = document.querySelector('#wishlist .no-items-message');

    // Assign Profile Elements
    profileEmailSpan = document.getElementById('profileEmail');
    updateProfileBtn = document.getElementById('updateProfileBtn');
    changePasswordBtn = document.getElementById('changePasswordBtn');

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
    if (loginForm) {
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
    }

    // Register Form
    if (regForm) {
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
        if (regPassInput && !passwordStrengthIndicator.parentNode) { // Ensure element is not already appended
            passwordStrengthIndicator.id = 'passwordStrength'; // Re-assign ID if needed
            passwordStrengthIndicator.className = 'password-strength';
            regPassInput.parentNode.insertBefore(passwordStrengthIndicator, regPassInput.nextSibling);
            regPassInput.addEventListener('input', () => {
                const password = regPassInput.value;
                const strength = checkPasswordStrength(password);
                updatePasswordStrengthIndicator(strength);
            });
        }
    }

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
    }

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
    }

    // Forgot Password
    if (forgotPasswordLink && loginEmailInput) { // Ensure both elements exist
        forgotPasswordLink.addEventListener('click', async (e) => {
            console.log("Forgot Password clicked.");
            e.preventDefault();
            const email = loginEmailInput.value.trim();

            if (!email) {
                displayFormError('loginEmailError', 'Please enter your email to reset password.');
                showNotification('Please enter your email for password reset.', 'error');
                setButtonLoading(forgotPasswordLink, false); 
                return;
            }

            setButtonLoading(forgotPasswordLink, true); 

            try {
                await sendPasswordResetResetEmail(auth, email); // Corrected function name
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
                showNotification(`Password reset error: ${errorMessage}`, 'error', 7000);
                console.error("Password reset error:", error);
            } finally {
                setButtonLoading(forgotPasswordLink, false);
            }
        });
    }

    // Password Visibility Toggles
    if (toggleLoginPassBtn && loginPassInput) {
        toggleLoginPassBtn.addEventListener('click', () => {
            const type = loginPassInput.getAttribute('type') === 'password' ? 'text' : 'password';
            loginPassInput.setAttribute('type', type);
            toggleLoginPassBtn.setAttribute('aria-label', type === 'password' ? 'Show password' : 'Hide password');
            toggleLoginPassBtn.textContent = type === 'password' ? '👁️' : '🙈';
        });
    }
    if (toggleRegPassBtn && regPassInput) {
        toggleRegPassBtn.addEventListener('click', () => {
            const type = regPassInput.getAttribute('type') === 'password' ? 'text' : 'password';
            regPassInput.setAttribute('type', type);
            toggleRegPassBtn.setAttribute('aria-label', type === 'password' ? 'Show password' : 'Hide password');
            toggleRegPassBtn.textContent = type === 'password' ? '👁️' : '🙈';
        });
    }

    // My Garage Form
    if (garageForm) {
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

                if (!userDocSnap.exists() || !userDocSnap.data().hasOwnProperty(FIRESTORE_VEHICLES_FIELD)) {
                    console.log("Creating new document or initializing vehicles field with setDoc.");
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
                
                showNotification(`Vehicle "${year} ${make} ${model}" saved to your garage!`, 'success'); 
                garageForm.reset();
                renderSavedVehicles(); 
                loadVehicleForProducts(); 
                console.log("Vehicle save process completed successfully.");
            } catch (err) { 
                console.error("Unhandled error during garage form submission:", err);
                showNotification("Error saving vehicle: " + err.message, "error", 5000); 
            } finally {
                setButtonLoading(submitBtn, false); 
                console.log("Finally block executed, loading state removed.");
            }
        });
    }

    // Featured Products Grid (for Add to Wishlist buttons)
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
    }

    // Wishlist Items Container (for Remove from Wishlist buttons)
    if (wishlistItemsContainer) {
        wishlistItemsContainer.addEventListener('click', async (event) => {
            if (event.target.classList.contains('remove-from-wishlist-btn')) {
                const productIdToRemove = event.target.dataset.productId;
                await removeFromWishlist(productIdToRemove, event.target); 
            }
        });
    }

    // Clear Wishlist Button
    if (clearWishlistButton) {
        clearWishlistButton.addEventListener('click', async () => {
            if (confirm("Are you sure you want to clear your entire wishlist?")) {
                await clearWishlist(clearWishlistButton); 
            }
        });
    }

    // Profile Page Buttons
    if (updateProfileBtn) {
        updateProfileBtn.addEventListener('click', () => {
            showNotification("Update Profile functionality is coming soon!", "info");
        });
    }

    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', async () => {
            const user = auth.currentUser;
            if (user) {
                showNotification("Change Password functionality: A password reset email will be sent.", "info");
                try {
                    await sendPasswordResetEmail(auth, user.email);
                    showNotification(`Password change email sent to ${user.email}. Please check your inbox.`, 'success', 7000);
                } catch (error) {
                    console.error("Change password email error:", error); 
                    showNotification(`Failed to send password change email: ${error.message}`, 'error', 7000);
                }
            } else {
                showNotification("Please log in to change your password.", "error");
            }
        });
    }

    // Contact Form
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            console.log("Contact form submitted!");
            e.preventDefault(); 
            const submitBtn = e.submitter;

            clearFormErrors('contactForm');

            let isValid = true;
            const contactName = contactForm.contactName.value.trim(); // Use contactForm ref
            const contactEmail = contactForm.contactEmail.value.trim(); // Use contactForm ref
            const contactMessage = contactForm.contactMessage.value.trim(); // Use contactForm ref

            if (!contactName) { displayFormError('contactNameError', 'Name is required.'); isValid = false; }
            if (!contactEmail || !contactEmail.includes('@')) { displayFormError('contactEmailError', 'A valid email is required.'); isValid = false; }
            if (!contactMessage) { displayFormError('contactMessageError', 'Message cannot be empty.'); isValid = false; }
            
            if (!isValid) {
                showNotification('Please fill in all required fields.', 'error');
                return;
            }

            setButtonLoading(submitBtn, true); 

            try {
                const response = await fetch(contactForm.action, { // Use contactForm ref
                    method: contactForm.method, // Use contactForm ref
                    body: new FormData(contactForm), // Use contactForm ref
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
    }

    // Footer Current Year
    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // Initial page load
    showPage('home'); 
});

// --- Helper Functions (defined outside DOMContentLoaded so they are globally accessible) ---

function checkPasswordStrength(password) {
    let score = 0;
    if (password.length > 5) score++;
    if (password.length > 7) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++; // Special characters

    if (score < 3) return 'weak';
    if (score < 5) return 'medium';
    return 'strong';
}

function updatePasswordStrengthIndicator(strength) {
    if (passwordStrengthIndicator) { // Ensure element exists
        passwordStrengthIndicator.textContent = `Strength: ${strength.charAt(0).toUpperCase() + strength.slice(1)}`;
        passwordStrengthIndicator.className = `password-strength ${strength}`;
    }
}

const FIRESTORE_VEHICLES_FIELD = 'vehicles'; 

function getUserGarageDocRef() {
    if (!auth.currentUser) {
        showNotification("Please log in to manage your garage.", "error");
        return null;
    }
    return doc(db, "garages", auth.currentUser.uid);
}

async function getSavedVehiclesFromFirestore() {
    const userDocRef = getUserGarageDocRef();
    if (!userDocRef) return [];

    try {
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const data = userDoc.data();
            return data[FIRESTORE_VEHICLES_FIELD] || []; 
        }
        return [];
    } catch (error) {
        console.error("Error getting vehicles from Firestore:", error); 
        showNotification("Error loading saved vehicles.", "error");
        return [];
    }
}

async function loadVehicleForProducts() {
    const productContentDiv = document.getElementById('productContent'); // Re-get if dynamic
    if (!productContentDiv) return; // Guard
    
    productContentDiv.innerHTML = '<p class="no-items-message">Loading your vehicle data...</p>'; 

    if (!auth.currentUser) {
        productContentDiv.innerHTML = `
            <div class="no-vehicle-message">
                <h3>Please Log In or Save Your Vehicle</h3>
                <p>To get personalized part searches, please <a href="#" onclick="showPage('auth')">log in</a> or go to <a href="#" onclick="showPage('garage')">My Garage</a> to save your vehicle details.</p>
            </div>
        `;
        return;
    }

    try {
        const vehicles = await getSavedVehiclesFromFirestore(); 

        if (vehicles.length > 0) {
            const { year, make, model } = vehicles[0]; 
            
            let htmlContent = `
                <h3 style="text-align: center;">Parts for Your ${year} ${make} ${model}</h3>
                <div class="vehicle-info">Using Saved Vehicle: ${year} ${make} ${model}</div>
                
                <div class="general-search-section">
                    <label for="generalProductSearch" class="sr-only">Search Parts by Keyword</label>
                    <input type="text" id="generalProductSearch" placeholder="Search for any part (e.g., 'alternator')" />
                    <button id="generalSearchButton">Search</button>
                </div>

                <p style="text-align: center; margin-top: 2rem; margin-bottom: 1.5rem;">Or click a category below to search Amazon directly for your vehicle:</p>
                <div class="category-buttons">
                    <button onclick="searchAmazonSpecific('${year}', '${make}', '${model}', 'Brake Pads')">Brake Pads</button>
                    <button onclick="searchAmazonSpecific('${year}', '${make}', '${model}', 'Oil Filter')">Oil Filter</button>
                    <button onclick="searchAmazonSpecific('${year}', '${make}', '${model}', 'Air Filter')">Air Filter</button>
                    <button onclick="searchAmazonSpecific('${year}', '${make}', '${model}', 'Spark Plugs')">Spark Plugs</button>
                    <button onclick="searchAmazonSpecific('${year}', '${make}', '${model}', 'Suspension Kit')">Suspension Kit</button>
                    <button onclick="searchAmazonSpecific('${year}', '${make}', '${model}', 'Headlights')">Headlights</button>
                    <button onclick="searchAmazonSpecific('${year}', '${make}', '${model}', 'Tail Lights')">Tail Lights</button>
                    <button onclick="searchAmazonSpecific('${year}', '${make}', '${model}', 'Windshield Wipers')">Wiper Blades</button>
                    <button onclick="searchAmazonSpecific('${year}', '${make}', '${model}', 'Radiator')">Radiator</button>
                    <button onclick="searchAmazonSpecific('${year}', '${make}', '${model}', 'Battery')">Battery</button>
                    </div>
            `;
            productContentDiv.innerHTML = htmlContent;

            // Re-attach listeners for dynamically created elements
            const generalSearchInput = document.getElementById('generalProductSearch');
            const generalSearchButton = document.getElementById('generalSearchButton'); 

            if (generalSearchInput) { 
                generalSearchInput.addEventListener('keypress', (event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault(); 
                        setButtonLoading(generalSearchButton, true); 
                        searchAmazonGeneral(year, make, model);
                        setButtonLoading(generalSearchButton, false); 
                    }
                });
            }

            if (generalSearchButton) { 
                generalSearchButton.addEventListener('click', () => {
                    setButtonLoading(generalSearchButton, true); 
                    searchAmazonGeneral(year, make, model);
                    setButtonLoading(generalSearchButton, false); 
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
    if (!userDocRef) return; 

    try {
        const currentWishlist = await getWishlistFromFirestore();
        const exists = currentWishlist.some(item => item.id === product.id);

        if (!exists) {
            await updateDoc(userDocRef, {
                wishlist: arrayUnion(product)
            });
            showNotification(`${product.name} added to wishlist!`, "success");
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
    if (!userDocRef) return;

    setButtonLoading(button, true);

    try {
        const currentWishlist = await getWishlistFromFirestore();
        const itemToRemove = currentWishlist.find(item => item.id === productId);

        if (itemToRemove) {
            await updateDoc(userDocRef, {
                wishlist: arrayRemove(itemToRemove)
            });
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

async function clearWishlist(button) {
    const userDocRef = getUserGarageDocRef();
    if (!userDocRef) return;

    setButtonLoading(button, true);

    try {
        await updateDoc(userDocRef, {
            wishlist: [] 
        });
        showNotification("Wishlist cleared!", "info");
        loadWishlist(); 
    } catch (error) {
        console.error("Error clearing wishlist:", error);
        showNotification("Failed to clear wishlist: " + error.message, "error");
    } finally {
        setButtonLoading(button, false);
    }
}

async function loadWishlist() {
    // Re-get elements in case of dynamic page changes or initial load order issues
    const wishlistItemsContainer = document.getElementById('wishlistItems');
    const wishlistEmptyMessage = document.querySelector('#wishlist .no-items-message'); 
    const clearWishlistButton = document.getElementById('clearWishlistBtn');

    if (!wishlistItemsContainer || !wishlistEmptyMessage || !clearWishlistButton) {
        console.warn("Wishlist DOM elements not found.");
        return;
    }

    wishlistItemsContainer.innerHTML = '<p class="no-items-message">Loading wishlist...</p>';
    wishlistEmptyMessage.style.display = 'block'; 

    const userDocRef = getUserGarageDocRef();
    if (!userDocRef || !auth.currentUser) { 
        wishlistItemsContainer.innerHTML = ''; 
        wishlistEmptyMessage.textContent = 'Please log in to see your wishlist, or add some products from the Products page!';
        clearWishlistButton.style.display = 'none'; 
        return;
    }

    const wishlist = await getWishlistFromFirestore();
    wishlistItemsContainer.innerHTML = ''; 

    if (wishlist.length === 0) {
        wishlistEmptyMessage.textContent = 'Your wishlist is empty. Add some products from the Products page!';
        clearWishlistButton.style.display = 'none';
    } else {
        wishlistEmptyMessage.style.display = 'none'; 
        clearWishlistButton.style.display = 'block'; 
        wishlist.forEach(product => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                ${product.imageUrl ? `<img src="${product.imageUrl}" alt="${product.name}">` : ''}
                <h4>${product.name}</h4>
                <p>${product.brand || 'No Brand'} – $${product.price ? product.price.toFixed(2) : 'N/A'}</p>
                <a href="${product.amazonUrl}" target="_blank" rel="noopener noreferrer" aria-label="Buy ${product.name} on Amazon">Buy on Amazon</a>
                <button class="remove-from-wishlist-btn" data-product-id="${product.id}">Remove</button>
            `;
            wishlistItemsContainer.appendChild(card);
        });
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
    // Ensure passwordStrengthIndicator is globally defined and attached
    if (document.getElementById('passwordStrength')) {
        document.getElementById('passwordStrength').textContent = `Strength: ${strength.charAt(0).toUpperCase() + strength.slice(1)}`;
        document.getElementById('passwordStrength').className = `password-strength ${strength}`;
    }
}

// Global scope for some elements used in multiple functions before DOMContentLoaded
const FIRESTORE_VEHICLES_FIELD = 'vehicles'; 

function getUserGarageDocRef() {
    if (!auth.currentUser) {
        showNotification("Please log in to manage your garage.", "error");
        return null;
    }
    return doc(db, "garages", auth.currentUser.uid);
}

function loadProfile() {
    // Re-get element in case of dynamic page changes or initial load order issues
    const profileEmailSpan = document.getElementById('profileEmail'); 
    if (!profileEmailSpan) return; // Guard

    const user = auth.currentUser;
    if (user) {
        profileEmailSpan.textContent = user.email;
    } else {
        profileEmailSpan.textContent = "Not logged in";
        if (document.querySelector('.page.active')?.id === 'profile') {
            showPage('auth');
            showNotification('Please log in to view your profile.', 'info');
        }
    }
}
