'use strict';
// Panel de administración · módulo «comp»: se descarga solo al abrir su sección (lo carga admin.js).
ADMIN_MOD('comp', function (A) {
  var $ = A.$, ibtn = A.ibtn, ppSum = A.ppSum, stack = A.stack, S = A.S, ask = A.ask, banner = A.banner, btn = A.btn, by = A.by, commit = A.commit, confirmBox = A.confirmBox, dialog = A.dialog, evRpc = A.evRpc, go = A.go, h = A.h, nk = A.nk, okName = A.okName, render = A.render, rr = A.rr, table = A.table, toast = A.toast;
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
    var L = kind === 'leagues', list = S()[kind], word = L ? 'liga' : 'torneo', typ = L ? 'league' : 'tournament';
    var SC = { draft: '#8c8c9c', active: '#2ee59d', paused: '#ffd23f', finished: '#8b5cf6' };
    var MS = function (c) { return S().matches.filter(function (m) { return m.type === typ && m.cid === c.id && m.status !== 'cancelled'; }); };
    var act = list.filter(function (c) { return c.status === 'active'; }).length, done = list.filter(function (c) { return c.status === 'finished'; }).length, pend = 0, fin0 = 0;
    list.forEach(function (c) { MS(c).forEach(function (m) { if (m.status === 'finished') fin0++; else pend++; }); });
    ppSum(b, [[list.length, L ? 'Ligas' : 'Torneos', '#8b5cf6'], [act, 'En curso', '#2ee59d'], [pend, 'Partidos por jugar', '#22d3ee'], [done, 'Finalizad' + (L ? 'as' : 'os'), '#ffd23f']]);
    var bar = h('div', 'pp-bar'); bar.appendChild(h('p', 'cp-hint', L ? 'Cada liga suma puntos por victoria y derrota. Entra a «Gestionar» para equipos, calendario y estado.' : 'Elige el formato y los equipos: el calendario y los cruces se generan solos.')); var acts = h('div', 'pp-acts'); acts.appendChild(btn('+ Crear ' + word, function () { L ? newComp(kind) : newTour(); }, 'o')); bar.appendChild(acts); b.appendChild(bar);
    if (!list.length) { var em = h('div', 'mc-empty'); em.appendChild(h('b', null, L ? 'Aún no hay ligas' : 'Aún no hay torneos')); em.appendChild(h('small', null, L ? 'Crea la primera y añade los equipos.' : 'Pulsa «Crear torneo»: eliges el formato (Champions, Mundial, eliminatoria o todos contra todos), los equipos y el calendario se genera solo.')); em.appendChild(btn('+ Crear ' + word, function () { L ? newComp(kind) : newTour(); }, 'o')); b.appendChild(em); return; }
    var grid = h('div', 'cp-grid');
    list.slice().sort(function (x, y) { var o = { active: 0, paused: 1, draft: 2, finished: 3 }; return (o[x.status] - o[y.status]) || x.name.localeCompare(y.name); }).forEach(function (c, i) {
      var F = !L && ($.TF[c.format] || $.TF.knockout), ms = MS(c), f = ms.filter(function (m) { return m.status === 'finished'; }).length, lv = ms.filter(function (m) { return m.status === 'live'; }).length, pc = ms.length ? Math.round(f / ms.length * 100) : 0;
      var col = L ? '#8b5cf6' : c.format === 'champions' ? '#22d3ee' : c.format === 'groups_knockout' ? '#2ee59d' : c.format === 'round_robin' ? '#ff4fa3' : '#ffd23f';
      var cd = h('div', 'cp-c cp-' + c.status); cd.style.setProperty('--cc', col); cd.style.setProperty('--sc', SC[c.status] || '#8c8c9c'); cd.style.animationDelay = i * 40 + 'ms';
      var hd = h('div', 'cp-hd'); hd.appendChild(h('span', 'cp-ic', L ? '🏅' : F.i)); var nm = h('div', 'cp-nm'); nm.appendChild(h('b', null, c.name)); nm.appendChild(h('small', null, L ? 'Liga · victoria ' + c.config.win + ' pts · derrota ' + c.config.loss : F.n + (c.best_of > 1 ? ' · al mejor de ' + c.best_of : ''))); hd.appendChild(nm);
      hd.appendChild(h('span', 'cp-st', (lv ? '● ' : '') + ($.ST[c.status] || c.status))); cd.appendChild(hd);
      var mid = h('div', 'cp-mid'); mid.appendChild(stack(c.teamIds, 7)); mid.appendChild(h('small', null, c.teamIds.length + (c.teamIds.length === 1 ? ' equipo' : ' equipos'))); cd.appendChild(mid);
      if (!L) { var sp = steps(c), ix = stepIx(c), stw = h('div', 'cp-steps'); sp.forEach(function (x, k) { var d = h('span', k < ix ? 'ok' : k === ix ? 'on' : null); d.title = x; d.appendChild(h('i')); d.appendChild(h('em', null, x)); stw.appendChild(d); }); cd.appendChild(stw); }
      var pr = h('div', 'cp-pr'), pb = h('div', 'cp-bar'), pf = h('i'); pb.appendChild(pf); pr.appendChild(pb); pr.appendChild(h('small', null, ms.length ? f + ' de ' + ms.length + ' partidos jugados' + (lv ? ' · ' + lv + ' en vivo' : '') : 'Sin calendario todavía')); cd.appendChild(pr);
      requestAnimationFrame(function () { requestAnimationFrame(function () { pf.style.width = pc + '%'; }); });
      var lead = null; if (L && f) { var tb = MAGNA.standings(Object.assign({ kind: 'league' }, c))[0]; if (tb) lead = [tb.team_id, tb.pts + ' pts · ' + tb.g + 'V ' + tb.p + 'D', c.status === 'finished' ? 'Campeón' : 'Líder']; }
      if (!L && c.state && c.state.phase === 'done' && c.state.champion) lead = [c.state.champion, 'Ganó el torneo', 'Campeón'];
      var ph = h('div', 'cp-ld'); if (lead) { ph.appendChild(M.crest(lead[0], MAGNA.teamName(lead[0]), 34)); var lt = h('div'); lt.appendChild(h('small', null, lead[2] === 'Campeón' ? '🏆 ' + lead[2] : '👑 ' + lead[2])); lt.appendChild(h('b', null, MAGNA.teamName(lead[0]))); ph.appendChild(lt); ph.appendChild(h('em', null, lead[1])); } else ph.appendChild(h('small', null, L ? (c.status === 'draft' ? 'Borrador: añade equipos y actívala' : 'Aún no hay resultados') : 'Fase: ' + phaseLabel(c))); cd.appendChild(ph);
      var ft = h('div', 'cp-ft'), g = btn(c.status === 'draft' ? '⚙ Configurar' : '⚙ Gestionar', function () { L ? compDlg(kind, c.id) : tourDlg(c.id); }, 'o'); ft.appendChild(g);
      if (!L && F.p) { var pg = ibtn('open', 'Ver página', function () { window.open(F.p, '_blank'); }); ft.appendChild(pg); }
      if (L) ft.appendChild(ibtn('open', 'Ver tabla', function () { window.open('ligas.html', '_blank'); }));
      cd.appendChild(ft); cd.onclick = function (e) { if (e.target.closest('button')) return; L ? compDlg(kind, c.id) : tourDlg(c.id); };
      grid.appendChild(cd); });
    b.appendChild(grid);
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
          if (L && c.status === 'finished' && x[0] !== 'finished') { var cl = leagueClash(c); if (cl.length) return toast('No se puede reabrir: ' + cl.join(', ') + ' ya juega en otra liga.', true); }
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
          if (st && window.PRED && !c.manual) { var pdb = h('div', 'bar2'); pdb.appendChild(btn('🔮 Predicciones de la llave', function () { predDlg(c); })); var pl = h('a', 'lk', 'Ver página ↗'); pl.href = 'prediccion.html?t=' + c.id; pl.target = '_blank'; pl.rel = 'noopener'; pdb.appendChild(pl); box.appendChild(pdb); }
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
  // Un equipo solo puede estar en una liga a la vez (cuentan las ligas que no han terminado)
  function otherLeague(c, tid) { return (S().leagues || []).filter(function (l) { return l.id !== c.id && l.status !== 'finished' && (l.teamIds || []).indexOf(tid) >= 0; })[0] || null; }
  function leagueClash(c) { var out = []; (c.teamIds || []).forEach(function (t) { var o = otherLeague(c, t); if (o) out.push(MAGNA.teamName(t) + ' (' + o.name + ')'); }); return out; }
  function pickTeams(c, ty, done) {
    dialog('Participantes de ' + c.name, function (b, close) {
      var chk = h('div', 'chk'), boxes = [];
      S().teams.forEach(function (t) { var l = h('label'), i = h('input'), ol = ty === 'league' ? otherLeague(c, t.id) : null; i.type = 'checkbox'; i.checked = c.teamIds.indexOf(t.id) >= 0; i.value = t.id; boxes.push(i); l.appendChild(i); l.appendChild(document.createTextNode(t.name));
        if (ol && !i.checked) { i.disabled = true; l.style.opacity = '.45'; l.title = 'Ya juega en ' + ol.name; l.appendChild(h('small', null, ' · ya está en ' + ol.name)); } chk.appendChild(l); });
      if (ty === 'league') b.appendChild(h('p', 'sub', 'Un equipo solo puede estar en una liga a la vez. Los que ya juegan en otra liga aparecen bloqueados.'));
      if (!S().teams.length) b.appendChild(h('p', 'sub', 'Primero crea equipos.')); b.appendChild(chk); var err = h('p', 'err'); b.appendChild(err);
      var r = h('div', 'row'); r.appendChild(btn('Cancelar', close)); r.appendChild(btn('Guardar', function () {
        var ids = boxes.filter(function (i) { return i.checked; }).map(function (i) { return Number(i.value); });
        var removed = c.teamIds.filter(function (i) { return ids.indexOf(i) < 0; });
        if (removed.some(function (t) { return S().matches.some(function (m) { return m.type === ty && m.cid === c.id && m.status !== 'cancelled' && (m.home === t || m.away === t); }); })) { err.textContent = 'No puedes retirar a un equipo con partidos. Cancélalos antes.'; return; }
        if (ty === 'league') { var dup = ids.filter(function (t) { return otherLeague(c, t); }); if (dup.length) { err.textContent = 'Estos equipos ya están en otra liga: ' + dup.map(function (t) { return MAGNA.teamName(t) + ' (' + otherLeague(c, t).name + ')'; }).join(', ') + '. Un equipo solo puede estar en una liga.'; return; } }
        c.teamIds = ids; MAGNA.save(); close(); done(); }, 'o')); b.appendChild(r);
    });
  }
  function rrRounds(n) { return n % 2 ? n : n - 1; }
  function chTxtN(n) { var sp = MAGNA.champSplit(n); if (!sp) return ''; var D = sp.direct, K = sp.playoff;
    return (D === 1 ? '1.º' : '1.º–' + D + '.º') + ' directo a ' + (D === 1 ? 'la final' : MAGNA.koName(D * 2).toLowerCase()) + ', ' + (D + 1) + '.º–' + (D + K) + '.º play-off' + (sp.out ? ', ' + (D + K + 1) + '.º en adelante eliminados' : ''); }
  function chTxt(c) { return chTxtN((c.groups ? c.groups[0].teamIds : c.teamIds).length); }
  function plan(f, n, g, q, legs) {
    if (n < $.TF[f].min) return { ok: false, t: 'Elige al menos ' + $.TF[f].min + ' equipos.' };
    if (f === 'champions') return { ok: true, t: '<b>' + n + ' equipos</b> en una sola tabla. <b>No se genera ningún partido:</b> tú creas cada jornada de la fase de liga y después cada cruce de la eliminatoria.' };
    if (f === 'groups_knockout') { if (n < g * 2) return { ok: false, t: 'Con ' + g + ' grupos necesitas al menos ' + g * 2 + ' equipos.' }; if (Math.floor(n / g) < q) return { ok: false, t: 'Con ' + n + ' equipos en ' + g + ' grupos no pueden clasificar ' + q + ' por grupo.' }; if (g * q < 2) return { ok: false, t: 'Con 1 grupo deben clasificar al menos 2.' };
      var lo = Math.floor(n / g), hi = Math.ceil(n / g), size = 1; while (size < g * q) size *= 2; return { ok: true, t: '<b>' + n + ' equipos</b> en ' + g + ' grupo' + (g > 1 ? 's' : '') + ' de ' + (lo === hi ? lo : lo + '–' + hi) + ' (sorteo automático). Pasan ' + q + ' por grupo → ' + MAGNA.koName(size).toLowerCase() + '.' }; }
    if (f === 'knockout' && legs === 2) { if (n & (n - 1)) return { ok: false, t: 'Con ida y vuelta el número de equipos tiene que ser 2, 4, 8 o 16 (llevas ' + n + ').' }; return { ok: true, t: '<b>' + n + ' equipos</b> · ' + (n / 2) + (n === 2 ? ' llave' : ' llaves') + ' de ' + MAGNA.koName(n).toLowerCase() + ' a <b>ida y vuelta</b> (tú eliges los cruces). Pasa quien meta más goles en el global; si queda igual, se juega un partido de desempate.' }; }
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
      var kl = h('select', 'in'); [[2, 'Ida y vuelta (2 partidos; desempate si el global queda igual)'], [1, 'Partido único']].forEach(function (x) { var o = h('option', null, x[1]); o.value = x[0]; kl.appendChild(o); });
      var lk = h('label', 'f', 'Cada llave se juega'); lk.appendChild(kl); b.appendChild(lk); kl.onchange = function () { upd(); };
      var lb = h('label', 'f', 'Cada partido se juega'); lb.appendChild(bo); b.appendChild(lb);
      var sec = h('div', 'tf-sec'), cnt = h('span'), sp = h('span', 'sp'); sec.appendChild(document.createTextNode('2 · Equipos ')); sec.appendChild(cnt); sec.appendChild(sp);
      var boxes = [], all = btn('Todos', function () { boxes.forEach(function (i) { i.checked = true; }); upd(); }), none = btn('Ninguno', function () { boxes.forEach(function (i) { i.checked = false; }); upd(); });
      sec.appendChild(all); sec.appendChild(none); b.appendChild(sec);
      var chk = h('div', 'chk'); S().teams.forEach(function (t) { var l = h('label'), i = h('input'); i.type = 'checkbox'; i.value = t.id; i.checked = true; i.onchange = upd; boxes.push(i); l.appendChild(i); l.appendChild(document.createTextNode(t.name)); chk.appendChild(l); });
      if (!S().teams.length) b.appendChild(h('p', 'sub', 'Primero registra equipos en la sección Equipos.')); b.appendChild(chk);
      var pl = h('div', 'tf-plan'); b.appendChild(pl);
      var more = h('details', 'tf-more'), sm = h('summary', null, 'Descripción y reglas (opcional)'); more.appendChild(sm);
      var de = h('textarea', 'in'); de.rows = 2; de.placeholder = 'Descripción'; var ru = h('textarea', 'in'); ru.rows = 3; ru.placeholder = 'Reglas'; more.appendChild(de); more.appendChild(ru); b.appendChild(more);
      var err = h('p', 'err'), cbtn = null; b.appendChild(err);
      Object.keys($.TF).forEach(function (k) { var x = $.TF[k], c = h('button', 'tf-card'); c.type = 'button'; c.dataset.f = k; c.appendChild(h('em', null, x.i)); c.appendChild(h('b', null, x.n)); c.appendChild(h('span', null, x.d)); c.onclick = function () { f = k; upd(); }; grid.appendChild(c); });
      function ids() { return boxes.filter(function (i) { return i.checked; }).map(function (i) { return Number(i.value); }); }
      function upd() { [].forEach.call(grid.children, function (c) { c.classList.toggle('on', c.dataset.f === f); }); gOpt.style.display = f === 'groups_knockout' ? '' : 'none'; ll.style.display = 'none'; lk.style.display = f === 'knockout' ? '' : 'none'; if (cbtn) cbtn.textContent = f === 'champions' ? 'Crear y empezar fase de liga' : 'Crear y generar calendario';
        var n = ids().length, p = plan(f, n, Number(gs.value), Number(qs.value), f === 'knockout' ? Number(kl.value) : Number(lgs.value)); cnt.textContent = '(' + n + ' de ' + S().teams.length + ')'; pl.innerHTML = p.t; pl.classList.toggle('bad', !p.ok); return p; }
      gs.onchange = upd; qs.onchange = upd; upd();
      function create(gen) {
        var n = okName(name.value, 2, 40); if (!n) { err.textContent = 'Escribe un nombre (2 a 40 caracteres).'; name.focus(); return; }
        var ed = edInfo(n); n = ed.name;
        var p = upd(); if (gen && !p.ok) { err.textContent = p.t.replace(/<[^>]+>/g, ''); return; }
        var c = { id: MAGNA.id(), name: n, description: (de.value || '').slice(0, 500), status: gen ? 'active' : 'draft', teamIds: ids(), format: f, best_of: Number(bo.value), legs: f === 'champions' ? Number(lgs.value) : f === 'knockout' ? Number(kl.value) : undefined, rules: (ru.value || '').slice(0, 2000), state: null };
        if (f === 'groups_knockout') c.gcfg = { n: Number(gs.value), q: Number(qs.value) };
        ed.number(); S().tournaments.push(c); MAGNA.addNews('tournament_created', ed.n > 1 ? 'Arranca ' + ed.name + ', la edición ' + MAGNA.toRoman(ed.n) + ' de ' + ed.base + '.' : 'Se crea el torneo: ' + n + '.');
        if (gen) { var e = generate(c); if (e) { c.status = 'draft'; err.textContent = e; MAGNA.save(); return; } MAGNA.addNews('tournament_bracket', 'Arranca ' + n + ': ya está el calendario.'); }
        close(); commit(gen ? 'Torneo creado y calendario generado' : 'Borrador guardado'); tourDlg(c.id);
      }
      var r = h('div', 'row'); r.appendChild(btn('Cancelar', close)); r.appendChild(btn('Guardar borrador', function () { create(false); })); r.appendChild(cbtn = btn(f === 'champions' ? 'Crear y empezar fase de liga' : 'Crear y generar calendario', function () { create(true); }, 'o')); b.appendChild(r);
      name.focus();
    });
  }
  function steps(c) { var f = c.format; if (manual(c)) return ['Equipos', 'Fase de liga', 'Eliminatoria', 'Campeón']; return f === 'champions' ? ['Equipos', 'Calendario', 'Fase de liga', 'Play-off', 'Eliminatoria', 'Campeón'] : f === 'groups_knockout' ? ['Equipos', 'Calendario', 'Fase de grupos', 'Eliminatoria', 'Campeón'] : f === 'knockout' ? ['Equipos', 'Calendario', 'Eliminatoria', 'Campeón'] : ['Equipos', 'Calendario', 'Liga', 'Campeón']; }
  function manual(c) { return c.format === 'champions' && (c.manual || !c.state); }
  function stepIx(c) { var st = c.state, s = steps(c); if (manual(c)) return !st ? 0 : st.phase === 'groups' ? 1 : st.phase === 'done' ? 3 : 2; if (!st) return c.teamIds.length < ($.TF[c.format] || $.TF.knockout).min ? 0 : 1; if (st.phase === 'done') return s.length - 1;
    if (st.phase === 'groups' || st.phase === 'league') return 2; if (st.phase === 'playoff') return 3; return s.length - 2; }
  function phaseLabel(c) { if (c.state && c.state.phase === 'done') return '🏆 ' + MAGNA.teamName(c.state.champion); if (c.state && c.state.round && c.state.phase !== 'groups') return c.state.round; return steps(c)[stepIx(c)]; }
  function phaseMatches(c) { var st = c.state, ms = S().matches.filter(function (m) { return m.type === 'tournament' && m.cid === c.id && m.status !== 'cancelled'; });
    if (st.phase === 'groups') return ms.filter(function (m) { return m.group; }); if (st.phase === 'league') return ms; if (st.phase === 'ko') return ms.filter(function (m) { return !m.group; }); return ms.filter(function (m) { return m.round === st.round || String(m.round || '').indexOf(st.round + ' · ') === 0; }); }
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
        if (manual(c) && c.status !== 'paused') { manualUI(c, box, nx, act, card, draw, done, close); return; }
        if (c.status === 'paused') { card('Torneo en pausa', 'Reanúdalo para seguir cargando resultados.'); act.appendChild(btn('Reanudar', function () { c.status = 'active'; done(null, 'Reanudado'); }, 'o')); }
        else if (!st) {
          var p = plan(c.format, c.teamIds.length, c.gcfg ? c.gcfg.n : 1, c.gcfg ? c.gcfg.q : 1, c.legs);
          if (sx === 0) { card('Paso 1: elige los equipos', 'Inscribe al menos ' + F.min + ' equipos para poder generar el calendario.'); act.appendChild(btn('Elegir equipos', function () { pickTeams(c, 'tournament', draw); }, 'o')); }
          else { card(c.status === 'finished' ? 'Este torneo se cerró sin calendario' : 'Paso 2: genera el calendario', (c.status === 'finished' ? 'Se marcó como finalizado antes de crear los partidos, por eso no aparece en la web. ' : '') + p.t.replace(/<[^>]+>/g, ''));
            if (c.format === 'champions') { var lsel = h('select', 'in'); lsel.style.cssText = 'margin:0;max-width:340px'; [[2, 'Fase de liga: ida y vuelta'], [1, 'Fase de liga: solo ida']].forEach(function (x) { var o = h('option', null, x[1]); o.value = x[0]; if ((c.legs || 2) === x[0]) o.selected = true; lsel.appendChild(o); }); lsel.onchange = function () { c.legs = Number(lsel.value); MAGNA.save(); draw(); }; act.appendChild(lsel); }
            var gb = btn(c.status === 'finished' ? 'Reabrir y generar calendario' : 'Generar calendario', regen, 'o'); gb.disabled = !p.ok; act.appendChild(gb); act.appendChild(btn('Cambiar equipos', function () { pickTeams(c, 'tournament', draw); })); }
        } else if (st.phase === 'knockout' && c.legs === 2 && !st.ties) { pickTies(c, nx, act, card, done);
        } else if (st.phase === 'done') {
          card('🏆 Campeón: ' + MAGNA.teamName(st.champion), c.status === 'finished' ? 'Torneo cerrado. El título ya cuenta en la vitrina del equipo.' : 'El título ya cuenta en la vitrina del equipo. Cierra el torneo cuando quieras archivarlo.');
          if (c.status !== 'finished') act.appendChild(btn('Cerrar torneo', function () { c.status = 'finished'; MAGNA.addNews('tournament_finished', 'Finaliza ' + c.name + '.'); done(null, 'Torneo cerrado'); }, 'o'));
        } else {
          var pm = phaseMatches(c), fin = pm.filter(function (m) { return m.status === 'finished'; }).length, left = pm.length - fin, ph = st.phase === 'groups' ? (c.format === 'champions' ? 'la fase de liga' : 'la fase de grupos') : st.phase === 'league' ? 'la liga' : st.round;
          if (left) { card('Juega ' + ph, 'Van ' + fin + ' de ' + pm.length + ' partidos con resultado. Cárgalos en Partidos (o desde la consola en vivo); cuando estén todos, aquí aparece el siguiente paso.', fin / (pm.length || 1));
            act.appendChild(btn('Cargar resultados', function () { $.MF = 'tournament:' + c.id; close(); go('partidos'); }, 'o')); }
          else {
            var nl = st.phase === 'groups' ? (c.format === 'champions' ? 'Pasar al play-off' : 'Pasar a la eliminatoria') : st.phase === 'league' ? 'Proclamar campeón' : st.phase === 'playoff' ? 'Pasar a ' + MAGNA.koName(st.direct.length * 2).toLowerCase() : (st.round === 'Final' ? 'Proclamar campeón' : 'Pasar a la siguiente ronda');
            card('✓ Resultados completos: ' + ph.replace(/^la /, ''), st.phase === 'groups' && c.format === 'champions' ? chTxt(c) + '.' : (c.legs === 2 && c.format === 'knockout' ? 'Ida y vuelta completas. Pasa quien tenga más goles en el global; si alguna llave queda igual, se crea su partido de desempate.' : 'Todos los partidos tienen resultado. Los cruces siguientes se arman solos.'), 1);
            act.appendChild(btn(nl, function () { var r = st.phase === 'groups' ? toKnockout(c) : st.phase === 'league' ? proclaim(c) : advance(c); if (r && r.info) done(null, r.info); else done(r); }, 'o'));
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
  // ---------- Champions a mano: jornadas y cruces creados por la administración ----------
  var KO_ROUNDS = ['Play-off', 'Dieciseisavos de final', 'Octavos de final', 'Cuartos de final', 'Semifinales', 'Tercer puesto', 'Final'];
  function mms(c) { return S().matches.filter(function (m) { return m.type === 'tournament' && m.cid === c.id && m.status !== 'cancelled'; }); }
  function jNo(m) { var x = /Jornada (\d+)/.exec(m.round || ''); return x ? Number(x[1]) : 0; }
  function manualUI(c, box, nx, act, card, draw, done, close) {
    var st = c.state, all = mms(c), lg = all.filter(function (m) { return m.group; }), ko = all.filter(function (m) { return !m.group; });
    function prog(l) { var f = l.filter(function (m) { return m.status === 'finished'; }).length; return [f, l.length]; }
    if (!st) {
      if (c.teamIds.length < 3) { card('Paso 1: elige los equipos', 'Inscribe al menos 3 equipos para empezar la fase de liga.'); act.appendChild(btn('Elegir equipos', function () { pickTeams(c, 'tournament', draw); }, 'o')); }
      else { card('Paso 2: arma los grupos', c.teamIds.length + ' equipos. Elige cuántos grupos quieres (o una sola tabla) y en qué grupo va cada equipo. No se genera ningún partido: después creas tú cada jornada.');
        act.appendChild(btn('Armar grupos y empezar', function () { groupsDlg(c, function () { c.status = 'active'; var e = generate(c); if (!e) MAGNA.addNews('tournament_bracket', 'Arranca la fase de grupos de ' + c.name + '.'); done(e, 'Fase de grupos abierta'); }); }, 'o'));
        act.appendChild(btn('Cambiar equipos', function () { pickTeams(c, 'tournament', draw); })); }
    } else if (st.phase === 'groups') {
      var pg = prog(lg), nj = lg.reduce(function (a, m) { return Math.max(a, jNo(m)); }, 0);
      card((c.groups && c.groups.length > 1 ? 'Fase de grupos' : 'Fase de liga') + ' · tú armas las jornadas', lg.length ? 'Hay ' + nj + (nj === 1 ? ' jornada' : ' jornadas') + ' con ' + lg.length + ' partidos (' + pg[0] + ' con resultado). Añade más partidos o, cuando quieras, termina la fase de ' + (c.groups && c.groups.length > 1 ? 'grupos' : 'liga') + '.' : 'Todavía no hay partidos. Crea la jornada 1 con el botón «＋ Añadir partido».', lg.length ? pg[0] / pg[1] : 0);
      act.appendChild(btn('＋ Añadir partido', function () { addDlg(c, false, draw); }, 'o')); act.appendChild(btn('👥 Editar grupos', function () { groupsDlg(c, function () { MAGNA.save(); draw(); render(); }); }));
      if (pg[0] < pg[1]) act.appendChild(btn('Cargar resultados', function () { $.MF = 'tournament:' + c.id; close(); go('partidos'); }));
      var tb = btn(c.groups && c.groups.length > 1 ? 'Terminar fase de grupos →' : 'Terminar fase de liga →', function () {
        if (!lg.length) return toast('Primero crea y juega al menos un partido.', true);
        if (pg[0] < pg[1]) return toast('Aún hay partidos de la fase de liga sin resultado. Cárgalos o bórralos.', true);
        confirmBox('¿Terminar la fase de ' + (c.groups && c.groups.length > 1 ? 'grupos' : 'liga') + '?', 'Las tablas quedan cerradas y pasas a la eliminatoria, donde tú eliges cada cruce.', 'Terminar', function () { c.state = { phase: 'ko' }; MAGNA.addNews('tournament_bracket', c.name + ': termina la fase de liga y comienza la eliminatoria.'); done(null, 'Fase de liga terminada'); }); });
      act.appendChild(tb);
    } else if (st.phase === 'ko') {
      var pk = prog(ko), last = ko.filter(function (m) { return m.round === 'Final' && m.status === 'finished'; }).pop();
      card('Eliminatoria · tú eliges los cruces', ko.length ? ko.length + ' cruces creados (' + pk[0] + ' con resultado). Añade la siguiente ronda cuando quieras y, al final, proclama al campeón.' : 'Crea los cruces de la primera ronda (por ejemplo, el play-off o los cuartos) con «＋ Añadir cruce».', ko.length ? pk[0] / pk[1] : 0);
      act.appendChild(btn('＋ Añadir cruce', function () { addDlg(c, true, draw); }, 'o'));
      if (pk[0] < pk[1]) act.appendChild(btn('Cargar resultados', function () { $.MF = 'tournament:' + c.id; close(); go('partidos'); }));
      act.appendChild(btn('🏆 Proclamar campeón', function () {
        var def = last ? (last.hs > last.as ? last.home : last.away) : c.teamIds[0];
        ask('Proclamar campeón de ' + c.name, [{ k: 't', label: 'Campeón', type: 'select', value: def, options: c.teamIds.map(function (id) { return [id, MAGNA.teamName(id)]; }) }], function (v) {
          var t = Number(v.t); c.state = { phase: 'done', champion: t }; MAGNA.addNews('tournament_bracket', MAGNA.teamName(t) + ' es campeón de ' + c.name + '.'); MAGNA.save(); draw(); render(); }, 'Proclamar', last ? 'Por defecto, el ganador de la final.' : 'Elige el equipo campeón.'); }));
      act.appendChild(btn(c.groups && c.groups.length > 1 ? '← Volver a la fase de grupos' : '← Volver a la fase de liga', function () { confirmBox('¿Volver a la fase de liga?', 'Los cruces creados se mantienen; solo reabres la fase de liga para añadir o corregir jornadas.', 'Volver', function () { c.state = { phase: 'groups' }; done(null, 'Fase de liga reabierta'); }); }));
    } else if (st.phase === 'done') {
      card('🏆 Campeón: ' + MAGNA.teamName(st.champion), c.status === 'finished' ? 'Torneo cerrado. El título ya cuenta en la vitrina del equipo.' : 'El título ya cuenta en la vitrina del equipo. Cierra el torneo cuando quieras archivarlo.');
      if (c.status !== 'finished') act.appendChild(btn('Cerrar torneo', function () { c.status = 'finished'; MAGNA.addNews('tournament_finished', 'Finaliza ' + c.name + '.'); done(null, 'Torneo cerrado'); }, 'o'));
      act.appendChild(btn('Cambiar campeón', function () { c.state = { phase: 'ko' }; done(null, 'Vuelve a la eliminatoria'); }));
    }
    if (st && c.groups) c.groups.forEach(function (g) { box.appendChild(h('h2', 'x', c.groups.length > 1 ? 'Grupo ' + g.name : 'Tabla de la fase de liga')); box.appendChild(table(['#', 'Equipo', 'PJ', 'G', 'P', 'DG', 'Pts'], MAGNA.groupTable(c, g).map(function (r) { return [r.pos, r.team, r.pj, r.g, r.p, r.dg, r.pts]; }))); });
    // lista de partidos por jornada / ronda, con borrar los que aún no se jugaron
    function list(title, ms, key) {
      if (!ms.length) return; box.appendChild(h('h2', 'x', title)); var groups = {}, order = [];
      ms.slice().sort(function (a, b) { return key(a) - key(b) || String(a.at || '').localeCompare(String(b.at || '')); }).forEach(function (m) { var k = m.round || '—'; if (!groups[k]) { groups[k] = []; order.push(k); } groups[k].push(m); });
      order.forEach(function (k) { var wrap = h('div', 'mj'); wrap.style.cssText = 'margin:0 0 12px;padding:10px 12px;border:1px solid rgba(255,255,255,.12);border-radius:12px';
        wrap.appendChild(h('b', null, k.replace(/^Liga · /, ''))); groups[k].forEach(function (m) { var r = h('div'); r.style.cssText = 'display:flex;align-items:center;gap:10px;padding:6px 0;border-top:1px solid rgba(255,255,255,.06);font-size:14px';
          var tx = h('span', null, MAGNA.teamName(m.home) + ' vs ' + MAGNA.teamName(m.away)); tx.style.flex = '1'; r.appendChild(tx);
          r.appendChild(h('small', null, m.status === 'finished' ? m.hs + ' - ' + m.as : m.status === 'live' ? 'En vivo' : (A.fdate && m.at ? A.fdate(m.at) : 'Sin fecha')));
          if (m.status === 'scheduled') { var x = btn('✕', function () { confirmBox('¿Borrar este partido?', MAGNA.teamName(m.home) + ' vs ' + MAGNA.teamName(m.away) + ' (' + k + '). Aún no se ha jugado.', 'Borrar', function () { S().matches = S().matches.filter(function (z) { return z.id !== m.id; }); done(null, 'Partido borrado'); }); }, 'd'); x.title = 'Borrar partido'; x.style.cssText = 'padding:4px 10px;min-height:0'; r.appendChild(x); }
          wrap.appendChild(r); }); box.appendChild(wrap); }); }
    if (st && window.PRED) { var pdb = h('div', 'bar2'); pdb.appendChild(btn('🔮 Predicciones · premios', function () { predDlg(c); })); if (PRED.hasLeague(c) && (!c.state || !c.state.phase || c.state.phase === 'groups' || c.state.phase === 'league')) pdb.appendChild(btn(c.zpClosed ? '🔓 Reabrir predicción de clasificados' : '🔒 Cerrar predicción de clasificados', function () { c.zpClosed = !c.zpClosed; commit(c.zpClosed ? 'Predicción de clasificados cerrada: ya nadie puede cambiarla' : 'Predicción de clasificados abierta otra vez'); }, c.zpClosed ? 'o' : '')); var pl2 = h('a', 'lk', 'Ver página de predicciones ↗'); pl2.href = 'prediccion.html?t=' + c.id; pl2.target = '_blank'; pl2.rel = 'noopener'; pdb.appendChild(pl2); box.appendChild(pdb); }
    list('Jornadas de la fase de grupos', lg, function (m) { return jNo(m) * 100 + String(m.group || '').charCodeAt(0); }); list('Eliminatoria', ko, function (m) { var i = KO_ROUNDS.indexOf(m.round); return i < 0 ? 99 : i; });
    var mo = h('details', 'tf-more'); mo.appendChild(h('summary', null, 'Más opciones')); var ma = h('div', 'bar2'); mo.appendChild(ma); box.appendChild(mo);
    if (c.status !== 'finished') ma.appendChild(btn('Elegir equipos', function () { pickTeams(c, 'tournament', function () { syncGroups(c); MAGNA.save(); draw(); }); }));
    if (c.status === 'active') ma.appendChild(btn('Pausar', function () { c.status = 'paused'; done(null, 'En pausa'); }));
    if (c.status === 'finished') ma.appendChild(btn('Reabrir', function () { c.status = 'active'; done(null, 'Reabierto'); }));
    if (st) ma.appendChild(btn('Borrar todos los partidos', function () { var pl = all.filter(function (m) { return m.status === 'finished'; }).length; confirmBox('¿Empezar de cero ' + c.name + '?', 'Se borran todos sus partidos' + (pl ? ' (incluidos ' + pl + ' con resultado)' : '') + ' y vuelve al paso «Empezar fase de liga».', 'Borrar todo', function () { S().matches = S().matches.filter(function (m) { return !(m.type === 'tournament' && m.cid === c.id); }); c.state = null; c.groups = null; done(null, 'Partidos borrados'); }); }, 'd'));
    ma.appendChild(btn('Eliminar torneo', function () { confirmBox('¿Eliminar ' + c.name + '?', 'Se borra con todos sus partidos. No se puede deshacer.', 'Eliminar', function () { S().matches = S().matches.filter(function (m) { return !(m.type === 'tournament' && m.cid === c.id); }); S().tournaments = S().tournaments.filter(function (x) { return x.id !== c.id; }); close(); commit('Torneo eliminado'); }); }, 'd'));
  }
  var GN = 'ABCDEFGH';
  function syncGroups(c) { if (!c.groups) return; c.groups.forEach(function (g) { g.teamIds = g.teamIds.filter(function (id) { return c.teamIds.indexOf(id) >= 0; }); });
    c.teamIds.forEach(function (id) { if (c.groups.some(function (g) { return g.teamIds.indexOf(id) >= 0; })) return; c.groups.slice().sort(function (a, b) { return a.teamIds.length - b.teamIds.length; })[0].teamIds.push(id); }); }
  function groupsDlg(c, onSave) {
    dialog('Grupos de ' + c.name, function (b, close) {
      var cur = {}, n = c.groups && c.groups.length ? c.groups.length : 1; (c.groups || []).forEach(function (g, i) { g.teamIds.forEach(function (id) { cur[id] = i; }); });
      var played = {}; mms(c).forEach(function (m) { if (m.group) { played[m.home] = 1; played[m.away] = 1; } });
      b.appendChild(h('p', 'sub', 'Elige cuántos grupos quieres y en cuál juega cada equipo. Con 1 grupo es una sola tabla para todos. La gente verá los grupos en la página de Champions.'));
      var ns = h('select', 'in'); for (var k = 1; k <= 8; k++) { var o = h('option', null, k === 1 ? '1 · una sola tabla' : k + ' grupos (A–' + GN[k - 1] + ')'); o.value = k; if (k === n) o.selected = true; ns.appendChild(o); }
      var ln = h('label', 'f', 'Número de grupos'); ln.appendChild(ns); b.appendChild(ln);
      // zonas de la tabla (solo para pintarla, como en la Champions: directo · play-off · eliminados)
      var z0 = c.zones || {}, zd = h('input', 'in'), zp = h('input', 'in'); [zd, zp].forEach(function (x) { x.type = 'number'; x.min = 0; x.max = 36; });
      var zw = h('div', 'tf-two'), l1 = h('label', 'f', 'Pasan directo (por grupo)'), l2 = h('label', 'f', 'Van al play-off (por grupo)'); l1.appendChild(zd); l2.appendChild(zp); zw.appendChild(l1); zw.appendChild(l2); b.appendChild(zw);
      b.appendChild(h('p', 'hint', 'Solo colorea la tabla pública (azul = directo, celeste = play-off, blanco = eliminado). Los cruces los sigues armando tú.'));
      function zdef() { var per = Math.max(2, Math.ceil(c.teamIds.length / n)); if (n === 1) { var sp = MAGNA.champSplit(c.teamIds.length) || { direct: 1, playoff: 0 }; return [sp.direct, sp.playoff]; } return [Math.min(2, per), 0]; }
      function zset(force) { var d = zdef(); if (force || z0.d == null) zd.value = d[0]; else zd.value = z0.d; if (force || z0.p == null) zp.value = d[1]; else zp.value = z0.p; }
      zset(false);
      var bar = h('div', 'bar2'); bar.appendChild(btn('🎲 Repartir al azar', function () { var ids = c.teamIds.slice(); for (var i = ids.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = ids[i]; ids[i] = ids[j]; ids[j] = t; } ids.forEach(function (id, i) { if (!played[id]) cur[id] = i % n; }); paint(); })); b.appendChild(bar);
      var grid = h('div'); grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;margin:10px 0'; b.appendChild(grid);
      var cnt = h('p', 'sub'); b.appendChild(cnt); var err = h('p', 'err'); b.appendChild(err);
      function paint() { grid.innerHTML = ''; c.teamIds.forEach(function (id, i) { if (cur[id] == null || cur[id] >= n) cur[id] = i % n;
          var row = h('label', 'f'); row.style.cssText = 'display:flex;align-items:center;gap:8px;margin:0;padding:6px 10px;border:1px solid rgba(255,255,255,.12);border-radius:10px';
          var nm = h('span', null, MAGNA.teamName(id)); nm.style.flex = '1'; row.appendChild(nm);
          var se = h('select', 'in'); se.style.cssText = 'width:auto;margin:0;padding:6px 8px'; for (var k = 0; k < n; k++) { var o = h('option', null, n === 1 ? 'Tabla' : 'Grupo ' + GN[k]); o.value = k; if (k === cur[id]) o.selected = true; se.appendChild(o); }
          se.disabled = !!played[id] && n === (c.groups || []).length; if (se.disabled) se.title = 'Ya jugó partidos en su grupo'; se.onchange = function () { cur[id] = Number(se.value); count(); }; row.appendChild(se); grid.appendChild(row); }); count(); }
      function count() { var c2 = []; for (var k = 0; k < n; k++) c2.push(0); c.teamIds.forEach(function (id) { c2[cur[id]]++; }); cnt.textContent = n === 1 ? c.teamIds.length + ' equipos en una sola tabla.' : c2.map(function (x, k) { return 'Grupo ' + GN[k] + ': ' + x; }).join(' · '); }
      ns.onchange = function () { var old = n; n = Number(ns.value); if (Object.keys(played).length && old !== n) { err.textContent = 'Ya hay partidos de grupo jugados: si cambias el número de grupos, esos partidos dejan de contar en las tablas. Bórralos o vuelve al número anterior.'; } else err.textContent = ''; if (old !== n) { c.teamIds.forEach(function (id, i) { if (!played[id]) cur[id] = i % n; }); zset(true); } paint(); };
      paint();
      var r = h('div', 'row'); r.appendChild(btn('Cancelar', close)); r.appendChild(btn('Guardar grupos', function () {
        var gs = []; for (var k = 0; k < n; k++) gs.push({ name: n === 1 ? 'Liga' : GN[k], teamIds: [] }); c.teamIds.forEach(function (id) { gs[cur[id]].teamIds.push(id); });
        if (gs.some(function (g) { return g.teamIds.length < 2; })) { err.textContent = 'Cada grupo necesita al menos 2 equipos.'; return; }
        if (Object.keys(played).length && c.groups && gs.length !== c.groups.length) { err.textContent = 'Ya hay partidos de grupo: no puedes cambiar el número de grupos. Bórralos primero.'; return; }
        var dz = Math.max(0, Math.round(Number(zd.value) || 0)), pz = Math.max(0, Math.round(Number(zp.value) || 0)); c.zones = { d: dz, p: pz };
        c.groups = gs; close(); onSave(); }, 'o')); b.appendChild(r);
    });
  }
  function addDlg(c, isKo, draw) {
    var G = c.groups || [{ name: 'Liga', teamIds: c.teamIds }], multi = !isKo && G.length > 1, gOf = function (id) { return (G.filter(function (g) { return g.teamIds.indexOf(id) >= 0; })[0] || {}).name; };
    var ids = isKo ? c.teamIds.slice() : G.reduce(function (a, g) { return a.concat(g.teamIds); }, []), opts = ids.map(function (id) { return [id, MAGNA.teamName(id) + (multi ? ' · Grupo ' + gOf(id) : '')]; });
    var lg = mms(c).filter(function (m) { return m.group; }), nj = lg.reduce(function (a, m) { return Math.max(a, jNo(m)); }, 0) || 1;
    var ko = mms(c).filter(function (m) { return !m.group; }), lastR = ko.length ? ko[ko.length - 1].round : 'Play-off';
    var tz = (window.MAGNA_TZ && MAGNA_TZ.label) || 'tu zona', f = [];
    if (isKo) f.push({ k: 'r', label: 'Ronda', type: 'select', value: KO_ROUNDS.indexOf(lastR) >= 0 ? lastR : 'Play-off', options: KO_ROUNDS.map(function (r) { return [r, r]; }) });
    else f.push({ k: 'j', label: 'Jornada', type: 'number', value: nj, min: 1, max: 99 });
    f.push({ k: 'h', label: 'Local', type: 'select', value: ids[0], options: opts }, { k: 'a', label: 'Visitante', type: 'select', value: ids[1], options: opts }, { k: 't', label: 'Fecha y hora (opcional, hora de ' + tz + ')', type: 'datetime-local', value: '' }, { k: 'more', label: 'Seguir añadiendo después de guardar', type: 'checkbox' });
    ask(isKo ? 'Nuevo cruce · ' + c.name : 'Nuevo partido · ' + c.name, f, function (v) {
      var hm = Number(v.h), aw = Number(v.a); if (hm === aw) return 'Elige dos equipos distintos.';
      var gn = isKo ? null : gOf(hm); if (!isKo && gn !== gOf(aw)) return 'Los dos equipos deben ser del mismo grupo.'; if (!isKo && !gn) return 'Ese equipo no está en ningún grupo. Revisa «Editar grupos».';
      var jn = Math.max(1, Math.min(99, Math.round(Number(v.j) || 1))), round = isKo ? v.r : (multi ? 'Grupo ' + gn + ' · Jornada ' + jn : 'Liga · Jornada ' + jn);
      if (mms(c).some(function (m) { return m.round === round && [m.home, m.away].some(function (x) { return x === hm || x === aw; }); })) return 'Uno de esos equipos ya juega en ' + round.replace(/^Liga · /, '') + '.';
      var at = A.toUtc ? A.toUtc(v.t) : null; if (at === undefined) return 'Fecha no válida.';
      var m = { id: MAGNA.id(), type: 'tournament', cid: c.id, round: round, home: hm, away: aw, at: at || null, status: 'scheduled', hs: null, as: null }; if (!isKo) m.group = gn;
      S().matches.push(m); MAGNA.save(); draw(); render(); toast((isKo ? 'Cruce' : 'Partido') + ' añadido: ' + MAGNA.teamName(hm) + ' vs ' + MAGNA.teamName(aw));
      if (v.more) setTimeout(function () { addDlg(c, isKo, draw); }, 50); }, 'Añadir', isKo ? 'Elige la ronda y los dos equipos del cruce.' : 'Elige la jornada y los dos equipos' + (multi ? ' (del mismo grupo)' : '') + '. Puedes poner la fecha ahora o después en Partidos.');
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
      // Champions a mano: no se crea ningún partido. La administración arma cada jornada y luego los cruces.
      if (c.teamIds.length < 3) return 'El formato Champions necesita al menos 3 equipos.';
      if (!c.groups || !c.groups.length) c.groups = [{ name: 'Liga', teamIds: c.teamIds.slice() }]; c.manual = true; c.state = { phase: 'groups' };
    }
    else if (c.legs === 2) { var nt = c.teamIds.length; if (nt & (nt - 1)) return 'Con ida y vuelta necesitas 2, 4, 8 o 16 equipos.'; c.state = { phase: 'knockout', round: rname(nt), byes: [], ties: null }; }
    else koRound(c, c.teamIds.slice()); return null;
  }
  // ---------- eliminatoria a ida y vuelta ----------
  // cada llave: ida (local el 1.º) y vuelta (local el 2.º). Los ganadores de las llaves 1 y 2 se cruzan en la ronda siguiente, y así.
  function addLeg(c, round, a, b, tie, leg) { addM(c, round, a, b); var m = S().matches[S().matches.length - 1]; m.tie = tie; m.leg = leg; }
  function legs2(c, rn, pairs) { c.state = { phase: 'knockout', round: rn, byes: [], ties: pairs }; pairs.forEach(function (p, i) { addLeg(c, rn + ' · Ida', p[0], p[1], i, 1); addLeg(c, rn + ' · Vuelta', p[1], p[0], i, 2); }); }
  function advance2(c) {
    var st = c.state; if (!st.ties) return 'Primero arma las llaves de ' + st.round.toLowerCase() + '.';
    if (phaseMatches(c).some(function (m) { return m.status !== 'finished'; })) return 'Aún hay partidos de esta ronda sin terminar.';
    var R = (MAGNA.koTies(c) || []).filter(function (r) { return r.round === st.round; })[0]; if (!R) return 'No encuentro las llaves de esta ronda.';
    var win = [], extra = [];
    R.ties.forEach(function (t, i) { if (!t.ida || !t.vta) return win.push(undefined); if (t.win != null) return win.push(t.win);
      if (!t.des) { addLeg(c, st.round + ' · Desempate', t.a, t.b, i, 3); extra.push(MAGNA.teamName(t.a) + ' vs ' + MAGNA.teamName(t.b) + ' (' + t.ga + '-' + t.gb + ')'); } win.push(null); });
    if (win.some(function (w) { return w === undefined; })) return 'Falta la ida o la vuelta de alguna llave (¿se canceló?). Prográmala de nuevo desde Reiniciar o pide ayuda.';
    if (extra.length) { MAGNA.addNews('tournament_bracket', c.name + ': global empatado en ' + extra.join(', ') + '. Se juega partido de desempate.'); return { info: '⚖ Global empatado: se ' + (extra.length === 1 ? 'creó 1 partido' : 'crearon ' + extra.length + ' partidos') + ' de desempate. Ponle fecha en Partidos.' }; }
    if (win.some(function (w) { return w == null; })) return 'Un partido de desempate quedó empatado: corrige el resultado (alguien tiene que ganar).';
    if (win.length === 1) { c.state = { phase: 'done', champion: win[0] }; MAGNA.addNews('tournament_bracket', MAGNA.teamName(win[0]) + ' es campeón de ' + c.name + '.'); return null; }
    var pairs = []; for (var i = 0; i < win.length; i += 2) pairs.push([win[i], win[i + 1]]);
    var rn = rname(win.length); legs2(c, rn, pairs); MAGNA.addNews('tournament_bracket', c.name + ': comienzan ' + rn.toLowerCase() + ' · ' + pairs.map(function (p) { return MAGNA.teamName(p[0]) + ' vs ' + MAGNA.teamName(p[1]); }).join(' · ') + '.'); return null;
  }
  // la administración elige los cruces de la primera ronda (o los sortea)
  function pickTies(c, nx, act, card, done) {
    var st = c.state, k = c.teamIds.length / 2, sels = [];
    card('Paso 3: arma las llaves de ' + st.round.toLowerCase(), 'Elige quién juega contra quién. El de la izquierda es local en la ida y el de la derecha en la vuelta. Los ganadores de las llaves 1 y 2 se cruzan en la siguiente ronda; los de la 3 y 4, también, y así.');
    var gw = h('div'); gw.style.cssText = 'display:grid;gap:8px;margin:4px 0 10px';
    for (var i = 0; i < k; i++) { var r = h('div'); r.style.cssText = 'display:grid;grid-template-columns:auto minmax(0,1fr) auto minmax(0,1fr);gap:8px;align-items:center'; r.appendChild(h('b', null, 'Llave ' + (i + 1)));
      [0, 1].forEach(function (j) { var se = h('select', 'in'); se.style.margin = '0'; var o0 = h('option', null, '— elegir —'); o0.value = ''; se.appendChild(o0);
        c.teamIds.forEach(function (t) { var o = h('option', null, MAGNA.teamName(t)); o.value = t; se.appendChild(o); }); se.onchange = mark; sels.push(se); r.appendChild(se); if (!j) r.appendChild(h('span', null, 'vs')); });
      gw.appendChild(r); }
    var er = h('p', 'err'); gw.appendChild(er); nx.insertBefore(gw, act);
    function mark() { var cnt = {}; sels.forEach(function (x) { if (x.value) cnt[x.value] = (cnt[x.value] || 0) + 1; }); sels.forEach(function (x) { x.style.borderColor = x.value && cnt[x.value] > 1 ? 'var(--red,#ff4d6d)' : ''; }); er.textContent = Object.keys(cnt).some(function (t) { return cnt[t] > 1; }) ? 'Hay un equipo repetido.' : ''; }
    act.appendChild(btn('🎲 Sorteo al azar', function () { var ids = c.teamIds.slice(); for (var i = ids.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = ids[i]; ids[i] = ids[j]; ids[j] = t; } sels.forEach(function (x, i) { x.value = ids[i]; }); mark(); }));
    act.appendChild(btn('Crear llaves (ida y vuelta)', function () { var v = sels.map(function (x) { return Number(x.value) || null; });
      if (v.some(function (x) { return x == null; })) return er.textContent = 'Completa todas las llaves.'; if (new Set(v).size !== v.length) return er.textContent = 'Hay un equipo repetido.';
      var pairs = []; for (var i = 0; i < v.length; i += 2) pairs.push([v[i], v[i + 1]]); legs2(c, st.round, pairs);
      MAGNA.addNews('tournament_bracket', 'Arranca ' + c.name + ': ' + st.round.toLowerCase() + ' a ida y vuelta · ' + pairs.map(function (p) { return MAGNA.teamName(p[0]) + ' vs ' + MAGNA.teamName(p[1]); }).join(' · ') + '.');
      done(null, 'Llaves creadas: ' + pairs.length * 2 + ' partidos. Ponles fecha en Partidos.'); }, 'o'));
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
    if (c.legs === 2) return advance2(c);
    var ms = S().matches.filter(function (m) { return m.type === 'tournament' && m.cid === c.id && m.round === st.round && m.status !== 'cancelled'; });
    if (ms.some(function (m) { return m.status !== 'finished'; })) return 'Aún hay partidos de esta ronda sin terminar.';
    var alive = st.byes.concat(ms.map(function (m) { return m.hs > m.as ? m.home : m.away; }));
    if (alive.length === 1) { c.state = { phase: 'done', champion: alive[0] }; MAGNA.addNews('tournament_bracket', MAGNA.teamName(alive[0]) + ' es campeón de ' + c.name + '.'); return null; }
    koRound(c, alive); MAGNA.addNews('tournament_bracket', c.name + ': comienza ' + c.state.round + '.'); return null;
  }
  return { compV: compV };
});
