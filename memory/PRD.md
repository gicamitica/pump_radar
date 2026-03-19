# PumpRadar - Product Requirements Document

## Overview
PumpRadar is an AI-powered crypto pump/dump signal detection platform built with React (Katalyst template) + FastAPI + MongoDB.

**Preview URL:** https://crypto-pump-1.preview.emergentagent.com

---

## Architecture

### Tech Stack
- **Frontend:** Vite + React 19 + TypeScript, Tailwind CSS v4, Shadcn UI
- **Backend:** FastAPI (Python), port 8001
- **Database:** MongoDB
- **AI:** Gemini 2.5 Flash (via Emergent LLM key)
- **Payments:** Stripe (test mode)
- **Email:** Resend (domain: arbitrajz.com)
- **Auth:** JWT + Google OAuth (Emergent-managed)
- **Data Sources:** CoinGecko, Fear & Greed Index

### File Structure
```
/app/
├── backend/
│   ├── server.py          # FastAPI app (auth, crypto, payments, AI)
│   └── .env               # API keys & config
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── router/    # AppRouter with OAuth callback
│   │   │   ├── config/    # Navigation config (updated)
│   │   │   └── providers/ # ThemeProvider (dark mode default)
│   │   ├── modules/
│   │   │   ├── crypto/
│   │   │   │   └── ui/pages/
│   │   │   │       ├── HistoryPage.tsx    # NEW
│   │   │   │       ├── WatchlistPage.tsx  # NEW
│   │   │   │       └── ...
│   │   │   └── auth/
│   │   └── shared/
│   └── .env
└── test_reports/
```

---

## Implemented Features (All Complete)

### Authentication ✅
- [x] Email/password registration and login with JWT
- [x] Google OAuth via Emergent-managed auth
- [x] Google login button on Login and Register pages
- [x] AuthCallback handler for OAuth session exchange
- [x] Email verification flow (via Resend)
- [x] Password reset flow
- [x] Token refresh

### Crypto Signals (AI-powered) ✅
- [x] **Scientific Algorithm** with quantitative scoring:
  - Volume/Market Cap ratio analysis (abnormal volume detection)
  - Momentum divergence (1h vs 24h rate comparison)
  - Trend alignment scoring
  - Sentiment correlation (Fear & Greed Index)
- [x] Hourly data fetching via APScheduler
- [x] Fear & Greed Index integration
- [x] CoinGecko trending coins
- [x] AI analysis via Gemini 2.5 Flash
- [x] Scientific reasoning in signal explanations

### AI Customer Service ✅
- [x] Intelligent chat powered by Gemini
- [x] Real-time market context in responses
- [x] Specific signal data mentioned (coins, scores, F&G index)
- [x] English-only responses
- [x] Helpful, concise, professional tone

### Super Admin Page ✅
- [x] Hidden URL at `/super-admin`
- [x] Protected by admin role check (returns 401 without auth)
- [x] Shows "Access Denied" for non-admins
- [x] User management table
- [x] Grant free subscriptions (1 month / 1 year)
- [x] Delete user accounts
- [x] User statistics dashboard

### Signal History ✅ (NEW)
- [x] `/history` page with chart and timeline views
- [x] Last 48 hours of signal data
- [x] Aggregated stats (total pumps/dumps, avg per hour)
- [x] Expandable timeline entries with market summaries
- [x] `/api/crypto/history` endpoint
- [x] `/api/crypto/snapshots` endpoint with full detail

### Watchlist Feature ✅ (NEW)
- [x] `/watchlist` page with coin management
- [x] Add/remove coins from watchlist
- [x] Per-coin alert thresholds
- [x] Toggle alerts for individual coins
- [x] Persistent storage (localStorage + MongoDB)
- [x] API endpoints: `/api/user/watchlist`, `/api/user/watchlist/add`, `/api/user/watchlist/{symbol}`

### Email Alerts ✅ (NEW)
- [x] Alert settings in user profile
- [x] Email alerts for strong signals (≥85% strength)
- [x] Watchlist-specific alerts with custom thresholds
- [x] Global alerts for Pro subscribers
- [x] Beautiful HTML email templates
- [x] `/api/user/alerts` endpoint

### UI/UX ✅
- [x] **Dark mode as default** (ThemeProvider updated)
- [x] Updated sidebar navigation with History & Watchlist
- [x] Signal cards with scientific reasoning
- [x] Coin detail pages with recharts
- [x] Subscription badge in header
- [x] Light/Dark/System toggle

### Dashboard & UI ✅
- [x] Signals Dashboard at /dashboard
- [x] PUMP and DUMP signal tabs
- [x] AI Market Intelligence summary
- [x] Countdown to next refresh
- [x] Signal cards with scientific reasoning
- [x] Coin detail pages with charts

### Subscriptions (Stripe) ✅
- [x] Free trial (24h)
- [x] Pro Monthly ($29.99)
- [x] Pro Annual ($199.99)
- [x] Stripe Checkout integration

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/google` - Google OAuth exchange
- `POST /api/auth/verify-email` - Verify email token
- `GET /api/auth/me` - Get current user

### Crypto
- `GET /api/crypto/signals` - Get latest signals
- `GET /api/crypto/history` - Historical signal summary (auth required)
- `GET /api/crypto/snapshots` - Detailed signal snapshots (public)
- `GET /api/crypto/coin/{symbol}` - Coin detail with AI analysis
- `POST /api/ai/chat` - AI customer service

### User Settings
- `GET /api/user/watchlist` - Get user watchlist
- `POST /api/user/watchlist/add` - Add coin to watchlist
- `DELETE /api/user/watchlist/{symbol}` - Remove coin
- `GET /api/user/alerts` - Get alert settings
- `POST /api/user/alerts` - Update alert settings

### Admin
- `GET /api/admin/users` - List all users (admin only)
- `PATCH /api/admin/users/{id}` - Update user subscription
- `DELETE /api/admin/users/{id}` - Delete user

---

## Test Results (Latest)

### Backend: 100% (14/14 tests)
- All endpoints verified working
- Signal data: 8 PUMP, 4 DUMP signals
- Fear & Greed: 23 (Extreme Fear)
- Coins analyzed: 95

### Frontend: 90%
- Dark mode default: ✅
- Google OAuth button: ✅
- Navigation updated: ✅
- (Cloudflare rate limiting affected full e2e)

---

## Test Credentials
- **Admin:** viorel.mina@gmail.com / admin123
- **Super Admin URL:** /super-admin

---

## Remaining Work (Backlog)

### P3 (Nice to have)
- [ ] Apple Auth (requires paid Apple Developer account)
- [ ] LunarCrush full integration (requires paid API)
- [ ] Mobile app
- [ ] Telegram bot integration
- [ ] Push notifications

---

## Changelog

### 2026-03-19 (Current Session - Major Update)
- ✅ Added Signal History page with charts and timeline
- ✅ Added Watchlist feature with per-coin alerts
- ✅ Implemented Email Alerts system for strong signals
- ✅ Set Dark mode as default theme
- ✅ Updated sidebar navigation with new pages
- ✅ All 14 backend tests passing (100%)
- ✅ Google OAuth working
- ✅ Scientific AI algorithm verified

### Previous Sessions
- Google OAuth authentication
- JWT authentication
- Stripe integration
- Email verification flow
- Signal detection system
- Dashboard UI
- Super Admin page
