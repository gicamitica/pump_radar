from __future__ import annotations

import argparse
import json
import os
import time
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal

import pandas as pd
import requests
from dotenv import load_dotenv

try:
    from openai import OpenAI
except Exception:  # pragma: no cover
    OpenAI = None

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

BASE_DIR = Path(__file__).resolve().parents[1]
INPUT_DIR = BASE_DIR / "reporter" / "inputs"
OUTPUT_DIR = BASE_DIR / "reports" / "output"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

GT_API = "https://api.geckoterminal.com/api/v2"
DEFILLAMA_PROTOCOLS = "https://api.llama.fi/protocols"
GOPLUS_API = "https://api.gopluslabs.io/api/v1/token_security"

NETWORK_TO_CHAIN_ID = {
    "eth": "1",
    "bsc": "56",
    "polygon_pos": "137",
    "arbitrum": "42161",
    "optimism": "10",
    "base": "8453",
    "avax": "43114",
}


@dataclass
class Candidate:
    symbol: str
    name: str
    network: str
    token_address: str
    pool_address: str
    price_change_24h: float
    volume_24h: float
    liquidity_usd: float
    buys_24h: float
    sells_24h: float
    telegram_mentions: float
    telegram_consensus: float
    telegram_crowded_risk: float
    x_narrative_velocity: float
    x_coordination_risk: float
    x_creator_concentration: float
    tvl_usd: float
    fees_24h: float
    revenue_24h: float
    protocol_strength: float
    rug_pull_risk: float
    contract_risk: float
    honeypot_flag: bool
    pump_probability: float
    dump_probability: float
    ai_verdict: str
    action: str
    confidence: str
    why_now: str
    red_flags: str
    dex_link: str
    cex_link: str
    swap_link: str


def safe_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except Exception:
        return default


def load_json(path: Path) -> Any:
    if not path.exists():
        return []
    return json.loads(path.read_text())


def fetch_geckoterminal_candidates(limit: int = 30) -> list[dict[str, Any]]:
    networks = ["eth", "bsc", "base", "arbitrum", "solana"]
    items: list[dict[str, Any]] = []

    for net in networks:
        try:
            url = f"{GT_API}/networks/{net}/trending_pools?page=1"
            res = requests.get(url, timeout=30)
            res.raise_for_status()
            data = res.json().get("data", [])
            for row in data:
                attr = row.get("attributes", {})
                relationships = row.get("relationships", {})
                base_data = relationships.get("base_token", {}).get("data", {})
                items.append(
                    {
                        "network": net,
                        "symbol": attr.get("base_token_symbol", "UNKNOWN"),
                        "name": attr.get("name", attr.get("base_token_symbol", "Unknown")),
                        "token_address": base_data.get("id", "").split("_")[-1],
                        "pool_address": row.get("id", "").split("_")[-1],
                        "price_change_24h": safe_float(attr.get("price_change_percentage", {}).get("h24", 0)),
                        "volume_24h": safe_float(attr.get("volume_usd", {}).get("h24", 0)),
                        "liquidity_usd": safe_float(attr.get("reserve_in_usd", 0)),
                        "buys_24h": safe_float(attr.get("transactions", {}).get("h24", {}).get("buys", 0)),
                        "sells_24h": safe_float(attr.get("transactions", {}).get("h24", {}).get("sells", 0)),
                        "dex_link": attr.get("address", ""),
                    }
                )
        except Exception:
            continue

    dedup: dict[str, dict[str, Any]] = {}
    for row in items:
        key = f"{row['network']}:{row['token_address']}"
        if key not in dedup:
            dedup[key] = row

    sorted_items = sorted(dedup.values(), key=lambda r: r.get("volume_24h", 0), reverse=True)
    return sorted_items[:limit]


