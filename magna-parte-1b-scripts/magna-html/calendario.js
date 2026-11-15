'use strict';
(function () {
  var h = M.h, filter = '', data = null;
  function row(m, i) {
    var e = h('article', 'm'); e.style.animationDelay = i * 30 + 'ms';
    var l = h('div'); l.appendChild(h('b', null, M.fdt(m.starts_at))); l.appendChild(h('small', null, m.competition + (m.round ? ' · ' + m.round : ''))); e.appendChild(l);
    var t = h('div', 'tt'); t.appendChild(h('b', null, m.home)); t.appendChild(m.status === 'finished' ? h('span', 'sc', m.home_score + ' - ' + m.away_score) : h('span', 'vs', 'vs')); t.appendChild(h('b', null, m.away)); e.appendChild(t);
    e.appendChild(m.status === 'live' ? h('span', 'lv', '● En vivo') : m.status === 'cancelled' ? h('span', 'cx', 'Cancelado') : h('span')); return e;
  }
  function draw() {
    [['u', data.upcoming, 'No hay partidos programados.'], ['r', data.recent, 'Aún no hay resultados.']].forEach(function (k) {
      var c = document.getElementById(k[0]); c.innerHTML = ''; var l = k[1].filter(function (m) { return !filter || m.competition === filter; });
      if (!l.length) c.appendChild(h('p', 'em', k[2])); l.forEach(function (m, i) { c.appendChild(row(m, i)); });
    });
  }
  M.get('/api/public/calendar').then(function (d) {
    data = d; var names = []; d.upcoming.concat(d.recent).forEach(function (m) { if (names.indexOf(m.competition) < 0) names.push(m.competition); });
    var ch = document.getElementById('ch');
    if (names.length > 1) ['Todas'].concat(names).forEach(function (n, i) { var b = h('button', 'chip' + (i ? '' : ' on'), n); b.onclick = function () { filter = i ? n : ''; [].forEach.call(ch.children, function (x) { x.classList.toggle('on', x === b); }); draw(); }; ch.appendChild(b); });
    draw();
  });
})();
