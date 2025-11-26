import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import type { Hotel } from '../../api/listingApi'
import './ResultCard.css'

interface HotelResultCardProps {
  hotel: Hotel
}

export function HotelResultCard({ hotel }: HotelResultCardProps) {
  const navigate = useNavigate()
  const { setSelectedListing } = useStore()

  const handleSelect = () => {
    setSelectedListing(hotel)
    navigate('/booking?type=hotel')
  }

  return (
    <div className="result-card">
      <div className="result-card-header">
        <h3>{hotel.name}</h3>
        <div className="result-price">${hotel.pricePerNight.toFixed(2)}/night</div>
      </div>
      <div className="result-card-body">
        <div className="result-location">
          <p>{hotel.address}</p>
          <p>{hotel.city}, {hotel.state || hotel.country}</p>
        </div>
        {hotel.rating && (
          <div className="result-rating">
            {'★'.repeat(Math.floor(hotel.rating))}
            <span className="rating-number">{hotel.rating.toFixed(1)}</span>
          </div>
        )}
        {hotel.amenities && hotel.amenities.length > 0 && (
          <div className="result-amenities">
            {hotel.amenities.slice(0, 3).map((amenity, idx) => (
              <span key={idx} className="amenity-tag">{amenity}</span>
            ))}
          </div>
        )}
        {hotel.availableRooms !== undefined && (
          <div className="result-availability">
            {hotel.availableRooms > 0 ? (
              <span className="available">{hotel.availableRooms} rooms available</span>
            ) : (
              <span className="unavailable">No rooms available</span>
            )}
          </div>
        )}
      </div>
      <div className="result-card-footer">
        <button onClick={handleSelect} className="btn-primary" disabled={hotel.availableRooms === 0}>
          Select Hotel
        </button>
      </div>
    </div>
  )
}

