'use strict';
// Ficha de un partido (partido.html?id=N): marcador, datos, alineaciones con notas, minuto a minuto y enlace para compartir.
// Se actualiza sola mientras el partido está en vivo.
(function () {
  var h = M.h, root = document.getElementById('pt'), TK = null;
  function qid() { var m = /[?&]id=(\d+)/.exec(location.search); return m ? Number(m[1]) : null; }
  function S() { return MAGNA.S; }
  function by(l, id) { return MAGNA.by(l, id); }
  function col(t) { return MAGNA.teamColor ? MAGNA.teamColor(t) : '#8b5cf6'; }
  function nm(t) { return MAGNA.teamName(t); }
  function fmtN(v) { return v == null ? '—' : String(Math.round(v * 10) / 10).replace('.', ','); }
  function comp(m) { var c = MAGNA.compOf(m); return c ? c.name : ''; }
  function toast(t) { var x = h('div', 'pt-toast', t); document.body.appendChild(x); setTimeout(function () { x.remove(); }, 2600); }
  function field(m, sd) { var L = m.live || {}, base = ((L.lineup && L.lineup[sd]) || []).slice(), all = base.slice();
    (L.ev || []).forEach(function (e) { if (e.k === 'sub' && e.side === sd) { if (e.in && all.indexOf(e.in) < 0) all.push(e.in); } });
    if (!all.length) all = S().players.filter(function (p) { return p.teamId === (sd === 'a' ? m.away : m.home); }).map(function (p) { return p.id; });
    return all; }
  function goalsOf(m, pid) { return ((m.live || {}).ev || []).filter(function (e) { return e.k === 'goal' && e.player === pid; }).length; }
  function crestLink(tid, size) { var a = h('a', 'pt-cr'); a.href = 'equipo.html?id=' + tid; a.appendChild(M.crest(tid, nm(tid), size)); return a; }

  function share(m) { var url = location.origin + location.pathname + '?id=' + m.id, txt = nm(m.home) + (m.status === 'scheduled' ? ' vs ' : ' ' + (m.hs || 0) + '-' + (m.as || 0) + ' ') + nm(m.away) + ' · Magna Arena';
    if (navigator.share) { navigator.share({ title: txt, url: url }).catch(function () {}); return; }
    function done() { toast('🔗 Enlace copiado: pégalo donde quieras'); }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(url).then(done, fb); else fb();
    function fb() { var i = h('textarea'); i.value = url; i.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(i); i.select(); var ok = false; try { ok = document.execCommand('copy'); } catch (e) {} i.remove(); if (ok) done(); else window.prompt('Copia este enlace:', url); } }

  function cardData(m) { var L = m.live || {}, R = L.ratings || {}, sch = m.status === 'scheduled' || m.status === 'cancelled', gs = {}, order = [];
    (L.ev || []).forEach(function (e) { if (e.k === 'goal') { var k = e.player ? String(e.player) : 'x' + e.side; if (!(k in gs)) { gs[k] = 0; order.push(k); } gs[k]++; } });
    var scorers = order.map(function (k) { var n = k.charAt(0) === 'x' ? 'Gol de ' + nm(k === 'xa' ? m.away : m.home) : (MAGNA.playerName(Number(k)) || 'Jugador'); return n + (gs[k] > 1 ? ' x' + gs[k] : ''); });
    var best = Object.keys(R).sort(function (a, b) { return R[b] - R[a]; })[0], P = null; if (sch && MAGNA.matchPreview) try { P = MAGNA.matchPreview(m); } catch (e) {}
    var ss = m.sets && m.sets.length ? MAGNA.setScore(m) : null;
    return { name: nm(m.home) + '-vs-' + nm(m.away), kicker: sch ? 'PRÓXIMO PARTIDO' : m.status === 'live' ? 'EN VIVO' : 'RESULTADO', comp: comp(m) + (m.round ? ' · ' + m.round : ''), status: m.status === 'live' ? '● EN VIVO' : sch ? 'POR JUGAR' : 'FINAL',
      live: m.status === 'live', scheduled: sch, when: m.at ? M.fdt(m.at) : null, prob: P ? (P.p >= .5 ? nm(m.home) + ' ' + Math.round(P.p * 100) + '%' : nm(m.away) + ' ' + Math.round((1 - P.p) * 100) + '%') : null,
      home: { name: nm(m.home), color: col(m.home), crest: MAGNA.crestUrl(m.home) }, away: { name: nm(m.away), color: col(m.away), crest: MAGNA.crestUrl(m.away) }, hs: m.hs || 0, as: m.as || 0,
      mvp: L.mvp ? MAGNA.playerName(L.mvp) : null, best: best != null ? (MAGNA.playerName(Number(best)) || '—') + ' ' + fmtN(R[best]) : null, sets: ss ? ss.h + '-' + ss.a : null, scorers: scorers, winner: m.status === 'finished' && m.hs !== m.as ? nm(m.hs > m.as ? m.home : m.away) : null }; }
  function hero(m) {
    var L = m.live || {}, live = m.status === 'live', fin = m.status === 'finished', s = h('section', 'pt-h' + (live ? ' lv' : ''));
    s.style.setProperty('--hc', col(m.home)); s.style.setProperty('--ac', col(m.away));
    var top = h('div', 'pt-top'); top.appendChild(h('span', 'pt-cp', comp(m) + (m.round ? ' · ' + m.round : '')));
    top.appendChild(h('span', 'pt-st ' + m.status, live ? '● En vivo · ' + (MAGNA.PHASES[L.phase] || '') : fin ? 'Final' : m.status === 'cancelled' ? 'Cancelado' : 'Por jugar')); s.appendChild(top);
    var sb = h('div', 'pt-sb'), W = fin && m.hs !== m.as ? (m.hs > m.as ? 'h' : 'a') : null;
    [['h', m.home], null, ['a', m.away]].forEach(function (x) {
      if (!x) { var mid = h('div', 'pt-mid');
        if (m.status === 'scheduled' || m.status === 'cancelled') { mid.appendChild(h('b', 'pt-vs', 'VS')); mid.appendChild(h('small', null, m.at ? M.fdt(m.at) : 'Fecha por definir')); }
        else { var sc = h('b', 'pt-sc'); sc.appendChild(h('span', W === 'h' ? 'w' : null, String(m.hs || 0))); sc.appendChild(h('i', null, '-')); sc.appendChild(h('span', W === 'a' ? 'w' : null, String(m.as || 0))); mid.appendChild(sc);
          var ck = h('small', 'pt-ck', live ? MAGNA.liveClock(m) + " · min " + MAGNA.liveMinute(m) : (m.at ? M.fdt(m.at) : '')); mid.appendChild(ck);
          if (live && L.clock && L.clock.run) { clearInterval(TK); TK = setInterval(function () { if (!document.body.contains(ck)) return clearInterval(TK); ck.textContent = MAGNA.liveClock(m) + ' · min ' + MAGNA.liveMinute(m); }, 1000); } }
        if (m.sets && m.sets.length) { var ss = MAGNA.setScore(m); mid.appendChild(h('em', 'pt-sets', 'Sets ' + ss.h + ' - ' + ss.a)); }
        sb.appendChild(mid); return; }
      var t = h('div', 'pt-t ' + x[0] + (W === x[0] ? ' win' : '')); t.appendChild(crestLink(x[1], 84)); var a = h('a', 'pt-tn'); a.href = 'equipo.html?id=' + x[1]; a.textContent = nm(x[1]); t.appendChild(a);
      t.appendChild(h('small', null, x[0] === 'h' ? 'Local' : 'Visitante')); if (W === x[0]) t.appendChild(h('span', 'pt-wb', '🏆 Ganador')); sb.appendChild(t); });
    s.appendChild(sb);
    var ac = h('div', 'pt-ac'), sh = h('button', 'pt-b o', '🔗 Compartir partido'); sh.type = 'button'; sh.onclick = function () { share(m); }; ac.appendChild(sh); if (window.SHARE_CARD) { var im = h('button', 'pt-b y', '📸 Imagen del partido'); im.type = 'button'; im.onclick = function () { SHARE_CARD.open('match', function () { return cardData(m); }); }; ac.appendChild(im); }
    if (live) { var lv = h('a', 'pt-b r', '📺 Ver en vivo'); lv.href = 'index.html?m=' + m.id; ac.appendChild(lv); }
    if (m.status === 'scheduled') { var ap = h('a', 'pt-b', '🎲 Apostar'); ap.href = 'apuestas.html'; ac.appendChild(ap); }
    var cal = h('a', 'pt-b', '📅 Calendario'); cal.href = 'calendario.html'; ac.appendChild(cal); s.appendChild(ac);
    return s; }

  // datos principales del partido
  function facts(m) {
    var L = m.live || {}, R = L.ratings || {}, ev = L.ev || [], w = h('section', 'pt-s');
    w.appendChild(h('h2', 'x', '📊 Los números'));
    var st = {}; ['h', 'a'].forEach(function (sd) { var ids = field(m, sd), rs = ids.map(function (id) { return R[id]; }).filter(function (v) { return v != null; });
      st[sd] = { g: sd === 'h' ? (m.hs || 0) : (m.as || 0), sub: ev.filter(function (e) { return e.k === 'sub' && e.side === sd; }).length, n: rs.length ? rs.reduce(function (a, b) { return a + b; }, 0) / rs.length : null,
        top: ids.map(function (id) { return [id, R[id]]; }).filter(function (x) { return x[1] != null; }).sort(function (a, b) { return b[1] - a[1]; })[0] }; });
    var rows = [['Goles', st.h.g, st.a.g, String], ['Nota media', st.h.n, st.a.n, fmtN], ['Cambios', st.h.sub, st.a.sub, String]];
    if (m.sets && m.sets.length) { var ss = MAGNA.setScore(m); rows.unshift(['Sets ganados', ss.h, ss.a, String]); }
    var tb = h('div', 'pt-st2'); tb.style.setProperty('--hc', col(m.home)); tb.style.setProperty('--ac', col(m.away));
    rows.forEach(function (r) { var a = Number(r[1]) || 0, b = Number(r[2]) || 0, tot = a + b, x = h('div', 'pt-r');
      x.appendChild(h('b', a > b ? 'w' : null, r[1] == null ? '—' : r[3](r[1]))); var md = h('div', 'pt-bar'); md.appendChild(h('small', null, r[0])); var tr = h('div', 'tr'), l = h('i', 'l'), rr = h('i', 'r'); l.style.width = (tot ? a / tot * 100 : 50) + '%'; rr.style.width = (tot ? b / tot * 100 : 50) + '%'; tr.appendChild(l); tr.appendChild(rr); md.appendChild(tr); x.appendChild(md);
      x.appendChild(h('b', b > a ? 'w' : null, r[2] == null ? '—' : r[3](r[2]))); tb.appendChild(x); });
    w.appendChild(tb);
    var hl = h('div', 'pt-hl');
    if (L.mvp) { var mv = h('div', 'pt-hc mvp'); mv.appendChild(h('span', 'e', '⭐')); var t1 = h('div'); t1.appendChild(h('small', null, 'MVP del partido')); var b1 = h('b'); b1.appendChild(M.pn(MAGNA.playerName(L.mvp) || 'Jugador', L.mvp)); t1.appendChild(b1); mv.appendChild(t1); hl.appendChild(mv); }
    var gs = {}; ev.forEach(function (e) { if (e.k === 'goal' && e.player) gs[e.player] = (gs[e.player] || 0) + 1; }); var tops = Object.keys(gs).sort(function (a, b) { return gs[b] - gs[a]; }).map(Number);
    if (tops.length) { var gg = h('div', 'pt-hc gol'); gg.appendChild(h('span', 'e', '⚽')); var t2 = h('div'); t2.appendChild(h('small', null, 'Goleadores')); t2.appendChild(h('b', null, tops.map(function (id) { return (MAGNA.playerName(id) || '—') + (gs[id] > 1 ? ' x' + gs[id] : ''); }).join(', '))); gg.appendChild(t2); hl.appendChild(gg); }
    var best = ['h', 'a'].map(function (sd) { return st[sd].top; }).filter(Boolean).sort(function (a, b) { return b[1] - a[1]; })[0];
    if (best) { var bn = h('div', 'pt-hc nota'); bn.appendChild(h('span', 'e', '📈')); var t3 = h('div'); t3.appendChild(h('small', null, 'Mejor nota')); t3.appendChild(h('b', null, (MAGNA.playerName(best[0]) || '—') + ' · ' + fmtN(best[1]))); bn.appendChild(t3); hl.appendChild(bn); }
    if (L.judged) { var jd = h('div', 'pt-hc juez'); jd.appendChild(h('span', 'e', '⚖️')); var t4 = h('div'); t4.appendChild(h('small', null, 'Juez del partido')); t4.appendChild(h('b', null, L.judged.by || 'Juez')); jd.appendChild(t4); hl.appendChild(jd); }
    if (L.mode && !(m.sets && m.sets.length)) { var md2 = h('div', 'pt-hc modo'); md2.appendChild(h('span', 'e', '🎮')); var t5 = h('div'); t5.appendChild(h('small', null, 'Modo de juego')); t5.appendChild(h('b', null, L.mode + (L.map ? ' · ' + L.map : ''))); md2.appendChild(t5); hl.appendChild(md2); }
    if (hl.children.length) w.appendChild(hl);
    return w; }

  function sets(m) { if (!m.sets || !m.sets.length) return null; var w = h('section', 'pt-s'); w.appendChild(h('h2', 'x', '🎮 Sets'));
    var g = h('div', 'pt-sl'); m.sets.forEach(function (x, i) { var r = h('div', 'pt-set' + (x.w ? ' done' : '')); r.style.setProperty('--mc', (MAGNA.MODE_COLOR || {})[x.mode] || '#555b75'); r.appendChild(h('b', null, 'Set ' + (i + 1))); r.appendChild(h('span', null, MAGNA.setLabel(x))); r.appendChild(h('em', null, x.w ? '✓ ' + nm(x.w === 'h' ? m.home : m.away) : 'Por jugar')); g.appendChild(r); });
    w.appendChild(g); return w; }

  function lineups(m) { var L = m.live || {}, R = L.ratings || {}, w = h('section', 'pt-s'); w.appendChild(h('h2', 'x', '👥 Alineaciones y notas'));
    var g = h('div', 'pt-lu'); ['h', 'a'].forEach(function (sd) { var tid = sd === 'a' ? m.away : m.home, c = h('div', 'pt-lc'); c.style.setProperty('--tc', col(tid)); var hd = h('div', 'pt-lh'); hd.appendChild(M.crest(tid, nm(tid), 30)); hd.appendChild(h('b', null, nm(tid))); c.appendChild(hd);
      var start = ((L.lineup && L.lineup[sd]) || []), ids = field(m, sd);
      if (!ids.length) c.appendChild(h('p', 'em', 'Sin jugadores registrados.'));
      ids.forEach(function (pid) { var p = by(S().players, pid); if (!p) return; var r = h('div', 'pt-pl'), v = R[pid], g2 = goalsOf(m, pid);
        r.appendChild(M.tierAv(p.name, (MAGNA.playerStats()[p.id] || {}).media, 34, p.id)); var tx = h('div', 'tx'), nb = h('b'); nb.appendChild(M.pn(p.name, p.id)); tx.appendChild(nb);
        var tags = []; if (start.length && start.indexOf(pid) < 0) tags.push('Entró de cambio'); if (g2) tags.push('⚽ ' + g2); if (String(L.mvp) === String(pid)) tags.push('⭐ MVP'); tx.appendChild(h('small', null, tags.join(' · ') || (start.indexOf(pid) >= 0 ? 'Titular' : 'Plantilla'))); r.appendChild(tx);
        r.appendChild(h('span', 'pt-nt' + (v == null ? ' e' : v >= 8 ? ' hi' : v < 5 ? ' lo' : ''), v == null ? '—' : fmtN(v))); c.appendChild(r); });
      g.appendChild(c); }); w.appendChild(g); return w; }

  function timeline(m) { var ev = ((m.live || {}).ev || []).slice().reverse(), w = h('section', 'pt-s'); w.appendChild(h('h2', 'x', '⏱️ Minuto a minuto'));
    if (!ev.length) { w.appendChild(h('p', 'em', m.status === 'scheduled' ? 'Cuando empiece el partido, aquí aparece cada jugada.' : 'Este partido no se narró en vivo.')); return w; }
    var ICO = { start: '▶', goal: '⚽', mode: '🎮', set: '✔', sub: '⇄', ht: '⏸', resume: '▶', end: '🏁', note: '💬' }, tl = h('div', 'pt-tl');
    ev.forEach(function (e) { var r = h('div', 'pt-ev k-' + e.k); if (e.side) r.style.setProperty('--tc', col(e.side === 'a' ? m.away : m.home)); r.appendChild(h('span', 'pm', e.min ? e.min + "'" : '')); r.appendChild(h('span', 'ic', ICO[e.k] || '•')); r.appendChild(h('span', 'tx', MAGNA.eventText(m, e))); tl.appendChild(r); });
    w.appendChild(tl); return w; }

  // antes del partido: probabilidad, forma, cara a cara y puestos
  function preview(m) { if (!MAGNA.matchPreview) return null; var P; try { P = MAGNA.matchPreview(m); } catch (e) { return null; }
    var w = h('section', 'pt-s'); w.appendChild(h('h2', 'x', '🔮 Antes del partido'));
    var pb = h('div', 'pt-pr'); pb.style.setProperty('--hc', col(m.home)); pb.style.setProperty('--ac', col(m.away)); var ph = Math.round(P.p * 100);
    pb.appendChild(h('b', null, ph + '%')); var tr = h('div', 'tr'), l = h('i', 'l'), r = h('i', 'r'); l.style.width = ph + '%'; r.style.width = (100 - ph) + '%'; tr.appendChild(l); tr.appendChild(r); pb.appendChild(tr); pb.appendChild(h('b', null, (100 - ph) + '%')); w.appendChild(pb);
    w.appendChild(h('p', 'em pt-c', 'Probabilidad de ganar según nivel, forma, cara a cara y puntos del ranking.'));
    var g = h('div', 'pt-pv'); [['Puesto en el ranking', '#' + P.pos.h, '#' + P.pos.a], ['Nivel', P.level.h, P.level.a], ['Últimos 5', P.form.h.s || '—', P.form.a.s || '—'], ['Cara a cara', P.h2h.h + ' victorias', P.h2h.a + ' victorias']].forEach(function (x) { var r2 = h('div', 'pt-r'); r2.appendChild(h('b', null, String(x[1]))); r2.appendChild(h('small', null, x[0])); r2.appendChild(h('b', null, String(x[2]))); g.appendChild(r2); });
    w.appendChild(g); return w; }

  function others(m) { var L = S().matches.filter(function (x) { return x.id !== m.id && x.status !== 'cancelled' && (x.home === m.home || x.away === m.home || x.home === m.away || x.away === m.away); })
      .sort(function (a, b) { return String(b.at || '').localeCompare(String(a.at || '')); }).slice(0, 6);
    if (!L.length) return null; var w = h('section', 'pt-s'); w.appendChild(h('h2', 'x', '📁 Otros partidos de estos equipos')); var g = h('div', 'pt-ot');
    L.forEach(function (x) { var a = h('a', 'pt-om'); a.href = 'partido.html?id=' + x.id; a.appendChild(M.crest(x.home, nm(x.home), 26)); a.appendChild(h('b', null, x.status === 'scheduled' ? 'vs' : (x.hs || 0) + '-' + (x.as || 0))); a.appendChild(M.crest(x.away, nm(x.away), 26)); var t = h('span'); t.appendChild(h('em', null, nm(x.home) + ' vs ' + nm(x.away))); t.appendChild(h('small', null, x.status === 'live' ? '● En vivo' : x.at ? M.fdt(x.at) : 'Sin fecha')); a.appendChild(t); g.appendChild(a); });
    w.appendChild(g); return w; }

  function render() {
    var id = qid(), m = id != null && by(S().matches, id); root.innerHTML = '';
    if (!m) { var e = h('div', 'pt-emp'); e.appendChild(h('h1', 'x', 'No encontramos ese partido')); e.appendChild(h('p', 'em', 'Puede que se haya borrado o que el enlace esté incompleto.')); var a = h('a', 'pt-b o', 'Ir al calendario'); a.href = 'calendario.html'; e.appendChild(a); root.appendChild(e); return; }
    document.title = nm(m.home) + ' vs ' + nm(m.away) + ' · Magna Arena';
    root.appendChild(hero(m));
    var played = m.status === 'live' || m.status === 'finished';
    if (played) { root.appendChild(facts(m)); var st = sets(m); if (st) root.appendChild(st); root.appendChild(lineups(m)); root.appendChild(timeline(m)); }
    else { var pv = preview(m); if (pv) root.appendChild(pv); var st2 = sets(m); if (st2) root.appendChild(st2); root.appendChild(timeline(m)); }
    var ot = others(m); if (ot) root.appendChild(ot);
  }
  var rt = null; window.addEventListener('magna:update', function () { clearTimeout(rt); rt = setTimeout(render, 250); });
  window.addEventListener('popstate', render);
  root.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('a.pt-om'); if (!a || e.metaKey || e.ctrlKey) return; e.preventDefault(); history.pushState(null, '', a.getAttribute('href')); render(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  render();
})();
