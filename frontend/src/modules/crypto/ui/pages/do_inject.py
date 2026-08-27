#!/usr/bin/env python3
"""Injecteaza sectiunea funding in WhalePage.tsx, inainte de </body> din WHALE_DOC."""
import sys, re

F = "WhalePage.tsx"
s = open(F, encoding="utf-8").read()

INJECT = r'''<div id="fundingWrap" style="display:none;max-width:1100px;margin:16px auto 0;padding:0 16px;box-sizing:border-box"><div style="background:#0c121c;border:1px solid #26314a;border-radius:16px;padding:20px"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px"><span style="font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:2px;color:#525a73">FUNDING SOURCES</span><span id="fundBadge" style="font-family:'JetBrains Mono',monospace;font-size:12px;color:#525a73;border:1px solid #26314a;border-radius:999px;padding:4px 12px">GAS TRACE</span></div><div id="fundBody"><p style="color:#7d88a3;font-size:13px;line-height:1.5;margin:0 0 14px">Trace where the top holders got their ETH from. Reveals if wallets that look independent share a common funding source.</p><button id="fundBtn" style="width:100%;height:46px;border:none;border-radius:12px;cursor:pointer;background:linear-gradient(180deg,#27eaa4,#1fc98c);color:#04140f;font-weight:700;font-size:14px;font-family:inherit">Analyze funding sources</button></div></div></div>
<script>
(function(){
  function fmtAddr(a){return a?a.slice(0,6)+"\u2026"+a.slice(-4):"";}
  function showFunding(){
    try{
      var net=(DATA.network||'').toLowerCase();
      var wrap=document.getElementById('fundingWrap');
      if(!wrap) return;
      if(net==='eth'||net==='ethereum'){ wrap.style.display='block'; postH(); }
    }catch(e){}
  }
  function renderFunding(d){
    var body=document.getElementById('fundBody');
    var badge=document.getElementById('fundBadge');
    if(!d||!d.available){ body.innerHTML='<p style="color:#7d88a3;font-size:13px;margin:0">Funding data not available for this token right now.</p>'; postH(); return; }
    var risk=d.coordination_risk||'LOW';
    var col = risk==='HIGH'?'#ff5468':(risk==='MEDIUM'?'#f5c451':'#27EAA4');
    badge.textContent=risk+' RISK'; badge.style.color=col; badge.style.borderColor=col;
    var html='';
    if(d.clustered_wallets>0){
      html+='<div style="display:flex;align-items:baseline;gap:8px;margin-bottom:6px"><span style="font-weight:700;color:#fff;font-size:34px;line-height:1">'+d.holders_checked+'</span><span style="color:#7d88a3;font-size:14px">holders \u2192</span><span style="font-weight:700;color:'+col+';font-size:34px;line-height:1">'+d.private_sources+'</span><span style="color:#7d88a3;font-size:14px">private sources</span></div>';
      html+='<p style="color:#7d88a3;font-size:13px;margin:0 0 14px;line-height:1.5">'+d.clustered_wallets+' wallets trace back to shared private sources. Possible coordinated group.</p>';
      html+='<div style="display:flex;flex-direction:column;gap:8px">';
      (d.clusters||[]).forEach(function(c){
        html+='<div style="background:#04070c;border:1px solid rgba(255,84,104,.25);border-radius:8px;padding:10px 13px;display:flex;justify-content:space-between;align-items:center"><span style="font-family:\'JetBrains Mono\',monospace;font-size:13px;color:#e2e8f0">'+fmtAddr(c.source)+'</span><span style="color:'+col+';font-size:13px">funded '+c.wallet_count+' wallets</span></div>';
      });
      html+='</div>';
    } else {
      html+='<div style="display:flex;align-items:baseline;gap:8px;margin-bottom:6px"><span style="font-weight:700;color:#fff;font-size:34px;line-height:1">'+d.holders_checked+'</span><span style="color:#7d88a3;font-size:14px">holders traced</span></div>';
      html+='<p style="color:#7d88a3;font-size:13px;margin:0 0 12px;line-height:1.5">All funded independently. No shared private source detected.</p>';
      var exPct=d.holders_checked?Math.round(d.exchange_funded/d.holders_checked*100):0;
      html+='<div style="height:10px;border-radius:6px;overflow:hidden;display:flex;background:#04070c"><div style="width:'+exPct+'%;background:#27EAA4"></div><div style="width:'+(100-exPct)+'%;background:#26314a"></div></div>';
      html+='<div style="display:flex;justify-content:space-between;margin-top:9px;font-size:12px"><span style="color:#27EAA4">'+d.exchange_funded+' exchange-funded</span><span style="color:#7d88a3">'+d.no_source+' unknown</span></div>';
    }
    document.getElementById('fundBody').innerHTML=html; postH();
  }
  function runFunding(){
    var body=document.getElementById('fundBody');
    body.innerHTML='<div style="display:flex;flex-direction:column;align-items:center;gap:12px;padding:24px"><div class="fundspin" style="width:32px;height:32px;border:3px solid #161b27;border-top-color:#27eaa4;border-radius:50%;animation:fundspin .8s linear infinite"></div><span style="color:#7d88a3;font-size:13px">Analyzing funding sources\u2026 (~20s)</span></div>';
    postH();
    fetch('/api/crypto/funding/eth/'+DATA.address).then(function(r){return r.json();}).then(function(j){ renderFunding(j&&j.data);}).catch(function(){ renderFunding(null);});
  }
  var st=document.createElement('style'); st.textContent='@keyframes fundspin{to{transform:rotate(360deg)}}'; document.head.appendChild(st);
  document.addEventListener('click',function(e){ if(e.target&&e.target.id==='fundBtn') runFunding(); });
  var _oldBoot=window.boot;
  window.boot=function(){ if(_oldBoot) _oldBoot(); setTimeout(showFunding,300); };
})();
</script>
'''

esc = INJECT.replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n')

anchor = '</body>'
cnt = s.count(anchor)
if cnt != 1:
    print(f"EROARE: </body> gasit de {cnt} ori (astept 1). NU modific.")
    sys.exit(1)

s2 = s.replace(anchor, esc + anchor, 1)

if len(s2) - len(s) < 4000:
    print("EROARE: cresterea de lungime prea mica, ceva nu e ok."); sys.exit(1)

open(F, "w", encoding="utf-8").write(s2)
print(f"OK - injectat. Fisier: {len(s)} -> {len(s2)} bytes (+{len(s2)-len(s)})")