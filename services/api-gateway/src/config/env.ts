export const config = {
  port: parseInt(process.env.PORT || '8000'),
  userServiceUrl: process.env.USER_SERVICE_URL || 'http://localhost:8001',
  listingServiceUrl: process.env.LISTING_SERVICE_URL || 'http://localhost:8002',
  bookingBillingServiceUrl: process.env.BOOKING_BILLING_SERVICE_URL || 'http://localhost:8003',
  analyticsServiceUrl: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:8004',
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8005',
  adminServiceUrl: process.env.ADMIN_SERVICE_URL || 'http://localhost:8006'
}

