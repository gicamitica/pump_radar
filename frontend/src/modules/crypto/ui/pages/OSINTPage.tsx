import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from 'react-router-dom';
import { useService } from '@/app/providers/useDI';
import { AUTH_SYMBOLS } from '@/modules/auth/di/symbols';
import type { IAuthService } from '@/modules/auth/application/ports/IAuthService';

// Reuses your existing aggregation endpoint: GET /api/crypto/osint/{chain}/{address}
// and GET /api/crypto/signals-v2 (for Recent Scans + query resolution).
// Touches no backend logic — read-only consumer.

const API: string = ((import.meta as any).env?.VITE_API_BASE_URL as string) || "";

type AnyObj = Record<string, any>;

// ---------- formatting helpers (all null-safe) ----------
const nfUsd = (v: any, d = 2): string => {
  const n = Number(v);
  if (!isFinite(n)) return "N/A";
  if (n >= 1e9) return "$" + (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return "$" + (n / 1e3).toFixed(2) + "K";
  if (n > 0 && n < 0.01) return "$" + n.toPrecision(4);
  return "$" + n.toFixed(d);
};
const nfInt = (v: any): string => {
  const n = Number(v);
  return isFinite(n) ? n.toLocaleString("en-US") : "N/A";
};
const pct = (v: any, d = 1): string => {
  const n = Number(v);
  return isFinite(n) ? n.toFixed(d) + "%" : "N/A";
};
const riskColor = (lvl?: string) =>
  lvl === "HIGH" ? "var(--o-red)" : lvl === "MEDIUM" ? "var(--o-yellow)" : lvl === "LOW" ? "var(--o-green)" : "var(--o-muted)";

const deriveScanRisk = (s: AnyObj): "LOW" | "MEDIUM" | "HIGH" => {
  const mp = Number(s?.manipulation_probability) || 0;
  const dr = String(s?.dump_risk_level || "").toLowerCase();
  if (dr === "high" || mp >= 60) return "HIGH";
  if (dr === "medium" || mp >= 30) return "MEDIUM";
  return "LOW";
};

function CoinIcon({ srcs, symbol, big }: { srcs: (string | null | undefined)[]; symbol?: string; big?: boolean }) {
  const list = (srcs || []).filter(Boolean) as string[];
  const [idx, setIdx] = useState(0);
  if (idx >= list.length) return <>{(symbol || "?").slice(0, 1).toUpperCase()}</>;
  return <img src={list[idx]} alt="" onError={() => setIdx((i) => i + 1)} style={{ width: "100%", height: "100%", borderRadius: big ? 12 : "50%", objectFit: "cover" }} />;
}

export default function OSINTPage() {
  const _navigate = useNavigate();
  const _auth = useService<IAuthService>(AUTH_SYMBOLS.IAuthService);
  const _currentUser = _auth.getCurrentUser() as any;
  const _userSub = (_currentUser?.subscription || 'free').toLowerCase();
  const _isProUser = _userSub === 'monthly' || _userSub === 'annual' || _userSub === 'trial' || _userSub === 'active' || _userSub === 'pro';
  if (!_isProUser) {
    return (
      <div style={{maxWidth:900,margin:'40px auto',padding:'32px 16px',fontFamily:"'Space Grotesk',system-ui,sans-serif"}}>
        <button onClick={() => _navigate(-1)} style={{background:'transparent',border:'1px solid #26314a',color:'#7d88a3',padding:'8px 14px',borderRadius:10,cursor:'pointer',fontSize:13,marginBottom:24}}>← Back</button>
        <div style={{background:'linear-gradient(135deg,#161b27,#0c121c)',border:'1px solid #6366f1',borderRadius:20,padding:'48px 32px',textAlign:'center'}}>
          <div style={{fontSize:56,marginBottom:16}}>🔒</div>
          <h1 style={{color:'#fff',fontSize:28,fontWeight:700,margin:'0 0 12px'}}>Token OSINT Lab is a Pro feature</h1>
          <p style={{color:'#a5b4fc',fontSize:15,margin:'0 0 24px',maxWidth:520,marginLeft:'auto',marginRight:'auto'}}>Deep on-chain intelligence: contract security scans, holder distribution, LP locks, honeypot detection and AI risk analysis. Upgrade to unlock.</p>
          <button onClick={() => _navigate('/subscription')} style={{background:'linear-gradient(135deg,#6366f1,#4f46e5)',color:'#fff',border:'none',padding:'14px 32px',borderRadius:12,fontSize:15,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 16px rgba(99,102,241,0.4)'}}>Start 7-day free trial</button>
        </div>
      </div>
    );
  }
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnyObj | null>(null);
  const [signals, setSignals] = useState<AnyObj[]>([]);

  // Load latest signals once: powers Recent Scans + resolves symbol -> chain/address
  useEffect(() => {
    let alive = true;
    fetch(`${API}/api/crypto/signals-v2`)
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        const d = j?.data || {};
        const all = [
          ...(d.pump_signals || []), ...(d.dump_signals || []), ...(d.risk_signals || []),
          ...(d.watch_signals || []), ...(d.dex_signals || []), ...(d.early_signals || []),
        ].filter((x) => x && x.symbol);
        setSignals(all);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const resolve = useCallback((q: string): { chain: string; address: string } | null => {
    const s = q.trim();
    if (!s) return null;
    const lower = s.toLowerCase();
    const hit = signals.find(
      (x) => String(x.symbol || "").toLowerCase() === lower || String(x.token_address || "").toLowerCase() === lower
    );
    if (hit && hit.token_address) return { chain: hit.network || "eth", address: hit.token_address };
    const m = s.match(/(?:dexscreener\.com|geckoterminal\.com)\/([a-z-]+)\/(?:pools\/)?([0-9a-zA-Zx]+)/i);
    if (m) return { chain: m[1], address: m[2] };
    if (/^0x[0-9a-fA-F]{40}$/.test(s)) return { chain: "eth", address: s };
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s)) return { chain: "solana", address: s };
    return null;
  }, [signals]);

  const runScan = useCallback(async (q?: string) => {
    const term = (q ?? query).trim();
    if (!term) return;
    setQuery(term);
    const NATIVE = ["BTC","ETH","SOL","BNB","XRP","ADA","DOGE","TRX","DOT","LTC","BCH","XLM","XMR","ETC","TON","AVAX","ATOM","NEAR","ALGO","HBAR","EGLD","XTZ","FIL","VET","ICP","FLOW","EOS","KAS","ZEC","DASH","KSM","MINA","XEC","IOTA","NANO"];
    const NATIVE_NAMES = ["bitcoin","ethereum","solana","binance coin","bnb","ripple","cardano","dogecoin","tron","polkadot","litecoin","bitcoin cash","stellar","monero","ethereum classic","toncoin","the open network","avalanche","cosmos","near protocol","algorand","hedera","multiversx","elrond","tezos","filecoin","vechain","internet computer","flow","eos","kaspa","zcash","dash"];
    const _q = term.trim().toUpperCase();
    const _qn = term.trim().toLowerCase();
    if (NATIVE.includes(_q) || NATIVE_NAMES.includes(_qn)) {
      setError(_q + " is a native coin without a token contract, so on-chain analysis isnt available. Try a token like AAVE, PEPE or UNI.");
      setData(null);
      return;
    }
    let r = resolve(term);
    if (!r) {
      try {
        setLoading(true);
        const _tok1 = JSON.parse(localStorage.getItem('pumpradar_auth_token') || 'null'); const rr = await fetch(`${API}/api/crypto/osint-resolve/${encodeURIComponent(term)}`, { headers: _tok1 ? { Authorization: `Bearer ${_tok1}` } : {} });
        const jj = await rr.json();
        const d = jj?.data;
        if (d?.found && d.chain && d.address) r = { chain: d.chain, address: d.address };
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    if (!r) {
      setError("Couldn't identify that token. Try a symbol from current signals, a 0x… contract, or a DexScreener/GeckoTerminal URL.");
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const _tok2 = JSON.parse(localStorage.getItem('pumpradar_auth_token') || 'null'); const res = await fetch(`${API}/api/crypto/osint/${encodeURIComponent(r.chain)}/${encodeURIComponent(r.address)}`, { headers: _tok2 ? { Authorization: `Bearer ${_tok2}` } : {} });
      const j = await res.json();
      const d = j?.data || null;
      setData(d);
      if (d && !d.found && !d?.holders?.available) {
        setError("No recent signal and no holder data for this token yet.");
      }
    } catch (e: any) {
      setError("Scan failed: " + (e?.message || "unknown error"));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [query, resolve]);

  // ---------- derived view models ----------
  const tok = data?.token || {};
  const mkt = data?.market || {};
  const ver = data?.verdict || {};
  const meta = data?.signal_meta || {};
  const holders = data?.holders || {};
  const sec = data?.security || {};
  const soc = data?.social || {};
  const cg = data?.market_extra || {};
  const dep = data?.deployer || {};
  const cgMetrics: any = (data as any)?.cg_metrics || {};
  const chartMeta: any = (data as any)?.chart_meta || {};
  const riskLvl: string = ver?.risk_level || "UNKNOWN";

  const buyPct = useMemo(() => {
    const r = Number(mkt?.buy_sell_ratio_h1);
    if (!isFinite(r) || r <= 0) return null;
    return Math.min(95, Math.max(5, (r / (1 + r)) * 100));
  }, [mkt?.buy_sell_ratio_h1]);

  // Top holders donut buckets from real top_holders[]
  const donut = useMemo(() => {
    const th: AnyObj[] = Array.isArray(holders?.top_holders) ? holders.top_holders : [];
    const p = (i: number, j: number) =>
      th.slice(i, j).reduce((a, h) => a + (Number(h?.pct) || 0), 0);
    const top1 = p(0, 1), top2_5 = p(1, 5), top6_10 = p(5, 10), top11_20 = p(10, 20);
    const top20 = top1 + top2_5 + top6_10 + top11_20;
    const others = Math.max(0, 100 - top20);
    const segs = [
      { k: "Top 1", v: top1, c: "#38bdf8" },
      { k: "Top 2-5", v: top2_5, c: "#3b82f6" },
      { k: "Top 6-10", v: top6_10, c: "#22c55e" },
      { k: "Top 11-20", v: top11_20, c: "#f97316" },
      { k: "Others", v: others, c: "#6b7689" },
    ];
    return { segs, hasData: th.length > 0, center: holders?.concentration_top10 };
  }, [holders]);

  const recent = useMemo(() => (Array.isArray((data as any)?.recent) && (data as any).recent.length ? (data as any).recent : signals.slice(0, 6)), [data, signals]);

  const embedUrl = useMemo(() => {
    const u = mkt?.pool_url;
    if (!u || typeof u !== "string" || !u.includes("geckoterminal.com")) return null;
    return u + (u.includes("?") ? "&" : "?") + "embed=1&info=0&swaps=0";
  }, [mkt?.pool_url]);

  // ---------- render ----------
  return (
    <div className="osint-root">
      <style>{CSS}</style>

      <h1 className="o-title">Token OSINT Lab</h1>
      <div className="o-sub">Search any coin, contract, symbol or DexScreener URL. Get full on-chain, market and OSINT intelligence.</div>

      <div className="o-search">
        <div className="o-searchbox">
          <span className="o-ic">&#128269;</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") runScan(); }}
            placeholder="Enter token symbol, contract address or DexScreener URL..."
          />
        </div>
        <button className="o-scanbtn" onClick={() => runScan()} disabled={loading}>
          {loading ? "Scanning…" : "🔍 Scan OSINT"}
        </button>
      </div>
      <div className="o-examples">
        <b>Examples:</b>
        {(() => {
          const NATIVE_EX = ["BTC","ETH","SOL","BNB","XRP","ADA","DOGE","TRX","DOT","LTC","BCH","XLM","XMR","ETC","TON","AVAX","ATOM","NEAR","ALGO","HBAR"];
          let ex = signals.map((x) => x.symbol).filter((sym) => sym && !NATIVE_EX.includes(String(sym).toUpperCase())).slice(0, 3);
          if (ex.length < 3) ex = ["AAVE", "PEPE", "UNI"];
          return ex.map((e) => (
            <code key={e} onClick={() => runScan(e)} style={{ cursor: "pointer", marginRight: "8px" }}>{e}</code>
          ));
        })()}
      </div>

      {error && <div className="o-error">{error}</div>}

      {loading && <div className="o-empty">Searching...</div>}
      {!data && !error && !loading && (
        <div className="o-empty">Enter a token above and run a scan to see on-chain, market and risk intelligence.</div>
      )}

      {data && (
        <>
          {/* ROW 1 */}
          <div className="o-row o-r1">
            {/* Token overview */}
            <div className="o-card">
              <div className="o-card-h">Token Overview</div>
              <div className="o-tok-top">
                <div className="o-coin"><CoinIcon srcs={[cg.image]} symbol={tok.symbol} big /></div>
                <div>
                  <div className="o-tok-name">{tok.symbol || "Unknown"}</div>
                  <div className="o-chips"><span className="o-chip">{(tok.chain || "—").toUpperCase()}</span></div>
                </div>
              </div>
              <div className="o-price">
                {tok.price_usd != null ? nfUsd(tok.price_usd, 6) : "N/A"}
                {tok.price_change_h24 != null && (
                  <span className="o-chg" style={{ color: Number(tok.price_change_h24) >= 0 ? "var(--o-green)" : "var(--o-red)" }}>
                    {Number(tok.price_change_h24) >= 0 ? "+" : ""}{Number(tok.price_change_h24).toFixed(2)}% (24h)
                  </span>
                )}
              </div>
              <div className="o-stats3">
                <div><div className="o-k">Market Cap</div><div className="o-v">{cg.market_cap != null ? nfUsd(cg.market_cap) : "N/A"}</div></div>
                <div><div className="o-k">Liquidity</div><div className="o-v">{nfUsd(mkt.liquidity_usd)}</div></div>
                <div><div className="o-k">Volume 24h</div><div className="o-v">{nfUsd(mkt.volume_h24)}</div></div>
                <div><div className="o-k">Holders</div><div className="o-v">{nfInt(tok.total_holders)}</div></div>
                <div><div className="o-k">Age</div><div className="o-v">{dep?.age_days != null ? (dep.age_days >= 365 ? (dep.age_days / 365).toFixed(1) + "y" : dep.age_days + "d") : "N/A"}</div></div>
              </div>
              {mkt.pool_url && (
                <div className="o-ext-btns">
                  <a className="o-ext" href={mkt.pool_url} target="_blank" rel="noreferrer">📊 {String(mkt.pool_url).includes("geckoterminal") ? "GeckoTerminal" : String(mkt.pool_url).includes("coingecko") ? "CoinGecko" : String(mkt.pool_url).includes("dexscreener") ? "DexScreener" : "View source"}</a>
                </div>
              )}
            </div>

            {/* AI verdict */}
            <div className="o-card">
              <div className="o-card-h">AI Verdict <span className="o-pill o-pill-med o-right">{ver.ai_source || "AI"}</span></div>
              <div className="o-verdict-banner" style={{ borderColor: riskColor(riskLvl) + "44" }}>
                <div className="o-shield" style={{ color: riskColor(riskLvl), background: riskColor(riskLvl) + "22" }}>🛡</div>
                <div className="o-vlbl">RISK: <span style={{ color: riskColor(riskLvl) }}>{riskLvl}</span></div>
              </div>
              <div className="o-vlist">
                <div className="o-vrow"><span>Verdict</span><b>{ver.verdict || "N/A"}</b></div>
                <div className="o-vrow"><span>Dump Risk</span><b style={{ color: ver.dump_risk_level === "high" ? "var(--o-red)" : ver.dump_risk_level === "medium" ? "var(--o-yellow)" : "var(--o-green)" }}>{(ver.dump_risk_level || "N/A").toUpperCase()}</b></div>
                <div className="o-vrow"><span>Confidence</span><b style={{ color: "var(--o-green)" }}>{ver.confidence != null ? ver.confidence + "%" : "N/A"}</b></div>
              </div>
              {ver.reason && <div className="o-vnote">{ver.reason}</div>}
              <div className="o-gauge">
                <div className="o-gauge-bar"><div className="o-knob" style={{ left: (riskLvl === "HIGH" ? 85 : riskLvl === "MEDIUM" ? 55 : 20) + "%" }} /></div>
                <div className="o-gauge-ends"><span style={{ color: "var(--o-green)" }}>Low</span><span style={{ color: "var(--o-red)" }}>High</span></div>
              </div>
            </div>

            {/* Recent scans */}
            <div className="o-card">
              <div className="o-card-h">Recent Scans</div>
              {recent.length === 0 && <div className="o-na" style={{ fontSize: 12 }}>No signals loaded.</div>}
              {recent.map((s: any, i: number) => {
                const rl = deriveScanRisk(s);
                return (
                  <div className="o-scan" key={i} onClick={() => runScan(s.token_address || s.symbol)} style={{ cursor: "pointer" }}>
                    <div className="o-scan-ic"><CoinIcon srcs={[(s as any).image]} symbol={s.symbol} /></div>
                    <div className="o-scan-mid"><div className="o-scan-sym">{s.symbol}</div><div className="o-scan-chain">{(s.network || "").toUpperCase()}</div></div>
                    <div className="o-scan-right">
                      <span className={"o-pill " + (rl === "HIGH" ? "o-pill-high" : rl === "MEDIUM" ? "o-pill-med" : "o-pill-low")}>{rl} RISK</span>
                    </div>
                    <span className="o-chev">›</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ROW 2 */}
          <div className="o-row o-r2">
            {/* DEX data (real) */}
            <div className="o-card">
              <div className="o-card-h"><span className="o-cic">⚖</span> DEX Data</div>
              <div className="o-srow"><span>Liquidity</span><b>{nfUsd(mkt.liquidity_usd)}</b></div>
              <div className="o-srow"><span>Volume 24h</span><b>{nfUsd(mkt.volume_h24)}</b></div>
              <div className="o-srow"><span>Buys / Sells</span><b>
                {buyPct != null ? (
                  <span className="o-split"><i style={{ width: buyPct + "%", background: "var(--o-green)" }} /><i style={{ width: (100 - buyPct) + "%", background: "var(--o-red)" }} /></span>
                ) : null}
                {buyPct != null ? `${buyPct.toFixed(0)}% / ${(100 - buyPct).toFixed(0)}%` : "N/A"}
              </b></div>
              <div className="o-srow"><span>Buy Pressure</span><b className={buyPct != null && buyPct >= 55 ? "o-ok" : buyPct != null && buyPct < 45 ? "o-bad" : ""}>
                {buyPct == null ? "N/A" : buyPct >= 55 ? "High" : buyPct < 45 ? "Low" : "Neutral"}
              </b></div>
              <div className="o-srow"><span>Top DEX</span><b className="o-na">Phase 2</b></div>
              <div className="o-srow"><span>Pairs</span><b className="o-na">Phase 2</b></div>
            </div>

            {/* Security — Phase 2 (GoPlus), with real Top10 already filled */}
            <div className={"o-card" + (sec.available ? "" : " o-card-locked")}>
              <div className="o-card-h"><span className="o-cic">🛡</span> Security {sec.available
                ? <span className={"o-pill o-right " + (sec.contract_risk === "HIGH" ? "o-pill-high" : sec.contract_risk === "MEDIUM" ? "o-pill-med" : "o-pill-low")}>{sec.contract_risk}</span>
                : <span className="o-pill o-pill-med o-right">N/A</span>}</div>
              <div className="o-srow"><span>Top 10 Holders</span><b className={Number(holders?.concentration_top10) >= 50 ? "o-bad" : "o-ok"}>{holders?.concentration_top10 != null ? pct(holders.concentration_top10) : "N/A"}</b></div>
              <div className="o-srow"><span>Honeypot</span><b className={sec.available ? (sec.is_honeypot ? "o-bad" : "o-ok") : "o-na"}>{sec.available ? (sec.is_honeypot ? "Yes ⚠" : "No ✓") : "—"}</b></div>
              <div className="o-srow"><span>Buy / Sell Tax</span><b className={sec.available && (Number(sec.buy_tax) > 0 || Number(sec.sell_tax) > 0) ? "o-warn" : sec.available ? "o-ok" : "o-na"}>{sec.available ? `${sec.buy_tax != null ? sec.buy_tax + "%" : "?"} / ${sec.sell_tax != null ? sec.sell_tax + "%" : "?"}` : "—"}</b></div>
              <div className="o-srow"><span>Mint Authority</span><b className={sec.available ? (sec.is_mintable ? "o-bad" : "o-ok") : "o-na"}>{sec.available ? (sec.is_mintable ? "Mintable" : "Renounced") : "—"}</b></div>
              <div className="o-srow"><span>Freeze / Pausable</span><b className={sec.available ? (sec.transfer_pausable ? "o-bad" : "o-ok") : "o-na"}>{sec.available ? (sec.transfer_pausable ? "Pausable" : "No") : "—"}</b></div>
              <div className="o-srow"><span>Contract Risk</span><b className={sec.available ? (sec.contract_risk === "HIGH" ? "o-bad" : sec.contract_risk === "MEDIUM" ? "o-warn" : "o-ok") : "o-na"}>{sec.available ? sec.contract_risk : "—"}</b></div>
              {!sec.available && <div className="o-soon">{sec.error === "unsupported_chain" ? "GoPlus not available for this chain" : "GoPlus security unavailable"}</div>}
            </div>

            {/* Social — Phase 2 (LunarCrush) */}
            <div className={"o-card" + ((soc.available || cgMetrics.available) ? "" : " o-card-locked")}>
              <div className="o-card-h"><span className="o-cic">📣</span> {soc.available ? "Social Buzz" : cgMetrics.available ? "Token Metrics" : "Social Buzz"} {soc.available ? <span className="o-pill o-pill-low o-right">LunarCrush</span> : cgMetrics.available ? <span className="o-pill o-pill-low o-right">CoinGecko</span> : <span className="o-pill o-pill-med o-right">N/A</span>}</div>
              {soc.available ? (
                <>
                  {soc.sentiment && <div className="o-srow"><span>Sentiment</span><b className={soc.sentiment === "Bullish" ? "o-ok" : soc.sentiment === "Bearish" ? "o-bad" : "o-warn"}>{soc.sentiment}{soc.sentiment_pct != null ? ` ${soc.sentiment_pct}%` : ""}</b></div>}
                  {soc.social_dominance_pct != null && <div className="o-srow"><span>Social Dominance</span><b>{Number(soc.social_dominance_pct).toFixed(2)}%</b></div>}
                  {soc.galaxy_score != null && <div className="o-srow"><span>Social Score</span><b>{Math.round(soc.galaxy_score)} / 100</b></div>}
                  {soc.mentions_24h != null && <div className="o-srow"><span>Mentions 24h</span><b>{nfInt(soc.mentions_24h)}</b></div>}
                  {soc.engagements_24h != null && <div className="o-srow"><span>Engagements 24h</span><b>{nfInt(soc.engagements_24h)}</b></div>}
                  {soc.alt_rank != null && <div className="o-srow"><span>AltRank</span><b>#{nfInt(soc.alt_rank)}</b></div>}
                  {soc.summary && <div className="o-vnote" style={{ marginTop: 12 }}>{soc.summary}</div>}
                  {soc.limited_mode && <div className="o-soon">LunarCrush limited data mode</div>}
                </>
              ) : cgMetrics.available ? (
                <>
                  {cgMetrics.rank != null && <div className="o-srow"><span>Market Cap Rank</span><b>#{cgMetrics.rank}</b></div>}
                  {cgMetrics.ath_change_pct != null && <div className="o-srow"><span>From ATH</span><b className="o-bad">{Number(cgMetrics.ath_change_pct).toFixed(1)}%</b></div>}
                  {cgMetrics.change_7d != null && <div className="o-srow"><span>7d Change</span><b className={Number(cgMetrics.change_7d) >= 0 ? "o-ok" : "o-bad"}>{Number(cgMetrics.change_7d).toFixed(1)}%</b></div>}
                  {cgMetrics.watchlist_users != null && <div className="o-srow"><span>Watchlist Users</span><b>{nfInt(cgMetrics.watchlist_users)}</b></div>}
                </>
              ) : (
                <>
                  <div className="o-srow"><span>Sentiment</span><b className="o-na">—</b></div>
                  <div className="o-srow"><span>Social Score</span><b className="o-na">—</b></div>
                  <div className="o-soon">No social or metrics data for this token</div>
                </>
              )}
            </div>
          </div>

          {/* ROW 3 */}
          <div className="o-row o-r3">
            {/* Risk breakdown (real where available) */}
            <div className="o-card">
              <div className="o-card-h"><span className="o-cic">📊</span> Risk Breakdown</div>
              {[
                { k: "Holder Concentration", v: Number(holders?.concentration_top10), real: holders?.concentration_top10 != null },
                { k: "Social Manipulation", v: Number(ver?.manipulation_probability), real: ver?.manipulation_probability != null },
                { k: "Dump Probability", v: ver?.dump_risk_level === "high" ? 82 : ver?.dump_risk_level === "medium" ? 55 : ver?.dump_risk_level === "low" ? 22 : NaN, real: !!ver?.dump_risk_level },
                { k: "Liquidity Risk", v: Number(mkt?.liquidity_usd) >= 1e6 ? 30 : Number(mkt?.liquidity_usd) >= 2.5e5 ? 55 : Number(mkt?.liquidity_usd) > 0 ? 80 : NaN, real: Number(mkt?.liquidity_usd) > 0 },
                { k: "Deployer Risk", v: dep?.available && dep.risk_pct != null ? Number(dep.risk_pct) : NaN, real: !!dep?.available },
              ].map((row) => {
                const v = isFinite(row.v) ? Math.min(100, Math.max(0, row.v)) : null;
                const col = v == null ? "var(--o-border)" : v >= 65 ? "linear-gradient(90deg,#f97316,#ef4444)" : v >= 45 ? "linear-gradient(90deg,#eab308,#f97316)" : "linear-gradient(90deg,#22c55e,#eab308)";
                return (
                  <div className="o-rbrow" key={row.k}>
                    <span className="o-rk">{row.k}</span>
                    <div className="o-rbar"><i style={{ width: (v ?? 0) + "%", background: col }} />{v != null && <span className="o-tick" style={{ left: v + "%" }} />}</div>
                    <span className="o-rpct">{v != null ? Math.round(v) + "%" : row.real ? "—" : "P2"}</span>
                  </div>
                );
              })}
            </div>

            {/* Important mentions (from signal meta) */}
            <div className="o-card">
              <div className="o-card-h"><span className="o-cic">💬</span> Important Mentions</div>
              {(() => {
                const items: { src: string; txt: string; url?: string }[] = [];
                (meta.sources || []).forEach((s: string) => items.push({ src: s, txt: `Picked up as a signal source for this token.` }));
                (meta.red_flags || []).forEach((f: string) => items.push({ src: "Risk", txt: f }));
                if (meta.whale_dump_risk) items.push({ src: "Whales", txt: "Whale dump risk flagged." });
                if (meta.multi_source) items.push({ src: "Confirmation", txt: "Multi-source confirmation." });
                const ab = (data as any)?.about || {};
                const lks = ((data as any)?.links || []) as { label: string; url: string }[];
                if (items.length === 0 && ab.available) {
                  if (ab.categories && ab.categories.length) items.push({ src: "Categories", txt: ab.categories.join(", ") });
                  if (ab.description) items.push({ src: "About", txt: ab.description });
                }
                if (items.length === 0 || ab.available) lks.forEach((l) => items.push({ src: l.label, txt: l.url, url: l.url }));
                if (items.length === 0) items.push({ src: "—", txt: "No notable mentions or flags for this token." });
                return items.slice(0, 6).map((m, i) => (
                  <div className="o-ment" key={i}>
                    <div className="o-ment-ic">•</div>
                    <div><div className="o-ment-src">{m.src}</div><div className="o-ment-txt">{m.url ? <a href={m.url} target="_blank" rel="noreferrer" style={{ color: "var(--o-teal)" }}>{m.txt}</a> : m.txt}</div></div>
                  </div>
                ));
              })()}
            </div>

            {/* AI summary (uses verdict.reason) */}
            <div className="o-card o-sum">
              <div className="o-card-h"><span className="o-cic">🧪</span> AI Summary Report</div>
              <p>{ver.reason || "No AI summary available for this token yet."}</p>
              <h4>Key Takeaways</h4>
              <ul>
                <li>Risk level: {riskLvl}{ver.confidence != null ? ` (confidence ${ver.confidence}%)` : ""}</li>
                <li>Top-10 concentration: {holders?.concentration_top10 != null ? pct(holders.concentration_top10) : "N/A"}</li>
                <li>Dump risk: {(ver.dump_risk_level || "N/A").toUpperCase()}</li>
                <li>{meta.multi_source ? "Multi-source confirmed" : "Single-source signal"}</li>
                <li>{Array.isArray(meta.red_flags) && meta.red_flags.length ? `${meta.red_flags.length} red flag(s)` : "No red flags"}</li>
              </ul>
              <button className="o-dl" onClick={async () => {
                const q = data?.query || {};
                const ch = q.chain, addr = q.address;
                if (!ch || !addr) return;
                const _tok = JSON.parse(localStorage.getItem('pumpradar_auth_token') || 'null');
                try {
                  const res = await fetch(`${API}/api/crypto/osint-report/${encodeURIComponent(ch)}/${encodeURIComponent(addr)}`, { headers: _tok ? { Authorization: `Bearer ${_tok}` } : {} });
                  if (!res.ok) { alert('Download failed: ' + res.status); return; }
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  const sym = (data?.token?.symbol || 'TOKEN').toUpperCase();
                  const dt = new Date().toISOString().slice(0,10);
                  a.download = `PumpRadar_${sym}_OSINT_${dt}.pdf`;
                  document.body.appendChild(a); a.click(); a.remove();
                  URL.revokeObjectURL(url);
                } catch (e: any) { alert('Download error: ' + (e?.message || 'unknown')); }
              }}>⬇ Download Full Report (PDF)</button>
            </div>
          </div>

          {/* ROW 4 */}
          <div className="o-row o-r4">
            <div className="o-card">
              <div className="o-card-h"><span className="o-cic">📈</span> Price Chart (GeckoTerminal)</div>
              {embedUrl ? (
                <>
                  <iframe title="chart" src={embedUrl} className="o-chart" frameBorder="0" allow="clipboard-write" />
                  {chartMeta.pair && (
                    <div className="o-chart-proof">
                      <span className="o-ok">✓ Verified</span> {chartMeta.pair}{chartMeta.dex ? ` · ${chartMeta.dex}` : ""}
                      {chartMeta.contract && <span className="o-chart-addr"> · {String(chartMeta.contract).slice(0, 6)}…{String(chartMeta.contract).slice(-4)}</span>}
                      {chartMeta.verified_source && <span> · via {chartMeta.verified_source}</span>}
                    </div>
                  )}
                </>
              ) : mkt?.pool_url ? (
                <div className="o-empty" style={{ marginTop: 0 }}>No embeddable chart. <a href={mkt.pool_url} target="_blank" rel="noreferrer" style={{ color: "var(--o-teal)" }}>View source &#8599;</a></div>
              ) : (
                <div className="o-empty" style={{ marginTop: 0 }}>No chart available for this token.</div>
              )}
            </div>

            <div className="o-card">
              <div className="o-card-h"><span className="o-cic">👥</span> Top Holders</div>
              {donut.hasData ? (
                <div className="o-donut-wrap">
                  <div className="o-donut">
                    <svg width="150" height="150" viewBox="0 0 42 42">
                      <circle cx="21" cy="21" r="15.9" fill="none" stroke="#1e2636" strokeWidth="6" />
                      {(() => {
                        let off = 25; // start at top
                        return donut.segs.map((seg, i) => {
                          const len = Math.max(0, seg.v);
                          const el = (
                            <circle key={i} cx="21" cy="21" r="15.9" fill="none" stroke={seg.c} strokeWidth="6"
                              strokeDasharray={`${len} ${100 - len}`} strokeDashoffset={off} transform="rotate(-90 21 21)" />
                          );
                          off = off - len;
                          if (off < 0) off += 100;
                          return el;
                        });
                      })()}
                    </svg>
                    <div className="o-donut-c"><div className="o-donut-big">{donut.center != null ? pct(donut.center) : "—"}</div><div className="o-donut-sm">Top 10</div></div>
                  </div>
                  <div className="o-legend">
                    {donut.segs.map((seg) => (
                      <div className="o-lrow" key={seg.k}><span className="o-sw" style={{ background: seg.c }} /><span className="o-lk">{seg.k}</span><span className="o-lv">{pct(seg.v)}</span></div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="o-empty" style={{ marginTop: 0 }}>No holder distribution available.</div>
              )}
            </div>
          </div>

          <div className="o-foot">
            <span>OSINT Lab aggregates your existing data sources. Always do your own research.</span>
            {data.last_updated && <span>Snapshot: {new Date(data.last_updated).toLocaleString()}</span>}
          </div>
        </>
      )}
    </div>
  );
}

const CSS = `
.osint-root{
  --o-bg:#0a0e17;--o-card:#111726;--o-card2:#0f1521;--o-border:#1e2636;--o-border-soft:#1a2130;
  --o-text:#e6eaf2;--o-text2:#aab3c5;--o-muted:#6b7689;--o-teal:#15b8a6;--o-teal2:#0e9384;
  --o-green:#22c55e;--o-yellow:#eab308;--o-red:#ef4444;--o-violet:#7c5cfc;
  color:var(--o-text);font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;font-size:14px;line-height:1.45;
}
.osint-root *{box-sizing:border-box}
.osint-root .o-title{font-size:30px;font-weight:700;letter-spacing:-.5px;margin:6px 0 0}
.osint-root .o-sub{color:var(--o-text2);margin-top:6px}
.osint-root .o-search{display:flex;gap:12px;margin-top:20px}
.osint-root .o-searchbox{flex:1;display:flex;align-items:center;gap:11px;background:var(--o-card2);border:1px solid var(--o-border);border-radius:12px;padding:0 16px;height:52px}
.osint-root .o-searchbox input{flex:1;background:none;border:none;outline:none;color:var(--o-text);font-size:14.5px;font-family:inherit}
.osint-root .o-searchbox input::placeholder{color:var(--o-muted)}
.osint-root .o-ic{color:var(--o-muted)}
.osint-root .o-scanbtn{width:200px;height:52px;border:none;border-radius:12px;cursor:pointer;background:linear-gradient(180deg,var(--o-teal),var(--o-teal2));color:#04140f;font-weight:700;font-size:14.5px;font-family:inherit}
.osint-root .o-scanbtn:disabled{opacity:.6;cursor:default}
.osint-root .o-examples{margin-top:12px;font-size:12.5px;color:var(--o-muted)}
.osint-root .o-examples b{color:var(--o-text2);margin-right:8px}
.osint-root .o-examples code{color:var(--o-text2);margin-right:16px}
.osint-root .o-error{margin-top:18px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);border-radius:10px;padding:12px 14px;color:#fca5a5;font-size:13px}
.osint-root .o-empty{margin-top:24px;color:var(--o-muted);font-size:13.5px;text-align:center;padding:30px;border:1px dashed var(--o-border);border-radius:12px}
.osint-root .o-row{display:grid;gap:18px;margin-top:18px}
.osint-root .o-r1{grid-template-columns:1.12fr 1fr .92fr}
.osint-root .o-r2{grid-template-columns:repeat(3,1fr)}
.osint-root .o-r3{grid-template-columns:1.15fr 1fr 1fr}
.osint-root .o-r4{grid-template-columns:1.55fr 1fr}
.osint-root .o-card{background:var(--o-card);border:1px solid var(--o-border-soft);border-radius:14px;padding:18px;position:relative}
.osint-root .o-card-locked{opacity:.92}
.osint-root .o-card-h{display:flex;align-items:center;gap:9px;font-size:12px;font-weight:700;letter-spacing:.6px;color:var(--o-text2);text-transform:uppercase;margin-bottom:16px}
.osint-root .o-cic{color:var(--o-teal)}
.osint-root .o-right{margin-left:auto;letter-spacing:0;text-transform:none}
.osint-root .o-soon{margin-top:12px;font-size:11px;color:var(--o-muted);text-align:center;border-top:1px solid var(--o-border-soft);padding-top:10px}
.osint-root .o-tok-top{display:flex;align-items:center;gap:14px}
.osint-root .o-coin{width:48px;height:48px;border-radius:12px;display:grid;place-items:center;font-size:22px;font-weight:700;background:rgba(21,184,166,.16);color:var(--o-teal)}
.osint-root .o-tok-name{font-size:21px;font-weight:700}
.osint-root .o-chips{display:flex;gap:8px;margin-top:6px}
.osint-root .o-chip{background:var(--o-card2);border:1px solid var(--o-border);border-radius:6px;padding:2px 8px;font-size:12px;color:var(--o-text2)}
.osint-root .o-price{font-size:24px;font-weight:700;margin-top:16px}
.osint-root .o-chg{font-size:13px;font-weight:600;margin-left:8px}
.osint-root .o-stats3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px 8px;margin-top:16px}
.osint-root .o-k{font-size:11.5px;color:var(--o-muted)}
.osint-root .o-v{font-size:15px;font-weight:700;margin-top:3px}
.osint-root .o-na{color:var(--o-muted);font-weight:600}
.osint-root .o-ext-btns{display:flex;gap:9px;margin-top:18px}
.osint-root .o-ext{flex:1;display:flex;align-items:center;justify-content:center;gap:7px;font-size:12px;color:var(--o-text2);background:var(--o-card2);border:1px solid var(--o-border);border-radius:9px;padding:9px 8px;text-decoration:none}
.osint-root .o-verdict-banner{display:flex;align-items:center;gap:14px;border:1px solid var(--o-border);border-radius:12px;padding:14px 16px}
.osint-root .o-shield{width:40px;height:40px;border-radius:10px;display:grid;place-items:center;font-size:20px}
.osint-root .o-vlbl{font-size:18px;font-weight:700}
.osint-root .o-vlist{margin-top:16px}
.osint-root .o-vrow{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--o-border-soft);font-size:13.5px}
.osint-root .o-vrow:last-child{border-bottom:none}
.osint-root .o-vrow span{color:var(--o-text2)}
.osint-root .o-vnote{font-size:13px;color:var(--o-text2);margin-top:14px;line-height:1.55}
.osint-root .o-gauge{margin-top:16px}
.osint-root .o-gauge-bar{height:8px;border-radius:5px;background:linear-gradient(90deg,#22c55e,#eab308,#ef4444);position:relative}
.osint-root .o-knob{position:absolute;top:50%;transform:translate(-50%,-50%);width:13px;height:13px;border-radius:50%;background:#fff;border:2px solid #0a0e17}
.osint-root .o-gauge-ends{display:flex;justify-content:space-between;font-size:11.5px;margin-top:7px}
.osint-root .o-scan{display:flex;align-items:center;gap:11px;padding:9px 0;border-bottom:1px solid var(--o-border-soft)}
.osint-root .o-scan:last-child{border-bottom:none}
.osint-root .o-scan-ic{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;font-size:14px;font-weight:700;background:var(--o-card2);color:var(--o-text2);flex:none}
.osint-root .o-scan-mid{flex:1;min-width:0}
.osint-root .o-scan-sym{font-size:13.5px;font-weight:700}
.osint-root .o-scan-chain{font-size:11.5px;color:var(--o-muted)}
.osint-root .o-pill{font-size:10px;font-weight:700;letter-spacing:.4px;padding:3px 8px;border-radius:6px}
.osint-root .o-pill-med{background:rgba(234,179,8,.14);color:var(--o-yellow)}
.osint-root .o-pill-low{background:rgba(34,197,94,.14);color:var(--o-green)}
.osint-root .o-pill-high{background:rgba(239,68,68,.14);color:var(--o-red)}
.osint-root .o-chev{color:var(--o-muted);font-size:15px}
.osint-root .o-srow{display:flex;align-items:center;justify-content:space-between;padding:8.5px 0;border-bottom:1px solid var(--o-border-soft);font-size:13px}
.osint-root .o-srow:last-of-type{border-bottom:none}
.osint-root .o-srow span{color:var(--o-text2)}
.osint-root .o-srow b{font-weight:600}
.osint-root .o-ok{color:var(--o-green)}.osint-root .o-bad{color:var(--o-red)}
.osint-root .o-warn{color:var(--o-yellow)}
.osint-root .o-split{display:inline-flex;width:74px;height:6px;border-radius:4px;overflow:hidden;margin-right:8px;vertical-align:middle}
.osint-root .o-split i{height:100%}
.osint-root .o-rbrow{display:grid;grid-template-columns:140px 1fr 40px;align-items:center;gap:12px;margin-bottom:15px}
.osint-root .o-rk{font-size:12.5px;color:var(--o-text2)}
.osint-root .o-rbar{height:9px;border-radius:5px;background:var(--o-border);position:relative}
.osint-root .o-rbar i{display:block;height:100%;border-radius:5px}
.osint-root .o-tick{position:absolute;top:50%;transform:translate(-50%,-50%);width:10px;height:10px;border-radius:50%;background:#fff;border:2px solid var(--o-card)}
.osint-root .o-rpct{text-align:right;font-weight:700;font-size:13px}
.osint-root .o-ment{display:flex;gap:11px;padding:10px 0;border-bottom:1px solid var(--o-border-soft)}
.osint-root .o-ment:last-of-type{border-bottom:none}
.osint-root .o-ment-ic{width:26px;height:26px;border-radius:8px;display:grid;place-items:center;background:var(--o-card2);border:1px solid var(--o-border);flex:none;color:var(--o-teal)}
.osint-root .o-ment-src{font-size:12.5px;font-weight:700;color:var(--o-teal);text-transform:capitalize}
.osint-root .o-ment-txt{font-size:12px;color:var(--o-text2);margin-top:2px}
.osint-root .o-sum p{font-size:12.5px;color:var(--o-text2);line-height:1.6}
.osint-root .o-sum h4{font-size:12.5px;color:var(--o-teal);margin:14px 0 8px}
.osint-root .o-sum ul{list-style:none;font-size:12.5px;color:var(--o-text2);padding:0}
.osint-root .o-sum li{position:relative;padding-left:15px;margin-bottom:6px}
.osint-root .o-sum li:before{content:"";position:absolute;left:2px;top:7px;width:4px;height:4px;border-radius:50%;background:var(--o-teal)}
.osint-root .o-dl{margin-top:16px;width:100%;background:linear-gradient(180deg,var(--o-violet),#6442e8);color:#fff;border:none;border-radius:10px;padding:11px;font-weight:600;font-size:12.5px;font-family:inherit;opacity:.6}
.osint-root .o-chart-proof{font-size:11.5px;color:var(--o-text2);margin-top:9px;display:flex;flex-wrap:wrap;gap:4px;align-items:center}.osint-root .o-chart-addr{font-family:monospace;color:var(--o-text2)}
.osint-root .o-chart{width:100%;height:300px;border:none;border-radius:10px;background:var(--o-card2)}
.osint-root .o-donut-wrap{display:flex;align-items:center;gap:22px}
.osint-root .o-donut{position:relative;width:150px;height:150px;flex:none}
.osint-root .o-donut-c{position:absolute;inset:0;display:grid;place-items:center;text-align:center}
.osint-root .o-donut-big{font-size:22px;font-weight:700}
.osint-root .o-donut-sm{font-size:11px;color:var(--o-muted)}
.osint-root .o-legend{flex:1}
.osint-root .o-lrow{display:flex;align-items:center;gap:9px;padding:6px 0;font-size:12.5px}
.osint-root .o-sw{width:9px;height:9px;border-radius:3px;flex:none}
.osint-root .o-lk{color:var(--o-text2)}
.osint-root .o-lv{margin-left:auto;font-weight:700}
.osint-root .o-foot{margin-top:24px;padding-top:14px;border-top:1px solid var(--o-border-soft);display:flex;justify-content:space-between;font-size:11.5px;color:var(--o-muted)}
@media(max-width:980px){.osint-root .o-r1,.osint-root .o-r2,.osint-root .o-r3,.osint-root .o-r4{grid-template-columns:1fr 1fr}}
@media(max-width:640px){.osint-root .o-r1,.osint-root .o-r2,.osint-root .o-r3,.osint-root .o-r4{grid-template-columns:1fr}}
`;