def fetch_defillama_index() -> dict[str, dict[str, Any]]:
    try:
        res = requests.get(DEFILLAMA_PROTOCOLS, timeout=45)
        res.raise_for_status()
        protocols = res.json()
    except Exception:
        return {}

    out: dict[str, dict[str, Any]] = {}
    for p in protocols:
        symbol = (p.get("symbol") or "").upper().strip()
        if not symbol:
            continue
        out[symbol] = {
            "tvl": safe_float(p.get("tvl", 0)),
            "fees_24h": safe_float(p.get("total24h", 0)),
            "revenue_24h": safe_float(p.get("totalRevenue24h", 0)),
            "protocol_strength": min(100.0, (safe_float(p.get("mcap", 0)) / max(safe_float(p.get("tvl", 1)), 1)) * 40),
        }
    return out


def fetch_goplus_risk(network: str, token_address: str) -> dict[str, Any]:
    chain_id = NETWORK_TO_CHAIN_ID.get(network)
    if not chain_id or not token_address:
        return {"rug_pull_risk": 60.0, "contract_risk": 60.0, "honeypot": False}

    try:
        res = requests.get(
            GOPLUS_API,
            params={"chain_id": chain_id, "contract_addresses": token_address},
            timeout=30,
        )
        res.raise_for_status()
        payload = res.json().get("result", {}).get(token_address.lower(), {})

        honeypot = payload.get("is_honeypot") == "1"
        owner_change = payload.get("owner_change_balance") == "1"
        blacklist = payload.get("is_blacklisted") == "1"
        can_take_back = payload.get("can_take_back_ownership") == "1"

        contract_risk = 20.0
        if owner_change:
            contract_risk += 25
        if can_take_back:
            contract_risk += 20

        rug_risk = 20.0
        if honeypot:
            rug_risk += 50
        if blacklist:
            rug_risk += 20

        return {
            "rug_pull_risk": min(100.0, rug_risk),
            "contract_risk": min(100.0, contract_risk),
            "honeypot": honeypot,
        }
    except Exception:
        return {"rug_pull_risk": 60.0, "contract_risk": 60.0, "honeypot": False}


def read_signal_inputs(file_name: str, symbol_key: str = "symbol") -> dict[str, dict[str, Any]]:
    rows = load_json(INPUT_DIR / file_name)
    out: dict[str, dict[str, Any]] = {}
    for row in rows:
        symbol = (row.get(symbol_key) or "").upper().strip()
        if symbol:
            out[symbol] = row
    return out


def heuristic_ai_eval(row: dict[str, Any]) -> dict[str, Any]:
    p24 = safe_float(row.get("price_change_24h"))
    buys = safe_float(row.get("buys_24h"))
    sells = safe_float(row.get("sells_24h"))
    liq = safe_float(row.get("liquidity_usd"))
    rug = safe_float(row.get("rug_pull_risk"))
    contract_risk = safe_float(row.get("contract_risk"))
    t_cons = safe_float(row.get("telegram_consensus"))
    x_coord = safe_float(row.get("x_coordination_risk"))

    imbalance = ((buys - sells) / max(buys + sells, 1)) * 100

    pump = max(0, min(100, p24 * 2 + max(imbalance, 0) * 0.8 + t_cons * 0.25 + (100 - x_coord) * 0.2 + min(liq / 50_000, 20)))
    dump = max(0, min(100, abs(min(p24, 0)) * 2.3 + max(-imbalance, 0) * 0.8 + rug * 0.45 + contract_risk * 0.35 + x_coord * 0.2))

    if dump >= 75:
        verdict = "strong_dump_or_rug_risk"
        action = "sell_or_avoid"
    elif dump >= 60:
        verdict = "dump_risk"
        action = "watch_or_take_profit"
    elif pump >= 70 and rug < 45 and contract_risk < 45:
        verdict = "imminent_pump_candidate"
        action = "watch_entry"
    else:
        verdict = "noise_or_distribution"
        action = "watch"

    confidence = "high" if max(pump, dump) >= 75 else "medium" if max(pump, dump) >= 55 else "low"
    return {
        "pump_probability": round(pump, 2),
        "dump_probability": round(dump, 2),
        "ai_verdict": verdict,
        "action": action,
        "confidence": confidence,
        "why_now": f"24h={p24:.2f}%, imbalance={imbalance:.1f}, rug={rug:.1f}, contract={contract_risk:.1f}",
    }


