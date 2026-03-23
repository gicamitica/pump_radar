import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  AlertTriangle,
  Calendar,
  Crown,
  KeyRound,
  Lock,
  LogOut,
  RefreshCw,
  Search,
  Shield,
  Smartphone,
  Trash2,
} from 'lucide-react';
import {
  clearStoredSuperAdminToken,
  readStoredSuperAdminToken,
  writeStoredSuperAdminToken,
} from '@/shared/utils/tokenStorage';

const getToken = () => readStoredSuperAdminToken();

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

interface SuperAdminSession {
  email: string;
  issuer: string;
  lastLoginAt?: string | null;
}

const parseApiError = (error: any, fallback: string) => {
  return error?.response?.data?.detail?.error?.message
    || error?.response?.data?.detail
    || fallback;
};

export default function SuperAdminPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [session, setSession] = useState<SuperAdminSession | null>(null);
  const [form, setForm] = useState({
    email: 'superadmin@pump.arbitrajz.com',
    password: '',
    totpCode: '',
  });

  useEffect(() => {
    const boot = async () => {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get('/api/super-admin/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success) {
          setSession(res.data.data.account);
          await fetchUsers(token);
          return;
        }
      } catch {
        clearStoredSuperAdminToken();
      }

      setLoading(false);
    };

    void boot();
  }, []);

  const fetchUsers = async (tokenOverride?: string) => {
    const token = tokenOverride || getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get('/api/super-admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setUsers(res.data.data.users || []);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: parseApiError(error, 'Failed to load users') });
      if (error?.response?.status === 401) {
        clearStoredSuperAdminToken();
        setSession(null);
      }
    }
    setLoading(false);
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthLoading(true);
    setMessage(null);

    try {
      const payload = {
        email: form.email.trim().toLowerCase(),
        password: form.password,
        totpCode: form.totpCode,
      };
      const res = await axios.post('/api/super-admin/login', payload);
      const token = res.data.data.accessToken as string;
      const account = res.data.data.account as SuperAdminSession;
      writeStoredSuperAdminToken(token);
      setSession(account);
      setForm((prev) => ({ ...prev, password: '', totpCode: '' }));
      setMessage({ type: 'success', text: 'Secure access granted.' });
      await fetchUsers(token);
    } catch (error: any) {
      setMessage({ type: 'error', text: parseApiError(error, 'Super admin login failed') });
    }

    setAuthLoading(false);
  };

  const handleLogout = () => {
    clearStoredSuperAdminToken();
    setSession(null);
    setUsers([]);
    setForm((prev) => ({ ...prev, password: '', totpCode: '' }));
    setMessage(null);
  };

  const giveSubscription = async (userId: string, duration: 'month' | 'year') => {
    if (!confirm(`Give FREE ${duration === 'month' ? '1 Month' : '1 Year'} subscription to this user?`)) return;
    setActionLoading(userId);
    try {
      await axios.patch(
        `/api/super-admin/users/${userId}`,
        {
          subscription: duration === 'month' ? 'monthly' : 'annual',
          duration,
        },
        {
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );
      setMessage({ type: 'success', text: `Subscription granted: ${duration === 'month' ? '1 Month' : '1 Year'}` });
      await fetchUsers();
    } catch (error: any) {
      setMessage({ type: 'error', text: parseApiError(error, 'Failed to update user') });
    }
    setActionLoading(null);
  };

  const deleteUser = async (userId: string, email: string) => {
    if (!confirm(`DELETE user ${email}?\n\nThis action cannot be undone.`)) return;
    setActionLoading(userId);
    try {
      await axios.delete(`/api/super-admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setUsers((prev) => prev.filter((user) => user.id !== userId));
      setMessage({ type: 'success', text: `User ${email} deleted successfully.` });
    } catch (error: any) {
      setMessage({ type: 'error', text: parseApiError(error, 'Failed to delete user') });
    }
    setActionLoading(null);
  };

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(search.toLowerCase())
    || user.name?.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSubscriptionBadge = (subscription: string, expiry: string) => {
    const isExpired = expiry && new Date(expiry) < new Date();
    if (subscription === 'annual') return <span className="px-2 py-1 text-xs font-bold rounded bg-purple-600 text-white">PRO ANNUAL</span>;
    if (subscription === 'monthly') return <span className="px-2 py-1 text-xs font-bold rounded bg-blue-600 text-white">PRO MONTHLY</span>;
    if (subscription === 'trial' && !isExpired) return <span className="px-2 py-1 text-xs font-bold rounded bg-amber-500 text-white">TRIAL</span>;
    if (isExpired) return <span className="px-2 py-1 text-xs font-bold rounded bg-red-600 text-white">EXPIRED</span>;
    return <span className="px-2 py-1 text-xs font-bold rounded bg-gray-500 text-white">FREE</span>;
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.16),_transparent_40%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] text-white">
        <div className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-12">
          <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
              <div className="mb-8 flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600/20 text-red-400">
                  <Shield className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.28em] text-sky-300">Restricted Zone</p>
                  <h1 className="text-3xl font-semibold">Signal Lab</h1>
                </div>
              </div>

              <div className="space-y-5 text-slate-200">
                <p className="max-w-xl text-base leading-7 text-slate-300">
                  Pagina asta este separată de login-ul normal. Intrarea cere email, parolă și cod TOTP din Google Authenticator.
                </p>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <KeyRound className="mb-3 h-5 w-5 text-sky-300" />
                    <p className="font-medium">Parolă separată</p>
                    <p className="mt-2 text-sm text-slate-400">Nu depinde de conturile din aplicație și nu folosește tokenul normal de user.</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <Smartphone className="mb-3 h-5 w-5 text-emerald-300" />
                    <p className="font-medium">Google Authenticator</p>
                    <p className="mt-2 text-sm text-slate-400">Introduce un cod de 6 cifre din aplicația Google Authenticator.</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <Lock className="mb-3 h-5 w-5 text-amber-300" />
                    <p className="font-medium">Lockout</p>
                    <p className="mt-2 text-sm text-slate-400">După prea multe încercări greșite, accesul se blochează temporar.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-black/30">
              <div className="mb-6">
                <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Authenticate</p>
                <h2 className="mt-2 text-2xl font-semibold">Secure Access</h2>
                <p className="mt-2 text-sm text-slate-400">
                  În Google Authenticator folosești opțiunea <span className="font-medium text-slate-200">Enter a setup key</span>.
                </p>
              </div>

              {message && (
                <div className={`mb-5 rounded-2xl border p-4 text-sm ${message.type === 'success' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200' : 'border-red-500/40 bg-red-500/10 text-red-200'}`}>
                  {message.text}
                </div>
              )}

              <form className="space-y-4" onSubmit={handleLogin}>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none transition focus:border-sky-400"
                    autoComplete="username"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Password</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none transition focus:border-sky-400"
                    autoComplete="current-password"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Google Authenticator Code</label>
                  <input
                    type="text"
                    value={form.totpCode}
                    onChange={(event) => setForm((prev) => ({ ...prev, totpCode: event.target.value.replace(/\D/g, '').slice(0, 6) }))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 tracking-[0.35em] text-white outline-none transition focus:border-emerald-400"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="123456"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-emerald-500 px-4 py-3 font-semibold text-slate-950 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {authLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                  Enter Vault
                </button>
              </form>

              <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>Setup key-ul pentru Google Authenticator se adaugă manual o singură dată, apoi te autentifici cu codul de 6 cifre generat de aplicație.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-4 mb-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Signal Lab</h1>
              <p className="text-slate-400 text-sm">Authenticated as: {session.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-300">
              Google Authenticator protected
            </div>
            <button
              onClick={() => fetchUsers()}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        {message && (
          <div className={`mb-4 p-4 rounded-lg flex items-center justify-between ${message.type === 'success' ? 'bg-emerald-900/50 border border-emerald-500' : 'bg-red-900/50 border border-red-500'}`}>
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="text-sm underline hover:no-underline">Dismiss</button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="text-3xl font-bold">{users.length}</div>
            <div className="text-slate-400 text-sm">Total Users</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="text-3xl font-bold text-purple-400">{users.filter((user) => user.subscription === 'annual').length}</div>
            <div className="text-slate-400 text-sm">Pro Annual</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="text-3xl font-bold text-blue-400">{users.filter((user) => user.subscription === 'monthly').length}</div>
            <div className="text-slate-400 text-sm">Pro Monthly</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="text-3xl font-bold text-amber-400">{users.filter((user) => user.subscription === 'trial').length}</div>
            <div className="text-slate-400 text-sm">Trial</div>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by email or name..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-blue-500"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

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
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">No users found</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
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
                          <div className="font-medium flex items-center gap-2">
                            {user.name || 'No name'}
                            {user.roles?.includes('admin') && (
                              <span className="text-xs bg-red-600 px-1.5 py-0.5 rounded">ADMIN</span>
                            )}
                          </div>
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
                      {getSubscriptionBadge(user.subscription, user.subscriptionExpiry)}
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
          <AlertTriangle className="w-4 h-4 inline mr-1" />
          Hidden route. Separate password and Google Authenticator code required.
        </div>
      </div>
    </div>
  );
}
