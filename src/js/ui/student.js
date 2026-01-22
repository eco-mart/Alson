import { supabase } from '../api.js';
import { state, addToCart } from '../state.js';
import { showError, formatPrice } from '../utils.js';
import { updateCartBadge, autoOpenCartOnMobile, isMobile } from '../mobile.js';

// DOM Elements
const foodGrid = document.getElementById('food-grid');
const cartItems = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const checkoutSection = document.getElementById('checkout-section');
const myOrdersContainer = document.getElementById('my-orders-container');
const myOrdersList = document.getElementById('my-orders-list');
const errorMessage = document.getElementById('error-message');
const searchInput = document.getElementById('search-input');

let countdownInterval;
const loadedCounts = {};
let searchTimeout;

// Search Event Listener
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.trim();

    // Debounce search - wait 300ms after user stops typing
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      loadFoodItems(searchTerm);
    }, 300);
  });
}

// --- Menu Functions ---

export async function loadFoodItems(searchTerm = '') {
  const { categories } = state;
  if (!foodGrid) return;
  foodGrid.innerHTML = '';

  if (searchTerm) {
    await searchFoodItems(searchTerm);
    return;
  }

  // Load batch for categories
  for (const category of categories) {
    await loadCategoryBatch(category, 0, 2);
  }
}

async function searchFoodItems(searchTerm) {
  foodGrid.innerHTML = '<div class="loading">Searching...</div>';
  try {
    const { data, error } = await supabase
      .from('food_items')
      .select('*')
      .ilike('name', `%${searchTerm}%`);

    if (error) throw error;
    if (data.length === 0) {
      foodGrid.innerHTML = `<div class="loading"><h3>No items found</h3></div>`;
      return;
    }
    renderSearchResults(data);
  } catch (error) {
    showError(errorMessage, `Search failed: ${error.message}`);
  }
}

async function loadCategoryBatch(category, from, limit) {
  try {
    const { data, error } = await supabase
      .from('food_items')
      .select('*')
      .eq('category', category)
      .range(from, from + limit - 1);

    if (error) throw error;
    if (data.length > 0) appendCategoryItems(category, data, from === 0);
  } catch (error) {
    console.error(error);
  }
}

function appendCategoryItems(category, items, isNewSection) {
  const catId = category.replace(/\s+/g, '-').replace(/[&]/g, '').toLowerCase();
  let section = document.getElementById(`cat-section-${catId}`);

  if (!section || isNewSection) {
    if (isNewSection && section) section.remove();
    const sectionHTML = `
      <div class="category-section" id="cat-section-${catId}">
        <h2 class="category-title">${category}</h2>
        <div class="items-grid" id="grid-${catId}">
          ${renderItemsHTML(items)}
        </div>
        <div class="load-more-container" id="btn-container-${catId}">
           <button class="btn btn-sm btn-secondary" onclick="window.loadMore('${category}')">Show More ⬇️</button>
        </div>
      </div>
    `;
    foodGrid.insertAdjacentHTML('beforeend', sectionHTML);
  } else {
    document.getElementById(`grid-${catId}`).insertAdjacentHTML('beforeend', renderItemsHTML(items));
  }
}

function renderItemsHTML(items) {
  return items.map(item => {
    const isAvailable = item.is_available === null || item.is_available === true;
    const clickHandler = isAvailable
      ? `window.selectItem('${item.id}', '${item.name}', ${item.price}, true)`
      : `window.showErrorMsg('${item.name} is currently not available', false)`;

    return `
    <div class="food-card ${!isAvailable ? 'unavailable' : ''}"
         onclick="${clickHandler}"
         style="${isAvailable ? 'cursor: pointer;' : 'cursor: not-allowed;'}">
         
      <div class="food-card-content">
        <div class="food-icon">🍕</div>
        <div class="food-info">
          <h3>${item.name}</h3>
          <p class="food-price">${formatPrice(item.price)}</p>
        </div>
      </div>
    </div>
  `}).join('');
}

