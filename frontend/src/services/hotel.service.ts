import api from './api';
import { Hotel, HotelSearchFilters } from '../types';

export interface HotelLocation {
  city: string;
  state: string;
  label: string;
  hotelCount: number;
}

export const hotelService = {
  // Get locations for autocomplete
  async getLocations(searchTerm?: string): Promise<HotelLocation[]> {
    const params = searchTerm ? `?q=${encodeURIComponent(searchTerm)}` : '';
    const response = await api.get<{ locations: HotelLocation[]; count: number }>(
      `/api/listings/hotels/locations${params}`
    );
    return response.data.locations;
  },

  // Search hotels
  async search(filters: HotelSearchFilters): Promise<Hotel[]> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          params.append(key, value.join(','));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    const response = await api.get<{ hotels: Hotel[]; count: number }>(
      `/api/listings/hotels/search?${params.toString()}`
    );
    
    return response.data.hotels;
  },

  // Get hotel by ID
  async getById(id: string): Promise<Hotel> {
    const response = await api.get<Hotel>(`/api/listings/hotels/${id}`);
    return response.data;
  },

  // Check room availability
  async checkAvailability(
    id: string,
    roomType: string,
    rooms: number
  ): Promise<{
    available: boolean;
    availableRooms: number;
    requestedRooms: number;
  }> {
    const response = await api.get(
      `/api/listings/hotels/${id}/availability?roomType=${roomType}&rooms=${rooms}`
    );
    return response.data;
  },
};

