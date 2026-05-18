import { useState, useEffect } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/helpers';
import { ClipboardList, CheckCircle2, XCircle, Banknote } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await API.get('/admin/dashboard');
        setStats(res.data.stats);
      } catch {
        toast.error('Failed to load dashboard stats');
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

  const cards = [
    {
      label: 'Total Bookings',
      value: stats?.totalBookings || 0,
      icon: <ClipboardList className="w-6 h-6" />,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
    },
    {
      label: 'Completed',
      value: stats?.completedBookings || 0,
      icon: <CheckCircle2 className="w-6 h-6" />,
      color: 'bg-green-500',
      textColor: 'text-green-600',
    },
    {
      label: 'Cancelled',
      value: stats?.cancelledBookings || 0,
      icon: <XCircle className="w-6 h-6" />,
      color: 'bg-red-500',
      textColor: 'text-red-600',
    },
    {
      label: 'Total Earnings',
      value: formatCurrency(stats?.totalEarnings || 0),
      icon: <Banknote className="w-6 h-6" />,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600',
      isText: true,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">{card.label}</span>
              <div className={`${card.color} p-2 rounded-lg text-white`}>
                {card.icon}
              </div>
            </div>
            <p className={`text-3xl font-bold ${card.textColor}`}>
              {card.isText ? card.value : card.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
