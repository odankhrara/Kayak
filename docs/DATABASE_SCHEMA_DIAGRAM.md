# Database Schema Diagram

Complete database schema for Kayak Travel Booking System showing MySQL, MongoDB, and AI Service databases.

---

## 🗄️ Database Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE DISTRIBUTION                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │   MySQL 8.0     │  │   MongoDB 7.0    │  │  MySQL 8.0      │ │
│  │  (Port 3307)    │  │  (Port 27017)    │  │  (AI Service)   │ │
│  │                 │  │                  │  │                 │ │
│  │  Transactional  │  │  Document Store │  │  AI Deals       │ │
│  │  ACID           │  │  Flexible Schema│  │  Bundles        │ │
│  │  Relationships  │  │  High Write     │  │  Watches        │ │
│  └──────────────────┘  └──────────────────┘  └────────────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 MySQL Database Schema (Port 3307)

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         MYSQL DATABASE (kayak)                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────┐
│       USERS         │
├─────────────────────┤
│ user_id (PK)        │◄──────┐
│ first_name          │        │
│ last_name           │        │
│ email (UNIQUE)      │        │
│ password_hash       │        │
│ phone               │        │
│ address             │        │
│ city                │        │
│ state (CHAR 2)      │        │
│ zip_code            │        │
│ profile_image_id    │        │
│ status              │        │
│ is_admin            │        │
│ created_at          │        │
│ updated_at          │        │
└─────────────────────┘        │
                                │
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        │                       │                       │
┌───────▼────────┐    ┌─────────▼─────────┐   ┌───────▼──────────┐
│ CREDIT_CARDS   │    │    BOOKINGS       │   │     BILLING      │
├────────────────┤    ├───────────────────┤   ├──────────────────┤
│ card_id (PK)   │    │ booking_id (PK)   │   │ billing_id (PK)  │
│ user_id (FK)   │◄───┤ user_id (FK)      │◄──┤ user_id (FK)     │
│ card_number_   │    │ booking_type      │   │ booking_id (FK)  │
│   encrypted    │    │ booking_reference │   │ transaction_id   │
│ card_holder    │    │ confirmation_code │   │ amount           │
│ expiry_month   │    │ status            │   │ tax              │
│ expiry_year    │    │ start_date        │   │ total_amount     │
│ cvv_encrypted  │    │ end_date          │   │ payment_method   │
│ card_type      │    │ guests            │   │ transaction_     │
│ is_default     │    │ total_amount      │   │   status         │
│ created_at     │    │ special_requests   │   │ transaction_date │
└────────────────┘    │ created_at        │   │ invoice_id       │
                      │ updated_at        │   └──────────────────┘
                      └─────────┬─────────┘
                                │
                                │
                      ┌─────────▼──────────────┐ 
                      │ FLIGHT_BOOKING_DETAILS │
                      ├───────────────────────┤
                      │ detail_id (PK)        │
                      │ booking_id (FK)        │
                      │ flight_id (FK)         │
                      │ passenger_first_name   │
                      │ passenger_last_name    │
                      │ passenger_dob          │
                      │ passport_number        │
                      │ seat_number            │
                      └───────────────────────┘


┌─────────────────────┐
│      FLIGHTS         │
├─────────────────────┤
│ flight_id (PK)      │
│ airline_name        │
│ departure_airport   │
│ arrival_airport      │
│ departure_datetime  │
│ arrival_datetime     │
│ duration_minutes     │
│ flight_class         │
│ price_per_ticket     │
│ total_seats          │
│ available_seats      │
│ rating               │
│ reviews_count        │
│ status               │
│ created_at           │
│ updated_at           │
└─────────────────────┘


┌─────────────────────┐
│      HOTELS         │
├─────────────────────┤
│ hotel_id (PK)       │
│ hotel_name          │
│ address             │
│ city                │
│ state               │
│ zip_code            │
│ star_rating         │
│ description         │
│ total_rooms         │
│ rating              │
│ reviews_count       │
│ latitude            │
│ longitude           │
│ status              │
│ created_at          │
│ updated_at          │
└──────────┬──────────┘
           │
           │
   ┌───────┴────────┐
   │                │
   │                │
