'use strict';
// Panel de administración · módulo «live»: se descarga solo al abrir su sección (lo carga admin.js).
ADMIN_MOD('live', function (A) {
  var $ = A.$, S = A.S, banner = A.banner, btn = A.btn, by = A.by, compName = A.compName, confirmBox = A.confirmBox, dialog = A.dialog, fdate = A.fdate, go = A.go, h = A.h, render = A.render, setsDlg = A.setsDlg, shareDlg = A.shareDlg, toast = A.toast;
  var CELE = null, LSC = {};
  // atajos de teclado en la consola en vivo: Q gol local · P gol visitante · S cambio · Z deshacer · N siguiente paso
  if (!window.__lvKeys) { window.__lvKeys = 1; document.addEventListener('keydown', function (e) { if ($.tab !== 'vivo' || e.ctrlKey || e.metaKey || e.altKey) return; var tg = e.target; if (tg && (/^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName) || tg.isContentEditable) || document.querySelector('.ov')) return;
    var k = String(e.key || '').toLowerCase(), b = document.querySelector('#view [data-k="' + k + '"]'); if (!b || b.disabled) return; e.preventDefault(); b.click(); }); }
  function kbd(el, k) { el.setAttribute('data-k', k); el.appendChild(h('kbd', 'lk-k', k.toUpperCase())); return el; }
  function ensureLive(m) { if (!m.live) m.live = { phase: 'pre', mode: null, clock: { acc: 0, since: null, run: false }, ev: [] }; return m.live; }
  function snap(m) { ($.UNDO[m.id] = $.UNDO[m.id] || []).push(JSON.stringify({ status: m.status, hs: m.hs, as: m.as, wo: m.wo || null, ended: m.ended || null, live: m.live || null })); if ($.UNDO[m.id].length > 40) $.UNDO[m.id].shift(); }
  function addEv(m, e) { var L = ensureLive(m); e.id = MAGNA.id(); e.at = MAGNA.now(); e.min = L.phase === 'pre' ? 0 : MAGNA.liveMinute(m); L.ev.push(e); }
  // Draft de un set: bloqueos y elecciones de brawlers; se ve en vivo en el marcador de OBS
  var BRAWLERS = ['8-Bit','Alli','Amber','Angelo','Ash','Barley','Bea','Belle','Berry','Bibi','Bo','Bonnie','Brock','Bull','Buster','Buzz','Byron','Carl','Charlie','Chester','Chuck','Clancy','Colette','Colt','Cordelius','Crow','Darryl','Doug','Draco','Dynamike','Edgar','El Primo','Emz','Eve','Fang','Finx','Frank','Gale','Gene','Gigi','Gray','Griff','Grom','Gus','Hank','Jacky','Jae-yong','Janet','Jessie','Juju','Kaze','Kenji','Kit','Larry & Lawrie','Leon','Lily','Lola','Lou','Lumi','Maisie','Mandy','Max','Meeple','Meg','Melodie','Mico','Mina','Moe','Mortis','Mr. P','Nani','Nita','Ollie','Otis','Pam','Pearl','Penny','Piper','Poco','R-T','Rico','Rosa','Ruffs','Sam','Sandy','Shade','Shelly','Spike','Sprout','Squeak','Stu','Surge','Tara','Tick','Trunk','Willow','Ziggy'];
  function draftDlg(m, i) { var x = m.sets[i];
    dialog('🎯 Draft · Set ' + (i + 1) + (x.mode ? ' · ' + x.mode : ''), function (b, close) {
      b.appendChild(h('p', 'sub', 'Escribe los brawlers a medida que los equipos bloquean y eligen. Con «Mostrar en la transmisión» activado, el marcador de OBS muestra el draft a pantalla completa y se actualiza solo. Orden de elección: 1 · 2-2 · 2-2 · 1.'));
      var dl = document.getElementById('brawl-dl'); if (!dl) { dl = h('datalist'); dl.id = 'brawl-dl'; BRAWLERS.forEach(function (n) { var o = h('option'); o.value = n; dl.appendChild(o); }); document.body.appendChild(dl); }
      var d = JSON.parse(JSON.stringify(x.draft || { first: 'h', bans: { h: [], a: [] }, picks: { h: [], a: [] } }));
      var fr = h('label', 'f', 'Primera elección'), fs = h('select', 'in'); ['h', 'a'].forEach(function (k) { var o = h('option', null, MAGNA.teamName(k === 'h' ? m.home : m.away)); o.value = k; if (d.first === k) o.selected = true; fs.appendChild(o); }); fr.appendChild(fs); b.appendChild(fr);
      var gr = h('div'); gr.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-top:10px';
      var ins = { bans: { h: [], a: [] }, picks: { h: [], a: [] } };
      ['h', 'a'].forEach(function (k) { var col = h('div'); col.appendChild(h('h4', null, MAGNA.teamName(k === 'h' ? m.home : m.away)));
        [['bans', '⛔ Bloqueos'], ['picks', '✅ Elecciones']].forEach(function (t) { col.appendChild(h('small', 'hint', t[1])); for (var j = 0; j < 3; j++) { var inp = h('input', 'in'); inp.setAttribute('list', 'brawl-dl'); inp.maxLength = 24; inp.placeholder = t[0] === 'bans' ? 'Bloqueo ' + (j + 1) : 'Elección ' + (j + 1); inp.value = (d[t[0]][k] || [])[j] || ''; inp.style.marginBottom = '6px'; ins[t[0]][k].push(inp); col.appendChild(inp); } });
        gr.appendChild(col); });
      b.appendChild(gr);
      var sh = h('label', 'f'); var cb = h('input'); cb.type = 'checkbox'; cb.checked = (m.live && m.live.draft) === i + 1; sh.appendChild(cb); sh.appendChild(document.createTextNode(' Mostrar en la transmisión ahora')); sh.style.cssText = 'display:flex;align-items:center;gap:8px;margin-top:12px'; b.appendChild(sh);
      function read() { var o = { first: fs.value, bans: { h: [], a: [] }, picks: { h: [], a: [] } }; ['bans', 'picks'].forEach(function (t) { ['h', 'a'].forEach(function (k) { o[t][k] = ins[t][k].map(function (n) { return n.value.trim().slice(0, 24); }); }); }); return o; }
      function save(msg) { liveAct(m, function () { x.draft = read(); var L = ensureLive(m); L.draft = cb.checked ? i + 1 : 0; }, msg); }
      var tm = null; b.addEventListener('change', function () { clearTimeout(tm); tm = setTimeout(function () { save(); }, 250); });
      var r = h('div', 'row'); r.appendChild(btn('Vaciar', function () { ['bans', 'picks'].forEach(function (t) { ['h', 'a'].forEach(function (k) { ins[t][k].forEach(function (n) { n.value = ''; }); }); }); save('Draft vaciado'); }, 'sm'));
      r.appendChild(btn('Cerrar', function () { save(); close(); })); r.appendChild(btn('Guardar y ocultar del stream', function () { cb.checked = false; save('Draft guardado'); close(); }, 'o')); b.appendChild(r);
    }); }
  // redes sociales y organizadores (salen en las pantallas «Síguenos» y «Créditos» del marcador de OBS)
  function netDlg(m) { var B = S().broadcast = S().broadcast || {}, R = B.redes || {};
    dialog('🌐 Redes y créditos', function (b, close) {
      b.appendChild(h('p', 'sub', 'Escribe el usuario o enlace corto de cada red (por ejemplo discord.gg/magna o @magnasports). Deja vacías las que no usen.'));
      var F = {}; [['discord', 'Discord'], ['whatsapp', 'WhatsApp'], ['instagram', 'Instagram'], ['tiktok', 'TikTok'], ['youtube', 'YouTube'], ['twitch', 'Twitch'], ['x', 'X / Twitter'], ['web', 'Página web']].forEach(function (n) { var l = h('label', 'f', n[1]), i = h('input', 'in'); i.maxLength = 60; i.value = R[n[0]] || ''; l.appendChild(i); b.appendChild(l); F[n[0]] = i; });
      var lo = h('label', 'f', 'Organización (sale en los créditos)'), oi = h('input', 'in'); oi.maxLength = 80; oi.placeholder = 'Ej: Joab y el equipo de Magna'; oi.value = B.org || ''; lo.appendChild(oi); b.appendChild(lo);
      var r = h('div', 'row'); r.appendChild(btn('Cancelar', close)); r.appendChild(btn('Guardar', function () { liveAct(m, function () { var o = S().broadcast = S().broadcast || {}; o.redes = {}; Object.keys(F).forEach(function (k) { var v = F[k].value.trim().slice(0, 60); if (v) o.redes[k] = v; }); o.org = oi.value.trim().slice(0, 80); }, 'Redes y créditos guardados'); close(); }, 'o')); b.appendChild(r);
    }); }
  // Victoria por W (no se presentó / se retiró el rival): siempre cuenta 2-0 para la tabla (DG +2)
  function woDlg(m) { dialog('🏳️ Victoria por W', function (b, close) {
      b.appendChild(h('p', 'sub', 'Elige quién gana por W. El partido queda 2-0 para ese equipo (cuenta +2 de diferencia de goles) y se marca como W en todo el sitio.' + (m.status === 'finished' ? ' Este partido ya terminó: se reemplaza su resultado ' + (m.hs || 0) + '-' + (m.as || 0) + '.' : '')));
      var r = h('div', 'row'); ['h', 'a'].forEach(function (sd) { r.appendChild(btn('Gana ' + MAGNA.teamName(sd === 'h' ? m.home : m.away), function () { close(); liveAct(m, function () { var l = ensureLive(m), c = l.clock;
        if (!l.lineup || (!l.lineup.h && !l.lineup.a)) l.lineup = { h: lineup(m.home), a: lineup(m.away) }; if (!l.ev.some(function (e) { return e.k === 'start'; })) addEv(m, { k: 'start' });
        if (c && c.run) { c.acc += Date.now() - c.since; c.run = false; c.since = null; } l.ev = l.ev.filter(function (e) { return e.k !== 'goal' && e.k !== 'end'; });
        m.hs = sd === 'h' ? 2 : 0; m.as = sd === 'a' ? 2 : 0; m.wo = sd; var wn = MAGNA.teamName(sd === 'h' ? m.home : m.away);
        addEv(m, { k: 'note', text: '🏳️ Victoria por W para ' + wn + ' (cuenta 2-0)' }); addEv(m, { k: 'end', score: m.hs + '-' + m.as }); l.phase = 'FT'; var was = m.status === 'finished'; m.status = 'finished'; if (!was) m.ended = MAGNA.now();
        MAGNA.addNews('match_result', 'Final: ' + MAGNA.teamName(m.home) + ' ' + m.hs + ' - ' + m.as + ' ' + MAGNA.teamName(m.away) + ' · victoria por W de ' + wn + ' (' + compName(m) + ').'); }, '🏳️ W registrado: 2-0 para ' + MAGNA.teamName(sd === 'h' ? m.home : m.away)); }, 'o')); });
      r.appendChild(btn('Cancelar', close)); b.appendChild(r); }); }
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
      b.appendChild(scorerPick(m, side, undefined, function (pid) { close(); CELE = { id: m.id, side: side, who: pid ? MAGNA.playerName(pid) : null, t: Date.now() }; liveAct(m, function () { if (side === 'a') m.as = (m.as || 0) + 1; else m.hs = (m.hs || 0) + 1; addEv(m, { k: 'goal', side: side, player: pid || null, score: m.hs + '-' + m.as }); }, pid ? '¡Gol de ' + MAGNA.playerName(pid) + '!' : '¡Gol registrado!'); }, 'Gol sin goleador (lo eliges después)'));
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
    function item(x) { var it = h('button', 'mi mi-' + x.status + (x.id === m.id ? ' on' : '')); it.type = 'button'; it.style.setProperty('--hc', MAGNA.teamColor(x.home)); it.style.setProperty('--ac', MAGNA.teamColor(x.away));
      var rw = h('span', 'mi-r'); rw.appendChild(M.crest(x.home, MAGNA.teamName(x.home), 28)); rw.appendChild(h('span', 'sc', x.status === 'scheduled' ? 'vs' : (x.hs || 0) + '-' + (x.as || 0))); rw.appendChild(M.crest(x.away, MAGNA.teamName(x.away), 28)); it.appendChild(rw);
      it.appendChild(h('b', null, MAGNA.teamName(x.home) + ' vs ' + MAGNA.teamName(x.away))); it.appendChild(h('small', null, x.status === 'live' ? '● En vivo · ' + compName(x) : x.status === 'finished' ? 'Finalizado · ' + compName(x) : fdate(x.at) + ' · ' + compName(x))); it.onclick = function () { $.LIVE = x.id; render(); }; ls.appendChild(it); }
    var L1 = all.filter(function (x) { return x.status === 'live'; }), L2 = all.filter(function (x) { return x.status === 'scheduled'; });
    if (L1.length) { ls.appendChild(h('h4', null, 'En juego')); L1.forEach(item); }
    if (L2.length) { ls.appendChild(h('h4', null, 'Programados')); L2.slice(0, 12).forEach(item); }
    if (recent.length) { ls.appendChild(h('h4', null, 'Terminados hoy')); recent.forEach(item); }
    wrap.appendChild(ls);
    var L = m.live || { phase: 'pre', ev: [] }, live = m.status === 'live', fin = m.status === 'finished', con = h('div', 'con' + (live ? ' is-live' : '') + (fin ? ' is-fin' : '')); con.style.setProperty('--hc', MAGNA.teamColor(m.home)); con.style.setProperty('--ac', MAGNA.teamColor(m.away));
    var ch = h('div', 'ch'); ch.appendChild(h('span', null, compName(m) + (m.round ? ' · ' + m.round : ''))); var phc = { pre: '', '1T': ' l', HT: ' h', '2T': ' l', FT: ' f' }; ch.appendChild(h('span', 'ph' + (fin ? ' f' : phc[L.phase] || ''), fin ? 'Finalizado' : live ? (MAGNA.PHASES[L.phase] || 'En vivo') + (L.mode ? ' · ' + L.mode : '') : 'Por empezar')); con.appendChild(ch);
    var sb = h('div', 'sb'); [['h', m.home], null, ['a', m.away]].forEach(function (x) {
      if (!x) { var mid = h('div'), sc = h('div', 's'); sc.appendChild(document.createTextNode(m.status === 'scheduled' ? 0 : m.hs || 0)); sc.appendChild(h('i')); sc.appendChild(document.createTextNode(m.status === 'scheduled' ? 0 : m.as || 0)); mid.appendChild(sc); var ck = h('div', 'clk', live || fin ? MAGNA.liveClock(m) : '00:00'); ck.appendChild(h('small', null, live && L.clock && L.clock.run ? 'Minuto ' + MAGNA.liveMinute(m) : live ? 'Reloj detenido' : fin ? 'Tiempo jugado' : fdate(m.at))); mid.appendChild(ck); sb.appendChild(mid);
        if (live && L.clock && L.clock.run) $.TICK = setInterval(function () { if (!document.body.contains(ck)) { clearInterval($.TICK); $.TICK = null; return; } ck.firstChild.nodeValue = MAGNA.liveClock(m); ck.lastChild.textContent = 'Minuto ' + MAGNA.liveMinute(m); }, 1000);
        return; }
      var t = h('div', 't t-' + x[0]); t.appendChild(M.crest(x[1], MAGNA.teamName(x[1]), 80)); t.appendChild(h('b', null, MAGNA.teamName(x[1]))); var g = btn('⚽ Gol', function () { goalDlg(m, x[0]); }, 'g gb'); g.disabled = !live || L.phase === 'HT'; kbd(g, x[0] === 'h' ? 'q' : 'p'); t.appendChild(g); sb.appendChild(t); });
    var scs = (m.hs || 0) + '-' + (m.as || 0); if (LSC[m.id] != null && LSC[m.id] !== scs) { var se = sb.querySelector('.s'); if (se) se.classList.add('pop'); } LSC[m.id] = scs;
    if (live) con.appendChild(h('span', 'lv-onair', '● AL AIRE'));
    con.appendChild(sb);
    // pasos del partido: dónde vamos y qué sigue
    var PH = [['pre', 'Por empezar'], ['1T', '1.er tiempo'], ['HT', 'Entretiempo'], ['2T', '2.º tiempo'], ['FT', 'Final']], cur = fin ? 4 : !live ? 0 : Math.max(0, PH.map(function (x) { return x[0]; }).indexOf(L.phase)), stp = h('div', 'lv-steps');
    PH.forEach(function (x, k) { var d = h('span', k < cur ? 'ok' : k === cur ? 'on' : null); d.appendChild(h('i', null, k < cur ? '✓' : String(k + 1))); d.appendChild(h('em', null, x[1])); stp.appendChild(d); }); con.appendChild(stp);

    // modo de juego
    var cg = h('div', 'cg');
    if (m.sets && m.sets.length) {
      var ss = MAGNA.setScore(m), hd4 = h('h4', null, 'Sets · ' + MAGNA.teamName(m.home) + ' ' + ss.h + ' - ' + ss.a + ' ' + MAGNA.teamName(m.away)); cg.appendChild(hd4);
      var sl = h('div', 'live-sets');
      m.sets.forEach(function (x, i) { var cur = L.set === i + 1, r = h('div', 'lset' + (cur ? ' cur' : '') + (x.w ? ' done' : '')); r.style.setProperty('--mc', MAGNA.MODE_COLOR[x.mode] || 'var(--line)');
        var tx = h('div'); tx.appendChild(h('b', null, 'Set ' + (i + 1) + (cur ? ' · jugando' : ''))); tx.appendChild(h('small', null, MAGNA.setLabel(x))); r.appendChild(tx);
        var bx = h('div', 'lsb');
        if (!x.w) { var pl = btn(cur ? 'En juego' : '▶ Jugar', function () { if (!x.mode) return toast('Primero elige el modo de este set en "Editar sets".', true); liveAct(m, function () { var LL = ensureLive(m); LL.draft = 0; LL.set = i + 1; LL.mode = x.mode; LL.map = x.map || null; addEv(m, { k: 'mode', set: i + 1, mode: x.mode, map: x.map || null }); }, 'Set ' + (i + 1) + ': ' + x.mode); }, cur ? 'o sm' : 'sm'); pl.disabled = fin || cur; bx.appendChild(pl); var dft = x.draft && ['h', 'a'].some(function (k) { return (x.draft.picks[k] || []).some(Boolean); }), db = btn((L.draft === i + 1 ? '🔴 ' : '🎯 ') + 'Draft' + (dft ? ' ✓' : ''), function () { draftDlg(m, i); }, 'sm'); db.disabled = fin; db.title = 'Bloqueos y elecciones de brawlers (se ven en OBS)'; bx.appendChild(db);
          ['h', 'a'].forEach(function (sd) { var wb = btn('Ganó ' + MAGNA.teamName(sd === 'h' ? m.home : m.away), function () { liveAct(m, function () { x.w = sd; var sc = MAGNA.setScore(m); addEv(m, { k: 'set', set: i + 1, side: sd, score: sc.h + '-' + sc.a }); }, 'Set ' + (i + 1) + ' para ' + MAGNA.teamName(sd === 'h' ? m.home : m.away)); }, 'sm'); wb.disabled = fin || m.status !== 'live'; bx.appendChild(wb); }); }
        else { bx.appendChild(h('span', 'won', '✓ ' + MAGNA.teamName(x.w === 'h' ? m.home : m.away))); if (!fin) bx.appendChild(btn('Deshacer', function () { liveAct(m, function () { delete x.w; }, 'Set ' + (i + 1) + ' sin ganador'); }, 'sm')); }
        r.appendChild(bx); sl.appendChild(r); });
      cg.appendChild(sl); var eb = h('div', 'bar2'); eb.appendChild(btn('Editar sets', function () { setsDlg(m); }, 'sm')); cg.appendChild(eb);
    } else {
      cg.appendChild(h('h4', null, 'Modo de juego')); var md = h('div', 'modes');
      MAGNA.MODES.forEach(function (mo) { var x = h('button', 'mo' + (L.mode === mo ? ' on' : ''), mo); x.type = 'button'; x.style.setProperty('--mc', MAGNA.MODE_COLOR[mo] || '#8b5cf6'); x.disabled = fin; x.onclick = function () { if (L.mode === mo) return; liveAct(m, function () { ensureLive(m).mode = mo; ensureLive(m).map = null; addEv(m, { k: 'mode', mode: mo }); }, 'Modo: ' + mo); }; md.appendChild(x); });
      cg.appendChild(md); var eb2 = h('div', 'bar2'); eb2.appendChild(btn('Planear sets con modos y mapas', function () { setsDlg(m); }, 'sm')); cg.appendChild(eb2);
    }
    var cgM = cg; con.appendChild(cg);
    // controles
    var cc = h('div', 'cg'); cc.appendChild(h('h4', null, 'Control del partido')); var ct = h('div', 'ctrl');
    var NX = m.status === 'scheduled' ? 'Iniciar' : live && L.phase === '1T' ? 'Entretiempo' : live && L.phase === 'HT' ? '2.º tiempo' : live && L.phase === '2T' ? 'Finalizar' : fin && !L.mvp ? 'MVP' : '';
    function cbtn(txt, cls, dis, fn) { if (dis && !/Deshacer/.test(txt)) return; var x = h('button', 'cb ' + cls + (NX && txt.indexOf(NX) >= 0 ? ' nx' : ''), txt); x.type = 'button'; x.disabled = dis; x.onclick = fn; if (x.classList.contains('nx')) { x.title = 'Siguiente paso (tecla N)'; if (!dis) kbd(x, 'n'); } else if (/Sustituci/.test(txt) && !dis) kbd(x, 's'); else if (/Deshacer/.test(txt) && !dis) kbd(x, 'z'); ct.appendChild(x); }
    var comp = MAGNA.compOf(m);
    cbtn('▶ Iniciar partido', 'o', m.status !== 'scheduled', function () { if (comp && comp.status === 'finished') return toast('La competición ya finalizó.', true); liveAct(m, function () { var l = ensureLive(m); m.status = 'live'; m.hs = 0; m.as = 0; delete m.wo; l.phase = '1T'; l.lineup = { h: lineup(m.home), a: lineup(m.away) }; l.clock = { acc: 0, since: Date.now(), run: true }; addEv(m, { k: 'start' }); MAGNA.addNews('match_live', 'En vivo: ' + MAGNA.teamName(m.home) + ' vs ' + MAGNA.teamName(m.away) + '.'); }, '¡Partido en marcha!'); });
    cbtn('⏸ Entretiempo', 'y', !live || L.phase !== '1T', function () { liveAct(m, function () { var c = m.live.clock; c.acc += Date.now() - c.since; c.run = false; c.since = null; m.live.phase = 'HT'; addEv(m, { k: 'ht' }); }, 'Entretiempo'); });
    cbtn('▶ 2.º tiempo', 'g', !live || L.phase !== 'HT', function () { liveAct(m, function () { m.live.phase = '2T'; m.live.clock.since = Date.now(); m.live.clock.run = true; addEv(m, { k: 'resume' }); }, 'Comienza el 2.º tiempo'); });
    cbtn('⇄ Sustitución', '', !live, function () { subDlg(m); });
    cbtn('■ Finalizar', 'r', !live, function () { if ((m.hs || 0) === (m.as || 0)) return toast('No hay empates: registra el gol decisivo antes de finalizar.', true);
      confirmBox('¿Finalizar el partido?', MAGNA.teamName(m.home) + ' ' + m.hs + ' - ' + m.as + ' ' + MAGNA.teamName(m.away) + '. El resultado cuenta para la tabla.', 'Finalizar', function () { liveAct(m, function () { var c = m.live.clock; if (c.run) { c.acc += Date.now() - c.since; c.run = false; c.since = null; } addEv(m, { k: 'end', score: m.hs + '-' + m.as }); m.live.phase = 'FT'; m.status = 'finished'; m.ended = MAGNA.now(); MAGNA.addNews('match_result', 'Final: ' + MAGNA.teamName(m.home) + ' ' + m.hs + ' - ' + m.as + ' ' + MAGNA.teamName(m.away) + ' (' + compName(m) + ').'); }, 'Partido finalizado'); mvpDlg(m, true); }); });
    cbtn('🏳️ Ganar por W', 'w', false, function () { woDlg(m); });
    cbtn('↶ Deshacer', '', !($.UNDO[m.id] && $.UNDO[m.id].length), function () { var st = JSON.parse($.UNDO[m.id].pop()); m.status = st.status; m.hs = st.hs; m.as = st.as; if (st.wo) m.wo = st.wo; else delete m.wo; if (st.ended) m.ended = st.ended; if (st.live) m.live = st.live; else delete m.live; MAGNA.save(); toast('Último cambio deshecho'); render(); banner(); });
    if (fin) { cbtn('⭐ MVP' + (L.mvp ? ': ' + (MAGNA.playerName(L.mvp) || '') : ''), 'y', false, function () { mvpDlg(m, false); }); cbtn('📸 Imagen para compartir', 'o', false, function () { shareDlg(m); }); }
    cc.appendChild(ct); if (!live && !fin) cc.appendChild(h('p', 'hint', 'Inicia el partido para registrar goles, modos y sustituciones. El reloj corre solo y se detiene en el entretiempo.')); con.appendChild(cc); con.insertBefore(cc, cgM); if (live || fin) con.insertBefore(pulse(m), cgM); if (live) con.insertBefore(narr(m), cgM);
    // controles de la transmisión (OBS): casters, mensaje en pantalla y pausa técnica
    if (!fin) { var tvg = h('div', 'cg'); tvg.appendChild(h('h4', null, '📺 Transmisión (OBS)')); var LV = m.live || {};
      var r1 = h('div', 'row'); r1.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:flex-start'; var ci = h('input', 'in'); ci.placeholder = 'Casters: Juan y Ana'; ci.maxLength = 60; ci.value = (LV.cast && LV.cast.names) || ''; ci.style.flex = '1 1 220px'; r1.appendChild(ci);
      r1.appendChild(btn('🎙️ Mostrar casters', function () { var v = ci.value.trim(); if (!v) return toast('Escribe los nombres de los casters.', true); liveAct(m, function () { ensureLive(m).cast = { names: v.slice(0, 60), at: Date.now() }; }, 'Casters en pantalla'); }, 'sm')); tvg.appendChild(r1);
      var r2 = h('div', 'row'); r2.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:flex-start;margin-top:8px'; var ki = h('select', 'in'); [['💬 Mensaje', '💬 Mensaje'], ['❓ Pregunta del chat', '❓ Pregunta del chat'], ['📢 Aviso', '📢 Aviso']].forEach(function (o) { var op = h('option', null, o[1]); op.value = o[0]; if (LV.msg && LV.msg.k === o[0]) op.selected = true; ki.appendChild(op); }); ki.style.flex = '0 0 auto'; r2.appendChild(ki);
      var mi = h('input', 'in'); mi.placeholder = 'Texto que sale abajo en la transmisión'; mi.maxLength = 120; mi.value = (LV.msg && LV.msg.t) || ''; mi.style.flex = '1 1 260px'; r2.appendChild(mi);
      var on = !!(LV.msg && LV.msg.on); r2.appendChild(btn('Mostrar', function () { var v = mi.value.trim(); if (!v) return toast('Escribe el mensaje.', true); liveAct(m, function () { ensureLive(m).msg = { k: ki.value, t: v.slice(0, 120), on: true, at: Date.now() }; }, 'Mensaje en pantalla'); }, 'sm o'));
      if (on) r2.appendChild(btn('Quitar', function () { liveAct(m, function () { var l = ensureLive(m); if (l.msg) l.msg.on = false; }, 'Mensaje quitado'); }, 'sm')); tvg.appendChild(r2);
      var r3 = h('div', 'row'); r3.style.cssText = 'display:flex;gap:8px;align-items:center;justify-content:flex-start;margin-top:8px'; var pz = !!LV.pause;
      r3.appendChild(btn(pz ? '▶ Quitar pausa técnica' : '⏸ Pausa técnica', function () { liveAct(m, function () { ensureLive(m).pause = !pz; }, pz ? 'Seguimos con el partido' : 'Pausa técnica en pantalla'); }, pz ? 'sm o' : 'sm')); r3.appendChild(h('small', 'hint', pz ? 'La transmisión muestra «Volvemos enseguida».' : 'Muestra «Volvemos enseguida» a pantalla completa.')); tvg.appendChild(r3);
      var r4 = h('div', 'row'); r4.style.cssText = 'display:flex;gap:8px;align-items:center;justify-content:flex-start;margin-top:8px'; r4.appendChild(btn('🌐 Redes y créditos', function () { netDlg(m); }, 'sm')); r4.appendChild(h('small', 'hint', 'Redes de la comunidad y organizadores para las pantallas «Síguenos» y «Créditos».')); tvg.appendChild(r4);
      con.insertBefore(tvg, cgM); }
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
    var ICO = { start: '▶', goal: '⚽', mode: '🎮', set: '✔', sub: '⇄', ht: '⏸', resume: '▶', end: '🏁', note: '💬' };
    (L.ev || []).slice().reverse().forEach(function (e) { var r = h('div', 'ev' + (e.k === 'goal' ? ' goal' : e.k === 'note' ? ' note' : '')); r.appendChild(h('span', 'mn', e.min ? e.min + "'" : '')); r.appendChild(h('span', 'ic', ICO[e.k] || '•')); var et = h('span', null, MAGNA.eventText(m, e)); r.appendChild(et); r.appendChild(h('time', null, (e.at || '').slice(11, 16))); if (e.k === 'goal') { var eb = h('button', 'evx', e.player ? '✎ Goleador' : '+ Elegir goleador'); eb.type = 'button'; eb.title = 'Elegir o cambiar quién anotó'; eb.onclick = function () { scorerEdit(m, e); }; et.appendChild(eb); } tl.appendChild(r); });
    if (!(L.ev || []).length) tl.appendChild(h('p', 'hint', 'Aquí aparecerá cada acción del partido.'));
    tlw.appendChild(tl); con.appendChild(tlw); wrap.appendChild(con); b.appendChild(wrap);
    if (live) b.appendChild(h('p', 'lv-keys', '⌨️ Atajos: Q gol local · P gol visitante · S cambio · Z deshacer · N siguiente paso'));
    if (CELE && CELE.id === m.id && Date.now() - CELE.t < 4000) { var c0 = CELE; CELE = null; var ov = h('div', 'lv-cele'), tc = MAGNA.teamColor(c0.side === 'a' ? m.away : m.home); ov.style.setProperty('--tc', tc);
      for (var q = 0; q < 16; q++) { var cf = h('i'); cf.style.setProperty('--x', (Math.cos(q / 16 * 6.283) * (120 + (q % 3) * 40)).toFixed(0) + 'px'); cf.style.setProperty('--y', (Math.sin(q / 16 * 6.283) * (90 + (q % 4) * 25)).toFixed(0) + 'px'); cf.style.background = ['#ffc53d', '#ff6b2c', '#32d583', '#ff5fa2', '#4cc3ff', tc][q % 6]; ov.appendChild(cf); }
      var cb2 = h('div', 'lv-cb'); cb2.appendChild(h('b', null, '¡GOOOL!')); cb2.appendChild(h('span', null, MAGNA.teamName(c0.side === 'a' ? m.away : m.home) + (c0.who ? ' · ' + c0.who : ''))); cb2.appendChild(h('em', null, (m.hs || 0) + ' - ' + (m.as || 0))); ov.appendChild(cb2); con.appendChild(ov); setTimeout(function () { ov.remove(); }, 1900); }
  }
  // pulso del partido: goles, cambios, nota media y candidato a MVP
  function pulse(m) {
    var L = m.live || {}, R = L.ratings || {}, w = h('div', 'lv-pulse'), st = {};
    ['h', 'a'].forEach(function (sd) { var ids = onField(m, sd), rs = ids.map(function (id) { return R[id]; }).filter(function (v) { return v != null; });
      st[sd] = { g: sd === 'h' ? (m.hs || 0) : (m.as || 0), c: (L.ev || []).filter(function (e) { return e.k === 'sub' && e.side === sd; }).length, n: rs.length ? rs.reduce(function (a, b) { return a + b; }, 0) / rs.length : null }; });
    var sc = function (x) { return x.g * 2 + (x.n || 6); }, ph = Math.round(sc(st.h) / (sc(st.h) + sc(st.a)) * 100);
    var hd = h('div', 'lp-h'); hd.appendChild(h('h4', null, '📈 Pulso del partido')); var best = null; Object.keys(R).forEach(function (id) { if (best == null || R[id] > R[best]) best = id; });
    if (best != null && MAGNA.playerName(best)) hd.appendChild(h('span', 'lp-mvp', '⭐ Candidato a MVP: ' + MAGNA.playerName(best) + ' (' + String(R[best]).replace('.', ',') + ')')); w.appendChild(hd);
    var bar = h('div', 'lp-bar'); bar.style.setProperty('--p', ph + '%'); bar.appendChild(h('span', null, ph + '%')); bar.appendChild(h('i')); bar.appendChild(h('span', null, (100 - ph) + '%')); w.appendChild(bar);
    var g = h('div', 'lp-g'); [['Goles', 'g'], ['Cambios', 'c'], ['Nota media', 'n']].forEach(function (x) { var r = h('div', 'lp-r'), f = function (v) { return v == null ? '—' : x[1] === 'n' ? (Math.round(v * 10) / 10).toString().replace('.', ',') : String(v); }; r.appendChild(h('b', null, f(st.h[x[1]]))); r.appendChild(h('small', null, x[0])); r.appendChild(h('b', null, f(st.a[x[1]]))); g.appendChild(r); }); w.appendChild(g);
    return w;
  }
  // narración rápida: frases que aparecen en el minuto a minuto del sitio
  var NSIDE = 'h';
  function narr(m) {
    var w = h('div', 'cg lv-nar'); w.appendChild(h('h4', null, '🎙️ Narración rápida'));
    var sg = h('div', 'nr-sd'); [['h', MAGNA.teamName(m.home)], ['x', 'General'], ['a', MAGNA.teamName(m.away)]].forEach(function (x) { var b = h('button', NSIDE === x[0] ? 'on' : null, x[1]); b.type = 'button'; if (x[0] !== 'x') b.style.setProperty('--tc', MAGNA.teamColor(x[0] === 'a' ? m.away : m.home)); b.onclick = function () { NSIDE = x[0]; sg.querySelectorAll('button').forEach(function (y) { y.classList.toggle('on', y === b); }); }; sg.appendChild(b); }); w.appendChild(sg);
    function post(t) { t = String(t || '').replace(/[<>]/g, '').trim().slice(0, 120); if (!t) return toast('Escribe algo para narrar.', true); var tn = NSIDE === 'x' ? '' : MAGNA.teamName(NSIDE === 'a' ? m.away : m.home);
      liveAct(m, function () { var e = { k: 'note', text: t + (tn ? ' · ' + tn : '') }; if (NSIDE !== 'x') e.side = NSIDE; addEv(m, e); }, '💬 Publicado en el minuto a minuto'); }
    var ch = h('div', 'nr-ch'); ['🔥 ¡Casi gol!', '🧤 ¡Atajadón!', '💥 ¡Qué jugada!', '⚡ ¡Contraataque!', '😱 ¡Polémica!', '🛡️ ¡Defensa de muro!', '📣 ¡La afición enloquece!', '⏱️ ¡Último minuto!'].forEach(function (t) { var b = h('button', null, t); b.type = 'button'; b.onclick = function () { post(t); }; ch.appendChild(b); }); w.appendChild(ch);
    var f = h('form', 'nr-f'), i = h('input', 'in'); i.maxLength = 120; i.placeholder = 'Escribe tu propia narración…'; f.appendChild(i); var sb2 = h('button', 'b o', 'Publicar'); sb2.type = 'submit'; f.appendChild(sb2); f.onsubmit = function (e) { e.preventDefault(); post(i.value); }; w.appendChild(f);
    return w;
  }

  return { liveV: liveV };
});
