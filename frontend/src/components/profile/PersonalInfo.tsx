import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { Mail, Phone, Save, Loader2 } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { authService } from '../../services/auth.service'
import Button from '../common/Button'
import Input from '../common/Input'
import Select from '../common/Select'
import Card from '../common/Card'
import { US_STATES } from '../../utils/constants'
import { validateEmail, validateZipCode, validateState, validatePhoneNumber } from '../../utils/validators'

export default function PersonalInfo() {
  const { user, updateUser } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
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
  })

  const onSubmit = async (data: any) => {
    if (!user) return

    setIsLoading(true)
    try {
      const updatedUser = await authService.updateProfile(user.userId, data)
      updateUser(updatedUser)
      toast.success('Profile updated successfully!')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      {/* User ID Display (Read-only) */}
      <Card className="p-4 bg-slate-50 dark:bg-slate-800/50">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-slate-500 dark:text-slate-400">User ID (SSN)</span>
            <p className="font-mono text-lg font-semibold text-slate-900 dark:text-white">
              {user.userId}
            </p>
          </div>
          <div className="text-xs text-slate-500 px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded-full">
            Read-only
          </div>
        </div>
      </Card>

      {/* Edit Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          label="Phone Number"
          icon={<Phone className="w-5 h-5" />}
          placeholder="555-123-4567"
          error={errors.phone?.message}
          {...register('phone', {
            validate: (value) => 
              !value || validatePhoneNumber(value) || 'Invalid phone format (e.g., 555-123-4567)',
          })}
        />

        <Input
          label="Address"
          placeholder="123 Main Street"
          error={errors.address?.message}
          {...register('address')}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <Input
            label="ZIP Code"
            placeholder="94102"
            error={errors.zipCode?.message}
            {...register('zipCode', {
              validate: (value) => !value || validateZipCode(value) || 'Invalid ZIP',
            })}
          />
        </div>

        <div className="pt-4">
          <Button 
            type="submit" 
            size="lg" 
            disabled={isLoading || !isDirty}
            className="w-full md:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Save Changes
              </>
            )}
          </Button>
          {!isDirty && (
            <p className="text-sm text-slate-500 mt-2">
              Make changes to enable the save button
            </p>
          )}
        </div>
      </form>
    </div>
  )
}

