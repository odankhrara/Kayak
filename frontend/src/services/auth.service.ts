import api, { setAuthToken, removeAuthToken, setCurrentUser } from './api';
import { RegisterData, LoginData, AuthResponse, User } from '../types';

export const authService = {
  // Register new user
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/users/register', data);
    const { token, user } = response.data;
    
    // Store token and user
    setAuthToken(token);
    setCurrentUser(user);
    
    return response.data;
  },

  // Login user
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/users/login', data);
    const { token, user } = response.data;
    
    // Store token and user
    setAuthToken(token);
    setCurrentUser(user);
    
    return response.data;
  },

  // Logout user
  logout() {
    removeAuthToken();
    window.location.href = '/';
  },

  // Get current user profile
  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/api/users/me');
    return response.data;
  },

  // Update user profile
  async updateProfile(userId: string, data: Partial<User>): Promise<User> {
    const response = await api.put<{ user: User }>(`/api/users/${userId}`, data);
    
    // Update stored user
    setCurrentUser(response.data.user);
    
    return response.data.user;
  },
};

