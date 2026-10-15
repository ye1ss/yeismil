// Generates the static site from content/projects.mjs.
// Usage: node scripts/build.mjs
import { writeFileSync, mkdirSync, rmSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { projects } from '../content/projects.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://yeismil.com';
const EMAIL = 'yeismil18@gmail.com';
const IMG = '/assets/img/projects/';

/* ---------- helpers ---------- */
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// bilingual element: renders the English and Spanish version, CSS shows one
const bi = (o, tag = 'span', attrs = '') => `<${tag} lang="en"${attrs}>${esc(o.en)}</${tag}><${tag} lang="es"${attrs}>${esc(o.es)}</${tag}>`;
const t = (en, es, tag = 'span', attrs = '') => bi({ en, es }, tag, attrs);
const stateLabel = s => s === 'building' ? t('Building', 'En desarrollo') : t('Live', 'En producción');

const icon = {
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>',
  copy: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
  moon: '<svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>',
  sun: '<svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
  code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><path d="M17.5 6.5h.01"/></svg>',
  github: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>',
  youtube: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg>',
};

const socials = [
  ['Instagram', 'https://www.instagram.com/yeiismil', icon.instagram],
  ['GitHub', 'https://github.com/ye1ss', icon.github],
  ['LinkedIn', 'https://www.linkedin.com/in/yeismildelrosario', icon.linkedin],
  ['YouTube', 'https://www.youtube.com/@yeiismil', icon.youtube],
];

const head = ({ title, desc, path, image }) => `<!DOCTYPE html>
<html lang="en" data-theme="dark" data-lang="en" class="no-js">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="author" content="Yeismil del Rosario">
<link rel="canonical" href="${SITE}${path}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${SITE}${path}">
<meta property="og:image" content="${SITE}${image}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0a0a0a">
<link rel="icon" href="/img/pulpo.png" type="image/png">
<script>
  (function () {
    var d = document.documentElement; d.classList.remove('no-js');
    try {
      var t = localStorage.getItem('theme'); if (t) d.dataset.theme = t;
      var l = localStorage.getItem('lang') || 'en';
      d.dataset.lang = l; d.lang = l;
    } catch (e) {}
  })();
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/site.css">
</head>`;

const controls = `<div class="controls">
      <div class="lang mono" role="group" aria-label="Language"><button data-set-lang="en" aria-pressed="true">EN</button><button data-set-lang="es" aria-pressed="false">ES</button></div>
      <button class="theme-btn" data-theme-toggle aria-label="Toggle dark / light mode">${icon.moon}${icon.sun}</button>
    </div>`;

const footer = `<footer class="site-foot mono">
    <span>© ${new Date().getFullYear()} Yeismil del Rosario</span>
    <a href="mailto:${EMAIL}">${EMAIL}</a>
  </footer>`;

// read width/height from a WebP header (VP8 / VP8L / VP8X)
const webpSize = file => {
  const b = readFileSync(join(ROOT, 'assets/img/projects', file));
  const type = b.toString('ascii', 12, 16);
  if (type === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
  if (type === 'VP8L') { const n = b.readUInt32LE(21); return [(n & 0x3fff) + 1, ((n >> 14) & 0x3fff) + 1]; }
  return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)]; // VP8X
};

const img = (src, alt, { lazy = true, vt = '', cls = '' } = {}) =>
  `<img src="${IMG}${src}" alt="${esc(alt)}" width="${webpSize(src)[0]}" height="${webpSize(src)[1]}"${lazy ? ' loading="lazy"' : ' fetchpriority="high"'} decoding="async"${vt ? ` style="view-transition-name:${vt}"` : ''}${cls ? ` class="${cls}"` : ''}>`;

/* ---------- Home ---------- */
const projectRow = (p, i) => {
  const href = p.page ? `/projects/${p.slug}/` : p.url;
  const tag = href ? 'a' : 'div';
  const attrs = href ? ` href="${href}"${p.page ? '' : ' target="_blank" rel="noopener"'}` : '';
  const more = p.page ? t('Case study →', 'Ver proyecto →') : (p.url ? `${esc(p.domain)} ↗` : '');
  return `
    <${tag} class="project rv"${attrs}>
      <div class="thumb${p.thumbLogo ? ' logo' : ''}">${img(p.thumb, `${p.name} screenshot`, { lazy: i > 1, vt: p.page ? `shot-${p.slug}` : '' })}</div>
      <div>
        <div class="p-top"><span class="p-name">${esc(p.name)}${href ? ' <span class="go">↗</span>' : ''}</span><span class="p-state mono ${p.status}">${stateLabel(p.status)}</span></div>
        ${bi(p.tagline, 'p', ' class="p-desc"')}
        <div class="p-foot"><span class="p-stack mono">${p.stack.map(esc).join(' / ')}</span><span class="p-more mono">${more}</span></div>
      </div>
    </${tag}>`;
};

