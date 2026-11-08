'use strict';
// Panel de administración · módulo «balon»: se descarga solo al abrir su sección (lo carga admin.js).
ADMIN_MOD('balon', function (A) {
  var $ = A.$, S = A.S, btn = A.btn, by = A.by, commit = A.commit, confirmBox = A.confirmBox, dialog = A.dialog, fdate = A.fdate, h = A.h, nk = A.nk, table = A.table, toUtc = A.toUtc;
  function pidByName(n) { n = nk(String(n || '')); if (!n) return null; var p = S().players.filter(function (x) { return nk(x.name) === n; })[0]; return p ? p.id : null; }
  function tidByName(n) { n = nk(String(n || '')); if (!n) return null; var t = S().teams.filter(function (x) { return nk(x.name) === n; })[0]; return t ? t.id : null; }
  function balNextEd() { var mx = 0; (S().ballon || []).forEach(function (b) { var r = MAGNA.romanNo(b.ed); if (r > mx) mx = r; }); return MAGNA.toRoman(mx + 1); }
  function balPerson(b, k, v) { var id = pidByName(v); b[k] = id; b[k + 'Name'] = id ? null : (String(v || '').trim().slice(0, 40) || null); }
  function balDl(list, id) { var d = document.createElement('datalist'); d.id = id; list.forEach(function (x) { var o = document.createElement('option'); o.value = x; d.appendChild(o); }); return d; }
  function balEdit(b0) {
    var isNew = !b0, b = b0 || { id: MAGNA.id(), ed: balNextEd(), source: 'manual' };
    dialog(isNew ? 'Registrar edición del Balón de Oro' : 'Editar edición ' + b.ed, function (bx, close) {
      bx.appendChild(balDl(S().players.map(function (p) { return p.name; }), 'bo-pl')); bx.appendChild(balDl(S().teams.map(function (t) { return t.name; }), 'bo-tm'));
      function fld(label, val, list, ph) { var l = h('label', 'f', label), i = h('input', 'in'); i.value = val || ''; if (list) i.setAttribute('list', list); if (ph) i.placeholder = ph; l.appendChild(i); bx.appendChild(l); return i; }
      var two = h('div', 'two2'); bx.appendChild(two);
      var ed = fld('Edición (en romano)', b.ed, null, 'IV'), se = fld('Temporada (opcional)', b.season, null, '2025'); two.appendChild(ed.parentNode); two.appendChild(se.parentNode);
      var w = fld('Ganador', MAGNA.ballonWho(b, 'winner'), 'bo-pl', 'Nombre del jugador'), tm = fld('Equipo con el que lo ganó (opcional)', b.team != null ? MAGNA.teamName(b.team) : b.teamName, 'bo-tm', 'Equipo');
      var two2 = h('div', 'two2'); bx.appendChild(two2); var s2 = fld('2.º lugar (opcional)', MAGNA.ballonWho(b, 'second'), 'bo-pl'), s3 = fld('3.º lugar (opcional)', MAGNA.ballonWho(b, 'third'), 'bo-pl'); two2.appendChild(s2.parentNode); two2.appendChild(s3.parentNode);
      bx.appendChild(h('p', 'hint', 'Si el nombre coincide con un jugador registrado, se enlaza a su ficha (cuenta en su perfil y en su carta). Si no, se guarda tal cual.'));
      var err = h('p', 'err'); bx.appendChild(err);
      w.addEventListener('change', function () { var id = pidByName(w.value), p = id && MAGNA.by(S().players, id); if (p && p.teamId && !tm.value) tm.value = MAGNA.teamName(p.teamId); });
      var r = h('div', 'row'); r.appendChild(btn('Cancelar', close)); r.appendChild(btn(isNew ? 'Registrar' : 'Guardar', function () {
        var e = String(ed.value || '').trim().toUpperCase(); if (!MAGNA.romanNo(e)) { err.textContent = 'Escribe la edición en números romanos (I, II, III…) o en número.'; return; } if (/^\d+$/.test(e)) e = MAGNA.toRoman(Number(e));
        if (!String(w.value || '').trim()) { err.textContent = 'Escribe el ganador.'; return; }
        if ((S().ballon || []).some(function (x) { return x !== b0 && x.ed === e; })) { err.textContent = 'Ya existe la edición ' + e + '.'; return; }
        b.ed = e; b.season = String(se.value || '').trim().slice(0, 20) || null; balPerson(b, 'winner', w.value); balPerson(b, 'second', s2.value); balPerson(b, 'third', s3.value); var tid = tidByName(tm.value); b.team = tid; b.teamName = tid ? null : (String(tm.value || '').trim().slice(0, 40) || null);
        if (isNew) { S().ballon = (S().ballon || []).concat([b]); MAGNA.addNews('trophy', MAGNA.ballonWho(b, 'winner') + ' entra al palmarés del Balón de Oro (edición ' + e + ').'); }
        close(); commit(isNew ? 'Edición registrada' : 'Edición actualizada'); }, 'o')); bx.appendChild(r); ed.focus();
    });
  }
  function balImport() {
    dialog('Importar ediciones del Balón de Oro', function (bx, close) {
      bx.appendChild(h('p', 'sub', 'Una edición por línea: Edición; Ganador; Equipo; 2.º; 3.º; Temporada. Solo la edición y el ganador son obligatorios. Puedes pegar desde Excel (columnas separadas por tabulación).'));
      var ta = h('textarea', 'in'); ta.rows = 8; ta.placeholder = 'I; Juan; Galaxy\nII; Leo; Realty; Nico; Sam\nIII; Mia; Vendetta'; bx.appendChild(ta);
      var pv = h('p', 'hint'), err = h('p', 'err'); bx.appendChild(pv); bx.appendChild(err);
      function parse() { var out = [], bad = 0; String(ta.value || '').split(/\r?\n/).forEach(function (ln) { if (!ln.trim()) return; var c = ln.split(/\t|;|\|/).map(function (x) { return x.trim(); }); if (c.length < 2 && ln.indexOf(',') > 0) c = ln.split(',').map(function (x) { return x.trim(); });
          var e = String(c[0] || '').toUpperCase().replace(/^EDICI[OÓ]N\s*/, ''); if (/^\d+$/.test(e)) e = MAGNA.toRoman(Number(e)); if (!MAGNA.romanNo(e) || !c[1]) { bad++; return; } out.push({ ed: e, w: c[1], t: c[2], s2: c[3], s3: c[4], se: c[5] }); }); return { rows: out, bad: bad }; }
      ta.oninput = function () { var p = parse(); pv.textContent = p.rows.length ? p.rows.length + ' ediciones listas' + (p.bad ? ' · ' + p.bad + ' líneas no se entendieron' : '') + '. Las que ya existan se actualizan.' : ''; };
      var r = h('div', 'row'); r.appendChild(btn('Cancelar', close)); r.appendChild(btn('Importar', function () { var p = parse(); if (!p.rows.length) { err.textContent = 'No hay líneas válidas.'; return; }
        S().ballon = S().ballon || []; p.rows.forEach(function (x) { var b = S().ballon.filter(function (y) { return y.ed === x.ed; })[0]; if (!b) { b = { id: MAGNA.id(), ed: x.ed, source: 'manual' }; S().ballon.push(b); }
          balPerson(b, 'winner', x.w); balPerson(b, 'second', x.s2); balPerson(b, 'third', x.s3); var tid = tidByName(x.t); b.team = tid; b.teamName = tid ? null : (x.t || null); if (x.se) b.season = x.se; });
        close(); commit(p.rows.length + ' ediciones importadas'); }, 'o')); bx.appendChild(r); ta.focus();
    });
  }
  function voteOpenDlg() {
    dialog('Abrir votación del Balón de Oro', function (bx, close) {
      var PS = MAGNA.playerStats(), list = S().players.filter(function (p) { return MAGNA.plays(p); }).map(function (p) { var x = PS[p.id] || {}; return { p: p, m: x.media == null ? 10 : x.media, g: x.g || 0, mvp: x.mvp || 0 }; }).sort(function (a, c) { return c.m - a.m || c.g - a.g; });
      var two = h('div', 'two2'); bx.appendChild(two); var le = h('label', 'f', 'Edición'), ed = h('input', 'in'); ed.value = balNextEd(); le.appendChild(ed); two.appendChild(le);
      var lc = h('label', 'f', 'Cierre de la votación (opcional)'), cl = h('input', 'in'); cl.type = 'datetime-local'; lc.appendChild(cl); two.appendChild(lc);
      var sec = h('div', 'tf-sec'), cnt = h('span'); sec.appendChild(document.createTextNode('Nominados ')); sec.appendChild(cnt); bx.appendChild(sec);
      var boxes = [], chk = h('div', 'chk'); list.forEach(function (x, i) { var l = h('label'), c = h('input'); c.type = 'checkbox'; c.value = x.p.id; c.checked = i < 5; c.onchange = upd; boxes.push(c); l.appendChild(c); l.appendChild(document.createTextNode(x.p.name + ' · ' + x.m + (x.g ? ' · ' + x.g + '⚽' : '') + (x.mvp ? ' · ' + x.mvp + '⭐' : ''))); chk.appendChild(l); }); bx.appendChild(chk);
      function upd() { cnt.textContent = '(' + boxes.filter(function (c) { return c.checked; }).length + ' elegidos · sugeridos los 5 de mejor media)'; } upd();
      var err = h('p', 'err'); bx.appendChild(err);
      var r = h('div', 'row'); r.appendChild(btn('Cancelar', close)); r.appendChild(btn('Abrir votación', function () {
        var e = String(ed.value || '').trim().toUpperCase(); if (/^\d+$/.test(e)) e = MAGNA.toRoman(Number(e)); if (!MAGNA.romanNo(e)) { err.textContent = 'Edición no válida.'; return; }
        if ((S().ballon || []).some(function (x) { return x.ed === e; })) { err.textContent = 'La edición ' + e + ' ya tiene ganador.'; return; }
        var noms = boxes.filter(function (c) { return c.checked; }).map(function (c) { return Number(c.value); }); if (noms.length < 2) { err.textContent = 'Elige al menos 2 nominados.'; return; }
        var at = cl.value ? toUtc(cl.value) : null; if (cl.value && (at === undefined || new Date(cl.value) < new Date())) { err.textContent = 'La fecha de cierre debe ser futura.'; return; }
        S().ballonVote = { id: MAGNA.id(), ed: e, nominees: noms, open: true, closes: at || null, opened: MAGNA.now() };
        MAGNA.addNews('announcement', 'Abre la votación del Balón de Oro ' + e + ' con ' + noms.length + ' nominados.'); close(); commit('Votación abierta'); }, 'o')); bx.appendChild(r);
    });
  }
  function balProclaim(V, rows) {
    var votes = {}; (rows || []).forEach(function (r) { votes[r.player_id] = Number(r.votes); }); var ord = V.nominees.slice().sort(function (a, c) { return (votes[c] || 0) - (votes[a] || 0); }), top = votes[ord[0]] || 0, tied = ord.filter(function (x) { return (votes[x] || 0) === top; }), total = Object.keys(votes).reduce(function (s, k) { return s + votes[k]; }, 0);
    function finish(w) { var rest = ord.filter(function (x) { return x !== w; }), p = MAGNA.by(S().players, w), b = { id: MAGNA.id(), ed: V.ed, season: null, winner: w, team: p && p.teamId || null, second: rest[0] != null ? rest[0] : null, third: rest[1] != null ? rest[1] : null, votes: votes[w] || 0, total: total, source: 'vote', at: MAGNA.now() };
      S().ballon = (S().ballon || []).concat([b]); S().ballonVote = null; MAGNA.addNews('trophy', MAGNA.playerName(w) + ' gana el Balón de Oro ' + V.ed + (total ? ' con ' + (votes[w] || 0) + ' de ' + total + ' votos' : '') + '.'); commit('¡' + MAGNA.playerName(w) + ' es Balón de Oro ' + V.ed + '!'); }
    if (tied.length === 1 && top > 0) return confirmBox('¿Proclamar a ' + MAGNA.playerName(tied[0]) + '?', 'Gana con ' + top + ' de ' + total + ' votos. Se cierra la votación y se añade al palmarés.', 'Proclamar', function () { finish(tied[0]); });
    dialog(top ? 'Empate en la votación' : 'Nadie votó', function (bx, close) { bx.appendChild(h('p', 'sub', top ? 'Empatan con ' + top + ' votos. Elige al ganador:' : 'No hubo votos. Elige al ganador:')); var pk = h('div', 'pick'); (top ? tied : V.nominees).forEach(function (pid) { var x = h('button'); x.type = 'button'; x.textContent = MAGNA.playerName(pid); x.onclick = function () { close(); finish(pid); }; pk.appendChild(x); }); bx.appendChild(pk); });
  }
  function balonV(b) {
    var V = S().ballonVote, vc = h('div', 'box'); vc.style.marginBottom = '18px'; b.appendChild(vc);
    if (V && V.id) {
      vc.appendChild(h('h3', null, '🗳️ Votación abierta · Edición ' + V.ed)); vc.appendChild(h('p', 'hint', (V.closes ? 'Cierra el ' + fdate(V.closes) + '. ' : 'Sin fecha de cierre: ciérrala tú cuando quieras. ') + 'Solo tú ves los votos mientras está abierta.'));
      var lst = h('div', 'res'); lst.appendChild(h('p', 'hint', 'Cargando votos…')); vc.appendChild(lst);
      var sbx = window.MAGNA_ADMIN && MAGNA_ADMIN.sb, rows = null;
      function drawRes() { lst.innerHTML = ''; var votes = {}, tot = 0; (rows || []).forEach(function (r) { votes[r.player_id] = Number(r.votes); tot += Number(r.votes); }); var mx = Math.max.apply(null, V.nominees.map(function (x) { return votes[x] || 0; }).concat([1]));
        V.nominees.slice().sort(function (a, c) { return (votes[c] || 0) - (votes[a] || 0); }).forEach(function (pid, i) { var r = h('div', 'ur'); r.appendChild(h('b', null, (i + 1) + '.')); var w = h('div', 'w'); w.appendChild(h('b', null, MAGNA.playerName(pid) || '—')); var bar = h('div', 'bar2'); bar.style.cssText = 'height:8px;border-radius:9px;background:rgba(255,255,255,.08);overflow:hidden;margin:4px 0 0'; var f = h('i'); f.style.cssText = 'display:block;height:100%;background:linear-gradient(90deg,#ffc400,#ff9d00);width:' + Math.round((votes[pid] || 0) / mx * 100) + '%'; bar.appendChild(f); w.appendChild(bar); r.appendChild(w); r.appendChild(h('b', null, (votes[pid] || 0) + ' votos')); lst.appendChild(r); });
        lst.appendChild(h('p', 'hint', tot + ' votos en total.')); }
      if (sbx) sbx.rpc('ballon_results', { p_vote: V.id }).then(function (r) { rows = (r && r.data) || []; drawRes(); }, function () { rows = []; drawRes(); }); else { rows = []; drawRes(); }
      var ac = h('div', 'bar2'); ac.appendChild(btn('Cerrar y proclamar ganador', function () { balProclaim(V, rows); }, 'o')); ac.appendChild(btn('Cancelar votación', function () { confirmBox('¿Cancelar la votación ' + V.ed + '?', 'Se cierra sin ganador. Los votos quedan guardados pero no cuentan.', 'Cancelar votación', function () { S().ballonVote = null; commit('Votación cancelada'); }); }, 'd'));
      var lk = h('a', 'lk', 'Ver en la web ↗'); lk.href = 'balon.html'; lk.target = '_blank'; ac.appendChild(lk); vc.appendChild(ac);
    } else {
      vc.appendChild(h('h3', null, '🗳️ Votación de la comunidad')); vc.appendChild(h('p', 'hint', 'Elige a los nominados y abre la votación: cada usuario con cuenta vota una vez (puede cambiar su voto hasta que cierre). Al cerrar, tú proclamas al ganador y entra al palmarés.'));
      var a2 = h('div', 'bar2'); a2.appendChild(btn('Abrir votación · Edición ' + balNextEd(), voteOpenDlg, 'o')); vc.appendChild(a2);
    }
    var bar = h('div', 'bar2'); bar.appendChild(h('h2', 'x', 'Palmarés')); bar.appendChild(h('div', 'sp')); bar.appendChild(btn('Importar varias', balImport)); bar.appendChild(btn('+ Registrar edición', function () { balEdit(null); }, 'o')); b.appendChild(bar);
    var L = MAGNA.ballonList(); if (!L.length) { b.appendChild(h('p', 'sub', 'Todavía no hay ediciones. Registra las anteriores con "+ Registrar edición" o pégalas todas con "Importar varias".')); return; }
    b.appendChild(table(['Edición', 'Ganador', 'Equipo', '2.º', '3.º', 'Origen', ''], L.map(function (x) { return [h('b', null, x.ed), MAGNA.ballonWho(x, 'winner') || '—', x.team != null ? MAGNA.teamName(x.team) : (x.teamName || '—'), MAGNA.ballonWho(x, 'second') || '—', MAGNA.ballonWho(x, 'third') || '—', x.source === 'vote' ? 'Votación' + (x.votes ? ' · ' + x.votes + ' votos' : '') : 'Registro',
      [btn('Editar', function () { balEdit(x); }, 'sm'), btn('Eliminar', function () { confirmBox('¿Eliminar la edición ' + x.ed + '?', 'Se quita del palmarés.', 'Eliminar', function () { S().ballon = S().ballon.filter(function (y) { return y !== x; }); commit('Edición eliminada'); }); }, 'sm d')]]; })));
  }
  return { balonV: balonV };
});
