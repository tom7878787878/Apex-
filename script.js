// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut, sendPasswordResetEmail, updatePassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js"; // NEW: Added updatePassword (for future use)
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

// --- DOM Elements ---
const navLinks = document.getElementById('navLinks');
const hamburgerMenu = document.getElementById('hamburgerMenu');
const userEmailSpan = document.getElementById('userEmail');
const notificationContainer = document.getElementById('notificationContainer');

// --- Page Navigation ---
window.showPage = function(id) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(id).classList.add("active");

    // Close hamburger menu if open on page switch
    if (hamburgerMenu.classList.contains('active')) { // Check for 'active' class
        hamburgerMenu.classList.remove('active'); // Remove 'active' from hamburger if you have toggle for bars
        navLinks.classList.remove('active');
    }

    // Special handling for pages that need data loaded on view
    if (id === 'products') {
        loadVehicleForProducts();
    } else if (id === 'garage') {
        renderSavedVehicles(); // Use new render function for garage
    } else if (id === 'wishlist') { 
        loadWishlist(); // Call loadWishlist when navigating to the wishlist page
    } else if (id === 'profile') { // NEW: Profile page specific logic
        loadProfile();
    }
}

// --- Hamburger Menu Toggle ---
hamburgerMenu.addEventListener('click', (event) => {
    event.stopPropagation();
    navLinks.classList.toggle('active');
    hamburgerMenu.classList.toggle('open'); // Toggle 'open' class for hamburger icon animation
});

// Close nav when a link is clicked
navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        if (navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
            hamburgerMenu.classList.remove('open'); // Also close hamburger icon
        }
    });
});

// Close nav when clicking outside
document.addEventListener('click', (event) => {
    if (!navLinks.contains(event.target) && !hamburgerMenu.contains(event.target) && navLinks.classList.contains('active')) {
        navLinks.classList.remove('active');
        hamburgerMenu.classList.remove('open'); // Also close hamburger icon
    }
});

