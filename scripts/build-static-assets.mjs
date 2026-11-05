#!/usr/bin/env node
// Generates the hand-crafted animated SVGs used by the profile README.
// Run locally:  node scripts/build-static-assets.mjs
// Output: .github/assets/{hero-cyber-banner,ai-webgpu-telemetry,divider,footer}.svg
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, '.github/assets');
mkdirSync(OUT, { recursive: true });

// ── Design tokens ────────────────────────────────────────────────
const SANS = `'Geist','SF Pro Display','Segoe UI Variable Display','Segoe UI',Inter,system-ui,-apple-system,sans-serif`;
const MONO = `'JetBrains Mono','Geist Mono','SF Mono','Cascadia Code',Consolas,'Liberation Mono',monospace`;
const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
const C = {
  ink: '#04050b', panel: '#080b16', line: 'rgba(255,255,255,0.08)',
  text: '#f8fafc', soft: '#cbd5e1', mute: '#94a3b8', dim: '#64748b',
  cyan: '#22d3ee', sky: '#38bdf8', indigo: '#6366f1', violet: '#a855f7', emerald: '#10b981', rose: '#fb7185',
};
const REDUCED = `@media (prefers-reduced-motion: reduce) { * { animation: none !important; } }`;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function rng(seed) { // mulberry32
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const r2 = (n) => Math.round(n * 100) / 100;
const hex = (cx, cy, R, rot = -90) => Array.from({ length: 6 }, (_, i) => { const a = ((rot + i * 60) * Math.PI) / 180; return `${r2(cx + R * Math.cos(a))},${r2(cy + R * Math.sin(a))}`; }).join(' ');
const write = (name, svg) => { writeFileSync(resolve(OUT, name), svg.replace(/\n\s*\n/g, '\n')); console.log(`  wrote .github/assets/${name} (${(svg.length / 1024).toFixed(1)} KB)`); };

// ═════════════════════════════════════════════════════════════════
// 1) HERO
// ═════════════════════════════════════════════════════════════════
function buildHero() {
  const W = 1200, H = 460, R = 28;
  const rand = rng(20261104);
  const CX = 932, CY = 196;

  // particle field (twinkling stars, denser on the right)
  const stars = Array.from({ length: 70 }, () => {
    const right = rand() < 0.72;
    const x = right ? 640 + rand() * 540 : 30 + rand() * 600;
    const y = 20 + rand() * 340;
    const r = 0.5 + rand() * 1.3;
    const dur = (2.4 + rand() * 4).toFixed(1);
    const begin = (rand() * 5).toFixed(1);
    const col = rand() < 0.5 ? '#e0f2fe' : rand() < 0.5 ? '#a5f3fc' : '#c4b5fd';
    return `<circle cx="${r2(x)}" cy="${r2(y)}" r="${r2(r)}" fill="${col}" opacity="0.2"><animate attributeName="opacity" values="0.12;0.9;0.12" dur="${dur}s" begin="-${begin}s" repeatCount="indefinite"/></circle>`;
  }).join('');

  // marquee
  const words = ['WebGPU', 'WGSL Compute', 'Three.js / R3F', 'Production RAG', 'pgvector', 'MCP', 'Agentic Security', 'Next.js 16', 'React 19', 'Postgres 17', 'PostGIS 3', 'GSAP + Lenis', 'Zero-Trust', '4K Motion'];
  const ADV = 12 * 0.6 + 3, GAP = 64;
  let x = 0; const items = [];
  for (const w of words) {
    const t = w.toUpperCase(); const wd = t.length * ADV;
    items.push({ t, x: x + wd / 2, dx: x + wd + GAP / 2 }); x += wd + GAP;
  }
  const S = x; const dur = (S / 38).toFixed(1);
  const seq = (off) => items.map((it, i) => `<text x="${r2(it.x + off)}" y="428" text-anchor="middle" class="mq${i % 3 === 0 ? ' mq-hi' : ''}">${esc(it.t)}</text><rect x="${r2(it.dx + off - 3)}" y="420" width="6" height="6" transform="rotate(45 ${r2(it.dx + off)} 423)" fill="${i % 2 ? C.violet : C.cyan}" opacity="0.7"/>`).join('');

  // orbit helpers
  const ell = (rx, ry) => `M ${-rx} 0 A ${rx} ${ry} 0 1 1 ${rx} 0 A ${rx} ${ry} 0 1 1 ${-rx} 0`;
  const orbit = (id, rx, ry, rot, durS, color, n) => `
    <g transform="translate(${CX} ${CY}) rotate(${rot})">
      <path id="${id}" d="${ell(rx, ry)}" fill="none" stroke="rgba(255,255,255,0.10)" stroke-width="1"/>
      ${Array.from({ length: n }, (_, i) => `<g><circle r="9" fill="${color}" opacity="0.18"/><circle r="2.6" fill="${color}"/><circle r="1.1" fill="#fff"/>
        <animateMotion dur="${durS}s" begin="-${r2((durS / n) * i)}s" repeatCount="indefinite" rotate="auto"><mpath href="#${id}"/></animateMotion></g>`).join('')}
    </g>`;

  const chips = [
    { x: 1052, y: 92, t: 'WGSL · 60 FPS', c: C.cyan, d: 6 },
    { x: 760, y: 318, t: 'RAG · 100% CITED', c: C.emerald, d: 7 },
    { x: 1088, y: 306, t: 'ZERO-TRUST', c: C.violet, d: 8 },
  ].map((c, i) => { const w = c.t.length * 7.2 + 34; return `
    <g class="chip chip-${i}">
      <rect x="${r2(c.x - w / 2)}" y="${c.y - 14}" width="${r2(w)}" height="28" rx="14" fill="rgba(8,11,22,0.72)" stroke="rgba(255,255,255,0.12)"/>
      <circle cx="${r2(c.x - w / 2 + 14)}" cy="${c.y}" r="3" fill="${c.c}"><animate attributeName="opacity" values="1;0.35;1" dur="2s" repeatCount="indefinite"/></circle>
      <text x="${r2(c.x + 7)}" y="${c.y + 4}" text-anchor="middle" class="chip-t">${esc(c.t)}</text>
    </g>`; }).join('');

  const chipsLeft = [
    { t: 'WebGPU / WGSL', c: C.cyan }, { t: 'RAG · pgvector', c: C.emerald },
    { t: 'Agentic Security', c: C.violet }, { t: '3D & Motion', c: C.rose },
  ];
  let cx = 64; const chipSvg = chipsLeft.map((c) => { const w = c.t.length * 7.6 + 36; const s = `
      <g><rect x="${r2(cx)}" y="292" width="${r2(w)}" height="32" rx="16" fill="rgba(255,255,255,0.035)" stroke="rgba(255,255,255,0.10)"/>
      <circle cx="${r2(cx + 16)}" cy="308" r="3.2" fill="${c.c}"/>
      <text x="${r2(cx + w / 2 + 7)}" y="312.5" text-anchor="middle" class="tag">${esc(c.t)}</text></g>`; cx += w + 10; return s; }).join('');

  const perim = r2(2 * (W - 2 + H - 2) - (8 - 2 * Math.PI) * R);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="t d">
<title id="t">Alberto Tuveri — Software &amp; AI Engineer · Creative Lead</title>
<desc id="d">Animated hero: name, role, WebGPU orbital core, tech marquee.</desc>
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#03040a"/><stop offset="0.55" stop-color="#070a17"/><stop offset="1" stop-color="#0d0b22"/></linearGradient>
  <radialGradient id="oc"><stop offset="0" stop-color="#06b6d4" stop-opacity="0.42"/><stop offset="1" stop-color="#06b6d4" stop-opacity="0"/></radialGradient>
  <radialGradient id="ov"><stop offset="0" stop-color="#8b5cf6" stop-opacity="0.42"/><stop offset="1" stop-color="#8b5cf6" stop-opacity="0"/></radialGradient>
  <radialGradient id="oe"><stop offset="0" stop-color="#10b981" stop-opacity="0.22"/><stop offset="1" stop-color="#10b981" stop-opacity="0"/></radialGradient>
  <radialGradient id="core"><stop offset="0" stop-color="#22d3ee" stop-opacity="0.55"/><stop offset="0.45" stop-color="#6366f1" stop-opacity="0.18"/><stop offset="1" stop-color="#6366f1" stop-opacity="0"/></radialGradient>
  <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#ffffff" opacity="0.09"/></pattern>
  <radialGradient id="dm" cx="0.62" cy="0.42" r="0.7"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient>
  <mask id="dotMask"><rect width="${W}" height="${H}" fill="url(#dm)"/></mask>
  <linearGradient id="beam" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${W}" y2="${H}"><stop offset="0" stop-color="#22d3ee"/><stop offset="0.5" stop-color="#818cf8"/><stop offset="1" stop-color="#c084fc"/></linearGradient>
  <linearGradient id="hair" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.14"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <linearGradient id="name" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="640" y2="0">
    <stop offset="0" stop-color="#ffffff"/><stop offset="0.42" stop-color="#ffffff"/><stop offset="0.5" stop-color="#67e8f9"/><stop offset="0.56" stop-color="#c4b5fd"/><stop offset="0.64" stop-color="#ffffff"/><stop offset="1" stop-color="#ffffff"/>
    <animateTransform attributeName="gradientTransform" type="translate" values="-700 0;700 0" dur="6s" begin="1.4s" repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keySplines="0.65 0 0.35 1"/>
  </linearGradient>
  <linearGradient id="aStroke" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#67e8f9"/><stop offset="1" stop-color="#c084fc"/></linearGradient>
  <linearGradient id="mqFade" x1="0" x2="1"><stop offset="0" stop-color="#000"/><stop offset="0.08" stop-color="#fff"/><stop offset="0.92" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
  <mask id="mqMask"><rect x="0" y="384" width="${W}" height="76" fill="url(#mqFade)"/></mask>
  <clipPath id="card"><rect width="${W}" height="${H}" rx="${R}"/></clipPath>
  <filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.045 0"/></filter>
  <style>
    .name { font: 700 76px ${SANS}; letter-spacing: -2.6px; }
    .sub { font: 500 22px ${SANS}; fill: ${C.soft}; letter-spacing: -0.2px; }
    .meta { font: 400 15px ${SANS}; fill: ${C.mute}; }
    .eyebrow { font: 600 11px ${MONO}; fill: ${C.soft}; letter-spacing: 2.2px; }
    .tag { font: 600 12.5px ${SANS}; fill: #e2e8f0; }
    .chip-t { font: 600 10.5px ${MONO}; fill: #e2e8f0; letter-spacing: 1.2px; }
    .mq { font: 600 12px ${MONO}; fill: #475569; letter-spacing: 3px; }
    .mq-hi { fill: #94a3b8; }
    .rise { animation: rise 1.1s ${EASE} both; }
    .d1 { animation-delay: .10s } .d2 { animation-delay: .22s } .d3 { animation-delay: .34s } .d4 { animation-delay: .46s } .d5 { animation-delay: .58s } .d6 { animation-delay: .75s }
    @keyframes rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
    .orb-a { animation: driftA 18s ease-in-out infinite alternate; }
    .orb-b { animation: driftB 22s ease-in-out infinite alternate; }
    .orb-c { animation: driftC 26s ease-in-out infinite alternate; }
    @keyframes driftA { to { transform: translate(90px, 40px); } }
    @keyframes driftB { to { transform: translate(-110px, -30px); } }
    @keyframes driftC { to { transform: translate(60px, -50px); } }
    .spin { transform-box: view-box; transform-origin: ${CX}px ${CY}px; animation: spin 36s linear infinite; }
    .spin-r { transform-box: view-box; transform-origin: ${CX}px ${CY}px; animation: spin 24s linear infinite reverse; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .beam { stroke-dasharray: 260 ${r2(perim - 260)}; animation: beam 9s linear infinite; }
    @keyframes beam { to { stroke-dashoffset: -${perim}; } }
    .draw { stroke-dasharray: 130; animation: draw 1.6s ${EASE} .6s backwards; }
    .draw2 { stroke-dasharray: 30; animation: draw2 1s ${EASE} 1.5s backwards; }
    @keyframes draw { from { stroke-dashoffset: 130; } to { stroke-dashoffset: 0; } }
    @keyframes draw2 { from { stroke-dashoffset: 30; } to { stroke-dashoffset: 0; } }
    .chip { animation: bob 6s ease-in-out infinite alternate; }
    .chip-1 { animation-duration: 7s; animation-delay: -2s; } .chip-2 { animation-duration: 8s; animation-delay: -4s; }
    @keyframes bob { from { transform: translateY(-4px); } to { transform: translateY(4px); } }
    .marquee { animation: mq ${dur}s linear infinite; }
    @keyframes mq { to { transform: translateX(-${r2(S)}px); } }
    ${REDUCED}
  </style>
</defs>

<g clip-path="url(#card)">
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle class="orb-a" cx="250" cy="80" r="300" fill="url(#oc)"/>
  <circle class="orb-b" cx="980" cy="160" r="320" fill="url(#ov)"/>
  <circle class="orb-c" cx="620" cy="420" r="260" fill="url(#oe)"/>
  <rect width="${W}" height="${H}" fill="url(#dots)" mask="url(#dotMask)"/>
  ${stars}

  <!-- WebGPU orbital core -->
  <circle cx="${CX}" cy="${CY}" r="190" fill="url(#core)"><animate attributeName="r" values="175;200;175" dur="7s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/></circle>
  <circle class="spin" cx="${CX}" cy="${CY}" r="124" fill="none" stroke="rgba(255,255,255,0.14)" stroke-dasharray="2 9"/>
  ${orbit('o1', 196, 58, -16, 11, '#67e8f9', 3)}
  ${orbit('o2', 158, 46, 26, 8, '#c4b5fd', 2)}
  ${orbit('o3', 232, 72, 8, 15, '#6ee7b7', 2)}
  <circle cx="${CX}" cy="${CY}" r="58" fill="none" stroke="#22d3ee" stroke-width="1.2"><animate attributeName="r" values="58;128" dur="3.6s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.7;0" dur="3.6s" repeatCount="indefinite"/></circle>
  <circle cx="${CX}" cy="${CY}" r="58" fill="none" stroke="#a855f7" stroke-width="1.2"><animate attributeName="r" values="58;128" dur="3.6s" begin="1.8s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.7;0" dur="3.6s" begin="1.8s" repeatCount="indefinite"/></circle>
  <polygon class="spin" points="${hex(CX, CY, 78)}" fill="none" stroke="url(#aStroke)" stroke-width="1.6" stroke-dasharray="34 12"/>
  <polygon class="spin-r" points="${hex(CX, CY, 66, -60)}" fill="none" stroke="rgba(255,255,255,0.16)" stroke-width="1"/>
  <polygon points="${hex(CX, CY, 56)}" fill="#070a16" stroke="rgba(255,255,255,0.18)" stroke-width="1"/>
  <g fill="none" stroke="url(#aStroke)" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round">
    <path class="draw" d="M ${CX - 21} ${CY + 24} L ${CX} ${CY - 27} L ${CX + 21} ${CY + 24}"/>
    <path class="draw2" d="M ${CX - 11} ${CY + 7} L ${CX + 11} ${CY + 7}"/>
  </g>
  ${chips}

  <!-- Left: identity -->
  <g class="rise d1">
    <rect x="64" y="58" width="318" height="30" rx="15" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)"/>
    <circle cx="83" cy="73" r="7" fill="${C.emerald}" opacity="0.25"><animate attributeName="r" values="4;9;4" dur="2.2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.45;0;0.45" dur="2.2s" repeatCount="indefinite"/></circle>
    <circle cx="83" cy="73" r="3.6" fill="${C.emerald}"/>
    <text x="98" y="77" class="eyebrow">SYSTEM ONLINE · PORTFOLIO v2026.11</text>
  </g>
  <text x="60" y="176" class="name rise d2" fill="url(#name)">Alberto Tuveri</text>
  <text x="64" y="222" class="sub rise d3">Software &amp; AI Engineer · Creative Lead @ SerSan</text>
  <text x="64" y="256" class="meta rise d4">M.Sc. AI Systems @ UniTrento — production RAG, WebGPU shaders &amp; zero-trust agents.</text>
  <g class="rise d5">${chipSvg}</g>

  <!-- Marquee -->
  <rect x="0" y="384" width="${W}" height="1" fill="url(#hair)"/>
  <rect x="0" y="385" width="${W}" height="75" fill="rgba(255,255,255,0.015)"/>
  <g mask="url(#mqMask)" class="rise d6"><g class="marquee">${seq(0)}${seq(S)}</g></g>

  <rect width="${W}" height="${H}" filter="url(#grain)" opacity="1"/>
</g>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="${R - 1}" fill="none" stroke="rgba(255,255,255,0.09)"/>
<rect class="beam" x="1" y="1" width="${W - 2}" height="${H - 2}" rx="${R - 1}" fill="none" stroke="url(#beam)" stroke-width="1.6" stroke-linecap="round"/>
</svg>`;
}

// ═════════════════════════════════════════════════════════════════
// 2) TELEMETRY BENTO
// ═════════════════════════════════════════════════════════════════
function buildTelemetry() {
  const W = 1200, H = 272, CW = 288, CH = 262, GAP = 16;
  const cards = [
    { label: 'SPHERE AI // RAG MENTOR', metric: '100%', sub: 'Citation correctness', d1: '94% precision · 90% recall', d2: '0 leaks · 161 bilingual evals', pct: 1, a: '#34d399', b: '#22d3ee' },
    { label: 'WEBGPU // WGSL SHADERS', metric: '120,000', sub: 'Real-time GPU fluid particles', d1: '+48k wordmark · 80k morph', d2: '17 scroll-locked 3D scenes', pct: 1, a: '#38bdf8', b: '#818cf8' },
    { label: 'LIGHTHOUSE // PERF & A11Y', metric: '100/100', sub: 'Accessibility & SEO', d1: 'Mobile LCP 4.75s → 1.74s', d2: 'Device-tiered mobile shaders', pct: 1, a: '#c084fc', b: '#f472b6' },
    { label: 'SECURITY // DEVSECOPS', metric: '33/33', sub: 'Audit findings remediated', d1: '9-role Postgres 17 RLS + pgTAP', d2: '21 / 49 production releases led', pct: 0.94, a: '#fb7185', b: '#f59e0b' },
  ];
  const body = cards.map((c, i) => {
    const x = i * (CW + GAP), y = 5;
    return `
  <g class="card c${i}">
    <clipPath id="clip${i}"><rect x="${x}" y="${y}" width="${CW}" height="${CH}" rx="20"/></clipPath>
    <linearGradient id="g${i}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${c.a}"/><stop offset="1" stop-color="${c.b}"/></linearGradient>
    <radialGradient id="glow${i}" cx="1" cy="0" r="1"><stop offset="0" stop-color="${c.a}" stop-opacity="0.22"/><stop offset="1" stop-color="${c.a}" stop-opacity="0"/></radialGradient>
    <g clip-path="url(#clip${i})">
      <rect x="${x}" y="${y}" width="${CW}" height="${CH}" fill="url(#cardBg)"/>
      <rect x="${x}" y="${y}" width="${CW}" height="${CH}" fill="url(#glow${i})"/>
      <polygon class="sheen s${i}" points="${x - 150},${y + CH} ${x - 60},${y + CH} ${x - 10},${y} ${x - 100},${y}" fill="url(#sheen)"/>
    </g>
    <rect x="${x + 0.5}" y="${y + 0.5}" width="${CW - 1}" height="${CH - 1}" rx="19.5" fill="none" stroke="rgba(255,255,255,0.09)"/>
    <rect x="${x + 24}" y="${y}" width="${CW - 48}" height="1" fill="url(#g${i})" opacity="0.8"/>
    <rect x="${x + 24}" y="${y + 26}" width="28" height="5" rx="2.5" fill="url(#g${i})"/>
    <text x="${x + 24}" y="${y + 56}" class="lbl">${esc(c.label)}</text>
    <text x="${x + 22}" y="${y + 116}" class="big" fill="url(#g${i})">${esc(c.metric)}</text>
    <text x="${x + 24}" y="${y + 146}" class="sub">${esc(c.sub)}</text>
    <text x="${x + 24}" y="${y + 176}" class="det">${esc(c.d1)}</text>
    <text x="${x + 24}" y="${y + 196}" class="det">${esc(c.d2)}</text>
    <rect x="${x + 24}" y="${y + 222}" width="${CW - 48}" height="6" rx="3" fill="rgba(255,255,255,0.07)"/>
    <rect class="bar b${i}" x="${x + 24}" y="${y + 222}" width="${r2((CW - 48) * c.pct)}" height="6" rx="3" fill="url(#g${i})"/>
  </g>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Production impact metrics">
<defs>
  <linearGradient id="cardBg" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#0a0e1b"/><stop offset="1" stop-color="#05070f"/></linearGradient>
  <linearGradient id="sheen" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.06"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <style>
    .lbl { font: 600 10.5px ${MONO}; fill: ${C.mute}; letter-spacing: 1.6px; }
    .big { font: 700 46px ${SANS}; letter-spacing: -1.5px; }
    .sub { font: 600 14px ${SANS}; fill: #e2e8f0; }
    .det { font: 400 11.5px ${MONO}; fill: ${C.dim}; }
    .card { animation: rise 1s ${EASE} both; }
    .c1 { animation-delay: .1s } .c2 { animation-delay: .2s } .c3 { animation-delay: .3s }
    @keyframes rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
    .bar { transform-box: fill-box; transform-origin: left center; animation: grow 1.6s ${EASE} both; }
    .b0 { animation-delay: .5s } .b1 { animation-delay: .6s } .b2 { animation-delay: .7s } .b3 { animation-delay: .8s }
    @keyframes grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
    .sheen { animation: sheen 7s ${EASE} infinite; }
    .s1 { animation-delay: .6s } .s2 { animation-delay: 1.2s } .s3 { animation-delay: 1.8s }
    @keyframes sheen { 0%, 55% { transform: translateX(0); } 100% { transform: translateX(480px); } }
    ${REDUCED}
  </style>
</defs>${body}
</svg>`;
}

// ═════════════════════════════════════════════════════════════════
// 3) DIVIDER
// ═════════════════════════════════════════════════════════════════
function buildDivider() {
  const W = 1200, H = 28, Y = 14;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="presentation">
<defs>
  <linearGradient id="base" x1="0" x2="1"><stop offset="0" stop-color="#94a3b8" stop-opacity="0"/><stop offset="0.5" stop-color="#94a3b8" stop-opacity="0.35"/><stop offset="1" stop-color="#94a3b8" stop-opacity="0"/></linearGradient>
  <linearGradient id="pulse" x1="0" x2="1"><stop offset="0" stop-color="#22d3ee" stop-opacity="0"/><stop offset="0.6" stop-color="#22d3ee"/><stop offset="0.85" stop-color="#a855f7"/><stop offset="1" stop-color="#a855f7" stop-opacity="0"/></linearGradient>
  <style>
    .p { animation: run 5.5s cubic-bezier(0.65, 0, 0.35, 1) infinite; }
    @keyframes run { from { transform: translateX(-260px); } to { transform: translateX(${W + 40}px); } }
    ${REDUCED}
  </style>
</defs>
<rect x="0" y="${Y}" width="${W}" height="1" fill="url(#base)"/>
<g class="p"><rect x="0" y="${Y - 0.5}" width="220" height="2" rx="1" fill="url(#pulse)"/><circle cx="200" cy="${Y + 0.5}" r="2.4" fill="#e0f2fe"/></g>
<rect x="${W / 2 - 5}" y="${Y - 5}" width="10" height="10" transform="rotate(45 ${W / 2} ${Y})" fill="#05070f" stroke="#38bdf8" stroke-width="1.2"><animate attributeName="stroke" values="#38bdf8;#a855f7;#38bdf8" dur="4s" repeatCount="indefinite"/></rect>
</svg>`;
}

// ═════════════════════════════════════════════════════════════════
// 4) FOOTER
// ═════════════════════════════════════════════════════════════════
function buildFooter() {
  const W = 1200, H = 210;
  const wave = (base, amp, phase, k = 3) => {
    const seg = W / (k * 2); let d = `M 0 ${base}`;
    for (let i = 0; i < k * 2; i++) {
      const x0 = i * seg, x1 = x0 + seg; const dir = (i % 2 === 0 ? -1 : 1) * (phase ? -1 : 1);
      d += ` C ${r2(x0 + seg / 2)} ${r2(base + dir * amp)}, ${r2(x0 + seg / 2)} ${r2(base + dir * amp)}, ${r2(x1)} ${base}`;
    }
    return `${d} L ${W} ${H} L 0 ${H} Z`;
  };
  const layer = (base, amp, fill, dur, op) => `<path fill="${fill}" opacity="${op}" d="${wave(base, amp, 0)}"><animate attributeName="d" dur="${dur}s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" values="${wave(base, amp, 0)};${wave(base, amp, 1)};${wave(base, amp, 0)}"/></path>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Footer">
<defs>
  <linearGradient id="w1" x1="0" x2="1"><stop offset="0" stop-color="#22d3ee"/><stop offset="1" stop-color="#6366f1"/></linearGradient>
  <linearGradient id="w2" x1="0" x2="1"><stop offset="0" stop-color="#6366f1"/><stop offset="1" stop-color="#a855f7"/></linearGradient>
  <linearGradient id="w3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1020"/><stop offset="1" stop-color="#04050b"/></linearGradient>
  <style>
    .f { font: 600 11px ${MONO}; fill: #64748b; letter-spacing: 3px; }
    .fh { font: 600 15px ${SANS}; fill: #e2e8f0; letter-spacing: 0.2px; }
    ${REDUCED}
  </style>
</defs>
${layer(92, 22, 'url(#w1)', 9, 0.35)}
${layer(108, 18, 'url(#w2)', 12, 0.45)}
${layer(126, 14, 'url(#w3)', 15, 1)}
<text x="${W / 2}" y="172" text-anchor="middle" class="fh">Engineering where silicon meets cinema.</text>
<text x="${W / 2}" y="194" text-anchor="middle" class="f">ALBERTO TUVERI · GITALBOBIS · 2026</text>
</svg>`;
}

write('hero-cyber-banner.svg', buildHero());
write('ai-webgpu-telemetry.svg', buildTelemetry());
write('divider.svg', buildDivider());
write('footer.svg', buildFooter());
