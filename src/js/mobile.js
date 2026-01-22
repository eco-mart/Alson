// Mobile Navigation and Bottom Sheet Controller

let cartSheetOpen = false;

// Initialize mobile features
export function initMobileFeatures() {
    setupBottomNavigation();
    setupBottomSheetCart();
    setupBackdrop();
    updateCartBadge();
}

// Bottom Navigation
function setupBottomNavigation() {
    const navHome = document.getElementById('nav-home');
    const navCart = document.getElementById('nav-cart');
    const navOrders = document.getElementById('nav-orders');
    const navLogout = document.getElementById('nav-logout');

    if (navHome) {
        navHome.addEventListener('click', () => {
            setActiveNav('nav-home');
            closeCart();
            hideOrders();
        });
    }

    if (navCart) {
        navCart.addEventListener('click', () => {
            setActiveNav('nav-cart');
            toggleCart();
        });
    }

    if (navOrders) {
        navOrders.addEventListener('click', () => {
            setActiveNav('nav-orders');
            closeCart();
            showOrders();
        });
    }

    if (navLogout) {
        navLogout.addEventListener('click', async () => {
            if (confirm('Are you sure you want to logout?')) {
                const { logout } = await import('./auth.js');
                await logout();
                window.location.reload();
            }
        });
    }

    // Also wire up desktop buttons
    const myOrdersBtn = document.getElementById('my-orders-btn');
    const closeOrdersBtn = document.getElementById('close-orders-btn');
    const logoutBtn = document.getElementById('logout-btn');

    if (myOrdersBtn) {
        myOrdersBtn.addEventListener('click', showOrders);
    }

    if (closeOrdersBtn) {
        closeOrdersBtn.addEventListener('click', hideOrders);
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (confirm('Are you sure you want to logout?')) {
                const { logout } = await import('./auth.js');
                await logout();
                window.location.reload();
            }
        });
    }
}

function setActiveNav(activeId) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
    });
    const activeItem = document.getElementById(activeId);
    if (activeItem) {
        activeItem.classList.add('active');
    }
}

function showOrders() {
    const myOrdersContainer = document.getElementById('my-orders-container');
    if (myOrdersContainer) {
        myOrdersContainer.style.display = 'block';
        // Load orders
        import('./ui/student.js').then(module => {
            module.loadUserOrders();
        });
    }
}

function hideOrders() {
    const myOrdersContainer = document.getElementById('my-orders-container');
    if (myOrdersContainer) {
        myOrdersContainer.style.display = 'none';
    }
}

// Bottom Sheet Cart
function setupBottomSheetCart() {
    const cartSheet = document.getElementById('cart-sheet');
    const closeCartBtn = document.getElementById('close-cart-btn');

    if (closeCartBtn) {
        closeCartBtn.addEventListener('click', closeCart);
    }

    // Touch gestures for cart handle (swipe down to close)
    const cartHandle = document.querySelector('.cart-handle');
    if (cartHandle) {
        let startY = 0;
        let currentY = 0;

        cartHandle.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
        }, { passive: true });

        cartHandle.addEventListener('touchmove', (e) => {
            currentY = e.touches[0].clientY;
            const diff = currentY - startY;

            // Only allow dragging down
            if (diff > 0 && cartSheetOpen) {
                cartSheet.style.transform = `translateY(${diff}px)`;
            }
        }, { passive: true });

        cartHandle.addEventListener('touchend', () => {
            const diff = currentY - startY;

            // If dragged down more than 100px, close the cart
            if (diff > 100) {
                closeCart();
            } else {
                // Snap back to open position
                cartSheet.style.transform = 'translateY(0)';
            }

            startY = 0;
            currentY = 0;
        }, { passive: true });
    }
}

export function openCart() {
    const cartSheet = document.getElementById('cart-sheet');
    const backdrop = document.getElementById('cart-backdrop');
    const closeCartBtn = document.getElementById('close-cart-btn');

    if (cartSheet) {
        cartSheet.classList.add('open');
        cartSheetOpen = true;
    }

    if (backdrop) {
        backdrop.classList.add('show');
    }

    // Show close button on mobile
    if (closeCartBtn && window.innerWidth < 768) {
        closeCartBtn.style.display = 'block';
    }
}

export function closeCart() {
    const cartSheet = document.getElementById('cart-sheet');
    const backdrop = document.getElementById('cart-backdrop');
    const closeCartBtn = document.getElementById('close-cart-btn');

    if (cartSheet) {
        cartSheet.classList.remove('open');
        cartSheetOpen = false;
        cartSheet.style.transform = ''; // Reset any drag transform
    }

    if (backdrop) {
        backdrop.classList.remove('show');
    }

    if (closeCartBtn) {
        closeCartBtn.style.display = 'none';
    }
}

export function toggleCart() {
    if (cartSheetOpen) {
        closeCart();
    } else {
        openCart();
    }
}

function setupBackdrop() {
    const backdrop = document.getElementById('cart-backdrop');
    if (backdrop) {
        backdrop.addEventListener('click', closeCart);
    }
}

// Update cart badge in bottom navigation
export function updateCartBadge(quantity = 0) {
    const navCartBadge = document.getElementById('nav-cart-badge');

    if (navCartBadge) {
        if (quantity > 0) {
            navCartBadge.textContent = quantity;
            navCartBadge.style.display = 'block';
        } else {
            navCartBadge.style.display = 'none';
        }
    }
}

// Detect if we're on mobile
export function isMobile() {
    return window.innerWidth < 768;
}

// Auto-open cart on mobile when items are added
export function autoOpenCartOnMobile() {
    if (isMobile()) {
        openCart();
    }
}

// Handle window resize
window.addEventListener('resize', () => {
    const closeCartBtn = document.getElementById('close-cart-btn');

    // Hide close button on desktop
    if (window.innerWidth >= 768) {
        if (closeCartBtn) {
            closeCartBtn.style.display = 'none';
        }
        // Always show cart on desktop
        const cartSheet = document.getElementById('cart-sheet');
        if (cartSheet) {
            cartSheet.classList.remove('open');
            cartSheetOpen = false;
        }
        const backdrop = document.getElementById('cart-backdrop');
        if (backdrop) {
            backdrop.classList.remove('show');
        }
    }
});

// Expose to window for inline event handlers
window.openCart = openCart;
window.closeCart = closeCart;
window.toggleCart = toggleCart;