// --- Notification System ---
function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification-item notification-${type}`;
    notification.innerHTML = `
        <span class="notification-message">${message}</span>
        <button class="notification-close" aria-label="Close notification">&times;</button>
    `;
    notificationContainer.appendChild(notification);

    // Auto-remove after duration
    const timeoutId = setTimeout(() => {
        notification.remove();
    }, duration);

    // Manual close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
        clearTimeout(timeoutId); // Prevent auto-removal
        notification.remove();
    });
}

// --- Footer Current Year ---
document.addEventListener('DOMContentLoaded', () => {
    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }
});


// --- Form Error Display Helper ---
function displayFormError(elementId, message) {
    const errorSpan = document.getElementById(elementId);
    if (errorSpan) {
        errorSpan.textContent = message;
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
    document.getElementById("loginEmail").value = "";
    document.getElementById("loginPass").value = "";
    document.getElementById("regEmail").value = "";
    document.getElementById("regPass").value = "";
    // NEW: Clear password strength indicator
    const passwordStrengthIndicator = document.getElementById('passwordStrength');
    if (passwordStrengthIndicator) {
        passwordStrengthIndicator.textContent = '';
        passwordStrengthIndicator.className = 'password-strength'; // Reset class
    }
    clearFormErrors('loginForm');
    clearFormErrors('registerForm');
}

// --- Button Loading State Management ---
const originalButtonTexts = new Map(); 

function setButtonLoading(button, isLoading) {
    if (!button) return; // Guard against null button

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
            originalButtonTexts.delete(button); // Clean up
        }
        button.classList.remove('is-loading');
        button.disabled = false;
    }
}


// --- Auth State Listener ---
onAuthStateChanged(auth, user => {
    const emailSpan = document.getElementById("userEmail");
    if (user) {
        emailSpan.textContent = `Logged in as: ${user.email}`;
        
        // If coming from auth page, automatically switch to home (or garage/products)
        if (document.querySelector('.page.active')?.id === 'auth') {
            showPage('home'); 
        }
        clearAuthFields(); 
        // Always load vehicles/wishlist after auth state change, especially on page load
        renderSavedVehicles(); // Reload garage
        loadWishlist(); // Reload wishlist
        loadProfile(); // NEW: Load profile data on auth change
    } else {
        emailSpan.textContent = "";
        // If the user logs out or is not logged in and on garage/wishlist/profile page, redirect to auth
        if (document.querySelector(".page.active")?.id === "garage" || 
            document.querySelector(".page.active")?.id === "wishlist" ||
            document.querySelector(".page.active")?.id === "profile") { // NEW: Added profile redirect
            showPage("auth");
        }
        // Clear local displays if user logs out (Firestore will be empty if not public)
        clearAuthFields(); 
        renderSavedVehicles(); // Clear garage display
        loadWishlist(); // Clear wishlist display
        loadProfile(); // NEW: Clear profile display
    }
});

// --- Login ---
document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const loginEmailInput = document.getElementById("loginEmail");
    const loginPassInput = document.getElementById("loginPass");
    const submitBtn = e.submitter; 

    clearFormErrors('loginForm');
    let isValid = true;
    if (!loginEmailInput.value) { displayFormError('loginEmailError', 'Email is required.'); isValid = false; }
    if (!loginPassInput.value) { displayFormError('loginPassError', 'Password is required.'); isValid = false; }
    if (!isValid) { showNotification('Please fill in all required fields.', 'error'); return; }


    setButtonLoading(submitBtn, true); 

    try {
        await signInWithEmailAndPassword(auth, loginEmailInput.value, loginPassInput.value);
        showNotification("Login successful!", "success"); 
        // onAuthStateChanged will handle page redirect and clearing
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

// --- Register ---
document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const regEmailInput = document.getElementById("regEmail");
    const regPassInput = document.getElementById("regPass");
    const submitBtn = e.submitter; 

    clearFormErrors('registerForm');
    let isValid = true;
    if (!regEmailInput.value) { displayFormError('regEmailError', 'Email is required.'); isValid = false; }
    if (!regPassInput.value) { displayFormError('regPassError', 'Password is required.'); isValid = false; }
    if (regPassInput.value.length < 6) { displayFormError('regPassError', 'Password must be at least 6 characters long.'); isValid = false; } // Basic length check


    if (!isValid) { showNotification('Please fill in all required fields.', 'error'); return; }

    setButtonLoading(submitBtn, true); 

    try {
        await createUserWithEmailAndPassword(auth, regEmailInput.value, regPassInput.value);
        showNotification("Registered successfully!", "success"); 
        // onAuthStateChanged will handle page redirect and clearing
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

// NEW: Password Strength Indicator (for Registration Form)
const passwordStrengthIndicator = document.createElement('div');
passwordStrengthIndicator.id = 'passwordStrength';
passwordStrengthIndicator.className = 'password-strength';
if (regPassInput) { // Ensure element exists before appending
    regPassInput.parentNode.insertBefore(passwordStrengthIndicator, regPassInput.nextSibling);
    // Add event listener for real-time feedback
    regPassInput.addEventListener('input', () => {
        const password = regPassInput.value;
        const strength = checkPasswordStrength(password);
        updatePasswordStrengthIndicator(strength);
    });
}

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
    passwordStrengthIndicator.textContent = `Strength: ${strength.charAt(0).toUpperCase() + strength.slice(1)}`;
    passwordStrengthIndicator.className = `password-strength ${strength}`;
}


// --- Google Login ---
window.googleLogin = async function() {
    const googleBtn = document.getElementById('googleLoginBtn'); 
    setButtonLoading(googleBtn, true); 

    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
        showNotification("Google login successful!", "success"); 
        // onAuthStateChanged will handle page redirect and clearing
    } catch (err) {
        if (err.code === 'auth/popup-closed-by-user') {
            showNotification("Google login cancelled.", "info");
        } else if (err.code === 'auth/cancelled-popup-request') {
            showNotification("Login attempt already in progress.", "info");
        } else {
            showNotification("Google login error: " + err.message, "error", 5000); 
        }
    } finally {
        setButtonLoading(googleBtn, false); 
    }
}

// --- Logout ---
window.logout = async function() {
    const logoutBtn = document.getElementById('logoutBtn'); 
    setButtonLoading(logoutBtn, true); 

    try {
        await signOut(auth);
        showNotification("Logged out successfully!", "info"); 
        // onAuthStateChanged will handle clearing and redirect
    } catch (err) {
        showNotification("Logout error: " + err.message, "error", 5000); 
    } finally {
        setButtonLoading(logoutBtn, false); 
    }
}

// --- Forgot Password ---
const forgotPasswordLink = document.querySelector('.forgot-password-link');
if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', async (e) => {
        e.preventDefault();
        const loginEmailInput = document.getElementById('loginEmail');
        const email = loginEmailInput.value.trim();

        if (!email) {
            displayFormError('loginEmailError', 'Please enter your email to reset password.');
            showNotification('Please enter your email for password reset.', 'error');
            return;
        }

        setButtonLoading(forgotPasswordLink, true); // Apply loading to the link/button

        try {
            await sendPasswordResetEmail(auth, email);
            showNotification(`Password reset email sent to ${email}. Please check your inbox.`, 'success', 7000);
            displayFormError('loginEmailError', ''); // Clear email error if successful
            loginEmailInput.value = ''; // Clear email field
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


// --- Password Visibility Toggles ---
const toggleLoginPassBtn = document.getElementById('toggleLoginPass');
const loginPassInput = document.getElementById('loginPass');
const toggleRegPassBtn = document.getElementById('toggleRegPass');
// const regPassInput = document.getElementById('regPass'); // Already declared above

if (toggleLoginPassBtn) {
    toggleLoginPassBtn.addEventListener('click', () => {
        const type = loginPassInput.getAttribute('type') === 'password' ? 'text' : 'password';
        loginPassInput.setAttribute('type', type);
        toggleLoginPassBtn.setAttribute('aria-label', type === 'password' ? 'Show password' : 'Hide password');
        toggleLoginPassBtn.textContent = type === 'password' ? '👁️' : '🙈'; // Change icon
    });
}
if (toggleRegPassBtn) {
    toggleRegPassBtn.addEventListener('click', () => {
        const type = regPassInput.getAttribute('type') === 'password' ? 'text' : 'password';
        regPassInput.setAttribute('type', type);
        toggleRegPassBtn.setAttribute('aria-label', type === 'password' ? 'Show password' : 'Hide password');
        toggleRegPassBtn.textContent = type === 'password' ? '👁️' : '🙈'; // Change icon
    });
}


// --- My Garage Section (Firebase + Local Storage Integration) ---
const garageForm = document.getElementById('garageForm');
const savedVehiclesContainer = document.getElementById('savedVehicles');
const noVehiclesMessage = document.getElementById('noVehiclesMessage');
const MAX_VEHICLES = 3; // Maximum number of vehicles a user can save

// Key for Firestore document field holding vehicles (not localStorage directly)
const FIRESTORE_VEHICLES_FIELD = 'vehicles'; 

// Helper to get user's garage document reference
function getUserGarageDocRef() {
    if (!auth.currentUser) {
        showNotification("Please log in to manage your garage.", "error");
        return null;
    }
    return doc(db, "garages", auth.currentUser.uid);
}

// Function to fetch vehicles from Firestore
async function getSavedVehiclesFromFirestore() {
    const userDocRef = getUserGarageDocRef();
    if (!userDocRef) return [];

    try {
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const data = userDoc.data();
            return data[FIRESTORE_VEHICLES_FIELD] || []; // Return vehicles array or empty if not present
        }
        return [];
    } catch (error) {
        console.error("Error getting vehicles from Firestore:", error);
        showNotification("Error loading saved vehicles.", "error");
        return [];
    }
}

// Function to render vehicles to the UI
async function renderSavedVehicles() {
    const vehicles = await getSavedVehiclesFromFirestore();
    savedVehiclesContainer.innerHTML = ''; // Clear existing display

    if (vehicles.length === 0) {
        noVehiclesMessage.style.display = 'block';
    } else {
        noVehiclesMessage.style.display = 'none';
        vehicles.forEach((vehicle, index) => {
            const vehicleCard = document.createElement('div');
            vehicleCard.className = 'vehicle-card';
            // Removed: Image display logic
            vehicleCard.innerHTML = `
                <div class="vehicle-info">
                    <h4>${vehicle.year} ${vehicle.make} ${vehicle.model}</h4>
                    <p>Make: ${vehicle.make}</p>
                    <p>Model: ${vehicle.model}</p>
                    <p>Year: ${vehicle.year}</p>
                </div>
                <button class="delete-vehicle-btn" data-vehicle-index="${index}" aria-label="Delete ${vehicle.year} ${vehicle.make} ${vehicle.model}">Delete</button>
            `;
            savedVehiclesContainer.appendChild(vehicleCard);
        });

        // Attach event listeners to delete buttons (delegated or direct)
        document.querySelectorAll('.delete-vehicle-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const indexToDelete = parseInt(e.target.dataset.vehicleIndex);
                await deleteVehicle(indexToDelete, e.target); // Pass button for loading state
            });
        });
    }
}

// Function to delete a vehicle from Firestore
async function deleteVehicle(index, button) {
    const userDocRef = getUserGarageDocRef();
    if (!userDocRef) return;

    setButtonLoading(button, true);

    try {
        const currentVehicles = await getSavedVehiclesFromFirestore();
        if (index > -1 && index < currentVehicles.length) {
            const deletedVehicle = currentVehicles.splice(index, 1); // Remove the vehicle
            
            await updateDoc(userDocRef, {
                [FIRESTORE_VEHICLES_FIELD]: currentVehicles // Update Firestore with the modified array
            });
            showNotification(`Vehicle "${deletedVehicle[0].year} ${deletedVehicle[0].make} ${deletedVehicle[0].model}" deleted.`, 'info');
            renderSavedVehicles(); // Re-render the list
        }
    } catch (error) {
        console.error("Error deleting vehicle:", error);
        showNotification("Error deleting vehicle: " + error.message, "error");
    } finally {
        setButtonLoading(button, false);
    }
}

garageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const makeInput = document.getElementById("make"); 
    const modelInput = document.getElementById("model");
    const yearInput = document.getElementById("year");
    const submitBtn = e.submitter; 

    clearFormErrors('garageForm');
    
    if (!auth.currentUser) {
        showNotification("Please log in to save your vehicle.", "error"); 
        console.warn("Attempted to save vehicle without being logged in.");
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
        showNotification('Please correct the errors in the form.', 'error');
        return;
    }

    setButtonLoading(submitBtn, true); 

    try {
        const vehicles = await getSavedVehiclesFromFirestore();

        if (vehicles.length >= MAX_VEHICLES) {
            showNotification(`You can save a maximum of ${MAX_VEHICLES} vehicles. Please delete one to add a new one.`, 'error', 5000);
            return; // Stop execution
        }

        const newVehicle = { make, model, year }; 
        // Use arrayUnion to add the new vehicle to the array in Firestore
        await updateDoc(getUserGarageDocRef(), {
            [FIRESTORE_VEHICLES_FIELD]: arrayUnion(newVehicle),
            timestamp: serverTimestamp() // Update timestamp for the document
        }, { merge: true }); 

        showNotification(`Vehicle "${year} ${make} ${model}" saved to your garage!`, 'success');
        garageForm.reset();
        renderSavedVehicles(); // Re-render to show the new vehicle
        loadVehicleForProducts(); // Refresh products page display if needed
    } catch (err) {
        showNotification("Error saving vehicle: " + err.message, "error", 5000); 
        console.error("Error saving vehicle:", err);
    } finally {
        setButtonLoading(submitBtn, false); 
    }
});


// Load Vehicle and generate product links for the Products page
async function loadVehicleForProducts() {
    const productContentDiv = document.getElementById('productContent');
    productContentDiv.innerHTML = '<p class="no-items-message">Loading your vehicle data...</p>'; // This is the loading indicator for this section

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
        const vehicles = await getSavedVehiclesFromFirestore(); // Get all saved vehicles

        if (vehicles.length > 0) {
            // For now, we'll just use the first saved vehicle for product searches.
            // You could add UI to let users select which vehicle to search for.
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

            // IMPORTANT: Add event listener here because the elements are created dynamically
            const generalSearchInput = document.getElementById('generalProductSearch');
            const generalSearchButton = document.getElementById('generalSearchButton'); 

            generalSearchInput.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault(); 
                    setButtonLoading(generalSearchButton, true); 
                    searchAmazonGeneral(year, make, model);
                    setButtonLoading(generalSearchButton, false); 
                }
            });

            generalSearchButton.addEventListener('click', () => {
                setButtonLoading(generalSearchButton, true); 
                searchAmazonGeneral(year, make, model);
                setButtonLoading(generalSearchButton, false); 
            });


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

// Specific Amazon Search Function (remains unchanged and correctly uses affiliate tag)
window.searchAmazonSpecific = function(year, make, model, partType) {
    const query = `${partType} ${year} ${make} ${model}`;
    const url = `https://www.amazon.com/s?k=${encodeURIComponent(query)}&tag=${amazonTag}`;
    window.open(url, "_blank");
}

