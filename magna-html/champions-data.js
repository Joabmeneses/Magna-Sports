'use strict';
// Tabla única con todos los equipos, calculada con los partidos terminados del panel.
(function () {
  var S = MAGNA.S, by = MAGNA.by, COL = ['#8b5cf6', '#2ee59d', '#ffd23f', '#ff5a36', '#ff4d5e', '#22d3ee', '#f472b6', '#a3e635', '#60a5fa'], LGC = {};
  S.leagues.forEach(function (l, i) { LGC[l.name] = COL[i % COL.length]; });
  S.tournaments.forEach(function (l, i) { LGC[l.name] = COL[(i + S.leagues.length) % COL.length]; });
  window.MAGNA_CH_LGC = LGC;
  window.MAGNA_CH_TEAMS = function () {
    var played = S.matches.filter(function (m) { return m.status === 'finished'; }), ids = {};
    played.forEach(function (m) { ids[m.home] = 1; ids[m.away] = 1; });
    return Object.keys(ids).map(Number).map(function (id) {
      var t = by(S.teams, id), ms = played.filter(function (m) { return m.home === id || m.away === id; }).sort(function (a, b) { return String(b.at).localeCompare(String(a.at)); }), g = 0, p = 0, gf = 0, gc = 0;
      ms.forEach(function (m) { var h = m.home === id, f = h ? m.hs : m.as, c = h ? m.as : m.hs; gf += f; gc += c; f > c ? g++ : p++; });
      var comp = S.leagues.concat(S.tournaments).filter(function (c) { return c.teamIds.indexOf(id) >= 0; })[0], u = MAGNA.crestUrl(id);
      var form = ms.slice(0, 4).map(function (m) { var h = m.home === id; return (h ? m.hs > m.as : m.as > m.hs) ? 'V' : 'D'; }).join('');
      return { n: t.name, g: g, p: p, gf: gf, gc: gc, f: form, lg: comp ? comp.name : '—', i: u ? 'url:' + u : null, live: S.matches.some(function (m) { return m.status === 'live' && (m.home === id || m.away === id); }) ? 1 : 0 };
    });
  };
})();
