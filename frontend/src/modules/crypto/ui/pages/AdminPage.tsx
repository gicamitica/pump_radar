import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useService } from '@/app/providers/useDI';
import { AUTH_SYMBOLS } from '@/modules/auth/di/symbols';
import type { IAuthService } from '@/modules/auth/application/ports/IAuthService';
import { Users, Trash2, Edit, Search, Shield, Crown, Clock, RefreshCw, X, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/components/ui/card';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import { Badge } from '@/shared/ui/shadcn/components/ui/badge';

const getToken = () => localStorage.getItem('pumpradar_auth_token') || sessionStorage.getItem('pumpradar_auth_token');

interface UserEntry { id: string; email: string; name: string; subscription: string; emailVerified: boolean; createdAt: string; roles: string[]; }

export default function AdminPage() {
  const auth = useService<IAuthService>(AUTH_SYMBOLS.IAuthService);
  const currentUser = auth.getCurrentUser() as any;
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editUser, setEditUser] = useState<UserEntry | null>(null);
  const [editSub, setEditSub] = useState('');

  if (!currentUser?.roles?.includes('admin')) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground" data-testid="admin-denied">
        <div className="text-center"><Shield className="h-12 w-12 mx-auto mb-4 opacity-30" /><p>Acces restricționat - doar pentru administratori</p></div>
      </div>
    );
  }

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/users', { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.data.success) setUsers(res.data.data.users);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const deleteUser = async (id: string) => {
    if (!confirm('Ștergi utilizatorul?')) return;
    try {
      await axios.delete(`/api/admin/users/${id}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      setUsers(u => u.filter(x => x.id !== id));
    } catch (e) { console.error(e); }
  };

  const updateSub = async () => {
    if (!editUser) return;
    try {
      await axios.patch(`/api/admin/users/${editUser.id}`, { subscription: editSub }, { headers: { Authorization: `Bearer ${getToken()}` } });
      setUsers(u => u.map(x => x.id === editUser.id ? { ...x, subscription: editSub } : x));
      setEditUser(null);
    } catch (e) { console.error(e); }
  };

  const filtered = users.filter(u => u.email.includes(search) || u.name.toLowerCase().includes(search.toLowerCase()));

  const subBadge = (s: string) => {
    if (s === 'monthly' || s === 'annual') return <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"><Crown className="h-3 w-3 mr-1" />Pro</Badge>;
    if (s === 'trial') return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Trial</Badge>;
    return <Badge variant="outline">Free</Badge>;
  };

  return (
    <div className="space-y-6" data-testid="admin-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="h-6 w-6 text-primary" />Admin Panel</h1>
          <p className="text-muted-foreground text-sm">Gestionează utilizatorii și abonamentele</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchUsers}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center"><div className="text-3xl font-bold">{users.length}</div><div className="text-xs text-muted-foreground">Total utilizatori</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-3xl font-bold text-emerald-500">{users.filter(u => u.subscription === 'monthly' || u.subscription === 'annual').length}</div><div className="text-xs text-muted-foreground">Abonați Pro</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-3xl font-bold text-amber-500">{users.filter(u => u.subscription === 'trial').length}</div><div className="text-xs text-muted-foreground">Trial activ</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input className="w-full pl-9 pr-4 py-2 text-sm border border-input rounded-lg bg-background" placeholder="Caută după email sau nume..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground"><RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />Se încarcă...</div>
          ) : (
            <div className="space-y-2">
              {filtered.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      {user.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{user.name || 'N/A'}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {subBadge(user.subscription)}
                    {user.emailVerified && <Check className="h-4 w-4 text-emerald-500" />}
                    <Button variant="ghost" size="sm" onClick={() => { setEditUser(user); setEditSub(user.subscription); }} data-testid={`edit-user-${user.id}`}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => deleteUser(user.id)} data-testid={`delete-user-${user.id}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && <div className="text-center py-8 text-muted-foreground">Nu există utilizatori</div>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Editează utilizator
                <Button variant="ghost" size="sm" onClick={() => setEditUser(null)}><X className="h-4 w-4" /></Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div><div className="text-sm font-medium mb-1">{editUser.email}</div><div className="text-xs text-muted-foreground">{editUser.name}</div></div>
              <div>
                <label className="text-sm font-medium block mb-2">Abonament</label>
                <select className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" value={editSub} onChange={e => setEditSub(e.target.value)}>
                  <option value="trial">Trial</option>
                  <option value="monthly">Pro Lunar</option>
                  <option value="annual">Pro Anual</option>
                  <option value="free">Free</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={updateSub}>Salvează</Button>
                <Button variant="outline" className="flex-1" onClick={() => setEditUser(null)}>Anulează</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
