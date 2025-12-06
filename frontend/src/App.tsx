import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Store
import { useAuthStore } from './store/authStore';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import FlightSearch from './pages/FlightSearch';
import HotelSearch from './pages/HotelSearch';
import CarSearch from './pages/CarSearch';
import BookingCheckout from './pages/BookingCheckout';
import MyBookings from './pages/MyBookings';
import Profile from './pages/Profile';
import BookingConfirmation from './pages/BookingConfirmation';
import AdminBillingPage from './pages/AdminBillingPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import HostAnalysisPage from './pages/HostAnalysisPage';
import AIAssistantPage from './pages/AIAssistantPage';
import MyTrips from './pages/MyTrips';
import CompleteBidBooking from './pages/CompleteBidBooking';
import HotelDetail from './pages/HotelDetail';
import CarDetail from './pages/CarDetail';
import FlightDetail from './pages/FlightDetail';

// Layout
import Layout from './components/layout/Layout';

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  // Wait for auth initialization before redirecting
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Admin Route component
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  
  // Wait for auth initialization before redirecting
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (!user?.isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  const { initialize } = useAuthStore();

  // Initialize auth state on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Search routes */}
            <Route path="/flights" element={<FlightSearch />} />
            <Route path="/flights/:flightId" element={<FlightDetail />} />
            <Route path="/hotels" element={<HotelSearch />} />
            <Route path="/hotels/:hotelId" element={<HotelDetail />} />
            <Route path="/cars" element={<CarSearch />} />
            <Route path="/cars/:carId" element={<CarDetail />} />
            
            {/* Protected routes */}
            <Route
              path="/booking/checkout"
              element={
                <ProtectedRoute>
                  <BookingCheckout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/booking/confirmation/:bookingId"
              element={
                <ProtectedRoute>
                  <BookingConfirmation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-bookings"
              element={
                <ProtectedRoute>
                  <MyBookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai-assistant"
              element={
                <ProtectedRoute>
                  <AIAssistantPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-trips"
              element={
                <ProtectedRoute>
                  <MyTrips />
                </ProtectedRoute>
              }
            />
            <Route
              path="/booking/complete-bid"
              element={
                <ProtectedRoute>
                  <CompleteBidBooking />
                </ProtectedRoute>
              }
            />
            
            {/* Admin routes */}
            <Route
              path="/admin/billings"
              element={
                <ProtectedRoute>
                  <AdminBillingPage />
                </ProtectedRoute>
              }
            />

            {/* Admin routes */}
            <Route
              path="/admin/dashboard"
              element={
                <AdminRoute>
                  <AdminDashboardPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/host-analysis"
              element={
                <AdminRoute>
                  <HostAnalysisPage />
                </AdminRoute>
              }
            />

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>

        {/* Toast notifications */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
