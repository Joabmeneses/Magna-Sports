'use strict';
// Agenda de hoy y mañana a partir de los partidos del panel.
(function () {
  var S = MAGNA.S, by = MAGNA.by, PAL = [{ bg: '#cdbdff', fg: '#1b0f4d', ac: '#8b5cf6' }, { bg: '#b8f3d9', fg: '#05301f', ac: '#12b886' }, { bg: '#ffe9a8', fg: '#3a2a00', ac: '#e0a800' }, { bg: '#ffc9e2', fg: '#4a0a2a', ac: '#e0559c' }, { bg: '#bcd0ff', fg: '#0a1a4d', ac: '#3b4bff' }, { bg: '#ffd0bd', fg: '#4a1500', ac: '#ff5a36' }];
  var CP = {}, n = 0;
  function comp(m) { return by(m.type === 'league' ? S.leagues : S.tournaments, m.cid); }
  function ms(m) { return Date.parse(m.at.replace(' ', 'T') + 'Z'); }
  function dayOff(t) { var a = new Date(); a.setHours(0, 0, 0, 0); var b = new Date(t); b.setHours(0, 0, 0, 0); return Math.round((b - a) / 864e5); }
  function form(id) { return S.matches.filter(function (m) { return m.status === 'finished' && (m.home === id || m.away === id); }).sort(function (a, b) { return String(b.at).localeCompare(String(a.at)); }).slice(0, 4).map(function (m) { return (m.home === id ? m.hs > m.as : m.as > m.hs) ? 'V' : 'D'; }).join(''); }
  function pos(id, c) { if (!c || c.kind === 'tournament' || !c.config) return '–'; var rows = MAGNA.standings(Object.assign({ kind: 'league' }, c)), r = rows.filter(function (x) { return x.team_id === id; })[0]; return r ? r.pos : '–'; }
  var FX = [], INFO = {};
  S.matches.filter(function (m) { return m.at && m.status !== 'cancelled' && dayOff(ms(m)) >= 0 && dayOff(ms(m)) <= 1; }).sort(function (a, b) { return ms(a) - ms(b); }).forEach(function (m) {
    var c = comp(m), cn = c ? c.name : '—'; if (!CP[cn]) CP[cn] = PAL[n++ % PAL.length];
    [m.home, m.away].forEach(function (id) { var nm = MAGNA.teamName(id), u = MAGNA.crestUrl(id), lg = S.leagues.filter(function (l) { return l.teamIds.indexOf(id) >= 0; })[0] || S.tournaments.filter(function (l) { return l.teamIds.indexOf(id) >= 0; })[0];
      INFO[nm] = { i: u ? 'url:' + u : null, lg: lg ? lg.name : '—', lp: lg && lg.config ? pos(id, lg) : '–', lf: form(id), cp: '–', cf: form(id) }; });
    FX.push({ id: m.id, d: dayOff(ms(m)), c: cn, h: MAGNA.teamName(m.home), a: MAGNA.teamName(m.away), jn: m.round || '', st: m.status, hs: m.hs || 0, as: m.as || 0, start: ms(m), goals: [], real: 1 });
  });
  window.MAGNA_AG = { CP: CP, INFO: INFO, FX: FX };
})();
