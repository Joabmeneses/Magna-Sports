'use strict';
// Champions: si existe un torneo con formato Champions, se muestra su fase de liga real y su cuadro (play-off + eliminatoria).
// Si no hay ninguno, tabla única con todos los equipos calculada con los partidos terminados del panel.
(function () {
  var S = MAGNA.S, by = MAGNA.by, COL = ['#8b5cf6', '#2ee59d', '#ffd23f', '#ff5a36', '#ff4d5e', '#22d3ee', '#f472b6', '#a3e635', '#60a5fa'], LGC = {};
  var q = Number(new URLSearchParams(location.search).get('t')) || 0;
  var CHS = S.tournaments.filter(function (c) { return c.format === 'champions' && c.status !== 'draft'; });
  var T = (q && by(CHS, q)) || CHS.filter(function (c) { return c.state && c.status === 'active'; }).pop() || CHS.filter(function (c) { return c.state; }).pop() || null;
  if (T) LGC[T.name] = COL[0];
  else {
    S.leagues.forEach(function (l, i) { LGC[l.name] = COL[i % COL.length]; });
    S.tournaments.forEach(function (l, i) { LGC[l.name] = COL[(i + S.leagues.length) % COL.length]; });
  }
  window.MAGNA_CH_LGC = LGC;
  function row(id, ms, lg, all) {
    var t = by(S.teams, id) || { name: MAGNA.teamName(id) }, g = 0, p = 0, gf = 0, gc = 0;
    ms = ms.filter(function (m) { return m.home === id || m.away === id; }).sort(function (a, b) { return String(b.at).localeCompare(String(a.at)); });
    ms.forEach(function (m) { var h = m.home === id, f = h ? m.hs : m.as, c = h ? m.as : m.hs; gf += f; gc += c; f > c ? g++ : p++; });
    var form = ms.slice(0, 4).map(function (m) { var h = m.home === id; return (h ? m.hs > m.as : m.as > m.hs) ? 'V' : 'D'; }).join(''), u = MAGNA.crestUrl(id);
    return { id: id, n: t.name, g: g, p: p, gf: gf, gc: gc, f: form, lg: lg, i: u ? 'url:' + u : null, live: all.some(function (m) { return m.status === 'live' && (m.home === id || m.away === id); }) ? 1 : 0 };
  }
  window.MAGNA_CH_TEAMS = function () {
    if (T) {
      var mine = S.matches.filter(function (m) { return m.type === 'tournament' && m.cid === T.id; }), lgm = mine.filter(function (m) { return m.group && m.status === 'finished'; });
      var ids = T.groups ? T.groups[0].teamIds : T.teamIds;
      return ids.map(function (id) { return row(id, lgm, T.name, mine.filter(function (m) { return m.group; })); });
    }
    var played = S.matches.filter(function (m) { return m.status === 'finished'; }), seen = {};
    played.forEach(function (m) { seen[m.home] = 1; seen[m.away] = 1; });
    return Object.keys(seen).map(Number).map(function (id) {
      var comp = S.leagues.concat(S.tournaments).filter(function (c) { return c.teamIds.indexOf(id) >= 0; })[0];
      return row(id, played, comp ? comp.name : '—', S.matches);
    });
  };
  // Cuadro oficial: partidos del play-off y la eliminatoria del torneo (los de liga llevan m.group).
  window.MAGNA_CH_CFG = T ? { name: T.name, id: T.id, phase: T.state ? T.state.phase : null, champion: T.state && T.state.champion || null,
    ko: S.matches.filter(function (m) { return m.type === 'tournament' && m.cid === T.id && !m.group && m.status !== 'cancelled'; }) } : null;
})();
