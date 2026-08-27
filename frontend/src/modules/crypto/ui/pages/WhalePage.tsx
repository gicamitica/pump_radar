import { useRef, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useService } from '@/app/providers/useDI';
import { AUTH_SYMBOLS } from '@/modules/auth/di/symbols';
import type { IAuthService } from '@/modules/auth/application/ports/IAuthService';

const WHALE_DOC = "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><link rel=\"preconnect\" href=\"https://fonts.googleapis.com\"><link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin><link href=\"https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap\" rel=\"stylesheet\"><style>*, ::before, ::after{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position: ;--tw-gradient-via-position: ;--tw-gradient-to-position: ;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgb(59 130 246 / 0.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: ;--tw-contain-size: ;--tw-contain-layout: ;--tw-contain-paint: ;--tw-contain-style: }::backdrop{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position: ;--tw-gradient-via-position: ;--tw-gradient-to-position: ;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgb(59 130 246 / 0.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: ;--tw-contain-size: ;--tw-contain-layout: ;--tw-contain-paint: ;--tw-contain-style: }\n/* ! tailwindcss v3.4.17 | MIT License | https://tailwindcss.com */\n*,::after,::before{box-sizing:border-box;border-width:0;border-style:solid;border-color:#e5e7eb}::after,::before{--tw-content:''}:host,html{line-height:1.5;-webkit-text-size-adjust:100%;-moz-tab-size:4;tab-size:4;font-family:ui-sans-serif, system-ui, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\", \"Noto Color Emoji\";font-feature-settings:normal;font-variation-settings:normal;-webkit-tap-highlight-color:transparent}body{margin:0;line-height:inherit}hr{height:0;color:inherit;border-top-width:1px}abbr:where([title]){-webkit-text-decoration:underline dotted;text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,pre,samp{font-family:\"JetBrains Mono\", ui-monospace, monospace;font-feature-settings:normal;font-variation-settings:normal;font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}table{text-indent:0;border-color:inherit;border-collapse:collapse}button,input,optgroup,select,textarea{font-family:inherit;font-feature-settings:inherit;font-variation-settings:inherit;font-size:100%;font-weight:inherit;line-height:inherit;letter-spacing:inherit;color:inherit;margin:0;padding:0}button,select{text-transform:none}button,input:where([type=button]),input:where([type=reset]),input:where([type=submit]){-webkit-appearance:button;background-color:transparent;background-image:none}:-moz-focusring{outline:auto}:-moz-ui-invalid{box-shadow:none}progress{vertical-align:baseline}::-webkit-inner-spin-button,::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}summary{display:list-item}blockquote,dd,dl,figure,h1,h2,h3,h4,h5,h6,hr,p,pre{margin:0}fieldset{margin:0;padding:0}legend{padding:0}menu,ol,ul{list-style:none;margin:0;padding:0}dialog{padding:0}textarea{resize:vertical}input::placeholder,textarea::placeholder{opacity:1;color:#9ca3af}[role=button],button{cursor:pointer}:disabled{cursor:default}audio,canvas,embed,iframe,img,object,svg,video{display:block;vertical-align:middle}img,video{max-width:100%;height:auto}[hidden]:where(:not([hidden=until-found])){display:none}.pointer-events-none{pointer-events:none}.fixed{position:fixed}.absolute{position:absolute}.relative{position:relative}.inset-0{inset:0px}.-top-24{top:-6rem}.bottom-0{bottom:0px}.left-1\\/2{left:50%}.top-0{top:0px}.-z-0{z-index:0}.z-10{z-index:10}.z-20{z-index:20}.mx-auto{margin-left:auto;margin-right:auto}.-mt-\\[92px\\]{margin-top:-92px}.mb-1{margin-bottom:0.25rem}.mb-2{margin-bottom:0.5rem}.mb-3{margin-bottom:0.75rem}.mb-4{margin-bottom:1rem}.mt-1{margin-top:0.25rem}.mt-1\\.5{margin-top:0.375rem}.mt-2{margin-top:0.5rem}.mt-4{margin-top:1rem}.mt-8{margin-top:2rem}.flex{display:flex}.grid{display:grid}.h-1\\.5{height:0.375rem}.h-12{height:3rem}.h-72{height:18rem}.h-full{height:100%}.min-h-screen{min-height:100vh}.w-1\\.5{width:0.375rem}.w-72{width:18rem}.w-\\[3px\\]{width:3px}.w-full{width:100%}.max-w-\\[300px\\]{max-width:300px}.max-w-\\[520px\\]{max-width:520px}.flex-1{flex:1 1 0%}.shrink-0{flex-shrink:0}.-translate-x-1\\/2{--tw-translate-x:-50%;transform:translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.grid-cols-3{grid-template-columns:repeat(3, minmax(0, 1fr))}.flex-col{flex-direction:column}.items-end{align-items:flex-end}.items-center{align-items:center}.justify-end{justify-content:flex-end}.justify-center{justify-content:center}.justify-between{justify-content:space-between}.gap-1{gap:0.25rem}.gap-1\\.5{gap:0.375rem}.gap-2{gap:0.5rem}.gap-3{gap:0.75rem}.gap-3\\.5{gap:0.875rem}.overflow-hidden{overflow:hidden}.overflow-visible{overflow:visible}.rounded-2xl{border-radius:1rem}.rounded-full{border-radius:9999px}.rounded-xl{border-radius:0.75rem}.border{border-width:1px}.border-danger\\/25{border-color:rgb(255 84 104 / 0.25)}.border-line2{--tw-border-opacity:1;border-color:rgb(38 49 74 / var(--tw-border-opacity, 1))}.border-neon\\/25{border-color:rgb(39 234 164 / 0.25)}.border-neon\\/40{border-color:rgb(39 234 164 / 0.4)}.bg-ink{--tw-bg-opacity:1;background-color:rgb(4 7 12 / var(--tw-bg-opacity, 1))}.bg-danger\\/\\[0\\.04\\]{background-color:rgb(255 84 104 / 0.04)}.bg-neon{--tw-bg-opacity:1;background-color:rgb(39 234 164 / var(--tw-bg-opacity, 1))}.bg-neon\\/10{background-color:rgb(39 234 164 / 0.1)}.bg-neon\\/\\[0\\.04\\]{background-color:rgb(39 234 164 / 0.04)}.bg-neon\\/\\[0\\.05\\]{background-color:rgb(39 234 164 / 0.05)}.bg-panel\\/60{background-color:rgb(12 18 28 / 0.6)}.bg-panel\\/85{background-color:rgb(12 18 28 / 0.85)}.bg-white\\/90{background-color:rgb(255 255 255 / 0.9)}.p-5{padding:1.25rem}.px-1{padding-left:0.25rem;padding-right:0.25rem}.px-2{padding-left:0.5rem;padding-right:0.5rem}.px-3{padding-left:0.75rem;padding-right:0.75rem}.px-4{padding-left:1rem;padding-right:1rem}.py-1{padding-top:0.25rem;padding-bottom:0.25rem}.py-3{padding-top:0.75rem;padding-bottom:0.75rem}.py-4{padding-top:1rem;padding-bottom:1rem}.pb-1{padding-bottom:0.25rem}.pb-10{padding-bottom:2.5rem}.pb-5{padding-bottom:1.25rem}.pl-3{padding-left:0.75rem}.pr-3{padding-right:0.75rem}.pt-2{padding-top:0.5rem}.pt-3{padding-top:0.75rem}.pt-4{padding-top:1rem}.text-left{text-align:left}.text-center{text-align:center}.text-right{text-align:right}.font-body{font-family:Manrope, system-ui, sans-serif}.font-display{font-family:\"Space Grotesk\", system-ui, sans-serif}.font-mono{font-family:\"JetBrains Mono\", ui-monospace, monospace}.text-2xl{font-size:1.5rem;line-height:2rem}.text-3xl{font-size:1.875rem;line-height:2.25rem}.text-\\[10px\\]{font-size:10px}.text-\\[11px\\]{font-size:11px}.text-\\[12px\\]{font-size:12px}.text-\\[13px\\]{font-size:13px}.text-\\[26px\\]{font-size:26px}.text-\\[34px\\]{font-size:34px}.text-\\[58px\\]{font-size:58px}.text-sm{font-size:0.875rem;line-height:1.25rem}.text-xl{font-size:1.25rem;line-height:1.75rem}.leading-none{line-height:1}.leading-relaxed{line-height:1.625}.tracking-\\[0\\.22em\\]{letter-spacing:0.22em}.tracking-tight{letter-spacing:-0.025em}.tracking-wider{letter-spacing:0.05em}.text-slate-200{--tw-text-opacity:1;color:rgb(226 232 240 / var(--tw-text-opacity, 1))}.text-amber{--tw-text-opacity:1;color:rgb(255 174 59 / var(--tw-text-opacity, 1))}.text-cyan{--tw-text-opacity:1;color:rgb(43 217 232 / var(--tw-text-opacity, 1))}.text-danger{--tw-text-opacity:1;color:rgb(255 84 104 / var(--tw-text-opacity, 1))}.text-ink{--tw-text-opacity:1;color:rgb(4 7 12 / var(--tw-text-opacity, 1))}.text-muted{--tw-text-opacity:1;color:rgb(125 136 163 / var(--tw-text-opacity, 1))}.text-muted2{--tw-text-opacity:1;color:rgb(82 90 115 / var(--tw-text-opacity, 1))}.text-neon{--tw-text-opacity:1;color:rgb(39 234 164 / var(--tw-text-opacity, 1))}.text-white{--tw-text-opacity:1;color:rgb(255 255 255 / var(--tw-text-opacity, 1))}.antialiased{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}.shadow-\\[0_0_12px_2px_rgba\\(255\\2c 255\\2c 255\\2c \\.55\\)\\]{--tw-shadow:0 0 12px 2px rgba(255,255,255,.55);--tw-shadow-colored:0 0 12px 2px var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)}.shadow-inner{--tw-shadow:inset 0 2px 4px 0 rgb(0 0 0 / 0.05);--tw-shadow-colored:inset 0 2px 4px 0 var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)}.backdrop-blur{--tw-backdrop-blur:blur(8px);-webkit-backdrop-filter:var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);backdrop-filter:var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia)}.transition-\\[width\\]{transition-property:width;transition-timing-function:cubic-bezier(0.4, 0, 0.2, 1);transition-duration:150ms}.transition-colors{transition-property:color, background-color, border-color, fill, stroke, -webkit-text-decoration-color;transition-property:color, background-color, border-color, text-decoration-color, fill, stroke;transition-property:color, background-color, border-color, text-decoration-color, fill, stroke, -webkit-text-decoration-color;transition-timing-function:cubic-bezier(0.4, 0, 0.2, 1);transition-duration:150ms}.duration-1000{transition-duration:1000ms}.hover\\:border-cyan\\/50:hover{border-color:rgb(43 217 232 / 0.5)}.hover\\:text-slate-200:hover{--tw-text-opacity:1;color:rgb(226 232 240 / var(--tw-text-opacity, 1))}@media (min-width: 640px){.sm\\:p-6{padding:1.5rem}.sm\\:px-5{padding-left:1.25rem;padding-right:1.25rem}}\n</style><style>\n  html{background:#04070c;-webkit-text-size-adjust:100%;}\n  ::selection{background:rgba(43,217,232,.32);color:#fff;}\n  body{min-height:100vh;min-height:100dvh;}\n\n  .ocean{background:\n    radial-gradient(900px 520px at 80% -8%, rgba(43,217,232,.13), transparent 60%),\n    radial-gradient(760px 520px at 8% 4%, rgba(39,234,164,.11), transparent 58%),\n    radial-gradient(820px 640px at 60% 116%, rgba(139,123,255,.10), transparent 60%);}\n  .dotgrid{background-image:radial-gradient(rgba(255,255,255,.04) 1px, transparent 1px);background-size:26px 26px;}\n\n  @keyframes flick{0%,100%{opacity:1;}50%{opacity:.4;}}\n  .live-dot{animation:flick 1.4s ease-in-out infinite;}\n\n  /* whale mascot bob */\n  @keyframes swim{0%,100%{transform:translateY(0) rotate(-1.5deg);}50%{transform:translateY(-6px) rotate(1.5deg);}}\n  .whale-bob{animation:swim 5.5s ease-in-out infinite;transform-origin:60% 60%;}\n  @keyframes fluke{0%,100%{transform:rotate(0);}50%{transform:rotate(-9deg);}}\n  .fluke{animation:fluke 3.1s ease-in-out infinite;transform-box:fill-box;transform-origin:88% 50%;}\n\n  /* bubbles */\n  @keyframes rise{0%{transform:translateY(0) scale(.7);opacity:0;}14%{opacity:.5;}100%{transform:translateY(-200px) scale(1.05);opacity:0;}}\n  .bubble{position:absolute;border-radius:9999px;background:radial-gradient(circle at 32% 30%, rgba(255,255,255,.45), rgba(43,217,232,.1) 60%, transparent 72%);border:1px solid rgba(120,230,255,.22);animation:rise linear infinite;}\n\n  .tnum{font-variant-numeric:tabular-nums;}\n\n  /* gauge */\n  @keyframes gaugeGlow{0%,100%{filter:drop-shadow(0 0 6px rgba(39,234,164,.45));}50%{filter:drop-shadow(0 0 16px rgba(39,234,164,.75));}}\n  .gauge-glow{animation:gaugeGlow 3s ease-in-out infinite;}\n\n  /* tug-of-war divider pulse */\n  @keyframes nudge{0%,100%{transform:translateX(-50%) scaleY(1);}50%{transform:translateX(-50%) scaleY(1.12);}}\n  .divider{animation:nudge 2.2s ease-in-out infinite;}\n\n  /* flowing stripes inside pressure bars */\n  @keyframes flowL{from{background-position:0 0;}to{background-position:32px 0;}}\n  @keyframes flowR{from{background-position:0 0;}to{background-position:-32px 0;}}\n  .flow-buy{background-image:linear-gradient(100deg,#27EAA4,#2bd9e8);position:relative;}\n  .flow-buy::after{content:\"\";position:absolute;inset:0;background-image:repeating-linear-gradient(115deg,rgba(255,255,255,.16) 0 2px,transparent 2px 16px);animation:flowL 1.1s linear infinite;}\n  .flow-sell{background-image:linear-gradient(260deg,#ff5468,#ff5db1);position:relative;}\n  .flow-sell::after{content:\"\";position:absolute;inset:0;background-image:repeating-linear-gradient(65deg,rgba(255,255,255,.16) 0 2px,transparent 2px 16px);animation:flowR 1.1s linear infinite;}\n\n  @keyframes pop{0%{opacity:0;transform:translateY(16px) scale(.98);}100%{opacity:1;transform:none;}}\n  .pop{animation:pop .55s cubic-bezier(.2,.7,.2,1) forwards;}\n  .pop-1{animation-delay:.05s;} .pop-2{animation-delay:.16s;} .pop-3{animation-delay:.27s;} .pop-4{animation-delay:.38s;} .pop-5{animation-delay:.49s;}\n\n  .btn-grad{background:linear-gradient(100deg,#27EAA4,#2bd9e8);transition:box-shadow .25s,transform .15s;}\n  .btn-grad:hover{box-shadow:0 0 30px -6px rgba(43,217,232,.7);transform:translateY(-1px);}\n\n  @media (prefers-reduced-motion:reduce){\n    .whale-bob,.fluke,.bubble,.live-dot,.gauge-glow,.divider,.flow-buy::after,.flow-sell::after{animation:none!important;}\n  }\n  ::-webkit-scrollbar{width:9px;height:9px;}\n  ::-webkit-scrollbar-thumb{background:#1c2740;border-radius:9px;}\n</style><style>html,body{margin:0}.text-neon{color:#27EAA4}.text-cyan{color:#2bd9e8}.text-amber{color:#ffae3b}.text-danger{color:#ff5468}.border-neon\\/40{border-color:rgba(39,234,164,.4)}.border-cyan\\/40{border-color:rgba(43,217,232,.4)}.border-amber\\/40{border-color:rgba(255,174,59,.4)}.border-danger\\/40{border-color:rgba(255,84,104,.4)}.bg-neon\\/10{background-color:rgba(39,234,164,.1)}.bg-cyan\\/10{background-color:rgba(43,217,232,.1)}.bg-amber\\/10{background-color:rgba(255,174,59,.1)}.bg-danger\\/10{background-color:rgba(255,84,104,.1)}.bg-neon{background-color:#27EAA4}.bg-cyan{background-color:#2bd9e8}.bg-amber{background-color:#ffae3b}.bg-danger{background-color:#ff5468}</style></head><body class=\"font-body text-slate-200 bg-ink antialiased\">\n\n<div id=\"wRoot\" class=\"ocean dotgrid\">\n  <div id=\"bubbles\" class=\"fixed inset-0 pointer-events-none -z-0\"></div>\n\n  <div class=\"relative z-10 w-full max-w-[520px] mx-auto px-4 sm:px-5 pb-8\" style=\"padding-top:max(16px,env(safe-area-inset-top));\">\n\n    <!-- top bar -->\n    <div class=\"flex items-center justify-between pt-3 pb-1\">\n      <button onclick=\"parent.postMessage({__whale:'back'},'*')\" style=\"cursor:pointer\" class=\"flex items-center gap-1.5 text-muted hover:text-slate-200 transition-colors text-sm font-500\">\n        <svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.2\"><path d=\"M15 18l-6-6 6-6\"></path></svg>\n        Back\n      </button>\n      <div class=\"flex items-center gap-2 font-mono text-[11px] text-muted2\">\n        <span class=\"w-1.5 h-1.5 rounded-full bg-neon live-dot\"></span> ON-CHAIN \u00b7 LIVE\n      </div>\n    </div>\n\n    <!-- token header -->\n    <div class=\"flex items-center gap-3.5 pt-4 pb-5\">\n      <div class=\"relative shrink-0\" style=\"width:60px;height:50px;\">\n        <div class=\"whale-bob w-full h-full\">\n          <svg viewBox=\"0 0 200 160\" class=\"w-full h-full overflow-visible\">\n            <defs>\n              <linearGradient id=\"wb\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#1d4f6b\"></stop><stop offset=\"1\" stop-color=\"#0c2840\"></stop></linearGradient>\n              <linearGradient id=\"wbel\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#bfeef0\"></stop><stop offset=\"1\" stop-color=\"#6fcfd8\"></stop></linearGradient>\n              <linearGradient id=\"we\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#5dffc0\"></stop><stop offset=\"1\" stop-color=\"#2bd9e8\"></stop></linearGradient>\n            </defs>\n            <g class=\"fluke\"><path d=\"M30 70 C14 54 4 52 0 60 C10 64 15 70 19 77 C12 81 7 89 6 98 C18 96 28 89 37 80 Z\" fill=\"url(#wb)\" stroke=\"url(#we)\" stroke-width=\"2.4\" stroke-linejoin=\"round\"></path></g>\n            <path d=\"M30 80 C42 54 74 42 116 44 C158 46 186 62 192 84 C194 96 184 102 168 104 C140 108 110 110 78 108 C50 106 30 98 26 88 C24 84 24 82 30 80 Z\" fill=\"url(#wb)\" stroke=\"url(#we)\" stroke-width=\"2.6\" stroke-linejoin=\"round\"></path>\n            <path d=\"M58 100 C84 110 120 110 150 104 C130 112 104 114 78 110 C66 108 60 104 58 100 Z\" fill=\"url(#wbel)\" opacity=\".9\"></path>\n            <circle cx=\"166\" cy=\"74\" r=\"5.4\" fill=\"#04141c\"></circle><circle cx=\"168\" cy=\"72\" r=\"1.6\" fill=\"#bdf6ff\"></circle>\n            <ellipse cx=\"132\" cy=\"48\" rx=\"5\" ry=\"2.4\" fill=\"#04141c\"></ellipse>\n          </svg>\n        </div>\n      </div>\n      <div>\n        <h1 class=\"font-display font-700 text-white text-[26px] leading-none tracking-tight\"><span id=\"wSym\">ENA</span> <span class=\"text-muted2 font-500\">\u2014 Whale Activity</span></h1>\n        <p class=\"font-mono text-[12px] text-muted2 mt-2\"><span id=\"wNet\">eth</span> \u00b7 on-chain analysis</p>\n      </div>\n    </div>\n\n    <!-- ===== WHALE SCORE GAUGE (hero, graphic) ===== -->\n    <div class=\"rounded-2xl border border-line2 bg-panel/85 backdrop-blur p-5 sm:p-6 pop pop-1 relative overflow-hidden\">\n      <div class=\"absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full\" style=\"background:radial-gradient(circle,rgba(39,234,164,.16),transparent 65%);\"></div>\n      <div class=\"relative flex items-center justify-between mb-1\">\n        <span class=\"font-mono text-[11px] tracking-[0.22em] text-muted2\">WHALE SCORE</span>\n        <span id=\"verdictPill\" class=\"font-mono text-[12px] text-neon border border-neon/40 bg-neon/10 rounded-full px-3 py-1 flex items-center gap-1.5\">\n          <span class=\"w-1.5 h-1.5 rounded-full bg-neon\"></span><span id=\"verdictLabel\">Accumulating</span>\n        </span>\n      </div>\n\n      <div class=\"relative flex flex-col items-center pt-2\">\n        <svg id=\"gauge\" viewBox=\"0 0 280 168\" class=\"w-full max-w-[300px] overflow-visible\">\n          <defs>\n            <linearGradient id=\"gFill\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"0\">\n              <stop offset=\"0\" stop-color=\"#ff5468\"></stop><stop offset=\"0.5\" stop-color=\"#ffae3b\"></stop><stop offset=\"1\" stop-color=\"#27EAA4\"></stop>\n            </linearGradient>\n          </defs>\n          <!-- track -->\n          <path d=\"M24 150 A116 116 0 0 1 256 150\" fill=\"none\" stroke=\"#101a2b\" stroke-width=\"20\" stroke-linecap=\"round\"></path>\n          <!-- tick marks -->\n          <g id=\"ticks\" stroke=\"#26314a\" stroke-width=\"2\"></g>\n          <!-- colored value arc -->\n          <path id=\"gaugeArc\" class=\"gauge-glow\" d=\"M24 150 A116 116 0 0 1 256 150\" fill=\"none\" stroke=\"url(#gFill)\" stroke-width=\"20\" stroke-linecap=\"round\" pathLength=\"100\" stroke-dasharray=\"100\" stroke-dashoffset=\"100\" style=\"transition:stroke-dashoffset 1.4s cubic-bezier(.2,.7,.2,1);\"></path>\n          <!-- needle -->\n          <g id=\"needle\" style=\"transform-box:view-box;transform-origin:140px 150px;transform:rotate(-90deg);transition:transform 1.4s cubic-bezier(.2,.7,.2,1);\">\n            <path d=\"M140 150 L140 46\" stroke=\"#e9f6ff\" stroke-width=\"3.4\" stroke-linecap=\"round\"></path>\n            <circle cx=\"140\" cy=\"46\" r=\"5\" fill=\"#e9f6ff\"></circle>\n          </g>\n          <circle cx=\"140\" cy=\"150\" r=\"11\" fill=\"#0c121c\" stroke=\"#26314a\" stroke-width=\"2\"></circle>\n          <circle cx=\"140\" cy=\"150\" r=\"4\" fill=\"#27EAA4\"></circle>\n        </svg>\n\n        <div class=\"relative -mt-[92px] flex flex-col items-center pointer-events-none\">\n          <div class=\"flex items-end gap-1\">\n            <span id=\"scoreNum\" class=\"font-display font-700 text-white text-[58px] leading-none tnum\">0</span>\n            <span class=\"font-display font-500 text-muted2 text-2xl leading-none mb-2\">/100</span>\n          </div>\n        </div>\n      </div>\n\n      <!-- gauge legend -->\n      <div class=\"relative mt-1 flex items-center justify-between font-mono text-[10px] text-muted2 px-1\">\n        <span class=\"text-danger\">DUMPING</span>\n        <span class=\"text-amber\">NEUTRAL</span>\n        <span class=\"text-neon\">ACCUMULATING</span>\n      </div>\n    </div>\n\n    <!-- ===== BUYER / SELLER PRESSURE (hero #2 \u2014 tug of war) ===== -->\n    <div class=\"mt-4 rounded-2xl border border-line2 bg-panel/85 backdrop-blur p-5 sm:p-6 pop pop-2\">\n      <div class=\"flex items-center justify-between mb-4\">\n        <span class=\"font-mono text-[11px] tracking-[0.22em] text-muted2\">BUYER / SELLER PRESSURE</span>\n        <span class=\"font-mono text-[11px] text-muted2\">by wallets</span>\n      </div>\n\n      <!-- big numbers on each side -->\n      <div class=\"flex items-end justify-between mb-3\">\n        <div class=\"text-left\">\n          <div class=\"font-display font-700 text-neon text-[34px] leading-none tnum\" id=\"buyPctLabel\">94%</div>\n          <div class=\"font-mono text-[11px] text-muted mt-1.5 flex items-center gap-1.5\">\n            <svg width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3\" class=\"text-neon\"><path d=\"M12 19V5M5 12l7-7 7 7\"></path></svg>\n            <span id=\"buyVol\"></span>\n          </div>\n        </div>\n        <div class=\"text-right\">\n          <div class=\"font-display font-700 text-danger text-[34px] leading-none tnum\" id=\"sellPctLabel\">6%</div>\n          <div class=\"font-mono text-[11px] text-muted mt-1.5 flex items-center justify-end gap-1.5\">\n            <span id=\"sellVol\"></span>\n            <svg width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3\" class=\"text-danger\"><path d=\"M12 5v14M5 12l7 7 7-7\"></path></svg>\n          </div>\n        </div>\n      </div>\n\n      <!-- tug of war bar -->\n      <div class=\"relative h-12 rounded-xl bg-ink overflow-hidden flex shadow-inner\">\n        <div id=\"buyBar\" class=\"flow-buy h-full flex items-center pl-3 transition-[width] duration-1000\" style=\"width:50%\">\n          <span class=\"relative z-10 font-mono font-700 text-ink text-[13px] flex items-center gap-1.5\">\n            <svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3\"><path d=\"M12 19V5M5 12l7-7 7 7\"></path></svg>\n            <span id=\"buyCount\">17</span> buyers\n          </span>\n        </div>\n        <div id=\"sellBar\" class=\"flow-sell h-full flex items-center justify-end pr-3 transition-[width] duration-1000\" style=\"width:50%\">\n          <span class=\"relative z-10 font-mono font-700 text-white text-[13px] flex items-center gap-1.5\">\n            <span id=\"sellCount\">1</span> seller\n            <svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3\"><path d=\"M12 5v14M5 12l7 7 7-7\"></path></svg>\n          </span>\n        </div>\n        <!-- moving divider -->\n        <div id=\"divider\" class=\"divider absolute top-0 bottom-0 w-[3px] bg-white/90 shadow-[0_0_12px_2px_rgba(255,255,255,.55)] z-20\" style=\"left:50%\"></div>\n      </div>\n\n      <!-- net flow callout -->\n      <div class=\"mt-4 rounded-xl border border-neon/25 bg-neon/[0.05] px-4 py-3 flex items-center justify-between\">\n        <span class=\"font-mono text-[11px] tracking-wider text-muted2\">BUY / SELL WALLETS</span>\n        <span class=\"font-display font-700 text-neon text-xl tnum\" id=\"netFlow\">+$17.3M</span>\n      </div>\n    </div>\n\n    <!-- ===== STAT TILES ===== -->\n    <div class=\"mt-4 grid grid-cols-3 gap-3 pop pop-3\">\n      <div class=\"rounded-2xl border border-line2 bg-panel/85 px-2 py-4 text-center\">\n        <div id=\"stMoves\" class=\"font-display font-700 text-3xl text-white tnum\">0</div>\n        <div class=\"font-mono text-[10px] tracking-wider text-muted2 mt-1.5\">LARGE MOVES</div>\n      </div>\n      <div class=\"rounded-2xl border border-neon/25 bg-neon/[0.04] px-2 py-4 text-center\">\n        <div id=\"stBuyers\" class=\"font-display font-700 text-3xl text-neon tnum\">0</div>\n        <div class=\"font-mono text-[10px] tracking-wider text-muted2 mt-1.5\">BUYERS</div>\n      </div>\n      <div class=\"rounded-2xl border border-danger/25 bg-danger/[0.04] px-2 py-4 text-center\">\n        <div id=\"stSellers\" class=\"font-display font-700 text-3xl text-danger tnum\">0</div>\n        <div class=\"font-mono text-[10px] tracking-wider text-muted2 mt-1.5\">SELLERS</div>\n      </div>\n    </div>\n\n    <!-- ===== VIEW TRANSACTIONS ===== -->\n    <button class=\"mt-4 w-full flex items-center justify-center gap-2 rounded-2xl border border-line2 hover:border-cyan/50 bg-panel/60 py-4 font-600 text-cyan transition-colors pop pop-4\" id=\"wExplore\" style=\"cursor:pointer\">\n      <svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5\"></path><path d=\"M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5\"></path></svg>\n      View on-chain transactions\n    </button>\n\n    \n    <p class=\"mt-8 text-center font-mono text-[11px] text-muted2 leading-relaxed px-4\">\n      Whale data from Dune Analytics \u00b7 refreshed each scan \u00b7 <span class=\"text-muted\">not financial advice</span>\n    </p>\n  </div>\n</div>\n\n\n<script>\nfunction byId(i){return document.getElementById(i);}\nvar _lastH=0;\nfunction measure(){var r=byId('wRoot');return Math.ceil((r?r.offsetHeight:document.documentElement.scrollHeight))+24;}\nfunction postH(){try{var h=measure();if(Math.abs(h-_lastH)>1){_lastH=h;parent.postMessage({__whale:'h',h:h},'*');}}catch(e){}}\nfunction explorerUrl(network,addr){var n=(network||'').toLowerCase();if(n==='solana'||n==='sol')return 'https://solscan.io/token/'+addr;if(n==='bsc')return 'https://bscscan.com/token/'+addr;if(n==='base')return 'https://basescan.org/token/'+addr;if(n==='arbitrum')return 'https://arbiscan.io/token/'+addr;if(n==='polygon'||n==='polygon_pos')return 'https://polygonscan.com/token/'+addr;return 'https://etherscan.io/token/'+addr;}\n(function(){var box=byId('bubbles');if(!box)return;for(var i=0;i<14;i++){var b=document.createElement('span');b.className='bubble';var s=4+Math.random()*14;b.style.width=s+'px';b.style.height=s+'px';b.style.left=(Math.random()*100)+'%';b.style.bottom=(-10-Math.random()*20)+'%';b.style.animationDuration=(7+Math.random()*7)+'s';b.style.animationDelay=(-Math.random()*10)+'s';box.appendChild(b);}})();\n(function(){var g=byId('ticks');if(!g)return;var cx=140,cy=150,r0=92,r1=104;for(var i=0;i<=10;i++){var a=Math.PI*(1-i/10);var x0=cx+r0*Math.cos(a),y0=cy-r0*Math.sin(a);var x1=cx+r1*Math.cos(a),y1=cy-r1*Math.sin(a);var ln=document.createElementNS('http://www.w3.org/2000/svg','line');ln.setAttribute('x1',x0);ln.setAttribute('y1',y0);ln.setAttribute('x2',x1);ln.setAttribute('y2',y1);ln.setAttribute('stroke',i===10?'#27EAA4':(i===0?'#ff5468':(i===5?'#ffae3b':'#26314a')));ln.setAttribute('stroke-width',i%5===0?3:2);g.appendChild(ln);}})();\nfunction setVerdict(score,dump){var pill=byId('verdictPill'),lbl=byId('verdictLabel');var conf;if(dump)conf={t:'Dumping',c:'danger'};else if(score>=85)conf={t:'Accumulating',c:'neon'};else if(score>=65)conf={t:'Buying',c:'cyan'};else if(score>=45)conf={t:'Neutral',c:'amber'};else if(score>=25)conf={t:'Distributing',c:'amber'};else conf={t:'Dumping',c:'danger'};lbl.textContent=conf.t;pill.className='font-mono text-[12px] rounded-full px-3 py-1 flex items-center gap-1.5 border text-'+conf.c+' border-'+conf.c+'/40 bg-'+conf.c+'/10';pill.querySelector('span').className='w-1.5 h-1.5 rounded-full bg-'+conf.c;}\nfunction render(d){\n  var buyers=d.buyers||0,sellers=d.sellers||0,score=d.score||0,moves=d.moves||0;\n  var total=Math.max(buyers+sellers,1);var buyPct=Math.round(buyers/total*100),sellPct=100-buyPct;\n  if(byId('wSym'))byId('wSym').textContent=d.symbol||'';\n  if(byId('wNet'))byId('wNet').textContent=d.network||'';\n  setVerdict(score,d.dump);\n  byId('buyPctLabel').textContent=buyPct+'%';byId('sellPctLabel').textContent=sellPct+'%';\n  byId('buyVol').textContent=buyers+(buyers===1?' buyer':' buyers');\n  byId('sellVol').textContent=sellers+(sellers===1?' seller':' sellers');\n  byId('buyCount').textContent=buyers;byId('sellCount').textContent=sellers;\n  byId('netFlow').textContent=buyers+' : '+sellers;\n  byId('stMoves').textContent=moves;byId('stBuyers').textContent=buyers;byId('stSellers').textContent=sellers;\n  var ex=byId('wExplore');if(ex&&d.address)ex.onclick=function(){window.open(explorerUrl(d.network,d.address),'_blank','noopener');};\n  postH();\n  setTimeout(function(){\n    byId('gaugeArc').style.strokeDashoffset=(100-score)+'';\n    byId('needle').style.transform='rotate('+(-90+score*1.8)+'deg)';\n    var bw=Math.max(buyPct,6),sw=Math.max(sellPct,6);var sum=bw+sw;bw=bw/sum*100;sw=100-bw;\n    byId('buyBar').style.width=bw+'%';byId('sellBar').style.width=sw+'%';byId('divider').style.left=bw+'%';\n  },200);\n  var el=byId('scoreNum'),start=null,dur=1400;\n  function step(ts){if(!start)start=ts;var p=Math.min((ts-start)/dur,1);var e=1-Math.pow(1-p,3);el.textContent=Math.round(score*e);if(p<1)requestAnimationFrame(step);}\n  setTimeout(function(){requestAnimationFrame(step);},200);\n  setTimeout(postH,300);setTimeout(postH,1800);\n  try{if(window.ResizeObserver){new ResizeObserver(postH).observe(byId('wRoot'));}}catch(e){}\n}\nvar _booted=false;\nfunction boot(){if(_booted)return;_booted=true;\n  var SYMBOL=\"__SYMBOL__\";\n  var DATA={symbol:SYMBOL,network:'',address:'',score:0,buyers:0,sellers:0,moves:0,dump:false};\n  var tok=null;try{tok=localStorage.getItem('auth_token')||localStorage.getItem('token');}catch(e){}\n  fetch('/api/crypto/signals-v2',{headers:tok?{Authorization:'Bearer '+tok}:{}})\n    .then(function(r){return r.json();})\n    .then(function(j){\n      if(j&&j.success&&j.data){var dt=j.data;var all=[].concat(dt.pump_signals||[],dt.dump_signals||[],dt.risk_signals||[],dt.watch_signals||[],dt.early_signals||[],dt.dex_signals||[]);\n        var f=all.find(function(s){return s.symbol&&s.symbol.toUpperCase()===SYMBOL.toUpperCase();});\n        if(f){DATA.network=f.network||'';DATA.address=f.token_address||'';}}\n      function resolveAndFetch(attempt){attempt=attempt||1;var _n=(DATA.network||'').toLowerCase();var chain=_n==='solana'?'solana':_n==='base'?'base':'eth';\n        fetch('/api/crypto/whale-movements/'+chain+'/'+DATA.address,{headers:tok?{Authorization:'Bearer '+tok}:{}}).then(function(r){return r.json();}).then(function(w){\n          var d=w&&w.data;var isErr=d&&d.available===false&&d.error;\n          if(isErr&&attempt<5){setTimeout(function(){resolveAndFetch(attempt+1);},10000);return;}\n          if(d&&d.available){var s=d.summary||{};var np=s.net_pressure_usd||0;var wOut=s.whales_selling_or_moving_out||0;var wIn=s.whales_withdrawing||0;var ev=(d.events||[]).length;\n            var score=50;if(np<=-100000)score=90;else if(np<=-25000)score=75;else if(np<-5000)score=60;else if(np>=100000)score=10;else if(np>=25000)score=25;else if(np>5000)score=40;\n            if(ev===0){score=50;wIn=0;wOut=0;}\n            DATA.score=score;DATA.buyers=wIn;DATA.sellers=wOut;DATA.moves=ev;DATA.dump=np>=50000;}\n          render(DATA);\n        }).catch(function(){if(attempt<5){setTimeout(function(){resolveAndFetch(attempt+1);},10000);}else{render(DATA);}});\n      }\n      if(DATA.address){resolveAndFetch();return;}\n      fetch('https://api.geckoterminal.com/api/v2/search/pools?query='+encodeURIComponent(SYMBOL)+'&page=1').then(function(r){return r.json();}).then(function(g){\n        var pools=(g&&g.data)||[];var sym=SYMBOL.toUpperCase();\n        var matches=pools.filter(function(p){var name=String((p.attributes&&p.attributes.name)||'').toUpperCase();var parts=name.split('/').map(function(s){return s.trim();});return parts.indexOf(sym)!==-1;}).sort(function(a,b){return parseFloat((b.attributes&&b.attributes.reserve_in_usd)||0)-parseFloat((a.attributes&&a.attributes.reserve_in_usd)||0);});\n        if(!matches.length){render(DATA);return;}\n        var top=matches[0];var name=String((top.attributes&&top.attributes.name)||'').toUpperCase();var nameParts=name.split('/').map(function(s){return s.trim();});var isBase=nameParts[0]===sym;var tokenId=isBase?((top.relationships&&top.relationships.base_token&&top.relationships.base_token.data&&top.relationships.base_token.data.id)||''):((top.relationships&&top.relationships.quote_token&&top.relationships.quote_token.data&&top.relationships.quote_token.data.id)||'');var partsId=tokenId.split('_');var addr=partsId.slice(1).join('_');var net=partsId[0];\n        if(addr){DATA.address=addr;DATA.network=net;resolveAndFetch();}else{render(DATA);}\n      }).catch(function(){render(DATA);});\n    }).catch(function(){render(DATA);});\n}\nwindow.addEventListener('load',function(){if(document.fonts&&document.fonts.ready){document.fonts.ready.then(boot);setTimeout(boot,1200);}else{boot();}});\nwindow.addEventListener('resize',postH);\n</script>\n\n</body></html>";

