import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import { useAuthStore } from '../store/authStore'
import { adminApi } from '../api/adminApi'
import { RevenueByCityChart } from '../components/charts/RevenueByCityChart'
import { TopPropertiesChart } from '../components/charts/TopPropertiesChart'
import { BookingStatusPieChart } from '../components/charts/BookingStatusPieChart'
import './AdminDashboardPage.css'

export default function AdminDashboardPage() {
  const { setLoading, setError } = useStore()
  const { user } = useAuthStore()
  const [revenueStats, setRevenueStats] = useState<any>(null)
  const [bookingStats, setBookingStats] = useState<any>(null)

  useEffect(() => {
    if (user && user.isAdmin) {
      loadStats()
    }
  }, [user])

  const loadStats = async () => {
    setLoading(true)
    try {
      const [revenue, bookings] = await Promise.all([
        adminApi.getRevenueStats(),
        adminApi.getBookingStats(),
      ])
      setRevenueStats(revenue)
      setBookingStats(bookings)
    } catch (error: any) {
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (user && !user.isAdmin) {
    return <div className="loading">Access denied. Admin access required.</div>
  }

  return (
    <div className="admin-dashboard-page">
      <h2>Admin Dashboard</h2>
      
      <div className="dashboard-stats">
        {revenueStats && (
          <div className="stat-card">
            <h3>Total Revenue</h3>
            <p className="stat-value">${revenueStats.totalRevenue?.toLocaleString() || '0'}</p>
          </div>
        )}
        {bookingStats && (
          <div className="stat-card">
            <h3>Total Bookings</h3>
            <p className="stat-value">{bookingStats.totalBookings || 0}</p>
          </div>
        )}
      </div>

      {revenueStats && revenueStats.revenueByCity && (
        <RevenueByCityChart data={revenueStats.revenueByCity} />
      )}

      {revenueStats && revenueStats.topProperties && (
        <TopPropertiesChart data={revenueStats.topProperties} />
      )}

      {bookingStats && bookingStats.bookingsByStatus && (
        <BookingStatusPieChart data={bookingStats.bookingsByStatus} />
      )}
    </div>
  )
}
