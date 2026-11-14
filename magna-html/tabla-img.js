'use strict';
// Imagen descargable de una tabla de posiciones (estilo Champions: zonas de color, rótulo vertical).
// Uso: MAGNA_TIMG.button(function () { return { title, kicker, rows: [{ pos, name, crest, color, pj, g, p, dg, pts, zone: 'd'|'p'|'e'|'n' }], labels: { d, p, e } }; })
window.MAGNA_TIMG = (function () {
  var Z = {
    d: { box: '#3b5bff', boxT: '#ffffff', row: '#13206e', row2: '#18287f', txt: '#ffffff', rail: '#ffffff' },
    p: { box: '#4fd8f5', boxT: '#06233a', row: '#dff6fd', row2: '#c9eefb', txt: '#0a1450', rail: '#4fd8f5' },
    e: { box: '#f4f2ea', boxT: '#0a1450', row: '#ffffff', row2: '#eceef6', txt: '#0a1450', rail: '#c9cdf0' },
    n: { box: '#2b3a9a', boxT: '#ffffff', row: '#13206e', row2: '#18287f', txt: '#ffffff', rail: '#ffffff' }
  };
  function img(src) { return new Promise(function (res) { if (!src) return res(null); var i = new Image(); if (!/^data:/.test(src)) i.crossOrigin = 'anonymous'; i.onload = function () { res(i); }; i.onerror = function () { res(null); }; i.src = src; setTimeout(function () { res(null); }, 4000); }); }
  function rr(x, c, y, w, h, r) { x.beginPath(); x.moveTo(c + r, y); x.arcTo(c + w, y, c + w, y + h, r); x.arcTo(c + w, y + h, c, y + h, r); x.arcTo(c, y + h, c, y, r); x.arcTo(c, y, c + w, y, r); x.closePath(); }
  function fit(x, t, max) { var s = String(t); if (x.measureText(s).width <= max) return s; while (s.length > 1 && x.measureText(s + '…').width > max) s = s.slice(0, -1); return s + '…'; }

  function draw(o, withImgs) {
    var rows = o.rows, n = rows.length, rowH = n <= 6 ? 88 : n <= 10 ? 74 : n <= 16 ? 60 : n <= 24 ? 48 : 38, gap = n <= 16 ? 6 : 4;
    var W = 1080, top = 250, H = Math.max(1080, top + 50 + n * (rowH + gap) + 160);
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H; var x = cv.getContext('2d');
    // fondo azul con ondas de neón
    var bg = x.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#0a1450'); bg.addColorStop(.55, '#0b0f3d'); bg.addColorStop(1, '#1d0f5c'); x.fillStyle = bg; x.fillRect(0, 0, W, H);
    var cols = ['#ff4fa3', '#22d3ee', '#ff6a00', '#c6ff1a', '#8b5cf6'];
    for (var k = 0; k < 14; k++) { x.beginPath(); x.lineWidth = 3; x.strokeStyle = cols[k % cols.length]; x.globalAlpha = .55 - k * .03;
      x.moveTo(-60, H * .62 + k * 16); x.bezierCurveTo(W * .2, H * .45 + k * 22, W * .1, H * .95 - k * 10, W * .55, H + 40); x.stroke();
      x.beginPath(); x.moveTo(W * .45 + k * 18, -40); x.bezierCurveTo(W * .8, 90 + k * 9, W * .7, 10 + k * 14, W + 60, 140 + k * 12); x.stroke(); }
    x.globalAlpha = 1;
    // cabecera
    if (withImgs && o._logo) x.drawImage(o._logo, 48, 40, 96, 96 * o._logo.height / o._logo.width);
    x.fillStyle = '#c6ff1a'; x.font = '700 22px "JetBrains Mono", monospace'; x.textAlign = 'right'; x.fillText(String(o.kicker || '').toUpperCase(), W - 48, 70);
    x.fillStyle = '#ffffff'; x.font = 'italic 900 64px Archivo, sans-serif'; x.fillText(fit(x, String(o.title || '').toUpperCase(), W - 220), W - 48, 140);
    x.fillStyle = '#9fb0ff'; x.font = '600 20px Archivo, sans-serif'; x.fillText(o.sub || '', W - 48, 178);
    // título vertical
    x.save(); var avail = H - top - 60, fs = 150; x.font = 'italic 900 ' + fs + 'px Archivo, sans-serif'; var tw = x.measureText('CLASIFICACIÓN').width; if (tw > avail) { fs = Math.floor(fs * avail / tw); x.font = 'italic 900 ' + fs + 'px Archivo, sans-serif'; }
    x.translate(48 + fs * .78, top + 10); x.rotate(-Math.PI / 2); x.textAlign = 'right'; x.lineWidth = 10; x.strokeStyle = '#0d0d10'; x.strokeText('CLASIFICACIÓN', 0, 0); x.fillStyle = '#ffffff'; x.fillText('CLASIFICACIÓN', 0, 0); x.restore();
    // tabla
    var L = 200, R = 990, y = top + 20, cPos = L, cCr = L + 66, cNm = L + 66 + rowH * .68 + 18, cPJ = R - 250, cDG = R - 160, cPts = R - 64;
    x.font = '700 18px "JetBrains Mono", monospace'; x.fillStyle = '#b9c4ff'; x.textAlign = 'center';
    x.fillText('POS', cPos + 28, y); x.textAlign = 'left'; x.fillText('EQUIPO', cNm, y); x.textAlign = 'center'; x.fillText('PJ', cPJ, y); x.fillText('DG', cDG, y); x.fillText('PTS', cPts + 32, y);
    y += 16; var y0 = y, zoneStart = {}, zoneEnd = {}, prevZ = null;
    rows.forEach(function (r, i) {
      var z = Z[r.zone] || Z.n, ry = y + i * (rowH + gap);
      if (prevZ && prevZ !== r.zone) { x.fillStyle = r.zone === 'e' ? '#ff4fa3' : '#4fd8f5'; x.fillRect(L, ry - gap / 2 - 2, R - L, 4); }
      if (zoneStart[r.zone] == null) zoneStart[r.zone] = ry; zoneEnd[r.zone] = ry + rowH; prevZ = r.zone;
      x.fillStyle = i % 2 ? z.row2 : z.row; x.fillRect(L + 60, ry, R - L - 60, rowH);
      x.fillStyle = z.box; rr(x, L, ry, 56, rowH, 4); x.fill(); x.fillStyle = z.boxT; x.font = 'italic 900 ' + Math.round(rowH * .5) + 'px Archivo, sans-serif'; x.textAlign = 'center'; x.fillText(String(r.pos), L + 28, ry + rowH * .68);
      // escudo
      var cr = rowH * .34, cx = cCr + cr, cy = ry + rowH / 2; x.save(); x.beginPath(); x.arc(cx, cy, cr, 0, Math.PI * 2); x.closePath(); x.fillStyle = r.color || '#8b5cf6'; x.fill();
      if (withImgs && r._img) { x.clip(); x.drawImage(r._img, cx - cr, cy - cr, cr * 2, cr * 2); } else { x.fillStyle = '#fff'; x.font = '900 ' + Math.round(cr * .8) + 'px Archivo, sans-serif'; x.fillText(String(r.name).slice(0, 2).toUpperCase(), cx, cy + cr * .3); }
      x.restore(); x.beginPath(); x.arc(cx, cy, cr, 0, Math.PI * 2); x.lineWidth = 3; x.strokeStyle = 'rgba(255,255,255,.9)'; x.stroke();
      x.fillStyle = z.txt; x.textAlign = 'left'; x.font = '900 ' + Math.round(rowH * .42) + 'px Archivo, sans-serif'; x.fillText(fit(x, String(r.name).toUpperCase(), cPJ - cNm - 40), cNm, ry + rowH * .64);
      x.textAlign = 'center'; x.font = '800 ' + Math.round(rowH * .38) + 'px Archivo, sans-serif'; x.fillText(String(r.pj), cPJ, ry + rowH * .64); x.fillText((r.dg > 0 ? '+' : '') + r.dg, cDG, ry + rowH * .64);
      x.fillStyle = z.box; rr(x, cPts, ry + 3, 64, rowH - 6, 4); x.fill(); x.fillStyle = z.boxT; x.font = 'italic 900 ' + Math.round(rowH * .5) + 'px Archivo, sans-serif'; x.fillText(String(r.pts), cPts + 32, ry + rowH * .68);
    });
    // rótulos verticales de zona
    var lb = o.labels || {}; ['d', 'p', 'e'].forEach(function (k) { if (zoneStart[k] == null || !lb[k]) return; var a = zoneStart[k], b = zoneEnd[k], mid = (a + b) / 2;
      x.fillStyle = 'rgba(255,255,255,.25)'; x.fillRect(R + 18, a, 2, b - a); x.save(); x.translate(R + 52, mid); x.rotate(-Math.PI / 2); x.textAlign = 'center'; x.fillStyle = Z[k].rail;
      var t = String(lb[k]).toUpperCase(), sz = 20; x.font = 'italic 900 ' + sz + 'px Archivo, sans-serif'; while (x.measureText(t).width > (b - a - 10) && sz > 9) { sz--; x.font = 'italic 900 ' + sz + 'px Archivo, sans-serif'; } x.fillText(t, 0, 7); x.restore(); });
    // pie
    var fy = y0 + n * (rowH + gap) + 70; x.textAlign = 'left'; x.fillStyle = '#c6ff1a'; x.font = 'italic 900 34px Archivo, sans-serif'; x.fillText('MAGNA ARENA', L, fy);
    x.fillStyle = '#9fb0ff'; x.font = '600 20px Archivo, sans-serif'; x.fillText(new Date().toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' }) + ' · Comunidad Magna Sports', L, fy + 32);
    return cv;
  }

  // ---- versión «TNT» (tabla blanca con columna de puntos rosa) para las ligas ----
  var TZ = { d: '#2ee59d', p: '#4fd8f5', e: '#e8eeff', n: '#e8eeff' };
  function drawTnt(o, withImgs) {
    var rows = o.rows, n = rows.length, rowH = n <= 4 ? 104 : n <= 8 ? 80 : n <= 14 ? 62 : n <= 20 ? 50 : 40, W = 1080, top = 230, H = Math.max(1080, top + 70 + n * rowH + 170);
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H; var x = cv.getContext('2d');
    var bg = x.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#2340e8'); bg.addColorStop(.5, '#1426b8'); bg.addColorStop(1, '#0a157a'); x.fillStyle = bg; x.fillRect(0, 0, W, H);
    x.globalAlpha = .18; for (var k = 0; k < 18; k++) { x.beginPath(); x.lineWidth = 2; x.strokeStyle = k % 2 ? '#4fd8f5' : '#ff4fa3'; x.moveTo(-50, H - 260 + k * 14); x.bezierCurveTo(W * .3, H - 420 + k * 10, W * .6, H - 80 + k * 6, W + 50, H - 300 + k * 12); x.stroke(); } x.globalAlpha = 1;
    if (withImgs && o._logo) x.drawImage(o._logo, 50, 42, 86, 86 * o._logo.height / o._logo.width);
    x.textAlign = 'center'; x.fillStyle = '#ffffff'; var t1 = 'TABLA · ' + String(o.title || '').toUpperCase(), fz = 72; x.font = '900 ' + fz + 'px Archivo, sans-serif'; while (x.measureText(t1).width > W - 320 && fz > 34) { fz -= 2; x.font = '900 ' + fz + 'px Archivo, sans-serif'; } x.fillText(t1, W / 2 + 40, 112);
    x.fillStyle = '#4fd8f5'; x.font = '700 24px "JetBrains Mono", monospace'; x.fillText(String(o.kicker || '').toUpperCase().split('').join(' '), W / 2 + 40, 156);
    var L = 60, R = W - 110, cols = [['POS', 110], ['EQUIPO', 0], ['PTS', 96], ['PJ', 74], ['V', 74], ['D', 74], ['DG', 88]], fixed = cols.reduce(function (a, c) { return a + c[1]; }, 0), eqW = R - L - fixed; cols[1][1] = eqW;
    var y = top, hx = L; cols.forEach(function (c) { x.fillStyle = c[0] === 'PTS' ? '#ff4fa3' : '#2f5bff'; x.fillRect(hx, y, c[1] - 2, 58); x.fillStyle = '#fff'; x.font = '900 28px Archivo, sans-serif'; x.textAlign = 'center'; x.fillText(c[0], hx + c[1] / 2, y + 40); hx += c[1]; });
    y += 62;
    rows.forEach(function (r, i) { var ry = y + i * rowH, cx = L, vals = [r.pos, null, r.pts, r.pj, r.g, r.p, (r.dg > 0 ? '+' : '') + r.dg];
      x.fillStyle = '#ffffff'; x.fillRect(L, ry, R - L, rowH - 3); x.fillStyle = '#c7d2ff'; x.fillRect(L, ry + rowH - 3, R - L, 3);
      cols.forEach(function (c, k) { var w = c[1];
        if (k === 0) { x.fillStyle = TZ[r.zone] || TZ.n; x.fillRect(cx, ry, w - 2, rowH - 3); }
        if (c[0] === 'PTS') { x.fillStyle = '#ff6fb5'; x.fillRect(cx, ry, w - 2, rowH - 3); }
        if (k === 1) { var bs = rowH - 16, bx = cx + 12, by = ry + 6; x.fillStyle = '#fff'; x.strokeStyle = '#c7d2ff'; x.lineWidth = 2; x.fillRect(bx, by, bs, bs); x.strokeRect(bx, by, bs, bs);
          if (withImgs && r._img) x.drawImage(r._img, bx + 3, by + 3, bs - 6, bs - 6); else { x.fillStyle = r.color || '#2f5bff'; x.beginPath(); x.arc(bx + bs / 2, by + bs / 2, bs * .38, 0, Math.PI * 2); x.fill(); x.fillStyle = '#fff'; x.font = '900 ' + Math.round(bs * .32) + 'px Archivo, sans-serif'; x.textAlign = 'center'; x.fillText(String(r.name).slice(0, 2).toUpperCase(), bx + bs / 2, by + bs * .62); }
          x.fillStyle = '#0a1450'; x.textAlign = 'left'; x.font = '800 ' + Math.round(rowH * .38) + 'px Archivo, sans-serif'; x.fillText(fit(x, String(r.name).toUpperCase(), w - bs - 40), bx + bs + 16, ry + rowH * .62); }
        else { x.textAlign = 'center'; x.fillStyle = c[0] === 'PTS' ? '#ffffff' : '#0a1450'; x.font = (k === 0 || c[0] === 'PTS' ? '900 ' : '700 ') + Math.round(rowH * .46) + 'px Archivo, sans-serif'; x.fillText(String(vals[k]), cx + w / 2, ry + rowH * .66); }
        cx += w; }); });
    // leyenda vertical a la derecha
    var lg = o.legend || {}, ly = y + n * rowH - 10; ['p', 'd'].forEach(function (k) { if (!lg[k] || !rows.some(function (r) { return r.zone === k; })) return; x.save(); x.translate(R + 52, ly); x.rotate(-Math.PI / 2); x.fillStyle = TZ[k]; x.fillRect(0, -16, 26, 26); x.fillStyle = '#fff'; x.font = '900 24px Archivo, sans-serif'; x.textAlign = 'left'; var tt = String(lg[k]).toUpperCase(); x.fillText(tt, 40, 6); x.restore(); ly -= x.measureText(tt).width + 90; });
    var fy = y + n * rowH + 90; x.textAlign = 'center'; x.fillStyle = '#ffffff'; x.font = 'italic 900 44px Archivo, sans-serif'; x.fillText('MAGNA ARENA', W / 2, fy);
    x.fillStyle = '#c7d2ff'; x.font = '600 20px Archivo, sans-serif'; x.fillText(new Date().toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' }) + ' · Comunidad Magna Sports', W / 2, fy + 34);
    return cv;
  }
  function make(o) {
    var jobs = [img('logo.png').then(function (i) { o._logo = i; })];
    o.rows.forEach(function (r) { jobs.push(img(r.crest).then(function (i) { r._img = i; })); });
    return Promise.all(jobs).then(function () { return document.fonts && document.fonts.ready ? document.fonts.ready : null; }).then(function () {
      var D = o.style === 'tnt' ? drawTnt : draw, cv = D(o, true); try { cv.toDataURL(); return cv; } catch (e) { return D(o, false); } });
  }
  function save(cv, name) { return new Promise(function (res) { cv.toBlob(function (b) {
    var f = null; try { f = new File([b], name, { type: 'image/png' }); } catch (e) {}
    if (f && navigator.canShare && navigator.canShare({ files: [f] }) && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) { navigator.share({ files: [f], title: name }).then(res, res); return; }
    var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500); res(); }, 'image/png'); }); }
  function slug(s) { return String(s || 'tabla').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'tabla'; }
  function button(get, label) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'timg-b'; b.textContent = label || '⬇ Descargar imagen';
    if (!document.getElementById('timg-css')) { var st = document.createElement('style'); st.id = 'timg-css'; st.textContent = '.timg-b{display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border-radius:8px;border:2.5px solid #0d0d10;background:#c6ff1a;color:#0d0d10;font:900 13px Archivo,sans-serif;cursor:pointer;box-shadow:3px 3px 0 #0d0d10;transition:transform .12s,box-shadow .12s}.timg-b:hover{transform:translate(-1px,-2px);box-shadow:4px 5px 0 #0d0d10}.timg-b:active{transform:translate(2px,2px);box-shadow:1px 1px 0 #0d0d10}.timg-b[disabled]{opacity:.6;cursor:wait}'; document.head.appendChild(st); }
    b.onclick = function () { var o = get(); if (!o || !o.rows || !o.rows.length) return; var t = b.textContent; b.disabled = true; b.textContent = 'Creando imagen…';
      make(o).then(function (cv) { return save(cv, slug(o.kicker + ' ' + o.title) + '.png'); }).catch(function () {}).then(function () { b.disabled = false; b.textContent = t; }); };
    return b;
  }
  return { make: make, button: button };
})();

