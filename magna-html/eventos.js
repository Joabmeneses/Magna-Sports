'use strict';
// Eventos de Magna Arena: Balón de Oro, eventos que crea la administración (S.events) y partidos grandes automáticos.
// Cuenta regresiva, "¡Voy!" (event_rsvp) y añadir al calendario (.ics).
(function () {
  var h = M.h, root = document.getElementById('ev'), me = null, counts = {}, mine = {}, flt = 'all', busy = {}, tick = null;
  var K = { torneo: ['🏆', 'Torneo', '#ffc400'], partido: ['⚔️', 'Partido grande', '#ff2d95'], amistoso: ['🤝', 'Amistosos', '#2ee59d'], especial: ['🎉', 'Especial', '#ff5a36'], stream: ['📺', 'Transmisión', '#22d3ee'], premio: ['🥇', 'Premiación', '#ffd23f'], comunidad: ['🗣️', 'Comunidad', '#a78bfa'] };
  var F = [['all', '✨ Todos'], ['torneo', '🏆 Torneos'], ['partidos', '⚔️ Partidos'], ['comunidad', '🎉 Comunidad'], ['premio', '🥇 Premios']];
  var MON = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'], DAY = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  function S() { return MAGNA.S; }
  function sb() { return window.MAGNA_SB ? window.MAGNA_SB() : Promise.reject(new Error('Sin conexión')); }
  function tms(at) { return at ? new Date(String(at).replace(' ', 'T') + 'Z').getTime() : 0; }
  function kind(e) { return K[e.kind] || K.especial; }
  function toast(t, bad) { var x = h('div', null, t); x.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:95;background:#131833;border:1px solid ' + (bad ? '#ff5a6a' : '#2ee59d') + ';color:#fff;padding:12px 18px;border-radius:14px;font:600 14px Archivo,sans-serif;max-width:calc(100vw - 24px)'; document.body.appendChild(x); setTimeout(function () { x.remove(); }, 3200); }
  function span(ms) { var s = Math.max(0, Math.floor(ms / 1000)); return { d: Math.floor(s / 86400), h: Math.floor(s % 86400 / 3600), m: Math.floor(s % 3600 / 60), s: s % 60 }; }
  function rel(ms) { var t = span(ms); return t.d ? 'en ' + t.d + ' d ' + t.h + ' h' : t.h ? 'en ' + t.h + ' h ' + String(t.m).padStart(2, '0') + ' min' : 'en ' + t.m + ' min ' + String(t.s).padStart(2, '0') + ' s'; }
  function when(e) { var a = new Date(tms(e.at)), s = DAY[a.getDay()] + ' ' + a.getDate() + ' ' + MON[a.getMonth()] + ' · ' + String(a.getHours()).padStart(2, '0') + ':' + String(a.getMinutes()).padStart(2, '0'); if (e.end) { var b = new Date(tms(e.end)); s += ' a ' + (b.toDateString() === a.toDateString() ? '' : b.getDate() + ' ' + MON[b.getMonth()] + ' ') + String(b.getHours()).padStart(2, '0') + ':' + String(b.getMinutes()).padStart(2, '0'); } return s + (e.place ? ' · ' + e.place : ''); }
  function endOf(e) { return e.end ? tms(e.end) : tms(e.at) + 2 * 36e5; }
  function isLive(e, now) { return e.live || (tms(e.at) <= now && now <= endOf(e)); }

  // ---------- datos ----------
  function all() { var now = Date.now(), out = (S().events || []).filter(function (e) { return e && e.title && e.at; }).map(function (e) { return Object.assign({}, e); });
    S().matches.forEach(function (m) { var live = m.status === 'live', t = tms(m.at); if (!(live || m.status === 'scheduled') || !m.at && !live) return; var big = /final|semi/i.test(m.round || ''); if (!live && !big) return; if (!live && (t > now + 21 * 864e5 || t < now - 3 * 36e5)) return;
      var c = MAGNA.compOf(m); out.push({ id: 'm' + m.id, auto: true, kind: 'partido', live: live, at: m.at || new Date(now).toISOString().slice(0, 19).replace('T', ' '), title: (m.round ? m.round + ' · ' : '') + (c ? c.name : 'Partido'), home: m.home, away: m.away, link: 'index.html?m=' + m.id, linkLabel: live ? '🔴 Verlo en vivo' : '⚔️ Ver partido' }); });
    return out.sort(function (a, b) { return tms(a.at) - tms(b.at); }); }
  function pass(e) { if (flt === 'all') return true; if (flt === 'partidos') return e.kind === 'partido' || e.kind === 'amistoso'; if (flt === 'comunidad') return ['especial', 'stream', 'comunidad'].indexOf(e.kind) >= 0; return e.kind === flt; }

  // ---------- render ----------
  function render() { clearInterval(tick); root.innerHTML = ''; var now = Date.now(), A = all(), up = A.filter(function (e) { return endOf(e) >= now; }), past = A.filter(function (e) { return endOf(e) < now && !e.auto; }).reverse();
    var hd = h('section', 'ev-h'), tx = h('div'); tx.appendChild(h('div', 'ey', 'Comunidad · Magna Sports')); tx.appendChild(h('h1', null, 'Eventos')); tx.appendChild(h('p', null, 'Torneos, finales, premiaciones y planes de la comunidad. Apúntate, pon la alarma y que no se te pase ninguno.')); hd.appendChild(tx); hd.appendChild(h('div', 'ev-ic', '🎪')); root.appendChild(hd);
    var tk = [], nx = up.filter(function (e) { return !isLive(e, now); })[0], lv = up.filter(function (e) { return isLive(e, now); });
    if (lv.length) tk.push(['En vivo', lv.map(function (e) { return e.title; }).join(' · ')]); if (nx) tk.push(['Próximo', nx.title + ' · ' + rel(tms(nx.at) - now)]);
    var V = S().ballonVote, BL = MAGNA.ballonList(); if (V && V.id && V.open) tk.push(['Balón de Oro', 'Votación abierta · Edición ' + V.ed]); else if (BL[0]) tk.push(['Último Balón de Oro', (MAGNA.ballonWho(BL[0], 'winner') || '—') + ' · ' + BL[0].ed]);
    var wk = up.filter(function (e) { return tms(e.at) < now + 7 * 864e5; }).length; tk.push(['Esta semana', wk + (wk === 1 ? ' evento' : ' eventos')]);
    if (window.ARENA) root.appendChild(ARENA.ticker(tk, 'EVENTOS'));
    featured(lv[0] || nx, now); ballon(); agenda(up, now); history(past);
    tick = setInterval(function () { var t = Date.now(); [].forEach.call(document.querySelectorAll('[data-cd]'), function (el) { var to = Number(el.dataset.cd); if (to - t <= 0) { clearInterval(tick); return setTimeout(render, 400); } if (el.dataset.big) { var x = span(to - t); ['d', 'h', 'm', 's'].forEach(function (k) { var b = el.querySelector('[data-k="' + k + '"]'); if (b) b.textContent = String(x[k]).padStart(k === 'd' ? 1 : 2, '0'); }); } else el.textContent = rel(to - t); }); }, 1000);
  }
  function sec(title, sub) { var s = h('section', 'ev-sec'); s.appendChild(h('h2', 'x ar-h2', title)); if (sub) s.appendChild(h('p', null, sub)); root.appendChild(s); return s; }
  function featured(e, now) { if (!e) return; var s = sec(isLive(e, now) ? '¡Está pasando!' : 'El próximo'), k = kind(e), c = h('div', 'ev-next ar-sheen'); c.dataset.tilt = '4'; c.style.setProperty('--ec', k[2]);
    var l = h('div'); l.appendChild(h('span', 'k', k[0] + ' ' + k[1])); l.appendChild(h('h3', null, e.title)); if (e.home != null) l.appendChild(teams(e)); if (e.desc) l.appendChild(h('p', 'ds', e.desc)); l.appendChild(h('div', 'wh', '📅 ' + when(e))); l.appendChild(btns(e, true)); c.appendChild(l);
    var r = h('div'); if (isLive(e, now)) r.appendChild(h('span', 'ev-live', 'EN VIVO AHORA')); else { var cd = h('div', 'ev-cd'), x = span(tms(e.at) - now); cd.dataset.cd = tms(e.at); cd.dataset.big = '1'; [['d', 'Días'], ['h', 'Horas'], ['m', 'Min'], ['s', 'Seg']].forEach(function (p) { var d = h('div'), b = h('b', null, String(x[p[0]]).padStart(p[0] === 'd' ? 1 : 2, '0')); b.dataset.k = p[0]; d.appendChild(b); d.appendChild(h('small', null, p[1])); cd.appendChild(d); }); r.appendChild(cd); }
    c.appendChild(r); s.appendChild(c); }
  function ballon() { var s = sec('Balón de Oro', 'El premio al mejor jugador de cada edición, elegido por la comunidad.'), V = S().ballonVote, L = MAGNA.ballonList(), PS = MAGNA.playerStats(), c = h('div', 'ev-bo ar-sheen'); c.dataset.tilt = '4';
    var bimg = M.trophyImg('Balón de Oro', null, 150, null); if (bimg.tagName === 'IMG') { bimg.classList.add('ev-tro'); c.appendChild(bimg); } else c.appendChild(h('div', 'ev-ball')); var tx = h('div'), open = V && V.id && V.open && !(V.closes && tms(V.closes) < Date.now());
    if (open) { tx.appendChild(h('div', 'k', '🗳️ Votación abierta')); tx.appendChild(h('h3', null, 'Edición ' + V.ed)); tx.appendChild(h('p', null, (V.nominees || []).length + ' nominados. Un voto por cuenta y puedes cambiarlo hasta que cierre.'));
      var nm = h('div', 'ev-noms'); (V.nominees || []).slice(0, 8).forEach(function (pid) { var p = MAGNA.by(S().players, pid); if (p) nm.appendChild(M.tierAv(p.name, (PS[pid] || {}).media, 42, pid)); }); tx.appendChild(nm);
      if (V.closes) { var cm = h('div', 'cdm'); cm.appendChild(document.createTextNode('⏳ Cierra ')); var cb = h('b', null, rel(tms(V.closes) - Date.now())); cb.dataset.cd = tms(V.closes); cm.appendChild(cb); tx.appendChild(cm); }
      var bb = h('div', 'ev-btns'), a = h('a', 'ev-b go', '🗳️ Votar ahora'); a.href = 'balon.html'; bb.appendChild(a); tx.appendChild(bb); }
    else { tx.appendChild(h('div', 'k', V && V.id ? '⏳ Votación cerrada' : L.length ? '🏆 Palmarés' : '✨ Muy pronto')); tx.appendChild(h('h3', null, V && V.id ? 'Edición ' + V.ed : L.length ? L.length + (L.length === 1 ? ' edición' : ' ediciones') : 'Primera edición'));
      tx.appendChild(h('p', null, V && V.id ? 'La votación terminó: la administración proclamará al ganador muy pronto.' : L.length ? 'Mira a todos los ganadores y quién tiene más Balones de Oro.' : 'Cuando la administración abra la votación, la verás aquí.'));
      var bb2 = h('div', 'ev-btns'), a2 = h('a', 'ev-b go', '🏆 Ver palmarés'); a2.href = 'balon.html'; bb2.appendChild(a2); tx.appendChild(bb2); }
    c.appendChild(tx);
    if (L[0]) { var w = h('div', 'win'), wn = MAGNA.ballonWho(L[0], 'winner') || '—'; w.appendChild(M.tierAv(wn, L[0].winner != null ? (PS[L[0].winner] || {}).media : 60, 84, L[0].winner != null ? L[0].winner : undefined)); var d = h('div'), nb = h('b'); nb.appendChild(L[0].winner != null && MAGNA.by(S().players, L[0].winner) ? M.pn(wn, L[0].winner) : document.createTextNode(wn)); d.appendChild(nb); d.appendChild(h('small', null, 'Último ganador · Edición ' + L[0].ed)); w.appendChild(d); c.appendChild(w); }
    s.appendChild(c); }
  function teams(e) { var t = h('div', 'ev-teams'); t.appendChild(M.crest(e.home, MAGNA.teamName(e.home), 26)); t.appendChild(document.createTextNode(MAGNA.teamName(e.home) + ' vs ' + MAGNA.teamName(e.away))); t.appendChild(M.crest(e.away, MAGNA.teamName(e.away), 26)); return t; }
  function btns(e, big) { var b = h('div', 'ev-btns'), now = Date.now();
    if (!e.auto) { var on = !!mine[e.id], n = counts[e.id] || 0, r = h('button', 'ev-b ' + (on ? 'on' : 'go')); r.type = 'button'; r.disabled = !!busy[e.id] || endOf(e) < now; r.appendChild(document.createTextNode(on ? '✓ Vas' : '🙋 ¡Voy!')); r.appendChild(h('span', 'n', String(n))); r.title = n + (n === 1 ? ' persona va' : ' personas van'); r.onclick = function () { rsvp(e, !on); }; b.appendChild(r); }
    if (e.link) { var a = h('a', 'ev-b', (e.linkLabel || 'Más información') + ' →'); a.href = e.link; if (/^https?:/i.test(e.link)) { a.target = '_blank'; a.rel = 'noopener'; } b.appendChild(a); }
    if (tms(e.at) > now) { var c = h('button', 'ev-b', '📅 Añadir a mi calendario'); c.type = 'button'; c.onclick = function () { ics(e); }; if (!big) c.textContent = '📅'; if (!big) c.title = 'Añadir a mi calendario'; b.appendChild(c); }
    return b; }
  function card(e, now, isPast) { var k = kind(e), c = h('article', 'ev-c' + (isPast ? ' past' : '')), a = new Date(tms(e.at)); c.style.setProperty('--ec', k[2]);
    var dt = h('div', 'ev-dt'); dt.appendChild(h('small', null, DAY[a.getDay()])); dt.appendChild(h('b', null, String(a.getDate()))); dt.appendChild(h('i', null, MON[a.getMonth()])); c.appendChild(dt);
    var t = h('div', 't'), tg = h('div', 'tg'); tg.appendChild(h('span', 'ev-chip', k[0] + ' ' + k[1])); if (isLive(e, now) && !isPast) tg.appendChild(h('span', 'ev-live', 'EN VIVO')); t.appendChild(tg); t.appendChild(h('h4', null, e.title)); if (e.home != null) t.appendChild(teams(e)); if (e.desc) t.appendChild(h('p', null, e.desc)); t.appendChild(h('div', 'wh', when(e))); c.appendChild(t);
    var r = h('div', 'r'); if (!isPast && !isLive(e, now)) { var cd = h('span', 'cd2', rel(tms(e.at) - now)); cd.dataset.cd = tms(e.at); r.appendChild(cd); } if (!isPast) r.appendChild(btns(e, false)); else if (counts[e.id]) r.appendChild(h('span', 'cd2', '🙋 ' + counts[e.id] + ' fueron'));
    c.appendChild(r); return c; }
  function agenda(up, now) { var s = sec('Agenda', 'Todo lo que viene, en orden.'), f = h('div', 'ev-f');
    F.forEach(function (x) { var b = h('button', flt === x[0] ? 'on' : ''); b.type = 'button'; b.appendChild(h('span', null, x[1])); b.onclick = function () { flt = x[0]; render(); var a = document.getElementById('ev-ag'); if (a) a.scrollIntoView({ block: 'start', behavior: 'smooth' }); }; f.appendChild(b); }); s.id = 'ev-ag'; s.appendChild(f);
    var U = up.filter(pass); if (!U.length) { s.appendChild(h('div', 'ev-emp', flt === 'all' ? '🎪 No hay eventos programados por ahora. ¡Vuelve pronto!' : 'No hay eventos de este tipo por ahora.')); return; }
    var today = new Date(now); today.setHours(0, 0, 0, 0); var G = [['🔴 En vivo', []], ['Hoy', []], ['Esta semana', []], ['Más adelante', []]];
    U.forEach(function (e) { var t = tms(e.at); if (isLive(e, now)) G[0][1].push(e); else if (t < today.getTime() + 864e5) G[1][1].push(e); else if (t < today.getTime() + 7 * 864e5) G[2][1].push(e); else G[3][1].push(e); });
    var i = 0; G.forEach(function (g) { if (!g[1].length) return; s.appendChild(h('div', 'ev-g', g[0])); var L = h('div', 'ev-list'); g[1].forEach(function (e) { var c = card(e, now); c.style.animationDelay = Math.min(i++, 12) * 40 + 'ms'; L.appendChild(c); }); s.appendChild(L); }); }
  function history(past) { if (!past.length) return; var s = sec('Ya pasaron'), L = h('div', 'ev-list'), now = Date.now(); past.slice(0, 6).forEach(function (e) { L.appendChild(card(e, now, true)); }); s.appendChild(L); }

  // ---------- acciones ----------
  function rsvp(e, on) { if (!me) { location.href = 'cuenta.html'; return; } busy[e.id] = 1; render();
    sb().then(function (c) { return c.rpc('event_rsvp_set', { p_event: e.id, p_on: on }); }).then(function (r) { delete busy[e.id]; if (r && r.error) throw r.error; counts[e.id] = Number(r.data) || 0; if (on) mine[e.id] = 1; else delete mine[e.id]; toast(on ? '🙌 ¡Te apuntaste a ' + e.title + '!' : 'Ya no vas a ' + e.title); render(); },
      function (er) { delete busy[e.id]; toast(er.message || 'No se pudo', true); render(); }); }
  function ics(e) { function f(ms) { return new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z'); } function esc(s) { return String(s || '').replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n'); }
    var body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Magna Arena//Eventos//ES', 'BEGIN:VEVENT', 'UID:' + e.id + '@magna-arena', 'DTSTAMP:' + f(Date.now()), 'DTSTART:' + f(tms(e.at)), 'DTEND:' + f(endOf(e)), 'SUMMARY:' + esc(e.title), 'DESCRIPTION:' + esc((e.desc || '') + (e.home != null ? '\n' + MAGNA.teamName(e.home) + ' vs ' + MAGNA.teamName(e.away) : '')), e.place ? 'LOCATION:' + esc(e.place) : null, 'BEGIN:VALARM', 'TRIGGER:-PT30M', 'ACTION:DISPLAY', 'DESCRIPTION:' + esc(e.title), 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].filter(Boolean).join('\r\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([body], { type: 'text/calendar' })); a.download = 'magna-' + String(e.title).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) + '.ics'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000); toast('📅 Abre el archivo para guardarlo en tu calendario'); }
  function load() { sb().then(function (c) { return c.rpc('event_rsvp_counts').then(function (r) { if (r && !r.error) { counts = {}; (r.data || []).forEach(function (x) { counts[x.event_id] = Number(x.n); }); } return c; }); }).then(function (c) {
      if (!window.ACCOUNTS) return render(); return ACCOUNTS.me().then(function (a) { me = a; if (!a) return render(); return c.rpc('my_rsvps').then(function (r) { mine = {}; ((r && r.data) || []).forEach(function (x) { mine[x.event_id] = 1; }); render(); }); }); }).catch(function () { render(); }); }
  window.addEventListener('magna:update', function () { if (!Object.keys(busy).length) render(); });
  function boot() { render(); load(); }
  if (document.readyState === 'complete') boot(); else addEventListener('load', boot);
})();
