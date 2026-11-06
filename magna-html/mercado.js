'use strict';
(function () {
  var h = M.h, all = [], f = 'all', q = '', ch = document.getElementById('ch');
  [['all', 'Todos'], ['free', 'Agentes libres'], ['team', 'Con equipo']].forEach(function (k) { var b = h('button', 'chip' + (k[0] === f ? ' on' : ''), k[1]); b.onclick = function () { f = k[0]; [].forEach.call(ch.children, function (x) { x.classList.toggle('on', x === b); }); draw(); }; ch.appendChild(b); });
  document.getElementById('q').addEventListener('input', function (e) { q = e.target.value.trim().toLowerCase(); draw(); });
  function draw() {
    var g = document.getElementById('g'); g.innerHTML = '';
    var l = all.filter(function (p) { return (f === 'all' || (f === 'free') === !p.team) && (!q || p.name.toLowerCase().indexOf(q) >= 0); });
    if (!l.length) { g.appendChild(h('p', 'em', all.length ? 'Ningún jugador coincide.' : 'Todavía no hay jugadores registrados.')); return; }
    l.forEach(function (p, i) {
      var c = h('article', 'tc'); c.style.cursor = 'default'; c.style.animationDelay = Math.min(i, 12) * 35 + 'ms'; c.style.setProperty('--bar', p.team ? '#2ee59d' : '#ffd23f'); c.style.setProperty('--tint', M.tint(p.id));
      var lg = h('div', 'lg mono'); lg.appendChild(h('span', null, p.team ? (p.slot === 'reserve' ? 'Suplente' : 'Titular') : 'Agente libre')); lg.appendChild(h('span', null, '#' + p.id)); c.appendChild(lg);
      var av = h('div', 'cr'); av.style.cssText = 'width:84px;height:84px;font-size:28px;margin:0 auto 12px'; av.textContent = p.name.slice(0, 2).toUpperCase(); c.appendChild(av);
      c.appendChild(h('h3', 'x', p.name)); c.appendChild(h('p', 'sub', p.team || 'Sin equipo')).style.margin = '0 0 12px';
      var rk = h('div', 'ranks'); [[p.avg_rating == null ? '—' : p.avg_rating, 'Media'], [p.mvp, 'MVP'], [p.salary_bits == null ? '—' : p.salary_bits, 'Bits']].forEach(function (x) { var d = h('div', 'rk'); d.appendChild(h('b', null, x[0])); d.appendChild(h('span', 'mono', x[1])); rk.appendChild(d); }); c.appendChild(rk); g.appendChild(c);
    });
  }
  M.get('/api/public/market').then(function (d) { all = d.players; draw(); });
})();
