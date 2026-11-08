'use strict';
(function () {
  var h = M.h, S = function () { return MAGNA.S; }, by = MAGNA.by, view = document.getElementById('view'), tab = /^#(crear-noticia|noticias)$/.test(location.hash) ? 'noticias' : 'resumen';
  if (location.hash === '#crear-noticia') window.__newsOpenEditor = true;
  function toast(m, bad) { var box = document.getElementById('toasts'), t = h('div', 'ts' + (bad ? ' bad' : ''), m); while (box.children.length >= 2) box.firstChild.remove(); box.appendChild(t); setTimeout(function () { t.remove(); }, bad ? 4200 : 2600); }
  function commit(msg) { if (!MAGNA.save()) toast('No se pudo guardar en este navegador (¿modo privado?).', true); else if (msg) toast(msg); render(); banner(); if (window.ADMIN_EXCL) ADMIN_EXCL(); }
  function nk(s) { return String(s).normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase(); }
  function okName(s, min, max) { var t = String(s || '').normalize('NFKC').trim().replace(/\s+/g, ' '); return t.length >= min && t.length <= max && !/[<>\u0000-\u0008]/.test(t) ? t : null; }
  function table(cols, rows) { var w = h('div', 'pn tw'), tb = h('table'), th = h('tr'); cols.forEach(function (c) { th.appendChild(h('th', null, c)); }); tb.appendChild(th);
    if (!rows.length) { var e = h('tr'), td = h('td', null, 'Todavía no hay nada aquí.'); td.colSpan = cols.length; td.style.color = 'var(--muted)'; e.appendChild(td); tb.appendChild(e); }
    if (cols.length >= 3 && cols[cols.length - 1] === '') tb.className = 'rt';
    rows.forEach(function (r) { var tr = h('tr'); r.forEach(function (c, ci) { var td = h('td'); td.setAttribute('data-l', cols[ci] || ''); (Array.isArray(c) ? c : [c]).forEach(function (x) { td.appendChild(x && x.nodeType ? x : document.createTextNode(x == null ? '—' : x)); }); tr.appendChild(td); }); tb.appendChild(tr); }); w.appendChild(tb); return w; }
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
  // Puntos de ranking que cada equipo ya traía (de tus registros). Se suman a los que gane en el sitio.
  function basePtsDlg() {
    if (!S().teams.length) return toast('Primero registra equipos.', true);
    dialog('Puntos de ranking anteriores', function (b, close) {
      var PT = MAGNA.teamPoints();
      b.appendChild(h('p', 'sub', 'Escribe los puntos que cada equipo ya tenía según tus registros. Se suman a los que gane en el sitio (liga 15.000, Champions 35.000, Mundial 50.000, otros torneos 25.000, amistoso 5.000).'));
      var ins = {}, list = h('div', 'gift-list'); list.style.maxHeight = '380px';
      S().teams.forEach(function (t) { var r = h('label', 'gift-it'), tx = h('span'), won = (PT[t.id] || {}).pts - ((PT[t.id] || {}).base || 0); tx.appendChild(h('b', null, t.name)); tx.appendChild(h('small', null, 'Ganados en el sitio: ' + won.toLocaleString('es'))); r.appendChild(M.crest(t.id, t.name, 32)); r.appendChild(tx);
        var i = h('input', 'in'); i.type = 'number'; i.min = 0; i.step = 1000; i.value = t.basePts || ''; i.placeholder = '0'; i.style.cssText = 'margin:0 0 0 auto;width:150px;height:auto;flex:none'; r.appendChild(i); ins[t.id] = i; list.appendChild(r); });
      b.appendChild(list); var err = h('p', 'err'); b.appendChild(err);
      var rr = h('div', 'row'); rr.appendChild(btn('Cancelar', close)); rr.appendChild(btn('Guardar puntos', function () {
        var bad = S().teams.filter(function (t) { var v = ins[t.id].value.trim(); return v !== '' && !(Number.isInteger(Number(v)) && Number(v) >= 0 && Number(v) <= 1e9); });
        if (bad.length) return err.textContent = 'Revisa los puntos de ' + bad.map(function (t) { return t.name; }).join(', ') + ': deben ser números enteros desde 0.';
        S().teams.forEach(function (t) { var v = ins[t.id].value.trim(); if (v === '' || Number(v) === 0) delete t.basePts; else t.basePts = Number(v); });
        close(); commit('Puntos de ranking guardados'); }, 'o')); b.appendChild(rr);
    });
  }
  function teamsV(b) {
    var bar = h('div', 'bar2'); bar.appendChild(h('div', 'sp')); bar.appendChild(btn('Cargar puntos de ranking', basePtsDlg)); bar.appendChild(btn('+ Nuevo equipo', function () {
      if (formsApi()) return ADMIN_FORMS.team();
      ask('Nuevo equipo', [{ k: 'n', label: 'Nombre', maxlength: 30 }, { k: 'i', label: 'Descripción (opcional)', type: 'textarea' }, { k: 'f', label: 'Foto o escudo (opcional; se reduce sola)', type: 'file' }], function (v) {
        var n = okName(v.n, 2, 30); if (!n) return 'Nombre no válido (2 a 30 caracteres).'; if (S().teams.some(function (t) { return nk(t.name) === nk(n); })) return 'Ya existe un equipo con ese nombre.';
        return readImg(v.f).then(function (img) { var e = imgErr(img); if (e) return e;
          var t = { id: MAGNA.id(), name: n, info: (v.i || '').slice(0, 300), crest: img || null, budget: 0, coach: null }; S().teams.push(t); MAGNA.addNews('team_created', 'Nace un nuevo equipo: ' + n + '.'); commit('Equipo creado'); }); }, 'Crear');
    }, 'o')); b.appendChild(bar);
    b.appendChild(table(['Equipo', 'DT', 'Plantilla', 'Trofeos', 'Bits', ''], S().teams.map(function (t) { var c = by(S().players, t.coach), n = S().players.filter(function (p) { return p.teamId === t.id; }).length;
      return [[M.crest(t.id, t.name, 34), ' ', h('b', null, t.name)], c ? c.name : 'por asignar', n + '/4', String(MAGNA.teamTrophies(t.id).length), t.budget, [btn('Plantilla', function () { squadDlg(t.id); }), btn('Trofeos', function () { trophyDlg(t.id); }), btn('Página ↗', function () { window.open('equipo.html?id=' + t.id, '_blank'); }), btn('🖼️ Banner', function () { bannerDlg(t); }), btn('Editar', function () { editTeam(t); }), btn('Eliminar', function () { delTeam(t); }, 'd')]]; })));
  }
  // ---------- trofeos (palmarés) ----------
  function trophyDlg(tid) {
    var t = by(S().teams, tid), CATS = MAGNA.TROPHY_CATS, catName = function (k) { var c = CATS.filter(function (x) { return x[0] === k; })[0]; return c ? c[1] : 'Otro'; };
    dialog('Trofeos de ' + t.name, function (b) {
      var box = h('div'); b.appendChild(box);
      function draw() {
        box.innerHTML = ''; var list = t.trophies || [], all = MAGNA.teamTrophies(tid), SRC = { tournament: 'Automático · campeón del torneo', league: 'Automático · primero de la liga', history: 'Automático · historial' };
        box.appendChild(h('p', 'sub', all.length ? all.length + ' trofeo' + (all.length === 1 ? '' : 's') + ' · ' + CATS.map(function (c) { return c[1] + ': ' + all.filter(function (x) { return x.cat === c[0]; }).length; }).join(' · ') : 'Este equipo todavía no tiene trofeos.'));
        box.appendChild(h('p', 'hint', 'Los títulos se suman solos como trofeos: cuando un equipo es campeón de un torneo o del Mundial, termina primero en una liga finalizada o es campeón en el Historial. Aquí puedes añadir otros a mano.'));
        box.appendChild(table(['Trofeo', 'Categoría', 'Temporada', ''], all.map(function (x) { var man = x.id != null && list.some(function (y) { return y.id === x.id; }); return [h('b', null, (MAGNA.TROPHY_ICON[x.cat] || '🏆') + ' ' + x.name), catName(x.cat), x.season || '—', !man ? h('span', 'hint', x.auto ? SRC[x.auto] : '') : [btn('Quitar', function () { x = list.filter(function (y) { return y.id === x.id; })[0]; confirmBox('¿Quitar "' + x.name + '"?', 'Se borra del palmarés de ' + t.name + '.', 'Quitar', function () { t.trophies = list.filter(function (y) { return y !== x; }); MAGNA.save(); draw(); render(); }); }, 'd')]]; })));
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
  // ---------- banner animado del equipo (se guarda en Supabase Storage, carpeta team-banners) ----------
  function bannerDlg(t) {
    var TB = window.TEAM_BANNER; if (!TB) return toast('Falta team-banner.js', true);
    dialog('Banner de ' + t.name, function (b, close) {
      var st = { mode: t.bannerOff ? 'off' : t.banner ? 'img' : 'auto', file: null, url: t.banner || null, fx: t.bannerFx || 'brillo', pos: t.bannerPos || 'center', c: t.bannerC || MAGNA.teamColor(t.id) || '#8b5cf6' };
      var MODES = { auto: '✨ Automático: el nombre del equipo en estilo grafiti', img: '🖼️ Imagen propia (subir un diseño)', off: 'Sin banner' };
      var ms = h('select', 'in'); Object.keys(MODES).forEach(function (k) { var o = h('option', null, MODES[k]); o.value = k; ms.appendChild(o); }); ms.value = st.mode; var lm = h('label', 'f', 'Tipo de banner'); lm.appendChild(ms); b.appendChild(lm);
      var pv = h('div'); b.appendChild(pv);
      function prev() { pv.innerHTML = ''; fwrap.style.display = st.mode === 'img' ? '' : 'none'; opts.style.display = st.mode === 'off' ? 'none' : ''; l3.style.display = st.mode === 'img' ? '' : 'none';
        if (st.mode === 'off') { pv.appendChild(h('div', 'box', 'La portada del equipo se verá sin banner.')); return; }
        if (st.mode === 'img' && !st.url) { pv.appendChild(h('div', 'box', 'Elige una imagen para verla aquí.')); return; }
        var el = h('div', 'tbh-prev'), nm = h('div', 'tbh-pn'); nm.appendChild(M.crest(t.id, t.name, 56)); var tx = h('div'); tx.appendChild(h('b', null, t.name)); tx.appendChild(h('small', null, 'Así se verá la portada del equipo')); nm.appendChild(tx); el.appendChild(nm);
        TB.cover(el, { id: t.id, name: t.name, banner: st.mode === 'img' ? st.url : null, bannerFx: st.fx, bannerPos: st.pos, bannerC: st.c }); pv.appendChild(el); }
      var fwrap = h('div'), fi = h('input', 'in'); fi.type = 'file'; fi.accept = 'image/png,image/jpeg,image/webp'; var lf = h('label', 'f', 'Imagen (PNG, JPG o WEBP; se reduce sola)'); lf.appendChild(fi); fwrap.appendChild(lf); b.appendChild(fwrap);
      var opts = h('div'), two = h('div', 'two2'); opts.appendChild(two); b.appendChild(opts);
      var fs = h('select', 'in'); Object.keys(TB.FX).forEach(function (k) { var o = h('option', null, TB.FX[k]); o.value = k; fs.appendChild(o); }); fs.value = st.fx; var l1 = h('label', 'f', 'Animación'); l1.appendChild(fs); two.appendChild(l1);
      var co = h('input', 'in'); co.type = 'color'; co.value = /^#[0-9a-f]{6}$/i.test(st.c) ? st.c : '#8b5cf6'; co.style.height = '48px'; var l2 = h('label', 'f', 'Color'); l2.appendChild(co); two.appendChild(l2);
      var ft = h('select', 'in'); Object.keys(TB.POS).forEach(function (k) { var o = h('option', null, TB.POS[k]); o.value = k; ft.appendChild(o); }); ft.value = st.pos; var l3 = h('label', 'f', 'Encuadre de la imagen'); l3.appendChild(ft); opts.appendChild(l3);
      var err = h('p', 'err'); b.appendChild(err);
      ms.onchange = function () { st.mode = ms.value; prev(); }; ft.onchange = function () { st.pos = ft.value; prev(); };
      fi.onchange = function () { var f = fi.files && fi.files[0]; if (!f) return; err.textContent = 'Procesando…'; TB.shrink(f).then(function (r) { st.file = r; st.url = r.preview; st.c = r.color; co.value = r.color; err.textContent = ''; prev(); }, function (e) { err.textContent = e.message; }); };
      fs.onchange = function () { st.fx = fs.value; prev(); }; co.oninput = function () { st.c = co.value; prev(); }; prev();
      var r = h('div', 'row'); r.appendChild(btn('Cancelar', close));
      var sv = btn('Guardar', function () { err.textContent = '';
        function done(url, path) { var old = t.bannerPath;
          if (st.mode === 'off') t.bannerOff = true; else delete t.bannerOff;
          if (st.mode === 'img') { if (url) { t.banner = url; t.bannerPath = path; } } else { delete t.banner; delete t.bannerPath; }
          t.bannerFx = st.fx; t.bannerC = st.c; t.bannerPos = st.pos; delete t.bannerFit;
          if (old && (st.mode !== 'img' || path)) window.MAGNA_SB().then(function (c) { return c.storage.from('team-banners').remove([old]); }).catch(function () {});
          close(); commit(st.mode === 'off' ? 'Banner desactivado' : 'Banner guardado'); }
        if (st.mode !== 'img' || !st.file) { if (st.mode === 'img' && !t.banner) return err.textContent = 'Elige una imagen.'; return done(null, null); }
        if (!window.MAGNA_SB || MAGNA.cloud.source !== 'cloud') return err.textContent = 'Para subir imágenes necesitas estar conectado a la base de datos.';
        sv.disabled = true; sv.textContent = 'Subiendo…'; var path = 't' + t.id + '-' + Date.now() + '.webp';
        window.MAGNA_SB().then(function (c) { return c.storage.from('team-banners').upload(path, st.file.blob, { contentType: 'image/webp', cacheControl: '31536000', upsert: false }).then(function (res) { if (res && res.error) throw res.error; return c.storage.from('team-banners').getPublicUrl(path).data.publicUrl; }); })
          .then(function (url) { done(url, path); }, function (e) { sv.disabled = false; sv.textContent = 'Guardar'; err.textContent = 'No se pudo subir: ' + (e.message || e); });
      }, 'o'); r.appendChild(sv); b.appendChild(r);
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
        var cand = S().players.filter(function (p) { return MAGNA.canCoach(p) && (MAGNA.roleOf(p) === 'coach' || p.teamId === tid) && !S().teams.some(function (x) { return x.id !== tid && x.coach === p.id; }); });
        var dr = h('div', 'bar2'), ds = h('select', 'in'); ds.style.maxWidth = '320px'; var o0 = h('option', null, 'Sin DT'); o0.value = ''; ds.appendChild(o0);
        cand.forEach(function (p) { var o = h('option', null, p.name + ' · ' + MAGNA.roleName(p)); o.value = p.id; ds.appendChild(o); }); ds.value = t.coach || '';
        ds.onchange = function () { var id = ds.value ? Number(ds.value) : null, pp = by(S().players, id); t.coach = id; if (pp) MAGNA.addNews('coach', pp.name + ' es el nuevo DT de ' + t.name + '.'); MAGNA.save(); draw(); };
        var lb = h('label', 'f', 'DT del equipo (solo personas con rol "Solo coach" o "Coach y jugador" de este equipo)'); lb.appendChild(ds); dr.appendChild(lb); box.appendChild(dr);
        box.appendChild(table(['Jugador', 'Puesto', 'DT', ''], mem.map(function (p) { return [p.name, p.slot === 'starter' ? 'Titular' : 'Suplente', t.coach === p.id ? 'Sí' : '', [
          btn(p.slot === 'starter' ? 'A suplente' : 'A titular', function () { var o = mem.filter(function (x) { return x.slot === 'reserve' && x !== p; }).length; if (p.slot === 'starter') { if (o >= 1) return toast('Ya hay un suplente.', true); p.slot = 'reserve'; } else { if (st >= 3) return toast('Ya hay 3 titulares.', true); p.slot = 'starter'; } MAGNA.save(); draw(); }),
          btn(t.coach === p.id ? 'Quitar DT' : 'Hacer DT', function () { if (t.coach !== p.id && !MAGNA.canCoach(p)) return toast(p.name + ' tiene el rol "Jugador". Cámbialo a "Coach y jugador" en Jugadores para que pueda ser DT.', true); if (t.coach !== p.id && S().teams.some(function (x) { return x.coach === p.id; })) return toast('Ese jugador ya es DT de otro equipo.', true); t.coach = t.coach === p.id ? null : p.id; MAGNA.save(); draw(); }),
          btn('Retirar', function () { p.teamId = null; p.slot = null; if (t.coach === p.id) t.coach = null; MAGNA.addNews('transfer', p.name + ' deja ' + t.name + '.'); MAGNA.save(); draw(); }, 'd')]]; })));
        var free = S().players.filter(function (p) { return !p.teamId && MAGNA.plays(p); }), PSx = MAGNA.playerStats(), lvR = MAGNA.tierRank(t.level || 'plata');
        if (mem.length < 4 && free.length && !MAGNA.marketState().open) { var mc = h('div', 'mkt'); var mt = h('div'); mt.appendChild(h('span', 'mkt-s', '● Mercado cerrado')); mt.appendChild(h('p', 'hint', 'Para fichar jugadores, abre el mercado de fichajes.')); mc.appendChild(mt); var mb = h('div', 'mkt-b'); mb.appendChild(btn('Abrir mercado', function () { close(); closesDlg(true); }, 'o')); mc.appendChild(mb); box.appendChild(mc); }
        else if (mem.length < 4 && free.length) { box.appendChild(h('p', 'hint', 'Nivel de fichajes de ' + t.name + ': ' + MAGNA.TIERS[lvR][1] + '. Los jugadores de un nivel superior aparecen bloqueados.')); var sel = h('select', 'in'); free.forEach(function (p) { var md = (PSx[p.id] || {}).media, tr = MAGNA.tierOf(md), lock = md != null && tr.rank > lvR, o = h('option', null, p.name + ' · ' + (md == null ? 'sin media' : 'media ' + md + ' (' + tr.name + ')') + (lock ? ' 🔒' : '')); o.value = p.id; o.disabled = lock; sel.appendChild(o); }); var sl = h('select', 'in'); [['starter', 'Titular'], ['reserve', 'Suplente']].forEach(function (x) { var o = h('option', null, x[1]); o.value = x[0]; sl.appendChild(o); });
          var r = h('div', 'bar2'); r.appendChild(sel); r.appendChild(sl); r.appendChild(btn('Fichar', function () { var p = by(S().players, Number(sel.value)); if (!p) return toast('Elige un jugador disponible.', true); var md0 = (PSx[p.id] || {}).media; if (!MAGNA.marketState().open) return toast('El mercado de fichajes está cerrado.', true); if (md0 != null && MAGNA.tierOf(md0).rank > lvR) return toast('Ese jugador está por encima del nivel de fichajes del equipo.', true); if (sl.value === 'starter' && st >= 3) return toast('Ya hay 3 titulares.', true); if (sl.value === 'reserve' && mem.length - st >= 1) return toast('Ya hay un suplente.', true); p.teamId = tid; p.slot = sl.value; S().teams.forEach(function (x) { if (x.coach === p.id && x.id !== tid) x.coach = null; }); MAGNA.addNews('transfer', p.name + ' ficha por ' + t.name + '.'); MAGNA.save(); draw(); }, 'o')); box.appendChild(r); }
        else if (mem.length < 4) box.appendChild(h('p', 'sub', 'No hay jugadores libres. Crea jugadores en la pestaña Jugadores.'));
      }
      draw(); var r2 = h('div', 'row'); r2.appendChild(btn('Cerrar', function () { close(); render(); banner(); })); b.appendChild(r2);
    });
  }
  // ---------- jugadores ----------
  // ---------- jugadores y sus cuentas ----------
  var ACCS = null;
  function loadAccs(then) { ACCOUNTS.list().then(function (l) { ACCS = l; then && then(); }, function () { ACCS = ACCS || []; then && then(); }); }
  // ---------- regalar Bits (llega como notificación a la campanita) ----------
  function giftDlg(pre) {
    if (ACCS === null) return loadAccs(function () { giftDlg(pre); });
    if (!ACCS.length) return toast('Todavía no hay cuentas. Crea cuentas en Jugadores.', true);
    dialog('🎁 Regalar Bits', function (b, close) {
      b.appendChild(h('p', 'sub', 'Los Bits se suman al saldo de cada cuenta y le llega una notificación a su campanita al instante.'));
      var sel = {}; (pre || []).forEach(function (id) { sel[id] = 1; });
      var amt = h('input', 'in'); amt.type = 'number'; amt.min = 1; amt.max = 1000000; amt.value = 500; var la = h('label', 'f', 'Cantidad de Bits para cada cuenta'); la.appendChild(amt); b.appendChild(la);
      var qk = h('div', 'bar2'); [100, 500, 1000, 5000].forEach(function (n) { qk.appendChild(btn('+' + n.toLocaleString('es'), function () { amt.value = n; sum(); }, 'sm')); }); b.appendChild(qk);
      var msg = h('textarea', 'in'); msg.rows = 2; msg.maxLength = 280; msg.placeholder = 'Ej.: ¡Premio por ganar la Copa Verano!'; var lm = h('label', 'f', 'Mensaje (opcional, lo verá en la notificación)'); lm.appendChild(msg); b.appendChild(lm);
      b.appendChild(h('h4', null, 'Para quién'));
      var tools = h('div', 'bar2'), q = h('input', 'in'); q.placeholder = 'Buscar cuenta…'; q.style.maxWidth = '240px'; tools.appendChild(q);
      tools.appendChild(btn('Todos los miembros', function () { ACCS.forEach(function (a) { if (a.role === 'member') sel[a.id] = 1; }); draw(); }, 'sm')); tools.appendChild(btn('Quitar todos', function () { sel = {}; draw(); }, 'sm')); b.appendChild(tools);
      var list = h('div', 'gift-list'); b.appendChild(list); var info = h('p', 'hint'); b.appendChild(info); var err = h('p', 'err'); b.appendChild(err);
      function sum() { var n = Object.keys(sel).length, a = Math.floor(Number(amt.value) || 0); info.textContent = n ? n + (n === 1 ? ' cuenta' : ' cuentas') + ' · ' + (a * n).toLocaleString('es') + ' Bits en total' : 'Elige al menos una cuenta.'; go.textContent = n ? 'Regalar a ' + n + (n === 1 ? ' cuenta' : ' cuentas') : 'Regalar'; }
      function draw() { list.innerHTML = ''; var t = nk(q.value || '');
        ACCS.slice().sort(function (x, y) { return (x.display_name || '').localeCompare(y.display_name || ''); }).filter(function (a) { return !t || nk(a.display_name + ' ' + a.username).indexOf(t) >= 0; }).forEach(function (a) {
          var p = a.player_id && by(S().players, a.player_id), tm = p && by(S().teams, p.teamId), r = h('label', 'gift-it' + (sel[a.id] ? ' on' : '')), cb = h('input'); cb.type = 'checkbox'; cb.checked = !!sel[a.id];
          cb.onchange = function () { if (cb.checked) sel[a.id] = 1; else delete sel[a.id]; r.classList.toggle('on', cb.checked); sum(); };
          r.appendChild(cb); var tx = h('span'); tx.appendChild(h('b', null, a.display_name)); tx.appendChild(h('small', null, '@' + a.username + (a.role === 'admin' ? ' · admin' : '') + (tm ? ' · ' + tm.name : ''))); r.appendChild(tx); r.appendChild(h('span', 'gb', Number(a.bits || 0).toLocaleString('es') + ' Bits')); list.appendChild(r); }); sum(); }
      q.oninput = draw; amt.oninput = sum;
      var rr = h('div', 'row'); rr.appendChild(btn('Cancelar', close)); var go = btn('Regalar', function () {
        var ids = Object.keys(sel), a = Number(amt.value), m = msg.value.trim(); err.textContent = '';
        if (!ids.length) return err.textContent = 'Elige al menos una cuenta.'; if (!Number.isInteger(a) || a < 1 || a > 1000000) return err.textContent = 'La cantidad debe ser un número entero entre 1 y 1.000.000.'; if (/[<>]/.test(m)) return err.textContent = 'El mensaje no puede contener < ni >.';
        go.disabled = true; go.textContent = 'Regalando…';
        ACCOUNTS.gift(ids, a, m).then(function (n) { close(); toast('🎁 ' + a.toLocaleString('es') + ' Bits regalados a ' + n + (n === 1 ? ' cuenta' : ' cuentas')); MAGNA.addNews('gift', '🎁 La administración regaló ' + a.toLocaleString('es') + ' Bits' + (n > 1 ? ' a ' + n + ' miembros' : '') + '.'); commit(); loadAccs(function () { if (tab === 'jugadores') render(); }); },
          function (e) { go.disabled = false; sum(); err.textContent = 'No se pudo: ' + (e.message || e); }); }, 'o'); rr.appendChild(go); b.appendChild(rr);
      draw(); amt.focus();
    });
  }
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
    var iN = col(['nombre', 'jugador', 'name', 'nick', 'nombre en brawl stars']), iT = col(['equipo', 'team', 'club']), iS = col(['puesto', 'rol', 'titular', 'slot', 'posicion']), iW = col(['titulos', 'trofeos', 'torneos ganados', 'campeonatos', 'titles']), iR = col(['rol', 'role', 'tipo', 'cargo']);
    var body = rows; if (iN >= 0) body = rows.slice(1); else { iN = 0; iT = rows[0].length > 1 ? 1 : -1; iS = rows[0].length > 2 ? 2 : -1; iW = rows[0].length > 3 ? 3 : -1; }
    return body.map(function (r) { var sl = iS >= 0 ? nk(r[iS] || '') : ''; return { name: r[iN] || '', team: iT >= 0 ? (r[iT] || '') : '', slot: /supl|reserv|banca/.test(sl) ? 'reserve' : sl ? 'starter' : '', titles: iW >= 0 ? parseTitles(r[iW]) : [], kind: iR >= 0 ? parseRole(r[iR]) : 'player' }; }).filter(function (r) { return r.name; });
  }
  function parseRole(v) { v = nk(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, ''); var c = /coach|dt|entrenador|tecnico/.test(v), j = /jugador|player/.test(v); return c && j ? 'both' : c ? 'coach' : 'player'; }
  // "Copa Verano | Mundial 2025" → 2 títulos con nombre; "3" → 3 títulos sin nombre.
  function parseTitles(v) { v = String(v || '').trim(); if (!v || v === '0' || v === '-') return []; if (/^\d+$/.test(v)) { var n = Math.min(20, Number(v)), o = []; for (var i = 1; i <= n; i++) o.push('Título anterior ' + i); return o; }
    return v.split(/\s*[|/+]\s*/).map(function (t) { return okName(t, 2, 40); }).filter(Boolean).slice(0, 20); }
  function titlesDlg(p) {
    var pv = p.prevStats || {};
    ask('Historial de ' + p.name, [{ k: 't', label: 'Títulos anteriores: uno por línea (por ejemplo: Copa Verano 2025). Si dice "Mundial" cuenta como Mundial.', type: 'textarea', value: (p.prevTitles || []).join('\n') }, { k: 'm', label: 'MVP anteriores al sitio (total)', type: 'number', value: pv.mvp || 0, min: 0, max: 999 }, { k: 'g', label: 'Goles anteriores al sitio (total)', type: 'number', value: pv.g || 0, min: 0, max: 9999 }], function (v) {
      var m = Number(v.m) || 0, g = Number(v.g) || 0; if (m < 0 || g < 0 || m > 999 || g > 9999 || m % 1 || g % 1) return 'Escribe números enteros (0 o más).';
      var t = String(v.t || '').split('\n').map(function (x) { return okName(x, 2, 40); }).filter(Boolean).slice(0, 20); if (t.length) p.prevTitles = t; else delete p.prevTitles; if (m || g) p.prevStats = { mvp: m, g: g }; else delete p.prevStats; commit('Historial actualizado'); }, 'Guardar', 'Lo que ganó antes de usar el sitio. Los títulos suben el mínimo de su media: +10 por torneo o liga y +15 por Mundial (hasta 60). Los MVP y goles se suman a sus números e insignias: +10 por torneo o liga y +15 por Mundial (hasta 60).');
  }
  function importDlg() {
    dialog('Importar jugadores', function (b, close) {
      b.appendChild(h('p', 'sub', 'Copia las filas desde Excel o Google Sheets y pégalas aquí, o sube un archivo CSV. Columnas: Nombre (obligatoria); Equipo, Puesto (titular o suplente), Títulos y Rol (Jugador, Coach y jugador o Solo coach), opcionales. Un "Solo coach" con equipo queda como su DT; un "Coach y jugador" juega en ese equipo y también es su DT si no tiene uno. En Títulos pon los nombres separados por | (Copa Verano | Mundial 2025) o solo el número de torneos ganados. Cada jugador recibe su cuenta con 1.000 Bits y un código fijo.'));
      var ta = h('textarea', 'in'); ta.rows = 8; ta.placeholder = 'Nombre\tEquipo\tPuesto\tTítulos\nLeo\tGalaxy\tTitular\tCopa Verano | Mundial 2025\nAna\tRealty\tSuplente\t2'; b.appendChild(ta);
      var fi = h('input'); fi.type = 'file'; fi.accept = '.csv,.txt,.tsv'; fi.style.display = 'none'; b.appendChild(fi); fi.onchange = function () { var f = fi.files[0]; if (f) f.text().then(function (t) { ta.value = t; prev(); }); };
      var r0 = h('div', 'bar2'); r0.appendChild(btn('Subir archivo CSV', function () { fi.click(); })); b.appendChild(r0);
      var pv = h('div'); b.appendChild(pv); var err = h('p', 'err'); b.appendChild(err); var rows = [];
      function prev() { rows = parseRows(ta.value); pv.innerHTML = ''; if (!rows.length) return; var dup = 0, bad = 0;
        rows.forEach(function (r) { r.n = okName(r.name, 2, 24); r.exists = r.n && S().players.some(function (p) { return nk(p.name) === nk(r.n); }); r.t = r.team ? S().teams.filter(function (t) { return nk(t.name) === nk(r.team); })[0] : null; if (r.exists) dup++; if (!r.n) bad++; });
        pv.appendChild(h('p', 'hint', rows.length + ' filas · ' + (rows.length - dup - bad) + ' jugadores nuevos' + (dup ? ' · ' + dup + ' ya existen (no se duplican; solo se suman sus títulos)' : '') + (bad ? ' · ' + bad + ' nombres no válidos (se omiten)' : '')));
        pv.appendChild(table(['Nombre', 'Rol', 'Equipo', 'Puesto', 'Títulos', ''], rows.slice(0, 60).map(function (r) { return [r.n || r.name, (MAGNA.ROLES.filter(function (x) { return x[0] === r.kind; })[0] || MAGNA.ROLES[0])[1], r.team ? (r.t ? r.t.name : r.team + ' (no existe, queda libre)') : 'Agente libre', r.slot === 'reserve' ? 'Suplente' : r.slot ? 'Titular' : '—', r.titles.length ? r.titles.length + ' · ' + r.titles.join(', ') : '—', !r.n ? 'Nombre no válido' : r.exists ? (r.titles.length ? 'Ya existe: se suman sus títulos' : 'Ya existe') : 'Nuevo']; }))); }
      ta.addEventListener('input', function () { clearTimeout(ta._t); ta._t = setTimeout(prev, 250); });
      var rr = h('div', 'row'); rr.appendChild(btn('Cancelar', close)); var go = btn('Importar y crear cuentas', function () {
        var upd = 0; rows.forEach(function (r) { if (!r.exists || !r.titles.length) return; var p = S().players.filter(function (x) { return nk(x.name) === nk(r.n); })[0], cur = p.prevTitles || []; r.titles.forEach(function (t) { if (cur.map(nk).indexOf(nk(t)) < 0) cur.push(t); }); p.prevTitles = cur.slice(0, 20); upd++; });
        var todo = rows.filter(function (r) { return r.n && !r.exists; }); if (!todo.length) { if (upd) { commit('Títulos de ' + upd + ' jugadores actualizados'); MAGNA.cloud.flush(); close(); return; } err.textContent = 'No hay jugadores nuevos para importar.'; return; }
        go.disabled = true; var made = [];
        todo.forEach(function (r) { var p = { id: MAGNA.id(), name: r.n, teamId: null, slot: null }; if (r.titles.length) p.prevTitles = r.titles; if (r.kind !== 'player') p.kind = r.kind;
          if (r.kind === 'coach') { if (r.t && !r.t.coach) r.t.coach = p.id; S().players.push(p); made.push({ p: p, r: r }); return; }
          if (r.t) { var mem = S().players.filter(function (x) { return x.teamId === r.t.id; }), st = mem.filter(function (x) { return x.slot === 'starter'; }).length, rs = mem.length - st, want = r.slot || (st < 3 ? 'starter' : 'reserve');
            if (want === 'starter' && st < 3 || want === 'reserve' && rs < 1) { p.teamId = r.t.id; p.slot = want; } else if (st < 3) { p.teamId = r.t.id; p.slot = 'starter'; } else if (rs < 1) { p.teamId = r.t.id; p.slot = 'reserve'; } else r.full = true; }
          if (r.kind === 'both' && r.t && p.teamId === r.t.id && !r.t.coach) r.t.coach = p.id; S().players.push(p); made.push({ p: p, r: r }); });
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
  var PROLE = 'all';
  // Designar equipo desde la lista. Jugador: equipo y puesto. Coach y jugador: además puede ser DT de su propio equipo. Solo coach: equipo que dirige.
  function teamCtl(p) {
    var w = h('div'); w.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;align-items:center;min-width:220px';
    var role = MAGNA.roleOf(p), dt = S().teams.filter(function (t) { return t.coach === p.id; })[0];
    function sel(css) { var s = h('select', 'in'); s.style.cssText = 'margin:0;padding:6px 10px;' + (css || ''); return s; }
    if (role === 'coach') {
      var cs = sel('min-width:170px'), o0 = h('option', null, 'Sin equipo'); o0.value = ''; cs.appendChild(o0);
      S().teams.forEach(function (t) { var cur = by(S().players, t.coach), o = h('option', null, 'DT de ' + t.name + (cur && cur.id !== p.id ? ' (hoy: ' + cur.name + ')' : '')); o.value = t.id; cs.appendChild(o); }); cs.value = dt ? dt.id : '';
      cs.onchange = function () { var t = by(S().teams, Number(cs.value)) || null, prev = t && by(S().players, t.coach);
        function go() { S().teams.forEach(function (x) { if (x.coach === p.id) x.coach = null; }); if (t) { t.coach = p.id; MAGNA.addNews('coach', p.name + ' es el nuevo DT de ' + t.name + '.'); } commit(t ? p.name + ' dirige a ' + t.name : p.name + ' queda sin equipo'); }
        if (prev && prev.id !== p.id) { cs.value = dt ? dt.id : ''; confirmBox('¿Cambiar el DT de ' + t.name + '?', prev.name + ' deja de ser DT y ' + p.name + ' toma su lugar.', 'Cambiar DT', go); } else go(); };
      w.appendChild(cs); return w;
    }
    var ts = sel('min-width:150px'), of = h('option', null, 'Agente libre'); of.value = ''; ts.appendChild(of);
    S().teams.forEach(function (t) { var n = S().players.filter(function (x) { return x.teamId === t.id && x.id !== p.id; }).length, o = h('option', null, t.name + ' (' + (n + (p.teamId === t.id ? 1 : 0)) + '/4)'); o.value = t.id; o.disabled = n >= 4 && p.teamId !== t.id; ts.appendChild(o); }); ts.value = p.teamId || '';
    var ss = sel(); [['starter', 'Titular'], ['reserve', 'Suplente']].forEach(function (x) { var o = h('option', null, x[1]); o.value = x[0]; ss.appendChild(o); }); ss.value = p.slot || 'starter'; ss.hidden = !p.teamId;
    function slotsFree(tid) { var m = S().players.filter(function (x) { return x.teamId === tid && x.id !== p.id; }); return { st: 3 - m.filter(function (x) { return x.slot === 'starter'; }).length, rs: 1 - m.filter(function (x) { return x.slot === 'reserve'; }).length }; }
    ts.onchange = function () { var tid = ts.value ? Number(ts.value) : null, old = by(S().teams, p.teamId), nt = by(S().teams, tid);
      if (tid) { var fr = slotsFree(tid); if (fr.st <= 0 && fr.rs <= 0) { ts.value = p.teamId || ''; return toast(nt.name + ' ya tiene la plantilla completa.', true); } p.slot = fr.st > 0 ? 'starter' : 'reserve'; } else p.slot = null;
      p.teamId = tid; S().teams.forEach(function (x) { if (x.coach === p.id && x.id !== tid) x.coach = null; });
      MAGNA.addNews('transfer', nt ? p.name + ' pasa a ' + nt.name + '.' : p.name + (old ? ' deja ' + old.name : '') + ' y queda como agente libre.'); commit(nt ? p.name + ' ahora juega en ' + nt.name : p.name + ' es agente libre'); };
    ss.onchange = function () { var fr = slotsFree(p.teamId), want = ss.value; if (want === 'starter' && fr.st <= 0) { ss.value = p.slot; return toast('Ese equipo ya tiene 3 titulares.', true); } if (want === 'reserve' && fr.rs <= 0) { ss.value = p.slot; return toast('Ese equipo ya tiene suplente.', true); } p.slot = want; commit(p.name + ': ' + (want === 'starter' ? 'titular' : 'suplente')); };
    w.appendChild(ts); w.appendChild(ss);
    if (role === 'both' && p.teamId) { var team = by(S().teams, p.teamId), isDt = team && team.coach === p.id, db = btn(isDt ? '★ DT' : 'Hacer DT', function () {
        if (isDt) { team.coach = null; return commit(p.name + ' deja de ser DT'); }
        var prev = by(S().players, team.coach); function go() { team.coach = p.id; MAGNA.addNews('coach', p.name + ' es jugador y DT de ' + team.name + '.'); commit(p.name + ' es DT de ' + team.name); }
        if (prev) confirmBox('¿Cambiar el DT de ' + team.name + '?', prev.name + ' deja de ser DT y ' + p.name + ' juega y dirige el equipo.', 'Cambiar DT', go); else go(); }, isDt ? 'o' : ''); db.title = isDt ? 'Quitar como DT' : 'Jugador y DT de su equipo'; w.appendChild(db); }
    return w;
  }
  // rol como botones (más rápido que una lista): misma lógica y avisos que antes
  function roleSeg(p) { var w = h('div', 'pp-role'), cur = MAGNA.roleOf(p);
    MAGNA.ROLES.forEach(function (r) { var b = h('button', r[0] === cur ? 'on' : '', r[1]); b.type = 'button'; b.setAttribute('aria-pressed', r[0] === cur);
      b.onclick = function () { var k = r[0]; if (k === cur) return; var team = by(S().teams, p.teamId), dt = S().teams.filter(function (t) { return t.coach === p.id; })[0], warn = [];
        if (k === 'coach' && team) warn.push('Sale de la plantilla de ' + team.name + ' (los "Solo coach" no juegan).');
        if (k === 'player' && dt) warn.push('Deja de ser DT de ' + dt.name + ' (los "Jugador" no dirigen).');
        function apply() { p.kind = k; if (k === 'coach' && team) { p.teamId = null; p.slot = null; } if (k === 'player' && dt) dt.coach = null; MAGNA.addNews('role', p.name + ' ahora es ' + MAGNA.roleName(p) + '.'); commit('Rol actualizado: ' + MAGNA.roleName(p)); }
        if (warn.length) confirmBox('¿Cambiar el rol de ' + p.name + '?', warn.join(' '), 'Cambiar rol', apply); else apply(); }; w.appendChild(b); });
    return w; }
  var PQ = '', PSORT = 'media', PFLAG = '';
  var PICO = { copy: '<rect x="8" y="8" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" fill="none" stroke="currentColor" stroke-width="2"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="currentColor"/>',
    gift: '<rect x="3" y="9" width="18" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 13h18M12 9v12M12 9c-2-4-6-4-6-1.5S10 9 12 9c2 0 6 .5 6-1.5S14 5 12 9z" fill="none" stroke="currentColor" stroke-width="2"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16v4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    trophy: '<path d="M7 4h10v4a5 5 0 01-10 0V4zM7 6H4a3 3 0 003 4M17 6h3a3 3 0 01-3 4M12 13v4M8 21h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    user: '<circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6" fill="none" stroke="currentColor" stroke-width="2"/>',
    open: '<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' };
  function ibtn(ic, label, fn, cls) { var b = h('button', 'pp-ib ' + (cls || '')); b.type = 'button'; b.innerHTML = '<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">' + PICO[ic] + '</svg>'; if (label) b.appendChild(h('span', null, label)); b.title = label || ''; b.setAttribute('aria-label', label || ic); b.onclick = fn; return b; }
  function playersV(b) {
    var PS = MAGNA.playerStats(), all = S().players;
    // resumen arriba
    var sum = h('div', 'pp-sum'), withAcc = ACCS ? all.filter(function (p) { return accOf(p.id); }).length : null, free = all.filter(function (p) { return MAGNA.plays(p) && !p.teamId; }).length;
    [[all.length, 'Personas', '#8b5cf6'], [withAcc == null ? '…' : withAcc, 'Con cuenta', '#22d3ee'], [free, 'Agentes libres', '#ffd23f'], [S().teams.filter(function (t) { return t.coach; }).length + '/' + S().teams.length, 'Equipos con DT', '#2ee59d']].forEach(function (x) { var d = h('div'); d.style.setProperty('--c', x[2]); d.appendChild(h('b', null, String(x[0]))); d.appendChild(h('small', null, x[1])); sum.appendChild(d); });
    b.appendChild(sum);
    // barra: buscar, filtros y acciones
    var bar = h('div', 'pp-bar'), q = h('label', 'pp-q'); q.innerHTML = '<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 20l-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    var qi = h('input'); qi.type = 'search'; qi.placeholder = 'Buscar por nombre, usuario o equipo…'; qi.value = PQ; q.appendChild(qi); bar.appendChild(q);
    var so = h('select', 'pp-so'); [['media', 'Orden: media'], ['name', 'Orden: nombre'], ['id', 'Orden: ID'], ['team', 'Orden: equipo']].forEach(function (x) { var o = h('option', null, x[1]); o.value = x[0]; so.appendChild(o); }); so.value = PSORT; so.onchange = function () { PSORT = so.value; render(); }; bar.appendChild(so);
    var acts = h('div', 'pp-acts'); acts.appendChild(btn('🎁 Regalar Bits', function () { giftDlg(); })); acts.appendChild(btn('Importar', importDlg));
    acts.appendChild(btn('+ Nueva persona', function () {
      if (formsApi()) return ADMIN_FORMS.player();
      ask('Registrar persona', [{ k: 'n', label: 'Nombre en Brawl Stars', maxlength: 24 }, { k: 'k', label: 'Rol', type: 'select', value: 'player', options: MAGNA.ROLES }], function (v) { var n = okName(v.n, 2, 24); if (!n) return 'Nombre no válido (2 a 24 caracteres).'; if (S().players.some(function (p) { return nk(p.name) === nk(n); })) return 'Ya existe un jugador con ese nombre.';
        var p = { id: MAGNA.id(), name: n, teamId: null, slot: null }; if (v.k && v.k !== 'player') p.kind = v.k; S().players.push(p); commit('Jugador registrado'); MAGNA.cloud.flush(); setTimeout(function () { createAcc(p); }, 500); }, 'Registrar'); }, 'o'));
    bar.appendChild(acts); b.appendChild(bar);
    var cnt = function (f) { return all.filter(f).length; };
    var chips = h('div', 'pp-chips'), F = [['all', 'Todos', function () { return true; }]].concat(MAGNA.ROLES.map(function (r) { return [r[0], r[1], function (p) { return MAGNA.roleOf(p) === r[0]; }]; }));
    F.forEach(function (f) { var c = h('button', 'pp-ch' + (PROLE === f[0] ? ' on' : '')); c.type = 'button'; c.appendChild(document.createTextNode(f[1])); c.appendChild(h('small', null, String(cnt(f[2])))); c.onclick = function () { PROLE = f[0]; render(); }; chips.appendChild(c); });
    [['free', 'Sin equipo', function (p) { return MAGNA.plays(p) && !p.teamId; }], ['noacc', 'Sin cuenta', function (p) { return ACCS && !accOf(p.id); }]].forEach(function (f) { var c = h('button', 'pp-ch fl' + (PFLAG === f[0] ? ' on' : '')); c.type = 'button'; c.appendChild(document.createTextNode(f[1])); c.appendChild(h('small', null, String(cnt(f[2])))); c.onclick = function () { PFLAG = PFLAG === f[0] ? '' : f[0]; render(); }; chips.appendChild(c); });
    b.appendChild(chips);
    var hl = h('details', 'pp-help'); hl.appendChild(h('summary', null, '¿Cómo se calcula la media?')); hl.appendChild(h('p', null, 'Va de 10 a 100 y todos empiezan en 10. Sale de los partidos narrados en vivo: ganarle a un equipo fuerte suma mucho y perder con uno más débil resta mucho; la nota (1 a 10) de cada partido también sube o baja. Los títulos aseguran un mínimo: cada liga o torneo ganado sube el piso 10 puntos (el Mundial, 15), hasta 60.')); b.appendChild(hl);
    if (ACCS === null) { b.appendChild(M.skel(4)); loadAccs(function () { if (tab === 'jugadores') render(); }); }
    var L = all.filter(function (p) { return (PROLE === 'all' || MAGNA.roleOf(p) === PROLE) && (PFLAG !== 'free' || (MAGNA.plays(p) && !p.teamId)) && (PFLAG !== 'noacc' || (ACCS && !accOf(p.id))); });
    var SO = { media: function (a, c) { return ((PS[c.id] || {}).media || 0) - ((PS[a.id] || {}).media || 0); }, name: function (a, c) { return a.name.localeCompare(c.name); }, id: function (a, c) { return a.id - c.id; }, team: function (a, c) { return MAGNA.teamName(a.teamId || 0).localeCompare(MAGNA.teamName(c.teamId || 0)) || a.name.localeCompare(c.name); } };
    L.sort(SO[PSORT] || SO.media);
    var grid = h('div', 'pp-grid'), info = h('p', 'pp-inf'); b.appendChild(info); b.appendChild(grid);
    L.forEach(function (p, i) { grid.appendChild(pcard(p, PS[p.id] || {}, i)); });
    function filt() { var k = PQ.trim().toLowerCase(), n = 0; [].forEach.call(grid.children, function (c) { var ok = !k || c.dataset.k.indexOf(k) >= 0; c.hidden = !ok; if (ok) n++; }); info.textContent = n + (n === 1 ? ' persona' : ' personas') + (k ? ' para «' + PQ + '»' : ''); if (!n) { info.textContent = 'Nadie coincide con tu búsqueda o filtros.'; } }
    qi.oninput = function () { PQ = qi.value; filt(); }; filt();
  }
  // tarjeta de una persona
  function pcard(p, x, i) {
    var t = by(S().teams, p.teamId), dtOf = S().teams.filter(function (tm) { return tm.coach === p.id; })[0], tr = MAGNA.tierOf(x.media), a = accOf(p.id), role = MAGNA.roleOf(p);
    var c = h('article', 'pp-c'); c.style.setProperty('--tc', tr.color); c.style.animationDelay = Math.min(i, 12) * 30 + 'ms';
    c.dataset.k = (p.name + ' ' + (a ? a.username : '') + ' ' + (t ? t.name : '') + ' ' + (dtOf ? dtOf.name : '') + ' #' + p.id).toLowerCase();
    // cabecera
    var hd = h('div', 'pp-hd'); hd.appendChild(M.tierAv(p.name, x.media, 52, p.id));
    var nm = h('div', 'pp-nm'), nb = h('b', null, p.name); nm.appendChild(nb); var sub = h('small'); sub.appendChild(h('span', 'id', '#' + p.id)); sub.appendChild(document.createTextNode(' ' + (t ? t.name + (p.slot === 'reserve' ? ' · suplente' : ' · titular') : dtOf ? 'DT de ' + dtOf.name : role === 'coach' ? 'Sin equipo' : 'Agente libre'))); nm.appendChild(sub); hd.appendChild(nm);
    var md = h('div', 'pp-md'); md.appendChild(h('b', null, x.media == null ? '—' : String(x.media))); md.appendChild(h('small', null, tr.name)); hd.appendChild(md); c.appendChild(hd);
    // rol
    c.appendChild(h('div', 'pp-lb', 'Rol')); c.appendChild(roleSeg(p));
    // equipo
    c.appendChild(h('div', 'pp-lb', role === 'coach' ? 'Equipo que dirige' : 'Equipo y puesto')); var tc = teamCtl(p); tc.className = 'pp-team'; tc.removeAttribute('style'); c.appendChild(tc);
    // números
    var st = h('div', 'pp-st'); [[x.pj || 0, 'PJ'], [x.g || 0, 'Goles'], [x.mvp || 0, 'MVP'], [(x.titles || []).length, 'Títulos']].forEach(function (k) { var d = h('div'); d.appendChild(h('b', null, String(k[0]))); d.appendChild(h('small', null, k[1])); st.appendChild(d); }); c.appendChild(st);
    // cuenta
    var ac = h('div', 'pp-acc');
    if (a) { var u = h('div', 'pp-u'); u.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">' + PICO.user + '</svg>'; u.appendChild(h('code', null, a.username)); if (a.locked) u.appendChild(h('span', 'lk', 'Bloqueada')); ac.appendChild(u);
      var bits = h('button', 'pp-bits'); bits.type = 'button'; bits.title = 'Cambiar Bits'; if (window.MAGNA_BIT) bits.appendChild(MAGNA_BIT(16)); bits.appendChild(h('b', null, String(a.bits).replace(/\B(?=(\d{3})+(?!\d))/g, '.')));
      bits.onclick = function () { ask('Bits de ' + p.name, [{ k: 'b', label: 'Bits disponibles', type: 'number', value: a.bits, min: 0 }], function (v) { var n = Number(v.b); if (!Number.isInteger(n) || n < 0 || n > 1e8) return 'Cantidad no válida.'; return ACCOUNTS.setBits(a.id, n).then(function () { toast('Bits actualizados'); loadAccs(render); }, function (e) { return e.message; }); }); }; ac.appendChild(bits);
      var ib = h('div', 'pp-ibs'), cp = ibtn('copy', 'Copiar', function () { ACCOUNTS.copy('Magna Arena · Usuario: ' + a.username + ' · Código: ' + a.code, cp); cp.classList.add('ok'); setTimeout(function () { cp.classList.remove('ok'); }, 1400); });
      ib.appendChild(cp); ib.appendChild(ibtn('eye', 'Código', function () { showCode('Cuenta de ' + p.name, a); })); ib.appendChild(ibtn('gift', 'Regalar', function () { giftDlg([a.id]); }));
      if (a.locked) ib.appendChild(ibtn('user', 'Desbloquear', function () { ACCOUNTS.manage('unlock', { id: a.id }).then(function () { toast('Cuenta desbloqueada'); loadAccs(render); }, function (e) { toast(e.message, true); }); }, 'warn'));
      ac.appendChild(ib); }
    else if (ACCS !== null) { ac.classList.add('none'); ac.appendChild(h('span', 'pp-no', 'Sin cuenta todavía')); var cb = btn('Crear cuenta', function () { createAcc(p); }, 'o'); ac.appendChild(cb); }
    else ac.appendChild(h('span', 'pp-no', 'Cargando cuenta…'));
    c.appendChild(ac);
    // pie
    var ft = h('div', 'pp-ft'), hs = (p.prevTitles && p.prevTitles.length ? p.prevTitles.length : 0);
    ft.appendChild(ibtn('edit', 'Renombrar', function () { ask('Renombrar', [{ k: 'n', label: 'Nombre', value: p.name, maxlength: 24 }], function (v) { var n = okName(v.n, 2, 24); if (!n) return 'Nombre no válido.'; if (S().players.some(function (y) { return y.id !== p.id && nk(y.name) === nk(n); })) return 'Ya existe ese nombre.'; p.name = n; commit('Nombre actualizado'); }); }));
    ft.appendChild(ibtn('trophy', 'Historial' + (hs ? ' · ' + hs : ''), function () { titlesDlg(p); }));
    var pr = ibtn('open', '', function () { window.open(M.profileUrl(p.id), '_blank'); }); pr.title = 'Ver su perfil'; pr.setAttribute('aria-label', 'Ver el perfil de ' + p.name); ft.appendChild(pr);
    ft.appendChild(h('span', 'sp'));
    ft.appendChild(ibtn('trash', '', function () { confirmBox('¿Eliminar a ' + p.name + ' para siempre?', 'Se borran su ficha' + (a ? ', su cuenta (' + a.username + '), sus Bits y sus apuestas' : '') + '. No se puede deshacer.', 'Eliminar para siempre', function () {
      if (!a) return wipePlayer(p);
      ACCOUNTS.manage('delete', { id: a.id }).then(function () { loadAccs(); wipePlayer(p); }, function (e) { toast('No se pudo eliminar la cuenta: ' + e.message, true); }); }); }, 'del'));
    ft.lastChild.title = 'Eliminar para siempre'; ft.lastChild.setAttribute('aria-label', 'Eliminar a ' + p.name);
    c.appendChild(ft); return c;
  }
  // ---------- historial: torneos jugados antes del sitio ----------
  // Partidos: una línea por partido. "Galaxy 3-1 Realty", o columnas Local / Goles / Goles / Visitante (opcional Fecha al inicio).
  // ---------- Tienda de cosméticos e inventarios ----------
  var INV = null;
  // entrega automática de exclusivos: a cada cuenta con jugador que desbloqueó la insignia del cosmético
  var exT = null, exBusy = false;
  window.ADMIN_EXCL = function () { clearTimeout(exT); exT = setTimeout(function () { syncExcl(false); }, 2500); };
  setTimeout(function () { if (window.ADMIN_EXCL) ADMIN_EXCL(); }, 4000);
  // ---------- Eventos (eventos.html) ----------
  var EVK = { torneo: '🏆 Torneo', amistoso: '🤝 Amistosos', especial: '🎉 Especial', stream: '📺 Transmisión', premio: '🥇 Premiación', comunidad: '🗣️ Comunidad' }, EVC = null;
  // ---------- predicción de la llave: tabla y premios en Bits ----------
  function evRpc(n, a) { return window.MAGNA_SB().then(function (c) { return c.rpc(n, a); }).then(function (r) { if (r && r.error) throw r.error; return r.data; }); }
  // ---------- Balón de Oro: registro manual + votación de la comunidad ----------
  // ---------- competiciones ----------
  var ST = { draft: 'Borrador', active: 'Activa', paused: 'Pausada', finished: 'Finalizada' }, NEXT = { draft: [['active', 'Activar']], active: [['paused', 'Pausar'], ['finished', 'Finalizar']], paused: [['active', 'Reanudar'], ['finished', 'Finalizar']], finished: [] };
  // ---------- torneos: asistente de creación y panel paso a paso ----------
  var TF = {
    champions: { i: '⭐', n: 'Champions', d: 'Liga de ida y vuelta con todos, luego play-off y eliminatoria a partido único.', p: 'champions.html', min: 3 },
    groups_knockout: { i: '🌍', n: 'Mundial', d: 'Fase de grupos y después eliminatoria con los mejores de cada grupo.', p: 'mundial.html', min: 2 },
    knockout: { i: '⚔️', n: 'Eliminatoria directa', d: 'Cuadro de cruces: quien pierde queda fuera.', p: 'competiciones.html', min: 2 },
    round_robin: { i: '🔁', n: 'Todos contra todos', d: 'Una sola vuelta. Gana quien más puntos sume.', p: 'competiciones.html', min: 2 }
  };
  (function () { var st = document.createElement('style'); st.textContent =
    '.tf-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:6px 0 4px}' +
    '.tf-card{text-align:left;border:1px solid var(--line);background:rgba(255,255,255,.03);color:var(--fg);border-radius:16px;padding:14px;cursor:pointer;display:grid;gap:4px;font:inherit;transition:border-color .2s,background-color .2s}' +
    '.tf-card b{font-size:15px}.tf-card span{color:var(--muted);font-size:13px;line-height:1.35}.tf-card em{font-style:normal;font-size:22px}' +
    '.tf-card.on{border-color:var(--orange);background:rgba(255,90,54,.12);box-shadow:0 0 0 1px var(--orange)}' +
    '.tf-plan{border-radius:14px;padding:12px 14px;background:rgba(59,75,255,.13);border:1px solid rgba(59,75,255,.45);font-size:14px;line-height:1.45;margin:12px 0}.tf-plan.bad{background:rgba(255,77,94,.1);border-color:rgba(255,77,94,.45)}' +
    '.tf-sec{font:700 12px "JetBrains Mono",monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin:18px 0 8px;display:flex;gap:8px;align-items:center;flex-wrap:wrap}.tf-sec .sp{flex:1}' +
    '.tf-steps{display:flex;gap:6px;flex-wrap:wrap;margin:12px 0}.tf-steps span{padding:6px 12px;border-radius:999px;border:1px solid var(--line);font-size:12px;color:var(--muted)}.tf-steps span.ok{color:var(--green);border-color:rgba(46,229,157,.5)}.tf-steps span.on{background:var(--orange);border-color:var(--orange);color:#fff;font-weight:700}' +
    '.tf-next{border:1px solid var(--line);border-radius:18px;padding:16px;background:linear-gradient(135deg,rgba(255,90,54,.14),rgba(139,92,246,.12));margin:6px 0 14px;display:grid;gap:10px}.tf-next h4{margin:0;font-size:18px}.tf-next p{margin:0;color:var(--muted);font-size:14px;line-height:1.45}.tf-next .bar2{margin:0}' +
    '.tf-pg{height:8px;border-radius:9px;background:rgba(255,255,255,.08);overflow:hidden}.tf-pg i{display:block;height:100%;background:linear-gradient(90deg,var(--orange),var(--yellow))}' +
    '.tf-more{margin-top:18px;border-top:1px solid var(--line);padding-top:12px}.tf-more summary{cursor:pointer;color:var(--muted);font-size:14px}.tf-more .bar2{margin-top:10px}' +
    '.tf-head{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.tf-badge{border-radius:999px;padding:5px 12px;font-size:12px;font-weight:700;background:rgba(255,255,255,.08)}.tf-head a{margin-left:auto;color:var(--yellow);font-size:14px;font-weight:700}' +
    '.tf-two{display:grid;grid-template-columns:1fr 1fr;gap:10px}@media(max-width:600px){.tf-grid,.tf-two{grid-template-columns:1fr}}';
    document.head.appendChild(st); })();
  // Qué se va a generar con ese formato y esa cantidad de equipos.
  // Ediciones: mismo nombre = mismo torneo. Numera las anteriores si aún no tenían número.
  // ---------- generación de cruces ----------
  function rr(ids) { var l = ids.slice(); if (l.length % 2) l.push(null); var n = l.length, out = []; for (var r = 0; r < n - 1; r++) { var ps = []; for (var i = 0; i < n / 2; i++) { var a = l[i], b = l[n - 1 - i]; if (a != null && b != null) ps.push(r % 2 ? [b, a] : [a, b]); } out.push(ps); l.splice(1, 0, l.pop()); } return out; }
  // ---------- partidos ----------
  var MF = '';
  // ---------- propuestas de amistoso de los DT ----------
  function pendingReqs() { return (S().friendlyReqs || []).filter(function (r) { return r.status === 'pending'; }); }
  function notifyTeams(ids, title, body) { try { var sb = window.MAGNA_ADMIN && MAGNA_ADMIN.sb; if (sb) sb.rpc('admin_notify_teams', { p_teams: ids, p_title: title, p_body: body }).then(function () {}, function () {}); } catch (e) {} }
  function reqCard(b) {
    var P = pendingReqs(); if (!P.length) return;
    var box = h('div', 'frq'); box.appendChild(h('h2', 'x', 'Propuestas de amistoso (' + P.length + ')')); box.appendChild(h('p', 'hint', 'Las envían los DT desde "Mi equipo". Al aprobar se programa el partido como amistoso (5.000 pts para ambos) y se avisa a los dos DT.'));
    P.forEach(function (r) { var row = h('div', 'frq-r'), tx = h('div'), dt = by(S().players, r.by);
      tx.appendChild(h('b', null, MAGNA.teamName(r.from) + ' vs ' + MAGNA.teamName(r.rival)));
      tx.appendChild(h('small', null, 'Propone ' + (dt ? dt.name : 'el DT de ' + MAGNA.teamName(r.from)) + ' · ' + (r.at ? 'para el ' + fdate(r.at) : 'sin fecha') + (r.created ? ' · enviada ' + fdate(r.created) : '')));
      if (r.note) tx.appendChild(h('p', 'frq-n', '“' + r.note + '”'));
      row.appendChild(tx); var ac = h('div', 'frq-a');
      ac.appendChild(btn('Aprobar', function () { ask('Aprobar amistoso', [{ k: 'a', label: 'Fecha y hora (hora de ' + ((window.MAGNA_TZ && MAGNA_TZ.label) || 'tu zona') + ')', type: 'datetime-local', value: toLocal(r.at) }, { k: 'r', label: 'Ronda / nombre (opcional)', value: 'Amistoso' }], function (v) {
        if (!by(S().teams, r.from) || !by(S().teams, r.rival)) return 'Uno de los equipos ya no existe.';
        var at = toUtc(v.a); if (at === undefined) return 'Fecha no válida.'; var round = (v.r || '').trim() || 'Amistoso', ce = conflict({ id: 0, type: 'friendly', cid: 0 }, at, r.from, r.rival, round); if (ce) return ce;
        var id = MAGNA.id(); S().matches.push({ id: id, type: 'friendly', cid: 0, round: round, home: r.from, away: r.rival, at: at, status: 'scheduled', hs: null, as: null, sets: [] });
        r.status = 'approved'; r.match = id; r.done = MAGNA.now(); MAGNA.addNews('friendly', 'Amistoso programado: ' + MAGNA.teamName(r.from) + ' vs ' + MAGNA.teamName(r.rival) + (at ? ' (' + fdate(at) + ')' : '') + '.');
        commit('Amistoso aprobado y programado'); notifyTeams([r.from, r.rival], 'Amistoso aprobado', MAGNA.teamName(r.from) + ' vs ' + MAGNA.teamName(r.rival) + (at ? ' · ' + fdate(at) : ' · fecha por confirmar') + '.'); }, 'Aprobar y programar', 'Puedes ajustar la fecha antes de programarlo.'); }, 'o'));
      ac.appendChild(btn('Rechazar', function () { ask('Rechazar propuesta', [{ k: 'm', label: 'Motivo (opcional, lo verá el DT)', type: 'textarea', maxlength: 200 }], function (v) { var m = (v.m || '').replace(/[<>]/g, '').trim().slice(0, 200);
        r.status = 'rejected'; r.reason = m || null; r.done = MAGNA.now(); commit('Propuesta rechazada'); notifyTeams([r.from], 'Amistoso rechazado', 'Tu propuesta contra ' + MAGNA.teamName(r.rival) + ' no fue aprobada' + (m ? ': ' + m : '.')); }, 'Rechazar'); }, 'd'));
      row.appendChild(ac); box.appendChild(row); });
    b.appendChild(box);
  }
  (function () { var st = document.createElement('style'); st.textContent = '.frq{border:1px solid rgba(255,210,63,.45);background:linear-gradient(135deg,rgba(255,210,63,.12),rgba(255,90,54,.08));border-radius:22px;padding:16px 18px;margin:0 0 18px}.frq h2{margin:0 0 4px}.frq-r{display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;padding:12px 0;border-top:1px solid var(--line)}.frq-r>div:first-child{min-width:0;flex:1 1 240px}.frq-r b{display:block;font-size:16px}.frq-r small{color:var(--muted);font-size:13px}.frq-n{margin:6px 0 0;font-style:italic;color:#d9dcf0;font-size:14px}.frq-a{display:flex;gap:8px;flex-wrap:wrap}'; document.head.appendChild(st); })();
  function matchesV(b) {
    reqCard(b);
    var comps = S().leagues.map(function (c) { return ['league:' + c.id, 'Liga · ' + c.name]; }).concat(S().tournaments.map(function (c) { return ['tournament:' + c.id, 'Torneo · ' + c.name]; })).concat([['friendly:0', 'Amistosos']]);
    var bar = h('div', 'bar2'), sel = h('select', 'in'); sel.style.maxWidth = '320px'; [['', 'Todas las competiciones']].concat(comps).forEach(function (o) { var op = h('option', null, o[1]); op.value = o[0]; if (o[0] === MF) op.selected = true; sel.appendChild(op); }); sel.onchange = function () { MF = sel.value; render(); };
    bar.appendChild(sel); bar.appendChild(h('div', 'sp')); bar.appendChild(btn('+ Programar partido', function () { matchDlg(null); }, 'o')); b.appendChild(bar);
    var ms = S().matches.filter(function (m) { return !MF || (m.type + ':' + m.cid) === MF; }).sort(function (a, c) { return String(a.at || '9').localeCompare(String(c.at || '9')); });
    b.appendChild(table(['Competición', 'Ronda', 'Partido', 'Fecha', 'Estado', ''], ms.map(function (m) { var c = MAGNA.compOf(m);
      return [c ? c.name : '—', m.round, MAGNA.teamName(m.home) + ' vs ' + MAGNA.teamName(m.away), m.at ? new Date(m.at.replace(' ', 'T') + 'Z').toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Sin fecha',
        m.status === 'finished' ? m.hs + ' - ' + m.as : m.status === 'live' ? 'En vivo' : m.status === 'cancelled' ? 'Cancelado' : 'Programado',
        m.status === 'cancelled' ? [] : [btn('Resultado', function () { resultDlg(m); }), btn('Fecha', function () { matchDlg(m); }), btn('Sets' + (m.sets && m.sets.length ? ' (' + m.sets.length + ')' : ''), function () { setsDlg(m); }), m.status === 'finished' ? btn('📸 Imagen', function () { shareDlg(m); }) : '', (m.status !== 'finished' || m.live) ? btn(m.status === 'live' ? '● Consola en vivo' : m.status === 'scheduled' ? '▶ En vivo' : 'Minuto a minuto', function () { LIVE = m.id; go('vivo'); }, m.status === 'live' ? 'o' : '') : '', btn('Cancelar', function () { confirmBox('¿Cancelar el partido?', MAGNA.teamName(m.home) + ' vs ' + MAGNA.teamName(m.away), 'Cancelar partido', function () { m.status = 'cancelled'; commit('Partido cancelado'); }); }, 'd')]]; })));
  }
  function conflict(m, at, home, away, round) {
    if (at) { var t0 = new Date(at.replace(' ', 'T') + 'Z').getTime(); var c = S().matches.filter(function (x) { return x.id !== m.id && x.status !== 'cancelled' && x.at && [home, away].some(function (t) { return x.home === t || x.away === t; }) && Math.abs(new Date(x.at.replace(' ', 'T') + 'Z').getTime() - t0) < 60 * 60000; })[0];
      if (c) return 'Choque de horario: ' + MAGNA.teamName(c.home) + ' vs ' + MAGNA.teamName(c.away) + ' juega a una hora de diferencia.'; }
    if (S().matches.some(function (x) { return x.id !== m.id && x.status !== 'cancelled' && x.type === m.type && x.cid === m.cid && x.round === round && x.home === home && x.away === away; })) return 'Ese partido ya existe en esa ronda.';
    return null;
  }
  // ---------- sets: cuántos se juegan y con qué modo y mapa ----------
  function setsEditor(init) {
    var w = h('div', 'sets-ed'), sets = (init || []).map(function (x) { return { mode: x.mode || '', map: x.map || '', w: x.w || null }; }); if (!sets.length) sets = [{ mode: '', map: '' }, { mode: '', map: '' }, { mode: '', map: '' }];
    var top = h('div', 'sets-top'), cnt = h('select', 'in'); for (var i = 1; i <= 7; i++) { var o = h('option', null, i + (i === 1 ? ' set' : ' sets') + (i % 2 ? ' (al mejor de ' + i + ')' : '')); o.value = i; cnt.appendChild(o); } cnt.value = sets.length;
    var lb = h('label', 'f', 'Número de sets'); lb.appendChild(cnt); top.appendChild(lb);
    var rnd = btn('🎲 Sortear modos y mapas', function () { sets.forEach(function (x) { if (x.w) return; var md = MAGNA.MODES[Math.floor(Math.random() * MAGNA.MODES.length)], mp = MAGNA.MAPS[md]; x.mode = md; x.map = mp[Math.floor(Math.random() * mp.length)]; }); draw(); }, 'sm'); top.appendChild(rnd); w.appendChild(top);
    var list = h('div', 'sets-list'); w.appendChild(list);
    cnt.onchange = function () { var n = Number(cnt.value); while (sets.length < n) sets.push({ mode: '', map: '' }); sets = sets.slice(0, n); draw(); };
    function draw() { list.innerHTML = ''; sets.forEach(function (x, i) {
      var r = h('div', 'set-row'); r.style.setProperty('--mc', MAGNA.MODE_COLOR[x.mode] || 'var(--line)'); r.appendChild(h('b', 'sn', 'Set ' + (i + 1)));
      var ms = h('select', 'in'), o0 = h('option', null, 'Modo por definir'); o0.value = ''; ms.appendChild(o0); MAGNA.MODES.forEach(function (md) { var o = h('option', null, md); o.value = md; ms.appendChild(o); }); ms.value = x.mode;
      var mp = h('select', 'in'); function maps() { mp.innerHTML = ''; var o1 = h('option', null, x.mode ? 'Mapa por definir' : '—'); o1.value = ''; mp.appendChild(o1); (MAGNA.MAPS[x.mode] || []).forEach(function (n) { var o = h('option', null, n); o.value = n; mp.appendChild(o); }); mp.value = x.map; mp.disabled = !x.mode; }
      maps(); ms.onchange = function () { x.mode = ms.value; x.map = ''; r.style.setProperty('--mc', MAGNA.MODE_COLOR[x.mode] || 'var(--line)'); maps(); }; mp.onchange = function () { x.map = mp.value; };
      if (x.w) { ms.disabled = mp.disabled = true; } r.appendChild(ms); r.appendChild(mp); if (x.w) r.appendChild(h('span', 'hint', 'Jugado')); list.appendChild(r); }); }
    draw();
    return { el: w, get: function () { return sets.map(function (x) { var o = { mode: x.mode || null, map: x.map || null }; if (x.w) o.w = x.w; return o; }); } };
  }
  function setsDlg(m) {
    dialog('Sets: ' + MAGNA.teamName(m.home) + ' vs ' + MAGNA.teamName(m.away), function (b, close) {
      b.appendChild(h('p', 'sub', 'Elige cuántos sets se juegan y el modo y mapa de cada uno. Se ve en el sitio y en la consola en vivo.'));
      var ed = setsEditor(m.sets); b.appendChild(ed.el);
      var r = h('div', 'row'); r.appendChild(btn('Cancelar', close)); r.appendChild(btn('Guardar', function () { m.sets = ed.get(); close(); commit('Sets guardados'); }, 'o')); b.appendChild(r);
    });
  }
  function formsApi() { if (!window.ADMIN_FORMS) return false; ADMIN_FORMS.init({ toast: toast, commit: commit, conflict: conflict, toUtc: toUtc, okName: okName, nk: nk, readImg: readImg, imgErr: imgErr, createAcc: createAcc }); return true; }
  function matchDlg(m) {
    if (m) return ask('Reprogramar partido', [{ k: 'a', label: 'Fecha y hora (hora de ' + ((window.MAGNA_TZ && MAGNA_TZ.label) || 'tu zona') + ')', type: 'datetime-local', value: toLocal(m.at) }, { k: 'r', label: 'Ronda / jornada', value: m.round || '' }], function (v) { var at = toUtc(v.a); if (at === undefined) return 'Fecha no válida.'; var e = conflict(m, at, m.home, m.away, v.r.trim()); if (e) return e; m.at = at; m.round = v.r.trim(); commit('Partido actualizado'); });
    var comps = S().leagues.filter(function (c) { return c.status !== 'finished' && c.teamIds.length >= 2; }).map(function (c) { return ['league:' + c.id, 'Liga · ' + c.name]; }).concat(S().tournaments.filter(function (c) { return c.status !== 'finished' && c.teamIds.length >= 2; }).map(function (c) { return ['tournament:' + c.id, 'Torneo · ' + c.name]; }));
    if (S().teams.length >= 2) comps.push(['friendly:0', 'Amistoso (cualquier equipo · 5.000 pts para ambos)']);
    if (!comps.length) return toast('Necesitas al menos 2 equipos registrados.', true);
    if (formsApi()) return ADMIN_FORMS.match();
    dialog('Programar partido', function (b, close) {
      var cs = h('select', 'in'), hs = h('select', 'in'), as = h('select', 'in'), at = h('input', 'in'), rd = h('input', 'in'), err = h('p', 'err'); at.type = 'datetime-local'; rd.maxLength = 40; rd.placeholder = 'Jornada 1';
      comps.forEach(function (o) { var op = h('option', null, o[1]); op.value = o[0]; cs.appendChild(op); });
      function fill() { var p = cs.value.split(':'), c = p[0] === 'friendly' ? { teamIds: S().teams.map(function (t) { return t.id; }) } : by(p[0] === 'league' ? S().leagues : S().tournaments, Number(p[1])); [hs, as].forEach(function (s, k) { s.innerHTML = ''; c.teamIds.forEach(function (t, i) { var op = h('option', null, MAGNA.teamName(t)); op.value = t; if (i === k) op.selected = true; s.appendChild(op); }); }); } cs.onchange = fill; fill();
      var f = h('form'); [['Competición', cs], ['Local', hs], ['Visitante', as], ['Fecha y hora (hora de ' + ((window.MAGNA_TZ && MAGNA_TZ.label) || 'tu zona') + ')', at], ['Ronda / jornada', rd]].forEach(function (x) { var l = h('label', 'f', x[0]); l.appendChild(x[1]); f.appendChild(l); });
      f.appendChild(h('h4', null, 'Sets, modos y mapas')); var sed = setsEditor(null); f.appendChild(sed.el); f.appendChild(err);
      var r = h('div', 'row'); r.appendChild(btn('Cancelar', close)); r.appendChild(h('button', 'b o', 'Programar')); f.appendChild(r);
      f.onsubmit = function (e) { e.preventDefault(); var p = cs.value.split(':'), home = Number(hs.value), away = Number(as.value); if (home === away) return err.textContent = 'Elige dos equipos distintos.';
        var u = toUtc(at.value); if (u === undefined) return err.textContent = 'Fecha no válida.'; var round = rd.value.trim() || null, m2 = { id: 0, type: p[0], cid: Number(p[1]) }; var ce = conflict(m2, u, home, away, round); if (ce) return err.textContent = ce;
        S().matches.push({ id: MAGNA.id(), type: p[0], cid: Number(p[1]), round: round, home: home, away: away, at: u, status: 'scheduled', hs: null, as: null, sets: sed.get() }); close(); commit('Partido programado'); };
      b.appendChild(f);
    });
  }
  function resultDlg(m) {
    ask('Resultado: ' + MAGNA.teamName(m.home) + ' vs ' + MAGNA.teamName(m.away), [{ k: 'h', label: MAGNA.teamName(m.home), type: 'number', value: m.hs == null ? '' : m.hs, min: 0, max: 99 }, { k: 'a', label: MAGNA.teamName(m.away), type: 'number', value: m.as == null ? '' : m.as, min: 0, max: 99 }], function (v) {
      var x = Number(v.h), y = Number(v.a); if (v.h === '' || v.a === '' || !Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x > 99 || y > 99) return 'El marcador debe ser un entero entre 0 y 99.'; if (x === y) return 'No existen los empates: un equipo debe ganar.';
      var c = MAGNA.compOf(m); if (c && c.status === 'finished') return 'La competición ya finalizó.';
      var corr = m.status === 'finished'; m.hs = x; m.as = y; m.status = 'finished'; if (!corr) m.ended = MAGNA.now(); MAGNA.addNews('match_result', (corr ? 'Resultado corregido: ' : 'Final: ') + MAGNA.teamName(m.home) + ' ' + x + ' - ' + y + ' ' + MAGNA.teamName(m.away) + ' (' + (c ? c.name : '') + ').'); commit('Resultado guardado'); }, 'Guardar');
  }
  // ---------- noticias ----------
  function newsV(b) {
    var bar = h('div', 'bar2'); bar.appendChild(h('div', 'sp')); bar.appendChild(btn('+ Nueva noticia', function () { ask('Nueva noticia', [{ k: 't', label: 'Texto (máx. 280 caracteres)', type: 'textarea', maxlength: 280 }], function (v) { var t = (v.t || '').trim(); if (t.length < 3 || t.length > 280 || /[<>]/.test(t)) return 'La noticia debe tener entre 3 y 280 caracteres y no puede contener < ni >.'; MAGNA.addNews('announcement', t); commit('Noticia publicada'); }, 'Publicar'); }, 'o')); b.appendChild(bar);
    b.appendChild(table(['Fecha', 'Noticia', ''], S().news.map(function (n) { return [n.at, n.text, n.kind === 'announcement' ? [btn('Borrar', function () { S().news = S().news.filter(function (x) { return x.id !== n.id; }); commit('Noticia borrada'); }, 'd')] : 'automática']; })));
  }
  // ---------- mercado de fichajes ----------
  function closesDlg(opening) {
    var ms = MAGNA.marketState();
    ask(opening ? 'Abrir mercado de fichajes' : 'Fecha de cierre', [{ k: 'c', label: 'Se cierra solo el (opcional, hora de ' + ((window.MAGNA_TZ && MAGNA_TZ.label) || 'tu zona') + ')', type: 'datetime-local', value: ms.closes ? toLocal(ms.closes) : '' }], function (v) {
      var cl = v.c ? toUtc(v.c) : null; if (cl === undefined) return 'Fecha no válida.'; if (cl && Date.parse(cl.replace(' ', 'T') + 'Z') <= Date.now()) return 'La fecha de cierre debe ser en el futuro.';
      S().market = { open: true, since: opening ? MAGNA.now() : (S().market && S().market.since) || MAGNA.now(), closes: cl };
      if (opening) MAGNA.addNews('market', '¡Se abre el mercado de fichajes!' + (cl ? ' Cierra el ' + fdate(cl) + '.' : ''));
      commit(opening ? 'Mercado abierto' : 'Fecha de cierre actualizada'); }, opening ? 'Abrir mercado' : 'Guardar', opening ? 'Mientras esté abierto, los equipos pueden fichar jugadores libres de su nivel. Si pones una fecha, se cierra solo.' : null);
  }
  // ---------- economía ----------
  // ---------- datos ----------
  // ---------- respaldos automáticos en la nube (tabla backups + pg_cron diario) ----------
  var BKK = { auto: ['🕒', 'Automático'], manual: ['💾', 'Manual'], 'pre-restore': ['↩️', 'Antes de restaurar'] };
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
    play: '<path d="M7 4l13 8-13 8V4z"/>',
    star: '<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9L12 3z"/>'
  };
  function icon(k) { var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true'); s.innerHTML = IC[k] || ''; return s; }
  function fdate(at) { return at ? new Date(at.replace(' ', 'T') + 'Z').toLocaleString('es', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Sin fecha'; }
  function compName(m) { var c = MAGNA.compOf(m); return c ? c.name : '—'; }
  function liveMatches() { return S().matches.filter(function (m) { return m.status === 'live'; }); }

  // ---------- resumen ----------
  var PAGES = [['noticias.html', 'Noticias', 'Noticias, destacadas y reacciones'], ['index.html', 'Partidos', 'Portada con el partido destacado'], ['ligas.html', 'Ligas', 'Tablas de cada liga'], ['competiciones.html', 'Torneos', 'Torneos y cruces'], ['mundial.html', 'Mundial', 'Grupos y eliminatoria'], ['champions.html', 'Champions', 'Tabla general'], ['apuestas.html', 'Apuestas', 'Coins y pronósticos'], ['calendario.html', 'Calendario', 'Agenda de partidos'], ['equipos.html', 'Equipos', 'Fotos, plantillas y trofeos'], ['mercado.html', 'Fichajes', 'Mercado y salarios']];
  function countUp(el, to) { var R = matchMedia('(prefers-reduced-motion: reduce)').matches, f = function (v) { return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }; if (R) { el.textContent = f(to); return; } var t0 = performance.now(); (function st(n) { var k = Math.min(1, (n - t0) / 1000); el.textContent = f(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(st); })(t0); }
  function homeV(b) {
    if (window.ADMIN_DASH) { b.classList.add('dash'); return ADMIN_DASH(b, { h: h, btn: btn, icon: icon, go: go, toast: toast, compName: compName, countUp: countUp, setLive: function (id) { LIVE = id; }, form: function (k) { if (k === 'match') return matchDlg(null); if (formsApi()) ADMIN_FORMS[k](); } }); }
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
  // Jugadores en cancha (alineación del partido + los que entraron de cambio), luego el resto de la plantilla.
  // Cambiar el goleador de un gol ya registrado (desde el minuto a minuto).
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
  // ---------- estructura del panel ----------
  var TABS = [
    { id: 'resumen', g: 'General', l: 'Resumen', i: 'home', f: homeV, d: 'Todo tu sitio de un vistazo: lo que está en vivo, lo próximo y accesos a cada página.' },
    { id: 'vivo', g: 'General', l: 'En vivo', i: 'live', f: liveV, d: 'Narra el partido: inicio, goles, modo de juego, sustituciones, entretiempo y final.', p: 'index.html', ct: function () { return liveMatches().length; } },
    { id: 'ligas', g: 'Competiciones', l: 'Ligas', i: 'league', f: function (b) { compV(b, 'leagues'); }, d: 'Crea ligas, inscribe equipos y sigue la clasificación.', p: 'ligas.html' },
    { id: 'torneos', g: 'Competiciones', l: 'Torneos y Mundial', i: 'cup', f: function (b) { compV(b, 'tournaments'); }, d: 'Eliminatorias, todos contra todos o formato Mundial con fase de grupos.', p: 'mundial.html' },
    { id: 'balon', g: 'Competiciones', l: 'Balón de Oro', i: 'cup', f: balonV, d: 'Registra los ganadores de cada edición o abre una votación para que la comunidad elija al mejor jugador.', p: 'balon.html', ct: function () { return S().ballonVote ? 1 : 0; } },
    { id: 'historial', g: 'Competiciones', l: 'Historial', i: 'cup', f: histV, d: 'Torneos anteriores al sitio: marcadores y campeones. Ajustan el nivel de los equipos y los títulos de los jugadores.', p: 'competiciones.html' },
    { id: 'partidos', g: 'Competiciones', l: 'Partidos', i: 'cal', f: matchesV, d: 'Programa partidos, cambia fechas y registra resultados.', p: 'calendario.html', ct: function () { var p = pendingReqs().length; return p || S().matches.filter(function (m) { return m.status === 'scheduled'; }).length; }, dim: function () { return !pendingReqs().length; } },
    { id: 'equipos', g: 'Clubes', l: 'Equipos', i: 'shield', f: teamsV, d: 'Equipos, fotos, plantillas y trofeos.', p: 'equipos.html' },
    { id: 'jugadores', g: 'Clubes', l: 'Jugadores y coaches', i: 'user', f: playersV, d: 'Personas de la comunidad y su rol: Jugador, Coach y jugador o Solo coach. Al registrar a alguien se crea su cuenta con un código fijo de 6 dígitos.', p: 'mercado.html' },
    { id: 'economia', g: 'Clubes', l: 'Fichajes y Bits', i: 'coin', f: econV, d: 'Abre o cierra el mercado de fichajes, y maneja presupuestos y contratos de cada equipo.', ct: function () { return MAGNA.marketState().open ? '●' : 0; }, p: 'mercado.html' },
    { id: 'tienda', g: 'Clubes', l: 'Tienda e inventarios', i: 'star', f: shopV, d: 'Cosméticos que los miembros compran con Bits o reciben de regalo: colores de nombre, placas, marcos y títulos.', p: 'tienda.html' },
    { id: 'eventos', g: 'Comunicación', l: 'Eventos', i: 'cal', f: eventsV, d: 'Agenda de la comunidad: torneos relámpago, amistosos, transmisiones y premiaciones. Los miembros se apuntan con «¡Voy!».', p: 'eventos.html' },
    { id: 'noticias', g: 'Comunicación', l: 'Noticias', i: 'news', f: function (b) { window.ADMIN_NEWS(b, { h: h, btn: btn, toast: toast, dialog: dialog, confirmBox: confirmBox }); }, d: 'Crea, programa, destaca y edita las noticias de la comunidad.', p: 'noticias.html' },
    { id: 'actividad', g: 'Comunicación', l: 'Actividad', i: 'league', f: newsV, d: 'Avisos cortos y el registro automático de lo que pasa (resultados, fichajes, MVP).', p: 'index.html' },
    { id: 'datos', g: 'Sitio', l: 'Datos y accesos', i: 'up', f: dataV, d: 'Copias de seguridad y administradores. Tus cambios ya se publican solos.' }
  ];
  function go(t) { tab = t; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  window.ADMIN_GO = go;
  // ---------- secciones que se cargan al abrirlas (admin-<módulo>.js): el panel abre más rápido ----------
  var MODDEF = {}, MODS = {}, MODV = '2611080345', MODOF = { vivo: 'live', ligas: 'comp', torneos: 'comp', balon: 'balon', historial: 'hist', economia: 'econ', datos: 'data', eventos: 'events', tienda: 'shop' };
  window.ADMIN_MOD = function (n, f) { MODDEF[n] = f; };
  var $ = {}; Object.defineProperties($, { ACCS: { get: function () { return ACCS; }, set: function (v) { ACCS = v; } }, BKK: { get: function () { return BKK; }, set: function (v) { BKK = v; } }, EVC: { get: function () { return EVC; }, set: function (v) { EVC = v; } }, EVK: { get: function () { return EVK; }, set: function (v) { EVK = v; } }, INV: { get: function () { return INV; }, set: function (v) { INV = v; } }, LIVE: { get: function () { return LIVE; }, set: function (v) { LIVE = v; } }, MF: { get: function () { return MF; }, set: function (v) { MF = v; } }, NEXT: { get: function () { return NEXT; }, set: function (v) { NEXT = v; } }, ST: { get: function () { return ST; }, set: function (v) { ST = v; } }, TF: { get: function () { return TF; }, set: function (v) { TF = v; } }, TICK: { get: function () { return TICK; }, set: function (v) { TICK = v; } }, UNDO: { get: function () { return UNDO; }, set: function (v) { UNDO = v; } }, exBusy: { get: function () { return exBusy; }, set: function (v) { exBusy = v; } }, tab: { get: function () { return tab; }, set: function (v) { tab = v; } } });
  function modApi() { return { $: $, S: S, ask: ask, banner: banner, btn: btn, by: by, closesDlg: closesDlg, commit: commit, compName: compName, confirmBox: confirmBox, dialog: dialog, evRpc: evRpc, fdate: fdate, go: go, h: h, loadAccs: loadAccs, nk: nk, okName: okName, render: render, rr: rr, setsDlg: setsDlg, shareDlg: shareDlg, showCode: showCode, table: table, toLocal: toLocal, toUtc: toUtc, toast: toast }; }
  function modLoad(n) { if (MODS[n]) return MODS[n];
    MODS[n] = new Promise(function (ok, ko) { var sc = document.createElement('script'); sc.src = 'admin-' + n + '.js?v=' + MODV; sc.async = true;
      sc.onload = function () { if (!MODDEF[n]) { delete MODS[n]; return ko(new Error('módulo vacío')); } try { ok(MODDEF[n](modApi())); } catch (e) { delete MODS[n]; ko(e); } };
      sc.onerror = function () { delete MODS[n]; ko(new Error('Sin conexión')); }; document.head.appendChild(sc); });
    return MODS[n]; }
  function modWait(b) { b.innerHTML = ''; var w = h('div', 'mod-ld'); w.innerHTML = '<div class="mod-ball"><i></i></div><b>Preparando la sección…</b><div class="mod-bar"><i></i></div>'; b.appendChild(w); }
  function modRun(n, fn, args) { var b = args[0], isView = b === view, t0 = tab; if (MODDEF[n] && MODS[n] && MODS[n].done) return MODS[n].done[fn].apply(null, args);
    if (isView) modWait(b);
    modLoad(n).then(function (m) { MODS[n].done = m; if (isView && tab !== t0) return; if (isView) b.innerHTML = ''; m[fn].apply(null, args); }, function (e) {
      if (!isView) return toast('No se pudo cargar: ' + e.message, true); b.innerHTML = ''; var x = h('div', 'mod-ld err'); x.appendChild(h('b', null, 'No se pudo abrir esta sección')); x.appendChild(h('p', 'hint', 'Revisa tu conexión e inténtalo de nuevo.')); x.appendChild(btn('Reintentar', function () { render(); }, 'o')); b.appendChild(x); }); }
  function modPrefetch(n) { if (n && !MODS[n]) modLoad(n).then(function (m) { MODS[n].done = m; }, function () {}); }
  function liveV() { modRun('live', 'liveV', arguments); }
  function compV() { modRun('comp', 'compV', arguments); }
  function balonV() { modRun('balon', 'balonV', arguments); }
  function histV() { modRun('hist', 'histV', arguments); }
  function econV() { modRun('econ', 'econV', arguments); }
  function dataV() { modRun('data', 'dataV', arguments); }
  function eventsV() { modRun('events', 'eventsV', arguments); }
  function shopV() { modRun('shop', 'shopV', arguments); }
  function syncExcl() { modRun('shop', 'syncExcl', arguments); }
  function render() {
    if (TICK) { clearInterval(TICK); TICK = null; }
    var sd = document.getElementById('side'); sd.innerHTML = ''; var grp = null, cur = null;
    TABS.forEach(function (t) { if (t.g !== grp) { grp = t.g; cur = h('div', 'sg'); cur.appendChild(h('h4', null, t.g)); sd.appendChild(cur); }
      var x = h('button', 'si' + (t.id === tab ? ' on' : '')); x.type = 'button'; x.style.setProperty('--ic', ({ General: '#60a5fa', Competiciones: '#fbbf24', Clubes: '#34d399', 'Comunicación': '#c084fc', Sitio: '#22d3ee' })[t.g] || '#60a5fa'); x.appendChild(icon(t.i)); if (MODOF[t.id]) { x.onmouseenter = x.onfocus = x.ontouchstart = function () { modPrefetch(MODOF[t.id]); }; } x.appendChild(h('span', null, t.l)); var n = t.ct ? t.ct() : 0; if (n) x.appendChild(h('span', 'ct' + ((typeof t.dim === 'function' ? t.dim() : t.dim) ? ' dim' : ''), n)); x.onclick = function () { go(t.id); }; cur.appendChild(x); });
    var T = TABS.filter(function (t) { return t.id === tab; })[0], hd = document.getElementById('shead'); hd.innerHTML = '';
    var l = h('div'); l.appendChild(h('div', 'eb mono', 'Panel · ' + T.g)); l.appendChild(h('h1', 'x', T.l)); l.appendChild(h('p', null, T.d)); hd.appendChild(l);
    if (T.p) { var a = h('a', 'lk', 'Ver en el sitio ↗'); a.href = T.p; a.target = '_blank'; a.rel = 'noopener'; hd.appendChild(a); }
    hd.classList.toggle('hide', tab === 'resumen'); document.body.classList.toggle('on-dash', tab === 'resumen');
    var ql = h('div', 'sg sq'); ql.appendChild(h('h4', null, 'Enlaces rápidos')); [['index.html', 'Ver el sitio', 'home'], ['eventos.html', 'Eventos', 'cal'], ['tienda.html', 'Tienda', 'star']].forEach(function (x) { var a = h('a', 'si'); a.href = x[0]; a.target = '_blank'; a.rel = 'noopener'; a.appendChild(icon(x[2])); a.appendChild(h('span', null, x[1])); a.appendChild(h('em', null, '↗')); ql.appendChild(a); }); sd.appendChild(ql);
    var brd = h('div', 'sbrand'), bi = h('img'); bi.src = 'logo-sm.webp'; bi.alt = ''; brd.appendChild(bi); brd.appendChild(h('b', null, 'MAGNA ARENA')); brd.appendChild(h('small', null, 'Competencia · Comunidad · Diversión')); sd.appendChild(brd);
    view.classList.remove('dash'); view.innerHTML = ''; T.f(view);
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
  // en un rato libre se precargan las demás secciones para que abran al instante
  setTimeout(function () { var q = ['live', 'comp', 'shop', 'balon', 'data', 'hist', 'econ', 'events'], go1 = function () { var n = q.shift(); if (!n) return; modPrefetch(n); setTimeout(function () { if (window.requestIdleCallback) requestIdleCallback(go1, { timeout: 3000 }); else go1(); }, 900); }; go1(); }, 6000);
  window.addEventListener('magna:update', function (e) { if (e.detail && e.detail.remote) { render(); banner(); if (e.detail.why === 'remote') toast('Se actualizaron los datos: un coach hizo cambios en su equipo.'); } });
  window.addEventListener('magna:conflict', function () { toast('Tu último cambio no se guardó porque un coach acababa de modificar los datos. Ya se recargaron: vuelve a hacerlo.', true); });
})();
