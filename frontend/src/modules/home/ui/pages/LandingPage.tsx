import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Brain, Zap, Clock, Shield, ChevronRight, Check, Star, BarChart3, Activity, Menu, X } from 'lucide-react';

const FEATURES = [
  { icon: <Brain className="h-6 w-6" />, title: 'AI Gemini Analysis', desc: 'Semnale filtrate de AI din 100+ monede crypto în timp real', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { icon: <Clock className="h-6 w-6" />, title: 'Actualizare Orară', desc: 'Date proaspete în fiecare oră din CoinGecko + Fear & Greed Index', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { icon: <TrendingUp className="h-6 w-6" />, title: 'PUMP Signals', desc: 'Identifică monedele cu momentum pozitiv înainte de mișcarea mare', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { icon: <TrendingDown className="h-6 w-6" />, title: 'DUMP Signals', desc: 'Evită pierderile — detectează presiunea de vânzare din timp', color: 'text-red-400', bg: 'bg-red-500/10' },
  { icon: <BarChart3 className="h-6 w-6" />, title: 'Social Data', desc: 'Volum social, sentiment și Galaxy Score din LunarCrush', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { icon: <Shield className="h-6 w-6" />, title: 'Risk Rating', desc: 'Fiecare semnal vine cu nivel de risc și grad de încredere AI', color: 'text-pink-400', bg: 'bg-pink-500/10' },
];

const PLANS = [
  {
    name: 'Trial Gratuit',
    price: '0',
    period: '24 ore',
    features: ['Primele 3 semnale PUMP', 'Primele 3 semnale DUMP', 'Rezumat AI', 'Acces 24h'],
    cta: 'Încearcă Gratuit',
    variant: 'outline',
  },
  {
    name: 'Pro Lunar',
    price: '29.99',
    period: '/lună',
    features: ['Toate semnalele PUMP & DUMP', 'Analiză AI completă', 'Date LunarCrush live', 'Actualizare orară', 'Suport prioritar'],
    cta: 'Abonare Lunar',
    variant: 'primary',
    badge: 'Popular',
  },
  {
    name: 'Pro Anual',
    price: '199.99',
    period: '/an',
    features: ['Tot ce include Pro Lunar', 'Economisești €160/an', 'Acces 12 luni', 'Funcții noi în primă instanță'],
    cta: 'Abonare Anual',
    variant: 'outline',
    badge: '-44%',
  },
];

const MOCK_SIGNALS = [
  { symbol: 'AKT', name: 'Akash Network', type: 'pump', strength: 85, change1h: '+1.43%', change24h: '+1.25%', confidence: 'Puternic', reason: 'Trending CoinGecko + volum crescut' },
  { symbol: 'SOL', name: 'Solana', type: 'pump', strength: 78, change1h: '+2.1%', change24h: '+5.3%', confidence: 'Puternic', reason: 'Momentum pozitiv toate intervalele' },
  { symbol: 'LUNA', name: 'Terra Luna', type: 'dump', strength: 72, change1h: '-2.1%', change24h: '-8.3%', confidence: 'Mediu', reason: 'Presiune de vânzare puternică' },
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
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">PumpRadar</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Funcții</a>
            <a href="#signals" className="hover:text-white transition-colors">Semnale</a>
            <a href="#pricing" className="hover:text-white transition-colors">Prețuri</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => navigate('/auth/login')}
              className="text-sm text-slate-300 hover:text-white transition-colors px-4 py-2"
              data-testid="nav-login-btn"
            >
              Intră în cont
            </button>
            <button
              onClick={() => navigate('/auth/register')}
              className="text-sm bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
              data-testid="nav-register-btn"
            >
              Încearcă Gratuit
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
            <button onClick={() => { navigate('/auth/login'); setMenuOpen(false); }} className="block w-full text-left text-slate-300 py-2">Intră în cont</button>
            <button onClick={() => { navigate('/auth/register'); setMenuOpen(false); }} className="block w-full text-center bg-emerald-500 text-white font-semibold px-4 py-2 rounded-lg">Încearcă Gratuit</button>
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
            AI activ — 100+ monede analizate orar
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            Semnale{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
              PUMP & DUMP
            </span>
            <br />
            generate de AI
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            PumpRadar analizează date din CoinGecko și LunarCrush cu Gemini AI pentru a detecta oportunități
            și riscuri în piața crypto — actualizat în fiecare oră.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/auth/register')}
              className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-8 py-4 rounded-xl text-base transition-all hover:shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5"
              data-testid="hero-cta-btn"
            >
              <Zap className="h-5 w-5" />
              Încearcă Gratuit 24h
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate('/auth/login')}
              className="flex items-center justify-center gap-2 border border-white/10 hover:border-white/20 text-white font-semibold px-8 py-4 rounded-xl text-base transition-all hover:-translate-y-0.5"
              data-testid="hero-login-btn"
            >
              Am deja cont
            </button>
          </div>

          <p className="text-sm text-slate-500 mt-4">Nu necesită card bancar · Trial 24h gratuit</p>
        </div>
      </section>

      {/* LIVE SIGNALS PREVIEW */}
      <section id="signals" className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Semnale AI Live</h2>
            <p className="text-slate-400">Exemplu de semnale generate acum — autentifică-te pentru acces complet</p>
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
                    <span className="text-slate-500">Putere semnal</span>
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
              Vezi toate semnalele — Înregistrează-te gratuit
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-16 px-4 bg-[#0d0e14]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Tot ce ai nevoie pentru trading inteligent</h2>
            <p className="text-slate-400">Date reale + AI = avantaj real în piață</p>
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
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Prețuri simple și transparente</h2>
            <p className="text-slate-400">Începe gratuit, upgradează când ești gata</p>
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
                    <span className="text-3xl font-extrabold">{plan.price === '0' ? 'Gratuit' : `€${plan.price}`}</span>
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
          <p className="text-center text-xs text-slate-500 mt-6">Plăți securizate prin Stripe · Anulare oricând</p>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/10 rounded-2xl mb-6">
            <TrendingUp className="h-8 w-8 text-emerald-400" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Începe să tranzacționezi mai inteligent
          </h2>
          <p className="text-slate-400 mb-8 text-lg">
            Înregistrează-te în 30 de secunde și primești acces gratuit 24h la toate semnalele AI.
          </p>
          <button
            onClick={() => navigate('/auth/register')}
            className="inline-flex items-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-10 py-4 rounded-xl text-lg transition-all hover:shadow-xl hover:shadow-emerald-500/25 hover:-translate-y-0.5"
            data-testid="final-cta-btn"
          >
            <Zap className="h-5 w-5" />
            Creează Cont Gratuit
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center">
              <TrendingUp className="h-3 w-3 text-white" />
            </div>
            <span className="font-bold text-sm">PumpRadar</span>
          </div>
          <p className="text-xs text-slate-500">Semnalele nu constituie sfaturi financiare. Investiți responsabil.</p>
          <div className="flex gap-4 text-xs text-slate-500">
            <button onClick={() => navigate('/auth/login')} className="hover:text-white transition-colors">Login</button>
            <button onClick={() => navigate('/auth/register')} className="hover:text-white transition-colors">Înregistrare</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
