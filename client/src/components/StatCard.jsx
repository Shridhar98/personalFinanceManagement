export default function StatCard({ title, value, subtitle, icon, trend, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    teal: 'bg-teal-50 text-teal-600',
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 truncate">{value}</p>
          {subtitle && <p className="mt-0.5 text-xs text-gray-400 truncate">{subtitle}</p>}
          {trend !== undefined && (
            <div className={`mt-1 flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              <span>{trend >= 0 ? '↑' : '↓'}</span>
              <span>{Math.abs(trend).toFixed(1)}% vs last month</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-xl ${colors[color]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
