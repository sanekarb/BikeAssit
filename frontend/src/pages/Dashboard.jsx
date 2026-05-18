import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { HiWrench, HiClipboardDocumentList, HiClock, HiStar, HiShieldCheck, HiChatBubbleLeftEllipsis } from 'react-icons/hi2';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ bookings: 0, active: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [bookingsRes, historyRes] = await Promise.all([
          API.get('/bookings/my'),
          API.get('/bookings/history'),
        ]);
        const activeCount = bookingsRes.data.bookings.filter(
          b => !['Completed', 'Cancelled', 'Rejected'].includes(b.status)
        ).length;
        setStats({
          bookings: bookingsRes.data.count + historyRes.data.count,
          active: activeCount,
        });
      } catch {
        // Silent fail
      }
    };
    fetchStats();
  }, []);

  const cards = [
    {
      title: 'Book Service',
      description: 'Schedule a new bike service pickup',
      icon: <HiWrench className="text-2xl" />,
      to: '/book-service',
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50',
    },
    {
      title: 'My Bookings',
      description: `${stats.active} active booking${stats.active !== 1 ? 's' : ''}`,
      icon: <HiClipboardDocumentList className="text-2xl" />,
      to: '/booking-status',
      color: 'bg-emerald-500',
      lightColor: 'bg-emerald-50',
    },
    {
      title: 'Service History',
      description: 'View past service records',
      icon: <HiClock className="text-2xl" />,
      to: '/service-history',
      color: 'bg-purple-500',
      lightColor: 'bg-purple-50',
    },
    {
      title: 'Loyalty Points',
      description: 'Earn & redeem reward points',
      icon: <HiStar className="text-2xl" />,
      to: '/loyalty-points',
      color: 'bg-amber-500',
      lightColor: 'bg-amber-50',
    },
    {
      title: 'Warranty',
      description: 'Manage warranties & claims',
      icon: <HiShieldCheck className="text-2xl" />,
      to: '/warranty',
      color: 'bg-teal-500',
      lightColor: 'bg-teal-50',
    },
    {
      title: 'Feedback',
      description: 'Rate your service experience',
      icon: <HiChatBubbleLeftEllipsis className="text-2xl" />,
      to: '/feedback',
      color: 'bg-rose-500',
      lightColor: 'bg-rose-50',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-gray-500 mt-1">What would you like to do today?</p>
      </div>

      {/* 6 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.map((card) => (
          <Link key={card.to} to={card.to} className="card p-6 group hover:scale-[1.02] transition-transform duration-200">
            <div className="flex items-start gap-4">
              <div className={`${card.lightColor} p-3 rounded-xl ${card.color} text-white group-hover:scale-110 transition-transform`}>
                {card.icon}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                  {card.title}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">{card.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
