'use strict';
// Página de noticias: portada con mascota, cinta de última hora, carrusel de destacadas, filtros por categoría,
// tarjetas tipo revista, lo más reaccionado y lector con barra de progreso. Los datos vienen de news-core.js (Supabase).
(function () {
  var N = window.NEWS, $ = function (s, r) { return (r || document).querySelector(s); };
  var ALL = [], TOT = {}, MINE = {}, CC = {}, ME = null, cat = 'all', q = '', AG = null, MYTEAM = null, shown = 13, openId = null, busy = {};
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ICON = { share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.4 1.8 2.2 1.2 1.1 2.2 1.4 2.5 1.6.3.1.5.1.7-.1l.9-1.1c.2-.3.4-.2.7-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3z"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>' };
  function toast(m) { var t = $('#toast2'); t.textContent = m; t.classList.add('on'); clearTimeout(toast.i); toast.i = setTimeout(function () { t.classList.remove('on'); }, 2400); }
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function agentVars(a, e) { var g = N.agentOf(a); e.style.setProperty('--ac', g.color); if (g.bg) e.style.setProperty('--agbg', 'linear-gradient(rgba(12,7,22,.35),rgba(12,7,22,.55)),url("' + g.bg + '")'); return e; }
  function cover(a, wrap) { agentVars(a, wrap); if (a.cover_url) { var im = el('img'); im.src = a.cover_url; im.alt = ''; im.loading = 'lazy'; im.decoding = 'async'; wrap.appendChild(im); } else { var bg = el('div', 'bg'); bg.style.setProperty('--c', N.cat(a.category).color); bg.appendChild(el('span', null, N.cat(a.category).name)); wrap.appendChild(bg); } return wrap; }
  function chip(a) { var c = N.cat(a.category), s = el('span', 'chipc', c.name); s.style.setProperty('--c', c.color); return s; }
  function mins(a) { var w = String((a.title || '') + ' ' + (a.summary || '') + ' ' + (a.body || '')).split(/\s+/).filter(Boolean).length; return Math.max(1, Math.round(w / 200)); }
  function rt(a) { var s = el('span', 'rt'); s.innerHTML = ICON.clock; s.appendChild(document.createTextNode(mins(a) + ' min')); return s; }
  function ago(a) { return N.ago ? N.ago(a.publish_at) : N.fdate(a.publish_at); }
  function total(id) { var t = TOT[id] || {}; return Object.keys(t).reduce(function (s, k) { return s + (t[k] || 0); }, 0); }
  function isNew(a) { return Date.now() - new Date(a.publish_at).getTime() < 48 * 3600e3; }
  function summary(id) { var t = TOT[id] || {}, l = N.REACT.map(function (r) { return [r, t[r[0]] || 0]; }).filter(function (x) { return x[1] > 0; }).sort(function (a, b) { return b[1] - a[1]; }), n = l.reduce(function (s, x) { return s + x[1]; }, 0), w = el('span', 'rsum');
    if (!n) { w.textContent = '¡Sé el primero en reaccionar!'; w.classList.add('z'); return w; } var em = el('span'); l.slice(0, 3).forEach(function (x) { em.appendChild(el('em', null, x[0][1])); }); w.appendChild(em); w.appendChild(el('b', null, String(n))); return w; }
  // cabecera de la cuenta oficial que publica (como un post)
  function who(a, big) { var g = N.agentOf(a), w = el('div', 'who k-' + g.kind + (big ? ' big' : '')); w.style.setProperty('--ac', g.color); w.style.setProperty('--ai', g.ink);
    var av = el('span', 'who-av'); if (g.crest) { var im = el('img'); im.src = g.crest; im.alt = ''; im.loading = 'lazy'; im.onerror = function () { im.remove(); av.textContent = g.mark; }; av.appendChild(im); } else av.textContent = g.mark;
    if (g.bg) av.style.backgroundImage = 'linear-gradient(rgba(0,0,0,.25),rgba(0,0,0,.25)),url("' + g.bg + '")'; w.appendChild(av);
    var t = el('div', 'who-t'), n = el('b', null, g.name), bd = g.kind === 'ai' ? el('i', 'vf ai', 'IA') : el('i', 'vf' + (g.kind === 'pres' ? ' gold' : g.kind === 'team' ? ' team' : ''), '✔');
    bd.title = g.kind === 'ai' ? 'Periodista simulado con inteligencia artificial' : g.kind === 'team' ? 'Equipo verificado' : g.kind === 'pres' ? 'Presidente verificado' : 'Cuenta oficial'; n.appendChild(bd); t.appendChild(n);
    t.appendChild(el('small', null, g.handle + ' · ' + ago(a))); w.appendChild(t);
    if (big) w.appendChild(el('span', 'who-tag', g.kind === 'ai' ? 'PERIODISTA IA' : g.kind === 'team' ? 'EQUIPO' : g.kind === 'pres' ? 'PRESIDENTE' : 'OFICIAL')); return w; }
  function ccount(a) { var n = CC[a.id] || 0, s = el('span', 'ccn'); s.appendChild(el('em', null, '💬')); s.appendChild(el('b', null, String(n))); s.title = n + (n === 1 ? ' comentario' : ' comentarios'); return s; }
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
  function visible() { return ALL.filter(function (a) { return (!AG || N.agentOf(a).id === AG) && (cat === 'all' || a.category === cat) && (!q || (a.title + ' ' + a.summary + ' ' + a.body).toLowerCase().indexOf(q) >= 0); }); }
  function card(a, i, wide) {
    var c = el('article', 'nc' + (wide ? ' wide' : '')); c.style.animationDelay = Math.min(i, 9) * 55 + 'ms'; c.style.setProperty('--c', N.cat(a.category).color);
    var im = el('button', 'im'); im.type = 'button'; im.setAttribute('aria-label', 'Leer: ' + a.title); cover(a, im); im.appendChild(chip(a)); if (isNew(a)) im.appendChild(el('span', 'new', 'NUEVA')); im.onclick = function () { open(a.id); }; c.appendChild(im);
    var bd = el('div', 'bd'), mt = el('div', 'meta'); bd.appendChild(who(a)); mt.appendChild(rt(a)); if (a.featured) mt.appendChild(el('span', 'ft-s', '★ Destacada')); bd.appendChild(mt);
    var h3 = el('h3'), tb = el('button', null, a.title); tb.type = 'button'; tb.onclick = function () { open(a.id); }; h3.appendChild(tb); bd.appendChild(h3);
    if (a.summary) bd.appendChild(el('p', null, a.summary));
    var ft = el('div', 'ft'); var sm = el('div', 'ftl'); sm.appendChild(summary(a.id)); sm.appendChild(ccount(a)); ft.appendChild(sm); var r = el('div', 'acts'); var sb = el('button', 'shb'); sb.type = 'button'; sb.setAttribute('aria-label', 'Compartir'); sb.title = 'Compartir'; sb.innerHTML = ICON.share; sb.onclick = function () { share(a); }; r.appendChild(sb); var rd = el('button', 'rd', 'Leer →'); rd.type = 'button'; rd.onclick = function () { open(a.id); }; r.appendChild(rd); ft.appendChild(r); bd.appendChild(ft);
    c.appendChild(bd);
    if (!RM) { c.addEventListener('pointermove', function (e) { if (e.pointerType !== 'mouse') return; var b = c.getBoundingClientRect(); c.style.setProperty('--mx', ((e.clientX - b.left) / b.width * 100) + '%'); c.style.setProperty('--my', ((e.clientY - b.top) / b.height * 100) + '%'); }); }
    return c;
  }
  function empty(g, title, txt, pose) { var e = el('div', 'empty2'); e.style.gridColumn = '1/-1'; var m = el('img'); m.src = N.mascotUrl(pose); m.alt = ''; m.loading = 'lazy'; e.appendChild(m); var t = el('div'); t.appendChild(el('b', null, title)); t.appendChild(el('span', null, txt)); e.appendChild(t); g.appendChild(e); return e; }
  // ---------- botón de reaccionar (toque = 👍 · mantener o pasar el mouse = elegir) ----------
  var PK = null;
  function closePick() { if (PK) { PK.remove(); PK = null; } }
  document.addEventListener('pointerdown', function (e) { if (PK && !PK.contains(e.target) && !e.target.closest('.rbtn')) closePick(); }, true); addEventListener('scroll', function () { if (PK) closePick(); }, { passive: true });
  function doReact(a, k, done) { if (busy[a.id]) return; var cur = MINE[a.id] || null, next = cur === k ? null : k, t = TOT[a.id] = TOT[a.id] || {};
    function bump(x, d) { if (x) t[x] = Math.max(0, (t[x] || 0) + d); }
    bump(cur, -1); bump(next, 1); MINE[a.id] = next; busy[a.id] = true; done();
    N.react(a.id, k, cur).then(function () { busy[a.id] = false; refreshCards(); }, function (e) { busy[a.id] = false; bump(next, -1); bump(cur, 1); MINE[a.id] = cur; done();
      toast(/anonymous|signups/i.test(e && e.message || '') ? 'Las reacciones aún no están activadas.' : 'No se pudo guardar tu reacción.'); }); }
  function reactBtn(a) { var b = el('button', 'rbtn pst-c'); b.type = 'button'; var hov = null, lp = null, held = false;
    function paint() { var m = MINE[a.id], r = m && N.REACT.filter(function (x) { return x[0] === m; })[0]; b.classList.toggle('on', !!r); b.innerHTML = ''; b.appendChild(el('span', 'rb-e', r ? r[1] : '👍')); b.appendChild(document.createTextNode(r ? r[2] : 'Reaccionar')); }
    function pick() { closePick(); var p = PK = el('div', 'rpick'); N.REACT.forEach(function (r, i) { var e = el('button', 'rp-e' + (MINE[a.id] === r[0] ? ' on' : ''), r[1]); e.type = 'button'; e.title = r[2]; e.style.animationDelay = i * 30 + 'ms';
        e.onclick = function () { closePick(); doReact(a, r[0], paint); burst(b, r[1]); }; p.appendChild(e); });
      document.body.appendChild(p); var r = b.getBoundingClientRect(), pw = p.offsetWidth; p.style.left = Math.max(8, Math.min(innerWidth - pw - 8, r.left)) + 'px'; p.style.top = Math.max(8, r.top - p.offsetHeight - 8) + 'px'; p.onpointerleave = function (e) { if (e.pointerType === 'mouse') hov = setTimeout(closePick, 350); }; p.onpointerenter = function () { clearTimeout(hov); }; }
    b.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'mouse') return; clearTimeout(hov); hov = setTimeout(pick, 450); });
    b.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'mouse') return; clearTimeout(hov); hov = setTimeout(function () { if (PK && !PK.matches(':hover')) closePick(); }, 350); });
    b.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse') return; held = false; lp = setTimeout(function () { held = true; pick(); }, 420); });
    ['pointerup', 'pointercancel'].forEach(function (ev) { b.addEventListener(ev, function () { clearTimeout(lp); }); });
    b.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    b.onclick = function () { if (held) { held = false; return; } clearTimeout(hov); closePick(); var k = MINE[a.id] || 'like'; doReact(a, k, paint); if (MINE[a.id]) burst(b, N.REACT.filter(function (x) { return x[0] === k; })[0][1]); };
    paint(); b.repaint = paint; return b; }
  function burst(b, emo) { if (RM) return; for (var z = 0; z < 4; z++) { var f = el('span', 'rfly', emo); f.style.setProperty('--dx', (z - 1.5) * 16 + 'px'); f.style.animationDelay = z * 45 + 'ms'; b.appendChild(f); } setTimeout(function () { [].forEach.call(b.querySelectorAll('.rfly'), function (x) { x.remove(); }); }, 900); }
  // ---------- modo post: cada noticia es una publicación de la cuenta oficial ----------
  function stats(a) { var w = el('div', 'pst-st'), n = total(a.id), c = CC[a.id] || 0;
    var l = el('span', 'pst-rs'); l.appendChild(summary(a.id)); w.appendChild(l);
    var r = el('button', 'pst-cn', c ? c + (c === 1 ? ' comentario' : ' comentarios') : 'Sé el primero en comentar'); r.type = 'button'; r.onclick = function () { var p = w.closest('.pst'); if (p && p._cm) p._cm(true); }; w.appendChild(r); return w; }
  function firstPara(b) { var t = String(b || '').split(/\n\s*\n/)[0] || ''; return t; }
  function post(a, i) {
    var p = el('article', 'pst'); p.dataset.id = a.id; p.style.animationDelay = Math.min(i, 8) * 60 + 'ms'; agentVars(a, p);
    var hd = el('div', 'pst-h'); var w = who(a); w.onclick = function () { AG = N.agentOf(a).id; shown = 13; drawFilters(); drawGrid(); drawTop(); scrollTo({ top: $('#grid').getBoundingClientRect().top + scrollY - 90, behavior: RM ? 'auto' : 'smooth' }); }; w.title = 'Ver solo las publicaciones de ' + N.agentOf(a).name; hd.appendChild(w);
    var g0 = N.agentOf(a); if (g0.kind === 'team' && (MYTEAM === g0.team || (ME && ME.role === 'admin'))) { var dl = el('button', 'pst-del', 'Borrar post'); dl.type = 'button'; dl.onclick = function () { if (dl.dataset.k !== '1') { dl.dataset.k = '1'; dl.textContent = '¿Seguro?'; setTimeout(function () { dl.dataset.k = ''; dl.textContent = 'Borrar post'; }, 3000); return; } N.teamPostDel(a.id).then(function () { ALL = ALL.filter(function (x) { return x.id !== a.id; }); drawAll(); toast('Post borrado'); }, function (e) { toast((e && e.message) || 'No se pudo borrar'); }); }; hd.appendChild(dl); }
    var tg = el('div', 'pst-tg'); if (a.featured) tg.appendChild(el('span', 'pin', '📌 Fijada')); tg.appendChild(chip(a)); hd.appendChild(tg); p.appendChild(hd);
    var tx = el('div', 'pst-tx'), tt = el('h3'), tb = el('button', null, a.title); tb.type = 'button'; tb.onclick = function () { open(a.id); }; tt.appendChild(tb); tx.appendChild(tt);
    if (a.summary) tx.appendChild(el('p', 'pst-sum', a.summary));
    var more = el('div', 'pst-more body'); more.innerHTML = N.render(firstPara(a.body)); tx.appendChild(more);
    var full = String(a.body || '').split(/\n\s*\n/).length > 1;
    if (full) { var vm = el('button', 'pst-vm', 'Ver más'); vm.type = 'button'; vm.onclick = function () { var op = !p.classList.contains('exp'); p.classList.toggle('exp', op); more.innerHTML = N.render(op ? a.body : firstPara(a.body)); vm.textContent = op ? 'Ver menos' : 'Ver más'; if (!op) p.scrollIntoView({ block: 'nearest', behavior: RM ? 'auto' : 'smooth' }); }; tx.appendChild(vm); }
    p.appendChild(tx);
    if (a.cover_url) { var im = el('button', 'pst-im'); im.type = 'button'; im.setAttribute('aria-label', 'Abrir: ' + a.title); cover(a, im); im.onclick = function () { open(a.id); }; p.appendChild(im); } else p.classList.add('noimg');
    p.appendChild(stats(a));
    var act = el('div', 'pst-a');
    var bt = el('div', 'pst-bt'), rbt = reactBtn(a); bt.appendChild(rbt); var cb = el('button', 'pst-c'); cb.type = 'button'; cb.innerHTML = '<span class="rb-e">💬</span>Comentar'; var sh = el('button', 'pst-c'); sh.type = 'button'; sh.innerHTML = ICON.share + 'Compartir'; sh.onclick = function () { share(a); };
    bt.appendChild(cb); bt.appendChild(sh); act.appendChild(bt); p.appendChild(act);
    var cw = el('div', 'pst-cm'); cw.hidden = true; p.appendChild(cw);
    p._cm = function (force) { var op = force || cw.hidden; cw.hidden = !op; cb.classList.toggle('on', op); if (op && !cw.firstChild) cw.appendChild(commentsBox(a, function () { var o = p.querySelector('.pst-st'); if (o) o.replaceWith(stats(a)); })); if (op) setTimeout(function () { var t = cw.querySelector('textarea'); if (t) t.focus({ preventScroll: true }); cw.scrollIntoView({ block: 'nearest', behavior: RM ? 'auto' : 'smooth' }); }, 60); };
    cb.onclick = function () { p._cm(); };
    return p; }
  function composer() { var g = N.agent('team:' + MYTEAM); if (!g) return null; var w = el('div', 'cmp'); agentVars({ agent: g.id }, w); w.style.setProperty('--ac', g.color);
    var hd = who({ agent: g.id, publish_at: new Date().toISOString() }); hd.querySelector('.who-t small').textContent = g.handle + ' · Publicar como tu equipo'; w.appendChild(hd);
    var ti = el('input', 'cmp-ti'); ti.maxLength = 120; ti.placeholder = 'Título del comunicado'; var su = el('input', 'cmp-su'); su.maxLength = 300; su.placeholder = 'Entradilla (opcional)';
    var bo = el('textarea', 'cmp-bo'); bo.maxLength = 3000; bo.rows = 3; bo.placeholder = '¿Qué quiere contar ' + g.name + '? Fichajes, convocatorias, mensajes a la afición…';
    var row = el('div', 'cmp-r'), cn = el('small', null, '0/3000'), go = el('button', 'cm-go', 'Publicar'); go.type = 'button'; go.disabled = true;
    function chk() { cn.textContent = bo.value.length + '/3000'; go.disabled = ti.value.trim().length < 3 || !bo.value.trim(); }
    ti.oninput = su.oninput = chk; bo.oninput = function () { chk(); bo.style.height = 'auto'; bo.style.height = Math.min(320, bo.scrollHeight) + 'px'; };
    go.onclick = function () { go.disabled = true; go.textContent = 'Publicando…'; N.teamPost(ti.value.trim(), su.value.trim(), bo.value.trim()).then(function () { toast('📣 Publicado como ' + g.name); ti.value = su.value = bo.value = ''; chk(); return load(); }, function (e) { toast((e && e.message) || 'No se pudo publicar'); }).then(function () { go.textContent = 'Publicar'; chk(); }); };
    w.appendChild(ti); w.appendChild(su); w.appendChild(bo); row.appendChild(el('span', 'cmp-n', 'Se publica al instante en el feed · Máx. 1 post cada 2 horas')); row.appendChild(cn); row.appendChild(go); w.appendChild(row); return w; }
  function drawGrid() { var g = $('#grid'); g.innerHTML = ''; var l = visible(); $('#cnt').textContent = l.length ? l.length + (l.length === 1 ? ' noticia' : ' noticias') : '';
    if (!l.length) { if (ALL.length) { var e = empty(g, 'No hay noticias con ese filtro', 'Prueba otra categoría o búsqueda.', 'pensando'), b = el('button', 'rd', 'Ver todas'); b.type = 'button'; b.onclick = function () { cat = 'all'; q = ''; AG = null; $('#q').value = ''; drawFilters(); drawGrid(); }; e.lastChild.appendChild(b); } else empty(g, 'Todavía no hay noticias', 'Muy pronto publicaremos las primeras novedades de la comunidad.', 'silencio'); $('#more').hidden = true; return; }
    if (MYTEAM && !AG && !q) { var cp = composer(); if (cp) g.appendChild(cp); }
    if (AG) { var ag = N.agent(AG), bn = el('div', 'agb'); agentVars({ agent: AG }, bn); bn.appendChild(who({ agent: AG, publish_at: (l[0] || {}).publish_at || new Date().toISOString() }, true)); bn.appendChild(el('p', null, ag.bio + ' · ' + l.length + (l.length === 1 ? ' publicación' : ' publicaciones'))); var xb = el('button', 'rd', '← Ver todas las cuentas'); xb.type = 'button'; xb.onclick = function () { AG = null; drawFilters(); drawGrid(); drawTop(); }; bn.appendChild(xb); g.appendChild(bn); }
    l.slice().sort(function (x, y) { return (y.featured ? 1 : 0) - (x.featured ? 1 : 0); }).slice(0, shown).forEach(function (a, i) { g.appendChild(post(a, i)); }); $('#more').hidden = l.length <= shown; }
  // ---------- lo más reaccionado ----------
  function drawAgents() { var w = $('#agL'); if (!w) return; w.innerHTML = ''; var cnt = {}, ord = [];
    ALL.forEach(function (a) { var id = N.agentOf(a).id; if (!cnt[id]) { cnt[id] = 0; ord.push(id); } cnt[id]++; });
    var rank = function (id) { var g = N.agent(id); return g.kind === 'org' ? 0 : g.kind === 'pres' ? 1 : g.kind === 'team' ? 2 : 3; };
    ord.sort(function (x, y) { return rank(x) - rank(y) || cnt[y] - cnt[x]; });
    ord.forEach(function (id) { var g = N.agent(id), n = cnt[id]; var b = el('button', 'agi' + (AG === id ? ' on' : '')); b.type = 'button'; agentVars({ agent: id }, b); b.appendChild(who({ agent: id, publish_at: new Date().toISOString() })); b.querySelector('.who-t small').textContent = g.handle + ' · ' + n + (n === 1 ? ' post' : ' posts');
      b.onclick = function () { AG = AG === id ? null : id; shown = 13; drawFilters(); drawGrid(); drawTop(); }; w.appendChild(b); }); }
  function drawTop() { drawAgents(); var w = $('#topN'), ls = $('#topL'); ls.innerHTML = ''; var l = ALL.filter(function (a) { return total(a.id) > 0; }).sort(function (a, b) { return total(b.id) - total(a.id); }).slice(0, 5);
    if (!l.length) l = ALL.slice(0, 5); w.hidden = !l.length; $('#topT').textContent = l.length && total(l[0].id) ? 'Lo más reaccionado' : 'Para leer ahora';
    l.forEach(function (a, i) { var b = el('button', 'tp'); b.type = 'button'; b.style.setProperty('--c', N.cat(a.category).color); b.style.animationDelay = i * 60 + 'ms'; b.appendChild(el('span', 'n', String(i + 1))); var t = el('div'); t.appendChild(el('b', null, a.title)); var s = el('small'); s.appendChild(el('i')); s.appendChild(document.createTextNode(N.cat(a.category).name + (total(a.id) ? ' · ' + total(a.id) + ' reacciones' : ' · ' + ago(a)))); t.appendChild(s); b.appendChild(t); b.appendChild(cover(a, el('div', 'th'))); b.onclick = function () { open(a.id); }; ls.appendChild(b); }); }
  $('#more').onclick = function () { shown += 12; drawGrid(); };
  $('#q').addEventListener('input', function (e) { q = e.target.value.trim().toLowerCase(); shown = 13; drawGrid(); });
  function drawAll() { drawHead(); drawTicker(); drawFilters(); drawGrid(); drawTop(); }
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
  // ---------- comentarios ----------
  function avatarOf(c) { var s = el('span', 'cm-av'); if (c.avatar && /^a\d\d$/.test(c.avatar)) { var im = el('img'); im.src = 'avatars/' + c.avatar + '.webp'; im.alt = ''; im.loading = 'lazy'; s.appendChild(im); } else s.textContent = String(c.name || '?').slice(0, 1).toUpperCase(); return s; }
  function commentsBox(a, onCount) { var w = el('section', 'cms'), hd = el('h4', null, '💬 Comentarios'), cnt = el('span', 'cm-n'); hd.appendChild(cnt); w.appendChild(hd);
    var form = el('div', 'cm-f'), list = el('div', 'cm-l'); w.appendChild(form); w.appendChild(list);
    function drawForm() { form.innerHTML = '';
      if (!ME) { var lg = el('div', 'cm-login'); lg.appendChild(el('span', null, 'Entra con tu cuenta para comentar y debatir con la comunidad.')); var la = el('a', null, 'Entrar'); la.href = 'cuenta.html'; lg.appendChild(la); form.appendChild(lg); return; }
      var me = { name: ME.display_name, avatar: ME.avatar }, ta = el('textarea'); ta.maxLength = 500; ta.rows = 2; ta.placeholder = 'Escribe tu opinión, ' + (ME.display_name || '') + '…'; ta.setAttribute('aria-label', 'Escribe un comentario');
      var row = el('div', 'cm-fr'), left = el('small', null, '0/500'), go = el('button', 'cm-go', 'Comentar'); go.type = 'button'; go.disabled = true;
      ta.oninput = function () { left.textContent = ta.value.length + '/500'; go.disabled = !ta.value.trim(); ta.style.height = 'auto'; ta.style.height = Math.min(220, ta.scrollHeight) + 'px'; };
      ta.onkeydown = function (e) { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !go.disabled) go.click(); };
      go.onclick = function () { var t = ta.value.trim(); if (!t) return; go.disabled = true; go.textContent = 'Enviando…';
        N.comment(a.id, t).then(function () { ta.value = ''; ta.oninput(); CC[a.id] = (CC[a.id] || 0) + 1; load2(); toast('💬 Comentario publicado'); refreshCards(); }, function (e) { toast((e && e.message) || 'No se pudo comentar'); }).then(function () { go.textContent = 'Comentar'; go.disabled = !ta.value.trim(); }); };
      var top = el('div', 'cm-ft'); top.appendChild(avatarOf(me)); top.appendChild(ta); form.appendChild(top); row.appendChild(left); row.appendChild(go); form.appendChild(row); }
    function load2() { list.innerHTML = ''; list.appendChild(el('div', 'cm-ld', 'Cargando comentarios…'));
      N.comments(a.id).then(function (r) { var L = r.data || []; CC[a.id] = L.length; cnt.textContent = L.length ? String(L.length) : ''; if (onCount) onCount(L.length); list.innerHTML = '';
        if (!L.length) { list.appendChild(el('div', 'cm-e', 'Nadie ha comentado todavía. ¡Abre el debate!')); return; }
        L.slice().reverse().forEach(function (c, i) { var it = el('div', 'cm' + (c.mine ? ' me' : '')); it.style.animationDelay = Math.min(i, 8) * 40 + 'ms'; it.appendChild(avatarOf(c)); var bx = el('div', 'cm-b'), h = el('div', 'cm-h');
          h.appendChild(el('b', null, c.name || 'Usuario')); if (c.mine) h.appendChild(el('span', 'cm-yo', 'Tú')); h.appendChild(el('small', null, N.ago ? N.ago(c.created_at) : '')); bx.appendChild(h); bx.appendChild(el('p', null, c.body));
          if (c.mine || ME && ME.role === 'admin') { var d = el('button', 'cm-del', 'Borrar'); d.type = 'button'; d.onclick = function () { if (d.dataset.k !== '1') { d.dataset.k = '1'; d.textContent = '¿Seguro?'; setTimeout(function () { d.dataset.k = ''; d.textContent = 'Borrar'; }, 3000); return; }
            N.uncomment(c.id).then(function () { toast('Comentario borrado'); load2(); refreshCards(); }, function () { toast('No se pudo borrar'); }); }; h.appendChild(d); }
          it.appendChild(bx); list.appendChild(it); }); }, function () { list.innerHTML = ''; list.appendChild(el('div', 'cm-e', 'No pudimos cargar los comentarios.')); }); }
    drawForm(); load2(); w.redraw = drawForm; return w; }
  var curBar = null;
  function refreshCards() { drawHead(); drawTop(); [].forEach.call(document.querySelectorAll('.pst'), function (p) { var a = ALL.filter(function (x) { return x.id === Number(p.dataset.id); })[0], o = p.querySelector('.pst-st'); if (a && o) o.replaceWith(stats(a)); var rb = p.querySelector('.rbtn'); if (rb && rb.repaint) rb.repaint(); }); }
  // ---------- lector ----------
  function close() { var o = $('.rov'); if (!o) return; o.classList.remove('show'); document.documentElement.style.overflow = ''; openId = null; curBar = null; document.title = 'Magna Arena · Noticias'; if (location.hash) history.replaceState(null, '', location.pathname + location.search); setTimeout(function () { o.remove(); }, 250); }
  function open(id) {
    var a = ALL.filter(function (x) { return x.id === id; })[0]; if (!a) return; var old = $('.rov'); if (old) old.remove();
    openId = id; if (location.hash !== '#n-' + id) history.replaceState(null, '', '#n-' + id);
    var ov = el('div', 'rov'), ar = el('article', 'art'), pg = el('div', 'rpg'), pgi = el('i'); pg.appendChild(pgi); ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', a.title); ov.appendChild(pg); ov.appendChild(ar); ar.style.setProperty('--c', N.cat(a.category).color);
    var cv = el('div', 'cov'); cover(a, cv); var x = el('button', 'x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Cerrar'); x.onclick = close; ar.appendChild(x); ar.appendChild(cv);
    var ab = el('div', 'ab'); ab.appendChild(who(a, true)); var mt = el('div', 'meta'); mt.appendChild(chip(a)); mt.appendChild(el('span', null, N.fdate(a.publish_at, true))); mt.appendChild(rt(a)); if (a.featured) mt.appendChild(el('span', 'ft-s', '★ Destacada')); ab.appendChild(mt);
    ab.appendChild(el('h1', null, a.title)); if (a.summary) ab.appendChild(el('p', 'lead', a.summary));
    var body = el('div', 'body'); body.innerHTML = N.render(a.body); ab.appendChild(body);
    curBar = reactBar(a); ab.appendChild(curBar); ab.appendChild(el('p', 'rx-note', 'Una reacción por persona. Puedes cambiarla o quitarla cuando quieras.'));
    ab.appendChild(commentsBox(a));
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
  function loadCC() { return N.commentCounts(ALL.map(function (a) { return a.id; })).then(function (r) { CC = {}; (r.data || []).forEach(function (x) { CC[x.article_id] = x.total; }); }, function () {}); }
  N.myTeam().then(function (t) { if (t) { MYTEAM = t; if (ALL.length) drawGrid(); } });
  if (window.ACCOUNTS && ACCOUNTS.me) ACCOUNTS.me().then(function (a) { ME = a || null; var b = $('.cms'); if (b && b.redraw) b.redraw(); }, function () {});
  function load() {
    return N.listPublic().then(function (r) { if (r.error) throw r.error; ALL = r.data || []; return Promise.all([loadTotals(), loadCC(), N.mine().then(function (m) { MINE = m; }, function () {})]); })
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
