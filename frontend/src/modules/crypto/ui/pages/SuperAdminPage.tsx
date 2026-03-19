import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, Trash2, Gift, RefreshCw, Search, Calendar, Crown, User, Mail, Clock } from 'lucide-react';

const getToken = () => {
  const raw = localStorage.getItem('pumpradar_auth_token') || sessionStorage.getItem('pumpradar_auth_token');
  if (!raw) return null;
  try { const p = JSON.parse(raw); return typeof p === 'string' ? p : raw; } catch { return raw; }
};

interface UserData {
  id: string;
  email: string;
  name: string;
  roles: string[];
  emailVerified: boolean;
  subscription: string;
  subscriptionExpiry: string;
  createdAt: string;
}

export default function SuperAdminPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.data.success) {
        setUsers(res.data.data.users || []);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to load users' });
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const giveSubscription = async (userId: string, duration: 'month' | 'year') => {
    if (!confirm(`Give FREE ${duration === 'month' ? '1 Month' : '1 Year'} subscription to this user?`)) return;
    setActionLoading(userId);
    try {
      await axios.patch(`/api/admin/users/${userId}`, {
        subscription: duration === 'month' ? 'monthly' : 'annual',
        duration: duration,
      }, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setMessage({ type: 'success', text: `Subscription granted: ${duration === 'month' ? '1 Month' : '1 Year'}` });
      fetchUsers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to update' });
    }
    setActionLoading(null);
  };

  const deleteUser = async (userId: string, email: string) => {
    if (!confirm(`DELETE user ${email}? This cannot be undone!`)) return;
    setActionLoading(userId);
    try {
      await axios.delete(`/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setMessage({ type: 'success', text: `User ${email} deleted` });
      fetchUsers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to delete' });
    }
    setActionLoading(null);
  };

  const filtered = users.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.name?.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getSubBadge = (sub: string, expiry: string) => {
    const isExpired = expiry && new Date(expiry) < new Date();
    if (sub === 'annual') return <span className="px-2 py-1 text-xs font-bold rounded bg-purple-600 text-white">PRO ANNUAL</span>;
    if (sub === 'monthly') return <span className="px-2 py-1 text-xs font-bold rounded bg-blue-600 text-white">PRO MONTHLY</span>;
    if (sub === 'trial' && !isExpired) return <span className="px-2 py-1 text-xs font-bold rounded bg-amber-500 text-white">TRIAL</span>;
    if (isExpired) return <span className="px-2 py-1 text-xs font-bold rounded bg-red-600 text-white">EXPIRED</span>;
    return <span className="px-2 py-1 text-xs font-bold rounded bg-gray-500 text-white">FREE</span>;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Super Admin Panel</h1>
              <p className="text-slate-400 text-sm">Manage all PumpRadar users</p>
            </div>
          </div>
          <button
            onClick={fetchUsers}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-emerald-900/50 border border-emerald-500' : 'bg-red-900/50 border border-red-500'}`}>
            {message.text}
            <button onClick={() => setMessage(null)} className="ml-4 text-sm underline">Dismiss</button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="text-3xl font-bold">{users.length}</div>
            <div className="text-slate-400 text-sm">Total Users</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="text-3xl font-bold text-purple-400">{users.filter(u => u.subscription === 'annual').length}</div>
            <div className="text-slate-400 text-sm">Pro Annual</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="text-3xl font-bold text-blue-400">{users.filter(u => u.subscription === 'monthly').length}</div>
            <div className="text-slate-400 text-sm">Pro Monthly</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="text-3xl font-bold text-amber-400">{users.filter(u => u.subscription === 'trial').length}</div>
            <div className="text-slate-400 text-sm">Trial</div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by email or name..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="bg-slate-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-700">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-300">ID</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-300">User</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-300">Email Verified</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-300">Subscription</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-300">Expires</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-300">Created</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                    Loading users...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">No users found</td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-750">
                    <td className="px-4 py-3">
                      <code className="text-xs bg-slate-900 px-2 py-1 rounded font-mono">{user.id.slice(-8)}</code>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center text-sm font-bold">
                          {user.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="font-medium">{user.name || 'No name'}</div>
                          <div className="text-sm text-slate-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {user.emailVerified ? (
                        <span className="text-emerald-400">✓ Yes</span>
                      ) : (
                        <span className="text-red-400">✗ No</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {getSubBadge(user.subscription, user.subscriptionExpiry)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {formatDate(user.subscriptionExpiry)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => giveSubscription(user.id, 'month')}
                          disabled={actionLoading === user.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-xs font-medium transition disabled:opacity-50"
                          title="Give 1 Month Free"
                        >
                          <Calendar className="w-3 h-3" />
                          +1M
                        </button>
                        <button
                          onClick={() => giveSubscription(user.id, 'year')}
                          disabled={actionLoading === user.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 rounded text-xs font-medium transition disabled:opacity-50"
                          title="Give 1 Year Free"
                        >
                          <Crown className="w-3 h-3" />
                          +1Y
                        </button>
                        <button
                          onClick={() => deleteUser(user.id, user.email)}
                          disabled={actionLoading === user.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded text-xs font-medium transition disabled:opacity-50"
                          title="Delete User"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-center text-slate-500 text-sm">
          This page is hidden from navigation. Access only via direct URL.
        </div>
      </div>
    </div>
  );
}
