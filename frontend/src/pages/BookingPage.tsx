import { useSearchParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { bookingApi } from '../api/bookingApi'
import type { Flight, Hotel, Car } from '../api/listingApi'
import './BookingPage.css'

export default function BookingPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const type = searchParams.get('type') || 'flight'
  const { selectedListing, user, setCurrentBooking, setError, setStatusMessage, setLoading } = useStore()
  const [passengers, setPassengers] = useState(1)
  const [guests, setGuests] = useState(1)

  useEffect(() => {
    if (!selectedListing || !user) {
      navigate('/search')
    }
  }, [selectedListing, user, navigate])

  if (!selectedListing || !user) {
    return <div className="loading">Redirecting...</div>
  }

  const handleBooking = async () => {
    if (!selectedListing || !user) return

    setLoading(true)
    setError(null)

    try {
      const bookingData = {
        userId: user.id!,
        listingType: type as 'flight' | 'hotel' | 'car',
        listingId: selectedListing.id!,
        totalPrice: calculateTotalPrice(),
        status: 'pending' as const,
        ...(type === 'flight' && { passengers }),
        ...(type === 'hotel' && { guests }),
      }

      const booking = await bookingApi.createBooking(bookingData)
      setCurrentBooking(booking)
      setStatusMessage('Booking created successfully!')
      navigate('/payments')
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create booking')
    } finally {
      setLoading(false)
    }
  }

  const calculateTotalPrice = (): number => {
    if (type === 'flight') {
      return (selectedListing as Flight).price * passengers
    } else if (type === 'hotel') {
      const hotel = selectedListing as Hotel
      const nights = 1 // Calculate from check-in/check-out dates
      return hotel.pricePerNight * nights * guests
    } else {
      const car = selectedListing as Car
      const days = 1 // Calculate from pickup/return dates
      return car.pricePerDay * days
    }
  }

  return (
    <div className="booking-page">
      <h2>Complete Your Booking</h2>
      
      <div className="booking-details">
        <div className="booking-summary">
          <h3>Booking Summary</h3>
          {type === 'flight' && (
            <div>
              <p><strong>Flight:</strong> {(selectedListing as Flight).airline} {(selectedListing as Flight).flightNumber}</p>
              <p><strong>Route:</strong> {(selectedListing as Flight).origin} → {(selectedListing as Flight).destination}</p>
              <p><strong>Price per passenger:</strong> ${(selectedListing as Flight).price.toFixed(2)}</p>
            </div>
          )}
          {type === 'hotel' && (
            <div>
              <p><strong>Hotel:</strong> {(selectedListing as Hotel).name}</p>
              <p><strong>Location:</strong> {(selectedListing as Hotel).city}, {(selectedListing as Hotel).country}</p>
              <p><strong>Price per night:</strong> ${(selectedListing as Hotel).pricePerNight.toFixed(2)}</p>
            </div>
          )}
          {type === 'car' && (
            <div>
              <p><strong>Car:</strong> {(selectedListing as Car).year} {(selectedListing as Car).make} {(selectedListing as Car).model}</p>
              <p><strong>Rental Company:</strong> {(selectedListing as Car).rentalCompany}</p>
              <p><strong>Price per day:</strong> ${(selectedListing as Car).pricePerDay.toFixed(2)}</p>
            </div>
          )}
        </div>

        <div className="booking-form">
          <h3>Booking Details</h3>
          {type === 'flight' && (
            <div className="form-group">
              <label>Number of Passengers</label>
              <input
                type="number"
                min="1"
                max="9"
                value={passengers}
                onChange={(e) => setPassengers(parseInt(e.target.value))}
              />
            </div>
          )}
          {type === 'hotel' && (
            <div className="form-group">
              <label>Number of Guests</label>
              <input
                type="number"
                min="1"
                max="10"
                value={guests}
                onChange={(e) => setGuests(parseInt(e.target.value))}
              />
            </div>
          )}
          
          <div className="booking-total">
            <h3>Total: ${calculateTotalPrice().toFixed(2)}</h3>
          </div>

          <button onClick={handleBooking} className="btn-primary btn-large">
            Continue to Payment
          </button>
        </div>
      </div>
    </div>
  )
}

