'use strict';
(function () {
  var h = M.h, S = function () { return MAGNA.S; }, by = MAGNA.by, view = document.getElementById('view'), tab = 'resumen';
  function toast(m, bad) { var t = h('div', 'ts' + (bad ? ' bad' : ''), m); document.getElementById('toasts').appendChild(t); setTimeout(function () { t.remove(); }, 3800); }
  function commit(msg) { if (!MAGNA.save()) toast('No se pudo guardar en este navegador (¿modo privado?).', true); else if (msg) toast(msg); render(); banner(); }
  function nk(s) { return String(s).normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase(); }
  function okName(s, min, max) { var t = String(s || '').normalize('NFKC').trim().replace(/\s+/g, ' '); return t.length >= min && t.length <= max && !/[<>\u0000-\u0008]/.test(t) ? t : null; }
  function table(cols, rows) { var w = h('div', 'pn tw'), tb = h('table'), th = h('tr'); cols.forEach(function (c) { th.appendChild(h('th', null, c)); }); tb.appendChild(th);
    if (!rows.length) { var e = h('tr'), td = h('td', null, 'Todavía no hay nada aquí.'); td.colSpan = cols.length; td.style.color = 'var(--muted)'; e.appendChild(td); tb.appendChild(e); }
    rows.forEach(function (r) { var tr = h('tr'); r.forEach(function (c) { var td = h('td'); (Array.isArray(c) ? c : [c]).forEach(function (x) { td.appendChild(x && x.nodeType ? x : document.createTextNode(x == null ? '—' : x)); }); tr.appendChild(td); }); tb.appendChild(tr); }); w.appendChild(tb); return w; }
  function btn(txt, fn, cls) { var b = h('button', 'b sm ' + (cls || ''), txt); b.type = 'button'; b.onclick = fn; return b; }
  function dialog(title, build) {
    M.modal(function (b, close) { b.appendChild(h('h3', 'x', title)); build(b, close); });
  }
  // formulario genérico: fields = [{k,label,type,value,options,opt}], onOk(values) devuelve texto de error o null
  function ask(title, fields, onOk, okLabel, intro) {
    dialog(title, function (b, close) {
      if (intro) b.appendChild(h('p', 'sub', intro));
      var f = h('form'), els = {}, err = h('p', 'err');
      fields.forEach(function (fd) {
        var l = h('label', 'f', fd.label), el;
        if (fd.type === 'select') { el = h('select', 'in'); fd.options.forEach(function (o) { var op = h('option', null, o[1]); op.value = o[0]; if (String(o[0]) === String(fd.value)) op.selected = true; el.appendChild(op); }); }
        else if (fd.type === 'textarea') { el = h('textarea', 'in'); el.rows = 3; el.value = fd.value || ''; }
        else { el = h('input', 'in'); el.type = fd.type || 'text'; if (fd.value != null) el.value = fd.value; if (fd.min != null) el.min = fd.min; if (fd.max != null) el.max = fd.max; if (fd.maxlength) el.maxLength = fd.maxlength; if (fd.type === 'file') el.accept = 'image/png,image/jpeg,image/webp'; }
        els[fd.k] = el; l.appendChild(el); f.appendChild(l);
      });
      f.appendChild(err);
      var r = h('div', 'row'); r.appendChild(btn('Cancelar', close)); var ok = h('button', 'b o', okLabel || 'Guardar'); r.appendChild(ok); f.appendChild(r);
      f.onsubmit = function (e) { e.preventDefault(); var v = {}; fields.forEach(function (fd) { v[fd.k] = fd.type === 'file' ? els[fd.k].files[0] : els[fd.k].value; });
        Promise.resolve(onOk(v)).then(function (m) { if (m) err.textContent = m; else close(); }); };
      b.appendChild(f); var first = f.querySelector('input,select,textarea'); if (first) first.focus();
    });
  }
  function confirmBox(title, text, label, fn) { dialog(title, function (b, close) { b.appendChild(h('p', 'sub', text)); var r = h('div', 'row'); r.appendChild(btn('Cancelar', close)); r.appendChild(btn(label, function () { close(); fn(); }, 'd')); b.appendChild(r); }); }
  function toUtc(local) { if (!local) return null; var d = new Date(local); return isNaN(d) ? undefined : d.toISOString().slice(0, 19).replace('T', ' '); }
  function toLocal(utc) { if (!utc) return ''; var d = new Date(utc.replace(' ', 'T') + 'Z'), p = function (n) { return String(n).padStart(2, '0'); }; return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes()); }
  function readImg(file) { return new Promise(function (res) { if (!file) return res(null); if (file.size > 150 * 1024) return res('big'); var r = new FileReader(); r.onload = function () { res(r.result); }; r.readAsDataURL(file); }); }

  // ---------- equipos ----------
  function teamsV(b) {
    var bar = h('div', 'bar2'); bar.appendChild(h('div', 'sp')); bar.appendChild(btn('+ Nuevo equipo', function () {
      ask('Nuevo equipo', [{ k: 'n', label: 'Nombre', maxlength: 30 }, { k: 'i', label: 'Descripción (opcional)', type: 'textarea' }], function (v) {
        var n = okName(v.n, 2, 30); if (!n) return 'Nombre no válido (2 a 30 caracteres).'; if (S().teams.some(function (t) { return nk(t.name) === nk(n); })) return 'Ya existe un equipo con ese nombre.';
        var t = { id: MAGNA.id(), name: n, info: (v.i || '').slice(0, 300), crest: null, budget: 0, coach: null }; S().teams.push(t); MAGNA.addNews('team_created', 'Nace un nuevo equipo: ' + n + '.'); commit('Equipo creado'); }, 'Crear');
    }, 'o')); b.appendChild(bar);
    b.appendChild(table(['Equipo', 'DT', 'Plantilla', 'Bits', ''], S().teams.map(function (t) { var c = by(S().players, t.coach), n = S().players.filter(function (p) { return p.teamId === t.id; }).length;
      return [[M.crest(t.id, t.name, 34), ' ', h('b', null, t.name)], c ? c.name : 'por asignar', n + '/4', t.budget, [btn('Plantilla', function () { squadDlg(t.id); }), btn('Editar', function () { editTeam(t); }), btn('Eliminar', function () { delTeam(t); }, 'd')]]; })));
  }
  function editTeam(t) {
    ask('Editar ' + t.name, [{ k: 'n', label: 'Nombre', value: t.name, maxlength: 30 }, { k: 'i', label: 'Descripción', type: 'textarea', value: t.info }, { k: 'b', label: 'Presupuesto en Bits', type: 'number', value: t.budget, min: 0 }, { k: 'f', label: 'Escudo (PNG, JPG o WebP, máx. 150 KB)', type: 'file' }], function (v) {
      var n = okName(v.n, 2, 30); if (!n) return 'Nombre no válido.'; if (S().teams.some(function (x) { return x.id !== t.id && nk(x.name) === nk(n); })) return 'Ya existe un equipo con ese nombre.';
      var bd = Number(v.b); if (!Number.isInteger(bd) || bd < 0 || bd > 1e9) return 'Presupuesto no válido.';
      return readImg(v.f).then(function (img) { if (img === 'big') return 'El escudo supera los 150 KB.'; t.name = n; t.info = (v.i || '').slice(0, 300); t.budget = bd; if (img) t.crest = img; commit('Equipo actualizado'); });
    });
  }
  function delTeam(t) {
    if (S().matches.some(function (m) { return m.home === t.id || m.away === t.id; })) return toast('Este equipo tiene partidos. Cancela o borra antes sus partidos.', true);
    confirmBox('¿Eliminar ' + t.name + '?', 'Sus jugadores quedan libres.', 'Eliminar', function () { S().players.forEach(function (p) { if (p.teamId === t.id) { p.teamId = null; p.slot = null; } });
      S().teams = S().teams.filter(function (x) { return x.id !== t.id; }); ['leagues', 'tournaments'].forEach(function (k) { S()[k].forEach(function (c) { c.teamIds = c.teamIds.filter(function (i) { return i !== t.id; }); }); }); S().contracts = S().contracts.filter(function (c) { return c.teamId !== t.id; }); commit('Equipo eliminado'); });
  }
  function squadDlg(tid) {
    var t = by(S().teams, tid);
    dialog('Plantilla de ' + t.name, function (b, close) {
      var box = h('div'); b.appendChild(box);
      function draw() {
        box.innerHTML = ''; var mem = S().players.filter(function (p) { return p.teamId === tid; }), st = mem.filter(function (p) { return p.slot === 'starter'; }).length;
        box.appendChild(h('p', 'sub', mem.length + '/4 jugadores · ' + st + ' titulares (máx. 3) · 1 suplente'));
        box.appendChild(table(['Jugador', 'Puesto', 'DT', ''], mem.map(function (p) { return [p.name, p.slot === 'starter' ? 'Titular' : 'Suplente', t.coach === p.id ? 'Sí' : '', [
          btn(p.slot === 'starter' ? 'A suplente' : 'A titular', function () { var o = mem.filter(function (x) { return x.slot === 'reserve' && x !== p; }).length; if (p.slot === 'starter') { if (o >= 1) return toast('Ya hay un suplente.', true); p.slot = 'reserve'; } else { if (st >= 3) return toast('Ya hay 3 titulares.', true); p.slot = 'starter'; } MAGNA.save(); draw(); }),
          btn(t.coach === p.id ? 'Quitar DT' : 'Hacer DT', function () { if (t.coach !== p.id && S().teams.some(function (x) { return x.coach === p.id; })) return toast('Ese jugador ya es DT de otro equipo.', true); t.coach = t.coach === p.id ? null : p.id; MAGNA.save(); draw(); }),
          btn('Retirar', function () { p.teamId = null; p.slot = null; if (t.coach === p.id) t.coach = null; MAGNA.addNews('transfer', p.name + ' deja ' + t.name + '.'); MAGNA.save(); draw(); }, 'd')]]; })));
        var free = S().players.filter(function (p) { return !p.teamId; });
        if (mem.length < 4 && free.length) { var sel = h('select', 'in'); free.forEach(function (p) { var o = h('option', null, p.name); o.value = p.id; sel.appendChild(o); }); var sl = h('select', 'in'); [['starter', 'Titular'], ['reserve', 'Suplente']].forEach(function (x) { var o = h('option', null, x[1]); o.value = x[0]; sl.appendChild(o); });
          var r = h('div', 'bar2'); r.appendChild(sel); r.appendChild(sl); r.appendChild(btn('Fichar', function () { var p = by(S().players, Number(sel.value)); if (sl.value === 'starter' && st >= 3) return toast('Ya hay 3 titulares.', true); if (sl.value === 'reserve' && mem.length - st >= 1) return toast('Ya hay un suplente.', true); p.teamId = tid; p.slot = sl.value; MAGNA.addNews('transfer', p.name + ' ficha por ' + t.name + '.'); MAGNA.save(); draw(); }, 'o')); box.appendChild(r); }
        else if (mem.length < 4) box.appendChild(h('p', 'sub', 'No hay jugadores libres. Crea jugadores en la pestaña Jugadores.'));
      }
      draw(); var r2 = h('div', 'row'); r2.appendChild(btn('Cerrar', function () { close(); render(); banner(); })); b.appendChild(r2);
    });
  }
  // ---------- jugadores ----------
  function playersV(b) {
    var bar = h('div', 'bar2'); bar.appendChild(h('div', 'sp')); bar.appendChild(btn('+ Nuevo jugador', function () {
      ask('Nuevo jugador', [{ k: 'n', label: 'Nombre en Brawl Stars', maxlength: 24 }], function (v) { var n = okName(v.n, 2, 24); if (!n) return 'Nombre no válido (2 a 24 caracteres).'; if (S().players.some(function (p) { return nk(p.name) === nk(n); })) return 'Ya existe un jugador con ese nombre.';
        S().players.push({ id: MAGNA.id(), name: n, teamId: null, slot: null }); commit('Jugador registrado'); }, 'Registrar', 'Se crea la ficha del jugador. No tiene cuenta ni código.'); }, 'o')); b.appendChild(bar);
    b.appendChild(table(['ID', 'Jugador', 'Equipo', ''], S().players.map(function (p) { var t = by(S().teams, p.teamId); return ['#' + p.id, h('b', null, p.name), t ? t.name + (p.slot === 'reserve' ? ' (suplente)' : '') : 'Agente libre', [
      btn('Renombrar', function () { ask('Renombrar', [{ k: 'n', label: 'Nombre', value: p.name, maxlength: 24 }], function (v) { var n = okName(v.n, 2, 24); if (!n) return 'Nombre no válido.'; if (S().players.some(function (x) { return x.id !== p.id && nk(x.name) === nk(n); })) return 'Ya existe ese nombre.'; p.name = n; commit('Nombre actualizado'); }); }),
      btn('Eliminar', function () { confirmBox('¿Eliminar a ' + p.name + '?', 'Se quita de su equipo y de sus contratos.', 'Eliminar', function () { S().teams.forEach(function (t) { if (t.coach === p.id) t.coach = null; }); S().contracts = S().contracts.filter(function (c) { return c.playerId !== p.id; }); S().players = S().players.filter(function (x) { return x.id !== p.id; }); commit('Jugador eliminado'); }); }, 'd')]]; })));
  }
  // ---------- competiciones ----------
  var ST = { draft: 'Borrador', active: 'Activa', paused: 'Pausada', finished: 'Finalizada' }, NEXT = { draft: [['active', 'Activar']], active: [['paused', 'Pausar'], ['finished', 'Finalizar']], paused: [['active', 'Reanudar'], ['finished', 'Finalizar']], finished: [] };
  function compV(b, kind) {
    var L = kind === 'leagues', list = S()[kind], word = L ? 'liga' : 'torneo';
    var bar = h('div', 'bar2'); bar.appendChild(h('div', 'sp')); bar.appendChild(btn('+ Crear ' + word, function () { newComp(kind); }, 'o')); b.appendChild(bar);
    b.appendChild(table(['Nombre', 'Estado', 'Equipos', L ? 'Puntos (V/D)' : 'Formato', ''], list.map(function (c) { return [h('b', null, c.name), ST[c.status], String(c.teamIds.length), L ? c.config.win + ' / ' + c.config.loss : (c.format === 'knockout' ? 'Eliminatoria · al mejor de ' + c.best_of : 'Todos contra todos'), [btn('Gestionar', function () { compDlg(kind, c.id); })]]; })));
  }
  function newComp(kind) {
    var L = kind === 'leagues', f = [{ k: 'n', label: 'Nombre', maxlength: 40 }, { k: 'd', label: 'Descripción (opcional)', type: 'textarea' }];
    if (L) f.push({ k: 'w', label: 'Puntos por victoria', type: 'number', value: 3, min: 1, max: 10 }, { k: 'l', label: 'Puntos por derrota', type: 'number', value: 0, min: 0, max: 9 });
    else f.push({ k: 'f', label: 'Formato', type: 'select', value: 'knockout', options: [['knockout', 'Eliminatoria directa'], ['round_robin', 'Todos contra todos']] }, { k: 'b', label: 'Series (sin empates)', type: 'select', value: 3, options: [[1, 'A 1 partida'], [3, 'Al mejor de 3'], [5, 'Al mejor de 5'], [7, 'Al mejor de 7']] }, { k: 'r', label: 'Reglas (opcional)', type: 'textarea' });
    ask('Crear ' + (L ? 'liga' : 'torneo'), f, function (v) {
      var n = okName(v.n, 2, 40); if (!n) return 'Nombre no válido (2 a 40 caracteres).'; if (S()[kind].some(function (c) { return nk(c.name) === nk(n); })) return 'Ya existe uno con ese nombre.';
      var c = { id: MAGNA.id(), name: n, description: (v.d || '').slice(0, 500), status: 'draft', teamIds: [] };
      if (L) { var w = Number(v.w), l = Number(v.l); if (!(Number.isInteger(w) && Number.isInteger(l) && w > l && l >= 0)) return 'Los puntos por victoria deben ser mayores que por derrota (no hay empates).'; c.config = { win: w, loss: l }; }
      else { c.format = v.f; c.best_of = Number(v.b); c.rules = (v.r || '').slice(0, 2000); c.state = null; }
      S()[kind].push(c); MAGNA.addNews((L ? 'league' : 'tournament') + '_created', 'Se crea ' + (L ? 'la liga' : 'el torneo') + ': ' + n + '.'); commit('Creado'); }, 'Crear');
  }
  function compMatches(kind, c) { var ty = kind === 'leagues' ? 'league' : 'tournament'; return S().matches.filter(function (m) { return m.type === ty && m.cid === c.id; }); }
  function compDlg(kind, cid) {
    var c = by(S()[kind], cid), L = kind === 'leagues', ty = L ? 'league' : 'tournament';
    dialog(c.name, function (b, close) {
      var box = h('div'); b.appendChild(box);
      function draw() {
        box.innerHTML = ''; box.appendChild(h('p', 'sub', ST[c.status] + ' · ' + c.teamIds.length + ' equipos'));
        var a = h('div', 'bar2'); NEXT[c.status].forEach(function (x) { a.appendChild(btn(x[1], function () {
          if (x[0] === 'active' && c.status === 'draft' && c.teamIds.length < 2) return toast('Inscribe al menos 2 equipos antes de activar.', true);
          var go = function () { c.status = x[0]; MAGNA.addNews(ty + '_' + x[0], (x[0] === 'active' ? 'Arranca ' : x[0] === 'paused' ? 'En pausa: ' : x[0] === 'finished' ? 'Finaliza ' : 'Se reanuda: ') + c.name + '.'); MAGNA.save(); draw(); render(); };
          x[0] === 'finished' ? confirmBox('¿Finalizar ' + c.name + '?', 'Ya no se podrá modificar.', 'Finalizar', go) : go(); }, x[0] === 'active' ? 'o' : '')); });
        if (c.status !== 'finished') a.appendChild(btn('Elegir equipos', function () { pickTeams(c, ty, draw); }));
        if (c.status === 'draft') a.appendChild(btn('Eliminar', function () { confirmBox('¿Eliminar ' + c.name + '?', 'Se borra con sus partidos.', 'Eliminar', function () { S().matches = S().matches.filter(function (m) { return !(m.type === ty && m.cid === c.id); }); S()[kind] = S()[kind].filter(function (x) { return x.id !== c.id; }); close(); commit('Eliminado'); }); }, 'd'));
        box.appendChild(a);
        if (L) { var rows = MAGNA.standings(Object.assign({ kind: 'league' }, c)); box.appendChild(h('h2', 'x', 'Clasificación')); box.appendChild(table(['#', 'Equipo', 'PJ', 'G', 'P', 'DG', 'Pts'], rows.map(function (r) { return [r.pos, r.team, r.pj, r.g, r.p, r.dg, r.pts]; }))); }
        else {
          var st = c.state; box.appendChild(h('h2', 'x', 'Calendario automático'));
          if (!st) { box.appendChild(h('p', 'sub', c.status === 'active' ? 'Genera los cruces según el formato.' : 'Activa el torneo con al menos 2 equipos para generar los cruces.')); var g = btn('Generar calendario', function () { var e = generate(c); if (e) toast(e, true); else { MAGNA.addNews('tournament_bracket', 'Se genera el calendario de ' + c.name + '.'); MAGNA.save(); draw(); render(); } }, 'o'); g.disabled = c.status !== 'active'; box.appendChild(g); }
          else { box.appendChild(h('p', 'sub', st.phase === 'done' ? 'Campeón: ' + MAGNA.teamName(st.champion) : st.phase === 'league' ? 'Todos contra todos en curso' : 'Ronda actual: ' + st.round));
            if (st.phase === 'knockout') box.appendChild(btn('Avanzar a la siguiente ronda', function () { var e = advance(c); if (e) toast(e, true); else { MAGNA.save(); draw(); render(); } }, 'o')); }
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
  // ---------- generación de cruces ----------
  function rr(ids) { var l = ids.slice(); if (l.length % 2) l.push(null); var n = l.length, out = []; for (var r = 0; r < n - 1; r++) { var ps = []; for (var i = 0; i < n / 2; i++) { var a = l[i], b = l[n - 1 - i]; if (a != null && b != null) ps.push(r % 2 ? [b, a] : [a, b]); } out.push(ps); l.splice(1, 0, l.pop()); } return out; }
  function rname(n) { return n === 2 ? 'Final' : n === 4 ? 'Semifinales' : n === 8 ? 'Cuartos de final' : n === 16 ? 'Octavos de final' : 'Ronda de ' + n; }
  function addM(c, round, a, b) { S().matches.push({ id: MAGNA.id(), type: 'tournament', cid: c.id, round: round, home: a, away: b, at: null, status: 'scheduled', hs: null, as: null }); }
  function koRound(c, alive) { var size = 1; while (size < alive.length) size *= 2; var byes = alive.slice(0, size - alive.length), rest = alive.slice(size - alive.length), round = rname(size);
    for (var i = 0; i < rest.length / 2; i++) addM(c, round, rest[i], rest[rest.length - 1 - i]); c.state = { phase: 'knockout', byes: byes, round: round }; }
  function generate(c) {
    if (c.status !== 'active') return 'Activa el torneo antes.'; if (c.teamIds.length < 2) return 'Inscribe al menos 2 equipos.'; if (c.state) return 'Ya tiene calendario.';
    if (c.format === 'round_robin') { rr(c.teamIds).forEach(function (ps, i) { ps.forEach(function (p) { addM(c, 'Jornada ' + (i + 1), p[0], p[1]); }); }); c.state = { phase: 'league' }; }
    else koRound(c, c.teamIds.slice()); return null;
  }
  function advance(c) {
    var st = c.state; if (!st || st.phase !== 'knockout') return 'No hay ronda que avanzar.';
    var ms = S().matches.filter(function (m) { return m.type === 'tournament' && m.cid === c.id && m.round === st.round && m.status !== 'cancelled'; });
    if (ms.some(function (m) { return m.status !== 'finished'; })) return 'Aún hay partidos de esta ronda sin terminar.';
    var alive = st.byes.concat(ms.map(function (m) { return m.hs > m.as ? m.home : m.away; }));
    if (alive.length === 1) { c.state = { phase: 'done', champion: alive[0] }; MAGNA.addNews('tournament_bracket', MAGNA.teamName(alive[0]) + ' es campeón de ' + c.name + '.'); return null; }
    koRound(c, alive); MAGNA.addNews('tournament_bracket', c.name + ': comienza ' + c.state.round + '.'); return null;
  }
  // ---------- partidos ----------
  var MF = '';
  function matchesV(b) {
    var comps = S().leagues.map(function (c) { return ['league:' + c.id, 'Liga · ' + c.name]; }).concat(S().tournaments.map(function (c) { return ['tournament:' + c.id, 'Torneo · ' + c.name]; }));
    var bar = h('div', 'bar2'), sel = h('select', 'in'); sel.style.maxWidth = '320px'; [['', 'Todas las competiciones']].concat(comps).forEach(function (o) { var op = h('option', null, o[1]); op.value = o[0]; if (o[0] === MF) op.selected = true; sel.appendChild(op); }); sel.onchange = function () { MF = sel.value; render(); };
    bar.appendChild(sel); bar.appendChild(h('div', 'sp')); bar.appendChild(btn('+ Programar partido', function () { matchDlg(null); }, 'o')); b.appendChild(bar);
    var ms = S().matches.filter(function (m) { return !MF || (m.type + ':' + m.cid) === MF; }).sort(function (a, c) { return String(a.at || '9').localeCompare(String(c.at || '9')); });
    b.appendChild(table(['Competición', 'Ronda', 'Partido', 'Fecha', 'Estado', ''], ms.map(function (m) { var c = by(m.type === 'league' ? S().leagues : S().tournaments, m.cid);
      return [c ? c.name : '—', m.round, MAGNA.teamName(m.home) + ' vs ' + MAGNA.teamName(m.away), m.at ? new Date(m.at.replace(' ', 'T') + 'Z').toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Sin fecha',
        m.status === 'finished' ? m.hs + ' - ' + m.as : m.status === 'live' ? 'En vivo' : m.status === 'cancelled' ? 'Cancelado' : 'Programado',
        m.status === 'cancelled' ? [] : [btn('Resultado', function () { resultDlg(m); }), btn('Fecha', function () { matchDlg(m); }), btn(m.status === 'live' ? 'Quitar vivo' : 'En vivo', function () { m.status = m.status === 'live' ? 'scheduled' : 'live'; commit(); }), btn('Cancelar', function () { confirmBox('¿Cancelar el partido?', MAGNA.teamName(m.home) + ' vs ' + MAGNA.teamName(m.away), 'Cancelar partido', function () { m.status = 'cancelled'; commit('Partido cancelado'); }); }, 'd')]]; })));
  }
  function conflict(m, at, home, away, round) {
    if (at) { var t0 = new Date(at.replace(' ', 'T') + 'Z').getTime(); var c = S().matches.filter(function (x) { return x.id !== m.id && x.status !== 'cancelled' && x.at && [home, away].some(function (t) { return x.home === t || x.away === t; }) && Math.abs(new Date(x.at.replace(' ', 'T') + 'Z').getTime() - t0) < 60 * 60000; })[0];
      if (c) return 'Choque de horario: ' + MAGNA.teamName(c.home) + ' vs ' + MAGNA.teamName(c.away) + ' juega a una hora de diferencia.'; }
    if (S().matches.some(function (x) { return x.id !== m.id && x.status !== 'cancelled' && x.type === m.type && x.cid === m.cid && x.round === round && x.home === home && x.away === away; })) return 'Ese partido ya existe en esa ronda.';
    return null;
  }
  function matchDlg(m) {
    if (m) return ask('Reprogramar partido', [{ k: 'a', label: 'Fecha y hora', type: 'datetime-local', value: toLocal(m.at) }, { k: 'r', label: 'Ronda / jornada', value: m.round || '' }], function (v) { var at = toUtc(v.a); if (at === undefined) return 'Fecha no válida.'; var e = conflict(m, at, m.home, m.away, v.r.trim()); if (e) return e; m.at = at; m.round = v.r.trim(); commit('Partido actualizado'); });
    var comps = S().leagues.filter(function (c) { return c.status !== 'finished' && c.teamIds.length >= 2; }).map(function (c) { return ['league:' + c.id, 'Liga · ' + c.name]; }).concat(S().tournaments.filter(function (c) { return c.status !== 'finished' && c.teamIds.length >= 2; }).map(function (c) { return ['tournament:' + c.id, 'Torneo · ' + c.name]; }));
    if (!comps.length) return toast('Necesitas una liga o torneo con al menos 2 equipos inscritos.', true);
    dialog('Programar partido', function (b, close) {
      var cs = h('select', 'in'), hs = h('select', 'in'), as = h('select', 'in'), at = h('input', 'in'), rd = h('input', 'in'), err = h('p', 'err'); at.type = 'datetime-local'; rd.maxLength = 40; rd.placeholder = 'Jornada 1';
      comps.forEach(function (o) { var op = h('option', null, o[1]); op.value = o[0]; cs.appendChild(op); });
      function fill() { var p = cs.value.split(':'), c = by(p[0] === 'league' ? S().leagues : S().tournaments, Number(p[1])); [hs, as].forEach(function (s, k) { s.innerHTML = ''; c.teamIds.forEach(function (t, i) { var op = h('option', null, MAGNA.teamName(t)); op.value = t; if (i === k) op.selected = true; s.appendChild(op); }); }); } cs.onchange = fill; fill();
      var f = h('form'); [['Competición', cs], ['Local', hs], ['Visitante', as], ['Fecha y hora (tu zona horaria)', at], ['Ronda / jornada', rd]].forEach(function (x) { var l = h('label', 'f', x[0]); l.appendChild(x[1]); f.appendChild(l); }); f.appendChild(err);
      var r = h('div', 'row'); r.appendChild(btn('Cancelar', close)); r.appendChild(h('button', 'b o', 'Programar')); f.appendChild(r);
      f.onsubmit = function (e) { e.preventDefault(); var p = cs.value.split(':'), home = Number(hs.value), away = Number(as.value); if (home === away) return err.textContent = 'Elige dos equipos distintos.';
        var u = toUtc(at.value); if (u === undefined) return err.textContent = 'Fecha no válida.'; var round = rd.value.trim() || null, m2 = { id: 0, type: p[0], cid: Number(p[1]) }; var ce = conflict(m2, u, home, away, round); if (ce) return err.textContent = ce;
        S().matches.push({ id: MAGNA.id(), type: p[0], cid: Number(p[1]), round: round, home: home, away: away, at: u, status: 'scheduled', hs: null, as: null }); close(); commit('Partido programado'); };
      b.appendChild(f);
    });
  }
  function resultDlg(m) {
    ask('Resultado: ' + MAGNA.teamName(m.home) + ' vs ' + MAGNA.teamName(m.away), [{ k: 'h', label: MAGNA.teamName(m.home), type: 'number', value: m.hs == null ? '' : m.hs, min: 0, max: 99 }, { k: 'a', label: MAGNA.teamName(m.away), type: 'number', value: m.as == null ? '' : m.as, min: 0, max: 99 }], function (v) {
      var x = Number(v.h), y = Number(v.a); if (v.h === '' || v.a === '' || !Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x > 99 || y > 99) return 'El marcador debe ser un entero entre 0 y 99.'; if (x === y) return 'No existen los empates: un equipo debe ganar.';
      var c = by(m.type === 'league' ? S().leagues : S().tournaments, m.cid); if (c && c.status === 'finished') return 'La competición ya finalizó.';
      var corr = m.status === 'finished'; m.hs = x; m.as = y; m.status = 'finished'; MAGNA.addNews('match_result', (corr ? 'Resultado corregido: ' : 'Final: ') + MAGNA.teamName(m.home) + ' ' + x + ' - ' + y + ' ' + MAGNA.teamName(m.away) + ' (' + (c ? c.name : '') + ').'); commit('Resultado guardado'); }, 'Guardar');
  }
  // ---------- noticias ----------
  function newsV(b) {
    var bar = h('div', 'bar2'); bar.appendChild(h('div', 'sp')); bar.appendChild(btn('+ Nueva noticia', function () { ask('Nueva noticia', [{ k: 't', label: 'Texto (máx. 280 caracteres)', type: 'textarea', maxlength: 280 }], function (v) { var t = (v.t || '').trim(); if (t.length < 3 || t.length > 280 || /[<>]/.test(t)) return 'La noticia debe tener entre 3 y 280 caracteres y no puede contener < ni >.'; MAGNA.addNews('announcement', t); commit('Noticia publicada'); }, 'Publicar'); }, 'o')); b.appendChild(bar);
    b.appendChild(table(['Fecha', 'Noticia', ''], S().news.map(function (n) { return [n.at, n.text, n.kind === 'announcement' ? [btn('Borrar', function () { S().news = S().news.filter(function (x) { return x.id !== n.id; }); commit('Noticia borrada'); }, 'd')] : 'automática']; })));
  }
  // ---------- economía ----------
  function econV(b) {
    b.appendChild(h('p', 'sub', 'Los Bits son una moneda ficticia sin valor real. Cada equipo tiene su presupuesto y los contratos vigentes lo comprometen.'));
    var today = MAGNA.now().slice(0, 10), act = function (c) { return !c.ends || c.ends >= today; };
    b.appendChild(h('h2', 'x', 'Presupuestos'));
    b.appendChild(table(['Equipo', 'Presupuesto', 'Comprometido', 'Libre', ''], S().teams.map(function (t) { var cm = S().contracts.filter(function (c) { return c.teamId === t.id && act(c); }).reduce(function (s, c) { return s + c.salary; }, 0);
      return [h('b', null, t.name), t.budget, cm, t.budget - cm, [btn('Ajustar', function () { ask('Presupuesto de ' + t.name, [{ k: 'b', label: 'Bits disponibles', type: 'number', value: t.budget, min: 0 }], function (v) { var x = Number(v.b); if (!Number.isInteger(x) || x < 0 || x > 1e9) return 'Presupuesto no válido.'; t.budget = x; commit('Presupuesto actualizado'); }); })]]; })));
    var bar = h('div', 'bar2'); bar.appendChild(h('h2', 'x', 'Contratos')); bar.appendChild(h('div', 'sp')); bar.appendChild(btn('+ Nuevo contrato', function () {
      var ps = S().players.filter(function (p) { return p.teamId && !S().contracts.some(function (c) { return c.playerId === p.id && act(c); }); });
      if (!ps.length) return toast('No hay jugadores con equipo y sin contrato vigente.', true);
      ask('Nuevo contrato', [{ k: 'p', label: 'Jugador', type: 'select', options: ps.map(function (p) { return [p.id, p.name + ' (' + by(S().teams, p.teamId).name + ')']; }) }, { k: 's', label: 'Salario en Bits', type: 'number', value: 0, min: 0 }, { k: 'e', label: 'Fin del contrato (opcional)', type: 'date' }], function (v) { var s = Number(v.s); if (!Number.isInteger(s) || s < 0 || s > 1e7) return 'Salario no válido.'; var p = by(S().players, Number(v.p));
        S().contracts.push({ id: MAGNA.id(), playerId: p.id, teamId: p.teamId, salary: s, ends: v.e || null }); commit('Contrato creado'); }, 'Crear'); }, 'o')); b.appendChild(bar);
    b.appendChild(table(['Jugador', 'Equipo', 'Salario', 'Vigencia', ''], S().contracts.map(function (c) { var p = by(S().players, c.playerId); return [p ? p.name : '—', MAGNA.teamName(c.teamId), c.salary, c.ends ? 'hasta ' + c.ends : 'indefinido', act(c) ? [btn('Terminar', function () { c.ends = today; commit('Contrato terminado'); }, 'd')] : 'terminado']; })));
  }
  // ---------- datos ----------
  function download(name, text) { var a = h('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/javascript' })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
  function demo() {
    var T = [], names = ['Realty', 'Venture', 'Toxics', 'Sporting']; var s = MAGNA.clone(MAGNA.EMPTY);
    MAGNA.replace(s); var S0 = MAGNA.S; names.forEach(function (n) { S0.teams.push({ id: MAGNA.id(), name: n, info: 'Equipo de ejemplo', crest: null, budget: 1000, coach: null }); });
    S0.teams.forEach(function (t, i) { for (var k = 0; k < 4; k++) S0.players.push({ id: MAGNA.id(), name: 'Ejemplo ' + (i * 4 + k + 1), teamId: t.id, slot: k < 3 ? 'starter' : 'reserve' }); });
    var l = { id: MAGNA.id(), name: 'Liga de ejemplo', description: 'Datos de ejemplo', status: 'active', teamIds: S0.teams.map(function (t) { return t.id; }), config: { win: 3, loss: 0 } }; S0.leagues.push(l);
    var at = function (d) { return new Date(Date.now() + d * 864e5).toISOString().slice(0, 19).replace('T', ' '); }, ids = l.teamIds;
    [[0, 1, 2, 1, -3], [2, 3, 0, 2, -2], [0, 2, 2, 0, -1]].forEach(function (x, i) { S0.matches.push({ id: MAGNA.id(), type: 'league', cid: l.id, round: 'Jornada ' + (i + 1), home: ids[x[0]], away: ids[x[1]], at: at(x[4]), status: 'finished', hs: x[2], as: x[3] }); });
    S0.matches.push({ id: MAGNA.id(), type: 'league', cid: l.id, round: 'Jornada 4', home: ids[1], away: ids[3], at: at(1), status: 'scheduled', hs: null, as: null });
    MAGNA.addNews('announcement', 'DATOS DE EJEMPLO: bórralos desde Datos → Vaciar todo antes de publicar.'); MAGNA.save(); render(); banner();
  }
  function dataV(b) {
    b.appendChild(h('p', 'sub', 'Aquí gestionas los datos del sitio. Tus cambios viven en este navegador hasta que los publiques: descarga data.js y reemplaza el archivo del mismo nombre en tu sitio.'));
    var bar = h('div', 'bar2');
    bar.appendChild(btn('Descargar data.js para publicar', function () { download('data.js', '// Datos publicados de Magna Arena. Generado ' + new Date().toISOString() + '\nwindow.MAGNA_DATA = ' + JSON.stringify(S()) + ';\nwindow.MAGNA_CONFIG = ' + JSON.stringify(window.MAGNA_CONFIG || { privacyContact: null }) + ';\n'); toast('Descargado. Reemplaza data.js en tu sitio.'); }, 'o'));
    var fi = h('input'); fi.type = 'file'; fi.accept = '.js,.json'; fi.style.display = 'none'; fi.onchange = function () { var f = fi.files[0]; if (!f) return; f.text().then(function (t) { try { var m = /window\.MAGNA_DATA\s*=\s*(\{[\s\S]*?\});\s*(?:window\.MAGNA_CONFIG|$)/.exec(t), o = JSON.parse(m ? m[1] : t); if (!o || o.v !== 1 || !Array.isArray(o.teams) || !Array.isArray(o.matches)) throw 0; confirmBox('¿Importar estos datos?', 'Reemplazan los datos actuales de este navegador.', 'Importar', function () { MAGNA.replace(o); render(); banner(); toast('Datos importados'); }); } catch (e) { toast('Archivo no válido.', true); } }); };
    b.appendChild(fi); bar.appendChild(btn('Importar data.js', function () { fi.click(); }));
    if (MAGNA.hasLocal()) bar.appendChild(btn('Descartar mis cambios', function () { confirmBox('¿Descartar los cambios locales?', 'Vuelves a los datos publicados en data.js.', 'Descartar', function () { MAGNA.discardLocal(); render(); banner(); }); }));
    b.appendChild(bar);
    b.appendChild(h('h2', 'x', 'Zona delicada'));
    var z = h('div', 'bar2'); z.appendChild(btn('Cargar datos de ejemplo', function () { confirmBox('¿Cargar datos de ejemplo?', 'Reemplaza los datos de este navegador por equipos y partidos de ejemplo, marcados como tales.', 'Cargar', demo); }, 'warn'));
    z.appendChild(btn('Vaciar todo', function () { confirmBox('¿Vaciar todos los datos?', 'Se borran equipos, jugadores, competiciones, partidos y noticias de este navegador. Puedes volver con "Descartar mis cambios".', 'Vaciar', function () { MAGNA.replace(MAGNA.clone(MAGNA.EMPTY)); render(); banner(); }); }, 'd')); b.appendChild(z);
  }
  function homeV(b) {
    var s = S(), pend = s.matches.filter(function (m) { return (m.status === 'scheduled' || m.status === 'live') && m.at && m.at <= MAGNA.now(); }).length;
    var st = h('div', 'pills'); [['Equipos', s.teams.length], ['Jugadores', s.players.length], ['Ligas activas', s.leagues.filter(function (c) { return c.status === 'active'; }).length], ['Torneos activos', s.tournaments.filter(function (c) { return c.status === 'active'; }).length], ['Próximos partidos', s.matches.filter(function (m) { return m.status === 'scheduled'; }).length], ['Sin resultado', pend]].forEach(function (k) { var d = h('div', 'stat'); d.appendChild(h('b', null, k[1])); d.appendChild(h('span', 'mono', k[0])); st.appendChild(d); }); b.appendChild(st);
    b.appendChild(h('h2', 'x', 'Accesos rápidos')); var q = h('div', 'bar2'); [['+ Registrar jugador', 'jugadores'], ['+ Registrar equipo', 'equipos'], ['+ Crear liga', 'ligas'], ['+ Crear torneo', 'torneos'], ['+ Programar partido', 'partidos']].forEach(function (x) { q.appendChild(btn(x[0], function () { go(x[1]); })); }); b.appendChild(q);
    b.appendChild(h('h2', 'x', 'Actividad reciente')); b.appendChild(table(['Fecha', 'Qué pasó'], s.news.slice(0, 8).map(function (n) { return [n.at, n.text]; })));
  }
  var TABS = [['resumen', 'Resumen', homeV], ['equipos', 'Equipos', teamsV], ['jugadores', 'Jugadores', playersV], ['ligas', 'Ligas', function (b) { compV(b, 'leagues'); }], ['torneos', 'Torneos', function (b) { compV(b, 'tournaments'); }], ['partidos', 'Partidos y resultados', matchesV], ['noticias', 'Noticias', newsV], ['economia', 'Economía (Bits)', econV], ['datos', 'Datos y publicación', dataV]];
  function go(t) { tab = t; render(); }
  function render() {
    var tb = document.getElementById('tabs'); tb.innerHTML = ''; TABS.forEach(function (t) { var b = h('button', 'chip' + (t[0] === tab ? ' on' : ''), t[1]); b.onclick = function () { go(t[0]); }; tb.appendChild(b); });
    view.innerHTML = ''; TABS.filter(function (t) { return t[0] === tab; })[0][2](view);
  }
  function banner() {
    var b = document.getElementById('banner'); b.textContent = MAGNA.hasLocal() ? 'Tienes cambios guardados solo en este navegador. Para que el sitio los muestre a todos, ve a "Datos y publicación", descarga data.js y reemplaza el archivo en tu sitio.' : 'Estás viendo los datos publicados en data.js. Los cambios que hagas se guardan en este navegador hasta que los publiques.';
  }
  render(); banner();
})();
