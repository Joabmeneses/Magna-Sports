'use strict';
// Eventos: el centro de todas las competiciones (Champions, OmegaCup, Supernova, Mundial, ligas, torneos e historial)
(function () {
  var $ = function (s) { return document.querySelector(s); };
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function S() { return MAGNA.S; }
  function fdt(s) { try { return window.M && M.fdt ? M.fdt(s) : s; } catch (e) { return s || ''; } }
  var NOVA = /super\s*nova|star\s*nova/i, OMEGA = /omega/i;
  function crest(id) { var c = el('span', 'cr'); if (id == null) { c.textContent = '?'; return c; } var u = MAGNA.crestUrl(id); c.style.setProperty('--tc', MAGNA.teamColor ? MAGNA.teamColor(id) : '#5a5080');
    if (u) { var im = el('img'); im.src = u; im.alt = ''; im.loading = 'lazy'; im.onerror = function () { im.remove(); c.textContent = String(MAGNA.teamName(id)).slice(0, 2).toUpperCase(); }; c.appendChild(im); } else c.textContent = String(MAGNA.teamName(id)).slice(0, 2).toUpperCase(); return c; }
  // la edición que se muestra: la activa más reciente, si no la última
  function latest(L) { return L.filter(function (c) { return c.status === 'active'; }).slice(-1)[0] || L[L.length - 1] || null; }
  function tms(c, type) { return (S().matches || []).filter(function (m) { return m.type === (type || 'tournament') && m.cid === c.id && m.status !== 'cancelled'; }); }
  function champ(c) { var st = c.state || {}; if (st.champion != null) return st.champion; if (c.format === 'knockout' && c.legs === 2 && MAGNA.koTies) { var R = MAGNA.koTies(c), f = R && R[R.length - 1]; if (f && f.ties[0] && f.ties[0].win != null) return f.ties[0].win; } return null; }
  function phase(c) { var st = c.state || {}; if (champ(c) != null || st.phase === 'done') return 'Terminado'; if (!st.phase) return c.status === 'active' ? 'Por sortear' : 'Próximamente';
    if (st.phase === 'groups') return c.format === 'champions' ? 'Fase de liga' : 'Fase de grupos'; if (st.phase === 'playoff') return 'Play-off'; if (st.phase === 'league') return 'Todos contra todos'; return st.round || 'Eliminatoria'; }
  function link(c) { return c.format === 'groups_knockout' ? 'mundial.html' : c.format === 'champions' ? 'champions.html?t=' + c.id : c.format === 'knockout' && NOVA.test(c.name) ? 'supernova.html?t=' + c.id : c.format === 'knockout' && (c.legs === 2 || OMEGA.test(c.name)) ? 'copa.html?t=' + c.id : 'competiciones.html'; }
  function compOf(m) { if (m.type === 'league') { var l = MAGNA.by(S().leagues || [], m.cid); return l ? { name: l.name, color: '#8b5cf6', href: 'ligas.html' } : null; }
    if (m.type !== 'tournament') return null; var c = MAGNA.by(S().tournaments || [], m.cid); if (!c) return null;
    var col = c.format === 'champions' ? '#22d3ee' : c.format === 'groups_knockout' ? '#2ee59d' : NOVA.test(c.name) ? '#8f7bff' : OMEGA.test(c.name) || c.legs === 2 ? '#ff6a1a' : '#ffd23f'; return { name: c.name, color: col, href: link(c) }; }
  // tarjeta de una competición con edición (torneo)
  function card(o) {
    var a = el('a', 'cc' + (o.big ? ' big' : '')); a.href = o.href; a.style.setProperty('--c', o.color); a.style.animationDelay = o.i * 70 + 'ms';
    var bg = el('div', 'bg'); bg.style.setProperty('--bg', o.bg); a.appendChild(bg); if (o.tro) { var t = el('img', 'tr'); t.src = o.tro; t.alt = ''; t.loading = 'lazy'; a.appendChild(t); }
    a.appendChild(el('span', 'st' + (o.live ? ' live' : o.on ? ' on' : ''), o.live ? 'En vivo' : o.status)); a.appendChild(el('h3', null, o.title)); if (o.ed) a.appendChild(el('div', 'ed', o.ed));
    if (o.ch != null) { var ch = el('div', 'ch'); ch.appendChild(crest(o.ch)); ch.appendChild(el('span', null, '🏆 Campeón: ' + MAGNA.teamName(o.ch))); a.appendChild(ch); }
    if (o.inf && o.inf.length) { var inf = el('div', 'inf'); o.inf.forEach(function (x) { inf.appendChild(el('span', null, x)); }); a.appendChild(inf); }
    if (o.chips && o.chips.length) { var cp = el('div', 'chips'); o.chips.forEach(function (x) { cp.appendChild(el('span', null, x)); }); a.appendChild(cp); }
    if (o.p != null) { var bar = el('div', 'bar'), i = el('i'); i.style.setProperty('--p', o.p + '%'); bar.appendChild(i); a.appendChild(bar); }
    a.appendChild(el('span', 'go', o.cta)); return a; }
  function cupCard(o, c) {
    if (!c) { o.status = 'Próxima edición'; o.inf = [o.empty]; return card(o); }
    var ms = tms(c), fin = ms.filter(function (m) { return m.status === 'finished'; }).length, live = ms.some(function (m) { return m.status === 'live'; }), ch = champ(c), nx = ms.filter(function (m) { return m.status === 'scheduled' && m.at; }).sort(function (a, b) { return String(a.at).localeCompare(String(b.at)); })[0];
    o.href = link(c); o.ed = c.name; o.live = live; o.on = c.status === 'active' && ch == null; o.status = ch != null ? 'Terminado' : c.status === 'active' ? 'En juego · ' + phase(c) : phase(c); o.ch = ch;
    o.inf = [(c.teamIds || []).length + ' equipos', fin + '/' + ms.length + ' partidos'].concat(nx && ch == null ? ['⏭ ' + fdt(nx.at)] : []); o.p = ms.length ? Math.round(fin / ms.length * 100) : 0; return card(o); }
  function render() {
    var T = S().tournaments || [], Lg = S().leagues || [], M0 = S().matches || [];
    var champs = T.filter(function (c) { return c.format === 'champions'; }), omega = T.filter(function (c) { return c.format === 'knockout' && !NOVA.test(c.name) && (OMEGA.test(c.name) || c.legs === 2); }), nova = T.filter(function (c) { return c.format === 'knockout' && NOVA.test(c.name); }), mund = T.filter(function (c) { return c.format === 'groups_knockout'; });
    var actT = T.filter(function (c) { return c.status === 'active'; }).length, actL = Lg.filter(function (l) { return l.status === 'active'; }), lives = M0.filter(function (m) { return m.status === 'live' && (m.type === 'tournament' || m.type === 'league'); });
    var ks = $('#ks'); ks.innerHTML = ''; [[actT + actL.length, 'En juego', '#c6ff1a'], [lives.length, 'En vivo ahora', '#ff5c7a'], [T.length + Lg.length, 'Competiciones', '#b18cff'], [(S().history || []).length, 'En el historial', '#ffd23f']].forEach(function (x, i) {
      var k = el('div', 'k'); k.style.setProperty('--c', x[2]); k.style.animationDelay = i * 70 + 'ms'; k.appendChild(el('b', null, String(x[0]))); k.appendChild(el('span', null, x[1])); ks.appendChild(k); });
    // en vivo
    var lv = $('#lv'); lv.innerHTML = ''; lives.forEach(function (m) { var cp = compOf(m), a = el('a', 'lvc'); a.href = 'partido.html?id=' + m.id; a.appendChild(el('span', 't', cp ? cp.name : 'En vivo')); a.appendChild(crest(m.home)); a.appendChild(el('b', null, MAGNA.teamName(m.home))); a.appendChild(el('em', null, (m.hs || 0) + ' - ' + (m.as || 0))); a.appendChild(el('b', null, MAGNA.teamName(m.away))); a.appendChild(crest(m.away)); lv.appendChild(a); }); lv.hidden = !lives.length;
    // tarjetas
    var g = $('#cg'); g.innerHTML = ''; var i = 0;
    g.appendChild(cupCard({ i: i++, big: true, title: 'Champions', color: '#22d3ee', bg: 'url("img/bn-champions.webp")', tro: 'trofeos/champions.webp', cta: 'Tabla y cuadro', href: 'champions.html', empty: 'La próxima Champions se anunciará pronto' }, latest(champs)));
    g.appendChild(cupCard({ i: i++, title: 'OmegaCup', color: '#ff8a3d', bg: 'url("img/bn-omega-sm.webp")', tro: 'trofeos/omegacup.webp', cta: 'Ver el cuadro', href: 'copa.html', empty: 'Llaves a ida y vuelta' }, latest(omega)));
    g.appendChild(cupCard({ i: i++, title: 'Supernova', color: '#9f8bff', bg: 'url("img/bn-starnova-sm.webp")', tro: 'trofeos/supernova.webp', cta: 'Ver el cuadro', href: 'supernova.html', empty: 'Cruces a partido único' }, latest(nova)));
    g.appendChild(cupCard({ i: i++, title: 'Mundial', color: '#2ee59d', bg: 'radial-gradient(circle at 70% 20%,#1f8a5f,#0b2a1f 60%,#081610)', tro: 'trofeos/mundial.webp', cta: 'Grupos y eliminatoria', href: 'mundial.html', empty: 'Grupos + eliminatoria' }, latest(mund)));
    var lm = M0.filter(function (m) { return m.type === 'league' && m.status !== 'cancelled'; }), lf = lm.filter(function (m) { return m.status === 'finished'; }).length;
    g.appendChild(card({ i: i++, title: 'Ligas', color: '#b18cff', bg: 'radial-gradient(circle at 70% 20%,#5b3bc4,#1d1450 60%,#100c2a)', tro: 'trofeos/liga.webp', cta: 'Ver las tablas', href: 'ligas.html', on: actL.length > 0, live: lm.some(function (m) { return m.status === 'live'; }),
      status: actL.length ? actL.length + (actL.length === 1 ? ' liga en juego' : ' ligas en juego') : 'Sin ligas activas', ed: actL.length ? 'Primera, Segunda y Tercera división' : 'Pronto vuelven las divisiones', chips: actL.map(function (l) { return l.name; }).slice(0, 4), inf: lm.length ? [lf + '/' + lm.length + ' partidos'] : [], p: lm.length ? Math.round(lf / lm.length * 100) : null }));
    var others = T.filter(function (c) { return champs.indexOf(c) < 0 && omega.indexOf(c) < 0 && nova.indexOf(c) < 0 && mund.indexOf(c) < 0; });
    g.appendChild(card({ i: i++, big: true, title: 'Torneos', color: '#ffd23f', bg: 'radial-gradient(circle at 80% 10%,#8a5a00,#2a1a06 55%,#140d05)', tro: 'trofeos/copa-de-oro.webp', cta: 'Todos los torneos', href: 'competiciones.html', on: actT > 0,
      status: actT ? actT + (actT === 1 ? ' torneo en juego' : ' torneos en juego') : 'Todos los torneos', ed: 'Cruces, grupos y resultados de cada torneo', chips: T.filter(function (c) { return c.status === 'active'; }).map(function (c) { return c.name; }).concat(others.filter(function (c) { return c.status !== 'active'; }).map(function (c) { return c.name; })).slice(0, 6), inf: [T.length + (T.length === 1 ? ' torneo creado' : ' torneos creados')] }));
    var H = S().history || []; g.appendChild(card({ i: i++, title: 'Historial', color: '#ff6fb1', bg: 'radial-gradient(circle at 70% 20%,#7a1f55,#2a0c1f 60%,#14060f)', tro: 'trofeos/copa-del-rey.webp', cta: 'Ver el palmarés', href: 'competiciones.html#historial', status: 'Palmarés', ed: 'Campeones y ediciones pasadas', inf: [H.length + (H.length === 1 ? ' edición' : ' ediciones')] }));
    $('#cnt').textContent = (actT + actL.length) + ' en juego';
    // próximos partidos
    var nx = $('#nx'); nx.innerHTML = ''; var up = M0.filter(function (m) { return m.status === 'scheduled' && m.at && (m.type === 'tournament' || m.type === 'league'); }).sort(function (a, b) { return String(a.at).localeCompare(String(b.at)); }).slice(0, 6);
    if (!up.length) nx.appendChild(el('div', 'empty', 'No hay partidos programados por ahora.'));
    up.forEach(function (m) { var cp = compOf(m) || { name: 'Partido', color: '#8b5cf6' }, a = el('a', 'mc'); a.href = 'partido.html?id=' + m.id; a.style.setProperty('--c', cp.color);
      var h = el('div', 't'); h.appendChild(crest(m.home)); h.appendChild(el('span', null, MAGNA.teamName(m.home))); var mid = el('div', 'm'); mid.appendChild(el('small', 'c', cp.name)); mid.appendChild(el('b', null, 'VS')); mid.appendChild(el('small', null, fdt(m.at)));
      var aw = el('div', 't r'); aw.appendChild(crest(m.away)); aw.appendChild(el('span', null, MAGNA.teamName(m.away))); a.appendChild(h); a.appendChild(mid); a.appendChild(aw); nx.appendChild(a); });
  }
  render(); window.addEventListener('magna:update', render);
})();
