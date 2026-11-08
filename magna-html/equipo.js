'use strict';
// Página de cada equipo: equipo.html?id=<id del equipo>. Versión colorida e interactiva, con alineación.
(function () {
  var h = M.h, S = MAGNA.S, by = MAGNA.by, root = document.getElementById('eq'), RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CATN = {}; MAGNA.TROPHY_CATS.forEach(function (c) { CATN[c[0]] = c[1]; });
  var CATC = { liga: '#8b5cf6', torneo: '#ffd23f', champions: '#22d3ee', mundial: '#2ee59d', otro: '#ff8a3d' };
  var PTC = { league: ['Liga', '#8b5cf6'], champions: ['Champions', '#22d3ee'], mundial: ['Mundial', '#2ee59d'], tournament: ['Otros torneos', '#ffd23f'], friendly: ['Amistosos', '#ff8a3d'] };
  function fmt(n) { return String(Math.round(Number(n || 0))).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function q(k) { var m = new RegExp('[?&]' + k + '=([^&#]*)').exec(location.search); return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : null; }
  function link(tid) { return 'equipo.html?id=' + tid; }
  function shade(hx, a) { var n = parseInt(String(hx).replace('#', ''), 16); if (isNaN(n)) return hx; var r = Math.max(0, Math.min(255, (n >> 16) + a)), g = Math.max(0, Math.min(255, (n >> 8 & 255) + a)), b = Math.max(0, Math.min(255, (n & 255) + a)); return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1); }
  function findTeam() { var id = Number(q('id')), n = q('n'); var t = id ? by(S.teams, id) : null; if (!t && n) t = S.teams.filter(function (x) { return x.name.toLowerCase() === n.toLowerCase(); })[0]; return t; }
  function byTime(a, b) { return String(a.at || '').localeCompare(String(b.at || '')) || a.id - b.id; }
  function crest(id, size) { return M.crest(id, MAGNA.teamName(id), size); }
  function feat(title, desc) { var s = h('section', 'feat'), fh = h('div', 'fh'); fh.appendChild(h('span', 'n', String(root.querySelectorAll('section.feat').length + 1))); fh.appendChild(h('h2', 'x', title)); s.appendChild(fh); if (desc) { var p = h('p', 'fd'); p.innerHTML = desc; s.appendChild(p); } root.appendChild(s); return s; }
  function won(m, tid) { return m.home === tid ? m.hs > m.as : m.as > m.hs; }
  function sc(m, tid) { return m.home === tid ? m.hs + '-' + m.as : m.as + '-' + m.hs; }
  function countUp(el, to, f) { if (RM) { el.textContent = f ? fmt(to) : to; return; } var t0 = performance.now(); (function s(n) { var k = Math.min(1, (n - t0) / 1100), v = to * (1 - Math.pow(1 - k, 3)); el.textContent = f ? fmt(v) : Math.round(v); if (k < 1) requestAnimationFrame(s); })(t0); }
  function grow(list) { requestAnimationFrame(function () { requestAnimationFrame(function () { list.forEach(function (x) { x[0].style.width = x[1] + '%'; }); }); }); }

  function render() {
    S = MAGNA.S; root.innerHTML = ''; var t = findTeam();
    if (!t) { var nf = h('div', 'nf'); nf.appendChild(h('h1', 'x', 'Equipo no encontrado')); nf.appendChild(h('p', 'sub', 'Ese equipo no existe o fue eliminado.')); var a0 = h('a', 'chip', 'Ver todos los equipos'); a0.href = 'equipos.html'; a0.style.cssText = 'display:inline-block;margin-top:18px;text-decoration:none'; nf.appendChild(a0); root.appendChild(nf); document.title = 'Magna Arena · Equipo'; return; }
    document.title = 'Magna Arena · ' + t.name; var tc = MAGNA.teamColor(t.id); document.body.style.setProperty('--tc', tc); root.style.setProperty('--tc', tc);
    var TL = MAGNA.teamLevels(), PT = MAGNA.teamPoints(), PS = MAGNA.playerStats();
    var R = S.teams.map(function (x) { return { id: x.id, pts: (PT[x.id] || {}).pts || 0, lvl: Math.round(TL.get(x.id)) }; }).sort(function (a, b) { return b.pts - a.pts || b.lvl - a.lvl; });
    var pos = R.map(function (x) { return x.id; }).indexOf(t.id) + 1, bd = PT[t.id] || {}, lvl = Math.round(TL.get(t.id)), tro = MAGNA.teamTrophies(t.id);
    var fin = S.matches.filter(function (m) { return m.status === 'finished' && m.hs != null && m.as != null; }).sort(byTime);
    var mine = fin.filter(function (m) { return m.home === t.id || m.away === t.id; }), w = mine.filter(function (m) { return won(m, t.id); }).length, l = mine.length - w;
    var squad = S.players.filter(function (p) { return p.teamId === t.id && MAGNA.plays(p); }).sort(function (a, b) { return (a.slot === 'starter' ? 0 : 1) - (b.slot === 'starter' ? 0 : 1) || a.name.localeCompare(b.name); });
    var coach = by(S.players, t.coach), live = S.matches.filter(function (m) { return m.status === 'live' && (m.home === t.id || m.away === t.id); })[0];
    var comps = S.leagues.filter(function (c) { return c.teamIds.indexOf(t.id) >= 0; }).map(function (c) { return { c: c, k: 'league' }; }).concat(S.tournaments.filter(function (c) { return c.teamIds.indexOf(t.id) >= 0 && c.status !== 'draft'; }).map(function (c) { return { c: c, k: 'tournament' }; }));
    var media = function (p) { var x = PS[p.id] || {}; return x.media == null ? 10 : x.media; };

    // ---------- portada: mismo diseño que el perfil del jugador, con el banner del equipo y su color ----------
    var ICON = {
      back: '<path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
      share: '<path d="M12 15V3M7 8l5-5 5 5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 12v7h14v-7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
      card: '<path d="M4 5h16v14H4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M4 15l4-4 4 4 3-3 5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="15.5" cy="8.5" r="1.5" fill="currentColor"/>',
      rank: '<path d="M5 20V12M12 20V5M19 20v-5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
      gear: '<circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
      link: '<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' };
    function ic(k) { return '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">' + ICON[k] + '</svg>'; }
    var tc0 = MAGNA.teamColor(t.id), hero = h('section', 'tq'); hero.style.setProperty('--tc', tc0);
    var bn = h('div', 'tq-bn'); bn.appendChild(h('div', 'wm', t.name)); for (var z = 0; z < 7; z++) { var sp0 = h('i', 'tq-sp'); sp0.style.left = (8 + z * 13) + '%'; sp0.style.animationDelay = (z * .8) + 's'; sp0.style.animationDuration = (5 + (z % 3) * 1.4) + 's'; bn.appendChild(sp0); }
    if (window.TEAM_BANNER) TEAM_BANNER.cover(bn, t);
    var top = h('div', 'tq-top'), back = h('a', 'tq-bk'); back.href = 'equipos.html'; back.innerHTML = ic('back'); back.appendChild(h('span', null, 'Equipos')); top.appendChild(back); top.appendChild(h('span', 'sp'));
    if (live) { var lv = h('a', 'tq-cur tq-lv'); lv.href = 'index.html'; lv.appendChild(h('i')); lv.appendChild(h('b', null, 'EN VIVO')); top.appendChild(lv); }
    if (tro.length) { var tb0 = h('span', 'tq-cur'); tb0.title = tro.length + (tro.length === 1 ? ' trofeo' : ' trofeos'); tb0.appendChild(M.trophyImg(tro[0].name, tro[0].cat, 20, '🏆')); tb0.appendChild(h('b', null, '×' + tro.length)); top.appendChild(tb0); }
    var pts0 = h('span', 'tq-cur'); pts0.title = 'Puntos de ranking'; pts0.appendChild(h('em', null, 'PTS')); pts0.appendChild(h('b', null, fmt(bd.pts || 0))); top.appendChild(pts0);
    bn.appendChild(top);
    var nmw = h('div', 'tq-nm'); nmw.appendChild(h('h1', null, t.name)); bn.appendChild(nmw); hero.appendChild(bn);
    // escudo montado + insignia de ranking con globito
    var mid = h('div', 'tq-mid'), av = h('div', 'tq-av'), cr = crest(t.id, 150); cr.classList.add('tq-cr'); av.appendChild(cr);
    av.addEventListener('pointermove', function (e) { var r = av.getBoundingClientRect(), dx = (e.clientX - r.left) / r.width - .5, dy = (e.clientY - r.top) / r.height - .5; cr.style.transform = 'rotateY(' + dx * 30 + 'deg) rotateX(' + (-dy * 30) + 'deg) scale(1.05)'; });
    av.addEventListener('pointerleave', function () { cr.style.transform = ''; });
    var bdg = h('button', 'tq-bdg'); bdg.type = 'button'; bdg.setAttribute('aria-label', pos ? 'Puesto ' + pos + ' del ranking' : 'Sin ranking'); bdg.appendChild(h('b', null, pos ? '#' + pos : '–'));
    var pop = h('div', 'tq-pop'), topL = R.length ? Math.max(1, R[0].pts) : 1; pop.appendChild(h('b', null, pos ? 'Puesto ' + pos + ' de ' + R.length : 'Aún sin ranking'));
    var xb = h('div', 'tq-xp'), xf = h('i'); xb.appendChild(xf); pop.appendChild(xb);
    var nxt = pos > 1 ? R[pos - 2] : null; pop.appendChild(h('small', null, pos === 1 ? '¡Líder del ranking!' : nxt ? 'Faltan ' + fmt(Math.max(1, nxt.pts - (bd.pts || 0))) + ' pts para subir al #' + (pos - 1) : 'Juega partidos para entrar'));
    bdg.onclick = function (e) { e.stopPropagation(); var on = pop.classList.toggle('on'); if (on) requestAnimationFrame(function () { xf.style.width = Math.max(4, Math.min(100, (bd.pts || 0) / topL * 100)) + '%'; }); else xf.style.width = '0'; };
    av.appendChild(bdg); av.appendChild(pop); mid.appendChild(av);
    var act = h('div', 'tq-acts');
    function sq(k, label, fn, href) { var b2 = h(href ? 'a' : 'button', 'tq-sq'); if (href) b2.href = href; else b2.type = 'button'; b2.innerHTML = ic(k); b2.appendChild(h('span', 'tp', label)); b2.setAttribute('aria-label', label); if (fn) b2.onclick = fn; act.appendChild(b2); return b2; }
    function okFx(b3, msg, def) { b3.classList.add('ok'); b3.querySelector('.tp').textContent = msg; setTimeout(function () { b3.classList.remove('ok'); b3.querySelector('.tp').textContent = def; }, 1600); }
    var url0 = location.origin + location.pathname + '?id=' + t.id;
    var shb = sq('share', 'Compartir', function () { if (navigator.share) navigator.share({ title: t.name + ' · Magna Arena', url: url0 }).catch(function () {}); else if (navigator.clipboard) navigator.clipboard.writeText(url0).then(function () { okFx(shb, '¡Enlace copiado!', 'Compartir'); }); });
    if (window.SHARE_CARD) sq('card', 'Tarjeta del equipo', function () { SHARE_CARD.open('team', function () {
      var G = MAGNA.groupTrophies(tro).sort(function (a, c) { return MAGNA.trophyOrd(a.name, a.cat) - MAGNA.trophyOrd(c.name, c.cat); });
      return { name: t.name, color: MAGNA.teamColor(t.id), crest: MAGNA.crestUrl(t.id), pos: pos, pts: bd.pts || 0, level: lvl, record: [w, l], trophyCount: tro.length, coach: coach ? coach.name : null, squad: squad.map(function (p) { return p.name; }),
        trophies: G.map(function (g) { return { name: g.name, n: g.n, art: MAGNA.trophyArt(g.name, g.cat), emoji: MAGNA.TROPHY_ICON[g.cat] || '🏆' }; }) }; }); });
    var cpb = sq('link', 'Copiar enlace', function () { if (navigator.clipboard) navigator.clipboard.writeText(url0).then(function () { okFx(cpb, '¡Copiado!', 'Copiar enlace'); }); });
    sq('rank', 'Ver el ranking', null, 'ranking.html');
    var meA = window.MAGNA_ME && MAGNA_ME.get(); if (meA && meA.player_id && t.coach === meA.player_id) sq('gear', 'Gestionar equipo', null, 'mi-equipo.html');
    mid.appendChild(act); hero.appendChild(mid);
    // panel: identidad + chip + cifras + pestañas + caja
    var pnl = h('div', 'tq-pn'), row = h('div', 'tq-row'), idb = h('div', 'tq-id');
    idb.appendChild(h('b', null, coach ? 'DT: ' + coach.name : 'Sin DT por ahora'));
    var tg = []; comps.filter(function (x) { return x.c.status === 'active'; }).slice(0, 2).forEach(function (x) { tg.push(x.c.name); });
    idb.appendChild(h('small', null, tg.length ? 'Jugando: ' + tg.join(' · ') : (t.info || (squad.length + (squad.length === 1 ? ' jugador' : ' jugadores') + ' en la plantilla'))));
    var stk = 0; for (var k = mine.length - 1; k >= 0 && won(mine[k], t.id); k--) stk++;
    if (stk >= 2) idb.appendChild(h('span', 'tq-stk', '🔥 Racha de ' + stk + ' victorias'));
    row.appendChild(idb); var tierN = t.level ? ((MAGNA.TIERS[MAGNA.tierRank(t.level)] || [])[1] || t.level) : null;
    var chip = h('div', 'tq-chip'); chip.appendChild(h('span', null, 'NIVEL ' + lvl)); chip.appendChild(h('span', null, tierN ? String(tierN).toUpperCase() : (pos ? '#' + pos : '—'))); if (tierN) chip.title = 'Nivel de fichajes: ' + tierN; row.appendChild(chip); pnl.appendChild(row);
    var kp = h('div', 'tq-st'), cnt = [];
    [[bd.pts || 0, 'Puntos', 1], [tro.length, tro.length === 1 ? 'Trofeo' : 'Trofeos'], [w, 'Victorias'], [l, 'Derrotas']].forEach(function (x, i) { var d = h('div'), b3 = h('b', null, '0'); d.style.animationDelay = i * 50 + 'ms'; d.appendChild(b3); d.appendChild(h('small', null, x[1])); kp.appendChild(d); cnt.push([b3, x[0], x[2]]); });
    pnl.appendChild(kp); pnl.appendChild(h('hr'));
    var tabsEl = h('div', 'tq-tabs'); tabsEl.setAttribute('role', 'tablist'); pnl.appendChild(tabsEl);
    var box = h('div', 'tq-box'); box.setAttribute('role', 'tabpanel'); var wm2 = h('div', 'tq-wm'); wm2.appendChild(crest(t.id, 220)); box.appendChild(wm2); box.appendChild(h('div', 'tq-bd')); pnl.appendChild(box);
    hero.appendChild(pnl); hero._cnt = { squad: squad.length, tro: tro.length, games: mine.length };
    root.appendChild(hero); cnt.forEach(function (c) { countUp(c[0], c[1], c[2]); });

    // ---------- alineación ----------
    var lv = live && live.live && live.live.lineup, side = live ? (live.home === t.id ? 'h' : 'a') : null, liveIds = lv && lv[side] ? (Array.isArray(lv[side]) ? lv[side] : lv[side].starters || []) : null;
    var starters = liveIds && liveIds.length ? liveIds.map(function (pid) { return by(S.players, pid); }).filter(Boolean) : squad.filter(function (p) { return p.slot === 'starter'; });
    var bench = squad.filter(function (p) { return starters.indexOf(p) < 0; });
    var sA = feat('Alineación', liveIds && liveIds.length ? 'La alineación que está jugando <b>ahora mismo</b>. Toca un jugador para ver su carta.' : 'Los <b>3 titulares</b> en la arena y los suplentes en el banquillo. Toca un jugador para ver su carta más abajo.');
    var pitch = h('div', 'pitch'); pitch.appendChild(h('span', 'lbl', liveIds && liveIds.length ? '● En vivo' : 'Titulares · 3 vs 3'));
    if (coach) { var dt = h('div', 'dt'); dt.appendChild(M.tierAv(coach.name, media(coach), 28, coach.id)); dt.appendChild(h('span', null, coach.name)); dt.appendChild(h('span', 'b', 'DT')); pitch.appendChild(dt); }
    var slots = h('div', 'slots'), SP = [[50, 26], [24, 72], [76, 72]];
    for (var i = 0; i < 3; i++) { var p = starters[i], tk = h('button', 'tok' + (p ? '' : ' empty')); tk.type = 'button'; tk.style.left = SP[i][0] + '%'; tk.style.top = SP[i][1] + '%'; tk.style.animationDelay = i * 120 + 'ms';
      var ring = h('span', 'ring');
      if (p) { var md = media(p), tr = MAGNA.tierOf(md); tk.style.setProperty('--kc', tr.color); tk.style.setProperty('--pc', Math.max(4, Math.min(100, md))); ring.appendChild(M.photo(h('span', 'ini2', p.name.slice(0, 2).toUpperCase()), p.id)); ring.appendChild(h('span', 'mdl', String(md))); tk.appendChild(ring); tk.appendChild(h('b', null, p.name)); tk.appendChild(h('small', null, (t.coach === p.id ? 'DT · ' : '') + tr.name));
        tk.setAttribute('aria-label', p.name + ', media ' + md + '. Ver su carta'); (function (pid) { tk.onclick = function () { showCard(pid); }; })(p.id); }
      else { ring.appendChild(h('span', 'ini2', '+')); tk.appendChild(ring); tk.appendChild(h('small', null, 'Puesto libre')); tk.disabled = true; }
      slots.appendChild(tk); }
    pitch.appendChild(slots); sA.appendChild(pitch);
    var bn = h('div', 'bench'); bn.appendChild(h('small', null, 'Banquillo'));
    if (!bench.length) bn.appendChild(h('span', 'em', 'Sin suplentes'));
    bench.forEach(function (p) { var b = h('button'); b.type = 'button'; b.appendChild(M.tierAv(p.name, media(p), 30, p.id)); b.appendChild(document.createTextNode(p.name + ' · ' + media(p))); b.onclick = function () { showCard(p.id); }; bn.appendChild(b); });
    sA.appendChild(bn);
    var nxt = live || S.matches.filter(function (m) { return m.status === 'scheduled' && (m.home === t.id || m.away === t.id); }).sort(function (a, b) { return String(a.at || '9').localeCompare(String(b.at || '9')); })[0];
    if (nxt) { var nm = h('div', 'nextm'), op = nxt.home === t.id ? nxt.away : nxt.home, cp = MAGNA.compOf(nxt); nm.appendChild(h('span', live ? 'lvb' : 'em', live ? '● En vivo' : 'Próximo partido')); var oa = h('a'); oa.href = link(op); oa.appendChild(crest(op, 34)); nm.appendChild(oa);
      var nt = h('div'); nt.appendChild(h('b', null, 'vs ' + MAGNA.teamName(op))); nt.appendChild(h('small', null, ' ' + (cp ? cp.name : '') + (nxt.round ? ' · ' + nxt.round : '') + (nxt.at ? ' · ' + M.fdt(nxt.at) : ''))); nm.appendChild(nt); sA.appendChild(nm); }

    // ---------- gráfica de la temporada ----------
    var sG = feat('Temporada', 'Cómo fueron subiendo sus <b>puntos de ranking</b> o su <b>nivel</b> partido a partido. Pasa el mouse o el dedo por la línea.');
    var gb = h('div', 'bx');
    if (!mine.length) gb.appendChild(h('p', 'em', 'Todavía no hay partidos terminados. La gráfica aparece con el primer resultado.'));
    else {
      var earned = mine.map(function (m) { var kd = MAGNA.compKind(m); return kd === 'friendly' ? MAGNA.PTS.friendly : won(m, t.id) ? MAGNA.PTS[kd] : 0; }), sum = earned.reduce(function (a, b) { return a + b; }, 0);
      var P0 = (bd.pts || 0) - sum, ptsS = [P0], lvS = [Math.round((TL.pre[mine[0].id] || { h: 1000, a: 1000 })[mine[0].home === t.id ? 'h' : 'a'])];
      mine.forEach(function (m, i) { ptsS.push(ptsS[i] + earned[i]); var pr = TL.pre[m.id] || { h: 1000, a: 1000, eh: .5 }, hm = m.home === t.id, e = hm ? pr.eh : 1 - pr.eh, r0 = hm ? pr.h : pr.a; lvS.push(Math.round(r0 + 40 * ((won(m, t.id) ? 1 : 0) - e))); });
      var mode = 'pts', chs = h('div', 'chips2'), chart = h('div', 'chart');
      [['pts', 'Puntos de ranking'], ['lvl', 'Nivel']].forEach(function (x) { var b = h('button', 'chip2', x[1]); b.type = 'button'; b.setAttribute('aria-pressed', x[0] === mode); b.onclick = function () { mode = x[0]; [].forEach.call(chs.children, function (c) { c.setAttribute('aria-pressed', c === b); }); draw(); }; chs.appendChild(b); });
      gb.appendChild(chs); gb.appendChild(chart);
      var draw = function () { var v = mode === 'pts' ? ptsS : lvS; lineChart(chart, v, tc, mode === 'pts' ? function (x) { return x >= 1000 ? fmt(Math.round(x / 1000)) + 'k' : Math.round(x); } : null, function (i) {
        if (!i) return '<b>Antes de la temporada</b>' + (mode === 'pts' ? fmt(ptsS[0]) + ' pts' : 'Nivel ' + lvS[0]); var m = mine[i - 1], op = m.home === t.id ? m.away : m.home;
        return '<b>' + (won(m, t.id) ? 'Victoria ' : 'Derrota ') + sc(m, t.id) + ' vs ' + esc(MAGNA.teamName(op)) + '</b>' + (mode === 'pts' ? (earned[i - 1] ? '+' + fmt(earned[i - 1]) + ' · ' : '') + fmt(ptsS[i]) + ' pts' : 'Nivel ' + lvS[i]); }); };
      draw();
    }
    var pb = h('div', 'pbd'), keys = Object.keys(PTC).concat(bd.base ? ['base'] : []), mx = Math.max.apply(null, keys.map(function (x) { return bd[x] || 0; }).concat([1])), bars = [];
    keys.forEach(function (x) { var lb = x === 'base' ? ['Anteriores', '#c9cfdc'] : PTC[x], r = h('div', 'r'); r.style.setProperty('--cc', lb[1]); r.appendChild(h('span', null, lb[0])); var br = h('div', 'br'), bi = h('i'); br.appendChild(bi); r.appendChild(br); r.appendChild(h('b', 'tn', fmt(bd[x] || 0))); pb.appendChild(r); bars.push([bi, (bd[x] || 0) / mx * 100]); });
    gb.appendChild(pb);
    var fr = h('div', 'frm'); fr.appendChild(h('span', null, 'Últimos 5:')); var last5 = mine.slice(-5).reverse(); for (var j = 0; j < 5; j++) { var m5 = last5[j], ww = m5 && won(m5, t.id); fr.appendChild(h('i', m5 ? (ww ? 'w' : 'l') : 'e', m5 ? (ww ? 'V' : 'D') : '')); }
    fr.appendChild(h('span', null, mine.length ? ' · ' + w + 'V-' + l + 'D (' + Math.round(w / mine.length * 100) + '% de victorias)' : ' · sin partidos')); gb.appendChild(fr);
    sG.appendChild(gb); grow(bars);

    // ---------- ADN + cara a cara ----------
    var sD = h('section', 'feat two'); root.appendChild(sD);
    var c1 = h('div', 'c1'), c2 = h('div', 'c2'); sD.appendChild(c1); sD.appendChild(c2);
    function head(box, n, title, desc) { var fh = h('div', 'fh'); fh.appendChild(h('span', 'n', String(n))); fh.appendChild(h('h2', 'x', title)); box.appendChild(fh); var p = h('p', 'fd'); p.innerHTML = desc; box.appendChild(p); }
    var nsec = root.querySelectorAll('section.feat').length; head(c1, nsec, 'ADN del equipo', 'Sus fortalezas frente al resto. Elige un rival para <b>superponerlo</b>.'); head(c2, nsec + 1, 'Cara a cara', 'Cuántas veces se ganaron, con los últimos marcadores (incluye el historial).');
    var all = MAGNA.histMatches().concat(fin);
    var stat = {}; S.teams.forEach(function (x) { var ms = fin.filter(function (m) { return m.home === x.id || m.away === x.id; }), gf = 0, gc = 0; ms.forEach(function (m) { var hm = m.home === x.id; gf += hm ? m.hs : m.as; gc += hm ? m.as : m.hs; }); stat[x.id] = { n: ms.length, gf: ms.length ? gf / ms.length : 0, gc: ms.length ? gc / ms.length : 0, f: ms.slice(-5).filter(function (m) { return won(m, x.id); }).length * 20, tro: MAGNA.teamTrophies(x.id).length }; });
    var mxGf = Math.max.apply(null, S.teams.map(function (x) { return stat[x.id].gf; }).concat([.01])), mxGc = Math.max.apply(null, S.teams.map(function (x) { return stat[x.id].gc; }).concat([.01])), mxT = Math.max.apply(null, S.teams.map(function (x) { return stat[x.id].tro; }).concat([1]));
    var AX = ['Ataque', 'Defensa', 'Forma', 'Nivel', 'Vitrina'];
    function dna(tid) { var s = stat[tid] || { n: 0, gf: 0, gc: 0, f: 0, tro: 0 }; return [s.n ? 8 + 92 * s.gf / mxGf : 5, s.n ? 8 + 92 * (1 - s.gc / mxGc) : 5, Math.max(5, s.f), Math.max(5, Math.min(100, (TL.get(tid) - 850) / 3)), Math.max(5, s.tro / mxT * 100)]; }
    var rb = h('div', 'bx radar'), rv = h('select', 'sel'); rv.setAttribute('aria-label', 'Comparar con'); var o0 = h('option', null, 'Solo ' + t.name); o0.value = ''; rv.appendChild(o0);
    S.teams.filter(function (x) { return x.id !== t.id; }).forEach(function (x) { var o = h('option', null, 'vs ' + x.name); o.value = x.id; rv.appendChild(o); });
    var rd = h('div'), rl = h('div', 'rleg'); rb.appendChild(rv); rb.appendChild(rd); rb.appendChild(rl); c1.appendChild(rb);
    function drawRadar() { var W = 360, c = 180, RR = 118, vs = Number(rv.value), sets = [[t.id, tc]].concat(vs ? [[vs, MAGNA.teamColor(vs) === tc ? '#22d3ee' : MAGNA.teamColor(vs)]] : []);
      function P(i, v) { var a = -Math.PI / 2 + i * 2 * Math.PI / AX.length; return [c + Math.cos(a) * RR * v / 100, c + Math.sin(a) * RR * v / 100]; }
      var s = '<svg viewBox="0 0 ' + W + ' ' + W + '" role="img" aria-label="Radar de fortalezas">'; [25, 50, 75, 100].forEach(function (g) { s += '<polygon points="' + AX.map(function (_, i) { return P(i, g).join(','); }).join(' ') + '" fill="none" stroke="rgba(255,255,255,.14)"/>'; });
      AX.forEach(function (a, i) { var p = P(i, 100), qq = P(i, 120); s += '<line x1="' + c + '" y1="' + c + '" x2="' + p[0] + '" y2="' + p[1] + '" stroke="rgba(255,255,255,.14)"/><text x="' + qq[0] + '" y="' + (qq[1] + 4) + '" text-anchor="middle" fill="#e5e7f5" font-size="13" font-weight="700" font-family="Archivo,sans-serif">' + a + '</text>'; });
      sets.forEach(function (st) { var d = dna(st[0]); s += '<polygon class="rp" points="' + d.map(function (v, i) { return P(i, v).join(','); }).join(' ') + '" fill="' + st[1] + '" fill-opacity=".25" stroke="' + st[1] + '" stroke-width="2.5"/>'; d.forEach(function (v, i) { var p = P(i, v); s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="4.5" fill="' + st[1] + '"><title>' + esc(MAGNA.teamName(st[0])) + ' · ' + AX[i] + ': ' + Math.round(v) + '</title></circle>'; }); });
      rd.innerHTML = s + '</svg>'; if (!RM) [].forEach.call(rd.querySelectorAll('.rp'), function (p) { p.style.transformOrigin = '180px 180px'; p.animate([{ transform: 'scale(.2)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 600, easing: 'cubic-bezier(.2,.9,.2,1)' }); });
      rl.innerHTML = sets.map(function (st) { return '<span><i style="background:' + st[1] + '"></i>' + esc(MAGNA.teamName(st[0])) + '</span>'; }).join(''); }
    rv.onchange = drawRadar; drawRadar();
    var hb = h('div', 'bx'), hs = h('select', 'sel'); hs.setAttribute('aria-label', 'Rival');
    var meet = {}; all.forEach(function (m) { if (m.home === t.id && typeof m.away === 'number') meet[m.away] = (meet[m.away] || 0) + 1; else if (m.away === t.id && typeof m.home === 'number') meet[m.home] = (meet[m.home] || 0) + 1; });
    var rivals = S.teams.filter(function (x) { return x.id !== t.id; }).sort(function (a, b) { return (meet[b.id] || 0) - (meet[a.id] || 0) || a.name.localeCompare(b.name); });
    rivals.forEach(function (x) { var o = h('option', null, t.name + ' vs ' + x.name + (meet[x.id] ? ' (' + meet[x.id] + ')' : '')); o.value = x.id; hs.appendChild(o); });
    var hd = h('div'); hb.appendChild(hs); hb.appendChild(hd); c2.appendChild(hb);
    function drawH2H() { hd.innerHTML = ''; var op = Number(hs.value); if (!op) { hd.appendChild(h('p', 'em', 'No hay otros equipos.')); return; }
      var ms = all.filter(function (m) { return (m.home === t.id && m.away === op) || (m.home === op && m.away === t.id); }).sort(byTime), ww = ms.filter(function (m) { return won(m, t.id); }).length, ll = ms.length - ww, oc = MAGNA.teamColor(op) === tc ? '#22d3ee' : MAGNA.teamColor(op);
      var g = h('div', 'h2h'), a = h('div'); a.appendChild(crest(t.id, 54)); a.appendChild(h('b', 'big tn', String(ww))); a.appendChild(h('small', null, t.name)); g.appendChild(a);
      g.appendChild(h('small', null, ms.length + (ms.length === 1 ? ' partido' : ' partidos'))); var b2 = h('div'), ol = h('a'); ol.href = link(op); ol.appendChild(crest(op, 54)); b2.appendChild(ol); b2.appendChild(h('b', 'big tn', String(ll))); b2.appendChild(h('small', null, MAGNA.teamName(op))); g.appendChild(b2); hd.appendChild(g);
      var bar = h('div', 'wl'), i1 = h('i'), i2 = h('i'); i1.style.background = tc; i2.style.background = oc; bar.appendChild(i1); bar.appendChild(i2); hd.appendChild(bar);
      var ls = h('div', 'last'); if (!ms.length) ls.appendChild(h('span', 'em', 'Todavía no se han enfrentado.')); ms.slice(-6).reverse().forEach(function (m) { var s = h('span', null, (won(m, t.id) ? 'V ' : 'D ') + sc(m, t.id) + (m.hist ? ' · hist.' : '')); s.style.setProperty('--c', won(m, t.id) ? 'var(--green)' : 'var(--red)'); ls.appendChild(s); }); hd.appendChild(ls);
      if (ms.length) grow([[i1, ww / ms.length * 100], [i2, ll / ms.length * 100]]); }
    hs.onchange = drawH2H; drawH2H();

    // ---------- rendimiento por modo ----------
    var MD = {}; mine.forEach(function (m) { (m.sets || []).forEach(function (x) { if (!x.mode || !x.w) return; var o = MD[x.mode] || (MD[x.mode] = { w: 0, n: 0, maps: {} }); o.n++; if ((x.w === 'h') === (m.home === t.id)) o.w++; if (x.map) o.maps[x.map] = (o.maps[x.map] || 0) + 1; }); });
    var sM = feat('Rendimiento por modo', 'Porcentaje de <b>sets ganados</b> en cada modo de Brawl Stars. Toca un modo para ver en qué mapas lo jugó.'), mb = h('div', 'bx'), mbars = [];
    var mk = Object.keys(MD).sort(function (a, b) { return MD[b].w / MD[b].n - MD[a].w / MD[a].n || MD[b].n - MD[a].n; });
    if (!mk.length) mb.appendChild(h('p', 'em', 'Aún no hay sets registrados con modo de juego. Aparecen al cargar los sets de cada partido.'));
    mk.forEach(function (k2) { var o = MD[k2], r = h('button', 'mrw'), pc = Math.round(o.w / o.n * 100); r.type = 'button'; r.setAttribute('aria-expanded', 'false'); r.style.setProperty('--mc', MAGNA.MODE_COLOR[k2] || '#8b5cf6'); r.appendChild(h('b', null, k2)); var br = h('span', 'br'), bi = h('i'); br.appendChild(bi); r.appendChild(br); r.appendChild(h('span', 'p', pc + '% · ' + o.w + '/' + o.n));
      var mp = h('div', 'maps'); mp.hidden = true; Object.keys(o.maps).sort(function (a, b) { return o.maps[b] - o.maps[a]; }).forEach(function (x) { mp.appendChild(h('span', null, '🗺️ ' + x + ' ×' + o.maps[x])); }); if (!mp.children.length) mp.appendChild(h('span', null, 'Sin mapa registrado'));
      r.onclick = function () { var op2 = mp.hidden; mp.hidden = !op2; r.setAttribute('aria-expanded', op2); }; mb.appendChild(r); mb.appendChild(mp); mbars.push([bi, pc]); });
    sM.appendChild(mb); grow(mbars);

    // ---------- vitrina que gira ----------
    var sV = feat('Vitrina', tro.length ? 'Filtra por tipo y <b>toca un trofeo</b> para darle la vuelta y ver cómo se ganó.' : null);
    if (!tro.length) { var ve = h('div', 'bx vempty'); ve.appendChild(h('span', null, '🏆')); ve.appendChild(document.createTextNode('Todavía no hay trofeos. Cada título que gane ' + t.name + ' aparecerá aquí automáticamente.')); sV.appendChild(ve); }
    else {
      var tf = h('div', 'chips2'), shelf = h('div', 'shelf'), cats = ['all'].concat(MAGNA.TROPHY_CATS.map(function (c) { return c[0]; }).filter(function (c) { return tro.some(function (x) { return x.cat === c; }); }));
      cats.forEach(function (c, ix) { var n = c === 'all' ? tro.length : tro.filter(function (x) { return x.cat === c; }).length, b = h('button', 'chip2', (c === 'all' ? 'Todos' : (MAGNA.TROPHY_ICON[c] || '🏆') + ' ' + (CATN[c] || c)) + ' · ' + n); b.type = 'button'; b.setAttribute('aria-pressed', !ix);
        b.onclick = function () { [].forEach.call(tf.children, function (x) { x.setAttribute('aria-pressed', x === b); }); [].forEach.call(shelf.children, function (x) { x.classList.toggle('hide', c !== 'all' && x.dataset.c !== c); }); }; tf.appendChild(b); });
      if (cats.length > 2) sV.appendChild(tf);
      // las ediciones del mismo torneo se agrupan en un solo trofeo con contador (×N)
      MAGNA.groupTrophies(tro).sort(function (a, c) { return MAGNA.trophyOrd(a.name, a.cat) - MAGNA.trophyOrd(c.name, c.cat); }).forEach(function (g, ix) { var x = g.items[0], art = MAGNA.trophyArt(g.name, g.cat), b = h('button', 'tro' + (g.n > 1 ? ' multi' : '') + (art ? ' art' : '')); b.type = 'button'; b.dataset.c = g.cat; b.style.setProperty('--cc', CATC[g.cat] || '#ffd23f'); b.style.animationDelay = Math.min(ix, 12) * 60 + 'ms'; b.setAttribute('aria-label', g.name + (g.n > 1 ? ', ' + g.n + ' veces campeón' : '') + ', toca para ver detalles');
        var f = h('div', 'fr'); f.appendChild(art ? M.trophyImg(g.name, g.cat, 128) : h('span', null, MAGNA.TROPHY_ICON[g.cat] || '🏆')); if (g.n > 1) f.appendChild(h('em', 'cnt', '×' + g.n)); f.appendChild(h('b', null, g.name));
        var yrs = g.items.map(function (y) { return y.season; }).filter(Boolean); f.appendChild(h('small', null, (CATN[g.cat] || 'Trofeo') + (yrs.length ? ' · ' + yrs.slice(0, 3).join(', ') + (yrs.length > 3 ? '…' : '') : ''))); b.appendChild(f);
        var bk = h('div', 'bk'); bk.appendChild(h('b', null, g.n > 1 ? g.name + ' · ' + g.n + ' títulos' : g.name));
        if (g.n > 1) g.items.slice(0, 5).forEach(function (y) { var ed = MAGNA.editionNo(y.name); var rn = !ed && MAGNA.romanNo(y.season); bk.appendChild(h('div', null, '🏆 ' + (ed ? 'Edición ' + MAGNA.toRoman(ed) + (y.season && !MAGNA.romanNo(y.season) ? ' · ' + y.season : '') : rn ? 'Edición ' + MAGNA.toRoman(rn) : (y.season ? 'Temporada ' + y.season : 'Edición')))); });
        else trophyInfo(x, t.id).forEach(function (line) { bk.appendChild(h('div', null, line)); });
        if (g.n > 5) bk.appendChild(h('div', null, '…y ' + (g.n - 5) + ' más')); bk.appendChild(h('small', 'em', 'Toca para volver')); b.appendChild(bk);
        b.onclick = function () { b.classList.toggle('f'); }; shelf.appendChild(b); });
      sV.appendChild(shelf);
    }

    // ---------- plantilla en cartas ----------
    var sQ = feat('Plantilla', 'Cada jugador es una carta de su nivel. <b>Tócala para voltearla</b> y ver sus números.'), grid = h('div', 'squad');
    if (!squad.length) grid.appendChild(h('p', 'em', 'Este equipo todavía no tiene jugadores.'));
    squad.forEach(function (p) { var x = PS[p.id] || {}, md = media(p), tr = MAGNA.tierOf(md), b = h('button', 'pcd'); b.type = 'button'; b.id = 'pc-' + p.id; b.style.setProperty('--t1', tr.color); b.style.setProperty('--t2', shade(tr.color, -110)); b.setAttribute('aria-label', p.name + ', media ' + md + ', toca para ver sus números');
      var f = h('div', 'fr' + (tr.id === 'elite' ? ' elite' : '')); f.appendChild(h('span', 'mv', String(md))); f.appendChild(h('span', 'tl', tr.name)); f.appendChild(M.photo(h('span', 'ini', p.name.slice(0, 2).toUpperCase()), p.id)); var nm0 = M.pn(p.name, p.id, { plain: true }); nm0.classList.add('nm'); f.appendChild(nm0); f.appendChild(h('span', 'rl', (p.slot === 'reserve' ? 'Suplente' : 'Titular') + (t.coach === p.id ? ' · DT' : ''))); b.appendChild(f);
      var bk = h('div', 'bk'); bk.appendChild(h('div', 't', p.name)); [[x.pj || 0, 'Partidos'], [(x.w || 0) + '-' + (x.l || 0), 'V-D'], [x.g || 0, 'Goles'], [x.mvp || 0, 'MVP'], [(x.titles || []).length, 'Trofeos'], [x.nota != null ? Number(x.nota).toFixed(1) : '—', 'Nota']].forEach(function (v) { var d = h('div'); d.appendChild(h('b', null, String(v[0]))); d.appendChild(h('small', null, v[1])); bk.appendChild(d); }); var go = h('span', 'pf-go', 'Ver perfil →'); bk.appendChild(go); b.appendChild(bk);
      b.onclick = function (e) { if (e.target.closest && e.target.closest('.pf-go')) { location.href = M.profileUrl(p.id); return; } b.classList.toggle('f'); }; grid.appendChild(b); });
    sQ.appendChild(grid); if (squad.length) sQ.appendChild(h('p', 'hint', 'Toca otra vez para volver al frente.'));
    if (coach && !MAGNA.plays(coach)) { var cp2 = h('p', 'hint', 'DT: '), ca = h('a', null, coach.name); ca.href = M.profileUrl(coach.id); ca.style.color = 'inherit'; ca.style.fontWeight = '800'; cp2.appendChild(ca); cp2.appendChild(document.createTextNode(' (solo coach).')); sQ.appendChild(cp2); }

    // ---------- partidos ----------
    function mrow(m) {
      var hm = m.home === t.id, op = hm ? m.away : m.home, c = MAGNA.compOf(m), r = h('div', 'mrow');
      var oc = h('a'); oc.href = link(op); oc.appendChild(crest(op, 40)); oc.title = MAGNA.teamName(op); r.appendChild(oc);
      var tx = h('div'); tx.appendChild(h('b', null, 'vs ' + MAGNA.teamName(op)));
      tx.appendChild(h('small', null, (hm ? 'Local' : 'Visitante') + ' · ' + (c ? c.name : '—') + (m.round ? ' · ' + m.round : '') + (m.at ? ' · ' + M.fdt(m.at) : '')));
      if (m.sets && m.sets.length) { var st = h('div', 'sets'); m.sets.forEach(function (x, k3) { var s = h('span', null, 'S' + (k3 + 1) + ' ' + (x.mode || '?') + (x.w ? (x.w === (hm ? 'h' : 'a') ? ' ✓' : ' ✗') : '')); s.style.setProperty('--mc', MAGNA.MODE_COLOR[x.mode] || '#555b75'); st.appendChild(s); }); tx.appendChild(st); }
      r.appendChild(tx); var s2 = h('div', 'sc');
      if (m.status === 'finished') { var f = hm ? m.hs : m.as, a = hm ? m.as : m.hs; s2.appendChild(h('b', null, f + ' - ' + a)); s2.appendChild(h('span', 'res ' + (f > a ? 'w' : 'l'), f > a ? 'V' : 'D')); }
      else if (m.status === 'live') s2.appendChild(h('span', 'lvb', '● ' + (hm ? m.hs || 0 : m.as || 0) + ' - ' + (hm ? m.as || 0 : m.hs || 0)));
      else s2.appendChild(h('small', null, 'Próximo'));
      r.appendChild(s2); return r;
    }
    var up = S.matches.filter(function (m) { return (m.status === 'live' || m.status === 'scheduled') && (m.home === t.id || m.away === t.id); }).sort(function (a, b) { return (b.status === 'live') - (a.status === 'live') || String(a.at || '9').localeCompare(String(b.at || '9')); }).slice(0, 5);
    var sP = feat('Partidos'), pw = h('div', 'two'), p1 = h('div', 'bx'), p2 = h('div', 'bx');
    p1.appendChild(h('h3', 'mh', 'Próximos')); var l1 = h('div', 'mlst'); if (!up.length) l1.appendChild(h('p', 'em', 'No tiene partidos programados.')); up.forEach(function (m) { l1.appendChild(mrow(m)); }); p1.appendChild(l1);
    p2.appendChild(h('h3', 'mh', 'Últimos resultados')); var l2 = h('div', 'mlst'); if (!mine.length) l2.appendChild(h('p', 'em', 'Todavía no hay resultados.')); mine.slice(-6).reverse().forEach(function (m) { l2.appendChild(mrow(m)); }); p2.appendChild(l2);
    pw.appendChild(p1); pw.appendChild(p2); sP.appendChild(pw);

    // ---------- competiciones ----------
    if (comps.length) { var sC = feat('Competiciones'), cl = h('div', 'cmpl');
      comps.forEach(function (x) { var a = h('a'); a.href = x.k === 'league' ? 'ligas.html' : x.c.format === 'groups_knockout' ? 'mundial.html' : x.c.format === 'champions' ? 'champions.html?t=' + x.c.id : 'competiciones.html'; var tx = h('div'); tx.appendChild(h('b', null, x.c.name)); var info = x.k === 'league' ? 'Liga' : 'Torneo', posTxt = '';
        if (x.k === 'league') { var rows = MAGNA.standings(Object.assign({ kind: 'league' }, x.c)), me2 = rows.filter(function (y) { return y.team_id === t.id; })[0]; if (me2) { posTxt = '#' + me2.pos; info += ' · ' + me2.pts + ' pts · ' + me2.pj + ' PJ'; } }
        else if (x.c.state && x.c.state.champion === t.id) posTxt = '🏆';
        info += x.c.status === 'finished' ? ' · Finalizada' : x.c.status === 'active' ? ' · En juego' : '';
        tx.appendChild(h('small', null, info)); a.appendChild(tx); a.appendChild(h('span', 'pos', posTxt || '›')); cl.appendChild(a); });
      sC.appendChild(cl); }

    // ---------- otros equipos ----------
    var oth = S.teams.filter(function (x) { return x.id !== t.id; });
    if (oth.length) { var sO = feat('Otros equipos'), olist = h('div', 'others'); oth.forEach(function (x) { var a = h('a'); a.href = link(x.id); a.appendChild(crest(x.id, 32)); a.appendChild(document.createTextNode(x.name)); olist.appendChild(a); }); sO.appendChild(olist); }
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function showCard(pid) { var c = document.getElementById('pc-' + pid); if (!c) return; c.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' }); c.classList.add('hl'); setTimeout(function () { c.classList.add('f'); }, RM ? 0 : 450); setTimeout(function () { c.classList.remove('hl'); }, 2200); }
  // Reverso del trofeo: cómo se ganó.
  function trophyInfo(x, tid) {
    if (x.auto === 'tournament') { var c = S.tournaments.filter(function (y) { return y.name === x.name && y.state && y.state.champion === tid; })[0], fm = c && S.matches.filter(function (m) { return m.type === 'tournament' && m.cid === c.id && m.round === 'Final' && m.status === 'finished'; })[0];
      if (fm) { var op = fm.home === tid ? fm.away : fm.home; return ['Final: ' + (fm.home === tid ? fm.hs + '-' + fm.as : fm.as + '-' + fm.hs) + ' vs ' + MAGNA.teamName(op), fm.live && fm.live.mvp ? 'MVP: ' + (MAGNA.playerName(fm.live.mvp) || '—') : 'Campeón del torneo']; } return ['Campeón del torneo']; }
    if (x.auto === 'league') { var lg = S.leagues.filter(function (y) { return y.name === x.name; })[0], r = lg && MAGNA.standings(Object.assign({ kind: 'league' }, lg))[0]; return r ? ['Campeón con ' + r.pts + ' puntos', 'Récord ' + r.g + 'V-' + r.p + 'D'] : ['Campeón de liga']; }
    if (x.auto === 'history') { var e = (S.history || []).filter(function (y) { return y.id === x.hist; })[0], fz = e && (e.matches || []).slice(-1)[0]; return fz ? ['Final: ' + fz.home + ' ' + fz.hs + '-' + fz.as + ' ' + fz.away, 'Del historial'] : ['Del historial']; }
    return ['Título registrado', x.season ? 'Temporada ' + x.season : ''];
  }
  // Gráfica de línea con puntero.
  function lineChart(box, v, col, f, tip) {
    var bw = box.clientWidth; box.innerHTML = ''; var sm = bw && bw < 600, W = sm ? 420 : 900, H = sm ? 300 : 300, L = sm ? 50 : 64, Rr = 18, T = 18, B = 34, mn = Math.min.apply(null, v), mx = Math.max.apply(null, v); if (mx === mn) { mx = mn + 1; } var pad = (mx - mn) * .08; mn = Math.max(0, mn - pad); mx += pad; var n = v.length;
    function X(i) { return n === 1 ? (L + W - Rr) / 2 : L + i * (W - L - Rr) / (n - 1); } function Y(x) { return T + (H - T - B) * (1 - (x - mn) / (mx - mn)); }
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Evolución de la temporada">'; for (var g = 0; g <= 4; g++) { var gv = mn + (mx - mn) * g / 4, y = Y(gv); s += '<line x1="' + L + '" x2="' + (W - Rr) + '" y1="' + y + '" y2="' + y + '" stroke="rgba(255,255,255,.1)"/><text x="' + (L - 8) + '" y="' + (y + 4) + '" text-anchor="end" fill="#c9cde0" font-size="12" font-family="JetBrains Mono,monospace">' + (f ? f(gv) : Math.round(gv)) + '</text>'; }
    var step = Math.max(1, Math.ceil(n / (sm ? 6 : 12))); for (var i = 0; i < n; i += step) s += '<text x="' + X(i) + '" y="' + (H - 10) + '" text-anchor="middle" fill="#c9cde0" font-size="11" font-family="JetBrains Mono,monospace">' + (i ? 'P' + i : 'Inicio') + '</text>';
    var d = v.map(function (x, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(x).toFixed(1); }).join(' ');
    s += '<path d="' + d + ' L' + X(n - 1) + ' ' + Y(mn) + ' L' + X(0) + ' ' + Y(mn) + 'Z" fill="' + col + '" opacity=".18"/><path class="ln" d="' + d + '" fill="none" stroke="' + col + '" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/><circle cx="' + X(n - 1) + '" cy="' + Y(v[n - 1]) + '" r="6" fill="' + col + '" stroke="#0a0d18" stroke-width="2"/>';
    s += '<line class="cur" y1="' + T + '" y2="' + (H - B) + '" stroke="#ffd23f" stroke-dasharray="4 4" opacity="0"/><circle class="dot" r="7" fill="' + col + '" stroke="#fff" stroke-width="2" opacity="0"/><rect class="hit" x="' + (L - 20) + '" y="0" width="' + (W - L - Rr + 40) + '" height="' + H + '" fill="transparent"/></svg>';
    box.innerHTML = s; var tp = h('div', 'tip'); box.appendChild(tp); var svg = box.firstChild, hit = svg.querySelector('.hit'), cur = svg.querySelector('.cur'), dot = svg.querySelector('.dot');
    var ln = svg.querySelector('.ln'); if (!RM && ln.getTotalLength) { var Ln = ln.getTotalLength(); ln.style.strokeDasharray = Ln; ln.style.strokeDashoffset = Ln; ln.getBoundingClientRect(); ln.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(.2,.9,.2,1)'; ln.style.strokeDashoffset = 0; }
    function mv(e) { var r = svg.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W, i = n === 1 ? 0 : Math.max(0, Math.min(n - 1, Math.round((x - L) / ((W - L - Rr) / (n - 1))))); cur.setAttribute('x1', X(i)); cur.setAttribute('x2', X(i)); cur.setAttribute('opacity', 1); dot.setAttribute('cx', X(i)); dot.setAttribute('cy', Y(v[i])); dot.setAttribute('opacity', 1);
      tp.innerHTML = tip(i); var px = X(i) / W * r.width; tp.style.left = Math.max(90, Math.min(r.width - 90, px)) + 'px'; tp.style.top = Y(v[i]) / H * r.height + 'px'; tp.style.opacity = 1; }
    hit.addEventListener('pointermove', mv); hit.addEventListener('pointerdown', mv); hit.addEventListener('pointerleave', function () { cur.setAttribute('opacity', 0); dot.setAttribute('opacity', 0); tp.style.opacity = 0; });
  }
  // ---------- pestañas: menos scroll, todo a mano ----------
  var ETAB = (/^#(cancha|temporada|vitrina|partidos|rivales)$/.exec(location.hash) || [])[1] || 'cancha';
  var TABS = [['cancha', 'Cancha', /Alineaci|Plantilla/], ['temporada', 'Temporada', /Temporada|Rendimiento/], ['vitrina', 'Vitrina', /Vitrina/], ['partidos', 'Partidos', /Partidos|Competiciones/], ['rivales', 'Rivales', /ADN|Cara a cara|Otros equipos/]];
  function tabify() { var hero = root.querySelector('.tq'); if (!hero) return; var secs = [].slice.call(root.children).filter(function (x) { return x !== hero && x.tagName === 'SECTION'; }); if (!secs.length) return;
    var wrap = hero.querySelector('.tq-tabs'), body = hero.querySelector('.tq-bd'), box = hero.querySelector('.tq-box'), groups = {}, C = hero._cnt || {};
    var CN = { cancha: C.squad, vitrina: C.tro, partidos: C.games };
    secs.forEach(function (sx) { var tt = (sx.querySelector('h2') || {}).textContent || '', g = TABS.filter(function (x) { return x[2].test(tt); })[0]; var id = g ? g[0] : 'cancha'; (groups[id] = groups[id] || []).push(sx); sx.dataset.tab = id; body.appendChild(sx); });
    if (!groups[ETAB]) ETAB = Object.keys(groups)[0];
    TABS.forEach(function (x) { if (!groups[x[0]]) return; var b = h('button', 'tq-tab' + (x[0] === ETAB ? ' on' : '')); b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', x[0] === ETAB); b.appendChild(document.createTextNode(x[1])); if (CN[x[0]]) b.appendChild(h('small', null, String(CN[x[0]])));
      b.onclick = function () { if (ETAB === x[0]) return; ETAB = x[0]; try { history.replaceState(null, '', '#' + ETAB); } catch (e) {} show(); [].forEach.call(wrap.children, function (c) { c.classList.toggle('on', c === b); c.setAttribute('aria-selected', c === b); }); b.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' }); var y = wrap.getBoundingClientRect().top + window.scrollY - 90; if (window.scrollY > y) window.scrollTo({ top: y, behavior: 'smooth' }); }; wrap.appendChild(b); });
    function show() { box.id = ETAB; secs.forEach(function (sx) { var on = sx.dataset.tab === ETAB; sx.hidden = !on; if (on) { sx.classList.remove('tq-in'); void sx.offsetWidth; sx.classList.add('tq-in'); } }); window.dispatchEvent(new Event('resize')); }
    show(); }
  document.addEventListener('click', function () { var o = document.querySelector('.tq-pop.on'); if (o) { o.classList.remove('on'); var f = o.querySelector('.tq-xp i'); if (f) f.style.width = '0'; } });
  function draw() { render(); tabify(); }
  draw();
  window.addEventListener('magna:update', draw);
})();
