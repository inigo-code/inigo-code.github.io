// Heart Apps: the contact sheet, the loupe, the feature shelf and the questions.
// Without this file the page still reads: a short sheet, the lists and the first answer.

const APPS = { prompt: 'Prompt Heart', watch: 'Watch Heart' };
// Frames marked with a heart: the ones worth a closer look.
const PICKS = new Set(['ph-fill', 'ph-profile', 'wh-diary', 'wh-story-strip']);
// Every feature on the shelf, and the frame it opens.
const FEATURES = [
  ['prompt', 'One-tap copy', 'ph-home'],
  ['prompt', 'Fill in the blanks', 'ph-fill'],
  ['prompt', 'Copy and open in your AI app', 'ph-view'],
  ['prompt', 'Formatting and undo', 'ph-edit'],
  ['prompt', 'A library of 100 prompts', 'ph-library'],
  ['prompt', 'Version history', 'ph-history'],
  ['prompt', 'Your most-used four', 'ph-profile'],
  ['prompt', 'Achievements', 'ph-achievements'],
  ['prompt', 'A profile card', 'ph-card'],
  ['prompt', 'Import from other apps', 'ph-import'],
  ['prompt', 'App lock', 'ph-lock'],
  ['prompt', 'What’s new after updates', 'ph-news'],
  ['watch', 'A diary of ticket stubs', 'wh-diary'],
  ['watch', 'Find anything', 'wh-find'],
  ['watch', 'Half stars and reviews', 'wh-log'],
  ['watch', 'Watched with', 'wh-with'],
  ['watch', 'Episode by episode', 'wh-episodes'],
  ['watch', 'A watchlist', 'wh-watchlist'],
  ['watch', 'Pick for me', 'wh-pick'],
  ['watch', 'Favourite four', 'wh-profile'],
  ['watch', 'A year of watching', 'wh-year'],
  ['watch', 'Movie buddies', 'wh-buddies'],
  ['watch', 'Monthly recap', 'wh-recap'],
  ['watch', 'Film-strip stories', 'wh-story-strip'],
  ['watch', 'Ticket stories', 'wh-story-tickets'],
  ['watch', 'Spotlight stories', 'wh-story-spot'],
  ['watch', 'Import from eight apps', 'wh-import'],
];
const HEART = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 27.5c-.6 0-11.5-6.6-11.5-14.2C4.5 9 7.4 6 11 6c2.2 0 3.9 1.1 5 2.8C17.1 7.1 18.8 6 21 6c3.6 0 6.5 3 6.5 7.3C27.5 20.9 16.6 27.5 16 27.5z" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/></svg>';
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

