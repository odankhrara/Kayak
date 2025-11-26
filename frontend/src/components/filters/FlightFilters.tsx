import { useState } from 'react'
import './Filters.css'

interface FlightFiltersProps {
  onFilterChange: (filters: any) => void
}

export function FlightFilters({ onFilterChange }: FlightFiltersProps) {
  const [filters, setFilters] = useState({
    maxPrice: '',
    airline: '',
    minSeats: '',
  })

  const handleChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  return (
    <div className="filters">
      <h3>Filters</h3>
      <div className="filter-group">
        <label>Max Price</label>
        <input
          type="number"
          placeholder="Any"
          value={filters.maxPrice}
          onChange={(e) => handleChange('maxPrice', e.target.value)}
        />
      </div>
      <div className="filter-group">
        <label>Airline</label>
        <input
          type="text"
          placeholder="Any"
          value={filters.airline}
          onChange={(e) => handleChange('airline', e.target.value)}
        />
      </div>
      <div className="filter-group">
        <label>Min Seats Available</label>
        <input
          type="number"
          placeholder="Any"
          value={filters.minSeats}
          onChange={(e) => handleChange('minSeats', e.target.value)}
        />
      </div>
    </div>
  )
}