// General Amazon Search Function (Now filters by vehicle and uses affiliate tag)
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

// --- Wishlist Logic (Firestore Integration) ---
// Get references
const featuredProductsGrid = document.getElementById('featuredProductsGrid');
const wishlistItemsContainer = document.getElementById('wishlistItems');
const clearWishlistButton = document.getElementById('clearWishlistBtn');
const wishlistEmptyMessage = document.querySelector('#wishlist .no-items-message'); 

// Event listener for "Add to Wishlist" buttons (delegated)
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

// Event listener for "Remove from Wishlist" buttons (delegated) - **Crucial for dynamic content**
wishlistItemsContainer.addEventListener('click', async (event) => {
    if (event.target.classList.contains('remove-from-wishlist-btn')) {
        const productIdToRemove = event.target.dataset.productId;
        await removeFromWishlist(productIdToRemove, event.target); 
    }
});

// Event listener for "Clear Wishlist" button
clearWishlistButton.addEventListener('click', async () => {
    if (confirm("Are you sure you want to clear your entire wishlist?")) {
        await clearWishlist(clearWishlistButton); 
    }
});

async function getWishlistFromFirestore() {
    const userDocRef = getUserGarageDocRef();
    if (!userDocRef) return []; 

    try {
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const data = userDoc.data();
            return data.wishlist || []; 
        }
        return [];
    } catch (error) {
        console.error("Error getting wishlist from Firestore:", error);
        showNotification("Error loading wishlist from server.", "error");
        return [];
    }
}

