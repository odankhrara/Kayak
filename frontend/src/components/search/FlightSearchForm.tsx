import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { listingApi } from '../../api/listingApi'
import './SearchForm.css'

export function FlightSearchForm() {
  const navigate = useNavigate()
  const { setSearchParams, setSearchResults, setLoading, setError } = useStore()
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    departureDate: '',
    returnDate: '',
    passengers: 1,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      setSearchParams(formData)
      const flights = await listingApi.searchFlights(formData)
      setSearchResults({ flights, hotels: [], cars: [] })
      navigate('/results?type=flight')
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to search flights')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="search-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label>From</label>
          <input
            type="text"
            placeholder="City or Airport"
            value={formData.origin}
            onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>To</label>
          <input
            type="text"
            placeholder="City or Airport"
            value={formData.destination}
            onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Departure</label>
          <input
            type="date"
            value={formData.departureDate}
            onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
            required
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
        <div className="form-group">
          <label>Return (Optional)</label>
          <input
            type="date"
            value={formData.returnDate}
            onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
            min={formData.departureDate || new Date().toISOString().split('T')[0]}
          />
        </div>
        <div className="form-group">
          <label>Passengers</label>
          <input
            type="number"
            min="1"
            max="9"
            value={formData.passengers}
            onChange={(e) => setFormData({ ...formData, passengers: parseInt(e.target.value) })}
            required
          />
        </div>
        <button type="submit" className="btn-primary search-button">
          Search Flights
        </button>
      </div>
    </form>
  )
}

