import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Hotel as HotelIcon, Star, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { hotelService } from '../services/hotel.service';
import { Hotel } from '../types';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Loading, { SkeletonCard } from '../components/common/Loading';
import Select from '../components/common/Select';
import Input from '../components/common/Input';
import { formatCurrency, calculateNights } from '../utils/formatters';
import { SORT_OPTIONS, STAR_RATINGS, US_STATES } from '../utils/constants';
import { toast } from 'react-toastify';
import { useAuthStore } from '../store/authStore';

const HotelSearch = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minStars, setMinStars] = useState('');
  const [sortBy, setSortBy] = useState('price');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');

  const filters = {
    city: searchParams.get('city') || '',
    state: searchParams.get('state') || '',
    checkIn: searchParams.get('checkIn') || '',
    checkOut: searchParams.get('checkOut') || '',
    guests: parseInt(searchParams.get('guests') || '2'),
    rooms: parseInt(searchParams.get('rooms') || '1'),
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    minStars: minStars ? parseInt(minStars) : undefined,
    sortBy: sortBy as any,
    sortOrder: 'ASC' as const,
  };

  const { data: hotels, isLoading } = useQuery({
    queryKey: ['hotels', filters],
    queryFn: () => hotelService.search(filters),
    enabled: !!filters.city,
  });

  const nights = filters.checkIn && filters.checkOut 
    ? calculateNights(filters.checkIn, filters.checkOut)
    : 0;

  const handleBookHotel = (hotel: Hotel) => {
    if (!isAuthenticated) {
      toast.error('Please login to book this hotel');
      navigate('/login', {
        state: {
          from: '/booking/checkout',
          bookingData: {
            bookingType: 'hotel',
            entity: hotel,
            quantity: filters.rooms,
            checkInDate: filters.checkIn,
            checkOutDate: filters.checkOut,
          }
        }
      });
      return;
    }
    
    navigate('/booking/checkout', {
      state: {
        bookingType: 'hotel',
        entity: hotel,
        quantity: filters.rooms,
        checkInDate: filters.checkIn,
        checkOutDate: filters.checkOut,
      },
    });
  };

  if (!filters.city) {
    return (
      <div className="container mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <HotelIcon className="w-16 h-16 mx-auto mb-4 text-blue-600" />
            <h1 className="text-4xl font-display font-bold mb-2">Find Your Perfect Hotel</h1>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              Search thousands of hotels worldwide
            </p>
          </div>

          <Card className="p-8">
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const checkInValue = formData.get('checkIn') as string;
              const checkOutValue = formData.get('checkOut') as string;
              
              // Validate check-out is after check-in
              if (checkInValue && checkOutValue) {
                const checkInDateObj = new Date(checkInValue);
                const checkOutDateObj = new Date(checkOutValue);
                
                if (checkOutDateObj <= checkInDateObj) {
                  toast.error('Check-out date must be after check-in date');
                  return;
                }
              }
              
              const params = new URLSearchParams({
                city: formData.get('city') as string,
                state: formData.get('state') as string,
                checkIn: checkInValue,
                checkOut: checkOutValue,
                guests: formData.get('guests') as string || '2',
                rooms: formData.get('rooms') as string || '1',
              });
              navigate(`/hotels?${params.toString()}`);
            }}>
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  💡 <strong>Tip:</strong> Make sure your city and state match (e.g., Miami + Florida, Chicago + Illinois)
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Input
                  type="text"
                  name="city"
                  label="City"
                  placeholder="e.g., Chicago, Miami, New York"
                  required
                />
                <Select
                  name="state"
                  label="State"
                  options={[{ value: '', label: 'Select State' }, ...US_STATES]}
                  required
                />
                <Input
                  type="date"
                  name="checkIn"
                  label="Check-in"
                  min={new Date().toISOString().split('T')[0]}
                  value={checkInDate}
                  onChange={(e) => {
                    setCheckInDate(e.target.value);
                    // If check-out is before new check-in, clear check-out
                    if (checkOutDate && e.target.value >= checkOutDate) {
                      setCheckOutDate('');
                    }
                  }}
                  required
                />
                <Input
                  type="date"
                  name="checkOut"
                  label="Check-out"
                  min={checkInDate || new Date().toISOString().split('T')[0]}
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  required
                />
                <Input
                  type="number"
                  name="guests"
                  label="Guests"
                  min="1"
                  max="10"
                  defaultValue="2"
                  required
                />
                <Input
                  type="number"
                  name="rooms"
                  label="Rooms"
                  min="1"
                  max="5"
                  defaultValue="1"
                  required
                />
              </div>
              <Button type="submit" fullWidth size="lg">
                Search Hotels
              </Button>
            </form>
          </Card>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500 mb-2">Popular destinations:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { city: 'Chicago', state: 'IL' },
                { city: 'Miami', state: 'FL' },
                { city: 'Houston', state: 'TX' },
                { city: 'New York', state: 'NY' },
                { city: 'San Diego', state: 'CA' },
                { city: 'Orlando', state: 'FL' }
              ].map(({ city, state }) => (
                <button
                  key={`${city}-${state}`}
                  onClick={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    const weekLater = new Date();
                    weekLater.setDate(weekLater.getDate() + 8);
                    navigate(`/hotels?city=${city}&state=${state}&checkIn=${tomorrow.toISOString().split('T')[0]}&checkOut=${weekLater.toISOString().split('T')[0]}&guests=2&rooms=1`);
                  }}
                  className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-sm transition-colors"
                >
                  {city}, {state}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-display font-bold mb-2">
          Hotels in {filters.city}{filters.state && `, ${filters.state}`}
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          {filters.checkIn} - {filters.checkOut} ({nights} {nights === 1 ? 'night' : 'nights'}) · {filters.guests} guests · {filters.rooms} {filters.rooms === 1 ? 'room' : 'rooms'}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <div className="glass-strong rounded-2xl p-6 sticky top-24 space-y-6">
            <h3 className="font-display font-bold text-xl">Filters</h3>
            
            <Select
              label="Sort By"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              options={SORT_OPTIONS.hotel}
            />

            <div>
              <label className="block text-sm font-medium mb-2">Price per night</label>
              <div className="grid grid-cols-2 gap-2">
                <Input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                <Input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Star Rating</label>
              <div className="space-y-2">
                {STAR_RATINGS.map((rating) => (
                  <label key={rating} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="stars"
                      value={rating}
                      checked={minStars === rating.toString()}
                      onChange={(e) => setMinStars(e.target.value)}
                      className="text-blue-600"
                    />
                    <div className="flex">
                      {Array.from({ length: rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      ))}
                    </div>
                    <span className="text-sm">& up</span>
                  </label>
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              fullWidth
              onClick={() => {
                setMinPrice('');
                setMaxPrice('');
                setMinStars('');
                setSortBy('price');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          {isLoading && <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>}

          {!isLoading && (!hotels || hotels.length === 0) && (
            <Card className="p-12 text-center">
              <HotelIcon className="w-16 h-16 mx-auto mb-4 text-slate-400" />
              <h3 className="text-2xl font-bold mb-2">No Hotels Found</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                We couldn't find any hotels matching your search criteria.
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ <strong>Common issue:</strong> Make sure your city and state match correctly.<br/>
                  Example: Miami should be paired with Florida (FL), not California (CA)
                </p>
              </div>
              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <p><strong>Tips:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Check that city and state are correctly matched</li>
                  <li>Try different dates</li>
                  <li>Adjust the number of guests or rooms</li>
                  <li>Clear any price or star rating filters</li>
                </ul>
              </div>
              <Button onClick={() => navigate('/hotels')} className="mt-6">
                Try New Search
              </Button>
            </Card>
          )}

          {hotels?.map((hotel, index) => (
            <motion.div
              key={hotel.hotelId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card interactive>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-48 h-48 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <HotelIcon className="w-16 h-16 text-white" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold mb-1">{hotel.hotelName}</h3>
                        <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                          <MapPin className="w-4 h-4" />
                          <span>{hotel.city}, {hotel.state}</span>
                        </div>
                      </div>
                      <div className="flex">
                        {Array.from({ length: hotel.starRating }).map((_, i) => (
                          <Star key={i} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        ))}
                      </div>
                    </div>

                    {hotel.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                        {hotel.description}
                      </p>
                    )}

                    {hotel.amenities && hotel.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {hotel.amenities.slice(0, 4).map((amenity: any, idx: number) => (
                          <span key={idx} className="badge-primary text-xs">
                            {typeof amenity === 'string' ? amenity : amenity.name}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div>
                        {(hotel.rating || hotel.hotelRating) && (
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-semibold">{(hotel.rating || hotel.hotelRating)?.toFixed(1)}</span>
                            <span className="text-sm text-slate-500">Guest rating</span>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">
                          {formatCurrency((hotel.rooms?.[0]?.pricePerNight || 0) * nights)}
                        </p>
                        <p className="text-sm text-slate-500">{nights} {nights === 1 ? 'night' : 'nights'}</p>
                        <Button onClick={() => handleBookHotel(hotel)} className="mt-2">
                          Book Now
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HotelSearch;

