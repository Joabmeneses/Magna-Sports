'use strict';
(function () {
  var h = M.h, S = function () { return MAGNA.S; }, by = MAGNA.by, view = document.getElementById('view'), tab = /^#(crear-noticia|noticias)$/.test(location.hash) ? 'noticias' : 'resumen';
  if (location.hash === '#crear-noticia') window.__newsOpenEditor = true;
  // registro de actividad: cada aviso de "hecho" del panel queda anotado con quién, cuándo y en qué sección
  var NOLOG = /…|\.\.\.|^Todo al día|^Copiando|^Preparando|^Guardando|^Cargando|^Se actualizaron|^No |^Primero|^Escribe|^Elige|^Todavía|^Esta |^Ese |^Reintent/;
  function alog(section, action) { if (!window.MAGNA_SB || !window.MAGNA_ADMIN || !action) return; MAGNA_SB().then(function (c) { return c.rpc('admin_log_add', { p_section: section, p_action: String(action).slice(0, 300) }); }).catch(function () {}); }
  function toastLog(m) { try { if (!m || NOLOG.test(m)) return; var T = typeof tabOf === 'function' && tabOf(tab), sec = T ? T.l : 'Panel', pre = '';
      if (tab === 'vivo' && LIVE != null) { var lm = MAGNA.by(S().matches, LIVE); if (lm) pre = MAGNA.teamName(lm.home) + ' vs ' + MAGNA.teamName(lm.away) + ': '; }
      alog(sec, pre + m); } catch (e) {} }
  function toast(m, bad) { if (!bad) toastLog(m); var box = document.getElementById('toasts'), t = h('div', 'ts' + (bad ? ' bad' : ''), m); while (box.children.length >= 2) box.firstChild.remove(); box.appendChild(t); setTimeout(function () { t.remove(); }, bad ? 4200 : 2600); }
  function commit(msg) { if (!MAGNA.save()) toast('No se pudo guardar en este navegador (¿modo privado?).', true); else if (msg) toast(msg); render(); banner(); if (window.ADMIN_EXCL) ADMIN_EXCL(); try { document.dispatchEvent(new Event('adm:commit')); } catch (e) {} }
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
  var TQ = '', TSORT = 'pts', TFL = '';
  function teamsV(b) {
    var T = S().teams, PT = MAGNA.teamPoints(), PSx = MAGNA.playerStats(), sq = function (t) { return S().players.filter(function (p) { return p.teamId === t.id; }); };
    var noDt = T.filter(function (t) { return !t.coach; }).length, inc = T.filter(function (t) { return sq(t).length < 4; }).length, troT = T.reduce(function (n, t) { return n + MAGNA.teamTrophies(t.id).length; }, 0);
    ppSum(b, [[T.length, 'Equipos', '#8b5cf6'], [T.length - noDt + '/' + T.length, 'Con DT', '#2ee59d', function () { TFL = TFL === 'nodt' ? '' : 'nodt'; render(); }, TFL === 'nodt'], [inc, 'Plantillas incompletas', '#ffd23f', function () { TFL = TFL === 'inc' ? '' : 'inc'; render(); }, TFL === 'inc'], [troT, 'Trofeos repartidos', '#ff9a1f']]);
    var bar = h('div', 'pp-bar'); bar.appendChild(ppSearch('Buscar equipo o DT…', TQ, function (v) { TQ = v; filt(); }));
    var so = h('select', 'pp-so'); [['pts', 'Orden: ranking'], ['name', 'Orden: nombre'], ['tro', 'Orden: trofeos'], ['sq', 'Orden: plantilla']].forEach(function (x) { var o = h('option', null, x[1]); o.value = x[0]; so.appendChild(o); }); so.value = TSORT; so.onchange = function () { TSORT = so.value; render(); }; bar.appendChild(so);
    var acts = h('div', 'pp-acts'); acts.appendChild(btn('Cargar puntos de ranking', basePtsDlg)); acts.appendChild(btn('+ Nuevo equipo', function () {
      if (formsApi()) return ADMIN_FORMS.team();
      ask('Nuevo equipo', [{ k: 'n', label: 'Nombre', maxlength: 30 }, { k: 'i', label: 'Descripción (opcional)', type: 'textarea' }, { k: 'f', label: 'Foto o escudo (opcional; se reduce sola)', type: 'file' }], function (v) {
        var n = okName(v.n, 2, 30); if (!n) return 'Nombre no válido (2 a 30 caracteres).'; if (S().teams.some(function (t) { return nk(t.name) === nk(n); })) return 'Ya existe un equipo con ese nombre.';
        return readImg(v.f).then(function (img) { var e = imgErr(img); if (e) return e;
          var t = { id: MAGNA.id(), name: n, info: (v.i || '').slice(0, 300), crest: img || null, budget: 0, coach: null }; S().teams.push(t); MAGNA.addNews('team_created', 'Nace un nuevo equipo: ' + n + '.'); commit('Equipo creado'); }); }, 'Crear');
    }, 'o')); bar.appendChild(acts); b.appendChild(bar);
    b.appendChild(ppChips([['', 'Todos', T.length], ['nodt', 'Sin DT', noDt, '#ff6b74'], ['inc', 'Plantilla incompleta', inc, '#ffd23f']], TFL, function (k) { TFL = k; render(); }));
    var info = h('p', 'pp-inf'); b.appendChild(info);
    var rk = T.slice().sort(function (x, y) { return ((PT[y.id] || {}).pts || 0) - ((PT[x.id] || {}).pts || 0); }).map(function (x) { return x.id; });
    var list = T.slice().sort(function (x, y) { return TSORT === 'name' ? x.name.localeCompare(y.name) : TSORT === 'tro' ? MAGNA.teamTrophies(y.id).length - MAGNA.teamTrophies(x.id).length : TSORT === 'sq' ? sq(y).length - sq(x).length : rk.indexOf(x.id) - rk.indexOf(y.id); });
    var grid = h('div', 'pp-grid tm-grid'), cards = [];
    list.forEach(function (t, i) {
      var c = by(S().players, t.coach), pl = sq(t), tro = MAGNA.teamTrophies(t.id).length, tc = MAGNA.teamColor(t.id), pos = rk.indexOf(t.id) + 1;
      var cd = h('div', 'pp-c tm-c'); cd.style.setProperty('--tc', tc); cd.style.animationDelay = Math.min(i, 12) * 30 + 'ms';
      var hd = h('div', 'tm-hd'); hd.appendChild(h('span', 'tm-wm', t.name)); hd.appendChild(M.crest(t.id, t.name, 58)); var nm = h('div', 'pp-nm'); nm.appendChild(h('b', null, t.name));
      nm.appendChild(c ? h('small', null, 'DT: ' + c.name) : h('small', 'tm-warn', '⚠ Sin DT asignado')); hd.appendChild(nm);
      var rkb = h('div', 'tm-rk'); rkb.appendChild(h('b', null, '#' + pos)); rkb.appendChild(h('small', null, String((PT[t.id] || {}).pts || 0).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' pts')); hd.appendChild(rkb); cd.appendChild(hd);
      var sl = h('div', 'tm-sq'); for (var k = 0; k < 4; k++) { var p = pl[k], d = h('span', 'tm-sl' + (p ? ' on' : '')); if (p) { d.appendChild(M.tierAv(p.name, (PSx[p.id] || {}).media == null ? 10 : PSx[p.id].media, 26, p.id)); d.appendChild(h('em', null, p.name)); d.title = p.name; } else d.appendChild(h('em', null, 'Libre')); sl.appendChild(d); } cd.appendChild(sl);
      var st = h('div', 'pp-st'); [[pl.length + '/4', 'Plantilla'], [tro, 'Trofeos'], [t.budget || 0, 'Bucks'], [t.level ? ((MAGNA.TIERS[MAGNA.tierRank(t.level)] || [])[1] || t.level) : '—', 'Fichajes']].forEach(function (x) { var dd = h('div'); dd.appendChild(h('b', null, String(x[0]))); dd.appendChild(h('small', null, x[1])); st.appendChild(dd); }); cd.appendChild(st);
      var ft = h('div', 'pp-ft tm-ft'); ft.appendChild(ibtn('users', 'Plantilla', function () { squadDlg(t.id); })); ft.appendChild(ibtn('trophy', 'Trofeos', function () { trophyDlg(t.id); })); ft.appendChild(ibtn('img', 'Banner', function () { bannerDlg(t); })); ft.appendChild(ibtn('edit', 'Editar', function () { editTeam(t); }));
      ft.appendChild(h('span', 'sp')); ft.appendChild(ibtn('open', null, function () { window.open('equipo.html?id=' + t.id, '_blank'); })); ft.lastChild.title = 'Ver página'; ft.lastChild.setAttribute('aria-label', 'Ver página de ' + t.name); ft.appendChild(ibtn('trash', null, function () { delTeam(t); }, 'del')); ft.lastChild.title = 'Eliminar equipo'; cd.appendChild(ft);
      cd._k = nk(t.name + ' ' + (c ? c.name : '')); cd._f = { nodt: !t.coach, inc: pl.length < 4 }; cards.push(cd); grid.appendChild(cd); });
    b.appendChild(grid);
    function filt() { var q = nk(TQ), n = 0; cards.forEach(function (cd) { var on = (!q || cd._k.indexOf(q) >= 0) && (!TFL || cd._f[TFL]); cd.hidden = !on; if (on) n++; }); info.textContent = n === cards.length ? n + ' equipos' : 'Mostrando ' + n + ' de ' + cards.length + ' equipos'; }
    filt();
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
    ask('Editar ' + t.name, [{ k: 'n', label: 'Nombre', value: t.name, maxlength: 30 }, { k: 'i', label: 'Descripción', type: 'textarea', value: t.info }, { k: 'b', label: 'Bucks para fichajes', type: 'number', value: t.budget, min: 0 }, { k: 'f', label: 'Foto o escudo (déjalo vacío para no cambiarlo; se reduce sola)', type: 'file' }, { k: 'x', label: 'Quitar la foto actual', type: 'checkbox' }], function (v) {
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
  function giftDlg(pre, o) {
    if (ACCS === null) return loadAccs(function () { giftDlg(pre, o); });
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
      if (o) { if (o.amt) amt.value = o.amt; if (o.msg) msg.value = o.msg; }
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
  var PICO = { tv: '<rect x="3" y="6" width="18" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 2l4 4 4-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>', copy: '<rect x="8" y="8" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" fill="none" stroke="currentColor" stroke-width="2"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="currentColor"/>',
    gift: '<rect x="3" y="9" width="18" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 13h18M12 9v12M12 9c-2-4-6-4-6-1.5S10 9 12 9c2 0 6 .5 6-1.5S14 5 12 9z" fill="none" stroke="currentColor" stroke-width="2"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16v4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    trophy: '<path d="M7 4h10v4a5 5 0 01-10 0V4zM7 6H4a3 3 0 003 4M17 6h3a3 3 0 01-3 4M12 13v4M8 21h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    user: '<circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6" fill="none" stroke="currentColor" stroke-width="2"/>',
    open: '<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 10h18M8 3v4M16 3v4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    score: '<rect x="3" y="5" width="18" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 5v14M7 10v4M15.5 10h2v4h-2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    sets: '<path d="M4 6h16M4 12h16M4 18h10" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="19" cy="18" r="2" fill="currentColor"/>',
    img: '<rect x="3" y="5" width="18" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 16l5-5 4 4 3-3 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="16" cy="9" r="1.6" fill="currentColor"/>',
    play: '<path d="M7 4.5v15l12-7.5z" fill="currentColor"/>',
    ban: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M6 6l12 12" stroke="currentColor" stroke-width="2"/>',
    undo: '<path d="M9 7H5V3M5 7a8 8 0 11-1 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    users: '<circle cx="9" cy="8" r="3.4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 20c.7-3.5 3-5 6-5s5.3 1.5 6 5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17" cy="9" r="2.6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M17 14c2.2 0 3.6 1.2 4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>',
    gear: '<circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    plus: '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>' };
  function ppSum(b, rows) { var sum = h('div', 'pp-sum'); rows.forEach(function (x) { var d = h(x[3] ? 'button' : 'div', x[4] ? 'on' : null); if (x[3]) { d.type = 'button'; d.onclick = x[3]; } d.style.setProperty('--c', x[2]); d.appendChild(h('b', null, String(x[0]))); d.appendChild(h('small', null, x[1])); sum.appendChild(d); }); b.appendChild(sum); return sum; }
  function ppSearch(ph, val, on) { var q = h('label', 'pp-q'); q.innerHTML = '<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 20l-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'; var qi = h('input'); qi.type = 'search'; qi.placeholder = ph; qi.value = val || ''; qi.oninput = function () { on(qi.value); }; q.appendChild(qi); return q; }
  function ppChips(list, cur, on) { var w = h('div', 'pp-chips'); list.forEach(function (x) { var c = h('button', 'pp-ch' + (x[0] === cur ? ' on' : '')); c.type = 'button'; if (x[3]) c.style.setProperty('--cc', x[3]); c.appendChild(document.createTextNode(x[1])); if (x[2] != null) c.appendChild(h('small', null, String(x[2]))); c.onclick = function () { on(x[0]); }; w.appendChild(c); }); return w; }
  function stack(ids, n) { var w = h('div', 'cx-stack'); ids.slice(0, n || 6).forEach(function (id) { w.appendChild(M.crest(id, MAGNA.teamName(id), 30)); }); if (ids.length > (n || 6)) w.appendChild(h('span', 'more', '+' + (ids.length - (n || 6)))); return w; }
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
  // ---------- Planes (planes.html) ----------
  var EVK = { torneo: '🏆 Torneo', amistoso: '🤝 Amistosos', especial: '🎉 Especial', stream: '📺 Transmisión', premio: '🥇 Premiación', comunidad: '🗣️ Comunidad' }, EVC = null;
  // ---------- predicción de la llave: tabla y premios en Bits ----------
  function evRpc(n, a) { return window.MAGNA_SB().then(function (c) { return c.rpc(n, a); }).then(function (r) { if (r && r.error) throw r.error; return r.data; }); }
  // ---------- Balón de Oro: registro manual + votación de la comunidad ----------
  // ---------- competiciones ----------
  var ST = { draft: 'Borrador', active: 'Activa', paused: 'Pausada', finished: 'Finalizada' }, NEXT = { draft: [['active', 'Activar']], active: [['paused', 'Pausar'], ['finished', 'Finalizar']], paused: [['active', 'Reanudar'], ['finished', 'Finalizar']], finished: [] };
  // ---------- torneos: asistente de creación y panel paso a paso ----------
  var TF = {
    champions: { i: '⭐', n: 'Champions', d: 'Una tabla de liga con las jornadas que creas tú, y después los cruces que tú elijas.', p: 'champions.html', min: 3 },
    groups_knockout: { i: '🌍', n: 'Mundial', d: 'Fase de grupos y después eliminatoria con los mejores de cada grupo.', p: 'mundial.html', min: 2 },
    knockout: { i: '⚔️', n: 'Eliminatoria directa', d: 'Cuadro de cruces: quien pierde queda fuera. A partido único o a ida y vuelta.', p: 'competiciones.html', min: 2 },
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
  var MST = 'up', MQ = '', MMORE = {};
  function matchesV(b) {
    reqCard(b);
    var comps = S().leagues.map(function (c) { return ['league:' + c.id, 'Liga · ' + c.name]; }).concat(S().tournaments.map(function (c) { return ['tournament:' + c.id, 'Torneo · ' + c.name]; })).concat([['friendly:0', 'Amistosos']]);
    var base = S().matches.filter(function (m) { return !MF || (m.type + ':' + m.cid) === MF; }), cnt = { live: 0, scheduled: 0, finished: 0, cancelled: 0 }, nod = 0;
    base.forEach(function (m) { cnt[m.status] = (cnt[m.status] || 0) + 1; if (m.status === 'scheduled' && !m.at) nod++; });
    var stf = function (k) { return function () { MST = MST === k ? 'all' : k; render(); }; };
    ppSum(b, [[cnt.live, 'En vivo', '#ff3b47', stf('live'), MST === 'live'], [cnt.scheduled, 'Próximos', '#22d3ee', stf('up'), MST === 'up'], [cnt.finished, 'Terminados', '#2ee59d', stf('fin'), MST === 'fin'], [nod, 'Sin fecha', '#ffd23f', stf('nod'), MST === 'nod']]);
    var bar = h('div', 'pp-bar'); bar.appendChild(ppSearch('Buscar equipo…', MQ, function (v) { MQ = v; filt(); }));
    var sel = h('select', 'pp-so'); [['', 'Todas las competiciones']].concat(comps).forEach(function (o) { var op = h('option', null, o[1]); op.value = o[0]; if (o[0] === MF) op.selected = true; sel.appendChild(op); }); sel.onchange = function () { MF = sel.value; render(); }; bar.appendChild(sel);
    var acts = h('div', 'pp-acts'); acts.appendChild(btn('+ Programar partido', function () { matchDlg(null); }, 'o')); bar.appendChild(acts); b.appendChild(bar);
    b.appendChild(ppChips([['all', 'Todos', base.length], ['live', '● En vivo', cnt.live, '#ff3b47'], ['up', 'Próximos', cnt.scheduled, '#22d3ee'], ['nod', 'Sin fecha', nod, '#ffd23f'], ['fin', 'Terminados', cnt.finished, '#2ee59d'], ['can', 'Cancelados', cnt.cancelled, '#8c8c9c']], MST, function (k) { MST = k; render(); }));
    var info = h('p', 'pp-inf'); b.appendChild(info);
    var T = function (m) { return m.at ? new Date(m.at.replace(' ', 'T') + 'Z').getTime() : Infinity; }, now = Date.now();
    var groups = [['live', '● En vivo', function (m) { return m.status === 'live'; }, function (a, c) { return T(a) - T(c); }], ['up', 'Próximos', function (m) { return m.status === 'scheduled' && m.at; }, function (a, c) { return T(a) - T(c); }], ['nod', 'Sin fecha', function (m) { return m.status === 'scheduled' && !m.at; }, function (a, c) { return a.id - c.id; }], ['fin', 'Terminados', function (m) { return m.status === 'finished'; }, function (a, c) { return String(c.ended || c.at || '').localeCompare(String(a.ended || a.at || '')); }], ['can', 'Cancelados', function (m) { return m.status === 'cancelled'; }, function (a, c) { return T(c) - T(a); }]];
    var show = MST === 'all' ? groups : groups.filter(function (g) { return g[0] === MST || (MST === 'up' && g[0] === 'live'); }), cards = [];
    function rel(m) { var d = T(m) - now; if (!isFinite(d)) return ''; var a = Math.abs(d), u = a < 3600e3 ? Math.round(a / 60e3) + ' min' : a < 864e5 ? Math.round(a / 3600e3) + ' h' : Math.round(a / 864e5) + ' d'; return d > 0 ? 'en ' + u : 'hace ' + u; }
    function card(m, i) { var c = MAGNA.compOf(m), cc = m.type === 'friendly' ? '#ff8a3d' : m.type === 'league' ? '#8b5cf6' : (c && c.format === 'champions') ? '#22d3ee' : (c && c.format === 'groups_knockout') ? '#2ee59d' : '#ffd23f';
      var cd = h('div', 'mc mc-' + m.status); cd.style.setProperty('--cc', cc); cd.style.setProperty('--hc', MAGNA.teamColor(m.home)); cd.style.setProperty('--ac', MAGNA.teamColor(m.away)); cd.style.animationDelay = Math.min(i, 14) * 25 + 'ms';
      var tp = h('div', 'mc-tp'); tp.appendChild(h('span', 'mc-cp', c ? c.name : 'Amistoso')); if (m.round && m.round !== 'Amistoso') tp.appendChild(h('span', 'mc-rd', m.round)); tp.appendChild(h('span', 'sp'));
      var late = m.status === 'scheduled' && T(m) < now; tp.appendChild(h('span', 'mc-st' + (late ? ' late' : ''), m.status === 'live' ? 'EN VIVO' : m.status === 'finished' ? 'FINAL' : m.status === 'cancelled' ? 'CANCELADO' : m.at ? (late ? '⚠ Atrasado · ' : '') + rel(m) : 'SIN FECHA')); cd.appendChild(tp);
      var vs = h('div', 'mc-vs'); [m.home, null, m.away].forEach(function (tid, k) {
        if (tid == null) { var mid = h('div', 'mc-mid'); if (m.status === 'finished' || m.status === 'live') { var sc = h('b', 'mc-sc'); sc.appendChild(h('span', m.hs > m.as ? 'w' : null, String(m.hs || 0))); sc.appendChild(h('i')); sc.appendChild(h('span', m.as > m.hs ? 'w' : null, String(m.as || 0))); mid.appendChild(sc); } else mid.appendChild(h('b', 'mc-vsx', 'VS'));
          mid.appendChild(h('small', null, m.at ? new Date(m.at.replace(' ', 'T') + 'Z').toLocaleString('es', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Elige una fecha')); vs.appendChild(mid); return; }
        var tm = h('div', 'mc-t' + (k ? ' a' : '')), won = m.status === 'finished' && (k ? m.as > m.hs : m.hs > m.as); if (won) tm.classList.add('won'); tm.appendChild(M.crest(tid, MAGNA.teamName(tid), 44)); tm.appendChild(h('b', null, MAGNA.teamName(tid))); vs.appendChild(tm); });
      cd.appendChild(vs);
      var ft = h('div', 'mc-ft');
      if (m.status === 'cancelled') { ft.appendChild(ibtn('undo', 'Reactivar', function () { confirmBox('¿Reactivar el partido?', MAGNA.teamName(m.home) + ' vs ' + MAGNA.teamName(m.away) + ' vuelve a estar programado.', 'Reactivar', function () { m.status = 'scheduled'; commit('Partido reactivado'); }); })); }
      else {
        if (m.status !== 'finished' || m.live) { var lv = ibtn('play', m.status === 'live' ? 'Consola en vivo' : m.status === 'scheduled' ? 'Narrar en vivo' : 'Minuto a minuto', function () { LIVE = m.id; go('vivo'); }, 'go' + (m.status === 'live' ? ' hot' : '')); ft.appendChild(lv); }
        ft.appendChild(ibtn('score', 'Resultado', function () { resultDlg(m); }));
        ft.appendChild(ibtn('tv', m.stream ? (m.status === 'finished' ? 'Repetición' : 'Transmisión ✓') : 'Transmisión', function () { streamDlg(m); }, m.stream ? 'go' : ''));
        ft.appendChild(ibtn('cal', m.at ? 'Fecha' : 'Poner fecha', function () { matchDlg(m); }, m.at ? '' : 'warn'));
        ft.appendChild(ibtn('sets', 'Sets' + (m.sets && m.sets.length ? ' · ' + m.sets.length : ''), function () { setsDlg(m); }));
        if (m.status === 'finished') ft.appendChild(ibtn('img', 'Imagen', function () { shareDlg(m); }));
        ft.appendChild(h('span', 'sp'));
        if (m.status !== 'finished') { var cx = ibtn('ban', null, function () { confirmBox('¿Cancelar el partido?', MAGNA.teamName(m.home) + ' vs ' + MAGNA.teamName(m.away), 'Cancelar partido', function () { m.status = 'cancelled'; commit('Partido cancelado'); }); }, 'del'); cx.title = 'Cancelar partido'; cx.setAttribute('aria-label', 'Cancelar partido'); ft.appendChild(cx); } }
      cd.appendChild(ft); cd._k = nk(MAGNA.teamName(m.home) + ' ' + MAGNA.teamName(m.away) + ' ' + (c ? c.name : 'amistoso') + ' ' + (m.round || '')); return cd; }
    var wrap = h('div', 'mc-wrap'), total = 0;
    show.forEach(function (g) { var L = base.filter(g[2]).sort(g[3]); if (!L.length) return; total += L.length;
      var sec = h('div', 'mc-sec mc-s-' + g[0]), hd = h('h3', 'mc-h'); hd.appendChild(document.createTextNode(g[1])); hd.appendChild(h('small', null, String(L.length))); sec.appendChild(hd);
      var grid = h('div', 'mc-grid'), lim = MMORE[g[0]] || 24; L.slice(0, lim).forEach(function (m, i) { var cd = card(m, i); cards.push(cd); grid.appendChild(cd); }); sec.appendChild(grid);
      if (L.length > lim) { var more = btn('Ver ' + Math.min(24, L.length - lim) + ' más (' + (L.length - lim) + ' restantes)', function () { MMORE[g[0]] = lim + 24; render(); }); more.classList.add('mc-more'); sec.appendChild(more); }
      wrap.appendChild(sec); });
    if (!total) { var em = h('div', 'mc-empty'); em.appendChild(h('b', null, MST === 'live' ? 'Ningún partido en juego ahora mismo' : 'No hay partidos aquí')); em.appendChild(h('small', null, 'Cambia el filtro o programa uno nuevo.')); em.appendChild(btn('+ Programar partido', function () { matchDlg(null); }, 'o')); wrap.appendChild(em); }
    b.appendChild(wrap);
    function filt() { var q = nk(MQ), n = 0; cards.forEach(function (cd) { var on = !q || cd._k.indexOf(q) >= 0; cd.hidden = !on; if (on) n++; }); [].forEach.call(wrap.querySelectorAll('.mc-sec'), function (sx) { sx.hidden = !sx.querySelector('.mc:not([hidden])'); }); info.textContent = q ? n + ' partido' + (n === 1 ? '' : 's') + ' con «' + MQ + '»' : ''; }
    filt();
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
  // enlace de transmisión (YouTube, Twitch o Kick) de un partido
  function streamDlg(m) {
    dialog('📺 Transmisión: ' + MAGNA.teamName(m.home) + ' vs ' + MAGNA.teamName(m.away), function (b, close) {
      b.appendChild(h('p', 'sub', m.status === 'finished' ? 'Pega el enlace de la repetición (o del directo ya terminado). Se verá en la ficha del partido y en Transmisiones.' : 'Pega el enlace de YouTube, Twitch o Kick. Cuando el partido esté en vivo, el reproductor sale debajo del marcador en Partidos.'));
      var l = h('label', 'f', 'Enlace'), i = h('input', 'in'); i.placeholder = 'https://youtube.com/live/…  ·  twitch.tv/tucanal  ·  kick.com/tucanal'; i.value = m.stream || ''; l.appendChild(i); b.appendChild(l);
      var pv = h('div'); pv.style.marginTop = '10px'; b.appendChild(pv); var err = h('p', 'err'); b.appendChild(err);
      function prev() { pv.innerHTML = ''; var s = window.MSTREAM && MSTREAM.parse(i.value); if (!i.value.trim()) return; if (!s) { pv.appendChild(h('p', 'hint', '⚠️ No reconozco el enlace. Usa uno de YouTube, Twitch o Kick.')); return; } pv.appendChild(h('p', 'hint', '✓ ' + s.n + ' · así se verá:')); pv.appendChild(MSTREAM.player(i.value)); }
      var tm = null; i.oninput = function () { clearTimeout(tm); tm = setTimeout(prev, 500); }; prev();
      var ou = location.href.replace(/admin\.html.*$/, 'overlay.html?m=' + m.id), ob = h('div', 'box'); ob.style.cssText = 'margin-top:34px;padding:12px;border-left:4px solid #c6ff1a';
      ob.appendChild(h('b', null, '🎬 Marcador para OBS / Streamlabs')); ob.appendChild(h('p', 'hint', 'Agrega una «Fuente de navegador» de 1920×1080 con este enlace. Se actualiza solo con lo que cargues en la consola en vivo.'));
      var oi = h('input', 'in'); oi.readOnly = true; oi.value = ou; ob.appendChild(oi); var orow = h('div', 'bar2'); orow.appendChild(btn('Copiar enlace', function () { oi.select(); try { navigator.clipboard.writeText(ou); toast('Enlace copiado'); } catch (e) { document.execCommand('copy'); } }, 'o'));
      var ol = h('a', 'lk', 'Ver marcador ↗'); ol.href = ou; ol.target = '_blank'; orow.appendChild(ol); ob.appendChild(orow); b.appendChild(ob);
      var ann = h('label', 'f'); ann.style.cssText = 'display:flex;gap:8px;align-items:center;margin-top:16px'; var cb = h('input'); cb.type = 'checkbox'; cb.checked = !m.stream && m.status !== 'finished'; ann.appendChild(cb); ann.appendChild(document.createTextNode('Avisar en Noticias que hay transmisión')); b.appendChild(ann);
      var r = h('div', 'row'); r.appendChild(btn('Cancelar', close));
      if (m.stream) r.appendChild(btn('Quitar enlace', function () { delete m.stream; close(); commit('Transmisión quitada'); }, 'd'));
      r.appendChild(btn('Guardar', function () { var v = i.value.trim(); if (!v) { err.textContent = 'Pega un enlace.'; return; } if (!(window.MSTREAM && MSTREAM.ok(v))) { err.textContent = 'Ese enlace no es de YouTube, Twitch o Kick.'; return; }
        m.stream = /^https?:/i.test(v) ? v : 'https://' + v; if (cb.checked) MAGNA.addNews('announcement', '📺 ' + (m.status === 'live' ? 'En vivo ahora: ' : m.status === 'finished' ? 'Ya está la repetición de ' : 'Se transmite: ') + MAGNA.teamName(m.home) + ' vs ' + MAGNA.teamName(m.away) + '. Míralo en Magna Arena.');
        close(); commit('Transmisión guardada'); }, 'o')); b.appendChild(r); i.focus();
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
    star: '<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9L12 3z"/>',
    gift: '<rect x="3" y="8" width="18" height="5" rx="1"/><path d="M5 13v8h14v-8M12 8v13M12 8c-1.5-3-5-4-5.5-2S9 8 12 8zm0 0c1.5-3 5-4 5.5-2S15 8 12 8z"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3M14 9l2 2"/>',
    db: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    bag: '<path d="M5 8h14l-1 13H6L5 8z"/><path d="M9 8V6a3 3 0 016 0v2"/>',
    ball: '<circle cx="12" cy="12" r="9"/><path d="M12 7l4 3-1.5 4.5h-5L8 10z"/>',
    pulse: '<path d="M3 12h4l2-6 4 12 2-6h6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 015 .5c0 1.5-2.5 2-2.5 3.5M12 17h.01"/>',
    out: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11"/>',
    ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'
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
    { id: 'resumen', g: 'Inicio', l: 'Resumen', i: 'home', c: '#ff7a2f', f: homeV, d: 'Todo tu sitio de un vistazo: lo que está en vivo, lo próximo y accesos a cada página.' },
    { id: 'vivo', g: 'Inicio', l: 'En vivo', i: 'live', c: '#ff4d6d', f: liveV, d: 'Narra el partido: goles, modos, cambios, notas y celebraciones. Atajos: Q gol local · P gol visitante · S cambio · Z deshacer.', p: 'index.html', ct: function () { return liveMatches().length; } },
    { id: 'partidos', g: 'Competición', l: 'Partidos', i: 'cal', c: '#32d583', f: matchesV, d: 'Programa partidos, cambia fechas y registra resultados.', p: 'calendario.html', ct: function () { var p = pendingReqs().length; return p || S().matches.filter(function (m) { return m.status === 'scheduled'; }).length; }, dim: function () { return !pendingReqs().length; } },
    { id: 'ligas', g: 'Competición', l: 'Ligas', i: 'league', c: '#4cc3ff', f: function (b) { compV(b, 'leagues'); }, d: 'Crea ligas, inscribe equipos y sigue la clasificación.', p: 'ligas.html' },
    { id: 'torneos', g: 'Competición', l: 'Torneos y Mundial', i: 'cup', c: '#ffc53d', f: function (b) { compV(b, 'tournaments'); }, d: 'Eliminatorias, Champions, todos contra todos o formato Mundial con fase de grupos.', p: 'mundial.html' },
    { id: 'balon', g: 'Competición', l: 'Balón de Oro', i: 'ball', c: '#ffd23f', f: balonV, d: 'Registra los ganadores de cada edición o abre el apoyo de la afición a los nominados (tú eliges al ganador).', p: 'balon.html', ct: function () { return S().ballonVote ? 1 : 0; } },
    { id: 'historial', g: 'Competición', l: 'Historial', i: 'league', c: '#9b8cff', f: histV, d: 'Torneos anteriores al sitio: marcadores y campeones. Ajustan el nivel de los equipos y los títulos de los jugadores.', p: 'competiciones.html' },
    { id: 'equipos', g: 'Comunidad', l: 'Equipos', i: 'shield', c: '#b07cff', f: teamsV, d: 'Equipos, escudos, plantillas y trofeos.', p: 'equipos.html' },
    { id: 'jugadores', g: 'Comunidad', l: 'Jugadores y roles', i: 'user', c: '#4cc3ff', f: playersV, d: 'Personas de la comunidad y su rol: Jugador, Coach y jugador o Solo coach. Al registrar a alguien se crea su cuenta con un código fijo de 6 dígitos.', p: 'mercado.html' },
    { id: 'roles', g: 'Comunidad', l: 'Roles y accesos', i: 'key', c: '#ff5fa2', f: function (b) { dataV(b, 'roles'); }, d: 'Quién manda en el sitio: administradores con correo, administradores con código y jueces que califican partidos.' },
    { id: 'eventos', g: 'Comunidad', l: 'Planes', i: 'cal', c: '#32d583', f: eventsV, d: 'Agenda de la comunidad: torneos relámpago, amistosos, transmisiones y premiaciones. Los miembros se apuntan con «¡Voy!».', p: 'eventos.html' },
    { id: 'economia', g: 'Bits y tienda', l: 'Economía y fichajes', i: 'coin', c: '#ffc53d', f: econV, d: 'Caja de Bits de cada equipo (sueldos), Bucks para fichajes, multiplicador por puntos y mercado de fichajes.', ct: function () { return MAGNA.marketState().open ? '●' : 0; }, p: 'mercado.html' },
    { id: 'tienda', g: 'Bits y tienda', l: 'Tienda', i: 'bag', c: '#ff5fa2', f: shopV, d: 'Cosméticos que los miembros compran con Bits o reciben de regalo: colores de nombre, placas, marcos y títulos.', p: 'tienda.html' },
    { id: 'regalos', g: 'Bits y tienda', l: 'Regalos', i: 'gift', c: '#ff7a2f', f: regalosV, d: 'Premia a la comunidad: regala Bits o cosméticos en segundos, con premios listos para el MVP, los goleadores o los campeones.' },
    { id: 'noticias', g: 'Comunicación', l: 'Noticias', i: 'news', c: '#b07cff', f: function (b) { window.ADMIN_NEWS(b, { h: h, btn: btn, toast: toast, dialog: dialog, confirmBox: confirmBox }); }, d: 'Crea, programa, destaca y edita las noticias de la comunidad.', p: 'noticias.html' },
    { id: 'actividad', g: 'Comunicación', l: 'Actividad', i: 'pulse', c: '#4cc3ff', f: newsV, d: 'Avisos cortos y el registro automático de lo que pasa (resultados, fichajes, MVP).', p: 'index.html' },
    { id: 'registro', g: 'Sistema', l: 'Registro de actividad', i: 'clock', c: '#4cc3ff', f: registroV, d: 'Quién hizo qué y cuándo en el panel: resultados, goles, regalos, fondos, roles y más. Se guarda 6 meses.' },
    { id: 'respaldo', g: 'Sistema', l: 'Respaldos', i: 'db', c: '#32d583', f: function (b) { dataV(b, 'backup'); }, d: 'Copias de seguridad en la nube y en tu computadora. Antes de cualquier cambio grande se guarda una copia sola.' }
  ];
  function go(t) { if (t === 'datos') t = 'respaldo'; if (t === 'registro' && tab !== 'registro') RLOG = null; if (!TABS.some(function (x) { return x.id === t; })) t = 'resumen'; tab = t; document.body.classList.remove('nv-open'); render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  window.ADMIN_GO = go;
  // ---------- secciones que se cargan al abrirlas (admin-<módulo>.js): el panel abre más rápido ----------
  var MODDEF = {}, MODS = {}, MODV = '2611141600', MODOF = { vivo: 'live', ligas: 'comp', torneos: 'comp', balon: 'balon', historial: 'hist', economia: 'econ', roles: 'data', respaldo: 'data', eventos: 'events', tienda: 'shop', regalos: 'shop' };
  window.ADMIN_MOD = function (n, f) { MODDEF[n] = f; };
  var $ = {}; Object.defineProperties($, { ACCS: { get: function () { return ACCS; }, set: function (v) { ACCS = v; } }, BKK: { get: function () { return BKK; }, set: function (v) { BKK = v; } }, EVC: { get: function () { return EVC; }, set: function (v) { EVC = v; } }, EVK: { get: function () { return EVK; }, set: function (v) { EVK = v; } }, INV: { get: function () { return INV; }, set: function (v) { INV = v; } }, LIVE: { get: function () { return LIVE; }, set: function (v) { LIVE = v; } }, MF: { get: function () { return MF; }, set: function (v) { MF = v; } }, NEXT: { get: function () { return NEXT; }, set: function (v) { NEXT = v; } }, ST: { get: function () { return ST; }, set: function (v) { ST = v; } }, TF: { get: function () { return TF; }, set: function (v) { TF = v; } }, TICK: { get: function () { return TICK; }, set: function (v) { TICK = v; } }, UNDO: { get: function () { return UNDO; }, set: function (v) { UNDO = v; } }, exBusy: { get: function () { return exBusy; }, set: function (v) { exBusy = v; } }, tab: { get: function () { return tab; }, set: function (v) { tab = v; } } });
  function modApi() { return { $: $, S: S, ibtn: ibtn, ppSum: ppSum, ppChips: ppChips, ppSearch: ppSearch, stack: stack, ask: ask, banner: banner, btn: btn, by: by, closesDlg: closesDlg, commit: commit, compName: compName, confirmBox: confirmBox, dialog: dialog, evRpc: evRpc, fdate: fdate, go: go, h: h, loadAccs: loadAccs, nk: nk, okName: okName, render: render, rr: rr, setsDlg: setsDlg, shareDlg: shareDlg, showCode: showCode, table: table, resultDlg: resultDlg, matchDlg: matchDlg, streamDlg: streamDlg, toLocal: toLocal, toUtc: toUtc, toast: toast }; }
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
  function tabOf(id) { return TABS.filter(function (t) { return t.id === id; })[0]; }
  function render() {
    if (TICK) { clearInterval(TICK); TICK = null; }
    var T = tabOf(tab) || TABS[0]; tab = T.id;
    var sd = document.getElementById('side'); sd.innerHTML = ''; var grp = null, cur = null;
    var brd = h('button', 'nb-brand'); brd.type = 'button'; brd.onclick = function () { go('resumen'); }; var bi = h('img'); bi.src = 'logo-sm.webp'; bi.alt = ''; brd.appendChild(bi); var bt = h('span'); bt.appendChild(h('b', null, 'Magna Arena')); bt.appendChild(h('small', null, 'Panel de control')); brd.appendChild(bt); sd.appendChild(brd);
    var cls = h('button', 'nb-x', '✕'); cls.type = 'button'; cls.setAttribute('aria-label', 'Cerrar menú'); cls.onclick = function () { document.body.classList.remove('nv-open'); }; sd.appendChild(cls);
    TABS.forEach(function (t) { if (t.g !== grp) { grp = t.g; cur = h('div', 'sg'); cur.appendChild(h('h4', null, t.g)); sd.appendChild(cur); }
      var x = h('button', 'si' + (t.id === tab ? ' on' : '')); x.type = 'button'; x.style.setProperty('--ic', t.c); x.appendChild(icon(t.i)); if (MODOF[t.id]) { x.onmouseenter = x.onfocus = x.ontouchstart = function () { modPrefetch(MODOF[t.id]); }; } x.appendChild(h('span', null, t.l)); var n = t.ct ? t.ct() : 0; if (n) x.appendChild(h('span', 'ct' + ((typeof t.dim === 'function' ? t.dim() : t.dim) ? ' dim' : '') + (t.id === 'vivo' ? ' lv' : ''), n)); x.onclick = function () { go(t.id); }; cur.appendChild(x); });
    var hc = h('div', 'nb-help'), hi = h('span', 'nb-hi'); hi.appendChild(icon('help')); hc.appendChild(hi); hc.appendChild(h('b', null, '¿Dónde está cada cosa?')); hc.appendChild(h('p', null, 'La guía te muestra qué hace cada sección y te lleva directo.')); hc.appendChild(btn('Abrir la guía', guideDlg, 'o')); sd.appendChild(hc);
    var vs = h('a', 'nb-site'); vs.href = 'index.html'; vs.target = '_blank'; vs.rel = 'noopener'; vs.appendChild(icon('ext')); vs.appendChild(h('span', null, 'Ver el sitio')); sd.appendChild(vs);
    var hd = document.getElementById('shead'); hd.innerHTML = ''; hd.style.setProperty('--ic', T.c);
    var ti = h('span', 'sh-ic'); ti.appendChild(icon(T.i)); hd.appendChild(ti);
    var l = h('div', 'sh-tx'); l.appendChild(h('div', 'eb mono', T.g)); l.appendChild(h('h1', 'x', T.l)); l.appendChild(h('p', null, T.d)); hd.appendChild(l);
    if (T.p) { var a = h('a', 'lk'); a.href = T.p; a.target = '_blank'; a.rel = 'noopener'; a.appendChild(h('span', null, 'Ver en el sitio')); a.appendChild(icon('ext')); hd.appendChild(a); }
    hd.classList.toggle('hide', tab === 'resumen'); document.body.classList.toggle('on-dash', tab === 'resumen');
    dock();
    view.classList.remove('dash'); view.className = 'v-' + tab; view.innerHTML = ''; T.f(view);
  }
  // barra inferior en el teléfono
  function dock() { var d = document.getElementById('ndock'); if (!d) return; d.innerHTML = '';
    [['resumen', 'Inicio', 'home'], ['vivo', 'En vivo', 'live'], ['partidos', 'Partidos', 'cal'], ['noticias', 'Noticias', 'news'], ['__m', 'Menú', 'menu']].forEach(function (x) {
      var b = h('button', 'nd-i' + (x[0] === tab ? ' on' : '')); b.type = 'button'; b.appendChild(icon(x[2])); b.appendChild(h('span', null, x[1]));
      if (x[0] === 'vivo' && liveMatches().length) b.appendChild(h('i', 'nd-dot'));
      b.onclick = function () { if (x[0] === '__m') document.body.classList.add('nv-open'); else go(x[0]); }; d.appendChild(b); }); }
  function banner() {
    var b = document.getElementById('banner'), st = MAGNA.cloud.status; b.innerHTML = '';
    var cls = st === 'error' ? ' err' : (st === 'saving' || st === 'pending') ? ' sav' : '';
    b.className = 'pub' + cls;
    var s1 = h('span', 'nt-st'); s1.appendChild(h('i')); s1.appendChild(h('span', null, st === 'error' ? 'Sin conexión · reintentando' : st === 'saving' || st === 'pending' ? 'Guardando…' : 'En línea'));
    s1.title = st === 'error' ? 'No se pudo guardar. Reintentando… revisa tu conexión.' : 'Conectado · los cambios se publican al instante en el sitio.'; b.appendChild(s1);
    var lv = liveMatches(); if (lv.length) { var lc = h('button', 'nt-lv'); lc.type = 'button'; lc.appendChild(h('i')); lc.appendChild(h('span', null, lv.length === 1 ? MAGNA.teamName(lv[0].home) + ' ' + (lv[0].hs || 0) + '-' + (lv[0].as || 0) + ' ' + MAGNA.teamName(lv[0].away) : lv.length + ' en vivo')); lc.onclick = function () { LIVE = lv[0].id; go('vivo'); }; b.appendChild(lc); }
    if (window.MAGNA_ADMIN) { var who = String(MAGNA_ADMIN.email || 'admin'), nm = who.split('@')[0], pf = h('span', 'nt-pf'); pf.appendChild(h('span', 'nt-av', nm.slice(0, 1).toUpperCase())); var pt = h('span', 'nt-pt'); pt.appendChild(h('b', null, nm.charAt(0).toUpperCase() + nm.slice(1))); pt.appendChild(h('small', null, 'Administrador')); pf.appendChild(pt); pf.title = who; b.appendChild(pf);
      var so = h('button', 'nt-out'); so.type = 'button'; so.title = 'Cerrar sesión'; so.setAttribute('aria-label', 'Cerrar sesión'); so.appendChild(icon('out')); so.onclick = function () { MAGNA_ADMIN.signOut(); }; b.appendChild(so); }
  }
  // ---------- guía: qué hace cada sección ----------
  function guideDlg() {
    dialog('🧭 Guía del panel', function (b, close) {
      b.appendChild(h('p', 'sub', 'Toca una sección para ir directo. También puedes buscar cualquier cosa con la barra de arriba (atajo: tecla /).'));
      var grp = null, box = h('div', 'gd'); TABS.forEach(function (t) { if (t.g !== grp) { grp = t.g; box.appendChild(h('h4', null, t.g)); }
        var x = h('button', 'gd-i'); x.type = 'button'; x.style.setProperty('--ic', t.c); var ic = h('span', 'gd-ic'); ic.appendChild(icon(t.i)); x.appendChild(ic); var tx = h('span'); tx.appendChild(h('b', null, t.l)); tx.appendChild(h('small', null, t.d)); x.appendChild(tx); x.onclick = function () { close(); go(t.id); }; box.appendChild(x); });
      b.appendChild(box); var r = h('div', 'row'); r.appendChild(btn('Cerrar', close)); b.appendChild(r);
    });
  }
  // ---------- buscador: secciones, equipos, jugadores, partidos y acciones ----------
  function prefill(q) { setTimeout(function () { var i = view.querySelector('input[type=search],input[placeholder*="uscar"]'); if (i) { i.value = q; i.dispatchEvent(new Event('input', { bubbles: true })); i.focus(); } }, 500); }
  function searchUI() {
    var w = document.getElementById('nsrch'); if (!w || w.firstChild) return;
    var ic = icon('search'); w.appendChild(ic); var inp = h('input'); inp.type = 'text'; inp.placeholder = 'Buscar equipos, jugadores, secciones…'; inp.setAttribute('aria-label', 'Buscar en el panel'); inp.autocomplete = 'off'; w.appendChild(inp); w.appendChild(h('kbd', null, '/'));
    var res = h('div', 'nt-res'); res.hidden = true; w.appendChild(res); var L = [], sel = 0;
    function acts() { return [['🎁 Regalar Bits', function () { giftDlg(); }], ['📅 Programar partido', function () { matchDlg(null); }], ['👤 Registrar jugador', function () { if (formsApi()) ADMIN_FORMS.player(); }], ['🛡️ Registrar equipo', function () { if (formsApi()) ADMIN_FORMS.team(); }], ['📰 Crear noticia', function () { window.__newsOpenEditor = true; go('noticias'); }], ['💾 Hacer copia de seguridad', function () { go('respaldo'); }], ['⚖️ Nombrar juez', function () { go('roles'); }], ['🏁 Fin de temporada', function () { seasonDlg(); }]]; }
    function find(q) { var t = nk(q), out = []; if (!t) return out;
      var hit = function (s) { return nk(s).indexOf(t) >= 0; };
      TABS.forEach(function (x) { if (hit(x.l) || hit(x.g) || hit(x.d)) out.push({ k: 'Sección', c: x.c, n: x.l, s: x.g, f: function () { go(x.id); } }); });
      acts().forEach(function (x) { if (hit(x[0])) out.push({ k: 'Acción', c: '#ff7a2f', n: x[0], s: 'Atajo', f: x[1] }); });
      S().teams.forEach(function (x) { if (hit(x.name)) out.push({ k: 'Equipo', c: MAGNA.teamColor(x.id), n: x.name, s: 'Abrir en Equipos', f: function () { go('equipos'); prefill(x.name); } }); });
      S().players.forEach(function (x) { if (hit(x.name)) out.push({ k: 'Jugador', c: '#4cc3ff', n: x.name, s: MAGNA.teamName(x.teamId) || 'Agente libre', f: function () { go('jugadores'); prefill(x.name); } }); });
      S().matches.forEach(function (m) { if (m.status === 'cancelled') return; var nn = MAGNA.teamName(m.home) + ' vs ' + MAGNA.teamName(m.away); if (hit(nn)) out.push({ k: m.status === 'live' ? 'En vivo' : m.status === 'finished' ? 'Jugado' : 'Partido', c: m.status === 'live' ? '#ff4d6d' : '#32d583', n: nn + (m.status === 'scheduled' ? '' : ' · ' + (m.hs || 0) + '-' + (m.as || 0)), s: compName(m), f: function () { if (m.status === 'finished' && !m.live) { go('partidos'); prefill(MAGNA.teamName(m.home)); } else { LIVE = m.id; go('vivo'); } } }); });
      return out.slice(0, 9); }
    function draw() { res.innerHTML = ''; L = find(inp.value); sel = Math.min(sel, Math.max(0, L.length - 1));
      if (!inp.value.trim()) { res.hidden = true; return; } res.hidden = false;
      if (!L.length) { res.appendChild(h('p', 'nt-e', 'Nada con «' + inp.value.trim() + '». Prueba con otro nombre.')); return; }
      L.forEach(function (x, i) { var r = h('button', 'nt-r' + (i === sel ? ' on' : '')); r.type = 'button'; r.style.setProperty('--c', x.c || '#ff7a2f'); r.appendChild(h('em', null, x.k)); var tx = h('span'); tx.appendChild(h('b', null, x.n)); tx.appendChild(h('small', null, x.s || '')); r.appendChild(tx); r.onmousedown = function (e) { e.preventDefault(); }; r.onclick = function () { pickR(i); }; res.appendChild(r); }); }
    function pickR(i) { var x = L[i]; if (!x) return; inp.value = ''; res.hidden = true; inp.blur(); x.f(); }
    inp.oninput = function () { sel = 0; draw(); };
    inp.onkeydown = function (e) { if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(L.length - 1, sel + 1); draw(); } else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); draw(); } else if (e.key === 'Enter') { e.preventDefault(); pickR(sel); } else if (e.key === 'Escape') { inp.value = ''; draw(); inp.blur(); } };
    inp.onblur = function () { setTimeout(function () { res.hidden = true; }, 120); }; inp.onfocus = function () { if (inp.value) draw(); };
    document.addEventListener('keydown', function (e) { var tg = e.target, typing = tg && (/^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName) || tg.isContentEditable); if (typing || document.querySelector('.ov')) return; if (e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) { e.preventDefault(); inp.focus(); } });
    var bg = document.getElementById('nburg'); if (bg) { bg.appendChild(icon('menu')); bg.onclick = function () { document.body.classList.add('nv-open'); }; }
    var sc = document.getElementById('nscrim'); if (sc) sc.onclick = function () { document.body.classList.remove('nv-open'); };
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') document.body.classList.remove('nv-open'); });
  }
  // ---------- fin de temporada: respaldo, premios, fondos, cierre, noticia y archivo, en un solo paso ----------
  function seasonInfo() {
    var champs = [];
    S().tournaments.forEach(function (c) { if (c.status !== 'draft' && c.state && c.state.champion) champs.push({ c: c, kind: 'tournaments', team: c.state.champion, how: 'Campeón' }); });
    S().leagues.forEach(function (c) { if (c.status === 'draft') return; var rows = MAGNA.standings(Object.assign({ kind: 'league' }, c)); if (rows[0] && rows[0].pj > 0) champs.push({ c: c, kind: 'leagues', team: rows[0].team_id, how: c.status === 'finished' ? 'Campeón' : 'Líder' }); });
    var PS = MAGNA.playerStats(), pl = S().players.map(function (p) { var x = PS[p.id] || {}; return { p: p, g: x.g || 0, mvp: x.mvp || 0, media: x.media == null ? 10 : x.media, pj: x.pj || 0 }; });
    function best(k) { return pl.filter(function (x) { return x[k] > 0 && (k !== 'media' || x.pj > 0); }).sort(function (a, b) { return b[k] - a[k]; })[0] || null; }
    var pend = function (c, kind) { return S().matches.some(function (m) { return (m.status === 'scheduled' || m.status === 'live') && m.cid === c.id && (kind === 'leagues' ? m.type === 'league' : m.type === 'tournament'); }); };
    var closable = [].concat(S().leagues.map(function (c) { return { c: c, kind: 'leagues' }; }), S().tournaments.map(function (c) { return { c: c, kind: 'tournaments' }; })).filter(function (x) { return x.c.status === 'active' && !pend(x.c, x.kind); });
    return { champs: champs, scorer: best('g'), mvp: best('mvp'), media: best('media'), closable: closable,
      played: S().matches.filter(function (m) { return m.status === 'finished'; }).length, goals: S().matches.filter(function (m) { return m.status === 'finished'; }).reduce(function (s, m) { return s + (Number(m.hs) || 0) + (Number(m.as) || 0); }, 0) };
  }
  function seasonDlg() {
    if (ACCS === null) return loadAccs(function () { seasonDlg(); });
    var I = seasonInfo(), y = new Date().getFullYear(), n0 = (S().seasons || []).filter(function (x) { return String(x.name).indexOf(String(y)) >= 0; }).length;
    dialog('🏁 Fin de temporada', function (b, close) {
      b.appendChild(h('p', 'sub', 'Revisa el resumen, elige qué hacer y pulsa «Terminar temporada». Antes de cambiar nada se guarda una copia de seguridad.'));
      var ln = h('label', 'f', 'Nombre de la temporada'), nin = h('input', 'in'); nin.maxLength = 60; nin.value = 'Temporada ' + y + (n0 ? ' · ' + (n0 + 1) : ''); ln.appendChild(nin); b.appendChild(ln);
      var sm = h('div', 'ss-sum'); [['⚽', I.played, 'partidos jugados'], ['🥅', I.goals, 'goles'], ['🏆', I.champs.length, I.champs.some(function (x) { return x.how === 'Líder'; }) ? 'campeones y líderes' : 'campeones']].forEach(function (x) { var d = h('div'); d.appendChild(h('span', null, x[0])); d.appendChild(h('b', null, String(x[1]))); d.appendChild(h('small', null, x[2])); sm.appendChild(d); }); b.appendChild(sm);
      var aw = h('div', 'ss-aw'); [['Goleador', I.scorer, function (x) { return x.g + ' goles'; }], ['Más MVP', I.mvp, function (x) { return x.mvp + ' MVP'; }], ['Mejor media', I.media, function (x) { return 'media ' + x.media; }]].forEach(function (x) { if (!x[1]) return; var d = h('div'); d.appendChild(h('small', null, x[0])); d.appendChild(h('b', null, x[1].p.name)); d.appendChild(h('em', null, x[2](x[1]))); aw.appendChild(d); }); if (aw.children.length) b.appendChild(aw);
      b.appendChild(h('h4', null, '🏆 Campeones a premiar'));
      var CH = {}; if (!I.champs.length) b.appendChild(h('p', 'hint', 'Todavía no hay campeones definidos. Puedes terminar igual: se guardan los datos de la temporada.'));
      I.champs.forEach(function (x, i) { CH[i] = x.how === 'Campeón'; var l = h('label', 'gift-it' + (CH[i] ? ' on' : '')), cb = h('input'); cb.type = 'checkbox'; cb.checked = CH[i]; cb.onchange = function () { CH[i] = cb.checked; l.classList.toggle('on', cb.checked); }; l.appendChild(cb); var tx = h('span'); tx.appendChild(h('b', null, MAGNA.teamName(x.team))); tx.appendChild(h('small', null, x.how + ' · ' + x.c.name)); l.appendChild(tx); b.appendChild(l); });
      b.appendChild(h('h4', null, '⚙️ Qué hacer'));
      function opt(on, title, sub, extra) { var l = h('label', 'ss-op'), cb = h('input'); cb.type = 'checkbox'; cb.checked = on; l.appendChild(cb); var w = h('div'); w.appendChild(h('b', null, title)); w.appendChild(h('small', null, sub)); if (extra) w.appendChild(extra); l.appendChild(w); b.appendChild(l); return cb; }
      function num(v, lbl) { var r = h('span', 'ss-n'), i = h('input', 'in'); i.type = 'number'; i.min = 0; i.max = 1000000; i.value = v; r.appendChild(i); r.appendChild(h('em', null, lbl)); return { el: r, i: i }; }
      var pb = num(500, 'Bits a cada jugador de los equipos campeones'), oB = opt(true, '🎁 Premio en Bits a los jugadores campeones', 'Llega a su cuenta con notificación.', pb.el);
      var pu = num(1000, 'Bucks a cada equipo campeón'), oU = opt(true, '💵 Premio en Bucks a los equipos campeones', 'Para fichar en la próxima temporada.', pu.el);
      var fw = h('span', 'ss-2'), fb = num(1000, 'Bits base'), fu = num(1000, 'Bucks base'); fw.appendChild(fb.el); fw.appendChild(fu.el); var oF = opt(true, '💰 Fondos de la nueva temporada según puntos', 'Cada equipo recibe la base multiplicada por sus puntos del ranking (x1 a x3).', fw);
      var oC = opt(false, '🔒 Cerrar competiciones terminadas (' + I.closable.length + ')', I.closable.length ? I.closable.map(function (x) { return x.c.name; }).join(', ') + '. Solo las que no tienen partidos pendientes.' : 'No hay competiciones activas sin partidos pendientes.');
      if (!I.closable.length) oC.disabled = true;
      var oN = opt(true, '📰 Anunciarlo en la actividad del sitio', 'Un aviso con los campeones y los premios de la temporada.');
      var oH = opt(true, '📚 Guardar la temporada en el historial', 'Campeones, goleador, MVP y números quedan en Torneos → Historial.');
      var err = h('p', 'err'), log = h('div', 'ss-log'); b.appendChild(err); b.appendChild(log);
      var r = h('div', 'row'); r.appendChild(btn('Cancelar', close)); var go = btn('🏁 Terminar temporada', run, 'o'); r.appendChild(go); b.appendChild(r);
      function step(t) { var d = h('div', null, '⏳ ' + t); log.appendChild(d); return function (ok, msg) { d.textContent = (ok ? '✅ ' : '⚠️ ') + t + (msg ? ' · ' + msg : ''); }; }
      function int(i) { var v = Number(i.value); return Number.isInteger(v) && v >= 0 && v <= 1000000 ? v : null; }
      function run() {
        var name = okName(nin.value, 3, 60); if (!name) return err.textContent = 'Escribe un nombre de 3 a 60 caracteres.';
        var vb = int(pb.i), vu = int(pu.i), vfb = int(fb.i), vfu = int(fu.i); if ([vb, vu, vfb, vfu].some(function (x) { return x == null; })) return err.textContent = 'Las cantidades deben ser números enteros entre 0 y 1.000.000.';
        var winners = I.champs.filter(function (x, i) { return CH[i]; }); err.textContent = ''; go.disabled = true; go.textContent = 'Terminando…';
        var snap = JSON.stringify(S());
        var s1 = step('Copia de seguridad');
        var bk = window.MAGNA_SB ? MAGNA_SB().then(function (c) { return c.rpc('admin_backup_now', { p_note: 'Antes de: ' + name }); }).then(function (q) { if (q && q.error) throw q.error; s1(true, 'en la nube'); }) : Promise.reject(new Error('sin nube'));
        bk.catch(function () { var a = h('a'); a.href = URL.createObjectURL(new Blob([snap], { type: 'application/json' })); a.download = 'magna-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-copia.json'; document.body.appendChild(a); a.click(); a.remove(); s1(true, 'descargada en tu computadora'); })
          .then(function () { // premios en Bits a los jugadores de los equipos campeones
            if (!oB.checked || !vb || !winners.length) return; var s2 = step('Premio en Bits'), ids = []; winners.forEach(function (x) { S().players.forEach(function (p) { if (p.teamId === x.team) { var a = (ACCS || []).filter(function (q) { return q.player_id === p.id; })[0]; if (a && ids.indexOf(a.id) < 0) ids.push(a.id); } }); });
            if (!ids.length) return s2(false, 'los campeones no tienen cuentas');
            return ACCOUNTS.gift(ids, vb, '🏆 Premio de ' + name + ': ¡campeones!').then(function (n) { s2(true, n + ' cuentas'); }, function (e) { s2(false, e.message || 'no se pudo'); }); })
          .then(function () { // datos del sitio: Bucks, cierre, anuncio e historial
            var s3 = step('Campeones, cierre e historial');
            if (oU.checked && vu) winners.forEach(function (x) { var t = by(S().teams, x.team); if (t) t.budget = (Number(t.budget) || 0) + vu; });
            if (oC.checked) I.closable.forEach(function (x) { x.c.status = 'finished'; });
            var champTxt = winners.map(function (x) { return MAGNA.teamName(x.team) + ' (' + x.c.name + ')'; }).join(', ');
            if (oN.checked) MAGNA.addNews('announcement', '🏁 Terminó la ' + name + '.' + (champTxt ? ' Campeones: ' + champTxt + '.' : '') + (I.scorer ? ' Goleador: ' + I.scorer.p.name + ' (' + I.scorer.g + ').' : '') + (oF.checked ? ' ¡Los equipos ya recibieron los fondos de la nueva temporada!' : ''));
            if (oH.checked) { S().seasons = S().seasons || []; S().seasons.push({ id: MAGNA.id(), name: name, at: MAGNA.now(), played: I.played, goals: I.goals, champions: winners.map(function (x) { return { comp: x.c.name, team: x.team, teamName: MAGNA.teamName(x.team), how: x.how }; }),
              scorer: I.scorer ? { id: I.scorer.p.id, name: I.scorer.p.name, n: I.scorer.g } : null, mvp: I.mvp ? { id: I.mvp.p.id, name: I.mvp.p.name, n: I.mvp.mvp } : null, media: I.media ? { id: I.media.p.id, name: I.media.p.name, n: I.media.media } : null }); }
            if (!MAGNA.save()) { s3(false, 'no se pudo guardar'); throw new Error('save'); } s3(true); banner();
            return new Promise(function (ok) { setTimeout(ok, 2500); }); })
          .then(function () { // fondos según puntos (en la base de datos, después de guardar)
            if (!oF.checked || (!vfb && !vfu)) return; var s4 = step('Fondos de la nueva temporada');
            return MAGNA_SB().then(function (c) { return c.rpc('admin_econ_seed', { p_bits: vfb, p_bucks: vfu }); }).then(function (q) { if (q && q.error) throw q.error; s4(true, q.data + ' equipos'); }, function (e) { s4(false, (e && e.message) || 'no se pudo'); }); })
          .then(function () { go.textContent = '¡Listo!'; toast('🏁 ' + name + ' terminada'); setTimeout(function () { close(); render(); }, 1600); },
            function (e) { go.disabled = false; go.textContent = '🏁 Terminar temporada'; err.textContent = 'Se detuvo: ' + ((e && e.message) || e); });
      }
    });
  }
  window.ADMIN_SEASON = seasonDlg;
  // ---------- registro de actividad ----------
  var RLOG = null, RQ = { who: '', sec: '', q: '' }, RMORE = true;
  function registroV(b) {
    if (!window.MAGNA_SB || MAGNA.cloud.source !== 'cloud') return b.appendChild(h('p', 'hint', 'El registro necesita conexión con la nube.'));
    if (RLOG === null) { RLOG = 'loading'; MAGNA_SB().then(function (c) { return c.rpc('admin_log_list', { p_limit: 200 }); }).then(function (r) { if (r.error) throw r.error; RLOG = r.data || []; RMORE = RLOG.length >= 200; if (tab === 'registro') render(); }, function (e) { RLOG = { err: (e && e.message) || 'No se pudo cargar' }; if (tab === 'registro') render(); }); }
    if (RLOG === 'loading') { b.appendChild(M.skel(5)); return; }
    if (RLOG.err) { b.appendChild(h('p', 'err', RLOG.err)); b.appendChild(btn('Reintentar', function () { RLOG = null; render(); })); return; }
    var whos = [], secs = []; RLOG.forEach(function (x) { if (whos.indexOf(x.who) < 0) whos.push(x.who); if (secs.indexOf(x.section) < 0) secs.push(x.section); });
    var bar = h('div', 'rl-bar'), qi = h('input', 'in'); qi.type = 'search'; qi.placeholder = 'Buscar en el registro…'; qi.value = RQ.q; bar.appendChild(qi);
    function sel(lbl, list, k) { var s2 = h('select', 'in'), o0 = h('option', null, lbl); o0.value = ''; s2.appendChild(o0); list.sort().forEach(function (v) { var o = h('option', null, v); o.value = v; if (RQ[k] === v) o.selected = true; s2.appendChild(o); }); s2.onchange = function () { RQ[k] = s2.value; draw(); }; bar.appendChild(s2); }
    sel('Todas las personas', whos, 'who'); sel('Todas las secciones', secs, 'sec');
    bar.appendChild(btn('↻ Actualizar', function () { RLOG = null; render(); }, 'sm')); b.appendChild(bar);
    var kp = h('div', 'rl-kp'), today = new Date().toDateString(); [[RLOG.filter(function (x) { return new Date(x.at).toDateString() === today; }).length, 'acciones hoy'], [whos.length, whos.length === 1 ? 'persona' : 'personas'], [RLOG.length, 'en total (recientes)']].forEach(function (x) { var d = h('div'); d.appendChild(h('b', null, String(x[0]))); d.appendChild(h('small', null, x[1])); kp.appendChild(d); }); b.appendChild(kp);
    var list = h('div', 'rl-list'); b.appendChild(list); var more = h('div'); b.appendChild(more);
    var SC = {}; TABS.forEach(function (t) { SC[t.l] = t.c; });
    function draw() { list.innerHTML = ''; var q = nk(RQ.q), L = RLOG.filter(function (x) { return (!RQ.who || x.who === RQ.who) && (!RQ.sec || x.section === RQ.sec) && (!q || nk(x.action + ' ' + x.who + ' ' + x.section).indexOf(q) >= 0); }), day = null;
      if (!L.length) list.appendChild(h('p', 'hint', RLOG.length ? 'Nada coincide con los filtros.' : 'Todavía no hay actividad registrada. Desde ahora, cada cambio del panel queda anotado aquí.'));
      L.forEach(function (x) { var d = new Date(x.at), dk = d.toDateString(); if (dk !== day) { day = dk; var y = new Date(Date.now() - 864e5).toDateString(); list.appendChild(h('h4', 'rl-d', dk === today ? 'Hoy' : dk === y ? 'Ayer' : d.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' }))); }
        var r = h('div', 'rl-r'); r.style.setProperty('--c', SC[x.section] || '#a99d95'); r.appendChild(h('time', null, d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }))); r.appendChild(h('span', 'rl-av', String(x.who || '?').slice(0, 1).toUpperCase()));
        var tx = h('div', 'rl-t'); tx.appendChild(h('b', null, x.action)); var mt = h('small'); mt.appendChild(document.createTextNode(x.who + ' · ')); mt.appendChild(h('em', null, x.section)); tx.appendChild(mt); r.appendChild(tx); list.appendChild(r); });
      more.innerHTML = ''; if (RMORE && RLOG.length) more.appendChild(btn('Ver más antiguos', function () { var last = RLOG[RLOG.length - 1]; MAGNA_SB().then(function (c) { return c.rpc('admin_log_list', { p_limit: 200, p_before: last.at }); }).then(function (r) { if (r.error) throw r.error; var d2 = r.data || []; RLOG = RLOG.concat(d2); RMORE = d2.length >= 200; render(); }, function () { toast('No se pudo cargar más', true); }); }, 'sm')); }
    qi.oninput = function () { RQ.q = qi.value; draw(); }; draw();
  }
  // ---------- regalos ----------
  // ---------- SORTEOS de marcos (inscripción con Bits; el ganador lo elige el servidor y recibe todos los niveles) ----------
  function raffleRpc(n, a) { return window.MAGNA_SB().then(function (c) { return c.rpc(n, a); }).then(function (r) { if (r && r.error) throw r.error; return r.data; }); }
  function raffleDlg() {
    dialog('🎟️ Sorteos', function (b, close) {
      var list = h('div'); list.appendChild(h('p', 'hint', 'Cargando…')); b.appendChild(list);
      var F = (S().shop || []).filter(function (x) { return x.type === 'frame' && !x.upg && (x.lv === 1 || x.exclusive); }).sort(function (x, y) { return (y.raffle ? 1 : 0) - (x.raffle ? 1 : 0); });
      var fm = h('div', 'box'); fm.style.marginTop = '14px'; fm.appendChild(h('h3', null, '➕ Nuevo sorteo'));
      var ti = h('input', 'in'); ti.maxLength = 80; ti.placeholder = 'Ej.: Gran Sorteo Legendario'; var l1 = h('label', 'f', 'Nombre del sorteo'); l1.appendChild(ti); fm.appendChild(l1);
      var pz = h('select', 'in'); F.forEach(function (x) { var U = (S().shop || []).filter(function (y) { return y.upg === x.id; }).length; var o = h('option', null, x.name + (U ? ' · ' + (U + 1) + ' niveles' : '') + (x.exclusive ? ' · exclusivo' : '')); o.value = x.id; pz.appendChild(o); }); var l2 = h('label', 'f', 'Premio (el ganador recibe todos sus niveles)'); l2.appendChild(pz); fm.appendChild(l2);
      var co = h('input', 'in'); co.type = 'number'; co.min = 0; co.max = 1000000; co.value = 500; var l3 = h('label', 'f', 'Entrada en Bits'); l3.appendChild(co); fm.appendChild(l3);
      var dt = h('input', 'in'); dt.type = 'datetime-local'; var d0 = new Date(Date.now() + 7 * 864e5); d0.setMinutes(0, 0, 0); dt.value = new Date(d0.getTime() - d0.getTimezoneOffset() * 6e4).toISOString().slice(0, 16); var l4 = h('label', 'f', 'Cierre de inscripciones'); l4.appendChild(dt); fm.appendChild(l4);
      var er = h('p', 'err'); fm.appendChild(er);
      var mk = btn('Crear sorteo y anunciarlo', function () { var t = ti.value.trim(), c = Number(co.value); er.textContent = '';
        if (t.length < 3) return er.textContent = 'Escribe un nombre (mínimo 3 letras).'; if (/[<>]/.test(t)) return er.textContent = 'El nombre no puede tener < ni >.'; if (!Number.isInteger(c) || c < 0) return er.textContent = 'La entrada debe ser un número entero.'; if (!pz.value) return er.textContent = 'Elige un marco.';
        var when = dt.value ? new Date(dt.value) : null; if (when && when <= new Date()) return er.textContent = 'La fecha de cierre debe ser futura.';
        mk.disabled = true; raffleRpc('admin_raffle_create', { p_title: t, p_prize: pz.value, p_cost: c, p_closes: when ? when.toISOString() : null }).then(function () { var it = M.item(pz.value);
          MAGNA.addNews('announcement', '🎟️ ¡Nuevo sorteo: ' + t + '! Se sortea ' + (it ? it.name : 'un marco') + ' con todos sus niveles. Inscríbete en Sorteo por ' + c.toLocaleString('es') + ' Bits.'); commit('🎟️ Sorteo creado y anunciado'); mk.disabled = false; ti.value = ''; refresh(); },
          function (e) { mk.disabled = false; er.textContent = e.message || 'No se pudo crear'; }); }, 'o');
      fm.appendChild(mk); b.appendChild(fm);
      function refresh() { raffleRpc('raffle_list').then(function (L) { list.innerHTML = ''; L = L || []; if (!L.length) { list.appendChild(h('p', 'hint', 'Todavía no hay sorteos. Crea el primero abajo.')); return; }
          L.forEach(function (r) { var it = M.item(r.prize_item), c = h('div', 'box rf-r'); var hd = h('div', 'bar2'); hd.appendChild(h('b', null, r.title)); hd.appendChild(h('span', 'chip', ({ open: '🟢 Abierto', closed: '⏳ Cerrado', drawn: '🏆 Sorteado', cancelled: '✖ Cancelado' })[r.status] || r.status)); c.appendChild(hd);
            c.appendChild(h('p', 'hint', (it ? it.name : r.prize_item) + ' · entrada ' + Number(r.cost).toLocaleString('es') + ' Bits · ' + r.entrants + ' inscritos' + (r.closes_at ? ' · cierra ' + new Date(r.closes_at).toLocaleString('es') : '') + (r.status === 'drawn' ? ' · ganador: ' + (r.winner_name || '—') : '')));
            var bb = h('div', 'bar2');
            if (r.status === 'open') bb.appendChild(btn('Cerrar inscripciones', function () { raffleRpc('admin_raffle_close', { p_raffle: r.id }).then(function () { toast('Inscripciones cerradas'); refresh(); }, function (e) { toast(e.message || 'No se pudo', true); }); }, 'sm'));
            if (r.status === 'open' || r.status === 'closed') {
              bb.appendChild(btn('🎰 Sortear ahora', function () { if (!Number(r.entrants)) return toast('Nadie se inscribió todavía.', true);
                confirmBox('¿Sortear "' + r.title + '"?', 'El sistema elige al azar entre ' + r.entrants + ' inscritos. El ganador recibe ' + (it ? it.name : 'el marco') + ' con todos sus niveles, ya equipado. No se puede deshacer.', 'Sortear', function () {
                  raffleRpc('admin_raffle_draw', { p_raffle: r.id }).then(function (w) { var x = (w && w[0]) || {}; MAGNA.addNews('announcement', '🏆 ¡' + (x.winner_name || 'Alguien') + ' ganó el sorteo "' + r.title + '" y se lleva ' + (it ? it.name : 'el marco') + ' con todos sus niveles!'); commit('🏆 Sorteo realizado: ganó ' + (x.winner_name || '—')); toast('🏆 Ganó ' + (x.winner_name || '—') + '. Ábrelo en la página Sorteo para ver la ruleta.'); refresh(); },
                    function (e) { toast(e.message || 'No se pudo sortear', true); }); }); }, 'sm o'));
              bb.appendChild(btn('Cancelar y devolver Bits', function () { confirmBox('¿Cancelar "' + r.title + '"?', 'Se devuelven los Bits de la entrada a los ' + r.entrants + ' inscritos.', 'Cancelar sorteo', function () { raffleRpc('admin_raffle_cancel', { p_raffle: r.id }).then(function (n) { toast('Sorteo cancelado · ' + (n || 0) + ' reembolsos'); refresh(); }, function (e) { toast(e.message || 'No se pudo', true); }); }); }, 'sm d'));
            }
            var lk = h('a', 'btn sm', 'Ver página'); lk.href = 'sorteo.html'; lk.target = '_blank'; bb.appendChild(lk); c.appendChild(bb); list.appendChild(c); }); },
        function (e) { list.innerHTML = ''; list.appendChild(h('p', 'err', 'No se pudieron cargar los sorteos: ' + (e.message || e))); }); }
      refresh();
    });
  }
  function regalosV(b) {
    if (ACCS === null) { b.appendChild(M.skel ? M.skel(3) : h('p', 'hint', 'Cargando cuentas…')); return loadAccs(function () { if (tab === 'regalos') render(); }); }
    var A = ACCS || [], mem = A.filter(function (a) { return a.role === 'member'; }), tot = A.reduce(function (s, a) { return s + (Number(a.bits) || 0); }, 0);
    var hero = h('section', 'rg-hero'), ht = h('div'); ht.appendChild(h('span', 'rg-ey', '🎉 Premia a tu gente')); ht.appendChild(h('h2', null, 'Un regalo cambia el día')); ht.appendChild(h('p', null, 'Los regalos llegan al instante a la campanita de cada miembro. Los Bits son ficticios: no tienen valor real.')); hero.appendChild(ht);
    var hs = h('div', 'rg-st'); [[A.length, 'cuentas'], [tot.toLocaleString('es'), 'Bits en circulación'], [(S().news || []).filter(function (n) { return n.kind === 'gift'; }).length, 'regalos enviados']].forEach(function (x) { var d = h('div'); d.appendChild(h('b', null, String(x[0]))); d.appendChild(h('small', null, x[1])); hs.appendChild(d); }); hero.appendChild(hs); b.appendChild(hero);
    var g = h('div', 'rg-grid');
    [['coin', '#ffc53d', 'Regalar Bits', 'Elige cuentas, la cantidad y un mensaje. Atajos de 100 a 5.000.', 'Regalar Bits', function () { giftDlg(); }],
     ['bag', '#ff5fa2', 'Regalar cosmético', 'Colores de nombre, placas, marcos y títulos de la tienda, sin que paguen.', 'Elegir cosmético', function () { if (!(S().shop || []).length) { toast('Primero activa la tienda en la sección Tienda.', true); return go('tienda'); } modLoad('shop').then(function (m) { MODS.shop.done = m; m.itemGiftDlg(null); }, function () { toast('No se pudo abrir. Revisa tu conexión.', true); }); }],
     ['gift', '#c6ff1a', 'Sorteos', 'Crea un sorteo de un marco con todos sus niveles: los miembros se inscriben pagando Bits y aquí sorteas en vivo.', 'Abrir sorteos', function () { raffleDlg(); }],
     ['star', '#b07cff', 'Entregar exclusivos', 'Revisa quién ganó títulos, MVP o hat-tricks y le entrega su cosmético exclusivo.', 'Entregar ahora', function () { syncExcl(true); }]].forEach(function (x) {
      var c = h('div', 'rg-c'); c.style.setProperty('--c', x[1]); var ic = h('span', 'rg-ic'); ic.appendChild(icon(x[0])); c.appendChild(ic); c.appendChild(h('h3', null, x[2])); c.appendChild(h('p', null, x[3])); c.appendChild(btn(x[4], x[5], 'o')); g.appendChild(c); });
    b.appendChild(g);
    // premios rápidos según lo que pasó en el sitio
    b.appendChild(h('h2', 'x', 'Premios rápidos'));
    b.appendChild(h('p', 'hint', 'Ya vienen con las cuentas, la cantidad y el mensaje. Solo revisas y confirmas.'));
    var acc = function (pid) { return A.filter(function (a) { return a.player_id != null && String(a.player_id) === String(pid); })[0]; };
    var fin = S().matches.filter(function (m) { return m.status === 'finished'; }).sort(function (x, y) { return String(y.ended || y.at || '').localeCompare(String(x.ended || x.at || '')); });
    var PR = [], mv = fin.filter(function (m) { return m.live && m.live.mvp; })[0];
    if (mv) { var ma = acc(mv.live.mvp), vs = MAGNA.teamName(mv.home) + ' vs ' + MAGNA.teamName(mv.away); PR.push(['⭐', 'MVP del último partido', (MAGNA.playerName(mv.live.mvp) || 'Jugador') + ' · ' + vs, 300, ma ? [ma.id] : [], '⭐ Premio al MVP de ' + vs + '. ¡Crack!']); }
    var gm = fin.filter(function (m) { return m.live && (m.live.ev || []).some(function (e) { return e.k === 'goal' && e.player; }); })[0];
    if (gm) { var sc = {}; gm.live.ev.forEach(function (e) { if (e.k === 'goal' && e.player) sc[e.player] = 1; }); var ids = Object.keys(sc).map(acc).filter(Boolean).map(function (a) { return a.id; }), vs2 = MAGNA.teamName(gm.home) + ' vs ' + MAGNA.teamName(gm.away); var gn = Object.keys(sc).map(function (id) { return MAGNA.playerName(id); }).filter(Boolean).join(', '); PR.push(['⚽', 'Goleadores del último partido', (gn ? gn + ' · ' : '') + vs2, 150, ids, '⚽ Premio por anotar en ' + vs2 + '.']); }
    var champ = null; S().tournaments.concat(S().leagues).forEach(function (c) { if (c.state && c.state.champion) champ = c; });
    if (champ) { var ct = champ.state.champion, ids2 = S().players.filter(function (p) { return p.teamId === ct; }).map(function (p) { return acc(p.id); }).filter(Boolean).map(function (a) { return a.id; }); PR.push(['🏆', 'Campeones de ' + champ.name, MAGNA.teamName(ct), 1000, ids2, '🏆 ¡Campeones de ' + champ.name + '! Premio para todo el equipo.']); }
    var nw = A.filter(function (a) { return a.role === 'member' && Date.parse(a.created_at) > Date.now() - 14 * 864e5; }); if (nw.length) PR.push(['👋', 'Bienvenida a los nuevos', nw.length + (nw.length === 1 ? ' cuenta nueva' : ' cuentas nuevas') + ' en las últimas 2 semanas', 100, nw.map(function (a) { return a.id; }), '👋 ¡Bienvenido a Magna Sports! Aquí tienes unos Bits para empezar.']);
    PR.push(['🎈', 'Detalle para todos', mem.length + ' miembros de la comunidad', 50, mem.map(function (a) { return a.id; }), '🎈 Un detalle de la administración para toda la comunidad.']);
    var pl = h('div', 'rg-pre');
    PR.forEach(function (x) { var r = h('div', 'rg-p'), em = h('span', 'rg-pe', x[0]); r.appendChild(em); var tx = h('div', 'rg-pt'); tx.appendChild(h('b', null, x[1])); tx.appendChild(h('small', null, x[2])); r.appendChild(tx);
      r.appendChild(h('span', 'rg-pa', '+' + x[3].toLocaleString('es') + ' Bits' + (x[4].length > 1 ? ' c/u' : '')));
      var bb = btn(x[4].length ? 'Premiar' + (x[4].length > 1 ? ' a ' + x[4].length : '') : 'Sin cuenta', function () { giftDlg(x[4], { amt: x[3], msg: x[5] }); }, 'o sm'); bb.disabled = !x[4].length; if (!x[4].length) bb.title = 'Esta persona aún no tiene cuenta. Créala en Jugadores y roles.'; r.appendChild(bb); pl.appendChild(r); });
    b.appendChild(pl);
    var hg = (S().news || []).filter(function (n) { return n.kind === 'gift'; }).slice(0, 8);
    b.appendChild(h('h2', 'x', 'Últimos regalos'));
    var hl = h('div', 'rg-hist'); if (!hg.length) hl.appendChild(h('p', 'hint', 'Todavía no has regalado nada. ¡Estrena con un premio rápido!'));
    hg.forEach(function (n) { var r = h('div', 'rg-h'); r.appendChild(h('span', null, '🎁')); r.appendChild(h('b', null, String(n.text || '').replace(/^🎁\s*/, ''))); r.appendChild(h('small', null, n.at ? new Date(String(n.at).replace(' ', 'T') + 'Z').toLocaleDateString('es', { day: 'numeric', month: 'short' }) : '')); hl.appendChild(r); });
    b.appendChild(hl);
  }
  // economía: al guardar un partido oficial terminado, se reparten ingresos y sueldos (la base de datos evita pagar dos veces)
  function finOff() { return S().matches.filter(function (m) { return m.status === 'finished' && m.type !== 'friendly'; }).length; }
  var EFIN = -1, ETM = null;
  function econSettle(force) { if (!window.MAGNA_SB || !window.MAGNA_ADMIN || MAGNA.cloud.source !== 'cloud') return; var n = finOff(); if (!force && n === EFIN) return; EFIN = n;
    MAGNA_SB().then(function (c) { return c.rpc('econ_settle'); }).then(function (r) { if (r && !r.error && r.data > 0) toast('💰 Se pagaron ingresos y sueldos de ' + r.data + (r.data === 1 ? ' partido' : ' partidos')); }, function () {}); }
  window.ADMIN_ECON_SETTLE = econSettle;
  MAGNA.cloud.onStatus(function () { banner(); if (MAGNA.cloud.status === 'saved') { clearTimeout(ETM); ETM = setTimeout(function () { econSettle(false); }, 1500); } });
  setTimeout(function () { econSettle(true); }, 3000);
  searchUI(); render(); banner();
  // en un rato libre se precargan las demás secciones para que abran al instante
  setTimeout(function () { var q = ['live', 'comp', 'shop', 'balon', 'data', 'hist', 'econ', 'events'], go1 = function () { var n = q.shift(); if (!n) return; modPrefetch(n); setTimeout(function () { if (window.requestIdleCallback) requestIdleCallback(go1, { timeout: 3000 }); else go1(); }, 900); }; go1(); }, 6000);
  window.addEventListener('magna:update', function (e) { if (e.detail && e.detail.remote) { render(); banner(); if (e.detail.why === 'remote') toast('Se actualizaron los datos: un coach hizo cambios en su equipo.'); } });
  window.addEventListener('magna:conflict', function () { toast('Tu último cambio no se guardó porque un coach acababa de modificar los datos. Ya se recargaron: vuelve a hacerlo.', true); });
})();
