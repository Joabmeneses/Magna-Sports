'use strict';
// Transmisiones: el partido en vivo (o el próximo) con su reproductor, lo que viene y las repeticiones.
(function () {
  var h = M.h, root = document.getElementById('tr'), pick = null, PS = { youtube: ['yt', 'YouTube'], twitch: ['tw', 'Twitch'], kick: ['ki', 'Kick'] };
  function S() { return MAGNA.S; }
  function nm(t) { return MAGNA.teamName(t); }
  function comp(m) { var c = MAGNA.compOf(m); return [c ? c.name : 'Amistoso', m.round].filter(Boolean).join(' · '); }
  function list() { return S().matches.filter(function (m) { return m.stream && m.status !== 'cancelled' && MSTREAM.ok(m.stream); }); }
  function byAt(a, b) { return String(a.at || '').localeCompare(String(b.at || '')); }
  function sec(t, right) { var s = h('div', 'tr-sh'), h2 = h('h2'), i = t.lastIndexOf(' '); h2.appendChild(document.createTextNode(t.slice(0, i + 1))); h2.appendChild(h('span', null, t.slice(i + 1))); s.appendChild(h2); if (right) s.appendChild(h('small', null, right)); root.appendChild(s); }
  function card(m) { var s = MSTREAM.parse(m.stream), P = PS[s.k], c = h('button', 'tr-c' + (pick === m.id ? ' on' : '')); c.type = 'button'; c.style.setProperty('--pc', m.status === 'live' ? '#ff3b30' : m.status === 'finished' ? '#c6ff1a' : '#8b5cf6');
    c.appendChild(h('span', 'pl ' + P[0], P[1])); c.appendChild(h('span', 'cp', comp(m)));
    var mt = h('div', 'mt'); [[m.home, ''], null, [m.away, ' a']].forEach(function (x) { if (!x) { mt.appendChild(h('strong', null, m.status === 'scheduled' ? 'VS' : (m.hs || 0) + '-' + (m.as || 0))); return; } var t = h('div', 't' + x[1]); t.appendChild(M.crest(x[0], nm(x[0]), 26)); t.appendChild(h('b', null, nm(x[0]))); mt.appendChild(t); }); c.appendChild(mt);
    var ft = h('div', 'ft'); ft.appendChild(h('span', null, m.status === 'live' ? '● En vivo' : m.at ? M.fdt(m.at) : 'Sin fecha')); ft.appendChild(h('i', null, m.status === 'finished' ? '▶ Repetición' : m.status === 'live' ? '📺 Ver' : '⏰ Próximo')); c.appendChild(ft);
    c.onclick = function () { pick = m.id; render(); scrollTo({ top: 0, behavior: 'smooth' }); }; return c; }
  function render() {
    root.innerHTML = ''; var L = list(), live = L.filter(function (m) { return m.status === 'live'; }), up = L.filter(function (m) { return m.status === 'scheduled'; }).sort(byAt), past = L.filter(function (m) { return m.status === 'finished'; }).sort(byAt).reverse();
    var cur = (pick && L.filter(function (m) { return m.id === pick; })[0]) || live[0] || past[0] || up[0] || null;
    var hd = h('section', 'tr-h'); hd.appendChild(h('span', 'tr-ey' + (live.length ? ' on' : ''), live.length ? live.length + ' en vivo ahora' : 'Transmisiones · Magna Sports'));
    var h1 = h('h1'); h1.appendChild(document.createTextNode('Míralo ')); h1.appendChild(h('span', null, 'en vivo')); hd.appendChild(h1);
    hd.appendChild(h('p', null, 'Los partidos de Magna que se transmiten por YouTube, Twitch o Kick, aquí mismo. Y si te lo perdiste, la repetición.')); root.appendChild(hd);
    if (!cur) { var e = h('div', 'tr-e tr-st', '📺 Todavía no hay transmisiones. Cuando un partido tenga transmisión, aparece aquí y debajo del marcador en Partidos.'); root.appendChild(e); return; }
    var nw = h('div', 'tr-now tr-st'); nw.appendChild(MSTREAM.player(cur.stream));
    var inf = h('div', 'tr-in' + (cur.status === 'live' ? '' : ' off')); inf.appendChild(h('small', null, cur.status === 'live' ? '● En vivo ahora' : cur.status === 'finished' ? 'Repetición' : 'Próxima transmisión')); inf.appendChild(h('h3', null, comp(cur)));
    [cur.home, cur.away].forEach(function (t, i) { var r = h('div', 'tr-vs'); r.appendChild(M.crest(t, nm(t), 30)); r.appendChild(h('b', null, nm(t))); if (cur.status !== 'scheduled') r.appendChild(h('em', null, String(i ? cur.as || 0 : cur.hs || 0))); inf.appendChild(r); });
    if (cur.status === 'scheduled' && cur.at) inf.appendChild(h('small', null, '📅 ' + M.fdt(cur.at)));
    var a = h('a', null, cur.status === 'live' ? 'Ver el marcador en vivo →' : 'Ficha del partido →'); a.href = cur.status === 'live' ? 'partidos.html?m=' + cur.id : 'partido.html?id=' + cur.id; inf.appendChild(a); nw.appendChild(inf); root.appendChild(nw);
    if (live.length > 1) { sec('En vivo ahora', live.length + ''); var g0 = h('div', 'tr-g'); live.forEach(function (m) { g0.appendChild(card(m)); }); root.appendChild(g0); }
    if (up.length) { sec('Próximas transmisiones', up.length + ''); var g1 = h('div', 'tr-g'); up.slice(0, 12).forEach(function (m) { g1.appendChild(card(m)); }); root.appendChild(g1); }
    sec('Las repeticiones', past.length + (past.length === 1 ? ' partido' : ' partidos'));
    if (past.length) { var g2 = h('div', 'tr-g'); past.forEach(function (m) { g2.appendChild(card(m)); }); root.appendChild(g2); } else root.appendChild(h('div', 'tr-e', 'Las repeticiones aparecen cuando un partido terminado tiene enlace.'));
  }
  var q = /[?&]m=(\d+)/.exec(location.search); if (q) pick = Number(q[1]);
  var rt = null; window.addEventListener('magna:update', function () { clearTimeout(rt); rt = setTimeout(render, 300); });
  render();
})();
