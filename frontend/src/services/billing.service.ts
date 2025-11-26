import api from './api';
import { Billing } from '../types';

export const billingService = {
  // Get billing by ID
  async getById(id: string): Promise<Billing> {
    const response = await api.get<Billing>(`/api/billing/${id}`);
    return response.data;
  },

  // Get user's billing history
  async getUserBillings(userId: string): Promise<Billing[]> {
    const response = await api.get<{ billings: Billing[]; count: number }>(
      `/api/billing/user/${userId}`
    );
    return response.data.billings;
  },

  // Get billing for a booking
  async getByBookingId(bookingId: string): Promise<Billing[]> {
    const response = await api.get<{ billings: Billing[]; count: number }>(
      `/api/billing/booking/${bookingId}`
    );
    return response.data.billings;
  },

  // Generate invoice
  async generateInvoice(id: string): Promise<any> {
    const response = await api.get(`/api/billing/${id}/invoice`);
    return response.data;
  },
};