// ---- tabla en pantalla estilo Champions (la usan champions.html y ligas.html) ----
function ustStyle(W){if(document.getElementById('ust-css'))return;var st=document.createElement('style');st.id='ust-css';st.textContent='.ust-w{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,'+(W||'760')+'px),1fr));gap:26px;margin-top:6px}'+
   '.ust{position:relative;border:3px solid #0d0d10;border-radius:14px;overflow:hidden;box-shadow:8px 8px 0 #3b5bff;background:linear-gradient(160deg,#0b1450,#0a0f3a 60%,#141a6e);color:#fff}'+
   '.ust:before{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(115deg,transparent 0 22px,rgba(255,255,255,.025) 22px 24px)}'+
   '.ust-h{position:relative;display:flex;align-items:center;flex-wrap:wrap;gap:10px 12px;padding:14px 16px 10px}.ust-h h3{margin:0;font:italic 900 clamp(22px,3.4vw,30px)/1 Archivo,sans-serif;font-stretch:120%;text-transform:uppercase;letter-spacing:.01em;color:#fff;text-shadow:3px 3px 0 #3b5bff}.ust-h span{margin-left:auto;font:700 10px "JetBrains Mono",monospace;letter-spacing:.12em;text-transform:uppercase;color:#9fb0ff}'+
   '.ust-g{position:relative;display:grid;grid-template-columns:minmax(0,1fr) 34px}'+
   '.ust-t{width:100%;border-collapse:separate;border-spacing:0 2px;font:800 14px Archivo,sans-serif;padding:0 0 8px 8px}'+
   '.ust-t th{font:700 10px "JetBrains Mono",monospace;letter-spacing:.1em;color:#b9c4ff;text-align:center;padding:2px 4px 6px}.ust-t th.c{text-align:left}'+
   '.ust-t td{padding:0 4px;height:34px;text-align:center;background:var(--rb);color:var(--rc)}.ust-t tr:nth-child(even) td{background:var(--rb2)}'+
   '.ust-t td.c{text-align:left;padding-left:8px}.ust-t td.pos{width:34px;padding:0}.ust-t td.pos b,.ust-t td.pts b{display:grid;place-items:center;height:30px;margin:2px 0;font:italic 900 16px Archivo,sans-serif;background:var(--zc);color:var(--zt);border-radius:3px}.ust-t td.pts{width:44px;padding:0 4px}'+
   '.ust-t tr.d{--zc:#3b5bff;--zt:#fff;--rb:#13206e;--rb2:#18287f;--rc:#fff}.ust-t tr.p{--zc:#4fd8f5;--zt:#06233a;--rb:#dff6fd;--rb2:#c9eefb;--rc:#0a1450}.ust-t tr.e{--zc:#f4f2ea;--zt:#0a1450;--rb:#ffffff;--rb2:#eceef6;--rc:#0a1450}.ust-t tr.n{--zc:#2b3a9a;--zt:#fff;--rb:#13206e;--rb2:#18287f;--rc:#fff}'+
   '.ust-t tr.cut td{border-top:2px solid #ff4fa3}.ust-t tr.cut2 td{border-top:2px solid #4fd8f5}'+
   '.ust-n{display:flex;align-items:center;gap:10px;min-width:0}.ust-n i{flex:none;width:24px;height:24px;border-radius:50%;background:center/cover #8b5cf6;display:grid;place-items:center;font:900 9px Archivo,sans-serif;font-style:normal;color:#fff;border:2px solid rgba(255,255,255,.85)}.ust-n a{color:inherit;text-decoration:none;font:900 15px Archivo,sans-serif;font-stretch:110%;text-transform:uppercase;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ust-n a:hover{text-decoration:underline}'+
   '.ust-t tr.ulv .ust-n a:after{content:" ●";color:#ff3b47}'+
   '.ust-r{position:relative}.ust-r>p{position:absolute;inset:28px 0 10px;margin:0;display:flex;flex-direction:column;overflow:hidden}.ust-r div{min-height:0;overflow:hidden}.ust-r div{display:grid;place-items:center;border-top:2px solid rgba(255,255,255,.18)}.ust-r div:first-child{border-top:0}.ust-r span{writing-mode:vertical-rl;transform:rotate(180deg);font:italic 900 11px Archivo,sans-serif;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;color:#fff}.ust-r .p span{color:#4fd8f5}.ust-r .e span{color:#c9cdf0}'+
   '.ust-j{position:relative;margin:0 10px 12px;background:rgba(255,255,255,.06);border-radius:10px;padding:2px 10px}.ust-j summary{cursor:pointer;font:800 13px Archivo,sans-serif;padding:8px 0;color:#dfe5ff}.ust-j b{display:block;margin:8px 0 4px;font:800 11px "JetBrains Mono",monospace;letter-spacing:.08em;text-transform:uppercase;color:#9fb0ff}'+
   '.ust-m{display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:center;padding:6px 10px;margin-bottom:4px;background:#13206e;border-radius:6px;font:700 13px Archivo,sans-serif}.ust-m span:last-child{text-align:right}.ust-m em{font-style:normal;font:italic 900 15px Archivo,sans-serif;white-space:nowrap}.ust-m em small{font:700 10px "JetBrains Mono",monospace;color:#9fb0ff}.ust-e{padding:8px 0 10px;color:#9fb0ff;font-size:13px}'+
   '@media(max-width:560px){.ust-t .x{display:none}.ust-n a{font-size:13px}.ust-t td{height:30px}.ust-t td.pos b,.ust-t td.pts b{height:26px;font-size:14px}.ust-g{grid-template-columns:minmax(0,1fr) 26px}.ust-r span{font-size:9px}}';document.head.appendChild(st)}
