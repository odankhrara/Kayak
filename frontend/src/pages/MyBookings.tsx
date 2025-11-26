import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { bookingService } from '../services/booking.service';
import { useAuthStore } from '../store/authStore';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Loading from '../components/common/Loading';
import { formatCurrency, formatDate } from '../utils/formatters';
import { BOOKING_STATUSES } from '../utils/constants';

const MyBookings = () => {
  const { user } = useAuthStore();
  const [filter, setFilter] = useState<'all' | 'past' | 'current' | 'future'>('all');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const { data: bookings, isLoading, refetch } = useQuery({
    queryKey: ['my-bookings', user?.userId, filter !== 'all' ? filter : undefined],
    queryFn: () => bookingService.getUserBookings(user!.userId, filter !== 'all' ? filter : undefined),
    enabled: !!user,
  });

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    setCancellingId(bookingId);
    try {
      const result = await bookingService.cancel(bookingId);
      toast.success(`Booking cancelled. Refund: ${formatCurrency(result.refundAmount)}`);
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to cancel booking');
    } finally {
      setCancellingId(null);
    }
  };

  if (isLoading) {
    return <Loading fullScreen message="Loading your bookings..." />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-display font-bold mb-8">My Bookings</h1>

        {/* Filter Tabs */}
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          {['all', 'current', 'future', 'past'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all ${
                filter === f
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'glass hover:bg-white/60 dark:hover:bg-slate-800/60'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {bookings && bookings.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-400" />
              <h3 className="text-xl font-bold mb-2">No bookings found</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                You haven't made any bookings yet
              </p>
              <Button onClick={() => window.location.href = '/'}>
                Start Booking
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings?.map((booking, index) => {
              const statusColor = BOOKING_STATUSES.find(s => s.value === booking.status)?.color || 'blue';
              const canCancel = booking.status === 'confirmed' || booking.status === 'pending';
              
              return (
                <motion.div
                  key={booking.bookingId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-xl font-bold">
                            Booking #{booking.bookingRef}
                          </h3>
                          <span className={`badge badge-${statusColor} capitalize`}>
                            {booking.status}
                          </span>
                          <span className="badge badge-primary capitalize">
                            {booking.bookingType}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-slate-500">Booking Date</p>
                            <p className="font-semibold">{formatDate(booking.bookingDate)}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Check-in</p>
                            <p className="font-semibold">{formatDate(booking.checkInDate)}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Check-out</p>
                            <p className="font-semibold">{formatDate(booking.checkOutDate)}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Total Amount</p>
                            <p className="text-lg font-bold text-blue-600">
                              {formatCurrency(booking.totalAmount)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {canCancel && (
                        <div>
                          <Button
                            variant="danger"
                            onClick={() => handleCancelBooking(booking.bookingId)}
                            isLoading={cancellingId === booking.bookingId}
                          >
                            <X className="w-5 h-5 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default MyBookings;

