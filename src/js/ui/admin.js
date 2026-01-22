import { supabase } from '../api.js';
import { showError, formatPrice } from '../utils.js';

// DOM Elements
const ordersList = document.getElementById('admin-orders-list');
const foodGrid = document.getElementById('food-grid');
const searchInput = document.getElementById('admin-search-input');
const errorMessage = document.getElementById('error-message');

const CATEGORIES = [
    'Beverages', 'Breakfast', 'Snacks', 'Wai-Wai', 'Fried Rice & Noodles',
    'Momo', 'Sandwich & Burger', 'Soup & Thukpa', 'Rice Thali', 'Day Special Menu'
];

let loadedCounts = {};

// --- Orders Management ---

export async function loadAdminOrders() {
    if (!ordersList) return;
    ordersList.innerHTML = 'Loading orders...';

    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*, users(email, name), order_items(*, food_items(name))')
            .order('created_at', { ascending: false });

        if (error) throw error;
        if (!orders.length) {
            ordersList.innerHTML = '<p>No orders yet.</p>';
            return;
        }

        ordersList.innerHTML = orders.map(renderOrderCard).join('');
    } catch (err) {
        ordersList.innerHTML = `Error: ${err.message}`;
    }
}

function renderOrderCard(order) {
    const pickupInfo = getPickupCountdown(order.pickup_time);
    const isPending = order.status === 'pending';
    const isConfirmed = order.status === 'confirmed';

    return `
    <div class="order-card" id="order-card-${order.id}">
      <div class="order-header">
        <span>Order #${order.id.slice(0, 8)}</span>
        <span>${new Date(order.created_at).toLocaleString()}</span>
      </div>
      <div style="margin-bottom:0.5rem;color:#666;">
        Customer: <strong>${order.users?.name || order.users?.email || 'Unknown'}</strong><br>
        Pickup: <strong>${order.pickup_time || 'ASAP'}</strong> <span style="font-size:0.9em; ${pickupInfo.style}">${pickupInfo.text}</span><br>
        Total: ${formatPrice(order.total_amount)}<br>
        Status: <span class="order-status ${order.status}">${order.status.toUpperCase()}</span>
      </div>
      <div class="order-items-list">
        <strong>Items:</strong>
        <ul style="padding-left:1.2rem;margin:0.5rem 0;">
          ${order.order_items.map(oi => `<li>${oi.food_items?.name || 'Unknown'} x ${oi.quantity}</li>`).join('')}
        </ul>
      </div>
      
      <div class="order-actions" style="display: flex; gap: 0.5rem; margin-top: 1rem;">
        ${isPending ? `
          <button class="btn btn-success" style="flex: 1;" onclick="window.updateOrderStatus('${order.id}', 'confirmed')">✅ Accept Order</button>
          <button class="btn btn-error" style="flex: 0.5; font-size: 0.8rem;" onclick="window.updateOrderStatus('${order.id}', 'cancelled')">❌ Reject</button>
        ` : ''}
        
        ${isConfirmed ? `
          <button class="btn btn-success" style="flex: 1; background-color: #059669 !important;" onclick="window.updateOrderStatus('${order.id}', 'completed')">🏁 Mark Ready</button>
          <button class="btn btn-error" style="flex: 0.5; font-size: 0.8rem;" onclick="window.updateOrderStatus('${order.id}', 'cancelled')">❌ Cancel</button>
        ` : ''}
      </div>
    </div>
  `;
}

// Order Status Updates
window.updateOrderStatus = async (orderId, newStatus) => {
    const card = document.getElementById(`order-card-${orderId}`);
    const buttons = card ? card.querySelectorAll('.order-actions button') : [];

    try {
        buttons.forEach(btn => btn.disabled = true);
        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId);
        if (error) throw error;
    } catch (err) {
        alert('Failed: ' + err.message);
        buttons.forEach(btn => btn.disabled = false);
    }
}

// --- Menu Management ---

export async function loadFoodItemsAdmin() {
    if (!foodGrid) return;
    foodGrid.innerHTML = '';
    loadedCounts = {};
    for (const category of CATEGORIES) {
        await loadCategoryBatch(category, 0, 20);
    }
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
    foodGrid.innerHTML = '<div class="loading">Searching...</div>';
    const { data, error } = await supabase
        .from('food_items')
        .select('*')
        .ilike('name', `%${searchTerm}%`);

    if (!error && data.length) {
        renderSearchResults(data);
    } else {
        foodGrid.innerHTML = '<p>No items found.</p>';
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
    const isAvailable = item.is_available === true; // Default false if null? or true? legacy: true.
    // Actually db default is usually true. safe to assume true if null?
    // Previous code assumed true.

    return `
    <div class="food-card ${!isAvailable ? 'unavailable' : ''}" style="cursor:default;" id="food-card-${item.id}">
      <div class="food-card-content">
        <div class="food-icon">🍕</div>
        <div class="food-info">
          <h3>${item.name}</h3>
          <p class="food-price">${formatPrice(item.price)}</p>
        </div>
      </div>
      <div class="food-actions">
        <button class="toggle-availability-btn ${isAvailable ? 'active' : 'inactive'}" 
          onclick="window.toggleAvailability(this,'${item.id}', ${isAvailable})">
          ${isAvailable ? 'Mark Unavailable' : 'Make Available'}
        </button>
      </div>
    </div>
  `;
}

// Toggle Availability
window.toggleAvailability = async (btn, id, current) => {
    btn.disabled = true;
    btn.textContent = 'Saving...';
    try {
        const { data, error } = await supabase
            .from('food_items')
            .update({ is_available: !current })
            .eq('id', id)
            .select().single();

        if (error) throw error;
        // UI update handled by realtime or manually here:
        updateCardUI(id, data.is_available);
    } catch (err) {
        alert('Failed: ' + err.message);
        btn.disabled = false;
        btn.textContent = current ? 'Mark Unavailable' : 'Make Available';
    }
};

export function updateCardUI(id, isAvailable) {
    const card = document.getElementById(`food-card-${id}`);
    if (!card) return;
    const btn = card.querySelector('.toggle-availability-btn');

    const newState = isAvailable;
    if (newState) {
        card.classList.remove('unavailable');
        if (btn) {
            btn.textContent = 'Mark Unavailable';
            btn.className = 'toggle-availability-btn active';
            btn.setAttribute('onclick', `window.toggleAvailability(this, '${id}', true)`);
            btn.disabled = false;
        }
    } else {
        card.classList.add('unavailable');
        if (btn) {
            btn.textContent = 'Make Available';
            btn.className = 'toggle-availability-btn inactive';
            btn.setAttribute('onclick', `window.toggleAvailability(this, '${id}', false)`);
            btn.disabled = false;
        }
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
        return { text: `(In ${h}h ${m}m)`, style: 'color: #2563eb;' };
    } else if (diffMins > 0) {
        return { text: `(In ${diffMins} min)`, style: diffMins < 10 ? 'color: #dc2626; font-weight: bold;' : 'color: #2563eb;' };
    } else {
        return { text: `(OVERDUE)`, style: 'color: #dc2626; font-weight: bold;' };
    }
}
