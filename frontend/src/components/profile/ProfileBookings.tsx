import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Plane, Hotel, Car, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { format, isPast, isFuture, isToday } from 'date-fns'
import { bookingService } from '../../services/booking.service'
import { useAuthStore } from '../../store/authStore'
import { formatCurrency } from '../../utils/formatters'
import Card from '../common/Card'
import Button from '../common/Button'

type FilterType = 'all' | 'current' | 'future' | 'past'

const TYPE_ICONS = {
  flight: Plane,
  hotel: Hotel,
  car: Car
}

const STATUS_CONFIG = {
  confirmed: { color: 'text-green-500 bg-green-50 dark:bg-green-900/30', icon: CheckCircle },
  pending: { color: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/30', icon: Clock },
  cancelled: { color: 'text-red-500 bg-red-50 dark:bg-red-900/30', icon: XCircle },
  completed: { color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30', icon: CheckCircle }
}

export default function ProfileBookings() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [bookings, setBookings] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')

  useEffect(() => {
    if (user) loadBookings()
  }, [user, filter])

  const loadBookings = async () => {
    if (!user) return
    try {
      setIsLoading(true)
      const data = await bookingService.getUserBookings(
        user.userId, 
        filter !== 'all' ? filter : undefined
      )
      setBookings(data)
    } catch (error) {
      console.error('Failed to load bookings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate stats
  const stats = {
    total: bookings.length,
    totalSpent: bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0),
    byType: {
      flight: bookings.filter(b => b.bookingType === 'flight').length,
      hotel: bookings.filter(b => b.bookingType === 'hotel').length,
      car: bookings.filter(b => b.bookingType === 'car').length
    }
  }

  const getBookingPeriod = (booking: any) => {
    const checkIn = new Date(booking.checkInDate)
    const checkOut = new Date(booking.checkOutDate)
    const today = new Date()
    
    if (isPast(checkOut) && !isToday(checkOut)) return 'past'
    if (isFuture(checkIn) && !isToday(checkIn)) return 'future'
    return 'current'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{stats.total}</div>
          <div className="text-sm text-slate-500">Total Bookings</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-500">
            {formatCurrency(stats.totalSpent)}
          </div>
          <div className="text-sm text-slate-500">Total Spent</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-xl font-bold">
            <span className="text-blue-500">{stats.byType.flight}</span>
            <span className="text-purple-500">{stats.byType.hotel}</span>
            <span className="text-teal-500">{stats.byType.car}</span>
          </div>
          <div className="text-sm text-slate-500">By Type</div>
        </Card>
        <Card className="p-4 text-center">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/my-bookings')}
            className="w-full"
          >
            View All →
          </Button>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(['all', 'current', 'future', 'past'] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
          <Calendar className="w-12 h-12 mx-auto text-slate-400 mb-4" />
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
            No {filter !== 'all' ? filter : ''} bookings
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            {filter === 'all' 
              ? "You haven't made any bookings yet"
              : `No ${filter} bookings to show`}
          </p>
          <Button onClick={() => navigate('/')}>
            Start Booking
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.slice(0, 5).map((booking) => {
            const Icon = TYPE_ICONS[booking.bookingType as keyof typeof TYPE_ICONS]
            const statusConfig = STATUS_CONFIG[booking.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending
            const StatusIcon = statusConfig.icon
            const period = getBookingPeriod(booking)

            return (
              <Card 
                key={booking.bookingId} 
                className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/my-bookings?filter=${period}`)}
              >
                <div className="flex items-center gap-4">
                  {/* Type Icon */}
                  <div className={`p-3 rounded-xl ${
                    booking.bookingType === 'flight' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-500' :
                    booking.bookingType === 'hotel' ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-500' :
                    'bg-teal-50 dark:bg-teal-900/30 text-teal-500'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-900 dark:text-white truncate">
                        {booking.bookingRef || booking.bookingId}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                        {booking.status}
                      </span>
                    </div>
                    <div className="text-sm text-slate-500">
                      {format(new Date(booking.checkInDate), 'MMM d')} - {format(new Date(booking.checkOutDate), 'MMM d, yyyy')}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {formatCurrency(booking.totalAmount)}
                    </div>
                    <div className="text-xs text-slate-500 capitalize">
                      {period} trip
                    </div>
                  </div>
                </div>

                {/* Room breakdown for hotels */}
                {booking.bookingType === 'hotel' && booking.roomSelections && booking.roomSelections.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                    <div className="flex flex-wrap gap-1">
                      {booking.roomSelections.map((room: any, idx: number) => (
                        <span 
                          key={idx}
                          className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs"
                        >
                          {room.quantity}× {room.roomType}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )
          })}

          {bookings.length > 5 && (
            <div className="text-center pt-2">
              <Button variant="outline" onClick={() => navigate('/my-bookings')}>
                View All {bookings.length} Bookings
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

