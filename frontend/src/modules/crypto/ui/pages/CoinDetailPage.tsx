import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, ArrowRight, ExternalLink, RefreshCw, Shield } from 'lucide-react';
import { readStoredToken } from '@/shared/utils/tokenStorage';

interface V2Signal {
  symbol: string; name: string;
  category: 'pump' | 'dump' | 'risk' | 'watch' | 'early' | 'dex';
  verdict: string; confidence: number; reason: string;
  network: string; token_address: string; pool_address: string; pool_url: string;
  price_usd: number; reserve_usd: number; volume_h24: number;
  price_change_h1: number; price_change_h24: number; buy_sell_ratio_h1: number;
  red_flags: string[]; whale_accumulation: boolean; whale_score: number;
  multi_source: boolean; pre_pump_activity: boolean; sources: string[]; mentions: number;
  manipulation_probability: number; dump_risk_level: 'low' | 'medium' | 'high';
}

interface CoinGeckoData {
  image: { small: string };
  market_data: {
    current_price: { usd: number };
    price_change_percentage_7d: number;
    price_change_percentage_30d: number;
    ath_change_percentage: { usd: number };
    market_cap: { usd: number };
  };
}

interface TradingVenue {
  name: string; type: 'DEX' | 'CEX' | 'SWAP';
  url: string; pair: string; logo: string;
  isBest?: boolean; color: string; bgColor: string;
}

function fmtPrice(n: number | null | undefined) {
  if (n == null || isNaN(n)) return 'n/a';
  return n > 1 ? `$${n.toFixed(2)}` : `$${n.toFixed(6)}`;
}
function fmtVol(n: number | null | undefined) {
  if (n == null || isNaN(n)) return 'n/a';
  if (n >= 1_000_000_000) return `$${(n/1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n/1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n/1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}
function manipColor(p: number) { return p>=70?'#ef4444':p>=40?'#f59e0b':'#22c55e'; }
function manipLabel(p: number) { return p>=70?'high':p>=40?'medium':'low'; }

const catConfig = {
  pump:  { color:'text-emerald-400', bg:'bg-emerald-500/10', border:'border-emerald-500/30', hex:'#22c55e' },
  dump:  { color:'text-red-400',     bg:'bg-red-500/10',     border:'border-red-500/30',     hex:'#ef4444' },
  risk:  { color:'text-amber-400',   bg:'bg-amber-500/10',   border:'border-amber-500/30',   hex:'#f59e0b' },
  watch: { color:'text-sky-400',     bg:'bg-sky-500/10',     border:'border-sky-500/30',     hex:'#38bdf8' },
  early: { color:'text-violet-400',  bg:'bg-violet-500/10',  border:'border-violet-500/30',  hex:'#a78bfa' },
  dex:   { color:'text-orange-400',  bg:'bg-orange-500/10',  border:'border-orange-500/30',  hex:'#fb923c' },
};
const catIcons: Record<string,string> = { pump:'▲', dump:'▼', risk:'⚠', watch:'👁', early:'⚡', dex:'🔥' };

const COINGECKO_IDS: Record<string,string> = {
  CRV:'curve-dao-token', ORCA:'orca', FLUX:'flux', ONDO:'ondo-finance',
  ZAMA:'zama', AAVE:'aave', DRIFT:'drift-protocol', TAO:'bittensor',
  PENGU:'pudgy-penguins', ENA:'ethena', PYTH:'pyth-network', SEI:'sei-network',
  BTC:'bitcoin', ETH:'ethereum', SOL:'solana', BNB:'binancecoin',
};

function buildVenues(signal: V2Signal): TradingVenue[] {
  const sym = signal.symbol.toUpperCase();
  const addr = signal.token_address;
  const net = signal.network?.toLowerCase() || 'eth';
  const isSolana = net === 'solana' || net === 'sol';
  const venues: TradingVenue[] = [];

  if (signal.pool_url) {
    venues.push({
      name: 'GeckoTerminal Pool', type: 'DEX',
      url: signal.pool_url,
      pair: `${sym} · Live Pool`,
      logo: 'https://www.geckoterminal.com/favicon.ico',
      color: '#22c55e', bgColor: '#22c55e18',
    });
  }

  if (isSolana && addr) {
    venues.push({
      name: 'Raydium', type: 'DEX',
      url: `https://raydium.io/swap/?inputMint=So11111111111111111111111111111111111111112&outputMint=${addr}`,
      pair: `${sym}/SOL · Raydium`,
      logo: 'https://raydium.io/favicon.ico',
      color: '#9945ff', bgColor: '#9945ff18',
    });
    venues.push({
      name: 'Jupiter', type: 'SWAP',
      url: `https://jup.ag/swap?sell=So11111111111111111111111111111111111111112&buy=${addr}`,
      pair: 'Best route · Solana aggregator',
      logo: 'https://jup.ag/favicon.ico',
      color: '#a78bfa', bgColor: '#6366f118',
    });
  } else if (addr) {
    venues.push({
      name: 'Uniswap v3', type: 'DEX',
      url: `https://app.uniswap.org/swap?outputCurrency=${addr}`,
      pair: `${sym}/ETH · Uniswap`,
      logo: 'https://app.uniswap.org/favicon.ico',
      color: '#ff6b9d', bgColor: '#ff007a18',
    });
    venues.push({
      name: '1inch', type: 'SWAP',
      url: `https://app.1inch.io/#/1/simple/swap/ETH/${addr}`,
      pair: 'Best route · Multi-DEX',
      logo: 'https://1inch.io/favicon.ico',
      color: '#a78bfa', bgColor: '#6366f118',
    });
  }

  // Detecteaza memecoin DEX-only (pump.fun etc.) - NU are listare CEX, ascundem CEX
  const isMemeDexOnly = (addr || '').toLowerCase().includes('pump') ||
    ((addr || '').toLowerCase().endsWith('moon')) ||
    (isSolana && (signal.reserve_usd || 0) < 50000) ||
    ((signal.volume_h24 || 0) < 1000);  // volum mort/fake => sigur nu e listare CEX reala
  if (!isMemeDexOnly) {
    // Linkuri CEX ca CAUTARE (nu pereche directa) - eviti token gresit cu acelasi ticker
    venues.push({
      name: 'Binance', type: 'CEX',
      url: `https://www.binance.com/en/trade/${sym}_USDT`,
      pair: `${sym}/USDT · verifica`,
      logo: 'https://www.binance.com/favicon.ico',
      color: '#f0b90b', bgColor: '#f0b90b18',
    });
    venues.push({
      name: 'Coinbase', type: 'CEX',
      url: `https://www.coinbase.com/advanced-trade/spot/${sym}-USD`,
      pair: `${sym}/USD · verifica`,
      logo: 'https://www.coinbase.com/favicon.ico',
      color: '#4dabf7', bgColor: '#0033a018',
    });
  }

  const firstDex = venues.find(v => v.type === 'DEX');
  if (firstDex) firstDex.isBest = true;
  return venues;
}

