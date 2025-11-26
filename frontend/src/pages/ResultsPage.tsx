import { useSearchParams } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { FlightResultCard } from '../components/results/FlightResultCard'
import { HotelResultCard } from '../components/results/HotelResultCard'
import { CarResultCard } from '../components/results/CarResultCard'
import { FlightFilters } from '../components/filters/FlightFilters'
import { HotelFilters } from '../components/filters/HotelFilters'
import { CarFilters } from '../components/filters/CarFilters'
import './ResultsPage.css'

export default function ResultsPage() {
  const [searchParams] = useSearchParams()
  const type = searchParams.get('type') || 'flight'
  const { searchResults, loading } = useStore()

  const getResults = () => {
    switch (type) {
      case 'flight':
        return searchResults.flights
      case 'hotel':
        return searchResults.hotels
      case 'car':
        return searchResults.cars
      default:
        return []
    }
  }

  const results = getResults()

  return (
    <div className="results-page">
      <div className="results-header">
        <h2>
          {type === 'flight' && 'Flight Results'}
          {type === 'hotel' && 'Hotel Results'}
          {type === 'car' && 'Car Rental Results'}
        </h2>
        <p>{results.length} results found</p>
      </div>

      <div className="results-layout">
        <div className="results-filters">
          {type === 'flight' && <FlightFilters onFilterChange={() => {}} />}
          {type === 'hotel' && <HotelFilters onFilterChange={() => {}} />}
          {type === 'car' && <CarFilters onFilterChange={() => {}} />}
        </div>

        <div className="results-list">
          {loading && <div className="loading">Loading results...</div>}
          {!loading && results.length === 0 && (
            <div className="no-results">
              <p>No results found. Try adjusting your search criteria.</p>
            </div>
          )}
          {!loading && results.length > 0 && (
            <>
              {type === 'flight' && results.map((flight: any) => (
                <FlightResultCard key={flight.id} flight={flight} />
              ))}
              {type === 'hotel' && results.map((hotel: any) => (
                <HotelResultCard key={hotel.id} hotel={hotel} />
              ))}
              {type === 'car' && results.map((car: any) => (
                <CarResultCard key={car.id} car={car} />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

