import { supabase } from '../api.js';
import { showError, formatPrice, vibrate } from '../utils.js';

// DOM Elements
const liveOrdersList = document.getElementById('admin-live-orders-list');
const historyOrdersList = document.getElementById('admin-history-list');
const foodGrid = document.getElementById('food-grid');
const searchInput = document.getElementById('admin-search-input');
const errorMessage = document.getElementById('error-message');
const tabButtons = document.querySelectorAll('.nav-item[data-tab]');
const sections = document.querySelectorAll('.admin-section');
const tabTitle = document.getElementById('current-tab-title');

// Stats Elements
const statTotalOrders = document.getElementById('stats-total-orders');
const statPendingOrders = document.getElementById('stats-pending-orders');
const statRevenue = document.getElementById('stats-revenue');

const CATEGORIES = [
    'Beverages', 'Breakfast', 'Snacks', 'Wai-Wai', 'Fried Rice & Noodles',
    'Momo', 'Sandwich & Burger', 'Soup & Thukpa', 'Rice Thali', 'Day Special Menu'
];

let currentTab = 'overview';

// --- Tab Navigation ---

function initTabs() {
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-tab');
            switchTab(tab);
            vibrate(5);
        });
    });
}

export async function switchTab(tabId) {
    currentTab = tabId;

    // Update UI active state
    tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });

    // Show/Hide sections
    sections.forEach(sec => {
        const isTarget = sec.id === `admin-section-${tabId === 'live-orders' ? 'live-orders' : tabId}`;
        sec.style.display = isTarget ? 'block' : 'none';
    });

    // Update title
    const activeBtn = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
    if (activeBtn) tabTitle.textContent = activeBtn.textContent.trim().replace(/^[^a-zA-Z]+/, '');

    // Load data based on tab
    if (tabId === 'overview') await loadDashboardStats();
    if (tabId === 'live-orders') await loadLiveOrders();
    if (tabId === 'history') await loadOrderHistory();
    if (tabId === 'menu') await loadFoodItemsAdmin();
}

// --- Dashboard Stats ---

export async function loadDashboardStats() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data: orders, error } = await supabase
            .from('orders')
            .select('status, total_amount, created_at');

        if (error) throw error;

        const total = orders.length;
        const pending = orders.filter(o => o.status === 'pending').length;

        const todayRevenue = orders
            .filter(o => new Date(o.created_at) >= today && o.status === 'completed')
            .reduce((sum, o) => sum + (o.total_amount || 0), 0);

        if (statTotalOrders) statTotalOrders.textContent = total;
        if (statPendingOrders) statPendingOrders.textContent = pending;
        if (statRevenue) statRevenue.textContent = formatPrice(todayRevenue);
    } catch (err) {
        console.error('Stats error:', err);
    }
}

// --- Orders Management ---

export async function loadAdminOrders() {
    // Initial load - decide what to show
    if (currentTab === 'overview') await loadDashboardStats();
    if (currentTab === 'live-orders') await loadLiveOrders();
    if (currentTab === 'history') await loadOrderHistory();
}

async function loadLiveOrders() {
    if (!liveOrdersList) return;
    liveOrdersList.innerHTML = '<div class="loading-spinner"></div>';

    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*, users(email, name), order_items(*, food_items(name))')
            .in('status', ['pending', 'confirmed'])
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!orders.length) {
            liveOrdersList.innerHTML = '<div class="empty-state">No active orders right now.</div>';
            return;
        }

        liveOrdersList.innerHTML = orders.map(renderOrderCard).join('');
    } catch (err) {
        liveOrdersList.innerHTML = `Error: ${err.message}`;
    }
}

async function loadOrderHistory() {
    if (!historyOrdersList) return;
    historyOrdersList.innerHTML = '<div class="loading-spinner"></div>';

    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*, users(email, name), order_items(*, food_items(name))')
            .in('status', ['completed', 'cancelled'])
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        if (!orders.length) {
            historyOrdersList.innerHTML = '<div class="empty-state">No order history found.</div>';
            return;
        }

        historyOrdersList.innerHTML = orders.map(renderOrderCard).join('');
    } catch (err) {
        historyOrdersList.innerHTML = `Error: ${err.message}`;
    }
}

