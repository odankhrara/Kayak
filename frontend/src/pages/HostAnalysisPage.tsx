import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import { adminApi } from '../api/adminApi'
import { ClicksPerPageChart } from '../components/charts/ClicksPerPageChart'
import { PropertyClicksChart } from '../components/charts/PropertyClicksChart'
import { ReviewsChart } from '../components/charts/ReviewsChart'
import { UserTraceDiagram } from '../components/trace/UserTraceDiagram'
import { BiddingTraceDiagram } from '../components/trace/BiddingTraceDiagram'
import './HostAnalysisPage.css'

export default function HostAnalysisPage() {
  const { user, setLoading, setError } = useStore()
  const [clicksPerPage, setClicksPerPage] = useState<any[]>([])
  const [propertyClicks, setPropertyClicks] = useState<any[]>([])
  const [leastSeenAreas, setLeastSeenAreas] = useState<any[]>([])
  const [propertyReviews, setPropertyReviews] = useState<any[]>([])
  const [userTraces, setUserTraces] = useState<any[]>([])
  const [biddingTraces, setBiddingTraces] = useState<any[]>([])

  // Filters
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [propertyType, setPropertyType] = useState<'hotel' | 'flight' | 'car' | ''>('')
  const [traceUserId, setTraceUserId] = useState<string>('')
  const [traceCity, setTraceCity] = useState<string>('')
  const [traceState, setTraceState] = useState<string>('')
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('')

  useEffect(() => {
    if (user?.role === 'admin') {
      loadAllData()
    }
  }, [user])

  const loadAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadClicksPerPage(),
        loadPropertyClicks(),
        loadLeastSeenAreas(),
        loadPropertyReviews(),
        loadUserTraces(),
        loadBiddingTraces()
      ])
    } catch (error: any) {
      setError('Failed to load host analysis data')
    } finally {
      setLoading(false)
    }
  }

  const loadClicksPerPage = async () => {
    try {
      const data = await adminApi.getClicksPerPage(startDate || undefined, endDate || undefined)
      setClicksPerPage(data)
    } catch (error) {
      console.error('Failed to load clicks per page:', error)
    }
  }

  const loadPropertyClicks = async () => {
    try {
      const data = await adminApi.getPropertyClicks(startDate || undefined, endDate || undefined)
      setPropertyClicks(data)
    } catch (error) {
      console.error('Failed to load property clicks:', error)
    }
  }

  const loadLeastSeenAreas = async () => {
    try {
      const data = await adminApi.getLeastSeenAreas(startDate || undefined, endDate || undefined)
      setLeastSeenAreas(data)
    } catch (error) {
      console.error('Failed to load least seen areas:', error)
    }
  }

  const loadPropertyReviews = async () => {
    try {
      const data = await adminApi.getPropertyReviews(
        propertyType ? (propertyType as 'hotel' | 'flight' | 'car') : undefined
      )
      setPropertyReviews(data)
    } catch (error) {
      console.error('Failed to load property reviews:', error)
    }
  }

  const loadUserTraces = async () => {
    try {
      const data = await adminApi.getUserTrace(
        traceUserId || undefined,
        traceCity || undefined,
        traceState || undefined
      )
      setUserTraces(data)
    } catch (error) {
      console.error('Failed to load user traces:', error)
    }
  }

  const loadBiddingTraces = async () => {
    try {
      const data = await adminApi.getBiddingTrace(selectedPropertyId || undefined)
      setBiddingTraces(data)
    } catch (error) {
      console.error('Failed to load bidding traces:', error)
    }
  }

  const handleFilterChange = () => {
    loadAllData()
  }

  if (user?.role !== 'admin') {
    return <div className="loading">Access denied. Admin access required.</div>
  }

  return (
    <div className="host-analysis-page">
      <h2>Host/Provider Analysis Reports</h2>

      {/* Filters */}
      <div className="analysis-filters">
        <div className="filter-group">
          <label>Start Date:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>End Date:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>Property Type:</label>
          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value as any)}
          >
            <option value="">All</option>
            <option value="hotel">Hotel</option>
            <option value="flight">Flight</option>
            <option value="car">Car</option>
          </select>
        </div>
        <button onClick={handleFilterChange} className="apply-filters-btn">
          Apply Filters
        </button>
      </div>

      {/* Clicks per Page Chart */}
      <div className="analysis-section">
        <ClicksPerPageChart data={clicksPerPage} chartType="bar" />
        <ClicksPerPageChart data={clicksPerPage} chartType="pie" />
      </div>

      {/* Property Clicks Chart */}
      <div className="analysis-section">
        <PropertyClicksChart data={propertyClicks} />
      </div>

      {/* Least Seen Areas */}
      <div className="analysis-section">
        <div className="chart-container">
          <h3>Least Seen Areas/Sections</h3>
          <div className="least-seen-list">
            {leastSeenAreas.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Page/Area</th>
                    <th>Views</th>
                  </tr>
                </thead>
                <tbody>
                  {leastSeenAreas.map((area, index) => (
                    <tr key={index}>
                      <td>{area.page}</td>
                      <td>{area.views}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Reviews Chart */}
      <div className="analysis-section">
        <ReviewsChart data={propertyReviews} />
      </div>

      {/* User Trace Diagram */}
      <div className="analysis-section">
        <div className="trace-filters">
          <div className="filter-group">
            <label>User ID:</label>
            <input
              type="text"
              value={traceUserId}
              onChange={(e) => setTraceUserId(e.target.value)}
              placeholder="e.g., 123-45-6789"
            />
          </div>
          <div className="filter-group">
            <label>City:</label>
            <input
              type="text"
              value={traceCity}
              onChange={(e) => setTraceCity(e.target.value)}
              placeholder="e.g., San Jose"
            />
          </div>
          <div className="filter-group">
            <label>State:</label>
            <input
              type="text"
              value={traceState}
              onChange={(e) => setTraceState(e.target.value)}
              placeholder="e.g., CA"
            />
          </div>
          <button onClick={loadUserTraces} className="apply-filters-btn">
            Load Trace
          </button>
        </div>
        <UserTraceDiagram
          traces={userTraces}
          selectedUserId={traceUserId || undefined}
          selectedCity={traceCity || undefined}
          selectedState={traceState || undefined}
        />
      </div>

      {/* Bidding Trace Diagram */}
      <div className="analysis-section">
        <div className="trace-filters">
          <div className="filter-group">
            <label>Property ID:</label>
            <input
              type="text"
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              placeholder="Optional: Filter by property ID"
            />
          </div>
          <button onClick={loadBiddingTraces} className="apply-filters-btn">
            Load Bidding Trace
          </button>
        </div>
        <BiddingTraceDiagram
          traces={biddingTraces}
          selectedPropertyId={selectedPropertyId || undefined}
        />
      </div>
    </div>
  )
}

