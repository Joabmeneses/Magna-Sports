'use strict';
// Página de noticias: portada con mascota, cinta de última hora, carrusel de destacadas, filtros por categoría,
// tarjetas tipo revista, lo más reaccionado y lector con barra de progreso. Los datos vienen de news-core.js (Supabase).
(function () {
  var N = window.NEWS, $ = function (s, r) { return (r || document).querySelector(s); };
  var ALL = [], TOT = {}, MINE = {}, cat = 'all', q = '', shown = 13, openId = null, busy = {};
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ICON = { share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.4 1.8 2.2 1.2 1.1 2.2 1.4 2.5 1.6.3.1.5.1.7-.1l.9-1.1c.2-.3.4-.2.7-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3z"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>' };
  function toast(m) { var t = $('#toast2'); t.textContent = m; t.classList.add('on'); clearTimeout(toast.i); toast.i = setTimeout(function () { t.classList.remove('on'); }, 2400); }
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function cover(a, wrap) { if (a.cover_url) { var im = el('img'); im.src = a.cover_url; im.alt = ''; im.loading = 'lazy'; im.decoding = 'async'; wrap.appendChild(im); } else { var bg = el('div', 'bg'); bg.style.setProperty('--c', N.cat(a.category).color); bg.appendChild(el('span', null, N.cat(a.category).name)); wrap.appendChild(bg); } return wrap; }
  function chip(a) { var c = N.cat(a.category), s = el('span', 'chipc', c.name); s.style.setProperty('--c', c.color); return s; }
  function mins(a) { var w = String((a.title || '') + ' ' + (a.summary || '') + ' ' + (a.body || '')).split(/\s+/).filter(Boolean).length; return Math.max(1, Math.round(w / 200)); }
  function rt(a) { var s = el('span', 'rt'); s.innerHTML = ICON.clock; s.appendChild(document.createTextNode(mins(a) + ' min')); return s; }
  function ago(a) { return N.ago ? N.ago(a.publish_at) : N.fdate(a.publish_at); }
  function total(id) { var t = TOT[id] || {}; return Object.keys(t).reduce(function (s, k) { return s + (t[k] || 0); }, 0); }
  function isNew(a) { return Date.now() - new Date(a.publish_at).getTime() < 48 * 3600e3; }
  function summary(id) { var t = TOT[id] || {}, l = N.REACT.map(function (r) { return [r, t[r[0]] || 0]; }).filter(function (x) { return x[1] > 0; }).sort(function (a, b) { return b[1] - a[1]; }), n = l.reduce(function (s, x) { return s + x[1]; }, 0), w = el('span', 'rsum');
    if (!n) { w.textContent = '¡Sé el primero en reaccionar!'; w.classList.add('z'); return w; } var em = el('span'); l.slice(0, 3).forEach(function (x) { em.appendChild(el('em', null, x[0][1])); }); w.appendChild(em); w.appendChild(el('b', null, String(n))); return w; }
  function link(a) { return location.origin + location.pathname + '#n-' + a.id; }
  function share(a) { var url = link(a), data = { title: a.title, text: a.summary || a.title, url: url };
    if (navigator.share) return navigator.share(data).catch(function () {});
    copy(url); }
  function copy(url) { (navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(url) : Promise.reject()).then(function () { toast('🔗 Enlace copiado'); }, function () { prompt('Copia el enlace:', url); }); }

  // ---------- portada: cifras ----------
  function drawHead() { var w = $('#nhStats'); if (!w) return; w.innerHTML = ''; if (!ALL.length) return;
    var reac = ALL.reduce(function (s, a) { return s + total(a.id); }, 0), cats = {}; ALL.forEach(function (a) { cats[a.category] = 1; });
    [[ALL.length, ALL.length === 1 ? 'noticia' : 'noticias', '#ff5a36'], [Object.keys(cats).length, 'categorías', '#8b5cf6'], [reac, 'reacciones', '#ffd23f'], [ago(ALL[0]), 'última publicación', '#2ee59d']].forEach(function (x, i) {
      var d = el('div', 'nh-k'); d.style.setProperty('--c', x[2]); d.style.animationDelay = (i * 80) + 'ms'; d.appendChild(el('b', null, String(x[0]))); d.appendChild(el('small', null, x[1])); w.appendChild(d); }); }
  // ---------- cinta de última hora ----------
  function drawTicker() { var w = $('#tk'), tr = $('#tkT'); tr.innerHTML = ''; var l = ALL.slice(0, 8); w.hidden = l.length < 2; if (w.hidden) return;
    for (var k = 0; k < 2; k++) l.forEach(function (a) { var b = el('button', 'tk-i'); b.type = 'button'; b.tabIndex = k ? -1 : 0; var d = el('i'); d.style.background = N.cat(a.category).color; b.appendChild(d); b.appendChild(el('b', null, a.title)); b.appendChild(el('small', null, ago(a))); b.onclick = function () { open(a.id); }; tr.appendChild(b); });
    tr.style.animationDuration = Math.max(24, l.length * 7) + 's'; }
  // ---------- carrusel de destacadas ----------
  var CAR = { i: 0, t: null, list: [] };
  function drawFeat() {
    var f = ALL.filter(function (a) { return a.featured; }).slice(0, 6), lbl = 'Destacadas'; if (!f.length) { f = ALL.slice(0, Math.min(4, ALL.length)); lbl = 'Lo más nuevo'; }
    var w = $('#featWrap'), g = $('#feat'); g.innerHTML = ''; w.hidden = f.length < 1 || ALL.length < 2; $('#featT').textContent = lbl; if (w.hidden) return;
    CAR.list = f; if (CAR.i >= f.length) CAR.i = 0;
    var track = el('div', 'car-tr'), dots = el('div', 'car-dots');
    f.forEach(function (a, i) {
      var s = el('button', 'fc'); s.type = 'button'; s.setAttribute('aria-label', 'Leer: ' + a.title); s.style.setProperty('--c', N.cat(a.category).color); cover(a, s);
      if (a.featured) s.appendChild(el('span', 'star', '★ Destacada')); else if (isNew(a)) s.appendChild(el('span', 'star nw', '✦ Nueva'));
      var inn = el('div', 'in'); inn.appendChild(chip(a)); inn.appendChild(el('h3', null, a.title)); if (a.summary) inn.appendChild(el('p', null, a.summary));
      var mt = el('div', 'meta'); mt.appendChild(el('span', null, ago(a))); mt.appendChild(rt(a)); mt.appendChild(summary(a.id)); inn.appendChild(mt); inn.appendChild(el('span', 'go', 'Leer noticia →')); s.appendChild(inn);
      s.onclick = function () { if (CAR.drag) return; open(a.id); }; track.appendChild(s);
      var d = el('button', 'dot'); d.type = 'button'; d.setAttribute('aria-label', 'Noticia ' + (i + 1) + ' de ' + f.length); d.appendChild(el('i')); d.onclick = function () { go(i); }; dots.appendChild(d); });
    g.appendChild(track);
    if (f.length > 1) { var pv = el('button', 'car-a l'); pv.type = 'button'; pv.innerHTML = ICON.prev; pv.setAttribute('aria-label', 'Anterior'); pv.onclick = function () { go(CAR.i - 1); };
      var nx = el('button', 'car-a r'); nx.type = 'button'; nx.innerHTML = ICON.next; nx.setAttribute('aria-label', 'Siguiente'); nx.onclick = function () { go(CAR.i + 1); }; g.appendChild(pv); g.appendChild(nx); g.appendChild(dots); }
    function go(i) { CAR.i = (i + f.length) % f.length; track.style.transform = 'translateX(' + (-CAR.i * 100) + '%)'; [].forEach.call(dots.children, function (d, k) { d.classList.toggle('on', k === CAR.i); }); [].forEach.call(track.children, function (s, k) { s.classList.toggle('on', k === CAR.i); s.tabIndex = k === CAR.i ? 0 : -1; }); auto(); }
    function auto() { clearTimeout(CAR.t); if (RM || f.length < 2 || CAR.hold) return; CAR.t = setTimeout(function () { go(CAR.i + 1); }, 6500); }
    g.onmouseenter = function () { CAR.hold = true; clearTimeout(CAR.t); g.classList.add('hold'); }; g.onmouseleave = function () { CAR.hold = false; g.classList.remove('hold'); auto(); };
    var x0 = null, dx = 0; track.onpointerdown = function (e) { if (f.length < 2) return; x0 = e.clientX; dx = 0; CAR.drag = false; };
    track.onpointermove = function (e) { if (x0 == null) return; dx = e.clientX - x0; if (Math.abs(dx) > 8) { CAR.drag = true; track.style.transition = 'none'; track.style.transform = 'translateX(calc(' + (-CAR.i * 100) + '% + ' + dx + 'px))'; } };
    track.onpointerup = track.onpointercancel = track.onpointerleave = function () { if (x0 == null) return; track.style.transition = ''; var d = dx; x0 = null; if (Math.abs(d) > 60) go(CAR.i + (d < 0 ? 1 : -1)); else go(CAR.i); setTimeout(function () { CAR.drag = false; }, 30); };
    g.onkeydown = function (e) { if (e.key === 'ArrowRight') go(CAR.i + 1); if (e.key === 'ArrowLeft') go(CAR.i - 1); };
    go(CAR.i);
  }
  // ---------- filtros ----------
  function drawFilters() { var w = $('#ftr'); w.innerHTML = ''; [['all', 'Todas', '#ffffff']].concat(N.CATS).forEach(function (c) { var n = c[0] === 'all' ? ALL.length : ALL.filter(function (a) { return a.category === c[0]; }).length; if (c[0] !== 'all' && !n) return;
    var b = el('button', 'nf' + (cat === c[0] ? ' on' : '')); b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', cat === c[0]); b.style.setProperty('--c', c[2]); b.appendChild(el('i')); b.appendChild(document.createTextNode(c[1])); b.appendChild(el('b', null, n));
    b.onclick = function () { cat = c[0]; shown = 13; drawFilters(); drawGrid(); b.scrollIntoView({ block: 'nearest', inline: 'center', behavior: RM ? 'auto' : 'smooth' }); }; w.appendChild(b); }); }
  // ---------- tarjetas ----------
  function visible() { return ALL.filter(function (a) { return (cat === 'all' || a.category === cat) && (!q || (a.title + ' ' + a.summary + ' ' + a.body).toLowerCase().indexOf(q) >= 0); }); }
  function card(a, i, wide) {
    var c = el('article', 'nc' + (wide ? ' wide' : '')); c.style.animationDelay = Math.min(i, 9) * 55 + 'ms'; c.style.setProperty('--c', N.cat(a.category).color);
    var im = el('button', 'im'); im.type = 'button'; im.setAttribute('aria-label', 'Leer: ' + a.title); cover(a, im); im.appendChild(chip(a)); if (isNew(a)) im.appendChild(el('span', 'new', 'NUEVA')); im.onclick = function () { open(a.id); }; c.appendChild(im);
    var bd = el('div', 'bd'), mt = el('div', 'meta'); mt.appendChild(el('span', null, ago(a))); mt.appendChild(rt(a)); if (a.featured) mt.appendChild(el('span', 'ft-s', '★ Destacada')); bd.appendChild(mt);
    var h3 = el('h3'), tb = el('button', null, a.title); tb.type = 'button'; tb.onclick = function () { open(a.id); }; h3.appendChild(tb); bd.appendChild(h3);
    if (a.summary) bd.appendChild(el('p', null, a.summary));
    var ft = el('div', 'ft'); ft.appendChild(summary(a.id)); var r = el('div', 'acts'); var sb = el('button', 'shb'); sb.type = 'button'; sb.setAttribute('aria-label', 'Compartir'); sb.title = 'Compartir'; sb.innerHTML = ICON.share; sb.onclick = function () { share(a); }; r.appendChild(sb); var rd = el('button', 'rd', 'Leer →'); rd.type = 'button'; rd.onclick = function () { open(a.id); }; r.appendChild(rd); ft.appendChild(r); bd.appendChild(ft);
    c.appendChild(bd);
    if (!RM) { c.addEventListener('pointermove', function (e) { if (e.pointerType !== 'mouse') return; var b = c.getBoundingClientRect(); c.style.setProperty('--mx', ((e.clientX - b.left) / b.width * 100) + '%'); c.style.setProperty('--my', ((e.clientY - b.top) / b.height * 100) + '%'); }); }
    return c;
  }
  function empty(g, title, txt, pose) { var e = el('div', 'empty2'); e.style.gridColumn = '1/-1'; var m = el('img'); m.src = N.mascotUrl(pose); m.alt = ''; m.loading = 'lazy'; e.appendChild(m); var t = el('div'); t.appendChild(el('b', null, title)); t.appendChild(el('span', null, txt)); e.appendChild(t); g.appendChild(e); return e; }
  function drawGrid() { var g = $('#grid'); g.innerHTML = ''; var l = visible(); $('#cnt').textContent = l.length ? l.length + (l.length === 1 ? ' noticia' : ' noticias') : '';
    if (!l.length) { if (ALL.length) { var e = empty(g, 'No hay noticias con ese filtro', 'Prueba otra categoría o búsqueda.', 'pensando'), b = el('button', 'rd', 'Ver todas'); b.type = 'button'; b.onclick = function () { cat = 'all'; q = ''; $('#q').value = ''; drawFilters(); drawGrid(); }; e.lastChild.appendChild(b); } else empty(g, 'Todavía no hay noticias', 'Muy pronto publicaremos las primeras novedades de la comunidad.', 'silencio'); $('#more').hidden = true; return; }
    l.slice(0, shown).forEach(function (a, i) { g.appendChild(card(a, i, i === 0 && l.length > 2 && !q)); }); $('#more').hidden = l.length <= shown; }
  // ---------- lo más reaccionado ----------
  function drawTop() { var w = $('#topN'), ls = $('#topL'); ls.innerHTML = ''; var l = ALL.filter(function (a) { return total(a.id) > 0; }).sort(function (a, b) { return total(b.id) - total(a.id); }).slice(0, 5);
    if (!l.length) l = ALL.slice(0, 5); w.hidden = !l.length; $('#topT').textContent = l.length && total(l[0].id) ? 'Lo más reaccionado' : 'Para leer ahora';
    l.forEach(function (a, i) { var b = el('button', 'tp'); b.type = 'button'; b.style.setProperty('--c', N.cat(a.category).color); b.style.animationDelay = i * 60 + 'ms'; b.appendChild(el('span', 'n', String(i + 1))); var t = el('div'); t.appendChild(el('b', null, a.title)); var s = el('small'); s.appendChild(el('i')); s.appendChild(document.createTextNode(N.cat(a.category).name + (total(a.id) ? ' · ' + total(a.id) + ' reacciones' : ' · ' + ago(a)))); t.appendChild(s); b.appendChild(t); b.appendChild(cover(a, el('div', 'th'))); b.onclick = function () { open(a.id); }; ls.appendChild(b); }); }
  $('#more').onclick = function () { shown += 12; drawGrid(); };
  $('#q').addEventListener('input', function (e) { q = e.target.value.trim().toLowerCase(); shown = 13; drawGrid(); });
  function drawAll() { drawHead(); drawTicker(); drawFeat(); drawFilters(); drawGrid(); drawTop(); }
  // ---------- reacciones ----------
  function reactBar(a) {
    var w = el('div', 'rx-wrap'); w.appendChild(el('h4', null, '¿Qué te pareció?')); var rs = el('div', 'rxs'); w.appendChild(rs);
    function paint() { rs.innerHTML = ''; N.REACT.forEach(function (r) { var b = el('button', 'rx' + (MINE[a.id] === r[0] ? ' on' : '')); b.type = 'button'; b.title = r[2]; b.setAttribute('aria-pressed', MINE[a.id] === r[0]); b.setAttribute('aria-label', r[2] + ': ' + ((TOT[a.id] || {})[r[0]] || 0));
      b.appendChild(el('span', 'e', r[1])); b.appendChild(el('span', 'n', (TOT[a.id] || {})[r[0]] || 0)); b.disabled = !!busy[a.id];
      b.onclick = function () { pick(r[0], b, r[1]); }; rs.appendChild(b); }); }
    function bump(k, d) { var t = TOT[a.id] = TOT[a.id] || {}; if (k) t[k] = Math.max(0, (t[k] || 0) + d); }
    function pick(k, b, emo) { if (busy[a.id]) return; var cur = MINE[a.id] || null, next = cur === k ? null : k;
      bump(cur, -1); bump(next, 1); MINE[a.id] = next; busy[a.id] = true; paint(); var nb = rs.children[N.REACT.findIndex(function (r) { return r[0] === k; })];
      if (next && nb) { nb.classList.add('pop'); for (var z = 0; z < 5; z++) { var fl = el('span', 'fly', emo); fl.style.setProperty('--dx', ((z - 2) * 18) + 'px'); fl.style.animationDelay = z * 50 + 'ms'; nb.appendChild(fl); } setTimeout(function () { [].forEach.call(nb.querySelectorAll('.fly'), function (x) { x.remove(); }); }, 1200); }
      N.react(a.id, k, cur).then(function () { busy[a.id] = false; paint(); refreshCards(); }, function (e) { busy[a.id] = false; bump(next, -1); bump(cur, 1); MINE[a.id] = cur; paint();
        toast(/anonymous|Anonymous sign-ins are disabled|signups/i.test(e && e.message || '') ? 'Las reacciones aún no están activadas.' : 'No se pudo guardar tu reacción. Revisa tu conexión.'); }); }
    paint(); w.repaint = paint; return w;
  }
  var curBar = null;
  function refreshCards() { drawHead(); drawFeat(); drawGrid(); drawTop(); }
  // ---------- lector ----------
  function close() { var o = $('.rov'); if (!o) return; o.classList.remove('show'); document.documentElement.style.overflow = ''; openId = null; curBar = null; document.title = 'Magna Arena · Noticias'; if (location.hash) history.replaceState(null, '', location.pathname + location.search); setTimeout(function () { o.remove(); }, 250); }
  function open(id) {
    var a = ALL.filter(function (x) { return x.id === id; })[0]; if (!a) return; var old = $('.rov'); if (old) old.remove();
    openId = id; if (location.hash !== '#n-' + id) history.replaceState(null, '', '#n-' + id);
    var ov = el('div', 'rov'), ar = el('article', 'art'), pg = el('div', 'rpg'), pgi = el('i'); pg.appendChild(pgi); ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', a.title); ov.appendChild(pg); ov.appendChild(ar); ar.style.setProperty('--c', N.cat(a.category).color);
    var cv = el('div', 'cov'); cover(a, cv); var x = el('button', 'x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Cerrar'); x.onclick = close; ar.appendChild(x); ar.appendChild(cv);
    var ab = el('div', 'ab'), mt = el('div', 'meta'); mt.appendChild(chip(a)); mt.appendChild(el('span', null, N.fdate(a.publish_at, true))); mt.appendChild(rt(a)); if (a.featured) mt.appendChild(el('span', 'ft-s', '★ Destacada')); ab.appendChild(mt);
    ab.appendChild(el('h1', null, a.title)); if (a.summary) ab.appendChild(el('p', 'lead', a.summary));
    var body = el('div', 'body'); body.innerHTML = N.render(a.body); ab.appendChild(body);
    curBar = reactBar(a); ab.appendChild(curBar); ab.appendChild(el('p', 'rx-note', 'Una reacción por persona. Puedes cambiarla o quitarla cuando quieras.'));
    var sh = el('div', 'shr'), b1 = el('button'); b1.type = 'button'; b1.innerHTML = ICON.share + 'Compartir'; b1.onclick = function () { share(a); }; sh.appendChild(b1);
    var wa = el('a', 'wa'); wa.href = 'https://wa.me/?text=' + encodeURIComponent(a.title + ' ' + link(a)); wa.target = '_blank'; wa.rel = 'noopener'; wa.innerHTML = ICON.wa + 'WhatsApp'; sh.appendChild(wa);
    var b2 = el('button'); b2.type = 'button'; b2.innerHTML = ICON.link + 'Copiar enlace'; b2.onclick = function () { copy(link(a)); }; sh.appendChild(b2); ab.appendChild(sh);
    var ix = ALL.indexOf(a), nxt = ALL[ix + 1] || null;
    if (nxt) { var nb = el('button', 'nxt'); nb.type = 'button'; nb.style.setProperty('--c', N.cat(nxt.category).color); nb.appendChild(cover(nxt, el('div', 'th'))); var nt = el('div'); nt.appendChild(el('small', null, 'Siguiente noticia →')); nt.appendChild(el('b', null, nxt.title)); nb.appendChild(nt); nb.onclick = function () { open(nxt.id); }; ab.appendChild(nb); }
    var rel = ALL.filter(function (y) { return y.id !== a.id && (!nxt || y.id !== nxt.id) && y.category === a.category; }).concat(ALL.filter(function (y) { return y.id !== a.id && (!nxt || y.id !== nxt.id) && y.category !== a.category; })).slice(0, 3);
    if (rel.length) { var rw = el('div', 'rel'); rw.appendChild(el('h4', null, 'Más noticias')); var ls = el('div', 'lst'); rel.forEach(function (y) { var bt = el('button'); bt.type = 'button'; bt.appendChild(cover(y, el('div', 'th'))); var t = el('div'); t.appendChild(el('b', null, y.title)); t.appendChild(el('small', null, N.cat(y.category).name + ' · ' + ago(y))); bt.appendChild(t); bt.onclick = function () { open(y.id); }; ls.appendChild(bt); }); rw.appendChild(ls); ab.appendChild(rw); }
    ar.appendChild(ab); document.body.appendChild(ov); document.documentElement.style.overflow = 'hidden';
    ov.addEventListener('scroll', function () { var m = ov.scrollHeight - ov.clientHeight; pgi.style.width = (m > 0 ? Math.min(100, ov.scrollTop / m * 100) : 100) + '%'; }, { passive: true });
    requestAnimationFrame(function () { ov.classList.add('show'); }); ov.addEventListener('click', function (e) { if (e.target === ov) close(); }); x.focus();
    document.title = a.title + ' · Magna Arena';
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  addEventListener('hashchange', function () { var m = /^#n-(\d+)$/.exec(location.hash); if (m && Number(m[1]) !== openId) open(Number(m[1])); else if (!m && openId) close(); });
  // ---------- carga y tiempo real ----------
  function loadTotals() { return N.totals(ALL.map(function (a) { return a.id; })).then(function (r) { TOT = {}; (r.data || []).forEach(function (x) { (TOT[x.article_id] = TOT[x.article_id] || {})[x.emoji] = x.total; }); }); }
  function load() {
    return N.listPublic().then(function (r) { if (r.error) throw r.error; ALL = r.data || []; return Promise.all([loadTotals(), N.mine().then(function (m) { MINE = m; }, function () {})]); })
      .then(function () { drawAll(); var m = /^#n-(\d+)$/.exec(location.hash); if (m) { if (ALL.some(function (a) { return a.id === Number(m[1]); })) open(Number(m[1])); else toast('Esa noticia ya no está disponible.'); } });
  }
  load().catch(function () { var g = $('#grid'); g.innerHTML = ''; var e = empty(g, 'No pudimos cargar las noticias', 'Revisa tu conexión y vuelve a intentarlo.', 'enojado'), b = el('button', 'rd', 'Reintentar'); b.type = 'button'; b.onclick = function () { location.reload(); }; e.lastChild.appendChild(b); });
  N.isAdmin().then(function (ok) { $('#create').hidden = !ok; });
  window.MAGNA_SB().then(function (sb) {
    var t = null;
    sb.channel('magna-news').on('postgres_changes', { event: '*', schema: 'public', table: 'article_reaction_totals' }, function (p) { var r = p.new && p.new.article_id ? p.new : p.old; if (!r || !r.article_id) return; if (busy[r.article_id]) return;
      (TOT[r.article_id] = TOT[r.article_id] || {})[r.emoji] = p.new && p.new.emoji ? p.new.total : 0; clearTimeout(t); t = setTimeout(function () { if (curBar && openId === r.article_id) curBar.repaint(); refreshCards(); }, 120); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'articles' }, function () { if ($('.newp')) return; var b = el('button', 'newp', '📰 Hay noticias nuevas · Toca para verlas'); b.onclick = function () { b.remove(); load(); }; document.body.appendChild(b); })
      .subscribe();
  }, function () {});
})();
