import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import { useAuthStore } from '../store/authStore'
import { adminApi } from '../api/adminApi'
import { ClicksPerPageChart } from '../components/charts/ClicksPerPageChart'
import { PropertyClicksChart } from '../components/charts/PropertyClicksChart'
import { ReviewsChart } from '../components/charts/ReviewsChart'
import { UserTraceDiagram } from '../components/trace/UserTraceDiagram'
import { BiddingTraceDiagram } from '../components/trace/BiddingTraceDiagram'
import './HostAnalysisPage.css'

// Provider Analytics Types
interface ProviderData {
  provider: string
  totalBookings?: number
  totalRentals?: number
  totalRevenue: number
  avgRating: number
  totalFlights?: number
  totalProperties?: number
  totalVehicles?: number
  avgStars?: number
}

interface ProvidersSummary {
  airlines: { providers: ProviderData[]; totalRevenue: number; totalProviders: number }
  hotels: { providers: ProviderData[]; totalRevenue: number; totalProviders: number }
  carCompanies: { providers: ProviderData[]; totalRevenue: number; totalProviders: number }
  grandTotal: number
}

export default function HostAnalysisPage() {
  const { setLoading, setError } = useStore()
  const { user } = useAuthStore()
  const [clicksPerPage, setClicksPerPage] = useState<any[]>([])
  const [propertyClicks, setPropertyClicks] = useState<any[]>([])
  const [leastSeenAreas, setLeastSeenAreas] = useState<any[]>([])
  const [propertyReviews, setPropertyReviews] = useState<any[]>([])
  const [userTraces, setUserTraces] = useState<any[]>([])
  const [biddingTraces, setBiddingTraces] = useState<any[]>([])

  // Provider Analytics State
  const [providersSummary, setProvidersSummary] = useState<ProvidersSummary | null>(null)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [activeProviderTab, setActiveProviderTab] = useState<'airlines' | 'hotels' | 'cars'>('airlines')

  // Filters
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [propertyType, setPropertyType] = useState<'hotel' | 'flight' | 'car' | ''>('')
  const [traceUserId, setTraceUserId] = useState<string>('')
  const [traceCity, setTraceCity] = useState<string>('')
  const [traceState, setTraceState] = useState<string>('')
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('')

  useEffect(() => {
    if (user && user.isAdmin) {
      loadAllData()
    }
  }, [user])

  useEffect(() => {
    if (user && user.isAdmin) {
      loadProvidersSummary()
    }
  }, [selectedYear, user])

  const loadAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadProvidersSummary(),
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

  const loadProvidersSummary = async () => {
    try {
      const data = await adminApi.getProvidersSummary(selectedYear)
      setProvidersSummary(data)
      console.log('providersSummary', data)
    } catch (error) {
      console.error('Failed to load providers summary:', error)
    }
  }

  const loadClicksPerPage = async () => {
    try {
      const data = await adminApi.getClicksPerPage(
        startDate || undefined, 
        endDate || undefined,
        propertyType ? (propertyType as 'hotel' | 'flight' | 'car') : undefined
      )
      setClicksPerPage(data)
      console.log('clicksPerPage', clicksPerPage)
    } catch (error) {
      console.error('Failed to load clicks per page:', error)
    }
  }

  const loadPropertyClicks = async () => {
    try {
      const data = await adminApi.getPropertyClicks(startDate || undefined, endDate || undefined)
      setPropertyClicks(data)
      console.log('propertyClicks', propertyClicks)
    } catch (error) {
      console.error('Failed to load property clicks:', error)
    }
  }

  const loadLeastSeenAreas = async () => {
    try {
      const data = await adminApi.getLeastSeenAreas(startDate || undefined, endDate || undefined)
      setLeastSeenAreas(data)
      console.log('leastSeenAreas', leastSeenAreas)
    } catch (error) {
      console.error('Failed to load least seen areas:', error)
    }
  }

  const loadPropertyReviews = async () => {
    try {
      const data = await adminApi.getPropertyReviews(
        propertyType ? (propertyType as 'hotel' | 'flight' | 'car') : undefined
      )
      setPropertyReviews(data || [])
    } catch (error) {
      console.error('Failed to load property reviews:', error)
      setPropertyReviews([])
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
      console.log('userTraces', userTraces)
    } catch (error) {
      console.error('Failed to load user traces:', error)
    }
  }

  const loadBiddingTraces = async () => {
    try {
      const data = await adminApi.getBiddingTrace(selectedPropertyId || undefined)
      setBiddingTraces(data)
      console.log('biddingTraces', biddingTraces)
    } catch (error) {
      console.error('Failed to load bidding traces:', error)
    }
  }

  const handleFilterChange = () => {
    loadAllData()
  }

  // Show access denied for non-admin users
  if (user && !user.isAdmin) {
    return <div className="loading">Access denied. Admin access required.</div>
  }

  // Show loading while user is being loaded or data is loading
  if (!user) {
    return <div className="loading">Loading...</div>
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Get color for provider bar
  const getProviderColor = (index: number) => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1']
    return colors[index % colors.length]
  }

  return (
    <div className="host-analysis-page">
      <h2>Host/Provider Analysis Reports</h2>

      {/* ============================================ */}
      {/* PROVIDER ANALYTICS SECTION (Phase 1) */}
      {/* ============================================ */}
      <div className="provider-analytics-section">
        <div className="section-header">
          <h3>📊 Provider Analytics</h3>
          <div className="year-selector">
            <label>Year:</label>
            <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
              {[2023, 2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        {providersSummary && (
          <div className="provider-summary-cards">
            <div className="summary-card airlines-card">
              <div className="card-icon">✈️</div>
              <div className="card-content">
                <h4>Airlines</h4>
                <p className="card-value">{formatCurrency(providersSummary.airlines.totalRevenue)}</p>
                <p className="card-label">{providersSummary.airlines.totalProviders} providers</p>
              </div>
            </div>
            <div className="summary-card hotels-card">
              <div className="card-icon">🏨</div>
              <div className="card-content">
                <h4>Hotels</h4>
                <p className="card-value">{formatCurrency(providersSummary.hotels.totalRevenue)}</p>
                <p className="card-label">{providersSummary.hotels.totalProviders} providers</p>
              </div>
            </div>
            <div className="summary-card cars-card">
              <div className="card-icon">🚗</div>
              <div className="card-content">
                <h4>Car Rentals</h4>
                <p className="card-value">{formatCurrency(providersSummary.carCompanies.totalRevenue)}</p>
                <p className="card-label">{providersSummary.carCompanies.totalProviders} providers</p>
              </div>
            </div>
            <div className="summary-card total-card">
              <div className="card-icon">💰</div>
              <div className="card-content">
                <h4>Grand Total</h4>
                <p className="card-value">{formatCurrency(providersSummary.grandTotal)}</p>
                <p className="card-label">All providers combined</p>
              </div>
            </div>
          </div>
        )}

        {/* Provider Tabs */}
        <div className="provider-tabs">
          <button 
            className={`tab-btn ${activeProviderTab === 'airlines' ? 'active' : ''}`}
            onClick={() => setActiveProviderTab('airlines')}
          >
            ✈️ Top Airlines
          </button>
          <button 
            className={`tab-btn ${activeProviderTab === 'hotels' ? 'active' : ''}`}
            onClick={() => setActiveProviderTab('hotels')}
          >
            🏨 Top Hotels
          </button>
          <button 
            className={`tab-btn ${activeProviderTab === 'cars' ? 'active' : ''}`}
            onClick={() => setActiveProviderTab('cars')}
          >
            🚗 Top Car Companies
          </button>
        </div>

        {/* Provider Charts */}
        <div className="provider-chart-container">
          {providersSummary && activeProviderTab === 'airlines' && (
            <div className="provider-chart">
              <h4>Top 10 Airlines by Revenue ({selectedYear})</h4>
              <div className="horizontal-bar-chart">
                {providersSummary.airlines.providers.map((airline, index) => {
                  const maxRevenue = Math.max(...providersSummary.airlines.providers.map(a => a.totalRevenue)) || 1
                  const widthPercent = (airline.totalRevenue / maxRevenue) * 100
                  return (
                    <div key={airline.provider} className="bar-row">
                      <div className="bar-label">{airline.provider}</div>
                      <div className="bar-container">
                        <div 
                          className="bar-fill" 
                          style={{ 
                            width: `${widthPercent}%`,
                            backgroundColor: getProviderColor(index)
                          }}
                        />
                        <span className="bar-value">{formatCurrency(airline.totalRevenue)}</span>
                      </div>
                      <div className="bar-stats">
                        <span>📈 {airline.totalBookings || 0} bookings</span>
                        <span>⭐ {airline.avgRating?.toFixed(1) || 'N/A'}</span>
                      </div>
                    </div>
                  )
                })}
                {providersSummary.airlines.providers.length === 0 && (
                  <p className="no-data">No airline booking data for {selectedYear}</p>
                )}
              </div>
            </div>
          )}

          {providersSummary && activeProviderTab === 'hotels' && (
            <div className="provider-chart">
              <h4>Top 10 Hotel Chains by Bookings ({selectedYear})</h4>
              <div className="horizontal-bar-chart">
                {providersSummary.hotels.providers.map((hotel, index) => {
                  const maxBookings = Math.max(...providersSummary.hotels.providers.map(h => h.totalBookings || 0)) || 1
                  const widthPercent = ((hotel.totalBookings || 0) / maxBookings) * 100
                  return (
                    <div key={hotel.provider} className="bar-row">
                      <div className="bar-label">{hotel.provider}</div>
                      <div className="bar-container">
                        <div 
                          className="bar-fill" 
                          style={{ 
                            width: `${widthPercent}%`,
                            backgroundColor: getProviderColor(index)
                          }}
                        />
                        <span className="bar-value">{hotel.totalBookings || 0} bookings</span>
                      </div>
                      <div className="bar-stats">
                        <span>💵 {formatCurrency(hotel.totalRevenue)}</span>
                        <span>⭐ {hotel.avgRating?.toFixed(1) || 'N/A'}</span>
                        <span>🏠 {hotel.totalProperties || 0} properties</span>
                      </div>
                    </div>
                  )
                })}
                {providersSummary.hotels.providers.length === 0 && (
                  <p className="no-data">No hotel booking data for {selectedYear}</p>
                )}
              </div>
            </div>
          )}

          {providersSummary && activeProviderTab === 'cars' && (
            <div className="provider-chart">
              <h4>Top 10 Car Rental Companies by Rentals ({selectedYear})</h4>
              <div className="horizontal-bar-chart">
                {providersSummary.carCompanies.providers.map((company, index) => {
                  const maxRentals = Math.max(...providersSummary.carCompanies.providers.map(c => c.totalRentals || 0)) || 1
                  const widthPercent = ((company.totalRentals || 0) / maxRentals) * 100
                  return (
                    <div key={company.provider} className="bar-row">
                      <div className="bar-label">{company.provider}</div>
                      <div className="bar-container">
                        <div 
                          className="bar-fill" 
                          style={{ 
                            width: `${widthPercent}%`,
                            backgroundColor: getProviderColor(index)
                          }}
                        />
                        <span className="bar-value">{company.totalRentals || 0} rentals</span>
                      </div>
                      <div className="bar-stats">
                        <span>💵 {formatCurrency(company.totalRevenue)}</span>
                        <span>⭐ {company.avgRating?.toFixed(1) || 'N/A'}</span>
                        <span>🚙 {company.totalVehicles || 0} vehicles</span>
                      </div>
                    </div>
                  )
                })}
                {providersSummary.carCompanies.providers.length === 0 && (
                  <p className="no-data">No car rental data for {selectedYear}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <hr className="section-divider" />

      {/* ============================================ */}
      {/* EXISTING HOST ANALYSIS SECTIONS */}
      {/* ============================================ */}

      {/* Filters */}
      <div className="analysis-filters">
        <h3>📈 Click & User Analytics</h3>
        <div className="filter-row">
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

