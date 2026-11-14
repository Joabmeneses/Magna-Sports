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
  function rpc(n, a) { return window.MAGNA_SB().then(function (c) { return c.rpc(n, a || {}); }).then(function (r) { if (r && r.error) throw r.error; return r.data; }); }
  var EO = null;
  function econBox(b) {
    var w = h('section', 'ec-box'), hd = h('div', 'ec-hd'), tx = h('div'); tx.appendChild(h('h2', 'x', '💰 Economía de los equipos'));
    tx.appendChild(h('p', 'hint', 'Cada partido oficial (no amistoso) paga al terminar: victoria 400 Bits y 300 Bucks, derrota 150 Bits y 100 Bucks, multiplicado por los puntos del ranking (x1 el de menos puntos, x3 el líder) y por la competición (torneo x1,2 · Champions x1,5 · Mundial x2). Con la caja de Bits se pagan solos los sueldos que fija cada coach a toda su plantilla. Los Bucks son para fichar.')); hd.appendChild(tx);
    var ac = h('div', 'bar2');
    ac.appendChild(btn('🎁 Fondos iniciales según puntos', function () { ask('Fondos iniciales', [{ k: 'b', label: 'Bits base para la caja (se multiplican x1 a x3)', type: 'number', value: 1000, min: 0 }, { k: 'u', label: 'Bucks base para fichajes (se multiplican x1 a x3)', type: 'number', value: 1000, min: 0 }], function (v) {
      var bi = Number(v.b), bu = Number(v.u); if (!Number.isInteger(bi) || !Number.isInteger(bu) || bi < 0 || bu < 0 || bi > 1e6 || bu > 1e6) return 'Escribe números enteros entre 0 y 1.000.000.';
      return rpc('admin_econ_seed', { p_bits: bi, p_bucks: bu }).then(function (n) { toast('💰 Fondos entregados a ' + n + ' equipos'); EO = null; return MAGNA.cloud.pull ? MAGNA.cloud.pull() : null; }).then(function () { A.render(); }, function (e) { return (e && e.message) || 'No se pudo'; }); }, 'Entregar', 'Cada equipo recibe la base multiplicada por sus puntos del ranking: el que más puntos tiene recibe el triple. Se suma a lo que ya tengan.'); }, 'o'));
    ac.appendChild(btn('Pagar partidos pendientes', function () { rpc('econ_settle').then(function (n) { toast(n ? '💰 Se pagaron ' + n + (n === 1 ? ' partido' : ' partidos') : 'Todo al día: no hay partidos por pagar'); EO = null; A.render(); }, function (e) { toast((e && e.message) || 'No se pudo', true); }); }));
    hd.appendChild(ac); w.appendChild(hd);
    var tb = h('div'); w.appendChild(tb); b.appendChild(w);
    if (!window.MAGNA_SB || MAGNA.cloud.source !== 'cloud') { tb.appendChild(h('p', 'hint', 'Conéctate a la nube para ver las cajas de los equipos.')); return; }
    if (EO === null) { tb.appendChild(M.skel(3)); EO = 'loading'; rpc('admin_econ_overview').then(function (d) { EO = d || []; if ($.tab === 'economia') A.render(); }, function (e) { EO = { err: (e && e.message) || 'No se pudo cargar' }; if ($.tab === 'economia') A.render(); }); return; }
    if (EO === 'loading') { tb.appendChild(M.skel(3)); return; }
    if (EO.err) { tb.appendChild(h('p', 'err', EO.err)); tb.appendChild(btn('Reintentar', function () { EO = null; A.render(); })); return; }
    var rows = S().teams.map(function (t) { var o = EO.filter(function (x) { return x.team_id === t.id; })[0] || { bits: 0, payroll: 0, mult: 1 }; return { t: t, o: o }; }).sort(function (x, y) { return y.o.mult - x.o.mult; });
    tb.appendChild(table(['Equipo', 'Multiplicador', 'Caja (Bits)', 'Sueldos por partido', 'Bucks', ''], rows.map(function (x) { var t = x.t, o = x.o, left = o.payroll ? Math.floor(o.bits / o.payroll) : null;
      return [h('b', null, t.name), h('span', 'ec-mu', 'x' + String(o.mult).replace('.', ',')), Number(o.bits).toLocaleString('es'), h('span', left != null && left < 1 ? 'ec-wn' : null, Number(o.payroll).toLocaleString('es') + (left == null ? '' : left < 1 ? ' · ⚠️ no alcanza' : ' · alcanza ' + left + ' p.')), Number(t.budget || 0).toLocaleString('es'),
        [btn('Caja ±', function () { ask('Caja de ' + t.name, [{ k: 'd', label: 'Bits a sumar (usa negativo para restar)', type: 'number', value: 500 }, { k: 'n', label: 'Motivo (opcional)', maxlength: 80 }], function (v) { var d = Number(v.d); if (!Number.isInteger(d) || d === 0 || Math.abs(d) > 1e7) return 'Escribe un número entero distinto de 0.';
          return rpc('admin_bank_adjust', { p_team: t.id, p_bits: d, p_note: v.n || null }).then(function (nb) { toast('Caja de ' + t.name + ': ' + Number(nb).toLocaleString('es') + ' Bits'); EO = null; A.render(); }, function (e) { return (e && e.message) || 'No se pudo'; }); }, 'Guardar'); }, 'sm')]]; })));
  }
  function econV(b) {
    b.appendChild(marketCard());
    var OF = (S().offers || []).slice().reverse().slice(0, 30), OST = { pending: 'Pendiente', accepted: 'Aceptada', rejected: 'Rechazada', cancelled: 'Cancelada' };
    if (OF.length) { b.appendChild(h('h2', 'x', 'Ofertas entre equipos')); b.appendChild(h('p', 'hint', 'Las hacen y responden los coaches desde su panel "Mi equipo". Aquí puedes ver todas y anular una pendiente.'));
      b.appendChild(table(['Jugador', 'Comprador', 'Vendedor', 'Bucks', 'Estado', ''], OF.map(function (o) { return [MAGNA.playerName(o.player) || '—', MAGNA.teamName(o.buyer), MAGNA.teamName(o.seller), o.amount, OST[o.status] || o.status, o.status === 'pending' ? btn('Anular', function () { o.status = 'cancelled'; commit('Oferta anulada'); }, 'd') : '']; }))); }
    econBox(b);
    b.appendChild(h('p', 'sub', 'Los Bits y los Bucks son monedas ficticias sin valor real.'));
    var today = MAGNA.now().slice(0, 10), act = function (c) { return !c.ends || c.ends >= today; };
    b.appendChild(h('h2', 'x', 'Bucks y nivel de fichajes'));
    b.appendChild(h('p', 'hint', 'Nivel de fichajes: cada equipo solo puede fichar jugadores de su nivel o inferior. Bronce (media menor a 40) · Plata (40+) · Oro (60+) · Élite (80+). Todos los jugadores empiezan en 10 (Bronce).'));
    b.appendChild(table(['Equipo', 'Nivel de fichajes', 'Bucks', 'Comprometido', 'Libre', ''], S().teams.map(function (t) { var lv = h('select', 'in'); lv.style.cssText = 'margin:0;padding:8px 12px;min-width:120px'; MAGNA.TIERS.forEach(function (x) { var o = h('option', null, x[1]); o.value = x[0]; if ((t.level || 'plata') === x[0]) o.selected = true; lv.appendChild(o); }); lv.onchange = function () { t.level = lv.value; commit('Nivel de ' + t.name + ': ' + lv.options[lv.selectedIndex].text); }; var cm = S().contracts.filter(function (c) { return c.teamId === t.id && act(c); }).reduce(function (s, c) { return s + c.salary; }, 0);
      return [h('b', null, t.name), lv, t.budget, cm, t.budget - cm, [btn('Ajustar', function () { ask('Bucks de ' + t.name, [{ k: 'b', label: 'Bucks disponibles', type: 'number', value: t.budget, min: 0 }], function (v) { var x = Number(v.b); if (!Number.isInteger(x) || x < 0 || x > 1e9) return 'Presupuesto no válido.'; t.budget = x; commit('Bucks actualizados'); }); })]]; })));
    var bar = h('div', 'bar2'); bar.appendChild(h('h2', 'x', 'Contratos')); bar.appendChild(h('div', 'sp')); bar.appendChild(btn('+ Nuevo contrato', function () {
      var ps = S().players.filter(function (p) { return p.teamId && !S().contracts.some(function (c) { return c.playerId === p.id && act(c); }); });
      if (!ps.length) return toast('No hay jugadores con equipo y sin contrato vigente.', true);
      ask('Nuevo contrato', [{ k: 'p', label: 'Jugador', type: 'select', options: ps.map(function (p) { return [p.id, p.name + ' (' + by(S().teams, p.teamId).name + ')']; }) }, { k: 's', label: 'Salario en Bucks (compromete el presupuesto de fichajes)', type: 'number', value: 0, min: 0 }, { k: 'e', label: 'Fin del contrato (opcional)', type: 'date' }], function (v) { var s = Number(v.s); if (!Number.isInteger(s) || s < 0 || s > 1e7) return 'Salario no válido.'; var p = by(S().players, Number(v.p));
        S().contracts.push({ id: MAGNA.id(), playerId: p.id, teamId: p.teamId, salary: s, ends: v.e || null }); commit('Contrato creado'); }, 'Crear'); }, 'o')); b.appendChild(bar);
    b.appendChild(table(['Jugador', 'Equipo', 'Salario', 'Vigencia', ''], S().contracts.map(function (c) { var p = by(S().players, c.playerId); return [p ? p.name : '—', MAGNA.teamName(c.teamId), c.salary, c.ends ? 'hasta ' + c.ends : 'indefinido', act(c) ? [btn('Terminar', function () { c.ends = today; commit('Contrato terminado'); }, 'd')] : 'terminado']; })));
  }
  return { econV: econV };
});
