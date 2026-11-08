'use strict';
// Ranking de Magna Arena: equipos por puntos, jugadores por media, goleadores, MVP y miembros por Bits.
// Podio animado, cambios de puesto de la última semana, tu lugar, buscador, filas que se abren y comparador.
(function () {
  var h = M.h, root = document.getElementById('rk'), tab = 'equipos', bitsRows = null, bitsErr = null, me = null, q = '', tf = '', open = {}, shown = 15, cmp = null, lastTab = null;
  var TABS = [
    { k: 'equipos', l: 'Equipos', e: '🛡️', c: '#8b5cf6', unit: 'puntos', hint: 'Cada victoria suma según la competición. Toca un equipo para ver de dónde salen sus puntos.' },
    { k: 'jugadores', l: 'Jugadores', e: '⭐', c: '#22d3ee', unit: 'media', hint: 'La media va de 10 a 100: sale de los resultados contra rivales de distinto nivel y de la nota de cada partido. Los títulos aseguran un mínimo.' },
    { k: 'goleadores', l: 'Goleadores', e: '⚽', c: '#2ee59d', unit: 'goles', hint: 'Goles en partidos narrados en vivo. Si empatan, va primero quien jugó menos partidos.' },
    { k: 'mvp', l: 'MVP', e: '🌟', c: '#ffc400', unit: 'MVP', hint: 'Veces elegido el mejor del partido. Si empatan, desempata la nota media.' },
    { k: 'bits', l: 'Bits', e: '🪙', c: '#ff8a3d', unit: 'Bits', hint: 'Saldo de Bits de cada miembro con cuenta. Se ganan acertando pronósticos en Apuestas; son una moneda ficticia sin valor real.' }];
  var WEEK = 7 * 864e5;
  function fmt(n) { return String(Math.round(Number(n || 0))).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function S() { return MAGNA.S; }
  function T() { return TABS.filter(function (x) { return x.k === tab; })[0]; }
  function team(id) { return MAGNA.by(S().teams, id); }
  function RM() { return matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function tms(at) { return at ? new Date(String(at).replace(' ', 'T') + 'Z').getTime() : 0; }

  // ---------- datos ----------
  function teamRows() {
    var TL = MAGNA.teamLevels(), rec = {};
    S().teams.forEach(function (t) { rec[t.id] = { pj: 0, w: 0, l: 0, gf: 0, gc: 0 }; });
    S().matches.filter(function (m) { return m.status === 'finished' && m.hs != null && m.as != null; }).concat(MAGNA.histMatches ? MAGNA.histMatches() : []).forEach(function (m) {
      [[m.home, m.hs, m.as], [m.away, m.as, m.hs]].forEach(function (x) { var r = rec[x[0]]; if (!r) return; r.pj++; r.gf += x[1]; r.gc += x[2]; if (x[1] > x[2]) r.w++; else r.l++; }); });
    var PT = MAGNA.teamPoints();
    return S().teams.map(function (t) { var r = rec[t.id], p = PT[t.id] || { pts: 0 }; return { id: 't' + t.id, t: t, v: p.pts, bd: p, lvl: Math.round(TL.get(t.id)), pj: r.pj, w: r.w, l: r.l, dg: r.gf - r.gc, tro: MAGNA.teamTrophies(t.id).length }; })
      .sort(function (a, b) { return b.v - a.v || b.lvl - a.lvl || b.w - a.w || b.dg - a.dg || a.t.name.localeCompare(b.t.name); });
  }
  function playerBase() { var P = MAGNA.playerStats(); return S().players.map(function (p) { var x = P[p.id] || {}; return { id: 'p' + p.id, p: p, media: x.media == null ? 10 : x.media, pj: x.pj || 0, w: x.w || 0, l: x.l || 0, g: x.g || 0, mvp: x.mvp || 0, nota: x.rated ? Math.round(x.sum / x.rated * 10) / 10 : null, titles: (x.titles || []).length, plays: MAGNA.plays(p) }; }); }
  function rowsFor(k) {
    if (k === 'equipos') return teamRows();
    var B = playerBase();
    if (k === 'jugadores') return B.filter(function (r) { return r.plays || r.pj > 0 || r.titles > 0; }).map(function (r) { r.v = r.media; return r; }).sort(function (a, b) { return b.media - a.media || b.titles - a.titles || b.w - a.w || a.p.name.localeCompare(b.p.name); });
    if (k === 'goleadores') return B.filter(function (r) { return r.g > 0; }).map(function (r) { r.v = r.g; return r; }).sort(function (a, b) { return b.g - a.g || a.pj - b.pj || a.p.name.localeCompare(b.p.name); });
    if (k === 'mvp') return B.filter(function (r) { return r.mvp > 0; }).map(function (r) { r.v = r.mvp; return r; }).sort(function (a, b) { return b.mvp - a.mvp || (b.nota || 0) - (a.nota || 0) || a.p.name.localeCompare(b.p.name); });
    return (bitsRows || []).map(function (r, i) { return { id: r.player_id ? 'p' + r.player_id : 'b' + i, b: r, p: r.player_id ? MAGNA.by(S().players, r.player_id) : null, v: Number(r.bits) || 0 }; });
  }
  // puestos de hace una semana (sin los partidos de los últimos 7 días) para mostrar ▲ ▼
  var pastCache = {};
  function past(k) { if (k === 'bits') return null; if (pastCache[k]) return pastCache[k]; var cut = Date.now() - WEEK, all = S().matches;
    if (!all.some(function (m) { return m.status === 'finished' && tms(m.at) > cut; })) return (pastCache[k] = null);
    var pos = {}; S().matches = all.filter(function (m) { return !(m.status === 'finished' && tms(m.at) > cut); });
    try { rowsFor(k).forEach(function (r, i) { pos[r.id] = i; }); } catch (e) { pos = null; } finally { S().matches = all; }
    return (pastCache[k] = pos); }

  // ---------- piezas ----------
  function avOf(r, size) { if (r.t) return M.crest(r.t.id, r.t.name, size); if (r.b && !r.p) return bitsAv(r.b, size); return M.tierAv(r.p.name, r.media != null ? r.media : (MAGNA.playerStats()[r.p.id] || {}).media, size, r.p.id); }
  function bitsAv(b, size) { var a = h('div', 'av'), fr = b.equipped && b.equipped.frame && M.item(b.equipped.frame), u = window.MAGNA_AVATAR_URL && MAGNA_AVATAR_URL(b.avatar); if (fr && fr.type === 'frame') a.classList.add('fr-' + fr.style); a.style.width = a.style.height = size + 'px';
    if (u) { var im = h('img'); im.src = u; im.alt = ''; a.appendChild(im); } else a.textContent = String(b.display_name || '?').slice(0, 2).toUpperCase(); return a; }
  function nameOf(r, plain) { if (r.t) return h('span', null, r.t.name); if (r.p) return M.pn(r.b ? r.b.display_name : r.p.name, r.p.id, { plain: plain }); return M.nameStyle(M.pn(r.b.display_name), r.b.equipped || {}); }
  function subOf(r) { if (r.t) return r.pj ? r.w + 'V · ' + r.l + 'D' + (r.tro ? ' · ' + r.tro + ' 🏆' : '') : 'Sin partidos'; var p = r.p; if (!p) return 'Miembro';
    if (!MAGNA.plays(p)) { var dt = S().teams.filter(function (x) { return x.coach === p.id; })[0]; return dt ? 'DT de ' + dt.name : 'Coach'; } var t = team(p.teamId); return t ? t.name + (p.slot === 'reserve' ? ' · suplente' : '') : 'Agente libre'; }
  function hrefOf(r) { return r.t ? 'equipo.html?id=' + r.t.id : r.p ? M.profileUrl(r.p.id) : null; }
  function valTxt(r) { return tab === 'equipos' || tab === 'bits' ? fmt(r.v) : String(r.v); }
  function isMe(r) { if (!me) return false; if (r.p && me.player_id != null) return r.p.id === me.player_id; if (r.b) return r.b.display_name === me.display_name && !r.p; if (r.t && me.player_id != null) { var p = MAGNA.by(S().players, me.player_id); return !!p && (p.teamId === r.t.id || r.t.coach === p.id); } return false; }
  function countUp(el, to, isBig) { if (RM()) { el.textContent = isBig ? fmt(to) : String(to); return; } var t0 = null, d = 900; function f(ts) { if (!t0) t0 = ts; var k = Math.min(1, (ts - t0) / d), e = 1 - Math.pow(1 - k, 3), v = to * e; el.textContent = isBig ? fmt(v) : (Number.isInteger(to) ? String(Math.round(v)) : v.toFixed(1)); if (k < 1) requestAnimationFrame(f); } requestAnimationFrame(f); }
  function confetti() { if (RM()) return; var C = ['#ffc400', '#ff5a36', '#22d3ee', '#2ee59d', '#a78bfa', '#ff6ad5']; for (var i = 0; i < 70; i++) { var s = h('i', 'rk-cf'); s.style.left = Math.random() * 100 + 'vw'; s.style.background = C[i % C.length]; s.style.setProperty('--x', (Math.random() * 160 - 80) + 'px'); s.style.setProperty('--r', (Math.random() * 900 - 450) + 'deg'); s.style.setProperty('--d', (1.8 + Math.random() * 1.6) + 's'); s.style.animationDelay = Math.random() * .5 + 's'; document.body.appendChild(s); (function (x) { setTimeout(function () { x.remove(); }, 4200); })(s); } }

  // datos para la cinta: líderes de cada categoría y la mayor subida de la semana
  function facts() { var out = [], E = rowsFor('equipos'), J = rowsFor('jugadores'), G = rowsFor('goleadores'), V = rowsFor('mvp');
    if (E[0]) out.push(['Equipo líder', E[0].t.name + ' · ' + fmt(E[0].v) + ' pts']); if (J[0]) out.push(['Mejor media', J[0].p.name + ' · ' + J[0].v]);
    if (G[0]) out.push(['Máximo goleador', G[0].p.name + ' · ' + G[0].v + ' ⚽']); if (V[0]) out.push(['Más MVP', V[0].p.name + ' · ' + V[0].v + ' ⭐']);
    var P = past('jugadores'); if (P) { var best = null; J.forEach(function (r, i) { var d = P[r.id] == null ? null : P[r.id] - i; if (d > 0 && (!best || d > best.d)) best = { r: r, d: d }; }); if (best) out.push(['Mayor subida', best.r.p.name + ' ▲' + best.d]); }
    if (bitsRows && bitsRows[0]) out.push(['Más Bits', bitsRows[0].display_name + ' · ' + fmt(bitsRows[0].bits)]);
    var gt = G.reduce(function (s, r) { return s + r.g; }, 0); if (gt) out.push(['Goles en la temporada', fmt(gt)]); return out; }
  // ---------- render ----------
  function render() {
    var t = T(); document.body.style.setProperty('--ac', t.c); root.innerHTML = '';
    var hd = h('section', 'rk-h'), tx = h('div'); tx.appendChild(h('div', 'ey', 'Comunidad · Magna Sports')); var h1 = h('h1'); h1.appendChild(h('span', null, 'Ranking')); tx.appendChild(h1);
    tx.appendChild(h('p', null, 'Quién manda en Magna: equipos, jugadores, goleadores, MVP y Bits. Se actualiza solo con cada resultado.')); var dl = h('a', 'rk-dir', '👥 Ver todos los jugadores →'); dl.href = 'jugador.html'; tx.appendChild(dl); hd.appendChild(tx); hd.appendChild(h('div', 'rk-trophy', t.e)); root.appendChild(hd); var tk = facts(); if (tk.length && window.ARENA) root.appendChild(ARENA.ticker(tk, 'RANKING'));
    var tb = h('div', 'rk-tabs'); tb.setAttribute('role', 'tablist');
    TABS.forEach(function (x) { var b = h('button', 'rk-tab' + (x.k === tab ? ' on' : '')); b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', x.k === tab); b.style.setProperty('--tc', x.c); if (x.k === 'bits' && window.MAGNA_BIT) { var be = h('span', 'e'); be.appendChild(MAGNA_BIT('1.1em')); b.appendChild(be); } else b.appendChild(h('span', 'e', x.e)); b.appendChild(h('span', null, x.l));
      b.onclick = function () { if (tab === x.k) return; tab = x.k; q = ''; tf = ''; open = {}; shown = 15; cmp = null; try { history.replaceState(null, '', '#' + tab); } catch (e) {} if (tab === 'bits' && bitsRows === null && !bitsErr) loadBits(); render(); var tt = document.querySelector('.rk-tabs'); if (tt && tt.getBoundingClientRect().top < 60) tt.scrollIntoView({ block: 'start' }); };
      tb.appendChild(b); }); root.appendChild(tb);
    if (tab === 'bits' && bitsErr) { root.appendChild(h('div', 'rk-emp', bitsErr)); return; }
    if (tab === 'bits' && bitsRows === null) { root.appendChild(M.skel(6)); return; }
    var R = rowsFor(tab), P = past(tab);
    if (!R.length) { root.appendChild(h('div', 'rk-emp', { equipos: 'Todavía no hay equipos.', jugadores: 'Todavía no hay jugadores.', goleadores: '⚽ Aún no hay goles. Aparecerán cuando se narren partidos en vivo.', mvp: '🌟 Aún no hay MVP. Se eligen al narrar los partidos.', bits: 'Todavía no hay cuentas de miembros.' }[tab])); return; }
    R.forEach(function (r, i) { r.pos = i + 1; r.d = P ? (P[r.id] == null ? 'new' : P[r.id] - i) : null; });
    meCard(R); podium(R.slice(0, 3)); tools(R); list(R);
    root.appendChild(h('p', 'rk-note', t.hint));
    if (lastTab !== tab) { lastTab = tab; setTimeout(confetti, 450); }
  }
  function meCard(R) { var mi = R.filter(isMe)[0]; if (!mi) return; var t = T(), c = h('div', 'rk-me'); c.appendChild(h('span', 'pos', '#' + mi.pos)); var tx = h('div', 'tx'), above = R[mi.pos - 2];
    tx.appendChild(h('b', null, tab === 'equipos' ? 'Tu equipo · ' + mi.t.name : 'Tu lugar en ' + t.l));
    tx.appendChild(h('small', null, mi.pos === 1 ? '¡Eres el número 1! 👑 Defiende el trono.' : above ? 'Te faltan ' + (tab === 'equipos' || tab === 'bits' ? fmt(above.v - mi.v) : Math.max(0, Math.round((above.v - mi.v) * 10) / 10)) + ' ' + t.unit + ' para alcanzar el puesto ' + (mi.pos - 1) + '.' : ''));
    c.appendChild(tx); var b = h('button', null, 'Ir a mi puesto'); b.type = 'button'; b.onclick = function () { if (mi.pos > shown) { shown = mi.pos + 5; render(); } setTimeout(function () { var el = document.getElementById('rk-' + mi.id); if (el) { el.scrollIntoView({ behavior: RM() ? 'auto' : 'smooth', block: 'center' }); el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); } }, 60); }; c.appendChild(b); root.appendChild(c); }
  function podium(top) { var pod = h('div', 'rk-pod'), order = top.length === 3 ? [1, 0, 2] : top.length === 2 ? [1, 0] : [0]; if (top.length < 3) pod.style.gridTemplateColumns = 'repeat(' + top.length + ',minmax(0,240px))'; pod.style.justifyContent = 'center';
    order.forEach(function (i, k) { var r = top[i], href = hrefOf(r), c = h(href ? 'a' : 'div', 'rk-pc p' + (i + 1)); if (href) c.href = href;
      var w = h('div', 'who ar-sheen'); w.dataset.tilt = '12'; w.style.animationDelay = (0.35 + k * .15) + 's'; var rg = h('div', 'ring'), av = avOf(r, i === 0 ? 108 : 84); av.setAttribute('data-nolink', ''); rg.appendChild(av); w.appendChild(rg);
      var nb = h('b', 'nm'); nb.appendChild(nameOf(r, true)); w.appendChild(nb); w.appendChild(h('small', 'sb', subOf(r)));
      var v = h('div', 'val'), vn = h('span', null, '0'); v.appendChild(vn); v.appendChild(h('small', null, T().unit)); w.appendChild(v); countUp(vn, r.v, tab === 'equipos' || tab === 'bits');
      c.appendChild(w); var st = h('div', 'rk-st', String(i + 1)); st.style.animationDelay = k * .12 + 's'; c.appendChild(st); pod.appendChild(c); });
    root.appendChild(pod); }
  function tools(R) { var bar = h('div', 'rk-tools'), inp = h('input', 'rk-q'); inp.type = 'search'; inp.placeholder = tab === 'equipos' ? 'Buscar equipo…' : 'Buscar jugador o equipo…'; inp.value = q; inp.setAttribute('aria-label', 'Buscar');
    var tmr; inp.oninput = function () { clearTimeout(tmr); tmr = setTimeout(function () { q = inp.value; shown = 15; var pos = inp.selectionStart; render(); var n = document.querySelector('.rk-q'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} } }, 160); }; bar.appendChild(inp);
    if (tab !== 'equipos' && tab !== 'bits') { var sel = h('select', 'rk-sel'); sel.setAttribute('aria-label', 'Filtrar por equipo'); var o0 = h('option', null, 'Todos los equipos'); o0.value = ''; sel.appendChild(o0); var of = h('option', null, 'Agentes libres'); of.value = 'free'; sel.appendChild(of);
      S().teams.forEach(function (t) { var o = h('option', null, t.name); o.value = String(t.id); sel.appendChild(o); }); sel.value = tf; sel.onchange = function () { tf = sel.value; shown = 15; render(); }; bar.appendChild(sel); }
    if (tab !== 'bits') { var cm = h('div', 'rk-cmp'); if (cmp) { cm.appendChild(document.createTextNode('Comparando a ')); cm.appendChild(h('b', null, cmp.t ? cmp.t.name : cmp.p.name)); cm.appendChild(document.createTextNode(': elige a otro con «Comparar».')); var x = h('button', null, 'Cancelar'); x.type = 'button'; x.onclick = function () { cmp = null; render(); }; cm.appendChild(x); } else cm.textContent = '💡 Abre una fila y usa «Comparar» para enfrentar dos ' + (tab === 'equipos' ? 'equipos' : 'jugadores') + '.'; bar.appendChild(cm); }
    root.appendChild(bar);
    if (tab === 'equipos') { var leg = h('div', 'rk-leg'); [['Liga', 'league'], ['Champions', 'champions'], ['Mundial', 'mundial'], ['Otros torneos', 'tournament'], ['Amistoso', 'friendly']].forEach(function (x) { var s = h('span'); s.appendChild(h('b', null, fmt(MAGNA.PTS[x[1]]))); s.appendChild(document.createTextNode(' por ' + x[0].toLowerCase())); leg.appendChild(s); }); root.appendChild(leg); } }
  function list(R) { var k = q.trim().toLowerCase(), F = R.filter(function (r) { if (tf === 'free' && (!r.p || r.p.teamId)) return false; if (tf && tf !== 'free' && (!r.p || String(r.p.teamId) !== tf)) return false; if (!k) return true; var n = (r.t ? r.t.name : r.b ? r.b.display_name : r.p.name) + ' ' + subOf(r); return n.toLowerCase().indexOf(k) >= 0; });
    var L = h('div', 'rk-list'); if (!F.length) { L.appendChild(h('div', 'rk-emp', 'Nadie coincide con tu búsqueda.')); root.appendChild(L); return; }
    var mx = Math.max.apply(null, R.map(function (r) { return r.v; }).concat([1])), bars = [];
    F.slice(0, shown).forEach(function (r, i) { var c = h('div', 'rk-r' + (r.pos <= 3 ? ' top' + r.pos : '') + (isMe(r) ? ' me' : '') + (open[r.id] ? ' open' : '')); c.id = 'rk-' + r.id; c.style.animationDelay = Math.min(i, 14) * 30 + 'ms';
      var row = h('button', 'rk-row'); row.type = 'button'; row.setAttribute('aria-expanded', !!open[r.id]);
      var n = h('div', 'rk-n'); n.appendChild(h('b', null, String(r.pos))); if (r.d === 'new') n.appendChild(h('span', 'rk-d nw', 'NUEVO')); else if (r.d > 0) n.appendChild(h('span', 'rk-d up', '▲' + r.d)); else if (r.d < 0) n.appendChild(h('span', 'rk-d dn', '▼' + (-r.d))); else if (r.d === 0) n.appendChild(h('span', 'rk-d eq', '—')); row.appendChild(n);
      var w = h('div', 'rk-who'), av = avOf(r, 44); av.setAttribute('data-nolink', ''); w.appendChild(av); var tx = h('div'), b = h('b'); b.appendChild(nameOf(r, true)); tx.appendChild(b); tx.appendChild(h('small', null, subOf(r))); w.appendChild(tx); row.appendChild(w);
      var br = h('div', 'rk-bar'), tr = h('div', 't'), fi = h('i'); tr.appendChild(fi); br.appendChild(tr); bars.push([fi, tab === 'jugadores' ? r.v : r.v / mx * 100]); var tg = h('div', 'tg');
      chips(r).forEach(function (x) { tg.appendChild(h('span', null, x)); }); br.appendChild(tg); row.appendChild(br);
      var v = h('div', 'rk-v', valTxt(r)); v.appendChild(h('small', null, T().unit)); row.appendChild(v); row.appendChild(h('span', 'rk-chev', '▾'));
      row.onclick = function () { open[r.id] = !open[r.id]; c.classList.toggle('open', !!open[r.id]); row.setAttribute('aria-expanded', !!open[r.id]); }; c.appendChild(row);
      var x = h('div', 'rk-x'), xi = h('div'), inn = h('div', 'rk-xi'), sts = h('div', 'rk-sts'); stats(r).forEach(function (s) { var d = h('div'); d.appendChild(h('b', null, String(s[0]))); d.appendChild(h('small', null, s[1])); sts.appendChild(d); }); inn.appendChild(sts);
      var ac = h('div', 'rk-acts'), href = hrefOf(r); if (href) { var a = h('a', 'pr', r.t ? 'Ver equipo →' : 'Ver perfil →'); a.href = href; ac.appendChild(a); }
      if (r.t) { var bd = h('button', null, '📊 De dónde salen los puntos'); bd.type = 'button'; bd.onclick = function () { breakdown(r); }; ac.appendChild(bd); }
      if (tab !== 'bits') { var cb = h('button', cmp && cmp.id === r.id ? 'sel' : null, cmp && cmp.id === r.id ? '✓ Elegido' : cmp ? '⚔️ Comparar con ' + (cmp.t ? cmp.t.name : cmp.p.name) : '⚔️ Comparar'); cb.type = 'button'; cb.onclick = function () { if (!cmp) { cmp = r; render(); var el = document.querySelector('.rk-cmp'); if (el) el.scrollIntoView({ behavior: RM() ? 'auto' : 'smooth', block: 'center' }); return; } if (cmp.id === r.id) { cmp = null; render(); return; } compare(cmp, r); }; ac.appendChild(cb); }
      inn.appendChild(ac); xi.appendChild(inn); x.appendChild(xi); c.appendChild(x); L.appendChild(c); });
    root.appendChild(L);
    if (F.length > shown) { var more = h('button', 'rk-more', 'Ver ' + Math.min(20, F.length - shown) + ' más · quedan ' + (F.length - shown)); more.type = 'button'; more.onclick = function () { shown += 20; render(); }; root.appendChild(more); }
    requestAnimationFrame(function () { requestAnimationFrame(function () { bars.forEach(function (x) { x[0].style.width = Math.max(2, Math.min(100, x[1])) + '%'; }); }); });
  }
  function chips(r) { if (tab === 'equipos') return [r.pj + ' PJ', (r.dg > 0 ? '+' : '') + r.dg + ' DG', 'Nivel ' + r.lvl].concat(r.tro ? [r.tro + ' 🏆'] : []);
    if (tab === 'jugadores') { var tr = MAGNA.tierOf(r.media); return [tr.name, r.pj + ' PJ', r.g + ' ⚽', r.mvp + ' ⭐'].concat(r.titles ? [r.titles + ' 🏆'] : []); }
    if (tab === 'goleadores') return [r.pj + ' PJ', (r.pj ? (r.g / r.pj).toFixed(2).replace('.', ',') : '0') + ' por partido'];
    if (tab === 'mvp') return [r.pj + ' PJ', 'Nota ' + (r.nota == null ? '—' : String(r.nota).replace('.', ','))];
    return []; }
  function stats(r) { if (r.t) return [[fmt(r.v), 'Puntos'], [r.pj, 'Partidos'], [r.w + '-' + r.l, 'V-D'], [(r.dg > 0 ? '+' : '') + r.dg, 'Dif. goles'], [r.lvl, 'Nivel'], [r.tro || 0, 'Trofeos']];
    if (r.b && !r.p) return [[fmt(r.v), 'Bits']]; var x = r.media != null ? r : playerBase().filter(function (y) { return y.p.id === r.p.id; })[0] || {};
    return [[x.media, 'Media'], [x.pj, 'Partidos'], [x.w + '-' + x.l, 'V-D'], [x.g, 'Goles'], [x.mvp, 'MVP'], [x.nota == null ? '—' : String(x.nota).replace('.', ','), 'Nota'], [x.titles, 'Títulos']].concat(MAGNA.ballonCount(r.p.id) ? [[MAGNA.ballonCount(r.p.id), 'Balón de Oro']] : []).concat(r.b ? [[fmt(r.v), 'Bits']] : []); }
  function breakdown(r) {
    M.modal(function (b) {
      b.appendChild(h('h3', 'x', r.t.name)); b.appendChild(h('p', 'sub', fmt(r.v) + ' puntos en el ranking'));
      var w = h('div', 'pn tw'), tb = h('table'), th = h('tr'); ['Competición', 'Por partido', 'Puntos'].forEach(function (c) { th.appendChild(h('th', null, c)); }); tb.appendChild(th);
      [['Liga', 'league', 'victoria'], ['Champions', 'champions', 'victoria'], ['Mundial', 'mundial', 'victoria'], ['Otros torneos', 'tournament', 'victoria'], ['Amistosos', 'friendly', 'partido']].concat(r.bd.base ? [['Puntos anteriores', 'base', '']] : []).forEach(function (x) { var tr = h('tr'); tr.appendChild(h('td', null, x[0])); tr.appendChild(h('td', 'n', x[1] === 'base' ? 'De tus registros' : fmt(MAGNA.PTS[x[1]]) + ' por ' + x[2])); tr.appendChild(h('td', 'n', fmt(r.bd[x[1]] || 0))); tb.appendChild(tr); });
      w.appendChild(tb); b.appendChild(w);
    });
  }
  // cara a cara entre dos equipos o dos jugadores
  function compare(a, b) {
    var A = stats(a), B = stats(b), win = { a: 0, b: 0 };
    M.modal(function (bx, close) {
      bx.appendChild(h('h3', 'x cmp-t', '⚔️ Cara a cara'));
      var hd = h('div', 'cmp-h'); [a, b].forEach(function (r, i) { var s = h('div', 's'); s.appendChild(avOf(r, 64)); var nb = h('b'); nb.appendChild(nameOf(r, true)); s.appendChild(nb); s.appendChild(h('small', null, '#' + r.pos + ' en ' + T().l)); hd.appendChild(s); if (i === 0) hd.appendChild(h('span', 'vs', 'VS')); }); bx.appendChild(hd);
      var fills = [];
      A.forEach(function (sa, i) { var sb = B[i]; if (!sb) return; var na = parseFloat(String(sa[0]).replace(/\./g, '').replace(',', '.')), nb2 = parseFloat(String(sb[0]).replace(/\./g, '').replace(',', '.'));
        if (/-/.test(String(sa[0])) && /V-D/.test(sa[1])) { var pa = String(sa[0]).split('-'), pb = String(sb[0]).split('-'); na = Number(pa[0]) / Math.max(1, Number(pa[0]) + Number(pa[1])) * 100; nb2 = Number(pb[0]) / Math.max(1, Number(pb[0]) + Number(pb[1])) * 100; }
        if (isNaN(na)) na = 0; if (isNaN(nb2)) nb2 = 0; var mx = Math.max(na, nb2, 1), r = h('div', 'cmp-r'), va = h('span', 'v' + (na > nb2 ? ' w' : ''), String(sa[0])), vb = h('span', 'v' + (nb2 > na ? ' w' : ''), String(sb[0])); if (na > nb2) win.a++; else if (nb2 > na) win.b++;
        var mid = h('div', 'cmp-b'); mid.appendChild(h('small', null, sa[1])); var tr = h('div', 'tr'), l = h('span'), li = h('i'), rr = h('span'), ri = h('i'); l.appendChild(li); rr.appendChild(ri); tr.appendChild(l); tr.appendChild(rr); mid.appendChild(tr); fills.push([li, na / mx * 100], [ri, nb2 / mx * 100]);
        r.appendChild(va); r.appendChild(mid); r.appendChild(vb); bx.appendChild(r); });
      var nmA = a.t ? a.t.name : a.p.name, nmB = b.t ? b.t.name : b.p.name;
      bx.appendChild(h('p', 'cmp-win', win.a === win.b ? '🤝 Empate técnico: ' + win.a + ' a ' + win.b + ' en estadísticas.' : '🏆 ' + (win.a > win.b ? nmA : nmB) + ' gana ' + Math.max(win.a, win.b) + ' de ' + (win.a + win.b) + ' estadísticas.'));
      requestAnimationFrame(function () { requestAnimationFrame(function () { fills.forEach(function (f) { f[0].style.width = Math.max(0, Math.min(100, f[1])) + '%'; }); }); });
    });
    cmp = null; render();
  }
  function loadBits() {
    if (!window.MAGNA_SB || MAGNA.cloud.source !== 'cloud') { bitsErr = 'El ranking de Bits necesita conexión con la base de datos.'; return render(); }
    window.MAGNA_SB().then(function (sb) { return sb.rpc('bits_ranking'); }).then(function (r) { if (r.error) throw r.error; bitsRows = r.data || []; if (tab === 'bits') render(); }, function () { bitsErr = 'No se pudo cargar el ranking de Bits. Recarga la página.'; if (tab === 'bits') render(); });
  }
  var hs = location.hash.slice(1); if (TABS.some(function (k) { return k.k === hs; })) tab = hs;
  function boot() { render(); if (tab === 'bits') loadBits(); if (window.ACCOUNTS) ACCOUNTS.me().then(function (a) { me = a; if (a) render(); }, function () {}); }
  window.addEventListener('magna:update', function () { pastCache = {}; if (tab !== 'bits' && !document.querySelector('.ov')) render(); });
  if (document.readyState === 'complete') boot(); else addEventListener('load', boot);
})();
