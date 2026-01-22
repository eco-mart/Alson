import { checkSession, login, verifyAndSignup, logout } from './auth.js';
import '../css/styles.css';
import '../css/css_updates.css';
import { loadCart, loadFoodItems, loadUserOrders } from './ui/student.js';
import { loadAdminOrders, loadFoodItemsAdmin, updateCardUI } from './ui/admin.js';
import { showError, isTauri } from './utils.js';
import { supabase } from './api.js';
import { initMobileFeatures } from './mobile.js';
import './pwa-install.js';  // PWA install prompt

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const mainScreen = document.getElementById('main-screen');
const dashboard = document.getElementById('dashboard'); // Admin Dashboard
const loginForm = document.getElementById('login-form');
const sidebar = document.getElementById('cart-items')?.parentElement;
// Identify if we are in Admin View (admin.html) or Student View (index.html)
// Just check for specific IDs
const isAdminPage = !!document.getElementById('admin-app');

// Init
async function init() {
    // Initialize mobile features
    initMobileFeatures();

    const user = await checkSession();

    if (user) {
        handleUserRedirect(user);
    } else {
        // Show login
        if (loginScreen) loginScreen.style.display = 'flex';
    }
}

function handleUserRedirect(user) {
    const isAdmin = user.user_metadata?.is_admin;

    if (isAdminPage) {
        if (!isAdmin) {
            alert('Access Denied. Admins only.');
            logout();
            return;
        }
        showAdminDashboard(user);
    } else {
        if (isAdmin) {
            // Admin logged into student app? 
            // Redirect to admin.html? Or just show admin features?
            // User requested "Vanilla JS Frontend (ONE CODEBASE)".
            // Let's decide based on current page.
            if (confirm('You are an admin. Go to Admin Dashboard?')) {
                window.location.href = '/admin.html';
                return;
            }
        }
        showStudentApp(user);
    }
}

// Student View
async function showStudentApp(user) {
    if (loginScreen) loginScreen.style.display = 'none';
    if (mainScreen) mainScreen.style.display = 'block';

    // Greeting
    const userName = user.user_metadata?.full_name || 'Student';
    const greetingEl = document.getElementById('user-greeting') || document.createElement('div');
    greetingEl.id = 'user-greeting';
    greetingEl.style.cssText = 'position: absolute; top: 1rem; right: 120px; font-weight: 600; color: #4b5563;';
    greetingEl.textContent = `Hello, ${userName} 👋`;
    if (!document.getElementById('user-greeting')) document.body.appendChild(greetingEl);

    await loadCart();
    await loadFoodItems();

    // Realtime
    setupStudentRealtime(user.id);
}

// Admin View
async function showAdminDashboard(user) {
    if (loginScreen) loginScreen.style.display = 'none';
    if (dashboard) dashboard.style.display = 'block';

    await loadAdminOrders();
    await loadFoodItemsAdmin();

    setupAdminRealtime();
}

// Login Handler
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const idInput = document.getElementById('student-id') || document.getElementById('admin-email');
        const passInput = document.getElementById('password') || document.getElementById('admin-password');
        const errEl = document.getElementById('login-error');

        try {
            // Check if admin login form (email) or student (ID)
            const isEmail = idInput.type === 'email';
            const user = await login(idInput.value, passInput.value); // auth.js handles ID->Email conversion if needed

            handleUserRedirect(user);
        } catch (err) {
            showError(errEl, `Login failed: ${err.message}`);
        }
    });
}

// Logout Handler
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await logout();
        window.location.reload();
    });
}

// Signup Handler (Student Only)
const signupBtn = document.getElementById('signup-btn');
if (signupBtn) {
    signupBtn.addEventListener('click', async () => {
        const studentId = document.getElementById('student-id').value;
        const password = document.getElementById('password').value;
        const errEl = document.getElementById('login-error');

        try {
            showError(errEl, 'Verifying ID...', true);
            await verifyAndSignup(studentId, password);
            showError(errEl, 'Signup successful! Please sign in.', true);
        } catch (err) {
            showError(errEl, err.message);
        }
    });
}

const myOrdersBtn = document.getElementById('my-orders-btn');
const closeOrdersBtn = document.getElementById('close-orders-btn');
const myOrdersContainer = document.getElementById('my-orders-container');

if (myOrdersBtn && myOrdersContainer) {
    myOrdersBtn.addEventListener('click', () => {
        myOrdersContainer.style.display = 'block';
        loadUserOrders();
    });
}

if (closeOrdersBtn && myOrdersContainer) {
    closeOrdersBtn.addEventListener('click', () => {
        myOrdersContainer.style.display = 'none';
    });
}

// Realtime Setup
function setupStudentRealtime(userId) {
    supabase.channel('public:orders')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `user_id=eq.${userId}` }, () => {
            loadUserOrders(); // Refresh orders if update matches user
        })
        .subscribe();
}

function setupAdminRealtime() {
    supabase.channel('admin_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, loadAdminOrders)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'food_items' }, (payload) => {
            if (payload.eventType === 'UPDATE') {
                updateCardUI(payload.new.id, payload.new.is_available);
            }
        })
        .subscribe();
}

// Start
init();
