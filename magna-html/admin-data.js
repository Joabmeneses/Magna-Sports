'use strict';
// Panel de administración · módulo «data»: se descarga solo al abrir su sección (lo carga admin.js).
ADMIN_MOD('data', function (A) {
  var $ = A.$, S = A.S, ask = A.ask, banner = A.banner, btn = A.btn, confirmBox = A.confirmBox, dialog = A.dialog, evRpc = A.evRpc, h = A.h, loadAccs = A.loadAccs, okName = A.okName, render = A.render, showCode = A.showCode, toast = A.toast;
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
  function bkSize(n) { return n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB'; }
  function bkWhen(at) { var d = new Date(at), m = Math.round((Date.now() - d) / 60000); return m < 1 ? 'hace un momento' : m < 60 ? 'hace ' + m + ' min' : m < 1440 ? 'hace ' + Math.round(m / 60) + ' h' : d.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' }) + ' · ' + d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }); }
  function bkFirst(note, then) { toast('Guardando un respaldo…'); evRpc('admin_backup_now', { p_note: note }).then(function () { then(); }, function (e) { confirmBox('No se pudo guardar el respaldo', (e && e.message ? e.message + '. ' : '') + '¿Quieres continuar de todos modos?', 'Continuar', then); }); }
  function bkRestore(x) {
    dialog('Restaurar respaldo', function (b, close) {
      var c = x.counts || {};
      b.appendChild(h('p', 'hint', ($.BKK[x.kind] || ['•'])[0] + ' ' + new Date(x.at).toLocaleString('es', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) + (x.note ? ' · ' + x.note : '')));
      b.appendChild(h('p', 'sub', 'Elige qué quieres recuperar. Antes de restaurar se guarda automáticamente un respaldo de cómo está todo ahora, así que puedes deshacerlo.'));
      function opt(label, desc, on) { var l = h('label', 'bk-opt'), i = h('input'); i.type = 'checkbox'; i.checked = on; l.appendChild(i); var w = h('div'); w.appendChild(h('b', null, label)); w.appendChild(h('small', null, desc)); l.appendChild(w); b.appendChild(l); return i; }
      var a = opt('🏟️ Datos del sitio', (c.equipos || 0) + ' equipos, ' + (c.jugadores || 0) + ' jugadores, ' + (c.partidos || 0) + ' partidos, torneos, eventos, escudos y ' + (c.articulos || 0) + ' noticias.', true);
      var z = opt('🪙 Bits e inventarios', 'Saldo de Bits de ' + (c.cuentas || 0) + ' cuentas, cosméticos equipados, ' + (c.items || 0) + ' objetos y ' + (c.apuestas || 0) + ' apuestas. Las cuentas y sus códigos no se tocan.', false);
      var err = h('p', 'err'); b.appendChild(err);
      var r = h('div', 'row'), go2; r.appendChild(btn('Cancelar', close)); r.appendChild(go2 = btn('Restaurar', function () {
        var parts = []; if (a.checked) parts.push('sitio'); if (z.checked) parts.push('bits'); if (!parts.length) return err.textContent = 'Marca al menos una opción.';
        go2.disabled = true; go2.textContent = 'Restaurando…';
        evRpc('admin_backup_restore', { p_id: x.id, p_parts: parts }).then(function () { close(); toast('Respaldo restaurado. Recargando…'); setTimeout(function () { location.reload(); }, 900); }, function (e) { go2.disabled = false; go2.textContent = 'Restaurar'; err.textContent = (e && e.message) || 'No se pudo restaurar.'; }); }, 'warn')); b.appendChild(r);
    });
  }
  function bkGet(x) { toast('Preparando la descarga…'); evRpc('admin_backup_get', { p_id: x.id }).then(function (d) { var a = h('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(d, null, 1)], { type: 'application/json' })); a.download = 'magna-respaldo-' + String(x.at).slice(0, 10) + '-' + x.id + '.json'; document.body.appendChild(a); a.click(); a.remove(); }, function (e) { toast((e && e.message) || 'No se pudo descargar', true); }); }
  function bkBox(b) {
    var bx = h('div', 'box bk'); b.appendChild(bx);
    var hd = h('div', 'bk-hd'), ic = h('div', 'bk-ic', '🛡️'), tx = h('div'); hd.appendChild(ic); hd.appendChild(tx);
    tx.appendChild(h('b', null, 'Respaldo automático en la nube')); var st = h('small', null, 'Cargando…'); tx.appendChild(st); hd.appendChild(h('div', 'sp'));
    var now = btn('💾 Respaldar ahora', function () { ask('Respaldar ahora', [{ k: 'n', label: 'Nota (opcional)', maxlength: 120 }], function (v) { return evRpc('admin_backup_now', { p_note: String(v.n || '').trim() || null }).then(function () { toast('Respaldo guardado'); load(); }, function (e) { return (e && e.message) || 'No se pudo guardar.'; }); }, 'Guardar', 'Guarda una foto de todo el sitio ahora mismo (por ejemplo, antes de un cambio grande).'); }, 'o');
    hd.appendChild(now); bx.appendChild(hd);
    bx.appendChild(h('p', 'hint', 'Cada día a las 3:00 a. m. se guarda solo un respaldo de todo: equipos, jugadores, partidos, torneos, escudos, noticias, Bits e inventarios. Se conservan los últimos 14 automáticos y 15 manuales. Los códigos de acceso nunca se copian.'));
    var list = h('div', 'bk-list'); bx.appendChild(list);
    function load() { list.innerHTML = ''; list.appendChild(M.skel(3));
      evRpc('admin_backups').then(function (L) { list.innerHTML = ''; L = L || [];
        var last = L.filter(function (x) { return x.kind === 'auto'; })[0], ok = last && Date.now() - new Date(last.at) < 36 * 3600e3;
        ic.className = 'bk-ic' + (ok ? ' ok' : ' warn'); st.textContent = last ? (ok ? '✔ Activo · último respaldo automático ' : '⚠ El último respaldo automático fue ') + bkWhen(last.at) : 'Todavía no hay respaldos automáticos. El primero se hace esta noche.';
        if (!L.length) { list.appendChild(h('p', 'sub', 'Aún no hay respaldos.')); return; }
        L.forEach(function (x, i) { var k = $.BKK[x.kind] || ['•', x.kind], c = x.counts || {}, r = h('div', 'bk-row' + (i === 0 ? ' new' : ''));
          r.appendChild(h('span', 'bk-k', k[0])); var w = h('div', 'w'); w.appendChild(h('b', null, bkWhen(x.at) + (x.note ? ' · ' + x.note : '')));
          w.appendChild(h('small', null, k[1] + ' · ' + (c.equipos || 0) + ' equipos · ' + (c.jugadores || 0) + ' jugadores · ' + (c.partidos || 0) + ' partidos · ' + (c.cuentas || 0) + ' cuentas · ' + bkSize(x.size || 0))); r.appendChild(w);
          r.appendChild(btn('⬇', function () { bkGet(x); }, 'sm')); r.appendChild(btn('Restaurar', function () { bkRestore(x); }, 'sm')); list.appendChild(r); });
      }, function (e) { list.innerHTML = ''; ic.className = 'bk-ic warn'; st.textContent = 'No se pudo cargar la lista de respaldos.'; list.appendChild(h('p', 'err', (e && e.message) || '')); });
    }
    load();
  }
  function dataV(b) {
    b.appendChild(h('p', 'sub', 'Tus datos se guardan en la nube (Supabase) y el sitio se actualiza solo, en segundos. Aquí puedes hacer copias de seguridad y gestionar quién es administrador.'));
    var leg = MAGNA.legacyLocal();
    if (leg && (leg.teams.length || leg.matches.length)) { var bx = h('div', 'box'); bx.style.marginTop = '18px'; bx.appendChild(h('h3', 'x', 'Datos antiguos en este navegador')); bx.appendChild(h('p', 'hint', 'Encontramos datos que guardaste antes de conectar la nube: ' + leg.teams.length + ' equipos, ' + leg.players.length + ' jugadores y ' + leg.matches.length + ' partidos.'));
      var r0 = h('div', 'bar2'); r0.appendChild(btn('Subirlos a la nube', function () { confirmBox('¿Subir estos datos?', 'Reemplazan lo que hay ahora en la nube y se publican en el sitio.', 'Subir', function () { MAGNA.replace(leg); MAGNA.clearLegacy(); render(); toast('Datos subidos a la nube'); }); }, 'o')); r0.appendChild(btn('Descartarlos', function () { MAGNA.clearLegacy(); render(); })); bx.appendChild(r0); b.appendChild(bx); }
    b.appendChild(h('h2', 'x', 'Copias de seguridad'));
    bkBox(b);
    b.appendChild(h('h3', 'x', 'Copia en tu computadora'));
    var bar = h('div', 'bar2');
    bar.appendChild(btn('Descargar copia (data.js)', function () { download('data.js', '// Copia de Magna Arena. Generada ' + new Date().toISOString() + '\nwindow.MAGNA_DATA = ' + JSON.stringify(S()) + ';\nwindow.MAGNA_CONFIG = ' + JSON.stringify(window.MAGNA_CONFIG || { privacyContact: null }) + ';\n'); toast('Copia descargada'); }, 'o'));
    var fi = h('input'); fi.type = 'file'; fi.accept = '.js,.json'; fi.style.display = 'none'; fi.onchange = function () { var f = fi.files[0]; if (!f) return; f.text().then(function (t) { try { var m = /window\.MAGNA_DATA\s*=\s*(\{[\s\S]*?\});\s*(?:window\.MAGNA_CONFIG|$)/.exec(t), o = JSON.parse(m ? m[1] : t); if (!o || o.v !== 1 || !Array.isArray(o.teams) || !Array.isArray(o.matches)) throw 0; confirmBox('¿Restaurar esta copia?', 'Reemplaza los datos de la nube y del sitio.', 'Restaurar', function () { MAGNA.replace(o); render(); toast('Copia restaurada'); }); } catch (e) { toast('Archivo no válido.', true); } }); };
    b.appendChild(fi); bar.appendChild(btn('Restaurar una copia', function () { fi.click(); })); b.appendChild(bar);
    b.appendChild(h('h2', 'x', 'Administradores'));
    var ab = h('div', 'box'), al = h('div', 'adms'); ab.appendChild(h('p', 'hint', 'Solo estos correos pueden entrar al panel. La persona nueva entra en "Es mi primera vez" con su correo y crea su contraseña.')); ab.appendChild(al); b.appendChild(ab);
    function loadAdmins() { al.innerHTML = ''; al.appendChild(M.skel(2)); MAGNA_ADMIN.sb.from('admins').select('email').order('email').then(function (r) { al.innerHTML = ''; (r.data || []).forEach(function (x) { var row = h('div', 'ur'), w = h('div', 'w'); w.appendChild(h('b', null, x.email)); row.appendChild(w); if (x.email !== MAGNA_ADMIN.email.toLowerCase()) row.appendChild(btn('Quitar', function () { confirmBox('¿Quitar a ' + x.email + '?', 'Ya no podrá entrar al panel.', 'Quitar', function () { MAGNA_ADMIN.sb.from('admins').delete().eq('email', x.email).then(function (q) { if (q.error) toast('No se pudo quitar.', true); loadAdmins(); }); }); }, 'd sm')); else row.appendChild(h('small', 'hint', 'Tú')); al.appendChild(row); });
      var add = btn('+ Agregar administrador', function () { ask('Nuevo administrador', [{ k: 'e', label: 'Correo', type: 'email' }], function (v) { var e = String(v.e || '').trim().toLowerCase(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return 'Correo no válido.'; return MAGNA_ADMIN.sb.from('admins').insert({ email: e }).then(function (q) { if (q.error) return /duplicate/.test(q.error.message) ? 'Ese correo ya es administrador.' : 'No se pudo agregar.'; toast('Administrador agregado'); loadAdmins(); }); }, 'Agregar'); }, 'o'); var ar = h('div'); ar.appendChild(add); al.appendChild(ar); }); }
    if (window.MAGNA_ADMIN) loadAdmins();
    b.appendChild(h('h2', 'x', 'Administradores con usuario y código'));
    var cb = h('div', 'box'), cl = h('div', 'adms'); cb.appendChild(h('p', 'hint', 'Personas de confianza que manejan el panel entrando con usuario y código. El código es fijo y no caduca.')); cb.appendChild(cl); b.appendChild(cb);
    function drawAdm() { cl.innerHTML = ''; ($.ACCS || []).filter(function (a) { return a.role === 'admin'; }).forEach(function (a) { var r = h('div', 'ur'), w = h('div', 'w'); w.appendChild(h('b', null, a.display_name + ' · ' + a.username)); r.appendChild(w); r.appendChild(btn('Ver código', function () { showCode('Acceso de ' + a.display_name, a, 'El código es fijo: no caduca y no se puede cambiar.'); }, 'sm'));
        r.appendChild(btn('Eliminar para siempre', function () { confirmBox('¿Eliminar el acceso de ' + a.display_name + '?', 'Su cuenta se borra para siempre y ya no podrá entrar.', 'Eliminar', function () { ACCOUNTS.manage('delete', { id: a.id }).then(function () { toast('Acceso eliminado'); loadAccs(drawAdm); }, function (e) { toast(e.message, true); }); }); }, 'd sm')); cl.appendChild(r); });
      var ad = btn('+ Crear administrador', function () { ask('Nuevo administrador', [{ k: 'n', label: 'Nombre', maxlength: 40 }], function (v) { var n = okName(v.n, 2, 40); if (!n) return 'Escribe un nombre de 2 a 40 caracteres.'; return ACCOUNTS.manage('create', { display_name: n, username: n, role: 'admin' }).then(function (acc) { loadAccs(drawAdm); showCode('Acceso de ' + n, acc, 'Pásale estos datos. Podrá entrar al panel con ellos.'); }, function (e) { return e.message; }); }, 'Crear'); }, 'o'); var ar = h('div'); ar.appendChild(ad); cl.appendChild(ar); }
    loadAccs(drawAdm);
    b.appendChild(h('h2', 'x', 'Zona delicada'));
    var z = h('div', 'bar2'); z.appendChild(btn('Cargar datos de ejemplo', function () { confirmBox('¿Cargar datos de ejemplo?', 'Reemplaza TODOS los datos del sitio por equipos y partidos de ejemplo. Antes se guarda un respaldo en la nube para que puedas volver atrás.', 'Cargar', function () { bkFirst('Antes de cargar datos de ejemplo', demo); }); }, 'warn'));
    z.appendChild(btn('Vaciar todo', function () { confirmBox('¿Vaciar todos los datos?', 'Se borran equipos, jugadores, competiciones, partidos y noticias del sitio. Antes se guarda un respaldo en la nube para que puedas volver atrás.', 'Vaciar', function () { bkFirst('Antes de vaciar todo', function () { MAGNA.replace(MAGNA.clone(MAGNA.EMPTY)); render(); banner(); }); }); }, 'd')); b.appendChild(z);
  }

  return { dataV: dataV };
});
