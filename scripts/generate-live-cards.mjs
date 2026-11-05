#!/usr/bin/env node
// Generates the live "neofetch" terminal card with real GitHub data.
// Runs daily in GitHub Actions (GITHUB_TOKEN) and pushes the SVG to the `output` branch.
// Local preview:  $env:GITHUB_TOKEN = (gh auth token); node scripts/generate-live-cards.mjs dist
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const USER = process.env.GH_USER || 'GitAlboBis';
const TOKEN = process.env.GITHUB_TOKEN;
const OUT = resolve(process.argv[2] || 'dist');
mkdirSync(OUT, { recursive: true });

const SANS = `'Geist','SF Pro Display','Segoe UI Variable Display','Segoe UI',Inter,system-ui,sans-serif`;
const MONO = `'JetBrains Mono','Geist Mono','SF Mono','Cascadia Code',Consolas,'Liberation Mono',monospace`;
const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fmt = (n) => Number(n).toLocaleString('en-US');

// ── Data ─────────────────────────────────────────────────────────
async function fetchStats() {
  if (!TOKEN) { console.warn('  no GITHUB_TOKEN — using placeholder stats'); return null; }
  const query = `query($login:String!){ user(login:$login){
    createdAt followers{totalCount}
    repositories(ownerAffiliations:OWNER, privacy:PUBLIC, first:100){ totalCount nodes{ stargazerCount isFork } }
    repositoriesContributedTo(contributionTypes:[COMMIT,PULL_REQUEST,REPOSITORY], first:1){ totalCount }
    pullRequests{ totalCount }
    contributionsCollection{ totalCommitContributions restrictedContributionsCount contributionCalendar{ totalContributions } }
  }}`;
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${TOKEN}`, 'Content-Type': 'application/json', 'User-Agent': 'gitalbobis-readme' },
    body: JSON.stringify({ query, variables: { login: USER } }),
  });
  const json = await res.json();
  if (!json.data?.user) { console.warn('  GraphQL error:', JSON.stringify(json.errors || json)); return null; }
  const u = json.data.user;
  const own = u.repositories.nodes.filter((r) => !r.isFork);
  return {
    repos: u.repositories.totalCount,
    stars: own.reduce((s, r) => s + r.stargazerCount, 0),
    followers: u.followers.totalCount,
    contributedTo: u.repositoriesContributedTo.totalCount,
    prs: u.pullRequests.totalCount,
    commits: u.contributionsCollection.totalCommitContributions + u.contributionsCollection.restrictedContributionsCount,
    contributions: u.contributionsCollection.contributionCalendar.totalContributions,
    since: u.createdAt,
  };
}

function uptime(since) {
  const start = new Date(since), now = new Date();
  let y = now.getUTCFullYear() - start.getUTCFullYear();
  let m = now.getUTCMonth() - start.getUTCMonth();
  let d = now.getUTCDate() - start.getUTCDate();
  if (d < 0) { m -= 1; d += 30; }
  if (m < 0) { y -= 1; m += 12; }
  const pl = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
  return `${pl(y, 'year')}, ${pl(m, 'month')}, ${pl(d, 'day')}`;
}

// ── ASCII hex-"A" logo, shaded like a distance-field shader ─────
function asciiLogo(cols = 44, rows = 23) {
  const ramp = ' .,:;-=+*#%@';
  const cw = 8.4, lh = 19;               // char cell in px (keeps the hexagon regular)
  const W = cols * cw, H = rows * lh, cx = W / 2, cy = H / 2, R = Math.min(W, H * 1.08) / 2 - 2;
  const insideHex = (x, y) => { // pointy-top hexagon
    const dx = Math.abs(x - cx), dy = Math.abs(y - cy);
    return dy <= R && dx <= (R * Math.sqrt(3)) / 2 && dy <= R - dx / Math.sqrt(3);
  };
  const seg = (px, py, ax, ay, bx, by) => { // distance point→segment
    const vx = bx - ax, vy = by - ay, t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy)));
    return Math.hypot(px - (ax + t * vx), py - (ay + t * vy));
  };
  const s = R * 0.56, th = R * 0.085;
  const A = [[cx - s * 0.78, cy + s * 0.9, cx, cy - s * 0.95], [cx, cy - s * 0.95, cx + s * 0.78, cy + s * 0.9], [cx - s * 0.4, cy + s * 0.25, cx + s * 0.4, cy + s * 0.25]];
  const lines = [];
  for (let r = 0; r < rows; r++) {
    let line = '';
    for (let c = 0; c < cols; c++) {
      const x = (c + 0.5) * cw, y = (r + 0.5) * lh;
      if (!insideHex(x, y)) { line += ' '; continue; }
      const dA = Math.min(...A.map(([ax, ay, bx, by]) => seg(x, y, ax, ay, bx, by)));
      if (dA < th) { line += '@'; continue; }                        // solid letter strokes
      if (dA < th * 1.9) { line += ' '; continue; }                  // dark halo around the A
      const edge = Math.min(R - Math.abs(y - cy) - Math.abs(x - cx) / Math.sqrt(3), (R * Math.sqrt(3)) / 2 - Math.abs(x - cx));
      const k = Math.max(0, 1 - edge / (R * 0.55));                  // dense at the rim, airy inside
      line += ramp[Math.max(1, Math.min(ramp.length - 3, Math.round(k * (ramp.length - 3))))];
    }
    lines.push(line.replace(/\s+$/, ''));
  }
  return lines;
}

// ── Card ─────────────────────────────────────────────────────────
function buildCard(st) {
  const W = 1200, PAD = 34, TOP = 78, LH = 21.5, KEYW = 15, VALX = 470;
  const s = st || { repos: '—', stars: '—', followers: '—', contributedTo: '—', prs: '—', commits: '—', contributions: '—', since: '2022-01-01T00:00:00Z' };
  const today = new Date().toISOString().slice(0, 10);

  const rows = [
    { h: 'alberto@gitalbobis' },
    { rule: true },
    { k: 'OS', v: 'Italy (Trento · Marche · Sardinia) · remote London' },
    { k: 'Uptime', v: st ? uptime(s.since) + ' on GitHub' : '—' },
    { k: 'Role', v: 'Software & AI Engineer · Creative Lead @ SerSan' },
    { k: 'Studies', v: 'M.Sc. Artificial Intelligence Systems @ UniTrento' },
    { k: 'Thesis', v: 'Agentic orchestration & OS-level agent security' },
    { gap: true },
    { k: 'Lang.Code', v: 'TypeScript, Python, Java, C++, WGSL, GLSL' },
    { k: 'Stack.GPU', v: 'WebGPU, Three.js / R3F, TSL, GSAP + Lenis' },
    { k: 'Stack.AI', v: 'RAG, pgvector, LLM evals, MCP, guardrails' },
    { k: 'Stack.Data', v: 'Postgres 17, PostGIS 3, Supabase RLS, pgTAP' },
    { gap: true },
    { sec: 'Contact' },
    { k: 'Email', v: 'albertotuveri@gmail.com' },
    { k: 'LinkedIn', v: 'in/albertotuveri' },
    { k: 'Web', v: 'sersan.io · spherenode.com' },
    { gap: true },
    { sec: 'GitHub Stats' },
    { pair: [['Repos', `${fmt(s.repos)} {Contributed: ${fmt(s.contributedTo)}}`], ['Stars', fmt(s.stars)]] },
    { pair: [['Contributions (1y)', fmt(s.contributions)], ['Commits (1y)', fmt(s.commits)]] },
    { pair: [['Pull requests', fmt(s.prs)], ['Followers', fmt(s.followers)]] },
  ];

  const dots = (key, width) => ' ' + '.'.repeat(Math.max(2, width - key.length)) + ' ';
  let y = TOP; let i = 0;
  const out = [];
  for (const r of rows) {
    const cls = `ln" style="animation-delay:${(0.25 + i * 0.07).toFixed(2)}s`;
    if (r.gap) { y += LH * 0.55; continue; }
    if (r.h) out.push(`<text x="${VALX}" y="${y}" class="${cls}"><tspan class="user">alberto</tspan><tspan class="dim">@</tspan><tspan class="user">gitalbobis</tspan></text>`);
    else if (r.rule) out.push(`<text x="${VALX}" y="${y}" class="${cls}"><tspan class="dim">${'─'.repeat(62)}</tspan></text>`);
    else if (r.sec) out.push(`<text x="${VALX}" y="${y}" class="${cls}"><tspan class="dim">─ </tspan><tspan class="sec">${esc(r.sec)}</tspan><tspan class="dim"> ${'─'.repeat(58 - r.sec.length)}</tspan></text>`);
    else if (r.k) out.push(`<text x="${VALX}" y="${y}" class="${cls}" xml:space="preserve"><tspan class="key">${esc(r.k)}</tspan><tspan class="dim">${dots(r.k, KEYW)}</tspan><tspan class="val">${esc(r.v)}</tspan></text>`);
    else if (r.pair) {
      const [[k1, v1], [k2, v2]] = r.pair;
      const left = `${k1}${dots(k1, 20)}${v1}`;
      const padTo = 44;
      out.push(`<text x="${VALX}" y="${y}" class="${cls}" xml:space="preserve"><tspan class="key">${esc(k1)}</tspan><tspan class="dim">${dots(k1, 20)}</tspan><tspan class="num">${esc(v1)}</tspan><tspan class="dim">${' '.repeat(Math.max(2, padTo - left.length))}| </tspan><tspan class="key">${esc(k2)}</tspan><tspan class="dim">${dots(k2, 13)}</tspan><tspan class="num">${esc(v2)}</tspan></text>`);
    }
    y += LH; i++;
  }
  const H = Math.round(y + 64);

  // prompt + cursor
  const promptY = y + 14;
  out.push(`<text x="${VALX}" y="${promptY}" class="ln" style="animation-delay:${(0.25 + i * 0.07).toFixed(2)}s"><tspan class="ok">➜</tspan> <tspan class="user">~</tspan> <tspan class="dim">last sync ${today}</tspan></text>`);
  const cursorX = VALX + (4 + ` last sync ${today}`.length) * 8.4 + 6;

  // palette strip
  const pal = ['#0f172a', '#ef4444', '#10b981', '#f59e0b', '#38bdf8', '#a855f7', '#22d3ee', '#e2e8f0'];
  const palSvg = pal.map((c, k) => `<rect x="${VALX + 520 + k * 22}" y="${promptY - 12}" width="18" height="14" rx="3" fill="${c}"/>`).join('');

  // logo
  const logo = asciiLogo();
  const logoTop = TOP + (H - TOP - 60 - logo.length * 19) / 2 + 4;
  const logoSvg = logo.map((l, k) => `<text x="${PAD + 18}" y="${(logoTop + k * 19).toFixed(1)}" class="ascii" xml:space="preserve">${esc(l)}</text>`).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="alberto@gitalbobis neofetch card">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#05070f"/><stop offset="1" stop-color="#0a0b1c"/></linearGradient>
  <radialGradient id="glow" cx="0.18" cy="0.5" r="0.45"><stop offset="0" stop-color="#22d3ee" stop-opacity="0.13"/><stop offset="1" stop-color="#22d3ee" stop-opacity="0"/></radialGradient>
  <linearGradient id="shader" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="420" y2="${H}">
    <stop offset="0" stop-color="#22d3ee"/><stop offset="0.35" stop-color="#818cf8"/><stop offset="0.7" stop-color="#c084fc"/><stop offset="1" stop-color="#22d3ee"/>
    <animateTransform attributeName="gradientTransform" type="translate" values="0 -${H};0 ${H}" dur="7s" repeatCount="indefinite"/>
  </linearGradient>
  <linearGradient id="hair" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.12"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <clipPath id="card"><rect width="${W}" height="${H}" rx="22"/></clipPath>
  <style>
    text { font: 400 14px ${MONO}; }
    .ascii { font: 700 14px ${MONO}; fill: url(#shader); letter-spacing: 0; }
    .title { font: 500 12px ${SANS}; fill: #64748b; }
    .user { fill: #f8fafc; font-weight: 700; }
    .key { fill: #38bdf8; }
    .sec { fill: #c084fc; font-weight: 700; }
    .val { fill: #e2e8f0; }
    .num { fill: #34d399; font-weight: 700; }
    .dim { fill: #3b4658; }
    .ok { fill: #34d399; font-weight: 700; }
    .ln { animation: ln .7s ${EASE} backwards; }
    @keyframes ln { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: none; } }
    .cursor { animation: blink 1.1s steps(1) infinite; }
    @keyframes blink { 50% { opacity: 0; } }
    .scan { animation: scan 6s linear infinite; }
    @keyframes scan { from { transform: translateY(-40px); } to { transform: translateY(${H + 40}px); } }
    @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
  </style>
</defs>
<g clip-path="url(#card)">
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect class="scan" x="0" y="0" width="${W}" height="40" fill="url(#hair)" opacity="0.35"/>
  <rect x="0" y="0" width="${W}" height="44" fill="rgba(255,255,255,0.025)"/>
  <rect x="0" y="44" width="${W}" height="1" fill="rgba(255,255,255,0.06)"/>
  <circle cx="26" cy="22" r="6" fill="#ff5f57"/><circle cx="46" cy="22" r="6" fill="#febc2e"/><circle cx="66" cy="22" r="6" fill="#28c840"/>
  <text x="${W / 2}" y="26.5" text-anchor="middle" class="title">alberto@gitalbobis: ~ — neofetch --live</text>
  <rect x="${VALX - 34}" y="70" width="1" height="${H - 140}" fill="url(#hair)" transform="rotate(0)"/>
  ${logoSvg}
  ${out.join('\n  ')}
  <rect class="cursor" x="${cursorX.toFixed(1)}" y="${promptY - 13}" width="8.5" height="16" fill="#38bdf8"/>
  ${palSvg}
</g>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="21.5" fill="none" stroke="rgba(255,255,255,0.09)"/>
</svg>`;
}

const stats = await fetchStats();
if (stats) console.log('  stats:', JSON.stringify(stats));
const svg = buildCard(stats);
writeFileSync(resolve(OUT, 'neofetch-card.svg'), svg);
console.log(`  wrote ${resolve(OUT, 'neofetch-card.svg')} (${(svg.length / 1024).toFixed(1)} KB)`);
