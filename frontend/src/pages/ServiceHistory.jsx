import { useState, useEffect } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { getStatusBadgeClass, getPaymentBadgeClass, formatDate, formatCurrency } from '../utils/helpers';

const ServiceHistory = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await API.get('/bookings/history');
        setBookings(res.data.bookings);
      } catch {
        toast.error('Failed to load service history');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Service History</h1>

      {bookings.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-500 text-lg">No service history yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking._id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div>
                  <span className="text-xs text-gray-400">{booking.bookingId}</span>
                  <p className="font-medium text-gray-900">
                    {booking.bikeSnapshot?.brand} {booking.bikeSnapshot?.model}
                    <span className="text-gray-400 text-sm ml-2">({booking.bikeSnapshot?.registrationNumber})</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(booking.status)}`}>
                    {booking.status}
                  </span>
                  {booking.bill?.totalAmount > 0 && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentBadgeClass(booking.paymentStatus)}`}>
                      {booking.paymentStatus}
                    </span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Booked On</span>
                  <p className="font-medium">{formatDate(booking.createdAt)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Issue</span>
                  <p className="font-medium line-clamp-1">{booking.issueDescription}</p>
                </div>
                {booking.bill?.totalAmount > 0 && (
                  <div>
                    <span className="text-gray-500">Total Bill</span>
                    <p className="font-medium text-primary-600">{formatCurrency(booking.bill.totalAmount)}</p>
                  </div>
                )}
                {booking.deliveredAt && (
                  <div>
                    <span className="text-gray-500">Delivered</span>
                    <p className="font-medium">{formatDate(booking.deliveredAt)}</p>
                  </div>
                )}
              </div>
              {booking.rejectionReason && (
                <p className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded">Reason: {booking.rejectionReason}</p>
              )}
              {booking.cancellationReason && (
                <p className="mt-3 text-sm text-gray-600 bg-gray-50 p-2 rounded">Reason: {booking.cancellationReason}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServiceHistory;
