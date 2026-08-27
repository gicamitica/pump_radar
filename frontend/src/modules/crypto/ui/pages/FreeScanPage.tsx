/**
 * @file FreeScanPage.tsx
 * Public, no-login token risk scanner (conversion entry point).
 * Reuses: GET /api/crypto/osint-resolve/{term} and GET /api/crypto/osint/{chain}/{address}
 * Shows REAL data (verdict, security checks, holders), locks deep analysis behind a free account.
 * Layout 'none'. Does NOT touch existing pages/auth/backend.
 */
import React, { useState } from 'react';

const API: string = ((import.meta as any).env?.VITE_API_BASE_URL as string) || '';
const REGISTER_PATH = '/auth/register';

type Verdict = { risk_level?: string | null; verdict?: string | null; reason?: string | null };
type TokenInfo = { symbol?: string | null; name?: string | null; chain?: string | null; price_usd?: number | null; price_change_h24?: number | null; total_holders?: number | null };
type MarketInfo = { liquidity_usd?: number | null; volume_h24?: number | null };
type Security = { available?: boolean; is_honeypot?: boolean | null; buy_tax?: number | null; sell_tax?: number | null; is_mintable?: boolean | null; is_open_source?: boolean | null; contract_risk?: string | null; score?: number | null };
type Holders = { available?: boolean; total_holders?: number | null; distribution?: Record<string, number> | null; top_holders?: { address: string; pct: number }[] | null };

const isEvm = (s: string) => /^0x[a-fA-F0-9]{40}$/.test(s.trim());
const isSol = (s: string) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s.trim());

const fmtUsd = (n?: number | null) => {
  if (n == null || isNaN(n)) return '—';
  if (n > 0 && n < 0.01) return '$' + n.toPrecision(2);
  return '$' + Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
};
const fmtNum = (n?: number | null) => (n == null ? '—' : Number(n).toLocaleString());

const deriveVerdict = (v: Verdict | null, sec: Security | null, hold: Holders | null) => {
  const ai = (v?.risk_level || '').toUpperCase();
  if (ai && ai !== 'UNKNOWN') return ai;
  const cr = (sec?.contract_risk || '').toUpperCase();
  if (sec?.is_honeypot === true) return 'HIGH RISK';
  const top1 = hold?.top_holders?.[0]?.pct ?? null;
  if (cr === 'HIGH') return 'HIGH RISK';
  if (cr === 'LOW' && (top1 == null || top1 < 20)) return 'LOW RISK';
  if (cr === 'LOW') return 'CAUTION';
  if (cr === 'MEDIUM' || cr === 'MED') return 'CAUTION';
  if (top1 != null && top1 > 30) return 'CAUTION';
  return 'REVIEW';
};

const riskColor = (lvl: string) => {
  const l = lvl.toUpperCase();
  if (l.includes('HIGH') || l.includes('AVOID')) return '#ff5db1';
  if (l.includes('CAUTION') || l.includes('REVIEW') || l.includes('MED')) return '#f5c451';
  if (l.includes('LOW') || l.includes('SAFE') || l.includes('WATCH')) return '#27eaa4';
  return '#8a93a6';
};

const Check: React.FC<{ label: string; ok: boolean | null; goodWhenTrue?: boolean }> = ({ label, ok, goodWhenTrue = true }) => {
  if (ok == null) return (<div className="fs-chk"><span className="fs-chk-ic fs-chk-na">?</span>{label}</div>);
  const isGood = goodWhenTrue ? ok : !ok;
  return (<div className="fs-chk"><span className={'fs-chk-ic ' + (isGood ? 'fs-chk-ok' : 'fs-chk-bad')}>{isGood ? '✓' : '✕'}</span>{label}</div>);
};

