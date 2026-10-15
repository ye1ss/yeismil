/* yeismil.com — shared behaviour (theme, language, copy email, reveal, cover field) */
(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };

  /* ---------- Theme (circular reveal from the click point) ---------- */
  document.querySelectorAll('[data-theme-toggle]').forEach(btn => btn.addEventListener('click', e => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    const apply = () => { root.dataset.theme = next; store('theme', next); window.dispatchEvent(new Event('themechange')); };
    if (!document.startViewTransition || reduced) return apply();
    const x = e.clientX, y = e.clientY, r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.startViewTransition(apply).ready.then(() => {
      root.animate({ clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 600, easing: 'cubic-bezier(.7,0,.2,1)', pseudoElement: '::view-transition-new(root)' });
    });
  }));

  /* ---------- Language ---------- */
  const setLang = l => {
    root.dataset.lang = l; root.lang = l; store('lang', l);
    document.querySelectorAll('[data-set-lang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.setLang === l)));
  };
  document.querySelectorAll('[data-set-lang]').forEach(b => b.addEventListener('click', () => setLang(b.dataset.setLang)));
  setLang(root.dataset.lang || 'en');

  /* ---------- Copy email ---------- */
  document.querySelectorAll('[data-copy]').forEach(btn => btn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(btn.dataset.copy); } catch (e) { return; }
    btn.dataset.done = root.dataset.lang === 'es' ? 'Copiado' : 'Copied';
    btn.classList.add('done');
    clearTimeout(btn._t); btn._t = setTimeout(() => btn.classList.remove('done'), 1600);
  }));

  /* ---------- Reveal on scroll ---------- */
  const els = document.querySelectorAll('.rv');
  if (reduced || !('IntersectionObserver' in window)) els.forEach(el => el.classList.add('in'));
  else {
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }), { threshold: .1, rootMargin: '0px 0px -40px 0px' });
    let stagger = 0;
    els.forEach(el => {
      if (el.dataset.stagger !== undefined) el.style.transitionDelay = (stagger++ * 60) + 'ms';
      io.observe(el);
    });
  }

  /* ---------- Cover: interactive dot field ---------- */
  const cv = document.getElementById('field');
  if (!cv) return;
  const ctx = cv.getContext('2d', { alpha: true });
  const cover = cv.parentElement;
  let W = 0, H = 0, pts = [], dotColor = '', accent = '', running = false, visible = true;
  const mouse = { x: -1, y: -1, active: false };

  const readColors = () => {
    const s = getComputedStyle(root);
    dotColor = s.getPropertyValue('--muted').trim();
    accent = s.getPropertyValue('--accent').trim();
  };
  const size = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = cover.clientWidth; H = cover.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const gap = W < 640 ? 18 : 22; pts = [];
    for (let y = gap / 2; y < H; y += gap) for (let x = gap / 2; x < W; x += gap) pts.push({ ox: x, oy: y, x, y });
  };

  const R = 140, PUSH = 22;
  const frame = t => {
    if (!running) return;
    const mx = mouse.active ? mouse.x : W * (.5 + .38 * Math.cos(t / 2600));
    const my = mouse.active ? mouse.y : H * (.5 + .3 * Math.sin(t / 1700));
    ctx.clearRect(0, 0, W, H);

    // base dots in one path (cheap), highlighted dots drawn individually
    ctx.globalAlpha = .22; ctx.fillStyle = dotColor; ctx.beginPath();
    const hot = [];
    for (const p of pts) {
      const dx = p.ox - mx, dy = p.oy - my;
      if (Math.abs(dx) > R + 30 || Math.abs(dy) > R + 30) {
        if (p.x !== p.ox || p.y !== p.oy) { p.x += (p.ox - p.x) * .14; p.y += (p.oy - p.y) * .14; if (Math.abs(p.x - p.ox) < .05) p.x = p.ox; if (Math.abs(p.y - p.oy) < .05) p.y = p.oy; }
        ctx.moveTo(p.x + 1, p.y); ctx.arc(p.x, p.y, 1, 0, 6.283);
        continue;
      }
      const d = Math.hypot(dx, dy) || 1, f = d < R ? 1 - d / R : 0;
      p.x += (p.ox + dx / d * f * PUSH - p.x) * .14; p.y += (p.oy + dy / d * f * PUSH - p.y) * .14;
      if (f > .05) hot.push(p, f);
      else { ctx.moveTo(p.x + 1, p.y); ctx.arc(p.x, p.y, 1, 0, 6.283); }
    }
    ctx.fill();
    ctx.fillStyle = accent;
    for (let i = 0; i < hot.length; i += 2) {
      const p = hot[i], f = hot[i + 1];
      ctx.globalAlpha = .22 + f * .78; ctx.beginPath(); ctx.arc(p.x, p.y, 1 + f * 1.7, 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  };
  const start = () => { if (!running && visible && !document.hidden) { running = true; requestAnimationFrame(frame); } };
  const stop = () => { running = false; };

  readColors(); size();
  if (reduced) { running = true; frame(0); running = false; return; }

  addEventListener('themechange', readColors);
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(size, 120); });
  cover.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.active = true; });
  cover.addEventListener('pointerleave', () => { mouse.active = false; });
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; visible ? start() : stop(); }).observe(cover);
  start();
})();
