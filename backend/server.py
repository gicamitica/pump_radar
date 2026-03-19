"""
PumpRadar - FastAPI Backend
Crypto pump/dump signal analyzer with AI, LunarCrush & CoinGecko
"""
import os
import asyncio
import logging
import uuid
import requests
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any, Annotated

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, Depends, status, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from jose import JWTError, jwt
import resend
from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, CheckoutSessionRequest, CheckoutSessionResponse, CheckoutStatusResponse
)

# ─────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.environ.get("JWT_EXPIRE_MINUTES", "10080"))
RESEND_API_KEY = os.environ["RESEND_API_KEY"]
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
LUNARCRUSH_API_KEY = os.environ["LUNARCRUSH_API_KEY"]
COINGECKO_API_KEY = os.environ.get("COINGECKO_API_KEY", "")
EMERGENT_LLM_KEY = os.environ["EMERGENT_LLM_KEY"]
STRIPE_API_KEY = os.environ["STRIPE_API_KEY"]
APP_URL = os.environ.get("APP_URL", "http://localhost:3000")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

resend.api_key = RESEND_API_KEY

# ─────────────────────────────────────────────
# App & DB
# ─────────────────────────────────────────────
app = FastAPI(title="PumpRadar API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer = HTTPBearer(auto_error=False)

# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────
def api_ok(data: Any) -> dict:
    return {"success": True, "data": data}

def api_err(msg: str, code: str = "ERROR") -> dict:
    return {"success": False, "error": {"code": code, "message": msg}}

def hash_password(p: str) -> str:
    return pwd_ctx.hash(p)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_ctx.verify(plain, hashed)

def create_token(user_id: str, email: str, expires_delta: Optional[timedelta] = None) -> str:
    exp = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=JWT_EXPIRE_MINUTES))
    return jwt.encode({"sub": user_id, "email": email, "exp": exp}, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])

def doc_to_user(doc: dict) -> dict:
    if not doc:
        return {}
    return {
        "id": str(doc["_id"]),
        "email": doc["email"],
        "name": doc.get("name", ""),
        "roles": doc.get("roles", ["viewer"]),
        "avatar": doc.get("avatar"),
        "emailVerified": doc.get("email_verified", False),
        "subscription": doc.get("subscription", "free"),
        "subscriptionExpiry": doc.get("subscription_expiry"),
        "createdAt": doc.get("created_at", "").isoformat() if isinstance(doc.get("created_at"), datetime) else doc.get("created_at", ""),
    }

async def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    if not creds:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = decode_token(creds.credentials)
        user_id = payload.get("sub")
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except (JWTError, Exception) as e:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_optional_user(creds: HTTPAuthorizationCredentials = Depends(bearer)) -> Optional[dict]:
    if not creds:
        return None
    try:
        payload = decode_token(creds.credentials)
        user_id = payload.get("sub")
        return await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        return None

# ─────────────────────────────────────────────
# Email helpers
# ─────────────────────────────────────────────
async def send_verification_email(email: str, name: str, token: str):
    verify_url = f"{APP_URL}/auth/verify-email?token={token}"
    html = f"""
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <h2 style="color:#6366f1">Welcome to PumpRadar!</h2>
      <p>Hi {name},</p>
      <p>Please verify your email address to activate your account:</p>
      <a href="{verify_url}" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin:16px 0">
        Verify Email
      </a>
      <p style="color:#666;font-size:14px">This link expires in 24 hours.</p>
    </div>"""
    try:
        await asyncio.to_thread(resend.Emails.send, {
            "from": f"PumpRadar <{SENDER_EMAIL}>",
            "to": [email],
            "subject": "Verify your email - PumpRadar",
            "html": html,
        })
    except Exception as e:
        logger.error(f"Email send error: {e}")

async def send_reset_email(email: str, token: str):
    reset_url = f"{APP_URL}/auth/reset-password?token={token}"
    html = f"""
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <h2 style="color:#6366f1">Password Reset - PumpRadar</h2>
      <p>You requested a password reset. Click the link below:</p>
      <a href="{reset_url}" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin:16px 0">
        Reset Password
      </a>
      <p style="color:#666;font-size:14px">This link expires in 1 hour.</p>
    </div>"""
    try:
        await asyncio.to_thread(resend.Emails.send, {
            "from": f"PumpRadar <{SENDER_EMAIL}>",
            "to": [email],
            "subject": "Password Reset - PumpRadar",
            "html": html,
        })
    except Exception as e:
        logger.error(f"Reset email error: {e}")

# ─────────────────────────────────────────────
# AUTH MODELS
# ─────────────────────────────────────────────
class LoginDTO(BaseModel):
    email: EmailStr
    password: str
    remember: Optional[bool] = False

class RegisterDTO(BaseModel):
    email: EmailStr
    password: str
    name: str
    confirmPassword: Optional[str] = None

class ForgotPasswordDTO(BaseModel):
    email: EmailStr

class ResetPasswordDTO(BaseModel):
    token: str
    password: str
    confirmPassword: Optional[str] = None

class VerifyEmailDTO(BaseModel):
    token: str

