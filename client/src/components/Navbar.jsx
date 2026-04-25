import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/expenses': 'Expenses',
  '/income': 'Income',
  '/investments': 'Investments',
  '/fds': 'Fixed Deposits',
  '/loans': 'Loans',
  '/profile': 'Profile & Settings',
  '/admin': 'Admin Panel',
};

export default function Navbar({ onMenuClick }) {
  const { user, dbUser, logout } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch {
      toast.error('Logout failed');
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center justify-between gap-4 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        {/* Hamburger for mobile */}
        <button
          className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-gray-800 hidden sm:block">
          {PAGE_TITLES[location.pathname] || 'PerFinManage'}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-sm font-medium text-gray-800 leading-tight">
            {dbUser?.name || user?.displayName || 'User'}
          </span>
          <span className="text-xs text-gray-500">{user?.email}</span>
        </div>
        {(user?.photoURL || dbUser?.photoURL) ? (
          <img
            src={user.photoURL || dbUser.photoURL}
            alt="Profile"
            className="w-9 h-9 rounded-full object-cover border-2 border-gray-200"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
            {(dbUser?.name || user?.displayName || 'U')[0].toUpperCase()}
          </div>
        )}
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-red-500 font-medium transition-colors px-2 py-1 rounded hover:bg-red-50"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
