import { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load admin from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('bikeassist_admin_user');
    const token = localStorage.getItem('bikeassist_admin_token');
    if (storedUser && token) {
      const parsed = JSON.parse(storedUser);
      if (parsed.role === 'admin') {
        setUser(parsed);
      } else {
        // Not an admin — clear
        localStorage.removeItem('bikeassist_admin_token');
        localStorage.removeItem('bikeassist_admin_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const res = await API.post('/auth/login', credentials);
    const { token, user: loggedInUser } = res.data;

    // Verify admin role on frontend side
    if (loggedInUser.role !== 'admin') {
      throw { response: { data: { message: 'Not authorized as admin' } } };
    }

    localStorage.setItem('bikeassist_admin_token', token);
    localStorage.setItem('bikeassist_admin_user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    toast.success('Admin login successful!');
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('bikeassist_admin_token');
    localStorage.removeItem('bikeassist_admin_user');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const value = {
    user,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
