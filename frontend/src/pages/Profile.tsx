import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { User, Mail, Phone, MapPin, Save, Camera, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/auth.service';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Card from '../components/common/Card';
import { US_STATES } from '../utils/constants';
import { validateEmail, validateZipCode, validateState, validatePhoneNumber } from '../utils/validators';
import axios from 'axios';

const Profile = () => {
  const { user, updateUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(
    user?.profileImageId ? `/api/users/profile-image/${user.profileImageId}` : null
  );
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
      city: user?.city || '',
      state: user?.state || '',
      zipCode: user?.zipCode || '',
    },
  });

  const onSubmit = async (data: any) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const updatedUser = await authService.updateProfile(user.userId, data);
      updateUser(updatedUser);
      toast.success('Profile updated successfully! ✨');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload image
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('userId', user!.userId);

      const response = await axios.post(
        '/api/users/upload-profile-image',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const { imageId, imageUrl } = response.data.data;
      setProfileImage(imageUrl);
      setImagePreview(null);
      
      // Update user in store
      updateUser({
        ...user!,
        profileImageId: imageId,
      });

      toast.success('Profile picture updated! ✨');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.response?.data?.error || 'Failed to upload image');
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!user?.profileImageId) return;

    setUploadingImage(true);
    try {
      await axios.delete('/api/users/profile-image', {
        data: { userId: user.userId },
      });

      setProfileImage(null);
      setImagePreview(null);
      
      // Update user in store
      updateUser({
        ...user,
        profileImageId: undefined,
      });

      toast.success('Profile picture removed');
    } catch (error: any) {
      console.error('Error removing image:', error);
      toast.error('Failed to remove image');
    } finally {
      setUploadingImage(false);
    }
  };

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-3xl font-display font-bold mb-8">My Profile</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card>
              <div className="text-center">
                {/* Profile Image */}
                <div className="relative inline-block mb-4">
                  <div
                    onClick={handleImageClick}
                    className="relative w-24 h-24 rounded-full overflow-hidden cursor-pointer group"
                  >
                    {imagePreview || profileImage ? (
                      <img
                        src={imagePreview || profileImage!}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                        <User className="w-12 h-12 text-white" />
                      </div>
                    )}
                    
                    {/* Upload Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      {uploadingImage ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Camera className="w-6 h-6 text-white" />
                      )}
                    </div>
                  </div>

                  {/* Remove Button */}
                  {(profileImage || imagePreview) && !uploadingImage && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage();
                      }}
                      className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                      title="Remove picture"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}

                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>

                <p className="text-xs text-gray-500 mb-4">
                  Click to upload photo (max 5MB)
                </p>

                <h2 className="text-2xl font-bold mb-1">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-4">{user.email}</p>
                <div className="badge badge-primary">
                  Member since {new Date(user.createdAt || '').getFullYear()}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                    <Mail className="w-4 h-4" />
                    <span>{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                      <Phone className="w-4 h-4" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  {user.city && user.state && (
                    <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                      <MapPin className="w-4 h-4" />
                      <span>{user.city}, {user.state}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Edit Form */}
          <div className="lg:col-span-2">
            <Card>
              <h3 className="font-display font-bold text-xl mb-6">Edit Profile</h3>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    error={errors.firstName?.message}
                    {...register('firstName', { required: 'First name is required' })}
                  />
                  <Input
                    label="Last Name"
                    error={errors.lastName?.message}
                    {...register('lastName', { required: 'Last name is required' })}
                  />
                </div>

                <Input
                  label="Email"
                  type="email"
                  icon={<Mail className="w-5 h-5" />}
                  error={errors.email?.message}
                  {...register('email', {
                    required: 'Email is required',
                    validate: (value) => validateEmail(value) || 'Invalid email',
                  })}
                />

                <Input
                  label="Phone"
                  icon={<Phone className="w-5 h-5" />}
                  placeholder="(123) 456-7890"
                  error={errors.phone?.message}
                  {...register('phone', {
                    validate: (value) => !value || validatePhoneNumber(value) || 'Invalid phone number format (e.g., 555-123-4567)',
                  })}
                />

                <Input
                  label="Address"
                  placeholder="123 Main Street"
                  error={errors.address?.message}
                  {...register('address')}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="City"
                    placeholder="San Francisco"
                    error={errors.city?.message}
                    {...register('city')}
                  />
                  <Select
                    label="State"
                    placeholder="Select state"
                    options={US_STATES}
                    error={errors.state?.message}
                    {...register('state', {
                      validate: (value) => !value || validateState(value) || 'Invalid state',
                    })}
                  />
                </div>

                <Input
                  label="ZIP Code"
                  placeholder="94102"
                  error={errors.zipCode?.message}
                  {...register('zipCode', {
                    validate: (value) => !value || validateZipCode(value) || 'Invalid ZIP',
                  })}
                />

                <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
                  <Save className="w-5 h-5 mr-2" />
                  Save Changes
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;

