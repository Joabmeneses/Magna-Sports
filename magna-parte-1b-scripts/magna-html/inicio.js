'use strict';
(function () {
  var h = M.h;
  function matchRow(m, i) {
    var e = h('article', 'm'); e.style.animationDelay = i * 40 + 'ms';
    var l = h('div'); l.appendChild(h('b', null, M.fdt(m.starts_at))); l.appendChild(h('small', null, m.competition + (m.round ? ' · ' + m.round : ''))); e.appendChild(l);
    var t = h('div', 'tt'); t.appendChild(h('b', null, m.home)); t.appendChild(m.status === 'finished' ? h('span', 'sc', m.home_score + ' - ' + m.away_score) : h('span', 'vs', 'vs')); t.appendChild(h('b', null, m.away)); e.appendChild(t);
    e.appendChild(m.status === 'live' ? h('span', 'lv', '● En vivo') : h('span')); return e;
  }
  function hero(m, teams) {
    var c = document.getElementById('hero'), f = h('section', 'hero');
    if (!m) { f.appendChild(h('div', 'mono', 'Magna Arena')); var t = h('h1', 'x', 'La comunidad que compite en serio'); t.style.cssText = 'font-size:clamp(34px,7vw,72px);margin:22px 0 10px'; f.appendChild(t); f.appendChild(h('p', 'sub', 'Aún no hay partidos programados. Cuando la administración cree un torneo o una liga, aparecerá aquí el próximo encuentro.')); f.querySelector('.sub').style.margin = '0 auto'; c.appendChild(f); return; }
    var tg = h('div', 'tags mono'); tg.appendChild(h('span', 'tag' + (m.status === 'live' ? ' live' : ''), m.status === 'live' ? 'En vivo' : 'Próximo partido')); tg.appendChild(h('span', 'tag', m.competition + (m.round ? ' · ' + m.round : ''))); f.appendChild(tg);
    var d = h('div', 'duel'), side = function (id, name) { var t = h('div', 't'); t.appendChild(M.crest(id, name, 150, (teams[id] || {}).has_crest)); t.appendChild(h('b', 'x', name)); return t; };
    d.appendChild(side(m.home_team_id, m.home)); var sc = h('div', 'score x');
    if (m.status === 'live' && m.home_score != null) { sc.appendChild(h('span', null, m.home_score)); sc.appendChild(h('i')); sc.appendChild(h('span', null, m.away_score)); } else sc.appendChild(h('span', 'vs', 'VS'));
    d.appendChild(sc); d.appendChild(side(m.away_team_id, m.away)); f.appendChild(d); f.appendChild(h('span', 'when mono', M.fdt(m.starts_at))); c.appendChild(f);
  }
  Promise.all([M.get('/api/public/calendar'), M.get('/api/public/teams'), M.get('/api/public/summary'), M.get('/api/public/news'), M.get('/api/public/leagues')]).then(function (r) {
    var cal = r[0], teams = {}; r[1].teams.forEach(function (t) { teams[t.id] = t; });
    var live = cal.upcoming.filter(function (m) { return m.status === 'live'; })[0];
    hero(live || cal.upcoming[0] || null, teams);
    var s = r[2], st = document.getElementById('st');
    [['Equipos', s.teams], ['Ligas activas', s.leagues], ['Torneos activos', s.tournaments], ['Jugadores', s.players]].forEach(function (k) { var d = h('div', 'stat'); d.appendChild(h('b', null, k[1])); d.appendChild(h('span', 'mono', k[0])); st.appendChild(d); });
    var u = document.getElementById('u'); if (!cal.upcoming.length) u.appendChild(h('p', 'em', 'No hay partidos programados.')); cal.upcoming.slice(0, 5).forEach(function (m, i) { u.appendChild(matchRow(m, i)); });
    var n = document.getElementById('n'); if (!r[3].news.length) n.appendChild(h('p', 'em', 'Aún no hay novedades.')); r[3].news.slice(0, 8).forEach(function (x) { var e = h('div', null, x.text); e.appendChild(h('time', 'mono', x.at)); n.appendChild(e); });
    var lg = document.getElementById('lg'), L = r[4].items.filter(function (x) { return x.status === 'active'; })[0];
    if (!L || !L.standings.length) { lg.appendChild(h('p', 'em', 'Aún no hay una liga en juego.')); return; }
    lg.appendChild(h('p', 'sub', L.name)); var w = h('div', 'pn tw'), tb = h('table'), th = h('tr'); ['#', 'Equipo', 'PJ', 'G', 'P', 'DG', 'Pts'].forEach(function (x) { th.appendChild(h('th', null, x)); }); tb.appendChild(th);
    L.standings.slice(0, 8).forEach(function (q) { var tr = h('tr', q.pos <= 3 ? 'top3' : ''); [q.pos, q.team, q.pj, q.g, q.p, q.dg, q.pts].forEach(function (x, i) { tr.appendChild(h('td', i > 1 ? 'n' : '', x)); }); tb.appendChild(tr); }); w.appendChild(tb); lg.appendChild(w);
  });
})();
