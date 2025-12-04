import axios from 'axios';

export interface Favorite {
  favorite_id: number;
  user_id: string;
  item_type: 'flight' | 'hotel' | 'car';
  item_id: string;
  notes: string | null;
  created_at: string;
}

export interface SharedTrip {
  share_token: string;
  user_id: string;
  favorite_id: number;
  view_count: number;
  expires_at: string | null;
  created_at: string;
  favorite?: Favorite;
}

export interface SaveFavoriteInput {
  user_id: string;
  item_type: 'flight' | 'hotel' | 'car';
  item_id: string;
  notes?: string;
}

class FavoriteService {
  /**
   * Save a new favorite
   */
  async saveFavorite(input: SaveFavoriteInput): Promise<Favorite> {
    const response = await axios.post('/api/listings/favorites', input);
    return response.data.data;
  }

  /**
   * Get all favorites for a user
   */
  async getFavorites(userId: string): Promise<Favorite[]> {
    const response = await axios.get('/api/listings/favorites', {
      params: { user_id: userId },
    });
    return response.data.data;
  }

  /**
   * Check if an item is favorited
   */
  async checkIfFavorited(userId: string, itemType: string, itemId: string): Promise<boolean> {
    try {
      const response = await axios.get(
        `/api/listings/favorites/check/${itemType}/${itemId}`,
        {
          params: { user_id: userId },
        }
      );
      return response.data.data.is_favorited;
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return false;
    }
  }

  /**
   * Update notes for a favorite
   */
  async updateFavoriteNotes(favoriteId: number, userId: string, notes: string): Promise<Favorite> {
    const response = await axios.put(
      `/api/listings/favorites/${favoriteId}/notes`,
      { user_id: userId, notes }
    );
    return response.data.data;
  }

  /**
   * Delete a favorite
   */
  async deleteFavorite(favoriteId: number, userId: string): Promise<void> {
    await axios.delete(`/api/listings/favorites/${favoriteId}`, {
      data: { user_id: userId },
    });
  }

  /**
   * Create a shareable link for a favorite
   */
  async shareTrip(favoriteId: number, userId: string, expiresInDays?: number): Promise<SharedTrip> {
    const response = await axios.post(
      `/api/listings/favorites/${favoriteId}/share`,
      {
        user_id: userId,
        expires_in_days: expiresInDays,
      }
    );
    return response.data.data;
  }

  /**
   * Get shared trip by token (public)
   */
  async getSharedTrip(token: string): Promise<SharedTrip> {
    const response = await axios.get(`/api/listings/shared/${token}`);
    return response.data.data;
  }
}

export const favoriteService = new FavoriteService();

