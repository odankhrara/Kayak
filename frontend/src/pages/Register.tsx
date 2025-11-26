import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Phone, MapPin, CreditCard, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import { useAuthStore } from '../store/authStore';
import { RegisterData } from '../types';
import { validateSSN, validateEmail, validatePasswordStrength, validateZipCode, validateState } from '../utils/validators';
import { US_STATES } from '../utils/constants';

const Register = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { register: registerUser } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    trigger,
  } = useForm<RegisterData>();

  const password = watch('password');

  const onSubmit = async (data: RegisterData) => {
    setIsLoading(true);
    try {
      await registerUser(data);
      toast.success('Account created successfully! Welcome aboard! 🎉');
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    if (currentStep === 1) {
      fieldsToValidate = ['userId', 'firstName', 'lastName', 'email', 'password'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['phone', 'address', 'city', 'state', 'zipCode'];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const steps = [
    { number: 1, title: 'Account Details', icon: User },
    { number: 2, title: 'Personal Info', icon: MapPin },
    { number: 3, title: 'Review', icon: Check },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl relative z-10"
      >
        <div className="glass-strong rounded-3xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-display font-bold mb-2">Create Account</h2>
            <p className="text-slate-600 dark:text-slate-400">Join TravelVerse today</p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-between mb-8">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      currentStep >= step.number
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white scale-110'
                        : 'glass text-slate-400'
                    }`}
                  >
                    <step.icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs mt-2 font-medium">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 rounded transition-all ${
                      currentStep > step.number ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <AnimatePresence mode="wait">
              {/* Step 1: Account Details */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <Input
                    label="SSN (User ID)"
                    placeholder="123-45-6789"
                    icon={<CreditCard className="w-5 h-5" />}
                    error={errors.userId?.message}
                    {...register('userId', {
                      required: 'SSN is required',
                      validate: (value) => validateSSN(value) || 'Invalid SSN format (XXX-XX-XXXX)',
                    })}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="First Name"
                      placeholder="John"
                      error={errors.firstName?.message}
                      {...register('firstName', { required: 'First name is required' })}
                    />
                    <Input
                      label="Last Name"
                      placeholder="Doe"
                      error={errors.lastName?.message}
                      {...register('lastName', { required: 'Last name is required' })}
                    />
                  </div>
                  <Input
                    label="Email"
                    type="email"
                    placeholder="john@example.com"
                    icon={<Mail className="w-5 h-5" />}
                    error={errors.email?.message}
                    {...register('email', {
                      required: 'Email is required',
                      validate: (value) => validateEmail(value) || 'Invalid email format',
                    })}
                  />
                  <Input
                    label="Password"
                    type="password"
                    placeholder="Min 8 characters"
                    icon={<Lock className="w-5 h-5" />}
                    error={errors.password?.message}
                    {...register('password', {
                      required: 'Password is required',
                      validate: (value) => {
                        const result = validatePasswordStrength(value);
                        return result.isValid || result.feedback.join(', ');
                      },
                    })}
                  />
                  {password && (
                    <div className="text-xs space-y-1">
                      <div className="flex items-center space-x-2">
                        <div className={`h-1 flex-1 rounded ${validatePasswordStrength(password).strength === 'strong' ? 'bg-green-500' : validatePasswordStrength(password).strength === 'medium' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                        <span className="capitalize">{validatePasswordStrength(password).strength}</span>
                      </div>
                    </div>
                  )}
                  <Button type="button" onClick={nextStep} fullWidth>
                    Next <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </motion.div>
              )}

              {/* Step 2: Personal Info */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <Input
                    label="Phone Number"
                    placeholder="(123) 456-7890"
                    icon={<Phone className="w-5 h-5" />}
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
                      validate: (value) => !value || validateZipCode(value) || 'Invalid ZIP code (##### or #####-####)',
                    })}
                  />
                  <div className="flex space-x-4">
                    <Button type="button" onClick={prevStep} variant="secondary" fullWidth>
                      <ArrowLeft className="w-5 h-5 mr-2" /> Back
                    </Button>
                    <Button type="button" onClick={nextStep} fullWidth>
                      Review <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Review */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="glass rounded-2xl p-6 space-y-4">
                    <h3 className="font-display font-bold text-xl mb-4">Review Your Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500 dark:text-slate-400">Name</p>
                        <p className="font-medium">{watch('firstName')} {watch('lastName')}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-400">Email</p>
                        <p className="font-medium">{watch('email')}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-400">Phone</p>
                        <p className="font-medium">{watch('phone') || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-400">SSN</p>
                        <p className="font-medium">{watch('userId')}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-slate-500 dark:text-slate-400">Address</p>
                        <p className="font-medium">
                          {watch('address') && `${watch('address')}, `}
                          {watch('city') && `${watch('city')}, `}
                          {watch('state')} {watch('zipCode')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-4">
                    <Button type="button" onClick={prevStep} variant="secondary" fullWidth>
                      <ArrowLeft className="w-5 h-5 mr-2" /> Back
                    </Button>
                    <Button type="submit" fullWidth isLoading={isLoading}>
                      <Check className="w-5 h-5 mr-2" /> Create Account
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;

