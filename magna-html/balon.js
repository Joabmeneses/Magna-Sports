'use strict';
// Balón de Oro: votación de la comunidad (si hay una abierta) y palmarés de todas las ediciones.
(function () {
  var h = M.h, root = document.getElementById('bo'), myVote = null, total = null, results = null, busy = false, me = null;
  function S() { return MAGNA.S; }
  function by(l, id) { return MAGNA.by(l, id); }
  function media(p) { var x = MAGNA.playerStats()[p.id]; return x && x.media != null ? x.media : (p.media != null ? p.media : 10); }
  function sb() { return window.MAGNA_SB ? window.MAGNA_SB() : Promise.reject(new Error('Sin conexión')); }
  function toast(t, bad) { var x = h('div', null, t); x.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:90;background:#131833;border:1px solid ' + (bad ? 'var(--red)' : 'var(--green)') + ';color:var(--fg);padding:12px 18px;border-radius:14px;font:600 14px Archivo,sans-serif;max-width:calc(100vw - 24px)'; document.body.appendChild(x); setTimeout(function () { x.remove(); }, 3200); }
  function av(name, pid, size) { var p = pid != null ? by(S().players, pid) : null; return M.tierAv(name || '?', p ? media(p) : 10, size, pid != null ? pid : undefined); }
  function teamOf(b, k) { var id = b[k]; var t = id != null ? by(S().teams, id) : null; return t ? t.name : (b[k + 'Name'] || ''); }
  function fdt(s) { return M.fdt(s); }

  function render() {
    root.innerHTML = ''; var L = MAGNA.ballonList(), V = S().ballonVote;
    // portada
    var hd = h('section', 'bo-h'), tx = h('div'); tx.appendChild(h('div', 'ey', 'Premio individual · Magna Sports')); tx.appendChild(h('h1', 'x', 'Balón de Oro'));
    tx.appendChild(h('p', null, 'El reconocimiento al mejor jugador de cada edición. ' + (V && V.open ? 'La votación de la edición ' + V.ed + ' está abierta: elige a tu candidato.' : 'Aquí está la historia de todos los ganadores.')));
    var kp = h('div', 'bo-k'), last = L[0];
    [[L.length, L.length === 1 ? 'Edición' : 'Ediciones'], [last ? MAGNA.ballonWho(last, 'winner') : '—', 'Último ganador']].forEach(function (x) { var d = h('div'); d.appendChild(h('b', null, String(x[0]))); d.appendChild(h('small', null, x[1])); kp.appendChild(d); });
    tx.appendChild(kp); hd.appendChild(tx); var bimg = M.trophyImg('Balón de Oro', null, 220, null); if (bimg.tagName === 'IMG') { bimg.classList.add('bo-tro'); hd.appendChild(bimg); } else hd.appendChild(h('div', 'ball')); root.appendChild(hd);

    // votación
    if (V && V.id) {
      var sv = h('section', 'sec'); sv.appendChild(h('h2', 'x', 'Votación · Edición ' + V.ed)); var closed = !V.open || (V.closes && new Date(V.closes.replace(' ', 'T') + 'Z') < new Date());
      sv.appendChild(h('p', null, closed ? 'La votación terminó. La administración proclamará al ganador muy pronto.' : 'Un voto por cuenta; puedes cambiarlo hasta que cierre. Los resultados se revelan al final.'));
      var box = h('div', 'vt'), vh = h('div', 'vt-h'), l = h('div'); l.appendChild(h('b', null, (V.nominees || []).length + ' nominados')); vh.appendChild(l);
      var mt = []; if (total != null) mt.push(total + (total === 1 ? ' voto' : ' votos')); if (V.closes) mt.push((closed ? 'Cerró el ' : 'Cierra el ') + fdt(V.closes)); var meta = h('small', null, mt.join(' · ')); vh.appendChild(meta);
      vh.appendChild(h('span', 'st' + (closed ? ' off' : ''), closed ? 'Cerrada' : '● Abierta')); box.appendChild(vh);
      var g = h('div', 'nom'), PS = MAGNA.playerStats();
      (V.nominees || []).forEach(function (pid, i) { var p = by(S().players, pid); if (!p) return; var x = PS[pid] || {}, c = h('div', 'nc' + (myVote === pid ? ' mine' : '')); c.style.animationDelay = i * 60 + 'ms';
        if (myVote === pid) c.appendChild(h('span', 'ck', '✅')); c.appendChild(av(p.name, pid, 74)); var nb = h('b'); nb.appendChild(M.pn(p.name, pid, { title: true })); c.appendChild(nb); c.appendChild(h('small', null, p.teamId ? MAGNA.teamName(p.teamId) : 'Agente libre'));
        var ss = h('div', 'ss'); [['Media', media(p)], ['Goles', x.g || 0], ['MVP', x.mvp || 0], ['Títulos', (x.titles || []).length]].forEach(function (k) { ss.appendChild(h('span', null, k[0] + ' ' + k[1])); }); var bc = MAGNA.ballonCount(pid); if (bc) ss.appendChild(h('span', null, '🏆 ' + bc + ' Balón' + (bc > 1 ? 'es' : '') + ' de Oro')); c.appendChild(ss);
        if (!closed) { var bt = h('button', null, myVote === pid ? 'Tu voto' : me ? 'Votar' : 'Entra para votar'); bt.type = 'button'; bt.disabled = busy || (me && me.player_id === pid);
          if (me && me.player_id === pid) bt.textContent = 'Eres tú'; bt.onclick = function () { if (!me) { location.href = 'cuenta.html'; return; } vote(V.id, pid, p.name); }; c.appendChild(bt); }
        g.appendChild(c); });
      box.appendChild(g);
      var ft = h('p', 'vt-f'); if (!me && !closed) { ft.innerHTML = 'Para votar necesitas tu cuenta de Magna. <a href="cuenta.html">Entrar</a>'; } else if (myVote && !closed) ft.textContent = 'Votaste por ' + MAGNA.playerName(myVote) + '. Puedes cambiar tu voto mientras siga abierta.'; box.appendChild(ft);
      sv.appendChild(box); root.appendChild(sv);
    }

    // palmarés
    var sp = h('section', 'sec'); sp.appendChild(h('h2', 'x', 'Palmarés')); sp.appendChild(h('p', null, 'Todos los ganadores del Balón de Oro, de la edición más reciente a la primera.'));
    if (!L.length) sp.appendChild(h('div', 'emp', '🏆 Todavía no hay ediciones registradas.'));
    var pal = h('div', 'pal');
    L.forEach(function (b, i) { var r = h('div', 'pe' + (i === 0 ? ' first' : '')); r.style.animationDelay = Math.min(i, 10) * 50 + 'ms'; var ed = h('div', 'ed', b.ed || '—'); ed.appendChild(h('small', null, b.season ? String(b.season) : 'Edición')); r.appendChild(ed);
      var wn = MAGNA.ballonWho(b, 'winner') || '—'; r.appendChild(av(wn, b.winner, i === 0 ? 76 : 58)); var t = h('div'), wb = h('b'); wb.appendChild(b.winner != null && by(S().players, b.winner) ? M.pn(wn, b.winner) : M.pn(wn)); t.appendChild(wb); var tm = teamOf(b, 'team'); t.appendChild(h('span', 'tm', (tm ? tm : '') + (b.votes ? (tm ? ' · ' : '') + b.votes + ' votos' : '') + (b.source === 'vote' ? ' · votación de la comunidad' : ''))); r.appendChild(t);
      var pd = h('div', 'pod'), s2 = MAGNA.ballonWho(b, 'second'), s3 = MAGNA.ballonWho(b, 'third'); if (s2) pd.appendChild(h('span', null, '🥈 ' + s2)); if (s3) pd.appendChild(h('span', null, '🥉 ' + s3)); r.appendChild(pd); if (b.winner != null && by(S().players, b.winner) && window.MAGNA_COS) { r.dataset.plh = b.winner; MAGNA_COS.host(r); } pal.appendChild(r); });
    sp.appendChild(pal); root.appendChild(sp);

    // más ganadores
    var cnt = {}; L.forEach(function (b) { var k = b.winner != null ? 'p' + b.winner : 'n' + String(MAGNA.ballonWho(b, 'winner') || '').toLowerCase(); if (!cnt[k]) cnt[k] = { n: 0, name: MAGNA.ballonWho(b, 'winner'), pid: b.winner, eds: [] }; cnt[k].n++; cnt[k].eds.push(b.ed); });
    var top = Object.keys(cnt).map(function (k) { return cnt[k]; }).filter(function (x) { return x.name; }).sort(function (a, b) { return b.n - a.n || a.name.localeCompare(b.name); });
    if (top.length) { var sm = h('section', 'sec'); sm.appendChild(h('h2', 'x', 'Más ganadores')); var mg = h('div', 'most');
      top.slice(0, 12).forEach(function (x) { var m = h('div', 'mo'); m.appendChild(av(x.name, x.pid, 44)); var d = h('div'), xb = h('b'); xb.appendChild(x.pid != null && by(S().players, x.pid) ? M.pn(x.name, x.pid) : M.pn(x.name)); d.appendChild(xb); d.appendChild(h('small', null, 'Ediciones ' + x.eds.join(', '))); m.appendChild(d); m.appendChild(h('span', 'n', '🏆 ' + x.n)); mg.appendChild(m); });
      sm.appendChild(mg); root.appendChild(sm); }
  }
  function vote(id, pid, name) { if (busy) return; busy = true; render();
    sb().then(function (c) { return c.rpc('ballon_vote', { p_vote: id, p_player: pid }); }).then(function (r) { busy = false; if (r && r.error) throw r.error; myVote = pid; toast('¡Votaste por ' + name + '!'); loadTotals(); render(); }, function (e) { busy = false; toast(e.message || 'No se pudo votar', true); render(); }); }
  function loadTotals() { var V = S().ballonVote; if (!V || !V.id) return; sb().then(function (c) { return c.rpc('ballon_total', { p_vote: V.id }); }).then(function (r) { if (r && !r.error) { total = Number(r.data) || 0; render(); } }, function () {}); }
  function boot() {
    render(); var V = S().ballonVote; if (!V || !V.id) return; loadTotals();
    if (window.ACCOUNTS) ACCOUNTS.me().then(function (a) { me = a; if (!a) return render(); sb().then(function (c) { return c.rpc('ballon_my_vote', { p_vote: V.id }); }).then(function (r) { myVote = r && r.data != null ? Number(r.data) : null; render(); }, function () { render(); }); }, function () {});
  }
  window.addEventListener('magna:update', function () { render(); });
  if (document.readyState === 'complete') boot(); else addEventListener('load', boot);
})();
