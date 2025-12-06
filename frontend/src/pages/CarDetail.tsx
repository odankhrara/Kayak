import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Car as CarIcon, Users, Calendar, MapPin, Fuel, Settings } from 'lucide-react';
import { carService } from '../services/car.service';
import { useAuthStore } from '../store/authStore';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Loading from '../components/common/Loading';
import { FavoriteButton } from '../components/favorites';
import MakeOfferModal from '../components/bidding/MakeOfferModal';
import { ReviewList, ReviewForm } from '../components/reviews';
import { formatCurrency } from '../utils/formatters';

const CarDetail = () => {
  const { carId } = useParams<{ carId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  
  const [showOfferModal, setShowOfferModal] = useState(false);
  
  // Get search params for booking context
  const pickupDate = searchParams.get('pickupDate') || new Date().toISOString().split('T')[0];
  const returnDate = searchParams.get('returnDate') || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
  
  const days = Math.ceil((new Date(returnDate).getTime() - new Date(pickupDate).getTime()) / (1000 * 60 * 60 * 24));

  const { data: car, isLoading, error } = useQuery({
    queryKey: ['car', carId],
    queryFn: () => carService.getById(carId!),
    enabled: !!carId,
  });

  if (isLoading) {
    return <Loading fullScreen message="Loading car details..." />;
  }

  if (error || !car) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Car Not Found</h2>
          <p className="text-slate-600 mb-4">We couldn't find the car you're looking for.</p>
          <Button onClick={() => navigate('/cars')}>Back to Cars</Button>
        </Card>
      </div>
    );
  }

  const handleBookCar = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate(`/booking/checkout?type=car&entityId=${carId}&pickupDate=${pickupDate}&returnDate=${returnDate}&price=${car.dailyRentalPrice * days}`);
  };

  const handleMakeOffer = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setShowOfferModal(true);
  };

  const totalPrice = car.dailyRentalPrice * days;

  // Car type icons/colors
  const carTypeConfig: Record<string, { color: string; label: string }> = {
    sedan: { color: 'from-blue-500 to-blue-600', label: 'Sedan' },
    suv: { color: 'from-green-500 to-green-600', label: 'SUV' },
    compact: { color: 'from-purple-500 to-purple-600', label: 'Compact' },
    luxury: { color: 'from-amber-500 to-amber-600', label: 'Luxury' },
    van: { color: 'from-teal-500 to-teal-600', label: 'Van' },
    truck: { color: 'from-red-500 to-red-600', label: 'Truck' },
  };

  const typeConfig = carTypeConfig[car.carType] || carTypeConfig.sedan;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          ← Back to Search
        </Button>

        {/* Car Header */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Car Image Placeholder */}
            <div className={`w-full md:w-64 h-48 bg-gradient-to-br ${typeConfig.color} rounded-xl flex items-center justify-center`}>
              <CarIcon className="w-20 h-20 text-white" />
            </div>

            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold">{car.model}</h1>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${typeConfig.color} text-white`}>
                      {typeConfig.label}
                    </span>
                  </div>
                  <p className="text-xl text-slate-600 dark:text-slate-400 mb-2">
                    {car.companyName} • {car.year}
                  </p>
                  <div className="flex items-center gap-2 text-slate-500">
                    <MapPin className="w-4 h-4" />
                    <span>{car.location}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl font-bold text-blue-600">
                      {car.carRating?.toFixed(1) || 'N/A'}
                    </span>
                    <span className="text-slate-500">/ 5.0</span>
                  </div>
                  {isAuthenticated && (
                    <FavoriteButton
                      itemType="car"
                      itemId={carId!}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Rental Period */}
        <Card className="p-4 mb-6 bg-blue-50 dark:bg-blue-900/20">
          <div className="flex flex-wrap gap-6 items-center">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <span className="text-sm text-slate-500">Pick-up</span>
                <p className="font-semibold">{pickupDate}</p>
              </div>
            </div>
            <div className="text-2xl text-slate-300">→</div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <span className="text-sm text-slate-500">Return</span>
                <p className="font-semibold">{returnDate}</p>
              </div>
            </div>
            <div className="ml-auto">
              <span className="text-sm text-slate-500">Duration</span>
              <p className="font-semibold text-lg">{days} day{days > 1 ? 's' : ''}</p>
            </div>
          </div>
        </Card>

        {/* Car Features */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Vehicle Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-sm text-slate-500">Seats</p>
                <p className="font-semibold">{car.seats} passengers</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <Settings className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-sm text-slate-500">Transmission</p>
                <p className="font-semibold capitalize">{car.transmissionType}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <CarIcon className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-sm text-slate-500">Type</p>
                <p className="font-semibold capitalize">{car.carType}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <Fuel className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-sm text-slate-500">Year</p>
                <p className="font-semibold">{car.year}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Pricing & Booking */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Rental Price</h2>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-sm text-slate-500">{formatCurrency(car.dailyRentalPrice)}/day</span>
                <span className="text-slate-300">×</span>
                <span className="text-sm text-slate-500">{days} days</span>
              </div>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {formatCurrency(totalPrice)}
              </p>
              <p className="text-sm text-slate-500">Total rental cost</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleMakeOffer}
                className="flex items-center gap-2"
              >
                💰 Make Offer
              </Button>
              <Button
                onClick={handleBookCar}
                disabled={!car.available}
                className="flex items-center gap-2"
              >
                {car.available ? `Book Now - ${formatCurrency(totalPrice)}` : 'Not Available'}
              </Button>
            </div>
          </div>
          {!car.available && (
            <p className="mt-4 text-red-500 text-sm">
              ⚠️ This vehicle is currently not available for the selected dates.
            </p>
          )}
        </Card>

        {/* Company Info */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Rental Company</h2>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-xl flex items-center justify-center">
              <span className="text-2xl font-bold text-slate-600 dark:text-slate-300">
                {car.companyName.charAt(0)}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold">{car.companyName}</h3>
              <p className="text-slate-500">Rental Provider</p>
            </div>
          </div>
        </Card>

        {/* Reviews Section - Aggregated by Company */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">{car.companyName} Reviews</h2>
          <p className="text-sm text-slate-500 mb-4">
            Reviews from customers who rented from {car.companyName}
          </p>
          <ReviewList itemType="car" itemId={carId!} />
          {isAuthenticated && (
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
              <ReviewForm itemType="car" itemId={carId!} />
            </div>
          )}
        </Card>
      </div>

      {/* Make Offer Modal */}
      <MakeOfferModal
        isOpen={showOfferModal}
        onClose={() => setShowOfferModal(false)}
        itemType="car"
        itemId={carId!}
        itemName={`${car.companyName} - ${car.model}`}
        originalPrice={totalPrice}
      />
    </div>
  );
};

export default CarDetail;

