'use strict';
// Genera la imagen del resultado (PNG 1080x1080) con la identidad de Magna Arena.
window.MAGNA_CARD = function (m) {
  var W = 1080, H = 1080, c = document.createElement('canvas'); c.width = W; c.height = H; var x = c.getContext('2d');
  var PUR = '#8b5cf6', ORA = '#ff5a36', GOLD = '#ffd23f', FG = '#f1f3fb', MUT = '#9aa0b8', F = 'Archivo, "Arial Narrow", Arial, sans-serif', MONO = '"JetBrains Mono", ui-monospace, monospace';
  function img(src) { return new Promise(function (r) { if (!src) return r(null); var i = new Image(); i.onload = function () { r(i); }; i.onerror = function () { r(null); }; i.src = src; }); }
  function fonts() { if (!document.fonts || !document.fonts.load) return Promise.resolve(); return Promise.all(['900 100px Archivo', '700 40px Archivo', '500 24px "JetBrains Mono"'].map(function (f) { return document.fonts.load(f).catch(function () {}); })); }
  function rr(px, py, w, h, r) { x.beginPath(); x.moveTo(px + r, py); x.arcTo(px + w, py, px + w, py + h, r); x.arcTo(px + w, py + h, px, py + h, r); x.arcTo(px, py + h, px, py, r); x.arcTo(px, py, px + w, py, r); x.closePath(); }
  function fit(text, max, size, weight) { var s = size; do { x.font = weight + ' ' + s + 'px ' + F; s -= 2; } while (x.measureText(text).width > max && s > 18); return x.font; }
  var L = m.live || {}, ev = L.ev || [], hn = MAGNA.teamName(m.home), an = MAGNA.teamName(m.away), hw = m.hs > m.as;
  var cmp = MAGNA.compOf(m), cname = cmp ? cmp.name : '';
  function draw(useLogo) { return fonts().then(function () { return Promise.all([img(MAGNA.crestUrl(m.home)), img(MAGNA.crestUrl(m.away)), useLogo ? img('logo.webp') : null]); }).then(function (ims) {
    // fondo
    x.fillStyle = '#0a0d18'; x.fillRect(0, 0, W, H);
    var g = x.createRadialGradient(W / 2, 330, 40, W / 2, 330, 720); g.addColorStop(0, 'rgba(59,75,255,.55)'); g.addColorStop(.45, 'rgba(139,92,246,.22)'); g.addColorStop(1, 'rgba(10,13,24,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    var gb = x.createLinearGradient(0, 0, W, 0); gb.addColorStop(0, PUR); gb.addColorStop(1, ORA); x.fillStyle = gb; x.fillRect(0, 0, W, 10);
    // cabecera
    var lgo = ims[2], tx = 104; if (lgo) { var lh = 76, lw = lgo.width * lh / lgo.height; x.drawImage(lgo, 60, 80 - lh / 2, lw, lh); tx = 60 + lw + 16; } else { x.fillStyle = ORA; x.beginPath(); x.arc(78, 78, 13, 0, Math.PI * 2); x.fill(); }
    x.fillStyle = FG; x.font = '900 40px ' + F; x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillText('MAGNA ARENA', tx, 80);
    x.textAlign = 'right'; x.fillStyle = MUT; x.font = '500 22px ' + MONO; x.fillText((cname + (m.round ? ' · ' + m.round : '')).toUpperCase().slice(0, 44), W - 64, 80);
    // etiqueta final
    x.textAlign = 'center'; x.font = '700 24px ' + MONO; var tw = x.measureText('RESULTADO FINAL').width + 56; rr(W / 2 - tw / 2, 150, tw, 54, 27); x.fillStyle = ORA; x.fill(); x.fillStyle = '#fff'; x.fillText('RESULTADO FINAL', W / 2, 178);
    // escudos
    function crest(cx, im, name, win) {
      x.save(); x.beginPath(); x.arc(cx, 400, 118, 0, Math.PI * 2); x.closePath(); x.fillStyle = '#191f3c'; x.fill(); x.clip();
      if (im) { var k = Math.max(236 / im.width, 236 / im.height); x.drawImage(im, cx - im.width * k / 2, 400 - im.height * k / 2, im.width * k, im.height * k); }
      else { x.fillStyle = MUT; x.font = '900 84px ' + F; x.textAlign = 'center'; x.fillText(name.slice(0, 2).toUpperCase(), cx, 404); }
      x.restore(); x.lineWidth = 8; x.strokeStyle = win ? GOLD : 'rgba(255,255,255,.28)'; x.beginPath(); x.arc(cx, 400, 120, 0, Math.PI * 2); x.stroke();
      x.fillStyle = FG; x.textAlign = 'center'; x.font = fit(name.toUpperCase(), 330, 46, 900); x.fillText(name.toUpperCase(), cx, 575);
      if (win) { x.font = '700 20px ' + MONO; x.fillStyle = GOLD; x.fillText('GANADOR', cx, 618); }
    }
    crest(225, ims[0], hn, hw); crest(W - 225, ims[1], an, !hw);
    // marcador
    x.fillStyle = FG; x.font = '900 190px ' + F; x.textAlign = 'center'; x.fillText(String(m.hs), W / 2 - 92, 410); x.fillText(String(m.as), W / 2 + 92, 410);
    x.fillStyle = GOLD; rr(W / 2 - 9, 362, 18, 80, 4); x.fill();
    // goleadores
    function scorers(side) { return ev.filter(function (e) { return e.k === 'goal' && e.side === side; }).map(function (e) { return (e.player ? MAGNA.playerName(e.player) || 'Gol' : 'Gol') + (e.min ? '  ' + e.min + "'" : ''); }); }
    var sh = scorers('h'), sa = scorers('a'), rows = Math.min(5, Math.max(sh.length, sa.length));
    rr(64, 660, W - 128, 66 + rows * 46, 28); x.fillStyle = 'rgba(255,255,255,.05)'; x.fill(); x.strokeStyle = 'rgba(255,255,255,.08)'; x.lineWidth = 2; x.stroke();
    x.font = '500 20px ' + MONO; x.fillStyle = MUT; x.textAlign = 'center'; x.fillText(rows ? 'GOLEADORES' : 'SIN GOLEADORES REGISTRADOS', W / 2, 694);
    x.font = '700 30px ' + F; x.fillStyle = FG;
    for (var i = 0; i < rows; i++) { var yy = 742 + i * 46; if (sh[i]) { x.textAlign = 'left'; x.fillText('⚽ ' + sh[i], 104, yy); } if (sa[i]) { x.textAlign = 'right'; x.fillText(sa[i] + ' ⚽', W - 104, yy); } }
    if (sh.length > 5 || sa.length > 5) { x.font = '500 20px ' + MONO; x.fillStyle = MUT; x.textAlign = 'center'; x.fillText('+ MÁS GOLES', W / 2, 742 + rows * 46 - 10); }
    // MVP y modos
    var y2 = 660 + 66 + rows * 46 + 36, modes = ev.filter(function (e) { return e.k === 'mode'; }).map(function (e) { return e.mode; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
    var chips = []; if (L.mvp && MAGNA.playerName(L.mvp)) chips.push(['⭐ MVP · ' + MAGNA.playerName(L.mvp), PUR]); if (modes.length) chips.push(['🎮 ' + modes.slice(0, 3).join(' · '), 'rgba(255,255,255,.1)']);
    x.font = '700 28px ' + F; var tot = chips.reduce(function (s, ch) { return s + x.measureText(ch[0]).width + 60; }, 0) + (chips.length - 1) * 16, cx0 = W / 2 - tot / 2;
    chips.forEach(function (ch) { var w = x.measureText(ch[0]).width + 60; rr(cx0, y2, w, 60, 30); x.fillStyle = ch[1]; x.fill(); x.fillStyle = '#fff'; x.textAlign = 'center'; x.fillText(ch[0], cx0 + w / 2, y2 + 31); cx0 += w + 16; });
    // pie
    var dt = m.at ? new Date(m.at.replace(' ', 'T') + 'Z').toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' }) : '';
    x.font = '500 22px ' + MONO; x.fillStyle = MUT; x.textAlign = 'center'; x.fillText(dt.toUpperCase(), W / 2, H - 58);
    return new Promise(function (res, rej) { try { c.toBlob(function (b) { b ? res(b) : rej(new Error('blob')); }, 'image/png'); } catch (e) { rej(e); } });
  }); }
  return draw(true).catch(function () { c = document.createElement('canvas'); c.width = W; c.height = H; x = c.getContext('2d'); return draw(false); });
};
