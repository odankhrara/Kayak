import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Car as CarIcon, Users, Scale } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { carService } from '../services/car.service';
import { Car } from '../types';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import { SkeletonCard } from '../components/common/Loading';
import Select from '../components/common/Select';
import CarLocationAutocomplete from '../components/common/CarLocationAutocomplete';
import { formatCurrency, calculateNights } from '../utils/formatters';
import { CAR_TYPES, TRANSMISSION_TYPES } from '../utils/constants';
import { toast } from 'react-toastify';
import { useAuthStore } from '../store/authStore';
import { trackSearch, trackBookingAttempt } from '../utils/clickTracking';
import FavoriteButton from '../components/favorites/FavoriteButton';
import { ComparisonBar, ComparisonItem } from '../components/comparison';

const CarSearch = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  
  const [carTypeFilter, setCarTypeFilter] = useState('');
  const [transmission, setTransmission] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  
  // Location state for autocomplete
  const [selectedLocation, setSelectedLocation] = useState('');
  
  // Comparison state
  const [comparisonItems, setComparisonItems] = useState<ComparisonItem[]>([]);

  const filters = {
    location: searchParams.get('location') || '',
    pickupDate: searchParams.get('pickupDate') || '',
    returnDate: searchParams.get('returnDate') || '',
    carType: (carTypeFilter || searchParams.get('carType') || undefined) as 'sedan' | 'suv' | 'compact' | 'luxury' | 'van' | 'truck' | undefined,
    transmission: transmission as 'automatic' | 'manual' | undefined,
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    sortBy: 'price' as const,
    sortOrder: 'ASC' as const,
  };

  const { data: cars, isLoading } = useQuery({
    queryKey: ['cars', filters],
    queryFn: () => carService.search(filters),
    enabled: !!filters.location,
  });

  // Track search results when cars are loaded
  useEffect(() => {
    if (cars && filters.location) {
      trackSearch({
        type: 'car',
        location: filters.location,
        pickupDate: filters.pickupDate,
        returnDate: filters.returnDate,
        carType: filters.carType || 'any',
      }, cars.length);
    }
  }, [cars]);

  const days = filters.pickupDate && filters.returnDate 
    ? calculateNights(filters.pickupDate, filters.returnDate)
    : 0;

  // Extract unique car rental companies from search results
  const uniqueCompanies = useMemo(() => {
    if (!cars) return [];
    const companies = [...new Set(cars.map(c => c.companyName))].filter(Boolean).sort();
    return companies;
  }, [cars]);

  // Filter cars by company
  const filteredCars = useMemo(() => {
    if (!cars || !companyFilter) return cars;
    return cars.filter(c => c.companyName === companyFilter);
  }, [cars, companyFilter]);

  // Comparison handlers
  const isInComparison = (carId: string) => {
    return comparisonItems.some(item => item.id === carId);
  };

  const toggleComparison = (car: Car) => {
    const carIdStr = car.carId?.toString() || '';
    if (isInComparison(carIdStr)) {
      setComparisonItems(items => items.filter(item => item.id !== carIdStr));
    } else {
      if (comparisonItems.length >= 3) {
        toast.warning('You can compare up to 3 cars at a time');
        return;
      }
      const newItem: ComparisonItem = {
        id: carIdStr,
        type: 'car',
        name: `${car.model} (${car.year})`,
        provider: car.companyName,
        price: car.dailyRentalPrice * days,
        rating: car.carRating,
        details: {
          carType: car.carType,
          transmission: car.transmissionType || 'Automatic',
          seats: car.seats,
          dailyRate: car.dailyRentalPrice,
          available: car.available ? 'Yes' : 'No',
        }
      };
      setComparisonItems(items => [...items, newItem]);
      toast.success(`Added ${car.model} to comparison`);
    }
  };

  const removeFromComparison = (id: string) => {
    setComparisonItems(items => items.filter(item => item.id !== id));
  };

  const clearComparison = () => {
    setComparisonItems([]);
  };

  const handleBookCar = (car: Car) => {
    // Track booking attempt
    trackBookingAttempt(
      car.carId?.toString() || 'unknown',
      'car',
      (car.dailyRentalPrice || 0) * days
    );

    if (!isAuthenticated) {
      toast.error('Please login to book this car');
      navigate('/login', {
        state: {
          from: '/booking/checkout',
          bookingData: {
            bookingType: 'car',
            entity: car,
            quantity: 1,
            checkInDate: filters.pickupDate,
            checkOutDate: filters.returnDate,
          }
        }
      });
      return;
    }
    
    navigate('/booking/checkout', {
      state: {
        bookingType: 'car',
        entity: car,
        quantity: 1,
        checkInDate: filters.pickupDate,
        checkOutDate: filters.returnDate,
      },
    });
  };

  if (!filters.location) {
    return (
      <div className="container mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <CarIcon className="w-16 h-16 mx-auto mb-4 text-blue-600" />
            <h1 className="text-4xl font-display font-bold mb-2">Rent a Car</h1>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              Find the perfect vehicle for your journey
            </p>
          </div>

          <Card className="p-8">
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const pickupValue = formData.get('pickupDate') as string;
              const returnValue = formData.get('returnDate') as string;
              
              // Validate location is selected
              if (!selectedLocation) {
                toast.error('Please select a location from the dropdown');
                return;
              }
              
              // Validate return date is after pickup date
              if (pickupValue && returnValue) {
                const pickupDateObj = new Date(pickupValue);
                const returnDateObj = new Date(returnValue);
                
                if (returnDateObj <= pickupDateObj) {
                  toast.error('Return date must be after pick-up date');
                  return;
                }
              }
              
              const params = new URLSearchParams({
                location: selectedLocation,
                pickupDate: pickupValue,
                returnDate: returnValue,
              });
              navigate(`/cars?${params.toString()}`);
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="md:col-span-2">
                  <CarLocationAutocomplete
                    value={selectedLocation}
                    onChange={(location) => setSelectedLocation(location)}
                    placeholder="Search locations with rental cars..."
                    label="Pick-up Location"
                    required
                  />
                </div>
                <Input
                  type="date"
                  name="pickupDate"
                  label="Pick-up Date"
                  min={new Date().toISOString().split('T')[0]}
                  value={pickupDate}
                  onChange={(e) => {
                    setPickupDate(e.target.value);
                    // If return is before new pickup, clear return
                    if (returnDate && e.target.value >= returnDate) {
                      setReturnDate('');
                    }
                  }}
                  required
                />
                <Input
                  type="date"
                  name="returnDate"
                  label="Return Date"
                  min={pickupDate || new Date().toISOString().split('T')[0]}
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" fullWidth size="lg">
                Search Cars
              </Button>
            </form>
          </Card>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500 mb-2">Popular locations:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {['Chicago', 'Miami', 'Houston', 'Orlando', 'New York', 'Los Angeles'].map((city) => (
                <button
                  key={city}
                  onClick={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    const weekLater = new Date();
                    weekLater.setDate(weekLater.getDate() + 7);
                    navigate(`/cars?location=${city}&pickupDate=${tomorrow.toISOString().split('T')[0]}&returnDate=${weekLater.toISOString().split('T')[0]}`);
                  }}
                  className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-sm transition-colors"
                >
                  {city}
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
        <h1 className="text-3xl font-display font-bold mb-2">Car Rentals in {filters.location}</h1>
        <p className="text-slate-600 dark:text-slate-400">
          {filters.pickupDate} - {filters.returnDate} ({days} {days === 1 ? 'day' : 'days'})
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <div className="glass-strong rounded-2xl p-6 sticky top-24 space-y-6">
            <h3 className="font-display font-bold text-xl">Filters</h3>
            
            <Select
              label="Car Type"
              value={carTypeFilter}
              onChange={(e) => setCarTypeFilter(e.target.value)}
              options={[{ value: '', label: 'All Types' }, ...CAR_TYPES]}
            />

            <Select
              label="Transmission"
              value={transmission}
              onChange={(e) => setTransmission(e.target.value)}
              options={[{ value: '', label: 'Any' }, ...TRANSMISSION_TYPES]}
            />

            <div>
              <label className="block text-sm font-medium mb-2">Daily Price Range</label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Min $"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Max $"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
            </div>

            {/* Car Rental Company Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">
                🚗 Rental Company
              </label>
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Companies</option>
                {uniqueCompanies.map((company) => (
                  <option key={company} value={company}>
                    {company}
                  </option>
                ))}
              </select>
              {uniqueCompanies.length > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  {uniqueCompanies.length} compan{uniqueCompanies.length !== 1 ? 'ies' : 'y'} available
                </p>
              )}
            </div>

            <Button
              variant="outline"
              fullWidth
              onClick={() => {
                setCarTypeFilter('');
                setTransmission('');
                setMinPrice('');
                setMaxPrice('');
                setCompanyFilter('');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          {isLoading && <><SkeletonCard /><SkeletonCard /></>}

          {filteredCars?.map((car, index) => (
            <motion.div
              key={car.carId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card interactive>
                <div className="flex flex-col md:flex-row gap-6">
                  <div 
                    className="w-full md:w-48 h-48 bg-gradient-to-br from-teal-500 to-blue-500 rounded-xl flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => navigate(`/cars/${car.carId}?pickupDate=${filters.pickupDate}&returnDate=${filters.returnDate}`)}
                  >
                    <CarIcon className="w-16 h-16 text-white" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 
                          className="text-xl font-bold cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={() => navigate(`/cars/${car.carId}?pickupDate=${filters.pickupDate}&returnDate=${filters.returnDate}`)}
                        >
                          {car.model} ({car.year})
                        </h3>
                        <p 
                          className="text-slate-600 dark:text-slate-400 cursor-pointer hover:text-blue-500 transition-colors"
                          onClick={() => navigate(`/cars/${car.carId}?pickupDate=${filters.pickupDate}&returnDate=${filters.returnDate}`)}
                        >
                          {car.companyName}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Compare Button */}
                        <button
                          onClick={() => toggleComparison(car)}
                          className={`p-2 rounded-lg transition-all ${
                            isInComparison(car.carId?.toString() || '')
                              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700'
                          }`}
                          title={isInComparison(car.carId?.toString() || '') ? 'Remove from comparison' : 'Add to comparison'}
                        >
                          <Scale className="w-4 h-4" />
                        </button>
                        <FavoriteButton itemType="car" itemId={car.carId} />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 mb-4">
                      <span className="badge-primary capitalize">{car.carType}</span>
                      <span className="badge-primary capitalize">{car.transmissionType || 'Automatic'}</span>
                      <span className="badge-primary flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>{car.seats} seats</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500">Daily rate</p>
                        <p className="text-lg font-semibold">{formatCurrency(car.dailyRentalPrice)}/day</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">
                          {formatCurrency(car.dailyRentalPrice * days)}
                        </p>
                        <p className="text-sm text-slate-500 mb-2">Total</p>
                        <Button onClick={() => handleBookCar(car)} disabled={!car.available}>
                          {car.available ? 'Book Now' : 'Not Available'}
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

      {/* Comparison Bar */}
      <AnimatePresence>
        {comparisonItems.length > 0 && (
          <ComparisonBar
            items={comparisonItems}
            onRemove={removeFromComparison}
            onClear={clearComparison}
            maxItems={3}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CarSearch;

