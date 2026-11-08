'use strict';
// Panel de administración · módulo «econ»: se descarga solo al abrir su sección (lo carga admin.js).
ADMIN_MOD('econ', function (A) {
  var $ = A.$, S = A.S, ask = A.ask, btn = A.btn, by = A.by, closesDlg = A.closesDlg, commit = A.commit, confirmBox = A.confirmBox, fdate = A.fdate, h = A.h, table = A.table, toast = A.toast;
  function marketCard() {
    var ms = MAGNA.marketState(), c = h('div', 'mkt' + (ms.open ? ' on' : ''));
    var tx = h('div'); tx.appendChild(h('span', 'mkt-s', ms.open ? '● Mercado abierto' : '● Mercado cerrado'));
    tx.appendChild(h('p', 'hint', ms.open ? 'Los equipos pueden fichar jugadores libres.' + (ms.closes ? ' Se cierra solo el ' + fdate(ms.closes) + '.' : ' Ciérralo cuando termine el periodo de fichajes.') : ms.expired ? 'Se cerró solo en la fecha que pusiste. Ábrelo de nuevo cuando quieras.' : 'Nadie puede fichar hasta que lo abras. Retirar jugadores sí está permitido.')); c.appendChild(tx);
    var bx = h('div', 'mkt-b');
    if (ms.open) { bx.appendChild(btn('Cambiar fecha de cierre', function () { closesDlg(); }, 'sm')); bx.appendChild(btn('Cerrar mercado', function () { confirmBox('¿Cerrar el mercado de fichajes?', 'Ningún equipo podrá fichar hasta que lo abras de nuevo.', 'Cerrar mercado', function () { S().market = { open: false }; MAGNA.addNews('market', 'Se cierra el mercado de fichajes.'); commit('Mercado cerrado'); }); }, 'd')); }
    else bx.appendChild(btn('Abrir mercado de fichajes', function () { closesDlg(true); }, 'o'));
    c.appendChild(bx); return c;
  }
  function econV(b) {
    b.appendChild(marketCard());
    var OF = (S().offers || []).slice().reverse().slice(0, 30), OST = { pending: 'Pendiente', accepted: 'Aceptada', rejected: 'Rechazada', cancelled: 'Cancelada' };
    if (OF.length) { b.appendChild(h('h2', 'x', 'Ofertas entre equipos')); b.appendChild(h('p', 'hint', 'Las hacen y responden los coaches desde su panel "Mi equipo". Aquí puedes ver todas y anular una pendiente.'));
      b.appendChild(table(['Jugador', 'Comprador', 'Vendedor', 'Bits', 'Estado', ''], OF.map(function (o) { return [MAGNA.playerName(o.player) || '—', MAGNA.teamName(o.buyer), MAGNA.teamName(o.seller), o.amount, OST[o.status] || o.status, o.status === 'pending' ? btn('Anular', function () { o.status = 'cancelled'; commit('Oferta anulada'); }, 'd') : '']; }))); }
    b.appendChild(h('p', 'sub', 'Los Bits son una moneda ficticia sin valor real. Cada equipo tiene su presupuesto y los contratos vigentes lo comprometen.'));
    var today = MAGNA.now().slice(0, 10), act = function (c) { return !c.ends || c.ends >= today; };
    b.appendChild(h('h2', 'x', 'Presupuestos'));
    b.appendChild(h('p', 'hint', 'Nivel de fichajes: cada equipo solo puede fichar jugadores de su nivel o inferior. Bronce (media menor a 40) · Plata (40+) · Oro (60+) · Élite (80+). Todos los jugadores empiezan en 10 (Bronce).'));
    b.appendChild(table(['Equipo', 'Nivel de fichajes', 'Presupuesto', 'Comprometido', 'Libre', ''], S().teams.map(function (t) { var lv = h('select', 'in'); lv.style.cssText = 'margin:0;padding:8px 12px;min-width:120px'; MAGNA.TIERS.forEach(function (x) { var o = h('option', null, x[1]); o.value = x[0]; if ((t.level || 'plata') === x[0]) o.selected = true; lv.appendChild(o); }); lv.onchange = function () { t.level = lv.value; commit('Nivel de ' + t.name + ': ' + lv.options[lv.selectedIndex].text); }; var cm = S().contracts.filter(function (c) { return c.teamId === t.id && act(c); }).reduce(function (s, c) { return s + c.salary; }, 0);
      return [h('b', null, t.name), lv, t.budget, cm, t.budget - cm, [btn('Ajustar', function () { ask('Presupuesto de ' + t.name, [{ k: 'b', label: 'Bits disponibles', type: 'number', value: t.budget, min: 0 }], function (v) { var x = Number(v.b); if (!Number.isInteger(x) || x < 0 || x > 1e9) return 'Presupuesto no válido.'; t.budget = x; commit('Presupuesto actualizado'); }); })]]; })));
    var bar = h('div', 'bar2'); bar.appendChild(h('h2', 'x', 'Contratos')); bar.appendChild(h('div', 'sp')); bar.appendChild(btn('+ Nuevo contrato', function () {
      var ps = S().players.filter(function (p) { return p.teamId && !S().contracts.some(function (c) { return c.playerId === p.id && act(c); }); });
      if (!ps.length) return toast('No hay jugadores con equipo y sin contrato vigente.', true);
      ask('Nuevo contrato', [{ k: 'p', label: 'Jugador', type: 'select', options: ps.map(function (p) { return [p.id, p.name + ' (' + by(S().teams, p.teamId).name + ')']; }) }, { k: 's', label: 'Salario en Bits', type: 'number', value: 0, min: 0 }, { k: 'e', label: 'Fin del contrato (opcional)', type: 'date' }], function (v) { var s = Number(v.s); if (!Number.isInteger(s) || s < 0 || s > 1e7) return 'Salario no válido.'; var p = by(S().players, Number(v.p));
        S().contracts.push({ id: MAGNA.id(), playerId: p.id, teamId: p.teamId, salary: s, ends: v.e || null }); commit('Contrato creado'); }, 'Crear'); }, 'o')); b.appendChild(bar);
    b.appendChild(table(['Jugador', 'Equipo', 'Salario', 'Vigencia', ''], S().contracts.map(function (c) { var p = by(S().players, c.playerId); return [p ? p.name : '—', MAGNA.teamName(c.teamId), c.salary, c.ends ? 'hasta ' + c.ends : 'indefinido', act(c) ? [btn('Terminar', function () { c.ends = today; commit('Contrato terminado'); }, 'd')] : 'terminado']; })));
  }
  return { econV: econV };
});
