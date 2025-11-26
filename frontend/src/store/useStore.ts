import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '../api/userApi'
import type { Flight, Hotel, Car } from '../api/listingApi'
import type { Booking } from '../api/bookingApi'

interface AppState {
  // Auth
  user: User | null
  token: string | null
  isAuthenticated: boolean

  // Search state
  searchResults: {
    flights: Flight[]
    hotels: Hotel[]
    cars: Car[]
  }
  searchParams: {
    origin?: string
    destination?: string
    departureDate?: string
    returnDate?: string
    city?: string
    checkIn?: string
    checkOut?: string
    passengers?: number
    guests?: number
  }

  // Booking state
  selectedListing: Flight | Hotel | Car | null
  currentBooking: Booking | null
  userBookings: Booking[]

  // UI state
  error: string | null
  loading: boolean
  statusMessage: string | null

  // Actions
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  login: (user: User, token: string) => void
  logout: () => void
  setSearchResults: (results: { flights: Flight[]; hotels: Hotel[]; cars: Car[] }) => void
  setSearchParams: (params: AppState['searchParams']) => void
  setSelectedListing: (listing: Flight | Hotel | Car | null) => void
  setCurrentBooking: (booking: Booking | null) => void
  setUserBookings: (bookings: Booking[]) => void
  setError: (error: string | null) => void
  setLoading: (loading: boolean) => void
  setStatusMessage: (message: string | null) => void
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      searchResults: {
        flights: [],
        hotels: [],
        cars: [],
      },
      searchParams: {},
      selectedListing: null,
      currentBooking: null,
      userBookings: [],
      error: null,
      loading: false,
      statusMessage: null,

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false, userBookings: [] }),
      setSearchResults: (results) => set({ searchResults: results }),
      setSearchParams: (params) => set({ searchParams: params }),
      setSelectedListing: (listing) => set({ selectedListing: listing }),
      setCurrentBooking: (booking) => set({ currentBooking: booking }),
      setUserBookings: (bookings) => set({ userBookings: bookings }),
      setError: (error) => set({ error }),
      setLoading: (loading) => set({ loading }),
      setStatusMessage: (message) => set({ statusMessage: message }),
    }),
    {
      name: 'kayak-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

