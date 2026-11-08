'use strict';
// Predicción de la llave: cada usuario elige su campeón y el ganador de cada cruce de la eliminatoria.
// Las elecciones se guardan en la base de datos (pred_save) y se cierran solas cuando empieza cada partido.
window.PRED = (function () {
  var CHAMP = 10;
  // puntos por acertar el ganador de un cruce según la ronda
  function roundPts(r) { r = String(r || ''); return /semi/i.test(r) ? 4 : /cuartos/i.test(r) ? 3 : /octavos/i.test(r) ? 2 : /play.?off/i.test(r) ? 1 : /final/i.test(r) ? 6 : 2; }
  function roundOrd(r) { r = String(r || ''); return /play.?off/i.test(r) ? 0 : /ronda de/i.test(r) ? 1 : /octavos/i.test(r) ? 2 : /cuartos/i.test(r) ? 3 : /semi/i.test(r) ? 4 : /final/i.test(r) ? 5 : 1; }
  function koMatches(c) { return MAGNA.S.matches.filter(function (m) { return m.type === 'tournament' && m.cid === c.id && !m.group; })
    .sort(function (a, b) { return roundOrd(a.round) - roundOrd(b.round) || String(a.at || '9').localeCompare(String(b.at || '9')) || a.id - b.id; }); }
  function winner(m) { if (m.status !== 'finished' || m.hs == null || m.as == null || m.hs === m.as) return null; return m.hs > m.as ? m.home : m.away; }
  function locked(m) { if (m.status !== 'scheduled') return true; if (!m.at) return false; var t = Date.parse(String(m.at).replace(' ', 'T') + 'Z'); return !isNaN(t) && t <= Date.now(); }
  function champOpen(c) { var ph = c.state && c.state.phase; return c.status !== 'done' && (!ph || ph === 'groups' || ph === 'league' || ph === 'playoff'); }
  // picks: [{k:'match'|'champion', r, p}] → { pts, hits, tries }
  function score(c, picks) { var pts = 0, hits = 0, tries = 0;
    (picks || []).forEach(function (x) {
      if (x.k === 'champion') { if (c.state && c.state.phase === 'done') { tries++; if (c.state.champion === x.p) { pts += CHAMP; hits++; } } return; }
      var m = MAGNA.by(MAGNA.S.matches, x.r), w = m && winner(m); if (!w) return; tries++; if (w === x.p) { pts += roundPts(m.round); hits++; } });
    return { pts: pts, hits: hits, tries: tries }; }
  function tours() { return (MAGNA.S.tournaments || []).filter(function (c) { return c.status !== 'draft' && c.teamIds && c.teamIds.length >= 4; })
    .sort(function (a, b) { return (a.status === 'active' ? 0 : 1) - (b.status === 'active' ? 0 : 1) || ((b.format === 'champions') - (a.format === 'champions')) || b.id - a.id; }); }
  return { roundPts: roundPts, koMatches: koMatches, winner: winner, locked: locked, champOpen: champOpen, score: score, tours: tours, CHAMP: CHAMP };
})();

