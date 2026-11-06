'use strict';
window.MAGNA_LIGAS = function () {
  var S = MAGNA.S, COL = ['#8b5cf6', '#2ee59d', '#ffd23f', '#f472b6', '#3b4bff', '#ff5a36'];
  return S.leagues.filter(function (l) { return l.status !== 'draft'; }).map(function (l, k) {
    var ms = S.matches.filter(function (m) { return m.type === 'league' && m.cid === l.id && m.status === 'finished'; });
    var T = l.teamIds.map(function (id) {
      var mine = ms.filter(function (m) { return m.home === id || m.away === id; }).sort(function (a, b) { return String(b.at).localeCompare(String(a.at)); }), g = 0, p = 0, gf = 0, gc = 0;
      mine.forEach(function (m) { var h = m.home === id, f = h ? m.hs : m.as, c = h ? m.as : m.hs; gf += f; gc += c; f > c ? g++ : p++; });
      var u = MAGNA.crestUrl(id);
      return { n: MAGNA.teamName(id), i: u ? 'url:' + u : null, g: g, p: p, gf: gf, gc: gc, f: mine.slice(0, 4).map(function (m) { var h = m.home === id; return (h ? m.hs > m.as : m.as > m.hs) ? 'V' : 'D'; }).join(''),
        live: S.matches.some(function (m) { return m.status === 'live' && m.type === 'league' && m.cid === l.id && (m.home === id || m.away === id); }) ? 1 : 0 };
    });
    return { n: l.name, jn: '', c: COL[k % COL.length], z: Math.min(2, Math.max(1, T.length - 1)), T: T };
  }).filter(function (l) { return l.T.length; });
};
