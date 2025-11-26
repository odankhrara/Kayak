import api from './api';
import { Booking, CreateBookingData, BookingResponse } from '../types';

export const bookingService = {
  // Create booking with payment
  async create(data: CreateBookingData): Promise<BookingResponse> {
    const response = await api.post<BookingResponse>('/api/bookings/create', data);
    return response.data;
  },

  // Get booking by ID
  async getById(id: string): Promise<Booking> {
    const response = await api.get<Booking>(`/api/bookings/${id}`);
    return response.data;
  },

  // Get user's bookings
  async getUserBookings(
    userId: string,
    filter?: 'past' | 'current' | 'future'
  ): Promise<Booking[]> {
    const url = filter
      ? `/api/bookings/user/${userId}?filter=${filter}`
      : `/api/bookings/user/${userId}`;
      
    const response = await api.get<{ bookings: Booking[]; count: number }>(url);
    return response.data.bookings;
  },

  // Cancel booking
  async cancel(id: string, reason?: string): Promise<{
    message: string;
    refundAmount: number;
  }> {
    const response = await api.post(`/api/bookings/${id}/cancel`, { reason });
    return response.data;
  },
};

