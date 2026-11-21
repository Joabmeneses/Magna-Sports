'use strict';
// Torneos: el centro de todas las competiciones (Champions, OmegaCup, Supernova, Mundial, ligas, torneos e historial).
// Portada con "Ahora mismo" (rota entre partidos en vivo, próximos y campeones), cinta de resultados, filtros,
// tarjetas con contenido real (tabla, cuadro, líderes), próximos partidos con cuenta regresiva y goleadores.
(function () {
  var $ = function (s) { return document.querySelector(s); };
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function S() { return MAGNA.S; }
  function fdt(s) { try { return window.M && M.fdt ? M.fdt(s) : s; } catch (e) { return s || ''; } }
  var NOVA = /super\s*nova|star\s*nova/i, OMEGA = /omega/i, RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var COL = { champions: '#22d3ee', omega: '#ff8a3d', nova: '#9f8bff', mundial: '#2ee59d', ligas: '#b18cff', todos: '#ffd23f', hist: '#ff6fb1' };
  var flt = 'all', spI = 0, spT = null, spHold = false, first = true;
  function crest(id) { var c = el('span', 'cr'); if (id == null) { c.textContent = '?'; return c; } var u = MAGNA.crestUrl(id); c.style.setProperty('--tc', MAGNA.teamColor ? MAGNA.teamColor(id) : '#5a5080');
    if (u) { var im = el('img'); im.src = u; im.alt = ''; im.loading = 'lazy'; im.onerror = function () { im.remove(); c.textContent = String(MAGNA.teamName(id)).slice(0, 2).toUpperCase(); }; c.appendChild(im); } else c.textContent = String(MAGNA.teamName(id)).slice(0, 2).toUpperCase(); return c; }
  function short(id) { return String(MAGNA.teamName(id)).slice(0, 3).toUpperCase(); }
  // ---------- tiempo ----------
  function when(at) { return at ? new Date(String(at).replace(' ', 'T') + (/[zZ]|[+-]\d\d:?\d\d$/.test(at) ? '' : 'Z')).getTime() : NaN; }
  function left(at) { var d = when(at) - Date.now(); if (isNaN(d)) return ''; if (d <= 0) return 'Por empezar'; var m = Math.floor(d / 60000), h = Math.floor(m / 60), dd = Math.floor(h / 24);
    return dd > 0 ? 'en ' + dd + ' d ' + (h % 24) + ' h' : h > 0 ? 'en ' + h + ' h ' + (m % 60) + ' min' : 'en ' + Math.max(1, m) + ' min'; }
  function dayLabel(at) { var t = when(at); if (isNaN(t)) return 'Sin fecha'; var d = new Date(t), n = new Date(), k = function (x) { return x.getFullYear() + '-' + x.getMonth() + '-' + x.getDate(); }, tm = new Date(n.getTime() + 864e5);
    if (k(d) === k(n)) return 'Hoy'; if (k(d) === k(tm)) return 'Mañana'; return d.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'short' }); }
  function tickClocks() { document.querySelectorAll('[data-at]').forEach(function (x) { x.textContent = (x.dataset.pre || '') + left(x.dataset.at); }); }
  // ---------- competiciones ----------
  function latest(L) { return L.filter(function (c) { return c.status === 'active'; }).slice(-1)[0] || L[L.length - 1] || null; }
  function tms(c, type) { return (S().matches || []).filter(function (m) { return m.type === (type || 'tournament') && m.cid === c.id && m.status !== 'cancelled'; }); }
  function champ(c) { var st = c.state || {}; if (st.champion != null) return st.champion; if (c.format === 'knockout' && c.legs === 2 && MAGNA.koTies) { var R = MAGNA.koTies(c), f = R && R[R.length - 1]; if (f && f.ties[0] && f.ties[0].win != null) return f.ties[0].win; } return null; }
  function phase(c) { var st = c.state || {}; if (champ(c) != null || st.phase === 'done') return 'Terminado'; if (!st.phase) return c.status === 'active' ? 'Por sortear' : 'Próximamente';
    if (st.phase === 'groups') return c.format === 'champions' ? 'Fase de liga' : 'Fase de grupos'; if (st.phase === 'playoff') return 'Play-off'; if (st.phase === 'league') return 'Todos contra todos'; return st.round || 'Eliminatoria'; }
  function kindOf(c) { return c.format === 'champions' ? 'champions' : c.format === 'groups_knockout' ? 'mundial' : c.format === 'knockout' && NOVA.test(c.name) ? 'nova' : c.format === 'knockout' && (c.legs === 2 || OMEGA.test(c.name)) ? 'omega' : 'todos'; }
  function link(c) { var k = kindOf(c); return k === 'mundial' ? 'mundial.html' : k === 'champions' ? 'champions.html?t=' + c.id : k === 'nova' ? 'supernova.html?t=' + c.id : k === 'omega' ? 'copa.html?t=' + c.id : 'competiciones.html'; }
  function compOf(m) { if (m.type === 'league') { var l = MAGNA.by(S().leagues || [], m.cid); return l ? { name: l.name, color: COL.ligas, href: 'ligas.html', bg: 'radial-gradient(circle at 70% 20%,#5b3bc4,#1d1450 60%,#100c2a)' } : null; }
    if (m.type !== 'tournament') return null; var c = MAGNA.by(S().tournaments || [], m.cid); if (!c) return null; var k = kindOf(c);
    return { name: c.name, color: COL[k], href: link(c), bg: k === 'champions' ? 'url("img/bn-champions-sm.webp")' : k === 'omega' ? 'url("img/bn-omega-sm.webp")' : k === 'nova' ? 'url("img/bn-starnova-sm.webp")' : 'radial-gradient(circle at 70% 20%,#1f8a5f,#0b2a1f 60%,#081610)' }; }
  // ---------- piezas de las tarjetas ----------
  function pv(title, right) { var w = el('div', 'pv'), h = el('div', 'pv-h'); h.appendChild(el('span', null, title)); if (right) h.appendChild(el('span', null, right)); w.appendChild(h); return w; }
  function prow(n, team, val, sub) { var r = el('div', 'pr'); r.appendChild(el('span', 'n', String(n))); r.appendChild(crest(team)); var t = el('span'); t.textContent = MAGNA.teamName(team); if (sub) { var w = el('span'); w.appendChild(t); w.appendChild(el('small', null, sub)); r.appendChild(w); } else r.appendChild(t); r.appendChild(el('em', null, val)); return r; }
  function tableOf(c) { if (c.format === 'champions' && c.groups && c.groups[0] && MAGNA.groupTable) return MAGNA.groupTable(c, c.groups[0]); return null; }
  function tiesNow(c) { // ronda actual de una copa: [{a,b,m,win,live,ga,gb}]
    if (c.format === 'knockout' && c.legs === 2 && MAGNA.koTies) { var R = MAGNA.koTies(c) || [], cur = R.filter(function (r) { return r.ties.some(function (t) { return t.win == null && (t.a != null || t.b != null); }); })[0] || R[R.length - 1]; return cur ? { round: cur.round, ties: cur.ties } : null; }
    var st = c.state || {}, rn = st.round, ms = tms(c).filter(function (m) { return !rn || m.round === rn; }); if (!ms.length) return null;
    return { round: rn || ms[0].round, ties: ms.map(function (m) { var f = m.status === 'finished' && m.hs !== m.as; return { a: m.home, b: m.away, ga: m.hs, gb: m.as, win: f ? (m.hs > m.as ? m.home : m.away) : null, live: m.status === 'live', m: m }; }) }; }
  function kRow(t) { var r = el('div', 'kr' + (t.live ? ' live' : '')), a = el('div', 'a'), b = el('div', 'b'); a.appendChild(crest(t.a)); a.appendChild(el('span', t.win == null ? '' : t.win === t.a ? 'w' : 'l', t.a != null ? short(t.a) : '—'));
    b.appendChild(crest(t.b)); b.appendChild(el('span', t.win == null ? '' : t.win === t.b ? 'w' : 'l', t.b != null ? short(t.b) : '—'));
    var played = t.live || t.win != null || (t.m && t.m.status === 'finished') || (t.ida && t.ida.status === 'finished'); r.appendChild(a); r.appendChild(el('span', 'm', played ? (t.ga || 0) + ' - ' + (t.gb || 0) : 'VS')); r.appendChild(b); return r; }
  function nextOf(ms) { return ms.filter(function (m) { return m.status === 'scheduled' && m.at; }).sort(function (a, b) { return String(a.at).localeCompare(String(b.at)); })[0]; }
  function footer(o, ms) { var f = el('div', 'ftr'), live = ms.filter(function (m) { return m.status === 'live'; }).length, nx = nextOf(ms), cd;
    if (live) cd = el('span', 'cd r', '🔴 ' + live + (live === 1 ? ' partido en vivo' : ' partidos en vivo'));
    else if (nx) { cd = el('span', 'cd'); cd.appendChild(document.createTextNode('⏱ Próximo ')); var b = el('b'); b.dataset.at = nx.at; b.textContent = left(nx.at); cd.appendChild(b); }
    else cd = el('span', 'cd', o.done ? '🏁 Edición terminada' : '📅 Sin partidos programados');
    f.appendChild(cd); f.appendChild(el('span', 'go', o.cta)); return f; }
  function card(o) {
    var a = el('a', 'cc' + (o.big ? ' big' : '')); a.href = o.href; a.style.setProperty('--c', o.color); a.style.animationDelay = o.i * 70 + 'ms'; a.setAttribute('data-n', String(o.i + 1).padStart(2, '0')); a.dataset.f = o.f || '';
    var bg = el('div', 'bg'); bg.style.setProperty('--bg', o.bg); a.appendChild(bg); if (o.tro) { var t = el('img', 'tr'); t.src = o.tro; t.alt = ''; t.loading = 'lazy'; a.appendChild(t); }
    var top = el('div', 'top'); top.appendChild(el('span', 'st' + (o.live ? ' live' : o.on ? ' on' : ''), o.live ? 'En vivo' : o.status)); if (o.ph) top.appendChild(el('span', 'ph', o.ph)); a.appendChild(top);
    a.appendChild(el('h3', null, o.title)); if (o.ed) a.appendChild(el('div', 'ed', o.ed));
    if (o.body) a.appendChild(o.body); if (o.p != null) { var bar = el('div', 'bar'), i = el('i'); i.style.setProperty('--p', o.p + '%'); bar.appendChild(i); a.appendChild(bar); }
    a.appendChild(footer(o, o.ms || [])); return a; }
  // copa o torneo con edición
  function cupCard(o, c) {
    if (!c) { o.status = 'Próxima edición'; o.f = 'soon'; o.body = pv('Muy pronto'); o.body.appendChild(el('div', 'pv-e', o.empty)); return card(o); }
    var ms = tms(c), fin = ms.filter(function (m) { return m.status === 'finished'; }).length, ch = champ(c), k = kindOf(c);
    o.href = link(c); o.ed = c.name; o.ms = ms; o.live = ms.some(function (m) { return m.status === 'live'; }); o.on = c.status === 'active' && ch == null; o.done = ch != null;
    o.status = ch != null ? 'Terminado' : c.status === 'active' ? 'En juego' : 'Próximamente'; o.ph = ch == null ? phase(c) : null; o.p = ms.length ? Math.round(fin / ms.length * 100) : null;
    o.f = o.live ? 'live on' : ch != null ? 'done' : c.status === 'active' ? 'on' : 'soon';
    if (ch != null) { o.body = pv('🏆 Campeón', c.teamIds.length + ' equipos'); o.body.appendChild(prow(1, ch, 'Campeón')); }
    else if (k === 'champions' || k === 'mundial') { var T = k === 'champions' ? tableOf(c) : null;
      if (T && T.length) { o.body = pv('Tabla · top ' + Math.min(o.big ? 6 : 3, T.length), 'Pts'); var cols = el('div', 'pv-cols'); T.slice(0, o.big ? 6 : 3).forEach(function (r) { cols.appendChild(prow(r.pos, r.team_id, String(r.pts), r.pj + ' PJ · ' + (r.dg > 0 ? '+' : '') + r.dg + ' DG')); }); o.body.appendChild(cols); }
      else if (k === 'mundial' && c.groups && c.groups.length && MAGNA.groupTable && (c.state || {}).phase === 'groups') { o.body = pv('Líderes de grupo', 'Pts'); c.groups.slice(0, 4).forEach(function (g) { var t = MAGNA.groupTable(c, g)[0]; if (t) o.body.appendChild(prow(g.name, t.team_id, String(t.pts))); }); }
      else { var tn = tiesNow(c); if (tn) { o.body = pv(tn.round || 'Cruces', tn.ties.length + ' cruces'); tn.ties.slice(0, 4).forEach(function (t) { o.body.appendChild(kRow(t)); }); } } }
    else { var tn2 = tiesNow(c); if (tn2) { o.body = pv(tn2.round || 'Cruces', (c.legs === 2 ? 'Global' : 'Partido único')); tn2.ties.slice(0, 4).forEach(function (t) { o.body.appendChild(kRow(t)); }); } }
    if (!o.body) { o.body = pv(phase(c)); o.body.appendChild(el('div', 'pv-e', (c.teamIds || []).length + ' equipos inscritos · el cuadro aparece al sortear')); }
    return card(o); }
  // ---------- "ahora mismo" ----------
  function slides() { var M0 = S().matches || [], out = [];
    M0.filter(function (m) { return m.status === 'live' && (m.type === 'tournament' || m.type === 'league'); }).forEach(function (m) { out.push({ k: 'live', m: m }); });
    M0.filter(function (m) { return m.status === 'scheduled' && m.at && (m.type === 'tournament' || m.type === 'league') && when(m.at) > Date.now() - 36e5; }).sort(function (a, b) { return String(a.at).localeCompare(String(b.at)); }).slice(0, 3).forEach(function (m) { out.push({ k: 'next', m: m }); });
    (S().tournaments || []).filter(function (c) { return champ(c) != null; }).slice(-2).forEach(function (c) { out.push({ k: 'champ', c: c }); });
    return out.slice(0, 7); }
  function spot() {
    var sp = $('#sp'), L = slides(); clearInterval(spT); sp.innerHTML = '';
    var hd = el('div', 'sp-h'); hd.appendChild(el('b', null, '⚡ Ahora mismo')); var dots = el('div', 'sp-dots'); hd.appendChild(dots); sp.appendChild(hd);
    var body = el('div', 'sp-b'); sp.appendChild(body);
    if (!L.length) { body.appendChild(el('div', 'sp-e', 'No hay partidos en este momento. ¡Pronto vuelve la acción!')); return; }
    L.forEach(function (x, i) { var s;
      if (x.k === 'champ') { var c = x.c, ch = champ(c), col = COL[kindOf(c)]; s = el('a', 'sl2'); s.href = link(c); s.style.setProperty('--sc', col); var bgc = el('div', 'bgi'); bgc.style.setProperty('--bg', 'url("img/bn-champions-sm.webp")'); s.appendChild(bgc);
        var k1 = el('div', 'k1'); k1.appendChild(el('span', 'w', '🏆 Campeón')); k1.appendChild(el('span', null, c.name)); s.appendChild(k1);
        var cm = el('div', 'chm'); cm.appendChild(crest(ch)); cm.appendChild(el('b', null, MAGNA.teamName(ch))); s.appendChild(cm);
        var f0 = el('div', 'ft'); f0.appendChild(el('small', null, '¡Levantó el trofeo!')); f0.appendChild(el('em', null, 'Ver cuadro →')); s.appendChild(f0); }
      else { var m = x.m, cp = compOf(m) || { name: 'Partido', color: '#c6ff1a', bg: 'none' }; s = el('a', 'sl2'); s.href = 'partido.html?id=' + m.id; s.style.setProperty('--sc', cp.color); var bgi = el('div', 'bgi'); bgi.style.setProperty('--bg', cp.bg); s.appendChild(bgi);
        var k2 = el('div', 'k1'); k2.appendChild(el('span', x.k === 'live' ? 'r' : '', x.k === 'live' ? '● En vivo' : '⏭ Próximo')); k2.appendChild(el('span', null, cp.name)); s.appendChild(k2);
        var vs = el('div', 'vs2'), A = el('div', 'tm'), B = el('div', 'tm'); A.appendChild(crest(m.home)); A.appendChild(el('b', null, MAGNA.teamName(m.home))); B.appendChild(crest(m.away)); B.appendChild(el('b', null, MAGNA.teamName(m.away)));
        vs.appendChild(A); vs.appendChild(el('span', 'sc' + (x.k === 'live' ? '' : ' v'), x.k === 'live' ? (m.hs || 0) + '-' + (m.as || 0) : 'VS')); vs.appendChild(B); s.appendChild(vs);
        var ft = el('div', 'ft'); ft.appendChild(el('small', null, String(m.round || '').split(' · ')[0] || cp.name)); var em = el('em'); if (x.k === 'live') em.textContent = 'Ver en vivo →'; else { em.dataset.at = m.at; em.dataset.pre = '⏱ '; em.textContent = '⏱ ' + left(m.at); } ft.appendChild(em); s.appendChild(ft); }
      body.appendChild(s); var d = el('button'); d.type = 'button'; d.setAttribute('aria-label', 'Ver ' + (i + 1)); d.onclick = function () { go(i); spHold = true; }; dots.appendChild(d); });
    function go(i) { spI = (i + L.length) % L.length; [].forEach.call(body.children, function (x, j) { x.classList.toggle('on', j === spI); }); [].forEach.call(dots.children, function (x, j) { x.classList.toggle('on', j === spI); });
      var a = body.children[spI]; sp.style.setProperty('--sc', a.style.getPropertyValue('--sc')); }
    go(Math.min(spI, L.length - 1)); sp.onmouseenter = function () { spHold = true; }; sp.onmouseleave = function () { spHold = false; };
    if (!RM && L.length > 1) spT = setInterval(function () { if (!spHold && !document.hidden) go(spI + 1); }, 5500); }
  // ---------- cinta de resultados ----------
  function ticker() { var M0 = (S().matches || []).filter(function (m) { return m.status === 'finished' && (m.type === 'tournament' || m.type === 'league'); }).sort(function (a, b) { return String(b.at || '').localeCompare(String(a.at || '')); }).slice(0, 10), tk = $('#tk'), t = $('#tkT');
    tk.hidden = !M0.length; if (!M0.length) return; t.innerHTML = '';
    var add = function () { M0.forEach(function (m) { var cp = compOf(m) || { name: '' }, a = el('a'); a.href = 'partido.html?id=' + m.id; a.appendChild(el('i', null, cp.name)); a.appendChild(document.createTextNode(MAGNA.teamName(m.home))); a.appendChild(el('em', null, m.hs + '-' + m.as)); a.appendChild(document.createTextNode(MAGNA.teamName(m.away))); t.appendChild(a); }); };
    add(); add(); t.style.setProperty('--d', Math.max(24, M0.length * 6) + 's'); }
  // ---------- goleadores ----------
  function scorers() { var G = {}, g = $('#gs'); g.innerHTML = '';
    (S().matches || []).forEach(function (m) { if ((m.type !== 'tournament' && m.type !== 'league') || !m.live || !m.live.ev) return; m.live.ev.forEach(function (e) { if (e.k === 'goal' && e.player != null) G[e.player] = (G[e.player] || 0) + 1; }); });
    var L = Object.keys(G).map(function (k) { return { id: Number(k), n: G[k] }; }).sort(function (a, b) { return b.n - a.n || String(MAGNA.playerName(a.id)).localeCompare(String(MAGNA.playerName(b.id)), 'es'); }).slice(0, 6);
    if (!L.length) { g.appendChild(el('div', 'empty', 'Todavía no hay goles registrados en las competiciones.')); return; }
    var mx = L[0].n; L.forEach(function (x, i) { var p = MAGNA.by(S().players || [], x.id) || {}, a = el('a', 'gr'); a.href = 'jugador.html?id=' + x.id; a.style.setProperty('--c', i === 0 ? '#c6ff1a' : i < 3 ? '#b18cff' : '#5a4a8a'); a.style.setProperty('--p', Math.round(x.n / mx * 100) + '%'); a.style.animationDelay = i * 60 + 'ms';
      a.appendChild(el('span', 'n', String(i + 1))); a.appendChild(crest(p.teamId)); var t = el('div'); t.appendChild(el('b', null, MAGNA.playerName(x.id) || 'Jugador')); t.appendChild(el('small', null, p.teamId != null ? MAGNA.teamName(p.teamId) : 'Sin equipo')); a.appendChild(t);
      var gl = el('span', 'g', String(x.n)); gl.appendChild(el('small', null, x.n === 1 ? 'gol' : 'goles')); a.appendChild(gl); a.appendChild(el('i')); g.appendChild(a); }); }
  // ---------- próximos ----------
  function upcoming() { var nx = $('#nx'); nx.innerHTML = ''; var up = (S().matches || []).filter(function (m) { return m.status === 'scheduled' && m.at && (m.type === 'tournament' || m.type === 'league'); }).sort(function (a, b) { return String(a.at).localeCompare(String(b.at)); }).slice(0, 6);
    if (!up.length) { nx.appendChild(el('div', 'empty', 'No hay partidos programados por ahora.')); return; }
    var cur = null, box = null; up.forEach(function (m) { var dl = dayLabel(m.at); if (dl !== cur) { cur = dl; nx.appendChild(el('div', 'dy', dl)); box = el('div', 'ml'); nx.appendChild(box); }
      var cp = compOf(m) || { name: 'Partido', color: '#8b5cf6' }, a = el('a', 'mc'); a.href = 'partido.html?id=' + m.id; a.style.setProperty('--c', cp.color);
      var h = el('div', 't'); h.appendChild(crest(m.home)); h.appendChild(el('span', null, MAGNA.teamName(m.home))); var mid = el('div', 'm'); mid.appendChild(el('small', 'c', cp.name)); mid.appendChild(el('b', null, 'VS')); var cd = el('em'); cd.dataset.at = m.at; cd.textContent = left(m.at); mid.appendChild(cd);
      var aw = el('div', 't r'); aw.appendChild(crest(m.away)); aw.appendChild(el('span', null, MAGNA.teamName(m.away))); a.appendChild(h); a.appendChild(mid); a.appendChild(aw); a.title = fdt(m.at); box.appendChild(a); }); }
  // ---------- filtros ----------
  function filters(counts) { var w = $('#flt'); w.innerHTML = ''; [['all', 'Todos'], ['on', 'En juego'], ['live', 'En vivo'], ['done', 'Terminados']].forEach(function (x) { var b = el('button', flt === x[0] ? 'on' : ''); b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', flt === x[0]);
      b.appendChild(document.createTextNode(x[1])); b.appendChild(el('b', null, String(counts[x[0]] || 0))); b.onclick = function () { flt = x[0]; filters(counts); applyF(); }; w.appendChild(b); }); }
  function applyF() { document.querySelectorAll('#cg .cc').forEach(function (c) { var f = c.dataset.f.split(' '); c.classList.toggle('hide', flt !== 'all' && f.indexOf(flt) < 0); }); }
  function countUp(b, v) { if (RM || !first || isNaN(v)) { b.textContent = String(v); return; } var t0 = performance.now(); (function st(t) { var k = Math.min(1, (t - t0) / 900); b.textContent = String(Math.round(v * (1 - Math.pow(1 - k, 3)))); if (k < 1) requestAnimationFrame(st); })(t0); }
  function render() {
    var T = S().tournaments || [], Lg = S().leagues || [], M0 = S().matches || [];
    var champs = T.filter(function (c) { return kindOf(c) === 'champions'; }), omega = T.filter(function (c) { return kindOf(c) === 'omega'; }), nova = T.filter(function (c) { return kindOf(c) === 'nova'; }), mund = T.filter(function (c) { return kindOf(c) === 'mundial'; });
    var actT = T.filter(function (c) { return c.status === 'active'; }).length, actL = Lg.filter(function (l) { return l.status === 'active'; }), lives = M0.filter(function (m) { return m.status === 'live' && (m.type === 'tournament' || m.type === 'league'); });
    var goals = 0; M0.forEach(function (m) { if (m.status === 'finished' && (m.type === 'tournament' || m.type === 'league')) goals += (Number(m.hs) || 0) + (Number(m.as) || 0); });
    var ks = $('#ks'); ks.innerHTML = ''; [[actT + actL.length, 'En juego', '#c6ff1a'], [lives.length, 'En vivo', '#ff3b30'], [M0.filter(function (m) { return m.status === 'finished' && (m.type === 'tournament' || m.type === 'league'); }).length, 'Jugados', '#b18cff'], [goals, 'Goles', '#f2f2ee']].forEach(function (x, i) {
      var k = el('div', 'k'), b = el('b'); k.style.setProperty('--c', x[2]); k.style.animationDelay = i * 70 + 'ms'; k.appendChild(b); k.appendChild(el('span', null, x[1])); ks.appendChild(k); countUp(b, x[0]); });
    var lp = $('#lvp'); lp.hidden = !lives.length; lp.textContent = lives.length + ' en vivo';
    spot(); ticker();
    // tarjetas
    var g = $('#cg'); g.innerHTML = ''; var i = 0;
    g.appendChild(cupCard({ i: i++, big: true, title: 'Champions', color: COL.champions, bg: 'url("img/bn-champions.webp")', tro: 'trofeos/champions.webp', cta: 'Tabla y cuadro', href: 'champions.html', empty: 'La próxima Champions se anunciará pronto' }, latest(champs)));
    g.appendChild(cupCard({ i: i++, title: 'OmegaCup', color: COL.omega, bg: 'url("img/bn-omega-sm.webp")', tro: 'trofeos/omegacup.webp', cta: 'Ver el cuadro', href: 'copa.html', empty: 'Llaves a ida y vuelta · próxima edición pronto' }, latest(omega)));
    g.appendChild(cupCard({ i: i++, title: 'Supernova', color: COL.nova, bg: 'url("img/bn-starnova-sm.webp")', tro: 'trofeos/supernova.webp', cta: 'Ver el cuadro', href: 'supernova.html', empty: 'Cruces a partido único · próxima edición pronto' }, latest(nova)));
    g.appendChild(cupCard({ i: i++, title: 'Mundial', color: COL.mundial, bg: 'radial-gradient(circle at 70% 20%,#1f8a5f,#0b2a1f 60%,#081610)', tro: 'trofeos/mundial.webp', cta: 'Grupos y cuadro', href: 'mundial.html', empty: 'Grupos + eliminatoria · próxima edición pronto' }, latest(mund)));
    // ligas: líder de cada división
    var lm = M0.filter(function (m) { return m.type === 'league' && m.status !== 'cancelled'; }), lf = lm.filter(function (m) { return m.status === 'finished'; }).length, lb = pv('Líderes', 'Pts');
    actL.slice(0, 3).forEach(function (l) { var st = MAGNA.standings ? MAGNA.standings(l) : [], t = st[0]; if (t) lb.appendChild(prow(String(l.name).replace(/división/i, '').trim().slice(0, 3).toUpperCase(), t.team_id, String(t.pts), l.name)); });
    if (lb.children.length < 2) lb.appendChild(el('div', 'pv-e', 'Las ligas vuelven pronto'));
    var lLive = lm.some(function (m) { return m.status === 'live'; });
    g.appendChild(card({ i: i++, title: 'Ligas', color: COL.ligas, bg: 'radial-gradient(circle at 70% 20%,#5b3bc4,#1d1450 60%,#100c2a)', tro: 'trofeos/liga.webp', cta: 'Ver las tablas', href: 'ligas.html', on: actL.length > 0, live: lLive, ms: lm, f: (lLive ? 'live ' : '') + (actL.length ? 'on' : 'soon'),
      status: actL.length ? 'En juego' : 'Sin ligas activas', ph: actL.length ? actL.length + (actL.length === 1 ? ' división' : ' divisiones') : null, ed: 'Primera, Segunda y Tercera', body: lb, p: lm.length ? Math.round(lf / lm.length * 100) : null }));
    // todos los torneos
    var tb = pv('Todos los torneos', T.length + ''); T.slice().sort(function (a, b) { return (b.status === 'active') - (a.status === 'active'); }).slice(0, 6).forEach(function (c) { var r = el('div', 'pr'), ch = champ(c); r.appendChild(el('span', 'n', c.status === 'active' ? '●' : ch != null ? '🏆' : '·')); r.appendChild(crest(ch)); var w = el('span'); w.appendChild(el('span', null, c.name)); w.appendChild(el('small', null, ch != null ? 'Campeón: ' + MAGNA.teamName(ch) : phase(c))); r.appendChild(w); r.appendChild(el('em', null, (c.teamIds || []).length + ' eq.')); tb.appendChild(r); });
    var tm = M0.filter(function (m) { return m.type === 'tournament' && m.status !== 'cancelled'; });
    g.appendChild(card({ i: i++, big: true, title: 'Todos los torneos', color: COL.todos, bg: 'radial-gradient(circle at 80% 10%,#8a5a00,#2a1a06 55%,#140d05)', tro: 'trofeos/copa-de-oro.webp', cta: 'Ver todos', href: 'competiciones.html', on: actT > 0, ms: tm, f: actT ? 'on' : 'soon',
      status: actT ? actT + (actT === 1 ? ' en juego' : ' en juego') : 'Torneos', ph: 'Cruces, grupos e historial', body: tb }));
    // historial
    var H = (S().history || []).slice().sort(function (a, b) { return String(b.date || '').localeCompare(String(a.date || '')); }), hb = pv('Últimos campeones', H.length + ' ediciones');
    H.slice(0, 3).forEach(function (e, k) { var r = el('div', 'pr'); r.appendChild(el('span', 'n', '🏆')); var tid = null; (S().teams || []).forEach(function (t) { if (t.name === e.champion) tid = t.id; }); r.appendChild(crest(tid)); var w = el('span'); w.appendChild(el('span', null, e.champion || '—')); w.appendChild(el('small', null, e.name)); r.appendChild(w); r.appendChild(el('em', null, e.date ? String(e.date).slice(0, 4) : '')); hb.appendChild(r); });
    if (!H.length) hb.appendChild(el('div', 'pv-e', 'El palmarés se llena con cada final'));
    g.appendChild(card({ i: i++, title: 'Historial', color: COL.hist, bg: 'radial-gradient(circle at 70% 20%,#7a1f55,#2a0c1f 60%,#14060f)', tro: 'trofeos/copa-del-rey.webp', cta: 'Ver el palmarés', href: 'competiciones.html#historial', status: 'Palmarés', f: 'done', done: true, body: hb }));
    var counts = { all: 0, on: 0, live: 0, done: 0 }; document.querySelectorAll('#cg .cc').forEach(function (c) { counts.all++; c.dataset.f.split(' ').forEach(function (f) { if (counts[f] != null) counts[f]++; }); });
    filters(counts); applyF(); upcoming(); scorers(); first = false; }
  render(); window.addEventListener('magna:update', function () { render(); });
  setInterval(tickClocks, 30000);
})();
