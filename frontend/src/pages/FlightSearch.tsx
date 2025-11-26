import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plane, SlidersHorizontal, ArrowRight, Star, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { flightService } from '../services/flight.service';
import { Flight } from '../types';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Loading, { SkeletonCard } from '../components/common/Loading';
import Select from '../components/common/Select';
import Input from '../components/common/Input';
import { formatCurrency, formatTime, formatDuration } from '../utils/formatters';
import { SORT_OPTIONS } from '../utils/constants';

const FlightSearch = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(true);
  
  // Filters
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [airline, setAirline] = useState('');
  const [sortBy, setSortBy] = useState('price');

  const filters = {
    origin: searchParams.get('origin') || '',
    destination: searchParams.get('destination') || '',
    departureDate: searchParams.get('departureDate') || '',
    passengers: parseInt(searchParams.get('passengers') || '1'),
    class: searchParams.get('class') || 'economy',
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    airline,
    sortBy: sortBy as any,
    sortOrder: 'ASC' as const,
  };

  const { data: flights, isLoading, error } = useQuery({
    queryKey: ['flights', filters],
    queryFn: () => flightService.search(filters),
    enabled: !!(filters.origin && filters.destination),
  });

  const handleBookFlight = (flight: Flight) => {
    navigate('/booking/checkout', {
      state: {
        bookingType: 'flight',
        entity: flight,
        quantity: filters.passengers,
        checkInDate: filters.departureDate,
        checkOutDate: filters.departureDate,
      },
    });
  };

  if (!filters.origin || !filters.destination) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Plane className="w-16 h-16 mx-auto mb-4 text-slate-400" />
        <h2 className="text-2xl font-display font-bold mb-2">No search criteria</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Please start a new search from the home page
        </p>
        <Button onClick={() => navigate('/')}>Go to Home</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-display font-bold mb-2">
          {filters.origin} <ArrowRight className="inline w-6 h-6" /> {filters.destination}
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          {filters.departureDate} · {filters.passengers} {filters.passengers === 1 ? 'Passenger' : 'Passengers'} · {filters.class}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1"
        >
          <div className="glass-strong rounded-2xl p-6 sticky top-24">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-bold text-xl">Filters</h3>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden"
              >
                <SlidersHorizontal className="w-5 h-5" />
              </button>
            </div>

            {(showFilters || window.innerWidth >= 1024) && (
              <div className="space-y-6">
                <Select
                  label="Sort By"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  options={SORT_OPTIONS.flight}
                />

                <div>
                  <label className="block text-sm font-medium mb-2">Price Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                    />
                  </div>
                </div>

                <Input
                  label="Airline"
                  placeholder="Filter by airline"
                  value={airline}
                  onChange={(e) => setAirline(e.target.value)}
                />

                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => {
                    setMinPrice('');
                    setMaxPrice('');
                    setAirline('');
                    setSortBy('price');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-4">
          {isLoading && (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          )}

          {error && (
            <Card>
              <p className="text-red-600">Error loading flights. Please try again.</p>
            </Card>
          )}

          {flights && flights.length === 0 && (
            <Card>
              <div className="text-center py-12">
                <Plane className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                <h3 className="text-xl font-bold mb-2">No flights found</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Try adjusting your filters or search criteria
                </p>
              </div>
            </Card>
          )}

          {flights?.map((flight, index) => (
            <motion.div
              key={flight.flightId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card interactive>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Flight Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center space-x-2">
                      <Plane className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-lg">{flight.airlineName}</span>
                      <span className="text-sm text-slate-500">#{flight.flightId}</span>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold">{formatTime(flight.departureDatetime)}</p>
                        <p className="text-sm text-slate-500">{flight.departureAirport}</p>
                      </div>

                      <div className="flex-1 flex flex-col items-center">
                        <div className="flex items-center space-x-2 text-slate-400">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">{formatDuration(flight.durationMinutes)}</span>
                        </div>
                        <div className="w-full h-px bg-slate-300 dark:bg-slate-600 my-2"></div>
                        <p className="text-xs text-slate-500 capitalize">{flight.flightClass}</p>
                      </div>

                      <div className="text-center">
                        <p className="text-2xl font-bold">{formatTime(flight.arrivalDatetime)}</p>
                        <p className="text-sm text-slate-500">{flight.arrivalAirport}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-sm">
                      {flight.flightRating && (
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span>{flight.flightRating.toFixed(1)}</span>
                        </div>
                      )}
                      <span className="text-slate-500">
                        {flight.availableSeats} seats available
                      </span>
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="flex md:flex-col items-center md:items-end gap-4">
                    <div className="text-right">
                      <p className="text-3xl font-bold text-blue-600">
                        {formatCurrency(flight.ticketPrice)}
                      </p>
                      <p className="text-sm text-slate-500">per person</p>
                    </div>
                    <Button
                      onClick={() => handleBookFlight(flight)}
                      disabled={flight.availableSeats < filters.passengers}
                    >
                      {flight.availableSeats < filters.passengers ? 'Not Available' : 'Book Now'}
                    </Button>
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

export default FlightSearch;