┌──▼──────────┐  ┌──▼──────────────┐
│HOTEL_ROOMS  │  │HOTEL_AMENITIES  │
├─────────────┤  ├─────────────────┤
│ room_id(PK) │  │ amenity_id (PK) │
│ hotel_id(FK)│  │ hotel_id (FK)   │
│ room_type   │  │ amenity_name    │
│ price_per_  │  │ is_free         │
│   night     │  └─────────────────┘
│ max_guests  │
│ total_rooms │
│ available_  │
│   rooms     │
│ description │
└─────────────┘


┌─────────────────────┐
│       CARS          │
├─────────────────────┤
│ car_id (PK)         │
│ car_type            │
│ company_name        │
│ model               │
│ year                │
│ transmission        │
│ seats               │
│ daily_rate          │
│ location            │
│ rating              │
│ reviews_count       │
│ available           │
│ created_at          │
│ updated_at          │
└─────────────────────┘


┌─────────────────────┐
│       ADMIN         │
├─────────────────────┤
│ admin_id (PK)       │
│ first_name          │
│ last_name           │
│ email (UNIQUE)      │
│ password_hash       │
│ phone               │
│ address             │
│ city                │
│ state               │
│ zip_code            │
│ role                │
│ access_level        │
│ created_at          │
│ last_login          │
│ status              │
└─────────────────────┘
```

### MySQL Table Relationships

```
USERS (1) ──────< (N) CREDIT_CARDS
  │
  │
  └───────< (N) BOOKINGS
              │
              │
              └───────< (1) FLIGHT_BOOKING_DETAILS
                          │
                          │
                          └───────> (1) FLIGHTS

USERS (1) ──────< (N) BILLING
  │
  │
  └───────< (N) BOOKINGS ──────> (1) BILLING

HOTELS (1) ──────< (N) HOTEL_ROOMS
  │
  │
  └───────< (N) HOTEL_AMENITIES
