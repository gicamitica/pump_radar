"""
PumpRadar - FastAPI Backend
Crypto pump/dump signal analyzer with AI, LunarCrush & CoinGecko
"""
# NOTICE FOR ANY AI/AGENT WORKING IN THIS REPO:
# Do not modify the frontend unless the user explicitly asks for it in the current conversation.
# If unsure, stop and ask before touching anything under frontend/.
import os
import asyncio
import logging
import uuid
import re
from collections import Counter
import base64
import hmac
import requests
import hashlib
import secrets
import struct
import httpx
import stripe
import google.generativeai as genai
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any, Annotated, Tuple
from urllib.parse import quote, unquote

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, Depends, status, Request, Response, Cookie
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from jose import JWTError, jwt
import resend
from crypto_pump_engine.pipeline import PumpEngineError
from crypto_pump_engine.router import get_pipeline as get_pump_engine_pipeline, router as pump_engine_router
try:
    from telethon import TelegramClient, events
    from telethon.errors import SessionPasswordNeededError
except Exception:
    TelegramClient = None
    events = None
    SessionPasswordNeededError = Exception

# ─────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.environ.get("JWT_EXPIRE_MINUTES", "10080"))
RESEND_API_KEY = os.environ["RESEND_API_KEY"]
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "noreply@arbitrajz.com")
LUNARCRUSH_API_KEY = os.environ["LUNARCRUSH_API_KEY"]
COINGECKO_API_KEY = os.environ.get("COINGECKO_API_KEY", "")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
STRIPE_API_KEY = os.environ["STRIPE_API_KEY"]
APP_URL = os.environ.get("APP_URL", "http://localhost:3000")
LOGO_URL = f"{APP_URL}/logo-pumpradar.png"
TELEGRAM_API_ID = os.environ.get("TELEGRAM_API_ID", "").strip()
TELEGRAM_API_HASH = os.environ.get("TELEGRAM_API_HASH", "").strip()
TELEGRAM_PHONE = os.environ.get("TELEGRAM_PHONE", "").strip()
TELEGRAM_SESSION_NAME = os.environ.get("TELEGRAM_SESSION_NAME", "pumpradar-telegram").strip() or "pumpradar-telegram"
TELEGRAM_LIVE_ENABLED = os.environ.get("TELEGRAM_LIVE_ENABLED", "false").strip().lower() in {"1", "true", "yes", "on"}
TELEGRAM_EARLY_SIGNAL_HOURS = 8
TELEGRAM_EARLY_SIGNAL_LIMIT = 8
X_API_KEY = os.environ.get("X_API_KEY", "").strip()
X_API_SECRET = os.environ.get("X_API_SECRET", "").strip()
X_BEARER_TOKEN = unquote(os.environ.get("X_BEARER_TOKEN", "").strip())
X_API_BASE = os.environ.get("X_API_BASE", "https://api.x.com/2").strip() or "https://api.x.com/2"
SUPER_ADMIN_EMAIL = os.environ.get("SUPER_ADMIN_EMAIL", "vault@pump.arbitrajz.com").strip().lower()
SUPER_ADMIN_PASSWORD = os.environ.get("SUPER_ADMIN_PASSWORD", "")
SUPER_ADMIN_TOTP_SECRET = os.environ.get("SUPER_ADMIN_TOTP_SECRET", "")
SUPER_ADMIN_ISSUER = os.environ.get("SUPER_ADMIN_ISSUER", "PumpRadar Super Admin")
SUPER_ADMIN_TOKEN_EXPIRE_HOURS = int(os.environ.get("SUPER_ADMIN_TOKEN_EXPIRE_HOURS", "12"))

# Configure Gemini
genai.configure(api_key=GEMINI_API_KEY)

# Configure Stripe
stripe.api_key = STRIPE_API_KEY

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
EXCHANGE_METADATA_CACHE: Dict[str, dict] = {}
COIN_TICKERS_CACHE: Dict[str, List[dict]] = {}
X_INTELLIGENCE_CACHE: Dict[str, dict] = {}
DASHBOARD_PAYLOAD_CACHE: Dict[str, dict] = {}
COIN_DETAIL_CACHE: Dict[str, dict] = {}
TELEGRAM_CONSENSUS_CACHE: Dict[str, dict] = {}
CROSS_PLATFORM_CACHE: Dict[str, dict] = {}
NEW_ALGORITHM_SIGNALS_CACHE: Dict[str, dict] = {}
TELEGRAM_SIGNAL_MAP_CACHE: Dict[str, dict] = {}
TELEGRAM_CALIBRATION_CACHE: Dict[str, dict] = {}
SOCIAL_INTELLIGENCE_CACHE: Dict[str, dict] = {}
COIN_MARKET_CACHE: Dict[str, dict] = {}
COIN_CHART_CACHE: Dict[str, dict] = {}
COIN_EXTENDED_DETAILS_CACHE: Dict[str, dict] = {}
HOLDER_DISTRIBUTION_CACHE: Dict[str, dict] = {}
GOPLUS_SECURITY_CACHE: Dict[str, dict] = {}
GOPLUS_RUGPULL_CACHE: Dict[str, dict] = {}
ORDERBOOK_CACHE: Dict[str, dict] = {}
DERIVATIVES_CACHE: Dict[str, dict] = {}
CASE_REPLAY_CACHE: Dict[str, dict] = {}
SIGNAL_SCAN_LOCK = asyncio.Lock()
SIGNAL_SCAN_STATE: Dict[str, Any] = {
    "running": False,
    "trigger": None,
    "started_at": None,
    "finished_at": None,
    "last_snapshot_at": None,
    "last_error": None,
    "last_result": None,
}
telegram_client: Any = None
telegram_listener_task: Optional[asyncio.Task] = None
telegram_auth_state: Dict[str, Any] = {}
COINGECKO_NETWORK_MAP = {
    "ethereum": "eth",
    "binance-smart-chain": "bsc",
    "polygon-pos": "polygon_pos",
    "arbitrum-one": "arbitrum",
    "optimistic-ethereum": "optimism",
    "avalanche": "avax",
    "base": "base",
    "solana": "solana",
}
GOPLUS_CHAIN_MAP = {
    "ethereum": "1",
    "binance-smart-chain": "56",
    "polygon-pos": "137",
    "arbitrum-one": "42161",
    "optimistic-ethereum": "10",
    "avalanche": "43114",
    "base": "8453",
}

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
app.include_router(pump_engine_router)

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

def build_signal_scan_status() -> dict:
    def to_iso(value: Any) -> Optional[str]:
        if isinstance(value, datetime):
            return value.isoformat()
        return value

    return {
        "running": bool(SIGNAL_SCAN_STATE.get("running")),
        "trigger": SIGNAL_SCAN_STATE.get("trigger"),
        "started_at": to_iso(SIGNAL_SCAN_STATE.get("started_at")),
        "finished_at": to_iso(SIGNAL_SCAN_STATE.get("finished_at")),
        "last_snapshot_at": to_iso(SIGNAL_SCAN_STATE.get("last_snapshot_at")),
        "last_error": SIGNAL_SCAN_STATE.get("last_error"),
        "last_result": SIGNAL_SCAN_STATE.get("last_result"),
    }

def get_memory_cache(cache: Dict[str, dict], key: str, ttl_seconds: int) -> Optional[Any]:
    now = datetime.now(timezone.utc)
    cached = cache.get(key)
    if not cached:
        return None
    cached_at = cached.get("timestamp")
    if not isinstance(cached_at, datetime):
        return None
    if (now - cached_at).total_seconds() >= ttl_seconds:
        cache.pop(key, None)
        return None
    return cached.get("data")

def set_memory_cache(cache: Dict[str, dict], key: str, data: Any) -> Any:
    cache[key] = {
        "timestamp": datetime.now(timezone.utc),
        "data": data,
    }
    return data

def looks_like_placeholder(value: str, prefix: str) -> bool:
    return not value or value.startswith(f"YOUR_{prefix}") or value.endswith("_HERE")

def hash_password(p: str) -> str:
    return pwd_ctx.hash(p)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_ctx.verify(plain, hashed)

def create_token(
    user_id: str,
    email: str,
    expires_delta: Optional[timedelta] = None,
    token_type: str = "access",
) -> str:
    exp = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=JWT_EXPIRE_MINUTES))
    payload = {
        "sub": user_id,
        "email": email,
        "exp": exp,
        "type": token_type,
        "jti": str(uuid.uuid4()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])

def normalize_totp_secret(secret: str) -> str:
    return re.sub(r"[^A-Z2-7]", "", secret.upper())

def build_totp_code(secret: str, ts: Optional[int] = None, interval_seconds: int = 30) -> str:
    normalized = normalize_totp_secret(secret)
    if not normalized:
        return ""
    padding = "=" * (-len(normalized) % 8)
    key = base64.b32decode(normalized + padding, casefold=True)
    timestamp = ts or int(datetime.now(timezone.utc).timestamp())
    counter = timestamp // interval_seconds
    digest = hmac.new(key, counter.to_bytes(8, "big"), hashlib.sha1).digest()
    offset = digest[-1] & 0x0F
    binary = struct.unpack(">I", digest[offset:offset + 4])[0] & 0x7FFFFFFF
    return str(binary % 1_000_000).zfill(6)

def verify_totp_code(secret: str, code: str, window: int = 1) -> bool:
    normalized_code = re.sub(r"\D", "", code or "")
    if len(normalized_code) != 6:
        return False
    now_ts = int(datetime.now(timezone.utc).timestamp())
    for step in range(-window, window + 1):
        if build_totp_code(secret, ts=now_ts + (step * 30)) == normalized_code:
            return True
    return False

def build_super_admin_setup_uri(email: str, secret: str) -> str:
    account_name = quote(email)
    issuer = quote(SUPER_ADMIN_ISSUER)
    return f"otpauth://totp/{issuer}:{account_name}?secret={secret}&issuer={issuer}&algorithm=SHA1&digits=6&period=30"

async def ensure_super_admin_seeded() -> Optional[dict]:
    if not SUPER_ADMIN_EMAIL:
        return None

    existing = await db.super_admin_accounts.find_one({"email": SUPER_ADMIN_EMAIL})
    normalized_secret = normalize_totp_secret(SUPER_ADMIN_TOTP_SECRET)
    if not SUPER_ADMIN_PASSWORD or not normalized_secret:
        logger.warning("Super admin credentials not fully configured in environment")
        return None

    if existing:
        updates: Dict[str, Any] = {}
        if not verify_password(SUPER_ADMIN_PASSWORD, existing.get("password_hash", "")):
            updates["password_hash"] = hash_password(SUPER_ADMIN_PASSWORD)
        if existing.get("totp_secret") != normalized_secret:
            updates["totp_secret"] = normalized_secret
            updates["totp_uri"] = build_super_admin_setup_uri(SUPER_ADMIN_EMAIL, normalized_secret)
        if existing.get("active") is not True:
            updates["active"] = True
        if updates:
            updates["updated_at"] = datetime.now(timezone.utc)
            await db.super_admin_accounts.update_one({"_id": existing["_id"]}, {"$set": updates})
            existing = await db.super_admin_accounts.find_one({"_id": existing["_id"]})
        return existing

    super_admin_doc = {
        "email": SUPER_ADMIN_EMAIL,
        "password_hash": hash_password(SUPER_ADMIN_PASSWORD),
        "totp_secret": normalized_secret,
        "totp_uri": build_super_admin_setup_uri(SUPER_ADMIN_EMAIL, normalized_secret),
        "active": True,
        "failed_attempts": 0,
        "locked_until": None,
        "last_login_at": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    result = await db.super_admin_accounts.insert_one(super_admin_doc)
    super_admin_doc["_id"] = result.inserted_id
    return super_admin_doc

async def get_current_super_admin(creds: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    if not creds:
        raise HTTPException(status_code=401, detail=api_err("Super admin authentication required", "SUPER_ADMIN_AUTH_REQUIRED"))

    try:
        payload = decode_token(creds.credentials)
        if payload.get("type") != "super_admin":
            raise HTTPException(status_code=401, detail=api_err("Invalid super admin session", "INVALID_SUPER_ADMIN_TOKEN"))

        admin_id = payload.get("sub")
        admin_doc = await db.super_admin_accounts.find_one({"_id": ObjectId(admin_id), "active": True})
        if not admin_doc:
            raise HTTPException(status_code=401, detail=api_err("Super admin account not found", "SUPER_ADMIN_NOT_FOUND"))
        return admin_doc
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail=api_err("Invalid super admin session", "INVALID_SUPER_ADMIN_TOKEN"))

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

    token = creds.credentials

    if token.startswith("user-access-"):
        legacy_auth_id = token.replace("user-access-", "", 1)
        user = await db.users.find_one({"legacy_auth_id": legacy_auth_id})
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user

    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token")
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
        if payload.get("type") != "access":
            return None
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
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0f172a;border-radius:12px">
      <div style="text-align:center;margin-bottom:24px">
        <img src="{LOGO_URL}" alt="PumpRadar" style="width:64px;height:64px;border-radius:12px" />
        <h2 style="color:#fff;margin:16px 0 0 0">Verify your email to continue</h2>
      </div>
      <div style="background:#1e293b;padding:20px;border-radius:8px;color:#fff">
        <p style="margin:0 0 16px 0">Hi {name},</p>
        <p style="margin:0 0 16px 0;color:#94a3b8">Please verify your email address to continue to PumpRadar's secure 7-day trial setup.</p>
        <p style="margin:0 0 20px 0;color:#94a3b8">After verification, we will sign you in automatically and send you to Stripe checkout, where the client adds a card to start the 7-day free trial.</p>
        <div style="text-align:center">
          <a href="{verify_url}" style="background:linear-gradient(135deg,#10b981,#059669);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:bold">
            Verify Email And Continue
          </a>
        </div>
        <div style="margin-top:20px;padding:14px;border-radius:8px;background:#0f172a;border:1px solid #334155">
          <p style="margin:0 0 8px 0;color:#cbd5e1;font-size:13px">If the button does not appear or does not work, open this verification link manually:</p>
          <p style="margin:0;word-break:break-all">
            <a href="{verify_url}" style="color:#38bdf8;font-size:13px;text-decoration:underline">{verify_url}</a>
          </p>
        </div>
        <p style="color:#64748b;font-size:12px;margin:20px 0 0 0;text-align:center">This link expires in 24 hours.</p>
      </div>
    </div>"""
    text = (
        f"Hi {name},\n\n"
        "Please verify your email to continue to PumpRadar's secure 7-day trial setup.\n\n"
        "Open this link to verify your email and continue:\n"
        f"{verify_url}\n\n"
        "After verification, you will be signed in automatically and sent to secure card setup for the 7-day free trial.\n"
        "This link expires in 24 hours.\n"
    )
    try:
        await asyncio.to_thread(resend.Emails.send, {
            "from": f"PumpRadar <{SENDER_EMAIL}>",
            "to": [email],
            "subject": "Verify your email to continue your PumpRadar trial",
            "html": html,
            "text": text,
        })
    except Exception as e:
        logger.error(f"Email send error: {e}")

async def send_reset_email(email: str, token: str):
    reset_url = f"{APP_URL}/auth/reset-password?token={token}"
    html = f"""
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0f172a;border-radius:12px">
      <div style="text-align:center;margin-bottom:24px">
        <img src="{LOGO_URL}" alt="PumpRadar" style="width:64px;height:64px;border-radius:12px" />
        <h2 style="color:#fff;margin:16px 0 0 0">Password Reset</h2>
      </div>
      <div style="background:#1e293b;padding:20px;border-radius:8px;color:#fff">
        <p style="margin:0 0 16px 0;color:#94a3b8">You requested a password reset. Click the button below:</p>
        <div style="text-align:center">
          <a href="{reset_url}" style="background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:bold">
            Reset Password
          </a>
        </div>
        <p style="color:#64748b;font-size:12px;margin:20px 0 0 0;text-align:center">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
      </div>
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

async def send_trial_started_email(email: str, name: str, plan_name: str, trial_end: datetime):
    billing_dt = trial_end.astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    html = f"""
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0f172a;border-radius:12px;color:#fff">
      <div style="text-align:center;margin-bottom:24px">
        <img src="{LOGO_URL}" alt="PumpRadar" style="width:64px;height:64px;border-radius:12px" />
        <h2 style="margin:16px 0 0 0">Your 7-day trial is live</h2>
      </div>
      <div style="background:#1e293b;padding:20px;border-radius:8px">
        <p>Hi {name or 'Trader'},</p>
        <p>Your card-backed trial for the <strong>{plan_name}</strong> plan has started.</p>
        <p>The trial ends on <strong>{billing_dt}</strong>. If you keep the subscription active, Stripe will automatically start the paid plan after the trial.</p>
        <p>Billing details were collected securely by Stripe during checkout.</p>
        <div style="text-align:center;margin-top:20px">
          <a href="{APP_URL}/dashboard" style="background:linear-gradient(135deg,#10b981,#059669);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:bold">
            Open PumpRadar
          </a>
        </div>
      </div>
    </div>"""
    try:
        await asyncio.to_thread(resend.Emails.send, {
            "from": f"PumpRadar <{SENDER_EMAIL}>",
            "to": [email],
            "subject": f"Your PumpRadar {plan_name} trial has started",
            "html": html,
        })
    except Exception as e:
        logger.error(f"Trial started email error: {e}")

async def send_trial_reminder_email(email: str, name: str, plan_name: str, trial_end: datetime):
    billing_dt = trial_end.astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    html = f"""
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0f172a;border-radius:12px;color:#fff">
      <div style="text-align:center;margin-bottom:24px">
        <img src="{LOGO_URL}" alt="PumpRadar" style="width:64px;height:64px;border-radius:12px" />
        <h2 style="margin:16px 0 0 0">Your trial ends soon</h2>
      </div>
      <div style="background:#1e293b;padding:20px;border-radius:8px">
        <p>Hi {name or 'Trader'},</p>
        <p>Your <strong>{plan_name}</strong> trial ends on <strong>{billing_dt}</strong>.</p>
        <p>If you do nothing, the subscription will continue and Stripe will charge the saved payment method. Cancel before the deadline if you do not want the paid plan.</p>
        <div style="text-align:center;margin-top:20px">
          <a href="{APP_URL}/subscription" style="background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:bold">
            Review Subscription
          </a>
        </div>
      </div>
    </div>"""
    try:
        await asyncio.to_thread(resend.Emails.send, {
            "from": f"PumpRadar <{SENDER_EMAIL}>",
            "to": [email],
            "subject": f"Your PumpRadar trial for {plan_name} ends soon",
            "html": html,
        })
    except Exception as e:
        logger.error(f"Trial reminder email error: {e}")

async def send_subscription_activated_email(email: str, name: str, plan_name: str, expiry: datetime):
    expiry_dt = expiry.astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    html = f"""
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0f172a;border-radius:12px;color:#fff">
      <div style="text-align:center;margin-bottom:24px">
        <img src="{LOGO_URL}" alt="PumpRadar" style="width:64px;height:64px;border-radius:12px" />
        <h2 style="margin:16px 0 0 0">Subscription activated</h2>
      </div>
      <div style="background:#1e293b;padding:20px;border-radius:8px">
        <p>Hi {name or 'Trader'},</p>
        <p>Your <strong>{plan_name}</strong> subscription is now active and billing has been confirmed.</p>
        <p>Your current access window runs until <strong>{expiry_dt}</strong>.</p>
        <div style="text-align:center;margin-top:20px">
          <a href="{APP_URL}/dashboard" style="background:linear-gradient(135deg,#10b981,#059669);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:bold">
            Open Dashboard
          </a>
        </div>
      </div>
    </div>"""
    try:
        await asyncio.to_thread(resend.Emails.send, {
            "from": f"PumpRadar <{SENDER_EMAIL}>",
            "to": [email],
            "subject": f"Your PumpRadar {plan_name} subscription is active",
            "html": html,
        })
    except Exception as e:
        logger.error(f"Subscription activation email error: {e}")

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

class ResendVerificationDTO(BaseModel):
    email: EmailStr

class SuperAdminLoginDTO(BaseModel):
    email: EmailStr
    password: str
    totpCode: str = Field(..., min_length=6, max_length=8)

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
    
    user_doc = {
        "email": dto.email.lower(),
        "name": dto.name,
        "password_hash": hash_password(dto.password),
        "roles": ["viewer"],
        "email_verified": False,
        "verify_token": verify_token,
        "verify_token_expiry": verify_expiry,
        "subscription": "free",
        "subscription_expiry": None,
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    # Send verification email
    asyncio.create_task(send_verification_email(dto.email, dto.name, verify_token))

    return api_ok({
        "user": doc_to_user(user_doc),
        "message": "Account created! Please check your email to verify.",
    })

@app.post("/api/auth/login")
async def login(dto: LoginDTO):
    user = await db.users.find_one({"email": dto.email.lower()})
    if not user or not verify_password(dto.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail=api_err("Incorrect email or password", "INVALID_CREDENTIALS"))

    if not user.get("email_verified"):
        raise HTTPException(status_code=403, detail=api_err("Please verify your email before signing in", "EMAIL_NOT_VERIFIED"))

    expire = timedelta(days=30) if dto.remember else timedelta(minutes=JWT_EXPIRE_MINUTES)
    access_token = create_token(str(user["_id"]), user["email"], expire, token_type="access")
    refresh_token = create_token(str(user["_id"]), user["email"], timedelta(days=30), token_type="refresh")
    
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
    access_token = create_token(str(user["_id"]), user["email"], token_type="access")
    refresh_token = create_token(str(user["_id"]), user["email"], timedelta(days=30), token_type="refresh")
    return api_ok({
        "message": "Email verified successfully!",
        "user": doc_to_user(user),
        "accessToken": access_token,
        "refreshToken": refresh_token,
    })

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
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        user_id = payload.get("sub")
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        new_access = create_token(str(user["_id"]), user["email"], token_type="access")
        new_refresh = create_token(str(user["_id"]), user["email"], timedelta(days=30), token_type="refresh")
        return api_ok({"accessToken": new_access, "refreshToken": new_refresh})
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@app.post("/api/auth/resend-verification")
async def resend_verification(dto: ResendVerificationDTO):
    """Resend verification email without requiring login."""
    user = await db.users.find_one({"email": dto.email.lower()})
    if not user:
        return api_ok({"message": "If this email exists, a verification email has been sent."})

    if user.get("email_verified"):
        return api_ok({"message": "Email already verified"})

    verify_token = secrets.token_urlsafe(32)
    verify_expiry = datetime.now(timezone.utc) + timedelta(hours=24)

    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"verify_token": verify_token, "verify_token_expiry": verify_expiry}}
    )

    asyncio.create_task(send_verification_email(user["email"], user.get("name", ""), verify_token))

    return api_ok({"message": "Verification email sent! Please check your inbox."})

# ─────────────────────────────────────────────
# SUPER ADMIN AUTH
# ─────────────────────────────────────────────
@app.post("/api/super-admin/login")
async def super_admin_login(dto: SuperAdminLoginDTO):
    admin_doc = await ensure_super_admin_seeded()
    if not admin_doc or dto.email.lower() != admin_doc.get("email"):
        raise HTTPException(status_code=401, detail=api_err("Invalid super admin credentials", "INVALID_SUPER_ADMIN_CREDENTIALS"))

    now = datetime.now(timezone.utc)
    locked_until = admin_doc.get("locked_until")
    if isinstance(locked_until, str):
        locked_until = datetime.fromisoformat(locked_until.replace("Z", "+00:00"))
    if locked_until and locked_until.tzinfo is None:
        locked_until = locked_until.replace(tzinfo=timezone.utc)

    if locked_until and locked_until > now:
        raise HTTPException(
            status_code=423,
            detail=api_err(
                f"Super admin access is temporarily locked until {locked_until.astimezone(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
                "SUPER_ADMIN_LOCKED",
            ),
        )

    password_ok = verify_password(dto.password, admin_doc.get("password_hash", ""))
    totp_ok = verify_totp_code(admin_doc.get("totp_secret", ""), dto.totpCode)

    if not password_ok or not totp_ok:
        failed_attempts = int(admin_doc.get("failed_attempts", 0)) + 1
        update_doc: Dict[str, Any] = {
            "failed_attempts": failed_attempts,
            "updated_at": now,
        }
        if failed_attempts >= 5:
            update_doc["failed_attempts"] = 0
            update_doc["locked_until"] = now + timedelta(minutes=15)
        await db.super_admin_accounts.update_one(
            {"_id": admin_doc["_id"]},
            {"$set": update_doc},
        )
        raise HTTPException(status_code=401, detail=api_err("Invalid super admin credentials", "INVALID_SUPER_ADMIN_CREDENTIALS"))

    await db.super_admin_accounts.update_one(
        {"_id": admin_doc["_id"]},
        {"$set": {"failed_attempts": 0, "locked_until": None, "last_login_at": now, "updated_at": now}},
    )
    refreshed = await db.super_admin_accounts.find_one({"_id": admin_doc["_id"]})
    access_token = create_token(
        str(admin_doc["_id"]),
        admin_doc["email"],
        timedelta(hours=SUPER_ADMIN_TOKEN_EXPIRE_HOURS),
        token_type="super_admin",
    )

    return api_ok({
        "accessToken": access_token,
        "account": {
            "email": refreshed["email"],
            "issuer": SUPER_ADMIN_ISSUER,
            "lastLoginAt": refreshed.get("last_login_at").isoformat() if refreshed.get("last_login_at") else None,
        },
    })

@app.get("/api/super-admin/me")
async def super_admin_me(admin=Depends(get_current_super_admin)):
    return api_ok({
        "account": {
            "email": admin["email"],
            "issuer": SUPER_ADMIN_ISSUER,
            "lastLoginAt": admin.get("last_login_at").isoformat() if admin.get("last_login_at") else None,
        }
    })

# ─────────────────────────────────────────────
# GOOGLE OAUTH
# ─────────────────────────────────────────────
# Google OAuth session verification endpoint
GOOGLE_AUTH_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"

class GoogleAuthDTO(BaseModel):
    session_id: str

@app.post("/api/auth/google")
async def google_auth(dto: GoogleAuthDTO, response: Response):
    """Exchange Google OAuth session_id for user session"""
    try:
        # Call Google Auth to get user data
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                GOOGLE_AUTH_URL,
                headers={"X-Session-ID": dto.session_id},
                timeout=10.0
            )
            if resp.status_code != 200:
                logger.error(f"Google Auth error: {resp.status_code} - {resp.text}")
                raise HTTPException(status_code=401, detail=api_err("Google authentication failed", "GOOGLE_AUTH_FAILED"))
            
            google_data = resp.json()
        
        email = google_data.get("email", "").lower()
        name = google_data.get("name", "")
        picture = google_data.get("picture", "")
        
        if not email:
            raise HTTPException(status_code=400, detail=api_err("No email from Google", "NO_EMAIL"))
        
        # Check if user exists
        user = await db.users.find_one({"email": email})
        
        if user:
            # Update existing user with Google info
            await db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {
                    "name": name or user.get("name", ""),
                    "avatar": picture,
                    "email_verified": True,  # Google emails are verified
                    "google_id": google_data.get("id"),
                    "last_login": datetime.now(timezone.utc),
                }}
            )
            user = await db.users.find_one({"_id": user["_id"]})
        else:
            # Create new user with free access until checkout starts a trial
            user_doc = {
                "email": email,
                "name": name,
                "avatar": picture,
                "google_id": google_data.get("id"),
                "password_hash": "",  # No password for Google users
                "roles": ["viewer"],
                "email_verified": True,
                "subscription": "free",
                "subscription_expiry": None,
                "created_at": datetime.now(timezone.utc),
                "last_login": datetime.now(timezone.utc),
            }
            result = await db.users.insert_one(user_doc)
            user_doc["_id"] = result.inserted_id
            user = user_doc
        
        # Create JWT tokens
        access_token = create_token(str(user["_id"]), user["email"], token_type="access")
        refresh_token = create_token(str(user["_id"]), user["email"], timedelta(days=30), token_type="refresh")
        
        logger.info(f"Google auth successful for {email}")
        
        return api_ok({
            "user": doc_to_user(user),
            "accessToken": access_token,
            "refreshToken": refresh_token,
        })
        
    except HTTPException:
        raise
    except httpx.RequestError as e:
        logger.error(f"Google Auth upstream error: {e}")
        raise HTTPException(
            status_code=503,
            detail=api_err("Google authentication is temporarily unavailable", "GOOGLE_AUTH_UNAVAILABLE"),
        )
    except Exception as e:
        logger.error(f"Google auth error: {e}")
        raise HTTPException(status_code=500, detail=api_err("Google authentication failed", "GOOGLE_AUTH_FAILED"))

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

def get_coingecko_markets(per_page: int = 250, pages: int = 2) -> List[dict]:
    try:
        url = "https://api.coingecko.com/api/v3/coins/markets"
        all_rows: List[dict] = []
        seen_ids: set[str] = set()
        for page in range(1, max(1, pages) + 1):
            params = {
                "vs_currency": "usd",
                "order": "volume_desc",
                "per_page": min(max(1, per_page), 250),
                "page": page,
                "price_change_percentage": "1h,24h,7d",
                "sparkline": "false",
            }
            r = requests.get(url, params=params, headers=CG_HEADERS, timeout=30)
            if r.status_code == 429:
                logger.warning("CoinGecko rate limit on markets page %s - waiting 20s", page)
                import time
                time.sleep(20)
                r = requests.get(url, params=params, headers=CG_HEADERS, timeout=30)
            r.raise_for_status()
            page_rows = r.json() or []
            if not page_rows:
                break
            for row in page_rows:
                row_id = (row.get("id") or f"{row.get('symbol', '')}:{row.get('name', '')}").strip().lower()
                if not row_id or row_id in seen_ids:
                    continue
                seen_ids.add(row_id)
                all_rows.append(row)
        return all_rows
    except Exception as e:
        logger.error(f"CoinGecko error: {e}")
        return []

def get_coingecko_market_snapshot(symbol: str, preferred_name: Optional[str] = None, preferred_coin_id: Optional[str] = None) -> dict:
    resolved_coin_id = (preferred_coin_id or "").strip() or resolve_coingecko_coin_id(symbol, preferred_name=preferred_name)
    if not resolved_coin_id:
        return {}
    cache_key = f"{resolved_coin_id}::market"
    cached = get_memory_cache(COIN_MARKET_CACHE, cache_key, ttl_seconds=120)
    if cached is not None:
        return cached
    try:
        resp = requests.get(
            "https://api.coingecko.com/api/v3/coins/markets",
            params={
                "vs_currency": "usd",
                "ids": resolved_coin_id,
                "price_change_percentage": "1h,24h,7d",
            },
            headers=CG_HEADERS,
            timeout=15,
        )
        if resp.status_code == 200 and resp.json():
            return set_memory_cache(COIN_MARKET_CACHE, cache_key, (resp.json() or [])[0])
    except Exception as e:
        logger.error("CoinGecko market snapshot error for %s: %s", resolved_coin_id, e)
    return {}

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
        if r.status_code == 402:
            logger.warning("LunarCrush key is accepted but the current plan does not include this endpoint - using CoinGecko only")
            return []
        logger.warning(f"LunarCrush unavailable (status {r.status_code}) - using CoinGecko only")
        return []
    except Exception as e:
        logger.error(f"LunarCrush error: {e}")
        return []

def parse_lunarcrush_topic_markdown(markdown_text: str) -> dict:
    def extract_number(pattern: str, cast=float):
        match = re.search(pattern, markdown_text, re.IGNORECASE)
        if not match:
            return None
        raw = match.group(1).replace(",", "").replace("$", "").strip()
        try:
            return cast(raw)
        except Exception:
            return None

    def extract_block(header: str) -> List[str]:
        match = re.search(rf"{re.escape(header)}:\n((?:- .+\n)+)", markdown_text, re.IGNORECASE)
        if not match:
            return []
        block = match.group(1)
        return [line[2:].strip() for line in block.strip().splitlines() if line.startswith("- ")]

    def extract_posts(section_title_pattern: str) -> List[dict]:
        section_match = re.search(
            rf"{section_title_pattern}.*?\n\n(.*?)(?:\n### |\Z)",
            markdown_text,
            re.IGNORECASE | re.DOTALL,
        )
        if not section_match:
            return []
        section = section_match.group(1)
        pattern = re.compile(
            r'"(?P<text>.*?)"\s+\n\[(?P<label>[^\]]+)\]\((?P<url>[^)]+)\)\s+(?P<meta>.*?)(?:\n\n|\Z)',
            re.DOTALL,
        )
        items = []
        for match in pattern.finditer(section):
            items.append({
                "text": match.group("text").strip(),
                "label": match.group("label").strip(),
                "url": match.group("url").strip(),
                "meta": " ".join(match.group("meta").split()),
            })
            if len(items) >= 4:
                break
        return items

    def extract_accounts() -> List[str]:
        match = re.search(
            r"\*\*Top accounts mentioned or mentioned by\*\*\n(.*?)(?:\n\*\*|\n### |\Z)",
            markdown_text,
            re.IGNORECASE | re.DOTALL,
        )
        if not match:
            return []
        handles = re.findall(r"\[@?([A-Za-z0-9_\.]+)\]\(", match.group(1))
        deduped = []
        seen = set()
        for handle in handles:
            normalized = handle.strip().lstrip("@")
            if not normalized:
                continue
            lowered = normalized.lower()
            if lowered in seen:
                continue
            seen.add(lowered)
            deduped.append(normalized)
            if len(deduped) >= 8:
                break
        return deduped

    lines = [line.strip() for line in markdown_text.splitlines() if line.strip()]
    title_line = next((line for line in lines if line.startswith("# ")), "").replace("# ", "").strip()
    summary = ""
    if title_line:
        try:
            title_index = lines.index(f"# {title_line}")
        except ValueError:
            title_index = 0
        for line in lines[title_index + 1:]:
            if not line.startswith("[") and not line.startswith("###") and not line.startswith("*") and not line.startswith("-"):
                summary = line
                break

    insights = re.findall(r"^- (.+)$", markdown_text, re.MULTILINE)
    return {
        "title": title_line,
        "summary": summary,
        "price_usd": extract_number(r"### Price:\s*\$([\d,]+(?:\.\d+)?)"),
        "alt_rank": extract_number(r"### AltRank:\s*([\d,]+)", int),
        "galaxy_score": extract_number(r"### Galaxy Score:\s*([\d,]+(?:\.\d+)?)"),
        "engagements_24h": extract_number(r"### Engagements:\s*([\d,]+)", int),
        "mentions_24h": extract_number(r"### Mentions:\s*([\d,]+)", int),
        "creators_24h": extract_number(r"### Creators:\s*([\d,]+)", int),
        "sentiment_pct": extract_number(r"### Sentiment:\s*([\d,]+)%", int),
        "social_dominance_pct": extract_number(r"### Social Dominance:\s*([\d,]+(?:\.\d+)?)"),
        "insights": insights[:6],
        "supportive_themes": extract_block("Most Supportive Themes"),
        "critical_themes": extract_block("Most Critical Themes"),
        "top_accounts": extract_accounts(),
        "top_news": extract_posts(r"### Top .*? News"),
        "top_social_posts": extract_posts(r"### Top .*? Social Posts"),
        "source": "LunarCrush AI",
        "limited_mode": "Limited data mode" in markdown_text,
    }

def parse_lunarcrush_creator_markdown(markdown_text: str) -> dict:
    def extract_number(pattern: str, cast=float):
        match = re.search(pattern, markdown_text, re.IGNORECASE)
        if not match:
            return None
        raw = match.group(1).replace(",", "").replace("$", "").strip()
        try:
            return cast(raw)
        except Exception:
            return None

    def extract_list_block(header_pattern: str, item_pattern: str) -> List[str]:
        match = re.search(header_pattern, markdown_text, re.IGNORECASE | re.DOTALL)
        if not match:
            return []
        items = re.findall(item_pattern, match.group(1), re.IGNORECASE)
        deduped = []
        seen = set()
        for item in items:
            normalized = item.strip()
            lowered = normalized.lower()
            if not normalized or lowered in seen:
                continue
            seen.add(lowered)
            deduped.append(normalized)
            if len(deduped) >= 8:
                break
        return deduped

    def extract_posts(section_title_pattern: str) -> List[dict]:
        section_match = re.search(
            rf"{section_title_pattern}.*?\n\n(.*?)(?:\n### |\Z)",
            markdown_text,
            re.IGNORECASE | re.DOTALL,
        )
        if not section_match:
            return []
        section = section_match.group(1)
        pattern = re.compile(
            r'"(?P<text>.*?)"\s+\n\[(?P<label>[^\]]+)\]\((?P<url>[^)]+)\)\s+(?P<meta>.*?)(?:\n\n|\Z)',
            re.DOTALL,
        )
        items = []
        for match in pattern.finditer(section):
            items.append({
                "text": match.group("text").strip(),
                "label": match.group("label").strip(),
                "url": match.group("url").strip(),
                "meta": " ".join(match.group("meta").split()),
            })
            if len(items) >= 3:
                break
        return items

    lines = [line.strip() for line in markdown_text.splitlines() if line.strip()]
    title_line = next((line for line in lines if line.startswith("# ")), "").replace("# ", "").strip()
    handle_match = re.search(r"@([A-Za-z0-9_\.]+)", title_line)
    summary = ""
    if title_line:
        try:
            title_index = lines.index(f"# {title_line}")
        except ValueError:
            title_index = 0
        for line in lines[title_index + 1:]:
            if not line.startswith("[") and not line.startswith("###") and not line.startswith("*") and not line.startswith("-"):
                summary = line
                break

    return {
        "title": title_line,
        "screen_name": handle_match.group(1) if handle_match else None,
        "summary": summary,
        "engagements": extract_number(r"### Engagements:\s*([\d,]+)", int),
        "mentions": extract_number(r"### Mentions:\s*([\d,]+)", int),
        "followers": extract_number(r"### Followers:\s*([\d,]+)", int),
        "creator_rank": extract_number(r"### CreatorRank:\s*([\d,]+)", int),
        "influence_topics": extract_list_block(
            r"\*\*Social topic influence\*\*\n(.*?)(?:\n\*\*|\n### |\Z)",
            r"\[([^\]]+)\]\(",
        ),
        "top_assets": extract_list_block(
            r"\*\*Top assets mentioned\*\*\n(.*?)(?:\n### |\Z)",
            r"\[([^\]]+)\]\(",
        ),
        "top_social_posts": extract_posts(r"### Top .*? Social Posts"),
        "source": "LunarCrush AI",
        "limited_mode": "Limited data mode" in markdown_text,
    }

def score_lunarcrush_creator_intelligence(creator: dict, asset_symbol: Optional[str] = None, asset_name: Optional[str] = None) -> dict:
    followers = int(creator.get("followers") or 0)
    engagements = int(creator.get("engagements") or 0)
    mentions = int(creator.get("mentions") or 0)
    creator_rank = int(creator.get("creator_rank") or 0)
    top_assets = creator.get("top_assets") or []
    influence_topics = creator.get("influence_topics") or []
    summary = (creator.get("summary") or "").lower()

    follower_score = min(22, followers / 20_000)
    engagement_score = min(20, engagements / 2_500)
    mention_score = min(12, mentions * 0.6)
    engagement_rate = (engagements / followers * 100) if followers else 0
    engagement_rate_score = min(12, engagement_rate * 2.5)

    if creator_rank > 0:
        if creator_rank <= 10_000:
            rank_score = 22
        elif creator_rank <= 50_000:
            rank_score = 18
        elif creator_rank <= 250_000:
            rank_score = 12
        elif creator_rank <= 1_000_000:
            rank_score = 7
        else:
            rank_score = 3
    else:
        rank_score = 0

    asset_focus_hits = 0
    asset_tokens = {token.lower() for token in [asset_symbol, asset_name] if token}
    searchable_blocks = [str(item).lower() for item in top_assets + influence_topics]
    if asset_tokens:
        for token in asset_tokens:
            if any(token in block for block in searchable_blocks) or token in summary:
                asset_focus_hits += 1
    asset_focus_score = min(12, asset_focus_hits * 6)

    crypto_focus_score = 6 if any(
        keyword in " ".join(searchable_blocks)
        for keyword in ["crypto", "bitcoin", "memecoin", "altcoin", "defi", "pump"]
    ) else 0

    trust_score = round(min(
        100,
        follower_score +
        engagement_score +
        mention_score +
        engagement_rate_score +
        rank_score +
        asset_focus_score +
        crypto_focus_score
    ))

    if trust_score >= 75:
        trust_badge = "High Conviction Voice"
    elif trust_score >= 58:
        trust_badge = "Credible Amplifier"
    elif trust_score >= 40:
        trust_badge = "Speculative Amplifier"
    else:
        trust_badge = "Low-Signal Account"

    if trust_score >= 72:
        influence_tier = "strong"
    elif trust_score >= 55:
        influence_tier = "credible"
    elif trust_score >= 40:
        influence_tier = "speculative"
    else:
        influence_tier = "thin"

    risk_flags: List[str] = []
    if followers < 5_000 and engagements > 5_000:
        risk_flags.append("Engagement concentration is unusually high relative to follower base.")
    if creator_rank and creator_rank > 500_000:
        risk_flags.append("Creator rank is weak, so narrative durability is less reliable.")
    if asset_tokens and asset_focus_score == 0:
        risk_flags.append("Creator is discussing the wider narrative more than this exact asset.")

    creator["trust_score"] = trust_score
    creator["trust_badge"] = trust_badge
    creator["influence_tier"] = influence_tier
    creator["engagement_rate_pct"] = round(engagement_rate, 2) if engagement_rate else 0
    creator["asset_focus_score"] = asset_focus_score
    creator["crypto_focus_score"] = crypto_focus_score
    creator["risk_flags"] = risk_flags
    return creator

def build_coin_cross_platform_consensus(
    *,
    symbol: str,
    signal_type: str,
    signal_strength: float,
    manipulation_profile: dict,
    decision_engine: Optional[dict],
    lunar_topic: Optional[dict],
    lunar_creators: Optional[List[dict]],
    is_trending: bool,
) -> dict:
    lunar_creators = lunar_creators or []
    telegram_mentions = int(manipulation_profile.get("telegram_mentions") or 0)
    telegram_sources = int(manipulation_profile.get("telegram_sources") or 0)
    coordination = float(manipulation_profile.get("coordinated_hype_score") or 0)
    social_burst = float(manipulation_profile.get("social_burst_score") or 0)
    dump_risk = float(manipulation_profile.get("dump_risk_score") or 0)
    manipulation_score = float(manipulation_profile.get("manipulation_score") or 0)
    stage = manipulation_profile.get("stage") or "active"

    market_score = min(100, signal_strength * 0.55 + manipulation_score * 0.45)
    telegram_score = min(100, coordination * 0.55 + telegram_mentions * 6 + telegram_sources * 10)

    topic_mentions = float((lunar_topic or {}).get("mentions_24h") or 0)
    topic_creators = float((lunar_topic or {}).get("creators_24h") or 0)
    topic_sentiment = float((lunar_topic or {}).get("sentiment_pct") or 0)
    topic_dominance = float((lunar_topic or {}).get("social_dominance_pct") or 0)
    creator_trust = max([float(item.get("trust_score") or 0) for item in lunar_creators] or [0])
    x_score = min(100, topic_mentions / 250 + topic_creators / 80 + topic_sentiment * 0.22 + creator_trust * 0.45 + topic_dominance * 4)

    narrative_score = min(100, social_burst * 0.5 + (10 if is_trending else 0) + topic_dominance * 5 + topic_sentiment * 0.2)

    overall_score = round(min(100, market_score * 0.34 + telegram_score * 0.23 + x_score * 0.23 + narrative_score * 0.20))

    if overall_score >= 75:
        verdict = "Aligned"
        badge = "Aligned"
    elif overall_score >= 58:
        verdict = "Building"
        badge = "Building"
    elif overall_score >= 42:
        verdict = "Speculative"
        badge = "Speculative"
    else:
        verdict = "Thin Confirmation"
        badge = "Thin"

    supportive_signals: List[str] = []
    conflict_flags: List[str] = []

    if market_score >= 65:
        supportive_signals.append(f"Market structure is active with a {signal_strength:.0f}/100 signal.")
    if telegram_score >= 50:
        supportive_signals.append(f"Telegram coordination is visible across {telegram_sources} source{'s' if telegram_sources != 1 else ''}.")
    if x_score >= 50:
        supportive_signals.append("X / creator activity is reinforcing the narrative around this asset.")
    if narrative_score >= 50:
        supportive_signals.append("Social narrative momentum is elevated beyond price action alone.")

    if telegram_score < 30:
        conflict_flags.append("Telegram confirmation is thin right now.")
    if x_score < 30:
        conflict_flags.append("X / creator confirmation is weak or still diffuse.")
    if dump_risk >= 80:
        conflict_flags.append("Exit risk is high enough to weaken the quality of late entries.")
    if signal_type == "pump" and stage in {"extended breakout", "blow-off risk"}:
        conflict_flags.append("The move is already stretched, so consensus helps less than timing discipline.")

    summary = (
        f"{symbol} cross-platform read is {verdict.lower()}: market {round(market_score)}/100, "
        f"Telegram {round(telegram_score)}/100, X {round(x_score)}/100, narrative {round(narrative_score)}/100."
    )

    return {
        "score": overall_score,
        "verdict": verdict,
        "badge": badge,
        "summary": summary,
        "platform_breakdown": {
            "market": round(market_score),
            "telegram": round(telegram_score),
            "x": round(x_score),
            "narrative": round(narrative_score),
        },
        "supportive_signals": supportive_signals[:4],
        "conflict_flags": conflict_flags[:4],
        "aligned_creators": [
            {
                "screen_name": creator.get("screen_name"),
                "trust_score": creator.get("trust_score", 0),
                "trust_badge": creator.get("trust_badge", "Low-Signal Account"),
            }
            for creator in sorted(lunar_creators, key=lambda item: item.get("trust_score", 0), reverse=True)[:3]
        ],
    }

def build_dashboard_cross_platform_consensus(snapshot: Optional[dict], telegram_consensus_payload: Optional[dict] = None) -> List[dict]:
    if not snapshot:
        return []

    hot_lookup = {
        (item.get("symbol") or "").upper(): item
        for item in (telegram_consensus_payload or {}).get("hot_symbols", []) or []
    }
    pool = (snapshot.get("pump_signals", []) or [])[:3] + (snapshot.get("dump_signals", []) or [])[:2]
    items = []

    for signal in pool:
        symbol = (signal.get("symbol") or "").upper()
        if not symbol:
            continue
        profile = signal.get("manipulation_profile") or {}
        tg = hot_lookup.get(symbol, {})
        signal_name = signal.get("name") or symbol
        market_score = min(100, (signal.get("signal_strength", 0) or 0) * 0.55 + (profile.get("manipulation_score", 0) or 0) * 0.45)
        telegram_score = min(100, (profile.get("coordinated_hype_score", 0) or 0) * 0.55 + (tg.get("mentions", 0) or 0) * 8 + (tg.get("unique_sources", 0) or 0) * 8)
        narrative_score = min(100, (profile.get("social_burst_score", 0) or 0) * 0.7 + (10 if signal.get("is_trending") else 0))

        social_topic, social_creators = get_social_intelligence_bundle(symbol, signal_name, creator_limit=2)

        topic_mentions = float((social_topic or {}).get("mentions_24h") or 0)
        topic_creators = float((social_topic or {}).get("creators_24h") or 0)
        topic_sentiment = float((social_topic or {}).get("sentiment_pct") or 0)
        topic_dominance = float((social_topic or {}).get("social_dominance_pct") or 0)
        creator_trust = max([float(item.get("trust_score") or 0) for item in social_creators] or [0])
        x_score = min(100, topic_mentions / 250 + topic_creators / 80 + topic_sentiment * 0.22 + creator_trust * 0.45 + topic_dominance * 4)

        consensus_score = round(min(100, market_score * 0.42 + telegram_score * 0.23 + x_score * 0.19 + narrative_score * 0.16))

        if consensus_score >= 72:
            verdict = "Aligned"
            badge = "aligned"
        elif consensus_score >= 55:
            verdict = "Building"
            badge = "building"
        elif consensus_score >= 40:
            verdict = "Speculative"
            badge = "speculative"
        else:
            verdict = "Thin"
            badge = "thin"

        supportive_signals: List[str] = []
        conflict_flags: List[str] = []
        if market_score >= 65:
            supportive_signals.append(f"Market structure is active at {round(market_score)}/100.")
        if telegram_score >= 50:
            supportive_signals.append(f"Telegram breadth is supportive across {tg.get('unique_sources', 0) or profile.get('telegram_sources', 0)} source(s).")
        if x_score >= 48:
            supportive_signals.append("X creator flow is reinforcing the move, not just echoing it.")
        if narrative_score >= 50:
            supportive_signals.append("Narrative momentum is elevated and still expanding.")

        if telegram_score < 30:
            conflict_flags.append("Telegram confirmation is still thin.")
        if x_score < 30:
            conflict_flags.append("X confirmation is weak or diffuse.")
        if (profile.get("dump_risk_score") or 0) >= 80:
            conflict_flags.append("Exit risk is high enough to punish late entries.")

        lead_creator = None
        if social_creators:
            best_creator = sorted(social_creators, key=lambda item: item.get("trust_score", 0), reverse=True)[0]
            lead_creator = {
                "screen_name": best_creator.get("screen_name"),
                "trust_score": best_creator.get("trust_score", 0),
                "trust_badge": best_creator.get("trust_badge", "Low-Signal Account"),
            }

        items.append({
            "symbol": symbol,
            "signal_type": signal.get("signal_type", "pump"),
            "consensus_score": consensus_score,
            "verdict": verdict,
            "badge": badge,
            "market_score": round(market_score),
            "telegram_score": round(telegram_score),
            "x_score": round(x_score),
            "narrative_score": round(narrative_score),
            "summary": f"{symbol} is {verdict.lower()} across market structure, Telegram flow, X amplification, and social momentum.",
            "supportive_signals": supportive_signals[:3],
            "conflict_flags": conflict_flags[:3],
            "lead_creator": lead_creator,
        })

    items.sort(key=lambda item: item.get("consensus_score", 0), reverse=True)
    return items[:4]

def get_lunarcrush_topic_intelligence(symbol: str, coin_name: Optional[str] = None) -> Optional[dict]:
    if not LUNARCRUSH_API_KEY or looks_like_placeholder(LUNARCRUSH_API_KEY, "LUNARCRUSH_API_KEY"):
        return None

    candidates = []
    if coin_name:
        candidates.append(coin_name.strip().lower().replace(" ", "-"))
        candidates.append(coin_name.strip().lower())
    candidates.append(symbol.strip().lower())
    candidates.append(f"${symbol.strip().lower()}")

    tried = set()
    headers = {"Authorization": f"Bearer {LUNARCRUSH_API_KEY}"}

    for candidate in candidates:
        if not candidate or candidate in tried:
            continue
        tried.add(candidate)
        try:
            url = f"https://lunarcrush.ai/topic/{quote(candidate, safe='')}"
            response = requests.get(url, headers=headers, timeout=20)
            if response.status_code == 429:
                logger.warning("LunarCrush AI topic rate limit reached for %s", candidate)
                return None
            if response.status_code != 200:
                continue

            text = response.text.strip()
            if not text or text == "no data generated" or text.startswith('{"error"'):
                continue

            parsed = parse_lunarcrush_topic_markdown(text)
            if parsed.get("summary") or parsed.get("mentions_24h") or parsed.get("social_dominance_pct"):
                parsed["topic"] = candidate
                return parsed
        except Exception as e:
            logger.warning("LunarCrush AI topic fetch failed for %s: %s", candidate, e)
            continue
    return None

def get_lunarcrush_creator_intelligence(
    handles: List[str],
    limit: int = 2,
    asset_symbol: Optional[str] = None,
    asset_name: Optional[str] = None,
) -> List[dict]:
    if not LUNARCRUSH_API_KEY or looks_like_placeholder(LUNARCRUSH_API_KEY, "LUNARCRUSH_API_KEY"):
        return []

    headers = {"Authorization": f"Bearer {LUNARCRUSH_API_KEY}"}
    creators = []
    seen = set()

    for raw_handle in handles:
        if len(creators) >= limit:
            break
        handle = (raw_handle or "").strip().lstrip("@")
        lowered = handle.lower()
        if not handle or lowered in seen or lowered in {"lunarcrush", "coingecko"}:
            continue
        seen.add(lowered)
        try:
            url = f"https://lunarcrush.ai/creator/x/{quote(handle, safe='')}"
            response = requests.get(url, headers=headers, timeout=20)
            if response.status_code == 429:
                logger.warning("LunarCrush AI creator rate limit reached for %s", handle)
                break
            if response.status_code != 200:
                continue

            text = response.text.strip()
            if not text or text == "no data generated" or text.startswith('{"error"'):
                continue

            parsed = parse_lunarcrush_creator_markdown(text)
            if parsed.get("summary") or parsed.get("followers") or parsed.get("engagements"):
                creators.append(score_lunarcrush_creator_intelligence(parsed, asset_symbol=asset_symbol, asset_name=asset_name))
        except Exception as e:
            logger.warning("LunarCrush AI creator fetch failed for %s: %s", handle, e)
            continue

    return creators

def get_x_coin_intelligence(symbol: str, coin_name: Optional[str] = None, limit: int = 10) -> Optional[dict]:
    if not X_BEARER_TOKEN or looks_like_placeholder(X_BEARER_TOKEN, "X_BEARER_TOKEN"):
        return None

    cache_key = f"{symbol.upper()}::{(coin_name or '').strip().lower()}"
    cached = X_INTELLIGENCE_CACHE.get(cache_key)
    now = datetime.now(timezone.utc)
    if cached and (now - cached.get("timestamp", now)).total_seconds() < 600:
        return cached.get("data")

    query_terms = [f"${symbol.upper()}", symbol.upper()]
    if coin_name and coin_name.strip().lower() != symbol.strip().lower():
        query_terms.append(f"\"{coin_name.strip()}\"")
    query = f"({' OR '.join(dict.fromkeys(query_terms))}) lang:en -is:retweet"

    try:
        response = requests.get(
            f"{X_API_BASE}/tweets/search/recent",
            headers={"Authorization": f"Bearer {X_BEARER_TOKEN}"},
            params={
                "query": query,
                "max_results": min(max(limit, 10), 25),
                "tweet.fields": "created_at,public_metrics,author_id,lang",
                "expansions": "author_id",
                "user.fields": "username,name,description,verified,public_metrics",
            },
            timeout=20,
        )
        if response.status_code == 429:
            logger.warning("X API rate limit reached for %s", symbol)
            return None
        if response.status_code != 200:
            logger.warning("X API search failed for %s with status %s", symbol, response.status_code)
            return None

        payload = response.json()
        tweets = payload.get("data") or []
        users = {item.get("id"): item for item in (payload.get("includes") or {}).get("users", [])}
        if not tweets:
            return None

        author_stats: Dict[str, dict] = {}
        top_posts = []
        total_engagements = 0

        for tweet in tweets:
            metrics = tweet.get("public_metrics") or {}
            engagements = int(metrics.get("like_count", 0) or 0) + int(metrics.get("retweet_count", 0) or 0) + int(metrics.get("reply_count", 0) or 0) + int(metrics.get("quote_count", 0) or 0)
            total_engagements += engagements
            author_id = tweet.get("author_id")
            user = users.get(author_id, {})
            username = user.get("username")
            if author_id:
                bucket = author_stats.setdefault(author_id, {"mentions": 0, "engagements": 0, "user": user})
                bucket["mentions"] += 1
                bucket["engagements"] += engagements
                if user:
                    bucket["user"] = user

            if username:
                top_posts.append({
                    "text": tweet.get("text", ""),
                    "label": "X Link",
                    "url": f"https://x.com/{username}/status/{tweet.get('id')}",
                    "meta": f"@{username} · {engagements} engagements",
                })

        creator_docs = []
        for author_id, stats in author_stats.items():
            user = stats.get("user") or {}
            public_metrics = user.get("public_metrics") or {}
            doc = {
                "title": f"@{user.get('username') or user.get('name') or 'Unknown'} {user.get('name') or ''}".strip(),
                "screen_name": user.get("username"),
                "summary": user.get("description") or f"Recent X account active around {symbol}.",
                "engagements": stats.get("engagements", 0),
                "mentions": stats.get("mentions", 0),
                "followers": public_metrics.get("followers_count", 0),
                "creator_rank": None,
                "influence_topics": [symbol.upper(), coin_name] if coin_name else [symbol.upper()],
                "top_assets": [symbol.upper(), coin_name] if coin_name else [symbol.upper()],
                "top_social_posts": [post for post in top_posts if f"/{user.get('username')}/status/" in post.get("url", "")][:3],
                "source": "X API",
                "limited_mode": False,
            }
            creator_docs.append(score_lunarcrush_creator_intelligence(doc, asset_symbol=symbol, asset_name=coin_name))

        creator_docs.sort(key=lambda item: item.get("trust_score", 0), reverse=True)
        unique_creators = len(author_stats)
        average_engagement = round(total_engagements / max(1, len(tweets)))
        summary = (
            f"{symbol.upper()} generated {len(tweets)} recent public X posts across {unique_creators} active accounts, "
            f"with roughly {total_engagements} combined engagements and about {average_engagement} engagements per post."
        )
        if coin_name:
            summary = (
                f"{coin_name} ({symbol.upper()}) generated {len(tweets)} recent public X posts across {unique_creators} active accounts, "
                f"with roughly {total_engagements} combined engagements and about {average_engagement} engagements per post."
            )

        result = {
            "title": f"{coin_name or symbol.upper()} on X",
            "topic": symbol.lower(),
            "summary": summary,
            "engagements_24h": total_engagements,
            "mentions_24h": len(tweets),
            "creators_24h": unique_creators,
            "sentiment_pct": None,
            "social_dominance_pct": None,
            "insights": [
                f"{symbol.upper()} appeared in {len(tweets)} recent public X posts.",
                f"Those posts came from {unique_creators} unique accounts.",
                f"Combined engagement across tracked posts is {total_engagements}.",
            ],
            "supportive_themes": [],
            "critical_themes": [],
            "top_accounts": [doc.get("screen_name") for doc in creator_docs if doc.get("screen_name")][:6],
            "top_news": [],
            "top_social_posts": sorted(top_posts, key=lambda item: int(re.search(r'(\\d+) engagements', item.get('meta', '0'))[1]) if re.search(r'(\\d+) engagements', item.get('meta', '')) else 0, reverse=True)[:5],
            "creator_docs": creator_docs[:5],
            "source": "X API",
            "limited_mode": False,
        }
        X_INTELLIGENCE_CACHE[cache_key] = {"timestamp": now, "data": result}
        return result
    except Exception as e:
        logger.warning("X API fetch failed for %s: %s", symbol, e)
        return None

def extract_social_creator_candidates(topic_payload: Optional[dict]) -> List[str]:
    if not topic_payload:
        return []

    candidates: List[str] = []
    candidates.extend(topic_payload.get("top_accounts", []) or [])
    for post in topic_payload.get("top_social_posts", []) or []:
        post_url = post.get("url", "")
        handle_match = re.search(r"x\.com/([A-Za-z0-9_\.]+)/status/", post_url, re.IGNORECASE)
        if handle_match:
            candidates.append(handle_match.group(1))

    deduped: List[str] = []
    seen = set()
    for raw_handle in candidates:
        handle = (raw_handle or "").strip().lstrip("@")
        lowered = handle.lower()
        if not handle or lowered in seen:
            continue
        seen.add(lowered)
        deduped.append(handle)
    return deduped

def get_social_intelligence_bundle(symbol: str, coin_name: Optional[str] = None, creator_limit: int = 3) -> Tuple[Optional[dict], List[dict]]:
    cache_key = f"{symbol.upper()}::{(coin_name or '').strip().lower()}::{creator_limit}"
    cached = get_memory_cache(SOCIAL_INTELLIGENCE_CACHE, cache_key, ttl_seconds=600)
    if cached is not None:
        return cached

    x_topic = get_x_coin_intelligence(symbol, coin_name, limit=max(10, creator_limit * 4))
    if x_topic:
        x_creators = list(x_topic.get("creator_docs") or [])
        if x_creators:
            result = (x_topic, x_creators[:creator_limit])
            set_memory_cache(SOCIAL_INTELLIGENCE_CACHE, cache_key, result)
            return result
        x_candidates = extract_social_creator_candidates(x_topic)
        if x_candidates:
            x_creators = get_lunarcrush_creator_intelligence(
                x_candidates,
                limit=creator_limit,
                asset_symbol=symbol,
                asset_name=coin_name,
            )
        result = (x_topic, x_creators[:creator_limit])
        set_memory_cache(SOCIAL_INTELLIGENCE_CACHE, cache_key, result)
        return result

    lunar_topic = get_lunarcrush_topic_intelligence(symbol, coin_name)
    lunar_candidates = extract_social_creator_candidates(lunar_topic)
    lunar_creators = get_lunarcrush_creator_intelligence(
        lunar_candidates,
        limit=creator_limit,
        asset_symbol=symbol,
        asset_name=coin_name,
    ) if lunar_candidates else []
    result = (lunar_topic, lunar_creators[:creator_limit])
    set_memory_cache(SOCIAL_INTELLIGENCE_CACHE, cache_key, result)
    return result

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

def _coerce_float(value: Any, default: float = 0.0) -> float:
    try:
        if value is None:
            return default
        return float(value)
    except Exception:
        return default

def pick_first_numeric(payload: Optional[dict], *keys: str, default: float = 0.0) -> float:
    payload = payload or {}
    for key in keys:
        value = payload.get(key)
        parsed = safe_float(value)
        if parsed is not None:
            return parsed
    return default

def build_direction_audit(
    *,
    symbol: str,
    price_change_1h: float,
    price_change_24h: float,
    price_change_7d: float,
    volume_24h: float,
    market_cap: float,
    signal_type_hint: Optional[str] = None,
    signal_strength_hint: Optional[float] = None,
    pump_strength: Optional[float] = None,
    dump_strength: Optional[float] = None,
    is_trending: bool = False,
) -> dict:
    pc_1h = _coerce_float(price_change_1h)
    pc_24h = _coerce_float(price_change_24h)
    pc_7d = _coerce_float(price_change_7d)
    volume = max(0.0, _coerce_float(volume_24h))
    mcap = max(0.0, _coerce_float(market_cap))
    volume_ratio = (volume / mcap * 100) if mcap else 0.0
    hinted_strength = max(0.0, _coerce_float(signal_strength_hint))
    pump_strength_value = max(0.0, _coerce_float(pump_strength))
    dump_strength_value = max(0.0, _coerce_float(dump_strength))

    bullish_score = 0.0
    bearish_score = 0.0

    bullish_score += min(18.0, max(pc_1h, 0.0) * 5.0)
    bearish_score += min(18.0, abs(min(pc_1h, 0.0)) * 5.0)

    bullish_score += min(42.0, max(pc_24h, 0.0) * 1.85)
    bearish_score += min(42.0, abs(min(pc_24h, 0.0)) * 1.85)

    bullish_score += min(12.0, max(pc_7d, 0.0) * 0.22)
    bearish_score += min(12.0, abs(min(pc_7d, 0.0)) * 0.22)

    hourly_vs_daily = pc_1h - (pc_24h / 24 if pc_24h else 0.0)
    if pc_1h > 0 and hourly_vs_daily > 0:
        bullish_score += min(10.0, hourly_vs_daily * 3.25)
    if pc_1h < 0 and hourly_vs_daily < 0:
        bearish_score += min(10.0, abs(hourly_vs_daily) * 3.25)

    if volume_ratio >= 18:
        if pc_24h >= 0 or pc_1h >= 0:
            bullish_score += 6.0
        if pc_24h <= 0 or pc_1h <= 0:
            bearish_score += 6.0
    elif volume_ratio >= 10:
        if pc_24h >= 0:
            bullish_score += 3.0
        if pc_24h <= 0:
            bearish_score += 3.0

    if is_trending and pc_1h > 0 and pc_24h > -4:
        bullish_score += 5.0

    bullish_score += min(16.0, pump_strength_value * 0.16)
    bearish_score += min(16.0, dump_strength_value * 0.16)

    if signal_type_hint == "pump":
        bullish_score += min(8.0, hinted_strength * 0.08)
    elif signal_type_hint == "dump":
        bearish_score += min(8.0, hinted_strength * 0.08)

    strong_bullish = pc_1h >= 1.0 and pc_24h >= 8.0
    strong_bearish = pc_1h <= -1.0 and pc_24h <= -8.0
    dominant_bullish_context = (
        pc_24h >= 15.0 and
        pc_1h < 0 and
        abs(pc_1h) <= min(4.5, max(2.5, abs(pc_24h) / 6.0))
    )
    dominant_bearish_context = (
        pc_24h <= -15.0 and
        pc_1h > 0 and
        pc_1h <= min(4.8, max(2.0, abs(pc_24h) / 4.4))
    )
    simple_pullback = (
        (pc_24h >= 12.0 or dominant_bullish_context) and
        pc_1h < 0 and
        abs(pc_1h) <= min(4.2, max(2.8, abs(pc_24h) / 5.0)) and
        (dominant_bullish_context or bullish_score >= bearish_score - 2.0)
    )
    dead_cat_bounce = (
        (pc_24h <= -12.0 or dominant_bearish_context) and
        pc_1h > 0 and
        pc_1h <= min(6.0, max(3.0, abs(pc_24h) / 4.5)) and
        (dominant_bearish_context or bearish_score >= bullish_score - 2.0)
    )
    bullish_reversal_exception = (
        pc_24h <= -10.0 and
        pc_1h >= max(5.0, abs(pc_24h) / 3.0) and
        volume_ratio >= 25.0 and
        bullish_score >= bearish_score + 10.0
    )
    bearish_reversal_exception = (
        pc_24h >= 10.0 and
        pc_1h <= -max(5.0, abs(pc_24h) / 3.0) and
        volume_ratio >= 25.0 and
        bearish_score >= bullish_score + 10.0
    )

    score_gap = round(abs(bullish_score - bearish_score), 2)
    structure_bias = "mixed"
    resolved_direction = "pump"
    transition_state = "reversal_watch"
    narrative_template = "mixed_transition"
    explicit_exception = False

    if strong_bearish and not bullish_reversal_exception:
        resolved_direction = "dump"
        structure_bias = "bearish"
        transition_state = "dead_cat_bounce" if dead_cat_bounce else "bearish_breakdown"
        narrative_template = transition_state
    elif strong_bullish and not bearish_reversal_exception:
        resolved_direction = "pump"
        structure_bias = "bullish"
        transition_state = "bullish_pullback" if simple_pullback else "bullish_continuation"
        narrative_template = transition_state
    elif dead_cat_bounce and not bullish_reversal_exception:
        resolved_direction = "dump"
        structure_bias = "bearish"
        transition_state = "dead_cat_bounce"
        narrative_template = transition_state
    elif simple_pullback and not bearish_reversal_exception:
        resolved_direction = "pump"
        structure_bias = "bullish"
        transition_state = "bullish_pullback"
        narrative_template = transition_state
    else:
        if bullish_score >= bearish_score:
            resolved_direction = "pump"
            transition_state = "bullish_reversal" if pc_24h < 0 < pc_1h else "bullish_continuation"
            narrative_template = transition_state
        else:
            resolved_direction = "dump"
            transition_state = "bearish_reversal" if pc_24h > 0 > pc_1h else "bearish_breakdown"
            narrative_template = transition_state
        if score_gap >= 8:
            structure_bias = "bullish" if resolved_direction == "pump" else "bearish"
        else:
            structure_bias = "mixed"
            transition_state = "reversal_watch"
            narrative_template = transition_state

    if bullish_reversal_exception:
        resolved_direction = "pump"
        structure_bias = "mixed"
        transition_state = "bullish_reversal"
        narrative_template = transition_state
        explicit_exception = True
    elif bearish_reversal_exception:
        resolved_direction = "dump"
        structure_bias = "mixed"
        transition_state = "bearish_reversal"
        narrative_template = transition_state
        explicit_exception = True

    contradiction = bool(signal_type_hint and signal_type_hint != resolved_direction)

    return {
        "symbol": symbol,
        "price_change_1h": round(pc_1h, 2),
        "price_change_24h": round(pc_24h, 2),
        "price_change_7d": round(pc_7d, 2),
        "volume_market_cap_ratio": round(volume_ratio, 2),
        "pump_strength": round(pump_strength_value, 1),
        "dump_strength": round(dump_strength_value, 1),
        "signal_type_hint": signal_type_hint,
        "signal_strength_hint": round(hinted_strength, 1),
        "bullish_score": round(bullish_score, 2),
        "bearish_score": round(bearish_score, 2),
        "score_gap": score_gap,
        "structure_bias": structure_bias,
        "transition_state": transition_state,
        "resolved_direction": resolved_direction,
        "narrative_template": narrative_template,
        "strong_bullish": strong_bullish,
        "strong_bearish": strong_bearish,
        "simple_pullback": simple_pullback,
        "dead_cat_bounce": dead_cat_bounce,
        "explicit_exception": explicit_exception,
        "contradiction_with_hint": contradiction,
    }

def build_signal_source_stack(
    *,
    symbol: str,
    price_change_1h: float,
    price_change_24h: float,
    vol_mcap_ratio: float,
    is_trending: bool,
    telegram_mentions: int = 0,
    telegram_sources: int = 0,
    bullish_mentions: int = 0,
    bearish_mentions: int = 0,
    telegram_avg_score: float = 0.0,
    social_volume: float = 0.0,
    galaxy_score: float = 0.0,
    sentiment: float = 0.0,
    lunar_mentions: float = 0.0,
    lunar_creators: float = 0.0,
    lunar_interactions: float = 0.0,
    lunar_dominance: float = 0.0,
    venue_count: int = 0,
    preferred_venue: Optional[dict] = None,
) -> dict:
    pc_1h = float(price_change_1h or 0)
    pc_24h = float(price_change_24h or 0)
    volume_ratio = float(vol_mcap_ratio or 0)
    tg_mentions = int(telegram_mentions or 0)
    tg_sources = int(telegram_sources or 0)
    bull_mentions = int(bullish_mentions or 0)
    bear_mentions = int(bearish_mentions or 0)
    tg_avg = float(telegram_avg_score or 0)
    social_volume = float(social_volume or 0)
    galaxy_score = float(galaxy_score or 0)
    sentiment = float(sentiment or 0)
    lunar_mentions = float(lunar_mentions or 0)
    lunar_creators = float(lunar_creators or 0)
    lunar_interactions = float(lunar_interactions or 0)
    lunar_dominance = float(lunar_dominance or 0)
    routes = int(venue_count or 0)

    telegram_score = min(100.0, tg_mentions * 11 + tg_sources * 13 + abs(bull_mentions - bear_mentions) * 8 + max(tg_avg - 45.0, 0.0) * 0.35)
    lunar_score = min(
        100.0,
        social_volume / 18.0 +
        galaxy_score * 0.42 +
        max(sentiment, 0.0) * 0.18 +
        lunar_mentions * 0.45 +
        lunar_creators * 3.5 +
        lunar_interactions / 5000.0 +
        lunar_dominance * 8.0 +
        (10.0 if is_trending else 0.0)
    )
    coingecko_market_score = min(100.0, volume_ratio * 3.5 + abs(pc_1h) * 8.0 + abs(pc_24h) * 1.35 + (10.0 if is_trending else 0.0))
    execution_score = min(100.0, routes * 18.0 + (10.0 if preferred_venue else 0.0))

    telegram_active = tg_mentions >= 1 or tg_sources >= 1 or bull_mentions >= 1 or bear_mentions >= 1
    lunar_active = social_volume >= 12 or galaxy_score >= 20 or lunar_mentions >= 6 or lunar_creators >= 2 or lunar_dominance >= 0.05
    coingecko_market_active = volume_ratio >= 6 or abs(pc_24h) >= 7 or abs(pc_1h) >= 1.5
    execution_active = routes >= 1

    labels: List[str] = []
    if telegram_active:
        labels.append("telegram")
    if lunar_active:
        labels.append("lunarcrush")
    if coingecko_market_active or is_trending:
        labels.append("coingecko_market")
    if execution_active:
        labels.append("coingecko_venues")

    active_layers = len(labels)
    if execution_active and active_layers >= 4:
        confirmation_tier = "stacked"
    elif active_layers >= 3:
        confirmation_tier = "triple-source"
    elif active_layers >= 2:
        confirmation_tier = "dual-source"
    elif active_layers == 1:
        confirmation_tier = "single-source"
    else:
        confirmation_tier = "thin"

    if telegram_score >= max(lunar_score, coingecko_market_score):
        primary_driver = "telegram_rumor_flow"
    elif lunar_score >= max(telegram_score, coingecko_market_score):
        primary_driver = "lunarcrush_social_flow"
    else:
        primary_driver = "coingecko_market_structure"

    if bull_mentions > bear_mentions:
        sentiment_bias = "bullish social bias"
    elif bear_mentions > bull_mentions:
        sentiment_bias = "bearish social bias"
    elif telegram_active or lunar_active:
        sentiment_bias = "mixed social bias"
    else:
        sentiment_bias = "market-led only"

    summary_parts = []
    if telegram_active:
        summary_parts.append(f"Telegram saw {tg_mentions} mentions across {tg_sources} sources")
    if lunar_active:
        summary_parts.append(f"LunarCrush social stack is active at {round(lunar_score)}/100")
    if coingecko_market_active or is_trending:
        summary_parts.append(f"CoinGecko market confirmation is {round(coingecko_market_score)}/100")
    if execution_active:
        preferred_name = ((preferred_venue or {}).get("name") or "preferred venue").strip()
        summary_parts.append(f"{routes} verified trade route{'s' if routes != 1 else ''} are available via {preferred_name}")

    summary = (
        f"{symbol} is {confirmation_tier} across "
        f"{', '.join(labels) if labels else 'thin source coverage'} with {sentiment_bias}."
    )
    if summary_parts:
        summary += " " + ". ".join(summary_parts[:4]) + "."

    return {
        "labels": labels,
        "confirmation_tier": confirmation_tier,
        "primary_driver": primary_driver,
        "sentiment_bias": sentiment_bias,
        "telegram_active": telegram_active,
        "lunarcrush_active": lunar_active,
        "coingecko_market_active": coingecko_market_active,
        "execution_active": execution_active,
        "telegram_score": round(telegram_score),
        "lunarcrush_score": round(lunar_score),
        "coingecko_market_score": round(coingecko_market_score),
        "execution_score": round(execution_score),
        "verified_routes": routes,
        "summary": summary,
    }

def score_market_candidate(candidate: dict, fg_value: float) -> dict:
    vol_mcap = float(candidate.get("vol_mcap_ratio", 0) or 0)
    pc_1h = float(candidate.get("price_change_1h", 0) or 0)
    pc_24h = float(candidate.get("price_change_24h", 0) or 0)
    pc_7d = float(candidate.get("price_change_7d", 0) or 0)
    is_trending = bool(candidate.get("is_trending", False))
    social_volume = float(candidate.get("social_volume", 0) or 0)
    sentiment = float(candidate.get("sentiment", 0) or 0)
    galaxy_score = float(candidate.get("galaxy_score", 0) or 0)
    telegram_mentions = int(candidate.get("telegram_mentions", 0) or 0)
    telegram_sources = int(candidate.get("telegram_sources", 0) or 0)
    bullish_mentions = int(candidate.get("bullish_mentions", 0) or 0)
    bearish_mentions = int(candidate.get("bearish_mentions", 0) or 0)
    telegram_avg_score = float(candidate.get("telegram_avg_score", 0) or 0)
    lunar_mentions = float(candidate.get("lunar_mentions", 0) or 0)
    lunar_creators = float(candidate.get("lunar_creators", 0) or 0)
    lunar_interactions = float(candidate.get("lunar_interactions", 0) or 0)
    lunar_dominance = float(candidate.get("lunar_dominance", 0) or 0)

    vol_score = min(100, (vol_mcap / 20) * 100) if vol_mcap > 5 else vol_mcap * 10

    momentum_1h_normalized = pc_1h * 24
    momentum_divergence = momentum_1h_normalized - pc_24h
    momentum_score = min(100, max(0, 50 + momentum_divergence * 2))

    trend_score = 0.0
    if pc_1h > 0 and pc_24h > 0:
        trend_score += 40
    if pc_1h > pc_24h / 24:
        trend_score += 30
    if is_trending:
        trend_score += 30

    sentiment_boost = 0.0
    if fg_value < 30 and pc_1h > 0:
        sentiment_boost = 20
    elif fg_value > 60 and pc_1h > 2:
        sentiment_boost = 15

    bullish_media_bias = max(0, bullish_mentions - bearish_mentions)
    bearish_media_bias = max(0, bearish_mentions - bullish_mentions)
    media_interest_score = min(100, telegram_mentions * 10 + telegram_sources * 12 + max(telegram_avg_score - 45, 0) * 0.45)
    bullish_media_score = min(100, media_interest_score * 0.55 + bullish_media_bias * 16 + (10 if bullish_mentions and bullish_mentions >= bearish_mentions else 0))
    bearish_media_score = min(100, media_interest_score * 0.55 + bearish_media_bias * 18 + (10 if bearish_mentions and bearish_mentions >= bullish_mentions else 0))

    accumulation_score = 0.0
    if pc_1h > 0:
        accumulation_score += min(26, pc_1h * 7.5)
    if -8 <= pc_24h <= 18:
        accumulation_score += max(0, 18 - abs(pc_24h - 4))
    if vol_mcap >= 6:
        accumulation_score += min(24, vol_mcap * 1.7)
    if social_volume or galaxy_score:
        accumulation_score += min(18, social_volume / 22 + galaxy_score * 0.18 + max(sentiment, 0) * 0.1)
    if bullish_media_bias > 0:
        accumulation_score += min(16, bullish_media_bias * 5 + telegram_sources * 3)
    accumulation_score = min(100, accumulation_score)

    selling_pressure = 0.0
    if pc_1h < 0 and pc_24h < 0:
        selling_pressure = min(100, abs(pc_1h) * 10 + abs(pc_24h) * 2)

    decline_acceleration = 0.0
    if pc_1h < 0 and pc_1h < pc_24h / 24:
        decline_acceleration = min(100, abs(pc_1h - pc_24h / 24) * 15)

    dump_vol_score = vol_score if pc_1h < -2 else 0.0
    dump_narrative_score = 0.0
    if pc_1h < 0:
        dump_narrative_score += min(22, abs(pc_1h) * 8)
    if pc_24h < 0:
        dump_narrative_score += min(24, abs(pc_24h) * 1.1)
    if vol_mcap >= 6:
        dump_narrative_score += min(18, vol_mcap * 1.2)
    if bearish_media_bias > 0:
        dump_narrative_score += min(20, bearish_media_bias * 6 + telegram_sources * 4)
    dump_narrative_score = min(100, dump_narrative_score)

    social_confirmation_score = min(100, social_volume / 18 + galaxy_score * 0.45 + max(sentiment, 0) * 0.2 + (18 if is_trending else 0))

    pump_strength = (
        vol_score * 0.22 +
        momentum_score * 0.24 +
        trend_score * 0.16 +
        sentiment_boost * 0.08 +
        accumulation_score * 0.18 +
        bullish_media_score * 0.12
    )

    dump_strength = (
        dump_vol_score * 0.18 +
        decline_acceleration * 0.24 +
        selling_pressure * 0.18 +
        (15 if fg_value > 70 else 0) * 0.08 +
        dump_narrative_score * 0.20 +
        bearish_media_score * 0.12
    )

    direction_audit = build_direction_audit(
        symbol=candidate.get("symbol", ""),
        price_change_1h=pc_1h,
        price_change_24h=pc_24h,
        price_change_7d=pc_7d,
        volume_24h=candidate.get("volume_24h", 0),
        market_cap=candidate.get("market_cap", 0),
        pump_strength=pump_strength,
        dump_strength=dump_strength,
        is_trending=is_trending,
    )
    source_stack = build_signal_source_stack(
        symbol=candidate.get("symbol", ""),
        price_change_1h=pc_1h,
        price_change_24h=pc_24h,
        vol_mcap_ratio=vol_mcap,
        is_trending=is_trending,
        telegram_mentions=telegram_mentions,
        telegram_sources=telegram_sources,
        bullish_mentions=bullish_mentions,
        bearish_mentions=bearish_mentions,
        telegram_avg_score=telegram_avg_score,
        social_volume=social_volume,
        galaxy_score=galaxy_score,
        sentiment=sentiment,
        lunar_mentions=lunar_mentions,
        lunar_creators=lunar_creators,
        lunar_interactions=lunar_interactions,
        lunar_dominance=lunar_dominance,
    )

    return {
        "pump_strength": round(pump_strength, 1),
        "dump_strength": round(dump_strength, 1),
        "vol_score": round(vol_score, 1),
        "momentum_score": round(momentum_score, 1),
        "accumulation_score": round(accumulation_score, 1),
        "social_confirmation_score": round(social_confirmation_score, 1),
        "bullish_media_score": round(bullish_media_score, 1),
        "bearish_media_score": round(bearish_media_score, 1),
        "direction_audit": direction_audit,
        "source_stack": source_stack,
    }

def build_market_candidate_record(
    coin: dict,
    *,
    lc_lookup: Optional[Dict[str, dict]] = None,
    telegram_stats_map: Optional[Dict[str, dict]] = None,
    trending_symbols: Optional[List[str]] = None,
    origin: str = "coingecko_scan",
    telegram_seed: Optional[dict] = None,
) -> dict:
    lc_lookup = lc_lookup or {}
    telegram_stats_map = telegram_stats_map or {}
    trending_symbols = trending_symbols or []

    sym = (coin.get("symbol") or "").upper()
    lc = lc_lookup.get(sym, {})
    telegram_stats = telegram_stats_map.get(sym, {})
    price = coin.get("current_price") or coin.get("price") or (telegram_seed or {}).get("reference_price") or 0
    vol = coin.get("total_volume") or coin.get("volume_24h") or 0
    mcap = coin.get("market_cap") or 0
    pc = coin.get("price_change_percentage_1h_in_currency") or coin.get("price_change_percentage_1h") or coin.get("price_change_1h") or 0
    pc24 = coin.get("price_change_percentage_24h") or coin.get("price_change_24h") or 0
    pc7d = coin.get("price_change_percentage_7d_in_currency") or coin.get("price_change_percentage_7d") or coin.get("price_change_7d") or 0
    vol_mcap_ratio = (vol / mcap * 100) if mcap > 0 else 0
    social_volume = lc.get("social_volume") or lc.get("sv") or 0
    sentiment = lc.get("sentiment") or lc.get("ss") or 0
    galaxy_score = lc.get("galaxy_score") or lc.get("gs") or 0
    lunar_mentions = pick_first_numeric(lc, "posts_active", "posts", "mentions", "social_posts", default=0.0)
    lunar_creators = pick_first_numeric(lc, "contributors_active", "social_contributors", "creators", "contributors", default=0.0)
    lunar_interactions = pick_first_numeric(lc, "interactions", "social_interactions", "engagements", default=0.0)
    lunar_dominance = pick_first_numeric(lc, "social_dominance", "dominance", default=0.0)
    is_trending = sym in trending_symbols
    mentions = int(telegram_stats.get("mentions") or (telegram_seed or {}).get("mentions") or 0)
    unique_sources = int(telegram_stats.get("unique_sources") or (telegram_seed or {}).get("unique_sources") or 0)
    bullish_mentions = int(telegram_stats.get("bullish_mentions") or (telegram_seed or {}).get("bullish_mentions") or 0)
    bearish_mentions = int(telegram_stats.get("bearish_mentions") or (telegram_seed or {}).get("bearish_mentions") or 0)
    avg_score = float(telegram_stats.get("avg_score") or (telegram_seed or {}).get("avg_score") or 0)

    return {
        "id": coin.get("id", "") or (telegram_seed or {}).get("coin_id", ""),
        "symbol": sym,
        "name": coin.get("name", "") or (telegram_seed or {}).get("coin_name") or sym,
        "price": price,
        "market_cap": mcap,
        "volume_24h": vol,
        "vol_mcap_ratio": round(vol_mcap_ratio, 2),
        "price_change_1h": round(float(pc), 2) if pc else 0,
        "price_change_24h": round(float(pc24), 2) if pc24 else 0,
        "price_change_7d": round(float(pc7d), 2) if pc7d else 0,
        "image": coin.get("image"),
        "is_trending": is_trending,
        "social_volume": social_volume,
        "sentiment": sentiment,
        "galaxy_score": galaxy_score,
        "lunar_mentions": round(lunar_mentions, 1),
        "lunar_creators": round(lunar_creators, 1),
        "lunar_interactions": round(lunar_interactions, 1),
        "lunar_dominance": round(lunar_dominance, 4),
        "telegram_mentions": mentions,
        "telegram_sources": unique_sources,
        "bullish_mentions": bullish_mentions,
        "bearish_mentions": bearish_mentions,
        "telegram_avg_score": round(avg_score, 1),
        "candidate_origin": origin,
    }

def explain_market_candidate_rejection(
    *,
    price: float,
    volume_24h: float,
    market_cap: float,
    vol_mcap_ratio: float,
    is_trending: bool,
    social_volume: float,
    galaxy_score: float,
    telegram_mentions: int,
    telegram_sources: int,
    bullish_mentions: int,
    bearish_mentions: int,
) -> List[str]:
    reasons: List[str] = []
    if price <= 0 or price < 0.0000001:
        reasons.append("price_missing_or_too_small")
    if volume_24h <= 0:
        reasons.append("volume_missing")
    if reasons:
        return reasons

    has_market_activity = volume_24h >= 15_000 or vol_mcap_ratio >= 3
    has_social_activity = social_volume >= 12 or galaxy_score >= 20 or is_trending
    has_telegram_activity = (
        telegram_mentions >= 1 or
        telegram_sources >= 1 or
        bullish_mentions >= 1 or
        bearish_mentions >= 1
    )

    if market_cap > 0 and market_cap >= 100_000:
        return []
    if has_market_activity or has_social_activity or has_telegram_activity:
        return []

    reasons.append("insufficient_market_social_or_telegram_activity")
    return reasons

def should_include_market_candidate(
    *,
    price: float,
    volume_24h: float,
    market_cap: float,
    vol_mcap_ratio: float,
    is_trending: bool,
    social_volume: float,
    galaxy_score: float,
    telegram_mentions: int,
    telegram_sources: int,
    bullish_mentions: int,
    bearish_mentions: int,
) -> bool:
    return len(explain_market_candidate_rejection(
        price=price,
        volume_24h=volume_24h,
        market_cap=market_cap,
        vol_mcap_ratio=vol_mcap_ratio,
        is_trending=is_trending,
        social_volume=social_volume,
        galaxy_score=galaxy_score,
        telegram_mentions=telegram_mentions,
        telegram_sources=telegram_sources,
        bullish_mentions=bullish_mentions,
        bearish_mentions=bearish_mentions,
    )) == 0

def is_true_pump_candidate(candidate: dict) -> bool:
    direction_audit = candidate.get("direction_audit") or {}
    if direction_audit.get("resolved_direction") != "pump":
        return False
    source_stack = candidate.get("source_stack") or {}

    pc_1h = float(candidate.get("price_change_1h", 0) or 0)
    pc_24h = float(candidate.get("price_change_24h", 0) or 0)
    vol_mcap = float(candidate.get("vol_mcap_ratio", 0) or 0)
    pump_strength = float(candidate.get("pump_strength", 0) or 0)
    accumulation_score = float(candidate.get("accumulation_score", 0) or 0)
    bullish_media_score = float(candidate.get("bullish_media_score", 0) or 0)
    social_confirmation_score = float(candidate.get("social_confirmation_score", 0) or 0)
    is_trending = bool(candidate.get("is_trending"))
    telegram_mentions = int(candidate.get("telegram_mentions", 0) or 0)
    bullish_mentions = int(candidate.get("bullish_mentions", 0) or 0)
    telegram_sources = int(candidate.get("telegram_sources", 0) or 0)

    momentum_ok = (pc_24h >= 7 and pc_1h >= 0.6) or pc_1h >= 1.8
    attention_ok = (
        bullish_media_score >= 40 or
        social_confirmation_score >= 28 or
        accumulation_score >= 56 or
        is_trending or
        bullish_mentions >= 1 or
        telegram_sources >= 1 or
        telegram_mentions >= 2
    )
    source_confirmed = (
        bool(source_stack.get("telegram_active")) or
        bool(source_stack.get("lunarcrush_active")) or
        bool(candidate.get("is_trending")) or
        bullish_media_score >= 55
    )
    market_confirmed = bool(source_stack.get("coingecko_market_active")) or vol_mcap >= 6
    return (
        pump_strength >= 58 and
        vol_mcap >= 6 and
        momentum_ok and
        attention_ok and
        source_confirmed and
        market_confirmed
    )

def is_true_dump_candidate(candidate: dict) -> bool:
    direction_audit = candidate.get("direction_audit") or {}
    if direction_audit.get("resolved_direction") != "dump":
        return False
    source_stack = candidate.get("source_stack") or {}

    pc_1h = float(candidate.get("price_change_1h", 0) or 0)
    pc_24h = float(candidate.get("price_change_24h", 0) or 0)
    vol_mcap = float(candidate.get("vol_mcap_ratio", 0) or 0)
    dump_strength = float(candidate.get("dump_strength", 0) or 0)
    bearish_media_score = float(candidate.get("bearish_media_score", 0) or 0)
    social_confirmation_score = float(candidate.get("social_confirmation_score", 0) or 0)
    telegram_mentions = int(candidate.get("telegram_mentions", 0) or 0)
    bearish_mentions = int(candidate.get("bearish_mentions", 0) or 0)
    telegram_sources = int(candidate.get("telegram_sources", 0) or 0)
    is_trending = bool(candidate.get("is_trending"))

    momentum_ok = (pc_24h <= -4 and pc_1h <= -0.5) or pc_1h <= -1.2
    narrative_ok = (
        bearish_media_score >= 28 or
        bearish_mentions >= 1 or
        telegram_sources >= 1 or
        telegram_mentions >= 1 or
        social_confirmation_score >= 22 or
        is_trending
    )
    source_confirmed = (
        bool(source_stack.get("telegram_active")) or
        bool(source_stack.get("lunarcrush_active")) or
        bool(source_stack.get("coingecko_market_active")) or
        bearish_media_score >= 38 or
        vol_mcap >= 6
    )
    market_confirmed = bool(source_stack.get("coingecko_market_active")) or vol_mcap >= 4
    return (
        dump_strength >= 46 and
        vol_mcap >= 4 and
        momentum_ok and
        narrative_ok and
        source_confirmed and
        market_confirmed
    )


def evaluate_snapshot_signal_gate(signal: dict, signal_type: str) -> dict:
    profile = signal.get("manipulation_profile") or {}
    decision = signal.get("decision_engine") or {}
    source_stack = signal.get("signal_sources") or signal.get("source_stack") or {}
    asset_identity = signal.get("asset_identity") or {}
    rugpull_profile = signal.get("rugpull_profile") or {}
    direction = profile.get("resolved_direction") or signal.get("signal_type") or signal_type

    hard_reasons: List[str] = []
    soft_reasons: List[str] = []

    if direction != signal_type:
        hard_reasons.append("direction_mismatch")

    signal_strength = float(signal.get("signal_strength", 0) or 0)
    pc_1h = float(signal.get("price_change_1h", 0) or 0)
    pc_24h = float(signal.get("price_change_24h", 0) or 0)
    volume_ratio = float(profile.get("volume_market_cap_ratio", 0) or decision.get("volume_market_cap_ratio") or 0)
    mentions = int(profile.get("telegram_mentions", 0) or 0)
    bullish_mentions = int(profile.get("bullish_mentions", 0) or 0)
    bearish_mentions = int(profile.get("bearish_mentions", 0) or 0)
    sources = int(profile.get("telegram_sources", 0) or 0)
    stage = (profile.get("stage") or "").strip().lower()
    social_burst = float(profile.get("social_burst_score", 0) or 0)
    coordination = float(profile.get("coordinated_hype_score", 0) or 0)
    dump_risk = float(profile.get("dump_risk_score", 0) or 0)
    execution_score = float(decision.get("execution_score", 0) or 0)
    venue_count = int(decision.get("venue_count", 0) or source_stack.get("verified_routes", 0) or 0)
    source_tier = (source_stack.get("confirmation_tier") or "thin").strip().lower()
    social_confirmed = bool(source_stack.get("telegram_active")) or bool(source_stack.get("lunarcrush_active")) or bool(signal.get("is_trending"))
    telegram_confirmed = bool(source_stack.get("telegram_active"))
    market_confirmed = bool(source_stack.get("coingecko_market_active"))
    identity_classification = (asset_identity.get("classification") or "").strip().lower()
    meme_score = float(asset_identity.get("meme_score", 0) or 0)
    speculative_score = float(asset_identity.get("speculative_score", 0) or 0)
    serious_score = float(asset_identity.get("serious_score", 0) or 0)
    rugpull_score = float(rugpull_profile.get("score", 0) or 0)

    if venue_count < 1:
        hard_reasons.append("no_trade_route")

    if signal_type == "pump":
        strong_override = (
            market_confirmed and
            venue_count >= 1 and
            signal_strength >= 66 and
            volume_ratio >= 3 and
            execution_score >= 40
        )

        market_structure_ok = (
            market_confirmed and
            venue_count >= 1 and
            signal_strength >= 54 and
            volume_ratio >= 2.5 and
            (
                (pc_24h >= 2 and pc_1h >= 0) or
                pc_1h >= 0.4 or
                coordination >= 18
            )
        )

        if signal_strength < 54:
            soft_reasons.append("signal_strength_below_pump_threshold")
        if volume_ratio < 2.5:
            soft_reasons.append("volume_ratio_below_pump_threshold")
        if not (((pc_24h >= 2 and pc_1h >= 0) or pc_1h >= 0.4 or coordination >= 18 or social_burst >= 18)):
            soft_reasons.append("price_momentum_not_confirmed_for_pump")
        if not (
            social_burst >= 8 or coordination >= 8 or bullish_mentions >= 1 or mentions >= 1 or
            sources >= 1 or signal.get("is_trending") or market_structure_ok
        ):
            soft_reasons.append("telegram_or_social_heat_too_thin_for_pump")
        if stage and stage not in {
            "breakout active", "coordinated hype", "extended breakout", "stealth build",
            "pullback continuation", "reversal attempt", "accumulation", "early breakout"
        }:
            soft_reasons.append("stage_not_allowed_for_pump")
        if execution_score < 35:
            soft_reasons.append("execution_score_too_low_for_pump")
        if not (social_confirmed or market_confirmed or market_structure_ok):
            soft_reasons.append("social_confirmation_missing_for_pump")
        if not (
            source_tier in {"stacked", "triple-source", "dual-source", "single-source"} or
            (market_confirmed and venue_count >= 1) or
            market_structure_ok
        ):
            soft_reasons.append("source_stack_too_thin_for_pump")
        if not (
            identity_classification in {"meme", "speculative", "mixed", "unknown"} or
            meme_score >= 28 or speculative_score >= 30 or serious_score <= 75 or market_structure_ok
        ):
            soft_reasons.append("asset_profile_not_suitable_for_pump")

        eligible = len(hard_reasons) == 0 and (strong_override or market_structure_ok or len(soft_reasons) <= 2)
        return {
            "eligible": eligible,
            "reasons": hard_reasons + ([] if eligible and (strong_override or market_structure_ok) else soft_reasons),
        }

    strong_override = (
        market_confirmed and
        venue_count >= 1 and
        signal_strength >= 62 and
        volume_ratio >= 3 and
        (dump_risk >= 55 or rugpull_score >= 35)
    )

    market_structure_ok = (
        market_confirmed and
        venue_count >= 1 and
        signal_strength >= 52 and
        volume_ratio >= 2.5 and
        (
            (pc_24h <= -2 and pc_1h <= 0) or
            pc_1h <= -0.6 or
            dump_risk >= 58
        )
    )

    if signal_strength < 52:
        soft_reasons.append("signal_strength_below_dump_threshold")
    if volume_ratio < 2.5:
        soft_reasons.append("volume_ratio_below_dump_threshold")
    if not (((pc_24h <= -2 and pc_1h <= 0) or pc_1h <= -0.6 or dump_risk >= 58)):
        soft_reasons.append("price_momentum_not_confirmed_for_dump")
    if not (
        bearish_mentions >= 1 or mentions >= 1 or sources >= 1 or social_burst >= 8 or
        coordination >= 8 or dump_risk >= 52 or market_structure_ok
    ):
        soft_reasons.append("telegram_or_social_heat_too_thin_for_dump")
    if stage and stage not in {
        "breakdown pressure", "coordinated unwind", "unwind active",
        "countertrend bounce", "reversal attempt", "distribution", "late breakdown"
    }:
        soft_reasons.append("stage_not_allowed_for_dump")
    if not (social_confirmed or rugpull_score >= 35 or market_confirmed or market_structure_ok):
        soft_reasons.append("social_or_rugpull_confirmation_missing_for_dump")
    if not (
        source_tier in {"stacked", "triple-source", "dual-source", "single-source"} or
        (market_confirmed and venue_count >= 1) or
        market_structure_ok
    ):
        soft_reasons.append("source_stack_too_thin_for_dump")
    if not (
        identity_classification in {"meme", "speculative", "mixed", "unknown"} or
        rugpull_score >= 28 or speculative_score >= 30 or market_structure_ok
    ):
        soft_reasons.append("asset_profile_not_suitable_for_dump")

    eligible = len(hard_reasons) == 0 and (strong_override or market_structure_ok or len(soft_reasons) <= 2)
    return {
        "eligible": eligible,
        "reasons": hard_reasons + ([] if eligible and (strong_override or market_structure_ok) else soft_reasons),
    }

def is_true_snapshot_signal(signal: dict, signal_type: str) -> bool:
    return bool(evaluate_snapshot_signal_gate(signal, signal_type).get("eligible"))

def is_alert_worthy_signal(signal: dict, signal_type: str) -> bool:
    if not is_true_snapshot_signal(signal, signal_type):
        return False
    decision = signal.get("decision_engine") or {}
    profile = signal.get("manipulation_profile") or {}
    signal_strength = float(signal.get("signal_strength", 0) or 0)
    execution_score = float(decision.get("execution_score", 0) or 0)
    volume_ratio = float(profile.get("volume_market_cap_ratio", 0) or decision.get("volume_market_cap_ratio") or 0)
    source_stack = signal.get("signal_sources") or signal.get("source_stack") or {}
    source_tier = (source_stack.get("confirmation_tier") or "thin").strip().lower()
    if signal_type == "pump":
        return signal_strength >= 78 and execution_score >= 58 and volume_ratio >= 12 and source_tier in {"stacked", "triple-source"}
    return signal_strength >= 72 and volume_ratio >= 10 and float(profile.get("dump_risk_score", 0) or 0) >= 70 and source_tier in {"stacked", "triple-source"}

def normalize_stage_for_direction(
    stage: Optional[str],
    resolved_direction: str,
    transition_state: Optional[str],
) -> str:
    current_stage = (stage or "").strip().lower()
    transition = (transition_state or "").strip().lower()
    bullish_only_stages = {"breakout active", "stealth build", "coordinated hype", "extended breakout", "pullback continuation", "reversal attempt", "blow-off risk"}
    bearish_only_stages = {"breakdown pressure", "coordinated unwind", "unwind active", "countertrend bounce"}

    if resolved_direction == "pump":
        if transition == "bullish_pullback":
            return "pullback continuation"
        if transition == "bullish_reversal":
            return "reversal attempt"
        if current_stage in bearish_only_stages or not current_stage:
            return "breakout active"
        return stage or "breakout active"

    if transition == "dead_cat_bounce":
        return "countertrend bounce"
    if current_stage in bullish_only_stages or not current_stage:
        return "breakdown pressure"
    return stage or "breakdown pressure"

def build_fallback_signal_analysis(
    scored_candidates: List[dict],
    fear_greed: Optional[dict] = None,
    trending: Optional[List[str]] = None,
) -> dict:
    fg = fear_greed or {"value": 50, "classification": "Neutral"}
    trending = trending or []

    for candidate in scored_candidates:
        candidate.setdefault(
            "direction_audit",
            build_direction_audit(
                symbol=candidate.get("symbol", ""),
                price_change_1h=candidate.get("price_change_1h", 0),
                price_change_24h=candidate.get("price_change_24h", 0),
                price_change_7d=candidate.get("price_change_7d", 0),
                volume_24h=candidate.get("volume_24h", 0),
                market_cap=candidate.get("market_cap", 0),
                pump_strength=candidate.get("pump_strength", 0),
                dump_strength=candidate.get("dump_strength", 0),
                is_trending=bool(candidate.get("is_trending")),
            ),
        )

    pump_candidates = sorted(
        [
            c for c in scored_candidates
            if is_true_pump_candidate(c)
        ],
        key=lambda x: x.get("pump_strength", 0),
        reverse=True,
    )[:8]
    dump_candidates = sorted(
        [
            c for c in scored_candidates
            if is_true_dump_candidate(c)
        ],
        key=lambda x: x.get("dump_strength", 0),
        reverse=True,
    )[:4]

    def confidence_for(score: float) -> str:
        if score >= 75:
            return "high"
        if score >= 50:
            return "medium"
        return "low"

    def risk_for(change_1h: float, vol_mcap: float) -> str:
        if abs(change_1h) >= 4 or vol_mcap >= 18:
            return "high"
        if abs(change_1h) >= 2 or vol_mcap >= 10:
            return "medium"
        return "low"

    fallback_pumps = []
    for coin in pump_candidates:
        score = int(round(coin.get("pump_strength", 0)))
        direction_audit = coin.get("direction_audit") or {}
        source_stack = coin.get("source_stack") or {}
        media_tail = ""
        if coin.get("bullish_mentions", 0) or coin.get("telegram_sources", 0):
            media_tail = (
                f" Telegram bias is {int(coin.get('bullish_mentions', 0) or 0)} bullish vs "
                f"{int(coin.get('bearish_mentions', 0) or 0)} bearish mentions across "
                f"{int(coin.get('telegram_sources', 0) or 0)} source(s)."
            )
        source_tail = f" Source stack: {source_stack.get('summary')}" if source_stack.get("summary") else ""
        fallback_pumps.append({
            "symbol": coin["symbol"],
            "signal_strength": score,
            "reason": (
                f"Volume/market-cap ratio at {coin.get('vol_mcap_ratio', 0)}% with 1h move "
                f"{coin.get('price_change_1h', 0):+.2f}% and 24h move {coin.get('price_change_24h', 0):+.2f}%. "
                f"Momentum score {coin.get('momentum_score', 0):.0f} indicates short-term acceleration. "
                f"Resolved structure: {direction_audit.get('transition_state', 'bullish_continuation').replace('_', ' ')}."
                f"{media_tail}{source_tail}"
            ),
            "technical_factors": "Volume anomaly, momentum acceleration, trend alignment",
            "confidence": confidence_for(score),
            "risk_level": risk_for(coin.get("price_change_1h", 0), coin.get("vol_mcap_ratio", 0)),
            "timeframe": "4-12 hours",
            "signal_sources": source_stack,
            "source_summary": source_stack.get("summary"),
        })

    fallback_dumps = []
    for coin in dump_candidates:
        score = int(round(coin.get("dump_strength", 0)))
        direction_audit = coin.get("direction_audit") or {}
        source_stack = coin.get("source_stack") or {}
        media_tail = ""
        if coin.get("bearish_mentions", 0) or coin.get("telegram_sources", 0):
            media_tail = (
                f" Telegram/media bias is {int(coin.get('bearish_mentions', 0) or 0)} bearish vs "
                f"{int(coin.get('bullish_mentions', 0) or 0)} bullish mentions across "
                f"{int(coin.get('telegram_sources', 0) or 0)} source(s)."
            )
        source_tail = f" Source stack: {source_stack.get('summary')}" if source_stack.get("summary") else ""
        fallback_dumps.append({
            "symbol": coin["symbol"],
            "signal_strength": score,
            "reason": (
                f"1h decline {coin.get('price_change_1h', 0):+.2f}% against 24h move {coin.get('price_change_24h', 0):+.2f}% "
                f"with volume/market-cap ratio {coin.get('vol_mcap_ratio', 0)}%. Selling pressure and decline acceleration remain elevated. "
                f"Resolved structure: {direction_audit.get('transition_state', 'bearish_breakdown').replace('_', ' ')}."
                f"{media_tail}{source_tail}"
            ),
            "technical_factors": "Selling pressure, decline acceleration, volume confirmation",
            "confidence": confidence_for(score),
            "risk_level": risk_for(coin.get("price_change_1h", 0), coin.get("vol_mcap_ratio", 0)),
            "timeframe": "2-8 hours",
            "signal_sources": source_stack,
            "source_summary": source_stack.get("summary"),
        })

    sentiment = fg.get("classification", "Neutral")
    trend_text = ", ".join(trending[:5]) if trending else "none"
    stacked_count = len([
        c for c in scored_candidates
        if ((c.get("source_stack") or {}).get("confirmation_tier") in {"stacked", "triple-source"})
    ])
    market_summary = (
        f"Fallback quantitative analysis active. Fear & Greed is {fg.get('value', 50)}/100 ({sentiment}). "
        f"{len(fallback_pumps)} pump candidates and {len(fallback_dumps)} dump candidates passed the scoring filters. "
        f"{stacked_count} assets currently have stacked source confirmation from rumor flow, social breadth, and market structure. "
        f"Trending symbols: {trend_text}."
    )

    return {
        "pump_signals": fallback_pumps,
        "dump_signals": fallback_dumps,
        "market_summary": market_summary,
    }

def build_fallback_chat_reply(
    message: str,
    pump_signals: List[dict],
    dump_signals: List[dict],
    summary: str,
    fear_greed: Optional[dict],
    trending: List[str],
    user_sub: str,
) -> str:
    msg = (message or "").strip().lower()
    normalized_msg = " ".join(re.findall(r"[a-zA-Z0-9ăâîșşțţ']+", msg))
    tokens = set(normalized_msg.split())
    fg = fear_greed or {}
    top_pumps = ", ".join([f"{s.get('symbol')} ({s.get('signal_strength', 0)}%)" for s in pump_signals[:3]]) or "none right now"
    top_dumps = ", ".join([f"{s.get('symbol')} ({s.get('signal_strength', 0)}%)" for s in dump_signals[:3]]) or "none right now"
    abusive_terms = [
        "idiot", "stupid", "dumb", "moron", "fuck you", "fucking", "shit", "bitch", "asshole",
        "prost", "idiotule", "bou", "dobitoc", "muie", "dracu", "mars", "retard",
    ]
    greeting_terms = ["hi", "hello", "hey", "salut", "buna", "bună", "yo"]
    thanks_terms = ["thanks", "thank you", "mersi", "multumesc", "mulțumesc", "thx"]
    capability_terms = ["what can you do", "ce poti", "ce poți", "help", "ajuta", "ajută"]
    identity_terms = ["who are you", "cine esti", "cine ești"]

    def has_term(term: str) -> bool:
        normalized_term = " ".join(re.findall(r"[a-zA-Z0-9ăâîșşțţ']+", term.lower()))
        if not normalized_term:
            return False
        if " " in normalized_term:
            return normalized_term in normalized_msg
        return normalized_term in tokens

    if not msg:
        return "Ask me about PumpRadar signals, a coin from the dashboard, market context, or your subscription."

    if any(has_term(term) for term in abusive_terms):
        return (
            "I can help with PumpRadar and crypto questions, but I will not engage with abusive language. "
            "Ask about a coin, current signals, market context, or your subscription and I will keep it concise."
        )

    if any(has_term(term) for term in identity_terms):
        return (
            "I'm PumpRadar AI, the in-app assistant for this platform. "
            "I help explain signals, summarize market context, and answer questions about coins, features, and subscriptions."
        )

    if any(has_term(term) for term in capability_terms):
        return (
            "I can explain live signals, summarize the current market, discuss coins from the latest snapshot, "
            "and help with PumpRadar features or subscription questions."
        )

    if any(has_term(term) for term in greeting_terms):
        return (
            "Hi. I can help with live PumpRadar signals, explain a coin on the dashboard, summarize market context, or clarify your subscription."
        )

    if any(has_term(term) for term in thanks_terms):
        return "You're welcome. Ask about a coin, the latest signals, market context, or your subscription if you want the next step."

    if "pump" in msg and "signal" in msg:
        return (
            "A PUMP signal means our scoring model sees bullish short-term momentum supported by volume and trend alignment. "
            f"Right now the strongest pump candidates are {top_pumps}. This is not financial advice. Always do your own research."
        )
    if "dump" in msg and "signal" in msg:
        return (
            "A DUMP signal means our model sees elevated downside pressure, usually from accelerating decline plus high relative volume. "
            f"Current dump warnings: {top_dumps}. This is not financial advice. Always do your own research."
        )
    if "plan" in msg or "price" in msg or "subscription" in msg:
        return (
            f"Your current plan is {user_sub}. PumpRadar offers a 7-day free trial, Monthly at $29.99, and Annual at $299.99. "
            "Paid plans unlock full signals and deeper analysis. This is not financial advice. Always do your own research."
        )
    if "fear" in msg or "greed" in msg or "market" in msg:
        return (
            f"Current market context: Fear & Greed is {fg.get('value', 'N/A')}/100 ({fg.get('classification', 'N/A')}). "
            f"{summary or 'Signals are still being processed.'} Trending: {', '.join(trending[:5]) if trending else 'none'}. "
            "This is not financial advice. Always do your own research."
        )
    return (
        "I can help with PumpRadar signals, market context, coins shown in the dashboard, and subscription questions. "
        f"Right now we track {len(pump_signals)} pump candidates and {len(dump_signals)} dump candidates. "
        f"Top pumps: {top_pumps}. Top dumps: {top_dumps}. Ask something specific and I will keep it short."
    )

async def analyze_signals_with_ai(candidates: List[dict], fear_greed: dict = None, trending: List[str] = None) -> dict:
    """
    SCIENTIFIC PUMP/DUMP SIGNAL ANALYSIS
    
    Uses multiple quantitative indicators:
    1. Volume Spike Detection (Abnormal Volume = vol/mcap > 15% indicates institutional interest)
    2. Momentum Analysis (RSI-like: 1h vs 24h price action divergence)
    3. Market Sentiment Alignment (Fear & Greed correlation)
    4. Social Trending Factor (CoinGecko trending = retail interest)
    5. Price Action Patterns (Higher highs, lower lows detection)
    
    Signal Strength Formula:
    PUMP = (vol_score * 0.3) + (momentum_score * 0.35) + (trend_score * 0.2) + (sentiment_score * 0.15)
    DUMP = (vol_score * 0.25) + (decline_score * 0.4) + (selling_pressure * 0.2) + (sentiment_score * 0.15)
    """
    if not candidates:
        return {"pump_signals": [], "dump_signals": [], "market_summary": "No data available"}
    
    try:
        fg = fear_greed or {"value": 50, "classification": "Neutral"}
        trending_str = ", ".join(trending[:10]) if trending else "N/A"
        fg_value = fg.get("value", 50)
        
        # Pre-calculate scientific scores for each coin
        scored_candidates = []
        for c in candidates:
            scored = score_market_candidate(c, fg_value)
            
            scored_candidates.append({
                **c,
                **scored,
            })
        
        # Select top pump candidates (strength > 50)
        pump_candidates = sorted(
            [
                c for c in scored_candidates
                if is_true_pump_candidate(c)
            ],
            key=lambda x: x["pump_strength"],
            reverse=True
        )[:15]
        
        # Select top dump candidates (strength > 40)
        dump_candidates = sorted(
            [
                c for c in scored_candidates
                if is_true_dump_candidate(c)
            ],
            key=lambda x: x["dump_strength"],
            reverse=True
        )[:10]
        
        chat = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            system_instruction="""You are a quantitative crypto analyst. You analyze PRE-SCORED signals and provide scientific explanations.
You MUST respond ONLY in valid JSON format, with no text before or after the JSON.
All text in the response MUST be in English.
Never respond in Romanian or any language other than English, even if the input prompt contains another language.
Your analysis must be SPECIFIC with exact numbers and technical reasoning - no vague statements."""
        )
        
        pump_data = "\n".join([
            f"{c['symbol']}: pump_score={c['pump_strength']}, price=${c['price']:.6f}, "
            f"vol/mcap={c['vol_mcap_ratio']:.1f}%, 1h={c['price_change_1h']:+.2f}%, "
            f"24h={c['price_change_24h']:+.2f}%, momentum={c['momentum_score']:.0f}, "
            f"trending={'YES' if c.get('is_trending') else 'no'}, "
            f"tg_bull={c.get('bullish_mentions', 0)}, tg_bear={c.get('bearish_mentions', 0)}, tg_sources={c.get('telegram_sources', 0)}, "
            f"source_tier={((c.get('source_stack') or {}).get('confirmation_tier') or 'thin')}"
            for c in pump_candidates
        ]) if pump_candidates else "No strong pump signals detected"
        
        dump_data = "\n".join([
            f"{c['symbol']}: dump_score={c['dump_strength']}, price=${c['price']:.6f}, "
            f"vol/mcap={c['vol_mcap_ratio']:.1f}%, 1h={c['price_change_1h']:+.2f}%, "
            f"24h={c['price_change_24h']:+.2f}%, tg_bull={c.get('bullish_mentions', 0)}, "
            f"tg_bear={c.get('bearish_mentions', 0)}, tg_sources={c.get('telegram_sources', 0)}, "
            f"source_tier={((c.get('source_stack') or {}).get('confirmation_tier') or 'thin')}"
            for c in dump_candidates
        ]) if dump_candidates else "No strong dump signals detected"
        
        prompt = f"""Analyze these PRE-SCORED cryptocurrency signals and provide SCIENTIFIC explanations.

MARKET CONDITIONS:
- Fear & Greed Index: {fg_value}/100 ({fg['classification']})
- Market sentiment: {'EXTREME FEAR - contrarian opportunities' if fg_value < 25 else 'FEAR - cautious accumulation zone' if fg_value < 40 else 'NEUTRAL' if fg_value < 60 else 'GREED - momentum favored' if fg_value < 75 else 'EXTREME GREED - high reversal risk'}
- Trending coins: {trending_str}

PUMP CANDIDATES (pre-scored by algorithm):
{pump_data}

DUMP CANDIDATES (pre-scored by algorithm):
{dump_data}

Return JSON with this EXACT structure. For each signal, provide SPECIFIC technical reasoning with exact numbers:

{{
  "pump_signals": [
    {{
      "symbol": "BTC",
      "signal_strength": 85,
      "reason": "Volume spike at X% (3x normal), 1h momentum +Y% outpacing 24h average by Zx. RSI-equivalent shows bullish divergence. Probability of continued upward movement: W%.",
      "technical_factors": "Abnormal volume accumulation, positive momentum divergence, Fear & Greed alignment",
      "confidence": "high",
      "risk_level": "medium",
      "timeframe": "4-12 hours"
    }}
  ],
  "dump_signals": [
    {{
      "symbol": "ETH",
      "signal_strength": 70,
      "reason": "Accelerating decline: 1h drop of X% is Yx faster than 24h average rate. High volume (Z%) suggests institutional selling. Support breakdown likely.",
      "technical_factors": "Selling pressure acceleration, volume-confirmed decline, momentum breakdown",
      "confidence": "medium",
      "risk_level": "high",
      "timeframe": "2-8 hours"
    }}
  ],
  "market_summary": "Fear & Greed at [FG_VALUE] signals [SENTIMENT]. [N] coins showing pump potential, [M] showing dump risk. Key observation: [specific technical insight]."
}}

IMPORTANT:
- Use EXACT numbers from the data (don't round too much)
- Explain WHY each signal is significant using the pre-calculated scores
- Maximum 8 pump signals and 4 dump signals, sorted by signal_strength DESC
- Confidence levels: high (>75 score), medium (50-75), low (<50)
- Risk levels based on volatility and market conditions"""
        
        response = await asyncio.to_thread(lambda: chat.generate_content(prompt).text)
        
        # Parse JSON response
        import json as json_lib
        response_clean = response.strip()
        if response_clean.startswith("```"):
            lines = response_clean.split("\n")
            response_clean = "\n".join([l for l in lines if not l.startswith("```")])
        
        result = json_lib.loads(response_clean)
        return result
    except Exception as e:
        err_text = str(e)
        if "RESOURCE_EXHAUSTED" in err_text or "quota" in err_text.lower():
            logger.warning("Gemini quota is exhausted right now - using quantitative fallback analysis")
        elif "API_KEY_INVALID" in err_text or "api key not valid" in err_text.lower():
            logger.warning("Gemini API key is invalid - using quantitative fallback analysis")
        else:
            logger.error(f"AI analysis error: {e}")
        return build_fallback_signal_analysis(scored_candidates if 'scored_candidates' in locals() else [], fear_greed, trending)

async def fetch_and_store_signals(trigger: str = "scheduler"):
    """Main job: fetch data, analyze with AI, store results"""
    if SIGNAL_SCAN_LOCK.locked():
        logger.info("Skipping signal fetch job because another scan is already running")
        return {
            "started": False,
            "completed": False,
            "scan_status": build_signal_scan_status(),
        }

    logger.info("Starting crypto signal fetch job...")
    async with SIGNAL_SCAN_LOCK:
        started_at = datetime.now(timezone.utc)
        SIGNAL_SCAN_STATE.update({
            "running": True,
            "trigger": trigger,
            "started_at": started_at,
            "finished_at": None,
            "last_error": None,
        })
        job_result = {
            "started": True,
            "completed": False,
            "pump_count": 0,
            "dump_count": 0,
            "coins_analyzed": 0,
            "snapshot_at": None,
        }

        try:
            telegram_stats_map = await get_recent_telegram_signal_map(hours=24)

            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as executor:
                cg_future = executor.submit(get_coingecko_markets, 250, 2)
                lc_future = executor.submit(get_lunarcrush_data, 50)
                fg_future = executor.submit(get_fear_greed_index)
                trending_future = executor.submit(get_coingecko_trending)

                cg_data = cg_future.result()
                lc_data = lc_future.result()
                fear_greed = fg_future.result()
                trending_symbols = trending_future.result()

            lc_lookup: Dict[str, dict] = {}
            for coin in lc_data:
                sym = (coin.get("symbol") or coin.get("s") or "").upper()
                if sym:
                    lc_lookup[sym] = coin

            recent_telegram_cutoff = datetime.now(timezone.utc) - timedelta(hours=TELEGRAM_EARLY_SIGNAL_HOURS)
            recent_telegram_signals = await db.telegram_signals.find({
                "posted_at": {"$gte": recent_telegram_cutoff},
                "symbol": {"$exists": True, "$ne": None},
            }).sort("posted_at", -1).limit(400).to_list(length=400)
            telegram_early_signals = build_telegram_early_signal_candidates(
                recent_telegram_signals,
                hours=TELEGRAM_EARLY_SIGNAL_HOURS,
                limit=TELEGRAM_EARLY_SIGNAL_LIMIT,
            )
            telegram_pipeline_records: List[dict] = []

            candidates = []
            candidate_lookup: Dict[str, dict] = {}
            for coin in cg_data:
                candidate = build_market_candidate_record(
                    coin,
                    lc_lookup=lc_lookup,
                    telegram_stats_map=telegram_stats_map,
                    trending_symbols=trending_symbols,
                    origin="coingecko_scan",
                )
                reject_reasons = explain_market_candidate_rejection(
                    price=candidate.get("price", 0) or 0,
                    volume_24h=candidate.get("volume_24h", 0) or 0,
                    market_cap=candidate.get("market_cap", 0) or 0,
                    vol_mcap_ratio=candidate.get("vol_mcap_ratio", 0) or 0,
                    is_trending=bool(candidate.get("is_trending")),
                    social_volume=candidate.get("social_volume", 0) or 0,
                    galaxy_score=candidate.get("galaxy_score", 0) or 0,
                    telegram_mentions=candidate.get("telegram_mentions", 0) or 0,
                    telegram_sources=candidate.get("telegram_sources", 0) or 0,
                    bullish_mentions=candidate.get("bullish_mentions", 0) or 0,
                    bearish_mentions=candidate.get("bearish_mentions", 0) or 0,
                )
                if reject_reasons:
                    if (candidate.get("telegram_mentions", 0) or 0) > 0 or (candidate.get("telegram_sources", 0) or 0) > 0:
                        telegram_pipeline_records.append({
                            "symbol": candidate.get("symbol"),
                            "stage": "candidate_gate",
                            "reasons": reject_reasons,
                            "candidate_origin": candidate.get("candidate_origin"),
                            "telegram_mentions": candidate.get("telegram_mentions", 0),
                            "telegram_sources": candidate.get("telegram_sources", 0),
                            "avg_score": candidate.get("telegram_avg_score", 0),
                        })
                    continue
                candidates.append(candidate)
                candidate_lookup[candidate["symbol"]] = candidate

            promoted_telegram_symbols: List[str] = []
            for early_signal in telegram_early_signals:
                symbol = (early_signal.get("symbol") or "").upper()
                if not symbol:
                    continue
                if symbol in candidate_lookup:
                    candidate_lookup[symbol]["candidate_origin"] = "coingecko_scan+telegram_heat"
                    candidate_lookup[symbol]["telegram_early_seed"] = early_signal
                    promoted_telegram_symbols.append(symbol)
                    telegram_pipeline_records.append({
                        "symbol": symbol,
                        "stage": "telegram_seed_attached",
                        "reasons": ["existing_market_candidate_gained_telegram_confirmation"],
                        "candidate_origin": candidate_lookup[symbol].get("candidate_origin"),
                        "telegram_mentions": early_signal.get("mentions", 0),
                        "telegram_sources": early_signal.get("unique_sources", 0),
                        "avg_score": early_signal.get("avg_score", 0),
                    })
                    continue
                if not early_signal.get("candidate_ready"):
                    telegram_pipeline_records.append({
                        "symbol": symbol,
                        "stage": "telegram_seed_gate",
                        "reasons": ["insufficient_cross_source_confirmation"],
                        "candidate_origin": "telegram_early",
                        "telegram_mentions": early_signal.get("mentions", 0),
                        "telegram_sources": early_signal.get("unique_sources", 0),
                        "avg_score": early_signal.get("avg_score", 0),
                    })
                    continue

                market_row = await asyncio.to_thread(
                    get_coingecko_market_snapshot,
                    symbol,
                    early_signal.get("coin_name"),
                    early_signal.get("coin_id"),
                )
                if not market_row:
                    telegram_pipeline_records.append({
                        "symbol": symbol,
                        "stage": "market_data_lookup",
                        "reasons": ["missing_market_data_for_telegram_seed"],
                        "candidate_origin": "telegram_early",
                        "telegram_mentions": early_signal.get("mentions", 0),
                        "telegram_sources": early_signal.get("unique_sources", 0),
                        "avg_score": early_signal.get("avg_score", 0),
                    })
                    continue

                candidate = build_market_candidate_record(
                    market_row,
                    lc_lookup=lc_lookup,
                    telegram_stats_map=telegram_stats_map,
                    trending_symbols=trending_symbols,
                    origin="telegram_early",
                    telegram_seed=early_signal,
                )
                reject_reasons = explain_market_candidate_rejection(
                    price=candidate.get("price", 0) or 0,
                    volume_24h=candidate.get("volume_24h", 0) or 0,
                    market_cap=candidate.get("market_cap", 0) or 0,
                    vol_mcap_ratio=candidate.get("vol_mcap_ratio", 0) or 0,
                    is_trending=bool(candidate.get("is_trending")),
                    social_volume=candidate.get("social_volume", 0) or 0,
                    galaxy_score=candidate.get("galaxy_score", 0) or 0,
                    telegram_mentions=candidate.get("telegram_mentions", 0) or 0,
                    telegram_sources=candidate.get("telegram_sources", 0) or 0,
                    bullish_mentions=candidate.get("bullish_mentions", 0) or 0,
                    bearish_mentions=candidate.get("bearish_mentions", 0) or 0,
                )
                hard_reject_reasons = [reason for reason in reject_reasons if reason != "insufficient_market_social_or_telegram_activity"]
                if hard_reject_reasons:
                    telegram_pipeline_records.append({
                        "symbol": symbol,
                        "stage": "telegram_candidate_gate",
                        "reasons": hard_reject_reasons,
                        "candidate_origin": "telegram_early",
                        "telegram_mentions": early_signal.get("mentions", 0),
                        "telegram_sources": early_signal.get("unique_sources", 0),
                        "avg_score": early_signal.get("avg_score", 0),
                    })
                    continue

                candidate["candidate_gate_override_reason"] = "telegram_cross_source_seed"
                candidate["telegram_early_seed"] = early_signal
                candidates.append(candidate)
                candidate_lookup[symbol] = candidate
                promoted_telegram_symbols.append(symbol)
                telegram_pipeline_records.append({
                    "symbol": symbol,
                    "stage": "telegram_promoted_candidate",
                    "reasons": ["cross_source_telegram_seed_promoted_into_ai_pipeline"],
                    "candidate_origin": "telegram_early",
                    "telegram_mentions": early_signal.get("mentions", 0),
                    "telegram_sources": early_signal.get("unique_sources", 0),
                    "avg_score": early_signal.get("avg_score", 0),
                })

            logger.info(f"Filtered to {len(candidates)} valid coins from {len(cg_data)} total (%s telegram-promoted)", len(promoted_telegram_symbols))
            ai_result = await analyze_signals_with_ai(candidates, fear_greed, trending_symbols)
            cg_lookup = {c["symbol"].upper(): c for c in candidates}

            def enrich_signal(sig: dict, signal_type: str) -> dict:
                sym = sig.get("symbol", "").upper()
                market = cg_lookup.get(sym, {})
                if not market:
                    return None

                price = market.get("price") or 0
                if price <= 0:
                    return None

                direction_audit = build_direction_audit(
                    symbol=sym,
                    price_change_1h=market.get("price_change_1h") or 0,
                    price_change_24h=market.get("price_change_24h") or 0,
                    price_change_7d=market.get("price_change_7d") or 0,
                    volume_24h=market.get("volume_24h") or 0,
                    market_cap=market.get("market_cap") or 0,
                    signal_type_hint=signal_type,
                    signal_strength_hint=sig.get("signal_strength", 0),
                    pump_strength=sig.get("signal_strength", 0) if signal_type == "pump" else market.get("pump_strength", 0),
                    dump_strength=sig.get("signal_strength", 0) if signal_type == "dump" else market.get("dump_strength", 0),
                    is_trending=market.get("is_trending", False),
                )
                resolved_signal_type = direction_audit.get("resolved_direction", signal_type)
                if resolved_signal_type != signal_type:
                    logger.info(
                        "Direction audit rerouted %s from %s to %s (1h=%+.2f 24h=%+.2f 7d=%+.2f gap=%.2f transition=%s)",
                        sym,
                        signal_type,
                        resolved_signal_type,
                        direction_audit.get("price_change_1h", 0.0),
                        direction_audit.get("price_change_24h", 0.0),
                        direction_audit.get("price_change_7d", 0.0),
                        direction_audit.get("score_gap", 0.0),
                        direction_audit.get("transition_state", "unknown"),
                    )

                market_details = get_coin_extended_details(market.get("id", ""))
                market_platform, market_contract = pick_primary_contract(market_details)
                venues = build_market_venues(sym, market.get("id", ""), market_platform, market_contract)
                asset_identity = build_asset_identity_profile(
                    symbol=sym,
                    coin_id=market.get("id", ""),
                    name=market.get("name", sym),
                    market_cap=market.get("market_cap") or 0,
                    details=market_details,
                    venues=venues,
                )
                tokenomics = build_tokenomics_profile(market_details) if market_details else {
                    "circulating_supply": None,
                    "total_supply": None,
                    "max_supply": None,
                    "fdv_usd": None,
                    "market_cap_usd": market.get("market_cap") or 0,
                    "circulating_ratio_pct": None,
                    "dilution_gap_pct": None,
                    "unlock_risk": "Unknown",
                    "warnings": [],
                    "source": "CoinGecko",
                }
                decision_engine = build_signal_execution_plan(
                    signal_type=resolved_signal_type,
                    symbol=sym,
                    price=price,
                    price_change_1h=market.get("price_change_1h") or 0,
                    price_change_24h=market.get("price_change_24h") or 0,
                    price_change_7d=market.get("price_change_7d") or 0,
                    volume_24h=market.get("volume_24h") or 0,
                    market_cap=market.get("market_cap") or 0,
                    signal_strength=sig.get("signal_strength", 0),
                    confidence=sig.get("confidence", "medium"),
                    risk_level=sig.get("risk_level", "medium"),
                    venues=venues,
                    direction_audit=direction_audit,
                )
                source_stack = build_signal_source_stack(
                    symbol=sym,
                    price_change_1h=market.get("price_change_1h") or 0,
                    price_change_24h=market.get("price_change_24h") or 0,
                    vol_mcap_ratio=market.get("vol_mcap_ratio") or 0,
                    is_trending=market.get("is_trending", False),
                    telegram_mentions=market.get("telegram_mentions", 0) or 0,
                    telegram_sources=market.get("telegram_sources", 0) or 0,
                    bullish_mentions=market.get("bullish_mentions", 0) or 0,
                    bearish_mentions=market.get("bearish_mentions", 0) or 0,
                    telegram_avg_score=market.get("telegram_avg_score", 0) or 0,
                    social_volume=market.get("social_volume") or 0,
                    galaxy_score=market.get("galaxy_score") or 0,
                    sentiment=market.get("sentiment") or 0,
                    lunar_mentions=market.get("lunar_mentions", 0) or 0,
                    lunar_creators=market.get("lunar_creators", 0) or 0,
                    lunar_interactions=market.get("lunar_interactions", 0) or 0,
                    lunar_dominance=market.get("lunar_dominance", 0) or 0,
                    venue_count=decision_engine.get("venue_count", 0) or len(venues),
                    preferred_venue=decision_engine.get("preferred_venue"),
                )

                holder_distribution = {"available": False}
                goplus_security = {"available": False}
                goplus_rugpull = {"available": False}
                wallet_cluster_intelligence = {
                    "available": False,
                    "cluster_risk_score": None,
                    "combined_insider_pct": None,
                    "top_10_pct": None,
                    "long_tail_pct": None,
                    "warnings": [],
                    "summary": "No verified wallet clustering data yet.",
                }
                contract_risk = {
                    "available": False,
                    "risk_score": None,
                    "risk_level": None,
                    "warnings": [],
                    "source": "GoPlus",
                }
                if market_contract:
                    holder_distribution = get_holder_distribution(market_platform, market_contract)
                    goplus_security = get_goplus_security(market_platform, market_contract)
                    goplus_rugpull = get_goplus_rugpull(market_platform, market_contract)
                    wallet_cluster_intelligence = build_wallet_cluster_intelligence(holder_distribution, goplus_security)
                    contract_risk = build_contract_risk_profile(market_platform, market_contract, goplus_security, goplus_rugpull)

                manipulation_profile = build_manipulation_profile(
                    signal_type=resolved_signal_type,
                    symbol=sym,
                    price_change_1h=market.get("price_change_1h") or 0,
                    price_change_24h=market.get("price_change_24h") or 0,
                    price_change_7d=market.get("price_change_7d") or 0,
                    volume_24h=market.get("volume_24h") or 0,
                    market_cap=market.get("market_cap") or 0,
                    signal_strength=sig.get("signal_strength", 0),
                    risk_level=sig.get("risk_level", "medium"),
                    is_trending=market.get("is_trending", False),
                    social_volume=market.get("social_volume") or 0,
                    sentiment=market.get("sentiment") or 0,
                    galaxy_score=market.get("galaxy_score") or 0,
                    decision_engine=decision_engine,
                    telegram_stats=telegram_stats_map.get(sym),
                    direction_audit=direction_audit,
                )
                rugpull_profile = build_rugpull_profile(
                    asset_identity=asset_identity,
                    tokenomics=tokenomics,
                    wallet_cluster_intelligence=wallet_cluster_intelligence,
                    contract_risk=contract_risk,
                    venues=venues,
                    manipulation_profile=manipulation_profile,
                )
                manipulation_timeline = build_manipulation_timeline(
                    symbol=sym,
                    signal_type=resolved_signal_type,
                    manipulation_profile=manipulation_profile,
                    decision_engine=decision_engine,
                    fear_greed=fear_greed,
                    is_trending=market.get("is_trending", False),
                    social_volume=market.get("social_volume") or 0,
                    galaxy_score=market.get("galaxy_score") or 0,
                )

                return {
                    **sig,
                    "signal_type": resolved_signal_type,
                    "requested_signal_type": signal_type,
                    "candidate_origin": market.get("candidate_origin", "coingecko_scan"),
                    "candidate_gate_override_reason": market.get("candidate_gate_override_reason"),
                    "telegram_early_seed": market.get("telegram_early_seed"),
                    "symbol": sym,
                    "name": market.get("name", sym),
                    "id": market.get("id"),
                    "price": price,
                    "price_change_1h": market.get("price_change_1h"),
                    "price_change_24h": market.get("price_change_24h"),
                    "price_change_7d": market.get("price_change_7d"),
                    "volume_24h": market.get("volume_24h"),
                    "market_cap": market.get("market_cap"),
                    "social_volume": market.get("social_volume"),
                    "sentiment": market.get("sentiment"),
                    "galaxy_score": market.get("galaxy_score"),
                    "image": market.get("image"),
                    "is_trending": market.get("is_trending", False),
                    "direction_audit": direction_audit,
                    "decision_engine": decision_engine,
                    "preferred_venue": decision_engine.get("preferred_venue"),
                    "signal_sources": source_stack,
                    "source_summary": source_stack.get("summary"),
                    "asset_identity": asset_identity,
                    "rugpull_profile": rugpull_profile,
                    "manipulation_profile": manipulation_profile,
                    "manipulation_timeline": manipulation_timeline,
                    "timestamp": datetime.now(timezone.utc),
                }

            all_enriched_signals = [
                s for s in (
                    [enrich_signal(s, "pump") for s in ai_result.get("pump_signals", [])] +
                    [enrich_signal(s, "dump") for s in ai_result.get("dump_signals", [])]
                ) if s is not None
            ]
            deduped_signals: Dict[str, dict] = {}
            for enriched_signal in all_enriched_signals:
                symbol_key = enriched_signal.get("symbol", "").upper()
                if not symbol_key:
                    continue
                existing = deduped_signals.get(symbol_key)
                if not existing:
                    deduped_signals[symbol_key] = enriched_signal
                    continue
                current_rank = (
                    float(existing.get("signal_strength", 0) or 0),
                    float((existing.get("direction_audit") or {}).get("score_gap", 0) or 0),
                    abs(float(existing.get("price_change_24h", 0) or 0)),
                )
                candidate_rank = (
                    float(enriched_signal.get("signal_strength", 0) or 0),
                    float((enriched_signal.get("direction_audit") or {}).get("score_gap", 0) or 0),
                    abs(float(enriched_signal.get("price_change_24h", 0) or 0)),
                )
                if candidate_rank > current_rank:
                    deduped_signals[symbol_key] = enriched_signal

            gated_pump_signals: List[dict] = []
            gated_dump_signals: List[dict] = []
            for enriched_signal in deduped_signals.values():
                resolved_signal_type = enriched_signal.get("signal_type")
                if resolved_signal_type not in {"pump", "dump"}:
                    continue
                gate = evaluate_snapshot_signal_gate(enriched_signal, resolved_signal_type)
                enriched_signal["snapshot_gate"] = gate
                if gate.get("eligible"):
                    if resolved_signal_type == "pump":
                        gated_pump_signals.append(enriched_signal)
                    else:
                        gated_dump_signals.append(enriched_signal)
                    continue
                manipulation_profile = enriched_signal.get("manipulation_profile") or {}
                if (
                    enriched_signal.get("candidate_origin") == "telegram_early" or
                    int(manipulation_profile.get("telegram_mentions") or 0) > 0 or
                    int(manipulation_profile.get("telegram_sources") or 0) > 0
                ):
                    telegram_pipeline_records.append({
                        "symbol": enriched_signal.get("symbol"),
                        "stage": "snapshot_gate",
                        "reasons": gate.get("reasons", []),
                        "candidate_origin": enriched_signal.get("candidate_origin"),
                        "signal_type": resolved_signal_type,
                        "signal_strength": enriched_signal.get("signal_strength", 0),
                        "telegram_mentions": manipulation_profile.get("telegram_mentions", 0),
                        "telegram_sources": manipulation_profile.get("telegram_sources", 0),
                        "avg_score": ((enriched_signal.get("telegram_early_seed") or {}).get("avg_score") or 0),
                    })

            pump_signals = sorted(
                gated_pump_signals,
                key=lambda item: (
                    item.get("signal_strength", 0),
                    (item.get("direction_audit") or {}).get("score_gap", 0),
                ),
                reverse=True,
            )[:8]
            dump_signals = sorted(
                gated_dump_signals,
                key=lambda item: (
                    item.get("signal_strength", 0),
                    (item.get("direction_audit") or {}).get("score_gap", 0),
                ),
                reverse=True,
            )[:4]

            telegram_payload = api_ok(build_telegram_consensus_payload([], [], 24))
            try:
                dashboard_sources = []
                all_sources = await get_enabled_telegram_sources()
                dashboard_sources = [
                    source for source in all_sources
                    if derive_telegram_source_profile(source).get("quality_badge") in {"High Signal Quality", "Fast but Risky"}
                ]
                source_ids = [str(source["_id"]) for source in dashboard_sources]
                dashboard_signals = []
                if source_ids:
                    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
                    dashboard_signals = await db.telegram_signals.find({
                        "source_id": {"$in": source_ids},
                        "posted_at": {"$gte": cutoff},
                    }).sort("posted_at", -1).limit(300).to_list(length=300)
                telegram_payload = api_ok(build_telegram_consensus_payload(dashboard_signals, dashboard_sources, 24))
            except Exception as e:
                logger.warning(f"Precompute telegram consensus failed: {e}")

            snapshot_at = datetime.now(timezone.utc)
            stage_counts: Dict[str, int] = {}
            for record in telegram_pipeline_records:
                stage_name = record.get("stage") or "unknown"
                stage_counts[stage_name] = stage_counts.get(stage_name, 0) + 1

            snapshot = {
                "timestamp": snapshot_at,
                "pump_signals": pump_signals,
                "dump_signals": dump_signals,
                "telegram_early_signals": telegram_early_signals,
                "telegram_pipeline_audit": {
                    "window_hours": TELEGRAM_EARLY_SIGNAL_HOURS,
                    "early_signal_count": len(telegram_early_signals),
                    "promotion_count": len(promoted_telegram_symbols),
                    "promoted_symbols": promoted_telegram_symbols[:12],
                    "stage_counts": stage_counts,
                    "records": telegram_pipeline_records[:40],
                },
                "market_summary": ai_result.get("market_summary", ""),
                "coins_analyzed": len(candidates),
                "fear_greed": fear_greed,
                "trending": trending_symbols[:10],
                "source_pipeline": {
                    "telegram_enabled": True,
                    "lunarcrush_enabled": bool(lc_data),
                    "coingecko_enabled": bool(cg_data),
                    "x_enabled": bool(X_BEARER_TOKEN and not looks_like_placeholder(X_BEARER_TOKEN, "X_BEARER_TOKEN")),
                },
            }
            telegram_data = telegram_payload.get("data") if isinstance(telegram_payload, dict) else None
            snapshot["telegram_consensus_precomputed"] = telegram_data
            snapshot["cross_platform_consensus_precomputed"] = build_dashboard_cross_platform_consensus(snapshot, telegram_data)
            snapshot["fresh_manipulation_alerts_precomputed"] = build_intelligence_alerts(snapshot, telegram_data)
            await db.signal_snapshots.insert_one(snapshot)
            await persist_telegram_pipeline_audit(telegram_pipeline_records, snapshot_at, trigger)
            calibration_summary = await build_telegram_calibration_summary(72)
            snapshot["telegram_calibration_summary"] = calibration_summary
            await db.signal_snapshots.update_one(
                {"timestamp": snapshot_at},
                {"$set": {"telegram_calibration_summary": calibration_summary}},
            )

            job_result.update({
                "completed": True,
                "pump_count": len(pump_signals),
                "dump_count": len(dump_signals),
                "coins_analyzed": len(candidates),
                "snapshot_at": snapshot.get("timestamp"),
            })

            if pump_signals or dump_signals:
                asyncio.create_task(check_and_send_alerts(pump_signals, dump_signals))

            count = await db.signal_snapshots.count_documents({})
            if count > 48:
                oldest = await db.signal_snapshots.find({}).sort("timestamp", 1).limit(count - 48).to_list(length=100)
                old_ids = [d["_id"] for d in oldest]
                await db.signal_snapshots.delete_many({"_id": {"$in": old_ids}})

            logger.info(f"Signal job complete: {len(pump_signals)} pump, {len(dump_signals)} dump signals")
            return {
                **job_result,
                "scan_status": build_signal_scan_status(),
            }
        except Exception as e:
            SIGNAL_SCAN_STATE["last_error"] = str(e)
            logger.exception(f"Signal fetch job error: {e}")
            return {
                **job_result,
                "completed": False,
                "error": str(e),
                "scan_status": build_signal_scan_status(),
            }
        finally:
            finished_at = datetime.now(timezone.utc)
            SIGNAL_SCAN_STATE.update({
                "running": False,
                "finished_at": finished_at,
                "last_snapshot_at": job_result.get("snapshot_at"),
                "last_result": {
                    "pump_count": job_result.get("pump_count", 0),
                    "dump_count": job_result.get("dump_count", 0),
                    "coins_analyzed": job_result.get("coins_analyzed", 0),
                    "completed": bool(job_result.get("completed")),
                },
            })

# ─────────────────────────────────────────────
# CRYPTO SIGNAL ENDPOINTS
# ─────────────────────────────────────────────
def serialize_signal(s: dict) -> dict:
    """Remove MongoDB _id and serialize datetime"""
    s.pop("_id", None)
    if isinstance(s.get("timestamp"), datetime):
        s["timestamp"] = s["timestamp"].isoformat()
    return s

async def build_dashboard_new_algorithm_signals(snapshot: Optional[dict], limit: int = 6) -> List[dict]:
    if not snapshot:
        return []

    snapshot_ts = snapshot.get("timestamp")
    snapshot_key = snapshot_ts.isoformat() if isinstance(snapshot_ts, datetime) else str(snapshot_ts)
    cache_key = f"new_algorithm::{snapshot_key}"
    cached_rows = get_memory_cache(NEW_ALGORITHM_SIGNALS_CACHE, cache_key, ttl_seconds=300)
    if cached_rows is not None:
        return cached_rows

    candidates: List[dict] = []

    for signal in (snapshot.get("pump_signals", []) or [])[:3]:
        candidates.append({
            "source": "pump_signal",
            "signal_type": "pump",
            "symbol": (signal.get("symbol") or "").upper(),
            "name": signal.get("name") or signal.get("symbol"),
            "coin_id": signal.get("id"),
        })

    for signal in (snapshot.get("dump_signals", []) or [])[:3]:
        candidates.append({
            "source": "dump_signal",
            "signal_type": "dump",
            "symbol": (signal.get("symbol") or "").upper(),
            "name": signal.get("name") or signal.get("symbol"),
            "coin_id": signal.get("id"),
        })

    for signal in (snapshot.get("telegram_early_signals", []) or [])[:4]:
        candidates.append({
            "source": "telegram_early",
            "signal_type": signal.get("direction") or "pump",
            "symbol": (signal.get("symbol") or "").upper(),
            "name": signal.get("coin_name") or signal.get("symbol"),
            "coin_id": signal.get("coin_id"),
        })

    deduped_candidates: List[dict] = []
    seen_candidates: set[str] = set()
    for candidate in candidates:
        dedupe_key = f"{candidate.get('coin_id') or ''}::{candidate.get('symbol') or ''}"
        if dedupe_key in seen_candidates:
            continue
        seen_candidates.add(dedupe_key)
        deduped_candidates.append(candidate)

    async def analyze_candidate(candidate: dict) -> Optional[dict]:
        symbol = candidate.get("symbol") or ""
        coin_id = candidate.get("coin_id")
        name = candidate.get("name")

        if not coin_id and symbol:
            coin_id = await asyncio.to_thread(resolve_coingecko_coin_id, symbol, name)
        if not coin_id:
            return None

        details = await asyncio.to_thread(get_coin_extended_details, coin_id)
        platform_id, contract_address = pick_primary_contract(details)
        if not platform_id or not contract_address:
            return None

        pump_engine_payload = await build_coin_pump_engine_payload(platform_id, contract_address)
        analysis = pump_engine_payload.get("analysis") if pump_engine_payload.get("available") else None
        if not analysis:
            return None

        return {
            "symbol": symbol,
            "name": name or symbol,
            "source": candidate.get("source"),
            "signal_type": candidate.get("signal_type"),
            "platform_id": platform_id,
            "contract_address": contract_address,
            "analysis": analysis,
        }

    tasks = [analyze_candidate(candidate) for candidate in deduped_candidates[:limit]]
    rows = [row for row in await asyncio.gather(*tasks) if row]

    filtered_rows = []
    for row in rows:
        analysis = row.get("analysis") or {}
        final_block = analysis.get("final") or {}
        ai_block = analysis.get("ai_judge") or {}
        rule_block = analysis.get("rule_engine") or {}

        final_verdict = (
            final_block.get("verdict")
            or ai_block.get("final_verdict")
            or rule_block.get("verdict")
            or ""
        )
        final_action = (
            final_block.get("action")
            or ai_block.get("final_action")
            or rule_block.get("action")
            or ""
        )
        final_score = (
            final_block.get("confidence")
            or ai_block.get("confidence")
            or rule_block.get("score")
            or 0
        )

        verdict_text = str(final_verdict).strip().lower()
        action_text = str(final_action).strip().upper()

        if verdict_text == "noise":
            continue
        if action_text == "WATCH" and verdict_text in {"likely_noise", "coordinated_noise"}:
            continue

        row["_display_score"] = float(final_score or 0)
        filtered_rows.append(row)

    filtered_rows.sort(key=lambda item: float(item.get("_display_score", 0) or 0), reverse=True)
    return set_memory_cache(NEW_ALGORITHM_SIGNALS_CACHE, cache_key, filtered_rows[:limit])

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
            "telegram_early_signals": [],
            "telegram_pipeline_audit": {"window_hours": TELEGRAM_EARLY_SIGNAL_HOURS, "early_signal_count": 0, "promotion_count": 0, "promoted_symbols": [], "stage_counts": {}, "records": []},
            "telegram_calibration_summary": None,
            "new_algorithm_signals": [],
            "market_summary": "Signals are being processed. Please check back in a few minutes.",
            "last_updated": None,
            "coins_analyzed": 0,
        })
    
    # Check subscription for full access
    has_access = True  # Default to true for unauthenticated users (limited view)
    subscription_block_reason = None
    
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
                    has_access = False
                    subscription_block_reason = "trial_expired"
            else:
                has_access = False
                subscription_block_reason = "trial_expired"
        else:
            has_access = False
            subscription_block_reason = "subscription_required"
    
    if subscription_block_reason and user:
        if subscription_block_reason == "trial_expired":
            raise HTTPException(
                status_code=402,
                detail=api_err("Your free trial has expired. Please subscribe to continue.", "SUBSCRIPTION_EXPIRED")
            )
        raise HTTPException(
            status_code=402,
            detail=api_err("Start your free 7-day trial to unlock the full PumpRadar signal feed.", "SUBSCRIPTION_REQUIRED")
        )
    
    snapshot_ts = snapshot.get("timestamp")
    snapshot_key = snapshot_ts.isoformat() if isinstance(snapshot_ts, datetime) else str(snapshot_ts)
    cache_key = f"{snapshot_key}::{int(has_access)}"
    cached_payload = get_memory_cache(DASHBOARD_PAYLOAD_CACHE, cache_key, ttl_seconds=90)
    if cached_payload is not None:
        return api_ok({
            **cached_payload,
            "scan_status": build_signal_scan_status(),
        })

    pump = [serialize_signal(dict(s)) for s in snapshot.get("pump_signals", [])]
    dump = [serialize_signal(dict(s)) for s in snapshot.get("dump_signals", [])]
    telegram_data = snapshot.get("telegram_consensus_precomputed")
    cross_platform_consensus = snapshot.get("cross_platform_consensus_precomputed")
    fresh_manipulation_alerts = snapshot.get("fresh_manipulation_alerts_precomputed")
    if has_access and telegram_data is None:
        telegram_payload = await telegram_consensus(hours=24, user=user)
        telegram_data = telegram_payload.get("data") if isinstance(telegram_payload, dict) else None
    elif not has_access:
        telegram_data = build_telegram_consensus_payload([], [], 24)
    if cross_platform_consensus is None:
        cross_platform_consensus = build_dashboard_cross_platform_consensus(snapshot, telegram_data)
    if fresh_manipulation_alerts is None:
        fresh_manipulation_alerts = build_intelligence_alerts(snapshot, telegram_data)
    telegram_calibration_summary = snapshot.get("telegram_calibration_summary")
    if telegram_calibration_summary is None and has_access:
        telegram_calibration_summary = await build_telegram_calibration_summary(72)
    new_algorithm_signals = await build_dashboard_new_algorithm_signals(snapshot)
    
    payload = {
        "pump_signals": pump,
        "dump_signals": dump,
        "telegram_early_signals": snapshot.get("telegram_early_signals", []),
        "telegram_pipeline_audit": snapshot.get("telegram_pipeline_audit", {"window_hours": TELEGRAM_EARLY_SIGNAL_HOURS, "early_signal_count": 0, "promotion_count": 0, "promoted_symbols": [], "stage_counts": {}, "records": []}),
        "telegram_calibration_summary": telegram_calibration_summary if has_access else None,
        "new_algorithm_signals": new_algorithm_signals,
        "market_summary": snapshot.get("market_summary", ""),
        "last_updated": snapshot_ts.isoformat() if isinstance(snapshot_ts, datetime) else snapshot_ts,
        "coins_analyzed": snapshot.get("coins_analyzed", 0),
        "has_full_access": has_access,
        "fear_greed": snapshot.get("fear_greed"),
        "trending": snapshot.get("trending", []),
        "telegram_consensus": telegram_data,
        "cross_platform_consensus": cross_platform_consensus,
        "fresh_manipulation_alerts": fresh_manipulation_alerts,
        "scan_status": build_signal_scan_status(),
    }

    return api_ok(set_memory_cache(DASHBOARD_PAYLOAD_CACHE, cache_key, payload))

@app.get("/api/intelligence/alerts")
async def intelligence_alerts(user=Depends(require_active_subscription)):
    snapshot = await db.signal_snapshots.find_one({}, sort=[("timestamp", -1)])
    if not snapshot:
        return api_ok({"alerts": [], "last_updated": None})
    alerts = snapshot.get("fresh_manipulation_alerts_precomputed")
    if alerts is None:
        telegram_payload = await telegram_consensus(hours=24, user=user)
        alerts = build_intelligence_alerts(snapshot, telegram_payload.get("data") if isinstance(telegram_payload, dict) else None)
    return api_ok({
        "alerts": alerts,
        "last_updated": serialize_datetime(snapshot.get("timestamp")) if snapshot else None,
    })

@app.get("/api/intelligence/cross-platform")
async def cross_platform_consensus(user=Depends(require_active_subscription)):
    snapshot = await db.signal_snapshots.find_one({}, sort=[("timestamp", -1)])
    if not snapshot:
        return api_ok({"cards": [], "last_updated": None})
    snapshot_ts = snapshot.get("timestamp")
    snapshot_key = snapshot_ts.isoformat() if isinstance(snapshot_ts, datetime) else str(snapshot_ts)
    cache_key = f"cross_platform::{snapshot_key}"
    cached_cards = get_memory_cache(CROSS_PLATFORM_CACHE, cache_key, ttl_seconds=180)
    if cached_cards is not None:
        return api_ok({
            "cards": cached_cards,
            "last_updated": serialize_datetime(snapshot.get("timestamp")),
        })
    cards = snapshot.get("cross_platform_consensus_precomputed")
    if cards is None:
        telegram_payload = await telegram_consensus(hours=24, user=user)
        cards = build_dashboard_cross_platform_consensus(snapshot, telegram_payload.get("data") if isinstance(telegram_payload, dict) else None)
    cards = set_memory_cache(CROSS_PLATFORM_CACHE, cache_key, cards)
    return api_ok({
        "cards": cards,
        "last_updated": serialize_datetime(snapshot.get("timestamp")) if snapshot else None,
    })

@app.get("/api/crypto/history")
async def get_history(limit: int = 24, user=Depends(require_active_subscription)):
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

@app.get("/api/crypto/snapshots")
async def get_snapshots(limit: int = 24, user=Depends(require_active_subscription)):
    """Get detailed signal snapshots for timeline view"""
    snapshots = await db.signal_snapshots.find({}).sort("timestamp", -1).limit(limit).to_list(length=limit)
    
    result = []
    for snap in snapshots:
        snap.pop("_id", None)
        if isinstance(snap.get("timestamp"), datetime):
            snap["timestamp"] = snap["timestamp"].isoformat()
        # Serialize signals
        for s in snap.get("pump_signals", []):
            if isinstance(s.get("timestamp"), datetime):
                s["timestamp"] = s["timestamp"].isoformat()
        for s in snap.get("dump_signals", []):
            if isinstance(s.get("timestamp"), datetime):
                s["timestamp"] = s["timestamp"].isoformat()
        result.append(snap)
    
    return api_ok({"snapshots": result})

@app.get("/api/crypto/replays")
async def get_replays(limit: int = 36, user=Depends(require_active_subscription)):
    replay = await build_recent_case_replays(limit=limit)
    return api_ok({"replays": replay})

# ─────────────────────────────────────────────
# WATCHLIST & ALERTS
# ─────────────────────────────────────────────
class WatchlistItem(BaseModel):
    symbol: str
    alertEnabled: bool = False
    alertThreshold: int = 80

class WatchlistUpdate(BaseModel):
    items: List[WatchlistItem]

@app.get("/api/user/watchlist")
async def get_watchlist(user=Depends(get_current_user)):
    """Get user's watchlist"""
    watchlist = user.get("watchlist", [])
    return api_ok({"watchlist": watchlist})

@app.post("/api/user/watchlist")
async def update_watchlist(data: WatchlistUpdate, user=Depends(get_current_user)):
    """Update user's watchlist"""
    watchlist_data = [item.dict() for item in data.items]
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"watchlist": watchlist_data}}
    )
    return api_ok({"message": "Watchlist updated", "watchlist": watchlist_data})

@app.post("/api/user/watchlist/add")
async def add_to_watchlist(item: WatchlistItem, user=Depends(get_current_user)):
    """Add coin to watchlist"""
    watchlist = user.get("watchlist", [])
    # Check if already exists
    if any(w.get("symbol") == item.symbol.upper() for w in watchlist):
        return api_ok({"message": "Already in watchlist", "watchlist": watchlist})
    
    new_item = {
        "symbol": item.symbol.upper(),
        "alertEnabled": item.alertEnabled,
        "alertThreshold": item.alertThreshold,
        "addedAt": datetime.now(timezone.utc).isoformat(),
    }
    watchlist.append(new_item)
    
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"watchlist": watchlist}}
    )
    return api_ok({"message": f"Added {item.symbol} to watchlist", "watchlist": watchlist})

@app.delete("/api/user/watchlist/{symbol}")
async def remove_from_watchlist(symbol: str, user=Depends(get_current_user)):
    """Remove coin from watchlist"""
    watchlist = user.get("watchlist", [])
    watchlist = [w for w in watchlist if w.get("symbol") != symbol.upper()]
    
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"watchlist": watchlist}}
    )
    return api_ok({"message": f"Removed {symbol} from watchlist", "watchlist": watchlist})

# ─────────────────────────────────────────────
# EMAIL ALERTS FOR SIGNAL CATEGORIES
# ─────────────────────────────────────────────
def build_signal_route_label(signal: dict) -> str:
    preferred_venue = (
        signal.get("preferred_venue")
        or ((signal.get("decision_engine") or {}).get("preferred_venue"))
        or {}
    )
    if not preferred_venue:
        return ""
    route_name = (preferred_venue.get("name") or "").strip()
    route_pair = (preferred_venue.get("pair") or "").strip()
    route_type = (preferred_venue.get("type") or "").strip().upper()
    parts = [part for part in [route_name, route_pair, route_type] if part]
    return " · ".join(parts)

def classify_signal_alert(signal: dict, signal_type: str) -> Optional[dict]:
    if not is_true_snapshot_signal(signal, signal_type):
        return None

    profile = signal.get("manipulation_profile") or {}
    decision = signal.get("decision_engine") or {}
    source_stack = signal.get("signal_sources") or signal.get("source_stack") or {}
    asset_identity = signal.get("asset_identity") or {}
    rugpull_profile = signal.get("rugpull_profile") or {}

    signal_strength = float(signal.get("signal_strength", 0) or 0)
    volume_ratio = float(profile.get("volume_market_cap_ratio", 0) or decision.get("volume_market_cap_ratio") or 0)
    execution_score = float(decision.get("execution_score", 0) or 0)
    venue_count = int(decision.get("venue_count", 0) or source_stack.get("verified_routes", 0) or 0)
    source_tier = (source_stack.get("confirmation_tier") or "thin").strip().lower()
    telegram_active = bool(source_stack.get("telegram_active"))
    market_confirmed = bool(source_stack.get("coingecko_market_active"))
    bullish_mentions = int(profile.get("bullish_mentions", 0) or 0)
    bearish_mentions = int(profile.get("bearish_mentions", 0) or 0)
    telegram_sources = int(profile.get("telegram_sources", 0) or 0)
    dump_risk_score = float(profile.get("dump_risk_score", 0) or 0)
    identity_classification = (asset_identity.get("classification") or "").strip().lower()
    meme_score = float(asset_identity.get("meme_score", 0) or 0)
    speculative_score = float(asset_identity.get("speculative_score", 0) or 0)
    serious_score = float(asset_identity.get("serious_score", 0) or 0)
    rugpull_score = float(rugpull_profile.get("score", 0) or 0)
    preferred_route = build_signal_route_label(signal)

    if signal_type == "pump":
        if is_alert_worthy_signal(signal, signal_type):
            return {
                "kind": "confirmed_pump",
                "title": "Confirmed Pump",
                "subject_prefix": "🚀 Confirmed Pump",
                "accent": "#10b981",
                "intro": "A high-conviction pump signal passed the strict confirmation stack.",
                "priority": 3,
                "route_label": preferred_route,
            }

        new_meme_candidate_ok = (
            identity_classification in {"meme", "speculative"} and
            serious_score < 42 and
            venue_count >= 1 and
            signal_strength >= 68 and
            volume_ratio >= 8 and
            market_confirmed and
            (telegram_active or bullish_mentions >= 2 or telegram_sources >= 2 or source_tier in {"dual-source", "triple-source", "stacked"}) and
            (meme_score >= 46 or speculative_score >= 52)
        )
        if new_meme_candidate_ok:
            return {
                "kind": "new_meme_candidate",
                "title": "New Meme Candidate",
                "subject_prefix": "🧪 New Meme Candidate",
                "accent": "#38bdf8",
                "intro": "A fresh meme/speculative setup has reached the site before a full confirmed-pump threshold.",
                "priority": 2,
                "route_label": preferred_route,
            }
        return None

    rugpull_dump_ok = (
        identity_classification in {"meme", "speculative"} and
        signal_strength >= 64 and
        volume_ratio >= 6 and
        venue_count >= 1 and
        market_confirmed and
        (rugpull_score >= 58 or dump_risk_score >= 78) and
        (bearish_mentions >= 2 or telegram_sources >= 2 or source_tier in {"dual-source", "triple-source", "stacked"})
    )
    if rugpull_dump_ok:
        return {
            "kind": "rugpull_dump",
            "title": "Rugpull Dump",
            "subject_prefix": "🧨 Rugpull Dump",
            "accent": "#ef4444",
            "intro": "A bearish meme/speculative unwind is showing rugpull-style distribution risk.",
            "priority": 3,
            "route_label": preferred_route,
        }
    return None

async def send_signal_alert_email(email: str, name: str, signal: dict, signal_type: str, alert_meta: dict):
    """Send email alert for categorized signal events."""
    source_summary = signal.get("source_summary") or ((signal.get("signal_sources") or {}).get("summary")) or ""
    route_label = alert_meta.get("route_label") or build_signal_route_label(signal)
    subject_prefix = alert_meta.get("subject_prefix") or ("🚀 Pump" if signal_type == "pump" else "📉 Dump")
    title = alert_meta.get("title") or signal_type.upper()
    intro = alert_meta.get("intro") or f"A new {signal_type} event was detected."
    accent = alert_meta.get("accent") or ("#10b981" if signal_type == "pump" else "#ef4444")
    rugpull_summary = ((signal.get("rugpull_profile") or {}).get("summary") or "")[:220]
    cta_label = "Open Coin Page"
    html = f"""
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0f172a;color:#fff;border-radius:12px">
      <div style="text-align:center;margin-bottom:20px">
        <img src="{LOGO_URL}" alt="PumpRadar" style="width:48px;height:48px;border-radius:10px" />
      </div>
      <h2 style="color:{accent};margin-bottom:16px;text-align:center">{title}: {signal.get('symbol')}</h2>
      <p>Hi {name},</p>
      <p>{intro}</p>
      <div style="background:#1e293b;padding:16px;border-radius:8px;margin:16px 0">
        <p style="margin:0 0 8px 0"><strong>Coin:</strong> {signal.get('symbol')} ({signal.get('name', '')})</p>
        <p style="margin:0 0 8px 0"><strong>Signal Strength:</strong> <span style="color:{accent};font-size:18px">{signal.get('signal_strength', 0)}%</span></p>
        <p style="margin:0 0 8px 0"><strong>Price:</strong> ${signal.get('price', 0)}</p>
        <p style="margin:0 0 8px 0"><strong>1h Change:</strong> {signal.get('price_change_1h', 0):+.2f}%</p>
        {f'<p style="margin:0 0 8px 0"><strong>Where to trade:</strong> {route_label}</p>' if route_label else ''}
        {f'<p style="margin:0 0 8px 0"><strong>Source Stack:</strong> {source_summary[:220]}</p>' if source_summary else ''}
        {f'<p style="margin:0 0 8px 0"><strong>Rugpull Read:</strong> {rugpull_summary}</p>' if alert_meta.get("kind") == "rugpull_dump" and rugpull_summary else ''}
        <p style="margin:0"><strong>Reason:</strong> {signal.get('reason', '')[:220]}</p>
      </div>
      <p style="color:#94a3b8;font-size:12px">This is not financial advice. Always do your own research.</p>
      <a href="{APP_URL}/coin/{signal.get('symbol')}?type={signal_type}"
         style="display:inline-block;background:{accent};color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px">
        {cta_label}
      </a>
    </div>"""
    try:
        await asyncio.to_thread(resend.Emails.send, {
            "from": f"PumpRadar Alerts <{SENDER_EMAIL}>",
            "to": [email],
            "subject": f"{subject_prefix}: {signal.get('symbol')} ({signal.get('signal_strength')}%)",
            "html": html,
        })
        logger.info("Alert email sent to %s for %s (%s)", email, signal.get("symbol"), alert_meta.get("kind"))
    except Exception as e:
        logger.error(f"Alert email error: {e}")

async def mark_signal_alert_sent(user_id: str, signal: dict, signal_type: str, alert_kind: str) -> bool:
    symbol = (signal.get("symbol") or "").upper()
    snapshot_ts = signal.get("timestamp")
    if isinstance(snapshot_ts, datetime):
        snapshot_key = snapshot_ts.isoformat()
    else:
        snapshot_key = str(snapshot_ts or "")
    if not user_id or not symbol or not snapshot_key or not alert_kind:
        return False
    try:
        result = await db.signal_alert_events.update_one(
            {
                "user_id": user_id,
                "symbol": symbol,
                "signal_type": signal_type,
                "alert_kind": alert_kind,
                "snapshot_key": snapshot_key,
            },
            {
                "$setOnInsert": {
                    "created_at": datetime.now(timezone.utc),
                }
            },
            upsert=True,
        )
        return bool(getattr(result, "upserted_id", None))
    except Exception:
        return False

async def check_and_send_alerts(pump_signals: List[dict], dump_signals: List[dict]):
    """Check for categorized signals and send alerts to users with enabled notifications."""
    pro_users = await db.users.find({
        "subscription": {"$in": ["monthly", "annual"]},
        "email_alerts_enabled": True,
    }).to_list(length=1000)

    if not pro_users:
        return

    alert_candidates: List[dict] = []
    for signal in pump_signals:
        alert_meta = classify_signal_alert(signal, "pump")
        if alert_meta:
            alert_candidates.append({
                "signal_type": "pump",
                "signal": signal,
                "meta": alert_meta,
            })
    for signal in dump_signals:
        alert_meta = classify_signal_alert(signal, "dump")
        if alert_meta:
            alert_candidates.append({
                "signal_type": "dump",
                "signal": signal,
                "meta": alert_meta,
            })

    if not alert_candidates:
        return

    global_caps = {
        "new_meme_candidate": 2,
        "confirmed_pump": 3,
        "rugpull_dump": 2,
    }

    def rank_alert(item: dict) -> tuple:
        signal = item["signal"]
        meta = item["meta"]
        rugpull_score = float(((signal.get("rugpull_profile") or {}).get("score") or 0))
        score_gap = float(((signal.get("direction_audit") or {}).get("score_gap") or 0))
        return (
            int(meta.get("priority", 0)),
            float(signal.get("signal_strength", 0) or 0),
            rugpull_score,
            score_gap,
        )

    ranked_candidates = sorted(alert_candidates, key=rank_alert, reverse=True)

    for user in pro_users:
        user_id = str(user.get("_id") or "")
        email = user.get("email")
        name = user.get("name", "Trader")
        watchlist = user.get("watchlist", [])

        for item in watchlist:
            if not item.get("alertEnabled"):
                continue
            symbol = item.get("symbol", "").upper()
            threshold = item.get("alertThreshold", 80)
            for alert_item in ranked_candidates:
                signal = alert_item["signal"]
                signal_type = alert_item["signal_type"]
                meta = alert_item["meta"]
                if (
                    signal.get("symbol", "").upper() == symbol and
                    signal.get("signal_strength", 0) >= threshold and
                    await mark_signal_alert_sent(user_id, signal, signal_type, meta["kind"])
                ):
                    asyncio.create_task(send_signal_alert_email(email, name, signal, signal_type, meta))

        if user.get("global_alerts_enabled"):
            sent_counts: Dict[str, int] = {}
            for alert_item in ranked_candidates:
                signal = alert_item["signal"]
                signal_type = alert_item["signal_type"]
                meta = alert_item["meta"]
                kind = meta["kind"]
                if sent_counts.get(kind, 0) >= global_caps.get(kind, 1):
                    continue
                if await mark_signal_alert_sent(user_id, signal, signal_type, kind):
                    sent_counts[kind] = sent_counts.get(kind, 0) + 1
                    asyncio.create_task(send_signal_alert_email(email, name, signal, signal_type, meta))

# Alert settings endpoints
class AlertSettings(BaseModel):
    email_alerts_enabled: bool = False
    global_alerts_enabled: bool = False

@app.get("/api/user/alerts")
async def get_alert_settings(user=Depends(get_current_user)):
    """Get user's alert settings"""
    return api_ok({
        "email_alerts_enabled": user.get("email_alerts_enabled", False),
        "global_alerts_enabled": user.get("global_alerts_enabled", False),
    })

@app.post("/api/user/alerts")
async def update_alert_settings(settings: AlertSettings, user=Depends(get_current_user)):
    """Update user's alert settings"""
    # Only Pro users can enable alerts
    sub = user.get("subscription", "free")
    if sub not in ("monthly", "annual"):
        raise HTTPException(status_code=402, detail=api_err("Pro subscription required for email alerts", "SUBSCRIPTION_REQUIRED"))
    
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {
            "email_alerts_enabled": settings.email_alerts_enabled,
            "global_alerts_enabled": settings.global_alerts_enabled,
        }}
    )
    return api_ok({"message": "Alert settings updated"})

# ─────────────────────────────────────────────
# SIGNAL ACCURACY TRACKER
# ─────────────────────────────────────────────
async def track_signal_accuracy():
    """
    Track if PUMP/DUMP predictions came true after 1h, 4h, 24h.
    Called hourly by scheduler.
    """
    try:
        # Get signals that need accuracy check
        now = datetime.now(timezone.utc)
        
        # Find predictions from 1h, 4h, 24h ago that haven't been verified
        time_windows = [
            {"hours": 1, "field": "accuracy_1h"},
            {"hours": 4, "field": "accuracy_4h"},
            {"hours": 24, "field": "accuracy_24h"},
        ]
        
        for window in time_windows:
            target_time = now - timedelta(hours=window["hours"])
            field = window["field"]
            
            # Find signals from that time window that don't have this accuracy field
            snapshots = await db.signal_snapshots.find({
                "timestamp": {
                    "$gte": target_time - timedelta(minutes=30),
                    "$lte": target_time + timedelta(minutes=30)
                },
                field: {"$exists": False}
            }).to_list(length=10)
            
            for snapshot in snapshots:
                pump_signals = snapshot.get("pump_signals", [])
                dump_signals = snapshot.get("dump_signals", [])
                
                # Get current prices for these coins
                correct_pumps = 0
                total_pumps = len(pump_signals)
                correct_dumps = 0
                total_dumps = len(dump_signals)
                
                for signal in pump_signals:
                    symbol = signal.get("symbol", "").lower()
                    original_price = signal.get("price", 0)
                    
                    # Fetch current price
                    try:
                        resp = requests.get(
                            f"https://api.coingecko.com/api/v3/simple/price",
                            params={"ids": signal.get("coin_id", symbol), "vs_currencies": "usd"},
                            timeout=5
                        )
                        if resp.status_code == 200:
                            data = resp.json()
                            current_price = list(data.values())[0].get("usd", 0) if data else 0
                            
                            # PUMP is correct if price increased
                            if current_price > original_price:
                                correct_pumps += 1
                    except:
                        pass
                
                for signal in dump_signals:
                    symbol = signal.get("symbol", "").lower()
                    original_price = signal.get("price", 0)
                    
                    try:
                        resp = requests.get(
                            f"https://api.coingecko.com/api/v3/simple/price",
                            params={"ids": signal.get("coin_id", symbol), "vs_currencies": "usd"},
                            timeout=5
                        )
                        if resp.status_code == 200:
                            data = resp.json()
                            current_price = list(data.values())[0].get("usd", 0) if data else 0
                            
                            # DUMP is correct if price decreased
                            if current_price < original_price:
                                correct_dumps += 1
                    except:
                        pass
                
                # Calculate accuracy
                pump_accuracy = (correct_pumps / total_pumps * 100) if total_pumps > 0 else 0
                dump_accuracy = (correct_dumps / total_dumps * 100) if total_dumps > 0 else 0
                overall_accuracy = ((correct_pumps + correct_dumps) / (total_pumps + total_dumps) * 100) if (total_pumps + total_dumps) > 0 else 0
                
                # Store accuracy data
                await db.signal_snapshots.update_one(
                    {"_id": snapshot["_id"]},
                    {"$set": {
                        field: {
                            "pump_accuracy": round(pump_accuracy, 1),
                            "dump_accuracy": round(dump_accuracy, 1),
                            "overall_accuracy": round(overall_accuracy, 1),
                            "correct_pumps": correct_pumps,
                            "total_pumps": total_pumps,
                            "correct_dumps": correct_dumps,
                            "total_dumps": total_dumps,
                            "verified_at": now.isoformat(),
                        }
                    }}
                )
                
                logger.info(f"Accuracy tracked for {window['hours']}h: PUMP {pump_accuracy:.1f}%, DUMP {dump_accuracy:.1f}%")
                
    except Exception as e:
        logger.error(f"Accuracy tracking error: {e}")

@app.get("/api/crypto/accuracy")
async def get_signal_accuracy(user=Depends(get_optional_user)):
    """Get signal accuracy statistics"""
    # Get last 24 snapshots with accuracy data
    snapshots = await db.signal_snapshots.find({
        "$or": [
            {"accuracy_1h": {"$exists": True}},
            {"accuracy_4h": {"$exists": True}},
            {"accuracy_24h": {"$exists": True}},
        ]
    }).sort("timestamp", -1).limit(48).to_list(length=48)
    
    # Aggregate accuracy stats
    stats_1h = {"pump": [], "dump": [], "overall": []}
    stats_4h = {"pump": [], "dump": [], "overall": []}
    stats_24h = {"pump": [], "dump": [], "overall": []}
    
    for snap in snapshots:
        if snap.get("accuracy_1h"):
            acc = snap["accuracy_1h"]
            stats_1h["pump"].append(acc.get("pump_accuracy", 0))
            stats_1h["dump"].append(acc.get("dump_accuracy", 0))
            stats_1h["overall"].append(acc.get("overall_accuracy", 0))
        
        if snap.get("accuracy_4h"):
            acc = snap["accuracy_4h"]
            stats_4h["pump"].append(acc.get("pump_accuracy", 0))
            stats_4h["dump"].append(acc.get("dump_accuracy", 0))
            stats_4h["overall"].append(acc.get("overall_accuracy", 0))
        
        if snap.get("accuracy_24h"):
            acc = snap["accuracy_24h"]
            stats_24h["pump"].append(acc.get("pump_accuracy", 0))
            stats_24h["dump"].append(acc.get("dump_accuracy", 0))
            stats_24h["overall"].append(acc.get("overall_accuracy", 0))
    
    def avg(lst):
        return round(sum(lst) / len(lst), 1) if lst else 0
    
    return api_ok({
        "accuracy_1h": {
            "pump": avg(stats_1h["pump"]),
            "dump": avg(stats_1h["dump"]),
            "overall": avg(stats_1h["overall"]),
            "samples": len(stats_1h["overall"]),
        },
        "accuracy_4h": {
            "pump": avg(stats_4h["pump"]),
            "dump": avg(stats_4h["dump"]),
            "overall": avg(stats_4h["overall"]),
            "samples": len(stats_4h["overall"]),
        },
        "accuracy_24h": {
            "pump": avg(stats_24h["pump"]),
            "dump": avg(stats_24h["dump"]),
            "overall": avg(stats_24h["overall"]),
            "samples": len(stats_24h["overall"]),
        },
        "last_updated": snapshots[0]["timestamp"].isoformat() if snapshots else None,
    })

# ─────────────────────────────────────────────
# DAILY MARKET OPEN EMAILS (PRO FEATURE)
# ─────────────────────────────────────────────
async def send_market_open_email(market: str):
    """
    Send best signal candidates email at market open.
    Called by scheduler at:
    - London: 08:00 UTC (LSE opens)
    - New York: 14:30 UTC (NYSE opens at 9:30 AM EST)
    """
    try:
        # Get latest signals
        snapshot = await db.signal_snapshots.find_one({}, sort=[("timestamp", -1)])
        if not snapshot:
            logger.warning(f"No signals available for {market} market open email")
            return
        
        pump_signals = snapshot.get("pump_signals", [])[:5]  # Top 5 pumps
        dump_signals = snapshot.get("dump_signals", [])[:3]  # Top 3 dumps
        fear_greed = snapshot.get("fear_greed", {})
        market_summary = snapshot.get("market_summary", "")
        
        if not pump_signals and not dump_signals:
            return
        
        # Get all Pro subscribers with daily emails enabled
        pro_users = await db.users.find({
            "subscription": {"$in": ["monthly", "annual"]},
            "daily_market_emails": {"$ne": False},  # Default to True if not set
        }).to_list(length=1000)
        
        if not pro_users:
            return
        
        market_name = "London Stock Exchange" if market == "london" else "New York Stock Exchange"
        market_emoji = "🇬🇧" if market == "london" else "🇺🇸"
        
        for user in pro_users:
            email = user.get("email")
            name = user.get("name", "Trader")
            
            # Build email content
            pump_html = ""
            for i, s in enumerate(pump_signals, 1):
                pump_html += f"""
                <tr>
                  <td style="padding:8px;border-bottom:1px solid #334155">{i}. <strong>{s.get('symbol')}</strong></td>
                  <td style="padding:8px;border-bottom:1px solid #334155;color:#10b981">{s.get('signal_strength', 0)}%</td>
                  <td style="padding:8px;border-bottom:1px solid #334155">${s.get('price', 0):.6f}</td>
                  <td style="padding:8px;border-bottom:1px solid #334155;color:#10b981">+{s.get('price_change_1h', 0):.2f}%</td>
                </tr>"""
            
            dump_html = ""
            for i, s in enumerate(dump_signals, 1):
                dump_html += f"""
                <tr>
                  <td style="padding:8px;border-bottom:1px solid #334155">{i}. <strong>{s.get('symbol')}</strong></td>
                  <td style="padding:8px;border-bottom:1px solid #334155;color:#ef4444">{s.get('signal_strength', 0)}%</td>
                  <td style="padding:8px;border-bottom:1px solid #334155">${s.get('price', 0):.6f}</td>
                  <td style="padding:8px;border-bottom:1px solid #334155;color:#ef4444">{s.get('price_change_1h', 0):.2f}%</td>
                </tr>"""
            
            html = f"""
            <div style="font-family:sans-serif;max-width:650px;margin:0 auto;padding:24px;background:#0f172a;color:#fff;border-radius:12px">
              <div style="text-align:center;margin-bottom:24px">
                <img src="{LOGO_URL}" alt="PumpRadar" style="width:56px;height:56px;border-radius:12px;margin-bottom:12px" />
                <h1 style="color:#fff;margin:0">{market_emoji} {market_name} Opens</h1>
                <p style="color:#94a3b8;margin:8px 0 0 0">Daily Signal Report for {name}</p>
              </div>
              
              <div style="background:#1e293b;padding:16px;border-radius:8px;margin-bottom:20px">
                <div style="display:flex;justify-content:space-between;align-items:center">
                  <span style="color:#94a3b8">Fear & Greed Index</span>
                  <span style="font-size:24px;font-weight:bold;color:{'#ef4444' if fear_greed.get('value', 50) < 30 else '#f59e0b' if fear_greed.get('value', 50) < 50 else '#10b981'}">{fear_greed.get('value', 'N/A')}/100</span>
                </div>
                <p style="color:#cbd5e1;margin:8px 0 0 0;font-size:14px">{fear_greed.get('classification', 'N/A')}</p>
              </div>
              
              <h2 style="color:#10b981;margin:24px 0 12px 0;font-size:18px">🚀 Top PUMP Candidates</h2>
              <table style="width:100%;border-collapse:collapse;background:#1e293b;border-radius:8px;overflow:hidden">
                <thead>
                  <tr style="background:#334155">
                    <th style="padding:10px;text-align:left;color:#94a3b8">Coin</th>
                    <th style="padding:10px;text-align:left;color:#94a3b8">Signal</th>
                    <th style="padding:10px;text-align:left;color:#94a3b8">Price</th>
                    <th style="padding:10px;text-align:left;color:#94a3b8">1h</th>
                  </tr>
                </thead>
                <tbody>{pump_html}</tbody>
              </table>
              
              <h2 style="color:#ef4444;margin:24px 0 12px 0;font-size:18px">📉 DUMP Warnings</h2>
              <table style="width:100%;border-collapse:collapse;background:#1e293b;border-radius:8px;overflow:hidden">
                <thead>
                  <tr style="background:#334155">
                    <th style="padding:10px;text-align:left;color:#94a3b8">Coin</th>
                    <th style="padding:10px;text-align:left;color:#94a3b8">Signal</th>
                    <th style="padding:10px;text-align:left;color:#94a3b8">Price</th>
                    <th style="padding:10px;text-align:left;color:#94a3b8">1h</th>
                  </tr>
                </thead>
                <tbody>{dump_html}</tbody>
              </table>
              
              <div style="background:#1e293b;padding:16px;border-radius:8px;margin-top:20px">
                <h3 style="color:#6366f1;margin:0 0 8px 0;font-size:14px">🤖 AI Market Summary</h3>
                <p style="color:#cbd5e1;margin:0;font-size:14px;line-height:1.5">{market_summary[:400]}...</p>
              </div>
              
              <div style="text-align:center;margin-top:24px">
                <a href="{APP_URL}/dashboard" 
                   style="display:inline-block;background:linear-gradient(135deg,#10b981,#059669);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold">
                  View Full Dashboard →
                </a>
              </div>
              
              <p style="color:#64748b;font-size:11px;text-align:center;margin-top:24px;border-top:1px solid #334155;padding-top:16px">
                This is not financial advice. Always do your own research.<br>
                <a href="{APP_URL}/settings" style="color:#6366f1">Manage email preferences</a>
              </p>
            </div>"""
            
            try:
                await asyncio.to_thread(resend.Emails.send, {
                    "from": f"PumpRadar <{SENDER_EMAIL}>",
                    "to": [email],
                    "subject": f"{market_emoji} {market_name} Opens - Top Signals for Today",
                    "html": html,
                })
                logger.info(f"Market open email sent to {email} for {market}")
            except Exception as e:
                logger.error(f"Market open email error for {email}: {e}")
        
        logger.info(f"{market.upper()} market open emails sent to {len(pro_users)} Pro users")
        
    except Exception as e:
        logger.exception(f"Market open email job error: {e}")

async def send_london_market_email():
    """Wrapper for London market open email"""
    await send_market_open_email("london")

async def send_nyse_market_email():
    """Wrapper for NYSE market open email"""
    await send_market_open_email("nyse")

async def send_trial_reminder_emails():
    """Send one reminder shortly before the card-backed trial converts to paid."""
    now = datetime.now(timezone.utc)
    reminder_cutoff_start = now + timedelta(hours=23)
    reminder_cutoff_end = now + timedelta(hours=25)
    users = await db.users.find({
        "subscription": "trial",
        "subscription_expiry": {"$gte": reminder_cutoff_start, "$lte": reminder_cutoff_end},
        "trial_reminder_sent_at": {"$exists": False},
        "pending_plan": {"$in": ["monthly", "annual"]},
    }).to_list(length=500)

    for user in users:
        trial_end = normalize_datetime(user.get("subscription_expiry"))
        if not trial_end:
            continue
        await send_trial_reminder_email(
            user["email"],
            user.get("name", ""),
            SUBSCRIPTION_PLANS.get(user.get("pending_plan"), SUBSCRIPTION_PLANS["monthly"])["name"],
            trial_end,
        )
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"trial_reminder_sent_at": now}},
        )

@app.post("/api/crypto/refresh")
async def manual_refresh(user=Depends(require_active_subscription)):
    """Manual trigger for a real signal refresh"""
    result = await fetch_and_store_signals(trigger="manual")
    scan_status = build_signal_scan_status()
    if not result.get("started") and scan_status.get("running"):
        return api_ok({
            "message": "A signal scan is already running.",
            "started": False,
            "completed": False,
            "scan_status": scan_status,
        })
    if not result.get("completed"):
        raise HTTPException(
            status_code=500,
            detail=api_err("Signal scan failed. Please try again.", "SIGNAL_REFRESH_FAILED"),
        )
    return api_ok({
        "message": "Signal scan finished successfully.",
        "started": True,
        "completed": True,
        "pump_count": result.get("pump_count", 0),
        "dump_count": result.get("dump_count", 0),
        "coins_analyzed": result.get("coins_analyzed", 0),
        "snapshot_at": serialize_datetime(result.get("snapshot_at")),
        "scan_status": build_signal_scan_status(),
    })

# ─────────────────────────────────────────────
# SUBSCRIPTION / STRIPE
# ─────────────────────────────────────────────
SUBSCRIPTION_PLANS = {
    "trial": {"name": "Trial 7d", "price": 0.0, "currency": "usd", "duration_days": 7},
    "monthly": {"name": "Monthly", "price": 29.99, "currency": "usd", "duration_days": 30, "interval": "month", "interval_count": 1},
    "annual": {"name": "Annual", "price": 299.99, "currency": "usd", "duration_days": 365, "interval": "year", "interval_count": 1},
}

class CheckoutRequest(BaseModel):
    plan: str
    origin_url: str

class BillingPortalRequest(BaseModel):
    origin_url: str

def normalize_datetime(value: Any) -> Optional[datetime]:
    if not value:
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if isinstance(value, str):
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    return None

async def apply_stripe_subscription_state(
    *,
    tx: dict,
    subscription_id: str,
    checkout_session_id: Optional[str] = None,
    trigger_email: bool = True,
) -> dict:
    subscription = stripe.Subscription.retrieve(subscription_id)
    plan_name = tx.get("plan", "monthly")
    status = subscription.get("status")
    trial_end_raw = subscription.get("trial_end")
    current_period_end_raw = subscription.get("current_period_end")
    trial_end = datetime.fromtimestamp(trial_end_raw, tz=timezone.utc) if trial_end_raw else None
    period_end = datetime.fromtimestamp(current_period_end_raw, tz=timezone.utc) if current_period_end_raw else None

    user_update = {
        "stripe_customer_id": subscription.get("customer"),
        "stripe_subscription_id": subscription_id,
        "stripe_subscription_status": status,
        "pending_plan": plan_name if status == "trialing" else None,
    }
    tx_update = {
        "stripe_subscription_id": subscription_id,
        "stripe_customer_id": subscription.get("customer"),
        "subscription_status": status,
        "updated_at": datetime.now(timezone.utc),
    }
    if checkout_session_id:
        tx_update["session_id"] = checkout_session_id

    if status == "trialing":
        user_update.update({
            "subscription": "trial",
            "subscription_expiry": trial_end,
            "trial_plan": plan_name,
            "trial_started_at": datetime.now(timezone.utc),
            "trial_reminder_sent_at": None,
        })
        tx_update.update({
            "payment_status": "trialing",
            "status": "trialing",
            "trial_end": trial_end,
        })
        if trigger_email:
            asyncio.create_task(send_trial_started_email(tx["user_email"], tx.get("user_name", ""), SUBSCRIPTION_PLANS[plan_name]["name"], trial_end))
    elif status in {"active", "past_due"}:
        expiry = period_end or (datetime.now(timezone.utc) + timedelta(days=SUBSCRIPTION_PLANS[plan_name]["duration_days"]))
        user_update.update({
            "subscription": plan_name,
            "subscription_expiry": expiry,
            "trial_plan": None,
            "pending_plan": None,
            "trial_started_at": None,
        })
        tx_update.update({
            "payment_status": "paid",
            "status": "completed",
            "completed_at": datetime.now(timezone.utc),
        })
        if trigger_email:
            asyncio.create_task(send_subscription_activated_email(tx["user_email"], tx.get("user_name", ""), SUBSCRIPTION_PLANS[plan_name]["name"], expiry))

    await db.users.update_one({"_id": ObjectId(tx["user_id"])}, {"$set": user_update})
    await db.payment_transactions.update_one({"_id": tx["_id"]}, {"$set": tx_update})
    return {"subscription": subscription, "status": status, "trial_end": trial_end, "period_end": period_end}

@app.post("/api/payments/checkout")
async def create_checkout(req: CheckoutRequest, request: Request, user=Depends(get_current_user)):
    if req.plan not in SUBSCRIPTION_PLANS or req.plan == "trial":
        raise HTTPException(status_code=400, detail="Invalid plan")

    if looks_like_placeholder(STRIPE_API_KEY, "STRIPE_API_KEY"):
        raise HTTPException(
            status_code=503,
            detail=api_err("Stripe payments are not configured yet", "STRIPE_NOT_CONFIGURED"),
        )
    
    plan = SUBSCRIPTION_PLANS[req.plan]
    
    success_url = f"{req.origin_url}/subscription/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{req.origin_url}/subscription"
    
    # Create Stripe checkout session for card-backed trial
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": plan["currency"],
                    "product_data": {
                        "name": f"PumpRadar {req.plan.title()} Plan",
                        "description": "Includes a 7-day free trial before billing starts",
                    },
                    "unit_amount": int(plan["price"] * 100),
                    "recurring": {
                        "interval": plan["interval"],
                        "interval_count": plan["interval_count"],
                    },
                },
                "quantity": 1,
            }],
            mode="subscription",
            success_url=success_url,
            cancel_url=cancel_url,
            customer_email=user["email"],
            billing_address_collection="required",
            phone_number_collection={"enabled": True},
            tax_id_collection={"enabled": True},
            allow_promotion_codes=True,
            subscription_data={
                "trial_period_days": 7,
                "metadata": {
                    "user_id": str(user["_id"]),
                    "user_email": user["email"],
                    "plan": req.plan,
                },
            },
            metadata={
                "user_id": str(user["_id"]),
                "user_email": user["email"],
                "plan": req.plan,
            }
        )
    except stripe.error.AuthenticationError as e:
        logger.error(f"Stripe authentication error: {e}")
        raise HTTPException(
            status_code=503,
            detail=api_err("Stripe payments are not configured correctly", "STRIPE_NOT_CONFIGURED"),
        )
    except stripe.error.StripeError as e:
        logger.error(f"Stripe checkout error: {e}")
        raise HTTPException(
            status_code=502,
            detail=api_err("Stripe checkout is temporarily unavailable", "STRIPE_CHECKOUT_FAILED"),
        )
    
    # Store pending transaction
    await db.payment_transactions.insert_one({
        "session_id": session.id,
        "user_id": str(user["_id"]),
        "user_email": user["email"],
        "user_name": user.get("name", ""),
        "plan": req.plan,
        "amount": plan["price"],
        "currency": plan["currency"],
        "checkout_mode": "subscription",
        "payment_status": "pending",
        "status": "initiated",
        "created_at": datetime.now(timezone.utc),
    })
    
    return api_ok({"url": session.url, "session_id": session.id})

@app.get("/api/payments/status/{session_id}")
async def check_payment_status(session_id: str, user=Depends(get_current_user)):
    if looks_like_placeholder(STRIPE_API_KEY, "STRIPE_API_KEY"):
        raise HTTPException(
            status_code=503,
            detail=api_err("Stripe payments are not configured yet", "STRIPE_NOT_CONFIGURED"),
        )

    # Get Stripe session status
    try:
        session = stripe.checkout.Session.retrieve(session_id)
    except stripe.error.AuthenticationError as e:
        logger.error(f"Stripe authentication error: {e}")
        raise HTTPException(
            status_code=503,
            detail=api_err("Stripe payments are not configured correctly", "STRIPE_NOT_CONFIGURED"),
        )
    except stripe.error.StripeError as e:
        logger.error(f"Stripe status error: {e}")
        raise HTTPException(
            status_code=502,
            detail=api_err("Stripe status check is temporarily unavailable", "STRIPE_STATUS_FAILED"),
        )
    
    payment_status = "pending"
    subscription_status = None
    subscription_id = session.subscription if hasattr(session, "subscription") else None
    if subscription_id:
        subscription = stripe.Subscription.retrieve(subscription_id)
        subscription_status = subscription.status
        if subscription_status == "trialing":
            payment_status = "trialing"
        elif subscription_status in {"active", "past_due"}:
            payment_status = "paid"
    elif session.payment_status == "paid":
        payment_status = "paid"
    elif session.status == "expired":
        payment_status = "expired"
    
    # Update transaction if subscription/trial moved
    tx = await db.payment_transactions.find_one({"session_id": session_id})
    
    if tx and subscription_id and payment_status in {"trialing", "paid"}:
        await apply_stripe_subscription_state(
            tx=tx,
            subscription_id=subscription_id,
            checkout_session_id=session_id,
            trigger_email=False,
        )
    
    return api_ok({
        "status": session.status,
        "payment_status": payment_status,
        "subscription_status": subscription_status,
        "session_id": session_id,
    })

@app.post("/api/payments/portal")
async def create_billing_portal(req: BillingPortalRequest, user=Depends(get_current_user)):
    if looks_like_placeholder(STRIPE_API_KEY, "STRIPE_API_KEY"):
        raise HTTPException(
            status_code=503,
            detail=api_err("Stripe payments are not configured yet", "STRIPE_NOT_CONFIGURED"),
        )
    customer_id = user.get("stripe_customer_id")
    if not customer_id:
        raise HTTPException(
            status_code=400,
            detail=api_err("No Stripe billing profile exists for this account yet.", "BILLING_PROFILE_MISSING"),
        )
    try:
        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=f"{req.origin_url}/subscription",
        )
    except stripe.error.StripeError as e:
        logger.error(f"Stripe billing portal error: {e}")
        raise HTTPException(
            status_code=502,
            detail=api_err("Stripe billing portal is temporarily unavailable", "STRIPE_PORTAL_FAILED"),
        )
    return api_ok({"url": session.url})

@app.post("/api/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    sig = request.headers.get("Stripe-Signature", "")
    endpoint_secret = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
    
    try:
        # Verify webhook signature if secret is configured
        if endpoint_secret:
            event = stripe.Webhook.construct_event(body, sig, endpoint_secret)
        else:
            # Without secret, just parse the event
            import json as json_lib
            event = json_lib.loads(body)
        
        event_type = event.get("type") if isinstance(event, dict) else event.type
        
        if event_type == "checkout.session.completed":
            session = event.get("data", {}).get("object", {}) if isinstance(event, dict) else event.data.object
            session_id = session.get("id") if isinstance(session, dict) else session.id
            subscription_id = session.get("subscription") if isinstance(session, dict) else session.subscription
            tx = await db.payment_transactions.find_one({"session_id": session_id})
            if tx and subscription_id:
                await apply_stripe_subscription_state(
                    tx=tx,
                    subscription_id=subscription_id,
                    checkout_session_id=session_id,
                    trigger_email=True,
                )

        if event_type == "invoice.payment_succeeded":
            invoice = event.get("data", {}).get("object", {}) if isinstance(event, dict) else event.data.object
            subscription_id = invoice.get("subscription") if isinstance(invoice, dict) else invoice.subscription
            if subscription_id:
                tx = await db.payment_transactions.find_one({"stripe_subscription_id": subscription_id})
                if tx:
                    await apply_stripe_subscription_state(
                        tx=tx,
                        subscription_id=subscription_id,
                        trigger_email=True,
                    )

        if event_type == "customer.subscription.deleted":
            subscription = event.get("data", {}).get("object", {}) if isinstance(event, dict) else event.data.object
            subscription_id = subscription.get("id") if isinstance(subscription, dict) else subscription.id
            tx = await db.payment_transactions.find_one({"stripe_subscription_id": subscription_id})
            if tx:
                await db.users.update_one(
                    {"_id": ObjectId(tx["user_id"])},
                    {"$set": {
                        "subscription": "free",
                        "subscription_expiry": None,
                        "stripe_subscription_status": "canceled",
                        "pending_plan": None,
                        "trial_plan": None,
                    }}
                )
                await db.payment_transactions.update_one(
                    {"_id": tx["_id"]},
                    {"$set": {"status": "canceled", "payment_status": "canceled", "updated_at": datetime.now(timezone.utc)}}
                )
    except Exception as e:
        logger.error(f"Webhook error: {e}")
    
    return {"status": "ok"}

@app.get("/api/user/subscription")
async def get_subscription(user=Depends(get_current_user)):
    sub = user.get("subscription", "free")
    expiry = user.get("subscription_expiry")
    stripe_status = user.get("stripe_subscription_status")
    pending_plan = user.get("pending_plan") or user.get("trial_plan")
    
    # Normalize expiry to timezone-aware datetime
    if expiry:
        if isinstance(expiry, str):
            expiry = datetime.fromisoformat(expiry.replace("Z", "+00:00"))
        if isinstance(expiry, datetime) and expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=timezone.utc)
    
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
        "stripe_status": stripe_status,
        "pending_plan": pending_plan,
        "next_billing_at": expiry.isoformat() if isinstance(expiry, datetime) else expiry,
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
    await db.signal_alert_events.create_index(
        [("user_id", 1), ("symbol", 1), ("signal_type", 1), ("snapshot_key", 1)],
        unique=True,
    )
    await db.payment_transactions.create_index("session_id", unique=True)
    await db.telegram_sources.create_index("source_key", unique=True)
    await db.telegram_signals.create_index([("posted_at", -1)])
    await db.telegram_signals.create_index([("source_id", 1), ("posted_at", -1)])
    await db.telegram_signals.create_index([("cluster_key", 1), ("posted_at", -1)])
    
    # Start scheduler - hourly job for signals
    scheduler.add_job(fetch_and_store_signals, 'interval', hours=1, id='crypto_signals', replace_existing=True)
    
    # Accuracy tracking - runs hourly, 30 min offset
    scheduler.add_job(track_signal_accuracy, 'interval', hours=1, id='accuracy_tracker', replace_existing=True)
    scheduler.add_job(send_trial_reminder_emails, 'interval', hours=1, id='trial_reminder_emails', replace_existing=True)
    scheduler.add_job(evaluate_pending_telegram_signals, 'interval', minutes=15, id='telegram_signal_verifier', replace_existing=True)
    
    # Market open emails (PRO feature)
    # London Stock Exchange opens at 08:00 UTC
    scheduler.add_job(send_london_market_email, 'cron', hour=8, minute=0, id='london_market_email', replace_existing=True)
    
    # New York Stock Exchange opens at 14:30 UTC (9:30 AM EST)
    scheduler.add_job(send_nyse_market_email, 'cron', hour=14, minute=30, id='nyse_market_email', replace_existing=True)
    
    scheduler.start()
    
    # Initial fetch with delay to avoid rate limiting on hot-reload
    async def delayed_fetch():
        await asyncio.sleep(30)  # Wait 30s before first fetch
        await fetch_and_store_signals()
    
    asyncio.create_task(delayed_fetch())
    asyncio.create_task(start_telegram_listener())
    logger.info("PumpRadar backend started - scheduler running hourly, first fetch in 30s")

@app.on_event("shutdown")
async def shutdown_event():
    scheduler.shutdown()
    global telegram_client, telegram_listener_task
    if telegram_listener_task and not telegram_listener_task.done():
        telegram_listener_task.cancel()
    if telegram_client:
        try:
            await telegram_client.disconnect()
        except Exception:
            pass
    client.close()

# ─────────────────────────────────────────────
# AI CHAT CUSTOMER SERVICE
# ─────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = []

@app.post("/api/ai/chat")
async def ai_chat(req: ChatRequest, user=Depends(require_active_subscription)):
    """AI customer service chat powered by Gemini - Smart & Helpful"""
    try:
        # Get latest signal context with details
        snapshot = await db.signal_snapshots.find_one({}, sort=[("timestamp", -1)])
        pump_signals = snapshot.get("pump_signals", []) if snapshot else []
        dump_signals = snapshot.get("dump_signals", []) if snapshot else []
        pump_count = len(pump_signals)
        dump_count = len(dump_signals)
        summary = snapshot.get("market_summary", "") if snapshot else ""
        fear_greed = snapshot.get("fear_greed", {}) if snapshot else {}
        trending = snapshot.get("trending", []) if snapshot else []
        
        # Build detailed signal context
        top_pumps = ", ".join([f"{s.get('symbol')} ({s.get('signal_strength', 0)}%)" for s in pump_signals[:5]]) or "None"
        top_dumps = ", ".join([f"{s.get('symbol')} ({s.get('signal_strength', 0)}%)" for s in dump_signals[:3]]) or "None"
        
        sub = user.get("subscription", "trial")
        user_sub = "Monthly" if sub == "monthly" else "Annual" if sub == "annual" else "Free Trial"
        user_name = user.get("name", "User")
        
        system_instruction = f"""You are PumpRadar AI - an intelligent crypto market assistant. You're knowledgeable, helpful, and precise.

PLATFORM OVERVIEW:
PumpRadar uses quantitative analysis + AI (Gemini) to detect cryptocurrency pump and dump signals. Data sources: CoinGecko (price/volume), Fear & Greed Index, social trending.

CURRENT LIVE DATA:
- Active PUMP signals: {pump_count} coins showing bullish momentum
- Active DUMP signals: {dump_count} coins showing bearish pressure
- Top PUMP candidates: {top_pumps}
- Top DUMP warnings: {top_dumps}
- Fear & Greed Index: {fear_greed.get('value', 'N/A')}/100 ({fear_greed.get('classification', 'N/A')})
- Trending on CoinGecko: {', '.join(trending[:5]) if trending else 'N/A'}
- Market Summary: {summary}

USER CONTEXT:
- Name: {user_name}
- Subscription: {user_sub}
- Access level: {'Full signal access' if user_sub != 'Free Trial' else 'Limited preview (upgrade for full access)'}

SUBSCRIPTION PLANS:
- Free Trial: 24 hours of full access (automatically granted on signup)
- Monthly: $29.99/month - unlimited signals, AI analysis, coin details
- Annual: $299.99/year - all Pro features and 2 months saved versus monthly

YOUR CAPABILITIES:
1. Explain current market signals with specific data
2. Describe how our quantitative scoring algorithm works (volume/mcap ratio, momentum divergence, trend alignment)
3. Help users understand pump/dump mechanics
4. Guide users through platform features
5. Answer general crypto questions
6. Explain subscription benefits

RESPONSE GUIDELINES:
- ALWAYS respond in English only
- NEVER respond in Romanian or any other language, even if the user writes in another language
- Be concise but informative (2-4 sentences for simple questions, more for complex ones)
- Use specific numbers from live data when relevant
- When discussing signals, mention the actual coins and their scores
- For price predictions: explain we provide probability-based signals, not guarantees
- Always include: "This is not financial advice. Always do your own research."
- Be friendly and professional
- If the user is abusive, insulting, or trolling, set a brief boundary and redirect them to a useful PumpRadar or crypto question
- If the user greets you, thanks you, or asks what you can do, answer naturally instead of forcing a market summary

If asked about a specific coin, check if it's in our current signals and provide details."""
        
        chat = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            system_instruction=system_instruction
        )
        
        response = await asyncio.to_thread(lambda: chat.generate_content(req.message).text)
        return api_ok({"reply": response})
    except Exception as e:
        logger.error(f"AI chat error: {e}")
        return api_ok({
            "reply": build_fallback_chat_reply(
                req.message,
                pump_signals,
                dump_signals,
                summary,
                fear_greed,
                trending,
                user_sub,
            )
        })

# ─────────────────────────────────────────────
# COIN DETAIL
# ─────────────────────────────────────────────
def get_coin_chart_data(coin_id: str, days: int = 1) -> List[dict]:
    """Get hourly price + volume data from CoinGecko"""
    cache_key = f"{coin_id}::{days}"
    cached = get_memory_cache(COIN_CHART_CACHE, cache_key, ttl_seconds=300)
    if cached is not None:
        return cached
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
        return set_memory_cache(COIN_CHART_CACHE, cache_key, result)
    except Exception as e:
        logger.error(f"Chart data error: {e}")
        return []

def format_currency_compact(value: float) -> str:
    value = float(value or 0)
    abs_value = abs(value)
    if abs_value >= 1_000_000_000:
        return f"${value / 1_000_000_000:.2f}B"
    if abs_value >= 1_000_000:
        return f"${value / 1_000_000:.2f}M"
    if abs_value >= 1_000:
        return f"${value / 1_000:.1f}K"
    if abs_value >= 1:
        return f"${value:.2f}"
    return f"${value:.6f}"

def format_pct(value: float) -> str:
    value = float(value or 0)
    return f"{value:+.2f}%"

def classify_trading_venue(name: str) -> str:
    venue = (name or "").lower()
    swap_markets = [
        "swap", "uniswap", "pancakeswap", "sushiswap", "raydium", "jupiter",
        "orca", "meteora", "curve", "balancer", "camelot", "thruster",
    ]
    dex_markets = [
        "dydx", "hyperliquid", "gmx", "vertex", "drift", "aevo",
        "perpetual protocol", "kwenta",
    ]
    if any(keyword in venue for keyword in swap_markets):
        return "swap"
    if any(keyword in venue for keyword in dex_markets):
        return "dex"
    return "cex"

KNOWN_QUOTE_SYMBOLS = {
    "tether": "USDT",
    "bridged-usdt": "USDT",
    "binance-bridged-usdt-bnb-smart-chain": "USDT",
    "usd-coin": "USDC",
    "bridged-usdc": "USDC",
    "usd-coin-bridged": "USDC",
    "wrapped-bitcoin": "WBTC",
    "weth": "WETH",
    "wrapped-ether": "WETH",
    "ethereum": "ETH",
    "bitcoin": "BTC",
    "wrapped-bnb": "WBNB",
    "wbnb": "WBNB",
    "solana": "SOL",
}

def is_contract_like_symbol(value: Optional[str]) -> bool:
    token = (value or "").strip()
    return token.lower().startswith("0x") and len(token) >= 20

def normalize_quote_symbol(raw_target: Optional[str], target_coin_id: Optional[str]) -> str:
    target = (raw_target or "").strip().upper()
    if target and not is_contract_like_symbol(target):
        return target

    normalized_target_coin = (target_coin_id or "").strip().lower()
    if normalized_target_coin:
        for key, symbol in KNOWN_QUOTE_SYMBOLS.items():
            if key in normalized_target_coin:
                return symbol

    return target or "QUOTE"

def build_route_pair_label(
    *,
    symbol: str,
    base: Optional[str],
    target: Optional[str],
    target_coin_id: Optional[str] = None,
) -> str:
    base_symbol = (symbol or "").strip().upper() or (base or "").strip().upper() or "BASE"
    if base and not is_contract_like_symbol(base):
        base_symbol = (base or "").strip().upper() or base_symbol
    quote_symbol = normalize_quote_symbol(target, target_coin_id)
    return f"{base_symbol}/{quote_symbol}"

def score_trust_level(trust_score: str) -> int:
    score = (trust_score or "").lower()
    if score == "green":
        return 100
    if score == "yellow":
        return 65
    if score == "red":
        return 25
    if score in {"high", "strong"}:
        return 85
    if score in {"medium", "ok"}:
        return 60
    if score in {"low", "weak"}:
        return 35
    return 45

def fetch_coin_tickers(coin_id: str) -> List[dict]:
    if not coin_id:
        return []
    if coin_id in COIN_TICKERS_CACHE:
        return COIN_TICKERS_CACHE[coin_id]
    try:
        tickers_url = f"https://api.coingecko.com/api/v3/coins/{coin_id}/tickers"
        resp = requests.get(
            tickers_url,
            params={"page": 1, "order": "trust_score_desc"},
            headers=CG_HEADERS,
            timeout=15,
        )
        if resp.status_code == 200:
            tickers = resp.json().get("tickers", []) or []
            COIN_TICKERS_CACHE[coin_id] = tickers
            return tickers
    except Exception as e:
        logger.error(f"Coin tickers error for {coin_id}: {e}")
    COIN_TICKERS_CACHE[coin_id] = []
    return []

def resolve_coingecko_coin_id(symbol: str, preferred_name: Optional[str] = None) -> str:
    symbol = (symbol or "").upper().strip()
    preferred_name_normalized = (preferred_name or "").strip().lower()
    if not symbol:
        return ""

    try:
        search_url = f"https://api.coingecko.com/api/v3/search?query={symbol}"
        sr = requests.get(search_url, headers=CG_HEADERS, timeout=10)
        if sr.status_code != 200:
            return symbol.lower()

        coins = sr.json().get("coins", []) or []
        exact_symbol_matches = [coin for coin in coins if (coin.get("symbol") or "").upper() == symbol]
        if not exact_symbol_matches:
            return symbol.lower()

        if preferred_name_normalized:
            for coin in exact_symbol_matches:
                coin_name = (coin.get("name") or "").strip().lower()
                if coin_name == preferred_name_normalized:
                    return coin.get("id") or symbol.lower()

        if len(exact_symbol_matches) == 1:
            return exact_symbol_matches[0].get("id") or symbol.lower()

        candidate_ids = [coin.get("id") for coin in exact_symbol_matches if coin.get("id")]
        if not candidate_ids:
            return symbol.lower()

        mr = requests.get(
            "https://api.coingecko.com/api/v3/coins/markets",
            params={
                "vs_currency": "usd",
                "ids": ",".join(candidate_ids[:10]),
                "price_change_percentage": "1h,24h,7d",
            },
            headers=CG_HEADERS,
            timeout=15,
        )
        if mr.status_code == 200:
            markets = mr.json() or []
            if preferred_name_normalized:
                for market in markets:
                    market_name = (market.get("name") or "").strip().lower()
                    if market_name == preferred_name_normalized:
                        return market.get("id") or symbol.lower()
            markets.sort(key=lambda item: item.get("market_cap") or 0, reverse=True)
            if markets:
                return markets[0].get("id") or symbol.lower()
    except Exception as e:
        logger.error(f"CoinGecko coin resolution error for {symbol}: {e}")

    return symbol.lower()

def get_coin_extended_details(coin_id: str) -> dict:
    if not coin_id:
        return {}
    cached = get_memory_cache(COIN_EXTENDED_DETAILS_CACHE, coin_id, ttl_seconds=600)
    if cached is not None:
        return cached
    try:
        url = f"https://api.coingecko.com/api/v3/coins/{coin_id}"
        params = {
            "localization": "false",
            "tickers": "false",
            "market_data": "true",
            "community_data": "false",
            "developer_data": "false",
            "sparkline": "false",
        }
        resp = requests.get(url, params=params, headers=CG_HEADERS, timeout=20)
        if resp.status_code == 200:
            return set_memory_cache(COIN_EXTENDED_DETAILS_CACHE, coin_id, resp.json() or {})
    except Exception as e:
        logger.error(f"Coin extended detail error for {coin_id}: {e}")
    return {}

def to_bool_flag(value: Any) -> bool:
    return value in (True, 1, "1", "true", "True", "yes", "Yes")

def safe_float(value: Any) -> Optional[float]:
    try:
        if value in (None, "", "null"):
            return None
        return float(value)
    except Exception:
        return None

def pick_primary_contract(details: dict) -> tuple[Optional[str], Optional[str]]:
    asset_platform = details.get("asset_platform_id")
    platforms = details.get("platforms") or {}
    if asset_platform and platforms.get(asset_platform):
        return asset_platform, platforms.get(asset_platform)
    for platform, address in platforms.items():
        if address:
            return platform, address
    return None, None

def estimate_slippage(levels: List[list], usd_size: float, side: str) -> Optional[dict]:
    if not levels or usd_size <= 0:
        return None
    remaining_usd = usd_size
    total_qty = 0.0
    total_cost = 0.0
    best_price = safe_float(levels[0][0])
    if not best_price or best_price <= 0:
        return None

    for raw_price, raw_qty in levels:
        price = safe_float(raw_price)
        qty = safe_float(raw_qty)
        if not price or not qty or price <= 0 or qty <= 0:
            continue
        level_notional = price * qty
        take_notional = min(level_notional, remaining_usd)
        take_qty = take_notional / price
        total_qty += take_qty
        total_cost += take_notional
        remaining_usd -= take_notional
        if remaining_usd <= 0:
            break

    if total_qty <= 0:
        return None

    average_price = total_cost / total_qty
    if side == "buy":
        slippage_pct = ((average_price - best_price) / best_price) * 100
    else:
        slippage_pct = ((best_price - average_price) / best_price) * 100
    return {
        "usd_size": usd_size,
        "average_price": round(average_price, 8),
        "best_price": round(best_price, 8),
        "slippage_pct": round(max(0.0, slippage_pct), 4),
        "filled_usd": round(total_cost, 2),
        "fully_filled": remaining_usd <= 0,
    }

def get_binance_orderbook_metrics(symbol: str) -> dict:
    pair = f"{symbol.upper()}USDT"
    cached = get_memory_cache(ORDERBOOK_CACHE, pair, ttl_seconds=30)
    if cached is not None:
        return cached
    try:
        resp = requests.get(
            "https://api.binance.com/api/v3/depth",
            params={"symbol": pair, "limit": 100},
            timeout=12,
        )
        if resp.status_code != 200:
            return {"available": False, "pair": pair}
        data = resp.json() or {}
        bids = data.get("bids", [])
        asks = data.get("asks", [])
        if not bids or not asks:
            return {"available": False, "pair": pair}

        best_bid = safe_float(bids[0][0]) or 0
        best_ask = safe_float(asks[0][0]) or 0
        mid = (best_bid + best_ask) / 2 if best_bid and best_ask else 0
        spread_pct = ((best_ask - best_bid) / mid * 100) if mid else None

        def depth_within_pct(levels: List[list], reference: float, pct: float, side: str) -> float:
            total = 0.0
            for raw_price, raw_qty in levels:
                price = safe_float(raw_price)
                qty = safe_float(raw_qty)
                if not price or not qty:
                    continue
                if side == "bid" and price >= reference * (1 - pct / 100):
                    total += price * qty
                elif side == "ask" and price <= reference * (1 + pct / 100):
                    total += price * qty
            return round(total, 2)

        return set_memory_cache(ORDERBOOK_CACHE, pair, {
            "available": True,
            "pair": pair,
            "best_bid": round(best_bid, 8),
            "best_ask": round(best_ask, 8),
            "mid_price": round(mid, 8) if mid else None,
            "spread_pct": round(spread_pct, 4) if spread_pct is not None else None,
            "bid_depth_1pct_usd": depth_within_pct(bids, mid, 1.0, "bid") if mid else 0,
            "ask_depth_1pct_usd": depth_within_pct(asks, mid, 1.0, "ask") if mid else 0,
            "slippage_buy": [s for s in [estimate_slippage(asks, size, "buy") for size in (1000, 5000, 10000)] if s],
            "slippage_sell": [s for s in [estimate_slippage(bids, size, "sell") for size in (1000, 5000, 10000)] if s],
            "source": "Binance Spot",
        })
    except Exception as e:
        logger.error(f"Binance orderbook error for {pair}: {e}")
        return {"available": False, "pair": pair}

def get_binance_derivatives_metrics(symbol: str) -> dict:
    pair = f"{symbol.upper()}USDT"
    cached = get_memory_cache(DERIVATIVES_CACHE, pair, ttl_seconds=30)
    if cached is not None:
        return cached
    try:
        oi_resp = requests.get(
            "https://fapi.binance.com/fapi/v1/openInterest",
            params={"symbol": pair},
            timeout=12,
        )
        funding_resp = requests.get(
            "https://fapi.binance.com/fapi/v1/premiumIndex",
            params={"symbol": pair},
            timeout=12,
        )
        if oi_resp.status_code != 200 or funding_resp.status_code != 200:
            return {"available": False, "pair": pair}
        oi_data = oi_resp.json() or {}
        funding_data = funding_resp.json() or {}
        open_interest = safe_float(oi_data.get("openInterest")) or 0
        mark_price = safe_float(funding_data.get("markPrice")) or safe_float(funding_data.get("indexPrice")) or 0
        funding_rate = safe_float(funding_data.get("lastFundingRate"))
        next_funding_time = funding_data.get("nextFundingTime")
        return set_memory_cache(DERIVATIVES_CACHE, pair, {
            "available": True,
            "pair": pair,
            "open_interest_contracts": round(open_interest, 2),
            "open_interest_usd": round(open_interest * mark_price, 2) if mark_price else None,
            "funding_rate_pct": round((funding_rate or 0) * 100, 4) if funding_rate is not None else None,
            "mark_price": round(mark_price, 8) if mark_price else None,
            "index_price": round(safe_float(funding_data.get("indexPrice")) or 0, 8) if funding_data.get("indexPrice") else None,
            "next_funding_time": datetime.fromtimestamp(int(next_funding_time) / 1000, tz=timezone.utc).isoformat() if next_funding_time else None,
            "source": "Binance Futures",
        })
    except Exception as e:
        logger.error(f"Binance derivatives error for {pair}: {e}")
        return {"available": False, "pair": pair}

def get_holder_distribution(platform: Optional[str], contract_address: Optional[str]) -> dict:
    if not platform or not contract_address or not COINGECKO_API_KEY:
        return {"available": False}
    cache_key = f"{platform}::{contract_address.lower()}"
    cached = get_memory_cache(HOLDER_DISTRIBUTION_CACHE, cache_key, ttl_seconds=600)
    if cached is not None:
        return cached
    network = COINGECKO_NETWORK_MAP.get(platform)
    if not network:
        return {"available": False}
    try:
        resp = requests.get(
            f"https://pro-api.coingecko.com/api/v3/onchain/networks/{network}/tokens/{contract_address}/info",
            headers={"x-cg-pro-api-key": COINGECKO_API_KEY},
            timeout=20,
        )
        if resp.status_code != 200:
            return {"available": False}
        payload = resp.json() or {}
        attributes = (payload.get("data") or {}).get("attributes") or {}
        holders = attributes.get("holders") or {}
        distribution = holders.get("distribution_percentage") or {}
        return set_memory_cache(HOLDER_DISTRIBUTION_CACHE, cache_key, {
            "available": True,
            "holder_count": holders.get("count"),
            "distribution_percentage": distribution,
            "source": "CoinGecko Onchain",
        })
    except Exception as e:
        logger.error(f"Holder distribution error for {platform}:{contract_address}: {e}")
        return {"available": False}

def get_goplus_security(platform: Optional[str], contract_address: Optional[str]) -> dict:
    if not platform or not contract_address:
        return {"available": False}
    cache_key = f"{platform}::{contract_address.lower()}"
    cached = get_memory_cache(GOPLUS_SECURITY_CACHE, cache_key, ttl_seconds=600)
    if cached is not None:
        return cached
    try:
        if platform == "solana":
            resp = requests.get(
                "https://api.gopluslabs.io/api/v1/solana/token_security",
                params={"contract_addresses": contract_address},
                timeout=20,
            )
        else:
            chain_id = GOPLUS_CHAIN_MAP.get(platform)
            if not chain_id:
                return {"available": False}
            resp = requests.get(
                f"https://api.gopluslabs.io/api/v1/token_security/{chain_id}",
                params={"contract_addresses": contract_address},
                timeout=20,
            )
        if resp.status_code != 200:
            return {"available": False}
        payload = resp.json() or {}
        result = payload.get("result") or {}
        token_data = result.get(contract_address) or result.get(contract_address.lower()) or {}
        if not token_data and isinstance(result, dict) and len(result) == 1:
            token_data = next(iter(result.values()))
        return set_memory_cache(GOPLUS_SECURITY_CACHE, cache_key, {"available": bool(token_data), "data": token_data, "source": "GoPlus"})
    except Exception as e:
        logger.error(f"GoPlus security error for {platform}:{contract_address}: {e}")
        return {"available": False}

def get_goplus_rugpull(platform: Optional[str], contract_address: Optional[str]) -> dict:
    if not platform or not contract_address or platform == "solana":
        return {"available": False}
    cache_key = f"{platform}::{contract_address.lower()}"
    cached = get_memory_cache(GOPLUS_RUGPULL_CACHE, cache_key, ttl_seconds=600)
    if cached is not None:
        return cached
    chain_id = GOPLUS_CHAIN_MAP.get(platform)
    if not chain_id:
        return {"available": False}
    try:
        resp = requests.get(
            f"https://api.gopluslabs.io/api/v1/rugpull_detecting/{chain_id}",
            params={"contract_addresses": contract_address},
            timeout=20,
        )
        if resp.status_code != 200:
            return {"available": False}
        payload = resp.json() or {}
        result = payload.get("result") or {}
        token_data = result.get(contract_address) or result.get(contract_address.lower()) or {}
        if not token_data and isinstance(result, dict) and len(result) == 1:
            token_data = next(iter(result.values()))
        return set_memory_cache(GOPLUS_RUGPULL_CACHE, cache_key, {"available": bool(token_data), "data": token_data, "source": "GoPlus RugPull"})
    except Exception as e:
        logger.error(f"GoPlus rugpull error for {platform}:{contract_address}: {e}")
        return {"available": False}

def build_tokenomics_profile(details: dict) -> dict:
    market_data = details.get("market_data") or {}
    circulating = safe_float(market_data.get("circulating_supply"))
    total = safe_float(market_data.get("total_supply"))
    max_supply = safe_float(market_data.get("max_supply"))
    fdv = safe_float((market_data.get("fully_diluted_valuation") or {}).get("usd"))
    market_cap = safe_float((market_data.get("market_cap") or {}).get("usd"))

    basis_supply = max_supply or total or 0
    circulating_ratio = (circulating / basis_supply * 100) if circulating and basis_supply else None
    diluted_gap_pct = ((basis_supply - circulating) / basis_supply * 100) if circulating and basis_supply else None
    if diluted_gap_pct is None:
        unlock_risk = "Unknown"
    elif diluted_gap_pct > 60:
        unlock_risk = "High"
    elif diluted_gap_pct > 25:
        unlock_risk = "Medium"
    else:
        unlock_risk = "Low"

    warnings = []
    if diluted_gap_pct is not None and diluted_gap_pct > 40:
        warnings.append("Large percentage of supply is not yet circulating.")
    if fdv and market_cap and fdv > market_cap * 2:
        warnings.append("Fully diluted valuation is much higher than current market cap.")
    if max_supply is None and total is None:
        warnings.append("Supply cap is unclear or not reported.")

    return {
        "circulating_supply": circulating,
        "total_supply": total,
        "max_supply": max_supply,
        "fdv_usd": fdv,
        "market_cap_usd": market_cap,
        "circulating_ratio_pct": round(circulating_ratio, 2) if circulating_ratio is not None else None,
        "dilution_gap_pct": round(diluted_gap_pct, 2) if diluted_gap_pct is not None else None,
        "unlock_risk": unlock_risk,
        "warnings": warnings,
        "source": "CoinGecko",
    }

MEME_CATEGORY_KEYWORDS = {
    "meme", "memes", "animal meme", "internet meme", "dog-themed", "cat-themed", "frog-themed",
}
MEME_NAME_KEYWORDS = {
    "inu", "doge", "shib", "pepe", "bonk", "floki", "wojak", "mog", "cat", "dog", "moon",
    "pump", "baby", "elon", "degen", "based", "rekt", "goat", "fart", "trump", "chillguy",
}
SERIOUS_CATEGORY_KEYWORDS = {
    "artificial intelligence", "ai", "layer 1", "layer 2", "oracle", "infrastructure", "depin",
    "bridge", "restaking", "liquid staking", "storage", "privacy", "real world assets", "rwa",
    "gaming", "exchange-based tokens", "derivatives", "lending", "payments", "enterprise",
    "decentralized exchange", "dex", "yield farming", "defi", "smart contract platform",
}
SERIOUS_NAME_KEYWORDS = {
    "chain", "network", "protocol", "finance", "swap", "dex", "bridge", "oracle", "compute",
    "infrastructure", "staking", "rollup", "layer", "data", "storage", "cloud",
    "artificial", "intelligence", "superintelligence", "alliance",
}

def normalize_identity_text(value: Optional[str]) -> str:
    return " ".join(re.findall(r"[a-z0-9]+", (value or "").lower()))

def build_asset_identity_profile(
    *,
    symbol: str,
    coin_id: str,
    name: Optional[str],
    market_cap: float,
    details: Optional[dict],
    venues: Optional[List[dict]],
) -> dict:
    details = details or {}
    venues = venues or []
    categories = [str(item).strip() for item in (details.get("categories") or []) if str(item).strip()]
    categories_blob = " ".join(normalize_identity_text(item) for item in categories)
    identity_blob = " ".join(
        part for part in [
            normalize_identity_text(symbol),
            normalize_identity_text(coin_id),
            normalize_identity_text(name),
            categories_blob,
        ] if part
    )
    platforms = details.get("platforms") or {}
    has_contract = any(bool(address) for address in platforms.values())
    dex_routes = len([venue for venue in venues if venue.get("type") in {"dex", "swap"}])
    cex_routes = len([venue for venue in venues if venue.get("type") == "cex"])

    meme_category_hits = sum(1 for keyword in MEME_CATEGORY_KEYWORDS if keyword in categories_blob)
    meme_name_hits = sum(1 for keyword in MEME_NAME_KEYWORDS if keyword in identity_blob)
    serious_category_hits = sum(1 for keyword in SERIOUS_CATEGORY_KEYWORDS if keyword in categories_blob)
    serious_name_hits = sum(1 for keyword in SERIOUS_NAME_KEYWORDS if keyword in identity_blob)

    meme_score = 0.0
    meme_score += meme_category_hits * 34.0
    meme_score += min(28.0, meme_name_hits * 12.0)
    if has_contract:
        meme_score += 8.0
    if dex_routes:
        meme_score += min(16.0, dex_routes * 4.0)
    if 0 < market_cap <= 1_000_000_000:
        meme_score += 12.0
    elif 0 < market_cap <= 2_500_000_000:
        meme_score += 6.0

    speculative_score = 0.0
    if has_contract:
        speculative_score += 14.0
    if dex_routes:
        speculative_score += min(18.0, dex_routes * 4.5)
    if market_cap and market_cap <= 750_000_000:
        speculative_score += 20.0
    elif market_cap and market_cap <= 2_000_000_000:
        speculative_score += 10.0
    if not categories:
        speculative_score += 8.0
    if cex_routes <= 2:
        speculative_score += 8.0
    speculative_score += min(20.0, meme_name_hits * 4.0)

    serious_score = 0.0
    serious_score += serious_category_hits * 24.0
    serious_score += min(30.0, serious_name_hits * 7.5)
    if serious_name_hits >= 3:
        serious_score += 12.0
    if market_cap >= 5_000_000_000:
        serious_score += 26.0
    elif market_cap >= 2_000_000_000:
        serious_score += 18.0
    elif market_cap >= 1_000_000_000:
        serious_score += 10.0
    if cex_routes >= 4 and dex_routes == 0:
        serious_score += 8.0

    meme_score = round(min(100.0, meme_score), 1)
    speculative_score = round(min(100.0, speculative_score), 1)
    serious_score = round(min(100.0, serious_score), 1)

    if meme_score >= max(42.0, serious_score + 8.0):
        classification = "meme"
    elif serious_score >= max(38.0, meme_score + 10.0):
        classification = "serious"
    else:
        classification = "speculative"

    summary = (
        f"{symbol} classifies as {classification}. "
        f"Meme score {meme_score}/100, speculative score {speculative_score}/100, serious score {serious_score}/100."
    )
    if categories:
        summary += f" Categories: {', '.join(categories[:4])}."
    if has_contract:
        summary += " Contract-based asset."
    if dex_routes:
        summary += f" {dex_routes} DEX/SWAP route{'s' if dex_routes != 1 else ''} detected."

    return {
        "classification": classification,
        "meme_score": meme_score,
        "speculative_score": speculative_score,
        "serious_score": serious_score,
        "meme_category_hits": meme_category_hits,
        "meme_name_hits": meme_name_hits,
        "serious_category_hits": serious_category_hits,
        "serious_name_hits": serious_name_hits,
        "has_contract": has_contract,
        "dex_routes": dex_routes,
        "cex_routes": cex_routes,
        "categories": categories[:8],
        "summary": summary,
    }

def build_holder_concentration_profile(holder_data: dict, goplus_security: dict) -> dict:
    distribution = holder_data.get("distribution_percentage") or {}
    top_10 = safe_float(distribution.get("top_10"))
    top_20 = safe_float(distribution.get("11_20"))
    owner_balance_raw = safe_float(((goplus_security.get("data") or {}).get("owner_percent")))
    creator_balance_raw = safe_float(((goplus_security.get("data") or {}).get("creator_percent")))
    owner_balance = owner_balance_raw if owner_balance_raw and owner_balance_raw > 0 else None
    creator_balance = creator_balance_raw if creator_balance_raw and creator_balance_raw > 0 else None

    concentration_score = None
    warnings = []
    if top_10 is not None:
        concentration_score = top_10
        if top_10 >= 65:
            warnings.append("Top 10 wallets control a very large share of supply.")
        elif top_10 >= 40:
            warnings.append("Holder distribution is still concentrated.")
    if owner_balance and owner_balance >= 5:
        warnings.append("Owner wallet still controls a meaningful token share.")
    if creator_balance and creator_balance >= 5:
        warnings.append("Creator wallet concentration is elevated.")

    return {
        "available": bool(holder_data.get("available") or concentration_score is not None or owner_balance is not None or creator_balance is not None),
        "holder_count": holder_data.get("holder_count"),
        "top_10_pct": top_10,
        "next_bucket_pct": top_20,
        "owner_pct": owner_balance,
        "creator_pct": creator_balance,
        "warnings": warnings,
        "source": holder_data.get("source") or goplus_security.get("source") or "Unavailable",
    }

def build_wallet_cluster_intelligence(holder_data: dict, goplus_security: dict) -> dict:
    distribution = holder_data.get("distribution_percentage") or {}
    top_10 = safe_float(distribution.get("top_10"))
    next_10 = safe_float(distribution.get("11_20"))
    next_20 = safe_float(distribution.get("21_40"))
    next_60 = safe_float(distribution.get("41_100"))
    has_distribution = any(value is not None for value in [top_10, next_10, next_20, next_60])
    long_tail = max(0.0, 100.0 - sum(value or 0.0 for value in [top_10, next_10, next_20, next_60])) if has_distribution else None

    owner_pct_raw = safe_float(((goplus_security.get("data") or {}).get("owner_percent")))
    creator_pct_raw = safe_float(((goplus_security.get("data") or {}).get("creator_percent")))
    owner_pct = owner_pct_raw if owner_pct_raw and owner_pct_raw > 0 else None
    creator_pct = creator_pct_raw if creator_pct_raw and creator_pct_raw > 0 else None
    insider_control = max([value for value in [owner_pct, creator_pct] if value is not None] or [0.0])
    combined_insider = sum(value or 0.0 for value in [owner_pct, creator_pct])

    concentration_score = None
    cluster_risk_score = None
    distribution_quality_score = None
    cluster_risk_level = "Unknown"
    distribution_quality = "Unknown"
    if has_distribution:
        concentration_score = min(
            100.0,
            (top_10 or 0.0) * 0.72 +
            (next_10 or 0.0) * 0.26 +
            (next_20 or 0.0) * 0.12 +
            combined_insider * 1.4
        )
        cluster_risk_score = round(min(100.0, concentration_score))
        distribution_quality_score = round(max(0.0, min(100.0, 100.0 - (((top_10 or 0.0) * 0.9) + ((next_10 or 0.0) * 0.45) + combined_insider * 1.8))))

        if cluster_risk_score >= 80:
            cluster_risk_level = "High"
        elif cluster_risk_score >= 55:
            cluster_risk_level = "Medium"
        else:
            cluster_risk_level = "Low"

        if distribution_quality_score >= 70:
            distribution_quality = "Healthy"
        elif distribution_quality_score >= 45:
            distribution_quality = "Mixed"
        else:
            distribution_quality = "Fragile"

    insider_control_score = round(min(100.0, insider_control * 7.5 + combined_insider * 2.5)) if (owner_pct is not None or creator_pct is not None) else None

    warnings: List[str] = []
    evidence: List[str] = []

    if top_10 is not None and top_10 >= 65:
        warnings.append("Top 10 wallets control an extremely large share of supply.")
    elif top_10 is not None and top_10 >= 40:
        warnings.append("Top 10 wallets still control a concentrated share of supply.")

    if next_10 is not None and next_10 >= 15:
        warnings.append("The next 10 wallets also hold meaningful size, which can amplify coordinated exits.")

    if insider_control >= 5:
        warnings.append("A single owner or creator wallet still has meaningful control.")
    if combined_insider >= 10:
        warnings.append("Combined insider exposure is elevated enough to raise dump vulnerability.")
    if long_tail is not None and long_tail < 35:
        warnings.append("Too little supply appears to be distributed across the long tail of holders.")

    if top_10 is not None:
        evidence.append(f"Top 10 wallets hold {top_10:.2f}% of supply.")
    if next_10 is not None:
        evidence.append(f"Wallets ranked 11-20 hold another {next_10:.2f}%.")
    if combined_insider > 0:
        evidence.append(f"Owner/creator wallets account for {combined_insider:.2f}% combined.")
    if long_tail is not None:
        evidence.append(f"Estimated long-tail distribution is {long_tail:.2f}% of supply.")

    if has_distribution and cluster_risk_level == "High":
        summary = "Supply looks tightly controlled. A handful of wallets appear capable of amplifying both the pump and the exit."
    elif has_distribution and cluster_risk_level == "Medium":
        summary = "Distribution is not clean yet. Large holders can still influence how quickly the move extends or reverses."
    elif has_distribution:
        summary = "Holder distribution looks relatively healthier. Cluster-driven manipulation risk is lower than average for this setup."
    elif owner_pct is not None or creator_pct is not None:
        summary = "Full holder distribution is not available yet. PumpRadar can only verify owner and creator wallet exposure for this asset right now."
    else:
        summary = "No verified wallet clustering data yet."

    buckets = []
    if has_distribution:
        buckets = [
            {"label": "Top 10", "key": "top_10", "pct": round(top_10 or 0.0, 2), "tone": "rose"},
            {"label": "11-20", "key": "next_10", "pct": round(next_10 or 0.0, 2), "tone": "amber"},
            {"label": "21-40", "key": "next_20", "pct": round(next_20 or 0.0, 2), "tone": "sky"},
            {"label": "41-100", "key": "next_60", "pct": round(next_60 or 0.0, 2), "tone": "emerald"},
            {"label": "Long Tail", "key": "long_tail", "pct": round(long_tail or 0.0, 2), "tone": "slate"},
        ]

    available = bool(has_distribution or owner_pct is not None or creator_pct is not None)
    return {
        "available": available,
        "cluster_risk_score": cluster_risk_score if available else None,
        "cluster_risk_level": cluster_risk_level if available else None,
        "insider_control_score": insider_control_score if available else None,
        "distribution_quality_score": distribution_quality_score if available else None,
        "distribution_quality": distribution_quality if available else None,
        "holder_count": holder_data.get("holder_count") if has_distribution else None,
        "top_10_pct": round(top_10, 2) if top_10 is not None else None,
        "next_10_pct": round(next_10, 2) if next_10 is not None else None,
        "next_20_pct": round(next_20, 2) if next_20 is not None else None,
        "next_60_pct": round(next_60, 2) if next_60 is not None else None,
        "long_tail_pct": round(long_tail, 2) if long_tail is not None else None,
        "owner_pct": round(owner_pct, 2) if owner_pct is not None else None,
        "creator_pct": round(creator_pct, 2) if creator_pct is not None else None,
        "combined_insider_pct": round(combined_insider, 2) if (owner_pct is not None or creator_pct is not None) else None,
        "summary": summary,
        "warnings": warnings,
        "evidence": evidence,
        "buckets": buckets,
        "source": holder_data.get("source") or goplus_security.get("source") or "Unavailable",
    }

def build_contract_risk_profile(platform: Optional[str], contract_address: Optional[str], goplus_security: dict, rugpull_data: dict) -> dict:
    if not platform or not contract_address:
        return {"available": False}
    security = goplus_security.get("data") or {}
    rugpull = rugpull_data.get("data") or {}
    if not security and not rugpull:
        return {
            "available": False,
            "platform": platform,
            "contract_address": contract_address,
            "risk_score": None,
            "risk_level": None,
            "buy_tax_pct": None,
            "sell_tax_pct": None,
            "warnings": [],
            "source": "GoPlus",
        }
    warnings = []
    risk_score = 100

    checks = [
        ("is_honeypot", "Honeypot risk detected.", 40),
        ("cannot_sell_all", "Token may restrict selling.", 20),
        ("is_blacklisted", "Blacklist mechanics detected.", 20),
        ("is_open_source", "Contract is not open source.", 15, True),
        ("is_proxy", "Proxy contract detected.", 8),
        ("hidden_owner", "Hidden owner privileges detected.", 15),
        ("owner_change_balance", "Owner can modify balances.", 25),
        ("selfdestruct", "Self-destruct capability detected.", 20),
        ("transfer_pausable", "Transfers can be paused.", 10),
        ("is_mintable", "Additional supply may be mintable.", 10),
    ]
    for item in checks:
        field = item[0]
        message = item[1]
        penalty = item[2]
        invert = len(item) > 3 and item[3]
        flag = to_bool_flag(security.get(field))
        triggered = (not flag) if invert else flag
        if triggered:
            warnings.append(message)
            risk_score -= penalty

    buy_tax = safe_float(security.get("buy_tax"))
    sell_tax = safe_float(security.get("sell_tax"))
    if buy_tax and buy_tax > 10:
        warnings.append(f"Buy tax is elevated at {buy_tax:.2f}%.")
        risk_score -= 12
    if sell_tax and sell_tax > 10:
        warnings.append(f"Sell tax is elevated at {sell_tax:.2f}%.")
        risk_score -= 12
    if to_bool_flag(rugpull.get("risk")) or to_bool_flag(rugpull.get("is_rugpull")):
        warnings.append("Rug-pull detector flagged this contract.")
        risk_score -= 25

    if risk_score >= 75:
        level = "Low"
    elif risk_score >= 50:
        level = "Medium"
    else:
        level = "High"

    return {
        "available": bool(security or rugpull),
        "platform": platform,
        "contract_address": contract_address,
        "risk_score": max(0, risk_score),
        "risk_level": level,
        "buy_tax_pct": buy_tax,
        "sell_tax_pct": sell_tax,
        "warnings": warnings,
        "source": "GoPlus",
    }

def build_rugpull_profile(
    *,
    asset_identity: Optional[dict],
    tokenomics: Optional[dict],
    wallet_cluster_intelligence: Optional[dict],
    contract_risk: Optional[dict],
    venues: Optional[List[dict]],
    manipulation_profile: Optional[dict] = None,
) -> dict:
    asset_identity = asset_identity or {}
    tokenomics = tokenomics or {}
    wallet_cluster_intelligence = wallet_cluster_intelligence or {}
    contract_risk = contract_risk or {}
    venues = venues or []
    manipulation_profile = manipulation_profile or {}

    venue_count = len(venues)
    dex_routes = len([venue for venue in venues if venue.get("type") in {"dex", "swap"}])
    contract_risk_score = safe_float(contract_risk.get("risk_score"))
    contract_risk_level = (contract_risk.get("risk_level") or "").lower()
    cluster_risk_score = safe_float(wallet_cluster_intelligence.get("cluster_risk_score"))
    insider_pct = safe_float(wallet_cluster_intelligence.get("combined_insider_pct"))
    top_10_pct = safe_float(wallet_cluster_intelligence.get("top_10_pct"))
    long_tail_pct = safe_float(wallet_cluster_intelligence.get("long_tail_pct"))
    dilution_gap = safe_float(tokenomics.get("dilution_gap_pct"))
    dump_risk_score = safe_float(manipulation_profile.get("dump_risk_score"))

    rugpull_score = 0.0
    warnings: List[str] = []

    if asset_identity.get("classification") in {"meme", "speculative"}:
        rugpull_score += 12.0
    if contract_risk_level == "high" or (contract_risk_score is not None and contract_risk_score <= 45):
        rugpull_score += 32.0
        warnings.append("Contract risk is already elevated.")
    elif contract_risk_level == "medium" or (contract_risk_score is not None and contract_risk_score <= 65):
        rugpull_score += 16.0

    if cluster_risk_score is not None and cluster_risk_score >= 75:
        rugpull_score += 24.0
        warnings.append("Wallet clustering is severe.")
    elif cluster_risk_score is not None and cluster_risk_score >= 60:
        rugpull_score += 14.0

    if insider_pct is not None and insider_pct >= 12:
        rugpull_score += 18.0
        warnings.append("Insider concentration is elevated.")
    elif insider_pct is not None and insider_pct >= 6:
        rugpull_score += 10.0

    if top_10_pct is not None and top_10_pct >= 55:
        rugpull_score += 14.0
    elif top_10_pct is not None and top_10_pct >= 40:
        rugpull_score += 8.0

    if long_tail_pct is not None and long_tail_pct < 30:
        rugpull_score += 10.0

    if dilution_gap is not None and dilution_gap >= 50:
        rugpull_score += 12.0
    elif dilution_gap is not None and dilution_gap >= 30:
        rugpull_score += 6.0

    if venue_count <= 1:
        rugpull_score += 14.0
        warnings.append("Execution routes are extremely limited.")
    elif venue_count <= 2:
        rugpull_score += 8.0
    if dex_routes and venue_count <= 3:
        rugpull_score += 6.0

    if dump_risk_score is not None and dump_risk_score >= 80:
        rugpull_score += 12.0
    elif dump_risk_score is not None and dump_risk_score >= 65:
        rugpull_score += 6.0

    rugpull_score = round(min(100.0, rugpull_score), 1)
    if rugpull_score >= 72:
        verdict = "high"
    elif rugpull_score >= 48:
        verdict = "medium"
    else:
        verdict = "low"

    summary = (
        f"Rugpull profile is {verdict}. Score {rugpull_score}/100 "
        f"with {venue_count} route{'s' if venue_count != 1 else ''} and {dex_routes} DEX/SWAP route{'s' if dex_routes != 1 else ''}."
    )
    if warnings:
        summary += " " + " ".join(warnings[:3])

    return {
        "score": rugpull_score,
        "verdict": verdict,
        "venue_count": venue_count,
        "dex_routes": dex_routes,
        "warnings": warnings[:4],
        "summary": summary,
    }

def get_exchange_metadata(identifier: str) -> dict:
    if not identifier:
        return {}
    if identifier in EXCHANGE_METADATA_CACHE:
        return EXCHANGE_METADATA_CACHE[identifier]
    try:
        resp = requests.get(
            f"https://api.coingecko.com/api/v3/exchanges/{identifier}",
            headers=CG_HEADERS,
            timeout=15,
        )
        if resp.status_code == 200:
            data = resp.json()
            metadata = {
                "image": data.get("image") or "",
                "url": data.get("url") or "",
                "name": data.get("name") or identifier,
            }
            EXCHANGE_METADATA_CACHE[identifier] = metadata
            return metadata
    except Exception as e:
        logger.error(f"Exchange metadata error for {identifier}: {e}")
    EXCHANGE_METADATA_CACHE[identifier] = {}
    return {}

def build_exchange_logo_fallback(name: str) -> str:
    normalized = (name or "").strip().lower()
    known = {
        "binance": "https://assets.coingecko.com/markets/images/52/small/binance.jpg",
        "bitmart": "https://assets.coingecko.com/markets/images/239/small/Bitmart.png",
        "upbit": "https://assets.coingecko.com/markets/images/117/small/upbit.png",
        "xt.com": "https://assets.coingecko.com/markets/images/404/small/xt.png",
        "okx": "https://assets.coingecko.com/markets/images/96/small/WeChat_Image_20220118095654.png",
        "whitebit": "https://assets.coingecko.com/markets/images/418/small/whitebit_final.png",
        "ascendex (bitmax)": "https://assets.coingecko.com/markets/images/501/small/ascendex.png",
        "ascendex": "https://assets.coingecko.com/markets/images/501/small/ascendex.png",
        "bybit": "https://assets.coingecko.com/markets/images/698/small/bybit_spot.png",
        "mexc": "https://assets.coingecko.com/markets/images/409/small/mexc.jpeg",
        "gate": "https://assets.coingecko.com/markets/images/60/small/gateio.png",
        "kucoin": "https://assets.coingecko.com/markets/images/61/small/kucoin.png",
        "coinbase exchange": "https://assets.coingecko.com/markets/images/23/small/Coinbase_Coin_Primary.png",
        "coinbase": "https://assets.coingecko.com/markets/images/23/small/Coinbase_Coin_Primary.png",
        "kraken": "https://assets.coingecko.com/markets/images/29/small/kraken.jpg",
        "uniswap v3 (ethereum)": "https://assets.coingecko.com/markets/images/665/small/uniswap.png",
        "uniswap": "https://assets.coingecko.com/markets/images/665/small/uniswap.png",
        "pancakeswap v3 (bsc)": "https://assets.coingecko.com/markets/images/687/small/pancakeswap.jpeg",
        "pancakeswap": "https://assets.coingecko.com/markets/images/687/small/pancakeswap.jpeg",
        "raydium": "https://assets.coingecko.com/markets/images/694/small/raydium.jpeg",
        "jupiter": "https://assets.coingecko.com/markets/images/1174/small/jupiter.jpg",
        "orca": "https://assets.coingecko.com/markets/images/691/small/orca.jpeg",
    }
    return known.get(normalized, "")

def build_coin_analysis_sections(
    *,
    symbol: str,
    signal_type: str,
    price: float,
    price_change_1h: float,
    price_change_24h: float,
    price_change_7d: float,
    volume_24h: float,
    market_cap: float,
    signal_strength: float,
    confidence: str,
    risk_level: str,
    reason: str,
    social_volume: float = 0,
    galaxy_score: float = 0,
    direction_audit: Optional[dict] = None,
) -> List[dict]:
    volume_ratio = (volume_24h / market_cap * 100) if market_cap else 0.0
    resolved_direction = (direction_audit or {}).get("resolved_direction", signal_type)
    transition_state = (direction_audit or {}).get("transition_state", "bullish_continuation" if resolved_direction == "pump" else "bearish_breakdown")
    if resolved_direction == "pump":
        if transition_state == "bullish_pullback":
            direction_word = "a bullish pullback within a broader upside structure"
        elif transition_state == "bullish_reversal":
            direction_word = "an early bullish reversal attempt after prior weakness"
        else:
            direction_word = "bullish continuation"
    else:
        if transition_state == "dead_cat_bounce":
            direction_word = "bearish structure with only a countertrend bounce so far"
        elif transition_state == "bearish_reversal":
            direction_word = "failed upside structure rolling into fresh downside pressure"
        else:
            direction_word = "distribution / sell pressure"
    acceleration = "accelerating" if abs(price_change_1h) >= abs(price_change_24h) / 6 else "steady"
    confidence_label = confidence.capitalize()
    risk_label = risk_level.capitalize()
    market_participation = "very high" if volume_ratio >= 50 else "healthy" if volume_ratio >= 20 else "light"
    sections = [
        {
            "title": "Momentum Setup",
            "body": (
                f"{symbol} is trading at {format_currency_compact(price)} with a 1h move of {format_pct(price_change_1h)}, "
                f"a 24h move of {format_pct(price_change_24h)}, and a 7d move of {format_pct(price_change_7d)}. "
                f"This profile suggests {direction_word} with {acceleration} short-term momentum rather than a flat range."
            ),
        },
        {
            "title": "Liquidity & Participation",
            "body": (
                f"24h turnover is {format_currency_compact(volume_24h)} against a market cap of {format_currency_compact(market_cap)}, "
                f"which puts the volume/market-cap ratio at {volume_ratio:.2f}%. That points to {market_participation} trading participation; "
                f"the move is more credible when liquidity expands alongside price instead of moving on thin volume."
            ),
        },
        {
            "title": "Signal Read",
            "body": (
                f"PumpRadar scored this setup at {int(signal_strength)}% with {confidence_label.lower()} confidence and {risk_label.lower()} risk. "
                f"The latest trigger was: {reason or 'quantitative momentum, liquidity, and trend alignment'}. "
                f"{'Social activity is elevated. ' if social_volume else ''}"
                f"{f'Galaxy score is {int(galaxy_score)}, reinforcing market attention. ' if galaxy_score else ''}"
                f"This should be treated as a tactical setup, not a long-term conviction call."
            ),
        },
        {
            "title": "Risk Watch",
            "body": (
                f"The main invalidation to monitor is a sharp cooldown in hourly momentum or a drop in volume after the initial move. "
                f"For {'pump' if resolved_direction == 'pump' else 'dump'} setups, weak follow-through after a strong first impulse often signals exhaustion, "
                f"fake {'breakout' if resolved_direction == 'pump' else 'breakdown'} behavior, or a fast reversal."
            ),
        },
    ]
    return sections

def fetch_geckoterminal_token_pools(platform: Optional[str], contract_address: Optional[str]) -> List[dict]:
    if not platform or not contract_address:
        return []
    network = COINGECKO_NETWORK_MAP.get(platform)
    if not network:
        return []
    try:
        resp = requests.get(
            f"https://api.geckoterminal.com/api/v2/networks/{network}/tokens/{contract_address}/pools",
            params={"include": "dex", "page": 1},
            headers={"accept": "application/json"},
            timeout=20,
        )
        if resp.status_code != 200:
            return []
        payload = resp.json() or {}
        pools = payload.get("data") or []
        included = payload.get("included") or []
        dex_index = {
            item.get("id"): item.get("attributes") or {}
            for item in included
            if item.get("type") == "dex"
        }
        venue_map: Dict[tuple[str, str], dict] = {}
        for pool in pools:
            attrs = pool.get("attributes") or {}
            relationships = pool.get("relationships") or {}
            dex_rel = (relationships.get("dex") or {}).get("data") or {}
            dex_attrs = dex_index.get(dex_rel.get("id"), {})
            dex_name = dex_attrs.get("name") or attrs.get("dex_name") or attrs.get("name") or "Onchain venue"
            pool_address = attrs.get("address") or (pool.get("id") or "").split("_", 1)[-1]
            volume = safe_float((attrs.get("volume_usd") or {}).get("h24")) or safe_float(attrs.get("volume_usd")) or 0
            reserve_usd = safe_float(attrs.get("reserve_in_usd")) or 0
            pair_name = attrs.get("name") or f"{contract_address[:6]}..."
            venue = {
                "name": dex_name,
                "url": f"https://www.geckoterminal.com/{network}/pools/{pool_address}",
                "type": classify_trading_venue(dex_name),
                "pair": pair_name,
                "volume_usd": round(volume, 2),
                "trust_score": "onchain",
                "trust_score_numeric": 55,
                "spread_pct": None,
                "logo": dex_attrs.get("image_url") or build_exchange_logo_fallback(dex_name),
                "source": "GeckoTerminal pool",
                "reserve_usd": round(reserve_usd, 2),
            }
            dedupe_key = ((dex_name or "").strip().lower(), (pair_name or "").strip().upper())
            current = venue_map.get(dedupe_key)
            if not current or (venue.get("volume_usd", 0), venue.get("reserve_usd", 0)) > (current.get("volume_usd", 0), current.get("reserve_usd", 0)):
                venue_map[dedupe_key] = venue
        venues = list(venue_map.values())
        venues.sort(key=lambda item: (item.get("volume_usd", 0), item.get("reserve_usd", 0)), reverse=True)
        return venues[:8]
    except Exception as e:
        logger.error(f"GeckoTerminal pools error for {platform}:{contract_address}: {e}")
        return []

def build_market_venues(symbol: str, coin_id: str, platform: Optional[str] = None, contract_address: Optional[str] = None) -> List[dict]:
    venues: List[dict] = []
    seen = set()
    tickers = fetch_coin_tickers(coin_id)

    for ticker in tickers:
        market = ticker.get("market", {}) or {}
        market_identifier = market.get("identifier") or ""
        market_name = market.get("name") or market_identifier or "Unknown venue"
        market_meta = get_exchange_metadata(market_identifier) if market_identifier else {}
        base = ticker.get("base") or symbol
        target = ticker.get("target") or "USD"
        pair_label = build_route_pair_label(
            symbol=symbol,
            base=base,
            target=target,
            target_coin_id=ticker.get("target_coin_id"),
        )
        dedupe_key = (market_name.lower(), pair_label.upper())
        if dedupe_key in seen:
            continue
        seen.add(dedupe_key)
        trade_url = ticker.get("trade_url") or market_meta.get("url") or f"https://www.coingecko.com/en/coins/{coin_id}"
        if not isinstance(trade_url, str) or not trade_url.startswith("http"):
            trade_url = f"https://www.coingecko.com/en/coins/{coin_id}"
        bid_ask_spread_pct = ticker.get("bid_ask_spread_percentage")
        volume_usd = round((ticker.get("converted_volume", {}) or {}).get("usd") or 0, 2)
        venues.append({
            "name": market_meta.get("name") or market_name,
            "url": trade_url,
            "type": classify_trading_venue(market_name),
            "pair": pair_label,
            "volume_usd": volume_usd,
            "trust_score": ticker.get("trust_score") or "unknown",
            "trust_score_numeric": score_trust_level(ticker.get("trust_score") or "unknown"),
            "spread_pct": round(float(bid_ask_spread_pct), 4) if bid_ask_spread_pct is not None else None,
            "logo": market.get("logo") or market_meta.get("image") or build_exchange_logo_fallback(market_meta.get("name") or market_name),
            "source": "CoinGecko ticker",
        })

    if venues:
        grouped_limits = {"cex": 6, "dex": 4, "swap": 4}
        final: List[dict] = []
        for venue_type in ("cex", "dex", "swap"):
            group = [v for v in venues if v["type"] == venue_type]
            group.sort(
                key=lambda item: (
                    item.get("volume_usd", 0),
                    item.get("trust_score_numeric", 0),
                    -((item.get("spread_pct") or 99)),
                ),
                reverse=True,
            )
            final.extend(group[:grouped_limits[venue_type]])
        if final:
            return final

    onchain_venues = fetch_geckoterminal_token_pools(platform, contract_address)
    if onchain_venues:
        return onchain_venues

    return []

def build_signal_execution_plan(
    *,
    signal_type: str,
    symbol: str,
    price: float,
    price_change_1h: float,
    price_change_24h: float,
    price_change_7d: float,
    volume_24h: float,
    market_cap: float,
    signal_strength: float,
    confidence: str,
    risk_level: str,
    venues: List[dict],
    direction_audit: Optional[dict] = None,
) -> dict:
    volume_ratio = (volume_24h / market_cap * 100) if market_cap else 0.0
    resolved_direction = (direction_audit or {}).get("resolved_direction", signal_type)
    transition_state = (direction_audit or {}).get("transition_state", "bullish_continuation" if resolved_direction == "pump" else "bearish_breakdown")
    absolute_move = max(abs(price_change_1h), abs(price_change_24h) / 6, abs(price_change_7d) / 20)
    volatility_pct = max(1.2, min(14.0, absolute_move * 1.35))
    best_venue = max(
        venues,
        key=lambda item: (
            item.get("trust_score_numeric", 0),
            item.get("volume_usd", 0),
            -(item.get("spread_pct") or 999),
        ),
        default=None,
    )
    venue_count = len(venues)
    average_spread = round(
        sum(v.get("spread_pct") or 0 for v in venues if v.get("spread_pct") is not None) /
        max(1, len([v for v in venues if v.get("spread_pct") is not None])),
        4,
    ) if any(v.get("spread_pct") is not None for v in venues) else None

    liquidity_score = round(min(100, volume_ratio * 2.2 + min(venue_count, 8) * 5 + min((best_venue or {}).get("volume_usd", 0) / 2_000_000, 30)))
    spread_score = 55 if average_spread is None else round(max(0, min(100, 100 - average_spread * 650)))
    venue_quality_score = round(min(100, ((best_venue or {}).get("trust_score_numeric", 45) * 0.55) + spread_score * 0.25 + min(venue_count * 4, 20)))
    execution_score = round(min(100, signal_strength * 0.45 + liquidity_score * 0.25 + venue_quality_score * 0.20 + spread_score * 0.10))

    entry_buffer_pct = max(0.4, min(3.0, volatility_pct * 0.18))
    stop_buffer_pct = max(1.0, min(6.5, volatility_pct * 0.42))
    target1_buffer_pct = max(1.2, min(8.0, stop_buffer_pct * 1.2))
    target2_buffer_pct = max(2.4, min(14.0, stop_buffer_pct * 2.0))

    if resolved_direction == "pump":
        entry_low = price * (1 - entry_buffer_pct / 100)
        entry_high = price * (1 + entry_buffer_pct / 100)
        stop_loss = price * (1 - stop_buffer_pct / 100)
        target_1 = price * (1 + target1_buffer_pct / 100)
        target_2 = price * (1 + target2_buffer_pct / 100)
        invalidation = (
            f"Pump thesis weakens if {symbol} loses {format_currency_compact(stop_loss)} "
            f"or if hourly volume fades materially while price stalls."
        )
        if transition_state == "bullish_pullback":
            setup_bias = "pullback continuation"
        elif transition_state == "bullish_reversal":
            setup_bias = "reversal attempt"
        else:
            setup_bias = "breakout continuation"
    else:
        entry_low = price * (1 - entry_buffer_pct / 100)
        entry_high = price * (1 + entry_buffer_pct / 100)
        stop_loss = price * (1 + stop_buffer_pct / 100)
        target_1 = price * (1 - target1_buffer_pct / 100)
        target_2 = price * (1 - target2_buffer_pct / 100)
        invalidation = (
            f"Dump thesis weakens if {symbol} reclaims {format_currency_compact(stop_loss)} "
            f"or if downside momentum fades despite elevated volume."
        )
        setup_bias = "failed-bounce continuation" if transition_state == "dead_cat_bounce" else "downside continuation"

    warning_flags: List[str] = []
    if volume_ratio < 8:
        warning_flags.append("Volume participation is still light relative to market cap.")
    if average_spread is not None and average_spread > 0.6:
        warning_flags.append("Venue spread is wide, so slippage risk is elevated.")
    if venue_count <= 2:
        warning_flags.append("The coin is trading on limited venues, which reduces execution flexibility.")
    if risk_level == "high":
        warning_flags.append("Model already flags this setup as high risk.")
    if abs(price_change_1h) > 7:
        warning_flags.append("Short-term move is stretched, so entry chasing is risky.")

    if execution_score >= 78:
        trade_readiness = "Ready"
    elif execution_score >= 60:
        trade_readiness = "Monitor Closely"
    else:
        trade_readiness = "Needs Confirmation"

    stop_distance = abs((price - stop_loss) / price) * 100 if price else 0
    target_distance = abs((target_1 - price) / price) * 100 if price else 0
    risk_reward = round(target_distance / stop_distance, 2) if stop_distance else 0

    return {
        "setup_bias": setup_bias,
        "trade_readiness": trade_readiness,
        "execution_score": execution_score,
        "liquidity_score": liquidity_score,
        "venue_quality_score": venue_quality_score,
        "spread_score": spread_score,
        "average_spread_pct": average_spread,
        "volume_market_cap_ratio": round(volume_ratio, 2),
        "venue_count": venue_count,
        "preferred_venue": best_venue,
        "entry_zone": {"low": round(entry_low, 8), "high": round(entry_high, 8)},
        "stop_loss": round(stop_loss, 8),
        "targets": [round(target_1, 8), round(target_2, 8)],
        "risk_reward": risk_reward,
        "invalidation": invalidation,
        "warning_flags": warning_flags,
        "position_sizing_note": (
            f"{confidence.capitalize()} confidence / {risk_level} risk setup. "
            f"Treat this as a {setup_bias} trade, not a blind market order."
        ),
    }

async def get_recent_telegram_signal_map(hours: int = 24) -> Dict[str, dict]:
    cache_key = f"telegram_signal_map::{hours}"
    cached = get_memory_cache(TELEGRAM_SIGNAL_MAP_CACHE, cache_key, ttl_seconds=120)
    if cached is not None:
        return cached
    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
    signals = await db.telegram_signals.find({
        "posted_at": {"$gte": cutoff},
        "symbol": {"$exists": True, "$ne": None},
    }).to_list(length=2000)

    symbol_map: Dict[str, dict] = {}
    for item in signals:
        symbol = (item.get("symbol") or "").upper()
        if not symbol:
            continue
        bucket = symbol_map.setdefault(symbol, {
            "mentions": 0,
            "bullish_mentions": 0,
            "bearish_mentions": 0,
            "unique_sources": set(),
            "avg_score_total": 0.0,
            "last_posted_at": None,
        })
        bucket["mentions"] += 1
        if item.get("direction") == "pump":
            bucket["bullish_mentions"] += 1
        elif item.get("direction") == "dump":
            bucket["bearish_mentions"] += 1
        source_name = item.get("source_name")
        if source_name:
            bucket["unique_sources"].add(source_name)
        bucket["avg_score_total"] += float(item.get("composite_score") or 0)
        posted_at = normalize_datetime(item.get("posted_at"))
        if posted_at and (bucket["last_posted_at"] is None or posted_at > bucket["last_posted_at"]):
            bucket["last_posted_at"] = posted_at

    for symbol, bucket in symbol_map.items():
        mentions = bucket["mentions"] or 1
        bucket["avg_score"] = round(bucket["avg_score_total"] / mentions, 2)
        bucket["unique_sources"] = len(bucket["unique_sources"])
        last_posted = bucket.get("last_posted_at")
        bucket["last_posted_at"] = last_posted.isoformat() if isinstance(last_posted, datetime) else None
        bucket.pop("avg_score_total", None)

    return set_memory_cache(TELEGRAM_SIGNAL_MAP_CACHE, cache_key, symbol_map)

def build_telegram_early_signal_candidates(signals: List[dict], hours: int = TELEGRAM_EARLY_SIGNAL_HOURS, limit: int = TELEGRAM_EARLY_SIGNAL_LIMIT) -> List[dict]:
    grouped: Dict[str, dict] = {}
    allowed_quality_labels = {"real_trade_signal", "possible_trade_signal"}

    filtered_signals = []
    ignored_by_quality = 0
    for signal in signals:
        quality = signal.get("quality_judge") or {}
        if quality and quality.get("label") not in allowed_quality_labels:
            ignored_by_quality += 1
            continue
        if quality and quality.get("is_trade_signal") is False:
            ignored_by_quality += 1
            continue
        filtered_signals.append(signal)

    for signal in filtered_signals:
        symbol = (signal.get("symbol") or "").upper()
        if not symbol:
            continue
        item = grouped.setdefault(symbol, {
            "symbol": symbol,
            "coin_name": signal.get("coin_name") or symbol,
            "coin_id": signal.get("coin_id"),
            "direction_votes": {"pump": 0, "dump": 0},
            "mentions": 0,
            "source_names": set(),
            "scores": [],
            "parser_scores": [],
            "cross_source_max": 1,
            "latest_posted_at": None,
            "reference_price": None,
            "message_urls": [],
        })
        item["mentions"] += 1
        direction = signal.get("direction") or "pump"
        item["direction_votes"][direction] = item["direction_votes"].get(direction, 0) + 1
        if signal.get("source_name"):
            item["source_names"].add(signal["source_name"])
        if signal.get("composite_score") is not None:
            item["scores"].append(float(signal.get("composite_score") or 0))
        if signal.get("parser_confidence") is not None:
            item["parser_scores"].append(float(signal.get("parser_confidence") or 0))
        item["cross_source_max"] = max(item["cross_source_max"], int(signal.get("cross_source_count") or 1))
        posted_at = normalize_datetime(signal.get("posted_at"))
        if posted_at and (item["latest_posted_at"] is None or posted_at > item["latest_posted_at"]):
            item["latest_posted_at"] = posted_at
            item["reference_price"] = signal.get("reference_price")
            if signal.get("coin_name"):
                item["coin_name"] = signal.get("coin_name")
            if signal.get("coin_id"):
                item["coin_id"] = signal.get("coin_id")
        if signal.get("message_url"):
            item["message_urls"].append(signal["message_url"])

    early_signals: List[dict] = []
    for item in grouped.values():
        unique_sources = len(item["source_names"])
        avg_score = round(sum(item["scores"]) / len(item["scores"]), 2) if item["scores"] else 0.0
        parser_confidence_avg = round(sum(item["parser_scores"]) / len(item["parser_scores"]), 2) if item["parser_scores"] else 0.0
        bullish_mentions = int(item["direction_votes"].get("pump", 0))
        bearish_mentions = int(item["direction_votes"].get("dump", 0))
        direction = "dump" if bearish_mentions > bullish_mentions else "pump"
        promotion_reasons: List[str] = []
        if item["mentions"] >= 2:
            promotion_reasons.append("repeat_mentions")
        if unique_sources >= 2:
            promotion_reasons.append("cross_source_confirmation")
        if avg_score >= 60:
            promotion_reasons.append("high_composite_score")
        if item["cross_source_max"] >= 2:
            promotion_reasons.append("clustered_call_window")

        candidate_ready = bool(
            (item["mentions"] >= 2 and unique_sources >= 2) or
            (avg_score >= 60 and item["cross_source_max"] >= 2) or
            (item["mentions"] >= 3 and avg_score >= 52)
        )
        candidate_priority = round(
            item["mentions"] * 11 +
            unique_sources * 14 +
            avg_score * 0.65 +
            parser_confidence_avg * 0.15 +
            item["cross_source_max"] * 8,
            2,
        )

        early_signals.append({
            "symbol": item["symbol"],
            "coin_name": item["coin_name"],
            "coin_id": item["coin_id"],
            "direction": direction,
            "mentions": item["mentions"],
            "bullish_mentions": bullish_mentions,
            "bearish_mentions": bearish_mentions,
            "unique_sources": unique_sources,
            "avg_score": avg_score,
            "parser_confidence_avg": parser_confidence_avg,
            "cross_source_max": item["cross_source_max"],
            "candidate_ready": candidate_ready,
            "candidate_priority": candidate_priority,
            "promotion_reasons": promotion_reasons,
            "latest_posted_at": serialize_datetime(item["latest_posted_at"]),
            "reference_price": item["reference_price"],
            "source_names": sorted(item["source_names"]),
            "message_urls": item["message_urls"][:3],
            "window_hours": hours,
        })

    early_signals.sort(
        key=lambda item: (
            int(item["candidate_ready"]),
            item["candidate_priority"],
            item["avg_score"],
            item["mentions"],
        ),
        reverse=True,
    )
    return early_signals[:limit]

async def persist_telegram_pipeline_audit(records: List[dict], snapshot_at: datetime, trigger: str) -> None:
    if not records:
        return
    now = datetime.now(timezone.utc)
    try:
        await db.telegram_signal_pipeline_audit.insert_many([
            {
                **record,
                "trigger": trigger,
                "snapshot_at": snapshot_at,
                "created_at": now,
            }
            for record in records
        ])
    except Exception as e:
        logger.warning("Failed to persist Telegram pipeline audit records: %s", e)

async def build_telegram_calibration_summary(hours: int = 72) -> dict:
    hours = max(6, min(hours, 24 * 14))
    cache_key = f"telegram_calibration::{hours}"
    cached = get_memory_cache(TELEGRAM_CALIBRATION_CACHE, cache_key, ttl_seconds=180)
    if cached is not None:
        return cached

    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(hours=hours)
    parser_rejections = await db.telegram_signal_rejections.find({
        "created_at": {"$gte": cutoff},
    }).sort("created_at", -1).limit(2000).to_list(length=2000)
    pipeline_records = await db.telegram_signal_pipeline_audit.find({
        "created_at": {"$gte": cutoff},
    }).sort("created_at", -1).limit(3000).to_list(length=3000)
    telegram_signals = await db.telegram_signals.find({
        "posted_at": {"$gte": cutoff},
    }).sort("posted_at", -1).limit(3000).to_list(length=3000)
    latest_snapshot = await db.signal_snapshots.find_one({}, sort=[("timestamp", -1)])

    parser_reason_counts: Counter[str] = Counter()
    short_call_rejections = 0
    for item in parser_rejections:
        parser_reason_counts.update(item.get("reasons") or [])
        if item.get("short_call_detected"):
            short_call_rejections += 1

    pipeline_stage_counts: Counter[str] = Counter()
    pipeline_reason_counts: Counter[tuple[str, str]] = Counter()
    for item in pipeline_records:
        stage = item.get("stage") or "unknown"
        pipeline_stage_counts[stage] += 1
        for reason in (item.get("reasons") or ["unspecified"]):
            pipeline_reason_counts[(stage, reason)] += 1

    verified_4h = []
    verified_4h_cross_source = []
    source_rollup: Dict[str, dict] = {}
    for signal in telegram_signals:
        source_name = signal.get("source_name") or "Unknown source"
        bucket = source_rollup.setdefault(source_name, {
            "source_name": source_name,
            "count": 0,
            "composite_total": 0.0,
            "cross_source_total": 0.0,
            "verified_count": 0,
        })
        bucket["count"] += 1
        bucket["composite_total"] += float(signal.get("composite_score") or 0)
        bucket["cross_source_total"] += float(signal.get("cross_source_count") or 1)
        four_hour = ((signal.get("verification") or {}).get("four_hour") or {})
        if four_hour.get("checked_at") is not None:
            hit = bool(four_hour.get("hit"))
            verified_4h.append(hit)
            bucket["verified_count"] += 1
            if int(signal.get("cross_source_count") or 1) >= 2:
                verified_4h_cross_source.append(hit)

    source_leaders = sorted(
        [
            {
                "source_name": source_name,
                "signal_count": bucket["count"],
                "avg_composite_score": round(bucket["composite_total"] / bucket["count"], 2) if bucket["count"] else 0.0,
                "avg_cross_source_count": round(bucket["cross_source_total"] / bucket["count"], 2) if bucket["count"] else 0.0,
                "verified_count": bucket["verified_count"],
            }
            for source_name, bucket in source_rollup.items()
        ],
        key=lambda item: (
            item["signal_count"],
            item["avg_composite_score"],
            item["verified_count"],
        ),
        reverse=True,
    )[:5]

    latest_snapshot_signals = ((latest_snapshot or {}).get("pump_signals", []) or []) + ((latest_snapshot or {}).get("dump_signals", []) or [])
    latest_snapshot_telegram_confirmed = [
        signal for signal in latest_snapshot_signals
        if str(signal.get("candidate_origin") or "").startswith("telegram") or (signal.get("telegram_early_seed") is not None)
    ]

    overall_4h_hit_rate = round((sum(1 for item in verified_4h if item) / len(verified_4h)) * 100, 2) if verified_4h else 0.0
    cross_source_4h_hit_rate = round((sum(1 for item in verified_4h_cross_source if item) / len(verified_4h_cross_source)) * 100, 2) if verified_4h_cross_source else 0.0

    top_parser_rejections = [
        {
            "reason": reason,
            "count": count,
            "share_pct": round((count / max(1, len(parser_rejections))) * 100, 2),
        }
        for reason, count in parser_reason_counts.most_common(5)
    ]
    top_pipeline_rejections = [
        {
            "stage": stage,
            "reason": reason,
            "count": count,
            "share_pct": round((count / max(1, len(pipeline_records))) * 100, 2),
        }
        for (stage, reason), count in pipeline_reason_counts.most_common(7)
    ]

    recommendations: List[dict] = []

    missing_structure = parser_reason_counts.get("missing_contract_or_structured_plan", 0)
    if missing_structure >= 8:
        recommendations.append({
            "priority": "high",
            "title": "Short-call parser still drops a meaningful share of messages",
            "detail": (
                f"{missing_structure} parser rejects in the last {hours}h still failed on missing contract/plan structure. "
                f"{short_call_rejections} of total rejects were short-call style messages."
            ),
            "suggested_action": "Keep early-signal mode permissive and consider adding channel-specific parser patterns for the noisiest formats.",
        })

    market_lookup_misses = pipeline_stage_counts.get("market_data_lookup", 0)
    if market_lookup_misses >= 5:
        recommendations.append({
            "priority": "high",
            "title": "Telegram seeds are being lost at market lookup",
            "detail": f"{market_lookup_misses} promoted Telegram symbols in the last {hours}h could not be resolved into market data.",
            "suggested_action": "Improve symbol-to-coin resolution, contract-based lookup, and fallback handling for newly launched tokens.",
        })

    source_stack_thin = sum(
        count for (stage, reason), count in pipeline_reason_counts.items()
        if stage == "snapshot_gate" and reason in {"source_stack_too_thin_for_pump", "source_stack_too_thin_for_dump"}
    )
    if source_stack_thin >= 5:
        recommendations.append({
            "priority": "medium",
            "title": "Snapshot gate still removes many Telegram-led setups",
            "detail": f"{source_stack_thin} recent snapshot rejects failed mainly because the source stack stayed too thin after enrichment.",
            "suggested_action": "Consider keeping Telegram-led symbols visible longer as early signals even when they miss full snapshot confirmation.",
        })

    if verified_4h_cross_source and cross_source_4h_hit_rate >= overall_4h_hit_rate + 8:
        recommendations.append({
            "priority": "medium",
            "title": "Cross-source Telegram clusters are outperforming the baseline",
            "detail": (
                f"4h hit rate is {cross_source_4h_hit_rate:.2f}% for signals with cross-source count >= 2, "
                f"vs {overall_4h_hit_rate:.2f}% overall."
            ),
            "suggested_action": "Increase ranking weight for clustered Telegram calls rather than lowering all thresholds globally.",
        })

    if not recommendations:
        recommendations.append({
            "priority": "low",
            "title": "No dominant failure mode yet",
            "detail": f"Recent Telegram flow is distributed across parser, lookup, and snapshot stages over the last {hours}h.",
            "suggested_action": "Collect more audit data before moving thresholds again.",
        })

    summary = {
        "hours": hours,
        "generated_at": serialize_datetime(now),
        "totals": {
            "stored_signals": len(telegram_signals),
            "parser_rejections": len(parser_rejections),
            "pipeline_rejections": len(pipeline_records),
            "short_call_rejections": short_call_rejections,
            "promoted_candidates": pipeline_stage_counts.get("telegram_promoted_candidate", 0) + pipeline_stage_counts.get("telegram_seed_attached", 0),
            "snapshot_rejections": pipeline_stage_counts.get("snapshot_gate", 0),
            "latest_snapshot_telegram_confirmed": len(latest_snapshot_telegram_confirmed),
            "verified_4h_samples": len(verified_4h),
        },
        "hit_rates": {
            "overall_4h_pct": overall_4h_hit_rate,
            "cross_source_4h_pct": cross_source_4h_hit_rate,
        },
        "top_parser_rejections": top_parser_rejections,
        "top_pipeline_rejections": top_pipeline_rejections,
        "source_leaders": source_leaders,
        "recommendations": recommendations[:4],
    }
    return set_memory_cache(TELEGRAM_CALIBRATION_CACHE, cache_key, summary)

def build_manipulation_profile(
    *,
    signal_type: str,
    symbol: str,
    price_change_1h: float,
    price_change_24h: float,
    price_change_7d: float,
    volume_24h: float,
    market_cap: float,
    signal_strength: float,
    risk_level: str,
    is_trending: bool,
    social_volume: float,
    sentiment: float,
    galaxy_score: float,
    decision_engine: Optional[dict],
    telegram_stats: Optional[dict] = None,
    derivatives_data: Optional[dict] = None,
    tokenomics: Optional[dict] = None,
    wallet_concentration: Optional[dict] = None,
    contract_risk: Optional[dict] = None,
    direction_audit: Optional[dict] = None,
) -> dict:
    resolved_direction = (direction_audit or {}).get("resolved_direction", signal_type)
    transition_state = (direction_audit or {}).get("transition_state", "bullish_continuation" if resolved_direction == "pump" else "bearish_breakdown")
    telegram_stats = telegram_stats or {}
    volume_ratio = (volume_24h / market_cap * 100) if market_cap else float((decision_engine or {}).get("volume_market_cap_ratio") or 0)
    venue_count = int((decision_engine or {}).get("venue_count") or 0)
    spread = (decision_engine or {}).get("average_spread_pct")
    mentions = int(telegram_stats.get("mentions") or 0)
    unique_sources = int(telegram_stats.get("unique_sources") or 0)
    bullish_mentions = int(telegram_stats.get("bullish_mentions") or 0)
    bearish_mentions = int(telegram_stats.get("bearish_mentions") or 0)

    social_burst_score = round(min(100, social_volume / 18 + galaxy_score * 0.45 + max(sentiment, 0) * 0.2 + (18 if is_trending else 0)))
    coordination_score = round(min(100, mentions * 11 + unique_sources * 13 + min(telegram_stats.get("avg_score", 0) * 0.25, 20)))
    liquidity_trap_score = round(min(100, max(0, 30 - venue_count * 5) + min(volume_ratio * 1.3, 35) + (18 if spread and spread > 0.7 else 0)))
    early_entry_score = round(max(0, min(100, signal_strength * 0.45 + max(0, 18 - abs(price_change_24h)) * 2 + max(0, 10 - abs(price_change_1h) * 2.2))))

    funding_rate = (derivatives_data or {}).get("funding_rate_pct")
    open_interest = (derivatives_data or {}).get("open_interest_usd")
    top_10_pct = (wallet_concentration or {}).get("top_10_pct")
    owner_pct = (wallet_concentration or {}).get("owner_pct")
    dilution_gap = (tokenomics or {}).get("dilution_gap_pct")
    contract_risk_score = safe_float((contract_risk or {}).get("risk_score"))
    contract_risk_level = ((contract_risk or {}).get("risk_level") or "").lower()
    contract_risk_penalty = 0
    if contract_risk_level == "high" or (contract_risk_score is not None and contract_risk_score <= 45):
        contract_risk_penalty = 10
    elif contract_risk_level == "medium" or (contract_risk_score is not None and contract_risk_score <= 65):
        contract_risk_penalty = 5

    manipulation_score = round(min(
        100,
        signal_strength * 0.28 +
        social_burst_score * 0.18 +
        coordination_score * 0.18 +
        liquidity_trap_score * 0.16 +
        (18 if is_trending else 0) +
        min(volume_ratio, 30) * 0.35
    ))

    if resolved_direction == "pump":
        upside_24h = max(0.0, float(price_change_24h or 0))
        upside_1h = max(0.0, float(price_change_1h or 0))
        pump_extension_score = min(
            28,
            max(0, min(upside_24h, 35) - 20) * 0.35 +
            max(0, min(upside_24h, 90) - 35) * 0.10 +
            max(0, upside_1h - 6) * 0.9 +
            (4 if upside_24h >= 80 and upside_1h >= 12 else 0)
        )
        venue_penalty = 6 if venue_count == 0 else 6 if venue_count <= 2 else 2 if venue_count == 3 else 0
        trend_penalty = 2 if is_trending and upside_24h >= 24 else 0
        coordination_penalty = 2 if coordination_score >= 55 and social_burst_score >= 50 else 0
        open_interest_penalty = 3 if open_interest and open_interest >= 10_000_000 else 0
        derivatives_penalty = 3 if funding_rate is not None and abs(funding_rate) >= 0.03 else 0
        weak_participation_penalty = 8 if volume_ratio < 6 and upside_24h >= 70 else 4 if volume_ratio < 10 and upside_24h >= 40 else 0
        structure_relief = 0
        if signal_strength >= 70 and volume_ratio >= 12:
            structure_relief += 5
        if venue_count >= 4:
            structure_relief += 4
        if spread is not None and spread <= 0.35:
            structure_relief += 3

        dump_risk_score = round(min(
            100,
            6 +
            pump_extension_score +
            (8 if risk_level == "high" else 4 if risk_level == "medium" else 0) +
            venue_penalty +
            weak_participation_penalty +
            (8 if spread and spread > 0.8 else 0) +
            (8 if dilution_gap and dilution_gap >= 40 else 0) +
            (8 if top_10_pct and top_10_pct >= 45 else 0) +
            (6 if owner_pct and owner_pct >= 5 else 0) +
            contract_risk_penalty +
            derivatives_penalty +
            open_interest_penalty +
            trend_penalty +
            coordination_penalty -
            structure_relief
        ))
    else:
        downside_24h = abs(min(0.0, float(price_change_24h or 0)))
        downside_1h = abs(min(0.0, float(price_change_1h or 0)))
        dump_extension_score = min(
            58,
            max(0, downside_24h - 10) * 1.15 +
            max(0, downside_1h - 3) * 2.2 +
            (8 if downside_24h >= 20 and downside_1h >= 5 else 0) +
            (8 if downside_24h >= 35 and downside_1h >= 8 else 0)
        )
        dump_risk_score = round(min(
            100,
            28 +
            dump_extension_score +
            (12 if risk_level == "high" else 6 if risk_level == "medium" else 0) +
            (12 if venue_count <= 2 else 0) +
            (10 if spread and spread > 0.8 else 0) +
            (10 if dilution_gap and dilution_gap >= 40 else 0) +
            (10 if top_10_pct and top_10_pct >= 45 else 0) +
            (8 if owner_pct and owner_pct >= 5 else 0) +
            contract_risk_penalty +
            (8 if funding_rate is not None and abs(funding_rate) >= 0.03 else 0) +
            (8 if open_interest and open_interest >= 10_000_000 else 0)
        ))

    if resolved_direction == "pump":
        if transition_state == "bullish_reversal":
            stage = "reversal attempt"
        elif transition_state == "bullish_pullback":
            stage = "pullback continuation"
        elif dump_risk_score >= 76 and ((max(price_change_24h or 0, 0) >= 120 and max(price_change_1h or 0, 0) >= 15) or (max(price_change_24h or 0, 0) >= 80 and max(price_change_1h or 0, 0) >= 20)):
            stage = "blow-off risk"
        elif coordination_score >= 45 and social_burst_score >= 45:
            stage = "coordinated hype"
        elif early_entry_score >= 65:
            stage = "stealth build"
        elif dump_risk_score >= 52 and signal_strength >= 70:
            stage = "extended breakout"
        else:
            stage = "breakout active"
    else:
        if transition_state == "dead_cat_bounce":
            stage = "countertrend bounce"
        elif dump_risk_score >= 78:
            stage = "unwind active"
        elif coordination_score >= 40:
            stage = "coordinated unwind"
        else:
            stage = "breakdown pressure"

    bullish_only_stages = {"breakout active", "stealth build", "coordinated hype", "extended breakout", "pullback continuation", "reversal attempt", "blow-off risk"}
    bearish_only_stages = {"breakdown pressure", "coordinated unwind", "unwind active", "countertrend bounce"}
    if resolved_direction == "pump" and stage in bearish_only_stages:
        logger.warning("Directional guardrail corrected %s stage from %s to breakout active for pump structure", symbol, stage)
        stage = "breakout active"
    elif resolved_direction == "dump" and stage in bullish_only_stages:
        logger.warning("Directional guardrail corrected %s stage from %s to breakdown pressure for dump structure", symbol, stage)
        stage = "breakdown pressure"

    warning_flags: List[str] = []
    if unique_sources >= 3:
        warning_flags.append(f"{symbol} is being pushed by {unique_sources} Telegram sources in the same 24h window.")
    if social_burst_score >= 65:
        warning_flags.append("Social velocity is elevated, which is typical in coordinated meme runs.")
    if venue_count <= 2:
        warning_flags.append("Few execution venues means exits can get crowded quickly.")
    if top_10_pct and top_10_pct >= 45:
        warning_flags.append("Top wallet concentration is high, so a fast unwind can hit hard.")
    if dilution_gap and dilution_gap >= 40:
        warning_flags.append("Large non-circulating supply increases future sell-pressure risk.")
    if contract_risk_penalty >= 8:
        warning_flags.append("Contract risk is elevated, which weakens trust in the move.")

    risk_term = "reversal risk" if resolved_direction == "pump" else "dump risk"
    summary = (
        f"{symbol} is currently in {stage}: manipulation score {manipulation_score}/100, "
        f"coordination {coordination_score}/100, social burst {social_burst_score}/100, "
        f"and {risk_term} {dump_risk_score}/100."
    )
    if mentions:
        summary += f" Telegram recorded {mentions} relevant mentions across {unique_sources} watched source{'s' if unique_sources != 1 else ''}."

    return {
        "manipulation_score": manipulation_score,
        "coordinated_hype_score": coordination_score,
        "social_burst_score": social_burst_score,
        "liquidity_trap_score": liquidity_trap_score,
        "early_entry_score": early_entry_score,
        "dump_risk_score": dump_risk_score,
        "risk_metric_label": "Reversal Risk" if resolved_direction == "pump" else "Dump Risk",
        "stage": stage,
        "resolved_direction": resolved_direction,
        "transition_state": transition_state,
        "telegram_mentions": mentions,
        "telegram_sources": unique_sources,
        "bullish_mentions": bullish_mentions,
        "bearish_mentions": bearish_mentions,
        "volume_market_cap_ratio": round(volume_ratio, 2),
        "warning_flags": warning_flags,
        "summary": summary,
    }

def build_manipulation_timeline(
    *,
    symbol: str,
    signal_type: str,
    manipulation_profile: dict,
    decision_engine: Optional[dict],
    fear_greed: Optional[dict],
    is_trending: bool,
    social_volume: float,
    galaxy_score: float,
) -> List[dict]:
    events: List[dict] = []
    resolved_direction = manipulation_profile.get("resolved_direction", signal_type)
    mentions = manipulation_profile.get("telegram_mentions", 0)
    sources = manipulation_profile.get("telegram_sources", 0)
    volume_ratio = manipulation_profile.get("volume_market_cap_ratio", 0)
    stage = manipulation_profile.get("stage", "active")
    dump_risk = manipulation_profile.get("dump_risk_score", 0)
    readiness = (decision_engine or {}).get("trade_readiness", "Needs Confirmation")

    if mentions:
        events.append({
            "phase": "Telegram signal",
            "status": "active",
            "tone": "sky",
            "detail": f"{mentions} structured mentions from {sources} watched source{'s' if sources != 1 else ''}.",
        })
    else:
        events.append({
            "phase": "Telegram signal",
            "status": "quiet",
            "tone": "slate",
            "detail": "No strong coordinated Telegram push detected in the recent tracked window.",
        })

    if social_volume or galaxy_score:
        events.append({
            "phase": "Social burst",
            "status": "active" if manipulation_profile.get("social_burst_score", 0) >= 55 else "forming",
            "tone": "violet",
            "detail": f"Social volume {int(social_volume or 0)} with Galaxy Score {int(galaxy_score or 0)}.",
        })

    events.append({
        "phase": "Volume anomaly",
        "status": "active" if volume_ratio >= 15 else "forming",
        "tone": "emerald" if resolved_direction == "pump" else "rose",
        "detail": f"Volume/market-cap ratio is {volume_ratio:.2f}%, which is {'abnormal' if volume_ratio >= 15 else 'building'} for this setup.",
    })

    events.append({
        "phase": "Setup state",
        "status": "active",
        "tone": "amber" if "risk" in stage or "unwind" in stage else "cyan",
        "detail": f"Current stage: {stage}. Execution readiness: {readiness}.",
    })

    if is_trending:
        events.append({
            "phase": "Crowd discovery",
            "status": "active",
            "tone": "amber",
            "detail": f"{symbol} is also appearing in trending discovery lists, which usually pulls in late retail flow.",
        })

    if fear_greed:
        events.append({
            "phase": "Market backdrop",
            "status": "context",
            "tone": "indigo",
            "detail": f"Fear & Greed is {fear_greed.get('value', 50)}/100 ({fear_greed.get('classification', 'Neutral')}).",
        })

    risk_metric_label = manipulation_profile.get("risk_metric_label", "Reversal Risk" if resolved_direction == "pump" else "Dump Risk")
    events.append({
        "phase": risk_metric_label,
        "status": "watch",
        "tone": "red" if dump_risk >= 70 else "orange" if dump_risk >= 50 else "slate",
        "detail": f"Estimated fast-unwind risk is {dump_risk}/100. This is where late entries usually get trapped.",
    })

    return events[:6]

def build_intelligence_alerts(snapshot: Optional[dict], telegram_consensus_payload: Optional[dict] = None) -> List[dict]:
    if not snapshot:
        return []

    alerts: List[dict] = []
    pump_signals = snapshot.get("pump_signals", []) or []
    dump_signals = snapshot.get("dump_signals", []) or []

    for signal in pump_signals[:6]:
        profile = signal.get("manipulation_profile") or {}
        if (profile.get("coordinated_hype_score") or 0) >= 55:
            alerts.append({
                "type": "coordinated_hype",
                "category": "coordination",
                "severity": "high",
                "severity_score": int(profile.get("coordinated_hype_score") or 0),
                "symbol": signal.get("symbol"),
                "signal_type": signal.get("signal_type", "pump"),
                "title": f"{signal.get('symbol')} is showing coordinated hype",
                "detail": f"{profile.get('telegram_mentions', 0)} mentions, {profile.get('telegram_sources', 0)} watched sources, manipulation score {profile.get('manipulation_score', 0)}/100.",
                "action": "Watch for crowding and do not chase thin liquidity.",
                "evidence": [
                    f"Coordination {profile.get('coordinated_hype_score', 0)}/100",
                    f"Telegram mentions {profile.get('telegram_mentions', 0)}",
                ],
            })
        if (profile.get("early_entry_score") or 0) >= 72:
            alerts.append({
                "type": "early_setup",
                "category": "early",
                "severity": "medium",
                "severity_score": int(profile.get("early_entry_score") or 0),
                "symbol": signal.get("symbol"),
                "signal_type": signal.get("signal_type", "pump"),
                "title": f"{signal.get('symbol')} still looks early",
                "detail": f"Early-entry score is {profile.get('early_entry_score', 0)}/100 with stage {profile.get('stage', 'forming')}.",
                "action": "Treat this as a build phase and wait for volume confirmation.",
                "evidence": [
                    f"Early entry {profile.get('early_entry_score', 0)}/100",
                    f"Stage {profile.get('stage', 'forming')}",
                ],
            })
        stage = (profile.get("stage") or "").lower()
        if stage == "blow-off risk" or (profile.get("dump_risk_score") or 0) >= 88:
            alerts.append({
                "type": "exit_risk",
                "category": "exit",
                "severity": "high",
                "severity_score": int(profile.get("dump_risk_score") or 0),
                "symbol": signal.get("symbol"),
                "signal_type": signal.get("signal_type", "pump"),
                "title": f"{signal.get('symbol')} is entering blow-off territory",
                "detail": f"Exit risk is {profile.get('dump_risk_score', 0)}/100. Momentum is stretched enough that a sharp reversal can hit late entries fast.",
                "action": "Reduce chase risk and tighten invalidation immediately.",
                "evidence": [
                    f"Dump risk {profile.get('dump_risk_score', 0)}/100",
                    f"Stage {profile.get('stage', 'blow-off risk')}",
                ],
            })
        elif stage == "extended breakout" or (profile.get("dump_risk_score") or 0) >= 72:
            alerts.append({
                "type": "late_entry_risk",
                "category": "crowding",
                "severity": "medium",
                "severity_score": int(profile.get("dump_risk_score") or 0),
                "symbol": signal.get("symbol"),
                "signal_type": signal.get("signal_type", "pump"),
                "title": f"{signal.get('symbol')} is becoming crowded",
                "detail": f"Stage is {profile.get('stage', 'extended breakout')} with exit risk {profile.get('dump_risk_score', 0)}/100. Treat this like a continuation setup, not a fresh breakout.",
                "action": "Only engage on disciplined pullbacks or with smaller size.",
                "evidence": [
                    f"Dump risk {profile.get('dump_risk_score', 0)}/100",
                    f"Manipulation {profile.get('manipulation_score', 0)}/100",
                ],
            })

    for signal in dump_signals[:4]:
        profile = signal.get("manipulation_profile") or {}
        if (profile.get("dump_risk_score") or 0) >= 72:
            alerts.append({
                "type": "breakdown",
                "category": "breakdown",
                "severity": "high",
                "severity_score": int(profile.get("dump_risk_score") or 0),
                "symbol": signal.get("symbol"),
                "signal_type": signal.get("signal_type", "dump"),
                "title": f"{signal.get('symbol')} is already in unwind mode",
                "detail": f"Stage is {profile.get('stage', 'breakdown')} with dump risk {profile.get('dump_risk_score', 0)}/100.",
                "action": "Do not fade without a fresh reversal signal.",
                "evidence": [
                    f"Stage {profile.get('stage', 'breakdown')}",
                    f"Dump risk {profile.get('dump_risk_score', 0)}/100",
                ],
            })

    for symbol in (telegram_consensus_payload or {}).get("hot_symbols", [])[:3]:
        if symbol.get("unique_sources", 0) >= 3 and symbol.get("mentions", 0) >= 4:
            alerts.append({
                "type": "telegram_consensus",
                "category": "rumor",
                "severity": "medium",
                "severity_score": int(symbol.get("avg_score", 0) or 0),
                "symbol": symbol.get("symbol"),
                "signal_type": "pump" if symbol.get("stance") == "bullish" else "dump" if symbol.get("stance") == "bearish" else "pump",
                "title": f"{symbol.get('symbol')} is spreading across Telegram",
                "detail": f"{symbol.get('mentions', 0)} mentions across {symbol.get('unique_sources', 0)} sources with {symbol.get('stance', 'mixed')} bias.",
                "action": "Treat this as rumor flow until price and liquidity confirm it.",
                "evidence": [
                    f"Mentions {symbol.get('mentions', 0)}",
                    f"Sources {symbol.get('unique_sources', 0)}",
                ],
            })

    severity_rank = {"high": 3, "medium": 2, "low": 1}
    alerts.sort(key=lambda item: severity_rank.get(item.get("severity", "low"), 1), reverse=True)
    return alerts[:8]

async def build_coin_case_replay(symbol: str, limit: int = 10) -> List[dict]:
    cache_key = f"{symbol.upper()}::{limit}"
    cached = get_memory_cache(CASE_REPLAY_CACHE, cache_key, ttl_seconds=180)
    if cached is not None:
        return cached
    snapshots = await db.signal_snapshots.find({
        "$or": [
            {"pump_signals.symbol": symbol},
            {"dump_signals.symbol": symbol},
        ]
    }).sort("timestamp", -1).limit(limit).to_list(length=limit)

    replay: List[dict] = []
    for snap in snapshots:
        timestamp = serialize_datetime(snap.get("timestamp"))
        signals = (snap.get("pump_signals", []) or []) + (snap.get("dump_signals", []) or [])
        for signal in signals:
            if (signal.get("symbol") or "").upper() != symbol:
                continue
            profile = signal.get("manipulation_profile") or {}
            direction_audit = signal.get("direction_audit") or build_direction_audit(
                symbol=(signal.get("symbol") or "").upper(),
                price_change_1h=signal.get("price_change_1h") or 0,
                price_change_24h=signal.get("price_change_24h") or 0,
                price_change_7d=signal.get("price_change_7d") or 0,
                volume_24h=signal.get("volume_24h") or 0,
                market_cap=signal.get("market_cap") or 0,
                signal_type_hint=signal.get("signal_type"),
                signal_strength_hint=signal.get("signal_strength") or 0,
                pump_strength=signal.get("signal_strength") or 0 if signal.get("signal_type") == "pump" else 0,
                dump_strength=signal.get("signal_strength") or 0 if signal.get("signal_type") == "dump" else 0,
                is_trending=bool(signal.get("is_trending")),
            )
            resolved_signal_type = direction_audit.get("resolved_direction") or signal.get("signal_type")
            normalized_stage = normalize_stage_for_direction(
                profile.get("stage", "active"),
                resolved_signal_type,
                direction_audit.get("transition_state"),
            )
            replay.append({
                "timestamp": timestamp,
                "signal_type": resolved_signal_type,
                "stored_signal_type": signal.get("signal_type"),
                "signal_strength": signal.get("signal_strength", 0),
                "price_change_1h": signal.get("price_change_1h", 0),
                "price_change_24h": signal.get("price_change_24h", 0),
                "stage": normalized_stage,
                "manipulation_score": profile.get("manipulation_score", 0),
                "dump_risk_score": profile.get("dump_risk_score", 0),
                "telegram_mentions": profile.get("telegram_mentions", 0),
                "direction_audit": direction_audit,
                "summary": profile.get("summary") or signal.get("reason", ""),
            })
            break

    replay.sort(key=lambda item: item.get("timestamp") or "", reverse=True)
    return set_memory_cache(CASE_REPLAY_CACHE, cache_key, replay)

async def build_recent_case_replays(limit: int = 40) -> List[dict]:
    snapshots = await db.signal_snapshots.find({}).sort("timestamp", -1).limit(max(limit, 12)).to_list(length=max(limit, 12))
    replay: List[dict] = []

    for snap in snapshots:
        timestamp = serialize_datetime(snap.get("timestamp"))
        signals = (snap.get("pump_signals", []) or []) + (snap.get("dump_signals", []) or [])
        for signal in signals:
            profile = signal.get("manipulation_profile") or {}
            direction_audit = signal.get("direction_audit") or build_direction_audit(
                symbol=(signal.get("symbol") or "").upper(),
                price_change_1h=signal.get("price_change_1h") or 0,
                price_change_24h=signal.get("price_change_24h") or 0,
                price_change_7d=signal.get("price_change_7d") or 0,
                volume_24h=signal.get("volume_24h") or 0,
                market_cap=signal.get("market_cap") or 0,
                signal_type_hint=signal.get("signal_type"),
                signal_strength_hint=signal.get("signal_strength") or 0,
                pump_strength=signal.get("signal_strength") or 0 if signal.get("signal_type") == "pump" else 0,
                dump_strength=signal.get("signal_strength") or 0 if signal.get("signal_type") == "dump" else 0,
                is_trending=bool(signal.get("is_trending")),
            )
            if not signal.get("symbol"):
                continue
            signal_type = direction_audit.get("resolved_direction") or signal.get("signal_type", "pump")
            stage = normalize_stage_for_direction(
                profile.get("stage", "active"),
                signal_type,
                direction_audit.get("transition_state"),
            )
            early_score = int(profile.get("early_entry_score") or 0)
            manipulation_score = int(profile.get("manipulation_score") or 0)
            dump_risk_score = int(profile.get("dump_risk_score") or 0)
            telegram_mentions = int(profile.get("telegram_mentions") or 0)

            if signal_type == "pump":
                if stage == "blow-off risk" or dump_risk_score >= 88:
                    replay_type = "Exhaustion Risk"
                    action = "Avoid late entries and tighten exits immediately."
                elif stage == "extended breakout" or dump_risk_score >= 72:
                    replay_type = "Crowded Continuation"
                    action = "Treat this as a continuation trade, not a fresh breakout."
                elif early_score >= 72:
                    replay_type = "Early Build"
                    action = "Wait for volume confirmation before sizing up."
                else:
                    replay_type = "Coordinated Push"
                    action = "Track whether price and liquidity keep confirming the push."
            else:
                if dump_risk_score >= 80:
                    replay_type = "Breakdown Active"
                    action = "Do not fade the unwind without reversal evidence."
                else:
                    replay_type = "Distribution Pressure"
                    action = "Watch whether the unwind broadens or fades."

            evidence = [
                f"Signal {int(signal.get('signal_strength', 0) or 0)}/100",
                f"Manipulation {manipulation_score}/100",
                f"Dump risk {dump_risk_score}/100",
            ]
            if telegram_mentions:
                evidence.append(f"Telegram mentions {telegram_mentions}")
            if signal.get("price_change_24h") is not None:
                evidence.append(f"24h move {float(signal.get('price_change_24h') or 0):+.2f}%")

            replay.append({
                "timestamp": timestamp,
                "symbol": signal.get("symbol"),
                "name": signal.get("name") or signal.get("symbol"),
                "signal_type": signal_type,
                "signal_strength": signal.get("signal_strength", 0),
                "price_change_1h": signal.get("price_change_1h", 0),
                "price_change_24h": signal.get("price_change_24h", 0),
                "stage": stage,
                "manipulation_score": manipulation_score,
                "dump_risk_score": dump_risk_score,
                "telegram_mentions": telegram_mentions,
                "replay_label": "Pump build" if signal_type == "pump" else "Unwind",
                "replay_type": replay_type,
                "action": action,
                "evidence": evidence[:5],
                "direction_audit": direction_audit,
                "summary": profile.get("summary") or signal.get("reason", ""),
            })
            if len(replay) >= limit:
                return replay
    return replay

def build_coin_trend_conclusion(
    *,
    signal_type: str,
    symbol: str,
    price_change_1h: float,
    price_change_24h: float,
    volume_24h: float,
    market_cap: float,
    signal_strength: float,
    direction_audit: Optional[dict] = None,
) -> str:
    volume_ratio = (volume_24h / market_cap * 100) if market_cap else 0
    resolved_direction = (direction_audit or {}).get("resolved_direction", signal_type)
    transition_state = (direction_audit or {}).get("transition_state", "bullish_continuation" if resolved_direction == "pump" else "bearish_breakdown")
    if resolved_direction == "pump":
        if transition_state == "bullish_reversal":
            return (
                f"{symbol} is trying to pivot bullish after prior weakness, but this still looks like a reversal attempt rather than a fully confirmed uptrend. "
                f"To validate a real pump thesis, the next hourly sequence needs to keep printing upside follow-through with volume still supportive."
            )
        if transition_state == "bullish_pullback":
            return (
                f"{symbol} still leans bullish overall, but the current read looks more like a pullback inside an uptrend than a fresh breakout from the base. "
                f"If buyers keep defending the pullback and turnover stays firm, the upside continuation thesis remains intact."
            )
        if price_change_1h > 0 and price_change_24h > 0 and volume_ratio >= 20:
            return (
                f"{symbol} remains in a constructive short-term uptrend, with both hourly and daily momentum aligned and turnover still supportive. "
                f"As long as volume stays elevated and the signal strength remains near {int(signal_strength)}%, this looks more like active continuation than random noise."
            )
        return (
            f"{symbol} still has a bullish signal, but the setup needs stronger follow-through to confirm a clean continuation. "
            f"Watch whether volume holds and whether the next hourly candles keep building above the recent move."
        )
    if transition_state == "dead_cat_bounce":
        return (
            f"{symbol} still resolves bearish even though there may be a short-lived bounce on the smallest window. "
            f"With daily structure already broken, this reads more like a dead-cat bounce inside a dump than a true bullish reversal."
        )
    if price_change_1h < 0 and price_change_24h < 0 and volume_ratio >= 20:
        return (
            f"{symbol} is still leaning bearish, with downside pressure visible across both the 1h and 24h windows and enough volume to validate the move. "
            f"If sellers keep control, the current dump signal looks like continuation pressure rather than a one-candle flush."
        )
    return (
        f"{symbol} has a bearish read, but this move still needs confirmation from sustained downside momentum and persistent volume. "
        f"If selling pressure fades quickly, the setup can turn into a short-lived spike rather than a full trend leg lower."
    )

def get_coin_exchanges(symbol: str, coin_id: str, platform: Optional[str] = None, contract_address: Optional[str] = None) -> List[dict]:
    return build_market_venues(symbol, coin_id, platform, contract_address)

async def build_coin_pump_engine_payload(platform_id: Optional[str], contract_address: Optional[str]) -> dict:
    if not platform_id or not contract_address:
        return {
            "available": False,
            "reason": "missing_contract_context",
            "message": "Pump engine needs both platform_id and contract_address.",
        }

    try:
        pipeline = get_pump_engine_pipeline()
        analysis = await pipeline.run_from_token(
            chain=platform_id,
            token_address=contract_address,
            use_ai_judge=True,
        )
        return {
            "available": True,
            "analysis": analysis,
        }
    except PumpEngineError as exc:
        logger.info("Pump engine unavailable for %s/%s: %s", platform_id, contract_address, exc.code)
        return {
            "available": False,
            "reason": exc.code,
            "message": exc.message,
        }
    except Exception as exc:
        logger.warning("Pump engine integration error for %s/%s: %s", platform_id, contract_address, exc)
        return {
            "available": False,
            "reason": "PUMP_ENGINE_INTERNAL_ERROR",
            "message": "Pump engine could not analyze this asset right now.",
        }

@app.get("/api/crypto/coin/{symbol}")
async def get_coin_detail(symbol: str, type: str = "pump", refresh: bool = False):
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
    
    snapshot_ts = snapshot.get("timestamp") if snapshot else None
    snapshot_key = snapshot_ts.isoformat() if isinstance(snapshot_ts, datetime) else str(snapshot_ts)
    detail_cache_key = f"{symbol}::{snapshot_key}"
    if not refresh:
        cached_detail = get_memory_cache(COIN_DETAIL_CACHE, detail_cache_key, ttl_seconds=180)
        if cached_detail is not None:
            cached_exchanges = cached_detail.get("exchanges") or []
            cached_preferred_venue = cached_detail.get("preferred_venue") or ((cached_detail.get("decision_engine") or {}).get("preferred_venue"))
            if cached_exchanges or cached_preferred_venue:
                return api_ok(cached_detail)

    # Get CoinGecko market data
    market_data = {}
    try:
        preferred_name = signal.get("name") if signal else None
        resolved_coin_id = (
            market_data.get("id")
            or (signal.get("id") if signal else None)
            or resolve_coingecko_coin_id(symbol, preferred_name=preferred_name)
        )
        market_cache_key = f"{resolved_coin_id or symbol.lower()}::market"
        cached_market = None if refresh else get_memory_cache(COIN_MARKET_CACHE, market_cache_key, ttl_seconds=90)
        if cached_market is not None:
            market_data = cached_market
        else:
            market_url = "https://api.coingecko.com/api/v3/coins/markets"
            mr = requests.get(market_url, params={
                "vs_currency": "usd", "ids": resolved_coin_id,
                "price_change_percentage": "1h,24h,7d"
            }, headers=CG_HEADERS, timeout=15)
            if mr.status_code == 200 and mr.json():
                market_data = mr.json()[0]
                set_memory_cache(COIN_MARKET_CACHE, market_cache_key, market_data)
    except Exception as e:
        logger.error(f"CoinGecko detail error: {e}")
    
    price = market_data.get("current_price") or (signal.get("price") if signal else 0) or 0
    price_change_1h = market_data.get("price_change_percentage_1h_in_currency") or (signal.get("price_change_1h") if signal else 0) or 0
    price_change_24h = market_data.get("price_change_percentage_24h") or (signal.get("price_change_24h") if signal else 0) or 0
    price_change_7d = market_data.get("price_change_percentage_7d_in_currency") or 0
    volume_24h = market_data.get("total_volume") or (signal.get("volume_24h") if signal else 0) or 0
    market_cap = market_data.get("market_cap") or 0
    image = market_data.get("image") or (signal.get("image") if signal else "")
    coin_id = market_data.get("id") or (signal.get("id") if signal else None) or resolved_coin_id or symbol.lower()
    
    # VALIDATION: If no valid data found, return 404
    if price <= 0 and not signal:
        raise HTTPException(
            status_code=404, 
            detail=api_err(f"Coin '{symbol}' not found or has no valid market data. It may be delisted or not supported.", "COIN_NOT_FOUND")
        )
    
    # If coin has invalid data (price 0, market cap < $100k), warn user
    is_invalid_coin = price <= 0 or market_cap < 100000
    
    # Get chart, social, derivatives, and replay data in parallel for the first paint.
    social_asset_name = market_data.get("name") or (signal.get("name") if signal else None)
    (
        chart_data,
        extended_details,
        market_microstructure,
        derivatives_data,
        social_bundle,
        case_replay,
    ) = await asyncio.gather(
        asyncio.to_thread(get_coin_chart_data, coin_id, 1),
        asyncio.to_thread(get_coin_extended_details, coin_id),
        asyncio.to_thread(get_binance_orderbook_metrics, symbol),
        asyncio.to_thread(get_binance_derivatives_metrics, symbol),
        asyncio.to_thread(get_social_intelligence_bundle, symbol, social_asset_name, 3),
        build_coin_case_replay(symbol, limit=10),
    )
    lunarcrush_topic, lunarcrush_creators = social_bundle

    platform_id, contract_address = pick_primary_contract(extended_details)
    tokenomics = build_tokenomics_profile(extended_details) if extended_details else {
        "circulating_supply": None,
        "total_supply": None,
        "max_supply": None,
        "fdv_usd": None,
        "market_cap_usd": market_cap,
        "circulating_ratio_pct": None,
        "dilution_gap_pct": None,
        "unlock_risk": "Unknown",
        "warnings": [],
        "source": "CoinGecko",
    }
    holder_distribution, goplus_security, goplus_rugpull, exchanges, pump_engine = await asyncio.gather(
        asyncio.to_thread(get_holder_distribution, platform_id, contract_address),
        asyncio.to_thread(get_goplus_security, platform_id, contract_address),
        asyncio.to_thread(get_goplus_rugpull, platform_id, contract_address),
        asyncio.to_thread(get_coin_exchanges, symbol, coin_id, platform_id, contract_address),
        build_coin_pump_engine_payload(platform_id, contract_address),
    )
    wallet_concentration = build_holder_concentration_profile(holder_distribution, goplus_security)
    wallet_cluster_intelligence = build_wallet_cluster_intelligence(holder_distribution, goplus_security)
    contract_risk = build_contract_risk_profile(platform_id, contract_address, goplus_security, goplus_rugpull)
    asset_identity = build_asset_identity_profile(
        symbol=symbol,
        coin_id=coin_id,
        name=market_data.get("name") or (signal.get("name") if signal else symbol),
        market_cap=market_cap,
        details=extended_details,
        venues=exchanges,
    )
    telegram_stats_map = await get_recent_telegram_signal_map(hours=24)
    telegram_stats = telegram_stats_map.get(symbol, {})
    requested_signal_type = type
    stored_signal_type = (signal.get("signal_type") if signal else None) or None
    current_direction_audit = build_direction_audit(
        symbol=symbol,
        price_change_1h=price_change_1h,
        price_change_24h=price_change_24h,
        price_change_7d=price_change_7d,
        volume_24h=volume_24h,
        market_cap=market_cap,
        signal_type_hint=stored_signal_type or requested_signal_type,
        signal_strength_hint=signal.get("signal_strength", 0) if signal else 0,
        pump_strength=signal.get("signal_strength", 0) if signal and stored_signal_type == "pump" else 0,
        dump_strength=signal.get("signal_strength", 0) if signal and stored_signal_type == "dump" else 0,
        is_trending=bool(signal.get("is_trending")) if signal else False,
    )
    resolved_signal_type = current_direction_audit.get("resolved_direction", stored_signal_type or requested_signal_type)
    if signal and stored_signal_type and resolved_signal_type != stored_signal_type:
        logger.info(
            "Coin detail direction flip for %s: stored=%s resolved=%s requested=%s 1h=%+.2f 24h=%+.2f 7d=%+.2f transition=%s",
            symbol,
            stored_signal_type,
            resolved_signal_type,
            requested_signal_type,
            current_direction_audit.get("price_change_1h", 0.0),
            current_direction_audit.get("price_change_24h", 0.0),
            current_direction_audit.get("price_change_7d", 0.0),
            current_direction_audit.get("transition_state", "unknown"),
        )
    
    analysis_sections: List[dict] = []
    ai_analysis = ""
    trend_conclusion = ""
    if signal:
        analysis_sections = build_coin_analysis_sections(
            symbol=symbol,
            signal_type=resolved_signal_type,
            price=price,
            price_change_1h=price_change_1h,
            price_change_24h=price_change_24h,
            price_change_7d=price_change_7d,
            volume_24h=volume_24h,
            market_cap=market_cap,
            signal_strength=signal.get("signal_strength", 0),
            confidence=signal.get("confidence", "medium"),
            risk_level=signal.get("risk_level", "medium"),
            reason=signal.get("reason", ""),
            social_volume=signal.get("social_volume", 0) or 0,
            galaxy_score=signal.get("galaxy_score", 0) or 0,
            direction_audit=current_direction_audit,
        )
        ai_analysis = "\n\n".join(section["body"] for section in analysis_sections)
        trend_conclusion = build_coin_trend_conclusion(
            signal_type=resolved_signal_type,
            symbol=symbol,
            price_change_1h=price_change_1h,
            price_change_24h=price_change_24h,
            volume_24h=volume_24h,
            market_cap=market_cap,
            signal_strength=signal.get("signal_strength", 0),
            direction_audit=current_direction_audit,
        )
        if GEMINI_API_KEY and not looks_like_placeholder(GEMINI_API_KEY, "GEMINI_API_KEY"):
            try:
                chat = genai.GenerativeModel(
                    model_name="gemini-2.0-flash",
                    system_instruction="You are a crypto technical analysis expert. You respond in English only, concisely and directly. Never reply in Romanian or any other language."
                )
                prompt = f"""Improve this structured coin analysis without changing the facts. Keep it precise, practical, and in English only.
Do not include Romanian or any bilingual output.

Coin: {symbol}
Signal type: {resolved_signal_type}
Base analysis:
{ai_analysis}

Trend conclusion:
{trend_conclusion}

Respond with JSON:
{{
  "analysis": "4 concise paragraphs separated logically",
  "trend": "2 concise sentences"
}}"""
                resp = await asyncio.to_thread(lambda: chat.generate_content(prompt).text)
                import json as json_lib
                resp_clean = resp.strip()
                if resp_clean.startswith("```"):
                    resp_clean = "\n".join([line for line in resp_clean.split("\n") if not line.startswith("```")])
                detail_json = json_lib.loads(resp_clean)
                ai_analysis = detail_json.get("analysis", ai_analysis) or ai_analysis
                trend_conclusion = detail_json.get("trend", trend_conclusion) or trend_conclusion
                ai_paragraphs = [part.strip() for part in ai_analysis.split("\n\n") if part.strip()]
                if ai_paragraphs:
                    titles = ["Momentum Setup", "Liquidity & Participation", "Signal Read", "Risk Watch"]
                    analysis_sections = [
                        {"title": titles[index] if index < len(titles) else f"Section {index + 1}", "body": paragraph}
                        for index, paragraph in enumerate(ai_paragraphs)
                    ]
            except Exception as e:
                err_text = str(e)
                if "RESOURCE_EXHAUSTED" in err_text or "quota" in err_text.lower():
                    logger.warning("Gemini quota exhausted during coin detail refinement - keeping deterministic analysis")
                elif "API_KEY_INVALID" in err_text or "api key not valid" in err_text.lower():
                    logger.warning("Gemini key invalid during coin detail refinement - keeping deterministic analysis")
                else:
                    logger.error(f"Coin detail AI error: {e}")
    else:
        analysis_sections = [
            {
                "title": "No Active Signal",
                "body": f"No active PumpRadar signal was recorded for {symbol} in the latest hourly snapshot. The coin may still be tradable, but there is no current high-conviction pump or dump setup from the model.",
            },
            {
                "title": "What To Watch",
                "body": "Focus on fresh volume expansion, short-term price acceleration, and whether the asset starts appearing in new trending lists before acting on it.",
            },
        ]
        ai_analysis = "\n\n".join(section["body"] for section in analysis_sections)
        trend_conclusion = "There is no live signal confirmation yet, so this is a watchlist asset rather than an actionable setup right now."
    
    decision_engine = build_signal_execution_plan(
        signal_type=resolved_signal_type,
        symbol=symbol,
        price=price,
        price_change_1h=price_change_1h,
        price_change_24h=price_change_24h,
        price_change_7d=price_change_7d,
        volume_24h=volume_24h,
        market_cap=market_cap,
        signal_strength=signal.get("signal_strength", 0) if signal else 0,
        confidence=signal.get("confidence", "medium") if signal else "medium",
        risk_level=signal.get("risk_level", "medium") if signal else "medium",
        venues=exchanges,
        direction_audit=current_direction_audit,
    )
    manipulation_profile = build_manipulation_profile(
        signal_type=resolved_signal_type,
        symbol=symbol,
        price_change_1h=price_change_1h,
        price_change_24h=price_change_24h,
        price_change_7d=price_change_7d,
        volume_24h=volume_24h,
        market_cap=market_cap,
        signal_strength=signal.get("signal_strength", 0) if signal else 0,
        risk_level=signal.get("risk_level", "medium") if signal else "medium",
        is_trending=bool(signal.get("is_trending")) if signal else False,
        social_volume=signal.get("social_volume", 0) if signal else 0,
        sentiment=signal.get("sentiment", 0) if signal else 0,
        galaxy_score=signal.get("galaxy_score", 0) if signal else 0,
        decision_engine=decision_engine,
        telegram_stats=telegram_stats,
        derivatives_data=derivatives_data,
        tokenomics=tokenomics,
        wallet_concentration=wallet_concentration,
        contract_risk=contract_risk,
        direction_audit=current_direction_audit,
    )
    rugpull_profile = build_rugpull_profile(
        asset_identity=asset_identity,
        tokenomics=tokenomics,
        wallet_cluster_intelligence=wallet_cluster_intelligence,
        contract_risk=contract_risk,
        venues=exchanges,
        manipulation_profile=manipulation_profile,
    )
    manipulation_timeline = build_manipulation_timeline(
        symbol=symbol,
        signal_type=resolved_signal_type,
        manipulation_profile=manipulation_profile,
        decision_engine=decision_engine,
        fear_greed=snapshot.get("fear_greed") if snapshot else None,
        is_trending=bool(signal.get("is_trending")) if signal else False,
        social_volume=signal.get("social_volume", 0) if signal else 0,
        galaxy_score=signal.get("galaxy_score", 0) if signal else 0,
    )
    cross_platform = build_coin_cross_platform_consensus(
        symbol=symbol,
        signal_type=resolved_signal_type,
        signal_strength=signal.get("signal_strength", 0) if signal else 0,
        manipulation_profile=manipulation_profile,
        decision_engine=decision_engine,
        lunar_topic=lunarcrush_topic,
        lunar_creators=lunarcrush_creators,
        is_trending=bool(signal.get("is_trending")) if signal else False,
    )
    signal_sources = (signal.get("signal_sources") if signal else None) or build_signal_source_stack(
        symbol=symbol,
        price_change_1h=price_change_1h,
        price_change_24h=price_change_24h,
        vol_mcap_ratio=(volume_24h / market_cap * 100) if market_cap else 0,
        is_trending=bool(signal.get("is_trending")) if signal else False,
        telegram_mentions=telegram_stats.get("mentions", 0) or 0,
        telegram_sources=telegram_stats.get("unique_sources", 0) or telegram_stats.get("telegram_sources", 0) or 0,
        bullish_mentions=telegram_stats.get("bullish_mentions", 0) or 0,
        bearish_mentions=telegram_stats.get("bearish_mentions", 0) or 0,
        telegram_avg_score=telegram_stats.get("avg_score", 0) or 0,
        social_volume=signal.get("social_volume", 0) if signal else 0,
        galaxy_score=signal.get("galaxy_score", 0) if signal else 0,
        sentiment=signal.get("sentiment", 0) if signal else 0,
        lunar_mentions=(lunarcrush_topic or {}).get("mentions_24h", 0) or 0,
        lunar_creators=(lunarcrush_topic or {}).get("creators_24h", 0) or 0,
        lunar_interactions=(lunarcrush_topic or {}).get("engagements_24h", 0) or 0,
        lunar_dominance=(lunarcrush_topic or {}).get("social_dominance_pct", 0) or 0,
        venue_count=decision_engine.get("venue_count", 0) or len(exchanges),
        preferred_venue=decision_engine.get("preferred_venue"),
    )
    payload = {
        "symbol": symbol,
        "name": market_data.get("name") or (signal.get("name") if signal else symbol),
        "image": image,
        "price": price,
        "price_change_1h": price_change_1h,
        "price_change_24h": price_change_24h,
        "price_change_7d": price_change_7d,
        "volume_24h": volume_24h,
        "market_cap": market_cap,
        "signal_type": resolved_signal_type,
        "requested_signal_type": requested_signal_type,
        "stored_signal_type": stored_signal_type,
        "signal_strength": signal.get("signal_strength", 0) if signal else 0,
        "reason": signal.get("reason", "") if signal else "",
        "confidence": signal.get("confidence", "medium") if signal else "medium",
        "risk_level": signal.get("risk_level", "medium") if signal else "medium",
        "direction_audit": current_direction_audit,
        "ai_analysis": ai_analysis,
        "analysis_sections": analysis_sections,
        "trend_conclusion": trend_conclusion,
        "decision_engine": decision_engine,
        "preferred_venue": decision_engine.get("preferred_venue"),
        "signal_sources": signal_sources,
        "source_summary": signal_sources.get("summary"),
        "manipulation_profile": manipulation_profile,
        "manipulation_timeline": manipulation_timeline,
        "cross_platform_consensus": cross_platform,
        "case_replay": case_replay,
        "market_microstructure": market_microstructure,
        "derivatives_data": derivatives_data,
        "tokenomics": tokenomics,
        "wallet_concentration": wallet_concentration,
        "wallet_cluster_intelligence": wallet_cluster_intelligence,
        "contract_risk": contract_risk,
        "pump_engine": pump_engine,
        "asset_identity": asset_identity,
        "rugpull_profile": rugpull_profile,
        "lunarcrush_topic": lunarcrush_topic,
        "lunarcrush_creators": lunarcrush_creators,
        "platform_id": platform_id,
        "contract_address": contract_address,
        "exchanges": exchanges,
        "chart_data": chart_data,
    }

    return api_ok(set_memory_cache(COIN_DETAIL_CACHE, detail_cache_key, payload))

# ─────────────────────────────────────────────
# TELEGRAM SIGNALS
# ─────────────────────────────────────────────
async def require_admin(user=Depends(get_current_user)):
    if "admin" not in user.get("roles", []):
        raise HTTPException(status_code=403, detail=api_err("Admin access required", "FORBIDDEN"))
    return user

TELEGRAM_HORIZONS = {
    "one_hour": {"hours": 1, "threshold_pct": 3.0},
    "four_hour": {"hours": 4, "threshold_pct": 5.0},
    "twenty_four_hour": {"hours": 24, "threshold_pct": 8.0},
}

TELEGRAM_SOURCE_STRONG_KEYWORDS = (
    "pump", "dump", "signal", "signals", "call", "calls", "alpha", "gem", "gems",
    "whale", "sniper", "entry", "target", "tp", "sl", "trade", "trading",
)
TELEGRAM_SOURCE_MEDIUM_KEYWORDS = (
    "crypto", "coin", "token", "defi", "dex", "cex", "blockchain", "chain", "network",
    "protocol", "binance", "bybit", "okx", "kucoin", "announcement", "news",
    "official", "ecosystem", "market",
)
TELEGRAM_SOURCE_NEGATIVE_KEYWORDS = (
    "hot girls", "girls", "dating", "escort", "xxx", "adult", "casino", "betting",
)

TELEGRAM_SPAM_PHRASES = (
    "rewards pool", "reward pool", "giveaway", "airdrop", "claim now", "verify your holdings",
    "copy and open", "open atoshi", "updated to the latest version", "latest version",
    "referral", "invite friends", "earn more", "bonus", "join now", "register now",
    "withdraw", "withdrawal", "balance", "contest", "sweepstake", "launch is live",
    "rewards are live", "pool is live", "share your story", "inspire the community",
    "follow us", "retweet", "like and share", "promo code", "promotion", "marketing",
)
TELEGRAM_TRADE_KEYWORDS = (
    "entry", "entries", "buy zone", "accumulate", "target", "targets", "take profit", "tp1", "tp2", "tp3",
    "stop loss", "sl", "breakout", "breakdown", "resistance", "support", "spot entry",
    "leverage", "long", "short", "open long", "open short", "risk reward", "rr",
    "ape", "scalp", "send", "flush", "send it", "watchlist",
)
TELEGRAM_DIRECTION_KEYWORDS = (
    "pump", "dump", "bullish", "bearish", "long", "short", "buy", "sell", "moon", "rug",
    "ape", "send", "flush", "nuke",
)

class TelegramSourceUpsertRequest(BaseModel):
    source_name: str
    source_handle: Optional[str] = None
    source_type: str = "group"
    invite_link: Optional[str] = None
    enabled: bool = True
    notes: Optional[str] = None

class TelegramSignalIngestRequest(BaseModel):
    source_name: str
    source_handle: Optional[str] = None
    source_type: str = "group"
    message_text: str
    message_id: Optional[str] = None
    message_url: Optional[str] = None
    posted_at: Optional[str] = None
    source_id: Optional[str] = None

class TelegramManualOutcomeRequest(BaseModel):
    return_1h_pct: Optional[float] = None
    return_4h_pct: Optional[float] = None
    return_24h_pct: Optional[float] = None

class TelegramAuthCodeRequest(BaseModel):
    code: str
    password: Optional[str] = None

def get_telegram_session_dir() -> str:
    session_dir = os.path.join(os.path.dirname(__file__), ".telegram_sessions")
    os.makedirs(session_dir, exist_ok=True)
    return session_dir

def get_telegram_session_path() -> str:
    return os.path.join(get_telegram_session_dir(), TELEGRAM_SESSION_NAME)

async def create_telegram_client() -> Any:
    if not TelegramClient:
        return None
    client = TelegramClient(get_telegram_session_path(), int(TELEGRAM_API_ID), TELEGRAM_API_HASH)
    await client.connect()
    return client

async def get_enabled_telegram_sources() -> List[dict]:
    whitelisted = await db.telegram_sources.find({"enabled": True, "manual_whitelist": True}).to_list(length=500)
    if whitelisted:
        return whitelisted
    return await db.telegram_sources.find({"enabled": True}).to_list(length=500)

async def enforce_manual_whitelist_sources() -> None:
    has_whitelist = await db.telegram_sources.count_documents({"manual_whitelist": True}, limit=1)
    if not has_whitelist:
        return
    await db.telegram_sources.update_many(
        {"manual_whitelist": {"$ne": True}},
        {"$set": {"enabled": False}},
    )
    await db.telegram_sources.update_many(
        {"manual_whitelist": True},
        {"$set": {"enabled": True}},
    )

def score_telegram_source_relevance(source_name: Optional[str], source_handle: Optional[str]) -> tuple[int, str]:
    handle = normalize_telegram_handle(source_handle) or ""
    haystack = " ".join(part for part in [(source_name or "").lower().strip(), handle] if part).strip()
    if not haystack:
        return 0, "No source name available"
    if any(keyword in haystack for keyword in TELEGRAM_SOURCE_NEGATIVE_KEYWORDS):
        return 0, "Filtered as irrelevant / non-crypto"

    score = 0
    reasons: List[str] = []
    strong_hits = sorted({keyword for keyword in TELEGRAM_SOURCE_STRONG_KEYWORDS if keyword in haystack})
    medium_hits = sorted({keyword for keyword in TELEGRAM_SOURCE_MEDIUM_KEYWORDS if keyword in haystack})

    if strong_hits:
        score += min(70, 25 + len(strong_hits) * 12)
        reasons.append(f"signal keywords: {', '.join(strong_hits[:4])}")
    if medium_hits:
        score += min(35, 10 + len(medium_hits) * 6)
        reasons.append(f"crypto keywords: {', '.join(medium_hits[:4])}")
    if "official" in haystack and "announcement" in haystack:
        score += 8
        reasons.append("official announcement source")
    if any(exchange in haystack for exchange in ("binance", "bybit", "okx", "kucoin")):
        score += 8
        reasons.append("major exchange source")

    score = min(100, score)
    if score == 0:
        return 0, "No clear crypto or signal relevance"
    return score, "; ".join(reasons)

def should_enable_telegram_source(source_name: Optional[str], source_handle: Optional[str]) -> tuple[bool, int, str]:
    score, reason = score_telegram_source_relevance(source_name, source_handle)
    return score >= 28, score, reason

def matches_telegram_source(source: dict, chat_title: Optional[str], chat_username: Optional[str]) -> bool:
    source_handle = normalize_telegram_handle(source.get("source_handle"))
    source_name = (source.get("source_name") or "").strip().lower()
    username = normalize_telegram_handle(chat_username)
    title = (chat_title or "").strip().lower()
    return bool(
        (source_handle and username and source_handle == username) or
        (source_name and title and source_name == title)
    )

def is_telegram_collectable_chat(chat: Any) -> bool:
    if not chat:
        return False
    if getattr(chat, "broadcast", False):
        return True
    if getattr(chat, "megagroup", False):
        return True
    if getattr(chat, "gigagroup", False):
        return True
    title = getattr(chat, "title", None)
    return bool(title)

def build_telegram_source_type(chat: Any) -> str:
    if getattr(chat, "broadcast", False):
        return "channel"
    return "group"

def build_telegram_source_payload(chat: Any) -> Optional[TelegramSourceUpsertRequest]:
    if not is_telegram_collectable_chat(chat):
        return None
    source_name = getattr(chat, "title", None) or getattr(chat, "username", None)
    if not source_name:
        return None
    source_handle = getattr(chat, "username", None)
    enabled, _, reason = should_enable_telegram_source(source_name, source_handle)
    return TelegramSourceUpsertRequest(
        source_name=source_name.strip(),
        source_handle=source_handle,
        source_type=build_telegram_source_type(chat),
        enabled=enabled,
        notes=reason,
    )

async def sync_telegram_dialog_sources(client: Any) -> int:
    if not client:
        return 0
    synced = 0
    async for dialog in client.iter_dialogs(limit=300):
        payload = build_telegram_source_payload(dialog.entity)
        if not payload:
            continue
        await upsert_telegram_source(payload)
        synced += 1
    await enforce_manual_whitelist_sources()
    return synced

def telegram_runtime_status() -> dict:
    import importlib.util

    telethon_installed = importlib.util.find_spec("telethon") is not None
    session_path = get_telegram_session_path()
    session_exists = os.path.exists(session_path) or os.path.exists(f"{session_path}.session")
    authorized = bool(telegram_auth_state.get("authorized"))
    ready = bool(TELEGRAM_API_ID and TELEGRAM_API_HASH and TELEGRAM_PHONE and telethon_installed and TELEGRAM_LIVE_ENABLED)
    reasons = []
    if not TELEGRAM_API_ID:
        reasons.append("Missing TELEGRAM_API_ID")
    if not TELEGRAM_API_HASH:
        reasons.append("Missing TELEGRAM_API_HASH")
    if not TELEGRAM_PHONE:
        reasons.append("Missing TELEGRAM_PHONE")
    if not telethon_installed:
        reasons.append("Telethon is not installed yet")
    if not TELEGRAM_LIVE_ENABLED:
        reasons.append("TELEGRAM_LIVE_ENABLED is false")
    if ready and not session_exists:
        reasons.append("Telegram session is not authorized yet")
    return {
        "ready": ready and session_exists and authorized,
        "telethon_installed": telethon_installed,
        "api_id_configured": bool(TELEGRAM_API_ID),
        "api_hash_configured": bool(TELEGRAM_API_HASH),
        "phone_configured": bool(TELEGRAM_PHONE),
        "live_enabled": TELEGRAM_LIVE_ENABLED,
        "session_name": TELEGRAM_SESSION_NAME,
        "session_exists": session_exists,
        "authorized": authorized,
        "reasons": reasons,
    }

def serialize_datetime(value: Any) -> Optional[str]:
    if not value:
        return None
    if isinstance(value, datetime):
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.isoformat()
    if isinstance(value, str):
        return value
    return None

def normalize_telegram_handle(handle: Optional[str]) -> Optional[str]:
    if not handle:
        return None
    value = handle.strip()
    if value.startswith("https://t.me/"):
        value = value.split("https://t.me/", 1)[1]
    if value.startswith("@"):
        value = value[1:]
    return value.lower() or None

def average(values: List[float]) -> float:
    nums = [float(v) for v in values if v is not None]
    return round(sum(nums) / len(nums), 2) if nums else 0.0

def parse_numeric_range(raw: str) -> Optional[dict]:
    if not raw:
        return None
    normalized = raw.replace(",", ".")
    values = re.findall(r"\d+(?:\.\d+)?", normalized)
    if not values:
        return None
    if len(values) == 1:
        value = float(values[0])
        return {"low": value, "high": value}
    low = float(values[0])
    high = float(values[1])
    return {"low": min(low, high), "high": max(low, high)}

def parse_numeric_list(raw: str) -> List[float]:
    if not raw:
        return []
    return [float(item.replace(",", ".")) for item in re.findall(r"\d+(?:\.\d+)?", raw)]

def infer_chain_from_message(message: str, contract_address: Optional[str]) -> Optional[str]:
    lower = (message or "").lower()
    if contract_address:
        if contract_address.startswith("0x"):
            if any(keyword in lower for keyword in ["bsc", "binance smart chain", "bnb chain"]):
                return "binance-smart-chain"
            if "base" in lower:
                return "base"
            if "arb" in lower or "arbitrum" in lower:
                return "arbitrum-one"
            return "ethereum"
        if re.fullmatch(r"[1-9A-HJ-NP-Za-km-z]{32,44}", contract_address):
            return "solana"
        if re.fullmatch(r"[a-z]{2,15}1[0-9a-z]{20,90}", contract_address):
            if contract_address.startswith("akash"):
                return "akash"
            return "cosmos"
    if "solana" in lower or " raydium" in lower or " jupiter" in lower:
        return "solana"
    if "ethereum" in lower or " uniswap" in lower:
        return "ethereum"
    if "base" in lower:
        return "base"
    if "arbitrum" in lower:
        return "arbitrum-one"
    if "bsc" in lower or "bnb chain" in lower:
        return "binance-smart-chain"
    if "akash" in lower:
        return "akash"
    return None

def parse_telegram_signal_message(message_text: str) -> dict:
    text = (message_text or "").strip()
    upper = text.upper()
    lower = text.lower()

    symbol = None
    symbol_candidates = re.findall(r"\$([A-Z0-9]{2,15})", upper)
    if not symbol_candidates:
        symbol_candidates = [match[0] for match in re.findall(r"\b([A-Z0-9]{2,15})/(USDT|USD|BTC|ETH|SOL|BNB)\b", upper)]
    if not symbol_candidates:
        symbol_candidates = re.findall(r"#([A-Z0-9]{2,15})", upper)
    if not symbol_candidates:
        symbol_candidates = re.findall(r"\b[A-Z][A-Z0-9]{1,14}\b", upper)
    blacklist = {"USDT", "USD", "BTC", "ETH", "SOL", "BNB", "LONG", "SHORT", "ENTRY", "TARGET", "STOP", "BUY", "SELL"}
    for candidate in symbol_candidates:
        if candidate not in blacklist:
            symbol = candidate
            break

    direction = None
    if any(keyword in lower for keyword in ["dump", "short", "sell", "rug", "bearish"]):
        direction = "dump"
    elif any(keyword in lower for keyword in ["pump", "long", "buy", "moon", "bullish"]):
        direction = "pump"

    contract_address = None
    contract_patterns = [
        r"\b0x[a-fA-F0-9]{40}\b",
        r"\b[a-z]{2,15}1[0-9a-z]{20,90}\b",
        r"\b[1-9A-HJ-NP-Za-km-z]{32,44}\b",
    ]
    for pattern in contract_patterns:
        match = re.search(pattern, text)
        if match:
            contract_address = match.group(0)
            break

    entry_match = re.search(r"(?:entry|buy(?:\s+zone)?|accumulate)\s*[:\-]?\s*([0-9.,\-\s]+)", lower, re.IGNORECASE)
    stop_match = re.search(r"(?:stop(?:\s+loss)?|sl)\s*[:\-]?\s*([0-9.,]+)", lower, re.IGNORECASE)
    target_match = re.search(r"(?:targets?|take profit|tp(?:1|2|3)?)\s*[:\-]?\s*([0-9.,\-\s/]+)", lower, re.IGNORECASE)

    entry_zone = parse_numeric_range(entry_match.group(1)) if entry_match else None
    stop_values = parse_numeric_list(stop_match.group(1)) if stop_match else []
    target_values = parse_numeric_list(target_match.group(1)) if target_match else []

    chain = infer_chain_from_message(text, contract_address)
    confidence_parts = [
        25 if symbol else 0,
        20 if direction else 0,
        20 if contract_address else 0,
        15 if entry_zone else 0,
        10 if stop_values else 0,
        10 if target_values else 0,
    ]
    parser_confidence = min(100, sum(confidence_parts))
    spam_hits = sorted({phrase for phrase in TELEGRAM_SPAM_PHRASES if phrase in lower})
    trade_hits = sorted({phrase for phrase in TELEGRAM_TRADE_KEYWORDS if phrase in lower})
    direction_hits = sorted({phrase for phrase in TELEGRAM_DIRECTION_KEYWORDS if phrase in lower})
    short_call_detected = bool(
        symbol and (
            trade_hits or
            direction_hits or
            contract_address or
            re.search(rf"\b{re.escape(symbol)}\b\s*(?:now|soon|spot|entry|breakout|breakdown|send|ape)\b", upper, re.IGNORECASE)
        )
    )
    parser_confidence = min(
        100,
        parser_confidence +
        (8 if short_call_detected and not entry_zone else 0) +
        (5 if symbol and trade_hits and not target_values else 0)
    )

    return {
        "symbol": symbol,
        "direction": direction or "pump",
        "chain": chain,
        "contract_address": contract_address,
        "entry_zone": entry_zone,
        "stop_loss": stop_values[0] if stop_values else None,
        "targets": target_values,
        "parser_confidence": parser_confidence,
        "spam_hits": spam_hits,
        "trade_hits": trade_hits,
        "direction_hits": direction_hits,
        "short_call_detected": short_call_detected,
    }

def explain_telegram_signal_rejection(parsed: dict) -> List[str]:
    symbol = (parsed.get("symbol") or "").upper()
    contract_address = parsed.get("contract_address")
    parser_confidence = float(parsed.get("parser_confidence") or 0)
    spam_hits = parsed.get("spam_hits") or []
    trade_hits = parsed.get("trade_hits") or []
    direction_hits = parsed.get("direction_hits") or []
    entry_zone = parsed.get("entry_zone")
    stop_loss = parsed.get("stop_loss")
    targets = parsed.get("targets") or []
    short_call_detected = bool(parsed.get("short_call_detected"))
    reasons: List[str] = []
    if not symbol and not contract_address:
        reasons.append("missing_symbol_or_contract")
    if symbol and symbol.isdigit():
        reasons.append("numeric_symbol_candidate")
    if symbol and len(symbol) < 2:
        reasons.append("symbol_too_short")
    numeric_targets = [target for target in targets if isinstance(target, (int, float))]
    has_numeric_plan = bool(entry_zone or stop_loss or numeric_targets)
    has_trade_structure = bool(contract_address or has_numeric_plan or trade_hits)
    has_direction = bool(direction_hits)
    has_short_call = bool(symbol and short_call_detected and (trade_hits or direction_hits))
    has_contract_play = bool(contract_address and has_direction)
    has_structured_plan = bool(symbol and has_direction and has_numeric_plan)
    if spam_hits and not has_contract_play:
        reasons.append("spam_like_message")
    if not has_trade_structure and not has_direction and not has_short_call:
        reasons.append("missing_trade_or_direction_structure")
    if not has_contract_play and not has_structured_plan and not has_short_call:
        reasons.append("missing_contract_or_structured_plan")
    if not has_contract_play and not has_short_call and parser_confidence < 45:
        reasons.append("parser_confidence_below_threshold")
    return reasons

def should_store_telegram_signal(parsed: dict) -> bool:
    return len(explain_telegram_signal_rejection(parsed)) == 0

async def record_telegram_signal_rejection(
    *,
    source: Optional[dict],
    message_text: str,
    parsed: Optional[dict],
    reasons: List[str],
    stage: str,
    message_id: Optional[str] = None,
    message_url: Optional[str] = None,
    posted_at: Optional[datetime] = None,
) -> None:
    try:
        payload = parsed or {}
        await db.telegram_signal_rejections.insert_one({
            "source_id": str(source["_id"]) if source and source.get("_id") else None,
            "source_name": source.get("source_name") if source else None,
            "source_handle": source.get("source_handle") if source else None,
            "message_id": message_id,
            "message_url": message_url,
            "message_text": message_text,
            "posted_at": posted_at or datetime.now(timezone.utc),
            "created_at": datetime.now(timezone.utc),
            "stage": stage,
            "symbol": payload.get("symbol"),
            "direction": payload.get("direction"),
            "contract_address": payload.get("contract_address"),
            "parser_confidence": payload.get("parser_confidence", 0),
            "trade_hits": payload.get("trade_hits", []),
            "direction_hits": payload.get("direction_hits", []),
            "spam_hits": payload.get("spam_hits", []),
            "short_call_detected": bool(payload.get("short_call_detected")),
            "reasons": reasons,
        })
    except Exception as e:
        logger.warning("Failed to persist Telegram rejection audit: %s", e)

async def find_latest_pumpradar_signal(symbol: Optional[str]) -> Optional[dict]:
    if not symbol:
        return None
    snapshot = await db.signal_snapshots.find_one({}, sort=[("timestamp", -1)])
    if not snapshot:
        return None
    for signal in (snapshot.get("pump_signals", []) + snapshot.get("dump_signals", [])):
        if (signal.get("symbol") or "").upper() == symbol.upper():
            return signal
    return None

async def build_market_alignment(symbol: Optional[str], direction: str) -> tuple[float, Optional[dict]]:
    latest_signal = await find_latest_pumpradar_signal(symbol)
    if not latest_signal:
        return 35.0, None
    latest_direction = latest_signal.get("signal_type") or ("pump" if latest_signal in [] else None)
    if not latest_direction:
        latest_direction = "pump" if latest_signal.get("price_change_24h", 0) >= 0 else "dump"
    signal_strength = float(latest_signal.get("signal_strength") or 50)
    if latest_direction == direction:
        return round(min(100, 55 + signal_strength * 0.45), 2), latest_signal
    return round(max(5, 45 - signal_strength * 0.35), 2), latest_signal

def compute_consensus_score(source_count: int) -> float:
    if source_count <= 1:
        return 25.0
    return float(min(100, 25 + (source_count - 1) * 18))

def compute_telegram_signal_score(source_score: float, parser_confidence: float, market_alignment_score: float, consensus_score: float) -> float:
    return round(
        source_score * 0.35 +
        parser_confidence * 0.25 +
        market_alignment_score * 0.25 +
        consensus_score * 0.15,
        2,
    )

def derive_telegram_source_profile(doc: dict) -> dict:
    source_score = float(doc.get("source_score", 50) or 0)
    verified_count = int(doc.get("verified_count", 0) or 0)
    if source_score >= 80 and verified_count >= 8:
        trust_tier = "elite"
    elif source_score >= 65 and verified_count >= 5:
        trust_tier = "proven"
    elif source_score >= 45:
        trust_tier = "developing"
    else:
        trust_tier = "speculative"

    pump_calls = int(doc.get("pump_calls", 0) or 0)
    dump_calls = int(doc.get("dump_calls", 0) or 0)
    total_calls = max(1, pump_calls + dump_calls)
    pump_share = round((pump_calls / total_calls) * 100, 2)
    dump_share = round((dump_calls / total_calls) * 100, 2)
    if pump_share >= 70:
        bias_label = "Mostly Bullish"
    elif dump_share >= 70:
        bias_label = "Mostly Bearish"
    else:
        bias_label = "Balanced Flow"

    noise_ratio = float(doc.get("noise_ratio", 0) or 0)
    structured_ratio = float(doc.get("structured_ratio", 0) or 0)
    accuracy_1h = float(doc.get("accuracy_1h", 0) or 0)
    accuracy_4h = float(doc.get("accuracy_4h", 0) or 0)
    avg_move_4h_abs = float(doc.get("avg_move_4h_abs", 0) or 0)

    if accuracy_4h >= 65 and noise_ratio <= 25 and verified_count >= 6:
        quality_badge = "High Signal Quality"
    elif accuracy_4h >= 52 and avg_move_4h_abs >= 3 and verified_count >= 4:
        quality_badge = "Fast but Risky"
    elif source_score >= 55 and verified_count >= 8 and accuracy_1h >= 70:
        quality_badge = "Fast but Risky"
    elif noise_ratio >= 45 or structured_ratio <= 45:
        quality_badge = "Mostly Noise"
    elif bias_label == "Mostly Bearish" and accuracy_4h >= 55:
        quality_badge = "Reliable Bearish Source"
    else:
        quality_badge = "Mixed Quality"

    quality_summary = (
        f"{quality_badge}. "
        f"{structured_ratio:.0f}% clean structure, {noise_ratio:.0f}% weak/noisy calls, "
        f"{accuracy_4h:.0f}% 4h hit rate."
    )
    return {
        "trust_tier": trust_tier,
        "pump_calls": pump_calls,
        "dump_calls": dump_calls,
        "pump_share": pump_share,
        "dump_share": dump_share,
        "bias_label": bias_label,
        "quality_badge": quality_badge,
        "quality_summary": quality_summary,
    }

def serialize_telegram_source(doc: dict) -> dict:
    profile = derive_telegram_source_profile(doc)
    return {
        "id": str(doc["_id"]),
        "source_name": doc.get("source_name"),
        "source_handle": doc.get("source_handle"),
        "source_type": doc.get("source_type", "group"),
        "invite_link": doc.get("invite_link"),
        "enabled": doc.get("enabled", True),
        "manual_whitelist": doc.get("manual_whitelist", False),
        "notes": doc.get("notes"),
        "signal_count": doc.get("signal_count", 0),
        "verified_count": doc.get("verified_count", 0),
        "accuracy_1h": doc.get("accuracy_1h", 0),
        "accuracy_4h": doc.get("accuracy_4h", 0),
        "accuracy_24h": doc.get("accuracy_24h", 0),
        "avg_return_1h": doc.get("avg_return_1h", 0),
        "avg_return_4h": doc.get("avg_return_4h", 0),
        "avg_return_24h": doc.get("avg_return_24h", 0),
        "avg_move_1h_abs": doc.get("avg_move_1h_abs", 0),
        "avg_move_4h_abs": doc.get("avg_move_4h_abs", 0),
        "avg_move_24h_abs": doc.get("avg_move_24h_abs", 0),
        "parser_quality_avg": doc.get("parser_quality_avg", 0),
        "market_alignment_avg": doc.get("market_alignment_avg", 0),
        "structured_ratio": doc.get("structured_ratio", 0),
        "noise_ratio": doc.get("noise_ratio", 0),
        "pump_calls": profile["pump_calls"],
        "dump_calls": profile["dump_calls"],
        "pump_share": profile["pump_share"],
        "dump_share": profile["dump_share"],
        "bias_label": profile["bias_label"],
        "quality_badge": profile["quality_badge"],
        "quality_summary": profile["quality_summary"],
        "source_score": doc.get("source_score", 50),
        "trust_tier": profile["trust_tier"],
        "last_signal_at": serialize_datetime(doc.get("last_signal_at")),
        "updated_at": serialize_datetime(doc.get("updated_at")),
    }

def serialize_telegram_signal(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "source_id": doc.get("source_id"),
        "source_name": doc.get("source_name"),
        "source_handle": doc.get("source_handle"),
        "source_type": doc.get("source_type", "group"),
        "symbol": doc.get("symbol"),
        "direction": doc.get("direction"),
        "chain": doc.get("chain"),
        "contract_address": doc.get("contract_address"),
        "entry_zone": doc.get("entry_zone"),
        "stop_loss": doc.get("stop_loss"),
        "targets": doc.get("targets", []),
        "reference_price": doc.get("reference_price"),
        "parser_confidence": doc.get("parser_confidence", 0),
        "market_alignment_score": doc.get("market_alignment_score", 0),
        "consensus_score": doc.get("consensus_score", 0),
        "cross_source_count": doc.get("cross_source_count", 1),
        "source_score_at_ingest": doc.get("source_score_at_ingest", 50),
        "composite_score": doc.get("composite_score", 0),
        "quality_judge": doc.get("quality_judge"),
        "status": doc.get("status", "pending"),
        "message_text": doc.get("message_text"),
        "message_url": doc.get("message_url"),
        "posted_at": serialize_datetime(doc.get("posted_at")),
        "created_at": serialize_datetime(doc.get("created_at")),
        "updated_at": serialize_datetime(doc.get("updated_at")),
        "verification": {
            key: {
                "due_at": serialize_datetime((doc.get("verification") or {}).get(key, {}).get("due_at")),
                "checked_at": serialize_datetime((doc.get("verification") or {}).get(key, {}).get("checked_at")),
                "return_pct": (doc.get("verification") or {}).get(key, {}).get("return_pct"),
                "hit": (doc.get("verification") or {}).get(key, {}).get("hit"),
                "threshold_pct": (doc.get("verification") or {}).get(key, {}).get("threshold_pct"),
            }
            for key in TELEGRAM_HORIZONS
        },
    }

async def upsert_telegram_source(payload: TelegramSourceUpsertRequest | TelegramSignalIngestRequest) -> dict:
    handle = normalize_telegram_handle(payload.source_handle)
    source_key = handle or payload.source_name.strip().lower()
    now = datetime.now(timezone.utc)
    source = await db.telegram_sources.find_one({"source_key": source_key})
    if source:
        existing_signal_count = int(source.get("signal_count") or 0)
        manual_whitelist = bool(source.get("manual_whitelist"))
        enabled = getattr(payload, "enabled", True)
        notes = getattr(payload, "notes", None)
        if manual_whitelist:
            enabled = True
            notes = source.get("notes") or "Manually whitelisted Telegram source"
        elif existing_signal_count > 0:
            enabled = True
            notes = "Retained because this source already produced parsed signals"
        await db.telegram_sources.update_one(
            {"_id": source["_id"]},
            {"$set": {
                "source_name": payload.source_name.strip(),
                "source_handle": handle,
                "source_type": getattr(payload, "source_type", "group"),
                "invite_link": getattr(payload, "invite_link", None),
                "notes": notes,
                "enabled": enabled,
                "updated_at": now,
            }},
        )
        source = await db.telegram_sources.find_one({"_id": source["_id"]})
        return source

    doc = {
        "source_key": source_key,
        "source_name": payload.source_name.strip(),
        "source_handle": handle,
        "source_type": getattr(payload, "source_type", "group"),
        "invite_link": getattr(payload, "invite_link", None),
        "notes": getattr(payload, "notes", None),
        "enabled": getattr(payload, "enabled", True),
        "signal_count": 0,
        "verified_count": 0,
        "accuracy_1h": 0,
        "accuracy_4h": 0,
        "accuracy_24h": 0,
        "avg_return_1h": 0,
        "avg_return_4h": 0,
        "avg_return_24h": 0,
        "parser_quality_avg": 0,
        "market_alignment_avg": 0,
        "source_score": 50,
        "last_signal_at": None,
        "created_at": now,
        "updated_at": now,
    }
    result = await db.telegram_sources.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc

async def recalculate_telegram_source_metrics(source_id: str) -> Optional[dict]:
    signals = await db.telegram_signals.find({"source_id": source_id}).to_list(length=1000)
    if not signals:
        return None

    parser_avg = average([signal.get("parser_confidence", 0) for signal in signals])
    alignment_avg = average([signal.get("market_alignment_score", 0) for signal in signals])
    pump_calls = sum(1 for signal in signals if signal.get("direction") == "pump")
    dump_calls = sum(1 for signal in signals if signal.get("direction") == "dump")
    structured_calls = 0
    noisy_calls = 0

    for signal in signals:
        has_plan = bool(signal.get("entry_zone") or signal.get("stop_loss") or (signal.get("targets") or []) or signal.get("contract_address"))
        parser_conf = float(signal.get("parser_confidence") or 0)
        align = float(signal.get("market_alignment_score") or 0)
        if has_plan and parser_conf >= 65:
            structured_calls += 1
        if parser_conf < 55 or align < 40:
            noisy_calls += 1

    horizon_results = {}
    for horizon_key in TELEGRAM_HORIZONS:
        checked = []
        returns = []
        for signal in signals:
            bucket = (signal.get("verification") or {}).get(horizon_key, {})
            if bucket.get("checked_at"):
                checked.append(bool(bucket.get("hit")))
                if bucket.get("return_pct") is not None:
                    returns.append(float(bucket["return_pct"]))
        horizon_results[horizon_key] = {
            "accuracy": round((sum(1 for hit in checked if hit) / len(checked)) * 100, 2) if checked else 0.0,
            "avg_return": average(returns),
            "avg_move_abs": average([abs(value) for value in returns]),
            "samples": len(checked),
        }

    verified_count = max(horizon_results["one_hour"]["samples"], horizon_results["four_hour"]["samples"], horizon_results["twenty_four_hour"]["samples"])
    confidence_factor = min(1.0, 0.35 + verified_count / 20) if verified_count else 0.35
    performance_core = (
        horizon_results["four_hour"]["accuracy"] * 0.45 +
        horizon_results["one_hour"]["accuracy"] * 0.25 +
        horizon_results["twenty_four_hour"]["accuracy"] * 0.20 +
        parser_avg * 0.05 +
        alignment_avg * 0.05
    )
    source_score = round(min(100, performance_core * confidence_factor + min(15, verified_count * 1.5)), 2)

    update = {
        "signal_count": len(signals),
        "verified_count": verified_count,
        "accuracy_1h": horizon_results["one_hour"]["accuracy"],
        "accuracy_4h": horizon_results["four_hour"]["accuracy"],
        "accuracy_24h": horizon_results["twenty_four_hour"]["accuracy"],
        "avg_return_1h": horizon_results["one_hour"]["avg_return"],
        "avg_return_4h": horizon_results["four_hour"]["avg_return"],
        "avg_return_24h": horizon_results["twenty_four_hour"]["avg_return"],
        "avg_move_1h_abs": horizon_results["one_hour"]["avg_move_abs"],
        "avg_move_4h_abs": horizon_results["four_hour"]["avg_move_abs"],
        "avg_move_24h_abs": horizon_results["twenty_four_hour"]["avg_move_abs"],
        "parser_quality_avg": parser_avg,
        "market_alignment_avg": alignment_avg,
        "structured_ratio": round((structured_calls / len(signals)) * 100, 2) if signals else 0.0,
        "noise_ratio": round((noisy_calls / len(signals)) * 100, 2) if signals else 0.0,
        "pump_calls": pump_calls,
        "dump_calls": dump_calls,
        "source_score": source_score,
        "last_signal_at": max([signal.get("posted_at") or signal.get("created_at") for signal in signals if signal.get("posted_at") or signal.get("created_at")], default=None),
        "updated_at": datetime.now(timezone.utc),
    }
    await db.telegram_sources.update_one({"_id": ObjectId(source_id)}, {"$set": update})
    return await db.telegram_sources.find_one({"_id": ObjectId(source_id)})


def classify_telegram_message_quality(message_text: str, symbol: Optional[str] = None, source_score: float = 0) -> dict:
    text = (message_text or "").strip()
    low = text.lower()
    sym = (symbol or "").strip().upper()

    trade_terms = (
        "entry", "entries", "target", "targets", "tp1", "tp2", "tp3", "take profit",
        "stop loss", "sl", "long", "short", "buy zone", "sell zone", "breakout",
        "breakdown", "support", "resistance", "leverage", "scalp", "spot entry",
    )
    promo_terms = (
        "reward", "rewards", "giveaway", "airdrop", "claim", "join us", "event period",
        "how it works", "how to participate", "buy now", "validity duration", "live session",
        "rights zone", "supported wallet", "trust wallet", "metamask", "cex wallet",
        "dex wallet", "official", "community", "announcement",
    )
    proof_terms = (
        "profit", "accurate", "premium call", "vip proof", "vip", "proof",
        "consistency", "contact @", "target achieved", "targets achieved",
        "all target", "all targets", "target -", "freetrail", "free trial",
    )

    false_symbols = {
        "FROM", "MAKE", "LIVE", "MINI", "PUMP", "DUMP", "PROFIT", "TARGET",
        "ENTRY", "SIGNAL", "CALL", "WALLET", "BUY", "SELL", "LONG", "SHORT",
        "PLEASE", "HOW", "OUI", "IT", "ONCE", "UPDATE", "WILL", "SINCE",
        "CHECK", "HELLO", "BONJOUR", "VOUS", "POUR", "OKAY", "OK",
        "IMPORTANT", "QUICK", "SCAM",
    }

    trade_hits = sum(1 for term in trade_terms if term in low)
    promo_hits = sum(1 for term in promo_terms if term in low)
    proof_hits = sum(1 for term in proof_terms if term in low)
    locked_vip = ("🔐" in text) or ("details available on vip" in low) or ("vip channel" in low and "entry" in low)

    label = "unknown"
    is_trade_signal = False
    confidence = 35
    reasons = []

    if sym in false_symbols:
        reasons.append(f"symbol looks like common word/noise: {sym}")

    if locked_vip:
        label = "vip_locked_not_actionable"
        is_trade_signal = False
        confidence = 82
        reasons.append("VIP-locked/redacted setup without actionable entry/SL/targets")

    if trade_hits >= 2 and not locked_vip:
        label = "possible_trade_signal"
        is_trade_signal = True
        confidence = 62
        reasons.append(f"trade terms detected: {trade_hits}")

    if trade_hits >= 3 and sym not in false_symbols and not locked_vip:
        label = "real_trade_signal"
        is_trade_signal = True
        confidence = 78
        reasons.append("structured trade setup detected")

    actionable_terms = (
        "entry", "entries", "buy zone", "sell zone", "stop loss", "sl",
        "long", "short", "open long", "open short", "leverage", "spot entry",
    )
    actionable_hits = sum(1 for term in actionable_terms if term in low)

    if proof_hits >= 2 and actionable_hits == 0:
        label = "performance_proof_or_marketing"
        is_trade_signal = False
        confidence = 72
        reasons.append("profit/proof marketing without actionable entry/SL setup")

    if promo_hits >= 2 and trade_hits == 0:
        label = "official_update_or_noise"
        is_trade_signal = False
        confidence = 72
        reasons.append(f"promo/official terms detected: {promo_hits}")

    if sym in false_symbols and trade_hits < 3:
        label = "noise_false_symbol"
        is_trade_signal = False
        confidence = max(confidence, 75)
        reasons.append("false ticker extraction likely")

    if source_score >= 55 and is_trade_signal:
        confidence = min(90, confidence + 8)
        reasons.append("source has useful historical score")

    return {
        "label": label,
        "is_trade_signal": is_trade_signal,
        "confidence": confidence,
        "reasons": reasons,
        "classifier": "local_v1",
    }


async def ingest_telegram_signal_payload(
    *,
    source: dict,
    message_text: str,
    message_id: Optional[str] = None,
    message_url: Optional[str] = None,
    posted_at: Optional[datetime] = None,
) -> dict:
    posted_at = posted_at or datetime.now(timezone.utc)
    parsed = parse_telegram_signal_message(message_text)
    reject_reasons = explain_telegram_signal_rejection(parsed)
    if reject_reasons:
        await record_telegram_signal_rejection(
            source=source,
            message_text=message_text,
            parsed=parsed,
            reasons=reject_reasons,
            stage="parser_gate",
            message_id=message_id,
            message_url=message_url,
            posted_at=posted_at,
        )
        raise ValueError(f"Telegram message rejected: {', '.join(reject_reasons)}")
    source_score = float(source.get("source_score", 50))
    market_alignment_score, latest_signal = await build_market_alignment(parsed.get("symbol"), parsed.get("direction") or "pump")
    reference_price = None
    coin_name = None
    if latest_signal:
        reference_price = latest_signal.get("price")
        coin_name = latest_signal.get("name")

    coin_id = resolve_coingecko_coin_id(parsed.get("symbol") or "", preferred_name=coin_name) if parsed.get("symbol") else ""
    cluster_key = f"{(parsed.get('symbol') or 'unknown').upper()}:{parsed.get('direction') or 'pump'}"
    window_start = posted_at - timedelta(minutes=30)
    window_end = posted_at + timedelta(minutes=30)
    recent_cluster = await db.telegram_signals.find({
        "cluster_key": cluster_key,
        "posted_at": {"$gte": window_start, "$lte": window_end},
    }).to_list(length=100)
    source_ids = {signal.get("source_id") for signal in recent_cluster if signal.get("source_id")}
    source_ids.add(str(source["_id"]))
    consensus_score = compute_consensus_score(len(source_ids))
    composite_score = compute_telegram_signal_score(source_score, parsed["parser_confidence"], market_alignment_score, consensus_score)
    quality_judge = classify_telegram_message_quality(
        message_text=message_text,
        symbol=parsed.get("symbol"),
        source_score=source_score,
    )

    verification = {
        key: {
            "due_at": posted_at + timedelta(hours=horizon["hours"]),
            "checked_at": None,
            "return_pct": None,
            "hit": None,
            "threshold_pct": horizon["threshold_pct"],
        }
        for key, horizon in TELEGRAM_HORIZONS.items()
    }

    doc = {
        "source_id": str(source["_id"]),
        "source_name": source.get("source_name"),
        "source_handle": source.get("source_handle"),
        "source_type": source.get("source_type", "group"),
        "message_id": message_id,
        "message_url": message_url,
        "message_text": message_text,
        "posted_at": posted_at,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "symbol": parsed.get("symbol"),
        "direction": parsed.get("direction"),
        "chain": parsed.get("chain"),
        "contract_address": parsed.get("contract_address"),
        "entry_zone": parsed.get("entry_zone"),
        "stop_loss": parsed.get("stop_loss"),
        "targets": parsed.get("targets", []),
        "parser_confidence": parsed.get("parser_confidence", 0),
        "market_alignment_score": market_alignment_score,
        "consensus_score": consensus_score,
        "cross_source_count": len(source_ids),
        "source_score_at_ingest": source_score,
        "composite_score": composite_score,
        "quality_judge": quality_judge,
        "status": "pending",
        "verification": verification,
        "cluster_key": cluster_key,
        "reference_price": reference_price,
        "coin_name": coin_name,
        "coin_id": coin_id,
    }
    result = await db.telegram_signals.insert_one(doc)
    doc["_id"] = result.inserted_id

    await db.telegram_signals.update_many(
        {"cluster_key": cluster_key, "posted_at": {"$gte": window_start, "$lte": window_end}},
        {"$set": {"cross_source_count": len(source_ids), "consensus_score": consensus_score}},
    )
    await recalculate_telegram_source_metrics(str(source["_id"]))
    return doc

def fetch_market_chart_points(coin_id: str, days: int = 2) -> List[dict]:
    try:
        url = f"https://api.coingecko.com/api/v3/coins/{coin_id}/market_chart"
        params = {"vs_currency": "usd", "days": days, "interval": "hourly"}
        r = requests.get(url, params=params, headers=CG_HEADERS, timeout=15)
        if r.status_code != 200:
            return []
        prices = (r.json() or {}).get("prices", []) or []
        return [
            {
                "timestamp": datetime.fromtimestamp(ts / 1000, tz=timezone.utc),
                "price": float(price),
            }
            for ts, price in prices
        ]
    except Exception as e:
        logger.error(f"Telegram chart verification error for {coin_id}: {e}")
        return []

def nearest_price_at(points: List[dict], target_dt: datetime) -> Optional[float]:
    if not points:
        return None
    nearest = min(points, key=lambda item: abs((item["timestamp"] - target_dt).total_seconds()))
    return nearest.get("price")

async def evaluate_pending_telegram_signals():
    try:
        now = datetime.now(timezone.utc)
        signals = await db.telegram_signals.find({
            "status": {"$in": ["pending", "partially_verified"]},
            "symbol": {"$ne": None},
            "reference_price": {"$gt": 0},
        }).sort("posted_at", 1).limit(200).to_list(length=200)

        touched_sources = set()
        for signal in signals:
            verification = signal.get("verification") or {}
            due_now = [
                key for key, horizon in TELEGRAM_HORIZONS.items()
                if normalize_datetime((verification.get(key) or {}).get("due_at"))
                and normalize_datetime((verification.get(key) or {}).get("due_at")) <= now
                and not (verification.get(key) or {}).get("checked_at")
            ]
            if not due_now:
                continue

            coin_id = signal.get("coin_id") or resolve_coingecko_coin_id(signal.get("symbol") or "", signal.get("coin_name"))
            points = fetch_market_chart_points(coin_id, days=2)
            if not points:
                continue

            updates = {}
            checked_count = 0
            for key in TELEGRAM_HORIZONS:
                bucket = verification.get(key) or {}
                if bucket.get("checked_at"):
                    checked_count += 1
            for key in due_now:
                horizon = TELEGRAM_HORIZONS[key]
                due_at = normalize_datetime((verification.get(key) or {}).get("due_at"))
                if not due_at:
                    continue
                target_price = nearest_price_at(points, due_at)
                if target_price is None:
                    continue
                reference_price = float(signal.get("reference_price") or 0)
                if reference_price <= 0:
                    continue
                return_pct = round(((target_price - reference_price) / reference_price) * 100, 2)
                hit = return_pct >= horizon["threshold_pct"] if signal.get("direction") == "pump" else return_pct <= -horizon["threshold_pct"]
                updates[f"verification.{key}.checked_at"] = now
                updates[f"verification.{key}.return_pct"] = return_pct
                updates[f"verification.{key}.hit"] = hit
                updates[f"verification.{key}.threshold_pct"] = horizon["threshold_pct"]
                checked_count += 1

            if not updates:
                continue

            new_status = "verified" if checked_count >= len(TELEGRAM_HORIZONS) else "partially_verified"
            updates["status"] = new_status
            updates["coin_id"] = coin_id
            updates["updated_at"] = now
            await db.telegram_signals.update_one({"_id": signal["_id"]}, {"$set": updates})
            if signal.get("source_id"):
                touched_sources.add(signal["source_id"])

        for source_id in touched_sources:
            await recalculate_telegram_source_metrics(source_id)
    except Exception as e:
        logger.error(f"Telegram signal verification job failed: {e}")

async def handle_telegram_message_event(event):
    try:
        chat = await event.get_chat()
        if not is_telegram_collectable_chat(chat):
            return
        chat_title = getattr(chat, "title", None) or getattr(chat, "first_name", None) or getattr(chat, "username", None)
        chat_username = getattr(chat, "username", None)
        sources = await get_enabled_telegram_sources()
        source = next((item for item in sources if matches_telegram_source(item, chat_title, chat_username)), None)
        if not source:
            payload = build_telegram_source_payload(chat)
            if not payload:
                return
            source = await upsert_telegram_source(payload)
        if not source.get("enabled", True):
            return
        message_text = (event.raw_text or "").strip()
        if not message_text:
            return
        parsed = parse_telegram_signal_message(message_text)
        reject_reasons = explain_telegram_signal_rejection(parsed)
        if reject_reasons:
            message_url = f"https://t.me/{chat_username}/{event.id}" if chat_username else None
            posted_at = event.date if isinstance(event.date, datetime) else datetime.now(timezone.utc)
            if posted_at.tzinfo is None:
                posted_at = posted_at.replace(tzinfo=timezone.utc)
            await record_telegram_signal_rejection(
                source=source,
                message_text=message_text,
                parsed=parsed,
                reasons=reject_reasons,
                stage="live_ingest_gate",
                message_id=str(event.id),
                message_url=message_url,
                posted_at=posted_at,
            )
            return
        message_url = f"https://t.me/{chat_username}/{event.id}" if chat_username else None
        posted_at = event.date if isinstance(event.date, datetime) else datetime.now(timezone.utc)
        if posted_at.tzinfo is None:
            posted_at = posted_at.replace(tzinfo=timezone.utc)
        await ingest_telegram_signal_payload(
            source=source,
            message_text=message_text,
            message_id=str(event.id),
            message_url=message_url,
            posted_at=posted_at,
        )
    except Exception as e:
        logger.error(f"Telegram live ingest error: {e}")

def build_telegram_consensus_payload(signals: List[dict], sources: List[dict], hours: int) -> dict:
    symbol_map: Dict[str, dict] = {}
    bullish_mentions = 0
    bearish_mentions = 0
    allowed_quality_labels = {"real_trade_signal", "possible_trade_signal"}

    filtered_signals = []
    ignored_by_quality = 0
    for signal in signals:
        quality = signal.get("quality_judge") or {}
        if quality and quality.get("label") not in allowed_quality_labels:
            ignored_by_quality += 1
            continue
        if quality and quality.get("is_trade_signal") is False:
            ignored_by_quality += 1
            continue
        filtered_signals.append(signal)

    for signal in filtered_signals:
        symbol = (signal.get("symbol") or "").upper()
        if not symbol:
            continue
        group = symbol_map.setdefault(symbol, {
            "symbol": symbol,
            "mentions": 0,
            "bullish_mentions": 0,
            "bearish_mentions": 0,
            "source_names": set(),
            "scores": [],
            "latest_posted_at": None,
        })
        group["mentions"] += 1
        if signal.get("direction") == "dump":
            bearish_mentions += 1
            group["bearish_mentions"] += 1
        else:
            bullish_mentions += 1
            group["bullish_mentions"] += 1
        if signal.get("source_name"):
            group["source_names"].add(signal["source_name"])
        if signal.get("composite_score") is not None:
            group["scores"].append(float(signal["composite_score"]))
        posted_at = normalize_datetime(signal.get("posted_at"))
        if posted_at and (group["latest_posted_at"] is None or posted_at > group["latest_posted_at"]):
            group["latest_posted_at"] = posted_at

    hot_symbols = []
    for item in symbol_map.values():
        unique_sources = len(item["source_names"])
        avg_score = round(sum(item["scores"]) / len(item["scores"]), 2) if item["scores"] else 0.0
        if item["bullish_mentions"] and item["bearish_mentions"]:
            stance = "mixed"
        elif item["bearish_mentions"] > item["bullish_mentions"]:
            stance = "bearish"
        else:
            stance = "bullish"
        if item["mentions"] >= 4 or unique_sources >= 3:
            rumor_level = "high"
        elif item["mentions"] >= 2 or unique_sources >= 2:
            rumor_level = "medium"
        else:
            rumor_level = "low"
        hot_symbols.append({
            "symbol": item["symbol"],
            "mentions": item["mentions"],
            "bullish_mentions": item["bullish_mentions"],
            "bearish_mentions": item["bearish_mentions"],
            "unique_sources": unique_sources,
            "avg_score": avg_score,
            "stance": stance,
            "rumor_level": rumor_level,
            "source_names": sorted(item["source_names"]),
            "latest_posted_at": serialize_datetime(item["latest_posted_at"]),
        })

    hot_symbols.sort(
        key=lambda item: (
            item["mentions"],
            item["unique_sources"],
            item["avg_score"],
        ),
        reverse=True,
    )
    active_source_names = [source.get("source_name") for source in sources if source.get("source_name")]
    if hot_symbols:
        top = hot_symbols[:3]
        top_labels = ", ".join(item["symbol"] for item in top)
        headline = (
            f"Telegram chatter across {len(active_source_names)} signal-grade channels is concentrated around {top_labels} "
            f"over the last {hours}h. Treat this as crowd-flow context, not a confirmed trading signal."
        )
    else:
        headline = (
            f"No clean repeated Telegram chatter detected across the {len(active_source_names)} signal-grade channels "
            f"in the last {hours}h."
        )

    return {
        "headline": headline,
        "hours": hours,
        "active_sources": active_source_names,
        "signal_count": len(filtered_signals),
        "raw_signal_count": len(signals),
        "ignored_by_quality": ignored_by_quality,
        "bullish_mentions": bullish_mentions,
        "bearish_mentions": bearish_mentions,
        "hot_symbols": hot_symbols[:8],
    }

async def start_telegram_listener():
    global telegram_client, telegram_listener_task
    runtime = telegram_runtime_status()
    if not TelegramClient or not runtime["api_id_configured"] or not runtime["api_hash_configured"] or not runtime["phone_configured"]:
        logger.info("Telegram listener not started - credentials or Telethon missing")
        return
    if not TELEGRAM_LIVE_ENABLED:
        logger.info("Telegram listener disabled by TELEGRAM_LIVE_ENABLED")
        return
    if telegram_listener_task and not telegram_listener_task.done():
        return

    client = await create_telegram_client()
    if not client:
        return
    authorized = await client.is_user_authorized()
    telegram_auth_state["authorized"] = bool(authorized)
    if not authorized:
        await client.disconnect()
        logger.info("Telegram listener not started - session not authorized yet")
        return

    synced = await sync_telegram_dialog_sources(client)
    logger.info(f"Telegram dialog source sync complete: {synced} chats indexed")
    client.add_event_handler(handle_telegram_message_event, events.NewMessage(incoming=True))
    telegram_client = client
    telegram_listener_task = asyncio.create_task(client.run_until_disconnected())
    logger.info("Telegram live listener started")

@app.post("/api/admin/telegram/auth/request-code")
async def admin_request_telegram_code(admin=Depends(require_admin)):
    if not TelegramClient:
        raise HTTPException(status_code=503, detail=api_err("Telethon is not installed", "TELEGRAM_CLIENT_MISSING"))
    if not TELEGRAM_API_ID or not TELEGRAM_API_HASH or not TELEGRAM_PHONE:
        raise HTTPException(status_code=400, detail=api_err("Telegram credentials are incomplete", "TELEGRAM_CONFIG_MISSING"))

    client = await create_telegram_client()
    telegram_auth_state["client"] = client
    if await client.is_user_authorized():
        telegram_auth_state["authorized"] = True
        return api_ok({"message": "Telegram session is already authorized"})

    sent = await client.send_code_request(TELEGRAM_PHONE)
    telegram_auth_state["phone_code_hash"] = sent.phone_code_hash
    telegram_auth_state["authorized"] = False
    return api_ok({"message": "Telegram login code sent to the Telegram app for this phone number."})

@app.post("/api/admin/telegram/auth/complete")
async def admin_complete_telegram_auth(req: TelegramAuthCodeRequest, admin=Depends(require_admin)):
    client = telegram_auth_state.get("client")
    if not client:
        client = await create_telegram_client()
    if not client:
        raise HTTPException(status_code=503, detail=api_err("Telegram client is unavailable", "TELEGRAM_CLIENT_MISSING"))
    try:
        await client.sign_in(
            phone=TELEGRAM_PHONE,
            code=req.code,
            phone_code_hash=telegram_auth_state.get("phone_code_hash"),
        )
    except SessionPasswordNeededError:
        if not req.password:
            raise HTTPException(status_code=400, detail=api_err("Telegram account requires 2FA password", "TELEGRAM_PASSWORD_REQUIRED"))
        await client.sign_in(password=req.password)

    telegram_auth_state["authorized"] = await client.is_user_authorized()
    await client.disconnect()
    telegram_auth_state.pop("client", None)
    telegram_auth_state.pop("phone_code_hash", None)
    await start_telegram_listener()
    return api_ok({"message": "Telegram session authorized successfully"})

@app.get("/api/telegram/status")
async def telegram_status(user=Depends(require_active_subscription)):
    source_count = await db.telegram_sources.count_documents({})
    active_source_count = await db.telegram_sources.count_documents({"enabled": True})
    pending_count = await db.telegram_signals.count_documents({"status": {"$in": ["pending", "partially_verified"]}})
    verified_count = await db.telegram_signals.count_documents({"status": "verified"})
    return api_ok({
        "runtime": telegram_runtime_status(),
        "sources": {"total": source_count, "active": active_source_count},
        "signals": {"pending": pending_count, "verified": verified_count},
    })

@app.get("/api/telegram/sources")
async def telegram_sources(user=Depends(require_active_subscription)):
    docs = await db.telegram_sources.find({}).sort("source_score", -1).to_list(length=250)
    return api_ok({"sources": [serialize_telegram_source(doc) for doc in docs]})

@app.get("/api/telegram/signals")
async def telegram_signals(limit: int = 50, status: Optional[str] = None, user=Depends(require_active_subscription)):
    query = {}
    if status:
        query["status"] = status
    docs = await db.telegram_signals.find(query).sort("posted_at", -1).limit(limit).to_list(length=limit)
    summary = {
        "total": await db.telegram_signals.count_documents(query),
        "pending": await db.telegram_signals.count_documents({**query, "status": {"$in": ["pending", "partially_verified"]}}),
        "verified": await db.telegram_signals.count_documents({**query, "status": "verified"}),
        "pump": await db.telegram_signals.count_documents({**query, "direction": "pump"}),
        "dump": await db.telegram_signals.count_documents({**query, "direction": "dump"}),
    }
    return api_ok({"signals": [serialize_telegram_signal(doc) for doc in docs], "summary": summary})

@app.get("/api/telegram/consensus")
async def telegram_consensus(hours: int = 24, user=Depends(require_active_subscription)):
    hours = max(1, min(hours, 72))
    cache_key = f"telegram_consensus::{hours}"
    cached = get_memory_cache(TELEGRAM_CONSENSUS_CACHE, cache_key, ttl_seconds=90)
    if cached is not None:
        return api_ok(cached)
    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
    sources = await get_enabled_telegram_sources()
    dashboard_sources = [
        source for source in sources
        if derive_telegram_source_profile(source).get("quality_badge") in {"High Signal Quality", "Fast but Risky"}
    ]
    source_ids = [str(source["_id"]) for source in dashboard_sources]
    if not source_ids:
        return api_ok(set_memory_cache(TELEGRAM_CONSENSUS_CACHE, cache_key, build_telegram_consensus_payload([], dashboard_sources, hours)))
    signals = await db.telegram_signals.find({
        "source_id": {"$in": source_ids},
        "posted_at": {"$gte": cutoff},
    }).sort("posted_at", -1).limit(300).to_list(length=300)
    return api_ok(set_memory_cache(TELEGRAM_CONSENSUS_CACHE, cache_key, build_telegram_consensus_payload(signals, dashboard_sources, hours)))

@app.post("/api/admin/telegram/sources")
async def admin_upsert_telegram_source(req: TelegramSourceUpsertRequest, admin=Depends(require_admin)):
    source = await upsert_telegram_source(req)
    source = await recalculate_telegram_source_metrics(str(source["_id"])) or source
    return api_ok({"source": serialize_telegram_source(source)})

@app.post("/api/admin/telegram/signals/ingest")
async def admin_ingest_telegram_signal(req: TelegramSignalIngestRequest, admin=Depends(require_admin)):
    posted_at = normalize_datetime(req.posted_at) or datetime.now(timezone.utc)
    source = None
    if req.source_id:
        source = await db.telegram_sources.find_one({"_id": ObjectId(req.source_id)})
    if not source:
        source = await upsert_telegram_source(req)
    try:
        doc = await ingest_telegram_signal_payload(
            source=source,
            message_text=req.message_text,
            message_id=req.message_id,
            message_url=req.message_url,
            posted_at=posted_at,
        )
    except ValueError as e:
        parsed = parse_telegram_signal_message(req.message_text)
        raise HTTPException(status_code=400, detail=api_err(str(e), "TELEGRAM_SIGNAL_REJECTED"))
    parsed = parse_telegram_signal_message(req.message_text)
    return api_ok({"signal": serialize_telegram_signal(doc), "parser": parsed})

@app.post("/api/admin/telegram/signals/{signal_id}/manual-outcome")
async def admin_manual_telegram_outcome(signal_id: str, req: TelegramManualOutcomeRequest, admin=Depends(require_admin)):
    signal = await db.telegram_signals.find_one({"_id": ObjectId(signal_id)})
    if not signal:
        raise HTTPException(status_code=404, detail=api_err("Telegram signal not found", "NOT_FOUND"))

    now = datetime.now(timezone.utc)
    updates = {"updated_at": now}
    payload = {
        "one_hour": req.return_1h_pct,
        "four_hour": req.return_4h_pct,
        "twenty_four_hour": req.return_24h_pct,
    }
    checked_count = 0
    for key, return_pct in payload.items():
        if return_pct is None:
            continue
        threshold = TELEGRAM_HORIZONS[key]["threshold_pct"]
        hit = return_pct >= threshold if signal.get("direction") == "pump" else return_pct <= -threshold
        updates[f"verification.{key}.checked_at"] = now
        updates[f"verification.{key}.return_pct"] = return_pct
        updates[f"verification.{key}.hit"] = hit
        checked_count += 1
    if checked_count == 0:
        raise HTTPException(status_code=400, detail=api_err("No outcome values were provided", "INVALID_REQUEST"))
    updates["status"] = "verified" if checked_count >= len(TELEGRAM_HORIZONS) else "partially_verified"
    await db.telegram_signals.update_one({"_id": signal["_id"]}, {"$set": updates})
    if signal.get("source_id"):
        await recalculate_telegram_source_metrics(signal["source_id"])
    signal = await db.telegram_signals.find_one({"_id": signal["_id"]})
    return api_ok({"signal": serialize_telegram_signal(signal)})

@app.post("/api/admin/telegram/recalculate")
async def admin_recalculate_telegram(admin=Depends(require_admin)):
    await evaluate_pending_telegram_signals()
    sources = await db.telegram_sources.find({}).to_list(length=500)
    for source in sources:
        await recalculate_telegram_source_metrics(str(source["_id"]))
    return api_ok({"message": "Telegram source scores recalculated"})

@app.get("/api/admin/telegram/calibration")
async def admin_telegram_calibration(hours: int = 72, admin=Depends(require_admin)):
    return api_ok(await build_telegram_calibration_summary(hours))

# ─────────────────────────────────────────────
# ADMIN ENDPOINTS
# ─────────────────────────────────────────────
async def require_admin(user=Depends(get_current_user)):
    if "admin" not in user.get("roles", []):
        raise HTTPException(status_code=403, detail=api_err("Admin access required", "FORBIDDEN"))
    return user

async def list_users_payload(skip: int = 0, limit: int = 100) -> dict:
    users = await db.users.find({}).skip(skip).limit(limit).to_list(length=limit)
    return api_ok({"users": [doc_to_user(u) for u in users], "total": await db.users.count_documents({})})

async def delete_user_by_id(user_id: str) -> dict:
    result = await db.users.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=api_err("User not found", "NOT_FOUND"))
    return api_ok({"message": "User deleted"})

async def update_user_by_id(user_id: str, body: dict) -> dict:
    update = {}
    if "subscription" in body:
        update["subscription"] = body["subscription"]

        duration = body.get("duration")
        if duration == "month":
            update["subscription_expiry"] = datetime.now(timezone.utc) + timedelta(days=30)
        elif duration == "year":
            update["subscription_expiry"] = datetime.now(timezone.utc) + timedelta(days=365)
        else:
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

@app.get("/api/admin/users")
async def admin_list_users(skip: int = 0, limit: int = 100, admin=Depends(require_admin)):
    return await list_users_payload(skip, limit)

@app.delete("/api/admin/users/{user_id}")
async def admin_delete_user(user_id: str, admin=Depends(require_admin)):
    return await delete_user_by_id(user_id)

@app.patch("/api/admin/users/{user_id}")
async def admin_update_user(user_id: str, body: dict, admin=Depends(require_admin)):
    return await update_user_by_id(user_id, body)

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

@app.get("/api/super-admin/users")
async def super_admin_list_users(skip: int = 0, limit: int = 100, admin=Depends(get_current_super_admin)):
    return await list_users_payload(skip, limit)

@app.delete("/api/super-admin/users/{user_id}")
async def super_admin_delete_user(user_id: str, admin=Depends(get_current_super_admin)):
    return await delete_user_by_id(user_id)

@app.patch("/api/super-admin/users/{user_id}")
async def super_admin_update_user(user_id: str, body: dict, admin=Depends(get_current_super_admin)):
    return await update_user_by_id(user_id, body)

@app.post("/api/super-admin/run-signal-job")
async def super_admin_run_signal_job(admin=Depends(get_current_super_admin)):
    try:
        await fetch_and_store_signals()
        return api_ok({"message": "Signal job completed successfully"})
    except Exception as e:
        logger.error(f"Super admin signal job failed: {e}")
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
