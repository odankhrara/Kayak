import { create } from 'zustand';
import { Favorite, SharedTrip, favoriteService } from '../services/favorite.service';
import { toast } from 'react-toastify';

interface FavoriteStore {
  favorites: Favorite[];
  sharedTrip: (SharedTrip & { favorite: Favorite }) | null;
  isLoading: boolean;
  
  // Actions
  loadFavorites: (userId: string) => Promise<void>;
  addFavorite: (userId: string, itemType: 'flight' | 'hotel' | 'car', itemId: string, notes?: string) => Promise<void>;
  removeFavorite: (favoriteId: number, userId: string) => Promise<void>;
  updateNotes: (favoriteId: number, userId: string, notes: string) => Promise<void>;
  shareTrip: (favoriteId: number, userId: string, expiresInDays?: number) => Promise<string>;
  loadSharedTrip: (token: string) => Promise<void>;
  clearSharedTrip: () => void;
  checkIfFavorited: (userId: string, itemType: string, itemId: string) => Promise<boolean>;
}

export const useFavoriteStore = create<FavoriteStore>((set, get) => ({
  favorites: [],
  sharedTrip: null,
  isLoading: false,

  loadFavorites: async (userId: string) => {
    set({ isLoading: true });
    try {
      const favorites = await favoriteService.getFavorites(userId);
      set({ favorites, isLoading: false });
    } catch (error) {
      console.error('Error loading favorites:', error);
      toast.error('Failed to load favorites');
      set({ isLoading: false });
    }
  },

  addFavorite: async (userId: string, itemType: 'flight' | 'hotel' | 'car', itemId: string, notes?: string) => {
    try {
      const newFavorite = await favoriteService.saveFavorite({
        user_id: userId,
        item_type: itemType,
        item_id: itemId,
        notes,
      });
      
      set((state) => ({
        favorites: [newFavorite, ...state.favorites],
      }));
      
      toast.success('Added to My Trips! ❤️');
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.info('Already in My Trips');
      } else {
        console.error('Error adding favorite:', error);
        toast.error('Failed to add to favorites');
      }
      throw error;
    }
  },

  removeFavorite: async (favoriteId: number, userId: string) => {
    try {
      await favoriteService.deleteFavorite(favoriteId, userId);
      
      set((state) => ({
        favorites: state.favorites.filter((f) => f.favorite_id !== favoriteId),
      }));
      
      toast.success('Removed from My Trips');
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast.error('Failed to remove favorite');
      throw error;
    }
  },

  updateNotes: async (favoriteId: number, userId: string, notes: string) => {
    try {
      const updatedFavorite = await favoriteService.updateFavoriteNotes(favoriteId, userId, notes);
      
      set((state) => ({
        favorites: state.favorites.map((f) =>
          f.favorite_id === favoriteId ? updatedFavorite : f
        ),
      }));
      
      toast.success('Notes updated');
    } catch (error) {
      console.error('Error updating notes:', error);
      toast.error('Failed to update notes');
      throw error;
    }
  },

  shareTrip: async (favoriteId: number, userId: string, expiresInDays?: number) => {
    try {
      const sharedTrip = await favoriteService.shareTrip(favoriteId, userId, expiresInDays);
      const shareUrl = `${window.location.origin}/shared/${sharedTrip.share_token}`;
      return shareUrl;
    } catch (error) {
      console.error('Error sharing trip:', error);
      toast.error('Failed to create share link');
      throw error;
    }
  },

  loadSharedTrip: async (token: string) => {
    set({ isLoading: true });
    try {
      const sharedTrip = await favoriteService.getSharedTrip(token);
      set({ sharedTrip: sharedTrip as any, isLoading: false });
    } catch (error) {
      console.error('Error loading shared trip:', error);
      toast.error('Failed to load shared trip');
      set({ isLoading: false, sharedTrip: null });
    }
  },

  clearSharedTrip: () => {
    set({ sharedTrip: null });
  },

  checkIfFavorited: async (userId: string, itemType: string, itemId: string) => {
    try {
      return await favoriteService.checkIfFavorited(userId, itemType, itemId);
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return false;
    }
  },
}));

