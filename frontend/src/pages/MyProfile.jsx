import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import toast from 'react-hot-toast';

const MyProfile = () => {
  const { user, updateProfile } = useAuth();
  const [profileData, setProfileData] = useState({
    name: user?.name || '', email: user?.email || '', mobile: user?.mobile || '', address: user?.address || '',
  });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '' });
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoadingProfile(true);
    try {
      await updateProfile(profileData);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setLoadingPassword(true);
    try {
      await API.put('/auth/change-password', passwordData);
      toast.success('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

      {/* Profile Form */}
      <div className="card p-6 sm:p-8 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <input type="text" className="input-field" value={profileData.name}
              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input type="email" className="input-field bg-gray-50" value={profileData.email} disabled />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile</label>
            <input type="tel" className="input-field" value={profileData.mobile}
              onChange={(e) => setProfileData({ ...profileData, mobile: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
            <textarea className="input-field" rows="2" value={profileData.address}
              onChange={(e) => setProfileData({ ...profileData, address: e.target.value })} required />
          </div>
          <button type="submit" disabled={loadingProfile} className="btn-primary">
            {loadingProfile ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Password Change */}
      <div className="card p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
            <input type="password" className="input-field" value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
            <input type="password" className="input-field" placeholder="Min 6 characters" value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} required minLength={6} />
          </div>
          <button type="submit" disabled={loadingPassword} className="btn-primary">
            {loadingPassword ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MyProfile;
