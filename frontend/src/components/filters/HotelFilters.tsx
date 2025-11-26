import { useState } from 'react'
import './Filters.css'

interface HotelFiltersProps {
  onFilterChange: (filters: any) => void
}

export function HotelFilters({ onFilterChange }: HotelFiltersProps) {
  const [filters, setFilters] = useState({
    maxPrice: '',
    minRating: '',
    amenities: [] as string[],
  })

  const handleChange = (key: string, value: string | string[]) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const toggleAmenity = (amenity: string) => {
    const newAmenities = filters.amenities.includes(amenity)
      ? filters.amenities.filter(a => a !== amenity)
      : [...filters.amenities, amenity]
    handleChange('amenities', newAmenities)
  }

  return (
    <div className="filters">
      <h3>Filters</h3>
      <div className="filter-group">
        <label>Max Price per Night</label>
        <input
          type="number"
          placeholder="Any"
          value={filters.maxPrice}
          onChange={(e) => handleChange('maxPrice', e.target.value)}
        />
      </div>
      <div className="filter-group">
        <label>Min Rating</label>
        <select
          value={filters.minRating}
          onChange={(e) => handleChange('minRating', e.target.value)}
        >
          <option value="">Any</option>
          <option value="1">1+ Stars</option>
          <option value="2">2+ Stars</option>
          <option value="3">3+ Stars</option>
          <option value="4">4+ Stars</option>
          <option value="5">5 Stars</option>
        </select>
      </div>
      <div className="filter-group">
        <label>Amenities</label>
        <div className="checkbox-group">
          {['WiFi', 'Pool', 'Gym', 'Parking', 'Breakfast'].map(amenity => (
            <label key={amenity} className="checkbox-label">
              <input
                type="checkbox"
                checked={filters.amenities.includes(amenity)}
                onChange={() => toggleAmenity(amenity)}
              />
              {amenity}
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

