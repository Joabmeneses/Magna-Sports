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
    color: { oro: 'Oro', 'neon-rosa': 'Neón rosa', 'neon-cian': 'Neón cian', 'neon-verde': 'Neón verde', fuego: 'Fuego', hielo: 'Hielo', galaxia: 'Galaxia', arcoiris: 'Arcoíris', sangre: 'Carmesí', menta: 'Menta', estrella: 'Estrella fugaz' },
    plate: { magna: 'Magna', oro: 'Oro', plata: 'Plata', galaxia: 'Galaxia', fuego: 'Fuego', neon: 'Neón', selva: 'Selva', noche: 'Medianoche', campeon: 'Campeón', dinastia: 'Dinastía' },
    frame: { oro: 'Oro', neon: 'Neón', fuego: 'Fuego', hielo: 'Hielo', arcoiris: 'Arcoíris', corona: 'Corona', elite: 'Élite', toxico: 'Tóxico', balon: 'Balón de Oro', jackpot: 'Jackpot', leyenda: 'Leyenda', fundador: 'Fundador' },
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
  function paintName(el) { nameStyle(el, eqOf(el.dataset.pn)); var t = el.querySelector('.mpn-t'), ti = styleOf(eqOf(el.dataset.pn), 'title'); if (el.dataset.ttl) { if (ti) { if (!t) { t = h('small', 'mpn-t'); el.appendChild(t); } t.textContent = ti.name; t.className = 'mpn-t tr-' + (ti.rarity || 'comun'); } else if (t) t.remove(); } }
  function repaint() { [].forEach.call(document.querySelectorAll('[data-pid]'), paint); [].forEach.call(document.querySelectorAll('[data-pn]'), paintName); }
  function loadPav() { if (!window.MAGNA_SB) return; window.MAGNA_SB().then(function (c) { return c.rpc('player_cosmetics').then(function (r) { return r && !r.error ? r : c.rpc('player_avatars'); }); }).then(function (r) { if (!r || r.error) return; var m = {}, cm = {};
      (r.data || []).forEach(function (x) { if (x.avatar) m[x.player_id] = x.avatar; cm[x.player_id] = { eq: x.equipped || {} }; }); PAV = m; COS = cm; try { localStorage.setItem('magna_pav', JSON.stringify(m)); localStorage.setItem('magna_cos', JSON.stringify(cm)); } catch (e) {} repaint(); try { window.dispatchEvent(new Event('magna:cosloaded')); } catch (e) {} }, function () {}); }
  // vista previa de un cosmético sobre un nombre (y avatar para los marcos)
  // nombre de jugador que enlaza a su perfil público y lleva sus cosméticos. o: {title:true, plain:true}
  function pn(name, pid, o) { o = o || {}; var a = h(pid != null && !o.plain ? 'a' : 'span', 'mpn'); a.appendChild(h('span', 'mpn-n', name || '—')); if (pid == null) return a; if (a.tagName === 'A') a.href = 'jugador.html?id=' + pid; a.dataset.pn = pid; if (o.title) a.dataset.ttl = '1'; paintName(a); return a; }
  function profileUrl(pid) { return 'jugador.html?id=' + pid; }
  // filtros SVG de los marcos de energía: recortan el anillo y lo deforman con ruido (plasma, llamas, partículas).
  // Todo va en unidades relativas a la caja, así que se ve igual en un avatar de 24 px que en el retrato del perfil.
  function fx() { if (document.getElementById('mg-fx')) return; var d = document.createElement('div'); d.id = 'mg-fx'; d.setAttribute('aria-hidden', 'true'); d.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
    var enc = function (x) { return 'data:image/svg+xml,' + encodeURIComponent(x); };
    var ring = function (st) { return enc("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'><defs><radialGradient id='g'>" + st.map(function (o) { return "<stop offset='" + o[0] + "' stop-color='#fff' stop-opacity='" + o[1] + "'/>"; }).join('') + "</radialGradient></defs><rect width='100' height='100' fill='url(#g)'/></svg>"); };
    var noise = function (fq, oc, sd) { return enc("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'><filter id='t' x='0' y='0' width='100%' height='100%' color-interpolation-filters='sRGB'><feTurbulence type='fractalNoise' baseFrequency='" + fq + "' numOctaves='" + oc + "' seed='" + sd + "'/></filter><rect width='100' height='100' filter='url(#t)'/></svg>"); };
    var f = function (id, st, fq, oc, sc, bl, sd) { return '<filter id="' + id + '" x="-30%" y="-30%" width="160%" height="160%" primitiveUnits="objectBoundingBox" color-interpolation-filters="sRGB">' +
      '<feImage href="' + ring(st) + '" x="0" y="0" width="1" height="1" preserveAspectRatio="none" result="r"/><feComposite in="SourceGraphic" in2="r" operator="in" result="c"/>' +
      '<feImage href="' + noise(fq, oc, sd || 3) + '" x="-.3" y="-.3" width="1.6" height="1.6" preserveAspectRatio="none" result="n"/>' +
      '<feDisplacementMap in="c" in2="n" scale="' + sc + '" xChannelSelector="R" yChannelSelector="G" result="d"/>' +
      '<feGaussianBlur in="d" stdDeviation="' + bl + '" result="b"/><feMerge result="m"><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="d"/></feMerge>' +
      '<feImage href="' + hole + '" x="0" y="0" width="1" height="1" preserveAspectRatio="none" result="h"/><feComposite in="m" in2="h" operator="in"/></filter>'; };
    // nada de energía encima de la cara: solo del borde del avatar hacia afuera
    var hole = ring([[.745, 0], [.757, 1], [1, 1]]);
    d.innerHTML = '<svg width="0" height="0">' +
      f('mgf-plasma', [[.73, 0], [.762, 1], [.8, 1], [.86, 0]], '.22', 3, '.035', '.012', 5) +
      f('mgf-fire', [[.72, 0], [.765, 1], [.82, 1], [.93, 0]], '.08 .2', 4, '.09', '.012', 2) +
      f('mgf-wisp', [[.72, 0], [.765, 1], [.85, 1], [.97, 0]], '.15', 3, '.11', '.006', 4) +
      f('mgf-clean', [[.752, 0], [.758, 1], [.9, 1], [.906, 0]], '.1', 1, '0', '.003', 1) +
      f('mgf-dust', [[.7, 0], [.77, 1], [.9, 1], [1, 0]], '.2', 2, '.2', '.004', 9) +
      f('mgf-dustin', [[.42, 0], [.54, 1], [.66, 1], [.69, 0]], '.2', 2, '.14', '.004', 6) + '</svg>';
    (document.body || document.documentElement).appendChild(d); }
  if (document.body) fx(); else document.addEventListener('DOMContentLoaded', fx);
  // Más liviano: los cosméticos animados que no están en pantalla se pausan (y se reanudan al volver a verse)
  var io = window.IntersectionObserver ? new IntersectionObserver(function (es) { es.forEach(function (e) { e.target.classList.toggle('cos-off', !e.isIntersecting); }); }, { rootMargin: '120px' }) : null, seen = window.WeakSet ? new WeakSet() : null, wT = null;
  var SEL = '[class*="fr-"],.mpn[class*="c-"],.mpn[class*="pl-"],.mpn-t.tr-legendaria,.mpn-t.tr-epica';
  function watch() { wT = null; if (!io || !seen) return; [].forEach.call(document.querySelectorAll(SEL), function (el) { if (!seen.has(el)) { seen.add(el); io.observe(el); } }); }
  function soon() { if (!wT) wT = setTimeout(watch, 350); }
  if (io && window.MutationObserver) { var startW = function () { watch(); new MutationObserver(soon).observe(document.body, { childList: true, subtree: true }); }; if (document.body) startW(); else document.addEventListener('DOMContentLoaded', startW); }
  window.addEventListener('magna:update', function () { setTimeout(repaint, 0); });
  window.addEventListener('magna:cos', function () { try { COS = JSON.parse(localStorage.getItem('magna_cos') || '{}') || {}; PAV = JSON.parse(localStorage.getItem('magna_pav') || '{}') || {}; } catch (e) {} repaint(); });
  // tocar un avatar de jugador abre su perfil (fuera del panel de administración)
  if (!/admin\.html$/.test(location.pathname)) document.addEventListener('click', function (e) { var t = e.target.closest && e.target.closest('.tav[data-pid]'); if (!t || e.defaultPrevented || t.closest('a,button,[data-nolink],.ov')) return; location.href = profileUrl(t.dataset.pid); });
  if (document.readyState === 'complete') setTimeout(loadPav, 300); else addEventListener('load', function () { setTimeout(loadPav, 300); });
  return { pav: pav, paint: paint, pn: pn, nameStyle: nameStyle, profileUrl: profileUrl, item: item, eqOf: eqOf, repaint: repaint, reload: loadPav, STY: STY, KIND: KIND, RAR: RAR };
})();