def openai_eval(row: dict[str, Any], model: str | None = None) -> dict[str, Any]:
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key or OpenAI is None:
        return heuristic_ai_eval(row)

    client = OpenAI(api_key=api_key)
    selected_model = model or os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    prompt = (
        "Evaluate this coin for imminent pump or dump/rug risk and return strict JSON with keys: "
        "pump_probability,dump_probability,ai_verdict,action,confidence,why_now.\n"
        f"DATA: {json.dumps(row)}"
    )

    try:
        resp = client.responses.create(model=selected_model, input=prompt, temperature=0.2)
        text = resp.output_text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        parsed = json.loads(text)
        return {
            "pump_probability": safe_float(parsed.get("pump_probability")),
            "dump_probability": safe_float(parsed.get("dump_probability")),
            "ai_verdict": str(parsed.get("ai_verdict", "noise_or_distribution")),
            "action": str(parsed.get("action", "watch")),
            "confidence": str(parsed.get("confidence", "low")),
            "why_now": str(parsed.get("why_now", "AI response")),
        }
    except Exception:
        return heuristic_ai_eval(row)


def build_trade_links(network: str, token_address: str, pool_address: str, symbol: str) -> dict[str, str]:
    dex_link = f"https://www.geckoterminal.com/{network}/pools/{pool_address}" if pool_address else ""
    swap_link = ""
    if token_address and network in {"eth", "base", "arbitrum"}:
        swap_link = f"https://app.uniswap.org/#/swap?outputCurrency={token_address}&chain={network}"
    elif token_address and network == "bsc":
        swap_link = f"https://pancakeswap.finance/swap?outputCurrency={token_address}"

    cex_link = f"https://www.bybit.com/en-US/trade/spot/{symbol}USDT" if symbol else ""
    return {"dex_link": dex_link, "cex_link": cex_link, "swap_link": swap_link}


def build_rows(use_ai: bool = True) -> list[Candidate]:
    telegram = read_signal_inputs("telegram_signals.json")
    xsignals = read_signal_inputs("x_signals.json")
    dl_index = fetch_defillama_index()
    gt_rows = fetch_geckoterminal_candidates(limit=35)

    rows: list[Candidate] = []
    for base in gt_rows:
        symbol = (base.get("symbol") or "").upper()
        dl = dl_index.get(symbol, {})
        tg = telegram.get(symbol, {})
        xs = xsignals.get(symbol, {})
        gp = fetch_goplus_risk(base.get("network", ""), base.get("token_address", ""))

        merged = {
            **base,
            "telegram_mentions": safe_float(tg.get("mentions", 0)),
            "telegram_consensus": safe_float(tg.get("consensus", 0)),
            "telegram_crowded_risk": safe_float(tg.get("crowded_risk", 0)),
            "x_narrative_velocity": safe_float(xs.get("narrative_velocity", 0)),
            "x_coordination_risk": safe_float(xs.get("coordination_risk", 0)),
            "x_creator_concentration": safe_float(xs.get("creator_concentration", 0)),
            "tvl_usd": safe_float(dl.get("tvl", 0)),
            "fees_24h": safe_float(dl.get("fees_24h", 0)),
            "revenue_24h": safe_float(dl.get("revenue_24h", 0)),
            "protocol_strength": safe_float(dl.get("protocol_strength", 0)),
            "rug_pull_risk": safe_float(gp.get("rug_pull_risk", 60)),
            "contract_risk": safe_float(gp.get("contract_risk", 60)),
            "honeypot_flag": bool(gp.get("honeypot", False)),
        }

        ai = openai_eval(merged) if use_ai else heuristic_ai_eval(merged)
        links = build_trade_links(merged["network"], merged["token_address"], merged["pool_address"], symbol)

        red_flags = []
        if merged["rug_pull_risk"] > 65:
            red_flags.append("high_rug_risk")
        if merged["contract_risk"] > 65:
            red_flags.append("high_contract_risk")
        if merged["telegram_crowded_risk"] > 70:
            red_flags.append("crowded_trade")

        rows.append(
            Candidate(
                symbol=symbol,
                name=merged.get("name", symbol),
                network=merged.get("network", ""),
                token_address=merged.get("token_address", ""),
                pool_address=merged.get("pool_address", ""),
                price_change_24h=merged["price_change_24h"],
                volume_24h=merged["volume_24h"],
                liquidity_usd=merged["liquidity_usd"],
                buys_24h=merged["buys_24h"],
                sells_24h=merged["sells_24h"],
                telegram_mentions=merged["telegram_mentions"],
                telegram_consensus=merged["telegram_consensus"],
                telegram_crowded_risk=merged["telegram_crowded_risk"],
                x_narrative_velocity=merged["x_narrative_velocity"],
                x_coordination_risk=merged["x_coordination_risk"],
                x_creator_concentration=merged["x_creator_concentration"],
                tvl_usd=merged["tvl_usd"],
                fees_24h=merged["fees_24h"],
                revenue_24h=merged["revenue_24h"],
                protocol_strength=merged["protocol_strength"],
                rug_pull_risk=merged["rug_pull_risk"],
                contract_risk=merged["contract_risk"],
                honeypot_flag=merged["honeypot_flag"],
                pump_probability=ai["pump_probability"],
                dump_probability=ai["dump_probability"],
                ai_verdict=ai["ai_verdict"],
                action=ai["action"],
                confidence=ai["confidence"],
                why_now=ai["why_now"],
                red_flags=",".join(red_flags),
                dex_link=links["dex_link"],
                cex_link=links["cex_link"],
                swap_link=links["swap_link"],
            )
        )

    rows.sort(key=lambda r: max(r.pump_probability, r.dump_probability), reverse=True)
    return rows


