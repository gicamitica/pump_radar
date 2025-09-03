"""
Pump Radar 08:30 – Generator Excel
----------------------------------
✔ Rulează în GitHub Actions sau local
✔ Ia date din CoinGecko (market, volum)
✔ Încearcă LunarCrush pentru social (simulat dacă lipsesc date)
✔ Aplică filtre (market cap, volum, creștere volum, social)
✔ Dacă nimic nu trece → fallback: Top 5 după creștere volum
✔ Generează Excel (Sheet1 top monede, Sheet2 legendă)
✔ Praguri configurabile prin ENV (STRICT_FILTERS, SOCIAL_REQUIRED, etc.)
"""

import os, sys, requests, datetime
import pandas as pd
from typing import List, Tuple

# ---------- CONFIG ----------
OUTDIR = os.getcwd()

# ---------- LOG ----------
def log(msg: str):
    sys.stderr.write(msg + "\n")

# ---------- CoinGecko ----------
def cg_get_markets(vs="usd", per_page=100, page=1):
    url = f"https://api.coingecko.com/api/v3/coins/markets"
    params = {
        "vs_currency": vs,
        "order": "market_cap_asc",
        "per_page": per_page,
        "page": page,
        "price_change_percentage": "24h",
    }
    r = requests.get(url, params=params, timeout=30)
    r.raise_for_status()
    return r.json()

def cg_get_market_chart_volumes_48h(coin_id: str, vs="usd") -> Tuple[float,float]:
    url = f"https://api.coingecko.com/api/v3/coins/{coin_id}/market_chart"
    params = {"vs_currency": vs, "days": 2, "interval": "hourly"}
    r = requests.get(url, params=params, timeout=30)
    r.raise_for_status()
    data = r.json()
    vols = [v[1] for v in data.get("total_volumes", [])]
    if len(vols) < 48:
        return (0.0,0.0)
    return (sum(vols[:24])/24, sum(vols[24:])/24)

# ---------- LunarCrush (mock simplu) ----------
def lc_get_social(symbol: str) -> Tuple[int,float]:
    # simulare fallback – aici ai pune requests la API real
    fake = {
        "BTC": (500, 70.0),
        "ETH": (300, 65.0),
        "SOL": (150, 60.0),
    }
    return fake.get(symbol.upper(), (0,0.0))

# ---------- ENV helpers ----------
def _env_float(k, d): 
    try: return float(os.environ.get(k, "").strip() or d)
    except: return d
def _env_int(k, d):
    try: return int(float(os.environ.get(k, "").strip() or d))
    except: return d
def _env_bool(k, d=False):
    v = (os.environ.get(k, "") or "").strip().lower()
    if v in ("1","true","yes","y","on"): return True
    if v in ("0","false","no","n","off"): return False
    return d

# ---------- Build candidates ----------
def build_candidates_from_api(limit_pages: int = 1, per_page: int = 200) -> List[dict]:
    mcap_max          = _env_float("MCAP_MAX",          50_000_000)
    vol_min           = _env_float("VOL_MIN",             500_000)
    vol_growth_min    = _env_float("VOL_GROWTH_MIN",          30.0)
    social_min        = _env_int  ("SOCIAL_MIN",               100)
    sentiment_min     = _env_float("SENTIMENT_MIN",            65.0)
    require_social    = _env_bool ("SOCIAL_REQUIRED",          True)
    strict_filters    = _env_bool ("STRICT_FILTERS",           True)
    top_n_fallback    = _env_int  ("TOP_FALLBACK",               5)

    coins: List[dict] = []
    for page in range(1, limit_pages+1):
        try:
            rows = cg_get_markets(per_page=per_page, page=page)
            coins.extend(rows)
        except Exception as e:
            log(f"[ERR] cg_get_markets: {e}")

    def _growth_for(coin_id: str) -> Tuple[float,float,float]:
        try:
            prev24,last24 = cg_get_market_chart_volumes_48h(coin_id)
            if prev24 <= 0: return (0.0,0.0,0.0)
            return ((last24-prev24)/prev24*100.0, prev24,last24)
        except Exception:
            return (0.0,0.0,0.0)

    out: List[dict] = []
    for c in coins:
        try:
            mcap = float(c.get("market_cap") or 0)
            vol  = float(c.get("total_volume") or 0)
            if not (mcap < mcap_max and vol > vol_min):
                continue
            coin_id = c.get("id")
            symbol  = (c.get("symbol") or "").upper()
            name    = c.get("name") or symbol
            growth_pct, prev24,last24 = _growth_for(coin_id)
            if growth_pct < vol_growth_min:
                continue
            mentions, sentiment = lc_get_social(symbol)
            if require_social and (mentions < social_min or sentiment < sentiment_min):
                continue
            out.append({
                "name": name, "symbol": symbol,
                "market_cap": mcap,
                "volume_24h": last24,
                "vol_growth_24h_pct": growth_pct,
                "social_mentions_24h": mentions,
                "sentiment_pct": sentiment,
            })
        except Exception as e:
            log(f"[WARN] skip coin: {e}")
            continue

    if not out:
        log("[INFO] Nicio monedă nu a trecut filtrele. Fallback: Top volum growth (ignorat social).")
        backup: List[dict] = []
        for c in coins:
            try:
                mcap = float(c.get("market_cap") or 0)
                vol  = float(c.get("total_volume") or 0)
                if not (mcap < mcap_max and vol > vol_min):
                    continue
                symbol = (c.get("symbol") or "").upper()
                name   = c.get("name") or symbol
                growth_pct, prev24,last24 = _growth_for(c.get("id"))
                if growth_pct <= 0: continue
                backup.append({
                    "name": name, "symbol": symbol,
                    "market_cap": mcap,
                    "volume_24h": last24,
                    "vol_growth_24h_pct": growth_pct,
                    "social_mentions_24h": 0,
                    "sentiment_pct": 0.0,
                })
            except: continue
        backup.sort(key=lambda x: (x["vol_growth_24h_pct"], x["volume_24h"]), reverse=True)
        out = backup[:top_n_fallback]

    out.sort(key=lambda x: (x["vol_growth_24h_pct"], x["volume_24h"]), reverse=True)
    log(f"[INFO] Candideți selectați: {len(out)}")
    return out[:5]

# ---------- Excel ----------
def make_excel(cands: List[dict], outdir: str = OUTDIR) -> str:
    if not cands:
        cands = []
    df = pd.DataFrame(cands)
    today = datetime.datetime.now().strftime("%d-%m-%Y")
    fname = f"Pump_Radar_{today}_0830.xlsx"
    fpath = os.path.join(outdir, fname)
    with pd.ExcelWriter(fpath, engine="openpyxl") as writer:
        df.to_excel(writer, sheet_name="Top5", index=False)
        legend = pd.DataFrame([{
            "Coloane":
            "Coin, Market Cap, Volum 24h, Creștere Volum 24h, Social Mentions 24h, Sentiment%, Utilitate, Red Flags, Verdict"
        }])
        legend.to_excel(writer, sheet_name="Legendă", index=False)
    log(f"[OK] Raport salvat: {fpath}")
    return fpath

# ---------- Main ----------
def main():
    cands = build_candidates_from_api(limit_pages=1, per_page=100)
    make_excel(cands)

if __name__ == "__main__":
    main()
