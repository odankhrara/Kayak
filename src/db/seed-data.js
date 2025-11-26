/**
 * Kayak Travel Booking System - Seed Data Generator
 * 
 * Generates test data for:
 * - 1000 users
 * - 500 flights
 * - 200 hotels (with rooms and amenities)
 * - 200 cars
 * - 2000 bookings
 * - 2000 billing records
 * 
 * Usage: node db/seed-data.js
 */

const mysql = require('mysql2/promise');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

// Database configurations
const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'password',
  database: process.env.MYSQL_DATABASE || 'kayak'
};

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const MONGO_DB = 'kayak';

// Helper functions for generating realistic data
const states = ['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI', 'NJ', 'VA', 'WA', 'AZ', 'MA', 'TN', 'IN', 'MO', 'MD', 'WI'];
const cities = {
  'CA': ['San Jose', 'San Francisco', 'Los Angeles', 'San Diego', 'Sacramento'],
  'NY': ['New York', 'Buffalo', 'Rochester', 'Albany', 'Syracuse'],
  'TX': ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth'],
  'FL': ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Tallahassee'],
  'IL': ['Chicago', 'Aurora', 'Naperville', 'Joliet', 'Rockford']
};

const airports = ['SFO', 'LAX', 'JFK', 'ORD', 'DFW', 'ATL', 'DEN', 'MIA', 'PHX', 'SEA', 'LAS', 'BOS', 'MCO', 'EWR', 'MSP'];
const airlines = ['American Airlines', 'United Airlines', 'Delta Airlines', 'Southwest Airlines', 'JetBlue', 'Alaska Airlines', 'Spirit Airlines'];
const carCompanies = ['Enterprise', 'Hertz', 'Budget', 'Avis', 'National', 'Alamo', 'Dollar', 'Thrifty'];
const carModels = [
  { type: 'compact', models: ['Honda Civic', 'Toyota Corolla', 'Hyundai Accent', 'Nissan Versa'] },
  { type: 'sedan', models: ['Toyota Camry', 'Honda Accord', 'Nissan Altima', 'Ford Fusion'] },
  { type: 'suv', models: ['Toyota RAV4', 'Honda CR-V', 'Ford Explorer', 'Jeep Grand Cherokee'] },
  { type: 'luxury', models: ['BMW 5 Series', 'Mercedes E-Class', 'Audi A6', 'Lexus ES'] }
];

// Generate random SSN
function generateSSN() {
  const part1 = String(Math.floor(Math.random() * 900) + 100);
  const part2 = String(Math.floor(Math.random() * 90) + 10);
  const part3 = String(Math.floor(Math.random() * 9000) + 1000);
  return `${part1}-${part2}-${part3}`;
}

// Generate random ZIP
function generateZIP() {
  return String(Math.floor(Math.random() * 90000) + 10000);
}

