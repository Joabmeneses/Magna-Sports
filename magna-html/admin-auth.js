'use strict';
// Acceso al panel: solo administradores (correo registrado en la tabla admins de Supabase).
(function () {
  var h = M.h, root = document.querySelector('.adm'), gate = h('div', 'gate');
  document.body.insertBefore(gate, root); root.hidden = true;
  function card(title, sub) { gate.innerHTML = ''; var c = h('div', 'gcard'), lg = h('img', 'glogo'); lg.src = 'logo.png'; lg.alt = 'Magna Arena'; c.appendChild(lg); c.appendChild(h('div', 'eb mono', 'Panel de administración')); c.appendChild(h('h1', 'x', title)); if (sub) c.appendChild(h('p', 'sub', sub)); gate.appendChild(c); return c; }
  function field(c, label, type, ph) { var l = h('label', 'f', label), i = h('input', 'in'); i.type = type; if (ph) i.placeholder = ph; i.autocomplete = type === 'password' ? 'current-password' : 'email'; l.appendChild(i); c.appendChild(l); return i; }
  function msg(c) { var m = h('p', 'gm'); c.appendChild(m); return function (t, ok) { m.textContent = t || ''; m.className = 'gm' + (ok ? ' ok' : ''); }; }
  var sb = null;
  function codeView() {
    var c = card('Entrar', 'Usa el usuario y el código de 6 dígitos que te dio la administración.'), f = h('form'); c.appendChild(f);
    var us = field(f, 'Usuario', 'text', 'tu usuario'); us.autocomplete = 'username'; us.autocapitalize = 'none'; us.spellcheck = false;
    var cd = field(f, 'Código de 6 dígitos', 'password', '••••••'); cd.inputMode = 'numeric'; cd.maxLength = 6; cd.autocomplete = 'one-time-code';
    var say = msg(f), go = h('button', 'b o gbtn', 'Entrar'); go.type = 'submit'; f.appendChild(go);
    f.onsubmit = function (e) { e.preventDefault(); var u = us.value.trim().toLowerCase(), k = cd.value.replace(/\D/g, '');
      if (u.length < 3) return say('Escribe tu usuario.'); if (k.length !== 6) return say('El código tiene 6 dígitos.');
      go.disabled = true; say('Entrando…', true);
      ACCOUNTS.login(u, k).then(function () { go.disabled = false; check(); }, function (er) { go.disabled = false; say(er.message || 'No se pudo entrar.'); }); };
    var tc = h('p', 'sub'); tc.style.cssText = 'font-size:13px;margin-top:12px'; tc.innerHTML = 'Al entrar aceptas los <a href="terminos.html">términos y condiciones</a>.'; c.appendChild(tc);
    var lk = h('div', 'glinks'), a = h('button', 'lnk', 'Entrar con correo (administrador principal)'); a.type = 'button'; a.onclick = function () { loginView('login'); }; lk.appendChild(a); c.appendChild(lk); us.focus();
  }
  function loginView(mode) {
    var c = card(mode === 'signup' ? 'Crear tu acceso' : mode === 'reset' ? 'Recuperar acceso' : 'Entrar',
      mode === 'signup' ? 'Solo funciona con un correo autorizado como administrador. Te llegará un correo para confirmarlo.' : mode === 'reset' ? 'Te enviaremos un enlace para crear una contraseña nueva.' : 'Solo los administradores de Magna Sports pueden entrar.');
    var f = h('form'); c.appendChild(f); var em = field(f, 'Correo', 'email', 'tu@correo.com'), pw = mode === 'reset' ? null : field(f, mode === 'signup' ? 'Crea una contraseña (mínimo 8 caracteres)' : 'Contraseña', 'password');
    if (pw && mode === 'signup') pw.autocomplete = 'new-password';
    var say = msg(f), go = h('button', 'b o gbtn', mode === 'signup' ? 'Crear acceso' : mode === 'reset' ? 'Enviar enlace' : 'Entrar'); go.type = 'submit'; f.appendChild(go);
    f.onsubmit = function (e) { e.preventDefault(); var mail = em.value.trim().toLowerCase(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) return say('Escribe un correo válido.');
      if (pw && pw.value.length < 8) return say('La contraseña debe tener al menos 8 caracteres.');
      go.disabled = true; say('Un momento…', true); var back = location.origin + location.pathname;
      var q = mode === 'signup' ? sb.auth.signUp({ email: mail, password: pw.value, options: { emailRedirectTo: back } }) : mode === 'reset' ? sb.auth.resetPasswordForEmail(mail, { redirectTo: back }) : sb.auth.signInWithPassword({ email: mail, password: pw.value });
      q.then(function (r) { go.disabled = false; if (r.error) { var t = r.error.message || ''; return say(/invalid login/i.test(t) ? 'Correo o contraseña incorrectos.' : /not confirmed/i.test(t) ? 'Primero confirma tu correo con el enlace que te enviamos.' : /already registered/i.test(t) ? 'Ese correo ya tiene acceso. Usa "Entrar".' : 'No se pudo: ' + t); }
        if (mode === 'signup') return say('¡Listo! Revisa tu correo y toca el enlace de confirmación. Después vuelve aquí y entra.', true);
        if (mode === 'reset') return say('Te enviamos un enlace. Ábrelo desde este mismo dispositivo.', true);
        check(); }, function () { go.disabled = false; say('Sin conexión. Inténtalo de nuevo.'); }); };
    var lk = h('div', 'glinks');
    [['code', 'Entrar con usuario y código'], ['login', 'Ya tengo acceso'], ['signup', 'Es mi primera vez'], ['reset', 'Olvidé mi contraseña']].forEach(function (x) { if (x[0] === mode) return; var a = h('button', 'lnk', x[1]); a.type = 'button'; a.onclick = function () { x[0] === 'code' ? codeView() : loginView(x[0]); }; lk.appendChild(a); });
    c.appendChild(lk);
  }
  function newPassView() {
    var c = card('Nueva contraseña', 'Escribe tu contraseña nueva.'), f = h('form'); c.appendChild(f); var pw = field(f, 'Contraseña nueva (mínimo 8 caracteres)', 'password'); pw.autocomplete = 'new-password'; var say = msg(f), go = h('button', 'b o gbtn', 'Guardar'); go.type = 'submit'; f.appendChild(go);
    f.onsubmit = function (e) { e.preventDefault(); if (pw.value.length < 8) return say('Mínimo 8 caracteres.'); go.disabled = true; sb.auth.updateUser({ password: pw.value }).then(function (r) { go.disabled = false; if (r.error) return say('No se pudo: ' + r.error.message); check(); }); };
  }
  function start(session) {
    gate.remove(); root.hidden = false;
    var lastCrests = {}; MAGNA.S.teams.forEach(function (t) { if (t.crest) lastCrests[t.id] = t.crest; });
    // Control de versión: los coaches también guardan cambios (alineación, fichajes, ofertas). Si alguien guardó antes, no se pisa: se recargan sus datos.
    var lastRev = MAGNA.S.rev == null ? null : Number(MAGNA.S.rev);
    function pullRemote(why) { return sb.from('site_state').select('data').eq('id', 1).single().then(function (r) { if (r.error || !r.data) throw r.error || new Error('Sin datos');
      var d = r.data.data; lastRev = d.rev == null ? null : Number(d.rev); MAGNA.cloud.applyRemote(d); try { window.dispatchEvent(new CustomEvent('magna:update', { detail: { remote: true, why: why } })); } catch (e) {} return d; }); }
    sb.channel('magna-admin').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'site_state' }, function (p) {
      var d = p.new && p.new.data; if (!d || d.rev == null || Number(d.rev) === lastRev || MAGNA.cloud.dirty) return; if (lastRev != null && Number(d.rev) < lastRev) return;
      pullRemote('remote'); }).subscribe();
    MAGNA.cloud.setWriter(function (st) {
      var crests = {}; st.teams.forEach(function (t) { if (t.crest) crests[t.id] = t.crest; });
      var ups = Object.keys(crests).filter(function (k) { return crests[k] !== lastCrests[k]; }).map(function (k) { return { team_id: Number(k), img: crests[k] }; }),
        dels = Object.keys(lastCrests).filter(function (k) { return !crests[k]; }).map(Number), jobs = [];
      if (ups.length) jobs.push(sb.from('team_crests').upsert(ups));
      if (dels.length) jobs.push(sb.from('team_crests').delete().in('team_id', dels));
      (st.matches || []).forEach(function (m) { if (m.status === 'scheduled' || m.status === 'live') { try { m.pre = MAGNA.matchPreview(m).sd; } catch (e) {} } });
      try { var PSx = MAGNA.playerStats(); (st.players || []).forEach(function (p) { var x = PSx[p.id]; p.media = x && x.media != null ? x.media : 10; }); } catch (e) {}
      st.rev = (lastRev || 0) + 1;
      var up = sb.from('site_state').update({ data: MAGNA.cloud.strip(st) }).eq('id', 1); up = lastRev == null ? up.is('data->rev', null) : up.eq('data->>rev', String(lastRev));
      jobs.push(up.select('id'));
      return Promise.all(jobs).then(function (rs) { rs.forEach(function (r) { if (r.error) throw r.error; }); var last = rs[rs.length - 1];
        if (!last.data || !last.data.length) return pullRemote('conflict').then(function (d) { if (Number(d.rev || 0) === Number(st.rev - 1)) throw new Error('Sin permiso para guardar'); lastCrests = crests; try { window.dispatchEvent(new CustomEvent('magna:conflict')); } catch (e) {} });
        lastRev = st.rev; MAGNA.S.rev = st.rev; lastCrests = crests; });
    });
    window.MAGNA_ADMIN = { email: session.user.email, sb: sb, signOut: function () { MAGNA.cloud.flush(); setTimeout(function () { sb.auth.signOut().then(function () { location.reload(); }); }, 600); } };
    window.addEventListener('beforeunload', function (e) { if (MAGNA.cloud.dirty) { MAGNA.cloud.flush(); e.preventDefault(); e.returnValue = ''; } });
    var s = document.createElement('script'); s.src = 'admin.js'; document.body.appendChild(s);
  }
  function check() {
    sb.auth.getSession().then(function (r) { var ses = r.data && r.data.session;
      if (!ses || ses.user.is_anonymous) return codeView();
      sb.rpc('is_admin').then(function (x) { if (x.data === true) return start(ses);
        var who = (ses.user.user_metadata && ses.user.user_metadata.username) || ses.user.email, c = card('Esta cuenta no es de administrador', 'Entraste como ' + who + '. Tu cuenta sirve para apostar y ver tus Bits en Mi cuenta. El panel es solo para administradores.'); var mc = h('a', 'b o', 'Ir a Mi cuenta'); mc.href = 'cuenta.html'; mc.style.cssText = 'display:inline-block;text-decoration:none;margin-right:8px'; c.appendChild(mc); var b = h('button', 'b', 'Cerrar sesión'); b.onclick = function () { sb.auth.signOut().then(function () { loginView('login'); }); }; c.appendChild(b); });
    });
  }
  card('Conectando…', 'Un momento.');
  if (MAGNA.cloud.source !== 'cloud') { var c = card('Sin conexión', 'No se pudo conectar con la base de datos. Revisa tu internet y recarga la página.'); var b = h('button', 'b o', 'Reintentar'); b.onclick = function () { location.reload(); }; c.appendChild(b); return; }
  window.MAGNA_SB().then(function (client) { sb = client;
    sb.auth.onAuthStateChange(function (ev) { if (ev === 'PASSWORD_RECOVERY') newPassView(); });
    if (/type=recovery/.test(location.hash)) return; check();
  }, function () { var c = card('Sin conexión', 'No se pudo cargar el sistema de acceso. Recarga la página.'); var b = h('button', 'b o', 'Reintentar'); b.onclick = function () { location.reload(); }; c.appendChild(b); });
})();
