import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import type { Flight } from '../../api/listingApi'
import { format } from 'date-fns'
import './ResultCard.css'

interface FlightResultCardProps {
  flight: Flight
}

export function FlightResultCard({ flight }: FlightResultCardProps) {
  const navigate = useNavigate()
  const { setSelectedListing } = useStore()

  const handleSelect = () => {
    setSelectedListing(flight)
    navigate('/booking?type=flight')
  }

  return (
    <div className="result-card">
      <div className="result-card-header">
        <h3>{flight.airline} {flight.flightNumber}</h3>
        <div className="result-price">${flight.price.toFixed(2)}</div>
      </div>
      <div className="result-card-body">
        <div className="result-route">
          <div className="route-segment">
            <div className="route-time">{format(new Date(flight.departureTime), 'HH:mm')}</div>
            <div className="route-location">{flight.origin}</div>
          </div>
          <div className="route-arrow">→</div>
          <div className="route-segment">
            <div className="route-time">{format(new Date(flight.arrivalTime), 'HH:mm')}</div>
            <div className="route-location">{flight.destination}</div>
          </div>
        </div>
        <div className="result-details">
          <span>Seats: {flight.availableSeats}</span>
          {flight.aircraftType && <span>Aircraft: {flight.aircraftType}</span>}
        </div>
      </div>
      <div className="result-card-footer">
        <button onClick={handleSelect} className="btn-primary">
          Select Flight
        </button>
      </div>
    </div>
  )
}

