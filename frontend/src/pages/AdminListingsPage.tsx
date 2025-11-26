import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { listingApi } from '../api/listingApi'
import type { Flight, Hotel, Car } from '../api/listingApi'
import './AdminListingsPage.css'

export default function AdminListingsPage() {
  const { user, setError, setStatusMessage, setLoading } = useStore()
  const [listings, setListings] = useState<{ flights: Flight[]; hotels: Hotel[]; cars: Car[] }>({
    flights: [],
    hotels: [],
    cars: [],
  })
  const [activeTab, setActiveTab] = useState<'flight' | 'hotel' | 'car'>('flight')

  useEffect(() => {
    if (user?.role === 'admin') {
      loadListings()
    }
  }, [user, activeTab])

  const loadListings = async () => {
    // In a real app, you'd have admin endpoints to get all listings
    // For now, this is a placeholder
    setLoading(true)
    try {
      // Placeholder - would need admin API endpoints
      setListings({ flights: [], hotels: [], cars: [] })
    } catch (error: any) {
      setError('Failed to load listings')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number, type: 'flight' | 'hotel' | 'car') => {
    if (!confirm('Are you sure you want to delete this listing?')) return

    setLoading(true)
    try {
      if (type === 'flight') {
        await listingApi.deleteFlight(id)
      } else if (type === 'hotel') {
        await listingApi.deleteHotel(id)
      } else {
        await listingApi.deleteCar(id)
      }
      setStatusMessage('Listing deleted successfully')
      loadListings()
    } catch (error: any) {
      setError('Failed to delete listing')
    } finally {
      setLoading(false)
    }
  }

  if (user?.role !== 'admin') {
    return <div className="loading">Access denied. Admin access required.</div>
  }

  return (
    <div className="admin-listings-page">
      <h2>Manage Listings</h2>
      
      <div className="listings-tabs">
        <button
          className={activeTab === 'flight' ? 'active' : ''}
          onClick={() => setActiveTab('flight')}
        >
          Flights
        </button>
        <button
          className={activeTab === 'hotel' ? 'active' : ''}
          onClick={() => setActiveTab('hotel')}
        >
          Hotels
        </button>
        <button
          className={activeTab === 'car' ? 'active' : ''}
          onClick={() => setActiveTab('car')}
        >
          Cars
        </button>
      </div>

      <div className="listings-table">
        {activeTab === 'flight' && (
          <table>
            <thead>
              <tr>
                <th>Airline</th>
                <th>Flight Number</th>
                <th>Route</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {listings.flights.map((flight) => (
                <tr key={flight.id}>
                  <td>{flight.airline}</td>
                  <td>{flight.flightNumber}</td>
                  <td>{flight.origin} → {flight.destination}</td>
                  <td>${flight.price.toFixed(2)}</td>
                  <td>
                    <button
                      onClick={() => handleDelete(flight.id!, 'flight')}
                      className="btn-danger"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'hotel' && (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Location</th>
                <th>Price/Night</th>
                <th>Rating</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {listings.hotels.map((hotel) => (
                <tr key={hotel.id}>
                  <td>{hotel.name}</td>
                  <td>{hotel.city}, {hotel.country}</td>
                  <td>${hotel.pricePerNight.toFixed(2)}</td>
                  <td>{hotel.rating ? '★'.repeat(Math.floor(hotel.rating)) : 'N/A'}</td>
                  <td>
                    <button
                      onClick={() => handleDelete(hotel.id!, 'hotel')}
                      className="btn-danger"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'car' && (
          <table>
            <thead>
              <tr>
                <th>Car</th>
                <th>Rental Company</th>
                <th>Location</th>
                <th>Price/Day</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {listings.cars.map((car) => (
                <tr key={car.id}>
                  <td>{car.year} {car.make} {car.model}</td>
                  <td>{car.rentalCompany}</td>
                  <td>{car.location}</td>
                  <td>${car.pricePerDay.toFixed(2)}</td>
                  <td>
                    <button
                      onClick={() => handleDelete(car.id!, 'car')}
                      className="btn-danger"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

