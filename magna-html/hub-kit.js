'use strict';
// Piezas comunes de las páginas centro (Eventos y Comunidad): números de portada, "Ahora mismo", cinta y banners.
window.HUB = (function () {
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches, spT = null, spI = 0, spHold = false;
  function $(s) { return document.querySelector(s); }
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function S() { return (window.MAGNA && MAGNA.S) || {}; }
  function crest(id) { var c = el('span', 'cr'); if (id == null || !window.MAGNA) { c.textContent = '?'; return c; } var u = MAGNA.crestUrl(id); c.style.setProperty('--tc', MAGNA.teamColor ? MAGNA.teamColor(id) : '#5a5080');
    if (u) { var im = el('img'); im.src = u; im.alt = ''; im.loading = 'lazy'; im.onerror = function () { im.remove(); c.textContent = String(MAGNA.teamName(id)).slice(0, 2).toUpperCase(); }; c.appendChild(im); } else c.textContent = String(MAGNA.teamName(id)).slice(0, 2).toUpperCase(); return c; }
  function img(src) { var c = el('span', 'cr'); var im = el('img'); im.src = src; im.alt = ''; im.loading = 'lazy'; c.appendChild(im); return c; }
  function short(id) { return String(MAGNA.teamName(id)).slice(0, 3).toUpperCase(); }
  function when(at) { if (!at) return NaN; var s = String(at); return new Date(/T/.test(s) || /[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : s.replace(' ', 'T') + 'Z').getTime(); }
  function left(at) { var d = when(at) - Date.now(); if (isNaN(d)) return ''; if (d <= 0) return 'ya'; var m = Math.floor(d / 60000), h = Math.floor(m / 60), dd = Math.floor(h / 24);
    return dd > 0 ? 'en ' + dd + ' d ' + (h % 24) + ' h' : h > 0 ? 'en ' + h + ' h ' + (m % 60) + ' min' : 'en ' + Math.max(1, m) + ' min'; }
  function ago(at) { var d = Date.now() - when(at); if (isNaN(d)) return ''; var m = Math.floor(d / 60000), h = Math.floor(m / 60), dd = Math.floor(h / 24); return d < 0 ? '' : dd > 0 ? 'hace ' + dd + ' d' : h > 0 ? 'hace ' + h + ' h' : 'hace ' + Math.max(1, m) + ' min'; }
  function fmt(n) { return Number(n || 0).toLocaleString('es-CO'); }
  function tick() { document.querySelectorAll('[data-at]').forEach(function (x) { x.textContent = (x.dataset.pre || '') + left(x.dataset.at); }); }
  setInterval(tick, 30000);
  var first = true;
  function countUp(b, v, txt) { if (RM || !first || typeof v !== 'number') { b.textContent = txt || String(v); return; } var t0 = performance.now(); (function st(t) { var k = Math.min(1, (t - t0) / 900), n = Math.round(v * (1 - Math.pow(1 - k, 3))); b.textContent = txt && k === 1 ? txt : fmt(n); if (k < 1) requestAnimationFrame(st); })(t0); }
  function stats(L) { var ks = $('#ks'); ks.innerHTML = ''; L.forEach(function (x, i) { var k = el('div', 'k'), b = el('b'); k.style.setProperty('--c', x[2]); k.style.animationDelay = i * 70 + 'ms'; k.appendChild(b); k.appendChild(el('span', null, x[1])); ks.appendChild(k); countUp(b, x[0], x[3]); }); }
  function done() { first = false; }
  // bloque de contenido dentro de un banner
  function pv(title, right) { var w = el('div', 'pv'), h = el('div', 'pv-h'); h.appendChild(el('span', null, title)); if (right) h.appendChild(el('span', null, right)); w.appendChild(h); return w; }
  // fila: [n] [escudo o imagen] nombre / sub  valor
  function prow(n, icon, name, val, sub) { var r = el('div', 'pr'); r.appendChild(el('span', 'n', String(n))); r.appendChild(icon || el('span')); var w = el('span'); w.appendChild(el('span', null, name)); if (sub) w.appendChild(el('small', null, sub)); r.appendChild(w); r.appendChild(el('em', null, val == null ? '' : String(val))); return r; }
  // banner: [imagen + nombre + estado] [contenido] [pie + botón]
  function card(o) {
    var a = el('a', 'cc'); a.href = o.href; a.style.setProperty('--c', o.color); a.style.animationDelay = (o.i || 0) * 60 + 'ms';
    var bg = el('div', 'bg'); bg.style.setProperty('--bg', o.bg); a.appendChild(bg);
    var c1 = el('div', 'c1'); if (o.tro) { var t = el('img', 'tr' + (o.mascot ? ' ms' : '')); t.src = o.tro; t.alt = ''; t.loading = 'lazy'; c1.appendChild(t); }
    var tx = el('div', 'tx'), top = el('div', 'top'); top.appendChild(el('span', 'st' + (o.live ? ' live' : o.on ? ' on' : ''), o.live ? 'En vivo' : o.status)); if (o.ph) top.appendChild(el('span', 'ph', o.ph)); tx.appendChild(top);
    tx.appendChild(el('h3', null, o.title)); if (o.ed) tx.appendChild(el('div', 'ed', o.ed));
    if (o.p != null) { var bar = el('div', 'bar'), i = el('i'); i.style.setProperty('--p', o.p + '%'); bar.appendChild(i); tx.appendChild(bar); }
    c1.appendChild(tx); a.appendChild(c1);
    var c2 = el('div', 'c2'); if (o.body) { var rows = [].slice.call(o.body.children).filter(function (x) { return x.classList.contains('pr') || x.classList.contains('kr'); }); if (rows.length > 1 && !o.oneCol) { var gd = el('div', o.cols ? 'pv-cols' : 'pv-g'); rows.forEach(function (x) { gd.appendChild(x); }); o.body.appendChild(gd); } c2.appendChild(o.body); } a.appendChild(c2);
    var f = el('div', 'ftr'), cd = el('span', 'cd' + (o.footRed ? ' r' : ''));
    if (o.footAt) { cd.appendChild(document.createTextNode(o.foot || '⏱ ')); var b = el('b'); b.dataset.at = o.footAt; b.textContent = left(o.footAt); cd.appendChild(b); } else cd.textContent = o.foot || '';
    f.appendChild(cd); f.appendChild(el('span', 'go', o.cta)); a.appendChild(f); return a; }
  // "Ahora mismo": diapositivas que rotan solas
  function spot(title, L, empty) {
    var sp = $('#sp'); clearInterval(spT); sp.innerHTML = '';
    var hd = el('div', 'sp-h'); hd.appendChild(el('b', null, title)); var dots = el('div', 'sp-dots'); hd.appendChild(dots); sp.appendChild(hd);
    var body = el('div', 'sp-b'); sp.appendChild(body);
    if (!L.length) { body.appendChild(el('div', 'sp-e', empty || 'Pronto habrá novedades.')); return; }
    L.forEach(function (x, i) { var s = el('a', 'sl2'); s.href = x.href; s.style.setProperty('--sc', x.color); var bgi = el('div', 'bgi'); bgi.style.setProperty('--bg', x.bg || 'none'); s.appendChild(bgi);
      var k1 = el('div', 'k1'); (x.chips || []).forEach(function (c) { k1.appendChild(el('span', c[1] || '', c[0])); }); s.appendChild(k1); s.appendChild(x.body);
      var ft = el('div', 'ft'); ft.appendChild(el('small', null, x.foot || '')); var em = el('em'); if (x.at) { em.dataset.at = x.at; em.dataset.pre = x.pre || '⏱ '; em.textContent = (x.pre || '⏱ ') + left(x.at); } else em.textContent = x.cta || 'Ver →'; ft.appendChild(em); s.appendChild(ft);
      body.appendChild(s); var d = el('button'); d.type = 'button'; d.setAttribute('aria-label', 'Ver ' + (i + 1)); d.onclick = function () { go(i); spHold = true; }; dots.appendChild(d); });
    function go(i) { spI = (i + L.length) % L.length; [].forEach.call(body.children, function (x, j) { x.classList.toggle('on', j === spI); }); [].forEach.call(dots.children, function (x, j) { x.classList.toggle('on', j === spI); }); sp.style.setProperty('--sc', L[spI].color); }
    go(Math.min(spI, L.length - 1)); sp.onmouseenter = function () { spHold = true; }; sp.onmouseleave = function () { spHold = false; };
    if (!RM && L.length > 1) spT = setInterval(function () { if (!spHold && !document.hidden) go(spI + 1); }, 5500); }
  // piezas del centro de una diapositiva
  function vs(a, b, mid, live) { var w = el('div', 'vs2'), A = el('div', 'tm'), B = el('div', 'tm'); A.appendChild(crest(a)); A.appendChild(el('b', null, MAGNA.teamName(a))); B.appendChild(crest(b)); B.appendChild(el('b', null, MAGNA.teamName(b))); w.appendChild(A); w.appendChild(el('span', 'sc' + (live ? '' : ' v'), mid)); w.appendChild(B); return w; }
  function hero(iconNode, name, sub) { var w = el('div', 'chm'); w.appendChild(iconNode); w.appendChild(el('b', null, name)); if (sub) w.appendChild(el('small', 'mono', sub)); return w; }
  function quote(t, sub) { var w = el('div', 'qt'); w.appendChild(el('b', null, t)); if (sub) w.appendChild(el('small', null, sub)); return w; }
  // cinta que se desplaza
  function ticker(items, label) { var tk = $('#tk'), t = $('#tkT'); if (!tk) return; tk.hidden = !items.length; if (!items.length) return; t.innerHTML = ''; tk.querySelector('.tk-l').textContent = label;
    var add = function () { items.forEach(function (x) { var a = el('a'); a.href = x.href; if (x.tag) a.appendChild(el('i', null, x.tag)); a.appendChild(document.createTextNode(x.text)); if (x.em) a.appendChild(el('em', null, x.em)); t.appendChild(a); }); };
    add(); add(); t.style.setProperty('--d', Math.max(24, items.length * 7) + 's'); }
  function sb() { return window.MAGNA_SB ? window.MAGNA_SB() : Promise.reject(new Error('sin conexión')); }
  return { $: $, el: el, S: S, crest: crest, img: img, short: short, when: when, left: left, ago: ago, fmt: fmt, stats: stats, done: done, pv: pv, prow: prow, card: card, spot: spot, vs: vs, hero: hero, quote: quote, ticker: ticker, sb: sb };
})();
