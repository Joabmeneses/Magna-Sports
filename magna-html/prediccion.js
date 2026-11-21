'use strict';
// Predicción de la llave: cada usuario elige su campeón y el ganador de cada cruce de la eliminatoria.
// Las elecciones se guardan en la base de datos (pred_save) y se cierran solas cuando empieza cada partido.
window.PRED = (function () {
  var CHAMP = 10;
  // puntos por acertar el ganador de un cruce según la ronda
  function roundPts(r) { r = String(r || ''); return /dieciseisavos/i.test(r) ? 1 : /tercer/i.test(r) ? 2 : /semi/i.test(r) ? 4 : /cuartos/i.test(r) ? 3 : /octavos/i.test(r) ? 2 : /play.?off/i.test(r) ? 1 : /final/i.test(r) ? 6 : 2; }
  function roundOrd(r) { r = String(r || ''); return /play.?off/i.test(r) ? 0 : /dieciseisavos/i.test(r) ? 1 : /tercer/i.test(r) ? 4.5 : /ronda de/i.test(r) ? 1 : /octavos/i.test(r) ? 2 : /cuartos/i.test(r) ? 3 : /semi/i.test(r) ? 4 : /final/i.test(r) ? 5 : 1; }
  function koMatches(c) { return MAGNA.S.matches.filter(function (m) { return m.type === 'tournament' && m.cid === c.id && !m.group; })
    .sort(function (a, b) { return roundOrd(a.round) - roundOrd(b.round) || String(a.at || '9').localeCompare(String(b.at || '9')) || a.id - b.id; }); }
  function winner(m) { if (m.status !== 'finished' || m.hs == null || m.as == null || m.hs === m.as) return null; return m.hs > m.as ? m.home : m.away; }
  function locked(m) { if (m.status !== 'scheduled') return true; if (!m.at) return false; var t = Date.parse(String(m.at).replace(' ', 'T') + 'Z'); return !isNaN(t) && t <= Date.now(); }
  function champOpen(c) { var ph = c.state && c.state.phase; return c.status !== 'done' && (!ph || ph === 'groups' || ph === 'league' || ph === 'playoff'); }
  // ---- fase de liga: quién pasa directo (1) y quién va al play-off (2) ----
  var ZP = { 1: 3, 2: 2 };
  function zLim(c) { var n = (c.teamIds || []).length, g = (c.groups || []).length; if (g <= 1 && c.zones && typeof c.zones === 'object') return { d: Number(c.zones.d) || 0, p: Number(c.zones.p) || 0 };
    if (n < 3) return { d: 1, p: 0 }; var k = 2; while (k * 2 <= n / 2) k *= 2; return { d: k / 2, p: k }; }
  function hasLeague(c) { return c.format === 'champions' || (c.groups && c.groups.length > 0); }
  function zoneOpen(c) { var ph = (c.state && c.state.phase) || ''; return hasLeague(c) && c.status !== 'done' && c.status !== 'finished' && (ph === '' || ph === 'groups' || ph === 'league') && !c.zpClosed; }
  function zoneDone(c) { var ph = (c.state && c.state.phase) || ''; return hasLeague(c) && ph !== '' && ph !== 'groups' && ph !== 'league'; }
  function leagueTable(c) { var r = {}; (c.teamIds || []).forEach(function (t) { r[t] = { id: t, n: MAGNA.teamName(t), pj: 0, pts: 0, gf: 0, gc: 0 }; });
    MAGNA.S.matches.forEach(function (m) { if (m.type !== 'tournament' || m.cid !== c.id || !m.group || m.status !== 'finished') return; var a = r[m.home], b = r[m.away]; if (!a || !b) return;
      a.pj++; b.pj++; a.gf += m.hs; a.gc += m.as; b.gf += m.as; b.gc += m.hs; (m.hs > m.as ? a : b).pts += 3; if (c.format === 'champions') (m.hs > m.as ? b : a).pts += 1; });
    return Object.keys(r).map(function (k) { r[k].dg = r[k].gf - r[k].gc; return r[k]; }).sort(function (x, y) { return y.pts - x.pts || y.dg - x.dg || y.gf - x.gf || x.n.localeCompare(y.n, 'es'); }).map(function (x, i) { x.pos = i + 1; return x; }); }
  function zoneOf(c) { var L = zLim(c), z = {}; leagueTable(c).forEach(function (x) { z[x.id] = x.pos <= L.d ? 1 : x.pos <= L.d + L.p ? 2 : 3; }); return z; }
  // picks: [{k:'match'|'champion'|'zone', r, p}] → { pts, hits, tries }
  function score(c, picks) { var pts = 0, hits = 0, tries = 0, ZF = null;
    (picks || []).forEach(function (x) {
      if (x.k === 'zone') { if (!zoneDone(c)) return; ZF = ZF || zoneOf(c); tries++; if (ZF[x.r] === x.p) { pts += ZP[x.p] || 0; hits++; } return; }
      if (x.k === 'champion') { if (c.state && c.state.phase === 'done') { tries++; if (c.state.champion === x.p) { pts += CHAMP; hits++; } } return; }
      if (x.k === 'tie') { var t = tieAt(c, x.r); if (!t || t.win == null) return; tries++; if (t.win === x.p) { pts += roundPts(t.round); hits++; } return; }
      var m = MAGNA.by(MAGNA.S.matches, x.r), w = m && winner(m); if (!w) return; tries++; if (w === x.p) { pts += roundPts(m.round); hits++; } });
    return { pts: pts, hits: hits, tries: tries }; }
  // llave completa (eliminatoria a ida y vuelta): ref = tamaño de la ronda*100 + número de llave
  function isBracket(c) { return !!(c && c.format === 'knockout' && c.legs === 2 && MAGNA.koTies); }
  function bracket(c) { var R = isBracket(c) ? (MAGNA.koTies(c) || []) : [], n = 0; R.forEach(function (r) { var sz = r.ties.length * 2; r.size = sz; r.ties.forEach(function (t, i) { t.ref = sz * 100 + i; t.round = r.round; t.i = i; }); }); return R; }
  function tieAt(c, ref) { var B = bracket(c), sz = Math.floor(ref / 100), i = ref % 100, r = B.filter(function (x) { return x.size === sz; })[0]; return r ? r.ties[i] : null; }
  function tours() { return (MAGNA.S.tournaments || []).filter(function (c) { return c.status !== 'draft' && c.teamIds && c.teamIds.length >= 4; })
    .sort(function (a, b) { return (a.status === 'active' ? 0 : 1) - (b.status === 'active' ? 0 : 1) || ((b.format === 'champions') - (a.format === 'champions')) || b.id - a.id; }); }
  return { isBracket: isBracket, bracket: bracket, tieAt: tieAt, roundPts: roundPts, koMatches: koMatches, winner: winner, locked: locked, champOpen: champOpen, score: score, tours: tours, CHAMP: CHAMP, ZP: ZP, zLim: zLim, hasLeague: hasLeague, zoneOpen: zoneOpen, zoneDone: zoneDone, leagueTable: leagueTable, zoneOf: zoneOf };
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
    var k = key(kind, ref); if (busy[k]) return; busy[k] = 1; var old = mine[k]; if (pick === 0) delete mine[k]; else mine[k] = pick; render();
    sb().then(function (c) { return c.rpc('pred_save', { p_tour: cur.id, p_kind: kind, p_ref: ref || 0, p_pick: pick }); }).then(function (r) { delete busy[k]; if (r && r.error) throw r.error; toast(kind === 'champion' ? '🏆 Tu campeón: ' + label : kind === 'zone' ? label : '✔ Elegiste a ' + label); },
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
    var rl = h('div', 'pd-rules'); (P.hasLeague(cur) ? [['Pasa directo', P.ZP[1]], ['Va al play-off', P.ZP[2]]] : []).concat([['Campeón', P.CHAMP], ['Cruce de play-off', 1], ['Octavos', 2], ['Cuartos', 3], ['Semis', 4], ['Final', 6]]).forEach(function (x) { var s = h('span'); s.appendChild(document.createTextNode(x[0] + ' ')); s.appendChild(h('b', null, '+' + x[1])); rl.appendChild(s); }); root.appendChild(rl);
    if (!me) { var lg = h('div', 'pd-login'); lg.appendChild(h('span', null, '🔒 Entra con tu cuenta para guardar tus predicciones y competir por premios en Bits.')); var a = h('a', null, 'Entrar'); a.href = 'cuenta.html'; lg.appendChild(a); root.appendChild(lg); }
    if (P.hasLeague(cur)) zones(); if (P.isBracket(cur)) bracketView(); else { champion(); rounds(); } table();
  }
  function hero(c) { var s = h('section', 'pd-h'), l = h('div'); l.appendChild(h('div', 'ey', 'Juega gratis · ' + (c ? c.name : 'Magna Sports'))); l.appendChild(h('h1', 'x', 'Predicción de la llave'));
    l.appendChild(h('p', null, (c && P.hasLeague(c) ? 'Adivina quién pasa directo y quién va al play-off, elige' : 'Elige') + ' a tu campeón y al ganador de cada cruce antes de que empiece. Suma puntos con cada acierto y pelea por los premios en Bits.')); s.appendChild(l);
    if (c) { var sc = h('div', 'pd-sc'), r = P.score(c, myPicks()); sc.appendChild(h('b', null, String(r.pts))); sc.appendChild(h('small', null, me ? 'Tus puntos' : 'Puntos'));
      var pos = rankOf(); sc.appendChild(h('em', null, me ? (pos ? '#' + pos + ' de ' + board.length : Object.keys(mine).length ? 'Ya estás jugando' : 'Aún no juegas') : 'Entra para jugar')); s.appendChild(sc); }
    return s; }
  function ranked() { if (!board) return []; var myName = me && me.display_name; return board.map(function (x) { var r = P.score(cur, x.picks); return { n: x.display_name, pid: x.player_id, pts: r.pts, hits: r.hits, tot: x.total, me: !!(me && ((me.player_id && x.player_id === me.player_id) || (!me.player_id && x.display_name === myName))) }; })
    .sort(function (a, b) { return b.pts - a.pts || b.hits - a.hits || a.n.localeCompare(b.n); }); }
  function rankOf() { var R = ranked(), i = -1; R.forEach(function (x, k) { if (x.me && i < 0) i = k; }); return i >= 0 ? i + 1 : null; }

  function champion() { var c = cur, open = P.champOpen(c), pick = mine[key('champion')], s = h('section', 'pd-s pd-paper'), t = h('h2', 'x', '🏆 Tu campeón');
    t.appendChild(h('span', 'pd-tag' + (open ? '' : ' cl'), open ? 'Abierta' : 'Cerrada')); s.appendChild(t);
    var done = c.state && c.state.phase === 'done';
    s.appendChild(h('p', null, open ? 'Vale ' + P.CHAMP + ' puntos. Puedes cambiarlo hasta que empiece la eliminatoria.' : done ? 'Campeón: ' + MAGNA.teamName(c.state.champion) + (pick != null ? (pick === c.state.champion ? ' · ¡Acertaste! +' + P.CHAMP : ' · Esta vez no') : '') : 'La eliminatoria ya empezó. ' + (pick != null ? 'Tu elección: ' + MAGNA.teamName(pick) + '.' : 'No elegiste campeón.')));
    var g = h('div', 'pd-ch'); c.teamIds.slice().sort(function (a, b) { return MAGNA.teamName(a).localeCompare(MAGNA.teamName(b)); }).forEach(function (tid) {
      var on = pick === tid, cls = on ? 'on' : ''; if (done && on) cls += tid === c.state.champion ? ' ok' : ' ko'; var b = tmBtn(tid, cls); b.disabled = !open || !me; b.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (open && me) b.onclick = function () { if (mine[key('champion')] !== tid) save('champion', 0, tid, MAGNA.teamName(tid)); }; if (!open && !on) b.style.display = pick != null ? 'none' : ''; g.appendChild(b); });
    s.appendChild(g); root.appendChild(s); }

  function zones() { var c = cur, open = P.zoneOpen(c), done = P.zoneDone(c), L = P.zLim(c), T = P.leagueTable(c), ZF = done ? P.zoneOf(c) : null, s = h('section', 'pd-s pd-z pd-paper');
    var t = h('h2', 'x', '📋 Fase de liga: ¿quién clasifica?'); t.appendChild(h('span', 'pd-tag' + (open ? '' : ' cl'), open ? 'Abierta' : 'Cerrada')); s.appendChild(t);
    var cnt = { 1: 0, 2: 0 }; c.teamIds.forEach(function (tid) { var v = mine[key('zone', tid)]; if (v) cnt[v]++; });
    s.appendChild(h('p', null, open ? 'Marca a los ' + L.d + ' que crees que pasan directo (+' + P.ZP[1] + ' c/u) y a los ' + L.p + ' que van al play-off (+' + P.ZP[2] + ' c/u). Los que no marques son tus eliminados. Puedes cambiarlo hasta que la administración cierre la predicción o termine la fase de liga.'
      : done ? 'La fase de liga terminó. Así te fue:' : 'La predicción ya cerró. Los puntos llegan cuando termine la fase de liga.'));
    var bar = h('div', 'pd-zb'); [[1, 'Directo', L.d], [2, 'Play-off', L.p]].forEach(function (x) { var b = h('div', 'pd-zc z' + x[0] + (cnt[x[0]] >= x[2] ? ' full' : '')); b.appendChild(h('b', null, cnt[x[0]] + '/' + x[2])); b.appendChild(h('small', null, x[1])); var pr = h('i'); pr.style.width = (x[2] ? Math.min(100, cnt[x[0]] / x[2] * 100) : 0) + '%'; b.appendChild(pr); bar.appendChild(b); });
    if (open && me) { var cp = h('button', 'pd-cp', '🪄 Copiar la tabla actual'); cp.type = 'button'; cp.title = 'Marca a los equipos según cómo van ahora en la tabla'; cp.onclick = function () { copyTable(T, L); }; bar.appendChild(cp); }
    s.appendChild(bar);
    // tabla de cada grupo de la fase, para decidir con datos
    var G = (c.groups && c.groups.length ? c.groups : [{ name: '', teamIds: c.teamIds }]);
    function gtab(g) { var r = {}; g.teamIds.forEach(function (t) { r[t] = { id: t, n: MAGNA.teamName(t), pj: 0, g: 0, p: 0, gf: 0, gc: 0, pts: 0, f: [] }; });
      MAGNA.S.matches.filter(function (m) { return m.type === 'tournament' && m.cid === c.id && m.group != null && (!g.name || String(m.group) === String(g.name)) && m.status === 'finished'; })
        .sort(function (x, y) { return String(x.at || '').localeCompare(String(y.at || '')); }).forEach(function (m) { var A = r[m.home], B = r[m.away]; if (!A || !B) return;
          A.pj++; B.pj++; A.gf += m.hs; A.gc += m.as; B.gf += m.as; B.gc += m.hs; var hw = m.hs > m.as; (hw ? A : B).g++; (hw ? B : A).p++; (hw ? A : B).pts += 3; if (c.format === 'champions') (hw ? B : A).pts += 1; A.f.push(hw ? 'V' : 'D'); B.f.push(hw ? 'D' : 'V'); });
      return Object.keys(r).map(function (k) { r[k].dg = r[k].gf - r[k].gc; return r[k]; }).sort(function (x, y) { return y.pts - x.pts || y.dg - x.dg || y.gf - x.gf || x.n.localeCompare(y.n, 'es'); }); }
    var gw = h('div', 'pd-gw');
    G.forEach(function (g) { var box = h('div', 'pd-gb'); box.appendChild(h('div', 'pd-gh', g.name ? 'GRUPO ' + String(g.name).toUpperCase() : 'FASE DE LIGA'));
      var hdr = h('div', 'pd-gr pd-gcol'); ['#', 'Equipo', 'PJ', 'G', 'P', 'DG', 'PTS', 'Racha', 'Tu predicción'].forEach(function (t) { hdr.appendChild(h('span', null, t)); }); box.appendChild(hdr);
      gtab(g).forEach(function (x, i) { var tid = x.id, v = mine[key('zone', tid)] || 0, real = ZF && ZF[tid], r = h('div', 'pd-gr' + (v ? ' z' + v : ''));
        r.appendChild(h('span', 'pd-gp', String(i + 1))); var tm = h('span', 'pd-gt'); tm.appendChild(M.crest(tid, x.n, 26)); tm.appendChild(h('b', null, x.n)); r.appendChild(tm);
        [x.pj, x.g, x.p, (x.dg > 0 ? '+' : '') + x.dg].forEach(function (val) { r.appendChild(h('span', 'pd-gn', String(val))); }); r.appendChild(h('span', 'pd-gn pts', String(x.pts)));
        var fm = h('span', 'pd-gf'); x.f.slice(-4).forEach(function (q) { fm.appendChild(h('i', q === 'V' ? 'w' : 'l', q)); }); if (!x.f.length) fm.appendChild(h('small', null, '—')); r.appendChild(fm);
        var sg = h('div', 'pd-zs'); [[1, 'Directo'], [2, 'Play-off']].forEach(function (o) { var on = v === o[0], b = h('button', on ? 'on' : null, o[1]); b.type = 'button'; b.setAttribute('aria-pressed', on ? 'true' : 'false');
          var full = !on && cnt[o[0]] >= (o[0] === 1 ? L.d : L.p); b.disabled = !open || !me || full; if (full && open) b.title = 'Ya llenaste estos cupos: quita a otro equipo primero';
          if (open && me) b.onclick = function () { save('zone', tid, on ? 0 : o[0], on ? x.n + ': eliminado en tu predicción' : '✔ ' + x.n + ' → ' + o[1]); }; sg.appendChild(b); });
        if (real) { var mp = v || 3, ok = mp === real; sg.appendChild(h('em', 'pd-zres ' + (ok ? 'ok' : 'ko'), ok ? (v ? '✔ +' + P.ZP[v] : '✔ Fuera') : '✘ ' + ['', 'Directo', 'Play-off', 'Fuera'][real])); }
        r.appendChild(sg); box.appendChild(r); });
      gw.appendChild(box); });
    s.appendChild(gw);
    root.appendChild(s); }
  function copyTable(T, L) { var steps = [], fill = [];
    T.forEach(function (x) { var w = x.pos <= L.d ? 1 : x.pos <= L.d + L.p ? 2 : 0, cu = mine[key('zone', x.id)] || 0; if (cu === w) return; if (cu) steps.push([x.id, 0]); if (w) fill.push([x.id, w]); });
    steps = steps.concat(fill); if (!steps.length) return toast('Tu predicción ya es igual a la tabla actual');
    toast('Copiando la tabla…'); sb().then(function (c) { return steps.reduce(function (pr, st) { return pr.then(function () { return c.rpc('pred_save', { p_tour: cur.id, p_kind: 'zone', p_ref: st[0], p_pick: st[1] }).then(function (r) { if (r && r.error) throw r.error; if (st[1]) mine[key('zone', st[0])] = st[1]; else delete mine[key('zone', st[0])]; }); }); }, Promise.resolve()); })
      .then(function () { render(); toast('🪄 Listo: tu predicción copia la tabla actual. Ajusta lo que quieras.'); }, function (e) { load(); toast((e && e.message) || 'No se pudo copiar', true); }); }
  function rounds() { var s = h('section', 'pd-s pd-paper'); s.appendChild(h('h2', 'x', '⚔️ Cruces')); var K = P.koMatches(cur);
    if (!K.length) { s.appendChild(h('p', null, 'Elige el ganador de cada cruce antes de que empiece.')); s.appendChild(h('div', 'pd-emp', 'La eliminatoria todavía no está armada. Cuando se definan los cruces aparecerán aquí para que elijas. Mientras tanto, ¡elige a tu campeón!')); root.appendChild(s); return; }
    s.appendChild(h('p', null, 'Toca el equipo que crees que gana: queda marcado como tu ELECCIÓN. Cada cruce se cierra cuando empieza el partido.'));
    var by = {}; K.forEach(function (m) { var r = m.round || 'Eliminatoria'; (by[r] = by[r] || []).push(m); });
    function short(n) { n = String(n || ''); var w = n.trim().split(/\s+/); return w.length > 1 ? w.map(function (x) { return x[0]; }).join('').slice(0, 4).toUpperCase() : n.slice(0, 5).toUpperCase(); }
    Object.keys(by).forEach(function (r) { var rd = h('div', 'pd-rd'), hh = h('h3', 'pd-rt', r.toUpperCase()); hh.appendChild(h('small', null, '+' + P.roundPts(r) + ' pts por acierto')); rd.appendChild(hh); var xs = h('div', 'pd-xs');
      by[r].forEach(function (m, mi) { var lk = P.locked(m), w = P.winner(m), pick = mine[key('match', m.id)], x = h('div', 'pd-x2' + (lk ? ' lk' : '') + (pick != null ? ' has' : ''));
        x.style.setProperty('--i', mi);
        var hd = h('div', 'pd-xh'); hd.appendChild(h('b', null, r)); x.appendChild(hd);
        var two = h('div', 'pd-two');
        [m.home, m.away].forEach(function (tid, i) { var on = pick === tid, nm = MAGNA.teamName(tid), b = h('button', 'pd-sd ' + (i ? 'a' : 'h') + (on ? ' on' : '') + (pick != null && !on ? ' off' : '') + (w && on ? (w === tid ? ' ok' : ' ko') : '') + (w === tid ? ' win' : ''));
          b.type = 'button'; b.disabled = lk || !me; b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.setAttribute('aria-label', 'Elegir a ' + nm);
          var cw = h('span', 'pd-cw'); cw.appendChild(M.crest(tid, nm, 96)); b.appendChild(cw);
          b.appendChild(h('span', 'pd-nm', nm.length > 9 ? short(nm) : nm.toUpperCase())); b.title = nm;
          b.appendChild(h('span', 'pd-el', w && on ? (w === tid ? '✔ ACIERTO' : '✘ FALLASTE') : 'ELECCIÓN'));
          if (!lk && me) b.onclick = function () { if (mine[key('match', m.id)] !== tid) save('match', m.id, tid, nm); };
          two.appendChild(b); });
        x.appendChild(two);
        if (w && pick != null) x.appendChild(h('div', 'pd-res ' + (w === pick ? 'ok' : 'ko'), w === pick ? '✔ Acertaste · +' + P.roundPts(m.round) + ' pts' : '✘ Ganó ' + MAGNA.teamName(w)));
        else if (lk && pick == null && me) x.appendChild(h('div', 'pd-res', 'No elegiste en este cruce'));
        else if (!lk && pick == null) x.appendChild(h('div', 'pd-res hint', me ? '👆 Toca un equipo para elegir' : '🔒 Entra para elegir'));
        var wr = h('div', 'pd-xwr'); wr.appendChild(x); wr.appendChild(h('div', 'pd-inf', (m.status === 'finished' ? 'Final · ' + m.hs + '-' + m.as : m.status === 'live' ? '● En juego' : m.at ? M.fdt(m.at) : 'Sin fecha') + ' · ' + (lk ? '🔒 Cerrado' : '✏️ Abierto')));
        xs.appendChild(wr); }); rd.appendChild(xs); s.appendChild(rd); });
    root.appendChild(s); }

  // ---------- llave completa: lo que eliges en una ronda pasa a la siguiente con su rival ----------
  function bracketView() { var c = cur, B = P.bracket(c), s = h('section', 'pd-s pd-paper'); s.appendChild(h('h2', 'x', '⚔️ Arma tu llave'));
    if (!B.length || !B[0].ties.some(function (t) { return t.a != null; })) { s.appendChild(h('p', null, 'Elige quién pasa en cada llave y tu elección avanza a la siguiente ronda.')); s.appendChild(h('div', 'pd-emp', 'La administración todavía no arma las llaves. Cuando estén listas podrás predecir todo el cuadro hasta la final.')); root.appendChild(s); return; }
    s.appendChild(h('p', null, 'Toca el equipo que crees que pasa en cada llave (ida y vuelta). Tu ELECCIÓN avanza sola a la siguiente ronda contra el rival que elegiste en la otra llave, hasta la final. Cada llave se cierra cuando empieza su partido de ida.'));
    var prev = null;
    B.forEach(function (r, ri) { var rd = h('div', 'pd-rd'), hh = h('h3', 'pd-rt', r.round.toUpperCase()); hh.appendChild(h('small', null, '+' + P.roundPts(r.round) + ' pts por acierto')); rd.appendChild(hh); var xs = h('div', 'pd-xs');
      r.ties.forEach(function (t, i) {
        var feed = prev ? [prev[2 * i], prev[2 * i + 1]] : [null, null];
        // equipos de la llave: los reales si ya se saben; si no, los que tú hiciste pasar en las llaves anteriores
        var tm = [t.a, t.b].map(function (real, k) { if (real != null) return { id: real, real: true }; var f = feed[k], pk = f && mine[key('tie', f.ref)]; return pk != null ? { id: pk, real: false } : null; });
        t.shown = tm;
        var lk = !!(t.ida && P.locked(t.ida)) || (c.state && c.state.phase === 'done'), pick = mine[key('tie', t.ref)], w = t.win;
        var valid = pick != null && tm.some(function (x) { return x && x.id === pick; });
        var x = h('div', 'pd-x2' + (lk ? ' lk' : '') + (valid ? ' has' : '')); var hd = h('div', 'pd-xh'); hd.appendChild(h('b', null, r.round)); x.appendChild(hd);
        var two = h('div', 'pd-two');
        tm.forEach(function (T, k) { var b = h('button', 'pd-sd ' + (k ? 'a' : 'h')); b.type = 'button';
          if (!T) { b.className += ' tbd'; b.disabled = true; b.appendChild(h('span', 'pd-cw', '?')); b.appendChild(h('span', 'pd-nm', 'POR DEFINIR')); b.appendChild(h('span', 'pd-el', 'ELECCIÓN')); two.appendChild(b); return; }
          var nm = MAGNA.teamName(T.id), on = valid && pick === T.id;
          if (on) b.className += ' on'; else if (valid) b.className += ' off'; if (w != null && on) b.className += w === T.id ? ' ok' : ' ko'; if (w === T.id) b.className += ' win'; if (!T.real) b.className += ' guess';
          b.disabled = lk || !me || !tm[0] || !tm[1]; b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.title = nm + (T.real ? '' : ' (según tu predicción)');
          var cw = h('span', 'pd-cw'); cw.appendChild(M.crest(T.id, nm, 96)); b.appendChild(cw); b.appendChild(h('span', 'pd-nm', nm.toUpperCase()));
          if (!T.real) b.appendChild(h('span', 'pd-gs', 'TU PREDICCIÓN'));
          b.appendChild(h('span', 'pd-el', w != null && on ? (w === T.id ? '✔ ACIERTO' : '✘ FALLASTE') : 'ELECCIÓN'));
          if (!b.disabled) b.onclick = function () { if (mine[key('tie', t.ref)] !== T.id) pickTie(B, ri, i, T.id, nm); };
          two.appendChild(b); });
        x.appendChild(two);
        if (w != null && pick != null) x.appendChild(h('div', 'pd-res ' + (w === pick ? 'ok' : 'ko'), w === pick ? '✔ Acertaste · +' + P.roundPts(r.round) + ' pts' : '✘ Pasó ' + MAGNA.teamName(w)));
        else if (pick != null && !valid) x.appendChild(h('div', 'pd-res ko', '✘ Tu equipo ya no está en esta llave'));
        else if (!tm[0] || !tm[1]) x.appendChild(h('div', 'pd-res', 'Elige primero en las llaves anteriores'));
        else if (lk && pick == null && me) x.appendChild(h('div', 'pd-res', 'No elegiste en esta llave'));
        else if (!lk && pick == null) x.appendChild(h('div', 'pd-res hint', me ? '👆 Toca quién pasa' : '🔒 Entra para elegir'));
        var inf = []; if (t.ida) inf.push('Ida ' + (t.ida.status === 'finished' ? t.ida.hs + '-' + t.ida.as : t.ida.at ? M.fdt(t.ida.at) : 'sin fecha')); if (t.vta) inf.push('Vuelta ' + (t.vta.status === 'finished' ? t.vta.hs + '-' + t.vta.as : t.vta.at ? M.fdt(t.vta.at) : 'sin fecha'));
        if (t.ida && t.ida.status === 'finished' && t.vta && t.vta.status === 'finished') inf.push('Global ' + t.ga + '-' + t.gb); if (!inf.length) inf.push('Llave ' + (i + 1)); inf.push(lk ? '🔒 Cerrada' : '✏️ Abierta');
        var wr = h('div', 'pd-xwr'); wr.style.animationDelay = i * 80 + 'ms'; wr.appendChild(x); wr.appendChild(h('div', 'pd-inf', inf.join(' · '))); xs.appendChild(wr); });
      rd.appendChild(xs); s.appendChild(rd); prev = r.ties; });
    // tu campeón = quien hiciste ganar la final
    var fin = B[B.length - 1].ties[0], ch = fin && mine[key('tie', fin.ref)], cb = h('div', 'pd-champ'); cb.appendChild(h('small', null, '🏆 TU CAMPEÓN'));
    if (ch != null) { cb.appendChild(M.crest(ch, MAGNA.teamName(ch), 84)); cb.appendChild(h('b', null, MAGNA.teamName(ch).toUpperCase())); } else cb.appendChild(h('b', null, 'COMPLETA LA LLAVE HASTA LA FINAL'));
    s.appendChild(cb); root.appendChild(s); }
  // elegir en una llave: si cambias de equipo, se borra en las rondas siguientes donde lo habías hecho avanzar
  function pickTie(B, ri, i, team, label) { if (!me) return toast('Entra con tu cuenta para jugar', true);
    var steps = [[B[ri].ties[i].ref, team]], old = mine[key('tie', B[ri].ties[i].ref)];
    if (old != null) for (var r = ri + 1, j = i >> 1; r < B.length; r++, j >>= 1) { var rf = B[r].ties[j].ref; if (mine[key('tie', rf)] === old) steps.push([rf, 0]); else break; }
    steps.forEach(function (st) { if (st[1]) mine[key('tie', st[0])] = st[1]; else delete mine[key('tie', st[0])]; }); render();
    sb().then(function (c) { return steps.reduce(function (pr, st) { return pr.then(function () { return c.rpc('pred_save', { p_tour: cur.id, p_kind: 'tie', p_ref: st[0], p_pick: st[1] }).then(function (r) { if (r && r.error) throw r.error; }); }); }, Promise.resolve()); })
      .then(function () { toast('✔ ' + label + ' pasa' + (steps.length > 1 ? ' · se borró ' + (steps.length - 1 === 1 ? '1 elección' : (steps.length - 1) + ' elecciones') + ' que dependían del equipo anterior' : '')); }, function (e) { load(); toast((e && e.message) || 'No se pudo guardar', true); }); }

  function table() { var s = h('section', 'pd-s pd-paper'); s.appendChild(h('h2', 'x', '📊 Tabla de predicciones'));
    if (board == null) { s.appendChild(M.skel(3)); root.appendChild(s); return; }
    var R = ranked(); s.appendChild(h('p', null, R.length ? R.length + (R.length === 1 ? ' persona juega' : ' personas juegan') + '. Las elecciones de los demás se ven cuando cada cruce se cierra.' : 'Nadie ha jugado todavía. ¡Sé el primero!'));
    if (R.length) { var bd = h('div', 'pd-bd'); R.slice(0, 50).forEach(function (x, i) { var r = h('div', 'pd-row' + (x.me ? ' me' : '')); r.appendChild(h('span', 'ps', String(i + 1))); var nm = h('div', 'nm'); if (x.pid) nm.appendChild(M.pn(x.n, x.pid)); else nm.appendChild(document.createTextNode(x.n)); nm.appendChild(h('small', null, x.hits + (x.hits === 1 ? ' acierto' : ' aciertos') + (x.me ? ' · Tú' : ''))); r.appendChild(nm); r.appendChild(h('span', 'pt', String(x.pts))); bd.appendChild(r); }); s.appendChild(bd); }
    root.appendChild(s); }

  window.addEventListener('magna:update', function () { render(); });
  function boot() { render(); if (window.ACCOUNTS) ACCOUNTS.me().then(function (a) { me = a || null; loadedFor = null; render(); }, function () {}); }
  if (document.readyState === 'complete') boot(); else addEventListener('load', boot);
})();
