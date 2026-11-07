'use strict';
(function () {
  var h = M.h, FM = { round_robin: 'Todos contra todos', double_round_robin: 'Ida y vuelta', knockout: 'Eliminatorias', groups_knockout: 'Grupos + eliminatorias', champions: 'Champions: liga + play-off' }, ST = { active: ['En juego', 'a'], paused: ['En pausa', 'p'], finished: ['Finalizada', ''] };
  var COL = ['#8b5cf6', '#2ee59d', '#ffd23f', '#ff6fb1', '#4aa8ff'], kind = 'leagues', cache = {};
  function table(rows, cols) {
    var w = h('div', 'pn tw'), tb = h('table'), th = h('tr'); cols.forEach(function (c) { th.appendChild(h('th', null, c[0])); }); tb.appendChild(th);
    rows.forEach(function (r) { var tr = h('tr', r.pos && r.pos <= 3 ? 'top3' : ''); cols.forEach(function (c, i) { tr.appendChild(h('td', i > 1 ? 'n' : '', r[c[1]])); }); tb.appendChild(tr); }); w.appendChild(tb); return w;
  }
  function detail(k, it) {
    M.modal(function (b) {
      b.appendChild(h('h3', 'x', it.name)); var s = h('p', 'sub'); s.appendChild(h('span', 'badge ' + ST[it.status][1], ST[it.status][0])); s.appendChild(document.createTextNode(' ' + FM[it.config.format])); b.appendChild(s);
      if (it.description) b.appendChild(h('p', 'sub', it.description));
      if (k === 'leagues') {
        b.appendChild(h('h2', 'x', 'Clasificación')); b.appendChild(it.standings.length ? table(it.standings, [['#', 'pos'], ['Equipo', 'team'], ['PJ', 'pj'], ['G', 'g'], ['P', 'p'], ['DG', 'dg'], ['Pts', 'pts']]) : h('p', 'em', 'Sin equipos todavía.'));
      } else {
        var br = it.bracket;
        if (br) {
          b.appendChild(h('p', 'sub', br.champion ? 'Campeón: ' + br.champion.name : br.round ? 'Ronda actual: ' + br.round : br.phase === 'groups' ? (it.config.format === 'champions' ? 'Fase de liga (ida y vuelta)' : 'Fase de grupos') : ''));
          if (it.config.format === 'champions') { var cl = h('a', 'btn', 'Ver tabla y cuadro de la Champions →'); cl.href = 'champions.html?t=' + it.id; b.appendChild(cl); }
          (br.groups || []).forEach(function (g) { b.appendChild(h('h2', 'x', g.name === 'Liga' ? 'Fase de liga' : 'Grupo ' + g.name)); b.appendChild(table(g.table, [['#', 'pos'], ['Equipo', 'team'], ['G', 'g'], ['P', 'p'], ['DG', 'dg'], ['Pts', 'pts']])); });
        } else b.appendChild(h('p', 'sub', 'Series al mejor de ' + it.config.best_of + ' · ' + it.teams.length + ' equipos inscritos.'));
        b.appendChild(h('h2', 'x', 'Partidos')); var l = h('div', 'ml'); b.appendChild(l);
        M.get('/api/public/calendar').then(function (c) { var ms = c.upcoming.concat(c.recent).filter(function (m) { return m.competition === it.name; });
          if (!ms.length) l.appendChild(h('p', 'em', 'Todavía no hay partidos.')); ms.forEach(function (m) { var e = h('article', 'm'); e.style.gridTemplateColumns = '1fr auto'; var a = h('div'); a.appendChild(h('b', null, m.home + ' vs ' + m.away)); a.appendChild(h('small', null, (m.round || '') + ' · ' + M.fdt(m.starts_at))); e.appendChild(a); e.appendChild(h('span', m.status === 'finished' ? 'tt' : 'vs', m.status === 'finished' ? m.home_score + ' - ' + m.away_score : '')); l.appendChild(e); }); });
        if (it.config.rules) { b.appendChild(h('h2', 'x', 'Reglas')); var r = h('p', 'sub', it.config.rules); r.style.whiteSpace = 'pre-wrap'; b.appendChild(r); }
      }
    });
  }
  var CATN = { torneo: 'Torneo', liga: 'Liga', champions: 'Champions', otro: 'Otro' };
  function histDetail(e) {
    M.modal(function (b) {
      b.appendChild(h('h3', 'x', e.name)); b.appendChild(h('p', 'sub', (e.mundial ? 'Mundial' : CATN[e.cat] || 'Torneo') + (e.date ? ' · ' + e.date : '') + ' · Historial'));
      if (e.champion) { var c = h('p', 'sub'); c.appendChild(h('b', null, '🏆 Campeón: ' + e.champion)); b.appendChild(c); }
      var names = (e.champIds || []).map(function (id) { var p = MAGNA.by(MAGNA.S.players, id); return p ? p.name : null; }).filter(Boolean);
      if (names.length) b.appendChild(h('p', 'sub', 'Jugadores campeones: ' + names.join(', ')));
      b.appendChild(h('h2', 'x', 'Resultados')); var l = h('div', 'ml'); b.appendChild(l);
      if (!(e.matches || []).length) l.appendChild(h('p', 'em', 'No hay marcadores registrados.'));
      (e.matches || []).forEach(function (m) { var a = h('article', 'm'); a.style.gridTemplateColumns = '1fr auto'; var d = h('div'); d.appendChild(h('b', null, m.home + ' vs ' + m.away)); if (m.d) d.appendChild(h('small', null, m.d)); a.appendChild(d); a.appendChild(h('span', 'tt', m.hs + ' - ' + m.as)); l.appendChild(a); });
    });
  }
  function drawHist(g) {
    var L = ((window.MAGNA && MAGNA.S.history) || []).slice().sort(function (a, b) { return String(b.date || '').localeCompare(String(a.date || '')); });
    if (!L.length) { g.appendChild(h('p', 'em', 'Todavía no hay torneos en el historial.')); return; }
    var EDN = {}, EDC = {}; L.slice().reverse().forEach(function (e) { var k = MAGNA.baseName(e.name).toLowerCase(); EDC[k] = (EDC[k] || 0) + 1; EDN[e.id] = EDC[k]; });
    L.forEach(function (e, i) {
      var c = h('button', 'tc'); c.style.animationDelay = i * 50 + 'ms'; c.style.setProperty('--bar', COL[i % COL.length]); c.style.setProperty('--tint', M.tint(i));
      var lg = h('div', 'lg mono'); lg.appendChild(h('span', null, e.mundial ? 'Mundial' : CATN[e.cat] || 'Torneo')); lg.appendChild(h('span', 'badge', e.date ? e.date.slice(0, 4) : 'Historial')); c.appendChild(lg);
      var art = MAGNA.trophyArt(e.name, e.mundial ? 'mundial' : e.cat); if (art) c.appendChild(M.trophyImg(e.name, e.mundial ? 'mundial' : e.cat, 120)); else { var cr = h('div', 'cr'); cr.style.width = cr.style.height = '88px'; cr.style.fontSize = '34px'; cr.textContent = '🏆'; c.appendChild(cr); }
      c.appendChild(h('h3', 'x', e.name)); var ek = MAGNA.baseName(e.name).toLowerCase(); if (EDC[ek] > 1 && MAGNA.editionNo(e.name) == null) c.appendChild(h('div', 'mono', 'Edición ' + MAGNA.toRoman(EDN[e.id]))); var rk = h('div', 'ranks'); [[e.champion || '—', 'Campeón'], [(e.matches || []).length, 'Partidos']].forEach(function (x) { var d = h('div', 'rk'); d.appendChild(h('b', null, x[0])); d.appendChild(h('span', 'mono', x[1])); rk.appendChild(d); }); c.appendChild(rk);
      c.onclick = function () { histDetail(e); }; g.appendChild(c);
    });
  }
  function draw() {
    var g = document.getElementById('g'); g.innerHTML = ''; if (kind === 'history') return drawHist(g); var items = cache[kind] || [];
    if (!items.length) { g.appendChild(h('p', 'em', 'Todavía no hay ' + (kind === 'leagues' ? 'ligas' : 'torneos') + ' activos.')); return; }
    items.forEach(function (it, i) {
      var c = h('button', 'tc'); c.style.animationDelay = i * 50 + 'ms'; c.style.setProperty('--bar', COL[i % COL.length]); c.style.setProperty('--tint', M.tint(i));
      var lg = h('div', 'lg mono'); lg.appendChild(h('span', null, kind === 'leagues' ? 'Liga' : 'Torneo')); lg.appendChild(h('span', 'badge ' + ST[it.status][1], ST[it.status][0])); c.appendChild(lg);
      var cr = h('div', 'cr'); cr.style.width = cr.style.height = '88px'; cr.style.fontSize = '28px';
      if (it.has_logo) { var im = document.createElement('img'); im.alt = ''; im.src = '/api/public/' + kind + '/' + it.id + '/logo'; cr.appendChild(im); } else cr.textContent = it.name.slice(0, 2).toUpperCase(); c.appendChild(cr);
      c.appendChild(h('h3', 'x', it.name)); var rk = h('div', 'ranks'); [[it.teams.length, 'Equipos'], [FM[it.config.format], 'Formato']].forEach(function (x) { var d = h('div', 'rk'); d.appendChild(h('b', null, x[0])); d.appendChild(h('span', 'mono', x[1])); rk.appendChild(d); }); c.appendChild(rk);
      c.onclick = function () { detail(kind, it); }; g.appendChild(c);
    });
  }
  var tabs = document.getElementById('tabs');
  [['leagues', 'Ligas'], ['tournaments', 'Torneos'], ['history', 'Historial']].forEach(function (k, i) { var b = h('button', 'chip' + (i ? '' : ' on'), k[1]); b.onclick = function () { kind = k[0]; [].forEach.call(tabs.children, function (x) { x.classList.toggle('on', x === b); }); draw(); }; tabs.appendChild(b); });
  if (/historial/.test(location.hash)) { kind = 'history'; [].forEach.call(tabs.children, function (x, i) { x.classList.toggle('on', i === 2); }); }
  Promise.all([M.get('/api/public/leagues'), M.get('/api/public/tournaments')]).then(function (r) { cache.leagues = r[0].items; cache.tournaments = r[1].items; draw(); });
})();
