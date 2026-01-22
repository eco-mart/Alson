export const isTauri = () =>
    typeof window !== "undefined" &&
    window.__TAURI__ !== undefined;

export function formatPrice(amount) {
    return `Rs. ${amount}`;
}

export function showError(element, message, isSuccess = false) {
    if (!element) return;
    element.textContent = message;
    element.className = isSuccess ? 'error-message success' : 'error-message';
    if (!isSuccess) {
        setTimeout(() => element.textContent = '', 5000);
    }
}
