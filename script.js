// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
// Only import what's strictly needed for initial auth state (no specific login/register functions yet)
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js"; 
// No Firestore imports yet
// No Storage imports yet

// Your web app's Firebase configuration (KEEP THIS EXACTLY AS IS FROM YOUR PROJECT)
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
const auth = getAuth(app); // Initialize auth for basic state listener

// --- Global DOM Elements ---
// Declare them globally but assign them in DOMContentLoaded for safety
let navLinks;
let hamburgerMenu;
let userEmailSpan;
let notificationContainer; // Keep for basic notification testing

// --- Page Navigation (Basic Functionality) ---
window.showPage = function(id) {
    console.log(`Attempting to show page: ${id}`); // Basic console log
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    const pageElement = document.getElementById(id);
    if (pageElement) {
        pageElement.classList.add("active");
        console.log(`Page '${id}' set to active.`);
    } else {
        console.error(`Page element with ID '${id}' not found!`);
    }

    // Close hamburger menu if open on page switch
    if (hamburgerMenu && hamburgerMenu.classList.contains('active')) { 
        hamburgerMenu.classList.remove('active');
        navLinks.classList.remove('active');
        console.log("Hamburger menu closed.");
    }
}

// --- Notification System (Minimal) ---
function showNotification(message, type = 'info', duration = 3000) {
    if (!notificationContainer) {
        console.warn("Notification container not found! Cannot display notification.");
        return;
    }
    const notification = document.createElement('div');
    notification.className = `notification-item notification-${type}`;
    notification.innerHTML = `<span class="notification-message">${message}</span>`; // Simpler for now
    notificationContainer.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, duration);
    console.log(`Notification shown: ${message} (${type})`);
}

// --- Auth State Listener (Basic) ---
onAuthStateChanged(auth, user => {
    console.log("Auth state changed. User:", user ? user.email : "none");
    if (userEmailSpan) { // Ensure element exists
        if (user) {
            userEmailSpan.textContent = `Logged in as: ${user.email}`;
            showNotification(`Welcome, ${user.email}!`, 'success', 2000);
            // Optionally, redirect after login if on auth page
            if (document.querySelector('.page.active')?.id === 'auth') {
                showPage('home'); // Go to home after login
            }
        } else {
            userEmailSpan.textContent = "Not logged in";
            showNotification("Logged out.", 'info', 2000);
            // Optionally, redirect if on a protected page
            if (document.querySelector(".page.active")?.id === "garage" || 
                document.querySelector(".page.active")?.id === "wishlist" ||
                document.querySelector(".page.active")?.id === "profile") { 
                showPage("auth");
            }
        }
    }
});


// --- DOMContentLoaded: Assign elements and attach basic listeners ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded fired.");

    // Assign Global DOM Elements
    navLinks = document.getElementById('navLinks');
    hamburgerMenu = document.getElementById('hamburgerMenu');
    userEmailSpan = document.getElementById('userEmail');
    notificationContainer = document.getElementById('notificationContainer');

    // --- Basic Event Listeners (only if elements exist) ---

    // Hamburger Menu Toggle
    if (hamburgerMenu && navLinks) {
        hamburgerMenu.addEventListener('click', (event) => {
            event.stopPropagation();
            navLinks.classList.toggle('active');
            hamburgerMenu.classList.toggle('open');
            console.log("Hamburger clicked.");
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
    } else {
        console.warn("Hamburger or NavLinks not found on DOMContentLoaded.");
    }

    // --- Footer Current Year (Basic) ---
    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
        console.log("Current year updated.");
    }

    // --- Initial page load ---
    showPage('home'); 
    console.log("Initial page set to home.");
});

// IMPORTANT: All other complex functions (login, register, garage, wishlist, contact form logic)
// are REMOVED in this minimal version. We will add them back step-by-step once
// we confirm the basic page functionality.
