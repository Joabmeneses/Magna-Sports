'use strict';
// Estética esports del marcador: franja superior ordenada (estado, reloj, controles),
// insignia del equipo que va adelante, barra de tiempo, barra de apoyo de la afición
// y pequeñas animaciones cuando cambia el marcador.
(function () {
  var B, top, prog, fan, last = { h: null, a: null };
  function $(s, r) { return (r || document).querySelector(s); }
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function isLeague(tx, mid) { var M = window.MAGNA, S = M && M.S; if (!S) return false; if (mid != null && M.by) { var sm = M.by(S.matches, mid); if (sm) return sm.type === 'league'; } return (S.leagues || []).some(function (l) { return l.name && tx.indexOf(l.name) >= 0; }); }
  function cur() { var bn = window.MAGNA_BN; if (!bn || !bn.M) return null; return bn.M[typeof bn.cur === 'function' ? bn.cur() : 0] || null; }
  function st(e, v) { if (e && e.textContent !== v) e.textContent = v; }
  function num(e) { return e ? (parseInt(e.textContent, 10) || 0) : 0; }

  function lead() {
    var h = $('.sc [data-g="h"]', B), a = $('.sc [data-g="a"]', B), T = B.querySelectorAll('.bn-grid>.bt'); if (!h || !a || T.length < 2) return;
    var m = cur(), live = !m || m.live, fin = m && m.fin, x = num(h), y = num(a), tag = fin ? 'Ganador' : 'Adelante';
    T[0].classList.toggle('es-lead', live && x > y); T[1].classList.toggle('es-lead', live && y > x);
    T[0].setAttribute('data-lead', tag); T[1].setAttribute('data-lead', tag);
    B.setAttribute('data-st', fin ? 'fin' : live ? 'live' : 'up');
    [[h, 'h', x], [a, 'a', y]].forEach(function (r) { if (last[r[1]] !== null && r[2] > last[r[1]]) bump(r[0]); last[r[1]] = r[2]; });
  }
  function bump(e) { e.classList.remove('es-bump'); void e.offsetWidth; e.classList.add('es-bump'); setTimeout(function () { e.classList.remove('es-bump'); }, 900); }

  // barra de tiempo del partido (90 minutos)
  function clock() {
    var c = $('#clk'), m = cur(); if (!prog || !c) return;
    var t = /(\d+):(\d+)/.exec(c.textContent || ''), pct = 0;
    if (m && m.fin) pct = 100; else if (m && m.live && t) pct = Math.min(100, (+t[1] * 60 + +t[2]) / 54);
    prog.firstChild.style.width = pct + '%'; prog.hidden = !(m && (m.live || m.fin));
    var half = prog.querySelector('em'); if (half) half.hidden = prog.hidden;
  }

  // barra de apoyo: reparte las reacciones de la afición
  var lastN = null;
  function count(e, to) { if (!e) return; var from = parseInt(e.textContent, 10); if (isNaN(from)) { e.textContent = to + '%'; return; } if (from === to) return; var t0 = performance.now(); cancelAnimationFrame(e._r);
    (function f(t) { var k = Math.min(1, (t - t0) / 600), v = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3))); e.textContent = v + '%'; if (k < 1) e._r = requestAnimationFrame(f); })(t0); }
  function kick(q) { var b = fan.querySelector(q); if (!b) return; b.classList.remove('es-kick'); void b.offsetWidth; b.classList.add('es-kick');
    var p = el('i', 'es-plus', '+1'); b.appendChild(p); setTimeout(function () { p.remove(); }, 800); }
  function fanBar() {
    var m = cur(); if (!fan || !m) return; var n = m.n || { h: 0, a: 0 }, tot = (n.h || 0) + (n.a || 0), ph = tot ? Math.round((n.h || 0) * 100 / tot) : 50;
    if (fan.style.getPropertyValue('--ph') !== ph + '%') fan.style.setProperty('--ph', ph + '%');
    count(fan.querySelector('.es-fh b'), ph); count(fan.querySelector('.es-fa b'), 100 - ph);
    if (lastN && (n.h || 0) > lastN.h) kick('.es-fh'); if (lastN && (n.a || 0) > lastN.a) kick('.es-fa'); lastN = { h: n.h || 0, a: n.a || 0 };
    fan.querySelector('.es-fb').setAttribute('data-lead', ph > 50 ? 'h' : ph < 50 ? 'a' : '');
    st(fan.querySelector('.es-fh span'), m.h || 'Local'); st(fan.querySelector('.es-fa span'), m.a || 'Visitante');
    st(fan.querySelector('.es-ft'), tot ? tot + (tot === 1 ? ' reacción' : ' reacciones') + ' · toca o mantén para apoyar' : 'Toca o mantén tu equipo para apoyar');
  }

  function build() {
    top = $('.bn-top', B); if (!top || top.querySelector('.es-tl')) return;
    var row = el('div', 'es-tl'), live = $('#bLive', B), lg = $('#bLg', B), tm = $('.bn-time', B), ctl = $('.bn-row', B);
    if (live) row.appendChild(live); if (tm) row.appendChild(tm);
    top.insertBefore(row, top.firstChild); if (lg) top.appendChild(lg); if (ctl) top.appendChild(ctl);
    prog = el('i', 'es-prog'); prog.appendChild(el('b')); prog.appendChild(el('em')); top.appendChild(prog);
    var grid = $('.bn-grid', B), T = B.querySelectorAll('.bn-grid>.bt');
    // debajo del marcador: posición y botón de reaccionar de cada equipo
    var info = el('div', 'es-info');
    [].forEach.call(T, function (t, i) { var c = el('div', 'es-ic ' + (i ? 'a' : 'h')), ps = $('.bn-pos', t), rx = $('.rx', t); if (ps) c.appendChild(ps); var g = el('div', 'es-rg'); if (rx) g.appendChild(rx); var sw = el('button', 'es-sw'); sw.type = 'button'; sw.title = 'Cambiar sticker'; sw.setAttribute('aria-label', 'Cambiar sticker'); sw.onclick = function () { var bn = window.MAGNA_BN; if (bn && bn.pick) bn.pick(i ? 'a' : 'h'); }; g.appendChild(sw); c.appendChild(g); info.appendChild(c); });
    if (grid) grid.parentNode.insertBefore(info, grid.nextSibling);
    [].forEach.call(T, function (t) { ['es-pt', 'es-sh', 'es-wm'].forEach(function (c) { var w = el('span', c); w.setAttribute('aria-hidden', 'true'); t.insertBefore(w, t.firstChild); }); });
    var scb = $('.sc', B); if (scb) { var md = el('div', 'es-min'); md.setAttribute('aria-hidden', 'true'); scb.appendChild(md); }
    fan = el('div', 'es-fan');
    fan.innerHTML = '<div class="es-sl es-s0 on"><div class="es-ft"></div><div class="es-fb" role="group" aria-label="Apoyo de la afición"><button type="button" class="es-fh"><span></span><b></b></button><button type="button" class="es-fa"><b></b><span></span></button></div></div><a class="es-sl es-ad" aria-live="polite"><em class="es-tg"></em><span class="es-tx"></span><i class="es-go" aria-hidden="true">→</i></a><div class="es-dots" aria-hidden="true"></div>';
    // tocar (o mantener) un lado de la barra = reaccionar por ese equipo
    function tap(k) { return function (e) { if (e.button > 0) return; var r = $('.rx[data-side="' + k + '"]', B); if (r) r.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 })); }; }
    B.addEventListener('pointerdown', function (e) { if (e.target.closest && e.target.closest('.rx,.dc,.es-fb')) { hold = Date.now() + 8000; if (showAd) { hold = 0; rotate(); hold = Date.now() + 8000; } } }, true);
    fan.querySelector('.es-fh').addEventListener('pointerdown', tap('h')); fan.querySelector('.es-fa').addEventListener('pointerdown', tap('a'));
    info.parentNode ? info.parentNode.insertBefore(fan, info.nextSibling) : null;
  }

  function deco() {
    var lg = $('#bLg'), mc = cur(), tx = (lg ? lg.textContent : '') + ' ' + (mc && mc.lg || ''), kd = /champions/i.test(tx) ? 'champions' : /(star|super)\s*nova/i.test(tx) ? 'starnova' : /omega/i.test(tx) ? 'omega' : /amistos/i.test(tx) ? 'amistoso' : /mundial/i.test(tx) ? 'mundial' : isLeague(tx, mc && mc.mid) ? 'liga' : ''; if ((B.getAttribute('data-comp') || '') !== kd) { if (kd) B.setAttribute('data-comp', kd); else B.removeAttribute('data-comp'); }
    var T = B.querySelectorAll('.bn-grid>.bt'), n = [$('#bN1'), $('#bN2')], m = cur(), md = $('.es-min', B), c = $('#clk');
    [].forEach.call(T, function (t, i) { var w = $('.es-wm', t), v = n[i] ? n[i].textContent : ''; if (w && w.textContent !== v) { w.textContent = v; t.classList.remove('es-in'); void t.offsetWidth; t.classList.add('es-in'); } });
    if (md) { var mm = /(\d+):/.exec(c ? c.textContent : ''); st(md, m && m.fin ? 'FINAL' : m && m.live ? (mm ? (+mm[1] + 1 > 90 ? '90+' : (+mm[1] + 1)) + '\u2019' : 'VIVO') : 'VS'); }
  }
  // anuncios que se turnan con la barra de apoyo cada 5 s
  var adI = 0, showAd = false, hold = 0;
  function ads() {
    var m = cur(), M = window.MAGNA, out = []; if (!m) return out;
    var S = M && M.S, sm = S && M.by ? M.by(S.matches, m.mid) : null, pv = null;
    try { if (sm && M.matchPreview) pv = M.matchPreview(sm); } catch (e) {}
    var mk = null; try { mk = M && M.marketState ? M.marketState() : null; } catch (e) {}
    if (!m.fin && (!mk || mk.open)) out.push({ t: 'Apuesta ya', c: 'bet', x: '¿Quién gana: ' + m.h + ' o ' + m.a + '? Juega tus Bits', u: 'apuestas.html' });
    if (pv) {
      var fav = pv.p >= .5 ? m.h : m.a, pc = Math.round((pv.p >= .5 ? pv.p : 1 - pv.p) * 100);
      if (!m.fin && pc >= 52) out.push({ t: 'Pronóstico', c: 'pro', x: (m.live ? 'Antes del partido: ' + fav + ' era favorito · ' : fav + ' llega como favorito · ') + pc + '% de ganar', u: 'apuestas.html' });
      if (pv.h2h && pv.h2h.n) { var l = pv.h2h.last[0]; out.push({ t: 'Cara a cara', c: 'h2h', x: m.h + ' ' + pv.h2h.h + ' – ' + pv.h2h.a + ' ' + m.a + ' en ' + pv.h2h.n + (pv.h2h.n === 1 ? ' duelo' : ' duelos') + (l ? ' · último: ' + l.h + '-' + l.a : '') }); }
      var fs = function (f) { var w = (f.s.match(/V/g) || []).length; return w + 'V ' + (f.n - w) + 'D'; };
      if (pv.form && (pv.form.h.n || pv.form.a.n)) out.push({ t: 'Racha', c: 'frm', x: m.h + ' ' + fs(pv.form.h) + ' · ' + m.a + ' ' + fs(pv.form.a) + ' (últimos partidos)' });
      if (pv.pos && pv.pos.h && pv.pos.a) out.push({ t: 'Ranking', c: 'rk', x: m.h + ' #' + pv.pos.h + ' vs ' + m.a + ' #' + pv.pos.a + ' de ' + pv.pos.of + ' equipos', u: 'ranking.html' });
    }
    var nw = S && S.news ? S.news.filter(function (n) { return n && n.text; }).slice(0, 2) : [];
    nw.forEach(function (n) { out.push({ t: 'Noticia', c: 'nw', x: String(n.text).replace(/\s+/g, ' ').slice(0, 110), u: 'noticias.html' }); });
    return out;
  }
  function rotate() {
    if (!fan || document.hidden) return 'hold'; if (hold > Date.now()) return 'hold';
    var L = ads(), s0 = $('.es-s0', fan), ad = $('.es-ad', fan); if (!L.length) { showAd = false; s0.classList.add('on'); ad.classList.remove('on'); return; }
    showAd = !showAd;
    if (showAd) { var a = L[adI % L.length]; adI++; ad.className = 'es-sl es-ad on es-' + a.c; st($('.es-tg', ad), a.t); st($('.es-tx', ad), a.x); if (a.u) { ad.href = a.u; ad.removeAttribute('aria-disabled'); } else { ad.removeAttribute('href'); ad.setAttribute('aria-disabled', 'true'); } $('.es-go', ad).hidden = !a.u; s0.classList.remove('on'); }
    else { ad.classList.remove('on'); s0.classList.add('on'); var fb = $('.es-fb', fan); fb.classList.remove('es-fill'); void fb.offsetWidth; fb.classList.add('es-fill'); }
    var d = $('.es-dots', fan); d.innerHTML = ''; for (var i = 0; i <= L.length; i++) { var b = el('i'); if ((showAd && i === ((adI - 1) % L.length) + 1) || (!showAd && i === 0)) b.className = 'on'; d.appendChild(b); }
  }
  // nombre completo de cada equipo en el marcador: se achica la letra hasta que quepa (y si es muy largo, pasa a 2 líneas)
  function names() { [].forEach.call(B.querySelectorAll('.bn-grid>.bt b.x'), function (b) { var t = b.textContent; if (b._t === t && b._w === b.parentNode.clientWidth) return; b._t = t; b._w = b.parentNode.clientWidth;
    b.style.fontSize = ''; b.classList.remove('es-2l'); var px0 = parseFloat(getComputedStyle(b).fontSize) || 20, px = px0, set = function (v) { b.style.setProperty('font-size', v + 'px', 'important'); };
    while (px > 16 && b.scrollWidth > b.clientWidth + 1) set(--px);
    if (b.scrollWidth > b.clientWidth + 1 && /\s/.test(t)) { // mejor en 2 líneas con letra grande que en 1 línea diminuta
      b.classList.add('es-2l'); px = px0; set(px); while (px > 12 && (b.scrollWidth > b.clientWidth + 1 || b.scrollHeight > px * 2.3)) set(--px); }
    else while (px > 11 && b.scrollWidth > b.clientWidth + 1) set(--px);
  }); }
  // miniaturas de partidos: torneo (para su fondo), número de tarjeta e inclinación alterna
  function cards() { var o = document.getElementById('otros'); if (!o) return; [].forEach.call(o.querySelectorAll('.mc'), function (c, i) {
    var t = (c.querySelector('.mc-cat span') || {}).textContent || '', k = /champions/i.test(t) ? 'champions' : /(star|super)\s*nova/i.test(t) ? 'starnova' : /omega/i.test(t) ? 'omega' : /amistos/i.test(t) ? 'amistoso' : /mundial/i.test(t) ? 'mundial' : isLeague(t) ? 'liga' : '';
    if ((c.getAttribute('data-comp') || '') !== k) { if (k) c.setAttribute('data-comp', k); else c.removeAttribute('data-comp'); }
    if (!c.style.getPropertyValue('--i')) { c.style.setProperty('--i', i); c.style.setProperty('--tilt', (i % 2 ? 1.2 : -1.2) + 'deg'); } }); }
  // transmisión del partido: botón en la franja superior y reproductor debajo del marcador
  var stOpen = null, stPl = null;
  function stream() {
    if (!window.MSTREAM || !B) return; var m = cur(), M = window.MAGNA, sm = m && M && M.S && M.by ? M.by(M.S.matches, m.mid) : null, url = sm && sm.stream && sm.status !== 'cancelled' ? sm.stream : null, s = url && MSTREAM.parse(url);
    var bt = $('.es-tv', B), row = $('.es-tl', B); B.toggleAttribute('data-tv', !!(s && sm.status === 'live'));
    if (!s) { if (bt) bt.remove(); if (stPl) { stPl.remove(); stPl = null; } stOpen = null; return; }
    if (!bt && row) { bt = el('button', 'es-tv'); bt.type = 'button'; bt.onclick = function (e) { e.stopPropagation(); stOpen = stOpen === url ? null : url; stream(); if (stOpen && stPl) stPl.scrollIntoView({ behavior: 'smooth', block: 'center' }); }; row.appendChild(bt); }
    if (bt) { var on = stOpen === url; bt.textContent = on ? '✕ Cerrar video' : sm.status === 'live' ? '📺 Ver transmisión' : sm.status === 'finished' ? '▶ Ver repetición' : '📺 Se transmite aquí'; bt.classList.toggle('on', on); }
    if (stOpen !== url && stPl) { stPl.remove(); stPl = null; }
    if (stOpen === url && !stPl) { stPl = el('section', 'es-stream'); var hd = el('div', 'es-sth'); hd.appendChild(el('b', null, (sm.status === 'live' ? '● EN VIVO · ' : '') + s.n)); hd.appendChild(el('span', null, (m.h || '') + ' vs ' + (m.a || ''))); stPl.appendChild(hd); stPl.appendChild(MSTREAM.player(url)); B.parentNode.insertBefore(stPl, B.nextSibling); }
  }
  function all() { lead(); clock(); fanBar(); deco(); names(); cards(); stream(); }

  // imágenes para descargar/compartir (marcador y alineación); match-poster.js se carga al pedirlas
  var LP = null;
  function poster(cb) { if (window.MagnaPoster) return cb(); if (LP) return LP.push(cb); LP = [cb]; var sc = document.createElement('script'); sc.src = 'match-poster.js'; sc.onload = function () { var q = LP; LP = null; q.forEach(function (f) { f(); }); }; sc.onerror = function () { LP = null; }; document.head.appendChild(sc); }
  function busy(btn, on) { if (!btn) return; btn.disabled = on; btn.classList.toggle('es-busy', on); }
  function scoreData() {
    var m = cur(), M = window.MAGNA; if (!m) return null; var S = M && M.S, sm = S && M.by ? M.by(S.matches, m.mid) : null, n = m.n || { h: 0, a: 0 }, tot = (n.h || 0) + (n.a || 0);
    function form(id) { var f = $(id); return f ? [].map.call(f.children, function (c) { return c.className; }) : []; }
    var x = +m.s[0] || 0, y = +m.s[1] || 0, md = $('.es-min', B), ck = $('#clk'), lg = $('#bLg');
    function team(nm, tid, fid, ld) { return { name: nm, crest: tid != null && M.crestUrl ? M.crestUrl(tid) : null, color: tid != null && M.teamColor ? M.teamColor(tid) : null, form: form(fid), lead: ld }; }
    return { kind: B.getAttribute('data-comp') || '', comp: lg ? lg.textContent : (m.lg || ''), clock: m.live && !m.fin && ck ? ck.textContent : (!m.live ? (m.when || '') : ''), live: !!m.live, fin: !!m.fin, hs: x, as: y, minute: md ? md.textContent : '',
      h: team(m.h, sm && sm.home, '#bF1', m.live && x > y), a: team(m.a, sm && sm.away, '#bF2', m.live && y > x), fanH: tot ? Math.round((n.h || 0) * 100 / tot) : 50, fanTot: tot,
      date: new Date().toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' }) };
  }
  window.MagnaShot = {
    score: function (btn) { var d = scoreData(); if (!d) return; busy(btn, true); poster(function () { MagnaPoster.score(d).then(function () { busy(btn, false); }, function () { busy(btn, false); }); }); },
    lineup: function (box, btn) { if (!box || !box._pd) return; var d = box._pd(); d.date = new Date().toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' }); busy(btn, true); poster(function () { MagnaPoster.lineup(d).then(function () { busy(btn, false); }, function () { busy(btn, false); }); }); }
  };
  function shotBtn() { var g = $('.vv-ctl', B); if (!g || g.querySelector('.es-dl')) return !!g; var b = el('button', 'es-dl'); b.type = 'button'; b.title = 'Descargar imagen del marcador'; b.setAttribute('aria-label', b.title); b.onclick = function (e) { e.stopPropagation(); window.MagnaShot.score(b); }; g.appendChild(b); return true; }
  function start() {
    B = document.getElementById('marcador'); if (!B) return; build(); all(); (function tryBtn(k) { if (!shotBtn() && k < 40) setTimeout(function () { tryBtn(k + 1); }, 250); })(0); (function tick() { var r = rotate(); setTimeout(tick, r === 'hold' ? 1000 : showAd ? 9000 : 5000); })();
    if (window.MutationObserver) var mo = new MutationObserver(all), o = { childList: true, characterData: true, subtree: true }; ['.bn-grid', '.es-info'].forEach(function (q) { var e = $(q, B); if (e) mo.observe(e, o); });
    var ot = document.getElementById('otros'); if (ot && window.MutationObserver) new MutationObserver(cards).observe(ot, { childList: true, subtree: true, characterData: true }); var c = $('#clk'); if (c && window.MutationObserver) new MutationObserver(function () { clock(); deco(); }).observe(c, { childList: true, characterData: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  window.addEventListener('resize', function () { if (B) names(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (B) { [].forEach.call(B.querySelectorAll('.bn-grid>.bt b.x'), function (b) { b._t = null; }); names(); } });
})();
