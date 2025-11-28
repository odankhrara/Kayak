"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateId = generateId;
exports.formatCurrency = formatCurrency;
exports.formatDate = formatDate;
exports.isValidEmail = isValidEmail;
exports.isValidSSN = isValidSSN;
exports.isValidZIP = isValidZIP;
function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}
function formatDate(date) {
    return new Date(date).toISOString().split('T')[0];
}
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function isValidSSN(ssn) {
    return /^\d{3}-\d{2}-\d{4}$/.test(ssn);
}
function isValidZIP(zip) {
    return /^\d{5}(-\d{4})?$/.test(zip);
}
//# sourceMappingURL=index.js.map