import { useEffect, useState } from 'react'
import './TraceDiagram.css'

interface TraceEvent {
  type: string
  page: string
  timestamp: string
  element?: string
  action?: string
}

interface UserTrace {
  sessionId: string
  userId: string
  location?: { city: string; state: string; country: string }
  events: TraceEvent[]
  duration: number
  startTime: string
  endTime: string
}

interface UserTraceDiagramProps {
  traces: UserTrace[]
  selectedUserId?: string
  selectedCity?: string
  selectedState?: string
}

export function UserTraceDiagram({ traces, selectedUserId, selectedCity, selectedState }: UserTraceDiagramProps) {
  const [selectedTrace, setSelectedTrace] = useState<UserTrace | null>(null)

  useEffect(() => {
    if (traces.length > 0 && !selectedTrace) {
      setSelectedTrace(traces[0])
    }
  }, [traces])

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    return `${minutes}m ${seconds % 60}s`
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'page_view': return '👁️'
      case 'click': return '🖱️'
      case 'search': return '🔍'
      case 'booking_attempt': return '📝'
      default: return '•'
    }
  }

  if (traces.length === 0) {
    return (
      <div className="trace-diagram">
        <p>No trace data available</p>
      </div>
    )
  }

  return (
    <div className="trace-diagram">
      <h3>User Trace Diagram</h3>
      
      {selectedUserId && (
        <div className="trace-filter">
          <strong>User ID:</strong> {selectedUserId}
        </div>
      )}
      
      {selectedCity && selectedState && (
        <div className="trace-filter">
          <strong>Location:</strong> {selectedCity}, {selectedState}
        </div>
      )}

      <div className="trace-selector">
        <label>Select Session:</label>
        <select 
          value={selectedTrace?.sessionId || ''} 
          onChange={(e) => {
            const trace = traces.find(t => t.sessionId === e.target.value)
            setSelectedTrace(trace || null)
          }}
        >
          {traces.map(trace => (
            <option key={trace.sessionId} value={trace.sessionId}>
              {trace.sessionId} - {new Date(trace.startTime).toLocaleString()} 
              ({formatDuration(trace.duration)})
            </option>
          ))}
        </select>
      </div>

      {selectedTrace && (
        <div className="trace-timeline">
          <div className="trace-header">
            <div>
              <strong>Session:</strong> {selectedTrace.sessionId}
            </div>
            <div>
              <strong>Duration:</strong> {formatDuration(selectedTrace.duration)}
            </div>
            {selectedTrace.location && (
              <div>
                <strong>Location:</strong> {selectedTrace.location.city}, {selectedTrace.location.state}
              </div>
            )}
          </div>

          <div className="trace-events">
            {selectedTrace.events.map((event, index) => (
              <div key={index} className="trace-event">
                <div className="event-icon">{getEventIcon(event.type)}</div>
                <div className="event-details">
                  <div className="event-type">{event.type}</div>
                  <div className="event-page">{event.page}</div>
                  {event.element && (
                    <div className="event-element">Element: {event.element}</div>
                  )}
                  {event.action && (
                    <div className="event-action">Action: {event.action}</div>
                  )}
                  <div className="event-time">
                    {new Date(event.timestamp).toLocaleTimeString()}
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
        <p>Total Sessions: {traces.length}</p>
        <p>Total Events: {traces.reduce((sum, t) => sum + t.events.length, 0)}</p>
        <p>Average Session Duration: {formatDuration(
          traces.reduce((sum, t) => sum + t.duration, 0) / traces.length
        )}</p>
      </div>
    </div>
  )
}

