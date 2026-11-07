'use strict';
(function () {
  var N = window.NEWS, $ = function (s, r) { return (r || document).querySelector(s); };
  var ALL = [], TOT = {}, MINE = {}, cat = 'all', q = '', shown = 12, openId = null, busy = {};
  var ICON = { share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.4 1.8 2.2 1.2 1.1 2.2 1.4 2.5 1.6.3.1.5.1.7-.1l.9-1.1c.2-.3.4-.2.7-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3z"/></svg>' };
  function toast(m) { var t = $('#toast2'); t.textContent = m; t.classList.add('on'); clearTimeout(toast.i); toast.i = setTimeout(function () { t.classList.remove('on'); }, 2400); }
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function cover(a, wrap) { if (a.cover_url) { var im = el('img'); im.src = a.cover_url; im.alt = ''; im.loading = 'lazy'; im.decoding = 'async'; wrap.appendChild(im); } else { var bg = el('div', 'bg'); bg.style.setProperty('--c', N.cat(a.category).color); wrap.appendChild(bg); } return wrap; }
  function chip(a) { var c = N.cat(a.category), s = el('span', 'chipc', c.name); s.style.setProperty('--c', c.color); return s; }
  function summary(id) { var t = TOT[id] || {}, l = N.REACT.map(function (r) { return [r, t[r[0]] || 0]; }).filter(function (x) { return x[1] > 0; }).sort(function (a, b) { return b[1] - a[1]; }), n = l.reduce(function (s, x) { return s + x[1]; }, 0), w = el('span', 'rsum');
    if (!n) { w.textContent = 'Reacciona'; return w; } var em = el('span'); l.slice(0, 3).forEach(function (x) { em.appendChild(el('em', null, x[0][1])); }); w.appendChild(em); w.appendChild(document.createTextNode(' ' + n)); return w; }
  function link(a) { return location.origin + location.pathname + '#n-' + a.id; }
  function share(a) { var url = link(a), data = { title: a.title, text: a.summary || a.title, url: url };
    if (navigator.share) return navigator.share(data).catch(function () {});
    copy(url); }
  function copy(url) { (navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(url) : Promise.reject()).then(function () { toast('Enlace copiado'); }, function () { prompt('Copia el enlace:', url); }); }
  // ---------- listado ----------
  function visible() { return ALL.filter(function (a) { return (cat === 'all' || a.category === cat) && (!q || (a.title + ' ' + a.summary + ' ' + a.body).toLowerCase().indexOf(q) >= 0); }); }
  function card(a, i) {
    var c = el('article', 'nc'); c.style.animationDelay = Math.min(i, 9) * 50 + 'ms';
    var im = el('button', 'im'); im.type = 'button'; im.setAttribute('aria-label', 'Leer: ' + a.title); cover(a, im); im.appendChild(chip(a)); im.onclick = function () { open(a.id); }; c.appendChild(im);
    var bd = el('div', 'bd'), mt = el('div', 'meta'); mt.appendChild(el('span', null, N.fdate(a.publish_at))); if (a.featured) mt.appendChild(el('span', null, '★ Destacada')); bd.appendChild(mt);
    var h3 = el('h3'), tb = el('button', null, a.title); tb.type = 'button'; tb.onclick = function () { open(a.id); }; h3.appendChild(tb); bd.appendChild(h3);
    if (a.summary) bd.appendChild(el('p', null, a.summary));
    var ft = el('div', 'ft'); ft.appendChild(summary(a.id)); var r = el('div'); r.style.cssText = 'display:flex;gap:8px;align-items:center'; var sb = el('button', 'shb'); sb.type = 'button'; sb.setAttribute('aria-label', 'Compartir'); sb.innerHTML = ICON.share; sb.onclick = function () { share(a); }; r.appendChild(sb); var rd = el('button', 'rd', 'Leer noticia →'); rd.type = 'button'; rd.onclick = function () { open(a.id); }; r.appendChild(rd); ft.appendChild(r); bd.appendChild(ft);
    c.appendChild(bd); return c;
  }
  function drawFeat() {
    var f = ALL.filter(function (a) { return a.featured; }).slice(0, 3), w = $('#featWrap'), g = $('#feat'); g.innerHTML = ''; w.hidden = !f.length; if (!f.length) return;
    function fc(a, big) { var b = el('button', 'fc' + (big ? ' big' : '')); b.type = 'button'; cover(a, b); b.appendChild(el('span', 'star', '★ Destacada')); var inn = el('div', 'in'); inn.appendChild(chip(a)); inn.appendChild(el('h3', null, a.title)); if (a.summary && big) inn.appendChild(el('p', null, a.summary)); var mt = el('div', 'meta'); mt.appendChild(el('span', null, N.fdate(a.publish_at))); mt.appendChild(summary(a.id)); inn.appendChild(mt); b.appendChild(inn); b.onclick = function () { open(a.id); }; return b; }
    g.appendChild(fc(f[0], true)); if (f.length > 1) { var sd = el('div', 'side'); f.slice(1).forEach(function (a) { sd.appendChild(fc(a, false)); }); g.appendChild(sd); } else g.style.gridTemplateColumns = '1fr';
  }
  function drawFilters() { var w = $('#ftr'); w.innerHTML = ''; [['all', 'Todas', '#9aa0b8']].concat(N.CATS).forEach(function (c) { var n = c[0] === 'all' ? ALL.length : ALL.filter(function (a) { return a.category === c[0]; }).length; if (c[0] !== 'all' && !n) return;
    var b = el('button', 'chip' + (cat === c[0] ? ' on' : '')); b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', cat === c[0]); b.style.setProperty('--c', c[2]); b.appendChild(el('i')); b.appendChild(document.createTextNode(c[1])); b.appendChild(el('b', null, n)); b.onclick = function () { cat = c[0]; shown = 12; drawFilters(); drawGrid(); }; w.appendChild(b); }); }
  function drawGrid() { var g = $('#grid'); g.innerHTML = ''; var l = visible();
    if (!l.length) { var e = el('div', 'empty2'); e.style.gridColumn = '1/-1'; e.appendChild(el('b', null, ALL.length ? 'No hay noticias con ese filtro' : 'Todavía no hay noticias')); e.appendChild(document.createTextNode(ALL.length ? 'Prueba otra categoría o búsqueda.' : 'Muy pronto publicaremos las primeras novedades de la comunidad.')); g.appendChild(e); $('#more').hidden = true; return; }
    l.slice(0, shown).forEach(function (a, i) { g.appendChild(card(a, i)); }); $('#more').hidden = l.length <= shown; }
  $('#more').onclick = function () { shown += 12; drawGrid(); };
  $('#q').addEventListener('input', function (e) { q = e.target.value.trim().toLowerCase(); shown = 12; drawGrid(); });
  function drawAll() { drawFeat(); drawFilters(); drawGrid(); }
  // ---------- reacciones ----------
  function reactBar(a) {
    var w = el('div', 'rx-wrap'); w.appendChild(el('h4', null, '¿Qué te pareció?')); var rs = el('div', 'rxs'); w.appendChild(rs);
    function paint() { rs.innerHTML = ''; N.REACT.forEach(function (r) { var b = el('button', 'rx' + (MINE[a.id] === r[0] ? ' on' : '')); b.type = 'button'; b.title = r[2]; b.setAttribute('aria-pressed', MINE[a.id] === r[0]); b.setAttribute('aria-label', r[2] + ': ' + ((TOT[a.id] || {})[r[0]] || 0));
      b.appendChild(el('span', 'e', r[1])); b.appendChild(el('span', 'n', (TOT[a.id] || {})[r[0]] || 0)); b.disabled = !!busy[a.id];
      b.onclick = function () { pick(r[0], b, r[1]); }; rs.appendChild(b); }); }
    function bump(k, d) { var t = TOT[a.id] = TOT[a.id] || {}; if (k) t[k] = Math.max(0, (t[k] || 0) + d); }
    function pick(k, b, emo) { if (busy[a.id]) return; var cur = MINE[a.id] || null, next = cur === k ? null : k;
      bump(cur, -1); bump(next, 1); MINE[a.id] = next; busy[a.id] = true; paint(); var nb = rs.children[N.REACT.findIndex(function (r) { return r[0] === k; })];
      if (next && nb) { nb.classList.add('pop'); var fl = el('span', 'fly', emo); nb.appendChild(fl); setTimeout(function () { fl.remove(); }, 900); }
      N.react(a.id, k, cur).then(function () { busy[a.id] = false; paint(); refreshCards(); }, function (e) { busy[a.id] = false; bump(next, -1); bump(cur, 1); MINE[a.id] = cur; paint();
        toast(/anonymous|Anonymous sign-ins are disabled|signups/i.test(e && e.message || '') ? 'Las reacciones aún no están activadas.' : 'No se pudo guardar tu reacción. Revisa tu conexión.'); }); }
    paint(); w.repaint = paint; return w;
  }
  var curBar = null;
  function refreshCards() { drawFeat(); drawGrid(); }
  // ---------- lector ----------
  function close() { var o = $('.rov'); if (!o) return; o.classList.remove('show'); document.documentElement.style.overflow = ''; openId = null; curBar = null; if (location.hash) history.replaceState(null, '', location.pathname + location.search); setTimeout(function () { o.remove(); }, 250); }
  function open(id) {
    var a = ALL.filter(function (x) { return x.id === id; })[0]; if (!a) return; var old = $('.rov'); if (old) old.remove();
    openId = id; if (location.hash !== '#n-' + id) history.replaceState(null, '', '#n-' + id);
    var ov = el('div', 'rov'), ar = el('article', 'art'); ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', a.title); ov.appendChild(ar);
    var cv = el('div', 'cov'); cover(a, cv); var x = el('button', 'x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Cerrar'); x.onclick = close; ar.appendChild(x); ar.appendChild(cv);
    var ab = el('div', 'ab'), mt = el('div', 'meta'); mt.appendChild(chip(a)); mt.appendChild(el('span', null, N.fdate(a.publish_at, true))); if (a.featured) mt.appendChild(el('span', null, '★ Destacada')); ab.appendChild(mt);
    ab.appendChild(el('h1', null, a.title)); if (a.summary) ab.appendChild(el('p', 'lead', a.summary));
    var body = el('div', 'body'); body.innerHTML = N.render(a.body); ab.appendChild(body);
    curBar = reactBar(a); ab.appendChild(curBar); ab.appendChild(el('p', 'rx-note', 'Una reacción por persona. Puedes cambiarla o quitarla cuando quieras.'));
    var sh = el('div', 'shr'), b1 = el('button'); b1.type = 'button'; b1.innerHTML = ICON.share + 'Compartir'; b1.onclick = function () { share(a); }; sh.appendChild(b1);
    var wa = el('a'); wa.href = 'https://wa.me/?text=' + encodeURIComponent(a.title + ' ' + link(a)); wa.target = '_blank'; wa.rel = 'noopener'; wa.innerHTML = ICON.wa + 'WhatsApp'; sh.appendChild(wa);
    var b2 = el('button'); b2.type = 'button'; b2.innerHTML = ICON.link + 'Copiar enlace'; b2.onclick = function () { copy(link(a)); }; sh.appendChild(b2); ab.appendChild(sh);
    var rel = ALL.filter(function (y) { return y.id !== a.id && y.category === a.category; }).concat(ALL.filter(function (y) { return y.id !== a.id && y.category !== a.category; })).slice(0, 3);
    if (rel.length) { var rw = el('div', 'rel'); rw.appendChild(el('h4', null, 'Más noticias')); var ls = el('div', 'lst'); rel.forEach(function (y) { var bt = el('button'); bt.type = 'button'; bt.appendChild(cover(y, el('div', 'th'))); var t = el('div'); t.appendChild(el('b', null, y.title)); t.appendChild(el('small', null, N.cat(y.category).name + ' · ' + N.fdate(y.publish_at))); bt.appendChild(t); bt.onclick = function () { open(y.id); ov.scrollTop = 0; }; ls.appendChild(bt); }); rw.appendChild(ls); ab.appendChild(rw); }
    ar.appendChild(ab); document.body.appendChild(ov); document.documentElement.style.overflow = 'hidden';
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
  load().catch(function () { var g = $('#grid'); g.innerHTML = ''; var e = el('div', 'empty2'); e.style.gridColumn = '1/-1'; e.appendChild(el('b', null, 'No pudimos cargar las noticias')); e.appendChild(document.createTextNode('Revisa tu conexión y vuelve a intentarlo.')); var b = el('button', 'rd', 'Reintentar'); b.style.marginTop = '14px'; b.onclick = function () { location.reload(); }; e.appendChild(el('br')); e.appendChild(b); g.appendChild(e); });
  N.isAdmin().then(function (ok) { $('#create').hidden = !ok; });
  window.MAGNA_SB().then(function (sb) {
    var t = null;
    sb.channel('magna-news').on('postgres_changes', { event: '*', schema: 'public', table: 'article_reaction_totals' }, function (p) { var r = p.new && p.new.article_id ? p.new : p.old; if (!r || !r.article_id) return; if (busy[r.article_id]) return;
      (TOT[r.article_id] = TOT[r.article_id] || {})[r.emoji] = p.new && p.new.emoji ? p.new.total : 0; clearTimeout(t); t = setTimeout(function () { if (curBar && openId === r.article_id) curBar.repaint(); refreshCards(); }, 120); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'articles' }, function () { if ($('.newp')) return; var b = el('button', 'newp', 'Hay novedades · Toca para actualizar'); b.onclick = function () { b.remove(); load(); }; document.body.appendChild(b); })
      .subscribe();
  }, function () {});
})();