function renderOrderCard(order) {
    const pickupInfo = getPickupCountdown(order.pickup_time);
    const isPending = order.status === 'pending';
    const isConfirmed = order.status === 'confirmed';

    return `
    <div class="order-card-v2 ${order.status}" id="order-card-${order.id}">
      <div class="order-badge">${order.status.toUpperCase()}</div>
      <div class="order-header">
        <div class="order-id">#${order.id.slice(0, 8)}</div>
        <div class="order-time">${new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
      
      <div class="order-body">
        <div class="customer-info">
          <strong>${order.users?.name || order.users?.email || 'Unknown'}</strong>
          <span>Pickup: ${order.pickup_time || 'ASAP'} <small style="${pickupInfo.style}">${pickupInfo.text}</small></span>
        </div>
        
        <div class="order-items-minimal">
          ${order.order_items.map(oi => `<span>${oi.food_items?.name} <b>x${oi.quantity}</b></span>`).join('')}
        </div>
        
        <div class="order-footer">
          <div class="total">${formatPrice(order.total_amount)}</div>
          <div class="actions">
            ${isPending ? `
              <button class="btn-action approve" onclick="window.updateOrderStatus('${order.id}', 'confirmed')">Accept</button>
              <button class="btn-icon reject" onclick="window.updateOrderStatus('${order.id}', 'cancelled')">✕</button>
            ` : ''}
            
            ${isConfirmed ? `
              <button class="btn-action ready" onclick="window.updateOrderStatus('${order.id}', 'completed')">Mark Ready</button>
              <button class="btn-icon reject" onclick="window.updateOrderStatus('${order.id}', 'cancelled')">✕</button>
            ` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}

window.updateOrderStatus = async (orderId, newStatus) => {
    vibrate(15);
    try {
        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId);
        if (error) throw error;

        // Refresh appropriate views
        await loadDashboardStats();
        if (currentTab === 'live-orders') await loadLiveOrders();
        if (currentTab === 'history') await loadOrderHistory();
    } catch (err) {
        alert('Failed: ' + err.message);
    }
}

// --- Menu Management ---

export async function loadFoodItemsAdmin() {
    if (!foodGrid) return;
    foodGrid.innerHTML = '<div class="loading-spinner"></div>';

    // Clear existing
    const existingSections = foodGrid.querySelectorAll('.category-section');
    existingSections.forEach(s => s.remove());

    for (const category of CATEGORIES) {
        await loadCategoryBatch(category, 0, 50);
    }

    // Remove spinner if exists
    const spinner = foodGrid.querySelector('.loading-spinner');
    if (spinner) spinner.remove();
}

if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const term = e.target.value.trim();
        debounceTimer = setTimeout(() => {
            term ? searchFoodItems(term) : loadFoodItemsAdmin();
        }, 300);
    });
}

async function searchFoodItems(searchTerm) {
    foodGrid.innerHTML = '<div class="loading-spinner"></div>';
    const { data, error } = await supabase
        .from('food_items')
        .select('*')
        .ilike('name', `%${searchTerm}%`);

    if (!error && data.length) {
        renderSearchResults(data);
    } else {
        foodGrid.innerHTML = '<div class="empty-state">No items found matching your search.</div>';
    }
}

function renderSearchResults(items) {
    const grouped = items.reduce((acc, item) => {
        const cat = item.category || 'Other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {});

    foodGrid.innerHTML = '';
    Object.entries(grouped).forEach(([category, catItems]) => {
        appendCategoryItems(category, catItems, true);
    });
}

async function loadCategoryBatch(category, from, limit) {
    const { data } = await supabase
        .from('food_items')
        .select('*')
        .eq('category', category)
        .range(from, from + limit - 1);

    if (data && data.length) appendCategoryItems(category, data, from === 0);
}

function appendCategoryItems(category, items, isNew) {
    const catId = category.replace(/\s+/g, '-').replace(/[&]/g, '').toLowerCase();
    let section = document.getElementById(`cat-${catId}`);

    if (isNew && section) section.remove();
    if (!section || isNew) {
        section = document.createElement('div');
        section.id = `cat-${catId}`;
        section.className = 'category-section';
        section.innerHTML = `<h2 class="category-title">${category}</h2><div id="grid-${catId}" class="items-grid"></div>`;
        foodGrid.appendChild(section);
    }

    document.getElementById(`grid-${catId}`).insertAdjacentHTML('beforeend', items.map(renderItemCard).join(''));
}

function renderItemCard(item) {
    const isAvailable = item.is_available === true;
    return `
    <div class="admin-food-card ${!isAvailable ? 'unavailable' : ''}" id="food-card-${item.id}">
      <div class="card-top">
        <div class="img-wrap">
          ${item.image_url ? `<img src="${item.image_url}" loading="lazy" />` : '🍕'}
        </div>
        <div class="info">
          <h4>${item.name}</h4>
          <p>${formatPrice(item.price)}</p>
        </div>
      </div>
      <button class="btn-toggle ${isAvailable ? 'on' : 'off'}" 
        onclick="window.toggleAvailability(this,'${item.id}', ${isAvailable})">
        ${isAvailable ? 'Available' : 'Unavailable'}
      </button>
    </div>
  `;
}

window.toggleAvailability = async (btn, id, current) => {
    vibrate(10);
    btn.disabled = true;
    btn.textContent = '...';
    try {
        const { data, error } = await supabase
            .from('food_items')
            .update({ is_available: !current })
            .eq('id', id)
            .select().single();

        if (error) throw error;
        updateCardUI(id, data.is_available);
    } catch (err) {
        alert('Failed: ' + err.message);
        btn.disabled = false;
        btn.textContent = current ? 'Available' : 'Unavailable';
    }
};

export function updateCardUI(id, isAvailable) {
    const card = document.getElementById(`food-card-${id}`);
    if (!card) return;
    const btn = card.querySelector('.btn-toggle');

    card.classList.toggle('unavailable', !isAvailable);
    if (btn) {
        btn.textContent = isAvailable ? 'Available' : 'Unavailable';
        btn.className = `btn-toggle ${isAvailable ? 'on' : 'off'}`;
        btn.setAttribute('onclick', `window.toggleAvailability(this, '${id}', ${isAvailable})`);
        btn.disabled = false;
    }
}

// --- Helpers ---

function getPickupCountdown(timeStr) {
    if (!timeStr) return { text: '', style: '' };
    const now = new Date();
    const [hours, minutes] = timeStr.split(':').map(Number);
    const pickupDate = new Date();
    pickupDate.setHours(hours, minutes, 0, 0);

    const diffMins = Math.ceil((pickupDate - now) / 60000);

    if (diffMins > 60) {
        const h = Math.floor(diffMins / 60);
        const m = diffMins % 60;
        return { text: `(${h}h ${m}m)`, style: 'color: var(--primary);' };
    } else if (diffMins > 0) {
        return { text: `(${diffMins}m)`, style: diffMins < 10 ? 'color: var(--danger); font-weight: 700;' : 'color: var(--primary);' };
    } else {
        return { text: `(OVERDUE)`, style: 'color: var(--danger); font-weight: 900;' };
    }
}

// Initialize Tabs
initTabs();