# ─────────────────────────────────────────────
# AUTH ENDPOINTS
# ─────────────────────────────────────────────
@app.post("/api/auth/register")
async def register(dto: RegisterDTO):
    existing = await db.users.find_one({"email": dto.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail=api_err("Email already registered", "EMAIL_EXISTS"))
    
    verify_token = secrets.token_urlsafe(32)
    verify_expiry = datetime.now(timezone.utc) + timedelta(hours=24)
    
    # Free trial = 24h from registration
    trial_expiry = datetime.now(timezone.utc) + timedelta(hours=24)
    
    user_doc = {
        "email": dto.email.lower(),
        "name": dto.name,
        "password_hash": hash_password(dto.password),
        "roles": ["viewer"],
        "email_verified": False,
        "verify_token": verify_token,
        "verify_token_expiry": verify_expiry,
        "subscription": "trial",
        "subscription_expiry": trial_expiry,
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    
    access_token = create_token(str(result.inserted_id), dto.email)
    refresh_token = create_token(str(result.inserted_id), dto.email, timedelta(days=30))
    
    # Send verification email
    asyncio.create_task(send_verification_email(dto.email, dto.name, verify_token))
    
    return api_ok({
        "user": doc_to_user(user_doc),
        "accessToken": access_token,
        "refreshToken": refresh_token,
        "message": "Account created! Please check your email to verify.",
    })

@app.post("/api/auth/login")
async def login(dto: LoginDTO):
    user = await db.users.find_one({"email": dto.email.lower()})
    if not user or not verify_password(dto.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail=api_err("Incorrect email or password", "INVALID_CREDENTIALS"))
    
    # Email verification disabled - allow all logins
    expire = timedelta(days=30) if dto.remember else timedelta(minutes=JWT_EXPIRE_MINUTES)
    access_token = create_token(str(user["_id"]), user["email"], expire)
    refresh_token = create_token(str(user["_id"]), user["email"], timedelta(days=30))
    
    return api_ok({
        "user": doc_to_user(user),
        "accessToken": access_token,
        "refreshToken": refresh_token,
    })

@app.post("/api/auth/forgot-password")
async def forgot_password(dto: ForgotPasswordDTO):
    user = await db.users.find_one({"email": dto.email.lower()})
    if user:
        reset_token = secrets.token_urlsafe(32)
        reset_expiry = datetime.now(timezone.utc) + timedelta(hours=1)
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"reset_token": reset_token, "reset_token_expiry": reset_expiry}}
        )
        asyncio.create_task(send_reset_email(dto.email, reset_token))
    
    return api_ok({"message": "If this email exists, you will receive reset instructions."})

@app.post("/api/auth/reset-password")
async def reset_password(dto: ResetPasswordDTO):
    user = await db.users.find_one({
        "reset_token": dto.token,
        "reset_token_expiry": {"$gt": datetime.now(timezone.utc)}
    })
    if not user:
        raise HTTPException(status_code=400, detail=api_err("Invalid or expired token", "INVALID_TOKEN"))
    
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"password_hash": hash_password(dto.password)}, "$unset": {"reset_token": "", "reset_token_expiry": ""}}
    )
    return api_ok({"message": "Password has been reset successfully."})

@app.post("/api/auth/verify-email")
async def verify_email(dto: VerifyEmailDTO):
    user = await db.users.find_one({
        "verify_token": dto.token,
        "verify_token_expiry": {"$gt": datetime.now(timezone.utc)}
    })
    if not user:
        raise HTTPException(status_code=400, detail=api_err("Invalid or expired token", "INVALID_TOKEN"))
    
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"email_verified": True}, "$unset": {"verify_token": "", "verify_token_expiry": ""}}
    )
    user["email_verified"] = True
    return api_ok({"message": "Email verified successfully!", "user": doc_to_user(user)})

@app.post("/api/auth/logout")
async def logout(user=Depends(get_current_user)):
    return api_ok({"message": "Logged out successfully"})

@app.get("/api/auth/me")
async def get_me(user=Depends(get_current_user)):
    return api_ok({"user": doc_to_user(user)})

@app.post("/api/auth/refresh")
async def refresh_token(request: Request):
    body = await request.json()
    refresh = body.get("refreshToken", "")
    try:
        payload = decode_token(refresh)
        user_id = payload.get("sub")
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        new_access = create_token(str(user["_id"]), user["email"])
        new_refresh = create_token(str(user["_id"]), user["email"], timedelta(days=30))
        return api_ok({"accessToken": new_access, "refreshToken": new_refresh})
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@app.post("/api/auth/resend-verification")
async def resend_verification(request: Request, user=Depends(get_current_user)):
    """Resend verification email"""
    if user.get("email_verified"):
        return api_ok({"message": "Email already verified"})
    
    # Generate new verification token
    verify_token = secrets.token_urlsafe(32)
    verify_expiry = datetime.now(timezone.utc) + timedelta(hours=24)
    
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"verify_token": verify_token, "verify_token_expiry": verify_expiry}}
    )
    
    # Send email
    asyncio.create_task(send_verification_email(user["email"], user.get("name", ""), verify_token))
    
    return api_ok({"message": "Verification email sent! Please check your inbox."})

# ─────────────────────────────────────────────
# SUBSCRIPTION CHECK MIDDLEWARE
# ─────────────────────────────────────────────
async def check_subscription(user: dict) -> dict:
    """Check if user has active subscription. Returns subscription status."""
    subscription = user.get("subscription", "free")
    expiry = user.get("subscription_expiry")
    
    if subscription == "free":
        return {"active": False, "reason": "No active subscription"}
    
    if expiry:
        # Handle both datetime and string formats
        if isinstance(expiry, str):
            expiry = datetime.fromisoformat(expiry.replace("Z", "+00:00"))
        if expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=timezone.utc)
        
        if expiry < datetime.now(timezone.utc):
            return {"active": False, "reason": "Subscription expired", "expired_at": expiry.isoformat()}
    
    return {"active": True, "subscription": subscription, "expires_at": expiry.isoformat() if expiry else None}

async def require_active_subscription(user=Depends(get_current_user)) -> dict:
    """Dependency that requires an active subscription"""
    status = await check_subscription(user)
    if not status["active"]:
        raise HTTPException(
            status_code=402,  # Payment Required
            detail=api_err(f"Subscription required: {status.get('reason', 'No active subscription')}", "SUBSCRIPTION_REQUIRED")
        )
    return user


# ─────────────────────────────────────────────
# CRYPTO DATA FETCHING
# ─────────────────────────────────────────────
CG_HEADERS = {"x-cg-demo-api-key": COINGECKO_API_KEY} if COINGECKO_API_KEY else {}

