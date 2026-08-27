import { useState } from "react";

type Flag = { level: "red" | "amber" | "unknown" | "green"; text: string };
type Result = {
  chain: string; address: string; symbol: string | null; score: number;
  verdict: string; coverage: string; coverage_note: string;
  blocks: Record<string, number | null>; flags: Flag[]; checked_at: string;
};

const CHAINS = [
  { id: "solana", label: "Solana" }, { id: "eth", label: "Ethereum" },
  { id: "bsc", label: "BNB Chain" }, { id: "base", label: "Base" },
  { id: "polygon", label: "Polygon" }, { id: "arbitrum", label: "Arbitrum" },
  { id: "avalanche", label: "Avalanche" }, { id: "zksync", label: "zkSync" },
];

const BLOCK_LABELS: Record<string, string> = {
  contract: "Contract", liquidity: "Liquidity", holders: "Holders",
  activity: "Activity", creator: "Creator history",
};

const VERDICT_STYLE: Record<string, string> = {
  "low risk": "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30",
  "medium risk": "bg-amber-500/10 text-amber-300 ring-amber-500/30",
  "high risk": "bg-orange-500/10 text-orange-300 ring-orange-500/30",
  "very high risk": "bg-rose-500/10 text-rose-300 ring-rose-500/30",
  unverified: "bg-slate-500/10 text-slate-300 ring-slate-500/30",
  "insufficient data": "bg-slate-500/10 text-slate-300 ring-slate-500/30",
};

const FLAG_STYLE: Record<Flag["level"], { dot: string; text: string; label: string }> = {
  red: { dot: "bg-rose-400", text: "text-rose-200", label: "Risk" },
  amber: { dot: "bg-amber-400", text: "text-amber-200", label: "Caution" },
  unknown: { dot: "bg-slate-500", text: "text-slate-400", label: "Unverified" },
  green: { dot: "bg-emerald-400", text: "text-slate-300", label: "Clear" },
};

export default function RugCheckerPage() {
  const [address, setAddress] = useState("");
  const [chain, setChain] = useState("solana");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  function onAddressChange(v: string) {
    setAddress(v);
    if (touched) return;
    const a = v.trim();
    if (/^0x/.test(a)) setChain("eth");
    else if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a)) setChain("solana");
  }

  async function check() {
    const a = address.trim();
    if (!a) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch(`/api/crypto/rug-check/${chain}/${a}`);
      const data = await res.json();
      if (!res.ok) setError(data?.detail || "Could not check this token.");
      else setResult(data as Result);
    } catch {
      setError("Network error. Try again.");
    } finally { setLoading(false); }
  }

  const verified = result ? Number(result.coverage.split("/")[0]) : 0;
  const total = result ? Number(result.coverage.split("/")[1]) : 5;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-3xl px-5 py-14">
        <a href="/dashboard" className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-slate-200">
          <span aria-hidden="true">&#8592;</span> Back to dashboard
        </a>

        <header className="mb-10">
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-slate-500">Token safety</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Honeypot &amp; rug pull check</h1>
          <p className="mt-3 max-w-xl text-slate-400">
            Paste a contract address. We check what can be checked and say plainly what we could not.
          </p>
        </header>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input value={address} onChange={(e) => onAddressChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && check()}
              placeholder="Contract address" spellCheck={false}
              className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 font-mono text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-slate-500" />
            <select value={chain} onChange={(e) => { setChain(e.target.value); setTouched(true); }}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-200 outline-none focus:border-slate-500">
              {CHAINS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <button onClick={check} disabled={loading || !address.trim()}
              className="rounded-lg bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-white disabled:bg-slate-700 disabled:text-slate-400">
              {loading ? "Checking..." : "Check"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-rose-900/60 bg-rose-950/30 p-4 text-sm text-rose-200">{error}</div>
        )}

        {result && (
          <div className="mt-8 space-y-5">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold">{result.symbol || "Unknown token"}</div>
                  <div className="mt-1 break-all font-mono text-xs text-slate-500">{result.address}</div>
                </div>
                <span className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize ring-1 ${VERDICT_STYLE[result.verdict] || VERDICT_STYLE.unverified}`}>
                  {result.verdict}
                </span>
              </div>
              <div className="mt-6 border-t border-slate-800 pt-5">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-slate-400">{verified} of {total} checks completed</span>
                  <span className="font-mono text-sm text-slate-500">{result.score}/100</span>
                </div>
                <div className="mt-2 flex gap-1.5">
                  {Array.from({ length: total }).map((_, i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full ${i < verified ? "bg-slate-300" : "bg-slate-800"}`} />
                  ))}
                </div>
                <p className="mt-3 text-xs leading-relaxed text-slate-500">{result.coverage_note}</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">Findings</h2>
              <ul className="space-y-3">
                {result.flags.map((f, i) => (
                  <li key={i} className="flex gap-3">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${FLAG_STYLE[f.level].dot}`} />
                    <div>
                      <span className="mr-2 text-[11px] uppercase tracking-wider text-slate-600">{FLAG_STYLE[f.level].label}</span>
                      <span className={`text-sm ${FLAG_STYLE[f.level].text}`}>{f.text}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">Breakdown</h2>
              <div className="space-y-3">
                {Object.entries(result.blocks).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-4">
                    <span className="w-32 shrink-0 text-sm text-slate-400">{BLOCK_LABELS[key] || key}</span>
                    {val === null ? (
                      <span className="text-sm text-slate-600">Not available</span>
                    ) : (
                      <>
                        <div className="h-1.5 flex-1 rounded-full bg-slate-800">
                          <div className={`h-1.5 rounded-full ${val >= 80 ? "bg-emerald-400" : val >= 50 ? "bg-amber-400" : "bg-rose-400"}`}
                            style={{ width: `${val}%` }} />
                        </div>
                        <span className="w-10 shrink-0 text-right font-mono text-xs text-slate-500">{val}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <p className="px-1 text-xs leading-relaxed text-slate-600">
              This check is informational and not financial advice. A clean result does not make a token safe —
              it means nothing we can measure looked wrong at {new Date(result.checked_at).toLocaleString()}.
            </p>
          </div>
        )}

        {!result && !error && !loading && (
          <div className="mt-8 rounded-xl border border-dashed border-slate-800 p-8 text-center text-sm text-slate-500">
            Enter a contract address to run a check.
          </div>
        )}
      </div>
    </div>
  );
}
