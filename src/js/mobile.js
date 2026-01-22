// Mobile Navigation and Bottom Sheet Controller

let cartSheetOpen = false;
let ordersSheetOpen = false;

// Initialize mobile features
export function initMobileFeatures() {
    setupBottomNavigation();
    setupBottomSheetCart();
    setupBottomSheetOrders();
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
            closeOrders();
        });
    }

    if (navCart) {
        navCart.addEventListener('click', () => {
            setActiveNav('nav-cart');
            closeOrders();
            toggleCart();
        });
    }

    if (navOrders) {
        navOrders.addEventListener('click', () => {
            setActiveNav('nav-orders');
            closeCart();
            toggleOrders();
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

// Bottom Sheet Orders
function setupBottomSheetOrders() {
    const ordersSheet = document.getElementById('orders-sheet');
    const closeOrdersBtn = document.getElementById('close-orders-btn');

    if (closeOrdersBtn) {
        closeOrdersBtn.addEventListener('click', closeOrders);
    }

    // Touch gestures for orders handle (swipe down to close)
    const ordersHandle = document.getElementById('orders-handle');
    if (ordersHandle) {
        let startY = 0;
        let currentY = 0;

        ordersHandle.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
        }, { passive: true });

        ordersHandle.addEventListener('touchmove', (e) => {
            currentY = e.touches[0].clientY;
            const diff = currentY - startY;

            // Only allow dragging down
            if (diff > 0 && ordersSheetOpen) {
                ordersSheet.style.transform = `translateY(${diff}px)`;
            }
        }, { passive: true });

        ordersHandle.addEventListener('touchend', () => {
            const diff = currentY - startY;

            // If dragged down more than 100px, close the orders sheet
            if (diff > 100) {
                closeOrders();
            } else {
                // Snap back to open position
                ordersSheet.style.transform = 'translateY(0)';
            }

            startY = 0;
            currentY = 0;
        }, { passive: true });
    }
}

export function openOrders() {
    const ordersSheet = document.getElementById('orders-sheet');
    const backdrop = document.getElementById('cart-backdrop');
    const closeOrdersBtn = document.getElementById('close-orders-btn');

    if (ordersSheet) {
        ordersSheet.classList.add('open');
        ordersSheetOpen = true;

        // Trigger order refresh via custom event
        document.dispatchEvent(new CustomEvent('refresh-orders'));
    }

    if (backdrop) {
        backdrop.classList.add('show');
    }

    // Show close button on mobile
    if (closeOrdersBtn && window.innerWidth < 768) {
        closeOrdersBtn.style.display = 'block';
    }
}

export function closeOrders() {
    const ordersSheet = document.getElementById('orders-sheet');
    const backdrop = document.getElementById('cart-backdrop');
    const closeOrdersBtn = document.getElementById('close-orders-btn');

    if (ordersSheet) {
        ordersSheet.classList.remove('open');
        ordersSheetOpen = false;
        ordersSheet.style.transform = ''; // Reset any drag transform
    }

    // Only hide backdrop if cart is also closed
    if (backdrop && !cartSheetOpen) {
        backdrop.classList.remove('show');
    }

    if (closeOrdersBtn) {
        closeOrdersBtn.style.display = 'none';
    }
}

export function toggleOrders() {
    if (ordersSheetOpen) {
        closeOrders();
    } else {
        openOrders();
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

    // Only hide backdrop if orders sheet is also closed
    if (backdrop && !ordersSheetOpen) {
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
        backdrop.addEventListener('click', () => {
            closeCart();
            closeOrders();
        });
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
    const closeOrdersBtn = document.getElementById('close-orders-btn');

    // Hide close buttons and sheets on desktop
    if (window.innerWidth >= 768) {
        if (closeCartBtn) closeCartBtn.style.display = 'none';
        if (closeOrdersBtn) closeOrdersBtn.style.display = 'none';

        const cartSheet = document.getElementById('cart-sheet');
        if (cartSheet) {
            cartSheet.classList.remove('open');
            cartSheetOpen = false;
        }

        const ordersSheet = document.getElementById('orders-sheet');
        if (ordersSheet) {
            ordersSheet.classList.remove('open');
            ordersSheetOpen = false;
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
window.openOrders = openOrders;
window.closeOrders = closeOrders;
window.toggleOrders = toggleOrders;
window.autoOpenCartOnMobile = autoOpenCartOnMobile;
window.updateCartBadge = updateCartBadge;
