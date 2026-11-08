'use strict';
// Panel de administración · módulo «shop»: se descarga solo al abrir su sección (lo carga admin.js).
ADMIN_MOD('shop', function (A) {
  var $ = A.$, S = A.S, btn = A.btn, commit = A.commit, confirmBox = A.confirmBox, dialog = A.dialog, go = A.go, h = A.h, loadAccs = A.loadAccs, nk = A.nk, render = A.render, rr = A.rr, table = A.table, toast = A.toast;
  function shopRpc(n, a) { return window.MAGNA_SB().then(function (c) { return c.rpc(n, a); }).then(function (r) { if (r && r.error) throw r.error; return r.data; }); }
  function loadInv(then) { shopRpc('admin_inventory').then(function (d) { $.INV = d || []; then && then(); }, function () { $.INV = $.INV || []; then && then(); }); }
  function syncExcl(manual) { var X = (S().shop || []).filter(function (x) { return x.exclusive && x.award && x.award !== 'manual'; }); if (!X.length || $.exBusy) { if (manual) toast(X.length ? 'Ya se está entregando…' : 'No hay exclusivos automáticos en el catálogo.'); return; }
    if (!window.MAGNA_SB || MAGNA.cloud.source !== 'cloud') return; $.exBusy = true;
    loadAccs(function () { loadInv(function () { var jobs = [];
      X.forEach(function (it) { var ids = ($.ACCS || []).filter(function (a) { if (a.player_id == null) return false; if (($.INV || []).some(function (r) { return r.account_id === a.id && r.item_id === it.id; })) return false; var b = MAGNA.playerBadges(a.player_id).filter(function (z) { return z.id === it.award; })[0]; return !!(b && b.ok); }).map(function (a) { return a.id; });
        if (ids.length) jobs.push(shopRpc('admin_gift_item', { p_accounts: ids, p_item: it.id, p_message: '🔒 Cosmético exclusivo desbloqueado: ' + (MAGNA.AWARD_TXT[it.award] || '') + '. ¡Ya está en tu inventario!' }).then(function (n) { return n || 0; }, function () { return 0; })); });
      Promise.all(jobs).then(function (r) { $.exBusy = false; var n = r.reduce(function (a, b) { return a + b; }, 0); if (n) { toast('🔒 ' + n + (n === 1 ? ' cosmético exclusivo entregado' : ' cosméticos exclusivos entregados')); loadInv(function () { if ($.tab === 'tienda') render(); }); } else if (manual) toast('Todo al día: nadie tiene exclusivos pendientes.'); }); }); }); }
  function shopEdit(it0) {
    var isNew = !it0, it = it0 ? Object.assign({}, it0) : { id: '', type: 'color', name: '', rarity: 'comun', price: 300, style: Object.keys(M.STY.color)[0], active: true };
    dialog(isNew ? 'Nuevo cosmético' : 'Editar ' + it0.name, function (b, close) {
      var pv = h('div'); b.appendChild(pv);
      function fl(label, el) { var l = h('label', 'f', label); l.appendChild(el); b.appendChild(l); return el; }
      var ty = h('select', 'in'); Object.keys(M.KIND).forEach(function (k) { var o = h('option', null, M.KIND[k]); o.value = k; ty.appendChild(o); }); ty.value = it.type; ty.disabled = !isNew; fl('Tipo', ty);
      var nm = h('input', 'in'); nm.maxLength = 40; nm.value = it.name; nm.placeholder = 'Ej.: Neón rosa'; var nl = fl('Nombre', nm);
      var sl = h('select', 'in'), sw = fl('Estilo', sl);
      var ra = h('select', 'in'); Object.keys(M.RAR).forEach(function (k) { var o = h('option', null, M.RAR[k]); o.value = k; ra.appendChild(o); }); ra.value = it.rarity || 'comun'; fl('Rareza', ra);
      var hw = h('select', 'in'), o0 = h('option', null, '🛍️ Se compra con Bits'); o0.value = ''; hw.appendChild(o0); Object.keys(MAGNA.AWARD_TXT).forEach(function (k) { var o = h('option', null, '🔒 Exclusivo · ' + MAGNA.AWARD_TXT[k]); o.value = k; hw.appendChild(o); }); hw.value = it.exclusive ? (it.award || 'manual') : ''; fl('Cómo se consigue', hw);
      var pr = h('input', 'in'); pr.type = 'number'; pr.min = 0; pr.max = 1000000; pr.value = it.price; var prl = fl('Precio en Bits', pr); hw.onchange = function () { prl.parentNode.style.display = hw.value ? 'none' : ''; }; hw.onchange();
      var ac = h('label', 'f'), cb = h('input'); cb.type = 'checkbox'; cb.checked = it.active !== false; ac.appendChild(cb); ac.appendChild(document.createTextNode(' A la venta en la tienda (si lo quitas, solo se puede regalar)')); b.appendChild(ac);
      var err = h('p', 'err'); b.appendChild(err);
      function styles() { sl.innerHTML = ''; var S2 = M.STY[ty.value] || {}; Object.keys(S2).forEach(function (k) { var o = h('option', null, S2[k]); o.value = k; sl.appendChild(o); }); if (S2[it.style]) sl.value = it.style; sw.parentNode.style.display = ty.value === 'title' ? 'none' : ''; nl.parentNode.firstChild.textContent = ty.value === 'title' ? 'Texto del título' : 'Nombre'; }
      function prev() { pv.innerHTML = ''; pv.appendChild(M.cosPreview({ id: '_', type: ty.value, name: nm.value || 'Título', style: sl.value }, 'Jugador')); if (ty.value !== 'title') { var x = pv.querySelector('.mpn'); if (x) { x.classList.add((ty.value === 'color' ? 'c-' : 'pl-') + sl.value); } } }
      ty.onchange = function () { styles(); prev(); }; sl.onchange = nm.oninput = prev; styles(); prev();
      var r = h('div', 'row'); r.appendChild(btn('Cancelar', close)); r.appendChild(btn(isNew ? 'Crear' : 'Guardar', function () {
        var n = nm.value.trim(), p = Number(pr.value); err.textContent = '';
        if (n.length < 2) return err.textContent = 'Escribe un nombre (mínimo 2 letras).'; if (/[<>]/.test(n)) return err.textContent = 'El nombre no puede tener < ni >.'; if (!Number.isInteger(p) || p < 0 || p > 1000000) return err.textContent = 'El precio debe ser un número entero entre 0 y 1.000.000.';
        it.type = ty.value; it.name = n; it.rarity = ra.value; it.price = hw.value ? 0 : p; it.style = it.type === 'title' ? '' : sl.value; it.active = cb.checked; if (hw.value) { it.exclusive = true; it.award = hw.value; } else { delete it.exclusive; delete it.award; }
        S().shop = S().shop || [];
        if (isNew) { var base = (it.exclusive ? 'x' : it.type[0]) + '-' + nk(n).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30), id = base || it.type[0] + '-x', k = 2; while (S().shop.some(function (x) { return x.id === id; })) id = base + '-' + k++; it.id = id; S().shop.push(it); }
        else { var i = S().shop.indexOf(it0); S().shop[i] = it; }
        close(); commit(isNew ? 'Cosmético creado' : 'Cosmético guardado'); }, 'o')); b.appendChild(r); nm.focus();
    });
  }
  function itemGiftDlg(it0) {
    if ($.ACCS === null) return loadAccs(function () { itemGiftDlg(it0); });
    if (!$.ACCS.length) return toast('Todavía no hay cuentas. Crea cuentas en Jugadores.', true);
    dialog('🎁 Regalar cosmético', function (b, close) {
      b.appendChild(h('p', 'sub', 'Se agrega a su inventario y le llega una notificación. Quien ya lo tenga no lo recibe dos veces.'));
      var isel = h('select', 'in'); (S().shop || []).forEach(function (x) { var o = h('option', null, x.name + ' · ' + M.KIND[x.type] + (x.active === false ? ' (no está a la venta)' : '')); o.value = x.id; isel.appendChild(o); }); if (it0) isel.value = it0.id; var li = h('label', 'f', 'Cosmético'); li.appendChild(isel); b.appendChild(li);
      var pv = h('div'); b.appendChild(pv); function prev() { pv.innerHTML = ''; var x = M.item(isel.value); if (x) pv.appendChild(M.cosPreview(x, 'Jugador')); } isel.onchange = function () { prev(); draw(); }; prev();
      var msg = h('textarea', 'in'); msg.rows = 2; msg.maxLength = 280; msg.placeholder = 'Ej.: ¡Premio por el Balón de Oro!'; var lm = h('label', 'f', 'Mensaje (opcional)'); lm.appendChild(msg); b.appendChild(lm);
      var sel = {}, tools = h('div', 'bar2'), q = h('input', 'in'); q.placeholder = 'Buscar cuenta…'; q.style.maxWidth = '240px'; tools.appendChild(q); tools.appendChild(btn('Todos los miembros', function () { $.ACCS.forEach(function (a) { if (a.role === 'member') sel[a.id] = 1; }); draw(); }, 'sm')); tools.appendChild(btn('Quitar todos', function () { sel = {}; draw(); }, 'sm')); b.appendChild(tools);
      var list = h('div', 'gift-list'); b.appendChild(list); var err = h('p', 'err'); b.appendChild(err);
      function has(aid) { return ($.INV || []).some(function (r) { return r.account_id === aid && r.item_id === isel.value; }); }
      function draw() { list.innerHTML = ''; var t = nk(q.value || ''); $.ACCS.slice().sort(function (x, y) { return (x.display_name || '').localeCompare(y.display_name || ''); }).filter(function (a) { return !t || nk(a.display_name + ' ' + a.username).indexOf(t) >= 0; }).forEach(function (a) {
          var r = h('label', 'gift-it' + (sel[a.id] ? ' on' : '')), cb = h('input'); cb.type = 'checkbox'; cb.checked = !!sel[a.id]; var ya = has(a.id); cb.disabled = ya;
          cb.onchange = function () { if (cb.checked) sel[a.id] = 1; else delete sel[a.id]; r.classList.toggle('on', cb.checked); go.textContent = 'Regalar a ' + Object.keys(sel).length; };
          r.appendChild(cb); var tx = h('span'); tx.appendChild(h('b', null, a.display_name)); tx.appendChild(h('small', null, '@' + a.username)); r.appendChild(tx); r.appendChild(h('span', 'gb', ya ? 'Ya lo tiene' : '')); list.appendChild(r); }); go.textContent = 'Regalar a ' + Object.keys(sel).length; }
      q.oninput = draw;
      var rr = h('div', 'row'); rr.appendChild(btn('Cancelar', close)); var go = btn('Regalar', function () { var ids = Object.keys(sel).filter(function (id) { return !has(id); }), m = msg.value.trim(), x = M.item(isel.value); err.textContent = '';
        if (!ids.length) return err.textContent = 'Elige al menos una cuenta.'; if (/[<>]/.test(m)) return err.textContent = 'El mensaje no puede contener < ni >.';
        go.disabled = true; go.textContent = 'Regalando…';
        shopRpc('admin_gift_item', { p_accounts: ids, p_item: x.id, p_message: m || null }).then(function (n) { close(); toast('🎁 ' + x.name + ' regalado a ' + n + (n === 1 ? ' cuenta' : ' cuentas')); loadInv(function () { if ($.tab === 'tienda') render(); }); },
          function (e) { go.disabled = false; err.textContent = 'No se pudo: ' + (e.message || e); }); }, 'o'); rr.appendChild(go); b.appendChild(rr); draw();
    });
  }
  function ownersDlg(it) {
    var rows = ($.INV || []).filter(function (r) { return r.item_id === it.id; });
    dialog('Quién tiene ' + it.name, function (b, close) {
      if (!rows.length) { b.appendChild(h('p', 'sub', 'Nadie lo tiene todavía.')); return; }
      var L = h('div', 'res'); rows.forEach(function (r) { var a = ($.ACCS || []).filter(function (x) { return x.id === r.account_id; })[0], row = h('div', 'ur'); var w = h('div', 'w'); w.appendChild(h('b', null, a ? a.display_name : 'Cuenta')); w.appendChild(h('small', null, (r.source === 'gift' ? '🎁 Regalo' : '🛍️ Compra') + ' · ' + new Date(r.at).toLocaleDateString('es'))); row.appendChild(w);
        row.appendChild(btn('Quitar', function () { confirmBox('¿Quitar ' + it.name + '?', 'Se borra de su inventario. Si lo compró, los Bits no se devuelven automáticamente.', 'Quitar', function () { shopRpc('admin_revoke_item', { p_account: r.account_id, p_item: it.id }).then(function () { toast('Quitado'); loadInv(function () { if ($.tab === 'tienda') render(); }); }, function (e) { toast(e.message || 'No se pudo', true); }); }); }, 'sm d')); L.appendChild(row); });
      b.appendChild(L);
    });
  }
  function shopV(b) {
    if ($.INV === null) { loadInv(function () { if ($.tab === 'tienda') render(); }); if ($.ACCS === null) loadAccs(); }
    var L = S().shop || [];
    if (!L.length) { var e = h('div', 'box'); e.appendChild(h('h3', null, '🛍️ Activa la tienda')); e.appendChild(h('p', 'hint', 'Carga un catálogo inicial de ' + MAGNA.SHOP_DEFAULT.length + ' cosméticos (colores de nombre, placas, marcos y títulos) con precios sugeridos. Después puedes cambiar precios, quitar o crear los tuyos.'));
      var r0 = h('div', 'bar2'); r0.appendChild(btn('Cargar catálogo inicial', function () { S().shop = JSON.parse(JSON.stringify(MAGNA.SHOP_DEFAULT.concat(MAGNA.SHOP_EXCL))); MAGNA.addNews('announcement', '🛍️ ¡Abrió la tienda de cosméticos! Colores neón, placas, marcos y títulos para tu nombre.'); commit('Tienda activada'); }, 'o')); r0.appendChild(btn('Empezar vacía', function () { shopEdit(null); })); e.appendChild(r0); b.appendChild(e); return; }
    var own = {}; ($.INV || []).forEach(function (r) { own[r.item_id] = (own[r.item_id] || 0) + 1; });
    var tot = ($.INV || []).length, sold = ($.INV || []).filter(function (r) { return r.source === 'shop'; }).length;
    if (!L.some(function (x) { return x.exclusive; })) { var xe = h('div', 'box'); xe.style.marginBottom = '14px'; xe.appendChild(h('h3', null, '🔒 Cosméticos exclusivos')); xe.appendChild(h('p', 'hint', 'No se compran: se entregan solos a quien gane el Balón de Oro, un título, 10 MVP, un hat-trick… Agrega ' + MAGNA.SHOP_EXCL.length + ' exclusivos listos para usar.')); var xr = h('div', 'bar2'); xr.appendChild(btn('Agregar exclusivos', function () { S().shop = S().shop.concat(JSON.parse(JSON.stringify(MAGNA.SHOP_EXCL.filter(function (x) { return !S().shop.some(function (y) { return y.id === x.id; }); })))); commit('Exclusivos agregados: se entregan solos a quien los desbloquee'); }, 'o')); xe.appendChild(xr); b.appendChild(xe); }
    var kp = h('div', 'bar2'); kp.appendChild(h('span', 'chip', L.length + ' cosméticos')); kp.appendChild(h('span', 'chip', L.filter(function (x) { return x.active !== false; }).length + ' a la venta')); kp.appendChild(h('span', 'chip', sold + ' vendidos · ' + (tot - sold) + ' regalados')); kp.appendChild(h('div', 'sp')); if (L.some(function (x) { return x.exclusive; })) kp.appendChild(btn('🔒 Entregar exclusivos ahora', function () { syncExcl(true); })); kp.appendChild(btn('🎁 Regalar cosmético', function () { itemGiftDlg(null); })); kp.appendChild(btn('+ Nuevo cosmético', function () { shopEdit(null); }, 'o')); b.appendChild(kp);
    var RO = { comun: 0, rara: 1, epica: 2, legendaria: 3 };
    Object.keys(M.KIND).forEach(function (k) { var its = L.filter(function (x) { return x.type === k; }).sort(function (a, c) { return (RO[a.rarity] || 0) - (RO[c.rarity] || 0) || a.price - c.price; }); if (!its.length) return;
      b.appendChild(h('h3', 'x', M.KIND[k] + ' (' + its.length + ')'));
      b.appendChild(table(['Vista', 'Nombre', 'Rareza', 'Precio', 'Estado', 'Dueños', ''], its.map(function (x) { var pv = M.cosPreview(x, 'Jugador'); pv.style.cssText = 'min-height:0;padding:6px 10px;font-size:14px';
        return [pv, h('b', null, x.name), h('span', 'rar rar-' + (x.rarity || 'comun'), M.RAR[x.rarity] || 'Común'), x.exclusive ? h('span', null, '🔒 ' + (MAGNA.AWARD_TXT[x.award] || 'Exclusivo')) : h('b', null, Number(x.price || 0).toLocaleString('es') + '\u00a0Bits'), x.active === false ? 'Oculto' : 'A\u00a0la\u00a0venta', $.INV === null ? '…' : btn(String(own[x.id] || 0), function () { ownersDlg(x); }, 'sm'),
          [btn('Editar', function () { shopEdit(x); }, 'sm'), btn('Regalar', function () { itemGiftDlg(x); }, 'sm'), btn(x.active === false ? 'Poner a la venta' : 'Ocultar', function () { x.active = x.active === false; commit(x.active ? 'A la venta' : 'Oculto de la tienda'); }, 'sm'),
            btn('Eliminar', function () { confirmBox('¿Eliminar ' + x.name + ' del catálogo?', (own[x.id] ? own[x.id] + ' cuentas lo tienen; dejará de verse en su inventario. ' : '') + 'Si solo quieres dejar de venderlo, usa Ocultar.', 'Eliminar', function () { S().shop = S().shop.filter(function (y) { return y !== x; }); commit('Cosmético eliminado'); }); }, 'sm d')]]; }))); });
  }
  return { shopV: shopV, syncExcl: syncExcl };
});