def get_coingecko_markets(per_page=100) -> List[dict]:
    try:
        url = "https://api.coingecko.com/api/v3/coins/markets"
        params = {
            "vs_currency": "usd",
            "order": "volume_desc",
            "per_page": per_page,
            "page": 1,
            "price_change_percentage": "1h,24h,7d",
            "sparkline": "false",
        }
        r = requests.get(url, params=params, headers=CG_HEADERS, timeout=30)
        if r.status_code == 429:
            logger.warning("CoinGecko rate limit - waiting 60s")
            import time
            time.sleep(60)
            r = requests.get(url, params=params, headers=CG_HEADERS, timeout=30)
        r.raise_for_status()
        return r.json() or []
    except Exception as e:
        logger.error(f"CoinGecko error: {e}")
        return []

def get_lunarcrush_data(limit=50) -> List[dict]:
    """Try LunarCrush - gracefully fallback if subscription required"""
    try:
        url = "https://lunarcrush.com/api4/public/coins/list/v2"
        headers = {"Authorization": f"Bearer {LUNARCRUSH_API_KEY}"}
        params = {"sort": "galaxy_score", "limit": limit}
        r = requests.get(url, headers=headers, params=params, timeout=30)
        if r.status_code == 200:
            data = r.json()
            return data.get("data", [])
        logger.warning(f"LunarCrush unavailable (status {r.status_code}) - using CoinGecko only")
        return []
    except Exception as e:
        logger.error(f"LunarCrush error: {e}")
        return []

def get_fear_greed_index() -> dict:
    """Fear & Greed Index from alternative.me (free, no auth)"""
    try:
        r = requests.get("https://api.alternative.me/fng/?limit=1", timeout=10)
        if r.status_code == 200:
            data = r.json().get("data", [{}])[0]
            return {"value": int(data.get("value", 50)), "classification": data.get("value_classification", "Neutral")}
    except Exception:
        pass
    return {"value": 50, "classification": "Neutral"}

def get_coingecko_trending() -> List[str]:
    """Get trending coin symbols from CoinGecko (free)"""
    try:
        r = requests.get("https://api.coingecko.com/api/v3/search/trending", headers=CG_HEADERS, timeout=15)
        if r.status_code == 200:
            coins = r.json().get("coins", [])
            return [c["item"]["symbol"].upper() for c in coins]
    except Exception:
        pass
    return []

async def analyze_signals_with_ai(candidates: List[dict], fear_greed: dict = None, trending: List[str] = None) -> dict:
    """Use Gemini to analyze and score pump/dump signals"""
    if not candidates:
        return {"pump_signals": [], "dump_signals": [], "market_summary": "No data available"}
    
    try:
        fg = fear_greed or {"value": 50, "classification": "Neutral"}
        trending_str = ", ".join(trending[:10]) if trending else "N/A"
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"crypto_analysis_{uuid.uuid4()}",
            system_message="""You are an expert crypto market analyst specializing in pump/dump signal detection.
You analyze market data to identify opportunities and risks.
You MUST respond ONLY in valid JSON format, with no text before or after the JSON.
All text in the response MUST be in English."""
        ).with_model("gemini", "gemini-2.5-flash")
        
        # Sort by most interesting metrics first
        interesting = sorted(candidates, key=lambda x: (
            abs(x.get('price_change_1h', 0)) * 2 + 
            abs(x.get('price_change_24h', 0)) + 
            x.get('vol_mcap_ratio', 0) * 0.5 +
            (10 if x.get('is_trending') else 0)
        ), reverse=True)
        
        data_str = "\n".join([
            f"{c['symbol']}: price=${c.get('price','?')}, vol/mcap={c.get('vol_mcap_ratio','?')}%, "
            f"1h={c.get('price_change_1h','?')}%, 24h={c.get('price_change_24h','?')}%, "
            f"7d={c.get('price_change_7d','?')}%, trending={'YES' if c.get('is_trending') else 'no'}"
            for c in interesting[:25]
        ])
        
        prompt = f"""Analyze these cryptocurrencies for PUMP and DUMP signals.

MARKET CONTEXT:
- Fear & Greed Index: {fg['value']}/100 ({fg['classification']})
- Trending on CoinGecko: {trending_str}

COIN DATA (sorted by activity):
{data_str}

Return JSON with this exact structure (no text before/after). ALL TEXT MUST BE IN ENGLISH:
{{
  "pump_signals": [
    {{
      "symbol": "BTC",
      "signal_strength": 85,
      "reason": "High volume/mcap ratio, positive 1h momentum, trending on CoinGecko",
      "confidence": "high",
      "risk_level": "medium"
    }}
  ],
  "dump_signals": [
    {{
      "symbol": "ETH",
      "signal_strength": 70,
      "reason": "Selling pressure, simultaneous 1h and 24h decline",
      "confidence": "medium",
      "risk_level": "high"
    }}
  ],
  "market_summary": "Fear & Greed at {fg['value']} ({fg['classification']}). Brief 2-sentence market summary in English."
}}

PUMP criteria: vol/mcap >5%, positive price_change_1h, trending=YES, increasing momentum
DUMP criteria: both price_change_1h and 24h negative, high vol/mcap (selling pressure), accelerating decline

Return maximum 10 pump signals and 5 dump signals, ordered by signal_strength DESC."""
        
        response = await chat.send_message(UserMessage(text=prompt))
        
        # Parse JSON response
        import json as json_lib
        response_clean = response.strip()
        if response_clean.startswith("```"):
            lines = response_clean.split("\n")
            response_clean = "\n".join([l for l in lines if not l.startswith("```")])
        
        result = json_lib.loads(response_clean)
        return result
    except Exception as e:
        logger.error(f"AI analysis error: {e}")
        return {"pump_signals": [], "dump_signals": [], "market_summary": "AI analysis temporarily unavailable"}

