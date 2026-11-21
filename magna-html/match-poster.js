'use strict';
// Imágenes para compartir del marcador y de la alineación (1080×1350, estilo esports morado/lima).
// Se carga solo cuando alguien pide la imagen (esports.js → MagnaShot).
window.MagnaPoster = (function () {
  var W = 1080, H = 1350, INK = '#0c0716', ASH = '#2b1852', CON = '#8b5cf6', LIME = '#c6ff1a', PAPER = '#f2f2ee', MUT = '#b9aee0', RED = '#ff3b30', PP = '#cdb8ff', PL = '#e9ffad';
  var FB = '"Archivo Black", Archivo, "Arial Black", sans-serif', FM = '"Space Mono", "Courier New", monospace';
  var BG = { champions: 'img/bn-champions.webp', starnova: 'img/bn-starnova.webp', omega: 'img/bn-omega.webp', amistoso: 'img/bn-amistoso.webp' };
  var NOISE = null;

  function load(u) { return new Promise(function (ok) { if (!u) return ok(null); var i = new Image(); if (/^https?:/.test(u) && u.indexOf(location.origin) !== 0) i.crossOrigin = 'anonymous'; i.onload = function () { ok(i); }; i.onerror = function () { ok(null); }; i.src = u; }); }
  function fonts() { if (!document.fonts || !document.fonts.load) return Promise.resolve(); return Promise.all(['900 60px "Archivo Black"', '700 24px "Space Mono"'].map(function (f) { return document.fonts.load(f).catch(function () {}); })); }
  function fit(c, s, w) { s = String(s || ''); if (c.measureText(s).width <= w) return s; while (s.length > 1 && c.measureText(s + '…').width > w) s = s.slice(0, -1); return s + '…'; }
  function shrink(c, txt, w, px, min, mono) { font(c, px, mono); while (px > min && c.measureText(txt).width > w) { px -= 2; font(c, px, mono); } return px; }
  function font(c, px, mono) { c.font = (mono ? '700 ' : '900 ') + px + 'px ' + (mono ? FM : FB); }
  function sp(c, s, x, y, gap) { // texto con espaciado entre letras (para las etiquetas tipo máquina de escribir)
    s = String(s).toUpperCase(); var al = c.textAlign, tot = 0, i; for (i = 0; i < s.length; i++) tot += c.measureText(s[i]).width + gap; tot -= gap;
    var sx = al === 'center' ? x - tot / 2 : al === 'right' ? x - tot : x; c.textAlign = 'left'; for (i = 0; i < s.length; i++) { c.fillText(s[i], sx, y); sx += c.measureText(s[i]).width + gap; } c.textAlign = al; }
  function grain(c, x, y, w, h, a) { if (!NOISE) { NOISE = document.createElement('canvas'); NOISE.width = NOISE.height = 160; var n = NOISE.getContext('2d'), d = n.createImageData(160, 160); for (var i = 0; i < d.data.length; i += 4) { var v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 40; } n.putImageData(d, 0, 0); }
    c.save(); c.globalAlpha = a == null ? .35 : a; c.globalCompositeOperation = 'overlay'; c.fillStyle = c.createPattern(NOISE, 'repeat'); c.fillRect(x, y, w, h); c.restore(); }
  function stripes(c, x, y, w, h, col) { c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); c.strokeStyle = col; c.lineWidth = 3; for (var i = -h; i < w + h; i += 26) { c.beginPath(); c.moveTo(x + i, y + h); c.lineTo(x + i + h * .58, y); c.stroke(); } c.restore(); }
  function crest(c, img, name, color, x, y, s) { c.save(); c.fillStyle = INK; c.beginPath(); c.arc(x + 8, y + 10, s / 2, 0, 7); c.fill();
    c.beginPath(); c.arc(x, y, s / 2, 0, 7); c.closePath(); c.fillStyle = color || CON; c.fill(); c.save(); c.clip();
    if (img) c.drawImage(img, x - s / 2, y - s / 2, s, s); else { c.fillStyle = 'rgba(12,7,22,.18)'; for (var i = 0; i < 9; i++) for (var j = 0; j < 9; j++) { c.beginPath(); c.arc(x - s / 2 + i * s / 8, y - s / 2 + j * s / 8, s / 60, 0, 7); c.fill(); }
      font(c, s * .3); c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = s * .05; c.strokeStyle = INK; c.strokeText(String(name || '?').slice(0, 2).toUpperCase(), x, y + 2); c.fillStyle = PAPER; c.fillText(String(name || '?').slice(0, 2).toUpperCase(), x, y + 2); }
    c.restore(); c.lineWidth = s * .045; c.strokeStyle = INK; c.beginPath(); c.arc(x, y, s / 2, 0, 7); c.stroke(); c.restore(); }
  function chip(c, txt, x, y, bg, fg, px, align) { font(c, px || 22, true); var w = c.measureText(txt).width + (px || 22) * 1.2, h = (px || 22) * 1.7, sx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    c.fillStyle = bg; c.fillRect(sx, y, w, h); c.fillStyle = fg; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, sx + w / 2, y + h / 2 + 1); return w; }
  function brand(c, y, sub) { c.fillStyle = INK; c.fillRect(0, y, W, H - y); grain(c, 0, y, W, H - y, .25);
    c.save(); c.translate(70, y + (H - y) / 2); c.transform(1, 0, -.14, 1, 0, 0); c.fillStyle = LIME; c.fillRect(-30, -30, 60, 60); c.restore();
    font(c, 34); c.fillStyle = INK; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('M', 70, y + (H - y) / 2 + 2);
    c.textAlign = 'left'; c.fillStyle = PAPER; c.fillText('MAGNA ARENA', 122, y + (H - y) / 2 + 2);
    font(c, 20, true); c.fillStyle = MUT; c.textAlign = 'right'; sp(c, sub || 'magna sports', W - 50, y + (H - y) / 2 + 2, 3); }
  function bgImage(c, img, x, y, w, h) { if (!img) return; var r = Math.max(w / img.width, h / img.height), iw = img.width * r, ih = img.height * r; c.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih); }

  // mascota: la imagen trae fondo oscuro, así que se recorta con un óvalo difuminado (queda como foco de luz)
  function mascot(c, img, x, y, h, flip) { if (!img) return; var w = h * img.width / img.height, o = document.createElement('canvas'); o.width = Math.ceil(w); o.height = Math.ceil(h); var q = o.getContext('2d');
    if (flip) { q.translate(w, 0); q.scale(-1, 1); } q.drawImage(img, 0, 0, w, h); q.setTransform(1, 0, 0, 1, 0, 0);
    // óvalo: sólido en el centro y se desvanece antes de llegar a los bordes (sin esquinas visibles)
    q.globalCompositeOperation = 'destination-in'; q.save(); q.translate(w / 2, h * .52); q.scale(w / h, 1);
    var g = q.createRadialGradient(0, 0, h * .3, 0, 0, h * .49); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(.6, 'rgba(0,0,0,.85)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    q.fillStyle = g; q.fillRect(-h, -h, h * 2, h * 2); q.restore(); c.drawImage(o, x - w / 2, y - h / 2); }
  function headline(c, lines, x, y, px, rot) { c.save(); c.translate(x, y); c.rotate(rot); font(c, px); c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    lines.forEach(function (L, i) { var yy = i * px * .92; c.fillStyle = L[1] || LIME; c.fillText(L[0], 10, yy + 10); c.lineWidth = 8; c.strokeStyle = INK; c.strokeText(L[0], 0, yy); c.fillStyle = PAPER; c.fillText(L[0], 0, yy); }); c.restore(); }
  function slab(c, x, y, w, h, col, rot) { c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = INK; c.fillRect(8, 8, w, h); c.fillStyle = col; c.fillRect(0, 0, w, h); c.restore(); }

  // ---------- marcador: póster ----------
  function drawScore(cv, d) {
    cv.width = W; cv.height = H; var c = cv.getContext('2d'); c.fillStyle = INK; c.fillRect(0, 0, W, H);
    if (d.bg) { bgImage(c, d.bg, 0, 0, W, H); c.fillStyle = 'rgba(12,7,22,.55)'; c.fillRect(0, 0, W, H); }
    else { var gg = c.createRadialGradient(W * .8, 260, 40, W * .8, 260, 700); gg.addColorStop(0, 'rgba(139,92,246,.55)'); gg.addColorStop(1, 'rgba(139,92,246,0)'); c.fillStyle = gg; c.fillRect(0, 0, W, H); stripes(c, 0, 0, W, 560, 'rgba(255,255,255,.035)'); }
    grain(c, 0, 0, W, H, .3);
    // franja diagonal de equipos: morado | lima
    var Y0 = 560, Y1 = 1120, cut = 50;
    c.save(); c.beginPath(); c.moveTo(0, Y0 + 40); c.lineTo(W, Y0 - 40); c.lineTo(W, Y1 - 30); c.lineTo(0, Y1 + 30); c.closePath(); c.clip();
    c.fillStyle = d.bg ? 'rgba(139,92,246,.88)' : CON; c.fillRect(0, 0, W / 2 + cut, H); c.fillStyle = d.bg ? 'rgba(198,255,26,.86)' : LIME; c.beginPath(); c.moveTo(W / 2 + cut, 0); c.lineTo(W, 0); c.lineTo(W, H); c.lineTo(W / 2 - cut, H); c.closePath(); c.fill();
    c.fillStyle = CON; c.beginPath(); c.moveTo(0, 0); c.lineTo(W / 2 + cut + 2, 0); c.lineTo(W / 2 - cut + 2, H); c.lineTo(0, H); c.closePath(); c.globalAlpha = d.bg ? .0 : 0; c.fill(); c.globalAlpha = 1;
    stripes(c, 0, Y0 - 60, W, Y1 - Y0 + 120, 'rgba(12,7,22,.07)'); grain(c, 0, Y0 - 60, W, Y1 - Y0 + 120, .35);
    [[d.h.name, -30, Y1 + 10, 'left', 0], [d.a.name, W + 30, Y1 + 10, 'right', 1]].forEach(function (t) { c.save(); c.beginPath(); if (t[4]) { c.moveTo(W / 2 + cut, 0); c.lineTo(W, 0); c.lineTo(W, H); c.lineTo(W / 2 - cut, H); } else { c.moveTo(0, 0); c.lineTo(W / 2 + cut, 0); c.lineTo(W / 2 - cut, H); c.lineTo(0, H); } c.closePath(); c.clip(); c.translate(t[1], t[2]); c.rotate(-.1); font(c, 170); c.textAlign = t[3]; c.lineWidth = 3; c.strokeStyle = 'rgba(12,7,22,.18)'; c.strokeText(String(t[0]).toUpperCase(), 0, 0); c.restore(); });
    c.strokeStyle = INK; c.lineWidth = 12; c.beginPath(); c.moveTo(W / 2 + cut, 0); c.lineTo(W / 2 - cut, H); c.stroke();
    c.restore();
    c.strokeStyle = INK; c.lineWidth = 10; c.beginPath(); c.moveTo(0, Y0 + 40); c.lineTo(W, Y0 - 40); c.stroke(); c.beginPath(); c.moveTo(0, Y1 + 30); c.lineTo(W, Y1 - 30); c.stroke();
    // mascota (detrás del titular, a la derecha)
    mascot(c, d.masc, 800, 330, 560, false);
    // titular grande tipo póster
    var HL = d.fin ? [['RESULTADO', LIME], ['FINAL', CON]] : d.live ? [['EN VIVO', RED], [d.minute && /\d/.test(d.minute) ? 'MIN ' + d.minute.replace('’', '') : 'AHORA', CON]] : [['DÍA DE', LIME], ['PARTIDO', CON]];
    headline(c, HL, 48, 220, 128, -.06);
    // competición y fecha
    slab(c, 50, 400, 560, 58, INK, -.06); font(c, 22, true); c.save(); c.translate(50, 400); c.rotate(-.06); c.fillStyle = PAPER; c.textAlign = 'left'; c.textBaseline = 'middle'; sp(c, fit(c, d.comp || 'Magna Sports', 520), 20, 30, 3); c.restore();
    if (d.clock) { c.save(); c.translate(62, 470); c.rotate(-.06); font(c, 22, true); c.fillStyle = LIME; c.textAlign = 'left'; c.textBaseline = 'middle'; sp(c, fit(c, d.clock, 520), 0, 0, 3); c.restore(); }
    // equipos
    var light = !!d.bg;
    [[d.h, 275, 'h'], [d.a, W - 275, 'a']].forEach(function (t) { var T = t[0], x = t[1], cy = 720 + (t[2] === 'h' ? 18 : -18);
      crest(c, T.img, T.name, T.color, x, cy, 230);
      var nm = String(T.name).toUpperCase(), npx = shrink(c, nm, 420, 50, 22), nw = c.measureText(nm).width + 44; slab(c, x - nw / 2, cy + 140, nw, 74, INK, -.06);
      c.save(); c.translate(x, cy + 177); c.rotate(-.06); c.fillStyle = PAPER; c.textAlign = 'center'; c.textBaseline = 'middle'; font(c, npx); c.fillText(nm, 0, 4); c.restore();
      // (el historial no va en el póster)
      if (T.lead) { var tag = d.fin ? '👑 GANADOR' : '▲ ADELANTE'; font(c, 22, true); var tw = c.measureText(tag).width + 30; slab(c, x - tw / 2, cy - 178, tw, 44, PAPER, -.06); c.save(); c.translate(x, cy - 156); c.rotate(-.06); c.fillStyle = INK; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(tag, 0, 2); c.restore(); }
    });
    // marcador central enorme
    var cx = W / 2, cy2 = 700;
    if (d.live || d.fin) { c.save(); c.translate(cx, cy2); c.rotate(-.06); font(c, 190); c.textAlign = 'center'; c.textBaseline = 'middle'; var sc = d.hs + '-' + d.as;
      c.fillStyle = INK; c.fillText(sc, 12, 14); c.lineWidth = 10; c.strokeStyle = INK; c.strokeText(sc, 0, 0); c.fillStyle = PAPER; c.fillText(sc, 0, 0); c.restore(); }
    else { c.fillStyle = INK; c.beginPath(); c.arc(cx, cy2, 84, 0, 7); c.fill(); c.lineWidth = 8; c.strokeStyle = PAPER; c.beginPath(); c.arc(cx, cy2, 70, 0, 7); c.stroke(); font(c, 56); c.fillStyle = LIME; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('VS', cx, cy2 + 3); }
    // apoyo de la afición
    var by = 1150, bx = 60, bw = W - 120, bh = 46, ph = Math.max(.1, Math.min(.9, d.fanH / 100));
    font(c, 18, true); c.fillStyle = MUT; c.textAlign = 'left'; c.textBaseline = 'middle'; sp(c, 'APOYO DE LA AFICIÓN' + (d.fanTot ? ' · ' + d.fanTot : ''), bx, by, 3);
    c.fillStyle = PAPER; c.fillRect(bx - 3, by + 18, bw + 6, bh + 6); c.fillStyle = CON; c.fillRect(bx, by + 21, bw * ph, bh); c.fillStyle = LIME; c.fillRect(bx + bw * ph, by + 21, bw * (1 - ph), bh); stripes(c, bx, by + 21, bw, bh, 'rgba(255,255,255,.18)');
    font(c, 26); c.fillStyle = INK; c.textAlign = 'left'; c.fillText(d.fanH + '%', bx + 14, by + 46); c.textAlign = 'right'; c.fillText((100 - d.fanH) + '%', bx + bw - 14, by + 46);
    brand(c, 1250, d.date || 'magna sports');
  }

  // ---------- alineación: cancha horizontal (igual que en la página) ----------
  function drawLineup(cv, d) {
    cv.width = W; cv.height = H; var c = cv.getContext('2d'); c.fillStyle = INK; c.fillRect(0, 0, W, H);
    var gg = c.createRadialGradient(W - 140, 120, 30, W - 140, 120, 520); gg.addColorStop(0, 'rgba(139,92,246,.5)'); gg.addColorStop(1, 'rgba(139,92,246,0)'); c.fillStyle = gg; c.fillRect(0, 0, W, 520); grain(c, 0, 0, W, H, .25);
    mascot(c, d.masc, W - 185, 165, 310, true);
    (function () { var px = shrink(c, 'ALINEACIONES', 640, 96, 40); c.save(); c.translate(48, 150); c.rotate(-.04); c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillStyle = CON; c.fillText('ALINEACIONES', 8, 8); c.lineWidth = 7; c.strokeStyle = INK; c.strokeText('ALINEACIONES', 0, 0); c.fillStyle = PAPER; c.fillText('ALINEA', 0, 0); var w0 = c.measureText('ALINEA').width; c.fillStyle = LIME; c.fillText('CIONES', w0, 0); c.restore(); })();
    var st = d.status === 'live' ? '● EN VIVO' : d.status === 'finished' ? 'FINAL' : 'PRÓXIMO'; chip(c, st, 52, 232, d.status === 'live' ? RED : PAPER, d.status === 'live' ? '#fff' : INK, 22);
    font(c, 19, true); c.fillStyle = MUT; c.textAlign = 'left'; c.textBaseline = 'middle'; sp(c, fit(c, [d.comp, d.round].filter(Boolean).join(' · ') || 'Magna Sports', 640), 52, 300, 3);
    // cabecera de equipos
    var ty = 330, th = 110; c.fillStyle = INK; c.fillRect(0, ty - 6, W, th + 12); c.fillStyle = CON; c.fillRect(0, ty, W / 2 - 70, th); c.fillStyle = LIME; c.fillRect(W / 2 + 70, ty, W / 2 - 70, th); grain(c, 0, ty, W, th, .3);
    [[d.h, 'h'], [d.a, 'a']].forEach(function (t) { var T = t[0], L = t[1] === 'h', cx = L ? 80 : W - 80; crest(c, T.img, T.name, T.color, cx, ty + th / 2, 80);
      shrink(c, T.name.toUpperCase(), 290, 34, 16); c.fillStyle = INK; c.textBaseline = 'alphabetic'; c.textAlign = L ? 'left' : 'right'; c.fillText(T.name.toUpperCase(), L ? 140 : W - 140, ty + 56);
      font(c, 16, true); c.fillText(fit(c, (T.avg != null ? 'NOTA ' + String(T.avg.toFixed(1)).replace('.', ',') + ' · ' : '') + (T.dt ? 'DT ' + T.dt.toUpperCase() : T.players.length + ' EN CANCHA'), 280), L ? 140 : W - 140, ty + 86); });
    font(c, 50); c.fillStyle = LIME; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(d.status === 'scheduled' ? 'VS' : d.hs + '-' + d.as, W / 2, ty + th / 2 + 2);
    // cancha horizontal: local a la izquierda (morado pastel), visitante a la derecha (lima pastel)
    var px = 40, py = 470, pw = W - 80, ph = 560;
    c.fillStyle = PP; c.fillRect(px, py, pw / 2, ph); c.fillStyle = PL; c.fillRect(px + pw / 2, py, pw / 2, ph);
    c.fillStyle = 'rgba(255,255,255,.2)'; for (var b = 0; b < 10; b += 2) c.fillRect(px + b * pw / 10, py, pw / 10, ph);
    var m = 22, L0 = px + m, T0 = py + m, R0 = px + pw - m, B0 = py + ph - m, cx0 = px + pw / 2, cy0 = py + ph / 2;
    c.save(); c.strokeStyle = '#fff'; c.lineWidth = 5; c.shadowColor = 'rgba(12,7,22,.4)'; c.shadowBlur = 3;
    c.strokeRect(L0, T0, R0 - L0, B0 - T0); c.beginPath(); c.moveTo(cx0, T0); c.lineTo(cx0, B0); c.stroke(); c.beginPath(); c.arc(cx0, cy0, 78, 0, 7); c.stroke();
    var bw2 = (R0 - L0) * .15, bh2 = (B0 - T0) * .52, gw = (R0 - L0) * .055, gh = (B0 - T0) * .26;
    [L0, R0].forEach(function (xx, k) { var dir = k ? -1 : 1; c.strokeRect(k ? xx - bw2 : xx, cy0 - bh2 / 2, bw2, bh2); c.strokeRect(k ? xx - gw : xx, cy0 - gh / 2, gw, gh);
      c.beginPath(); c.arc(xx + dir * bw2, cy0, 46, k ? Math.PI / 2 : -Math.PI / 2, k ? Math.PI * 1.5 : Math.PI / 2, false); c.stroke(); c.fillStyle = '#fff'; c.beginPath(); c.arc(xx + dir * bw2 * .68, cy0, 6, 0, 7); c.fill();
      c.fillStyle = 'rgba(255,255,255,.85)'; c.fillRect(k ? xx : xx - 14, cy0 - gh * .3, 14, gh * .6); });
    [[L0, T0, 0], [R0, T0, Math.PI / 2], [R0, B0, Math.PI], [L0, B0, Math.PI * 1.5]].forEach(function (q) { c.beginPath(); c.arc(q[0], q[1], 16, q[2], q[2] + Math.PI / 2); c.stroke(); });
    c.fillStyle = '#fff'; c.beginPath(); c.arc(cx0, cy0, 7, 0, 7); c.fill(); c.restore();
    c.lineWidth = 6; c.strokeStyle = INK; c.strokeRect(px, py, pw, ph);
    // chips de equipo en las esquinas
    [[d.h.name, px + 16, 'left'], [d.a.name, px + pw - 16, 'right']].forEach(function (t) { font(c, 18, true); var tw = c.measureText(t[0].toUpperCase()).width + 24, x0 = t[2] === 'left' ? t[1] : t[1] - tw; c.fillStyle = 'rgba(12,7,22,.82)'; c.fillRect(x0, py + 16, tw, 34); c.fillStyle = PAPER; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(t[0].toUpperCase(), x0 + tw / 2, py + 34); });
    // jugadores (misma posición que en la cancha de la página)
    [[d.h, 'h'], [d.a, 'a']].forEach(function (t) { var Tm = t[0], home = t[1] === 'h';
      Tm.players.forEach(function (p) { var x = px + pw * ((home ? p.x : 100 - p.x) / 100), y = py + ph * (p.y / 100), s = 100;
        c.fillStyle = 'rgba(12,7,22,.22)'; c.beginPath(); c.ellipse(x + 4, y + 60, 44, 12, 0, 0, 7); c.fill();
        c.fillStyle = INK; c.beginPath(); c.arc(x, y, s / 2 + 6, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y, s / 2 + 1, 0, 7); c.fill();
        c.save(); c.beginPath(); c.arc(x, y, s / 2 - 4, 0, 7); c.clip(); c.fillStyle = home ? CON : '#2fbf71'; c.fillRect(x - s, y - s, s * 2, s * 2);
        if (p.img) c.drawImage(p.img, x - s / 2 + 4, y - s / 2 + 4, s - 8, s - 8); else { font(c, 36); c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(p.ini, x, y + 2); } c.restore();
        if (p.r != null) { var rt = String(Number(p.r).toFixed(1)).replace('.', ','); font(c, 21, true); var rw = c.measureText(rt).width + 18; c.fillStyle = INK; c.fillRect(x - rw / 2 - 3, y + 32, rw + 6, 34); c.fillStyle = p.r >= 8 ? LIME : p.r >= 7 ? '#2ee59d' : p.r >= 6 ? '#ffd23f' : '#ff8a8a'; c.fillRect(x - rw / 2, y + 35, rw, 28); c.fillStyle = INK; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(rt, x, y + 50); }
        var nm = p.name, npx2 = shrink(c, nm, 190, 21, 12, true), nw = c.measureText(nm).width + 18; c.fillStyle = INK; c.fillRect(x - nw / 2, y + 72, nw, 32); c.fillStyle = PAPER; c.textAlign = 'center'; c.textBaseline = 'middle'; font(c, npx2, true); c.fillText(nm, x, y + 89);
        var ic = (p.g ? '⚽' + (p.g > 1 ? '×' + p.g : '') : '') + (p.sub ? ' ⇄' : '') + (p.mvp ? ' ⭐' : ''); if (ic) { c.font = '28px sans-serif'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillStyle = INK; c.fillText(ic.trim(), x + s / 2 - 8, y - s / 2 + 8); } }); });
    // datos clave
    var ky = 1060, ks = (d.keys || []).slice(0, 4), kw = ks.length ? (W - 80 - (ks.length - 1) * 14) / ks.length : 0;
    ks.forEach(function (k, i) { var x = 40 + i * (kw + 14); c.fillStyle = '#1a0f33'; c.fillRect(x, ky, kw, 124); c.fillStyle = k.side === 'h' ? CON : LIME; c.fillRect(x, ky, kw, 8);
      font(c, 16, true); c.fillStyle = MUT; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; sp(c, fit(c, k.lab, kw - 70), x + 18, ky + 42, 3); c.font = '30px sans-serif'; c.textAlign = 'right'; c.fillText(k.ic, x + kw - 14, ky + 46);
      font(c, 34); c.textAlign = 'left'; c.fillStyle = k.side === 'h' ? '#c9b3ff' : k.side === 'a' ? LIME : PAPER; c.fillText(fit(c, String(k.val).toUpperCase(), kw - 36), x + 18, ky + 88);
      font(c, 16, true); c.fillStyle = PAPER; c.fillText(fit(c, k.sub, kw - 36), x + 18, ky + 112); });
    if (!ks.length) { [[d.h, 'h'], [d.a, 'a']].forEach(function (t, i) { var T = t[0], x = 40 + i * ((W - 94) / 2 + 14), w = (W - 94) / 2; c.fillStyle = '#1a0f33'; c.fillRect(x, ky, w, 124); c.fillStyle = i ? LIME : CON; c.fillRect(x, ky, w, 8);
      font(c, 16, true); c.fillStyle = MUT; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; sp(c, 'BANCA · ' + T.name.toUpperCase(), x + 18, ky + 42, 3);
      font(c, 26); c.fillStyle = i ? LIME : '#c9b3ff'; c.fillText(fit(c, T.bench.length ? T.bench.join(' · ').toUpperCase() : 'SIN SUPLENTES', w - 36), x + 18, ky + 84);
      font(c, 16, true); c.fillStyle = PAPER; c.fillText(fit(c, T.dt ? 'DT ' + T.dt : '', w - 36), x + 18, ky + 110); }); }
    brand(c, 1220, d.date || 'magna sports');
  }

  // ---------- ventana con la imagen: descargar o compartir ----------
  var CSS = '.mp-ov{position:fixed;inset:0;z-index:400;display:grid;place-items:center;padding:16px;background:rgba(12,7,22,.86);animation:mpIn .25s ease-out}@keyframes mpIn{from{opacity:0}}' +
    '.mp-bx{width:min(440px,100%);max-height:100%;display:flex;flex-direction:column;gap:10px;background:#0c0716;border:3px solid #c6ff1a;box-shadow:0 -8px 0 #8b5cf6;padding:14px}' +
    '.mp-bx img{width:100%;height:auto;max-height:62vh;object-fit:contain;background:#000;border:2px solid #f2f2ee}' +
    '.mp-bx b{color:#f2f2ee;font:900 18px "Archivo Black",Archivo,sans-serif;text-transform:uppercase}.mp-bx small{color:#b9aee0;font:700 11px "Space Mono",monospace;letter-spacing:.04em}' +
    '.mp-bt{display:grid;grid-template-columns:1fr 1fr;gap:8px}.mp-bt button{border:2px solid #f2f2ee;background:#0c0716;color:#f2f2ee;font:700 13px "Space Mono",monospace;letter-spacing:.06em;text-transform:uppercase;padding:11px 8px;cursor:pointer}' +
    '.mp-bt button.p{background:#c6ff1a;color:#0c0716;border-color:#c6ff1a}.mp-bt button:active{transform:scale(.96)}.mp-x{grid-column:1/-1}';
  function css() { if (document.getElementById('mp-css')) return; var s = document.createElement('style'); s.id = 'mp-css'; s.textContent = CSS; document.head.appendChild(s); }
  function show(cv, name, text) {
    cv.toBlob(function (bl) { if (!bl) return; css(); var url = URL.createObjectURL(bl), f = window.File ? new File([bl], name, { type: 'image/png' }) : null;
      var ov = document.createElement('div'); ov.className = 'mp-ov'; ov.innerHTML = '<div class="mp-bx" role="dialog" aria-modal="true" aria-label="Imagen lista"><b>¡Imagen lista! 📸</b><img alt=""><small>Si no se descarga, mantén presionada la imagen para guardarla.</small><div class="mp-bt"><button type="button" class="p mp-d">⬇ Descargar</button><button type="button" class="mp-s">↗ Compartir</button><button type="button" class="mp-x">Cerrar</button></div></div>';
      ov.querySelector('img').src = url; ov.querySelector('img').alt = text;
      function close() { ov.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 500); document.removeEventListener('keydown', esc); }
      function esc(e) { if (e.key === 'Escape') close(); }
      ov.addEventListener('click', function (e) { if (e.target === ov) close(); }); document.addEventListener('keydown', esc);
      ov.querySelector('.mp-x').onclick = close;
      ov.querySelector('.mp-d').onclick = function () { var a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { a.remove(); }, 500); };
      var sb = ov.querySelector('.mp-s'); if (!(f && navigator.canShare && navigator.canShare({ files: [f] }))) sb.hidden = true;
      sb.onclick = function () { navigator.share({ files: [f], title: 'Magna Arena', text: text }).catch(function () {}); };
      document.body.appendChild(ov); ov.querySelector('.mp-d').focus(); }, 'image/png'); }
  function safe(draw, cv, d, strip) { try { draw(cv, d); cv.getContext('2d').getImageData(0, 0, 1, 1); return true; } catch (e) { strip(d); draw(cv, d); return true; } }
  function slug(s) { return String(s || 'partido').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

  return {
    score: function (d) { var mp = d.fin ? (Math.random() < .5 ? 'trofeo' : 'celebrando') : d.live ? 'senalando' : 'brazos-cruzados'; return Promise.all([fonts(), load(d.h.crest), load(d.a.crest), load(BG[d.kind]), load('mascota/' + mp + '.webp')]).then(function (r) { d.h.img = r[1]; d.a.img = r[2]; d.bg = r[3]; d.masc = r[4];
      var cv = document.createElement('canvas'); safe(drawScore, cv, d, function (x) { x.h.img = x.a.img = null; }); show(cv, slug(d.h.name + '-vs-' + d.a.name) + '-marcador.png', d.h.name + ' vs ' + d.a.name + ' en Magna Arena 🔥'); }); },
    lineup: function (d) { var ims = [fonts(), load(d.h.crest), load(d.a.crest), load('mascota/' + (d.status === 'finished' ? 'pulgar-arriba' : 'dab') + '.webp').then(function (i) { d.masc = i; })]; d.h.players.concat(d.a.players).forEach(function (p) { ims.push(load(p.av).then(function (i) { p.img = i; })); });
      return Promise.all(ims).then(function (r) { d.h.img = r[1]; d.a.img = r[2]; var cv = document.createElement('canvas');
        safe(drawLineup, cv, d, function (x) { x.h.img = x.a.img = null; x.h.players.concat(x.a.players).forEach(function (p) { p.img = null; }); });
        show(cv, slug(d.h.name + '-vs-' + d.a.name) + '-alineacion.png', 'Alineaciones de ' + d.h.name + ' vs ' + d.a.name + ' en Magna Arena ⚽'); }); }
  };
})();
