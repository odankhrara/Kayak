import { create } from 'zustand';
import { User, LoginData, RegisterData } from '../types';
import { authService } from '../services/auth.service';
import { getCurrentUser } from '../services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  // Initialize auth state from localStorage
  initialize: () => {
    const user = getCurrentUser();
    const token = localStorage.getItem('authToken');
    
    set({
      user,
      isAuthenticated: !!(user && token),
      isLoading: false,
    });
  },

  // Login
  login: async (data: LoginData) => {
    try {
      const response = await authService.login(data);
      set({
        user: response.user,
        isAuthenticated: true,
      });
    } catch (error) {
      set({ user: null, isAuthenticated: false });
      throw error;
    }
  },

  // Register
  register: async (data: RegisterData) => {
    try {
      const response = await authService.register(data);
      set({
        user: response.user,
        isAuthenticated: true,
      });
    } catch (error) {
      set({ user: null, isAuthenticated: false });
      throw error;
    }
  },

  // Logout
  logout: () => {
    authService.logout();
    set({
      user: null,
      isAuthenticated: false,
    });
  },

  // Update user
  updateUser: (user: User) => {
    set({ user });
  },
}));

