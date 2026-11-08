'use strict';
// Panel de administración · módulo «comp»: se descarga solo al abrir su sección (lo carga admin.js).
ADMIN_MOD('comp', function (A) {
  var $ = A.$, S = A.S, ask = A.ask, banner = A.banner, btn = A.btn, by = A.by, commit = A.commit, confirmBox = A.confirmBox, dialog = A.dialog, evRpc = A.evRpc, go = A.go, h = A.h, nk = A.nk, okName = A.okName, render = A.render, rr = A.rr, table = A.table, toast = A.toast;
  function predDlg(c) {
    dialog('🔮 Predicciones · ' + c.name, function (b, close) {
      b.appendChild(h('p', 'sub', 'Puntos: campeón +' + PRED.CHAMP + ', play-off +1, octavos +2, cuartos +3, semis +4, final +6. Los premios se entregan como regalo de Bits con notificación.'));
      var list = h('div', 'up'); list.appendChild(M.skel(3)); b.appendChild(list); var R = [];
      var pz = h('div', 'two2'), amt = [1000, 500, 250].map(function (v, i) { var f = h('label', 'f'); f.appendChild(h('span', null, (i + 1) + 'º lugar (Bits)')); var inp = h('input', 'in'); inp.type = 'number'; inp.min = 0; inp.max = 100000; inp.value = v; f.appendChild(inp); pz.appendChild(f); return inp; });
      var err = h('p', 'err'), row = h('div', 'row'), pay; row.appendChild(btn('Cerrar', close));
      row.appendChild(pay = btn('🎁 Entregar premios', function () {
        var top = R.filter(function (x) { return x.pts > 0; }).slice(0, 3); if (!top.length) return err.textContent = 'Nadie tiene puntos todavía.';
        var done = c.state && c.state.phase === 'done';
        confirmBox('¿Entregar los premios?', (done ? '' : '⚠ El torneo todavía no termina. ') + top.map(function (x, i) { return (i + 1) + 'º ' + x.n + ' (' + x.pts + ' pts): ' + (Number(amt[i].value) || 0) + ' Bits'; }).join(' · ') + '. Si hay empate en puntos, gana quien tenga más aciertos.', 'Entregar', function () {
          pay.disabled = true; var chain = Promise.resolve();
          top.forEach(function (x, i) { var v = Math.round(Number(amt[i].value) || 0); if (v <= 0) return; chain = chain.then(function () { return ACCOUNTS.gift([x.id], v, '🔮 Predicción de la llave · ' + c.name + ': ' + (i + 1) + 'º lugar con ' + x.pts + ' puntos'); }); });
          chain.then(function () { c.predPaid = MAGNA.now(); commit('Premios entregados'); close(); }, function (e) { pay.disabled = false; err.textContent = (e && e.message) || 'No se pudo entregar'; }); }); }, 'o'));
      b.appendChild(h('h3', 'x', 'Premios')); b.appendChild(pz); if (c.predPaid) b.appendChild(h('p', 'hint', '✔ Ya entregaste premios el ' + new Date(c.predPaid.replace(' ', 'T') + 'Z').toLocaleString('es') + '.')); b.appendChild(err); b.appendChild(row);
      evRpc('admin_pred_board', { p_tour: c.id }).then(function (L) { list.innerHTML = '';
        R = (L || []).map(function (x) { var s2 = PRED.score(c, x.picks); return { id: x.account_id, n: x.display_name, pts: s2.pts, hits: s2.hits, picks: (x.picks || []).length }; }).sort(function (a, z) { return z.pts - a.pts || z.hits - a.hits || a.n.localeCompare(z.n); });
        if (!R.length) { list.appendChild(h('p', 'sub', 'Nadie ha jugado todavía.')); return; }
        R.slice(0, 30).forEach(function (x, i) { var r = h('div', 'ur'); r.appendChild(h('b', null, '#' + (i + 1))); var w = h('div', 'w'); w.appendChild(h('b', null, x.n)); w.appendChild(h('small', null, x.hits + ' aciertos · ' + x.picks + ' elecciones')); r.appendChild(w); r.appendChild(h('b', null, x.pts + ' pts')); list.appendChild(r); });
      }, function (e) { list.innerHTML = ''; list.appendChild(h('p', 'err', /function|does not exist|schema/i.test((e && e.message) || '') ? 'Falta activar las predicciones en Supabase (archivo predicciones.sql).' : (e && e.message) || 'No se pudo cargar')); });
    });
  }
  function compV(b, kind) {
    var L = kind === 'leagues', list = S()[kind], word = L ? 'liga' : 'torneo';
    var bar = h('div', 'bar2'); bar.appendChild(h('div', 'sp')); bar.appendChild(btn('+ Crear ' + word, function () { L ? newComp(kind) : newTour(); }, 'o')); b.appendChild(bar);
    if (!L) { if (!list.length) b.appendChild(h('p', 'sub', 'Aún no hay torneos. Pulsa "+ Crear torneo": eliges el formato (Champions, Mundial, eliminatoria o todos contra todos), los equipos y el calendario se genera solo.'));
      else b.appendChild(table(['Nombre', 'Formato', 'Equipos', 'Fase', ''], list.map(function (c) { var F = $.TF[c.format] || $.TF.knockout; return [h('b', null, c.name), F.i + ' ' + F.n, String(c.teamIds.length), (c.status === 'paused' ? '⏸ ' : c.status === 'finished' && c.state ? '✓ ' : '') + phaseLabel(c), [btn('Gestionar', function () { tourDlg(c.id); }, c.state && c.state.phase === 'done' ? '' : 'o')]]; }))); return; }
    b.appendChild(table(['Nombre', 'Estado', 'Equipos', L ? 'Puntos (V/D)' : 'Formato', ''], list.map(function (c) { return [h('b', null, c.name), $.ST[c.status], String(c.teamIds.length), L ? c.config.win + ' / ' + c.config.loss : (c.format === 'knockout' ? 'Eliminatoria · al mejor de ' + c.best_of : c.format === 'groups_knockout' ? 'Mundial · ' + c.gcfg.n + ' grupos, pasan ' + c.gcfg.q : c.format === 'champions' ? 'Champions · liga ida y vuelta + play-off' : 'Todos contra todos'), [btn('Gestionar', function () { compDlg(kind, c.id); })]]; })));
  }
  function newComp(kind) {
    var L = kind === 'leagues', f = [{ k: 'n', label: 'Nombre', maxlength: 40 }, { k: 'd', label: 'Descripción (opcional)', type: 'textarea' }];
    if (L) f.push({ k: 'w', label: 'Puntos por victoria', type: 'number', value: 3, min: 1, max: 10 }, { k: 'l', label: 'Puntos por derrota', type: 'number', value: 0, min: 0, max: 9 });
    else f.push({ k: 'f', label: 'Formato', type: 'select', value: 'knockout', options: [['knockout', 'Eliminatoria directa'], ['round_robin', 'Todos contra todos'], ['groups_knockout', 'Mundial: fase de grupos + eliminatoria'], ['champions', 'Champions: liga ida y vuelta + play-off + eliminatoria']] }, { k: 'g', label: 'Número de grupos (solo formato Mundial)', type: 'select', value: 4, options: [[1, '1 grupo'], [2, '2 grupos'], [3, '3 grupos'], [4, '4 grupos'], [5, '5 grupos'], [6, '6 grupos'], [7, '7 grupos'], [8, '8 grupos']] }, { k: 'q', label: 'Clasifican por grupo (solo formato Mundial)', type: 'select', value: 2, options: [[1, 'El 1.º'], [2, 'Los 2 primeros'], [3, 'Los 3 primeros'], [4, 'Los 4 primeros']] }, { k: 'b', label: 'Series (sin empates)', type: 'select', value: 3, options: [[1, 'A 1 partida'], [3, 'Al mejor de 3'], [5, 'Al mejor de 5'], [7, 'Al mejor de 7']] }, { k: 'r', label: 'Reglas (opcional)', type: 'textarea' });
    ask('Crear ' + (L ? 'liga' : 'torneo'), f, function (v) {
      var n = okName(v.n, 2, 40); if (!n) return 'Nombre no válido (2 a 40 caracteres).'; if (S()[kind].some(function (c) { return nk(c.name) === nk(n); })) return 'Ya existe uno con ese nombre.';
      var c = { id: MAGNA.id(), name: n, description: (v.d || '').slice(0, 500), status: 'draft', teamIds: [] };
      if (L) { var w = Number(v.w), l = Number(v.l); if (!(Number.isInteger(w) && Number.isInteger(l) && w > l && l >= 0)) return 'Los puntos por victoria deben ser mayores que por derrota (no hay empates).'; c.config = { win: w, loss: l }; }
      else { c.format = v.f; c.best_of = Number(v.b); c.rules = (v.r || '').slice(0, 2000); c.state = null; if (v.f === 'groups_knockout') { c.gcfg = { n: Number(v.g), q: Number(v.q) }; if (c.gcfg.n * c.gcfg.q < 2) return 'Con 1 grupo deben clasificar al menos 2 equipos.'; } }
      S()[kind].push(c); MAGNA.addNews((L ? 'league' : 'tournament') + '_created', 'Se crea ' + (L ? 'la liga' : 'el torneo') + ': ' + n + '.'); commit('Creado'); }, 'Crear');
  }
  function compMatches(kind, c) { var ty = kind === 'leagues' ? 'league' : 'tournament'; return S().matches.filter(function (m) { return m.type === ty && m.cid === c.id; }); }
  function compDlg(kind, cid) {
    if (kind === 'tournaments') return tourDlg(cid);
    var c = by(S()[kind], cid), L = kind === 'leagues', ty = L ? 'league' : 'tournament';
    dialog(c.name, function (b, close) {
      var box = h('div'); b.appendChild(box);
      function draw() {
        box.innerHTML = ''; box.appendChild(h('p', 'sub', $.ST[c.status] + ' · ' + c.teamIds.length + ' equipos'));
        var a = h('div', 'bar2'); $.NEXT[c.status].forEach(function (x) { a.appendChild(btn(x[1], function () {
          if (x[0] === 'active' && c.status === 'draft' && c.teamIds.length < 2) return toast('Inscribe al menos 2 equipos antes de activar.', true);
          var go = function () { c.status = x[0]; MAGNA.addNews(ty + '_' + x[0], (x[0] === 'active' ? 'Arranca ' : x[0] === 'paused' ? 'En pausa: ' : x[0] === 'finished' ? 'Finaliza ' : 'Se reanuda: ') + c.name + '.'); MAGNA.save(); draw(); render(); };
          x[0] === 'finished' ? confirmBox('¿Finalizar ' + c.name + '?', 'Ya no se podrá modificar.', 'Finalizar', go) : go(); }, x[0] === 'active' ? 'o' : '')); });
        if (c.status !== 'finished') a.appendChild(btn('Elegir equipos', function () { pickTeams(c, ty, draw); }));
        if (c.status === 'draft') a.appendChild(btn('Eliminar', function () { confirmBox('¿Eliminar ' + c.name + '?', 'Se borra con sus partidos.', 'Eliminar', function () { S().matches = S().matches.filter(function (m) { return !(m.type === ty && m.cid === c.id); }); S()[kind] = S()[kind].filter(function (x) { return x.id !== c.id; }); close(); commit('Eliminado'); }); }, 'd'));
        box.appendChild(a);
        if (L) { var rows = MAGNA.standings(Object.assign({ kind: 'league' }, c)); box.appendChild(h('h2', 'x', 'Clasificación')); box.appendChild(table(['#', 'Equipo', 'PJ', 'G', 'P', 'DG', 'Pts'], rows.map(function (r) { return [r.pos, r.team, r.pj, r.g, r.p, r.dg, r.pts]; }))); }
        else {
          var st = c.state, CH = c.format === 'champions'; box.appendChild(h('h2', 'x', 'Calendario automático'));
          if (CH && !st) { var sp0 = MAGNA.champSplit(c.teamIds.length); box.appendChild(h('p', 'sub', sp0 ? 'Con ' + c.teamIds.length + ' equipos: liga de ida y vuelta (' + (c.teamIds.length - 1) * 2 + ' jornadas) · ' + chTxt(c) + '. Eliminatoria a partido único.' : 'El formato Champions necesita al menos 3 equipos.')); }
          if (!st) { box.appendChild(h('p', 'sub', c.status === 'active' ? 'Genera los cruces según el formato.' : 'Activa el torneo con al menos 2 equipos para generar los cruces.')); var g = btn('Generar calendario', function () { var e = generate(c); if (e) toast(e, true); else { MAGNA.addNews('tournament_bracket', 'Se genera el calendario de ' + c.name + '.'); MAGNA.save(); draw(); render(); } }, 'o'); g.disabled = c.status !== 'active'; box.appendChild(g); }
          if (st && window.PRED) { var pdb = h('div', 'bar2'); pdb.appendChild(btn('🔮 Predicciones de la llave', function () { predDlg(c); })); var pl = h('a', 'lk', 'Ver página ↗'); pl.href = 'prediccion.html?t=' + c.id; pl.target = '_blank'; pl.rel = 'noopener'; pdb.appendChild(pl); box.appendChild(pdb); }
          else { box.appendChild(h('p', 'sub', st.phase === 'done' ? 'Campeón: ' + MAGNA.teamName(st.champion) : st.phase === 'league' ? 'Todos contra todos en curso' : st.phase === 'groups' ? (CH ? 'Fase de liga (ida y vuelta) en curso · ' + chTxt(c) : 'Fase de grupos en curso · clasifican ' + c.gcfg.q + ' por grupo') : st.phase === 'playoff' ? 'Play-off en curso · ' + st.direct.length + ' equipos esperan en ' + MAGNA.koName(st.direct.length * 2) : 'Ronda actual: ' + st.round));
            if (CH && c.groups) { var sp = MAGNA.champSplit(c.groups[0].teamIds.length); box.appendChild(h('h2', 'x', 'Fase de liga')); box.appendChild(table(['#', 'Equipo', 'PJ', 'G', 'P', 'DG', 'Pts'], MAGNA.groupTable(c, c.groups[0]).map(function (r) { return [r.pos <= sp.direct ? r.pos + ' ✓' : r.pos <= sp.direct + sp.playoff ? r.pos + ' ▶' : r.pos, r.team, r.pj, r.g, r.p, r.dg, r.pts]; }))); box.appendChild(h('p', 'sub', '✓ directo a ' + (sp.direct === 1 ? 'la final' : MAGNA.koName(sp.direct * 2).toLowerCase()) + ' · ▶ juega el play-off' + (sp.out ? ' · sin marca: eliminado' : ''))); }
            else if (c.groups) c.groups.forEach(function (g) { var q = c.gcfg.q; box.appendChild(h('h2', 'x', 'Grupo ' + g.name)); box.appendChild(table(['#', 'Equipo', 'PJ', 'G', 'P', 'DG', 'Pts'], MAGNA.groupTable(c, g).map(function (r) { return [r.pos <= q ? r.pos + ' ✓' : r.pos, r.team, r.pj, r.g, r.p, r.dg, r.pts]; }))); });
            if (st.phase === 'groups') { var gb = h('div', 'bar2');
              gb.appendChild(btn(CH ? 'Pasar al play-off' : 'Pasar a la eliminatoria', function () { var e = toKnockout(c); if (e) toast(e, true); else { MAGNA.save(); draw(); render(); } }, 'o'));
              if (!CH && !compMatches(kind, c).some(function (m) { return m.status === 'finished'; })) gb.appendChild(btn('Repetir sorteo de grupos', function () { confirmBox('¿Repetir el sorteo?', 'Se borran los partidos de grupos (ninguno se ha jugado) y se reparten los equipos de nuevo.', 'Repetir', function () { S().matches = S().matches.filter(function (m) { return !(m.type === 'tournament' && m.cid === c.id); }); c.state = null; c.groups = null; var e = generate(c); if (e) toast(e, true); MAGNA.save(); draw(); render(); }); }));
              box.appendChild(gb); }
            if (st.phase === 'knockout' || st.phase === 'playoff') box.appendChild(btn(st.phase === 'playoff' ? 'Pasar a ' + MAGNA.koName(st.direct.length * 2) : 'Avanzar a la siguiente ronda', function () { var e = advance(c); if (e) toast(e, true); else { MAGNA.save(); draw(); render(); } }, 'o')); }
        }
        var ms = compMatches(kind, c); box.appendChild(h('h2', 'x', 'Partidos (' + ms.length + ')'));
        box.appendChild(table(['Ronda', 'Partido', 'Resultado'], ms.map(function (m) { return [m.round, MAGNA.teamName(m.home) + ' vs ' + MAGNA.teamName(m.away), m.status === 'finished' ? m.hs + ' - ' + m.as : m.status === 'cancelled' ? 'Cancelado' : 'Pendiente']; })));
      }
      draw(); var r = h('div', 'row'); r.appendChild(btn('Cerrar', function () { close(); render(); banner(); })); b.appendChild(r);
    });
  }
  function pickTeams(c, ty, done) {
    dialog('Participantes de ' + c.name, function (b, close) {
      var chk = h('div', 'chk'), boxes = [];
      S().teams.forEach(function (t) { var l = h('label'), i = h('input'); i.type = 'checkbox'; i.checked = c.teamIds.indexOf(t.id) >= 0; i.value = t.id; boxes.push(i); l.appendChild(i); l.appendChild(document.createTextNode(t.name)); chk.appendChild(l); });
      if (!S().teams.length) b.appendChild(h('p', 'sub', 'Primero crea equipos.')); b.appendChild(chk); var err = h('p', 'err'); b.appendChild(err);
      var r = h('div', 'row'); r.appendChild(btn('Cancelar', close)); r.appendChild(btn('Guardar', function () {
        var ids = boxes.filter(function (i) { return i.checked; }).map(function (i) { return Number(i.value); });
        var removed = c.teamIds.filter(function (i) { return ids.indexOf(i) < 0; });
        if (removed.some(function (t) { return S().matches.some(function (m) { return m.type === ty && m.cid === c.id && m.status !== 'cancelled' && (m.home === t || m.away === t); }); })) { err.textContent = 'No puedes retirar a un equipo con partidos. Cancélalos antes.'; return; }
        c.teamIds = ids; MAGNA.save(); close(); done(); }, 'o')); b.appendChild(r);
    });
  }
  function rrRounds(n) { return n % 2 ? n : n - 1; }
  function chTxtN(n) { var sp = MAGNA.champSplit(n); if (!sp) return ''; var D = sp.direct, K = sp.playoff;
    return (D === 1 ? '1.º' : '1.º–' + D + '.º') + ' directo a ' + (D === 1 ? 'la final' : MAGNA.koName(D * 2).toLowerCase()) + ', ' + (D + 1) + '.º–' + (D + K) + '.º play-off' + (sp.out ? ', ' + (D + K + 1) + '.º en adelante eliminados' : ''); }
  function chTxt(c) { return chTxtN((c.groups ? c.groups[0].teamIds : c.teamIds).length); }
  function plan(f, n, g, q, legs) {
    if (n < $.TF[f].min) return { ok: false, t: 'Elige al menos ' + $.TF[f].min + ' equipos.' };
    if (f === 'champions') { var R = rrRounds(n), L2 = legs === 1 ? 1 : 2; return { ok: true, t: '<b>' + n + ' equipos</b> · fase de liga de ' + L2 * R + ' jornadas (' + L2 * n * (n - 1) / 2 + ' partidos' + (L2 === 2 ? ', ida y vuelta' : ', solo ida') + ').<br>' + chTxtN(n) + '. Eliminatoria a partido único.' }; }
    if (f === 'groups_knockout') { if (n < g * 2) return { ok: false, t: 'Con ' + g + ' grupos necesitas al menos ' + g * 2 + ' equipos.' }; if (Math.floor(n / g) < q) return { ok: false, t: 'Con ' + n + ' equipos en ' + g + ' grupos no pueden clasificar ' + q + ' por grupo.' }; if (g * q < 2) return { ok: false, t: 'Con 1 grupo deben clasificar al menos 2.' };
      var lo = Math.floor(n / g), hi = Math.ceil(n / g), size = 1; while (size < g * q) size *= 2; return { ok: true, t: '<b>' + n + ' equipos</b> en ' + g + ' grupo' + (g > 1 ? 's' : '') + ' de ' + (lo === hi ? lo : lo + '–' + hi) + ' (sorteo automático). Pasan ' + q + ' por grupo → ' + MAGNA.koName(size).toLowerCase() + '.' }; }
    if (f === 'knockout') { var s = 1; while (s < n) s *= 2; return { ok: true, t: '<b>' + n + ' equipos</b> · primera ronda: ' + MAGNA.koName(s).toLowerCase() + (s > n ? ' (' + (s - n) + ' pasan directo a la siguiente ronda)' : '') + '.' }; }
    return { ok: true, t: '<b>' + n + ' equipos</b> · ' + rrRounds(n) + ' jornadas (' + n * (n - 1) / 2 + ' partidos). Al terminar, el líder es campeón.' };
  }
  function edInfo(raw) { var base = MAGNA.baseName(raw), k = nk(base), same = S().tournaments.filter(function (c) { return nk(MAGNA.baseName(c.name)) === k; }).sort(function (a, b) { return a.id - b.id; }),
      hist = (S().history || []).filter(function (e) { return nk(MAGNA.baseName(e.name)) === k; }), manual = 0;
    // ediciones ya registradas como trofeos con temporada en romano (OmegaCup IV, V…)
    S().teams.forEach(function (t) { (t.trophies || []).forEach(function (x) { if (nk(MAGNA.baseName(x.name)) === k) { var r = MAGNA.romanNo(x.season); if (r && r > manual) manual = r; if (!same.length && !hist.length) base = MAGNA.baseName(x.name); } }); });
    if (same.length) base = MAGNA.baseName(same[0].name); else if (hist.length) base = MAGNA.baseName(hist[0].name); // se respeta cómo se escribió la primera edición
    var start = Math.max(manual, hist.length), last = start;
    same.forEach(function (c) { var e = MAGNA.editionNo(c.name); last = e ? Math.max(last, e) : last + 1; });
    var n = (same.length || start) ? last + 1 : 1;
    return { base: base, n: n, prev: n - 1, name: n > 1 ? MAGNA.editionName(base, n) : base, number: function () { var x = start; same.forEach(function (c) { if (MAGNA.editionNo(c.name) == null) c.name = MAGNA.editionName(base, ++x); else x = Math.max(x, MAGNA.editionNo(c.name)); }); } }; }
  function webLink(c) { return $.TF[c.format] ? $.TF[c.format].p + (c.format === 'champions' ? '?t=' + c.id : '') : 'competiciones.html'; }
  function newTour() {
    dialog('Nuevo torneo', function (b, close) {
      var f = 'champions', name = h('input', 'in'); name.maxLength = 40; name.placeholder = 'Ej.: Champions Magna 2026';
      var l0 = h('label', 'f', 'Nombre'); l0.appendChild(name); var edh = h('p', 'hint'); edh.style.margin = '6px 0 0'; l0.appendChild(edh); b.appendChild(l0);
      name.addEventListener('input', function () { var v = (name.value || '').trim(); if (v.length < 2) { edh.textContent = ''; return; } var e = edInfo(v); edh.textContent = e.n > 1 ? '📚 "' + e.base + '" ya tiene ' + e.prev + (e.prev === 1 ? ' edición' : ' ediciones') + ' registradas: este será la edición ' + MAGNA.toRoman(e.n) + ' (' + e.name + ').' : 'Torneos con el mismo nombre se cuentan como ediciones del mismo torneo.'; });
      b.appendChild(h('div', 'tf-sec', '1 · Formato')); var grid = h('div', 'tf-grid'); b.appendChild(grid);
      var gOpt = h('div', 'tf-two'), gs = h('select', 'in'), qs = h('select', 'in');
      [1, 2, 3, 4, 5, 6, 7, 8].forEach(function (n) { var o = h('option', null, n + (n > 1 ? ' grupos' : ' grupo')); o.value = n; if (n === 4) o.selected = true; gs.appendChild(o); });
      [[1, 'El 1.º'], [2, 'Los 2 primeros'], [3, 'Los 3 primeros'], [4, 'Los 4 primeros']].forEach(function (x) { var o = h('option', null, x[1]); o.value = x[0]; if (x[0] === 2) o.selected = true; qs.appendChild(o); });
      var lg = h('label', 'f', 'Grupos'); lg.appendChild(gs); var lq = h('label', 'f', 'Clasifican por grupo'); lq.appendChild(qs); gOpt.appendChild(lg); gOpt.appendChild(lq); b.appendChild(gOpt);
      var bo = h('select', 'in'); [[1, 'A 1 partida'], [3, 'Al mejor de 3'], [5, 'Al mejor de 5'], [7, 'Al mejor de 7']].forEach(function (x) { var o = h('option', null, x[1]); o.value = x[0]; if (x[0] === 3) o.selected = true; bo.appendChild(o); });
      var lgs = h('select', 'in'); [[2, 'Ida y vuelta (cada pareja juega 2 veces)'], [1, 'Solo ida (cada pareja juega 1 vez)']].forEach(function (x) { var o = h('option', null, x[1]); o.value = x[0]; lgs.appendChild(o); });
      var ll = h('label', 'f', 'Fase de liga'); ll.appendChild(lgs); b.appendChild(ll); lgs.onchange = function () { upd(); };
      var lb = h('label', 'f', 'Cada partido se juega'); lb.appendChild(bo); b.appendChild(lb);
      var sec = h('div', 'tf-sec'), cnt = h('span'), sp = h('span', 'sp'); sec.appendChild(document.createTextNode('2 · Equipos ')); sec.appendChild(cnt); sec.appendChild(sp);
      var boxes = [], all = btn('Todos', function () { boxes.forEach(function (i) { i.checked = true; }); upd(); }), none = btn('Ninguno', function () { boxes.forEach(function (i) { i.checked = false; }); upd(); });
      sec.appendChild(all); sec.appendChild(none); b.appendChild(sec);
      var chk = h('div', 'chk'); S().teams.forEach(function (t) { var l = h('label'), i = h('input'); i.type = 'checkbox'; i.value = t.id; i.checked = true; i.onchange = upd; boxes.push(i); l.appendChild(i); l.appendChild(document.createTextNode(t.name)); chk.appendChild(l); });
      if (!S().teams.length) b.appendChild(h('p', 'sub', 'Primero registra equipos en la sección Equipos.')); b.appendChild(chk);
      var pl = h('div', 'tf-plan'); b.appendChild(pl);
      var more = h('details', 'tf-more'), sm = h('summary', null, 'Descripción y reglas (opcional)'); more.appendChild(sm);
      var de = h('textarea', 'in'); de.rows = 2; de.placeholder = 'Descripción'; var ru = h('textarea', 'in'); ru.rows = 3; ru.placeholder = 'Reglas'; more.appendChild(de); more.appendChild(ru); b.appendChild(more);
      var err = h('p', 'err'); b.appendChild(err);
      Object.keys($.TF).forEach(function (k) { var x = $.TF[k], c = h('button', 'tf-card'); c.type = 'button'; c.dataset.f = k; c.appendChild(h('em', null, x.i)); c.appendChild(h('b', null, x.n)); c.appendChild(h('span', null, x.d)); c.onclick = function () { f = k; upd(); }; grid.appendChild(c); });
      function ids() { return boxes.filter(function (i) { return i.checked; }).map(function (i) { return Number(i.value); }); }
      function upd() { [].forEach.call(grid.children, function (c) { c.classList.toggle('on', c.dataset.f === f); }); gOpt.style.display = f === 'groups_knockout' ? '' : 'none'; ll.style.display = f === 'champions' ? '' : 'none';
        var n = ids().length, p = plan(f, n, Number(gs.value), Number(qs.value), Number(lgs.value)); cnt.textContent = '(' + n + ' de ' + S().teams.length + ')'; pl.innerHTML = p.t; pl.classList.toggle('bad', !p.ok); return p; }
      gs.onchange = upd; qs.onchange = upd; upd();
      function create(gen) {
        var n = okName(name.value, 2, 40); if (!n) { err.textContent = 'Escribe un nombre (2 a 40 caracteres).'; name.focus(); return; }
        var ed = edInfo(n); n = ed.name;
        var p = upd(); if (gen && !p.ok) { err.textContent = p.t.replace(/<[^>]+>/g, ''); return; }
        var c = { id: MAGNA.id(), name: n, description: (de.value || '').slice(0, 500), status: gen ? 'active' : 'draft', teamIds: ids(), format: f, best_of: Number(bo.value), legs: f === 'champions' ? Number(lgs.value) : undefined, rules: (ru.value || '').slice(0, 2000), state: null };
        if (f === 'groups_knockout') c.gcfg = { n: Number(gs.value), q: Number(qs.value) };
        ed.number(); S().tournaments.push(c); MAGNA.addNews('tournament_created', ed.n > 1 ? 'Arranca ' + ed.name + ', la edición ' + MAGNA.toRoman(ed.n) + ' de ' + ed.base + '.' : 'Se crea el torneo: ' + n + '.');
        if (gen) { var e = generate(c); if (e) { c.status = 'draft'; err.textContent = e; MAGNA.save(); return; } MAGNA.addNews('tournament_bracket', 'Arranca ' + n + ': ya está el calendario.'); }
        close(); commit(gen ? 'Torneo creado y calendario generado' : 'Borrador guardado'); tourDlg(c.id);
      }
      var r = h('div', 'row'); r.appendChild(btn('Cancelar', close)); r.appendChild(btn('Guardar borrador', function () { create(false); })); r.appendChild(btn('Crear y generar calendario', function () { create(true); }, 'o')); b.appendChild(r);
      name.focus();
    });
  }
  function steps(c) { var f = c.format; return f === 'champions' ? ['Equipos', 'Calendario', 'Fase de liga', 'Play-off', 'Eliminatoria', 'Campeón'] : f === 'groups_knockout' ? ['Equipos', 'Calendario', 'Fase de grupos', 'Eliminatoria', 'Campeón'] : f === 'knockout' ? ['Equipos', 'Calendario', 'Eliminatoria', 'Campeón'] : ['Equipos', 'Calendario', 'Liga', 'Campeón']; }
  function stepIx(c) { var st = c.state, s = steps(c); if (!st) return c.teamIds.length < ($.TF[c.format] || $.TF.knockout).min ? 0 : 1; if (st.phase === 'done') return s.length - 1;
    if (st.phase === 'groups' || st.phase === 'league') return 2; if (st.phase === 'playoff') return 3; return s.length - 2; }
  function phaseLabel(c) { if (c.state && c.state.phase === 'done') return '🏆 ' + MAGNA.teamName(c.state.champion); if (c.state && c.state.round && c.state.phase !== 'groups') return c.state.round; return steps(c)[stepIx(c)]; }
  function phaseMatches(c) { var st = c.state, ms = S().matches.filter(function (m) { return m.type === 'tournament' && m.cid === c.id && m.status !== 'cancelled'; });
    if (st.phase === 'groups') return ms.filter(function (m) { return m.group; }); if (st.phase === 'league') return ms; return ms.filter(function (m) { return m.round === st.round; }); }
  function proclaim(c) { var ms = phaseMatches(c); if (ms.some(function (m) { return m.status !== 'finished'; })) return 'Aún hay partidos sin terminar.'; var t = MAGNA.groupTable(c, { teamIds: c.teamIds })[0]; if (!t) return 'No hay equipos.';
    c.state = { phase: 'done', champion: t.team_id }; MAGNA.addNews('tournament_bracket', t.team + ' es campeón de ' + c.name + '.'); return null; }
  function tourDlg(cid) {
    var c = by(S().tournaments, cid);
    dialog(c.name, function (b, close) {
      var box = h('div'); b.appendChild(box);
      function done(e, msg) { if (e) return toast(e, true); MAGNA.save(); if (msg) toast(msg); draw(); render(); }
      function regen() { c.status = 'active'; var e = generate(c); if (!e) MAGNA.addNews('tournament_bracket', 'Arranca ' + c.name + ': ya está el calendario.'); done(e, 'Calendario generado'); }
      function draw() {
        box.innerHTML = ''; var st = c.state, F = $.TF[c.format] || $.TF.knockout, sx = stepIx(c);
        var hd = h('div', 'tf-head'); hd.appendChild(h('span', 'tf-badge', F.i + ' ' + F.n)); hd.appendChild(h('span', 'tf-badge', $.ST[c.status] + ' · ' + c.teamIds.length + ' equipos'));
        var wl = h('a', null, 'Ver en la web ↗'); wl.href = webLink(c); wl.target = '_blank'; wl.rel = 'noopener'; hd.appendChild(wl); box.appendChild(hd);
        var sw = h('div', 'tf-steps'); steps(c).forEach(function (s, i) { sw.appendChild(h('span', i < sx ? 'ok' : i === sx ? 'on' : '', (i < sx ? '✓ ' : (i + 1) + '. ') + s)); }); box.appendChild(sw);
        var nx = h('div', 'tf-next'), act = h('div', 'bar2'); box.appendChild(nx);
        function card(t, p, pg) { nx.appendChild(h('h4', null, t)); if (p) nx.appendChild(h('p', null, p)); if (pg != null) { var g = h('div', 'tf-pg'), i = h('i'); i.style.width = Math.round(pg * 100) + '%'; g.appendChild(i); nx.appendChild(g); } nx.appendChild(act); }
        if (c.status === 'paused') { card('Torneo en pausa', 'Reanúdalo para seguir cargando resultados.'); act.appendChild(btn('Reanudar', function () { c.status = 'active'; done(null, 'Reanudado'); }, 'o')); }
        else if (!st) {
          var p = plan(c.format, c.teamIds.length, c.gcfg ? c.gcfg.n : 1, c.gcfg ? c.gcfg.q : 1, c.legs);
          if (sx === 0) { card('Paso 1: elige los equipos', 'Inscribe al menos ' + F.min + ' equipos para poder generar el calendario.'); act.appendChild(btn('Elegir equipos', function () { pickTeams(c, 'tournament', draw); }, 'o')); }
          else { card(c.status === 'finished' ? 'Este torneo se cerró sin calendario' : 'Paso 2: genera el calendario', (c.status === 'finished' ? 'Se marcó como finalizado antes de crear los partidos, por eso no aparece en la web. ' : '') + p.t.replace(/<[^>]+>/g, ''));
            if (c.format === 'champions') { var lsel = h('select', 'in'); lsel.style.cssText = 'margin:0;max-width:340px'; [[2, 'Fase de liga: ida y vuelta'], [1, 'Fase de liga: solo ida']].forEach(function (x) { var o = h('option', null, x[1]); o.value = x[0]; if ((c.legs || 2) === x[0]) o.selected = true; lsel.appendChild(o); }); lsel.onchange = function () { c.legs = Number(lsel.value); MAGNA.save(); draw(); }; act.appendChild(lsel); }
            var gb = btn(c.status === 'finished' ? 'Reabrir y generar calendario' : 'Generar calendario', regen, 'o'); gb.disabled = !p.ok; act.appendChild(gb); act.appendChild(btn('Cambiar equipos', function () { pickTeams(c, 'tournament', draw); })); }
        } else if (st.phase === 'done') {
          card('🏆 Campeón: ' + MAGNA.teamName(st.champion), c.status === 'finished' ? 'Torneo cerrado. El título ya cuenta en la vitrina del equipo.' : 'El título ya cuenta en la vitrina del equipo. Cierra el torneo cuando quieras archivarlo.');
          if (c.status !== 'finished') act.appendChild(btn('Cerrar torneo', function () { c.status = 'finished'; MAGNA.addNews('tournament_finished', 'Finaliza ' + c.name + '.'); done(null, 'Torneo cerrado'); }, 'o'));
        } else {
          var pm = phaseMatches(c), fin = pm.filter(function (m) { return m.status === 'finished'; }).length, left = pm.length - fin, ph = st.phase === 'groups' ? (c.format === 'champions' ? 'la fase de liga' : 'la fase de grupos') : st.phase === 'league' ? 'la liga' : st.round;
          if (left) { card('Juega ' + ph, 'Van ' + fin + ' de ' + pm.length + ' partidos con resultado. Cárgalos en Partidos (o desde la consola en vivo); cuando estén todos, aquí aparece el siguiente paso.', fin / (pm.length || 1));
            act.appendChild(btn('Cargar resultados', function () { $.MF = 'tournament:' + c.id; close(); go('partidos'); }, 'o')); }
          else {
            var nl = st.phase === 'groups' ? (c.format === 'champions' ? 'Pasar al play-off' : 'Pasar a la eliminatoria') : st.phase === 'league' ? 'Proclamar campeón' : st.phase === 'playoff' ? 'Pasar a ' + MAGNA.koName(st.direct.length * 2).toLowerCase() : (st.round === 'Final' ? 'Proclamar campeón' : 'Pasar a la siguiente ronda');
            card('✓ Resultados completos: ' + ph.replace(/^la /, ''), st.phase === 'groups' && c.format === 'champions' ? chTxt(c) + '.' : 'Todos los partidos tienen resultado. Los cruces siguientes se arman solos.', 1);
            act.appendChild(btn(nl, function () { done(st.phase === 'groups' ? toKnockout(c) : st.phase === 'league' ? proclaim(c) : advance(c)); }, 'o'));
          }
        }
        if (st && c.format === 'champions' && c.groups) { var sp = MAGNA.champSplit(c.groups[0].teamIds.length); box.appendChild(h('h2', 'x', 'Fase de liga')); box.appendChild(h('p', 'sub', '✓ directo a ' + (sp.direct === 1 ? 'la final' : MAGNA.koName(sp.direct * 2).toLowerCase()) + ' · ▶ play-off' + (sp.out ? ' · sin marca: eliminado' : '')));
          box.appendChild(table(['#', 'Equipo', 'PJ', 'G', 'P', 'DG', 'Pts'], MAGNA.groupTable(c, c.groups[0]).map(function (r) { return [r.pos <= sp.direct ? r.pos + ' ✓' : r.pos <= sp.direct + sp.playoff ? r.pos + ' ▶' : r.pos, r.team, r.pj, r.g, r.p, r.dg, r.pts]; }))); }
        else if (st && c.groups) c.groups.forEach(function (g) { var q = c.gcfg.q; box.appendChild(h('h2', 'x', 'Grupo ' + g.name)); box.appendChild(table(['#', 'Equipo', 'PJ', 'G', 'P', 'DG', 'Pts'], MAGNA.groupTable(c, g).map(function (r) { return [r.pos <= q ? r.pos + ' ✓' : r.pos, r.team, r.pj, r.g, r.p, r.dg, r.pts]; }))); });
        else if (st && c.format === 'round_robin') { box.appendChild(h('h2', 'x', 'Tabla')); box.appendChild(table(['#', 'Equipo', 'PJ', 'G', 'P', 'DG', 'Pts'], MAGNA.groupTable(c, { teamIds: c.teamIds }).map(function (r) { return [r.pos, r.team, r.pj, r.g, r.p, r.dg, r.pts]; }))); }
        var ms = compMatches('tournaments', c).filter(function (m) { return !m.group || !st || st.phase === 'groups'; });
        if (ms.length) { box.appendChild(h('h2', 'x', st && st.phase !== 'groups' && st.phase !== 'league' && c.groups ? 'Eliminatoria' : 'Partidos (' + ms.length + ')'));
          box.appendChild(table(['Ronda', 'Partido', 'Resultado'], ms.slice(-40).map(function (m) { return [m.round, MAGNA.teamName(m.home) + ' vs ' + MAGNA.teamName(m.away), m.status === 'finished' ? m.hs + ' - ' + m.as : m.status === 'cancelled' ? 'Cancelado' : m.status === 'live' ? 'En vivo' : 'Pendiente']; }))); }
        var mo = h('details', 'tf-more'); mo.appendChild(h('summary', null, 'Más opciones')); var ma = h('div', 'bar2'); mo.appendChild(ma); box.appendChild(mo);
        if (c.status !== 'finished') ma.appendChild(btn('Elegir equipos', function () { pickTeams(c, 'tournament', draw); }));
        if (c.status === 'active') ma.appendChild(btn('Pausar', function () { c.status = 'paused'; done(null, 'En pausa'); }));
        if (c.status === 'finished') ma.appendChild(btn('Reabrir', function () { c.status = 'active'; done(null, 'Reabierto'); }));
        ma.appendChild(btn('Editar nombre y reglas', function () { ask('Editar ' + c.name, [{ k: 'n', label: 'Nombre', value: c.name, maxlength: 60 }, { k: 'd', label: 'Descripción', type: 'textarea', value: c.description || '' }, { k: 'r', label: 'Reglas', type: 'textarea', value: c.rules || '' }], function (v) { var n = okName(v.n, 2, 60); if (!n) return 'Nombre no válido.'; if (S().tournaments.some(function (x) { return x !== c && nk(x.name) === nk(n); })) return 'Ya existe uno con ese nombre (si es otra edición, añade "· 2.ª edición").'; c.name = n; c.description = (v.d || '').slice(0, 500); c.rules = (v.r || '').slice(0, 2000); MAGNA.save(); draw(); render(); }); }));
        if (st) ma.appendChild(btn('Reiniciar calendario', function () { var pl = compMatches('tournaments', c).filter(function (m) { return m.status === 'finished'; }).length; confirmBox('¿Reiniciar el calendario de ' + c.name + '?', 'Se borran todos sus partidos' + (pl ? ' (incluidos ' + pl + ' con resultado)' : '') + ' y vuelve al paso "Generar calendario".', 'Reiniciar', function () { S().matches = S().matches.filter(function (m) { return !(m.type === 'tournament' && m.cid === c.id); }); c.state = null; c.groups = null; done(null, 'Calendario borrado'); }); }, 'd'));
        ma.appendChild(btn('Eliminar torneo', function () { confirmBox('¿Eliminar ' + c.name + '?', 'Se borra con todos sus partidos. No se puede deshacer.', 'Eliminar', function () { S().matches = S().matches.filter(function (m) { return !(m.type === 'tournament' && m.cid === c.id); }); S().tournaments = S().tournaments.filter(function (x) { return x.id !== c.id; }); close(); commit('Torneo eliminado'); }); }, 'd'));
      }
      draw(); var r = h('div', 'row'); r.appendChild(btn('Cerrar', function () { close(); render(); banner(); })); b.appendChild(r);
    });
  }
  function rname(n) { return n === 2 ? 'Final' : n === 4 ? 'Semifinales' : n === 8 ? 'Cuartos de final' : n === 16 ? 'Octavos de final' : 'Ronda de ' + n; }
  function addM(c, round, a, b) { S().matches.push({ id: MAGNA.id(), type: 'tournament', cid: c.id, round: round, home: a, away: b, at: null, status: 'scheduled', hs: null, as: null }); }
  function koRound(c, alive) { var size = 1; while (size < alive.length) size *= 2; var byes = alive.slice(0, size - alive.length), rest = alive.slice(size - alive.length), round = rname(size);
    for (var i = 0; i < rest.length / 2; i++) addM(c, round, rest[i], rest[rest.length - 1 - i]); c.state = { phase: 'knockout', byes: byes, round: round }; }
  function generate(c) {
    if (c.status !== 'active') return 'Activa el torneo antes.'; if (c.teamIds.length < 2) return 'Inscribe al menos 2 equipos.'; if (c.state) return 'Ya tiene calendario.';
    if (c.format === 'round_robin') { rr(c.teamIds).forEach(function (ps, i) { ps.forEach(function (p) { addM(c, 'Jornada ' + (i + 1), p[0], p[1]); }); }); c.state = { phase: 'league' }; }
    else if (c.format === 'groups_knockout') {
      var n = c.gcfg.n, q = c.gcfg.q, ids = c.teamIds.slice();
      if (ids.length < n * 2) return 'Con ' + n + ' grupos necesitas al menos ' + n * 2 + ' equipos (2 por grupo).';
      if (Math.floor(ids.length / n) < q) return 'Cada grupo debe tener al menos ' + q + ' equipos para que clasifiquen ' + q + '. Inscribe más equipos o reduce los clasificados por grupo.';
      for (var i = ids.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), tmp = ids[i]; ids[i] = ids[j]; ids[j] = tmp; }
      c.groups = []; for (var g = 0; g < n; g++) c.groups.push({ name: 'ABCDEFGH'[g], teamIds: [] });
      ids.forEach(function (t, i) { c.groups[i % n].teamIds.push(t); });
      c.groups.forEach(function (gr) { rr(gr.teamIds).forEach(function (ps, i) { ps.forEach(function (p) { addM(c, 'Grupo ' + gr.name + ' · Jornada ' + (i + 1), p[0], p[1]); S().matches[S().matches.length - 1].group = gr.name; }); }); });
      c.state = { phase: 'groups' };
    }
    else if (c.format === 'champions') {
      var cid = c.teamIds.slice(); if (cid.length < 3) return 'El formato Champions necesita al menos 3 equipos.';
      for (var a = cid.length - 1; a > 0; a--) { var b = Math.floor(Math.random() * (a + 1)), t2 = cid[a]; cid[a] = cid[b]; cid[b] = t2; }
      c.groups = [{ name: 'Liga', teamIds: cid }]; var R = rr(cid);
      R.forEach(function (ps, i) { ps.forEach(function (p) { addM(c, 'Liga · Jornada ' + (i + 1), p[0], p[1]); S().matches[S().matches.length - 1].group = 'Liga'; }); });
      if (c.legs !== 1) R.forEach(function (ps, i) { ps.forEach(function (p) { addM(c, 'Liga · Jornada ' + (R.length + i + 1), p[1], p[0]); S().matches[S().matches.length - 1].group = 'Liga'; }); });
      c.state = { phase: 'groups' };
    }
    else koRound(c, c.teamIds.slice()); return null;
  }
  function toPlayoff(c) {
    var gm = S().matches.filter(function (m) { return m.type === 'tournament' && m.cid === c.id && m.group && m.status !== 'cancelled'; });
    if (gm.some(function (m) { return m.status !== 'finished'; })) return 'Aún hay partidos de la fase de liga sin terminar.';
    var tab = MAGNA.groupTable(c, c.groups[0]).map(function (r) { return r.team_id; }), sp = MAGNA.champSplit(tab.length); if (!sp) return 'Faltan equipos.';
    var D = sp.direct, K = sp.playoff, pairs = [];
    for (var j = 0; j < K / 2; j++) { pairs.push([tab[D + j], tab[D + K - 1 - j]]); addM(c, 'Play-off', tab[D + j], tab[D + K - 1 - j]); }
    c.state = { phase: 'playoff', round: 'Play-off', direct: tab.slice(0, D), pairs: pairs };
    MAGNA.addNews('tournament_bracket', c.name + ': termina la fase de liga. ' + tab.slice(0, D).map(MAGNA.teamName).join(', ') + (D === 1 ? ' pasa' : ' pasan') + ' directo y comienza el play-off.'); return null;
  }
  function toKnockout(c) {
    if (c.format === 'champions' && c.state && c.state.phase === 'groups') return toPlayoff(c);
    if (!c.state || c.state.phase !== 'groups') return 'El torneo no está en fase de grupos.';
    var gm = S().matches.filter(function (m) { return m.type === 'tournament' && m.cid === c.id && m.group && m.status !== 'cancelled'; });
    if (gm.some(function (m) { return m.status !== 'finished'; })) return 'Aún hay partidos de grupos sin terminar.';
    var seeds = MAGNA.groupSeeds(c).map(function (x) { return x.t; }).filter(function (t) { return t != null; });
    if (seeds.length < 2) return 'No hay suficientes clasificados.';
    if (seeds.length === 1) { c.state = { phase: 'done', champion: seeds[0] }; return null; }
    koRound(c, seeds); MAGNA.addNews('tournament_bracket', c.name + ': termina la fase de grupos y comienza ' + c.state.round + '.'); return null;
  }
  function advance(c) {
    var st = c.state;
    if (st && st.phase === 'playoff') {
      var pm = S().matches.filter(function (m) { return m.type === 'tournament' && m.cid === c.id && m.round === 'Play-off' && m.status !== 'cancelled'; });
      if (pm.some(function (m) { return m.status !== 'finished'; })) return 'Aún hay partidos del play-off sin terminar.';
      var win = st.pairs.map(function (p) { var m = pm.filter(function (x) { return (x.home === p[0] && x.away === p[1]) || (x.home === p[1] && x.away === p[0]); })[0]; return m ? (m.hs > m.as ? m.home : m.away) : null; });
      if (win.some(function (w) { return w == null; })) return 'Falta el partido de algún cruce del play-off (¿se canceló?). Prográmalo de nuevo con los mismos equipos.';
      koRound(c, st.direct.concat(win)); MAGNA.addNews('tournament_bracket', c.name + ': termina el play-off y comienzan ' + c.state.round.toLowerCase() + '.'); return null;
    }
    if (!st || st.phase !== 'knockout') return 'No hay ronda que avanzar.';
    var ms = S().matches.filter(function (m) { return m.type === 'tournament' && m.cid === c.id && m.round === st.round && m.status !== 'cancelled'; });
    if (ms.some(function (m) { return m.status !== 'finished'; })) return 'Aún hay partidos de esta ronda sin terminar.';
    var alive = st.byes.concat(ms.map(function (m) { return m.hs > m.as ? m.home : m.away; }));
    if (alive.length === 1) { c.state = { phase: 'done', champion: alive[0] }; MAGNA.addNews('tournament_bracket', MAGNA.teamName(alive[0]) + ' es campeón de ' + c.name + '.'); return null; }
    koRound(c, alive); MAGNA.addNews('tournament_bracket', c.name + ': comienza ' + c.state.round + '.'); return null;
  }
  return { compV: compV };
});
