import { useRef, useState } from 'react';
import { User, Mail, Phone, MapPin, Camera, X, Shield } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'react-toastify';
import axios from 'axios';

export default function ProfileHeader() {
  const { user, updateUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  if (!user) return null;

  const profileImage = user.profileImageId 
    ? `/api/users/profile-image/${user.profileImageId}` 
    : null;

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('userId', user.userId);

      const response = await axios.post('/api/users/upload-profile-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { imageId, imageUrl } = response.data.data;
      setImagePreview(null);
      updateUser({ ...user, profileImageId: imageId });
      toast.success('Profile picture updated!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to upload image');
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!user.profileImageId) return;

    setUploadingImage(true);
    try {
      await axios.delete('/api/users/profile-image', {
        data: { userId: user.userId },
      });
      updateUser({ ...user, profileImageId: undefined });
      toast.success('Profile picture removed');
    } catch (error) {
      toast.error('Failed to remove image');
    } finally {
      setUploadingImage(false);
    }
  };

  const memberSince = user.createdAt 
    ? new Date(user.createdAt).getFullYear() 
    : new Date().getFullYear();

  return (
    <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Profile Image */}
        <div className="relative">
          <div
            onClick={handleImageClick}
            className="relative w-28 h-28 rounded-full overflow-hidden cursor-pointer group border-4 border-white/30 shadow-lg"
          >
            {imagePreview || profileImage ? (
              <img
                src={imagePreview || profileImage!}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-white/20 flex items-center justify-center">
                <User className="w-14 h-14 text-white/80" />
              </div>
            )}
            
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {uploadingImage ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="w-6 h-6 text-white" />
              )}
            </div>
          </div>

          {(profileImage || imagePreview) && !uploadingImage && (
            <button
              onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }}
              className="absolute -top-1 -right-1 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </div>

        {/* User Info */}
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl font-bold mb-1">
            {user.firstName} {user.lastName}
          </h1>
          
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-white/80 text-sm mt-3">
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              <span className="font-mono">{user.userId}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Mail className="w-4 h-4" />
              <span>{user.email}</span>
            </div>
            {user.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="w-4 h-4" />
                <span>{user.phone}</span>
              </div>
            )}
            {user.city && user.state && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span>{user.city}, {user.state}</span>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-2">
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
              Member since {memberSince}
            </span>
            {user.isAdmin && (
              <span className="px-3 py-1 bg-yellow-500/30 text-yellow-200 rounded-full text-xs font-medium">
                ⭐ Admin
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