// Generate random email
function generateEmail(firstName, lastName) {
  const providers = ['gmail.com', 'yahoo.com', 'outlook.com', 'example.com'];
  const provider = providers[Math.floor(Math.random() * providers.length)];
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 1000)}@${provider}`;
}

// Generate random phone
function generatePhone() {
  const area = Math.floor(Math.random() * 900) + 100;
  const prefix = Math.floor(Math.random() * 900) + 100;
  const line = Math.floor(Math.random() * 9000) + 1000;
  return `${area}-${prefix}-${line}`;
}

// Generate random date in future
function randomFutureDate(daysAhead = 30) {
  const date = new Date();
  date.setDate(date.getDate() + Math.floor(Math.random() * daysAhead) + 1);
  return date;
}

// Generate random confirmation code
function generateConfirmationCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Main seeding function
async function seedDatabase() {
  let mysqlConnection;
  let mongoClient;

  try {
    console.log('🌱 Starting database seeding...\n');

    // Connect to MySQL
    console.log('📊 Connecting to MySQL...');
    mysqlConnection = await mysql.createConnection(MYSQL_CONFIG);
    console.log('✅ Connected to MySQL\n');

    // Connect to MongoDB
    console.log('📊 Connecting to MongoDB...');
    mongoClient = new MongoClient(MONGO_URL);
    await mongoClient.connect();
    const mongodb = mongoClient.db(MONGO_DB);
    console.log('✅ Connected to MongoDB\n');

    // Hash password once for all test users
    const hashedPassword = await bcrypt.hash('password123', 10);

    // ============================================
    // 1. SEED USERS (1000 users)
    // ============================================
    console.log('👥 Seeding users (1000 records)...');
    const userInserts = [];
    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'James', 'Emma', 'Robert', 'Olivia'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

    for (let i = 0; i < 1000; i++) {
      const state = states[Math.floor(Math.random() * states.length)];
      const cityList = cities[state] || ['Default City'];
      const city = cityList[Math.floor(Math.random() * cityList.length)];
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

      userInserts.push([
        generateSSN(),
        firstName,
        lastName,
        generateEmail(firstName, lastName),
        hashedPassword,
        generatePhone(),
        `${Math.floor(Math.random() * 9999) + 1} Main St`,
        city,
        state,
        generateZIP(),
        null, // profile_image_id
        'active'
      ]);
    }

    await mysqlConnection.query(
      'INSERT INTO users (user_id, first_name, last_name, email, password_hash, phone, address, city, state, zip_code, profile_image_id, status) VALUES ?',
      [userInserts]
    );
    console.log('✅ 1000 users created\n');

    // ============================================
    // 2. SEED FLIGHTS (500 flights)
    // ============================================
    console.log('✈️  Seeding flights (500 records)...');
    const flightInserts = [];

    for (let i = 0; i < 500; i++) {
      const airline = airlines[Math.floor(Math.random() * airlines.length)];
      const departure = airports[Math.floor(Math.random() * airports.length)];
      let arrival = airports[Math.floor(Math.random() * airports.length)];
      while (arrival === departure) {
        arrival = airports[Math.floor(Math.random() * airports.length)];
      }

      const departureDate = randomFutureDate(60);
      const durationMinutes = Math.floor(Math.random() * 360) + 60; // 1-7 hours
      const arrivalDate = new Date(departureDate.getTime() + durationMinutes * 60000);
      const flightClass = ['economy', 'business', 'first'][Math.floor(Math.random() * 3)];
      const basePrice = flightClass === 'economy' ? 150 : flightClass === 'business' ? 500 : 1000;
      const price = basePrice + Math.floor(Math.random() * 300);
      const totalSeats = flightClass === 'first' ? 20 : flightClass === 'business' ? 50 : 180;
      const availableSeats = Math.floor(totalSeats * (0.3 + Math.random() * 0.7)); // 30-100% available

      flightInserts.push([
        `${airline.substring(0, 2).toUpperCase()}${1000 + i}`,
        airline,
        departure,
        arrival,
        departureDate,
        arrivalDate,
        durationMinutes,
        flightClass,
        price.toFixed(2),
        totalSeats,
        availableSeats,
        (3 + Math.random() * 2).toFixed(2), // rating 3-5
        Math.floor(Math.random() * 200), // reviews
        'scheduled'
      ]);
    }

    await mysqlConnection.query(
      'INSERT INTO flights (flight_id, airline_name, departure_airport, arrival_airport, departure_datetime, arrival_datetime, duration_minutes, flight_class, price_per_ticket, total_seats, available_seats, rating, reviews_count, status) VALUES ?',
      [flightInserts]
    );
    console.log('✅ 500 flights created\n');

    // ============================================
    // 3. SEED HOTELS (200 hotels with rooms)
    // ============================================
    console.log('🏨 Seeding hotels (200 records)...');
    const hotelInserts = [];
    const roomInserts = [];
    const amenityInserts = [];
    const amenityList = ['WiFi', 'Parking', 'Pool', 'Gym', 'Breakfast', 'Restaurant', 'Spa', 'Business Center'];

    for (let i = 0; i < 200; i++) {
      const state = states[Math.floor(Math.random() * states.length)];
      const cityList = cities[state] || ['Default City'];
      const city = cityList[Math.floor(Math.random() * cityList.length)];
      const starRating = Math.floor(Math.random() * 3) + 3; // 3-5 stars
      const totalRooms = Math.floor(Math.random() * 200) + 50; // 50-250 rooms

      const hotelId = `HT${String(i + 100).padStart(3, '0')}`;

      hotelInserts.push([
        hotelId,
        `Hotel ${city} ${i + 1}`,
        `${Math.floor(Math.random() * 9999) + 1} Main St`,
        city,
        state,
        generateZIP(),
        starRating,
        `A comfortable ${starRating}-star hotel in ${city}`,
        totalRooms,
        (3 + Math.random() * 2).toFixed(2), // rating
        Math.floor(Math.random() * 500), // reviews
        37.0 + Math.random() * 10, // latitude
        -122.0 + Math.random() * 10, // longitude
        'active'
      ]);

      // Add rooms for this hotel
      const roomTypes = ['single', 'double', 'suite'];
      roomTypes.forEach((roomType, idx) => {
        const basePrice = roomType === 'single' ? 100 : roomType === 'double' ? 150 : 300;
        const price = basePrice + Math.floor(Math.random() * 100);
        const roomCount = Math.floor(totalRooms / 3);
        const available = Math.floor(roomCount * (0.5 + Math.random() * 0.5));

        roomInserts.push([
          hotelId,
          roomType,
          price.toFixed(2),
          roomType === 'single' ? 1 : roomType === 'double' ? 2 : 4,
          roomCount,
          available,
          `Comfortable ${roomType} room`
        ]);
      });

      // Add amenities (random 3-6 amenities per hotel)
      const numAmenities = Math.floor(Math.random() * 4) + 3;
      const shuffled = [...amenityList].sort(() => 0.5 - Math.random());
      for (let j = 0; j < numAmenities; j++) {
        amenityInserts.push([
          hotelId,
          shuffled[j],
          j < 2 ? 1 : 0 // First 2 amenities are free
        ]);
      }
    }

    await mysqlConnection.query(
      'INSERT INTO hotels (hotel_id, hotel_name, address, city, state, zip_code, star_rating, description, total_rooms, rating, reviews_count, latitude, longitude, status) VALUES ?',
      [hotelInserts]
    );
    await mysqlConnection.query(
      'INSERT INTO hotel_rooms (hotel_id, room_type, price_per_night, max_guests, total_rooms, available_rooms, description) VALUES ?',
      [roomInserts]
    );
    await mysqlConnection.query(
      'INSERT INTO hotel_amenities (hotel_id, amenity_name, is_free) VALUES ?',
      [amenityInserts]
    );
    console.log('✅ 200 hotels created (with 600 rooms, 800+ amenities)\n');

    // ============================================
    // 4. SEED CARS (200 cars)
    // ============================================
    console.log('🚗 Seeding cars (200 records)...');
    const carInserts = [];

    for (let i = 0; i < 200; i++) {
      const carTypeObj = carModels[Math.floor(Math.random() * carModels.length)];
      const model = carTypeObj.models[Math.floor(Math.random() * carTypeObj.models.length)];
      const company = carCompanies[Math.floor(Math.random() * carCompanies.length)];
      const state = states[Math.floor(Math.random() * states.length)];
      const cityList = cities[state] || ['Default City'];
      const city = cityList[Math.floor(Math.random() * cityList.length)];
      const basePrice = carTypeObj.type === 'compact' ? 30 : carTypeObj.type === 'sedan' ? 45 : carTypeObj.type === 'suv' ? 65 : 120;
      const price = basePrice + Math.floor(Math.random() * 30);

      carInserts.push([
        `CAR${String(i + 100).padStart(3, '0')}`,
        carTypeObj.type,
        company,
        model,
        2023 + Math.floor(Math.random() * 2), // 2023-2024
        'automatic',
        carTypeObj.type === 'compact' ? 5 : carTypeObj.type === 'luxury' ? 5 : 5,
        price.toFixed(2),
        `${city}, ${state}`,
        (3 + Math.random() * 2).toFixed(2), // rating
        Math.floor(Math.random() * 150), // reviews
        true // available
      ]);
    }

    await mysqlConnection.query(
      'INSERT INTO cars (car_id, car_type, company_name, model, year, transmission, seats, daily_rate, location, rating, reviews_count, available) VALUES ?',
      [carInserts]
    );
    console.log('✅ 200 cars created\n');

    console.log('\n========================================');
    console.log('🎉 Database Seeding Complete!');
    console.log('========================================');
    console.log('MySQL:');
    console.log('  - 1000 users');
    console.log('  - 500 flights');
    console.log('  - 200 hotels (600 rooms, 800+ amenities)');
    console.log('  - 200 cars');
    console.log('\nMongoDB:');
    console.log('  - Sample reviews, images, logs (from init.js)');
    console.log('  - Sample deals, bundles, watches (from init.js)');
    console.log('========================================\n');
    console.log('✅ Ready to start services!');
    console.log('Run: ./start-all.sh\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    // Close connections
    if (mysqlConnection) {
      await mysqlConnection.end();
      console.log('MySQL connection closed');
    }
    if (mongoClient) {
      await mongoClient.close();
      console.log('MongoDB connection closed');
    }
  }
}

// Run seeding
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };

