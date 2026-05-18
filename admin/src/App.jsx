import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminPrivateRoute from './components/AdminPrivateRoute';

// Pages
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import CurrentBookings from './pages/CurrentBookings';
import ActiveBookings from './pages/ActiveBookings';
import CompletedBookings from './pages/CompletedBookings';
import WarrantyClaims from './pages/WarrantyClaims';

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
      {/* Public route */}
      <Route path="/login" element={user ? <Navigate to="/" /> : <AdminLogin />} />

      {/* Protected admin routes — AdminPrivateRoute acts as layout with Sidebar */}
      <Route element={<AdminPrivateRoute />}>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/current-bookings" element={<CurrentBookings />} />
        <Route path="/active-bookings" element={<ActiveBookings />} />
        <Route path="/completed-bookings" element={<CompletedBookings />} />
        <Route path="/warranty-claims" element={<WarrantyClaims />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to={user ? '/' : '/login'} />} />
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
