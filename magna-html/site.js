'use strict';
// Cabecera común y utilidades de las páginas públicas.
var M = (function () {
  function h(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function get(u) { return fetch(u).then(function (r) { return r.json(); }); }
  function crest(id, name, size, has) {
    var c = h('div', 'cr'); c.style.width = c.style.height = size + 'px'; c.style.fontSize = Math.round(size / 3.2) + 'px';
    var u = has === false ? null : MAGNA.crestUrl(id);
    if (!u) c.textContent = name.slice(0, 2).toUpperCase();
    else { var im = document.createElement('img'); im.alt = ''; im.src = u; im.onerror = function () { im.remove(); c.textContent = name.slice(0, 2).toUpperCase(); }; c.appendChild(im); }
    return c;
  }
  function fdt(s) { return s ? new Date(s.replace(' ', 'T') + 'Z').toLocaleString('es', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Sin fecha'; }
  function modal(build) {
    var ov = h('div', 'ov'), b = h('div', 'md'); function close() { ov.remove(); document.removeEventListener('keydown', k); } function k(e) { if (e.key === 'Escape') close(); }
    ov.onclick = function (e) { if (e.target === ov) close(); }; document.addEventListener('keydown', k);
    var x = h('button', 'close', 'Cerrar'); x.onclick = close; b.appendChild(x); build(b, close); ov.appendChild(b); document.body.appendChild(ov);
  }
  var L = [['index.html', 'Partidos'], ['ligas.html', 'Ligas'], ['competiciones.html', 'Torneos'], ['mundial.html', 'Mundial'], ['champions.html', 'Champions'], ['apuestas.html', 'Apuestas'], ['calendario.html', 'Calendario'], ['equipos.html', 'Equipos'], ['mercado.html', 'Fichajes']];
  var hd = document.getElementById('top');
  if (hd && !document.querySelector('header.mn')) {
    var w = h('div', 'wrap'), a = h('a', 'logo x'); a.href = 'index.html'; a.appendChild(h('i')); a.appendChild(document.createTextNode('Magna Arena')); w.appendChild(a);
    var n = h('nav'); L.forEach(function (x) { var l = h('a', location.pathname.split('/').pop() === x[0] ? 'on' : '', x[1]); l.href = x[0]; n.appendChild(l); }); w.appendChild(n);
    var e = h('a', 'enter', 'Administración'); e.href = 'admin.html'; w.appendChild(e); hd.appendChild(w);
  }
  var TINTS = ['#3b2a8a', '#14507a', '#7a2a4a', '#6a5212', '#1b6a55', '#5a2a8a'];
  return { h: h, get: get, crest: crest, fdt: fdt, modal: modal, tint: function (i) { return TINTS[i % TINTS.length]; } };
})();
