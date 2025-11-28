// User Types
export interface User {
  userId: string; // SSN
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  profileImage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RegisterData {
  userId: string; // SSN format: XXX-XX-XXXX
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  message?: string;
}

// Flight Types
export interface Flight {
  flightId: string;
  airlineName: string;
  departureAirport: string;
  arrivalAirport: string;
  departureDatetime: string;
  arrivalDatetime: string;
  durationMinutes: number;
  flightClass: 'economy' | 'business' | 'first';
  pricePerTicket: number;  // Changed from ticketPrice to match backend
  ticketPrice?: number;  // Keep for backwards compatibility
  totalSeats: number;
  availableSeats: number;
  flightRating?: number;
  rating?: number;  // Alternative field name
  reviewsCount?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FlightSearchFilters {
  origin: string;
  destination: string;
  departureDate?: string;
  returnDate?: string;
  passengers?: number;
  class?: 'economy' | 'business' | 'first';
  minPrice?: number;
  maxPrice?: number;
  airline?: string;
  minRating?: number;
  sortBy?: 'price' | 'duration' | 'rating' | 'departure_time';
  sortOrder?: 'ASC' | 'DESC';
}

// Hotel Types
export interface Hotel {
  hotelId: string;
  hotelName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  starRating: number;
  totalRooms: number;
  description?: string;
  hotelRating?: number;
  rooms?: HotelRoom[];
  amenities?: string[];
}

export interface HotelRoom {
  roomId: string;
  hotelId: string;
  roomType: string;
  pricePerNight: number;
  maxGuests: number;
  totalRooms: number;
  availableRooms: number;
  description?: string;
}

export interface HotelSearchFilters {
  city?: string;
  state?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  rooms?: number;
  minPrice?: number;
  maxPrice?: number;
  minStars?: number;
  maxStars?: number;
  amenities?: string[];
  minRating?: number;
  sortBy?: 'price' | 'rating' | 'stars';
  sortOrder?: 'ASC' | 'DESC';
}

// Car Types
export interface Car {
  carId: string;
  carType: 'sedan' | 'suv' | 'compact' | 'luxury' | 'van' | 'truck';
  companyName: string;
  model: string;
  year: number;
  transmissionType: 'automatic' | 'manual';
  seats: number;
  dailyRentalPrice: number;
  location: string;
  available: boolean;
  carRating?: number;
}

export interface CarSearchFilters {
  location: string;
  pickupDate?: string;
  returnDate?: string;
  carType?: 'sedan' | 'suv' | 'compact' | 'luxury' | 'van' | 'truck';
  transmission?: 'automatic' | 'manual';
  minPrice?: number;
  maxPrice?: number;
  minSeats?: number;
  company?: string;
  minRating?: number;
  sortBy?: 'price' | 'rating';
  sortOrder?: 'ASC' | 'DESC';
}

// Booking Types
export interface Booking {
  bookingId: string;
  userId: string;
  bookingType: 'flight' | 'hotel' | 'car';
  bookingRef: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  checkInDate: string;
  checkOutDate: string;
  bookingDate: string;
  totalAmount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBookingData {
  bookingType: 'flight' | 'hotel' | 'car';
  entityId: string;
  quantity: number;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: number;
  paymentMethod: 'credit_card' | 'debit_card' | 'paypal';
  paymentDetails: PaymentDetails;
}

export interface PaymentDetails {
  cardNumber?: string;
  cvv?: string;
  expiryDate?: string;
  paypalEmail?: string;
}

export interface BookingResponse {
  booking: Booking;
  billing: Billing;
  message: string;
}

// Billing Types
export interface Billing {
  billingId: string;
  userId: string;
  bookingId: string;
  bookingType: 'flight' | 'hotel' | 'car';
  amount: number;
  paymentMethod: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionDate: string;
  invoiceDetails?: any;
  receiptDetails?: any;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface ListResponse<T> {
  count: number;
  items: T[];
  filters?: any;
}

// Common Types
export interface SelectOption {
  value: string;
  label: string;
}

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

// Search Context Types
export interface SearchState {
  type: 'flight' | 'hotel' | 'car';
  filters: FlightSearchFilters | HotelSearchFilters | CarSearchFilters;
}

