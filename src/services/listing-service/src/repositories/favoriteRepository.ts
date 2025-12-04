import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { mysqlPool } from '../../../common/src/db/mysqlPool';
import { v4 as uuidv4 } from 'uuid';

export interface Favorite {
  favorite_id: number;
  user_id: string;
  item_type: 'flight' | 'hotel' | 'car';
  item_id: string;
  notes: string | null;
  created_at: Date;
}

export interface SharedTrip {
  share_token: string;
  user_id: string;
  favorite_id: number;
  view_count: number;
  expires_at: Date | null;
  created_at: Date;
}

export interface CreateFavoriteInput {
  user_id: string;
  item_type: 'flight' | 'hotel' | 'car';
  item_id: string;
  notes?: string;
}

export interface UpdateFavoriteNotesInput {
  notes: string;
}

class FavoriteRepository {
  /**
   * Save a new favorite
   */
  async saveFavorite(input: CreateFavoriteInput): Promise<Favorite> {
    const query = `
      INSERT INTO favorites (user_id, item_type, item_id, notes)
      VALUES (?, ?, ?, ?)
    `;
    
    const [result] = await mysqlPool.execute<ResultSetHeader>(query, [
      input.user_id,
      input.item_type,
      input.item_id,
      input.notes || null,
    ]);

    // Fetch the newly created favorite
    const favorite = await this.getFavoriteById(result.insertId);
    if (!favorite) {
      throw new Error('Failed to create favorite');
    }

    return favorite;
  }

  /**
   * Get all favorites for a user
   */
  async getFavoritesByUserId(userId: string): Promise<Favorite[]> {
    const query = `
      SELECT * FROM favorites
      WHERE user_id = ?
      ORDER BY created_at DESC
    `;
    
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(query, [userId]);
    return rows as Favorite[];
  }

  /**
   * Get a specific favorite by ID
   */
  async getFavoriteById(favoriteId: number): Promise<Favorite | null> {
    const query = `
      SELECT * FROM favorites
      WHERE favorite_id = ?
    `;
    
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(query, [favoriteId]);
    
    if (rows.length === 0) {
      return null;
    }
    
    return rows[0] as Favorite;
  }

  /**
   * Check if an item is already favorited by a user
   */
  async checkIfFavorited(userId: string, itemType: string, itemId: string): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count FROM favorites
      WHERE user_id = ? AND item_type = ? AND item_id = ?
    `;
    
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(query, [userId, itemType, itemId]);
    const count = rows[0].count as number;
    
    return count > 0;
  }

  /**
   * Update favorite notes
   */
  async updateFavoriteNotes(favoriteId: number, userId: string, notes: string): Promise<Favorite | null> {
    const query = `
      UPDATE favorites
      SET notes = ?
      WHERE favorite_id = ? AND user_id = ?
    `;
    
    const [result] = await mysqlPool.execute<ResultSetHeader>(query, [notes, favoriteId, userId]);
    
    if (result.affectedRows === 0) {
      return null;
    }
    
    return await this.getFavoriteById(favoriteId);
  }

  /**
   * Delete a favorite
   */
  async deleteFavorite(favoriteId: number, userId: string): Promise<boolean> {
    const query = `
      DELETE FROM favorites
      WHERE favorite_id = ? AND user_id = ?
    `;
    
    const [result] = await mysqlPool.execute<ResultSetHeader>(query, [favoriteId, userId]);
    
    return result.affectedRows > 0;
  }

  /**
   * Create a shareable link for a favorite
   */
  async createSharedTrip(favoriteId: number, userId: string, expiresInDays?: number): Promise<SharedTrip | null> {
    // First check if the favorite belongs to the user
    const favorite = await this.getFavoriteById(favoriteId);
    if (!favorite || favorite.user_id !== userId) {
      return null;
    }

    // Generate a unique share token
    const shareToken = uuidv4();
    
    // Calculate expiration date if specified
    let expiresAt = null;
    if (expiresInDays) {
      const now = new Date();
      now.setDate(now.getDate() + expiresInDays);
      expiresAt = now;
    }

    const query = `
      INSERT INTO shared_trips (share_token, user_id, favorite_id, expires_at)
      VALUES (?, ?, ?, ?)
    `;
    
    await mysqlPool.execute<ResultSetHeader>(query, [
      shareToken,
      userId,
      favoriteId,
      expiresAt,
    ]);

    return await this.getSharedTripByToken(shareToken);
  }

  /**
   * Get shared trip by token
   */
  async getSharedTripByToken(shareToken: string): Promise<SharedTrip | null> {
    const query = `
      SELECT * FROM shared_trips
      WHERE share_token = ?
    `;
    
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(query, [shareToken]);
    
    if (rows.length === 0) {
      return null;
    }
    
    return rows[0] as SharedTrip;
  }

  /**
   * Get shared trip with favorite details
   */
  async getSharedTripWithDetails(shareToken: string): Promise<(SharedTrip & { favorite: Favorite }) | null> {
    // Check if link is expired
    const sharedTrip = await this.getSharedTripByToken(shareToken);
    if (!sharedTrip) {
      return null;
    }

    if (sharedTrip.expires_at && new Date(sharedTrip.expires_at) < new Date()) {
      return null; // Link expired
    }

    // Increment view count
    await this.incrementSharedTripViewCount(shareToken);

    // Get favorite details
    const favorite = await this.getFavoriteById(sharedTrip.favorite_id);
    if (!favorite) {
      return null;
    }

    return {
      ...sharedTrip,
      favorite,
    };
  }

  /**
   * Increment view count for a shared trip
   */
  private async incrementSharedTripViewCount(shareToken: string): Promise<void> {
    const query = `
      UPDATE shared_trips
      SET view_count = view_count + 1
      WHERE share_token = ?
    `;
    
    await mysqlPool.execute<ResultSetHeader>(query, [shareToken]);
  }

  /**
   * Get all shared trips for a user
   */
  async getSharedTripsByUserId(userId: string): Promise<SharedTrip[]> {
    const query = `
      SELECT * FROM shared_trips
      WHERE user_id = ?
      ORDER BY created_at DESC
    `;
    
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(query, [userId]);
    return rows as SharedTrip[];
  }
}

export const favoriteRepository = new FavoriteRepository();

