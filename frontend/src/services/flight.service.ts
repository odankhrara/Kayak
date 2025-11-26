import api from './api';
import { Flight, FlightSearchFilters, ListResponse } from '../types';

export const flightService = {
  // Search flights
  async search(filters: FlightSearchFilters): Promise<Flight[]> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get<{ flights: Flight[]; count: number }>(
      `/api/listings/flights/search?${params.toString()}`
    );
    
    return response.data.flights;
  },

  // Get flight by ID
  async getById(id: string): Promise<Flight> {
    const response = await api.get<Flight>(`/api/listings/flights/${id}`);
    return response.data;
  },

  // Check flight availability
  async checkAvailability(id: string, passengers: number): Promise<{
    available: boolean;
    availableSeats: number;
    requestedSeats: number;
  }> {
    const response = await api.get(`/api/listings/flights/${id}/availability?passengers=${passengers}`);
    return response.data;
  },
};

