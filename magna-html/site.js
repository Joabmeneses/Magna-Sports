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
  // Silueta de carga: filas (lista) o tarjetas
  function skel(n, kind) { var w = h('div', 'skel'); w.setAttribute('aria-label', 'Cargando'); w.setAttribute('role', 'status'); for (var i = 0; i < (n || 3); i++) { if (kind === 'card') { w.appendChild(h('div', 'skel-card')); continue; } var r = h('div', 'skel-row'), mid = h('div'); r.appendChild(h('i', 'c')); mid.appendChild(h('i', 'l1')); mid.appendChild(h('i', 'l2')); r.appendChild(mid); r.appendChild(h('i', 's')); w.appendChild(r); } if (kind === 'card') w.style.gridTemplateColumns = 'repeat(auto-fill,minmax(220px,1fr))'; return w; }
  // Carta y avatar de jugador con el color de su nivel (bronce, plata, oro, élite)
  function tierCls(media) { var t = window.MAGNA ? MAGNA.tierOf(media) : { id: 'bronce' }; return ' t-' + (t.id === 'nuevo' ? 'bronce' : t.id); }
  function ini(name) { return String(name || '?').slice(0, 2).toUpperCase(); }
  function tierCard(name, media, width) { var t = window.MAGNA ? MAGNA.tierOf(media) : { name: '' }, c = h('div', 'tcard' + tierCls(media)); if (width) c.style.setProperty('--w', width + 'px'); c.appendChild(h('span', 'm', media == null ? '—' : String(media))); c.appendChild(h('span', 'tl', t.name)); c.appendChild(h('span', 'ini', ini(name))); c.appendChild(h('span', 'nm', name)); return c; }
  // fotos de perfil de los jugadores con cuenta (avatares de Magna): se cargan una vez y se aplican a todos los [data-pid]
  var PAV = {}; try { PAV = JSON.parse(localStorage.getItem('magna_pav') || '{}') || {}; } catch (e) {}
  function pav(pid) { var id = pid != null && PAV[pid]; return id && /^a\d\d$/.test(id) ? 'avatars/' + id + '.webp' : null; }
  function paint(el) { var u = pav(el.dataset.pid); if (u) { el.style.backgroundImage = 'url("' + u + '")'; el.classList.add('has-pav'); } else { el.style.backgroundImage = ''; el.classList.remove('has-pav'); } }
  function loadPav() { if (!window.MAGNA_SB) return; window.MAGNA_SB().then(function (c) { return c.rpc('player_avatars'); }).then(function (r) { if (!r || r.error) return; var m = {}; (r.data || []).forEach(function (x) { m[x.player_id] = x.avatar; }); PAV = m; try { localStorage.setItem('magna_pav', JSON.stringify(m)); } catch (e) {} [].forEach.call(document.querySelectorAll('[data-pid]'), paint); }, function () {}); }
  if (document.readyState === 'complete') setTimeout(loadPav, 300); else addEventListener('load', function () { setTimeout(loadPav, 300); });
  function photo(el, pid) { if (pid == null) return el; el.dataset.pid = pid; paint(el); return el; }
  function tierAv(name, media, size, pid) { var a = h('span', 'tav' + tierCls(media)); if (size) a.style.setProperty('--s', size + 'px'); a.appendChild(h('span', null, ini(name))); a.title = (window.MAGNA ? MAGNA.tierOf(media).name : ''); return photo(a, pid); }
  return { h: h, get: get, crest: crest, fdt: fdt, modal: modal, skel: skel, tierCard: tierCard, tierAv: tierAv, pav: pav, photo: photo, tint: function (i) { return TINTS[i % TINTS.length]; } };
})();
