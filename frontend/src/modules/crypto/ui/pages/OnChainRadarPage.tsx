import { useCallback, useEffect, useMemo, useState } from "react";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || "";
const REFRESH_MS = 30000;

type ScoreBlock = { score: number; label: string; reasons: string[] };
type Scores = { early?: ScoreBlock; threat?: ScoreBlock };
type Deployer = {
  address: string | null;
  age_days: number | null;
  prior_deploys: number;
  prior_rugs: number;
};
type Enrichment = { deployer?: Deployer; goplus_available?: boolean; token?: { symbol: string | null; name: string | null }; base_token?: string };
type Recommendation = { verdict: string; icon: string; summary: string };
type PairEvent = {
  chain: string;
  base_token?: string;
  token_symbol?: string | null;
  base_symbol?: string | null;
  gecko?: { name?: string; price_usd?: string; reserve_usd?: string; fdv_usd?: string };
  token_address: string;
  pair_address: string;
  dex: string;
  block_time: string | null;
  enriched: boolean;
  scores?: Scores;
  enrichment?: Enrichment;
  recommendation?: Recommendation;
};

const VERDICT: Record<string, { label: string; color: string; bg: string }> = {
  WATCH: { label: "Watch", color: "#5dcaa5", bg: "rgba(29,158,117,0.16)" },
  CAUTION: { label: "Caution", color: "#f0b54a", bg: "rgba(239,159,39,0.16)" },
  AVOID: { label: "Avoid", color: "#ef7676", bg: "rgba(226,75,74,0.16)" },
  HONEYPOT: { label: "Honeypot", color: "#ef7676", bg: "rgba(226,75,74,0.16)" },
  SKIP: { label: "Skip", color: "#8b95a1", bg: "rgba(139,149,161,0.12)" },
  NO_DATA: { label: "No data", color: "#8b95a1", bg: "rgba(139,149,161,0.12)" },
};

const SCORED = ["WATCH", "CAUTION", "AVOID", "HONEYPOT"];
const PRIORITY: Record<string, number> = { WATCH: 0, CAUTION: 1, AVOID: 2, HONEYPOT: 3, SKIP: 4, NO_DATA: 5 };

const EXPLORER: Record<string, string> = {
  eth: "https://etherscan.io",
  bsc: "https://bscscan.com",
};
const GT_CHAIN: Record<string, string> = { eth: "eth", bsc: "bsc" };
const BASE_SYM: Record<string, string> = {
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": "WETH",
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": "USDC",
  "0xdac17f958d2ee523a2206206994597c13d831ec7": "USDT",
  "0x6b175474e89094c44da98b954eedeac495271d0f": "DAI",
  "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c": "WBNB",
  "0x55d398326f99059ff775485246999027b3197955": "USDT",
  "0xe9e7cea3dedca5984780bafc599bd69add087d56": "BUSD",
  "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d": "USDC",
};

const TABS = ["all", "WATCH", "CAUTION", "AVOID"] as const;
type Tab = (typeof TABS)[number];

