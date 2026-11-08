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
  var FRIENDLY = { id: 0, name: 'Amistoso', status: 'active', friendly: true, teamIds: [] };
  function compOf(m) { if (m.type === 'friendly') return FRIENDLY; return by(m.type === 'league' ? S.leagues : S.tournaments, m.cid); }
  // ---------- mercado de fichajes (lo abre y cierra la administración) ----------
  function marketState() { var mk = S.market || {}, closes = mk.closes ? Date.parse(mk.closes.replace(' ', 'T') + 'Z') : null, open = !!mk.open && !(closes && Date.now() >= closes); return { open: open, since: mk.since || null, closes: mk.closes || null, expired: !!mk.open && !open }; }
  // ---------- roles de las personas: jugador, coach y jugador, solo coach ----------
  var ROLES = [['player', 'Jugador'], ['both', 'Coach y jugador'], ['coach', 'Solo coach']];
  function roleOf(p) { if (!p) return 'player'; if (p.kind) return p.kind; return S.teams.some(function (t) { return t.coach === p.id; }) ? 'both' : 'player'; } // un DT sin rol guardado cuenta como Coach y jugador
  function roleName(p) { var k = roleOf(p); return (ROLES.filter(function (r) { return r[0] === k; })[0] || ROLES[0])[1]; }
  function plays(p) { return roleOf(p) !== 'coach'; }
  function canCoach(p) { return roleOf(p) !== 'player'; }
  // ---------- trofeos de cada equipo (títulos = trofeos) ----------
  // Se suman solos: campeón de un torneo, primero de una liga finalizada y campeón del historial. Más los que la administración agregue a mano.
  function compYear(type, cid) { var ds = S.matches.filter(function (m) { return m.type === type && m.cid === cid && m.at; }).map(function (m) { return m.at; }).sort(); return ds.length ? ds[ds.length - 1].slice(0, 4) : null; }
  function trnKind(c) { if (c.format === 'champions' || /champions/i.test(c.name)) return 'champions'; if (c.format === 'groups_knockout' || /mundial/i.test(c.name)) return 'mundial'; return 'torneo'; }
  // Ediciones: torneos con el mismo nombre son ediciones del mismo torneo, numeradas en romano ("OmegaCup VI").
  // También se entiende el formato anterior "Champions · 2.ª edición".
  var ED_RX = /\s*·\s*(\d+)\.ª edición$|\s+([IVXLC]+)$/;
  function baseName(n) { return String(n || '').replace(ED_RX, '').trim(); }
  function editionNo(n) { var m = ED_RX.exec(String(n || '')); return !m ? null : m[1] ? Number(m[1]) : romanNo(m[2]); }
  function toRoman(n) { var R = [[100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']], o = ''; n = Math.max(1, Math.floor(n)); R.forEach(function (x) { while (n >= x[0]) { o += x[1]; n -= x[0]; } }); return o; }
  // temporada/edición escrita como número romano (IV) o número (4) → 4
  function romanNo(x) { x = String(x || '').trim().toUpperCase(); if (/^\d{1,3}$/.test(x)) return Number(x); if (!/^[IVXLC]+$/.test(x)) return null; var V = { I: 1, V: 5, X: 10, L: 50, C: 100 }, n = 0; for (var i = 0; i < x.length; i++) { var a = V[x[i]], b = V[x[i + 1]] || 0; n += a < b ? -a : a; } return n || null; }
  // Balón de Oro: S.ballon = [{id, ed:'IV', season, winner(id)|wname, team(id)|tname, second, third, votes, source}]
  function ballonList() { return (S.ballon || []).slice().sort(function (a, b) { return (romanNo(b.ed) || 0) - (romanNo(a.ed) || 0) || b.id - a.id; }); }
  function ballonWho(b, k) { var id = b[k], p = id != null ? by(S.players, id) : null; return p ? p.name : (b[k + 'Name'] || (k === 'winner' ? b.wname : '') || null); }
  function ballonCount(pid) { return (S.ballon || []).filter(function (b) { return b.winner === pid; }).length; }
  // Catálogo inicial de la tienda de cosméticos (la administración lo carga y luego lo edita en S.shop)
  var SHOP_DEFAULT = [
    ['c-sangre', 'color', 'Carmesí', 'comun', 200, 'sangre'], ['c-menta', 'color', 'Menta', 'comun', 200, 'menta'], ['c-oro', 'color', 'Nombre dorado', 'rara', 400, 'oro'], ['c-hielo', 'color', 'Hielo', 'rara', 450, 'hielo'],
    ['c-neon-rosa', 'color', 'Neón rosa', 'epica', 900, 'neon-rosa'], ['c-neon-cian', 'color', 'Neón cian', 'epica', 900, 'neon-cian'], ['c-neon-verde', 'color', 'Neón verde', 'epica', 900, 'neon-verde'],
    ['c-galaxia', 'color', 'Galaxia', 'legendaria', 1800, 'galaxia'], ['c-fuego', 'color', 'Fuego vivo', 'legendaria', 2000, 'fuego'], ['c-arcoiris', 'color', 'Arcoíris', 'legendaria', 2500, 'arcoiris'],
    ['p-noche', 'plate', 'Placa Medianoche', 'comun', 200, 'noche'], ['p-plata', 'plate', 'Placa de plata', 'comun', 250, 'plata'], ['p-selva', 'plate', 'Placa Selva', 'comun', 250, 'selva'], ['p-magna', 'plate', 'Placa Magna', 'rara', 500, 'magna'],
    ['p-fuego', 'plate', 'Placa de fuego', 'epica', 1000, 'fuego'], ['p-neon', 'plate', 'Placa neón', 'epica', 1100, 'neon'], ['p-oro', 'plate', 'Placa de oro', 'epica', 1200, 'oro'], ['p-galaxia', 'plate', 'Placa Galaxia', 'legendaria', 2000, 'galaxia'],
    ['f-oro', 'frame', 'Marco dorado', 'rara', 600, 'oro'], ['f-hielo', 'frame', 'Marco de hielo', 'rara', 600, 'hielo'], ['f-toxico', 'frame', 'Marco tóxico', 'rara', 700, 'toxico'], ['f-neon', 'frame', 'Marco neón', 'epica', 1200, 'neon'],
    ['f-elite', 'frame', 'Marco Élite', 'epica', 1500, 'elite'], ['f-fuego', 'frame', 'Marco de fuego', 'legendaria', 2200, 'fuego'], ['f-arcoiris', 'frame', 'Marco arcoíris', 'legendaria', 2400, 'arcoiris'], ['f-corona', 'frame', 'Corona real', 'legendaria', 3000, 'corona'],
    ['t-novato', 'title', 'Novato', 'comun', 100, ''], ['t-muro', 'title', 'El Muro', 'comun', 150, ''], ['t-goleador', 'title', 'Goleador', 'rara', 300, ''], ['t-mago', 'title', 'El Mago', 'rara', 300, ''], ['t-capitan', 'title', 'Capitán', 'rara', 350, ''],
    ['t-imparable', 'title', 'Imparable', 'epica', 700, ''], ['t-rey', 'title', 'Rey de la cancha', 'epica', 800, ''], ['t-leyenda', 'title', 'Leyenda viva', 'legendaria', 1500, '']
  ].map(function (x) { return { id: x[0], type: x[1], name: x[2], rarity: x[3], price: x[4], style: x[5], active: true }; });
  // Cosméticos exclusivos: no se compran; se entregan solos al desbloquear la insignia indicada en "award" (o los da la administración si es "manual")
  var SHOP_EXCL = [
    ['x-balon-marco', 'frame', 'Marco Balón de Oro', 'legendaria', 'balon', 'balon'], ['x-balon-titulo', 'title', 'Balón de Oro', 'legendaria', '', 'balon'],
    ['x-campeon', 'plate', 'Placa de Campeón', 'epica', 'campeon', 'campeon'], ['x-dinastia', 'plate', 'Placa Dinastía', 'legendaria', 'dinastia', 'dinastia'],
    ['x-estrella', 'color', 'Estrella fugaz', 'legendaria', 'estrella', 'estrella'], ['x-leyenda', 'frame', 'Marco Leyenda', 'legendaria', 'leyenda', 'leyenda'],
    ['x-hattrick', 'title', 'Rey del hat-trick', 'epica', '', 'hattrick'], ['x-perfecto', 'title', 'Partido perfecto', 'rara', '', 'perfecto'],
    ['x-fundador', 'frame', 'Fundador de Magna', 'legendaria', 'fundador', 'manual']
  ].map(function (x) { return { id: x[0], type: x[1], name: x[2], rarity: x[3], price: 0, style: x[4], active: true, exclusive: true, award: x[5] }; });
  var AWARD_TXT = { balon: 'Gana el Balón de Oro', campeon: 'Gana un título', dinastia: 'Gana 5 títulos', estrella: 'Sé MVP 10 veces', leyenda: 'Juega 75 partidos', hattrick: 'Marca 3 goles en un partido', perfecto: 'Saca un 10 de nota en un partido', manual: 'Lo entrega la administración', ganador: 'Gana 20 partidos', goleador: 'Marca 10 goles', canonero: 'Marca 50 goles', veterano: 'Juega 25 partidos', mvp: 'Sé MVP de un partido', elite: 'Llega a media 80' };
  // Arte oficial de los trofeos (carpeta trofeos/), en el orden de importancia de Magna
  var TROPHY_ART = [['omegacup', /omega/i, 'OmegaCup'], ['mundial', /mundial|world/i, 'Mundial'], ['champions', /champions/i, 'Champions'], ['liga', /\bliga\b|divisi[oó]n|league/i, 'Liga'],
    ['supernova', /supernova/i, 'Supernova'], ['centerium', /centerium/i, 'Centerium'], ['magnacup', /magna\s*cup|copa\s+magna|^\s*magna\b/i, 'MagnaCup'], ['copa-del-rey', /copa\s+del\s+rey|\brey\b/i, 'Copa del Rey'],
    ['copa-de-oro', /copa\s+de\s+oro|gold\s*cup/i, 'Copa de Oro'], ['balon-de-oro', /bal[oó]n\s+de\s+oro|ballon/i, 'Balón de Oro']];
  var ART_CAT = { liga: 'liga', champions: 'champions', mundial: 'mundial' };
  function trophyArt(name, cat) { var n = String(name || ''), k = null;
    if (/bal[oó]n\s+de\s+oro/i.test(n)) k = 'balon-de-oro'; else for (var i = 0; i < TROPHY_ART.length && !k; i++) if (TROPHY_ART[i][1].test(n)) k = TROPHY_ART[i][0];
    if (!k && cat && ART_CAT[cat]) k = ART_CAT[cat]; if (!k) return null;
    var o = 0; TROPHY_ART.forEach(function (x, j) { if (x[0] === k) o = j; }); return { key: k, src: 'trofeos/' + k + '.webp', label: TROPHY_ART[o][2], ord: o }; }
  function trophyOrd(name, cat) { var a = trophyArt(name, cat); return a ? a.ord : 99; }
  // Partidos narrados de un jugador con su nota, goles, MVP y resultado (para su perfil)
  function playerGames(pid) { var out = []; S.matches.filter(function (m) { return m.status === 'finished' && m.live; }).concat(histPlayed()).sort(byTime).forEach(function (m) { var L = m.live, sd = null;
      ['h', 'a'].forEach(function (k) { if (((L.lineup && L.lineup[k]) || []).indexOf(pid) >= 0) sd = k; }); (L.ev || []).forEach(function (e) { if (e.k === 'sub' && e.in === pid) sd = e.side || 'h'; }); if (!sd) return;
      var g = (L.ev || []).filter(function (e) { return e.k === 'goal' && e.player === pid; }).length, my = sd === 'h' ? m.hs : m.as, op = sd === 'h' ? m.as : m.hs;
      out.push({ m: m, side: sd, team: sd === 'h' ? m.home : m.away, rival: sd === 'h' ? m.away : m.home, g: g, r: (L.ratings || {})[pid], mvp: String(L.mvp) === String(pid), res: my > op ? 'W' : my < op ? 'L' : 'D', score: my + '-' + op }); });
    return out.reverse(); }
  // Insignias que se ganan jugando. Cada una: {id, i (icono), n (nombre), d (cómo), v (valor), goal (meta), ok}
  function playerBadges(pid) { var x = playerStats()[pid] || {}, G = playerGames(pid), bo = ballonCount(pid), tt = (x.titles || []).length, hat = G.some(function (g) { return g.g >= 3; }), best = G.reduce(function (a, g) { return g.r != null && g.r > a ? g.r : a; }, 0);
    var D = [['debut', '👟', 'Debut', 'Juega tu primer partido', x.pj, 1], ['veterano', '🎖️', 'Veterano', 'Juega 25 partidos', x.pj, 25], ['leyenda', '🏛️', 'Leyenda', 'Juega 75 partidos', x.pj, 75],
      ['gol', '⚽', 'Primer gol', 'Marca tu primer gol', x.g, 1], ['goleador', '🎯', 'Goleador', 'Marca 10 goles', x.g, 10], ['canonero', '💥', 'Cañonero', 'Marca 50 goles', x.g, 50], ['hattrick', '🎩', 'Hat-trick', 'Marca 3 goles en un partido', hat ? 1 : 0, 1],
      ['ganador', '✊', 'Ganador', 'Gana 20 partidos', x.w, 20], ['mvp', '⭐', 'MVP', 'Sé el MVP de un partido', x.mvp, 1], ['estrella', '🌟', 'Estrella', 'Sé MVP 10 veces', x.mvp, 10], ['perfecto', '💯', 'Partido perfecto', 'Saca un 10 de nota', best >= 10 ? 1 : 0, 1],
      ['campeon', '🏆', 'Campeón', 'Gana un título', tt, 1], ['dinastia', '👑', 'Dinastía', 'Gana 5 títulos', tt, 5], ['balon', '🥇', 'Balón de Oro', 'Gana el Balón de Oro', bo, 1], ['elite', '💎', 'Élite', 'Llega a media 80', x.media, 80]];
    return D.map(function (b) { var v = Number(b[4]) || 0; return { id: b[0], i: b[1], n: b[2], d: b[3], v: Math.min(v, b[5]), goal: b[5], ok: v >= b[5] }; }); }
  function editionName(base, n) { return base + ' ' + toRoman(n); }
  // Agrupa trofeos del mismo torneo (todas sus ediciones) en uno con contador
  function groupTrophies(list) { var g = [], ix = {}; (list || []).forEach(function (x) { var k = hnk(baseName(x.name)); if (ix[k] == null) { ix[k] = g.length; g.push({ name: baseName(x.name), cat: x.cat, n: 0, items: [] }); } var o = g[ix[k]]; o.n++; o.items.push(x); }); return g; }
  function teamTrophies(tid) {
    var t = by(S.teams, tid); if (!t) return []; var out = [], seen = {}, key = function (n, y) { return hnk(n) + '|' + (y || ''); };
    function push(x) { var k = key(x.name, x.season); if (seen[k] || seen[key(x.name, '')]) return; seen[k] = 1; out.push(x); }
    function pushH(x) { var k = 'h' + x.hist; if (seen[k]) return; seen[k] = 1; seen[key(x.name, x.season)] = 1; out.push(x); }
    S.tournaments.forEach(function (c) { if (c.state && c.state.phase === 'done' && c.state.champion === tid) push({ name: c.name, cat: trnKind(c), season: compYear('tournament', c.id), auto: 'tournament' }); });
    S.leagues.forEach(function (c) { if (c.status !== 'finished') return; var r = standings(Object.assign({ kind: 'league' }, c))[0]; if (r && r.pj && r.team_id === tid) push({ name: c.name, cat: 'liga', season: compYear('league', c.id), auto: 'league' }); });
    (S.history || []).forEach(function (e) { if (!e.champion || histTeam(e.champion) !== tid) return; pushH({ name: e.name, cat: e.mundial ? 'mundial' : e.cat === 'liga' ? 'liga' : e.cat === 'champions' ? 'champions' : e.cat === 'otro' ? 'otro' : 'torneo', season: e.date ? String(e.date).slice(0, 4) : null, auto: 'history', hist: e.id }); });
    (t.trophies || []).forEach(function (x) { if (x.hist && out.some(function (o) { return o.hist === x.hist; })) return; push({ id: x.id, name: x.name, cat: x.cat || 'otro', season: x.season || null }); });
    var ORD = { mundial: 0, champions: 1, liga: 2, torneo: 3, otro: 4 };
    var yr = function (x) { return (String(x.season || '').match(/\d{4}/) || [''])[0]; };
    return out.sort(function (a, b) { return yr(b).localeCompare(yr(a)) || ORD[a.cat] - ORD[b.cat]; });
  }
  var TCOL = ['#ff9d00', '#8b5cf6', '#4ade80', '#f472b6', '#a3e635', '#22d3ee', '#c9c7a6', '#2ee59d', '#fb7185', '#60a5fa'];
  function teamColor(tid) { var i = S.teams.map(function (t) { return t.id; }).indexOf(tid); return TCOL[(i < 0 ? 0 : i) % TCOL.length]; }
  // ---------- previa de un partido: lo que pesa en las cuotas de las apuestas ----------
  // Nivel (resultados contra rivales fuertes o débiles), forma reciente (últimos 5), cara a cara (incluye el historial) y puntos de ranking.
  function matchPreview(m) {
    var H = m.home, A = m.away, TL = teamLevels(), PT = teamPoints();
    var played = histMatches().concat(S.matches.filter(function (x) { return x.status === 'finished' && x.hs != null && x.as != null && x.hs !== x.as && x.id !== m.id; })).sort(byTime).reverse();
    function won(x, t) { return x.home === t ? x.hs > x.as : x.as > x.hs; }
    function form(t) { var l = played.filter(function (x) { return x.home === t || x.away === t; }).slice(0, 5); return { s: l.map(function (x) { return won(x, t) ? 'V' : 'D'; }).join(''), w: l.length ? l.filter(function (x) { return won(x, t); }).length / l.length : 0.5, n: l.length }; }
    var fh = form(H), fa = form(A), meet = played.filter(function (x) { return (x.home === H && x.away === A) || (x.home === A && x.away === H); }), wh = meet.filter(function (x) { return won(x, H); }).length, wa = meet.length - wh;
    var eh = TL.get(H), ea = TL.get(A), ph = (PT[H] || {}).pts || 0, pa = (PT[A] || {}).pts || 0;
    var rk = S.teams.map(function (t) { return { id: t.id, p: (PT[t.id] || {}).pts || 0, l: TL.get(t.id) }; }).sort(function (a, b) { return b.p - a.p || b.l - a.l; }).map(function (x) { return x.id; });
    var parts = { casa: 0.15, nivel: (eh - ea) * 0.004, forma: (fh.w - fa.w) * 0.9, h2h: meet.length ? (wh - wa) / (meet.length + 2) * 1.2 : 0, ranking: (ph - pa) / Math.max(ph + pa, 50000) * 0.8 };
    var L = Math.max(-2.4, Math.min(2.4, parts.casa + parts.nivel + parts.forma + parts.h2h + parts.ranking));
    return { sd: Math.round(L / 2 * 1000) / 1000, p: 1 / (1 + Math.exp(-L)), parts: parts,
      h2h: { n: meet.length, h: wh, a: wa, last: meet.slice(0, 5).map(function (x) { return { at: x.at, h: x.home === H ? x.hs : x.as, a: x.home === H ? x.as : x.hs, hist: !!x.hist }; }) },
      form: { h: fh, a: fa }, level: { h: Math.round(eh), a: Math.round(ea) }, points: { h: ph, a: pa }, pos: { h: rk.indexOf(H) + 1, a: rk.indexOf(A) + 1, of: rk.length } };
  }
  // ---------- puntos del ranking de equipos ----------
  // Liga 15.000 · Champions 35.000 · Mundial 50.000 · otro torneo 25.000 (por victoria) · amistoso 5.000 (gane o pierda).
  var PTS = { league: 15000, champions: 35000, mundial: 50000, tournament: 25000, friendly: 5000 };
  function compKind(m) { if (m.type === 'friendly') return 'friendly'; if (m.type === 'league') return 'league'; var c = by(S.tournaments, m.cid); if (!c) return 'tournament';
    if (c.format === 'champions' || /champions/i.test(c.name)) return 'champions'; if (c.format === 'groups_knockout' || /mundial/i.test(c.name)) return 'mundial'; return 'tournament'; }
  function histKind(e) { if (e.mundial || /mundial/i.test(e.name)) return 'mundial'; if (e.cat === 'champions' || /champions/i.test(e.name)) return 'champions'; if (e.cat === 'liga') return 'league'; return 'tournament'; }
  function teamPoints() {
    var P = {}; S.teams.forEach(function (t) { var b = Math.max(0, Math.round(Number(t.basePts) || 0)); P[t.id] = { pts: b, base: b, league: 0, champions: 0, mundial: 0, tournament: 0, friendly: 0 }; });
    function add(tid, k) { var x = P[tid]; if (!x) return; x.pts += PTS[k]; x[k] += PTS[k]; }
    S.matches.forEach(function (m) { if (m.status !== 'finished' || m.hs == null || m.as == null || m.hs === m.as) return; var k = compKind(m);
      if (k === 'friendly') { add(m.home, k); add(m.away, k); } else add(m.hs > m.as ? m.home : m.away, k); });
    (S.history || []).forEach(function (e) { var k = histKind(e); (e.matches || []).forEach(function (m) { if (m.hs === m.as) return; var w = histTeam(m.hs > m.as ? m.home : m.away); if (typeof w === 'number') add(w, k); }); });
    return P;
  }
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
  // Formato Champions: liga ida y vuelta → los D primeros directo, los K siguientes al play-off (D = K/2), el resto fuera.
  // K es la mayor potencia de 2 que no supera la mitad de los equipos (36 → 8 directo + 16 play-off, como la Champions real).
  function champSplit(n) { if (n < 3) return null; var k = 2; while (k * 2 <= n / 2) k *= 2; return { direct: k / 2, playoff: k, out: n - k / 2 - k }; }
  function koName(n) { return n === 2 ? 'Final' : n === 4 ? 'Semifinales' : n === 8 ? 'Cuartos de final' : n === 16 ? 'Octavos de final' : 'Ronda de ' + n; }
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
  // Modos competitivos y sus mapas (los elige el administrador para cada set)
  var MAPS = {
    'Balón Brawl': ['Estadio Brawl', 'Triple Drible', 'Cancha Peleona', 'Campos Fugitivos', 'Superplaya', 'Pinball', 'Palco Central', 'Pelota de Playa', 'Fútbol Soleado'],
    'Atrapagemas': ['Mina Rocosa', 'Arcade de Cristal', 'Fuerte de Gemas', 'Cueva Subterránea', 'Brrrum Brrrum'],
    'Noqueo': ['Roca Belle', 'Fénix en Llamas', 'Manantial Caudaloso', 'A la Intemperie', 'Nuevos Horizontes', 'Barranco del Brazo de Oro'],
    'Caza estelar': ['Escondite', 'Tiroteo Estelar', 'Sequía Sanguinaria', 'Crimen Organizado'],
    'Atraco': ['Refugio', 'Cañón Explosivo', 'Patata Caliente', 'Aguas Turbulentas', 'Neumáticos Maniáticos'],
    'Hot Zone': ['Campo Abierto', 'Pista Ardiente', 'Duelo de Escarabajos', 'Estrategias Paralelas']
  };
  var MODES = Object.keys(MAPS);
  var MODE_COLOR = { 'Balón Brawl': '#2d7bff', 'Atrapagemas': '#a855f7', 'Noqueo': '#ff8a3d', 'Caza estelar': '#ffb800', 'Atraco': '#ef2b2b', 'Hot Zone': '#ff4fa3' };
  function setLabel(x) { return x ? (x.mode || 'Modo por definir') + (x.map ? ' · ' + x.map : '') : ''; }
  function setScore(m) { var h = 0, a = 0; (m.sets || []).forEach(function (x) { if (x.w === 'h') h++; else if (x.w === 'a') a++; }); return { h: h, a: a }; }
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
      case 'mode': return (e.set ? 'Set ' + e.set + ': ' : 'Modo de juego: ') + e.mode + (e.map ? ' · ' + e.map : '');
      case 'set': return 'Set ' + e.set + ' para ' + tn + (e.score ? ' (sets ' + e.score + ')' : '');
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
  function histMatches() { var out = [], n = 0; (S.history || []).forEach(function (e) { var d = histDate(e.date); (e.matches || []).forEach(function (m, i) { n++; out.push({ id: -1e6 + n, hist: e.id, at: (m.d ? histDate(m.d) : d) + ' 00:' + String(Math.floor(i / 60)).padStart(2, '0') + ':' + String(i % 60).padStart(2, '0'), home: histTeam(m.home), away: histTeam(m.away), hs: m.hs, as: m.as, hp: m.hp, ap: m.ap, hname: e.name }); }); }); return out; }
  // partidos del historial con jugadores anotados (hp/ap = ids de quienes jugaron por local/visitante): cuentan para partidos jugados, victorias y media
  function histPlayed() { return histMatches().filter(function (m) { return (m.hp && m.hp.length) || (m.ap && m.ap.length); }).map(function (m) { return Object.assign({}, m, { status: 'finished', live: { lineup: { h: m.hp || [], a: m.ap || [] }, ev: [], ratings: {} } }); }); }
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
    S.matches.filter(function (m) { return m.status === 'finished' && m.live; }).concat(histPlayed()).sort(byTime).forEach(function (m) {
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
    // MVP y goles anteriores al sitio (totales cargados a mano): suman a sus números e insignias, no cambian la media
    S.players.forEach(function (p) { var x = st[p.id], pv = p.prevStats; if (!x || !pv) return; x.mvp += Number(pv.mvp) || 0; x.g += Number(pv.g) || 0; });
    S.players.forEach(function (p) { var x = st[p.id]; (p.prevTitles || []).forEach(function (n) { x.titles = x.titles || []; x.titles.push(n); x.floor = (x.floor || 15) + (/mundial|world/i.test(n) ? 15 : 10); }); });
    Object.keys(st).forEach(function (id) { var x = st[id]; if (x.rated) x.nota = Math.round(x.sum / x.rated * 10) / 10; x.titles = x.titles || []; x.floor = x.floor ? Math.min(60, x.floor) : 10; if (x.floor > x.media) x.media = x.floor; if (!x.pj) return;
      x.opp = Math.round(x.opp / x.pj); var avg = x.score / x.pj, wgt = x.pj / (x.pj + 3);
      x.media = Math.max(x.floor, Math.min(100, Math.round(10 + (avg - 10) * wgt))); });
    return st;
  }
  function market() {
    var PS = playerStats(), rows = S.players.filter(plays).map(function (p) {
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
    MODES: MODES, MAPS: MAPS, MODE_COLOR: MODE_COLOR, setLabel: setLabel, setScore: setScore, PHASES: PHASES, liveMinute: liveMinute, liveClock: liveClock, eventText: eventText, playerName: playerName,
    ROLES: ROLES, roleOf: roleOf, roleName: roleName, plays: plays, canCoach: canCoach, matchPreview: matchPreview, marketState: marketState, histMatches: histMatches, histTeam: histTeam, teamPoints: teamPoints, PTS: PTS, compKind: compKind, compOf: compOf, TIERS: TIERS, tierOf: tierOf, tierRank: tierRank, playerStats: playerStats, liveSecs: function (m) { return Math.floor(liveMs(m) / 1000); },
    teamLevels: teamLevels,
    trophyArt: trophyArt, trophyOrd: trophyOrd, TROPHY_ART: TROPHY_ART, SHOP_DEFAULT: SHOP_DEFAULT, SHOP_EXCL: SHOP_EXCL, AWARD_TXT: AWARD_TXT, playerGames: playerGames, playerBadges: playerBadges, ballonList: ballonList, ballonWho: ballonWho, ballonCount: ballonCount, baseName: baseName, editionNo: editionNo, romanNo: romanNo, toRoman: toRoman, editionName: editionName, groupTrophies: groupTrophies, groupTable: groupTable, groupSeeds: groupSeeds, champSplit: champSplit, koName: koName,
    TROPHY_CATS: [['liga', 'Liga'], ['torneo', 'Torneo'], ['champions', 'Champions'], ['mundial', 'Mundial'], ['otro', 'Otro']], teamTrophies: teamTrophies, teamColor: teamColor, TROPHY_ICON: { liga: '🥇', torneo: '🏆', champions: '⭐', mundial: '🌍', otro: '🎖️' },
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