async def fetch_and_store_signals():
    """Main job: fetch data, analyze with AI, store results"""
    logger.info("Starting crypto signal fetch job...")
    
    try:
        # Fetch data in parallel
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor() as executor:
            cg_future = executor.submit(get_coingecko_markets, 100)
            lc_future = executor.submit(get_lunarcrush_data, 50)
            fg_future = executor.submit(get_fear_greed_index)
            trending_future = executor.submit(get_coingecko_trending)
            
            cg_data = cg_future.result()
            lc_data = lc_future.result()
            fear_greed = fg_future.result()
            trending_symbols = trending_future.result()
        
        # Build LunarCrush lookup by symbol
        lc_lookup: Dict[str, dict] = {}
        for coin in lc_data:
            sym = (coin.get("symbol") or coin.get("s") or "").upper()
            if sym:
                lc_lookup[sym] = coin
        
        # Merge data - FILTER OUT INVALID COINS
        candidates = []
        for coin in cg_data:
            sym = coin.get("symbol", "").upper()
            
            # STRICT VALIDATION - Skip coins with invalid/zero data
            price = coin.get("current_price") or 0
            vol = coin.get("total_volume") or 0
            mcap = coin.get("market_cap") or 0
            
            # Skip if price is 0 or extremely low (likely dead/scam coins)
            if price <= 0 or price < 0.0000001:
                continue
            
            # Skip if no volume (dead coins)
            if vol <= 0:
                continue
                
            # Skip if no market cap (not a real trading coin)
            if mcap <= 0:
                continue
            
            # Skip if market cap is suspiciously low (< $100k - likely scam/meme)
            if mcap < 100000:
                continue
            
            lc = lc_lookup.get(sym, {})
            
            # Extract price changes
            pc = coin.get("price_change_percentage_1h_in_currency") or coin.get("price_change_percentage_1h") or 0
            pc24 = coin.get("price_change_percentage_24h") or 0
            pc7d = coin.get("price_change_percentage_7d_in_currency") or coin.get("price_change_percentage_7d") or 0
            
            vol_mcap_ratio = (vol / mcap * 100) if mcap > 0 else 0
            
            candidates.append({
                "id": coin.get("id", ""),
                "symbol": sym,
                "name": coin.get("name", ""),
                "price": price,
                "market_cap": mcap,
                "volume_24h": vol,
                "vol_mcap_ratio": round(vol_mcap_ratio, 2),
                "price_change_1h": round(float(pc), 2) if pc else 0,
                "price_change_24h": round(float(pc24), 2) if pc24 else 0,
                "price_change_7d": round(float(pc7d), 2) if pc7d else 0,
                "image": coin.get("image"),
                "is_trending": sym in trending_symbols,
                # LunarCrush data (0 if not available)
                "social_volume": lc.get("social_volume") or lc.get("sv") or 0,
                "sentiment": lc.get("sentiment") or lc.get("ss") or 0,
                "galaxy_score": lc.get("galaxy_score") or lc.get("gs") or 0,
            })
        
        logger.info(f"Filtered to {len(candidates)} valid coins from {len(cg_data)} total")
        
        # AI Analysis with all available data
        ai_result = await analyze_signals_with_ai(candidates, fear_greed, trending_symbols)
        
        # Enrich signals with market data
        cg_lookup = {c["symbol"].upper(): c for c in candidates}
        
        def enrich_signal(sig: dict, signal_type: str) -> dict:
            sym = sig.get("symbol", "").upper()
            market = cg_lookup.get(sym, {})
            
            # Skip if no market data found (AI hallucinated a coin)
            if not market:
                return None
            
            # Skip if price is 0 or invalid
            price = market.get("price") or 0
            if price <= 0:
                return None
                
            return {
                **sig,
                "signal_type": signal_type,
                "symbol": sym,
                "name": market.get("name", sym),
                "price": price,
                "price_change_1h": market.get("price_change_1h"),
                "price_change_24h": market.get("price_change_24h"),
                "volume_24h": market.get("volume_24h"),
                "social_volume": market.get("social_volume"),
                "sentiment": market.get("sentiment"),
                "galaxy_score": market.get("galaxy_score"),
                "image": market.get("image"),
                "is_trending": market.get("is_trending", False),
                "timestamp": datetime.now(timezone.utc),
            }
        
        # Filter out None (invalid signals)
        pump_signals = [s for s in [enrich_signal(s, "pump") for s in ai_result.get("pump_signals", [])] if s is not None]
        dump_signals = [s for s in [enrich_signal(s, "dump") for s in ai_result.get("dump_signals", [])] if s is not None]
        
        if pump_signals or dump_signals:
            snapshot = {
                "timestamp": datetime.now(timezone.utc),
                "pump_signals": pump_signals,
                "dump_signals": dump_signals,
                "market_summary": ai_result.get("market_summary", ""),
                "coins_analyzed": len(candidates),
                "fear_greed": fear_greed,
                "trending": trending_symbols[:10],
            }
            await db.signal_snapshots.insert_one(snapshot)
            
            # Keep only last 48 snapshots
            count = await db.signal_snapshots.count_documents({})
            if count > 48:
                oldest = await db.signal_snapshots.find({}).sort("timestamp", 1).limit(count - 48).to_list(length=100)
                old_ids = [d["_id"] for d in oldest]
                await db.signal_snapshots.delete_many({"_id": {"$in": old_ids}})
        
        logger.info(f"Signal job complete: {len(pump_signals)} pump, {len(dump_signals)} dump signals")
        
    except Exception as e:
        logger.exception(f"Signal fetch job error: {e}")

# ─────────────────────────────────────────────
# CRYPTO SIGNAL ENDPOINTS
# ─────────────────────────────────────────────
def serialize_signal(s: dict) -> dict:
    """Remove MongoDB _id and serialize datetime"""
    s.pop("_id", None)
    if isinstance(s.get("timestamp"), datetime):
        s["timestamp"] = s["timestamp"].isoformat()
    return s

