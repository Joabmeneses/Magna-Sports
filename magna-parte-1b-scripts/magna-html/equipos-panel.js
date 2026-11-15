'use strict';
// Directorio de equipos: eliges categoría y deslizas de un equipo en un equipo.
// Al tocar la tarjeta del equipo activo se abre su página.
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PAL = ['#ffe59a', '#b6e23a', '#ff7a1a', '#ff4fa3', '#22d3ee', '#a78bfa', '#2ee59d', '#ffd23f'];
  var track = $('#track'), tabs = $('#tabs'), dots = $('#dots'), cat = 0, cur = 0, CATS = [], SIG = '';
  function h(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  function build() {
    var M = window.MAGNA, S = M && M.S; if (!S) return [];
    var done = S.matches.filter(function (m) { return m.status === 'finished'; }), live = {};
    S.matches.forEach(function (m) { if (m.status === 'live') { live[m.home] = 1; live[m.away] = 1; } });
    function table(ids, ms, win) {
      var r = {}; ids.forEach(function (id) { r[id] = { pts: 0, dg: 0, gf: 0 }; });
      ms.forEach(function (m) { if (!r[m.home] || !r[m.away]) return; var a = r[m.home], b = r[m.away]; a.gf += m.hs; b.gf += m.as; a.dg += m.hs - m.as; b.dg += m.as - m.hs; if (m.hs > m.as) a.pts += win; else if (m.as > m.hs) b.pts += win; });
      return ids.slice().sort(function (x, y) { return r[y].pts - r[x].pts || r[y].dg - r[x].dg || r[y].gf - r[x].gf; });
    }
    function form(id) { return done.filter(function (m) { return m.home === id || m.away === id; }).sort(function (a, b) { return String(b.at).localeCompare(String(a.at)); }).slice(0, 4).map(function (m) { return (m.home === id ? m.hs > m.as : m.as > m.hs) ? 'w' : 'l'; }); }
    var all = S.teams.map(function (t) { return t.id; }), cats = [{ id: 'all', name: 'Todos', ty: 'Todos los equipos', ids: table(all, done, 3), c: PAL[0] }];
    S.leagues.concat(S.tournaments).forEach(function (c, i) {
      var ids = (c.teamIds || []).filter(function (id) { return all.indexOf(id) >= 0; }); if (!ids.length) return;
      var isL = S.leagues.indexOf(c) >= 0, win = c.config && c.config.win ? c.config.win : 3;
      cats.push({ id: String(c.id), name: c.name, ty: isL ? 'Liga' : 'Torneo', ids: table(ids, done.filter(function (m) { return m.cid === c.id; }), win), c: PAL[(i + 1) % PAL.length] });
    });
    cats.forEach(function (c) { c.teams = c.ids.map(function (id, k) { var t = M.by ? M.by(S.teams, id) : S.teams.filter(function (x) { return x.id === id; })[0]; return { id: id, n: t ? t.name : '?', pos: k + 1, col: M.teamColor ? M.teamColor(id) : '#8b5cf6', crest: M.crestUrl ? M.crestUrl(id) : null, tr: M.teamTrophies ? M.teamTrophies(id).length : 0, live: !!live[id], f: form(id) }; }); });
        return cats;
  }

  function card(t, i) {
    var a = h('a', 'ex-c'); a.href = 'equipo.html?id=' + encodeURIComponent(t.id); a.style.setProperty('--tc', t.col);
    a.setAttribute('aria-label', t.n + ', puesto ' + t.pos + '. Entrar a la página del equipo');
    if (t.live) a.appendChild(h('span', 'ex-lv', 'En vivo'));
    var cr = h('span', 'ex-cr', t.crest ? null : t.n.slice(0, 2).toUpperCase()); if (t.crest) cr.style.backgroundImage = 'url("' + t.crest + '")'; a.appendChild(cr);
    a.appendChild(h('h2', null, t.n));
    var st = h('div', 'ex-st'); [['#' + t.pos, 'Puesto', ''], [String(t.tr), 'Trofeos', 'g'], [String(t.f.filter(function (x) { return x === 'w'; }).length) + '/' + t.f.length, 'Últimos']].forEach(function (x) { var d = h('div', x[2]); d.appendChild(h('b', null, x[0])); d.appendChild(h('small', null, x[1])); st.appendChild(d); }); a.appendChild(st);
    var fm = h('div', 'ex-fm'); fm.appendChild(document.createTextNode('Forma')); if (!t.f.length) fm.appendChild(document.createTextNode(' · sin partidos')); t.f.forEach(function (x) { fm.appendChild(h('i', x, x === 'w' ? 'V' : 'D')); }); a.appendChild(fm);
    a.appendChild(h('span', 'ex-go', 'Entrar al equipo →'));
    a.addEventListener('click', function (e) {
      if (dragged) { e.preventDefault(); return; }
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      e.preventDefault(); a.classList.add('go'); setTimeout(function () { location.href = a.href; }, RM ? 0 : 180);
    });
    return a;
  }
  function tabsUI() {
    tabs.innerHTML = ''; CATS.forEach(function (c, k) { var b = h('button', 'ex-tab' + (k === cat ? ' on' : '')); b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', k === cat); b.appendChild(document.createTextNode(c.name + ' ')); b.appendChild(h('small', null, String(c.teams.length))); b.onclick = function () { pick(k); }; tabs.appendChild(b); });
  }
  function pick(k, keep) {
    cat = k; store('magna_eqcat', CATS[k].id); $$('.ex-tab', tabs).forEach(function (b, j) { b.classList.toggle('on', j === k); b.setAttribute('aria-selected', j === k); if (j === k) b.scrollIntoView({ block: 'nearest', inline: 'center' }); });
    var c = CATS[k]; track.innerHTML = ''; dots.innerHTML = '';
    if (!c.teams.length) { track.appendChild(h('div', 'ex-emp', 'Todavía no hay equipos en esta categoría.')); $('#ct').textContent = ''; return; }
    c.teams.forEach(function (t, i) { var a = card(t, i); if (i % 3) a.style.scrollSnapAlign = 'none'; a.style.setProperty('--d', (i % P) * 70 + 'ms'); track.appendChild(a); });
    for (var p = 0; p < pages(); p++) (function (p) { var d = h('button'); d.type = 'button'; d.setAttribute('aria-label', 'Ver grupo ' + (p + 1)); d.onclick = function () { go(p); }; dots.appendChild(d); })(p);
    var p0 = keep ? Math.max(0, Math.min(cur, pages() - 1)) : 0; cur = -1; jump(p0); mark(p0);
  }
  function render(force) {
    var nc = build(), sig = JSON.stringify(nc.map(function (c) { return [c.id, c.name, c.teams]; })); if (!force && sig === SIG) return; SIG = sig;
    var was = CATS[cat] && CATS[cat].id; CATS = nc;
    if (!CATS.length) { track.innerHTML = ''; track.appendChild(h('div', 'ex-emp', 'Todavía no hay equipos registrados.')); return; }
    var want = force ? store('magna_eqcat') : was, k = CATS.findIndex(function (c) { return c.id === want; });
    cat = k < 0 ? 0 : k; tabsUI(); pick(cat, !force);
  }
  var P = 3;
  function pages() { return Math.ceil(track.children.length / P); }
  function off(p) { var c = track.children[p * P], f = track.firstElementChild; return c && f ? Math.min(c.offsetLeft - f.offsetLeft, track.scrollWidth - track.clientWidth) : 0; }
  function jump(p) { var b = track.style.scrollBehavior; track.style.scrollBehavior = 'auto'; track.scrollLeft = off(p); track.style.scrollBehavior = b; }
  function go(p) { var n = pages(); if (!n) return; p = Math.max(0, Math.min(n - 1, p)); track.scrollTo({ left: off(p), behavior: RM ? 'auto' : 'smooth' }); mark(p); }
  function mark(p) {
    if (p === cur) return; cur = p; var n = pages(), t = track.children.length;
    $$('button', dots).forEach(function (b, k) { b.classList.toggle('on', k === p); });
    $('#pv').disabled = p <= 0; $('#nx').disabled = p >= n - 1; var a0 = Math.min(p * P, Math.max(0, t - P)); $('#ct').textContent = (a0 + 1) + '–' + Math.min(t, a0 + P) + ' de ' + t;
    dots.hidden = n < 2; $('#pv').hidden = $('#nx').hidden = n < 2;
  }
  var st = null; track.addEventListener('scroll', function () { if (st) cancelAnimationFrame(st); st = requestAnimationFrame(function () { var best = 0, bd = 1e9; for (var p = 0; p < pages(); p++) { var d = Math.abs(off(p) - track.scrollLeft); if (d < bd) { bd = d; best = p; } } mark(best); }); }, { passive: true });
  $('#pv').onclick = function () { go(cur - 1); }; $('#nx').onclick = function () { go(cur + 1); };
  addEventListener('keydown', function (e) { if (e.target.closest && e.target.closest('input')) return; if (e.key === 'ArrowRight') go(cur + 1); else if (e.key === 'ArrowLeft') go(cur - 1); });
  addEventListener('resize', function () { jump(cur); });

  // arrastrar con el ratón (en el móvil ya se desliza con el dedo)
  var down = false, dragged = false, sx = 0, sl = 0;
  track.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse' || e.button) return; down = true; dragged = false; sx = e.clientX; sl = track.scrollLeft; });
  addEventListener('pointermove', function (e) { if (!down) return; var d = e.clientX - sx; if (!dragged && Math.abs(d) > 6) { dragged = true; track.style.scrollSnapType = 'none'; track.style.scrollBehavior = 'auto'; } if (dragged) { e.preventDefault(); track.scrollLeft = sl - d; } });
  addEventListener('pointerup', function (e) { if (!down) return; down = false; if (!dragged) return; var d = e.clientX - sx; track.style.scrollSnapType = ''; track.style.scrollBehavior = ''; go(Math.abs(d) > 50 ? cur + (d < 0 ? 1 : -1) : cur); setTimeout(function () { dragged = false; }, 60); });
  track.addEventListener('dragstart', function (e) { e.preventDefault(); });

  render(true);
  var rt = null; addEventListener('magna:update', function () { clearTimeout(rt); rt = setTimeout(function () { render(false); }, 300); });
})();
