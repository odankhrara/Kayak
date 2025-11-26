import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import './Navbar.css'

export function Navbar() {
  const { user, isAuthenticated, logout } = useStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <h1>KAYAK</h1>
        </Link>
        
        <div className="navbar-links">
          <Link to="/search">Search</Link>
          {isAuthenticated && (
            <>
              <Link to="/my-trips">My Trips</Link>
              {user?.role === 'admin' && (
                <>
                  <Link to="/admin/dashboard">Admin Dashboard</Link>
                  <Link to="/admin/listings">Manage Listings</Link>
                </>
              )}
              <div className="navbar-user">
                <span>Hello, {user?.firstName || user?.email}</span>
                <button onClick={handleLogout} className="btn-logout">
                  Logout
                </button>
              </div>
            </>
          )}
          {!isAuthenticated && (
            <Link to="/login">Login</Link>
          )}
        </div>
      </div>
    </nav>
  )
}