function renderSearchResults(items) {
  const grouped = items.reduce((acc, item) => {
    const cat = item.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  foodGrid.innerHTML = Object.entries(grouped).map(([category, items]) => `
    <div class="category-section">
      <h2 class="category-title">${category} (Search Results)</h2>
      <div class="items-grid">
        ${renderItemsHTML(items)}
      </div>
    </div>
  `).join('');
}

// --- Cart Functions ---

export async function loadCart() {
  const savedLocal = localStorage.getItem('food_app_cart_drafts');
  let drafts = savedLocal ? JSON.parse(savedLocal) : [];

  let synced = [];
  if (state.currentUser) {
    const { data } = await supabase
      .from('carts')
      .select('*, food_items(name, price)')
      .eq('user_id', state.currentUser.id);

    if (data) {
      synced = data.map(item => ({
        id: item.id,
        food_item_id: item.food_item_id,
        name: item.food_items?.name,
        price: item.food_items?.price,
        quantity: item.quantity,
        synced: true // synced items
      }));
    }
  }

  state.cart = [...drafts, ...synced];
  renderCart();
}

export function renderCart() {
  const { cart } = state;
  const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (cartCount) cartCount.textContent = `${totalQty} items (${formatPrice(totalPrice)})`;

  // Update mobile bottom nav badge
  updateCartBadge(totalQty);

  if (!cartItems) return; // Guard for pages without cart

  if (cart.length === 0) {
    cartItems.innerHTML = `<div class="empty-cart"><p>Your cart is empty.</p></div>`;
    if (checkoutSection) checkoutSection.style.display = 'none';
    return;
  }

  const hasDrafts = cart.some(item => !item.synced);
  const hasSynced = cart.some(item => item.synced);

  cartItems.innerHTML = cart.map(item => `
    <div class="cart-item ${item.synced ? 'synced' : 'draft'}">
      <div class="cart-item-info">
        <strong>${item.name}</strong>
        <div class="quantity-controls">
          <button onclick="window.updateQuantity('${item.id}', ${item.quantity - 1})">−</button>
          <span>${item.quantity}</span>
          <button onclick="window.updateQuantity('${item.id}', ${item.quantity + 1})">＋</button>
        </div>
      </div>
      <div style="text-align: right;">
        <div>${formatPrice(item.price * item.quantity)}</div>
        <button class="remove-btn" onclick="window.removeFromCart('${item.id}')">🗑️</button>
      </div>
    </div>
  `).join('');

  let buttonsHTML = '';
  if (hasDrafts) {
    buttonsHTML += `<div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
      <button class="btn btn-primary" onclick="window.syncCart()" style="flex: 1;">Add to Cart (Sync)</button>
      <button class="btn btn-secondary" onclick="window.clearDrafts()" style="flex: 0.4;">Clear</button>
    </div>`;
  }
  if (hasSynced) {
    buttonsHTML = `<div class="form-group" style="padding-top: 1rem;">
      <label>🕒 Pickup Time</label>
      <input type="time" id="pickup-time-input" style="width: 100%; border: 1px solid #ddd; padding: 8px;" required />
      <small>Select arrival time.</small>
    </div>
    <button id="checkout-btn" class="btn btn-success" style="width: 100%; margin-top: 0.5rem;">Proceed to Checkout</button>
    ` + buttonsHTML;
  }

  if (checkoutSection) {
    checkoutSection.innerHTML = buttonsHTML;
    checkoutSection.style.display = 'block';
  }

  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) checkoutBtn.addEventListener('click', processCheckout);
}

// --- Order Functions ---

export async function processCheckout() {
  const checkoutBtn = document.getElementById('checkout-btn');
  const pickupInput = document.getElementById('pickup-time-input');

  const syncedItems = state.cart.filter(item => item.synced);
  if (syncedItems.length === 0) return;

  const pickupTime = pickupInput ? pickupInput.value : null;
  if (!pickupTime) {
    showError(errorMessage, 'Please select a pickup time.');
    return;
  }

  checkoutBtn.disabled = true;
  checkoutBtn.textContent = 'Processing...';

  try {
    // 1. Create Order
    const totalAmount = syncedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([{
        user_id: state.currentUser.id,
        total_amount: totalAmount,
        status: 'pending',
        pickup_time: pickupTime
      }])
      .select()
      .single();

    if (orderError) throw orderError;

    // 2. Create Order Items
    const orderItems = syncedItems.map(item => ({
      order_id: orderData.id,
      food_item_id: item.food_item_id,
      quantity: item.quantity,
      price_at_time: item.price
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    if (itemsError) throw itemsError;

    // 3. Clear Cart
    await supabase.from('carts').delete().eq('user_id', state.currentUser.id);
    state.cart = []; // clear local state too
    loadCart();

    showError(errorMessage, 'Order placed successfully!', true);

    // Switch to Orders View
    if (myOrdersContainer) myOrdersContainer.style.display = 'block';
    loadUserOrders();

  } catch (error) {
    showError(errorMessage, `Checkout failed: ${error.message}`);
    checkoutBtn.disabled = false;
    checkoutBtn.textContent = 'Proceed to Checkout';
  }
}

export async function loadUserOrders() {
  if (!myOrdersList) return;
  myOrdersList.innerHTML = '<div class="loading">Loading orders...</div>';
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*, order_items(*, food_items(name))')
    .eq('user_id', state.currentUser.id)
    .order('created_at', { ascending: false });

  if (error) {
    myOrdersList.innerHTML = `<p class="error">Failed: ${error.message}</p>`;
    return;
  }

  if (orders.length === 0) {
    myOrdersList.innerHTML = '<p>No past orders.</p>';
    return;
  }

  myOrdersList.innerHTML = orders.map(order => `
    <div class="order-card-client" data-pickup="${order.pickup_time || ''}">
      <div class="order-header-client">
        <span class="order-id">#${order.id.slice(0, 6)}</span>
        <span class="order-status ${order.status}">${order.status}</span>
      </div>
      <div class="order-details">
        <p><strong>Pickup:</strong> ${order.pickup_time || 'ASAP'}</p>
        <p class="remaining-time" style="font-weight: bold; color: #2563eb;">Calculating...</p>
        <p><strong>Total:</strong> ${formatPrice(order.total_amount)}</p>
      </div>
      <div class="order-items-compact">
        ${order.order_items.map(oi => `<div>${oi.quantity}x ${oi.food_items?.name || 'Item'}</div>`).join('')}
      </div>
      ${order.status === 'pending' ? `
        <button class="btn btn-sm btn-outline-error" onclick="window.cancelOrder('${order.id}')" style="width:100%">🚫 Cancel</button>
      ` : (order.status === 'completed' ? `<div class="ready-badge">✅ Ready for Pickup!</div>` : '')}
    </div>
  `).join('');

  startOrderCountdown();
}

function startOrderCountdown() {
  if (countdownInterval) clearInterval(countdownInterval);
  const update = () => {
    document.querySelectorAll('.order-card-client').forEach(card => {
      const pickup = card.getAttribute('data-pickup');
      const timeEl = card.querySelector('.remaining-time');
      if (!pickup || !timeEl) return;
      // We should calculate real time diff here, but for now simple display
      timeEl.textContent = `Pickup: ${pickup}`;
    });
  };
  update();
  countdownInterval = setInterval(update, 60000);
}

// --- Window Exposures ---

window.selectItem = (id, name, price, available) => {
  if (!available) return;
  const { cart } = state;
  const existing = cart.find(i => i.id === id && !i.synced); // This logic was in main.js

  // Check local drafts
  const existingItem = state.cart.find(item => item.food_item_id === id && !item.synced);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    state.cart.push({
      id: crypto.randomUUID(),
      food_item_id: id,
      name: name,
      price: price,
      quantity: 1,
      synced: false
    });
  }

  localStorage.setItem('food_app_cart_drafts', JSON.stringify(state.cart.filter(i => !i.synced)));
  renderCart();

  // Auto-open cart on mobile when item is added
  autoOpenCartOnMobile();
};

window.showErrorMsg = (msg) => showError(errorMessage, msg);
window.loadMore = async (category) => {
  if (!loadedCounts[category]) loadedCounts[category] = 0;
  const current = document.querySelectorAll(`#grid-${category.replace(/\s+/g, '-').replace(/[&]/g, '').toLowerCase()} .food-card`).length;
  await loadCategoryBatch(category, current, 4);
};

window.updateQuantity = (id, qty) => {
  if (qty <= 0) {
    window.removeFromCart(id);
    return;
  }
  const item = state.cart.find(i => i.id === id);
  if (item) {
    item.quantity = qty;
    if (item.synced) {
      supabase.from('carts').update({ quantity: qty }).eq('id', id).then(() => loadCart());
    } else {
      localStorage.setItem('food_app_cart_drafts', JSON.stringify(state.cart.filter(i => !i.synced)));
      renderCart();
    }
  }
};

window.removeFromCart = (id) => {
  const item = state.cart.find(i => i.id === id);
  if (!item) return;
  if (item.synced) {
    supabase.from('carts').delete().eq('id', id).then(() => loadCart());
  } else {
    state.cart = state.cart.filter(i => i.id !== id);
    localStorage.setItem('food_app_cart_drafts', JSON.stringify(state.cart.filter(i => !i.synced)));
    renderCart();
  }
};

window.syncCart = async () => {
  const drafts = state.cart.filter(i => !i.synced);
  if (!drafts.length) return;
  try {
    const items = drafts.map(i => ({ user_id: state.currentUser.id, food_item_id: i.food_item_id, quantity: i.quantity }));
    const { error } = await supabase.from('carts').insert(items);
    if (error) throw error;
    localStorage.removeItem('food_app_cart_drafts');
    loadCart();
    showError(errorMessage, 'Synced!', true);
  } catch (e) { showError(errorMessage, e.message); }
};

window.clearDrafts = () => {
  state.cart = state.cart.filter(i => i.synced);
  localStorage.removeItem('food_app_cart_drafts');
  renderCart();
};

window.cancelOrder = async (id) => {
  if (!confirm('Cancel order?')) return;
  await supabase.from('orders').update({ status: 'cancelled' }).eq('id', id);
  loadUserOrders();
};
