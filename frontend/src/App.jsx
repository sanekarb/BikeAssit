import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import UserPrivateRoute from './components/UserPrivateRoute';

// Auth pages
import Login from './pages/Login';
import Register from './pages/Register';

// User pages
import Dashboard from './pages/Dashboard';
import ServiceBooking from './pages/ServiceBooking';
import BookingStatus from './pages/BookingStatus';
import ServiceHistory from './pages/ServiceHistory';
import LoyaltyPoints from './pages/LoyaltyPoints';
import WarrantyManagement from './pages/WarrantyManagement';
import ServiceFeedback from './pages/ServiceFeedback';
import MyProfile from './pages/MyProfile';
import MyBikeList from './pages/MyBikeList';

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />

      {/* User private routes */}
      <Route path="/dashboard" element={<UserPrivateRoute><Navbar /><Dashboard /></UserPrivateRoute>} />
      <Route path="/book-service" element={<UserPrivateRoute><Navbar /><ServiceBooking /></UserPrivateRoute>} />
      <Route path="/booking-status" element={<UserPrivateRoute><Navbar /><BookingStatus /></UserPrivateRoute>} />
      <Route path="/service-history" element={<UserPrivateRoute><Navbar /><ServiceHistory /></UserPrivateRoute>} />
      <Route path="/loyalty-points" element={<UserPrivateRoute><Navbar /><LoyaltyPoints /></UserPrivateRoute>} />
      <Route path="/warranty" element={<UserPrivateRoute><Navbar /><WarrantyManagement /></UserPrivateRoute>} />
      <Route path="/feedback" element={<UserPrivateRoute><Navbar /><ServiceFeedback /></UserPrivateRoute>} />
      <Route path="/profile" element={<UserPrivateRoute><Navbar /><MyProfile /></UserPrivateRoute>} />
      <Route path="/my-bikes" element={<UserPrivateRoute><Navbar /><MyBikeList /></UserPrivateRoute>} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { borderRadius: '12px', background: '#1f2937', color: '#fff', fontSize: '14px' },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
