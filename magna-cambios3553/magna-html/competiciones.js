'use strict';
(function () {
  var h = M.h, FM = { round_robin: 'Todos contra todos', double_round_robin: 'Ida y vuelta', knockout: 'Eliminatorias', groups_knockout: 'Grupos + eliminatorias', champions: 'Champions: liga + play-off' }, ST = { active: ['En juego', 'a'], paused: ['En pausa', 'p'], finished: ['Finalizada', ''] };
  var COL = ['#8b5cf6', '#2ee59d', '#ffd23f', '#ff6fb1', '#4aa8ff'], kind = 'leagues', cache = {};
  function table(rows, cols) {
    var w = h('div', 'pn tw'), tb = h('table'), th = h('tr'); cols.forEach(function (c) { th.appendChild(h('th', null, c[0])); }); tb.appendChild(th);
    rows.forEach(function (r) { var tr = h('tr', r.pos && r.pos <= 3 ? 'top3' : ''); cols.forEach(function (c, i) { tr.appendChild(h('td', i > 1 ? 'n' : '', r[c[1]])); }); tb.appendChild(tr); }); w.appendChild(tb); return w;
  }
  var LP = null;
  function needPoster(cb) { if (window.LlavesPoster) return cb(); if (!LP) { LP = []; var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,700..900&family=JetBrains+Mono:wght@700&display=swap'; document.head.appendChild(l);
      var sc = document.createElement('script'); sc.src = 'llaves-poster.js'; sc.onload = function () { var q = LP; LP = null; q.forEach(function (f) { f(); }); }; document.head.appendChild(sc); } if (LP) LP.push(cb); }
  // cuadro de una eliminatoria a ida y vuelta: ida, vuelta, global y desempate de cada llave
  function tiesDom(c) {
    var R = MAGNA.koTies(c); if (!R) return null; var w = h('div', 'kt'), sc = h('div', 'kt-sc'); w.appendChild(sc);
    var tn = function (t) { return t == null ? 'Por definir' : MAGNA.teamName(t); }, num = function (m, t) { return m && m.status === 'finished' ? String(m.home === t ? m.hs : m.as) : m && m.status === 'live' ? '•' : '–'; };
    R.forEach(function (r, ri) { var col = h('div', 'kt-c'); col.style.setProperty('--n', ri); var RCX = { 'Cuartos de final': ['🔥 Cuartos', 'q'], 'Semifinales': ['⚡ Semis', 's'], 'Final': ['👑 Final', 'f'], 'Octavos de final': ['🌀 Octavos', 'o'] }[r.round] || [r.round, 'o']; col.classList.add('kt-' + RCX[1]); col.appendChild(h('h4', 'kt-rh', RCX[0]));
      r.ties.forEach(function (t, i) { var chP = c.state && c.state.champion != null && t.win === c.state.champion, cd = h('div', 'kt-t' + (chP ? ' cp' : '') + (t.win != null ? ' done' : '') + (t.live ? ' live' : '') + (t.a == null && t.b == null ? ' tbd' : '')), hd = h('div', 'kt-h mono');
        var bd = window.LlavesPoster ? LlavesPoster.badges(t) : []; hd.appendChild(h('span', null, (r.round === 'Final' ? 'Gran final' : 'Llave ' + (i + 1)) + (t.live ? ' · 🔴 en vivo' : '') + (bd.length ? ' · ' + bd[0][0] : ''))); ['Ida', 'Vta', 'Global'].forEach(function (x) { hd.appendChild(h('span', null, x)); }); cd.appendChild(hd);
        [[t.a, t.ga], [t.b, t.gb]].forEach(function (x) { var row = h('div', 'kt-r' + (t.win != null ? (t.win === x[0] ? ' w' : ' l') : '')), nm = h('div', 'kt-n');
          if (x[0] != null) nm.appendChild(M.crest(x[0], MAGNA.teamName(x[0]), 22)); nm.appendChild(h('span', null, tn(x[0]))); row.appendChild(nm);
          row.appendChild(h('span', null, num(t.ida, x[0]))); row.appendChild(h('span', null, num(t.vta, x[0]))); row.appendChild(h('b', null, t.ida && t.ida.status === 'finished' ? String(x[1]) : '–')); cd.appendChild(row); });
        if (t.des) cd.appendChild(h('div', 'kt-d', '⚖ Desempate: ' + (t.des.status === 'finished' ? MAGNA.teamName(t.des.home) + ' ' + t.des.hs + ' - ' + t.des.as + ' ' + MAGNA.teamName(t.des.away) : 'por jugar')));
        else if (t.ida && t.vta && t.ida.status === 'finished' && t.vta.status === 'finished' && t.win == null) cd.appendChild(h('div', 'kt-d', '⚖ Global empatado: habrá desempate'));
        col.appendChild(cd); });
      sc.appendChild(col); });
    var ch = c.state && c.state.champion; if (ch != null) { var cc = h('div', 'kt-ch'); cc.appendChild(M.trophyImg(c.name, 'torneo', 92)); var tx = h('div'); tx.appendChild(h('small', 'mono', 'Campeón')); tx.appendChild(h('b', null, MAGNA.teamName(ch))); cc.appendChild(tx); w.insertBefore(cc, sc); }
    return w; }
  // las llaves + botón para compartir el cuadro como foto (póster de colores 1080×1350)
  function ties(c) { var w = tiesDom(c); if (!w) return null; var sb = h('button', 'btn kt-sh', '📸 Compartir el cuadro'); w.insertBefore(sb, w.firstChild); needPoster(function () {});
    sb.onclick = function () { sb.disabled = true; sb.textContent = '📸 Preparando la foto…'; needPoster(function () { var st = c.state || {}, IM = {}, art = MAGNA.trophyArt(c.name, 'torneo'), tro = new Image(), wait = [];
      var ld = function (im, u) { wait.push(new Promise(function (ok) { im.onload = im.onerror = ok; im.src = u; })); return im; };
      if (art) ld(tro, art.src); c.teamIds.forEach(function (id) { var u = MAGNA.crestUrl(id); IM[id] = { name: MAGNA.teamName(id), color: MAGNA.teamColor(id), img: u ? ld(new Image(), u) : null }; });
      var fo = document.fonts && document.fonts.load ? [document.fonts.load('900 40px Archivo'), document.fonts.load('900 extra-condensed 23px Archivo'), document.fonts.load('700 20px "JetBrains Mono"')] : [];
      Promise.all(wait.concat(fo).map(function (p) { return p.catch ? p.catch(function () {}) : p; })).then(function () { var cv = document.createElement('canvas');
        LlavesPoster.draw(cv, { title: c.name, sub: c.teamIds.length + ' equipos · llaves a ida y vuelta', status: c.status === 'finished' || st.phase === 'done' ? '🏆 TERMINADO' : st.ties ? '🔴 EN JUEGO · ' + String(st.round || '').toUpperCase() : '⏳ POR SORTEAR', brand: 'Magna Arena', trophy: tro, rounds: MAGNA.koTies(c), team: function (id) { return IM[id] || { name: MAGNA.teamName(id), color: MAGNA.teamColor(id) }; }, champ: st.champion != null ? st.champion : null });
        cv.toBlob(function (bl) { sb.disabled = false; sb.textContent = '📸 Compartir el cuadro'; if (!bl) return; var fn = c.name.replace(/[^\w]+/g, '-').toLowerCase() + '-cuadro.png', f = window.File ? new File([bl], fn, { type: 'image/png' }) : null;
          if (f && navigator.canShare && navigator.canShare({ files: [f] })) return navigator.share({ files: [f], title: c.name, text: 'Así va el cuadro de ' + c.name + ' en Magna Arena 🔥' }).catch(function () {});
          var a = document.createElement('a'); a.href = URL.createObjectURL(bl); a.download = fn; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }, 'image/png'); }); }); };
    return w; }
  function detail(k, it) {
    M.modal(function (b) {
      b.appendChild(h('h3', 'x', it.name)); var s = h('p', 'sub'); s.appendChild(h('span', 'badge ' + ST[it.status][1], ST[it.status][0])); s.appendChild(document.createTextNode(' ' + FM[it.config.format] + (it.config.legs === 2 && it.config.format === 'knockout' ? ' a ida y vuelta' : ''))); b.appendChild(s);
      if (it.description) b.appendChild(h('p', 'sub', it.description));
      if (k === 'leagues') {
        b.appendChild(h('h2', 'x', 'Clasificación')); b.appendChild(it.standings.length ? table(it.standings, [['#', 'pos'], ['Equipo', 'team'], ['PJ', 'pj'], ['G', 'g'], ['P', 'p'], ['DG', 'dg'], ['Pts', 'pts']]) : h('p', 'em', 'Sin equipos todavía.'));
      } else {
        var br = it.bracket;
        if (br) {
          b.appendChild(h('p', 'sub', br.champion ? 'Campeón: ' + br.champion.name : br.round ? 'Ronda actual: ' + br.round : br.phase === 'groups' ? (it.config.format === 'champions' ? 'Fase de liga (ida y vuelta)' : 'Fase de grupos') : ''));
          if (it.config.format === 'champions') { var cl = h('a', 'btn', 'Ver tabla y cuadro de la Champions →'); cl.href = 'champions.html?t=' + it.id; b.appendChild(cl); }
          var c2 = it.config.format === 'knockout' && it.config.legs === 2 && MAGNA.by(MAGNA.S.tournaments, it.id), kt = c2 && ties(c2); if (kt) { b.appendChild(h('h2', 'x', 'Llaves · ida y vuelta')); b.appendChild(kt); }
          (br.groups || []).forEach(function (g) { b.appendChild(h('h2', 'x', g.name === 'Liga' ? 'Fase de liga' : 'Grupo ' + g.name)); b.appendChild(table(g.table, [['#', 'pos'], ['Equipo', 'team'], ['G', 'g'], ['P', 'p'], ['DG', 'dg'], ['Pts', 'pts']])); });
        } else b.appendChild(h('p', 'sub', 'Series al mejor de ' + it.config.best_of + ' · ' + it.teams.length + ' equipos inscritos.'));
        b.appendChild(h('h2', 'x', 'Partidos')); var l = h('div', 'ml'); b.appendChild(l);
        M.get('/api/public/calendar').then(function (c) { var ms = c.upcoming.concat(c.recent).filter(function (m) { return m.competition === it.name; });
          if (!ms.length) l.appendChild(h('p', 'em', 'Todavía no hay partidos.')); ms.forEach(function (m) { var e = h('article', 'm'); e.style.gridTemplateColumns = '1fr auto'; var a = h('div'); a.appendChild(h('b', null, m.home + ' vs ' + m.away)); a.appendChild(h('small', null, (m.round || '') + ' · ' + M.fdt(m.starts_at))); e.appendChild(a); e.appendChild(h('span', m.status === 'finished' ? 'tt' : 'vs', m.status === 'finished' ? m.home_score + ' - ' + m.away_score : '')); l.appendChild(e); }); });
        if (it.config.rules) { b.appendChild(h('h2', 'x', 'Reglas')); var r = h('p', 'sub', it.config.rules); r.style.whiteSpace = 'pre-wrap'; b.appendChild(r); }
      }
    });
  }
  var CATN = { torneo: 'Torneo', liga: 'Liga', champions: 'Champions', otro: 'Otro' };
  function histDetail(e) {
    M.modal(function (b) {
      b.appendChild(h('h3', 'x', e.name)); b.appendChild(h('p', 'sub', (e.mundial ? 'Mundial' : CATN[e.cat] || 'Torneo') + (e.date ? ' · ' + e.date : '') + ' · Historial'));
      if (e.champion) { var c = h('p', 'sub'); c.appendChild(h('b', null, '🏆 Campeón: ' + e.champion)); b.appendChild(c); }
      var names = (e.champIds || []).map(function (id) { var p = MAGNA.by(MAGNA.S.players, id); return p ? p.name : null; }).filter(Boolean);
      if (names.length) b.appendChild(h('p', 'sub', 'Jugadores campeones: ' + names.join(', ')));
      b.appendChild(h('h2', 'x', 'Resultados')); var l = h('div', 'ml'); b.appendChild(l);
      if (!(e.matches || []).length) l.appendChild(h('p', 'em', 'No hay marcadores registrados.'));
      (e.matches || []).forEach(function (m) { var a = h('article', 'm'); a.style.gridTemplateColumns = '1fr auto'; var d = h('div'); d.appendChild(h('b', null, m.home + ' vs ' + m.away)); if (m.d) d.appendChild(h('small', null, m.d)); a.appendChild(d); a.appendChild(h('span', 'tt', m.hs + ' - ' + m.as)); l.appendChild(a); });
    });
  }
  function drawHist(g) {
    var L = ((window.MAGNA && MAGNA.S.history) || []).slice().sort(function (a, b) { return String(b.date || '').localeCompare(String(a.date || '')); });
    var SE = ((window.MAGNA && MAGNA.S.seasons) || []).slice().reverse();
    SE.forEach(function (x, i) { var c = h('article', 'tc ss-pub'); c.style.setProperty('--bar', COL[i % COL.length]); c.style.setProperty('--tint', M.tint(i + 3)); var lg = h('div', 'lg mono'); lg.appendChild(h('span', null, 'Temporada')); lg.appendChild(h('span', 'badge', String(x.at || '').slice(0, 4))); c.appendChild(lg);
      var cr = h('div', 'cr'); cr.style.width = cr.style.height = '88px'; cr.style.fontSize = '38px'; cr.textContent = '🏁'; c.appendChild(cr); c.appendChild(h('h3', 'x', x.name));
      var ul = h('div', 'ss-pl'); (x.champions || []).forEach(function (ch) { ul.appendChild(h('span', null, '🏆 ' + ch.teamName + ' · ' + ch.comp)); }); if (x.scorer) ul.appendChild(h('span', null, '⚽ Goleador: ' + x.scorer.name + ' (' + x.scorer.n + ')')); if (x.mvp) ul.appendChild(h('span', null, '⭐ Más MVP: ' + x.mvp.name + ' (' + x.mvp.n + ')')); c.appendChild(ul);
      var rk = h('div', 'ranks'); [[x.played, 'Partidos'], [x.goals, 'Goles'], [(x.champions || []).length, 'Campeones']].forEach(function (y) { var d = h('div', 'rk'); d.appendChild(h('b', null, String(y[0]))); d.appendChild(h('span', 'mono', y[1])); rk.appendChild(d); }); c.appendChild(rk); g.appendChild(c); });
    if (!L.length) { if (!SE.length) g.appendChild(h('p', 'em', 'Todavía no hay torneos en el historial.')); return; }
    var EDN = {}, EDC = {}; L.slice().reverse().forEach(function (e) { var k = MAGNA.baseName(e.name).toLowerCase(); EDC[k] = (EDC[k] || 0) + 1; EDN[e.id] = EDC[k]; });
    L.forEach(function (e, i) {
      var c = h('button', 'tc'); c.style.animationDelay = i * 50 + 'ms'; c.style.setProperty('--bar', COL[i % COL.length]); c.style.setProperty('--tint', M.tint(i));
      var lg = h('div', 'lg mono'); lg.appendChild(h('span', null, e.mundial ? 'Mundial' : CATN[e.cat] || 'Torneo')); lg.appendChild(h('span', 'badge', e.date ? e.date.slice(0, 4) : 'Historial')); c.appendChild(lg);
      var art = MAGNA.trophyArt(e.name, e.mundial ? 'mundial' : e.cat); if (art) c.appendChild(M.trophyImg(e.name, e.mundial ? 'mundial' : e.cat, 120)); else { var cr = h('div', 'cr'); cr.style.width = cr.style.height = '88px'; cr.style.fontSize = '34px'; cr.textContent = '🏆'; c.appendChild(cr); }
      c.appendChild(h('h3', 'x', e.name)); var ek = MAGNA.baseName(e.name).toLowerCase(); if (EDC[ek] > 1 && MAGNA.editionNo(e.name) == null) c.appendChild(h('div', 'mono', 'Edición ' + MAGNA.toRoman(EDN[e.id]))); var rk = h('div', 'ranks'); [[e.champion || '—', 'Campeón'], [(e.matches || []).length, 'Partidos']].forEach(function (x) { var d = h('div', 'rk'); d.appendChild(h('b', null, x[0])); d.appendChild(h('span', 'mono', x[1])); rk.appendChild(d); }); c.appendChild(rk);
      c.onclick = function () { histDetail(e); }; g.appendChild(c);
    });
  }
  function draw() {
    var g = document.getElementById('g'); g.innerHTML = ''; if (kind === 'history') return drawHist(g); var items = cache[kind] || [];
    if (!items.length) { g.appendChild(h('p', 'em', 'Todavía no hay ' + (kind === 'leagues' ? 'ligas' : 'torneos') + ' activos.')); return; }
    items.forEach(function (it, i) {
      var c = h('button', 'tc'); c.style.animationDelay = i * 50 + 'ms'; c.style.setProperty('--bar', COL[i % COL.length]); c.style.setProperty('--tint', M.tint(i));
      var lg = h('div', 'lg mono'); lg.appendChild(h('span', null, kind === 'leagues' ? 'Liga' : 'Torneo')); lg.appendChild(h('span', 'badge ' + ST[it.status][1], ST[it.status][0])); c.appendChild(lg);
      var cr = h('div', 'cr'); cr.style.width = cr.style.height = '88px'; cr.style.fontSize = '28px';
      if (it.has_logo) { var im = document.createElement('img'); im.alt = ''; im.src = '/api/public/' + kind + '/' + it.id + '/logo'; cr.appendChild(im); } else cr.textContent = it.name.slice(0, 2).toUpperCase(); c.appendChild(cr);
      if (!it.has_logo && MAGNA.trophyArt(it.name, 'torneo') && kind === 'tournaments') { cr.textContent = ''; cr.style.background = 'none'; cr.style.border = '0'; cr.appendChild(M.trophyImg(it.name, 'torneo', 88)); }
      c.appendChild(h('h3', 'x', it.name)); var rk = h('div', 'ranks'); [[it.teams.length, 'Equipos'], [it.config.format === 'knockout' && it.config.legs === 2 ? 'Ida y vuelta' : FM[it.config.format], 'Formato']].forEach(function (x) { var d = h('div', 'rk'); d.appendChild(h('b', null, x[0])); d.appendChild(h('span', 'mono', x[1])); rk.appendChild(d); }); c.appendChild(rk);
      c.onclick = function () { detail(kind, it); }; g.appendChild(c);
    });
  }
  var tabs = document.getElementById('tabs');
  [['leagues', 'Ligas'], ['tournaments', 'Torneos'], ['history', 'Historial']].forEach(function (k, i) { var b = h('button', 'chip' + (i ? '' : ' on'), k[1]); b.onclick = function () { kind = k[0]; [].forEach.call(tabs.children, function (x) { x.classList.toggle('on', x === b); }); draw(); }; tabs.appendChild(b); });
  if (/historial/.test(location.hash)) { kind = 'history'; [].forEach.call(tabs.children, function (x, i) { x.classList.toggle('on', i === 2); }); }
  Promise.all([M.get('/api/public/leagues'), M.get('/api/public/tournaments')]).then(function (r) { cache.leagues = r[0].items; cache.tournaments = r[1].items; draw(); });
})();