```

---

## 🍃 MongoDB Collections (Port 27017)

### Document Structure Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    MONGODB DATABASE (kayak)                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────┐
│         REVIEWS Collection          │
├─────────────────────────────────────┤
│ {                                    │
│   _id: ObjectId                     │
│   review_id: "REV001"               │
│   user_id: "123-45-6789"            │───┐
│   listing_type: "flight|hotel|car" │   │
│   listing_id: "AA123"                │   │
│   rating: 5                          │   │
│   title: "Great flight!"            │   │
│   comment: "..."                    │   │
│   helpful_count: 10                 │   │
│   verified_booking: true             │   │
│   created_at: ISODate               │   │
│ }                                    │   │
└─────────────────────────────────────┘   │
                                           │
┌─────────────────────────────────────┐   │
│         IMAGES Collection            │   │
├─────────────────────────────────────┤   │
│ {                                    │   │
│   _id: ObjectId                     │   │
│   image_id: "IMG001"                │   │
│   image_type: "profile|hotel|car"   │   │
│   entity_id: "123-45-6789"          │───┼─── References
│   image_url: "https://..."          │   │   MySQL entities
│   thumbnail_url: "https://..."      │   │
│   alt_text: "Hotel lobby"           │   │
│   is_primary: true                  │   │
│   uploaded_at: ISODate              │   │
│ }                                    │   │
└─────────────────────────────────────┘   │
                                           │
┌─────────────────────────────────────┐   │
│         LOGS Collection              │   │
├─────────────────────────────────────┤   │
│ {                                    │   │
│   _id: ObjectId                     │   │
│   log_id: "LOG001"                  │   │
│   log_type: "click|page_view|..."   │   │
│   user_id: "123-45-6789"            │───┘
│   session_id: "sess_abc123"          │
│   timestamp: ISODate                │
│   page_url: "/hotels/search"        │
│   element_id: "book-now-btn"         │
│   search_params: {...}               │
│   location: {city, state, country}   │
│   device_type: "desktop|mobile"      │
│   metadata: {}                       │
│ }                                    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│         DEALS Collection            │
│      (AI Recommendation Service)     │
├─────────────────────────────────────┤
│ {                                    │
│   _id: ObjectId                     │
│   deal_id: "DEAL001"                │
│   listing_type: "flight|hotel"      │
│   listing_id: "AA123"                │
│   current_price: 120.00             │
│   original_price: 150.00             │
│   avg_30d_price: 145.00             │
│   discount_percentage: 20            │
│   deal_score: 85                     │
│   available_inventory: 5             │
│   limited_inventory: true            │
│   tags: ["pet_friendly", ...]       │
│   valid_from: ISODate                │
│   valid_until: ISODate               │
│   status: "active"                   │
│ }                                    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│         BUNDLES Collection           │
│      (AI Recommendation Service)     │
├─────────────────────────────────────┤
│ {                                    │
│   _id: ObjectId                     │
│   bundle_id: "BND001"               │
│   user_id: "123-45-6789"            │
│   session_id: "sess_abc123"          │
│   flight: {flight_id, price, ...}    │
│   hotel: {hotel_id, price, ...}      │
│   total_price: 1200.00               │
│   savings: 180.00                   │
│   fit_score: 95                      │
│   why_this: "Best value..."          │
│   status: "active"                   │
│   created_at: ISODate                │
│ }                                    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│         WATCHES Collection           │
│      (AI Recommendation Service)     │
├─────────────────────────────────────┤
│ {                                    │
│   _id: ObjectId                     │
│   watch_id: "WATCH001"              │
│   user_id: "123-45-6789"            │
│   bundle_id: "BND001"               │
│   price_threshold: 700.00            │
│   inventory_threshold: 5             │
│   notification_method: "websocket"   │
│   status: "active"                   │
│   created_at: ISODate                │
│   expires_at: ISODate                │
│ }                                    │
└─────────────────────────────────────┘
```

---

## 🤖 AI Recommendation Service Database (MySQL)

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│           AI RECOMMENDATION DATABASE (ai_recommendations.db)      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────┐
│   FLIGHT_DEALS      │
├─────────────────────┤
│ id (PK)             │
│ airline             │
│ flight_number       │
│ origin              │
│ destination         │
│ departure_time      │
│ arrival_time        │
│ original_price      │
│ discounted_price    │
│ discount_percentage │
│ deal_score          │
│ available_seats     │
│ tags                │
│ is_active           │
│ created_at          │
│ updated_at          │
│ last_price_update   │
└──────────┬──────────┘
           │
           │ (referenced by)
           │
┌──────────▼──────────┐
│      BUNDLES        │
├─────────────────────┤
│ id (PK)             │
│ name                │
│ description         │
│ total_price         │
│ savings             │
│ flight_deal_ids     │───┐ (comma-separated IDs)
│ hotel_deal_ids      │───┤
│ car_deal_ids        │───┤
│ tags                │   │
│ is_active           │   │
│ created_at          │   │
│ updated_at          │   │
└─────────────────────┘   │
                          │
┌─────────────────────────┴──────────┐
│                                    │
│                                    │
┌──────────▼──────────┐  ┌───────────▼──────────┐
│   HOTEL_DEALS       │  │      WATCHES         │
├─────────────────────┤  ├─────────────────────┤
│ id (PK)             │  │ id (PK)             │
│ name                │  │ user_id             │
│ city                │  │ origin              │
│ state               │  │ destination         │
│ country             │  │ city                │
│ address             │  │ max_price           │
│ original_price_     │  │ check_in            │
│   per_night         │  │ check_out           │
│ discounted_price_   │  │ watch_type          │
│   per_night         │  │ bundle_id (FK)       │───┐
│ discount_percentage │  │ min_inventory        │   │
│ deal_score          │  │ active              │   │
│ available_rooms     │  │ notification_sent    │   │
│ rating              │  │ created_at          │   │
│ tags                │  │ updated_at          │   │
│ is_active           │  └─────────────────────┘   │
│ created_at          │                             │
│ updated_at          │                             │
│ last_price_update    │                             │
└─────────────────────┘                             │
                                                     │
                                                     │
                                    ┌────────────────┘
                                    │
                                    │ (watches)
                                    │
                          ┌─────────▼──────────┐
                          │   BUNDLES (again)   │
                          │   (for watches)     │
                          └─────────────────────┘
