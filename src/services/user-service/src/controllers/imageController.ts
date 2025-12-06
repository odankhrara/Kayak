import { Router, Request, Response } from 'express';
import multer from 'multer';
import { GridFSBucket, ObjectId } from 'mongodb';
import { getMongoClient } from '@kayak/common/src/db/mongoClient';
import { Readable } from 'stream';
import sharp from 'sharp';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'));
    }
    cb(null, true);
  },
});

/**
 * POST /api/users/upload-profile-image
 * Upload profile image
 */
router.post('/upload-profile-image', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Resize and optimize image
    const optimizedImage = await sharp(req.file.buffer)
      .resize(300, 300, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 90 })
      .toBuffer();

    // Connect to MongoDB
    const client = await getMongoClient();
    const db = client.db('kayak');
    const bucket = new GridFSBucket(db, {
      bucketName: 'profile_images',
    });

    // Delete old profile image if exists
    try {
      const usersCollection = db.collection('users');
      const user = await usersCollection.findOne({ user_id: userId });
      
      if (user && user.profile_image_id) {
        await bucket.delete(new ObjectId(user.profile_image_id));
      }
    } catch (error) {
      console.log('No old image to delete or error deleting:', error);
    }

    // Upload new image to GridFS
    const uploadStream = bucket.openUploadStream(`profile_${userId}_${Date.now()}.jpg`, {
      contentType: 'image/jpeg',
      metadata: {
        userId,
        uploadedAt: new Date(),
      },
    });

    const readableStream = Readable.from(optimizedImage);
    readableStream.pipe(uploadStream);

    await new Promise((resolve, reject) => {
      uploadStream.on('finish', resolve);
      uploadStream.on('error', reject);
    });

    const imageId = uploadStream.id.toString();

    // Update user profile_image_id in MongoDB users collection
    const usersCollection = db.collection('users');
    await usersCollection.updateOne(
      { user_id: userId },
      { 
        $set: { 
          profile_image_id: imageId,
          updated_at: new Date()
        } 
      },
      { upsert: true }
    );

    res.status(200).json({
      success: true,
      data: {
        imageId,
        imageUrl: `/api/users/profile-image/${imageId}`,
      },
    });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to upload image',
    });
  }
});

/**
 * GET /api/users/profile-image/:imageId
 * Retrieve profile image
 */
router.get('/profile-image/:imageId', async (req: Request, res: Response) => {
  try {
    const { imageId } = req.params;

    if (!ObjectId.isValid(imageId)) {
      return res.status(400).json({ error: 'Invalid image ID' });
    }

    const client = await getMongoClient();
    const db = client.db('kayak');
    const bucket = new GridFSBucket(db, {
      bucketName: 'profile_images',
    });

    const downloadStream = bucket.openDownloadStream(new ObjectId(imageId));

    // Set cache headers
    res.set('Content-Type', 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

    downloadStream.on('error', (error) => {
      console.error('Error downloading image:', error);
      res.status(404).json({ error: 'Image not found' });
    });

    downloadStream.pipe(res);
  } catch (error) {
    console.error('Error retrieving profile image:', error);
    res.status(500).json({
      error: 'Failed to retrieve image',
    });
  }
});

/**
 * DELETE /api/users/profile-image
 * Delete profile image
 */
router.delete('/profile-image', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const client = await getMongoClient();
    const db = client.db('kayak');
    const bucket = new GridFSBucket(db, {
      bucketName: 'profile_images',
    });

    // Get user's current image ID
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ user_id: userId });

    if (!user || !user.profile_image_id) {
      return res.status(404).json({ error: 'No profile image found' });
    }

    // Delete image from GridFS
    await bucket.delete(new ObjectId(user.profile_image_id));

    // Remove image ID from user profile
    await usersCollection.updateOne(
      { user_id: userId },
      { 
        $unset: { profile_image_id: '' },
        $set: { updated_at: new Date() }
      }
    );

    res.status(200).json({
      success: true,
      message: 'Profile image deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting profile image:', error);
    res.status(500).json({
      error: 'Failed to delete image',
    });
  }
});

export default router;

