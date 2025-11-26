import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import type { Car } from '../../api/listingApi'
import './ResultCard.css'

interface CarResultCardProps {
  car: Car
}

export function CarResultCard({ car }: CarResultCardProps) {
  const navigate = useNavigate()
  const { setSelectedListing } = useStore()

  const handleSelect = () => {
    setSelectedListing(car)
    navigate('/booking?type=car')
  }

  return (
    <div className="result-card">
      <div className="result-card-header">
        <h3>{car.year} {car.make} {car.model}</h3>
        <div className="result-price">${car.pricePerDay.toFixed(2)}/day</div>
      </div>
      <div className="result-card-body">
        <div className="result-location">
          <p><strong>Rental Company:</strong> {car.rentalCompany}</p>
          <p><strong>Location:</strong> {car.location}</p>
        </div>
        {car.features && car.features.length > 0 && (
          <div className="result-features">
            {car.features.map((feature, idx) => (
              <span key={idx} className="feature-tag">{feature}</span>
            ))}
          </div>
        )}
        <div className="result-availability">
          {car.available !== false ? (
            <span className="available">Available</span>
          ) : (
            <span className="unavailable">Not available</span>
          )}
        </div>
      </div>
      <div className="result-card-footer">
        <button onClick={handleSelect} className="btn-primary" disabled={car.available === false}>
          Select Car
        </button>
      </div>
    </div>
  )
}

