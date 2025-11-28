"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingService = void 0;
const billingRepository_1 = require("../repositories/billingRepository");
class BillingService {
    constructor() {
        this.repository = new billingRepository_1.BillingRepository();
    }
    /**
     * Get billing record by ID
     */
    async getById(billingId) {
        if (!billingId || billingId.trim().length === 0) {
            throw new Error('Billing ID is required');
        }
        const billing = await this.repository.getById(billingId);
        if (!billing) {
            throw new Error(`Billing record ${billingId} not found`);
        }
        return billing;
    }
    /**
     * Get billing records for a specific booking
     */
    async getByBookingId(bookingId) {
        if (!bookingId || bookingId.trim().length === 0) {
            throw new Error('Booking ID is required');
        }
        return await this.repository.getByBookingId(bookingId);
    }
    /**
     * Get user's billing history
     */
    async getUserBillings(userId) {
        if (!userId || userId.trim().length === 0) {
            throw new Error('User ID is required');
        }
        return await this.repository.getByUserId(userId);
    }
    /**
     * Search billings with filters (Admin only)
     */
    async searchBillings(filters) {
        try {
            // Validate date range if provided
            if (filters.startDate && filters.endDate) {
                const start = new Date(filters.startDate);
                const end = new Date(filters.endDate);
                if (end < start) {
                    throw new Error('End date must be after start date');
                }
            }
            // Validate amount range
            if (filters.minAmount && filters.minAmount < 0) {
                throw new Error('Minimum amount cannot be negative');
            }
            if (filters.maxAmount && filters.maxAmount < 0) {
                throw new Error('Maximum amount cannot be negative');
            }
            if (filters.minAmount && filters.maxAmount && filters.minAmount > filters.maxAmount) {
                throw new Error('Minimum amount cannot be greater than maximum amount');
            }
            // Validate limit
            if (filters.limit && (filters.limit < 1 || filters.limit > 1000)) {
                throw new Error('Limit must be between 1 and 1000');
            }
            return await this.repository.searchBillings(filters);
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Get revenue by date range (Admin only)
     */
    async getRevenue(startDate, endDate) {
        try {
            const billings = await this.repository.searchBillings({
                startDate,
                endDate,
                status: 'completed',
                limit: 10000
            });
            // Calculate total revenue (excluding refunds)
            const totalRevenue = billings
                .filter(b => b.amount > 0)
                .reduce((sum, b) => sum + parseFloat(b.amount), 0);
            const totalTransactions = billings.filter(b => b.amount > 0).length;
            // Calculate revenue by booking type
            const byType = {
                flight: billings
                    .filter(b => b.bookingType === 'flight' && b.amount > 0)
                    .reduce((sum, b) => sum + parseFloat(b.amount), 0),
                hotel: billings
                    .filter(b => b.bookingType === 'hotel' && b.amount > 0)
                    .reduce((sum, b) => sum + parseFloat(b.amount), 0),
                car: billings
                    .filter(b => b.bookingType === 'car' && b.amount > 0)
                    .reduce((sum, b) => sum + parseFloat(b.amount), 0)
            };
            // Calculate revenue by month
            const monthlyRevenue = {};
            billings
                .filter(b => b.amount > 0)
                .forEach(billing => {
                const month = new Date(billing.transactionDate).toISOString().slice(0, 7); // YYYY-MM
                monthlyRevenue[month] = (monthlyRevenue[month] || 0) + parseFloat(billing.amount);
            });
            const byMonth = Object.entries(monthlyRevenue)
                .map(([month, revenue]) => ({ month, revenue }))
                .sort((a, b) => a.month.localeCompare(b.month));
            return {
                totalRevenue: parseFloat(totalRevenue.toFixed(2)),
                totalTransactions,
                byType: {
                    flight: parseFloat(byType.flight.toFixed(2)),
                    hotel: parseFloat(byType.hotel.toFixed(2)),
                    car: parseFloat(byType.car.toFixed(2))
                },
                byMonth
            };
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Get top revenue generating properties (Admin only)
     */
    async getTopProperties(year, limit = 10) {
        try {
            const startDate = `${year}-01-01`;
            const endDate = `${year}-12-31`;
            const billings = await this.repository.searchBillings({
                startDate,
                endDate,
                status: 'completed',
                limit: 10000
            });
            // Group by entity (extracted from invoice details)
            const propertyRevenue = {};
            billings
                .filter(b => b.amount > 0 && b.invoiceDetails)
                .forEach(billing => {
                const entityId = billing.invoiceDetails.entityId || 'unknown';
                const key = `${entityId}:${billing.bookingType}`;
                if (!propertyRevenue[key]) {
                    propertyRevenue[key] = {
                        revenue: 0,
                        bookings: 0,
                        type: billing.bookingType
                    };
                }
                propertyRevenue[key].revenue += parseFloat(billing.amount);
                propertyRevenue[key].bookings += 1;
            });
            // Sort by revenue and return top N
            return Object.entries(propertyRevenue)
                .map(([key, data]) => ({
                entityId: key.split(':')[0],
                bookingType: data.type,
                revenue: parseFloat(data.revenue.toFixed(2)),
                bookings: data.bookings
            }))
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, limit);
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Get city-wise revenue (Admin only)
     */
    async getCityRevenue(year) {
        try {
            const startDate = `${year}-01-01`;
            const endDate = `${year}-12-31`;
            const billings = await this.repository.searchBillings({
                startDate,
                endDate,
                status: 'completed',
                limit: 10000
            });
            // Group by city (this would require joining with hotels/flights in production)
            // For now, we'll return a placeholder implementation
            const cityRevenue = {};
            billings
                .filter(b => b.amount > 0)
                .forEach(billing => {
                // Placeholder: extract city from invoice details if available
                const city = billing.invoiceDetails?.city || 'Unknown';
                if (!cityRevenue[city]) {
                    cityRevenue[city] = { revenue: 0, bookings: 0 };
                }
                cityRevenue[city].revenue += parseFloat(billing.amount);
                cityRevenue[city].bookings += 1;
            });
            return Object.entries(cityRevenue)
                .map(([city, data]) => ({
                city,
                revenue: parseFloat(data.revenue.toFixed(2)),
                bookings: data.bookings
            }))
                .sort((a, b) => b.revenue - a.revenue);
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Generate invoice for a billing record
     */
    async generateInvoice(billingId) {
        const billing = await this.repository.getById(billingId);
        if (!billing) {
            throw new Error(`Billing record ${billingId} not found`);
        }
        const subtotal = parseFloat(billing.amount) / 1.1; // Assuming 10% tax
        const tax = parseFloat(billing.amount) - subtotal;
        return {
            invoiceNumber: `INV-${billingId}`,
            billingDetails: billing,
            breakdown: {
                subtotal: parseFloat(subtotal.toFixed(2)),
                tax: parseFloat(tax.toFixed(2)),
                total: parseFloat(billing.amount)
            }
        };
    }
    /**
     * Get all billings (Admin only)
     */
    async getAllBillings(limit = 100) {
        if (limit < 1 || limit > 1000) {
            throw new Error('Limit must be between 1 and 1000');
        }
        return await this.repository.searchBillings({ limit });
    }
}
exports.BillingService = BillingService;
