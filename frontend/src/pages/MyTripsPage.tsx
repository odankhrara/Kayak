import { useEffect } from 'react'
import { useStore } from '../store/useStore'
import { bookingApi } from '../api/bookingApi'
import { format } from 'date-fns'
import './MyTripsPage.css'

export default function MyTripsPage() {
  const { user, userBookings, setUserBookings, setLoading, setError } = useStore()

  useEffect(() => {
    if (user?.id) {
      loadBookings()
    }
  }, [user])

  const loadBookings = async () => {
    if (!user?.id) return
    
    setLoading(true)
    try {
      const bookings = await bookingApi.getUserBookings(user.id)
      setUserBookings(bookings)
    } catch (error: any) {
      setError('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'status-confirmed'
      case 'pending':
        return 'status-pending'
      case 'cancelled':
        return 'status-cancelled'
      case 'completed':
        return 'status-completed'
      default:
        return ''
    }
  }

  if (!user) {
    return <div className="loading">Please log in to view your trips</div>
  }

  return (
    <div className="my-trips-page">
      <h2>My Trips</h2>
      
      {userBookings.length === 0 ? (
        <div className="no-trips">
          <p>You don't have any bookings yet.</p>
          <p>Start searching to book your next trip!</p>
        </div>
      ) : (
        <div className="trips-list">
          {userBookings.map((booking) => (
            <div key={booking.id} className="trip-card">
              <div className="trip-header">
                <h3>
                  {booking.listingType === 'flight' && '✈️ Flight'}
                  {booking.listingType === 'hotel' && '🏨 Hotel'}
                  {booking.listingType === 'car' && '🚗 Car Rental'}
                </h3>
                <span className={`status-badge ${getStatusColor(booking.status)}`}>
                  {booking.status}
                </span>
              </div>
              <div className="trip-details">
                <p><strong>Booking ID:</strong> #{booking.id}</p>
                <p><strong>Booking Date:</strong> {format(new Date(booking.bookingDate), 'MMM dd, yyyy')}</p>
                {booking.checkInDate && (
                  <p><strong>Check-in:</strong> {format(new Date(booking.checkInDate), 'MMM dd, yyyy')}</p>
                )}
                {booking.checkOutDate && (
                  <p><strong>Check-out:</strong> {format(new Date(booking.checkOutDate), 'MMM dd, yyyy')}</p>
                )}
                {booking.passengers && (
                  <p><strong>Passengers:</strong> {booking.passengers}</p>
                )}
                {booking.guests && (
                  <p><strong>Guests:</strong> {booking.guests}</p>
                )}
                <p><strong>Total Price:</strong> ${booking.totalPrice.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

