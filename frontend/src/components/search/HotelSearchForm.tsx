import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { listingApi } from '../../api/listingApi'
import './SearchForm.css'

export function HotelSearchForm() {
  const navigate = useNavigate()
  const { setSearchParams, setSearchResults, setLoading, setError } = useStore()
  const [formData, setFormData] = useState({
    city: '',
    checkIn: '',
    checkOut: '',
    guests: 1,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      setSearchParams(formData)
      const hotels = await listingApi.searchHotels(formData)
      setSearchResults({ flights: [], hotels, cars: [] })
      navigate('/results?type=hotel')
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to search hotels')
    } finally {
      setLoading(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  return (
    <form className="search-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label>City</label>
          <input
            type="text"
            placeholder="Enter city name"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Check-in</label>
          <input
            type="date"
            value={formData.checkIn}
            onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
            required
            min={today}
          />
        </div>
        <div className="form-group">
          <label>Check-out</label>
          <input
            type="date"
            value={formData.checkOut}
            onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
            required
            min={formData.checkIn || tomorrow}
          />
        </div>
        <div className="form-group">
          <label>Guests</label>
          <input
            type="number"
            min="1"
            max="10"
            value={formData.guests}
            onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) })}
            required
          />
        </div>
        <button type="submit" className="btn-primary search-button">
          Search Hotels
        </button>
      </div>
    </form>
  )
}

