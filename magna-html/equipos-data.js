'use strict';
// Directorio de equipos: tablas por liga y general calculadas con los partidos terminados del panel.
(function () {
  var S = MAGNA.S, by = MAGNA.by, PAL = ['#8b5cf6', '#2ee59d', '#ffd23f', '#f472b6', '#3b4bff', '#ff5a36', '#22d3ee', '#a3e635'], TC = ['#ff9d00', '#8b5cf6', '#4ade80', '#f472b6', '#a3e635', '#22d3ee', '#c9c7a6', '#2ee59d', '#fb7185', '#60a5fa'];
  var done = S.matches.filter(function (m) { return m.status === 'finished'; });
  function rec(id, ms, win) {
    var mine = ms.filter(function (m) { return m.home === id || m.away === id; }).sort(function (a, b) { return String(b.at).localeCompare(String(a.at)); }), g = 0, p = 0, gf = 0, gc = 0;
    mine.forEach(function (m) { var h = m.home === id, f = h ? m.hs : m.as, c = h ? m.as : m.hs; gf += f; gc += c; f > c ? g++ : p++; });
    return { pj: g + p, g: g, p: p, gf: gf, gc: gc, dg: gf - gc, pts: g * win, f: mine.slice(0, 4).map(function (m) { return (m.home === id ? m.hs > m.as : m.as > m.hs) ? 'V' : 'D'; }).join('') };
  }
  function ranks(ids, ms, win) { var r = ids.map(function (id) { return { id: id, r: rec(id, ms, win) }; }).sort(function (a, b) { return b.r.pts - a.r.pts || b.r.dg - a.r.dg || b.r.gf - a.r.gf; }); var o = {}; r.forEach(function (x, i) { o[x.id] = i + 1; }); return o; }
  var comps = S.leagues.concat(S.tournaments), LGC = {}, lgIdx = {};
  comps.forEach(function (c, i) { LGC[c.name] = PAL[i % PAL.length]; });
  var all = S.teams.map(function (t) { return t.id; }), gRank = ranks(all, done, 3), COL = {}, SQ = {};
  var TEAMS = S.teams.map(function (t, i) {
    var lg = S.leagues.filter(function (l) { return l.teamIds.indexOf(t.id) >= 0; })[0] || S.tournaments.filter(function (l) { return l.teamIds.indexOf(t.id) >= 0; })[0];
    var win = lg && lg.config ? lg.config.win : 3, cms = lg ? done.filter(function (m) { return m.cid === lg.id && m.type === (lg.config ? 'league' : 'tournament'); }) : [];
    var lr = ranks(lg ? lg.teamIds : [t.id], cms, win), u = MAGNA.crestUrl(t.id), c = by(S.players, t.coach), name = lg ? lg.name : 'Sin competición';
    if (!lg) LGC[name] = '#9aa0b8';
    COL[t.name] = TC[i % TC.length];
    SQ[t.name] = S.players.filter(function (p) { return p.teamId === t.id; }).sort(function (a, b) { return (a.slot === 'starter' ? 0 : 1) - (b.slot === 'starter' ? 0 : 1); }).map(function (p) { return { n: p.name, slot: p.slot, coach: t.coach === p.id }; });
    return { n: t.name, i: u ? 'url:' + u : null, lg: name, lp: lr[t.id], lr: rec(t.id, cms, win), ln: lg ? lg.teamIds.length : 1, cp: gRank[t.id], cr: rec(t.id, done, 3), coach: c ? c.name : null, tr: (t.trophies || []).map(function (x) { return { n: x.name, c: x.cat, y: x.season || '' }; }) };
  });
  var FX = [], order = 0, now = Date.now();
  function lbl(ms) { var d = new Date(ms), a = new Date(); a.setHours(0, 0, 0, 0); var b = new Date(ms); b.setHours(0, 0, 0, 0); var off = Math.round((b - a) / 864e5), p = function (n) { return String(n).padStart(2, '0'); }; return (off === 0 ? 'Hoy ' : off === 1 ? 'Mañana ' : d.toLocaleDateString('es', { day: 'numeric', month: 'short' }) + ' ') + p(d.getHours()) + ':' + p(d.getMinutes()); }
  S.matches.filter(function (m) { return m.status === 'live' || (m.status === 'scheduled' && m.at); }).sort(function (a, b) { return String(a.at || '').localeCompare(String(b.at || '')); }).forEach(function (m) {
    var c = by(m.type === 'league' ? S.leagues : S.tournaments, m.cid), f = { c: c ? c.name : '—', h: MAGNA.teamName(m.home), a: MAGNA.teamName(m.away) };
    if (m.status === 'live') f.live = 1; else { f.t = lbl(Date.parse(m.at.replace(' ', 'T') + 'Z')); f.o = ++order; } FX.push(f);
  });
  window.MAGNA_EQ = { TCATS: MAGNA.TROPHY_CATS, TEAMS: TEAMS, LGC: LGC, SQ: SQ, COL: COL, FX: FX, NLG: S.leagues.length + S.tournaments.length };
})();