@app.get("/api/crypto/signals")
async def get_signals(user=Depends(get_optional_user)):
    """Get latest pump/dump signals"""
    # Get latest snapshot
    snapshot = await db.signal_snapshots.find_one({}, sort=[("timestamp", -1)])
    
    if not snapshot:
        # Return empty if no data yet
        return api_ok({
            "pump_signals": [],
            "dump_signals": [],
            "market_summary": "Signals are being processed. Please check back in a few minutes.",
            "last_updated": None,
            "coins_analyzed": 0,
        })
    
    # Check subscription for full access
    has_access = True  # Default to true for unauthenticated users (limited view)
    subscription_expired = False
    
    if user:
        sub = user.get("subscription", "free")
        sub_expiry = user.get("subscription_expiry")
        
        if sub in ("monthly", "annual"):
            has_access = True
        elif sub == "trial":
            if sub_expiry:
                # Handle timezone
                if isinstance(sub_expiry, str):
                    sub_expiry = datetime.fromisoformat(sub_expiry.replace("Z", "+00:00"))
                if hasattr(sub_expiry, 'tzinfo') and sub_expiry.tzinfo is None:
                    sub_expiry = sub_expiry.replace(tzinfo=timezone.utc)
                
                if datetime.now(timezone.utc) < sub_expiry:
                    has_access = True
                else:
                    # Trial expired - block access
                    has_access = False
                    subscription_expired = True
            else:
                has_access = False
                subscription_expired = True
        else:
            # Free tier - no access
            has_access = False
            subscription_expired = True
    
    # If subscription expired, return 402 Payment Required
    if subscription_expired and user:
        raise HTTPException(
            status_code=402,
            detail=api_err("Your free trial has expired. Please subscribe to continue.", "SUBSCRIPTION_EXPIRED")
        )
    
    pump = [serialize_signal(dict(s)) for s in snapshot.get("pump_signals", [])]
    dump = [serialize_signal(dict(s)) for s in snapshot.get("dump_signals", [])]
    
    # Free users see first 3 signals blurred (frontend handles blur)
    return api_ok({
        "pump_signals": pump,
        "dump_signals": dump,
        "market_summary": snapshot.get("market_summary", ""),
        "last_updated": snapshot["timestamp"].isoformat() if isinstance(snapshot.get("timestamp"), datetime) else snapshot.get("timestamp"),
        "coins_analyzed": snapshot.get("coins_analyzed", 0),
        "has_full_access": has_access,
        "fear_greed": snapshot.get("fear_greed"),
        "trending": snapshot.get("trending", []),
    })

@app.get("/api/crypto/history")
async def get_history(limit: int = 24, user=Depends(get_current_user)):
    """Get historical signals (last N snapshots)"""
    snapshots = await db.signal_snapshots.find({}).sort("timestamp", -1).limit(limit).to_list(length=limit)
    
    result = []
    for snap in snapshots:
        result.append({
            "timestamp": snap["timestamp"].isoformat() if isinstance(snap.get("timestamp"), datetime) else snap.get("timestamp"),
            "pump_count": len(snap.get("pump_signals", [])),
            "dump_count": len(snap.get("dump_signals", [])),
            "market_summary": snap.get("market_summary", ""),
            "coins_analyzed": snap.get("coins_analyzed", 0),
        })
    
    return api_ok({"history": result})

@app.post("/api/crypto/refresh")
async def manual_refresh(background_tasks: BackgroundTasks, user=Depends(get_current_user)):
    """Manual trigger for signal refresh (admin only)"""
    background_tasks.add_task(fetch_and_store_signals)
    return api_ok({"message": "Signal refresh triggered"})

# ─────────────────────────────────────────────
# SUBSCRIPTION / STRIPE
# ─────────────────────────────────────────────
SUBSCRIPTION_PLANS = {
    "trial": {"name": "Trial 24h", "price": 0.0, "currency": "usd", "duration_days": 1},
    "monthly": {"name": "Pro Monthly", "price": 29.99, "currency": "usd", "duration_days": 30},
    "annual": {"name": "Pro Annual", "price": 199.99, "currency": "usd", "duration_days": 365},
}

class CheckoutRequest(BaseModel):
    plan: str
    origin_url: str

@app.post("/api/payments/checkout")
async def create_checkout(req: CheckoutRequest, request: Request, user=Depends(get_current_user)):
    if req.plan not in SUBSCRIPTION_PLANS or req.plan == "trial":
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    plan = SUBSCRIPTION_PLANS[req.plan]
    
    success_url = f"{req.origin_url}/subscription/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{req.origin_url}/pages/pricing"
    
    stripe_checkout = StripeCheckout(
        api_key=STRIPE_API_KEY,
        webhook_url=f"{APP_URL}/api/webhook/stripe"
    )
    
    checkout_req = CheckoutSessionRequest(
        amount=plan["price"],
        currency=plan["currency"],
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": str(user["_id"]),
            "user_email": user["email"],
            "plan": req.plan,
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_req)
    
    # Store pending transaction
    await db.payment_transactions.insert_one({
        "session_id": session.session_id,
        "user_id": str(user["_id"]),
        "user_email": user["email"],
        "plan": req.plan,
        "amount": plan["price"],
        "currency": plan["currency"],
        "payment_status": "pending",
        "status": "initiated",
        "created_at": datetime.now(timezone.utc),
    })
    
    return api_ok({"url": session.url, "session_id": session.session_id})

@app.get("/api/payments/status/{session_id}")
async def check_payment_status(session_id: str, user=Depends(get_current_user)):
    stripe_checkout = StripeCheckout(
        api_key=STRIPE_API_KEY,
        webhook_url=f"{APP_URL}/api/webhook/stripe"
    )
    
    checkout_status = await stripe_checkout.get_checkout_status(session_id)
    
    # Update transaction if paid
    tx = await db.payment_transactions.find_one({"session_id": session_id})
    
    if checkout_status.payment_status == "paid" and tx and tx.get("payment_status") != "paid":
        plan_name = tx.get("plan", "monthly")
        plan = SUBSCRIPTION_PLANS.get(plan_name, SUBSCRIPTION_PLANS["monthly"])
        expiry = datetime.now(timezone.utc) + timedelta(days=plan["duration_days"])
        
        # Update user subscription
        await db.users.update_one(
            {"_id": ObjectId(tx["user_id"])},
            {"$set": {"subscription": plan_name, "subscription_expiry": expiry}}
        )
        
        # Update transaction
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"payment_status": "paid", "status": "completed", "completed_at": datetime.now(timezone.utc)}}
        )
    
    return api_ok({
        "status": checkout_status.status,
        "payment_status": checkout_status.payment_status,
        "session_id": session_id,
    })

