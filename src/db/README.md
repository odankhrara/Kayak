# Database Setup

This directory contains database schemas and seed data for the Kayak Travel Booking System.

## 📁 Files

- **`mysql/docker-init.sql`** - MySQL schema with 11 tables and sample data
- **`mongo/init.js`** - MongoDB collections, indexes, and sample documents
- **`seed-data.js`** - Generates 1000+ additional records for testing
- **`package.json`** - Dependencies for seed script

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

From the project root, run:

```bash
chmod +x setup-database.sh
./setup-database.sh
```

This will:
1. Start Docker containers (MySQL, MongoDB, Redis, Kafka)
2. Wait for databases to be ready
3. Initialize schemas (via docker-init.sql and init.js)
4. Seed 1000+ additional records
5. Verify connections

### Option 2: Manual Setup

#### Step 1: Start Docker Containers

```bash
cd infra
docker-compose up -d
```

Wait 30 seconds for containers to initialize.

#### Step 2: Verify Connections

```bash
# Check MySQL
docker exec kayak-mysql mysqladmin ping -h localhost -u root -ppassword

# Check MongoDB
docker exec kayak-mongodb mongosh --eval "db.adminCommand('ping')"

# Check Redis
docker exec kayak-redis redis-cli ping
```

#### Step 3: Run Seed Script (Optional - for 1000+ records)

```bash
cd db
npm install
npm run seed
```

## 📊 What Gets Created

### MySQL Tables (11 total)

1. **users** - User accounts (1000+ records after seed)
   - Includes valid SSN, state, ZIP formats
   - Bcrypt hashed passwords (default: `password123`)
   
2. **flights** - Flight listings (500+ records after seed)
   - Various airlines, routes, dates
   - Economy, business, first class
   
3. **hotels** - Hotel properties (200+ records after seed)
   - 3-5 star ratings
   - Various cities and states
   
4. **hotel_rooms** - Room types and pricing (600+ records)
   - Single, double, suite types
   - Linked to hotels
   
5. **hotel_amenities** - Hotel amenities (800+ records)
   - WiFi, parking, pool, etc.
   - Free vs paid amenities
   
6. **cars** - Rental cars (200+ records after seed)
   - Various types: sedan, SUV, luxury, compact
   - Multiple rental companies
   
7. **bookings** - Reservation records (empty - populated by app)
   
8. **flight_booking_details** - Passenger info (empty)
   
9. **billing** - Payment transactions (empty)
   
10. **admin** - Admin users (1 default admin)
    - Email: `admin@kayak.com`
    - Password: `admin123`
    
11. **credit_cards** - Payment methods (empty)

### MongoDB Collections (6 total)

1. **reviews** - User reviews for flights, hotels, cars
   - 5 sample reviews included
   
2. **images** - Profile and property images
   - 4 sample images included
   
3. **logs** - User activity tracking
   - Page views, searches, clicks
   - TTL index: auto-delete after 90 days
   
4. **deals** - AI-detected travel deals
   - 2 sample deals included
   - For AI recommendation service
   
5. **bundles** - AI-generated travel packages
   - 1 sample bundle included
   - Flight + hotel combinations
   
6. **watches** - User price alerts
   - 1 sample watch included
   - WebSocket notifications

## 🔑 Default Credentials

### Test Users (after seed)
- **Email:** Various (check console output during seed)
- **Password:** `password123`
- **SSN Format:** `XXX-XX-XXXX` (randomly generated, valid format)

### Admin User
- **Email:** `admin@kayak.com`
- **Password:** `admin123`
- **Admin ID:** `ADM001`

### Database Access
- **MySQL:**
  - Host: `localhost:3306`
  - User: `root` or `kayak`
  - Password: `password`
  - Database: `kayak`

- **MongoDB:**
  - URL: `mongodb://localhost:27017`
  - Database: `kayak`

- **Redis:**
  - URL: `redis://localhost:6379`

## 📈 Data Statistics (After Full Seed)

| Resource | Count |
|----------|-------|
| Users | 1000+ |
| Flights | 500+ |
| Hotels | 200+ |
| Hotel Rooms | 600+ |
| Hotel Amenities | 800+ |
| Cars | 200+ |
| Reviews | 5 (sample) |
| Images | 4 (sample) |
| Logs | 3 (sample) |
| Deals | 2 (sample) |
| Bundles | 1 (sample) |

**Total:** ~3300+ records ready for testing!

## 🔧 Customization

### Generate More Records

Edit `seed-data.js` and change these values:

```javascript
// Line numbers may vary
for (let i = 0; i < 1000; i++) { // Change 1000 to desired count
  // User generation
}

for (let i = 0; i < 500; i++) { // Change 500 to desired count
  // Flight generation
}
```

Then run:
```bash
npm run seed
```

### Reset Database

To start fresh:

```bash
cd infra
docker-compose down -v  # Remove volumes
docker-compose up -d    # Restart (will re-run init scripts)
cd ../db
npm run seed            # Re-seed additional data
```

## 🐛 Troubleshooting

### Issue: "Table already exists" error

**Solution:** The init scripts create tables. If you need to reset:

```bash
cd infra
docker-compose down -v
docker-compose up -d
```

### Issue: Seed script fails with connection error

**Solution:** Wait longer for databases to initialize:

```bash
# Wait 60 seconds after starting docker-compose
sleep 60
npm run seed
```

### Issue: Not enough data for testing

**Solution:** Run the seed script multiple times (it will add more records):

```bash
npm run seed  # First run: 1000 users
npm run seed  # Second run: 2000 users total
```

### Issue: Want to check what's in the database

**MySQL:**
```bash
docker exec -it kayak-mysql mysql -u root -ppassword kayak
```

Then run SQL:
```sql
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM flights;
SHOW TABLES;
```

**MongoDB:**
```bash
docker exec -it kayak-mongodb mongosh kayak
```

Then run:
```javascript
db.reviews.count()
db.deals.count()
show collections
```

## 📚 Schema Documentation

For detailed schema information, see:
- [DATABASE_SCHEMA.md](../../DATABASE_SCHEMA.md) - Complete schema documentation
- [API_DESIGN_DOCUMENT.md](../../API_DESIGN_DOCUMENT.md) - API data formats

## ✅ Verification Checklist

After setup, verify:

- [ ] Docker containers running: `docker ps`
- [ ] MySQL accessible: `docker exec kayak-mysql mysql -u root -ppassword -e "SHOW DATABASES;"`
- [ ] MongoDB accessible: `docker exec kayak-mongodb mongosh --eval "db.adminCommand('ping')"`
- [ ] Redis accessible: `docker exec kayak-redis redis-cli ping`
- [ ] Tables created: Check MySQL with `SHOW TABLES;`
- [ ] Collections created: Check MongoDB with `show collections`
- [ ] Data seeded: `SELECT COUNT(*) FROM users;` should show 1000+

---

**Last Updated:** November 26, 2025  
**Version:** 1.0.0