def export_excel(rows: list[Candidate]) -> Path:
    ts = datetime.now(timezone.utc)
    file_name = f"suspicious_signals_{ts.strftime('%Y%m%d_%H00')}.xlsx"
    out_path = OUTPUT_DIR / file_name
    latest_path = OUTPUT_DIR / "latest.xlsx"

    data = []
    for row in rows:
        d = asdict(row)
        d["generated_at_utc"] = ts.isoformat()
        d["trading_links"] = " | ".join([x for x in [row.dex_link, row.cex_link, row.swap_link] if x])
        data.append(d)

    df = pd.DataFrame(data)
    df.to_excel(out_path, index=False)
    df.to_excel(latest_path, index=False)
    return out_path


def run_once(use_ai: bool = True) -> Path:
    rows = build_rows(use_ai=use_ai)
    return export_excel(rows)


def run_hourly(use_ai: bool = True) -> None:
    while True:
        try:
            path = run_once(use_ai=use_ai)
            print(f"[OK] Report generated: {path}")
        except Exception as exc:
            print(f"[ERROR] hourly run failed: {exc}")
        time.sleep(3600)


def main() -> None:
    parser = argparse.ArgumentParser(description="Hourly suspicious pump/dump reporter")
    parser.add_argument("--once", action="store_true", help="Run one report and exit")
    parser.add_argument("--no-ai", action="store_true", help="Force heuristic mode without LLM")
    parser.add_argument("--require-ai", action="store_true", help="Fail fast if OPENAI_API_KEY is missing")
    args = parser.parse_args()

    use_ai = not args.no_ai
    if args.require_ai and not os.getenv("OPENAI_API_KEY", "").strip():
        raise RuntimeError("OPENAI_API_KEY missing. Set it in algo_lab/.env or environment before running --require-ai.")

    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    if use_ai and os.getenv("OPENAI_API_KEY", "").strip():
        print(f"[AI] OpenAI enabled with model={model}")
    elif use_ai:
        print("[AI] OPENAI_API_KEY missing -> using heuristic fallback.")

    if args.once:
        path = run_once(use_ai=use_ai)
        print(path)
        return

    run_hourly(use_ai=use_ai)


if __name__ == "__main__":
    main()