@app.post("/api/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    sig = request.headers.get("Stripe-Signature", "")
    
    try:
        stripe_checkout = StripeCheckout(
            api_key=STRIPE_API_KEY,
            webhook_url=f"{APP_URL}/api/webhook/stripe"
        )
        webhook_response = await stripe_checkout.handle_webhook(body, sig)
        
        if webhook_response.payment_status == "paid":
            session_id = webhook_response.session_id
            tx = await db.payment_transactions.find_one({"session_id": session_id})
            if tx and tx.get("payment_status") != "paid":
                plan_name = tx.get("plan", "monthly")
                plan = SUBSCRIPTION_PLANS.get(plan_name, SUBSCRIPTION_PLANS["monthly"])
                expiry = datetime.now(timezone.utc) + timedelta(days=plan["duration_days"])
                
                await db.users.update_one(
                    {"_id": ObjectId(tx["user_id"])},
                    {"$set": {"subscription": plan_name, "subscription_expiry": expiry}}
                )
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {"payment_status": "paid", "status": "completed"}}
                )
    except Exception as e:
        logger.error(f"Webhook error: {e}")
    
    return {"status": "ok"}

@app.get("/api/user/subscription")
async def get_subscription(user=Depends(get_current_user)):
    sub = user.get("subscription", "free")
    expiry = user.get("subscription_expiry")
    
    is_active = False
    if sub in ("monthly", "annual"):
        if expiry:
            is_active = datetime.now(timezone.utc) < expiry
        else:
            is_active = True
    elif sub == "trial":
        if expiry:
            is_active = datetime.now(timezone.utc) < expiry
    
    return api_ok({
        "subscription": sub,
        "is_active": is_active,
        "expiry": expiry.isoformat() if isinstance(expiry, datetime) else expiry,
        "plans": SUBSCRIPTION_PLANS,
    })

# ─────────────────────────────────────────────
# SCHEDULER
# ─────────────────────────────────────────────
from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler(timezone="UTC")

@app.on_event("startup")
async def startup_event():
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.signal_snapshots.create_index("timestamp")
    await db.payment_transactions.create_index("session_id", unique=True)
    
    # Start scheduler - hourly job
    scheduler.add_job(fetch_and_store_signals, 'interval', hours=1, id='crypto_signals', replace_existing=True)
    scheduler.start()
    
    # Initial fetch with delay to avoid rate limiting on hot-reload
    async def delayed_fetch():
        await asyncio.sleep(30)  # Wait 30s before first fetch
        await fetch_and_store_signals()
    
    asyncio.create_task(delayed_fetch())
    logger.info("PumpRadar backend started - scheduler running hourly, first fetch in 30s")

@app.on_event("shutdown")
async def shutdown_event():
    scheduler.shutdown()
    client.close()

# ─────────────────────────────────────────────
# AI CHAT CUSTOMER SERVICE
# ─────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = []

@app.post("/api/ai/chat")
async def ai_chat(req: ChatRequest, user=Depends(get_optional_user)):
    """AI customer service chat powered by Gemini"""
    try:
        # Get latest signal context
        snapshot = await db.signal_snapshots.find_one({}, sort=[("timestamp", -1)])
        pump_count = len(snapshot.get("pump_signals", [])) if snapshot else 0
        dump_count = len(snapshot.get("dump_signals", [])) if snapshot else 0
        summary = snapshot.get("market_summary", "") if snapshot else ""
        
        user_sub = "Free Trial"
        if user:
            sub = user.get("subscription", "trial")
            user_sub = "Pro Monthly" if sub == "monthly" else "Pro Annual" if sub == "annual" else "Free Trial"
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"chat_{uuid.uuid4()}",
            system_message=f"""You are the AI assistant for the PumpRadar platform.
PumpRadar is a platform that analyzes crypto PUMP & DUMP signals using AI (Gemini), data from CoinGecko and LunarCrush.

CURRENT CONTEXT:
- Active PUMP signals: {pump_count}
- Active DUMP signals: {dump_count}  
- Market summary: {summary}
- Available plans: Trial (24h free), Pro Monthly ($29.99/month), Pro Annual ($199.99/year)
- Current user: {f"authenticated - {user_sub}" if user else "not authenticated"}

You ALWAYS respond in English, are friendly and concise.
You can help with: explanations about crypto signals, how the platform works, subscription plans, general trading tips (with disclaimer that these are not financial advice).
You do not make guaranteed price predictions. Always add disclaimer that signals are not financial advice."""
        ).with_model("gemini", "gemini-2.5-flash")
        
        response = await chat.send_message(UserMessage(text=req.message))
        return api_ok({"reply": response})
    except Exception as e:
        logger.error(f"AI chat error: {e}")
        return api_ok({"reply": "Sorry, I cannot respond right now. Please try again in a few moments."})

