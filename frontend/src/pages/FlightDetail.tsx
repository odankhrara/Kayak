import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plane, Clock, Users, Calendar, MapPin } from 'lucide-react';
import { flightService } from '../services/flight.service';
import { useAuthStore } from '../store/authStore';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Loading from '../components/common/Loading';
import { FavoriteButton } from '../components/favorites';
import MakeOfferModal from '../components/bidding/MakeOfferModal';
import { ReviewList, ReviewForm } from '../components/reviews';
import { formatCurrency } from '../utils/formatters';

const FlightDetail = () => {
  const { flightId } = useParams<{ flightId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  
  const [showOfferModal, setShowOfferModal] = useState(false);
  
  // Get search params for booking context
  const passengers = parseInt(searchParams.get('passengers') || '1');
  const departureDate = searchParams.get('date') || '';

  const { data: flight, isLoading, error } = useQuery({
    queryKey: ['flight', flightId],
    queryFn: () => flightService.getById(flightId!),
    enabled: !!flightId,
  });

  if (isLoading) {
    return <Loading fullScreen message="Loading flight details..." />;
  }

  if (error || !flight) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Flight Not Found</h2>
          <p className="text-slate-600 mb-4">We couldn't find the flight you're looking for.</p>
          <Button onClick={() => navigate('/flights')}>Back to Flights</Button>
        </Card>
      </div>
    );
  }

  const handleBookFlight = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const totalPrice = (flight.pricePerTicket || flight.ticketPrice || 0) * passengers;
    navigate(`/booking/checkout?type=flight&entityId=${flightId}&passengers=${passengers}&date=${departureDate}&price=${totalPrice}`);
  };

  const handleMakeOffer = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setShowOfferModal(true);
  };

  const ticketPrice = flight.pricePerTicket || flight.ticketPrice || 0;
  const totalPrice = ticketPrice * passengers;
  const rating = flight.flightRating || flight.rating || 0;

  // Format duration
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Format datetime
  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    };
  };

  const departure = formatDateTime(flight.departureDatetime);
  const arrival = formatDateTime(flight.arrivalDatetime);

  // Flight class config
  const classConfig: Record<string, { color: string; label: string }> = {
    economy: { color: 'from-blue-500 to-blue-600', label: 'Economy' },
    business: { color: 'from-purple-500 to-purple-600', label: 'Business' },
    first: { color: 'from-amber-500 to-amber-600', label: 'First Class' },
  };

  const flightClassConfig = classConfig[flight.flightClass] || classConfig.economy;

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

        {/* Flight Header */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Airline Logo Placeholder */}
            <div className={`w-full md:w-48 h-48 bg-gradient-to-br ${flightClassConfig.color} rounded-xl flex flex-col items-center justify-center`}>
              <Plane className="w-16 h-16 text-white mb-2" />
              <span className="text-white font-semibold text-sm">{flight.airlineName}</span>
            </div>

            <div className="flex-1">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold">{flight.airlineName}</h1>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${flightClassConfig.color} text-white`}>
                      {flightClassConfig.label}
                    </span>
                  </div>
                  <p className="text-slate-500">Flight {flightId}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl font-bold text-blue-600">
                      {rating > 0 ? rating.toFixed(1) : 'N/A'}
                    </span>
                    <span className="text-slate-500">/ 5.0</span>
                  </div>
                  <p className="text-sm text-slate-500">{flight.reviewsCount || 0} reviews</p>
                  {isAuthenticated && (
                    <FavoriteButton
                      itemType="flight"
                      itemId={flightId!}
                    />
                  )}
                </div>
              </div>

              {/* Flight Route Visual */}
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                <div className="text-center">
                  <p className="text-3xl font-bold">{flight.departureAirport}</p>
                  <p className="text-lg font-semibold text-blue-600">{departure.time}</p>
                  <p className="text-sm text-slate-500">{departure.date}</p>
                </div>
                
                <div className="flex-1 mx-4">
                  <div className="relative">
                    <div className="border-t-2 border-dashed border-slate-300 dark:border-slate-600"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 px-2">
                      <div className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-medium">{formatDuration(flight.durationMinutes)}</span>
                      </div>
                    </div>
                    <Plane className="absolute right-0 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-600" />
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-3xl font-bold">{flight.arrivalAirport}</p>
                  <p className="text-lg font-semibold text-blue-600">{arrival.time}</p>
                  <p className="text-sm text-slate-500">{arrival.date}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Booking Context */}
        <Card className="p-4 mb-6 bg-blue-50 dark:bg-blue-900/20">
          <div className="flex flex-wrap gap-6 items-center">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <span className="text-sm text-slate-500">Departure</span>
                <p className="font-semibold">{departure.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <span className="text-sm text-slate-500">Passengers</span>
                <p className="font-semibold">{passengers} passenger{passengers > 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="ml-auto">
              <span className="text-sm text-slate-500">Available Seats</span>
              <p className="font-semibold text-lg">
                {flight.availableSeats} / {flight.totalSeats}
              </p>
            </div>
          </div>
        </Card>

        {/* Flight Details */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Flight Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <Plane className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-sm text-slate-500">Airline</p>
                <p className="font-semibold">{flight.airlineName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-sm text-slate-500">Duration</p>
                <p className="font-semibold">{formatDuration(flight.durationMinutes)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <MapPin className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-sm text-slate-500">Route</p>
                <p className="font-semibold">{flight.departureAirport} → {flight.arrivalAirport}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-sm text-slate-500">Class</p>
                <p className="font-semibold capitalize">{flight.flightClass}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Pricing & Booking */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Ticket Price</h2>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-sm text-slate-500">{formatCurrency(ticketPrice)}/passenger</span>
                <span className="text-slate-300">×</span>
                <span className="text-sm text-slate-500">{passengers} passenger{passengers > 1 ? 's' : ''}</span>
              </div>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {formatCurrency(totalPrice)}
              </p>
              <p className="text-sm text-slate-500">Total fare</p>
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
                onClick={handleBookFlight}
                disabled={flight.availableSeats < passengers}
                className="flex items-center gap-2"
              >
                {flight.availableSeats >= passengers 
                  ? `Book Now - ${formatCurrency(totalPrice)}` 
                  : 'Not Enough Seats'}
              </Button>
            </div>
          </div>
          {flight.availableSeats < passengers && (
            <p className="mt-4 text-red-500 text-sm">
              ⚠️ Only {flight.availableSeats} seats available. Please reduce the number of passengers.
            </p>
          )}
        </Card>

        {/* Airline Info */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Airline Information</h2>
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 bg-gradient-to-br ${flightClassConfig.color} rounded-xl flex items-center justify-center`}>
              <Plane className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{flight.airlineName}</h3>
              <p className="text-slate-500">Airline Operator</p>
            </div>
          </div>
        </Card>

        {/* Reviews Section - Aggregated by Airline */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">{flight.airlineName} Reviews</h2>
          <p className="text-sm text-slate-500 mb-4">
            Reviews from passengers who flew with {flight.airlineName}
          </p>
          <ReviewList itemType="flight" itemId={flightId!} />
          {isAuthenticated && (
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
              <ReviewForm itemType="flight" itemId={flightId!} />
            </div>
          )}
        </Card>
      </div>

      {/* Make Offer Modal */}
      <MakeOfferModal
        isOpen={showOfferModal}
        onClose={() => setShowOfferModal(false)}
        itemType="flight"
        itemId={flightId!}
        itemName={`${flight.airlineName} - ${flight.departureAirport} to ${flight.arrivalAirport}`}
        originalPrice={totalPrice}
      />
    </div>
  );
};

export default FlightDetail;

