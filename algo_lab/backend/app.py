from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Literal
import json

from fastapi import FastAPI
from pydantic import BaseModel, Field

FIXTURE_PATH = Path(__file__).parent / "fixtures" / "signals.json"


class SourceData(BaseModel):
    coingecko: dict[str, Any] = Field(default_factory=dict)
    lunarcrush: dict[str, Any] = Field(default_factory=dict)
    geckoterminal: dict[str, Any] = Field(default_factory=dict)
    defillama: dict[str, Any] = Field(default_factory=dict)
    goplus: dict[str, Any] = Field(default_factory=dict)
    telegram: dict[str, Any] = Field(default_factory=dict)
    x: dict[str, Any] = Field(default_factory=dict)


class SignalInput(BaseModel):
    symbol: str
    name: str
    sources: SourceData


class SignalOutput(BaseModel):
    symbol: str
    name: str
    verdict: Literal["strong_pump", "pump_watch", "distribution", "dump_risk", "strong_dump", "noise", "avoid"]
    direction: Literal["bullish", "bearish", "neutral"]
    phase: str
    timing: str
    confidence: Literal["low", "medium", "high"]
    score: float
    pump_probability: float
    dump_probability: float
    confirmation_score: float
    manipulation_risk: float
    tradability_score: float
    fundamental_backing_score: float
    social_coordination_score: float
    action: Literal["buy", "watch", "avoid", "take_profit", "sell"]
    tp_pct: float
    sl_pct: float
    why_now: str
    what_confirms_it: list[str]
    risk_note: str
    red_flags: list[str]
    preferred_venue: str
    execution_note: str
    source_mode: Literal["offline_fixture_or_manual_payload", "live_api_enriched"]


def _clip(value: float, lo: float = 0, hi: float = 100) -> float:
    return float(max(lo, min(hi, value)))


def _confidence(score: float) -> str:
    if score >= 75:
        return "high"
    if score >= 50:
        return "medium"
    return "low"


@dataclass
class Scoring:
    pump_probability: float
    dump_probability: float
    confirmation_score: float
    manipulation_risk: float
    tradability_score: float
    fundamental_backing_score: float
    social_coordination_score: float


def compute_scores(signal: SignalInput) -> Scoring:
    cg = signal.sources.coingecko
    lc = signal.sources.lunarcrush
    gt = signal.sources.geckoterminal
    dl = signal.sources.defillama
    gp = signal.sources.goplus
    tg = signal.sources.telegram
    xv = signal.sources.x

    p24 = float(cg.get("price_change_24h", 0))
    p7d = float(cg.get("price_change_7d", 0))
    p30d = float(cg.get("price_change_30d", 0))
    mcap = float(cg.get("market_cap", 0))
    vol24 = float(cg.get("volume_24h", 0))
    fdv = float(cg.get("fdv", mcap or 1))

    social_burst = float(lc.get("social_burst", 0))
    social_volume = float(lc.get("social_volume", 0))
    sentiment = float(lc.get("sentiment", 50))
    galaxy = float(lc.get("galaxy_score", 50))

    liq = float(gt.get("dex_liquidity", 0))
    buys = float(gt.get("buys_24h", 0))
    sells = float(gt.get("sells_24h", 0))
    thin_liq = float(gt.get("thin_liquidity_risk", 0))

    tvl = float(dl.get("tvl", 0))
    fees = float(dl.get("fees_24h", 0))
    revenue = float(dl.get("revenue_24h", 0))
    strength = float(dl.get("protocol_strength", 0))

    rug = float(gp.get("rug_risk", 0))
    contract = float(gp.get("contract_risk", 0))
    honeypot = 100 if gp.get("honeypot") else 0
    owner_priv = float(gp.get("owner_privilege_risk", 0))
    blacklist = float(gp.get("blacklist_risk", 0))

    tg_mentions = float(tg.get("mentions", 0))
    tg_consensus = float(tg.get("consensus", 0))
    crowded = float(tg.get("crowded_trade_risk", 0))

    narrative_velocity = float(xv.get("narrative_velocity", 0))
    creator_concentration = float(xv.get("creator_concentration", 0))
    coordination = float(xv.get("coordination_risk", 0))

    volume_ratio = vol24 / max(mcap, 1)
    buy_imbalance = ((buys - sells) / max(buys + sells, 1)) * 100
    fdv_overhang = fdv / max(mcap, 1)

    confirmation = _clip(
        (max(p24, 0) * 0.35)
        + (max(p7d, 0) * 0.25)
        + (social_burst * 0.15)
        + (social_volume * 0.10)
        + (galaxy * 0.15)
    )

    fundamental = _clip(
        (min((mcap / 5_000_000_000) * 100, 100) * 0.20)
        + (min((tvl / 5_000_000_000) * 100, 100) * 0.35)
        + (min((fees / 10_000_000) * 100, 100) * 0.20)
        + (min((revenue / 5_000_000) * 100, 100) * 0.15)
        + (strength * 0.10)
    )

    social_coord = _clip(
        (tg_mentions * 0.25)
        + (tg_consensus * 0.25)
        + (narrative_velocity * 0.25)
        + ((100 - creator_concentration) * 0.10)
        + ((100 - coordination) * 0.15)
    )

    manipulation = _clip(
        (thin_liq * 0.16)
        + (_clip(volume_ratio * 180) * 0.12)
        + (_clip(-buy_imbalance) * 0.07)
        + (rug * 0.16)
        + (contract * 0.13)
        + (owner_priv * 0.10)
        + (blacklist * 0.08)
        + (honeypot * 0.08)
        + (crowded * 0.05)
        + (creator_concentration * 0.03)
        + (coordination * 0.02)
    )

    tradability = _clip(
        (min((liq / 4_000_000) * 100, 100) * 0.55)
        + ((100 - thin_liq) * 0.20)
        + ((100 - _clip(volume_ratio * 120)) * 0.05)
        + ((100 - abs(buy_imbalance)) * 0.05)
        + ((100 - (fdv_overhang - 1) * 40) * 0.05)
        + ((100 - (rug * 0.4 + contract * 0.6)) * 0.10)
    )

    bullish_impulse = _clip(
        (max(p24, 0) * 1.0)
        + (max(p7d, 0) * 0.8)
        + (max(p30d, 0) * 0.2)
        + (max(buy_imbalance, 0) * 0.5)
        + (confirmation * 0.35)
        + (social_coord * 0.25)
        + (fundamental * 0.20)
    )

    bearish_impulse = _clip(
        (max(-p24, 0) * 1.2)
        + (max(-p7d, 0) * 0.8)
        + (max(-p30d, 0) * 0.2)
        + (max(-buy_imbalance, 0) * 0.6)
        + (manipulation * 0.40)
        + ((100 - fundamental) * 0.15)
        + ((100 - social_coord) * 0.10)
        + (crowded * 0.10)
    )

    pump_prob = _clip(bullish_impulse - manipulation * 0.45 + tradability * 0.20)
    dump_prob = _clip(bearish_impulse + manipulation * 0.20 - confirmation * 0.10)

    return Scoring(
        pump_probability=round(pump_prob, 2),
        dump_probability=round(dump_prob, 2),
        confirmation_score=round(confirmation, 2),
        manipulation_risk=round(manipulation, 2),
        tradability_score=round(tradability, 2),
        fundamental_backing_score=round(fundamental, 2),
        social_coordination_score=round(social_coord, 2),
    )


