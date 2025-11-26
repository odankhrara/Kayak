// US States
export const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
];

export const PAYMENT_METHODS = [
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'paypal', label: 'PayPal' },
];

export const BOOKING_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'yellow' },
  { value: 'confirmed', label: 'Confirmed', color: 'green' },
  { value: 'cancelled', label: 'Cancelled', color: 'red' },
  { value: 'completed', label: 'Completed', color: 'blue' },
];

export const SORT_OPTIONS = {
  flight: [
    { value: 'price', label: 'Price: Low to High' },
    { value: 'departure_datetime', label: 'Departure Time' },
    { value: 'duration_minutes', label: 'Duration' },
    { value: 'flight_rating', label: 'Rating' },
  ],
  hotel: [
    { value: 'price', label: 'Price: Low to High' },
    { value: 'star_rating', label: 'Star Rating' },
    { value: 'hotel_rating', label: 'Guest Rating' },
    { value: 'hotel_name', label: 'Name' },
  ],
  car: [
    { value: 'price', label: 'Price: Low to High' },
    { value: 'car_type', label: 'Car Type' },
    { value: 'car_rating', label: 'Rating' },
  ],
};

export const STAR_RATINGS = [5, 4, 3, 2, 1];

export const CAR_TYPES = [
  { value: 'sedan', label: 'Sedan' },
  { value: 'suv', label: 'SUV' },
  { value: 'compact', label: 'Compact' },
  { value: 'luxury', label: 'Luxury' },
  { value: 'van', label: 'Van' },
];

export const TRANSMISSION_TYPES = [
  { value: 'automatic', label: 'Automatic' },
  { value: 'manual', label: 'Manual' },
];

// Popular airports (IATA codes)
export const POPULAR_AIRPORTS = [
  { value: 'ATL', label: 'ATL - Atlanta' },
  { value: 'DFW', label: 'DFW - Dallas/Fort Worth' },
  { value: 'DEN', label: 'DEN - Denver' },
  { value: 'ORD', label: 'ORD - Chicago O\'Hare' },
  { value: 'LAX', label: 'LAX - Los Angeles' },
  { value: 'JFK', label: 'JFK - New York JFK' },
  { value: 'LAS', label: 'LAS - Las Vegas' },
  { value: 'MCO', label: 'MCO - Orlando' },
  { value: 'MIA', label: 'MIA - Miami' },
  { value: 'SEA', label: 'SEA - Seattle' },
  { value: 'SFO', label: 'SFO - San Francisco' },
  { value: 'PHX', label: 'PHX - Phoenix' },
  { value: 'BOS', label: 'BOS - Boston' },
  { value: 'IAH', label: 'IAH - Houston' },
  { value: 'SAN', label: 'SAN - San Diego' },
];

// Flight classes
export const FLIGHT_CLASSES = [
  { value: 'economy', label: 'Economy' },
  { value: 'business', label: 'Business' },
  { value: 'first', label: 'First Class' },
];

// Car types
export const CAR_TYPES = [
  { value: 'compact', label: 'Compact' },
  { value: 'sedan', label: 'Sedan' },
  { value: 'suv', label: 'SUV' },
  { value: 'luxury', label: 'Luxury' },
  { value: 'van', label: 'Van' },
  { value: 'truck', label: 'Truck' },
];

// Transmission types
export const TRANSMISSION_TYPES = [
  { value: 'automatic', label: 'Automatic' },
  { value: 'manual', label: 'Manual' },
];

// Hotel amenities
export const HOTEL_AMENITIES = [
  { value: 'wifi', label: 'Free Wi-Fi' },
  { value: 'parking', label: 'Free Parking' },
  { value: 'breakfast', label: 'Breakfast Included' },
  { value: 'pool', label: 'Swimming Pool' },
  { value: 'gym', label: 'Fitness Center' },
  { value: 'spa', label: 'Spa' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'bar', label: 'Bar/Lounge' },
  { value: 'pet-friendly', label: 'Pet Friendly' },
  { value: 'business-center', label: 'Business Center' },
  { value: 'air-conditioning', label: 'Air Conditioning' },
  { value: 'room-service', label: '24/7 Room Service' },
];

// Payment methods
export const PAYMENT_METHODS = [
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'paypal', label: 'PayPal' },
];

// Booking statuses
export const BOOKING_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'yellow' },
  { value: 'confirmed', label: 'Confirmed', color: 'green' },
  { value: 'cancelled', label: 'Cancelled', color: 'red' },
  { value: 'completed', label: 'Completed', color: 'blue' },
];

// Sort options for search results
export const SORT_OPTIONS = {
  flight: [
    { value: 'price', label: 'Price: Low to High' },
    { value: 'duration', label: 'Duration: Shortest' },
    { value: 'rating', label: 'Rating: Highest' },
    { value: 'departure_time', label: 'Departure Time' },
  ],
  hotel: [
    { value: 'price', label: 'Price: Low to High' },
    { value: 'rating', label: 'Rating: Highest' },
    { value: 'stars', label: 'Star Rating: Highest' },
  ],
  car: [
    { value: 'price', label: 'Price: Low to High' },
    { value: 'rating', label: 'Rating: Highest' },
  ],
};

// Number of passengers/guests/rooms options
export const PASSENGER_OPTIONS = Array.from({ length: 9 }, (_, i) => ({
  value: (i + 1).toString(),
  label: `${i + 1} ${i === 0 ? 'Passenger' : 'Passengers'}`,
}));

export const GUEST_OPTIONS = Array.from({ length: 20 }, (_, i) => ({
  value: (i + 1).toString(),
  label: `${i + 1} ${i === 0 ? 'Guest' : 'Guests'}`,
}));

export const ROOM_OPTIONS = Array.from({ length: 10 }, (_, i) => ({
  value: (i + 1).toString(),
  label: `${i + 1} ${i === 0 ? 'Room' : 'Rooms'}`,
}));

// Star ratings
export const STAR_RATINGS = [1, 2, 3, 4, 5];

// Popular cities for hotels
export const POPULAR_CITIES = [
  'New York',
  'Los Angeles',
  'Chicago',
  'Houston',
  'Phoenix',
  'Philadelphia',
  'San Antonio',
  'San Diego',
  'Dallas',
  'San Jose',
  'Austin',
  'Jacksonville',
  'San Francisco',
  'Seattle',
  'Denver',
  'Miami',
  'Las Vegas',
  'Boston',
  'Portland',
  'Nashville',
];

