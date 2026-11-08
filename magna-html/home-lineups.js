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
  function pav(el, pid) { var eq0 = MAGNA_COS.eqOf ? MAGNA_COS.eqOf(pid) : {}, fr0 = eq0.frame && MAGNA_COS.item(eq0.frame); if (fr0 && fr0.type === 'frame') el.classList.add('fr-' + fr0.style); var id = PAV[pid]; if (id && /^a\d\d$/.test(id)) { el.style.background = 'url("avatars/' + id + '.webp") center/cover'; el.style.color = 'transparent'; } return el; }
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
    '.hl-pop b{display:block;font-size:15px}.hl-lk{display:flex;gap:12px;flex-wrap:wrap;justify-content:center}.hl-pop small{color:#b9bed6}.hl-pop .st{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:10px;text-align:center}.hl-pop .st div{background:rgba(255,255,255,.07);border-radius:10px;padding:6px 2px}.hl-pop .st b{font-size:16px}.hl-pop .st small{display:block;font:500 9px "JetBrains Mono",monospace;letter-spacing:.06em;text-transform:uppercase}.hl-pop a{display:block;margin-top:10px;color:#c9b8ff;font-weight:700;text-decoration:none}' +
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
    k.appendChild(av); var kb = h('b'); kb.appendChild(MAGNA_COS.pn(p.name, pid, { plain: true })); k.appendChild(kb);
    k.setAttribute('aria-label', p.name + (r != null ? ', nota ' + rt(r) : '') + (D.goals[pid] ? ', ' + D.goals[pid] + ' goles' : ''));
    return k;
  }
  function pop(pitch, k, pid, D) {
    var old = pitch.querySelector('.hl-pop'); [].forEach.call(pitch.querySelectorAll('.hl-k.on'), function (x) { x.classList.remove('on'); }); if (old) { var same = old.dataset.p == pid; old.remove(); if (same) return; }
    var p = by(S().players, pid), ps = (MAGNA.playerStats ? MAGNA.playerStats()[pid] : null) || {}, b = h('div', 'hl-pop'); b.dataset.p = pid; k.classList.add('on');
    var nb = h('b'); nb.appendChild(MAGNA_COS.pn(p.name, pid, { plain: true, title: true })); if (D.mvp === pid) nb.appendChild(document.createTextNode(' ⭐')); b.appendChild(nb); b.appendChild(h('small', null, MAGNA.teamName(p.teamId) + ' · media ' + (ps.media != null ? ps.media : p.media != null ? p.media : 10)));
    var g = h('div', 'st'); [[rt(D.R[pid]), 'Nota'], [String(D.goals[pid] || 0), 'Goles'], [String(ps.pj || 0), 'Partidos']].forEach(function (x) { var d = h('div'); d.appendChild(h('b', null, x[0])); d.appendChild(h('small', null, x[1])); g.appendChild(d); }); b.appendChild(g);
    var lk = h('div', 'hl-lk'), a0 = h('a', null, 'Ver perfil →'); a0.href = MAGNA_COS.profileUrl(pid); lk.appendChild(a0); var a = h('a', null, MAGNA.teamName(p.teamId) + ' →'); a.href = 'equipo.html?id=' + p.teamId; lk.appendChild(a); b.appendChild(lk);
    var pr = pitch.getBoundingClientRect(), kr = k.getBoundingClientRect(), x = kr.left - pr.left + kr.width / 2; b.style.left = Math.max(110, Math.min(pr.width - 110, x)) + 'px'; b.style.top = (kr.top - pr.top + 34) + 'px';
    if (kr.top - pr.top < 170) { b.style.transform = 'translate(-50%, 50px)'; b.style.animation = 'none'; }
    pitch.appendChild(b);
  }
  // ---------- alineaciones (arena, duelo y notas) ----------
  var CSS2 = '' +
    '.al{margin:-6px 0 38px;--hc:#8b5cf6;--ac:#ff6a00}' +
    '.al-h{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:0 0 12px}.al-h h2{margin:0;font:900 clamp(26px,4vw,38px)/.9 Archivo,sans-serif;font-stretch:118%;text-transform:uppercase;letter-spacing:-.01em}' +
    '.al-h h2 em{font-style:normal;color:#c6ff1a;text-shadow:3px 3px 0 #000}.al-st{display:inline-block;margin-top:6px;font:800 11px "JetBrains Mono",monospace;letter-spacing:.08em;text-transform:uppercase;padding:4px 9px;border-radius:5px;background:rgba(255,255,255,.08);transform:rotate(-1.5deg)}.al-st.live{background:#ff3b47;color:#fff}.al-st.fin{background:#c6ff1a;color:#0d0d10}' +
    '.al-tabs{display:flex;gap:4px;padding:4px;border-radius:14px;background:rgba(5,6,12,.55);border:1px solid rgba(255,255,255,.1)}.al-tabs button{border:0;background:none;color:#cfd3e6;font:800 13px Archivo,sans-serif;padding:9px 13px;border-radius:10px;cursor:pointer;transition:background-color .15s,color .15s}.al-tabs button:hover{color:#fff}.al-tabs button.on{background:#c6ff1a;color:#0d0d10;box-shadow:0 3px 0 #6a8f00}' +
    '.al-tm{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:stretch;margin-bottom:10px}.al-t{display:flex;align-items:center;gap:10px;min-width:0;padding:10px 12px;border-radius:16px;background:linear-gradient(90deg,color-mix(in srgb,var(--c) 30%,transparent),rgba(255,255,255,.03));border:1px solid color-mix(in srgb,var(--c) 45%,transparent);text-decoration:none;color:inherit;transition:transform .15s}.al-t:hover{transform:translateY(-2px)}' +
    '.al-t.a{flex-direction:row-reverse;text-align:right;background:linear-gradient(270deg,color-mix(in srgb,var(--c) 30%,transparent),rgba(255,255,255,.03))}.al-t i{flex:none;width:44px;height:44px;border-radius:12px;background:var(--c) center/cover;box-shadow:0 0 0 2px rgba(0,0,0,.4),0 0 18px color-mix(in srgb,var(--c) 60%,transparent)}' +
    '.al-t div{min-width:0}.al-t b{display:block;font:900 17px Archivo,sans-serif;font-stretch:112%;text-transform:uppercase;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.al-t small{color:rgba(255,255,255,.72);font:700 11.5px Archivo,sans-serif}' +
    '.al-sc{display:grid;place-content:center;text-align:center;min-width:74px;padding:6px 10px;border-radius:14px;background:#0d0d10;border:2px solid #c6ff1a;box-shadow:3px 3px 0 #ff6a00}.al-sc b{font:italic 900 26px/1 Archivo,sans-serif;font-stretch:118%}.al-sc small{font:800 9px "JetBrains Mono",monospace;color:#c6ff1a;letter-spacing:.08em}' +
    // arena
    '.al-ar{position:relative;height:320px;border-radius:26px;border:3px solid rgba(255,255,255,.14);box-shadow:0 18px 40px -20px #000,inset 0 0 60px rgba(0,0,0,.45);background:radial-gradient(60% 90% at 0 50%,color-mix(in srgb,var(--hc) 45%,transparent),transparent 72%),radial-gradient(60% 90% at 100% 50%,color-mix(in srgb,var(--ac) 45%,transparent),transparent 72%),repeating-linear-gradient(90deg,#17704c 0 9.09%,#135f41 9.09% 18.18%)}' +
    '.al-ar:after{content:"";position:absolute;inset:0;border-radius:23px;pointer-events:none;background:radial-gradient(rgba(255,255,255,.06) 1px,transparent 1.5px) 0 0/6px 6px;mix-blend-mode:overlay}' +
    '.pl{position:absolute;pointer-events:none;border:0 solid rgba(255,255,255,.55);z-index:1}' +
    '.pl-out{inset:16px;border-width:3px;border-radius:6px}.pl-mid{left:50%;top:16px;bottom:16px;border-left-width:3px;margin-left:-1.5px}.pl-cc{left:50%;top:50%;width:120px;height:120px;margin:-60px 0 0 -60px;border-width:3px;border-radius:50%}.pl-dot{left:50%;top:50%;width:8px;height:8px;margin:-4px;border-radius:50%;background:rgba(255,255,255,.7)}' +
    '.pl-box{top:26%;bottom:26%;width:14%;border-width:3px}.pl-box.h{left:16px;border-left:0}.pl-box.a{right:16px;border-right:0}.pl-gb{top:38%;bottom:38%;width:5.5%;border-width:3px}.pl-gb.h{left:16px;border-left:0}.pl-gb.a{right:16px;border-right:0}' +
    '.pl-arc{top:50%;width:70px;height:90px;margin-top:-45px;border-width:3px;border-radius:50%;clip-path:inset(0 0 0 50%)}.pl-arc.h{left:calc(16px + 14% - 35px)}.pl-arc.a{right:calc(16px + 14% - 35px);clip-path:inset(0 50% 0 0)}' +
    '.pl-goal{top:43%;bottom:43%;width:10px;border-width:3px;background:repeating-linear-gradient(45deg,rgba(255,255,255,.35) 0 2px,transparent 2px 5px)}.pl-goal.h{left:6px;border-right:0}.pl-goal.a{right:6px;border-left:0}' +
    '.al-ar.vert .pl-mid{left:16px;right:16px;top:50%;bottom:auto;border-left-width:0;border-top-width:3px;margin:-1.5px 0 0}.al-ar.vert .pl-box{left:26%;right:26%;width:auto;height:13%;top:auto;bottom:auto}.al-ar.vert .pl-box.h{top:16px;border:3px solid rgba(255,255,255,.55);border-top:0}.al-ar.vert .pl-box.a{bottom:16px;border:3px solid rgba(255,255,255,.55);border-bottom:0}' +
    '.al-ar.vert .pl-gb{left:38%;right:38%;width:auto;height:5%;top:auto;bottom:auto}.al-ar.vert .pl-gb.h{top:16px;border:3px solid rgba(255,255,255,.55);border-top:0}.al-ar.vert .pl-gb.a{bottom:16px;border:3px solid rgba(255,255,255,.55);border-bottom:0}' +
    '.al-ar.vert .pl-arc{left:50%;width:90px;height:60px;margin:0 0 0 -45px;right:auto}.al-ar.vert .pl-arc.h{top:calc(16px + 13% - 30px);clip-path:inset(50% 0 0 0)}.al-ar.vert .pl-arc.a{top:auto;bottom:calc(16px + 13% - 30px);clip-path:inset(0 0 50% 0)}' +
    '.al-ar.vert .pl-goal{left:43%;right:43%;width:auto;height:10px;top:auto;bottom:auto}.al-ar.vert .pl-goal.h{top:6px;border:3px solid rgba(255,255,255,.55);border-top:0}.al-ar.vert .pl-goal.a{bottom:6px;border:3px solid rgba(255,255,255,.55);border-bottom:0}' +
    '.al-vs{position:absolute;left:50%;top:50%;width:86px;height:86px;margin:-43px 0 0 -43px;display:grid;place-content:center;text-align:center;border-radius:50%;background:#0d0d10;border:3px solid #c6ff1a;box-shadow:0 0 0 6px rgba(13,13,16,.55),0 0 34px rgba(198,255,26,.35);z-index:2}.al-vs b{font:italic 900 24px/1 Archivo,sans-serif;font-stretch:120%}.al-vs small{font:800 8px "JetBrains Mono",monospace;color:#c6ff1a;letter-spacing:.1em}' +
    '.al-zn{position:absolute;z-index:2;bottom:22px;font:900 11px "JetBrains Mono",monospace;letter-spacing:.14em;color:rgba(255,255,255,.35);text-transform:uppercase}.al-zn.h{left:28px}.al-zn.a{right:28px}' +
    '.al-k{position:absolute;z-index:3;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;width:96px;background:none;border:0;color:#fff;cursor:pointer;padding:0;animation:alIn .5s both}' +
    '.al-k .hx{position:relative;width:62px;height:68px;display:grid;place-items:center;background:var(--tc);clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%);transition:transform .2s;animation:alF 3.4s ease-in-out infinite;animation-delay:var(--fd)}' +
    '.al-k .hx .av{width:54px;height:60px;display:grid;place-items:center;clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%);background:linear-gradient(160deg,#2a2f55,#141733);font:900 17px Archivo,sans-serif;color:#fff;border-radius:0}' +
    '.al-k:hover .hx,.al-k.on .hx{transform:scale(1.12) translateY(-4px)}.al-k.on .hx{background:#c6ff1a}' +
    '.al-k .nm{margin-top:4px;max-width:100%;padding:2px 8px;border-radius:6px;background:rgba(5,6,12,.75);font:800 11.5px/1.2 Archivo,sans-serif;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;transform:rotate(-2deg)}.al-k .nm .mpn{pointer-events:none}' +
    '.al-rb{position:absolute;z-index:2;left:50%;top:52px;transform:translateX(-50%);min-width:34px;padding:3px 6px;font:900 12px Archivo,sans-serif;text-align:center;color:#0d0d10;clip-path:polygon(12% 0,88% 0,100% 50%,88% 100%,12% 100%,0 50%);background:#9aa0b8}' +
    '.al-rb.top{background:linear-gradient(180deg,#e9ff7a,#a8e000)}.al-rb.good{background:linear-gradient(180deg,#5dffc0,#1fb87a)}.al-rb.mid{background:linear-gradient(180deg,#ffe066,#f5a400)}.al-rb.low{background:linear-gradient(180deg,#ff8a8a,#e02424);color:#fff}.al-rb.na{background:#3a3f5c;color:#cfd3e6}' +
    '.al-gl{position:absolute;z-index:2;right:12px;top:-6px;padding:1px 6px;border-radius:999px;background:#fff;color:#0d0d10;font:900 11px Archivo,sans-serif;box-shadow:0 2px 0 rgba(0,0,0,.4)}.al-cr{position:absolute;z-index:2;left:50%;top:-18px;transform:translateX(-50%);font-size:20px;animation:alC 1.6s ease-in-out infinite;filter:drop-shadow(0 2px 2px rgba(0,0,0,.6))}.al-sb{position:absolute;z-index:2;left:10px;top:0;width:20px;height:20px;border-radius:50%;background:#22d3ee;color:#04252c;font:900 11px/20px Archivo,sans-serif;text-align:center}' +
    '@keyframes alIn{from{opacity:0;transform:translate(-50%,-20%) scale(.5)}}@keyframes alF{0%,100%{translate:0 0}50%{translate:0 -4px}}@keyframes alC{50%{transform:translateX(-50%) translateY(-3px) rotate(-8deg)}}' +
    '.al-pop{position:absolute;z-index:20;width:230px;transform:translate(-50%,calc(-100% - 50px));padding:14px;border-radius:18px;background:#0d0d10;border:2px solid var(--tc,#c6ff1a);box-shadow:5px 5px 0 var(--tc,#c6ff1a);animation:alP .2s both;color:#fff}.al-pop.dn{transform:translate(-50%,50px)}@keyframes alP{from{opacity:0;scale:.9}}' +
    '.al-pop>b{display:block;font:900 17px Archivo,sans-serif;text-transform:uppercase}.al-pop>small{color:#a9afc8;font-size:12px}.al-pop .st{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:10px 0}.al-pop .st div{text-align:center;padding:6px 2px;border-radius:10px;background:rgba(255,255,255,.06)}.al-pop .st b{display:block;font:900 18px Archivo,sans-serif}.al-pop .st small{font:700 9px "JetBrains Mono",monospace;color:#a9afc8;text-transform:uppercase}' +
    '.al-pop .lk{display:flex;gap:10px;flex-wrap:wrap}.al-pop .lk a{color:#c6ff1a;font:800 12.5px Archivo,sans-serif;text-decoration:none}.al-pop .lk a:hover{text-decoration:underline}' +
    // claves
    '.al-keys{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.al-key{display:inline-flex;align-items:center;gap:8px;padding:8px 12px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);font:700 13px Archivo,sans-serif;transform:rotate(var(--r,0deg));animation:alK .4s both}.al-key b{font-weight:900}.al-key i{font-style:normal;font-size:17px}@keyframes alK{from{opacity:0;transform:translateY(8px)}}' +
    // duelo
    '.al-du{display:grid;gap:12px;padding:16px;border-radius:26px;border:2px solid rgba(255,255,255,.12);background:linear-gradient(90deg,color-mix(in srgb,var(--hc) 18%,#101226),#101226 50%,color-mix(in srgb,var(--ac) 18%,#101226))}' +
    '.al-cmp{display:grid;grid-template-columns:52px 1fr auto 1fr 52px;gap:8px;align-items:center}.al-cmp>b{font:900 18px Archivo,sans-serif;text-align:center}.al-cmp>span{font:800 11px "JetBrains Mono",monospace;letter-spacing:.06em;text-transform:uppercase;color:#cfd3e6;text-align:center;min-width:96px}' +
    '.al-bar{height:14px;border-radius:7px;background:rgba(255,255,255,.07);overflow:hidden;display:flex}.al-bar.h{justify-content:flex-end}.al-bar i{display:block;height:100%;border-radius:7px;width:0;transition:width .7s cubic-bezier(.2,.9,.3,1.1)}.al-bar.h i{background:linear-gradient(90deg,color-mix(in srgb,var(--hc) 40%,transparent),var(--hc))}.al-bar.a i{background:linear-gradient(90deg,var(--ac),color-mix(in srgb,var(--ac) 40%,transparent))}' +
    '.al-cmp .w{color:#c6ff1a}' +
    '.al-pr{display:grid;gap:8px;margin-top:4px}.al-pr h4{margin:6px 0 0;font:900 13px Archivo,sans-serif;text-transform:uppercase;letter-spacing:.08em;color:#c6ff1a}' +
    '.al-pa{display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:center}.al-pp{display:flex;align-items:center;gap:8px;min-width:0;padding:7px 10px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid transparent;text-decoration:none;color:inherit}.al-pp.a{flex-direction:row-reverse;text-align:right}.al-pp.win{border-color:#c6ff1a;background:rgba(198,255,26,.1)}' +
    '.al-pp .mini{flex:none;width:30px;height:33px;display:grid;place-items:center;clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%);background:var(--tc);font:900 10px Archivo,sans-serif}.al-pp span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:800 13px Archivo,sans-serif}.al-pp .al-rb{position:static;transform:none;margin-left:auto}.al-pp.a .al-rb{margin-left:0;margin-right:auto}' +
    '.al-pa>em{font-style:normal;font:italic 900 13px Archivo,sans-serif;color:rgba(255,255,255,.5)}' +
    // notas
    '.al-nt{display:grid;gap:6px;padding:14px;border-radius:26px;border:2px solid rgba(255,255,255,.12);background:#101226}' +
    '.al-nr{display:grid;grid-template-columns:28px 36px minmax(0,1fr) auto;gap:10px;align-items:center;padding:6px 8px;border-radius:12px;text-decoration:none;color:inherit;border-left:4px solid var(--tc);background:rgba(255,255,255,.03);animation:alK .35s both;transition:background-color .15s}.al-nr:hover{background:rgba(255,255,255,.08)}' +
    '.al-nr .ps{font:900 15px Archivo,sans-serif;text-align:center;color:#a9afc8}.al-nr:nth-child(1) .ps{color:#ffd23f}.al-nr:nth-child(2) .ps{color:#e3e7f5}.al-nr:nth-child(3) .ps{color:#f59e6b}' +
    '.al-nr .mini{width:34px;height:37px;display:grid;place-items:center;clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%);background:var(--tc);font:900 11px Archivo,sans-serif}' +
    '.al-nr .w{min-width:0}.al-nr .w b{display:block;font:800 14px Archivo,sans-serif;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.al-nr .w small{color:#a9afc8;font-size:11.5px}' +
    '.al-nb{height:8px;border-radius:4px;background:rgba(255,255,255,.07);margin-top:5px;overflow:hidden}.al-nb i{display:block;height:100%;width:0;border-radius:4px;transition:width .8s cubic-bezier(.2,.9,.3,1.1)}' +
    '.al-nr .al-rb{position:static;transform:none;font-size:15px;min-width:46px;padding:5px 8px}' +
    '.al-e{padding:22px;text-align:center;color:#a9afc8;border-radius:18px;border:1px dashed rgba(255,255,255,.2)}' +
    // banca
    '.al-bn{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}.al-bn>div{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:10px;border-radius:16px;background:rgba(255,255,255,.03);border:1px dashed color-mix(in srgb,var(--tc) 45%,transparent)}.al-bn>div>small{flex:1 1 100%;font:900 11px "JetBrains Mono",monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--tc);filter:brightness(1.4)}' +
    '.al-bn a{display:inline-flex;align-items:center;gap:6px;padding:5px 10px 5px 5px;border-radius:999px;background:rgba(255,255,255,.06);color:inherit;text-decoration:none;font:700 12.5px Archivo,sans-serif;transition:background-color .15s}.al-bn a:hover{background:rgba(255,255,255,.14)}.al-bn a i{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font:900 9px Archivo,sans-serif;font-style:normal;background:var(--tc)}.al-bn a.dt{background:rgba(255,210,63,.14);color:#ffd23f}' +
    '.al-ar.vert{height:500px;background:radial-gradient(100% 55% at 50% 0,color-mix(in srgb,var(--hc) 45%,transparent),transparent 72%),radial-gradient(100% 55% at 50% 100%,color-mix(in srgb,var(--ac) 45%,transparent),transparent 72%),repeating-linear-gradient(180deg,#17704c 0 9.09%,#135f41 9.09% 18.18%)}.al-ar.vert .al-zn.h{left:28px;top:24px;bottom:auto}.al-ar.vert .al-zn.a{right:28px;bottom:24px}' +
    '@media(max-width:640px){.al-tm{grid-template-columns:1fr 1fr}.al-sc{display:none}.al-t{padding:8px}.al-t small{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.al-pa{grid-template-columns:1fr 1fr!important}.al-pp{padding:6px 7px;gap:6px}.al-pp span{font-size:12px}.al-pp.a{flex-direction:row-reverse!important;text-align:right!important}.al-pp.a .al-rb{margin-left:0!important;margin-right:auto!important}.al-pp .al-rb{font-size:10.5px;min-width:28px}.al-k{width:78px}.al-k .hx{width:50px;height:55px}.al-k .hx .av{width:43px;height:48px;font-size:14px}.al-rb{top:42px;font-size:11px}.al-vs{width:66px;height:66px;margin:-33px 0 0 -33px}.al-vs b{font-size:19px}.al-t i{width:34px;height:34px}.al-t b{font-size:14px}.al-sc{min-width:58px}.al-tabs{width:100%}.al-tabs button{flex:1;padding:9px 6px}.al-bn{grid-template-columns:1fr}.al-cmp{grid-template-columns:36px 1fr auto 1fr 36px}.al-cmp>span{min-width:70px;font-size:9.5px}.al-cmp>b{font-size:15px}.al-pa>em{display:none}}' +
    '@media(prefers-reduced-motion:reduce){.al *{animation:none!important;transition:none!important}}';
  var st2 = h('style'); st2.textContent = CSS2; document.head.appendChild(st2);
  var st3 = h('style'); st3.textContent = '' +
    '.st3{position:relative;height:500px;border-radius:28px;overflow:hidden;isolation:isolate;background:radial-gradient(120% 70% at 50% 110%,#0d3a2a,transparent 60%),linear-gradient(180deg,#05060c,#0a0d1c 45%,#081410);border:2px solid rgba(255,255,255,.1);box-shadow:0 24px 60px -24px #000}' +
    '.st3-cr{position:absolute;left:0;right:0;top:0;height:120px;z-index:0;background:radial-gradient(circle,rgba(255,255,255,.22) 1.2px,transparent 1.8px) 0 0/9px 8px,radial-gradient(circle,color-mix(in srgb,var(--hc) 80%,#fff) 1.4px,transparent 2px) 3px 4px/17px 13px,radial-gradient(circle,color-mix(in srgb,var(--ac) 80%,#fff) 1.4px,transparent 2px) 11px 2px/19px 11px;-webkit-mask:linear-gradient(180deg,#000,transparent);mask:linear-gradient(180deg,#000 30%,transparent);opacity:.55;animation:st3Cr 1.6s steps(2) infinite}' +
    '@keyframes st3Cr{50%{background-position:1px 1px,4px 3px,10px 3px}}' +
    '.st3-l{position:absolute;top:-40px;z-index:1;width:60%;height:520px;pointer-events:none;mix-blend-mode:screen;opacity:.55;animation:st3L 5s ease-in-out infinite}.st3-l.l{left:-12%;background:conic-gradient(from 150deg at 0 0,transparent 0deg,rgba(255,255,255,.3) 12deg,transparent 30deg);transform-origin:0 0}.st3-l.r{right:-12%;background:conic-gradient(from 180deg at 100% 0,transparent 0deg,rgba(255,255,255,.3) 18deg,transparent 30deg);transform-origin:100% 0;animation-delay:-2.5s}' +
    '@keyframes st3L{50%{opacity:.85;transform:rotate(3deg)}}' +
    '.st3-led{position:absolute;left:4%;right:4%;top:92px;z-index:2;height:26px;overflow:hidden;border-radius:4px;background:#05060c;border:1px solid rgba(255,255,255,.15);box-shadow:0 0 22px rgba(198,255,26,.18);transform:perspective(600px) rotateX(18deg)}' +
    '.st3-lr{display:flex;gap:40px;width:max-content;padding:0 20px;animation:st3M 26s linear infinite}.st3-lr span{font:900 15px/26px Archivo,sans-serif;font-stretch:120%;text-transform:uppercase;letter-spacing:.06em;white-space:nowrap;background:radial-gradient(circle,currentColor 45%,transparent 50%) 0 0/3px 3px;-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 4px currentColor)}' +
    '.st3-lr .c0{color:#c6ff1a}.st3-lr .c1{color:#ff8a1f}.st3-lr .c2{color:#22d3ee}@keyframes st3M{to{transform:translateX(-50%)}}' +
    '.st3-sc{position:absolute;left:2.5%;right:2.5%;top:128px;bottom:16px;z-index:3;perspective:1000px;perspective-origin:50% -10%}' +
    '.st3{--rx:0deg}.st3 .al-ar{position:absolute;inset:0;height:auto;border-radius:18px;transform-style:preserve-3d;border:4px solid rgba(255,255,255,.55);box-shadow:0 0 0 6px rgba(0,0,0,.35),0 30px 60px rgba(0,0,0,.6),0 0 80px color-mix(in srgb,var(--hc) 30%,transparent)}' +
    '.st3 .al-ar .pl-out{inset:12px}' +
    '.st3-wm{position:absolute;top:50%;z-index:1;transform:translateY(-50%);font:900 clamp(30px,6vw,64px)/1 Archivo,sans-serif;font-stretch:125%;text-transform:uppercase;color:rgba(255,255,255,.09);white-space:nowrap;pointer-events:none;max-width:44%;overflow:hidden}.st3-wm.h{left:4%}.st3-wm.a{right:4%;text-align:right}' +
    '.st3-pl{position:absolute;inset:0;z-index:5;transform-style:preserve-3d}' +
    '.st3-e{position:absolute;top:55%;transform:translate(-50%,-50%);color:rgba(255,255,255,.7);font-size:13px}' +
    '.st3-sh{position:absolute;width:86px;height:26px;transform:translate(-50%,58px);border-radius:50%;background:radial-gradient(closest-side,color-mix(in srgb,var(--tc) 90%,#fff),color-mix(in srgb,var(--tc) 40%,transparent) 55%,transparent);filter:blur(2px);opacity:.85;animation:st3S 2.4s ease-in-out infinite}@keyframes st3S{50%{opacity:.5;transform:translate(-50%,58px) scale(1.15)}}' +
    // carta del jugador
    '.st3 .al-k{position:absolute;width:auto;transform:translate(-50%,-50%);transform-origin:50% 50%;animation:st3In .6s cubic-bezier(.2,1.3,.4,1) both;display:block;background:none;border:0;padding:0;cursor:pointer}' +
    '@keyframes st3In{from{opacity:0;transform:translate(-50%,-140%) scale(.6)}}' +
    '.st3 .al-k .cd{position:relative;display:grid;justify-items:center;width:98px;padding:7px 6px 6px;border-radius:12px 12px 16px 16px;background:linear-gradient(165deg,color-mix(in srgb,var(--tc) 85%,#fff) 0%,var(--tc) 35%,color-mix(in srgb,var(--tc) 45%,#000) 100%);box-shadow:0 0 0 2px rgba(255,255,255,.55),0 10px 18px rgba(0,0,0,.55);clip-path:polygon(0 8%,8% 0,92% 0,100% 8%,100% 86%,50% 100%,0 86%);transition:transform .2s;animation:alF 3.2s ease-in-out infinite;animation-delay:var(--fd)}' +
    '.st3 .al-k:hover .cd,.st3 .al-k.on .cd{transform:translateY(-8px) scale(1.06)}' +
    '.st3 .al-k .rt{position:absolute;left:6px;top:4px;font:italic 900 19px/1 Archivo,sans-serif;font-stretch:115%;color:#fff;text-shadow:0 2px 0 rgba(0,0,0,.45)}.st3 .al-k .ps{position:absolute;right:6px;top:7px;font:900 8px "JetBrains Mono",monospace;color:rgba(255,255,255,.75)}' +
    '.st3 .al-k .av{width:54px;height:54px;margin-top:14px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(160deg,#2a2f55,#141733);font:900 16px Archivo,sans-serif;color:#fff;box-shadow:0 0 0 3px rgba(255,255,255,.75)}' +
    '.st3 .al-k .nm{display:block;max-width:88px;margin-top:5px;font:900 12.5px/1.1 Archivo,sans-serif;text-transform:uppercase;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-shadow:0 1px 2px rgba(0,0,0,.6);background:none;transform:none;padding:0}' +
    '.st3 .al-k .ft{display:flex;gap:3px;min-height:15px;margin:3px 0 8px}.st3 .al-k .ft i{font-style:normal;font:900 9px Archivo,sans-serif;padding:1px 5px;border-radius:999px;background:rgba(0,0,0,.4);color:#fff}' +
    '.st3 .al-k.hot .cd{box-shadow:0 0 0 2px #c6ff1a,0 0 22px rgba(198,255,26,.7),0 10px 18px rgba(0,0,0,.55)}' +
    '.st3 .al-k.mvp .cd{background:linear-gradient(115deg,#7a5200,#ffd23f 25%,#fff4bf 35%,#ffb800 50%,#7a5200 75%,#ffd23f);background-size:300% 100%;animation:alF 3.2s ease-in-out infinite,st3H 3s linear infinite;box-shadow:0 0 0 2px #fff4bf,0 0 28px rgba(255,210,63,.85),0 10px 18px rgba(0,0,0,.55)}.st3 .al-k.mvp .rt,.st3 .al-k.mvp .nm{color:#2a1a00;text-shadow:none}.st3 .al-k.mvp .ps{color:#4a3300}' +
    '@keyframes st3H{to{background-position:300% 0}}' +
    '.st3 .al-k.gl .cd:after{content:"";position:absolute;inset:-2px;border-radius:inherit;background:linear-gradient(0deg,rgba(255,106,0,.55),transparent 45%);mix-blend-mode:screen;animation:st3G 1.2s ease-in-out infinite alternate}@keyframes st3G{to{opacity:.35}}' +
    '.st3 .al-cr{top:-26px;font-size:24px}' +
    '.st3 .al-vs{width:104px;height:104px;margin:-52px 0 0 -52px}' +
    '.st3 .al-pop{z-index:40}.st3 .st3-sh{z-index:1}' +
    '@media(max-width:640px){.st3{height:330px;border-radius:20px}.st3-sh{transform:translate(-50%,30px)!important}.st3-wm{font-size:26px}.st3-cr{height:80px}.st3-led{top:58px;height:20px}.st3-lr span{font-size:12px;line-height:20px}.st3-sc{top:86px;left:2%;right:2%;bottom:10px}.st3 .al-k .cd{width:52px;padding:4px 3px 3px}.st3 .al-k .av{width:28px;height:28px;font-size:10px;margin-top:11px;box-shadow:0 0 0 2px rgba(255,255,255,.75)}.st3 .al-k .rt{font-size:12px;left:4px}.st3 .al-k .ps{display:none}.st3 .al-k .rt.good{background:#2ee59d}.st3 .al-k .rt.mid{background:#ffd23f}.st3 .al-k .rt.low{background:#ff5a6a;color:#fff!important}.st3 .al-k .rt.na{background:#3a3f5c;color:#cfd3e6!important}.st3 .al-k .nm{font-size:8px;max-width:48px}.st3 .al-k .ft{min-height:11px;margin:2px 0 5px}.st3 .al-k .ft i{font-size:7.5px;padding:0 3px}.st3-sh{width:58px;height:18px}.st3 .al-vs{width:62px;height:62px;margin:-31px 0 0 -31px}.st3 .al-vs b{font-size:18px}.st3 .al-cr{font-size:17px;top:-20px}.st3 .pl-cc{width:70px;height:70px;margin:-35px 0 0 -35px}}' +
    '.st3 .al-k .cd{width:auto!important;padding:0!important;background:none!important;box-shadow:none!important;clip-path:none!important;border-radius:0;display:flex;flex-direction:column;align-items:center}.st3 .al-k .cd:after{display:none}.st3 .al-k .av{width:58px!important;height:58px!important;margin:0!important;font-size:18px!important;border-radius:50%;box-shadow:0 0 0 3px var(--tc),0 0 0 5px rgba(0,0,0,.45),0 0 22px color-mix(in srgb,var(--tc) 70%,transparent)!important}.st3 .al-k .ps{display:none}.st3 .al-k .rt.good{background:#2ee59d}.st3 .al-k .rt.mid{background:#ffd23f}.st3 .al-k .rt.low{background:#ff5a6a;color:#fff!important}.st3 .al-k .rt.na{background:#3a3f5c;color:#cfd3e6!important}.st3 .al-k .rt{position:absolute!important;left:auto!important;right:-12px;top:-6px!important;z-index:2;min-width:30px;padding:2px 6px;border-radius:999px;font:900 11.5px/1.2 Archivo,sans-serif!important;font-style:normal!important;text-align:center;color:#0d0d10!important;text-shadow:none!important;background:#c6ff1a;box-shadow:0 2px 0 rgba(0,0,0,.45)}.st3 .al-k .nm{margin-top:7px!important;max-width:110px!important;padding:3px 10px!important;border-radius:999px;background:rgba(5,6,12,.78)!important;font:800 12.5px/1.2 Archivo,sans-serif!important;text-transform:none!important;box-shadow:0 0 0 1px color-mix(in srgb,var(--tc) 60%,transparent)}.st3 .al-k .ft{position:absolute;left:-12px;top:-6px;margin:0!important;min-height:0!important;flex-direction:column;gap:2px}.st3 .al-k .ft i{background:#fff!important;color:#0d0d10!important;font-size:10px!important;padding:1px 5px!important;box-shadow:0 2px 0 rgba(0,0,0,.4)}.st3 .al-k:hover .cd,.st3 .al-k.on .cd{transform:translateY(-5px) scale(1.08)}.st3 .al-k.on .av{box-shadow:0 0 0 3px #c6ff1a,0 0 0 5px rgba(0,0,0,.45),0 0 26px rgba(198,255,26,.7)!important}.st3 .al-k.mvp .cd{background:none!important;animation:alF 3.2s ease-in-out infinite!important}.st3 .al-k.mvp .av{box-shadow:0 0 0 3px #ffd23f,0 0 0 5px rgba(0,0,0,.45),0 0 28px rgba(255,210,63,.85)!important}.st3 .al-k.mvp .nm{color:#ffd23f!important}.st3 .al-k.hot .cd{box-shadow:none!important}.st3 .al-cr{top:-30px!important}.st3-sh{transform:translate(-50%,26px)!important;width:74px}@media(max-width:640px){.st3 .al-k .av{width:38px!important;height:38px!important;font-size:13px!important}.st3 .al-k .nm{font-size:9.5px!important;max-width:70px!important;padding:2px 7px!important}.st3 .al-k .rt{font-size:9.5px!important;min-width:22px;right:-10px;padding:1px 4px}.st3 .al-k .ft i{font-size:8px!important}.st3-sh{transform:translate(-50%,16px)!important;width:50px}}' +
    '@media(prefers-reduced-motion:reduce){.st3 *{animation:none!important}}';
  document.head.appendChild(st3);
  var VIEW = 'arena'; try { VIEW = localStorage.getItem('magna_alv') || 'arena'; } catch (e) {}
  var POS2 = { 1: [[28, 50]], 2: [[24, 32], [24, 70]], 3: [[18, 50], [36, 26], [36, 74]], 4: [[16, 32], [16, 70], [36, 22], [36, 78]], 5: [[12, 50], [26, 24], [26, 76], [40, 38], [40, 64]] };
  function hexAv(pid, cls) { var p = by(S().players, pid), d = pav(h('span', cls || 'av', ini(p ? p.name : '?')), pid); return d; }
  function teamAvg(X, D) { var L = X.played.map(function (id) { return D.R[id]; }).filter(function (v) { return v != null; }); return L.length ? L.reduce(function (a, b) { return a + b; }, 0) / L.length : null; }
  function teamGoals(X, D) { return X.played.reduce(function (a, id) { return a + (D.goals[id] || 0); }, 0); }
  function popCard(arena, k, pid, D) {
    var old = arena.querySelector('.al-pop'); [].forEach.call(arena.querySelectorAll('.al-k.on'), function (x) { x.classList.remove('on'); }); if (old) { var same = old.dataset.p == pid; old.remove(); if (same) return; }
    var p = by(S().players, pid), ps = (MAGNA.playerStats ? MAGNA.playerStats()[pid] : null) || {}, b = h('div', 'al-pop'); b.dataset.p = pid; b.style.setProperty('--tc', col(p.teamId)); k.classList.add('on');
    var nb = h('b'); nb.appendChild(MAGNA_COS.pn(p.name, pid, { plain: true, title: true })); if (D.mvp === pid) nb.appendChild(document.createTextNode(' 👑')); b.appendChild(nb);
    var tr = MAGNA.tierOf ? MAGNA.tierOf(ps.media) : { name: '' }; b.appendChild(h('small', null, MAGNA.teamName(p.teamId) + ' · media ' + (ps.media != null ? ps.media : 10) + (tr.name ? ' · ' + tr.name : '')));
    var g = h('div', 'st'); [[rt(D.R[pid]), 'Nota'], [String(D.goals[pid] || 0), 'Goles'], [String(ps.mvp || 0), 'MVP total']].forEach(function (x) { var d = h('div'); d.appendChild(h('b', null, x[0])); d.appendChild(h('small', null, x[1])); g.appendChild(d); }); b.appendChild(g);
    var lk = h('div', 'lk'), a0 = h('a', null, 'Ver perfil →'); a0.href = MAGNA_COS.profileUrl(pid); lk.appendChild(a0); var a = h('a', null, MAGNA.teamName(p.teamId) + ' →'); a.href = 'equipo.html?id=' + p.teamId; lk.appendChild(a); b.appendChild(lk);
    var pr = arena.getBoundingClientRect(), kr = k.getBoundingClientRect(), x = kr.left - pr.left + kr.width / 2, y = kr.top - pr.top + kr.height / 2; b.style.left = Math.max(120, Math.min(pr.width - 120, x)) + 'px'; b.style.top = y + 'px'; if (y < Math.max(200, pr.height * .55)) b.classList.add('dn');
    arena.appendChild(b);
  }
  function arenaView(m, D) {
    var hn = MAGNA.teamName(D.h.tid), an = MAGNA.teamName(D.a.tid), sd0 = h('div', 'st3');
    // estadio: reflectores, público y pantalla LED que corre
    sd0.appendChild(h('i', 'st3-l l')); sd0.appendChild(h('i', 'st3-l r')); sd0.appendChild(h('div', 'st3-cr'));
    var led = h('div', 'st3-led'), lr = h('div', 'st3-lr'), txt = [hn + ' vs ' + an, m.status === 'live' ? '● EN VIVO ' + (m.hs || 0) + '-' + (m.as || 0) : m.status === 'finished' ? 'FINAL ' + (m.hs || 0) + '-' + (m.as || 0) : 'PRÓXIMO PARTIDO', 'MAGNA ARENA', m.round || 'MAGNA SPORTS'];
    for (var r = 0; r < 4; r++) txt.forEach(function (t, i) { lr.appendChild(h('span', 'c' + (i % 3), t)); }); led.appendChild(lr); sd0.appendChild(led);
    var sc = h('div', 'st3-sc'), ar = h('div', 'al-ar'); sc.appendChild(ar); sd0.appendChild(sc);
    ['pl-out', 'pl-mid', 'pl-cc', 'pl-dot', 'pl-box h', 'pl-box a', 'pl-gb h', 'pl-gb a', 'pl-arc h', 'pl-arc a', 'pl-goal h', 'pl-goal a'].forEach(function (c) { ar.appendChild(h('i', 'pl ' + c)); });
    var wm1 = h('span', 'st3-wm h', hn), wm2 = h('span', 'st3-wm a', an); ar.appendChild(wm1); ar.appendChild(wm2);
    var vs = h('div', 'al-vs'); vs.appendChild(h('b', null, m.status === 'scheduled' ? 'VS' : (m.hs || 0) + '-' + (m.as || 0))); vs.appendChild(h('small', null, m.status === 'live' ? 'EN VIVO' : m.status === 'finished' ? 'FINAL' : 'PRONTO')); ar.appendChild(vs);
    var layer = h('div', 'st3-pl'); ar.appendChild(layer);
    ['h', 'a'].forEach(function (sd) { var X = D[sd], n = X.field.length;
      if (!n) { var e = h('div', 'st3-e', 'Sin jugadores'); e.style.left = sd === 'h' ? '25%' : '75%'; layer.appendChild(e); }
      X.field.forEach(function (pid, i) { var p = by(S().players, pid); if (!p) return; var ps = (POS2[n] || POS2[3])[i] || [25, 50], x = sd === 'h' ? ps[0] : 100 - ps[0], y = ps[1];
        // proyección de la cancha inclinada: más lejos = más arriba, más chico y más al centro
        var depth = y / 100, sy = y, k2 = 1, sx = x;
        var sh = h('i', 'st3-sh'); sh.style.left = sx + '%'; sh.style.top = sy + '%'; sh.style.setProperty('--tc', col(p.teamId)); sh.style.setProperty('--k', k2); layer.appendChild(sh);
        var r = D.R[pid], mvp = D.mvp === pid, k = h('button', 'al-k' + (mvp ? ' mvp' : '') + (r != null && r >= 8 ? ' hot' : '') + (D.goals[pid] ? ' gl' : '')); k.type = 'button';
        k.dataset.p = pid; k.style.left = sx + '%'; k.style.top = sy + '%'; k.style.zIndex = 10 + Math.round(depth * 10); k.style.setProperty('--k', k2); k.style.setProperty('--tc', col(p.teamId)); k.style.animationDelay = (i * 90 + (sd === 'a' ? 180 : 0)) + 'ms'; k.style.setProperty('--fd', (i * .5 + (sd === 'a' ? .25 : 0)) + 's');
        var cd = h('span', 'cd'); cd.appendChild(h('span', 'rt ' + rc(r), rt(r))); cd.appendChild(h('span', 'ps', sd === 'h' ? 'LOC' : 'VIS'));
        var av = pav(h('span', 'av', ini(p.name)), pid); cd.appendChild(av); var nm = h('span', 'nm'); nm.appendChild(MAGNA_COS.pn(p.name, pid, { plain: true })); cd.appendChild(nm);
        var ft = h('span', 'ft'); if (D.goals[pid]) ft.appendChild(h('i', null, '⚽' + (D.goals[pid] > 1 ? '×' + D.goals[pid] : ''))); if (D.subIn[pid]) ft.appendChild(h('i', null, '⇄')); if (mvp) ft.appendChild(h('i', null, 'MVP')); cd.appendChild(ft);
        k.appendChild(cd); if (mvp) k.appendChild(h('span', 'al-cr', '👑'));
        k.setAttribute('aria-label', p.name + (r != null ? ', nota ' + rt(r) : '') + (D.goals[pid] ? ', ' + D.goals[pid] + ' goles' : '') + (mvp ? ', MVP' : ''));
        k.onclick = function (ev) { ev.stopPropagation(); popCard(sd0, k, pid, D); }; layer.appendChild(k); }); });
    sd0.addEventListener('click', function () { var o = sd0.querySelector('.al-pop'); if (o) o.remove(); [].forEach.call(layer.querySelectorAll('.al-k.on'), function (x) { x.classList.remove('on'); }); });
    return sd0;
  }
  function duelView(m, D) {
    var du = h('div', 'al-du'), H = D.h, A2 = D.a, PS = MAGNA.playerStats ? MAGNA.playerStats() : {};
    function avgMedia(X) { var L = X.field.map(function (id) { return (PS[id] || {}).media; }).filter(function (v) { return v != null; }); return L.length ? Math.round(L.reduce(function (a, b) { return a + b; }, 0) / L.length) : 10; }
    var rows = m.status === 'scheduled' ? [['Media del equipo', avgMedia(H), avgMedia(A2), 0], ['Partidos jugados', H.field.reduce(function (a, id) { return a + ((PS[id] || {}).pj || 0); }, 0), A2.field.reduce(function (a, id) { return a + ((PS[id] || {}).pj || 0); }, 0), 0], ['MVP en su carrera', H.field.reduce(function (a, id) { return a + ((PS[id] || {}).mvp || 0); }, 0), A2.field.reduce(function (a, id) { return a + ((PS[id] || {}).mvp || 0); }, 0), 0]]
      : [['Nota promedio', teamAvg(H, D), teamAvg(A2, D), 1], ['Goles', teamGoals(H, D), teamGoals(A2, D), 0], ['Notas de 7 o más', H.played.filter(function (id) { return (D.R[id] || 0) >= 7; }).length, A2.played.filter(function (id) { return (D.R[id] || 0) >= 7; }).length, 0], ['Jugadores usados', H.played.length, A2.played.length, 0]];
    rows.forEach(function (r) { var a = r[1] == null ? 0 : r[1], b = r[2] == null ? 0 : r[2], mx = Math.max(a, b, r[3] ? 10 : 1), c = h('div', 'al-cmp'), f = function (v) { return v == null ? '–' : r[3] ? rt(v) : String(v); };
      c.appendChild(h('b', a > b ? 'w' : null, f(r[1]))); var bh = h('div', 'al-bar h'), ih = h('i'); bh.appendChild(ih); c.appendChild(bh); c.appendChild(h('span', null, r[0])); var ba = h('div', 'al-bar a'), ia = h('i'); ba.appendChild(ia); c.appendChild(ba); c.appendChild(h('b', b > a ? 'w' : null, f(r[2])));
      requestAnimationFrame(function () { requestAnimationFrame(function () { ih.style.width = (a / mx * 100) + '%'; ia.style.width = (b / mx * 100) + '%'; }); }); du.appendChild(c); });
    var pr = h('div', 'al-pr'); pr.appendChild(h('h4', null, m.status === 'scheduled' ? '⚔️ Duelos previstos' : '⚔️ Duelos uno a uno'));
    function sorted(X) { var L = (m.status === 'scheduled' ? X.field : X.played).slice(); return L.sort(function (x, y) { return m.status === 'scheduled' ? ((PS[y] || {}).media || 0) - ((PS[x] || {}).media || 0) : (D.R[y] || 0) - (D.R[x] || 0); }); }
    var LH = sorted(H), LA = sorted(A2), n = Math.max(LH.length, LA.length);
    for (var i = 0; i < n; i++) { var pa = h('div', 'al-pa'), vh = LH[i], va = LA[i], sh = vh != null ? (m.status === 'scheduled' ? (PS[vh] || {}).media : D.R[vh]) : null, sa = va != null ? (m.status === 'scheduled' ? (PS[va] || {}).media : D.R[va]) : null;
      [[vh, 'h', sh, sa], [va, 'a', sa, sh]].forEach(function (x, j) { if (x[0] == null) { pa.appendChild(h('span')); } else { var p = by(S().players, x[0]), el = h('a', 'al-pp ' + x[1] + (x[2] != null && x[3] != null && x[2] > x[3] ? ' win' : '')); el.href = MAGNA_COS.profileUrl(x[0]); el.style.setProperty('--tc', col(p.teamId)); el.appendChild(h('i', 'mini', ini(p.name))); el.appendChild(h('span', null, p.name + (D.goals[x[0]] ? ' ⚽' : '') + (D.mvp === x[0] ? ' 👑' : '')));
          var rb = m.status === 'scheduled' ? h('span', 'al-rb ' + (x[2] >= 60 ? 'top' : x[2] >= 40 ? 'good' : x[2] >= 25 ? 'mid' : 'na'), String(x[2] == null ? 10 : x[2])) : h('span', 'al-rb ' + rc(x[2]), rt(x[2])); el.appendChild(rb); pa.appendChild(el); } if (!j) pa.appendChild(h('em', null, 'VS')); }); pr.appendChild(pa); }
    if (!n) pr.appendChild(h('div', 'al-e', 'Sin jugadores para comparar.')); du.appendChild(pr); return du;
  }
  function notesView(m, D) {
    var nt = h('div', 'al-nt'), L = D.h.played.concat(D.a.played).concat(Object.keys(D.R).map(Number)).filter(function (id, i, a) { return a.indexOf(id) === i && by(S().players, id); });
    var rated = L.filter(function (id) { return D.R[id] != null; }).sort(function (x, y) { return D.R[y] - D.R[x] || (D.goals[y] || 0) - (D.goals[x] || 0); });
    if (!rated.length) { nt.appendChild(h('div', 'al-e', m.status === 'scheduled' ? '⏳ Las notas aparecen cuando el partido empiece. Cada jugador recibe una nota de 1 a 10.' : '📝 Todavía no hay notas para este partido.')); return nt; }
    rated.forEach(function (id, i) { var p = by(S().players, id), r = D.R[id], a = h('a', 'al-nr'); a.dataset.p = id; a.href = MAGNA_COS.profileUrl(id); a.style.setProperty('--tc', col(p.teamId)); a.style.animationDelay = i * 50 + 'ms';
      a.appendChild(h('span', 'ps', String(i + 1))); a.appendChild(h('i', 'mini', ini(p.name))); var w = h('div', 'w'); w.appendChild(h('b', null, p.name + (D.mvp === id ? ' 👑' : ''))); w.appendChild(h('small', null, MAGNA.teamName(p.teamId) + (D.goals[id] ? ' · ' + D.goals[id] + (D.goals[id] === 1 ? ' gol' : ' goles') : '') + (D.subIn[id] ? ' · entró de cambio' : '')));
      var nb = h('div', 'al-nb'), bi = h('i'); bi.style.background = r >= 8 ? 'linear-gradient(90deg,#a8e000,#e9ff7a)' : r >= 6.5 ? 'linear-gradient(90deg,#1fb87a,#5dffc0)' : r >= 6 ? 'linear-gradient(90deg,#f5a400,#ffe066)' : 'linear-gradient(90deg,#e02424,#ff8a8a)'; nb.appendChild(bi); w.appendChild(nb); a.appendChild(w);
      a.appendChild(h('span', 'al-rb ' + rc(r), rt(r))); setTimeout(function () { bi.style.width = (r * 10) + '%'; }, 60 + i * 50); nt.appendChild(a); });
    return nt;
  }
  function keys(m, D) { if (m.status === 'scheduled') return null; var w = h('div', 'al-keys'), all = D.h.played.concat(D.a.played), k = 0;
    function add(ic, html) { var c = h('div', 'al-key'); c.style.setProperty('--r', ((k % 2 ? 1 : -1) * (1 + k % 3 * .5)) + 'deg'); c.style.animationDelay = k * 80 + 'ms'; k++; c.appendChild(h('i', null, ic)); var s2 = h('span'); s2.innerHTML = html; c.appendChild(s2); w.appendChild(c); }
    function nm(id) { var p = by(S().players, id); return p ? p.name.replace(/[<>&]/g, '') : '?'; }
    if (D.mvp) add('👑', 'MVP: <b>' + nm(D.mvp) + '</b>');
    var gs = all.filter(function (id) { return D.goals[id]; }).sort(function (a, b) { return D.goals[b] - D.goals[a]; }); if (gs.length) add('⚽', 'Goleador: <b>' + nm(gs[0]) + '</b> (' + D.goals[gs[0]] + ')');
    var rs = all.filter(function (id) { return D.R[id] != null; }).sort(function (a, b) { return D.R[b] - D.R[a]; }); if (rs.length) add('📈', 'Mejor nota: <b>' + nm(rs[0]) + '</b> ' + rt(D.R[rs[0]]));
    var ah = teamAvg(D.h, D), aa = teamAvg(D.a, D); if (ah != null && aa != null && ah !== aa) add('🛡️', 'Mejor promedio: <b>' + MAGNA.teamName(ah > aa ? D.h.tid : D.a.tid).replace(/[<>&]/g, '') + '</b> ' + rt(Math.max(ah, aa)));
    var tg = teamGoals(D.h, D) + teamGoals(D.a, D); if (tg) add('🔥', '<b>' + tg + '</b> ' + (tg === 1 ? 'gol' : 'goles') + ' en total');
    return w.children.length ? w : null; }
  function lineups(m, D) {
    var box = document.getElementById('alineaciones'); if (!box) { box = h('section', 'al'); box.id = 'alineaciones'; var bn = document.getElementById('marcador'); if (!bn) return; bn.parentNode.insertBefore(box, bn.nextSibling); }
    var again = box.dataset.mid == String(m.id) && box.dataset.v === VIEW; box.dataset.mid = m.id; box.dataset.v = VIEW; box.className = 'al' + (again ? ' re' : ''); box.innerHTML = ''; box.style.setProperty('--hc', col(D.h.tid)); box.style.setProperty('--ac', col(D.a.tid));
    var hd = h('div', 'al-h'), tl = h('div'), h2 = h('h2'); h2.appendChild(document.createTextNode('Alinea')); h2.appendChild(h('em', null, 'ciones')); tl.appendChild(h2); tl.appendChild(h('span', 'al-st' + (m.status === 'live' ? ' live' : m.status === 'finished' ? ' fin' : ''), m.status === 'live' ? '● En cancha ahora' : m.status === 'finished' ? 'Así terminaron' : 'Titulares previstos')); hd.appendChild(tl);
    var tabs = h('div', 'al-tabs'); tabs.setAttribute('role', 'tablist'); [['arena', '⚽ Cancha'], ['duelo', '⚔️ Duelo'], ['notas', '📊 Notas']].forEach(function (t) { var b = h('button', t[0] === VIEW ? 'on' : null, t[1]); b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', t[0] === VIEW ? 'true' : 'false'); b.onclick = function () { VIEW = t[0]; try { localStorage.setItem('magna_alv', VIEW); } catch (e) {} lastKey = ''; draw(); }; tabs.appendChild(b); }); hd.appendChild(tabs); box.appendChild(hd);
    var tm = h('div', 'al-tm'); ['h', 'a'].forEach(function (sd, j) { var X = D[sd], a = h('a', 'al-t ' + sd); a.href = 'equipo.html?id=' + X.tid; a.style.setProperty('--c', col(X.tid)); var ci = h('i'), u = MAGNA.crestUrl(X.tid); if (u) ci.style.backgroundImage = 'url("' + u + '")'; a.appendChild(ci);
      var d = h('div'); d.appendChild(h('b', null, MAGNA.teamName(X.tid))); var av = teamAvg(X, D); d.appendChild(h('small', null, (av != null ? 'Nota ' + rt(av) + ' · ' : '') + X.field.length + ' en cancha' + (X.dt ? ' · DT ' + X.dt.name : ''))); a.appendChild(d); tm.appendChild(a);
      if (!j) { var sc = h('div', 'al-sc'); sc.appendChild(h('b', null, m.status === 'scheduled' ? 'VS' : (m.hs || 0) + '-' + (m.as || 0))); sc.appendChild(h('small', null, m.status === 'live' ? 'EN VIVO' : m.status === 'finished' ? 'FINAL' : (m.round || 'PRONTO').toUpperCase().slice(0, 14))); tm.appendChild(sc); } });
    box.appendChild(tm);
    box.appendChild(VIEW === 'duelo' ? duelView(m, D) : VIEW === 'notas' ? notesView(m, D) : arenaView(m, D));
    var ky = keys(m, D); if (ky) box.appendChild(ky);
    var bn2 = h('div', 'al-bn'); ['h', 'a'].forEach(function (sd) { var X = D[sd], d = h('div'); d.style.setProperty('--tc', col(X.tid)); d.appendChild(h('small', null, '🪑 Banca · ' + MAGNA.teamName(X.tid)));
      if (!X.bench.length && !X.dt) d.appendChild(h('span', null, 'Sin suplentes'));
      X.bench.forEach(function (pid) { var p = by(S().players, pid); if (!p) return; var a = h('a'); a.href = MAGNA_COS.profileUrl(pid); a.appendChild(h('i', null, ini(p.name))); a.appendChild(document.createTextNode(p.name + (D.goals[pid] ? ' ⚽' : '') + (D.R[pid] != null ? ' · ' + rt(D.R[pid]) : ''))); d.appendChild(a); });
      if (X.dt) { var dt = h('a', 'dt'); dt.href = MAGNA_COS.profileUrl(X.dt.id); dt.appendChild(h('i', null, '🧢')); dt.appendChild(document.createTextNode('DT · ' + X.dt.name)); d.appendChild(dt); }
      bn2.appendChild(d); }); box.appendChild(bn2);
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
        c.appendChild(h('span', 'hl-r ' + rc(D.R[pid]), rt(D.R[pid]))); var cb2 = h('b'); cb2.appendChild(MAGNA_COS.pn(p.name, pid, { plain: true })); c.appendChild(cb2); c.appendChild(h('small', null, (pid === D.mvp ? '⭐ MVP' : pid === best ? '🔥 Mejor de su equipo' : D.subIn[pid] ? '⇄ Entró de cambio' : 'Titular'))); g.appendChild(c); });
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

  // ---------- animaciones: gol y cambio de nota ----------
  var PREV = null;
  function changes(m, D) { var out = { goals: [], rates: [] }; if (PREV && PREV.mid === m.id) {
      Object.keys(D.goals).forEach(function (id) { var d = D.goals[id] - (PREV.goals[id] || 0); if (d > 0) out.goals.push(Number(id)); });
      Object.keys(D.R).forEach(function (id) { var a = PREV.R[id], b = D.R[id]; if (b != null && a !== b) out.rates.push({ id: Number(id), d: a == null ? null : Math.round((b - a) * 10) / 10, v: b }); }); }
    PREV = { mid: m.id, goals: Object.assign({}, D.goals), R: Object.assign({}, D.R) }; return out; }
  var CSS3 = '' +
    '.al.re .al-k,.al.re .al-key,.al.re .al-nr{animation:none!important}.al.re .al-k .cd{animation:alF 3.2s ease-in-out infinite!important;animation-delay:var(--fd)!important}' +
    '.gx-ring{position:absolute;z-index:30;left:50%;top:50%;width:60px;height:60px;margin:-30px 0 0 -30px;border-radius:50%;border:4px solid var(--tc,#c6ff1a);pointer-events:none;animation:gxR 1s ease-out forwards}@keyframes gxR{to{transform:scale(4);opacity:0;border-width:1px}}' +
    '.gx-txt{position:absolute;z-index:31;left:50%;bottom:100%;margin-bottom:22px;transform:translateX(-50%);font:italic 900 30px/1 Archivo,sans-serif;font-stretch:125%;color:#fff;-webkit-text-stroke:2px #0d0d10;text-shadow:3px 3px 0 var(--tc,#ff6a00);white-space:nowrap;pointer-events:none;animation:gxT 2.2s cubic-bezier(.2,1.4,.4,1) forwards}' +
    '@keyframes gxT{0%{opacity:0;transform:translateX(-50%) scale(.2) rotate(-12deg)}18%{opacity:1;transform:translateX(-50%) scale(1.25) rotate(-6deg)}30%{transform:translateX(-50%) scale(1) rotate(-4deg)}80%{opacity:1}100%{opacity:0;transform:translateX(-50%) translateY(-24px) rotate(-4deg)}}' +
    '.gx-big{position:absolute;z-index:60;left:50%;top:56%;transform:translate(-50%,-50%);display:grid;justify-items:center;pointer-events:none;animation:gxBig 2.5s cubic-bezier(.2,1.4,.4,1) forwards}.gx-big b{font:italic 900 clamp(44px,9vw,96px)/.9 Archivo,sans-serif;font-stretch:125%;color:#fff;-webkit-text-stroke:3px #0d0d10;text-shadow:5px 5px 0 var(--tc),0 0 40px var(--tc);white-space:nowrap}.gx-big span{margin-top:8px;padding:5px 14px;border-radius:8px;background:#0d0d10;color:#c6ff1a;font:900 15px Archivo,sans-serif;text-transform:uppercase;letter-spacing:.06em;box-shadow:4px 4px 0 var(--tc);transform:rotate(-2deg)}' +
    '@keyframes gxBig{0%{opacity:0;transform:translate(-50%,-50%) scale(.2) rotate(-14deg)}15%{opacity:1;transform:translate(-50%,-50%) scale(1.15) rotate(-5deg)}26%{transform:translate(-50%,-50%) scale(1) rotate(-4deg)}82%{opacity:1;transform:translate(-50%,-50%) scale(1.04) rotate(-4deg)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.5) rotate(-4deg)}}' +
    '.al-k.gx .av{animation:gxB .6s ease-in-out 3}@keyframes gxB{50%{transform:scale(1.25) rotate(-8deg)}}' +
    '.gx-ball{position:absolute;z-index:32;left:50%;top:50%;font-size:22px;pointer-events:none;animation:gxBall 1.1s cubic-bezier(.3,.7,.4,1) forwards}@keyframes gxBall{0%{transform:translate(-50%,-50%) scale(.4)}60%{transform:translate(calc(-50% + var(--bx)),calc(-50% - 70px)) scale(1.3) rotate(360deg)}100%{opacity:0;transform:translate(calc(-50% + var(--bx)*1.6),-50%) scale(.8) rotate(540deg)}}' +
    '.gx-cf{position:absolute;z-index:29;width:8px;height:12px;border-radius:2px;pointer-events:none;animation:gxCf 1.4s cubic-bezier(.2,.7,.3,1) forwards}@keyframes gxCf{to{transform:translate(var(--dx),var(--dy)) rotate(720deg);opacity:0}}' +
    '.st3.gx-flash:before{content:"";position:absolute;inset:0;z-index:8;pointer-events:none;background:radial-gradient(circle at var(--gx,50%) 55%,color-mix(in srgb,var(--gc,#fff) 55%,transparent),transparent 60%);animation:gxF 1.2s ease-out forwards}@keyframes gxF{from{opacity:1}to{opacity:0}}' +
    '.st3.gx-flash .st3-cr{animation:st3Cr .18s steps(2) 8;opacity:.95}.st3.gx-flash .st3-l{opacity:1;animation-duration:.6s}' +
    '.gx-led{position:absolute;inset:0;z-index:3;display:grid;place-items:center;background:#05060c;font:900 16px/1 Archivo,sans-serif;font-stretch:125%;letter-spacing:.12em;text-transform:uppercase;color:#c6ff1a;text-shadow:0 0 8px #c6ff1a;animation:gxL .35s steps(2) 6,gxLo 3.2s forwards}@keyframes gxL{50%{color:#ff8a1f;text-shadow:0 0 10px #ff8a1f}}@keyframes gxLo{0%,85%{opacity:1}100%{opacity:0}}' +
    '.rx-d{position:absolute;z-index:31;right:-22px;top:-30px;font:900 13px Archivo,sans-serif;padding:2px 7px;border-radius:999px;pointer-events:none;box-shadow:0 2px 0 rgba(0,0,0,.4);animation:rxD 2s ease-out forwards}.rx-d.up{background:#2ee59d;color:#062417}.rx-d.dn{background:#ff5a6a;color:#fff}.rx-d.nw{background:#c6ff1a;color:#0d0d10}' +
    '@keyframes rxD{0%{opacity:0;transform:translateY(10px) scale(.5)}20%{opacity:1;transform:translateY(0) scale(1.2)}35%{transform:scale(1)}80%{opacity:1}100%{opacity:0;transform:translateY(-18px)}}' +
    '.al-k.rx .rt{animation:rxP .5s ease-in-out 3}@keyframes rxP{50%{transform:scale(1.5);box-shadow:0 0 14px currentColor}}' +
    '.al-nr.rx{animation:rxRow 1.4s ease-out}@keyframes rxRow{0%{background:rgba(198,255,26,.3)}}' +
    '@media(prefers-reduced-motion:reduce){.gx-ring,.gx-ball,.gx-cf,.al-k.gx .av,.al-k.rx .rt{display:none!important;animation:none!important}.gx-txt,.rx-d{animation-duration:.01s;animation-delay:0s}}';
  var st4 = h('style'); st4.textContent = CSS3; document.head.appendChild(st4);
  function celebrate(ch, m, D) { if (!ch.goals.length && !ch.rates.length) return; var box = document.getElementById('alineaciones'); if (!box) return;
    ch.goals.forEach(function (pid, i) { setTimeout(function () { var k = box.querySelector('.al-k[data-p="' + pid + '"]'), p = by(S().players, pid), c = p ? col(p.teamId) : '#c6ff1a', st = box.querySelector('.st3');
      if (st) { st.style.setProperty('--gc', c); if (k) st.style.setProperty('--gx', k.style.left); st.classList.remove('gx-flash'); void st.offsetWidth; st.classList.add('gx-flash'); setTimeout(function () { st.classList.remove('gx-flash'); }, 1600);
        var big = h('div', 'gx-big'); big.style.setProperty('--tc', c); big.appendChild(h('b', null, '¡GOOOL!')); big.appendChild(h('span', null, (p ? p.name : '') + ' · ' + (p ? MAGNA.teamName(p.teamId) : ''))); st.appendChild(big); setTimeout(function () { big.remove(); }, 2600);
        var led = st.querySelector('.st3-led'); if (led) { var l = h('div', 'gx-led', '⚽ ¡GOOOL de ' + (p ? p.name : '') + '! ⚽'); led.appendChild(l); setTimeout(function () { l.remove(); }, 3300); } }
      if (k) { k.style.setProperty('--tc', c); k.classList.add('gx'); setTimeout(function () { k.classList.remove('gx'); }, 1900);
        k.appendChild(h('span', 'gx-ring')); var r2 = h('span', 'gx-ring'); r2.style.animationDelay = '.25s'; k.appendChild(r2); 
        var b = h('span', 'gx-ball', '⚽'); b.style.setProperty('--bx', (Math.random() > .5 ? 1 : -1) * 40 + 'px'); k.appendChild(b);
        for (var j = 0; j < 22; j++) { var f = h('i', 'gx-cf'); f.style.left = '50%'; f.style.top = '40%'; f.style.background = [c, '#c6ff1a', '#fff', '#ffd23f'][j % 4]; f.style.setProperty('--dx', (Math.random() * 2 - 1) * 120 + 'px'); f.style.setProperty('--dy', (-Math.random() * 120 - 20) + 'px'); f.style.animationDelay = Math.random() * .2 + 's'; k.appendChild(f); }
        setTimeout(function () { [].forEach.call(k.querySelectorAll('.gx-ring,.gx-txt,.gx-ball,.gx-cf'), function (x) { x.remove(); }); }, 2400); } }, i * 900); });
    ch.rates.forEach(function (x, i) { setTimeout(function () { var k = box.querySelector('.al-k[data-p="' + x.id + '"]');
      var tag = x.d == null ? ['nw', '★ ' + rt(x.v)] : x.d > 0 ? ['up', '▲ +' + String(x.d).replace('.', ',')] : ['dn', '▼ ' + String(x.d).replace('.', ',')];
      if (k) { k.classList.add('rx'); setTimeout(function () { k.classList.remove('rx'); }, 1600); var d = h('span', 'rx-d ' + tag[0], tag[1]); k.appendChild(d); setTimeout(function () { d.remove(); }, 2100); }
      var row = box.querySelector('.al-nr[data-p="' + x.id + '"]'); if (row) { row.classList.add('rx'); var d2 = h('span', 'rx-d ' + tag[0], tag[1]); d2.style.cssText = 'position:static;margin-left:6px'; var w = row.querySelector('.w b'); if (w) w.appendChild(d2); } }, 300 + i * 250); });
  }
  function draw() { var m = cur(); if (!m) { var b = document.getElementById('alineaciones'); if (b) b.remove(); return; }
    var D = data(m), key = m.id + '|' + m.status + '|' + JSON.stringify([m.hs, m.as, D.goals, D.R, D.mvp, D.h.field, D.a.field, D.h.bench, D.a.bench]);
    if (key === lastKey) return; if (m.id !== mid) slide = 0; var ch = changes(m, D); mid = m.id; lastKey = key; lineups(m, D); perf(m, D); celebrate(ch, m, D); }
  window.addEventListener('magna:homesel', function () { lastKey = ''; draw(); });
  var rzT, rzW = innerWidth; window.addEventListener('resize', function () { clearTimeout(rzT); rzT = setTimeout(function () { if (Math.abs(innerWidth - rzW) < 40) return; rzW = innerWidth; lastKey = ''; draw(); }, 200); });
  window.addEventListener('magna:update', function () { setTimeout(draw, 50); });
  setInterval(draw, 4000);
  if (document.readyState === 'complete') draw(); else addEventListener('load', draw);
})();