const FreeScanPage: React.FC = () => {
  const [term, setTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [token, setToken] = useState<TokenInfo | null>(null);
  const [market, setMarket] = useState<MarketInfo | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [security, setSecurity] = useState<Security | null>(null);
  const [holders, setHolders] = useState<Holders | null>(null);

  const reset = () => { setErr(null); setToken(null); setMarket(null); setVerdict(null); setSecurity(null); setHolders(null); };

  const scan = async () => {
    const q = term.trim();
    if (!q) return;
    reset();
    setLoading(true);
    try {
      let chain = '';
      let address = '';
      if (isEvm(q) || isSol(q)) {
        address = q;
        try {
          const rr = await fetch(`${API}/api/crypto/osint-resolve/${encodeURIComponent(q)}`);
          const rj = await rr.json();
          if (rj?.data?.found && rj.data.chain) { chain = rj.data.chain; address = rj.data.address || q; }
        } catch { /* fall back */ }
        if (!chain) chain = isEvm(q) ? 'eth' : 'solana';
      } else {
        const rr = await fetch(`${API}/api/crypto/osint-resolve/${encodeURIComponent(q)}`);
        const rj = await rr.json();
        if (!rj?.data?.found) {
          setErr('Hmm, could not find that one. Try the coin name or symbol (like BONK or PEPE), or paste its contract address.');
          setLoading(false);
          return;
        }
        chain = rj.data.chain;
        address = rj.data.address;
      }
      const res = await fetch(`${API}/api/crypto/osint/${encodeURIComponent(chain)}/${encodeURIComponent(address)}`);
      const j = await res.json();
      const d = j?.data;
      if (!d || (!d.token && !d.verdict)) {
        setErr('No data found for that token yet. Try another coin.');
        setLoading(false);
        return;
      }
      setToken(d.token || null);
      setMarket(d.market || null);
      setVerdict(d.verdict || null);
      setSecurity(d.security || null);
      setHolders(d.holders || null);
    } catch {
      setErr('Something went wrong scanning that token. Try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') scan(); };
  const hitLimit = false; // unlimited free scans; conversion comes from the locked full report

  const dv = token ? deriveVerdict(verdict, security, holders) : '';
  const top1 = holders?.top_holders?.[0]?.pct ?? null;
  const dist = holders?.distribution || null;
  const bigHolders = dist ? (dist.whales || 0) + (dist.sharks || 0) + (dist.dolphins || 0) : 0;
  const smallHolders = dist ? (dist.shrimps || 0) + (dist.crabs || 0) + (dist.octopus || 0) + (dist.fish || 0) : 0;
  const totalDist = bigHolders + smallHolders;
  const bigPct = totalDist > 0 ? Math.round((bigHolders / totalDist) * 100) : 0;

  return (
    <div className="fs-root">
      <header className="fs-topbar">
        <a className="fs-brand" href="/">
          <svg width="30" height="30" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="60" height="60" rx="16" fill="#0d1018" stroke="#1d3a2e"/>
            <circle cx="32" cy="32" r="20" stroke="#27eaa4" strokeWidth="2" opacity="0.5"/>
            <circle cx="32" cy="32" r="12" stroke="#27eaa4" strokeWidth="2" opacity="0.7"/>
            <line x1="32" y1="32" x2="48" y2="20" stroke="#27eaa4" strokeWidth="2"/>
            <circle cx="44" cy="22" r="3" fill="#27eaa4"/>
          </svg>
          <span className="fs-brandtxt">Pump<span className="fs-brandaccent">Radar</span></span>
        </a>
        <a className="fs-signin" href="/auth/login">Sign in</a>
      </header>

      <div className="fs-wrap">
        <div className="fs-badge">FREE TOKEN RISK SCAN · NO SIGNUP</div>
        <h1 className="fs-title">Know the risk before you buy</h1>
        <p className="fs-sub">Enter any coin name or symbol. Get an instant on-chain safety read — no account needed.</p>

        <div className="fs-search">
          <div className="fs-box">
            <input value={term} onChange={(e) => setTerm(e.target.value)} onKeyDown={onKey}
              placeholder="Enter a coin name or symbol (e.g. BONK, PEPE, WIF)" disabled={loading || hitLimit} />
          </div>
          <button className="fs-btn" onClick={scan} disabled={loading || hitLimit}>
            {loading ? (<span className="fs-btn-loading"><span className="fs-spin" />Scanning…</span>) : 'Scan Free'}
          </button>
        </div>
        <div className="fs-examples"><b>Try:</b> <code>BONK</code> <code>PEPE</code> <code>WIF</code> · or paste a contract address</div>

        {err && <div className="fs-error">{err}</div>}
        {loading && (
          <div className="fs-loading">
            <span className="fs-spin-lg" />
            <span className="fs-loading-txt">Scanning on-chain data…</span>
          </div>
        )}
        {!err && !token && !loading && (<div className="fs-empty">Your risk read will appear here.</div>)}

        {token && (
          <div className="fs-result">
            <div className="fs-head">
              <div>
                <div className="fs-sym">{token.symbol || '—'} <span className="fs-chain">{(token.chain || '').toUpperCase()}</span></div>
                <div className="fs-name">{token.name || ''}</div>
              </div>
              <div className="fs-verdict-box" style={{ borderColor: riskColor(dv) }}>
                <span className="fs-verdict-lbl">RISK</span>
                <span className="fs-verdict" style={{ color: riskColor(dv) }}>{dv}</span>
              </div>
            </div>

            <div className="fs-metrics">
              <div className="fs-metric"><span>Price</span><b>{fmtUsd(token.price_usd)}</b></div>
              <div className="fs-metric"><span>24h</span><b>{token.price_change_h24 != null ? token.price_change_h24.toFixed(1) + '%' : '—'}</b></div>
              <div className="fs-metric"><span>24h Volume</span><b>{fmtUsd(market?.volume_h24)}</b></div>
              <div className="fs-metric"><span>{(token.total_holders ?? holders?.total_holders) != null ? 'Holders' : 'Safety score'}</span><b>{(token.total_holders ?? holders?.total_holders) != null ? fmtNum(token.total_holders ?? holders?.total_holders) : (security?.score != null ? security.score + '/100' : '—')}</b></div>
            </div>

            {security?.available && (
              <div className="fs-section">
                <div className="fs-section-h">Contract safety</div>
                <div className="fs-checks">
                  {security.is_honeypot != null && <Check label="Not a honeypot" ok={!security.is_honeypot} />}
                  {security.buy_tax != null && <Check label={`Buy tax ${security.buy_tax}%`} ok={security.buy_tax === 0} />}
                  {security.sell_tax != null && <Check label={`Sell tax ${security.sell_tax}%`} ok={security.sell_tax === 0} />}
                  {security.is_mintable != null && <Check label="Not mintable" ok={!security.is_mintable} />}
                  {security.is_open_source != null && security.is_open_source && <Check label="Open source" ok={true} />}
                  {security.contract_risk && <Check label={`Contract risk: ${security.contract_risk}`} ok={String(security.contract_risk).toUpperCase() === 'LOW'} />}
                </div>
              </div>
            )}

            {dist && totalDist > 0 && (
              <div className="fs-section">
                <div className="fs-section-h">Holder distribution</div>
                <div className="fs-distbar"><div className="fs-distbig" style={{ width: bigPct + '%' }} /></div>
                <div className="fs-distlbl"><span>{bigPct}% held by large wallets</span><span>{100 - bigPct}% retail</span></div>
              </div>
            )}

            <div className="fs-locked">
              <div className="fs-locked-h">🔒 Unlock the full report</div>
              <div className="fs-locked-rows">
                <div className="fs-lrow"><span>Top wallet holds <b>{top1 != null ? top1.toFixed(1) + '%' : '—'}</b> — see all top 20 holders</span></div>
                <div className="fs-lrow"><span>Liquidity lock status</span></div>
                <div className="fs-lrow"><span>Full AI verdict &amp; risk reasoning</span></div>
                <div className="fs-lrow"><span>Deployer history &amp; wallet clustering</span></div>
              </div>
              <a className="fs-cta" href={REGISTER_PATH}>Create free account for the full report →</a>
            </div>
          </div>
        )}

        {hitLimit && (<div className="fs-limit">You’ve used your free scans. <a href={REGISTER_PATH}>Create a free account</a> for unlimited scans.</div>)}
        <div className="fs-foot">Not financial advice. On-chain data for research only.</div>
      </div>

      <style>{`
        .fs-topbar{max-width:1100px;margin:0 auto 12px;width:100%;display:flex;align-items:center;justify-content:space-between;padding:4px 4px 18px}
        .fs-brand{display:flex;align-items:center;gap:10px;text-decoration:none}
        .fs-brandtxt{color:#e7ebf2;font-weight:700;font-size:18px;letter-spacing:-.3px}
        .fs-brandaccent{color:#27eaa4}
        .fs-signin{color:#9aa3b2;text-decoration:none;font-size:14px;font-weight:600;padding:8px 16px;border:1px solid #1d2230;border-radius:10px}
        .fs-signin:hover{color:#e7ebf2;border-color:#2a3142}
        .fs-root{min-height:100vh;background:#05060c;color:#e7ebf2;font-family:'Space Grotesk',system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;padding:28px 18px 48px}
        .fs-wrap{width:100%;max-width:760px}
        .fs-badge{display:inline-block;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:1.5px;color:#27eaa4;border:1px solid rgba(39,234,164,.3);border-radius:999px;padding:6px 12px}
        .fs-title{font-size:34px;font-weight:700;letter-spacing:-.5px;margin:18px 0 0}
        .fs-sub{color:#9aa3b2;margin-top:8px;font-size:15px;line-height:1.5}
        .fs-search{display:flex;gap:12px;margin-top:24px}
        .fs-box{flex:1;display:flex;align-items:center;background:#0d1018;border:1px solid #1d2230;border-radius:12px;padding:0 16px;height:54px}
        .fs-box input{flex:1;background:none;border:none;outline:none;color:#e7ebf2;font-size:14.5px;font-family:inherit}
        .fs-box input::placeholder{color:#5a6376}
        .fs-btn{width:160px;height:54px;border:none;border-radius:12px;cursor:pointer;background:linear-gradient(180deg,#27eaa4,#1fc98c);color:#04140f;font-weight:700;font-size:14.5px;font-family:inherit}
        .fs-btn:disabled{opacity:.5;cursor:default}
        .fs-examples{margin-top:12px;font-size:12.5px;color:#5a6376}
        .fs-examples b{color:#9aa3b2;margin-right:8px}
        .fs-examples code{color:#9aa3b2;margin-right:10px;background:#0d1018;padding:2px 7px;border-radius:6px;border:1px solid #161b27}
        .fs-error{margin-top:18px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);border-radius:10px;padding:12px 14px;color:#fca5a5;font-size:13px}
        .fs-empty{margin-top:24px;color:#5a6376;font-size:13.5px;text-align:center;padding:34px;border:1px dashed #1d2230;border-radius:12px}
        .fs-result{margin-top:22px;background:#0a0d14;border:1px solid #161b27;border-radius:16px;padding:20px}
        .fs-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
        .fs-sym{font-size:21px;font-weight:700}
        .fs-chain{font-size:11px;color:#8a93a6;font-family:'JetBrains Mono',monospace;margin-left:6px}
        .fs-name{color:#9aa3b2;font-size:13px;margin-top:2px}
        .fs-verdict-box{display:flex;flex-direction:column;align-items:flex-end;border:1px solid;border-radius:12px;padding:8px 14px;min-width:110px}
        .fs-verdict-lbl{font-size:10px;color:#5a6376;letter-spacing:1px;font-family:'JetBrains Mono',monospace}
        .fs-verdict{font-size:17px;font-weight:700;font-family:'JetBrains Mono',monospace;margin-top:2px}
        .fs-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:18px}
        .fs-metric{background:#0d1018;border:1px solid #161b27;border-radius:10px;padding:12px}
        .fs-metric span{display:block;font-size:11px;color:#5a6376;text-transform:uppercase;letter-spacing:.5px}
        .fs-metric b{display:block;font-size:15px;margin-top:4px}
        .fs-section{margin-top:18px;border-top:1px solid #161b27;padding-top:16px}
        .fs-section-h{font-size:12px;font-weight:700;letter-spacing:.6px;color:#9aa3b2;text-transform:uppercase;margin-bottom:12px}
        .fs-checks{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
        .fs-chk{display:flex;align-items:center;gap:9px;font-size:13.5px;color:#c8d0dd;background:#0d1018;border:1px solid #161b27;border-radius:8px;padding:10px 12px}
        .fs-chk-ic{width:18px;height:18px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0}
        .fs-chk-ok{background:rgba(39,234,164,.15);color:#27eaa4}
        .fs-chk-bad{background:rgba(255,93,177,.15);color:#ff5db1}
        .fs-chk-na{background:#161b27;color:#5a6376}
        .fs-distbar{height:12px;background:#ff5db1;border-radius:6px;overflow:hidden}
        .fs-distbig{height:100%;background:#27eaa4}
        .fs-distlbl{display:flex;justify-content:space-between;margin-top:8px;font-size:12px;color:#9aa3b2}
        .fs-locked{margin-top:18px;border-top:1px solid #161b27;padding-top:16px}
        .fs-locked-h{font-size:13px;font-weight:700;color:#e7ebf2;margin-bottom:12px}
        .fs-locked-rows{display:grid;gap:8px}
        .fs-lrow{background:#0d1018;border:1px solid #161b27;border-radius:8px;padding:11px 14px;color:#9aa3b2;font-size:13px}
        .fs-lrow b{color:#e7ebf2}
        .fs-cta{display:block;text-align:center;margin-top:16px;background:linear-gradient(180deg,#27eaa4,#1fc98c);color:#04140f;font-weight:700;text-decoration:none;border-radius:12px;padding:14px;font-size:14.5px}
        .fs-limit{margin-top:20px;text-align:center;background:rgba(39,234,164,.08);border:1px solid rgba(39,234,164,.25);border-radius:12px;padding:16px;font-size:14px;color:#c8d0dd}
        .fs-limit a{color:#27eaa4;font-weight:700}
        .fs-btn-loading{display:inline-flex;align-items:center;gap:9px}
        .fs-spin{width:15px;height:15px;border:2px solid rgba(4,20,15,.3);border-top-color:#04140f;border-radius:50%;display:inline-block;animation:fsspin .7s linear infinite}
        .fs-loading{margin-top:24px;display:flex;flex-direction:column;align-items:center;gap:14px;padding:40px;border:1px dashed #1d2230;border-radius:12px}
        .fs-spin-lg{width:34px;height:34px;border:3px solid #161b27;border-top-color:#27eaa4;border-radius:50%;display:inline-block;animation:fsspin .8s linear infinite}
        .fs-loading-txt{color:#9aa3b2;font-size:13.5px}
        @keyframes fsspin{to{transform:rotate(360deg)}}
        .fs-foot{margin-top:28px;text-align:center;color:#444c5e;font-size:12px}
        @media(max-width:640px){.fs-search{flex-direction:column}.fs-btn{width:100%}.fs-metrics{grid-template-columns:repeat(2,1fr)}.fs-checks{grid-template-columns:1fr}.fs-title{font-size:27px}}
      `}</style>
    </div>
  );
};

export default FreeScanPage;
