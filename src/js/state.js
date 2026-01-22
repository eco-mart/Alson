export const state = {
    currentUser: null,
    cart: [],
    foodItems: [],
    categories: [
        'Beverages', 'Breakfast', 'Snacks', 'Wai-Wai', 'Fried Rice & Noodles',
        'Momo', 'Sandwich & Burger', 'Soup & Thukpa', 'Rice Thali', 'Day Special Menu'
    ]
};

export function setCurrentUser(user) {
    state.currentUser = user;
}

export function addToCart(item, quantity = 1) {
    const existing = state.cart.find(i => i.id === item.id && !i.synced);
    if (existing) {
        existing.quantity += quantity;
    } else {
        state.cart.push({ ...item, quantity, synced: false });
    }
}

export function clearCart() {
    state.cart = [];
}
