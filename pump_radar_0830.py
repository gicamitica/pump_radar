"""
Pump Radar 08:30 – robust Excel (CG header + fallback)
"""

import os, sys, datetime, requests
import pandas as pd
from typing import List, Tuple

OUTDIR = os.getcwd()

def log(msg: str): sys.stderr.write(msg + "\n")

CG_KEY = (os.environ.get("COINGECKO_API_KEY") or "").strip()
CG_HEADERS = {"x-cg-demo-api-key": CG_KEY} if CG_KEY else {}

def cg_get_markets(vs="usd", per_page=200, page=1) -> List[dict]:
    url = "https://api.coingecko.com/api/v3/coins/markets"
    params = {
        "vs_currency": vs,
        "order": "volume_desc",      # volum desc pt candidați cu lichiditate
        "per_page": per_page,
        "page": page,
        "price_change_percentage": "24h",
    }
    r = requests.get(url, params=params, headers=CG_HEADERS, timeout=30)
    r.raise_for_status()
    data = r.json() or []
    if not isinstance(data, list): return []
    return data

def cg_get_market_chart_volumes_48h(coin_id: str, vs="usd") -> Tuple[float, float]:
    """
    Returnează (avg prev 24h, avg last 24h). Robust la liste mai scurte.
    """
    url = f"https://api.coingecko.com/api/v3/coins/{coin_id}/market_chart"
    params = {"vs_currency": vs, "days": 2, "interval": "hourly"}
    r = requests.get(url, params=params, headers=CG_HEADERS, timeout=30)
    if r.status_code == 401:
        log(f"[WARN] 401 market_chart {coin_id} – setează COINGECKO_API_KEY în Secrets.")
        return (0.0, 0.0)
    r.raise_for_status()
    data = r.json() or {}
    vols = [v[1] for v in data.get("total_volumes", []) if isinstance(v, list) and len(v) >= 2]
    if len(vols) < 2:
        return (0.0, 0.0)
    half = max(1, len(vols)//2)
    prev = sum(vols[:half]) / max(1, len(vols[:half]))
    last = sum(vols[half:]) / max(1, len(vols[half:]))
    return (float(prev), float(last))

# --- ENV helpers ---
def _env_float(k, d):
    try: return float((os.environ.get(k) or "").strip() or d)
    except: return d
def _env_int(k, d):
    try: return int(float((os.environ.get(k) or "").strip() or d))
    except: return d
def _env_bool(k, d=False):
    v = (os.environ.get(k) or "").strip().lower()
    if v in ("1","true","yes","y","on"): return True
    if v in ("0","false","no","n","off"): return False
    return d

# --- LunarCrush MOCK (poți înlocui cu API real) ---
def lc_get_social(symbol: str) -> Tuple[int, float]:
    # Dacă vrei API real, pune requests aici; pentru stabilitate, mock:
    base = {"BTC": (500, 70.0), "ETH": (300, 66.0), "SOL": (150, 62.0)}
    return base.get(symbol.upper(), (0, 0.0))

def build_candidates_from_api(limit_pages: int = 1, per_page: int = 200) -> List[dict]:
    mcap_max       = _env_float("MCAP_MAX",       50_000_000)
    vol_min        = _env_float("VOL_MIN",          500_000)
    vol_growth_min = _env_float("VOL_GROWTH_MIN",        30.0)
    social_min     = _env_int  ("SOCIAL_MIN",             100)
    sentiment_min  = _env_float("SENTIMENT_MIN",          65.0)
    require_social = _env_bool ("SOCIAL_REQUIRED",        True)
    top_n          = _env_int  ("TOP_FALLBACK",             5)
    strict         = _env_bool ("STRICT_FILTERS",          True)

    coins: List[dict] = []
    for p in range(1, limit_pages+1):
        try:
            coins += cg_get_markets(per_page=per_page, page=p)
        except Exception as e:
            log(f"[WARN] cg_get_markets p{p}: {e}")

    def _growth(coin_id: str) -> Tuple[float, float, float]:
        prev, last = cg_get_market_chart_volumes_48h(coin_id)
        if prev <= 0 or last <= 0: return (0.0, prev, last)
        return ((last - prev) / prev * 100.0, prev, last)

    out: List[dict] = []
    for c in coins:
        try:
            mcap = float(c.get("market_cap") or 0)
            vol  = float(c.get("total_volume") or 0)
            if not (mcap < mcap_max and vol > vol_min): continue
            coin_id = c.get("id"); symbol = (c.get("symbol") or "").upper()
            name    = c.get("name") or symbol
            g, prev, last = _growth(coin_id)
            if g < vol_growth_min: continue
            mentions, sent = lc_get_social(symbol)
            if require_social and (mentions < social_min or sent < sentiment_min): continue
            out.append({
                "Coin": f"{name} ({symbol})",
                "Market Cap": mcap,
                "Volum 24h": last,
                "Creștere Volum 24h": g,
                "Social Mentions 24h": mentions,
                "Sentiment %": sent,
                "Utilitate & Catalysts": "",
                "Red Flags": "",
                "Verdict": "WATCH",
            })
        except Exception as e:
            log(f"[WARN] skip {c.get('id')}: {e}")

    if not out:
        log("[INFO] Nicio monedă nu a trecut filtrele → Fallback: Top volum growth (ignor social).")
        backup: List[dict] = []
        for c in coins:
            try:
                mcap = float(c.get("market_cap") or 0)
                vol  = float(c.get("total_volume") or 0)
                if strict:
                    if not (mcap < mcap_max and vol > vol_min): continue
                coin_id = c.get("id"); symbol = (c.get("symbol") or "").upper()
                name    = c.get("name") or symbol
                g, prev, last = _growth(coin_id)
                if g <= 0: continue
                backup.append({
                    "Coin": f"{name} ({symbol})",
                    "Market Cap": mcap,
                    "Volum 24h": last,
                    "Creștere Volum 24h": g,
                    "Social Mentions 24h": 0,
                    "Sentiment %": 0.0,
                    "Utilitate & Catalysts": "",
                    "Red Flags": "",
                    "Verdict": "WATCH",
                })
            except Exception:
                continue
        backup.sort(key=lambda x: (x["Creștere Volum 24h"], x["Volum 24h"]), reverse=True)
        out = backup[:top_n]

    out.sort(key=lambda x: (x["Creștere Volum 24h"], x["Volum 24h"]), reverse=True)
    log(f"[INFO] Candideți selectați: {len(out)}")
    return out

def make_excel(rows: List[dict], outdir: str = OUTDIR) -> str:
    today = datetime.datetime.now().strftime("%d-%m-%Y")
    fname = f"Pump_Radar_{today}_0830.xlsx"
    fpath = os.path.join(outdir, fname)

    # dacă e gol, scriem un rând de informare ca să NU fie foaie goală
    if not rows:
        rows = [{
            "Coin": "—",
            "Market Cap": 0,
            "Volum 24h": 0,
            "Creștere Volum 24h": 0,
            "Social Mentions 24h": 0,
            "Sentiment %": 0.0,
            "Utilitate & Catalysts": "No candidates (rate-limit/filtre).",
            "Red Flags": "-",
            "Verdict": "WATCH",
        }]

    df = pd.DataFrame(rows)
    with pd.ExcelWriter(fpath, engine="openpyxl") as w:
        df.to_excel(w, sheet_name="Top 5", index=False)
        legend = pd.DataFrame({
            "Coloană": ["Coin","Market Cap","Volum 24h","Creștere Volum 24h","Social Mentions 24h","Sentiment %","Utilitate & Catalysts","Red Flags","Verdict"],
            "Descriere": [
                "Nume + simbol",
                "Capitalizare piață (USD)",
                "Volum ultimele 24h (USD)",
                "% creștere volum vs 24h precedente (medii orare)",
                "Mențiuni social în 24h",
                "Procent postări pozitive",
                "Utilitate + catalizatori",
                "Avertismente",
                "BUY / WATCH / AVOID"
            ],
        })
        legend.to_excel(w, sheet_name="Legenda", index=False)
    log(f"[OK] Raport salvat: {fpath}")
    return fpath

def main():
    cands = build_candidates_from_api(limit_pages=1, per_page=200)
    make_excel(cands)

if __name__ == "__main__":
    main()
