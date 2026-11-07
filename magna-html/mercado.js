'use strict';
(function () {
  var h = M.h, all = [], f = 'all', q = '', ch = document.getElementById('ch');
  // estado del mercado
  function mkt() { var box = document.getElementById('mkt'); if (!box) return; var ms = MAGNA.marketState(); box.innerHTML = ''; box.className = 'mkt' + (ms.open ? ' on' : '');
    box.appendChild(h('i', 'dot')); var t = h('div'); t.appendChild(h('b', null, ms.open ? 'Mercado abierto' : 'Mercado cerrado')); t.appendChild(document.createElement('br'));
    t.appendChild(h('span', null, ms.open ? (ms.closes ? 'Los equipos pueden fichar hasta el ' + M.fdt(ms.closes) + '.' : 'Los equipos pueden fichar jugadores libres de su nivel.') : 'Por ahora no hay fichajes. La administración avisará cuando se abra.')); box.appendChild(t);
    if (ms.open && ms.closes) { var cd = h('span', 'cd'); box.appendChild(cd); (function tick() { var s = Math.max(0, Math.floor((Date.parse(ms.closes.replace(' ', 'T') + 'Z') - Date.now()) / 1000)); if (!document.body.contains(cd)) return; if (!s) return mkt(); var d = Math.floor(s / 86400), hh = Math.floor(s % 86400 / 3600), mm = Math.floor(s % 3600 / 60), ss = s % 60; cd.textContent = 'Cierra en ' + (d ? d + 'd ' : '') + String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0') + ':' + String(ss).padStart(2, '0'); setTimeout(tick, 1000); })(); } }
  mkt(); window.addEventListener('magna:update', mkt);
  // niveles
  var tw = document.getElementById('tiers');
  MAGNA.TIERS.forEach(function (t) { var s = h('span'); s.style.setProperty('--c', t[3]); s.appendChild(h('i')); s.appendChild(document.createTextNode(t[1] + (t[2] ? ' · media ' + t[2] + '+' : ' · menos de ' + MAGNA.TIERS[1][2]))); tw.appendChild(s); });
  [['all', 'Todos'], ['free', 'Agentes libres'], ['team', 'Con equipo']].concat(MAGNA.TIERS.map(function (t) { return ['t:' + t[0], t[1]]; })).forEach(function (k) { var b = h('button', 'chip' + (k[0] === f ? ' on' : ''), k[1]); b.onclick = function () { f = k[0]; [].forEach.call(ch.children, function (x) { x.classList.toggle('on', x === b); }); draw(); }; ch.appendChild(b); });
  document.getElementById('q').addEventListener('input', function (e) { q = e.target.value.trim().toLowerCase(); draw(); });
  function badge(t) { var b = h('span', 'tb2', t.name); b.style.setProperty('--c', t.color); return b; }
  function profile(p) {
    M.modal(function (b) {
      var hd = h('div'); hd.style.cssText = 'display:flex;gap:18px;align-items:center;flex-wrap:wrap'; var md = h('div', 'big', p.avg_rating == null ? '—' : p.avg_rating); md.style.setProperty('--c', p.tier.color); hd.appendChild(md);
      var x = h('div'); x.appendChild(h('h3', 'x', p.name)); var sub = h('p', 'sub', (p.team || 'Agente libre') + (p.slot === 'reserve' ? ' · Suplente' : p.team ? ' · Titular' : '') + '  '); sub.style.margin = '4px 0'; sub.appendChild(badge(p.tier)); x.appendChild(sub); hd.appendChild(x); b.appendChild(hd);
      var st = h('div', 'pst'); if (window.ACCOUNTS) ACCOUNTS.playerBits().then(function (o) { if (o[p.id] == null) return; var d = h('div'); d.appendChild(h('b', null, Number(o[p.id]).toLocaleString('es'))); d.appendChild(h('span', null, 'Bits')); st.appendChild(d); });
      [[p.matches, 'Partidos'], [p.titles.length, p.titles.length === 1 ? 'Título' : 'Títulos'], [p.wins + 'V · ' + p.losses + 'D', 'Récord'], [p.top_wins, 'Victorias vs fuertes'], [p.nota == null ? '—' : String(p.nota).replace('.', ','), 'Nota media'], [p.goals, 'Goles'], [p.mvp, 'MVP']].forEach(function (k) { var d = h('div'); d.appendChild(h('b', null, k[0])); d.appendChild(h('span', null, k[1])); st.appendChild(d); }); b.appendChild(st);
      if (p.titles.length) b.appendChild(h('p', 'sub', '🏆 Campeón de ' + p.titles.join(', ') + '. Sus títulos le aseguran una media de al menos ' + p.floor + '.'));
      if (p.salary_bits != null) b.appendChild(h('p', 'sub', 'Contrato: ' + p.salary_bits + ' Bits'));
      var games = (MAGNA.playerStats()[p.id] || {}).games || [];
      b.appendChild(h('h2', 'x', 'Últimos partidos'));
      if (!games.length) b.appendChild(h('p', 'em', 'Todavía no tiene partidos narrados en vivo.'));
      var ml = h('div', 'pn'); games.slice(-6).reverse().forEach(function (id) { var m = MAGNA.by(MAGNA.S.matches, id); if (!m) return; var gl = (m.live.ev || []).filter(function (e) { return e.k === 'goal' && e.player === p.id; }).length, r = h('div'); r.appendChild(h('b', null, MAGNA.teamName(m.home) + ' ' + m.hs + ' - ' + m.as + ' ' + MAGNA.teamName(m.away))); r.appendChild(h('time', null, (gl ? '⚽ ' + gl + ' gol' + (gl > 1 ? 'es' : '') + ' · ' : '') + (m.live.mvp === p.id ? '⭐ MVP · ' : '') + (m.live.ratings && m.live.ratings[p.id] != null ? 'Nota ' + String(m.live.ratings[p.id]).replace('.', ',') + ' · ' : '') + M.fdt(m.at))); ml.appendChild(r); }); if (games.length) b.appendChild(ml);
    });
  }
  function top() {
    var t = document.getElementById('scorers'); t.innerHTML = ''; var l = all.filter(function (p) { return p.goals > 0; }).sort(function (a, b) { return b.goals - a.goals || a.matches - b.matches; }).slice(0, 10);
    if (!l.length) { t.appendChild(h('p', 'em', 'Aún no hay goles registrados. Aparecerán cuando se narren partidos en vivo.')); return; }
    var g = h('div', 'gl'); l.forEach(function (p, i) { var r = h('div', 'gr'); r.style.animationDelay = i * 40 + 'ms'; r.appendChild(h('span', 'n', i + 1)); var w = h('div'); w.appendChild(h('b', null, p.name)); w.appendChild(h('small', null, (p.team || 'Agente libre') + ' · ' + p.matches + ' PJ')); r.appendChild(w); r.appendChild(badge(p.tier)); var gg = h('div', 'g', p.goals); gg.appendChild(h('small', null, 'GOLES')); r.appendChild(gg); r.onclick = function () { profile(p); }; g.appendChild(r); }); t.appendChild(g);
  }
  function draw() {
    var g = document.getElementById('g'); g.innerHTML = '';
    var l = all.filter(function (p) { return (f === 'all' || (f === 'free' && !p.team) || (f === 'team' && p.team) || (f.indexOf('t:') === 0 && p.tier.id === f.slice(2))) && (!q || p.name.toLowerCase().indexOf(q) >= 0); }).sort(function (a, b) { return (b.avg_rating || 0) - (a.avg_rating || 0); });
    if (!l.length) { g.appendChild(h('p', 'em', all.length ? 'Ningún jugador coincide.' : 'Todavía no hay jugadores registrados.')); return; }
    l.forEach(function (p, i) {
      var c = h('article', 'tc'); c.style.animationDelay = Math.min(i, 12) * 35 + 'ms'; c.style.setProperty('--bar', p.tier.color); c.style.setProperty('--tint', M.tint(p.id));
      var lg = h('div', 'lg mono'); lg.appendChild(h('span', null, p.team ? (p.slot === 'reserve' ? 'Suplente' : 'Titular') : 'Agente libre')); lg.appendChild(badge(p.tier)); c.appendChild(lg);
      var av = h('div', 'cr'); av.style.cssText = 'width:84px;height:84px;font-size:28px;margin:0 auto 12px'; av.textContent = p.name.slice(0, 2).toUpperCase(); c.appendChild(av);
      c.appendChild(h('h3', 'x', p.name)); c.appendChild(h('p', 'sub', p.team || 'Sin equipo')).style.margin = '0 0 12px';
      var rk = h('div', 'ranks'); [[p.avg_rating == null ? '—' : p.avg_rating, 'Media'], [p.goals, 'Goles'], [p.mvp, 'MVP']].forEach(function (x) { var d = h('div', 'rk'); d.appendChild(h('b', null, x[0])); d.appendChild(h('span', 'mono', x[1])); rk.appendChild(d); }); c.appendChild(rk);
      c.onclick = function () { profile(p); }; g.appendChild(c);
    });
  }
  M.get('/api/public/market').then(function (d) { all = d.players; top(); draw(); });
})();
