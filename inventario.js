'use strict';
// Inventario de cosméticos de la cuenta conectada: comprar con Bits, equipar y quitar. Lo usan Mi cuenta y la Tienda.
window.MAGNA_INV = (function () {
  var h = M.h, SL = ['color', 'plate', 'frame', 'title'], ICO = { color: '🎨', plate: '🏷️', frame: '🖼️', title: '🔤' };
  function sb() { return window.MAGNA_SB ? window.MAGNA_SB() : Promise.reject(new Error('Sin conexión')); }
  function err(r) { if (r && r.error) throw r.error; return r; }
  function fmt(n) { return String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function toast(t, bad) { var x = h('div', 'inv-toast', t); x.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:95;background:#131833;border:1px solid ' + (bad ? '#ff5a6a' : '#2ee59d') + ';color:#fff;padding:12px 18px;border-radius:14px;font:600 14px Archivo,sans-serif;max-width:calc(100vw - 24px);box-shadow:0 12px 30px rgba(0,0,0,.4)'; document.body.appendChild(x); setTimeout(function () { x.remove(); }, 3200); }
  function shop() { return ((MAGNA.S && MAGNA.S.shop) || []); }
  // {rows:[{item_id,kind,source,price,at}], eq:{}}
  function data() { return sb().then(function (c) { return c.rpc('my_inventory'); }).then(err).then(function (r) { var L = r.data || [], eq = (L[0] && L[0].equipped) || {}; return { rows: L.filter(function (x) { return x.item_id; }), eq: eq }; }); }
  function syncSelf(acc, eq) { if (!acc || acc.player_id == null) return; try { var c = JSON.parse(localStorage.getItem('magna_cos') || '{}') || {}; c[acc.player_id] = { eq: eq || {} }; localStorage.setItem('magna_cos', JSON.stringify(c)); } catch (e) {} window.dispatchEvent(new Event('magna:cos')); }
  function buy(it) { return sb().then(function (c) { return c.rpc('shop_buy', { p_item: it.id }); }).then(err).then(function (r) { if (window.MAGNA_ME && MAGNA_ME.refresh) MAGNA_ME.refresh(); return Number(r.data); }); }
  function equip(slot, id) { return sb().then(function (c) { return c.rpc('equip_item', { p_slot: slot, p_item: id || null }); }).then(err); }

  // tarjeta con el nombre equipado tal como lo ven los demás
  function card(acc, eq) { var w = h('div', 'inv-card'), pid = acc.player_id, p = pid != null && MAGNA.by(MAGNA.S.players, pid), x = p ? (MAGNA.playerStats()[pid] || {}) : {};
    var av = M.tierAv(acc.display_name, x.media, 72); if (acc.avatar && /^a\d\d$/.test(acc.avatar)) { av.style.backgroundImage = 'url("avatars/' + acc.avatar + '.webp")'; av.classList.add('has-pav'); }
    var fr = eq.frame && M.item(eq.frame); if (fr && fr.type === 'frame') av.classList.add('fr-' + fr.style); w.appendChild(av);
    var d = h('div'), n = h('span', 'mpn'); n.appendChild(h('span', 'mpn-n', acc.display_name)); M.nameStyle(n, eq); var ti = eq.title && M.item(eq.title); if (ti && ti.type === 'title') n.appendChild(h('small', 'mpn-t', ti.name)); d.appendChild(n);
    d.appendChild(h('small', 'inv-h', 'Así te ven en rankings, alineaciones y tu perfil.')); w.appendChild(d); return w; }

  // sección "Mi inventario" (Mi cuenta)
  function mount(acc) {
    var sec = h('section', 'inv'); sec.id = 'inventario'; var hd = h('div', 'inv-top'); hd.appendChild(h('h2', 'x', 'Mi inventario')); var lk = h('div', 'inv-lk');
    if (acc.player_id != null) { var a1 = h('a', 'btn2', 'Ver mi perfil'); a1.href = M.profileUrl(acc.player_id); lk.appendChild(a1); } var a2 = h('a', 'btn2 o', '🛍️ Ir a la tienda'); a2.href = 'tienda.html'; lk.appendChild(a2); hd.appendChild(lk); sec.appendChild(hd);
    var body = h('div'); body.appendChild(M.skel(2)); sec.appendChild(body);
    var st = { rows: [], eq: {} }, busy = false;
    function draw() { body.innerHTML = ''; body.appendChild(card(acc, st.eq));
      var own = st.rows.map(function (r) { var it = M.item(r.item_id); return it ? { it: it, r: r } : null; }).filter(Boolean);
      if (!own.length) { var e = h('div', 'inv-emp'); e.appendChild(h('b', null, 'Todavía no tienes cosméticos')); e.appendChild(h('p', null, 'Compra colores de nombre, placas, marcos y títulos con tus Bits, o gánalos como regalo de la administración.')); var g = h('a', 'btn2 o', 'Ver la tienda'); g.href = 'tienda.html'; e.appendChild(g); body.appendChild(e); return; }
      SL.forEach(function (sl) { var mine = own.filter(function (o) { return o.it.type === sl; }); var bx = h('div', 'inv-sl'), t = h('div', 'inv-slh'); t.appendChild(h('b', null, ICO[sl] + ' ' + M.KIND[sl])); t.appendChild(h('small', null, mine.length ? mine.length + (mine.length === 1 ? ' artículo' : ' artículos') : 'No tienes ninguno')); bx.appendChild(t);
        var row = h('div', 'inv-row');
        if (mine.length) { var off = h('button', 'inv-it inv-off' + (!st.eq[sl] ? ' on' : '')); off.type = 'button'; off.appendChild(h('span', 'inv-x', 'Ninguno')); off.onclick = function () { set(sl, null); }; off.disabled = busy; row.appendChild(off); }
        mine.forEach(function (o) { var b = h('button', 'inv-it' + (st.eq[sl] === o.it.id ? ' on' : '')); b.type = 'button'; b.title = o.it.name; b.disabled = busy; b.appendChild(M.cosPreview(o.it, acc.display_name, acc.player_id)); var lb = h('span', 'inv-lb'); lb.appendChild(h('span', null, o.it.name)); lb.appendChild(h('span', 'rar rar-' + (o.it.rarity || 'comun'), (M.RAR[o.it.rarity] || 'Común') + (o.r.source === 'gift' ? ' · 🎁' : ''))); b.appendChild(lb);
          b.onclick = function () { set(sl, st.eq[sl] === o.it.id ? null : o.it.id); }; row.appendChild(b); });
        if (!mine.length) { var s2 = h('a', 'inv-shop', 'Conseguir en la tienda →'); s2.href = 'tienda.html#' + sl; row.appendChild(s2); }
        bx.appendChild(row); body.appendChild(bx); }); }
    function set(sl, id) { if (busy) return; busy = true; var prev = st.eq[sl]; if (id) st.eq[sl] = id; else delete st.eq[sl]; draw();
      equip(sl, id).then(function () { busy = false; syncSelf(acc, st.eq); draw(); toast(id ? '¡Equipado!' : 'Quitado'); }, function (e) { busy = false; if (prev) st.eq[sl] = prev; else delete st.eq[sl]; draw(); toast(e.message || 'No se pudo guardar', true); }); }
    function load() { data().then(function (d) { st = d; draw(); if (location.hash === '#inventario') setTimeout(function () { sec.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 200); }, function () { body.innerHTML = ''; body.appendChild(h('p', 'sub', 'No se pudo cargar tu inventario.')); }); }
    load(); window.addEventListener('magna:update', function () { if (!busy) draw(); });
    return sec;
  }
  return { data: data, buy: buy, equip: equip, syncSelf: syncSelf, mount: mount, card: card, toast: toast, fmt: fmt, shop: shop, SL: SL, ICO: ICO };
})();
