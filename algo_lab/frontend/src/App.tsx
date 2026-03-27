import { useEffect, useMemo, useState } from 'react';

type SignalOutput = {
  symbol: string;
  name: string;
  verdict: string;
  direction: string;
  phase: string;
  timing: string;
  confidence: string;
  score: number;
  pump_probability: number;
  dump_probability: number;
  confirmation_score: number;
  manipulation_risk: number;
  tradability_score: number;
  fundamental_backing_score: number;
  social_coordination_score: number;
  action: string;
  tp_pct: number;
  sl_pct: number;
  why_now: string;
  what_confirms_it: string[];
  risk_note: string;
  red_flags: string[];
  preferred_venue: string;
  execution_note: string;
};

const API_BASE = 'http://127.0.0.1:8001';

export function App() {
  const [data, setData] = useState<SignalOutput[]>([]);
  const [selected, setSelected] = useState<string>('');

  useEffect(() => {
    fetch(`${API_BASE}/score-fixtures`)
      .then((res) => res.json())
      .then((payload) => {
        setData(payload);
        if (payload.length > 0) {
          setSelected(payload[0].symbol);
        }
      });
  }, []);

  const current = useMemo(() => data.find((x) => x.symbol === selected), [data, selected]);

  return (
    <main className="container">
      <h1>PumpRadar Algorithm Lab</h1>
      <p>Testare izolată pentru calibrarea verdict / direction / phase / timing / confidence.</p>

      <section className="card">
        <h2>Fixture Outputs</h2>
        <table>
          <thead>
            <tr>
              <th>Coin</th>
              <th>Verdict</th>
              <th>Direction</th>
              <th>Phase</th>
              <th>Timing</th>
              <th>Confidence</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.symbol} onClick={() => setSelected(row.symbol)} className={row.symbol === selected ? 'active' : ''}>
                <td>{row.symbol}</td>
                <td>{row.verdict}</td>
                <td>{row.direction}</td>
                <td>{row.phase}</td>
                <td>{row.timing}</td>
                <td>{row.confidence}</td>
                <td>{row.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {current && (
        <section className="card">
          <h2>{current.name} ({current.symbol})</h2>
          <div className="grid">
            <Metric label="score" value={current.score} />
            <Metric label="pump_probability" value={current.pump_probability} />
            <Metric label="dump_probability" value={current.dump_probability} />
            <Metric label="confirmation_score" value={current.confirmation_score} />
            <Metric label="manipulation_risk" value={current.manipulation_risk} />
            <Metric label="tradability_score" value={current.tradability_score} />
            <Metric label="fundamental_backing_score" value={current.fundamental_backing_score} />
            <Metric label="social_coordination_score" value={current.social_coordination_score} />
          </div>

          <h3>Operational clarity</h3>
          <ul>
            <li><strong>why_now:</strong> {current.why_now}</li>
            <li><strong>risk_note:</strong> {current.risk_note}</li>
            <li><strong>preferred_venue:</strong> {current.preferred_venue}</li>
            <li><strong>execution_note:</strong> {current.execution_note}</li>
            <li><strong>TP / SL:</strong> {current.tp_pct}% / {current.sl_pct}%</li>
          </ul>

          <h3>what_confirms_it</h3>
          <ul>{current.what_confirms_it.map((f) => <li key={f}>{f}</li>)}</ul>

          <h3>red_flags</h3>
          <ul>{current.red_flags.length ? current.red_flags.map((f) => <li key={f}>{f}</li>) : <li>none</li>}</ul>
        </section>
      )}
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <article className="metric">
      <span>{label}</span>
      <strong>{value.toFixed(2)}</strong>
    </article>
  );
}
