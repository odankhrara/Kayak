export const KAFKA_TOPICS = {
  BOOKING_CREATED: 'booking_created',
  BOOKING_UPDATED: 'booking_updated',
  PAYMENT_SUCCEEDED: 'payment_succeeded',
  PAYMENT_FAILED: 'payment_failed',
  USER_TRACKING: 'user_tracking',
  CLICK_EVENT: 'click_event',
  RAW_SUPPLIER_FEEDS: 'raw_supplier_feeds'
} as const

export type KafkaTopic = typeof KAFKA_TOPICS[keyof typeof KAFKA_TOPICS]

