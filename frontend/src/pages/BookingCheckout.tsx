import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { CreditCard, Lock, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Card from '../components/common/Card';
import { bookingService } from '../services/booking.service';
import { CreateBookingData } from '../types';
import { useAuthStore } from '../store/authStore';
import { formatCurrency, calculateNights } from '../utils/formatters';
import { validateCreditCard, validateCVV, validateCardExpiry } from '../utils/validators';
import { PAYMENT_METHODS } from '../utils/constants';

const BookingCheckout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const { bookingType, entity, quantity, checkInDate, checkOutDate } = location.state || {};

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<any>();

  if (!entity) {
    navigate('/');
    return null;
  }

  const paymentMethod = watch('paymentMethod', 'credit_card');

  // Calculate price
  const calculateTotal = () => {
    let basePrice = 0;
    if (bookingType === 'flight') {
      basePrice = entity.ticketPrice * quantity;
    } else if (bookingType === 'hotel') {
      const nights = calculateNights(checkInDate, checkOutDate);
      basePrice = (entity.rooms?.[0]?.pricePerNight || 0) * nights * quantity;
    } else if (bookingType === 'car') {
      const days = calculateNights(checkInDate, checkOutDate);
      basePrice = entity.dailyRentalPrice * days;
    }
    const tax = basePrice * 0.1;
    return { subtotal: basePrice, tax, total: basePrice + tax };
  };

  const { subtotal, tax, total } = calculateTotal();

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const bookingData: CreateBookingData = {
        bookingType,
        entityId: entity.flightId || entity.hotelId || entity.carId,
        quantity,
        checkInDate,
        checkOutDate,
        totalAmount: total,
        paymentMethod: data.paymentMethod,
        paymentDetails: {
          cardNumber: data.cardNumber,
          cvv: data.cvv,
          expiryDate: data.expiryDate,
          paypalEmail: data.paypalEmail,
        },
      };

      const result = await bookingService.create(bookingData);
      toast.success('Booking confirmed! 🎉');
      navigate(`/booking/confirmation/${result.booking.bookingId}`, {
        state: { booking: result.booking, billing: result.billing },
      });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Booking failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-display font-bold mb-8">Complete Your Booking</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <h3 className="font-display font-bold text-xl mb-4">Booking Summary</h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-slate-500">Type</p>
                  <p className="font-semibold capitalize">{bookingType}</p>
                </div>

                {bookingType === 'flight' && (
                  <>
                    <div>
                      <p className="text-sm text-slate-500">Flight</p>
                      <p className="font-semibold">{entity.airlineName} #{entity.flightId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Route</p>
                      <p className="font-semibold">{entity.departureAirport} → {entity.arrivalAirport}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Passengers</p>
                      <p className="font-semibold">{quantity}</p>
                    </div>
                  </>
                )}

                {bookingType === 'hotel' && (
                  <>
                    <div>
                      <p className="text-sm text-slate-500">Hotel</p>
                      <p className="font-semibold">{entity.hotelName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Location</p>
                      <p className="font-semibold">{entity.city}, {entity.state}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Rooms</p>
                      <p className="font-semibold">{quantity}</p>
                    </div>
                  </>
                )}

                {bookingType === 'car' && (
                  <>
                    <div>
                      <p className="text-sm text-slate-500">Car</p>
                      <p className="font-semibold">{entity.model} ({entity.year})</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Company</p>
                      <p className="font-semibold">{entity.companyName}</p>
                    </div>
                  </>
                )}

                <div>
                  <p className="text-sm text-slate-500">Dates</p>
                  <p className="font-semibold">{checkInDate} - {checkOutDate}</p>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
                  <span className="font-semibold">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Tax (10%)</span>
                  <span className="font-semibold">{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold pt-2 border-t">
                  <span>Total</span>
                  <span className="text-blue-600">{formatCurrency(total)}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Payment Form */}
          <div className="lg:col-span-2">
            <Card>
              <div className="flex items-center space-x-2 mb-6">
                <Lock className="w-5 h-5 text-green-600" />
                <h3 className="font-display font-bold text-xl">Secure Payment</h3>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Select
                  label="Payment Method"
                  options={PAYMENT_METHODS}
                  error={errors.paymentMethod?.message}
                  {...register('paymentMethod', { required: 'Payment method is required' })}
                />

                {(paymentMethod === 'credit_card' || paymentMethod === 'debit_card') && (
                  <>
                    <Input
                      label="Card Number"
                      placeholder="1234 5678 9012 3456"
                      icon={<CreditCard className="w-5 h-5" />}
                      error={errors.cardNumber?.message}
                      {...register('cardNumber', {
                        required: 'Card number is required',
                        validate: (value) => validateCreditCard(value) || 'Invalid card number',
                      })}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Expiry Date"
                        placeholder="MM/YY"
                        error={errors.expiryDate?.message}
                        {...register('expiryDate', {
                          required: 'Expiry date is required',
                          validate: (value) => validateCardExpiry(value) || 'Invalid or expired',
                        })}
                      />
                      <Input
                        label="CVV"
                        placeholder="123"
                        type="password"
                        maxLength={4}
                        error={errors.cvv?.message}
                        {...register('cvv', {
                          required: 'CVV is required',
                          validate: (value) => validateCVV(value) || 'Invalid CVV',
                        })}
                      />
                    </div>
                  </>
                )}

                {paymentMethod === 'paypal' && (
                  <Input
                    label="PayPal Email"
                    type="email"
                    placeholder="your@email.com"
                    error={errors.paypalEmail?.message}
                    {...register('paypalEmail', {
                      required: 'PayPal email is required',
                    })}
                  />
                )}

                <div className="glass rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold mb-1">Your payment is secure</p>
                      <p className="text-slate-600 dark:text-slate-400">
                        We use industry-standard encryption to protect your payment information.
                      </p>
                    </div>
                  </div>
                </div>

                <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
                  Complete Booking - {formatCurrency(total)}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BookingCheckout;

