import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, dbUser, refreshDbUser } = useAuth();
  const [form, setForm] = useState({
    name: dbUser?.name || '',
    budgetAlerts: dbUser?.budgetAlerts ?? true,
    emiReminders: dbUser?.emiReminders ?? true,
    fdAlerts: dbUser?.fdAlerts ?? true,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await authApi.updateProfile(form);
      await refreshDbUser();
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Profile & Settings</h1>
        <p className="text-sm text-gray-500">Manage your account and notification preferences</p>
      </div>

      {/* Profile Info */}
      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt="Profile"
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold">
              {(dbUser?.name || user?.displayName || 'U')[0].toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900">{dbUser?.name || user?.displayName || 'User'}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            {dbUser?.isAdmin && <span className="badge-blue mt-1">Admin</span>}
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Display Name</label>
            <input
              type="text"
              className="input-field"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Your name"
              maxLength={100}
            />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Notification Preferences</h3>
            <div className="space-y-3">
              {[
                { key: 'budgetAlerts', label: 'Budget Alerts', description: 'Alert when spending exceeds 80% of budget' },
                { key: 'emiReminders', label: 'EMI Reminders', description: 'Remind before upcoming EMI dates' },
                { key: 'fdAlerts', label: 'FD Maturity Alerts', description: 'Alert when FD is about to mature' },
              ].map(({ key, label, description }) => (
                <label key={key} className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                    className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{label}</p>
                    <p className="text-xs text-gray-500">{description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Account info */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Account Information</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">Member since</span>
            <span className="text-gray-800">{dbUser?.createdAt ? new Date(dbUser.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">Sign-in method</span>
            <span className="text-gray-800">Google OAuth</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Account status</span>
            <span className="badge-green">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
