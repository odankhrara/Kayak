import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { User, Mail, Phone, MapPin, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/auth.service';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Card from '../components/common/Card';
import { US_STATES } from '../utils/constants';
import { validateEmail, validateZipCode, validateState } from '../utils/validators';

const Profile = () => {
  const { user, updateUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

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
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
                  <User className="w-12 h-12 text-white" />
                </div>
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
                  {...register('phone')}
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

