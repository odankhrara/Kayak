import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { listingApi } from '../../api/listingApi'
import './SearchForm.css'

export function CarSearchForm() {
  const navigate = useNavigate()
  const { setSearchParams, setSearchResults, setLoading, setError } = useStore()
  const [formData, setFormData] = useState({
    pickupLocation: '',
    pickupDate: '',
    returnDate: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      setSearchParams(formData)
      const cars = await listingApi.searchCars(formData)
      setSearchResults({ flights: [], hotels: [], cars })
      navigate('/results?type=car')
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to search cars')
    } finally {
      setLoading(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <form className="search-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label>Pickup Location</label>
          <input
            type="text"
            placeholder="City or Airport"
            value={formData.pickupLocation}
            onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Pickup Date</label>
          <input
            type="date"
            value={formData.pickupDate}
            onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })}
            required
            min={today}
          />
        </div>
        <div className="form-group">
          <label>Return Date</label>
          <input
            type="date"
            value={formData.returnDate}
            onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
            required
            min={formData.pickupDate || today}
          />
        </div>
        <button type="submit" className="btn-primary search-button">
          Search Cars
        </button>
      </div>
    </form>
  )
}

