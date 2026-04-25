import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '../services/api';
import { formatDate } from '../utils/helpers';
import StatCard from '../components/StatCard';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await adminApi.getStats();
      setStats(res.data);
    } catch (err) {
      toast.error(err.message);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.getUsers({ page, limit: 10, search });
      setUsers(res.data.users);
      setPagination({ total: res.data.total, pages: res.data.pages });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleAction = async (action, id) => {
    const messages = {
      suspend: 'Suspend this user?',
      unsuspend: 'Unsuspend this user?',
      makeAdmin: 'Grant admin privileges to this user?',
    };
    if (!window.confirm(messages[action])) return;

    try {
      setActionLoading(id);
      if (action === 'suspend') await adminApi.suspendUser(id);
      else if (action === 'unsuspend') await adminApi.unsuspendUser(id);
      else if (action === 'makeAdmin') await adminApi.makeAdmin(id);
      toast.success('Action completed');
      fetchUsers();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const growthData = (stats?.monthlyGrowth || []).map((m) => ({
    label: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
    users: m.count,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-sm text-gray-500">Manage users and monitor platform usage</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={stats?.totalUsers || 0} icon="👥" color="blue" />
        <StatCard title="New This Month" value={stats?.newUsersThisMonth || 0} icon="🆕" color="green" />
        <StatCard title="Active (30d)" value={stats?.activeUsers || 0} icon="✅" color="teal" />
        <StatCard title="Suspended" value={stats?.suspendedUsers || 0} icon="🚫" color="red" />
      </div>

      {/* Growth Chart */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly User Growth</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={growthData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="users" name="New Users" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* User Management */}
      <div className="card">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="text-sm font-semibold text-gray-700">User Management</h3>
          <input
            type="text"
            className="input-field w-64"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">User</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium hidden md:table-cell">Joined</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium hidden lg:table-cell">Last Login</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Status</th>
                  <th className="py-2 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 px-3">
                      <div>
                        <p className="font-medium text-gray-800">{u.name || 'No name'}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-gray-500 hidden md:table-cell">{formatDate(u.createdAt)}</td>
                    <td className="py-2.5 px-3 text-gray-500 hidden lg:table-cell">{formatDate(u.lastLogin)}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex flex-wrap gap-1">
                        {u.isSuspended && <span className="badge-red">Suspended</span>}
                        {u.isAdmin && <span className="badge-blue">Admin</span>}
                        {!u.isSuspended && !u.isAdmin && <span className="badge-green">Active</span>}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex gap-2 justify-center flex-wrap">
                        {u.isSuspended ? (
                          <button
                            disabled={actionLoading === u._id}
                            onClick={() => handleAction('unsuspend', u._id)}
                            className="text-green-600 hover:text-green-800 text-xs font-medium"
                          >
                            Unsuspend
                          </button>
                        ) : (
                          !u.isAdmin && (
                            <button
                              disabled={actionLoading === u._id}
                              onClick={() => handleAction('suspend', u._id)}
                              className="text-red-500 hover:text-red-700 text-xs font-medium"
                            >
                              Suspend
                            </button>
                          )
                        )}
                        {!u.isAdmin && (
                          <button
                            disabled={actionLoading === u._id}
                            onClick={() => handleAction('makeAdmin', u._id)}
                            className="text-blue-500 hover:text-blue-700 text-xs font-medium"
                          >
                            Make Admin
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Prev</button>
            <span className="text-sm text-gray-600">{page} / {pagination.pages}</span>
            <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
