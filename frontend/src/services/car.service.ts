import api from './api';
import { Car, CarSearchFilters } from '../types';

export const carService = {
  // Search cars
  async search(filters: CarSearchFilters): Promise<Car[]> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get<{ cars: Car[]; count: number }>(
      `/api/listings/cars/search?${params.toString()}`
    );
    
    return response.data.cars;
  },

  // Get car by ID
  async getById(id: string): Promise<Car> {
    const response = await api.get<Car>(`/api/listings/cars/${id}`);
    return response.data;
  },

  // Calculate rental cost
  async calculateCost(
    id: string,
    pickupDate: string,
    returnDate: string
  ): Promise<{
    days: number;
    dailyRate: number;
    subtotal: number;
    tax: number;
    total: number;
  }> {
    const response = await api.post(`/api/listings/cars/${id}/calculate-cost`, {
      pickupDate,
      returnDate,
    });
    return response.data;
  },

  // Check car availability
  async checkAvailability(id: string): Promise<{
    available: boolean;
    carId: string;
  }> {
    const response = await api.get(`/api/listings/cars/${id}/availability`);
    return response.data;
  },
};

