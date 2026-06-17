import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type PageKey = 'about' | 'docs' | 'status' | 'contact' | 'privacy' | 'terms';

const TG = 'https://t.me/PumpRadarSignals';
const X = 'https://x.com/PumpRadarApp';
const SITE = 'https://pump.arbitrajz.com';

const CONTENT: Record<PageKey, { title: string; body: string }> = {
  about: {
    title: 'About PumpRadar',
    body: `
      <p>PumpRadar is an AI-powered crypto signal platform that detects new tokens and meme coins before they pump. It continuously scans on-chain activity, whale wallet movements, and social sources, then runs every candidate through automated safety checks for honeypots and rug-pull risk.</p>
      <p>Our core principle is verifiability. Every signal is logged with an exact timestamp, and our track record is public — anyone can check what we flagged and what the price did next. No backtesting, no retroactive edits.</p>
      <p>We built PumpRadar for traders who are tired of hype-driven calls and want data-driven, early signals with the safety context to avoid scams.</p>
      <p><a href="${SITE}/track-record">See the public track record →</a></p>
    `,
  },
  docs: {
    title: 'Documentation',
    body: `
      <p>Full documentation is coming soon. In the meantime, here's how PumpRadar works at a glance:</p>
      <p><b>Signal categories:</b> tokens are classified into pump, early, watch, dump, risk and DEX signals, each with an AI confidence score from 0 to 100.</p>
      <p><b>Safety checks:</b> every token is screened for honeypot behavior, mint/freeze authority and holder concentration before it reaches you.</p>
      <p><b>Track record:</b> each signal is timestamped and measured against later price action. You can verify everything yourself.</p>
      <p>Questions in the meantime? Reach us on <a href="${TG}">Telegram</a>.</p>
    `,
  },
  status: {
    title: 'System Status',
    body: `
      <p><span class="dot"></span> <b>All systems operational.</b></p>
      <p>Signal scanning, on-chain enrichment, and alerts are running normally.</p>
      <p>If you're experiencing an issue, please reach out on <a href="${TG}">Telegram</a> and we'll look into it.</p>
    `,
  },
  contact: {
    title: 'Contact',
    body: `
      <p>The fastest way to reach us is on Telegram.</p>
      <p>📡 Telegram: <a href="${TG}">@PumpRadarSignals</a></p>
      <p>🐦 X: <a href="${X}">@PumpRadarApp</a></p>
      <p>For partnership or cross-promotion inquiries, message us directly on Telegram.</p>
    `,
  },
  privacy: {
    title: 'Privacy Policy',
    body: `
      <p class="muted">Last updated: June 2026</p>
      <p>PumpRadar ("we", "us") operates the website pump.arbitrajz.com. This policy explains what we collect and how we use it.</p>
      <p><b>Information we collect.</b> When you create an account we store your email address and name. When you subscribe, payment is processed by Stripe; we do not store your card details. We use functional cookies and local storage strictly to keep you logged in and to remember referral attribution.</p>
      <p><b>How we use it.</b> To provide the service, authenticate you, process subscriptions, and send service-related emails (such as account verification and signal alerts you opt into).</p>
      <p><b>Third parties.</b> We use Stripe for payments and email providers for transactional email. We do not sell your personal data.</p>
      <p><b>Your rights.</b> You may request access to or deletion of your account data at any time by contacting us on <a href="${TG}">Telegram</a>.</p>
      <p><b>Data retention.</b> We keep account data while your account is active. If you delete your account, associated data is removed.</p>
      <p class="muted">This policy may be updated as the service evolves. Material changes will be reflected on this page.</p>
    `,
  },
  terms: {
    title: 'Terms of Service',
    body: `
      <p class="muted">Last updated: June 2026</p>
      <p>By accessing or using PumpRadar you agree to these terms.</p>
      <p><b>Not financial advice.</b> PumpRadar provides data-driven signals and analytics for informational purposes only. Nothing on this platform constitutes financial, investment, or trading advice. Cryptocurrency trading is highly risky and you may lose your entire investment. You are solely responsible for your own decisions.</p>
      <p><b>No guarantees.</b> Signals are based on automated analysis and may be incorrect. Past performance, including any track record shown, does not guarantee future results.</p>
      <p><b>Subscriptions.</b> Paid plans are billed through Stripe. You may cancel at any time; access continues until the end of the billing period. Trials, if offered, convert to paid plans unless cancelled before the trial ends.</p>
      <p><b>Acceptable use.</b> You agree not to abuse, scrape, resell, or attempt to disrupt the service.</p>
      <p><b>Liability.</b> The service is provided "as is" without warranties of any kind. We are not liable for any losses arising from your use of the platform or reliance on its signals.</p>
      <p><b>Contact.</b> Questions about these terms? Reach us on <a href="${TG}">Telegram</a>.</p>
    `,
  },
};

