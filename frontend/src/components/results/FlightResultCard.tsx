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

  // === COMPREHENSIVE DEBUG LOGGING ===
  console.log('==========================================')
  console.log('FlightResultCard received full object:', flight)
  console.log('==========================================')
  
  const rawPricePerTicket = flight.pricePerTicket
  const rawPrice = flight.price
  
  console.log('RAW pricePerTicket:', rawPricePerTicket, 'typeof:', typeof rawPricePerTicket)
  console.log('RAW price:', rawPrice, 'typeof:', typeof rawPrice)
  
  // Try different parsing methods
  const priceWithNumber = Number(rawPricePerTicket || rawPrice || 0)
  const priceWithParseFloat = parseFloat(String(rawPricePerTicket || rawPrice || 0))
  
  console.log('Number():', priceWithNumber, 'isNaN:', isNaN(priceWithNumber))
  console.log('parseFloat():', priceWithParseFloat, 'isNaN:', isNaN(priceWithParseFloat))
  
  // Use the parsed price
  let price = priceWithNumber
  
  // Fallback if NaN
  if (!price || isNaN(price)) {
    console.error('❌ PRICE IS NaN! Using fallback: 0')
    price = 0
  } else {
    console.log('✅ FINAL PRICE:', price)
  }

  const handleSelect = () => {
    setSelectedListing(flight)
    navigate('/booking?type=flight')
  }

  // Handle other fields
  const airline = flight.airlineName || flight.airline || 'Unknown Airline'
  const origin = flight.departureAirport || flight.origin || ''
  const destination = flight.arrivalAirport || flight.destination || ''
  const departureTime = flight.departureDatetime || flight.departureTime || new Date().toISOString()
  const arrivalTime = flight.arrivalDatetime || flight.arrivalTime || new Date().toISOString()
  const flightNumber = flight.flightNumber || ''
  
  console.log('Display price will be:', isNaN(price) ? 'loading...' : `$${price.toFixed(2)}`)

  return (
    <div className="result-card">
      <div className="result-card-header">
        <h3>{airline} {flightNumber}</h3>
        <div className="result-price">
          {!price || isNaN(price) ? '...loading' : `$${price.toFixed(2)}`}
          <span className="price-label"> per person</span>
        </div>
      </div>
      <div className="result-card-body">
        <div className="result-route">
          <div className="route-segment">
            <div className="route-time">{format(new Date(departureTime), 'HH:mm a')}</div>
            <div className="route-location">{origin}</div>
          </div>
          <div className="route-arrow">
            <span>✈</span>
            {flight.durationMinutes && (
              <span className="duration">{Math.floor(flight.durationMinutes / 60)}h {flight.durationMinutes % 60}m</span>
            )}
          </div>
          <div className="route-segment">
            <div className="route-time">{format(new Date(arrivalTime), 'HH:mm a')}</div>
            <div className="route-location">{destination}</div>
          </div>
        </div>
        <div className="result-details">
          {flight.flightClass && <span className="class-badge">{flight.flightClass}</span>}
          <span>{flight.availableSeats || 0} seats available</span>
          {flight.aircraftType && <span>Aircraft: {flight.aircraftType}</span>}
        </div>
      </div>
      <div className="result-card-footer">
        <button onClick={handleSelect} className="btn-primary">
          Book Now
        </button>
      </div>
    </div>
  )
}

