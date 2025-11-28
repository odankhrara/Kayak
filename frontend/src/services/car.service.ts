import api from './api';
import { Car, CarSearchFilters } from '../types';

// Map backend response to frontend Car type
const mapCarResponse = (backendCar: any): Car => ({
  carId: backendCar.carId,
  carType: backendCar.carType,
  companyName: backendCar.companyName,
  model: backendCar.model,
  year: backendCar.year,
  transmissionType: backendCar.transmission || backendCar.transmissionType,
  seats: backendCar.seats,
  dailyRentalPrice: backendCar.dailyRate || backendCar.dailyRentalPrice,
  location: backendCar.location,
  available: backendCar.available === 1 || backendCar.available === true,
  carRating: backendCar.rating || backendCar.carRating,
});

export const carService = {
  // Search cars
  async search(filters: CarSearchFilters): Promise<Car[]> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get<{ cars: any[]; count: number }>(
      `/api/listings/cars/search?${params.toString()}`
    );
    
    return response.data.cars.map(mapCarResponse);
  },

  // Get car by ID
  async getById(id: string): Promise<Car> {
    const response = await api.get<any>(`/api/listings/cars/${id}`);
    return mapCarResponse(response.data);
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

