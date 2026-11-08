'use strict';
// Mecánicas de movimiento del inicio: deslizar el marcador entre partidos, deslizar las pestañas de las alineaciones,
// carruseles que se arrastran, tarjetas que se inclinan en 3D, secciones que aparecen al bajar, números que cuentan,
// onda al tocar, barra de progreso de lectura y botón para volver arriba. Solo presentación: no cambia datos.
(function () {
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches, FINE = matchMedia('(pointer: fine)').matches;
  function $$(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }
  function h(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function buzz(n) { try { if (navigator.vibrate) navigator.vibrate(n || 10); } catch (e) {} }
  // gesto horizontal reutilizable (no bloquea el scroll vertical)
  function swipe(el, onEnd, onMove) {
    var x0 = null, y0 = 0, dx = 0, lock = null, id = null;
    el.addEventListener('pointerdown', function (e) { if (e.button || e.target.closest('button, a, input, select, .rx, .react, .mp')) return; x0 = e.clientX; y0 = e.clientY; dx = 0; lock = null; id = e.pointerId; }, { passive: true });
    el.addEventListener('pointermove', function (e) { if (x0 == null || e.pointerId !== id) return; var ddx = e.clientX - x0, ddy = e.clientY - y0;
      if (lock == null && (Math.abs(ddx) > 8 || Math.abs(ddy) > 8)) { lock = Math.abs(ddx) > Math.abs(ddy) ? 'x' : 'y'; if (lock === 'x') try { el.setPointerCapture(id); } catch (er) {} }
      if (lock === 'x') { dx = ddx; if (onMove) onMove(dx); } }, { passive: true });
    function end() { if (x0 == null) return; var d = lock === 'x' ? dx : 0; x0 = null; lock = null; onEnd(d); }
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
    el.style.touchAction = 'pan-y';
  }

  // ---------- 1. marcador: deslizar entre partidos + puntos ----------
  function banner() {
    var b = document.getElementById('marcador'); if (!b || b.dataset.mv) return; var list = $$('.others .mc'); if (list.length < 2) return; b.dataset.mv = '1';
    var inn = b.querySelector('.bn-in'), dots = h('div', 'mv-dots'); dots.setAttribute('aria-label', 'Partidos');
    list.forEach(function (c, i) { var d = h('button', 'mv-dot'); d.type = 'button'; d.setAttribute('aria-label', 'Ver partido ' + (i + 1)); d.onclick = function () { go(i, i > cur() ? -1 : 1); }; dots.appendChild(d); });
    b.appendChild(dots);
    var pv = h('button', 'mv-arw l', '‹'), nx = h('button', 'mv-arw r', '›'); pv.type = nx.type = 'button'; pv.setAttribute('aria-label', 'Partido anterior'); nx.setAttribute('aria-label', 'Partido siguiente');
    pv.onclick = function () { go(cur() - 1, 1); }; nx.onclick = function () { go(cur() + 1, -1); }; dots.insertBefore(pv, dots.firstChild); dots.appendChild(nx);
    function cur() { var l = $$('.others .mc'), i = l.findIndex(function (c) { return c.classList.contains('on'); }); return i < 0 ? 0 : i; }
    function mark() { var i = cur(); $$('.mv-dot', dots).forEach(function (d, k) { d.classList.toggle('on', k === i); }); }
    function go(i, dir) { var l = $$('.others .mc'); if (!l.length) return; i = (i + l.length) % l.length; if (i === cur()) { inn.style.transform = ''; return; }
      buzz(12); inn.style.transition = 'transform .22s ease-in, opacity .22s'; inn.style.transform = 'translateX(' + (dir * 40) + '%) rotate(' + (dir * -3) + 'deg)'; inn.style.opacity = '0';
      setTimeout(function () { l[i].click(); inn.style.transition = 'none'; inn.style.transform = 'translateX(' + (-dir * 40) + '%) rotate(' + (dir * 3) + 'deg)';
        requestAnimationFrame(function () { requestAnimationFrame(function () { inn.style.transition = 'transform .45s cubic-bezier(.2,1.3,.4,1), opacity .3s'; inn.style.transform = ''; inn.style.opacity = '1'; mark(); }); }); }, 220); }
    swipe(b, function (d) { if (Math.abs(d) > 70) go(cur() + (d < 0 ? 1 : -1), d < 0 ? -1 : 1); else { inn.style.transition = 'transform .35s cubic-bezier(.2,1.4,.4,1)'; inn.style.transform = ''; } },
      function (d) { inn.style.transition = 'none'; inn.style.transform = 'translateX(' + d * .5 + 'px) rotate(' + d * .012 + 'deg)'; });
    $$('.others .mc').forEach(function (c) { c.addEventListener('click', function () { setTimeout(mark, 30); }); });
    mark();
    var hint = h('div', 'mv-hint'); hint.innerHTML = '<span>👆</span> Desliza o usa las flechas para ver otros partidos'; dots.appendChild(hint);
  }
  // ---------- 2. alineaciones: deslizar entre pestañas ----------
  function lineups() {
    var a = document.getElementById('alineaciones'); if (!a || a.dataset.mv) return; a.dataset.mv = '1';
    swipe(a, function (d) { if (Math.abs(d) < 70) return; var tb = $$('.al-tabs button', a), i = tb.findIndex(function (x) { return x.classList.contains('on') || x.getAttribute('aria-selected') === 'true'; }), j = i + (d < 0 ? 1 : -1);
      if (j < 0 || j >= tb.length) { a.classList.add('mv-bump'); setTimeout(function () { a.classList.remove('mv-bump'); }, 400); return; }
      buzz(10); tb[j].click(); var body = a.querySelector('.al-tm + div'); if (body) { body.classList.remove('mv-in-l', 'mv-in-r'); void body.offsetWidth; body.classList.add(d < 0 ? 'mv-in-r' : 'mv-in-l'); } });
    a.addEventListener('click', function (e) { var b = e.target.closest('.al-tabs button'); if (!b) return; setTimeout(function () { var body = a.querySelector('.al-tm + div'); if (body) { body.classList.remove('mv-pop'); void body.offsetWidth; body.classList.add('mv-pop'); } }, 0); });
    var hd = a.querySelector('.al-h'); if (hd && !hd.querySelector('.mv-sw')) hd.appendChild(h('span', 'mv-sw', '⟷ desliza para cambiar de vista'));
  }
  // ---------- 3. carruseles arrastrables ----------
  function slider(el) {
    if (!el || el.dataset.mv) return; el.dataset.mv = '1'; el.classList.add('mv-sl');
    var wrap = h('div', 'mv-slw'); el.parentNode.insertBefore(wrap, el); wrap.appendChild(el);
    var bar = h('div', 'mv-bar'), bi = h('i'); bar.appendChild(bi);
    var pv = h('button', 'mv-sa l', '‹'), nx = h('button', 'mv-sa r', '›'); pv.type = nx.type = 'button'; pv.setAttribute('aria-label', 'Anterior'); nx.setAttribute('aria-label', 'Siguiente');
    function step() { var c = el.firstElementChild; return c ? c.getBoundingClientRect().width + 14 : 280; }
    pv.onclick = function () { el.scrollBy({ left: -step(), behavior: 'smooth' }); }; nx.onclick = function () { el.scrollBy({ left: step(), behavior: 'smooth' }); };
    wrap.appendChild(pv); wrap.appendChild(nx); wrap.appendChild(bar);
    function upd() { var m = el.scrollWidth - el.clientWidth; wrap.classList.toggle('mv-nos', m < 4); bi.style.width = (m > 0 ? Math.max(12, el.clientWidth / el.scrollWidth * 100) : 100) + '%'; bi.style.marginLeft = (m > 0 ? el.scrollLeft / el.scrollWidth * 100 : 0) + '%'; pv.disabled = el.scrollLeft < 4; nx.disabled = el.scrollLeft > m - 4; }
    el.addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); setTimeout(upd, 60);
    // arrastre con mouse + inercia
    if (FINE) { var down = false, sx = 0, sl = 0, v = 0, lx = 0, moved = false, raf = null;
      el.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse' || e.button) return; down = true; moved = false; sx = lx = e.clientX; sl = el.scrollLeft; v = 0; cancelAnimationFrame(raf); el.classList.add('drag'); });
      addEventListener('pointermove', function (e) { if (!down) return; var d = e.clientX - sx; if (Math.abs(d) > 5) moved = true; v = e.clientX - lx; lx = e.clientX; el.scrollLeft = sl - d; });
      addEventListener('pointerup', function () { if (!down) return; down = false; el.classList.remove('drag'); (function glide() { v *= .93; el.scrollLeft -= v; if (Math.abs(v) > .4) raf = requestAnimationFrame(glide); else el.classList.remove('drag'); })(); });
      el.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true); }
  }
  // ---------- 4. inclinación 3D con brillo ----------
  var TILT = '.others .mc, .hh-g, .hh-cc, .hh-n, .hh-m, .hh-box';
  function tilt() { if (!FINE || RM) return;
    document.addEventListener('pointermove', function (e) { var c = e.target.closest && e.target.closest(TILT); if (!c) return; var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height, k = c.classList.contains('hh-box') ? 3 : 8;
      c.classList.add('mv-tl'); c.style.setProperty('--mx', x * 100 + '%'); c.style.setProperty('--my', y * 100 + '%'); c.style.transform = 'perspective(800px) rotateX(' + ((.5 - y) * k) + 'deg) rotateY(' + ((x - .5) * k) + 'deg) translateY(-3px)'; }, { passive: true });
    document.addEventListener('pointerout', function (e) { var c = e.target.closest && e.target.closest(TILT); if (c && !c.contains(e.relatedTarget)) { c.style.transform = ''; c.classList.remove('mv-tl'); } }, { passive: true }); }
  // ---------- 5. aparición al bajar + contadores ----------
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) { es.forEach(function (en) { if (!en.isIntersecting) return; var t = en.target; t.classList.add('in'); io.unobserve(t); $$('.hh-v, .hh-kp b, .mc-s:not(.up)', t).forEach(count); }); }, { rootMargin: '0px 0px -8% 0px', threshold: .08 }) : null;
  function reveal() { if (!io || RM) return; $$('.hh-sec, #alineaciones, .others').forEach(function (s) { if (s.dataset.mvr) return; s.dataset.mvr = '1'; s.classList.add('mv-rv'); [].slice.call(s.querySelectorAll('.hh-g, .hh-cc, .hh-m, .hh-rk, .hh-n, .hh-f, .hh-t, .mc')).forEach(function (c, i) { c.style.setProperty('--d', Math.min(i, 10) * 55 + 'ms'); }); io.observe(s); }); }
  function count(el) { if (el.dataset.mvc) return; el.dataset.mvc = '1'; var txt = el.textContent, m = txt.match(/\d[\d.]*/); if (!m) return; var n = Number(m[0].replace(/\./g, '')); if (!isFinite(n) || n < 2) return;
    var dots = m[0].indexOf('.') >= 0, t0 = performance.now(), D = 900; (function f(t) { var p = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - p, 3), v = Math.round(n * e); el.textContent = txt.replace(m[0], dots ? v.toLocaleString('es-CO') : String(v)); if (p < 1) requestAnimationFrame(f); else el.textContent = txt; })(t0); }
  // ---------- 6. onda al tocar ----------
  document.addEventListener('pointerdown', function (e) { if (RM) return; var b = e.target.closest && e.target.closest('button, .hh-g, .hh-cc, .hh-m, .hh-more, .mc, .al-t, .hh-t, .mv-dot'); if (!b || b.closest('.mv-sl.drag')) return;
    var r = b.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2.2, w = h('span', 'mv-rp'); w.style.width = w.style.height = s + 'px'; w.style.left = (e.clientX - r.left - s / 2) + 'px'; w.style.top = (e.clientY - r.top - s / 2) + 'px';
    if (getComputedStyle(b).position === 'static') b.style.position = 'relative'; if (getComputedStyle(b).overflow !== 'hidden') b.classList.add('mv-clip'); b.appendChild(w); setTimeout(function () { w.remove(); }, 650); }, { passive: true });
  // ---------- 7. barra de lectura + volver arriba ----------
  function chrome() { if (document.querySelector('.mv-pg')) return; var pg = h('div', 'mv-pg'), pi = h('i'); pg.appendChild(pi); document.body.appendChild(pg);
    var up = h('button', 'mv-up'); up.type = 'button'; up.setAttribute('aria-label', 'Volver arriba'); up.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    up.onclick = function () { buzz(8); up.classList.add('go'); scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' }); setTimeout(function () { up.classList.remove('go'); }, 700); }; document.body.appendChild(up);
    var tk = false; addEventListener('scroll', function () { if (tk) return; tk = true; requestAnimationFrame(function () { tk = false; var m = document.documentElement.scrollHeight - innerHeight; pi.style.transform = 'scaleX(' + (m > 0 ? scrollY / m : 0) + ')'; up.classList.toggle('on', scrollY > 700); }); }, { passive: true }); }
  // ---------- escudos sin imagen: iniciales y color del equipo ----------
  function initials() { var S = window.MAGNA && MAGNA.S; if (!S) return; var by = {}; S.teams.forEach(function (t) { by[t.name.toLowerCase()] = t; });
    function fill(im, name) { if (!im || !name) return; var t = by[name.trim().toLowerCase()]; im.dataset.in = name.trim().slice(0, 2).toUpperCase(); if (t && MAGNA.teamColor) im.style.setProperty('--tc', MAGNA.teamColor(t.id)); }
    var hs = $$('.hero.mob h1 span'); if (hs.length >= 3) { fill(document.querySelector('.hero.mob .d1 .im.e'), hs[0].textContent); fill(document.querySelector('.hero.mob .d2 .im.e'), hs[2].textContent); }
    $$('.others .mc').forEach(function (c) { var t = c.querySelector('.mc-t'), ims = c.querySelectorAll('.mc-c .im'); if (!t || ims.length < 2) return; var nm = t.textContent.split(/\s+vs\.?\s+/i); if (nm.length < 2) return; if (ims[0].classList.contains('e')) fill(ims[0], nm[0]); if (ims[1].classList.contains('e')) fill(ims[1], nm[1]); });
    var bn = [document.getElementById('bN1'), document.getElementById('bN2')]; $$('.bn-grid .dc').forEach(function (d, i) { var im = d.querySelector('.im.e'); if (im && bn[i]) fill(im, bn[i].textContent); }); }
  // ---------- arranque y re-dibujos ----------
  function run() { initials(); banner(); lineups(); ['.others', '.hh-ms', '.hh-news'].forEach(function (s) { $$(s).forEach(slider); }); if (innerWidth < 760) $$('.hh-go, .hh-comp').forEach(slider); reveal(); }
  var t = null, mo = new MutationObserver(function () { clearTimeout(t); t = setTimeout(run, 150); });
  function start() { run(); tilt(); chrome(); var m = document.querySelector('main'); if (m) mo.observe(m, { childList: true, subtree: true }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(start, 300); }); else setTimeout(start, 300);
})();
