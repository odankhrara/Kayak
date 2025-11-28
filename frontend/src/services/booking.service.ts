import api from './api';
import { Booking, CreateBookingData, BookingResponse } from '../types';

// Map backend booking response to frontend Booking type
const mapBookingResponse = (backendBooking: any): Booking => ({
  bookingId: backendBooking.bookingId,
  userId: backendBooking.userId,
  bookingType: backendBooking.bookingType,
  bookingRef: backendBooking.bookingReference || backendBooking.bookingRef,
  status: backendBooking.status,
  checkInDate: backendBooking.startDate || backendBooking.checkInDate,
  checkOutDate: backendBooking.endDate || backendBooking.checkOutDate,
  bookingDate: backendBooking.bookingDate,
  totalAmount: backendBooking.totalAmount,
  createdAt: backendBooking.createdAt,
  updatedAt: backendBooking.updatedAt,
});

export const bookingService = {
  // Create booking with payment
  async create(data: CreateBookingData): Promise<BookingResponse> {
    const response = await api.post<BookingResponse>('/api/bookings/create', data);
    return response.data;
  },

  // Get booking by ID
  async getById(id: string): Promise<Booking> {
    const response = await api.get<any>(`/api/bookings/${id}`);
    return mapBookingResponse(response.data);
  },

  // Get user's bookings
  async getUserBookings(
    userId: string,
    filter?: 'past' | 'current' | 'future'
  ): Promise<Booking[]> {
    const url = filter
      ? `/api/bookings/user/${userId}?filter=${filter}`
      : `/api/bookings/user/${userId}`;
      
    const response = await api.get<{ bookings: any[]; count: number }>(url);
    return response.data.bookings.map(mapBookingResponse);
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

