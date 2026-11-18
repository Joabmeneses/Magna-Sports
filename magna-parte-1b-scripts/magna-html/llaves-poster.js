'use strict';
// Cuadro de llaves a ida y vuelta dibujado en un lienzo 1080×1350 (formato 4:5, listo para Instagram/WhatsApp).
// El mismo dibujo sirve para verlo en la página y para compartirlo como foto.
// LlavesPoster.draw(canvas, d) -> zonas tocables [{x,y,w,h,r,i}]
// d = { title, sub, status, brand, trophy: Image, rounds: [{round, ties:[{a,b,ida,vta,des,ga,gb,win}]}],
//       team: function(id) -> {name, color, img}, champ, picks: {'r:i': id}, t: ms (para el brillo animado), grow: {'r:i': 0..1} }
window.LlavesPoster = (function () {
  var W = 1080, H = 1350, F = 'Archivo, "Arial Black", system-ui, sans-serif', M = '"JetBrains Mono", ui-monospace, monospace';
  var RC = { 'Final': ['#ffd23f', '#ff8a3d', '👑 FINAL'], 'Semifinales': ['#22d3ee', '#8b5cf6', '⚡ SEMIFINALES'], 'Cuartos de final': ['#ff4fa3', '#ff8a3d', '🔥 CUARTOS DE FINAL'], 'Octavos de final': ['#2ee59d', '#22d3ee', '🌀 OCTAVOS'] };
  function rc(r) { return RC[r] || ['#8b5cf6', '#ff4fa3', r.toUpperCase()]; }
  function rr(x, c, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function fit(c, s, w) { if (c.measureText(s).width <= w) return s; while (s.length > 1 && c.measureText(s + '…').width > w) s = s.slice(0, -1); return s + '…'; }
  function fin(m) { return m && m.status !== undefined ? m.status === 'finished' : m && m.st === 'finished'; }
  function sc(m, t) { return fin(m) ? (m.home === t ? m.hs : m.as) : null; }
  // insignias divertidas de cada llave
  function badges(t) { var b = []; if (t.win == null) { if (t.des && !fin(t.des)) b.push(['⚖ DESEMPATE', '#ffd23f']); return b; }
    var L = t.win === t.a ? t.b : t.a, i1 = t.ida;
    if (t.des) b.push(['⚖ DESEMPATE', '#ffd23f']);
    else if (fin(i1) && sc(i1, t.win) < sc(i1, L)) b.push(['🔄 REMONTADA', '#2ee59d']);
    if (Math.abs(t.ga - t.gb) >= 4) b.push(['💥 GOLEADA', '#ff4fa3']);
    else if (fin(t.ida) && fin(t.vta) && sc(t.ida, t.win) > sc(t.ida, L) && sc(t.vta, t.win) > sc(t.vta, L) && !b.length) b.push(['💪 2 DE 2', '#22d3ee']);
    return b; }
  function crest(c, tm, x, y, s) { c.save(); c.beginPath(); c.arc(x + s / 2, y + s / 2, s / 2, 0, 7); c.closePath();
    var g = c.createRadialGradient(x + s * .3, y + s * .3, 2, x + s / 2, y + s / 2, s / 2); g.addColorStop(0, '#ffffff55'); g.addColorStop(1, tm.color || '#444'); c.fillStyle = g; c.fill();
    if (tm.img && tm.img.complete && tm.img.naturalWidth) { c.clip(); c.fillStyle = '#0b0e1f'; c.fillRect(x, y, s, s); var r = Math.min(s / tm.img.naturalWidth, s / tm.img.naturalHeight); c.drawImage(tm.img, x + (s - tm.img.naturalWidth * r) / 2, y + (s - tm.img.naturalHeight * r) / 2, tm.img.naturalWidth * r, tm.img.naturalHeight * r); }
    else { c.fillStyle = '#fff'; c.font = '900 ' + Math.round(s * .36) + 'px ' + F; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText((tm.name || '?').slice(0, 2).toUpperCase(), x + s / 2, y + s / 2 + 1); }
    c.restore(); c.save(); c.beginPath(); c.arc(x + s / 2, y + s / 2, s / 2 + 1.5, 0, 7); c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 3; c.stroke(); c.restore(); }
  // el arte del trofeo trae fondo: se difumina en los bordes para que flote sobre el cuadro
  var SOFT = null;
  function soft(img, w, h) { if (SOFT && SOFT.src === img.src && SOFT.w === w) return SOFT.cv; var o = document.createElement('canvas'); o.width = Math.ceil(w); o.height = Math.ceil(h); var x = o.getContext('2d'); x.drawImage(img, 0, 0, w, h);
    x.globalCompositeOperation = 'destination-in'; x.translate(w / 2, h / 2); x.scale(w / 2, h / 2); var g = x.createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, '#000'); g.addColorStop(.62, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(-1, -1, 2, 2);
    SOFT = { src: img.src, w: w, cv: o }; return o; }
  function bg(c, d) { var g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#120a2e'); g.addColorStop(.5, '#0a0f2a'); g.addColorStop(1, '#1a0b1f'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    [[140, 160, 520, '#8b5cf6', .55], [980, 360, 480, '#ff8a3d', .38], [180, 1150, 520, '#22d3ee', .3], [930, 1180, 460, '#ff4fa3', .35]].forEach(function (b) { var r = c.createRadialGradient(b[0], b[1], 0, b[0], b[1], b[2]); r.addColorStop(0, b[3] + Math.round(b[4] * 255).toString(16).padStart(2, '0')); r.addColorStop(1, b[3] + '00'); c.fillStyle = r; c.fillRect(0, 0, W, H); });
    c.save(); c.globalAlpha = .06; c.strokeStyle = '#fff'; c.lineWidth = 18; for (var k = -H; k < W; k += 70) { c.beginPath(); c.moveTo(k, 0); c.lineTo(k + H, H); c.stroke(); } c.restore();
    c.save(); for (var i = 0; i < 70; i++) { var x = (i * 167) % W, y = (i * 311) % H, tw = .25 + .25 * Math.sin((d.t || 0) / 600 + i); c.globalAlpha = tw; c.fillStyle = '#fff'; c.fillRect(x, y, i % 3 ? 2 : 3, i % 3 ? 2 : 3); } c.restore(); }
  function header(c, d) { var tr = d.trophy;
    if (tr && tr.complete && tr.naturalWidth) { var th = 200, tw = tr.naturalWidth * th / tr.naturalHeight; c.save(); var gl = c.createRadialGradient(110, 115, 10, 110, 115, 130); gl.addColorStop(0, 'rgba(255,190,60,.55)'); gl.addColorStop(1, 'rgba(255,190,60,0)'); c.fillStyle = gl; c.fillRect(0, 0, 260, 260);
      c.restore(); c.drawImage(soft(tr, tw, th), 110 - tw / 2, 18, tw, th); }
    c.textBaseline = 'alphabetic'; c.textAlign = 'left';
    c.font = '700 22px ' + M; c.fillStyle = '#ffd23f'; c.fillText((d.brand || 'MAGNA ARENA').toUpperCase() + ' · TORNEO', 220, 96);
    c.font = '900 104px ' + F; var g = c.createLinearGradient(220, 0, 1000, 0); g.addColorStop(0, '#ffd23f'); g.addColorStop(.4, '#ff8a3d'); g.addColorStop(.75, '#ff4fa3'); g.addColorStop(1, '#a78bfa'); c.fillStyle = g;
    c.save(); c.shadowColor = 'rgba(255,120,60,.55)'; c.shadowBlur = 30; c.fillText(fit(c, (d.title || 'OMEGA CUP').toUpperCase(), 840), 216, 180); c.restore();
    c.font = '800 28px ' + F; c.fillStyle = '#e9ecff'; c.fillText(d.sub || 'Llaves a ida y vuelta', 222, 222);
    if (d.status) { c.font = '900 22px ' + F; var tw2 = c.measureText(d.status).width + 36; var x = W - 34 - tw2; rr(x, c, 26, tw2, 40, 20); var sg = c.createLinearGradient(x, 0, x + tw2, 0); sg.addColorStop(0, '#2ee59d'); sg.addColorStop(1, '#22d3ee'); c.fillStyle = sg; c.fill(); c.fillStyle = '#062019'; c.fillText(d.status, x + 18, 54); } }
  function node(c, d, t, x, y, w, h, R, key, isFinal) {
    var col = rc(R), pulse = .5 + .5 * Math.sin((d.t || 0) / 280), pend = t.des && !fin(t.des), done = t.win != null, champPath = d.champ != null && done && t.win === d.champ;
    c.save(); c.shadowColor = champPath ? 'rgba(255,210,63,.7)' : pend ? 'rgba(255,210,63,' + (.4 + .5 * pulse) + ')' : 'rgba(0,0,0,.55)'; c.shadowBlur = champPath ? 40 : pend ? 30 : 24; c.shadowOffsetY = pend || champPath ? 0 : 10;
    rr(x, c, y, w, h, 26); var g = c.createLinearGradient(x, y, x, y + h); g.addColorStop(0, '#232a5e'); g.addColorStop(1, '#12163a'); c.fillStyle = g; c.fill(); c.restore();
    // borde de colores de la ronda (dorado si es el camino del campeón)
    c.save(); rr(x, c, y, w, h, 26); var bg2 = c.createLinearGradient(x, y, x + w, y + h); bg2.addColorStop(0, champPath ? '#ffd23f' : col[0]); bg2.addColorStop(1, champPath ? '#ff8a3d' : col[1]); c.strokeStyle = bg2; c.lineWidth = isFinal ? 6 : 4; c.globalAlpha = t.a == null && t.b == null ? .45 : 1; c.stroke(); c.restore();
    // franja superior
    c.save(); rr(x, c, y, w, h, 26); c.clip(); var hg = c.createLinearGradient(x, 0, x + w, 0); hg.addColorStop(0, col[0]); hg.addColorStop(1, col[1]); c.globalAlpha = .9; c.fillStyle = hg; c.fillRect(x, y, w, 40); c.restore();
    var s = isFinal ? 1.12 : Math.min(1, w / 236); c.textBaseline = 'middle'; c.textAlign = 'left';
    c.font = '900 ' + Math.round(18 * s) + 'px ' + F; c.fillStyle = '#1a0f00'; c.fillText(isFinal ? 'GRAN FINAL' : 'LLAVE ' + (key.i + 1), x + 16, y + 21);
    var bd = badges(t); if (bd.length) { c.font = '900 ' + Math.round(15 * s) + 'px ' + F; var bt = bd[0][0], bw = c.measureText(bt).width + 18, bx = x + w - bw - 10; rr(bx, c, y + 8, bw, 26, 13); c.fillStyle = '#0d1030'; c.fill(); c.fillStyle = bd[0][1]; c.fillText(bt, bx + 9, y + 22); }
    var narrow = w < 300, rowH = (h - 40 - 40) / 2, cs = Math.round(Math.min(narrow ? 44 : 58, rowH - 14)), boxW = Math.round((narrow ? 46 : 58) * s), pk = d.picks && d.picks[key.r + ':' + key.i];
    [[t.a, t.ga], [t.b, t.gb]].forEach(function (p, k) { var ry = y + 40 + k * rowH, tid = p[0], tm = tid != null ? d.team(tid) : null, win = done && t.win === tid, lose = done && !win;
      c.save(); if (lose) c.globalAlpha = .42;
      if (win) { var wg = c.createLinearGradient(x, 0, x + w, 0); wg.addColorStop(0, (tm.color || '#ffd23f') + '55'); wg.addColorStop(1, 'rgba(255,210,63,0)'); c.fillStyle = wg; c.fillRect(x + 4, ry + 4, w - 8, rowH - 8); }
      if (tm) crest(c, tm, x + 14, ry + (rowH - cs) / 2, cs);
      else { c.beginPath(); c.arc(x + 14 + cs / 2, ry + rowH / 2, cs / 2, 0, 7); c.setLineDash([6, 6]); c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 3; c.stroke(); c.setLineDash([]); c.fillStyle = 'rgba(255,255,255,.5)'; c.font = '900 ' + Math.round(cs * .5) + 'px ' + F; c.textAlign = 'center'; c.fillText('?', x + 14 + cs / 2, ry + rowH / 2 + 2); c.textAlign = 'left'; }
      var nx = x + (narrow ? 18 : 24) + cs, nw = w - (nx - x) - boxW - 18;
      c.font = '900 ' + Math.round((isFinal ? 34 : narrow ? 23 : 26) * s) + 'px ' + F; try { c.fontStretch = narrow ? 'extra-condensed' : 'semi-condensed'; } catch (e) {} c.fillStyle = tm ? '#fff' : 'rgba(255,255,255,.55)'; var nm = fit(c, tm ? tm.name.toUpperCase() : 'POR DEFINIR', nw); c.fillText(nm, nx, ry + rowH / 2 + 1);
      if (lose) { var mw = c.measureText(nm).width; c.fillRect(nx, ry + rowH / 2, mw, 3); }
      try { c.fontStretch = 'normal'; } catch (e) {}
      if (pk === tid && tid != null) { var px = x + 14 + cs - 8, py = ry + (rowH + cs) / 2 - 8; c.beginPath(); c.arc(px, py, 13, 0, 7); c.fillStyle = done ? (win ? '#2ee59d' : '#ff4d6d') : '#ffd23f'; c.fill(); c.lineWidth = 3; c.strokeStyle = '#12163a'; c.stroke(); c.font = '900 15px ' + F; c.textAlign = 'center'; c.fillStyle = '#12163a'; c.fillText(done ? (win ? '✓' : '✗') : '★', px, py + 1); c.textAlign = 'left'; }
      // global
      var gx = x + w - boxW - 12, gy = ry + (rowH - 46 * s) / 2; rr(gx, c, gy, boxW, 46 * s, 12);
      if (win) { var gg = c.createLinearGradient(gx, gy, gx + boxW, gy + 46); gg.addColorStop(0, '#ffd23f'); gg.addColorStop(1, '#ff8a3d'); c.fillStyle = gg; } else c.fillStyle = 'rgba(255,255,255,.1)'; c.fill();
      c.fillStyle = win ? '#1a0f00' : '#fff'; c.font = '900 ' + Math.round(30 * s) + 'px ' + F; c.textAlign = 'center'; c.fillText(fin(t.ida) && tid != null ? String(p[1]) : '–', gx + boxW / 2, gy + 23 * s + 1); c.textAlign = 'left';
      c.restore(); });
    // pie: ida · vuelta · desempate
    var fy = y + h - 22; c.font = '700 ' + Math.round(17 * s) + 'px ' + M; c.fillStyle = '#b9c0ea';
    var ft = t.a == null ? 'ESPERANDO GANADORES' : !t.ida || !fin(t.ida) ? 'IDA Y VUELTA · POR JUGAR' : 'IDA ' + t.ida.hs + '-' + t.ida.as + (fin(t.vta) ? ' · VTA ' + t.vta.hs + '-' + t.vta.as : ' · VTA POR JUGAR') + (t.des ? (fin(t.des) ? ' · DES ' + t.des.hs + '-' + t.des.as : ' · ⚖') : '');
    c.fillText(fit(c, ft, w - 28), x + 16, fy); }
  function draw(cv, d) {
    if (cv.width !== W) { cv.width = W; cv.height = H; }
    var c = cv.getContext('2d'), R = d.rounds || [], zones = [], pos = [];
    bg(c, d); header(c, d);
    var top = 286, bottom = 1090, n = R.length, gapY = 40, fh = n ? Math.min(250, (bottom - top - gapY * (n - 1)) / n * 1.15) : 0, nh = n > 1 ? (bottom - top - fh - gapY * (n - 1)) / (n - 1) : 0;
    nh = Math.min(nh, 224);
    var first = R[0] ? R[0].ties.length : 1, slot = (W - 40) / first, nw = Math.min(250, slot - 12), yy = top;
    R.forEach(function (r, ri) { var last = ri === n - 1, h = last ? fh : nh, w = last ? Math.min(560, W - 120) : Math.min(r.ties.length === 1 ? 560 : nw * 1.08, (W - 60) / r.ties.length - 18);
      if (ri > 0 && !last) w = Math.min((W - 60) / r.ties.length - 30, nw * 1.15);
      pos[ri] = r.ties.map(function (t, i) { var cx = ri === 0 ? 20 + slot * (i + .5) : (pos[ri - 1][2 * i].cx + pos[ri - 1][2 * i + 1].cx) / 2; return { x: cx - w / 2, y: yy, w: w, h: h, cx: cx }; });
      // etiqueta de la ronda
      yy += h + gapY; });
    // conectores (debajo de las llaves): del ganador hacia la llave siguiente, con el color del equipo
    R.forEach(function (r, ri) { if (ri === 0) return; r.ties.forEach(function (t, i) { [0, 1].forEach(function (k) { var ch = pos[ri - 1][2 * i + k], ct = R[ri - 1].ties[2 * i + k], p = pos[ri][i], my = (ch.y + ch.h + p.y) / 2, tm = ct.win != null ? d.team(ct.win) : null, gr = d.grow && d.grow[(ri - 1) + ':' + (2 * i + k)];
      var pts = [[ch.cx, ch.y + ch.h], [ch.cx, my], [p.cx + (k ? 30 : -30), my], [p.cx + (k ? 30 : -30), p.y]];
      c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach(function (q) { c.lineTo(q[0], q[1]); }); c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 6; c.setLineDash([2, 12]); c.stroke(); c.setLineDash([]);
      if (tm) { var prog = gr == null ? 1 : gr, L = 0, seg = []; for (var j = 1; j < pts.length; j++) { var l = Math.abs(pts[j][0] - pts[j - 1][0]) + Math.abs(pts[j][1] - pts[j - 1][1]); seg.push(l); L += l; } var rem = L * prog;
        c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (j = 1; j < pts.length && rem > 0; j++) { var f = Math.min(1, rem / seg[j - 1]); c.lineTo(pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * f, pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * f); rem -= seg[j - 1]; }
        var champ = d.champ != null && ct.win === d.champ; c.shadowColor = champ ? '#ffd23f' : tm.color || '#fff'; c.shadowBlur = 18; c.strokeStyle = champ ? '#ffd23f' : tm.color || '#fff'; c.lineWidth = 8; c.stroke(); }
      c.restore(); }); }); });
    R.forEach(function (r, ri) { var last = ri === n - 1; r.ties.forEach(function (t, i) { var p = pos[ri][i]; node(c, d, t, p.x, p.y, p.w, p.h, r.round, { r: ri, i: i }, last && r.round === 'Final'); zones.push({ x: p.x, y: p.y, w: p.w, h: p.h, r: ri, i: i }); });
      var col = rc(r.round), p0 = pos[ri][0]; if (!last) { c.font = '900 20px ' + F; c.textAlign = 'left'; c.textBaseline = 'middle'; var lt = col[2], lw = c.measureText(lt).width + 28, lx = 30, ly = p0.y - 34; if (ri > 0) { lx = 30; } rr(lx, c, ly, lw, 30, 15); var lg = c.createLinearGradient(lx, 0, lx + lw, 0); lg.addColorStop(0, col[0]); lg.addColorStop(1, col[1]); c.fillStyle = lg; c.fill(); c.fillStyle = '#140a00'; c.fillText(lt, lx + 14, ly + 16); } });
    // zona del campeón
    var cy = 1112, ch = 182; c.save(); rr(40, c, cy, W - 80, ch, 34);
    if (d.champ != null) { var tm = d.team(d.champ), gg = c.createLinearGradient(40, cy, W - 40, cy + ch); gg.addColorStop(0, '#ffd23f'); gg.addColorStop(.5, '#ff8a3d'); gg.addColorStop(1, '#ff4fa3'); c.fillStyle = gg; c.shadowColor = 'rgba(255,190,60,.7)'; c.shadowBlur = 40; c.fill(); c.restore();
      c.save(); rr(40, c, cy, W - 80, ch, 34); c.clip(); c.globalAlpha = .18; c.translate(W / 2, cy + ch / 2); c.rotate((d.t || 0) / 4000); for (var k = 0; k < 24; k++) { c.rotate(Math.PI / 12); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(0, 0); c.lineTo(700, -40); c.lineTo(700, 40); c.closePath(); if (k % 2) c.fill(); } c.restore();
      crest(c, tm, 76, cy + 26, 130); c.textBaseline = 'alphabetic'; c.textAlign = 'left'; c.fillStyle = '#2a1200'; c.font = '900 26px ' + M; c.fillText('🏆 CAMPEÓN', 236, cy + 70); c.font = '900 72px ' + F; c.fillStyle = '#1a0a00'; c.fillText(fit(c, tm.name.toUpperCase(), W - 340), 232, cy + 142); }
    else { c.fillStyle = 'rgba(255,255,255,.06)'; c.fill(); c.setLineDash([14, 12]); c.strokeStyle = 'rgba(255,210,63,.6)'; c.lineWidth = 4; c.stroke(); c.restore(); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#ffd23f'; c.font = '900 24px ' + M; c.fillText('🏆 EL CAMPEÓN SALE DE AQUÍ', W / 2, cy + 58); c.fillStyle = '#fff'; c.font = '900 52px ' + F; c.fillText('¿QUIÉN SE LLEVA LA OMEGA?', W / 2, cy + 116); }
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '700 20px ' + M; c.fillStyle = 'rgba(255,255,255,.55)'; c.fillText((d.brand || 'MAGNA ARENA').toUpperCase() + ' · ' + (d.foot || 'Llaves a ida y vuelta · si el global empata, desempate'), W / 2, H - 26);
    return zones; }
  return { draw: draw, W: W, H: H, badges: badges };
})();