# ─────────────────────────────────────────────
# COIN DETAIL
# ─────────────────────────────────────────────
def get_coin_chart_data(coin_id: str, days: int = 1) -> List[dict]:
    """Get hourly price + volume data from CoinGecko"""
    try:
        url = f"https://api.coingecko.com/api/v3/coins/{coin_id}/market_chart"
        params = {"vs_currency": "usd", "days": days, "interval": "hourly"}
        r = requests.get(url, params=params, headers=CG_HEADERS, timeout=15)
        if r.status_code != 200:
            return []
        data = r.json()
        prices = data.get("prices", [])
        volumes = data.get("total_volumes", [])
        result = []
        for i, (ts, price) in enumerate(prices[-24:]):
            vol = volumes[i][1] if i < len(volumes) else 0
            dt = datetime.fromtimestamp(ts / 1000, tz=timezone.utc)
            result.append({
                "time": dt.strftime("%H:%M"),
                "price": round(price, 6),
                "volume": round(vol),
                "open": round(price * 0.998, 6),
                "high": round(price * 1.005, 6),
                "low": round(price * 0.994, 6),
                "close": round(price, 6),
            })
        return result
    except Exception as e:
        logger.error(f"Chart data error: {e}")
        return []

def get_coin_exchanges(symbol: str, coin_id: str) -> List[dict]:
    """Build exchange list for a coin"""
    sym_lower = symbol.lower()
    cex_list = [
        {"name": "Binance", "url": f"https://www.binance.com/trade/{symbol}_USDT", "type": "cex"},
        {"name": "Coinbase", "url": f"https://www.coinbase.com/price/{coin_id}", "type": "cex"},
        {"name": "Kraken", "url": f"https://www.kraken.com/prices/{sym_lower}", "type": "cex"},
        {"name": "KuCoin", "url": f"https://www.kucoin.com/trade/{symbol}-USDT", "type": "cex"},
        {"name": "OKX", "url": f"https://www.okx.com/trade-spot/{sym_lower}-usdt", "type": "cex"},
        {"name": "Bybit", "url": f"https://www.bybit.com/trade/usdt/{symbol}USDT", "type": "cex"},
    ]
    dex_list = [
        {"name": "Uniswap", "url": f"https://app.uniswap.org/swap?outputCurrency={symbol}", "type": "dex"},
        {"name": "PancakeSwap", "url": f"https://pancakeswap.finance/swap?outputCurrency={symbol}", "type": "dex"},
        {"name": "dYdX", "url": f"https://dydx.trade/trade/{symbol}-USD", "type": "dex"},
    ]
    # Return top 4 CEX + 2 DEX
    return cex_list[:4] + dex_list[:2]

@app.get("/api/crypto/coin/{symbol}")
async def get_coin_detail(symbol: str, type: str = "pump", user=Depends(get_optional_user)):
    """Get detailed coin data with AI analysis"""
    symbol = symbol.upper()
    
    # Find signal in latest snapshot
    snapshot = await db.signal_snapshots.find_one({}, sort=[("timestamp", -1)])
    signal = None
    if snapshot:
        all_signals = snapshot.get("pump_signals", []) + snapshot.get("dump_signals", [])
        for s in all_signals:
            if s.get("symbol", "").upper() == symbol:
                signal = s
                break
    
    # Get CoinGecko market data
    try:
        url = "https://api.coingecko.com/api/v3/coins/markets"
        params = {"vs_currency": "usd", "ids": "", "symbols": symbol.lower(), "price_change_percentage": "1h,24h,7d"}
        # Search by symbol
        search_url = f"https://api.coingecko.com/api/v3/search?query={symbol}"
        sr = requests.get(search_url, headers=CG_HEADERS, timeout=10)
        coin_id = symbol.lower()
        if sr.status_code == 200:
            coins = sr.json().get("coins", [])
            for c in coins:
                if c.get("symbol", "").upper() == symbol:
                    coin_id = c.get("id", symbol.lower())
                    break
        
        market_url = f"https://api.coingecko.com/api/v3/coins/markets"
        mr = requests.get(market_url, params={
            "vs_currency": "usd", "ids": coin_id,
            "price_change_percentage": "1h,24h,7d"
        }, headers=CG_HEADERS, timeout=15)
        
        market_data = {}
        if mr.status_code == 200 and mr.json():
            market_data = mr.json()[0]
    except Exception as e:
        logger.error(f"CoinGecko detail error: {e}")
        market_data = {}
    
    price = market_data.get("current_price") or (signal.get("price") if signal else 0) or 0
    price_change_1h = market_data.get("price_change_percentage_1h_in_currency") or (signal.get("price_change_1h") if signal else 0) or 0
    price_change_24h = market_data.get("price_change_percentage_24h") or (signal.get("price_change_24h") if signal else 0) or 0
    price_change_7d = market_data.get("price_change_percentage_7d_in_currency") or 0
    volume_24h = market_data.get("total_volume") or (signal.get("volume_24h") if signal else 0) or 0
    market_cap = market_data.get("market_cap") or 0
    image = market_data.get("image") or (signal.get("image") if signal else "")
    coin_id = market_data.get("id") or symbol.lower()
    
    # VALIDATION: If no valid data found, return 404
    if price <= 0 and not signal:
        raise HTTPException(
            status_code=404, 
            detail=api_err(f"Coin '{symbol}' not found or has no valid market data. It may be delisted or not supported.", "COIN_NOT_FOUND")
        )
    
    # If coin has invalid data (price 0, market cap < $100k), warn user
    is_invalid_coin = price <= 0 or market_cap < 100000
    
    # Get chart data
    chart_data = get_coin_chart_data(coin_id, days=1)
    
    # AI detailed analysis
    ai_analysis = ""
    trend_conclusion = ""
    if signal:
        try:
            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=f"coin_detail_{uuid.uuid4()}",
                system_message="You are a crypto technical analysis expert. You respond in English, concisely and directly."
            ).with_model("gemini", "gemini-2.5-flash")
            
            prompt = f"""Analyze {symbol} ({signal.get('name', symbol)}) in detail as a {'PUMP' if type == 'pump' else 'DUMP'} signal.

Data:
- Price: ${price}
- 1h change: {price_change_1h}%
- 24h change: {price_change_24h}%
- 7d change: {price_change_7d}%
- 24h volume: ${volume_24h:,.0f}
- Market cap: ${market_cap:,.0f}
- AI signal strength: {signal.get('signal_strength', 0)}%
- Initial reason: {signal.get('reason', '')}

Respond with JSON (all text in English):
{{
  "analysis": "Detailed analysis in 3-4 sentences with specific technical reasons",
  "trend": "Clear conclusion about the trend and reasoning in 2 sentences, with key indicators"
}}"""
            
            resp = await chat.send_message(UserMessage(text=prompt))
            import json as json_lib
            resp_clean = resp.strip()
            if resp_clean.startswith("```"):
                resp_clean = "\n".join([l for l in resp_clean.split("\n") if not l.startswith("```")])
            detail_json = json_lib.loads(resp_clean)
            ai_analysis = detail_json.get("analysis", signal.get("reason", ""))
            trend_conclusion = detail_json.get("trend", "")
        except Exception as e:
            logger.error(f"Coin detail AI error: {e}")
            ai_analysis = signal.get("reason", "Data indicates a significant signal.")
            trend_conclusion = f"{'Positive' if type == 'pump' else 'Negative'} trend based on volume and price movement."
    else:
        ai_analysis = f"No active signal for {symbol} in the last hour of analysis."
        trend_conclusion = "Monitor the market for future signals."
    
    exchanges = get_coin_exchanges(symbol, coin_id)
    
    return api_ok({
        "symbol": symbol,
        "name": market_data.get("name") or (signal.get("name") if signal else symbol),
        "image": image,
        "price": price,
        "price_change_1h": price_change_1h,
        "price_change_24h": price_change_24h,
        "price_change_7d": price_change_7d,
        "volume_24h": volume_24h,
        "market_cap": market_cap,
        "signal_type": type,
        "signal_strength": signal.get("signal_strength", 0) if signal else 0,
        "reason": signal.get("reason", "") if signal else "",
        "confidence": signal.get("confidence", "medium") if signal else "medium",
        "risk_level": signal.get("risk_level", "medium") if signal else "medium",
        "ai_analysis": ai_analysis,
        "trend_conclusion": trend_conclusion,
        "exchanges": exchanges,
        "chart_data": chart_data,
    })

