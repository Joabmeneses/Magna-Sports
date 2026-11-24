'use strict';
// Transmisiones: convierte un enlace de YouTube, Twitch o Kick en un reproductor dentro de la página.
window.MSTREAM = (function () {
  function parse(u) {
    u = String(u || '').trim(); if (!/^https?:\/\//i.test(u)) u = u ? 'https://' + u : ''; var x; try { x = new URL(u); } catch (e) { return null; }
    var host = x.hostname.replace(/^www\.|^m\./, ''), p = x.pathname.split('/').filter(Boolean), q = x.searchParams, par = location.hostname || 'localhost';
    if (/(^|\.)youtube\.com$/.test(host) || host === 'youtu.be') {
      var id = host === 'youtu.be' ? p[0] : q.get('v') || ((p[0] === 'live' || p[0] === 'shorts' || p[0] === 'embed') && p[1]);
      if (id && /^[\w-]{6,20}$/.test(id)) return { k: 'youtube', n: 'YouTube', src: 'https://www.youtube.com/embed/' + id + '?autoplay=1&rel=0', url: u };
      if (p[0] === 'channel' && p[1]) return { k: 'youtube', n: 'YouTube', src: 'https://www.youtube.com/embed/live_stream?channel=' + encodeURIComponent(p[1]) + '&autoplay=1', url: u };
      return null;
    }
    if (/(^|\.)twitch\.tv$/.test(host)) {
      if (p[0] === 'videos' && p[1]) return { k: 'twitch', n: 'Twitch', src: 'https://player.twitch.tv/?video=' + encodeURIComponent(p[1]) + '&parent=' + par + '&autoplay=true', url: u };
      if (p[0] && /^\w{2,30}$/.test(p[0])) return { k: 'twitch', n: 'Twitch', src: 'https://player.twitch.tv/?channel=' + p[0] + '&parent=' + par + '&autoplay=true', url: u };
      return null;
    }
    if (/(^|\.)kick\.com$/.test(host) && p[0] && /^[\w-]{2,30}$/.test(p[0])) return { k: 'kick', n: 'Kick', src: 'https://player.kick.com/' + p[0], url: u };
    return null;
  }
  function player(u) {
    var s = parse(u), w = document.createElement('div'); w.className = 'mst-pl'; if (!s) return w;
    var f = document.createElement('iframe'); f.src = s.src; f.title = 'Transmisión en ' + s.n; f.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media'; f.allowFullscreen = true; f.loading = 'lazy'; f.setAttribute('frameborder', '0'); w.appendChild(f);
    var a = document.createElement('a'); a.className = 'mst-out'; a.href = s.url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'Abrir en ' + s.n + ' ↗'; w.appendChild(a); return w;
  }
  if (!document.getElementById('mst-css')) { var st = document.createElement('style'); st.id = 'mst-css'; st.textContent = '.mst-pl{position:relative;width:100%;aspect-ratio:16/9;background:#000;box-shadow:6px 6px 0 #0c0716}.mst-pl iframe{position:absolute;inset:0;width:100%;height:100%;border:0;background:#000;color-scheme:dark}.mst-out{position:absolute;right:0;bottom:-28px;font:700 11px "Space Mono",monospace;letter-spacing:.08em;text-transform:uppercase;color:#c6ff1a;text-decoration:none}'; (document.head || document.documentElement).appendChild(st); }
  return { parse: parse, player: player, ok: function (u) { return !!parse(u); } };
})();
