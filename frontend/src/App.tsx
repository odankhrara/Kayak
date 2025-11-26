import { Routes, Route } from 'react-router-dom'
import { Navbar } from './components/layout/Navbar'
import { StatusBar } from './components/layout/StatusBar'
import SearchPage from './pages/SearchPage'
import ResultsPage from './pages/ResultsPage'
import BookingPage from './pages/BookingPage'
import PaymentsPage from './pages/PaymentsPage'
import MyTripsPage from './pages/MyTripsPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminListingsPage from './pages/AdminListingsPage'

function App() {
  return (
    <div className="app">
      <Navbar />
      <StatusBar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/my-trips" element={<MyTripsPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/listings" element={<AdminListingsPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App