def classify(signal: SignalInput) -> SignalOutput:
    s = compute_scores(signal)
    cg = signal.sources.coingecko
    gt = signal.sources.geckoterminal
    gp = signal.sources.goplus
    tg = signal.sources.telegram

    p24 = float(cg.get("price_change_24h", 0))
    p7d = float(cg.get("price_change_7d", 0))
    buy = float(gt.get("buys_24h", 0))
    sell = float(gt.get("sells_24h", 0))
    weak_bounce = p24 > -2 and p7d < -8
    volume_abnormal = float(cg.get("volume_24h", 0)) / max(float(cg.get("market_cap", 1)), 1) > 1.2
    distribution_signs = sell > buy * 1.2
    artificial_social = float(tg.get("consensus", 0)) > 70 and float(tg.get("crowded_trade_risk", 0)) > 65

    bullish_hard_block = any([
        p24 <= -5,
        p7d <= 1,
        s.social_coordination_score <= 15,
        s.manipulation_risk >= 65,
        max(float(gp.get("rug_risk", 0)), float(gp.get("contract_risk", 0))) >= 70,
        float(gt.get("thin_liquidity_risk", 0)) >= 70,
        s.tradability_score < 35,
    ])

    bearish_hard_gate = any([
        volume_abnormal,
        s.tradability_score < 38,
        weak_bounce,
        distribution_signs,
        s.manipulation_risk > 60,
        artificial_social,
    ])

    red_flags: list[str] = []
    if bullish_hard_block:
        red_flags.append("Bullish hard-gate active: context is too weak for Strong Pump.")
    if bearish_hard_gate:
        red_flags.append("Bearish hard-gate active: prioritize Distribution/Dump tests before Pump Watch.")
    if distribution_signs:
        red_flags.append("Buy/sell imbalance shows distribution pressure.")
    if float(gt.get("thin_liquidity_risk", 0)) > 65:
        red_flags.append("Thin DEX liquidity increases slippage and exit risk.")
    if float(gp.get("honeypot") or 0):
        red_flags.append("Potential honeypot flag from token security checks.")

    verdict = "noise"
    direction = "neutral"
    phase = "Observation"
    action: Literal["buy", "watch", "avoid", "take_profit", "sell"] = "watch"

    if bearish_hard_gate and s.dump_probability >= 70:
        verdict = "strong_dump"
        direction = "bearish"
        phase = "Capitulation"
        action = "sell"
    elif bearish_hard_gate and (distribution_signs or s.dump_probability >= 55):
        verdict = "distribution"
        direction = "bearish"
        phase = "Distribution"
        action = "take_profit"
    elif s.dump_probability >= 60:
        verdict = "dump_risk"
        direction = "bearish"
        phase = "Early Breakdown"
        action = "watch"
    elif not bullish_hard_block and s.pump_probability >= 75 and s.confirmation_score >= 60:
        verdict = "strong_pump"
        direction = "bullish"
        phase = "Markup"
        action = "buy"
    elif not bullish_hard_block and s.pump_probability >= 55:
        verdict = "pump_watch"
        direction = "bullish"
        phase = "Accumulation"
        action = "watch"
    elif s.manipulation_risk >= 75:
        verdict = "avoid"
        direction = "neutral"
        phase = "High Risk"
        action = "avoid"

    score = round(max(s.pump_probability, s.dump_probability), 2)
    timing = "immediate" if score >= 75 else "near-term" if score >= 55 else "wait"

    tp_pct = 14.0 if verdict in {"strong_pump", "pump_watch"} else 0.0
    sl_pct = 5.0 if verdict in {"strong_pump", "pump_watch"} else 0.0
    if verdict in {"distribution", "dump_risk", "strong_dump"}:
        tp_pct = -8.0
        sl_pct = 4.5

    preferred_venue = "major_centralized_exchange"
    if float(gt.get("dex_liquidity", 0)) > 1_000_000 and float(gt.get("thin_liquidity_risk", 0)) < 50:
        preferred_venue = "deep_dex_pool"

    why_now = (
        f"Pump {s.pump_probability:.0f}% vs dump {s.dump_probability:.0f}%, "
        f"confirmation {s.confirmation_score:.0f}, manipulation risk {s.manipulation_risk:.0f}."
    )

    confirms = [
        "24h + 7d trend alignment remains required for bullish continuation.",
        "Social confirmation must stay organic (Telegram + X, not only one channel).",
        "DEX liquidity and contract safety checks must remain healthy.",
    ]

    risk_note = "Tradability influences execution quality, but does not decide the verdict alone."
    execution_note = "Use staged entries/exits and reduce size when manipulation risk rises above 55."

    return SignalOutput(
        symbol=signal.symbol,
        name=signal.name,
        verdict=verdict,
        direction=direction,
        phase=phase,
        timing=timing,
        confidence=_confidence(score),
        score=score,
        pump_probability=s.pump_probability,
        dump_probability=s.dump_probability,
        confirmation_score=s.confirmation_score,
        manipulation_risk=s.manipulation_risk,
        tradability_score=s.tradability_score,
        fundamental_backing_score=s.fundamental_backing_score,
        social_coordination_score=s.social_coordination_score,
        action=action,
        tp_pct=tp_pct,
        sl_pct=sl_pct,
        why_now=why_now,
        what_confirms_it=confirms,
        risk_note=risk_note,
        red_flags=red_flags,
        preferred_venue=preferred_venue,
        execution_note=execution_note,
        source_mode="offline_fixture_or_manual_payload",
    )


