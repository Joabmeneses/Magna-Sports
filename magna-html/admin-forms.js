'use strict';
// Formularios grandes del panel con estilo "arena": programar partido, registrar equipo y registrar persona.
// Visuales e interactivos, pero guardan exactamente lo mismo que los formularios anteriores (mismas validaciones).
window.ADMIN_FORMS = (function () {
  var A = null, h = function (t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  function S() { return MAGNA.S; }
  function pad(n) { return String(n).padStart(2, '0'); }
  function localStr(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function chip(txt, on, cls) { var b = h('button', 'fw-chip' + (on ? ' on' : '') + (cls ? ' ' + cls : ''), txt); b.type = 'button'; return b; }
  function pick(wrap, b) { wrap.querySelectorAll('.fw-chip.on').forEach(function (x) { x.classList.remove('on'); }); if (b) b.classList.add('on'); }
  function sec(body, n, title, sub) { var s = h('section', 'fw-s'), hd = h('div', 'fw-sh'); hd.appendChild(h('span', 'fw-n', String(n))); hd.appendChild(h('span', 'fw-st')); var t = h('div'); t.appendChild(h('b', null, title)); if (sub) t.appendChild(h('small', null, sub)); hd.appendChild(t); s.appendChild(hd); body.appendChild(s); return s; }
  // ventana: cabecera con título, cuerpo con scroll y pie fijo con acciones
  function shell(title, kicker, color) {
    var ov = h('div', 'fw-ov'), d = h('div', 'fw'); d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-label', title); d.style.setProperty('--fc', color || '#c6ff1a');
    var hd = h('div', 'fw-h'), tt = h('div'); tt.appendChild(h('span', 'fw-k', kicker)); tt.appendChild(h('h2', null, title)); hd.appendChild(tt); var x = h('button', 'fw-x', '✕'); x.type = 'button'; x.setAttribute('aria-label', 'Cerrar'); hd.appendChild(x); d.appendChild(hd);
    var pg = h('div', 'fw-pg'), pgs = h('span', 'fw-pgs', '0'), pgb = h('div', 'fw-pgb'), pgf = h('i'), pgt = h('span', 'fw-pgt', ''); pgb.appendChild(pgf); pgb.appendChild(pgt); pg.appendChild(pgs); pg.appendChild(pgb); d.appendChild(pg);
    var body = h('div', 'fw-b'), ft = h('div', 'fw-f'), err = h('p', 'fw-err'); d.appendChild(body); ft.appendChild(err); d.appendChild(ft); ov.appendChild(d); document.body.appendChild(ov); document.body.classList.add('fw-open');
    requestAnimationFrame(function () { ov.classList.add('on'); });
    function close() { ov.classList.remove('on'); document.body.classList.remove('fw-open'); document.removeEventListener('keydown', esc); setTimeout(function () { ov.remove(); }, 220); }
    function esc(e) { if (e.key === 'Escape') close(); } document.addEventListener('keydown', esc);
    x.onclick = close; ov.addEventListener('mousedown', function (e) { if (e.target === ov) close(); });
    function prog(secs, ready) { var n = secs.filter(function (x) { return x.ok; }).length, t = secs.length; secs.forEach(function (x) { x.s.classList.toggle('done', !!x.ok); x.s.classList.toggle('need', !x.ok && !!x.req); }); pgs.textContent = n; pgf.style.width = Math.round(n / t * 100) + '%'; pg.classList.toggle('full', n === t); pg.classList.toggle('ready', !!ready); pgt.textContent = n === t ? '¡COMPLETO!' : ready ? 'LISTO · ' + n + ' / ' + t : n + ' / ' + t; }
    return { prog: prog, ov: ov, d: d, body: body, ft: ft, err: function (t) { err.textContent = t || ''; if (t) { err.classList.remove('shake'); void err.offsetWidth; err.classList.add('shake'); } }, close: close };
  }
  function burst(el) { var r = el.getBoundingClientRect(); for (var i = 0; i < 16; i++) { var p = h('i', 'fw-cf'); p.style.left = r.left + r.width / 2 + 'px'; p.style.top = r.top + r.height / 2 + 'px'; p.style.setProperty('--dx', (Math.random() * 2 - 1) * 160 + 'px'); p.style.setProperty('--dy', (-Math.random() * 140 - 40) + 'px'); p.style.background = ['#c6ff1a', '#ff6a00', '#ffd23f', '#22d3ee', '#ff4fa3'][i % 5]; document.body.appendChild(p); setTimeout(function (q) { q.remove(); }.bind(null, p), 900); } }

  // ================= PROGRAMAR PARTIDO =================
  function match() {
    var comps = S().leagues.filter(function (c) { return c.status !== 'finished' && c.teamIds.length >= 2; }).map(function (c) { return { key: 'league:' + c.id, type: 'league', c: c, name: c.name, k: 'Liga', ic: '📋', col: '#3b82f6' }; })
      .concat(S().tournaments.filter(function (c) { return c.status !== 'finished' && c.teamIds.length >= 2; }).map(function (c) { var kd = MAGNA.compKind({ type: 'tournament', cid: c.id }); return { key: 'tournament:' + c.id, type: 'tournament', c: c, name: c.name, k: kd === 'champions' ? 'Champions' : kd === 'mundial' ? 'Mundial' : 'Torneo', ic: kd === 'champions' ? '⭐' : kd === 'mundial' ? '🌍' : '🏆', col: kd === 'champions' ? '#22d3ee' : kd === 'mundial' ? '#10b981' : '#fbbf24' }; }));
    if (S().teams.length >= 2) comps.push({ key: 'friendly:0', type: 'friendly', c: { id: 0, teamIds: S().teams.map(function (t) { return t.id; }) }, name: 'Amistoso', k: 'Cualquier equipo · 5.000 pts', ic: '🤝', col: '#f472b6' });
    if (!comps.length) return A.toast('Necesitas al menos 2 equipos registrados.', true);
    var st = { comp: comps[0], home: null, away: null, date: null, time: '20:00', round: '', sets: [{ mode: '', map: '' }, { mode: '', map: '' }, { mode: '', map: '' }] };
    var W = shell('Programar partido', 'Nuevo partido', '#c6ff1a'), B = W.body, PT = MAGNA.teamPoints(), RK = {}; S().teams.slice().sort(function (a, b2) { return ((PT[b2.id] || {}).pts || 0) - ((PT[a.id] || {}).pts || 0); }).forEach(function (t, i) { RK[t.id] = i + 1; });
    // vista previa fija arriba
    var pv = h('div', 'fw-pv'); B.appendChild(pv);
    function slot(side) { var s = h('button', 'fw-slot'); s.type = 'button'; var t = st[side]; if (t) { s.appendChild(M.crest(t, MAGNA.teamName(t), 64)); s.appendChild(h('b', null, MAGNA.teamName(t))); if (RK[t]) s.appendChild(h('span', 'fw-rk', String(RK[t]))); var pt = PT[t]; s.appendChild(h('small', null, pt ? '#' + RK[t] + ' · ' + String(pt.pts).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' pts' : 'Sin ranking')); s.title = 'Quitar'; s.onclick = function () { st[side] = null; drawTeams(); drawPv(); }; }
      else { s.classList.add('empty'); s.appendChild(h('span', 'q', '?')); s.appendChild(h('b', null, side === 'home' ? 'Local' : 'Visitante')); s.appendChild(h('small', null, 'Elige abajo')); s.onclick = function () { tg.scrollIntoView({ behavior: 'smooth', block: 'center' }); }; } return s; }
    function h2h() { if (!st.home || !st.away) return null; var w = 0, l = 0; S().matches.forEach(function (m) { if (m.status !== 'finished' || m.hs == null) return; if (m.home === st.home && m.away === st.away) { if (m.hs > m.as) w++; else l++; } else if (m.home === st.away && m.away === st.home) { if (m.as > m.hs) w++; else l++; } }); return [w, l]; }
    function drawPv() { pv.innerHTML = ''; pv.style.setProperty('--cc', st.comp.col); var top = h('div', 'fw-pt'); top.appendChild(h('span', 'tag', st.comp.ic + ' ' + (st.comp.type === 'friendly' ? 'Amistoso' : st.comp.k + ' · ' + st.comp.name))); if (st.round) top.appendChild(h('span', 'rd', st.round)); pv.appendChild(top);
      var vs = h('div', 'fw-vs'); vs.appendChild(slot('home')); var mid = h('div', 'mid'); mid.appendChild(h('span', 'v', 'VS')); var sw = h('button', 'fw-sw', '⇄'); sw.type = 'button'; sw.title = 'Intercambiar local y visitante'; sw.onclick = function () { var x = st.home; st.home = st.away; st.away = x; drawTeams(); drawPv(); }; mid.appendChild(sw); vs.appendChild(mid); vs.appendChild(slot('away')); pv.appendChild(vs);
      var info = h('div', 'fw-pi'), when = whenTxt(); info.appendChild(h('span', null, '📅 ' + (when || 'Sin fecha'))); info.appendChild(h('span', null, '🎮 ' + st.sets.length + (st.sets.length === 1 ? ' set' : ' sets'))); var hh = h2h(); if (hh) info.appendChild(h('span', null, '⚔️ Historial ' + hh[0] + '-' + hh[1])); pv.appendChild(info); check(); progM(); }
    function progM() { if (!s5) return; W.prog([{ s: s1, ok: true }, { s: s2, ok: st.home && st.away, req: 1 }, { s: s3, ok: !!st.date }, { s: s4, ok: !!st.round }, { s: s5, ok: st.sets.every(function (x) { return x.mode && x.map; }) }], st.home && st.away); }
    function atLocal() { if (!st.date) return ''; return st.date + 'T' + st.time; }
    function whenTxt() { var l = atLocal(); if (!l) return ''; var d = new Date(l); if (isNaN(d)) return ''; var mins = Math.round((d - Date.now()) / 6e4), rel = mins < 0 ? 'ya pasó' : mins < 60 ? 'en ' + mins + ' min' : mins < 1440 ? 'en ' + Math.round(mins / 60) + ' h' : 'en ' + Math.round(mins / 1440) + ' días';
      return d.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' }) + ' · ' + d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) + ' (' + rel + ')'; }
    function check() { var e = ''; if (st.home && st.away && st.date) { var u = A.toUtc(atLocal()); if (u) e = A.conflict({ id: 0, type: st.comp.type, cid: st.comp.c.id }, u, st.home, st.away, st.round || null) || ''; } W.err(e ? '⚠ ' + e : ''); go.disabled = !(st.home && st.away); }
    // 1. competición
    var s5 = null, s1 = sec(B, 1, 'Competición', 'Toca dónde se juega'), cg = h('div', 'fw-cards'); s1.appendChild(cg);
    comps.forEach(function (o) { var c = h('button', 'fw-card' + (o === st.comp ? ' on' : '')); c.type = 'button'; c.style.setProperty('--cc', o.col); c.appendChild(h('span', 'ic', o.ic)); var t = h('span', 'tx'); t.appendChild(h('b', null, o.type === 'friendly' ? 'Amistoso' : o.name)); t.appendChild(h('small', null, o.type === 'friendly' ? o.k : o.k + ' · ' + o.c.teamIds.length + ' equipos')); c.appendChild(t);
      c.onclick = function () { st.comp = o; cg.querySelectorAll('.fw-card').forEach(function (x) { x.classList.remove('on'); }); c.classList.add('on'); if (st.home && o.c.teamIds.indexOf(st.home) < 0) st.home = null; if (st.away && o.c.teamIds.indexOf(st.away) < 0) st.away = null; st.round = ''; rdIn.value = ''; drawTeams(); drawRounds(); drawPv(); }; cg.appendChild(c); });
    // 2. equipos
    var s2 = sec(B, 2, 'Equipos', 'Primero el local, luego el visitante'), tb = h('div', 'fw-row'), rnd = chip('🎲 Al azar'), tg = h('div', 'fw-teams'); tb.appendChild(rnd); s2.appendChild(tb); s2.appendChild(tg);
    rnd.onclick = function () { var L = st.comp.c.teamIds.slice(); if (L.length < 2) return; var a = L.splice(Math.floor(Math.random() * L.length), 1)[0], b2 = L[Math.floor(Math.random() * L.length)]; st.home = a; st.away = b2; drawTeams(); drawPv(); var vv = pv.querySelector('.fw-vs'); if (vv) { vv.classList.remove('roll'); void vv.offsetWidth; vv.classList.add('roll'); } };
    function drawTeams() { tg.innerHTML = ''; st.comp.c.teamIds.slice().sort(function (a, b2) { return MAGNA.teamName(a).localeCompare(MAGNA.teamName(b2)); }).forEach(function (tid) {
      var on = tid === st.home ? 'h' : tid === st.away ? 'a' : '', b2 = h('button', 'fw-tm' + (on ? ' on-' + on : '')); b2.type = 'button'; b2.appendChild(M.crest(tid, MAGNA.teamName(tid), 34)); b2.appendChild(h('span', null, MAGNA.teamName(tid))); if (on) b2.appendChild(h('em', null, on === 'h' ? 'LOCAL' : 'VISITA'));
      b2.onclick = function () { if (st.home === tid) st.home = null; else if (st.away === tid) st.away = null; else if (!st.home) st.home = tid; else if (!st.away) st.away = tid; else st.away = tid; drawTeams(); drawPv(); }; tg.appendChild(b2); }); }
    // 3. fecha y hora
    var s3 = sec(B, 3, 'Fecha y hora', 'Hora de ' + ((window.MAGNA_TZ && MAGNA_TZ.label) || 'tu zona')), dw = h('div', 'fw-row'), tw = h('div', 'fw-row'), cust = h('input', 'fw-in'); cust.type = 'datetime-local'; s3.appendChild(dw); s3.appendChild(tw);
    var cl = h('label', 'fw-lb', 'U otra fecha exacta'); cl.appendChild(cust); s3.appendChild(cl);
    var days = []; for (var i = 0; i < 8; i++) { var d = new Date(); d.setDate(d.getDate() + i); days.push(d); }
    days.forEach(function (d, i) { var lbl = i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : d.toLocaleDateString('es', { weekday: 'short', day: 'numeric' }), c = chip(lbl), ds = localStr(d).slice(0, 10); c.onclick = function () { st.date = ds; pick(dw, c); cust.value = atLocal(); drawPv(); }; dw.appendChild(c); });
    ['16:00', '18:00', '19:00', '20:00', '21:00', '22:00'].forEach(function (t) { var c = chip(t, t === st.time); c.onclick = function () { st.time = t; pick(tw, c); if (st.date) cust.value = atLocal(); drawPv(); }; tw.appendChild(c); });
    cust.oninput = function () { if (!cust.value) { st.date = null; drawPv(); return; } st.date = cust.value.slice(0, 10); st.time = cust.value.slice(11, 16); pick(dw, null); pick(tw, null); drawPv(); };
    var noD = chip('Sin fecha por ahora', false, 'ghost'); noD.onclick = function () { st.date = null; cust.value = ''; pick(dw, null); drawPv(); }; dw.appendChild(noD);
    // 4. ronda
    var s4 = sec(B, 4, 'Ronda o jornada', 'Opcional'), rw = h('div', 'fw-row'), rdIn = h('input', 'fw-in'); rdIn.maxLength = 40; rdIn.placeholder = 'Escribe o elige arriba'; s4.appendChild(rw); s4.appendChild(rdIn);
    rdIn.oninput = function () { st.round = rdIn.value.trim(); pick(rw, null); drawPv(); };
    function drawRounds() { rw.innerHTML = ''; var L;
      if (st.comp.type === 'league') { var mx = 0; S().matches.forEach(function (m) { if (m.type === 'league' && m.cid === st.comp.c.id) { var x = /(\d+)/.exec(m.round || ''); if (x) mx = Math.max(mx, Number(x[1])); } }); L = [mx || 1, mx + 1, mx + 2].filter(function (v, k, a) { return v > 0 && a.indexOf(v) === k; }).map(function (n2) { return 'Jornada ' + n2; }); }
      else if (st.comp.type === 'tournament') L = ['Play-off', 'Octavos de final', 'Cuartos de final', 'Semifinal', 'Final']; else L = ['Amistoso', 'Revancha', 'Exhibición'];
      L.forEach(function (r) { var c = chip(r, r === st.round); c.onclick = function () { st.round = r; rdIn.value = r; pick(rw, c); drawPv(); }; rw.appendChild(c); }); }
    // 5. sets
    s5 = sec(B, 5, 'Sets, modos y mapas', 'Cuántos se juegan y dónde'); var sc = h('div', 'fw-row'), dice = chip('🎲 Sortear modos y mapas', false, 'hot'), sl = h('div', 'fw-sets'); s5.appendChild(sc); s5.appendChild(sl);
    [1, 3, 5, 7].forEach(function (n) { var c = chip('Al mejor de ' + n, n === 3); c.onclick = function () { while (st.sets.length < n) st.sets.push({ mode: '', map: '' }); st.sets = st.sets.slice(0, n); pick(sc, c); drawSets(); drawPv(); }; sc.appendChild(c); }); sc.appendChild(dice);
    dice.onclick = function () { st.sets.forEach(function (x) { var md = MAGNA.MODES[Math.floor(Math.random() * MAGNA.MODES.length)], mp = MAGNA.MAPS[md]; x.mode = md; x.map = mp[Math.floor(Math.random() * mp.length)]; }); drawSets(true); };
    function drawSets(anim) { sl.innerHTML = ''; st.sets.forEach(function (x, i) { var r = h('div', 'fw-set' + (anim ? ' spin' : '')); r.style.animationDelay = i * 80 + 'ms'; r.style.setProperty('--mc', MAGNA.MODE_COLOR[x.mode] || '#3a3a44'); r.appendChild(h('b', 'sn', 'SET ' + (i + 1)));
      var ms = h('select', 'fw-in'), o0 = h('option', null, 'Modo por definir'); o0.value = ''; ms.appendChild(o0); MAGNA.MODES.forEach(function (md) { var o = h('option', null, md); o.value = md; ms.appendChild(o); }); ms.value = x.mode;
      var mp = h('select', 'fw-in'); function maps() { mp.innerHTML = ''; var o1 = h('option', null, x.mode ? 'Mapa por definir' : '—'); o1.value = ''; mp.appendChild(o1); (MAGNA.MAPS[x.mode] || []).forEach(function (n2) { var o = h('option', null, n2); o.value = n2; mp.appendChild(o); }); mp.value = x.map; mp.disabled = !x.mode; }
      maps(); ms.onchange = function () { x.mode = ms.value; x.map = ''; r.style.setProperty('--mc', MAGNA.MODE_COLOR[x.mode] || '#3a3a44'); maps(); }; mp.onchange = function () { x.map = mp.value; progM(); }; r.appendChild(ms); r.appendChild(mp); sl.appendChild(r); }); progM(); }
    // pie
    var again = h('label', 'fw-ck'), ag = h('input'); ag.type = 'checkbox'; again.appendChild(ag); again.appendChild(h('i', 'fw-tg')); again.appendChild(h('span', null, 'Programar otro después'));
    var cancel = h('button', 'fw-b2', 'Cancelar'); cancel.type = 'button'; cancel.onclick = W.close; var go = h('button', 'fw-go', '🚀 Programar partido'); go.type = 'button';
    W.ft.appendChild(again); W.ft.appendChild(cancel); W.ft.appendChild(go);
    go.onclick = function () { if (!st.home || !st.away) return W.err('Elige los dos equipos.'); if (st.home === st.away) return W.err('Elige dos equipos distintos.');
      var u = st.date ? A.toUtc(atLocal()) : null; if (u === undefined) return W.err('Fecha no válida.'); var round = st.round || null, ce = A.conflict({ id: 0, type: st.comp.type, cid: st.comp.c.id }, u, st.home, st.away, round); if (ce) return W.err(ce);
      S().matches.push({ id: MAGNA.id(), type: st.comp.type, cid: st.comp.c.id, round: round, home: st.home, away: st.away, at: u, status: 'scheduled', hs: null, as: null, sets: st.sets.map(function (x) { return { mode: x.mode || null, map: x.map || null }; }) });
      burst(go); A.commit('Partido programado: ' + MAGNA.teamName(st.home) + ' vs ' + MAGNA.teamName(st.away));
      if (ag.checked) { st.home = st.away = null; drawTeams(); drawRounds(); drawPv(); B.scrollTo({ top: 0, behavior: 'smooth' }); } else setTimeout(W.close, 350); };
    drawTeams(); drawRounds(); drawSets(); drawPv();
  }

  // ================= REGISTRAR EQUIPO =================
  function team() {
    var W = shell('Registrar equipo', 'Nuevo club', '#ff6a00'), B = W.body, st = { name: '', info: '', img: null }, tmpId = -Date.now(), s3 = null;
    var pv = h('div', 'fw-tpv'), ban = h('div', 'fw-ban'), card = h('div', 'fw-tc'); pv.appendChild(ban); pv.appendChild(card); B.appendChild(pv);
    function drawPv() { ban.className = 'fw-ban'; ban.removeAttribute('style'); ban.innerHTML = ''; var fake = { id: tmpId, name: st.name || 'Tu equipo', bannerC: null }; if (window.TEAM_BANNER) TEAM_BANNER.cover(ban, fake);
      if (s3) W.prog([{ s: s1, ok: !!A.okName(st.name, 2, 30), req: 1 }, { s: s2, ok: !!st.img }, { s: s3, ok: !!st.info.trim() }], !!A.okName(st.name, 2, 30));
      card.innerHTML = ''; var cr = h('div', 'fw-cr'); if (st.img) { var im = h('img'); im.src = st.img; im.alt = ''; cr.appendChild(im); } else cr.appendChild(h('span', null, (st.name || '?').slice(0, 2).toUpperCase())); card.appendChild(cr);
      var tx = h('div'); tx.appendChild(h('b', null, st.name || 'Nombre del equipo')); tx.appendChild(h('small', null, st.info || 'Así se verá la portada de su página: el grafiti se arma solo con el nombre.')); card.appendChild(tx); }
    var s1 = sec(B, 1, 'Nombre', 'Entre 2 y 30 caracteres'), nm = h('input', 'fw-in big'); nm.maxLength = 30; nm.placeholder = 'Ej: TOXICS'; s1.appendChild(nm); var cnt = h('small', 'fw-cnt', '0/30'); s1.appendChild(cnt);
    var tmo; nm.oninput = function () { st.name = nm.value; cnt.textContent = nm.value.length + '/30'; var n = A.okName(nm.value, 2, 30); W.err(n && S().teams.some(function (t) { return A.nk(t.name) === A.nk(n); }) ? '⚠ Ya existe un equipo con ese nombre.' : ''); clearTimeout(tmo); tmo = setTimeout(drawPv, 120); };
    var s2 = sec(B, 2, 'Escudo', 'Opcional · PNG, JPG o WebP (se reduce solo)'), dz = h('label', 'fw-drop'), fi = h('input'); fi.type = 'file'; fi.accept = 'image/*'; dz.appendChild(fi); dz.appendChild(h('span', 'ic', '🛡️')); var dzt = h('b', null, 'Toca o arrastra una imagen'); dz.appendChild(dzt); dz.appendChild(h('small', null, 'Si no subes nada, se usan sus iniciales')); s2.appendChild(dz);
    function useFile(f) { if (!f) return; dzt.textContent = 'Procesando…'; A.readImg(f).then(function (img) { var e = A.imgErr(img); if (e) { dzt.textContent = 'Toca o arrastra una imagen'; return W.err(e); } st.img = img; dzt.textContent = '✔ ' + f.name; dz.classList.add('ok'); W.err(''); drawPv(); }); }
    fi.onchange = function () { useFile(fi.files[0]); }; ['dragover', 'dragenter'].forEach(function (k) { dz.addEventListener(k, function (e) { e.preventDefault(); dz.classList.add('drag'); }); }); ['dragleave', 'drop'].forEach(function (k) { dz.addEventListener(k, function (e) { e.preventDefault(); dz.classList.remove('drag'); if (k === 'drop') useFile(e.dataTransfer.files[0]); }); });
    s3 = sec(B, 3, 'Descripción', 'Opcional · máximo 300 caracteres'); var ds = h('textarea', 'fw-in'); ds.maxLength = 300; ds.rows = 3; ds.placeholder = 'Ej: Fundado en 2024, campeones de la Liga I…'; s3.appendChild(ds); ds.oninput = function () { st.info = ds.value; drawPv(); };
    var cancel = h('button', 'fw-b2', 'Cancelar'); cancel.type = 'button'; cancel.onclick = W.close; var go = h('button', 'fw-go', '🛡️ Crear equipo'); go.type = 'button'; W.ft.appendChild(cancel); W.ft.appendChild(go);
    go.onclick = function () { var n = A.okName(st.name, 2, 30); if (!n) { nm.focus(); return W.err('Nombre no válido (2 a 30 caracteres).'); } if (S().teams.some(function (t) { return A.nk(t.name) === A.nk(n); })) return W.err('Ya existe un equipo con ese nombre.');
      var t = { id: MAGNA.id(), name: n, info: (st.info || '').slice(0, 300), crest: st.img || null, budget: 0, coach: null }; S().teams.push(t); MAGNA.addNews('team_created', 'Nace un nuevo equipo: ' + n + '.'); burst(go); A.commit('Equipo creado: ' + n); setTimeout(W.close, 350); };
    drawPv(); setTimeout(function () { nm.focus(); }, 250);
  }

  // ================= REGISTRAR PERSONA =================
  var QT = ['Liga', 'Champions', 'OmegaCup', 'Mundial', 'Supernova', 'Centerium', 'MagnaCup', 'Copa del Rey', 'Copa de Oro'];
  function player() {
    var W = shell('Registrar persona', 'Nuevo fichaje', '#22d3ee'), B = W.body, st = { name: '', role: 'player', titles: [] }, s3 = null;
    var pv = h('div', 'fw-ppv'); B.appendChild(pv);
    function floor() { var f = 10; st.titles.forEach(function (t) { f += /mundial/i.test(t) ? 15 : 10; }); return Math.min(60, f); }
    function drawPv() { pv.innerHTML = ''; var md = st.titles.length ? floor() : null, tr = MAGNA.tierOf(md), av = M.tierAv(st.name || '?', md, 84, null); av.setAttribute('data-nolink', ''); pv.appendChild(av); pv.style.setProperty('--tc', tr.color || '#22d3ee');
      var tx = h('div'); tx.appendChild(h('b', null, st.name || 'Nombre en Brawl Stars')); var rl = MAGNA.ROLES.filter(function (r) { return r[0] === st.role; })[0]; tx.appendChild(h('small', null, (rl ? rl[1] : 'Jugador') + ' · Agente libre'));
      if (s3) W.prog([{ s: s1, ok: !!A.okName(st.name, 2, 24), req: 1 }, { s: s2, ok: true }, { s: s3, ok: st.titles.length > 0 }], !!A.okName(st.name, 2, 24));
      var ch = h('div', 'fw-pch'); ch.appendChild(h('span', null, '◆ Media mínima ' + (md || 10))); if (st.titles.length) ch.appendChild(h('span', null, '🏆 ' + st.titles.length + (st.titles.length === 1 ? ' título' : ' títulos'))); ch.appendChild(h('span', null, '🔑 Cuenta con código')); tx.appendChild(ch); pv.appendChild(tx); }
    var s1 = sec(B, 1, 'Nombre en Brawl Stars', 'Entre 2 y 24 caracteres'), nm = h('input', 'fw-in big'); nm.maxLength = 24; nm.placeholder = 'Ej: Riu'; s1.appendChild(nm); var cnt = h('small', 'fw-cnt', '0/24'); s1.appendChild(cnt);
    nm.oninput = function () { st.name = nm.value; cnt.textContent = nm.value.length + '/24'; var n = A.okName(nm.value, 2, 24); W.err(n && S().players.some(function (p) { return A.nk(p.name) === A.nk(n); }) ? '⚠ Ya existe un jugador con ese nombre.' : ''); drawPv(); };
    var s2 = sec(B, 2, 'Rol', 'Qué hace en Magna'), rg = h('div', 'fw-roles');
    var RD = { player: ['⚽', 'Juega en un equipo'], both: ['🧢', 'Juega y puede ser DT'], coach: ['📋', 'Solo dirige, no ocupa lugar en la plantilla'] };
    MAGNA.ROLES.forEach(function (r) { var c = h('button', 'fw-role' + (r[0] === st.role ? ' on' : '')); c.type = 'button'; var d = RD[r[0]] || ['👤', '']; c.appendChild(h('span', 'ic', d[0])); c.appendChild(h('b', null, r[1])); c.appendChild(h('small', null, d[1]));
      c.onclick = function () { st.role = r[0]; rg.querySelectorAll('.fw-role').forEach(function (x) { x.classList.remove('on'); }); c.classList.add('on'); drawPv(); }; rg.appendChild(c); }); s2.appendChild(rg);
    s3 = sec(B, 3, 'Títulos que ya ganó', 'Opcional · cada uno sube su media mínima +10 (el Mundial +15), hasta 60'); var qw = h('div', 'fw-row'), tl = h('div', 'fw-tags'), ti = h('input', 'fw-in'); ti.maxLength = 40; ti.placeholder = 'Escribe otro título y pulsa Enter (ej: Champions III)';
    s3.appendChild(qw); s3.appendChild(tl); s3.appendChild(ti);
    function addT(t) { var n = A.okName(t, 2, 40); if (!n || st.titles.length >= 20) return; st.titles.push(n); drawTags(); drawPv(); }
    QT.forEach(function (t) { var c = chip('+ ' + t); c.onclick = function () { addT(t); c.classList.add('pop'); setTimeout(function () { c.classList.remove('pop'); }, 300); }; qw.appendChild(c); });
    ti.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); addT(ti.value); ti.value = ''; } };
    function drawTags() { tl.innerHTML = ''; st.titles.forEach(function (t, i) { var g = h('button', 'fw-tag'); g.type = 'button'; g.appendChild(h('span', null, (/mundial/i.test(t) ? '🌍 ' : '🏆 ') + t)); g.appendChild(h('em', null, '✕')); g.title = 'Quitar'; g.onclick = function () { st.titles.splice(i, 1); drawTags(); drawPv(); }; tl.appendChild(g); }); if (!st.titles.length) tl.appendChild(h('small', 'fw-mut', 'Sin títulos todavía.')); }
    var note = h('p', 'fw-note', '🔑 Al registrarlo se crea su cuenta con un código de 6 dígitos para entrar, apostar y comprar con sus Bits. Te lo mostramos al terminar para que se lo envíes.'); B.appendChild(note);
    var again = h('label', 'fw-ck'), ag = h('input'); ag.type = 'checkbox'; again.appendChild(ag); again.appendChild(h('i', 'fw-tg')); again.appendChild(h('span', null, 'Registrar otro después'));
    var cancel = h('button', 'fw-b2', 'Cancelar'); cancel.type = 'button'; cancel.onclick = W.close; var go = h('button', 'fw-go', '⚡ Registrar'); go.type = 'button'; W.ft.appendChild(again); W.ft.appendChild(cancel); W.ft.appendChild(go);
    go.onclick = function () { var n = A.okName(st.name, 2, 24); if (!n) { nm.focus(); return W.err('Nombre no válido (2 a 24 caracteres).'); } if (S().players.some(function (p) { return A.nk(p.name) === A.nk(n); })) return W.err('Ya existe un jugador con ese nombre.');
      if (ti.value.trim()) { addT(ti.value); ti.value = ''; }
      var p = { id: MAGNA.id(), name: n, teamId: null, slot: null }; if (st.role !== 'player') p.kind = st.role; if (st.titles.length) p.prevTitles = st.titles.slice(0, 20); S().players.push(p); burst(go); A.commit('Jugador registrado: ' + n); MAGNA.cloud.flush();
      setTimeout(function () { A.createAcc(p); }, 500);
      if (ag.checked) { st.name = ''; st.titles = []; nm.value = ''; cnt.textContent = '0/24'; drawTags(); drawPv(); nm.focus(); } else setTimeout(W.close, 350); };
    drawTags(); drawPv(); setTimeout(function () { nm.focus(); }, 250);
  }
  return { init: function (api) { A = api; }, match: match, team: team, player: player };
})();
