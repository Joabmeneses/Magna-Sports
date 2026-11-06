'use strict';
// Base de datos de Magna Arena en el navegador (sin servidor).
// Los datos publicados viven en data.js (window.MAGNA_DATA). El panel guarda cambios en este navegador (localStorage)
// y permite descargar un data.js nuevo para publicarlo.
var MAGNA = (function () {
  var KEY = 'magna_arena_v1';
  var EMPTY = { v: 1, seq: 1, teams: [], players: [], leagues: [], tournaments: [], matches: [], news: [], contracts: [] };
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  var S;
  function load() {
    try { var raw = localStorage.getItem(KEY); if (raw) { S = JSON.parse(raw); return; } } catch (e) {}
    S = clone(window.MAGNA_DATA && window.MAGNA_DATA.v ? window.MAGNA_DATA : EMPTY);
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); return true; } catch (e) { return false; } }
  function hasLocal() { try { return !!localStorage.getItem(KEY); } catch (e) { return false; } }
  function discardLocal() { try { localStorage.removeItem(KEY); } catch (e) {} load(); }
  function id() { return S.seq++; }
  function now() { return new Date().toISOString().slice(0, 19).replace('T', ' '); }
  function by(list, i) { return list.filter(function (x) { return x.id === i; })[0]; }
  function addNews(kind, text) { S.news.unshift({ id: id(), at: now(), kind: kind, text: text }); S.news = S.news.slice(0, 100); }

  // ---------- cálculos ----------
  function teamName(i) { var t = by(S.teams, i); return t ? t.name : '—'; }
  function compOf(m) { return by(m.type === 'league' ? S.leagues : S.tournaments, m.cid); }
  function visible(c) { return c && c.status !== 'draft'; }
  function standings(c) {
    var sc = (c.config && c.config.win) ? c.config : { win: 3, loss: 0 }, r = {};
    c.teamIds.forEach(function (t) { r[t] = { team_id: t, team: teamName(t), pj: 0, g: 0, p: 0, gf: 0, gc: 0, pts: 0 }; });
    S.matches.forEach(function (m) {
      if (m.status !== 'finished' || m.cid !== c.id || m.type !== (c.kind || 'league')) return;
      var a = r[m.home], b = r[m.away]; if (!a || !b) return;
      a.pj++; b.pj++; a.gf += m.hs; a.gc += m.as; b.gf += m.as; b.gc += m.hs;
      var w = m.hs > m.as ? [a, b] : [b, a]; w[0].g++; w[1].p++; w[0].pts += sc.win; w[1].pts += sc.loss;
    });
    return Object.keys(r).map(function (k) { r[k].dg = r[k].gf - r[k].gc; return r[k]; }).sort(function (x, y) { return y.pts - x.pts || y.dg - x.dg || y.gf - x.gf || x.team.localeCompare(y.team, 'es'); }).map(function (x, i) { x.pos = i + 1; return x; });
  }
  function matchOut(m) {
    var c = compOf(m);
    return { id: m.id, competition_type: m.type, competition_id: m.cid, competition: c ? c.name : '—', round: m.round, home_team_id: m.home, away_team_id: m.away, home: teamName(m.home), away: teamName(m.away), starts_at: m.at, status: m.status, home_score: m.hs, away_score: m.as };
  }
  function compOut(c, kind) {
    var o = { id: c.id, name: c.name, description: c.description || '', status: c.status, has_logo: false, teams: c.teamIds.map(function (t) { return { id: t, name: teamName(t) }; }),
      config: { format: kind === 'leagues' ? 'round_robin' : c.format, best_of: c.best_of || 1, rules: c.rules || '', max_teams: 64 } };
    if (kind === 'leagues') { o.standings = standings(Object.assign({ kind: 'league' }, c)); }
    else { o.bracket = c.state ? { phase: c.state.phase, round: c.state.round, champion: c.state.champion ? { id: c.state.champion, name: teamName(c.state.champion) } : undefined } : null; }
    return o;
  }
  function squad(t) { return S.players.filter(function (p) { return p.teamId === t.id; }).sort(function (a, b) { return (a.slot === 'starter' ? 0 : 1) - (b.slot === 'starter' ? 0 : 1) || a.id - b.id; }).map(function (p) { return { id: p.id, name: p.name, slot: p.slot }; }); }
  function market() {
    var rows = S.players.map(function (p) {
      var t = by(S.teams, p.teamId), ct = S.contracts.filter(function (c) { return c.playerId === p.id && (!c.ends || c.ends >= now().slice(0, 10)); })[0];
      return { id: p.id, name: p.name, team: t ? t.name : null, slot: t ? p.slot : null, matches: 0, avg_rating: null, mvp: 0, salary_bits: ct ? ct.salary : null };
    });
    return rows;
  }
  var API = {
    '/api/public/teams': function () { return { teams: S.teams.map(function (t) { var c = by(S.players, t.coach); return { id: t.id, name: t.name, info: t.info || '', has_crest: !!t.crest, coach: c ? { id: c.id, name: c.name } : null, squad: squad(t) }; }) }; },
    '/api/public/leagues': function () { return { items: S.leagues.filter(visible).map(function (c) { return compOut(c, 'leagues'); }) }; },
    '/api/public/tournaments': function () { return { items: S.tournaments.filter(visible).map(function (c) { return compOut(c, 'tournaments'); }) }; },
    '/api/public/calendar': function () {
      var ok = S.matches.filter(function (m) { return visible(compOf(m)); });
      var up = ok.filter(function (m) { return m.status === 'scheduled' || m.status === 'live'; }).sort(function (a, b) { return (b.status === 'live') - (a.status === 'live') || String(a.at || '9').localeCompare(String(b.at || '9')); }).slice(0, 100).map(matchOut);
      var rc = ok.filter(function (m) { return m.status === 'finished' || m.status === 'cancelled'; }).sort(function (a, b) { return String(b.at || '').localeCompare(String(a.at || '')); }).slice(0, 50).map(matchOut);
      return { upcoming: up, recent: rc };
    },
    '/api/public/news': function () { return { news: S.news.slice(0, 30) }; },
    '/api/public/summary': function () { return { players: S.players.length, teams: S.teams.length, leagues: S.leagues.filter(function (x) { return x.status === 'active'; }).length, tournaments: S.tournaments.filter(function (x) { return x.status === 'active'; }).length }; },
    '/api/public/market': function () { return { players: market() }; },
    '/api/public/privacy': function () { return { contact: (window.MAGNA_CONFIG && window.MAGNA_CONFIG.privacyContact) || null }; }
  };
  var realFetch = window.fetch;
  window.fetch = function (u) {
    var p = String(u).split('?')[0];
    if (API[p]) { var out = API[p](); return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve(out); } }); }
    return realFetch.apply(this, arguments);
  };
  load();
  return {
    get S() { return S; }, load: load, save: save, hasLocal: hasLocal, discardLocal: discardLocal, id: id, now: now, by: by, addNews: addNews, teamName: teamName, standings: standings, clone: clone, EMPTY: EMPTY,
    crestUrl: function (tid) { var t = by(S.teams, tid); return t && t.crest ? t.crest : null; },
    replace: function (o) { S = o; save(); }
  };
})();
