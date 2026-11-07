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
      '<div class="mn-foot"><a class="mn-adm mn-acc2' + (here === 'cuenta.html' ? ' on' : '') + '" href="cuenta.html">' + svg('user') + '<span class="mn-acct">Mi cuenta · Bits</span></a><a class="mn-adm' + (isAdm ? ' on' : '') + '" href="admin.html">' + svg('lock') + 'Administración</a></div></div>';
    var ma = window.MAGNA_ME && MAGNA_ME.get(), mt = ov.querySelector('.mn-acct'); if (ma && mt) mt.textContent = ma.display_name + ' · ' + String(Number(ma.bits || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' Bits';
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

  // ---------- mini perfil: cuando la persona entró con su usuario y código ----------
  var ME_KEY = 'magna_me', me = null, pop = null;
  try { me = JSON.parse(localStorage.getItem(ME_KEY) || 'null'); } catch (e) {}
  var pcss = '' +
    '.mn-me{display:none;align-items:center;gap:9px;border:1px solid rgba(255,210,63,.45);background:rgba(255,210,63,.06);color:#f1f3fb;border-radius:999px;padding:4px 12px 4px 4px;cursor:pointer;font:600 13px/1 Archivo,sans-serif;white-space:nowrap;transition:border-color .15s,background-color .15s,transform .15s;max-width:240px}' +
    '.mn.has-me .mn-me{display:inline-flex}.mn.has-me .mn-r .mn-acc{display:none!important}' +
    '.mn-me:hover,.mn-me[aria-expanded="true"]{border-color:#ffd23f;background:rgba(255,210,63,.12)}.mn-me:active{transform:scale(.97)}' +
    '.mn-av{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;flex:none;font:900 12px/1 Archivo,sans-serif;color:#0a0d18;background:conic-gradient(var(--tc,#ffd23f) calc(var(--pc,0)*1%),rgba(255,255,255,.14) 0);position:relative}' +
    '.mn-av i{position:absolute;inset:3px;border-radius:50%;background:linear-gradient(135deg,#8b5cf6,#3b4bff);display:grid;place-items:center;color:#fff;font-style:normal}' +
    '.mn-me .nm{overflow:hidden;text-overflow:ellipsis;max-width:110px}.mn-me .bt{display:inline-flex;align-items:center;gap:5px;color:#ffd23f;font:700 12px "JetBrains Mono",monospace}.mn-me .bt:before{content:"";width:9px;height:9px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff3b0,#ffd23f 45%,#d99a00)}' +
    '.mn.tight .mn-me .nm,.mn.tight2 .mn-me .nm{display:none}' +
    '@media(max-width:900px){.mn-me .nm{display:none}.mn-me{padding:3px 10px 3px 3px}}@media(max-width:420px){.mn-me .bt{display:none}.mn-me{padding:3px}}' +
    // tarjeta
    '.mn-pop{position:fixed;z-index:120;top:70px;right:16px;width:min(360px,calc(100vw - 24px));max-height:calc(100vh - 86px);overflow:auto;background:radial-gradient(100% 60% at 50% 0,rgba(139,92,246,.35),transparent 70%),#0f1326;border:1px solid rgba(255,255,255,.12);border-radius:24px;box-shadow:0 24px 70px rgba(0,0,0,.6);color:#f1f3fb;font:400 14px/1.45 Archivo,system-ui,sans-serif;padding:18px;opacity:0;transform:translateY(-8px) scale(.98);transform-origin:top right;transition:opacity .18s,transform .22s cubic-bezier(.2,.9,.2,1)}' +
    '.mn-pop.show{opacity:1;transform:none}.mn-pop-bg{position:fixed;inset:0;z-index:119}' +
    '.mn-pop .mph{display:flex;align-items:center;gap:14px}.mn-pop .mn-av{width:62px;height:62px;font-size:20px}.mn-pop .mn-av i{inset:4px}' +
    '.mn-pop h3{margin:0;font:900 20px/1.1 Archivo,sans-serif;font-stretch:115%;text-transform:uppercase;overflow-wrap:anywhere}.mn-pop .mpu{color:#9aa0b8;font:500 12px "JetBrains Mono",monospace}' +
    '.mn-pop .mptg{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}.mn-pop .mptg span{border:1px solid rgba(255,255,255,.16);border-radius:999px;padding:3px 9px;font-size:11px;font-weight:700}' +
    '.mn-pop .mpbal{margin:16px 0 0;padding:14px 16px;border-radius:18px;background:linear-gradient(135deg,rgba(255,210,63,.16),rgba(255,210,63,.04));border:1px solid rgba(255,210,63,.35);display:flex;align-items:center;justify-content:space-between;gap:10px}' +
    '.mn-pop .mpbal b{font:900 30px/1 Archivo,sans-serif;font-stretch:120%;color:#ffd23f;font-variant-numeric:tabular-nums}.mn-pop .mpbal small{display:block;color:#c9cde0;font:500 10px "JetBrains Mono",monospace;letter-spacing:.14em;text-transform:uppercase;margin-top:4px}.mn-pop .mpbal .mprk{text-align:right}.mn-pop .mpbal .mprk b{font-size:20px;color:#f1f3fb}' +
    '.mn-pop .mpst{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:10px}.mn-pop .mpst div{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:10px 4px;text-align:center}.mn-pop .mpst b{display:block;font:900 18px/1 Archivo,sans-serif}.mn-pop .mpst small{display:block;margin-top:5px;color:#9aa0b8;font:500 9px "JetBrains Mono",monospace;letter-spacing:.1em;text-transform:uppercase}' +
    '.mn-pop .mpmd{margin-top:12px}.mn-pop .mpmd .mpln{display:flex;justify-content:space-between;font-size:12px;color:#9aa0b8;margin-bottom:6px}.mn-pop .mpmd .mpln b{color:#f1f3fb}.mn-pop .mpmd .mpbr{height:8px;border-radius:9px;background:rgba(255,255,255,.08);overflow:hidden}.mn-pop .mpmd .mpbr i{display:block;height:100%;width:0;border-radius:9px;background:linear-gradient(90deg,var(--tc,#8b5cf6),#ffd23f);transition:width .9s cubic-bezier(.2,.9,.2,1)}' +
    '.mn-pop h4{margin:16px 0 6px;color:#9aa0b8;font:500 10px/1 "JetBrains Mono",monospace;letter-spacing:.14em;text-transform:uppercase}' +
    '.mn-pop .mpbet{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 0;border-top:1px solid rgba(255,255,255,.07);font-size:13px}.mn-pop .mpbet:first-of-type{border:0}.mn-pop .mpbet span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mn-pop .mpbet em{font-style:normal;font:700 11px "JetBrains Mono",monospace;flex:none}' +
    '.mn-pop .mpac{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:14px}.mn-pop .mpac a,.mn-pop .mpac button{display:flex;align-items:center;gap:8px;padding:11px 12px;border-radius:14px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);color:#f1f3fb;text-decoration:none;font:700 13px Archivo,sans-serif;cursor:pointer;text-align:left}' +
    '.mn-pop .mpac a:hover,.mn-pop .mpac button:hover{border-color:#8b5cf6}.mn-pop .mpac svg{width:16px;height:16px;flex:none;color:#c9b8ff}.mn-pop .mpac .mpout{grid-column:1/-1;justify-content:center;color:#ff8aa0;border-color:rgba(255,77,109,.3)}.mn-pop .mpac .mpout svg{color:#ff8aa0}' +
    '.mn-pop .mpx{position:absolute;top:12px;right:12px;width:34px;height:34px;border-radius:50%;border:1px solid rgba(255,255,255,.14);background:transparent;color:#f1f3fb;cursor:pointer;display:grid;place-items:center}.mn-pop .mpx svg{width:16px;height:16px}' +
    '@media(max-width:600px){.mn-pop{top:auto;bottom:0;right:0;left:0;width:auto;border-radius:26px 26px 0 0;max-height:85vh;padding-bottom:max(18px,env(safe-area-inset-bottom));transform:translateY(30px);transform-origin:bottom}}' +
    '@media(prefers-reduced-motion:reduce){.mn-pop,.mn-pop .mpmd .mpbr i{transition:none}}';
  var pst = document.createElement('style'); pst.textContent = pcss; document.head.appendChild(pst);
  I.logout = '<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>'; I.bet = '<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9 9.5c0-1 1.3-1.8 3-1.8s3 .8 3 1.8-1.3 1.6-3 2-3 1-3 2 1.3 1.8 3 1.8 3-.8 3-1.8"/>';
  var chip = document.createElement('button'); chip.type = 'button'; chip.className = 'mn-me'; chip.setAttribute('aria-haspopup', 'dialog'); chip.setAttribute('aria-expanded', 'false');
  var mr = hd.querySelector('.mn-r'); mr.insertBefore(chip, hd.querySelector('.mn-acc'));
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function ini(n) { var p = String(n || '?').trim().split(/\s+/); return ((p[0] || '?')[0] + (p[1] ? p[1][0] : (p[0] || '').slice(1, 2))).toUpperCase(); }
  function fmt(n) { return String(Math.round(Number(n || 0))).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function stats() { try { if (!me || !me.player_id || !window.MAGNA) return null; var p = MAGNA.by(MAGNA.S.players, me.player_id); if (!p) return null; var x = MAGNA.playerStats()[p.id] || {}, t = MAGNA.by(MAGNA.S.teams, p.teamId), md = x.media == null ? 10 : x.media; return { p: p, t: t, media: md, tier: MAGNA.tierOf(md), pj: x.pj || 0, w: x.w || 0, l: x.l || 0, g: x.g || 0, mvp: x.mvp || 0, titles: (x.titles || []).length }; } catch (e) { return null; } }
  function avatar(pc, color) { var a = el('span', 'mn-av'), i = el('i', null, ini(me.display_name)); a.appendChild(i); a.style.setProperty('--pc', pc); a.style.setProperty('--tc', color); return a; }
  function drawChip() {
    hd.classList.toggle('has-me', !!me); if (!me) { chip.innerHTML = ''; return; }
    var s = stats(); chip.innerHTML = ''; chip.title = 'Tu perfil'; chip.setAttribute('aria-label', 'Tu perfil: ' + me.display_name + ', ' + fmt(me.bits) + ' Bits');
    chip.appendChild(avatar(s ? s.media : 100, s ? s.tier.color : '#ffd23f')); chip.appendChild(el('span', 'nm', me.display_name)); chip.appendChild(el('span', 'bt', fmt(me.bits))); fitNav();
  }
  function save(a) { me = a ? { display_name: a.display_name, username: a.username, bits: a.bits, player_id: a.player_id, role: a.role } : null; try { if (me) localStorage.setItem(ME_KEY, JSON.stringify(me)); else localStorage.removeItem(ME_KEY); } catch (e) {} drawChip(); }
  function client() { return window.MAGNA_SB ? window.MAGNA_SB() : Promise.reject(new Error('sin conexión')); }
  function refresh() {
    if (!window.MAGNA_SB) return drawChip();
    client().then(function (c) { return c.auth.getSession().then(function (r) { var ses = r.data && r.data.session; if (!ses || ses.user.is_anonymous) return save(null);
      return c.rpc('my_account').then(function (x) { if (x.error) return; save((x.data && x.data[0]) || null); }); }); }).catch(function () { drawChip(); });
  }
  function closePop() { if (!pop) return; var p = pop; pop = null; p.box.classList.remove('show'); p.bg.remove(); chip.setAttribute('aria-expanded', 'false'); setTimeout(function () { p.box.remove(); }, 220); }
  function countUp(node, to) { var from = 0, t0 = null, d = 700; if (matchMedia('(prefers-reduced-motion: reduce)').matches) { node.textContent = fmt(to); return; }
    function f(ts) { if (!t0) t0 = ts; var k = Math.min(1, (ts - t0) / d), e = 1 - Math.pow(1 - k, 3); node.textContent = fmt(Math.round(from + (to - from) * e)); if (k < 1) requestAnimationFrame(f); } requestAnimationFrame(f); }
  function link(href, ic, txt) { var a = el('a'); a.href = href; a.innerHTML = svg(ic); a.appendChild(document.createTextNode(txt)); return a; }
  function openPop() {
    if (!me) return; if (pop) return closePop();
    var s = stats(), bg = el('div', 'mn-pop-bg'), box = el('div', 'mn-pop'); box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Tu perfil');
    var x = el('button', 'mpx'); x.type = 'button'; x.setAttribute('aria-label', 'Cerrar'); x.innerHTML = svg('x'); x.onclick = closePop; box.appendChild(x);
    var top = el('div', 'mph'); top.appendChild(avatar(s ? s.media : 100, s ? s.tier.color : '#ffd23f')); var tt = el('div'); tt.appendChild(el('h3', null, me.display_name)); tt.appendChild(el('div', 'mpu', '@' + me.username));
    var tg = el('div', 'mptg'); tg.appendChild(el('span', null, me.role === 'admin' ? 'Administrador' : 'Miembro'));
    if (s) { var tr = el('span', null, s.tier.name); tr.style.cssText = 'border-color:' + s.tier.color + ';color:' + s.tier.color; tg.appendChild(tr); tg.appendChild(el('span', null, s.t ? s.t.name + (s.p.slot === 'reserve' ? ' · suplente' : '') : 'Agente libre')); }
    tt.appendChild(tg); top.appendChild(tt); box.appendChild(top);
    var bal = el('div', 'mpbal'), l = el('div'), bn = el('b', null, '0'); l.appendChild(bn); l.appendChild(el('small', null, 'Bits disponibles')); bal.appendChild(l);
    var rk = el('div', 'mprk'), rb = el('b', null, '—'); rk.appendChild(rb); rk.appendChild(el('small', null, 'Ranking de Bits')); bal.appendChild(rk); box.appendChild(bal); countUp(bn, me.bits);
    if (s) {
      var md = el('div', 'mpmd'), ln = el('div', 'mpln'); ln.appendChild(el('span', null, 'Media del jugador')); ln.appendChild(el('b', null, s.media + ' / 100')); md.appendChild(ln); var br = el('div', 'mpbr'), bi = el('i'); bi.style.setProperty('--tc', s.tier.color); br.appendChild(bi); md.appendChild(br); box.appendChild(md);
      requestAnimationFrame(function () { requestAnimationFrame(function () { bi.style.width = s.media + '%'; }); });
      var st = el('div', 'mpst'); [[s.pj, 'Partidos'], [s.w + '-' + s.l, 'Récord'], [s.g, 'Goles'], [s.titles, 'Títulos']].forEach(function (v) { var d = el('div'); d.appendChild(el('b', null, String(v[0]))); d.appendChild(el('small', null, v[1])); st.appendChild(d); }); box.appendChild(st);
    }
    box.appendChild(el('h4', null, 'Últimas apuestas')); var bl = el('div'); bl.appendChild(el('div', 'mpbet', 'Cargando…')); box.appendChild(bl);
    var ac = el('div', 'mpac'); ac.appendChild(link('cuenta.html', 'user', 'Mi cuenta')); ac.appendChild(link('apuestas.html', 'bet', 'Apostar')); ac.appendChild(link('ranking.html' + (s ? '#jugadores' : '#bits'), 'rank', 'Ranking'));
    if (s && s.t) ac.appendChild(link('equipos.html', 'shield', 'Mi equipo')); else ac.appendChild(link('mercado.html', 'swap', 'Fichajes'));
    if (me.role === 'admin') { var ad = link('admin.html', 'lock', 'Panel de administración'); ad.style.gridColumn = '1/-1'; ac.appendChild(ad); }
    var out = el('button', 'mpout'); out.type = 'button'; out.innerHTML = svg('logout'); out.appendChild(document.createTextNode('Cerrar sesión'));
    out.onclick = function () { out.disabled = true; client().then(function (c) { return c.auth.signOut(); }).catch(function () {}).then(function () { save(null); closePop(); if (/cuenta\.html|apuestas\.html|admin\.html/.test(here)) location.reload(); }); };
    ac.appendChild(out); box.appendChild(ac);
    bg.onclick = closePop; document.body.appendChild(bg); document.body.appendChild(box); pop = { box: box, bg: bg }; chip.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(function () { box.classList.add('show'); }); x.focus();
    // datos en vivo: puesto en el ranking de Bits y últimas apuestas
    client().then(function (c) {
      c.rpc('bits_ranking').then(function (r) { var rows = r.data || [], i = -1; rows.some(function (y, k) { if ((me.player_id && y.player_id === me.player_id) || (!me.player_id && y.display_name === me.display_name && y.bits === me.bits)) { i = k; return true; } }); rb.textContent = i >= 0 ? '#' + (i + 1) : me.role === 'admin' ? 'Admin' : '—'; }, function () {});
      c.from('bets').select('*').order('created_at', { ascending: false }).limit(3).then(function (r) { bl.innerHTML = ''; var rows = (r && r.data) || [];
        if (!rows.length) { bl.appendChild(el('div', 'mpbet', 'Todavía no has apostado.')); return; }
        rows.forEach(function (b) { var m = window.MAGNA && MAGNA.by(MAGNA.S.matches, b.match_id), who = m ? MAGNA.teamName(b.side === 'home' || b.side === 'h' ? m.home : m.away) : 'Partido', row = el('div', 'mpbet');
          row.appendChild(el('span', null, fmt(b.stake) + ' a ' + who + (m ? ' · ' + MAGNA.teamName(m.home) + ' vs ' + MAGNA.teamName(m.away) : '')));
          var ST = { open: ['En juego', '#9aa0b8'], won: ['+' + fmt(b.payout), '#2ee59d'], lost: ['Perdida', '#ff4d6d'], cash: ['Retirada ' + fmt(b.payout), '#ffd23f'], refund: ['Devuelta', '#9aa0b8'] }[b.status] || [b.status, '#9aa0b8'];
          var em = el('em', null, ST[0]); em.style.color = ST[1]; row.appendChild(em); bl.appendChild(row); }); }, function () { bl.innerHTML = ''; bl.appendChild(el('div', 'mpbet', 'No se pudieron cargar.')); });
    }, function () {});
  }
  chip.addEventListener('click', openPop);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && pop) { closePop(); chip.focus(); } });
  window.MAGNA_ME = { refresh: refresh, get: function () { return me; } };
  drawChip();
  function boot() { drawChip(); setTimeout(refresh, 50); }
  if (document.readyState === 'complete') boot(); else addEventListener('load', boot);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) refresh(); });
  setInterval(function () { if (!document.hidden) refresh(); }, 60000);
})();
