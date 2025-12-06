import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { hotelService } from '../services/hotel.service';
import { useAuthStore } from '../store/authStore';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Loading from '../components/common/Loading';
import { FavoriteButton } from '../components/favorites';
import MakeOfferModal from '../components/bidding/MakeOfferModal';
import { ReviewList, ReviewForm } from '../components/reviews';
import { RoomSelector, RoomSelection } from '../components/booking';
import { formatCurrency } from '../utils/formatters';

const HotelDetail = () => {
  const { hotelId } = useParams<{ hotelId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [roomSelections, setRoomSelections] = useState<RoomSelection[]>([]);
  const [isSelectionValid, setIsSelectionValid] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  
  // Get search params for booking context
  const checkIn = searchParams.get('checkIn') || new Date().toISOString().split('T')[0];
  const checkOut = searchParams.get('checkOut') || new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const guests = parseInt(searchParams.get('guests') || '2');
  const rooms = parseInt(searchParams.get('rooms') || '1');
  
  const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));

  const { data: hotel, isLoading, error } = useQuery<any>({
    queryKey: ['hotel', hotelId],
    queryFn: () => hotelService.getById(hotelId!),
    enabled: !!hotelId,
  });

  if (isLoading) {
    return <Loading fullScreen message="Loading hotel details..." />;
  }

  if (error || !hotel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Hotel Not Found</h2>
          <p className="text-slate-600 mb-4">We couldn't find the hotel you're looking for.</p>
          <Button onClick={() => navigate('/hotels')}>Back to Hotels</Button>
        </Card>
      </div>
    );
  }

  // Handle room selection changes from RoomSelector
  const handleRoomSelectionChange = (
    selections: RoomSelection[], 
    isValid: boolean, 
    price: number
  ) => {
    setRoomSelections(selections);
    setIsSelectionValid(isValid);
    setTotalPrice(price);
  };

  const handleBookRooms = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!isSelectionValid || roomSelections.length === 0) {
      return;
    }
    
    // Navigate to checkout with state (matching the pattern used by other booking flows)
    navigate('/booking/checkout', {
      state: {
        bookingType: 'hotel',
        entity: {
          ...hotel,
          hotelId: hotelId,
        },
        quantity: roomSelections.reduce((sum, r) => sum + r.quantity, 0),
        checkInDate: checkIn,
        checkOutDate: checkOut,
        roomSelections: roomSelections,
        totalPrice: totalPrice,
      }
    });
  };

  const handleMakeOffer = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!isSelectionValid || roomSelections.length === 0) {
      return;
    }
    setShowOfferModal(true);
  };

  // Get all rooms with availability > 0
  const availableRooms = hotel.rooms?.filter((room: any) => room.availableRooms > 0) || [];

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

        {/* Hotel Header */}
        <Card className="p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{hotel.hotelName}</h1>
                <div className="flex">
                  {[...Array(hotel.starRating || 0)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xl">★</span>
                  ))}
                </div>
              </div>
              <p className="text-slate-600 dark:text-slate-400 mb-2">
                📍 {hotel.address}, {hotel.city}, {hotel.state} {hotel.zipCode}
              </p>
              <p className="text-slate-700 dark:text-slate-300">{hotel.description}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl font-bold text-blue-600">{hotel.rating?.toFixed(1) || 'N/A'}</span>
                <span className="text-slate-500">/ 5.0</span>
              </div>
              <p className="text-sm text-slate-500">{hotel.reviewsCount || 0} reviews</p>
              {isAuthenticated && (
                <FavoriteButton
                  itemType="hotel"
                  itemId={hotelId!}
                />
              )}
            </div>
          </div>
        </Card>

        {/* Booking Context */}
        <Card className="p-4 mb-6 bg-blue-50 dark:bg-blue-900/20">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <span className="text-sm text-slate-500">Check-in</span>
              <p className="font-semibold">{checkIn}</p>
            </div>
            <div>
              <span className="text-sm text-slate-500">Check-out</span>
              <p className="font-semibold">{checkOut}</p>
            </div>
            <div>
              <span className="text-sm text-slate-500">Duration</span>
              <p className="font-semibold">{nights} night{nights > 1 ? 's' : ''}</p>
            </div>
            <div>
              <span className="text-sm text-slate-500">Guests</span>
              <p className="font-semibold">{guests} guest{guests > 1 ? 's' : ''}</p>
            </div>
            <div>
              <span className="text-sm text-slate-500">Rooms</span>
              <p className="font-semibold">{rooms} room{rooms > 1 ? 's' : ''}</p>
            </div>
          </div>
        </Card>

        {/* Amenities */}
        {hotel.amenities && hotel.amenities.length > 0 && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Amenities</h2>
            <div className="flex flex-wrap gap-2">
              {hotel.amenities.map((amenity: any, index: number) => (
                <span
                  key={index}
                  className={`px-3 py-1 rounded-full text-sm ${
                    amenity.isFree 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                  }`}
                >
                  {amenity.isFree ? '✓ ' : '✗ '}{amenity.name}
                </span>
              ))}
            </div>
          </Card>
        )}

        {/* Room Selection */}
        <Card className="p-6 mb-6">
          {availableRooms.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>No rooms currently available.</p>
              <p className="text-sm mt-2">Please try different dates.</p>
            </div>
          ) : (
            <>
              <RoomSelector
                rooms={availableRooms}
                totalGuests={guests}
                nights={nights}
                onSelectionChange={handleRoomSelectionChange}
              />
              
              {/* Booking Actions */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button
                  variant="outline"
                  onClick={handleMakeOffer}
                  disabled={!isSelectionValid}
                  className="flex items-center gap-2"
                >
                  💰 Make Offer
                </Button>
                <Button
                  onClick={handleBookRooms}
                  disabled={!isSelectionValid}
                  className="flex items-center gap-2"
                >
                  Book Now - {formatCurrency(totalPrice)}
                </Button>
              </div>
            </>
          )}
        </Card>

        {/* Reviews Section */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Guest Reviews</h2>
          <ReviewList itemType="hotel" itemId={hotelId!} />
          {isAuthenticated && (
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
              <ReviewForm itemType="hotel" itemId={hotelId!} />
            </div>
          )}
        </Card>
      </div>

      {/* Make Offer Modal */}
      <MakeOfferModal
        isOpen={showOfferModal}
        onClose={() => setShowOfferModal(false)}
        itemType="hotel"
        itemId={hotelId!}
        itemName={`${hotel.hotelName} - ${roomSelections.map(r => `${r.quantity}x ${r.roomType}`).join(', ')}`}
        originalPrice={totalPrice}
        roomSelections={roomSelections}
        nights={nights}
      />
    </div>
  );
};

export default HotelDetail;