async function addToWishlist(product) {
    const userDocRef = getUserGarageDocRef();
    if (!userDocRef) return; // Notification handled by getUserGarageDocRef

    try {
        const currentWishlist = await getWishlistFromFirestore();
        const exists = currentWishlist.some(item => item.id === product.id);

        if (!exists) {
            await updateDoc(userDocRef, {
                wishlist: arrayUnion(product)
            });
            showNotification(`${product.name} added to wishlist!`, "success");
            // Only reload wishlist if currently on the wishlist page
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
        // Find the exact item to remove from the array by its ID
        const itemToRemove = currentWishlist.find(item => item.id === productId);

        if (itemToRemove) {
            await updateDoc(userDocRef, {
                wishlist: arrayRemove(itemToRemove)
            });
            showNotification("Product removed from wishlist.", "info");
            loadWishlist(); // Always refresh wishlist display after removal
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
            wishlist: [] // Set wishlist array to empty
        });
        showNotification("Wishlist cleared!", "info");
        loadWishlist(); // Refresh display
    } catch (error) {
        console.error("Error clearing wishlist:", error);
        showNotification("Failed to clear wishlist: " + error.message, "error");
    } finally {
        setButtonLoading(button, false);
    }
}

async function loadWishlist() {
    // Show a loading message
    wishlistItemsContainer.innerHTML = '<p class="no-items-message">Loading wishlist...</p>';
    wishlistEmptyMessage.style.display = 'block'; // Ensure the message div is visible

    const userDocRef = getUserGarageDocRef();
    if (!userDocRef || !auth.currentUser) { // Explicitly check auth.currentUser here too
        wishlistItemsContainer.innerHTML = ''; // Clear loading message
        wishlistEmptyMessage.textContent = 'Please log in to see your wishlist, or add some products from the Products page!';
        clearWishlistButton.style.display = 'none'; // Hide clear button if not logged in
        return;
    }

    const wishlist = await getWishlistFromFirestore();
    wishlistItemsContainer.innerHTML = ''; // Clear loading message

    if (wishlist.length === 0) {
        wishlistEmptyMessage.textContent = 'Your wishlist is empty. Add some products from the Products page!';
        clearWishlistButton.style.display = 'none';
    } else {
        wishlistEmptyMessage.style.display = 'none'; // Hide the empty message
        clearWishlistButton.style.display = 'block'; // Show clear button
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

// --- User Profile Page Logic (NEW) ---
const profileEmailSpan = document.getElementById('profileEmail');
const updateProfileBtn = document.getElementById('updateProfileBtn');
const changePasswordBtn = document.getElementById('changePasswordBtn');

function loadProfile() {
    const user = auth.currentUser;
    if (user) {
        profileEmailSpan.textContent = user.email;
        // If you store more profile data in Firestore, you would fetch it here:
        // const userDocRef = doc(db, "users", user.uid);
        // getDoc(userDocRef).then(docSnap => {
        //     if (docSnap.exists()) {
        //         const data = docSnap.data();
        //         // Example: document.getElementById('profileJoinedDate').textContent = new Date(data.joinedDate.toDate()).toLocaleDateString();
        //     }
        // });
    } else {
        profileEmailSpan.textContent = "Not logged in";
        // Redirect to auth page if not logged in when trying to access profile directly
        if (document.querySelector('.page.active')?.id === 'profile') {
            showPage('auth');
            showNotification('Please log in to view your profile.', 'info');
        }
    }
}

// Placeholder for update profile functionality (future)
if (updateProfileBtn) {
    updateProfileBtn.addEventListener('click', () => {
        showNotification("Update Profile functionality is coming soon!", "info");
        console.log("Update Profile button clicked.");
        // Here you would typically open a modal or navigate to a form
        // to allow users to update display name, etc.
    });
}

// Placeholder for change password functionality (future)
if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', async () => {
        const user = auth.currentUser;
        if (user) {
            showNotification("Change Password functionality: A password reset email will be sent.", "info");
            console.log("Change Password button clicked.");
            // This is similar to forgot password, but typically triggered from a logged-in state
            try {
                await sendPasswordResetEmail(auth, user.email);
                showNotification(`Password change email sent to ${user.email}. Please check your inbox.`, 'success', 7000);
            } catch (error) {
                showNotification(`Failed to send password change email: ${error.message}`, 'error', 7000);
                console.error("Change password email error:", error);
            }
        } else {
            showNotification("Please log in to change your password.", "error");
        }
    });
}


