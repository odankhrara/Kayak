import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useFavoriteStore } from '../../store/favoriteStore';
import { useAuthStore } from '../../store/authStore';
import { motion } from 'framer-motion';

interface FavoriteButtonProps {
  itemType: 'flight' | 'hotel' | 'car';
  itemId: string;
  className?: string;
}

const FavoriteButton = ({ itemType, itemId, className = '' }: FavoriteButtonProps) => {
  const { user } = useAuthStore();
  const { addFavorite, removeFavorite, favorites, checkIfFavorited } = useFavoriteStore();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      // Check if item is favorited
      const favorite = favorites.find(
        (f) => f.item_type === itemType && f.item_id === itemId
      );
      setIsFavorited(!!favorite);
    }
  }, [favorites, itemType, itemId, user]);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!user) {
      alert('Please log in to save favorites');
      return;
    }

    setIsLoading(true);
    try {
      if (isFavorited) {
        // Find the favorite and remove it
        const favorite = favorites.find(
          (f) => f.item_type === itemType && f.item_id === itemId
        );
        if (favorite) {
          await removeFavorite(favorite.favorite_id, user.userId);
          setIsFavorited(false);
        }
      } else {
        // Add to favorites
        await addFavorite(user.userId, itemType, itemId);
        setIsFavorited(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={isLoading}
      className={`relative p-2 rounded-full transition-all duration-300 ${
        isFavorited
          ? 'bg-red-50 hover:bg-red-100'
          : 'bg-white/50 hover:bg-white/80'
      } ${className}`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <Heart
        className={`w-5 h-5 transition-colors duration-300 ${
          isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600'
        }`}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </motion.button>
  );
};

export default FavoriteButton;

