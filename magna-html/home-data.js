'use strict';
// Convierte los datos del panel en los "partidos" que consume la portada original.
(function () {
  function fdt(s) { return s ? new Date(s.replace(' ', 'T') + 'Z').toLocaleString('es', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Sin fecha'; }
  function build() {
  var S = MAGNA.S, by = MAGNA.by, now = MAGNA.now();
  function comp(m) { return by(m.type === 'league' ? S.leagues : S.tournaments, m.cid); }
  function form(tid) {
    var f = S.matches.filter(function (m) { return m.status === 'finished' && (m.home === tid || m.away === tid); }).sort(function (a, b) { return String(b.at).localeCompare(String(a.at)); }).slice(0, 4);
    return f.map(function (m) { var h = m.home === tid; return (h ? m.hs > m.as : m.as > m.hs) ? 'V' : 'D'; }).join('');
  }
  function pos(m) {
    var c = comp(m); if (!c || m.type !== 'league') return ['–', '–'];
    var rows = MAGNA.standings(Object.assign({ kind: 'league' }, c)), p = function (t) { var r = rows.filter(function (x) { return x.team_id === t; })[0]; return r ? r.pos : '–'; };
    return [p(m.home), p(m.away)];
  }
  function crest(t) { var u = MAGNA.crestUrl(t); return u ? 'url:' + u : 'e'; }
  var live = S.matches.filter(function (m) { return m.status === 'live'; });
  var next = S.matches.filter(function (m) { return m.status === 'scheduled'; }).sort(function (a, b) { return String(a.at || '9').localeCompare(String(b.at || '9')); });
  var done = S.matches.filter(function (m) { return m.status === 'finished'; }).sort(function (a, b) { return String(b.at || '').localeCompare(String(a.at || '')); });
  var pick = live.concat(next, done).slice(0, 4);
  var out = pick.map(function (m) {
    var c = comp(m), isL = m.status === 'live', fin = m.status === 'finished', el = m.at ? Math.floor((Date.parse(now.replace(' ', 'T') + 'Z') - Date.parse(m.at.replace(' ', 'T') + 'Z')) / 1000) : 0;
    var p = pos(m);
    return { lg: c ? c.name : '', jn: m.round || '', v: '', live: isL || fin ? 1 : 0, fin: fin ? 1 : 0, real: 1, h: MAGNA.teamName(m.home), a: MAGNA.teamName(m.away), hi: crest(m.home), ai: crest(m.away),
      s: [m.hs || 0, m.as || 0], t: fin ? 5400 : isL ? Math.max(0, Math.min(el, 5399)) : 0, when: fdt(m.at), mode: 0, left: 0, ev: [], n: { h: 0, a: 0 }, cc: m.type === 'league' ? '#8b5cf6' : '#3b4bff', pos: p, form: [form(m.home), form(m.away)] };
  });
  return out;
  }
  var data = build(); window.__HOME_N = data.length; window.MAGNA_HOME = function () { return data; };
})();