// --- Contact Form Submission Handling (Formspree Integration) ---
document.getElementById('contactForm').addEventListener('submit', async function(e) {
    e.preventDefault(); 
    const form = e.target;
    const submitBtn = e.submitter;

    clearFormErrors('contactForm');

    let isValid = true;
    const contactName = form.contactName.value.trim();
    const contactEmail = form.contactEmail.value.trim();
    const contactMessage = form.contactMessage.value.trim();

    if (!contactName) { displayFormError('contactNameError', 'Name is required.'); isValid = false; }
    if (!contactEmail || !contactEmail.includes('@')) { displayFormError('contactEmailError', 'A valid email is required.'); isValid = false; }
    if (!contactMessage) { displayFormError('contactMessageError', 'Message cannot be empty.'); isValid = false; }
    
    if (!isValid) {
        showNotification('Please fill in all required fields.', 'error');
        return;
    }

    setButtonLoading(submitBtn, true); 

    try {
        const response = await fetch(form.action, {
            method: form.method,
            body: new FormData(form), 
            headers: {
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            showNotification("Message sent successfully! We'll get back to you soon.", "success");
            form.reset(); 
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


// Initial page load calls
document.addEventListener('DOMContentLoaded', () => {
    // Show home page by default
    showPage('home'); 
    // Initial loads for garage and wishlist will be handled by onAuthStateChanged
    // once Firebase finishes its initial check. This prevents race conditions.
});
