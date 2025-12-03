import { useState } from 'react';
import { X, Copy, Check, Facebook, Twitter, Mail } from 'lucide-react';
import { useFavoriteStore } from '../../store/favoriteStore';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'react-toastify';

interface ShareTripModalProps {
  favoriteId: number;
  onClose: () => void;
}

const ShareTripModal = ({ favoriteId, onClose }: ShareTripModalProps) => {
  const { user } = useAuthStore();
  const { shareTrip } = useFavoriteStore();
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateLink = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const url = await shareTrip(favoriteId, user.user_id, 30); // 30 days expiration
      setShareUrl(url);
      toast.success('Share link created!');
    } catch (error) {
      console.error('Error generating share link:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      '_blank'
    );
  };

  const handleShareTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent('Check out my trip!')}`,
      '_blank'
    );
  };

  const handleShareEmail = () => {
    window.location.href = `mailto:?subject=${encodeURIComponent('Check out my trip!')}&body=${encodeURIComponent(shareUrl)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="glass-strong rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Share Your Trip</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!shareUrl ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-6">
              Generate a shareable link to share your trip with friends and family!
            </p>
            <button
              onClick={handleGenerateLink}
              disabled={isLoading}
              className="btn-primary"
            >
              {isLoading ? 'Generating...' : 'Generate Share Link'}
            </button>
          </div>
        ) : (
          <div>
            {/* Share URL */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Share Link:
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                />
                <button
                  onClick={handleCopyLink}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                This link will expire in 30 days
              </p>
            </div>

            {/* Social Share Buttons */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Share via:</p>
              <div className="flex space-x-3">
                <button
                  onClick={handleShareFacebook}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Facebook className="w-5 h-5" />
                  <span>Facebook</span>
                </button>
                <button
                  onClick={handleShareTwitter}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
                >
                  <Twitter className="w-5 h-5" />
                  <span>Twitter</span>
                </button>
                <button
                  onClick={handleShareEmail}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Mail className="w-5 h-5" />
                  <span>Email</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareTripModal;

