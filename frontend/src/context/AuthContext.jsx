import { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const register = async (userData) => {
    const res = await API.post('/auth/register', userData);
    const { token, user: newUser } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
    toast.success('Registration successful!');
    return res.data;
  };

  const login = async (credentials) => {
    const res = await API.post('/auth/login', credentials);
    const { token, user: loggedInUser } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    toast.success('Login successful!');
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateProfile = async (profileData) => {
    const res = await API.put('/auth/profile', profileData);
    const updatedUser = res.data.user;
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    toast.success('Profile updated successfully');
    return res.data;
  };

  const value = {
    user,
    loading,
    register,
    login,
    logout,
    updateProfile,
    isAdmin: user?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
