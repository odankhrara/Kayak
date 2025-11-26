import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, Hotel, Car, Search, TrendingUp, Shield, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import DatePicker from '../components/common/DatePicker';
import { POPULAR_AIRPORTS, FLIGHT_CLASSES, POPULAR_CITIES, CAR_TYPES, PASSENGER_OPTIONS, GUEST_OPTIONS, ROOM_OPTIONS } from '../utils/constants';

const Home = () => {
  const [activeTab, setActiveTab] = useState<'flights' | 'hotels' | 'cars'>('flights');
  const navigate = useNavigate();

  // Flight search state
  const [flightOrigin, setFlightOrigin] = useState('');
  const [flightDestination, setFlightDestination] = useState('');
  const [flightDepartureDate, setFlightDepartureDate] = useState('');
  const [flightPassengers, setFlightPassengers] = useState('1');
  const [flightClass, setFlightClass] = useState('economy');

  // Hotel search state
  const [hotelCity, setHotelCity] = useState('');
  const [hotelCheckIn, setHotelCheckIn] = useState('');
  const [hotelCheckOut, setHotelCheckOut] = useState('');
  const [hotelGuests, setHotelGuests] = useState('2');
  const [hotelRooms, setHotelRooms] = useState('1');

  // Car search state
  const [carLocation, setCarLocation] = useState('');
  const [carPickupDate, setCarPickupDate] = useState('');
  const [carReturnDate, setCarReturnDate] = useState('');
  const [carType, setCarType] = useState('');

  const handleFlightSearch = () => {
    const params = new URLSearchParams({
      origin: flightOrigin,
      destination: flightDestination,
      departureDate: flightDepartureDate,
      passengers: flightPassengers,
      class: flightClass,
    });
    navigate(`/flights?${params.toString()}`);
  };

  const handleHotelSearch = () => {
    const params = new URLSearchParams({
      city: hotelCity,
      checkIn: hotelCheckIn,
      checkOut: hotelCheckOut,
      guests: hotelGuests,
      rooms: hotelRooms,
    });
    navigate(`/hotels?${params.toString()}`);
  };

  const handleCarSearch = () => {
    const params = new URLSearchParams({
      location: carLocation,
      pickupDate: carPickupDate,
      returnDate: carReturnDate,
      ...(carType && { carType }),
    });
    navigate(`/cars?${params.toString()}`);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 gradient-bg opacity-20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/30 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Your Journey Begins Here
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Discover amazing destinations, book flights, hotels, and cars with ease
            </p>
          </motion.div>

          {/* Search Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-5xl mx-auto glass-strong rounded-3xl p-8 shadow-2xl"
          >
            {/* Tabs */}
            <div className="flex space-x-2 mb-8">
              <button
                onClick={() => setActiveTab('flights')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === 'flights'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'glass text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <Plane className="w-5 h-5" />
                <span>Flights</span>
              </button>
              <button
                onClick={() => setActiveTab('hotels')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === 'hotels'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'glass text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <Hotel className="w-5 h-5" />
                <span>Hotels</span>
              </button>
              <button
                onClick={() => setActiveTab('cars')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === 'cars'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'glass text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <Car className="w-5 h-5" />
                <span>Cars</span>
              </button>
            </div>

            {/* Flight Search Form */}
            {activeTab === 'flights' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="From"
                    value={flightOrigin}
                    onChange={(e) => setFlightOrigin(e.target.value)}
                    options={POPULAR_AIRPORTS}
                    placeholder="Select origin"
                    required
                  />
                  <Select
                    label="To"
                    value={flightDestination}
                    onChange={(e) => setFlightDestination(e.target.value)}
                    options={POPULAR_AIRPORTS}
                    placeholder="Select destination"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <DatePicker
                    label="Departure Date"
                    value={flightDepartureDate}
                    onChange={setFlightDepartureDate}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                  <Select
                    label="Passengers"
                    value={flightPassengers}
                    onChange={(e) => setFlightPassengers(e.target.value)}
                    options={PASSENGER_OPTIONS}
                  />
                  <Select
                    label="Class"
                    value={flightClass}
                    onChange={(e) => setFlightClass(e.target.value)}
                    options={FLIGHT_CLASSES}
                  />
                </div>
                <Button
                  onClick={handleFlightSearch}
                  fullWidth
                  size="lg"
                  disabled={!flightOrigin || !flightDestination || !flightDepartureDate}
                >
                  <Search className="w-5 h-5 mr-2" />
                  Search Flights
                </Button>
              </div>
            )}

            {/* Hotel Search Form */}
            {activeTab === 'hotels' && (
              <div className="space-y-6">
                <Input
                  label="City or Destination"
                  value={hotelCity}
                  onChange={(e) => setHotelCity(e.target.value)}
                  placeholder="Enter city name"
                  required
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DatePicker
                    label="Check-in"
                    value={hotelCheckIn}
                    onChange={setHotelCheckIn}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                  <DatePicker
                    label="Check-out"
                    value={hotelCheckOut}
                    onChange={setHotelCheckOut}
                    min={hotelCheckIn || new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Guests"
                    value={hotelGuests}
                    onChange={(e) => setHotelGuests(e.target.value)}
                    options={GUEST_OPTIONS}
                  />
                  <Select
                    label="Rooms"
                    value={hotelRooms}
                    onChange={(e) => setHotelRooms(e.target.value)}
                    options={ROOM_OPTIONS}
                  />
                </div>
                <Button
                  onClick={handleHotelSearch}
                  fullWidth
                  size="lg"
                  disabled={!hotelCity || !hotelCheckIn || !hotelCheckOut}
                >
                  <Search className="w-5 h-5 mr-2" />
                  Search Hotels
                </Button>
              </div>
            )}

            {/* Car Search Form */}
            {activeTab === 'cars' && (
              <div className="space-y-6">
                <Input
                  label="Pickup Location"
                  value={carLocation}
                  onChange={(e) => setCarLocation(e.target.value)}
                  placeholder="Enter city or airport"
                  required
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DatePicker
                    label="Pickup Date"
                    value={carPickupDate}
                    onChange={setCarPickupDate}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                  <DatePicker
                    label="Return Date"
                    value={carReturnDate}
                    onChange={setCarReturnDate}
                    min={carPickupDate || new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <Select
                  label="Car Type (Optional)"
                  value={carType}
                  onChange={(e) => setCarType(e.target.value)}
                  options={[{ value: '', label: 'Any type' }, ...CAR_TYPES]}
                />
                <Button
                  onClick={handleCarSearch}
                  fullWidth
                  size="lg"
                  disabled={!carLocation || !carPickupDate || !carReturnDate}
                >
                  <Search className="w-5 h-5 mr-2" />
                  Search Cars
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Why Choose TravelVerse?
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              Experience the future of travel booking
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              viewport={{ once: true }}
              className="card text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 mb-6">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-display font-bold mb-4">Best Prices</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Compare thousands of options to find the best deals for your trip
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="card text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 mb-6">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-display font-bold mb-4">Secure Booking</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Your data is protected with industry-leading security measures
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
              className="card text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 mb-6">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-display font-bold mb-4">24/7 Support</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Our team is always here to help you with any questions or issues
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

