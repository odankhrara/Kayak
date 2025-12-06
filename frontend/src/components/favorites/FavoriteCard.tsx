import { useState } from 'react';
import { Plane, Hotel, Car, Share2, Edit2, Trash2, Save, X } from 'lucide-react';
import { Favorite } from '../../services/favorite.service';
import { useFavoriteStore } from '../../store/favoriteStore';
import { useAuthStore } from '../../store/authStore';
import ShareTripModal from './ShareTripModal';

interface FavoriteCardProps {
  favorite: Favorite;
}

const FavoriteCard = ({ favorite }: FavoriteCardProps) => {
  const { user } = useAuthStore();
  const { removeFavorite, updateNotes } = useFavoriteStore();
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(favorite.notes || '');
  const [showShareModal, setShowShareModal] = useState(false);

  const getIcon = () => {
    switch (favorite.item_type) {
      case 'flight':
        return <Plane className="w-6 h-6 text-blue-600" />;
      case 'hotel':
        return <Hotel className="w-6 h-6 text-purple-600" />;
      case 'car':
        return <Car className="w-6 h-6 text-green-600" />;
    }
  };

  const getTypeLabel = () => {
    return favorite.item_type.charAt(0).toUpperCase() + favorite.item_type.slice(1);
  };

  const handleSaveNotes = async () => {
    if (!user) return;
    try {
      await updateNotes(favorite.favorite_id, user.userId, notes);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    if (window.confirm('Are you sure you want to remove this from your favorites?')) {
      try {
        await removeFavorite(favorite.favorite_id, user.userId);
      } catch (error) {
        console.error('Error deleting favorite:', error);
      }
    }
  };

  return (
    <>
      <div className="glass-strong rounded-2xl p-6 hover:shadow-xl transition-all duration-300">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50">
              {getIcon()}
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900">{getTypeLabel()}</h3>
              <p className="text-sm text-gray-500">ID: {favorite.item_id}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowShareModal(true)}
              className="p-2 rounded-lg hover:bg-blue-50 transition-colors"
              title="Share trip"
            >
              <Share2 className="w-5 h-5 text-blue-600" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 rounded-lg hover:bg-red-50 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-5 h-5 text-red-600" />
            </button>
          </div>
        </div>

        {/* Notes Section */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Notes:</label>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSaveNotes}
                  className="text-sm text-green-600 hover:text-green-700 flex items-center space-x-1"
                >
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setNotes(favorite.notes || '');
                  }}
                  className="text-sm text-gray-600 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          {isEditing ? (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Add notes about this trip..."
            />
          ) : (
            <p className="text-sm text-gray-600">
              {favorite.notes || 'No notes added yet'}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Saved on {new Date(favorite.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <ShareTripModal
          favoriteId={favorite.favorite_id}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </>
  );
};

export default FavoriteCard;

