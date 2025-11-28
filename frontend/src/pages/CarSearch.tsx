import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Car as CarIcon, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { carService } from '../services/car.service';
import { Car } from '../types';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import { SkeletonCard } from '../components/common/Loading';
import Select from '../components/common/Select';
import { formatCurrency, calculateNights } from '../utils/formatters';
import { CAR_TYPES, TRANSMISSION_TYPES } from '../utils/constants';
import { toast } from 'react-toastify';
import { useAuthStore } from '../store/authStore';

const CarSearch = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  
  const [carTypeFilter, setCarTypeFilter] = useState('');
  const [transmission, setTransmission] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');

  const filters = {
    location: searchParams.get('location') || '',
    pickupDate: searchParams.get('pickupDate') || '',
    returnDate: searchParams.get('returnDate') || '',
    carType: carTypeFilter || searchParams.get('carType') || undefined,
    transmission: transmission as any,
    sortBy: 'price' as const,
    sortOrder: 'ASC' as const,
  };

  const { data: cars, isLoading } = useQuery({
    queryKey: ['cars', filters],
    queryFn: () => carService.search(filters),
    enabled: !!filters.location,
  });

  const days = filters.pickupDate && filters.returnDate 
    ? calculateNights(filters.pickupDate, filters.returnDate)
    : 0;

  const handleBookCar = (car: Car) => {
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
                location: formData.get('location') as string,
                pickupDate: pickupValue,
                returnDate: returnValue,
              });
              navigate(`/cars?${params.toString()}`);
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="md:col-span-2">
                  <Input
                    type="text"
                    name="location"
                    label="Pick-up Location"
                    placeholder="e.g., Chicago, Miami, New York"
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

            <Button
              variant="outline"
              fullWidth
              onClick={() => {
                setCarTypeFilter('');
                setTransmission('');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          {isLoading && <><SkeletonCard /><SkeletonCard /></>}

          {cars?.map((car, index) => (
            <motion.div
              key={car.carId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card interactive>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-48 h-48 bg-gradient-to-br from-teal-500 to-blue-500 rounded-xl flex items-center justify-center">
                    <CarIcon className="w-16 h-16 text-white" />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{car.model} ({car.year})</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-3">{car.companyName}</p>

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
    </div>
  );
};

export default CarSearch;