function Tooltip({ children, content }: { children: React.ReactNode; content: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-flex items-center" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      {children}
      {open && (
        <div className="absolute top-6 left-0 w-64 bg-background border border-indigo-500/30 rounded-xl p-3 text-xs text-muted-foreground leading-relaxed z-50 shadow-xl">
          {content}
        </div>
      )}
    </div>
  );
}

function PriceCard({ label, value }: { label: string; value: number | null | undefined }) {
  if (value == null || isNaN(value)) return (
    <div className="rounded-lg p-2 text-center border border-border bg-muted/20">
      <div className="text-[9px] text-muted-foreground mb-1">{label}</div>
      <div className="text-sm font-bold text-muted-foreground">n/a</div>
    </div>
  );
  const isPos = value > 0.05;
  const isNeg = value < -0.05;
  const color = isPos ? '#22c55e' : isNeg ? '#ef4444' : '#94a3b8';
  const bg = isPos ? 'rgba(34,197,94,0.06)' : isNeg ? 'rgba(239,68,68,0.06)' : 'rgba(100,116,139,0.06)';
  const borderColor = isPos ? 'rgba(34,197,94,0.2)' : isNeg ? 'rgba(239,68,68,0.2)' : 'rgba(100,116,139,0.2)';
  const arrow = isPos ? '▲' : isNeg ? '▼' : '→';
  return (
    <div className="rounded-lg p-2 text-center border" style={{ background: bg, borderColor }}>
      <div className="text-[9px] font-medium mb-1" style={{ color }}>{label}</div>
      <div className="text-sm font-bold" style={{ color }}>{arrow} {Math.abs(value).toFixed(2)}%</div>
    </div>
  );
}