app = FastAPI(title="PumpRadar Algorithm Lab", version="0.1.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/how-to-test")
def how_to_test() -> dict[str, Any]:
    return {
        "why_no_api_keys_needed": (
            "Algorithm lab runs in offline mode by default, using local fixtures "
            "or manual payloads sent to POST /score. No external API call is required."
        ),
        "quickstart": {
            "run_backend": "cd algo_lab/backend && uvicorn app:app --reload --port 8001",
            "run_frontend": "cd algo_lab/frontend && npm install && npm run dev",
            "backend_docs_url": "http://127.0.0.1:8001/docs",
            "frontend_url": "http://127.0.0.1:5179",
            "score_local_fixtures": "curl http://127.0.0.1:8001/score-fixtures",
            "score_manual_payload": (
                "curl -X POST http://127.0.0.1:8001/score "
                "-H 'Content-Type: application/json' "
                "-d '{\"symbol\":\"TEST\",\"name\":\"Test Coin\",\"sources\":{\"coingecko\":{},\"lunarcrush\":{},\"geckoterminal\":{},\"defillama\":{},\"goplus\":{},\"telegram\":{},\"x\":{}}}'"
            ),
        },
        "where_output_appears": [
            "API response directly in terminal when using curl commands.",
            "Swagger UI response panel at http://127.0.0.1:8001/docs.",
            "Frontend table/cards at http://127.0.0.1:5179.",
        ],
        "notes": [
            "This is intentional for deterministic algorithm calibration.",
            "You can later add live adapters per source behind optional API keys.",
        ],
    }


@app.get("/fixtures", response_model=list[SignalInput])
def get_fixtures() -> list[SignalInput]:
    raw = json.loads(FIXTURE_PATH.read_text())
    return [SignalInput.model_validate(item) for item in raw]


@app.post("/score", response_model=SignalOutput)
def score_signal(payload: SignalInput) -> SignalOutput:
    return classify(payload)


@app.get("/score-fixtures", response_model=list[SignalOutput])
def score_fixtures() -> list[SignalOutput]:
    fixtures = get_fixtures()
    return [classify(item) for item in fixtures]