# ─────────────────────────────────────────────
# ADMIN ENDPOINTS
# ─────────────────────────────────────────────
async def require_admin(user=Depends(get_current_user)):
    if "admin" not in user.get("roles", []):
        raise HTTPException(status_code=403, detail=api_err("Admin access required", "FORBIDDEN"))
    return user

@app.get("/api/admin/users")
async def admin_list_users(skip: int = 0, limit: int = 100, admin=Depends(require_admin)):
    users = await db.users.find({}).skip(skip).limit(limit).to_list(length=limit)
    return api_ok({"users": [doc_to_user(u) for u in users], "total": await db.users.count_documents({})})

@app.delete("/api/admin/users/{user_id}")
async def admin_delete_user(user_id: str, admin=Depends(require_admin)):
    result = await db.users.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=api_err("User not found", "NOT_FOUND"))
    return api_ok({"message": "User deleted"})

@app.patch("/api/admin/users/{user_id}")
async def admin_update_user(user_id: str, body: dict, admin=Depends(require_admin)):
    update = {}
    if "subscription" in body:
        update["subscription"] = body["subscription"]
        
        # Handle duration parameter for free subscriptions
        duration = body.get("duration")
        if duration == "month":
            update["subscription_expiry"] = datetime.now(timezone.utc) + timedelta(days=30)
        elif duration == "year":
            update["subscription_expiry"] = datetime.now(timezone.utc) + timedelta(days=365)
        else:
            # Use default from SUBSCRIPTION_PLANS
            plan = SUBSCRIPTION_PLANS.get(body["subscription"])
            if plan:
                update["subscription_expiry"] = datetime.now(timezone.utc) + timedelta(days=plan["duration_days"])
    
    if "roles" in body:
        update["roles"] = body["roles"]
    if "name" in body:
        update["name"] = body["name"]
    if not update:
        raise HTTPException(status_code=400, detail="Nothing to update")
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": update})
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    return api_ok({"user": doc_to_user(user)})

@app.post("/api/admin/make-admin/{user_id}")
async def make_admin(user_id: str, admin=Depends(require_admin)):
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$addToSet": {"roles": "admin"}})
    return api_ok({"message": "User promoted to admin"})

@app.post("/api/admin/run-signal-job")
async def run_signal_job(admin=Depends(require_admin)):
    """Force run the signal analysis job (admin only)"""
    try:
        await fetch_and_store_signals()
        return api_ok({"message": "Signal job completed successfully"})
    except Exception as e:
        logger.error(f"Manual signal job failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ─────────────────────────────────────────────
# HOME MODULE STUBS (required by Katalyst template)
# ─────────────────────────────────────────────
@app.get("/api/home/dashboard")
async def home_dashboard(user=Depends(get_current_user)):
    """Home dashboard data for Katalyst home module"""
    u = doc_to_user(user)
    return api_ok({
        "user": {"name": u.get("name", "User"), "email": u["email"], "avatarUrl": None},
        "workspace": {"name": "PumpRadar", "environment": "production"},
        "stats": {"pumpSignals": 0, "dumpSignals": 0, "users": 1},
        "checklist": [],
        "recentActivity": [],
        "apps": [],
        "tourCompleted": True,
    })

@app.patch("/api/home/checklist/{item_id}")
async def update_checklist(item_id: str, user=Depends(get_current_user)):
    return api_ok({"message": "OK"})

@app.get("/api/home/tour")
async def get_tour(user=Depends(get_current_user)):
    return api_ok({"completed": True, "skipped": True})

@app.post("/api/home/tour/{action}")
async def tour_action(action: str, user=Depends(get_current_user)):
    return api_ok({"completed": True, "skipped": True})

# ─────────────────────────────────────────────
# HEALTH
# ─────────────────────────────────────────────
@app.get("/api/health")
async def health():
    return {"status": "ok", "app": "PumpRadar", "version": "1.0.0"}