export default function WhalePage() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const auth = useService<IAuthService>(AUTH_SYMBOLS.IAuthService);
  const currentUser = auth.getCurrentUser() as any;
  const userSub = (currentUser?.subscription || 'free').toLowerCase();
  const isProUser = userSub === 'monthly' || userSub === 'annual' || userSub === 'trial' || userSub === 'active' || userSub === 'pro';
  if (!isProUser) {
    return (
      <div style={{maxWidth:900,margin:'40px auto',padding:'32px 16px',fontFamily:"'Space Grotesk',system-ui,sans-serif"}}>
        <button onClick={() => navigate(-1)} style={{background:'transparent',border:'1px solid #26314a',color:'#7d88a3',padding:'8px 14px',borderRadius:10,cursor:'pointer',fontSize:13,marginBottom:24}}>← Back</button>
        <div style={{background:'linear-gradient(135deg,#161b27,#0c121c)',border:'1px solid #6366f1',borderRadius:20,padding:'48px 32px',textAlign:'center'}}>
          <div style={{fontSize:56,marginBottom:16}}>🔒</div>
          <h1 style={{color:'#fff',fontSize:28,fontWeight:700,margin:'0 0 12px'}}>Whale Activity is a Pro feature</h1>
          <p style={{color:'#a5b4fc',fontSize:15,margin:'0 0 24px',maxWidth:520,marginLeft:'auto',marginRight:'auto'}}>Track live whale movements, buy/sell pressure, large moves and on-chain risk verdicts across ETH and Solana. Upgrade to unlock.</p>
          <button onClick={() => navigate('/subscription')} style={{background:'linear-gradient(135deg,#6366f1,#4f46e5)',color:'#fff',border:'none',padding:'14px 32px',borderRadius:12,fontSize:15,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 16px rgba(99,102,241,0.4)'}}>Start 7-day free trial</button>
        </div>
      </div>
    );
  }

  const urlChain = new URLSearchParams(window.location.search).get('chain');
  const urlAddr = new URLSearchParams(window.location.search).get('addr');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(900);
  const [iframeReady, setIframeReady] = useState(false);

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      const d = e.data;
      if (!d || typeof d !== 'object') return;
      if (d.__whale === 'back') navigate(-1);
      else if (d.__whale === 'h' && typeof d.h === 'number') { setHeight(Math.max(d.h, 480)); setIframeReady(true); }
    }
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [navigate]);

  const doc = WHALE_DOC.replace('"__SYMBOL__"', JSON.stringify(symbol || ''));

  const [tokenAddress, setTokenAddress] = useState<string>('');
  const [tokenNetwork, setTokenNetwork] = useState<string>('');
  const [whaleMvmtLoading, setWhaleMvmtLoading] = useState(false);
  const [whaleMvmtData, setWhaleMvmtData] = useState<any>(null);
  const [whaleMvmtErr, setWhaleMvmtErr] = useState<string | null>(null);
  const [duneLoading, setDuneLoading] = useState(false);
  const [duneData, setDuneData] = useState<any>(null);
  const [duneErr, setDuneErr] = useState<string | null>(null);
  const [consensus, setConsensus] = useState<string | null>(null);

  useEffect(() => {
    setWhaleMvmtData(null); setWhaleMvmtErr(null); setWhaleMvmtLoading(false);
    setDuneData(null); setDuneErr(null); setDuneLoading(false);
    setConsensus(null);
    setIframeReady(false);
    setTokenAddress(''); setTokenNetwork('');
    if (!symbol) return;
    // Prioritate: URL params (setat de WhaleAlertsPage când navighează)
    if (urlAddr && urlChain) {
      setTokenAddress(urlAddr);
      setTokenNetwork(urlChain);
      return;
    }
    fetch('/api/crypto/signals-v2').then(r => r.json()).then(j => {
      const d = j?.data || {};
      const cats = ['pump_signals','watch_signals','early_signals','dex_signals','risk_signals','dump_signals'];
      for (const c of cats) {
        const items = d[c] || [];
        for (const it of items) {
          if (String(it.symbol || '').toUpperCase() === String(symbol).toUpperCase()) {
            setTokenAddress(it.token_address || '');
            setTokenNetwork((it.network || '').toLowerCase());
            return;
          }
        }
      }
      // Fallback: GeckoTerminal search dupa symbol
      const sym = String(symbol || '').toUpperCase();
      fetch(`https://api.geckoterminal.com/api/v2/search/pools?query=${encodeURIComponent(symbol || '')}&page=1`)
        .then(r => r.json())
        .then(g => {
          const pools = g?.data || [];
          // Filtreaza pool-urile unde sym apare exact ca base sau quote in nume
          const matches = pools.filter((p: any) => {
            const name = String(p?.attributes?.name || '').toUpperCase();
            const parts = name.split('/').map((s: string) => s.trim());
            return parts.includes(sym);
          }).sort((a: any, b: any) => parseFloat(b?.attributes?.reserve_in_usd || 0) - parseFloat(a?.attributes?.reserve_in_usd || 0));
          if (matches.length === 0) return;
          const top = matches[0];
          const name = String(top?.attributes?.name || '').toUpperCase();
          const nameParts = name.split('/').map((s: string) => s.trim());
          // Determinam daca sym e base sau quote
          const isBase = nameParts[0] === sym;
          const tokenId = isBase
            ? (top?.relationships?.base_token?.data?.id || '')
            : (top?.relationships?.quote_token?.data?.id || '');
          const [netId, ...addrParts] = tokenId.split('_');
          const addr = addrParts.join('_');
          let net = netId;
          if (net === 'eth') net = 'eth';
          else if (net === 'solana') net = 'solana';
          else if (net === 'bsc') net = 'bsc';
          if (addr) {
            setTokenAddress(addr);
            setTokenNetwork(net);
          }
        })
        .catch(() => {});
    }).catch(() => {});
  }, [symbol, urlAddr, urlChain]);

  useEffect(() => {
    if (!tokenAddress) return;
    runWhaleMovements();
    runDune();
    runConsensus();
  }, [tokenAddress]);

  useEffect(() => {
    if (!tokenAddress) return;
    const tick = () => {
      if (document.visibilityState !== 'visible') return;
      runWhaleMovements();
      runDune();
      runConsensus();
    };
    const id = setInterval(tick, 120000);
    return () => clearInterval(id);
  }, [tokenAddress]);

  const runWhaleMovements = async () => {
    if (!tokenAddress) { setWhaleMvmtErr('No address available for this token'); return; }
    setWhaleMvmtLoading(true); setWhaleMvmtErr(null); setWhaleMvmtData(null);
    const chainPath = (tokenNetwork === 'solana') ? 'solana' : (tokenNetwork === 'base') ? 'base' : 'eth';
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        const r = await fetch(`/api/crypto/whale-movements/${chainPath}/${tokenAddress}`);
        const j = await r.json();
        if (j?.data?.available) { setWhaleMvmtData(j.data); setWhaleMvmtLoading(false); return; }
        if (attempt < 5 && j?.data?.available === false && j?.data?.error) {
          await new Promise(res => setTimeout(res, 10000));
          continue;
        }
        setWhaleMvmtErr(j?.data?.user_message || 'Whale movement data not available');
        setWhaleMvmtLoading(false);
        return;
      } catch {
        if (attempt < 5) { await new Promise(res => setTimeout(res, 10000)); continue; }
        setWhaleMvmtErr('Error fetching whale movement data');
        setWhaleMvmtLoading(false);
        return;
      }
    }
  };

  const runDune = async () => {
    if (!tokenAddress) { setDuneErr('No address available for this token'); return; }
    setDuneLoading(true); setDuneErr(null); setDuneData(null);
    const chainPath = (tokenNetwork === 'solana') ? 'solana' : 'eth';
    try {
      const r = await fetch(`/api/crypto/dune/market-signals/${chainPath}/${tokenAddress}`);
      const j = await r.json();
      if (j?.data?.available) setDuneData(j.data);
      else setDuneErr('Market signals not available');
    } catch { setDuneErr('Error fetching market signals'); }
    setDuneLoading(false);
  };

  const runConsensus = async () => {
    if (!tokenAddress || tokenNetwork === 'solana') return;
    try {
      const r = await fetch(`/api/crypto/whale-movements/consensus/eth/${tokenAddress}`);
      const j = await r.json();
      if (j?.data?.consensus) setConsensus(j.data.consensus);
    } catch {}
  };

  const computeWashRisk = (pct: number) => pct > 40 ? 'HIGH' : pct >= 15 ? 'MEDIUM' : 'LOW';

  const riskColor = (r: string) => r === 'HIGH' ? '#ff5468' : r === 'MEDIUM' ? '#f5c451' : r === 'LOW' ? '#27EAA4' : '#525a73';

  const timeAgo = (ts: number) => {
    const mins = Math.max(0, Math.floor((Date.now() / 1000 - ts) / 60));
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  const whaleMovementsSection = (tokenNetwork === 'eth' || tokenNetwork === 'ethereum' || tokenNetwork === 'solana') ? (
    <div style={{maxWidth:1100,margin:'16px auto 40px',padding:'0 16px',fontFamily:"'Space Grotesk',system-ui,sans-serif"}}>
      <div style={{background:'#0c121c',border:'1px solid #26314a',borderRadius:16,padding:20}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,letterSpacing:2,color:'#525a73'}}>WHALE MOVEMENTS · 1H</span>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color: whaleMvmtData ? riskColor(whaleMvmtData.haiku_verdict?.risk) : '#525a73',border:'1px solid',borderColor: whaleMvmtData ? riskColor(whaleMvmtData.haiku_verdict?.risk) : '#26314a',borderRadius:999,padding:'4px 12px'}}>
            {whaleMvmtData ? `${whaleMvmtData.haiku_verdict?.risk || 'UNKNOWN'} RISK` : 'DUMP CHECK'}
          </span>
        </div>
        {whaleMvmtLoading && (
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:12,padding:24}}>
            <div style={{width:32,height:32,border:'3px solid #161b27',borderTopColor:'#27eaa4',borderRadius:'50%',animation:'wmspin .8s linear infinite'}} />
            <span style={{color:'#7d88a3',fontSize:13,textAlign:'center'}}>Fetching live Dune data<br/><span style={{color:'#525a73',fontSize:11}}>this can take up to 2min</span></span>
            <style>{`@keyframes wmspin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}
        {whaleMvmtErr && <p style={{color:'#ff5468',fontSize:13,margin:0}}>{whaleMvmtErr}</p>}
        {whaleMvmtData && (
          <div>
            <p style={{color:'#7d88a3',fontSize:13,margin:'0 0 14px',lineHeight:1.5}}>{whaleMvmtData.haiku_verdict?.reasoning || 'No reasoning available.'}</p>
            {(!whaleMvmtData.events || whaleMvmtData.events.length === 0) ? (
              <div style={{fontSize:13,color:'#525a73'}}>No moves over ${(whaleMvmtData.min_usd_threshold || 5000).toLocaleString()} in the last hour.</div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {whaleMvmtData.events.map((e: any, i: number) => (
                  <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 12px',background:'#0a0e17',border:'1px solid #1a2233',borderRadius:10}}>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <span style={{fontSize:16,color: e.direction === 'WITHDRAWAL' ? '#27EAA4' : '#ff5468'}}>{e.direction === 'WITHDRAWAL' ? '←' : '→'}</span>
                      <div>
                        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:'#cbd3e6'}}>{e.wallet.slice(0,6)}...{e.wallet.slice(-4)}</div>
                        <div style={{fontSize:11,color:'#525a73'}}>{e.direction === 'WITHDRAWAL' ? 'Withdrew ' : e.direction === 'TO_EXCHANGE' ? 'Sent to ' : 'Swapped on '}{e.destination_label}</div>
                      </div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontWeight:700,color:'#fff',fontSize:14}}>${e.amount_usd.toLocaleString()}</div>
                      <div style={{fontSize:11,color:'#525a73'}}>{timeAgo(e.timestamp)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{fontSize:12,color:'#7d88a3',marginTop:14,paddingTop:14,borderTop:'1px solid #1a2233'}}>{whaleMvmtData.summary?.whales_selling_or_moving_out || 0} whales moving out · {whaleMvmtData.summary?.whales_withdrawing || 0} withdrawing · net ${(whaleMvmtData.summary?.net_pressure_usd || 0).toLocaleString()}</div>
          </div>
        )}
      </div>
    </div>
  ) : null;

  const duneSection = (tokenNetwork === 'eth' || tokenNetwork === 'ethereum' || tokenNetwork === 'solana') ? (
    <div style={{maxWidth:1100,margin:'16px auto 40px',padding:'0 16px',fontFamily:"'Space Grotesk',system-ui,sans-serif"}}>
      <div style={{background:'#0c121c',border:'1px solid #26314a',borderRadius:16,padding:20}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,letterSpacing:2,color:'#525a73'}}>MARKET VOLUME &middot; 1H</span>
          {duneData && (() => {
            const pct = duneData.wash_trading?.wash_ratio_pct ?? 0;
            const risk = duneData.wash_trading?.wash_risk || computeWashRisk(pct);
            const c = riskColor(risk);
            return (
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:c,border:'1px solid',borderColor:c,borderRadius:999,padding:'4px 12px'}}>
                {pct}% WASH
              </span>
            );
          })()}
          {!duneData && <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:'#525a73',border:'1px solid #26314a',borderRadius:999,padding:'4px 12px'}}>VOLUME CHECK</span>}
        </div>
        {duneLoading && (
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:12,padding:24}}>
            <div style={{width:32,height:32,border:'3px solid #161b27',borderTopColor:'#27eaa4',borderRadius:'50%',animation:'dnspin .8s linear infinite'}} />
            <span style={{color:'#7d88a3',fontSize:13,textAlign:'center'}}>Fetching live Dune data<br/><span style={{color:'#525a73',fontSize:11}}>this can take up to 2min</span></span>
            <style>{`@keyframes dnspin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}
        {duneErr && <p style={{color:'#ff5468',fontSize:13,margin:0}}>{duneErr}</p>}
        {duneData && (() => {
          const buyer = duneData.buyer_volume_usd || 0;
          const seller = duneData.seller_volume_usd || 0;
          const total = buyer + seller;
          const buyerPct = total > 0 ? (buyer / total) * 100 : 50;
          const sellerPct = 100 - buyerPct;
          const wash = duneData.wash_trading || {};
          return (
            <div>
              <div style={{marginBottom:18}}>
                <div style={{fontSize:11,color:'#525a73',marginBottom:8,fontFamily:"'JetBrains Mono',monospace"}}>all traders · all sizes</div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'#7d88a3',marginBottom:6}}>
                  <span>Buyers <span style={{color:'#27EAA4',fontWeight:500}}>${buyer.toLocaleString()}</span></span>
                  <span>Sellers <span style={{color:'#ff5468',fontWeight:500}}>${seller.toLocaleString()}</span></span>
                </div>
                <div style={{display:'flex',height:8,borderRadius:4,overflow:'hidden',background:'#161b27'}}>
                  <div style={{width:`${buyerPct}%`,background:'#27EAA4'}} />
                  <div style={{width:`${sellerPct}%`,background:'#ff5468'}} />
                </div>
                <p style={{fontSize:12,color:'#7d88a3',margin:'8px 0 0'}}>{buyerPct > 60 ? 'Strong buy pressure' : sellerPct > 60 ? 'Strong sell pressure' : 'Balanced volume'} in the last {duneData.window_hours || 1}h.</p>
              </div>
              <div style={{borderTop:'1px solid #1a2233',paddingTop:14}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                  <span style={{fontSize:13,color:'#cbd3e6'}}>{wash.distinct_wash_wallets || 0} wallets round-tripping volume</span>
                </div>
                {(!wash.top_wallets || wash.top_wallets.length === 0) ? (
                  <div style={{fontSize:13,color:'#525a73'}}>No round-trip wash trading detected.</div>
                ) : (
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    {wash.top_wallets.map((w: any, i: number) => (
                      <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 12px',background:'#0a0e17',border:'1px solid #1a2233',borderRadius:10}}>
                        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:'#cbd3e6'}}>{w.wallet.slice(0,6)}...{w.wallet.slice(-5)}</span>
                        <span style={{fontSize:13,color:'#fff',fontWeight:500}}>{w.round_trip_count} trips &middot; ${w.volume_usd.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  ) : null;

  const consensusBanner = consensus ? (
    <div style={{maxWidth:1100,margin:'12px auto 0',padding:'0 16px',fontFamily:"'Space Grotesk',system-ui,sans-serif"}}>
      <div style={{background:'linear-gradient(90deg,rgba(39,234,164,0.08),rgba(43,217,232,0.08))',border:'1px solid #26314a',borderRadius:12,padding:'12px 16px',display:'flex',alignItems:'center',gap:10}}>
        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,letterSpacing:2,color:'#525a73',textTransform:'uppercase'}}>1H Consensus</span>
        <span style={{fontSize:13,color:'#cbd3e6'}}>{consensus}</span>
      </div>
    </div>
  ) : null;

  return (
    <>{consensusBanner}<div style={{position:'relative',width:'100%'}}><div style={{position:'absolute',inset:0,background:'#04070c',zIndex:5,display:iframeReady?'none':'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:14,minHeight:height}}>
      <div style={{width:36,height:36,border:'3px solid #161b27',borderTopColor:'#27eaa4',borderRadius:'50%',animation:'wolspin .8s linear infinite'}}></div>
      <div style={{color:'#7d88a3',fontFamily:"'JetBrains Mono',monospace",fontSize:12,letterSpacing:'0.1em'}}>Loading whale data...</div>
      <div style={{color:'#525a73',fontFamily:"'JetBrains Mono',monospace",fontSize:10}}>Fetching live Dune data · up to 2min</div>
      <style>{`@keyframes wolspin{to{transform:rotate(360deg)}}`}</style>
    </div><iframe
      ref={iframeRef}
      title="Whale Activity"
      srcDoc={doc}
      scrolling="no"
      style={{ width: '100%', height, border: 'none', background: '#04070c', display: 'block', overflow: 'hidden' }}
    /></div>
    {whaleMovementsSection}
    {duneSection}
    </>
  );
}
