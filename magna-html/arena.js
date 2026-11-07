'use strict';
// Efectos "Arena" para ranking, perfil y tienda: inclinación 3D con destello al pasar el mouse ([data-tilt]),
// cinta de datos tipo transmisión de TV y cuenta regresiva. Sin dependencias.
window.ARENA = (function () {
  var fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches, still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cur = null, raf = 0, ev = null;
  function apply() { raf = 0; if (!cur || !ev) return; var r = cur.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height, k = Number(cur.dataset.tilt) || 10;
    cur.style.transform = 'perspective(900px) rotateX(' + ((.5 - y) * k).toFixed(2) + 'deg) rotateY(' + ((x - .5) * k).toFixed(2) + 'deg) translateY(-3px)'; cur.style.setProperty('--mx', (x * 100).toFixed(1) + '%'); cur.style.setProperty('--my', (y * 100).toFixed(1) + '%'); }
  function leave(el) { el.style.transform = ''; el.classList.remove('ar-hot'); }
  if (fine && !still) {
    document.addEventListener('pointermove', function (e) { var t = e.target.closest && e.target.closest('[data-tilt]'); if (t !== cur) { if (cur) leave(cur); cur = t; if (cur) cur.classList.add('ar-hot'); } if (!cur) return; ev = e; if (!raf) raf = requestAnimationFrame(apply); }, { passive: true });
    document.addEventListener('pointerleave', function () { if (cur) leave(cur); cur = null; });
  }
  function h(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  // cinta: items = [[etiqueta, valor], ...]
  function ticker(items, label) { var w = h('div', 'ar-tick'); w.appendChild(h('span', 'ar-tick-l', label || 'EN VIVO'));
    var vp = h('div', 'ar-tick-v'), tr = h('div', 'ar-tick-t'); for (var k = 0; k < 2; k++) items.forEach(function (it) { var s = h('span', 'ar-tick-i'); s.appendChild(h('small', null, it[0])); s.appendChild(h('b', null, it[1])); tr.appendChild(s); });
    tr.style.animationDuration = Math.max(18, items.length * 6) + 's'; vp.appendChild(tr); w.appendChild(vp); return w; }
  function until(ms) { var s = Math.max(0, Math.round((ms - Date.now()) / 1000)), hh = Math.floor(s / 3600), mm = Math.floor(s % 3600 / 60), ss = s % 60; return (hh ? hh + ' h ' : '') + String(mm).padStart(2, '0') + ' min ' + String(ss).padStart(2, '0') + ' s'; }
  return { ticker: ticker, until: until, still: still };
})();
