'use strict';
// Tarjeta para compartir (imagen 1080×1350, formato de publicación de Instagram) de un jugador o de un equipo.
// Se dibuja en un canvas con los datos del sitio y se comparte con el menú del celular o se descarga como PNG.
window.SHARE_CARD = (function () {
  var W = 1080, H = 1350, F = 'Archivo, "Arial Black", system-ui, sans-serif', MONO = '"JetBrains Mono", ui-monospace, monospace';
  function img(src) { return new Promise(function (ok) { if (!src) return ok(null); var i = new Image(); i.decoding = 'async'; i.onload = function () { ok(i); }; i.onerror = function () { ok(null); }; i.src = src; }); }
  function fonts() { if (!document.fonts || !document.fonts.load) return Promise.resolve(); return Promise.all(['900 80px Archivo', '700 40px Archivo', '700 30px "JetBrains Mono"'].map(function (f) { return document.fonts.load(f).catch(function () {}); })).catch(function () {}); }
  function rgb(c) { var m = /^#?([0-9a-f]{6})$/i.exec(c || ''); if (!m) return [139, 92, 246]; var n = parseInt(m[1], 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function rgba(c, a) { return 'rgba(' + rgb(c).join(',') + ',' + a + ')'; }
  function rr(x, c, y, w, h, r) { x.beginPath(); x.moveTo(c + r, y); x.arcTo(c + w, y, c + w, y + h, r); x.arcTo(c + w, y + h, c, y + h, r); x.arcTo(c, y + h, c, y, r); x.arcTo(c, y, c + w, y, r); x.closePath(); }
  // texto que se achica hasta caber en el ancho
  function fit(x, txt, max, size, weight, font) { var s = size; do { x.font = (weight || 900) + ' ' + s + 'px ' + (font || F); if (x.measureText(txt).width <= max) break; s -= 2; } while (s > 18); return s; }
  function bg(x, col) {
    var g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#0b0f22'); g.addColorStop(.55, '#120c2c'); g.addColorStop(1, '#05070e'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    var r = x.createRadialGradient(W * .78, 120, 40, W * .78, 120, 900); r.addColorStop(0, rgba(col, .55)); r.addColorStop(1, rgba(col, 0)); x.fillStyle = r; x.fillRect(0, 0, W, H);
    var r2 = x.createRadialGradient(80, H - 80, 20, 80, H - 80, 700); r2.addColorStop(0, 'rgba(255,90,54,.28)'); r2.addColorStop(1, 'rgba(255,90,54,0)'); x.fillStyle = r2; x.fillRect(0, 0, W, H);
    x.save(); x.globalAlpha = .06; x.strokeStyle = '#fff'; x.lineWidth = 2; for (var i = -H; i < W; i += 46) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + H * .45, H); x.stroke(); } x.restore();
    x.save(); x.strokeStyle = rgba(col, .9); x.lineWidth = 6; rr(x, 24, 24, W - 48, H - 48, 48); x.stroke(); x.restore();
  }
  function head(x, logo, kicker) {
    if (logo) x.drawImage(logo, 70, 66, 62, 62 * logo.height / logo.width);
    x.fillStyle = '#f1f3fb'; x.font = '900 34px ' + F; x.textBaseline = 'middle'; x.fillText('MAGNA ARENA', logo ? 148 : 70, 100);
    x.fillStyle = 'rgba(241,243,251,.6)'; x.font = '700 22px ' + MONO; x.textAlign = 'right'; x.fillText(kicker, W - 70, 100); x.textAlign = 'left';
  }
  function foot(x) {
    x.fillStyle = 'rgba(241,243,251,.55)'; x.font = '700 24px ' + MONO; x.textBaseline = 'middle'; x.textAlign = 'center'; x.fillText((location.host || 'magna-sports.vercel.app').toUpperCase(), W / 2, H - 58); x.textAlign = 'left';
  }
  function stats(x, items, y, col) {
    var n = items.length, gap = 18, w = (W - 140 - gap * (n - 1)) / n;
    items.forEach(function (it, i) { var cx = 70 + i * (w + gap); x.fillStyle = 'rgba(255,255,255,.06)'; rr(x, cx, y, w, 150, 26); x.fill(); x.strokeStyle = 'rgba(255,255,255,.12)'; x.lineWidth = 2; x.stroke();
      x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.fillStyle = i === 0 ? col : '#f1f3fb'; fit(x, String(it[0]), w - 24, 64); x.fillText(String(it[0]), cx + w / 2, y + 86);
      x.fillStyle = 'rgba(241,243,251,.6)'; x.font = '700 20px ' + MONO; x.fillText(it[1].toUpperCase(), cx + w / 2, y + 124); x.textAlign = 'left'; });
  }
  // vitrina: hasta 6 trofeos con su imagen (si existe) y el número de veces
  function cabinet(x, list, y, col) {
    if (!list.length) { x.fillStyle = 'rgba(241,243,251,.5)'; x.font = '700 30px ' + F; x.textAlign = 'center'; x.fillText('🏆 La vitrina espera su primer título', W / 2, y + 90); x.textAlign = 'left'; return Promise.resolve(); }
    x.fillStyle = 'rgba(241,243,251,.6)'; x.font = '700 22px ' + MONO; x.fillText('VITRINA', 70, y); var L = list.slice(0, 6), n = L.length, gap = 16, w = Math.min(140, (W - 140 - gap * (n - 1)) / n), x0 = (W - (w * n + gap * (n - 1))) / 2;
    return Promise.all(L.map(function (t) { return img(t.art && t.art.src || t.art); })).then(function (ims) { L.forEach(function (t, i) { var cx = x0 + i * (w + gap), cy = y + 26;
      x.fillStyle = 'rgba(255,255,255,.05)'; rr(x, cx, cy, w, w + 70, 22); x.fill(); var im = ims[i];
      if (im) { var s = Math.min((w - 16) / im.width, (w - 6) / im.height); x.drawImage(im, cx + (w - im.width * s) / 2, cy + 8 + (w - 6 - im.height * s) / 2, im.width * s, im.height * s); }
      else { x.fillStyle = '#fff'; x.font = (w * .5) + 'px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t.emoji || '🏆', cx + w / 2, cy + w / 2); }
      x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.fillStyle = '#f1f3fb'; fit(x, t.name, w - 10, 20, 800); x.fillText(t.name, cx + w / 2, cy + w + 26);
      if (t.n > 1) { x.fillStyle = col; x.font = '900 24px ' + F; x.fillText('×' + t.n, cx + w / 2, cy + w + 56); } x.textAlign = 'left'; }); });
  }
  function avatar(x, im, name, cx, cy, r, col) {
    x.save(); x.shadowColor = rgba(col, .8); x.shadowBlur = 50; x.beginPath(); x.arc(cx, cy, r + 10, 0, Math.PI * 2); x.fillStyle = col; x.fill(); x.restore();
    x.save(); x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.clip();
    if (im) { var s = Math.max(2 * r / im.width, 2 * r / im.height); x.drawImage(im, cx - im.width * s / 2, cy - im.height * s / 2, im.width * s, im.height * s); }
    else { var g = x.createLinearGradient(cx - r, cy - r, cx + r, cy + r); g.addColorStop(0, col); g.addColorStop(1, '#1b1240'); x.fillStyle = g; x.fillRect(cx - r, cy - r, 2 * r, 2 * r); x.fillStyle = '#fff'; x.font = '900 ' + Math.round(r * .8) + 'px ' + F; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(name || '?').slice(0, 2).toUpperCase(), cx, cy + 4); x.textAlign = 'left'; }
    x.restore();
  }
  function canvas() { var c = document.createElement('canvas'); c.width = W; c.height = H; return c; }
  function deliver(c, file, title) {
    return new Promise(function (ok) { c.toBlob(function (b) { ok(b); }, 'image/png'); }).then(function (b) {
      if (!b) throw new Error('No se pudo crear la imagen.'); var f = null; try { f = new File([b], file, { type: 'image/png' }); } catch (e) {}
      if (f && navigator.canShare && navigator.canShare({ files: [f] }) && navigator.share) return navigator.share({ files: [f], title: title }).then(function () { return 'shared'; }, function (e) { if (e && e.name === 'AbortError') return 'cancel'; return dl(b, file); });
      return dl(b, file); });
  }
  function dl(b, file) { var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = file; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500); return 'downloaded'; }
  function slug(s) { return String(s || 'magna').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'magna'; }

  // d: { name, team, teamCrest, avatar, media, tier:{name,color}, role, stats:[[valor,etiqueta]…], trophies:[{name,n,art,emoji}], ballon }
  function player(d) { var c = canvas(), x = c.getContext('2d'), col = (d.tier && d.tier.color) || '#ffd23f';
    return fonts().then(function () { return Promise.all([img('logo-sm.webp'), img(d.avatar), img(d.teamCrest)]); }).then(function (I) {
      bg(x, col); head(x, I[0], 'TARJETA DE JUGADOR');
      avatar(x, I[1], d.name, W / 2, 380, 165, col);
      if (d.media != null) { x.save(); x.fillStyle = col; x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = 20; rr(x, W / 2 + 92, 210, 150, 96, 30); x.fill(); x.restore(); x.fillStyle = '#0a0d18'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '900 60px ' + F; x.fillText(String(d.media), W / 2 + 167, 262); x.textAlign = 'left'; }
      x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.fillStyle = '#ffffff'; fit(x, d.name.toUpperCase(), W - 160, 104); x.fillText(d.name.toUpperCase(), W / 2, 680);
      var sub = [d.role, d.team || 'Agente libre'].filter(Boolean).join(' · '); x.fillStyle = 'rgba(241,243,251,.75)'; fit(x, sub, W - 200, 36, 700); x.fillText(sub, W / 2, 734);
      if (d.tier) { var tt = '◆ ' + d.tier.name.toUpperCase() + (d.ballon ? '   🥇 ' + d.ballon + (d.ballon > 1 ? ' BALONES DE ORO' : ' BALÓN DE ORO') : ''); x.font = '700 26px ' + MONO; var tw = x.measureText(tt).width + 56; x.fillStyle = rgba(col, .18); rr(x, (W - tw) / 2, 760, tw, 54, 27); x.fill(); x.strokeStyle = rgba(col, .7); x.lineWidth = 2; x.stroke(); x.fillStyle = col; x.textBaseline = 'middle'; x.fillText(tt, W / 2, 788); }
      x.textAlign = 'left'; stats(x, d.stats, 846, col);
      return cabinet(x, d.trophies || [], 1036, col); }).then(function () { foot(x); return c; }); }

  // d: { name, color, crest, pos, pts, level, record:[w,l], trophies:[…], coach, squad:[nombres] }
  function team(d) { var c = canvas(), x = c.getContext('2d'), col = d.color || '#8b5cf6';
    return fonts().then(function () { return Promise.all([img('logo-sm.webp'), img(d.crest)]); }).then(function (I) {
      bg(x, col); head(x, I[0], 'TARJETA DE EQUIPO');
      x.save(); x.globalAlpha = .07; x.fillStyle = '#fff'; x.textAlign = 'center'; fit(x, d.name.toUpperCase(), W * 1.6, 300); x.fillText(d.name.toUpperCase(), W / 2, 470); x.restore();
      if (I[1]) { x.save(); x.shadowColor = rgba(col, .9); x.shadowBlur = 70; var s = 300 / Math.max(I[1].width, I[1].height); x.drawImage(I[1], W / 2 - I[1].width * s / 2, 390 - I[1].height * s / 2, I[1].width * s, I[1].height * s); x.restore(); }
      else avatar(x, null, d.name, W / 2, 390, 150, col);
      x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.fillStyle = '#fff'; fit(x, d.name.toUpperCase(), W - 160, 110); x.fillText(d.name.toUpperCase(), W / 2, 680);
      var sub = [d.pos ? '#' + d.pos + ' DEL RANKING' : null, d.coach ? 'DT: ' + d.coach : null].filter(Boolean).join('  ·  '); x.fillStyle = 'rgba(241,243,251,.75)'; fit(x, sub, W - 200, 34, 700); x.fillText(sub, W / 2, 734);
      if (d.squad && d.squad.length) { var sq = d.squad.slice(0, 5).join(' · '); x.fillStyle = col; fit(x, sq, W - 200, 30, 800); x.fillText(sq, W / 2, 788); }
      x.textAlign = 'left'; stats(x, [[String(d.pts).replace(/\B(?=(\d{3})+(?!\d))/g, '.'), 'Puntos'], [d.trophyCount, 'Trofeos'], [d.record[0] + '-' + d.record[1], 'V-D'], [d.level, 'Nivel']], 846, col);
      return cabinet(x, d.trophies || [], 1036, col); }).then(function () { foot(x); return c; }); }

  // d: { name, kicker, comp, status, live, home:{name,color,crest}, away:{…}, hs, as, scheduled, when, prob, mvp, best, scorers:[texto], sets, winner, pose, say }
  // portada estilo cómic: colores de los dos equipos, puntos de trama, marcador gigante y la mascota en una foto con globo de texto
  function match(d) { var c = canvas(), x = c.getContext('2d'), hc = d.home.color || '#8b5cf6', ac = d.away.color || '#ff5a36', INK = '#0d0d10', CREAM = '#f1ead8', LIME = '#c6ff1a';
    var pose = d.pose || (d.scheduled ? 'pensando' : d.live ? 'salto' : 'trofeo');
    function ink(fn, sh, col) { x.save(); x.fillStyle = col || INK; x.translate(sh || 10, sh || 10); fn(); x.fill(); x.restore(); }
    function panel(px, py, w, hh, fill, lbl, val, emoji) { ink(function () { rr(x, px, py, w, hh, 18); }); rr(x, px, py, w, hh, 18); x.fillStyle = fill; x.fill(); x.lineWidth = 6; x.strokeStyle = INK; x.stroke();
      x.textAlign = 'left'; x.textBaseline = 'alphabetic'; x.fillStyle = 'rgba(13,13,16,.65)'; x.font = '800 22px ' + MONO; x.fillText(lbl.toUpperCase(), px + 24, py + 42);
      if (emoji) { x.font = '44px system-ui'; x.textAlign = 'right'; x.fillText(emoji, px + w - 18, py + 54); x.textAlign = 'left'; }
      x.fillStyle = INK; fit(x, val, w - 48, 44, 900); x.fillText(val, px + 24, py + hh - 26); }
    return fonts().then(function () { return Promise.all([img('logo-sm.webp'), img(d.home.crest), img(d.away.crest), img('mascota/' + pose + '.webp')]); }).then(function (I) {
      // fondo: diagonal con los colores de cada equipo, rayas de velocidad y trama de puntos
      x.fillStyle = '#0b0b14'; x.fillRect(0, 0, W, H);
      x.save(); x.beginPath(); x.moveTo(0, 0); x.lineTo(W, 0); x.lineTo(W, 330); x.lineTo(0, 860); x.closePath(); x.fillStyle = rgba(hc, .78); x.fill(); x.restore();
      x.save(); x.beginPath(); x.moveTo(W, 330); x.lineTo(W, H); x.lineTo(0, H); x.lineTo(0, 860); x.closePath(); x.fillStyle = rgba(ac, .72); x.fill(); x.restore();
      x.save(); x.globalAlpha = .12; x.strokeStyle = '#fff'; x.lineWidth = 3; for (var k = 0; k < 64; k++) { var an = k / 64 * Math.PI * 2; x.beginPath(); x.moveTo(W / 2 + Math.cos(an) * 170, 440 + Math.sin(an) * 170); x.lineTo(W / 2 + Math.cos(an) * 1400, 440 + Math.sin(an) * 1400); x.stroke(); } x.restore();
      x.save(); x.fillStyle = 'rgba(0,0,0,.16)'; for (var yy = 12; yy < H; yy += 24) for (var xx = (yy / 24 % 2) * 12; xx < W; xx += 24) { var rad = 2 + 4 * (yy / H); x.beginPath(); x.arc(xx, yy, rad, 0, Math.PI * 2); x.fill(); } x.restore();
      x.save(); x.strokeStyle = INK; x.lineWidth = 16; x.beginPath(); x.moveTo(-10, 866); x.lineTo(W + 10, 336); x.stroke(); x.strokeStyle = CREAM; x.lineWidth = 5; x.stroke(); x.restore();
      // cabecera tinta + etiqueta
      x.fillStyle = INK; x.fillRect(0, 0, W, 132); if (I[0]) x.drawImage(I[0], 56, 30, 70, 70 * I[0].height / I[0].width);
      x.fillStyle = '#fff'; x.font = 'italic 900 44px ' + F; x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillText('MAGNA ARENA', 142, 68);
      x.save(); x.translate(W - 200, 70); x.rotate(-.06); var kk = d.kicker || 'RESULTADO'; x.font = '900 26px ' + F; var kw = x.measureText(kk).width + 44; x.fillStyle = LIME; x.fillRect(-kw / 2, -26, kw, 52); x.strokeStyle = '#fff'; x.lineWidth = 3; x.strokeRect(-kw / 2, -26, kw, 52); x.fillStyle = INK; x.textAlign = 'center'; x.fillText(kk, 0, 2); x.restore();
      // tira de papel con la competición
      var cp = (d.comp || '').toUpperCase(); x.save(); x.translate(W / 2, 196); x.rotate(-.02); x.font = '800 26px ' + MONO; var cw = Math.min(W - 160, x.measureText(cp).width + 70);
      x.fillStyle = CREAM; x.beginPath(); x.moveTo(-cw / 2, -28); for (var t2 = -cw / 2; t2 < cw / 2; t2 += 24) x.lineTo(t2 + 12, -28 + (t2 / 24 % 2 ? 4 : -4)); x.lineTo(cw / 2, -28); x.lineTo(cw / 2, 28); for (var t3 = cw / 2; t3 > -cw / 2; t3 -= 24) x.lineTo(t3 - 12, 28 + (t3 / 24 % 2 ? -4 : 4)); x.closePath(); x.fill();
      x.fillStyle = INK; x.textAlign = 'center'; x.textBaseline = 'middle'; fit(x, cp, cw - 40, 26, 800, MONO); x.fillText(cp, 0, 2); x.restore();
      // escudos con aro de tinta y nombres en etiqueta
      [[d.home, I[1], 196, hc, -.05], [d.away, I[2], W - 196, ac, .05]].forEach(function (t) { var cx = t[2], cy = 420, R = 118;
        x.save(); x.fillStyle = INK; x.beginPath(); x.arc(cx + 10, cy + 10, R + 12, 0, Math.PI * 2); x.fill(); x.fillStyle = CREAM; x.beginPath(); x.arc(cx, cy, R + 12, 0, Math.PI * 2); x.fill(); x.lineWidth = 6; x.strokeStyle = INK; x.stroke(); x.restore();
        if (t[1]) { x.save(); x.beginPath(); x.arc(cx, cy, R, 0, Math.PI * 2); x.clip(); var sc = Math.min(2 * R / t[1].width, 2 * R / t[1].height) * .92; x.drawImage(t[1], cx - t[1].width * sc / 2, cy - t[1].height * sc / 2, t[1].width * sc, t[1].height * sc); x.restore(); }
        else avatar(x, null, t[0].name, cx, cy, R - 8, t[3]);
        x.save(); x.translate(cx, cy + R + 64); x.rotate(t[4]); var nmx = t[0].name.toUpperCase(); var fs = fit(x, nmx, 330, 46, 900); var nw = x.measureText(nmx).width + 44;
        x.fillStyle = INK; x.fillRect(-nw / 2 + 7, -32 + 7, nw, 64); x.fillStyle = '#fff'; x.fillRect(-nw / 2, -32, nw, 64); x.lineWidth = 5; x.strokeStyle = INK; x.strokeRect(-nw / 2, -32, nw, 64);
        x.fillStyle = INK; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = 'italic 900 ' + fs + 'px ' + F; x.fillText(nmx, 0, 3); x.restore(); });
      // marcador gigante
      x.save(); x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
      var big = d.scheduled ? 'VS' : d.hs + '-' + d.as; x.font = 'italic 900 ' + (d.scheduled ? 150 : 176) + 'px ' + F;
      x.fillStyle = INK; x.fillText(big, W / 2 + 12, 432 + 12); x.lineWidth = 18; x.strokeStyle = INK; x.strokeText(big, W / 2, 432); x.fillStyle = d.scheduled ? '#ffd23f' : '#fff'; x.fillText(big, W / 2, 432); x.restore();
      // sello de estado
      x.save(); x.translate(W / 2, 600); x.rotate(-.05); var stt = d.status || ''; x.font = '900 32px ' + F; var sw = x.measureText(stt).width + 56; var sc2 = d.live ? '#ff3b47' : d.scheduled ? '#ffd23f' : LIME;
      x.fillStyle = INK; x.fillRect(-sw / 2 + 6, -30 + 6, sw, 60); x.fillStyle = sc2; x.fillRect(-sw / 2, -30, sw, 60); x.lineWidth = 5; x.strokeStyle = INK; x.strokeRect(-sw / 2, -30, sw, 60);
      x.fillStyle = d.live ? '#fff' : INK; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(stt, 0, 2); x.restore();
      // paneles de datos (izquierda)
      var PX = 60, PW = 520, py = 760;
      if (d.scheduled) { panel(PX, py, PW, 140, '#ffd23f', 'Cuándo', d.when || 'Por definir', '📅'); panel(PX, py + 170, PW, 140, '#7dd3fc', 'Favorito', d.prob || '—', '🔮'); panel(PX, py + 340, PW, 130, LIME, 'Tu jugada', 'Apuesta tus Bits', '🎲'); }
      else { panel(PX, py, PW, 140, '#ffd23f', 'MVP del partido', d.mvp || 'Por elegir', '⭐'); panel(PX, py + 170, PW, 140, '#7dd3fc', d.sets ? 'Sets' : 'Mejor nota', d.sets ? d.sets + (d.best ? '  ·  ' + d.best : '') : (d.best || '—'), d.sets ? '🎮' : '📈');
        var gl = (d.scorers || []).slice(0, 4).join(' · ') + ((d.scorers || []).length > 4 ? ' …' : ''); panel(PX, py + 340, PW, 130, LIME, 'Goles', gl || 'Sin goleadores registrados', '⚽'); }
      // la mascota en una foto con cinta, girada
      var MX = 640, MY = 790, MW = 380, MH = 440;
      x.save(); x.translate(MX + MW / 2, MY + MH / 2); x.rotate(.06);
      x.fillStyle = INK; x.fillRect(-MW / 2 + 12, -MH / 2 + 12, MW, MH); x.fillStyle = '#fff'; x.fillRect(-MW / 2, -MH / 2, MW, MH); x.lineWidth = 5; x.strokeStyle = INK; x.strokeRect(-MW / 2, -MH / 2, MW, MH);
      var iw = MW - 36, ih = MH - 100; x.save(); x.beginPath(); x.rect(-iw / 2, -MH / 2 + 18, iw, ih); x.clip(); x.fillStyle = '#2a1640'; x.fillRect(-iw / 2, -MH / 2 + 18, iw, ih);
      if (I[3]) { var ms = Math.max(iw / I[3].width, ih / I[3].height); x.drawImage(I[3], -I[3].width * ms / 2, -MH / 2 + 18 + ih / 2 - I[3].height * ms / 2, I[3].width * ms, I[3].height * ms); } x.restore();
      x.fillStyle = INK; x.font = 'italic 900 34px ' + F; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(d.scheduled ? '¡NO TE LO PIERDAS!' : d.live ? '¡EN VIVO!' : '¡QUÉ PARTIDO!', 0, MH / 2 - 42);
      x.fillStyle = 'rgba(198,255,26,.85)'; x.save(); x.rotate(-.2); x.fillRect(-70, -MH / 2 - 22, 140, 40); x.restore(); x.restore();
      // globo de texto de la mascota
      var say = d.say || (d.scheduled ? '¿Quién se lo lleva?' : d.live ? '¡Esto está que arde!' : d.winner ? '¡Grande ' + d.winner + '!' : '¡Qué partidazo!');
      x.save(); x.font = 'italic 900 34px ' + F; var bw = Math.min(400, x.measureText(say).width + 60), bx = 600, by = 672, bh = 86;
      x.fillStyle = INK; rr(x, bx + 8, by + 8, bw, bh, 40); x.fill(); x.fillStyle = '#fff'; rr(x, bx, by, bw, bh, 40); x.fill(); x.lineWidth = 5; x.strokeStyle = INK; x.stroke();
      x.beginPath(); x.moveTo(bx + bw * .55, by + bh - 3); x.lineTo(bx + bw * .66, by + bh + 46); x.lineTo(bx + bw * .74, by + bh - 3); x.closePath(); x.fillStyle = '#fff'; x.fill(); x.stroke(); x.fillStyle = '#fff'; x.fillRect(bx + bw * .55 + 4, by + bh - 9, bw * .19 - 8, 10);
      x.fillStyle = INK; x.textAlign = 'center'; x.textBaseline = 'middle'; fit(x, say, bw - 40, 34, 900); x.font = 'italic ' + x.font; x.fillText(say, bx + bw / 2, by + bh / 2 + 2); x.restore();
      // pie de tinta
      x.fillStyle = INK; x.fillRect(0, H - 74, W, 74); x.fillStyle = LIME; x.font = '800 24px ' + MONO; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText((location.host || 'magna-sports.vercel.app').toUpperCase() + '  ·  ¡VIVE CADA PARTIDO!', W / 2, H - 37);
      x.textAlign = 'left'; return c; }); }

  // botón listo para poner en una página: genera la tarjeta, muestra una vista previa y deja compartir o descargar
  function open(kind, getData) {
    var ov = document.createElement('div'); ov.className = 'shc-ov'; ov.innerHTML = '<div class="shc" role="dialog" aria-modal="true" aria-label="Tarjeta para compartir"><div class="shc-hd"><b>Tarjeta para compartir</b><button type="button" class="shc-x" aria-label="Cerrar">✕</button></div><div class="shc-im"><div class="shc-ld">Creando tu tarjeta…</div></div><div class="shc-ac"><button type="button" class="shc-go" disabled>📤 Compartir</button><button type="button" class="shc-dl" disabled>⬇ Descargar</button></div><p class="shc-hint">Perfecta para historias, publicaciones o el grupo de WhatsApp.</p></div>';
    document.body.appendChild(ov); requestAnimationFrame(function () { ov.classList.add('on'); });
    function close() { ov.classList.remove('on'); setTimeout(function () { ov.remove(); }, 220); document.removeEventListener('keydown', esc); }
    function esc(e) { if (e.key === 'Escape') close(); } document.addEventListener('keydown', esc);
    ov.addEventListener('click', function (e) { if (e.target === ov || e.target.closest('.shc-x')) close(); });
    var d = getData(), file = 'magna-' + slug(d.name) + '.png', go = ov.querySelector('.shc-go'), dlb = ov.querySelector('.shc-dl'), box = ov.querySelector('.shc-im');
    (kind === 'team' ? team(d) : kind === 'match' ? match(d) : player(d)).then(function (c) { var u = c.toDataURL('image/png'), im = new Image(); im.src = u; im.alt = 'Tarjeta de ' + d.name; box.innerHTML = ''; box.appendChild(im);
      go.disabled = dlb.disabled = false; if (!(navigator.share && navigator.canShare)) go.style.display = 'none';
      go.onclick = function () { deliver(c, file, d.name + ' · Magna Arena').catch(function () {}); };
      dlb.onclick = function () { c.toBlob(function (b) { if (b) dl(b, file); }, 'image/png'); };
    }, function () { box.innerHTML = '<div class="shc-ld">No se pudo crear la tarjeta. Intenta de nuevo.</div>'; });
  }
  if (!document.getElementById('shc-css')) { var st = document.createElement('style'); st.id = 'shc-css'; st.textContent =
    '.shc-ov{position:fixed;inset:0;z-index:120;background:rgba(5,7,14,.78);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);display:grid;place-items:center;padding:16px;opacity:0;transition:opacity .2s}.shc-ov.on{opacity:1}' +
    '.shc{width:min(440px,100%);max-height:calc(100vh - 32px);overflow:auto;background:#0f1326;border:1px solid rgba(255,255,255,.12);border-radius:26px;padding:16px;transform:translateY(14px) scale(.98);transition:transform .25s cubic-bezier(.2,.9,.2,1);font-family:Archivo,system-ui,sans-serif;color:#f1f3fb}.shc-ov.on .shc{transform:none}' +
    '.shc-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}.shc-hd b{font-size:17px}.shc-x{width:36px;height:36px;border-radius:50%;border:1px solid rgba(255,255,255,.18);background:none;color:inherit;cursor:pointer;font-size:15px}' +
    '.shc-im{aspect-ratio:4/5;border-radius:18px;overflow:hidden;background:#05070e;display:grid;place-items:center}.shc-im img{width:100%;height:100%;object-fit:cover;display:block;animation:shcIn .4s both}@keyframes shcIn{from{opacity:0;transform:scale(.96)}}' +
    '.shc-ld{color:rgba(241,243,251,.6);font-size:14px;animation:shcP 1.2s infinite}@keyframes shcP{50%{opacity:.4}}' +
    '.shc-ac{display:flex;gap:10px;margin-top:14px}.shc-ac button{flex:1;border-radius:999px;padding:13px 14px;font:800 15px Archivo,sans-serif;cursor:pointer;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.05);color:#f1f3fb}.shc-ac .shc-go{background:linear-gradient(135deg,#ff5a36,#ff8a00);border-color:transparent;color:#fff}.shc-ac button:disabled{opacity:.45;cursor:wait}' +
    '.shc-hint{margin:10px 2px 0;color:rgba(241,243,251,.55);font-size:12.5px;text-align:center}';
    document.head.appendChild(st); }
  return { player: player, team: team, match: match, open: open };
})();
