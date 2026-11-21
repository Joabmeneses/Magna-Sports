'use strict';
// Modo ligero automático: si el equipo no logra mover las animaciones (menos de ~40 fps),
// se apagan los brillos que más cuestan (pulsos de sombra, orbes de Bits) solo en esa pestaña.
(function () {
  var H = document.documentElement, K = 'magna_lite';
  try { if (sessionStorage.getItem(K) === '1') H.classList.add('lite'); } catch (e) {}
  // equipos de gama baja (poca memoria, pocos núcleos en Android o ahorro de datos): modo ligero desde el inicio
  try { var nv = navigator, cn = nv.connection || {}, mem = nv.deviceMemory || 8, cores = nv.hardwareConcurrency || 8;
    if (cn.saveData || mem <= 2 || (/Android/i.test(nv.userAgent) && mem <= 4 && cores <= 4)) H.classList.add('lite'); } catch (e) {}
  var st = document.createElement('style'); st.id = 'magna-lite-css';
  st.textContent = 'html.lite .bit-ic:before,html.lite .bit-ic img{animation:none!important}html.lite .bit-ic:after{display:none!important}html.lite .bit-ic img{filter:none!important}' +
    'html.lite .frm{animation:none!important}html.lite .frm>.fxm .bu,html.lite .frm>.fxm .b2{display:none!important}' +
    'html.lite .ts-spc:before{animation:none!important}' +
    // modo ligero: nombres y placas sin sombras que se recalculan; la lava y los destellos quedan quietos
    'html.lite .c-dragoneterno .mpn-n{filter:none!important}html.lite .mpn[class*="c-"]:after{display:none!important}' +
    'html.lite .pbn-my .pbp,html.lite .pbn-my .pbs{display:none!important}';
  (document.head || H).appendChild(st);
  if (H.classList.contains('lite') || !window.requestAnimationFrame || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  setTimeout(function () {
    if (document.hidden) return; var n = 0, t0 = 0, bad = false;
    function vis() { bad = true; } document.addEventListener('visibilitychange', vis);
    function f(t) { if (!t0) t0 = t; n++; if (t - t0 < 2000) return requestAnimationFrame(f);
      document.removeEventListener('visibilitychange', vis); if (bad || document.hidden) return;
      if (n / ((t - t0) / 1000) < 40) { H.classList.add('lite'); try { sessionStorage.setItem(K, '1'); } catch (e) {} } }
    requestAnimationFrame(f);
  }, 3500);
})();
// Menú de navegación único para todo Magna Arena (reemplaza la cabecera de cada página).
(function () {
  var old = document.querySelector('body > header'); if (!old || old.dataset.mn) return;
  var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase(); if (here === '' || here === '/') here = 'index.html'; if (here === 'equipo.html') here = 'equipos.html';
  var I = {
    play: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5l5 3.5-5 3.5z"/>', list: '<path d="M4 6h16M4 12h16M4 18h10"/>', cup: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4z"/><path d="M17 5h3v2a3 3 0 01-3 3M7 5H4v2a3 3 0 003 3"/>',
    rank: '<path d="M4 20V13h4v7M10 20V8h4v12M16 20v-9h4v9M3 20h18"/>', globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/>', star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    coin: '<circle cx="12" cy="12" r="9"/><path d="M9 9h4.5a1.5 1.5 0 010 3H10a1.5 1.5 0 000 3H15M12 7v2M12 15v2"/>', cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/>', swap: '<path d="M7 7h12l-3-3M17 17H5l3 3"/>', lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
    news: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>', search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>', chev: '<path d="M6 9l6 6 6-6"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>'
  };
  var L = [
    ['index.html', 'Partidos', 'play', 'Partidos', 'Partido destacado y resultados'], ['calendario.html', 'Calendario', 'cal', 'Partidos', 'Agenda de partidos'],
    ['ligas.html', 'Ligas', 'list', 'Competiciones', 'Tablas de cada liga'], ['competiciones.html', 'Torneos', 'cup', 'Competiciones', 'Torneos, cruces e historial'],
    ['mundial.html', 'Mundial', 'globe', 'Competiciones', 'Grupos y eliminatoria'], ['champions.html', 'Champions', 'star', 'Competiciones', 'Liga, play-off y cuadro'],
    ['eventos.html', 'Eventos', 'star', 'Eventos', 'Agenda, Balón de Oro y planes'], ['balon.html', 'Balón de Oro', 'star', 'Eventos', 'Palmarés y votación', 'm'], ['sorteo.html', 'Sorteo', 'star', 'Eventos', 'Inscríbete y gana un marco legendario'], ['prediccion.html', 'Predicción', 'star', 'Eventos', 'Elige campeón y cruces, gana Bits', 'm'], ['noticias.html', 'Noticias', 'news', 'Comunidad', 'Lo último de la comunidad'], ['equipos.html', 'Equipos', 'shield', 'Comunidad', 'Plantillas, fotos y trofeos'], ['mercado.html', 'Fichajes', 'swap', 'Comunidad', 'Medias, goleadores y mercado'], ['jugador.html', 'Jugadores', 'user', 'Comunidad', 'Perfiles, insignias e inventario', 'm'], ['ranking.html', 'Ranking', 'rank', 'Comunidad', 'Equipos, jugadores y Bits'], ['tienda.html', 'Tienda', 'star', 'Comunidad', 'Cosméticos con Bits', 'm'], ['apuestas.html', 'Apuestas', 'coin', 'Comunidad', 'Pronósticos en vivo']
  ];
  // avatares de Magna para la foto de perfil (avatars/a01.webp … a31.webp)
  window.MAGNA_AVATARS = ['Vaquero', 'Navidad', 'Rey en el trono', 'Halloween', 'Playa', 'Gamer', 'Ninja', 'Astronauta', 'Detective', 'Pirata', 'Morado eléctrico', 'Rojo fuego', 'Blanco y negro', 'Dorado', 'Azul', 'Verde gamer', 'Gafas pixel', 'Orbe mágico', 'Dorado con abrigo', 'Neón', 'Noche de luna', 'Relajado', 'Trono dorado', 'Gamer rojo', 'Paz y gafas', 'Brazos cruzados', 'Chicle', 'Ángel', 'Lava', 'Tóxico', 'Corona de luz'];
  window.MAGNA_AVATAR_URL = function (id) { return /^a\d\d$/.test(id || '') ? 'avatars/' + id + '.webp' : null; };
  function svg(k) { return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + I[k] + '</svg>'; }
  var css = '' +
    '.mn{position:sticky;top:0;z-index:60;background:rgba(10,13,24,.97);border-bottom:1px solid rgba(255,255,255,.08);font-family:Archivo,system-ui,sans-serif;color:#f1f3fb;padding:0!important;margin:0!important}' +
    '.mn *{box-sizing:border-box}.mn-in{max-width:1240px;margin:0 auto;padding:0 20px;height:66px;display:flex;align-items:center;gap:22px}' +
    '.mn-logo{display:flex;align-items:center;gap:10px;color:#f1f3fb;text-decoration:none;font:900 23px/1 Archivo,sans-serif;font-stretch:125%;text-transform:uppercase;letter-spacing:-.01em;white-space:nowrap;flex:none}' +
    '.mn-logo img{height:38px;width:auto;display:block;filter:drop-shadow(0 0 10px rgba(255,140,0,.35))}' +
    '.mn-links{display:flex;align-items:center;justify-content:center;gap:2px;flex:1;min-width:0;overflow:hidden}' +
    '.mn-links a{position:relative;color:#c9cde0;text-decoration:none;font:500 12px/1 "JetBrains Mono",ui-monospace,monospace;letter-spacing:.1em;text-transform:uppercase;padding:10px 9px;border-radius:10px;white-space:nowrap;transition:color .15s,background-color .15s}' +
    '.mn-links a:hover{color:#fff;background:rgba(255,255,255,.06)}.mn-links a.on{color:#ff5a36}.mn-links a.on:after{content:"";position:absolute;left:9px;right:9px;bottom:-12px;height:2px;border-radius:2px;background:#ff5a36}' +
    '.mn-r{display:flex;align-items:center;gap:10px;flex:none;margin-left:auto}' +
    '.mn-dd{position:relative;display:inline-flex;align-items:center;gap:6px;background:none;border:0;color:#c9cde0;font:500 12px/1 "JetBrains Mono",ui-monospace,monospace;letter-spacing:.1em;text-transform:uppercase;padding:10px 9px;border-radius:10px;white-space:nowrap;cursor:pointer;transition:color .15s,background-color .15s}' +
    '.mn-dd svg{width:14px;height:14px;transition:transform .2s}.mn-dd[aria-expanded="true"] svg{transform:rotate(180deg)}.mn-dd:hover,.mn-dd[aria-expanded="true"]{color:#fff;background:rgba(255,255,255,.06)}.mn-dd.on{color:#ff5a36}.mn-dd.on:after{content:"";position:absolute;left:9px;right:9px;bottom:-12px;height:2px;border-radius:2px;background:#ff5a36}' +
    '.mn.tight .mn-dd{padding:10px 6px;letter-spacing:.06em}.mn.tight2 .mn-dd{padding:10px 4px;letter-spacing:.02em;font-size:11px}' +
    '.mn-pan{position:absolute;top:calc(100% + 8px);z-index:70;width:min(560px,calc(100vw - 24px));background:radial-gradient(90% 70% at 0 0,rgba(139,92,246,.3),transparent 70%),radial-gradient(70% 70% at 100% 100%,rgba(255,90,54,.18),transparent 70%),#12163a;border:1px solid rgba(255,255,255,.14);border-radius:22px;padding:12px;box-shadow:0 24px 60px rgba(0,0,0,.55);opacity:0;transform:translateY(-6px);transition:opacity .18s,transform .18s;pointer-events:none}' +
    '.mn-pan.show{opacity:1;transform:none;pointer-events:auto}.mn-pan[hidden]{display:none}' +
    '.mn-pg{display:grid;grid-template-columns:1fr 1fr;gap:8px}' +
    '.mn-pc{display:flex;gap:12px;align-items:center;padding:12px;border-radius:16px;text-decoration:none;color:#f1f3fb;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);transition:border-color .15s,background-color .15s}.mn-pc:hover,.mn-pc:focus-visible{border-color:var(--c);background:color-mix(in srgb,var(--c) 16%,transparent);outline:none}.mn-pc.on{border-color:var(--c)}' +
    '.mn-pc .ic{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:color-mix(in srgb,var(--c) 26%,transparent);color:var(--c);flex:none}.mn-pc .ic svg{width:20px;height:20px}.mn-pc b{display:block;font:800 15px/1.2 Archivo,sans-serif}.mn-pc small{display:block;color:#9aa0b8;font-size:12px;margin-top:2px}' +
    '.mn-pa{margin-top:10px;padding:10px 4px 2px;border-top:1px solid rgba(255,255,255,.1)}.mn-pa>span{display:block;color:#9aa0b8;font:500 10px/1 "JetBrains Mono",monospace;letter-spacing:.14em;text-transform:uppercase;margin:0 6px 8px}' +
    '.mn-pa div{display:flex;flex-wrap:wrap;gap:6px}.mn-pa a{display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border-radius:999px;background:rgba(255,255,255,.07);color:#f1f3fb;text-decoration:none;font:600 13px Archivo,sans-serif}.mn-pa a:hover{background:rgba(255,255,255,.14)}.mn-pa a i{width:8px;height:8px;border-radius:50%;background:#2ee59d}' +
    '.mn-adm{display:inline-flex;align-items:center;gap:8px;border:1px solid #ff5a36;color:#ff5a36;border-radius:999px;padding:10px 16px;text-decoration:none;font:500 11px/1 "JetBrains Mono",monospace;letter-spacing:.12em;text-transform:uppercase;white-space:nowrap;transition:background-color .15s,color .15s}' +
    '.mn-acc{display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(255,255,255,.18);color:#f1f3fb;border-radius:999px;padding:10px 16px;text-decoration:none;font:600 13px/1 Archivo,sans-serif;white-space:nowrap;transition:border-color .15s,background-color .15s}.mn-acc svg{width:16px;height:16px}.mn-acc:hover,.mn-acc.on{border-color:#ffd23f;color:#ffd23f}' +
    '.mn-foot{display:grid;gap:8px}.mn-foot .mn-acc2{border-color:#ffd23f;color:#ffd23f}' +
    '.mn-adm svg{width:14px;height:14px}.mn-adm:hover,.mn-adm.on{background:#ff5a36;color:#fff}' +
    '.mn-btn{display:none;align-items:center;gap:8px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:#f1f3fb;border-radius:999px;padding:9px 14px;font:700 14px Archivo,sans-serif;cursor:pointer}.mn-btn svg{width:20px;height:20px}' +
    '.mn-ex{display:flex;align-items:center;gap:8px}' +
    '.mn.tight .mn-links a{padding:10px 6px;letter-spacing:.06em}.mn.tight .mn-in{gap:14px}.mn.tight .mn-r .mn-adm span,.mn.tight .mn-r .mn-acc span{display:none}.mn.tight .mn-r .mn-adm,.mn.tight .mn-r .mn-acc{padding:10px 12px}' +
    '.mn.tight2 .mn-links a{padding:10px 4px;letter-spacing:.02em;font-size:11px}.mn.tight2 .mn-in{gap:10px}.mn.tight2 .mn-wm{display:none}' +
    '.mn.compact .mn-links,.mn.compact .mn-r .mn-adm,.mn.compact .mn-r .mn-acc{display:none}.mn.compact .mn-btn{display:inline-flex}.mn.compact .mn-in{height:60px;gap:12px}' +
    '@media(max-width:900px){.mn-links,.mn-r .mn-adm,.mn-r .mn-acc,.mn-r .mn-shop{display:none}.mn-btn{display:inline-flex}.mn-in{height:60px;gap:12px}}' +
    '@media(max-width:480px){.mn.has-ex .mn-wm{display:none}.mn-ex .coins{padding:8px 12px!important}}' +
    '@media(max-width:380px){.mn-ex .coins{padding:7px 10px!important;font-size:10px!important;letter-spacing:.06em!important}.mn-in{gap:8px}}' +
    '.mn.m-nobits .mn-me .bt{display:none}.mn.m-nobits .mn-me{padding:3px}.mn.m-nowm .mn-wm{display:none}@media(max-width:900px){.mn-in>*{min-width:0}.mn-r{flex:none}}' +
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
    '@media(max-width:520px){.mn-grid{grid-template-columns:1fr 1fr}.mn-it{padding:10px;gap:10px}.mn-it .ic{width:34px;height:34px}.mn-it small{display:none}.mn-it b{font-size:15px}}' +
    '@media(prefers-reduced-motion:reduce){.mn-ov,.mn-sh{transition:none}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  // Ícono de Bits (orbe de lava) con aura, giro lento, chispa en órbita y estallido
  var bcss = '.bit-ic{--bs:1.3em;position:relative;display:inline-grid;place-items:center;width:var(--bs);height:var(--bs);flex:none;vertical-align:-.28em;isolation:isolate;line-height:0}' +
    '.bit-ic:before{content:"";position:absolute;inset:-34%;border-radius:50%;z-index:-1;background:radial-gradient(circle,rgba(255,140,30,.6),rgba(168,85,247,.38) 42%,transparent 68%);animation:bitAura 2.6s ease-in-out infinite;pointer-events:none}' +
    '.bit-ic img{width:100%;height:100%;display:block;animation:bitSpin 16s linear infinite;filter:drop-shadow(0 0 3px rgba(255,120,30,.7));pointer-events:none}' +
    '.bit-ic:after{content:"";position:absolute;left:43%;top:43%;width:14%;height:14%;min-width:3px;min-height:3px;border-radius:50%;background:#ffe08a;box-shadow:0 0 6px 1px #ff8a00,0 0 10px #a855f7;animation:bitOrb 3.4s linear infinite;pointer-events:none}' +
    '.bit-ic:hover img,a:hover>.bit-ic img,button:hover>.bit-ic img,.bit-ic.pop img{animation-duration:1.4s}' +
    '.bit-ic.sm:before{animation:none;opacity:.75}.bit-ic.sm:after{display:none}.bit-ic.sm img{animation:none;filter:none}.bit-ic.sm:hover img,a:hover>.bit-ic.sm img,button:hover>.bit-ic.sm img,.bit-ic.sm.pop img{animation:bitSpin 1.4s linear infinite}' +
    '.bit-ic.pop{animation:bitPop .7s cubic-bezier(.3,1.6,.5,1)}' +
    '@keyframes bitSpin{to{transform:rotate(360deg)}}' +
    '@keyframes bitAura{0%,100%{opacity:.55;transform:scale(.9)}50%{opacity:1;transform:scale(1.12)}}' +
    '@keyframes bitOrb{from{transform:rotate(0) translateX(calc(var(--bs) * .62)) scale(.7)}50%{opacity:.4}to{transform:rotate(360deg) translateX(calc(var(--bs) * .62)) scale(.7)}}' +
    '@keyframes bitPop{0%{transform:scale(1)}35%{transform:scale(1.5) rotate(-14deg)}65%{transform:scale(.9) rotate(6deg)}100%{transform:scale(1)}}' +
    '.bit-sp{position:fixed;z-index:9999;width:7px;height:7px;border-radius:50%;pointer-events:none;animation:bitSp .8s cubic-bezier(.2,.7,.3,1) forwards}' +
    '@keyframes bitSp{0%{transform:translate(0,0) scale(1);opacity:1}100%{transform:translate(var(--dx),var(--dy)) scale(.2);opacity:0}}' +
    '@media(prefers-reduced-motion:reduce){.bit-ic:before,.bit-ic:after,.bit-ic img,.bit-ic.pop{animation:none}.bit-sp{display:none}}';
  // ===== piel «cómic» del menú (papel crema, borde negro y sombra dura) =====
  var sk = document.createElement('style'); sk.textContent = '' +
    '.mn{background:rgba(13,13,16,.94)!important;border-bottom:0!important;box-shadow:0 10px 30px -18px #000;transition:transform .3s cubic-bezier(.2,.8,.2,1)}' +
    '.mn:after{content:"";position:absolute;left:0;right:0;bottom:-4px;height:4px;background:linear-gradient(90deg,#c6ff1a,#ff6a00 35%,#ff4fa3 65%,#22b8ff);pointer-events:none}' +
    '.mn.tight .mn-links a,.mn.tight .mn-dd{padding:8px 6px}.mn.tight2 .mn-links a,.mn.tight2 .mn-dd{padding:8px 4px;font-size:11px!important}.mn.mn-hide{transform:translateY(-110%)}.mn-in{transition:height .25s}.mn.mn-sm .mn-in{height:54px}.mn.mn-sm .mn-logo img{height:32px}' +
    '.mn-logo{text-shadow:2px 2px 0 #ff6a00}.mn-logo img{transition:transform .3s cubic-bezier(.3,1.6,.5,1),height .25s}.mn-logo:hover img{transform:rotate(-10deg) scale(1.1)}' +
    '.mn-links{gap:1px;overflow:visible}' +
    '.mn-links a,.mn-dd{font:800 12px/1 Archivo,sans-serif!important;letter-spacing:.02em!important;color:#d8d4c6;padding:8px 8px;border:2.5px solid transparent;border-radius:8px;transition:transform .15s,color .15s,background-color .15s}' +
    '.mn-links a:before,.mn-dd:before{content:"";position:absolute;left:10px;right:10px;bottom:4px;height:3px;border-radius:2px;background:#c6ff1a;transform:scaleX(0);transform-origin:0 50%;transition:transform .2s}' +
    '.mn-links a:hover,.mn-dd:hover,.mn-dd[aria-expanded="true"]{color:#fff;background:transparent;transform:translateY(-1px)}.mn-links a:hover:before,.mn-dd:hover:before,.mn-dd[aria-expanded="true"]:before{transform:scaleX(1)}' +
    '.mn-links a.on,.mn-dd.on{color:#0d0d10!important;background:#f1ead8;border-color:#0d0d10;box-shadow:3px 3px 0 #ff6a00;transform:rotate(-2deg)}.mn-links a.on:before,.mn-dd.on:before,.mn-links a.on:after,.mn-dd.on:after{display:none}' +
    '.mn-links a.lv:after{content:"";display:block;position:absolute;right:1px;top:3px;left:auto;bottom:auto;width:8px;height:8px;border-radius:50%;background:#ff3b47;animation:mnLv 1.4s infinite}' +
    '.mn-btn.lv{position:relative;animation:none!important}.mn-btn.lv:after{content:"";position:absolute;right:-2px;top:-2px;width:11px;height:11px;border-radius:50%;background:#ff3b47;border:2px solid #0d0d10;animation:mnLv 1.4s infinite}' +
    '@keyframes mnLv{50%{transform:scale(1.3);opacity:.55}}' +
    '.mn-shop,.mn-acc,.mn-me,.mn-bell,.mn-btn{background:#fff!important;color:#0d0d10!important;border:2.5px solid #0d0d10!important;box-shadow:3px 3px 0 #ff6a00;transition:transform .12s,box-shadow .12s,background-color .15s!important}' +
    '.mn-shop:hover,.mn-acc:hover,.mn-me:hover,.mn-bell:hover,.mn-btn:hover,.mn-shop.on,.mn-acc.on{background:#c6ff1a!important;transform:translate(-1px,-2px);box-shadow:4px 5px 0 #ff6a00}' +
    '.mn-shop:active,.mn-acc:active,.mn-me:active,.mn-btn:active{transform:translate(2px,2px);box-shadow:1px 1px 0 #ff6a00}' +
    '.mn-me *{color:#0d0d10}.mn-r .mn-adm{background:#ff3b47;color:#fff;border:2.5px solid #0d0d10;box-shadow:3px 3px 0 #0d0d10,3px 3px 0 1px #fff}.mn-r .mn-adm:hover,.mn-r .mn-adm.on{background:#ff5a66;transform:translateY(-2px)}' +
    '.mn-tz{border:2px solid #2c2c35!important;background:#17171c!important;color:#d8d4c6!important}' +
    /* desplegable de competiciones */
    '.mn-pan{background:#f1ead8!important;background-image:radial-gradient(rgba(0,0,0,.07) 1px,transparent 1.3px)!important;background-size:7px 7px!important;border:3px solid #0d0d10!important;border-radius:12px!important;box-shadow:8px 8px 0 #ff6a00,8px 8px 0 3px #0d0d10!important;color:#0d0d10;transform:translateY(-8px) rotate(-1deg)}' +
    '.mn-pan.show{transform:none}' +
    '.mn-pc{background:#fff!important;border:2.5px solid #0d0d10!important;border-radius:10px!important;color:#0d0d10!important;box-shadow:3px 3px 0 var(--c);transition:transform .15s,box-shadow .15s}' +
    '.mn-pc:hover,.mn-pc:focus-visible{transform:translate(-2px,-2px) rotate(-1deg);box-shadow:5px 5px 0 var(--c)}.mn-pc.on{background:#efffc7!important}' +
    '.mn-pc .ic{background:var(--c)!important;color:#0d0d10!important;border:2px solid #0d0d10;border-radius:50%!important;transition:transform .3s cubic-bezier(.3,1.6,.5,1)}.mn-pc:hover .ic{transform:rotate(-14deg) scale(1.1)}' +
    '.mn-pc b{text-transform:uppercase;font-stretch:112%}.mn-pc small{color:#5b574c!important;font-weight:600}' +
    '.mn-pa{border-top:2px dashed #0d0d10!important}.mn-pa>span{color:#0d0d10!important;font-weight:800!important}' +
    '.mn-pa a{background:#0d0d10!important;color:#f1ead8!important;border-radius:999px;transition:transform .15s}.mn-pa a:hover{transform:translateY(-2px);color:#c6ff1a!important}.mn-pa a i{background:#c6ff1a!important}' +
    /* menú del celular */
    '.mn-ov{background:rgba(5,5,8,.7)}' +
    '.mn-sh{background:#f1ead8!important;background-image:radial-gradient(rgba(0,0,0,.07) 1px,transparent 1.3px),radial-gradient(60% 40% at 100% 0,rgba(198,255,26,.4),transparent 70%),radial-gradient(50% 40% at 0 100%,rgba(255,79,163,.2),transparent 70%)!important;background-size:7px 7px,auto,auto!important;color:#0d0d10!important;border:0!important;border-bottom:4px solid #0d0d10!important;padding-bottom:22px!important;box-shadow:0 20px 40px rgba(0,0,0,.5)}' +
    '.mn-sh .mn-hd{position:sticky;top:-16px;z-index:3;margin:-16px -16px 10px!important;padding:12px 16px;height:auto!important;background:#0d0d10;border-bottom:4px solid #c6ff1a}' +
    '.mn-sh .mn-logo{color:#fff}.mn-x{background:#ff3b47!important;color:#fff!important;border:2.5px solid #fff!important;transition:transform .2s}.mn-x:hover{transform:rotate(90deg)}' +
    '.mn-live a{display:flex;align-items:center;gap:8px;margin:4px 0 12px;padding:11px 14px;background:#ff3b47;color:#fff;text-decoration:none;border:2.5px solid #0d0d10;border-radius:10px;box-shadow:4px 4px 0 #0d0d10;font:800 13px Archivo,sans-serif;transform:rotate(-1deg)}' +
    '.mn-live i{width:9px;height:9px;border-radius:50%;background:#fff;animation:mnBl 1s infinite}@keyframes mnBl{50%{opacity:.2}}.mn-live b{font-style:italic;font-weight:900;letter-spacing:.06em}.mn-live span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mn-live em{font-style:normal;padding:3px 8px;background:#0d0d10;border-radius:999px}' +
    '.mn-q{display:flex;align-items:center;gap:8px;margin:0 0 6px;padding:0 12px;height:46px;background:#fff;border:2.5px solid #0d0d10;border-radius:12px;box-shadow:3px 3px 0 #0d0d10}.mn-q svg{width:18px;height:18px;flex:none}' +
    '.mn-q input{flex:1;min-width:0;border:0;outline:0;background:transparent;color:#0d0d10;font:700 15px Archivo,sans-serif}.mn-q:focus-within{box-shadow:3px 3px 0 #ff6a00}' +
    '.mn-none{margin:14px 0;font:700 14px Archivo,sans-serif;color:#5b574c;text-align:center}' +
    '.mn-gs[hidden]{display:none}.mn-sh .mn-g{display:inline-block;margin:16px 0 10px!important;padding:5px 10px;background:#0d0d10;color:var(--c)!important;font:900 11px Archivo,sans-serif!important;letter-spacing:.12em!important;transform:rotate(-2deg);box-shadow:3px 3px 0 var(--c)}' +
    '.mn-sh .mn-it{background:#fff!important;border:2.5px solid #0d0d10!important;border-radius:10px!important;color:#0d0d10!important;box-shadow:3px 3px 0 var(--c);opacity:0;transform:translateY(12px);transition:transform .15s,box-shadow .15s}' +
    '.mn-ov.show .mn-it{animation:mnIn .4s cubic-bezier(.2,1.4,.4,1) var(--d,0ms) forwards}@keyframes mnIn{to{opacity:1;transform:none}}' +
    '.mn-sh .mn-it:hover,.mn-sh .mn-it:focus-visible{transform:translate(-2px,-2px)!important;box-shadow:5px 5px 0 var(--c)}.mn-sh .mn-it:active{transform:translate(2px,2px)!important;box-shadow:1px 1px 0 var(--c)}' +
    '.mn-sh .mn-it[hidden]{display:none}' +
    '.mn-sh .mn-it .ic{background:var(--c)!important;color:#fff!important;border:2px solid #0d0d10;border-radius:50%!important}.mn-sh .mn-it b{font-weight:900;text-transform:uppercase;font-stretch:108%}.mn-sh .mn-it small{color:#5b574c!important}' +
    '.mn-sh .mn-it.on{background:#c6ff1a!important;box-shadow:3px 3px 0 #0d0d10;transform:rotate(-1deg)}.mn-sh .mn-it.on .ic{background:#0d0d10!important;color:#c6ff1a!important}' +
    '.mn-sh .mn-foot{margin-top:18px}.mn-sh .mn-foot .mn-adm{justify-content:center;background:#0d0d10!important;color:#c6ff1a!important;border:2.5px solid #0d0d10!important;border-radius:12px;padding:13px;font:900 13px Archivo,sans-serif!important;box-shadow:3px 3px 0 #ff6a00}' +
    '.mn-sh .mn-foot .mn-adm:not(.mn-acc2){background:#ff3b47!important;color:#fff!important;box-shadow:3px 3px 0 #0d0d10}' +
    '.mn-sh .pwa-sw{background:#fff!important;border:2.5px solid #0d0d10!important;color:#0d0d10!important;border-radius:12px!important}.mn-sh .pwa-sw small{color:#5b574c!important}' +
    '.mn-sh .mn-app{background:#22b8ff!important;color:#fff!important;border:2.5px solid #0d0d10!important;border-radius:12px!important;box-shadow:3px 3px 0 #0d0d10}' +
    '@media(prefers-reduced-motion:reduce){.mn,.mn-sh .mn-it{transition:none}.mn-ov.show .mn-it{animation:none;opacity:1;transform:none}.mn-links a.lv:after,.mn-btn.lv:after{animation:none}}';
  document.head.appendChild(sk);
  var bst = document.createElement('style'); bst.textContent = bcss; document.head.appendChild(bst);
  window.MAGNA_BIT = function (size) { var s = document.createElement('span'); s.className = 'bit-ic' + (typeof size === 'number' && size >= 24 ? '' : ' sm'); if (size) s.style.setProperty('--bs', typeof size === 'number' ? size + 'px' : size); var i = document.createElement('img'); i.src = 'bits.webp'; i.alt = ''; i.width = i.height = 160; i.decoding = 'async'; s.appendChild(i); s.setAttribute('aria-hidden', 'true'); return s; };
  window.MAGNA_BIT.burst = function (el, n) { if (!el || !el.getBoundingClientRect) return; var ic = el.classList && el.classList.contains('bit-ic') ? el : el.querySelector && el.querySelector('.bit-ic'); if (ic) { ic.classList.remove('pop'); void ic.offsetWidth; ic.classList.add('pop'); } var r = (ic || el).getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, C = ['#ffd23f', '#ff8a00', '#ff4d1a', '#a855f7', '#fff3b0'];
    for (var k = 0; k < (n || 14); k++) { var p = document.createElement('i'), a = Math.random() * Math.PI * 2, d = 26 + Math.random() * 46; p.className = 'bit-sp'; p.style.left = (cx - 3) + 'px'; p.style.top = (cy - 3) + 'px'; p.style.background = C[k % C.length]; p.style.boxShadow = '0 0 8px ' + C[k % C.length]; p.style.setProperty('--dx', Math.cos(a) * d + 'px'); p.style.setProperty('--dy', Math.sin(a) * d + 'px'); p.style.animationDelay = (Math.random() * 120) + 'ms'; document.body.appendChild(p); setTimeout(p.remove.bind(p), 1100); } };
  if (!document.querySelector('link[rel~="icon"]')) { var fi = document.createElement('link'); fi.rel = 'icon'; fi.type = 'image/png'; fi.href = 'favicon.png'; document.head.appendChild(fi); var ap = document.createElement('link'); ap.rel = 'apple-touch-icon'; ap.href = 'favicon.png'; document.head.appendChild(ap); }
  (function () { var st = document.createElement('style'); st.textContent =
    '.mn-gs.mn-ag{display:block!important;padding:0!important;border:0!important;background:none!important;box-shadow:none!important;border-radius:0!important;margin-top:12px;animation:mnAi .35s var(--d,0ms) cubic-bezier(.2,1.2,.4,1) both}@keyframes mnAi{from{opacity:0;transform:translateY(10px)}}' +
    '.mn-gb{width:100%;display:flex;align-items:center;gap:12px;padding:14px 16px;border:3px solid #0d0d10;background:#fff;color:#0d0d10;border-left:10px solid var(--c);box-shadow:4px 4px 0 var(--c);cursor:pointer;text-align:left;font:inherit;transition:transform .15s}' +
    '.mn-gb:active{transform:translate(2px,2px);box-shadow:2px 2px 0 var(--c)}.mn-gt{flex:1;min-width:0}.mn-gt b{display:block;font:900 20px/1.1 Archivo,sans-serif;text-transform:uppercase;letter-spacing:.01em}.mn-gt small{display:block;margin-top:3px;font-size:12px;color:#5b5868}' +
    '.mn-gb em{font-style:normal;flex:none;min-width:28px;height:28px;display:grid;place-items:center;border-radius:50%;background:var(--c);color:#0d0d10;font:900 13px Archivo,sans-serif}.mn-gb svg{width:20px;height:20px;flex:none;transition:transform .25s}' +
    '.mn-ag.open .mn-gb{background:var(--c);color:#0d0d10}.mn-ag.open .mn-gb small{color:#0d0d10;opacity:.75}.mn-ag.open .mn-gb em{background:#0d0d10;color:var(--c)}.mn-ag.open .mn-gb svg{transform:rotate(180deg)}' +
    '.mn-ag>.mn-grid{display:none;margin-top:10px}.mn-ag.open>.mn-grid,.mn-qing .mn-ag>.mn-grid{display:grid}.mn-ag.open>.mn-grid{animation:mnAi .3s cubic-bezier(.2,1.2,.4,1) both}';
    document.head.appendChild(st); })();
  var hd = document.createElement('header'); hd.className = 'mn'; hd.dataset.mn = '1';
  var ex = old.querySelector('.coins'); // saldo de Apuestas
  var isAdm = here === 'admin.html', GORD = ['Partidos', 'Competiciones', 'Eventos', 'Comunidad'], GOF = {}; L.forEach(function (x) { GOF[x[0]] = x[3]; }); var hereG = GOF[here] || (here === 'jugador.html' || here === 'equipo.html' ? 'Comunidad' : '');
  hd.innerHTML = '<div class="mn-in"><a class="mn-logo" href="index.html" aria-label="Magna Arena, inicio"><img src="logo-nav.webp" alt="" width="34" height="38"><span class="mn-wm">Magna Arena</span></a>' +
    '<div class="mn-links" role="navigation" aria-label="Secciones">' + GORD.map(function (g, i) { return '<button type="button" class="mn-dd' + (g === hereG ? ' on' : '') + '" data-g="' + g + '" aria-expanded="false" aria-haspopup="true" aria-controls="mn-pan' + i + '">' + g + svg('chev') + '</button>'; }).join('') + '</div>' +
    '<div class="mn-r"><div class="mn-ex"></div><a class="mn-shop' + (here === 'tienda.html' ? ' on' : '') + '" href="tienda.html" title="Tienda de cosméticos" aria-label="Tienda"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l-1.2 11.2a2 2 0 01-2 1.8H8.2a2 2 0 01-2-1.8L5 8z"/><path d="M9 8V6a3 3 0 016 0v2"/></svg></a><a class="mn-acc' + (here === 'cuenta.html' ? ' on' : '') + '" href="cuenta.html" title="Mi cuenta">' + svg('user') + '<span>Mi cuenta</span></a><a class="mn-adm' + (isAdm ? ' on' : '') + '" href="admin.html" title="Administración">' + svg('lock') + '<span>Administración</span></a><button class="mn-btn" type="button" aria-expanded="false" aria-label="Abrir menú">' + svg('menu') + '<span>Menú</span></button></div></div>';
  if (ex) { hd.querySelector('.mn-ex').appendChild(ex); hd.classList.add('has-ex'); }
  old.parentNode.replaceChild(hd, old);
  // ---- menús desplegables por grupo (escritorio): Partidos, Competiciones, Eventos, Comunidad ----
  [].forEach.call(hd.querySelectorAll('.mn-dd'), function (dd, gi) { var G = dd.dataset.g;
    var CC = { 'index.html': '#ff3b47', 'calendario.html': '#ff8a3d', 'ligas.html': '#8b5cf6', 'competiciones.html': '#ffd23f', 'mundial.html': '#2ee59d', 'champions.html': '#22d3ee', 'eventos.html': '#ffb400', 'balon.html': '#ffc400', 'sorteo.html': '#ff4fa3', 'prediccion.html': '#c6ff1a', 'noticias.html': '#22b8ff', 'equipos.html': '#2ee59d', 'mercado.html': '#8b5cf6', 'ranking.html': '#ffd23f', 'tienda.html': '#ff4fa3', 'apuestas.html': '#ff5a36' };
    var pan = document.createElement('div'); pan.className = 'mn-pan'; pan.id = 'mn-pan' + gi; pan.hidden = true; pan.setAttribute('role', 'menu');
    pan.innerHTML = '<div class="mn-pg">' + L.filter(function (x) { return x[3] === G && x[0] !== 'jugador.html'; }).map(function (x) { return '<a role="menuitem" class="mn-pc' + (x[0] === here ? ' on' : '') + '" href="' + x[0] + '" style="--c:' + (CC[x[0]] || '#8b5cf6') + '"><span class="ic">' + svg(x[2]) + '</span><span><b>' + x[1] + '</b><small>' + x[4] + '</small></span></a>'; }).join('') + '</div><div class="mn-pa" hidden><span>En juego ahora</span><div></div></div>';
    hd.appendChild(pan); var tmr = null, hov = matchMedia('(hover: hover) and (pointer: fine)').matches;
    function live() { var box = pan.querySelector('.mn-pa'), l = box.querySelector('div'); l.innerHTML = ''; if (G !== 'Competiciones' || !window.MAGNA || !MAGNA.S) { box.hidden = true; return; }
      var S = MAGNA.S, act = S.leagues.filter(function (c) { return c.status === 'active'; }).map(function (c) { return [c.name, 'ligas.html']; }).concat(S.tournaments.filter(function (c) { return c.status === 'active'; }).map(function (c) { return [c.name, c.format === 'groups_knockout' ? 'mundial.html' : c.format === 'champions' ? 'champions.html?t=' + c.id : 'competiciones.html']; }));
      act.slice(0, 8).forEach(function (x) { var a = document.createElement('a'); a.href = x[1]; a.setAttribute('role', 'menuitem'); a.appendChild(document.createElement('i')); a.appendChild(document.createTextNode(x[0])); l.appendChild(a); }); box.hidden = !act.length; }
    function place() { var r = dd.getBoundingClientRect(), hr = hd.getBoundingClientRect(), w = pan.offsetWidth || 560, x = Math.max(12, Math.min(r.left + r.width / 2 - w / 2, innerWidth - w - 12)); pan.style.left = (x - hr.left) + 'px'; }
    function show() { clearTimeout(tmr); [].forEach.call(hd.querySelectorAll('.mn-pan.show'), function (o) { if (o !== pan) { o.classList.remove('show'); o.hidden = true; var b2 = hd.querySelector('[aria-controls="' + o.id + '"]'); if (b2) b2.setAttribute('aria-expanded', 'false'); } }); if (!pan.hidden && pan.classList.contains('show')) return; live(); pan.hidden = false; place(); dd.setAttribute('aria-expanded', 'true'); requestAnimationFrame(function () { pan.classList.add('show'); }); }
    function hide(now) { clearTimeout(tmr); tmr = setTimeout(function () { pan.classList.remove('show'); dd.setAttribute('aria-expanded', 'false'); setTimeout(function () { if (!pan.classList.contains('show')) pan.hidden = true; }, 200); }, now ? 0 : 160); }
    dd.addEventListener('click', function (e) { e.stopPropagation(); if (pan.classList.contains('show')) hide(true); else { show(); var f = pan.querySelector('.mn-pc'); if (f && e.detail === 0) f.focus(); } });
    if (hov) { [dd, pan].forEach(function (n) { n.addEventListener('mouseenter', show); n.addEventListener('mouseleave', function () { hide(); }); }); }
    document.addEventListener('click', function (e) { if (!pan.hidden && !pan.contains(e.target) && e.target !== dd) hide(true); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pan.hidden) { hide(true); dd.focus(); } });
    pan.addEventListener('keydown', function (e) { if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return; var it = [].slice.call(pan.querySelectorAll('a')), i = it.indexOf(document.activeElement); if (i < 0) return; e.preventDefault(); it[(i + (e.key === 'ArrowDown' ? 1 : it.length - 1)) % it.length].focus(); });
    addEventListener('resize', function () { if (!pan.hidden) hide(true); });
  });
  var btn = hd.querySelector('.mn-btn'), ov = null;
  function close() { if (!ov) return; var o = ov; ov = null; o.classList.remove('show'); document.documentElement.style.overflow = ''; btn.setAttribute('aria-expanded', 'false'); setTimeout(function () { o.remove(); }, 260); btn.focus(); }
  function open() {
    ov = document.createElement('div'); ov.className = 'mn-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Menú');
    var groups = {}, NI = 0, GC = { 'Partidos': '#ff3b47', 'Competiciones': '#8b5cf6', 'Eventos': '#ffb400', 'Comunidad': '#22b8ff' }; L.forEach(function (x) { (groups[x[3]] = groups[x[3]] || []).push(x); });
    ov.innerHTML = '<div class="mn-sh"><div class="mn-hd"><a class="mn-logo" href="index.html"><img src="logo-nav.webp" alt="" width="34" height="38">Magna Arena</a><button class="mn-x" type="button" aria-label="Cerrar menú">' + svg('x') + '</button></div>' +
      '<div class="mn-live" hidden></div><label class="mn-q">' + svg('search') + '<input type="search" placeholder="¿A dónde quieres ir?" aria-label="Buscar sección"></label><p class="mn-none" hidden>No hay secciones con ese nombre.</p>' +
      Object.keys(groups).map(function (g, gi) { var gc = GC[g] || '#c6ff1a'; var GD = { 'Partidos': 'Partido destacado y calendario', 'Competiciones': 'Ligas, torneos, Mundial y Champions', 'Eventos': 'Eventos, Balón de Oro, sorteo y predicción', 'Comunidad': 'Noticias, equipos, fichajes, ranking, tienda y apuestas' }, op = g === hereG;
        return '<section class="mn-gs mn-ag' + (op ? ' open' : '') + '" style="--c:' + gc + ';--d:' + (gi * 60) + 'ms"><button type="button" class="mn-gb" aria-expanded="' + op + '"><span class="mn-gt"><b>' + g + '</b><small>' + GD[g] + '</small></span><em>' + groups[g].length + '</em>' + svg('chev') + '</button><div class="mn-grid">' + groups[g].map(function (x, i) { NI++; return '<a class="mn-it' + (x[0] === here ? ' on' : '') + '" href="' + x[0] + '" data-k="' + (x[1] + ' ' + x[4] + ' ' + g).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') + '" style="--d:' + (NI * 28) + 'ms"><span class="ic">' + svg(x[2]) + '</span><span><b>' + x[1] + '</b><small>' + x[4] + '</small></span></a>'; }).join('') + '</div></section>'; }).join('') +
      '<div class="mn-foot"><a class="mn-adm mn-acc2' + (here === 'cuenta.html' ? ' on' : '') + '" href="cuenta.html">' + svg('user') + '<span class="mn-acct">Mi cuenta · Bits</span></a><a class="mn-adm' + (isAdm ? ' on' : '') + '" href="admin.html">' + svg('lock') + 'Administración</a></div></div>';
    var ma = window.MAGNA_ME && MAGNA_ME.get(), mt = ov.querySelector('.mn-acct'); if (ma && mt) mt.textContent = ma.display_name + ' · ' + String(Number(ma.bits || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' Bits';
    document.body.appendChild(ov); document.documentElement.style.overflow = 'hidden'; btn.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(function () { if (ov) ov.classList.add('show'); });
    ov.addEventListener('click', function (e) { if (e.target === ov || e.target.closest('.mn-x')) close(); var gb = e.target.closest('.mn-gb'); if (!gb) return;
      var sc = gb.parentNode, was = sc.classList.contains('open'); [].forEach.call(ov.querySelectorAll('.mn-ag.open'), function (o) { o.classList.remove('open'); o.querySelector('.mn-gb').setAttribute('aria-expanded', 'false'); });
      if (!was) { sc.classList.add('open'); gb.setAttribute('aria-expanded', 'true'); setTimeout(function () { sc.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, 120); } });
    var qi = ov.querySelector('.mn-q input'); qi.addEventListener('input', function () { var q = qi.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim(), n = 0;
      [].forEach.call(ov.querySelectorAll('.mn-it'), function (a) { var on = !q || a.dataset.k.indexOf(q) >= 0; a.hidden = !on; if (on) n++; });
      [].forEach.call(ov.querySelectorAll('.mn-gs'), function (g) { g.hidden = !g.querySelector('.mn-it:not([hidden])'); }); ov.querySelector('.mn-none').hidden = n > 0; ov.classList.toggle('mn-qing', !!q); });
    qi.addEventListener('keydown', function (e) { if (e.key === 'Enter') { var f = ov.querySelector('.mn-it:not([hidden])'); if (f) location.href = f.getAttribute('href'); } });
    var lv = liveMatch(), lb = ov.querySelector('.mn-live'); if (lv && lb) { lb.hidden = false; lb.innerHTML = '<a href="index.html"><i></i><b>EN VIVO</b><span></span><em>Ver ›</em></a>'; lb.querySelector('span').textContent = MAGNA.teamName(lv.home) + ' ' + (lv.hs || 0) + ' - ' + (lv.as || 0) + ' ' + MAGNA.teamName(lv.away); }
    var cur = ov.querySelector('.mn-it.on') || ov.querySelector('.mn-it'); if (cur && matchMedia('(hover: hover)').matches) cur.focus();
  }
  function liveMatch() { try { return window.MAGNA && MAGNA.S ? MAGNA.S.matches.filter(function (m) { return m.status === 'live'; })[0] || null : null; } catch (e) { return null; } }
  // punto rojo en «Partidos» cuando hay un partido en vivo
  function liveDot() { var a = hd.querySelector('.mn-links a[href="index.html"]'), b = btn; var on = !!liveMatch(); if (a) a.classList.toggle('lv', on); if (b) b.classList.toggle('lv', on); }
  addEventListener('magna:update', liveDot); setTimeout(liveDot, 1500);
  // la barra se encoge al bajar
  (function () { var y0 = scrollY, tk = false; addEventListener('scroll', function () { if (tk) return; tk = true; requestAnimationFrame(function () { tk = false; var y = scrollY, dy = y - y0;
      hd.classList.toggle('mn-sm', y > 40); if (Math.abs(dy) > 6) {  y0 = y; } }); }, { passive: true }); })();
  btn.addEventListener('click', function () { ov ? close() : open(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  // zona horaria: las horas se muestran en la hora local de cada persona; aquí se dice de qué país es
  var TZC = { 'America/Bogota': 'Colombia', 'America/Mexico_City': 'México', 'America/Monterrey': 'México', 'America/Merida': 'México', 'America/Cancun': 'México', 'America/Chihuahua': 'México', 'America/Mazatlan': 'México', 'America/Tijuana': 'México', 'America/Hermosillo': 'México',
    'America/Lima': 'Perú', 'America/Santiago': 'Chile', 'America/Punta_Arenas': 'Chile', 'America/Argentina/Buenos_Aires': 'Argentina', 'America/Buenos_Aires': 'Argentina', 'America/Argentina/Cordoba': 'Argentina', 'America/Argentina/Mendoza': 'Argentina', 'America/Caracas': 'Venezuela', 'America/Guayaquil': 'Ecuador',
    'America/La_Paz': 'Bolivia', 'America/Asuncion': 'Paraguay', 'America/Montevideo': 'Uruguay', 'America/Sao_Paulo': 'Brasil', 'America/Manaus': 'Brasil', 'America/Fortaleza': 'Brasil', 'America/Recife': 'Brasil', 'America/Bahia': 'Brasil', 'America/Panama': 'Panamá', 'America/Costa_Rica': 'Costa Rica',
    'America/Guatemala': 'Guatemala', 'America/El_Salvador': 'El Salvador', 'America/Tegucigalpa': 'Honduras', 'America/Managua': 'Nicaragua', 'America/Santo_Domingo': 'República Dominicana', 'America/Puerto_Rico': 'Puerto Rico', 'America/Havana': 'Cuba',
    'America/New_York': 'Estados Unidos', 'America/Chicago': 'Estados Unidos', 'America/Denver': 'Estados Unidos', 'America/Phoenix': 'Estados Unidos', 'America/Los_Angeles': 'Estados Unidos', 'America/Anchorage': 'Estados Unidos', 'America/Detroit': 'Estados Unidos', 'Pacific/Honolulu': 'Estados Unidos',
    'America/Toronto': 'Canadá', 'America/Vancouver': 'Canadá', 'Europe/Madrid': 'España', 'Atlantic/Canary': 'España (Canarias)', 'Europe/Lisbon': 'Portugal', 'Europe/London': 'Reino Unido', 'Europe/Paris': 'Francia', 'Europe/Rome': 'Italia', 'Europe/Berlin': 'Alemania' };
  // zona horaria: se calcula solo la primera vez que alguien la pide (Intl es lento en celulares)
  var TZV = null; try { Object.defineProperty(window, 'MAGNA_TZ', { configurable: true, get: function () { return TZV || (TZV = tzCalc()); } }); } catch (e) { window.MAGNA_TZ = tzCalc(); }
  function tzCalc() { var id = '', off = '';
    try { id = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    try { var p = new Intl.DateTimeFormat('en-US', { timeZoneName: 'shortOffset' }).formatToParts(new Date()).filter(function (x) { return x.type === 'timeZoneName'; })[0]; off = p ? p.value.replace('GMT', 'UTC').replace('-', '−') : ''; if (off === 'UTC') off = 'UTC+0'; } catch (e) {}
    if (!off) { var m = -new Date().getTimezoneOffset(), hh = Math.floor(Math.abs(m) / 60), mm = Math.abs(m) % 60; off = 'UTC' + (m < 0 ? '−' : '+') + hh + (mm ? ':' + String(mm).padStart(2, '0') : ''); }
    var place = TZC[id] || (id ? id.split('/').pop().replace(/_/g, ' ') : 'tu zona'); return { id: id, place: place, offset: off, label: place + ' (' + off + ')' }; }
  function tzChip() { var main = document.querySelector('main'); if (!main || document.querySelector('.mn-tz')) return; var c = document.createElement('div'); c.className = 'mn-tz';
    c.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg><span></span>';
    c.querySelector('span').textContent = 'Horarios en tu hora local: ' + window.MAGNA_TZ.label;
    c.style.cssText = 'display:inline-flex;align-items:center;gap:8px;margin:16px 0 0;padding:7px 14px;border:1px solid rgba(255,255,255,.14);border-radius:999px;background:rgba(255,255,255,.04);color:#c9cde0;font:600 13px Archivo,system-ui,sans-serif;position:relative;z-index:2;max-width:100%';
    main.insertBefore(c, main.firstChild); }
  if (['index.html', 'calendario.html', 'apuestas.html', 'mundial.html', 'competiciones.html'].indexOf(here) >= 0) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tzChip); else tzChip(); }
  // enlaces legales al final de todas las páginas
  function legal() { if (document.querySelector('.mn-legal')) return; var f = document.createElement('div'); f.className = 'mn-legal';
    f.innerHTML = '<a href="terminos.html">Términos y condiciones</a><span>·</span><a href="privacidad.html">Privacidad</a><span>·</span><span>Magna Sports es una comunidad independiente y gratuita, no afiliada a Supercell. Los Bits no tienen valor real.</span>';
    [].forEach.call(document.querySelectorAll('main p.foot, main p.note'), function (p) { if (/^\s*Magna Sports es una comunidad independiente/.test(p.textContent)) p.remove(); });
    f.style.cssText = 'display:flex;flex-wrap:wrap;justify-content:center;gap:8px 12px;padding:22px 16px 90px;color:#9aa0b8;font:500 13px Archivo,system-ui,sans-serif;border-top:1px solid rgba(255,255,255,.08);margin-top:30px;position:relative;z-index:1';
    [].forEach.call(f.querySelectorAll('a'), function (a) { a.style.cssText = 'color:#c9cde0;text-decoration:underline;text-underline-offset:3px'; }); document.body.appendChild(f); }
  if (here !== 'admin.html') { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', legal); else legal(); }
  // modo compacto automático cuando las secciones no caben
  var links = hd.querySelector('.mn-links');
  var inn = hd.querySelector('.mn-in');
  function over() { return links.scrollWidth > links.clientWidth + 1; }
  // en celular: si el logo, la campana, tu perfil y el menú no caben, se ocultan primero los Bits del botón de perfil y luego el texto "Magna Arena" (el menú siempre queda visible)
  function mOver() { var r = hd.querySelector('.mn-r'), b = r && r.getBoundingClientRect(); return !!b && (b.right > document.documentElement.clientWidth - 6 || inn.scrollWidth > inn.clientWidth + 1); }
  function fitMobile() { hd.classList.remove('m-nobits', 'm-nowm'); if (innerWidth > 900) return; if (mOver()) { hd.classList.add('m-nobits'); if (mOver()) hd.classList.add('m-nowm'); } }
  function fitNav() { hd.classList.remove('compact', 'tight', 'tight2'); fitMobile(); if (innerWidth <= 900) return; if (over()) { hd.classList.add('tight'); if (over()) { hd.classList.add('tight2'); if (over()) { hd.classList.remove('tight2'); hd.classList.add('compact'); } } } if (!hd.classList.contains('compact') && ov) close(); }
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
    '.mn-me .nm{overflow:hidden;text-overflow:ellipsis;max-width:110px}.mn-me .bt{display:inline-flex;align-items:center;gap:6px;color:#ffd23f;font:700 12px "JetBrains Mono",monospace}' +
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
    '.mn-pop .skel{display:grid;gap:8px}.mn-pop .skel-row{display:flex;gap:10px;align-items:center;padding:8px 0}.mn-pop .skel-row>div{flex:1}.mn-pop .skel i{display:block;border-radius:6px;background:linear-gradient(90deg,rgba(255,255,255,.05),rgba(255,255,255,.13),rgba(255,255,255,.05));background-size:200% 100%;animation:mnSk 1.4s infinite linear}.mn-pop .skel .l1{height:11px;width:70%}.mn-pop .skel .l2{height:9px;width:40%;margin-top:6px}.mn-pop .skel .s{height:16px;width:54px}@keyframes mnSk{from{background-position:200% 0}to{background-position:-200% 0}}' +
    '@media(prefers-reduced-motion:reduce){.mn-pop,.mn-pop .mpmd .mpbr i{transition:none}.mn-pop .skel i{animation:none}}';
  var pst = document.createElement('style'); pst.textContent = pcss; document.head.appendChild(pst);
  I.logout = '<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>'; I.bet = '<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9 9.5c0-1 1.3-1.8 3-1.8s3 .8 3 1.8-1.3 1.6-3 2-3 1-3 2 1.3 1.8 3 1.8 3-.8 3-1.8"/>';
  var chip = document.createElement('button'); chip.type = 'button'; chip.className = 'mn-me'; chip.setAttribute('aria-haspopup', 'dialog'); chip.setAttribute('aria-expanded', 'false');
  var mr = hd.querySelector('.mn-r'); mr.insertBefore(chip, hd.querySelector('.mn-acc'));
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function ini(n) { var p = String(n || '?').trim().split(/\s+/); return ((p[0] || '?')[0] + (p[1] ? p[1][0] : (p[0] || '').slice(1, 2))).toUpperCase(); }
  function fmt(n) { return String(Math.round(Number(n || 0))).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function stats() { try { if (!me || !me.player_id || !window.MAGNA) return null; var p = MAGNA.by(MAGNA.S.players, me.player_id); if (!p) return null; var x = MAGNA.playerStats()[p.id] || {}, dt = MAGNA.S.teams.filter(function (q) { return q.coach === p.id; })[0], t = MAGNA.by(MAGNA.S.teams, p.teamId) || dt, md = x.media == null ? 10 : x.media; return { p: p, t: t, dt: dt, role: MAGNA.roleName(p), plays: MAGNA.plays(p), media: md, tier: MAGNA.tierOf(md), pj: x.pj || 0, w: x.w || 0, l: x.l || 0, g: x.g || 0, mvp: x.mvp || 0, titles: (x.titles || []).length }; } catch (e) { return null; } }
  function avatar(pc, color) { var a = el('span', 'mn-av'), i = el('i', null, me.avatar ? '' : ini(me.display_name)); if (me.avatar) { i.style.background = 'url("' + MAGNA_AVATAR_URL(me.avatar) + '") center/cover'; a.classList.add('img'); } a.appendChild(i); a.style.setProperty('--pc', pc); a.style.setProperty('--tc', color); return a; }
  function drawChip() {
    hd.classList.toggle('has-me', !!me); if (!me) { chip.innerHTML = ''; return; }
    var s = stats(); chip.innerHTML = ''; chip.title = 'Tu perfil'; chip.setAttribute('aria-label', 'Tu perfil: ' + me.display_name + ', ' + fmt(me.bits) + ' Bits');
    chip.appendChild(avatar(s ? s.media : 100, s ? s.tier.color : '#ffd23f')); chip.appendChild(el('span', 'nm', me.display_name)); var btc = el('span', 'bt'); var bi16 = MAGNA_BIT(16); bi16.classList.remove('sm'); btc.appendChild(bi16); btc.appendChild(document.createTextNode(fmt(me.bits))); chip.appendChild(btc); fitNav();
  }
  function save(a) { var prevId = me && me.id; me = a ? { id: a.id, display_name: a.display_name, username: a.username, bits: a.bits, player_id: a.player_id, role: a.role, avatar: a.avatar || null } : null; ntfBoot(); try { if (me) localStorage.setItem(ME_KEY, JSON.stringify(me)); else localStorage.removeItem(ME_KEY); } catch (e) {} drawChip(); }
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
    if (!me) return; if (pop) return closePop(); if (NT.pop) closeNtf();
    var s = stats(), bg = el('div', 'mn-pop-bg'), box = el('div', 'mn-pop'); box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Tu perfil');
    var x = el('button', 'mpx'); x.type = 'button'; x.setAttribute('aria-label', 'Cerrar'); x.innerHTML = svg('x'); x.onclick = closePop; box.appendChild(x);
    var top = el('div', 'mph'); top.appendChild(avatar(s ? s.media : 100, s ? s.tier.color : '#ffd23f')); var tt = el('div'); tt.appendChild(el('h3', null, me.display_name)); tt.appendChild(el('div', 'mpu', '@' + me.username));
    var tg = el('div', 'mptg'); tg.appendChild(el('span', null, me.role === 'admin' ? 'Administrador' : 'Miembro'));
    if (s) { tg.appendChild(el('span', null, s.role)); if (s.plays) { var tr = el('span', null, s.tier.name); tr.style.cssText = 'border-color:' + s.tier.color + ';color:' + s.tier.color; tg.appendChild(tr); } tg.appendChild(el('span', null, s.dt ? 'DT de ' + s.dt.name : s.t ? s.t.name + (s.p.slot === 'reserve' ? ' · suplente' : '') : 'Agente libre')); }
    tt.appendChild(tg); top.appendChild(tt); box.appendChild(top);
    var bal = el('div', 'mpbal'), l = el('div'), bn = el('b', null, '0'), bwr = el('div'); bwr.style.cssText = 'display:flex;align-items:center;gap:10px'; var bic = MAGNA_BIT(34); bwr.appendChild(bic); bwr.appendChild(bn); l.appendChild(bwr); setTimeout(function () { MAGNA_BIT.burst(bic, 12); }, 260); l.appendChild(el('small', null, 'Bits disponibles')); bal.appendChild(l);
    var rk = el('div', 'mprk'), rb = el('b', null, '—'); rk.appendChild(rb); rk.appendChild(el('small', null, 'Ranking de Bits')); bal.appendChild(rk); box.appendChild(bal); countUp(bn, me.bits);
    if (s && s.plays) {
      var md = el('div', 'mpmd'), ln = el('div', 'mpln'); ln.appendChild(el('span', null, 'Media del jugador')); ln.appendChild(el('b', null, s.media + ' / 100')); md.appendChild(ln); var br = el('div', 'mpbr'), bi = el('i'); bi.style.setProperty('--tc', s.tier.color); br.appendChild(bi); md.appendChild(br); box.appendChild(md);
      requestAnimationFrame(function () { requestAnimationFrame(function () { bi.style.width = s.media + '%'; }); });
      var st = el('div', 'mpst'); [[s.pj, 'Partidos'], [s.w + '-' + s.l, 'Récord'], [s.g, 'Goles'], [s.titles, 'Trofeos']].forEach(function (v) { var d = el('div'); d.appendChild(el('b', null, String(v[0]))); d.appendChild(el('small', null, v[1])); st.appendChild(d); }); box.appendChild(st);
    }
    box.appendChild(el('h4', null, 'Últimas apuestas')); var bl = el('div'), sk = el('div', 'skel'); for (var q = 0; q < 2; q++) { var sr = el('div', 'skel-row'), sm = el('div'); sm.appendChild(el('i', 'l1')); sm.appendChild(el('i', 'l2')); sr.appendChild(sm); sr.appendChild(el('i', 's')); sk.appendChild(sr); } bl.appendChild(sk); box.appendChild(bl);
    var ac = el('div', 'mpac'); ac.appendChild(link('cuenta.html', 'user', 'Mi cuenta')); ac.appendChild(link('apuestas.html', 'bet', 'Apostar')); ac.appendChild(link('ranking.html' + (s ? '#jugadores' : '#bits'), 'rank', 'Ranking'));
    if (s && s.t) ac.appendChild(link('equipo.html?id=' + s.t.id, 'shield', 'Mi equipo')); else ac.appendChild(link('mercado.html', 'swap', 'Fichajes')); if (me.player_id != null) ac.appendChild(link('jugador.html?id=' + me.player_id, 'user', 'Mi perfil')); ac.appendChild(link('tienda.html', 'star', 'Tienda'));
    if (s && s.dt) { var ce = link('mi-equipo.html', 'shield', 'Gestionar mi equipo (DT)'); ce.style.cssText = 'grid-column:1/-1;border-color:rgba(255,210,63,.45);color:#ffd23f'; ac.insertBefore(ce, ac.firstChild); }
    if (window.ACCOUNTS && ACCOUNTS.isJudge) ACCOUNTS.isJudge().then(function (ok) { if (!ok) return; var jz = link('juez.html', 'rank', '⚖️ Panel del juez'); jz.style.cssText = 'grid-column:1/-1;border-color:rgba(34,184,255,.5);color:#22b8ff'; ac.insertBefore(jz, ac.firstChild); }, function () {});
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
  // ---------- campanita de notificaciones ----------
  var NT = { list: [], unread: 0, sub: null, pop: null };
  var ncss = '.mn-shop{width:42px;height:42px;border-radius:50%;border:1px solid rgba(255,255,255,.18);color:#ffd23f;display:grid;place-items:center;flex:none;transition:border-color .15s,background-color .15s}.mn-shop:hover,.mn-shop.on{border-color:#ffd23f;background:rgba(255,210,63,.1)}.mn-shop svg{width:19px;height:19px}.mn.has-me .mn-shop{display:none}' + '.mn-bell{display:none;position:relative;width:42px;height:42px;border-radius:50%;border:1px solid rgba(255,255,255,.18);background:transparent;color:#f1f3fb;cursor:pointer;place-items:center;flex:none;transition:border-color .15s,background-color .15s}' +
    '.mn.has-me .mn-bell{display:grid}.mn-bell:hover,.mn-bell[aria-expanded="true"]{border-color:#ffd23f;color:#ffd23f}.mn-bell svg{width:19px;height:19px}' +
    '.mn-bell .nb{position:absolute;top:-4px;right:-4px;min-width:19px;height:19px;padding:0 5px;border-radius:999px;background:#ff5a36;color:#fff;font:800 11px/19px Archivo,sans-serif;text-align:center;box-shadow:0 0 0 2px #0a0d18}.mn-bell .nb:empty{display:none}' +
    '.mn-bell.ring svg{animation:mnRing 1s ease-in-out 2;transform-origin:50% 10%}@keyframes mnRing{0%,100%{transform:rotate(0)}15%{transform:rotate(18deg)}30%{transform:rotate(-15deg)}45%{transform:rotate(10deg)}60%{transform:rotate(-6deg)}75%{transform:rotate(3deg)}}' +
    '.mn-ntf h3{margin:0 0 4px;font:900 20px Archivo,sans-serif;font-stretch:115%;text-transform:uppercase}.mn-ntf .sub{color:#9aa0b8;font-size:13px;margin:0 0 12px}' +
    '.mn-ni{display:flex;gap:12px;padding:12px;border-radius:16px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.03);margin-bottom:8px}.mn-ni.new{border-color:rgba(255,210,63,.45);background:linear-gradient(135deg,rgba(255,210,63,.12),rgba(255,210,63,.02))}' +
    '.mn-ni .ic{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;font-size:20px;background:rgba(255,210,63,.16);flex:none}.mn-ni b{display:block;font-size:14px}.mn-ni p{margin:3px 0 0;color:#c9cde0;font-size:13px;overflow-wrap:anywhere}.mn-ni time{display:block;margin-top:4px;color:#9aa0b8;font:500 11px "JetBrains Mono",monospace}' +
    '.mn-nempty{text-align:center;color:#9aa0b8;padding:26px 10px}.mn-nempty span{display:block;font-size:34px;margin-bottom:6px}' +
    '.mn-toast{position:fixed;z-index:130;top:78px;left:50%;transform:translate(-50%,-10px);opacity:0;background:linear-gradient(135deg,#ffd23f,#ffb800);color:#0a0d18;border-radius:999px;padding:11px 18px;font:800 14px Archivo,sans-serif;box-shadow:0 12px 34px rgba(0,0,0,.45);transition:opacity .25s,transform .3s cubic-bezier(.2,.9,.2,1);cursor:pointer;max-width:calc(100vw - 24px);text-align:center}.mn-toast.show{opacity:1;transform:translate(-50%,0)}' +
    // notificaciones por tipo (color, ícono, monto y enlace), agrupadas por día y con pestañas
    '.mn-ntf{max-height:min(78vh,640px);overflow:auto}.mn-nh{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}.mn-nh .sub{margin:0}' +
    '.mn-nall{border:1px solid rgba(255,255,255,.18);background:transparent;color:#ffd23f;border-radius:999px;padding:6px 12px;font:700 12px Archivo,sans-serif;cursor:pointer;flex:none}.mn-nall:disabled{opacity:.4;cursor:default}' +
    '.mn-nsum{display:flex;align-items:center;gap:10px;margin:0 0 12px;padding:10px 12px;border-radius:14px;background:linear-gradient(135deg,rgba(46,229,157,.18),rgba(46,229,157,.04));border:1px solid rgba(46,229,157,.35);font:700 13px Archivo,sans-serif;color:#c9ffe6}.mn-nsum b{color:#2ee59d;font-size:16px}' +
    '.mn-ntab{display:flex;gap:6px;overflow-x:auto;margin:0 -2px 12px;padding:2px;scrollbar-width:none}.mn-ntab::-webkit-scrollbar{display:none}.mn-ntab button{flex:none;border:1px solid rgba(255,255,255,.14);background:transparent;color:#c9cde0;border-radius:999px;padding:6px 12px;font:700 12px Archivo,sans-serif;cursor:pointer}.mn-ntab button.on{background:#ffd23f;border-color:#ffd23f;color:#0a0d18}.mn-ntab small{margin-left:5px;opacity:.7}' +
    '.mn-nday{margin:12px 2px 6px;color:#9aa0b8;font:700 10px "JetBrains Mono",monospace;letter-spacing:.14em;text-transform:uppercase}' +
    '.mn-ni{position:relative;text-decoration:none;color:inherit;align-items:flex-start;--nc:#ffd23f;transition:transform .12s,border-color .15s}a.mn-ni:hover{transform:translateX(2px);border-color:var(--nc)}.mn-ni .ic{background:color-mix(in srgb,var(--nc) 18%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--nc) 40%,transparent)}' +
    '.mn-ni.new{border-color:color-mix(in srgb,var(--nc) 55%,transparent);background:linear-gradient(135deg,color-mix(in srgb,var(--nc) 14%,transparent),rgba(255,255,255,.02))}.mn-ni.new:after{content:"";position:absolute;top:12px;right:12px;width:8px;height:8px;border-radius:50%;background:var(--nc);box-shadow:0 0 0 3px color-mix(in srgb,var(--nc) 25%,transparent)}' +
    '.mn-ni>div{flex:1;min-width:0}.mn-ni .am{display:inline-block;margin-top:6px;padding:3px 9px;border-radius:999px;background:color-mix(in srgb,var(--nc) 22%,transparent);color:var(--nc);font:900 13px Archivo,sans-serif}.mn-ni .go{display:inline-block;margin-left:8px;color:#9aa0b8;font:600 11px Archivo,sans-serif}' +
    '.mn-ni.k-win{--nc:#2ee59d}.mn-ni.k-lost{--nc:#ff5a6a}.mn-ni.k-refund{--nc:#9aa0b8}.mn-ni.k-gift{--nc:#ffd23f}.mn-ni.k-pay{--nc:#2ee59d}.mn-ni.k-team{--nc:#5b8cff}.mn-ni.k-match{--nc:#ff8a3d}.mn-ni.k-judge{--nc:#b98cff}.mn-ni.k-info{--nc:#8fd3ff}' +
    '.mn-toast{display:flex;align-items:center;gap:10px;text-align:left;border-radius:18px;padding:10px 16px 10px 10px;--nc:#ffd23f;background:#141935;color:#f1f3fb;border:1px solid color-mix(in srgb,var(--nc) 60%,transparent);box-shadow:0 12px 34px rgba(0,0,0,.5),0 0 0 3px color-mix(in srgb,var(--nc) 18%,transparent);width:min(92vw,420px)}' +
    '.mn-toast .ic{width:36px;height:36px;border-radius:12px;display:grid;place-items:center;font-size:19px;flex:none;background:color-mix(in srgb,var(--nc) 22%,transparent)}.mn-toast b{display:block;font:800 14px Archivo,sans-serif}.mn-toast small{display:block;color:#c9cde0;font:500 12px Archivo,sans-serif;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mn-toast>div{min-width:0;flex:1}.mn-toast .am{margin-left:6px;color:var(--nc);font:900 15px Archivo,sans-serif;white-space:nowrap}' +
    '.mn-toast.k-win{--nc:#2ee59d}.mn-toast.k-lost{--nc:#ff5a6a}.mn-toast.k-refund{--nc:#9aa0b8}.mn-toast.k-pay{--nc:#2ee59d}.mn-toast.k-team{--nc:#5b8cff}.mn-toast.k-match{--nc:#ff8a3d}.mn-toast.k-judge{--nc:#b98cff}.mn-toast.k-info{--nc:#8fd3ff}' +
    '.mn-toast.k-win{animation:mnWin .6s cubic-bezier(.2,1.4,.4,1)}@keyframes mnWin{0%{scale:.6}60%{scale:1.06}100%{scale:1}}.mn-cf{position:fixed;z-index:131;width:8px;height:12px;border-radius:2px;pointer-events:none;animation:mnCf 1.2s cubic-bezier(.2,.7,.3,1) forwards}@keyframes mnCf{to{transform:translate(var(--dx),var(--dy)) rotate(var(--r));opacity:0}}' +
    '@media(prefers-reduced-motion:reduce){.mn-bell.ring svg{animation:none}.mn-toast{transition:none;animation:none!important}.mn-cf{display:none}}@media(max-width:420px){.mn-bell{width:38px;height:38px}}';
  var nst = document.createElement('style'); nst.textContent = ncss; document.head.appendChild(nst);
  I.bell = '<path d="M6 16V11a6 6 0 0112 0v5l2 2H4zM10 21h4"/>';
  var bell = document.createElement('button'); bell.type = 'button'; bell.className = 'mn-bell'; bell.setAttribute('aria-haspopup', 'dialog'); bell.setAttribute('aria-expanded', 'false'); bell.innerHTML = svg('bell') + '<span class="nb"></span>'; mr.insertBefore(bell, chip);
  function ago(t) { var s = Math.max(0, (Date.now() - Date.parse(t)) / 1000); if (s < 60) return 'Hace un momento'; if (s < 3600) return 'Hace ' + Math.floor(s / 60) + ' min'; if (s < 86400) return 'Hace ' + Math.floor(s / 3600) + ' h'; var d = Math.floor(s / 86400); return d === 1 ? 'Ayer' : d < 7 ? 'Hace ' + d + ' días' : new Date(t).toLocaleDateString('es', { day: 'numeric', month: 'short' }); }
  function badge() { NT.unread = NT.list.filter(function (n) { return !n.read_at; }).length; var b = bell.querySelector('.nb'); b.textContent = NT.unread ? (NT.unread > 9 ? '9+' : String(NT.unread)) : ''; bell.setAttribute('aria-label', NT.unread ? 'Notificaciones: ' + NT.unread + ' sin leer' : 'Notificaciones'); bell.title = bell.getAttribute('aria-label'); }
  function loadNtf() { if (!me) return Promise.resolve(); return client().then(function (c) { return c.from('notifications').select('*').order('created_at', { ascending: false }).limit(50); }).then(function (r) { if (r && !r.error) { NT.list = r.data || []; badge(); if (NT.pop) drawNtf(); } }, function () {}); }
  // tipo de cada notificación según lo que manda la base de datos: color, ícono, a dónde lleva y pestaña
  function kindOf(n) { var t = String(n.title || ''), k = n.kind;
    if (k === 'bet') { if (/^(🎉|🔥)/.test(t)) return { k: 'win', ic: /parley/i.test(t) ? '🔥' : '🏆', go: 'apuestas.html#mine', tab: 'bet', lbl: 'Ver mis apuestas' };
      if (/^(😬|💥)/.test(t)) return { k: 'lost', ic: /parley/i.test(t) ? '💥' : '😬', go: 'apuestas.html#mine', tab: 'bet', lbl: 'Ver mis apuestas' };
      return { k: 'refund', ic: '↩️', go: 'apuestas.html#mine', tab: 'bet', lbl: 'Ver mis apuestas' }; }
    if (/^💰 Sueldo/.test(t)) return { k: 'pay', ic: '💰', go: 'cuenta.html', tab: 'gift', lbl: 'Ver mi cuenta' };
    if (k === 'gift') return /Bits/.test(t) ? { k: 'gift', ic: '🎁', go: 'cuenta.html', tab: 'gift', lbl: 'Ver mi cuenta' } : { k: 'gift', ic: '🎀', go: 'tienda.html#own', tab: 'gift', lbl: 'Ver en Lo mío' };
    if (/^💰 (Fondos|Ingresos)/.test(t)) return { k: 'team', ic: '🏦', go: 'mi-equipo.html', tab: 'team', lbl: 'Ver mi equipo' };
    if (/^⏰/.test(t)) return { k: 'match', ic: '⏰', go: 'mi-equipo.html', tab: 'team', lbl: 'Ver mi equipo' };
    if (/^🗺/.test(t)) return { k: 'info', ic: '🗺️', go: 'index.html#mpanel', tab: 'info', lbl: 'Ver los mapas' };
    if (/^📰/.test(t)) return { k: 'info', ic: '📰', go: 'noticias.html', tab: 'info', lbl: 'Ver el post' };
    if (/^⚖️/.test(t)) return { k: 'judge', ic: '⚖️', go: 'juez.html', tab: 'info', lbl: 'Ir a calificar' };
    return { k: 'info', ic: '🔔', go: '', tab: 'info', lbl: '' }; }
  function clean(t) { return String(t || '').replace(/^(\p{Extended_Pictographic}|\uFE0F|\u200D|\s)+/u, ''); }
  function fmtN(v) { return Number(v || 0).toLocaleString('es-CO'); }
  function amTxt(n, K) { if (n.amount == null || !Number(n.amount) || /\d\s*Bits/.test(n.title || '')) return ''; return (K.k === 'lost' ? '' : '+') + fmtN(n.amount) + ' Bits'; }
  var TQ = [];
  function toast(n) { if (typeof n === 'string') n = { title: n }; var K = kindOf(n), x = el('div', 'mn-toast k-' + K.k); x.setAttribute('role', 'status');
    x.appendChild(el('span', 'ic', K.ic)); var t = el('div'), b = el('b', null, clean(n.title)); var am = amTxt(n, K); if (am) b.appendChild(el('span', 'am', am)); t.appendChild(b); if (n.body) t.appendChild(el('small', null, n.body)); x.appendChild(t);
    x.onclick = function () { x.remove(); if (K.go) location.href = K.go; else openNtf(); };
    // varios avisos a la vez se apilan hacia abajo
    TQ = TQ.filter(function (y) { return y.isConnected; }); var lt = TQ[TQ.length - 1]; x.style.top = (lt ? lt.getBoundingClientRect().bottom + 8 : 78) + 'px'; TQ.push(x); document.body.appendChild(x); requestAnimationFrame(function () { x.classList.add('show'); });
    if (K.k === 'win') { confetti(x); try { navigator.vibrate && navigator.vibrate([40, 50, 40, 50, 120]); } catch (e) {} }
    setTimeout(function () { x.classList.remove('show'); setTimeout(function () { x.remove(); }, 300); }, K.k === 'win' ? 7000 : 5000); }
  function confetti(x) { if (matchMedia('(prefers-reduced-motion: reduce)').matches) return; var r = x.getBoundingClientRect(), cs = ['#2ee59d', '#ffd23f', '#ff4fa3', '#5b8cff', '#fff'];
    for (var i = 0; i < 24; i++) { var c = el('i', 'mn-cf'), a = Math.random() * 6.283, d = 60 + Math.random() * 120; c.style.cssText = 'left:' + (r.left + r.width / 2) + 'px;top:' + (r.top + r.height / 2) + 'px;background:' + cs[i % cs.length] + ';--dx:' + Math.cos(a) * d + 'px;--dy:' + (Math.sin(a) * d * .6 + 80) + 'px;--r:' + (Math.random() * 720 - 360) + 'deg'; document.body.appendChild(c); setTimeout(function (c) { c.remove(); }, 1300, c); } }
  function ntfBoot() {
    var want = me && me.id && window.MAGNA_SB ? me.id : null; if (NT.forId === want) return; NT.forId = want;
    if (NT.sub) { try { NT.sub.unsubscribe(); } catch (e) {} NT.sub = null; } NT.list = []; badge(); if (!want) return;
    loadNtf();
    client().then(function (c) { NT.sub = c.channel('ntf-' + me.id).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: 'account_id=eq.' + me.id }, function (p) {
      var n = p.new; if (!n || NT.list.some(function (x) { return x.id === n.id; })) return; NT.list.unshift(n); badge();
      bell.classList.remove('ring'); requestAnimationFrame(function () { bell.classList.add('ring'); }); toast(n);
      // con la página en segundo plano y los avisos del celular activados, llega como notificación del sistema
      if (document.hidden && window.MAGNA_PWA && MAGNA_PWA.notify) { var K = kindOf(n); MAGNA_PWA.notify(clean(n.title) + (amTxt(n, K) ? ' · ' + amTxt(n, K) : ''), n.body || '', K.go || 'index.html', 'ntf' + n.id); }
      if (n.kind === 'gift') refresh(); if (NT.pop) drawNtf(); }).subscribe(); }, function () {});
  }
  var NTAB = 'all', TABS = [['all', 'Todas'], ['bet', '🎯 Apuestas'], ['gift', '🎁 Regalos'], ['team', '🏦 Equipo'], ['info', '🔔 Avisos']];
  function dayOf(t) { var d = new Date(t), n = new Date(), a = new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime(), x = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); return x >= a ? 'Hoy' : x >= a - 864e5 ? 'Ayer' : x >= a - 6 * 864e5 ? 'Esta semana' : 'Antes'; }
  function drawNtf() { var P = NT.pop, b = P.list; b.innerHTML = ''; P.tabs.innerHTML = ''; P.sum.hidden = true;
    P.all.disabled = !NT.unread; P.sub.textContent = NT.unread ? NT.unread + (NT.unread === 1 ? ' nueva' : ' nuevas') : 'Estás al día';
    if (!NT.list.length) { var e = el('div', 'mn-nempty'); e.appendChild(el('span', null, '🔔')); e.appendChild(document.createTextNode('No tienes notificaciones todavía. Aquí verás tus apuestas ganadas, los Bits que te regalen, tu sueldo y los avisos de tu equipo.')); b.appendChild(e); return; }
    var cnt = {}; NT.list.forEach(function (n) { var k = kindOf(n).tab; cnt[k] = (cnt[k] || 0) + 1; cnt.all = (cnt.all || 0) + 1; });
    TABS.forEach(function (t) { if (!cnt[t[0]]) return; var x = el('button', t[0] === NTAB ? 'on' : '', t[1]); x.type = 'button'; x.appendChild(el('small', null, String(cnt[t[0]]))); x.onclick = function () { NTAB = t[0]; drawNtf(); }; P.tabs.appendChild(x); });
    // resumen de lo ganado hoy (apuestas, regalos y sueldos)
    var win = NT.list.filter(function (n) { var k = kindOf(n).k; return dayOf(n.created_at) === 'Hoy' && (k === 'win' || k === 'gift' || k === 'pay') && Number(n.amount) > 0; }).reduce(function (a, n) { return a + Number(n.amount); }, 0);
    if (win > 0) { P.sum.hidden = false; P.sum.innerHTML = ''; P.sum.appendChild(el('span', null, '💸')); P.sum.appendChild(document.createTextNode('Hoy recibiste ')); P.sum.appendChild(el('b', null, '+' + fmtN(win) + ' Bits')); }
    var last = ''; NT.list.forEach(function (n) { var K = kindOf(n); if (NTAB !== 'all' && K.tab !== NTAB) return; var dg = dayOf(n.created_at); if (dg !== last) { b.appendChild(el('div', 'mn-nday', dg)); last = dg; }
      var r = el(K.go ? 'a' : 'div', 'mn-ni k-' + K.k + (n.read_at ? '' : ' new')); if (K.go) r.href = K.go; r.appendChild(el('span', 'ic', K.ic)); var t = el('div'); t.appendChild(el('b', null, clean(n.title))); if (n.body) t.appendChild(el('p', null, n.body));
      var am = amTxt(n, K); if (am) t.appendChild(el('span', 'am', am)); var tm = el('time', null, ago(n.created_at)); if (K.lbl) tm.appendChild(el('span', 'go', '· ' + K.lbl + ' →')); t.appendChild(tm); r.appendChild(t); b.appendChild(r); }); }
  function markAll() { return client().then(function (c) { return c.rpc('mark_notifications_read'); }).then(function () { var now = new Date().toISOString(); NT.list.forEach(function (n) { if (!n.read_at) n.read_at = now; }); badge(); if (NT.pop) drawNtf(); }, function () {}); }
  function closeNtf() { if (!NT.pop) return; var p = NT.pop; NT.pop = null; p.box.classList.remove('show'); p.bg.remove(); bell.setAttribute('aria-expanded', 'false'); setTimeout(function () { p.box.remove(); }, 220); }
  function openNtf() {
    if (NT.pop) return closeNtf(); if (pop) closePop();
    var bg = el('div', 'mn-pop-bg'), box = el('div', 'mn-pop mn-ntf'); box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Notificaciones');
    var x = el('button', 'mpx'); x.type = 'button'; x.setAttribute('aria-label', 'Cerrar'); x.innerHTML = svg('x'); x.onclick = closeNtf; box.appendChild(x);
    box.appendChild(el('h3', null, 'Notificaciones')); var nh = el('div', 'mn-nh'), sub = el('p', 'sub'), all = el('button', 'mn-nall', '✓ Marcar todo como leído'); all.type = 'button'; all.onclick = markAll; nh.appendChild(sub); nh.appendChild(all); box.appendChild(nh);
    var sum = el('div', 'mn-nsum'); sum.hidden = true; box.appendChild(sum); var tabs = el('div', 'mn-ntab'); tabs.setAttribute('role', 'tablist'); box.appendChild(tabs); var list = el('div'); box.appendChild(list);
    bg.onclick = closeNtf; document.body.appendChild(bg); document.body.appendChild(box); NT.pop = { box: box, bg: bg, list: list, sub: sub, all: all, sum: sum, tabs: tabs }; bell.setAttribute('aria-expanded', 'true'); drawNtf();
    requestAnimationFrame(function () { box.classList.add('show'); }); x.focus();
    // las nuevas se marcan como leídas a los pocos segundos de abrir (siguen resaltadas mientras la ventana esté abierta)
    loadNtf().then(function () { if (NT.pop && NT.pop.box === box && NT.unread) setTimeout(function () { if (!NT.pop || NT.pop.box !== box) return; client().then(function (c) { return c.rpc('mark_notifications_read'); }).then(function () { var now = new Date().toISOString(); NT.list.forEach(function (n) { if (!n.read_at) n.read_at = now; }); badge(); if (NT.pop) { NT.pop.all.disabled = true; NT.pop.sub.textContent = 'Estás al día'; } }, function () {}); }, 2500); });
  }
  bell.addEventListener('click', openNtf);
  window.MAGNA_NTF = { toast: toast, open: openNtf, show: function (L) { NT.list = L || []; badge(); if (NT.pop) drawNtf(); } };
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && NT.pop) { closeNtf(); bell.focus(); } });
  window.MAGNA_ME = { refresh: refresh, get: function () { return me; }, setAvatar: function (v) { if (!me) return; me.avatar = v || null; save(me); } };
  drawChip();
  function boot() { drawChip(); setTimeout(refresh, 50); }
  if (me && me.id) setTimeout(ntfBoot, 0);
  if (document.readyState === 'complete') boot(); else addEventListener('load', boot);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { refresh(); loadNtf(); } });
  setInterval(function () { if (!document.hidden) refresh(); }, 60000);
})();
// App instalable y avisos de partidos (no en el panel de administración)
(function () { if (/admin(\.html)?$/.test(location.pathname)) return; var s = document.createElement('script'); s.src = 'pwa.js'; s.async = true; document.head.appendChild(s); })();
