import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { TrendingUp, TrendingDown, Brain, Zap, Clock, Shield, ChevronRight, Check, BarChart3, Activity, Menu, X, Flame, Radio, Send } from 'lucide-react';
import { readStoredToken } from '@/shared/utils/tokenStorage';

// PumpRadar Logo
const PumpRadarLogo = ({ size = 32 }: { size?: number }) => (
  <img 
    src="/logo-pumpradar.png" 
    alt="PumpRadar" 
    className="rounded-lg"
    style={{ width: size, height: size, objectFit: 'contain' }}
  />
);

const FEATURES = [
  { icon: <Brain className="h-6 w-6" />, title: 'AI-Enhanced Analysis', desc: 'Deterministic signal engine with AI refinement when quota and provider access are available', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { icon: <Clock className="h-6 w-6" />, title: 'Hourly Updates', desc: 'Fresh data every hour from CoinGecko + Fear & Greed Index', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { icon: <TrendingUp className="h-6 w-6" />, title: 'PUMP Signals', desc: 'Identify coins with positive momentum before the big move', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { icon: <TrendingDown className="h-6 w-6" />, title: 'DUMP Signals', desc: 'Avoid losses — detect selling pressure early', color: 'text-red-400', bg: 'bg-red-500/10' },
  { icon: <BarChart3 className="h-6 w-6" />, title: 'Social Momentum Layer', desc: 'CoinGecko trend signals plus LunarCrush social metrics whenever the active provider plan allows it', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { icon: <Shield className="h-6 w-6" />, title: 'Risk Rating', desc: 'Each signal comes with risk level and AI confidence score', color: 'text-pink-400', bg: 'bg-pink-500/10' },
];

const PLANS = [
  {
    name: 'Trial',
    price: '0',
    period: '7 days',
    features: ['Start your 7-day free trial', 'Full Pro access', 'No charge today', 'Cancel anytime before billing', 'Secure checkout with Stripe', 'Reminder email before billing'],
    cta: 'Start Trial',
    variant: 'outline',
  },
  {
    name: 'Monthly',
    price: '29.99',
    period: '/month',
    features: ['All pump & dump signals', 'Full AI signal analysis', 'Social momentum layer', 'Hourly signal refresh', 'Morning & evening signal digest', 'Priority support'],
    cta: 'Subscribe Monthly',
    variant: 'primary',
    badge: 'Popular',
  },
  {
    name: 'Annual',
    price: '299.99',
    period: '/year',
    features: ['All pump & dump signals', 'Full AI signal analysis', 'Social momentum layer', 'Hourly signal refresh', 'Morning & evening signal digest', 'Priority support', 'Save 2 months vs monthly'],
    cta: 'Subscribe Annual',
    variant: 'outline',
    badge: 'Save 2 months',
  },
];

interface LandingSignal {
  symbol: string;
  name: string;
  type: 'pump' | 'dump';
  strength: number;
  change1h: string;
  change24h: string;
  confidence: string;
  reason: string;
  updatedAt?: string | null;
}

const FALLBACK_SIGNALS: LandingSignal[] = [
  { symbol: 'AKT', name: 'Akash Network', type: 'pump', strength: 85, change1h: '+1.43%', change24h: '+1.25%', confidence: 'Strong', reason: 'Trending CoinGecko + increased volume' },
  { symbol: 'SOL', name: 'Solana', type: 'pump', strength: 78, change1h: '+2.10%', change24h: '+5.30%', confidence: 'Strong', reason: 'Positive momentum all timeframes' },
  { symbol: 'LUNA', name: 'Terra Luna', type: 'dump', strength: 72, change1h: '-2.10%', change24h: '-8.30%', confidence: 'Medium', reason: 'Strong selling pressure' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [signals, setSignals] = useState<LandingSignal[]>(FALLBACK_SIGNALS);
  const [signalsLoading, setSignalsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [coinsAnalyzed, setCoinsAnalyzed] = useState(0);
  const [fearGreedLabel, setFearGreedLabel] = useState<string>('Neutral');
  const [telegramHeadline, setTelegramHeadline] = useState<string>('Scanning watched channels');
  const storedToken = readStoredToken();
  const hasStoredToken = typeof storedToken === 'string' && storedToken.startsWith('eyJ');

  const formatRelativeShort = (ts?: string | null) => {
    if (!ts) return 'just now';
    const diffSeconds = Math.max(0, Math.floor((Date.now() - new Date(ts).getTime()) / 1000));
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    const mins = Math.floor(diffSeconds / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ago`;
  };

  const getSignalState = (signal: LandingSignal) => {
    const oneHour = Number(signal.change1h.replace('%', ''));
    const day = Number(signal.change24h.replace('%', ''));
    if (signal.type === 'pump') {
      if (day >= 12 || oneHour >= 3) return { label: 'Overextended', tone: 'bg-amber-500/15 text-amber-400' };
      if (signal.strength >= 75) return { label: 'Confirmed', tone: 'bg-emerald-500/15 text-emerald-400' };
      return { label: 'Emerging', tone: 'bg-sky-500/15 text-sky-400' };
    }
    if (day <= -10 || oneHour <= -3) return { label: 'Overextended', tone: 'bg-amber-500/15 text-amber-400' };
    if (signal.strength >= 70) return { label: 'Failing', tone: 'bg-red-500/15 text-red-400' };
    return { label: 'Confirmed', tone: 'bg-orange-500/15 text-orange-400' };
  };

  useEffect(() => {
    // If user already has a token, redirect to dashboard
    const token = readStoredToken();
    if (token) {
      try {
        const parsed = JSON.parse(token);
        if (parsed && typeof parsed === 'string') {
          navigate('/dashboard', { replace: true });
          return;
        }
      } catch { /* not JSON - check raw */ }
      if (typeof token === 'string' && token.startsWith('eyJ')) {
        navigate('/dashboard', { replace: true });
        return;
      }
    }
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;

    const fetchLiveSignals = async () => {
      try {
        const res = await axios.get('/api/crypto/signals');
        if (!res.data?.success) return;

        const mappedSignals: LandingSignal[] = [
          ...(res.data.data.pump_signals || []).map((signal: any) => ({
            symbol: signal.symbol,
            name: signal.name,
            type: 'pump' as const,
            strength: signal.signal_strength,
            change1h: `${signal.price_change_1h >= 0 ? '+' : ''}${Number(signal.price_change_1h ?? 0).toFixed(2)}%`,
            change24h: `${signal.price_change_24h >= 0 ? '+' : ''}${Number(signal.price_change_24h ?? 0).toFixed(2)}%`,
            confidence: signal.confidence === 'high' ? 'Strong' : signal.confidence === 'medium' ? 'Medium' : 'Weak',
            reason: signal.reason,
            updatedAt: res.data.data.last_updated,
          })),
          ...(res.data.data.dump_signals || []).map((signal: any) => ({
            symbol: signal.symbol,
            name: signal.name,
            type: 'dump' as const,
            strength: signal.signal_strength,
            change1h: `${signal.price_change_1h >= 0 ? '+' : ''}${Number(signal.price_change_1h ?? 0).toFixed(2)}%`,
            change24h: `${signal.price_change_24h >= 0 ? '+' : ''}${Number(signal.price_change_24h ?? 0).toFixed(2)}%`,
            confidence: signal.confidence === 'high' ? 'Strong' : signal.confidence === 'medium' ? 'Medium' : 'Weak',
            reason: signal.reason,
            updatedAt: res.data.data.last_updated,
          })),
        ]
          .sort((a, b) => b.strength - a.strength)
          .slice(0, 3);

        if (!cancelled && mappedSignals.length > 0) {
          setSignals(mappedSignals);
          setLastUpdated(res.data.data.last_updated || null);
          setCoinsAnalyzed(res.data.data.coins_analyzed || 0);
          if (res.data.data.fear_greed) {
            setFearGreedLabel(`${res.data.data.fear_greed.value} ${res.data.data.fear_greed.classification}`);
          }
        }
      } catch {
        // Keep fallback preview cards if live data is temporarily unavailable.
      } finally {
        if (!cancelled) {
          setSignalsLoading(false);
        }
      }
    };

    fetchLiveSignals();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchTelegramHeadline = async () => {
      try {
        const token = readStoredToken();
        if (!token) return;
        const headers = { Authorization: `Bearer ${token}` };
        const res = await axios.get('/api/telegram/consensus?hours=24', { headers });
        if (!cancelled && res.data?.success) {
          setTelegramHeadline(res.data.data.headline || 'Scanning watched channels');
        }
      } catch {
        // Landing page can stay on generic headline.
      }
    };

    fetchTelegramHeadline();
    return () => {
      cancelled = true;
    };
  }, []);

  const handlePreviewSignalClick = (signal: LandingSignal) => {
    if (hasStoredToken) {
      navigate(`/coin/${signal.symbol}?type=${signal.type}`);
      return;
    }

    navigate('/auth/register');
  };

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white overflow-x-hidden">
      {/* NAVBAR */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#0a0b0f]/95 backdrop-blur-md border-b border-white/5 shadow-xl' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PumpRadarLogo size={36} />
            <span className="font-bold text-lg tracking-tight">PumpRadar</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#signals" className="hover:text-white transition-colors">Signals</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => navigate('/auth/login')}
              className="text-sm text-slate-300 hover:text-white transition-colors px-4 py-2"
              data-testid="nav-login-btn"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/auth/register')}
              className="text-sm bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
              data-testid="nav-register-btn"
            >
              Start Trial
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden text-slate-300" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden bg-[#0d0e14] border-t border-white/5 px-4 py-4 space-y-3">
            <button onClick={() => { navigate('/auth/login'); setMenuOpen(false); }} className="block w-full text-left text-slate-300 py-2">Sign In</button>
            <button onClick={() => { navigate('/auth/register'); setMenuOpen(false); }} className="block w-full text-center bg-emerald-500 text-white font-semibold px-4 py-2 rounded-lg">Start Trial</button>
            
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        {/* Glow orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="mx-auto mb-5 flex max-w-4xl flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-300 backdrop-blur-sm">
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
              <Radio className="h-3.5 w-3.5 animate-pulse" />
              Live now
            </span>
            <span>Last refresh {formatRelativeShort(lastUpdated)}</span>
            <span className="hidden sm:inline text-white/20">•</span>
            <span>{coinsAnalyzed} coins scanned</span>
            <span className="hidden sm:inline text-white/20">•</span>
            <span>Fear & Greed {fearGreedLabel}</span>
            <span className="hidden sm:inline text-white/20">•</span>
            <span className="inline-flex items-center gap-1 text-sky-400">
              <Send className="h-3.5 w-3.5" />
              {telegramHeadline}
            </span>
          </div>

          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-4 py-2 rounded-full mb-8">
            <Activity className="h-3 w-3" />
            AI Active — 100+ coins analyzed hourly
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            Real-Time{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
              Manipulation
            </span>
            <br />
            Intelligence
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            PumpRadar tracks coordinated meme-coin moves using CoinGecko, Telegram source behavior, social-momentum data, and AI refinement when provider access is available
            to surface early hype, execution traps, and dump risk before the crowd gets hurt.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/auth/register')}
              className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-8 py-4 rounded-xl text-base transition-all hover:shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5"
              data-testid="hero-cta-btn"
            >
              <Zap className="h-5 w-5" />
              Start 7-Day Trial
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate('/auth/login')}
              className="flex items-center justify-center gap-2 border border-white/10 hover:border-white/20 text-white font-semibold px-8 py-4 rounded-xl text-base transition-all hover:-translate-y-0.5"
              data-testid="hero-login-btn"
            >
              I have an account
            </button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-slate-400">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Start your free 7-day trial</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Full access to Pro features</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Secure payment via Stripe</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Cancel before billing, anytime</span>
          </div>
        </div>
      </section>

      {/* LIVE SIGNALS PREVIEW */}
      <section id="signals" className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Live AI Signals</h2>
            <p className="text-slate-400">
              {signalsLoading ? 'Loading current market intelligence...' : 'Live manipulation-monitoring snapshots from the latest scan — open an account for full access'}
            </p>
          </div>

          <div className="mb-5 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
            <span className="inline-flex items-center gap-2 font-semibold text-amber-300">
              <Flame className="h-4 w-4" />
              Market Heat
            </span>
            {signals.map((signal) => (
              <button
                key={`heat-${signal.symbol}`}
                type="button"
                onClick={() => handlePreviewSignalClick(signal)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 transition hover:border-white/20 hover:bg-white/10"
              >
                <span className="text-slate-400">{signal.symbol}</span>
                <span className={`ml-2 font-bold ${signal.type === 'pump' ? 'text-emerald-400' : 'text-red-400'}`}>{signal.strength}%</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {signals.map((signal) => (
              <button
                key={signal.symbol}
                type="button"
                onClick={() => handlePreviewSignalClick(signal)}
                className="relative rounded-2xl bg-[#13141a] border border-white/5 p-5 overflow-hidden hover:border-white/10 transition-all text-left hover:-translate-y-0.5 cursor-pointer group"
                data-testid={`landing-signal-${signal.symbol}`}
              >
                <div className={`absolute top-0 left-0 w-1 h-full ${signal.type === 'pump' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <div className="absolute right-4 top-4 h-24 w-24 rounded-full bg-white/5 blur-2xl transition-opacity duration-300 group-hover:opacity-100 opacity-50" />
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-lg">{signal.symbol}</div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getSignalState(signal).tone}`}>
                        {getSignalState(signal).label}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">{signal.name}</div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${signal.type === 'pump' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                    {signal.type === 'pump' ? 'PUMP' : 'DUMP'}
                  </span>
                </div>
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">Signal Strength</span>
                    <span className="font-semibold">{signal.strength}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${signal.type === 'pump' ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${signal.strength}%` }} />
                  </div>
                </div>
                <p className="text-xs text-slate-400 mb-3">{signal.reason}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/5 rounded-lg p-2 text-center">
                    <div className="text-xs text-slate-500">1h</div>
                    <div className={`text-sm font-bold ${signal.type === 'pump' ? 'text-emerald-400' : 'text-red-400'}`}>{signal.change1h}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 text-center">
                    <div className="text-xs text-slate-500">24h</div>
                    <div className={`text-sm font-bold ${signal.type === 'pump' ? 'text-emerald-400' : 'text-red-400'}`}>{signal.change24h}</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between pt-3 border-t border-white/5 text-xs text-slate-500">
                  <span>Updated {formatRelativeShort(signal.updatedAt || lastUpdated)}</span>
                  <span>{hasStoredToken ? 'Open coin analysis' : 'Unlock full signal access'}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="text-center mt-8">
            <button
              onClick={() => navigate('/auth/register')}
              className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-semibold text-sm transition-colors"
              data-testid="see-all-signals-btn"
            >
              See all signals — Register for free
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-16 px-4 bg-[#0d0e14]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Everything you need for smart trading</h2>
            <p className="text-slate-400">Real data + AI = real market advantage</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div key={i} className="rounded-2xl bg-[#13141a] border border-white/5 p-5 hover:border-white/10 transition-all">
                <div className={`w-11 h-11 ${f.bg} rounded-xl flex items-center justify-center ${f.color} mb-4`}>
                  {f.icon}
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Simple and transparent pricing</h2>
            <p className="text-slate-400">Start free, upgrade when you're ready</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan, i) => (
              <div
                key={i}
                className={`relative rounded-2xl p-6 flex flex-col ${plan.variant === 'primary' ? 'bg-gradient-to-b from-emerald-500/10 to-[#13141a] border border-emerald-500/30 scale-105' : 'bg-[#13141a] border border-white/5'}`}
              >
                {plan.badge && (
                  <span className={`absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full ${plan.variant === 'primary' ? 'bg-emerald-500 text-white' : 'bg-slate-600 text-white'}`}>
                    {plan.badge}
                  </span>
                )}
                <div className="mb-4">
                  <div className="text-sm text-slate-400 mb-1">{plan.name}</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold">{plan.price === '0' ? 'Free' : `$${plan.price}`}</span>
                    <span className="text-slate-500 text-sm">{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-2 flex-1 mb-6">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-slate-300">
                      <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('/auth/register')}
                  className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all ${plan.variant === 'primary' ? 'bg-emerald-500 hover:bg-emerald-400 text-white hover:shadow-lg hover:shadow-emerald-500/25' : 'border border-white/10 hover:border-white/20 text-white'}`}
                  data-testid={`pricing-cta-${i}`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-slate-500 mt-6">Secure payments via Stripe · Cancel anytime</p>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/5 rounded-2xl mb-6">
            <PumpRadarLogo size={64} />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Start trading smarter
          </h2>
          <p className="text-slate-400 mb-8 text-lg">
            Start your free 7-day trial with full Pro access, secure Stripe checkout, and cancel anytime before billing.
          </p>
          <button
            onClick={() => navigate('/auth/register')}
            className="inline-flex items-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-10 py-4 rounded-xl text-lg transition-all hover:shadow-xl hover:shadow-emerald-500/25 hover:-translate-y-0.5"
            data-testid="final-cta-btn"
          >
            <Zap className="h-5 w-5" />
            Start Your Free 7-Day Trial
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <PumpRadarLogo size={28} />
            <span className="font-bold text-sm">PumpRadar</span>
          </div>
          <p className="text-xs text-slate-500">Signals are not financial advice. Invest responsibly.</p>
          <div className="flex gap-4 text-xs text-slate-500">
            <button onClick={() => navigate('/auth/login')} className="hover:text-white transition-colors">Login</button>
            <button onClick={() => navigate('/auth/register')} className="hover:text-white transition-colors">Register</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
