# PumpRadar - Product Requirements Document

## Overview
PumpRadar is an AI-powered crypto pump/dump signal detection platform built with React (Katalyst template) + FastAPI + MongoDB.

**Production URL:** https://pump.arbitrajz.com

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
│   ├── server.py          # FastAPI app (auth, crypto, payments, AI, scheduler)
│   └── .env               # API keys & config
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── modules/
│   │   │   ├── crypto/
│   │   │   │   ├── ui/pages/
│   │   │   │   │   ├── HistoryPage.tsx
│   │   │   │   │   ├── WatchlistPage.tsx
│   │   │   │   │   └── ...
│   │   │   │   └── ui/components/
│   │   │   │       └── AccuracyTracker.tsx  # NEW
│   │   │   └── auth/
│   │   └── shared/
│   └── .env
└── test_reports/
```

---

## Implemented Features (All Complete)

### PRO Daily Market Emails ✅ (NEW)
- [x] **London Market Open (08:00 UTC)** - Email with top 5 PUMP + top 3 DUMP candidates
- [x] **NYSE Market Open (14:30 UTC)** - Email with best signal candidates
- [x] Beautiful HTML email template with:
  - Fear & Greed Index
  - Signal strength table
  - AI Market Summary
  - Direct link to dashboard
- [x] Only sent to Pro subscribers with daily_market_emails enabled
- [x] Scheduler jobs: `london_market_email`, `nyse_market_email`

### Signal Accuracy Tracker ✅ (NEW)
- [x] Tracks if PUMP/DUMP predictions came true after 1h, 4h, 24h
- [x] Verifies predictions against real CoinGecko price data
- [x] Calculates accuracy percentages per timeframe
- [x] `/api/crypto/accuracy` endpoint returns aggregated stats
- [x] **AccuracyTracker component** on dashboard with:
  - Visual gauges for each timeframe
  - Separate PUMP/DUMP accuracy stats
  - Sample count for data reliability
  - Average overall accuracy badge
- [x] Scheduled hourly via `accuracy_tracker` job

### Authentication ✅
- [x] Email/password registration and login with JWT
- [x] Google OAuth via Emergent-managed auth
- [x] Email verification flow (via Resend)
- [x] Password reset flow

### Crypto Signals (AI-powered) ✅
- [x] **Scientific Algorithm** with quantitative scoring
- [x] Volume/Market Cap ratio analysis
- [x] Momentum divergence (1h vs 24h comparison)
- [x] Fear & Greed Index integration
- [x] AI analysis via Gemini 2.5 Flash

### AI Customer Service ✅
- [x] Intelligent chat powered by Gemini
- [x] Real-time market context
- [x] English-only responses

### Super Admin Page ✅
- [x] Hidden URL at `/super-admin`
- [x] Protected by admin role
- [x] User management

### Signal History ✅
- [x] `/history` page with chart and timeline views
- [x] Last 48 hours of signal data

### Watchlist Feature ✅
- [x] `/watchlist` page with coin management
- [x] Per-coin alert thresholds

### Email Alerts ✅
- [x] Alerts for strong signals (≥85% strength)
- [x] Watchlist-specific alerts

### UI/UX ✅
- [x] Dark mode as default
- [x] Updated sidebar navigation

---

## Scheduler Jobs

| Job ID | Schedule | Description |
|--------|----------|-------------|
| `crypto_signals` | Every 1 hour | Fetch and analyze crypto signals |
| `accuracy_tracker` | Every 1 hour | Verify past predictions against real prices |
| `london_market_email` | 08:00 UTC | Send daily email at London market open |
| `nyse_market_email` | 14:30 UTC | Send daily email at NYSE market open |

---

## API Endpoints

### Crypto
- `GET /api/crypto/signals` - Get latest signals
- `GET /api/crypto/history` - Historical signal summary
- `GET /api/crypto/snapshots` - Detailed signal snapshots
- `GET /api/crypto/accuracy` - **NEW** Signal accuracy statistics

### User Settings
- `GET /api/user/watchlist` - Get user watchlist
- `POST /api/user/watchlist/add` - Add coin
- `DELETE /api/user/watchlist/{symbol}` - Remove coin
- `GET /api/user/alerts` - Get alert settings
- `POST /api/user/alerts` - Update alert settings
- `GET /api/user/subscription` - Get subscription status

### Admin
- `GET /api/admin/users` - List all users
- `PATCH /api/admin/users/{id}` - Update subscription
- `DELETE /api/admin/users/{id}` - Delete user

---

## Test Results (Latest - Iteration 4)

### Backend: 100% (15/15 tests)
- All new PRO features verified
- Accuracy endpoint working
- All scheduler jobs configured
- Fixed timezone bug in subscription endpoint

---

## Test Credentials
- **Admin:** viorel.mina@gmail.com / admin123
- **Super Admin URL:** /super-admin

---

## Remaining Work (Backlog)

### P3 (Nice to have)
- [ ] Apple Auth (requires paid Apple Developer account)
- [ ] LunarCrush full integration (requires paid API)
- [ ] Telegram bot integration
- [ ] Mobile app

---

## Changelog

### 2026-03-19 (Current Session - PRO Features)
- ✅ Added Signal Accuracy Tracker (1h/4h/24h verification)
- ✅ Added Daily Market Open Emails (London 08:00 UTC, NYSE 14:30 UTC)
- ✅ Created AccuracyTracker component with visual gauges
- ✅ Added scheduler jobs for email and accuracy tracking
- ✅ Fixed timezone bug in subscription endpoint
- ✅ All 15 backend tests passing (100%)

### Previous
- Signal History page
- Watchlist feature
- Email Alerts system
- Dark mode default
- Google OAuth
- Scientific AI algorithm