```

### AI Service Database Relationships

```
FLIGHT_DEALS (N) ──────< (1) BUNDLES (via flight_deal_ids)
HOTEL_DEALS (N) ────────< (1) BUNDLES (via hotel_deal_ids)
BUNDLES (1) ────────< (N) WATCHES (via bundle_id)
```

---

## 🔗 Cross-Database Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                    CROSS-DATABASE REFERENCES                      │
└─────────────────────────────────────────────────────────────────┘

MySQL (users.user_id)
    │
    │ Referenced by:
    │
    ├──> MongoDB.reviews.user_id
    ├──> MongoDB.logs.user_id
    ├──> MongoDB.bundles.user_id
    ├──> MongoDB.watches.user_id
    └──> AI Service.watches.user_id

MySQL (flights.flight_id)
    │
    ├──> MongoDB.reviews.listing_id (where listing_type="flight")
    ├──> MongoDB.deals.listing_id (where listing_type="flight")
    └──> AI Service.flight_deals (synced data)

MySQL (hotels.hotel_id)
    │
    ├──> MongoDB.reviews.listing_id (where listing_type="hotel")
    ├──> MongoDB.deals.listing_id (where listing_type="hotel")
    ├──> MongoDB.images.entity_id (where image_type="hotel")
    └──> AI Service.hotel_deals (synced data)

MySQL (cars.car_id)
    │
    ├──> MongoDB.reviews.listing_id (where listing_type="car")
    └──> MongoDB.images.entity_id (where image_type="car")

MySQL (users.profile_image_id)
    │
    └──> MongoDB.images.image_id (where image_type="profile")
```

---

## 📋 Complete Table/Collection List

### MySQL Tables (11 tables)

1. **users** - User accounts
2. **credit_cards** - Payment methods
3. **flights** - Flight listings
4. **hotels** - Hotel properties
5. **hotel_rooms** - Room types and pricing
6. **hotel_amenities** - Hotel features
7. **cars** - Car rental inventory
8. **bookings** - Reservation records
9. **flight_booking_details** - Passenger information
10. **billing** - Payment transactions
11. **admin** - Administrator accounts

### MongoDB Collections (6 collections)

1. **reviews** - User reviews for flights/hotels/cars
2. **images** - Profile and property images
3. **logs** - User activity and analytics events
4. **deals** - AI-detected travel deals (legacy)
5. **bundles** - AI-generated travel bundles (legacy)
6. **watches** - Price/inventory watches (legacy)

### AI Service Database (MySQL) (4 tables)

1. **flight_deals** - AI-processed flight deals
2. **hotel_deals** - AI-processed hotel deals
3. **bundles** - AI-created travel bundles
4. **watches** - User price/inventory watches

---

## 🔑 Primary Keys and Foreign Keys

### MySQL Foreign Key Relationships

```sql
-- Users → Credit Cards (1:N)
credit_cards.user_id → users.user_id

-- Users → Bookings (1:N)
bookings.user_id → users.user_id

-- Users → Billing (1:N)
billing.user_id → users.user_id

-- Bookings → Billing (1:1)
billing.booking_id → bookings.booking_id

-- Bookings → Flight Booking Details (1:N)
flight_booking_details.booking_id → bookings.booking_id

-- Flights → Flight Booking Details (1:N)
flight_booking_details.flight_id → flights.flight_id

-- Hotels → Hotel Rooms (1:N)
hotel_rooms.hotel_id → hotels.hotel_id

-- Hotels → Hotel Amenities (1:N)
hotel_amenities.hotel_id → hotels.hotel_id
```

