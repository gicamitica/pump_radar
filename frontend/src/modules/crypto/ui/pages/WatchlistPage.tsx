// @ts-nocheck
import { useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { Shield, ExternalLink, RefreshCw, Search } from 'lucide-react';
import { readStoredToken } from '@/shared/utils/tokenStorage';

// ─── Types ────────────────────────────────────────────────────────────────
interface CgCoin {
  id: string; name: string; symbol: string;
  market_cap_rank: number | null; thumb: string;
  platforms?: Record<string, string>;
}

interface GoPlus {
  is_honeypot?: string; buy_tax?: string; sell_tax?: string;
  cannot_buy?: string; cannot_sell_all?: string;
  is_mintable?: string; is_proxy?: string; is_blacklisted?: string;
  owner_address?: string; creator_address?: string;
  holder_count?: string; total_supply?: string;
  lp_holder_count?: string; lp_total_supply?: string;
  is_open_source?: string; can_take_back_ownership?: string;
  owner_change_balance?: string; hidden_owner?: string;
  selfdestruct?: string; external_call?: string;
  is_anti_whale?: string; anti_whale_modifiable?: string;
  trading_cooldown?: string; personal_slippage_modifiable?: string;
  transfer_pausable?: string; is_whitelisted?: string;
  dex?: Array<{name: string; liquidity: string; pair: string; liquidity_type?: string}>;
  [key: string]: any;
}

interface TokenData {
  coin: CgCoin;
  contract: string;
  chain: string;
  chainSlug: string;
  goplus: GoPlus | null;
  cgDetails: any;
}

// ─── Helpers ──────────────────────────────────────────────────────────────
const CHAIN_NAMES: Record<string, string> = {
  ethereum: 'Ethereum', 'binance-smart-chain': 'BSC', solana: 'Solana',
  'polygon-pos': 'Polygon', 'arbitrum-one': 'Arbitrum', base: 'Base',
  avalanche: 'Avalanche', optimism: 'Optimism',
};
const CHAIN_IDS: Record<string, string> = {
  ethereum: '1', 'binance-smart-chain': '56', 'polygon-pos': '137',
  'arbitrum-one': '42161', base: '8453', optimism: '10', avalanche: '43114',
};
const CHAIN_COLORS: Record<string, string> = {
  ethereum: '#627eea', 'binance-smart-chain': '#f0b90b', solana: '#9945ff',
  'polygon-pos': '#8247e5', 'arbitrum-one': '#28a0f0', base: '#0052ff',
};

function safeNum(v: any, def = 0): number {
  const n = parseFloat(v);
  return isNaN(n) ? def : n;
}
function fmtNum(n: number): string {
  if (n >= 1_000_000_000) return `${(n/1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n/1_000).toFixed(0)}K`;
  return n.toString();
}

function calcSafetyScore(gp: GoPlus): number {
  let score = 100;
  if (gp.is_honeypot === '1') score -= 40;
  if (safeNum(gp.buy_tax) > 10) score -= 15;
  if (safeNum(gp.sell_tax) > 10) score -= 15;
  if (gp.cannot_sell_all === '1') score -= 30;
  if (gp.is_mintable === '1') score -= 10;
  if (gp.can_take_back_ownership === '1') score -= 15;
  if (gp.hidden_owner === '1') score -= 20;
  if (gp.selfdestruct === '1') score -= 25;
  if (!gp.dex?.length) score -= 15;
  if (gp.is_proxy === '1') score -= 5;
  if (gp.transfer_pausable === '1') score -= 10;
  return Math.max(0, Math.min(100, score));
}

function getChecks(gp: GoPlus): Array<{label: string; ok: boolean; important: boolean}> {
  return [
    { label: 'No honeypot', ok: gp.is_honeypot !== '1', important: true },
    { label: 'Can sell all tokens', ok: gp.cannot_sell_all !== '1', important: true },
    { label: 'Verified source code', ok: gp.is_open_source === '1', important: true },
    { label: 'Not mintable', ok: gp.is_mintable !== '1', important: true },
    { label: 'No hidden owner', ok: gp.hidden_owner !== '1', important: true },
    { label: 'No blacklist', ok: gp.is_blacklisted !== '1', important: false },
    { label: 'No proxy risk', ok: gp.is_proxy !== '1', important: false },
    { label: 'Owner cannot take back', ok: gp.can_take_back_ownership !== '1', important: true },
    { label: 'No selfdestruct', ok: gp.selfdestruct !== '1', important: true },
    { label: 'No external calls', ok: gp.external_call !== '1', important: false },
    { label: 'No transfer pause', ok: gp.transfer_pausable !== '1', important: false },
    { label: 'No anti-whale abuse', ok: gp.anti_whale_modifiable !== '1', important: false },
    { label: 'No slippage manipulation', ok: gp.personal_slippage_modifiable !== '1', important: false },
    { label: 'No trading cooldown', ok: gp.trading_cooldown !== '1', important: false },
    { label: 'No whitelist restriction', ok: gp.is_whitelisted !== '1', important: false },
  ];
}

function getRiskItems(gp: GoPlus): Array<{label: string; desc: string; level: 'high'|'medium'}> {
  const risks = [];
  if (gp.is_honeypot === '1') risks.push({ label: 'Honeypot Detected', desc: 'Cannot sell tokens — this is a scam', level: 'high' as const });
  if (gp.cannot_sell_all === '1') risks.push({ label: 'Cannot Sell All', desc: 'Selling all tokens is restricted', level: 'high' as const });
  if (gp.hidden_owner === '1') risks.push({ label: 'Hidden Owner', desc: 'Contract owner is concealed', level: 'high' as const });
  if (gp.can_take_back_ownership === '1') risks.push({ label: 'Ownership Takeback Risk', desc: 'Owner can reclaim contract control', level: 'high' as const });
  if (gp.selfdestruct === '1') risks.push({ label: 'Self-Destruct Risk', desc: 'Contract can be destroyed by owner', level: 'high' as const });
  if (!gp.dex?.length) risks.push({ label: 'No Liquidity Found', desc: 'Token liquidity pairs not found on DEX', level: 'high' as const });
  if (gp.is_mintable === '1') risks.push({ label: 'Mintable Supply', desc: 'Owner can mint unlimited new tokens', level: 'medium' as const });
  if (gp.transfer_pausable === '1') risks.push({ label: 'Transfer Pausable', desc: 'Owner can pause all transfers', level: 'medium' as const });
  if (safeNum(gp.sell_tax) > 10) risks.push({ label: `High Sell Tax (${gp.sell_tax}%)`, desc: 'Unusually high sell tax detected', level: 'medium' as const });
  if (gp.is_proxy === '1') risks.push({ label: 'Proxy Contract', desc: 'Contract logic can be replaced', level: 'medium' as const });
  return risks;
}

function buildVenues(coin: CgCoin, contract: string, chain: string): Array<{name:string;type:string;url:string;pair:string;logo:string;color:string;bgColor:string;isBest?:boolean}> {
  const sym = coin.symbol.toUpperCase();
  const isSolana = chain === 'solana';
  const isBsc = chain === 'binance-smart-chain';
  const venues = [];

  if (isSolana && contract) {
    venues.push({ name: 'Raydium', type: 'DEX', url: `https://raydium.io/swap/?outputCurrency=${contract}`, pair: `${sym}/SOL`, logo: 'https://raydium.io/favicon.ico', color: '#9945ff', bgColor: '#9945ff18', isBest: true });
    venues.push({ name: 'Jupiter', type: 'SWAP', url: `https://jup.ag/swap/SOL-${contract}`, pair: 'Best route · Solana', logo: 'https://jup.ag/favicon.ico', color: '#a78bfa', bgColor: '#6366f118' });
  } else if (isBsc && contract) {
    venues.push({ name: 'PancakeSwap', type: 'DEX', url: `https://pancakeswap.finance/swap?outputCurrency=${contract}`, pair: `${sym}/BNB`, logo: 'https://pancakeswap.finance/favicon.ico', color: '#f0b90b', bgColor: '#f0b90b18', isBest: true });
    venues.push({ name: '1inch', type: 'SWAP', url: `https://app.1inch.io/#/56/simple/swap/BNB/${contract}`, pair: 'Best route · BSC', logo: 'https://1inch.io/favicon.ico', color: '#a78bfa', bgColor: '#6366f118' });
  } else if (contract) {
    venues.push({ name: 'Uniswap v3', type: 'DEX', url: `https://app.uniswap.org/swap?outputCurrency=${contract}`, pair: `${sym}/ETH`, logo: 'https://app.uniswap.org/favicon.ico', color: '#ff6b9d', bgColor: '#ff007a18', isBest: true });
    venues.push({ name: '1inch', type: 'SWAP', url: `https://app.1inch.io/#/1/simple/swap/ETH/${contract}`, pair: 'Best route · Multi-DEX', logo: 'https://1inch.io/favicon.ico', color: '#a78bfa', bgColor: '#6366f118' });
  }

  venues.push({ name: 'Binance', type: 'CEX', url: `https://www.binance.com/en/trade/${sym}_USDT`, pair: `${sym}/USDT · Spot`, logo: 'https://www.binance.com/favicon.ico', color: '#f0b90b', bgColor: '#f0b90b18' });
  venues.push({ name: 'Coinbase', type: 'CEX', url: `https://www.coinbase.com/advanced-trade/spot/${sym}-USD`, pair: `${sym}/USD · Spot`, logo: 'https://www.coinbase.com/favicon.ico', color: '#4dabf7', bgColor: '#0033a018' });
  return venues;
}

// ─── Search Dropdown ───────────────────────────────────────────────────────
function SearchDropdown({ onSelect }: { onSelect: (contract: string, coin: CgCoin, chain: string) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CgCoin[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timer = useRef<any>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const r = await axios.get(`/api/crypto/coingecko-search?query=${encodeURIComponent(q)}`);
      const coins = (r.data.coins || []).slice(0, 10) as CgCoin[];
      const enriched = await Promise.all(coins.slice(0, 8).map(async (c) => {
        try {
          const d = await axios.get(`/api/crypto/coingecko-coin/${c.id}`);
          return { ...c, platforms: d.data.platforms || {} };
        } catch { return c; }
      }));
      setResults(enriched);
      setOpen(true);
    } catch { setResults([]); }
    setLoading(false);
  }, []);

  const handleChange = (e: any) => {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => search(q), 500);
  };

  const getMainContract = (coin: CgCoin): { chain: string; address: string } | null => {
    if (!coin.platforms) return null;
    const priority = ['ethereum', 'binance-smart-chain', 'solana', 'polygon-pos', 'arbitrum-one', 'base'];
    for (const chain of priority) {
      if (coin.platforms[chain]) return { chain, address: coin.platforms[chain] };
    }
    const entries = Object.entries(coin.platforms).filter(([, v]) => v);
    if (entries.length) return { chain: entries[0][0], address: entries[0][1] };
    return null;
  };

  return (
    <div className="relative mb-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => results.length && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 800)}
          placeholder="Search token by symbol or name (e.g. PEPE, SkyAI, Doge Nova)..."
          className="w-full rounded-xl border border-border bg-muted/20 pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-primary/40 placeholder:text-muted-foreground"
        />
        {loading && <div className="absolute right-3 top-3 text-[10px] text-muted-foreground">Searching...</div>}
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-border bg-background shadow-xl overflow-hidden">
          <div className="px-3 py-1.5 text-[10px] text-muted-foreground border-b border-border bg-muted/20">
            {results.length} results · click to run safety scan
          </div>
          {results.map((coin) => {
            const mc = getMainContract(coin);
            const isOfficial = coin.market_cap_rank && coin.market_cap_rank <= 500;
            const chainColor = mc ? (CHAIN_COLORS[mc.chain] || '#6366f1') : '#475569';
            return (
              <button
                key={coin.id}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/40 transition-colors text-left border-b border-border/30 last:border-0"
                style={!mc ? { opacity: 0.45, cursor: 'not-allowed' } : {}}
                onMouseDown={() => {
                  if (mc) { onSelect(mc.address, coin, mc.chain); setQuery(coin.name); setOpen(false); }
                }}
              >
                <img src={coin.thumb} alt={coin.symbol} className="w-7 h-7 rounded-full flex-shrink-0"
                  onError={e => { (e.target as any).style.display='none'; }}/>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm">{coin.symbol.toUpperCase()}</span>
                    <span className="text-xs text-muted-foreground truncate">{coin.name}</span>
                    {isOfficial && <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">✓ OFFICIAL</span>}
                    {!isOfficial && mc && <span className="text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-full">⚠ VERIFY</span>}
                    {coin.market_cap_rank && <span className="text-[9px] text-muted-foreground">#{coin.market_cap_rank}</span>}
                  </div>
                  {mc
                    ? <div className="text-[10px] font-mono mt-0.5" style={{ color: chainColor }}>
                        {CHAIN_NAMES[mc.chain] || mc.chain} · {mc.address.slice(0,8)}...{mc.address.slice(-6)}
                      </div>
                    : <div className="text-[10px] text-amber-400 mt-0.5">No EVM/Solana contract — paste manually below</div>
                  }
                </div>
                {mc && <span className="text-[10px] text-indigo-400 flex-shrink-0 font-bold">Scan →</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── AI Summary ────────────────────────────────────────────────────────────
function AISummary({ coin, goplus, chain }: { coin: CgCoin; goplus: GoPlus | null; chain: string }) {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const generate = useCallback(async () => {
    setLoading(true);
    try {
      const chainName = CHAIN_NAMES[chain] || chain;
      const holders = goplus?.holder_count || 'unknown';
      const tax = goplus ? `buy ${goplus.buy_tax || 0}% / sell ${goplus.sell_tax || 0}%` : 'unknown';
      const risks = goplus ? getRiskItems(goplus).map(r => r.label).join(', ') || 'none detected' : 'unknown';

      const res = await axios.post('/api/crypto/ai-market-analysis', {
        signals_summary: `Token: ${coin.name} (${coin.symbol.toUpperCase()}) on ${chainName}. Market cap rank: ${coin.market_cap_rank || 'unranked'}. Holders: ${holders}. Tax: ${tax}. Risk flags: ${risks}. Write a 3-sentence token summary: what is it, what network, is it meme or utility, key risk. Be concise and factual.`
      });
      setSummary(res.data?.data?.analysis || res.data?.analysis || 'Summary unavailable.');
      setDone(true);
    } catch { setSummary('Summary unavailable.'); setDone(true); }
    setLoading(false);
  }, [coin, goplus, chain]);

  if (!done && !loading) return (
    <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">🤖</span>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">AI Token Summary</span>
          <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full">AI Engine</span>
        </div>
        <button onClick={generate}
          className="text-xs px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors">
          ✨ Generate Summary
        </button>
      </div>
    </div>
  );

  return (
    <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">🤖</span>
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">AI Token Summary</span>
        <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full">AI Engine</span>
        <button onClick={generate} className="ml-auto text-[10px] text-muted-foreground hover:text-foreground">
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`}/>
        </button>
      </div>
      {loading
        ? <div className="text-xs text-muted-foreground flex items-center gap-2"><RefreshCw className="h-3 w-3 animate-spin"/>Generating...</div>
        : <p className="text-xs text-muted-foreground leading-relaxed">{summary}</p>
      }
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────
export default function WatchlistPage() {
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(false);
  const [manualContract, setManualContract] = useState('');
  const [error, setError] = useState('');

  const runScan = useCallback(async (contract: string, coin: CgCoin, chain: string) => {
    setLoading(true);
    setError('');
    setTokenData(null);
    try {
      // Fetch GoPlus
      let goplus: GoPlus | null = null;
      const chainId = CHAIN_IDS[chain];
      if (chainId && contract && chain !== 'solana') {
        try {
          const r = await axios.get(`https://api.gopluslabs.io/api/v1/token_security/${chainId}?contract_addresses=${contract}`);
          if (r.data.result) {
            goplus = Object.values(r.data.result)[0] as GoPlus;
          }
        } catch { /* GoPlus optional */ }
      }

      // Fetch CoinGecko details
      let cgDetails: any = null;
      try {
        const r = await axios.get(`/api/crypto/coingecko-coin/${coin.id}`);
        cgDetails = r.data;
      } catch { /* optional */ }

      setTokenData({ coin, contract, chain, chainSlug: chain, goplus, cgDetails });
    } catch (e) {
      setError('Scan failed. Please try again.');
    }
    setLoading(false);
  }, []);

  const handleSearchSelect = (contract: string, coin: CgCoin, chain: string) => {
    runScan(contract, coin, chain);
  };

  const handleManualScan = () => {
    if (!manualContract.trim()) return;
    const fakeChain = manualContract.startsWith('0x') ? 'ethereum' : 'solana';
    const fakeCoin: CgCoin = {
      id: 'unknown', name: manualContract.slice(0, 8) + '...', symbol: '???',
      market_cap_rank: null, thumb: '',
    };
    runScan(manualContract.trim(), fakeCoin, fakeChain);
  };

  const gp = tokenData?.goplus;
  const coin = tokenData?.coin;
  const chain = tokenData?.chain || '';
  const contract = tokenData?.contract || '';
  const safetyScore = gp ? calcSafetyScore(gp) : null;
  const checks = gp ? getChecks(gp) : [];
  const risks = gp ? getRiskItems(gp) : [];
  const highRisks = risks.filter(r => r.level === 'high');
  const medRisks = risks.filter(r => r.level === 'medium');
  const venues = coin ? buildVenues(coin, contract, chain) : [];
  const chainColor = CHAIN_COLORS[chain] || '#6366f1';
  const chainName = CHAIN_NAMES[chain] || chain;
  const holders = gp?.holder_count ? fmtNum(parseInt(gp.holder_count)) : null;
  const cgMd = tokenData?.cgDetails?.market_data;
  const deployDate = tokenData?.cgDetails?.genesis_date;

  const scoreColor = safetyScore !== null
    ? safetyScore >= 75 ? '#22c55e' : safetyScore >= 50 ? '#f59e0b' : '#ef4444'
    : '#475569';

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Shield className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">Token Safety</h1>
        <span className="text-xs text-muted-foreground">Powered by GoPlus + CoinGecko + AI</span>
      </div>

      {/* Search */}
      <SearchDropdown onSelect={handleSearchSelect} />

      {/* Manual input */}
      <div className="flex gap-2">
        <input
          value={manualContract}
          onChange={e => setManualContract(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleManualScan()}
          placeholder="Or paste contract address directly (0x... or Solana mint)"
          className="flex-1 rounded-xl border border-border bg-muted/20 px-4 py-2.5 text-sm focus:outline-none focus:border-primary/40 placeholder:text-muted-foreground"
        />
        <button onClick={handleManualScan} disabled={loading || !manualContract.trim()}
          className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50">
          Scan
        </button>
      </div>

      {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3">{error}</div>}

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping"/>
            <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"/>
          </div>
          <div className="text-sm text-muted-foreground">Scanning token safety...</div>
        </div>
      )}

      {tokenData && !loading && (
        <>
          {/* Token Header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full overflow-hidden border border-border flex items-center justify-center bg-muted flex-shrink-0">
                {coin?.thumb
                  ? <img src={coin.thumb} alt={coin.symbol} className="w-9 h-9 object-contain"/>
                  : <span className="text-sm font-bold text-muted-foreground">{coin?.symbol?.slice(0,2).toUpperCase()}</span>
                }
              </div>
              <div>
                <div className="text-xl font-bold">{coin?.name} <span className="text-sm font-normal text-muted-foreground">{coin?.symbol?.toUpperCase()}</span></div>
                <a href={`https://${chain.includes('binance') ? 'bscscan' : chain === 'solana' ? 'solscan.io/token' : 'etherscan.io/token'}/${contract}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-[11px] font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                  {contract.slice(0,10)}...{contract.slice(-6)} <ExternalLink className="h-3 w-3"/>
                </a>
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{background: chainColor+'20', color: chainColor}}>{chainName}</span>
                  {coin?.market_cap_rank && coin.market_cap_rank <= 500 && (
                    <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">✓ OFFICIAL #{coin.market_cap_rank}</span>
                  )}
                </div>
              </div>
            </div>
            {safetyScore !== null && (
              <div className="text-right">
                <div className="text-3xl font-bold" style={{color: scoreColor}}>{safetyScore}<span className="text-sm text-muted-foreground">/100</span></div>
                <div className="text-[10px] text-muted-foreground">Safety Score</div>
                <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden mt-1 ml-auto">
                  <div className="h-full rounded-full" style={{width:`${safetyScore}%`, background: scoreColor}}/>
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'High Risk Items', value: highRisks.length.toString(), color: highRisks.length > 0 ? 'text-red-400' : 'text-emerald-400' },
              { label: 'Medium Risk', value: medRisks.length.toString(), color: medRisks.length > 0 ? 'text-amber-400' : 'text-emerald-400' },
              { label: 'Token Holders', value: holders || 'n/a', color: 'text-sky-400' },
              { label: 'Deployed', value: deployDate || (gp ? 'On-chain' : 'n/a'), color: 'text-muted-foreground' },
            ].map(s => (
              <div key={s.label} className="bg-muted/20 border border-border rounded-xl p-3 text-center">
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-[10px] text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Token Info */}
            <div className="rounded-2xl border border-border bg-muted/10 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Token Info</div>
              {[
                { label: 'Contract', value: contract.slice(0,10)+'...'+contract.slice(-6), mono: true, href: `https://etherscan.io/token/${contract}` },
                { label: 'Creator', value: gp?.creator_address ? gp.creator_address.slice(0,10)+'...'+gp.creator_address.slice(-6) : 'n/a', mono: true },
                { label: 'Owner', value: gp?.owner_address ? (gp.owner_address === '0x0000000000000000000000000000000000000000' ? '0x0000 (burned ✓)' : gp.owner_address.slice(0,10)+'...') : 'n/a', mono: true },
                { label: 'Buy Tax', value: `${gp?.buy_tax || 0}%`, color: safeNum(gp?.buy_tax) > 5 ? 'text-amber-400' : 'text-emerald-400' },
                { label: 'Sell Tax', value: `${gp?.sell_tax || 0}%`, color: safeNum(gp?.sell_tax) > 5 ? 'text-amber-400' : 'text-emerald-400' },
                { label: 'Holders', value: holders || 'n/a' },
                { label: 'Market Cap', value: cgMd?.market_cap?.usd ? `$${fmtNum(cgMd.market_cap.usd)}` : 'n/a' },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center py-1.5 border-b border-border/40 last:border-0 text-xs">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className={`${row.mono ? 'font-mono text-[10px] text-indigo-400' : ''} ${row.color || ''}`}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Risk Items */}
            <div className="rounded-2xl border border-border bg-muted/10 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">⚠ Risk Items</div>
              {risks.length === 0
                ? <div className="text-center py-4 text-emerald-400 text-sm">✓ No risk items detected</div>
                : risks.map((r, i) => (
                  <div key={i} className={`flex items-start gap-2 p-2.5 rounded-lg mb-2 last:mb-0 ${r.level === 'high' ? 'bg-red-500/8 border border-red-500/20' : 'bg-amber-500/8 border border-amber-500/20'}`}>
                    <span className="text-sm flex-shrink-0">{r.level === 'high' ? '🔴' : '🟡'}</span>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-bold ${r.level === 'high' ? 'text-red-400' : 'text-amber-400'}`}>{r.label}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{r.desc}</div>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${r.level === 'high' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      {r.level === 'high' ? 'High' : 'Medium'}
                    </span>
                  </div>
                ))
              }
            </div>
          </div>

          {/* Security Checks */}
          {checks.length > 0 && (
            <div className="rounded-2xl border border-border bg-muted/10 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">✅ Security Checks</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                {checks.map((c, i) => (
                  <div key={i} className={`flex items-center gap-1.5 text-[11px] px-2 py-1.5 rounded-lg ${c.ok ? 'text-emerald-400' : c.important ? 'text-red-400 bg-red-500/5' : 'text-amber-400'}`}>
                    <span>{c.ok ? '✓' : '✗'}</span>
                    <span>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Summary */}
          <AISummary coin={coin!} goplus={gp} chain={chain} />

          {/* Where to Trade */}
          {venues.length > 0 && (
            <div className="rounded-2xl border border-border bg-background/60 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">🔀 Where to Trade</div>
              <div className="space-y-2">
                {venues.map((v, i) => (
                  <a key={i} href={v.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-3 hover:border-indigo-500/40 transition-colors no-underline text-foreground"
                    style={v.isBest ? {borderColor:'#22c55e44'} : {}}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden bg-muted flex-shrink-0">
                      <img src={v.logo} alt={v.name} className="w-5 h-5 object-contain"
                        onError={e => { (e.target as any).style.display='none'; (e.target as any).parentElement.innerHTML = v.type==='DEX'?'🔄':v.type==='CEX'?'🏦':'⚡'; }}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{v.name}</span>
                        {v.isBest && <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">⭐ BEST</span>}
                      </div>
                      <div className="text-[10px] text-muted-foreground">{v.pair}</div>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-1 inline-block" style={{background:v.bgColor,color:v.color}}>{v.type}</span>
                    </div>
                    <div className="text-indigo-400 text-xs font-bold flex-shrink-0">Trade →</div>
                  </a>
                ))}
              </div>
            </div>
          )}

          <p className="text-[10px] text-muted-foreground text-center pb-4 flex items-center justify-center gap-1">
            <Shield className="h-3 w-3"/> AI-generated analysis. Not financial advice. Always DYOR.
          </p>
        </>
      )}

      {!tokenData && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Shield className="h-12 w-12 opacity-20"/>
          <div className="font-semibold">Search a token to run safety scan</div>
          <div className="text-xs text-center max-w-sm">Search by symbol or name, select from dropdown, and get instant GoPlus safety analysis + AI summary</div>
        </div>
      )}
    </div>
  );
}
