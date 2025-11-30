import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, Hotel, Car, Search, TrendingUp, Shield, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import DatePicker from '../components/common/DatePicker';
import { POPULAR_AIRPORTS, FLIGHT_CLASSES, POPULAR_CITIES, CAR_TYPES, PASSENGER_OPTIONS, GUEST_OPTIONS, ROOM_OPTIONS } from '../utils/constants';
import { useAuthStore } from '../store/authStore';

const Home = () => {
  const [activeTab, setActiveTab] = useState<'flights' | 'hotels' | 'cars'>('flights');
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.isAdmin;

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
    // Validate check-out is after check-in
    if (hotelCheckIn && hotelCheckOut) {
      const checkInDateObj = new Date(hotelCheckIn);
      const checkOutDateObj = new Date(hotelCheckOut);
      
      if (checkOutDateObj <= checkInDateObj) {
        toast.error('Check-out date must be after check-in date');
        return;
      }
    }
    
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
        {/* Real Beach Background Image - High Quality */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=2400&h=1600&q=95&fit=crop&fm=webp')`,
          }}
        >
          {/* Overlay to ensure text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-transparent to-purple-900/10"></div>
        </div>
        
        {/* Light overlay to soften and make content stand out */}
        <div className="absolute inset-0 bg-white/25 backdrop-blur-[2px]"></div>
        
        {/* Animated gradient overlay for depth */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-20 w-[500px] h-[500px] bg-cyan-300/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-8">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab('flights')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === 'flights'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'glass text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="relative">
                  <Plane className="w-5 h-5 relative z-10 transform -rotate-45" />
                  {/* Animated trajectory trail */}
                  <div className="absolute -bottom-1 -right-1 w-8 h-0.5 opacity-60">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-current to-transparent animate-pulse"></div>
                    <div className="absolute top-0 left-0 w-1 h-1 rounded-full bg-current animate-ping"></div>
                    <div className="absolute top-0 left-2 w-0.5 h-0.5 rounded-full bg-current opacity-70"></div>
                    <div className="absolute top-0 left-4 w-0.5 h-0.5 rounded-full bg-current opacity-50"></div>
                    <div className="absolute top-0 left-6 w-0.5 h-0.5 rounded-full bg-current opacity-30"></div>
                  </div>
                </div>
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
                <div className="relative">
                  <Hotel className="w-5 h-5 relative z-10" />
                  {/* Animated sparkles */}
                  <div className="absolute -top-1 -right-1 w-1.5 h-1.5">
                    <div className="absolute inset-0 bg-current rounded-full animate-ping"></div>
                    <div className="absolute inset-0 bg-current rounded-full"></div>
                  </div>
                  <div className="absolute -bottom-1 -left-1 w-1 h-1 bg-current rounded-full animate-pulse opacity-70"></div>
                  <div className="absolute top-0 -left-2 w-0.5 h-0.5 bg-current rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                </div>
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
                <div className="relative inline-flex items-center">
                  <Car className="w-5 h-5 relative z-10" style={{ transform: 'scale(1.25)' }} />
                  {/* Animated exhaust smoke */}
                  <div className="absolute -bottom-0.5 -left-3 flex space-x-0.5">
                    <div className="w-1.5 h-1.5 bg-current rounded-full opacity-40 animate-pulse"></div>
                    <div className="w-1 h-1 bg-current rounded-full opacity-30 animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                    <div className="w-0.5 h-0.5 bg-current rounded-full opacity-20 animate-pulse" style={{ animationDelay: '0.6s' }}></div>
                  </div>
                  {/* Wheel motion effect */}
                  <div className="absolute -bottom-1 left-0 w-1 h-0.5 bg-current rounded-full opacity-50 animate-ping"></div>
                </div>
                <span>Cars</span>
              </button>
            </div>

            {isAdmin && (
              <Button
                variant="secondary"
                onClick={() => navigate('/admin/dashboard')}
                className="md:self-end"
              >
                Dashboard
              </Button>
            )}
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
                    onChange={(value) => {
                      setHotelCheckIn(value);
                      // If check-out is before or equal to new check-in, clear check-out
                      if (hotelCheckOut && value >= hotelCheckOut) {
                        setHotelCheckOut('');
                      }
                    }}
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
      <section className="relative py-20 overflow-hidden">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-15" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 10 L35 25 L50 25 L38 33 L42 48 L30 40 L18 48 L22 33 L10 25 L25 25 Z' fill='%236366f1' fill-opacity='0.2'/%3E%3C/svg%3E")`,
          backgroundSize: '120px 120px'
        }}></div>
        
        {/* Elegant geometric decorations */}
        <div className="absolute inset-0 overflow-hidden opacity-15">
          <div className="absolute top-[20%] right-[12%] w-28 h-28 rounded-full border border-blue-500/30 animate-float" style={{ animationDuration: '22s', animationDelay: '1s' }}></div>
          <div className="absolute bottom-[28%] left-[18%] w-20 h-20 bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-sm rounded-lg transform rotate-45 animate-float" style={{ animationDuration: '26s', animationDelay: '3s' }}></div>
          <div className="absolute top-[52%] left-[8%] w-24 h-24 border-2 border-purple-500/20 transform rotate-12 animate-float" style={{ animationDuration: '24s', animationDelay: '2s' }}></div>
          <div className="absolute bottom-[15%] right-[20%] w-3 h-3 rounded-full bg-blue-500/50 animate-pulse" style={{ animationDuration: '3s' }}></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
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