const home = () => {
  const products = projects.filter(p => p.kind === 'product');
  const clients = projects.filter(p => p.kind === 'client');
  return `${head({
    title: 'Yeismil del Rosario — Full-stack developer',
    desc: 'Full-stack developer in Madrid. I build SaaS products, CRMs and automations from idea to production.',
    path: '/', image: IMG + 'repfy-hero.webp',
  })}
<body>

<header class="cover">
  <canvas id="field" aria-hidden="true"></canvas>
  <div class="wrap topbar">
    <div class="mail mono">${icon.mail}<a href="mailto:${EMAIL}">${EMAIL}</a><button class="copy" data-copy="${EMAIL}" aria-label="Copy email">${icon.copy}</button></div>
    ${controls}
  </div>
</header>

<main class="wrap">
  <div class="profile">
    <div class="avatar rv" data-stagger><img src="/img/pulpo.png" alt="Yeismil del Rosario" width="116" height="116" fetchpriority="high"></div>
    <h1 class="name rv" data-stagger>Yeismil del Rosario</h1>
    <div class="role rv" data-stagger>${t('Full-stack developer', 'Desarrollador full-stack')}</div>
    <p class="bio rv" data-stagger>${t('I build SaaS products, CRMs and automations from idea to production.', 'Construyo productos SaaS, CRMs y automatizaciones desde la idea hasta producción.')} <span>${t('Shipping my own apps and custom software for clients.', 'Lanzo mis propias apps y desarrollo software a medida para clientes.')}</span></p>
    <div class="facts mono rv" data-stagger>
      <span>${icon.pin}Madrid, ${t('Spain', 'España')}</span>
      <span>${icon.code}React · Next.js · Supabase</span>
    </div>
    <nav class="socials rv" data-stagger aria-label="Social links">${socials.map(([n, u, ic]) => `
      <a class="social" href="${u}" target="_blank" rel="noopener">${ic}<span>${n}</span><span class="arr">↗</span></a>`).join('')}
    </nav>
  </div>

  <section id="projects">
    <div class="sec-head rv"><h2>${t('Projects', 'Proyectos')}</h2><span class="mono">(${String(projects.length).padStart(2, '0')})</span></div>
    <div class="sub-head mono rv">— ${t('My products', 'Mis productos')}</div>
    ${products.map(projectRow).join('')}
    <div class="sub-head mono rv">— ${t('Client work', 'Para clientes')}</div>
    ${clients.map((p, i) => projectRow(p, i + 9)).join('')}
  </section>

  <section id="about">
    <div class="sec-head rv"><h2>${t('About', 'Sobre mí')}</h2><span class="mono">Madrid, ES</span></div>
    <div class="about-text rv">
      ${t('I\'m a full-stack developer who likes to own the whole thing: the idea, the design, the database, the deploy and the first users.', 'Soy desarrollador full-stack y me gusta encargarme de todo: la idea, el diseño, la base de datos, el despliegue y los primeros usuarios.', 'p')}
      <p lang="en">I started building software to fix problems in my own day-to-day, like automating the admin of the bar I manage. Today I ship <em>my own SaaS products</em> and build custom software for clients as a freelancer.</p>
      <p lang="es">Empecé a programar para resolver problemas de mi propio día a día, como automatizar la administración del bar que gestiono. Hoy lanzo <em>mis propios productos SaaS</em> y desarrollo software a medida para clientes como freelance.</p>
    </div>

    <div class="timeline">
      <div class="tl-row rv"><span class="mono">2026 — ${t('Now', 'Hoy')}</span><div><b>${t('Full-stack developer', 'Desarrollador full-stack')}</b> <span class="sub">· Freelance</span></div></div>
      <div class="tl-row rv"><span class="mono">${t('Now', 'Hoy')}</span><div><b>${t('Business admin', 'Responsable de administración')}</b> <span class="sub">· ${t('Bar-restaurant', 'Bar-restaurante')}</span></div></div>
      <div class="tl-row rv"><span class="mono">2024</span><div><b>${t('Web developer', 'Desarrollador web')}</b> <span class="sub">· AES Multimedia (${t('internship', 'prácticas')})</span></div></div>
      <div class="tl-row rv"><span class="mono">2023 — 2024</span><div><b>${t('Multiplatform App Development (HND)', 'CFGS Desarrollo de Aplicaciones Multiplataforma')}</b> <span class="sub">· The Core School</span></div></div>
    </div>

    <div class="kv rv">
      <span class="mono">Frontend</span><div>JavaScript, TypeScript, React, Next.js, Tailwind CSS</div>
      <span class="mono">Backend</span><div>Node.js, Express, Supabase, PostgreSQL, SQL</div>
      <span class="mono">${t('AI & automation', 'IA y automatización')}</span><div>n8n, Gemini API, Claude Code</div>
      <span class="mono">${t('Tools', 'Herramientas')}</span><div>Git, Vercel, Stripe, Resend, Sentry</div>
    </div>

    <a class="btn rv" href="/cv/Yeismil-del-Rosario-CV.pdf" download><span>${t('Download CV', 'Descargar CV')}</span><span>↓</span></a>
  </section>

  ${footer}
</main>

<script src="/assets/site.js" defer></script>
</body>
</html>
`;
};

