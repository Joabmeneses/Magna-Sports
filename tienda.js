'use strict';
// Tienda de cosméticos: se compran con Bits (moneda ficticia del sitio) y se equipan al momento.
(function () {
  var h = M.h, I = MAGNA_INV, root = document.getElementById('tn'), acc = null, inv = null, tab = (location.hash || '').slice(1) || 'all', busy = false, ready = false;
  var TABS = [['all', '✨ Todo'], ['color', '🎨 Colores'], ['plate', '🏷️ Placas'], ['frame', '🖼️ Marcos'], ['title', '🔤 Títulos'], ['own', '🎒 Lo mío']], RO = { comun: 0, rara: 1, epica: 2, legendaria: 3 };
  function owned(id) { return !!(inv && inv.rows.some(function (r) { return r.item_id === id; })); }
  function render() {
    root.innerHTML = ''; var L = I.shop();
    var hd = h('section', 'tn-h'), tx = h('div'); tx.appendChild(h('div', 'ey', 'Cosméticos · Magna Arena')); tx.appendChild(h('h1', 'x', 'Tienda')); tx.appendChild(h('p', null, 'Dale estilo a tu nombre: colores neón, placas, marcos para tu foto y títulos. Se compran con Bits y se ven en todo el sitio.')); hd.appendChild(tx);
    var bl = h('div', 'tn-bal');
    if (acc) { var b = h('div', 'b'); b.appendChild(h('span', null, '🪙')); b.appendChild(document.createTextNode(I.fmt(acc.bits))); bl.appendChild(b); bl.appendChild(h('small', null, 'Tus Bits')); var a = h('a', null, '🎒 Mi inventario →'); a.href = 'cuenta.html#inventario'; bl.appendChild(a); }
    else if (ready) { var a2 = h('a', 'btn2 o', 'Entra para comprar'); a2.href = 'cuenta.html'; bl.appendChild(a2); bl.appendChild(h('small', null, 'Necesitas tu cuenta de Magna')); }
    hd.appendChild(bl); root.appendChild(hd);
    if (acc && inv) { var me = h('div', 'tn-me'); me.appendChild(I.card(acc, inv.eq)); root.appendChild(me); }
    if (!L.filter(function (x) { return x.active !== false; }).length) { var e = h('div', 'tn-emp'); e.style.marginTop = '26px'; e.appendChild(h('b', null, '🛍️ La tienda abre muy pronto')); e.appendChild(h('p', null, 'La administración está preparando los primeros cosméticos.')); root.appendChild(e); return; }
    var tb = h('div', 'tn-tabs'); TABS.forEach(function (t) { if (t[0] === 'own' && !acc) return; var b2 = h('button', (tab === t[0] ? 'on' : '') + (t[0] === 'own' ? ' own' : ''), t[1]); b2.type = 'button'; b2.onclick = function () { tab = t[0]; try { history.replaceState(null, '', '#' + tab); } catch (e2) {} render(); }; tb.appendChild(b2); }); root.appendChild(tb);
    var items = L.filter(function (x) { if (tab === 'own') return owned(x.id); if (x.active === false && !owned(x.id)) return false; return tab === 'all' || x.type === tab; }).sort(function (a3, b3) { return (RO[a3.rarity] || 0) - (RO[b3.rarity] || 0) || (a3.price || 0) - (b3.price || 0); });
    if (!items.length) { root.appendChild(h('div', 'tn-emp', tab === 'own' ? 'Todavía no tienes cosméticos. ¡Elige el primero!' : 'No hay artículos en esta categoría.')); return; }
    var g = h('div', 'tn-g'), name = acc ? acc.display_name : 'Tu nombre';
    items.forEach(function (it, i) { var c = h('div', 'tn-it r-' + (it.rarity || 'comun')); c.style.animationDelay = Math.min(i, 16) * 35 + 'ms';
      c.appendChild(M.cosPreview(it, name, acc && acc.player_id)); c.appendChild(h('b', null, it.name));
      var mt = h('div', 'mt'); mt.appendChild(h('span', 'rar rar-' + (it.rarity || 'comun'), M.RAR[it.rarity] || 'Común')); mt.appendChild(h('span', null, M.KIND[it.type])); c.appendChild(mt);
      var own = owned(it.id), on = own && inv.eq[it.type] === it.id, bt = h('button', own ? (on ? 'eqp' : 'own') : ''); bt.type = 'button'; bt.disabled = busy;
      if (on) bt.textContent = '✓ Equipado'; else if (own) bt.textContent = 'Equipar'; else { bt.appendChild(h('span', 'co')); bt.appendChild(document.createTextNode(I.fmt(it.price) + ' Bits')); }
      bt.onclick = function () { if (!acc) { location.href = 'cuenta.html'; return; } if (on) return; if (own) return wear(it); confirm(it); }; c.appendChild(bt); g.appendChild(c); });
    root.appendChild(g);
  }
  function wear(it) { busy = true; render(); I.equip(it.type, it.id).then(function () { busy = false; inv.eq[it.type] = it.id; I.syncSelf(acc, inv.eq); I.toast('¡' + it.name + ' equipado!'); render(); }, function (e) { busy = false; I.toast(e.message || 'No se pudo equipar', true); render(); }); }
  function confirm(it) {
    M.modal(function (b, close) { var w = h('div', 'cf'); w.appendChild(h('h3', 'x', '¿Comprar ' + it.name + '?')); w.appendChild(M.cosPreview(it, acc.display_name, acc.player_id));
      var after = Number(acc.bits) - Number(it.price || 0), sm = h('div', 'sum'); [['Precio', I.fmt(it.price) + ' Bits'], ['Tu saldo', I.fmt(acc.bits) + ' Bits'], ['Te quedan', (after < 0 ? '—' : I.fmt(after) + ' Bits')]].forEach(function (r) { sm.appendChild(h('span', null, r[0])); sm.appendChild(h('b', null, r[1])); }); w.appendChild(sm);
      if (after < 0) w.appendChild(h('p', 'sub', 'Te faltan ' + I.fmt(-after) + ' Bits. Puedes ganarlos en Apuestas.'));
      var r2 = h('div', 'r'), no = h('button', null, 'Cancelar'); no.type = 'button'; no.onclick = close; r2.appendChild(no);
      if (after >= 0) { var go = h('button', 'go', 'Comprar y equipar'); go.type = 'button'; go.onclick = function () { go.disabled = true; go.textContent = 'Comprando…';
        I.buy(it).then(function (bits) { acc.bits = bits; inv.rows.unshift({ item_id: it.id, kind: it.type, source: 'shop', price: it.price }); close(); return I.equip(it.type, it.id).then(function () { inv.eq[it.type] = it.id; I.syncSelf(acc, inv.eq); I.toast('🎉 ¡' + it.name + ' es tuyo y ya lo llevas puesto!'); render(); }, function () { I.toast('Comprado. Equípalo desde Lo mío.'); render(); }); },
          function (e) { go.disabled = false; go.textContent = 'Comprar y equipar'; I.toast(e.message || 'No se pudo comprar', true); }); }; r2.appendChild(go); }
      w.appendChild(r2); b.appendChild(w); }); }
  function boot() { render();
    if (!window.ACCOUNTS) { ready = true; return render(); }
    ACCOUNTS.me().then(function (a) { acc = a; ready = true; if (!a) return render(); return I.data().then(function (d) { inv = d; render(); }, function () { inv = { rows: [], eq: {} }; render(); }); }, function () { ready = true; render(); }); }
  window.addEventListener('magna:update', function () { if (!busy) render(); });
  if (document.readyState === 'complete') boot(); else addEventListener('load', boot);
})();
