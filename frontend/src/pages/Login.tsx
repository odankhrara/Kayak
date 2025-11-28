import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Plane } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useAuthStore } from '../store/authStore';
import { LoginData } from '../types';
import { validateEmail } from '../utils/validators';

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>();

  const onSubmit = async (data: LoginData) => {
    setIsLoading(true);
    try {
      await login(data);
      toast.success('Welcome back!');
      
      // Check if user was trying to book something before login
      const state = location.state as any;
      if (state?.from === '/booking/checkout' && state?.bookingData) {
        // Restore booking flow
        navigate('/booking/checkout', { state: state.bookingData });
      } else {
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      {/* Background animations */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-strong rounded-3xl p-8 shadow-2xl">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
              <Plane className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-display font-bold mb-2">Welcome Back</h2>
            <p className="text-slate-600 dark:text-slate-400">
              Login to continue your journey
            </p>
            
            {/* Show message if user was trying to book */}
            {location.state?.bookingData && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  🔒 Please login to complete your booking
                </p>
              </div>
            )}
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="Email"
              type="email"
              placeholder="Enter your email"
              icon={<Mail className="w-5 h-5" />}
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                validate: (value) =>
                  validateEmail(value) || 'Invalid email format',
              })}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              icon={<Lock className="w-5 h-5" />}
              error={errors.password?.message}
              {...register('password', {
                required: 'Password is required',
              })}
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Remember me
                </span>
              </label>
              <a
                href="#"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Forgot password?
              </a>
            </div>

            <Button type="submit" fullWidth isLoading={isLoading}>
              Login
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300 dark:border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 glass-strong text-slate-600 dark:text-slate-400">
                Don't have an account?
              </span>
            </div>
          </div>

          {/* Register Link */}
          <Link to="/register">
            <Button variant="outline" fullWidth>
              Create Account
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;

