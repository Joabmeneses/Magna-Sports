'use strict';
// Cosméticos de Magna Arena (foto de perfil, color y placa del nombre, marco del avatar y título) y enlaces a perfiles.
// Lo cargan todas las páginas públicas; no depende de site.js.
window.MAGNA_COS = (function () {
  function h(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  var PAV = {}; try { PAV = JSON.parse(localStorage.getItem('magna_pav') || '{}') || {}; } catch (e) {}
  function pav(pid) { var id = pid != null && PAV[pid]; return id && /^a\d\d$/.test(id) ? 'avatars/' + id + '.webp' : null; }
  // Cosméticos equipados (color de nombre, placa, marco del avatar, título) de cada jugador con cuenta
  var COS = {}; try { COS = JSON.parse(localStorage.getItem('magna_cos') || '{}') || {}; } catch (e) {}
  var STY = {
    color: { oro: 'Oro', 'neon-rosa': 'Neón rosa', 'neon-cian': 'Neón cian', 'neon-verde': 'Neón verde', fuego: 'Fuego', hielo: 'Hielo', galaxia: 'Galaxia', arcoiris: 'Arcoíris', sangre: 'Carmesí', menta: 'Menta' },
    plate: { magna: 'Magna', oro: 'Oro', plata: 'Plata', galaxia: 'Galaxia', fuego: 'Fuego', neon: 'Neón', selva: 'Selva', noche: 'Medianoche' },
    frame: { oro: 'Oro', neon: 'Neón', fuego: 'Fuego', hielo: 'Hielo', arcoiris: 'Arcoíris', corona: 'Corona', elite: 'Élite', toxico: 'Tóxico' },
    title: {} };
  var KIND = { color: 'Color de nombre', plate: 'Placa', frame: 'Marco', title: 'Título' }, RAR = { comun: 'Común', rara: 'Rara', epica: 'Épica', legendaria: 'Legendaria' };
  function item(id) { var L = (window.MAGNA && MAGNA.S && MAGNA.S.shop) || []; for (var i = 0; i < L.length; i++) if (L[i].id === id) return L[i]; return null; }
  function eqOf(pid) { var c = pid != null && COS[pid]; return (c && c.eq) || {}; }
  function styleOf(eq, k) { var it = eq && eq[k] ? item(eq[k]) : null; return it && it.type === k ? it : null; }
  function clsRm(el, pre) { (el.className.baseVal != null ? [] : el.className.split(/\s+/)).forEach(function (c) { if (c.indexOf(pre) === 0) el.classList.remove(c); }); }
  function paint(el) { var u = pav(el.dataset.pid); if (u) { el.style.backgroundImage = 'url("' + u + '")'; el.classList.add('has-pav'); } else { el.style.backgroundImage = ''; el.classList.remove('has-pav'); }
    clsRm(el, 'fr-'); var f = styleOf(eqOf(el.dataset.pid), 'frame'); if (f && STY.frame[f.style]) el.classList.add('fr-' + f.style); }
  // pinta un nombre con los cosméticos de un "equipado" (eq) concreto
  function nameStyle(el, eq) { clsRm(el, 'c-'); clsRm(el, 'pl-'); var c = styleOf(eq, 'color'), pl = styleOf(eq, 'plate'); if (c && STY.color[c.style]) el.classList.add('c-' + c.style); if (pl && STY.plate[pl.style]) el.classList.add('pl-' + pl.style); return el; }
  function paintName(el) { nameStyle(el, eqOf(el.dataset.pn)); var t = el.querySelector('.mpn-t'), ti = styleOf(eqOf(el.dataset.pn), 'title'); if (el.dataset.ttl) { if (ti) { if (!t) { t = h('small', 'mpn-t'); el.appendChild(t); } t.textContent = ti.name; } else if (t) t.remove(); } }
  function repaint() { [].forEach.call(document.querySelectorAll('[data-pid]'), paint); [].forEach.call(document.querySelectorAll('[data-pn]'), paintName); }
  function loadPav() { if (!window.MAGNA_SB) return; window.MAGNA_SB().then(function (c) { return c.rpc('player_cosmetics').then(function (r) { return r && !r.error ? r : c.rpc('player_avatars'); }); }).then(function (r) { if (!r || r.error) return; var m = {}, cm = {};
      (r.data || []).forEach(function (x) { if (x.avatar) m[x.player_id] = x.avatar; cm[x.player_id] = { eq: x.equipped || {} }; }); PAV = m; COS = cm; try { localStorage.setItem('magna_pav', JSON.stringify(m)); localStorage.setItem('magna_cos', JSON.stringify(cm)); } catch (e) {} repaint(); }, function () {}); }
  // vista previa de un cosmético sobre un nombre (y avatar para los marcos)
  // nombre de jugador que enlaza a su perfil público y lleva sus cosméticos. o: {title:true, plain:true}
  function pn(name, pid, o) { o = o || {}; var a = h(pid != null && !o.plain ? 'a' : 'span', 'mpn'); a.appendChild(h('span', 'mpn-n', name || '—')); if (pid == null) return a; if (a.tagName === 'A') a.href = 'jugador.html?id=' + pid; a.dataset.pn = pid; if (o.title) a.dataset.ttl = '1'; paintName(a); return a; }
  function profileUrl(pid) { return 'jugador.html?id=' + pid; }
  window.addEventListener('magna:update', function () { setTimeout(repaint, 0); });
  window.addEventListener('magna:cos', function () { try { COS = JSON.parse(localStorage.getItem('magna_cos') || '{}') || {}; PAV = JSON.parse(localStorage.getItem('magna_pav') || '{}') || {}; } catch (e) {} repaint(); });
  // tocar un avatar de jugador abre su perfil (fuera del panel de administración)
  if (!/admin\.html$/.test(location.pathname)) document.addEventListener('click', function (e) { var t = e.target.closest && e.target.closest('.tav[data-pid]'); if (!t || e.defaultPrevented || t.closest('a,button,[data-nolink],.ov')) return; location.href = profileUrl(t.dataset.pid); });
  if (document.readyState === 'complete') setTimeout(loadPav, 300); else addEventListener('load', function () { setTimeout(loadPav, 300); });
  return { pav: pav, paint: paint, pn: pn, nameStyle: nameStyle, profileUrl: profileUrl, item: item, eqOf: eqOf, repaint: repaint, reload: loadPav, STY: STY, KIND: KIND, RAR: RAR };
})();
