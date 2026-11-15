'use strict';
// Panel de administración · módulo «events»: se descarga solo al abrir su sección (lo carga admin.js).
ADMIN_MOD('events', function (A) {
  var $ = A.$, S = A.S, btn = A.btn, commit = A.commit, confirmBox = A.confirmBox, dialog = A.dialog, evRpc = A.evRpc, fdate = A.fdate, go = A.go, h = A.h, render = A.render, table = A.table, toLocal = A.toLocal, toUtc = A.toUtc, toast = A.toast;
  function evEdit(e0) {
    var isNew = !e0, e = e0 ? Object.assign({}, e0) : { id: MAGNA.id(), kind: 'especial', title: '', at: null, end: null, desc: '', place: '', link: '', linkLabel: '' };
    dialog(isNew ? 'Nuevo evento' : 'Editar evento', function (b, close) {
      function fl(label, el) { var l = h('label', 'f', label); l.appendChild(el); b.appendChild(l); return el; }
      var ti = h('input', 'in'); ti.maxLength = 80; ti.value = e.title; ti.placeholder = 'Ej.: Noche de amistosos'; fl('Nombre del evento', ti);
      var ki = h('select', 'in'); Object.keys($.EVK).forEach(function (k) { var o = h('option', null, $.EVK[k]); o.value = k; ki.appendChild(o); }); ki.value = e.kind; fl('Tipo', ki);
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
    if ($.EVC === null) { $.EVC = {}; evRpc('event_rsvp_counts').then(function (L) { (L || []).forEach(function (x) { $.EVC[x.event_id] = Number(x.n); }); if ($.tab === 'eventos') render(); }, function () {}); }
    var bar = h('div', 'bar2'); bar.appendChild(h('p', 'hint', 'El Balón de Oro y los partidos de final o semifinal aparecen solos en Eventos. Aquí creas los demás: torneos relámpago, noches de amistosos, transmisiones, premiaciones…')); bar.appendChild(h('div', 'sp')); bar.appendChild(btn('Balón de Oro →', function () { go('balon'); })); bar.appendChild(btn('+ Nuevo evento', function () { evEdit(null); }, 'o')); b.appendChild(bar);
    var L = (S().events || []).slice().sort(function (a, c) { return String(c.at).localeCompare(String(a.at)); }), now = MAGNA.now();
    if (!L.length) { b.appendChild(h('p', 'sub', 'Todavía no hay eventos. Crea el primero con «+ Nuevo evento».')); return; }
    b.appendChild(table(['Evento', 'Tipo', 'Cuándo', 'Van', 'Estado', ''], L.map(function (e) { var past = (e.end || e.at) < now;
      return [h('b', null, e.title), $.EVK[e.kind] || e.kind, fdate(e.at), btn(String($.EVC[e.id] || 0), function () { evWho(e); }, 'sm'), past ? 'Pasado' : e.at <= now ? '🔴 En curso' : 'Próximo',
        [btn('Editar', function () { evEdit(e); }, 'sm'), btn('Duplicar', function () { var c = Object.assign({}, e, { id: MAGNA.id(), title: e.title + ' (copia)' }); S().events.push(c); commit('Evento duplicado'); evEdit(c); }, 'sm'), btn('Eliminar', function () { confirmBox('¿Eliminar «' + e.title + '»?', 'Desaparece de la página de Eventos.', 'Eliminar', function () { S().events = S().events.filter(function (x) { return x !== e; }); commit('Evento eliminado'); }); }, 'sm d')]]; })));
  }
  return { eventsV: eventsV };
});
