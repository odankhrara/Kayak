// Kayak Travel Booking System - MongoDB Initialization Script
// Auto-executed by Docker on container initialization

// Switch to kayak database
db = db.getSiblingDB('kayak');

print('Creating MongoDB collections and indexes for Kayak...');

// ============================================
// 1. REVIEWS COLLECTION
// ============================================
db.createCollection('reviews', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['review_id', 'user_id', 'listing_type', 'listing_id', 'rating'],
      properties: {
        review_id: { bsonType: 'string' },
        user_id: { bsonType: 'string' },
        listing_type: { enum: ['flight', 'hotel', 'car'] },
        listing_id: { bsonType: 'string' },
        rating: { bsonType: 'int', minimum: 1, maximum: 5 },
        title: { bsonType: 'string' },
        comment: { bsonType: 'string' },
        helpful_count: { bsonType: 'int' },
        verified_booking: { bsonType: 'bool' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' }
      }
    }
  }
});

// Create indexes for reviews
db.reviews.createIndex({ listing_id: 1, listing_type: 1 });
db.reviews.createIndex({ user_id: 1 });
db.reviews.createIndex({ rating: -1 });
db.reviews.createIndex({ created_at: -1 });

// Insert sample reviews
db.reviews.insertMany([
  {
    review_id: 'REV001',
    user_id: '123-45-6789',
    listing_type: 'flight',
    listing_id: 'AA100',
    rating: 5,
    title: 'Excellent flight!',
    comment: 'The flight was on time, staff was friendly, and the seats were comfortable.',
    helpful_count: 12,
    verified_booking: true,
    created_at: new Date('2025-11-20T10:00:00Z'),
    updated_at: new Date('2025-11-20T10:00:00Z')
  },
  {
    review_id: 'REV002',
    user_id: '234-56-7890',
    listing_type: 'hotel',
    listing_id: 'HT001',
    rating: 4,
    title: 'Great stay!',
    comment: 'Hotel was clean, location was perfect, and breakfast was delicious.',
    helpful_count: 8,
    verified_booking: true,
    created_at: new Date('2025-11-21T14:30:00Z'),
    updated_at: new Date('2025-11-21T14:30:00Z')
  },
  {
    review_id: 'REV003',
    user_id: '345-67-8901',
    listing_type: 'car',
    listing_id: 'CAR001',
    rating: 4,
    title: 'Good car rental',
    comment: 'Car was clean and ran smoothly. Pickup process was quick.',
    helpful_count: 5,
    verified_booking: true,
    created_at: new Date('2025-11-22T09:15:00Z'),
    updated_at: new Date('2025-11-22T09:15:00Z')
  },
  {
    review_id: 'REV004',
    user_id: '456-78-9012',
    listing_type: 'hotel',
    listing_id: 'HT002',
    rating: 5,
    title: 'Amazing beachfront resort!',
    comment: 'The ocean view was breathtaking. Staff went above and beyond.',
    helpful_count: 20,
    verified_booking: true,
    created_at: new Date('2025-11-23T11:00:00Z'),
    updated_at: new Date('2025-11-23T11:00:00Z')
  },
  {
    review_id: 'REV005',
    user_id: '567-89-0123',
    listing_type: 'flight',
    listing_id: 'UA200',
    rating: 3,
    title: 'Average experience',
    comment: 'Flight was okay, but there was a delay and limited food options.',
    helpful_count: 3,
    verified_booking: true,
    created_at: new Date('2025-11-24T16:45:00Z'),
    updated_at: new Date('2025-11-24T16:45:00Z')
  }
]);

print('✅ Reviews collection created with 5 sample reviews');

// ============================================
// 2. IMAGES COLLECTION
// ============================================
db.createCollection('images');

// Create indexes for images
db.images.createIndex({ entity_id: 1, image_type: 1 });
db.images.createIndex({ is_primary: 1 });

