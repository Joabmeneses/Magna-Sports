'use strict';
// Páginas especiales de las copas eliminatorias: OmegaCup (ida y vuelta, copa.html) y Supernova (partido único, supernova.html).
// Portada, camino al título, cuadro, partidos, equipos y reglas. La copa se elige por ?t=<id> o por el nombre de la página.
(function () {
  var $ = function (s) { return document.querySelector(s); };
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  var KIND = document.body.getAttribute('data-cup') || 'omega';
  var CUP = {
    omega: { re: /omega/i, page: 'copa.html', name: 'OmegaCup', q: '¿Quién levantará la Omega?', q2: ' equipos, un solo trono.', fx: '#ffb02e' },
    nova: { re: /super\s*nova|star\s*nova/i, page: 'supernova.html', name: 'Supernova', q: '¿Quién alcanzará la Supernova?', q2: ' equipos, una sola estrella.', fx: '#9fd8ff' }
  }[KIND];
  var RC = { 'Octavos de final': ['🔥 Octavos', '#ff8a3d', 'Octavos'], 'Cuartos de final': ['🔥 Cuartos', '#ff6a1a', 'Cuartos'], 'Semifinales': ['⚡ Semis', '#b18cff', 'Semis'], 'Final': ['👑 Final', '#ffd23f', 'Final'] };
  if (KIND === 'nova') RC = { 'Octavos de final': ['✨ Octavos', '#5fd4ff', 'Octavos'], 'Cuartos de final': ['🌠 Cuartos', '#8f7bff', 'Cuartos'], 'Semifinales': ['⚡ Semis', '#ff7ad9', 'Semis'], 'Final': ['👑 Final', '#ffd23f', 'Final'] };
  var pane = 'cuadro', C = null, R = null, ONE = false, poster = null, TIE = {};
  function rc(r) { return RC[r] || ['🎯 ' + r, '#ff8a3d', r]; }
  function rname(n) { return n === 2 ? 'Final' : n === 4 ? 'Semifinales' : n === 8 ? 'Cuartos de final' : n === 16 ? 'Octavos de final' : 'Ronda de ' + n; }
  function S() { return MAGNA.S; }
  function fdt(s) { try { return window.M && M.fdt ? M.fdt(s) : s; } catch (e) { return s || ''; } }
  function toast(t) { var x = $('#toast3'); x.textContent = t; x.classList.add('on'); clearTimeout(x._t); x._t = setTimeout(function () { x.classList.remove('on'); }, 2600); }
  function short(id) { return String(MAGNA.teamName(id)).slice(0, 3).toUpperCase(); }
  function crest(id) { var c = el('span', 'cr'); if (id == null) { c.textContent = '?'; return c; } var u = MAGNA.crestUrl(id), col = MAGNA.teamColor ? MAGNA.teamColor(id) : '#5a4048'; c.style.setProperty('--tc', col);
    if (u) { var im = el('img'); im.src = u; im.alt = ''; im.loading = 'lazy'; im.onerror = function () { im.remove(); c.textContent = String(MAGNA.teamName(id)).slice(0, 2).toUpperCase(); }; c.appendChild(im); } else c.textContent = String(MAGNA.teamName(id)).slice(0, 2).toUpperCase(); return c; }
  // copas de esta página: eliminatorias cuyo nombre es de esta copa (la OmegaCup también muestra cualquier otra copa a ida y vuelta)
  function cups() { return (S().tournaments || []).filter(function (c) { return c.format === 'knockout' && (CUP.re.test(c.name) || (KIND === 'omega' && c.legs === 2 && !CUP_NOVA(c))); }); }
  function CUP_NOVA(c) { return /super\s*nova|star\s*nova/i.test(c.name); }
  function pick() { var q = Number(new URLSearchParams(location.search).get('t')), all = (S().tournaments || []).filter(function (c) { return c.format === 'knockout'; }), L = cups();
    var byId = all.filter(function (c) { return c.id === q; })[0]; if (byId) return byId; if (!L.length) return null;
    return L.filter(function (c) { return c.status === 'active'; }).slice(-1)[0] || L[L.length - 1]; }
  function matches() { return (S().matches || []).filter(function (m) { return m.type === 'tournament' && m.cid === C.id && m.status !== 'cancelled'; }); }
  function legName(m) { return m.leg === 1 ? 'Ida' : m.leg === 2 ? 'Vuelta' : m.leg === 3 ? 'Desempate' : 'Partido único'; }
  // ---------- cuadro a partido único ----------
  // Cada ronda empareja al primero con el último de los que siguen vivos (los pases directos van primero), igual que el panel.
  // Se arma el árbol desde la final hacia atrás para que cada pareja de partidos quede junta y las líneas unan bien.
  function koSingle(c) {
    var ids = c.teamIds || [], n = ids.length; if (n < 2) return null; var size = 1; while (size < n) size *= 2;
    var ms = matches(), byR = {}; ms.forEach(function (m) { (byR[m.round] = byR[m.round] || []).push(m); });
    var won = function (m) { return m && m.status === 'finished' && Number(m.hs) !== Number(m.as) ? (Number(m.hs) > Number(m.as) ? m.home : m.away) : null; };
    var node = function (m, a, b, f) { var t = { a: a, b: b, m: m || null, ida: m || null, vta: null, ga: 0, gb: 0, win: null, live: !!(m && m.status === 'live'), f: f || [] };
      if (m) { t.a = m.home; t.b = m.away; if (m.status === 'finished' || m.status === 'live') { t.ga = Number(m.hs) || 0; t.gb = Number(m.as) || 0; } t.win = won(m); } return t; };
    var gen = !!c.state, r0 = rname(size), nb = size - n, byes = gen ? ids.slice(0, nb) : [], rest = ids.slice(nb), m0 = byR[r0] || [];
    var cur = byes.map(function (b) { return { a: b, b: null, bye: true, win: b, f: [] }; });
    for (var i = 0; i < (n - nb) / 2; i++) cur.push(node(m0[i], gen ? rest[i] : null, gen ? rest[rest.length - 1 - i] : null));
    var levels = [{ round: r0, nodes: cur }];
    for (var s = size / 2; s >= 2; s /= 2) { var rn = rname(s), L = cur.length, used = {}, ms2 = byR[rn] || [], nx = [];
      for (var j = 0; j < L / 2; j++) { var x = cur[j], y = cur[L - 1 - j], a = x.win, b = y.win, m = null;
        if (a != null && b != null) m = ms2.filter(function (q) { return !used[q.id] && ((q.home === a && q.away === b) || (q.home === b && q.away === a)); })[0];
        if (!m && ms2[j] && !used[ms2[j].id] && (a == null || b == null)) m = ms2[j]; if (m) used[m.id] = 1; nx.push(node(m, a, b, [x, y])); }
      cur = nx; levels.push({ round: rn, nodes: cur }); }
    // orden de pantalla: recorrido del árbol desde la final
    var cols = levels.map(function () { return []; }); (function walk(t, d) { if (d > 0) t.f.forEach(function (q) { walk(q, d - 1); }); cols[d].push(t); })(cur[0], levels.length - 1);
    return levels.map(function (lv, k) { return { round: lv.round, ties: cols[k] }; }); }
  function champion() { var st = C.state || {}; if (st.champion != null) return st.champion; var f = R && R[R.length - 1]; return f && f.ties[0] && f.ties[0].win != null ? f.ties[0].win : null; }
  function real(r) { return r.ties.filter(function (t) { return !t.bye; }); }
  function curRound() { if (!R) return -1; for (var i = 0; i < R.length; i++) if (real(R[i]).some(function (t) { return t.win == null; })) return i; return R.length - 1; }
  function played(t) { return [t.ida, t.vta, t.m].some(function (m) { return m && m.status === 'finished'; }); }
  // ---------- portada ----------
  function hero() {
    var ms = matches(), fin = ms.filter(function (m) { return m.status === 'finished'; }), goals = 0, ch = champion(), ci = curRound();
    fin.forEach(function (m) { goals += (Number(m.hs) || 0) + (Number(m.as) || 0); });
    $('#ttl').textContent = C.name; document.title = 'Magna Arena · ' + C.name;
    $('#eyT').textContent = (ch != null ? 'Campeón definido' : C.status === 'active' ? (R && ci >= 0 ? 'En juego · ' + R[ci].round : 'En juego') : 'Copa eliminatoria') + (ONE ? ' · Partido único' : ' · Ida y vuelta');
    $('#sub').textContent = C.description || (ONE ? 'Un solo partido por cruce: el que gana, avanza. Sin segundas oportunidades.' : 'Cada llave se juega a ida y vuelta: manda el marcador global. Si queda igual, hay desempate.');
    var art = MAGNA.trophyArt ? MAGNA.trophyArt(C.name, 'torneo') : null; if (art) $('#tro').src = art.src;
    var done = 0, tot = 0; (R || []).forEach(function (r) { real(r).forEach(function (t) { tot++; if (t.win != null) done++; }); });
    var ks = $('#ks'); ks.innerHTML = '';
    [[C.teamIds.length, 'Equipos', 'var(--k1)'], [done + '/' + tot, ONE ? 'Cruces cerrados' : 'Llaves cerradas', 'var(--k2)'], [fin.length, 'Partidos jugados', 'var(--k3)'], [goals, 'Goles', 'var(--k4)']].forEach(function (x, i) {
      var k = el('div', 'k'); k.style.setProperty('--c', x[2]); k.style.animationDelay = i * 70 + 'ms'; k.appendChild(el('b', null, String(x[0]))); k.appendChild(el('span', null, x[1])); ks.appendChild(k); });
    var L = cups(), pk = $('#pick'); pk.innerHTML = ''; pk.hidden = L.length < 2; L.slice().reverse().forEach(function (c) { var a = el('a', c.id === C.id ? 'on' : '', c.name); a.href = CUP.page + '?t=' + c.id; pk.appendChild(a); });
    var cp = $('#chp'); cp.innerHTML = ''; if (ch != null) { var b = el('div', 'chp'); b.appendChild(crest(ch)); var t = el('div'); t.appendChild(el('small', 'mono', '🏆 Campeón de la ' + C.name)); t.appendChild(el('b', null, MAGNA.teamName(ch))); b.appendChild(t); cp.appendChild(b); }
    var nx = $('#nx'); nx.innerHTML = ''; var lv = ms.filter(function (m) { return m.status === 'live'; })[0], up = ms.filter(function (m) { return m.status === 'scheduled' && m.at; }).sort(function (a, b) { return String(a.at).localeCompare(String(b.at)); })[0], m = lv || up;
    if (m) { var a = el('a', 'nxt' + (lv ? ' live' : '')); a.href = 'partido.html?id=' + m.id; a.appendChild(el('span', 'tg mono', lv ? '🔴 En vivo' : '⏭ Próximo')); var vs = el('div', 'vs'); vs.appendChild(crest(m.home)); vs.appendChild(el('span', null, MAGNA.teamName(m.home)));
      vs.appendChild(el('em', null, lv ? (m.hs || 0) + ' - ' + (m.as || 0) : 'VS')); vs.appendChild(el('span', null, MAGNA.teamName(m.away))); vs.appendChild(crest(m.away)); a.appendChild(vs);
      a.appendChild(el('span', 'wh mono', String(m.round || '').split(' · ')[0] + ' · ' + legName(m) + (lv ? '' : m.at ? ' · ' + fdt(m.at) : ''))); nx.appendChild(a); }
    var rd = $('#road'); rd.innerHTML = ''; (R || []).forEach(function (r, i) { var rl = real(r), d = rl.filter(function (t) { return t.win != null; }).length, b = el('button', i === ci && ch == null ? 'now' : d === rl.length ? 'done' : ''); b.type = 'button';
      b.appendChild(el('small', null, i === ci && ch == null ? 'Ahora' : d === rl.length ? '✓ Terminada' : 'Próximamente')); b.appendChild(el('b', null, rc(r.round)[2])); b.appendChild(el('small', null, d + '/' + rl.length + (ONE ? ' partidos' : ' llaves'))); var bar = el('i'); bar.style.setProperty('--p', Math.round(d / Math.max(1, rl.length) * 100) + '%'); b.appendChild(bar);
      b.onclick = function () { tab('cuadro'); var col = document.querySelectorAll('.bc')[i]; if (col) col.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' }); }; rd.appendChild(b); });
  }
  // ---------- cuadro ----------
  function cell(m, team) { if (!m) return el('span', 'sc', '–'); var x = m.status === 'finished' ? String(m.home === team ? m.hs : m.as) : m.status === 'live' ? (m.home === team ? m.hs : m.as) + '•' : '–', a = el('a', 'sc', x); a.href = 'partido.html?id=' + m.id; a.title = legName(m) + (m.at ? ' · ' + fdt(m.at) : ''); return a; }
  function feedLabel(f, ri, i, k) { if (!ONE) return ri > 0 ? 'Ganador llave ' + (2 * i + k + 1) : 'Por sortear'; if (!f) return 'Por sortear';
    if (f.a != null && f.b != null) return 'Ganador ' + short(f.a) + ' / ' + short(f.b); return 'Ganador ' + rc(R[ri - 1].round)[2].toLowerCase() + ' ' + (R[ri - 1].ties.slice(0, R[ri - 1].ties.indexOf(f)).filter(function (q) { return !q.bye; }).length + 1); }
  function tieCard(r, ri, t, i) {
    var col = rc(r.round)[1], ch = champion(), cd = el('div', 'ktie' + (ONE ? ' one' : '') + (t.live ? ' live' : '') + (t.bye ? ' bye' : '') + (ch != null && t.win === ch && r.round === 'Final' ? ' cp' : '')); cd.style.setProperty('--rc', col); cd.style.animationDelay = (ri * 120 + i * 50) + 'ms';
    var th = el('div', 'th mono'); th.appendChild(el('span', t.live ? 'lv' : '', (r.round === 'Final' ? 'Gran final' : t.bye ? 'Pase directo' : (ONE ? 'Partido ' + (r.ties.slice(0, i).filter(function (q) { return !q.bye; }).length + 1) : 'Llave ' + (i + 1))) + (t.live ? ' · 🔴 vivo' : '')));
    (ONE ? ['Goles'] : ['Ida', 'Vta', 'Glob']).forEach(function (x) { th.appendChild(el('span', null, x)); }); cd.appendChild(th);
    if (t.bye) { var rb = el('div', 'tr w'), nb = el('div', 'nm'); nb.appendChild(crest(t.a)); var ab = el('a'); ab.href = 'equipo.html?id=' + t.a; ab.appendChild(el('span', null, MAGNA.teamName(t.a))); nb.appendChild(ab); rb.appendChild(nb); rb.appendChild(el('span', 'gl', '✦')); cd.appendChild(rb);
      var tb = el('div', 'tf'); tb.appendChild(el('span', null, '✓ Avanza sin jugar esta ronda')); cd.appendChild(tb); return cd; }
    [[t.a, t.ga, 0], [t.b, t.gb, 1]].forEach(function (x) { var tbd = x[0] == null, row = el('div', 'tr' + (tbd ? ' tbd' : '') + (t.win != null ? (t.win === x[0] ? ' w' : ' l') : '')), nm = el('div', 'nm');
      nm.appendChild(crest(x[0])); if (tbd) nm.appendChild(el('span', null, feedLabel(t.f && t.f[x[2]], ri, i, x[2])));
      else { var a = el('a'); a.href = 'equipo.html?id=' + x[0]; a.appendChild(el('span', null, MAGNA.teamName(x[0]))); nm.appendChild(a); }
      row.appendChild(nm);
      if (ONE) { var g = tbd || !t.m ? el('span', 'gl', '–') : t.m.status === 'scheduled' ? el('span', 'gl', '–') : el('a', 'gl', String(x[1]) + (t.live ? '•' : '')); if (g.tagName === 'A') g.href = 'partido.html?id=' + t.m.id; row.appendChild(g); }
      else { row.appendChild(tbd ? el('span', 'sc', '–') : cell(t.ida, x[0])); row.appendChild(tbd ? el('span', 'sc', '–') : cell(t.vta, x[0])); row.appendChild(el('span', 'gl', tbd || !played(t) ? '–' : String(x[1]))); }
      cd.appendChild(row); });
    var tf = el('div', 'tf'), nxt = [t.ida, t.vta, t.des].filter(function (m) { return m && m.status === 'scheduled'; })[0];
    if (t.des) tf.appendChild(el('span', 'dz', '⚔️ Desempate ' + (t.des.status === 'finished' ? t.des.hs + '-' + t.des.as : 'pendiente')));
    if (t.win != null) tf.appendChild(el('span', null, '✓ Pasa ' + MAGNA.teamName(t.win))); else if (nxt) tf.appendChild(el('span', null, (ONE ? '' : legName(nxt) + ' · ') + (nxt.at ? fdt(nxt.at) : 'por programar'))); else if (t.a != null && t.b != null && !t.live) tf.appendChild(el('span', null, t.m && t.m.status === 'finished' ? 'Empate: se define en el panel' : 'Por programar'));
    if (tf.children.length) cd.appendChild(tf); return cd; }
  function bracket() {
    var p = $('#p-cuadro'); p.innerHTML = ''; if (!R) { p.appendChild(el('div', 'empty', 'El cuadro aparecerá cuando se inscriban los equipos y se sorteen los cruces.')); return; }
    var w = el('div', 'bk-w'), bk = el('div', 'bk'); w.appendChild(bk);
    R.forEach(function (r, ri) { var rl = real(r), col = el('div', 'bc' + (r.ties.length > 1 ? ' pr' : '')), hd = el('div', 'bc-h'), b = el('b', null, rc(r.round)[0]); b.style.setProperty('--rc', rc(r.round)[1]); hd.appendChild(b); hd.appendChild(el('small', 'mono', rl.length + (ONE ? (rl.length === 1 ? ' partido' : ' partidos') : (rl.length === 1 ? ' llave' : ' llaves')))); col.appendChild(hd);
      var bd = el('div', 'bc-b'); r.ties.forEach(function (t, i) { var sl = el('div', 'sl'); sl.appendChild(tieCard(r, ri, t, i)); bd.appendChild(sl); }); col.appendChild(bd); bk.appendChild(col); });
    var ch = champion(), cc = el('div', 'bc'), h2 = el('div', 'bc-h'), hb = el('b', null, '🏆 Campeón'); hb.style.setProperty('--rc', '#ffd23f'); h2.appendChild(hb); cc.appendChild(h2);
    var cw = el('div', 'cw' + (ch != null ? ' has' : '')), ti = el('img', 'tw'); ti.src = $('#tro').src; ti.alt = ''; cw.appendChild(ti);
    if (ch != null) { cw.appendChild(crest(ch)); cw.appendChild(el('b', null, MAGNA.teamName(ch))); cw.appendChild(el('small', null, 'Campeón de la ' + C.name)); }
    else { cw.appendChild(el('b', null, CUP.q)); cw.appendChild(el('small', null, C.teamIds.length + CUP.q2)); }
    cc.appendChild(cw); bk.appendChild(cc); p.appendChild(w);
    p.appendChild(el('p', 'hint', 'Toca un marcador para ver el partido' + (ONE ? ' · un solo partido por cruce' : ' · el global suma ida y vuelta') + (innerWidth < 760 ? ' · desliza para ver las demás rondas →' : '')));
    var ci = curRound(); if (ci > 0 && innerWidth < 760) requestAnimationFrame(function () { var c = bk.children[ci]; if (c) w.scrollLeft = c.offsetLeft - 12; }); }
  // ---------- partidos ----------
  function games() { var p = $('#p-partidos'); p.innerHTML = ''; var ms = matches(); if (!ms.length) { p.appendChild(el('div', 'empty', 'Todavía no hay partidos programados.')); return; }
    var G = {}, ord = []; ms.forEach(function (m) { var r = String(m.round || 'Partidos').split(' · ')[0]; if (!G[r]) { G[r] = []; ord.push(r); } G[r].push(m); });
    var rank = function (r) { var i = (R || []).map(function (x) { return x.round; }).indexOf(r); return i < 0 ? 99 : i; }; ord.sort(function (a, b) { return rank(b) - rank(a); });
    var num = function (m) { return ONE ? (TIE[m.id] || 99) : (m.tie || 0) + 1; };
    ord.forEach(function (r) { var g = el('div', 'rg'); g.appendChild(el('h3', null, rc(r)[0])); var l = el('div', 'ml');
      G[r].sort(function (a, b) { return num(a) - num(b) || (a.leg || 0) - (b.leg || 0); }).forEach(function (m) { var a = el('a', 'mc' + (m.status === 'live' ? ' live' : '')); a.href = 'partido.html?id=' + m.id;
        var h = el('div', 't'); h.appendChild(crest(m.home)); h.appendChild(el('span', null, MAGNA.teamName(m.home))); var mid = el('div', 'm'), aw = el('div', 't r'); aw.appendChild(crest(m.away)); aw.appendChild(el('span', null, MAGNA.teamName(m.away)));
        mid.appendChild(el('small', null, ONE ? (num(m) < 99 ? 'Partido ' + num(m) : 'Partido') : 'Llave ' + num(m) + ' · ' + legName(m))); mid.appendChild(el('b', null, m.status === 'scheduled' ? 'VS' : (m.hs || 0) + ' - ' + (m.as || 0))); mid.appendChild(el('small', null, m.status === 'live' ? '🔴 En vivo' : m.status === 'finished' ? 'Final' : m.at ? fdt(m.at) : 'Por programar'));
        a.appendChild(h); a.appendChild(mid); a.appendChild(aw); l.appendChild(a); }); g.appendChild(l); p.appendChild(g); }); }
  // ---------- equipos ----------
  function teams() { var p = $('#p-equipos'); p.innerHTML = ''; var ch = champion(), info = {};
    C.teamIds.forEach(function (id) { info[id] = { id: id, out: null, path: [] }; });
    (R || []).forEach(function (r) { r.ties.forEach(function (t) { if (t.bye) { var B = info[t.a]; if (B) B.path.push({ r: rc(r.round)[2], bye: 1 }); return; }
      [[t.a, t.b, t.ga, t.gb], [t.b, t.a, t.gb, t.ga]].forEach(function (x) { var I = info[x[0]]; if (!I || x[1] == null) return;
        I.path.push({ r: rc(r.round)[2], rv: x[1], s: played(t) ? x[2] + '-' + x[3] : null, res: t.win == null ? '' : t.win === x[0] ? 'w' : 'l' }); if (t.win != null && t.win !== x[0]) I.out = rc(r.round)[2]; }); }); });
    var L = C.teamIds.map(function (id) { return info[id]; }).sort(function (a, b) { return (a.id === ch ? -1 : 0) - (b.id === ch ? -1 : 0) || (a.out ? 1 : 0) - (b.out ? 1 : 0) || b.path.length - a.path.length || MAGNA.teamName(a.id).localeCompare(MAGNA.teamName(b.id), 'es'); });
    var g = el('div', 'tg2'); L.forEach(function (I, i) { var a = el('a', 'tm' + (I.out ? ' out' : '')); a.href = 'equipo.html?id=' + I.id; a.style.setProperty('--tc', MAGNA.teamColor ? MAGNA.teamColor(I.id) : '#ff6a1a'); a.style.animation = 'cpIn .4s both ' + i * 40 + 'ms';
      var hd = el('div', 'hd'); hd.appendChild(crest(I.id)); var t = el('div'); t.appendChild(el('b', null, MAGNA.teamName(I.id))); t.appendChild(el('span', 'st' + (I.id === ch ? ' ch' : I.out ? ' out' : ''), I.id === ch ? '🏆 Campeón' : I.out ? 'Eliminado en ' + I.out : (KIND === 'nova' ? '✨ Sigue vivo' : '🔥 Sigue vivo'))); hd.appendChild(t); a.appendChild(hd);
      if (I.path.length) { var ul = el('ul'); I.path.forEach(function (x) { var li = el('li'); li.appendChild(el('em', null, x.r)); li.appendChild(el('span', x.bye ? 'w' : x.res, x.bye ? 'Pase directo' : 'vs ' + MAGNA.teamName(x.rv) + (x.s ? ' · ' + x.s : ''))); ul.appendChild(li); }); a.appendChild(ul); }
      g.appendChild(a); }); p.appendChild(g); }
  // ---------- reglas ----------
  function rules() { var p = $('#p-reglas'); p.innerHTML = ''; var bo = C.best_of || 3, rl = el('div', 'rl');
    var R1 = ONE ? [['🎯', 'Partido único', 'Cada cruce se define en un solo partido. El que gana, avanza; el que pierde, se despide.'], ['🌠', 'Pases directos', 'Si los equipos no completan el cuadro, los primeros inscritos pasan directo a la siguiente ronda.'], ['🔀', 'Cruces', 'En cada ronda se enfrentan el primero contra el último de los que siguen vivos, el segundo contra el penúltimo, y así.']]
      : [['🔁', 'Ida y vuelta', 'Cada llave son dos partidos: uno en casa de cada equipo.'], ['➕', 'Manda el global', 'Se suman los goles de la ida y la vuelta. El que más tenga, pasa de ronda.'], ['⚔️', 'Desempate', 'Si el global queda igual, se juega un partido de desempate para definir quién avanza.']];
    R1.concat([['🎮', 'Al mejor de ' + bo, 'Cada partido se juega al mejor de ' + bo + ' sets en Brawl Stars.'], ['👑', 'Un solo campeón', 'El ganador de la gran final levanta el trofeo y suma puntos al ranking de equipos.']]).forEach(function (x) {
      var c = el('div', 'rc'); c.appendChild(el('i', null, x[0])); c.appendChild(el('b', null, x[1])); c.appendChild(el('p', null, x[2])); rl.appendChild(c); }); p.appendChild(rl);
    var tx = typeof C.rules === 'string' ? C.rules : Array.isArray(C.rules) ? C.rules.join('\n') : ''; if (tx.trim()) p.appendChild(el('div', 'desc', tx)); }
  // ---------- compartir (misma foto del cuadro que en Torneos) ----------
  function needPoster(cb) { if (window.LlavesPoster) return cb(); if (!poster) { poster = []; var sc = document.createElement('script'); sc.src = 'llaves-poster.js'; sc.onload = function () { var q = poster; poster = null; q.forEach(function (f) { f(); }); }; document.head.appendChild(sc); } poster.push(cb); }
  $('#shr').onclick = function () { var sb = this; if (!C || !R) return toast('El cuadro todavía no está listo'); sb.disabled = true; sb.textContent = '📸 Preparando la foto…';
    needPoster(function () { var st = C.state || {}, IM = {}, art = MAGNA.trophyArt(C.name, 'torneo'), tro = new Image(), wait = [];
      var ld = function (im, u) { wait.push(new Promise(function (ok) { im.onload = im.onerror = ok; im.src = u; })); return im; };
      if (art) ld(tro, art.src); C.teamIds.forEach(function (id) { var u = MAGNA.crestUrl(id); IM[id] = { name: MAGNA.teamName(id), color: MAGNA.teamColor(id), img: u ? ld(new Image(), u) : null }; });
      var fo = document.fonts && document.fonts.load ? [document.fonts.load('900 40px Archivo'), document.fonts.load('700 20px "JetBrains Mono"')] : [];
      var rounds = R.map(function (r) { return { round: r.round, ties: r.ties.map(function (t) { return t.bye ? { a: t.a, b: null, win: t.a, ga: 0, gb: 0 } : t; }) }; });
      Promise.all(wait.concat(fo).map(function (p) { return p.catch ? p.catch(function () {}) : p; })).then(function () { var cv = document.createElement('canvas');
        LlavesPoster.draw(cv, { title: C.name, sub: C.teamIds.length + ' equipos · ' + (ONE ? 'partido único' : 'llaves a ida y vuelta'), status: champion() != null ? '🏆 TERMINADO' : st.phase === 'knockout' ? '🔴 EN JUEGO · ' + String(st.round || '').toUpperCase() : '⏳ POR SORTEAR', brand: 'Magna Arena', trophy: tro, rounds: rounds, team: function (id) { return IM[id] || { name: MAGNA.teamName(id), color: MAGNA.teamColor(id) }; }, champ: champion() });
        cv.toBlob(function (bl) { sb.disabled = false; sb.textContent = '📸 Compartir el cuadro'; if (!bl) return; var fn = C.name.replace(/[^\w]+/g, '-').toLowerCase() + '-cuadro.png', f = window.File ? new File([bl], fn, { type: 'image/png' }) : null;
          if (f && navigator.canShare && navigator.canShare({ files: [f] })) return navigator.share({ files: [f], title: C.name, text: 'Así va el cuadro de ' + C.name + ' en Magna Arena ' + (KIND === 'nova' ? '✨' : '🔥') }).catch(function () {});
          var a = document.createElement('a'); a.href = URL.createObjectURL(bl); a.download = fn; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }, 'image/png'); }); }); };
  // ---------- pestañas ----------
  function tab(k) { pane = k; document.querySelectorAll('.cptabs button').forEach(function (b) { b.classList.toggle('on', b.dataset.p === k); }); ['cuadro', 'partidos', 'equipos', 'reglas'].forEach(function (x) { $('#p-' + x).hidden = x !== k; }); if (location.hash !== '#' + k) history.replaceState(null, '', location.search + (k === 'cuadro' ? '' : '#' + k)); }
  document.querySelectorAll('.cptabs button').forEach(function (b) { b.onclick = function () { tab(b.dataset.p); }; });
  // chispas de lava (Omega) o estrellas fugaces (Supernova)
  function embers() { var h = $('.cph'); if (!h || h._e || matchMedia('(prefers-reduced-motion: reduce)').matches) return; h._e = 1; for (var i = 0; i < (KIND === 'nova' ? 18 : 14); i++) { var e = el('i', KIND === 'nova' ? 'star' : 'emb'); e.style.left = (5 + Math.random() * 90) + '%'; if (KIND === 'nova') e.style.top = (4 + Math.random() * 80) + '%'; e.style.animationDelay = (-Math.random() * 6) + 's'; e.style.animationDuration = (KIND === 'nova' ? 2 + Math.random() * 3 : 4 + Math.random() * 4) + 's'; e.style.setProperty('--dx', (Math.random() * 80 - 40) + 'px'); h.appendChild(e); } }
  function render() { C = pick(); if (!C) { $('#ttl').textContent = CUP.name; $('#eyT').textContent = 'Próxima edición'; $('#p-cuadro').innerHTML = ''; $('#p-cuadro').appendChild(el('div', 'empty', 'Todavía no hay una ' + CUP.name + ' en juego. Cuando la administración la cree, aquí aparecerá su cuadro. ¡Vuelve pronto!')); embers(); return; }
    ONE = C.legs !== 2; R = ONE ? koSingle(C) : MAGNA.koTies(C); TIE = {}; if (ONE && R) R.forEach(function (r) { var k = 0; r.ties.forEach(function (t) { if (t.bye) return; k++; if (t.m) TIE[t.m.id] = k; }); });
    hero(); bracket(); games(); teams(); rules(); embers(); }
  render(); var h0 = location.hash.slice(1); if (['partidos', 'equipos', 'reglas'].indexOf(h0) >= 0) tab(h0);
  window.addEventListener('magna:update', render);
})();
