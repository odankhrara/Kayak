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
import { SORT_OPTIONS, STAR_RATINGS } from '../utils/constants';

const HotelSearch = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minStars, setMinStars] = useState('');
  const [sortBy, setSortBy] = useState('price');

  const filters = {
    city: searchParams.get('city') || '',
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
      <div className="container mx-auto px-4 py-20 text-center">
        <HotelIcon className="w-16 h-16 mx-auto mb-4 text-slate-400" />
        <h2 className="text-2xl font-display font-bold mb-2">No search criteria</h2>
        <Button onClick={() => navigate('/')}>Go to Home</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-display font-bold mb-2">Hotels in {filters.city}</h1>
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
                        {hotel.amenities.slice(0, 4).map((amenity) => (
                          <span key={amenity} className="badge-primary text-xs">
                            {amenity}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div>
                        {hotel.hotelRating && (
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-semibold">{hotel.hotelRating.toFixed(1)}</span>
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

