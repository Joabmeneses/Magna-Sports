'use strict';
// Núcleo de NOTICIAS: categorías, reacciones, mascota, acceso a la base de datos y portadas.
window.NEWS = (function () {
  var CATS = [['general', 'Noticias generales', '#8b5cf6'], ['primera', 'Primera división', '#ffd23f'], ['segunda', 'Segunda división', '#c9cfdc'], ['tercera', 'Tercera división', '#c08457'],
    ['fichajes', 'Fichajes y jugadores', '#22d3ee'], ['resultados', 'Resultados', '#2ee59d'], ['torneos', 'Torneos y competiciones', '#ff5a36'], ['oficial', 'Comunicados oficiales', '#ff4d6d']];
  var REACT = [['like', '👍', 'Me gusta'], ['love', '❤️', 'Me encanta'], ['haha', '😂', 'Me divierte'], ['wow', '😮', 'Me sorprende'], ['sad', '😢', 'Me entristece'], ['fire', '🔥', 'Épico']];
  var MASCOT = [['de-pie', 'De pie'], ['trofeo', 'Con el trofeo'], ['sentado', 'Sentado'], ['brazos-cruzados', 'Brazos cruzados'], ['salto', 'Saltando'], ['celebrando', 'Celebrando'], ['pulgar-arriba', 'Pulgar arriba'], ['senalando', 'Señalando'],
    ['silencio', 'Silencio'], ['pensando', 'Pensando'], ['acostado', 'Acostado'], ['jugando', 'Jugando'], ['enojado', 'Enojado'], ['dab', 'Dab'], ['espalda', 'De espaldas']];
  function cat(id) { for (var i = 0; i < CATS.length; i++) if (CATS[i][0] === id) return { id: id, name: CATS[i][1], color: CATS[i][2] }; return { id: 'general', name: 'Noticias generales', color: '#8b5cf6' }; }
  function mascotUrl(slug) { return 'mascota/' + slug + '.webp'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  // Formato sencillo y seguro: párrafos, ## subtítulo, **negrita**, *cursiva*, listas con "- ", enlaces https
  function render(body) {
    var out = [], list = null;
    String(body || '').replace(/\r/g, '').split(/\n/).forEach(function (raw) {
      var line = raw.trim();
      function inl(t) { return esc(t).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*(?!\s)(.+?)\*/g, '$1<em>$2</em>').replace(/(https:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener nofollow">$1</a>'); }
      if (/^- /.test(line)) { if (!list) { list = []; } list.push('<li>' + inl(line.slice(2)) + '</li>'); return; }
      if (list) { out.push('<ul>' + list.join('') + '</ul>'); list = null; }
      if (!line) { out.push(''); return; }
      if (/^## /.test(line)) out.push('<h2>' + inl(line.slice(3)) + '</h2>');
      else if (/^> /.test(line)) out.push('<blockquote>' + inl(line.slice(2)) + '</blockquote>');
      else out.push('<p>' + inl(line) + '</p>');
    });
    if (list) out.push('<ul>' + list.join('') + '</ul>');
    return out.join('').replace(/<\/p><p>/g, '</p><p>');
  }
  function fdate(s, long) { if (!s) return ''; var d = new Date(s); return d.toLocaleDateString('es', long ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' } : { day: 'numeric', month: 'short', year: 'numeric' }); }
  function ago(s) { var d = (Date.now() - new Date(s).getTime()) / 1000; if (d < 60) return 'hace un momento'; if (d < 3600) return 'hace ' + Math.floor(d / 60) + ' min'; if (d < 86400) return 'hace ' + Math.floor(d / 3600) + ' h'; if (d < 7 * 86400) return 'hace ' + Math.floor(d / 86400) + ' d'; return fdate(s); }
  function sb() { return window.MAGNA_SB(); }
  // ---------- lectura pública ----------
  function listPublic() { return sb().then(function (c) { return c.from('articles').select('id,title,summary,body,category,cover_url,status,publish_at,featured,updated_at').in('status', ['published', 'scheduled']).lte('publish_at', new Date().toISOString()).order('publish_at', { ascending: false }).limit(200); }); }
  function totals(ids) { return sb().then(function (c) { return ids.length ? c.from('article_reaction_totals').select('article_id,emoji,total').in('article_id', ids) : { data: [] }; }); }
  function session() { return sb().then(function (c) { return c.auth.getSession().then(function (r) { return r.data && r.data.session; }); }); }
  function isAdmin() { return session().then(function (s) { if (!s || s.user.is_anonymous) return false; return sb().then(function (c) { return c.rpc('is_admin').then(function (r) { return r.data === true; }); }); }).catch(function () { return false; }); }
  function mine() { return session().then(function (s) { if (!s) return {}; return sb().then(function (c) { return c.from('article_reactions').select('article_id,emoji').eq('user_id', s.user.id).then(function (r) { var o = {}; (r.data || []).forEach(function (x) { o[x.article_id] = x.emoji; }); return o; }); }); }); }
  // Una reacción por cuenta: si no hay sesión se crea una cuenta anónima (sin datos personales)
  function ensureUser() { return sb().then(function (c) { return c.auth.getSession().then(function (r) { if (r.data && r.data.session) return r.data.session; return c.auth.signInAnonymously().then(function (x) { if (x.error) throw x.error; return x.data.session; }); }); }); }
  function react(articleId, emoji, current) {
    return ensureUser().then(function (s) { return sb().then(function (c) {
      if (current === emoji) return c.from('article_reactions').delete().eq('article_id', articleId).eq('user_id', s.user.id).then(chk).then(function () { return null; });
      if (current) return c.from('article_reactions').update({ emoji: emoji }).eq('article_id', articleId).eq('user_id', s.user.id).then(chk).then(function () { return emoji; });
      return c.from('article_reactions').insert({ article_id: articleId, emoji: emoji }).then(function (r) { if (r.error && /duplicate|23505/.test(r.error.message + r.error.code)) return c.from('article_reactions').update({ emoji: emoji }).eq('article_id', articleId).eq('user_id', s.user.id).then(chk); return chk(r); }).then(function () { return emoji; });
    }); });
  }
  function chk(r) { if (r && r.error) throw r.error; return r; }
  // ---------- administración ----------
  function listAll() { return sb().then(function (c) { return c.from('articles').select('*').order('publish_at', { ascending: false }).limit(500).then(chk); }); }
  function save(a) { return sb().then(function (c) { var row = { title: a.title, summary: a.summary, body: a.body, category: a.category, cover_url: a.cover_url || null, status: a.status, publish_at: a.publish_at, featured: !!a.featured };
    if (a.id) return c.from('articles').update(row).eq('id', a.id).select().then(chk);
    row.author_email = a.author_email || null; return c.from('articles').insert(row).select().then(chk); }); }
  function remove(id) { return sb().then(function (c) { return c.from('articles').delete().eq('id', id).then(chk); }); }
  function upload(blob, ext) { return sb().then(function (c) { var path = new Date().toISOString().slice(0, 7) + '/' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8) + '.' + (ext || 'webp');
    return c.storage.from('noticias').upload(path, blob, { contentType: blob.type || 'image/webp', cacheControl: '31536000', upsert: false }).then(function (r) { if (r.error) throw r.error; return c.storage.from('noticias').getPublicUrl(path).data.publicUrl; }); }); }
  // ---------- imágenes ----------
  function loadImg(src) { return new Promise(function (res, rej) { var i = new Image(); i.onload = function () { res(i); }; i.onerror = rej; i.src = src; }); }
  function toBlob(cv, q) { return new Promise(function (res, rej) { cv.toBlob(function (b) { b ? res(b) : rej(new Error('blob')); }, 'image/webp', q || .9); }); }
  // Foto subida: se ajusta a máx. 1920 px de ancho manteniendo proporción (buena resolución, peso razonable)
  function prepPhoto(file) { return new Promise(function (res, rej) { var r = new FileReader(); r.onerror = rej; r.onload = function () { loadImg(r.result).then(function (im) { var k = Math.min(1, 1920 / im.width), cv = document.createElement('canvas'); cv.width = Math.round(im.width * k); cv.height = Math.round(im.height * k); cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); res({ canvas: cv, img: im, src: r.result }); }, rej); }; r.readAsDataURL(file); }); }
  // Portada combinada 1600x900: fondo (diseño de marca o foto) + mascota opcional + título opcional. La mascota no se altera: solo se coloca y se funde con el fondo.
  function compose(o) {
    var W = 1600, H = 900, cv = document.createElement('canvas'); cv.width = W; cv.height = H; var x = cv.getContext('2d'), cc = cat(o.category), F = 'Archivo, "Arial Narrow", Arial, sans-serif';
    var jobs = [o.photo ? loadImg(o.photo) : null, o.mascot ? loadImg(mascotUrl(o.mascot)) : null, loadImg('logo.webp').catch(function () { return null; })];
    return Promise.all(jobs).then(function (ims) {
      var ph = ims[0], ms = ims[1], lg = ims[2];
      if (ph) { var k = Math.max(W / ph.width, H / ph.height); x.drawImage(ph, (W - ph.width * k) / 2, (H - ph.height * k) / 2, ph.width * k, ph.height * k); var sh = x.createLinearGradient(0, 0, W, 0); sh.addColorStop(0, 'rgba(10,13,24,.88)'); sh.addColorStop(.6, 'rgba(10,13,24,.35)'); sh.addColorStop(1, 'rgba(10,13,24,.1)'); if (o.title || ms) { x.fillStyle = sh; x.fillRect(0, 0, W, H); } }
      else {
        x.fillStyle = '#0a0d18'; x.fillRect(0, 0, W, H);
        var g1 = x.createRadialGradient(W * .72, H * .45, 40, W * .72, H * .45, 900); g1.addColorStop(0, o.style === 'fuego' ? 'rgba(255,90,54,.75)' : 'rgba(139,92,246,.75)'); g1.addColorStop(.55, o.style === 'fuego' ? 'rgba(139,40,20,.25)' : 'rgba(59,75,255,.22)'); g1.addColorStop(1, 'rgba(10,13,24,0)'); x.fillStyle = g1; x.fillRect(0, 0, W, H);
        var g2 = x.createRadialGradient(W * .1, H * 1.1, 10, W * .1, H * 1.1, 700); g2.addColorStop(0, o.style === 'fuego' ? 'rgba(139,92,246,.35)' : 'rgba(255,90,54,.35)'); g2.addColorStop(1, 'rgba(10,13,24,0)'); x.fillStyle = g2; x.fillRect(0, 0, W, H);
        x.save(); x.globalAlpha = .07; x.strokeStyle = '#fff'; x.lineWidth = 2; for (var i = -H; i < W; i += 46) { x.beginPath(); x.moveTo(i, H); x.lineTo(i + H * .6, 0); x.stroke(); } x.restore();
        x.fillStyle = cc.color; x.fillRect(0, H - 14, W, 14);
      }
      if (ms) {
        var mh = H * (o.title ? .98 : 1.02), mw = ms.width * mh / ms.height, mx = o.title ? W - mw - 40 : (W - mw) / 2, my = H - mh;
        var off = document.createElement('canvas'); off.width = Math.ceil(mw); off.height = Math.ceil(mh); var ox = off.getContext('2d'); ox.drawImage(ms, 0, 0, mw, mh);
        ox.globalCompositeOperation = 'destination-in'; var fx = ox.createLinearGradient(0, 0, mw, 0); fx.addColorStop(0, 'rgba(0,0,0,0)'); fx.addColorStop(.24, '#000'); fx.addColorStop(.78, '#000'); fx.addColorStop(1, 'rgba(0,0,0,0)'); ox.fillStyle = fx; ox.fillRect(0, 0, mw, mh);
        var fy = ox.createLinearGradient(0, 0, 0, mh); fy.addColorStop(0, 'rgba(0,0,0,0)'); fy.addColorStop(.1, '#000'); fy.addColorStop(1, '#000'); ox.fillStyle = fy; ox.fillRect(0, 0, mw, mh);
        x.save(); x.shadowColor = o.style === 'fuego' ? 'rgba(255,90,54,.55)' : 'rgba(139,92,246,.6)'; x.shadowBlur = 60; x.drawImage(off, mx, my); x.restore();
      }
      if (o.title) {
        var maxW = ms ? W * .55 : W * .82, tx = 90, words = String(o.title).toUpperCase().split(/\s+/), size = 104, lines;
        function wrap() { x.font = '900 ' + size + 'px ' + F; lines = []; var ln = ''; words.forEach(function (w) { var t = ln ? ln + ' ' + w : w; if (x.measureText(t).width > maxW && ln) { lines.push(ln); ln = w; } else ln = t; }); if (ln) lines.push(ln); }
        wrap(); while ((lines.length > 4 || lines.some(function (l) { return x.measureText(l).width > maxW; })) && size > 44) { size -= 6; wrap(); }
        var lh = size * 1.02, blockH = lines.length * lh, ty = (H - blockH) / 2 + 40;
        x.font = '700 30px ' + F; var cw = x.measureText(cc.name.toUpperCase()).width + 50; x.fillStyle = cc.color; x.beginPath(); x.roundRect ? x.roundRect(tx, ty - 110, cw, 54, 27) : x.rect(tx, ty - 110, cw, 54); x.fill();
        x.fillStyle = '#0a0d18'; x.textBaseline = 'middle'; x.fillText(cc.name.toUpperCase(), tx + 25, ty - 82);
        x.fillStyle = '#fff'; x.textBaseline = 'top'; x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = 24; x.font = '900 ' + size + 'px ' + F; lines.forEach(function (l, i) { x.fillText(l, tx, ty + i * lh); }); x.shadowBlur = 0;
      }
      if (lg) { var lhh = 84, lw = lg.width * lhh / lg.height; x.drawImage(lg, 60, 50, lw, lhh); x.font = '900 36px ' + F; x.fillStyle = '#fff'; x.textBaseline = 'middle'; x.fillText('MAGNA ARENA', 60 + lw + 16, 94); }
      return toBlob(cv, .9).then(function (b) { return { blob: b, url: URL.createObjectURL(b) }; });
    });
  }
  return { CATS: CATS, REACT: REACT, MASCOT: MASCOT, cat: cat, mascotUrl: mascotUrl, esc: esc, render: render, fdate: fdate, ago: ago,
    listPublic: listPublic, totals: totals, session: session, isAdmin: isAdmin, mine: mine, react: react, listAll: listAll, save: save, remove: remove, upload: upload, prepPhoto: prepPhoto, compose: compose, toBlob: toBlob };
})();