(function () {
  if (!document.getElementById('pd')) return;
  var h = M.h, root = document.getElementById('pd'), P = window.PRED, me = null, mine = {}, board = null, cur = null, busy = {}, loadedFor = null;
  function sb() { return window.MAGNA_SB ? window.MAGNA_SB() : Promise.reject(new Error('Sin conexión')); }
  function toast(t, bad) { var x = h('div', null, t); x.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:90;background:#131833;border:1px solid ' + (bad ? 'var(--red)' : 'var(--green)') + ';color:var(--fg);padding:12px 18px;border-radius:14px;font:600 14px Archivo,sans-serif;max-width:calc(100vw - 24px)'; document.body.appendChild(x); setTimeout(function () { x.remove(); }, 3200); }
  function key(k, r) { return k + ':' + (r || 0); }
  function myPicks() { return Object.keys(mine).map(function (k) { var a = k.split(':'); return { k: a[0], r: Number(a[1]), p: mine[k] }; }); }
  function tmBtn(tid, cls) { var b = h('button', 'pd-tm' + (cls ? ' ' + cls : '')); b.type = 'button'; b.appendChild(M.crest(tid, MAGNA.teamName(tid), 28)); b.appendChild(h('span', null, MAGNA.teamName(tid))); return b; }
  function qsTour() { var m = /[?&]t=(\d+)/.exec(location.search); return m ? Number(m[1]) : null; }

  function save(kind, ref, pick, label) {
    if (!me) { toast('Entra con tu cuenta para jugar', true); return; }
    var k = key(kind, ref); if (busy[k]) return; busy[k] = 1; var old = mine[k]; mine[k] = pick; render();
    sb().then(function (c) { return c.rpc('pred_save', { p_tour: cur.id, p_kind: kind, p_ref: ref || 0, p_pick: pick }); }).then(function (r) { delete busy[k]; if (r && r.error) throw r.error; toast(kind === 'champion' ? '🏆 Tu campeón: ' + label : '✔ Elegiste a ' + label); },
      function (e) { delete busy[k]; if (old == null) delete mine[k]; else mine[k] = old; render(); toast((e && e.message) || 'No se pudo guardar', true); })
      .catch(function (e) { delete busy[k]; if (old == null) delete mine[k]; else mine[k] = old; render(); toast((e && e.message) || 'No se pudo guardar', true); });
  }
  function load() { if (!cur) return; var id = cur.id; loadedFor = id;
    sb().then(function (c) { return Promise.all([me ? c.rpc('pred_mine', { p_tour: id }) : Promise.resolve({ data: [] }), c.rpc('pred_board', { p_tour: id })]); }).then(function (r) { if (loadedFor !== id) return;
      mine = {}; ((r[0] && r[0].data) || []).forEach(function (x) { mine[key(x.kind, x.ref)] = x.pick; }); board = (r[1] && !r[1].error && r[1].data) || []; render(); }, function () { board = []; render(); }); }

  function render() {
    var L = P.tours(); root.innerHTML = '';
    if (!L.length) { root.appendChild(hero(null)); root.appendChild(h('div', 'pd-emp', 'Todavía no hay torneos con eliminatoria. Cuando empiece la próxima Champions podrás jugar aquí.')); return; }
    if (!cur || !MAGNA.by(L, cur.id)) { var q = qsTour(); cur = (q && MAGNA.by(L, q)) || L[0]; } else cur = MAGNA.by(L, cur.id);
    if (loadedFor !== cur.id) { board = null; load(); }
    root.appendChild(hero(cur));
    if (L.length > 1) { var tb = h('div', 'pd-tabs'); L.slice(0, 6).forEach(function (c) { var b = h('button', c.id === cur.id ? 'on' : null, c.name); b.type = 'button'; b.onclick = function () { cur = c; mine = {}; history.replaceState(null, '', '?t=' + c.id); render(); }; tb.appendChild(b); }); root.appendChild(tb); }
    var rl = h('div', 'pd-rules'); [['Campeón', P.CHAMP], ['Play-off', 1], ['Octavos', 2], ['Cuartos', 3], ['Semis', 4], ['Final', 6]].forEach(function (x) { var s = h('span'); s.appendChild(document.createTextNode(x[0] + ' ')); s.appendChild(h('b', null, '+' + x[1])); rl.appendChild(s); }); root.appendChild(rl);
    if (!me) { var lg = h('div', 'pd-login'); lg.appendChild(h('span', null, '🔒 Entra con tu cuenta para guardar tus predicciones y competir por premios en Bits.')); var a = h('a', null, 'Entrar'); a.href = 'cuenta.html'; lg.appendChild(a); root.appendChild(lg); }
    champion(); rounds(); table();
  }
  function hero(c) { var s = h('section', 'pd-h'), l = h('div'); l.appendChild(h('div', 'ey', 'Juega gratis · ' + (c ? c.name : 'Magna Sports'))); l.appendChild(h('h1', 'x', 'Predicción de la llave'));
    l.appendChild(h('p', null, 'Elige a tu campeón y al ganador de cada cruce antes de que empiece. Suma puntos con cada acierto y pelea por los premios en Bits.')); s.appendChild(l);
    if (c) { var sc = h('div', 'pd-sc'), r = P.score(c, myPicks()); sc.appendChild(h('b', null, String(r.pts))); sc.appendChild(h('small', null, me ? 'Tus puntos' : 'Puntos'));
      var pos = rankOf(); sc.appendChild(h('em', null, me ? (pos ? '#' + pos + ' de ' + board.length : Object.keys(mine).length ? 'Ya estás jugando' : 'Aún no juegas') : 'Entra para jugar')); s.appendChild(sc); }
    return s; }
  function ranked() { if (!board) return []; var myName = me && me.display_name; return board.map(function (x) { var r = P.score(cur, x.picks); return { n: x.display_name, pid: x.player_id, pts: r.pts, hits: r.hits, tot: x.total, me: !!(me && ((me.player_id && x.player_id === me.player_id) || (!me.player_id && x.display_name === myName))) }; })
    .sort(function (a, b) { return b.pts - a.pts || b.hits - a.hits || a.n.localeCompare(b.n); }); }
  function rankOf() { var R = ranked(), i = -1; R.forEach(function (x, k) { if (x.me && i < 0) i = k; }); return i >= 0 ? i + 1 : null; }

  function champion() { var c = cur, open = P.champOpen(c), pick = mine[key('champion')], s = h('section', 'pd-s'), t = h('h2', 'x', '🏆 Tu campeón');
    t.appendChild(h('span', 'pd-tag' + (open ? '' : ' cl'), open ? 'Abierta' : 'Cerrada')); s.appendChild(t);
    var done = c.state && c.state.phase === 'done';
    s.appendChild(h('p', null, open ? 'Vale ' + P.CHAMP + ' puntos. Puedes cambiarlo hasta que empiece la eliminatoria.' : done ? 'Campeón: ' + MAGNA.teamName(c.state.champion) + (pick != null ? (pick === c.state.champion ? ' · ¡Acertaste! +' + P.CHAMP : ' · Esta vez no') : '') : 'La eliminatoria ya empezó. ' + (pick != null ? 'Tu elección: ' + MAGNA.teamName(pick) + '.' : 'No elegiste campeón.')));
    var g = h('div', 'pd-ch'); c.teamIds.slice().sort(function (a, b) { return MAGNA.teamName(a).localeCompare(MAGNA.teamName(b)); }).forEach(function (tid) {
      var on = pick === tid, cls = on ? 'on' : ''; if (done && on) cls += tid === c.state.champion ? ' ok' : ' ko'; var b = tmBtn(tid, cls); b.disabled = !open || !me; b.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (open && me) b.onclick = function () { if (mine[key('champion')] !== tid) save('champion', 0, tid, MAGNA.teamName(tid)); }; if (!open && !on) b.style.display = pick != null ? 'none' : ''; g.appendChild(b); });
    s.appendChild(g); root.appendChild(s); }

  function rounds() { var s = h('section', 'pd-s'); s.appendChild(h('h2', 'x', '⚔️ Cruces')); var K = P.koMatches(cur);
    if (!K.length) { s.appendChild(h('p', null, 'Elige el ganador de cada cruce antes de que empiece.')); s.appendChild(h('div', 'pd-emp', 'La eliminatoria todavía no está armada. Cuando se definan los cruces aparecerán aquí para que elijas. Mientras tanto, ¡elige a tu campeón!')); root.appendChild(s); return; }
    s.appendChild(h('p', null, 'Toca el equipo que crees que gana. Cada cruce se cierra cuando empieza el partido.'));
    var by = {}; K.forEach(function (m) { var r = m.round || 'Eliminatoria'; (by[r] = by[r] || []).push(m); });
    Object.keys(by).forEach(function (r) { var rd = h('div', 'pd-rd'), hh = h('h3', null, r); hh.appendChild(h('small', null, '+' + P.roundPts(r) + ' por acierto')); rd.appendChild(hh); var xs = h('div', 'pd-xs');
      by[r].forEach(function (m) { var lk = P.locked(m), w = P.winner(m), pick = mine[key('match', m.id)], x = h('div', 'pd-x'), wh = h('div', 'when');
        wh.appendChild(h('span', null, m.status === 'finished' ? 'Final · ' + m.hs + '-' + m.as : m.status === 'live' ? '● En juego' : m.at ? M.fdt(m.at) : 'Sin fecha')); wh.appendChild(h('b', null, lk ? '🔒 Cerrado' : '✏️ Abierto')); x.appendChild(wh);
        var two = h('div', 'two'); [m.home, m.away].forEach(function (tid, i) { var on = pick === tid, cls = on ? 'on' : ''; if (w && on) cls += w === tid ? ' ok' : ' ko'; var b = tmBtn(tid, cls); b.disabled = lk || !me; b.setAttribute('aria-pressed', on ? 'true' : 'false');
          if (!lk && me) b.onclick = function () { if (mine[key('match', m.id)] !== tid) save('match', m.id, tid, MAGNA.teamName(tid)); }; two.appendChild(b); if (!i) two.appendChild(h('span', 'vs', 'VS')); }); x.appendChild(two);
        if (w && pick != null) x.appendChild(h('div', 'res ' + (w === pick ? 'ok' : 'ko'), w === pick ? '✔ Acertaste · +' + P.roundPts(m.round) : '✘ Ganó ' + MAGNA.teamName(w)));
        else if (lk && pick == null && me) x.appendChild(h('div', 'res', 'No elegiste en este cruce'));
        xs.appendChild(x); }); rd.appendChild(xs); s.appendChild(rd); });
    root.appendChild(s); }

  function table() { var s = h('section', 'pd-s'); s.appendChild(h('h2', 'x', '📊 Tabla de predicciones'));
    if (board == null) { s.appendChild(M.skel(3)); root.appendChild(s); return; }
    var R = ranked(); s.appendChild(h('p', null, R.length ? R.length + (R.length === 1 ? ' persona juega' : ' personas juegan') + '. Las elecciones de los demás se ven cuando cada cruce se cierra.' : 'Nadie ha jugado todavía. ¡Sé el primero!'));
    if (R.length) { var bd = h('div', 'pd-bd'); R.slice(0, 50).forEach(function (x, i) { var r = h('div', 'pd-row' + (x.me ? ' me' : '')); r.appendChild(h('span', 'ps', String(i + 1))); var nm = h('div', 'nm'); if (x.pid) nm.appendChild(M.pn(x.n, x.pid)); else nm.appendChild(document.createTextNode(x.n)); nm.appendChild(h('small', null, x.hits + (x.hits === 1 ? ' acierto' : ' aciertos') + (x.me ? ' · Tú' : ''))); r.appendChild(nm); r.appendChild(h('span', 'pt', String(x.pts))); bd.appendChild(r); }); s.appendChild(bd); }
    root.appendChild(s); }

  window.addEventListener('magna:update', function () { render(); });
  function boot() { render(); if (window.ACCOUNTS) ACCOUNTS.me().then(function (a) { me = a || null; loadedFor = null; render(); }, function () {}); }
  if (document.readyState === 'complete') boot(); else addEventListener('load', boot);
})();
