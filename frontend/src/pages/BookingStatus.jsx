import { useState, useEffect } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { getStatusBadgeClass, getPaymentBadgeClass, formatDate, formatCurrency } from '../utils/helpers';

const CANCELLABLE_STATUSES = ['Pending', 'Accepted', 'Pickup Assigned'];
const CANCELLATION_REASONS = [
  'Booked By Mistake', 'Change of Plan', 'Found Another Service Provider',
  'Pickup Time Not Suitable', 'Service No Longer Required', 'Other',
];

const BookingStatus = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelModal, setCancelModal] = useState({ open: false, bookingId: null, reason: '' });
  const [payingBookingId, setPayingBookingId] = useState(null);

  const fetchBookings = async () => {
    try {
      const res = await API.get('/bookings/my');
      setBookings(res.data.bookings);
    } catch {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleCancel = async () => {
    if (!cancelModal.reason) return toast.error('Please select a cancellation reason');
    try {
      await API.put(`/bookings/${cancelModal.bookingId}/cancel`, { cancellationReason: cancelModal.reason });
      toast.success('Booking cancelled');
      setCancelModal({ open: false, bookingId: null, reason: '' });
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel');
    }
  };

  const handlePayOnline = async (bookingObjectId) => {
    setPayingBookingId(bookingObjectId);
    try {
      const orderRes = await API.post('/payment/create-order', { bookingId: bookingObjectId });
      const { orderId, amount, currency } = orderRes.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount,
        currency,
        name: 'BikeAssist',
        description: 'Service Payment',
        order_id: orderId,
        handler: async (response) => {
          try {
            await API.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success('Payment successful!');
            fetchBookings();
          } catch {
            toast.error('Payment verification failed');
          } finally {
            setPayingBookingId(null);
          }
        },
        modal: {
          ondismiss: () => {
            setPayingBookingId(null);
          },
        },
        prefill: {},
        theme: { color: '#2563eb' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to initiate payment');
      setPayingBookingId(null);
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Bookings</h1>

      {bookings.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-500 text-lg">No bookings found</p>
          <a href="/book-service" className="btn-primary inline-block mt-4">Book a Service</a>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking._id} className="card p-5 sm:p-6">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <span className="text-sm text-gray-500">Booking ID</span>
                  <p className="font-semibold text-gray-900">{booking.bookingId}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(booking.status)}`}>
                    {booking.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentBadgeClass(booking.paymentStatus)}`}>
                    {booking.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Bike + Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
                <div>
                  <span className="text-gray-500">Bike</span>
                  <p className="font-medium">{booking.bikeSnapshot?.brand} {booking.bikeSnapshot?.model}</p>
                  <p className="text-gray-400 text-xs">{booking.bikeSnapshot?.registrationNumber}</p>
                </div>
                <div>
                  <span className="text-gray-500">Pickup Date</span>
                  <p className="font-medium">{formatDate(booking.preferredPickupDate)}</p>
                  <p className="text-gray-400 text-xs">{booking.preferredPickupTime}</p>
                </div>
                <div>
                  <span className="text-gray-500">Issue</span>
                  <p className="font-medium line-clamp-2">{booking.issueDescription}</p>
                </div>
                {booking.pickupPerson?.name && (
                  <div>
                    <span className="text-gray-500">Pickup Person</span>
                    <p className="font-medium">{booking.pickupPerson.name}</p>
                    <p className="text-gray-400 text-xs">{booking.pickupPerson.mobile}</p>
                  </div>
                )}
              </div>

              {/* Bill Display */}
              {booking.bill?.totalAmount > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Bill Details</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Service</span>
                      <p className="font-medium">{formatCurrency(booking.bill.serviceCost)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Parts</span>
                      <p className="font-medium">{formatCurrency(booking.bill.partsCost)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Additional</span>
                      <p className="font-medium">{formatCurrency(booking.bill.additionalCharges)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Total</span>
                      <p className="font-bold text-primary-600 text-lg">{formatCurrency(booking.bill.totalAmount)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {CANCELLABLE_STATUSES.includes(booking.status) && (
                  <button
                    onClick={() => setCancelModal({ open: true, bookingId: booking._id, reason: '' })}
                    className="btn-danger text-sm py-2 px-4"
                  >
                    Cancel Booking
                  </button>
                )}
                {booking.paymentStatus === 'Pending' && (
                  <button
                    onClick={() => handlePayOnline(booking._id)}
                    disabled={payingBookingId === booking._id}
                    className="btn-primary text-sm py-2 px-4"
                  >
                    {payingBookingId === booking._id ? 'Processing...' : `Pay Online ${formatCurrency(booking.bill?.totalAmount)}`}
                  </button>
                )}
              </div>

              {/* Rejection/Cancellation Reason */}
              {booking.rejectionReason && (
                <p className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded">
                  <strong>Rejection Reason:</strong> {booking.rejectionReason}
                </p>
              )}
              {booking.cancellationReason && (
                <p className="mt-3 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  <strong>Cancellation Reason:</strong> {booking.cancellationReason}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cancel Booking</h3>
            <select className="input-field mb-4" value={cancelModal.reason}
              onChange={(e) => setCancelModal({ ...cancelModal, reason: e.target.value })}>
              <option value="">Select a reason...</option>
              {CANCELLATION_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setCancelModal({ open: false, bookingId: null, reason: '' })} className="btn-secondary text-sm">
                Keep Booking
              </button>
              <button onClick={handleCancel} className="btn-danger text-sm">
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingStatus;