export default function CoinDetailPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const [signal, setSignal] = useState<V2Signal | null>(null);
  const [cgData, setCgData] = useState<CoinGeckoData | null>(null);
  const [scanSnapshot, setScanSnapshot] = useState<{price_usd:number; volume_h24:number; reserve_usd:number}|null>(null);
  const [scanTime, setScanTime] = useState<number>(0);
  const [, forceTick] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSignal = useCallback(async () => {
    if (!symbol) return;
    setLoading(true);
    try {
      const token = readStoredToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get('/api/crypto/signals-v2', { headers });
      if (res.data.success) {
        const all = [
          ...(res.data.data.pump_signals||[]),
          ...(res.data.data.dump_signals||[]),
          ...(res.data.data.risk_signals||[]),
          ...(res.data.data.watch_signals||[]),
          ...(res.data.data.early_signals||[]),
          ...(res.data.data.dex_signals||[]),
        ];
        const found = all.find((s: V2Signal) => s.symbol.toUpperCase() === symbol.toUpperCase());
        if (found) {
          setSignal(found);
          // captureaza valorile INGHETATE de la scan (inainte de suprascrierea live)
          setScanSnapshot({ price_usd: found.price_usd, volume_h24: found.volume_h24, reserve_usd: found.reserve_usd });
          setScanTime(res.data.data.last_updated ? new Date(res.data.data.last_updated).getTime() : Date.now());
          // Date LIVE din GeckoTerminal (sincron cu graficul) - suprascrie h1/h24 inghetate din scan
          if (found.token_address && found.network && found.network.toLowerCase() !== 'unknown') {
            try {
              const liveRes = await axios.get(
                `/api/crypto/coin-live/${encodeURIComponent(found.network)}/${encodeURIComponent(found.token_address)}?symbol=${encodeURIComponent(found.symbol)}`
              );
              const live = liveRes.data?.data;
              if (live?.live) {
                setSignal({
                  ...found,
                  price_usd: live.price_usd ?? found.price_usd,
                  price_change_h1: live.price_change_h1 ?? found.price_change_h1,
                  price_change_h24: live.price_change_h24 ?? found.price_change_h24,
                  volume_h24: live.volume_h24 ?? found.volume_h24,
                  reserve_usd: live.reserve_usd ?? found.reserve_usd,
                  buy_sell_ratio_h1: live.buy_sell_ratio_h1 ?? found.buy_sell_ratio_h1,
                });
              }
            } catch { /* fallback la datele din scan */ }
          }
          let cgId = COINGECKO_IDS[found.symbol.toUpperCase()];
          // Fallback: daca simbolul nu e in lista, cauta prin CoinGecko search
          if (!cgId) {
            try {
              const searchRes = await axios.get(
                `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(found.symbol)}`
              );
              const coins = searchRes.data?.coins || [];
              const exact = coins.find((co: any) => (co.symbol||'').toUpperCase() === found.symbol.toUpperCase());
              cgId = exact?.id || coins[0]?.id;
            } catch { /* optional */ }
          }
          if (cgId) {
            try {
              const cgRes = await axios.get(
                `https://api.coingecko.com/api/v3/coins/${cgId}?localization=false&tickers=false&community_data=false&developer_data=false`
              );
              setCgData(cgRes.data);
            } catch { /* optional */ }
          }
        } else {
          setError(`${symbol} not found in latest scan.`);
        }
      }
    } catch { setError('Failed to load data.'); }
    finally { setLoading(false); }
  }, [symbol]);

  useEffect(() => { fetchSignal(); }, [fetchSignal]);
  // tick la 30s ca 'Xm ago' sa creasca vizibil
  useEffect(() => { const t = setInterval(() => forceTick(n => n + 1), 30000); return () => clearInterval(t); }, []);

  // Auto-refresh date LIVE de piata la 10s (doar pret/volum/lichiditate, nu verdictul AI)
  useEffect(() => {
    if (!symbol) return;
    const refreshLive = async () => {
      const s = signal;
      if (!s || !s.token_address || !s.network || s.network.toLowerCase() === 'unknown') return;
      try {
        const liveRes = await axios.get(
          `/api/crypto/coin-live/${encodeURIComponent(s.network)}/${encodeURIComponent(s.token_address)}?symbol=${encodeURIComponent(s.symbol)}`
        );
        const live = liveRes.data?.data;
        if (live?.live) {
          setSignal(prev => prev ? {
            ...prev,
            price_usd: live.price_usd ?? prev.price_usd,
            price_change_h1: live.price_change_h1 ?? prev.price_change_h1,
            price_change_h24: live.price_change_h24 ?? prev.price_change_h24,
            volume_h24: live.volume_h24 ?? prev.volume_h24,
            reserve_usd: live.reserve_usd ?? prev.reserve_usd,
            buy_sell_ratio_h1: live.buy_sell_ratio_h1 ?? prev.buy_sell_ratio_h1,
          } : prev);
        }
      } catch { /* pastram datele curente */ }
    };
    const iv = setInterval(refreshLive, 10000);
    return () => clearInterval(iv);
  }, [symbol, signal?.token_address, signal?.network]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping"/>
        <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"/>
      </div>
      <div className="font-bold">Loading {symbol}...</div>
    </div>
  );

  if (error || !signal) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-muted-foreground">
      <div className="text-5xl">🔍</div>
      <div className="font-bold text-lg">{error || 'Signal not found'}</div>
      <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-border hover:border-primary/40 transition-colors">
        <ArrowLeft className="h-4 w-4"/> Back to dashboard
      </button>
    </div>
  );

  const cfg = catConfig[signal.category] || catConfig.watch;
  const venues = buildVenues(signal);
  const coinImg = cgData?.image?.small;
  // helper: variatie intre valoarea de la scan si cea live
  const pctChange = (now?: number, then?: number) => (now != null && then != null && then !== 0) ? ((now - then) / then) * 100 : null;
  const scanAgeMin = scanTime ? Math.max(0, Math.floor((Date.now() - scanTime) / 60000)) : 0;
  const fmtChip = (pct: number | null) => {
    if (pct == null) return null;
    const up = pct >= 0;
    return <span className="text-xs font-bold ml-2" style={{color: up ? '#10b981' : '#f87171'}}>{up?'▲':'▼'} {Math.abs(pct).toFixed(2)}%</span>;
  };
  const marketCap = cgData?.market_data?.market_cap?.usd;

  const chainSlug: Record<string,string> = {
    eth:'eth', ethereum:'eth', solana:'solana', sol:'solana',
    bsc:'bsc', polygon:'polygon_pos', arbitrum:'arbitrum', base:'base',
  };
  const netKey = signal.network?.toLowerCase() || 'eth';
  const gtChain = chainSlug[netKey];
  // Slug DexScreener (difera de GeckoTerminal): eth->ethereum etc.
  const dsChainMap: Record<string,string> = {
    eth:'ethereum', ethereum:'ethereum', bsc:'bsc', solana:'solana', sol:'solana',
    polygon:'polygon', polygon_pos:'polygon', arbitrum:'arbitrum', base:'base',
    near:'near', multiversx:'multiversx', avax:'avalanche', avalanche:'avalanche',
    optimism:'optimism',
  };
  const dsChain = dsChainMap[netKey] || netKey;
  // GeckoTerminal embed pe retele suportate; altfel DexScreener (suporta near, multiversx etc.)
  let chartUrl: string | null = null;
  let chartSource: 'gt' | 'ds' = 'gt';
  if (gtChain && signal.pool_address) {
    chartUrl = `https://www.geckoterminal.com/${gtChain}/pools/${signal.pool_address}?embed=1&info=0&swaps=0`;
    chartSource = 'gt';
  } else if (signal.pool_address) {
    chartUrl = `https://dexscreener.com/${dsChain}/${signal.pool_address}?embed=1&theme=dark&trades=0&info=0`;
    chartSource = 'ds';
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-3.5 w-3.5"/> Back to dashboard
      </button>

      {/* Hero */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${cfg.border} ${cfg.bg} overflow-hidden flex-shrink-0`}>
            {coinImg
              ? <img src={coinImg} alt={signal.symbol} className="w-9 h-9 object-contain"
                  onError={e => { (e.target as HTMLImageElement).style.display='none'; }}/>
              : <span className={`text-sm font-bold ${cfg.color}`}>{signal.symbol.slice(0,2)}</span>
            }
          </div>
          <div>
            <div className="text-2xl font-bold">{signal.symbol} <span className="text-sm font-normal text-muted-foreground">{signal.name}</span></div>
            <div className="text-xs text-muted-foreground mt-0.5">{signal.network} · {signal.token_address?.slice(0,10)}...{signal.token_address?.slice(-6)}</div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border font-bold text-sm animate-pulse ${cfg.border} ${cfg.bg} ${cfg.color}`} style={{animationDuration:'2s'}}>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:cfg.hex}}/>
                {catIcons[signal.category]} {signal.verdict}
              </div>
              <Tooltip content={
                <div>
                  <div className="font-bold text-foreground mb-2">🤖 Why {signal.verdict}?</div>
                  <p>{signal.reason}</p>
                  {signal.whale_accumulation && <p className="mt-1 text-blue-400">• Whale accumulation · score {signal.whale_score}/100</p>}
                  {signal.pre_pump_activity && <p className="mt-1 text-violet-400">• Pre-pump activity detected</p>}
                  {signal.multi_source && <p className="mt-1 text-purple-400">• Multi-source confirmation</p>}
                </div>
              }>
                <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground cursor-help">i</div>
              </Tooltip>
              {signal.multi_source && <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">⚡ MULTI</span>}
              {signal.pre_pump_activity && <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">⚡ PRE-PUMP</span>}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold">{fmtPrice(signal.price_usd)}</div>
          <div className={`text-xl font-bold mt-1 ${cfg.color}`}>{signal.confidence}% confidence</div>
          {marketCap && <div className="text-xs text-muted-foreground mt-1">MCap {fmtVol(marketCap)}</div>}
        </div>
      </div>

      {/* Big scan-vs-now price card */}
      {scanSnapshot && (
        <div className="rounded-2xl border border-border bg-muted/30 px-5 py-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Price</div>
          <div className="flex items-end gap-4 flex-wrap">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">at scan ({scanAgeMin}m ago)</div>
              <div className="text-lg font-semibold text-muted-foreground tabular-nums mt-0.5">{fmtPrice(scanSnapshot.price_usd)}</div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground mb-1.5"/>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-primary">now (live)</div>
              <div className="text-3xl font-bold text-primary tabular-nums mt-0.5 leading-none">{fmtPrice(signal.price_usd)}</div>
            </div>
            <div className="mb-1.5">{fmtChip(pctChange(signal.price_usd, scanSnapshot.price_usd))}</div>
          </div>
          <div className="text-[10px] text-muted-foreground mt-3 pt-2.5 border-t border-border">updated live · refreshes every 10s</div>
        </div>
      )}

      {/* Metrics row 1 */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-muted/40 rounded-lg p-2 text-center">
          <div className="text-[9px] text-muted-foreground">Volume 24h</div>
          <div className="text-sm font-bold">{fmtVol(signal.volume_h24)}{fmtChip(pctChange(signal.volume_h24, scanSnapshot?.volume_h24))}</div>
          {scanSnapshot && <div className="text-[8px] text-muted-foreground">scan: {fmtVol(scanSnapshot.volume_h24)}</div>}
        </div>
        <div className="bg-muted/40 rounded-lg p-2 text-center">
          <div className="text-[9px] text-muted-foreground">Liquidity</div>
          <div className="text-sm font-bold">{fmtVol(signal.reserve_usd)}{fmtChip(pctChange(signal.reserve_usd, scanSnapshot?.reserve_usd))}</div>
          {scanSnapshot && <div className="text-[8px] text-muted-foreground">scan: {fmtVol(scanSnapshot.reserve_usd)}</div>}
        </div>
        <div className="bg-muted/40 rounded-lg p-2 text-center">
          <div className="text-[9px] text-muted-foreground">Sources</div>
          <div className="text-sm font-bold text-violet-400">{signal.mentions} · {signal.multi_source?'MULTI':'SINGLE'}</div>
        </div>
      </div>

      {/* Price changes row */}
      <div className="grid grid-cols-2 gap-2">
        <PriceCard label="1h" value={signal.price_change_h1}/>
        <PriceCard label="24h" value={signal.price_change_h24}/>
      </div>

      {/* GeckoTerminal Chart */}
      {chartUrl && (
        <div className="rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-muted/20">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">🦎 Live Chart — {chartSource==='ds'?'DexScreener':'GeckoTerminal'}</span>
            <a href={signal.pool_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors">
              Open full <ExternalLink className="h-3 w-3"/>
            </a>
          </div>
          {chartSource==='gt'
            ? <iframe src={chartUrl} className="w-full" style={{height:'480px',border:'none'}} title={`${signal.symbol} chart`} loading="lazy"/>
            : <a href={signal.pool_url || chartUrl} target="_blank" rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-2 py-10 text-center hover:bg-muted/10 transition-colors">
                <span className="text-3xl">📈</span>
                <span className="text-sm font-semibold text-indigo-400">Open live chart for {signal.symbol}</span>
                <span className="text-[10px] text-muted-foreground">Chart embed not available for {signal.network} — opens in new tab</span>
              </a>
          }
        </div>
      )}

      {/* Whale + Manip */}
      <div className="grid grid-cols-2 gap-3">
        <div onClick={() => navigate(`/coin/${signal.symbol}/whale`)}
          className={`block rounded-2xl border p-3 cursor-pointer hover:border-blue-400/50 transition-colors ${signal.whale_accumulation?'bg-blue-500/5 border-blue-500/20':'bg-muted/20 border-border'}`}>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">🐋 Whale Activity</div>
          <div className={`text-base font-bold ${signal.whale_accumulation?'text-blue-400':'text-muted-foreground'}`}>
            {signal.whale_accumulation?'Accumulating':'Not accumulating'}
          </div>
          <div className={`text-xs font-bold mt-0.5 ${signal.whale_accumulation?'text-blue-400':'text-muted-foreground'}`}>Score: {signal.whale_score}/100</div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2">
            <div className="h-full rounded-full" style={{width:`${signal.whale_score}%`,background:signal.whale_score>=70?'#3b82f6':signal.whale_score>=40?'#f59e0b':'#6b7280'}}/>
          </div>
          <div className="text-[10px] text-muted-foreground mt-2">View whale details ↗</div>
        </div>
        <div onClick={() => navigate('/risk')} className="rounded-2xl border border-border bg-muted/20 p-3 cursor-pointer hover:border-amber-400/50 transition-colors">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">⚠️ Manipulation Risk ↗</div>
          <div className="text-base font-bold" style={{color:manipColor(signal.manipulation_probability)}}>
            {signal.manipulation_probability}% · {manipLabel(signal.manipulation_probability)}
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2">
            <div className="h-full rounded-full" style={{width:`${signal.manipulation_probability}%`,background:manipColor(signal.manipulation_probability)}}/>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {signal.red_flags.length > 0
              ? signal.red_flags.map(f => <span key={f} className="text-[9px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded">⚠ {f}</span>)
              : <>
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded">✓ no honeypot</span>
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded">✓ clean</span>
                </>
            }
          </div>
        </div>
      </div>

      {/* Sources */}
      <div className="rounded-2xl border border-border bg-muted/20 p-3">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">📡 Signal Sources</div>
        <div className="flex gap-2 flex-wrap">
          {signal.sources.map(s => {
            const icons: Record<string,string> = {telegram:'📱',reddit:'🟠',cointelegraph:'📰',twitter:'🐦',dexscreener:'📊'};
            return <span key={s} className="bg-muted px-2 py-1 rounded-full text-xs capitalize">{icons[s]||'📡'} {s}</span>;
          })}
          <span className="bg-violet-500/10 text-violet-400 px-2 py-1 rounded-full text-xs">{signal.mentions} mentions</span>
        </div>
      </div>

      {/* Trading Venues */}
      <div className="rounded-2xl border border-border bg-background/60 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">🔀 Where to Trade</div>
          <span className="text-[9px] text-muted-foreground">click opens exact trading pair</span>
        </div>
        <div className="space-y-2">
          {venues.map((v, i) => (
            <a key={i} href={v.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border bg-muted/20 p-3 hover:border-indigo-500/40 transition-colors no-underline text-foreground"
              style={{borderColor: v.isBest ? '#22c55e44' : 'rgb(51,65,85)'}}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden bg-muted flex-shrink-0">
                <img src={v.logo} alt={v.name} className="w-5 h-5 object-contain"
                  onError={e => {
                    const t = e.target as HTMLImageElement;
                    t.style.display='none';
                    if (t.parentElement) t.parentElement.innerHTML = v.type==='DEX'?'🔄':v.type==='CEX'?'🏦':'⚡';
                  }}/>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">{v.name}</span>
                  {v.isBest && <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">⭐ BEST</span>}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{v.pair}</div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-1 inline-block" style={{background:v.bgColor,color:v.color}}>{v.type}</span>
              </div>
              <div className="text-indigo-400 text-xs font-bold flex-shrink-0">Trade →</div>
            </a>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground pb-4">
        {signal.pool_url && (
          <a href={signal.pool_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors">
            🦎 GeckoTerminal <ExternalLink className="h-3 w-3"/>
          </a>
        )}
        {signal.token_address && (
          <a href={`https://dexscreener.com/search?q=${signal.token_address}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors">
            📊 DexScreener <ExternalLink className="h-3 w-3"/>
          </a>
        )}
        <button onClick={fetchSignal} className="flex items-center gap-1 hover:text-foreground transition-colors">
          <RefreshCw className="h-3 w-3"/> Refresh
        </button>
      </div>

      <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1 pb-2">
        <Shield className="h-3 w-3"/> AI-generated signals. Not financial advice.
      </p>
    </div>
  );
}