### MongoDB References (Soft References)

```javascript
// Reviews reference listings
reviews.listing_id → flights.flight_id | hotels.hotel_id | cars.car_id
reviews.user_id → users.user_id

// Images reference entities
images.entity_id → users.user_id | hotels.hotel_id | cars.car_id

// Logs reference users
logs.user_id → users.user_id

// Deals reference listings
deals.listing_id → flights.flight_id | hotels.hotel_id

// Bundles reference users and listings
bundles.user_id → users.user_id
bundles.flight.flight_id → flights.flight_id
bundles.hotel.hotel_id → hotels.hotel_id

// Watches reference users and bundles
watches.user_id → users.user_id
watches.bundle_id → bundles.bundle_id
```

### AI Service Database References

```python
# Bundles reference deals via comma-separated IDs
bundles.flight_deal_ids → "1,2,3" (references flight_deals.id)
bundles.hotel_deal_ids → "10,11,12" (references hotel_deals.id)

# Watches reference bundles
watches.bundle_id → bundles.id
```

---

## 📊 Index Strategy

### MySQL Indexes

```sql
-- Users
INDEX idx_email (email)
INDEX idx_city_state (city, state)
INDEX idx_status (status)

-- Flights
INDEX idx_route (departure_airport, arrival_airport)
INDEX idx_departure_date (departure_datetime)
INDEX idx_price (price_per_ticket)

-- Hotels
INDEX idx_city_state (city, state)
INDEX idx_star_rating (star_rating)
FULLTEXT idx_name_description (hotel_name, description)

-- Bookings
INDEX idx_user_id (user_id)
INDEX idx_status (status)
INDEX idx_start_date (start_date)

-- Billing
INDEX idx_transaction_date (transaction_date)
INDEX idx_transaction_status (transaction_status)
```

### MongoDB Indexes

```javascript
// Reviews
db.reviews.createIndex({ listing_id: 1, listing_type: 1 })
db.reviews.createIndex({ user_id: 1 })
db.reviews.createIndex({ rating: -1 })

// Logs
db.logs.createIndex({ user_id: 1, timestamp: -1 })
db.logs.createIndex({ session_id: 1 })
db.logs.createIndex({ log_type: 1, timestamp: -1 })
db.logs.createIndex({ timestamp: 1 }, { expireAfterSeconds: 7776000 }) // TTL

// Deals
db.deals.createIndex({ deal_score: -1 })
db.deals.createIndex({ tags: 1 })
db.deals.createIndex({ status: 1 })

// Bundles
db.bundles.createIndex({ user_id: 1, created_at: -1 })
db.bundles.createIndex({ fit_score: -1 })
```

### AI Service Indexes

```python
# SQLModel automatically creates indexes for:
# - Primary keys (id)
# - Foreign keys (bundle_id in watches)
# - Common query fields (origin, destination, city, deal_score)
```

---

## 🔄 Data Flow Between Databases

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA FLOW DIAGRAM                              │
└─────────────────────────────────────────────────────────────────┘

User Action
    │
    ▼
