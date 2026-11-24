'use strict';
// Página de cada equipo (equipo.html?id=<id>): perfil tipo app con portada, seguir, jugadores, partidos, estadísticas y vitrina.
(function () {
  var h = M.h, S = MAGNA.S, by = MAGNA.by, root = document.getElementById('eq'), MV = null, EXP = false, FOL = null;
  function q(k) { var m = new RegExp('[?&]' + k + '=([^&#]*)').exec(location.search); return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : null; }
  function findTeam() { var id = Number(q('id')), n = q('n'), t = id ? by(S.teams, id) : null; if (!t && n) t = S.teams.filter(function (x) { return x.name.toLowerCase() === n.toLowerCase(); })[0]; return t; }
  function byTime(a, b) { return String(a.at || '').localeCompare(String(b.at || '')) || a.id - b.id; }
  function crest(id, size) { return M.crest(id, MAGNA.teamName(id), size); }
  function won(m, tid) { return m.home === tid ? m.hs > m.as : m.as > m.hs; }
  function fmt(n) { return String(Math.round(Number(n || 0))).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function when(at) { return at ? new Date(String(at).replace(' ', 'T') + (/[zZ]|[+-]\d\d:?\d\d$/.test(at) ? '' : 'Z')).getTime() : NaN; }
  function fday(at) { var d = when(at); if (isNaN(d)) return 'Sin fecha'; try { return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' }).format(new Date(d)); } catch (e) { return M.fdt(at); } }
  function left(at) { var d = when(at) - Date.now(); if (isNaN(d)) return 'Por programar'; if (d <= 0) return 'Ya empieza'; var mn = Math.floor(d / 6e4), hh = Math.floor(mn / 60), dd = Math.floor(hh / 24); return dd ? 'En ' + dd + ' d ' + hh % 24 + ' h' : hh ? 'En ' + hh + ' h ' + mn % 60 + ' min' : 'En ' + Math.max(1, mn) + ' min'; }
  function sec(title, right) { var s = h('section', 'tp-sc'), hd = h('div', 'tp-sh'); hd.appendChild(h('h2', null, title)); if (right) hd.appendChild(h('small', null, right)); s.appendChild(hd); root.appendChild(s); return s; }
  function copyTxt(t, ok) { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, function () {}); }

  function render() {
    S = MAGNA.S; root.innerHTML = ''; var t = findTeam();
    if (!t) { var nf = h('div', 'tp-nf'); nf.appendChild(h('h1', null, 'Equipo no encontrado')); var a0 = h('a', 'tp-more', 'Ver todos los equipos'); a0.href = 'equipos.html'; a0.style.display = 'inline-block'; a0.style.textDecoration = 'none'; nf.appendChild(a0); root.appendChild(nf); return; }
    document.title = 'Magna Arena · ' + t.name; var tc = MAGNA.teamColor(t.id); document.body.style.setProperty('--tc', tc);
    var PT = MAGNA.teamPoints(), PS = MAGNA.playerStats();
    var R = S.teams.map(function (x) { return { id: x.id, pts: (PT[x.id] || {}).pts || 0 }; }).sort(function (a, b) { return b.pts - a.pts; });
    var pos = R.map(function (x) { return x.id; }).indexOf(t.id) + 1, bd = PT[t.id] || {}, tro = MAGNA.teamTrophies(t.id);
    var all = S.matches.filter(function (m) { return (m.home === t.id || m.away === t.id) && m.status !== 'cancelled'; }).sort(byTime);
    var mine = all.filter(function (m) { return m.status === 'finished' && m.hs != null && m.as != null; }), w = mine.filter(function (m) { return won(m, t.id); }).length, l = mine.length - w;
    var live = all.filter(function (m) { return m.status === 'live'; })[0], next = all.filter(function (m) { return m.status === 'scheduled'; });
    var squad = S.players.filter(function (p) { return p.teamId === t.id && MAGNA.plays(p); }).sort(function (a, b) { return (a.slot === 'starter' ? 0 : 1) - (b.slot === 'starter' ? 0 : 1) || a.name.localeCompare(b.name); });
    var coach = by(S.players, t.coach), tierN = t.level ? ((MAGNA.TIERS[MAGNA.tierRank(t.level)] || [])[1] || t.level) : null;
    var comps = S.leagues.filter(function (c) { return c.teamIds.indexOf(t.id) >= 0; }).map(function (c) { return { c: c, k: 'league' }; }).concat(S.tournaments.filter(function (c) { return c.teamIds.indexOf(t.id) >= 0 && c.status !== 'draft'; }).map(function (c) { return { c: c, k: 'tournament' }; }));

    // ---------- portada + cabecera ----------
    var cv = h('div', 'tp-cv'); cv.appendChild(h('div', 'tp-wm', t.name)); if (window.TEAM_BANNER && t.banner) TEAM_BANNER.cover(cv, t);
    var cvb = h('div', 'tp-cvb'), bk = h('a', 'tp-ib', '‹ Equipos'); bk.href = 'equipos.html'; cvb.appendChild(bk);
    var sh = h('button', 'tp-ib', 'Compartir'); sh.type = 'button'; sh.onclick = function () { var u = location.origin + location.pathname + '?id=' + t.id; if (navigator.share) navigator.share({ title: t.name + ' · Magna Arena', url: u }).catch(function () {}); else copyTxt(u, function () { sh.textContent = '¡Enlace copiado!'; setTimeout(function () { sh.textContent = 'Compartir'; }, 1600); }); };
    cvb.appendChild(sh); cv.appendChild(cvb); root.appendChild(cv);
    var hd = h('div', 'tp-hd'), av = h('div', 'tp-av'); av.appendChild(crest(t.id, 112)); hd.appendChild(av);
    var nm = h('div', 'tp-nm'); var h1 = h('h1', null, t.name), vf = h('span', 'tp-vf'); vf.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#2ee59d" d="M12 1.5l2.6 1.9 3.2-.2 1 3.1 2.6 1.9-1 3.1 1 3.1-2.6 1.9-1 3.1-3.2-.2L12 22.5l-2.6-1.9-3.2.2-1-3.1L2.6 15.8l1-3.1-1-3.1 2.6-1.9 1-3.1 3.2.2z"/><path d="M7.5 12.3l3 3 6-6.2" fill="none" stroke="#04140d" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'; vf.title = 'Equipo verificado'; vf.setAttribute('aria-label', 'Equipo verificado'); h1.appendChild(vf); nm.appendChild(h1); nm.appendChild(h('p', null, [coach ? 'DT ' + coach.name : 'Sin DT'].concat(tierN ? ['Fichajes ' + tierN] : []).join(' · '))); hd.appendChild(nm);
    var fl = h('button', 'tp-fl'); fl.type = 'button'; fl.appendChild(h('span', null, '+ Seguir')); fl.appendChild(h('small', null, '')); hd.appendChild(fl); root.appendChild(hd);
    var msg = h('p', 'tp-ms'); root.appendChild(msg);
    var ag = 'team:' + t.id;
    function paint() { var f = (FOL || {})[ag] || { n: 0, mine: false }; fl.classList.toggle('on', !!f.mine); fl.firstChild.textContent = f.mine ? '✓ Siguiendo' : '+ Seguir'; fl.lastChild.textContent = f.n === 1 ? '1 seguidor' : (f.n || 0) + ' seguidores'; }
    paint();
    fl.onclick = function () { if (!window.NEWS || !NEWS.follow) return; var f = (FOL = FOL || {})[ag] || { n: 0, mine: false }, on = !f.mine; fl.disabled = true;
      NEWS.follow(ag, on).then(function () { FOL[ag] = { n: Math.max(0, (f.n || 0) + (on ? 1 : -1)), mine: on }; paint(); msg.textContent = on ? 'Te avisaremos cuando ' + t.name + ' publique algo nuevo.' : ''; },
        function () { msg.textContent = 'Inicia sesión para seguir a ' + t.name + '.'; }).then(function () { fl.disabled = false; }); };

    // números
    var st = h('div', 'tp-st'); [[pos ? '#' + pos : '—', 'Ranking'], [w, 'Victorias'], [l, 'Derrotas'], [tro.length, tro.length === 1 ? 'Trofeo' : 'Trofeos']].forEach(function (x) { var d = h('div'); d.appendChild(h('b', null, String(x[0]))); d.appendChild(h('span', null, x[1])); st.appendChild(d); }); root.appendChild(st);

    // competiciones como "destacadas"
    if (comps.length) { var hl = h('div', 'tp-hl'), COLS = ['#b18cff', '#22d3ee', '#ff8a3d', '#2ee59d', '#ffd23f', '#ff4fa3'];
      comps.forEach(function (x, i) { var c = x.c, a = h('a', 'tp-h' + (c.status === 'active' ? '' : ' off')), pz = null; a.href = x.k === 'league' ? 'ligas.html' : 'torneos.html'; a.style.setProperty('--c', COLS[i % COLS.length]);
        if (x.k === 'league') try { MAGNA.standings(Object.assign({ kind: 'league' }, c)).forEach(function (r0) { if (r0.team_id === t.id) pz = r0.pos; }); } catch (e) {}
        a.appendChild(h('i', null, String(c.name).replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ0-9 ]/g, '').split(/\s+/).filter(Boolean).slice(0, 2).map(function (s) { return s[0]; }).join('').toUpperCase()));
        a.appendChild(h('b', null, c.name)); a.appendChild(h('small', null, pz ? 'Puesto #' + pz : c.status === 'active' ? 'En juego' : 'Terminado')); a.title = c.name; hl.appendChild(a); });
      root.appendChild(hl); }

    // ---------- jugadores ----------
    var js = sec('Jugadores', squad.length + (squad.length === 1 ? ' jugador' : ' jugadores') + ' · desliza →'), pl = h('div', 'tp-pl');
    function pcard(p, role, dt) { var a = h('a', 'tp-p' + (dt ? ' dt' : '')); a.href = 'jugador.html?id=' + p.id; var pa = h('span', 'tp-pa', String(p.name || '?').slice(0, 2).toUpperCase()); if (M.photo) M.photo(pa, p.id); a.appendChild(pa);
      var md = (PS[p.id] || {}).media; if (md != null && !dt) a.appendChild(h('em', null, String(Math.round(md)))); a.appendChild(h('b', null, p.name)); a.appendChild(h('small', null, role)); return a; }
    squad.forEach(function (p) { pl.appendChild(pcard(p, p.id === t.coach ? 'Jugador · DT' : p.slot === 'starter' ? 'Titular' : 'Suplente')); });
    if (coach && squad.indexOf(coach) < 0) pl.appendChild(pcard(coach, 'Director técnico', true));
    if (!pl.children.length) js.appendChild(h('p', 'tp-e', 'Este equipo todavía no tiene jugadores.')); else js.appendChild(pl);

    // ---------- partidos ----------
    var played = mine.slice().reverse(), ms = sec('Partidos', mine.length + ' jugados'), mt = h('div', 'tp-mt');
    function row(m, kind) { var hm = m.home === t.id, op = hm ? m.away : m.home, b = h('button', 'tp-m ' + kind); b.type = 'button';
      var A = h('div', 'tp-t'); A.appendChild(crest(t.id, 30)); A.appendChild(h('b', null, t.name)); var B = h('div', 'tp-t r'); B.appendChild(crest(op, 30)); B.appendChild(h('b', null, MAGNA.teamName(op)));
      var mid = h('div', 'tp-sx'), c = MAGNA.compOf(m);
      if (kind === 'nx') { mid.appendChild(h('strong', null, 'VS')); mid.appendChild(h('small', null, left(m.at))); }
      else { mid.appendChild(h('strong', null, (hm ? m.hs || 0 : m.as || 0) + ' - ' + (hm ? m.as || 0 : m.hs || 0))); mid.appendChild(h('small', null, kind === 'lv' ? '● En vivo' : fday(m.at))); }
      b.appendChild(A); b.appendChild(mid); b.appendChild(B); b.appendChild(h('span', 'tp-go', kind === 'nx' ? (c ? c.name : 'Partido') : '▶ Ver')); b.title = (c ? c.name + ' · ' : '') + (m.round || ''); b.onclick = function () { openMatch(m.id); }; return b; }
    if (live) mt.appendChild(row(live, 'lv'));
    // por defecto solo lo más reciente; el resto aparece con "Ver más"
    var nN = EXP ? next.length : (live ? 0 : 1), pN = EXP ? played.length : (live || next.length ? 1 : 2), hid = Math.max(0, next.length - nN) + Math.max(0, played.length - pN);
    next.slice(0, nN).forEach(function (m) { mt.appendChild(row(m, 'nx')); });
    played.slice(0, pN).forEach(function (m) { mt.appendChild(row(m, won(m, t.id) ? 'w' : 'l')); });
    if (!mt.children.length) ms.appendChild(h('p', 'tp-e', 'Todavía no tiene partidos.')); else ms.appendChild(mt);
    if (hid || EXP) { var mo = h('button', 'tp-more', EXP ? 'Ver menos' : 'Ver más partidos (' + hid + ')'); mo.type = 'button'; mo.onclick = function () { EXP = !EXP; var y = scrollY; render(); scrollTo(0, y); }; ms.appendChild(mo); }

    // ---------- estadísticas ----------
    var es = sec('Estadísticas'), gr = h('div', 'tp-gr'), gf = 0, gc = 0; mine.forEach(function (m) { var hm = m.home === t.id; gf += hm ? m.hs : m.as; gc += hm ? m.as : m.hs; });
    var rs = 0, rw = mine.length ? won(mine[mine.length - 1], t.id) : null; for (var k = mine.length - 1; k >= 0 && won(mine[k], t.id) === rw; k--) rs++;
    function g(v, lb) { var d = h('div', 'tp-g'); d.appendChild(h('b', null, String(v))); d.appendChild(h('span', null, lb)); gr.appendChild(d); return d; }
    g(mine.length ? Math.round(w / mine.length * 100) + '%' : '—', 'Victorias'); g(fmt(bd.pts || 0), 'Puntos de ranking'); g(mine.length, 'Partidos jugados'); g(gf, 'Goles a favor'); g(gc, 'Goles en contra');
    var fd = g(rs >= 2 ? rs + (rw ? ' 🔥' : ' 🧊') : '—', rs >= 2 ? (rw ? 'Victorias seguidas' : 'Derrotas seguidas') : 'Sin racha'), fm = h('div', 'tp-fm'), L5 = mine.slice(-5);
    for (var e = 0; e < 5 - L5.length; e++) fm.appendChild(h('i', 'e', '·')); L5.forEach(function (m) { fm.appendChild(h('i', won(m, t.id) ? '' : 'l', won(m, t.id) ? 'V' : 'D')); }); fd.appendChild(fm);
    es.appendChild(gr);
    if (comps.length) { var cp = h('div', 'tp-cp'); comps.forEach(function (x, i) { var c = x.c, a = h('a', 'tp-c'), pz = null, gm = mine.filter(function (m) { var cm = MAGNA.compOf(m); return cm && cm.id === c.id && cm.name === c.name; }), gw = gm.filter(function (m) { return won(m, t.id); }).length;
        if (x.k === 'league') try { MAGNA.standings(Object.assign({ kind: 'league' }, c)).forEach(function (r0) { if (r0.team_id === t.id) pz = r0.pos; }); } catch (er) {}
        a.href = x.k === 'league' ? 'ligas.html' : 'torneos.html'; a.style.setProperty('--c', c.status === 'active' ? 'var(--lime)' : 'var(--mut)'); a.appendChild(h('i')); a.appendChild(h('b', null, c.name));
        a.appendChild(h('span', null, [pz ? 'Puesto #' + pz : null, gm.length ? gw + 'V · ' + (gm.length - gw) + 'D' : null, c.status === 'active' ? 'En juego' : 'Terminado'].filter(Boolean).join(' · '))); cp.appendChild(a); }); es.appendChild(cp); }

    // ---------- vitrina (sin imágenes) ----------
    var vs = sec('Vitrina', tro.length ? tro.length + (tro.length === 1 ? ' trofeo' : ' trofeos') : '');
    if (tro.length) { var tw = h('div', 'tp-tr'); MAGNA.groupTrophies(tro).forEach(function (gp) { var s = h('span'); s.appendChild(document.createTextNode((MAGNA.TROPHY_ICON[gp.cat] || '🏆') + ' ' + gp.name)); if (gp.n > 1) s.appendChild(h('em', null, '×' + gp.n)); tw.appendChild(s); }); vs.appendChild(tw); }
    else vs.appendChild(h('p', 'tp-e', 'La vitrina espera su primer trofeo.'));
  }

  // ---------- visor de un partido (marcador y alineación como en la página principal) ----------
  function openMatch(id) { var t = findTeam(), list = S.matches.filter(function (m) { return t && (m.home === t.id || m.away === t.id) && m.status !== 'cancelled'; }).sort(byTime), ix = list.map(function (m) { return m.id; }).indexOf(id);
    if (!MV) { MV = h('div', 'mvw'); MV.setAttribute('role', 'dialog'); MV.setAttribute('aria-modal', 'true'); MV.innerHTML = '<div class="mvw-bg"></div><div class="mvw-in"><div class="mvw-h"><button type="button" class="mvw-ar p" aria-label="Partido anterior">‹</button><div class="mvw-t"><b></b><small></small></div><button type="button" class="mvw-ar n" aria-label="Partido siguiente">›</button><a class="mvw-f" target="_self">Ficha</a><button type="button" class="mvw-x" aria-label="Cerrar">✕</button></div><div class="mvw-ld">Cargando el partido…</div><iframe class="mvw-if" title="Partido" loading="eager"></iframe></div>';
      document.body.appendChild(MV); MV.querySelector('.mvw-bg').onclick = closeMatch; MV.querySelector('.mvw-x').onclick = closeMatch;
      addEventListener('keydown', function (e) { if (!MV.classList.contains('on')) return; if (e.key === 'Escape') closeMatch(); if (e.key === 'ArrowLeft') MV.querySelector('.mvw-ar.p').click(); if (e.key === 'ArrowRight') MV.querySelector('.mvw-ar.n').click(); });
      addEventListener('message', function (e) { var d = e.data; if (!d || typeof d.magnaEmbed !== 'number' || !MV) return; var f = MV.querySelector('.mvw-if'); if (e.source !== f.contentWindow) return; f.style.height = Math.max(300, d.magnaEmbed) + 'px'; MV.querySelector('.mvw-ld').hidden = true; }); }
    var m = by(S.matches, id); if (!m) return; var f = MV.querySelector('.mvw-if'), c = MAGNA.compOf(m);
    MV.querySelector('.mvw-t b').textContent = MAGNA.teamName(m.home) + ' vs ' + MAGNA.teamName(m.away);
    MV.querySelector('.mvw-t small').textContent = [(c ? c.name : 'Partido'), m.round, m.at ? M.fdt(m.at) : ''].filter(Boolean).join(' · ');
    MV.querySelector('.mvw-f').href = 'partido.html?id=' + m.id; MV.querySelector('.mvw-ld').hidden = false; f.style.height = '70vh'; f.src = 'index.html?m=' + m.id + '&embed=1';
    var pv = MV.querySelector('.mvw-ar.p'), nx = MV.querySelector('.mvw-ar.n'); pv.disabled = ix <= 0; nx.disabled = ix < 0 || ix >= list.length - 1;
    pv.onclick = function () { if (ix > 0) openMatch(list[ix - 1].id); }; nx.onclick = function () { if (ix >= 0 && ix < list.length - 1) openMatch(list[ix + 1].id); };
    MV.classList.add('on'); document.documentElement.style.overflow = 'hidden'; }
  function closeMatch() { if (!MV) return; MV.classList.remove('on'); document.documentElement.style.overflow = ''; MV.querySelector('.mvw-if').src = 'about:blank'; }

  render();
  function loadFollows() { if (!window.NEWS || !NEWS.follows) return; NEWS.follows().then(function (o) { FOL = o || {}; render(); }); }
  if (document.readyState === 'complete') loadFollows(); else addEventListener('load', loadFollows);
  var dT = null; window.addEventListener('magna:update', function () { clearTimeout(dT); dT = setTimeout(render, 250); });
  setInterval(function () { if (!MV || !MV.classList.contains('on')) render(); }, 60000);
})();
