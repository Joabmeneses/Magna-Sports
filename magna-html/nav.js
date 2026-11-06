'use strict';
// Menú de navegación único para todo Magna Arena (reemplaza la cabecera de cada página).
(function () {
  var old = document.querySelector('body > header'); if (!old || old.dataset.mn) return;
  var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase(); if (here === '' || here === '/') here = 'index.html';
  var I = {
    play: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5l5 3.5-5 3.5z"/>', list: '<path d="M4 6h16M4 12h16M4 18h10"/>', cup: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4z"/><path d="M17 5h3v2a3 3 0 01-3 3M7 5H4v2a3 3 0 003 3"/>',
    rank: '<path d="M4 20V13h4v7M10 20V8h4v12M16 20v-9h4v9M3 20h18"/>', globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/>', star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    coin: '<circle cx="12" cy="12" r="9"/><path d="M9 9h4.5a1.5 1.5 0 010 3H10a1.5 1.5 0 000 3H15M12 7v2M12 15v2"/>', cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/>', swap: '<path d="M7 7h12l-3-3M17 17H5l3 3"/>', lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
    news: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>'
  };
  var L = [
    ['index.html', 'Partidos', 'play', 'Competición', 'Partido destacado y resultados'], ['ligas.html', 'Ligas', 'list', 'Competición', 'Tablas de cada liga'], ['competiciones.html', 'Torneos', 'cup', 'Competición', 'Torneos y cruces'],
    ['mundial.html', 'Mundial', 'globe', 'Competición', 'Grupos y eliminatoria'], ['champions.html', 'Champions', 'star', 'Competición', 'Tabla general'], ['calendario.html', 'Calendario', 'cal', 'Competición', 'Agenda de partidos'],
    ['noticias.html', 'Noticias', 'news', 'Comunidad', 'Lo último de la comunidad'], ['equipos.html', 'Equipos', 'shield', 'Comunidad', 'Plantillas, fotos y trofeos'], ['mercado.html', 'Fichajes', 'swap', 'Comunidad', 'Medias, goleadores y mercado'], ['ranking.html', 'Ranking', 'rank', 'Comunidad', 'Equipos, jugadores y Bits'], ['apuestas.html', 'Apuestas', 'coin', 'Comunidad', 'Pronósticos en vivo']
  ];
  function svg(k) { return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + I[k] + '</svg>'; }
  var css = '' +
    '.mn{position:sticky;top:0;z-index:60;background:rgba(10,13,24,.86);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border-bottom:1px solid rgba(255,255,255,.08);font-family:Archivo,system-ui,sans-serif;color:#f1f3fb;padding:0!important;margin:0!important}' +
    '.mn *{box-sizing:border-box}.mn-in{max-width:1240px;margin:0 auto;padding:0 20px;height:66px;display:flex;align-items:center;gap:22px}' +
    '.mn-logo{display:flex;align-items:center;gap:10px;color:#f1f3fb;text-decoration:none;font:900 23px/1 Archivo,sans-serif;font-stretch:125%;text-transform:uppercase;letter-spacing:-.01em;white-space:nowrap;flex:none}' +
    '.mn-logo img{height:38px;width:auto;display:block;filter:drop-shadow(0 0 10px rgba(255,140,0,.35))}' +
    '.mn-links{display:flex;align-items:center;justify-content:center;gap:2px;flex:1;min-width:0;overflow:hidden}' +
    '.mn-links a{position:relative;color:#c9cde0;text-decoration:none;font:500 12px/1 "JetBrains Mono",ui-monospace,monospace;letter-spacing:.1em;text-transform:uppercase;padding:10px 9px;border-radius:10px;white-space:nowrap;transition:color .15s,background-color .15s}' +
    '.mn-links a:hover{color:#fff;background:rgba(255,255,255,.06)}.mn-links a.on{color:#ff5a36}.mn-links a.on:after{content:"";position:absolute;left:9px;right:9px;bottom:-12px;height:2px;border-radius:2px;background:#ff5a36}' +
    '.mn-r{display:flex;align-items:center;gap:10px;flex:none;margin-left:auto}' +
    '.mn-adm{display:inline-flex;align-items:center;gap:8px;border:1px solid #ff5a36;color:#ff5a36;border-radius:999px;padding:10px 16px;text-decoration:none;font:500 11px/1 "JetBrains Mono",monospace;letter-spacing:.12em;text-transform:uppercase;white-space:nowrap;transition:background-color .15s,color .15s}' +
    '.mn-acc{display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(255,255,255,.18);color:#f1f3fb;border-radius:999px;padding:10px 16px;text-decoration:none;font:600 13px/1 Archivo,sans-serif;white-space:nowrap;transition:border-color .15s,background-color .15s}.mn-acc svg{width:16px;height:16px}.mn-acc:hover,.mn-acc.on{border-color:#ffd23f;color:#ffd23f}' +
    '.mn-foot{display:grid;gap:8px}.mn-foot .mn-acc2{border-color:#ffd23f;color:#ffd23f}' +
    '.mn-adm svg{width:14px;height:14px}.mn-adm:hover,.mn-adm.on{background:#ff5a36;color:#fff}' +
    '.mn-btn{display:none;align-items:center;gap:8px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:#f1f3fb;border-radius:999px;padding:9px 14px;font:700 14px Archivo,sans-serif;cursor:pointer}.mn-btn svg{width:20px;height:20px}' +
    '.mn-ex{display:flex;align-items:center;gap:8px}' +
    '.mn.tight .mn-links a{padding:10px 6px;letter-spacing:.06em}.mn.tight .mn-in{gap:14px}.mn.tight .mn-r .mn-adm span,.mn.tight .mn-r .mn-acc span{display:none}.mn.tight .mn-r .mn-adm,.mn.tight .mn-r .mn-acc{padding:10px 12px}' +
    '.mn.tight2 .mn-links a{padding:10px 4px;letter-spacing:.02em;font-size:11px}.mn.tight2 .mn-in{gap:10px}.mn.tight2 .mn-wm{display:none}' +
    '.mn.compact .mn-links,.mn.compact .mn-r .mn-adm,.mn.compact .mn-r .mn-acc{display:none}.mn.compact .mn-btn{display:inline-flex}.mn.compact .mn-in{height:60px;gap:12px}' +
    '@media(max-width:900px){.mn-links,.mn-r .mn-adm,.mn-r .mn-acc{display:none}.mn-btn{display:inline-flex}.mn-in{height:60px;gap:12px}}' +
    '@media(max-width:480px){.mn.has-ex .mn-wm{display:none}.mn-ex .coins{padding:8px 12px!important}}' +
    '@media(max-width:380px){.mn-ex .coins{padding:7px 10px!important;font-size:10px!important;letter-spacing:.06em!important}.mn-in{gap:8px}}' +
    '@media(max-width:480px){.mn-logo{font-size:20px}.mn-btn span{display:none}.mn-btn{padding:10px}.mn-in{padding:0 14px}}' +
    // panel del menú móvil
    '.mn-ov{position:fixed;inset:0;z-index:100;background:rgba(5,7,14,.7);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);opacity:0;transition:opacity .25s;font-family:Archivo,system-ui,sans-serif}' +
    '.mn-ov.show{opacity:1}.mn-sh{position:absolute;top:0;left:0;right:0;max-height:100%;overflow:auto;background:radial-gradient(80% 50% at 50% 0,rgba(139,92,246,.28),transparent 70%),#0f1326;border-bottom:1px solid rgba(255,255,255,.1);border-radius:0 0 28px 28px;padding:14px 16px 22px;transform:translateY(-24px);transition:transform .3s cubic-bezier(.2,.9,.2,1)}' +
    '.mn-ov.show .mn-sh{transform:none}.mn-hd{display:flex;align-items:center;justify-content:space-between;height:44px;margin-bottom:8px}' +
    '.mn-x{width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#f1f3fb;display:grid;place-items:center;cursor:pointer}.mn-x svg{width:20px;height:20px}' +
    '.mn-g{margin:14px 0 8px;color:#9aa0b8;font:500 10px/1 "JetBrains Mono",monospace;letter-spacing:.16em;text-transform:uppercase}' +
    '.mn-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,230px),1fr));gap:8px}' +
    '.mn-it{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:16px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:#f1f3fb;text-decoration:none;transition:border-color .15s,background-color .15s}' +
    '.mn-it:hover{border-color:#8b5cf6}.mn-it.on{border-color:#ff5a36;background:rgba(255,90,54,.12)}' +
    '.mn-it .ic{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:rgba(139,92,246,.18);color:#c9b8ff;flex:none}.mn-it.on .ic{background:#ff5a36;color:#fff}.mn-it .ic svg{width:20px;height:20px}' +
    '.mn-it b{display:block;font:800 16px/1.2 Archivo,sans-serif}.mn-it small{display:block;color:#9aa0b8;font-size:12px;margin-top:2px}' +
    '.mn-foot{margin-top:16px}.mn-foot .mn-adm{width:100%;justify-content:center;padding:14px}' +
    '@media(prefers-reduced-motion:reduce){.mn-ov,.mn-sh{transition:none}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  if (!document.querySelector('link[rel~="icon"]')) { var fi = document.createElement('link'); fi.rel = 'icon'; fi.type = 'image/png'; fi.href = 'favicon.png'; document.head.appendChild(fi); var ap = document.createElement('link'); ap.rel = 'apple-touch-icon'; ap.href = 'favicon.png'; document.head.appendChild(ap); }
  var hd = document.createElement('header'); hd.className = 'mn'; hd.dataset.mn = '1';
  var ex = old.querySelector('.coins'); // saldo de Apuestas
  var isAdm = here === 'admin.html';
  hd.innerHTML = '<div class="mn-in"><a class="mn-logo" href="index.html" aria-label="Magna Arena, inicio"><img src="logo-sm.png" alt="" width="34" height="38"><span class="mn-wm">Magna Arena</span></a>' +
    '<div class="mn-links" role="navigation" aria-label="Secciones">' + L.map(function (x) { return '<a href="' + x[0] + '"' + (x[0] === here ? ' class="on" aria-current="page"' : '') + '>' + x[1] + '</a>'; }).join('') + '</div>' +
    '<div class="mn-r"><div class="mn-ex"></div><a class="mn-acc' + (here === 'cuenta.html' ? ' on' : '') + '" href="cuenta.html" title="Mi cuenta">' + svg('user') + '<span>Mi cuenta</span></a><a class="mn-adm' + (isAdm ? ' on' : '') + '" href="admin.html" title="Administración">' + svg('lock') + '<span>Administración</span></a><button class="mn-btn" type="button" aria-expanded="false" aria-label="Abrir menú">' + svg('menu') + '<span>Menú</span></button></div></div>';
  if (ex) { hd.querySelector('.mn-ex').appendChild(ex); hd.classList.add('has-ex'); }
  old.parentNode.replaceChild(hd, old);
  var btn = hd.querySelector('.mn-btn'), ov = null;
  function close() { if (!ov) return; var o = ov; ov = null; o.classList.remove('show'); document.documentElement.style.overflow = ''; btn.setAttribute('aria-expanded', 'false'); setTimeout(function () { o.remove(); }, 260); btn.focus(); }
  function open() {
    ov = document.createElement('div'); ov.className = 'mn-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Menú');
    var groups = {}; L.forEach(function (x) { (groups[x[3]] = groups[x[3]] || []).push(x); });
    ov.innerHTML = '<div class="mn-sh"><div class="mn-hd"><a class="mn-logo" href="index.html"><img src="logo-sm.png" alt="" width="34" height="38">Magna Arena</a><button class="mn-x" type="button" aria-label="Cerrar menú">' + svg('x') + '</button></div>' +
      Object.keys(groups).map(function (g) { return '<div class="mn-g">' + g + '</div><div class="mn-grid">' + groups[g].map(function (x) { return '<a class="mn-it' + (x[0] === here ? ' on' : '') + '" href="' + x[0] + '"><span class="ic">' + svg(x[2]) + '</span><span><b>' + x[1] + '</b><small>' + x[4] + '</small></span></a>'; }).join('') + '</div>'; }).join('') +
      '<div class="mn-foot"><a class="mn-adm mn-acc2' + (here === 'cuenta.html' ? ' on' : '') + '" href="cuenta.html">' + svg('user') + 'Mi cuenta · Bits</a><a class="mn-adm' + (isAdm ? ' on' : '') + '" href="admin.html">' + svg('lock') + 'Administración</a></div></div>';
    document.body.appendChild(ov); document.documentElement.style.overflow = 'hidden'; btn.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(function () { if (ov) ov.classList.add('show'); });
    ov.addEventListener('click', function (e) { if (e.target === ov || e.target.closest('.mn-x')) close(); });
    var cur = ov.querySelector('.mn-it.on') || ov.querySelector('.mn-it'); if (cur) cur.focus();
  }
  btn.addEventListener('click', function () { ov ? close() : open(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  // zona horaria: las horas se muestran en la hora local de cada persona; aquí se dice de qué país es
  var TZC = { 'America/Bogota': 'Colombia', 'America/Mexico_City': 'México', 'America/Monterrey': 'México', 'America/Merida': 'México', 'America/Cancun': 'México', 'America/Chihuahua': 'México', 'America/Mazatlan': 'México', 'America/Tijuana': 'México', 'America/Hermosillo': 'México',
    'America/Lima': 'Perú', 'America/Santiago': 'Chile', 'America/Punta_Arenas': 'Chile', 'America/Argentina/Buenos_Aires': 'Argentina', 'America/Buenos_Aires': 'Argentina', 'America/Argentina/Cordoba': 'Argentina', 'America/Argentina/Mendoza': 'Argentina', 'America/Caracas': 'Venezuela', 'America/Guayaquil': 'Ecuador',
    'America/La_Paz': 'Bolivia', 'America/Asuncion': 'Paraguay', 'America/Montevideo': 'Uruguay', 'America/Sao_Paulo': 'Brasil', 'America/Manaus': 'Brasil', 'America/Fortaleza': 'Brasil', 'America/Recife': 'Brasil', 'America/Bahia': 'Brasil', 'America/Panama': 'Panamá', 'America/Costa_Rica': 'Costa Rica',
    'America/Guatemala': 'Guatemala', 'America/El_Salvador': 'El Salvador', 'America/Tegucigalpa': 'Honduras', 'America/Managua': 'Nicaragua', 'America/Santo_Domingo': 'República Dominicana', 'America/Puerto_Rico': 'Puerto Rico', 'America/Havana': 'Cuba',
    'America/New_York': 'Estados Unidos', 'America/Chicago': 'Estados Unidos', 'America/Denver': 'Estados Unidos', 'America/Phoenix': 'Estados Unidos', 'America/Los_Angeles': 'Estados Unidos', 'America/Anchorage': 'Estados Unidos', 'America/Detroit': 'Estados Unidos', 'Pacific/Honolulu': 'Estados Unidos',
    'America/Toronto': 'Canadá', 'America/Vancouver': 'Canadá', 'Europe/Madrid': 'España', 'Atlantic/Canary': 'España (Canarias)', 'Europe/Lisbon': 'Portugal', 'Europe/London': 'Reino Unido', 'Europe/Paris': 'Francia', 'Europe/Rome': 'Italia', 'Europe/Berlin': 'Alemania' };
  window.MAGNA_TZ = (function () { var id = '', off = '';
    try { id = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    try { var p = new Intl.DateTimeFormat('en-US', { timeZoneName: 'shortOffset' }).formatToParts(new Date()).filter(function (x) { return x.type === 'timeZoneName'; })[0]; off = p ? p.value.replace('GMT', 'UTC').replace('-', '−') : ''; if (off === 'UTC') off = 'UTC+0'; } catch (e) {}
    if (!off) { var m = -new Date().getTimezoneOffset(), hh = Math.floor(Math.abs(m) / 60), mm = Math.abs(m) % 60; off = 'UTC' + (m < 0 ? '−' : '+') + hh + (mm ? ':' + String(mm).padStart(2, '0') : ''); }
    var place = TZC[id] || (id ? id.split('/').pop().replace(/_/g, ' ') : 'tu zona'); return { id: id, place: place, offset: off, label: place + ' (' + off + ')' }; })();
  function tzChip() { var main = document.querySelector('main'); if (!main || document.querySelector('.mn-tz')) return; var c = document.createElement('div'); c.className = 'mn-tz';
    c.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg><span></span>';
    c.querySelector('span').textContent = 'Horarios en tu hora local: ' + window.MAGNA_TZ.label;
    c.style.cssText = 'display:inline-flex;align-items:center;gap:8px;margin:16px 0 0;padding:7px 14px;border:1px solid rgba(255,255,255,.14);border-radius:999px;background:rgba(255,255,255,.04);color:#c9cde0;font:600 13px Archivo,system-ui,sans-serif;position:relative;z-index:2;max-width:100%';
    main.insertBefore(c, main.firstChild); }
  if (['index.html', 'calendario.html', 'apuestas.html', 'mundial.html', 'competiciones.html'].indexOf(here) >= 0) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tzChip); else tzChip(); }
  // enlaces legales al final de todas las páginas
  function legal() { if (document.querySelector('.mn-legal')) return; var f = document.createElement('div'); f.className = 'mn-legal';
    f.innerHTML = '<a href="terminos.html">Términos y condiciones</a><span>·</span><a href="privacidad.html">Privacidad</a><span>·</span><span>Magna Sports no está afiliada a Supercell</span>';
    f.style.cssText = 'display:flex;flex-wrap:wrap;justify-content:center;gap:8px 12px;padding:22px 16px 90px;color:#9aa0b8;font:500 13px Archivo,system-ui,sans-serif;border-top:1px solid rgba(255,255,255,.08);margin-top:30px;position:relative;z-index:1';
    [].forEach.call(f.querySelectorAll('a'), function (a) { a.style.cssText = 'color:#c9cde0;text-decoration:underline;text-underline-offset:3px'; }); document.body.appendChild(f); }
  if (here !== 'admin.html') { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', legal); else legal(); }
  // modo compacto automático cuando las secciones no caben
  var links = hd.querySelector('.mn-links');
  function over() { return links.scrollWidth > links.clientWidth + 1; }
  function fitNav() { hd.classList.remove('compact', 'tight', 'tight2'); if (innerWidth <= 900) return; if (over()) { hd.classList.add('tight'); if (over()) { hd.classList.add('tight2'); if (over()) { hd.classList.remove('tight2'); hd.classList.add('compact'); } } } if (!hd.classList.contains('compact') && ov) close(); }
  fitNav(); addEventListener('resize', fitNav); if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitNav); addEventListener('load', fitNav);
})();
