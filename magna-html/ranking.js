'use strict';
// Ranking de Magna Arena: equipos por nivel, jugadores por media y miembros por Bits.
(function () {
  var h = M.h, tab = 'equipos', bitsRows = null, bitsErr = null;
  var TABS = [['equipos', 'Equipos'], ['jugadores', 'Jugadores'], ['bits', 'Bits']];
  var TINT = ['rgba(255,210,63,.28)', 'rgba(214,219,232,.2)', 'rgba(227,163,107,.22)'];
  function fmt(n) { return String(Math.round(Number(n || 0))).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function S() { return MAGNA.S; }
  function team(id) { return MAGNA.by(S().teams, id); }

  // ---------- equipos ----------
  function teamRows() {
    var TL = MAGNA.teamLevels(), rec = {};
    S().teams.forEach(function (t) { rec[t.id] = { pj: 0, w: 0, l: 0, gf: 0, gc: 0 }; });
    var real = S().matches.filter(function (m) { return m.status === 'finished' && m.hs != null && m.as != null; });
    real.concat(MAGNA.histMatches ? MAGNA.histMatches() : []).forEach(function (m) {
      [[m.home, m.hs, m.as], [m.away, m.as, m.hs]].forEach(function (x) { var r = rec[x[0]]; if (!r) return; r.pj++; r.gf += x[1]; r.gc += x[2]; if (x[1] > x[2]) r.w++; else r.l++; }); });
    var PT = MAGNA.teamPoints();
    return S().teams.map(function (t) { var r = rec[t.id], p = PT[t.id] || { pts: 0 }; return { t: t, pts: p.pts, bd: p, lvl: Math.round(TL.get(t.id)), pj: r.pj, w: r.w, l: r.l, dg: r.gf - r.gc, pct: r.pj ? Math.round(r.w / r.pj * 100) : null, tro: MAGNA.teamTrophies(t.id).length }; })
      .sort(function (a, b) { return b.pts - a.pts || b.lvl - a.lvl || b.w - a.w || b.dg - a.dg || a.t.name.localeCompare(b.t.name); });
  }
  function drawTeams(pod, list, note) {
    var R = teamRows(); if (!R.length) { list.appendChild(h('p', 'em', 'Todavía no hay equipos.')); return; }
    podium(pod, R.slice(0, 3).map(function (r) { return { href: 'equipo.html?id=' + r.t.id, av: M.crest(r.t.id, r.t.name, 72), name: r.t.name, sub: r.pj ? r.w + 'V · ' + r.l + 'D' + (r.tro ? ' · ' + r.tro + ' 🏆' : '') : 'Sin partidos', big: fmt(r.pts), unit: 'puntos' }; }));
    list.appendChild(table(['#', 'Equipo', 'Puntos', 'PJ', 'V', 'D', 'DG', 'Nivel', 'Trofeos'], R.map(function (r, i) {
      var pc = h('button', 'ptb', fmt(r.pts)); pc.type = 'button'; pc.title = 'Ver de dónde salen los puntos'; pc.onclick = function () { breakdown(r); };
      return [i + 1, teamLink(r.t.id, who(M.crest(r.t.id, r.t.name, 36), r.t.name, (S().players.filter(function (p) { return p.teamId === r.t.id; }).length) + ' jugadores')), pc, r.pj, r.w, r.l, (r.dg > 0 ? '+' : '') + r.dg, r.lvl, r.tro || '—']; }), [3, 4, 5, 6, 7, 8]));
    var leg = h('div', 'ptleg'); [['Liga', 'league'], ['Champions', 'champions'], ['Mundial', 'mundial'], ['Otros torneos', 'tournament'], ['Amistoso (gane o pierda)', 'friendly']].forEach(function (x) { var s = h('span'); s.appendChild(h('b', null, fmt(MAGNA.PTS[x[1]]))); s.appendChild(document.createTextNode(' ' + x[0])); leg.appendChild(s); });
    list.insertBefore(leg, list.firstChild);
    note.textContent = 'Cada victoria suma puntos según la competición: liga 15.000, Champions 35.000, Mundial 50.000 y cualquier otro torneo 25.000. En un amistoso los dos equipos suman 5.000. Toca los puntos de un equipo para ver el detalle. Incluye los torneos del historial. Si empatan en puntos, desempata el nivel.';
  }

  function breakdown(r) {
    M.modal(function (b) {
      b.appendChild(h('h3', 'x', r.t.name)); b.appendChild(h('p', 'sub', fmt(r.pts) + ' puntos en el ranking'));
      var w = h('div', 'pn tw'), tb = h('table'), th = h('tr'); ['Competición', 'Por partido', 'Puntos'].forEach(function (c) { th.appendChild(h('th', null, c)); }); tb.appendChild(th);
      [['Liga', 'league', 'victoria'], ['Champions', 'champions', 'victoria'], ['Mundial', 'mundial', 'victoria'], ['Otros torneos', 'tournament', 'victoria'], ['Amistosos', 'friendly', 'partido']].concat(r.bd.base ? [['Puntos anteriores', 'base', '']] : []).forEach(function (x) { var tr = h('tr'); tr.appendChild(h('td', null, x[0])); tr.appendChild(h('td', 'n', x[1] === 'base' ? 'De tus registros' : fmt(MAGNA.PTS[x[1]]) + ' por ' + x[2])); tr.appendChild(h('td', 'n', fmt(r.bd[x[1]] || 0))); tb.appendChild(tr); });
      w.appendChild(tb); b.appendChild(w);
    });
  }
  // ---------- jugadores ----------
  function playerRows() {
    var P = MAGNA.playerStats();
    return S().players.filter(function (p) { if (MAGNA.plays(p)) return true; var x = P[p.id] || {}; return (x.pj || 0) > 0 || (x.titles || []).length > 0; }).map(function (p) { var x = P[p.id] || {}; return { p: p, media: x.media == null ? 10 : x.media, pj: x.pj || 0, w: x.w || 0, l: x.l || 0, g: x.g || 0, mvp: x.mvp || 0, nota: x.nota, titles: (x.titles || []).length }; })
      .sort(function (a, b) { return b.media - a.media || b.titles - a.titles || b.w - a.w || a.p.name.localeCompare(b.p.name); });
  }
  function pSub(p, t) { if (!MAGNA.plays(p)) { var dt = S().teams.filter(function (x) { return x.coach === p.id; })[0]; return 'Ahora Solo coach' + (dt ? ' · DT de ' + dt.name : ''); } return t ? t.name + (p.slot === 'reserve' ? ' · suplente' : '') : 'Agente libre'; }
  function initials(n, avId) { var a = h('div', 'av'), u = window.MAGNA_AVATAR_URL && MAGNA_AVATAR_URL(avId); if (u) { var im = h('img'); im.src = u; im.alt = ''; a.appendChild(im); } else a.textContent = String(n).slice(0, 2).toUpperCase(); return a; }
  function drawPlayers(pod, list, note) {
    var R = playerRows(); if (!R.length) { list.appendChild(h('p', 'em', 'Todavía no hay jugadores.')); return; }
    podium(pod, R.slice(0, 3).map(function (r) { var t = team(r.p.teamId); return { av: M.tierAv(r.p.name, r.media, null, r.p.id), name: r.p.name, sub: pSub(r.p, t) + ' · ' + MAGNA.tierOf(r.media).name, big: r.media, unit: 'media' }; }));
    list.appendChild(table(['#', 'Jugador', 'Media', 'Nivel', 'PJ', 'V-D', 'Goles', 'MVP', 'Trofeos'], R.map(function (r, i) {
      var t = team(r.p.teamId), tr = MAGNA.tierOf(r.media), tg = h('span', 'tier', tr.name); tg.style.setProperty('--c', tr.color);
      var md = h('div'); md.appendChild(h('b', null, String(r.media))); var bar = h('div', 'bar2'), fill = h('i'); fill.style.width = r.media + '%'; bar.appendChild(fill); md.appendChild(bar);
      return [i + 1, who(M.tierAv(r.p.name, r.media, 36, r.p.id), r.p.name, pSub(r.p, t)), md, tg, r.pj, r.w + '-' + r.l, r.g, r.mvp, r.titles || '—']; }), [3, 4, 5, 6, 7]));
    note.textContent = 'La media va de 10 a 100. Sale de los resultados contra rivales de distinto nivel y de las valoraciones de cada partido. Los títulos aseguran un mínimo de media.';
  }

  // ---------- bits ----------
  function loadBits() {
    if (!window.MAGNA_SB || MAGNA.cloud.source !== 'cloud') { bitsErr = 'El ranking de Bits necesita conexión con la base de datos.'; return draw(); }
    window.MAGNA_SB().then(function (sb) { return sb.rpc('bits_ranking'); }).then(function (r) { if (r.error) throw r.error; bitsRows = r.data || []; draw(); }, function () { bitsErr = 'No se pudo cargar el ranking de Bits. Recarga la página.'; draw(); });
  }
  function drawBits(pod, list, note) {
    note.textContent = 'Saldo de Bits de cada miembro con cuenta. Los Bits se ganan con pronósticos acertados en Apuestas y son una moneda ficticia sin valor real.';
    if (bitsErr) { list.appendChild(h('p', 'em', bitsErr)); return; }
    if (bitsRows === null) { list.appendChild(M.skel(6)); return; }
    if (!bitsRows.length) { list.appendChild(h('p', 'em', 'Todavía no hay cuentas de miembros.')); return; }
    var top = bitsRows[0].bits || 1;
    podium(pod, bitsRows.slice(0, 3).map(function (r) { var p = r.player_id && MAGNA.by(S().players, r.player_id), t = p && team(p.teamId); return { av: initials(r.display_name, r.avatar), name: r.display_name, sub: t ? t.name : p ? 'Agente libre' : 'Miembro', big: fmt(r.bits), unit: 'Bits' }; }));
    list.appendChild(table(['#', 'Miembro', 'Bits', ''], bitsRows.map(function (r, i) {
      var p = r.player_id && MAGNA.by(S().players, r.player_id), t = p && team(p.teamId), bar = h('div', 'bar2'), f = h('i'); f.style.width = Math.max(2, Math.round(r.bits / top * 100)) + '%'; bar.appendChild(f);
      return [i + 1, who(initials(r.display_name, r.avatar), r.display_name, p ? (t ? t.name : 'Agente libre') : 'Miembro'), h('b', null, fmt(r.bits)), bar]; }), [3]));
  }

  function teamLink(id, el) { var a = h('a'); a.href = 'equipo.html?id=' + id; a.style.cssText = 'color:inherit;text-decoration:none;display:block'; a.appendChild(el); return a; }
  // ---------- piezas ----------
  function who(av, name, sub) { var w = h('div', 'who'); w.appendChild(av); var t = h('div'); t.appendChild(h('b', null, name)); if (sub) t.appendChild(h('small', null, sub)); w.appendChild(t); return w; }
  function podium(pod, items) {
    var order = items.length === 3 ? [1, 0, 2] : items.map(function (_, i) { return i; });
    order.forEach(function (i, k) { var it = items[i], c = h(it.href ? 'a' : 'div', 'pc p' + (i + 1)); if (it.href) { c.href = it.href; c.style.textDecoration = 'none'; c.style.color = 'inherit'; } c.style.setProperty('--tint', TINT[i]); c.style.animationDelay = k * 80 + 'ms';
      c.appendChild(h('span', 'ps', String(i + 1))); c.appendChild(it.av); var tx = h('div', 'txt'); tx.appendChild(h('b', null, it.name)); tx.appendChild(document.createElement('br')); tx.appendChild(h('small', null, it.sub)); c.appendChild(tx);
      var bg = h('div', 'sc'); bg.appendChild(h('div', 'big', String(it.big))); bg.appendChild(h('small', null, it.unit)); c.appendChild(bg); pod.appendChild(c); });
    if (items.length < 3) pod.style.gridTemplateColumns = 'repeat(' + items.length + ',minmax(0,320px))';
  }
  function table(cols, rows, hideOnMobile) {
    var w = h('div', 'pn tw'), tb = h('table', 'rt'), th = h('tr'); hideOnMobile = hideOnMobile || [];
    cols.forEach(function (c, i) { th.appendChild(h('th', hideOnMobile.indexOf(i) >= 0 ? 'hide-s' : null, c)); }); tb.appendChild(th);
    rows.forEach(function (r, ri) { var tr = h('tr', ri < 3 ? 'top3' : ''); r.forEach(function (v, i) { var td = h('td', (i === 0 ? 'pos ' : i > 1 ? 'n ' : '') + (hideOnMobile.indexOf(i) >= 0 ? 'hide-s' : '')); if (v && v.nodeType) td.appendChild(v); else td.textContent = v == null ? '' : String(v); tr.appendChild(td); }); tb.appendChild(tr); });
    w.appendChild(tb); return w;
  }
  function draw() {
    var pod = document.getElementById('pod'), list = document.getElementById('list'), note = document.getElementById('note');
    pod.innerHTML = ''; pod.style.gridTemplateColumns = ''; list.innerHTML = ''; note.textContent = '';
    if (tab === 'equipos') drawTeams(pod, list, note); else if (tab === 'jugadores') drawPlayers(pod, list, note); else { if (bitsRows === null && !bitsErr) loadBits(); drawBits(pod, list, note); }
    [].forEach.call(document.getElementById('tabs').children, function (b) { var on = b.dataset.k === tab; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
  }
  var tabs = document.getElementById('tabs');
  TABS.forEach(function (k) { var b = h('button', 'chip', k[1]); b.type = 'button'; b.dataset.k = k[0]; b.setAttribute('role', 'tab'); b.onclick = function () { tab = k[0]; try { history.replaceState(null, '', '#' + tab); } catch (e) {} draw(); }; tabs.appendChild(b); });
  var hs = location.hash.slice(1); if (TABS.some(function (k) { return k[0] === hs; })) tab = hs;
  draw();
  window.addEventListener('magna:update', function () { if (tab !== 'bits') draw(); });
})();
