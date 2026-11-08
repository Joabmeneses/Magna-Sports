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
  function sec(title, sub, id) { var s = h('section', 'jp-s'); if (id) s.id = id; var t2 = h('h2', 'x hx-sh'); t2.appendChild(h('span', null, title.toUpperCase() + '_')); s.appendChild(t2); if (sub) s.appendChild(h('p', null, sub)); root.appendChild(s); return s; }

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
    // ---------- portada estilo pantalla de héroe ----------
    var tr = MAGNA.tierOf(x.media), tm = t || coachOf, tcol = tm ? MAGNA.teamColor(tm.id) : '#8b5cf6', bo = MAGNA.ballonCount(p.id), nota = x.rated ? Math.round(x.sum / x.rated * 10) / 10 : null, pct = x.pj ? Math.round(x.w / x.pj * 100) : 0;
    var hd = h('section', 'hx-h'); hd.style.setProperty('--tc', tcol); hd.style.setProperty('--tr', tr.color);
    // barra superior
    var tb = h('div', 'hx-top'), bk = h('a', 'hx-bk'); bk.href = 'jugador.html'; bk.appendChild(h('span', 'ar', '⟵')); bk.appendChild(h('b', null, 'JUGADORES')); tb.appendChild(bk); tb.appendChild(h('span', 'sp'));
    if (prof) { var bt = h('span', 'hx-cur'); bt.appendChild(MAGNA_BIT(26)); bt.title = 'Bits'; bt.appendChild(h('b', null, fmt(prof.bits))); tb.appendChild(bt); }
    if (bo) { var bb = h('span', 'hx-cur'); bb.appendChild(h('i', null, '🥇')); bb.appendChild(h('b', null, String(bo))); bb.title = bo + (bo > 1 ? ' Balones de Oro' : ' Balón de Oro'); tb.appendChild(bb); }
    var tt = h('span', 'hx-cur'); tt.appendChild(h('i', null, '🏆')); tt.appendChild(h('b', null, String((x.titles || []).length))); tt.title = 'Títulos'; tb.appendChild(tt); hd.appendChild(tb);
    var gr = h('div', 'hx-g');
    // izquierda: nombre, equipo y accesos
    var lf = h('div', 'hx-l'), nm = h('h1', 'hx-nm'), pn = M.pn(p.name, p.id, { plain: true, title: true }); if (prof) { M.nameStyle(pn, eq); var ti = eq.title && M.item(eq.title); var old = pn.querySelector('.mpn-t'); if (old) old.remove(); if (ti && ti.type === 'title') pn.appendChild(h('small', 'mpn-t tr-' + (ti.rarity || 'comun'), ti.name)); pn.removeAttribute('data-pn'); } nm.appendChild(pn); lf.appendChild(nm);
    lf.appendChild(h('div', 'hx-sub', (MAGNA.roleOf(p) === 'coach' ? 'Director técnico' : MAGNA.roleOf(p) === 'both' ? 'Jugador y DT' : 'Jugador') + ' · Magna Sports'));
    if (tm) { var ta = h('a', 'hx-tm'); ta.href = 'equipo.html?id=' + tm.id; ta.appendChild(M.crest(tm.id, tm.name, 30)); ta.appendChild(h('span', null, (coachOf && !t ? 'DT de ' : '') + tm.name)); lf.appendChild(ta); } else lf.appendChild(h('span', 'hx-tm free', '🆓 Agente libre'));
    if (prof && prof.member_since) lf.appendChild(h('div', 'hx-since', 'En Magna desde ' + new Date(prof.member_since).toLocaleDateString('es', { month: 'long', year: 'numeric' })));
    var ic = h('div', 'hx-ic'); [['📊', 'Estadísticas', '.hx-st'], ['🏆', 'Vitrina', '#vitrina'], ['🎖️', 'Insignias', '#insignias'], ['⚽', 'Partidos', '#partidos']].forEach(function (q) { var b = h('button', null, q[0]); b.type = 'button'; b.title = q[1]; b.setAttribute('aria-label', q[1]); b.onclick = function () { var el = document.querySelector(q[2]); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }; ic.appendChild(b); }); lf.appendChild(ic);
    gr.appendChild(lf);
    // centro: panel inclinado con el retrato
    var ct = h('div', 'hx-c'); ct.appendChild(h('span', 'hx-wm', p.name)); var pt = h('div', 'hx-pt'), img = M.pav(p.id) || (prof && prof.avatar && /^a\d\d$/.test(prof.avatar) ? 'avatars/' + prof.avatar + '.webp' : null); if (img) { var im = h('img'); im.src = img; im.alt = p.name; pt.appendChild(im); } else pt.appendChild(h('span', null, String(p.name).slice(0, 2).toUpperCase()));
    var ptw = h('div', 'hx-ptw'), eqf = eq.frame && M.item(eq.frame); if (eqf && eqf.type === 'frame') ptw.classList.add('fr-' + eqf.style); ptw.appendChild(pt); ct.appendChild(ptw);
    var tierB = h('div', 'hx-tier'); tierB.appendChild(h('small', null, 'NIVEL')); tierB.appendChild(h('b', null, tr.name)); ct.appendChild(tierB);
    for (var q = 0; q < 6; q++) { var sp = h('i', 'hx-sp'); sp.style.left = (14 + q * 14) + '%'; sp.style.animationDelay = (q * .5) + 's'; ct.appendChild(sp); }
    gr.appendChild(ct);
    // derecha: media, estrellas, estadísticas y cosméticos
    var rt = h('div', 'hx-r'), lv = h('div', 'hx-lv'), cur = x.media == null ? 10 : x.media, T = [[0, 40, 'Plata'], [40, 60, 'Oro'], [60, 80, 'Élite'], [80, 100, 'Máximo']], seg = T.filter(function (z) { return cur >= z[0] && cur < z[1]; })[0] || T[3];
    var lvb = h('b', null, 'MEDIA '), lvn = h('span', 'n', String(cur)); lvb.appendChild(lvn); lv.appendChild(lvb); lv.appendChild(h('small', null, cur >= 100 ? 'Máximo' : cur + ' / ' + seg[1])); rt.appendChild(lv);
    var xp = h('div', 'hx-xp'), xf = h('i'); xp.appendChild(xf); rt.appendChild(xp); setTimeout(function () { xf.style.width = Math.max(4, Math.round((cur - seg[0]) / (seg[1] - seg[0]) * 100)) + '%'; }, 120);
    var sr = h('div', 'hx-sr'), stars = h('div', 'hx-stars'), nst = x.media == null ? 0 : tr.rank + 1 + (cur >= 90 ? 1 : 0); for (var si = 0; si < 5; si++) { var st0 = h('i', si < nst ? 'on' : null, '★'); st0.style.animationDelay = si * 90 + 'ms'; stars.appendChild(st0); } sr.appendChild(stars);
    sr.appendChild(h('span', 'hx-nx', cur >= 80 ? '¡Nivel máximo!' : 'Sube a ' + seg[2] + ' con ' + (seg[1] - cur) + ' pts')); rt.appendChild(sr);
    var sp1 = h('div', 'hx-pn hx-st'), sh1 = h('div', 'hx-ph'); sh1.appendChild(h('b', null, 'ESTADÍSTICAS_')); sp1.appendChild(sh1); var sl = h('div', 'hx-sl');
    [['Partidos', x.pj || 0], ['Victorias', (x.w || 0) + ' · ' + pct + '%'], ['Goles', x.g || 0], ['MVP', x.mvp || 0], ['Nota media', nota == null ? '—' : String(nota).replace('.', ',')], ['Títulos', (x.titles || []).length + bo]].forEach(function (r, i) { var d = h('div', 'hx-row'); d.style.animationDelay = i * 60 + 'ms'; d.appendChild(h('span', null, r[0])); d.appendChild(h('i')); d.appendChild(h('b', null, String(r[1]))); sl.appendChild(d); });
    sp1.appendChild(sl); rt.appendChild(sp1);
    var sp2 = h('div', 'hx-pn'), sh2 = h('div', 'hx-ph'); sh2.appendChild(h('b', null, 'COSMÉTICOS_')); if (mine) { var pl = h('a', 'hx-plus', '+'); pl.href = 'tienda.html'; pl.title = 'Tienda'; sh2.appendChild(pl); } sp2.appendChild(sh2);
    var slw = h('div', 'hx-slots'); ['color', 'plate', 'frame', 'title'].forEach(function (k) { var it = eq[k] && M.item(eq[k]), b = h(mine ? 'a' : 'div', 'hx-slot' + (it ? ' on rar-' + (it.rarity || 'comun') : '')); if (mine) b.href = 'cuenta.html#inventario';
      if (it) { var pv = M.cosPreview(it, p.name, p.id); pv.classList.add('mini'); b.appendChild(pv); b.title = (M.KIND[k] || k) + ': ' + it.name; } else b.appendChild(h('span', 'pl', mine ? '+' : '—')); b.appendChild(h('small', null, M.KIND[k] || k)); slw.appendChild(b); });
    sp2.appendChild(slw); rt.appendChild(sp2);
    var act = h('div', 'hx-act');
    if (window.SHARE_CARD) { var shb = h('button', 'hx-go', '🖼️ TARJETA'); shb.type = 'button'; act.appendChild(shb);
      shb.onclick = function () { SHARE_CARD.open('player', function () { var G2 = MAGNA.groupTrophies((x.titles || []).map(function (n2) { return { name: n2 }; })).sort(function (a, b) { return MAGNA.trophyOrd(a.name) - MAGNA.trophyOrd(b.name); }), bo2 = MAGNA.ballonCount(p.id), nota2 = x.rated ? String(Math.round(x.sum / x.rated * 10) / 10).replace('.', ',') : '—';
        var T = (bo2 ? [{ name: 'Balón de Oro', n: bo2, art: MAGNA.trophyArt('Balón de Oro'), emoji: '🥇' }] : []).concat(G2.map(function (g) { return { name: g.name, n: g.n, art: MAGNA.trophyArt(g.name), emoji: /mundial/i.test(g.name) ? '🌍' : '🏆' }; }));
        return { name: p.name, team: tm ? tm.name : null, role: MAGNA.roleOf(p) === 'coach' ? 'DT' : null, avatar: M.pav(p.id), media: x.media, tier: MAGNA.tierOf(x.media), ballon: bo2,
          stats: [[x.media == null ? '—' : x.media, 'Media'], [x.pj || 0, 'Partidos'], [x.g || 0, 'Goles'], [x.mvp || 0, 'MVP'], [(x.titles || []).length + bo2, 'Títulos']], trophies: T }; }); }; }
    if (mine) { var a1 = h('a', 'hx-go alt', '🎨 PERSONALIZAR'); a1.href = 'cuenta.html#inventario'; act.appendChild(a1); }
    rt.appendChild(act); gr.appendChild(rt); hd.appendChild(gr);
    root.appendChild(hd);
    // efecto: la tarjeta del retrato sigue al mouse
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) { ct.addEventListener('mousemove', function (e) { var r2 = ct.getBoundingClientRect(), dx = (e.clientX - r2.left) / r2.width - .5, dy = (e.clientY - r2.top) / r2.height - .5; pt.style.transform = 'translate(' + (dx * 14).toFixed(1) + 'px,' + (dy * 10).toFixed(1) + 'px) rotate(' + (dx * 4).toFixed(1) + 'deg)'; }); ct.addEventListener('mouseleave', function () { pt.style.transform = ''; }); }
    var cn = 0; (function count() { if (cn >= cur) { lvn.textContent = String(cur); return; } cn = Math.min(cur, cn + Math.max(1, Math.round(cur / 24))); lvn.textContent = String(cn); requestAnimationFrame(count); })();
    // vitrina
    var vs = sec('Vitrina', 'Los premios que ganó en la cancha.', 'vitrina'), vit = h('div', 'jp-vit'), n = 0;
    MAGNA.ballonList().filter(function (b) { return b.winner === p.id; }).forEach(function (b) { var c = h('div', 'jp-tr bo ar-sheen'); c.dataset.tilt = '14'; c.style.animationDelay = n++ * 50 + 'ms'; c.appendChild(M.trophyImg('Balón de Oro', null, 96, '🥇')); c.appendChild(h('b', null, 'Balón de Oro ' + b.ed)); c.appendChild(h('small', null, b.season ? 'Temporada ' + b.season : b.source === 'vote' ? 'Votación de la comunidad' : 'Palmarés')); vit.appendChild(c); });
    var tc = {}; (x.titles || []).forEach(function (nm2) { tc[nm2] = (tc[nm2] || 0) + 1; });
    Object.keys(tc).sort(function (a, b) { return MAGNA.trophyOrd(a) - MAGNA.trophyOrd(b); }).forEach(function (k) { var c = h('div', 'jp-tr' + (MAGNA.trophyArt(k) ? ' art' : '')); c.style.animationDelay = n++ * 50 + 'ms'; c.appendChild(M.trophyImg(k, null, 96, /mundial/i.test(k) ? '🌍' : /champions/i.test(k) ? '⭐' : '🏆')); c.appendChild(h('b', null, k)); c.appendChild(h('small', null, tc[k] > 1 ? '×' + tc[k] : 'Campeón')); vit.appendChild(c); });
    if (x.mvp) { var c2 = h('div', 'jp-tr'); c2.style.animationDelay = n++ * 50 + 'ms'; c2.appendChild(h('i', null, '⭐')); c2.appendChild(h('b', null, x.mvp + ' × MVP')); c2.appendChild(h('small', null, 'Mejor del partido')); vit.appendChild(c2); }
    if (!vit.children.length) vs.appendChild(h('div', 'jp-emp', '🏆 Su vitrina está esperando el primer premio.')); else vs.appendChild(vit);
    // insignias
    var B = MAGNA.playerBadges(p.id), got = B.filter(function (b) { return b.ok; }).length, bs = sec('Insignias', 'Se desbloquean solas jugando en Magna.', 'insignias'), bh = h('div', 'jp-bdh'); bh.appendChild(h('span', 'cnt', got + ' / ' + B.length)); bh.appendChild(h('span', null, 'desbloqueadas')); bs.appendChild(bh);
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
    var G = MAGNA.playerGames(p.id), gs = sec('Últimos partidos', G.length ? 'Su forma reciente y su nota en cada partido.' : null, 'partidos');
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
  window.addEventListener('magna:cosloaded', function () { if (pid() != null) render(); });
  function boot() { render(); load(); }
  if (document.readyState === 'complete') boot(); else addEventListener('load', boot);
})();
