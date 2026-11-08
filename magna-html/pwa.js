'use strict';
// Magna Arena como app: se instala en el celular, abre rápido (service worker) y avisa cuando empieza un partido, hay gol o termina.
// Lo carga nav.js en todas las páginas públicas.
(function () {
  if (window.MAGNA_PWA) return;
  var LS = function (k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } };
  var standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  var ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream, prompt = null, card = null;
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(function () {});

  // ---------- estilos ----------
  var css = '.pwa-card{position:fixed;left:50%;bottom:16px;z-index:150;width:min(420px,calc(100vw - 24px));transform:translate(-50%,140%);transition:transform .45s cubic-bezier(.2,1.3,.4,1);border-radius:24px;padding:16px;background:linear-gradient(160deg,#1f1640,#121733 60%,#0d1426);border:1px solid rgba(255,255,255,.14);box-shadow:0 24px 60px rgba(0,0,0,.6),0 0 0 1px rgba(255,154,31,.15);color:#f1f3fb;font-family:Archivo,system-ui,sans-serif}' +
    '.pwa-card.on{transform:translate(-50%,0)}.pwa-card:before{content:"";position:absolute;inset:-1px;border-radius:inherit;padding:1px;background:linear-gradient(120deg,#ff6a00,#c6ff1a,#22d3ee,#a855f7,#ff6a00);background-size:300% 100%;-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;animation:pwaB 6s linear infinite;pointer-events:none}' +
    '@keyframes pwaB{to{background-position:300% 0}}' +
    '.pwa-top{display:flex;gap:14px;align-items:center}.pwa-ic{flex:none;width:58px;height:58px;border-radius:16px;box-shadow:0 8px 20px rgba(255,120,30,.35);animation:pwaJ 2.4s ease-in-out infinite}@keyframes pwaJ{0%,100%{transform:translateY(0) rotate(0)}30%{transform:translateY(-6px) rotate(-6deg)}60%{transform:translateY(0) rotate(4deg)}}' +
    '.pwa-top b{display:block;font:900 18px/1.15 Archivo,sans-serif}.pwa-top small{display:block;margin-top:3px;color:#b9bdcc;font-size:13px}' +
    '.pwa-x{position:absolute;top:10px;right:10px;width:30px;height:30px;border-radius:50%;border:0;background:rgba(255,255,255,.08);color:#fff;cursor:pointer;font:700 16px/1 Archivo,sans-serif}' +
    '.pwa-pts{display:flex;gap:6px;flex-wrap:wrap;margin:12px 0}.pwa-pts span{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);font:700 12px Archivo,sans-serif;animation:pwaIn .4s both}.pwa-pts i{width:8px;height:8px;border-radius:50%;background:var(--c)}' +
    '@keyframes pwaIn{from{opacity:0;transform:translateY(6px)}}' +
    '.pwa-row{display:flex;gap:8px}.pwa-b{flex:1;border:0;border-radius:14px;padding:12px;font:900 15px Archivo,sans-serif;cursor:pointer;transition:transform .12s,box-shadow .12s}.pwa-b:active{transform:translateY(3px)}' +
    '.pwa-b.go{background:linear-gradient(180deg,#ff8a2a,#ff6a00);color:#fff;box-shadow:0 4px 0 #a33f00}.pwa-b.go:hover{transform:translateY(-2px);box-shadow:0 6px 0 #a33f00}.pwa-b.no{background:rgba(255,255,255,.07);color:#e6e8ef;border:1px solid rgba(255,255,255,.14)}' +
    '.pwa-ios{display:grid;gap:8px;margin:12px 0 4px}.pwa-ios div{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:14px;background:rgba(255,255,255,.05);font-size:14px}.pwa-ios b.n{flex:none;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:#ff6a00;font:900 13px Archivo,sans-serif}.pwa-ios svg{flex:none;color:#60a5fa}' +
    '.pwa-arrow{position:fixed;left:50%;bottom:6px;z-index:149;transform:translateX(-50%);color:#ff9a1f;animation:pwaAr 1s ease-in-out infinite alternate;pointer-events:none}@keyframes pwaAr{to{transform:translate(-50%,8px)}}' +
    '.pwa-sw{display:flex;align-items:center;gap:10px;margin-top:10px;padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.05);cursor:pointer;font:700 14px Archivo,sans-serif;border:1px solid rgba(255,255,255,.08);width:100%;color:inherit;text-align:left}.pwa-sw .t{position:relative;flex:none;width:40px;height:24px;border-radius:999px;background:#3a3f4d;transition:background-color .2s}.pwa-sw .t:after{content:"";position:absolute;left:3px;top:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:transform .2s cubic-bezier(.3,1.5,.5,1)}.pwa-sw.on .t{background:#2ee59d}.pwa-sw.on .t:after{transform:translateX(16px)}.pwa-sw small{display:block;color:#9aa0b4;font-weight:600;font-size:12px}' +
    '.pwa-toast{position:fixed;left:50%;top:16px;z-index:160;transform:translate(-50%,-150%);transition:transform .35s cubic-bezier(.2,1.3,.4,1);display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:16px;background:#131833;border:1px solid #2ee59d;color:#fff;font:700 14px Archivo,sans-serif;box-shadow:0 14px 30px rgba(0,0,0,.45);max-width:calc(100vw - 24px)}.pwa-toast.on{transform:translate(-50%,0)}' +
    '.mn-app{display:flex!important;align-items:center;gap:10px}' +
    '@media(prefers-reduced-motion:reduce){.pwa-card,.pwa-toast{transition:none}.pwa-ic,.pwa-card:before,.pwa-arrow,.pwa-pts span{animation:none}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  var SVG = { share: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5M5 13v7h14v-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    plus: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 8v8M8 12h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    down: '<svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true"><path d="M12 4v14M6 12l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    phone: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 18h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    bell: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 16V11a6 6 0 0112 0v5l2 2H4zM10 20a2 2 0 004 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>' };
  function toast(t) { var x = el('div', 'pwa-toast'); x.innerHTML = SVG.bell; x.appendChild(el('span', null, t)); document.body.appendChild(x); requestAnimationFrame(function () { x.classList.add('on'); }); setTimeout(function () { x.classList.remove('on'); setTimeout(function () { x.remove(); }, 400); }, 3200); }

  // ---------- avisos de partidos ----------
  function avisosOn() { return LS('magna_avisos') === '1' && window.Notification && Notification.permission === 'granted'; }
  function notify(title, body, url, tag) { if (!avisosOn()) return; var o = { body: body, icon: 'img/app/icon-192.png', badge: 'img/app/icon-192.png', tag: tag, renotify: true, data: { url: url || 'index.html' }, vibrate: [120, 60, 120] };
    if (navigator.serviceWorker && navigator.serviceWorker.controller) navigator.serviceWorker.ready.then(function (r) { r.showNotification(title, o); }).catch(function () { try { new Notification(title, o); } catch (e) {} });
    else { try { new Notification(title, o); } catch (e) {} } }
  function toggleAvisos(btn) {
    if (!window.Notification) { toast('Tu navegador no permite avisos. Instala la app para recibirlos.'); return; }
    if (LS('magna_avisos') === '1') { LS('magna_avisos', null); paintSw(); toast('Avisos de partidos apagados'); return; }
    Notification.requestPermission().then(function (p) { if (p !== 'granted') { toast('Activa los permisos de notificaciones en tu navegador para recibir avisos.'); paintSw(); return; }
      LS('magna_avisos', '1'); snapshot(); paintSw(); toast('¡Listo! Te avisaremos cuando empiece un partido');
      notify('Avisos activados', 'Te avisaremos cuando empiece un partido, cuando haya gol y con el resultado final.', 'index.html', 'magna-hola'); }); }
  function paintSw() { [].forEach.call(document.querySelectorAll('.pwa-sw'), function (b) { var on = avisosOn(); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); }); }
  function sw() { var b = el('button', 'pwa-sw'); b.type = 'button'; b.appendChild(el('span', 't')); var d = el('span'); d.appendChild(document.createTextNode('Avisos de partidos')); d.appendChild(el('small', null, 'Inicio, goles y resultado final')); b.appendChild(d); b.onclick = function (e) { e.stopPropagation(); toggleAvisos(b); }; setTimeout(paintSw, 0); return b; }
  // compara el estado de cada partido con lo último visto (sirve entre pestañas y al volver a abrir)
  function tname(id) { return window.MAGNA && MAGNA.teamName ? MAGNA.teamName(id) : 'Equipo'; }
  function snapshot() { if (!window.MAGNA || !MAGNA.S || !MAGNA.S.matches) return {}; var o = {}; MAGNA.S.matches.forEach(function (m) { o[m.id] = [m.status, m.hs || 0, m.as || 0]; }); return o; }
  function check() { if (!window.MAGNA || !MAGNA.S || !MAGNA.S.matches) return; var cur = snapshot(), prev = null; try { prev = JSON.parse(LS('magna_mst') || 'null'); } catch (e) {} LS('magna_mst', JSON.stringify(cur)); if (!prev || !avisosOn()) return;
    MAGNA.S.matches.forEach(function (m) { var p = prev[m.id], vs = tname(m.home) + ' vs ' + tname(m.away), url = 'index.html?m=' + m.id; if (!p) return;
      if (p[0] !== 'live' && m.status === 'live') notify('¡Empezó el partido!', vs + ' · síguelo en vivo en Magna Arena', url, 'm' + m.id + 'start');
      else if (m.status === 'live' && (m.hs || 0) + (m.as || 0) > p[1] + p[2]) notify('¡GOOOL!', tname(m.home) + ' ' + (m.hs || 0) + ' - ' + (m.as || 0) + ' ' + tname(m.away), url, 'm' + m.id + 'g' + ((m.hs || 0) + (m.as || 0)));
      if (p[0] === 'live' && m.status === 'finished') notify('Final del partido', tname(m.home) + ' ' + (m.hs || 0) + ' - ' + (m.as || 0) + ' ' + tname(m.away), url, 'm' + m.id + 'end'); }); }
  window.addEventListener('magna:update', function () { setTimeout(check, 50); });
  setTimeout(check, 1500);

  // ---------- instalar ----------
  function snooze() { LS('magna_pwa_no', String(Date.now())); }
  function snoozed() { var t = Number(LS('magna_pwa_no') || 0); return t && Date.now() - t < 7 * 864e5; }
  function close() { if (!card) return; card.classList.remove('on'); var c = card; card = null; setTimeout(function () { c.remove(); }, 450); var a = document.querySelector('.pwa-arrow'); if (a) a.remove(); }
  function show(force) { if (standalone || card || (!force && snoozed())) return; if (!prompt && !ios) { if (force) toast('Abre el menú de tu navegador y elige «Instalar app» o «Agregar a la pantalla de inicio».'); return; }
    card = el('div', 'pwa-card'); card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', 'Instalar Magna Arena');
    var x = el('button', 'pwa-x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Cerrar'); x.onclick = function () { snooze(); close(); }; card.appendChild(x);
    var top = el('div', 'pwa-top'), ic = el('img', 'pwa-ic'); ic.src = 'img/app/icon-192.png'; ic.alt = ''; top.appendChild(ic); var tx = el('div'); tx.appendChild(el('b', null, 'Lleva Magna en tu celular')); tx.appendChild(el('small', null, 'Instálala gratis: sin tienda de apps y sin ocupar casi espacio.')); top.appendChild(tx); card.appendChild(top);
    var pts = el('div', 'pwa-pts'); [['Abre al instante', '#c6ff1a'], ['Avisos de partidos', '#ff9a1f'], ['Funciona con mala señal', '#22d3ee']].forEach(function (p, i) { var s = el('span'); s.style.animationDelay = (.2 + i * .1) + 's'; var d = el('i'); d.style.setProperty('--c', p[1]); s.appendChild(d); s.appendChild(document.createTextNode(p[0])); pts.appendChild(s); }); card.appendChild(pts);
    if (prompt) { var r = el('div', 'pwa-row'), go = el('button', 'pwa-b go', 'Instalar'), no = el('button', 'pwa-b no', 'Ahora no'); go.type = no.type = 'button';
      go.onclick = function () { var pr = prompt; prompt = null; pr.prompt(); pr.userChoice.then(function (c) { close(); if (c && c.outcome === 'accepted') toast('¡Magna Arena se está instalando!'); else snooze(); }, close); };
      no.onclick = function () { snooze(); close(); }; r.appendChild(go); r.appendChild(no); card.appendChild(r); }
    else { var ii = el('div', 'pwa-ios'); [[SVG.share, 'Toca el botón <b>Compartir</b> de Safari'], [SVG.plus, 'Elige <b>Agregar a pantalla de inicio</b>'], [SVG.phone, 'Abre Magna desde su ícono']].forEach(function (s, i) { var d = el('div'); d.appendChild(el('b', 'n', String(i + 1))); d.insertAdjacentHTML('beforeend', s[0]); var t = el('span'); t.innerHTML = s[1]; d.appendChild(t); ii.appendChild(d); }); card.appendChild(ii);
      var ar = el('div', 'pwa-arrow'); ar.innerHTML = SVG.down; document.body.appendChild(ar); }
    card.appendChild(sw());
    document.body.appendChild(card); requestAnimationFrame(function () { requestAnimationFrame(function () { card.classList.add('on'); }); }); }
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); prompt = e; if (!snoozed()) setTimeout(function () { show(); }, 9000); });
  window.addEventListener('appinstalled', function () { close(); toast('¡Listo! Magna Arena ya está en tu pantalla de inicio'); });
  if (ios && !standalone && !snoozed()) setTimeout(function () { show(); }, 12000);

  // ---------- en el menú del celular: instalar y avisos ----------
  new MutationObserver(function () { var f = document.querySelector('.mn-ov .mn-foot'); if (!f || f.querySelector('.mn-app')) return;
    if (!standalone) { var a = el('button', 'mn-adm mn-app'); a.type = 'button'; a.innerHTML = SVG.phone; a.appendChild(document.createTextNode('Instalar la app')); a.onclick = function () { show(true); }; f.insertBefore(a, f.firstChild); }
    var s = sw(); s.classList.add('mn-app'); f.insertBefore(s, f.firstChild); }).observe(document.body, { childList: true });

  window.MAGNA_PWA = { show: function () { show(true); }, avisos: toggleAvisos, standalone: standalone };
})();
