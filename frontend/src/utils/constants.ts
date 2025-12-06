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

// Removed duplicate exports - keeping the more complete versions below

// Popular airports (IATA codes) - All airports available in database
// Based on actual airports in the flights table
export const POPULAR_AIRPORTS = [
  // Major US Hubs (most popular)
  { value: 'BOS', label: 'BOS - Boston' },
  { value: 'LAS', label: 'LAS - Las Vegas' },
  { value: 'SEA', label: 'SEA - Seattle' },
  { value: 'LAX', label: 'LAX - Los Angeles' },
  { value: 'ORD', label: 'ORD - Chicago O\'Hare' },
  { value: 'PHX', label: 'PHX - Phoenix' },
  { value: 'SFO', label: 'SFO - San Francisco' },
  { value: 'DEN', label: 'DEN - Denver' },
  { value: 'SJU', label: 'SJU - San Juan' },
  { value: 'PDX', label: 'PDX - Portland' },
  { value: 'HNL', label: 'HNL - Honolulu' },
  { value: 'MCI', label: 'MCI - Kansas City' },
  { value: 'ANC', label: 'ANC - Anchorage' },
  { value: 'MKE', label: 'MKE - Milwaukee' },
  { value: 'JFK', label: 'JFK - New York JFK' },
  { value: 'MCO', label: 'MCO - Orlando' },
  { value: 'BNA', label: 'BNA - Nashville' },
  { value: 'MSP', label: 'MSP - Minneapolis' },
  { value: 'GEG', label: 'GEG - Spokane' },
  { value: 'SMF', label: 'SMF - Sacramento' },
  { value: 'DFW', label: 'DFW - Dallas/Fort Worth' },
  { value: 'SAT', label: 'SAT - San Antonio' },
  { value: 'BQN', label: 'BQN - Aguadilla' },
  { value: 'OMA', label: 'OMA - Omaha' },
  { value: 'PHL', label: 'PHL - Philadelphia' },
  { value: 'BUF', label: 'BUF - Buffalo' },
  { value: 'EWR', label: 'EWR - Newark' },
  { value: 'SLC', label: 'SLC - Salt Lake City' },
  { value: 'ONT', label: 'ONT - Ontario' },
  { value: 'AUS', label: 'AUS - Austin' },
  { value: 'CHS', label: 'CHS - Charleston' },
  
  // Additional airports
  { value: 'ATL', label: 'ATL - Atlanta' },
  { value: 'IAH', label: 'IAH - Houston' },
  { value: 'MIA', label: 'MIA - Miami' },
  { value: 'DTW', label: 'DTW - Detroit' },
  { value: 'CLT', label: 'CLT - Charlotte' },
  { value: 'FLL', label: 'FLL - Fort Lauderdale' },
  { value: 'IAD', label: 'IAD - Washington Dulles' },
  { value: 'DCA', label: 'DCA - Washington Reagan' },
  { value: 'TPA', label: 'TPA - Tampa' },
  { value: 'PBI', label: 'PBI - West Palm Beach' },
  { value: 'RSW', label: 'RSW - Fort Myers' },
  { value: 'RNO', label: 'RNO - Reno' },
  { value: 'PIT', label: 'PIT - Pittsburgh' },
  { value: 'IND', label: 'IND - Indianapolis' },
  { value: 'OAK', label: 'OAK - Oakland' },
  { value: 'RIC', label: 'RIC - Richmond' },
  { value: 'FAI', label: 'FAI - Fairbanks' },
  { value: 'JAX', label: 'JAX - Jacksonville' },
  { value: 'BDL', label: 'BDL - Hartford' },
  { value: 'CLE', label: 'CLE - Cleveland' },
  { value: 'LGA', label: 'LGA - New York LaGuardia' },
  { value: 'BWI', label: 'BWI - Baltimore' },
  
  // International
  { value: 'DEL', label: 'DEL - Delhi' },
  { value: 'BOM', label: 'BOM - Mumbai' },
  
  // Smaller regional airports (sorted alphabetically)
  { value: 'ABI', label: 'ABI - Abilene' },
  { value: 'ABR', label: 'ABR - Aberdeen' },
  { value: 'BFL', label: 'BFL - Bakersfield' },
  { value: 'BJI', label: 'BJI - Bemidji' },
  { value: 'BOI', label: 'BOI - Boise' },
  { value: 'BRO', label: 'BRO - Brownsville' },
  { value: 'CID', label: 'CID - Cedar Rapids' },
  { value: 'CRP', label: 'CRP - Corpus Christi' },
  { value: 'EUG', label: 'EUG - Eugene' },
  { value: 'FAT', label: 'FAT - Fresno' },
  { value: 'GSO', label: 'GSO - Greensboro' },
  { value: 'GSP', label: 'GSP - Greenville' },
  { value: 'HIB', label: 'HIB - Hibbing' },
  { value: 'IAG', label: 'IAG - Niagara Falls' },
  { value: 'IDA', label: 'IDA - Idaho Falls' },
  { value: 'ITO', label: 'ITO - Hilo' },
  { value: 'KOA', label: 'KOA - Kona' },
  { value: 'LAN', label: 'LAN - Lansing' },
  { value: 'LIH', label: 'LIH - Lihue' },
  { value: 'MAF', label: 'MAF - Midland' },
  { value: 'MFR', label: 'MFR - Medford' },
  { value: 'MSN', label: 'MSN - Madison' },
  { value: 'MYR', label: 'MYR - Myrtle Beach' },
  { value: 'OGG', label: 'OGG - Kahului' },
  { value: 'PBG', label: 'PBG - Plattsburgh' },
  { value: 'PIA', label: 'PIA - Peoria' },
  { value: 'PSE', label: 'PSE - Ponce' },
  { value: 'PWM', label: 'PWM - Portland' },
  { value: 'RDD', label: 'RDD - Redding' },
  { value: 'RDM', label: 'RDM - Redmond' },
  { value: 'ROC', label: 'ROC - Rochester' },
  { value: 'SBA', label: 'SBA - Santa Barbara' },
  { value: 'SBN', label: 'SBN - South Bend' },
  { value: 'SGF', label: 'SGF - Springfield' },
  { value: 'SMX', label: 'SMX - Santa Maria' },
  { value: 'SYR', label: 'SYR - Syracuse' },
  { value: 'TYR', label: 'TYR - Tyler' },
  { value: 'VPS', label: 'VPS - Destin' },
  { value: 'XNA', label: 'XNA - Fayetteville' },
  { value: 'PVD', label: 'PVD - Providence' },
].sort((a, b) => a.value.localeCompare(b.value));

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

// Star ratings (descending order for filters)
export const STAR_RATINGS = [5, 4, 3, 2, 1];

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

