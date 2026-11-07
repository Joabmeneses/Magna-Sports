'use strict';
// Sección NOTICIAS del panel: crear, editar, programar, destacar y eliminar artículos.
window.ADMIN_NEWS = function (b, U) {
  var h = U.h, btn = U.btn, toast = U.toast, N = window.NEWS, filt = window.__newsFilt || 'all', box = h('div');
  var css = '' +
    '.nw-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:16px 0}.nw-bar .sp{flex:1}' +
    '.nw-list{display:grid;gap:10px}.nw-row{display:grid;grid-template-columns:150px 1fr auto;gap:16px;align-items:center;background:var(--card);border:1px solid var(--line);border-radius:18px;padding:10px;animation:up .35s both}' +
    '.nw-row img,.nw-row .ph{width:150px;aspect-ratio:16/9;object-fit:cover;border-radius:12px;background:linear-gradient(135deg,#1b2260,#0f1326);display:block}' +
    '.nw-row h3{margin:0 0 6px;font-size:17px;line-height:1.25}.nw-meta{display:flex;flex-wrap:wrap;gap:6px;align-items:center;color:var(--muted);font-size:12px}' +
    '.nw-ch{display:inline-block;border-radius:999px;padding:3px 10px;font:700 11px Archivo,sans-serif;color:#0a0d18;background:var(--c)}' +
    '.nw-st{display:inline-block;border-radius:999px;padding:3px 10px;font:600 11px "JetBrains Mono",monospace;letter-spacing:.06em;text-transform:uppercase;border:1px solid var(--line)}.nw-st.pub{color:var(--green);border-color:var(--green)}.nw-st.sch{color:var(--yellow);border-color:var(--yellow)}.nw-st.dr{color:var(--muted)}' +
    '.nw-acts{display:flex;flex-wrap:wrap;gap:6px;justify-content:flex-end}.nw-star{background:none;border:1px solid var(--line);border-radius:999px;width:36px;height:32px;cursor:pointer;font-size:16px;color:var(--muted)}.nw-star.on{border-color:var(--yellow);color:var(--yellow);background:rgba(255,210,63,.12)}' +
    '@media(max-width:700px){.nw-row{grid-template-columns:96px 1fr}.nw-row img,.nw-row .ph{width:96px}.nw-acts{grid-column:1/-1;justify-content:flex-start}}' +
    '.nw-f div.f{display:block;margin:16px 0;color:var(--muted);font-size:13px}.md.nw-ed{width:min(880px,100%)}.nw-f{display:grid;gap:4px}.nw-cnt{color:var(--muted);font-size:12px;text-align:right}' +
    '.nw-seg{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}.nw-seg button{border:1px solid var(--line);background:rgba(255,255,255,.04);color:var(--fg);border-radius:999px;padding:8px 14px;font:600 13px Archivo,sans-serif;cursor:pointer}.nw-seg button.on{background:var(--purple);border-color:var(--purple);color:#fff}' +
    '.nw-prev{position:relative;aspect-ratio:16/9;border-radius:16px;overflow:hidden;background:linear-gradient(135deg,#1b2260,#0f1326);border:1px solid var(--line);display:grid;place-items:center;color:var(--muted);font-size:13px;margin:8px 0}.nw-prev img{width:100%;height:100%;object-fit:cover;display:block}' +
    '.nw-prev .ld{position:absolute;inset:0;display:grid;place-items:center;background:rgba(10,13,24,.6);color:#fff}' +
    '.nw-pose{display:grid;grid-template-columns:repeat(auto-fill,minmax(78px,1fr));gap:6px;max-height:230px;overflow:auto;padding:2px}.nw-pose button{border:2px solid transparent;border-radius:12px;padding:0;background:#141a33;cursor:pointer;overflow:hidden;aspect-ratio:3/4}.nw-pose button.on{border-color:var(--orange)}.nw-pose img{width:100%;height:100%;object-fit:cover;display:block}' +
    '.nw-pose .none{display:grid;place-items:center;color:var(--muted);font:600 12px Archivo,sans-serif;aspect-ratio:3/4}' +
    '.nw-opt{display:flex;flex-wrap:wrap;gap:14px;margin:8px 0;color:var(--fg);font-size:14px}.nw-opt label{display:flex;gap:8px;align-items:center;cursor:pointer}' +
    '.nw-help{color:var(--muted);font-size:12px;margin:4px 0 0}.nw-help code{background:rgba(255,255,255,.08);border-radius:6px;padding:1px 6px}' +
    '.nw-two{display:grid;grid-template-columns:1fr 1fr;gap:14px}@media(max-width:700px){.nw-two{grid-template-columns:1fr}}' +
    '.nw-pubs{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.nw-pubs label{display:flex;gap:8px;align-items:center;border:1px solid var(--line);border-radius:14px;padding:12px;cursor:pointer;font-size:14px}.nw-pubs label.on{border-color:var(--orange);background:rgba(255,90,54,.1)}@media(max-width:600px){.nw-pubs{grid-template-columns:1fr}}';
  css += '.ai-c{border-radius:22px;padding:16px 18px;margin:14px 0 4px;border:1px solid rgba(139,92,246,.55);background:radial-gradient(80% 120% at 0 0,rgba(139,92,246,.35),transparent 70%),radial-gradient(60% 100% at 100% 100%,rgba(34,211,238,.18),transparent 70%),var(--card);display:grid;gap:10px}' +
    '.ai-c .t{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.ai-c .t b{font:900 18px Archivo,sans-serif}.ai-c .bot{font-size:28px;line-height:1}.ai-c .sp{flex:1}.ai-c p{margin:0;color:var(--muted);font-size:14px;line-height:1.45}.ai-c .pill{border-radius:999px;padding:4px 10px;font:700 11px "JetBrains Mono",monospace;letter-spacing:.06em;text-transform:uppercase;border:1px solid var(--line)}.ai-c .pill.ok{color:var(--green);border-color:var(--green)}.ai-c .pill.no{color:var(--yellow);border-color:var(--yellow)}' +
    '.ai-c ol{margin:0;padding-left:20px;color:#d6d9ee;font-size:14px;line-height:1.6}.ai-c ol a{color:#c9b8ff}.ai-c code{background:rgba(255,255,255,.1);border-radius:6px;padding:1px 6px;font-size:13px}.ai-c .row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.ai-c label{display:flex;gap:8px;align-items:center;font-size:14px;cursor:pointer}.ai-c .err{color:#ffb3c0;font-size:13px}' +
    '.nw-ai{display:inline-block;border-radius:999px;padding:3px 9px;font:700 11px Archivo,sans-serif;background:rgba(139,92,246,.22);color:#d8ccff;border:1px solid rgba(139,92,246,.6)}';
  function aiCard() {
    var c = h('div', 'ai-c'), A = window.AI_NEWS; if (!A) return c;
    var t = h('div', 't'); t.appendChild(h('span', 'bot', '🤖')); t.appendChild(h('b', null, 'Redactor IA')); var pill = h('span', 'pill', 'Comprobando…'); t.appendChild(pill); t.appendChild(h('span', 'sp'));
    var go = btn('Redactar ahora', function () { go.disabled = true; go.textContent = 'Redactando…'; A.run().then(function () { load(); }, function () {}).then(function () { go.disabled = false; go.textContent = 'Redactar ahora'; refresh(); }); }, 'o'); t.appendChild(go); c.appendChild(t);
    var info = h('p', null, 'Convierte los resultados, campeones, avances de torneo y fichajes en borradores de noticia. Nunca publica sola: tú revisas, editas y publicas.'); c.appendChild(info);
    var extra = h('div'); c.appendChild(extra);
    function refresh() { A.status().then(function (s) { extra.innerHTML = '';
        if (!s.configured) { pill.className = 'pill no'; pill.textContent = 'Falta la clave'; go.disabled = true;
          var ol = h('ol'); ol.innerHTML = '<li>Entra a <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener">console.anthropic.com</a>, crea una cuenta y una <b>API key</b> (pide añadir saldo; cada noticia cuesta unos centavos de dólar).</li><li>En <a href="https://supabase.com/dashboard/project/ryahntcvsqjhcurvyrdr/functions/secrets" target="_blank" rel="noopener">Supabase → Edge Functions → Secrets</a>, añade un secreto llamado <code>ANTHROPIC_API_KEY</code> y pega la clave.</li><li>Vuelve aquí y pulsa <b>Redactar ahora</b>. No compartas la clave con nadie (tampoco en el chat).</li>'; extra.appendChild(ol); return; }
        pill.className = 'pill ok'; pill.textContent = 'Activo'; go.disabled = A.busy();
        var r = h('div', 'row'); var lb = h('label'), ck = h('input'); ck.type = 'checkbox'; ck.checked = A.auto(); ck.onchange = function () { A.setAuto(ck.checked); }; lb.appendChild(ck); lb.appendChild(document.createTextNode('Redactar automáticamente cuando haya novedades (con el panel abierto)')); r.appendChild(lb); extra.appendChild(r);
        extra.appendChild(h('p', null, (s.pending ? s.pending + (s.pending === 1 ? ' novedad pendiente' : ' novedades pendientes') + ' de redactar. ' : 'Todo al día. ') + (s.last_run ? 'Última vez: ' + N.fdate(s.last_run) + '.' : '')));
        if (s.last_error) extra.appendChild(h('p', 'err', 'Último error: ' + s.last_error));
      }, function (e) { pill.className = 'pill no'; pill.textContent = 'Sin conexión'; extra.innerHTML = ''; extra.appendChild(h('p', 'err', e.message || 'No se pudo consultar el redactor.')); go.disabled = true; }); }
    refresh(); var off = A.on(function (ev) { if (!document.body.contains(c)) return off(); if (ev.result) { refresh(); load(); } });
    return c;
  }
  if (!document.getElementById('nw-css')) { var st = document.createElement('style'); st.id = 'nw-css'; st.textContent = css; document.head.appendChild(st); }
  var bar = h('div', 'nw-bar');
  [['all', 'Todas'], ['published', 'Publicadas'], ['scheduled', 'Programadas'], ['draft', 'Borradores'], ['ai', '🤖 De la IA'], ['featured', '★ Destacadas']].forEach(function (f) { var x = h('button', 'chip' + (filt === f[0] ? ' on' : ''), f[1]); x.style.margin = '0'; x.onclick = function () { filt = window.__newsFilt = f[0]; draw(); [].forEach.call(bar.querySelectorAll('.chip'), function (c) { c.classList.toggle('on', c === x); }); }; bar.appendChild(x); });
  bar.appendChild(h('div', 'sp')); bar.appendChild(btn('+ Crear noticia', function () { editor(null); }, 'o')); b.appendChild(aiCard()); b.appendChild(bar); b.appendChild(box);
  var all = [], tot = {};
  function stInfo(a) { var fut = new Date(a.publish_at) > new Date(); if (a.status === 'draft') return ['dr', 'Borrador']; if (a.status === 'scheduled' && fut) return ['sch', 'Programada · ' + new Date(a.publish_at).toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })]; return ['pub', 'Publicada']; }
  function load() { box.innerHTML = ''; box.appendChild(window.M && M.skel ? M.skel(4) : h('p', 'hint', 'Cargando noticias…'));
    N.listAll().then(function (r) { all = r.data || []; return N.totals(all.map(function (a) { return a.id; })); }).then(function (r) { tot = {}; (r.data || []).forEach(function (x) { tot[x.article_id] = (tot[x.article_id] || 0) + x.total; }); draw(); }, function (e) { box.innerHTML = ''; box.appendChild(h('p', 'err', 'No se pudieron cargar las noticias: ' + (e && e.message || 'sin conexión'))); }); }
  function draw() {
    box.innerHTML = ''; var l = all.filter(function (a) { if (filt === 'all') return true; if (filt === 'featured') return a.featured; if (filt === 'ai') return a.ai; var s = stInfo(a)[0]; return filt === 'published' ? s === 'pub' : filt === 'scheduled' ? s === 'sch' : s === 'dr'; });
    if (!l.length) { var e = h('div', 'box'); e.appendChild(h('h3', 'x', all.length ? 'Nada en este filtro' : 'Todavía no hay noticias')); e.appendChild(h('p', 'hint', 'Toca "+ Crear noticia" para escribir la primera.')); box.appendChild(e); return; }
    var ls = h('div', 'nw-list');
    l.forEach(function (a, i) { var r = h('div', 'nw-row'); r.style.animationDelay = Math.min(i, 10) * 30 + 'ms';
      if (a.cover_url) { var im = h('img'); im.src = a.cover_url; im.alt = ''; im.loading = 'lazy'; r.appendChild(im); } else r.appendChild(h('div', 'ph'));
      var w = h('div'); w.appendChild(h('h3', null, a.title)); var mt = h('div', 'nw-meta'), c = N.cat(a.category), ch = h('span', 'nw-ch', c.name); ch.style.setProperty('--c', c.color); mt.appendChild(ch); var s = stInfo(a); mt.appendChild(h('span', 'nw-st ' + s[0], s[1])); if (a.ai) mt.appendChild(h('span', 'nw-ai', '🤖 IA')); mt.appendChild(h('span', null, N.fdate(a.publish_at))); if (tot[a.id]) mt.appendChild(h('span', null, '· ' + tot[a.id] + ' reacciones')); w.appendChild(mt); r.appendChild(w);
      var ac = h('div', 'nw-acts'), star = h('button', 'nw-star' + (a.featured ? ' on' : ''), '★'); star.type = 'button'; star.title = a.featured ? 'Quitar de destacadas' : 'Destacar'; star.onclick = function () { star.disabled = true; N.save(Object.assign({}, a, { featured: !a.featured })).then(function () { a.featured = !a.featured; toast(a.featured ? 'Noticia destacada' : 'Ya no está destacada'); draw(); }, function () { star.disabled = false; toast('No se pudo cambiar.', true); }); }; ac.appendChild(star);
      ac.appendChild(btn('Editar', function () { editor(a); }, 'sm'));
      if (s[0] === 'pub') { var v = h('a', 'b sm', 'Ver ↗'); v.href = 'noticias.html#n-' + a.id; v.target = '_blank'; v.rel = 'noopener'; v.style.textDecoration = 'none'; ac.appendChild(v); }
      ac.appendChild(btn('Eliminar', function () { U.confirmBox('¿Eliminar "' + a.title + '"?', 'Se borra para siempre, con sus reacciones.', 'Eliminar', function () { N.remove(a.id).then(function () { toast('Noticia eliminada'); load(); }, function () { toast('No se pudo eliminar.', true); }); }); }, 'd sm'));
      r.appendChild(ac); ls.appendChild(r); });
    box.appendChild(ls);
  }
  function localDT(d) { var p = function (n) { return String(n).padStart(2, '0'); }; return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes()); }
  function editor(a) {
    var isNew = !a; a = a ? Object.assign({}, a) : { title: '', summary: '', body: '', category: 'general', featured: false, status: 'published', publish_at: new Date().toISOString(), cover_url: null };
    U.dialog(isNew ? 'Crear noticia' : 'Editar noticia', function (bx, close) {
      bx.classList.add('nw-ed');
      var f = h('form', 'nw-f'), err = h('p', 'err');
      function fld(label, el, help) { var l = h('label', 'f', label); l.appendChild(el); if (help) l.appendChild(help); f.appendChild(l); return el; }
      var ti = h('input', 'in'); ti.maxLength = 140; ti.value = a.title; ti.placeholder = 'Ej.: Galaxy se corona campeón de la Primera división'; fld('Título', ti);
      var su = h('textarea', 'in'); su.rows = 2; su.maxLength = 300; su.value = a.summary; su.placeholder = 'Un resumen corto que aparece en la tarjeta'; var sc = h('div', 'nw-cnt'); function cnt() { sc.textContent = su.value.length + '/300'; } su.oninput = cnt; cnt(); fld('Descripción breve', su, sc);
      var bo = h('textarea', 'in'); bo.rows = 12; bo.maxLength = 40000; bo.value = a.body; bo.placeholder = 'Escribe la noticia completa…'; var hp = h('p', 'nw-help'); hp.innerHTML = 'Formato: deja una línea en blanco entre párrafos · <code>## Subtítulo</code> · <code>**negrita**</code> · <code>*cursiva*</code> · <code>- lista</code> · <code>&gt; cita</code>'; fld('Contenido completo', bo, hp);
      var two = h('div', 'nw-two'), cs = h('select', 'in'); N.CATS.forEach(function (c) { var o = h('option', null, c[1]); o.value = c[0]; if (c[0] === a.category) o.selected = true; cs.appendChild(o); });
      var l1 = h('label', 'f', 'Categoría'); l1.appendChild(cs); two.appendChild(l1);
      var l2 = h('div', 'f', 'Importancia'), fe = h('label'); fe.style.cssText = 'display:flex;gap:10px;align-items:center;border:1px solid var(--line);border-radius:14px;padding:13px 16px;margin-top:6px;color:var(--fg);cursor:pointer'; var fc = h('input'); fc.type = 'checkbox'; fc.checked = !!a.featured; fe.appendChild(fc); fe.appendChild(document.createTextNode('★ Destacar esta noticia')); l2.appendChild(fe); two.appendChild(l2); f.appendChild(two);
      // ---- portada ----
      f.appendChild(h('h2', 'x', 'Imagen de portada'));
      var mode = a.cover_url ? 'keep' : 'none', photo = null, pose = null, style = 'morado', withTitle = true, blob = null, prev = h('div', 'nw-prev'), opts = h('div'), seg = h('div', 'nw-seg');
      var MODES = [['none', 'Sin imagen'], ['photo', 'Subir imagen'], ['mascot', 'Mascota'], ['design', 'Diseño con mascota']]; if (a.cover_url) MODES.unshift(['keep', 'Imagen actual']);
      MODES.forEach(function (m) { var x = h('button', mode === m[0] ? 'on' : '', m[1]); x.type = 'button'; x.onclick = function () { mode = m[0]; [].forEach.call(seg.children, function (c) { c.classList.toggle('on', c === x); }); build(); }; seg.appendChild(x); });
      f.appendChild(seg); f.appendChild(opts); f.appendChild(prev);
      var fi = h('input'); fi.type = 'file'; fi.accept = 'image/png,image/jpeg,image/webp'; fi.style.display = 'none'; f.appendChild(fi);
      fi.onchange = function () { var file = fi.files[0]; if (!file) return; if (file.size > 25 * 1024 * 1024) return toast('La imagen es demasiado grande (máx. 25 MB).', true); busy(); N.prepPhoto(file).then(function (p) { photo = p; refresh(); }, function () { toast('No se pudo leer esa imagen.', true); refresh(); }); };
      function busy() { var l = prev.querySelector('.ld'); if (!l) { l = h('div', 'ld', 'Preparando imagen…'); prev.appendChild(l); } }
      function show(url) { prev.innerHTML = ''; if (!url) { prev.appendChild(document.createTextNode(mode === 'none' ? 'La noticia se mostrará con un fondo de su categoría.' : 'Elige una imagen')); return; } var im = h('img'); im.src = url; im.alt = 'Vista previa de la portada'; prev.appendChild(im); }
      function poses(allowNone) { var g = h('div', 'nw-pose'); if (allowNone) { var n = h('button'); n.type = 'button'; n.appendChild(h('span', 'none', 'Sin mascota')); if (!pose) n.className = 'on'; n.onclick = function () { pose = null; build(); }; g.appendChild(n); }
        N.MASCOT.forEach(function (m) { var x = h('button', pose === m[0] ? 'on' : ''); x.type = 'button'; x.title = m[1]; var im = h('img'); im.src = N.mascotUrl(m[0]); im.alt = m[1]; im.loading = 'lazy'; x.appendChild(im); x.onclick = function () { pose = m[0]; build(); }; g.appendChild(x); }); return g; }
      function chk(label, val, fn) { var l = h('label'), c = h('input'); c.type = 'checkbox'; c.checked = val; c.onchange = function () { fn(c.checked); refresh(); }; l.appendChild(c); l.appendChild(document.createTextNode(label)); return l; }
      function styleSel() { var s = h('div', 'nw-seg'); [['morado', 'Fondo morado'], ['fuego', 'Fondo fuego']].forEach(function (x) { var t = h('button', style === x[0] ? 'on' : '', x[1]); t.type = 'button'; t.onclick = function () { style = x[0]; build(); }; s.appendChild(t); }); return s; }
      function build() {
        opts.innerHTML = ''; blob = null;
        if (mode === 'photo') { opts.appendChild(btn(photo ? 'Cambiar imagen' : 'Elegir imagen del dispositivo', function () { fi.click(); }, 'o')); var o = h('div', 'nw-opt'); o.appendChild(chk('Escribir el título sobre la imagen', withTitle && !!photo && photo.useTitle, function (v) { if (photo) photo.useTitle = v; })); o.appendChild(chk('Añadir la mascota', !!(photo && photo.useMascot), function (v) { if (photo) photo.useMascot = v; build(); })); if (photo) opts.appendChild(o); if (photo && photo.useMascot) opts.appendChild(poses(false)); }
        if (mode === 'mascot') { opts.appendChild(h('p', 'nw-help', 'Elige una pose. Se coloca sobre el fondo de Magna sin modificar al personaje.')); opts.appendChild(styleSel()); opts.appendChild(poses(false)); }
        if (mode === 'design') { opts.appendChild(h('p', 'nw-help', 'Portada con el título de la noticia y, si quieres, una pose de la mascota.')); opts.appendChild(styleSel()); opts.appendChild(poses(true)); }
        refresh();
      }
      var seq = 0;
      function refresh() { var my = ++seq; blob = null;
        if (mode === 'keep') return show(a.cover_url); if (mode === 'none') return show(null);
        if (mode === 'photo') { if (!photo) return show(null); if (!photo.useTitle && !(photo.useMascot && pose)) { busy(); return N.toBlob(photo.canvas, .9).then(function (bl) { if (my !== seq) return; blob = bl; show(URL.createObjectURL(bl)); }); } }
        if (mode === 'mascot' && !pose) return show(null);
        busy(); N.compose({ photo: mode === 'photo' ? photo.src : null, mascot: (mode === 'photo' ? (photo.useMascot ? pose : null) : pose), title: (mode === 'design' || (mode === 'photo' && photo.useTitle)) ? (ti.value.trim() || 'Título de la noticia') : '', category: cs.value, style: style })
          .then(function (r) { if (my !== seq) return; blob = r.blob; show(r.url); }, function () { if (my === seq) show(null); toast('No se pudo crear la portada.', true); }); }
      var tt = null; ti.addEventListener('input', function () { if (mode === 'design' || (mode === 'photo' && photo && photo.useTitle)) { clearTimeout(tt); tt = setTimeout(refresh, 500); } });
      cs.addEventListener('change', function () { if (mode === 'design' || mode === 'mascot' || (mode === 'photo' && photo && photo.useTitle)) refresh(); });
      build();
      // ---- publicación ----
      f.appendChild(h('h2', 'x', 'Publicación'));
      var fut = new Date(a.publish_at) > new Date(), pm = a.status === 'draft' ? 'draft' : (a.status === 'scheduled' && fut ? 'scheduled' : 'published'), pubs = h('div', 'nw-pubs'), dt = h('input', 'in'); dt.type = 'datetime-local';
      dt.value = localDT(fut ? new Date(a.publish_at) : new Date(Date.now() + 3600e3)); dt.style.marginTop = '8px';
      [['published', isNew || pm !== 'published' ? 'Publicar ahora' : 'Publicada'], ['draft', 'Guardar como borrador'], ['scheduled', 'Programar']].forEach(function (p) { var l = h('label', pm === p[0] ? 'on' : ''), r = h('input'); r.type = 'radio'; r.name = 'nwpub'; r.checked = pm === p[0]; r.onchange = function () { pm = p[0]; [].forEach.call(pubs.children, function (c) { c.classList.toggle('on', c === l); }); dt.style.display = pm === 'scheduled' ? '' : 'none'; go.textContent = label(); }; l.appendChild(r); l.appendChild(document.createTextNode(p[1])); pubs.appendChild(l); });
      f.appendChild(pubs); f.appendChild(dt); dt.style.display = pm === 'scheduled' ? '' : 'none';
      f.appendChild(err);
      function label() { return pm === 'draft' ? 'Guardar borrador' : pm === 'scheduled' ? 'Programar noticia' : (isNew || a.status !== 'published' ? 'Publicar noticia' : 'Guardar cambios'); }
      var row = h('div', 'row'); row.appendChild(btn('Cancelar', close)); var go = h('button', 'b o', label()); go.type = 'submit'; row.appendChild(go); f.appendChild(row);
      f.onsubmit = function (e) { e.preventDefault(); err.textContent = '';
        var t = ti.value.trim().replace(/\s+/g, ' '); if (t.length < 3) return err.textContent = 'El título debe tener al menos 3 caracteres.';
        if (pm !== 'draft' && !bo.value.trim() && !su.value.trim()) return err.textContent = 'Escribe la descripción o el contenido antes de publicar.';
        var when = new Date(); if (pm === 'scheduled') { when = new Date(dt.value); if (isNaN(when)) return err.textContent = 'Elige una fecha válida.'; if (when <= new Date()) return err.textContent = 'La fecha programada debe ser en el futuro.'; }
        if (pm !== 'draft' && mode !== 'keep' && mode !== 'none' && !blob) return err.textContent = 'La portada aún se está preparando o falta elegir la imagen.';
        go.disabled = true; go.textContent = blob ? 'Subiendo imagen…' : 'Guardando…';
        var up = blob ? N.upload(blob, 'webp') : Promise.resolve(mode === 'keep' ? a.cover_url : (mode === 'none' ? null : a.cover_url));
        up.then(function (url) { go.textContent = 'Guardando…';
          var keepDate = !isNew && a.status === 'published' && pm === 'published';
          return N.save({ id: a.id, title: t, summary: su.value.trim(), body: bo.value.replace(/\s+$/, ''), category: cs.value, featured: fc.checked, cover_url: url, status: pm, publish_at: keepDate ? a.publish_at : when.toISOString(), author_email: window.MAGNA_ADMIN && MAGNA_ADMIN.email });
        }).then(function () { close(); toast(pm === 'draft' ? 'Borrador guardado' : pm === 'scheduled' ? 'Noticia programada' : 'Noticia publicada'); if (pm === 'published') { MAGNA.addNews('announcement', 'Nueva noticia: ' + t); MAGNA.save(); } load(); },
          function (e2) { go.disabled = false; go.textContent = label(); err.textContent = 'No se pudo guardar: ' + (e2 && e2.message || 'sin conexión'); });
      };
      bx.appendChild(f); ti.focus();
    });
  }
  load();
  if (window.__newsOpenEditor) { window.__newsOpenEditor = false; editor(null); }
};