function buildDoc(key: PageKey): string {
  const { title, body } = CONTENT[key];
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet"><style>html,body{margin:0;background:#04070c;-webkit-text-size-adjust:100%}*{box-sizing:border-box}body{font-family:Manrope,system-ui,sans-serif;color:#e2e8f0;min-height:100dvh}::selection{background:rgba(43,217,232,.32);color:#fff}.ocean{background:radial-gradient(900px 520px at 80% -8%,rgba(43,217,232,.13),transparent 60%),radial-gradient(760px 520px at 8% 4%,rgba(39,234,164,.11),transparent 58%);min-height:100dvh}.wrap{position:relative;z-index:10;width:100%;max-width:680px;margin:0 auto;padding:0 20px 56px;padding-top:max(20px,env(safe-area-inset-top))}.topbar{display:flex;align-items:center;justify-content:space-between;padding:14px 0 4px}.backbtn{display:flex;align-items:center;gap:6px;color:#7d88a3;font-size:14px;font-weight:500;background:none;border:none;cursor:pointer}.backbtn:hover{color:#e2e8f0}.brand{display:flex;align-items:center;gap:8px;font-family:'Space Grotesk';font-weight:700;font-size:14px;color:#fff}.logo{width:22px;height:22px;border-radius:50%;border:2px solid #27EAA4;position:relative}.logo::after{content:'';position:absolute;inset:3px;border-radius:50%;background:radial-gradient(circle at 60% 40%,rgba(39,234,164,.5),transparent 70%)}h1{font-family:'Space Grotesk';font-weight:700;color:#fff;font-size:30px;line-height:1.15;margin:24px 0 18px}.content p{font-size:15px;line-height:1.7;color:#b9c2d4;margin:0 0 16px}.content b{color:#e2e8f0;font-weight:600}.content a{color:#2bd9e8;text-decoration:none}.content a:hover{text-decoration:underline}.content .muted{color:#525a73;font-size:13px}.dot{display:inline-block;width:9px;height:9px;border-radius:50%;background:#27EAA4;margin-right:4px;box-shadow:0 0 8px #27EAA4}.foot{margin-top:40px;border-top:1px solid #1c2740;padding-top:18px;font-size:12px;color:#525a73}.foot a{color:#7d88a3;text-decoration:none;margin-right:14px}.foot a:hover{color:#e2e8f0}</style></head><body><div id="root" class="ocean"><div class="wrap"><div class="topbar"><button class="backbtn" onclick="parent.postMessage({__info:'back'},'*')"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 18l-6-6 6-6"></path></svg>Back</button><div class="brand"><span class="logo"></span>PumpRadar</div></div><h1>${title}</h1><div class="content">${body}</div><div class="foot"><a href="${SITE}/about">About</a><a href="${SITE}/privacy">Privacy</a><a href="${SITE}/terms">Terms</a><a href="${SITE}/contact">Contact</a><br><br>Signals are not financial advice. Invest responsibly.</div></div></div><script>function postH(){try{var h=Math.ceil(document.getElementById('root').offsetHeight)+24;parent.postMessage({__info:'h',h:h},'*');}catch(e){}}window.addEventListener('load',function(){postH();setTimeout(postH,300);try{if(window.ResizeObserver){new ResizeObserver(postH).observe(document.getElementById('root'));}}catch(e){}});</script></body></html>`;
}

function keyFromPath(pathname: string): PageKey {
  const p = pathname.replace(/^\//, '').toLowerCase();
  if (p === 'about' || p === 'docs' || p === 'status' || p === 'contact' || p === 'privacy' || p === 'terms') {
    return p as PageKey;
  }
  return 'about';
}

export default function InfoPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [height, setHeight] = useState(700);
  const key = keyFromPath(location.pathname);

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      const d = e.data;
      if (!d || typeof d !== 'object') return;
      if (d.__info === 'back') navigate(-1);
      else if (d.__info === 'h' && typeof d.h === 'number') setHeight(Math.max(d.h, 400));
    }
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [navigate]);

  return (
    <iframe
      title="PumpRadar"
      srcDoc={buildDoc(key)}
      scrolling="no"
      style={{ width: '100%', height, border: 'none', background: '#04070c', display: 'block', overflow: 'hidden' }}
    />
  );
}
