'use strict';
// Balón de Oro: apoyo de la afición a los nominados (el ganador lo elige la organización), campeón vigente y palmarés.
(function () {
  var h = M.h, root = document.getElementById('bo'), myVote = null, total = null, busy = false, me = null;
  function S() { return MAGNA.S; }
  function by(l, id) { return MAGNA.by(l, id); }
  function media(p) { var x = MAGNA.playerStats()[p.id]; return x && x.media != null ? x.media : (p.media != null ? p.media : 10); }
  function sb() { return window.MAGNA_SB ? window.MAGNA_SB() : Promise.reject(new Error('Sin conexión')); }
  function toast(t, bad) { var x = h('div', 'bo-toast' + (bad ? ' bad' : ''), t); document.body.appendChild(x); setTimeout(function () { x.remove(); }, 3200); }
  function av(name, pid, size) { var p = pid != null ? by(S().players, pid) : null; return M.tierAv(name || '?', p ? media(p) : 10, size, pid != null ? pid : undefined); }
  function teamOf(b, k) { var id = b[k]; var t = id != null ? by(S().teams, id) : null; return t ? t.name : (b[k + 'Name'] || ''); }
  function who(name, pid) { return pid != null && by(S().players, pid) ? M.pn(name, pid) : M.pn(name); }
  function when(s) { return s ? new Date(String(s).replace(' ', 'T') + (/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? '' : 'Z')).getTime() : NaN; }
  function left(s) { var d = when(s) - Date.now(); if (isNaN(d)) return ''; if (d <= 0) return 'cerrando'; var mn = Math.floor(d / 6e4), hh = Math.floor(mn / 60), dd = Math.floor(hh / 24); return dd ? dd + ' d ' + hh % 24 + ' h' : hh ? hh + ' h ' + mn % 60 + ' min' : Math.max(1, mn) + ' min'; }
  // títulos que ganó el jugador en una temporada (año): torneos y ligas del sitio + historial cargado por la administración
  function nk(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim(); }
  function compYr(type, c) { var ds = S().matches.filter(function (m) { return m.type === type && m.cid === c.id && m.at; }).map(function (m) { return m.at; }).sort(); return ds.length ? ds[ds.length - 1].slice(0, 4) : null; }
  function seasonTitles(pid, yr) { var x = MAGNA.playerStats()[pid] || {}, out = [];
    (x.titles || []).forEach(function (n) { var y = null, c = S().tournaments.filter(function (t) { return nk(t.name) === nk(n); })[0];
      if (c) y = compYr('tournament', c); else { c = S().leagues.filter(function (t) { return nk(t.name) === nk(n); })[0]; if (c) y = compYr('league', c); else { var e = (S().history || []).filter(function (t) { return nk(t.name) === nk(n); })[0]; if (e && e.date) y = String(e.date).slice(0, 4); } }
      if (y === yr && out.indexOf(n) < 0) out.push(n); }); return out; }
  function sec(title, right) { var s = h('section', 'bo-sc'), hd = h('div', 'bo-sh'), h2 = h('h2'), sp = title.lastIndexOf(' '), cut = sp > 0 ? sp + 1 : Math.ceil(title.length / 2); h2.appendChild(document.createTextNode(title.slice(0, cut))); h2.appendChild(h('span', null, title.slice(cut))); hd.appendChild(h2); if (right) hd.appendChild(h('small', null, right)); s.appendChild(hd); root.appendChild(s); return s; }

  function render() {
    root.innerHTML = ''; var L = MAGNA.ballonList(), V = S().ballonVote, vOn = V && V.id, closed = vOn && (!V.open || (V.closes && when(V.closes) < Date.now()));
    // ---------- portada ----------
    var hero = h('section', 'bo-hero'), tx = h('div'), ey = h('div', 'bo-ey');
    ey.appendChild(h('span', 'bo-chip', 'Premio individual')); if (vOn) ey.appendChild(h('span', 'bo-chip', 'Edición ' + V.ed));
    if (vOn) ey.appendChild(h('span', 'bo-chip' + (closed ? '' : ' on'), closed ? 'Apoyo cerrado' : 'Apoya a tu favorito'));
    tx.appendChild(ey); var h1 = h('h1'); h1.appendChild(document.createTextNode('Balón de ')); h1.appendChild(h('span', null, 'Oro')); tx.appendChild(h1);
    tx.appendChild(h('p', null, vOn ? (closed ? 'Terminó el apoyo de la edición ' + V.ed + '. Pronto la organización anunciará al ganador.' : 'Muestra a quién quiere la afición en la edición ' + V.ed + '. El ganador lo elige la organización de Magna; tu apoyo es la voz de la comunidad.') : 'El premio al mejor jugador de cada edición, elegido por la comunidad.'));
    var nums = h('div', 'bo-nums');
    function num(v, l) { var d = h('div', 'bo-n'); d.appendChild(h('b', null, String(v))); d.appendChild(h('span', null, l)); nums.appendChild(d); }
    if (vOn && !closed) { if (V.closes) num(left(V.closes), 'para el cierre'); num(total != null ? total : '—', total === 1 ? 'apoyo' : 'apoyos'); num((V.nominees || []).length, 'nominados'); }
    else { num(L.length, L.length === 1 ? 'edición' : 'ediciones'); if (L[0]) num(MAGNA.ballonWho(L[0], 'winner') || '—', 'campeón vigente'); }
    tx.appendChild(nums);
    if (vOn && !closed) { var cta = h('a', 'bo-cta', myVote ? 'Cambiar mi apoyo ↓' : 'Apoyar a un nominado ↓'); cta.href = '#votar'; tx.appendChild(cta); }
    hero.appendChild(tx); var bimg = M.trophyImg('Balón de Oro', null, 230, null); if (bimg.tagName === 'IMG') { bimg.classList.add('bo-tro'); hero.appendChild(bimg); } root.appendChild(hero);

    // ---------- votación ----------
    if (vOn) {
      var yr = String((V.season && String(V.season).match(/\d{4}/)) || (V.opened ? String(V.opened).slice(0, 4) : new Date().getFullYear())), sv = sec('Los nominados', V.closes ? (closed ? 'Cerró el ' : 'Cierra el ') + M.fdt(V.closes) : ''); sv.id = 'votar';
      if (closed) sv.appendChild(h('p', 'bo-note', 'El apoyo terminó. La organización anunciará al ganador muy pronto.'));
      var g = h('div', 'bo-nom'), PS = MAGNA.playerStats(); g.style.setProperty('--n', Math.max(1, Math.min(3, (V.nominees || []).length)));
      (V.nominees || []).forEach(function (pid, i) { var p = by(S().players, pid); if (!p) return; var x = PS[pid] || {}, mine = myVote === pid, c = h('div', 'bo-c' + (mine ? ' mine' : '')); c.style.animationDelay = i * 60 + 'ms'; if (p.teamId != null && MAGNA.teamColor) c.style.setProperty('--tc', MAGNA.teamColor(p.teamId));
        c.appendChild(av(p.name, pid, 110));
        var nb = h('b'); nb.appendChild(M.pn(p.name, pid, { title: true })); c.appendChild(nb);
        var tm = h('span', 'bo-tm'); if (p.teamId != null) tm.appendChild(M.crest(p.teamId, MAGNA.teamName(p.teamId), 18)); tm.appendChild(document.createTextNode(p.teamId != null ? MAGNA.teamName(p.teamId) : 'Agente libre')); c.appendChild(tm);
        var ss = h('div', 'bo-ss'); [[Math.round(media(p)), 'Media'], [x.g || 0, 'Goles'], [x.mvp || 0, 'MVP']].forEach(function (k) { var d = h('div'); d.appendChild(h('b', null, String(k[0]))); d.appendChild(h('span', null, k[1])); ss.appendChild(d); }); c.appendChild(ss);
        var tl = seasonTitles(pid, yr), tw = h('div', 'bo-tt'); tw.appendChild(h('span', 'k', 'Títulos ' + yr)); if (tl.length) tl.forEach(function (n) { tw.appendChild(h('span', 't', '🏆 ' + n)); }); else tw.appendChild(h('span', 'e', 'Sin títulos esta temporada')); c.appendChild(tw);
        var bc = MAGNA.ballonCount(pid); if (bc) c.appendChild(h('span', 'bo-bal', '🏆 ' + bc + (bc > 1 ? ' Balones de Oro' : ' Balón de Oro')));
        if (!closed) { var self = me && me.player_id === pid, bt = h('button', 'bo-v', self ? 'Eres tú' : mine ? '✓ Lo apoyas' : me ? 'Apoyar' : 'Entra para apoyar'); bt.type = 'button'; bt.disabled = busy || self || mine;
          bt.onclick = function () { if (!me) { location.href = 'cuenta.html'; return; } vote(V.id, pid, p.name); }; c.appendChild(bt); }
        g.appendChild(c); });
      sv.appendChild(g);
      if (!closed) { var ft = h('p', 'bo-ft'); if (!me) ft.innerHTML = 'Para apoyar necesitas tu cuenta de Magna. <a href="cuenta.html">Entrar</a>'; else if (myVote) ft.textContent = 'Apoyas a ' + MAGNA.playerName(myVote) + '. Puedes cambiar tu apoyo hasta el cierre.'; else ft.textContent = 'Un apoyo por cuenta. El conteo se revela al final y el ganador lo decide la organización.'; sv.appendChild(ft); }
    }

    // ---------- palmarés ----------
    var sp = sec('Palmarés', L.length ? L.length + (L.length === 1 ? ' edición' : ' ediciones') : '');
    if (!L.length) { sp.appendChild(h('div', 'bo-e', 'El primer Balón de Oro está por definirse.')); return; }
    var b0 = L[0], ch = h('div', 'bo-champ'), w0 = MAGNA.ballonWho(b0, 'winner') || '—'; ch.appendChild(av(w0, b0.winner, 92));
    var ct = h('div'); ct.appendChild(h('span', 'k', 'Campeón vigente · Edición ' + (b0.ed || '—'))); var cb = h('b'); cb.appendChild(who(w0, b0.winner)); ct.appendChild(cb);
    var tm0 = teamOf(b0, 'team'); ct.appendChild(h('small', null, [tm0, b0.season, b0.votes ? b0.votes + ' apoyos' : ''].filter(Boolean).join(' · ')));
    var pd = h('div', 'bo-pod'), s2 = MAGNA.ballonWho(b0, 'second'), s3 = MAGNA.ballonWho(b0, 'third'); if (s2) pd.appendChild(h('span', null, '🥈 ' + s2)); if (s3) pd.appendChild(h('span', null, '🥉 ' + s3)); if (pd.children.length) ct.appendChild(pd);
    ch.appendChild(ct); sp.appendChild(ch);
    if (L.length > 1) { var ls = h('div', 'bo-list'); L.slice(1).forEach(function (b) { var r = h('div', 'bo-r'), ed = h('div', 'bo-ed'); ed.appendChild(h('b', null, String(b.ed || '—'))); ed.appendChild(h('small', null, b.season ? String(b.season) : 'Edición')); r.appendChild(ed);
      var wn = MAGNA.ballonWho(b, 'winner') || '—'; r.appendChild(av(wn, b.winner, 48)); var t = h('div'), wb = h('b'); wb.appendChild(who(wn, b.winner)); t.appendChild(wb);
      var sub = [teamOf(b, 'team')], q2 = MAGNA.ballonWho(b, 'second'), q3 = MAGNA.ballonWho(b, 'third'); if (q2) sub.push('🥈 ' + q2); if (q3) sub.push('🥉 ' + q3); t.appendChild(h('small', null, sub.filter(Boolean).join(' · '))); r.appendChild(t); ls.appendChild(r); }); sp.appendChild(ls); }
    // quién tiene más (solo si alguien repite)
    var cnt = {}; L.forEach(function (b) { var nm = MAGNA.ballonWho(b, 'winner'); if (!nm) return; var k = b.winner != null ? 'p' + b.winner : 'n' + nm.toLowerCase(); (cnt[k] = cnt[k] || { n: 0, name: nm, pid: b.winner }).n++; });
    var top = Object.keys(cnt).map(function (k) { return cnt[k]; }).filter(function (x) { return x.n > 1; }).sort(function (a, b) { return b.n - a.n; });
    if (top.length) { var sm = sec('Más ganadores'), mg = h('div', 'bo-most'); top.slice(0, 10).forEach(function (x) { var s = h('span'); s.appendChild(av(x.name, x.pid, 30)); s.appendChild(who(x.name, x.pid)); s.appendChild(h('em', null, '🏆 ×' + x.n)); mg.appendChild(s); }); sm.appendChild(mg); }
  }
  function vote(id, pid, name) { if (busy) return; busy = true; render();
    sb().then(function (c) { return c.rpc('ballon_vote', { p_vote: id, p_player: pid }); }).then(function (r) { busy = false; if (r && r.error) throw r.error; myVote = pid; toast('¡Apoyas a ' + name + '!'); loadTotals(); render(); }, function (e) { busy = false; toast(e.message || 'No se pudo registrar tu apoyo', true); render(); }); }
  function loadTotals() { var V = S().ballonVote; if (!V || !V.id) return; sb().then(function (c) { return c.rpc('ballon_total', { p_vote: V.id }); }).then(function (r) { if (r && !r.error) { total = Number(r.data) || 0; render(); } }, function () {}); }
  function boot() {
    render(); var V = S().ballonVote; if (!V || !V.id) return; loadTotals();
    if (window.ACCOUNTS) ACCOUNTS.me().then(function (a) { me = a; if (!a) return render(); sb().then(function (c) { return c.rpc('ballon_my_vote', { p_vote: V.id }); }).then(function (r) { myVote = r && r.data != null ? Number(r.data) : null; render(); }, function () { render(); }); }, function () {});
  }
  window.addEventListener('magna:update', function () { render(); });
  setInterval(function () { if (S().ballonVote && !busy) render(); }, 60000);
  if (document.readyState === 'complete') boot(); else addEventListener('load', boot);
})();
