'use strict';
// Panel del coach: alineación, plantilla, mercado (fichar, liberar, ofertas). Todo lo valida la base de datos.
(function () {
  var h = M.h, app = document.getElementById('app'), me = null, tab = 'alineacion', draft = null, busy = false;
  try { var hs = location.hash.slice(1); if (/^(alineacion|plantilla|mercado|ofertas)$/.test(hs)) tab = hs; } catch (e) {}
  function S() { return MAGNA.S; }
  function by(l, id) { return MAGNA.by(l, id); }
  function fmt(n) { return String(Math.round(Number(n || 0))).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function media(p) { if (p.media != null) return p.media; var x = MAGNA.playerStats()[p.id]; return x && x.media != null ? x.media : 10; }
  function price(p) { var m = media(p); return Math.max(50, Math.round(m * m / 10)); }
  function toast(t, k) { var x = h('div', 'toast' + (k ? ' ' + k : ''), t); document.body.appendChild(x); setTimeout(function () { x.remove(); }, k === 'bad' ? 4500 : 2600); }
  function myTeam() { return me && me.player_id ? S().teams.filter(function (t) { return t.coach === me.player_id; })[0] : null; }
  function act(fn, args, okMsg) { if (busy) return; busy = true; render();
    return ACCOUNTS.coach(fn, args).then(function (r) { busy = false; draft = null; toast(typeof okMsg === 'function' ? okMsg(r) : okMsg, 'ok'); return ACCOUNTS.pullState(); }, function (e) { busy = false; toast(e.message || 'No se pudo', 'bad'); render(); }); }
  function ask(title, sub, val, cb) { var ov = h('div', 'ov'), d = h('div', 'dlg'); ov.appendChild(d); d.appendChild(h('h3', 'x', title)); d.appendChild(h('p', 'em', sub)); var i = h('input'); i.type = 'number'; i.min = 1; i.value = val; d.appendChild(i);
    var r = h('div', 'r'), no = h('button', 'btn', 'Cancelar'), go = h('button', 'btn o', 'Enviar oferta'); no.onclick = function () { ov.remove(); }; go.onclick = function () { var v = Math.floor(Number(i.value)); if (!(v >= 1)) return; ov.remove(); cb(v); }; r.appendChild(no); r.appendChild(go); d.appendChild(r);
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); }; document.body.appendChild(ov); i.focus(); i.select(); }
  function confirmIt(title, sub, label, cb) { var ov = h('div', 'ov'), d = h('div', 'dlg'); ov.appendChild(d); d.appendChild(h('h3', 'x', title)); d.appendChild(h('p', 'em', sub));
    var r = h('div', 'r'), no = h('button', 'btn', 'Cancelar'), go = h('button', 'btn o', label); no.onclick = function () { ov.remove(); }; go.onclick = function () { ov.remove(); cb(); }; r.appendChild(no); r.appendChild(go); d.appendChild(r); ov.onclick = function (e) { if (e.target === ov) ov.remove(); }; document.body.appendChild(ov); }
  function av(p) { return M.tierAv(p.name, media(p), 46, p.id); }

  function gate(title, text, href, label) { app.innerHTML = ''; var g = h('div', 'gate'); g.appendChild(h('h1', 'x', title)); g.appendChild(h('p', 'sub', text)); g.querySelector('p').style.margin = '12px auto 0'; if (href) { var a = h('a', 'btn o', label); a.href = href; g.appendChild(a); } app.appendChild(g); }

  function render() {
    if (!me) return gate('Mi equipo', 'Entra con tu usuario y código para gestionar tu equipo.', 'cuenta.html', 'Entrar');
    var t = myTeam();
    if (!t) return gate('Esta sección es para los coaches', 'Tu cuenta no es DT de ningún equipo. Si eres coach, pídele a la administración que te asigne como DT con el rol "Solo coach" o "Coach y jugador".', 'cuenta.html', 'Ir a Mi cuenta');
    var mk = MAGNA.marketState(), lv = MAGNA.tierRank(t.level || 'plata'), members = S().players.filter(function (p) { return p.teamId === t.id; });
    var offers = (S().offers || []).filter(function (o) { return o.buyer === t.id || o.seller === t.id; }), inbox = offers.filter(function (o) { return o.seller === t.id && o.status === 'pending'; });
    app.innerHTML = ''; app.style.setProperty('--tc', MAGNA.teamColor(t.id));
    // cabecera
    var hero = h('div', 'ce-hero'); hero.appendChild(M.crest(t.id, t.name, 88)); var tx = h('div'); tx.appendChild(h('h1', 'x', t.name)); tx.appendChild(h('p', 'sub', 'Eres el DT · Nivel de fichajes: ' + MAGNA.TIERS[lv][1] + ' (puedes fichar hasta ese nivel)')); var lk = h('a', null, 'Ver página del equipo →'); lk.href = 'equipo.html?id=' + t.id; lk.style.cssText = 'display:inline-block;margin-top:8px;color:#c9b8ff;font-size:14px'; tx.appendChild(lk); hero.appendChild(tx);
    var kp = h('div', 'ce-kp'); [[fmt(t.budget || 0), 'Presupuesto (Bits)', 'gold'], [members.length + '/4', 'Plantilla'], [inbox.length, 'Ofertas por responder']].forEach(function (x) { var d = h('div', x[2] || ''); d.appendChild(h('b', null, String(x[0]))); d.appendChild(h('small', null, x[1])); kp.appendChild(d); }); hero.appendChild(kp); app.appendChild(hero);
    var mb = h('div', 'mk' + (mk.open ? ' on' : '')); mb.appendChild(h('i')); var mt = h('span'); mt.appendChild(h('b', null, mk.open ? 'Mercado abierto' : 'Mercado cerrado')); mt.appendChild(document.createTextNode(mk.open ? ' · Puedes fichar, liberar y hacer ofertas' + (mk.closes ? ' hasta el ' + M.fdt(mk.closes) : '') + '.' : ' · Puedes armar tu alineación; los fichajes se habilitan cuando la administración abra el mercado.')); mb.appendChild(mt); app.appendChild(mb);
    // pestañas
    var tb = h('div', 'tabs'); [['alineacion', 'Alineación'], ['plantilla', 'Plantilla'], ['mercado', 'Mercado'], ['ofertas', 'Ofertas'], ['amistosos', 'Amistosos']].forEach(function (x) { var b = h('button', x[0] === tab ? 'on' : '', x[1]); b.type = 'button'; if (x[0] === 'ofertas' && inbox.length) b.appendChild(h('span', 'nb', String(inbox.length))); b.onclick = function () { tab = x[0]; try { history.replaceState(null, '', '#' + tab); } catch (e) {} render(); }; tb.appendChild(b); }); app.appendChild(tb);
    var body = h('div'); app.appendChild(body);
    if (tab === 'alineacion') lineupV(body, t, members); else if (tab === 'plantilla') squadV(body, t, members, mk); else if (tab === 'mercado') marketV(body, t, members, mk, lv); else if (tab === 'amistosos') friendlyV(body, t); else offersV(body, t, offers);
  }

  function lineupV(b, t, members) {
    if (!members.length) { b.appendChild(h('p', 'em', 'Tu plantilla está vacía. Ficha jugadores en la pestaña Mercado cuando el mercado esté abierto.')); return; }
    if (!draft || draft.team !== t.id) { draft = { team: t.id, s: {} }; members.forEach(function (p) { draft.s[p.id] = p.slot === 'reserve' ? 'reserve' : 'starter'; }); }
    members.forEach(function (p) { if (!draft.s[p.id]) draft.s[p.id] = 'reserve'; });
    var st = members.filter(function (p) { return draft.s[p.id] === 'starter'; }), rs = members.filter(function (p) { return draft.s[p.id] === 'reserve'; });
    var pitch = h('div', 'pitch'); for (var i = 0; i < 3; i++) { var p = st[i], sp = h('div', 'sp' + (p ? ' f' : '')); if (p) { var w = h('div'); w.appendChild(h('b', null, p.name)); w.appendChild(h('small', null, 'Titular · media ' + media(p))); sp.appendChild(w); } else sp.textContent = 'Titular ' + (i + 1); pitch.appendChild(sp); }
    var bn = h('div', 'sp bench' + (rs[0] ? ' f' : '')); bn.textContent = rs.length ? 'Suplente: ' + rs.map(function (p) { return p.name; }).join(', ') : 'Suplente'; pitch.appendChild(bn); b.appendChild(pitch);
    var g = h('div', 'grid2');
    members.forEach(function (p) { var c = h('div', 'pcard'), tp = h('div', 'tp'), tr = MAGNA.tierOf(media(p)); c.style.setProperty('--kc', tr.color); tp.appendChild(av(p)); var n = h('div'); n.appendChild(h('b', 'n', p.name)); n.appendChild(h('small', null, tr.name + (t.coach === p.id ? ' · DT' : ''))); tp.appendChild(n); var md = h('div', 'pmd'); md.appendChild(h('b', null, String(media(p)))); tp.appendChild(md); c.appendChild(tp);
      var sg = h('div', 'seg'); [['starter', 'Titular'], ['reserve', 'Suplente']].forEach(function (x) { var bt = h('button', (draft.s[p.id] === x[0] ? 'on' : '') + (x[0] === 'reserve' ? ' r' : ''), x[1]); bt.type = 'button'; bt.onclick = function () { draft.s[p.id] = x[0]; render(); }; sg.appendChild(bt); }); c.appendChild(sg); g.appendChild(c); });
    b.appendChild(g);
    var ok = st.length <= 3 && rs.length <= 1, changed = members.some(function (p) { return (p.slot === 'reserve' ? 'reserve' : 'starter') !== draft.s[p.id]; });
    var bar = h('div', 'lineup'), cn = h('div', 'cnt'); cn.innerHTML = ''; cn.appendChild(document.createTextNode('Titulares: ')); cn.appendChild(h('b', null, st.length + '/3')); cn.appendChild(document.createTextNode(' · Suplente: ')); cn.appendChild(h('b', null, rs.length + '/1')); if (!ok) cn.appendChild(h('span', null, ' · Máximo 3 titulares y 1 suplente')); bar.appendChild(cn);
    var sv = h('button', 'btn o', busy ? 'Guardando…' : 'Guardar alineación'); sv.type = 'button'; sv.disabled = !ok || !changed || busy; sv.onclick = function () { act('coach_lineup', { p_starters: st.map(function (p) { return p.id; }), p_reserve: rs[0] ? rs[0].id : null }, 'Alineación guardada'); }; bar.appendChild(sv); b.appendChild(bar);
    var nx = S().matches.filter(function (m) { return (m.status === 'scheduled' || m.status === 'live') && (m.home === t.id || m.away === t.id); }).sort(function (a, c) { return String(a.at || '9').localeCompare(String(c.at || '9')); })[0];
    if (nx) b.appendChild(h('p', 'em', 'Próximo partido: vs ' + MAGNA.teamName(nx.home === t.id ? nx.away : nx.home) + (nx.at ? ' · ' + M.fdt(nx.at) : '') + '. La alineación que guardes es la que entra cuando empiece.'));
  }

  function squadV(b, t, members, mk) {
    if (!members.length) b.appendChild(h('p', 'em', 'Todavía no tienes jugadores.'));
    members.forEach(function (p) { var r = h('div', 'row'); r.appendChild(av(p)); var tx = h('div', 'tx'); tx.appendChild(h('b', null, p.name + (t.coach === p.id ? ' (DT)' : ''))); tx.appendChild(h('small', null, (p.slot === 'reserve' ? 'Suplente' : 'Titular') + ' · media ' + media(p) + ' · ' + MAGNA.tierOf(media(p)).name + ' · ' + MAGNA.roleName(p))); r.appendChild(tx); r.appendChild(h('span', 'price', fmt(price(p)) + ' Bits'));
      var a = h('div', 'act'), rl = h('button', 'btn d', 'Liberar (+' + fmt(Math.floor(price(p) / 2)) + ')'); rl.type = 'button'; rl.disabled = !mk.open || busy || t.coach === p.id; rl.title = !mk.open ? 'El mercado está cerrado' : t.coach === p.id ? 'Eres el DT' : 'Queda como agente libre y recuperas la mitad de su precio';
      rl.onclick = function () { confirmIt('¿Liberar a ' + p.name + '?', 'Queda como agente libre y tu equipo recupera ' + fmt(Math.floor(price(p) / 2)) + ' Bits (la mitad de su precio).', 'Liberar', function () { act('coach_release', { p_player: p.id }, function (v) { return p.name + ' liberado · +' + fmt(v) + ' Bits'; }); }); }; a.appendChild(rl); r.appendChild(a); b.appendChild(r); });
    var coach = by(S().players, t.coach); if (coach && MAGNA.roleOf(coach) === 'coach') b.appendChild(h('p', 'em', 'Cuerpo técnico: ' + coach.name + ' (Solo coach).'));
    b.appendChild(h('p', 'em', 'Para vender a otro equipo, espera sus ofertas en la pestaña Ofertas.'));
  }

  function marketV(b, t, members, mk, lv) {
    var q = h('input', 'search'); q.placeholder = 'Buscar jugador…'; var bar = h('div', 'bar'); bar.appendChild(q); b.appendChild(bar);
    var list = h('div'); b.appendChild(list); var full = members.length >= 4;
    function draw() { list.innerHTML = ''; var s = (q.value || '').trim().toLowerCase();
      var free = S().players.filter(function (p) { return !p.teamId && MAGNA.plays(p) && (!s || p.name.toLowerCase().indexOf(s) >= 0); }).sort(function (a, c) { return media(c) - media(a); });
      var others = S().players.filter(function (p) { return p.teamId && p.teamId !== t.id && MAGNA.plays(p) && (!s || p.name.toLowerCase().indexOf(s) >= 0); }).sort(function (a, c) { return media(c) - media(a); });
      list.appendChild(h('h3', 'x', 'Agentes libres'));
      if (!free.length) list.appendChild(h('p', 'em', 'No hay agentes libres.'));
      free.forEach(function (p) { var tr = MAGNA.tierOf(media(p)), lock = tr.rank > lv, r = h('div', 'row'); r.appendChild(av(p)); var tx = h('div', 'tx'); var tb0 = h('b'); tb0.appendChild(M.pn(p.name, p.id)); tx.appendChild(tb0); tx.appendChild(h('small', null, 'Media ' + media(p) + ' · ' + tr.name)); r.appendChild(tx); r.appendChild(h('span', 'price', fmt(price(p)) + ' Bits'));
        var a = h('div', 'act'); if (lock) a.appendChild(h('span', 'lock', '🔒 Por encima de tu nivel')); else { var f = h('button', 'btn g', 'Fichar'); f.type = 'button'; f.disabled = !mk.open || full || busy || (t.budget || 0) < price(p); f.title = !mk.open ? 'Mercado cerrado' : full ? 'Plantilla llena' : (t.budget || 0) < price(p) ? 'Presupuesto insuficiente' : '';
          f.onclick = function () { confirmIt('¿Fichar a ' + p.name + '?', 'Cuesta ' + fmt(price(p)) + ' Bits de tu presupuesto (' + fmt(t.budget || 0) + ').', 'Fichar', function () { act('coach_sign', { p_player: p.id }, function (v) { return '¡' + p.name + ' es tuyo! · −' + fmt(v) + ' Bits'; }); }); }; a.appendChild(f); }
        r.appendChild(a); list.appendChild(r); });
      list.appendChild(h('h3', 'x', 'Jugadores de otros equipos'));
      if (!others.length) list.appendChild(h('p', 'em', 'No hay jugadores en otros equipos.'));
      others.forEach(function (p) { var tr = MAGNA.tierOf(media(p)), lock = tr.rank > lv, r = h('div', 'row'), tm = by(S().teams, p.teamId); r.appendChild(av(p)); var tx = h('div', 'tx'); var tb0 = h('b'); tb0.appendChild(M.pn(p.name, p.id)); tx.appendChild(tb0); tx.appendChild(h('small', null, (tm ? tm.name : '') + ' · media ' + media(p) + ' · ' + tr.name)); r.appendChild(tx); r.appendChild(h('span', 'price', 'Valor ' + fmt(price(p))));
        var a = h('div', 'act'), pend = (S().offers || []).some(function (o) { return o.player === p.id && o.buyer === t.id && o.status === 'pending'; });
        if (lock) a.appendChild(h('span', 'lock', '🔒 Por encima de tu nivel')); else if (pend) a.appendChild(h('span', 'st pending', 'Oferta enviada')); else { var o = h('button', 'btn', 'Hacer oferta'); o.type = 'button'; o.disabled = !mk.open || full || busy; o.title = !mk.open ? 'Mercado cerrado' : full ? 'Plantilla llena' : '';
          o.onclick = function () { ask('Oferta por ' + p.name, 'Su valor es ' + fmt(price(p)) + ' Bits. Tu presupuesto: ' + fmt(t.budget || 0) + '. El otro coach decide si acepta.', price(p), function (v) { act('coach_offer', { p_player: p.id, p_amount: v }, 'Oferta enviada a ' + (tm ? tm.name : 'su equipo')); }); }; a.appendChild(o); }
        r.appendChild(a); list.appendChild(r); }); }
    q.oninput = draw; draw();
    if (!mk.open) b.insertBefore(h('p', 'em', 'El mercado está cerrado: puedes mirar, pero no fichar ni ofertar.'), bar);
  }

  function offersV(b, t, offers) {
    var ST = { pending: 'Pendiente', accepted: 'Aceptada', rejected: 'Rechazada', cancelled: 'Cancelada' };
    function row(o, mine) { var p = by(S().players, o.player), other = by(S().teams, mine ? o.seller : o.buyer), r = h('div', 'row'); if (p) r.appendChild(av(p)); var tx = h('div', 'tx'); tx.appendChild(h('b', null, (p ? p.name : 'Jugador') + ' · ' + fmt(o.amount) + ' Bits')); tx.appendChild(h('small', null, (mine ? 'A ' : 'De ') + (other ? other.name : '—') + (o.at ? ' · ' + M.fdt(o.at) : ''))); r.appendChild(tx); r.appendChild(h('span', 'st ' + o.status, ST[o.status] || o.status));
      var a = h('div', 'act'); if (o.status === 'pending') { if (mine) { var c = h('button', 'btn d', 'Cancelar'); c.type = 'button'; c.disabled = busy; c.onclick = function () { act('coach_offer_reply', { p_offer: o.id, p_action: 'cancel' }, 'Oferta cancelada'); }; a.appendChild(c); }
        else { var y = h('button', 'btn g', 'Aceptar'), n = h('button', 'btn d', 'Rechazar'); y.type = n.type = 'button'; y.disabled = n.disabled = busy; y.onclick = function () { confirmIt('¿Vender a ' + (p ? p.name : 'este jugador') + '?', (other ? other.name : 'El otro equipo') + ' paga ' + fmt(o.amount) + ' Bits y el jugador pasa a su plantilla.', 'Aceptar oferta', function () { act('coach_offer_reply', { p_offer: o.id, p_action: 'accept' }, '¡Venta cerrada! +' + fmt(o.amount) + ' Bits'); }); }; n.onclick = function () { act('coach_offer_reply', { p_offer: o.id, p_action: 'reject' }, 'Oferta rechazada'); }; a.appendChild(y); a.appendChild(n); } }
      r.appendChild(a); return r; }
    var inb = offers.filter(function (o) { return o.seller === t.id; }).reverse(), out = offers.filter(function (o) { return o.buyer === t.id; }).reverse();
    b.appendChild(h('h3', 'x', 'Recibidas')); if (!inb.length) b.appendChild(h('p', 'em', 'Nadie ha ofertado por tus jugadores todavía.')); inb.slice(0, 20).forEach(function (o) { b.appendChild(row(o, false)); });
    b.appendChild(h('h3', 'x', 'Enviadas')); if (!out.length) b.appendChild(h('p', 'em', 'No has hecho ofertas. Búscalas en Mercado → Jugadores de otros equipos.')); out.slice(0, 20).forEach(function (o) { b.appendChild(row(o, true)); });
  }

  // Proponer un amistoso al administrador.
  function friendlyV(b, t) {
    var reqs = (S().friendlyReqs || []).filter(function (r) { return r.from === t.id || r.rival === t.id; }).slice().reverse(), pend = reqs.filter(function (r) { return r.from === t.id && r.status === 'pending'; }).length;
    var card = h('div', 'fq'); card.appendChild(h('h3', 'x', 'Proponer un amistoso')); card.appendChild(h('p', 'em', 'Elige el rival y, si quieres, una fecha. La propuesta le llega al administrador, que la aprueba y programa el partido. Cada amistoso da 5.000 pts de ranking a los dos equipos.'));
    var f = h('div', 'fq-f'), l1 = h('label', null, 'Rival'), rs = h('select'); S().teams.filter(function (x) { return x.id !== t.id; }).sort(function (a, c) { return a.name.localeCompare(c.name); }).forEach(function (x) { var o = h('option', null, x.name); o.value = x.id; rs.appendChild(o); }); l1.appendChild(rs);
    var l2 = h('label', null, 'Fecha y hora (opcional)'), dt = h('input'); dt.type = 'datetime-local'; l2.appendChild(dt);
    var l3 = h('label', 'w', 'Mensaje para el administrador (opcional)'), nt = h('textarea'); nt.rows = 2; nt.maxLength = 200; nt.placeholder = 'Ej.: Podemos jugar el sábado en la tarde.'; l3.appendChild(nt);
    f.appendChild(l1); f.appendChild(l2); f.appendChild(l3); card.appendChild(f);
    var go = h('button', 'btn o', busy ? 'Enviando…' : 'Enviar propuesta'); go.type = 'button'; go.disabled = busy || !rs.options.length || pend >= 3;
    if (pend >= 3) card.appendChild(h('p', 'em', 'Tienes 3 propuestas pendientes. Espera a que el administrador responda.'));
    go.onclick = function () { var at = null; if (dt.value) { var d = new Date(dt.value); if (isNaN(d)) return toast('Fecha no válida', 'bad'); if (d < new Date()) return toast('La fecha debe ser en el futuro', 'bad'); at = d.toISOString().slice(0, 19).replace('T', ' '); }
      var rv = by(S().teams, Number(rs.value)); act('coach_friendly_request', { p_rival: Number(rs.value), p_at: at, p_note: nt.value.trim() || null }, 'Propuesta enviada: ' + t.name + ' vs ' + (rv ? rv.name : 'rival')); };
    card.appendChild(go); b.appendChild(card);
    var ST = { pending: ['Pendiente', 'pending'], approved: ['Aprobado', 'ok'], rejected: ['Rechazado', 'no'], cancelled: ['Cancelado', 'no'] };
    b.appendChild(h('h3', 'x', 'Propuestas'));
    if (!reqs.length) b.appendChild(h('p', 'em', 'Todavía no hay propuestas de amistoso con tu equipo.'));
    reqs.slice(0, 20).forEach(function (r) { var mine = r.from === t.id, other = mine ? r.rival : r.from, row = h('div', 'row'); var tx = h('div', 'tx');
      tx.appendChild(h('b', null, (mine ? 'Contra ' : 'Te propone ') + MAGNA.teamName(other)));
      var m = r.match ? by(S().matches, r.match) : null, when = m && m.at ? m.at : r.at;
      tx.appendChild(h('small', null, (when ? M.fdt(when) : 'Sin fecha') + (r.note ? ' · “' + r.note + '”' : '') + (r.status === 'rejected' && r.reason ? ' · Motivo: ' + r.reason : '')));
      row.appendChild(tx); var a = h('div', 'act'), sc = ST[r.status] || [r.status, '']; a.appendChild(h('span', 'st ' + sc[1], sc[0]));
      if (mine && r.status === 'pending') { var c = h('button', 'btn d', 'Cancelar'); c.type = 'button'; c.disabled = busy; c.onclick = function () { act('coach_friendly_cancel', { p_req: r.id }, 'Propuesta cancelada'); }; a.appendChild(c); }
      row.appendChild(a); b.appendChild(row); });
    var up = S().matches.filter(function (m) { return m.type === 'friendly' && m.status !== 'cancelled' && m.status !== 'finished' && (m.home === t.id || m.away === t.id); });
    if (up.length) { b.appendChild(h('h3', 'x', 'Amistosos programados')); up.forEach(function (m) { var row = h('div', 'row'), tx = h('div', 'tx'); tx.appendChild(h('b', null, MAGNA.teamName(m.home) + ' vs ' + MAGNA.teamName(m.away))); tx.appendChild(h('small', null, (m.at ? M.fdt(m.at) : 'Fecha por confirmar') + (m.status === 'live' ? ' · En vivo' : ''))); row.appendChild(tx); b.appendChild(row); }); }
  }

  function boot() { if (!window.ACCOUNTS) return setTimeout(boot, 50); ACCOUNTS.me().then(function (a) { me = a; render(); }, function () { me = null; render(); }); }
  window.addEventListener('magna:update', function () { render(); });
  if (document.readyState === 'complete') boot(); else addEventListener('load', boot);
})();
