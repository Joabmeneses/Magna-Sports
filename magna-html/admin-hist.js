'use strict';
// Panel de administración · módulo «hist»: se descarga solo al abrir su sección (lo carga admin.js).
ADMIN_MOD('hist', function (A) {
  var $ = A.$, S = A.S, btn = A.btn, by = A.by, commit = A.commit, confirmBox = A.confirmBox, dialog = A.dialog, h = A.h, nk = A.nk, okName = A.okName, rr = A.rr, table = A.table, toast = A.toast;
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
  function histV(b) {
    var L = S().history || [], PS = MAGNA.playerStats();
    var bar = h('div', 'bar2'); bar.appendChild(h('div', 'sp')); bar.appendChild(btn('+ Agregar torneo pasado', function () { histDlg(); }, 'o')); b.appendChild(bar);
    b.appendChild(h('p', 'hint', 'Aquí van los torneos que se jugaron antes del sitio, con sus marcadores y campeones. No hacen falta valoraciones: los marcadores ajustan el nivel de los equipos y los campeones suman el título a su media. También salen en Competiciones → Historial.'));
    if (!L.length) return b.appendChild(h('p', 'em', 'Todavía no hay torneos en el historial.'));
    b.appendChild(table(['Torneo', 'Fecha', 'Campeón', 'Partidos', 'Jugadores campeones', ''], L.slice().sort(function (a, c) { return String(c.date || '').localeCompare(String(a.date || '')); }).map(function (e) {
      return [h('b', null, e.name + (e.mundial ? ' 🌍' : '')), e.date || '—', e.champion || '—', String((e.matches || []).length), (e.champIds || []).map(function (id) { var p = by(S().players, id); return p ? p.name : null; }).filter(Boolean).join(', ') || '—',
        [btn('Editar', function () { histDlg(e); }), btn('Eliminar', function () { confirmBox('¿Eliminar "' + e.name + '" del historial?', 'Se quitan sus marcadores, el título de sus jugadores y el trofeo del palmarés.', 'Eliminar', function () { S().history = L.filter(function (x) { return x !== e; }); S().teams.forEach(function (t) { if (t.trophies) t.trophies = t.trophies.filter(function (x) { return x.hist !== e.id; }); }); commit('Torneo eliminado del historial'); }); }, 'd')]]; })));
  }
  return { histV: histV };
});
