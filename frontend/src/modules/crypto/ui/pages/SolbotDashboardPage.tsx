import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useService } from '@/app/providers/useDI';
import { AUTH_SYMBOLS } from '@/modules/auth/di/symbols';
import type { IAuthService } from '@/modules/auth/application/ports/IAuthService';
import { Shield, Play, Pause, TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/components/ui/card';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import { Badge } from '@/shared/ui/shadcn/components/ui/badge';
import { readStoredToken } from '@/shared/utils/tokenStorage';

const SOLBOT_ADMIN_EMAIL = 'viorel.mina@gmail.com';
const getToken = () => readStoredToken();
const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

interface Trade { _id: string; symbol: string; entry_price: number; peak_price?: number; exit_price?: number; pnl_pct?: number; pnl_usd?: number; close_reason?: string; opened_at: string; closed_at?: string; held_min?: number; category?: string; signal_type?: string; confidence?: number; }
interface Stats { open_trades: Trade[]; recent_closed: Trade[]; totals: { total_pnl_usd: number; trades_7d: number; wins: number; losses: number; win_rate_pct: number; }; queue: { pending: number; added_24h: number; }; }
interface Config { enabled: boolean; capital_usd: number; risk_per_trade_pct: number; max_concurrent_trades: number; stop_loss_pct: number; trail_activation_pct: number; trail_giveback_pct: number; max_hold_minutes: number; min_conf_pumpradar: number; min_conf_dexscreener_boost: number; min_conf_ds_top_boost: number; min_conf_ds_profile: number; min_helius_wallets: number; }
interface ActivityLine { time: string; source: string; text: string; }
interface Insight { _id: string; at: string; symbol: string; pnl_pct: number; lesson: string; pattern: string; recommendation: string; confidence: number; close_reason: string; }

export default function SolbotDashboardPage() {
  const auth = useService<IAuthService>(AUTH_SYMBOLS.IAuthService);
  const user = auth.getCurrentUser() as any;
  const [tab, setTab] = useState<'dashboard'|'config'|'insights'>('dashboard');
  const [stats, setStats] = useState<Stats|null>(null);
  const [cfg, setCfg] = useState<Config|null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [activity, setActivity] = useState<ActivityLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingCfg, setSavingCfg] = useState(false);

  const isAdmin = (user?.email || '').toLowerCase().trim() === SOLBOT_ADMIN_EMAIL;

  const fetchStats = useCallback(async () => {
    try { const r = await axios.get('/api/solbot/stats', { headers: authHeaders() }); setStats(r.data); } catch (e) { console.error(e); }
  }, []);
  const fetchCfg = useCallback(async () => {
    try { const r = await axios.get('/api/solbot/config', { headers: authHeaders() }); setCfg(r.data); } catch (e) { console.error(e); }
  }, []);
  const fetchActivity = useCallback(async () => {
    try { const r = await axios.get('/api/solbot/activity?limit=40', { headers: authHeaders() }); setActivity(r.data.lines || []); } catch (e) { console.error(e); }
  }, []);
  const fetchInsights = useCallback(async () => {
    try { const r = await axios.get('/api/solbot/insights?limit=30', { headers: authHeaders() }); setInsights(r.data.insights || []); } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    Promise.all([fetchStats(), fetchCfg(), fetchInsights(), fetchActivity()]).finally(() => setLoading(false));
    const t = setInterval(fetchStats, 10000);
    const t2 = setInterval(fetchActivity, 5000);
    return () => { clearInterval(t); clearInterval(t2); };
  }, [isAdmin, fetchStats, fetchCfg, fetchInsights, fetchActivity]);

  const toggleBot = async () => {
    if (!cfg) return;
    setSavingCfg(true);
    try {
      const r = await axios.post('/api/solbot/config', { enabled: !cfg.enabled }, { headers: authHeaders() });
      setCfg(r.data);
    } catch (e) { console.error(e); }
    finally { setSavingCfg(false); }
  };

  const saveCfg = async (patch: Partial<Config>) => {
    setSavingCfg(true);
    try {
      const r = await axios.post('/api/solbot/config', patch, { headers: authHeaders() });
      setCfg(r.data);
    } catch (e) { console.error(e); }
    finally { setSavingCfg(false); }
  };

  if (!isAdmin) {
    return (
      <div className='flex items-center justify-center h-64 text-muted-foreground'>
        <div className='text-center'><Shield className='h-12 w-12 mx-auto mb-4 opacity-30' /><p>Solbot admin only</p></div>
      </div>
    );
  }

  return (
    <div className='p-4 md:p-6 space-y-4 max-w-7xl mx-auto'>
      <div className='flex items-center justify-between flex-wrap gap-3'>
        <div>
          <h1 className='text-2xl font-semibold'>Solbot Dashboard</h1>
          <p className='text-sm text-muted-foreground'>Paper trading · Solana · admin only</p>
        </div>
        <div className='flex items-center gap-2'>
          {cfg && (
            <Badge variant={cfg.enabled ? 'default' : 'secondary'} className={cfg.enabled ? 'bg-green-600' : ''}>
              {cfg.enabled ? '● Running' : '○ Stopped'}
            </Badge>
          )}
          <Button onClick={toggleBot} disabled={savingCfg || !cfg} size='sm' variant={cfg?.enabled ? 'destructive' : 'default'}>
            {cfg?.enabled ? <><Pause className='h-4 w-4 mr-2' />Stop</> : <><Play className='h-4 w-4 mr-2' />Start</>}
          </Button>
          
        </div>
      </div>

      <div className='flex gap-2 border-b'>
        {(['dashboard','config','insights'] as const).map(k => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 text-sm border-b-2 ${tab===k ? 'border-primary font-medium' : 'border-transparent text-muted-foreground'}`}>
            {k === 'dashboard' ? 'Dashboard' : k === 'config' ? 'Config' : 'AI Insights'}
          </button>
        ))}
      </div>

      {loading && <div className='text-center py-8 text-muted-foreground'>Loading...</div>}

      {tab === 'dashboard' && stats && (
        <div className='space-y-4'>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
            <Card><CardHeader className='pb-2'><CardTitle className='text-xs text-muted-foreground font-normal'>Total PnL (7d)</CardTitle></CardHeader>
              <CardContent><div className={`text-2xl font-semibold ${stats.totals.total_pnl_usd >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.totals.total_pnl_usd >= 0 ? '+' : ''}${stats.totals.total_pnl_usd.toFixed(2)}
              </div></CardContent></Card>
            <Card><CardHeader className='pb-2'><CardTitle className='text-xs text-muted-foreground font-normal'>Win rate</CardTitle></CardHeader>
              <CardContent><div className='text-2xl font-semibold'>{stats.totals.win_rate_pct}%</div>
                <div className='text-xs text-muted-foreground'>{stats.totals.wins}W / {stats.totals.losses}L</div></CardContent></Card>
            <Card><CardHeader className='pb-2'><CardTitle className='text-xs text-muted-foreground font-normal'>Open positions</CardTitle></CardHeader>
              <CardContent><div className='text-2xl font-semibold'>{stats.open_trades.length}<span className='text-sm text-muted-foreground font-normal'> / {cfg?.max_concurrent_trades || 3}</span></div></CardContent></Card>
            <Card><CardHeader className='pb-2'><CardTitle className='text-xs text-muted-foreground font-normal'>Queue</CardTitle></CardHeader>
              <CardContent><div className='text-2xl font-semibold'>{stats.queue.pending}</div>
                <div className='text-xs text-muted-foreground'>{stats.queue.added_24h} added 24h</div></CardContent></Card>
          </div>

          <Card><CardHeader><CardTitle className='text-base'>Open positions</CardTitle></CardHeader>
            <CardContent>
              {stats.open_trades.length === 0 ? <p className='text-sm text-muted-foreground'>Nici o pozitie deschisa</p> :
                <div className='space-y-2'>
                  {stats.open_trades.map(t => (
                    <div key={t._id} className='flex items-center justify-between p-3 rounded border'>
                      <div>
                        <div className='font-medium'>{t.symbol}</div>
                        <div className='text-xs text-muted-foreground'>{t.signal_type} · conf {t.confidence} · held {t.held_min}min</div>
                      </div>
                      <div className='text-right text-sm'>
                        <div>Entry: ${t.entry_price?.toFixed(8)}</div>
                        <div className='text-muted-foreground'>Peak: ${t.peak_price?.toFixed(8)}</div>
                      </div>
                    </div>
                  ))}
                </div>}
            </CardContent></Card>

          <Card><CardHeader><CardTitle className='text-base'>Recent trades</CardTitle></CardHeader>
            <CardContent>
              {stats.recent_closed.length === 0 ? <p className='text-sm text-muted-foreground'>Inca nu s-a inchis nimic</p> :
                <div className='space-y-1'>
                  {stats.recent_closed.slice(0, 15).map(t => (
                    <div key={t._id} className='flex items-center justify-between py-2 border-b last:border-0 text-sm'>
                      <div className='flex items-center gap-3'>
                        {(t.pnl_pct || 0) > 0 ? <TrendingUp className='h-4 w-4 text-green-600' /> : <TrendingDown className='h-4 w-4 text-red-600' />}
                        <span className='font-medium'>{t.symbol}</span>
                        <span className='text-xs text-muted-foreground'>{t.signal_type}</span>
                      </div>
                      <div className='flex items-center gap-4'>
                        <span className={(t.pnl_pct || 0) > 0 ? 'text-green-600' : 'text-red-600'}>
                          {(t.pnl_pct || 0) > 0 ? '+' : ''}{t.pnl_pct?.toFixed(2)}%
                        </span>
                        <span className={`text-xs ${(t.pnl_usd || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${(t.pnl_usd || 0) > 0 ? '+' : ''}{t.pnl_usd?.toFixed(2)}
                        </span>
                        <span className='text-xs text-muted-foreground min-w-[120px] text-right'>{t.close_reason}</span>
                      </div>
                    </div>
                  ))}
                </div>}
            </CardContent></Card>

          <Card>
            <CardHeader>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <CardTitle className='text-base'>Live activity</CardTitle>
                <span style={{fontSize:'11px',color:'var(--text-secondary,#888)'}}>auto-refresh 5s</span>
              </div>
            </CardHeader>
            <CardContent>
              <div style={{background:'#0a0a0a',color:'#d0d0d0',borderRadius:'6px',padding:'10px 14px',fontFamily:'monospace',fontSize:'12px',lineHeight:'1.7',maxHeight:'320px',overflowY:'auto'}}>
                {activity.length === 0 ? <span style={{color:'#666'}}>Waiting for activity...</span> : activity.map((a, i) => {
                  const srcColor: Record<string,string> = { filter:'#ffd88a', ds:'#8ecfff', prof:'#a8ffb0', exec:'#ff9d76' };
                  const isSkip = a.text.toLowerCase().includes('skip');
                  const isQueued = a.text.toUpperCase().includes('QUEUED');
                  const isBuy = a.text.includes('PAPER BUY') || a.text.includes('LIVE BUY');
                  const isSell = a.text.includes('PAPER SELL') || a.text.includes('LIVE SELL');
                  const isClosed = a.text.startsWith('CLOSED');
                  let textColor = '#d0d0d0';
                  if (isSkip) textColor = '#f8a';
                  else if (isQueued) textColor = '#ffd166';
                  else if (isBuy) textColor = '#a8ffb0';
                  else if (isSell || isClosed) textColor = '#ffb763';
                  return (
                    <div key={i}>
                      <span style={{color:'#666'}}>{(() => { const [h,m,s] = a.time.split(':').map(Number); const d = new Date(); d.setUTCHours(h, m, s); return d.toLocaleTimeString('ro-RO', {hour12:false}); })()}</span>{' '}
                      <span style={{color: srcColor[a.source] || '#aaa'}}>[{a.source}]</span>{' '}
                      <span style={{color: textColor}}>{a.text}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{display:'flex',gap:'12px',marginTop:'10px',fontSize:'11px',color:'var(--text-secondary,#888)'}}>
                <span><span style={{color:'#ffd88a'}}>■</span> PumpRadar filter</span>
                <span><span style={{color:'#8ecfff'}}>■</span> DexScreener Boost</span>
                <span><span style={{color:'#a8ffb0'}}>■</span> DS Profile</span>
                <span><span style={{color:'#ff9d76'}}>■</span> Executor</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'config' && cfg && (
        <div className='grid gap-4 md:grid-cols-2'>
          <Card><CardHeader><CardTitle className='text-base'>Capital</CardTitle></CardHeader>
            <CardContent className='space-y-3'>
              <ConfigInput label='Capital total (USDC)' value={cfg.capital_usd} onSave={v => saveCfg({ capital_usd: v })} />
              <ConfigInput label='Risc per trade (%)' value={cfg.risk_per_trade_pct} onSave={v => saveCfg({ risk_per_trade_pct: v })} />
              <ConfigInput label='Max pozitii simultan' value={cfg.max_concurrent_trades} onSave={v => saveCfg({ max_concurrent_trades: v })} />
            </CardContent></Card>

          <Card><CardHeader><CardTitle className='text-base'>Exit strategy</CardTitle></CardHeader>
            <CardContent className='space-y-3'>
              <ConfigInput label='Stop loss (%)' value={cfg.stop_loss_pct} onSave={v => saveCfg({ stop_loss_pct: v })} />
              <ConfigInput label='Trail activation (%)' value={cfg.trail_activation_pct} onSave={v => saveCfg({ trail_activation_pct: v })} />
              <ConfigInput label='Trail giveback (%)' value={cfg.trail_giveback_pct} onSave={v => saveCfg({ trail_giveback_pct: v })} />
              <ConfigInput label='Max hold (min)' value={cfg.max_hold_minutes} onSave={v => saveCfg({ max_hold_minutes: v })} />
            </CardContent></Card>

          <Card><CardHeader><CardTitle className='text-base'>Min confidence per sursa</CardTitle></CardHeader>
            <CardContent className='space-y-3'>
              <ConfigInput label='PumpRadar' value={cfg.min_conf_pumpradar} onSave={v => saveCfg({ min_conf_pumpradar: v })} />
              <ConfigInput label='DexScreener Boost' value={cfg.min_conf_dexscreener_boost} onSave={v => saveCfg({ min_conf_dexscreener_boost: v })} />
              <ConfigInput label='DS Top Boost' value={cfg.min_conf_ds_top_boost} onSave={v => saveCfg({ min_conf_ds_top_boost: v })} />
              <ConfigInput label='DS Profile' value={cfg.min_conf_ds_profile} onSave={v => saveCfg({ min_conf_ds_profile: v })} />
            </CardContent></Card>

          <Card><CardHeader><CardTitle className='text-base'>On-chain validation</CardTitle></CardHeader>
            <CardContent className='space-y-3'>
              <ConfigInput label='Min Helius wallets 1h' value={cfg.min_helius_wallets} onSave={v => saveCfg({ min_helius_wallets: v })} />
              <p className='text-xs text-muted-foreground'>Numar minim wallet-uri active pentru validare organica. Sub 15 = suspect.</p>
            </CardContent></Card>
        </div>
      )}

      {tab === 'insights' && (
        <div className='space-y-3'>
          {insights.length === 0 ? <p className='text-sm text-muted-foreground text-center py-8'>Nu sunt insights inca</p> :
            insights.map(i => (
              <Card key={i._id}>
                <CardContent className='pt-4'>
                  <div className='flex items-start gap-3'>
                    <Sparkles className='h-4 w-4 text-purple-500 mt-1' />
                    <div className='flex-1 space-y-2'>
                      <div className='flex items-center gap-2 flex-wrap'>
                        <span className='font-medium'>{i.symbol}</span>
                        <Badge variant={i.pnl_pct > 0 ? 'default' : 'destructive'} className={i.pnl_pct > 0 ? 'bg-green-600' : ''}>
                          {i.pnl_pct > 0 ? '+' : ''}{i.pnl_pct?.toFixed(2)}%
                        </Badge>
                        <span className='text-xs text-muted-foreground'>AI confidence {i.confidence}%</span>
                      </div>
                      <div className='text-sm'><strong>Lectie:</strong> {i.lesson}</div>
                      {i.pattern && i.pattern !== 'insuficiente date' && <div className='text-sm text-muted-foreground'><strong>Pattern:</strong> {i.pattern}</div>}
                      {i.recommendation && i.recommendation !== 'astept mai multe trade-uri' && <div className='text-sm text-purple-700 dark:text-purple-300'><strong>Recomandare:</strong> {i.recommendation}</div>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}

function ConfigInput({ label, value, onSave }: { label: string; value: number; onSave: (v: number) => void }) {
  const [v, setV] = useState(value);
  useEffect(() => { setV(value); }, [value]);
  return (
    <div className='flex items-center justify-between gap-3'>
      <label className='text-sm text-muted-foreground flex-1'>{label}</label>
      <input type='number' value={v} onChange={e => setV(parseFloat(e.target.value) || 0)} className='w-24 px-2 py-1 border rounded text-sm bg-background' />
      <Button size='sm' variant='outline' onClick={() => onSave(v)} style={{opacity: v === value ? 0.5 : 1}}>OK</Button>
    </div>
  );
}