function short(addr?: string | null): string {
  if (!addr) return "—";
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

function timeAgo(iso?: string | null): string {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const mins = Math.floor((Date.now() - t) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function tr(r: string): string {
  if (r.startsWith("taxa ")) return "tax " + r.slice(5);
  if (r.startsWith("deployer cu ")) {
    const n = r.match(/\d+/)?.[0] ?? "";
    return `deployer with ${n} prior rugs`;
  }
  const map: Record<string, string> = {
    "honeypot: nu poti vinde": "honeypot — can't sell",
    "restrictii de vanzare": "sell restrictions",
    "contract neverificat": "unverified contract",
    "deployer creat azi": "deployer created today",
    "contract verificat, non-honeypot": "verified contract",
    "taxe foarte mici": "very low taxes",
    "taxe rezonabile": "reasonable taxes",
    "fara steaguri majore": "no major flags",
    "plafonat de risc": "capped by risk",
    "GoPlus indisponibil (token prea nou?)": "GoPlus unavailable (too new?)",
    "fara date de securitate": "no security data",
  };
  return map[r] || r;
}

function Bar({ value, color }: { value: number; color: string }) {
  return (
    <div className="oncr-bar">
      <div className="oncr-bar-fill" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} />
    </div>
  );
}

function Card({ ev }: { ev: PairEvent }) {
  const rec = ev.recommendation;
  const v = VERDICT[rec?.verdict || "NO_DATA"] || VERDICT.NO_DATA;
  const early = ev.scores?.early?.score ?? 0;
  const threat = ev.scores?.threat?.score ?? 0;
  const reasonsEarly = ev.scores?.early?.reasons || [];
  const reasonsThreat = ev.scores?.threat?.reasons || [];
  const dep = ev.enrichment?.deployer;
  const explorer = EXPLORER[ev.chain] || EXPLORER.eth;
  const gt = GT_CHAIN[ev.chain] || "eth";

  return (
    <div className="oncr-card">
      <div className="oncr-card-head">
        <div>
          <div className="oncr-token">
            <span className="oncr-pair">{ev.enrichment?.token?.symbol || ev.token_symbol || "?"}<span className="oncr-base">/{ev.base_symbol || BASE_SYM[(ev.enrichment?.base_token || ev.base_token || "").toLowerCase()] || "?"}</span></span>
            <span className="oncr-dex">{ev.dex.replace("_", " ")}</span>
          </div>
          <div className="oncr-sub"><span className="oncr-addr">{short(ev.token_address)}</span> · {timeAgo(ev.block_time)} · {ev.chain.toUpperCase()}{ev.gecko?.reserve_usd ? ` · $${Math.round(Number(ev.gecko.reserve_usd)).toLocaleString()} liq` : ""}</div>
        </div>
        <span className="oncr-verdict" style={{ color: v.color, background: v.bg }}>
          <span className="oncr-dot" style={{ background: v.color }} />
          {v.label}
        </span>
      </div>

      <div className="oncr-bars">
        <div className="oncr-bar-col">
          <div className="oncr-bar-label"><span>Early</span><span style={{ color: early >= 60 ? "#5dcaa5" : undefined }}>{early}</span></div>
          <Bar value={early} color={early >= 60 ? "#1d9e75" : "#5f6b78"} />
        </div>
        <div className="oncr-bar-col">
          <div className="oncr-bar-label"><span>Threat</span><span style={{ color: threat >= 40 ? "#ef7676" : undefined }}>{threat}</span></div>
          <Bar value={threat} color={threat >= 40 ? "#e24b4a" : "#5f6b78"} />
        </div>
      </div>

      {(reasonsThreat.length > 0 || reasonsEarly.length > 0) && (
        <div className="oncr-chips">
          {reasonsThreat.map((r, i) => (
            <span key={`t${i}`} className="oncr-chip oncr-chip-bad">{tr(r)}</span>
          ))}
          {reasonsEarly.map((r, i) => (
            <span key={`e${i}`} className="oncr-chip oncr-chip-good">{tr(r)}</span>
          ))}
        </div>
      )}

      <div className="oncr-foot">
        <span className="oncr-deployer">
          deployer {short(dep?.address)}
          {dep && dep.prior_rugs > 0 && (
            <span className="oncr-flag-bad"> · {dep.prior_rugs} rugs</span>
          )}
          {dep && dep.prior_rugs === 0 && dep.prior_deploys > 0 && (
            <span className="oncr-flag-warn"> · {dep.prior_deploys} deploys</span>
          )}
        </span>
        <span className="oncr-actions">
          <a className="oncr-btn oncr-btn-chart" href={`https://www.geckoterminal.com/${gt}/pools/${ev.pair_address}`} target="_blank" rel="noreferrer">CHART</a>
          <a className="oncr-btn oncr-btn-explorer" href={`${explorer}/token/${ev.token_address}`} target="_blank" rel="noreferrer">EXPLORER</a>
        </span>
      </div>
    </div>
  );
}

export default function OnChainRadarPage() {
  const [events, setEvents] = useState<PairEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [updated, setUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`${API_BASE}/api/crypto/onchain/new-pairs?since_minutes=1440&limit=200`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setEvents(Array.isArray(json.events) ? json.events : []);
      setUpdated(new Date());
    } catch (e: any) {
      setError(e?.message || "failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  const counts = useMemo(() => {
    const c = { all: 0, WATCH: 0, CAUTION: 0, AVOID: 0 };
    for (const e of events) {
      const vd = e.recommendation?.verdict;
      if (vd === "WATCH") { c.WATCH++; c.all++; }
      else if (vd === "CAUTION") { c.CAUTION++; c.all++; }
      else if (vd === "AVOID" || vd === "HONEYPOT") { c.AVOID++; c.all++; }
    }
    return c;
  }, [events]);

  const filtered = useMemo(() => {
    let list: PairEvent[];
    if (tab === "all") list = events.filter((e) => SCORED.includes(e.recommendation?.verdict || ""));
    else if (tab === "AVOID") list = events.filter((e) => ["AVOID", "HONEYPOT"].includes(e.recommendation?.verdict || ""));
    else list = events.filter((e) => e.recommendation?.verdict === tab);
    return [...list].sort((a, b) => {
      const pa = PRIORITY[a.recommendation?.verdict || "NO_DATA"] ?? 9;
      const pb = PRIORITY[b.recommendation?.verdict || "NO_DATA"] ?? 9;
      if (pa !== pb) return pa - pb;
      return (b.scores?.early?.score ?? 0) - (a.scores?.early?.score ?? 0);
    });
  }, [events, tab]);

  return (
    <div className="oncr-root">
      <style>{CSS}</style>

      <div className="oncr-header">
        <h1 className="oncr-title">On-chain radar</h1>
        <p className="oncr-tagline">New token pairs across ETH, BSC & Solana, scored live · {updated ? `updated ${timeAgo(updated.toISOString())}` : "loading"}</p>
      </div>

      <div className="oncr-help">
        <p className="oncr-help-lead">Each card is a brand-new token just listed on a DEX, caught within seconds and scored automatically — so you can spot early plays and skip scams at a glance. The code (0x…) is the token's contract address; new tokens have no symbol yet.</p>
        <div className="oncr-help-grid">
          <div className="oncr-help-item"><span className="oncr-help-k">Early</span><span className="oncr-help-v">upside potential — verified contract, low tax, clean deployer</span></div>
          <div className="oncr-help-item"><span className="oncr-help-k">Threat</span><span className="oncr-help-v">danger — honeypot, high tax, repeat-rug deployer</span></div>
          <div className="oncr-help-item"><span className="oncr-help-k">Verdict</span><span className="oncr-help-v">
            <span className="oncr-leg"><span className="oncr-dot" style={{ background: VERDICT.WATCH.color }} />Watch — worth a look</span>
            <span className="oncr-leg"><span className="oncr-dot" style={{ background: VERDICT.CAUTION.color }} />Caution — check first</span>
            <span className="oncr-leg"><span className="oncr-dot" style={{ background: VERDICT.AVOID.color }} />Avoid — stay away</span>
          </span></div>
        </div>
      </div>

      <div className="oncr-stats">
        {(["all", "WATCH", "CAUTION", "AVOID"] as Tab[]).map((t) => {
          const meta = t === "all" ? { label: "All", color: "#e6e8eb" } : { label: VERDICT[t].label, color: VERDICT[t].color };
          const active = tab === t;
          return (
            <button key={t} className={`oncr-stat${active ? " oncr-stat-active" : ""}`} onClick={() => setTab(t)}>
              <span className="oncr-stat-label">{meta.label}</span>
              <span className="oncr-stat-num" style={{ color: meta.color }}>{counts[t]}</span>
            </button>
          );
        })}
      </div>

      {loading && <div className="oncr-empty">Loading feed…</div>}
      {error && !loading && (
        <div className="oncr-empty oncr-err">Couldn't load the feed ({error}). It will retry automatically.</div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <div className="oncr-empty">No scored tokens yet — new pairs are still being analyzed. They appear here once security data is available.</div>
      )}

      <div className="oncr-list">
        {filtered.map((ev) => (
          <Card key={`${ev.chain}-${ev.pair_address}-${ev.token_address}`} ev={ev} />
        ))}
      </div>
    </div>
  );
}

const CSS = `
.oncr-root{color:#e6e8eb;font-family:Inter,system-ui,sans-serif;max-width:880px;margin:0 auto;padding:8px 0 40px;}
.oncr-header{margin-bottom:14px;}
.oncr-title{font-size:24px;font-weight:600;margin:0;color:#f2f4f6;}
.oncr-tagline{font-size:13px;color:#8b95a1;margin:4px 0 0;}
.oncr-help{background:#121519;border:1px solid #2a313a;border-radius:12px;padding:18px 20px;margin-bottom:20px;}
.oncr-help-lead{font-size:15px;line-height:1.65;color:#cdd4dc;margin:0 0 14px;}
.oncr-help-grid{display:flex;flex-direction:column;gap:11px;}
.oncr-help-item{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap;}
.oncr-help-k{font-size:13px;font-weight:600;color:#f2f4f6;min-width:78px;text-transform:uppercase;letter-spacing:.5px;}
.oncr-help-v{font-size:14px;color:#aeb6bf;display:flex;gap:16px;flex-wrap:wrap;line-height:1.5;}
.oncr-leg{display:inline-flex;align-items:center;gap:6px;}
.oncr-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px;}
.oncr-stat{display:flex;flex-direction:column;align-items:flex-start;gap:2px;background:#14161a;border:1px solid #232830;border-radius:10px;padding:12px 14px;cursor:pointer;text-align:left;}
.oncr-stat:hover{border-color:#323945;}
.oncr-stat-active{border-color:#3a86d6;background:#15191f;}
.oncr-stat-label{font-size:12px;color:#8b95a1;}
.oncr-stat-num{font-size:24px;font-weight:600;line-height:1.1;}
.oncr-list{display:flex;flex-direction:column;gap:10px;}
.oncr-card{background:#14161a;border:1px solid #232830;border-radius:12px;padding:14px 16px;}
.oncr-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:12px;}
.oncr-token{display:flex;align-items:center;gap:8px;}
.oncr-mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:14px;color:#f2f4f6;}
.oncr-pair{font-size:16px;font-weight:600;color:#f2f4f6;}
.oncr-base{color:#8b95a1;font-weight:400;}
.oncr-addr{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;}
.oncr-dex{font-size:11px;padding:2px 8px;border-radius:6px;background:#1d2128;color:#9aa3ad;}
.oncr-sub{font-size:12px;color:#6b7480;margin-top:4px;}
.oncr-verdict{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;padding:5px 11px;border-radius:8px;white-space:nowrap;}
.oncr-dot{width:7px;height:7px;border-radius:50%;display:inline-block;}
.oncr-bars{display:flex;gap:16px;margin-bottom:12px;}
.oncr-bar-col{flex:1;}
.oncr-bar-label{display:flex;justify-content:space-between;font-size:12px;color:#8b95a1;margin-bottom:5px;}
.oncr-bar{height:6px;background:#222831;border-radius:4px;overflow:hidden;}
.oncr-bar-fill{height:100%;border-radius:4px;}
.oncr-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;}
.oncr-chip{font-size:12px;padding:3px 10px;border-radius:6px;}
.oncr-chip-bad{background:rgba(226,75,74,0.14);color:#ef8d8d;}
.oncr-chip-good{background:rgba(29,158,117,0.14);color:#6fd0ad;}
.oncr-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;padding-top:11px;border-top:1px solid #20242b;}
.oncr-deployer{font-size:12px;color:#8b95a1;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;}
.oncr-flag-bad{color:#ef7676;}
.oncr-flag-warn{color:#f0b54a;}
.oncr-actions{display:flex;gap:8px;}
.oncr-btn{font-size:13px;font-weight:600;letter-spacing:.6px;padding:8px 18px;border-radius:8px;text-decoration:none;border:none;}
.oncr-btn-chart{background:#1d9e75;color:#04241b;}
.oncr-btn-chart:hover{background:#22b384;}
.oncr-btn-explorer{background:#378add;color:#03203c;}
.oncr-btn-explorer:hover{background:#4796e8;}
.oncr-empty{text-align:center;color:#8b95a1;font-size:14px;padding:40px 20px;background:#121418;border:1px solid #20242b;border-radius:12px;}
.oncr-err{color:#ef8d8d;}
@media(max-width:560px){.oncr-stats{grid-template-columns:repeat(2,1fr);}}
`;

