import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/expenses', label: 'Expenses', icon: '💸' },
  { to: '/income', label: 'Income', icon: '💰' },
  { to: '/investments', label: 'Investments', icon: '📈' },
  { to: '/fds', label: 'Fixed Deposits', icon: '🏦' },
  { to: '/loans', label: 'Loans', icon: '💳' },
];

export default function Sidebar({ open, onClose }) {
  const { dbUser } = useAuth();

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:z-auto
      `}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
          PF
        </div>
        <span className="font-semibold text-lg tracking-tight">PerFinManage</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150
               ${isActive
                 ? 'bg-blue-600 text-white'
                 : 'text-slate-300 hover:bg-slate-700 hover:text-white'
               }`
            }
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        {dbUser?.isAdmin && (
          <NavLink
            to="/admin"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150
               ${isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`
            }
          >
            <span className="text-base">🛠</span>
            Admin Panel
          </NavLink>
        )}
      </nav>

      {/* Profile link at bottom */}
      <div className="px-3 py-4 border-t border-slate-700">
        <NavLink
          to="/profile"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150
             ${isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`
          }
        >
          <span className="text-base">⚙️</span>
          Profile & Settings
        </NavLink>
      </div>
    </aside>
  );
}
