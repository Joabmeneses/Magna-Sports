'use strict';
(function () {
  var h = M.h, S = function () { return MAGNA.S; }, by = MAGNA.by, view = document.getElementById('view'), tab = /^#(crear-noticia|noticias)$/.test(location.hash) ? 'noticias' : 'resumen';
  if (location.hash === '#crear-noticia') window.__newsOpenEditor = true;
  function toast(m, bad) { var box = document.getElementById('toasts'), t = h('div', 'ts' + (bad ? ' bad' : ''), m); while (box.children.length >= 2) box.firstChild.remove(); box.appendChild(t); setTimeout(function () { t.remove(); }, bad ? 4200 : 2600); }
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
        else { el = h('input', 'in'); el.type = fd.type || 'text'; if (fd.value != null) el.value = fd.value; if (fd.min != null) el.min = fd.min; if (fd.max != null) el.max = fd.max; if (fd.maxlength) el.maxLength = fd.maxlength; if (fd.type === 'file') el.accept = 'image/*'; if (fd.type === 'checkbox') { el.className = ''; el.style.cssText = 'width:auto;margin-left:8px'; } }
        els[fd.k] = el; l.appendChild(el); f.appendChild(l);
      });
      f.appendChild(err);
      var r = h('div', 'row'); r.appendChild(btn('Cancelar', close)); var ok = h('button', 'b o', okLabel || 'Guardar'); r.appendChild(ok); f.appendChild(r);
      f.onsubmit = function (e) { e.preventDefault(); var v = {}; fields.forEach(function (fd) { v[fd.k] = fd.type === 'file' ? els[fd.k].files[0] : fd.type === 'checkbox' ? els[fd.k].checked : els[fd.k].value; });
        Promise.resolve(onOk(v)).then(function (m) { if (m) err.textContent = m; else close(); }); };
      b.appendChild(f); var first = f.querySelector('input,select,textarea'); if (first) first.focus();
    });
  }
  function confirmBox(title, text, label, fn) { dialog(title, function (b, close) { b.appendChild(h('p', 'sub', text)); var r = h('div', 'row'); r.appendChild(btn('Cancelar', close)); r.appendChild(btn(label, function () { close(); fn(); }, 'd')); b.appendChild(r); }); }
  function toUtc(local) { if (!local) return null; var d = new Date(local); return isNaN(d) ? undefined : d.toISOString().slice(0, 19).replace('T', ' '); }
  function toLocal(utc) { if (!utc) return ''; var d = new Date(utc.replace(' ', 'T') + 'Z'), p = function (n) { return String(n).padStart(2, '0'); }; return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes()); }
  // Lee una foto y la reduce automáticamente (máx. 400 px, WebP) para que fotos del teléfono quepan en data.js.
  function readImg(file) { return new Promise(function (res) {
    if (!file) return res(null); if (!/^image\//.test(file.type)) return res('type');
    var r = new FileReader(); r.onerror = function () { res('type'); }; r.onload = function () {
      var im = new Image(); im.onerror = function () { res('type'); }; im.onload = function () {
        var max = 400, k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(im.width * k)); c.height = Math.max(1, Math.round(im.height * k)); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        var q = 0.85, out = c.toDataURL('image/webp', q); if (out.indexOf('data:image/webp') !== 0) out = c.toDataURL('image/jpeg', q);
        while (out.length * 0.75 > 150 * 1024 && q > 0.4) { q -= 0.15; out = c.toDataURL(out.indexOf('data:image/webp') === 0 ? 'image/webp' : 'image/jpeg', q); }
        res(out.length * 0.75 > 150 * 1024 ? 'big' : out);
      }; im.src = r.result;
    }; r.readAsDataURL(file); }); }
  function imgErr(img) { return img === 'big' ? 'La foto es demasiado grande incluso reducida. Prueba con otra.' : img === 'type' ? 'El archivo no es una imagen válida (usa PNG, JPG o WebP).' : null; }

  // ---------- equipos ----------
  function teamsV(b) {
    var bar = h('div', 'bar2'); bar.appendChild(h('div', 'sp')); bar.appendChild(btn('+ Nuevo equipo', function () {
      ask('Nuevo equipo', [{ k: 'n', label: 'Nombre', maxlength: 30 }, { k: 'i', label: 'Descripción (opcional)', type: 'textarea' }, { k: 'f', label: 'Foto o escudo (opcional; se reduce sola)', type: 'file' }], function (v) {
        var n = okName(v.n, 2, 30); if (!n) return 'Nombre no válido (2 a 30 caracteres).'; if (S().teams.some(function (t) { return nk(t.name) === nk(n); })) return 'Ya existe un equipo con ese nombre.';
        return readImg(v.f).then(function (img) { var e = imgErr(img); if (e) return e;
          var t = { id: MAGNA.id(), name: n, info: (v.i || '').slice(0, 300), crest: img || null, budget: 0, coach: null }; S().teams.push(t); MAGNA.addNews('team_created', 'Nace un nuevo equipo: ' + n + '.'); commit('Equipo creado'); }); }, 'Crear');
    }, 'o')); b.appendChild(bar);
    b.appendChild(table(['Equipo', 'DT', 'Plantilla', 'Trofeos', 'Bits', ''], S().teams.map(function (t) { var c = by(S().players, t.coach), n = S().players.filter(function (p) { return p.teamId === t.id; }).length;
      return [[M.crest(t.id, t.name, 34), ' ', h('b', null, t.name)], c ? c.name : 'por asignar', n + '/4', String((t.trophies || []).length), t.budget, [btn('Plantilla', function () { squadDlg(t.id); }), btn('Trofeos', function () { trophyDlg(t.id); }), btn('Editar', function () { editTeam(t); }), btn('Eliminar', function () { delTeam(t); }, 'd')]]; })));
  }
  // ---------- trofeos (palmarés) ----------
  function trophyDlg(tid) {
    var t = by(S().teams, tid), CATS = MAGNA.TROPHY_CATS, catName = function (k) { var c = CATS.filter(function (x) { return x[0] === k; })[0]; return c ? c[1] : 'Otro'; };
    dialog('Trofeos de ' + t.name, function (b) {
      var box = h('div'); b.appendChild(box);
      function draw() {
        box.innerHTML = ''; var list = t.trophies || [];
        box.appendChild(h('p', 'sub', list.length ? list.length + ' trofeo' + (list.length === 1 ? '' : 's') + ' · ' + CATS.map(function (c) { return c[1] + ': ' + list.filter(function (x) { return x.cat === c[0]; }).length; }).join(' · ') : 'Este equipo todavía no tiene trofeos.'));
        box.appendChild(table(['Trofeo', 'Categoría', 'Temporada', ''], list.map(function (x) { return [h('b', null, x.name), catName(x.cat), x.season || '—', [btn('Quitar', function () { confirmBox('¿Quitar "' + x.name + '"?', 'Se borra del palmarés de ' + t.name + '.', 'Quitar', function () { t.trophies = list.filter(function (y) { return y !== x; }); MAGNA.save(); draw(); render(); }); }, 'd')]]; })));
        var f = h('form'), r = h('div', 'bar2'), nm = h('input', 'in'), cs = h('select', 'in'), se = h('input', 'in'), err = h('p', 'err');
        nm.placeholder = 'Nombre del trofeo (ej. Liga Magna)'; nm.maxLength = 40; se.placeholder = 'Temporada (opcional)'; se.maxLength = 20;
        CATS.forEach(function (c) { var o = h('option', null, c[1]); o.value = c[0]; cs.appendChild(o); });
        [nm, cs, se].forEach(function (e) { r.appendChild(e); }); var add = h('button', 'b sm o', '+ Añadir trofeo'); r.appendChild(add); f.appendChild(h('h2', 'x', 'Añadir trofeo')); f.appendChild(r); f.appendChild(err);
        f.onsubmit = function (e) { e.preventDefault(); var n = okName(nm.value, 2, 40); if (!n) { err.textContent = 'Escribe un nombre de 2 a 40 caracteres.'; return; }
          t.trophies = list.concat([{ id: MAGNA.id(), name: n, cat: cs.value, season: se.value.trim().slice(0, 20) || null }]); MAGNA.addNews('trophy', t.name + ' suma un nuevo trofeo: ' + n + '.'); MAGNA.save(); draw(); render(); };
        box.appendChild(f);
      }
      draw();
    });
  }
  function editTeam(t) {
    ask('Editar ' + t.name, [{ k: 'n', label: 'Nombre', value: t.name, maxlength: 30 }, { k: 'i', label: 'Descripción', type: 'textarea', value: t.info }, { k: 'b', label: 'Presupuesto en Bits', type: 'number', value: t.budget, min: 0 }, { k: 'f', label: 'Foto o escudo (déjalo vacío para no cambiarlo; se reduce sola)', type: 'file' }, { k: 'x', label: 'Quitar la foto actual', type: 'checkbox' }], function (v) {
      var n = okName(v.n, 2, 30); if (!n) return 'Nombre no válido.'; if (S().teams.some(function (x) { return x.id !== t.id && nk(x.name) === nk(n); })) return 'Ya existe un equipo con ese nombre.';
      var bd = Number(v.b); if (!Number.isInteger(bd) || bd < 0 || bd > 1e9) return 'Presupuesto no válido.';
      return readImg(v.f).then(function (img) { var e = imgErr(img); if (e) return e; t.name = n; t.info = (v.i || '').slice(0, 300); t.budget = bd; if (img) t.crest = img; else if (v.x) t.crest = null; commit('Equipo actualizado'); });
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
        var free = S().players.filter(function (p) { return !p.teamId; }), PSx = MAGNA.playerStats(), lvR = MAGNA.tierRank(t.level || 'plata');
        if (mem.length < 4 && free.length) { box.appendChild(h('p', 'hint', 'Nivel de fichajes de ' + t.name + ': ' + MAGNA.TIERS[lvR][1] + '. Los jugadores de un nivel superior aparecen bloqueados.')); var sel = h('select', 'in'); free.forEach(function (p) { var md = (PSx[p.id] || {}).media, tr = MAGNA.tierOf(md), lock = md != null && tr.rank > lvR, o = h('option', null, p.name + ' · ' + (md == null ? 'sin media' : 'media ' + md + ' (' + tr.name + ')') + (lock ? ' 🔒' : '')); o.value = p.id; o.disabled = lock; sel.appendChild(o); }); var sl = h('select', 'in'); [['starter', 'Titular'], ['reserve', 'Suplente']].forEach(function (x) { var o = h('option', null, x[1]); o.value = x[0]; sl.appendChild(o); });
          var r = h('div', 'bar2'); r.appendChild(sel); r.appendChild(sl); r.appendChild(btn('Fichar', function () { var p = by(S().players, Number(sel.value)); if (!p) return toast('Elige un jugador disponible.', true); var md0 = (PSx[p.id] || {}).media; if (md0 != null && MAGNA.tierOf(md0).rank > lvR) return toast('Ese jugador está por encima del nivel de fichajes del equipo.', true); if (sl.value === 'starter' && st >= 3) return toast('Ya hay 3 titulares.', true); if (sl.value === 'reserve' && mem.length - st >= 1) return toast('Ya hay un suplente.', true); p.teamId = tid; p.slot = sl.value; MAGNA.addNews('transfer', p.name + ' ficha por ' + t.name + '.'); MAGNA.save(); draw(); }, 'o')); box.appendChild(r); }
        else if (mem.length < 4) box.appendChild(h('p', 'sub', 'No hay jugadores libres. Crea jugadores en la pestaña Jugadores.'));
      }
      draw(); var r2 = h('div', 'row'); r2.appendChild(btn('Cerrar', function () { close(); render(); banner(); })); b.appendChild(r2);
    });
  }
  // ---------- jugadores ----------
  // ---------- jugadores y sus cuentas ----------
  var ACCS = null;
  function loadAccs(then) { ACCOUNTS.list().then(function (l) { ACCS = l; then && then(); }, function () { ACCS = ACCS || []; then && then(); }); }
  function accOf(pid) { return (ACCS || []).filter(function (a) { return a.player_id === pid; })[0]; }
  function showCode(title, acc, intro) { dialog(title, function (b, close) { b.appendChild(h('p', 'sub', intro || 'Pásale estos datos al jugador. El código es fijo: no caduca y no se puede cambiar.')); b.appendChild(ACCOUNTS.codeBox(h, acc)); var r = h('div', 'row'); r.appendChild(btn('Listo', close, 'o')); b.appendChild(r); }); }
  function createAcc(p, after) { toast('Creando la cuenta de ' + p.name + '…'); ACCOUNTS.manage('create', { display_name: p.name, username: p.name, player_id: p.id, role: 'member' }).then(function (acc) { loadAccs(function () { if (tab === 'jugadores') render(); showCode('Cuenta de ' + p.name, acc, 'Se creó la cuenta con 1.000 Bits. Pásale estos datos al jugador; el código es fijo y no caduca.'); after && after(); }); }, function (e) { toast('No se pudo crear la cuenta: ' + e.message, true); after && after(); }); }
  function wipePlayer(p) { S().teams.forEach(function (t) { if (t.coach === p.id) t.coach = null; }); S().contracts = S().contracts.filter(function (c) { return c.playerId !== p.id; }); S().players = S().players.filter(function (x) { return x.id !== p.id; }); commit('Jugador eliminado para siempre'); }
  // ---------- importar jugadores (pegar desde Excel/Sheets o subir CSV) ----------
  function parseRows(text) {
    var lines = String(text || '').replace(/\r/g, '').split('\n').filter(function (l) { return l.trim(); }); if (!lines.length) return [];
    var sep = lines[0].indexOf('\t') >= 0 ? '\t' : lines[0].indexOf(';') >= 0 ? ';' : ',';
    var rows = lines.map(function (l) { return l.split(sep).map(function (c) { return c.trim().replace(/^"|"$/g, ''); }); });
    var hd = rows[0].map(function (c) { return nk(c).normalize('NFD').replace(/[̀-ͯ]/g, ''); }), col = function (names) { for (var i = 0; i < hd.length; i++) if (names.indexOf(hd[i]) >= 0) return i; return -1; };
    var iN = col(['nombre', 'jugador', 'name', 'nick', 'nombre en brawl stars']), iT = col(['equipo', 'team', 'club']), iS = col(['puesto', 'rol', 'titular', 'slot', 'posicion']), iW = col(['titulos', 'trofeos', 'torneos ganados', 'campeonatos', 'titles']);
    var body = rows; if (iN >= 0) body = rows.slice(1); else { iN = 0; iT = rows[0].length > 1 ? 1 : -1; iS = rows[0].length > 2 ? 2 : -1; iW = rows[0].length > 3 ? 3 : -1; }
    return body.map(function (r) { var sl = iS >= 0 ? nk(r[iS] || '') : ''; return { name: r[iN] || '', team: iT >= 0 ? (r[iT] || '') : '', slot: /supl|reserv|banca/.test(sl) ? 'reserve' : sl ? 'starter' : '', titles: iW >= 0 ? parseTitles(r[iW]) : [] }; }).filter(function (r) { return r.name; });
  }
  // "Copa Verano | Mundial 2025" → 2 títulos con nombre; "3" → 3 títulos sin nombre.
  function parseTitles(v) { v = String(v || '').trim(); if (!v || v === '0' || v === '-') return []; if (/^\d+$/.test(v)) { var n = Math.min(20, Number(v)), o = []; for (var i = 1; i <= n; i++) o.push('Título anterior ' + i); return o; }
    return v.split(/\s*[|/+]\s*/).map(function (t) { return okName(t, 2, 40); }).filter(Boolean).slice(0, 20); }
  function titlesDlg(p) {
    ask('Títulos anteriores de ' + p.name, [{ k: 't', label: 'Un título por línea (por ejemplo: Copa Verano 2025). Si dice "Mundial" cuenta como Mundial.', type: 'textarea', value: (p.prevTitles || []).join('\n') }], function (v) {
      var t = String(v.t || '').split('\n').map(function (x) { return okName(x, 2, 40); }).filter(Boolean).slice(0, 20); if (t.length) p.prevTitles = t; else delete p.prevTitles; commit('Títulos actualizados'); }, 'Guardar', 'Son títulos ganados antes de usar el sitio. Suben el mínimo de su media: +10 por torneo o liga y +15 por Mundial (hasta 60).');
  }
  function importDlg() {
    dialog('Importar jugadores', function (b, close) {
      b.appendChild(h('p', 'sub', 'Copia las filas desde Excel o Google Sheets y pégalas aquí, o sube un archivo CSV. Columnas: Nombre (obligatoria); Equipo, Puesto (titular o suplente) y Títulos, opcionales. En Títulos pon los nombres separados por | (Copa Verano | Mundial 2025) o solo el número de torneos ganados. Cada jugador recibe su cuenta con 1.000 Bits y un código fijo.'));
      var ta = h('textarea', 'in'); ta.rows = 8; ta.placeholder = 'Nombre\tEquipo\tPuesto\tTítulos\nLeo\tGalaxy\tTitular\tCopa Verano | Mundial 2025\nAna\tRealty\tSuplente\t2'; b.appendChild(ta);
      var fi = h('input'); fi.type = 'file'; fi.accept = '.csv,.txt,.tsv'; fi.style.display = 'none'; b.appendChild(fi); fi.onchange = function () { var f = fi.files[0]; if (f) f.text().then(function (t) { ta.value = t; prev(); }); };
      var r0 = h('div', 'bar2'); r0.appendChild(btn('Subir archivo CSV', function () { fi.click(); })); b.appendChild(r0);
      var pv = h('div'); b.appendChild(pv); var err = h('p', 'err'); b.appendChild(err); var rows = [];
      function prev() { rows = parseRows(ta.value); pv.innerHTML = ''; if (!rows.length) return; var dup = 0, bad = 0;
        rows.forEach(function (r) { r.n = okName(r.name, 2, 24); r.exists = r.n && S().players.some(function (p) { return nk(p.name) === nk(r.n); }); r.t = r.team ? S().teams.filter(function (t) { return nk(t.name) === nk(r.team); })[0] : null; if (r.exists) dup++; if (!r.n) bad++; });
        pv.appendChild(h('p', 'hint', rows.length + ' filas · ' + (rows.length - dup - bad) + ' jugadores nuevos' + (dup ? ' · ' + dup + ' ya existen (no se duplican; solo se suman sus títulos)' : '') + (bad ? ' · ' + bad + ' nombres no válidos (se omiten)' : '')));
        pv.appendChild(table(['Jugador', 'Equipo', 'Puesto', 'Títulos', ''], rows.slice(0, 60).map(function (r) { return [r.n || r.name, r.team ? (r.t ? r.t.name : r.team + ' (no existe, queda libre)') : 'Agente libre', r.slot === 'reserve' ? 'Suplente' : r.slot ? 'Titular' : '—', r.titles.length ? r.titles.length + ' · ' + r.titles.join(', ') : '—', !r.n ? 'Nombre no válido' : r.exists ? (r.titles.length ? 'Ya existe: se suman sus títulos' : 'Ya existe') : 'Nuevo']; }))); }
      ta.addEventListener('input', function () { clearTimeout(ta._t); ta._t = setTimeout(prev, 250); });
      var rr = h('div', 'row'); rr.appendChild(btn('Cancelar', close)); var go = btn('Importar y crear cuentas', function () {
        var upd = 0; rows.forEach(function (r) { if (!r.exists || !r.titles.length) return; var p = S().players.filter(function (x) { return nk(x.name) === nk(r.n); })[0], cur = p.prevTitles || []; r.titles.forEach(function (t) { if (cur.map(nk).indexOf(nk(t)) < 0) cur.push(t); }); p.prevTitles = cur.slice(0, 20); upd++; });
        var todo = rows.filter(function (r) { return r.n && !r.exists; }); if (!todo.length) { if (upd) { commit('Títulos de ' + upd + ' jugadores actualizados'); MAGNA.cloud.flush(); close(); return; } err.textContent = 'No hay jugadores nuevos para importar.'; return; }
        go.disabled = true; var made = [];
        todo.forEach(function (r) { var p = { id: MAGNA.id(), name: r.n, teamId: null, slot: null }; if (r.titles.length) p.prevTitles = r.titles;
          if (r.t) { var mem = S().players.filter(function (x) { return x.teamId === r.t.id; }), st = mem.filter(function (x) { return x.slot === 'starter'; }).length, rs = mem.length - st, want = r.slot || (st < 3 ? 'starter' : 'reserve');
            if (want === 'starter' && st < 3 || want === 'reserve' && rs < 1) { p.teamId = r.t.id; p.slot = want; } else if (st < 3) { p.teamId = r.t.id; p.slot = 'starter'; } else if (rs < 1) { p.teamId = r.t.id; p.slot = 'reserve'; } else r.full = true; }
          S().players.push(p); made.push({ p: p, r: r }); });
        commit(made.length + ' jugadores registrados'); MAGNA.cloud.flush();
        var out = [], i = 0; go.textContent = 'Creando cuentas… 0/' + made.length;
        function next() { if (i >= made.length) return done(); var m = made[i++];
          ACCOUNTS.manage('create', { display_name: m.p.name, username: m.p.name, player_id: m.p.id, role: 'member' }).then(function (a) { out.push({ name: m.p.name, username: a.username, code: a.code, full: m.r.full }); }, function (e) { out.push({ name: m.p.name, error: e.message }); }).then(function () { go.textContent = 'Creando cuentas… ' + i + '/' + made.length; next(); }); }
        function done() { close(); loadAccs(function () { if (tab === 'jugadores') render(); });
          dialog('Cuentas creadas', function (b2, close2) {
            var okL = out.filter(function (x) { return x.code; }); b2.appendChild(h('p', 'sub', okL.length + ' cuentas creadas. Pásale a cada jugador su usuario y código; los códigos son fijos y no caducan.' + (out.length - okL.length ? ' ' + (out.length - okL.length) + ' no se pudieron crear: usa "Crear cuenta" en su fila.' : '')));
            var all = btn('Copiar toda la lista', function () { ACCOUNTS.copy(okL.map(function (x) { return x.name + ' · Usuario: ' + x.username + ' · Código: ' + x.code; }).join('\n'), all); }, 'o'); var r1 = h('div', 'bar2'); r1.appendChild(all); b2.appendChild(r1);
            b2.appendChild(table(['Jugador', 'Usuario', 'Código', ''], out.map(function (x) { if (!x.code) return [x.name, '—', '—', 'Error: ' + x.error]; var c = btn('Copiar', function () { ACCOUNTS.copy('Magna Arena · Usuario: ' + x.username + ' · Código: ' + x.code, c); }, 'sm'); return [x.name + (x.full ? ' (equipo lleno, quedó libre)' : ''), h('code', null, x.username), h('b', null, x.code), c]; })));
            var r2 = h('div', 'row'); r2.appendChild(btn('Listo', close2, 'o')); b2.appendChild(r2); }); }
        setTimeout(next, 600); }, 'o'); rr.appendChild(go); b.appendChild(rr); ta.focus();
    });
  }
  function playersV(b) {
    var bar = h('div', 'bar2'); bar.appendChild(h('div', 'sp')); bar.appendChild(btn('Importar jugadores', importDlg)); bar.appendChild(btn('+ Nuevo jugador', function () {
      ask('Nuevo jugador', [{ k: 'n', label: 'Nombre en Brawl Stars', maxlength: 24 }, { k: 't', label: 'Torneos que ya ganó (opcional, uno por línea; si dice "Mundial" cuenta como Mundial)', type: 'textarea' }], function (v) { var n = okName(v.n, 2, 24); if (!n) return 'Nombre no válido (2 a 24 caracteres).'; if (S().players.some(function (p) { return nk(p.name) === nk(n); })) return 'Ya existe un jugador con ese nombre.';
        var p = { id: MAGNA.id(), name: n, teamId: null, slot: null }, tt = String(v.t || '').split('\n').map(function (x) { return okName(x, 2, 40); }).filter(Boolean).slice(0, 20); if (tt.length) p.prevTitles = tt; S().players.push(p); commit('Jugador registrado'); MAGNA.cloud.flush(); setTimeout(function () { createAcc(p); }, 500); }, 'Registrar', 'Se crea la ficha del jugador y su cuenta con un código de 6 dígitos para entrar y apostar con sus Bits. Los torneos ganados suben el mínimo de su media: +10 cada uno y +15 cada Mundial (hasta 60).'); }, 'o')); b.appendChild(bar);
    var PS = MAGNA.playerStats(); b.appendChild(h('p', 'hint', 'La media va de 10 a 100 y todos empiezan en 10. Sale de los partidos narrados en vivo: ganarle a un equipo fuerte suma mucho y perder con uno más débil resta mucho; la valoración (1 a 10) de cada partido también sube o baja. El nivel de cada equipo se calcula solo con sus resultados. Los títulos aseguran un mínimo: cada liga o torneo ganado sube el piso de la media 10 puntos (el Mundial, 15), hasta 60.'));
    if (ACCS === null) { b.appendChild(h('p', 'hint', 'Cargando cuentas…')); loadAccs(function () { if (tab === 'jugadores') render(); }); }
    b.appendChild(table(['ID', 'Jugador', 'Equipo', 'PJ', 'Goles', 'Media', 'Cuenta', 'Bits', ''], S().players.map(function (p) { var t = by(S().teams, p.teamId), x = PS[p.id] || {}, tr = MAGNA.tierOf(x.media), md = h('span', 'tier', (x.media == null ? '—' : x.media) + ' · ' + tr.name); md.style.setProperty('--c', tr.color);
      var a = accOf(p.id), ac = h('span', 'acc');
      if (a) { ac.appendChild(h('code', null, a.username)); var cp = btn('Copiar código', function () { ACCOUNTS.copy('Magna Arena · Usuario: ' + a.username + ' · Código: ' + a.code, cp); }, 'sm'); ac.appendChild(cp); ac.appendChild(btn('Ver', function () { showCode('Cuenta de ' + p.name, a); }, 'sm')); if (a.locked) { ac.appendChild(h('span', 'lk', 'Bloqueada')); ac.appendChild(btn('Desbloquear', function () { ACCOUNTS.manage('unlock', { id: a.id }).then(function () { toast('Cuenta desbloqueada'); loadAccs(render); }, function (e) { toast(e.message, true); }); }, 'sm')); } }
      else if (ACCS !== null) ac.appendChild(btn('Crear cuenta', function () { createAcc(p); }, 'sm'));
      var bits = a ? btn(String(a.bits), function () { ask('Bits de ' + p.name, [{ k: 'b', label: 'Bits disponibles', type: 'number', value: a.bits, min: 0 }], function (v) { var n = Number(v.b); if (!Number.isInteger(n) || n < 0 || n > 1e8) return 'Cantidad no válida.'; return ACCOUNTS.setBits(a.id, n).then(function () { toast('Bits actualizados'); loadAccs(render); }, function (e) { return e.message; }); }); }, 'sm') : '—';
      return ['#' + p.id, h('b', null, p.name), t ? t.name + (p.slot === 'reserve' ? ' (suplente)' : '') : 'Agente libre', x.pj || 0, x.g || 0, md, ac, bits, [
      btn('Renombrar', function () { ask('Renombrar', [{ k: 'n', label: 'Nombre', value: p.name, maxlength: 24 }], function (v) { var n = okName(v.n, 2, 24); if (!n) return 'Nombre no válido.'; if (S().players.some(function (x) { return x.id !== p.id && nk(x.name) === nk(n); })) return 'Ya existe ese nombre.'; p.name = n; commit('Nombre actualizado'); }); }),
      btn('Títulos' + (p.prevTitles && p.prevTitles.length ? ' (' + p.prevTitles.length + ')' : ''), function () { titlesDlg(p); }),
      btn('Eliminar para siempre', function () { confirmBox('¿Eliminar a ' + p.name + ' para siempre?', 'Se borran su ficha' + (a ? ', su cuenta (' + a.username + '), sus Bits y sus apuestas' : '') + '. No se puede deshacer.', 'Eliminar para siempre', function () {
        if (!a) return wipePlayer(p);
        ACCOUNTS.manage('delete', { id: a.id }).then(function () { loadAccs(); wipePlayer(p); }, function (e) { toast('No se pudo eliminar la cuenta: ' + e.message, true); }); }); }, 'd')]]; })));
  }
  // ---------- historial: torneos jugados antes del sitio ----------
  // Partidos: una línea por partido. "Galaxy 3-1 Realty", o columnas Local / Goles / Goles / Visitante (opcional Fecha al inicio).
  function parseHistMatches(text) {
    var ok = [], bad = [];
    String(text || '').replace(/\r/g, '').split('\n').forEach(function (l) { var raw = l.trim(); if (!raw) return; var m = null, d = null;
      var dm = raw.match(/^(\d{4}(?:-\d{2}){0,2})[\s\t;,]+(.*)$/); if (dm) { d = dm[1]; raw = dm[2]; }
      var cells = raw.indexOf('\t') >= 0 ? raw.split('\t') : raw.indexOf(';') >= 0 ? raw.split(';') : null;
      if (cells) { cells = cells.map(function (c) { return c.trim(); }).filter(function (c) { return c !== ''; });
        if (cells.length === 4 && /^\d+$/.test(cells[1]) && /^\d+$/.test(cells[2])) m = [cells[0], cells[1], cells[2], cells[3]];
        else if (cells.length === 3 && /^\d+\s*[-–:]\s*\d+$/.test(cells[1])) { var sc = cells[1].split(/\s*[-–:]\s*/); m = [cells[0], sc[0], sc[1], cells[2]]; } }
      if (!m) { var x = raw.match(/^(.+?)\s+(\d+)\s*[-–:]\s*(\d+)\s+(.+)$/); if (x) m = [x[1], x[2], x[3], x[4]]; }
      if (/^(local|equipo|home)\b/i.test(raw)) return;
      if (!m) return bad.push(l.trim()); var hs = Number(m[1]), as = Number(m[2]), H = okName(m[0], 1, 30), A = okName(m[3], 1, 30);
      if (!H || !A || nk(H) === nk(A) || hs === as || hs > 99 || as > 99) return bad.push(l.trim());
      var o = { home: H, away: A, hs: hs, as: as }; if (d) o.d = d; ok.push(o); });
    return { ok: ok, bad: bad };
  }
  function histDlg(e) {
    var isNew = !e; e = e || { id: MAGNA.id(), name: '', date: '', cat: 'torneo', mundial: false, champion: '', champIds: [], matches: [] };
    dialog(isNew ? 'Agregar torneo pasado' : e.name, function (b, close) {
      b.appendChild(h('p', 'sub', 'Torneos jugados antes de usar el sitio. Los marcadores ajustan el nivel de cada equipo (así ganarle a un equipo fuerte vale más) y los jugadores campeones suman el título a su media. No necesitan valoraciones.'));
      function fld(label, el) { var d = h('div', 'f'); d.appendChild(h('span', null, label)); d.appendChild(el); b.appendChild(d); return el; }
      var nm = fld('Nombre del torneo', h('input', 'in')); nm.maxLength = 40; nm.value = e.name; nm.placeholder = 'Copa Verano 2025';
      var dt = fld('Fecha o año (por ejemplo 2025 o 2025-07)', h('input', 'in')); dt.maxLength = 10; dt.value = e.date || '';
      var ct = fld('Tipo', h('select', 'in')); [['torneo', 'Torneo'], ['liga', 'Liga'], ['champions', 'Champions'], ['mundial', 'Mundial'], ['otro', 'Otro']].forEach(function (c) { var o = h('option', null, c[1]); o.value = c[0]; ct.appendChild(o); }); ct.value = e.mundial ? 'mundial' : e.cat || 'torneo';
      var ch = fld('Equipo campeón', h('input', 'in')); ch.maxLength = 30; ch.value = e.champion || ''; var dl = h('datalist'); dl.id = 'histteams'; S().teams.forEach(function (t) { var o = h('option'); o.value = t.name; dl.appendChild(o); }); b.appendChild(dl); ch.setAttribute('list', 'histteams');
      var tro = h('label', 'f'); var tc = h('input'); tc.type = 'checkbox'; tc.checked = isNew || S().teams.some(function (t) { return (t.trophies || []).some(function (x) { return x.hist === e.id; }); }); tro.appendChild(tc); tro.appendChild(document.createTextNode(' Agregar el trofeo al palmarés del equipo campeón (si existe en el sitio)')); tro.style.cssText = 'display:flex;gap:8px;align-items:center'; b.appendChild(tro);
      b.appendChild(h('h4', null, 'Jugadores campeones'));
      b.appendChild(h('p', 'hint', 'Marca quiénes ganaron ese torneo. Cada uno suma el título: +10 al mínimo de su media (+15 si es Mundial), hasta 60.'));
      var pk = h('div'); pk.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;max-height:180px;overflow:auto;margin-bottom:8px'; b.appendChild(pk); var sel = {}; (e.champIds || []).forEach(function (id) { sel[id] = 1; });
      function drawPk() { pk.innerHTML = ''; S().players.slice().sort(function (a, c) { return a.name.localeCompare(c.name); }).forEach(function (p) { var t = by(S().teams, p.teamId), x = h('button', 'b sm' + (sel[p.id] ? ' o' : ''), (sel[p.id] ? '✓ ' : '') + p.name + (t ? ' · ' + t.name : '')); x.type = 'button'; x.onclick = function () { if (sel[p.id]) delete sel[p.id]; else sel[p.id] = 1; drawPk(); }; pk.appendChild(x); }); if (!S().players.length) pk.appendChild(h('p', 'hint', 'Todavía no hay jugadores registrados.')); }
      drawPk(); var r0 = h('div', 'bar2'); r0.appendChild(btn('Marcar la plantilla actual del campeón', function () { var t = S().teams.filter(function (x) { return nk(x.name) === nk(ch.value); })[0]; if (!t) return toast('Ese equipo no existe en el sitio: marca los jugadores a mano.', true); S().players.forEach(function (p) { if (p.teamId === t.id) sel[p.id] = 1; }); drawPk(); }, 'sm')); b.appendChild(r0);
      b.appendChild(h('h4', null, 'Marcadores'));
      b.appendChild(h('p', 'hint', 'Un partido por línea: Galaxy 3-1 Realty. También puedes pegar columnas desde Excel: Local, Goles, Goles, Visitante (con la fecha al inicio si la tienes). No hay empates.'));
      var ta = h('textarea', 'in'); ta.rows = 7; ta.placeholder = 'Galaxy 3-1 Realty\nTitanes 2-0 Galaxy\nRealty 1-2 Titanes'; ta.value = (e.matches || []).map(function (m) { return (m.d ? m.d + ' ' : '') + m.home + ' ' + m.hs + '-' + m.as + ' ' + m.away; }).join('\n'); b.appendChild(ta);
      var info = h('p', 'hint'); b.appendChild(info);
      function chk() { var r = parseHistMatches(ta.value); info.textContent = r.ok.length + ' partidos leídos' + (r.bad.length ? ' · ' + r.bad.length + ' líneas no se entienden: ' + r.bad.slice(0, 3).join(' / ') : ''); info.className = r.bad.length ? 'err' : 'hint'; return r; }
      ta.addEventListener('input', chk); chk();
      var err = h('p', 'err'); b.appendChild(err);
      var rr = h('div', 'row'); rr.appendChild(btn('Cancelar', close)); rr.appendChild(btn('Guardar', function () {
        var n = okName(nm.value, 2, 40); if (!n) return err.textContent = 'Escribe el nombre del torneo (2 a 40 caracteres).';
        if ((S().history || []).some(function (x) { return x.id !== e.id && nk(x.name) === nk(n); })) return err.textContent = 'Ya hay un torneo del historial con ese nombre. Ponle el año para distinguirlo.';
        var d = dt.value.trim(); if (d && !/^\d{4}(-\d{2}){0,2}$/.test(d)) return err.textContent = 'La fecha va como 2025, 2025-07 o 2025-07-15.';
        var r = chk(); if (r.bad.length) return err.textContent = 'Corrige las líneas que no se entienden o bórralas.';
        e.name = n; e.date = d; e.mundial = ct.value === 'mundial'; e.cat = e.mundial ? 'torneo' : ct.value; e.champion = okName(ch.value, 1, 30) || ''; e.champIds = Object.keys(sel).map(Number); e.matches = r.ok;
        S().history = S().history || []; if (isNew) S().history.push(e);
        S().teams.forEach(function (t) { if (t.trophies) t.trophies = t.trophies.filter(function (x) { return x.hist !== e.id; }); });
        var champ = e.champion && S().teams.filter(function (t) { return nk(t.name) === nk(e.champion); })[0];
        if (tc.checked && champ) champ.trophies = (champ.trophies || []).concat([{ id: MAGNA.id(), name: n, cat: e.mundial ? 'torneo' : e.cat === 'champions' ? 'champions' : e.cat === 'liga' ? 'liga' : e.cat === 'otro' ? 'otro' : 'torneo', season: d ? d.slice(0, 4) : null, hist: e.id }]);
        commit(isNew ? 'Torneo agregado al historial' : 'Historial actualizado'); close(); }, 'o')); b.appendChild(rr); if (isNew) nm.focus();
    });
  }
  function histV(b) {
    var L = S().history || [], PS = MAGNA.playerStats();
    var bar = h('div', 'bar2'); bar.appendChild(h('div', 'sp')); bar.appendChild(btn('+ Agregar torneo pasado', function () { histDlg(); }, 'o')); b.appendChild(bar);
    b.appendChild(h('p', 'hint', 'Aquí van los torneos que se jugaron antes del sitio, con sus marcadores y campeones. No hacen falta valoraciones: los marcadores ajustan el nivel de los equipos y los campeones suman el título a su media. También salen en Competiciones → Historial.'));
    if (!L.length) return b.appendChild(h('p', 'em', 'Todavía no hay torneos en el historial.'));
    b.appendChild(table(['Torneo', 'Fecha', 'Campeón', 'Partidos', 'Jugadores campeones', ''], L.slice().sort(function (a, c) { return String(c.date || '').localeCompare(String(a.date || '')); }).map(function (e) {
      return [h('b', null, e.name + (e.mundial ? ' 🌍' : '')), e.date || '—', e.champion || '—', String((e.matches || []).length), (e.champIds || []).map(function (id) { var p = by(S().players, id); return p ? p.name : null; }).filter(Boolean).join(', ') || '—',
        [btn('Editar', function () { histDlg(e); }), btn('Eliminar', function () { confirmBox('¿Eliminar "' + e.name + '" del historial?', 'Se quitan sus marcadores, el título de sus jugadores y el trofeo del palmarés.', 'Eliminar', function () { S().history = L.filter(function (x) { return x !== e; }); S().teams.forEach(function (t) { if (t.trophies) t.trophies = t.trophies.filter(function (x) { return x.hist !== e.id; }); }); commit('Torneo eliminado del historial'); }); }, 'd')]]; })));
  }
  // ---------- competiciones ----------
  var ST = { draft: 'Borrador', active: 'Activa', paused: 'Pausada', finished: 'Finalizada' }, NEXT = { draft: [['active', 'Activar']], active: [['paused', 'Pausar'], ['finished', 'Finalizar']], paused: [['active', 'Reanudar'], ['finished', 'Finalizar']], finished: [] };
  function compV(b, kind) {
    var L = kind === 'leagues', list = S()[kind], word = L ? 'liga' : 'torneo';
    var bar = h('div', 'bar2'); bar.appendChild(h('div', 'sp')); bar.appendChild(btn('+ Crear ' + word, function () { newComp(kind); }, 'o')); b.appendChild(bar);
    b.appendChild(table(['Nombre', 'Estado', 'Equipos', L ? 'Puntos (V/D)' : 'Formato', ''], list.map(function (c) { return [h('b', null, c.name), ST[c.status], String(c.teamIds.length), L ? c.config.win + ' / ' + c.config.loss : (c.format === 'knockout' ? 'Eliminatoria · al mejor de ' + c.best_of : c.format === 'groups_knockout' ? 'Mundial · ' + c.gcfg.n + ' grupos, pasan ' + c.gcfg.q : 'Todos contra todos'), [btn('Gestionar', function () { compDlg(kind, c.id); })]]; })));
  }
  function newComp(kind) {
    var L = kind === 'leagues', f = [{ k: 'n', label: 'Nombre', maxlength: 40 }, { k: 'd', label: 'Descripción (opcional)', type: 'textarea' }];
    if (L) f.push({ k: 'w', label: 'Puntos por victoria', type: 'number', value: 3, min: 1, max: 10 }, { k: 'l', label: 'Puntos por derrota', type: 'number', value: 0, min: 0, max: 9 });
    else f.push({ k: 'f', label: 'Formato', type: 'select', value: 'knockout', options: [['knockout', 'Eliminatoria directa'], ['round_robin', 'Todos contra todos'], ['groups_knockout', 'Mundial: fase de grupos + eliminatoria']] }, { k: 'g', label: 'Número de grupos (solo formato Mundial)', type: 'select', value: 4, options: [[1, '1 grupo'], [2, '2 grupos'], [3, '3 grupos'], [4, '4 grupos'], [5, '5 grupos'], [6, '6 grupos'], [7, '7 grupos'], [8, '8 grupos']] }, { k: 'q', label: 'Clasifican por grupo (solo formato Mundial)', type: 'select', value: 2, options: [[1, 'El 1.º'], [2, 'Los 2 primeros'], [3, 'Los 3 primeros'], [4, 'Los 4 primeros']] }, { k: 'b', label: 'Series (sin empates)', type: 'select', value: 3, options: [[1, 'A 1 partida'], [3, 'Al mejor de 3'], [5, 'Al mejor de 5'], [7, 'Al mejor de 7']] }, { k: 'r', label: 'Reglas (opcional)', type: 'textarea' });
    ask('Crear ' + (L ? 'liga' : 'torneo'), f, function (v) {
      var n = okName(v.n, 2, 40); if (!n) return 'Nombre no válido (2 a 40 caracteres).'; if (S()[kind].some(function (c) { return nk(c.name) === nk(n); })) return 'Ya existe uno con ese nombre.';
      var c = { id: MAGNA.id(), name: n, description: (v.d || '').slice(0, 500), status: 'draft', teamIds: [] };
      if (L) { var w = Number(v.w), l = Number(v.l); if (!(Number.isInteger(w) && Number.isInteger(l) && w > l && l >= 0)) return 'Los puntos por victoria deben ser mayores que por derrota (no hay empates).'; c.config = { win: w, loss: l }; }
      else { c.format = v.f; c.best_of = Number(v.b); c.rules = (v.r || '').slice(0, 2000); c.state = null; if (v.f === 'groups_knockout') { c.gcfg = { n: Number(v.g), q: Number(v.q) }; if (c.gcfg.n * c.gcfg.q < 2) return 'Con 1 grupo deben clasificar al menos 2 equipos.'; } }
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
          else { box.appendChild(h('p', 'sub', st.phase === 'done' ? 'Campeón: ' + MAGNA.teamName(st.champion) : st.phase === 'league' ? 'Todos contra todos en curso' : st.phase === 'groups' ? 'Fase de grupos en curso · clasifican ' + c.gcfg.q + ' por grupo' : 'Ronda actual: ' + st.round));
            if (c.groups) c.groups.forEach(function (g) { var q = c.gcfg.q; box.appendChild(h('h2', 'x', 'Grupo ' + g.name)); box.appendChild(table(['#', 'Equipo', 'PJ', 'G', 'P', 'DG', 'Pts'], MAGNA.groupTable(c, g).map(function (r) { return [r.pos <= q ? r.pos + ' ✓' : r.pos, r.team, r.pj, r.g, r.p, r.dg, r.pts]; }))); });
            if (st.phase === 'groups') { var gb = h('div', 'bar2');
              gb.appendChild(btn('Pasar a la eliminatoria', function () { var e = toKnockout(c); if (e) toast(e, true); else { MAGNA.save(); draw(); render(); } }, 'o'));
              if (!compMatches(kind, c).some(function (m) { return m.status === 'finished'; })) gb.appendChild(btn('Repetir sorteo de grupos', function () { confirmBox('¿Repetir el sorteo?', 'Se borran los partidos de grupos (ninguno se ha jugado) y se reparten los equipos de nuevo.', 'Repetir', function () { S().matches = S().matches.filter(function (m) { return !(m.type === 'tournament' && m.cid === c.id); }); c.state = null; c.groups = null; var e = generate(c); if (e) toast(e, true); MAGNA.save(); draw(); render(); }); }));
              box.appendChild(gb); }
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
    else koRound(c, c.teamIds.slice()); return null;
  }
  function toKnockout(c) {
    if (!c.state || c.state.phase !== 'groups') return 'El torneo no está en fase de grupos.';
    var gm = S().matches.filter(function (m) { return m.type === 'tournament' && m.cid === c.id && m.group && m.status !== 'cancelled'; });
    if (gm.some(function (m) { return m.status !== 'finished'; })) return 'Aún hay partidos de grupos sin terminar.';
    var seeds = MAGNA.groupSeeds(c).map(function (x) { return x.t; }).filter(function (t) { return t != null; });
    if (seeds.length < 2) return 'No hay suficientes clasificados.';
    if (seeds.length === 1) { c.state = { phase: 'done', champion: seeds[0] }; return null; }
    koRound(c, seeds); MAGNA.addNews('tournament_bracket', c.name + ': termina la fase de grupos y comienza ' + c.state.round + '.'); return null;
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
        m.status === 'cancelled' ? [] : [btn('Resultado', function () { resultDlg(m); }), btn('Fecha', function () { matchDlg(m); }), m.status === 'finished' ? btn('📸 Imagen', function () { shareDlg(m); }) : '', (m.status !== 'finished' || m.live) ? btn(m.status === 'live' ? '● Consola en vivo' : m.status === 'scheduled' ? '▶ En vivo' : 'Minuto a minuto', function () { LIVE = m.id; go('vivo'); }, m.status === 'live' ? 'o' : '') : '', btn('Cancelar', function () { confirmBox('¿Cancelar el partido?', MAGNA.teamName(m.home) + ' vs ' + MAGNA.teamName(m.away), 'Cancelar partido', function () { m.status = 'cancelled'; commit('Partido cancelado'); }); }, 'd')]]; })));
  }
  function conflict(m, at, home, away, round) {
    if (at) { var t0 = new Date(at.replace(' ', 'T') + 'Z').getTime(); var c = S().matches.filter(function (x) { return x.id !== m.id && x.status !== 'cancelled' && x.at && [home, away].some(function (t) { return x.home === t || x.away === t; }) && Math.abs(new Date(x.at.replace(' ', 'T') + 'Z').getTime() - t0) < 60 * 60000; })[0];
      if (c) return 'Choque de horario: ' + MAGNA.teamName(c.home) + ' vs ' + MAGNA.teamName(c.away) + ' juega a una hora de diferencia.'; }
    if (S().matches.some(function (x) { return x.id !== m.id && x.status !== 'cancelled' && x.type === m.type && x.cid === m.cid && x.round === round && x.home === home && x.away === away; })) return 'Ese partido ya existe en esa ronda.';
    return null;
  }
  function matchDlg(m) {
    if (m) return ask('Reprogramar partido', [{ k: 'a', label: 'Fecha y hora (hora de ' + ((window.MAGNA_TZ && MAGNA_TZ.label) || 'tu zona') + ')', type: 'datetime-local', value: toLocal(m.at) }, { k: 'r', label: 'Ronda / jornada', value: m.round || '' }], function (v) { var at = toUtc(v.a); if (at === undefined) return 'Fecha no válida.'; var e = conflict(m, at, m.home, m.away, v.r.trim()); if (e) return e; m.at = at; m.round = v.r.trim(); commit('Partido actualizado'); });
    var comps = S().leagues.filter(function (c) { return c.status !== 'finished' && c.teamIds.length >= 2; }).map(function (c) { return ['league:' + c.id, 'Liga · ' + c.name]; }).concat(S().tournaments.filter(function (c) { return c.status !== 'finished' && c.teamIds.length >= 2; }).map(function (c) { return ['tournament:' + c.id, 'Torneo · ' + c.name]; }));
    if (!comps.length) return toast('Necesitas una liga o torneo con al menos 2 equipos inscritos.', true);
    dialog('Programar partido', function (b, close) {
      var cs = h('select', 'in'), hs = h('select', 'in'), as = h('select', 'in'), at = h('input', 'in'), rd = h('input', 'in'), err = h('p', 'err'); at.type = 'datetime-local'; rd.maxLength = 40; rd.placeholder = 'Jornada 1';
      comps.forEach(function (o) { var op = h('option', null, o[1]); op.value = o[0]; cs.appendChild(op); });
      function fill() { var p = cs.value.split(':'), c = by(p[0] === 'league' ? S().leagues : S().tournaments, Number(p[1])); [hs, as].forEach(function (s, k) { s.innerHTML = ''; c.teamIds.forEach(function (t, i) { var op = h('option', null, MAGNA.teamName(t)); op.value = t; if (i === k) op.selected = true; s.appendChild(op); }); }); } cs.onchange = fill; fill();
      var f = h('form'); [['Competición', cs], ['Local', hs], ['Visitante', as], ['Fecha y hora (hora de ' + ((window.MAGNA_TZ && MAGNA_TZ.label) || 'tu zona') + ')', at], ['Ronda / jornada', rd]].forEach(function (x) { var l = h('label', 'f', x[0]); l.appendChild(x[1]); f.appendChild(l); }); f.appendChild(err);
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
    b.appendChild(h('p', 'sub', 'Tus datos se guardan en la nube (Supabase) y el sitio se actualiza solo, en segundos. Aquí puedes hacer copias de seguridad y gestionar quién es administrador.'));
    var leg = MAGNA.legacyLocal();
    if (leg && (leg.teams.length || leg.matches.length)) { var bx = h('div', 'box'); bx.style.marginTop = '18px'; bx.appendChild(h('h3', 'x', 'Datos antiguos en este navegador')); bx.appendChild(h('p', 'hint', 'Encontramos datos que guardaste antes de conectar la nube: ' + leg.teams.length + ' equipos, ' + leg.players.length + ' jugadores y ' + leg.matches.length + ' partidos.'));
      var r0 = h('div', 'bar2'); r0.appendChild(btn('Subirlos a la nube', function () { confirmBox('¿Subir estos datos?', 'Reemplazan lo que hay ahora en la nube y se publican en el sitio.', 'Subir', function () { MAGNA.replace(leg); MAGNA.clearLegacy(); render(); toast('Datos subidos a la nube'); }); }, 'o')); r0.appendChild(btn('Descartarlos', function () { MAGNA.clearLegacy(); render(); })); bx.appendChild(r0); b.appendChild(bx); }
    b.appendChild(h('h2', 'x', 'Copias de seguridad'));
    var bar = h('div', 'bar2');
    bar.appendChild(btn('Descargar copia (data.js)', function () { download('data.js', '// Copia de Magna Arena. Generada ' + new Date().toISOString() + '\nwindow.MAGNA_DATA = ' + JSON.stringify(S()) + ';\nwindow.MAGNA_CONFIG = ' + JSON.stringify(window.MAGNA_CONFIG || { privacyContact: null }) + ';\n'); toast('Copia descargada'); }, 'o'));
    var fi = h('input'); fi.type = 'file'; fi.accept = '.js,.json'; fi.style.display = 'none'; fi.onchange = function () { var f = fi.files[0]; if (!f) return; f.text().then(function (t) { try { var m = /window\.MAGNA_DATA\s*=\s*(\{[\s\S]*?\});\s*(?:window\.MAGNA_CONFIG|$)/.exec(t), o = JSON.parse(m ? m[1] : t); if (!o || o.v !== 1 || !Array.isArray(o.teams) || !Array.isArray(o.matches)) throw 0; confirmBox('¿Restaurar esta copia?', 'Reemplaza los datos de la nube y del sitio.', 'Restaurar', function () { MAGNA.replace(o); render(); toast('Copia restaurada'); }); } catch (e) { toast('Archivo no válido.', true); } }); };
    b.appendChild(fi); bar.appendChild(btn('Restaurar una copia', function () { fi.click(); })); b.appendChild(bar);
    b.appendChild(h('h2', 'x', 'Administradores'));
    var ab = h('div', 'box'), al = h('div', 'adms'); ab.appendChild(h('p', 'hint', 'Solo estos correos pueden entrar al panel. La persona nueva entra en "Es mi primera vez" con su correo y crea su contraseña.')); ab.appendChild(al); b.appendChild(ab);
    function loadAdmins() { al.innerHTML = ''; al.appendChild(h('p', 'hint', 'Cargando…')); MAGNA_ADMIN.sb.from('admins').select('email').order('email').then(function (r) { al.innerHTML = ''; (r.data || []).forEach(function (x) { var row = h('div', 'ur'), w = h('div', 'w'); w.appendChild(h('b', null, x.email)); row.appendChild(w); if (x.email !== MAGNA_ADMIN.email.toLowerCase()) row.appendChild(btn('Quitar', function () { confirmBox('¿Quitar a ' + x.email + '?', 'Ya no podrá entrar al panel.', 'Quitar', function () { MAGNA_ADMIN.sb.from('admins').delete().eq('email', x.email).then(function (q) { if (q.error) toast('No se pudo quitar.', true); loadAdmins(); }); }); }, 'd sm')); else row.appendChild(h('small', 'hint', 'Tú')); al.appendChild(row); });
      var add = btn('+ Agregar administrador', function () { ask('Nuevo administrador', [{ k: 'e', label: 'Correo', type: 'email' }], function (v) { var e = String(v.e || '').trim().toLowerCase(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return 'Correo no válido.'; return MAGNA_ADMIN.sb.from('admins').insert({ email: e }).then(function (q) { if (q.error) return /duplicate/.test(q.error.message) ? 'Ese correo ya es administrador.' : 'No se pudo agregar.'; toast('Administrador agregado'); loadAdmins(); }); }, 'Agregar'); }, 'o'); var ar = h('div'); ar.appendChild(add); al.appendChild(ar); }); }
    if (window.MAGNA_ADMIN) loadAdmins();
    b.appendChild(h('h2', 'x', 'Administradores con usuario y código'));
    var cb = h('div', 'box'), cl = h('div', 'adms'); cb.appendChild(h('p', 'hint', 'Personas de confianza que manejan el panel entrando con usuario y código. El código es fijo y no caduca.')); cb.appendChild(cl); b.appendChild(cb);
    function drawAdm() { cl.innerHTML = ''; (ACCS || []).filter(function (a) { return a.role === 'admin'; }).forEach(function (a) { var r = h('div', 'ur'), w = h('div', 'w'); w.appendChild(h('b', null, a.display_name + ' · ' + a.username)); r.appendChild(w); r.appendChild(btn('Ver código', function () { showCode('Acceso de ' + a.display_name, a, 'El código es fijo: no caduca y no se puede cambiar.'); }, 'sm'));
        r.appendChild(btn('Eliminar para siempre', function () { confirmBox('¿Eliminar el acceso de ' + a.display_name + '?', 'Su cuenta se borra para siempre y ya no podrá entrar.', 'Eliminar', function () { ACCOUNTS.manage('delete', { id: a.id }).then(function () { toast('Acceso eliminado'); loadAccs(drawAdm); }, function (e) { toast(e.message, true); }); }); }, 'd sm')); cl.appendChild(r); });
      var ad = btn('+ Crear administrador', function () { ask('Nuevo administrador', [{ k: 'n', label: 'Nombre', maxlength: 40 }], function (v) { var n = okName(v.n, 2, 40); if (!n) return 'Escribe un nombre de 2 a 40 caracteres.'; return ACCOUNTS.manage('create', { display_name: n, username: n, role: 'admin' }).then(function (acc) { loadAccs(drawAdm); showCode('Acceso de ' + n, acc, 'Pásale estos datos. Podrá entrar al panel con ellos.'); }, function (e) { return e.message; }); }, 'Crear'); }, 'o'); var ar = h('div'); ar.appendChild(ad); cl.appendChild(ar); }
    loadAccs(drawAdm);
    b.appendChild(h('h2', 'x', 'Zona delicada'));
    var z = h('div', 'bar2'); z.appendChild(btn('Cargar datos de ejemplo', function () { confirmBox('¿Cargar datos de ejemplo?', 'Reemplaza TODOS los datos del sitio por equipos y partidos de ejemplo. Descarga una copia antes.', 'Cargar', demo); }, 'warn'));
    z.appendChild(btn('Vaciar todo', function () { confirmBox('¿Vaciar todos los datos?', 'Se borran equipos, jugadores, competiciones, partidos y noticias del sitio. Descarga una copia antes por si acaso.', 'Vaciar', function () { MAGNA.replace(MAGNA.clone(MAGNA.EMPTY)); render(); banner(); }); }, 'd')); b.appendChild(z);
  }

  // ---------- iconos ----------
  var IC = {
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
    live: '<circle cx="12" cy="12" r="3"/><path d="M5.6 5.6a9 9 0 000 12.8M18.4 5.6a9 9 0 010 12.8M8.5 8.5a5 5 0 000 7M15.5 8.5a5 5 0 010 7"/>',
    league: '<path d="M4 6h16M4 12h16M4 18h10"/>',
    cup: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4z"/><path d="M17 5h3v2a3 3 0 01-3 3M7 5H4v2a3 3 0 003 3"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
    coin: '<circle cx="12" cy="12" r="9"/><path d="M14.5 9.5c-.5-1-1.5-1.5-2.5-1.5-1.7 0-3 1-3 2s1 1.6 3 2 3 1 3 2-1.3 2-3 2c-1 0-2-.5-2.5-1.5M12 6v2M12 16v2"/>',
    news: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/>',
    up: '<path d="M12 16V4M6 10l6-6 6 6"/><path d="M4 20h16"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    play: '<path d="M7 4l13 8-13 8V4z"/>'
  };
  function icon(k) { var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true'); s.innerHTML = IC[k] || ''; return s; }
  function fdate(at) { return at ? new Date(at.replace(' ', 'T') + 'Z').toLocaleString('es', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Sin fecha'; }
  function compName(m) { var c = by(m.type === 'league' ? S().leagues : S().tournaments, m.cid); return c ? c.name : '—'; }
  function liveMatches() { return S().matches.filter(function (m) { return m.status === 'live'; }); }

  // ---------- resumen ----------
  var PAGES = [['noticias.html', 'Noticias', 'Noticias, destacadas y reacciones'], ['index.html', 'Partidos', 'Portada con el partido destacado'], ['ligas.html', 'Ligas', 'Tablas de cada liga'], ['competiciones.html', 'Torneos', 'Torneos y cruces'], ['mundial.html', 'Mundial', 'Grupos y eliminatoria'], ['champions.html', 'Champions', 'Tabla general'], ['apuestas.html', 'Apuestas', 'Coins y pronósticos'], ['calendario.html', 'Calendario', 'Agenda de partidos'], ['equipos.html', 'Equipos', 'Fotos, plantillas y trofeos'], ['mercado.html', 'Fichajes', 'Mercado y salarios']];
  function homeV(b) {
    var s = S(), lv = liveMatches(), upc = s.matches.filter(function (m) { return m.status === 'scheduled'; }).sort(function (a, c) { return String(a.at || '9').localeCompare(String(c.at || '9')); });
    var k = h('div', 'kpis');
    [['live', 'En vivo ahora', lv.length, 'vivo', '#ff5a36'], ['shield', 'Equipos', s.teams.length, 'equipos', '#8b5cf6'], ['user', 'Jugadores', s.players.length, 'jugadores', '#22d3ee'], ['league', 'Ligas activas', s.leagues.filter(function (c) { return c.status === 'active'; }).length, 'ligas', '#2ee59d'], ['cup', 'Torneos activos', s.tournaments.filter(function (c) { return c.status === 'active'; }).length, 'torneos', '#ffd23f'], ['cal', 'Próximos partidos', upc.length, 'partidos', '#3b4bff']].forEach(function (x) {
      var d = h('button', 'kpi'); d.style.setProperty('--c', x[4]); d.appendChild(icon(x[0])); d.appendChild(h('b', null, x[2])); d.appendChild(h('span', null, x[1])); d.onclick = function () { go(x[3]); }; k.appendChild(d); });
    b.appendChild(k);
    var row1 = h('div', 'cards');
    var bl = h('div', 'box'); bl.appendChild(h('h3', 'x', 'En vivo ahora'));
    if (!lv.length) { bl.appendChild(h('p', 'hint', 'No hay partidos en juego. Inicia uno desde la consola En vivo.')); bl.appendChild(btn('Abrir consola en vivo', function () { go('vivo'); }, 'o')); }
    lv.forEach(function (m) { var c = h('div', 'lc'); c.style.margin = '6px 0 14px'; [m.home, null, m.away].forEach(function (t, i) { if (i === 1) { var mid = h('div'); mid.appendChild(h('div', 's', (m.hs || 0) + ' - ' + (m.as || 0))); mid.appendChild(h('span', 'lvtag', m.live ? MAGNA.PHASES[m.live.phase] || 'En vivo' : 'En vivo')); c.appendChild(mid); return; } var d = h('div', 't'); d.appendChild(M.crest(t, MAGNA.teamName(t), 46)); d.appendChild(h('b', null, MAGNA.teamName(t))); c.appendChild(d); }); bl.appendChild(c); bl.appendChild(btn('Manejar partido', function () { LIVE = m.id; go('vivo'); }, 'o')); });
    row1.appendChild(bl);
    var bu = h('div', 'box'); bu.appendChild(h('h3', 'x', 'Próximos partidos')); var ul = h('div', 'up');
    if (!upc.length) ul.appendChild(h('p', 'hint', 'No hay partidos programados.'));
    upc.slice(0, 5).forEach(function (m) { var r = h('div', 'ur'), w = h('div', 'w'); w.appendChild(h('b', null, MAGNA.teamName(m.home) + ' vs ' + MAGNA.teamName(m.away))); w.appendChild(h('small', null, fdate(m.at) + ' · ' + compName(m))); r.appendChild(w); r.appendChild(btn('Iniciar', function () { LIVE = m.id; go('vivo'); }, 'sm')); ul.appendChild(r); });
    bu.appendChild(ul); row1.appendChild(bu); b.appendChild(row1);
    b.appendChild(h('h2', 'x', 'Accesos rápidos')); var q = h('div', 'acts');
    [['user', '+ Registrar jugador', 'jugadores'], ['shield', '+ Registrar equipo', 'equipos'], ['league', '+ Crear liga', 'ligas'], ['cup', '+ Crear torneo o Mundial', 'torneos'], ['cal', '+ Programar partido', 'partidos'], ['news', '+ Crear noticia', 'noticias'], ['up', 'Copias y administradores', 'datos']].forEach(function (x) { var a = h('button', 'act'); a.appendChild(icon(x[0])); a.appendChild(document.createTextNode(x[1])); a.onclick = function () { go(x[2]); }; q.appendChild(a); });
    b.appendChild(q);
    b.appendChild(h('h2', 'x', 'Tu sitio')); var pg = h('div', 'pages');
    PAGES.forEach(function (p) { var a = h('a', 'pg'); a.href = p[0]; a.target = '_blank'; a.rel = 'noopener'; var t = h('b'); t.appendChild(document.createTextNode(p[1])); t.appendChild(h('span', null, '↗')); a.appendChild(t); a.appendChild(h('small', null, p[2])); pg.appendChild(a); });
    b.appendChild(pg);
    b.appendChild(h('h2', 'x', 'Actividad reciente')); var fb = h('div', 'box'), fd = h('div', 'feed');
    if (!s.news.length) fd.appendChild(h('p', 'hint', 'Todavía no hay actividad.'));
    s.news.slice(0, 8).forEach(function (n) { var r = h('div', 'fd'); r.appendChild(h('time', null, n.at.slice(5, 16))); r.appendChild(h('span', null, n.text)); fd.appendChild(r); }); fb.appendChild(fd); b.appendChild(fb);
  }

  // ---------- consola en vivo ----------
  var LIVE = null, UNDO = {}, TICK = null;
  function ensureLive(m) { if (!m.live) m.live = { phase: 'pre', mode: null, clock: { acc: 0, since: null, run: false }, ev: [] }; return m.live; }
  function snap(m) { (UNDO[m.id] = UNDO[m.id] || []).push(JSON.stringify({ status: m.status, hs: m.hs, as: m.as, live: m.live || null })); if (UNDO[m.id].length > 40) UNDO[m.id].shift(); }
  function addEv(m, e) { var L = ensureLive(m); e.id = MAGNA.id(); e.at = MAGNA.now(); e.min = L.phase === 'pre' ? 0 : MAGNA.liveMinute(m); L.ev.push(e); }
  function liveAct(m, fn, msg) { snap(m); var e = fn(); if (e) { UNDO[m.id].pop(); return toast(e, true); } MAGNA.save(); if (msg) toast(msg); render(); banner(); }
  function lineup(tid) { var sq = squadOf(tid), st = sq.filter(function (p) { return p.slot === 'starter'; }); return (st.length ? st : sq).map(function (p) { return p.id; }); }
  function squadOf(tid) { return S().players.filter(function (p) { return p.teamId === tid; }).sort(function (a, b) { return (a.slot === 'starter' ? 0 : 1) - (b.slot === 'starter' ? 0 : 1); }); }
  function goalDlg(m, side) {
    var tid = side === 'a' ? m.away : m.home, sq = squadOf(tid);
    dialog('Gol de ' + MAGNA.teamName(tid), function (b, close) {
      b.appendChild(h('p', 'sub', '¿Quién anotó? Es opcional.'));
      var pk = h('div', 'pick'); function score(pid) { close(); liveAct(m, function () { if (side === 'a') m.as = (m.as || 0) + 1; else m.hs = (m.hs || 0) + 1; addEv(m, { k: 'goal', side: side, player: pid || null, score: m.hs + '-' + m.as }); }, '¡Gol registrado!'); }
      sq.forEach(function (p) { var x = h('button'); x.type = 'button'; x.appendChild(document.createTextNode(p.name)); x.appendChild(h('small', null, p.slot === 'starter' ? 'Titular' : 'Suplente')); x.onclick = function () { score(p.id); }; pk.appendChild(x); });
      var nb = h('button'); nb.type = 'button'; nb.appendChild(document.createTextNode('Sin indicar goleador')); nb.onclick = function () { score(null); }; pk.appendChild(nb); b.appendChild(pk);
    });
  }
  function subDlg(m) {
    dialog('Sustitución', function (b, close) {
      var side = 'h', out = null, inn = null, box = h('div'); b.appendChild(box);
      function draw() { box.innerHTML = ''; var seg = h('div', 'modes'); [['h', m.home], ['a', m.away]].forEach(function (x) { var t = h('button', 'mo' + (side === x[0] ? ' on' : ''), MAGNA.teamName(x[1])); t.type = 'button'; t.onclick = function () { side = x[0]; out = inn = null; draw(); }; seg.appendChild(t); }); box.appendChild(seg);
        var sq = squadOf(side === 'a' ? m.away : m.home), two = h('div', 'two2');
        [['Sale', function (p) { return p.id === out; }, function (p) { out = p.id; if (inn === p.id) inn = null; }], ['Entra', function (p) { return p.id === inn; }, function (p) { inn = p.id; if (out === p.id) out = null; }]].forEach(function (col) { var c = h('div'); c.appendChild(h('h2', 'x', col[0])); var pk = h('div', 'pick'); sq.forEach(function (p) { var x = h('button', col[1](p) ? 'on' : ''); x.type = 'button'; x.appendChild(document.createTextNode(p.name)); x.appendChild(h('small', null, p.slot === 'starter' ? 'Titular' : 'Suplente')); x.onclick = function () { col[2](p); draw(); }; pk.appendChild(x); }); if (!sq.length) pk.appendChild(h('p', 'hint', 'Este equipo no tiene jugadores registrados.')); c.appendChild(pk); two.appendChild(c); });
        box.appendChild(two); var r = h('div', 'row'); r.appendChild(btn('Cancelar', close)); var ok = btn('Confirmar cambio', function () { if (!out || !inn) return toast('Elige quién sale y quién entra.', true); close(); liveAct(m, function () { addEv(m, { k: 'sub', side: side, out: out, in: inn }); }, 'Sustitución registrada'); }, 'o'); r.appendChild(ok); box.appendChild(r); }
      draw();
    });
  }
  function mvpDlg(m, thenShare) {
    dialog('MVP del partido', function (b, close) {
      b.appendChild(h('p', 'sub', 'Elige al mejor jugador. Suma para su media. Es opcional.'));
      var pk = h('div', 'pick'), L = m.live || {}, ids = ((L.lineup && L.lineup.h) || []).concat((L.lineup && L.lineup.a) || []); (L.ev || []).forEach(function (e) { if (e.k === 'sub' && e.in && ids.indexOf(e.in) < 0) ids.push(e.in); });
      if (!ids.length) ids = squadOf(m.home).concat(squadOf(m.away)).map(function (p) { return p.id; });
      function pick(id) { close(); liveAct(m, function () { ensureLive(m).mvp = id; if (id) MAGNA.addNews('mvp', 'MVP de ' + MAGNA.teamName(m.home) + ' vs ' + MAGNA.teamName(m.away) + ': ' + MAGNA.playerName(id) + '.'); }, id ? 'MVP guardado' : null); if (thenShare) shareDlg(m); }
      ids.forEach(function (id) { var p = by(S().players, id); if (!p) return; var x = h('button', L.mvp === id ? 'on' : ''); x.type = 'button'; x.appendChild(document.createTextNode('⭐ ' + p.name)); x.appendChild(h('small', null, MAGNA.teamName(p.teamId))); x.onclick = function () { pick(id); }; pk.appendChild(x); });
      var nb = h('button'); nb.type = 'button'; nb.appendChild(document.createTextNode('Sin MVP')); nb.onclick = function () { pick(null); }; pk.appendChild(nb); b.appendChild(pk);
    });
  }
  function shareDlg(m) {
    dialog('Imagen del resultado', function (b) {
      b.appendChild(h('p', 'sub', 'Lista para WhatsApp, Instagram o donde quieras.'));
      var im = h('img'); im.alt = 'Resultado ' + MAGNA.teamName(m.home) + ' vs ' + MAGNA.teamName(m.away); im.style.cssText = 'width:100%;border-radius:18px;margin:10px 0;background:#0a0d18;aspect-ratio:1'; b.appendChild(im);
      var r = h('div', 'row'); b.appendChild(r);
      window.MAGNA_CARD(m).then(function (blob) {
        var url = URL.createObjectURL(blob), name = ('magna-' + MAGNA.teamName(m.home) + '-vs-' + MAGNA.teamName(m.away)).toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.png'; im.src = url;
        var file = window.File ? new File([blob], name, { type: 'image/png' }) : null;
        if (file && navigator.canShare && navigator.canShare({ files: [file] })) r.appendChild(btn('Compartir', function () { navigator.share({ files: [file], title: 'Magna Arena', text: MAGNA.teamName(m.home) + ' ' + m.hs + ' - ' + m.as + ' ' + MAGNA.teamName(m.away) }).catch(function () {}); }, 'p'));
        r.appendChild(btn('Descargar imagen', function () { var a = h('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); }, 'o'));
      }, function () { b.appendChild(h('p', 'err', 'No se pudo crear la imagen.')); });
    });
  }
  function liveV(b) {
    if (TICK) { clearInterval(TICK); TICK = null; }
    var all = S().matches.filter(function (m) { return m.status === 'live' || m.status === 'scheduled'; }).sort(function (a, c) { return (c.status === 'live') - (a.status === 'live') || String(a.at || '9').localeCompare(String(c.at || '9')); });
    var recent = S().matches.filter(function (m) { return m.status === 'finished' && m.live; }).slice(-3).reverse();
    if (!all.length && !recent.length) { var e = h('div', 'box'); e.appendChild(h('h3', 'x', 'No hay partidos para manejar')); e.appendChild(h('p', 'hint', 'Programa un partido en "Partidos" y vuelve aquí para iniciarlo y narrarlo en vivo.')); e.appendChild(btn('+ Programar partido', function () { go('partidos'); }, 'o')); b.appendChild(e); return; }
    var m = by(S().matches, LIVE); if (!m || (m.status !== 'live' && m.status !== 'scheduled' && !(m.status === 'finished' && m.live))) { m = all[0] || recent[0]; LIVE = m.id; }
    var wrap = h('div', 'lv2'), ls = h('div', 'mlist');
    function item(x) { var it = h('button', 'mi' + (x.id === m.id ? ' on' : '')); it.type = 'button'; if (x.status !== 'scheduled') it.appendChild(h('span', 'sc', (x.hs || 0) + '-' + (x.as || 0))); it.appendChild(h('b', null, MAGNA.teamName(x.home) + ' vs ' + MAGNA.teamName(x.away))); it.appendChild(h('small', null, x.status === 'live' ? '● En vivo · ' + compName(x) : x.status === 'finished' ? 'Finalizado · ' + compName(x) : fdate(x.at) + ' · ' + compName(x))); if (x.status === 'live') it.querySelector('small').style.color = 'var(--orange)'; it.onclick = function () { LIVE = x.id; render(); }; ls.appendChild(it); }
    var L1 = all.filter(function (x) { return x.status === 'live'; }), L2 = all.filter(function (x) { return x.status === 'scheduled'; });
    if (L1.length) { ls.appendChild(h('h4', null, 'En juego')); L1.forEach(item); }
    if (L2.length) { ls.appendChild(h('h4', null, 'Programados')); L2.slice(0, 12).forEach(item); }
    if (recent.length) { ls.appendChild(h('h4', null, 'Terminados hoy')); recent.forEach(item); }
    wrap.appendChild(ls);
    var L = m.live || { phase: 'pre', ev: [] }, live = m.status === 'live', fin = m.status === 'finished', con = h('div', 'con' + (live ? ' is-live' : ''));
    var ch = h('div', 'ch'); ch.appendChild(h('span', null, compName(m) + (m.round ? ' · ' + m.round : ''))); var phc = { pre: '', '1T': ' l', HT: ' h', '2T': ' l', FT: ' f' }; ch.appendChild(h('span', 'ph' + (fin ? ' f' : phc[L.phase] || ''), fin ? 'Finalizado' : live ? (MAGNA.PHASES[L.phase] || 'En vivo') + (L.mode ? ' · ' + L.mode : '') : 'Por empezar')); con.appendChild(ch);
    var sb = h('div', 'sb'); [['h', m.home], null, ['a', m.away]].forEach(function (x) {
      if (!x) { var mid = h('div'), sc = h('div', 's'); sc.appendChild(document.createTextNode(m.status === 'scheduled' ? 0 : m.hs || 0)); sc.appendChild(h('i')); sc.appendChild(document.createTextNode(m.status === 'scheduled' ? 0 : m.as || 0)); mid.appendChild(sc); var ck = h('div', 'clk', live || fin ? MAGNA.liveClock(m) : '00:00'); ck.appendChild(h('small', null, live && L.clock && L.clock.run ? 'Minuto ' + MAGNA.liveMinute(m) : live ? 'Reloj detenido' : fin ? 'Tiempo jugado' : fdate(m.at))); mid.appendChild(ck); sb.appendChild(mid);
        if (live && L.clock && L.clock.run) TICK = setInterval(function () { if (!document.body.contains(ck)) { clearInterval(TICK); TICK = null; return; } ck.firstChild.nodeValue = MAGNA.liveClock(m); ck.lastChild.textContent = 'Minuto ' + MAGNA.liveMinute(m); }, 1000);
        return; }
      var t = h('div', 't'); t.appendChild(M.crest(x[1], MAGNA.teamName(x[1]), 80)); t.appendChild(h('b', null, MAGNA.teamName(x[1]))); var g = btn('+ Gol', function () { goalDlg(m, x[0]); }, 'g gb'); g.disabled = !live || L.phase === 'HT'; t.appendChild(g); sb.appendChild(t); });
    con.appendChild(sb);
    // modo de juego
    var cg = h('div', 'cg'); cg.appendChild(h('h4', null, 'Modo de juego')); var md = h('div', 'modes');
    MAGNA.MODES.forEach(function (mo) { var x = h('button', 'mo' + (L.mode === mo ? ' on' : ''), mo); x.type = 'button'; x.disabled = fin; x.onclick = function () { if (L.mode === mo) return; liveAct(m, function () { ensureLive(m).mode = mo; addEv(m, { k: 'mode', mode: mo }); }, 'Modo: ' + mo); }; md.appendChild(x); });
    cg.appendChild(md); con.appendChild(cg);
    // controles
    var cc = h('div', 'cg'); cc.appendChild(h('h4', null, 'Control del partido')); var ct = h('div', 'ctrl');
    function cbtn(txt, cls, dis, fn) { var x = h('button', 'cb ' + cls, txt); x.type = 'button'; x.disabled = dis; x.onclick = fn; ct.appendChild(x); }
    var comp = by(m.type === 'league' ? S().leagues : S().tournaments, m.cid);
    cbtn('▶ Iniciar partido', 'o', m.status !== 'scheduled', function () { if (comp && comp.status === 'finished') return toast('La competición ya finalizó.', true); liveAct(m, function () { var l = ensureLive(m); m.status = 'live'; m.hs = 0; m.as = 0; l.phase = '1T'; l.lineup = { h: lineup(m.home), a: lineup(m.away) }; l.clock = { acc: 0, since: Date.now(), run: true }; addEv(m, { k: 'start' }); MAGNA.addNews('match_live', 'En vivo: ' + MAGNA.teamName(m.home) + ' vs ' + MAGNA.teamName(m.away) + '.'); }, '¡Partido en marcha!'); });
    cbtn('⏸ Entretiempo', 'y', !live || L.phase !== '1T', function () { liveAct(m, function () { var c = m.live.clock; c.acc += Date.now() - c.since; c.run = false; c.since = null; m.live.phase = 'HT'; addEv(m, { k: 'ht' }); }, 'Entretiempo'); });
    cbtn('▶ 2.º tiempo', 'g', !live || L.phase !== 'HT', function () { liveAct(m, function () { m.live.phase = '2T'; m.live.clock.since = Date.now(); m.live.clock.run = true; addEv(m, { k: 'resume' }); }, 'Comienza el 2.º tiempo'); });
    cbtn('⇄ Sustitución', '', !live, function () { subDlg(m); });
    cbtn('■ Finalizar', 'r', !live, function () { if ((m.hs || 0) === (m.as || 0)) return toast('No hay empates: registra el gol decisivo antes de finalizar.', true);
      confirmBox('¿Finalizar el partido?', MAGNA.teamName(m.home) + ' ' + m.hs + ' - ' + m.as + ' ' + MAGNA.teamName(m.away) + '. El resultado cuenta para la tabla.', 'Finalizar', function () { liveAct(m, function () { var c = m.live.clock; if (c.run) { c.acc += Date.now() - c.since; c.run = false; c.since = null; } addEv(m, { k: 'end', score: m.hs + '-' + m.as }); m.live.phase = 'FT'; m.status = 'finished'; MAGNA.addNews('match_result', 'Final: ' + MAGNA.teamName(m.home) + ' ' + m.hs + ' - ' + m.as + ' ' + MAGNA.teamName(m.away) + ' (' + compName(m) + ').'); }, 'Partido finalizado'); mvpDlg(m, true); }); });
    cbtn('↶ Deshacer', '', !(UNDO[m.id] && UNDO[m.id].length), function () { var st = JSON.parse(UNDO[m.id].pop()); m.status = st.status; m.hs = st.hs; m.as = st.as; if (st.live) m.live = st.live; else delete m.live; MAGNA.save(); toast('Último cambio deshecho'); render(); banner(); });
    if (fin) { cbtn('⭐ MVP' + (L.mvp ? ': ' + (MAGNA.playerName(L.mvp) || '') : ''), 'y', false, function () { mvpDlg(m, false); }); cbtn('📸 Imagen para compartir', 'o', false, function () { shareDlg(m); }); }
    cc.appendChild(ct); if (!live && !fin) cc.appendChild(h('p', 'hint', 'Inicia el partido para registrar goles, modos y sustituciones. El reloj corre solo y se detiene en el entretiempo.')); con.appendChild(cc);
    // valoraciones de los jugadores (1 a 10)
    if (live || fin) {
      var vg = h('div', 'cg'); vg.appendChild(h('h4', null, 'Valoraciones de los jugadores (1 a 10)')); var vt = h('div', 'two2 vals'), R = (m.live && m.live.ratings) || {};
      [['h', m.home], ['a', m.away]].forEach(function (sd) {
        var col = h('div', 'vcol'); col.appendChild(h('b', 'vteam', MAGNA.teamName(sd[1])));
        var ids = ((L.lineup && L.lineup[sd[0]]) || []).slice(); (L.ev || []).forEach(function (e) { if (e.k === 'sub' && e.side === sd[0] && e.in && ids.indexOf(e.in) < 0) ids.push(e.in); });
        if (!ids.length) ids = squadOf(sd[1]).map(function (p) { return p.id; });
        if (!ids.length) col.appendChild(h('p', 'hint', 'Sin jugadores registrados.'));
        ids.forEach(function (pid) { var p = by(S().players, pid); if (!p) return; var r = h('div', 'vrow'), v = R[pid];
          r.appendChild(h('span', 'vn', p.name + (String(L.mvp) === String(pid) ? ' ⭐' : '')));
          function set(nv) { liveAct(m, function () { var l = ensureLive(m); l.ratings = l.ratings || {}; if (nv == null) delete l.ratings[pid]; else l.ratings[pid] = nv; }); }
          var minus = h('button', 'vb', '−'); minus.type = 'button'; minus.setAttribute('aria-label', 'Bajar nota de ' + p.name); minus.onclick = function () { set(Math.max(1, (v == null ? 6 : v) - 0.5)); };
          var val = h('span', 'vv' + (v == null ? ' empty' : v >= 8 ? ' hi' : v < 5 ? ' lo' : ''), v == null ? '—' : String(v).replace('.', ','));
          var plus = h('button', 'vb', '+'); plus.type = 'button'; plus.setAttribute('aria-label', 'Subir nota de ' + p.name); plus.onclick = function () { set(Math.min(10, (v == null ? 6 : v) + 0.5)); };
          r.appendChild(minus); r.appendChild(val); r.appendChild(plus); col.appendChild(r); });
        vt.appendChild(col); });
      vg.appendChild(vt); vg.appendChild(h('p', 'hint', 'Empiezan en 6 al primer toque. La nota es lo que más pesa en la media del jugador; si no calificas a alguien, cuenta como 6. Puedes ajustarlas incluso después del final.'));
      con.appendChild(vg);
    }
    // línea de tiempo
    var tlw = h('div', 'cg'); tlw.appendChild(h('h4', null, 'Minuto a minuto')); var tl = h('div', 'tl');
    var ICO = { start: '▶', goal: '⚽', mode: '🎮', sub: '⇄', ht: '⏸', resume: '▶', end: '🏁' };
    (L.ev || []).slice().reverse().forEach(function (e) { var r = h('div', 'ev' + (e.k === 'goal' ? ' goal' : '')); r.appendChild(h('span', 'mn', e.min ? e.min + "'" : '')); r.appendChild(h('span', 'ic', ICO[e.k] || '•')); r.appendChild(h('span', null, MAGNA.eventText(m, e))); r.appendChild(h('time', null, (e.at || '').slice(11, 16))); tl.appendChild(r); });
    if (!(L.ev || []).length) tl.appendChild(h('p', 'hint', 'Aquí aparecerá cada acción del partido.'));
    tlw.appendChild(tl); con.appendChild(tlw); wrap.appendChild(con); b.appendChild(wrap);
  }

  // ---------- estructura del panel ----------
  var TABS = [
    { id: 'resumen', g: 'General', l: 'Resumen', i: 'home', f: homeV, d: 'Todo tu sitio de un vistazo: lo que está en vivo, lo próximo y accesos a cada página.' },
    { id: 'vivo', g: 'General', l: 'En vivo', i: 'live', f: liveV, d: 'Narra el partido: inicio, goles, modo de juego, sustituciones, entretiempo y final.', p: 'index.html', ct: function () { return liveMatches().length; } },
    { id: 'ligas', g: 'Competiciones', l: 'Ligas', i: 'league', f: function (b) { compV(b, 'leagues'); }, d: 'Crea ligas, inscribe equipos y sigue la clasificación.', p: 'ligas.html' },
    { id: 'torneos', g: 'Competiciones', l: 'Torneos y Mundial', i: 'cup', f: function (b) { compV(b, 'tournaments'); }, d: 'Eliminatorias, todos contra todos o formato Mundial con fase de grupos.', p: 'mundial.html' },
    { id: 'historial', g: 'Competiciones', l: 'Historial', i: 'cup', f: histV, d: 'Torneos anteriores al sitio: marcadores y campeones. Ajustan el nivel de los equipos y los títulos de los jugadores.', p: 'competiciones.html' },
    { id: 'partidos', g: 'Competiciones', l: 'Partidos', i: 'cal', f: matchesV, d: 'Programa partidos, cambia fechas y registra resultados.', p: 'calendario.html', ct: function () { return S().matches.filter(function (m) { return m.status === 'scheduled'; }).length; }, dim: 1 },
    { id: 'equipos', g: 'Clubes', l: 'Equipos', i: 'shield', f: teamsV, d: 'Equipos, fotos, plantillas y trofeos.', p: 'equipos.html' },
    { id: 'jugadores', g: 'Clubes', l: 'Jugadores', i: 'user', f: playersV, d: 'Fichas de jugadores. Al registrar uno se crea su cuenta con un código fijo de 6 dígitos para entrar y apostar con sus Bits.', p: 'mercado.html' },
    { id: 'economia', g: 'Clubes', l: 'Economía (Bits)', i: 'coin', f: econV, d: 'Presupuestos y contratos de cada equipo.', p: 'mercado.html' },
    { id: 'noticias', g: 'Comunicación', l: 'Noticias', i: 'news', f: function (b) { window.ADMIN_NEWS(b, { h: h, btn: btn, toast: toast, dialog: dialog, confirmBox: confirmBox }); }, d: 'Crea, programa, destaca y edita las noticias de la comunidad.', p: 'noticias.html' },
    { id: 'actividad', g: 'Comunicación', l: 'Actividad', i: 'league', f: newsV, d: 'Avisos cortos y el registro automático de lo que pasa (resultados, fichajes, MVP).', p: 'index.html' },
    { id: 'datos', g: 'Sitio', l: 'Datos y accesos', i: 'up', f: dataV, d: 'Copias de seguridad y administradores. Tus cambios ya se publican solos.' }
  ];
  function go(t) { tab = t; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function render() {
    if (TICK) { clearInterval(TICK); TICK = null; }
    var sd = document.getElementById('side'); sd.innerHTML = ''; var grp = null, cur = null;
    TABS.forEach(function (t) { if (t.g !== grp) { grp = t.g; cur = h('div', 'sg'); cur.appendChild(h('h4', null, t.g)); sd.appendChild(cur); }
      var x = h('button', 'si' + (t.id === tab ? ' on' : '')); x.type = 'button'; x.appendChild(icon(t.i)); x.appendChild(h('span', null, t.l)); var n = t.ct ? t.ct() : 0; if (n) x.appendChild(h('span', 'ct' + (t.dim ? ' dim' : ''), n)); x.onclick = function () { go(t.id); }; cur.appendChild(x); });
    var T = TABS.filter(function (t) { return t.id === tab; })[0], hd = document.getElementById('shead'); hd.innerHTML = '';
    var l = h('div'); l.appendChild(h('div', 'eb mono', 'Panel · ' + T.g)); l.appendChild(h('h1', 'x', T.l)); l.appendChild(h('p', null, T.d)); hd.appendChild(l);
    if (T.p) { var a = h('a', 'lk', 'Ver en el sitio ↗'); a.href = T.p; a.target = '_blank'; a.rel = 'noopener'; hd.appendChild(a); }
    view.innerHTML = ''; T.f(view);
  }
  function banner() {
    var b = document.getElementById('banner'), st = MAGNA.cloud.status; b.innerHTML = '';
    var cls = st === 'error' ? ' err' : (st === 'saving' || st === 'pending') ? ' sav' : '';
    b.className = 'pub' + cls; b.appendChild(h('i'));
    b.appendChild(h('span', null, st === 'error' ? 'No se pudo guardar. Reintentando… revisa tu conexión.' : st === 'saving' || st === 'pending' ? 'Guardando y publicando…' : 'Conectado · los cambios se publican al instante en el sitio.'));
    b.appendChild(h('span', 'sp')); if (window.MAGNA_ADMIN) { b.appendChild(h('span', null, MAGNA_ADMIN.email)); b.appendChild(btn('Salir', function () { MAGNA_ADMIN.signOut(); }, 'sm')); }
  }
  MAGNA.cloud.onStatus(function () { banner(); });
  render(); banner();
})();
