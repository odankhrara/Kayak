import { useState } from 'react'
import { FlightSearchForm } from '../components/search/FlightSearchForm'
import { HotelSearchForm } from '../components/search/HotelSearchForm'
import { CarSearchForm } from '../components/search/CarSearchForm'
import './SearchPage.css'

type SearchType = 'flight' | 'hotel' | 'car'

export default function SearchPage() {
  const [searchType, setSearchType] = useState<SearchType>('flight')

  return (
    <div className="search-page">
      <div className="search-page-header">
        <h1>Find Your Perfect Trip</h1>
        <div className="search-type-tabs">
          <button
            className={searchType === 'flight' ? 'active' : ''}
            onClick={() => setSearchType('flight')}
          >
            Flights
          </button>
          <button
            className={searchType === 'hotel' ? 'active' : ''}
            onClick={() => setSearchType('hotel')}
          >
            Hotels
          </button>
          <button
            className={searchType === 'car' ? 'active' : ''}
            onClick={() => setSearchType('car')}
          >
            Cars
          </button>
        </div>
      </div>

      <div className="search-form-container">
        {searchType === 'flight' && <FlightSearchForm />}
        {searchType === 'hotel' && <HotelSearchForm />}
        {searchType === 'car' && <CarSearchForm />}
      </div>
    </div>
  )
}

