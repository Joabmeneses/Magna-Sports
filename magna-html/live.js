'use strict';
// Marcador en vivo de Magna Arena: aparece en todas las páginas cuando hay partidos en juego.
(function () {
  if (!window.MAGNA || /admin\.html$/.test(location.pathname)) return;
  var S = MAGNA.S, live = [], openId = null;
  function refreshList() { S = MAGNA.S; live = S.matches.filter(function (m) { return m.status === 'live'; }); }
  refreshList();
  var css = '' +
    '.mlv{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:80;display:flex;gap:8px;max-width:calc(100% - 24px);overflow-x:auto;padding:2px;font-family:Archivo,system-ui,sans-serif;scrollbar-width:none}' +
    '.mlv::-webkit-scrollbar{display:none}' +
    '.mlv button{flex:none;display:flex;align-items:center;gap:10px;background:rgba(15,19,38,.94);backdrop-filter:blur(10px);border:1px solid rgba(255,90,54,.7);color:#f1f3fb;border-radius:999px;padding:9px 16px 9px 12px;cursor:pointer;font:600 14px Archivo,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.45);animation:mlvIn .5s cubic-bezier(.2,.9,.2,1) both}' +
    '@keyframes mlvIn{from{opacity:0;transform:translateY(20px)}}' +
    '.mlv .d{display:inline-flex;align-items:center;gap:6px;color:#ff5a36;font:700 11px/1 "JetBrains Mono",monospace;letter-spacing:.1em}' +
    '.mlv .d:before{content:"";width:8px;height:8px;border-radius:50%;background:#ff5a36;animation:mlvB 1.2s infinite}@keyframes mlvB{50%{opacity:.2}}' +
    '.mlv .s{font:900 16px Archivo,sans-serif;font-stretch:120%;background:#3b4bff;border-radius:8px;padding:2px 8px}' +
    '.mlv small{color:#9aa0b8;font-weight:500}' +
    '.mlvo{position:fixed;inset:0;z-index:95;background:rgba(5,7,14,.78);backdrop-filter:blur(4px);display:grid;place-items:center;padding:14px;font-family:Archivo,system-ui,sans-serif;color:#f1f3fb}' +
    '.mlvm{background:radial-gradient(90% 60% at 50% 0,rgba(59,75,255,.4),transparent 70%),#131833;border:1px solid #1b2030;border-radius:26px;width:min(560px,100%);max-height:88vh;overflow:auto;padding:22px}' +
    '.mlvm .hd{display:flex;justify-content:space-between;align-items:center;gap:10px;color:#9aa0b8;font-size:13px}' +
    '.mlvm .x{background:transparent;border:1px solid #1b2030;color:#f1f3fb;border-radius:999px;padding:7px 14px;cursor:pointer;font:inherit}' +
    '.mlvm .sb{display:grid;grid-template-columns:1fr auto 1fr;gap:12px;align-items:center;text-align:center;margin:18px 0 6px}' +
    '.mlvm .t{display:flex;flex-direction:column;align-items:center;gap:8px;min-width:0}.mlvm .t b{font-size:16px;text-transform:uppercase;font-stretch:115%;overflow-wrap:anywhere}' +
    '.mlvm .cr{width:64px;height:64px;border-radius:50%;display:grid;place-items:center;background:#191f3c center/cover;border:3px solid rgba(255,255,255,.3);font:900 20px Archivo,sans-serif;color:#9aa0b8}' +
    '.mlvm .sc{font:900 56px/1 Archivo,sans-serif;font-stretch:125%}.mlvm .mn{display:block;color:#ff5a36;font:700 13px "JetBrains Mono",monospace;margin-top:6px}' +
    '.mlvm .tg{display:flex;justify-content:center;flex-wrap:wrap;gap:8px;margin:10px 0 16px}.mlvm .tg span{background:rgba(255,255,255,.08);border-radius:999px;padding:6px 12px;font-size:12px}.mlvm .tg .o{background:#ff5a36;color:#fff}' +
    '.mlvm h4{margin:14px 0 6px;color:#9aa0b8;font:500 10px/1 "JetBrains Mono",monospace;letter-spacing:.14em;text-transform:uppercase}' +
    '.mlvm .ev{display:grid;grid-template-columns:40px 26px 1fr;gap:10px;align-items:center;padding:9px 0;border-top:1px solid #1b2030;font-size:14px}.mlvm .ev:first-of-type{border:0}' +
    '.mlvm .ev .m{color:#ff5a36;font:700 12px "JetBrains Mono",monospace;text-align:right}.mlvm .ev .i{text-align:center}' +
    '.mlvm .nt{color:#9aa0b8;font-size:12px;margin-top:14px}' +
    '.mlvn{position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:85;background:#8b5cf6;color:#fff;border:0;border-radius:999px;padding:10px 18px;font:700 14px Archivo,sans-serif;cursor:pointer;box-shadow:0 10px 30px rgba(0,0,0,.4);animation:mlvIn .4s both}' +
    '.mlv button.flash{animation:mlvF .9s 2}@keyframes mlvF{50%{background:#2ee59d;color:#0a0d18}}' +
    '@media(max-width:600px){.mlv{bottom:10px}.mlv small{display:none}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function crest(id) { var c = el('span', 'cr'), u = MAGNA.crestUrl(id); if (u) c.style.backgroundImage = 'url(' + u + ')'; else c.textContent = MAGNA.teamName(id).slice(0, 2).toUpperCase(); return c; }
  function info(m) { var L = m.live || {}, ph = MAGNA.PHASES[L.phase] || 'En vivo', run = L.clock && L.clock.run; return { min: run ? MAGNA.liveMinute(m) + "'" : L.phase === 'HT' ? 'ET' : '', ph: ph, mode: L.mode }; }
  function comp(m) { var c = MAGNA.by(m.type === 'league' ? S.leagues : S.tournaments, m.cid); return c ? c.name : ''; }
  var bar = el('div', 'mlv'); bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Partidos en vivo');
  function pills() {
    bar.innerHTML = '';
    live.forEach(function (m) { var i = info(m), b = el('button'); b.type = 'button';
      b.appendChild(el('span', 'd', 'VIVO' + (i.min ? ' ' + i.min : '')));
      b.appendChild(document.createTextNode(MAGNA.teamName(m.home))); b.appendChild(el('span', 's', (m.hs || 0) + '-' + (m.as || 0))); b.appendChild(document.createTextNode(MAGNA.teamName(m.away)));
      if (i.mode || i.ph) b.appendChild(el('small', null, '· ' + (i.mode || i.ph)));
      b.onclick = function () { open(m); }; bar.appendChild(b); });
  }
  var curOv = null;
  function open(m) {
    if (curOv) curOv.remove(); openId = m.id;
    var ov = el('div', 'mlvo'), md = el('div', 'mlvm'); ov.appendChild(md); curOv = ov;
    function close() { ov.remove(); curOv = null; openId = null; document.removeEventListener('keydown', k); } function k(e) { if (e.key === 'Escape') close(); }
    ov.onclick = function (e) { if (e.target === ov) close(); }; document.addEventListener('keydown', k);
    var i = info(m), hd = el('div', 'hd'); hd.appendChild(el('span', null, comp(m) + (m.round ? ' · ' + m.round : ''))); var x = el('button', 'x', 'Cerrar'); x.onclick = close; hd.appendChild(x); md.appendChild(hd);
    var sb = el('div', 'sb'); [m.home, null, m.away].forEach(function (t) { if (t == null) { var mid = el('div'); mid.appendChild(el('div', 'sc', (m.hs || 0) + ' - ' + (m.as || 0))); mid.appendChild(el('span', 'mn', i.min || i.ph)); sb.appendChild(mid); return; } var d = el('div', 't'); d.appendChild(crest(t)); d.appendChild(el('b', null, MAGNA.teamName(t))); sb.appendChild(d); });
    md.appendChild(sb);
    var tg = el('div', 'tg'); tg.appendChild(el('span', 'o', '● ' + i.ph)); if (i.mode) tg.appendChild(el('span', null, '🎮 ' + i.mode)); md.appendChild(tg);
    var RT = (m.live && m.live.ratings) || {}, rk = Object.keys(RT).map(function (id) { return [Number(id), RT[id]]; }).sort(function (a, b) { return b[1] - a[1]; });
    if (rk.length) { md.appendChild(el('h4', null, 'Valoraciones')); var vr = el('div', 'tg'); vr.style.justifyContent = 'flex-start'; rk.slice(0, 8).forEach(function (x) { var s = el('span', null, (MAGNA.playerName(x[0]) || '—') + ' · ' + String(x[1]).replace('.', ',')); if (x[1] >= 8) s.style.cssText = 'background:rgba(46,229,157,.18);color:#2ee59d'; vr.appendChild(s); }); md.appendChild(vr); }
    md.appendChild(el('h4', null, 'Minuto a minuto'));
    var ICO = { start: '▶', goal: '⚽', mode: '🎮', sub: '⇄', ht: '⏸', resume: '▶', end: '🏁' }, ev = ((m.live && m.live.ev) || []).slice().reverse();
    if (!ev.length) md.appendChild(el('p', 'nt', 'El partido acaba de empezar.'));
    ev.forEach(function (e) { var r = el('div', 'ev'); r.appendChild(el('span', 'm', e.min ? e.min + "'" : '')); r.appendChild(el('span', 'i', ICO[e.k] || '•')); r.appendChild(el('span', null, MAGNA.eventText(m, e))); md.appendChild(r); });
    md.appendChild(el('p', 'nt', 'En tiempo real: lo narra el administrador y aparece aquí al instante.' + (window.MAGNA_TZ ? ' Horas en ' + MAGNA_TZ.label + '.' : '')));
    document.body.appendChild(ov);
  }
  document.body.appendChild(bar); pills(); setInterval(pills, 15000);
  // ---- tiempo real ----
  function core(st) { var o = MAGNA.cloud.strip(st); (o.matches || []).forEach(function (m) { delete m.live; delete m.hs; delete m.as; delete m.status; }); delete o.news; delete o.seq; return JSON.stringify(o); }
  var note = null;
  function changed(prev, next) {
    var goal = next.matches.some(function (m) { var p = MAGNA.by(prev.matches, m.id); return p && m.status === 'live' && ((m.hs || 0) + (m.as || 0)) > ((p.hs || 0) + (p.as || 0)); });
    var statusChange = next.matches.some(function (m) { var p = MAGNA.by(prev.matches, m.id); return !p || p.status !== m.status; });
    return { goal: goal, other: core(prev) !== core(next) || (statusChange && !window.MAGNA_HANDLES_MATCHES) };
  }
  if (!window.MAGNA_SB || MAGNA.cloud.source !== 'cloud') return;
  window.MAGNA_SB().then(function (sb) {
    sb.channel('magna-site').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'site_state' }, function (p) {
      var data = p.new && p.new.data; if (!data || !data.v) return;
      var prev = MAGNA.S, c = changed(prev, data); MAGNA.cloud.applyRemote(data); refreshList(); pills();
      try { window.dispatchEvent(new CustomEvent('magna:update', { detail: { prev: prev } })); } catch (e) {}
      if (c.goal) [].forEach.call(bar.children, function (b) { b.classList.add('flash'); setTimeout(function () { b.classList.remove('flash'); }, 2000); });
      if (openId) { var m = MAGNA.by(MAGNA.S.matches, openId); if (m && m.status === 'live') open(m); else if (curOv) { curOv.remove(); curOv = null; openId = null; } }
      if (c.other && !note) { note = el('button', 'mlvn', 'Hay novedades · Toca para actualizar'); note.onclick = function () { location.reload(); }; document.body.appendChild(note); }
    }).subscribe();
  }, function () {});
})();