function ustCard(title,sub,rows,Z,liveIds,gm,kicker){
 var n=rows.length,d=Math.min(Z.d||0,n),pz=Math.min(Z.p||0,n-d),zoneOf=function(pos){return!(Z.d||Z.p)?'n':pos<=d?'d':pos<=d+pz?'p':'e'};
 var card=document.createElement('section');card.className='ust';var hd=document.createElement('div');hd.className='ust-h';var h3=document.createElement('h3');h3.textContent=title;hd.appendChild(h3);var sm=document.createElement('span');sm.textContent=sub;hd.appendChild(sm);card.appendChild(hd);
 if(window.MAGNA_TIMG){var lab={d:Z.dl||'Pasan directo',p:Z.pl||'Play-off',e:Z.el!=null?Z.el:'Eliminados'};hd.appendChild(MAGNA_TIMG.button(function(){return{title:title,kicker:kicker||(window.MAGNA_CH_CFG&&MAGNA_CH_CFG.name)||'Champions',sub:sub,labels:lab,rows:rows.map(function(r){return{pos:r.pos,name:r.team,crest:MAGNA.crestUrl(r.team_id),color:MAGNA.teamColor?MAGNA.teamColor(r.team_id):null,pj:r.pj,dg:r.dg,pts:r.pts,zone:zoneOf(r.pos)}})}},'⬇ Imagen'))}
 var gw=document.createElement('div');gw.className='ust-g';var tb=document.createElement('table');tb.className='ust-t';tb.innerHTML='<thead><tr><th>Pos</th><th class="c">Equipo</th><th>PJ</th><th class="x">G</th><th class="x">P</th><th>DG</th><th>Pts</th></tr></thead>';var bd=document.createElement('tbody');
 rows.forEach(function(r,k){var z=zoneOf(r.pos),tr=document.createElement('tr');tr.className=z+(k&&zoneOf(rows[k-1].pos)!==z?(z==='e'?' cut':' cut2'):'');if(liveIds[r.team_id])tr.className+=' ulv';
  tr.innerHTML='<td class="pos"><b>'+r.pos+'</b></td><td class="c"><div class="ust-n"><i></i><a></a></div></td><td>'+r.pj+'</td><td class="x">'+r.g+'</td><td class="x">'+r.p+'</td><td>'+(r.dg>0?'+':'')+r.dg+'</td><td class="pts"><b>'+r.pts+'</b></td>';
  var ic=tr.querySelector('i'),u=MAGNA.crestUrl(r.team_id);if(u)ic.style.backgroundImage='url('+u+')';else{ic.textContent=String(r.team).slice(0,2).toUpperCase();if(MAGNA.teamColor)ic.style.background=MAGNA.teamColor(r.team_id)}var a=tr.querySelector('a');a.textContent=r.team;a.href='equipo.html?id='+r.team_id;bd.appendChild(tr)});
 tb.appendChild(bd);gw.appendChild(tb);
 var rail=document.createElement('div');rail.className='ust-r';var rin=document.createElement('p');rail.appendChild(rin);
 if(Z.d||Z.p){[['d',d,Z.dl||'Pasan directo'],['p',pz,Z.pl||'Play-off'],['e',n-d-pz,Z.el!=null?Z.el:'Eliminados']].forEach(function(x){if(!x[1]||!x[2])return;var dv=document.createElement('div');dv.className=x[0];dv.style.flex=String(x[1]);var sp=document.createElement('span');sp.textContent=x[1]>=4||String(x[2]).length<=10?x[2]:(x[1]<2?{d:'Dir.',p:'P-O',e:'Fuera'}:{d:'Directo',p:'Play-off',e:'Fuera'})[x[0]];if(x[1]<2)sp.style.fontSize='8px';dv.appendChild(sp);rin.appendChild(dv)})}
 gw.appendChild(rail);card.appendChild(gw);
 if(gm){var dj=document.createElement('details');dj.className='ust-j';var su=document.createElement('summary');su.textContent='📅 Jornadas ('+gm.length+' partidos)';dj.appendChild(su);
  if(!gm.length){var e=document.createElement('div');e.className='ust-e';e.textContent='Todavía no hay partidos.';dj.appendChild(e)}
  var lastJ=null;gm.forEach(function(m){var j=(/Jornada (\d+)/.exec(m.round||'')||[])[1]||'?';if(j!==lastJ){var bj=document.createElement('b');bj.textContent='Jornada '+j;dj.appendChild(bj);lastJ=j}
   var r=document.createElement('div');r.className='ust-m';var a=document.createElement('span');a.textContent=MAGNA.teamName(m.home);var c=document.createElement('em');
   if(m.status==='finished'||m.status==='live')c.textContent=m.hs+' - '+m.as+(m.status==='live'?' ●':'');else{var s2=document.createElement('small');s2.textContent=m.at?new Date(m.at.replace(' ','T')+'Z').toLocaleString('es',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'Por jugar';c.appendChild(s2)}
   var b2=document.createElement('span');b2.textContent=MAGNA.teamName(m.away);r.appendChild(a);r.appendChild(c);r.appendChild(b2);dj.appendChild(r)});
  card.appendChild(dj)}
 return card}
function jsort(a,b){var ja=+((/Jornada (\d+)/.exec(a.round||'')||[])[1]||0),jb=+((/Jornada (\d+)/.exec(b.round||'')||[])[1]||0);return ja-jb||String(a.at||'').localeCompare(String(b.at||''))}

// ---- tabla en pantalla estilo «TNT» para las ligas ----
function tntStyle(){if(document.getElementById('tnt-css'))return;var st=document.createElement('style');st.id='tnt-css';st.textContent=
 '.tnt{position:relative;margin-top:16px;border:3px solid #0d0d10;border-radius:14px;overflow:hidden;box-shadow:8px 8px 0 #ff4fa3;background:linear-gradient(160deg,#2340e8,#1426b8 55%,#0a157a);color:#fff;padding:18px 18px 14px}'+
 '.tnt-h{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px}.tnt-h div{flex:1;min-width:0;text-align:center}.tnt-h h3{margin:0;font:900 clamp(24px,4.4vw,44px)/1 Archivo,sans-serif;font-stretch:75%;text-transform:uppercase;letter-spacing:.01em}.tnt-h small{display:block;margin-top:6px;font:700 12px "JetBrains Mono",monospace;letter-spacing:.3em;text-transform:uppercase;color:#4fd8f5}'+
 '.tnt-g{display:grid;grid-template-columns:minmax(0,1fr) 30px;gap:8px}.tnt-t{width:100%;border-collapse:separate;border-spacing:0;font-stretch:80%}'+
 '.tnt-t th{background:#2f5bff;color:#fff;font:900 clamp(13px,1.8vw,18px) Archivo,sans-serif;font-stretch:80%;padding:10px 4px;border-right:2px solid #1426b8;text-transform:uppercase}.tnt-t th.pts{background:#ff4fa3}.tnt-t th:last-child{border-right:0}'+
 '.tnt-t td{background:#fff;color:#0a1450;text-align:center;font:700 clamp(15px,2vw,22px) Archivo,sans-serif;font-stretch:80%;padding:0 4px;height:46px;border-bottom:3px solid #c7d2ff}'+
 '.tnt-t td.pos{font-weight:900;width:58px;background:var(--zc,#e8eeff)}.tnt-t td.pts{background:#ff6fb5;color:#fff;font-weight:900;width:64px}.tnt-t tr.tlv td.c a:after{content:" ●";color:#ff3b47}'+
 '.tnt-t td.c{text-align:left;padding-left:10px}.tnt-n{display:flex;align-items:center;gap:12px;min-width:0}.tnt-n i{flex:none;width:34px;height:34px;border:2px solid #c7d2ff;background:#fff center/80% no-repeat;display:grid;place-items:center;font:900 11px Archivo,sans-serif;font-style:normal;color:#fff}.tnt-n i.e{background:var(--tc,#2f5bff);border-color:#fff}'+
 '.tnt-n a{color:#0a1450;text-decoration:none;font:800 clamp(14px,1.9vw,20px) Archivo,sans-serif;font-stretch:85%;text-transform:uppercase;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tnt-n a:hover{color:#ff4fa3}'+
 '.tnt-l{display:flex;flex-direction:column-reverse;justify-content:flex-start;align-items:center;gap:18px;padding-bottom:6px}.tnt-l span{writing-mode:vertical-rl;transform:rotate(180deg);font:900 13px Archivo,sans-serif;font-stretch:80%;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap;display:flex;align-items:center;gap:8px}.tnt-l span:before{content:"";width:16px;height:16px;background:var(--zc);border:2px solid #fff;transform:rotate(180deg)}'+
 '.tnt-j{margin-top:12px;background:rgba(255,255,255,.1);border-radius:10px;padding:2px 12px}.tnt-j summary{cursor:pointer;font:800 13px Archivo,sans-serif;padding:9px 0}.tnt-j b{display:block;margin:8px 0 4px;font:800 11px "JetBrains Mono",monospace;letter-spacing:.08em;text-transform:uppercase;color:#4fd8f5}.tnt-m{display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:center;padding:6px 10px;margin-bottom:4px;background:#fff;color:#0a1450;border-radius:6px;font:700 13px Archivo,sans-serif}.tnt-m span:last-child{text-align:right}.tnt-m em{font-style:normal;font-weight:900;white-space:nowrap}.tnt-m em small{font:700 10px "JetBrains Mono",monospace;color:#5b6aa8}'+
 '@media(max-width:560px){.tnt-h small{letter-spacing:.12em}.tnt{padding:12px 8px 10px}.tnt-t .x{display:none}.tnt-t td{height:40px}.tnt-n i{width:26px;height:26px}.tnt-n{gap:8px}.tnt-t td.pos{width:36px}.tnt-t td.pts{width:44px}.tnt-g{grid-template-columns:minmax(0,1fr) 22px;gap:4px}.tnt-l span{font-size:10px}}';document.head.appendChild(st)}
function tntCard(o){tntStyle();var ZC={d:'#2ee59d',p:'#4fd8f5'};var w=document.createElement('section');w.className='tnt';var hd=document.createElement('div');hd.className='tnt-h';var tx=document.createElement('div');var h3=document.createElement('h3');h3.textContent='Tabla · '+o.title;var sm=document.createElement('small');sm.textContent=o.kicker||'';tx.appendChild(h3);tx.appendChild(sm);hd.appendChild(tx);
 if(window.MAGNA_TIMG)hd.appendChild(MAGNA_TIMG.button(function(){return{style:'tnt',title:o.title,kicker:o.kicker,legend:o.legend,rows:o.rows.map(function(r){return{pos:r.pos,name:r.team,crest:MAGNA.crestUrl(r.team_id),color:MAGNA.teamColor?MAGNA.teamColor(r.team_id):null,pj:r.pj,g:r.g,p:r.p,dg:r.dg,pts:r.pts,zone:r.zone}})}},'⬇ Imagen'));w.appendChild(hd);
 var g=document.createElement('div');g.className='tnt-g';var t=document.createElement('table');t.className='tnt-t';t.innerHTML='<thead><tr><th>Pos</th><th>Equipo</th><th class="pts">Pts</th><th class="x">PJ</th><th>V</th><th>D</th><th>DG</th></tr></thead>';var bd=document.createElement('tbody');
 o.rows.forEach(function(r){var tr=document.createElement('tr');if(o.live&&o.live[r.team_id])tr.className='tlv';tr.innerHTML='<td class="pos"></td><td class="c"><div class="tnt-n"><i></i><a></a></div></td><td class="pts"></td><td class="x"></td><td></td><td></td><td></td>';var td=tr.children;
  td[0].textContent=r.pos;if(ZC[r.zone])td[0].style.setProperty('--zc',ZC[r.zone]);td[2].textContent=r.pts;td[3].textContent=r.pj;td[4].textContent=r.g;td[5].textContent=r.p;td[6].textContent=(r.dg>0?'+':'')+r.dg;
  var ic=tr.querySelector('i'),u=MAGNA.crestUrl(r.team_id);if(u)ic.style.backgroundImage='url('+u+')';else{ic.className='e';ic.textContent=String(r.team).slice(0,2).toUpperCase();if(MAGNA.teamColor)ic.style.setProperty('--tc',MAGNA.teamColor(r.team_id))}var a=tr.querySelector('a');a.textContent=r.team;a.href='equipo.html?id='+r.team_id;bd.appendChild(tr)});
 t.appendChild(bd);g.appendChild(t);var lg=document.createElement('div');lg.className='tnt-l';['d','p'].forEach(function(k){if(!o.legend||!o.legend[k]||!o.rows.some(function(r){return r.zone===k}))return;var s=document.createElement('span');s.style.setProperty('--zc',ZC[k]);s.textContent=o.legend[k];lg.appendChild(s)});g.appendChild(lg);w.appendChild(g);
 if(o.gm){var dj=document.createElement('details');dj.className='tnt-j';var su=document.createElement('summary');su.textContent='📅 Jornadas ('+o.gm.length+' partidos)';dj.appendChild(su);var lastJ=null;
  o.gm.forEach(function(m){var j=(/Jornada (\d+)/.exec(m.round||'')||[])[1]||'?';if(j!==lastJ){var bj=document.createElement('b');bj.textContent='Jornada '+j;dj.appendChild(bj);lastJ=j}var r=document.createElement('div');r.className='tnt-m';var a=document.createElement('span');a.textContent=MAGNA.teamName(m.home);var c=document.createElement('em');
   if(m.status==='finished'||m.status==='live')c.textContent=m.hs+' - '+m.as+(m.status==='live'?' ●':'');else{var s2=document.createElement('small');s2.textContent=m.at?new Date(m.at.replace(' ','T')+'Z').toLocaleString('es',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'Por jugar';c.appendChild(s2)}
   var b2=document.createElement('span');b2.textContent=MAGNA.teamName(m.away);r.appendChild(a);r.appendChild(c);r.appendChild(b2);dj.appendChild(r)});w.appendChild(dj)}
 return w}
