import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, ClipboardList, Zap,
  CheckCircle2, ShieldCheck, LogOut,
  Menu, X, Bike
} from 'lucide-react';

const AdminSidebar = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const links = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/current-bookings', label: 'Current Bookings', icon: ClipboardList },
    { to: '/active-bookings', label: 'Active Bookings', icon: Zap },
    { to: '/completed-bookings', label: 'Completed', icon: CheckCircle2 },
    { to: '/warranty-claims', label: 'Warranty Claims', icon: ShieldCheck },
  ];

  const isActive = (link) => {
    if (link.end) return location.pathname === link.to;
    return location.pathname.startsWith(link.to);
  };

  const handleLogout = () => {
    logout();
    setSidebarOpen(false);
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transform transition-transform duration-200 ease-in-out
        lg:translate-x-0 lg:static lg:z-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
            <Link to="/" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
              <div className="bg-primary-600 p-1.5 rounded-lg">
                <Bike className="text-white w-5 h-5" />
              </div>
              <span className="text-lg font-bold">BikeAssist</span>
              <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full font-medium">Admin</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 hover:bg-gray-800 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {links.map((link) => {
              const Icon = link.icon;
              const active = isActive(link);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="px-3 py-4 border-t border-gray-800">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-gray-800 w-full transition-all"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className="lg:hidden bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 h-14">
            <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
              <Menu className="w-5 h-5 text-gray-700" />
            </button>
            <span className="font-semibold text-gray-900">Admin Panel</span>
            <div className="w-8" />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminSidebar;
