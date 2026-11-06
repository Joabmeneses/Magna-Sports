'use strict';
// Base de datos de Magna Arena.
// Los datos viven en Supabase (tabla site_state + team_crests). Todos pueden leer; solo los administradores escriben.
// Si la nube no responde, se usa la última copia guardada en el navegador o data.js.
var MAGNA = (function () {
  var KEY = 'magna_arena_v1', CACHE = 'magna_cloud_cache_v1';
  var CLOUD = { url: 'https://ryahntcvsqjhcurvyrdr.supabase.co', key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5YWhudGN2c3FqaGN1cnZ5cmRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM5OTEzNTQsImV4cCI6MjEwOTU2NzM1NH0.rLxcDd5y9rZHVDjYotMFPWOyE_-ZLIo6AKzVxtQigmM' };
  var EMPTY = { v: 1, seq: 1, teams: [], players: [], leagues: [], tournaments: [], matches: [], news: [], contracts: [] };
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  var S, source = 'local', writer = null, dirty = false, statusCbs = [], status = 'idle';
  function getSync(path) {
    var x = new XMLHttpRequest(); x.open('GET', CLOUD.url + '/rest/v1/' + path + (path.indexOf('?') < 0 ? '?' : '&') + 'apikey=' + encodeURIComponent(CLOUD.key), false); x.send(null);
    if (x.status !== 200) throw new Error('HTTP ' + x.status); return JSON.parse(x.responseText);
  }
  function withCrests(st, rows) { var m = {}; (rows || []).forEach(function (r) { m[r.team_id] = r.img; }); (st.teams || []).forEach(function (t) { t.crest = m[t.id] || null; }); return st; }
  function load() {
    try {
      var r = getSync('site_state?select=data&id=eq.1'), cr = getSync('team_crests?select=team_id,img');
      if (r[0] && r[0].data && r[0].data.v) { S = withCrests(r[0].data, cr); source = 'cloud'; try { localStorage.setItem(CACHE, JSON.stringify(S)); } catch (e) {} return; }
    } catch (e) {}
    try { var c = localStorage.getItem(CACHE); if (c) { S = JSON.parse(c); source = 'cache'; return; } } catch (e) {}
    S = clone(window.MAGNA_DATA && window.MAGNA_DATA.v ? window.MAGNA_DATA : EMPTY); source = 'file';
  }
  function setStatus(x, info) { status = x; statusCbs.forEach(function (f) { try { f(x, info); } catch (e) {} }); }
  var timer = null, busy = false;
  function flush() { if (!writer) return; if (busy) { timer = setTimeout(flush, 300); return; } busy = true; dirty = false; setStatus('saving');
    Promise.resolve(writer(clone(S))).then(function () { busy = false; if (!dirty) setStatus('saved'); try { localStorage.setItem(CACHE, JSON.stringify(S)); } catch (e) {} },
      function (err) { busy = false; dirty = true; setStatus('error', err && err.message); clearTimeout(timer); timer = setTimeout(flush, 4000); }); }
  function save() { if (!writer) return true; dirty = true; setStatus('pending'); clearTimeout(timer); timer = setTimeout(flush, 350); return true; }
  function hasLocal() { return dirty; }
  function discardLocal() { load(); }
  function legacyLocal() { try { var raw = localStorage.getItem(KEY); var o = raw && JSON.parse(raw); return o && o.v === 1 && Array.isArray(o.teams) ? o : null; } catch (e) { return null; } }
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
  // ---------- formato Mundial (grupos + eliminatoria) ----------
  function groupTable(c, g) {
    var r = {}; g.teamIds.forEach(function (t) { r[t] = { team_id: t, team: teamName(t), pj: 0, g: 0, p: 0, gf: 0, gc: 0, pts: 0 }; });
    S.matches.forEach(function (m) {
      if (m.type !== 'tournament' || m.cid !== c.id || m.group !== g.name || m.status !== 'finished') return;
      var a = r[m.home], b = r[m.away]; if (!a || !b) return;
      a.pj++; b.pj++; a.gf += m.hs; a.gc += m.as; b.gf += m.as; b.gc += m.hs;
      var w = m.hs > m.as ? [a, b] : [b, a]; w[0].g++; w[1].p++; w[0].pts += 3;
    });
    return Object.keys(r).map(function (k) { r[k].dg = r[k].gf - r[k].gc; return r[k]; }).sort(function (x, y) { return y.pts - x.pts || y.dg - x.dg || y.gf - x.gf || x.team.localeCompare(y.team, 'es'); }).map(function (x, i) { x.pos = i + 1; return x; });
  }
  // Orden de los clasificados para el primer cruce: en la lista, el puesto i juega contra el puesto n-1-i.
  // Con 2 por grupo se cruzan grupos (1.º A vs 2.º B, 1.º B vs 2.º A...). Los primeros reciben los pases directos si sobran equipos.
  function groupSeeds(c) {
    var G = c.groups || [], k = (c.gcfg && c.gcfg.q) || 2, tabs = G.map(function (g) { return groupTable(c, g); }), seed = function (gi, place) { var row = tabs[gi][place - 1]; return { t: row ? row.team_id : null, label: place + '.º ' + G[gi].name }; };
    var out = [];
    if (k === 2 && G.length >= 2) {
      var firsts = G.map(function (g, i) { return seed(i, 1); }), rival = G.map(function (g, i) { return G.length % 2 ? (i + 1) % G.length : (i % 2 ? i - 1 : i + 1); });
      out = firsts.concat(rival.map(function (j) { return seed(j, 2); }).reverse());
    } else { for (var p = 1; p <= k; p++) G.forEach(function (g, i) { out.push(seed(i, p)); }); }
    return out;
  }
  // ---------- partidos en vivo ----------
  var MODES = ['Balón Brawl', 'Atrapagemas', 'Atraco', 'Zona restringida', 'Noqueo', 'Caza estelar', 'Asedio', 'Supervivencia'];
  var PHASES = { pre: 'Por empezar', '1T': '1.er tiempo', HT: 'Entretiempo', '2T': '2.º tiempo', FT: 'Finalizado' };
  function liveMs(m) { var c = m.live && m.live.clock; if (!c) return 0; return (c.acc || 0) + (c.run && c.since ? Math.max(0, Date.now() - c.since) : 0); }
  function liveMinute(m) { return Math.floor(liveMs(m) / 60000) + 1; }
  function liveClock(m) { var t = Math.floor(liveMs(m) / 1000), p = function (n) { return String(n).padStart(2, '0'); }; return p(Math.floor(t / 60)) + ':' + p(t % 60); }
  function playerName(id) { var p = by(S.players, id); return p ? p.name : null; }
  function eventText(m, e) {
    var side = e.side === 'a' ? m.away : m.home, tn = teamName(side);
    switch (e.k) {
      case 'start': return 'Arranca el partido';
      case 'goal': return '¡Gol de ' + tn + '!' + (e.player ? ' Anota ' + (playerName(e.player) || 'jugador') : '') + (e.score ? ' (' + e.score + ')' : '');
      case 'mode': return 'Modo de juego: ' + e.mode;
      case 'sub': return 'Cambio en ' + tn + ': entra ' + (playerName(e.in) || '—') + ', sale ' + (playerName(e.out) || '—');
      case 'ht': return 'Entretiempo';
      case 'resume': return 'Comienza el 2.º tiempo';
      case 'end': return 'Final del partido' + (e.score ? ' · ' + e.score : '');
      default: return e.text || '';
    }
  }
  function compOut(c, kind) {
    var o = { id: c.id, name: c.name, description: c.description || '', status: c.status, has_logo: false, teams: c.teamIds.map(function (t) { return { id: t, name: teamName(t) }; }),
      config: { format: kind === 'leagues' ? 'round_robin' : c.format, best_of: c.best_of || 1, rules: c.rules || '', max_teams: 64 } };
    if (kind === 'leagues') { o.standings = standings(Object.assign({ kind: 'league' }, c)); }
    else { o.bracket = c.state ? { phase: c.state.phase, round: c.state.round, champion: c.state.champion ? { id: c.state.champion, name: teamName(c.state.champion) } : undefined, groups: c.groups ? c.groups.map(function (g) { return { name: g.name, table: groupTable(c, g) }; }) : undefined } : null; }
    return o;
  }
  function squad(t) { return S.players.filter(function (p) { return p.teamId === t.id; }).sort(function (a, b) { return (a.slot === 'starter' ? 0 : 1) - (b.slot === 'starter' ? 0 : 1) || a.id - b.id; }).map(function (p) { return { id: p.id, name: p.name, slot: p.slot }; }); }
  // ---------- estadísticas y media ----------
  // Niveles de mercado: un equipo solo puede fichar jugadores de su nivel o inferior.
  var TIERS = [['bronce', 'Bronce', 0, '#c08457'], ['plata', 'Plata', 40, '#c9cfdc'], ['oro', 'Oro', 60, '#ffd23f'], ['elite', 'Élite', 80, '#8b5cf6']];
  function tierOf(media) { var t = TIERS[0]; if (media == null) return { id: 'nuevo', name: 'Sin media', rank: 0, color: '#9aa0b8' }; TIERS.forEach(function (x, i) { if (media >= x[2]) t = x; }); return { id: t[0], name: t[1], rank: TIERS.indexOf(t), color: t[3] }; }
  function tierRank(id) { for (var i = 0; i < TIERS.length; i++) if (TIERS[i][0] === id) return i; return 1; }
  // ---------- nivel de los equipos (para saber si el rival era fuerte o débil) ----------
  // Cada equipo empieza en 1000 puntos de nivel. Ganar suma y perder resta, más o menos según el rival (sistema tipo Elo).
  function byTime(a, b) { return String(a.at || '').localeCompare(String(b.at || '')) || a.id - b.id; }
  // ---------- historial (torneos jugados antes del sitio) ----------
  // Sus marcadores cuentan para el nivel de los equipos; sus campeones suman títulos. No tienen alineaciones ni valoraciones.
  function hnk(x) { return String(x || '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase(); }
  function histTeam(name) { var t = S.teams.filter(function (x) { return hnk(x.name) === hnk(name); })[0]; return t ? t.id : 'x:' + hnk(name); }
  function histDate(d) { d = String(d || ''); return /^\d{4}$/.test(d) ? d + '-01-01' : /^\d{4}-\d{2}$/.test(d) ? d + '-01' : d || '0000-01-01'; }
  function histMatches() { var out = [], n = 0; (S.history || []).forEach(function (e) { var d = histDate(e.date); (e.matches || []).forEach(function (m, i) { n++; out.push({ id: -1e6 + n, hist: e.id, at: (m.d ? histDate(m.d) : d) + ' 00:' + String(Math.floor(i / 60)).padStart(2, '0') + ':' + String(i % 60).padStart(2, '0'), home: histTeam(m.home), away: histTeam(m.away), hs: m.hs, as: m.as }); }); }); return out; }
  function teamLevels() {
    var R = {}, K = 40, get = function (t) { return R[t] == null ? 1000 : R[t]; }, pre = {};
    var past = histMatches(), real = S.matches.filter(function (m) { return m.status === 'finished' && m.hs != null && m.as != null; });
    past.concat(real).sort(byTime).forEach(function (m) {
      var rh = get(m.home), ra = get(m.away), eh = 1 / (1 + Math.pow(10, (ra - rh) / 400)), sh = m.hs > m.as ? 1 : 0;
      pre[m.id] = { h: rh, a: ra, eh: eh }; R[m.home] = rh + K * (sh - eh); R[m.away] = ra + K * ((1 - sh) - (1 - eh)); });
    return { now: R, pre: pre, get: get };
  }
  // ---------- media de los jugadores ----------
  // Puntaje de cada partido (0-100) = 50 + resultado según el rival + valoración (+ un poco por MVP y goles).
  //  · Resultado: 40 × (resultado − probabilidad de ganar). Ganarle a un equipo fuerte suma mucho; perder con uno débil resta mucho.
  //  · Valoración: (nota − 6) × 6. Sin nota cuenta como 6 (no suma ni resta).
  // La media arranca en 10 y se acerca al puntaje promedio a medida que juega más partidos.
  function playerStats() {
    var TL = teamLevels(), st = {};
    S.players.forEach(function (p) { st[p.id] = { pj: 0, g: 0, w: 0, l: 0, mvp: 0, media: 10, nota: null, rated: 0, sum: 0, score: 0, topW: 0, upsetL: 0, opp: 0, games: [] }; });
    S.matches.filter(function (m) { return m.status === 'finished' && m.live; }).sort(byTime).forEach(function (m) {
      var L = m.live, win = m.hs > m.as ? 'h' : 'a', apps = { h: {}, a: {} }, pr = TL.pre[m.id] || { h: 1000, a: 1000, eh: .5 };
      ['h', 'a'].forEach(function (sd) { ((L.lineup && L.lineup[sd]) || []).forEach(function (id) { apps[sd][id] = 1; }); });
      (L.ev || []).forEach(function (e) { if (e.k === 'sub' && e.in) apps[e.side || 'h'][e.in] = 1; });
      var goals = {}; (L.ev || []).forEach(function (e) { if (e.k === 'goal' && e.player) goals[e.player] = (goals[e.player] || 0) + 1; });
      var R = L.ratings || {};
      ['h', 'a'].forEach(function (sd) {
        var exp = sd === 'h' ? pr.eh : 1 - pr.eh, won = sd === win, oppLv = sd === 'h' ? pr.a : pr.h;
        Object.keys(apps[sd]).forEach(function (id) { var x = st[id]; if (!x) return; x.pj++; x.opp += oppLv; x.games.push(m.id);
          if (won) { x.w++; if (exp < .45) x.topW++; } else { x.l++; if (exp > .55) x.upsetL++; }
          var r = R[id]; if (r != null) { x.rated++; x.sum += r; }
          var sc = 50 + 40 * ((won ? 1 : 0) - exp) + ((r != null ? r : 6) - 6) * 6 + (String(L.mvp) === String(id) ? 5 : 0) + Math.min(6, (goals[id] || 0) * 2);
          x.score += Math.max(0, Math.min(100, sc)); }); });
      Object.keys(goals).forEach(function (id) { if (st[id]) st[id].g += goals[id]; });
      if (L.mvp && st[L.mvp]) st[L.mvp].mvp++;
    });
    // Títulos: campeones de torneos (incluido el Mundial) y de ligas finalizadas. Cuenta para el jugador si jugó
    // con el equipo campeón en esa competición (partidos narrados); si no hay partidos narrados, la plantilla del campeón.
    var titles = [];
    S.tournaments.forEach(function (c) { if (c.state && c.state.phase === 'done' && c.state.champion) titles.push({ type: 'tournament', c: c, team: c.state.champion, w: c.format === 'groups_knockout' ? 15 : 10 }); });
    S.leagues.forEach(function (c) { if (c.status !== 'finished') return; var t = standings(Object.assign({ kind: 'league' }, c))[0]; if (t && t.pj) titles.push({ type: 'league', c: c, team: t.team_id, w: 10 }); });
    titles.forEach(function (T) { var who = {};
      S.matches.forEach(function (m) { if (m.type !== T.type || m.cid !== T.c.id || m.status !== 'finished' || !m.live) return; var sd = m.home === T.team ? 'h' : m.away === T.team ? 'a' : null; if (!sd) return;
        ((m.live.lineup && m.live.lineup[sd]) || []).forEach(function (id) { who[id] = 1; }); (m.live.ev || []).forEach(function (e) { if (e.k === 'sub' && e.side === sd && e.in) who[e.in] = 1; }); });
      if (!Object.keys(who).length) S.players.forEach(function (p) { if (p.teamId === T.team) who[p.id] = 1; });
      Object.keys(who).forEach(function (id) { var x = st[id]; if (!x) return; x.titles = x.titles || []; x.titles.push(T.c.name); x.floor = (x.floor || 15) + T.w; }); });
    (S.history || []).forEach(function (e) { (e.champIds || []).forEach(function (id) { var x = st[id], p = by(S.players, id); if (!x || !p) return; if ((p.prevTitles || []).some(function (n) { return hnk(n) === hnk(e.name); })) return; x.titles = x.titles || []; x.titles.push(e.name); x.floor = (x.floor || 15) + (e.mundial ? 15 : 10); }); });
    // Títulos anteriores (historial cargado por la administración): Mundial +15, otros +10, igual que los del sitio.
    S.players.forEach(function (p) { var x = st[p.id]; (p.prevTitles || []).forEach(function (n) { x.titles = x.titles || []; x.titles.push(n); x.floor = (x.floor || 15) + (/mundial|world/i.test(n) ? 15 : 10); }); });
    Object.keys(st).forEach(function (id) { var x = st[id]; if (x.rated) x.nota = Math.round(x.sum / x.rated * 10) / 10; x.titles = x.titles || []; x.floor = x.floor ? Math.min(60, x.floor) : 10; if (x.floor > x.media) x.media = x.floor; if (!x.pj) return;
      x.opp = Math.round(x.opp / x.pj); var avg = x.score / x.pj, wgt = x.pj / (x.pj + 3);
      x.media = Math.max(x.floor, Math.min(100, Math.round(10 + (avg - 10) * wgt))); });
    return st;
  }
  function market() {
    var PS = playerStats(), rows = S.players.map(function (p) {
      var t = by(S.teams, p.teamId), ct = S.contracts.filter(function (c) { return c.playerId === p.id && (!c.ends || c.ends >= now().slice(0, 10)); })[0];
      var x = PS[p.id] || {}, tr = tierOf(x.media);
      return { id: p.id, name: p.name, team: t ? t.name : null, team_id: t ? t.id : null, slot: t ? p.slot : null, matches: x.pj || 0, nota: x.nota == null ? null : x.nota, goals: x.g || 0, wins: x.w || 0, losses: x.l || 0, top_wins: x.topW || 0, titles: x.titles || [], floor: x.floor || 10, upset_losses: x.upsetL || 0, avg_rating: x.media == null ? null : x.media, mvp: x.mvp || 0, tier: tr, salary_bits: ct ? ct.salary : null };
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
    MODES: MODES, PHASES: PHASES, liveMinute: liveMinute, liveClock: liveClock, eventText: eventText, playerName: playerName,
    histMatches: histMatches, histTeam: histTeam, TIERS: TIERS, tierOf: tierOf, tierRank: tierRank, playerStats: playerStats, liveSecs: function (m) { return Math.floor(liveMs(m) / 1000); },
    teamLevels: teamLevels,
    groupTable: groupTable, groupSeeds: groupSeeds,
    TROPHY_CATS: [['liga', 'Liga'], ['torneo', 'Torneo'], ['champions', 'Champions'], ['otro', 'Otro']],
    crestUrl: function (tid) { var t = by(S.teams, tid); return t && t.crest ? t.crest : null; },
    replace: function (o) { S = o; save(); },
    legacyLocal: legacyLocal, clearLegacy: function () { try { localStorage.removeItem(KEY); } catch (e) {} },
    cloud: {
      url: CLOUD.url, key: CLOUD.key, get source() { return source; }, get status() { return status; }, get dirty() { return dirty; },
      setWriter: function (fn) { writer = fn; }, onStatus: function (f) { statusCbs.push(f); },
      flush: function () { clearTimeout(timer); flush(); },
      // estado nuevo llegado en tiempo real (sin escudos): conserva los escudos que ya tenemos
      applyRemote: function (data) { var cm = {}; S.teams.forEach(function (t) { cm[t.id] = t.crest; }); (data.teams || []).forEach(function (t) { t.crest = cm[t.id] || null; }); S = data; try { localStorage.setItem(CACHE, JSON.stringify(S)); } catch (e) {} },
      strip: function (st) { var o = clone(st); (o.teams || []).forEach(function (t) { delete t.crest; }); return o; }
    }
  };
})();
