import { Router, Request, Response } from 'express'
import { createProducer } from '@kayak/common/src/kafka/kafkaClient'
import { KAFKA_TOPICS } from '@kayak/common/src/kafka/topics'

const router = Router()
let producer: ReturnType<typeof createProducer> | null = null

// Initialize Kafka producer
async function getProducer() {
  if (!producer) {
    producer = createProducer()
    await producer.connect()
    console.log('Kafka producer connected for tracking service')
  }
  return producer
}

// Initialize producer on startup
getProducer().catch(err => {
  console.error('Failed to initialize Kafka producer:', err)
})

/**
 * @route   POST /api/tracking/click
 * @desc    Track click events
 * @access  Public (no auth required for tracking)
 */
router.post('/click', async (req: Request, res: Response) => {
  try {
    const clickData = {
      ...req.body,
      timestamp: req.body.timestamp || new Date().toISOString()
    }

    const kafkaProducer = await getProducer()
    await kafkaProducer.send({
      topic: KAFKA_TOPICS.CLICK_EVENT,
      messages: [
        {
          key: clickData.user_id || clickData.session_id || 'anonymous',
          value: JSON.stringify(clickData)
        }
      ]
    })

    res.status(200).json({ success: true, message: 'Click event tracked' })
  } catch (error: any) {
    console.error('Error tracking click:', error)
    res.status(500).json({ error: 'Failed to track click event' })
  }
})

/**
 * @route   POST /api/tracking/page-view
 * @desc    Track page view events
 * @access  Public
 */
router.post('/page-view', async (req: Request, res: Response) => {
  try {
    const pageViewData = {
      ...req.body,
      timestamp: req.body.timestamp || new Date().toISOString()
    }

    const kafkaProducer = await getProducer()
    await kafkaProducer.send({
      topic: KAFKA_TOPICS.USER_TRACKING,
      messages: [
        {
          key: pageViewData.user_id || pageViewData.session_id || 'anonymous',
          value: JSON.stringify({
            ...pageViewData,
            log_type: 'page_view'
          })
        }
      ]
    })

    res.status(200).json({ success: true, message: 'Page view tracked' })
  } catch (error: any) {
    console.error('Error tracking page view:', error)
    res.status(500).json({ error: 'Failed to track page view' })
  }
})

/**
 * @route   POST /api/tracking/search
 * @desc    Track search events
 * @access  Public
 */
router.post('/search', async (req: Request, res: Response) => {
  try {
    const searchData = {
      ...req.body,
      timestamp: req.body.timestamp || new Date().toISOString()
    }

    const kafkaProducer = await getProducer()
    await kafkaProducer.send({
      topic: KAFKA_TOPICS.USER_TRACKING,
      messages: [
        {
          key: searchData.user_id || searchData.session_id || 'anonymous',
          value: JSON.stringify({
            ...searchData,
            log_type: 'search'
          })
        }
      ]
    })

    res.status(200).json({ success: true, message: 'Search event tracked' })
  } catch (error: any) {
    console.error('Error tracking search:', error)
    res.status(500).json({ error: 'Failed to track search event' })
  }
})

/**
 * @route   POST /api/tracking/booking-attempt
 * @desc    Track booking attempt events
 * @access  Public
 */
router.post('/booking-attempt', async (req: Request, res: Response) => {
  try {
    const bookingData = {
      ...req.body,
      timestamp: req.body.timestamp || new Date().toISOString()
    }

    const kafkaProducer = await getProducer()
    await kafkaProducer.send({
      topic: KAFKA_TOPICS.USER_TRACKING,
      messages: [
        {
          key: bookingData.user_id || bookingData.session_id || 'anonymous',
          value: JSON.stringify({
            ...bookingData,
            log_type: 'booking_attempt'
          })
        }
      ]
    })

    res.status(200).json({ success: true, message: 'Booking attempt tracked' })
  } catch (error: any) {
    console.error('Error tracking booking attempt:', error)
    res.status(500).json({ error: 'Failed to track booking attempt' })
  }
})

/**
 * @route   POST /api/tracking/event
 * @desc    Generic event tracking endpoint
 * @access  Public
 */
router.post('/event', async (req: Request, res: Response) => {
  try {
    const eventData = {
      ...req.body,
      timestamp: req.body.timestamp || new Date().toISOString()
    }

    const kafkaProducer = await getProducer()
    
    // Determine topic based on event type
    let topic = KAFKA_TOPICS.USER_TRACKING
    if (eventData.log_type === 'click') {
      topic = KAFKA_TOPICS.CLICK_EVENT
    }

    await kafkaProducer.send({
      topic,
      messages: [
        {
          key: eventData.user_id || eventData.session_id || 'anonymous',
          value: JSON.stringify(eventData)
        }
      ]
    })

    res.status(200).json({ success: true, message: 'Event tracked' })
  } catch (error: any) {
    console.error('Error tracking event:', error)
    res.status(500).json({ error: 'Failed to track event' })
  }
})

export default router