┌─────────────────┐
│  MySQL (users)  │ ────> User creates account
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  MySQL (flights)│ ────> User searches flights
│  MySQL (hotels) │ ────> User searches hotels
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  MongoDB (logs)│ ────> Track search/click events
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ AI Service DB   │ ────> AI processes deals
│ (flight_deals)  │       Creates bundles
│ (hotel_deals)   │
│ (bundles)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  MySQL (bookings)│ ────> User books bundle
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  MySQL (billing)│ ────> Process payment
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ MongoDB (reviews)│ ────> User leaves review
└─────────────────┘
```

---

## 📐 Schema Statistics

### MySQL Database
- **Total Tables**: 11
- **Total Indexes**: ~35
- **Foreign Key Relationships**: 7
- **Estimated Records**: 10,000+ (after seeding)

### MongoDB Database
- **Total Collections**: 6
- **Total Indexes**: ~20
- **TTL Indexes**: 1 (logs collection)
- **Estimated Documents**: 100,000+ (logs grow continuously)

### AI Service Database
- **Total Tables**: 4
- **Primary Relationships**: 3 (via comma-separated IDs)
- **Estimated Records**: 1,000+ (deals and bundles)

---

## 🎯 Key Design Decisions

### 1. **Why MySQL for Core Data?**
- ACID transactions for bookings and billing
- Foreign key constraints ensure data integrity
- Complex joins for analytics queries
- Structured schema for user, flight, hotel, car data

### 2. **Why MongoDB for Reviews/Logs?**
- Flexible schema for variable review content
- High write throughput for logs
- No complex joins needed
- Easy to scale horizontally

### 3. **Why Separate AI Service Database?**
- Isolated from main transactional database
- Fast queries for deal detection
- Can be optimized for AI workloads
- Easy to reset/rebuild without affecting main DB

### 4. **Why Comma-Separated IDs in Bundles?**
- Simplicity for MVP
- Easy to serialize/deserialize
- No complex junction tables
- Can be migrated to proper relationships later

---

## 🔍 Query Patterns

### Common MySQL Queries

```sql
-- Get user bookings
SELECT b.*, f.airline_name, h.hotel_name
FROM bookings b
LEFT JOIN flights f ON b.booking_reference = f.flight_id
LEFT JOIN hotels h ON b.booking_reference = h.hotel_id
WHERE b.user_id = '123-45-6789';

-- Search flights
SELECT * FROM flights
WHERE departure_airport = 'BOM'
  AND arrival_airport = 'DEL'
  AND departure_datetime >= '2025-12-01'
  AND available_seats > 0
ORDER BY price_per_ticket ASC
LIMIT 10;

-- Get hotel with rooms and amenities
SELECT h.*, hr.room_type, hr.price_per_night, ha.amenity_name
FROM hotels h
LEFT JOIN hotel_rooms hr ON h.hotel_id = hr.hotel_id
LEFT JOIN hotel_amenities ha ON h.hotel_id = ha.hotel_id
WHERE h.city = 'Delhi' AND h.status = 'active';
```

### Common MongoDB Queries

```javascript
// Get reviews for a hotel
db.reviews.find({
  listing_type: "hotel",
  listing_id: "HT001"
}).sort({ created_at: -1 });

// Get user activity logs
db.logs.find({
  user_id: "123-45-6789",
  timestamp: { $gte: ISODate("2025-11-01") }
}).sort({ timestamp: -1 });

// Get active deals
db.deals.find({
  status: "active",
  deal_score: { $gte: 60 }
}).sort({ deal_score: -1 });
```

### Common AI Service Queries

```python
# Get bundles for a route
session.exec(
    select(Bundle)
    .join(FlightDeal)
    .where(FlightDeal.origin == "BOM")
    .where(FlightDeal.destination == "DEL")
    .order_by(Bundle.savings.desc())
    .limit(5)
)

# Get best flight deals
session.exec(
    select(FlightDeal)
    .where(FlightDeal.origin == "BOM")
    .where(FlightDeal.destination == "DEL")
    .where(FlightDeal.discounted_price <= 400.0)
    .order_by(FlightDeal.deal_score.desc())
    .limit(3)
)
```

---

## 📝 Summary

**Total Database Objects:**
- **MySQL**: 11 tables, ~35 indexes
- **MongoDB**: 6 collections, ~20 indexes
- **AI Service**: 4 tables, auto-indexed

**Key Relationships:**
- Users → Bookings → Billing (transactional flow)
- Hotels → Hotel Rooms → Hotel Amenities (hierarchical)
- AI Service bundles reference MySQL flights/hotels via IDs
- MongoDB collections reference MySQL entities via soft references

**Data Distribution:**
- **Transactional data** → MySQL (bookings, billing, users)
- **Analytics data** → MongoDB (logs, reviews)
- **AI data** → MySQL `kayak` database (flight_deals, hotel_deals, bundles, watches)
