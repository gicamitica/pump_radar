# PumpRadar - PRD (Product Requirements Document)

## Overview
PumpRadar este un dashboard AI pentru semnale crypto Pump & Dump, construit pe template-ul Katalyst (React + Tailwind admin template de pe ThemeForest).

**URL Preview:** https://a580d9c6-1b10-4caa-81ba-c19407398a1c.preview.emergentagent.com

---

## Architecture

### Stack
- **Frontend:** Vite + React 19 + TypeScript (Katalyst template), Tailwind CSS v4
- **Backend:** FastAPI (Python), port 8001
- **Database:** MongoDB
- **AI:** Gemini 2.5 Flash (via Emergent LLM key)
- **Payments:** Stripe (test mode)
- **Email:** Resend
- **Data Sources:** CoinGecko (free), Fear & Greed Index (alternative.me), LunarCrush (MCP only - REST API requires paid plan)

### File Structure
```
/app/
├── backend/
│   ├── server.py          # Main FastAPI app (auth, crypto, payments, scheduler)
│   └── .env               # API keys & config
├── frontend/              # Katalyst template (Vite/TypeScript)
│   ├── src/modules/
│   │   ├── crypto/        # NEW: Pump/Dump signals module
│   │   │   ├── ui/pages/SignalsDashboard.tsx
│   │   │   ├── ui/pages/SubscriptionPage.tsx
│   │   │   ├── ui/pages/SubscriptionSuccess.tsx
│   │   │   └── ui/routes/
│   │   ├── home/          # Modified: root redirects to /dashboard
│   │   └── auth/          # Modified: uses /api/auth/* endpoints
│   └── .env               # Vite config
```

---

## Implemented Features

### Authentication (JWT + Resend)
- [x] Registration with email + password
- [x] Email verification via Resend (token sent on registration)
- [x] Login with JWT (access + refresh tokens)
- [x] Forgot password + reset password flow
- [x] Token refresh
- [x] Protected routes

### Crypto Signals (AI-powered)
- [x] Hourly data fetching via APScheduler (CoinGecko top 100 by volume)
- [x] Fear & Greed Index integration (alternative.me - free)
- [x] CoinGecko trending coins integration
- [x] AI analysis via Gemini 2.5 Flash (pump/dump detection)
- [x] Signal storage in MongoDB (last 48 snapshots)
- [x] REST endpoint: GET /api/crypto/signals
- [x] Manual refresh endpoint: POST /api/crypto/refresh
- [x] History endpoint: GET /api/crypto/history

### Dashboard UI (Katalyst-based)
- [x] Signals Dashboard at /dashboard
- [x] PUMP signals tab with signal cards
- [x] DUMP signals tab with signal cards
- [x] AI Market Summary card
- [x] Countdown to next refresh
- [x] Stats row (pump count, dump count, coins analyzed, last updated)
- [x] Access control (blurred cards for non-Pro users)
- [x] AnnouncementCard customized for PumpRadar Pro upgrade

### Subscriptions (Stripe)
- [x] Free trial (24h, granted on registration)
- [x] Monthly plan (€29.99/month)
- [x] Annual plan (€199.99/year)
- [x] Stripe Checkout integration
- [x] Payment status polling
- [x] Stripe webhook handler
- [x] Subscription page at /subscription with plan cards
- [x] Subscription success page

- [x] Landing page publică la `/` cu hero, features, pricing preview, CTAs
- [x] Redirect `/` → `/dashboard` pentru utilizatori autentificați deja
- [x] Redirect după register/login → `/dashboard` (nu `/`)
- [x] Page title: "PumpRadar - AI Crypto Signals"
- [x] Sidebar brand: "PumpRadar"
- [x] Navigation i18n updated
- [x] Demo credentials removed from login

---

## API Keys Configured
- Resend: `re_8hUYSD82_991sVeaEzbqBimS1beS78r4g`
- LunarCrush: `nliqvkush13obz1m3k1xju5jfmeqtu8rg4piyu5j` (MCP only - needs Individual subscription for REST API)
- Gemini: Emergent LLM key (universal)
- Stripe: `sk_test_emergent` (test mode)

---

## Known Limitations
- LunarCrush REST API requires Individual+ subscription (key is MCP-only)
  → Currently using CoinGecko + Fear/Greed + Trending as data sources
  → When LunarCrush REST API is upgraded, social data will be added automatically

---

## Prioritized Backlog

### P0 (Critical - Next Sprint)
- [ ] LunarCrush API upgrade to get social volume/sentiment data
- [ ] Email verification enforcement before login
- [ ] Stripe live keys (when ready for production)

### P1 (Important)
- [ ] Dark mode default for crypto trading aesthetic
- [ ] Signal alert notifications (email on high-strength signals)
- [ ] Historical signals chart (24h trend of pump/dump counts)
- [ ] User profile/settings page

### P2 (Nice to have)
- [ ] Watchlist (save favorite coins)
- [ ] Mobile app (React Native)
- [ ] Telegram bot integration for signal alerts
- [ ] Admin panel for monitoring system health

---

## Dates
- Initial implementation: 2026-03-19

## Update: 2026-03-19 (Round 2)

### Implemented:
- Landing page publică la / cu hero, semnale preview, pricing, CTAs
- Auth flow fix: register/login redirects la /dashboard
- RegisterForm reconectat la backend real
- Navigation sidebar curățat: doar PumpRadar items (Dashboard, PUMP, DUMP, AI Chat, Subscription)
- Logo vectorial PumpRadar (geometric SVG - triunghi în cerc cu puncte busolă)  
- Branding Branding.tsx actualizat cu noul logo + gradient text
- Language switcher eliminat din topbar
- SubscriptionBadge pulsant în topbar (Trial Free / Pro)
- AvatarMenu redone: Dashboard, Abonament, AI Asistent, Admin (dacă e admin), Deconectare
- AI Chat page (/ai-chat) - customer service Gemini în română
- Admin Panel (/admin) - cu user management, edit subscription, delete
- Coin Detail page (/coin/:symbol) - grafic preț+volum, AI analysis, exchanges DEX/CEX
- Signal cards clickable → deschide coin detail în tab nou
- Backend: /api/ai/chat, /api/crypto/coin/:symbol, /api/admin/* endpoints
- owner@pumpradar.ro promovat la admin
