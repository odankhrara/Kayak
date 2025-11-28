import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, Download, ArrowRight, Home, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { formatCurrency, formatDate } from '../utils/formatters';
import { bookingService } from '../services/booking.service';
import { toast } from 'react-toastify';

const BookingConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { bookingId } = useParams();
  const [booking, setBooking] = useState<any>(location.state?.booking || null);
  const [billing, setBilling] = useState<any>(location.state?.billing || null);
  const [loading, setLoading] = useState(!location.state?.booking);

  useEffect(() => {
    // If booking data wasn't passed via state, fetch it from API
    if (!booking && bookingId) {
      const fetchBooking = async () => {
        try {
          const data = await bookingService.getById(bookingId);
          setBooking(data);
          setLoading(false);
        } catch (error: any) {
          console.error('Failed to fetch booking:', error);
          toast.error('Booking not found');
          navigate('/');
        }
      };
      fetchBooking();
    }
  }, [bookingId, booking, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!booking) {
    return null;
  }

  const handleDownloadReceipt = () => {
    try {
      // Generate receipt content
      const receiptContent = `
===========================================
           BOOKING CONFIRMATION
===========================================

Booking Reference: ${booking.confirmationCode || booking.bookingId}
Status: ${booking.status?.toUpperCase()}
Booking Type: ${booking.bookingType?.toUpperCase()}

-------------------------------------------
CUSTOMER INFORMATION
-------------------------------------------
${booking.listingName || 'N/A'}
${booking.listingLocation || ''}

-------------------------------------------
TRAVEL DETAILS
-------------------------------------------
Travel Date: ${formatDate(booking.startDate)}
${booking.endDate ? `Return Date: ${formatDate(booking.endDate)}` : ''}
${booking.guests ? `Guests/Passengers: ${booking.guests}` : ''}

-------------------------------------------
PAYMENT SUMMARY
-------------------------------------------
Total Amount: ${formatCurrency(booking.totalAmount)}

${billing ? `
-------------------------------------------
PAYMENT CONFIRMATION
-------------------------------------------
Payment Method: ${billing.paymentMethod?.replace('_', ' ').toUpperCase()}
Transaction ID: ${billing.transactionId}
Transaction Status: ${billing.transactionStatus?.toUpperCase()}
Amount Paid: ${formatCurrency(billing.totalAmount)}
` : ''}

-------------------------------------------
BOOKING DATE
-------------------------------------------
${booking.createdAt ? new Date(booking.createdAt).toLocaleString() : 'N/A'}

===========================================
      Thank you for booking with us!
===========================================

For assistance, please contact support.
      `.trim();

      // Create blob and download
      const blob = new Blob([receiptContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${booking.confirmationCode || booking.bookingId}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Receipt downloaded successfully!');
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast.error('Failed to download receipt');
    }
  };

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
              <p className="text-2xl font-mono font-bold text-blue-600">{booking.confirmationCode || booking.bookingId}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Status</p>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 font-semibold uppercase">
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
            {booking.listingName && (
              <div className="col-span-2">
                <p className="text-sm text-slate-500 mb-1">Booking Details</p>
                <p className="font-semibold">{booking.listingName}</p>
                {booking.listingLocation && <p className="text-sm text-slate-600">{booking.listingLocation}</p>}
              </div>
            )}
            <div>
              <p className="text-sm text-slate-500 mb-1">Travel Date</p>
              <p className="font-semibold">{formatDate(booking.startDate)}</p>
            </div>
            {booking.endDate && (
              <div>
                <p className="text-sm text-slate-500 mb-1">Return Date</p>
                <p className="font-semibold">{formatDate(booking.endDate)}</p>
              </div>
            )}
            {booking.guests && (
              <div>
                <p className="text-sm text-slate-500 mb-1">Guests/Passengers</p>
                <p className="font-semibold">{booking.guests}</p>
              </div>
            )}
          </div>

          {billing && (
            <div className="glass rounded-xl p-4 mt-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
              <h3 className="font-semibold mb-3 flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                Payment Confirmed
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Payment Method</p>
                  <p className="font-medium capitalize">{billing.paymentMethod?.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-slate-500">Transaction ID</p>
                  <p className="font-medium font-mono text-xs">{billing.transactionId}</p>
                </div>
                <div>
                  <p className="text-slate-500">Amount Paid</p>
                  <p className="font-bold text-green-600">{formatCurrency(billing.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Transaction Status</p>
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 font-semibold uppercase">
                    {billing.transactionStatus}
                  </span>
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
          <Button variant="outline" fullWidth onClick={handleDownloadReceipt}>
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

