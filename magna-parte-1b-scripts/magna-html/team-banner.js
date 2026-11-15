'use strict';
// Banner animado de un equipo (página de equipo y vista previa del panel).
// Datos en el equipo: banner (URL pública en Supabase Storage), bannerFx (brillo | flotar | neon | ninguno), bannerC (color del brillo).
window.TEAM_BANNER = (function () {
  var FX = { brillo: '✨ Brillo', flotar: '🌟 Flotar con destellos', neon: '💡 Neón parpadeante', ninguno: 'Sin animación' };
  var FIT = { fundir: 'Fundir los bordes con el fondo', completo: 'Mostrar la imagen completa' };
  function rgb(hex) { var m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return [139, 92, 246]; var n = parseInt(m[1], 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function h(t, c) { var e = document.createElement(t); if (c) e.className = c; return e; }
  function render(t, opt) { if (!t || !t.banner) return null; opt = opt || {};
    var fx = FX[t.bannerFx] ? t.bannerFx : 'brillo', fit = FIT[t.bannerFit] ? t.bannerFit : 'fundir', w = h('section', 'tb tb-' + fx + ' tb-' + fit), c = rgb(t.bannerC), L = c.map(function (v) { return Math.round(v + (255 - v) * .45); });
    w.style.setProperty('--tb', 'rgb(' + c.join(',') + ')'); w.style.setProperty('--tb-s', 'rgba(' + c.join(',') + ',.55)'); w.style.setProperty('--tb-f', 'rgba(' + c.join(',') + ',.16)'); w.style.setProperty('--tb-l', 'rgb(' + L.join(',') + ')'); w.setAttribute('aria-label', 'Banner de ' + (t.name || 'equipo'));
    var bg = h('div', 'tb-bg'); bg.style.backgroundImage = 'url("' + t.banner + '")'; w.appendChild(bg); w.appendChild(h('div', 'tb-rays'));
    var sp = h('div', 'tb-sp'); for (var i = 0; i < 14; i++) { var s = h('i'); s.style.left = (5 + (i * 37) % 90) + '%'; s.style.top = (8 + (i * 53) % 84) + '%'; s.style.animationDelay = (i * .37 % 3).toFixed(2) + 's'; s.style.setProperty('--z', (0.6 + (i % 4) * 0.25).toFixed(2)); sp.appendChild(s); } w.appendChild(sp);
    var art = h('div', 'tb-art'), im = h('img', 'tb-img'); im.src = t.banner; im.alt = 'Banner de ' + (t.name || 'equipo'); im.decoding = 'async'; if (!opt.eager) im.loading = 'lazy'; art.appendChild(im); w.appendChild(art);
    w.appendChild(h('div', 'tb-shine')); return w; }
  // portada: la imagen va de fondo dentro del contenedor (la portada del equipo), detrás del escudo y el nombre
  var POS = { center: 'Centro', top: 'Arriba', bottom: 'Abajo' };
  function cover(box, t) { if (!box || !t) return box; if (t.bannerOff) return box; if (!t.banner) return auto(box, t); var fx = FX[t.bannerFx] ? t.bannerFx : 'brillo', c = rgb(t.bannerC), L = c.map(function (v) { return Math.round(v + (255 - v) * .45); });
    box.classList.add('tbh', 'tbh-' + fx); box.style.setProperty('--tb', 'rgb(' + c.join(',') + ')'); box.style.setProperty('--tb-s', 'rgba(' + c.join(',') + ',.55)'); box.style.setProperty('--tb-f', 'rgba(' + c.join(',') + ',.18)'); box.style.setProperty('--tb-l', 'rgb(' + L.join(',') + ')');
    var lay = h('div', 'tbh-l'), bl = h('div', 'tbh-blur'), im = h('div', 'tbh-img'); bl.style.backgroundImage = 'url("' + t.banner + '")'; lay.appendChild(bl);
    var probe = new Image(); probe.onload = function () { var ar = probe.naturalWidth / Math.max(1, probe.naturalHeight); box.style.setProperty('--tbar', ar.toFixed(3)); box.classList.toggle('tbh-side', ar < 1.7); }; probe.src = t.banner; box.classList.add('tbh-side'); im.style.backgroundImage = 'url("' + t.banner + '")'; im.style.backgroundPosition = 'center ' + (POS[t.bannerPos] ? t.bannerPos : 'center'); lay.appendChild(im); lay.appendChild(h('div', 'tbh-glow')); lay.appendChild(h('div', 'tbh-shade')); lay.appendChild(h('div', 'tb-shine'));
    var sp = h('div', 'tb-sp'); for (var i = 0; i < 12; i++) { var s = h('i'); s.style.left = (52 + (i * 31) % 46) + '%'; s.style.top = (6 + (i * 53) % 80) + '%'; s.style.animationDelay = (i * .41 % 3).toFixed(2) + 's'; s.style.setProperty('--z', (0.6 + (i % 4) * 0.25).toFixed(2)); sp.appendChild(s); } lay.appendChild(sp);
    box.insertBefore(lay, box.firstChild); return box; }
  // ---------- banner automático estilo grafiti con el nombre del equipo (sin subir imágenes) ----------
  function hsl(c) { var r = c[0] / 255, g = c[1] / 255, b = c[2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, s2 = 0, hh = 0; if (mx !== mn) { var d = mx - mn; s2 = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); hh = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; hh *= 60; } return [hh, s2, l]; }
  function vivid(hex) { var c = rgb(hex), x = hsl(c); return 'hsl(' + Math.round(x[0]) + ',' + Math.max(75, Math.round(x[1] * 100)) + '%,' + Math.min(62, Math.max(52, Math.round(x[2] * 100))) + '%)'; }
  function seed(str) { var x = 0; for (var i = 0; i < str.length; i++) x = (x * 31 + str.charCodeAt(i)) % 9973; return function () { x = (x * 7919 + 13) % 9973; return x / 9973; }; }
  function graffiti(t) { var name = String(t.name || 'Equipo').toUpperCase().replace(/\s+/g, ' ').slice(0, 14), r = seed(name), w = h('div', 'gfx'), word = h('div', 'gfx-w'); word.setAttribute('aria-hidden', 'true');
    var n = name.replace(/ /g, '').length || 1; w.style.setProperty('--n', n);
    name.split('').forEach(function (ch, i) { if (ch === ' ') { word.appendChild(h('span', 'gfx-sp')); return; } var l = h('span', 'gfx-l'); l.textContent = ch; l.dataset.c = ch;
      l.style.setProperty('--r', ((r() - .5) * 14).toFixed(1) + 'deg'); l.style.setProperty('--y', ((r() - .5) * 18).toFixed(0) + 'px'); l.style.setProperty('--k', (0.9 + r() * .22).toFixed(2)); l.style.setProperty('--d', (i * .09).toFixed(2) + 's'); word.appendChild(l); });
    var st = h('i', 'gfx-star'); st.innerHTML = '<svg viewBox="0 0 40 40"><path d="M20 0C21.5 13 27 18.5 40 20 27 21.5 21.5 27 20 40 18.5 27 13 21.5 0 20 13 18.5 18.5 13 20 0Z"/></svg>'; w.appendChild(h('div', 'gfx-dots')); w.appendChild(word); w.appendChild(st);
    var st2 = st.cloneNode(true); st2.className = 'gfx-star s2'; w.appendChild(st2); var tk = h('i', 'gfx-tick'); w.appendChild(tk); return w; }
  function auto(box, t) { var base = t.bannerC || (window.MAGNA && MAGNA.teamColor ? MAGNA.teamColor(t.id) : '#8b5cf6'), col = /^#/.test(base) ? vivid(base) : base, fx = FX[t.bannerFx] ? t.bannerFx : 'brillo', c = rgb(/^#/.test(base) ? base : '#8b5cf6');
    box.classList.add('tbh', 'tbh-auto', 'tbh-' + fx); box.style.setProperty('--tb', col); box.style.setProperty('--tb-s', 'rgba(' + c.join(',') + ',.5)'); box.style.setProperty('--tb-f', 'rgba(' + c.join(',') + ',.2)'); box.style.setProperty('--tb-l', '#fff');
    var lay = h('div', 'tbh-l'); lay.appendChild(h('div', 'gfx-bg')); lay.appendChild(graffiti(t)); lay.appendChild(h('div', 'tbh-shade')); lay.appendChild(h('div', 'tb-shine'));
    var sp = h('div', 'tb-sp'); for (var i = 0; i < 12; i++) { var s2 = h('i'); s2.style.left = (50 + (i * 31) % 48) + '%'; s2.style.top = (6 + (i * 53) % 84) + '%'; s2.style.animationDelay = (i * .41 % 3).toFixed(2) + 's'; s2.style.setProperty('--z', (0.6 + (i % 4) * 0.25).toFixed(2)); sp.appendChild(s2); } lay.appendChild(sp);
    box.insertBefore(lay, box.firstChild); return box; }
  // color llamativo dominante de una imagen (para el brillo)
  function accent(img) { try { var c = document.createElement('canvas'), n = 48; c.width = c.height = n; var x = c.getContext('2d'); x.drawImage(img, 0, 0, n, n); var d = x.getImageData(0, 0, n, n).data, r = 0, g = 0, b = 0, wt = 0;
      for (var i = 0; i < d.length; i += 4) { var R = d[i], G = d[i + 1], B = d[i + 2], mx = Math.max(R, G, B), mn = Math.min(R, G, B), s = mx ? (mx - mn) / mx : 0, v = mx / 255, k = s * s * v * v * (d[i + 3] / 255); r += R * k; g += G * k; b += B * k; wt += k; }
      if (wt < 1) return '#8b5cf6'; var hx = function (v) { return ('0' + Math.round(v / wt).toString(16)).slice(-2); }; return '#' + hx(r) + hx(g) + hx(b); } catch (e) { return '#8b5cf6'; } }
  // reduce la imagen a webp (máx. 1600 px) para subirla
  function shrink(file) { return new Promise(function (ok, bad) { if (!file || !/^image\/(png|jpe?g|webp)$/.test(file.type)) return bad(new Error('Elige una imagen PNG, JPG o WEBP.')); if (file.size > 12 * 1048576) return bad(new Error('La imagen pesa más de 12 MB.'));
      var u = URL.createObjectURL(file), img = new Image(); img.onload = function () { var k = Math.min(1, 1600 / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        var col = accent(img); URL.revokeObjectURL(u); c.toBlob(function (bl) { if (!bl) return bad(new Error('No se pudo procesar la imagen.')); ok({ blob: bl, color: col, w: c.width, h: c.height, preview: c.toDataURL('image/webp', .8) }); }, 'image/webp', .86); };
      img.onerror = function () { URL.revokeObjectURL(u); bad(new Error('No se pudo leer la imagen.')); }; img.src = u; }); }
  return { render: render, cover: cover, shrink: shrink, FX: FX, FIT: FIT, POS: POS };
})();
