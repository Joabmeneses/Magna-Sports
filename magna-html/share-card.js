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
    return fonts().then(function () { return Promise.all([img('logo-sm.png'), img(d.avatar), img(d.teamCrest)]); }).then(function (I) {
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
    return fonts().then(function () { return Promise.all([img('logo-sm.png'), img(d.crest)]); }).then(function (I) {
      bg(x, col); head(x, I[0], 'TARJETA DE EQUIPO');
      x.save(); x.globalAlpha = .07; x.fillStyle = '#fff'; x.textAlign = 'center'; fit(x, d.name.toUpperCase(), W * 1.6, 300); x.fillText(d.name.toUpperCase(), W / 2, 470); x.restore();
      if (I[1]) { x.save(); x.shadowColor = rgba(col, .9); x.shadowBlur = 70; var s = 300 / Math.max(I[1].width, I[1].height); x.drawImage(I[1], W / 2 - I[1].width * s / 2, 390 - I[1].height * s / 2, I[1].width * s, I[1].height * s); x.restore(); }
      else avatar(x, null, d.name, W / 2, 390, 150, col);
      x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.fillStyle = '#fff'; fit(x, d.name.toUpperCase(), W - 160, 110); x.fillText(d.name.toUpperCase(), W / 2, 680);
      var sub = [d.pos ? '#' + d.pos + ' DEL RANKING' : null, d.coach ? 'DT: ' + d.coach : null].filter(Boolean).join('  ·  '); x.fillStyle = 'rgba(241,243,251,.75)'; fit(x, sub, W - 200, 34, 700); x.fillText(sub, W / 2, 734);
      if (d.squad && d.squad.length) { var sq = d.squad.slice(0, 5).join(' · '); x.fillStyle = col; fit(x, sq, W - 200, 30, 800); x.fillText(sq, W / 2, 788); }
      x.textAlign = 'left'; stats(x, [[String(d.pts).replace(/\B(?=(\d{3})+(?!\d))/g, '.'), 'Puntos'], [d.trophyCount, 'Trofeos'], [d.record[0] + '-' + d.record[1], 'V-D'], [d.level, 'Nivel']], 846, col);
      return cabinet(x, d.trophies || [], 1036, col); }).then(function () { foot(x); return c; }); }

  // botón listo para poner en una página: genera la tarjeta, muestra una vista previa y deja compartir o descargar
  function open(kind, getData) {
    var ov = document.createElement('div'); ov.className = 'shc-ov'; ov.innerHTML = '<div class="shc" role="dialog" aria-modal="true" aria-label="Tarjeta para compartir"><div class="shc-hd"><b>Tarjeta para compartir</b><button type="button" class="shc-x" aria-label="Cerrar">✕</button></div><div class="shc-im"><div class="shc-ld">Creando tu tarjeta…</div></div><div class="shc-ac"><button type="button" class="shc-go" disabled>📤 Compartir</button><button type="button" class="shc-dl" disabled>⬇ Descargar</button></div><p class="shc-hint">Perfecta para historias, publicaciones o el grupo de WhatsApp.</p></div>';
    document.body.appendChild(ov); requestAnimationFrame(function () { ov.classList.add('on'); });
    function close() { ov.classList.remove('on'); setTimeout(function () { ov.remove(); }, 220); document.removeEventListener('keydown', esc); }
    function esc(e) { if (e.key === 'Escape') close(); } document.addEventListener('keydown', esc);
    ov.addEventListener('click', function (e) { if (e.target === ov || e.target.closest('.shc-x')) close(); });
    var d = getData(), file = 'magna-' + slug(d.name) + '.png', go = ov.querySelector('.shc-go'), dlb = ov.querySelector('.shc-dl'), box = ov.querySelector('.shc-im');
    (kind === 'team' ? team(d) : player(d)).then(function (c) { var u = c.toDataURL('image/png'), im = new Image(); im.src = u; im.alt = 'Tarjeta de ' + d.name; box.innerHTML = ''; box.appendChild(im);
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
  return { player: player, team: team, open: open };
})();
