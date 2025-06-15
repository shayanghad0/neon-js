/**
 * NeonChange PWA JavaScript
 * Handles service worker registration and PWA functionality
 */

// Register service worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/static/sw.js')
            .then(registration => {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch(error => {
                console.error('Service Worker registration failed:', error);
            });
    });
}

// Add to homescreen prompt handling
let deferredPrompt;
const addBtn = document.createElement('button');
addBtn.style.display = 'none';
addBtn.classList.add('btn', 'btn-primary', 'btn-sm', 'install-app-btn');
addBtn.textContent = 'نصب برنامه';

// Show install app button in header on mobile
window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Save the event so it can be triggered later
    deferredPrompt = e;
    // Only show the install button on mobile devices
    if (window.innerWidth <= 768) {
        // Add button to nav
        const navbarNav = document.querySelector('.navbar-nav');
        if (navbarNav) {
            const installLi = document.createElement('li');
            installLi.classList.add('nav-item');
            installLi.appendChild(addBtn);
            navbarNav.appendChild(installLi);
            addBtn.style.display = 'block';
        }
    }
});

// Handle button click
addBtn.addEventListener('click', (e) => {
    // Hide the button
    addBtn.style.display = 'none';
    // Show the prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the install prompt');
            // Maybe show a thank you message
            showNotification('برنامه با موفقیت نصب شد!', 'success');
        } else {
            console.log('User dismissed the install prompt');
        }
        deferredPrompt = null;
    });
});

// Handle installed PWA
window.addEventListener('appinstalled', (event) => {
    console.log('App was installed');
    // Hide install button if visible
    if (addBtn) {
        addBtn.style.display = 'none';
    }
});