// Insert sample images
db.images.insertMany([
  {
    image_id: 'IMG001',
    image_type: 'profile',
    entity_id: '123-45-6789',
    image_url: 'https://cdn.kayak-sim.com/profiles/123-45-6789.jpg',
    thumbnail_url: 'https://cdn.kayak-sim.com/profiles/123-45-6789_thumb.jpg',
    alt_text: 'User profile picture',
    is_primary: true,
    file_size: 204800,
    dimensions: { width: 400, height: 400 },
    uploaded_at: new Date('2025-11-10T10:00:00Z')
  },
  {
    image_id: 'IMG002',
    image_type: 'hotel',
    entity_id: 'HT001',
    image_url: 'https://cdn.kayak-sim.com/hotels/HT001/main.jpg',
    thumbnail_url: 'https://cdn.kayak-sim.com/hotels/HT001/main_thumb.jpg',
    alt_text: 'Grand Plaza Hotel exterior',
    is_primary: true,
    order: 1,
    file_size: 1048576,
    dimensions: { width: 1920, height: 1080 },
    uploaded_at: new Date('2025-11-01T08:00:00Z')
  },
  {
    image_id: 'IMG003',
    image_type: 'hotel',
    entity_id: 'HT001',
    image_url: 'https://cdn.kayak-sim.com/hotels/HT001/room1.jpg',
    thumbnail_url: 'https://cdn.kayak-sim.com/hotels/HT001/room1_thumb.jpg',
    alt_text: 'Hotel room interior',
    is_primary: false,
    order: 2,
    file_size: 819200,
    dimensions: { width: 1920, height: 1080 },
    uploaded_at: new Date('2025-11-01T08:05:00Z')
  },
  {
    image_id: 'IMG004',
    image_type: 'car',
    entity_id: 'CAR001',
    image_url: 'https://cdn.kayak-sim.com/cars/CAR001.jpg',
    thumbnail_url: 'https://cdn.kayak-sim.com/cars/CAR001_thumb.jpg',
    alt_text: 'Toyota Camry 2024',
    is_primary: true,
    file_size: 524288,
    dimensions: { width: 1280, height: 720 },
    uploaded_at: new Date('2025-11-05T12:00:00Z')
  }
]);

print('✅ Images collection created with 4 sample images');

// ============================================
// 3. LOGS COLLECTION (User Activity Tracking)
// ============================================
db.createCollection('logs');

// Create indexes for logs
db.logs.createIndex({ user_id: 1, timestamp: -1 });
db.logs.createIndex({ session_id: 1 });
db.logs.createIndex({ log_type: 1, timestamp: -1 });
db.logs.createIndex({ timestamp: -1 });
db.logs.createIndex({ 'location.city': 1, 'location.state': 1 });

