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
  function roleSel(p) {
    var s = h('select', 'in'); s.style.cssText = 'margin:0;padding:6px 10px;min-width:175px'; MAGNA.ROLES.forEach(function (r) { var o = h('option', null, r[1]); o.value = r[0]; s.appendChild(o); }); s.value = MAGNA.roleOf(p);
    s.onchange = function () { var k = s.value, old = MAGNA.roleOf(p), team = by(S().teams, p.teamId), dt = S().teams.filter(function (t) { return t.coach === p.id; })[0], warn = [];
      if (k === 'coach' && team) warn.push('Sale de la plantilla de ' + team.name + ' (los "Solo coach" no juegan).');
      if (k === 'player' && dt) warn.push('Deja de ser DT de ' + dt.name + ' (los "Jugador" no dirigen).');
      function apply() { p.kind = k; if (k === 'coach' && team) { p.teamId = null; p.slot = null; } if (k === 'player' && dt) dt.coach = null; MAGNA.addNews('role', p.name + ' ahora es ' + MAGNA.roleName(p) + '.'); commit('Rol actualizado: ' + MAGNA.roleName(p)); }
      if (warn.length) { s.value = old; confirmBox('¿Cambiar el rol de ' + p.name + '?', warn.join(' '), 'Cambiar rol', apply); } else apply(); };
    return s;
  }
  function playersV(b) {
    var bar = h('div', 'bar2'); bar.appendChild(h('div', 'sp')); bar.appendChild(btn('🎁 Regalar Bits', function () { giftDlg(); })); bar.appendChild(btn('Importar jugadores', importDlg)); bar.appendChild(btn('+ Nueva persona', function () {
      ask('Registrar persona', [{ k: 'n', label: 'Nombre en Brawl Stars', maxlength: 24 }, { k: 'k', label: 'Rol', type: 'select', value: 'player', options: MAGNA.ROLES }, { k: 't', label: 'Torneos que ya ganó (opcional, uno por línea; si dice "Mundial" cuenta como Mundial)', type: 'textarea' }], function (v) { var n = okName(v.n, 2, 24); if (!n) return 'Nombre no válido (2 a 24 caracteres).'; if (S().players.some(function (p) { return nk(p.name) === nk(n); })) return 'Ya existe un jugador con ese nombre.';
        var p = { id: MAGNA.id(), name: n, teamId: null, slot: null }; if (v.k && v.k !== 'player') p.kind = v.k; var tt = String(v.t || '').split('\n').map(function (x) { return okName(x, 2, 40); }).filter(Boolean).slice(0, 20); if (tt.length) p.prevTitles = tt; S().players.push(p); commit('Jugador registrado'); MAGNA.cloud.flush(); setTimeout(function () { createAcc(p); }, 500); }, 'Registrar', 'Se crea su ficha y su cuenta con un código de 6 dígitos para entrar y apostar con sus Bits. Rol: Jugador (juega en un equipo), Coach y jugador (juega y puede ser DT) o Solo coach (solo dirige, no ocupa lugar en la plantilla). Los torneos ganados suben el mínimo de su media: +10 cada uno y +15 cada Mundial (hasta 60).'); }, 'o')); b.appendChild(bar);
    var rf = h('select', 'in'); rf.style.cssText = 'max-width:220px;margin:0'; [['all', 'Todos los roles']].concat(MAGNA.ROLES).forEach(function (r) { var o = h('option', null, r[1]); o.value = r[0]; rf.appendChild(o); }); rf.value = PROLE; rf.onchange = function () { PROLE = rf.value; render(); }; bar.insertBefore(rf, bar.firstChild);
    var PS = MAGNA.playerStats(); b.appendChild(h('p', 'hint', 'La media va de 10 a 100 y todos empiezan en 10. Sale de los partidos narrados en vivo: ganarle a un equipo fuerte suma mucho y perder con uno más débil resta mucho; la valoración (1 a 10) de cada partido también sube o baja. El nivel de cada equipo se calcula solo con sus resultados. Los títulos aseguran un mínimo: cada liga o torneo ganado sube el piso de la media 10 puntos (el Mundial, 15), hasta 60.'));
    if (ACCS === null) { b.appendChild(M.skel(4)); loadAccs(function () { if (tab === 'jugadores') render(); }); }
    b.appendChild(table(['ID', 'Nombre', 'Rol', 'Equipo', 'PJ', 'Goles', 'Media', 'Cuenta', 'Bits', ''], S().players.filter(function (p) { return PROLE === 'all' || MAGNA.roleOf(p) === PROLE; }).map(function (p) { var t = by(S().teams, p.teamId), x = PS[p.id] || {}, tr = MAGNA.tierOf(x.media), md = h('span', 'tier', (x.media == null ? '—' : x.media) + ' · ' + tr.name); md.style.setProperty('--c', tr.color);
      var a = accOf(p.id), ac = h('span', 'acc');
      if (a) { ac.appendChild(h('code', null, a.username)); var cp = btn('Copiar código', function () { ACCOUNTS.copy('Magna Arena · Usuario: ' + a.username + ' · Código: ' + a.code, cp); }, 'sm'); ac.appendChild(cp); ac.appendChild(btn('Ver', function () { showCode('Cuenta de ' + p.name, a); }, 'sm')); ac.appendChild(btn('🎁', function () { giftDlg([a.id]); }, 'sm')); if (a.locked) { ac.appendChild(h('span', 'lk', 'Bloqueada')); ac.appendChild(btn('Desbloquear', function () { ACCOUNTS.manage('unlock', { id: a.id }).then(function () { toast('Cuenta desbloqueada'); loadAccs(render); }, function (e) { toast(e.message, true); }); }, 'sm')); } }
      else if (ACCS !== null) ac.appendChild(btn('Crear cuenta', function () { createAcc(p); }, 'sm'));
      var bits = a ? btn(String(a.bits), function () { ask('Bits de ' + p.name, [{ k: 'b', label: 'Bits disponibles', type: 'number', value: a.bits, min: 0 }], function (v) { var n = Number(v.b); if (!Number.isInteger(n) || n < 0 || n > 1e8) return 'Cantidad no válida.'; return ACCOUNTS.setBits(a.id, n).then(function () { toast('Bits actualizados'); loadAccs(render); }, function (e) { return e.message; }); }); }, 'sm') : '—';
      var dtOf = S().teams.filter(function (tm) { return tm.coach === p.id; })[0];
      return ['#' + p.id, h('b', null, p.name), roleSel(p), teamCtl(p), x.pj || 0, x.g || 0, md, ac, bits, [
      btn('Renombrar', function () { ask('Renombrar', [{ k: 'n', label: 'Nombre', value: p.name, maxlength: 24 }], function (v) { var n = okName(v.n, 2, 24); if (!n) return 'Nombre no válido.'; if (S().players.some(function (x) { return x.id !== p.id && nk(x.name) === nk(n); })) return 'Ya existe ese nombre.'; p.name = n; commit('Nombre actualizado'); }); }),
      btn('Historial' + (p.prevTitles && p.prevTitles.length ? ' 🏆' + p.prevTitles.length : '') + (p.prevStats && p.prevStats.mvp ? ' ⭐' + p.prevStats.mvp : ''), function () { titlesDlg(p); }),
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
        e.name = n; e.date = d; e.mundial = ct.value === 'mundial'; e.cat = e.mundial ? 'torneo' : ct.value; e.champion = okName(ch.value, 1, 30) || ''; e.champIds = Object.keys(sel).map(Number); var old = (e.matches || []).slice(); e.matches = r.ok.map(function (m) { var i = -1; old.forEach(function (x, j) { if (i < 0 && nk(x.home) === nk(m.home) && nk(x.away) === nk(m.away)) i = j; }); if (i >= 0) { var x = old.splice(i, 1)[0]; if (x.hp) m.hp = x.hp; if (x.ap) m.ap = x.ap; } return m; }); // conserva quién jugó cada partido
        S().history = S().history || []; if (isNew) S().history.push(e);
        S().teams.forEach(function (t) { if (t.trophies) t.trophies = t.trophies.filter(function (x) { return x.hist !== e.id; }); });
        var champ = e.champion && S().teams.filter(function (t) { return nk(t.name) === nk(e.champion); })[0];
        if (tc.checked && champ) champ.trophies = (champ.trophies || []).concat([{ id: MAGNA.id(), name: n, cat: e.mundial ? 'torneo' : e.cat === 'champions' ? 'champions' : e.cat === 'liga' ? 'liga' : e.cat === 'otro' ? 'otro' : 'torneo', season: d ? d.slice(0, 4) : null, hist: e.id }]);
        commit(isNew ? 'Torneo agregado al historial' : 'Historial actualizado'); close(); }, 'o')); b.appendChild(rr); if (isNew) nm.focus();
    });
  }
  // ---------- Tienda de cosméticos e inventarios ----------
  var INV = null;
  function shopRpc(n, a) { return window.MAGNA_SB().then(function (c) { return c.rpc(n, a); }).then(function (r) { if (r && r.error) throw r.error; return r.data; }); }
  function loadInv(then) { shopRpc('admin_inventory').then(function (d) { INV = d || []; then && then(); }, function () { INV = INV || []; then && then(); }); }
  // entrega automática de exclusivos: a cada cuenta con jugador que desbloqueó la insignia del cosmético
  var exT = null, exBusy = false;
  function syncExcl(manual) { var X = (S().shop || []).filter(function (x) { return x.exclusive && x.award && x.award !== 'manual'; }); if (!X.length || exBusy) { if (manual) toast(X.length ? 'Ya se está entregando…' : 'No hay exclusivos automáticos en el catálogo.'); return; }
    if (!window.MAGNA_SB || MAGNA.cloud.source !== 'cloud') return; exBusy = true;
    loadAccs(function () { loadInv(function () { var jobs = [];
      X.forEach(function (it) { var ids = (ACCS || []).filter(function (a) { if (a.player_id == null) return false; if ((INV || []).some(function (r) { return r.account_id === a.id && r.item_id === it.id; })) return false; var b = MAGNA.playerBadges(a.player_id).filter(function (z) { return z.id === it.award; })[0]; return !!(b && b.ok); }).map(function (a) { return a.id; });
        if (ids.length) jobs.push(shopRpc('admin_gift_item', { p_accounts: ids, p_item: it.id, p_message: '🔒 Cosmético exclusivo desbloqueado: ' + (MAGNA.AWARD_TXT[it.award] || '') + '. ¡Ya está en tu inventario!' }).then(function (n) { return n || 0; }, function () { return 0; })); });
      Promise.all(jobs).then(function (r) { exBusy = false; var n = r.reduce(function (a, b) { return a + b; }, 0); if (n) { toast('🔒 ' + n + (n === 1 ? ' cosmético exclusivo entregado' : ' cosméticos exclusivos entregados')); loadInv(function () { if (tab === 'tienda') render(); }); } else if (manual) toast('Todo al día: nadie tiene exclusivos pendientes.'); }); }); }); }
  window.ADMIN_EXCL = function () { clearTimeout(exT); exT = setTimeout(function () { syncExcl(false); }, 2500); };
  setTimeout(function () { if (window.ADMIN_EXCL) ADMIN_EXCL(); }, 4000);
  function shopEdit(it0) {
    var isNew = !it0, it = it0 ? Object.assign({}, it0) : { id: '', type: 'color', name: '', rarity: 'comun', price: 300, style: Object.keys(M.STY.color)[0], active: true };
    dialog(isNew ? 'Nuevo cosmético' : 'Editar ' + it0.name, function (b, close) {
      var pv = h('div'); b.appendChild(pv);
      function fl(label, el) { var l = h('label', 'f', label); l.appendChild(el); b.appendChild(l); return el; }
      var ty = h('select', 'in'); Object.keys(M.KIND).forEach(function (k) { var o = h('option', null, M.KIND[k]); o.value = k; ty.appendChild(o); }); ty.value = it.type; ty.disabled = !isNew; fl('Tipo', ty);
      var nm = h('input', 'in'); nm.maxLength = 40; nm.value = it.name; nm.placeholder = 'Ej.: Neón rosa'; var nl = fl('Nombre', nm);
      var sl = h('select', 'in'), sw = fl('Estilo', sl);
      var ra = h('select', 'in'); Object.keys(M.RAR).forEach(function (k) { var o = h('option', null, M.RAR[k]); o.value = k; ra.appendChild(o); }); ra.value = it.rarity || 'comun'; fl('Rareza', ra);
      var hw = h('select', 'in'), o0 = h('option', null, '🛍️ Se compra con Bits'); o0.value = ''; hw.appendChild(o0); Object.keys(MAGNA.AWARD_TXT).forEach(function (k) { var o = h('option', null, '🔒 Exclusivo · ' + MAGNA.AWARD_TXT[k]); o.value = k; hw.appendChild(o); }); hw.value = it.exclusive ? (it.award || 'manual') : ''; fl('Cómo se consigue', hw);
      var pr = h('input', 'in'); pr.type = 'number'; pr.min = 0; pr.max = 1000000; pr.value = it.price; var prl = fl('Precio en Bits', pr); hw.onchange = function () { prl.parentNode.style.display = hw.value ? 'none' : ''; }; hw.onchange();
      var ac = h('label', 'f'), cb = h('input'); cb.type = 'checkbox'; cb.checked = it.active !== false; ac.appendChild(cb); ac.appendChild(document.createTextNode(' A la venta en la tienda (si lo quitas, solo se puede regalar)')); b.appendChild(ac);
      var err = h('p', 'err'); b.appendChild(err);
      function styles() { sl.innerHTML = ''; var S2 = M.STY[ty.value] || {}; Object.keys(S2).forEach(function (k) { var o = h('option', null, S2[k]); o.value = k; sl.appendChild(o); }); if (S2[it.style]) sl.value = it.style; sw.parentNode.style.display = ty.value === 'title' ? 'none' : ''; nl.parentNode.firstChild.textContent = ty.value === 'title' ? 'Texto del título' : 'Nombre'; }
      function prev() { pv.innerHTML = ''; pv.appendChild(M.cosPreview({ id: '_', type: ty.value, name: nm.value || 'Título', style: sl.value }, 'Jugador')); if (ty.value !== 'title') { var x = pv.querySelector('.mpn'); if (x) { x.classList.add((ty.value === 'color' ? 'c-' : 'pl-') + sl.value); } } }
      ty.onchange = function () { styles(); prev(); }; sl.onchange = nm.oninput = prev; styles(); prev();
      var r = h('div', 'row'); r.appendChild(btn('Cancelar', close)); r.appendChild(btn(isNew ? 'Crear' : 'Guardar', function () {
        var n = nm.value.trim(), p = Number(pr.value); err.textContent = '';
        if (n.length < 2) return err.textContent = 'Escribe un nombre (mínimo 2 letras).'; if (/[<>]/.test(n)) return err.textContent = 'El nombre no puede tener < ni >.'; if (!Number.isInteger(p) || p < 0 || p > 1000000) return err.textContent = 'El precio debe ser un número entero entre 0 y 1.000.000.';
        it.type = ty.value; it.name = n; it.rarity = ra.value; it.price = hw.value ? 0 : p; it.style = it.type === 'title' ? '' : sl.value; it.active = cb.checked; if (hw.value) { it.exclusive = true; it.award = hw.value; } else { delete it.exclusive; delete it.award; }
        S().shop = S().shop || [];
        if (isNew) { var base = (it.exclusive ? 'x' : it.type[0]) + '-' + nk(n).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30), id = base || it.type[0] + '-x', k = 2; while (S().shop.some(function (x) { return x.id === id; })) id = base + '-' + k++; it.id = id; S().shop.push(it); }
        else { var i = S().shop.indexOf(it0); S().shop[i] = it; }
        close(); commit(isNew ? 'Cosmético creado' : 'Cosmético guardado'); }, 'o')); b.appendChild(r); nm.focus();
    });
  }
  function itemGiftDlg(it0) {
    if (ACCS === null) return loadAccs(function () { itemGiftDlg(it0); });
    if (!ACCS.length) return toast('Todavía no hay cuentas. Crea cuentas en Jugadores.', true);
    dialog('🎁 Regalar cosmético', function (b, close) {
      b.appendChild(h('p', 'sub', 'Se agrega a su inventario y le llega una notificación. Quien ya lo tenga no lo recibe dos veces.'));
      var isel = h('select', 'in'); (S().shop || []).forEach(function (x) { var o = h('option', null, x.name + ' · ' + M.KIND[x.type] + (x.active === false ? ' (no está a la venta)' : '')); o.value = x.id; isel.appendChild(o); }); if (it0) isel.value = it0.id; var li = h('label', 'f', 'Cosmético'); li.appendChild(isel); b.appendChild(li);
      var pv = h('div'); b.appendChild(pv); function prev() { pv.innerHTML = ''; var x = M.item(isel.value); if (x) pv.appendChild(M.cosPreview(x, 'Jugador')); } isel.onchange = function () { prev(); draw(); }; prev();
      var msg = h('textarea', 'in'); msg.rows = 2; msg.maxLength = 280; msg.placeholder = 'Ej.: ¡Premio por el Balón de Oro!'; var lm = h('label', 'f', 'Mensaje (opcional)'); lm.appendChild(msg); b.appendChild(lm);
      var sel = {}, tools = h('div', 'bar2'), q = h('input', 'in'); q.placeholder = 'Buscar cuenta…'; q.style.maxWidth = '240px'; tools.appendChild(q); tools.appendChild(btn('Todos los miembros', function () { ACCS.forEach(function (a) { if (a.role === 'member') sel[a.id] = 1; }); draw(); }, 'sm')); tools.appendChild(btn('Quitar todos', function () { sel = {}; draw(); }, 'sm')); b.appendChild(tools);
      var list = h('div', 'gift-list'); b.appendChild(list); var err = h('p', 'err'); b.appendChild(err);
      function has(aid) { return (INV || []).some(function (r) { return r.account_id === aid && r.item_id === isel.value; }); }
      function draw() { list.innerHTML = ''; var t = nk(q.value || ''); ACCS.slice().sort(function (x, y) { return (x.display_name || '').localeCompare(y.display_name || ''); }).filter(function (a) { return !t || nk(a.display_name + ' ' + a.username).indexOf(t) >= 0; }).forEach(function (a) {
          var r = h('label', 'gift-it' + (sel[a.id] ? ' on' : '')), cb = h('input'); cb.type = 'checkbox'; cb.checked = !!sel[a.id]; var ya = has(a.id); cb.disabled = ya;
          cb.onchange = function () { if (cb.checked) sel[a.id] = 1; else delete sel[a.id]; r.classList.toggle('on', cb.checked); go.textContent = 'Regalar a ' + Object.keys(sel).length; };
          r.appendChild(cb); var tx = h('span'); tx.appendChild(h('b', null, a.display_name)); tx.appendChild(h('small', null, '@' + a.username)); r.appendChild(tx); r.appendChild(h('span', 'gb', ya ? 'Ya lo tiene' : '')); list.appendChild(r); }); go.textContent = 'Regalar a ' + Object.keys(sel).length; }
      q.oninput = draw;
      var rr = h('div', 'row'); rr.appendChild(btn('Cancelar', close)); var go = btn('Regalar', function () { var ids = Object.keys(sel).filter(function (id) { return !has(id); }), m = msg.value.trim(), x = M.item(isel.value); err.textContent = '';
        if (!ids.length) return err.textContent = 'Elige al menos una cuenta.'; if (/[<>]/.test(m)) return err.textContent = 'El mensaje no puede contener < ni >.';
        go.disabled = true; go.textContent = 'Regalando…';
        shopRpc('admin_gift_item', { p_accounts: ids, p_item: x.id, p_message: m || null }).then(function (n) { close(); toast('🎁 ' + x.name + ' regalado a ' + n + (n === 1 ? ' cuenta' : ' cuentas')); loadInv(function () { if (tab === 'tienda') render(); }); },
          function (e) { go.disabled = false; err.textContent = 'No se pudo: ' + (e.message || e); }); }, 'o'); rr.appendChild(go); b.appendChild(rr); draw();
    });
  }
  function ownersDlg(it) {
    var rows = (INV || []).filter(function (r) { return r.item_id === it.id; });
    dialog('Quién tiene ' + it.name, function (b, close) {
      if (!rows.length) { b.appendChild(h('p', 'sub', 'Nadie lo tiene todavía.')); return; }
      var L = h('div', 'res'); rows.forEach(function (r) { var a = (ACCS || []).filter(function (x) { return x.id === r.account_id; })[0], row = h('div', 'ur'); var w = h('div', 'w'); w.appendChild(h('b', null, a ? a.display_name : 'Cuenta')); w.appendChild(h('small', null, (r.source === 'gift' ? '🎁 Regalo' : '🛍️ Compra') + ' · ' + new Date(r.at).toLocaleDateString('es'))); row.appendChild(w);
        row.appendChild(btn('Quitar', function () { confirmBox('¿Quitar ' + it.name + '?', 'Se borra de su inventario. Si lo compró, los Bits no se devuelven automáticamente.', 'Quitar', function () { shopRpc('admin_revoke_item', { p_account: r.account_id, p_item: it.id }).then(function () { toast('Quitado'); loadInv(function () { if (tab === 'tienda') render(); }); }, function (e) { toast(e.message || 'No se pudo', true); }); }); }, 'sm d')); L.appendChild(row); });
      b.appendChild(L);
    });
  }
  function shopV(b) {
    if (INV === null) { loadInv(function () { if (tab === 'tienda') render(); }); if (ACCS === null) loadAccs(); }
    var L = S().shop || [];
    if (!L.length) { var e = h('div', 'box'); e.appendChild(h('h3', null, '🛍️ Activa la tienda')); e.appendChild(h('p', 'hint', 'Carga un catálogo inicial de ' + MAGNA.SHOP_DEFAULT.length + ' cosméticos (colores de nombre, placas, marcos y títulos) con precios sugeridos. Después puedes cambiar precios, quitar o crear los tuyos.'));
      var r0 = h('div', 'bar2'); r0.appendChild(btn('Cargar catálogo inicial', function () { S().shop = JSON.parse(JSON.stringify(MAGNA.SHOP_DEFAULT.concat(MAGNA.SHOP_EXCL))); MAGNA.addNews('announcement', '🛍️ ¡Abrió la tienda de cosméticos! Colores neón, placas, marcos y títulos para tu nombre.'); commit('Tienda activada'); }, 'o')); r0.appendChild(btn('Empezar vacía', function () { shopEdit(null); })); e.appendChild(r0); b.appendChild(e); return; }
    var own = {}; (INV || []).forEach(function (r) { own[r.item_id] = (own[r.item_id] || 0) + 1; });
    var tot = (INV || []).length, sold = (INV || []).filter(function (r) { return r.source === 'shop'; }).length;
    if (!L.some(function (x) { return x.exclusive; })) { var xe = h('div', 'box'); xe.style.marginBottom = '14px'; xe.appendChild(h('h3', null, '🔒 Cosméticos exclusivos')); xe.appendChild(h('p', 'hint', 'No se compran: se entregan solos a quien gane el Balón de Oro, un título, 10 MVP, un hat-trick… Agrega ' + MAGNA.SHOP_EXCL.length + ' exclusivos listos para usar.')); var xr = h('div', 'bar2'); xr.appendChild(btn('Agregar exclusivos', function () { S().shop = S().shop.concat(JSON.parse(JSON.stringify(MAGNA.SHOP_EXCL.filter(function (x) { return !S().shop.some(function (y) { return y.id === x.id; }); })))); commit('Exclusivos agregados: se entregan solos a quien los desbloquee'); }, 'o')); xe.appendChild(xr); b.appendChild(xe); }
    var kp = h('div', 'bar2'); kp.appendChild(h('span', 'chip', L.length + ' cosméticos')); kp.appendChild(h('span', 'chip', L.filter(function (x) { return x.active !== false; }).length + ' a la venta')); kp.appendChild(h('span', 'chip', sold + ' vendidos · ' + (tot - sold) + ' regalados')); kp.appendChild(h('div', 'sp')); if (L.some(function (x) { return x.exclusive; })) kp.appendChild(btn('🔒 Entregar exclusivos ahora', function () { syncExcl(true); })); kp.appendChild(btn('🎁 Regalar cosmético', function () { itemGiftDlg(null); })); kp.appendChild(btn('+ Nuevo cosmético', function () { shopEdit(null); }, 'o')); b.appendChild(kp);
    var RO = { comun: 0, rara: 1, epica: 2, legendaria: 3 };
    Object.keys(M.KIND).forEach(function (k) { var its = L.filter(function (x) { return x.type === k; }).sort(function (a, c) { return (RO[a.rarity] || 0) - (RO[c.rarity] || 0) || a.price - c.price; }); if (!its.length) return;
      b.appendChild(h('h3', 'x', M.KIND[k] + ' (' + its.length + ')'));
      b.appendChild(table(['Vista', 'Nombre', 'Rareza', 'Precio', 'Estado', 'Dueños', ''], its.map(function (x) { var pv = M.cosPreview(x, 'Jugador'); pv.style.cssText = 'min-height:0;padding:6px 10px;font-size:14px';
        return [pv, h('b', null, x.name), h('span', 'rar rar-' + (x.rarity || 'comun'), M.RAR[x.rarity] || 'Común'), x.exclusive ? h('span', null, '🔒 ' + (MAGNA.AWARD_TXT[x.award] || 'Exclusivo')) : h('b', null, Number(x.price || 0).toLocaleString('es') + '\u00a0Bits'), x.active === false ? 'Oculto' : 'A\u00a0la\u00a0venta', INV === null ? '…' : btn(String(own[x.id] || 0), function () { ownersDlg(x); }, 'sm'),
          [btn('Editar', function () { shopEdit(x); }, 'sm'), btn('Regalar', function () { itemGiftDlg(x); }, 'sm'), btn(x.active === false ? 'Poner a la venta' : 'Ocultar', function () { x.active = x.active === false; commit(x.active ? 'A la venta' : 'Oculto de la tienda'); }, 'sm'),
            btn('Eliminar', function () { confirmBox('¿Eliminar ' + x.name + ' del catálogo?', (own[x.id] ? own[x.id] + ' cuentas lo tienen; dejará de verse en su inventario. ' : '') + 'Si solo quieres dejar de venderlo, usa Ocultar.', 'Eliminar', function () { S().shop = S().shop.filter(function (y) { return y !== x; }); commit('Cosmético eliminado'); }); }, 'sm d')]]; }))); });
  }
  // ---------- Eventos (eventos.html) ----------
  var EVK = { torneo: '🏆 Torneo', amistoso: '🤝 Amistosos', especial: '🎉 Especial', stream: '📺 Transmisión', premio: '🥇 Premiación', comunidad: '🗣️ Comunidad' }, EVC = null;
  function evRpc(n, a) { return window.MAGNA_SB().then(function (c) { return c.rpc(n, a); }).then(function (r) { if (r && r.error) throw r.error; return r.data; }); }
  function evEdit(e0) {
    var isNew = !e0, e = e0 ? Object.assign({}, e0) : { id: MAGNA.id(), kind: 'especial', title: '', at: null, end: null, desc: '', place: '', link: '', linkLabel: '' };
    dialog(isNew ? 'Nuevo evento' : 'Editar evento', function (b, close) {
      function fl(label, el) { var l = h('label', 'f', label); l.appendChild(el); b.appendChild(l); return el; }
      var ti = h('input', 'in'); ti.maxLength = 80; ti.value = e.title; ti.placeholder = 'Ej.: Noche de amistosos'; fl('Nombre del evento', ti);
      var ki = h('select', 'in'); Object.keys(EVK).forEach(function (k) { var o = h('option', null, EVK[k]); o.value = k; ki.appendChild(o); }); ki.value = e.kind; fl('Tipo', ki);
      var two = h('div', 'two2'); b.appendChild(two); var la = h('label', 'f', 'Empieza'), at = h('input', 'in'); at.type = 'datetime-local'; at.value = toLocal(e.at); la.appendChild(at); two.appendChild(la); var lb = h('label', 'f', 'Termina (opcional)'), en = h('input', 'in'); en.type = 'datetime-local'; en.value = toLocal(e.end); lb.appendChild(en); two.appendChild(lb);
      var de = h('textarea', 'in'); de.rows = 3; de.maxLength = 500; de.value = e.desc || ''; de.placeholder = 'Qué va a pasar, premios, reglas…'; fl('Descripción (opcional)', de);
      var pl = h('input', 'in'); pl.maxLength = 60; pl.value = e.place || ''; pl.placeholder = 'Ej.: Discord de Magna'; fl('Dónde (opcional)', pl);
      var tw2 = h('div', 'two2'); b.appendChild(tw2); var lc = h('label', 'f', 'Enlace (opcional)'), lk = h('input', 'in'); lk.value = e.link || ''; lk.placeholder = 'https://… o una página del sitio'; lc.appendChild(lk); tw2.appendChild(lc); var ld = h('label', 'f', 'Texto del botón'), ll = h('input', 'in'); ll.maxLength = 30; ll.value = e.linkLabel || ''; ll.placeholder = 'Más información'; ld.appendChild(ll); tw2.appendChild(ld);
      var err = h('p', 'err'); b.appendChild(err);
      var r = h('div', 'row'); r.appendChild(btn('Cancelar', close)); r.appendChild(btn(isNew ? 'Crear evento' : 'Guardar', function () {
        var t = ti.value.trim(), a = toUtc(at.value), z = en.value ? toUtc(en.value) : null, u = lk.value.trim(); err.textContent = '';
        if (t.length < 3) return err.textContent = 'Escribe un nombre (mínimo 3 letras).'; if (/[<>]/.test(t + de.value + pl.value + ll.value)) return err.textContent = 'No uses < ni >.';
        if (!a) return err.textContent = 'Elige cuándo empieza.'; if (z && z <= a) return err.textContent = 'El final debe ser después del inicio.';
        if (u && !/^(https:\/\/|[a-z0-9-]+\.html)/i.test(u)) return err.textContent = 'El enlace debe empezar por https:// o ser una página del sitio (por ejemplo, balon.html).';
        e.title = t; e.kind = ki.value; e.at = a; e.end = z; e.desc = de.value.trim(); e.place = pl.value.trim(); e.link = u; e.linkLabel = ll.value.trim();
        S().events = S().events || []; if (isNew) { S().events.push(e); MAGNA.addNews('announcement', '📅 Nuevo evento: ' + t + '.'); } else S().events[S().events.indexOf(e0)] = e;
        close(); commit(isNew ? 'Evento creado' : 'Evento guardado'); }, 'o')); b.appendChild(r); ti.focus();
    });
  }
  function evWho(e) { evRpc('admin_event_rsvps', { p_event: e.id }).then(function (L) { dialog('Quién va a ' + e.title, function (b) { if (!L || !L.length) { b.appendChild(h('p', 'sub', 'Todavía nadie se apuntó.')); return; } var list = h('div', 'res'); L.forEach(function (x) { var r = h('div', 'ur'), w = h('div', 'w'); w.appendChild(h('b', null, x.display_name)); w.appendChild(h('small', null, 'Se apuntó el ' + new Date(x.at).toLocaleString('es'))); r.appendChild(w); list.appendChild(r); }); b.appendChild(list); }); }, function (er) { toast(er.message || 'No se pudo', true); }); }
  function eventsV(b) {
    if (EVC === null) { EVC = {}; evRpc('event_rsvp_counts').then(function (L) { (L || []).forEach(function (x) { EVC[x.event_id] = Number(x.n); }); if (tab === 'eventos') render(); }, function () {}); }
    var bar = h('div', 'bar2'); bar.appendChild(h('p', 'hint', 'El Balón de Oro y los partidos de final o semifinal aparecen solos en Eventos. Aquí creas los demás: torneos relámpago, noches de amistosos, transmisiones, premiaciones…')); bar.appendChild(h('div', 'sp')); bar.appendChild(btn('Balón de Oro →', function () { go('balon'); })); bar.appendChild(btn('+ Nuevo evento', function () { evEdit(null); }, 'o')); b.appendChild(bar);
    var L = (S().events || []).slice().sort(function (a, c) { return String(c.at).localeCompare(String(a.at)); }), now = MAGNA.now();
    if (!L.length) { b.appendChild(h('p', 'sub', 'Todavía no hay eventos. Crea el primero con «+ Nuevo evento».')); return; }
    b.appendChild(table(['Evento', 'Tipo', 'Cuándo', 'Van', 'Estado', ''], L.map(function (e) { var past = (e.end || e.at) < now;
      return [h('b', null, e.title), EVK[e.kind] || e.kind, fdate(e.at), btn(String(EVC[e.id] || 0), function () { evWho(e); }, 'sm'), past ? 'Pasado' : e.at <= now ? '🔴 En curso' : 'Próximo',
        [btn('Editar', function () { evEdit(e); }, 'sm'), btn('Duplicar', function () { var c = Object.assign({}, e, { id: MAGNA.id(), title: e.title + ' (copia)' }); S().events.push(c); commit('Evento duplicado'); evEdit(c); }, 'sm'), btn('Eliminar', function () { confirmBox('¿Eliminar «' + e.title + '»?', 'Desaparece de la página de Eventos.', 'Eliminar', function () { S().events = S().events.filter(function (x) { return x !== e; }); commit('Evento eliminado'); }); }, 'sm d')]]; })));
  }
  // ---------- Balón de Oro: registro manual + votación de la comunidad ----------
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
    var bar = h('div', 'bar2'); bar.appendChild(h('div', 'sp')); bar.appendChild(btn('+ Crear ' + word, function () { L ? newComp(kind) : newTour(); }, 'o')); b.appendChild(bar);
    if (!L) { if (!list.length) b.appendChild(h('p', 'sub', 'Aún no hay torneos. Pulsa "+ Crear torneo": eliges el formato (Champions, Mundial, eliminatoria o todos contra todos), los equipos y el calendario se genera solo.'));
      else b.appendChild(table(['Nombre', 'Formato', 'Equipos', 'Fase', ''], list.map(function (c) { var F = TF[c.format] || TF.knockout; return [h('b', null, c.name), F.i + ' ' + F.n, String(c.teamIds.length), (c.status === 'paused' ? '⏸ ' : c.status === 'finished' && c.state ? '✓ ' : '') + phaseLabel(c), [btn('Gestionar', function () { tourDlg(c.id); }, c.state && c.state.phase === 'done' ? '' : 'o')]]; }))); return; }
    b.appendChild(table(['Nombre', 'Estado', 'Equipos', L ? 'Puntos (V/D)' : 'Formato', ''], list.map(function (c) { return [h('b', null, c.name), ST[c.status], String(c.teamIds.length), L ? c.config.win + ' / ' + c.config.loss : (c.format === 'knockout' ? 'Eliminatoria · al mejor de ' + c.best_of : c.format === 'groups_knockout' ? 'Mundial · ' + c.gcfg.n + ' grupos, pasan ' + c.gcfg.q : c.format === 'champions' ? 'Champions · liga ida y vuelta + play-off' : 'Todos contra todos'), [btn('Gestionar', function () { compDlg(kind, c.id); })]]; })));
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
          var st = c.state, CH = c.format === 'champions'; box.appendChild(h('h2', 'x', 'Calendario automático'));
          if (CH && !st) { var sp0 = MAGNA.champSplit(c.teamIds.length); box.appendChild(h('p', 'sub', sp0 ? 'Con ' + c.teamIds.length + ' equipos: liga de ida y vuelta (' + (c.teamIds.length - 1) * 2 + ' jornadas) · ' + chTxt(c) + '. Eliminatoria a partido único.' : 'El formato Champions necesita al menos 3 equipos.')); }
          if (!st) { box.appendChild(h('p', 'sub', c.status === 'active' ? 'Genera los cruces según el formato.' : 'Activa el torneo con al menos 2 equipos para generar los cruces.')); var g = btn('Generar calendario', function () { var e = generate(c); if (e) toast(e, true); else { MAGNA.addNews('tournament_bracket', 'Se genera el calendario de ' + c.name + '.'); MAGNA.save(); draw(); render(); } }, 'o'); g.disabled = c.status !== 'active'; box.appendChild(g); }
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
  function rrRounds(n) { return n % 2 ? n : n - 1; }
  function chTxtN(n) { var sp = MAGNA.champSplit(n); if (!sp) return ''; var D = sp.direct, K = sp.playoff;
    return (D === 1 ? '1.º' : '1.º–' + D + '.º') + ' directo a ' + (D === 1 ? 'la final' : MAGNA.koName(D * 2).toLowerCase()) + ', ' + (D + 1) + '.º–' + (D + K) + '.º play-off' + (sp.out ? ', ' + (D + K + 1) + '.º en adelante eliminados' : ''); }
  function chTxt(c) { return chTxtN((c.groups ? c.groups[0].teamIds : c.teamIds).length); }
  // Qué se va a generar con ese formato y esa cantidad de equipos.
  function plan(f, n, g, q, legs) {
    if (n < TF[f].min) return { ok: false, t: 'Elige al menos ' + TF[f].min + ' equipos.' };
    if (f === 'champions') { var R = rrRounds(n), L2 = legs === 1 ? 1 : 2; return { ok: true, t: '<b>' + n + ' equipos</b> · fase de liga de ' + L2 * R + ' jornadas (' + L2 * n * (n - 1) / 2 + ' partidos' + (L2 === 2 ? ', ida y vuelta' : ', solo ida') + ').<br>' + chTxtN(n) + '. Eliminatoria a partido único.' }; }
    if (f === 'groups_knockout') { if (n < g * 2) return { ok: false, t: 'Con ' + g + ' grupos necesitas al menos ' + g * 2 + ' equipos.' }; if (Math.floor(n / g) < q) return { ok: false, t: 'Con ' + n + ' equipos en ' + g + ' grupos no pueden clasificar ' + q + ' por grupo.' }; if (g * q < 2) return { ok: false, t: 'Con 1 grupo deben clasificar al menos 2.' };
      var lo = Math.floor(n / g), hi = Math.ceil(n / g), size = 1; while (size < g * q) size *= 2; return { ok: true, t: '<b>' + n + ' equipos</b> en ' + g + ' grupo' + (g > 1 ? 's' : '') + ' de ' + (lo === hi ? lo : lo + '–' + hi) + ' (sorteo automático). Pasan ' + q + ' por grupo → ' + MAGNA.koName(size).toLowerCase() + '.' }; }
    if (f === 'knockout') { var s = 1; while (s < n) s *= 2; return { ok: true, t: '<b>' + n + ' equipos</b> · primera ronda: ' + MAGNA.koName(s).toLowerCase() + (s > n ? ' (' + (s - n) + ' pasan directo a la siguiente ronda)' : '') + '.' }; }
    return { ok: true, t: '<b>' + n + ' equipos</b> · ' + rrRounds(n) + ' jornadas (' + n * (n - 1) / 2 + ' partidos). Al terminar, el líder es campeón.' };
  }
  // Ediciones: mismo nombre = mismo torneo. Numera las anteriores si aún no tenían número.
  function edInfo(raw) { var base = MAGNA.baseName(raw), k = nk(base), same = S().tournaments.filter(function (c) { return nk(MAGNA.baseName(c.name)) === k; }).sort(function (a, b) { return a.id - b.id; }),
      hist = (S().history || []).filter(function (e) { return nk(MAGNA.baseName(e.name)) === k; }), manual = 0;
    // ediciones ya registradas como trofeos con temporada en romano (OmegaCup IV, V…)
    S().teams.forEach(function (t) { (t.trophies || []).forEach(function (x) { if (nk(MAGNA.baseName(x.name)) === k) { var r = MAGNA.romanNo(x.season); if (r && r > manual) manual = r; if (!same.length && !hist.length) base = MAGNA.baseName(x.name); } }); });
    if (same.length) base = MAGNA.baseName(same[0].name); else if (hist.length) base = MAGNA.baseName(hist[0].name); // se respeta cómo se escribió la primera edición
    var start = Math.max(manual, hist.length), last = start;
    same.forEach(function (c) { var e = MAGNA.editionNo(c.name); last = e ? Math.max(last, e) : last + 1; });
    var n = (same.length || start) ? last + 1 : 1;
    return { base: base, n: n, prev: n - 1, name: n > 1 ? MAGNA.editionName(base, n) : base, number: function () { var x = start; same.forEach(function (c) { if (MAGNA.editionNo(c.name) == null) c.name = MAGNA.editionName(base, ++x); else x = Math.max(x, MAGNA.editionNo(c.name)); }); } }; }
  function webLink(c) { return TF[c.format] ? TF[c.format].p + (c.format === 'champions' ? '?t=' + c.id : '') : 'competiciones.html'; }
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
      Object.keys(TF).forEach(function (k) { var x = TF[k], c = h('button', 'tf-card'); c.type = 'button'; c.dataset.f = k; c.appendChild(h('em', null, x.i)); c.appendChild(h('b', null, x.n)); c.appendChild(h('span', null, x.d)); c.onclick = function () { f = k; upd(); }; grid.appendChild(c); });
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
  function stepIx(c) { var st = c.state, s = steps(c); if (!st) return c.teamIds.length < (TF[c.format] || TF.knockout).min ? 0 : 1; if (st.phase === 'done') return s.length - 1;
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
        box.innerHTML = ''; var st = c.state, F = TF[c.format] || TF.knockout, sx = stepIx(c);
        var hd = h('div', 'tf-head'); hd.appendChild(h('span', 'tf-badge', F.i + ' ' + F.n)); hd.appendChild(h('span', 'tf-badge', ST[c.status] + ' · ' + c.teamIds.length + ' equipos'));
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
            act.appendChild(btn('Cargar resultados', function () { MF = 'tournament:' + c.id; close(); go('partidos'); }, 'o')); }
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
  function matchDlg(m) {
    if (m) return ask('Reprogramar partido', [{ k: 'a', label: 'Fecha y hora (hora de ' + ((window.MAGNA_TZ && MAGNA_TZ.label) || 'tu zona') + ')', type: 'datetime-local', value: toLocal(m.at) }, { k: 'r', label: 'Ronda / jornada', value: m.round || '' }], function (v) { var at = toUtc(v.a); if (at === undefined) return 'Fecha no válida.'; var e = conflict(m, at, m.home, m.away, v.r.trim()); if (e) return e; m.at = at; m.round = v.r.trim(); commit('Partido actualizado'); });
    var comps = S().leagues.filter(function (c) { return c.status !== 'finished' && c.teamIds.length >= 2; }).map(function (c) { return ['league:' + c.id, 'Liga · ' + c.name]; }).concat(S().tournaments.filter(function (c) { return c.status !== 'finished' && c.teamIds.length >= 2; }).map(function (c) { return ['tournament:' + c.id, 'Torneo · ' + c.name]; }));
    if (S().teams.length >= 2) comps.push(['friendly:0', 'Amistoso (cualquier equipo · 5.000 pts para ambos)']);
    if (!comps.length) return toast('Necesitas al menos 2 equipos registrados.', true);
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
  function marketCard() {
    var ms = MAGNA.marketState(), c = h('div', 'mkt' + (ms.open ? ' on' : ''));
    var tx = h('div'); tx.appendChild(h('span', 'mkt-s', ms.open ? '● Mercado abierto' : '● Mercado cerrado'));
    tx.appendChild(h('p', 'hint', ms.open ? 'Los equipos pueden fichar jugadores libres.' + (ms.closes ? ' Se cierra solo el ' + fdate(ms.closes) + '.' : ' Ciérralo cuando termine el periodo de fichajes.') : ms.expired ? 'Se cerró solo en la fecha que pusiste. Ábrelo de nuevo cuando quieras.' : 'Nadie puede fichar hasta que lo abras. Retirar jugadores sí está permitido.')); c.appendChild(tx);
    var bx = h('div', 'mkt-b');
    if (ms.open) { bx.appendChild(btn('Cambiar fecha de cierre', function () { closesDlg(); }, 'sm')); bx.appendChild(btn('Cerrar mercado', function () { confirmBox('¿Cerrar el mercado de fichajes?', 'Ningún equipo podrá fichar hasta que lo abras de nuevo.', 'Cerrar mercado', function () { S().market = { open: false }; MAGNA.addNews('market', 'Se cierra el mercado de fichajes.'); commit('Mercado cerrado'); }); }, 'd')); }
    else bx.appendChild(btn('Abrir mercado de fichajes', function () { closesDlg(true); }, 'o'));
    c.appendChild(bx); return c;
  }
  function closesDlg(opening) {
    var ms = MAGNA.marketState();
    ask(opening ? 'Abrir mercado de fichajes' : 'Fecha de cierre', [{ k: 'c', label: 'Se cierra solo el (opcional, hora de ' + ((window.MAGNA_TZ && MAGNA_TZ.label) || 'tu zona') + ')', type: 'datetime-local', value: ms.closes ? toLocal(ms.closes) : '' }], function (v) {
      var cl = v.c ? toUtc(v.c) : null; if (cl === undefined) return 'Fecha no válida.'; if (cl && Date.parse(cl.replace(' ', 'T') + 'Z') <= Date.now()) return 'La fecha de cierre debe ser en el futuro.';
      S().market = { open: true, since: opening ? MAGNA.now() : (S().market && S().market.since) || MAGNA.now(), closes: cl };
      if (opening) MAGNA.addNews('market', '¡Se abre el mercado de fichajes!' + (cl ? ' Cierra el ' + fdate(cl) + '.' : ''));
      commit(opening ? 'Mercado abierto' : 'Fecha de cierre actualizada'); }, opening ? 'Abrir mercado' : 'Guardar', opening ? 'Mientras esté abierto, los equipos pueden fichar jugadores libres de su nivel. Si pones una fecha, se cierra solo.' : null);
  }
  // ---------- economía ----------
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
  // ---------- respaldos automáticos en la nube (tabla backups + pg_cron diario) ----------
  var BKK = { auto: ['🕒', 'Automático'], manual: ['💾', 'Manual'], 'pre-restore': ['↩️', 'Antes de restaurar'] };
  function bkSize(n) { return n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB'; }
  function bkWhen(at) { var d = new Date(at), m = Math.round((Date.now() - d) / 60000); return m < 1 ? 'hace un momento' : m < 60 ? 'hace ' + m + ' min' : m < 1440 ? 'hace ' + Math.round(m / 60) + ' h' : d.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' }) + ' · ' + d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }); }
  function bkFirst(note, then) { toast('Guardando un respaldo…'); evRpc('admin_backup_now', { p_note: note }).then(function () { then(); }, function (e) { confirmBox('No se pudo guardar el respaldo', (e && e.message ? e.message + '. ' : '') + '¿Quieres continuar de todos modos?', 'Continuar', then); }); }
  function bkRestore(x) {
    dialog('Restaurar respaldo', function (b, close) {
      var c = x.counts || {};
      b.appendChild(h('p', 'hint', (BKK[x.kind] || ['•'])[0] + ' ' + new Date(x.at).toLocaleString('es', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) + (x.note ? ' · ' + x.note : '')));
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
        L.forEach(function (x, i) { var k = BKK[x.kind] || ['•', x.kind], c = x.counts || {}, r = h('div', 'bk-row' + (i === 0 ? ' new' : ''));
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
    function drawAdm() { cl.innerHTML = ''; (ACCS || []).filter(function (a) { return a.role === 'admin'; }).forEach(function (a) { var r = h('div', 'ur'), w = h('div', 'w'); w.appendChild(h('b', null, a.display_name + ' · ' + a.username)); r.appendChild(w); r.appendChild(btn('Ver código', function () { showCode('Acceso de ' + a.display_name, a, 'El código es fijo: no caduca y no se puede cambiar.'); }, 'sm'));
        r.appendChild(btn('Eliminar para siempre', function () { confirmBox('¿Eliminar el acceso de ' + a.display_name + '?', 'Su cuenta se borra para siempre y ya no podrá entrar.', 'Eliminar', function () { ACCOUNTS.manage('delete', { id: a.id }).then(function () { toast('Acceso eliminado'); loadAccs(drawAdm); }, function (e) { toast(e.message, true); }); }); }, 'd sm')); cl.appendChild(r); });
      var ad = btn('+ Crear administrador', function () { ask('Nuevo administrador', [{ k: 'n', label: 'Nombre', maxlength: 40 }], function (v) { var n = okName(v.n, 2, 40); if (!n) return 'Escribe un nombre de 2 a 40 caracteres.'; return ACCOUNTS.manage('create', { display_name: n, username: n, role: 'admin' }).then(function (acc) { loadAccs(drawAdm); showCode('Acceso de ' + n, acc, 'Pásale estos datos. Podrá entrar al panel con ellos.'); }, function (e) { return e.message; }); }, 'Crear'); }, 'o'); var ar = h('div'); ar.appendChild(ad); cl.appendChild(ar); }
    loadAccs(drawAdm);
    b.appendChild(h('h2', 'x', 'Zona delicada'));
    var z = h('div', 'bar2'); z.appendChild(btn('Cargar datos de ejemplo', function () { confirmBox('¿Cargar datos de ejemplo?', 'Reemplaza TODOS los datos del sitio por equipos y partidos de ejemplo. Antes se guarda un respaldo en la nube para que puedas volver atrás.', 'Cargar', function () { bkFirst('Antes de cargar datos de ejemplo', demo); }); }, 'warn'));
    z.appendChild(btn('Vaciar todo', function () { confirmBox('¿Vaciar todos los datos?', 'Se borran equipos, jugadores, competiciones, partidos y noticias del sitio. Antes se guarda un respaldo en la nube para que puedas volver atrás.', 'Vaciar', function () { bkFirst('Antes de vaciar todo', function () { MAGNA.replace(MAGNA.clone(MAGNA.EMPTY)); render(); banner(); }); }); }, 'd')); b.appendChild(z);
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
    play: '<path d="M7 4l13 8-13 8V4z"/>',
    star: '<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9L12 3z"/>'
  };
  function icon(k) { var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true'); s.innerHTML = IC[k] || ''; return s; }
  function fdate(at) { return at ? new Date(at.replace(' ', 'T') + 'Z').toLocaleString('es', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Sin fecha'; }
  function compName(m) { var c = MAGNA.compOf(m); return c ? c.name : '—'; }
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
  // Jugadores en cancha (alineación del partido + los que entraron de cambio), luego el resto de la plantilla.
  function onField(m, side) { var L = m.live || {}, ids = ((L.lineup && L.lineup[side]) || []).slice(); (L.ev || []).forEach(function (e) { if (e.k === 'sub' && e.side === side) { if (e.in && ids.indexOf(e.in) < 0) ids.push(e.in); if (e.out) ids = ids.filter(function (x) { return x !== e.out; }); } }); return ids; }
  function scorerPick(m, side, cur, onPick, noneLabel) {
    var tid = side === 'a' ? m.away : m.home, sq = squadOf(tid), on = onField(m, side), L = m.live || {}, goals = {};
    (L.ev || []).forEach(function (e) { if (e.k === 'goal' && e.side === side && e.player) goals[e.player] = (goals[e.player] || 0) + 1; });
    var list = sq.slice().sort(function (a, b) { return (on.indexOf(b.id) >= 0) - (on.indexOf(a.id) >= 0); }), pk = h('div', 'pick gpick');
    if (!list.length) pk.appendChild(h('p', 'hint', MAGNA.teamName(tid) + ' no tiene jugadores registrados. Agrégalos en Jugadores para poder elegir goleador.'));
    list.forEach(function (p) { var x = h('button', cur === p.id ? 'on' : ''); x.type = 'button'; var av = h('span', 'gav', p.name.slice(0, 2).toUpperCase()); x.appendChild(av);
      var tx = h('span', 'gtx'); tx.appendChild(h('b', null, p.name)); tx.appendChild(h('em', null, on.indexOf(p.id) >= 0 ? 'En cancha' : p.slot === 'reserve' ? 'Suplente' : 'Plantilla')); x.appendChild(tx);
      if (goals[p.id]) x.appendChild(h('small', null, '⚽ ' + goals[p.id])); x.onclick = function () { onPick(p.id); }; pk.appendChild(x); });
    var nb = h('button', 'gnone' + (cur === null ? ' on' : '')); nb.type = 'button'; nb.textContent = noneLabel; nb.onclick = function () { onPick(null); }; pk.appendChild(nb);
    return pk;
  }
  function goalDlg(m, side) {
    var tid = side === 'a' ? m.away : m.home;
    dialog('⚽ Gol de ' + MAGNA.teamName(tid), function (b, close) {
      b.appendChild(h('p', 'sub', '¿Quién anotó? Toca al goleador: suma el gol al marcador y a sus estadísticas.'));
      b.appendChild(scorerPick(m, side, undefined, function (pid) { close(); liveAct(m, function () { if (side === 'a') m.as = (m.as || 0) + 1; else m.hs = (m.hs || 0) + 1; addEv(m, { k: 'goal', side: side, player: pid || null, score: m.hs + '-' + m.as }); }, pid ? '¡Gol de ' + MAGNA.playerName(pid) + '!' : '¡Gol registrado!'); }, 'Gol sin goleador (lo eliges después)'));
    });
  }
  // Cambiar el goleador de un gol ya registrado (desde el minuto a minuto).
  function scorerEdit(m, ev) {
    dialog('Cambiar goleador', function (b, close) {
      b.appendChild(h('p', 'sub', 'Gol de ' + MAGNA.teamName(ev.side === 'a' ? m.away : m.home) + (ev.min ? ' al ' + ev.min + "'" : '') + (ev.score ? ' (' + ev.score + ')' : '') + '. El marcador no cambia.'));
      b.appendChild(scorerPick(m, ev.side, ev.player || null, function (pid) { close(); liveAct(m, function () { ev.player = pid || null; }, 'Goleador actualizado'); }, 'Sin goleador'));
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
    var cg = h('div', 'cg');
    if (m.sets && m.sets.length) {
      var ss = MAGNA.setScore(m), hd4 = h('h4', null, 'Sets · ' + MAGNA.teamName(m.home) + ' ' + ss.h + ' - ' + ss.a + ' ' + MAGNA.teamName(m.away)); cg.appendChild(hd4);
      var sl = h('div', 'live-sets');
      m.sets.forEach(function (x, i) { var cur = L.set === i + 1, r = h('div', 'lset' + (cur ? ' cur' : '') + (x.w ? ' done' : '')); r.style.setProperty('--mc', MAGNA.MODE_COLOR[x.mode] || 'var(--line)');
        var tx = h('div'); tx.appendChild(h('b', null, 'Set ' + (i + 1) + (cur ? ' · jugando' : ''))); tx.appendChild(h('small', null, MAGNA.setLabel(x))); r.appendChild(tx);
        var bx = h('div', 'lsb');
        if (!x.w) { var pl = btn(cur ? 'En juego' : '▶ Jugar', function () { if (!x.mode) return toast('Primero elige el modo de este set en "Editar sets".', true); liveAct(m, function () { var LL = ensureLive(m); LL.set = i + 1; LL.mode = x.mode; LL.map = x.map || null; addEv(m, { k: 'mode', set: i + 1, mode: x.mode, map: x.map || null }); }, 'Set ' + (i + 1) + ': ' + x.mode); }, cur ? 'o sm' : 'sm'); pl.disabled = fin || cur; bx.appendChild(pl);
          ['h', 'a'].forEach(function (sd) { var wb = btn('Ganó ' + MAGNA.teamName(sd === 'h' ? m.home : m.away), function () { liveAct(m, function () { x.w = sd; var sc = MAGNA.setScore(m); addEv(m, { k: 'set', set: i + 1, side: sd, score: sc.h + '-' + sc.a }); }, 'Set ' + (i + 1) + ' para ' + MAGNA.teamName(sd === 'h' ? m.home : m.away)); }, 'sm'); wb.disabled = fin || m.status !== 'live'; bx.appendChild(wb); }); }
        else { bx.appendChild(h('span', 'won', '✓ ' + MAGNA.teamName(x.w === 'h' ? m.home : m.away))); if (!fin) bx.appendChild(btn('Deshacer', function () { liveAct(m, function () { delete x.w; }, 'Set ' + (i + 1) + ' sin ganador'); }, 'sm')); }
        r.appendChild(bx); sl.appendChild(r); });
      cg.appendChild(sl); var eb = h('div', 'bar2'); eb.appendChild(btn('Editar sets', function () { setsDlg(m); }, 'sm')); cg.appendChild(eb);
    } else {
      cg.appendChild(h('h4', null, 'Modo de juego')); var md = h('div', 'modes');
      MAGNA.MODES.forEach(function (mo) { var x = h('button', 'mo' + (L.mode === mo ? ' on' : ''), mo); x.type = 'button'; x.disabled = fin; x.onclick = function () { if (L.mode === mo) return; liveAct(m, function () { ensureLive(m).mode = mo; ensureLive(m).map = null; addEv(m, { k: 'mode', mode: mo }); }, 'Modo: ' + mo); }; md.appendChild(x); });
      cg.appendChild(md); var eb2 = h('div', 'bar2'); eb2.appendChild(btn('Planear sets con modos y mapas', function () { setsDlg(m); }, 'sm')); cg.appendChild(eb2);
    }
    con.appendChild(cg);
    // controles
    var cc = h('div', 'cg'); cc.appendChild(h('h4', null, 'Control del partido')); var ct = h('div', 'ctrl');
    function cbtn(txt, cls, dis, fn) { var x = h('button', 'cb ' + cls, txt); x.type = 'button'; x.disabled = dis; x.onclick = fn; ct.appendChild(x); }
    var comp = MAGNA.compOf(m);
    cbtn('▶ Iniciar partido', 'o', m.status !== 'scheduled', function () { if (comp && comp.status === 'finished') return toast('La competición ya finalizó.', true); liveAct(m, function () { var l = ensureLive(m); m.status = 'live'; m.hs = 0; m.as = 0; l.phase = '1T'; l.lineup = { h: lineup(m.home), a: lineup(m.away) }; l.clock = { acc: 0, since: Date.now(), run: true }; addEv(m, { k: 'start' }); MAGNA.addNews('match_live', 'En vivo: ' + MAGNA.teamName(m.home) + ' vs ' + MAGNA.teamName(m.away) + '.'); }, '¡Partido en marcha!'); });
    cbtn('⏸ Entretiempo', 'y', !live || L.phase !== '1T', function () { liveAct(m, function () { var c = m.live.clock; c.acc += Date.now() - c.since; c.run = false; c.since = null; m.live.phase = 'HT'; addEv(m, { k: 'ht' }); }, 'Entretiempo'); });
    cbtn('▶ 2.º tiempo', 'g', !live || L.phase !== 'HT', function () { liveAct(m, function () { m.live.phase = '2T'; m.live.clock.since = Date.now(); m.live.clock.run = true; addEv(m, { k: 'resume' }); }, 'Comienza el 2.º tiempo'); });
    cbtn('⇄ Sustitución', '', !live, function () { subDlg(m); });
    cbtn('■ Finalizar', 'r', !live, function () { if ((m.hs || 0) === (m.as || 0)) return toast('No hay empates: registra el gol decisivo antes de finalizar.', true);
      confirmBox('¿Finalizar el partido?', MAGNA.teamName(m.home) + ' ' + m.hs + ' - ' + m.as + ' ' + MAGNA.teamName(m.away) + '. El resultado cuenta para la tabla.', 'Finalizar', function () { liveAct(m, function () { var c = m.live.clock; if (c.run) { c.acc += Date.now() - c.since; c.run = false; c.since = null; } addEv(m, { k: 'end', score: m.hs + '-' + m.as }); m.live.phase = 'FT'; m.status = 'finished'; m.ended = MAGNA.now(); MAGNA.addNews('match_result', 'Final: ' + MAGNA.teamName(m.home) + ' ' + m.hs + ' - ' + m.as + ' ' + MAGNA.teamName(m.away) + ' (' + compName(m) + ').'); }, 'Partido finalizado'); mvpDlg(m, true); }); });
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
    var ICO = { start: '▶', goal: '⚽', mode: '🎮', set: '✔', sub: '⇄', ht: '⏸', resume: '▶', end: '🏁' };
    (L.ev || []).slice().reverse().forEach(function (e) { var r = h('div', 'ev' + (e.k === 'goal' ? ' goal' : '')); r.appendChild(h('span', 'mn', e.min ? e.min + "'" : '')); r.appendChild(h('span', 'ic', ICO[e.k] || '•')); var et = h('span', null, MAGNA.eventText(m, e)); r.appendChild(et); r.appendChild(h('time', null, (e.at || '').slice(11, 16))); if (e.k === 'goal') { var eb = h('button', 'evx', e.player ? '✎ Goleador' : '+ Elegir goleador'); eb.type = 'button'; eb.title = 'Elegir o cambiar quién anotó'; eb.onclick = function () { scorerEdit(m, e); }; et.appendChild(eb); } tl.appendChild(r); });
    if (!(L.ev || []).length) tl.appendChild(h('p', 'hint', 'Aquí aparecerá cada acción del partido.'));
    tlw.appendChild(tl); con.appendChild(tlw); wrap.appendChild(con); b.appendChild(wrap);
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
  function render() {
    if (TICK) { clearInterval(TICK); TICK = null; }
    var sd = document.getElementById('side'); sd.innerHTML = ''; var grp = null, cur = null;
    TABS.forEach(function (t) { if (t.g !== grp) { grp = t.g; cur = h('div', 'sg'); cur.appendChild(h('h4', null, t.g)); sd.appendChild(cur); }
      var x = h('button', 'si' + (t.id === tab ? ' on' : '')); x.type = 'button'; x.appendChild(icon(t.i)); x.appendChild(h('span', null, t.l)); var n = t.ct ? t.ct() : 0; if (n) x.appendChild(h('span', 'ct' + ((typeof t.dim === 'function' ? t.dim() : t.dim) ? ' dim' : ''), n)); x.onclick = function () { go(t.id); }; cur.appendChild(x); });
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
  window.addEventListener('magna:update', function (e) { if (e.detail && e.detail.remote) { render(); banner(); if (e.detail.why === 'remote') toast('Se actualizaron los datos: un coach hizo cambios en su equipo.'); } });
  window.addEventListener('magna:conflict', function () { toast('Tu último cambio no se guardó porque un coach acababa de modificar los datos. Ya se recargaron: vuelve a hacerlo.', true); });
})();
