import { useState } from 'react'
import './Filters.css'

interface CarFiltersProps {
  onFilterChange: (filters: any) => void
}

export function CarFilters({ onFilterChange }: CarFiltersProps) {
  const [filters, setFilters] = useState({
    maxPrice: '',
    make: '',
    minYear: '',
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
        <label>Max Price per Day</label>
        <input
          type="number"
          placeholder="Any"
          value={filters.maxPrice}
          onChange={(e) => handleChange('maxPrice', e.target.value)}
        />
      </div>
      <div className="filter-group">
        <label>Make</label>
        <input
          type="text"
          placeholder="Any"
          value={filters.make}
          onChange={(e) => handleChange('make', e.target.value)}
        />
      </div>
      <div className="filter-group">
        <label>Min Year</label>
        <input
          type="number"
          placeholder="Any"
          min="2000"
          max={new Date().getFullYear()}
          value={filters.minYear}
          onChange={(e) => handleChange('minYear', e.target.value)}
        />
      </div>
    </div>
  )
}

