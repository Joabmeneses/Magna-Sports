'use strict';
// Portada: alineaciones de ambos equipos debajo del marcador y, al terminar el partido,
// un carrusel con el rendimiento de cada jugador (local → visitante → MVP) dentro del banner.
(function () {
  if (!window.MAGNA) return;
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches, mid = null, slide = 0, tmr = null, paused = false, lastKey = '';
  function h(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function S() { return MAGNA.S; }
  function by(l, id) { return MAGNA.by(l, id); }
  function ini(n) { var p = String(n || '?').trim().split(/\s+/); return ((p[0] || '?')[0] + (p[1] ? p[1][0] : (p[0] || '').slice(1, 2))).toUpperCase(); }
  function rc(v) { return v == null ? 'na' : v >= 8 ? 'top' : v >= 6.5 ? 'good' : v >= 6 ? 'mid' : 'low'; }
  function rt(v) { return v == null ? '–' : Number(v).toFixed(1).replace('.', ','); }
  var PAV = {}; try { PAV = JSON.parse(localStorage.getItem('magna_pav') || '{}') || {}; } catch (e) {}
  function pav(el, pid) { var id = PAV[pid]; if (id && /^a\d\d$/.test(id)) { el.style.background = 'url("avatars/' + id + '.webp") center/cover'; el.style.color = 'transparent'; } return el; }
  if (window.MAGNA_SB) window.MAGNA_SB().then(function (c) { return c.rpc('player_avatars'); }).then(function (r) { if (!r || r.error) return; var m = {}; (r.data || []).forEach(function (x) { m[x.player_id] = x.avatar; }); PAV = m; try { localStorage.setItem('magna_pav', JSON.stringify(m)); } catch (e) {} lastKey = ''; draw(); }, function () {});
  function col(tid) { return MAGNA.teamColor ? MAGNA.teamColor(tid) : '#8b5cf6'; }
  var CSS = '' +
    // alineaciones
    '.hl{margin:-10px 0 36px}.hl-h{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin:0 0 10px}.hl-h h2{margin:0;font-size:clamp(20px,3vw,26px)}.hl-h small{color:var(--muted);font-size:13px}' +
    '.hl-p{position:relative;display:grid;grid-template-columns:1fr 1fr;border-radius:24px;border:1px solid rgba(255,255,255,.14);background:repeating-linear-gradient(90deg,rgba(255,255,255,.035) 0 56px,transparent 56px 112px),linear-gradient(180deg,#1f6b52,#174b4a 60%,#163a4f)}' +
    '.hl-p:before{content:"";position:absolute;top:8%;bottom:8%;left:50%;border-left:2px solid rgba(255,255,255,.25)}.hl-p:after{content:"";position:absolute;left:50%;top:50%;width:84px;height:84px;margin:-42px 0 0 -42px;border:2px solid rgba(255,255,255,.22);border-radius:50%}' +
    '.hl-s{position:relative;height:250px;z-index:1}.hl-s .hl-tag{position:absolute;top:10px;display:flex;align-items:center;gap:8px;font:800 13px Archivo,sans-serif;color:#fff;background:rgba(10,13,24,.45);border-radius:999px;padding:4px 12px 4px 4px;max-width:calc(100% - 20px)}.hl-s .hl-tag span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.hl-s.h .hl-tag{left:10px}.hl-s.a .hl-tag{right:10px;flex-direction:row-reverse;padding:4px 4px 4px 12px}' +
    '.hl-s .hl-tag i{width:22px;height:22px;border-radius:50%;flex:none;background:var(--tc) center/cover;border:2px solid #fff}' +
    '.hl-k{position:absolute;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:4px;border:0;background:none;padding:0;color:#fff;cursor:pointer;font:inherit;width:96px;animation:hlIn .5s cubic-bezier(.2,1.3,.4,1) both}' +
    '.hl-k .av{position:relative;width:48px;height:48px;border-radius:14px;display:grid;place-items:center;font:900 16px Archivo,sans-serif;background:linear-gradient(150deg,color-mix(in srgb,var(--tc) 75%,#fff 0%),color-mix(in srgb,var(--tc) 35%,#0b0e1c));border:2px solid rgba(255,255,255,.85);box-shadow:0 8px 18px rgba(0,0,0,.35);transition:transform .2s}.hl-k:hover .av,.hl-k:focus-visible .av,.hl-k.on .av{transform:scale(1.1)}' +
    '.hl-k b{margin-top:8px;font:700 12px/1.15 Archivo,sans-serif;text-shadow:0 1px 4px rgba(0,0,0,.6);max-width:96px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.hl-r{position:absolute;left:50%;bottom:-9px;transform:translateX(-50%);border-radius:999px;padding:1px 7px;font:800 11px/16px Archivo,sans-serif;color:#0a0d18;white-space:nowrap}' +
    '.hl-r.top{background:#2ee59d}.hl-r.good{background:#1f9d55;color:#fff}.hl-r.mid{background:#ffc400}.hl-r.low{background:#ff6b4a;color:#fff}.hl-r.na{display:none}' +
    '.hl-g{position:absolute;top:-7px;right:-9px;display:flex;gap:1px}.hl-g i{font-style:normal;font-size:13px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,.6));animation:hlB .6s cubic-bezier(.2,1.6,.4,1) both}' +
    '.hl-m{position:absolute;top:-8px;left:-9px;font-size:14px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.6))}.hl-sub{position:absolute;bottom:-7px;left:-8px;font-size:10px;background:#3b4bff;border-radius:999px;padding:1px 4px}' +
    '@keyframes hlIn{from{opacity:0;transform:translate(-50%,-30%) scale(.6)}}@keyframes hlB{from{transform:scale(0) rotate(-180deg)}}' +
    '.hl-bn{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:10px}.hl-bn>div{display:flex;flex-wrap:wrap;gap:6px;align-items:center;min-width:0}.hl-bn>div:last-child{justify-content:flex-end}.hl-bn small{color:var(--muted);font:600 10px "JetBrains Mono",monospace;letter-spacing:.1em;text-transform:uppercase}' +
    '.hl-bn button{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);background:rgba(255,255,255,.05);color:var(--fg);border-radius:999px;padding:5px 10px;font:600 12px Archivo,sans-serif;cursor:pointer}.hl-bn button:hover{border-color:var(--tc)}.hl-bn .dt{border-color:rgba(255,210,63,.5);color:#ffd23f}' +
    '.hl-pop{position:absolute;z-index:5;width:210px;transform:translate(-50%,calc(-100% - 34px));background:#14183f;border:1px solid rgba(255,255,255,.18);border-radius:18px;padding:12px;box-shadow:0 18px 40px rgba(0,0,0,.5);color:#f1f3fb;font-size:13px;animation:hlP .2s both}@keyframes hlP{from{opacity:0;transform:translate(-50%,calc(-100% - 24px))}}' +
    '.hl-pop b{display:block;font-size:15px}.hl-pop small{color:#b9bed6}.hl-pop .st{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:10px;text-align:center}.hl-pop .st div{background:rgba(255,255,255,.07);border-radius:10px;padding:6px 2px}.hl-pop .st b{font-size:16px}.hl-pop .st small{display:block;font:500 9px "JetBrains Mono",monospace;letter-spacing:.06em;text-transform:uppercase}.hl-pop a{display:block;margin-top:10px;color:#c9b8ff;font-weight:700;text-decoration:none}' +
    // rendimiento en el banner
    '.pf{margin-top:24px;border-radius:24px;background:rgba(10,13,24,.28);border:1px solid rgba(255,255,255,.18);padding:14px 14px 12px;position:relative;overflow:hidden}' +
    '.pf-h{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px}.pf-h b{font:900 15px Archivo,sans-serif;text-transform:uppercase;letter-spacing:.02em}.pf-h .sp{flex:1}' +
    '.pf-d{display:flex;gap:6px}.pf-d button{position:relative;overflow:hidden;width:58px;height:26px;border-radius:999px;border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.08);color:#fff;font:700 10px Archivo,sans-serif;cursor:pointer;padding:0}.pf-d button.on{border-color:#fff}.pf-d button i{position:absolute;left:0;top:0;bottom:0;width:0;background:rgba(255,255,255,.25)}.pf-d button.on i{animation:pfBar 5s linear forwards}.pf-d button span{position:relative}.pf.pz .pf-d button.on i{animation-play-state:paused}@keyframes pfBar{to{width:100%}}' +
    '.pf-v{overflow:hidden;margin:0 30px}@media(max-width:640px){.pf-v{margin:0}}'+'.pf-t{display:flex;transition:transform .55s cubic-bezier(.2,.9,.2,1)}.pf-t>section{flex:0 0 100%;min-width:0}' +
    '.pf-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:10px}' +
    '.pf-c{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 6px 10px;border-radius:16px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.14);animation:pfIn .45s cubic-bezier(.2,1.2,.4,1) both}.pf-c.best{border-color:#ffd23f;box-shadow:0 0 0 1px #ffd23f inset}' +
    '.pf-c .av{position:relative;width:58px;height:58px;border-radius:16px;display:grid;place-items:center;font:900 19px Archivo,sans-serif;background:linear-gradient(150deg,color-mix(in srgb,var(--tc) 80%,#fff 0%),color-mix(in srgb,var(--tc) 30%,#0b0e1c));border:2px solid rgba(255,255,255,.8)}' +
    '.pf-c .hl-r{position:static;transform:none;margin-top:-14px;margin-bottom:2px;font-size:13px;line-height:20px;padding:1px 9px;border:2px solid rgba(10,13,24,.35)}.pf-c .hl-r.na{display:inline-block;background:rgba(255,255,255,.2);color:#fff}' +
    '.pf-c b{font:700 13px/1.15 Archivo,sans-serif;text-align:center;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pf-c small{font-size:11px;opacity:.85}.pf-c .hl-g{top:6px;right:8px}' +
    '@keyframes pfIn{from{opacity:0;transform:translateY(12px) scale(.94)}}' +
    '.pf-mvp{display:grid;grid-template-columns:auto 1fr;gap:18px;align-items:center;padding:8px 6px}.pf-mvp .big{position:relative;width:110px;height:110px;border-radius:28px;display:grid;place-items:center;font:900 36px Archivo,sans-serif;background:linear-gradient(150deg,#ffd23f,color-mix(in srgb,var(--tc) 50%,#0b0e1c));border:3px solid #ffd23f;box-shadow:0 0 0 6px rgba(255,210,63,.25),0 16px 40px rgba(0,0,0,.4);animation:pfGlow 2.4s ease-in-out infinite}@keyframes pfGlow{50%{box-shadow:0 0 0 12px rgba(255,210,63,.12),0 16px 40px rgba(0,0,0,.4)}}' +
    '.pf-mvp .crown{position:absolute;top:-22px;left:50%;transform:translateX(-50%);font-size:30px}.pf-mvp .ey{font:700 11px "JetBrains Mono",monospace;letter-spacing:.14em;text-transform:uppercase;color:#ffd23f}.pf-mvp h3{margin:4px 0 6px;font:900 clamp(26px,4vw,40px)/1 Archivo,sans-serif;text-transform:uppercase;font-stretch:115%}.pf-mvp p{margin:0;opacity:.9}' +
    '.pf-mvp .nums{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.pf-mvp .nums span{background:rgba(255,255,255,.14);border-radius:12px;padding:6px 12px;font:700 13px Archivo,sans-serif}.pf-mvp .nums b{font-size:18px;margin-right:4px}' +
    '.pf-cf{position:absolute;inset:0;pointer-events:none;overflow:hidden}.pf-cf i{position:absolute;top:-10px;width:8px;height:12px;border-radius:2px;animation:pfCf 2.6s linear forwards}@keyframes pfCf{to{transform:translateY(320px) rotate(540deg);opacity:0}}' +
    '.pf-nav{position:absolute;top:50%;transform:translateY(-50%);width:34px;height:34px;border-radius:50%;border:1px solid rgba(255,255,255,.35);background:rgba(10,13,24,.4);color:#fff;cursor:pointer;font:700 16px Archivo,sans-serif;display:grid;place-items:center;z-index:2}.pf-nav.l{left:6px}.pf-nav.r{right:6px}' +
    '.pf-e{opacity:.9;font-size:14px;padding:8px 2px}' +
    '@media(max-width:640px){.hl-s{height:240px}.hl-k{width:76px}.hl-k .av{width:40px;height:40px;font-size:14px;border-radius:12px}.hl-k b{font-size:11px;max-width:76px}.hl-s .hl-tag{font-size:11px}.pf-g{grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:8px}.pf-c .av{width:48px;height:48px;font-size:16px}.pf-mvp{grid-template-columns:1fr;justify-items:center;text-align:center}.pf-mvp .nums{justify-content:center}.pf-nav{display:none}.hl-bn{grid-template-columns:1fr}.hl-bn>div:last-child{justify-content:flex-start}}' +
    '@media(prefers-reduced-motion:reduce){.hl *,.pf *{animation:none!important;transition:none!important}}';
  var st = h('style'); st.textContent = CSS; document.head.appendChild(st);

  // ---------- datos del partido ----------
  function data(m) {
    var L = m.live || {}, ev = L.ev || [], R = L.ratings || {}, goals = {}, subIn = {}, subOut = {};
    ev.forEach(function (e) { if (e.k === 'goal' && e.player) goals[e.player] = (goals[e.player] || 0) + 1; if (e.k === 'sub') { if (e.in) subIn[e.in] = 1; if (e.out) subOut[e.out] = 1; } });
    function side(sd) { var tid = sd === 'h' ? m.home : m.away, squad = S().players.filter(function (p) { return p.teamId === tid && (!MAGNA.plays || MAGNA.plays(p)); });
      var xi = (L.lineup && L.lineup[sd] && L.lineup[sd].length) ? L.lineup[sd].slice() : squad.filter(function (p) { return p.slot === 'starter'; }).map(function (p) { return p.id; });
      if (!xi.length) xi = squad.slice(0, 3).map(function (p) { return p.id; });
      // en cancha ahora: titulares que no salieron + los que entraron
      var field = xi.filter(function (id) { return !subOut[id]; }); Object.keys(subIn).map(Number).forEach(function (id) { var p = by(S().players, id); if (p && p.teamId === tid && field.indexOf(id) < 0) field.push(id); });
      var played = xi.concat(Object.keys(subIn).map(Number).filter(function (id) { var p = by(S().players, id); return p && p.teamId === tid && xi.indexOf(id) < 0; }));
      var bench = squad.filter(function (p) { return field.indexOf(p.id) < 0; }).map(function (p) { return p.id; });
      var t = by(S().teams, tid), dt = t && t.coach ? by(S().players, t.coach) : null;
      return { tid: tid, field: field.slice(0, 5), bench: bench, played: played, dt: dt };
    }
    return { R: R, goals: goals, subIn: subIn, mvp: L.mvp || null, h: side('h'), a: side('a') };
  }
  function cur() { var id = window.__HOME_SEL; return id != null ? by(S().matches, id) : null; }

  // ---------- alineaciones ----------
  var POS = { 1: [[50, 58]], 2: [[36, 42], [36, 78]], 3: [[30, 58], [68, 38], [68, 80]], 4: [[28, 40], [28, 80], [70, 40], [70, 80]], 5: [[22, 60], [48, 38], [48, 82], [76, 42], [76, 78]] };
  function token(pid, D, sd, i, n) {
    var p = by(S().players, pid); if (!p) return null; var k = h('button', 'hl-k'); k.type = 'button'; var ps = (POS[n] || POS[3])[i] || [50, 50];
    k.style.left = (sd === 'h' ? ps[0] : 100 - ps[0]) + '%'; k.style.top = ps[1] + '%'; k.style.animationDelay = (i * 70 + (sd === 'a' ? 140 : 0)) + 'ms'; k.style.setProperty('--tc', col(p.teamId));
    var av = pav(h('span', 'av', ini(p.name)), pid), r = D.R[pid]; av.appendChild(h('span', 'hl-r ' + rc(r), rt(r)));
    if (D.goals[pid]) { var g = h('span', 'hl-g'); for (var j = 0; j < Math.min(D.goals[pid], 4); j++) g.appendChild(h('i', null, '⚽')); g.title = D.goals[pid] + (D.goals[pid] === 1 ? ' gol' : ' goles'); av.appendChild(g); }
    if (D.mvp === pid) av.appendChild(h('span', 'hl-m', '⭐')); if (D.subIn[pid]) av.appendChild(h('span', 'hl-sub', '⇄'));
    k.appendChild(av); k.appendChild(h('b', null, p.name));
    k.setAttribute('aria-label', p.name + (r != null ? ', nota ' + rt(r) : '') + (D.goals[pid] ? ', ' + D.goals[pid] + ' goles' : ''));
    return k;
  }
  function pop(pitch, k, pid, D) {
    var old = pitch.querySelector('.hl-pop'); [].forEach.call(pitch.querySelectorAll('.hl-k.on'), function (x) { x.classList.remove('on'); }); if (old) { var same = old.dataset.p == pid; old.remove(); if (same) return; }
    var p = by(S().players, pid), ps = (MAGNA.playerStats ? MAGNA.playerStats()[pid] : null) || {}, b = h('div', 'hl-pop'); b.dataset.p = pid; k.classList.add('on');
    b.appendChild(h('b', null, p.name + (D.mvp === pid ? ' ⭐' : ''))); b.appendChild(h('small', null, MAGNA.teamName(p.teamId) + ' · media ' + (ps.media != null ? ps.media : p.media != null ? p.media : 10)));
    var g = h('div', 'st'); [[rt(D.R[pid]), 'Nota'], [String(D.goals[pid] || 0), 'Goles'], [String(ps.pj || 0), 'Partidos']].forEach(function (x) { var d = h('div'); d.appendChild(h('b', null, x[0])); d.appendChild(h('small', null, x[1])); g.appendChild(d); }); b.appendChild(g);
    var a = h('a', null, 'Ver ' + MAGNA.teamName(p.teamId) + ' →'); a.href = 'equipo.html?id=' + p.teamId; b.appendChild(a);
    var pr = pitch.getBoundingClientRect(), kr = k.getBoundingClientRect(), x = kr.left - pr.left + kr.width / 2; b.style.left = Math.max(110, Math.min(pr.width - 110, x)) + 'px'; b.style.top = (kr.top - pr.top + 34) + 'px';
    if (kr.top - pr.top < 170) { b.style.transform = 'translate(-50%, 50px)'; b.style.animation = 'none'; }
    pitch.appendChild(b);
  }
  function lineups(m, D) {
    var box = document.getElementById('alineaciones'); if (!box) { box = h('section', 'hl'); box.id = 'alineaciones'; var bn = document.getElementById('marcador'); if (!bn) return; bn.parentNode.insertBefore(box, bn.nextSibling); }
    box.innerHTML = ''; var hd = h('div', 'hl-h'); hd.appendChild(h('h2', 'x', 'Alineaciones')); hd.appendChild(h('small', null, m.status === 'live' ? 'En cancha ahora · toca un jugador' : m.status === 'finished' ? 'Cómo terminaron · toca un jugador' : 'Titulares previstos · toca un jugador')); box.appendChild(hd);
    var pitch = h('div', 'hl-p');
    ['h', 'a'].forEach(function (sd) { var X = D[sd], s = h('div', 'hl-s ' + sd), tg = h('div', 'hl-tag'), ci = h('i'), u = MAGNA.crestUrl(X.tid); ci.style.setProperty('--tc', col(X.tid)); if (u) ci.style.backgroundImage = 'url("' + u + '")'; else ci.style.background = col(X.tid); tg.appendChild(ci); tg.appendChild(h('span', null, MAGNA.teamName(X.tid))); s.appendChild(tg);
      if (!X.field.length) { var e = h('div', null, 'Sin jugadores'); e.style.cssText = 'position:absolute;inset:0;display:grid;place-items:center;color:rgba(255,255,255,.7);font-size:13px'; s.appendChild(e); }
      X.field.forEach(function (pid, i) { var k = token(pid, D, sd, i, X.field.length); if (k) { k.onclick = function (ev) { ev.stopPropagation(); pop(pitch, k, pid, D); }; s.appendChild(k); } });
      pitch.appendChild(s); });
    pitch.addEventListener('click', function () { var o = pitch.querySelector('.hl-pop'); if (o) o.remove(); [].forEach.call(pitch.querySelectorAll('.hl-k.on'), function (x) { x.classList.remove('on'); }); });
    box.appendChild(pitch);
    var bn2 = h('div', 'hl-bn');
    ['h', 'a'].forEach(function (sd) { var X = D[sd], d = h('div'); d.style.setProperty('--tc', col(X.tid)); d.appendChild(h('small', null, 'Banca'));
      if (!X.bench.length) d.appendChild(h('small', null, '· sin suplentes'));
      X.bench.forEach(function (pid) { var p = by(S().players, pid); if (!p) return; var b = h('button', null, p.name + (D.goals[pid] ? ' ⚽' : '') + (D.R[pid] != null ? ' · ' + rt(D.R[pid]) : '')); b.type = 'button'; b.onclick = function () { location.href = 'equipo.html?id=' + p.teamId; }; d.appendChild(b); });
      if (X.dt) d.appendChild(h('button', 'dt', 'DT · ' + X.dt.name));
      bn2.appendChild(d); });
    box.appendChild(bn2);
  }

  // ---------- rendimiento (partido terminado) ----------
  function perf(m, D) {
    var bn = document.getElementById('marcador'); if (!bn) return; var old = bn.querySelector('.pf'); if (old) old.remove(); clearTimeout(tmr);
    if (m.status !== 'finished') return;
    var box = h('div', 'pf'), hd = h('div', 'pf-h'); hd.appendChild(h('b', null, '📊 Rendimiento del partido')); hd.appendChild(h('span', 'sp')); var dots = h('div', 'pf-d'); hd.appendChild(dots); box.appendChild(hd);
    var vw = h('div', 'pf-v'), tr = h('div', 'pf-t'); vw.appendChild(tr); box.appendChild(vw);
    var slides = [];
    ['h', 'a'].forEach(function (sd) { var X = D[sd], s = h('section'); s.setAttribute('aria-label', 'Rendimiento de ' + MAGNA.teamName(X.tid));
      var list = X.played.concat(Object.keys(D.R).map(Number).filter(function (id) { var p = by(S().players, id); return p && p.teamId === X.tid && X.played.indexOf(id) < 0; }));
      list = list.filter(function (id, i) { return list.indexOf(id) === i && by(S().players, id); }).sort(function (x, y) { return (D.R[y] || 0) - (D.R[x] || 0) || (D.goals[y] || 0) - (D.goals[x] || 0); });
      var best = list.length && D.R[list[0]] != null ? list[0] : null, g = h('div', 'pf-g');
      if (!list.length) s.appendChild(h('p', 'pf-e', 'Sin jugadores registrados para ' + MAGNA.teamName(X.tid) + '.'));
      list.forEach(function (pid, i) { var p = by(S().players, pid), c = h('div', 'pf-c' + (pid === best ? ' best' : '')); c.style.setProperty('--tc', col(X.tid)); c.style.animationDelay = i * 80 + 'ms';
        var av = pav(h('span', 'av', ini(p.name)), pid); if (D.goals[pid]) { var gg = h('span', 'hl-g'); for (var j = 0; j < Math.min(D.goals[pid], 4); j++) gg.appendChild(h('i', null, '⚽')); av.appendChild(gg); } c.appendChild(av);
        c.appendChild(h('span', 'hl-r ' + rc(D.R[pid]), rt(D.R[pid]))); c.appendChild(h('b', null, p.name)); c.appendChild(h('small', null, (pid === D.mvp ? '⭐ MVP' : pid === best ? '🔥 Mejor de su equipo' : D.subIn[pid] ? '⇄ Entró de cambio' : 'Titular'))); g.appendChild(c); });
      s.appendChild(g); slides.push([s, MAGNA.teamName(X.tid).slice(0, 8)]); });
    var mv = D.mvp ? by(S().players, D.mvp) : null;
    if (!mv) { var all = D.h.played.concat(D.a.played).filter(function (id) { return D.R[id] != null; }).sort(function (x, y) { return D.R[y] - D.R[x]; }); if (all.length) mv = by(S().players, all[0]); }
    if (mv) { var s3 = h('section'), w = h('div', 'pf-mvp'), big = pav(h('div', 'big', ini(mv.name)), mv.id); big.style.setProperty('--tc', col(mv.teamId)); big.appendChild(h('span', 'crown', '👑')); w.appendChild(big);
      var tx = h('div'); tx.appendChild(h('div', 'ey', D.mvp ? 'MVP del partido' : 'Mejor valorado')); tx.appendChild(h('h3', null, mv.name)); tx.appendChild(h('p', null, MAGNA.teamName(mv.teamId) + ' · ' + MAGNA.teamName(m.home) + ' ' + m.hs + '-' + m.as + ' ' + MAGNA.teamName(m.away)));
      var nm = h('div', 'nums'); [[rt(D.R[mv.id]), 'nota'], [String(D.goals[mv.id] || 0), D.goals[mv.id] === 1 ? 'gol' : 'goles']].forEach(function (x) { var sp = h('span'); sp.appendChild(h('b', null, x[0])); sp.appendChild(document.createTextNode(x[1])); nm.appendChild(sp); }); tx.appendChild(nm); w.appendChild(tx); s3.appendChild(w); s3.dataset.mvp = 1; slides.push([s3, '⭐ MVP']); }
    slides.forEach(function (x, i) { tr.appendChild(x[0]); var d = h('button', i === slide ? 'on' : ''); d.type = 'button'; d.appendChild(h('i')); d.appendChild(h('span', null, x[1])); d.setAttribute('aria-label', 'Ver ' + x[1]); d.onclick = function () { go(i, true); }; dots.appendChild(d); });
    var pl = h('button', 'pf-nav l', '‹'), pr = h('button', 'pf-nav r', '›'); pl.type = pr.type = 'button'; pl.setAttribute('aria-label', 'Anterior'); pr.setAttribute('aria-label', 'Siguiente'); pl.onclick = function () { go(slide - 1, true); }; pr.onclick = function () { go(slide + 1, true); }; box.appendChild(pl); box.appendChild(pr);
    var cf = h('div', 'pf-cf'); box.appendChild(cf);
    function confetti() { if (RM) return; cf.innerHTML = ''; var C = ['#ffd23f', '#ff5a36', '#2ee59d', '#22d3ee', '#ff4fa3', '#fff']; for (var i = 0; i < 40; i++) { var c = h('i'); c.style.left = Math.random() * 100 + '%'; c.style.background = C[i % C.length]; c.style.animationDelay = Math.random() * .8 + 's'; cf.appendChild(c); } }
    function go(i, user) { if (!slides.length) return; slide = (i + slides.length) % slides.length; tr.style.transform = 'translateX(' + (-100 * slide) + '%)';
      [].forEach.call(dots.children, function (d, k) { d.classList.remove('on'); if (k === slide) { void d.offsetWidth; d.classList.add('on'); } });
      [].forEach.call(slides[slide][0].querySelectorAll('.pf-c'), function (c) { c.style.animation = 'none'; void c.offsetWidth; c.style.animation = ''; });
      if (slides[slide][0].dataset.mvp) confetti(); sched(); }
    function sched() { clearTimeout(tmr); if (paused || RM) return; tmr = setTimeout(function () { if (document.body.contains(box)) go(slide + 1); }, 5000); }
    box.addEventListener('mouseenter', function () { paused = true; box.classList.add('pz'); clearTimeout(tmr); }); box.addEventListener('mouseleave', function () { paused = false; box.classList.remove('pz'); sched(); });
    var x0 = null; vw.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; paused = true; clearTimeout(tmr); }, { passive: true });
    vw.addEventListener('touchend', function (e) { var dx = e.changedTouches[0].clientX - (x0 || 0); paused = false; if (Math.abs(dx) > 40) go(slide + (dx < 0 ? 1 : -1), true); else sched(); }, { passive: true });
    bn.appendChild(box); go(slide < slides.length ? slide : 0);
  }

  function draw() { var m = cur(); if (!m) { var b = document.getElementById('alineaciones'); if (b) b.remove(); return; }
    var D = data(m), key = m.id + '|' + m.status + '|' + JSON.stringify([m.hs, m.as, D.goals, D.R, D.mvp, D.h.field, D.a.field, D.h.bench, D.a.bench]);
    if (key === lastKey) return; if (m.id !== mid) slide = 0; mid = m.id; lastKey = key; lineups(m, D); perf(m, D); }
  window.addEventListener('magna:homesel', function () { lastKey = ''; draw(); });
  window.addEventListener('magna:update', function () { setTimeout(draw, 50); });
  setInterval(draw, 4000);
  if (document.readyState === 'complete') draw(); else addEventListener('load', draw);
})();
