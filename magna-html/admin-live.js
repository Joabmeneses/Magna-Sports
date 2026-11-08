'use strict';
// Panel de administración · módulo «live»: se descarga solo al abrir su sección (lo carga admin.js).
ADMIN_MOD('live', function (A) {
  var $ = A.$, S = A.S, banner = A.banner, btn = A.btn, by = A.by, compName = A.compName, confirmBox = A.confirmBox, dialog = A.dialog, fdate = A.fdate, go = A.go, h = A.h, render = A.render, setsDlg = A.setsDlg, shareDlg = A.shareDlg, toast = A.toast;
  function ensureLive(m) { if (!m.live) m.live = { phase: 'pre', mode: null, clock: { acc: 0, since: null, run: false }, ev: [] }; return m.live; }
  function snap(m) { ($.UNDO[m.id] = $.UNDO[m.id] || []).push(JSON.stringify({ status: m.status, hs: m.hs, as: m.as, live: m.live || null })); if ($.UNDO[m.id].length > 40) $.UNDO[m.id].shift(); }
  function addEv(m, e) { var L = ensureLive(m); e.id = MAGNA.id(); e.at = MAGNA.now(); e.min = L.phase === 'pre' ? 0 : MAGNA.liveMinute(m); L.ev.push(e); }
  function liveAct(m, fn, msg) { snap(m); var e = fn(); if (e) { $.UNDO[m.id].pop(); return toast(e, true); } MAGNA.save(); if (msg) toast(msg); render(); banner(); }
  function lineup(tid) { var sq = squadOf(tid), st = sq.filter(function (p) { return p.slot === 'starter'; }); return (st.length ? st : sq).map(function (p) { return p.id; }); }
  function squadOf(tid) { return S().players.filter(function (p) { return p.teamId === tid; }).sort(function (a, b) { return (a.slot === 'starter' ? 0 : 1) - (b.slot === 'starter' ? 0 : 1); }); }
  function onField(m, side) { var L = m.live || {}, ids = ((L.lineup && L.lineup[side]) || []).slice(); (L.ev || []).forEach(function (e) { if (e.k === 'sub' && e.side === side) { if (e.in && ids.indexOf(e.in) < 0) ids.push(e.in); if (e.out) ids = ids.filter(function (x) { return x !== e.out; }); } }); return ids; }
  function scorerPick(m, side, cur, onPick, noneLabel) {
    var tid = side === 'a' ? m.away : m.home, sq = squadOf(tid), on = onField(m, side), L = m.live || {}, goals = {};
    (L.ev || []).forEach(function (e) { if (e.k === 'goal' && e.side === side && e.player) goals[e.player] = (goals[e.player] || 0) + 1; });
    var list = sq.slice().sort(function (a, b) { return (on.indexOf(b.id) >= 0) - (on.indexOf(a.id) >= 0); }), pk = h('div', 'pick gpick');
    if (!list.length) pk.appendChild(h('p', 'hint', MAGNA.teamName(tid) + ' no tiene jugadores registrados. Agrégalos en Jugadores para poder elegir goleador.'));
    list.forEach(function (p) { var x = h('button', cur === p.id ? 'on' : ''); x.type = 'button'; var av = h('span', 'gav', p.name.slice(0, 2).toUpperCase()); x.appendChild(av);
      var tx = h('span', 'gtx'); tx.appendChild(h('b', null, p.name)); tx.appendChild(h('em', null, on.indexOf(p.id) >= 0 ? 'En cancha' : p.slot === 'reserve' ? 'Suplente' : 'Plantilla')); x.appendChild(tx);
      if (goals[p.id]) x.appendChild(h('small', null, '⚽ ' + goals[p.id])); x.onclick = function () { onPick(p.id); }; pk.appendChild(x); });
    var nb = h('button', 'gnone' + (cur === null ? ' on' : '')); nb.type = 'button'; nb.textContent = noneLabel; nb.onclick = function () { onPick(null); }; pk.appendChild(nb);
    return pk;
  }
  function goalDlg(m, side) {
    var tid = side === 'a' ? m.away : m.home;
    dialog('⚽ Gol de ' + MAGNA.teamName(tid), function (b, close) {
      b.appendChild(h('p', 'sub', '¿Quién anotó? Toca al goleador: suma el gol al marcador y a sus estadísticas.'));
      b.appendChild(scorerPick(m, side, undefined, function (pid) { close(); liveAct(m, function () { if (side === 'a') m.as = (m.as || 0) + 1; else m.hs = (m.hs || 0) + 1; addEv(m, { k: 'goal', side: side, player: pid || null, score: m.hs + '-' + m.as }); }, pid ? '¡Gol de ' + MAGNA.playerName(pid) + '!' : '¡Gol registrado!'); }, 'Gol sin goleador (lo eliges después)'));
    });
  }
  function scorerEdit(m, ev) {
    dialog('Cambiar goleador', function (b, close) {
      b.appendChild(h('p', 'sub', 'Gol de ' + MAGNA.teamName(ev.side === 'a' ? m.away : m.home) + (ev.min ? ' al ' + ev.min + "'" : '') + (ev.score ? ' (' + ev.score + ')' : '') + '. El marcador no cambia.'));
      b.appendChild(scorerPick(m, ev.side, ev.player || null, function (pid) { close(); liveAct(m, function () { ev.player = pid || null; }, 'Goleador actualizado'); }, 'Sin goleador'));
    });
  }
  function subDlg(m) {
    dialog('Sustitución', function (b, close) {
      var side = 'h', out = null, inn = null, box = h('div'); b.appendChild(box);
      function draw() { box.innerHTML = ''; var seg = h('div', 'modes'); [['h', m.home], ['a', m.away]].forEach(function (x) { var t = h('button', 'mo' + (side === x[0] ? ' on' : ''), MAGNA.teamName(x[1])); t.type = 'button'; t.onclick = function () { side = x[0]; out = inn = null; draw(); }; seg.appendChild(t); }); box.appendChild(seg);
        var sq = squadOf(side === 'a' ? m.away : m.home), two = h('div', 'two2');
        [['Sale', function (p) { return p.id === out; }, function (p) { out = p.id; if (inn === p.id) inn = null; }], ['Entra', function (p) { return p.id === inn; }, function (p) { inn = p.id; if (out === p.id) out = null; }]].forEach(function (col) { var c = h('div'); c.appendChild(h('h2', 'x', col[0])); var pk = h('div', 'pick'); sq.forEach(function (p) { var x = h('button', col[1](p) ? 'on' : ''); x.type = 'button'; x.appendChild(document.createTextNode(p.name)); x.appendChild(h('small', null, p.slot === 'starter' ? 'Titular' : 'Suplente')); x.onclick = function () { col[2](p); draw(); }; pk.appendChild(x); }); if (!sq.length) pk.appendChild(h('p', 'hint', 'Este equipo no tiene jugadores registrados.')); c.appendChild(pk); two.appendChild(c); });
        box.appendChild(two); var r = h('div', 'row'); r.appendChild(btn('Cancelar', close)); var ok = btn('Confirmar cambio', function () { if (!out || !inn) return toast('Elige quién sale y quién entra.', true); close(); liveAct(m, function () { addEv(m, { k: 'sub', side: side, out: out, in: inn }); }, 'Sustitución registrada'); }, 'o'); r.appendChild(ok); box.appendChild(r); }
      draw();
    });
  }
  function mvpDlg(m, thenShare) {
    dialog('MVP del partido', function (b, close) {
      b.appendChild(h('p', 'sub', 'Elige al mejor jugador. Suma para su media. Es opcional.'));
      var pk = h('div', 'pick'), L = m.live || {}, ids = ((L.lineup && L.lineup.h) || []).concat((L.lineup && L.lineup.a) || []); (L.ev || []).forEach(function (e) { if (e.k === 'sub' && e.in && ids.indexOf(e.in) < 0) ids.push(e.in); });
      if (!ids.length) ids = squadOf(m.home).concat(squadOf(m.away)).map(function (p) { return p.id; });
      function pick(id) { close(); liveAct(m, function () { ensureLive(m).mvp = id; if (id) MAGNA.addNews('mvp', 'MVP de ' + MAGNA.teamName(m.home) + ' vs ' + MAGNA.teamName(m.away) + ': ' + MAGNA.playerName(id) + '.'); }, id ? 'MVP guardado' : null); if (thenShare) shareDlg(m); }
      ids.forEach(function (id) { var p = by(S().players, id); if (!p) return; var x = h('button', L.mvp === id ? 'on' : ''); x.type = 'button'; x.appendChild(document.createTextNode('⭐ ' + p.name)); x.appendChild(h('small', null, MAGNA.teamName(p.teamId))); x.onclick = function () { pick(id); }; pk.appendChild(x); });
      var nb = h('button'); nb.type = 'button'; nb.appendChild(document.createTextNode('Sin MVP')); nb.onclick = function () { pick(null); }; pk.appendChild(nb); b.appendChild(pk);
    });
  }
  function liveV(b) {
    if ($.TICK) { clearInterval($.TICK); $.TICK = null; }
    var all = S().matches.filter(function (m) { return m.status === 'live' || m.status === 'scheduled'; }).sort(function (a, c) { return (c.status === 'live') - (a.status === 'live') || String(a.at || '9').localeCompare(String(c.at || '9')); });
    var recent = S().matches.filter(function (m) { return m.status === 'finished' && m.live; }).slice(-3).reverse();
    if (!all.length && !recent.length) { var e = h('div', 'box'); e.appendChild(h('h3', 'x', 'No hay partidos para manejar')); e.appendChild(h('p', 'hint', 'Programa un partido en "Partidos" y vuelve aquí para iniciarlo y narrarlo en vivo.')); e.appendChild(btn('+ Programar partido', function () { go('partidos'); }, 'o')); b.appendChild(e); return; }
    var m = by(S().matches, $.LIVE); if (!m || (m.status !== 'live' && m.status !== 'scheduled' && !(m.status === 'finished' && m.live))) { m = all[0] || recent[0]; $.LIVE = m.id; }
    var wrap = h('div', 'lv2'), ls = h('div', 'mlist');
    function item(x) { var it = h('button', 'mi' + (x.id === m.id ? ' on' : '')); it.type = 'button'; if (x.status !== 'scheduled') it.appendChild(h('span', 'sc', (x.hs || 0) + '-' + (x.as || 0))); it.appendChild(h('b', null, MAGNA.teamName(x.home) + ' vs ' + MAGNA.teamName(x.away))); it.appendChild(h('small', null, x.status === 'live' ? '● En vivo · ' + compName(x) : x.status === 'finished' ? 'Finalizado · ' + compName(x) : fdate(x.at) + ' · ' + compName(x))); if (x.status === 'live') it.querySelector('small').style.color = 'var(--orange)'; it.onclick = function () { $.LIVE = x.id; render(); }; ls.appendChild(it); }
    var L1 = all.filter(function (x) { return x.status === 'live'; }), L2 = all.filter(function (x) { return x.status === 'scheduled'; });
    if (L1.length) { ls.appendChild(h('h4', null, 'En juego')); L1.forEach(item); }
    if (L2.length) { ls.appendChild(h('h4', null, 'Programados')); L2.slice(0, 12).forEach(item); }
    if (recent.length) { ls.appendChild(h('h4', null, 'Terminados hoy')); recent.forEach(item); }
    wrap.appendChild(ls);
    var L = m.live || { phase: 'pre', ev: [] }, live = m.status === 'live', fin = m.status === 'finished', con = h('div', 'con' + (live ? ' is-live' : ''));
    var ch = h('div', 'ch'); ch.appendChild(h('span', null, compName(m) + (m.round ? ' · ' + m.round : ''))); var phc = { pre: '', '1T': ' l', HT: ' h', '2T': ' l', FT: ' f' }; ch.appendChild(h('span', 'ph' + (fin ? ' f' : phc[L.phase] || ''), fin ? 'Finalizado' : live ? (MAGNA.PHASES[L.phase] || 'En vivo') + (L.mode ? ' · ' + L.mode : '') : 'Por empezar')); con.appendChild(ch);
    var sb = h('div', 'sb'); [['h', m.home], null, ['a', m.away]].forEach(function (x) {
      if (!x) { var mid = h('div'), sc = h('div', 's'); sc.appendChild(document.createTextNode(m.status === 'scheduled' ? 0 : m.hs || 0)); sc.appendChild(h('i')); sc.appendChild(document.createTextNode(m.status === 'scheduled' ? 0 : m.as || 0)); mid.appendChild(sc); var ck = h('div', 'clk', live || fin ? MAGNA.liveClock(m) : '00:00'); ck.appendChild(h('small', null, live && L.clock && L.clock.run ? 'Minuto ' + MAGNA.liveMinute(m) : live ? 'Reloj detenido' : fin ? 'Tiempo jugado' : fdate(m.at))); mid.appendChild(ck); sb.appendChild(mid);
        if (live && L.clock && L.clock.run) $.TICK = setInterval(function () { if (!document.body.contains(ck)) { clearInterval($.TICK); $.TICK = null; return; } ck.firstChild.nodeValue = MAGNA.liveClock(m); ck.lastChild.textContent = 'Minuto ' + MAGNA.liveMinute(m); }, 1000);
        return; }
      var t = h('div', 't'); t.appendChild(M.crest(x[1], MAGNA.teamName(x[1]), 80)); t.appendChild(h('b', null, MAGNA.teamName(x[1]))); var g = btn('+ Gol', function () { goalDlg(m, x[0]); }, 'g gb'); g.disabled = !live || L.phase === 'HT'; t.appendChild(g); sb.appendChild(t); });
    con.appendChild(sb);
    // modo de juego
    var cg = h('div', 'cg');
    if (m.sets && m.sets.length) {
      var ss = MAGNA.setScore(m), hd4 = h('h4', null, 'Sets · ' + MAGNA.teamName(m.home) + ' ' + ss.h + ' - ' + ss.a + ' ' + MAGNA.teamName(m.away)); cg.appendChild(hd4);
      var sl = h('div', 'live-sets');
      m.sets.forEach(function (x, i) { var cur = L.set === i + 1, r = h('div', 'lset' + (cur ? ' cur' : '') + (x.w ? ' done' : '')); r.style.setProperty('--mc', MAGNA.MODE_COLOR[x.mode] || 'var(--line)');
        var tx = h('div'); tx.appendChild(h('b', null, 'Set ' + (i + 1) + (cur ? ' · jugando' : ''))); tx.appendChild(h('small', null, MAGNA.setLabel(x))); r.appendChild(tx);
        var bx = h('div', 'lsb');
        if (!x.w) { var pl = btn(cur ? 'En juego' : '▶ Jugar', function () { if (!x.mode) return toast('Primero elige el modo de este set en "Editar sets".', true); liveAct(m, function () { var LL = ensureLive(m); LL.set = i + 1; LL.mode = x.mode; LL.map = x.map || null; addEv(m, { k: 'mode', set: i + 1, mode: x.mode, map: x.map || null }); }, 'Set ' + (i + 1) + ': ' + x.mode); }, cur ? 'o sm' : 'sm'); pl.disabled = fin || cur; bx.appendChild(pl);
          ['h', 'a'].forEach(function (sd) { var wb = btn('Ganó ' + MAGNA.teamName(sd === 'h' ? m.home : m.away), function () { liveAct(m, function () { x.w = sd; var sc = MAGNA.setScore(m); addEv(m, { k: 'set', set: i + 1, side: sd, score: sc.h + '-' + sc.a }); }, 'Set ' + (i + 1) + ' para ' + MAGNA.teamName(sd === 'h' ? m.home : m.away)); }, 'sm'); wb.disabled = fin || m.status !== 'live'; bx.appendChild(wb); }); }
        else { bx.appendChild(h('span', 'won', '✓ ' + MAGNA.teamName(x.w === 'h' ? m.home : m.away))); if (!fin) bx.appendChild(btn('Deshacer', function () { liveAct(m, function () { delete x.w; }, 'Set ' + (i + 1) + ' sin ganador'); }, 'sm')); }
        r.appendChild(bx); sl.appendChild(r); });
      cg.appendChild(sl); var eb = h('div', 'bar2'); eb.appendChild(btn('Editar sets', function () { setsDlg(m); }, 'sm')); cg.appendChild(eb);
    } else {
      cg.appendChild(h('h4', null, 'Modo de juego')); var md = h('div', 'modes');
      MAGNA.MODES.forEach(function (mo) { var x = h('button', 'mo' + (L.mode === mo ? ' on' : ''), mo); x.type = 'button'; x.disabled = fin; x.onclick = function () { if (L.mode === mo) return; liveAct(m, function () { ensureLive(m).mode = mo; ensureLive(m).map = null; addEv(m, { k: 'mode', mode: mo }); }, 'Modo: ' + mo); }; md.appendChild(x); });
      cg.appendChild(md); var eb2 = h('div', 'bar2'); eb2.appendChild(btn('Planear sets con modos y mapas', function () { setsDlg(m); }, 'sm')); cg.appendChild(eb2);
    }
    con.appendChild(cg);
    // controles
    var cc = h('div', 'cg'); cc.appendChild(h('h4', null, 'Control del partido')); var ct = h('div', 'ctrl');
    function cbtn(txt, cls, dis, fn) { var x = h('button', 'cb ' + cls, txt); x.type = 'button'; x.disabled = dis; x.onclick = fn; ct.appendChild(x); }
    var comp = MAGNA.compOf(m);
    cbtn('▶ Iniciar partido', 'o', m.status !== 'scheduled', function () { if (comp && comp.status === 'finished') return toast('La competición ya finalizó.', true); liveAct(m, function () { var l = ensureLive(m); m.status = 'live'; m.hs = 0; m.as = 0; l.phase = '1T'; l.lineup = { h: lineup(m.home), a: lineup(m.away) }; l.clock = { acc: 0, since: Date.now(), run: true }; addEv(m, { k: 'start' }); MAGNA.addNews('match_live', 'En vivo: ' + MAGNA.teamName(m.home) + ' vs ' + MAGNA.teamName(m.away) + '.'); }, '¡Partido en marcha!'); });
    cbtn('⏸ Entretiempo', 'y', !live || L.phase !== '1T', function () { liveAct(m, function () { var c = m.live.clock; c.acc += Date.now() - c.since; c.run = false; c.since = null; m.live.phase = 'HT'; addEv(m, { k: 'ht' }); }, 'Entretiempo'); });
    cbtn('▶ 2.º tiempo', 'g', !live || L.phase !== 'HT', function () { liveAct(m, function () { m.live.phase = '2T'; m.live.clock.since = Date.now(); m.live.clock.run = true; addEv(m, { k: 'resume' }); }, 'Comienza el 2.º tiempo'); });
    cbtn('⇄ Sustitución', '', !live, function () { subDlg(m); });
    cbtn('■ Finalizar', 'r', !live, function () { if ((m.hs || 0) === (m.as || 0)) return toast('No hay empates: registra el gol decisivo antes de finalizar.', true);
      confirmBox('¿Finalizar el partido?', MAGNA.teamName(m.home) + ' ' + m.hs + ' - ' + m.as + ' ' + MAGNA.teamName(m.away) + '. El resultado cuenta para la tabla.', 'Finalizar', function () { liveAct(m, function () { var c = m.live.clock; if (c.run) { c.acc += Date.now() - c.since; c.run = false; c.since = null; } addEv(m, { k: 'end', score: m.hs + '-' + m.as }); m.live.phase = 'FT'; m.status = 'finished'; m.ended = MAGNA.now(); MAGNA.addNews('match_result', 'Final: ' + MAGNA.teamName(m.home) + ' ' + m.hs + ' - ' + m.as + ' ' + MAGNA.teamName(m.away) + ' (' + compName(m) + ').'); }, 'Partido finalizado'); mvpDlg(m, true); }); });
    cbtn('↶ Deshacer', '', !($.UNDO[m.id] && $.UNDO[m.id].length), function () { var st = JSON.parse($.UNDO[m.id].pop()); m.status = st.status; m.hs = st.hs; m.as = st.as; if (st.live) m.live = st.live; else delete m.live; MAGNA.save(); toast('Último cambio deshecho'); render(); banner(); });
    if (fin) { cbtn('⭐ MVP' + (L.mvp ? ': ' + (MAGNA.playerName(L.mvp) || '') : ''), 'y', false, function () { mvpDlg(m, false); }); cbtn('📸 Imagen para compartir', 'o', false, function () { shareDlg(m); }); }
    cc.appendChild(ct); if (!live && !fin) cc.appendChild(h('p', 'hint', 'Inicia el partido para registrar goles, modos y sustituciones. El reloj corre solo y se detiene en el entretiempo.')); con.appendChild(cc);
    // valoraciones de los jugadores (1 a 10)
    if (live || fin) {
      var vg = h('div', 'cg'); vg.appendChild(h('h4', null, 'Valoraciones de los jugadores (1 a 10)')); var vt = h('div', 'two2 vals'), R = (m.live && m.live.ratings) || {};
      [['h', m.home], ['a', m.away]].forEach(function (sd) {
        var col = h('div', 'vcol'); col.appendChild(h('b', 'vteam', MAGNA.teamName(sd[1])));
        var ids = ((L.lineup && L.lineup[sd[0]]) || []).slice(); (L.ev || []).forEach(function (e) { if (e.k === 'sub' && e.side === sd[0] && e.in && ids.indexOf(e.in) < 0) ids.push(e.in); });
        if (!ids.length) ids = squadOf(sd[1]).map(function (p) { return p.id; });
        if (!ids.length) col.appendChild(h('p', 'hint', 'Sin jugadores registrados.'));
        ids.forEach(function (pid) { var p = by(S().players, pid); if (!p) return; var r = h('div', 'vrow'), v = R[pid];
          r.appendChild(h('span', 'vn', p.name + (String(L.mvp) === String(pid) ? ' ⭐' : '')));
          function set(nv) { liveAct(m, function () { var l = ensureLive(m); l.ratings = l.ratings || {}; if (nv == null) delete l.ratings[pid]; else l.ratings[pid] = nv; }); }
          var minus = h('button', 'vb', '−'); minus.type = 'button'; minus.setAttribute('aria-label', 'Bajar nota de ' + p.name); minus.onclick = function () { set(Math.max(1, (v == null ? 6 : v) - 0.5)); };
          var val = h('span', 'vv' + (v == null ? ' empty' : v >= 8 ? ' hi' : v < 5 ? ' lo' : ''), v == null ? '—' : String(v).replace('.', ','));
          var plus = h('button', 'vb', '+'); plus.type = 'button'; plus.setAttribute('aria-label', 'Subir nota de ' + p.name); plus.onclick = function () { set(Math.min(10, (v == null ? 6 : v) + 0.5)); };
          r.appendChild(minus); r.appendChild(val); r.appendChild(plus); col.appendChild(r); });
        vt.appendChild(col); });
      vg.appendChild(vt); vg.appendChild(h('p', 'hint', 'Empiezan en 6 al primer toque. La nota es lo que más pesa en la media del jugador; si no calificas a alguien, cuenta como 6. Puedes ajustarlas incluso después del final.'));
      con.appendChild(vg);
    }
    // línea de tiempo
    var tlw = h('div', 'cg'); tlw.appendChild(h('h4', null, 'Minuto a minuto')); var tl = h('div', 'tl');
    var ICO = { start: '▶', goal: '⚽', mode: '🎮', set: '✔', sub: '⇄', ht: '⏸', resume: '▶', end: '🏁' };
    (L.ev || []).slice().reverse().forEach(function (e) { var r = h('div', 'ev' + (e.k === 'goal' ? ' goal' : '')); r.appendChild(h('span', 'mn', e.min ? e.min + "'" : '')); r.appendChild(h('span', 'ic', ICO[e.k] || '•')); var et = h('span', null, MAGNA.eventText(m, e)); r.appendChild(et); r.appendChild(h('time', null, (e.at || '').slice(11, 16))); if (e.k === 'goal') { var eb = h('button', 'evx', e.player ? '✎ Goleador' : '+ Elegir goleador'); eb.type = 'button'; eb.title = 'Elegir o cambiar quién anotó'; eb.onclick = function () { scorerEdit(m, e); }; et.appendChild(eb); } tl.appendChild(r); });
    if (!(L.ev || []).length) tl.appendChild(h('p', 'hint', 'Aquí aparecerá cada acción del partido.'));
    tlw.appendChild(tl); con.appendChild(tlw); wrap.appendChild(con); b.appendChild(wrap);
  }

  return { liveV: liveV };
});
