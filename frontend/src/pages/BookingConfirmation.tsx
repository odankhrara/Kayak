import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, Download, ArrowRight, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { formatCurrency, formatDate } from '../utils/formatters';

const BookingConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { bookingId } = useParams();
  const { booking, billing } = location.state || {};

  if (!booking) {
    navigate('/');
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-3xl mx-auto"
      >
        {/* Success Animation */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 mb-6 shadow-2xl"
          >
            <CheckCircle className="w-12 h-12 text-white" />
          </motion.div>
          <h1 className="text-4xl font-display font-bold mb-2">Booking Confirmed!</h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            Your trip is all set. Get ready for an amazing journey!
          </p>
        </div>

        {/* Booking Details */}
        <Card className="mb-6">
          <div className="border-b border-slate-200 dark:border-slate-700 pb-4 mb-4">
            <h2 className="font-display font-bold text-2xl">Booking Details</h2>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-slate-500 mb-1">Booking Reference</p>
              <p className="text-2xl font-mono font-bold text-blue-600">{booking.bookingRef}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Status</p>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 font-semibold">
                {booking.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Booking Type</p>
              <p className="font-semibold capitalize">{booking.bookingType}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Total Amount</p>
              <p className="text-xl font-bold">{formatCurrency(booking.totalAmount)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Check-in</p>
              <p className="font-semibold">{formatDate(booking.checkInDate)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Check-out</p>
              <p className="font-semibold">{formatDate(booking.checkOutDate)}</p>
            </div>
          </div>

          {billing && (
            <div className="glass rounded-xl p-4 mt-4">
              <h3 className="font-semibold mb-2">Payment Confirmation</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Payment Method</p>
                  <p className="font-medium capitalize">{billing.paymentMethod.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-slate-500">Transaction ID</p>
                  <p className="font-medium font-mono">{billing.receiptDetails?.transactionId}</p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="outline" fullWidth onClick={() => navigate('/my-bookings')}>
            <ArrowRight className="w-5 h-5 mr-2" />
            View My Bookings
          </Button>
          <Button variant="outline" fullWidth>
            <Download className="w-5 h-5 mr-2" />
            Download Receipt
          </Button>
          <Button fullWidth onClick={() => navigate('/')}>
            <Home className="w-5 h-5 mr-2" />
            Book Another Trip
          </Button>
        </div>

        {/* Email Confirmation Note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            📧 A confirmation email has been sent to your registered email address
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default BookingConfirmation;

