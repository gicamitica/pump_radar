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
│   │   ├── app/router/    # AppRouter with OAuth callback handling
│   │   ├── modules/
│   │   │   ├── crypto/    # Signals, AI Chat, Super Admin
│   │   │   └── auth/      # Login, Register, AuthCallback
│   │   └── shared/
│   └── .env
└── test_reports/
```

---

## Implemented Features (Completed)

### Authentication ✅
- [x] Email/password registration and login with JWT
- [x] Google OAuth via Emergent-managed auth
- [x] Google login button on Login and Register pages
- [x] AuthCallback handler for OAuth session exchange
- [x] Email verification flow (via Resend)
- [x] Password reset flow
- [x] Token refresh

### Crypto Signals (AI-powered) ✅
- [x] **Scientific Algorithm:** Quantitative scoring with:
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
- [x] Specific signal data mentioned (coins, scores)
- [x] English-only responses
- [x] Helpful, concise, professional tone

### Super Admin Page ✅
- [x] Hidden URL at `/super-admin`
- [x] Protected by admin role check
- [x] Shows "Access Denied" for non-admins
- [x] User management table
- [x] Grant free subscriptions (1 month / 1 year)
- [x] Delete user accounts
- [x] User statistics dashboard

### Dashboard & UI ✅
- [x] Signals Dashboard at /dashboard
- [x] PUMP and DUMP signal tabs
- [x] AI Market Intelligence summary
- [x] Countdown to next refresh
- [x] Signal cards with scientific reasoning
- [x] Coin detail pages with charts
- [x] Subscription badge in header

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
- `GET /api/crypto/coin/{symbol}` - Coin detail with AI analysis
- `POST /api/ai/chat` - AI customer service

### Admin
- `GET /api/admin/users` - List all users (admin only)
- `PATCH /api/admin/users/{id}` - Update user subscription
- `DELETE /api/admin/users/{id}` - Delete user

---

## Test Credentials
- **Admin:** viorel.mina@gmail.com / admin123
- **Super Admin URL:** /super-admin

---

## Remaining Work

### P1 (Important)
- [ ] Coin detail chart implementation (recharts)
- [ ] Historical signals view

### P2 (Nice to have)
- [ ] Dark mode default
- [ ] Email notifications for high-strength signals
- [ ] Watchlist feature
- [ ] Telegram bot integration

### P3 (Backlog)
- [ ] Apple Auth (requires paid Apple Developer account)
- [ ] LunarCrush full integration (requires paid API)
- [ ] Mobile app

---

## Changelog

### 2026-03-19 (Current Session)
- ✅ Added Google OAuth authentication (Emergent-managed)
- ✅ Implemented scientific AI algorithm for pump/dump detection
- ✅ Enhanced AI customer service with market context
- ✅ Protected Super Admin page with role-based access
- ✅ Updated AvatarMenu to link to /super-admin
- ✅ All 13 backend tests passing (100%)
- ✅ Frontend verified working

### Previous Sessions
- Initial implementation with Katalyst template
- JWT authentication
- Stripe integration
- Email verification flow
- Signal detection system
- Dashboard UI
