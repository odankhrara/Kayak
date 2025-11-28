/**
 * Click tracking utility
 * Tracks user clicks and sends events to analytics service via Kafka
 */

interface ClickEvent {
  elementType: 'button' | 'link' | 'card' | 'listing' | 'property' | 'other'
  elementId: string
  elementText: string
  pageUrl: string
  pageTitle?: string
  metadata?: Record<string, any>
}

const API_BASE_URL = '/api/tracking'

/**
 * Track a click event
 */
export async function trackClick(event: ClickEvent): Promise<void> {
  try {
    const clickData = {
      log_type: 'click',
      element_type: event.elementType,
      element_id: event.elementId,
      element_text: event.elementText,
      page_url: event.pageUrl || window.location.pathname,
      page_title: event.pageTitle || document.title,
      timestamp: new Date().toISOString(),
      user_id: getUserId(),
      session_id: getSessionId(),
      user_agent: navigator.userAgent,
      device_type: getDeviceType(),
      location: await getLocation(),
      metadata: event.metadata || {}
    }

    // Send to tracking service (which will publish to Kafka)
    await fetch(`${API_BASE_URL}/click`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(clickData)
    })
  } catch (error) {
    console.error('Failed to track click:', error)
    // Fail silently - don't break user experience
  }
}

/**
 * Track a page view
 */
export async function trackPageView(pageUrl: string, pageTitle?: string): Promise<void> {
  try {
    const pageViewData = {
      log_type: 'page_view',
      page_url: pageUrl || window.location.pathname,
      page_title: pageTitle || document.title,
      referrer: document.referrer,
      timestamp: new Date().toISOString(),
      user_id: getUserId(),
      session_id: getSessionId(),
      user_agent: navigator.userAgent,
      device_type: getDeviceType(),
      location: await getLocation(),
      page_load_time: performance.now() / 1000
    }

    await fetch(`${API_BASE_URL}/page-view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(pageViewData)
    })
  } catch (error) {
    console.error('Failed to track page view:', error)
  }
}

/**
 * Track a search event
 */
export async function trackSearch(searchParams: Record<string, any>, resultsCount: number): Promise<void> {
  try {
    const searchData = {
      log_type: 'search',
      search_params: searchParams,
      results_count: resultsCount,
      timestamp: new Date().toISOString(),
      user_id: getUserId(),
      session_id: getSessionId(),
      page_url: window.location.pathname,
      user_agent: navigator.userAgent,
      device_type: getDeviceType(),
      location: await getLocation()
    }

    await fetch(`${API_BASE_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchData)
    })
  } catch (error) {
    console.error('Failed to track search:', error)
  }
}

/**
 * Track a booking attempt
 */
export async function trackBookingAttempt(propertyId: string, propertyType: string, price: number): Promise<void> {
  try {
    const bookingData = {
      log_type: 'booking_attempt',
      element_id: propertyId,
      element_type: propertyType,
      timestamp: new Date().toISOString(),
      user_id: getUserId(),
      session_id: getSessionId(),
      page_url: window.location.pathname,
      metadata: {
        price,
        property_type: propertyType
      }
    }

    await fetch(`${API_BASE_URL}/booking-attempt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bookingData)
    })
  } catch (error) {
    console.error('Failed to track booking attempt:', error)
  }
}

// Helper functions

function getUserId(): string | null {
  // Get from localStorage or auth context
  const userStr = localStorage.getItem('user')
  if (userStr) {
    try {
      const user = JSON.parse(userStr)
      return user.id || user.userId || null
    } catch {
      return null
    }
  }
  return null
}

function getSessionId(): string {
  let sessionId = sessionStorage.getItem('session_id')
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem('session_id', sessionId)
  }
  return sessionId
}

function getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
  const width = window.innerWidth
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

async function getLocation(): Promise<{ city?: string; state?: string; country?: string }> {
  // In a real app, you might use IP geolocation or ask the user
  // For now, return empty or use a default
  return {
    country: 'USA'
  }
}

/**
 * React hook for tracking clicks on elements
 */
export function useClickTracking() {
  const handleClick = (event: ClickEvent) => {
    trackClick(event)
  }

  return { trackClick: handleClick }
}

