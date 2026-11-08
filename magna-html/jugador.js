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
  function sec(title, sub) { var s = h('section', 'jp-s'); s.appendChild(h('h2', 'x', title)); if (sub) s.appendChild(h('p', null, sub)); root.appendChild(s); return s; }

  function directory() {
    document.title = 'Magna Arena · Jugadores';
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

  // carta coleccionable del jugador
  function pcard(p, x, tm) { var tr = MAGNA.tierOf(x.media), c = h('div', 'ar-pc ar-sheen t-' + (tr.id === 'nuevo' ? 'bronce' : tr.id)); c.dataset.tilt = '16';
    var top = h('div', 'apc-t'), l = h('div'); l.appendChild(h('div', 'apc-m', x.media == null ? '—' : String(x.media))); l.appendChild(h('div', 'apc-n', tr.name)); top.appendChild(l); if (tm) top.appendChild(M.crest(tm.id, tm.name, 30)); c.appendChild(top);
    var av = M.tierAv(p.name, x.media, 76, p.id); av.setAttribute('data-nolink', ''); c.appendChild(av); c.appendChild(h('div', 'apc-nm', p.name));
    var st = h('div', 'apc-s'), nota = x.rated ? (Math.round(x.sum / x.rated * 10) / 10) : null; [['PJ', x.pj || 0], ['GOL', x.g || 0], ['MVP', x.mvp || 0], ['NOTA', nota == null ? '—' : String(nota).replace('.', ',')]].forEach(function (k) { var s = h('span'); s.appendChild(h('small', null, k[0])); s.appendChild(h('b', null, String(k[1]))); st.appendChild(s); }); c.appendChild(st); return c; }
  function render() {
    var id = pid(), p = id != null ? MAGNA.by(S().players, id) : null; if (!p) return directory();
    var PS = MAGNA.playerStats(), x = PS[p.id] || {}, t = p.teamId ? MAGNA.by(S().teams, p.teamId) : null, coachOf = S().teams.filter(function (tm) { return tm.coach === p.id; })[0];
    var tint = M.tint(teamIdx((t || coachOf || {}).id)); document.body.style.setProperty('--jt', tint); document.title = 'Magna Arena · ' + p.name;
    root.innerHTML = '';
    var eq = (prof && prof.equipped) || M.eqOf(p.id), mine = meAcc && meAcc.player_id === p.id;
    // portada
    var hd = h('section', 'jp-h'), av = M.tierAv(p.name, x.media, 150, p.id); av.setAttribute('data-nolink', ''); hd.appendChild(av);
    var tx = h('div'); tx.appendChild(h('div', 'jp-ey', (MAGNA.roleOf(p) === 'coach' ? 'Director técnico' : 'Jugador') + ' · Magna Sports'));
    var nm = h('h1', 'jp-nm'), pn = M.pn(p.name, p.id, { plain: true, title: true }); if (prof) { M.nameStyle(pn, eq); var ti = eq.title && M.item(eq.title); var old = pn.querySelector('.mpn-t'); if (old) old.remove(); if (ti && ti.type === 'title') pn.appendChild(h('small', 'mpn-t', ti.name)); pn.removeAttribute('data-pn'); } nm.appendChild(pn); tx.appendChild(nm);
    var ch = h('div', 'jp-chips'), tm = t || coachOf;
    if (tm) { var ta = h('a'); ta.href = 'equipo.html?id=' + tm.id; ta.appendChild(M.crest(tm.id, tm.name, 22)); ta.appendChild(document.createTextNode((coachOf && !t ? 'DT de ' : '') + tm.name)); ch.appendChild(ta); } else ch.appendChild(h('span', null, '🆓 Agente libre'));
    var tr = MAGNA.tierOf(x.media); ch.appendChild(h('span', null, '◆ ' + tr.name));
    var bo = MAGNA.ballonCount(p.id); if (bo) ch.appendChild(h('span', null, '🥇 ' + bo + (bo > 1 ? ' Balones de Oro' : ' Balón de Oro')));
    if (prof) { ch.appendChild(h('span', null, '🪙 ' + fmt(prof.bits) + ' Bits')); if (prof.member_since) ch.appendChild(h('span', null, '📅 Desde ' + new Date(prof.member_since).toLocaleDateString('es', { month: 'short', year: 'numeric' }))); }
    tx.appendChild(ch);
    if (mine) { var ac = h('div', 'jp-act'), a1 = h('a', null, '🎨 Personalizar'); a1.href = 'cuenta.html#inventario'; var a2 = h('a', 'g', '🛍️ Tienda'); a2.href = 'tienda.html'; ac.appendChild(a1); ac.appendChild(a2); tx.appendChild(ac); }
    if (window.SHARE_CARD) { var sb2 = h('div', 'jp-act'), shb = h('button', 'jp-shc', '🖼️ Tarjeta para compartir'); shb.type = 'button'; sb2.appendChild(shb); tx.appendChild(sb2);
      shb.onclick = function () { SHARE_CARD.open('player', function () { var G2 = MAGNA.groupTrophies((x.titles || []).map(function (n2) { return { name: n2 }; })).sort(function (a, b) { return MAGNA.trophyOrd(a.name) - MAGNA.trophyOrd(b.name); }), bo2 = MAGNA.ballonCount(p.id), nota2 = x.rated ? String(Math.round(x.sum / x.rated * 10) / 10).replace('.', ',') : '—';
        var T = (bo2 ? [{ name: 'Balón de Oro', n: bo2, art: MAGNA.trophyArt('Balón de Oro'), emoji: '🥇' }] : []).concat(G2.map(function (g) { return { name: g.name, n: g.n, art: MAGNA.trophyArt(g.name), emoji: /mundial/i.test(g.name) ? '🌍' : '🏆' }; }));
        return { name: p.name, team: tm ? tm.name : null, role: MAGNA.roleOf(p) === 'coach' ? 'DT' : null, avatar: M.pav(p.id), media: x.media, tier: MAGNA.tierOf(x.media), ballon: bo2,
          stats: [[x.media == null ? '—' : x.media, 'Media'], [x.pj || 0, 'Partidos'], [x.g || 0, 'Goles'], [x.mvp || 0, 'MVP'], [(x.titles || []).length + bo2, 'Títulos']], trophies: T }; }); }; }
    hd.appendChild(tx); if (MAGNA.plays(p)) hd.appendChild(pcard(p, x, tm)); root.appendChild(hd);
    // números
    var kp = h('div', 'jp-k'), pct = x.pj ? Math.round(x.w / x.pj * 100) : 0, nota = x.rated ? Math.round(x.sum / x.rated * 10) / 10 : null;
    [[x.pj || 0, 'Partidos'], [x.w || 0, 'Victorias · ' + pct + '%'], [x.g || 0, 'Goles'], [x.mvp || 0, 'MVP'], [nota == null ? '—' : String(nota).replace('.', ','), 'Nota media'], [(x.titles || []).length, 'Títulos']].forEach(function (k, i) { var d = h('div'); d.style.animationDelay = i * 50 + 'ms'; d.appendChild(h('b', null, String(k[0]))); d.appendChild(h('small', null, k[1])); kp.appendChild(d); });
    root.appendChild(kp);
    // vitrina
    var vs = sec('Vitrina', 'Los premios que ganó en la cancha.'), vit = h('div', 'jp-vit'), n = 0;
    MAGNA.ballonList().filter(function (b) { return b.winner === p.id; }).forEach(function (b) { var c = h('div', 'jp-tr bo ar-sheen'); c.dataset.tilt = '14'; c.style.animationDelay = n++ * 50 + 'ms'; c.appendChild(M.trophyImg('Balón de Oro', null, 96, '🥇')); c.appendChild(h('b', null, 'Balón de Oro ' + b.ed)); c.appendChild(h('small', null, b.season ? 'Temporada ' + b.season : b.source === 'vote' ? 'Votación de la comunidad' : 'Palmarés')); vit.appendChild(c); });
    var tc = {}; (x.titles || []).forEach(function (nm2) { tc[nm2] = (tc[nm2] || 0) + 1; });
    Object.keys(tc).sort(function (a, b) { return MAGNA.trophyOrd(a) - MAGNA.trophyOrd(b); }).forEach(function (k) { var c = h('div', 'jp-tr' + (MAGNA.trophyArt(k) ? ' art' : '')); c.style.animationDelay = n++ * 50 + 'ms'; c.appendChild(M.trophyImg(k, null, 96, /mundial/i.test(k) ? '🌍' : /champions/i.test(k) ? '⭐' : '🏆')); c.appendChild(h('b', null, k)); c.appendChild(h('small', null, tc[k] > 1 ? '×' + tc[k] : 'Campeón')); vit.appendChild(c); });
    if (x.mvp) { var c2 = h('div', 'jp-tr'); c2.style.animationDelay = n++ * 50 + 'ms'; c2.appendChild(h('i', null, '⭐')); c2.appendChild(h('b', null, x.mvp + ' × MVP')); c2.appendChild(h('small', null, 'Mejor del partido')); vit.appendChild(c2); }
    if (!vit.children.length) vs.appendChild(h('div', 'jp-emp', '🏆 Su vitrina está esperando el primer premio.')); else vs.appendChild(vit);
    // insignias
    var B = MAGNA.playerBadges(p.id), got = B.filter(function (b) { return b.ok; }).length, bs = sec('Insignias', 'Se desbloquean solas jugando en Magna.'), bh = h('div', 'jp-bdh'); bh.appendChild(h('span', 'cnt', got + ' / ' + B.length)); bh.appendChild(h('span', null, 'desbloqueadas')); bs.appendChild(bh);
    var bg = h('div', 'jp-bd'); B.slice().sort(function (a, b) { return (b.ok ? 1 : 0) - (a.ok ? 1 : 0); }).forEach(function (b) { var rw = ((S().shop || []).filter(function (it) { return it.exclusive && it.award === b.id; })), d = h('div', 'bd ' + (b.ok ? 'ok' : 'lk')); d.title = b.d + (rw.length ? ' · Premio: ' + rw.map(function (it) { return it.name; }).join(', ') : ''); if (rw.length) d.appendChild(h('span', 'bd-rw', '🎁')); d.appendChild(h('i', null, b.i)); d.appendChild(h('b', null, b.n)); d.appendChild(h('small', null, b.ok ? b.d : b.d + ' · ' + b.v + '/' + b.goal));
      if (!b.ok) { var pg = h('div', 'pg'), sp = h('span'); sp.style.width = Math.round(b.v / b.goal * 100) + '%'; pg.appendChild(sp); d.appendChild(pg); } bg.appendChild(d); }); bs.appendChild(bg);
    // inventario de cosméticos
    var is = sec('Inventario', 'Cosméticos que tiene: colores de nombre, placas, marcos y títulos.');
    if (items == null) is.appendChild(M.skel(2, 'card'));
    else if (!prof) is.appendChild(h('div', 'jp-emp', 'Este jugador todavía no tiene cuenta en Magna Arena.'));
    else { var known = items.map(function (r) { var it = M.item(r.item_id); return it ? { it: it, r: r } : null; }).filter(Boolean);
      if (!known.length) is.appendChild(h('div', 'jp-emp', mine ? 'Tu inventario está vacío. ¡Pásate por la tienda! 🛍️' : 'Su inventario está vacío por ahora.'));
      else { var ig = h('div', 'jp-inv'); known.forEach(function (o, i) { var on = eq[o.it.type] === o.it.id, d = h('div', 'iv ar-sheen' + (on ? ' on' : '')); d.dataset.tilt = '10'; d.style.animationDelay = i * 40 + 'ms'; d.appendChild(M.cosPreview(o.it, p.name, p.id)); d.appendChild(h('b', null, o.it.name));
          var mt = h('div', 'mt'); mt.appendChild(h('span', 'rar rar-' + (o.it.rarity || 'comun'), M.RAR[o.it.rarity] || 'Común')); mt.appendChild(h('span', null, M.KIND[o.it.type] + (o.r.source === 'gift' ? ' · 🎁' : ''))); if (o.it.exclusive) mt.appendChild(h('span', 'eqd xc', '🔒 EXCLUSIVO')); if (on) mt.appendChild(h('span', 'eqd', 'EQUIPADO')); d.appendChild(mt); ig.appendChild(d); }); is.appendChild(ig); } }
    // forma y partidos
    var G = MAGNA.playerGames(p.id), gs = sec('Últimos partidos', G.length ? 'Su forma reciente y su nota en cada partido.' : null);
    if (!G.length) { gs.appendChild(h('div', 'jp-emp', 'Todavía no tiene partidos narrados.')); return; }
    var two = h('div', 'jp-two'), left = h('div', 'jp-box'), right = h('div', 'jp-box'), list = h('div', 'jp-gm');
    G.slice(0, 8).forEach(function (g) { var r = h('div', 'gm'); r.appendChild(h('span', 'grs ' + g.res, g.res === 'W' ? 'G' : g.res === 'L' ? 'P' : 'E')); var vs2 = h('div', 'gvs'); vs2.appendChild(h('b', null, 'vs ' + MAGNA.teamName(g.rival))); vs2.appendChild(h('small', null, g.score + ' · ' + (g.m.hist ? '🏆 ' + g.m.hname : M.fdt(g.m.at)))); r.appendChild(vs2);
      var ex = h('div', 'gex'); if (g.g) ex.appendChild(h('span', null, '⚽'.repeat(Math.min(g.g, 4)) + (g.g > 4 ? '+' : ''))); if (g.mvp) ex.appendChild(h('span', null, '⭐')); r.appendChild(ex); r.appendChild(h('span', 'gnt' + ntCls(g.r), g.r == null ? '—' : String(g.r))); list.appendChild(r); });
    left.appendChild(list); two.appendChild(left);
    right.appendChild(h('b', null, 'Notas recientes')); var R = G.slice(0, 14).reverse().filter(function (g) { return g.r != null; }), sp2 = h('div', 'jp-spark');
    R.forEach(function (g, i) { var b2 = h('i'); b2.style.height = Math.max(6, g.r * 10) + '%'; b2.style.animationDelay = i * 40 + 'ms'; b2.title = g.r + ' vs ' + MAGNA.teamName(g.rival); sp2.appendChild(b2); });
    if (R.length) right.appendChild(sp2); else right.appendChild(h('p', 'sub', 'Sin notas todavía.'));
    var gg = G.reduce(function (s2, g) { return s2 + g.g; }, 0); right.appendChild(h('p', 'sub', 'En sus últimos ' + G.length + ' partidos: ' + G.filter(function (g) { return g.res === 'W'; }).length + ' victorias y ' + gg + ' goles.'));
    two.appendChild(right); gs.appendChild(two);
  }
  function load() { var id = pid(); if (id == null) return;
    sb().then(function (c) { return Promise.all([c.rpc('player_profile', { p_player: id }), c.rpc('player_items', { p_player: id })]); }).then(function (r) { prof = r[0] && !r[0].error && r[0].data && r[0].data[0] || null; items = r[1] && !r[1].error ? (r[1].data || []) : []; render(); }, function () { items = []; render(); });
    if (window.ACCOUNTS) ACCOUNTS.me().then(function (a) { meAcc = a; if (a && a.player_id === id) render(); }, function () {}); }
  window.addEventListener('magna:update', function () { render(); });
  function boot() { render(); load(); }
  if (document.readyState === 'complete') boot(); else addEventListener('load', boot);
})();
