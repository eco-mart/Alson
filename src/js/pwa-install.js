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

function showInstallPromotion(mode = 'hero') {
    // Basic check: don't show if already installed or if no prompt available
    if (!deferredPrompt || isPWAInstalled()) return;

    // Cleanup existing buttons if any
    if (installButton) {
        installButton.remove();
        installButton = null;
    }

    installButton = document.createElement('div');
    installButton.id = 'pwa-install-container';

    if (mode === 'hero') {
        installButton.className = 'pwa-hero-container';
        installButton.innerHTML = `
            <div class="pwa-hero-content">
                <button class="pwa-close-btn" aria-label="Dismiss">✕</button>
                <div class="pwa-icon">🍔</div>
                <h2>Get the full experience</h2>
                <p>Install "One More Bite" for faster access and a better experience.</p>
                <button class="pwa-main-install-btn">Install App Now</button>
            </div>
        `;

        installButton.querySelector('.pwa-close-btn').onclick = (e) => {
            e.stopPropagation();
            showInstallPromotion('corner');
        };

        installButton.querySelector('.pwa-main-install-btn').onclick = triggerInstall;
    } else {
        installButton.className = 'pwa-corner-container';
        installButton.innerHTML = `
            <button class="pwa-corner-btn">
                <span class="icon">📱</span>
                <span class="text">Install App</span>
            </button>
        `;
        installButton.querySelector('.pwa-corner-btn').onclick = triggerInstall;
    }

    document.body.appendChild(installButton);
}

async function triggerInstall() {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] User response: ${outcome}`);

    if (outcome === 'accepted') {
        deferredPrompt = null;
        if (installButton) {
            installButton.remove();
            installButton = null;
        }
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
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: #059669;
        color: white;
        padding: 12px 24px;
        border-radius: 99px;
        font-size: 14px;
        font-weight: 600;
        z-index: 10001;
        box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        animation: slideUp 0.3s ease-out;
    `;
    successMsg.textContent = '✅ App Installed! Check your home screen';
    document.body.appendChild(successMsg);

    setTimeout(() => {
        successMsg.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => successMsg.remove(), 300);
    }, 4000);
});

// Check if already installed
function isPWAInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

// Add CSS animations and styles
const style = document.createElement('style');
style.textContent = `
    .pwa-hero-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        animation: fadeIn 0.3s ease-out;
    }

    .pwa-hero-content {
        background: var(--card-bg, #ffffff);
        padding: 40px;
        border-radius: 24px;
        text-align: center;
        max-width: 400px;
        width: 90%;
        position: relative;
        box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        animation: zoomIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .pwa-close-btn {
        position: absolute;
        top: 16px;
        right: 16px;
        background: rgba(0,0,0,0.05);
        border: none;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        transition: all 0.2s;
    }

    .pwa-close-btn:hover {
        background: rgba(0,0,0,0.1);
        transform: rotate(90deg);
    }

    .pwa-icon {
        font-size: 64px;
        margin-bottom: 20px;
        animation: bounce 2s infinite;
    }

    .pwa-hero-content h2 {
        font-size: 24px;
        font-weight: 700;
        margin-bottom: 12px;
        color: #1a1a1a;
    }

    .pwa-hero-content p {
        color: #666;
        line-height: 1.5;
        margin-bottom: 30px;
    }

    .pwa-main-install-btn {
        background: linear-gradient(135deg, #4f46e5, #7c3aed);
        color: white;
        border: none;
        padding: 14px 32px;
        border-radius: 12px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        width: 100%;
        transition: transform 0.2s, box-shadow 0.2s;
    }

    .pwa-main-install-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(79, 70, 229, 0.4);
    }

    .pwa-corner-container {
        position: fixed;
        top: 16px;
        right: 16px;
        z-index: 9998;
        animation: slideInRight 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .pwa-corner-btn {
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(0,0,0,0.1);
        padding: 8px 16px;
        border-radius: 99px;
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        transition: all 0.2s;
    }

    .pwa-corner-btn:hover {
        transform: scale(1.05);
        background: #fff;
        box-shadow: 0 6px 16px rgba(0,0,0,0.15);
    }

    .pwa-corner-btn .icon { font-size: 18px; }
    .pwa-corner-btn .text { font-weight: 600; color: #1a1a1a; font-size: 14px; }

    @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
    }

    @keyframes zoomIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
    }

    @keyframes slideInRight {
        from { opacity: 0; transform: translateX(20px); }
        to { opacity: 1; transform: translateX(0); }
    }

    @keyframes slideUp {
        from { opacity: 0; transform: translate(-50%, 20px); }
        to { opacity: 1; transform: translate(-50%, 0); }
    }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
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

