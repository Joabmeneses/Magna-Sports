'use strict';
// Tienda de cosméticos: se compran con Bits (moneda ficticia del sitio) y se equipan al momento.
(function () {
  var h = M.h, I = MAGNA_INV, root = document.getElementById('tn'), acc = null, inv = null, busy = false, ready = false;
  var tab = (location.hash || '').slice(1) || 'all', q = '', sort = 'rar', afford = false;
  var TABS = [['all', '✨', 'Todo'], ['color', '🎨', 'Colores'], ['plate', '🏷️', 'Placas'], ['frame', '🖼️', 'Marcos'], ['title', '🔤', 'Títulos'], ['excl', '🔒', 'Exclusivos'], ['wish', '❤️', 'Deseos'], ['own', '🎒', 'Lo mío']];
  var RO = { comun: 0, rara: 1, epica: 2, legendaria: 3, mitica: 4 }, ICO = { color: '🎨', plate: '🏷️', frame: '🖼️', title: '🔤' };
  if (!TABS.some(function (t) { return t[0] === tab; })) tab = 'all';

  // ---------- datos ----------
  var WISH = {}; try { WISH = JSON.parse(localStorage.getItem('magna_wish') || '{}') || {}; } catch (e) {}
  function saveWish() { try { localStorage.setItem('magna_wish', JSON.stringify(WISH)); } catch (e) {} }
  function owned(id) { return !!(inv && inv.rows.some(function (r) { return r.item_id === id; })); }
  function equipped(it) { return !!(inv && inv.eq[it.type] === it.id); }
  // quién lleva puesto cada cosmético (sale de los cosméticos públicos de los jugadores)
  function wearMap() { var m = {}; try { var c = JSON.parse(localStorage.getItem('magna_cos') || '{}') || {}; Object.keys(c).forEach(function (pid) { var eq = (c[pid] && c[pid].eq) || {}; Object.keys(eq).forEach(function (k) { if (eq[k]) (m[eq[k]] = m[eq[k]] || []).push(pid); }); }); } catch (e) {} return m; }
  function forSale() { return I.shop().filter(function (x) { return x.active !== false && !x.exclusive && !x.upg; }); }
  function ups(it) { return I.shop().filter(function (x) { return x.upg === it.id && x.active !== false; }).sort(function (a, b) { return a.lv - b.lv; }); }
  function topLv(it) { var lv = owned(it.id) ? 1 : 0; ups(it).forEach(function (u) { if (owned(u.id)) lv = Math.max(lv, u.lv); }); return lv; }
  function pname(pid) { var p = MAGNA.by(MAGNA.S.players, Number(pid)); return p ? p.name : ''; }

  // ---------- piezas ----------
  function bits(n, size) { var s = h('span', 'ts-pr'); s.appendChild(MAGNA_BIT(size || 18)); s.appendChild(h('b', null, I.fmt(n))); return s; }
  function ripple(b, e) { var r = b.getBoundingClientRect(), s = h('i', 'ts-rp'); s.style.left = ((e && e.clientX ? e.clientX : r.left + r.width / 2) - r.left) + 'px'; s.style.top = ((e && e.clientY ? e.clientY : r.top + r.height / 2) - r.top) + 'px'; b.appendChild(s); setTimeout(function () { s.remove(); }, 600); }
  function btn(cls, txt, fn) { var b = h('button', 'ts-b ' + (cls || '')); b.type = 'button'; if (txt != null) b.textContent = txt; b.onclick = function (e) { ripple(b, e); fn && fn(e); }; return b; }
  // botón de acción según el estado del artículo
  function actBtn(it, small) {
    var own = owned(it.id), on = own && equipped(it), b;
    if (on) { b = btn('eqp', '✓ Equipado'); b.disabled = true; }
    else if (own) b = btn('own', 'Equipar', function () { wear(it); });
    else if (it.exclusive) { b = btn('lock', '🔒 ' + (small ? 'Exclusivo' : (MAGNA.AWARD_TXT[it.award] || 'Exclusivo'))); b.disabled = true; }
    else if (!acc) b = btn('', 'Comprar', function () { location.href = 'cuenta.html'; });
    else if (Number(acc.bits) < Number(it.price || 0)) b = btn('poor', 'Te faltan ' + I.fmt(it.price - acc.bits), function () { view(it); });
    else b = btn('', 'Comprar', function () { view(it); });
    if (busy && !b.disabled) b.disabled = true;
    return b;
  }
  function heart(it) { var b = h('button', 'ts-hr' + (WISH[it.id] ? ' on' : '')); b.type = 'button'; b.setAttribute('aria-label', WISH[it.id] ? 'Quitar de deseos' : 'Añadir a deseos'); b.setAttribute('aria-pressed', !!WISH[it.id]); b.textContent = WISH[it.id] ? '❤' : '♡';
    b.onclick = function (e) { e.stopPropagation(); if (WISH[it.id]) delete WISH[it.id]; else WISH[it.id] = 1; saveWish(); var on = !!WISH[it.id]; [].forEach.call(document.querySelectorAll('.ts-hr[data-id="' + it.id + '"]'), function (x) { x.classList.toggle('on', on); x.textContent = on ? '❤' : '♡'; x.setAttribute('aria-pressed', on); x.classList.remove('pop'); void x.offsetWidth; x.classList.add('pop'); }); counts(); if (tab === 'wish') grid(); I.toast(on ? '❤ Guardado en tus deseos' : 'Quitado de tus deseos'); };
    b.dataset.id = it.id; return b; }
  function card(it, i, W) {
    var c = h('div', 'ts-c r-' + (it.rarity || 'comun') + (it.exclusive ? ' x' : '') + (owned(it.id) ? ' mine' : '')); c.style.animationDelay = Math.min(i, 16) * 35 + 'ms'; c.dataset.tilt = '8';
    var art = h('button', 'art'); art.type = 'button'; art.setAttribute('aria-label', 'Ver ' + it.name); art.onclick = function () { view(it); };
    art.appendChild(M.cosPreview(it, acc ? acc.display_name : 'Tu nombre', acc && acc.player_id));
    if (it.type === 'frame' && it.rarity === 'mitica') art.appendChild(h('span', 'evo-chip', '🧬 Evoluciona')); else if (it.type === 'frame' && it.lv && ups(it).length) art.appendChild(h('span', 'evo-chip up', '⬆️ 3 niveles'));
    if (it.type === 'plate' && it.rarity === 'mitica' && window.MAGNA_COS && MAGNA_COS.banner) { MAGNA_COS.banner(art, it.style, { lite: true }); art.classList.add('art-bn'); }
    art.appendChild(h('span', 'rr', (M.RAR[it.rarity] || 'Común')));
    if (owned(it.id)) art.appendChild(h('span', 'ok', equipped(it) ? '✓ Puesto' : '✓ Tuyo'));
    var wn = (W[it.id] || []).length; if (wn) art.appendChild(h('span', 'wr', '👥 ' + wn));
    c.appendChild(art); c.appendChild(heart(it));
    var tx = h('div', 'tx'); tx.appendChild(h('b', null, it.name)); tx.appendChild(h('small', null, ICO[it.type] + ' ' + M.KIND[it.type])); c.appendChild(tx);
    var bt = h('div', 'bot'), pr = h('div', 'pv'); pr.appendChild(h('small', null, it.exclusive ? 'Se gana' : 'Precio')); if (it.exclusive) pr.appendChild(h('span', 'ts-pr', '🏅 En la cancha')); else pr.appendChild(bits(it.price)); bt.appendChild(pr); bt.appendChild(actBtn(it, true)); c.appendChild(bt);
    if (it.exclusive) { var bd = acc && acc.player_id != null && it.award !== 'manual' && MAGNA.playerBadges(acc.player_id).filter(function (z) { return z.id === it.award; })[0];
      if (bd && !owned(it.id)) { var pg = h('div', 'tn-pg'), pi = h('i'); pi.style.width = Math.round(bd.v / bd.goal * 100) + '%'; pg.appendChild(pi); pg.appendChild(h('small', null, bd.ok ? '¡Desbloqueado! Llega en breve' : 'Tu progreso: ' + bd.v + ' / ' + bd.goal)); c.appendChild(pg); } }
    return c;
  }

  // ---------- portada ----------
  var cdT = null, countEls = {};
  function hero() {
    var L = forSale(), C = L.filter(function (x) { return x.rarity === 'mitica' || x.rarity === 'legendaria' || x.rarity === 'epica'; }), day = Math.floor(Date.now() / 864e5), next = (day + 1) * 864e5;
    var a = C[day % (C.length || 1)], b2 = C[(day * 7 + 3) % (C.length || 1)]; if (b2 === a) b2 = C[(C.indexOf(a) + 1) % C.length];
    var s = h('section', 'ts-h'), l = h('div', 'l');
    l.appendChild(h('div', 'ey', '🛍️ Tienda · Magna Arena'));
    var t = h('h1'); t.innerHTML = 'Colecciona <em>estilos</em><br>únicos para tu <em>nombre</em>'; l.appendChild(t);
    l.appendChild(h('p', null, 'Colores neón, placas, marcos y títulos que se ven en todo el sitio: en tu perfil, en las alineaciones y en el ranking. Se compran con Bits.'));
    var ac = h('div', 'cta'); ac.appendChild(btn('big', 'Explorar la tienda', function () { var c = document.getElementById('catalogo') || document.querySelector('.ts-s'); if (c) c.scrollIntoView({ behavior: 'smooth' }); }));
    var ib = btn('ghost big', acc ? '🎒 Mi inventario' : 'Entrar para comprar', function () { location.href = acc ? 'cuenta.html#inventario' : 'cuenta.html'; }); ac.appendChild(ib); l.appendChild(ac);
    var st = h('div', 'sts'), W = wearMap(), styled = {}; Object.keys(W).forEach(function (k) { W[k].forEach(function (p) { styled[p] = 1; }); });
    [[L.length, 'Cosméticos'], [L.filter(function (x) { return x.rarity === 'legendaria'; }).length, 'Legendarios'], [Object.keys(styled).length, 'Jugadores con estilo']].forEach(function (v) { var d = h('div'), n = h('b', null, '0'); d.appendChild(n); d.appendChild(h('small', null, v[1])); st.appendChild(d); count(n, v[0]); });
    l.appendChild(st); s.appendChild(l);
    var r = h('div', 'r');
    if (acc) { var bal = h('div', 'ts-bal'), bi = MAGNA_BIT(34); bal.appendChild(bi); var bv = h('div'); bv.appendChild(h('b', null, I.fmt(acc.bits))); bv.appendChild(h('small', null, 'Tus Bits')); bal.appendChild(bv); r.appendChild(bal); setTimeout(function () { MAGNA_BIT.burst(bi); }, 400); }
    if (a) r.appendChild(fcard(a, 'f1', next)); if (b2) r.appendChild(fcard(b2, 'f2'));
    var sp = h('div', 'ts-stamp'); sp.innerHTML = '<svg viewBox="0 0 100 100" aria-hidden="true"><defs><path id="tsCir" d="M50,50 m-37,0 a37,37 0 1,1 74,0 a37,37 0 1,1 -74,0"/></defs><text><textPath href="#tsCir">TIENDA MAGNA ✦ BITS ✦ ESTILO ✦ </textPath></text></svg>'; sp.appendChild(MAGNA_BIT(30)); r.appendChild(sp);
    s.appendChild(r); return s;
  }
  function fcard(it, cls, next) {
    var c = h('div', 'ts-f ' + cls + ' r-' + it.rarity), art = h('button', 'art'); art.type = 'button'; art.setAttribute('aria-label', 'Ver ' + it.name); art.onclick = function () { view(it); };
    art.appendChild(M.cosPreview(it, acc ? acc.display_name : 'Tu nombre', acc && acc.player_id));
    if (next) { var tm = h('span', 'tm'), tb = h('b', null, ARENA.until(next)); tm.appendChild(document.createTextNode('⏳ ')); tm.appendChild(tb); art.appendChild(tm);
      clearInterval(cdT); cdT = setInterval(function () { if (!document.body.contains(tb)) return clearInterval(cdT); if (Date.now() >= next) { clearInterval(cdT); return render(); } tb.textContent = ARENA.until(next); }, 1000); }
    else art.appendChild(h('span', 'tm', '🔥 Tendencia'));
    c.appendChild(art); var tx = h('div', 'tx'), nm = h('div'); nm.appendChild(h('b', null, it.name)); nm.appendChild(h('small', null, next ? '⭐ Destacado de hoy' : (M.RAR[it.rarity] + ' · ' + M.KIND[it.type]))); tx.appendChild(nm); tx.appendChild(heart(it)); c.appendChild(tx);
    var bt = h('div', 'bot'), pv = h('div', 'pv'); pv.appendChild(h('small', null, 'Precio')); pv.appendChild(bits(it.price, 16)); bt.appendChild(pv); bt.appendChild(actBtn(it, true)); c.appendChild(bt); return c;
  }
  function count(el, to) { if (!to) { el.textContent = '0'; return; } var t0 = performance.now(); (function f(n) { var k = Math.min(1, (n - t0) / 900); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f); })(t0); }
  function band() { var b = h('div', 'ts-band'), tr = h('div', 'trk'), w = ['🎨 Colores neón', '🏷️ Placas', '🖼️ Marcos', '🔤 Títulos', '🔒 Exclusivos', '🔥 Legendarios', '⭐ Destacado diario']; for (var k = 0; k < 3; k++) w.forEach(function (x) { tr.appendChild(h('span', null, x)); var o = MAGNA_BIT(20); tr.appendChild(o); }); b.appendChild(tr); var bw = h('div', 'ts-bw'); bw.appendChild(b); return bw; }

  // ---------- catálogo ----------
  var gridEl = null, chipsEl = null, toolsEl = null, infoEl = null;
  function list() {
    var L = I.shop().filter(function (x) { return !x.upg; }), W = wearMap(), ql = q.trim().toLowerCase();
    var it = L.filter(function (x) {
      if (tab === 'own') { if (!owned(x.id)) return false; }
      else if (tab === 'wish') { if (!WISH[x.id]) return false; if (x.active === false && !owned(x.id)) return false; }
      else { if (x.active === false && !owned(x.id)) return false; if (tab === 'excl') { if (!x.exclusive) return false; } else { if (x.exclusive) return false; if (tab !== 'all' && x.type !== tab) return false; } }
      if (ql && (x.name + ' ' + M.KIND[x.type] + ' ' + (M.RAR[x.rarity] || '')).toLowerCase().indexOf(ql) < 0) return false;
      if (afford && acc && (x.exclusive || owned(x.id) || Number(x.price) > Number(acc.bits))) return false;
      return true; });
    var S = { rar: function (a, b) { return (RO[b.rarity] || 0) - (RO[a.rarity] || 0) || (b.price || 0) - (a.price || 0); }, asc: function (a, b) { return (a.price || 0) - (b.price || 0); }, desc: function (a, b) { return (b.price || 0) - (a.price || 0); }, pop: function (a, b) { return (W[b.id] || []).length - (W[a.id] || []).length || (RO[b.rarity] || 0) - (RO[a.rarity] || 0); }, az: function (a, b) { return a.name.localeCompare(b.name, 'es'); } };
    return it.sort(S[sort] || S.rar);
  }
  function catalog() {
    var s = h('section', 'ts-s'); s.id = 'catalogo';
    var hd = h('div', 'ts-sh'); hd.appendChild(h('h2', null, 'Ofertas calientes 🔥')); if (acc) { var lk = h('button', 'ts-lk', 'Ver lo mío →'); lk.type = 'button'; lk.onclick = function () { setTab('own'); }; hd.appendChild(lk); } s.appendChild(hd);
    chipsEl = h('div', 'ts-chips'); chipsEl.setAttribute('role', 'tablist'); s.appendChild(chipsEl);
    toolsEl = h('div', 'ts-tools');
    var sw = h('label', 'ts-q'); sw.appendChild(h('span', null, '🔎')); var qi = h('input'); qi.type = 'search'; qi.placeholder = 'Buscar: neón, marco, oro…'; qi.value = q; qi.setAttribute('aria-label', 'Buscar cosméticos'); qi.oninput = function () { q = qi.value; grid(); }; sw.appendChild(qi); toolsEl.appendChild(sw);
    var so = h('label', 'ts-so'); so.appendChild(h('span', null, 'Ordenar')); var se = h('select'); [['rar', '💎 Rareza'], ['pop', '👥 Más usados'], ['asc', '⬆ Precio: menor'], ['desc', '⬇ Precio: mayor'], ['az', '🔤 A–Z']].forEach(function (o) { var op = h('option', null, o[1]); op.value = o[0]; se.appendChild(op); }); se.value = sort; se.onchange = function () { sort = se.value; grid(); }; so.appendChild(se); toolsEl.appendChild(so);
    if (acc) { var tg = h('button', 'ts-tg' + (afford ? ' on' : '')); tg.type = 'button'; tg.setAttribute('aria-pressed', afford); tg.appendChild(h('i')); tg.appendChild(document.createTextNode('Me alcanza')); tg.onclick = function () { afford = !afford; tg.classList.toggle('on', afford); tg.setAttribute('aria-pressed', afford); grid(); }; toolsEl.appendChild(tg); }
    s.appendChild(toolsEl);
    infoEl = h('p', 'ts-inf'); s.appendChild(infoEl);
    gridEl = h('div', 'ts-g'); s.appendChild(gridEl); counts(); grid(); return s;
  }
  function counts() { if (!chipsEl) return; chipsEl.innerHTML = ''; var L = I.shop().filter(function (x) { return !x.upg; });
    TABS.forEach(function (t) { if ((t[0] === 'own') && !acc) return;
      var n = t[0] === 'own' ? L.filter(function (x) { return owned(x.id); }).length : t[0] === 'wish' ? L.filter(function (x) { return WISH[x.id] && x.active !== false; }).length : t[0] === 'excl' ? L.filter(function (x) { return x.exclusive && x.active !== false; }).length : L.filter(function (x) { return x.active !== false && !x.exclusive && (t[0] === 'all' || x.type === t[0]); }).length;
      var b = h('button', 'ts-ch' + (tab === t[0] ? ' on' : '')); b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', tab === t[0]); b.appendChild(h('span', 'i', t[1])); b.appendChild(h('span', null, t[2])); b.appendChild(h('small', null, String(n))); b.onclick = function () { setTab(t[0]); }; chipsEl.appendChild(b); }); }
  function setTab(t) { tab = t; try { history.replaceState(null, '', '#' + tab); } catch (e) {} counts(); grid(); var c = document.getElementById('catalogo'); if (c && c.getBoundingClientRect().top < 0) c.scrollIntoView({ behavior: 'smooth' }); }
  function grid() {
    if (!gridEl) return; gridEl.innerHTML = ''; var items = list(), W = wearMap();
    infoEl.textContent = tab === 'excl' ? '🔒 Estos no se compran: se ganan en la cancha. Cuando desbloqueas la insignia, llegan solos a tu inventario.' : tab === 'wish' ? '❤️ Tus deseos se guardan en este dispositivo. Toca el corazón de cualquier cosmético para añadirlo.' : (items.length + (items.length === 1 ? ' cosmético' : ' cosméticos') + (q ? ' para “' + q + '”' : '') + (afford ? ' que te alcanzan' : ''));
    if (!items.length) { var e = h('div', 'tn-emp'); e.appendChild(h('b', null, tab === 'own' ? '🎒 Todavía no tienes cosméticos' : tab === 'wish' ? '♡ Tu lista de deseos está vacía' : '🔎 Nada por aquí')); e.appendChild(h('p', null, tab === 'own' ? '¡Elige el primero!' : tab === 'wish' ? 'Toca el corazón de los que te gusten.' : 'Prueba con otro filtro o búsqueda.'));
      if (q || afford || tab !== 'all') e.appendChild(btn('ghost', 'Ver todo', function () { q = ''; afford = false; tab = 'all'; render(); })); gridEl.appendChild(e); return; }
    // una fila deslizable por categoría (se dibuja al acercarse a la pantalla: menos trabajo para el celular)
    var G = [['color', 'Colores de nombre'], ['plate', 'Placas'], ['frame', 'Marcos'], ['title', 'Títulos']];
    G.forEach(function (g) { var L = items.filter(function (x) { return x.type === g[0]; }); if (!L.length) return;
      var row = h('div', 'ts-rw'), hd = h('div', 'ts-rwh'), tl = h('h3'); tl.appendChild(h('span', 'i', ICO[g[0]])); tl.appendChild(document.createTextNode(g[1])); tl.appendChild(h('small', null, String(L.length))); hd.appendChild(tl);
      var tr = h('div', 'ts-row'); tr.setAttribute('role', 'list');
      var ar = h('div', 'ts-rwa'); ['‹', '›'].forEach(function (a, k) { var b = h('button', null, a); b.type = 'button'; b.setAttribute('aria-label', (k ? 'Siguiente: ' : 'Anterior: ') + g[1]); b.onclick = function () { tr.scrollBy({ left: (k ? 1 : -1) * Math.max(240, tr.clientWidth * .85), behavior: 'smooth' }); }; ar.appendChild(b); }); hd.appendChild(ar);
      var bar = h('div', 'ts-rwp'), bi = h('i'); bar.appendChild(bi);
      tr.addEventListener('scroll', function () { var m = tr.scrollWidth - tr.clientWidth; bi.style.width = (m > 0 ? Math.max(12, (tr.scrollLeft + tr.clientWidth) / tr.scrollWidth * 100) : 100) + '%'; ar.classList.toggle('st', tr.scrollLeft < 4); ar.classList.toggle('en', tr.scrollLeft > m - 4); }, { passive: true });
      for (var k = 0; k < Math.min(L.length, 4); k++) tr.appendChild(h('div', 'ts-ph'));
      row.appendChild(hd); row.appendChild(tr); row.appendChild(bar); gridEl.appendChild(row);
      function fill() { if (row.dataset.ok) return; row.dataset.ok = '1'; tr.innerHTML = ''; L.forEach(function (it, i) { var c = card(it, i, W); c.setAttribute('role', 'listitem'); tr.appendChild(c); }); tr.dispatchEvent(new Event('scroll')); }
      if (window.IntersectionObserver) { var io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); fill(); } }, { rootMargin: '300px 0px' }); io.observe(row); } else fill(); });
  }

  // ---------- lo más usado + tendencia + banner ----------
  function top() {
    var W = wearMap(), L = forSale(), used = L.filter(function (x) { return (W[x.id] || []).length; }).sort(function (a, b) { return W[b.id].length - W[a.id].length || b.price - a.price; }), byUse = used.length >= 3;
    var rows = (byUse ? used : L.slice().sort(function (a, b) { return b.price - a.price; })).slice(0, 9); if (!rows.length) return null;
    var s = h('section', 'ts-s'), hd = h('div', 'ts-sh'); hd.appendChild(h('h2', null, byUse ? 'Lo más usado en ' : 'Los más codiciados de ')); hd.firstChild.appendChild(h('em', null, 'Magna')); var lk = h('button', 'ts-lk', 'Ver ranking →'); lk.type = 'button'; lk.onclick = function () { sort = byUse ? 'pop' : 'desc'; tab = 'all'; render(); document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth' }); }; hd.appendChild(lk); s.appendChild(hd);
    var g = h('div', 'ts-top'); rows.forEach(function (it, i) { var r = h('button', 'ts-tr r-' + it.rarity); r.type = 'button'; r.onclick = function () { view(it); }; r.appendChild(h('span', 'n', String(i + 1)));
      var sw = h('span', 'sw', ICO[it.type]); r.appendChild(sw); var tx = h('span', 'tx'); tx.appendChild(h('b', null, it.name)); tx.appendChild(h('small', null, M.RAR[it.rarity] + ' · ' + M.KIND[it.type])); r.appendChild(tx);
      var rt = h('span', 'rt'), wn = (W[it.id] || []).length; rt.appendChild(h('em', wn ? 'up' : '', wn ? '👥 ' + wn + (wn === 1 ? ' lo usa' : ' lo usan') : 'Nuevo')); rt.appendChild(bits(it.price, 14)); r.appendChild(rt); g.appendChild(r); });
    s.appendChild(g); return s;
  }
  // vitrina premium: la Colección Mítica, aparte y con su propio estilo
  // Sección especial: marcos con niveles que se compran (Dragón eterno, Navidad). Cada tarjeta muestra el marco pasando solo por sus 3 niveles.
  var SPX = { ouroboros: { k: 'fire', tag: '🐉 Legendario', pitch: 'Un dragón de fuego que se persigue la cola alrededor de tu avatar. Despiértalo y llévalo a la furia.' }, blackmatter: { k: 'ink', tag: '🖤 Legendario', pitch: 'Tinta viva con glitch de colores. En su nivel máximo la materia oscura se traga tu avatar, abre un ojo rojo de reptil y explota.' }, portal: { k: 'space', tag: '🌌 Legendario', pitch: 'Una galaxia alrededor de tu avatar: planetas en órbita, constelaciones y, en su nivel máximo, un agujero de gusano que se abre sobre ti.' }, magenta: { k: 'mag', tag: '⚡ Legendario', pitch: 'Energía magenta que gira sin control alrededor de tu avatar. Súbelo hasta la Singularidad: un agujero negro que lo traga y lo hace renacer.' }, navidad: { k: 'xmas', tag: '🎄 Edición Navidad', pitch: 'Corona de pino con esferas, luces que parpadean y, en su nivel máximo, estrella, trineo y nevada.' } };
  function special() { var L = forSale().filter(function (x) { return x.type === 'frame' && x.lv && ups(x).length; }); if (!L.length || !window.MAGNA_COS) return null;
    var s = h('section', 'ts-s ts-sp'), hd = h('div', 'ts-sph'); hd.appendChild(h('span', 'ts-spk', '✨ Edición especial')); hd.appendChild(h('h2', null, 'Marcos que suben de nivel')); hd.appendChild(h('p', null, 'Compra el marco y desbloquea su poder nivel por nivel. Cada mejora cambia cómo lo ve toda la comunidad.')); s.appendChild(hd);
    var g = h('div', 'ts-spg'); L.forEach(function (it) { var X = SPX[it.style] || { k: 'fire', tag: '✨ Especial', pitch: '' }, U = [it].concat(ups(it)), have = topLv(it), T = LVT[it.style] || [], c = h('article', 'ts-spc ' + X.k);
      var stg = h('div', 'ts-sps'), av = M.tierAv(acc ? acc.display_name : 'Tú', 80, 128); av.classList.add('fr-' + it.style); av.dataset.lvx = '1'; av.dataset.lv = Math.max(1, have); MAGNA_COS.deco(av); stg.appendChild(av); var lvb = h('span', 'ts-spl', 'Nv.' + Math.max(1, have)); stg.appendChild(lvb); c.appendChild(stg);
      var tx = h('div', 'ts-spt'); tx.appendChild(h('span', 'ts-spg2', X.tag)); tx.appendChild(h('h3', null, it.name)); tx.appendChild(h('p', null, X.pitch));
      var pl = h('div', 'ts-spp'); U.forEach(function (u, i) { var lv = u.lv || i + 1, b = h('button', 'ts-spv' + (have >= lv ? ' own' : '')); b.type = 'button'; b.appendChild(h('b', null, (T[i] && T[i][1]) || 'Nv.' + lv)); var pr = h('span'); pr.appendChild(MAGNA_BIT(11)); pr.appendChild(document.createTextNode(' ' + I.fmt(u.price))); b.appendChild(have >= lv ? h('span', null, '✓ Tuyo') : pr);
        b.onmouseenter = b.onfocus = function () { stop(); show(lv); }; b.onmouseleave = b.onblur = function () { auto(); }; b.onclick = function () { view(it); }; pl.appendChild(b); }); tx.appendChild(pl);
      var tot = U.reduce(function (a, u) { return a + Number(u.price || 0); }, 0); tx.appendChild(h('small', 'ts-spm', 'Completo: ' + I.fmt(tot) + ' Bits en total'));
      tx.appendChild(btn('big', have >= U.length ? '✓ Nivel máximo · Ver' : have ? '⬆️ Mejorar a Nv.' + (have + 1) : 'Comprar · ' + I.fmt(it.price) + ' Bits', function () { view(it); })); c.appendChild(tx);
      var cur = Math.max(1, have), T2 = null; function show(lv) { av.dataset.lv = lv; lvb.textContent = 'Nv.' + lv + ((T[lv - 1] && T[lv - 1][1]) ? ' · ' + T[lv - 1][1].split('· ')[1] : ''); [].forEach.call(pl.children, function (b, j) { b.classList.toggle('on', j === lv - 1); }); }
      function stop() { clearInterval(T2); } function auto() { stop(); if (matchMedia('(prefers-reduced-motion: reduce)').matches) return; T2 = setInterval(function () { if (!document.body.contains(c)) return stop(); if (document.hidden) return; cur = cur % U.length + 1; show(cur); }, 3200); }
      show(cur); auto(); g.appendChild(c); }); s.appendChild(g); return s; }
  function mythic() { var C = forSale().filter(function (x) { return x.rarity === 'mitica'; }).sort(function (a, b) { return a.price - b.price; }); if (!C.length) return null;
    var s = h('section', 'ts-s ts-my'), hd = h('div', 'ts-sh c'), tx = h('div'); tx.appendChild(h('span', 'my-ey', '💎 Nuevo · Edición limitada')); tx.appendChild(h('h2', null, 'Colección Mítica')); tx.appendChild(h('p', null, 'Lo más exclusivo de Magna Arena. Brillan, se mueven y se ven desde lejos. Solo para quien de verdad tenga Bits.')); hd.appendChild(tx); s.appendChild(hd);
    var spot = spotlight(C.filter(function (x) { return x.type === 'plate'; })); if (spot) s.appendChild(spot);
    var tabs = h('div', 'my-tb'), cur = 'all', wr = h('div', 'ts-car'), tr = h('div', 'trk'), W = wearMap();
    function fill() { tr.innerHTML = ''; C.filter(function (x) { return cur === 'all' || x.type === cur; }).forEach(function (it, i) { tr.appendChild(card(it, i, W)); }); tr.scrollLeft = 0; }
    [['all', 'Todo'], ['color', '🎨 Nombres'], ['plate', '🏷️ Placas'], ['frame', '🖼️ Marcos'], ['title', '🔤 Títulos']].forEach(function (t) { if (t[0] !== 'all' && !C.some(function (x) { return x.type === t[0]; })) return; var b = h('button', t[0] === cur ? 'on' : null, t[1]); b.type = 'button'; b.onclick = function () { cur = t[0]; [].forEach.call(tabs.children, function (y) { y.classList.toggle('on', y === b); }); fill(); }; tabs.appendChild(b); });
    s.appendChild(tabs); fill(); wr.appendChild(tr);
    ['‹', '›'].forEach(function (a, k) { var b = h('button', 'ts-ar ' + (k ? 'nx' : 'pv'), a); b.type = 'button'; b.setAttribute('aria-label', k ? 'Siguiente' : 'Anterior'); b.onclick = function () { tr.scrollBy({ left: (k ? 1 : -1) * Math.min(tr.clientWidth * .8, 600), behavior: 'smooth' }); }; wr.appendChild(b); });
    s.appendChild(wr); return s; }
  // vitrina grande: las placas míticas como portada de perfil, rotando solas
  var LVT = { blackmatter: [[1, 'Nv.1 · Tinta', 'Un anillo de tinta viva que hierve, con bordes que se parten en cian, magenta y amarillo'], [2, 'Nv.2 · Derrame', 'La tinta chorrea gotas sobre tu avatar, salta en salpicaduras y la imagen hace glitch'], [3, 'Nv.3 · Materia oscura', 'La tinta se traga tu avatar y abre un ojo rojo de reptil que te mira… y explota; reapareces partido en colores']], portal: [[1, 'Nv.1 · Órbita', 'Nebulosa, dos planetas en órbita, estrellas fugaces y un cohete que da vueltas echando fuego'], [2, 'Nv.2 · Constelación', 'Baja un OVNI, prende su rayo y se lleva una estrellita; constelaciones y un eclipse de planetas'], [3, 'Nv.3 · Agujero de gusano', 'Se abre el portal: el cohete entra en espiral, velocidad warp, sale un planeta hacia ti y el cohete regresa gigante']], jackpot: [[1, 'Nv.1 · Ficha', 'Marquesina de casino, la carta que se voltea y una moneda que lanzas al aire'], [2, 'Nv.2 · Racha', 'Una ruleta: la bola corre por los bombillos, frena y enciende el premio; fichas en órbita que saltan'], [3, 'Nv.3 · Premio mayor', 'Jalas la palanca y la tragamonedas gira sobre tu avatar: primero ¡CASI!, luego 7-7-7 y explota el JACKPOT']], ouroboros: [[1, 'Nv.1 · Dormido', 'Incluido con el marco: descansa, apagado y lento'], [2, 'Nv.2 · Despierto', 'Fuego vivo, ojo encendido y 2 brasas en órbita'], [3, 'Nv.3 · Furia', 'Llamas al rojo, aura de fuego y gira más rápido']], magenta: [[1, 'Nv.1 · Chispa', 'Un remolino de energía magenta, tenue y lento'], [2, 'Nv.2 · Corriente', 'Dos remolinos opuestos, brillo intenso y chispas en órbita'], [3, 'Nv.3 · Singularidad', 'Un agujero negro se traga tu avatar en espiral y lo hace renacer en cada estallido']], navidad: [[1, 'Nv.1 · Nevada', 'Incluido con el marco: corona de pino, esferas y moño'], [2, 'Nv.2 · Encendida', 'Luces de colores que parpadean y copos en órbita'], [3, 'Nv.3 · Noche mágica', 'Estrella dorada, trineo volando alrededor y nevada']] };
  // Niveles que se compran (Dragón eterno): Nv.1 viene con el marco; Nv.2 y Nv.3 son mejoras que se pagan aparte, en orden
  function upBox(it, close) { var box = h('div', 'cf-evo'), eh = h('div', 'cf-evh'), have = topLv(it), L = [it].concat(ups(it)), T = LVT[it.style] || [];
    eh.appendChild(h('b', null, '⬆️ Mejoras del marco')); eh.appendChild(h('small', null, 'Compra el marco y despiértalo nivel por nivel. Cada mejora se equipa sola.')); box.appendChild(eh);
    var lr = h('div', 'cf-evl'); L.forEach(function (x, i) { var lv = x.lv || i + 1, c = h('div', 'cf-lv' + (have >= lv ? ' on' : '')), av = M.tierAv(acc ? acc.display_name : 'Tú', 80, 54); av.classList.add('fr-' + x.style); av.dataset.lv = lv; av.dataset.lvx = '1'; MAGNA_COS.deco(av); var aw = h('div', 'cf-lva'); aw.appendChild(av); c.appendChild(aw);
      c.appendChild(h('b', null, (T[i] && T[i][1]) || 'Nv.' + lv)); c.appendChild(h('small', null, (T[i] && T[i][2]) || '')); var pr = h('span', 'cf-lvp'); pr.appendChild(MAGNA_BIT(12)); pr.appendChild(document.createTextNode(' ' + I.fmt(x.price))); c.appendChild(pr);
      if (i > 0 && acc) { if (have >= lv) { var ok = h('em', 'cf-lvk', inv && inv.eq.frame === x.id ? '✓ Puesto' : 'Tuyo'); if (!(inv && inv.eq.frame === x.id)) { ok = btn('own sm', 'Equipar', function () { close(); wear(x); }); } c.appendChild(ok); }
        else if (have === lv - 1 && have > 0) { var bb = btn('sm', Number(acc.bits) >= x.price ? 'Mejorar' : 'Te faltan ' + I.fmt(x.price - Number(acc.bits)), function () { bb.disabled = true; bb.textContent = 'Mejorando…';
            I.buy(x).then(function (nb) { acc.bits = nb; inv.rows.unshift({ item_id: x.id, kind: x.type, source: 'shop', price: x.price }); close(); return I.equip(x.type, x.id).then(function () { inv.eq[x.type] = x.id; I.syncSelf(acc, inv.eq); celebrate(x); }, function () { render(); }); }, function (e) { bb.disabled = false; bb.textContent = 'Mejorar'; I.toast(e.message || 'No se pudo mejorar', true); }); });
          if (Number(acc.bits) < x.price) bb.disabled = true; c.appendChild(bb); }
        else c.appendChild(h('em', 'cf-lvk lk', have ? '🔒 Primero Nv.' + (lv - 1) : '🔒 Compra el marco')); }
      lr.appendChild(c); }); box.appendChild(lr);
    box.appendChild(h('small', 'cf-evt', '👆 Pásale el dedo o el mouse para desatar su fuego.')); return box; }
  // vista de niveles para marcos exclusivos (no se compran): solo muestra los 3 niveles
  function lvShow(it) { var box = h('div', 'cf-evo'), eh = h('div', 'cf-evh'), T = LVT[it.style] || []; eh.appendChild(h('b', null, '✨ Los 3 niveles incluidos')); eh.appendChild(h('small', null, it.raffle ? 'El ganador del sorteo se lo lleva completo, ya en el nivel máximo.' : 'Exclusivo: la administración lo entrega completo, ya en el nivel máximo.')); box.appendChild(eh);
    var lr = h('div', 'cf-evl'); [1, 2, 3].forEach(function (lv, i) { var c = h('div', 'cf-lv on'), av = M.tierAv(acc ? acc.display_name : 'Tú', 80, 54); av.classList.add('fr-' + it.style); av.dataset.lv = lv; av.dataset.lvx = '1'; MAGNA_COS.deco(av); var aw = h('div', 'cf-lva'); aw.appendChild(av); c.appendChild(aw); c.appendChild(h('b', null, (T[i] && T[i][1]) || 'Nv.' + lv)); c.appendChild(h('small', null, (T[i] && T[i][2]) || '')); lr.appendChild(c); }); box.appendChild(lr); return box; }
  function spotlight(P) { if (!P.length || !window.MAGNA_COS || !MAGNA_COS.banner) return null;
    var w = h('div', 'my-sp'), bn = h('div', 'my-bn'), inf = h('div', 'my-in'), dots = h('div', 'my-dt'), i = 0, T = null, nm = acc ? acc.display_name : 'Tu nombre';
    var big = h('div', 'my-nm'), lb = h('span', 'my-lb'), tt = h('b', 'my-tt'), pr = h('div', 'my-pr'), go = btn('big', '💎 Ver placa', function () { view(P[i]); });
    inf.appendChild(lb); inf.appendChild(big); inf.appendChild(tt); inf.appendChild(pr); inf.appendChild(go); bn.appendChild(inf); w.appendChild(bn);
    P.forEach(function (it, k) { var d = h('button', null); d.type = 'button'; d.setAttribute('aria-label', it.name); d.onclick = function () { show(k); auto(); }; dots.appendChild(d); }); w.appendChild(dots);
    function show(k) { i = (k + P.length) % P.length; var it = P[i]; MAGNA_COS.banner(bn, it.style); bn.classList.remove('in'); void bn.offsetWidth; bn.classList.add('in');
      lb.textContent = 'Así se verá tu perfil'; big.textContent = nm; tt.textContent = it.name; pr.innerHTML = ''; pr.appendChild(bits(it.price)); if (owned(it.id)) pr.appendChild(h('span', 'ok', '✓ Ya es tuya'));
      [].forEach.call(dots.children, function (d, j) { d.classList.toggle('on', j === i); }); }
    function auto() { clearInterval(T); if (matchMedia('(prefers-reduced-motion: reduce)').matches) return; T = setInterval(function () { if (!document.hidden && document.body.contains(w)) show(i + 1); }, 5000); }
    bn.onmouseenter = function () { clearInterval(T); }; bn.onmouseleave = auto;
    show(0); auto(); return w; }
  function trend() {
    var C = forSale().filter(function (x) { return x.rarity === 'legendaria'; }); if (C.length < 3) C = forSale().filter(function (x) { return x.rarity !== 'comun'; }); if (!C.length) return null;
    var s = h('section', 'ts-s ts-tn'), hd = h('div', 'ts-sh c'); hd.appendChild(h('h2', null, 'Legendarios en tendencia ⚡')); s.appendChild(hd);
    var wr = h('div', 'ts-car'), tr = h('div', 'trk'), W = wearMap(); C.forEach(function (it, i) { tr.appendChild(card(it, i, W)); }); wr.appendChild(tr);
    ['‹', '›'].forEach(function (a, k) { var b = h('button', 'ts-ar ' + (k ? 'nx' : 'pv'), a); b.type = 'button'; b.setAttribute('aria-label', k ? 'Siguiente' : 'Anterior'); b.onclick = function () { tr.scrollBy({ left: (k ? 1 : -1) * Math.min(tr.clientWidth * .8, 600), behavior: 'smooth' }); }; wr.appendChild(b); });
    s.appendChild(wr); return s;
  }
  function cta() { var s = h('section', 'ts-cta'), l = h('div'); l.appendChild(h('h2', null, '¿Te faltan Bits?')); l.appendChild(h('p', null, 'Gánalos acertando pronósticos en Apuestas o en la Predicción de la llave. Son una moneda ficticia: solo sirven para darle estilo a tu nombre.')); s.appendChild(l);
    var r = h('div', 'cta'); r.appendChild(btn('big', '🎯 Ir a Apuestas', function () { location.href = 'apuestas.html'; })); r.appendChild(btn('ghost big', '🏆 Predicción', function () { location.href = 'prediccion.html'; })); s.appendChild(r); var o = MAGNA_BIT(120); o.classList.add('big'); s.appendChild(o); return s; }

  // ---------- vista rápida / compra ----------
  function view(it) {
    M.modal(function (b, close) { var w = h('div', 'cf r-' + (it.rarity || 'comun')), own = owned(it.id), on = own && equipped(it), W = wearMap()[it.id] || [];
      var tp = h('div', 'cf-t'); tp.appendChild(h('span', 'rr', M.RAR[it.rarity] || 'Común')); tp.appendChild(h('span', null, ICO[it.type] + ' ' + M.KIND[it.type])); w.appendChild(tp);
      w.appendChild(h('h3', 'x', it.name)); var pv = M.cosPreview(it, acc ? acc.display_name : 'Tu nombre', acc && acc.player_id); w.appendChild(pv); if (it.type === 'frame' && it.lv && ups(it).length && !it.exclusive) w.appendChild(upBox(it, close)); else if (it.type === 'frame' && it.lv && it.exclusive && window.MAGNA_COS) w.appendChild(lvShow(it)); else if (it.type === 'frame' && window.MAGNA_COS && MAGNA_COS.MYF && MAGNA_COS.MYF[it.style]) { var ev = h('div', 'cf-evo'), eh = h('div', 'cf-evh'); eh.appendChild(h('b', null, '🧬 Evoluciona contigo')); eh.appendChild(h('small', null, 'Sube de nivel jugando: cada partido suma 1 punto y cada MVP 3.')); ev.appendChild(eh);
      var me = acc && acc.player_id != null ? MAGNA_COS.evo(acc.player_id) : null, lr = h('div', 'cf-evl');
      (LVT[it.style] || [[1, 'Nv.1', 'Al comprarlo: gema y momento mítico'], [2, 'Nv.2', '15 pts: + 2 satélites en órbita'], [3, 'Nv.3', '40 pts: aura, 3 satélites y gema de oro']]).forEach(function (L) { var c = h('div', 'cf-lv' + (me && me.lv >= L[0] ? ' on' : '')), av = M.tierAv(acc ? acc.display_name : 'Tú', 80, 54); av.classList.add('fr-' + it.style); av.dataset.lv = L[0]; av.dataset.lvx = '1'; MAGNA_COS.deco(av); var aw = h('div', 'cf-lva'); aw.appendChild(av); c.appendChild(aw); c.appendChild(h('b', null, L[1])); c.appendChild(h('small', null, L[2])); lr.appendChild(c); });
      ev.appendChild(lr); if (me) { var pr2 = h('div', 'cf-evp'), bar = h('i'); bar.style.width = Math.min(100, me.pts / 40 * 100) + '%'; pr2.appendChild(bar); ev.appendChild(pr2); ev.appendChild(h('small', 'cf-evt', 'Tienes ' + me.pts + ' pts' + (me.next ? ' · te faltan ' + (me.next - me.pts) + ' para Nv.' + (me.lv + 1) : ' · ¡nivel máximo!'))); }
      ev.appendChild(h('small', 'cf-evt', '👆 Pásale el dedo o el mouse a un marco mítico para desatar su poder.')); w.appendChild(ev); }
    if (it.type === 'plate' && window.MAGNA_COS && MAGNA_COS.banner) { var vb = h('div', 'cf-bn'); vb.appendChild(h('small', null, 'Portada de tu perfil')); vb.appendChild(h('b', null, acc ? acc.display_name : 'Tu nombre')); MAGNA_COS.banner(vb, it.style); w.appendChild(vb); } w.appendChild(ctx(it));
      if (W.length) { var wr = h('div', 'cf-w'), av = h('div', 'avs'); W.slice(0, 5).forEach(function (pid) { av.appendChild(M.tierAv(pname(pid), null, 30, pid)); }); wr.appendChild(av); wr.appendChild(h('span', null, W.length === 1 ? 'Lo lleva ' + pname(W[0]) : 'Lo llevan ' + W.length + ' jugadores')); w.appendChild(wr); }
      if (it.exclusive) { if (it.raffle) { var rf = h('p', 'sub', '🎟️ Exclusivo: solo se gana en el Sorteo, con sus 3 niveles. '); var ra = h('a', null, 'Ir al sorteo →'); ra.href = 'sorteo.html'; rf.appendChild(ra); w.appendChild(rf); } else w.appendChild(h('p', 'sub', '🔒 ' + (MAGNA.AWARD_TXT[it.award] || 'Exclusivo: lo entrega la administración.'))); }
      var r2 = h('div', 'r'), no = btn('ghost', own || it.exclusive ? 'Cerrar' : 'Cancelar', close); r2.appendChild(no);
      if (!it.exclusive && !own && acc) {
        var after = Number(acc.bits) - Number(it.price || 0), sm = h('div', 'sum'); [['Precio', I.fmt(it.price)], ['Tu saldo', I.fmt(acc.bits)], ['Te quedan', after < 0 ? '—' : I.fmt(after)]].forEach(function (x) { sm.appendChild(h('span', null, x[0])); var v = h('b'); v.appendChild(MAGNA_BIT(14)); v.appendChild(document.createTextNode(' ' + x[1])); sm.appendChild(v); }); w.insertBefore(sm, null);
        var mt = h('div', 'cf-m'), mi = h('i'); mi.style.width = Math.min(100, Math.round(Number(acc.bits) / Math.max(1, it.price) * 100)) + '%'; mt.appendChild(mi); w.appendChild(mt);
        if (after < 0) { w.appendChild(h('p', 'sub', 'Te faltan ' + I.fmt(-after) + ' Bits. Puedes ganarlos en Apuestas.')); r2.appendChild(btn('', '🎯 Ganar Bits', function () { location.href = 'apuestas.html'; })); }
        else { var go = btn('', 'Comprar y equipar', function () { go.disabled = true; go.textContent = 'Comprando…';
          I.buy(it).then(function (nb) { acc.bits = nb; inv.rows.unshift({ item_id: it.id, kind: it.type, source: 'shop', price: it.price }); close(); return I.equip(it.type, it.id).then(function () { inv.eq[it.type] = it.id; I.syncSelf(acc, inv.eq); celebrate(it); }, function () { I.toast('Comprado. Equípalo desde Lo mío.'); render(); }); },
            function (e) { go.disabled = false; go.textContent = 'Comprar y equipar'; I.toast(e.message || 'No se pudo comprar', true); }); }); r2.appendChild(go); }
      } else if (!it.exclusive && !acc) r2.appendChild(btn('', 'Entrar para comprar', function () { location.href = 'cuenta.html'; }));
      else if (own && !on) r2.appendChild(btn('own', 'Equipar', function () { close(); wear(it); }));
      else if (on) { var eb = btn('eqp', '✓ Ya lo llevas puesto'); eb.disabled = true; r2.appendChild(eb); }
      var hb = heart(it); hb.classList.add('in'); r2.appendChild(hb);
      w.appendChild(r2); b.appendChild(w); });
  }
  // mini escenas: el cosmético dentro del ranking, una alineación y el perfil; se puede combinar con lo que ya llevas
  var combo = true;
  function ctx(it) {
    var box = h('div', 'cx'), nm = acc ? acc.display_name : 'Tu nombre', pid = acc && acc.player_id, x = pid != null ? (MAGNA.playerStats()[pid] || {}) : {};
    var tabs = h('div', 'cx-t'), stage = h('div', 'cx-s'), cur = 'rank', hasEq = !!(inv && Object.keys(inv.eq || {}).some(function (k) { return inv.eq[k] && k !== it.type; }));
    function eqNow() { var e = {}; if (combo && inv) Object.keys(inv.eq || {}).forEach(function (k) { if (inv.eq[k]) e[k] = inv.eq[k]; }); e[it.type] = it.id; return e; }
    function av(size, e) { var a = M.tierAv(nm, x.media != null ? x.media : 70, size, pid); var f = e.frame && M.item(e.frame); if (f && f.type === 'frame') { a.classList.add('fr-' + f.style); if (f.lv) a.dataset.lvi = f.lv; } return a; }
    function name(e, big) { var n = h('span', 'mpn'); n.appendChild(h('span', 'mpn-n', nm)); M.nameStyle(n, e); var t = e.title && M.item(e.title); if (t && t.type === 'title') n.appendChild(h('small', 'mpn-t tr-' + (t.rarity || 'comun'), t.name)); if (big) n.style.fontSize = '26px'; return n; }
    function draw() { stage.innerHTML = ''; var e = eqNow(), sc;
      if (cur === 'rank') { sc = h('div', 'cx-rk'); [['2', 'Zirma', 84], ['1', null, 0], ['3', 'Gowther', 81]].sort(function (a, b) { return a[0] - b[0]; }).forEach(function (r) { var row = h('div', 'cx-row' + (r[1] ? '' : ' me')); row.appendChild(h('b', 'n', r[0])); if (r[1]) { row.appendChild(M.tierAv(r[1], r[2], 30)); row.appendChild(h('span', 'o', r[1])); } else { row.appendChild(av(30, e)); row.appendChild(name(e)); } row.appendChild(h('em', null, r[1] ? String(r[2]) : 'TÚ')); sc.appendChild(row); }); }
      else if (cur === 'pitch') { sc = h('div', 'cx-pt'); ['Zirma', null, 'Gowther'].forEach(function (n2, i) { var tk = h('div', 'tk' + (n2 ? '' : ' me')); tk.style.left = [20, 50, 80][i] + '%'; tk.style.top = [62, 36, 62][i] + '%'; tk.appendChild(n2 ? M.tierAv(n2, 75, 40) : av(46, e)); var nn = n2 ? h('span', 'o', n2) : name(e); tk.appendChild(nn); sc.appendChild(tk); }); }
      else { sc = h('div', 'cx-pf'); sc.appendChild(av(84, e)); var d = h('div'); d.appendChild(name(e, true)); d.appendChild(h('small', null, 'Perfil público · Magna Arena')); sc.appendChild(d); }
      stage.appendChild(sc); }
    [['rank', '🏆 Ranking'], ['pitch', '⚽ Alineación'], ['prof', '👤 Perfil']].forEach(function (t) { var b = h('button', t[0] === cur ? 'on' : '', t[1]); b.type = 'button'; b.onclick = function () { cur = t[0]; [].forEach.call(tabs.children, function (c) { c.classList.toggle('on', c === b); }); draw(); }; tabs.appendChild(b); });
    box.appendChild(h('small', 'cx-l', 'Así se ve en…')); box.appendChild(tabs); box.appendChild(stage);
    if (hasEq) { var tg = h('button', 'ts-tg cx-c' + (combo ? ' on' : '')); tg.type = 'button'; tg.setAttribute('aria-pressed', combo); tg.appendChild(h('i')); tg.appendChild(document.createTextNode('Combinar con lo que llevas puesto')); tg.onclick = function () { combo = !combo; tg.classList.toggle('on', combo); tg.setAttribute('aria-pressed', combo); draw(); }; box.appendChild(tg); }
    draw(); return box;
  }
  function celebrate(it) { render(); I.toast('🎉 ¡' + it.name + ' es tuyo y ya lo llevas puesto!');
    var bal = document.querySelector('.ts-bal'); if (bal) MAGNA_BIT.burst(bal, 18);
    var fx = h('div', 'ts-win'), in2 = h('div', 'in'); in2.appendChild(h('small', null, '¡Nuevo cosmético!')); in2.appendChild(M.cosPreview(it, acc.display_name, acc.player_id)); in2.appendChild(h('b', null, it.name)); fx.appendChild(in2);
    for (var k = 0; k < 26; k++) { var p = h('i', 'cf2'); p.style.left = Math.random() * 100 + '%'; p.style.background = ['#c6f432', '#ffd23f', '#ff5ad1', '#22d3ee', '#ff8a00'][k % 5]; p.style.animationDelay = Math.random() * .5 + 's'; p.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg'); fx.appendChild(p); }
    fx.onclick = function () { fx.remove(); }; document.body.appendChild(fx); setTimeout(function () { fx.classList.add('out'); setTimeout(function () { fx.remove(); }, 400); }, 2200); }
  function wear(it) { busy = true; render(); I.equip(it.type, it.id).then(function () { busy = false; inv.eq[it.type] = it.id; I.syncSelf(acc, inv.eq); I.toast('¡' + it.name + ' equipado!'); render(); }, function (e) { busy = false; I.toast(e.message || 'No se pudo equipar', true); render(); }); }

  // ---------- montaje ----------
  function render() {
    var y = window.scrollY; root.innerHTML = ''; gridEl = null;
    if (!I.shop().filter(function (x) { return x.active !== false; }).length) { root.appendChild(hero()); var e = h('div', 'tn-emp'); e.style.marginTop = '26px'; e.appendChild(h('b', null, '🛍️ La tienda abre muy pronto')); e.appendChild(h('p', null, 'La administración está preparando los primeros cosméticos.')); root.appendChild(e); return; }
    root.appendChild(hero()); root.appendChild(band());
    if (acc && inv) { var me = h('div', 'ts-me'); me.appendChild(h('small', null, 'Así te ven los demás')); me.appendChild(I.card(acc, inv.eq)); root.appendChild(me); }
    var spc = special(); if (spc) root.appendChild(spc); root.appendChild(catalog()); var t1 = top(); if (t1) root.appendChild(t1); var t2 = trend(); if (t2) root.appendChild(t2); root.appendChild(cta());
    window.scrollTo(0, y);
  }
  function boot() { render();
    if (!window.ACCOUNTS) { ready = true; return render(); }
    ACCOUNTS.me().then(function (a) { acc = a; ready = true; if (!a) return render(); return I.data().then(function (d) { inv = d; render(); }, function () { inv = { rows: [], eq: {} }; render(); }); }, function () { ready = true; render(); }); }
  window.addEventListener('magna:update', function () { if (!busy) render(); });
  window.addEventListener('magna:cosloaded', function () { if (!busy && !(document.activeElement && document.activeElement.type === 'search') && !document.querySelector('.ts-win')) render(); });
  window.addEventListener('magna:cos', function () { if (!busy && document.activeElement && document.activeElement.type !== 'search') render(); });
  if (document.readyState === 'complete') boot(); else addEventListener('load', boot);
})();
