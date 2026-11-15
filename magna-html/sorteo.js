'use strict';
// Sorteo de marcos (sorteo.html): inscripción pagada con Bits, muro de inscritos, cuenta regresiva y ruleta del ganador.
// El ganador lo elige el servidor (admin_raffle_draw); aquí solo se muestra.
(function () {
  var h = M.h, root = document.getElementById('sr'), acc = null, L = [], cur = null, ents = [], TK = null, CY = null, busy = false;
  function rpc(n, a) { return window.MAGNA_SB().then(function (c) { return c.rpc(n, a); }).then(function (r) { if (r && r.error) throw r.error; return r.data; }); }
  function fmt(n) { return String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function item(id) { return M.item ? M.item(id) : null; }
  function levels(it) { if (!it) return []; var U = ((MAGNA.S && MAGNA.S.shop) || []).filter(function (x) { return x.upg === it.id; }).sort(function (a, b) { return a.lv - b.lv; }); return [it].concat(U); }
  function toast(t, bad) { var x = h('div', null, t); x.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:120;background:#0d0d10;color:#fff;border:2px solid ' + (bad ? '#ff5a6a' : '#c6ff1a') + ';padding:12px 18px;border-radius:14px;font:700 14px Archivo,sans-serif;max-width:calc(100vw - 24px)'; document.body.appendChild(x); setTimeout(function () { x.remove(); }, 3200); }
  function av(name, pid, size, avc) { var a = M.tierAv(name || '—', null, size, pid); if (avc && /^a\d\d$/.test(avc)) { a.style.backgroundImage = 'url("avatars/' + avc + '.webp")'; a.classList.add('has-pav'); } return a; }
  function left(t) { var ms = Date.parse(t) - Date.now(); if (!(ms > 0)) return null; var s = Math.floor(ms / 1000), d = Math.floor(s / 86400), hh = Math.floor(s % 86400 / 3600), mm = Math.floor(s % 3600 / 60), ss = s % 60;
    return d ? d + 'd ' + hh + 'h ' + mm + 'm' : (hh ? hh + 'h ' : '') + String(mm).padStart(2, '0') + 'm ' + String(ss).padStart(2, '0') + 's'; }

  function hero(r) {
    var it = item(r.prize_item), U = levels(it), s = h('section', 'sr-h'), tx = h('div');
    tx.appendChild(h('span', 'sr-k', r.status === 'drawn' ? '🏆 Sorteo terminado' : r.status === 'open' ? '🎟️ Sorteo abierto' : '⏳ Inscripciones cerradas'));
    tx.appendChild(h('h1', null, r.title)); var pz = h('p', 'sr-pz'); pz.appendChild(document.createTextNode('Premio: ')); pz.appendChild(h('b', null, it ? it.name : 'Marco legendario')); pz.appendChild(document.createTextNode(U.length > 1 ? ' con sus ' + U.length + ' niveles desbloqueados.' : '.')); tx.appendChild(pz);
    var st = h('div', 'sr-st');
    function box(v, l, c) { var d = h('div', c || null); d.appendChild(h('b', null, v)); d.appendChild(h('small', null, l)); st.appendChild(d); return d; }
    box(fmt(r.entrants), r.entrants == 1 ? 'inscrito' : 'inscritos'); box(Number(r.cost) ? fmt(r.cost) + ' Bits' : 'Gratis', 'entrada');
    var cd = null; if (r.status === 'open' && r.closes_at) cd = box(left(r.closes_at) || '—', 'para cerrar', 'sr-cd');
    tx.appendChild(st);
    var act = h('div'); tx.appendChild(act);
    if (r.status === 'open') {
      if (!acc) { var e = h('a', 'sr-b', '🔑 Entra para inscribirte'); e.href = 'cuenta.html'; act.appendChild(e); }
      else if (r.mine) { var ok = h('button', 'sr-b ok', '✓ Ya estás inscrito · ¡suerte!'); ok.disabled = true; act.appendChild(ok); }
      else { var go = h('button', 'sr-b', Number(r.cost) ? '🎟️ Inscribirme · ' + fmt(r.cost) + ' Bits' : '🎟️ Inscribirme gratis'); go.type = 'button';
        if (Number(acc.bits) < Number(r.cost)) { go.disabled = true; act.appendChild(go); act.appendChild(h('p', 'sr-note', 'Te faltan ' + fmt(r.cost - acc.bits) + ' Bits. Gánalos en Apuestas o Predicción.')); }
        else { go.onclick = function () { join(r, go); }; act.appendChild(go); act.appendChild(h('p', 'sr-note', 'Tienes ' + fmt(acc.bits) + ' Bits. Te inscribes una sola vez; el ganador lo elige el sistema al azar.')); } }
    } else if (r.status === 'closed') act.appendChild(h('p', 'sr-note', 'Ya no se aceptan inscripciones. ¡Muy pronto el sorteo en vivo!'));
    else if (r.status === 'drawn') { var rp = h('button', 'sr-b gh', '🎰 Ver la ruleta otra vez'); rp.type = 'button'; rp.onclick = function () { roulette(r); }; act.appendChild(rp); }
    s.appendChild(tx);
    // escenario: el premio pasando por sus niveles
    var stg = h('div', 'sr-stage'), a = r.status === 'drawn' ? av(r.winner_name, r.winner_player, 170, r.winner_avatar) : av(acc ? acc.display_name : 'Tú', null, 170);
    if (it) { a.classList.add('fr-' + it.style); a.dataset.lvx = '1'; a.dataset.lv = r.status === 'drawn' ? U.length : 1; if (window.MAGNA_COS) MAGNA_COS.deco(a); }
    stg.appendChild(a); if (U.length > 1) stg.appendChild(h('span', 'sr-all', '¡Los ' + U.length + ' niveles!')); var lv = h('span', 'sr-lv'); stg.appendChild(lv); s.appendChild(stg);
    var i = r.status === 'drawn' ? U.length : 1; function show() { lv.textContent = r.status === 'drawn' ? '🏆 ' + (r.winner_name || 'Ganador') : 'Nv.' + i + (U[i - 1] && U[i - 1].lv ? '' : '') ; a.dataset.lv = i; }
    show(); clearInterval(CY); if (r.status !== 'drawn' && U.length > 1 && !matchMedia('(prefers-reduced-motion: reduce)').matches) CY = setInterval(function () { if (!document.body.contains(a)) return clearInterval(CY); i = i % U.length + 1; show(); }, 2600);
    clearInterval(TK); if (cd) TK = setInterval(function () { var t = left(r.closes_at); if (!document.body.contains(cd)) return clearInterval(TK); if (!t) { clearInterval(TK); load(); return; } cd.firstChild.textContent = t; }, 1000);
    return s; }

  function wall(r) { var w = h('section', 'sr-s'); w.appendChild(h('h2', 'x', '🎟️ Inscritos (' + fmt(ents.length) + ')'));
    if (!ents.length) { w.appendChild(h('div', 'sr-emp', r.status === 'open' ? 'Todavía nadie se inscribe. ¡Sé el primero!' : 'Nadie se inscribió en este sorteo.')); return w; }
    var g = h('div', 'sr-wall'); ents.forEach(function (e) { var c = h('div', 'sr-p' + (e.me ? ' me' : '')); c.appendChild(av(e.name, e.player_id, 56, e.avatar)); c.appendChild(h('small', null, e.me ? e.name + ' (tú)' : e.name)); g.appendChild(c); }); w.appendChild(g); return w; }

  function winner(r) { var s = h('section', 'sr-s'), c = h('div', 'sr-win'), it = item(r.prize_item), a = av(r.winner_name, r.winner_player, 84, r.winner_avatar);
    if (it) { a.classList.add('fr-' + it.style); a.dataset.lvx = '1'; a.dataset.lv = levels(it).length; if (window.MAGNA_COS) MAGNA_COS.deco(a); }
    c.appendChild(a); var t = h('div'); t.appendChild(h('small', null, 'GANADOR DEL SORTEO')); t.appendChild(h('h3', null, r.winner_name || '—')); t.appendChild(h('p', null, 'Se lleva ' + (it ? it.name : 'el marco') + ' con todos sus niveles.')); c.appendChild(t); s.appendChild(c); return s; }

  function hist() { var P = L.filter(function (x) { return x !== cur; }); if (!P.length) return null; var s = h('section', 'sr-s'); s.appendChild(h('h2', 'x', '📜 Sorteos anteriores')); var g = h('div', 'sr-hist');
    P.forEach(function (r) { var it = item(r.prize_item), row = h('div', 'sr-hi'); row.appendChild(h('b', null, r.title)); row.appendChild(h('span', null, it ? it.name : '')); row.appendChild(h('em', null, r.status === 'drawn' ? '🏆 ' + (r.winner_name || '—') : r.status === 'cancelled' ? 'Cancelado' : r.entrants + ' inscritos')); g.appendChild(row); }); s.appendChild(g); return s; }

  function join(r, b) { if (busy) return; busy = true; b.disabled = true; b.textContent = 'Inscribiendo…';
    rpc('raffle_join', { p_raffle: r.id }).then(function (nb) { busy = false; acc.bits = Number(nb); if (window.MAGNA_ME && MAGNA_ME.refresh) MAGNA_ME.refresh(); toast('🎟️ ¡Listo! Ya estás en el sorteo.'); confetti(40); load(); },
      function (e) { busy = false; b.disabled = false; b.textContent = '🎟️ Inscribirme'; toast(e.message || 'No se pudo inscribir', true); }); }

  // ruleta: los nombres pasan rápido y frenan en el ganador (el ganador ya lo eligió el servidor)
  function roulette(r) { var names = ents.map(function (e) { return e.name; }); if (!names.length) names = [r.winner_name || '—']; var N = 34, seq = [];
    for (var k = 0; k < N; k++) seq.push(names[(k * 7 + 3) % names.length]); seq.push(r.winner_name || '—');
    var ov = h('div', 'sr-ov'), box = h('div', 'sr-rl'); box.appendChild(h('h3', null, '🎰 ' + r.title)); var win = h('div', 'sr-win2'), reel = h('div', 'sr-reel'); seq.forEach(function (n) { reel.appendChild(h('div', null, n)); }); win.appendChild(reel); box.appendChild(win); ov.appendChild(box); document.body.appendChild(ov);
    var end = -(seq.length - 1) * 84, t0 = performance.now(), D = 4200;
    function step(t) { var p = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - p, 4); reel.style.transform = 'translateY(' + (end * e) + 'px)'; if (p < 1) requestAnimationFrame(step); else done(); }
    function done() { var it = item(r.prize_item), d = h('div', 'sr-done'), a = av(r.winner_name, r.winner_player, 150, r.winner_avatar); if (it) { a.classList.add('fr-' + it.style); a.dataset.lvx = '1'; a.dataset.lv = levels(it).length; if (window.MAGNA_COS) MAGNA_COS.deco(a); }
      d.appendChild(a); d.appendChild(h('b', null, '🏆 ¡' + (r.winner_name || 'Ganador') + ' gana ' + (it ? it.name : 'el marco') + '!')); var c = h('button', 'sr-b', 'Cerrar'); c.type = 'button'; c.onclick = function () { ov.remove(); }; d.appendChild(c); box.appendChild(d); confetti(90); }
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { reel.style.transform = 'translateY(' + end + 'px)'; done(); } else requestAnimationFrame(step);
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); }; }
  function confetti(n) { if (matchMedia('(prefers-reduced-motion: reduce)').matches) return; var C = ['#ffd23f', '#c6ff1a', '#ff5fa2', '#7dd3fc', '#b07cff', '#ff6a1a'];
    for (var i = 0; i < n; i++) { var p = h('i', 'sr-cf'); p.style.left = Math.random() * 100 + 'vw'; p.style.background = C[i % C.length]; p.style.animationDuration = (1.8 + Math.random() * 1.8) + 's'; p.style.animationDelay = Math.random() * .6 + 's'; document.body.appendChild(p); (function (q) { setTimeout(function () { q.remove(); }, 4400); })(p); } }

  function render() { root.innerHTML = '';
    if (!cur) { var e = h('section', 'sr-h'), t = h('div'); t.appendChild(h('span', 'sr-k', '🎟️ Sorteos')); t.appendChild(h('h1', null, 'No hay sorteos activos')); t.appendChild(h('p', 'sr-pz', 'Cuando la administración abra un sorteo aparecerá aquí. ¡Atento a las noticias!')); var a = h('a', 'sr-b gh', '🛍️ Ir a la tienda'); a.href = 'tienda.html'; t.appendChild(a); e.appendChild(t); root.appendChild(e); var hs = hist(); if (hs) root.appendChild(hs); return; }
    document.title = cur.title + ' · Sorteo · Magna Arena';
    root.appendChild(hero(cur)); if (cur.status === 'drawn') root.appendChild(winner(cur)); root.appendChild(wall(cur)); var hs2 = hist(); if (hs2) root.appendChild(hs2); }
  function load() { if (!window.MAGNA_SB) { root.innerHTML = ''; root.appendChild(h('p', 'sr-emp', 'Sin conexión.')); return; }
    rpc('raffle_list').then(function (d) { L = d || []; cur = L.filter(function (r) { return r.status === 'open' || r.status === 'closed'; })[0] || L.filter(function (r) { return r.status === 'drawn'; })[0] || null;
      if (!cur) { ents = []; return render(); }
      return rpc('raffle_entrants', { p_raffle: cur.id }).then(function (e) { ents = e || []; render();
        var k = 'magna_sr_seen_' + cur.id; if (cur.status === 'drawn') { var seen = null; try { seen = localStorage.getItem(k); } catch (x) {} if (!seen) { try { localStorage.setItem(k, '1'); } catch (x) {} roulette(cur); } } }); },
      function () { root.innerHTML = ''; root.appendChild(h('div', 'sr-emp', 'No se pudo cargar el sorteo. Revisa tu conexión.')); }); }
  function boot() { root.appendChild(M.skel ? M.skel(2) : h('p', null, 'Cargando…'));
    var go = function () { (window.ACCOUNTS && ACCOUNTS.me ? ACCOUNTS.me() : Promise.resolve(null)).then(function (a) { acc = a; load(); }, function () { load(); }); };
    if (window.MAGNA_SB && window.ACCOUNTS) go(); else window.addEventListener('load', go); }
  window.addEventListener('magna:update', function () { if (cur) render(); });
  boot();
})();
