import { useState, useEffect } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { getPaymentBadgeClass, formatDate, formatCurrency } from '../utils/helpers';

const CompletedBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await API.get('/admin/bookings/completed');
        setBookings(res.data.bookings);
      } catch {
        toast.error('Failed to load completed bookings');
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
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Completed Bookings <span className="text-gray-400 text-lg font-normal">({bookings.length})</span>
      </h1>

      {bookings.length === 0 ? (
        <div className="card p-12 text-center"><p className="text-gray-500">No completed bookings yet</p></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Booking ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Bike</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Total</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Payment</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bookings.map((b) => (
                  <tr key={b._id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900">{b.bookingId}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{b.user?.name}</p>
                      <p className="text-xs text-gray-400">{b.user?.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      {b.bikeSnapshot?.brand} {b.bikeSnapshot?.model}
                    </td>
                    <td className="px-4 py-3 font-medium text-primary-600">
                      {b.bill?.totalAmount > 0 ? formatCurrency(b.bill.totalAmount) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPaymentBadgeClass(b.paymentStatus)}`}>
                        {b.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(b.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompletedBookings;
