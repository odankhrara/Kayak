import { useEffect, useState } from 'react';
import { Heart, Plane, Hotel, Car, Gavel } from 'lucide-react';
import { useFavoriteStore } from '../store/favoriteStore';
import { useAuthStore } from '../store/authStore';
import FavoriteCard from '../components/favorites/FavoriteCard';
import { MyBidsList } from '../components/bidding';
import { motion } from 'framer-motion';

const MyTrips = () => {
  const { user } = useAuthStore();
  const { favorites, loadFavorites, isLoading } = useFavoriteStore();
  const [activeTab, setActiveTab] = useState<'favorites' | 'offers'>('favorites');
  const [filter, setFilter] = useState<'all' | 'flight' | 'hotel' | 'car'>('all');

  useEffect(() => {
    if (user) {
      loadFavorites(user.userId);
    }
  }, [user]);

  const filteredFavorites = favorites.filter((fav) => {
    if (filter === 'all') return true;
    return fav.item_type === filter;
  });

  const getFilterCount = (type: 'all' | 'flight' | 'hotel' | 'car') => {
    if (type === 'all') return favorites.length;
    return favorites.filter((f) => f.item_type === type).length;
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <Heart className="w-12 h-12 text-red-500 fill-red-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            My Trips
          </h1>
          <p className="text-xl text-gray-600">
            Your saved trips and favorites all in one place
          </p>
        </motion.div>

        {/* Main Tabs: Favorites vs Offers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center gap-4 mb-6"
        >
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex items-center space-x-2 px-8 py-4 rounded-xl font-semibold text-lg transition-all ${
              activeTab === 'favorites'
                ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-lg'
                : 'glass text-gray-700 hover:bg-white/60'
            }`}
          >
            <Heart className="w-6 h-6" />
            <span>Saved Trips</span>
          </button>
          <button
            onClick={() => setActiveTab('offers')}
            className={`flex items-center space-x-2 px-8 py-4 rounded-xl font-semibold text-lg transition-all ${
              activeTab === 'offers'
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                : 'glass text-gray-700 hover:bg-white/60'
            }`}
          >
            <Gavel className="w-6 h-6" />
            <span>My Offers</span>
          </button>
        </motion.div>

        {activeTab === 'favorites' && (
          <>
            {/* Filter Tabs for Favorites */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-wrap justify-center gap-3 mb-8"
            >
              <button
                onClick={() => setFilter('all')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                  filter === 'all'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'glass text-gray-700 hover:bg-white/60'
                }`}
              >
                <Heart className="w-5 h-5" />
                <span>All ({getFilterCount('all')})</span>
              </button>
              <button
                onClick={() => setFilter('flight')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                  filter === 'flight'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'glass text-gray-700 hover:bg-white/60'
                }`}
              >
                <Plane className="w-5 h-5" />
                <span>Flights ({getFilterCount('flight')})</span>
              </button>
              <button
                onClick={() => setFilter('hotel')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                  filter === 'hotel'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'glass text-gray-700 hover:bg-white/60'
                }`}
              >
                <Hotel className="w-5 h-5" />
                <span>Hotels ({getFilterCount('hotel')})</span>
              </button>
              <button
                onClick={() => setFilter('car')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                  filter === 'car'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'glass text-gray-700 hover:bg-white/60'
                }`}
              >
                <Car className="w-5 h-5" />
                <span>Cars ({getFilterCount('car')})</span>
              </button>
            </motion.div>
          </>
        )}

        {/* Content */}
        {activeTab === 'favorites' ? (
          <>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-600">Loading your trips...</p>
              </div>
            ) : filteredFavorites.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="glass-strong rounded-2xl p-12 max-w-md mx-auto">
                  <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No trips saved yet
                  </h3>
                  <p className="text-gray-600">
                    Start exploring and click the heart icon to save your favorite trips!
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredFavorites.map((favorite, index) => (
                  <motion.div
                    key={favorite.favorite_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <FavoriteCard favorite={favorite} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto"
          >
            <MyBidsList />
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MyTrips;

