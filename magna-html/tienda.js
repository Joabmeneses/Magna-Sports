'use strict';
// Tienda de cosméticos: se compran con Bits (moneda ficticia del sitio) y se equipan al momento.
(function () {
  var h = M.h, I = MAGNA_INV, root = document.getElementById('tn'), acc = null, inv = null, tab = (location.hash || '').slice(1) || 'all', busy = false, ready = false;
  var TABS = [['all', '✨ Todo'], ['color', '🎨 Colores'], ['plate', '🏷️ Placas'], ['frame', '🖼️ Marcos'], ['title', '🔤 Títulos'], ['excl', '🔒 Exclusivos'], ['own', '🎒 Lo mío']], RO = { comun: 0, rara: 1, epica: 2, legendaria: 3 };
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
    feat(L);
    var tb = h('div', 'tn-tabs'); TABS.forEach(function (t) { if (t[0] === 'own' && !acc) return; var b2 = h('button', (tab === t[0] ? 'on' : '') + (t[0] === 'own' ? ' own' : '')); b2.appendChild(h('span', null, t[1])); b2.type = 'button'; b2.onclick = function () { tab = t[0]; try { history.replaceState(null, '', '#' + tab); } catch (e2) {} render(); }; tb.appendChild(b2); }); root.appendChild(tb);
    var items = L.filter(function (x) { if (tab === 'own') return owned(x.id); if (x.active === false && !owned(x.id)) return false; if (tab === 'excl') return !!x.exclusive; if (x.exclusive) return false; return tab === 'all' || x.type === tab; }).sort(function (a3, b3) { return (RO[a3.rarity] || 0) - (RO[b3.rarity] || 0) || (a3.price || 0) - (b3.price || 0); });
    if (tab === 'excl') root.appendChild(h('p', 'tn-xi', '🔒 Estos cosméticos no se compran: se ganan en la cancha. Cuando desbloqueas la insignia, llegan solos a tu inventario.'));
    if (!items.length) { root.appendChild(h('div', 'tn-emp', tab === 'own' ? 'Todavía no tienes cosméticos. ¡Elige el primero!' : 'No hay artículos en esta categoría.')); return; }
    var g = h('div', 'tn-g'), name = acc ? acc.display_name : 'Tu nombre';
    items.forEach(function (it, i) { var c = h('div', 'tn-it ar-sheen r-' + (it.rarity || 'comun')); c.dataset.tilt = '10'; if (it.rarity === 'legendaria' && !it.exclusive) c.appendChild(h('span', 'ar-rib', 'Legendaria')); c.style.animationDelay = Math.min(i, 16) * 35 + 'ms';
      c.appendChild(M.cosPreview(it, name, acc && acc.player_id)); c.appendChild(h('b', null, it.name));
      var mt = h('div', 'mt'); mt.appendChild(h('span', 'rar rar-' + (it.rarity || 'comun'), M.RAR[it.rarity] || 'Común')); mt.appendChild(h('span', null, M.KIND[it.type])); c.appendChild(mt);
      var own = owned(it.id), on = own && inv.eq[it.type] === it.id, bt = h('button', own ? (on ? 'eqp' : 'own') : ''); bt.type = 'button'; bt.disabled = busy;
      if (on) bt.textContent = '✓ Equipado'; else if (own) bt.textContent = 'Equipar'; else if (it.exclusive) { bt.className = 'lock'; bt.disabled = true; bt.textContent = '🔒 ' + (MAGNA.AWARD_TXT[it.award] || 'Exclusivo'); } else { bt.appendChild(h('span', 'co')); bt.appendChild(document.createTextNode(I.fmt(it.price) + ' Bits')); }
      if (it.exclusive) { c.classList.add('x'); c.appendChild(h('span', 'ar-rib x', 'Exclusivo')); var bd = acc && acc.player_id != null && it.award !== 'manual' && MAGNA.playerBadges(acc.player_id).filter(function (z) { return z.id === it.award; })[0];
        if (bd && !own) { var pg = h('div', 'tn-pg'), pi = h('i'); pi.style.width = Math.round(bd.v / bd.goal * 100) + '%'; pg.appendChild(pi); pg.appendChild(h('small', null, bd.ok ? '¡Desbloqueado! Llega a tu inventario en breve' : 'Tu progreso: ' + bd.v + ' / ' + bd.goal)); c.appendChild(pg); } }
      bt.onclick = function () { if (!acc) { location.href = 'cuenta.html'; return; } if (on) return; if (own) return wear(it); if (it.exclusive) return; confirm(it); }; c.appendChild(bt); g.appendChild(c); });
    root.appendChild(g);
  }
  // artículo destacado del día (cambia cada día; mismo para todos)
  var cdT = null;
  function feat(L) { var C = L.filter(function (x) { return x.active !== false && !x.exclusive && (x.rarity === 'legendaria' || x.rarity === 'epica'); }); if (!C.length) return; var day = Math.floor(Date.now() / 864e5), it = C[day % C.length], next = (day + 1) * 864e5;
    var f = h('section', 'ar-feat ar-sheen'); f.dataset.tilt = '4'; f.appendChild(M.cosPreview(it, acc ? acc.display_name : 'Tu nombre', acc && acc.player_id));
    var tx = h('div'); tx.appendChild(h('div', 'ey', '⭐ Destacado de hoy')); tx.appendChild(h('h2', null, it.name)); tx.appendChild(h('p', null, (M.RAR[it.rarity] || '') + ' · ' + M.KIND[it.type] + '. Cada día aparece un cosmético épico o legendario distinto.'));
    var cd = h('div', 'cd'); cd.appendChild(document.createTextNode('⏳ Cambia en')); var cb = h('b', null, window.ARENA ? ARENA.until(next) : ''); cd.appendChild(cb); tx.appendChild(cd);
    clearInterval(cdT); cdT = setInterval(function () { if (!document.body.contains(cb)) return clearInterval(cdT); if (Date.now() >= next) { clearInterval(cdT); return render(); } cb.textContent = ARENA.until(next); }, 1000);
    var pr = h('div', 'pr'), own = owned(it.id), on = own && inv && inv.eq[it.type] === it.id; pr.appendChild(h('span', 'now', I.fmt(it.price) + ' Bits'));
    var bt = h('button', own ? 'own' : '', on ? '✓ Equipado' : own ? 'Equipar' : acc ? 'Comprar ahora' : 'Entra para comprar'); bt.type = 'button'; bt.disabled = busy || on; bt.onclick = function () { if (!acc) { location.href = 'cuenta.html'; return; } if (own) return wear(it); confirm(it); }; pr.appendChild(bt); tx.appendChild(pr); f.appendChild(tx); root.appendChild(f); }
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
