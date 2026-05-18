import { useState, useEffect } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { getStatusBadgeClass, formatDate } from '../utils/helpers';

const REJECTION_REASONS = [
  'Outside Service Area', 'Service Not Available',
  'Incomplete Information', 'Invalid Request', 'Other',
];

const CurrentBookings = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [pending, setPending] = useState([]);
  const [rejected, setRejected] = useState([]);
  const [cancelled, setCancelled] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState({ open: false, bookingId: null, reason: '' });

  const fetchAll = async () => {
    try {
      const [p, r, c] = await Promise.all([
        API.get('/admin/bookings/pending'),
        API.get('/admin/bookings/rejected'),
        API.get('/admin/bookings/cancelled'),
      ]);
      setPending(p.data.bookings);
      setRejected(r.data.bookings);
      setCancelled(c.data.bookings);
    } catch {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleAccept = async (id) => {
    try {
      await API.put(`/admin/bookings/${id}/accept`);
      toast.success('Booking accepted');
      fetchAll();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to accept');
    }
  };

  const handleReject = async () => {
    if (!rejectModal.reason) return toast.error('Please select a reason');
    try {
      await API.put(`/admin/bookings/${rejectModal.bookingId}/reject`, { rejectionReason: rejectModal.reason });
      toast.success('Booking rejected');
      setRejectModal({ open: false, bookingId: null, reason: '' });
      fetchAll();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject');
    }
  };

  const tabs = [
    { key: 'pending', label: 'Pending', count: pending.length },
    { key: 'rejected', label: 'Rejected', count: rejected.length },
    { key: 'cancelled', label: 'Cancelled', count: cancelled.length },
  ];

  const renderBookingCard = (booking, showActions = false) => (
    <div key={booking._id} className="card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <span className="text-xs text-gray-400">{booking.bookingId}</span>
          <p className="font-semibold text-gray-900">
            {booking.bikeSnapshot?.brand} {booking.bikeSnapshot?.model}
            <span className="text-gray-400 text-sm ml-1">({booking.bikeSnapshot?.registrationNumber})</span>
          </p>
          <p className="text-sm text-gray-500">{booking.user?.name} • {booking.user?.mobile}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(booking.status)}`}>
          {booking.status}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm mb-3">
        <div>
          <span className="text-gray-500">Pickup Date</span>
          <p className="font-medium">{formatDate(booking.preferredPickupDate)}</p>
          <p className="text-xs text-gray-400">{booking.preferredPickupTime}</p>
        </div>
        <div>
          <span className="text-gray-500">Address</span>
          <p className="font-medium line-clamp-2">{booking.pickupAddress}</p>
        </div>
        <div>
          <span className="text-gray-500">Issue</span>
          <p className="font-medium line-clamp-2">{booking.issueDescription}</p>
        </div>
      </div>

      {booking.rejectionReason && (
        <p className="text-sm text-red-600 bg-red-50 p-2 rounded mb-3">Reason: {booking.rejectionReason}</p>
      )}
      {booking.cancellationReason && (
        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded mb-3">
          Reason: {booking.cancellationReason} ({booking.cancelledBy})
        </p>
      )}

      {showActions && (
        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <button onClick={() => handleAccept(booking._id)} className="btn-primary text-sm py-2 px-4">Accept</button>
          <button onClick={() => setRejectModal({ open: true, bookingId: booking._id, reason: '' })}
            className="btn-danger text-sm py-2 px-4">Reject</button>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Current Bookings</h1>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {activeTab === 'pending' && (pending.length > 0
          ? pending.map((b) => renderBookingCard(b, true))
          : <div className="card p-12 text-center"><p className="text-gray-500">No pending bookings</p></div>
        )}
        {activeTab === 'rejected' && (rejected.length > 0
          ? rejected.map((b) => renderBookingCard(b))
          : <div className="card p-12 text-center"><p className="text-gray-500">No rejected bookings</p></div>
        )}
        {activeTab === 'cancelled' && (cancelled.length > 0
          ? cancelled.map((b) => renderBookingCard(b))
          : <div className="card p-12 text-center"><p className="text-gray-500">No cancelled bookings</p></div>
        )}
      </div>

      {rejectModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Booking</h3>
            <select className="input-field mb-4" value={rejectModal.reason}
              onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}>
              <option value="">Select reason...</option>
              {REJECTION_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setRejectModal({ open: false, bookingId: null, reason: '' })} className="btn-secondary text-sm">Cancel</button>
              <button onClick={handleReject} className="btn-danger text-sm">Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrentBookings;