// TTL index - auto-delete logs older than 90 days
db.logs.createIndex({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

// Insert sample logs
db.logs.insertMany([
  {
    log_id: 'LOG001',
    log_type: 'page_view',
    user_id: '123-45-6789',
    session_id: 'sess_abc123',
    timestamp: new Date(),
    page_url: '/flights/search',
    page_title: 'Flight Search',
    referrer: '/home',
    user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    ip_address: '192.168.1.1',
    device_type: 'desktop',
    location: { city: 'San Jose', state: 'CA', country: 'USA' },
    page_load_time: 1.2
  },
  {
    log_id: 'LOG002',
    log_type: 'search',
    user_id: '123-45-6789',
    session_id: 'sess_abc123',
    timestamp: new Date(),
    search_params: {
      type: 'flight',
      origin: 'SFO',
      destination: 'JFK',
      departure_date: '2025-12-10',
      passengers: 2
    },
    results_count: 15,
    user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    ip_address: '192.168.1.1',
    device_type: 'desktop',
    location: { city: 'San Jose', state: 'CA', country: 'USA' }
  },
  {
    log_id: 'LOG003',
    log_type: 'click',
    user_id: '123-45-6789',
    session_id: 'sess_abc123',
    timestamp: new Date(),
    element_type: 'button',
    element_id: 'book-now-btn',
    element_text: 'Book Now',
    page_url: '/flights/AA100',
    user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    ip_address: '192.168.1.1',
    device_type: 'desktop',
    location: { city: 'San Jose', state: 'CA', country: 'USA' }
  }
]);

print('✅ Logs collection created with 3 sample logs (TTL: 90 days)');

// ============================================
// 4. DEALS COLLECTION (AI Service)
// ============================================
db.createCollection('deals');

// Create indexes for deals
db.deals.createIndex({ listing_id: 1, listing_type: 1 });
db.deals.createIndex({ deal_score: -1 });
db.deals.createIndex({ tags: 1 });
db.deals.createIndex({ valid_until: 1 });
db.deals.createIndex({ status: 1 });
db.deals.createIndex({ current_price: 1 });

// Insert sample deals
db.deals.insertMany([
  {
    deal_id: 'DEAL001',
    listing_type: 'hotel',
    listing_id: 'HT001',
    current_price: 120.00,
    original_price: 180.00,
    avg_30d_price: 175.00,
    discount_percentage: 33,
    deal_score: 85,
    deal_reasons: ['price_drop', 'seasonal_promo'],
    available_inventory: 8,
    limited_inventory: false,
    tags: ['wifi', 'breakfast_included', 'refundable'],
    valid_from: new Date('2025-11-25T00:00:00Z'),
    valid_until: new Date('2025-12-31T23:59:59Z'),
    discovered_at: new Date('2025-11-25T10:00:00Z'),
    last_updated: new Date('2025-11-25T10:00:00Z'),
    metadata: {
      amenities: ['WiFi', 'Parking', 'Gym'],
      neighborhood: 'Downtown',
      cancellation_policy: 'Free cancellation until 24 hours before check-in'
    },
    status: 'active'
  },
  {
    deal_id: 'DEAL002',
    listing_type: 'flight',
    listing_id: 'AA100',
    current_price: 249.99,
    original_price: 299.99,
    avg_30d_price: 295.00,
    discount_percentage: 17,
    deal_score: 75,
    deal_reasons: ['price_drop'],
    available_inventory: 15,
    limited_inventory: true,
    tags: ['direct_flight', 'refundable'],
    valid_from: new Date('2025-11-25T00:00:00Z'),
    valid_until: new Date('2025-12-10T00:00:00Z'),
    discovered_at: new Date('2025-11-25T11:00:00Z'),
    last_updated: new Date('2025-11-25T11:00:00Z'),
    metadata: {
      airline: 'American Airlines',
      duration: '5.5 hours',
      stops: 0
    },
    status: 'active'
  }
]);

print('✅ Deals collection created with 2 sample deals');

// ============================================
// 5. BUNDLES COLLECTION (AI Service)
// ============================================
db.createCollection('bundles');

// Create indexes for bundles
db.bundles.createIndex({ user_id: 1, created_at: -1 });
db.bundles.createIndex({ session_id: 1 });
db.bundles.createIndex({ fit_score: -1 });
db.bundles.createIndex({ status: 1 });
db.bundles.createIndex({ expires_at: 1 });

// Insert sample bundles
db.bundles.insertMany([
  {
    bundle_id: 'BND001',
    user_id: '123-45-6789',
    session_id: 'sess_abc123',
    flight: {
      flight_id: 'AA100',
      departure_airport: 'SFO',
      arrival_airport: 'JFK',
      departure_datetime: new Date('2025-12-10T08:00:00Z'),
      return_flight_id: null,
      return_datetime: null,
      price: 249.99
    },
    hotel: {
      hotel_id: 'HT003',
      hotel_name: 'Downtown Suites',
      check_in: new Date('2025-12-10T00:00:00Z'),
      check_out: new Date('2025-12-15T00:00:00Z'),
      nights: 5,
      price_per_night: 150.00,
      total_price: 750.00
    },
    total_price: 999.99,
    savings: 100.00,
    discount_percentage: 9,
    fit_score: 92,
    why_this: 'Best value with downtown location and free breakfast',
    what_to_watch: 'Only 5 rooms left at this price',
    tradeoffs: 'Early morning departure, but saves $100',
    preferences_matched: ['downtown_location', 'breakfast_included'],
    preferences_missed: [],
    status: 'active',
    created_at: new Date(),
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
  }
]);

print('✅ Bundles collection created with 1 sample bundle');

// ============================================
// 6. WATCHES COLLECTION (AI Service - Price Alerts)
// ============================================
db.createCollection('watches');

// Create indexes for watches
db.watches.createIndex({ user_id: 1, status: 1 });
db.watches.createIndex({ bundle_id: 1 });
db.watches.createIndex({ status: 1, expires_at: 1 });

// Insert sample watch
db.watches.insertMany([
  {
    watch_id: 'WATCH001',
    user_id: '123-45-6789',
    bundle_id: 'BND001',
    price_threshold: 900.00,
    inventory_threshold: 5,
    current_price: 999.99,
    current_inventory: 8,
    notification_method: 'websocket',
    notification_sent: false,
    last_notification: null,
    status: 'active',
    created_at: new Date(),
    expires_at: new Date('2025-12-10T00:00:00Z')
  }
]);

print('✅ Watches collection created with 1 sample watch');

// ============================================
// SUMMARY
// ============================================
print('\n========================================');
print('MongoDB Initialization Complete! ✅');
print('========================================');
print('Collections created:');
print('  - reviews (5 documents)');
print('  - images (4 documents)');
print('  - logs (3 documents, TTL 90 days)');
print('  - deals (2 documents)');
print('  - bundles (1 document)');
print('  - watches (1 document)');
print('\nAll indexes created successfully.');
print('========================================\n');

