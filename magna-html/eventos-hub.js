'use strict';
// Eventos: Balón de Oro, Predicción, Sorteo, Planes y Fichajes en una sola página (banners con datos en vivo)
(function () {
  var H = HUB, el = H.el, S = H.S, RAF = null;
  var COL = { bal: '#ffc400', pred: '#c6ff1a', raf: '#ff4fa3', plan: '#ffb400', mkt: '#8b5cf6' };
  function bg(c) { return 'radial-gradient(circle at 25% 40%,' + c + '88,transparent 65%),radial-gradient(circle at 80% 10%,' + c + '44,transparent 60%)'; }
  function now() { return Date.now(); }
  function plans() { return (S().events || []).filter(function (e) { return e && e.title && e.at && (H.when(e.end || e.at) + 2 * 36e5) > now(); }).sort(function (a, b) { return H.when(a.at) - H.when(b.at); }); }
  function moves() { return (S().news || []).filter(function (n) { return n.kind === 'transfer' || n.kind === 'market'; }).sort(function (a, b) { return String(b.at).localeCompare(String(a.at)); }); }
  function itemName(id) { var it = (S().shop || []).filter(function (x) { return x.id === id; })[0]; return it ? it.name : 'Premio sorpresa'; }
  function predCups() { return (S().tournaments || []).filter(function (c) { return c.status === 'active' && c.state && c.state.phase !== 'done'; }); }
  function render() {
    var BL = MAGNA.ballonList ? MAGNA.ballonList() : [], V = S().ballonVote, PL = plans(), MV = moves(), MS = MAGNA.marketState ? MAGNA.marketState() : { open: false }, PC = predCups();
    var rOpen = (RAF || []).filter(function (r) { return r.status === 'open'; }).sort(function (a, b) { return H.when(a.closes_at) - H.when(b.closes_at); }), rLast = (RAF || []).filter(function (r) { return r.winner_name; }).sort(function (a, b) { return String(b.drawn_at || '').localeCompare(String(a.drawn_at || '')); })[0];
    var vOpen = !!(V && V.open);
    H.stats([[PL.length, 'Planes', '#ffb400'], [rOpen.length, 'Sorteos abiertos', '#ff4fa3'], [PC.length, 'Para predecir', '#c6ff1a'], [MS.open ? 1 : 0, 'Mercado', '#b18cff', MS.open ? 'Abierto' : 'Cerrado']]);
    var lp = H.$('#lvp'); lp.hidden = !(vOpen || MS.open); lp.textContent = vOpen ? 'Votación abierta' : 'Mercado abierto';
    // ahora mismo
    var sl = [];
    if (vOpen) sl.push({ href: 'balon.html', color: COL.bal, bg: bg(COL.bal), chips: [['🗳️ Votación abierta'], ['Balón de Oro ' + (V.ed || ''), 'w']], body: H.quote('¿Quién se lleva el Balón de Oro?', (V.nominees || []).length + ' nominados'), foot: V.closes ? 'Cierra' : '', at: V.closes || null, pre: '⏱ ', cta: 'Votar →' });
    if (rOpen[0]) { var r0 = rOpen[0]; sl.push({ href: 'sorteo.html', color: COL.raf, bg: bg(COL.raf), chips: [['🎁 Sorteo abierto'], [H.fmt(r0.entrants) + ' inscritos', 'w']], body: H.quote(r0.title || 'Sorteo', 'Premio: ' + itemName(r0.prize_item)), foot: r0.cost ? H.fmt(r0.cost) + ' Bits para entrar' : 'Entrada gratis', at: r0.closes_at, pre: '⏱ ' }); }
    if (PL[0]) { var p0 = PL[0]; sl.push({ href: 'planes.html', color: COL.plan, bg: bg(COL.plan), chips: [['📅 Próximo plan'], [p0.place || 'Magna', 'w']], body: H.quote(p0.title, p0.desc || ''), foot: 'Empieza', at: p0.at, pre: '⏱ ' }); }
    sl.push({ href: 'mercado.html', color: COL.mkt, bg: bg(COL.mkt), chips: [[MS.open ? '🔓 Mercado abierto' : '🔒 Mercado cerrado']], body: H.quote(MV[0] ? MV[0].text : 'Sin movimientos recientes', MV[0] ? H.ago(MV[0].at) : ''), foot: MS.open ? 'Es momento de fichar' : 'Atento a la próxima ventana', cta: 'Ver fichajes →' });
    if (BL[0]) { var b0 = BL[0], wn = MAGNA.ballonWho(b0, 'winner'); if (wn) sl.push({ href: 'balon.html', color: COL.bal, bg: bg(COL.bal), chips: [['🏆 Último Balón de Oro'], [String(b0.ed || ''), 'w']], body: H.hero(H.img('trofeos/balon-de-oro.webp'), wn, b0.team != null ? MAGNA.teamName(b0.team) : (b0.teamName || '')), foot: 'Palmarés', cta: 'Ver palmarés →' }); }
    H.spot('⚡ Lo que viene', sl, 'Pronto habrá eventos nuevos.');
    H.ticker(MV.slice(0, 8).map(function (n) { return { href: 'mercado.html', tag: n.kind === 'transfer' ? 'Fichaje' : 'Mercado', text: n.text }; }), 'Fichajes');
    // banners
    var g = H.$('#cg'); g.innerHTML = ''; var i = 0;
    var bb = H.pv(vOpen ? 'Votación ' + (V.ed || '') : 'Palmarés', vOpen ? (V.nominees || []).length + ' nominados' : BL.length + ' ediciones');
    if (vOpen) (V.nominees || []).slice(0, 4).forEach(function (pid, k) { var p = MAGNA.by(S().players || [], pid) || {}; bb.appendChild(H.prow(k + 1, H.crest(p.teamId), MAGNA.playerName(pid) || 'Jugador', '', p.teamId != null ? MAGNA.teamName(p.teamId) : '')); });
    else BL.slice(0, 4).forEach(function (b) { bb.appendChild(H.prow('🏆', H.img('trofeos/balon-de-oro.webp'), MAGNA.ballonWho(b, 'winner') || '—', String(b.ed || ''), b.team != null ? MAGNA.teamName(b.team) : (b.teamName || ''))); });
    if (bb.children.length < 2) bb.appendChild(el('div', 'pv-e', 'El primer Balón de Oro está por definirse'));
    g.appendChild(H.card({ i: i++, title: 'Balón de Oro', color: COL.bal, bg: bg(COL.bal), tro: 'trofeos/balon-de-oro.webp', href: 'balon.html', status: vOpen ? 'Votación abierta' : 'Palmarés', on: vOpen, ph: 'Vota por el mejor', ed: 'El premio individual de Magna', body: bb, foot: vOpen && V.closes ? '🗳️ Cierra ' : '🏆 ' + BL.length + ' ediciones', footAt: vOpen && V.closes ? V.closes : null, cta: vOpen ? 'Votar' : 'Ver palmarés' }));
    var pb = H.pv('Torneos para predecir', PC.length + ''); PC.slice(0, 4).forEach(function (c, k) { pb.appendChild(H.prow(k + 1, el('span', 'ic', '🔮'), c.name, (c.teamIds || []).length + ' eq.', c.state && c.state.round ? c.state.round : 'Elige campeón y cruces')); });
    if (!PC.length) pb.appendChild(el('div', 'pv-e', 'No hay torneos abiertos para predecir ahora'));
    g.appendChild(H.card({ i: i++, title: 'Predicción', color: COL.pred, bg: bg(COL.pred), tro: 'mascota/pensando.webp', mascot: true, href: 'prediccion.html', status: PC.length ? 'Abierta' : 'Cerrada', on: PC.length > 0, ph: 'Gana Bits si aciertas', ed: 'Campeón, cruces y clasificados', body: pb, foot: '🔮 Arma tu cuadro antes de que empiece', cta: 'Predecir' }));
    var rb = H.pv(rOpen.length ? 'Sorteos abiertos' : 'Sorteos', RAF ? RAF.length + ' en total' : 'Cargando…');
    rOpen.slice(0, 3).forEach(function (r, k) { rb.appendChild(H.prow(k + 1, el('span', 'ic', '🎁'), r.title || 'Sorteo', H.fmt(r.entrants) + ' insc.', 'Premio: ' + itemName(r.prize_item) + (r.cost ? ' · ' + H.fmt(r.cost) + ' Bits' : ' · Gratis'))); });
    if (rLast) rb.appendChild(H.prow('🏆', el('span', 'ic', '🎉'), rLast.winner_name, '', 'Ganó: ' + (rLast.title || itemName(rLast.prize_item))));
    if (rb.children.length < 2) rb.appendChild(el('div', 'pv-e', RAF ? 'No hay sorteos abiertos por ahora' : 'Cargando los sorteos…'));
    g.appendChild(H.card({ i: i++, title: 'Sorteo', color: COL.raf, bg: bg(COL.raf), tro: 'mascota/celebrando.webp', mascot: true, href: 'sorteo.html', status: rOpen.length ? rOpen.length + ' abierto' + (rOpen.length === 1 ? '' : 's') : 'Sin sorteos', on: rOpen.length > 0, ph: 'Marcos legendarios y más', ed: 'Inscríbete y cruza los dedos', body: rb, oneCol: true, foot: rOpen[0] ? '⏱ Cierra ' : '🎁 Pronto hay más', footAt: rOpen[0] ? rOpen[0].closes_at : null, cta: 'Participar' }));
    var lb = H.pv('Próximos planes', PL.length + ''); PL.slice(0, 4).forEach(function (e, k) { var r = H.prow(k + 1, el('span', 'ic', '📅'), e.title, '', e.place || ''); var em = r.querySelector('em'); em.dataset.at = e.at; em.textContent = H.left(e.at); lb.appendChild(r); });
    if (!PL.length) lb.appendChild(el('div', 'pv-e', 'No hay planes en la agenda todavía'));
    g.appendChild(H.card({ i: i++, title: 'Planes', color: COL.plan, bg: bg(COL.plan), tro: 'mascota/salto.webp', mascot: true, href: 'planes.html', status: PL.length ? PL.length + ' en agenda' : 'Agenda vacía', on: PL.length > 0, ph: 'Finales, premiaciones y más', ed: 'Apúntate y pon la alarma', body: lb, foot: PL[0] ? '⏱ Próximo ' : '📅 Agenda de la comunidad', footAt: PL[0] ? PL[0].at : null, cta: 'Ver la agenda' }));
    var mb = H.pv('Últimos movimientos', MS.open ? 'Mercado abierto' : 'Mercado cerrado'); MV.slice(0, 4).forEach(function (n, k) { mb.appendChild(H.prow(k + 1, el('span', 'ic', n.kind === 'transfer' ? '⇄' : '💰'), n.text, H.ago(n.at))); });
    if (!MV.length) mb.appendChild(el('div', 'pv-e', 'Sin movimientos recientes'));
    g.appendChild(H.card({ i: i++, title: 'Fichajes', color: COL.mkt, bg: bg(COL.mkt), tro: 'mascota/de-pie.webp', mascot: true, href: 'mercado.html', status: MS.open ? 'Mercado abierto' : 'Mercado cerrado', on: MS.open, ph: 'Medias, goleadores y ofertas', ed: 'Quién llega y quién se va', body: mb, oneCol: true, foot: MS.open ? '🔓 Ventana de fichajes abierta' : '🔒 Espera la próxima ventana', cta: 'Ver fichajes' }));
    H.$('#cnt').textContent = '5 eventos'; H.done(); }
  render();
  function loadRaf() { H.sb().then(function (c) { return c.rpc('raffle_list'); }).then(function (r) { RAF = (r && r.data) || []; render(); }, function () { RAF = []; render(); }); }
  if (document.readyState === 'complete') loadRaf(); else addEventListener('load', loadRaf);
  window.addEventListener('magna:update', render);
})();