/* ---------- Case study ---------- */
const caseStudy = (p, next) => {
  const steps = items => `<div class="steps">${items.map(it => `
      <div class="step rv"><div>${bi({ en: it.en[0], es: it.es[0] }, 'h3')}${bi({ en: it.en[1], es: it.es[1] }, 'p')}</div></div>`).join('')}
    </div>`;
  const kind = p.kind === 'product' ? t('My product', 'Producto propio') : t('Client work', 'Para cliente');

  return `${head({
    title: `${p.name} — ${p.tagline.en.replace(/\.$/, '')} | Yeismil del Rosario`,
    desc: p.summary.en,
    path: `/projects/${p.slug}/`, image: IMG + p.cover,
  })}
<body>

<div class="cs-bar">
  <div class="wrap topbar">
    <a class="back mono" href="/#projects"><span>←</span> Yeismil</a>
    ${controls}
  </div>
</div>

<main>
  <header class="wrap cs-head">
    <div class="cs-kicker mono rv"><span>${kind}</span><span class="p-state ${p.status}">${stateLabel(p.status)}</span></div>
    <h1 class="cs-title rv">${esc(p.name)}</h1>
    ${bi(p.tagline, 'p', ' class="cs-tagline rv"')}
    ${bi(p.summary, 'p', ' class="cs-summary rv"')}
    ${p.url ? `<a class="btn cs-visit rv" href="${p.url}" target="_blank" rel="noopener"><span>${t('Visit', 'Visitar')} ${esc(p.domain)}</span><span>↗</span></a>` : ''}
  </header>

  <div class="cs-hero">${img(p.cover, `${p.name} — home page`, { lazy: false, vt: `shot-${p.slug}` })}</div>

  <div class="wrap">
    <div class="cs-meta rv">
      <div><span class="mono">${t('Role', 'Rol')}</span>${bi(p.meta.role, 'p')}</div>
      <div><span class="mono">${t('Timeline', 'Fechas')}</span>${bi(p.meta.timeline, 'p')}</div>
      <div><span class="mono">${t('Status', 'Estado')}</span>${bi(p.meta.status, 'p')}</div>
    </div>

    <div class="metrics rv">${p.metrics.map(m => `
      <div class="metric"><b>${esc(m.v)}</b>${bi(m.l, 'span', ' class="mono"')}</div>`).join('')}
    </div>

    ${p.problem ? `<div class="cs-section">
      <h2 class="rv">${t('The problem', 'El problema')}<span class="mono">01</span></h2>
      <ul class="cs-list" lang="en">${p.problem.en.map(x => `<li class="rv">${esc(x)}</li>`).join('')}</ul>
      <ul class="cs-list" lang="es">${p.problem.es.map(x => `<li class="rv">${esc(x)}</li>`).join('')}</ul>
    </div>` : ''}

    <div class="cs-section">
      <h2 class="rv">${t('How it works', 'Cómo funciona')}<span class="mono">${p.problem ? '02' : '01'}</span></h2>
      ${steps(p.how)}
    </div>

    <div class="cs-section">
      <h2 class="rv">${t('How it\'s built', 'Cómo está hecho')}<span class="mono">${p.problem ? '03' : '02'}</span></h2>
      <div class="stack-line mono rv">${p.builtStack.map(s => `<span>${esc(s)}</span>`).join('')}</div>
      ${steps(p.built)}
      ${p.note ? bi(p.note, 'p', ' class="cs-note rv"') : ''}
    </div>
  </div>

  <div class="gallery">${p.gallery.map(g => `
    <figure class="rv${g.mobile ? ' mobile' : ''}${g.half ? ' half' : ''}">${img(g.src, g.cap.en)}${bi(g.cap, 'figcaption', ' class="mono"')}</figure>`).join('')}
  </div>

  <div class="wrap">
    <a class="next rv" href="/projects/${next.slug}/"><span class="mono">${t('Next project', 'Siguiente proyecto')}</span><b>${esc(next.name)} <span>→</span></b></a>
    ${footer}
  </div>
</main>

<script src="/assets/site.js" defer></script>
</body>
</html>
`;
};

/* ---------- write ---------- */
const write = (rel, html) => { const f = join(ROOT, rel); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, html); console.log('✓', rel); };

write('index.html', home());
rmSync(join(ROOT, 'projects'), { recursive: true, force: true });
const pages = projects.filter(p => p.page);
pages.forEach((p, i) => write(`projects/${p.slug}/index.html`, caseStudy(p, pages[(i + 1) % pages.length])));
