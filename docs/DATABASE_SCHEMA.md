# Kayak Simulation - Database Schema Design

**Version:** 1.0  
**Date:** November 25, 2025

---

## Table of Contents
1. [Database Distribution Strategy](#database-distribution-strategy)
2. [MySQL Schemas](#mysql-schemas)
3. [MongoDB Collections](#mongodb-collections)
4. [Indexing Strategy](#indexing-strategy)
5. [Database Creation Scripts](#database-creation-scripts)
6. [ER Diagram](#er-diagram)

---

## Database Distribution Strategy

### MySQL (Relational Data)
**Use Cases:** Structured data, transactional consistency, complex relationships

**Tables:**
- Users (core user information)
- Flights (structured flight data)
- Hotels (structured hotel data)
- Cars (structured car data)
- Bookings (reservation data)
- Billing (transaction records)
- Admin (administrator accounts)

**Justification:** These entities require ACID transactions, foreign key relationships, and complex joins for analytics.

---

### MongoDB (Document Store)
**Use Cases:** Unstructured/semi-structured data, high write throughput, flexible schema

**Collections:**
- reviews (user reviews for flights, hotels, cars)
- images (profile images, property images, car images)
- logs (user activity, clicks, analytics events)
- deals (AI recommendation system deals)
- bundles (AI-generated travel bundles)

**Justification:** These entities have variable structure, high write volume, and don't require complex joins.

---

## MySQL Schemas

### 1. Users Table

```sql
CREATE TABLE users (
    user_id VARCHAR(11) PRIMARY KEY COMMENT 'SSN format: XXX-XX-XXXX',
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address VARCHAR(255),
    city VARCHAR(100),
    state CHAR(2) COMMENT 'US state abbreviation',
    zip_code VARCHAR(10) COMMENT 'Format: ##### or #####-####',
    profile_image_id VARCHAR(50) COMMENT 'Reference to MongoDB images collection',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    
    INDEX idx_email (email),
    INDEX idx_city_state (city, state),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 2. Credit Cards Table

```sql
CREATE TABLE credit_cards (
    card_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(11) NOT NULL,
    card_number_encrypted VARCHAR(255) NOT NULL,
    card_holder_name VARCHAR(200) NOT NULL,
    expiry_month TINYINT NOT NULL,
    expiry_year SMALLINT NOT NULL,
    cvv_encrypted VARCHAR(255) NOT NULL,
    card_type ENUM('visa', 'mastercard', 'amex', 'discover') NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 3. Flights Table

```sql
CREATE TABLE flights (
    flight_id VARCHAR(10) PRIMARY KEY COMMENT 'e.g., AA123',
    airline_name VARCHAR(100) NOT NULL,
    departure_airport CHAR(3) NOT NULL COMMENT 'IATA code',
    arrival_airport CHAR(3) NOT NULL COMMENT 'IATA code',
    departure_datetime DATETIME NOT NULL,
    arrival_datetime DATETIME NOT NULL,
    duration_minutes INT NOT NULL,
    flight_class ENUM('economy', 'business', 'first') NOT NULL,
    price_per_ticket DECIMAL(10, 2) NOT NULL,
    total_seats INT NOT NULL,
    available_seats INT NOT NULL,
    rating DECIMAL(3, 2) DEFAULT 0.00,
    reviews_count INT DEFAULT 0,
    status ENUM('scheduled', 'cancelled', 'delayed', 'completed') DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_route (departure_airport, arrival_airport),
    INDEX idx_departure_date (departure_datetime),
    INDEX idx_price (price_per_ticket),
    INDEX idx_class (flight_class),
    INDEX idx_airline (airline_name),
    INDEX idx_available_seats (available_seats),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 4. Hotels Table

```sql
CREATE TABLE hotels (
    hotel_id VARCHAR(20) PRIMARY KEY,
    hotel_name VARCHAR(200) NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state CHAR(2) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    star_rating TINYINT CHECK (star_rating BETWEEN 1 AND 5),
    description TEXT,
    total_rooms INT NOT NULL,
    rating DECIMAL(3, 2) DEFAULT 0.00,
    reviews_count INT DEFAULT 0,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('active', 'inactive') DEFAULT 'active',
    
    INDEX idx_city_state (city, state),
    INDEX idx_star_rating (star_rating),
    INDEX idx_rating (rating),
    FULLTEXT idx_name_description (hotel_name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 5. Hotel Rooms Table

```sql
CREATE TABLE hotel_rooms (
    room_id INT PRIMARY KEY AUTO_INCREMENT,
    hotel_id VARCHAR(20) NOT NULL,
    room_type ENUM('single', 'double', 'suite', 'deluxe', 'penthouse') NOT NULL,
    price_per_night DECIMAL(10, 2) NOT NULL,
    max_guests TINYINT NOT NULL,
    total_rooms INT NOT NULL,
    available_rooms INT NOT NULL,
    description TEXT,
    
    FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id) ON DELETE CASCADE,
    INDEX idx_hotel_id (hotel_id),
    INDEX idx_price (price_per_night),
    INDEX idx_room_type (room_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 6. Hotel Amenities Table

```sql
CREATE TABLE hotel_amenities (
    amenity_id INT PRIMARY KEY AUTO_INCREMENT,
    hotel_id VARCHAR(20) NOT NULL,
    amenity_name VARCHAR(100) NOT NULL COMMENT 'e.g., WiFi, Pool, Parking, Breakfast',
    is_free BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id) ON DELETE CASCADE,
    INDEX idx_hotel_id (hotel_id),
    INDEX idx_amenity_name (amenity_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 7. Cars Table

```sql
CREATE TABLE cars (
    car_id VARCHAR(20) PRIMARY KEY,
    car_type ENUM('suv', 'sedan', 'compact', 'luxury', 'van', 'truck') NOT NULL,
    company_name VARCHAR(100) NOT NULL COMMENT 'e.g., Enterprise, Hertz',
    model VARCHAR(100) NOT NULL,
    year YEAR NOT NULL,
    transmission ENUM('automatic', 'manual') NOT NULL,
    seats TINYINT NOT NULL,
    daily_rate DECIMAL(10, 2) NOT NULL,
    location VARCHAR(200) NOT NULL,
    rating DECIMAL(3, 2) DEFAULT 0.00,
    reviews_count INT DEFAULT 0,
    available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_location (location),
    INDEX idx_car_type (car_type),
    INDEX idx_daily_rate (daily_rate),
    INDEX idx_company (company_name),
    INDEX idx_available (available)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 8. Bookings Table

```sql
CREATE TABLE bookings (
    booking_id VARCHAR(20) PRIMARY KEY,
    user_id VARCHAR(11) NOT NULL,
    booking_type ENUM('flight', 'hotel', 'car') NOT NULL,
    booking_reference VARCHAR(50) NOT NULL COMMENT 'flight_id, hotel_id, or car_id',
    confirmation_code VARCHAR(20) UNIQUE NOT NULL,
    status ENUM('confirmed', 'cancelled', 'completed', 'pending') DEFAULT 'pending',
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    start_date DATE NOT NULL,
    end_date DATE,
    guests INT DEFAULT 1,
    total_amount DECIMAL(10, 2) NOT NULL,
    special_requests TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_booking_type (booking_type),
    INDEX idx_status (status),
    INDEX idx_start_date (start_date),
    INDEX idx_confirmation_code (confirmation_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 9. Flight Bookings Details Table

```sql
CREATE TABLE flight_booking_details (
    detail_id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id VARCHAR(20) NOT NULL,
    flight_id VARCHAR(10) NOT NULL,
    passenger_first_name VARCHAR(100) NOT NULL,
    passenger_last_name VARCHAR(100) NOT NULL,
    passenger_dob DATE NOT NULL,
    passport_number VARCHAR(50),
    seat_number VARCHAR(10),
    
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (flight_id) REFERENCES flights(flight_id),
    INDEX idx_booking_id (booking_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 10. Billing Table

```sql
CREATE TABLE billing (
    billing_id VARCHAR(20) PRIMARY KEY,
    user_id VARCHAR(11) NOT NULL,
    booking_id VARCHAR(20) NOT NULL,
    booking_type ENUM('flight', 'hotel', 'car') NOT NULL,
    transaction_id VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('credit_card', 'debit_card', 'paypal', 'apple_pay') NOT NULL,
    transaction_status ENUM('pending', 'completed', 'failed', 'refunded') NOT NULL,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    invoice_id VARCHAR(50),
    
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id),
    INDEX idx_user_id (user_id),
    INDEX idx_booking_id (booking_id),
    INDEX idx_transaction_date (transaction_date),
    INDEX idx_transaction_status (transaction_status),
    INDEX idx_amount (total_amount)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 11. Admin Table

```sql
CREATE TABLE admin (
    admin_id VARCHAR(20) PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address VARCHAR(255),
    city VARCHAR(100),
    state CHAR(2),
    zip_code VARCHAR(10),
    role ENUM('super_admin', 'admin', 'analyst', 'support') DEFAULT 'admin',
    access_level INT DEFAULT 1 COMMENT '1=basic, 5=full access',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## MongoDB Collections

### 1. Reviews Collection

```javascript
// reviews collection schema
{
  _id: ObjectId,
  review_id: "REV001",
  user_id: "123-45-6789",
  listing_type: "flight|hotel|car",
  listing_id: "AA123|HT001|CAR001",
  rating: 5,  // 1-5
  title: "Great flight!",
  comment: "Had an excellent experience...",
  helpful_count: 10,
  created_at: ISODate("2025-11-25T10:30:00Z"),
  updated_at: ISODate("2025-11-25T10:30:00Z"),
  verified_booking: true
}

// Indexes
db.reviews.createIndex({ listing_id: 1, listing_type: 1 })
db.reviews.createIndex({ user_id: 1 })
db.reviews.createIndex({ rating: -1 })
db.reviews.createIndex({ created_at: -1 })
```

---

### 2. Images Collection

```javascript
// images collection schema
{
  _id: ObjectId,
  image_id: "IMG001",
  image_type: "profile|hotel|car|property",
  entity_id: "123-45-6789|HT001|CAR001",
  image_url: "https://cdn.kayak-sim.com/images/IMG001.jpg",
  thumbnail_url: "https://cdn.kayak-sim.com/images/IMG001_thumb.jpg",
  alt_text: "Hotel lobby",
  order: 1,
  is_primary: true,
  file_size: 2048576,  // bytes
  dimensions: {
    width: 1920,
    height: 1080
  },
  uploaded_at: ISODate("2025-11-25T10:30:00Z"),
  metadata: {
    photographer: "John Doe",
    location: "San Jose, CA"
  }
}

// Indexes
db.images.createIndex({ entity_id: 1, image_type: 1 })
db.images.createIndex({ is_primary: 1 })
```

---

### 3. Logs Collection

```javascript
// logs collection schema
{
  _id: ObjectId,
  log_id: "LOG001",
  log_type: "user_activity|page_view|click|search|booking_attempt|error",
  user_id: "123-45-6789",
  session_id: "sess_abc123",
  timestamp: ISODate("2025-11-25T10:30:00Z"),
  
  // For page views
  page_url: "/hotels/search",
  page_title: "Hotel Search Results",
  referrer: "/home",
  
  // For clicks
  element_type: "button|link|card",
  element_id: "book-now-btn",
  element_text: "Book Now",
  
  // For searches
  search_params: {
    type: "hotel",
    city: "San Jose",
    check_in: "2025-12-10",
    check_out: "2025-12-15"
  },
  results_count: 25,
  
  // User info
  user_agent: "Mozilla/5.0...",
  ip_address: "192.168.1.1",
  device_type: "desktop|mobile|tablet",
  
  // Location
  location: {
    city: "San Jose",
    state: "CA",
    country: "USA"
  },
  
  // Performance
  page_load_time: 1.5,  // seconds
  
  // Additional metadata
  metadata: {}
}

// Indexes
db.logs.createIndex({ user_id: 1, timestamp: -1 })
db.logs.createIndex({ session_id: 1 })
db.logs.createIndex({ log_type: 1, timestamp: -1 })
db.logs.createIndex({ timestamp: -1 })
db.logs.createIndex({ "location.city": 1, "location.state": 1 })

// TTL index - auto-delete logs older than 90 days
db.logs.createIndex({ timestamp: 1 }, { expireAfterSeconds: 7776000 })
```

---

### 4. Deals Collection (AI Service)

```javascript
// deals collection schema
{
  _id: ObjectId,
  deal_id: "DEAL001",
  listing_type: "flight|hotel",
  listing_id: "AA123|HT001",
  
  // Pricing
  current_price: 120.00,
  original_price: 150.00,
  avg_30d_price: 145.00,
  discount_percentage: 20,
  
  // Deal scoring
  deal_score: 85,  // 0-100
  deal_reasons: ["price_drop", "limited_availability", "seasonal_promo"],
  
  // Availability
  available_inventory: 5,
  limited_inventory: true,
  
  // Tags
  tags: ["pet_friendly", "near_transit", "breakfast_included", "refundable"],
  
  // Timing
  valid_from: ISODate("2025-11-25T00:00:00Z"),
  valid_until: ISODate("2025-12-31T23:59:59Z"),
  discovered_at: ISODate("2025-11-25T10:30:00Z"),
  last_updated: ISODate("2025-11-25T10:30:00Z"),
  
  // Metadata
  metadata: {
    amenities: ["WiFi", "Parking"],
    neighborhood: "Downtown",
    cancellation_policy: "Free cancellation until 24 hours before check-in"
  },
  
  // Status
  status: "active|expired|sold_out"
}

// Indexes
db.deals.createIndex({ listing_id: 1, listing_type: 1 })
db.deals.createIndex({ deal_score: -1 })
db.deals.createIndex({ tags: 1 })
db.deals.createIndex({ valid_until: 1 })
db.deals.createIndex({ status: 1 })
db.deals.createIndex({ current_price: 1 })
```

---

### 5. Bundles Collection (AI Service)

```javascript
// bundles collection schema
{
  _id: ObjectId,
  bundle_id: "BND001",
  user_id: "123-45-6789",
  session_id: "sess_abc123",
  
  // Bundle components
  flight: {
    flight_id: "AA123",
    departure_airport: "SFO",
    arrival_airport: "JFK",
    departure_datetime: ISODate("2025-12-10T08:30:00Z"),
    return_flight_id: "AA456",
    return_datetime: ISODate("2025-12-15T17:00:00Z"),
    price: 450.00
  },
  
  hotel: {
    hotel_id: "HT001",
    hotel_name: "Grand Plaza Hotel",
    check_in: ISODate("2025-12-10T00:00:00Z"),
    check_out: ISODate("2025-12-15T00:00:00Z"),
    nights: 5,
    price_per_night: 150.00,
    total_price: 750.00
  },
  
  // Pricing
  total_price: 1200.00,
  savings: 180.00,
  discount_percentage: 13,
  
  // Scoring
  fit_score: 95,  // 0-100
  
  // Explanations
  why_this: "Best value with beach access and free breakfast",
  what_to_watch: "Only 3 rooms left",
  tradeoffs: "15-minute connection, but saves $120",
  
  // User preferences matched
  preferences_matched: ["pet_friendly", "near_transit"],
  preferences_missed: ["pool"],
  
  // Status
  status: "active|watched|booked|expired",
  
  // Timestamps
  created_at: ISODate("2025-11-25T10:30:00Z"),
  expires_at: ISODate("2025-11-26T10:30:00Z")
}

// Indexes
db.bundles.createIndex({ user_id: 1, created_at: -1 })
db.bundles.createIndex({ session_id: 1 })
db.bundles.createIndex({ fit_score: -1 })
db.bundles.createIndex({ status: 1 })
db.bundles.createIndex({ expires_at: 1 })
```

---

### 6. User Watches Collection (AI Service)

```javascript
// watches collection schema
{
  _id: ObjectId,
  watch_id: "WATCH001",
  user_id: "123-45-6789",
  bundle_id: "BND001",
  
  // Thresholds
  price_threshold: 700.00,
  inventory_threshold: 5,
  
  // Current values
  current_price: 760.00,
  current_inventory: 8,
  
  // Notification settings
  notification_method: "websocket|email|sms",
  notification_sent: false,
  last_notification: null,
  
  // Status
  status: "active|triggered|cancelled",
  
  // Timestamps
  created_at: ISODate("2025-11-25T10:30:00Z"),
  expires_at: ISODate("2025-12-10T00:00:00Z")
}

// Indexes
db.watches.createIndex({ user_id: 1, status: 1 })
db.watches.createIndex({ bundle_id: 1 })
db.watches.createIndex({ status: 1, expires_at: 1 })
```

---

## Indexing Strategy

### MySQL Indexing Principles
1. **Primary Keys:** All tables have primary keys (clustered index)
2. **Foreign Keys:** Indexed automatically for joins
3. **Search Fields:** City, state, dates, prices
4. **Filter Fields:** Status, type, availability
5. **Composite Indexes:** (city, state), (departure_airport, arrival_airport)

### MongoDB Indexing Principles
1. **Query Patterns:** Index fields used in queries
2. **Sort Fields:** Index fields used for sorting
3. **Compound Indexes:** For multi-field queries
4. **TTL Indexes:** Auto-expire old logs
5. **Text Indexes:** For full-text search (if needed)

---

## Database Creation Scripts

### MySQL Setup Script

```sql
-- Create Database
CREATE DATABASE IF NOT EXISTS kayak_simulation 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE kayak_simulation;

-- Run all table creation scripts above in order:
-- 1. Users
-- 2. Credit Cards
-- 3. Flights
-- 4. Hotels
-- 5. Hotel Rooms
-- 6. Hotel Amenities
-- 7. Cars
-- 8. Bookings
-- 9. Flight Booking Details
-- 10. Billing
-- 11. Admin

-- Insert sample data (10,000+ records for testing)
-- See seed_data.sql for sample inserts
```

---

### MongoDB Setup Script

```javascript
// Connect to MongoDB
use kayak_simulation;

// Create collections with validation
db.createCollection("reviews", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["review_id", "user_id", "listing_type", "listing_id", "rating"],
      properties: {
        rating: {
          bsonType: "int",
          minimum: 1,
          maximum: 5
        }
      }
    }
  }
});

db.createCollection("images");
db.createCollection("logs");
db.createCollection("deals");
db.createCollection("bundles");
db.createCollection("watches");

// Create all indexes (see above for each collection)

// Insert sample data
// See seed_data_mongo.js for sample documents
```

---

## ER Diagram

```
┌─────────────┐
│   USERS     │
│             │
│ user_id (PK)│◄─────┐
│ first_name  │      │
│ last_name   │      │
│ email       │      │
│ phone       │      │
│ address     │      │
└─────────────┘      │
                     │
                     │
┌─────────────┐      │       ┌──────────────┐
│ CREDIT_CARDS│      │       │   BOOKINGS   │
│             │      │       │              │
│ card_id(PK) │      ├──────►│ booking_id(PK│
│ user_id(FK) │◄─────┤       │ user_id (FK) │
│ card_number │      │       │ booking_type │
└─────────────┘      │       │ status       │
                     │       │ total_amount │
                     │       └──────┬───────┘
                     │              │
┌─────────────┐      │              │
│   BILLING   │      │              │
│             │      │              │
│ billing_id  │      │              │
│ user_id(FK) │◄─────┤              │
│ booking_id  │◄─────┼──────────────┘
│ amount      │      │
│ status      │      │
└─────────────┘      │
                     │
                     │
┌─────────────┐      │
│   FLIGHTS   │      │
│             │      │
│ flight_id   │      │
│ airline     │      │
│ departure   │      │
│ arrival     │      │
│ price       │      │
└─────────────┘      │
                     │
                     │
┌─────────────┐      │
│   HOTELS    │      │
│             │      │
│ hotel_id    │      │
│ hotel_name  │      │
│ city        │      │
│ star_rating │      │
└──────┬──────┘      │
       │             │
       │             │
       ▼             │
┌─────────────┐      │
│HOTEL_ROOMS  │      │
│             │      │
│ room_id     │      │
│ hotel_id(FK)│      │
│ room_type   │      │
│ price       │      │
└─────────────┘      │
                     │
       │             │
       │             │
       ▼             │
┌─────────────┐      │
│HOTEL_       │      │
│AMENITIES    │      │
│ amenity_id  │      │
│ hotel_id(FK)│      │
│ amenity_name│      │
└─────────────┘      │
                     │
                     │
┌─────────────┐      │
│    CARS     │      │
│             │      │
│ car_id      │      │
│ car_type    │      │
│ company     │      │
│ model       │      │
│ daily_rate  │      │
└─────────────┘      │
                     │
                     │
┌─────────────┐      │
│   ADMIN     │      │
│             │      │
│ admin_id(PK)│      │
│ first_name  │      │
│ role        │      │
│ access_level│      │
└─────────────┘      │
```

**MongoDB Collections (Document References):**
- Reviews → Reference listing_id + listing_type
- Images → Reference entity_id + image_type
- Logs → Reference user_id, session_id
- Deals → Reference listing_id + listing_type
- Bundles → Reference user_id, flight_id, hotel_id

---

## Performance Considerations

### Connection Pooling
- **MySQL:** Use connection pool (min: 10, max: 50)
- **MongoDB:** Use connection pool (min: 10, max: 100)

### Query Optimization
- Use EXPLAIN to analyze slow queries
- Add indexes for frequently queried fields
- Use composite indexes for multi-field queries
- Avoid SELECT * - specify needed fields

### Caching Strategy (Redis)
- Cache user profiles (TTL: 1 hour)
- Cache search results (TTL: 5 minutes)
- Cache popular listings (TTL: 30 minutes)
- Cache aggregated analytics (TTL: 1 day)

### Data Archival
- Archive completed bookings >1 year old
- Archive old logs (MongoDB TTL index handles this)
- Keep hot data (current/future bookings) in main tables

---

## Backup Strategy

### MySQL Backups
- **Full backup:** Daily at 2 AM
- **Incremental backup:** Every 6 hours
- **Retention:** 30 days

### MongoDB Backups
- **Full backup:** Daily at 3 AM
- **Oplog backup:** Continuous
- **Retention:** 30 days

---

## Security Considerations

1. **Encryption:**
   - Encrypt credit card numbers
   - Encrypt CVV codes
   - Hash passwords (bcrypt)

2. **Access Control:**
   - Separate read/write users
   - Least privilege principle
   - Admin access logging

3. **SQL Injection Prevention:**
   - Use parameterized queries
   - Input validation
   - ORM/query builders

4. **Data Masking:**
   - Mask credit card numbers in logs
   - Mask SSNs in logs
   - Anonymize test data

---

**Schema Version:** 1.0  
**Last Updated:** November 25, 2025

