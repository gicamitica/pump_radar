import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const riskColor = (r: string) => r === 'HIGH' ? '#ff5468' : r === 'MEDIUM' ? '#f5c451' : '#27EAA4';

const timeAgo = (ts: number) => {
  const mins = Math.max(0, Math.floor((Date.now() / 1000 - ts) / 60));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
};

export default function WhaleAlertsPage() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/crypto/whale-alerts/feed')
      .then(r => r.json())
      .then(j => {
        if (j?.success) setAlerts(j.data || []);
        else setErr('Could not load alerts');
      })
      .catch(() => setErr('Error loading alerts'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{maxWidth:1100,margin:'0 auto',padding:'32px 16px 60px',fontFamily:"'Space Grotesk',system-ui,sans-serif"}}>
      <div style={{marginBottom:24}}>
        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,letterSpacing:2,color:'#525a73'}}>LIVE FEED</span>
        <h1 style={{color:'#fff',fontSize:28,fontWeight:700,margin:'6px 0 0'}}>Whale alerts</h1>
        <p style={{color:'#7d88a3',fontSize:14,margin:'6px 0 0'}}>Automatic detection of large wallet movements across actively signaled tokens, checked hourly.</p>
      </div>

      {loading && (
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:12,padding:60}}>
          <div style={{width:32,height:32,border:'3px solid #161b27',borderTopColor:'#27eaa4',borderRadius:'50%',animation:'wafeedspin .8s linear infinite'}} />
          <style>{`@keyframes wafeedspin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {err && <p style={{color:'#ff5468',fontSize:14}}>{err}</p>}

      {!loading && !err && alerts.length === 0 && (
        <div style={{background:'#0c121c',border:'1px solid #26314a',borderRadius:16,padding:40,textAlign:'center'}}>
          <p style={{color:'#7d88a3',fontSize:14,margin:0}}>No whale alerts yet. Checks run automatically every hour on actively signaled tokens.</p>
        </div>
      )}

      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        {alerts.map((a: any) => {
          const c = riskColor(a.risk);
          return (
            <div
              key={a._id}
              onClick={() => navigate(`/coin/${a.symbol}/whale?chain=eth&addr=${a.token_address}`)}
              style={{background:'#0c121c',border:'1px solid #26314a',borderRadius:16,padding:20,cursor:'pointer'}}
            >
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontWeight:700,color:'#fff',fontSize:16}}>{a.symbol}</span>
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:c,border:'1px solid',borderColor:c,borderRadius:999,padding:'2px 10px'}}>{a.risk} RISK</span>
                </div>
                <span style={{fontSize:12,color:'#525a73'}}>{timeAgo(a.created_at)}</span>
              </div>
              <p style={{color:'#7d88a3',fontSize:13,lineHeight:1.5,margin:'0 0 10px'}}>{a.reasoning}</p>
              <div style={{fontSize:12,color:'#7d88a3'}}>
                {a.summary?.whales_selling_or_moving_out || 0} whales moving out &middot; {a.summary?.whales_withdrawing || 0} withdrawing &middot; net ${(a.summary?.net_pressure_usd || 0).toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
