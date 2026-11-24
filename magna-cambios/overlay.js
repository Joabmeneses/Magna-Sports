'use strict';
// Marcador para transmisiones (OBS / Streamlabs): overlay.html?m=<id del partido>
// Opciones: &ver=h|a (fija la presentación de un equipo) · &estilo=abajo (barra abajo con cinta) · &solo=barra (nunca pantalla completa) · &demo=<imagen> (ver cómo queda sobre una captura)
(function () {
  function q(k) { var m = new RegExp('[?&]' + k + '=([^&#]*)').exec(location.search); return m ? decodeURIComponent(m[1]) : null; }
  var PRES = q('presentacion') !== 'no', fsKey = '', draftWas = false, MID = Number(q('m')), ov = document.getElementById('ov'), fs = document.getElementById('fs'), fsIn = document.getElementById('fsIn'), last = {}, tickI = 0, lowT = 0, prevFull = null, prevSets = null, twT = null;
  var TOP = q('estilo') !== 'abajo'; var HUECO = q('hueco') ? Number(q('hueco')) / 19.2 : 0; if (q('y')) document.documentElement.style.setProperty('--sy', Number(q('y')) / 19.2 + 'vw'); ov.classList.toggle('top', TOP); document.body.classList.toggle('top', TOP);
  var LG = document.getElementById('lg'), pos = q('logo') || (TOP ? 'bl' : 'br'); if (pos === 'no') LG.remove(); else if (/^(tl|tr|bl|br)$/.test(pos)) LG.className = 'lg ' + pos;
  if (q('demo')) { document.body.classList.add('demo'); document.body.style.setProperty('--demo', 'url("' + q('demo').replace(/"/g, '') + '")'); }
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function S() { return MAGNA.S; }
  function match() { var L = S().matches; if (MID) return MAGNA.by(L, MID); return L.filter(function (m) { return m.status === 'live'; })[0] || L.filter(function (m) { return m.status === 'scheduled'; }).sort(function (a, b) { return String(a.at || '').localeCompare(String(b.at || '')); })[0]; }
  function crest(id) { var c = el('span', 'ov-cr'), u = MAGNA.crestUrl(id); if (u) c.style.backgroundImage = 'url("' + u + '")'; else c.textContent = String(MAGNA.teamName(id)).slice(0, 2).toUpperCase(); return c; }
  function lows(m) { var L = [], c = MAGNA.compOf(m), ss = m.sets || [], cur = ss.filter(function (x) { return !x.w; })[0], sc = MAGNA.setScore(m);
    if (cur) L.push(['SET ' + (ss.indexOf(cur) + 1), MAGNA.setLabel(cur)]); else if (ss.length) L.push(['SETS', MAGNA.teamName(m.home) + ' ' + sc.h + ' - ' + sc.a + ' ' + MAGNA.teamName(m.away)]);
    var ev = ((m.live || {}).ev || []).filter(function (e) { return e.k === 'goal'; }).slice(-1)[0]; if (ev) L.push(['⚽ GOL', MAGNA.eventText(m, ev)]);
    try { var P = MAGNA.matchPreview(m); L.push(['PRONÓSTICO', (P.p >= .5 ? MAGNA.teamName(m.home) : MAGNA.teamName(m.away)) + ' ' + Math.round(Math.max(P.p, 1 - P.p) * 100) + '% antes del partido']); } catch (e) {}
    L.push(['MAGNA ARENA', 'Apoya a tu equipo y apuesta tus Bits en magna arena']); if (c) L.push(['TORNEO', c.name + (m.round ? ' · ' + m.round : '')]); return L; }
  // transición entre pantallas y celebraciones
  // transición MAGNA ARENA: franjas, logo que cae de golpe, ondas, chispas, rayos y destello
  function wipe(after, tag) { var mx = document.getElementById('mx'), NS = 'http://www.w3.org/2000/svg'; mx.className = 'mx'; mx.innerHTML = '';
    for (var i = 0; i < 4; i++) mx.appendChild(el('i', 'p'));
    var st = el('div', 'st'), sh = el('div', 'sh'); st.appendChild(el('div', 'sp')); st.appendChild(el('div', 'gw'));
    var sv = document.createElementNS(NS, 'svg'); sv.setAttribute('viewBox', '0 0 1920 1080'); sv.setAttribute('preserveAspectRatio', 'none');
    [[260, 140, 'l'], [820, 120, 'm'], [180, 90, 'm'], [900, 100, 'l']].forEach(function (b) { var p = document.createElementNS(NS, 'path'); p.setAttribute('d', bolt(b[0], b[1])); p.setAttribute('class', b[2]); sv.appendChild(p); }); st.appendChild(sv);
    sh.appendChild(el('i', 'rg')); sh.appendChild(el('i', 'rg b'));
    for (var k = 0; k < 18; k++) { var a = Math.PI * 2 * k / 18 + Math.random() * .3, d = 14 + Math.random() * 22, sp = el('i', 'k' + (k % 2 ? ' m' : '')); sp.style.setProperty('--x', Math.cos(a) * d + 'vw'); sp.style.setProperty('--y', Math.sin(a) * d * .7 + 'vw'); sh.appendChild(sp); }
    sh.appendChild(el('i', 'lo')); var tx = el('div', 'tx'); tx.appendChild(el('b', null, 'Magna')); tx.appendChild(el('b', null, 'Arena')); sh.appendChild(tx); sh.appendChild(el('span', 'tg', tag || 'Comunidad Magna Sports'));
    st.appendChild(sh); mx.appendChild(st); mx.appendChild(el('i', 'fl'));
    void mx.offsetWidth; mx.classList.add('go'); clearTimeout(twT); twT = setTimeout(after, 1000); setTimeout(function () { if (mx.classList.contains('go')) { mx.className = 'mx'; mx.innerHTML = ''; } }, 2300); }
  // transición larga con tarjeta: set ganado y set que empieza
  var stQ = [], stBusy = false;
  function stinger(fill, hold) { stQ.push([fill, hold]); if (!stBusy) nextSt(); }
  function nextSt() { var x = stQ.shift(); if (!x) { stBusy = false; var bb = bQ.splice(0); bb.forEach(function (b, i) { setTimeout(function () { burst.apply(null, b); }, i * 3300); }); return; } stBusy = true; if (x[1] === 'raw') { x[0](); return; } var tw = document.getElementById('tw'), sc = document.getElementById('sc2'); sc.innerHTML = ''; x[0](sc); tw.querySelector('b').style.display = 'none';
    tw.classList.remove('go', 'out'); void tw.offsetWidth; tw.classList.add('in');
    setTimeout(function () { tw.classList.remove('in'); tw.classList.add('out'); setTimeout(function () { tw.classList.remove('out'); tw.querySelector('b').style.display = ''; nextSt(); }, 750); }, x[1] || 2800); }
  // set ganado: "GANADOR" en columna, rayos del color del equipo y "SET N" a brochazo
  function bolt(y, amp) { var d = 'M -20 ' + y, x = -20; while (x < 1960) { x += 40 + Math.random() * 90; d += ' L ' + Math.round(x) + ' ' + Math.round(y + (Math.random() - .5) * amp); } return d; }
  var SIDE = { h: '#8b5cf6', a: '#c6ff1a' };
  // escenario oscuro: palabra repetida en columna, rayos de color y un brochazo grande
  function stage(o) { stQ.push([function () { var r = document.getElementById('rw'); r.innerHTML = ''; r.className = 'rw'; r.style.setProperty('--gc', o.col);
      var sv = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); sv.setAttribute('viewBox', '0 0 1920 1080'); sv.setAttribute('preserveAspectRatio', 'none');
      [[150, 60], [330, 90], [560, 70], [810, 110], [990, 60]].forEach(function (b) { var p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', bolt(b[0], b[1])); sv.appendChild(p); });
      var shk = el('div', 'shk'); shk.appendChild(sv); var cl = el('div', 'col'); for (var i = 0; i < 10; i++) cl.appendChild(el('span', null, o.row)); shk.appendChild(cl);
      var hit = el('div', 'hit'); hit.appendChild(el('b', null, o.big)); if (o.tag) hit.insertBefore(el('i', null, o.tag), hit.firstChild); shk.appendChild(hit); r.appendChild(shk);
      var w = el('div', 'who'); o.foot(w); r.appendChild(w);
      r.classList.remove('off'); void r.offsetWidth; r.classList.add('on');
      setTimeout(function () { r.classList.remove('on'); r.classList.add('off'); setTimeout(function () { r.classList.remove('off'); r.innerHTML = ''; nextSt(); }, 520); }, o.hold || 3400); }, 'raw']);
    if (!stBusy) nextSt(); }
  function setWon(m, idx, z) { var tid = z.w === 'h' ? m.home : m.away, sc = MAGNA.setScore(m);
    stage({ col: TOP ? SIDE[z.w] : MAGNA.teamColor(tid), row: 'GANADOR', tag: 'Set ' + (idx + 1) + ' para', big: MAGNA.teamName(tid), hold: 2900, foot: function (w) { w.appendChild(crest(tid)); var tx = el('div'); tx.appendChild(el('b', null, 'Gana el set ' + (idx + 1))); tx.appendChild(el('small', null, MAGNA.teamName(m.home) + ' ' + sc.h + ' - ' + sc.a + ' ' + MAGNA.teamName(m.away))); w.appendChild(tx); } }); }
  function setStart(m, idx, z) { var mc = (MAGNA.MODE_COLOR || {})[z.mode] || '#8b5cf6', sc = MAGNA.setScore(m), n = (m.sets || []).length, NS = 'http://www.w3.org/2000/svg';
    stQ.push([function () { var r = document.getElementById('rw'); r.innerHTML = ''; r.className = 'rw ss'; r.style.setProperty('--gc', mc);
      var wm = el('div', 'ss-wm'); for (var i = 0; i < 3; i++) wm.appendChild(el('span', null, (z.mode || 'Siguiente set') + ' · ')); r.appendChild(wm);
      r.appendChild(el('i', 'ss-band'));
      var sv = document.createElementNS(NS, 'svg'); sv.setAttribute('viewBox', '0 0 1920 1080'); sv.setAttribute('preserveAspectRatio', 'none'); [[140, 70], [960, 90]].forEach(function (b) { var p = document.createElementNS(NS, 'path'); p.setAttribute('d', bolt(b[0], b[1])); sv.appendChild(p); }); r.appendChild(sv);
      var L = el('div', 'ss-l'); L.appendChild(el('small', null, 'Set')); L.appendChild(el('b', null, String(idx + 1))); L.appendChild(el('span', null, 'de ' + n)); r.appendChild(L);
      var R = el('div', 'ss-r');
      var c1 = el('div', 'ss-c md'); c1.appendChild(el('small', null, 'Modo')); c1.appendChild(el('b', null, z.mode || 'Por definir')); R.appendChild(c1);
      var c2 = el('div', 'ss-c mp'); c2.appendChild(el('small', null, 'Mapa')); c2.appendChild(el('b', null, z.map || 'Por definir')); R.appendChild(c2);
      var c3 = el('div', 'ss-c vs'); [['h', m.home, sc.h], null, ['a', m.away, sc.a]].forEach(function (x) { if (!x) { c3.appendChild(el('i', null, '–')); return; } var t = el('span', 'ss-t ' + x[0]); t.appendChild(crest(x[1])); t.appendChild(el('em', null, MAGNA.teamName(x[1]))); t.appendChild(el('b', null, String(x[2]))); c3.appendChild(t); }); R.appendChild(c3);
      r.appendChild(R); r.appendChild(el('i', 'ss-fl'));
      void r.offsetWidth; r.classList.add('on');
      setTimeout(function () { r.classList.remove('on'); r.classList.add('off'); setTimeout(function () { r.className = 'rw'; r.innerHTML = ''; nextSt(); }, 480); }, 2700); }, 'raw']);
    if (!stBusy) nextSt(); }
  var bQ = [];
  function burst(kind, tid, txt, k) { if (stBusy) { bQ.push([kind, tid, txt, k]); return; } var g = document.getElementById('gl'); g.innerHTML = ''; g.className = 'gl ' + (k || ''); g.style.setProperty('--gc', TOP && k ? SIDE[k] : MAGNA.teamColor(tid)); if (!TOP) g.appendChild(crest(tid)); var w = el('div'); w.appendChild(el('b', null, kind)); var s = el('span', null, MAGNA.teamName(tid)); w.appendChild(s); if (txt) w.appendChild(el('small', null, txt)); g.appendChild(w); g.classList.remove('go'); void g.offsetWidth; g.classList.add('go'); }
  // detecta goles y sets nuevos para lanzar las celebraciones
  // goles del set en juego: se cuentan desde que terminó el set anterior
  var base = { n: null, h: 0, a: 0 };
  function setGoals(m) { var ev = (m.live || {}).ev || [], won = (m.sets || []).filter(function (z) { return z.w; }).length, sEv = ev.filter(function (e) { return e.k === 'set'; }).length, G = ev.filter(function (e) { return e.k === 'goal'; });
    var th = G.length ? G.filter(function (e) { return e.side === 'h'; }).length : (m.hs || 0), ta = G.length ? G.filter(function (e) { return e.side === 'a'; }).length : (m.as || 0);
    if (sEv === won && G.length) { var li = -1; ev.forEach(function (e, i) { if (e.k === 'set') li = i; }); var r = { h: 0, a: 0 }; ev.forEach(function (e, i) { if (i > li && e.k === 'goal' && r[e.side] != null) r[e.side]++; }); base = { n: won, h: th - r.h, a: ta - r.a }; return r; }
    if (base.n === null) base = { n: won, h: won ? th : 0, a: won ? ta : 0 }; else if (won !== base.n) base = { n: won, h: th, a: ta };
    return { h: Math.max(0, th - base.h), a: Math.max(0, ta - base.a) }; }
  // detecta goles y sets nuevos para lanzar las celebraciones
  function detect(m) {
    var sets = m.sets || [], sc0 = function (side) { var e = ((m.live || {}).ev || []).filter(function (z) { return z.k === 'goal' && z.side === side; }).slice(-1)[0]; return e && e.player ? MAGNA.playerName(e.player) : ''; }, g = {}, won = sets.filter(function (z) { return z.w; }).length, sg = setGoals(m);
    if (last.n === won && m.status === 'live') { if (sg.h > last.h) { g.h = 1; burst('¡GOL!', m.home, sc0('h'), 'h'); } if (sg.a > last.a) { g.a = 1; burst('¡GOL!', m.away, sc0('a'), 'a'); } }
    last.h = sg.h; last.a = sg.a; last.n = won; m._sg = sg;
    var sw = sets.map(function (z) { return z.w || ''; }).join(','); if (prevSets != null && sw !== prevSets && m.status === 'live') { var pv = prevSets.split(','); sets.forEach(function (z, i) { if (z.w && (pv[i] || '') !== z.w) { setWon(m, i, z); var ss = MAGNA.setScore(m), nd = Math.ceil(sets.length / 2), nx = sets[i + 1]; if (nx && !nx.w && ss.h < nd && ss.a < nd) setStart(m, i + 1, nx); } }); } prevSets = sw;
    return g;
  }
  function phaseTxt(ph) { return ph ? (MAGNA.PHASES[ph] || '').replace('1.er tiempo', '1T').replace('2.º tiempo', '2T') : ''; }
  // estilo "arriba" (por defecto): barra compacta centrada arriba, como en los torneos grandes
  // medidas tomadas de la barra de torneo (1920 px de ancho = 100vw)
  function top(m, g) {
    var sets = m.sets || [], sc = MAGNA.setScore(m), need = Math.max(1, Math.ceil((sets.length || 3) / 2));
    var W = 33.34, H = 3.8, PW = HUECO || 8.2, PH = 2.9;
    var u = function (v) { return Math.round(v * 100) / 10; }, py = (H - PH) / 2 + .03;
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + u(W) + ' ' + u(H) + '" preserveAspectRatio="none"><path fill-rule="evenodd" d="M0 0H' + u(W) + 'V' + u(H) + 'H0Z M' + u((W - PW) / 2 + PH / 2) + ' ' + u(py) + 'h' + u(PW - PH) + 'a' + u(PH / 2) + ' ' + u(PH / 2) + ' 0 0 1 0 ' + u(PH) + 'h-' + u(PW - PH) + 'a' + u(PH / 2) + ' ' + u(PH / 2) + ' 0 0 1 0 -' + u(PH) + 'Z"/></svg>';
    var sb = el('div', 'sb t' + (/^[123]$/.test(q('tema') || '') ? q('tema') : '3')), bar = el('div', 'sb-bar' + (g.h ? ' flh' : '') + (g.a ? ' fla' : '')), mk = 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
    bar.style.webkitMaskImage = mk; bar.style.maskImage = mk; sb.appendChild(bar);
    var sg = m._sg || { h: 0, a: 0 };
    [['h', m.home, sg.h], ['a', m.away, sg.a]].forEach(function (x) {
      var nm = el('b', 'sb-nm ' + x[0]); nm.appendChild(el('span', null, MAGNA.teamName(x[1]).toUpperCase())); sb.appendChild(nm);
      sb.appendChild(el('b', 'sb-n ' + x[0] + (g[x[0]] ? ' bump' : ''), m.status === 'scheduled' ? '–' : String(x[2] || 0)));
      if (sets.length) { var t = el('span', 'sb-tab ' + x[0] + (need > 2 ? ' x3' : '')), won = x[0] === 'h' ? sc.h : sc.a; for (var i = 0; i < need; i++) t.appendChild(el('i', i < won ? 'on' : '')); sb.appendChild(t); }
      var lo = el('span', 'sb-lo ' + x[0]), cu = MAGNA.crestUrl(x[1]); if (cu) lo.style.backgroundImage = 'url("' + cu + '")'; else { lo.classList.add('ini'); lo.appendChild(el('b', null, MAGNA.teamName(x[1]).slice(0, 2).toUpperCase())); } sb.appendChild(lo);
    });
    ov.appendChild(sb); fitNames();
  }
  // achica el nombre si no cabe en su espacio
  function fitNames() { [].forEach.call(document.querySelectorAll('.sb-nm span'), function (s) { s.style.fontSize = ''; var box = s.parentNode.clientWidth, f = parseFloat(getComputedStyle(s).fontSize), n = 0; while (s.scrollWidth > box && f > 10 && n++ < 30) { f -= 1; s.style.fontSize = f + 'px'; } }); }
  if (q('probar') === 'cintas') { var pci = 0; setInterval(function () { var m = match(); if (!m) return; m.live = m.live || {}; pci++; if (pci % 2) m.live.cast = { names: 'Juan Pérez y Ana Gómez', at: Date.now() }; else m.live.msg = { on: pci % 4 === 2, t: '¿Quién creen que gana el set? Escríbanlo en el chat', at: Date.now() }; dispatchEvent(new Event('magna:update')); }, 5000); }
  if (q('probar') === 'champions') { var pc = function () { var m = match(); if (m) champWipe(function () {}, m); }; setTimeout(pc, 900); setInterval(pc, 6500); }
  if (q('probar') === 'omega') { var po = function () { var m = match(); if (m) omegaWipe(function () {}, m); }; setTimeout(po, 900); setInterval(po, 6500); }
  if (q('probar') === 'draft') { var dd = [['', '', ''], ['', '', '']], BR = ['Spike', 'Crow', 'Leon', 'Mortis', 'Gene', 'Max', 'Byron', 'Gus', 'Belle', 'Sandy', 'Bibi', 'Frank'], st = 0; setInterval(function () { var m = match(); if (!m || !(m.sets || [])[0]) return; var z = m.sets[0]; if (st === 0) z.draft = { first: 'h', bans: { h: [], a: [] }, picks: { h: [], a: [] } }; var d = z.draft, seq = [['bans', 'h', 0], ['bans', 'a', 0], ['bans', 'h', 1], ['bans', 'a', 1], ['bans', 'h', 2], ['bans', 'a', 2], ['picks', 'h', 0], ['picks', 'a', 0], ['picks', 'a', 1], ['picks', 'h', 1], ['picks', 'h', 2], ['picks', 'a', 2]]; if (st < seq.length) { var x = seq[st]; d[x[0]][x[1]][x[2]] = BR[st]; } st = (st + 1) % (seq.length + 3); dispatchEvent(new Event('magna:update')); }, 1200); }
  if (q('probar') === 'set') { var ps = function () { var m = match(); if (m && (m.sets || []).length) { var i = Math.min(1, m.sets.length - 1); setStart(m, i, m.sets[i]); } }; setTimeout(ps, 900); setInterval(ps, 4200); }
  if (q('probar') === 'transicion') { setTimeout(function () { wipe(function () {}); }, 600); setInterval(function () { wipe(function () {}); }, 3500); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { fitNames(); });
  // presentación de jugadores: un equipo a la vez, una tarjeta por jugador
  function roster(m, k) { var tid = k === 'h' ? m.home : m.away, ids = (m.live && m.live.lineup && m.live.lineup[k]) || (k === 'h' ? m.hp : m.ap) || [], P = S().players;
    var L = ids.length ? ids.map(function (id) { return MAGNA.by(P, id); }).filter(Boolean) : P.filter(function (p) { return p.teamId === tid && MAGNA.plays(p); }).sort(function (x, y) { return (x.slot === 'starter' ? 0 : 1) - (y.slot === 'starter' ? 0 : 1) || x.id - y.id; });
    return L.slice(0, 5); }
  function presentation(m, k) { var tid = k === 'h' ? m.home : m.away, rid = k === 'h' ? m.away : m.home, t = MAGNA.by(S().teams, tid) || {}, ST = {}, c = MAGNA.compOf(m); try { ST = MAGNA.playerStats(); } catch (e) {}
    var w = el('div', 'pj-in ' + k), nm = MAGNA.teamName(tid);
    var wm = el('div', 'pj-wm'); for (var r = 0; r < 3; r++) { var ln = el('div', r % 2 ? 'b' : ''); for (var i = 0; i < 4; i++) ln.appendChild(el('span', null, nm + ' ')); wm.appendChild(ln); } w.appendChild(wm);
    var hd = el('div', 'pj-hd'), cr = el('span', 'pj-cr'), cu = MAGNA.crestUrl(tid); if (cu) cr.style.backgroundImage = 'url("' + cu + '")'; else cr.appendChild(el('b', null, nm.slice(0, 2).toUpperCase())); hd.appendChild(cr);
    var tx = el('div'); tx.appendChild(el('small', null, (k === 'h' ? 'Local' : 'Visitante') + ' · Alineación')); tx.appendChild(el('b', null, nm)); hd.appendChild(tx); w.appendChild(hd);
    var vs = el('div', 'pj-vs'); vs.appendChild(el('small', null, 'Contra')); var rc = el('span', 'pj-rc'), ru = MAGNA.crestUrl(rid); if (ru) rc.style.backgroundImage = 'url("' + ru + '")'; else rc.appendChild(el('b', null, MAGNA.teamName(rid).slice(0, 2).toUpperCase())); vs.appendChild(rc); vs.appendChild(el('b', null, MAGNA.teamName(rid))); w.appendChild(vs);
    var row = el('div', 'pj-row'), L = roster(m, k), N = L.length;
    if (!N) row.appendChild(el('div', 'pj-e', 'Alineación por confirmar'));
    L.forEach(function (p, i) { var x = ST[p.id] || {}, bo = (S().ballon || []).filter(function (b) { return b.winner === p.id; }).length, cd = el('div', 'pj-c'), inn = el('div', 'pj-ci');
      cd.style.setProperty('--d', (.45 + i * .16) + 's'); cd.style.setProperty('--s', (1.6 + N * .16 + i * 1.1) + 's'); cd.style.setProperty('--sp', (N * 1.1) + 's');
      inn.appendChild(el('span', 'pj-no', String(i + 1).padStart(2, '0')));
      var av = el('span', 'pj-av'); av.appendChild(el('i')); av.appendChild(el('b', null, p.name.slice(0, 1).toUpperCase())); inn.appendChild(av);
      inn.appendChild(el('b', 'pj-nm', p.name)); inn.appendChild(el('i', 'pj-tag' + (t.coach === p.id ? '' : ' x'), t.coach === p.id ? 'Capitán' : p.slot === 'starter' ? 'Titular' : 'Jugador'));
      var sr = el('div', 'pj-st'); [['PJ', x.pj || 0], ['Goles', x.g || 0], ['MVP', x.mvp || 0]].forEach(function (z) { var d = el('span'); d.appendChild(el('b', null, String(z[1]))); d.appendChild(el('small', null, z[0])); sr.appendChild(d); }); inn.appendChild(sr);
      var bd = el('div', 'pj-bd'), tt = (x.titles || []).length; if (tt) bd.appendChild(el('span', null, '🏆 ' + tt)); if (bo) bd.appendChild(el('span', 'gold', '⚽ Balón de Oro' + (bo > 1 ? ' x' + bo : ''))); inn.appendChild(bd);
      cd.appendChild(inn); row.appendChild(cd); });
    w.appendChild(row); var co = t.coach != null ? MAGNA.by(S().players, t.coach) : null;
    w.appendChild(el('div', 'pj-ft', (co && !MAGNA.plays(co) ? 'DT · ' + co.name + ' — ' : '') + (c ? c.name : 'Amistoso') + (m.round ? ' · ' + m.round : '')));
    return w; }
  // fondo según el torneo (los banners de cada competición)
  function bgKind(m) { var c = MAGNA.compOf(m), n = c ? c.name : ''; if (m.type === 'friendly') return 'amistoso'; if (/omega/i.test(n)) return 'omega'; if (/champions/i.test(n)) return 'champions'; if (/(star|super)\s*nova/i.test(n)) return 'starnova'; if (/mundial/i.test(n)) return 'mundial'; if (m.type === 'league') return 'liga'; return ''; }
  // draft: bloqueos y elecciones de brawlers de un set
  var prevDr = {};
  function draftView(m, idx) { var z = (m.sets || [])[idx] || {}, d = z.draft || {}, F = d.first === 'a' ? 'a' : 'h', O = F === 'h' ? 'a' : 'h', B = d.bans || {}, P = d.picks || {}, mc = (MAGNA.MODE_COLOR || {})[z.mode] || '#8b5cf6';
    var ord = [[F, 0], [O, 0], [O, 1], [F, 1], [F, 2], [O, 2]], bansFull = ['h', 'a'].every(function (k) { return (B[k] || []).filter(Boolean).length >= 3; }), next = null;
    if (bansFull) for (var i = 0; i < ord.length; i++) if (!((P[ord[i][0]] || [])[ord[i][1]])) { next = ord[i]; break; }
    var w = el('div', 'dr'); w.style.setProperty('--mc', mc);
    var top = el('div', 'dr-top'); top.appendChild(el('small', null, 'Draft · Set ' + (idx + 1))); top.appendChild(el('b', null, z.mode || 'Modo por definir')); if (z.map) top.appendChild(el('span', null, z.map));
    top.appendChild(el('em', 'dr-ph' + (bansFull ? (next ? '' : ' ok') : ' bn'), !bansFull ? 'Fase de bloqueos' : next ? 'Elige ' + MAGNA.teamName(next[0] === 'h' ? m.home : m.away) : '¡Draft listo!')); w.appendChild(top);
    ['h', 'a'].forEach(function (k) { var tid = k === 'h' ? m.home : m.away, col = el('div', 'dr-t ' + k + (next && next[0] === k ? ' turn' : ''));
      var hd = el('div', 'dr-hd'); hd.appendChild(crest(tid)); var tx = el('div'); tx.appendChild(el('b', null, MAGNA.teamName(tid))); tx.appendChild(el('small', null, k === F ? '1.ª elección' : '2.ª elección')); hd.appendChild(tx); col.appendChild(hd);
      var bn = el('div', 'dr-bans'); bn.appendChild(el('small', null, 'Bloqueos')); var br = el('div', 'dr-br');
      for (var j = 0; j < 3; j++) { var v = (B[k] || [])[j] || '', id = 'b' + k + j, sl = el('span', 'dr-ban' + (v ? '' : ' em') + (v && prevDr[id] !== v ? ' nw' : '')); sl.appendChild(el('b', null, v || '?')); br.appendChild(sl); prevDr[id] = v; }
      bn.appendChild(br); col.appendChild(bn);
      var pk = el('div', 'dr-picks');
      for (var j2 = 0; j2 < 3; j2++) { var v2 = (P[k] || [])[j2] || '', id2 = 'p' + k + j2, n = 0; ord.forEach(function (o, oi) { if (o[0] === k && o[1] === j2) n = oi + 1; });
        var isNext = next && next[0] === k && next[1] === j2, c = el('div', 'dr-pk' + (v2 ? '' : ' em') + (isNext ? ' nx' : '') + (v2 && prevDr[id2] !== v2 ? ' nw' : ''));
        c.appendChild(el('i', 'dr-n', '#' + n)); if (v2) { c.appendChild(el('span', 'dr-wm', v2.slice(0, 1).toUpperCase())); c.appendChild(el('b', null, v2)); } else c.appendChild(el('b', 'dr-wait', isNext ? 'Eligiendo…' : '—'));
        pk.appendChild(c); prevDr[id2] = v2; }
      col.appendChild(pk); w.appendChild(col); });
    w.appendChild(el('div', 'dr-vs', 'VS'));
    return w; }
  // transición especial Omega Cup: 5 segundos
  function omegaWipe(after, m) { var ox = document.getElementById('omx'), c = MAGNA.compOf(m), ed = edition(c, /omega/i) || 'I';
    ox.className = 'omx'; ox.innerHTML = '';
    ox.appendChild(el('i', 'o-bg')); ox.appendChild(el('i', 'o-dk')); var sh = el('div', 'o-sh');
    for (var e = 0; e < 26; e++) { var em = el('i', 'o-em'); em.style.left = Math.random() * 100 + '%'; em.style.setProperty('--t', (1.6 + Math.random() * 2.2) + 's'); em.style.setProperty('--dl', (Math.random() * 1.8) + 's'); em.style.setProperty('--sz', (.3 + Math.random() * .6) + 'vw'); sh.appendChild(em); }
    sh.appendChild(el('i', 'o-ring')); sh.appendChild(el('b', 'o-om', 'Ω'));
    var wd = el('div', 'o-wd'); 'OMEGA'.split('').forEach(function (ch, i) { var sp = el('span', null, ch); sp.style.setProperty('--i', i); wd.appendChild(sp); }); sh.appendChild(wd);
    var cp = el('div', 'o-cup'); cp.appendChild(el('span', null, 'Cup')); var eb = el('div', 'o-ed'); eb.appendChild(el('small', null, 'Edición')); eb.appendChild(el('b', null, ed)); cp.appendChild(eb); sh.appendChild(cp);
    sh.appendChild(el('span', 'o-tag', 'Torneo oficial · Magna Arena'));
    ox.appendChild(sh); var lv = el('div', 'o-lava'); lv.innerHTML = '<svg viewBox="0 0 1920 200" preserveAspectRatio="none"><path d="M0 120 Q 120 40 240 110 T 480 100 T 720 120 T 960 90 T 1200 120 T 1440 95 T 1680 120 T 1920 100 V200 H0Z"/></svg>'; ox.appendChild(lv); ox.appendChild(el('i', 'o-fl'));
    void ox.offsetWidth; ox.classList.add('go'); clearTimeout(twT); twT = setTimeout(after, 4300); setTimeout(function () { ox.className = 'omx'; ox.innerHTML = ''; }, 5200); }
  // apuestas: probabilidad y cuotas como en la página de Apuestas (Bits ficticios)
  function betInfo(m) { var pv = MAGNA.matchPreview(m), p = pv.p, cl = function (v) { return Math.min(25, Math.max(1.05, v)); }; return { pv: pv, p: p, oh: cl(.94 / p), oa: cl(.94 / (1 - p)) }; }
  function siteUrl() { var h = location.host || ''; return (/vercel\.app$|magna/i.test(h) && !/claude/i.test(h) ? h : 'magna-sports.vercel.app') + '/apuestas'; }
  function fmtO(o) { return 'x' + o.toFixed(2).replace(/0$/, ''); }
  function betsView(m) { var bi = betInfo(m), pv = bi.pv, ph = Math.round(bi.p * 100), w = el('div', 'bt'), c = MAGNA.compOf(m);
    var hd = el('div', 'bt-hd'); hd.appendChild(el('small', null, 'Apuestas · ' + (c ? c.name : 'Amistoso'))); hd.appendChild(el('b', null, '¿Quién se lleva el partido?')); w.appendChild(hd);
    var bar = el('div', 'bt-bar'); bar.style.setProperty('--p', ph + '%'); var bh = el('i', 'h'); bh.appendChild(el('b', null, ph + '%')); var ba = el('i', 'a'); ba.appendChild(el('b', null, (100 - ph) + '%')); bar.appendChild(bh); bar.appendChild(ba); w.appendChild(bar);
    var cs = el('div', 'bt-cs');
    [['h', m.home, bi.oh, pv.form.h, pv.pos.h, pv.h2h.h], ['a', m.away, bi.oa, pv.form.a, pv.pos.a, pv.h2h.a]].forEach(function (x, i) { var cd = el('div', 'bt-c ' + x[0]); cd.style.animationDelay = (.5 + i * .15) + 's';
      var tp = el('div', 'bt-ct'); tp.appendChild(crest(x[1])); tp.appendChild(el('b', null, MAGNA.teamName(x[1]))); cd.appendChild(tp);
      var od = el('div', 'bt-od'); od.appendChild(el('small', null, 'Cuota')); od.appendChild(el('b', null, fmtO(x[2]))); od.appendChild(el('span', null, '100 Bits → ' + Math.round(100 * x[2]))); cd.appendChild(od);
      var fx = el('div', 'bt-fx'); var f1 = el('span'); f1.appendChild(el('small', null, 'Racha')); var ch = el('em'); (x[3].s || '').split('').forEach(function (r) { ch.appendChild(el('i', r === 'V' ? 'v' : 'd', r)); }); if (!x[3].s) ch.appendChild(el('i', 'n', 'Sin partidos')); f1.appendChild(ch); fx.appendChild(f1);
      var f2 = el('span'); f2.appendChild(el('small', null, 'Ranking')); f2.appendChild(el('b', null, x[4] ? '#' + x[4] : '—')); fx.appendChild(f2);
      var f3 = el('span'); f3.appendChild(el('small', null, 'Cara a cara')); f3.appendChild(el('b', null, pv.h2h.n ? x[5] + ' V' : '—')); fx.appendChild(f3); cd.appendChild(fx);
      cs.appendChild(cd); });
    w.appendChild(cs);
    var ct = el('div', 'bt-ct2'); ct.appendChild(el('b', null, '🎰 Apuesta tus Bits')); ct.appendChild(el('span', null, siteUrl())); ct.appendChild(el('small', null, 'Bits ficticios · solo por diversión')); w.appendChild(ct);
    return w; }
  // partidos del día
  function dayKey(at) { if (!at) return ''; var d = new Date(at.replace(' ', 'T') + 'Z'); return d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate(); }
  function hhmm(at) { return at ? new Date(at.replace(' ', 'T') + 'Z').toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : '--:--'; }
  function todayView(m) { var key = dayKey(m.at) || dayKey(new Date().toISOString().slice(0, 16).replace('T', ' ')), L = S().matches.filter(function (x) { return x.status !== 'cancelled' && (x.id === m.id || dayKey(x.at) === key); }).sort(function (a, b) { return String(a.at || '').localeCompare(String(b.at || '')); }).slice(0, 6);
    var w = el('div', 'td'), hd = el('div', 'td-hd'); hd.appendChild(el('small', null, m.at ? new Date(m.at.replace(' ', 'T') + 'Z').toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Hoy')); hd.appendChild(el('b', null, 'Hoy juegan')); w.appendChild(hd);
    var ls = el('div', 'td-ls' + (L.length > 3 ? ' two' : ''));
    L.forEach(function (x, i) { var r = el('div', 'td-r' + (x.id === m.id ? ' cur' : '') + (x.status === 'live' ? ' lv' : '')); r.style.animationDelay = (.35 + i * .12) + 's'; var c = MAGNA.compOf(x);
      r.appendChild(el('span', 'td-tm', x.status === 'live' ? 'EN VIVO' : x.status === 'finished' ? 'FINAL' : hhmm(x.at)));
      var mt = el('div', 'td-mt'); [['h', x.home], null, ['a', x.away]].forEach(function (y) { if (!y) { mt.appendChild(el('b', 'td-sc', x.status === 'scheduled' ? 'VS' : (x.hs || 0) + ' - ' + (x.as || 0))); return; } var t = el('span', 'td-t ' + y[0]); t.appendChild(crest(y[1])); t.appendChild(el('em', null, MAGNA.teamName(y[1]))); mt.appendChild(t); }); r.appendChild(mt);
      r.appendChild(el('small', 'td-cp', (c ? c.name : 'Amistoso') + (x.id === m.id ? ' · Este partido' : ''))); ls.appendChild(r); });
    w.appendChild(ls); return w; }
  // anuncio de apuestas: pantalla completa de promoción
  function adView(m) { var bi = betInfo(m), w = el('div', 'ap');
    w.appendChild(el('div', 'ap-wm', 'Bits Bits Bits Bits Bits'));
    var hd = el('div', 'ap-hd'); hd.appendChild(el('span', 'ap-ic', '🎰')); var tx = el('div'); tx.appendChild(el('small', null, 'Apuestas Magna')); var t1 = el('b'); t1.appendChild(document.createTextNode('¡Apuesta tus ')); t1.appendChild(el('em', null, 'Bits')); t1.appendChild(document.createTextNode('!')); tx.appendChild(t1); hd.appendChild(tx); w.appendChild(hd);
    var stp = el('div', 'ap-steps'); [['1', 'Entra a la página', siteUrl()], ['2', 'Elige quién gana', 'Mira las cuotas en vivo'], ['3', 'Apuesta y celebra', 'Si aciertas, multiplicas tus Bits']].forEach(function (x, i) { var c = el('div', 'ap-s'); c.style.animationDelay = (.45 + i * .15) + 's'; c.appendChild(el('i', null, x[0])); var d = el('div'); d.appendChild(el('b', null, x[1])); d.appendChild(el('small', null, x[2])); c.appendChild(d); stp.appendChild(c); }); w.appendChild(stp);
    var od = el('div', 'ap-od'); od.appendChild(el('small', null, 'Cuotas de este partido')); var row = el('div', 'ap-or');
    [['h', m.home, bi.oh], ['a', m.away, bi.oa]].forEach(function (x) { var c = el('span', 'ap-t ' + x[0]); c.appendChild(crest(x[1])); c.appendChild(el('em', null, MAGNA.teamName(x[1]))); c.appendChild(el('b', null, fmtO(x[2]))); row.appendChild(c); }); od.appendChild(row); w.appendChild(od);
    w.appendChild(el('div', 'ap-ft', 'Bits ficticios · solo por diversión'));
    return w; }
  // número de edición: el romano del nombre, o contando las ediciones de esa copa
  function roman(n) { var r = '', v = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]; v.forEach(function (x) { while (n >= x[0]) { r += x[1]; n -= x[0]; } }); return r; }
  function edition(c, re) { if (!c) return ''; var m = /\b([IVXLC]+)\s*$/.exec(c.name || '') || /(\d+)\s*$/.exec(c.name || ''); if (m) return /^\d+$/.test(m[1]) ? roman(Number(m[1])) : m[1];
    var all = (S().tournaments || []).filter(function (t) { return re.test(t.name || ''); }).sort(function (x, y) { return x.id - y.id; }), i = all.map(function (t) { return t.id; }).indexOf(c.id); return roman((i < 0 ? all.length : i) + 1 + (S().history || []).filter(function (e) { return re.test(e.name || ''); }).length); }
  // alineaciones: los dos equipos lado a lado
  function lineupsView(m) { var w = el('div', 'al'), ST = {}, c = MAGNA.compOf(m); try { ST = MAGNA.playerStats(); } catch (e) {}
    var hd = el('div', 'al-hd'); hd.appendChild(el('small', null, (c ? c.name : 'Amistoso') + (m.round ? ' · ' + m.round : ''))); hd.appendChild(el('b', null, 'Alineaciones')); w.appendChild(hd);
    var pt = el('div', 'al-pitch'); ['ln', 'cc', 'ar h', 'ar a', 'gl h', 'gl a', 'dot'].forEach(function (k) { pt.appendChild(el('i', 'pl-' + k.replace(' ', ' pl-'))); });
    // posiciones de los titulares en su mitad (x, y en %), mirando al rival
    var F = { 1: [[30, 50]], 2: [[22, 50], [40, 50]], 3: [[16, 50], [36, 26], [36, 74]], 4: [[14, 50], [30, 26], [30, 74], [43, 50]], 5: [[11, 50], [26, 24], [26, 76], [42, 34], [42, 66]] };
    ['h', 'a'].forEach(function (k) { var tid = k === 'h' ? m.home : m.away, t = MAGNA.by(S().teams, tid) || {}, L = roster(m, k);
      var st = L.filter(function (p) { return p.slot === 'starter'; }); if (!st.length) st = L.slice(0, 3); st = st.slice(0, 5); var subs = L.filter(function (p) { return st.indexOf(p) < 0; });
      var tg = el('div', 'al-team ' + k); tg.appendChild(crest(tid)); tg.appendChild(el('b', null, MAGNA.teamName(tid))); w.appendChild(tg);
      (F[st.length] || []).forEach(function (pos, i) { var p = st[i], x = ST[p.id] || {}, tk = el('div', 'al-tk ' + k); tk.style.left = (k === 'h' ? pos[0] : 100 - pos[0]) + '%'; tk.style.top = pos[1] + '%'; tk.style.animationDelay = (.5 + i * .14 + (k === 'a' ? .07 : 0)) + 's';
        var av = el('span', 'al-av', p.name.slice(0, 1).toUpperCase()); if (t.coach === p.id) av.appendChild(el('i', 'al-c', 'C')); tk.appendChild(av);
        tk.appendChild(el('b', null, p.name)); tk.appendChild(el('small', null, '⚽ ' + (x.g || 0) + '  ⭐ ' + (x.mvp || 0))); pt.appendChild(tk); });
      var bn = el('div', 'al-bench ' + k); bn.appendChild(el('small', null, subs.length > 1 ? 'Suplentes' : 'Suplente'));
      if (!subs.length) bn.appendChild(el('em', 'al-none', 'Sin suplente'));
      subs.slice(0, 3).forEach(function (p, i) { var r = el('span', 'al-sub'); r.style.animationDelay = (1.1 + i * .12) + 's'; r.appendChild(el('i', null, p.name.slice(0, 1).toUpperCase())); r.appendChild(el('b', null, p.name)); bn.appendChild(r); });
      w.appendChild(bn); });
    w.appendChild(pt); return w; }
  // cara a cara: historial entre los dos equipos y estadísticas de cada uno
  function teamRec(tid, skip) { var r = { pj: 0, v: 0, e: 0, d: 0, gf: 0, gc: 0 }; S().matches.forEach(function (x) { if (x.status !== 'finished' || x.id === skip || (x.home !== tid && x.away !== tid)) return; var f = x.home === tid ? x.hs || 0 : x.as || 0, c = x.home === tid ? x.as || 0 : x.hs || 0; r.pj++; r.gf += f; r.gc += c; if (f > c) r.v++; else if (f < c) r.d++; else r.e++; }); return r; }
  function h2hView(m) { var pv = MAGNA.matchPreview(m), H = pv.h2h, w = el('div', 'hh'), n = H.n || 0;
    var hd = el('div', 'hh-hd'); hd.appendChild(el('small', null, 'Encuentros anteriores')); hd.appendChild(el('b', null, 'Cara a cara')); w.appendChild(hd);
    var mid = el('div', 'hh-mid'), tl = el('div', 'hh-tl');
    [['h', m.home, H.h], null, ['a', m.away, H.a]].forEach(function (x) { if (!x) { tl.appendChild(el('span', 'hh-n', n ? n + (n === 1 ? ' partido' : ' partidos') : 'Primer duelo')); return; } var t = el('div', 'hh-w ' + x[0]); t.appendChild(crest(x[1])); t.appendChild(el('b', null, String(x[2] || 0))); t.appendChild(el('small', null, 'Victorias')); tl.appendChild(t); });
    mid.appendChild(tl);
    var bar = el('div', 'hh-bar'), ph = n ? Math.round((H.h || 0) / Math.max(1, (H.h || 0) + (H.a || 0)) * 100) : 50; bar.style.setProperty('--p', ph + '%'); bar.appendChild(el('i', 'h')); bar.appendChild(el('i', 'a')); mid.appendChild(bar);
    var ls = el('div', 'hh-ls'); if (!H.last || !H.last.length) ls.appendChild(el('div', 'hh-e', 'Nunca se han enfrentado: ¡hoy se escribe la historia!'));
    (H.last || []).forEach(function (g, i) { var r = el('div', 'hh-r' + (g.h > g.a ? ' wh' : g.a > g.h ? ' wa' : '')); r.style.animationDelay = (.8 + i * .1) + 's'; r.appendChild(el('small', null, g.at ? new Date(String(g.at).replace(' ', 'T') + (String(g.at).length <= 16 ? 'Z' : '')).toLocaleDateString('es', { day: 'numeric', month: 'short', year: '2-digit' }) : (g.hist ? 'Historial' : '—'))); var sc = el('b'); sc.appendChild(el('span', 'h', String(g.h))); sc.appendChild(document.createTextNode(' - ')); sc.appendChild(el('span', 'a', String(g.a))); r.appendChild(sc); r.appendChild(el('em', null, g.h > g.a ? MAGNA.teamName(m.home) : g.a > g.h ? MAGNA.teamName(m.away) : 'Empate')); ls.appendChild(r); });
    mid.appendChild(ls); w.appendChild(mid);
    [['h', m.home, pv.form.h, pv.pos.h], ['a', m.away, pv.form.a, pv.pos.a]].forEach(function (x) { var r = teamRec(x[1], m.id), col = el('div', 'hh-t ' + x[0]), th = el('div', 'hh-th'); th.appendChild(el('b', null, MAGNA.teamName(x[1]))); th.appendChild(el('small', null, x[3] ? 'Ranking #' + x[3] : 'Sin ranking')); col.appendChild(th);
      [['Partidos', r.pj], ['Victorias', r.v], ['Derrotas', r.d], ['Goles a favor', r.gf], ['Goles en contra', r.gc], ['% de victorias', r.pj ? Math.round(r.v / r.pj * 100) + '%' : '—']].forEach(function (z, i) { var row = el('div', 'hh-s'); row.style.animationDelay = (.5 + i * .08) + 's'; row.appendChild(el('small', null, z[0])); row.appendChild(el('b', null, String(z[1]))); col.appendChild(row); });
      var fr = el('div', 'hh-f'); fr.appendChild(el('small', null, 'Racha')); var ch = el('em'); (x[2].s || '').split('').forEach(function (c) { ch.appendChild(el('i', c === 'V' ? 'v' : 'd', c)); }); if (!x[2].s) ch.appendChild(el('i', 'n', '—')); fr.appendChild(ch); col.appendChild(fr);
      w.appendChild(col); });
    return w; }
  // ===== presentaciones para los casters =====
  function scr(cls, small, big) { var w = el('div', 'sc ' + cls), hd = el('div', 'sc-hd'); hd.appendChild(el('small', null, small)); hd.appendChild(el('b', null, big)); w.appendChild(hd); return w; }
  function compLabel(m) { var c = MAGNA.compOf(m); return (c ? c.name : 'Amistoso') + (m.round ? ' · ' + m.round : ''); }
  function compMatches(m) { var c = MAGNA.compOf(m); return S().matches.filter(function (x) { return c ? x.type === m.type && x.cid === m.cid : x.type === 'friendly'; }); }
  // 1 · tabla de posiciones (liga, o fase de grupos / liga de un torneo)
  function tableRows(m) { var c = MAGNA.compOf(m); if (!c || m.type === 'friendly') return null; var grp = m.type === 'tournament' ? (m.group || null) : null;
    var ms = compMatches(m).filter(function (x) { return m.type === 'league' || (grp ? x.group === grp : !!x.group || c.format === 'round_robin'); }); if (m.type === 'tournament' && !ms.length) return null;
    var ids = grp ? Array.from(new Set(ms.reduce(function (a, x) { return a.concat([x.home, x.away]); }, []))) : (c.teamIds || []), r = {}, win = (c.config && c.config.win) || 3, loss = (c.config && c.config.loss) || (c.format === 'champions' ? 1 : 0);
    ids.forEach(function (t) { r[t] = { id: t, pj: 0, v: 0, d: 0, gf: 0, gc: 0, pts: 0 }; });
    ms.forEach(function (x) { if (x.status !== 'finished' || !r[x.home] || !r[x.away]) return; var a = r[x.home], b = r[x.away]; a.pj++; b.pj++; a.gf += x.hs || 0; a.gc += x.as || 0; b.gf += x.as || 0; b.gc += x.hs || 0; var w = (x.hs || 0) > (x.as || 0) ? [a, b] : [b, a]; w[0].v++; w[1].d++; w[0].pts += win; w[1].pts += loss; });
    return { grp: grp, rows: Object.keys(r).map(function (k) { r[k].dg = r[k].gf - r[k].gc; return r[k]; }).sort(function (x, y) { return y.pts - x.pts || y.dg - x.dg || y.gf - x.gf; }) }; }
  function tableView(m, after) { var T = tableRows(m), w = scr('tbl', compLabel(m) + (T && T.grp ? ' · Grupo ' + T.grp : ''), after ? 'Así queda la tabla' : 'Tabla de posiciones');
    if (!T) { w.appendChild(el('div', 'sc-e', 'Esta competición no tiene tabla')); return w; }
    var tb = el('div', 'tb-t'), hd = el('div', 'tb-r hd'); ['#', 'Equipo', 'PJ', 'V', 'D', 'DG', 'PTS'].forEach(function (x) { hd.appendChild(el('span', null, x)); }); tb.appendChild(hd);
    T.rows.slice(0, 10).forEach(function (x, i) { var r = el('div', 'tb-r' + (x.id === m.home ? ' h' : x.id === m.away ? ' a' : '')); r.style.animationDelay = (.3 + i * .06) + 's'; r.appendChild(el('span', 'ps', String(i + 1))); var t = el('span', 'tm'); t.appendChild(crest(x.id)); t.appendChild(el('em', null, MAGNA.teamName(x.id))); r.appendChild(t);
      [x.pj, x.v, x.d, (x.dg > 0 ? '+' : '') + x.dg].forEach(function (v) { r.appendChild(el('span', null, String(v))); }); r.appendChild(el('b', null, String(x.pts))); tb.appendChild(r); });
    w.appendChild(tb); if (!after && m.status !== 'finished') { var win = (MAGNA.compOf(m).config || {}).win || 3; w.appendChild(el('div', 'sc-ft', 'Hoy se juegan ' + win + ' puntos')); } return w; }
  // 2 · cuadro del torneo (eliminatorias)
  function roundOrd(r) { r = String(r || ''); return /play.?off/i.test(r) ? 0 : /dieciseisavos/i.test(r) ? 1 : /octavos/i.test(r) ? 2 : /cuartos/i.test(r) ? 3 : /semi/i.test(r) ? 4 : /tercer/i.test(r) ? 4.5 : /final/i.test(r) ? 5 : 1; }
  function bracketRounds(m) { if (m.type !== 'tournament') return null; var ko = compMatches(m).filter(function (x) { return !x.group && x.round; }); if (!ko.length) return null; var R = {};
    ko.forEach(function (x) { var k = x.round; (R[k] = R[k] || {})[[x.home, x.away].sort().join('-')] = (R[k][[x.home, x.away].sort().join('-')] || []).concat([x]); });
    return Object.keys(R).sort(function (a, b) { return roundOrd(a) - roundOrd(b); }).map(function (k) { return { name: k, ties: Object.keys(R[k]).map(function (t) { return R[k][t]; }) }; }); }
  function bracketView(m) { var B = bracketRounds(m), w = scr('brk', compLabel(m).split(' · ')[0], 'Cuadro del torneo'); if (!B) { w.appendChild(el('div', 'sc-e', 'Todavía no hay eliminatorias')); return w; }
    var g = el('div', 'bk-g'); g.style.setProperty('--n', B.length);
    B.forEach(function (R, ri) { var col = el('div', 'bk-c'); col.appendChild(el('small', null, R.name)); var ts = el('div', 'bk-ts');
      R.ties.forEach(function (T, ti) { var a = T[0].home, b = T[0].away, sa = 0, sb = 0, done = T.every(function (x) { return x.status === 'finished'; }), cur = T.some(function (x) { return x.id === m.id; }); T.forEach(function (x) { if (x.status === 'scheduled') return; sa += x.home === a ? (x.hs || 0) : (x.as || 0); sb += x.home === a ? (x.as || 0) : (x.hs || 0); });
        var t = el('div', 'bk-t' + (cur ? ' cur' : '')); t.style.animationDelay = (.3 + ri * .15 + ti * .05) + 's';
        [[a, sa], [b, sb]].forEach(function (y, k) { var r = el('div', 'bk-r' + (done && ((k === 0 && sa > sb) || (k === 1 && sb > sa)) ? ' w' : '')); r.appendChild(crest(y[0])); r.appendChild(el('em', null, MAGNA.teamName(y[0]))); r.appendChild(el('b', null, T.some(function (x) { return x.status !== 'scheduled'; }) ? String(y[1]) : '–')); t.appendChild(r); });
        ts.appendChild(t); }); col.appendChild(ts); g.appendChild(col); });
    w.appendChild(g); return w; }
  // 3 · jugador a seguir (el más destacado de cada equipo)
  function starOf(tid, ST) { var P = S().players.filter(function (p) { return p.teamId === tid && MAGNA.plays(p); }); P.sort(function (x, y) { var a = ST[x.id] || {}, b = ST[y.id] || {}; return ((b.g || 0) * 2 + (b.mvp || 0) * 3 + (b.w || 0)) - ((a.g || 0) * 2 + (a.mvp || 0) * 3 + (a.w || 0)); }); return P[0] || null; }
  function starsView(m) { var ST = {}; try { ST = MAGNA.playerStats(); } catch (e) {} var w = scr('js', compLabel(m), 'Jugadores a seguir');
    ['h', 'a'].forEach(function (k) { var tid = k === 'h' ? m.home : m.away, p = starOf(tid, ST), cd = el('div', 'js-c ' + k); if (!p) { cd.appendChild(el('div', 'sc-e', 'Sin jugadores')); w.appendChild(cd); return; } var x = ST[p.id] || {}, bo = (S().ballon || []).filter(function (b) { return b.winner === p.id; }).length;
      var av = el('div', 'js-av'); av.appendChild(el('b', null, p.name.slice(0, 1).toUpperCase())); av.appendChild(el('i', null)); cd.appendChild(av);
      var tx = el('div', 'js-tx'); var tm = el('span', 'js-tm'); tm.appendChild(crest(tid)); tm.appendChild(el('em', null, MAGNA.teamName(tid))); tx.appendChild(tm); tx.appendChild(el('b', null, p.name)); 
      var gr = el('div', 'js-st'); [['Partidos', x.pj || 0], ['Goles', x.g || 0], ['MVP', x.mvp || 0], ['Victorias', x.w || 0], ['Nota', x.nota != null ? Number(x.nota).toFixed(1) : '—'], ['Títulos', (x.titles || []).length]].forEach(function (z) { var d = el('span'); d.appendChild(el('b', null, String(z[1]))); d.appendChild(el('small', null, z[0])); gr.appendChild(d); }); tx.appendChild(gr);
      if (bo) tx.appendChild(el('span', 'js-bo', '⚽ Balón de Oro' + (bo > 1 ? ' x' + bo : ''))); cd.appendChild(tx); w.appendChild(cd); });
    return w; }
  // 5 · goleadores y MVP de la competición
  function leadersView(m) { var ms = compMatches(m).filter(function (x) { return x.status !== 'scheduled'; }), G = {}, V = {};
    ms.forEach(function (x) { var L2 = x.live || {}; (L2.ev || []).forEach(function (e) { if (e.k === 'goal' && e.player) G[e.player] = (G[e.player] || 0) + 1; }); if (L2.mvp) V[L2.mvp] = (V[L2.mvp] || 0) + 1; });
    var w = scr('ld', compLabel(m).split(' · ')[0], 'Líderes del torneo'), g = el('div', 'ld-g');
    [['⚽ Goleadores', G, 'goles'], ['⭐ MVP', V, 'MVP']].forEach(function (z, ci) { var col = el('div', 'ld-c'); col.appendChild(el('small', null, z[0])); var L3 = Object.keys(z[1]).map(function (id) { return [Number(id), z[1][id]]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 5);
      if (!L3.length) col.appendChild(el('div', 'sc-e', 'Aún sin datos'));
      L3.forEach(function (y, i) { var p = MAGNA.by(S().players, y[0]); if (!p) return; var r = el('div', 'ld-r' + (i === 0 ? ' top' : '')); r.style.animationDelay = (.35 + ci * .1 + i * .08) + 's'; r.appendChild(el('span', 'ps', String(i + 1))); r.appendChild(el('span', 'av', p.name.slice(0, 1).toUpperCase())); var nm = el('div', 'nm'); nm.appendChild(el('b', null, p.name)); nm.appendChild(el('small', null, p.teamId ? MAGNA.teamName(p.teamId) : 'Libre')); r.appendChild(nm); var v = el('div', 'vl'); v.appendChild(el('b', null, String(y[1]))); v.appendChild(el('small', null, z[2])); r.appendChild(v); col.appendChild(r); });
      g.appendChild(col); }); w.appendChild(g); return w; }
  // 8 · predicción del público (página de Predicción)
  var predCache = {};
  function predView(m) { var c = MAGNA.compOf(m), w = scr('pr', compLabel(m).split(' · ')[0], '¿Qué dice el público?'), body = el('div', 'pr-b'); w.appendChild(body);
    function draw(board) { body.innerHTML = ''; var mh = 0, ma = 0, ch = {}, n = (board || []).length;
      (board || []).forEach(function (u) { (u.picks || []).forEach(function (x) { if (x.k === 'match' && Number(x.r) === m.id) { if (x.p === m.home) mh++; else if (x.p === m.away) ma++; } if (x.k === 'champion' && x.p) ch[x.p] = (ch[x.p] || 0) + 1; }); });
      var b1 = el('div', 'pr-m'); b1.appendChild(el('small', null, 'Quién gana este partido' + (mh + ma ? ' · ' + (mh + ma) + ' predicciones' : '')));
      var tot = mh + ma, ph = tot ? Math.round(mh / tot * 100) : 50, bar = el('div', 'bt-bar pr-bar'); bar.style.setProperty('--p', ph + '%'); var bh = el('i', 'h'); bh.appendChild(el('b', null, tot ? ph + '%' : '—')); var ba = el('i', 'a'); ba.appendChild(el('b', null, tot ? (100 - ph) + '%' : '—')); bar.appendChild(bh); bar.appendChild(ba); b1.appendChild(bar);
      var nm = el('div', 'pr-nm'); [m.home, m.away].forEach(function (t) { var s2 = el('span'); s2.appendChild(crest(t)); s2.appendChild(el('em', null, MAGNA.teamName(t))); nm.appendChild(s2); }); b1.appendChild(nm); body.appendChild(b1);
      var top = Object.keys(ch).map(function (k) { return [Number(k), ch[k]]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 4), tc = top.reduce(function (s3, x) { return s3 + x[1]; }, 0);
      if (top.length) { var b2 = el('div', 'pr-c'); b2.appendChild(el('small', null, 'Favoritos al título')); top.forEach(function (x, i) { var r = el('div', 'pr-r'); r.style.animationDelay = (.4 + i * .1) + 's'; r.appendChild(crest(x[0])); r.appendChild(el('em', null, MAGNA.teamName(x[0]))); var bb = el('i'); bb.style.setProperty('--p', Math.round(x[1] / tc * 100) + '%'); r.appendChild(bb); r.appendChild(el('b', null, Math.round(x[1] / tc * 100) + '%')); b2.appendChild(r); }); body.appendChild(b2); }
      if (!n) body.appendChild(el('div', 'sc-e', 'Todavía nadie ha predicho. ¡Haz la tuya!'));
      w.appendChild(el('div', 'sc-ft', '🔮 Haz tu predicción en ' + siteUrl().replace('/apuestas', '/prediccion'))); }
    if (!c || m.type !== 'tournament') { draw([]); return w; }
    if (predCache[c.id] && Date.now() - predCache[c.id].t < 60000) draw(predCache[c.id].b); else { draw([]); if (window.MAGNA_SB) window.MAGNA_SB().then(function (sb) { return sb.rpc('pred_board', { p_tour: c.id }); }).then(function (r) { var b = (r && !r.error && r.data) || []; predCache[c.id] = { t: Date.now(), b: b }; if (body.isConnected) { w.querySelectorAll('.sc-ft').forEach(function (x) { x.remove(); }); draw(b); } }, function () {}); }
    return w; }
  // 9 · los sets del partido y cómo le va a cada equipo en cada modo
  function modeRec(tid, mode) { var v = 0, d = 0; S().matches.forEach(function (x) { if (x.home !== tid && x.away !== tid) return; (x.sets || []).forEach(function (z) { if (z.mode !== mode || !z.w) return; var mine = (z.w === 'h') === (x.home === tid); if (mine) v++; else d++; }); }); return { v: v, d: d }; }
  function setsView(m) { var w = scr('sv', compLabel(m), 'Los sets del partido'), sets = m.sets || [], ls = el('div', 'sv-ls');
    if (!sets.length) ls.appendChild(el('div', 'sc-e', 'Los sets se anuncian pronto'));
    sets.forEach(function (z, i) { var mc = (MAGNA.MODE_COLOR || {})[z.mode] || '#8b5cf6', r = el('div', 'sv-r' + (z.w ? ' done' : '')); r.style.setProperty('--mc', mc); r.style.animationDelay = (.3 + i * .1) + 's';
      r.appendChild(el('span', 'n', String(i + 1))); var md = el('div', 'md'); md.appendChild(el('b', null, z.mode || 'Por definir')); md.appendChild(el('small', null, z.map || 'Mapa por definir')); r.appendChild(md);
      [m.home, m.away].forEach(function (t, k) { var rc = modeRec(t, z.mode), s2 = el('span', 'rc ' + (k ? 'a' : 'h')); s2.appendChild(el('b', null, rc.v + 'V · ' + rc.d + 'D')); s2.appendChild(el('small', null, MAGNA.teamName(t))); r.appendChild(s2); });
      r.appendChild(el('em', 'st', z.w ? '✓ ' + MAGNA.teamName(z.w === 'h' ? m.home : m.away) : 'Por jugar')); ls.appendChild(r); });
    w.appendChild(ls); w.appendChild(el('div', 'sc-ft', 'Historial de cada equipo en cada modo')); return w; }
  // 10 · resultados de la jornada
  function roundView(m) { var same = compMatches(m).filter(function (x) { return x.id !== m.id && x.status !== 'cancelled' && (m.round ? x.round === m.round : dayKey(x.at) === dayKey(m.at)); }).sort(function (a, b) { return String(a.at || '').localeCompare(String(b.at || '')); }).slice(0, 6);
    var w = scr('rj', compLabel(m).split(' · ')[0], m.round ? m.round + ' · resultados' : 'Resultados del día'), ls = el('div', 'td-ls' + (same.length > 3 ? ' two' : ''));
    if (!same.length) ls.appendChild(el('div', 'sc-e', 'No hay más partidos en esta jornada'));
    same.forEach(function (x, i) { var r = el('div', 'td-r' + (x.status === 'live' ? ' lv' : '')); r.style.animationDelay = (.35 + i * .1) + 's'; r.appendChild(el('span', 'td-tm', x.status === 'live' ? 'EN VIVO' : x.status === 'finished' ? 'FINAL' : hhmm(x.at)));
      var mt = el('div', 'td-mt'); [['h', x.home], null, ['a', x.away]].forEach(function (y) { if (!y) { mt.appendChild(el('b', 'td-sc', x.status === 'scheduled' ? 'VS' : (x.hs || 0) + ' - ' + (x.as || 0))); return; } var t = el('span', 'td-t ' + y[0]); t.appendChild(crest(y[1])); t.appendChild(el('em', null, MAGNA.teamName(y[1]))); mt.appendChild(t); }); r.appendChild(mt); ls.appendChild(r); });
    w.appendChild(ls); return w; }
  // 15 · MVP del partido
  function mvpView(m) { var L2 = m.live || {}, ev = L2.ev || [], G = {}; ev.forEach(function (e) { if (e.k === 'goal' && e.player) G[e.player] = (G[e.player] || 0) + 1; });
    var pid = L2.mvp || Object.keys(G).sort(function (a, b) { return G[b] - G[a]; })[0], p = pid ? MAGNA.by(S().players, Number(pid)) : null, w = scr('mv', compLabel(m), L2.mvp ? 'MVP del partido' : 'Figura del partido');
    if (!p) { w.appendChild(el('div', 'sc-e', 'El MVP se anuncia en breve')); return w; }
    var cd = el('div', 'mv-c'), av = el('div', 'mv-av'); av.appendChild(el('b', null, p.name.slice(0, 1).toUpperCase())); av.appendChild(el('i', 'mv-cr', '★')); cd.appendChild(av);
    var tx = el('div', 'mv-tx'), tm = el('span', 'js-tm'); tm.appendChild(crest(p.teamId)); tm.appendChild(el('em', null, MAGNA.teamName(p.teamId))); tx.appendChild(tm); tx.appendChild(el('b', null, p.name));
    var gr = el('div', 'js-st'), rt = (L2.ratings || {})[p.id]; [['Goles', G[p.id] || 0], ['Nota', rt != null ? Number(rt).toFixed(1) : '—'], ['Resultado', (m.hs || 0) + ' - ' + (m.as || 0)]].forEach(function (z) { var d = el('span'); d.appendChild(el('b', null, String(z[1]))); d.appendChild(el('small', null, z[0])); gr.appendChild(d); }); tx.appendChild(gr); cd.appendChild(tx); w.appendChild(cd);
    for (var i = 0; i < 18; i++) { var cf = el('i', 'mv-cf'); cf.style.left = Math.random() * 100 + '%'; cf.style.setProperty('--dl', Math.random() * 2 + 's'); cf.style.setProperty('--x', (Math.random() * 12 - 6) + 'vw'); w.appendChild(cf); }
    return w; }
  // 17 · próximo partido de cada equipo
  function nextView(m) { var w = scr('nx', compLabel(m).split(' · ')[0], 'Próximos partidos'), g = el('div', 'nx-g');
    ['h', 'a'].forEach(function (k) { var tid = k === 'h' ? m.home : m.away, nx = S().matches.filter(function (x) { return x.id !== m.id && x.status === 'scheduled' && x.at && (x.home === tid || x.away === tid); }).sort(function (a, b) { return String(a.at).localeCompare(String(b.at)); })[0], cd = el('div', 'nx-c ' + k);
      var hd = el('div', 'nx-h'); hd.appendChild(crest(tid)); hd.appendChild(el('b', null, MAGNA.teamName(tid))); cd.appendChild(hd);
      if (!nx) cd.appendChild(el('div', 'sc-e', 'Sin partido programado')); else { var rv = nx.home === tid ? nx.away : nx.home, c2 = MAGNA.compOf(nx), bd = el('div', 'nx-b'); bd.appendChild(el('small', null, 'Contra')); var rr = el('div', 'nx-rv'); rr.appendChild(crest(rv)); rr.appendChild(el('em', null, MAGNA.teamName(rv))); bd.appendChild(rr);
        bd.appendChild(el('span', 'nx-d', new Date(nx.at.replace(' ', 'T') + 'Z').toLocaleString('es', { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }))); bd.appendChild(el('span', 'nx-cp', (c2 ? c2.name : 'Amistoso') + (nx.round ? ' · ' + nx.round : ''))); cd.appendChild(bd); }
      g.appendChild(cd); }); w.appendChild(g); return w; }
  // 13 · pausa técnica
  function pauseView(m) { var w = el('div', 'pa'); w.appendChild(el('i', 'pa-lo')); w.appendChild(el('b', null, 'Pausa técnica')); w.appendChild(el('span', null, 'Volvemos enseguida')); var d = el('div', 'pa-dt'); for (var i = 0; i < 3; i++) d.appendChild(el('i')); w.appendChild(d);
    w.appendChild(el('small', null, MAGNA.teamName(m.home) + ' ' + (m.hs || 0) + ' - ' + (m.as || 0) + ' ' + MAGNA.teamName(m.away) + ' · ' + compLabel(m))); return w; }
  // 11 y 12 · cintas de casters y mensaje
  var castAt = null, msgAt = null;
  function strips(m) { var L2 = m.live || {}, cs = document.getElementById('cst'), ms = document.getElementById('msg'), C = L2.cast || {}, M = L2.msg || {};
    if (false && C.names && C.at !== castAt) { if (castAt !== null || m.status === 'live') { cs.innerHTML = ''; cs.appendChild(el('span', 'k', '🎙️ Narran')); cs.appendChild(el('b', null, C.names)); cs.className = 'cst'; void cs.offsetWidth; cs.classList.add('go'); } castAt = C.at; }
    if (M.on && M.t) { if (M.at !== msgAt) { ms.innerHTML = ''; ms.appendChild(el('span', 'k', M.k || '💬 Mensaje')); ms.appendChild(el('b', null, M.t)); ms.className = 'msg on'; msgAt = M.at; } } else { ms.className = 'msg'; msgAt = null; } }
  // ===== marco común de todas las presentaciones (estética de la página de Partidos) =====
  var ACC = { champions: '#22d3ee', omega: '#ff8a3d', starnova: '#9f8bff', mundial: '#2ee59d', liga: '#c6ff1a', amistoso: '#ffd23f' }, ROT_MS = 10000;
  var TT = { fe: 'Final del encuentro', rd: 'Síguenos', ew: 'Equipo de la semana', cl: '¿Quién pasa?', cd: 'Cuenta regresiva', cr: 'Créditos', h: 'Así llega', a: 'Así llega', al: 'Alineaciones', hh: 'Cara a cara', bt: 'Así van las apuestas', ad: '¡Apuesta tus Bits!', td: 'Hoy juegan', tb: 'Tabla de posiciones', cu: 'Cuadro del torneo', js: 'Jugadores a seguir', gt: 'Líderes del torneo', pr: '¿Qué dice el público?', st: 'Los sets del partido', rj: 'Resultados de la jornada', mvp: 'MVP del partido', nx: 'Próximos partidos', cs: 'Hoy narran', dr: 'Draft', pa: 'Pausa técnica' };
  var SHORT = { fe: 'Final del encuentro', rd: 'Redes', ew: 'Equipo de la semana', cl: 'Quién pasa', cd: 'Cuenta regresiva', cr: 'Créditos', pt: 'Portada', h: 'Local', a: 'Visitante', al: 'Alineaciones', hh: 'Cara a cara', bt: 'Apuestas', ad: 'Apuesta tus Bits', td: 'Hoy juegan', tb: 'Tabla', cu: 'Cuadro', js: 'Jugadores a seguir', gt: 'Líderes', pr: 'Predicción', st: 'Sets', rj: 'Jornada', mvp: 'MVP', nx: 'Próximos', cs: 'Casters' };
  function nm(t) { return MAGNA.teamName(t); }
  // dato para que los casters hablen
  function fact(m, v) { try { var pv = MAGNA.matchPreview(m), H = nm(m.home), A = nm(m.away), ST = MAGNA.playerStats(), fh = pv.form.h.s || '', fa = pv.form.a.s || '';
      var streak = function (s) { var c = s.charAt(0), n = 0; while (n < s.length && s.charAt(n) === c) n++; return { c: c, n: n }; };
      if (v === 'h' || v === 'a') { var t = v === 'h' ? H : A, f = v === 'h' ? fh : fa, k = streak(f); return f ? t + (k.c === 'V' ? ' viene de ' + k.n + (k.n > 1 ? ' victorias seguidas' : ' victoria') : ' viene de ' + k.n + (k.n > 1 ? ' derrotas seguidas: necesita reaccionar' : ' derrota: busca revancha')) : t + ' estrena su historia hoy'; }
      if (v === 'hh') return pv.h2h.n ? (pv.h2h.h === pv.h2h.a ? 'Empatados en el historial: ¡hoy se rompe la igualdad!' : (pv.h2h.h > pv.h2h.a ? H : A) + ' domina el historial ' + Math.max(pv.h2h.h, pv.h2h.a) + '-' + Math.min(pv.h2h.h, pv.h2h.a)) : 'Primer duelo entre ' + H + ' y ' + A;
      if (v === 'tb') { var T = tableRows(m); if (T) { var r = T.rows, ih = r.map(function (x) { return x.id; }).indexOf(m.home) + 1, ia = r.map(function (x) { return x.id; }).indexOf(m.away) + 1; return nm(r[0].id) + ' lidera con ' + r[0].pts + ' pts · ' + H + ' es ' + ih + '.º y ' + A + ' es ' + ia + '.º'; } }
      if (v === 'js' || v === 'al') { var sh = starOf(m.home, ST), sa = starOf(m.away, ST); if (sh && sa) return sh.name + ' (' + ((ST[sh.id] || {}).g || 0) + ' goles) contra ' + sa.name + ' (' + ((ST[sa.id] || {}).g || 0) + ' goles): ¿quién decide?'; }
      if (v === 'bt') { var bi = betInfo(m); return 'La cuota de ' + (bi.oh > bi.oa ? H : A) + ' paga ' + fmtO(Math.max(bi.oh, bi.oa)) + ': ¿habrá sorpresa?'; }
      if (v === 'st') { var z = (m.sets || [])[0]; if (z && z.mode) { var rh = modeRec(m.home, z.mode), ra = modeRec(m.away, z.mode); return 'En ' + z.mode + ': ' + H + ' ' + rh.v + 'V-' + rh.d + 'D · ' + A + ' ' + ra.v + 'V-' + ra.d + 'D'; } }
      if (v === 'mvp') { var L2 = m.live || {}; if (L2.mvp) { var p = MAGNA.by(S().players, Number(L2.mvp)); if (p) return p.name + ' suma ' + ((ST[p.id] || {}).mvp || 0) + ' MVP en su carrera'; } }
      if (v === 'cu') return 'Quien gane esta llave sigue soñando con el título';
      if (v === 'td') return 'Una jornada llena de Brawl: no te muevas';
      if (v === 'gt') return 'Cada gol de hoy cambia la tabla de goleadores';
      if (v === 'pr') return 'Haz tu predicción y suma puntos en la página';
      if (v === 'nx') return 'La historia sigue: así viene el calendario';
      if (v === 'cs') return '¡Escríbeles en el chat!';
      if (v === 'fe') return m.hs === m.as ? 'Reparto de puntos: nadie se rindió' : nm((m.hs || 0) > (m.as || 0) ? m.home : m.away) + ' se queda con la victoria';
      if (v === 'rd') return 'Comparte la transmisión con tus amigos';
      if (v === 'ew') return 'Los mejores de la jornada, según goles, nota y MVP';
      if (v === 'cl') return 'Cada punto cuenta en la pelea por clasificar';
      if (v === 'cd') return 'Prepárate: ' + H + ' contra ' + A;
      if (v === 'cr') return '¡Gracias por acompañarnos!';
      return fh ? H + ': ' + fh + ' · ' + A + ': ' + (fa || '—') : 'Comunidad Magna Sports'; } catch (e) { return 'Comunidad Magna Sports'; } }
  function frame(m, v, cont, nextV) { var bk = bgKind(m), fr = el('div', 'fr v-' + v); fr.style.setProperty('--acc', ACC[bk] || '#c6ff1a'); fr.style.setProperty('--rot', ROT_MS + 'ms');
    var c = MAGNA.compOf(m), title = v === 'tb' && m.status === 'finished' ? 'Así queda la tabla' : v === 'dr' ? 'Draft · Set ' + (((m.live || {}).draft) || 1) : (v === 'h' || v === 'a') ? 'Así llega ' + nm(v === 'h' ? m.home : m.away) : (TT[v] || '');
    fr.appendChild(el('i', 'fr-pn')); var hd = el('div', 'fr-hd'); hd.appendChild(el('i', 'fr-lo')); hd.appendChild(el('i', 'fr-wm', title)); var tx = el('div', 'fr-tx'); tx.appendChild(el('small', null, (c ? c.name : 'Amistoso') + (m.round ? ' · ' + m.round : ''))); var tb2 = el('b', null, title); if (title.length > 22) tb2.style.fontSize = Math.max(2.6, 4 * 22 / title.length) + 'vw'; tx.appendChild(tb2); hd.appendChild(tx);
    var mc = el('div', 'fr-mc'); [m.home, null, m.away].forEach(function (t) { if (t == null) { mc.appendChild(el('b', 'fr-sc' + (m.status === 'live' ? ' lv' : ''), m.status === 'scheduled' ? 'VS' : (m.hs || 0) + ' - ' + (m.as || 0))); return; } var s2 = el('span'); s2.appendChild(crest(t)); s2.appendChild(el('em', null, nm(t))); mc.appendChild(s2); });
    mc.appendChild(el('small', 'fr-st' + (m.status === 'live' ? ' lv' : ''), m.status === 'live' ? '● En vivo' : m.status === 'finished' ? 'Final' : m.at ? 'Hoy · ' + hhmm(m.at) : 'Próximamente')); hd.appendChild(mc); fr.appendChild(hd);
    var cn = el('div', 'fr-cn'); cn.appendChild(cont); fr.appendChild(cn);
    var ft = el('div', 'fr-ft'); var lg2 = el('span', 'fr-lg'); lg2.appendChild(el('i')); lg2.appendChild(el('b', null, 'Magna Arena')); ft.appendChild(lg2);
    var dt = el('div', 'fr-dt'); dt.appendChild(el('em', null, 'Dato')); dt.appendChild(el('span', null, fact(m, v))); ft.appendChild(dt);
    if (nextV) { var nx = el('div', 'fr-nx'); nx.appendChild(el('small', null, 'Sigue')); nx.appendChild(el('b', null, SHORT[nextV] || '')); nx.appendChild(el('i')); ft.appendChild(nx); }
    fr.appendChild(ft);
    setTimeout(function () { [].forEach.call(fr.querySelectorAll('.fr-cn b'), function (b2) { var t = b2.textContent; if (!/^\d{1,3}$/.test(t) || b2.children.length) return; var n = Number(t); if (n < 2) return; var t0 = performance.now(); (function step(now) { var k = Math.min(1, (now - t0) / 900); b2.textContent = String(Math.round(n * (1 - Math.pow(1 - k, 3)))); if (k < 1) requestAnimationFrame(step); })(t0); }); }, 350);
    return fr; }
  // ===== nuevas: final del encuentro, redes, equipo de la semana, clasificados, cuenta regresiva y créditos =====
  function BC() { return S().broadcast || {}; }
  function finalView(m) { var w = el('div', 'fe'), ev = (m.live || {}).ev || [], sets = m.sets || [], ss = MAGNA.setScore(m), hs = m.hs || 0, as2 = m.as || 0, wn = hs > as2 ? m.home : as2 > hs ? m.away : null;
    var ban = el('div', 'fe-ban' + (wn ? '' : ' tie')); ban.appendChild(el('small', null, 'Final del encuentro')); ban.appendChild(el('b', null, wn ? '¡Gana ' + nm(wn) + '!' : '¡Empate!')); w.appendChild(ban);
    var sc = el('div', 'fe-sc'); [['h', m.home, hs], null, ['a', m.away, as2]].forEach(function (x) { if (!x) { sc.appendChild(el('i', null, '-')); return; } var t = el('div', 'fe-t ' + x[0] + (wn === x[1] ? ' w' : '')); t.appendChild(crest(x[1])); t.appendChild(el('em', null, nm(x[1]))); t.appendChild(el('b', null, String(x[2]))); sc.appendChild(t); }); w.appendChild(sc);
    if (sets.length) { var sr = el('div', 'fe-sets'); sr.appendChild(el('small', null, 'Sets ' + ss.h + ' - ' + ss.a)); sets.forEach(function (z, i) { var c2 = el('span', z.w ? 'w' + z.w : ''); c2.style.setProperty('--mc', (MAGNA.MODE_COLOR || {})[z.mode] || '#8b5cf6'); c2.appendChild(el('b', null, 'Set ' + (i + 1))); c2.appendChild(el('em', null, z.mode || '—')); c2.appendChild(el('i', null, z.w ? nm(z.w === 'h' ? m.home : m.away) : 'No se jugó')); sr.appendChild(c2); }); w.appendChild(sr); }
    var gl = el('div', 'fe-gl'); ['h', 'a'].forEach(function (k) { var col = el('div', 'fe-g ' + k), L2 = ev.filter(function (e) { return e.k === 'goal' && e.side === k; }); col.appendChild(el('small', null, '⚽ Goles de ' + nm(k === 'h' ? m.home : m.away))); if (!L2.length) col.appendChild(el('span', 'n', 'Sin goles')); L2.slice(0, 6).forEach(function (e) { col.appendChild(el('span', null, (e.player ? MAGNA.playerName(e.player) : 'Gol') + (e.min ? '  ' + e.min + "'" : ''))); }); gl.appendChild(col); }); w.appendChild(gl);
    return w; }
  var NET = [['discord', 'Discord', '💬'], ['whatsapp', 'WhatsApp', '📱'], ['instagram', 'Instagram', '📸'], ['tiktok', 'TikTok', '🎵'], ['youtube', 'YouTube', '▶️'], ['twitch', 'Twitch', '🎮'], ['x', 'X / Twitter', '✖️'], ['web', 'Página web', '🌐']];
  function socialsView(m) { var R = BC().redes || {}, w = el('div', 'rd'), L2 = NET.filter(function (n) { return R[n[0]]; }); if (!L2.length) L2 = [['web', 'Página web', '🌐']];
    w.appendChild(el('div', 'rd-in', 'Únete a la comunidad y no te pierdas ningún partido'));
    var g = el('div', 'rd-g' + (L2.length > 4 ? ' many' : '')); L2.forEach(function (n, i) { var c2 = el('div', 'rd-c ' + n[0]); c2.style.animationDelay = (.3 + i * .1) + 's'; c2.appendChild(el('span', 'ic', n[2])); var tx = el('div'); tx.appendChild(el('small', null, n[1])); tx.appendChild(el('b', null, R[n[0]] || (location.host && !/claude/i.test(location.host) ? location.host : 'magna-sports.vercel.app'))); c2.appendChild(tx); g.appendChild(c2); }); w.appendChild(g);
    return w; }
  function weekView(m) { var key = m.round, ms = compMatches(m).filter(function (x) { return x.status === 'finished' && (key ? x.round === key : dayKey(x.at) === dayKey(m.at)); }), P = {};
    if (!ms.length) ms = S().matches.filter(function (x) { return x.status === 'finished' && x.at && Date.now() - Date.parse(x.at.replace(' ', 'T') + 'Z') < 7 * 864e5; });
    ms.forEach(function (x) { var L2 = x.live || {}; (L2.ev || []).forEach(function (e) { if (e.k === 'goal' && e.player) { var p = P[e.player] = P[e.player] || { g: 0, r: null, mvp: 0 }; p.g++; } }); Object.keys(L2.ratings || {}).forEach(function (id) { var p = P[id] = P[id] || { g: 0, r: null, mvp: 0 }; p.r = Math.max(p.r || 0, Number(L2.ratings[id]) || 0); }); if (L2.mvp) { var q2 = P[L2.mvp] = P[L2.mvp] || { g: 0, r: null, mvp: 0 }; q2.mvp++; } });
    var top = Object.keys(P).map(function (id) { var x = P[id]; return { id: Number(id), g: x.g, r: x.r, mvp: x.mvp, s: x.g * 2 + x.mvp * 3 + (x.r || 6) }; }).sort(function (a, b) { return b.s - a.s; }).slice(0, 5), w = el('div', 'ew');
    if (!top.length) { w.appendChild(el('div', 'sc-e', 'Aún no hay partidos jugados esta jornada')); return w; }
    var g = el('div', 'ew-g'); top.forEach(function (x, i) { var p = MAGNA.by(S().players, x.id); if (!p) return; var c2 = el('div', 'ew-c' + (i === 0 ? ' top' : '')); c2.style.animationDelay = (.3 + i * .1) + 's'; c2.appendChild(el('span', 'ps', String(i + 1))); c2.appendChild(el('span', 'av', p.name.slice(0, 1).toUpperCase())); c2.appendChild(el('b', null, p.name)); var tm = el('span', 'tm'); tm.appendChild(crest(p.teamId)); tm.appendChild(el('em', null, p.teamId ? nm(p.teamId) : 'Libre')); c2.appendChild(tm);
      var st = el('div', 'st'); [['Goles', x.g], ['Nota', x.r ? x.r.toFixed(1) : '—'], ['MVP', x.mvp]].forEach(function (z) { var d = el('span'); d.appendChild(el('b', null, String(z[1]))); d.appendChild(el('small', null, z[0])); st.appendChild(d); }); c2.appendChild(st); g.appendChild(c2); });
    w.appendChild(g); return w; }
  function qualView(m) { var T = tableRows(m), c = MAGNA.compOf(m), w = el('div', 'cl'); if (!T) { w.appendChild(el('div', 'sc-e', 'Esta competición no tiene fase de clasificación')); return w; }
    var n = T.rows.length, z = c && c.zones && typeof c.zones === 'object' ? { d: Number(c.zones.d) || 0, p: Number(c.zones.p) || 0 } : { d: T.grp ? 2 : m.type === 'league' ? 1 : Math.max(1, Math.floor(n / 2)), p: 0 }, lab = m.type === 'league' && !T.grp ? ['Zona de título', '', 'Persiguen'] : ['Clasifican', 'Play-off', 'En peligro'];
    var lg = el('div', 'cl-lg'); [['d', lab[0]], ['p', lab[1]], ['o', lab[2]]].forEach(function (x) { if (!x[1] || (x[0] === 'p' && !z.p)) return; var s2 = el('span', x[0]); s2.appendChild(el('i')); s2.appendChild(document.createTextNode(x[1])); lg.appendChild(s2); }); w.appendChild(lg);
    var ls = el('div', 'cl-ls'); T.rows.slice(0, 10).forEach(function (x, i) { var zz = i < z.d ? 'd' : i < z.d + z.p ? 'p' : 'o', r = el('div', 'cl-r ' + zz + (x.id === m.home || x.id === m.away ? ' hl' : '')); r.style.animationDelay = (.3 + i * .06) + 's'; r.appendChild(el('span', 'ps', String(i + 1))); var t = el('span', 'tm'); t.appendChild(crest(x.id)); t.appendChild(el('em', null, nm(x.id))); r.appendChild(t); r.appendChild(el('span', 'pt', x.pts + ' pts')); r.appendChild(el('span', 'tg', zz === 'd' ? '✔ ' + lab[0] : zz === 'p' ? '◆ ' + lab[1] : (i >= n - Math.max(1, Math.floor(n / 4)) ? '⚠ ' + lab[2] : '· ' + (m.type === 'league' ? lab[2] : 'Afuera por ahora')))); ls.appendChild(r); if (i === z.d - 1 || (z.p && i === z.d + z.p - 1)) ls.appendChild(el('i', 'cl-cut')); }); w.appendChild(ls);
    return w; }
  function countdownView(m) { var w = el('div', 'cd'), t = m.at ? Date.parse(m.at.replace(' ', 'T') + 'Z') : 0; w.appendChild(el('small', null, 'El partido empieza en'));
    if (t && t < Date.now() && q('ver') === 'cd' && q('demo')) t = (window.__cdDemo = window.__cdDemo || Date.now() + 300000); var n = el('b', 'cd-n'); n.dataset.t = t; n.textContent = cdTxt(t); if (!t || t <= Date.now()) n.classList.add('soon'); w.appendChild(n);
    var vs = el('div', 'cd-vs'); [m.home, null, m.away].forEach(function (x) { if (x == null) { vs.appendChild(el('i', null, 'VS')); return; } var s2 = el('span'); s2.appendChild(crest(x)); s2.appendChild(el('em', null, nm(x))); vs.appendChild(s2); }); w.appendChild(vs);
    w.appendChild(el('span', 'cd-h', m.at ? 'Hora: ' + hhmm(m.at) : 'Hora por confirmar')); return w; }
  function cdTxt(t) { if (!t) return 'Por confirmar'; var d = Math.max(0, Math.round((t - Date.now()) / 1000)); if (d <= 0) return '¡En breve!'; if (d >= 86400) return Math.floor(d / 86400) + ' d ' + String(Math.floor(d % 86400 / 3600)).padStart(2, '0') + ' h'; var h2 = Math.floor(d / 3600), mi = Math.floor(d % 3600 / 60), se = d % 60; return (h2 ? h2 + ':' + String(mi).padStart(2, '0') : String(mi).padStart(2, '0')) + ':' + String(se).padStart(2, '0'); }
  setInterval(function () { [].forEach.call(document.querySelectorAll('.cd-n'), function (n) { var t = Number(n.dataset.t); n.textContent = cdTxt(t); n.classList.toggle('soon', !t || t <= Date.now()); }); }, 1000);
  function creditsView(m) { var b = BC(), L2 = m.live || {}, w = el('div', 'cr'); w.appendChild(el('b', 'cr-ty', '¡Gracias por ver!'));
    var g = el('div', 'cr-g'); [['🎙️ Narración y comentarios', (L2.cast && L2.cast.names) || 'Equipo de casters Magna'], ['🛠️ Organización', b.org || 'Administración de Magna Sports'], ['🏆 Competición', compLabel(m)], ['💜 Comunidad', 'Magna Sports · Magna Arena']].forEach(function (x, i) { var c2 = el('div', 'cr-c'); c2.style.animationDelay = (.4 + i * .12) + 's'; c2.appendChild(el('small', null, x[0])); c2.appendChild(el('b', null, x[1])); g.appendChild(c2); }); w.appendChild(g);
    var R = b.redes || {}, first = NET.filter(function (n) { return R[n[0]]; })[0]; w.appendChild(el('span', 'cr-ft', first ? first[2] + ' ' + R[first[0]] : 'Nos vemos en el próximo partido'));
    return w; }
  // casters a pantalla completa
  function castersView(m) { var L2 = m.live || {}, names = String((L2.cast && L2.cast.names) || '').split(/\s*(?:,|\by\b|&|\/|\+)\s*/i).filter(Boolean).slice(0, 4), w = el('div', 'cs');
    if (!names.length) names = ['Por anunciar'];
    var g = el('div', 'cs-g cs-' + names.length); names.forEach(function (n, i) { var cd = el('div', 'cs-c'); cd.style.animationDelay = (.35 + i * .15) + 's'; var mic = el('div', 'cs-mic'); mic.appendChild(el('b', null, '🎙️')); mic.appendChild(el('i')); cd.appendChild(mic); cd.appendChild(el('small', null, i === 0 ? 'Narración' : 'Comentarios')); cd.appendChild(el('b', null, n)); g.appendChild(cd); }); w.appendChild(g);
    return w; }
  // transición especial Champions: 5 segundos
  function champWipe(after, m) { var cx = document.getElementById('chx'), c = MAGNA.compOf(m), ed = edition(c, /champions/i); cx.className = 'chx'; cx.innerHTML = '';
    cx.appendChild(el('i', 'c-bg')); cx.appendChild(el('i', 'c-bm l')); cx.appendChild(el('i', 'c-bm r')); var sh = el('div', 'c-sh');
    for (var f = 0; f < 16; f++) { var cf = el('i', 'c-cf' + (f % 3 ? '' : ' w')); cf.style.left = Math.random() * 100 + '%'; cf.style.setProperty('--dl', (1.7 + Math.random() * 1.2) + 's'); cf.style.setProperty('--t', (1.6 + Math.random() * 1.4) + 's'); cf.style.setProperty('--x', (Math.random() * 16 - 8) + 'vw'); cf.style.setProperty('--r', (Math.random() * 720) + 'deg'); sh.appendChild(cf); }
    var rg = el('div', 'c-rg'); for (var i = 0; i < 8; i++) { var st = el('i', 'c-st', '★'); st.style.setProperty('--a', (i * 45) + 'deg'); st.style.setProperty('--i', i); rg.appendChild(st); } sh.appendChild(rg);
    sh.appendChild(el('b', 'c-cr', '♛')); sh.appendChild(el('small', 'c-mg', 'Magna'));
    var wd = el('div', 'c-wd'); 'CHAMPIONS'.split('').forEach(function (ch, j) { var sp = el('span', null, ch); sp.style.setProperty('--i', j); wd.appendChild(sp); }); sh.appendChild(wd);
    if (ed) { var eb = el('div', 'c-ed'); eb.appendChild(el('small', null, 'Edición')); eb.appendChild(el('b', null, ed)); sh.appendChild(eb); }
    sh.appendChild(el('span', 'c-tag', 'Torneo oficial · Magna Arena')); cx.appendChild(sh); cx.appendChild(el('i', 'c-fl'));
    void cx.offsetWidth; cx.classList.add('go'); clearTimeout(twT); twT = setTimeout(after, 4300); setTimeout(function () { cx.className = 'chx'; cx.innerHTML = ''; }, 5200); }
  function render() {
    var m = match(); ov.innerHTML = '';
    if (!m) { ov.appendChild(el('div', 'ov-e', MID ? 'No encuentro el partido ' + MID : 'Agrega ?m=<id del partido> al enlace')); return; }
    var L = m.live || {}, ph = L.phase, c = MAGNA.compOf(m), hc = MAGNA.teamColor(m.home), ac = MAGNA.teamColor(m.away), g = detect(m), sets = m.sets || []; try { strips(m); } catch (e) {}
    document.documentElement.style.setProperty('--hc', hc); document.documentElement.style.setProperty('--ac', ac);
    if (TOP) top(m, g); else {
    // franja superior
    var tg = el('div', 'ov-tag'); tg.appendChild(el('span', m.status === 'live' ? 'lv' : '', m.status === 'live' ? 'EN VIVO' : m.status === 'finished' ? 'FINAL' : 'PRÓXIMO'));
    tg.appendChild(el('span', null, (c ? c.name : 'Amistoso') + (m.round ? ' · ' + m.round : '')));
    if (m.status === 'live') { var ck = el('span', 'ck', MAGNA.liveClock(m)); ck.id = 'ck'; tg.appendChild(ck); } ov.appendChild(tg);
    var bar = el('div', 'ov-bar');
    [['h', m.home, hc], null, ['a', m.away, ac]].forEach(function (x) {
      if (!x) { var s = el('div', 'ov-sc'), nh = el('b', 'ov-n' + (g.h ? ' bump' : ''), m.status === 'scheduled' ? '–' : String(m.hs || 0)), na = el('b', 'ov-n' + (g.a ? ' bump' : ''), m.status === 'scheduled' ? '–' : String(m.as || 0)), md = el('div', 'ov-mid');
        md.appendChild(el('b', null, phaseTxt(ph) || 'VS'));
        if (sets.length) { var pp = el('div', 'ov-pips'); sets.forEach(function (z) { pp.appendChild(el('i', z.w || '')); }); md.appendChild(pp); }
        s.appendChild(nh); s.appendChild(md); s.appendChild(na); bar.appendChild(s); return; }
      var t = el('div', 'ov-t ' + x[0]); t.style.setProperty('--tc', x[2]); t.appendChild(crest(x[1])); t.appendChild(el('span', 'ov-nm', MAGNA.teamName(x[1]))); bar.appendChild(t); });
    ov.appendChild(bar);
    var lw = lows(m), it = lw[tickI % lw.length], low = el('div', 'ov-low'); low.appendChild(el('em', null, it[0])); low.appendChild(el('span', null, it[1])); ov.appendChild(low);
    }
    // pantalla completa automática: antes de empezar, entretiempo y final
    var bk = bgKind(m), OMEGA = bk === 'omega', CHAMP = bk === 'champions'; document.documentElement.style.setProperty('--bn', 'url(img/' + (bk ? 'bn-' + bk : 'portada') + '.webp)');
    var DI = q('probar') === 'draft' ? 1 : (L.draft || 0), draftOn = !q('solo') && DI > 0 && sets[DI - 1] && m.status !== 'finished';
    var pauseOn = !q('solo') && (!!L.pause || q('ver') === 'pa') && m.status !== 'finished';
    var castOn = !q('solo') && L.cast && L.cast.names && Date.now() - (L.cast.at || 0) < 12000 && m.status !== 'finished'; if (castOn) setTimeout(render, 12100 - (Date.now() - L.cast.at));
    var forceV = /^(h|a|pt|al|bt|td|ad|hh|tb|cu|js|gt|pr|st|rj|mvp|nx|pa|cs|fe|rd|ew|cl|cd|cr)$/.test(q('ver') || '');
    var full = !q('solo') && (castOn || forceV || pauseOn || draftOn || m.status === 'scheduled' || ph === 'pre' || ph === 'HT' || m.status === 'finished');
    var apply = function () { fs.classList.toggle('on', full); ov.classList.toggle('hide', full); };
    if (prevFull !== null && prevFull !== full) { var big = (OMEGA || CHAMP) && ((!full && m.status === 'live' && ph === '1T' && !(L.ev || []).some(function (e) { return e.k === 'goal'; })) || (full && m.status === 'finished')); (big ? function (f) { (CHAMP ? champWipe : omegaWipe)(f, m); } : function (f, t) { wipe(f, t); })(apply, full ? (m.status === 'finished' ? 'Final del partido' : ph === 'HT' ? 'Entretiempo' : 'Comunidad Magna Sports') : (ph === '2T' ? 'Segundo tiempo' : '¡Empieza el partido!')); if (!full && m.status === 'live' && (L.phase === '1T') && sets[0] && !sets[0].w && !draftWas) setTimeout(function () { setStart(m, 0, sets[0]); }, big ? 5300 : 2200); } else apply(); prevFull = full; draftWas = draftOn;
    if (LG) LG.classList.toggle('off', full);
    fs.classList.add('pt'); if (!full) fsKey = '';
    if (full && draftOn && !pauseOn) { var dk = 'dr|' + JSON.stringify(sets[DI - 1].draft || {}) + '|' + (sets[DI - 1].mode || ''); if (dk !== fsKey) { fsKey = dk; fs.classList.remove('pjv'); fs.classList.add('drv'); fsIn.innerHTML = ''; fsIn.className = 'dr-in'; fsIn.appendChild(frame(m, 'dr', draftView(m, DI - 1), null)); } } else fs.classList.remove('drv');
    var preV = m.status === 'scheduled' || ph === 'pre', hasT = !!tableRows(m), hasB = !!bracketRounds(m), fixV = /^(h|a|pt|al|bt|td|ad|hh|tb|cu|js|gt|pr|st|rj|mvp|nx|pa|cs|fe|rd|ew|cl|cd|cr)$/.test(q('ver') || '') ? q('ver') : '';
    var hasC = !!(L.cast && L.cast.names); var futureAt = !!m.at && m.status === 'scheduled'; var ROT = preV ? ['pt', futureAt ? 'cd' : null, hasC ? 'cs' : null, 'h', 'a', 'al', 'hh', hasB ? 'cu' : null, hasT ? 'tb' : null, hasT ? 'cl' : null, 'js', 'gt', 'ew', 'pr', 'st', 'bt', 'ad', 'rd', 'td'] : ph === 'HT' && m.status === 'live' ? ['pt', hasT ? 'tb' : null, hasT ? 'cl' : null, hasB ? 'cu' : null, 'js', 'gt', 'pr', 'hh', 'rj', 'bt', 'ad', 'rd'] : m.status === 'finished' ? ['pt', 'fe', 'mvp', hasT ? 'tb' : null, hasT ? 'cl' : null, hasB ? 'cu' : null, 'rj', 'ew', 'nx', 'rd', 'cr'] : ['pt'];
    ROT = ROT.filter(Boolean); var view = !full ? 'pt' : pauseOn ? 'pa' : castOn ? 'cs' : fixV || (PRES ? ROT[tickI % ROT.length] : 'pt'), key = view + '|' + m.id + '|' + m.hs + '-' + m.as + '|' + ph + '|' + m.status;
    if (full && (pauseOn || !draftOn) && view !== 'pt' && key !== fsKey) { fsKey = key; fsIn.innerHTML = ''; fsIn.className = 'pj'; fs.classList.add('pjv'); var VW = { fe: finalView, rd: socialsView, ew: weekView, cl: qualView, cd: countdownView, cr: creditsView, cs: castersView, pa: pauseView, tb: function (x) { return tableView(x, x.status === 'finished'); }, cu: bracketView, js: starsView, gt: leadersView, pr: predView, st: setsView, rj: roundView, mvp: mvpView, nx: nextView }; var cont = VW[view] ? VW[view](m) : view === 'hh' ? h2hView(m) : view === 'ad' ? adView(m) : view === 'al' ? lineupsView(m) : view === 'bt' ? betsView(m) : view === 'td' ? todayView(m) : presentation(m, view), nextV = ROT.length > 1 && !fixV && !castOn && !pauseOn ? ROT[(ROT.indexOf(view) + 1) % ROT.length] : null; fsIn.appendChild(view === 'pa' ? cont : frame(m, view, cont, nextV === 'pt' ? null : nextV)); }
    if (full && !pauseOn && !draftOn && view === 'pt' && key !== fsKey) { fsKey = key; fs.classList.remove('pjv'); fsIn.innerHTML = ''; fsIn.className = 'pt-in'; var pre = preV, fin = m.status === 'finished';
      [['h', m.home], ['a', m.away]].forEach(function (x) { var cr = el('span', 'pt-cr ' + x[0]), cu = MAGNA.crestUrl(x[1]); if (cu) cr.style.backgroundImage = 'url("' + cu + '")'; else cr.appendChild(el('b', null, MAGNA.teamName(x[1]).slice(0, 2).toUpperCase())); fsIn.appendChild(cr);
        var nm = el('b', 'pt-nm ' + x[0]); nm.appendChild(el('span', null, MAGNA.teamName(x[1]).toUpperCase())); fsIn.appendChild(nm); });
      fsIn.appendChild(el('span', 'pt-k' + (pre ? '' : ' on'), fin ? 'Final del partido' : ph === 'HT' ? 'Entretiempo' : 'Empieza pronto'));
      if (!pre) { var pl = el('div', 'pt-sc'); var ss = (m.sets || []).length ? MAGNA.setScore(m) : { h: m.hs || 0, a: m.as || 0 }; pl.appendChild(el('b', null, String(ss.h))); pl.appendChild(el('i', null, '-')); pl.appendChild(el('b', null, String(ss.a))); fsIn.appendChild(pl); }
      fsIn.appendChild(el('span', 'pt-sub', (c ? c.name : 'Amistoso') + (m.round ? ' · ' + m.round : '') + (fin && (function () { var ss = (m.sets || []).length ? MAGNA.setScore(m) : { h: m.hs || 0, a: m.as || 0 }; return ss.h !== ss.a ? ' · Gana ' + MAGNA.teamName(ss.h > ss.a ? m.home : m.away) : ''; })() || '')));
      [].forEach.call(fsIn.querySelectorAll('.pt-nm span'), function (sp) { var box = sp.parentNode.clientWidth, f = parseFloat(getComputedStyle(sp).fontSize), n = 0; while (sp.scrollWidth > box && f > 12 && n++ < 40) { f -= 1; sp.style.fontSize = f + 'px'; } });
    }
    if (false) { fsIn.innerHTML = ''; var k = m.status === 'finished' ? 'Final del partido' : ph === 'HT' ? 'Entretiempo' : 'Empieza pronto'; fsIn.appendChild(el('span', 'fs-k' + (m.status === 'finished' ? ' n' : ''), k));
      var vs = el('div', 'fs-vs'); [m.home, null, m.away].forEach(function (id) { if (id == null) { vs.appendChild(el('span', 'fs-c', m.status === 'scheduled' || ph === 'pre' ? 'VS' : (m.hs || 0) + '-' + (m.as || 0))); return; } var t = el('div', 'fs-t'); t.appendChild(crest(id)); t.appendChild(el('b', null, MAGNA.teamName(id))); vs.appendChild(t); });
      fsIn.appendChild(vs); fsIn.appendChild(el('div', 'fs-sub', (c ? c.name : 'Amistoso') + (m.round ? ' · ' + m.round : '') + (m.status === 'finished' && m.hs !== m.as ? ' · Gana ' + MAGNA.teamName(m.hs > m.as ? m.home : m.away) : ''))); document.getElementById('fsWm').textContent = c ? c.name.split(' ')[0].toUpperCase() : 'MAGNA'; }
  }
  setInterval(function () { var m = match(), ck = document.getElementById('ck'); if (m && ck && m.status === 'live') ck.textContent = MAGNA.liveClock(m); }, 1000);
  setInterval(function () { tickI++; render(); }, ROT_MS);
  window.addEventListener('magna:update', render);
  render();
})();
