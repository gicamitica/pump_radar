import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Brain, Zap, Clock, Shield, ChevronRight, Check, Star, BarChart3, Activity, Menu, X } from 'lucide-react';

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
  { icon: <Brain className="h-6 w-6" />, title: 'AI Gemini Analysis', desc: 'AI-filtered signals from 100+ cryptocurrencies in real-time', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { icon: <Clock className="h-6 w-6" />, title: 'Hourly Updates', desc: 'Fresh data every hour from CoinGecko + Fear & Greed Index', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { icon: <TrendingUp className="h-6 w-6" />, title: 'PUMP Signals', desc: 'Identify coins with positive momentum before the big move', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { icon: <TrendingDown className="h-6 w-6" />, title: 'DUMP Signals', desc: 'Avoid losses — detect selling pressure early', color: 'text-red-400', bg: 'bg-red-500/10' },
  { icon: <BarChart3 className="h-6 w-6" />, title: 'Social Data', desc: 'Social volume, sentiment and Galaxy Score from LunarCrush', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { icon: <Shield className="h-6 w-6" />, title: 'Risk Rating', desc: 'Each signal comes with risk level and AI confidence score', color: 'text-pink-400', bg: 'bg-pink-500/10' },
];

const PLANS = [
  {
    name: 'Free Trial',
    price: '0',
    period: '24 hours',
    features: ['First 3 PUMP signals', 'First 3 DUMP signals', 'AI Summary', '24h access'],
    cta: 'Try Free',
    variant: 'outline',
  },
  {
    name: 'Pro Monthly',
    price: '29.99',
    period: '/month',
    features: ['All PUMP & DUMP signals', 'Complete AI analysis', 'Live LunarCrush data', 'Hourly updates', 'Priority support'],
    cta: 'Subscribe Monthly',
    variant: 'primary',
    badge: 'Popular',
  },
  {
    name: 'Pro Annual',
    price: '199.99',
    period: '/year',
    features: ['Everything in Pro Monthly', 'Save $160/year', '12 month access', 'First access to new features'],
    cta: 'Subscribe Annual',
    variant: 'outline',
    badge: '-44%',
  },
];

const MOCK_SIGNALS = [
  { symbol: 'AKT', name: 'Akash Network', type: 'pump', strength: 85, change1h: '+1.43%', change24h: '+1.25%', confidence: 'Strong', reason: 'Trending CoinGecko + increased volume' },
  { symbol: 'SOL', name: 'Solana', type: 'pump', strength: 78, change1h: '+2.1%', change24h: '+5.3%', confidence: 'Strong', reason: 'Positive momentum all timeframes' },
  { symbol: 'LUNA', name: 'Terra Luna', type: 'dump', strength: 72, change1h: '-2.1%', change24h: '-8.3%', confidence: 'Medium', reason: 'Strong selling pressure' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // If user already has a token, redirect to dashboard
    const token = localStorage.getItem('pumpradar_auth_token');
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
  }, []);

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
              Try Free
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
            <button onClick={() => { navigate('/auth/register'); setMenuOpen(false); }} className="block w-full text-center bg-emerald-500 text-white font-semibold px-4 py-2 rounded-lg">Try Free</button>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        {/* Glow orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-4 py-2 rounded-full mb-8">
            <Activity className="h-3 w-3" />
            AI Active — 100+ coins analyzed hourly
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            AI-Powered{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
              PUMP & DUMP
            </span>
            <br />
            Signals
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            PumpRadar analyzes data from CoinGecko and LunarCrush with Gemini AI to detect opportunities
            and risks in the crypto market — updated every hour.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/auth/register')}
              className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-8 py-4 rounded-xl text-base transition-all hover:shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5"
              data-testid="hero-cta-btn"
            >
              <Zap className="h-5 w-5" />
              Try Free for 24h
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

          <p className="text-sm text-slate-500 mt-4">No credit card required · 24h free trial</p>
        </div>
      </section>

      {/* LIVE SIGNALS PREVIEW */}
      <section id="signals" className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Live AI Signals</h2>
            <p className="text-slate-400">Example signals generated now — sign in for full access</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MOCK_SIGNALS.map((signal) => (
              <div
                key={signal.symbol}
                className="relative rounded-2xl bg-[#13141a] border border-white/5 p-5 overflow-hidden hover:border-white/10 transition-all"
              >
                <div className={`absolute top-0 left-0 w-1 h-full ${signal.type === 'pump' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="font-bold text-lg">{signal.symbol}</div>
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
              </div>
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
            Register in 30 seconds and get free 24h access to all AI signals.
          </p>
          <button
            onClick={() => navigate('/auth/register')}
            className="inline-flex items-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-10 py-4 rounded-xl text-lg transition-all hover:shadow-xl hover:shadow-emerald-500/25 hover:-translate-y-0.5"
            data-testid="final-cta-btn"
          >
            <Zap className="h-5 w-5" />
            Create Free Account
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
