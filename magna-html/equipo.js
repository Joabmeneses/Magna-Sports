'use strict';
// Página de cada equipo: equipo.html?id=<id del equipo>
(function () {
  var h = M.h, S = MAGNA.S, by = MAGNA.by, root = document.getElementById('eq');
  var CATN = {}; MAGNA.TROPHY_CATS.forEach(function (c) { CATN[c[0]] = c[1]; });
  var CATC = { liga: '#8b5cf6', torneo: '#ffd23f', champions: '#22d3ee', mundial: '#2ee59d', otro: '#ff8a3d' };
  function fmt(n) { return String(Math.round(Number(n || 0))).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function q(k) { var m = new RegExp('[?&]' + k + '=([^&#]*)').exec(location.search); return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : null; }
  function link(tid) { return 'equipo.html?id=' + tid; }
  function findTeam() { var id = Number(q('id')), n = q('n'); var t = id ? by(S.teams, id) : null; if (!t && n) t = S.teams.filter(function (x) { return x.name.toLowerCase() === n.toLowerCase(); })[0]; return t; }
  function ranking() {
    var TL = MAGNA.teamLevels(), PT = MAGNA.teamPoints();
    return S.teams.map(function (t) { return { id: t.id, pts: (PT[t.id] || {}).pts || 0, bd: PT[t.id] || {}, lvl: Math.round(TL.get(t.id)) }; }).sort(function (a, b) { return b.pts - a.pts || b.lvl - a.lvl; });
  }
  function record(tid) {
    var ms = S.matches.filter(function (m) { return m.status === 'finished' && m.hs != null && m.as != null && (m.home === tid || m.away === tid); }).sort(function (a, b) { return String(b.at || '').localeCompare(String(a.at || '')); });
    var r = { pj: 0, w: 0, l: 0, gf: 0, gc: 0, ms: ms };
    ms.forEach(function (m) { var hm = m.home === tid, f = hm ? m.hs : m.as, c = hm ? m.as : m.hs; r.pj++; r.gf += f; r.gc += c; if (f > c) r.w++; else r.l++; });
    return r;
  }
  function section(title, sub) { var s = h('section', 'eq-sec'), t = h('h2', 'x', title); if (sub) t.appendChild(h('small', null, sub)); s.appendChild(t); return s; }
  function crest(id, size) { return M.crest(id, MAGNA.teamName(id), size); }

  function render() {
    S = MAGNA.S; root.innerHTML = ''; var t = findTeam();
    if (!t) { var nf = h('div', 'nf'); nf.appendChild(h('h1', 'x', 'Equipo no encontrado')); nf.appendChild(h('p', 'sub', 'Ese equipo no existe o fue eliminado.')); var a = h('a', 'chip', 'Ver todos los equipos'); a.href = 'equipos.html'; a.style.cssText = 'display:inline-block;margin-top:18px;text-decoration:none'; nf.appendChild(a); root.appendChild(nf); document.title = 'Magna Arena · Equipo'; return; }
    document.title = 'Magna Arena · ' + t.name; var tc = MAGNA.teamColor(t.id); root.style.setProperty('--tc', tc);
    var R = ranking(), pos = R.map(function (x) { return x.id; }).indexOf(t.id) + 1, me = R[pos - 1] || { pts: 0, bd: {}, lvl: 1000 }, rec = record(t.id), tro = MAGNA.teamTrophies(t.id), PS = MAGNA.playerStats();
    var squad = S.players.filter(function (p) { return p.teamId === t.id && MAGNA.plays(p); }).sort(function (a, b) { return (a.slot === 'starter' ? 0 : 1) - (b.slot === 'starter' ? 0 : 1) || a.name.localeCompare(b.name); });
    var comps = S.leagues.filter(function (c) { return c.teamIds.indexOf(t.id) >= 0; }).map(function (c) { return { c: c, k: 'league' }; }).concat(S.tournaments.filter(function (c) { return c.teamIds.indexOf(t.id) >= 0; }).map(function (c) { return { c: c, k: 'tournament' }; }));
    var live = S.matches.filter(function (m) { return m.status === 'live' && (m.home === t.id || m.away === t.id); })[0];
    var coach = by(S.players, t.coach);

    // ---- portada ----
    var hero = h('div', 'eq-hero'); hero.appendChild(h('div', 'wm', t.name));
    var top = h('div', 'eq-top'), cr = crest(t.id, 150); cr.classList.add('eq-cr'); top.appendChild(cr);
    var id = h('div', 'eq-id'), tg = h('div', 'tags');
    if (live) tg.appendChild(h('span', 'lv', '● Jugando ahora'));
    tg.appendChild(h('span', null, pos ? '#' + pos + ' del ranking' : 'Sin ranking'));
    comps.slice(0, 2).forEach(function (x) { tg.appendChild(h('span', null, x.c.name)); });
    if (t.level) tg.appendChild(h('span', null, 'Fichajes: ' + ((MAGNA.TIERS[MAGNA.tierRank(t.level)] || [])[1] || t.level)));
    id.appendChild(tg); id.appendChild(h('h1', 'x', t.name));
    id.appendChild(h('p', null, (t.info ? t.info + ' ' : '') + (coach ? 'DT: ' + coach.name + ' (' + MAGNA.roleName(coach) + ').' : 'Sin DT por ahora.')));
    var act = h('div', 'eq-act');
    var sh = h('button', null, '↗ Compartir equipo'); sh.type = 'button'; sh.onclick = function () { var u = location.origin + location.pathname + '?id=' + t.id; if (navigator.share) navigator.share({ title: t.name + ' · Magna Arena', url: u }).catch(function () {}); else if (navigator.clipboard) navigator.clipboard.writeText(u).then(function () { sh.textContent = '¡Enlace copiado!'; setTimeout(function () { sh.textContent = '↗ Compartir equipo'; }, 1600); }); }; act.appendChild(sh);
    var meA = window.MAGNA_ME && MAGNA_ME.get(); if (meA && meA.player_id && t.coach === meA.player_id) { var mg = h('a', null, '⚙ Gestionar equipo'); mg.href = 'mi-equipo.html'; mg.style.borderColor = 'var(--yellow)'; act.insertBefore(mg, act.firstChild); }
    var rk = h('a', null, '📊 Ranking'); rk.href = 'ranking.html'; act.appendChild(rk); var al = h('a', null, '← Todos los equipos'); al.href = 'equipos.html'; act.appendChild(al);
    id.appendChild(act); top.appendChild(id); hero.appendChild(top);
    var kp = h('div', 'eq-kpi');
    [[fmt(me.pts), 'Puntos de ranking', 'gold'], [tro.length, tro.length === 1 ? 'Trofeo' : 'Trofeos', 'gold'], [rec.w + '-' + rec.l, 'Victorias - derrotas'], [me.lvl, 'Nivel']].forEach(function (x) { var d = h('div', x[2] || ''); d.appendChild(h('b', null, String(x[0]))); d.appendChild(h('small', null, x[1])); kp.appendChild(d); });
    hero.appendChild(kp); root.appendChild(hero);

    // ---- vitrina de trofeos ----
    var sv = section('Vitrina de trofeos', tro.length ? tro.length + (tro.length === 1 ? ' TÍTULO' : ' TÍTULOS') : ''), vit = h('div', 'vit');
    if (tro.length) {
      var cats = h('div', 'vit-cats'); MAGNA.TROPHY_CATS.forEach(function (c) { var n = tro.filter(function (x) { return x.cat === c[0]; }).length; if (!n) return; var sp = h('span'); sp.appendChild(document.createTextNode((MAGNA.TROPHY_ICON[c[0]] || '🏆') + ' ' + c[1] + ' ')); sp.appendChild(h('b', null, '×' + n)); cats.appendChild(sp); }); vit.appendChild(cats);
      var shelf = h('div', 'shelf');
      tro.forEach(function (x, i) { var d = h('div', 'tro2'); d.style.setProperty('--cc', CATC[x.cat] || '#ffd23f'); d.style.animationDelay = Math.min(i, 12) * 60 + 'ms'; if (x.season) d.appendChild(h('span', 'yr', x.season)); d.appendChild(h('span', 'ic', MAGNA.TROPHY_ICON[x.cat] || '🏆')); d.appendChild(h('b', null, x.name)); d.appendChild(h('small', null, CATN[x.cat] || 'Trofeo')); d.title = x.name + (x.season ? ' · ' + x.season : ''); shelf.appendChild(d); });
      vit.appendChild(shelf);
    } else { var e = h('div', 'vit-empty'); e.appendChild(h('span', null, '🏆')); e.appendChild(document.createTextNode('Todavía no hay trofeos en la vitrina. Cada título que gane ' + t.name + ' aparecerá aquí.')); vit.appendChild(e); }
    sv.appendChild(vit); root.appendChild(sv);

    // ---- rendimiento + puntos ----
    var two = h('div', 'eq-two');
    var pf = h('div', 'box'); pf.appendChild(h('h3', 'x', 'Rendimiento')); var pe = h('div', 'perf');
    [[rec.pj, 'Partidos'], [rec.w, 'Victorias'], [rec.l, 'Derrotas'], [(rec.gf - rec.gc > 0 ? '+' : '') + (rec.gf - rec.gc), 'Dif. goles']].forEach(function (x) { var d = h('div'); d.appendChild(h('b', null, String(x[0]))); d.appendChild(h('small', null, x[1])); pe.appendChild(d); }); pf.appendChild(pe);
    var fr = h('div', 'frm'); fr.appendChild(h('span', null, 'Últimos 5 · ' + (rec.pj ? Math.round(rec.w / rec.pj * 100) + '% de victorias' : 'sin partidos'))); var dd = h('div', 'd');
    for (var i = 0; i < 5; i++) { var m = rec.ms[i], w = m && ((m.home === t.id) ? m.hs > m.as : m.as > m.hs), it = h('i', m ? (w ? 'w' : 'l') : 'e', m ? (w ? 'V' : 'D') : ''); dd.appendChild(it); } fr.appendChild(dd); pf.appendChild(fr);
    var pp = h('div', 'box'); pp.appendChild(h('h3', 'x', 'Puntos de ranking')); var pb = h('div', 'pbd'), mx = Math.max(1, me.bd.base || 0, me.bd.league || 0, me.bd.champions || 0, me.bd.mundial || 0, me.bd.tournament || 0, me.bd.friendly || 0), bars = [];
    [['Liga', 'league', '#8b5cf6'], ['Champions', 'champions', '#22d3ee'], ['Mundial', 'mundial', '#2ee59d'], ['Otros torneos', 'tournament', '#ffd23f'], ['Amistosos', 'friendly', '#ff8a3d']].concat(me.bd.base ? [['Anteriores', 'base', '#c9cfdc']] : []).forEach(function (x) { var r = h('div', 'r'); r.style.setProperty('--cc', x[2]); r.appendChild(h('span', null, x[1] === 'friendly' ? x[0] : x[0])); var br = h('div', 'br'), bi = h('i'); br.appendChild(bi); r.appendChild(br); r.appendChild(h('b', null, fmt(me.bd[x[1]] || 0))); pb.appendChild(r); bars.push([bi, (me.bd[x[1]] || 0) / mx * 100]); });
    pp.appendChild(pb); var nt = h('p', 'em', 'Victoria: liga 15.000 · Champions 35.000 · Mundial 50.000 · otro torneo 25.000. Amistoso: 5.000 gane o pierda.'); nt.style.cssText = 'font-size:12px;margin:14px 0 0'; pp.appendChild(nt);
    two.appendChild(pf); two.appendChild(pp); var sp2 = section('Temporada'); sp2.appendChild(two); root.appendChild(sp2);
    requestAnimationFrame(function () { requestAnimationFrame(function () { bars.forEach(function (b) { b[0].style.width = b[1] + '%'; }); }); });

    // ---- plantilla ----
    var sq = section('Plantilla', squad.length + '/4 JUGADORES'), grid = h('div', 'sqd');
    if (!squad.length) grid.appendChild(h('p', 'em', 'Este equipo todavía no tiene jugadores.'));
    squad.forEach(function (p, k) { var x = PS[p.id] || {}, md = x.media == null ? 10 : x.media, tr = MAGNA.tierOf(md), c = h('a', 'pc2'); c.href = 'mercado.html'; c.style.animationDelay = k * 70 + 'ms'; c.style.setProperty('--kc', tr.color); c.title = 'Ver en Fichajes';
      var bd = h('div', 'pbg'); if (t.coach === p.id) bd.appendChild(h('span', 'dt', 'DT')); bd.appendChild(h('span', null, p.slot === 'reserve' ? 'Suplente' : 'Titular')); c.appendChild(bd);
      var tp = h('div', 'ptop'), av = M.tierAv(p.name, md, 54); tp.appendChild(av); var nm = h('div'); nm.appendChild(h('b', 'n', p.name)); nm.appendChild(h('span', 'rl', tr.name)); tp.appendChild(nm);
      var mm = h('div', 'pmd'); mm.appendChild(h('b', null, String(md))); mm.appendChild(h('small', null, 'Media')); tp.appendChild(mm); c.appendChild(tp);
      var ps = h('div', 'pst'); [[x.pj || 0, 'PJ'], [(x.w || 0) + '-' + (x.l || 0), 'V-D'], [x.g || 0, 'Goles'], [(x.titles || []).length, 'Trofeos']].forEach(function (v) { var d = h('div'); d.appendChild(h('b', null, String(v[0]))); d.appendChild(h('small', null, v[1])); ps.appendChild(d); }); c.appendChild(ps);
      if ((x.titles || []).length) { var tl = h('div', 'tl'); x.titles.slice(0, 4).forEach(function (n) { tl.appendChild(h('span', null, '🏆 ' + n)); }); if (x.titles.length > 4) tl.appendChild(h('span', null, '+' + (x.titles.length - 4))); c.appendChild(tl); }
      grid.appendChild(c); });
    sq.appendChild(grid); root.appendChild(sq);

    // ---- partidos ----
    function mrow(m) {
      var hm = m.home === t.id, op = hm ? m.away : m.home, c = MAGNA.compOf(m), r = h(m.status === 'finished' || m.status === 'live' ? 'div' : 'div', 'mrow');
      var oc = h('a'); oc.href = link(op); oc.appendChild(crest(op, 40)); oc.title = MAGNA.teamName(op); r.appendChild(oc);
      var tx = h('div'); var nmv = h('b'); nmv.appendChild(document.createTextNode('vs ' + MAGNA.teamName(op))); tx.appendChild(nmv);
      tx.appendChild(h('small', null, (hm ? 'Local' : 'Visitante') + ' · ' + (c ? c.name : '—') + (m.round ? ' · ' + m.round : '') + (m.at ? ' · ' + M.fdt(m.at) : '')));
      if (m.sets && m.sets.length) { var st = h('div', 'sets'); m.sets.forEach(function (x, k) { var s = h('span', null, 'S' + (k + 1) + ' ' + (x.mode || '?') + (x.w ? (x.w === (hm ? 'h' : 'a') ? ' ✓' : ' ✗') : '')); s.style.setProperty('--mc', MAGNA.MODE_COLOR[x.mode] || '#555b75'); st.appendChild(s); }); tx.appendChild(st); }
      r.appendChild(tx); var sc = h('div', 'sc');
      if (m.status === 'finished') { var f = hm ? m.hs : m.as, a = hm ? m.as : m.hs; sc.appendChild(h('b', null, f + ' - ' + a)); sc.appendChild(h('span', 'res ' + (f > a ? 'w' : 'l'), f > a ? 'V' : 'D')); }
      else if (m.status === 'live') { sc.appendChild(h('span', 'lvb', '● ' + (hm ? m.hs || 0 : m.as || 0) + ' - ' + (hm ? m.as || 0 : m.hs || 0))); }
      else sc.appendChild(h('small', null, 'Próximo'));
      r.appendChild(sc); return r;
    }
    var mine = S.matches.filter(function (m) { return m.status !== 'cancelled' && (m.home === t.id || m.away === t.id); });
    var up = mine.filter(function (m) { return m.status === 'live' || m.status === 'scheduled'; }).sort(function (a, b) { return (b.status === 'live') - (a.status === 'live') || String(a.at || '9').localeCompare(String(b.at || '9')); }).slice(0, 5);
    var two2 = h('div', 'eq-two'), c1 = h('div'), c2 = h('div');
    c1.appendChild(h('h3', 'x', 'Próximos partidos')); var l1 = h('div', 'mlst'); if (!up.length) l1.appendChild(h('p', 'em', 'No tiene partidos programados.')); up.forEach(function (m) { l1.appendChild(mrow(m)); }); c1.appendChild(l1);
    c2.appendChild(h('h3', 'x', 'Últimos resultados')); var l2 = h('div', 'mlst'); if (!rec.ms.length) l2.appendChild(h('p', 'em', 'Todavía no hay resultados.')); rec.ms.slice(0, 6).forEach(function (m) { l2.appendChild(mrow(m)); }); c2.appendChild(l2);
    two2.appendChild(c1); two2.appendChild(c2); var sm = section('Partidos'); sm.appendChild(two2); root.appendChild(sm);

    // ---- competiciones ----
    if (comps.length) { var sc2 = section('Competiciones'), cl = h('div', 'cmp');
      comps.forEach(function (x) { var a = h('a'); a.href = x.k === 'league' ? 'ligas.html' : x.c.format === 'groups_knockout' ? 'mundial.html' : x.c.format === 'champions' ? 'champions.html?t=' + x.c.id : 'competiciones.html'; var tx = h('div'); tx.appendChild(h('b', null, x.c.name)); var info = x.k === 'league' ? 'Liga' : 'Torneo';
        var posTxt = '';
        if (x.k === 'league') { var rows = MAGNA.standings(Object.assign({ kind: 'league' }, x.c)), me2 = rows.filter(function (y) { return y.team_id === t.id; })[0]; if (me2) { posTxt = '#' + me2.pos; info += ' · ' + me2.pts + ' pts · ' + me2.pj + ' PJ'; } }
        else if (x.c.state && x.c.state.champion === t.id) posTxt = '🏆';
        info += x.c.status === 'finished' ? ' · Finalizada' : x.c.status === 'active' ? ' · En juego' : '';
        tx.appendChild(h('small', null, info)); a.appendChild(tx); a.appendChild(h('span', 'pos', posTxt || '›')); cl.appendChild(a); });
      sc2.appendChild(cl); root.appendChild(sc2); }

    // ---- otros equipos ----
    var oth = S.teams.filter(function (x) { return x.id !== t.id; });
    if (oth.length) { var so = section('Otros equipos'), ol = h('div', 'others'); oth.forEach(function (x) { var a = h('a'); a.href = link(x.id); a.appendChild(crest(x.id, 32)); a.appendChild(document.createTextNode(x.name)); ol.appendChild(a); }); so.appendChild(ol); root.appendChild(so); }
  }
  render();
  window.addEventListener('magna:update', render);
})();
