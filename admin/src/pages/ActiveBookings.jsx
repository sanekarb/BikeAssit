import { useState, useEffect } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { getStatusBadgeClass, getPaymentBadgeClass, formatDate, formatCurrency } from '../utils/helpers';

const VALID_TRANSITIONS = {
  'Pickup Assigned': 'Bike Picked Up',
  'Bike Picked Up': 'Service In Progress',
  'Service In Progress': 'Service Completed',
  'Service Completed': 'Ready For Delivery',
  'Ready For Delivery': 'Delivered',
  'Delivered': 'Completed',
};

const ActiveBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pickupModal, setPickupModal] = useState({ open: false, bookingId: null, name: '', mobile: '', vehicleNumber: '' });
  const [billModal, setBillModal] = useState({ open: false, bookingId: null, serviceCost: '', partsCost: '', additionalCharges: '0' });
  const [submitting, setSubmitting] = useState(null);

  const fetchBookings = async () => {
    try {
      const res = await API.get('/admin/bookings/active');
      setBookings(res.data.bookings);
    } catch {
      toast.error('Failed to load active bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleAssignPickup = async () => {
    const { bookingId, name, mobile, vehicleNumber } = pickupModal;
    if (!name || !mobile || !vehicleNumber) return toast.error('All pickup fields are required');
    setSubmitting('pickup');
    try {
      await API.put(`/admin/bookings/${bookingId}/assign-pickup`, { name, mobile, vehicleNumber });
      toast.success('Pickup person assigned');
      setPickupModal({ open: false, bookingId: null, name: '', mobile: '', vehicleNumber: '' });
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign');
    } finally {
      setSubmitting(null);
    }
  };

  const handleStatusUpdate = async (bookingId, newStatus) => {
    setSubmitting(bookingId);
    try {
      await API.put(`/admin/bookings/${bookingId}/status`, { status: newStatus });
      toast.success(`Status updated to '${newStatus}'`);
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setSubmitting(null);
    }
  };

  const handleGenerateBill = async () => {
    const { bookingId, serviceCost, partsCost, additionalCharges } = billModal;
    if (!serviceCost || !partsCost) return toast.error('Service cost and parts cost are required');
    setSubmitting('bill');
    try {
      await API.post(`/admin/bookings/${bookingId}/generate-bill`, {
        serviceCost: Number(serviceCost),
        partsCost: Number(partsCost),
        additionalCharges: Number(additionalCharges || 0),
      });
      toast.success('Bill generated');
      setBillModal({ open: false, bookingId: null, serviceCost: '', partsCost: '', additionalCharges: '0' });
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate bill');
    } finally {
      setSubmitting(null);
    }
  };

  const handlePaymentStatus = async (bookingId) => {
    setSubmitting(bookingId + '-pay');
    try {
      await API.put(`/admin/bookings/${bookingId}/payment-status`, { paymentStatus: 'Paid On Delivery' });
      toast.success('Marked as Paid On Delivery');
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update payment');
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Active Bookings <span className="text-gray-400 text-lg font-normal">({bookings.length})</span>
      </h1>

      {bookings.length === 0 ? (
        <div className="card p-12 text-center"><p className="text-gray-500">No active bookings</p></div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const nextStatus = VALID_TRANSITIONS[booking.status];
            const canGenerateBill = booking.status === 'Service Completed' && !booking.bill?.generatedAt;
            const canMarkPaid = booking.paymentStatus === 'Pending';

            return (
              <div key={booking._id} className="card p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="text-xs text-gray-400">{booking.bookingId}</span>
                    <p className="font-semibold text-gray-900">
                      {booking.bikeSnapshot?.brand} {booking.bikeSnapshot?.model}
                      <span className="text-gray-400 text-sm ml-1">({booking.bikeSnapshot?.registrationNumber})</span>
                    </p>
                    <p className="text-sm text-gray-500">{booking.user?.name} • {booking.user?.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(booking.status)}`}>
                      {booking.status}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentBadgeClass(booking.paymentStatus)}`}>
                      {booking.paymentStatus}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm mb-3">
                  <div>
                    <span className="text-gray-500">Pickup</span>
                    <p className="font-medium">{formatDate(booking.preferredPickupDate)} • {booking.preferredPickupTime}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Issue</span>
                    <p className="font-medium line-clamp-1">{booking.issueDescription}</p>
                  </div>
                  {booking.pickupPerson?.name && (
                    <div>
                      <span className="text-gray-500">Pickup Person</span>
                      <p className="font-medium">{booking.pickupPerson.name} ({booking.pickupPerson.mobile})</p>
                    </div>
                  )}
                  {booking.bill?.totalAmount > 0 && (
                    <div>
                      <span className="text-gray-500">Bill Total</span>
                      <p className="font-bold text-primary-600">{formatCurrency(booking.bill.totalAmount)}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                  {booking.status === 'Accepted' && (
                    <button onClick={() => setPickupModal({ open: true, bookingId: booking._id, name: '', mobile: '', vehicleNumber: '' })}
                      className="btn-primary text-sm py-2 px-3">
                      Assign Pickup
                    </button>
                  )}
                  {nextStatus && (
                    <button
                      onClick={() => handleStatusUpdate(booking._id, nextStatus)}
                      disabled={submitting === booking._id}
                      className="btn-secondary text-sm py-2 px-3"
                    >
                      {submitting === booking._id ? 'Updating...' : `→ ${nextStatus}`}
                    </button>
                  )}
                  {canGenerateBill && (
                    <button onClick={() => setBillModal({ open: true, bookingId: booking._id, serviceCost: '', partsCost: '', additionalCharges: '0' })}
                      className="bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-3 rounded-lg text-sm transition-colors">
                      Generate Bill
                    </button>
                  )}
                  {canMarkPaid && (
                    <button
                      onClick={() => handlePaymentStatus(booking._id)}
                      disabled={submitting === booking._id + '-pay'}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2 px-3 rounded-lg text-sm transition-colors"
                    >
                      {submitting === booking._id + '-pay' ? 'Updating...' : 'Mark Paid (COD)'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pickupModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign Pickup Person</h3>
            <div className="space-y-3">
              <input type="text" className="input-field" placeholder="Person Name"
                value={pickupModal.name} onChange={(e) => setPickupModal({ ...pickupModal, name: e.target.value })} />
              <input type="tel" className="input-field" placeholder="Mobile Number"
                value={pickupModal.mobile} onChange={(e) => setPickupModal({ ...pickupModal, mobile: e.target.value })} />
              <input type="text" className="input-field" placeholder="Vehicle Number"
                value={pickupModal.vehicleNumber} onChange={(e) => setPickupModal({ ...pickupModal, vehicleNumber: e.target.value })} />
            </div>
            <div className="flex gap-3 justify-end mt-4">
              <button onClick={() => setPickupModal({ ...pickupModal, open: false })} className="btn-secondary text-sm">Cancel</button>
              <button onClick={handleAssignPickup} disabled={submitting === 'pickup'} className="btn-primary text-sm">
                {submitting === 'pickup' ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {billModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Bill</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Cost (₹)</label>
                <input type="number" min="0" className="input-field" placeholder="0"
                  value={billModal.serviceCost} onChange={(e) => setBillModal({ ...billModal, serviceCost: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parts Cost (₹)</label>
                <input type="number" min="0" className="input-field" placeholder="0"
                  value={billModal.partsCost} onChange={(e) => setBillModal({ ...billModal, partsCost: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Charges (₹)</label>
                <input type="number" min="0" className="input-field" placeholder="0"
                  value={billModal.additionalCharges} onChange={(e) => setBillModal({ ...billModal, additionalCharges: e.target.value })} />
              </div>
              {billModal.serviceCost && billModal.partsCost && (
                <div className="bg-gray-50 p-3 rounded-lg text-sm">
                  <span className="text-gray-500">Estimated Total: </span>
                  <span className="font-bold text-primary-600">
                    {formatCurrency(Number(billModal.serviceCost || 0) + Number(billModal.partsCost || 0) + Number(billModal.additionalCharges || 0))}
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-end mt-4">
              <button onClick={() => setBillModal({ ...billModal, open: false })} className="btn-secondary text-sm">Cancel</button>
              <button onClick={handleGenerateBill} disabled={submitting === 'bill'} className="btn-primary text-sm">
                {submitting === 'bill' ? 'Generating...' : 'Generate Bill'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveBookings;
