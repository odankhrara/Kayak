import { useState } from 'react'
import './TraceDiagram.css'

interface BiddingEvent {
  type: string
  userId: string
  timestamp: string
  searchParams?: any
  price?: number
}

interface BiddingTrace {
  propertyId: string
  propertyName: string
  events: BiddingEvent[]
  clickCount: number
  searchCount: number
  bookingAttempts: number
  conversionRate: number
}

interface BiddingTraceDiagramProps {
  traces: BiddingTrace[]
  selectedPropertyId?: string
}

export function BiddingTraceDiagram({ traces, selectedPropertyId }: BiddingTraceDiagramProps) {
  const [selectedTrace, setSelectedTrace] = useState<BiddingTrace | null>(null)

  if (traces.length === 0) {
    return (
      <div className="trace-diagram">
        <p>No bidding trace data available</p>
      </div>
    )
  }

  if (!selectedTrace && traces.length > 0) {
    const trace = selectedPropertyId 
      ? traces.find(t => t.propertyId === selectedPropertyId) || traces[0]
      : traces[0]
    setSelectedTrace(trace)
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'click': return '🖱️'
      case 'search': return '🔍'
      case 'booking_attempt': return '📝'
      default: return '•'
    }
  }

  return (
    <div className="trace-diagram">
      <h3>Bidding/Limited Offers Trace Diagram</h3>

      {selectedPropertyId && (
        <div className="trace-filter">
          <strong>Property ID:</strong> {selectedPropertyId}
        </div>
      )}

      <div className="trace-selector">
        <label>Select Property:</label>
        <select 
          value={selectedTrace?.propertyId || ''} 
          onChange={(e) => {
            const trace = traces.find(t => t.propertyId === e.target.value)
            setSelectedTrace(trace || null)
          }}
        >
          {traces.map(trace => (
            <option key={trace.propertyId} value={trace.propertyId}>
              {trace.propertyName} - {trace.clickCount} clicks, {trace.conversionRate.toFixed(1)}% conversion
            </option>
          ))}
        </select>
      </div>

      {selectedTrace && (
        <div className="trace-timeline">
          <div className="trace-header">
            <div>
              <strong>Property:</strong> {selectedTrace.propertyName}
            </div>
            <div>
              <strong>Property ID:</strong> {selectedTrace.propertyId}
            </div>
          </div>

          <div className="trace-stats">
            <div className="stat-box">
              <div className="stat-value">{selectedTrace.clickCount}</div>
              <div className="stat-label">Clicks</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{selectedTrace.searchCount}</div>
              <div className="stat-label">Searches</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{selectedTrace.bookingAttempts}</div>
              <div className="stat-label">Booking Attempts</div>
            </div>
            <div className="stat-box highlight">
              <div className="stat-value">{selectedTrace.conversionRate.toFixed(1)}%</div>
              <div className="stat-label">Conversion Rate</div>
            </div>
          </div>

          <div className="trace-events">
            <h4>Event Timeline</h4>
            {selectedTrace.events.map((event, index) => (
              <div key={index} className="trace-event">
                <div className="event-icon">{getEventIcon(event.type)}</div>
                <div className="event-details">
                  <div className="event-type">{event.type}</div>
                  <div className="event-user">User: {event.userId}</div>
                  {event.searchParams && (
                    <div className="event-search">
                      Search: {JSON.stringify(event.searchParams, null, 2)}
                    </div>
                  )}
                  {event.price && (
                    <div className="event-price">Price: ${event.price}</div>
                  )}
                  <div className="event-time">
                    {new Date(event.timestamp).toLocaleString()}
                  </div>
                </div>
                {index < selectedTrace.events.length - 1 && (
                  <div className="event-arrow">↓</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="trace-summary">
        <h4>Summary</h4>
        <p>Total Properties Tracked: {traces.length}</p>
        <p>Total Clicks: {traces.reduce((sum, t) => sum + t.clickCount, 0)}</p>
        <p>Total Booking Attempts: {traces.reduce((sum, t) => sum + t.bookingAttempts, 0)}</p>
        <p>Average Conversion Rate: {
          (traces.reduce((sum, t) => sum + t.conversionRate, 0) / traces.length).toFixed(1)
        }%</p>
      </div>
    </div>
  )
}

