// PWA Install Prompt Handler
let deferredPrompt;
let installButton;

// Listen for beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
    console.log('[PWA] Install prompt available');
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    // Show install button if we have one
    showInstallPromotion();
});

function showInstallPromotion() {
    // Create install button if not exists
    if (!installButton && window.innerWidth < 768) {
        installButton = document.createElement('button');
        installButton.id = 'pwa-install-btn';
        installButton.innerHTML = '📱 Install App';
        installButton.className = 'btn btn-primary';
        installButton.style.cssText = `
            position: fixed;
            top: 12px;
            right: 12px;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease-out;
        `;

        installButton.addEventListener('click', async () => {
            if (!deferredPrompt) {
                return;
            }

            // Show the install prompt
            deferredPrompt.prompt();

            // Wait for the user to respond to the prompt
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`[PWA] User response: ${outcome}`);

            // We've used the prompt, can't use it again
            deferredPrompt = null;

            // Hide the install button
            if (installButton) {
                installButton.remove();
                installButton = null;
            }
        });

        document.body.appendChild(installButton);
    }
}

// Track successful install
window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed successfully!');
    deferredPrompt = null;
    if (installButton) {
        installButton.remove();
        installButton = null;
    }

    // Show success message
    const successMsg = document.createElement('div');
    successMsg.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #059669;
        color: white;
        padding: 20px 32px;
        border-radius: 12px;
        font-size: 18px;
        font-weight: 600;
        z-index: 10000;
        box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        animation: fadeIn 0.3s ease-out;
    `;
    successMsg.textContent = '✅ App Installed! Check your home screen';
    document.body.appendChild(successMsg);

    setTimeout(() => {
        successMsg.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => successMsg.remove(), 300);
    }, 3000);
});

// Check if already installed
function isPWAInstalled() {
    // Check if running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true) {
        console.log('[PWA] Running as installed app');
        return true;
    }
    return false;
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    
    #pwa-install-btn:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4) !important;
    }
`;
document.head.appendChild(style);

// Expose to window for external use
window.PWA = {
    isInstalled: isPWAInstalled,
    showInstallPrompt: showInstallPromotion
};

// Log install status on load
if (isPWAInstalled()) {
    console.log('[PWA] ✅ App is installed and running standalone');
} else {
    console.log('[PWA] App is running in browser');
}

export { isPWAInstalled, showInstallPromotion };