(async () => {
  const sheet = document.getElementById('sheet');
  let frames;
  try {
    frames = await (await fetch('assets/frames.json')).json();
  } catch {
    return;
  }
  const byId = new Map(frames.map((f) => [f.id, f]));
  const counts = { prompt: frames.filter((f) => f.app === 'prompt').length, watch: frames.filter((f) => f.app === 'watch').length };

  // ---------- the sheet ----------
  sheet.innerHTML = frames
    .map((f, i) => {
      const first = i === 0 || frames[i - 1].app !== f.app;
      const run = first ? `<span class="run">${APPS[f.app]} <small>${counts[f.app]} screens</small></span>` : '';
      const mark = PICKS.has(f.id) ? `<span class="mark" style="color:var(--${f.app === 'prompt' ? 'ph' : 'wh'})">${HEART}</span>` : '';
      return `<figure class="frame${first ? '' : ' no-run'}" data-app="${f.app}" data-reveal style="--i:${i % 7}">${run}<button type="button" class="shot" data-id="${f.id}" aria-label="${esc(APPS[f.app])}: ${esc(f.caption)}. Open larger"><img src="assets/frames/${f.id}-s.webp" width="${f.w}" height="${f.h}" alt="${esc(f.caption)}" loading="${i < 7 ? 'eager' : 'lazy'}" decoding="async"></button>${mark}</figure>`;
    })
    .join('');
  // Pointing at one app's frames quiets the other app's.
  sheet.addEventListener('pointerover', (e) => {
    const f = e.target.closest('.frame');
    sheet.classList.toggle('dim-watch', f?.dataset.app === 'prompt');
    sheet.classList.toggle('dim-prompt', f?.dataset.app === 'watch');
  });
  sheet.addEventListener('pointerleave', () => sheet.classList.remove('dim-watch', 'dim-prompt'));

  // ---------- the loupe ----------
  const loupe = document.getElementById('loupe');
  const img = document.getElementById('loupe-img');
  const cap = document.getElementById('loupe-cap');
  let at = 0;
  const show = (i) => {
    at = (i + frames.length) % frames.length;
    const f = frames[at];
    img.src = `assets/frames/${f.id}-l.webp`;
    img.alt = f.caption;
    cap.textContent = `${APPS[f.app]} · ${f.caption}`;
  };
  const open = (id) => {
    show(frames.findIndex((f) => f.id === id));
    if (typeof loupe.showModal === 'function') loupe.showModal();
    else window.open(img.src, '_blank');
  };
  document.addEventListener('click', (e) => {
    const shot = e.target.closest('.shot, .spine');
    if (shot?.dataset.id) open(shot.dataset.id);
  });
  document.getElementById('loupe-prev').addEventListener('click', () => show(at - 1));
  document.getElementById('loupe-next').addEventListener('click', () => show(at + 1));
  document.getElementById('loupe-close').addEventListener('click', () => loupe.close());
  loupe.addEventListener('click', (e) => { if (e.target === loupe) loupe.close(); });
  loupe.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(at - 1);
    if (e.key === 'ArrowRight') show(at + 1);
  });

  // ---------- the shelf: pointing at a spine shows its screen ----------
  const shelf = document.getElementById('shelf');
  const pImg = document.getElementById('preview-img');
  const pCap = document.getElementById('preview-cap');
  shelf.innerHTML = FEATURES.map(([app, name, id]) => `<li><button type="button" class="spine" data-app="${app}" data-id="${id}"><span>${esc(name)}</span><span class="tag">${APPS[app].split(' ')[0]}</span></button></li>`).join('');
  const spines = [...shelf.querySelectorAll('.spine')];
  let shown = null;
  const preview = (spine) => {
    spines.forEach((s) => s.classList.toggle('is-on', s === spine));
    const f = byId.get(spine.dataset.id);
    if (!f || shown === f.id) return;
    shown = f.id;
    pImg.classList.add('is-swapping');
    const next = new Image();
    next.src = `assets/frames/${f.id}-l.webp`;
    next.decode().catch(() => {}).finally(() => {
      pImg.src = next.src;
      pImg.alt = f.caption;
      pCap.textContent = `${APPS[f.app]} · ${f.caption}`;
      pImg.classList.remove('is-swapping');
    });
  };
  spines.forEach((s) => {
    s.addEventListener('pointerenter', () => preview(s));
    s.addEventListener('focus', () => preview(s));
  });
  preview(spines[1]);

  revealAll();
})();

// ---------- questions: one answer at a time ----------
(() => {
  const tabs = [...document.querySelectorAll('.faq-list [role="tab"]')];
  const pane = document.getElementById('faq-answer');
  if (!tabs.length) return;
  // On phones each answer opens under its question instead of in the pane.
  tabs.forEach((t) => t.insertAdjacentHTML('afterend', `<p class="faq-inline" hidden>${t.dataset.a}</p>`));
  const select = (tab, focus) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      t.nextElementSibling.hidden = !on;
    });
    if (focus) tab.focus();
    pane.classList.add('is-swapping');
    setTimeout(() => {
      pane.textContent = tab.dataset.a;
      pane.classList.remove('is-swapping');
    }, 150);
  };
  tabs.forEach((t, i) => {
    t.tabIndex = i === 0 ? 0 : -1;
    t.addEventListener('click', () => select(t));
    t.addEventListener('focus', () => select(t));
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) t.addEventListener('pointerenter', () => select(t));
    t.addEventListener('keydown', (e) => {
      const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (!d) return;
      e.preventDefault();
      select(tabs[(i + d + tabs.length) % tabs.length], true);
    });
  });
  tabs[0].nextElementSibling.hidden = false;
})();

// ---------- reveal once on entering the screen; never leaves content hidden ----------
function revealAll() {
  const targets = document.querySelectorAll('[data-reveal]:not(.is-in)');
  if (!('IntersectionObserver' in window)) { targets.forEach((el) => el.classList.add('is-in')); return; }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  targets.forEach((el) => io.observe(el));
  addEventListener('load', () => setTimeout(() => targets.forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight && r.bottom > 0) el.classList.add('is-in');
  }), 2500));
}
document.querySelectorAll('.shelf-head, .get-cols > *, .about-row, .faq-list').forEach((el, i) => { el.setAttribute('data-reveal', ''); el.style.setProperty('--i', String(i % 3)); });
revealAll();
