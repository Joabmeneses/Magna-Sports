'use strict';
// Panel del juez: valoraciones (con rúbrica), goleadores y MVP de partidos en juego o terminados.
// Solo guarda eso (judge_save en la base de datos); el marcador y lo demás del partido no se tocan.
(function () {
  var app = document.getElementById('jzapp'), S = function () { return MAGNA.S; }, cur = null, D = null, dirty = false;
  function h(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function toast(t, bad) { var e = document.getElementById('jzt'); e.textContent = t; e.className = bad ? 'on bad' : 'on'; clearTimeout(toast.i); toast.i = setTimeout(function () { e.className = ''; }, 2800); }
  function rt(v) { return v == null ? '—' : Number(v).toFixed(1).replace('.', ','); }
  function vcol(v) { return v == null ? '#e2dbc7' : v >= 8.5 ? '#2ee59d' : v >= 7 ? '#c6ff1a' : v >= 6 ? '#ffd23f' : v >= 4.5 ? '#ff9a5a' : '#ff5d6c'; }
  // rúbrica: 5 criterios de 0 a 2 puntos = nota sobre 10
  var CR = [['🎯', 'Impacto en el resultado', 'Goles, asistencias y capturas del objetivo (gemas, balón, zona…).'],
    ['⚔️', 'Combate', 'Eliminaciones logradas frente a veces que lo eliminaron; gana sus duelos.'],
    ['🤝', 'Juego en equipo', 'Cubre, apoya, rota a tiempo y ayuda a sus compañeros.'],
    ['🗺️', 'Lectura del modo y del mapa', 'Buena posición, control de zonas y buen uso de súper y gadgets.'],
    ['🧠', 'Decisiones y errores', 'Pocos regalos al rival; acierta en los momentos clave.']];
  var SC = [['9 – 10', 'Decisivo', '#2ee59d'], ['7,5 – 8,5', 'Muy bueno', '#c6ff1a'], ['6 – 7', 'Cumplió', '#ffd23f'], ['4,5 – 5,5', 'Flojo', '#ff9a5a'], ['1 – 4', 'Muy flojo', '#ff5d6c']];

  function login() {
    app.innerHTML = ''; var b = h('div', 'jz-box jz-lg'); b.appendChild(h('h2', null, 'Entra como juez'));
    b.appendChild(h('p', 'jz-tip', 'Usa el usuario y el código que te dio la administración.'));
    var l1 = h('label', null, 'Usuario'), u = h('input'); u.autocomplete = 'username'; var l2 = h('label', null, 'Código'), c = h('input'); c.inputMode = 'numeric'; c.maxLength = 6; c.autocomplete = 'one-time-code';
    var err = h('p', 'err'), go = h('button', null, 'Entrar'); go.type = 'button';
    go.onclick = function () { go.disabled = true; err.textContent = ''; ACCOUNTS.login(u.value.trim().toLowerCase(), c.value.trim()).then(function () { go.disabled = false; start(); }, function (e) { go.disabled = false; err.textContent = e.message || 'No se pudo entrar'; }); };
    c.addEventListener('keydown', function (e) { if (e.key === 'Enter') go.click(); });
    [l1, u, l2, c, err, go].forEach(function (x) { b.appendChild(x); }); app.appendChild(b); u.focus();
  }
  function noJudge(acc) { app.innerHTML = ''; var b = h('div', 'jz-box jz-lg'); b.appendChild(h('h2', null, 'Sin permiso de juez'));
    b.appendChild(h('p', 'jz-tip', 'Entraste como ' + acc.display_name + ', pero tu cuenta no tiene el rol de juez. Pídele a la administración que te lo active.'));
    var o = h('button', null, 'Salir'); o.type = 'button'; o.onclick = function () { ACCOUNTS.logout().then(login); }; b.appendChild(o); app.appendChild(b); }

  function matches() { return S().matches.filter(function (m) { return m.status === 'live' || m.status === 'finished'; })
    .sort(function (a, b) { return (b.status === 'live') - (a.status === 'live') || String(b.at || '').localeCompare(String(a.at || '')); }).slice(0, 40); }
  function sidePlayers(m, sd) { var tid = sd === 'h' ? m.home : m.away, L = m.live || {}, ids = [];
    ((L.lineup && L.lineup[sd]) || []).forEach(function (id) { if (ids.indexOf(id) < 0) ids.push(id); });
    S().players.forEach(function (p) { if (p.teamId === tid && ids.indexOf(p.id) < 0) ids.push(p.id); });
    return ids.map(function (id) { return MAGNA.by(S().players, id); }).filter(Boolean); }
  function load(m) { var L = m.live || {}, g = { h: [], a: [] }; (L.ev || []).forEach(function (e) { if (e.k === 'goal' && (e.side === 'h' || e.side === 'a')) g[e.side].push(e.player || null); });
    g.h = g.h.slice(0, m.hs || 0); g.a = g.a.slice(0, m.as || 0);
    return { R: Object.assign({}, L.ratings || {}), G: g, mvp: L.mvp || null }; }

  function draw() {
    app.innerHTML = ''; var L = matches(); var wrap = h('div', 'jz-l');
    var lb = h('div', 'jz-box'); lb.style.setProperty('--sh', '#ff4fa3'); lb.appendChild(h('h2', null, 'Partidos')); var ms = h('div', 'jz-ms');
    if (!L.length) ms.appendChild(h('p', 'jz-tip', 'No hay partidos en juego ni terminados todavía.'));
    L.forEach(function (m) { var b = h('button', 'jz-m' + (cur === m.id ? ' on' : '')); b.type = 'button'; var t = h('span', 't'); t.appendChild(h('b', null, MAGNA.teamName(m.home) + ' ' + (m.hs || 0) + '-' + (m.as || 0) + ' ' + MAGNA.teamName(m.away))); b.appendChild(t);
      var c = MAGNA.compOf(m), sm = h('small', null, (c ? c.name : 'Amistoso') + (m.round ? ' · ' + m.round : '')); b.appendChild(sm);
      var st = h('span'); if (m.status === 'live') st.appendChild(h('span', 'jz-ok jz-lv', '● En juego')); if (m.live && m.live.judged) st.appendChild(h('span', 'jz-ok', '✓ Calificado')); b.appendChild(st);
      b.onclick = function () { if (dirty && cur !== m.id && !confirm('Tienes cambios sin guardar. ¿Cambiar de partido igual?')) return; cur = m.id; D = load(m); dirty = false; draw(); };
      ms.appendChild(b); });
    var mys = h('div', 'jz-my'); mys.textContent = '⭐ Tus estrellas: cargando…'; lb.insertBefore(mys, lb.children[1]); myStars(mys);
    lb.appendChild(ms); var out = h('button', null, 'Salir'); out.type = 'button'; out.style.cssText = 'margin-top:12px;border:2px solid #0d0d10;border-radius:8px;background:#fff;padding:8px 14px;font-weight:800;cursor:pointer'; out.onclick = function () { ACCOUNTS.logout().then(login); }; lb.appendChild(out);
    wrap.appendChild(lb);
    var right = h('div'); right.style.cssText = 'display:grid;gap:22px'; right.appendChild(rubric());
    var m = cur && MAGNA.by(S().matches, cur);
    if (!m) { var e = h('div', 'jz-box'); e.appendChild(h('h3', null, '👈 Elige un partido')); e.appendChild(h('p', 'jz-tip', 'Solo aparecen partidos en juego o terminados. Puedes volver a editar uno ya calificado.')); right.appendChild(e); }
    else editor(m, right);
    wrap.appendChild(right); app.appendChild(wrap);
  }
  function rubric() { var d = h('details', 'jz-box jz-rb'); d.open = !localStorage.getItem('jz_rb'); d.addEventListener('toggle', function () { try { if (!d.open) localStorage.setItem('jz_rb', '1'); } catch (e) {} });
    d.appendChild(h('summary', null, '📋 Rúbrica: qué calificar'));
    d.appendChild(h('p', 'jz-tip', 'Puntúa cada criterio: 0 = mal, 1 = cumplió, 2 = destacó. Todo en 1 da un 6 (partido normal) y todo en 2 da un 10. La página calcula la nota sola.'));
    var cr = h('div', 'jz-cr'); CR.forEach(function (c) { var r = h('div'); r.appendChild(h('i', null, c[0])); var t = h('span'); t.appendChild(h('b', null, c[1])); t.appendChild(h('small', null, c[2])); r.appendChild(t); r.appendChild(h('em', null, '0 – 2')); cr.appendChild(r); }); d.appendChild(cr);
    var sc = h('div', 'jz-sc'); SC.forEach(function (s) { var x = h('span'); x.style.background = s[2]; x.appendChild(h('b', null, s[0])); x.appendChild(document.createTextNode(s[1])); sc.appendChild(x); }); d.appendChild(sc);
    var tp = h('p', 'jz-tip'); tp.innerHTML = '<b>MVP:</b> el jugador con más impacto del partido, normalmente del equipo que ganó. Si hay empate, gana la nota más alta y luego quien hizo más goles.<br><b>Goles:</b> asigna cada gol del marcador a quien lo marcó. Si no lo sabes, déjalo «Sin asignar».'; d.appendChild(tp);
    return d; }

  function editor(m, root) {
    var box = h('div', 'jz-box'); box.style.setProperty('--sh', '#c6ff1a');
    var hd = h('div', 'jz-hd'); hd.appendChild(h('b', null, MAGNA.teamName(m.home))); hd.appendChild(h('em', null, (m.hs || 0) + ' - ' + (m.as || 0))); hd.appendChild(h('b', null, MAGNA.teamName(m.away))); box.appendChild(hd);
    var L = m.live || {}; box.appendChild(h('p', 'jz-sub', (m.status === 'live' ? 'En juego' : 'Terminado') + (L.judged ? ' · última calificación de ' + L.judged.by : ' · aún sin calificar')));
    // 1 · notas
    var qk = h('button', 'jz-qk', '⚡ Modo rápido: un jugador por pantalla'); qk.type = 'button'; qk.onclick = function () { quick(m); }; box.appendChild(qk);
    box.appendChild(h('h3', null, '1 · Valoraciones (1 a 10)'));
    var two = h('div', 'jz-two'); ['h', 'a'].forEach(function (sd) { var col = h('div', 'jz-tm'), tid = sd === 'h' ? m.home : m.away, t4 = h('h4'), dot = h('i'); dot.style.setProperty('--tc', MAGNA.teamColor ? MAGNA.teamColor(tid) : '#8b5cf6'); t4.appendChild(dot); t4.appendChild(document.createTextNode(MAGNA.teamName(tid))); col.appendChild(t4);
      var ps = sidePlayers(m, sd); if (!ps.length) col.appendChild(h('p', 'jz-none', 'Este equipo no tiene jugadores registrados.'));
      ps.forEach(function (p) { col.appendChild(prow(p)); }); two.appendChild(col); }); box.appendChild(two);
    // 2 · goles
    box.appendChild(h('h3', null, '2 · ¿Quién marcó cada gol?')); var gw = h('div', 'jz-two');
    ['h', 'a'].forEach(function (sd) { var n = sd === 'h' ? (m.hs || 0) : (m.as || 0), col = h('div', 'jz-g'), tid = sd === 'h' ? m.home : m.away; col.appendChild(h('b', null, MAGNA.teamName(tid) + ' · ' + n + (n === 1 ? ' gol' : ' goles')));
      if (!n) col.appendChild(h('p', 'jz-none', 'Sin goles.'));
      var ps = sidePlayers(m, sd); for (var i = 0; i < n; i++) (function (i) { var l = h('label'); l.appendChild(h('span', null, 'Gol ' + (i + 1))); var s = h('select'); var o0 = h('option', null, 'Sin asignar'); o0.value = ''; s.appendChild(o0);
        ps.forEach(function (p) { var o = h('option', null, p.name); o.value = p.id; s.appendChild(o); }); s.value = D.G[sd][i] != null ? String(D.G[sd][i]) : '';
        s.onchange = function () { while (D.G[sd].length <= i) D.G[sd].push(null); D.G[sd][i] = s.value ? Number(s.value) : null; dirty = true; }; l.appendChild(s); col.appendChild(l); })(i);
      gw.appendChild(col); }); box.appendChild(gw);
    // 3 · mvp
    box.appendChild(h('h3', null, '3 · MVP del partido')); var mv = h('div', 'jz-mvp'), all = sidePlayers(m, 'h').concat(sidePlayers(m, 'a'));
    var none = h('button', D.mvp == null ? 'on' : '', 'Sin MVP'); none.type = 'button'; none.onclick = function () { D.mvp = null; dirty = true; draw(); }; mv.appendChild(none);
    all.forEach(function (p) { var b = h('button', D.mvp === p.id ? 'on' : '', p.name + (D.R[p.id] != null ? ' · ' + rt(D.R[p.id]) : '')); b.type = 'button'; b.onclick = function () { D.mvp = p.id; dirty = true; draw(); }; mv.appendChild(b); });
    var best = all.slice().sort(function (a, b) { return (D.R[b.id] || 0) - (D.R[a.id] || 0); })[0];
    if (best && D.R[best.id] != null && D.mvp !== best.id) { var sg = h('p', 'jz-tip'); sg.innerHTML = '💡 Sugerencia por nota: <b>' + best.name + '</b> (' + rt(D.R[best.id]) + ').'; box.appendChild(mv); box.appendChild(sg); } else box.appendChild(mv);
    // guardar
    var sv = h('div', 'jz-save'), info = h('span', null, dirty ? 'Tienes cambios sin guardar' : 'Todo guardado'); sv.appendChild(info); var go = h('button', null, '💾 Guardar planilla'); go.type = 'button';
    go.onclick = function () { go.disabled = true; go.textContent = 'Guardando…'; var R = {}; Object.keys(D.R).forEach(function (k) { if (D.R[k] != null) R[k] = D.R[k]; });
      var G = { h: D.G.h.slice(0, m.hs || 0), a: D.G.a.slice(0, m.as || 0) }; while (G.h.length && G.h[G.h.length - 1] == null) G.h.pop(); while (G.a.length && G.a[G.a.length - 1] == null) G.a.pop();
      ACCOUNTS.judgeSave(m.id, R, G, D.mvp).then(function () { dirty = false; toast('✓ Planilla guardada: ya se ve en la web'); if (ACCOUNTS.pullState) ACCOUNTS.pullState().then(function () { D = load(MAGNA.by(S().matches, m.id) || m); draw(); }, draw); else draw(); },
        function (e) { go.disabled = false; go.textContent = '💾 Guardar planilla'; toast(e.message || 'No se pudo guardar', true); }); };
    sv.appendChild(go); box.appendChild(sv); root.appendChild(box);
  }
  function prow(p) { var r = h('div', 'jz-p'), nm = h('div', 'nm', p.name); nm.appendChild(h('small', null, MAGNA.roleName ? MAGNA.roleName(p) : '')); r.appendChild(nm);
    var st = h('div', 'jz-st'), v = D.R[p.id], val = h('span', 'jz-v' + (v == null ? ' na' : ''), v == null ? 'Sin nota' : rt(v)); val.style.setProperty('--vc', vcol(v));
    function set(n) { D.R[p.id] = n; dirty = true; val.textContent = n == null ? 'Sin nota' : rt(n); val.className = 'jz-v' + (n == null ? ' na' : ''); val.style.setProperty('--vc', vcol(n)); upd(); }
    var mi = h('button', null, '−'), pl = h('button', null, '+'), rb = h('button', 'jz-rbb', '📋'); [mi, pl, rb].forEach(function (b) { b.type = 'button'; });
    mi.setAttribute('aria-label', 'Bajar nota de ' + p.name); pl.setAttribute('aria-label', 'Subir nota de ' + p.name); rb.title = 'Calificar con la rúbrica';
    mi.onclick = function () { var c = D.R[p.id]; set(c == null ? 6 : Math.max(1, c - .5)); }; pl.onclick = function () { var c = D.R[p.id]; set(c == null ? 6 : Math.min(10, c + .5)); };
    st.appendChild(mi); st.appendChild(val); st.appendChild(pl); st.appendChild(rb); r.appendChild(st);
    var q = null; rb.onclick = function () { if (q) { q.remove(); q = null; return; } q = h('div', 'jz-q'); var pts = [1.2, 1.2, 1.2, 1.2, 1.2];
      CR.forEach(function (c, i) { var row = h('div'); row.appendChild(h('span', null, c[0] + ' ' + c[1])); var sg = h('span', 'seg'); [0, .5, 1, 1.5, 2].forEach(function (x) { var b = h('button', x === 1 ? 'on' : '', String(x).replace('.', ',')); b.type = 'button'; b.onclick = function () { pts[i] = x; [].forEach.call(sg.children, function (y) { y.classList.toggle('on', y === b); }); tot(); }; sg.appendChild(b); }); pts[i] = 1; row.appendChild(sg); q.appendChild(row); });
      var f = h('p'), tt = h('span'), ap = h('button', null, 'Usar esta nota'); ap.type = 'button'; f.appendChild(tt); f.appendChild(ap); q.appendChild(f);
      function sum() { return nota(pts); } function tot() { tt.textContent = 'Nota: ' + rt(sum()); } tot();
      ap.onclick = function () { set(sum()); q.remove(); q = null; }; r.appendChild(q); };
    return r; }
  // nota = 2 + 0,8 × suma de los 5 criterios (0–2): todo «normal» (1) da 6 y todo «top» (2) da 10
  function nota(pts) { var s2 = pts.reduce(function (a, b) { return a + b; }, 0); return Math.min(10, Math.max(1, Math.round((2 + s2 * .8) * 2) / 2)); }
  var ME = null;
  function myStars(el) { if (!ACCOUNTS.judgeStars) { el.remove(); return; } ACCOUNTS.judgeStars(null).then(function (L) { var r = ME && L.filter(function (x) { return x.judge_id === ME.id; })[0];
      if (!r || !Number(r.votes)) { el.textContent = '⭐ Aún no tienes votos de la gente. ¡Califica bien y llegarán!'; return; }
      var a = Number(r.avg_stars), f = ''; for (var i = 1; i <= 5; i++) f += i <= Math.round(a) ? '★' : '☆';
      el.innerHTML = ''; el.appendChild(h('b', null, f + ' ' + String(a.toFixed(1)).replace('.', ','))); el.appendChild(h('small', null, r.votes + (r.votes == 1 ? ' voto' : ' votos') + ' en ' + r.matches + (r.matches == 1 ? ' partido' : ' partidos'))); }, function () { el.remove(); }); }
  // ---- modo rápido: un jugador por pantalla, la rúbrica en botones grandes, se desliza ----
  function quick(m) {
    var ps = sidePlayers(m, 'h').map(function (p) { return [p, 'h']; }).concat(sidePlayers(m, 'a').map(function (p) { return [p, 'a']; })); if (!ps.length) return toast('No hay jugadores para calificar', true);
    var i = Math.max(0, ps.findIndex(function (x) { return D.R[x[0].id] == null; })), ov = h('div', 'jzq-ov'), card = h('div', 'jzq'); ov.appendChild(card); document.body.appendChild(ov); document.body.style.overflow = 'hidden';
    var P = {}; function close() { ov.remove(); document.body.style.overflow = ''; draw(); }
    function paint(dir) { var x = ps[i], p = x[0], tid = x[1] === 'h' ? m.home : m.away, pts = P[p.id] = P[p.id] || [1, 1, 1, 1, 1];
      card.innerHTML = ''; card.style.setProperty('--tc', MAGNA.teamColor ? MAGNA.teamColor(tid) : '#8b5cf6'); if (dir) { card.classList.remove('l', 'r'); void card.offsetWidth; card.classList.add(dir); }
      var top = h('div', 'jzq-t'); top.appendChild(h('span', null, (i + 1) + ' / ' + ps.length)); var x2 = h('button', 'jzq-x', '✕'); x2.type = 'button'; x2.setAttribute('aria-label', 'Cerrar'); x2.onclick = close; top.appendChild(x2); card.appendChild(top);
      var bar = h('div', 'jzq-bar'); ps.forEach(function (y, k) { var d = h('i'); if (D.R[y[0].id] != null) d.className = 'ok'; if (k === i) d.className += ' on'; bar.appendChild(d); }); card.appendChild(bar);
      card.appendChild(h('small', 'jzq-tm', MAGNA.teamName(tid))); card.appendChild(h('h2', null, p.name));
      var nv = h('div', 'jzq-n'); card.appendChild(nv);
      CR.forEach(function (c, k) { var r = h('div', 'jzq-c'); r.appendChild(h('b', null, c[0] + ' ' + c[1])); r.appendChild(h('small', null, c[2])); var sg = h('div', 'jzq-sg');
        [[0, 'Mal'], [1, 'Normal'], [2, 'Top']].forEach(function (o) { var b = h('button', pts[k] === o[0] ? 'on' : '', o[1]); b.type = 'button'; b.onclick = function () { pts[k] = o[0]; [].forEach.call(sg.children, function (z) { z.classList.toggle('on', z === b); }); tot(); try { navigator.vibrate && navigator.vibrate(8); } catch (e) {} }; sg.appendChild(b); });
        r.appendChild(sg); card.appendChild(r); });
      function val() { return nota(pts); }
      function tot() { var v = val(); nv.innerHTML = ''; var b = h('b', null, rt(v)); b.style.background = vcol(v); nv.appendChild(b); nv.appendChild(h('span', null, v >= 9 ? 'Decisivo' : v >= 7.5 ? 'Muy bueno' : v >= 6 ? 'Cumplió' : v >= 4.5 ? 'Flojo' : 'Muy flojo')); }
      tot(); if (D.R[p.id] != null) card.appendChild(h('p', 'jzq-prev', 'Nota guardada antes: ' + rt(D.R[p.id])));
      var nav = h('div', 'jzq-nav'), pv = h('button', null, '← Anterior'), sk = h('button', 'sk', 'Saltar'), ok = h('button', 'ok', i === ps.length - 1 ? '✓ Poner nota y terminar' : '✓ Poner nota →'); [pv, sk, ok].forEach(function (b) { b.type = 'button'; nav.appendChild(b); });
      pv.disabled = i === 0; pv.onclick = function () { go(-1); }; sk.onclick = function () { go(1); };
      ok.onclick = function () { D.R[p.id] = val(); dirty = true; if (i === ps.length - 1) { close(); toast('Notas puestas. Revisa goles y MVP, y guarda la planilla.'); } else go(1); };
      card.appendChild(nav); }
    function go(d) { var n = i + d; if (n < 0) return; if (n >= ps.length) { close(); return; } i = n; paint(d > 0 ? 'r' : 'l'); }
    var x0 = null; card.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    card.addEventListener('touchend', function (e) { if (x0 == null) return; var d = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(d) > 70) go(d < 0 ? 1 : -1); }, { passive: true });
    ov.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); }); paint(); }
  function upd() { var i = app.querySelector('.jz-save span'); if (i) i.textContent = dirty ? 'Tienes cambios sin guardar' : 'Todo guardado'; }
  addEventListener('beforeunload', function (e) { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
  addEventListener('magna:update', function () { if (!dirty && cur && MAGNA.by(S().matches, cur)) { D = load(MAGNA.by(S().matches, cur)); } if (!dirty && app.querySelector('.jz-l')) draw(); });

  function start() { app.innerHTML = '<p class="jz-tip" style="color:#fff">Cargando…</p>';
    ACCOUNTS.me().then(function (acc) { if (!acc) return login(); ME = acc; return ACCOUNTS.isJudge().then(function (ok) { if (!ok) return noJudge(acc); var q = Number((/[?&]m=(\d+)/.exec(location.search) || [])[1]); if (q && MAGNA.by(S().matches, q)) { cur = q; D = load(MAGNA.by(S().matches, q)); } draw(); }); }, login); }
  if (!window.ACCOUNTS) { app.textContent = 'No se pudo cargar.'; return; }
  start();
})();
