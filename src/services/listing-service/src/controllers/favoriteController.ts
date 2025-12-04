import { Router, Request, Response } from 'express';
import { favoriteRepository } from '../repositories/favoriteRepository';

const router = Router();

/**
 * POST /api/listings/favorites
 * Save a new favorite
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { user_id, item_type, item_id, notes } = req.body;

    // Validation
    if (!user_id || !item_type || !item_id) {
      return res.status(400).json({
        error: 'Missing required fields: user_id, item_type, item_id',
      });
    }

    if (!['flight', 'hotel', 'car'].includes(item_type)) {
      return res.status(400).json({
        error: 'Invalid item_type. Must be flight, hotel, or car',
      });
    }

    // Check if already favorited
    const alreadyFavorited = await favoriteRepository.checkIfFavorited(user_id, item_type, item_id);
    if (alreadyFavorited) {
      return res.status(409).json({
        error: 'Item already favorited',
      });
    }

    const favorite = await favoriteRepository.saveFavorite({
      user_id,
      item_type,
      item_id,
      notes,
    });

    res.status(201).json({
      success: true,
      data: favorite,
    });
  } catch (error) {
    console.error('Error saving favorite:', error);
    res.status(500).json({
      error: 'Failed to save favorite',
    });
  }
});

/**
 * GET /api/listings/favorites
 * Get all favorites for a user
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { user_id } = req.query;

    if (!user_id || typeof user_id !== 'string') {
      return res.status(400).json({
        error: 'Missing or invalid user_id query parameter',
      });
    }

    const favorites = await favoriteRepository.getFavoritesByUserId(user_id);

    res.status(200).json({
      success: true,
      data: favorites,
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({
      error: 'Failed to fetch favorites',
    });
  }
});

/**
 * GET /api/listings/favorites/check/:type/:id
 * Check if an item is favorited
 */
router.get('/check/:type/:id', async (req: Request, res: Response) => {
  try {
    const { type, id } = req.params;
    const { user_id } = req.query;

    if (!user_id || typeof user_id !== 'string') {
      return res.status(400).json({
        error: 'Missing or invalid user_id query parameter',
      });
    }

    if (!['flight', 'hotel', 'car'].includes(type)) {
      return res.status(400).json({
        error: 'Invalid type. Must be flight, hotel, or car',
      });
    }

    const isFavorited = await favoriteRepository.checkIfFavorited(user_id, type, id);

    res.status(200).json({
      success: true,
      data: {
        is_favorited: isFavorited,
      },
    });
  } catch (error) {
    console.error('Error checking favorite status:', error);
    res.status(500).json({
      error: 'Failed to check favorite status',
    });
  }
});

/**
 * PUT /api/listings/favorites/:id/notes
 * Update notes for a favorite
 */
router.put('/:id/notes', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id, notes } = req.body;

    if (!user_id || notes === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: user_id, notes',
      });
    }

    const favoriteId = parseInt(id, 10);
    if (isNaN(favoriteId)) {
      return res.status(400).json({
        error: 'Invalid favorite ID',
      });
    }

    const updatedFavorite = await favoriteRepository.updateFavoriteNotes(favoriteId, user_id, notes);

    if (!updatedFavorite) {
      return res.status(404).json({
        error: 'Favorite not found or unauthorized',
      });
    }

    res.status(200).json({
      success: true,
      data: updatedFavorite,
    });
  } catch (error) {
    console.error('Error updating favorite notes:', error);
    res.status(500).json({
      error: 'Failed to update favorite notes',
    });
  }
});

/**
 * DELETE /api/listings/favorites/:id
 * Delete a favorite
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        error: 'Missing required field: user_id',
      });
    }

    const favoriteId = parseInt(id, 10);
    if (isNaN(favoriteId)) {
      return res.status(400).json({
        error: 'Invalid favorite ID',
      });
    }

    const deleted = await favoriteRepository.deleteFavorite(favoriteId, user_id);

    if (!deleted) {
      return res.status(404).json({
        error: 'Favorite not found or unauthorized',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Favorite deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting favorite:', error);
    res.status(500).json({
      error: 'Failed to delete favorite',
    });
  }
});

/**
 * POST /api/listings/favorites/:id/share
 * Create a shareable link for a favorite
 */
router.post('/:id/share', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id, expires_in_days } = req.body;

    if (!user_id) {
      return res.status(400).json({
        error: 'Missing required field: user_id',
      });
    }

    const favoriteId = parseInt(id, 10);
    if (isNaN(favoriteId)) {
      return res.status(400).json({
        error: 'Invalid favorite ID',
      });
    }

    const sharedTrip = await favoriteRepository.createSharedTrip(
      favoriteId,
      user_id,
      expires_in_days
    );

    if (!sharedTrip) {
      return res.status(404).json({
        error: 'Favorite not found or unauthorized',
      });
    }

    res.status(201).json({
      success: true,
      data: sharedTrip,
    });
  } catch (error) {
    console.error('Error creating shared trip:', error);
    res.status(500).json({
      error: 'Failed to create shared trip',
    });
  }
});

/**
 * GET /api/listings/shared/:token
 * Get shared trip by token (public endpoint)
 */
router.get('/shared/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const sharedTripWithDetails = await favoriteRepository.getSharedTripWithDetails(token);

    if (!sharedTripWithDetails) {
      return res.status(404).json({
        error: 'Shared trip not found or expired',
      });
    }

    res.status(200).json({
      success: true,
      data: sharedTripWithDetails,
    });
  } catch (error) {
    console.error('Error fetching shared trip:', error);
    res.status(500).json({
      error: 'Failed to fetch shared trip',
    });
  }
});

export default router;

