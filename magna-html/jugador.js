'use strict';
// Perfil público de un jugador: cosméticos, estadísticas, vitrina, insignias, inventario y últimos partidos.
// Sin ?id= muestra el directorio de jugadores con buscador.
(function () {
  var h = M.h, root = document.getElementById('jp'), prof = null, items = null, meAcc = null, q = '';
  function S() { return MAGNA.S; }
  function qs(k) { var m = new RegExp('[?&]' + k + '=([^&#]*)').exec(location.search); return m ? decodeURIComponent(m[1]) : null; }
  function sb() { return window.MAGNA_SB ? window.MAGNA_SB() : Promise.reject(new Error('Sin conexión')); }
  function fmt(n) { return String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function pid() { var v = Number(qs('id')); return isFinite(v) && v > 0 ? v : null; }
  function teamIdx(id) { for (var i = 0; i < S().teams.length; i++) if (S().teams[i].id === id) return i; return 0; }
  function ntCls(r) { return r == null ? '' : r >= 8 ? ' hi' : r >= 6 ? ' md' : ' lo'; }

  function directory() {
    document.title = 'Magna Arena · Jugadores'; document.body.classList.remove('pfp');
    root.innerHTML = ''; var top = h('div', 'jp-dir-top'); top.appendChild(h('h1', 'x', 'Jugadores'));
    var inp = h('input', 'jp-q'); inp.type = 'search'; inp.placeholder = 'Buscar jugador o equipo…'; inp.value = q; inp.setAttribute('aria-label', 'Buscar jugador'); top.appendChild(inp); root.appendChild(top);
    var grid = h('div', 'jp-dir'); root.appendChild(grid); var PS = MAGNA.playerStats();
    function draw() { grid.innerHTML = ''; var k = q.trim().toLowerCase();
      var L = S().players.filter(function (p) { var tn = p.teamId ? MAGNA.teamName(p.teamId) : ''; return !k || p.name.toLowerCase().indexOf(k) >= 0 || tn.toLowerCase().indexOf(k) >= 0; })
        .sort(function (a, b) { return ((PS[b.id] || {}).media || 0) - ((PS[a.id] || {}).media || 0) || a.name.localeCompare(b.name); });
      if (!L.length) { grid.appendChild(h('div', 'jp-emp', 'No hay jugadores con ese nombre.')); return; }
      L.forEach(function (p) { var x = PS[p.id] || {}, a = h('a', 'jd'); a.href = M.profileUrl(p.id); a.appendChild(M.tierAv(p.name, x.media, 46, p.id)); var d = h('div'); d.appendChild(M.pn(p.name, p.id, { plain: true }));
        d.appendChild(h('small', null, (MAGNA.roleOf(p) === 'coach' ? 'DT · ' : '') + (p.teamId ? MAGNA.teamName(p.teamId) : 'Agente libre') + ' · Media ' + (x.media == null ? '—' : x.media))); a.appendChild(d); grid.appendChild(a); }); }
    inp.oninput = function () { q = inp.value; draw(); }; draw();
  }

  // ---------- perfil: tarjeta con portada, avatar, botones cuadrados y una caja con pestañas ----------
  var TAB = (/^#(resumen|vitrina|insignias|partidos|inventario)$/.exec(location.hash) || [])[1] || 'resumen';
  var MASC = ['celebrando', 'trofeo', 'salto', 'pulgar-arriba', 'dab', 'jugando', 'senalando', 'brazos-cruzados', 'de-pie'];
  var ICON = {
    card: '<path d="M4 5h16v14H4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M4 15l4-4 4 4 3-3 5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="15.5" cy="8.5" r="1.5" fill="currentColor"/>',
    team: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 12l2 2 4-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    link: '<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    paint: '<path d="M12 3a9 9 0 100 18c1.5 0 2-1 2-2 0-1.5-1.5-1.5-1.5-3S14 14 15.5 14H18a3 3 0 003-3c0-4.4-4-8-9-8z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="7.5" cy="11" r="1.3" fill="currentColor"/><circle cx="10" cy="7" r="1.3" fill="currentColor"/><circle cx="15" cy="7" r="1.3" fill="currentColor"/>',
    back: '<path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>' };
  function svg(k) { return '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">' + ICON[k] + '</svg>'; }
  function sqBtn(icon, label, fn, href) { var b = h(href ? 'a' : 'button', 'pf-sq'); if (href) b.href = href; else b.type = 'button'; b.innerHTML = svg(icon); b.appendChild(h('span', 'tp', label)); b.setAttribute('aria-label', label); if (fn) b.onclick = fn; return b; }
  function render() {
    var id = pid(), p = id != null ? MAGNA.by(S().players, id) : null; if (!p) return directory();
    var PS = MAGNA.playerStats(), x = PS[p.id] || {}, t = p.teamId ? MAGNA.by(S().teams, p.teamId) : null, coachOf = S().teams.filter(function (tm) { return tm.coach === p.id; })[0];
    document.title = 'Magna Arena · ' + p.name; root.innerHTML = ''; document.body.classList.add('pfp');
    var eq = (prof && prof.equipped) || M.eqOf(p.id), mine = meAcc && meAcc.player_id === p.id;
    var tr = MAGNA.tierOf(x.media), tm = t || coachOf, tcol = tm ? MAGNA.teamColor(tm.id) : '#ffb961', bo = MAGNA.ballonCount(p.id), cur = x.media == null ? 10 : x.media;
    var card = h('section', 'pf'); card.style.setProperty('--tc', tcol); card.style.setProperty('--tr', tr.color);
    // portada
    var bn = h('div', 'pf-bn'), mi = h('img', 'pf-ms'); mi.src = 'mascota/' + MASC[p.id % MASC.length] + '.webp'; mi.alt = ''; mi.decoding = 'async'; bn.appendChild(mi);
    for (var k = 0; k < 7; k++) { var lf = h('i', 'pf-lf'); lf.style.left = (8 + k * 13) + '%'; lf.style.animationDelay = (k * .9) + 's'; lf.style.animationDuration = (6 + (k % 3) * 1.5) + 's'; bn.appendChild(lf); }
    var top = h('div', 'pf-top'), bk = h('a', 'pf-bk'); bk.href = 'jugador.html'; bk.innerHTML = svg('back'); bk.appendChild(h('span', null, 'Jugadores')); top.appendChild(bk); top.appendChild(h('span', 'sp'));
    if (prof) { var bt = h('span', 'pf-cur'); bt.title = 'Bits'; bt.appendChild(MAGNA_BIT(20)); bt.appendChild(h('b', null, fmt(prof.bits))); top.appendChild(bt); }
    if (bo) { var bb = h('span', 'pf-cur'); bb.title = bo > 1 ? bo + ' Balones de Oro' : 'Balón de Oro'; bb.appendChild(M.trophyImg('Balón de Oro', null, 20, '')); bb.appendChild(h('b', null, '×' + bo)); top.appendChild(bb); }
    bn.appendChild(top);
    var nm = h('div', 'pf-nm'); if (tm) nm.appendChild(M.crest(tm.id, tm.name, 30)); var pn = M.pn(p.name, p.id, { plain: true, title: true });
    if (prof) { M.nameStyle(pn, eq); var ti = eq.title && M.item(eq.title), old = pn.querySelector('.mpn-t'); if (old) old.remove(); if (ti && ti.type === 'title') pn.appendChild(h('small', 'mpn-t tr-' + (ti.rarity || 'comun'), ti.name)); pn.removeAttribute('data-pn'); }
    nm.appendChild(pn); bn.appendChild(nm); card.appendChild(bn);
    // franja bajo la portada: avatar + insignia de media + botones cuadrados
    var mid = h('div', 'pf-mid'), av = h('div', 'pf-av'), pt = h('div', 'pf-pt'), img = M.pav(p.id) || (prof && prof.avatar && /^a\d\d$/.test(prof.avatar) ? 'avatars/' + prof.avatar + '.webp' : null);
    if (img) { var im = h('img'); im.src = img; im.alt = p.name; pt.appendChild(im); } else pt.appendChild(h('span', null, String(p.name).slice(0, 2).toUpperCase()));
    var ptw = h('div', 'pf-ptw'), eqf = eq.frame && M.item(eq.frame); if (eqf && eqf.type === 'frame') ptw.classList.add('fr-' + eqf.style); ptw.appendChild(pt); av.appendChild(ptw);
    var T = [[0, 40, 'Plata'], [40, 60, 'Oro'], [60, 80, 'Élite'], [80, 100, 'Máximo']], seg = T.filter(function (z) { return cur >= z[0] && cur < z[1]; })[0] || T[3];
    var bdg = h('button', 'pf-bdg'); bdg.type = 'button'; bdg.setAttribute('aria-label', 'Media ' + cur + ', nivel ' + tr.name); bdg.appendChild(h('b', null, String(cur)));
    var pop = h('div', 'pf-pop'); pop.appendChild(h('b', null, 'Nivel ' + tr.name)); var xb = h('div', 'pf-xp'), xf = h('i'); xb.appendChild(xf); pop.appendChild(xb); pop.appendChild(h('small', null, cur >= 80 ? '¡Nivel máximo!' : 'Faltan ' + (seg[1] - cur) + ' pts para ' + seg[2]));
    bdg.onclick = function (e) { e.stopPropagation(); var on = !pop.classList.contains('on'); pop.classList.toggle('on', on); if (on) setTimeout(function () { xf.style.width = Math.max(5, Math.round((cur - seg[0]) / (seg[1] - seg[0]) * 100)) + '%'; }, 60); };
    av.appendChild(bdg); av.appendChild(pop); mid.appendChild(av);
    var acts = h('div', 'pf-acts');
    if (window.SHARE_CARD) acts.appendChild(sqBtn('card', 'Tarjeta para compartir', function () { SHARE_CARD.open('player', function () { var G2 = MAGNA.groupTrophies((x.titles || []).map(function (n2) { return { name: n2 }; })).sort(function (a, b) { return MAGNA.trophyOrd(a.name) - MAGNA.trophyOrd(b.name); });
      var TT = (bo ? [{ name: 'Balón de Oro', n: bo, art: MAGNA.trophyArt('Balón de Oro'), emoji: '🥇' }] : []).concat(G2.map(function (g) { return { name: g.name, n: g.n, art: MAGNA.trophyArt(g.name), emoji: '🏆' }; }));
      return { name: p.name, team: tm ? tm.name : null, role: MAGNA.roleOf(p) === 'coach' ? 'DT' : null, avatar: M.pav(p.id), media: x.media, tier: tr, ballon: bo, stats: [[x.media == null ? '—' : x.media, 'Media'], [x.pj || 0, 'Partidos'], [x.g || 0, 'Goles'], [x.mvp || 0, 'MVP'], [(x.titles || []).length + bo, 'Títulos']], trophies: TT }; }); }));
    if (tm) acts.appendChild(sqBtn('team', 'Ver ' + tm.name, null, 'equipo.html?id=' + tm.id));
    acts.appendChild(sqBtn('link', 'Copiar enlace', function (e) { var b = e.currentTarget, u = location.href; (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(function () { b.classList.add('ok'); b.querySelector('.tp').textContent = '¡Copiado!'; setTimeout(function () { b.classList.remove('ok'); b.querySelector('.tp').textContent = 'Copiar enlace'; }, 1600); }, function () { prompt('Copia el enlace:', u); }); }));
    if (mine) acts.appendChild(sqBtn('paint', 'Personalizar', null, 'cuenta.html#inventario'));
    mid.appendChild(acts); card.appendChild(mid);
    // panel
    var pnl = h('div', 'pf-pn'), row = h('div', 'pf-row'), idb = h('div', 'pf-id');
    idb.appendChild(h('b', null, (MAGNA.roleOf(p) === 'coach' ? 'Director técnico' : MAGNA.roleOf(p) === 'both' ? 'Jugador y DT' : 'Jugador') + (tm ? ' · ' + (coachOf && !t ? 'DT de ' : '') + tm.name : ' · Agente libre')));
    idb.appendChild(h('small', null, prof && prof.member_since ? 'En Magna desde ' + new Date(prof.member_since).toLocaleDateString('es', { month: 'long', year: 'numeric' }) : 'Magna Sports'));
    row.appendChild(idb); var chip = h('div', 'pf-chip'); chip.appendChild(h('span', null, 'MEDIA ' + cur)); var c2 = h('span', null, tr.name.toUpperCase()); c2.style.setProperty('--c', tr.color); chip.appendChild(c2); row.appendChild(chip); pnl.appendChild(row);
    pnl.appendChild(h('hr'));
    var B = MAGNA.playerBadges(p.id), got = B.filter(function (b) { return b.ok; }).length, G = MAGNA.playerGames(p.id), nTro = (x.titles || []).length + bo;
    var TABS = [['resumen', 'Resumen', null], ['vitrina', 'Vitrina', nTro], ['insignias', 'Insignias', got + '/' + B.length], ['partidos', 'Partidos', G.length || null], ['inventario', 'Inventario', items ? items.length : null]];
    var tabs = h('div', 'pf-tabs'); tabs.setAttribute('role', 'tablist'); var box = h('div', 'pf-box'); box.id = TAB; box.setAttribute('role', 'tabpanel');
    if (tm) { var wm = h('div', 'pf-wm'); wm.appendChild(M.crest(tm.id, tm.name, 220)); box.appendChild(wm); }
    var body = h('div', 'pf-bd'); box.appendChild(body);
    TABS.forEach(function (tb) { var b = h('button', 'pf-tab' + (tb[0] === TAB ? ' on' : '')); b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', tb[0] === TAB); b.appendChild(document.createTextNode(tb[1])); if (tb[2] != null && tb[2] !== 0) b.appendChild(h('small', null, String(tb[2])));
      b.onclick = function () { if (TAB === tb[0]) return; TAB = tb[0]; [].forEach.call(tabs.children, function (c) { c.classList.toggle('on', c === b); c.setAttribute('aria-selected', c === b); }); box.id = TAB; try { history.replaceState(null, '', '#' + TAB); } catch (e) {} fill(); }; tabs.appendChild(b); });
    function fill() { body.innerHTML = ''; body.classList.remove('in'); void body.offsetWidth; body.classList.add('in');
      if (TAB === 'resumen') resumen(body, p, x, eq, mine, G); else if (TAB === 'vitrina') vitrina(body, p, x); else if (TAB === 'insignias') insignias(body, B, got); else if (TAB === 'partidos') partidos(body, G); else inventario(body, p, eq, mine); }
    pnl.appendChild(tabs); pnl.appendChild(box); card.appendChild(pnl); root.appendChild(card); fill();
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) { av.addEventListener('mousemove', function (e) { var r2 = av.getBoundingClientRect(), dx = (e.clientX - r2.left) / r2.width - .5, dy = (e.clientY - r2.top) / r2.height - .5; pt.style.transform = 'rotateY(' + (dx * 16).toFixed(1) + 'deg) rotateX(' + (-dy * 16).toFixed(1) + 'deg) scale(1.03)'; }); av.addEventListener('mouseleave', function () { pt.style.transform = ''; }); }
  }
  function resumen(c, p, x, eq, mine, G) {
    var nota = x.rated ? String(Math.round(x.sum / x.rated * 10) / 10).replace('.', ',') : '—', pct = x.pj ? Math.round(x.w / x.pj * 100) : 0, bo = MAGNA.ballonCount(p.id);
    var st = h('div', 'pf-st'); [['Partidos', x.pj || 0], ['Victorias', (x.w || 0) + ' · ' + pct + '%'], ['Goles', x.g || 0], ['MVP', x.mvp || 0], ['Nota media', nota], ['Títulos', (x.titles || []).length + bo]].forEach(function (r, i) { var d = h('div'); d.style.animationDelay = i * 50 + 'ms'; d.appendChild(h('b', null, String(r[1]))); d.appendChild(h('small', null, r[0])); st.appendChild(d); }); c.appendChild(st);
    if (G.length) { var fm = h('div', 'pf-form'); fm.appendChild(h('small', null, 'Forma')); G.slice(0, 6).reverse().forEach(function (g) { var s = h('span', 'r ' + g.res, g.res === 'W' ? 'G' : g.res === 'L' ? 'P' : 'E'); s.title = g.score + ' vs ' + MAGNA.teamName(g.rival); fm.appendChild(s); }); c.appendChild(fm); }
    var cs = h('div', 'pf-cos'); cs.appendChild(h('small', null, 'Cosméticos'));
    var sl = h('div', 'pf-slots'); ['color', 'plate', 'frame', 'title'].forEach(function (k) { var it = eq[k] && M.item(eq[k]), b = h(mine ? 'a' : 'div', 'pf-slot' + (it ? ' on' : '')); if (mine) b.href = it ? 'cuenta.html#inventario' : 'tienda.html#' + k;
      if (it) { var pv = M.cosPreview(it, p.name, p.id); pv.classList.add('mini'); b.appendChild(pv); b.title = M.KIND[k] + ': ' + it.name; } else b.appendChild(h('span', 'pl', mine ? '+' : '—')); b.appendChild(h('small', null, M.KIND[k])); sl.appendChild(b); });
    cs.appendChild(sl); c.appendChild(cs);
  }
  function vitrina(c, p, x) { var vit = h('div', 'jp-vit'), n = 0;
    MAGNA.ballonList().filter(function (b) { return b.winner === p.id; }).forEach(function (b) { var d = h('div', 'jp-tr bo'); d.style.animationDelay = n++ * 50 + 'ms'; d.appendChild(M.trophyImg('Balón de Oro', null, 86, '🥇')); d.appendChild(h('b', null, 'Balón de Oro ' + b.ed)); d.appendChild(h('small', null, b.season ? 'Temporada ' + b.season : 'Palmarés')); vit.appendChild(d); });
    var tc = {}; (x.titles || []).forEach(function (k) { tc[k] = (tc[k] || 0) + 1; });
    Object.keys(tc).sort(function (a, b) { return MAGNA.trophyOrd(a) - MAGNA.trophyOrd(b); }).forEach(function (k) { var d = h('div', 'jp-tr'); d.style.animationDelay = n++ * 50 + 'ms'; d.appendChild(M.trophyImg(k, null, 86, '🏆')); d.appendChild(h('b', null, k)); d.appendChild(h('small', null, tc[k] > 1 ? '×' + tc[k] : 'Campeón')); vit.appendChild(d); });
    if (!vit.children.length) c.appendChild(h('div', 'jp-emp', 'Su vitrina está esperando el primer premio.')); else c.appendChild(vit); }
  function insignias(c, B, got) { var bh = h('div', 'jp-bdh'); bh.appendChild(h('span', 'cnt', got + ' / ' + B.length)); bh.appendChild(h('span', null, 'desbloqueadas · se ganan solas jugando')); c.appendChild(bh);
    var bg = h('div', 'jp-bd'); B.slice().sort(function (a, b) { return (b.ok ? 1 : 0) - (a.ok ? 1 : 0); }).forEach(function (b) { var d = h('div', 'bd ' + (b.ok ? 'ok' : 'lk')); d.title = b.d; d.appendChild(h('i', null, b.i)); d.appendChild(h('b', null, b.n)); d.appendChild(h('small', null, b.ok ? b.d : b.d + ' · ' + b.v + '/' + b.goal));
      if (!b.ok) { var pg = h('div', 'pg'), sp = h('span'); sp.style.width = Math.round(b.v / b.goal * 100) + '%'; pg.appendChild(sp); d.appendChild(pg); } bg.appendChild(d); }); c.appendChild(bg); }
  function partidos(c, G) { if (!G.length) { c.appendChild(h('div', 'jp-emp', 'Todavía no tiene partidos narrados.')); return; }
    var list = h('div', 'jp-gm'); G.slice(0, 8).forEach(function (g) { var r = h('div', 'gm'); r.appendChild(h('span', 'grs ' + g.res, g.res === 'W' ? 'G' : g.res === 'L' ? 'P' : 'E')); var vs2 = h('div', 'gvs'); vs2.appendChild(h('b', null, 'vs ' + MAGNA.teamName(g.rival))); vs2.appendChild(h('small', null, g.score + ' · ' + (g.m.hist ? g.m.hname : M.fdt(g.m.at)))); r.appendChild(vs2);
      var ex = h('div', 'gex'); if (g.g) ex.appendChild(h('span', null, g.g + (g.g > 1 ? ' goles' : ' gol'))); if (g.mvp) ex.appendChild(h('span', 'mv', 'MVP')); r.appendChild(ex); r.appendChild(h('span', 'gnt' + ntCls(g.r), g.r == null ? '—' : String(g.r))); list.appendChild(r); }); c.appendChild(list); }
  function inventario(c, p, eq, mine) {
    if (items == null) { c.appendChild(M.skel(2, 'card')); return; } if (!prof) { c.appendChild(h('div', 'jp-emp', 'Este jugador todavía no tiene cuenta en Magna Arena.')); return; }
    var known = items.map(function (r) { var it = M.item(r.item_id); return it ? { it: it, r: r } : null; }).filter(Boolean);
    if (!known.length) { c.appendChild(h('div', 'jp-emp', mine ? 'Tu inventario está vacío. ¡Pásate por la tienda!' : 'Su inventario está vacío por ahora.')); return; }
    var ig = h('div', 'jp-inv'); known.forEach(function (o, i) { var on = eq[o.it.type] === o.it.id, d = h('div', 'iv' + (on ? ' on' : '')); d.style.animationDelay = i * 40 + 'ms'; d.appendChild(M.cosPreview(o.it, p.name, p.id)); d.appendChild(h('b', null, o.it.name));
      var mt = h('div', 'mt'); mt.appendChild(h('span', 'rar rar-' + (o.it.rarity || 'comun'), M.RAR[o.it.rarity] || 'Común')); mt.appendChild(h('span', null, M.KIND[o.it.type])); if (on) mt.appendChild(h('span', 'eqd', 'EQUIPADO')); d.appendChild(mt); ig.appendChild(d); }); c.appendChild(ig); }
  function load() { var id = pid(); if (id == null) return;
    sb().then(function (c) { return Promise.all([c.rpc('player_profile', { p_player: id }), c.rpc('player_items', { p_player: id })]); }).then(function (r) { prof = r[0] && !r[0].error && r[0].data && r[0].data[0] || null; items = r[1] && !r[1].error ? (r[1].data || []) : []; render(); }, function () { items = []; render(); });
    if (window.ACCOUNTS) ACCOUNTS.me().then(function (a) { meAcc = a; if (a && a.player_id === id) render(); }, function () {}); }
  document.addEventListener('click', function () { var o = document.querySelector('.pf-pop.on'); if (o) o.classList.remove('on'); });
  window.addEventListener('magna:update', function () { render(); });
  window.addEventListener('magna:cosloaded', function () { if (pid() != null) render(); });
  function boot() { render(); load(); }
  if (document.readyState === 'complete') boot(); else addEventListener('load', boot);
})();
