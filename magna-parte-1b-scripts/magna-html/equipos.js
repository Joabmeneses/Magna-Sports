'use strict';
(function () {
  var h = M.h, COL = ['#8b5cf6', '#2ee59d', '#ffd23f', '#ff6fb1', '#4aa8ff'], teams = [], info = {}, filter = '', q = '';
  function detail(t) {
    M.modal(function (b) {
      var hd = h('div'); hd.style.cssText = 'display:flex;gap:16px;align-items:center'; hd.appendChild(M.crest(t.id, t.name, 84, t.has_crest));
      var x = h('div'); x.appendChild(h('h3', 'x', t.name)); x.appendChild(h('p', 'sub', 'DT: ' + (t.coach ? t.coach.name : 'por asignar'))); hd.appendChild(x); b.appendChild(hd);
      if (t.info) b.appendChild(h('p', 'sub', t.info));
      var ul = h('ul', 'sq'); if (!t.squad.length) ul.appendChild(h('li', null, 'Sin jugadores todavía'));
      t.squad.forEach(function (m) { var li = h('li'); li.appendChild(h('b', null, m.name)); li.appendChild(h('span', 'badge' + (m.slot === 'starter' ? ' a' : ''), m.slot === 'starter' ? 'Titular' : 'Suplente')); ul.appendChild(li); }); b.appendChild(ul);
    });
  }
  function draw() {
    var g = document.getElementById('g'); g.innerHTML = '';
    var l = teams.filter(function (t) { return (!filter || (info[t.id] || {}).league === filter) && (!q || t.name.toLowerCase().indexOf(q) >= 0); });
    if (!l.length) { g.appendChild(h('p', 'em', teams.length ? 'Ningún equipo coincide.' : 'Todavía no hay equipos registrados.')); return; }
    l.forEach(function (t, i) {
      var f = info[t.id] || {}, c = h('button', 'tc'); c.style.animationDelay = Math.min(i, 12) * 40 + 'ms'; c.style.setProperty('--bar', COL[(f.li || 0) % COL.length]); c.style.setProperty('--tint', M.tint(t.id));
      var lg = h('div', 'lg mono'); lg.appendChild(h('span', null, f.league || 'Sin liga')); if (f.live) lg.appendChild(h('span', 'badge p', 'En vivo')); c.appendChild(lg);
      var cr = M.crest(t.id, t.name, 92, t.has_crest); cr.style.margin = '0 auto 12px'; c.appendChild(cr); c.appendChild(h('h3', 'x', t.name));
      var rk = h('div', 'ranks'); if (f.pos) { var d = h('div', 'rk'); d.appendChild(h('b', null, '#' + f.pos)); d.appendChild(h('span', 'mono', 'Liga')); rk.appendChild(d); }
      var d2 = h('div', 'rk'); d2.appendChild(h('b', null, t.squad.length + '/4')); d2.appendChild(h('span', 'mono', 'Jugadores')); rk.appendChild(d2); c.appendChild(rk);
      var fm = h('div', 'form'); (f.form || []).forEach(function (w) { fm.appendChild(h('i', 'dot' + (w ? '' : ' l'))); }); c.appendChild(fm);
      c.onclick = function () { detail(t); }; g.appendChild(c);
    });
  }
  Promise.all([M.get('/api/public/teams'), M.get('/api/public/leagues'), M.get('/api/public/calendar'), M.get('/api/public/summary')]).then(function (r) {
    teams = r[0].teams; var names = [];
    r[1].items.forEach(function (L, li) { if (names.indexOf(L.name) < 0) names.push(L.name); L.standings.forEach(function (s) { info[s.team_id] = { league: L.name, li: li, pos: s.pos, form: [] }; }); });
    r[2].recent.filter(function (m) { return m.status === 'finished'; }).reverse().forEach(function (m) {
      [[m.home_team_id, m.home_score > m.away_score], [m.away_team_id, m.away_score > m.home_score]].forEach(function (x) { var f = info[x[0]] = info[x[0]] || { form: [] }; f.form.push(x[1]); if (f.form.length > 4) f.form.shift(); });
    });
    r[2].upcoming.forEach(function (m) { if (m.status === 'live') [m.home_team_id, m.away_team_id].forEach(function (id) { var f = info[id] = info[id] || { form: [] }; f.live = true; }); });
    var st = document.getElementById('st'); [['Equipos', teams.length], ['Ligas', r[3].leagues], ['Jugando ahora', Object.keys(info).filter(function (k) { return info[k].live; }).length]].forEach(function (k) { var d = h('div', 'stat'); d.appendChild(h('b', null, k[1])); d.appendChild(h('span', 'mono', k[0])); st.appendChild(d); });
    var ch = document.getElementById('ch'); if (names.length) ['Todas'].concat(names).forEach(function (n, i) { var b = h('button', 'chip' + (i ? '' : ' on'), n); b.onclick = function () { filter = i ? n : ''; [].forEach.call(ch.children, function (x) { x.classList.toggle('on', x === b); }); draw(); }; ch.appendChild(b); });
    document.getElementById('q').addEventListener('input', function (e) { q = e.target.value.trim().toLowerCase(); draw(); });
    draw();
  });
})();
