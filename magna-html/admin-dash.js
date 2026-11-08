'use strict';
// Resumen del panel de administración: portada, noticias, indicadores, gráficas interactivas, próximos, acciones y actividad.
// Todo se calcula con los datos reales del sitio (MAGNA.S) y, cuando hay sesión, con las cuentas (admin_accounts).
window.ADMIN_DASH = function (b, A) {
  var h = A.h, S = MAGNA.S, NS = 'http://www.w3.org/2000/svg', DAY = 864e5, NOW = Date.now(), ACC = null;
  function T(at) { var t = Date.parse(String(at || '').replace(' ', 'T') + 'Z'); return isNaN(t) ? null : t; }
  function endT(m) { return T(m.ended) || T(m.at); }
  function fmt(n) { return String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function svg(tag, at) { var e = document.createElementNS(NS, tag); for (var k in at) e.setAttribute(k, at[k]); return e; }
  function card(cls, title, extra) { var c = h('section', 'dc ' + (cls || '')), hd = h('div', 'dc-h'); if (title) hd.appendChild(h('h3', null, title)); if (extra) hd.appendChild(extra); c.appendChild(hd); return c; }
  function seg(opts, cur, on) { var w = h('div', 'dseg'); opts.forEach(function (o) { var x = h('button', o[0] === cur ? 'on' : null, o[1]); x.type = 'button'; x.onclick = function () { w.querySelectorAll('button').forEach(function (y) { y.classList.remove('on'); }); x.classList.add('on'); on(o[0]); }; w.appendChild(x); }); return w; }
  function ago(t) { var m = Math.round((NOW - t) / 6e4); return m < 1 ? 'ahora' : m < 60 ? 'hace ' + m + ' min' : m < 1440 ? 'hace ' + Math.round(m / 60) + ' h' : m < 2880 ? 'ayer' : new Date(t).toLocaleDateString('es', { day: 'numeric', month: 'short' }); }
  var tip = document.querySelector('.dtip') || document.body.appendChild(h('div', 'dtip'));
  function showTip(e, html) { tip.innerHTML = html; tip.style.display = 'block'; var x = Math.min(innerWidth - tip.offsetWidth - 8, e.clientX + 14), y = e.clientY - tip.offsetHeight - 12; tip.style.left = Math.max(8, x) + 'px'; tip.style.top = (y < 8 ? e.clientY + 18 : y) + 'px'; }
  function hideTip() { tip.style.display = 'none'; }
  var fin = S.matches.filter(function (m) { return m.status === 'finished' && m.hs != null; }), live = S.matches.filter(function (m) { return m.status === 'live'; }),
    sch = S.matches.filter(function (m) { return m.status === 'scheduled'; }).sort(function (a, c) { return String(a.at || '9').localeCompare(String(c.at || '9')); });
  function weekly(fn, n) { var out = []; for (var i = n - 1; i >= 0; i--) { var a = NOW - (i + 1) * 7 * DAY, z = NOW - i * 7 * DAY; out.push(fn(a, z)); } return out; }
  function finIn(a, z) { return fin.filter(function (m) { var t = endT(m); return t != null && t > a && t <= z; }); }
  function goals(L) { return L.reduce(function (s, m) { return s + (Number(m.hs) || 0) + (Number(m.as) || 0); }, 0); }

  // ---------- portada ----------
  var top = h('div', 'dtop'), hero = h('section', 'dhero'), hl = h('div', 'dh-l');
  hl.appendChild(h('div', 'dh-ey', 'Panel de control')); var h1 = h('h1'); h1.appendChild(h('span', null, 'MAGNA')); h1.appendChild(h('span', 'g', 'ARENA')); hl.appendChild(h1); hl.appendChild(h('div', 'dh-sub', 'La casa de Magna Sports')); hl.appendChild(h('p', null, 'Partidos, torneos, jugadores y Bits. Todo lo que manejas, en un solo lugar.'));
  var ch = h('div', 'dh-ch'); ['Competencia', 'Comunidad', 'Diversión'].forEach(function (t) { ch.appendChild(h('span', null, t)); }); hl.appendChild(ch); hero.appendChild(hl);
  var mf = h('div', 'dh-mf'), mas = h('img', 'dh-mas'); mas.src = 'mascota/celebrando.webp'; mas.alt = ''; mas.onerror = function () { mf.remove(); }; mf.appendChild(mas); hero.appendChild(mf);
  for (var i = 0; i < 10; i++) { var sp = h('i', 'dh-sp'); sp.style.left = (8 + i * 9) + '%'; sp.style.top = (12 + (i * 37) % 70) + '%'; sp.style.animationDelay = (i * .35) + 's'; hero.appendChild(sp); }
  var stk = h('div', 'dh-stk'); stk.appendChild(h('small', null, live.length ? 'En vivo' : 'Jugados')); stk.appendChild(h('b', null, String(live.length || fin.length))); stk.appendChild(h('small', null, live.length ? (live.length === 1 ? 'partido' : 'partidos') : 'partidos')); hero.appendChild(stk);
  var scr = h('div', 'dh-scr', 'Compite.\nGana.\nPresume.'); hero.appendChild(scr);
  top.appendChild(hero);
  var gr = h('section', 'dgreet'), hr = new Date().getHours(), who = (window.MAGNA_ADMIN && MAGNA_ADMIN.email || 'admin').split('@')[0];
  var d0 = h('div', 'dg-d'); d0.appendChild(A.icon('cal')); d0.appendChild(h('span', null, new Date().toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }))); gr.appendChild(d0);
  gr.appendChild(h('p', null, hr < 12 ? 'Buenos días,' : hr < 19 ? 'Buenas tardes,' : 'Buenas noches,')); gr.appendChild(h('b', 'dg-n', who.charAt(0).toUpperCase() + who.slice(1)));
  gr.appendChild(h('small', null, 'Administrador · Magna Sports')); var lg = h('div', 'dg-lg'), li = h('img'); li.src = 'logo-sm.png'; li.alt = ''; lg.appendChild(li); lg.appendChild(h('span', null, 'Juntos competimos')); gr.appendChild(lg);
  top.appendChild(gr); b.appendChild(top);

  // ---------- noticias en movimiento ----------
  var NW = (S.news || []).slice(0, 8), tk = h('div', 'dtick'), tb = h('span', 'dt-b'); tb.appendChild(A.icon('news')); tb.appendChild(h('span', null, 'Últimas noticias')); tk.appendChild(tb);
  var vp = h('div', 'dt-v'), rail = h('div', 'dt-r'); vp.appendChild(rail); tk.appendChild(vp);
  var KT = { result: ['Resultado', 'g'], goal: ['Gol', 'g'], transfer: ['Fichaje', 'p'], announcement: ['Aviso', 'b'], tournament_bracket: ['Torneo', 'y'], mvp: ['MVP', 'y'] };
  if (!NW.length) rail.appendChild(h('span', 'dt-i', 'Todavía no hay actividad. ¡Programa el primer partido!'));
  NW.forEach(function (n) { var it = h('button', 'dt-i'); it.type = 'button'; it.appendChild(h('span', null, n.text)); var t = T(n.at), k = KT[n.kind] || ['Info', 'b']; it.appendChild(h('em', 't-' + (t && NOW - t < DAY ? 'n' : k[1]), t && NOW - t < DAY ? 'Nuevo' : k[0])); it.onclick = function () { A.go('actividad'); }; rail.appendChild(it); });
  var nav = h('div', 'dt-n'), pv = h('button', null, '‹'), nx = h('button', null, '›'); pv.type = nx.type = 'button'; pv.setAttribute('aria-label', 'Anterior'); nx.setAttribute('aria-label', 'Siguiente');
  pv.onclick = function () { vp.scrollBy({ left: -vp.clientWidth * .7, behavior: 'smooth' }); }; nx.onclick = function () { vp.scrollBy({ left: vp.clientWidth * .7, behavior: 'smooth' }); }; nav.appendChild(pv); nav.appendChild(nx); tk.appendChild(nav); b.appendChild(tk);
  var auto = setInterval(function () { if (!document.body.contains(vp)) return clearInterval(auto); if (tk.matches(':hover')) return; if (vp.scrollLeft + vp.clientWidth >= vp.scrollWidth - 4) vp.scrollTo({ left: 0, behavior: 'smooth' }); else vp.scrollBy({ left: 240, behavior: 'smooth' }); }, 3500);

  // ---------- en vivo ----------
  if (live.length) { var lw = h('section', 'dlive'); lw.appendChild(h('span', 'dl-t', '● EN VIVO AHORA'));
    live.forEach(function (m) { var r = h('div', 'dl-m'); r.appendChild(M.crest(m.home, MAGNA.teamName(m.home), 34)); r.appendChild(h('b', null, MAGNA.teamName(m.home))); r.appendChild(h('span', 'dlv-s', (m.hs || 0) + ' - ' + (m.as || 0))); r.appendChild(h('b', null, MAGNA.teamName(m.away))); r.appendChild(M.crest(m.away, MAGNA.teamName(m.away), 34));
      r.appendChild(A.btn('Manejar partido', function () { A.setLive(m.id); A.go('vivo'); }, 'o')); lw.appendChild(r); }); b.appendChild(lw); }

  // ---------- indicadores ----------
  var kg = h('div', 'dkpi');
  function spark(vals, col) { var w = 120, hh = 40, mx = Math.max.apply(null, vals.concat([1])), s = svg('svg', { viewBox: '0 0 ' + w + ' ' + hh, class: 'dk-sp', preserveAspectRatio: 'none' }), pts = vals.map(function (v, i) { return [i / (vals.length - 1 || 1) * w, hh - 4 - v / mx * (hh - 10)]; });
    var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' '), g = svg('linearGradient', { id: 'sg' + col.slice(1), x1: 0, x2: 0, y1: 0, y2: 1 });
    g.appendChild(svg('stop', { offset: '0', 'stop-color': col, 'stop-opacity': '.45' })); g.appendChild(svg('stop', { offset: '1', 'stop-color': col, 'stop-opacity': '0' })); var df = svg('defs', {}); df.appendChild(g); s.appendChild(df);
    s.appendChild(svg('path', { d: d + ' L' + w + ' ' + hh + ' L0 ' + hh + ' Z', fill: 'url(#sg' + col.slice(1) + ')' })); s.appendChild(svg('path', { d: d, fill: 'none', stroke: col, 'stroke-width': 2.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', class: 'dk-ln' })); return s; }
  function kpi(c, ic, val, label, delta, sub, vals, go) { var k = h('button', 'dk dk-' + c); k.type = 'button'; var hd = h('div', 'dk-t'), ib = h('span', 'dk-i'); k.appendChild(h('span', 'dk-n', String(kg.children.length + 1).padStart(2, '0'))); ib.appendChild(A.icon(ic)); hd.appendChild(ib); hd.appendChild(h('small', null, label)); k.appendChild(hd);
    var vb = h('b', 'dk-v', '0'); k.appendChild(vb); A.countUp(vb, val); var ft = h('div', 'dk-f'); if (delta != null) ft.appendChild(h('span', 'dk-d ' + (delta > 0 ? 'up' : delta < 0 ? 'dn' : ''), (delta > 0 ? '↗ +' : delta < 0 ? '↘ ' : '→ ') + delta)); ft.appendChild(h('span', null, sub)); k.appendChild(ft);
    var mxv = Math.max.apply(null, vals.concat([1])), lastv = vals[vals.length - 1] || 0, pc = Math.round(lastv / mxv * 100), bar = h('div', 'dk-bar'); for (var q = 0; q < 10; q++) { var sg2 = h('i'); if (q < Math.round(pc / 10)) sg2.className = 'on'; sg2.style.transitionDelay = q * 40 + 'ms'; bar.appendChild(sg2); } k.appendChild(bar);
    k.appendChild(spark(vals, { b: '#c6ff1a', g: '#2ee59d', p: '#ff7a1a', o: '#ffd23f' }[c])); k.onclick = function () { A.go(go); }; kg.appendChild(k); return k; }
  var wk = weekly(function (a, z) { return finIn(a, z); }, 8), wN = wk.map(function (L) { return L.length; }), wG = wk.map(goals);
  var plays = S.players.filter(function (p) { return MAGNA.plays(p); }), d7 = sch.filter(function (m) { var t = T(m.at); return t != null && t > NOW && t < NOW + 7 * DAY; });
  var daily = []; for (var dd = 0; dd < 7; dd++) daily.push(sch.filter(function (m) { var t = T(m.at); return t != null && t >= NOW + dd * DAY && t < NOW + (dd + 1) * DAY; }).length);
  var kP = kpi('b', 'user', plays.length, 'Jugadores', null, S.teams.length + ' equipos', wN.map(function () { return plays.length; }), 'jugadores');
  kpi('g', 'play', fin.length, 'Partidos jugados', wN[7] - wN[6], 'vs. semana pasada', wN, 'partidos');
  kpi('p', 'star', goals(fin), 'Goles marcados', wG[7] - wG[6], 'vs. semana pasada', wG, 'partidos');
  kpi('o', 'cal', d7.length, 'Próximos 7 días', live.length ? live.length : null, live.length ? 'en vivo ahora' : (sch.length + ' programados en total'), daily, 'partidos');
  b.appendChild(kg);

  // ---------- fila de gráficas ----------
  var row = h('div', 'drow r3');
  // dona: partidos por competición
  var KC = [['league', 'Ligas', '#3b82f6'], ['champions', 'Champions', '#22d3ee'], ['mundial', 'Mundial', '#34d399'], ['tournament', 'Torneos', '#fbbf24'], ['friendly', 'Amistosos', '#f472b6']];
  var dn = card('', 'Partidos por competición'), dnb = h('div', 'ddn'); dn.appendChild(dnb);
  dn.querySelector('.dc-h').appendChild(seg([['m', 'Este mes'], ['q', '3 meses'], ['a', 'Todo']], 'a', drawDonut));
  function drawDonut(per) { dnb.innerHTML = ''; var from = per === 'm' ? NOW - 30 * DAY : per === 'q' ? NOW - 90 * DAY : 0, cnt = {}, tot = 0;
    fin.forEach(function (m) { var t = endT(m); if (from && (t == null || t < from)) return; var k = MAGNA.compKind(m); cnt[k] = (cnt[k] || 0) + 1; tot++; });
    var s = svg('svg', { viewBox: '0 0 120 120', class: 'dd-s' }), R = 46, C = 2 * Math.PI * R, off = 0; s.appendChild(svg('circle', { cx: 60, cy: 60, r: R, fill: 'none', stroke: 'rgba(255,255,255,.08)', 'stroke-width': 16 }));
    var lg = h('div', 'dd-l'), arcs = {};
    KC.forEach(function (k, ix) { var v = cnt[k[0]] || 0; if (v) { var len = v / tot * C, a = svg('circle', { cx: 60, cy: 60, r: R, fill: 'none', stroke: k[2], 'stroke-width': 16, 'stroke-dasharray': Math.max(0, len - 1.5) + ' ' + C, 'stroke-dashoffset': -off, transform: 'rotate(-90 60 60)', class: 'dd-a' }); a.style.animationDelay = ix * 90 + 'ms'; off += len; s.appendChild(a); arcs[k[0]] = a;
        a.addEventListener('mousemove', function (e) { showTip(e, '<b>' + k[1] + '</b><br>' + v + ' partidos · ' + Math.round(v / tot * 100) + '%'); }); a.addEventListener('mouseleave', hideTip); }
      var r = h('div', 'dd-r' + (v ? '' : ' z')); var dot = h('i'); dot.style.background = k[2]; r.appendChild(dot); r.appendChild(h('span', null, k[1])); r.appendChild(h('b', null, String(v))); r.appendChild(h('em', null, tot ? Math.round(v / tot * 100) + '%' : '0%'));
      r.onmouseenter = function () { if (arcs[k[0]]) { s.classList.add('foc'); arcs[k[0]].classList.add('on'); } }; r.onmouseleave = function () { s.classList.remove('foc'); if (arcs[k[0]]) arcs[k[0]].classList.remove('on'); }; lg.appendChild(r); });
    var w = h('div', 'dd-w'); w.appendChild(s); var ct = h('div', 'dd-c'); ct.appendChild(h('small', null, 'Total')); ct.appendChild(h('b', null, String(tot))); w.appendChild(ct); dnb.appendChild(w); dnb.appendChild(lg);
    if (!tot) dnb.appendChild(h('p', 'dd-e', 'Sin partidos en este periodo.')); }
  drawDonut('a'); row.appendChild(dn);
  // barras: equipos
  var br = card('', 'Equipos'), brb = h('div', 'dbar'); br.appendChild(brb);
  var PT = MAGNA.teamPoints(), PS = MAGNA.playerStats();
  br.querySelector('.dc-h').appendChild(seg([['pts', 'Ranking'], ['w', 'Victorias'], ['pl', 'Plantilla']], 'pts', drawBars));
  function drawBars(k) { brb.innerHTML = ''; var L = S.teams.map(function (t) { var v = k === 'pts' ? ((PT[t.id] || {}).pts || 0) : k === 'w' ? fin.filter(function (m) { return (m.home === t.id && m.hs > m.as) || (m.away === t.id && m.as > m.hs); }).length : S.players.filter(function (p) { return p.teamId === t.id; }).length; return { t: t, v: v }; })
      .sort(function (a, c) { return c.v - a.v; }).slice(0, 6), mx = Math.max.apply(null, L.map(function (x) { return x.v; }).concat([1])), g = h('div', 'db-g');
    if (!L.length) { brb.appendChild(h('p', 'dd-e', 'Todavía no hay equipos.')); return; }
    L.forEach(function (x, i) { var c = h('a', 'db-c'); c.href = 'equipo.html?id=' + x.t.id; c.target = '_blank'; c.rel = 'noopener'; c.appendChild(h('b', null, k === 'pts' ? (x.v >= 1000 ? (x.v / 1000).toFixed(x.v >= 10000 ? 0 : 1).replace('.', ',') + 'k' : String(x.v)) : String(x.v)));
      var bar = h('span', 'db-b'), col = MAGNA.teamColor(x.t.id); bar.style.setProperty('--h', Math.max(4, x.v / mx * 100) + '%'); bar.style.background = 'linear-gradient(180deg,' + col + ',' + col + '55)'; bar.style.boxShadow = '0 0 18px ' + col + '55'; bar.style.animationDelay = i * 70 + 'ms'; c.appendChild(bar);
      c.appendChild(M.crest(x.t.id, x.t.name, 26)); c.appendChild(h('small', null, x.t.name)); c.title = x.t.name + ': ' + fmt(x.v); g.appendChild(c); }); brb.appendChild(g); }
  drawBars('pts'); row.appendChild(br);
  // actividad reciente
  var ac = card('', 'Actividad reciente'), va = h('button', 'dc-a', 'Ver todo'); va.type = 'button'; va.onclick = function () { A.go('actividad'); }; ac.querySelector('.dc-h').appendChild(va);
  var IKN = { result: ['✔', '#34d399'], goal: ['⚽', '#34d399'], transfer: ['⇄', '#c084fc'], announcement: ['📢', '#60a5fa'], tournament_bracket: ['🏆', '#fbbf24'], mvp: ['⭐', '#fbbf24'] }, fl = h('div', 'dact');
  (S.news || []).slice(0, 6).forEach(function (n) { var r = h('div', 'da-r'), k = IKN[n.kind] || ['•', '#94a3b8'], ic = h('span', 'da-i', k[0]); ic.style.background = k[1] + '33'; ic.style.color = k[1]; ic.style.boxShadow = 'inset 0 0 0 1px ' + k[1] + '66'; r.appendChild(ic); r.appendChild(h('p', null, n.text)); var t = T(n.at); r.appendChild(h('time', null, t ? ago(t) : '')); fl.appendChild(r); });
  if (!fl.children.length) fl.appendChild(h('p', 'dd-e', 'Todavía no hay actividad.')); ac.appendChild(fl); row.appendChild(ac);
  b.appendChild(row);

  // ---------- próximos, acciones y tendencia ----------
  var row2 = h('div', 'drow r3');
  var up = card('', 'Próximos'), vu = h('button', 'dc-a', 'Ver todo'); vu.type = 'button'; vu.onclick = function () { A.go('partidos'); }; up.querySelector('.dc-h').appendChild(vu);
  var EVT = { torneo: ['Torneo', 'y'], amistoso: ['Amistoso', 'p'], especial: ['Especial', 'p'], stream: ['Stream', 'b'], premio: ['Premiación', 'y'], comunidad: ['Comunidad', 'g'] };
  var items = sch.filter(function (m) { var t = T(m.at); return t == null || t > NOW - 3 * 3600e3; }).map(function (m) { return { t: T(m.at), m: m }; }).concat((S.events || []).filter(function (e) { var t = T(e.at); return t && t > NOW - 3 * 3600e3; }).map(function (e) { return { t: T(e.at), e: e }; }))
    .sort(function (a, c) { return (a.t || 9e15) - (c.t || 9e15); }).slice(0, 4), ul = h('div', 'dup');
  items.forEach(function (x) { var r = h('button', 'du-r'); r.type = 'button'; var dt = h('div', 'du-d'), dte = x.t ? new Date(x.t) : null; dt.appendChild(h('b', null, dte ? String(dte.getDate()) : '—')); dt.appendChild(h('small', null, dte ? dte.toLocaleDateString('es', { month: 'short' }).replace('.', '') : 'sin fecha')); r.appendChild(dt);
    var w = h('div', 'du-w'); if (x.m) { w.appendChild(h('b', null, MAGNA.teamName(x.m.home) + ' vs ' + MAGNA.teamName(x.m.away))); w.appendChild(h('small', null, (dte ? dte.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) + ' · ' : '') + A.compName(x.m))); } else { w.appendChild(h('b', null, x.e.title)); w.appendChild(h('small', null, (dte ? dte.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : '') + (x.e.place ? ' · ' + x.e.place : ''))); } r.appendChild(w);
    var k = x.m ? ['Partido', 'g'] : (EVT[x.e.kind] || ['Evento', 'b']); r.appendChild(h('em', 'du-t t-' + k[1], k[0])); r.onclick = function () { if (x.m) { A.setLive(x.m.id); A.go('vivo'); } else A.go('eventos'); }; ul.appendChild(r); });
  if (!items.length) { ul.appendChild(h('p', 'dd-e', 'No hay nada programado.')); ul.appendChild(A.btn('+ Programar partido', function () { A.go('partidos'); }, 'o')); }
  up.appendChild(ul); row2.appendChild(up);
  var qa = card('', 'Acciones rápidas'), qg = h('div', 'dqa');
  [['user', 'Registrar jugador', 'form:player', '#3b82f6'], ['cal', 'Programar partido', 'form:match', '#10b981'], ['shield', 'Registrar equipo', 'form:team', '#f97316'], ['live', 'Narrar en vivo', 'vivo', '#ef4444'], ['news', 'Crear noticia', 'noticias', '#a855f7'], ['star', 'Tienda', 'tienda', '#ec4899'], ['cup', 'Balón de Oro', 'balon', '#eab308'], ['up', 'Respaldos', 'datos', '#06b6d4']].forEach(function (x) {
    var a = h('button', 'dq'); a.type = 'button'; var ic = h('span', 'dq-i'); ic.style.setProperty('--c', x[3]); ic.appendChild(A.icon(x[0])); a.appendChild(ic); a.appendChild(h('span', null, x[1])); a.onclick = function () { if (/^form:/.test(x[2]) && A.form) A.form(x[2].slice(5)); else A.go(x[2]); }; qg.appendChild(a); });
  qa.appendChild(qg); row2.appendChild(qa);
  // tendencia: líneas por mes
  var tr = card('', 'Tendencia · 6 meses'), trb = h('div', 'dln'); tr.appendChild(trb);
  tr.querySelector('.dc-h').appendChild(seg([['mg', 'Partidos y goles'], ['ac', 'Cuentas nuevas']], 'mg', drawLine));
  function months() { var L = [], d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); for (var i = 5; i >= 0; i--) { var a = new Date(d.getFullYear(), d.getMonth() - i, 1), z = new Date(d.getFullYear(), d.getMonth() - i + 1, 1); L.push({ a: +a, z: +z, n: a.toLocaleDateString('es', { month: 'short' }).replace('.', '') }); } return L; }
  function drawLine(mode) { trb.innerHTML = ''; var MS = months(), SR;
    if (mode === 'ac') { if (!ACC) { trb.appendChild(h('p', 'dd-e', ACC === false ? 'No se pudieron cargar las cuentas.' : 'Cargando cuentas…')); return; }
      SR = [{ n: 'Cuentas nuevas', c: '#c084fc', v: MS.map(function (m) { return ACC.filter(function (x) { var t = Date.parse(x.created_at); return t >= m.a && t < m.z; }).length; }) }]; }
    else SR = [{ n: 'Partidos', c: '#60a5fa', v: MS.map(function (m) { return finIn(m.a, m.z).length; }) }, { n: 'Goles', c: '#34d399', v: MS.map(function (m) { return goals(finIn(m.a, m.z)); }) }];
    var W = 320, H = 150, P = { l: 28, r: 8, t: 10, b: 22 }, mx = Math.max.apply(null, [].concat.apply([4], SR.map(function (s) { return s.v; }))), st = Math.ceil(mx / 4), top = st * 4, s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'dl-s' });
    function X(i) { return P.l + i * (W - P.l - P.r) / (MS.length - 1); } function Y(v) { return H - P.b - v / top * (H - P.t - P.b); }
    for (var g = 0; g <= 4; g++) { var y = Y(g * st); s.appendChild(svg('line', { x1: P.l, x2: W - P.r, y1: y, y2: y, stroke: 'rgba(255,255,255,.08)' })); var tx = svg('text', { x: P.l - 6, y: y + 3, 'text-anchor': 'end', class: 'dl-t' }); tx.textContent = g * st; s.appendChild(tx); }
    MS.forEach(function (m, i) { var tx = svg('text', { x: X(i), y: H - 6, 'text-anchor': 'middle', class: 'dl-t' }); tx.textContent = m.n; s.appendChild(tx); });
    SR.forEach(function (sr) { var d = sr.v.map(function (v, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1); }).join(' '); var p = svg('path', { d: d, fill: 'none', stroke: sr.c, 'stroke-width': 2.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', class: 'dl-p' }); s.appendChild(p);
      sr.v.forEach(function (v, i) { s.appendChild(svg('circle', { cx: X(i), cy: Y(v), r: 3.4, fill: '#0b1238', stroke: sr.c, 'stroke-width': 2 })); }); });
    var gl = svg('line', { y1: P.t, y2: H - P.b, stroke: 'rgba(255,255,255,.35)', 'stroke-dasharray': '3 3', class: 'dl-g' }); s.appendChild(gl);
    var hit = svg('rect', { x: P.l, y: 0, width: W - P.l - P.r, height: H, fill: 'transparent' }); s.appendChild(hit);
    hit.addEventListener('mousemove', function (e) { var r = s.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W, i = Math.max(0, Math.min(MS.length - 1, Math.round((x - P.l) / ((W - P.l - P.r) / (MS.length - 1))))); gl.setAttribute('x1', X(i)); gl.setAttribute('x2', X(i)); gl.style.opacity = 1;
      showTip(e, '<b>' + MS[i].n + '</b>' + SR.map(function (sr) { return '<br><i style="background:' + sr.c + '"></i>' + sr.n + ': ' + sr.v[i]; }).join('')); });
    hit.addEventListener('mouseleave', function () { gl.style.opacity = 0; hideTip(); });
    var lg = h('div', 'dl-l'); SR.forEach(function (sr) { var x = h('span'), d2 = h('i'); d2.style.background = sr.c; x.appendChild(d2); x.appendChild(document.createTextNode(sr.n + ' · ' + sr.v.reduce(function (a, c) { return a + c; }, 0))); lg.appendChild(x); }); trb.appendChild(lg); trb.appendChild(s); }
  drawLine('mg'); row2.appendChild(tr); b.appendChild(row2);

  // ---------- páginas del sitio ----------
  var pgw = card('dpg', 'Tu sitio'), pg = h('div', 'dpg-g');
  [['index.html', 'Partidos', '#ef4444'], ['noticias.html', 'Noticias', '#a855f7'], ['ligas.html', 'Ligas', '#3b82f6'], ['champions.html', 'Champions', '#22d3ee'], ['mundial.html', 'Mundial', '#10b981'], ['ranking.html', 'Ranking', '#f59e0b'], ['equipos.html', 'Equipos', '#ec4899'], ['tienda.html', 'Tienda', '#eab308'], ['eventos.html', 'Eventos', '#8b5cf6'], ['prediccion.html', 'Predicción', '#06b6d4']].forEach(function (p) {
    var a = h('a', 'dp'); a.href = p[0]; a.target = '_blank'; a.rel = 'noopener'; a.style.setProperty('--c', p[2]); a.appendChild(h('span', null, p[1])); a.appendChild(h('em', null, '↗')); pg.appendChild(a); });
  pgw.appendChild(pg); b.appendChild(pgw);

  // cuentas: completan el indicador de jugadores y la tendencia de cuentas nuevas
  if (window.ACCOUNTS && window.MAGNA_ADMIN) ACCOUNTS.list().then(function (L) { ACC = L || [];
    var mo = ACC.filter(function (x) { return Date.parse(x.created_at) > NOW - 30 * DAY; }).length, bits = ACC.reduce(function (s, x) { return s + (Number(x.bits) || 0); }, 0);
    var ft = kP.querySelector('.dk-f'); ft.innerHTML = ''; ft.appendChild(h('span', 'dk-d ' + (mo ? 'up' : ''), (mo ? '↗ +' : '→ ') + mo)); ft.appendChild(h('span', null, 'cuentas este mes · 🪙 ' + fmt(bits) + ' Bits'));
    var sp2 = kP.querySelector('.dk-sp'), wv = weekly(function (a, z) { return ACC.filter(function (x) { var t = Date.parse(x.created_at); return t > a && t <= z; }).length; }, 8); if (sp2) sp2.replaceWith(spark(wv, '#c6ff1a'));
    var cur = tr.querySelector('.dseg .on'); if (cur && /Cuentas/.test(cur.textContent)) drawLine('ac'); }, function () { ACC = false; });
};
