'use strict';
// Extras del partido en vivo en el inicio: escudos en la cancha, momentos animados (medio tiempo, segundo tiempo,
// final, MVP, cambio de modo), sonidos opcionales, modo TV, ficha rápida del equipo y tarjeta para compartir el gol.
(function () {
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }
  function h(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function M() { return window.MAGNA; }
  function teamBy(name) { var S = M() && M().S; if (!S || !name) return null; name = String(name).trim().toLowerCase(); return S.teams.filter(function (t) { return t.name.toLowerCase() === name; })[0] || null; }
  function pl(id) { var S = M() && M().S; return S ? S.players.filter(function (p) { return p.id === id; })[0] : null; }
  function col(id) { return M() && M().teamColor ? M().teamColor(id) : '#8b5cf6'; }

  // ---------- 1. escudos en las pastillas de la cancha ----------
  function crests() { $$('.st3-wm').forEach(function (w) { var t = teamBy(w.textContent); if (!t) return; var u = M().crestUrl ? M().crestUrl(t.id) : null; w.style.setProperty('--tcol', col(t.id)); if (u) w.style.setProperty('--cu', 'url("' + u + '")'); }); }

  // ---------- 2. sonidos (sintetizados, sin archivos) ----------
  var SND = false, AC = null; try { SND = localStorage.getItem('magna_snd') === '1'; } catch (e) {}
  function ac() { if (!AC) { var C = window.AudioContext || window.webkitAudioContext; if (!C) return null; AC = new C(); } if (AC.state === 'suspended') AC.resume(); return AC; }
  function whistle(t0, dur) { var a = ac(); if (!a) return; var o = a.createOscillator(), l = a.createOscillator(), lg = a.createGain(), g = a.createGain(); o.type = 'square'; o.frequency.value = 2650; l.frequency.value = 28; lg.gain.value = 140; l.connect(lg); lg.connect(o.frequency);
    var f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2700; f.Q.value = 3; o.connect(f); f.connect(g); g.connect(a.destination); var t = a.currentTime + t0; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.18, t + .03); g.gain.setValueAtTime(.18, t + dur - .05); g.gain.linearRampToValueAtTime(0, t + dur); o.start(t); l.start(t); o.stop(t + dur + .05); l.stop(t + dur + .05); }
  function crowd(dur, peak) { var a = ac(); if (!a) return; var n = a.sampleRate * dur, b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0); for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; var s = a.createBufferSource(); s.buffer = b; var f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1100; var g = a.createGain(), t = a.currentTime;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak || .22, t + dur * .25); g.gain.linearRampToValueAtTime(0, t + dur); s.connect(f); f.connect(g); g.connect(a.destination); s.start(t); }
  function horn() { var a = ac(); if (!a) return; [220, 277, 330].forEach(function (fr) { var o = a.createOscillator(), g = a.createGain(), t = a.currentTime; o.type = 'sawtooth'; o.frequency.value = fr; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.05, t + .05); g.gain.setValueAtTime(.05, t + .9); g.gain.linearRampToValueAtTime(0, t + 1.2); o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + 1.3); }); }
  function chime() { var a = ac(); if (!a) return; [523, 659, 784, 1047].forEach(function (fr, i) { var o = a.createOscillator(), g = a.createGain(), t = a.currentTime + i * .12; o.type = 'triangle'; o.frequency.value = fr; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.15, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + .6); o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + .7); }); }
  function blip() { var a = ac(); if (!a) return; var o = a.createOscillator(), g = a.createGain(), t = a.currentTime; o.type = 'square'; o.frequency.setValueAtTime(440, t); o.frequency.exponentialRampToValueAtTime(880, t + .15); g.gain.setValueAtTime(.06, t); g.gain.exponentialRampToValueAtTime(.0001, t + .25); o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + .3); }
  function play(k) { if (!SND) return; try {
    if (k === 'goal') { horn(); crowd(3, .25); } else if (k === 'sub') { whistle(0, .25); whistle(.35, .25); } else if (k === 'ht') { whistle(0, .5); whistle(.7, 1.1); }
    else if (k === '2t') whistle(0, .7); else if (k === 'ft') { whistle(0, .45); whistle(.6, .45); whistle(1.2, 1.3); setTimeout(function () { crowd(2.5, .16); }, 1300); } else if (k === 'mvp') chime(); else if (k === 'mode') blip(); } catch (e) {} }
  function sndBtn() { var b = h('button', 'vv-snd'); b.type = 'button'; function paint() { b.textContent = SND ? '🔊' : '🔇'; b.title = SND ? 'Sonidos activados' : 'Activar sonidos del partido'; b.setAttribute('aria-label', b.title); b.setAttribute('aria-pressed', SND); b.classList.toggle('on', SND); }
    b.onclick = function (e) { e.stopPropagation(); SND = !SND; try { localStorage.setItem('magna_snd', SND ? '1' : '0'); } catch (er) {} $$('.vv-snd').forEach(function (x) { x._p && x._p(); }); if (SND) { ac(); whistle(0, .2); } toast(SND ? '🔊 Sonidos del partido activados' : '🔇 Sonidos desactivados'); }; b._p = paint; paint(); return b; }

  // ---------- 3. momentos animados ----------
  function stage() { if (document.body.classList.contains('tvm') && $('.tv-st')) return $('.tv-st'); return $('#alineaciones .st3') || $('#alineaciones .al-tm + div') || $('#marcador'); }
  function card(cls, tc, parts, ms) { var st = stage(); if (!st) return; if (getComputedStyle(st).position === 'static') st.style.position = 'relative'; var c = h('div', 'vv-mm ' + cls); c.style.setProperty('--tc', tc || '#c6ff1a'); parts.forEach(function (p) { c.appendChild(p); }); st.appendChild(c); setTimeout(function () { c.classList.add('out'); setTimeout(function () { c.remove(); }, 450); }, ms || 3000); return c; }
  function confetti(n, el) { if (RM) return; var w = h('div', 'vv-cf'); for (var i = 0; i < (n || 60); i++) { var p = h('i'); p.style.left = Math.random() * 100 + '%'; p.style.background = ['#c6ff1a', '#ff6a00', '#ff4fa3', '#22b8ff', '#ffd23f', '#fff'][i % 6]; p.style.animationDelay = Math.random() * .5 + 's'; p.style.setProperty('--x', (Math.random() * 160 - 80) + 'px'); p.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg'); w.appendChild(p); } (el || document.body).appendChild(w); setTimeout(function () { w.remove(); }, 3200); }
  function moment(d) {
    var m = d.m || {}, hn = M().teamName(m.home), an = M().teamName(m.away), sc = (m.hs || 0) + ' - ' + (m.as || 0);
    if (d.k === 'ht') card('ht', '#ffd23f', [h('span', 'ic', '⏸'), h('b', null, '¡Medio tiempo!'), h('small', null, hn + ' ' + sc + ' ' + an)]);
    if (d.k === '2t') card('t2', '#2ee59d', [h('span', 'ic', '▶'), h('b', null, '¡Arranca el 2.º tiempo!'), h('small', null, hn + ' ' + sc + ' ' + an)], 2600);
    if (d.k === 'ft') { var w = m.hs > m.as ? m.home : m.as > m.hs ? m.away : null, c = card('ft', w ? col(w) : '#ffd23f', [h('span', 'ic', '🏁'), h('b', null, '¡Final del partido!'), h('em', null, hn + '  ' + sc + '  ' + an), h('small', null, w ? '🏆 ¡Gana ' + M().teamName(w) + '!' : '🤝 ¡Empate!')], 4800); confetti(80, c && c.parentNode); }
    if (d.k === 'mvp') { var p = pl(d.pid), c2 = card('mvp', p ? col(p.teamId) : '#ffd23f', [h('span', 'ic st', '⭐'), h('small', null, 'MVP del partido'), h('b', null, p ? p.name : 'MVP'), h('em', null, p ? M().teamName(p.teamId) : '')], 4200); confetti(50, c2 && c2.parentNode); }
    if (d.k === 'mode') { var mc = (M().MODE_COLOR || {})[d.mode] || '#8b5cf6'; card('mode', mc, [h('span', 'ic', '🎮'), h('small', null, 'Nuevo modo de juego'), h('b', null, d.mode)], 2800); }
    if (d.k === 'goal') shareBtn(d);
    play(d.k);
  }
  window.addEventListener('magna:moment', function (e) { if (e.detail) moment(e.detail); });

  // ---------- 4. compartir el gol ----------
  function shareBtn(d) { var old = $('.vv-share'); if (old) old.remove(); var p = pl(d.pid), m = d.m || {}; if (!p) return;
    var b = h('button', 'vv-share'); b.type = 'button'; b.innerHTML = '<span>📸</span> Comparte el gol de <b></b>'; b.querySelector('b').textContent = p.name; b.onclick = function () { goalCard(p, m); b.remove(); }; document.body.appendChild(b); setTimeout(function () { if (b.isConnected) { b.classList.add('out'); setTimeout(function () { b.remove(); }, 400); } }, 12000); }
  function goalCard(p, m) {
    var W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H; var x = cv.getContext('2d'), tc = col(p.teamId), F = '"Archivo", "Arial Black", sans-serif';
    x.fillStyle = '#f1ead8'; x.fillRect(0, 0, W, H); x.fillStyle = 'rgba(0,0,0,.08)'; for (var yy = 0; yy < H; yy += 14) for (var xx = (yy / 14) % 2 ? 7 : 0; xx < W; xx += 14) { x.beginPath(); x.arc(xx, yy, 2, 0, 7); x.fill(); }
    x.save(); x.translate(W / 2, 560); for (var r = 0; r < 36; r++) { x.rotate(Math.PI / 18); x.fillStyle = r % 2 ? 'rgba(198,255,26,.35)' : 'rgba(255,106,0,.18)'; x.beginPath(); x.moveTo(0, 0); x.lineTo(900, -60); x.lineTo(900, 60); x.fill(); } x.restore();
    x.save(); x.translate(90, 110); x.rotate(-.03); x.fillStyle = '#ff6a00'; x.fillRect(0, 0, 420, 70); x.fillStyle = '#fff'; x.font = '900 40px ' + F; x.fillText('MAGNA ARENA', 22, 50); x.restore();
    function outlined(t, y, size, fill, rot) { x.save(); x.translate(W / 2, y); x.rotate(rot || 0); x.font = 'italic 900 ' + size + 'px ' + F; x.textAlign = 'center'; x.lineJoin = 'round'; x.lineWidth = size / 8; x.strokeStyle = '#0d0d10'; x.fillStyle = '#0d0d10'; x.fillText(t, 10, 10); x.strokeText(t, 0, 0); x.fillStyle = fill; x.fillText(t, 0, 0); x.restore(); }
    outlined('¡GOOOL!', 560, 230, '#c6ff1a', -.07);
    x.save(); x.translate(W / 2, 760); x.rotate(-.02); x.font = '900 86px ' + F; var nw = Math.min(x.measureText(p.name.toUpperCase()).width + 80, 980); x.fillStyle = '#0d0d10'; x.fillRect(-nw / 2 + 12, -70 + 12, nw, 110); x.fillStyle = tc; x.fillRect(-nw / 2, -70, nw, 110); x.lineWidth = 6; x.strokeStyle = '#0d0d10'; x.strokeRect(-nw / 2, -70, nw, 110); x.fillStyle = '#fff'; x.textAlign = 'center'; x.fillText(p.name.toUpperCase(), 0, 12); x.restore();
    x.font = '800 44px ' + F; x.fillStyle = '#3a372f'; x.textAlign = 'center'; x.fillText(M().teamName(p.teamId), W / 2, 870);
    x.save(); x.translate(W / 2, 1040); x.fillStyle = '#0d0d10'; x.fillRect(-440, -90, 880, 170); x.fillStyle = '#fff'; x.font = '900 52px ' + F; x.textAlign = 'right'; x.fillText(M().teamName(m.home).toUpperCase(), -110, 12); x.textAlign = 'left'; x.fillText(M().teamName(m.away).toUpperCase(), 110, 12);
    x.textAlign = 'center'; x.font = 'italic 900 96px ' + F; x.fillStyle = '#c6ff1a'; x.fillText((m.hs || 0) + '-' + (m.as || 0), 0, 30); x.restore();
    var clk = $('#clk'); x.font = '700 34px ' + F; x.fillStyle = '#3a372f'; x.fillText((clk && clk.textContent.trim() ? clk.textContent.trim() + ' · ' : '') + 'magna arena', W / 2, 1230);
    cv.toBlob(function (bl) { if (!bl) return; var nm = 'gol-' + p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.png', f = null; try { f = new File([bl], nm, { type: 'image/png' }); } catch (e) {}
      if (f && navigator.canShare && navigator.canShare({ files: [f] })) navigator.share({ files: [f], title: '¡Gol de ' + p.name + '!', text: '¡GOOOL de ' + p.name + ' en Magna Arena! ⚽' }).catch(function () {});
      else { var a = document.createElement('a'); a.href = URL.createObjectURL(bl); a.download = nm; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000); toast('📸 Imagen del gol descargada'); } }, 'image/png');
  }

  // ---------- 5. modo TV ----------
  function tvBtn() { var b = h('button', 'vv-tv'); b.type = 'button'; b.innerHTML = '📺<span>Modo TV</span>'; b.title = 'Ver el partido en pantalla completa'; b.onclick = function (e) { e.stopPropagation(); tv(true); }; return b; }
  // pantalla propia del modo TV: barra superior, marcador central gigante, alineaciones a los lados,
  // línea de tiempo del partido y franja con los demás partidos. Se redibuja sola con cada actualización.
  var TV = null, TVMID = null, TVT = null, TVI = null;
  function curMid() { var a = $('#alineaciones'); if (a && a.dataset.mid) return Number(a.dataset.mid); var S = M().S, l = S.matches.filter(function (m) { return m.status === 'live'; })[0]; return l ? l.id : null; }
  function tvMatches() { var S = M().S; return S.matches.filter(function (m) { return m.status === 'live'; }).concat(S.matches.filter(function (m) { return m.status === 'scheduled'; }).sort(function (a, b) { return String(a.at || '9').localeCompare(String(b.at || '9')); }).slice(0, 4)); }
  function field(m, sd) { var S = M().S, L = m.live || {}, tid = sd === 'h' ? m.home : m.away, sq = S.players.filter(function (p) { return p.teamId === tid && p.kind !== 'coach' && (!M().plays || M().plays(p)); });
    var xi = (L.lineup && L.lineup[sd] && L.lineup[sd].length) ? L.lineup[sd].slice() : sq.filter(function (p) { return p.slot === 'starter'; }).map(function (p) { return p.id; }); if (!xi.length) xi = sq.slice(0, 3).map(function (p) { return p.id; });
    var f = xi.slice(), inn = {}; (L.ev || []).forEach(function (e) { if (e.k !== 'sub') return; var pi = pl(e.in), po = pl(e.out); if ((pi && pi.teamId !== tid) || (po && po.teamId !== tid) || (!pi && !po)) return; if (e.out) { var i = f.indexOf(Number(e.out)); if (i >= 0) f.splice(i, 1); } if (e.in && f.indexOf(Number(e.in)) < 0) { f.push(Number(e.in)); inn[e.in] = 1; } });
    var bench = sq.filter(function (p) { return f.indexOf(p.id) < 0; }).map(function (p) { return p.id; }); return { f: f, bench: bench, inn: inn, tid: tid }; }
  function crestBox(tid, cls) { var c = h('span', cls || 'tv-cr'), u = M().crestUrl ? M().crestUrl(tid) : null; c.style.setProperty('--tc', col(tid)); if (u) c.style.backgroundImage = 'url("' + u + '")'; else c.textContent = M().teamName(tid).slice(0, 2).toUpperCase(); return c; }
  function rcls(v) { return v == null ? 'na' : v >= 8 ? 'top' : v >= 6.5 ? 'good' : v >= 5 ? 'mid' : 'low'; }
  function fmtR(v) { return v == null ? '—' : Number(v).toFixed(1).replace('.', ','); }
  function side(m, sd) { var F = field(m, sd), L = m.live || {}, R = L.ratings || {}, G = {}; (L.ev || []).forEach(function (e) { if (e.k === 'goal' && e.player) G[e.player] = (G[e.player] || 0) + 1; });
    var w = h('section', 'tv-sd ' + sd); w.style.setProperty('--tc', col(F.tid)); var hd = h('div', 'tv-sdh'); hd.appendChild(crestBox(F.tid, 'tv-cr sm')); hd.appendChild(h('b', null, M().teamName(F.tid))); var co = M().S.teams.filter(function (t) { return t.id === F.tid; })[0], dt = co && pl(co.coach); if (dt) hd.appendChild(h('small', null, 'DT ' + dt.name)); w.appendChild(hd);
    var ls = h('div', 'tv-pls'); F.f.forEach(function (id, i) { var p = pl(id); if (!p) return; var r = h('div', 'tv-p' + (L.mvp === id ? ' mvp' : '')); r.style.animationDelay = i * 70 + 'ms'; r.dataset.p = id; r.appendChild(h('span', 'av', p.name.slice(0, 2).toUpperCase())); var nm = h('div', 'nm'); nm.appendChild(h('b', null, p.name));
      var tg = h('span', 'tg'); if (G[id]) tg.appendChild(h('i', null, '⚽' + (G[id] > 1 ? '×' + G[id] : ''))); if (F.inn[id]) tg.appendChild(h('i', 'in', '▲ entró')); if (L.mvp === id) tg.appendChild(h('i', 'mv', '⭐ MVP')); nm.appendChild(tg); r.appendChild(nm); r.appendChild(h('em', 'rt ' + rcls(R[id]), fmtR(R[id]))); ls.appendChild(r); });
    if (!F.f.length) ls.appendChild(h('p', 'tv-e', 'Sin alineación')); w.appendChild(ls);
    var gs = 0, rr = [], sb = 0; F.f.forEach(function (id) { gs += G[id] || 0; if (R[id] != null) rr.push(R[id]); }); Object.keys(G).forEach(function (id) { if (F.f.indexOf(Number(id)) < 0 && pl(Number(id)) && pl(Number(id)).teamId === F.tid) gs += G[id]; }); sb = Object.keys(F.inn).length;
    var ks = h('div', 'tv-ks'); [[gs, gs === 1 ? 'Gol' : 'Goles'], [rr.length ? fmtR(Math.round(rr.reduce(function (a, b) { return a + b; }, 0) / rr.length * 10) / 10) : '—', 'Nota media'], [sb, sb === 1 ? 'Cambio' : 'Cambios']].forEach(function (x) { var d = h('div'); d.appendChild(h('b', null, String(x[0]))); d.appendChild(h('small', null, x[1])); ks.appendChild(d); }); w.appendChild(ks);
    if (F.bench.length) { var bn = h('div', 'tv-bn'); bn.appendChild(h('small', null, 'Banca')); F.bench.slice(0, 4).forEach(function (id) { var p = pl(id); if (p) bn.appendChild(h('span', null, p.name)); }); w.appendChild(bn); }
    return w; }
  function center(m) { var L = m.live || {}, c = h('section', 'tv-st'), live = m.status === 'live', fin = m.status === 'finished';
    var tp = h('div', 'tv-tp'); tp.appendChild(h('span', 'tv-lv' + (live ? '' : ' off'), live ? '● EN VIVO' : fin ? 'FINAL' : 'PRÓXIMO')); var cp = M().compOf ? M().compOf(m) : null; tp.appendChild(h('span', 'tv-cp', (cp ? cp.name : 'Amistoso') + (m.round ? ' · ' + m.round : ''))); c.appendChild(tp);
    var sb = h('div', 'tv-sb'); [m.home, null, m.away].forEach(function (tid, i) { if (tid == null) { var sc = h('div', 'tv-sc'); sc.appendChild(h('b', 'n h', String(m.hs || 0))); sc.appendChild(h('i')); sc.appendChild(h('b', 'n a', String(m.as || 0))); sb.appendChild(sc); return; }
      var t = h('div', 'tv-tm ' + (i ? 'a' : 'h')); t.style.setProperty('--tc', col(tid)); t.appendChild(crestBox(tid)); t.appendChild(h('b', null, M().teamName(tid))); sb.appendChild(t); }); c.appendChild(sb);
    var ck = h('div', 'tv-ck'); ck.appendChild(h('span', 'tv-clk', '')); if (L.mode) { var md = h('span', 'tv-md', '🎮 ' + L.mode); md.style.setProperty('--mc', (M().MODE_COLOR || {})[L.mode] || '#8b5cf6'); ck.appendChild(md); } c.appendChild(ck);
    // posesión del marcador: barra de dominio por goles y notas
    var R = L.ratings || {}, avg = function (sd) { var f = field(m, sd).f.map(function (id) { return R[id]; }).filter(function (v) { return v != null; }); return f.length ? f.reduce(function (a, b) { return a + b; }, 0) / f.length : null; }, ah = avg('h'), aa = avg('a');
    if (ah != null || aa != null) { var dm = h('div', 'tv-dm'), hh = ah || 5, aw = aa || 5, pc = Math.round(hh / (hh + aw) * 100); dm.style.setProperty('--p', pc + '%'); dm.style.setProperty('--hc', col(m.home)); dm.style.setProperty('--ac', col(m.away)); dm.appendChild(h('small', null, 'Nota ' + fmtR(ah && Math.round(ah * 10) / 10))); dm.appendChild(h('span', 'bar')); dm.appendChild(h('small', null, 'Nota ' + fmtR(aa && Math.round(aa * 10) / 10))); c.appendChild(dm); }
    return c; }
  function timeline(m) { var w = h('section', 'tv-tl'); w.appendChild(h('small', 'tv-lb', 'Minuto a minuto')); var tr = h('div', 'tv-tr'), ev = ((m.live || {}).ev || []).filter(function (e) { return /goal|sub|ht|start|resume|mode|end/.test(e.k); });
    ev.slice(-12).forEach(function (e) { var it = h('div', 'tv-ev ' + e.k), p = pl(e.player || e.in), tc = p ? col(p.teamId) : '#c6ff1a'; it.style.setProperty('--tc', tc); it.appendChild(h('em', null, (e.min != null ? e.min : '·') + "'"));
      var tx = e.k === 'goal' ? '⚽ ' + (p ? p.name : 'Gol') + (e.score ? ' · ' + e.score : '') : e.k === 'sub' ? '⇄ ' + (pl(e.in) ? pl(e.in).name : '') + ' x ' + (pl(e.out) ? pl(e.out).name : '') : e.k === 'ht' ? '⏸ Medio tiempo' : e.k === 'start' ? '▶ Inicio' : e.k === 'resume' ? '▶ 2.º tiempo' : e.k === 'mode' ? '🎮 ' + (e.mode || '') : '🏁 Final';
      it.appendChild(h('span', null, tx)); tr.appendChild(it); }); if (!ev.length) tr.appendChild(h('p', 'tv-e', 'Aún no hay jugadas registradas')); w.appendChild(tr); requestAnimationFrame(function () { tr.scrollLeft = tr.scrollWidth; }); return w; }
  function others(mid) { var w = h('section', 'tv-ot'); w.appendChild(h('small', 'tv-lb', 'Otros partidos')); var r = h('div', 'tv-or'); tvMatches().filter(function (m) { return m.id !== mid; }).slice(0, 4).forEach(function (m) { var b = h('button', 'tv-om' + (m.status === 'live' ? ' lv' : '')); b.type = 'button'; b.appendChild(crestBox(m.home, 'tv-cr xs')); b.appendChild(h('b', null, m.status === 'scheduled' ? 'vs' : (m.hs || 0) + '-' + (m.as || 0))); b.appendChild(crestBox(m.away, 'tv-cr xs'));
      b.appendChild(h('small', null, m.status === 'live' ? '● vivo' : m.at ? new Date(String(m.at).replace(' ', 'T') + 'Z').toLocaleString('es', { weekday: 'short', hour: '2-digit', minute: '2-digit' }) : '')); b.onclick = function () { pick(m.id); }; r.appendChild(b); }); if (!r.children.length) r.appendChild(h('p', 'tv-e', 'No hay más partidos')); w.appendChild(r); return w; }
  function pick(id) { TVMID = id; var i = $$('.others .mc').findIndex(function (c) { return c.textContent.indexOf(M().teamName(M().S.matches.filter(function (m) { return m.id === id; })[0].home)) >= 0 && c.textContent.indexOf(M().teamName(M().S.matches.filter(function (m) { return m.id === id; })[0].away)) >= 0; }); if (i >= 0) $$('.others .mc')[i].click(); draw(true); }
  function draw(anim) { if (!TV) return; var S = M().S, m = S.matches.filter(function (x) { return x.id === TVMID; })[0] || S.matches.filter(function (x) { return x.id === curMid(); })[0]; if (!m) return; TVMID = m.id;
    var body = $('.tv-bd', TV); body.innerHTML = ''; body.classList.toggle('in', !!anim); body.appendChild(side(m, 'h')); body.appendChild(center(m)); body.appendChild(side(m, 'a'));
    var ft = $('.tv-ft', TV); ft.innerHTML = ''; ft.appendChild(timeline(m)); ft.appendChild(others(m.id)); tick(); }
  function tick() { if (!TV) return; var c = $('.tv-clk', TV), k = $('#clk'); if (c) c.textContent = k && k.textContent.trim() ? k.textContent.trim() : ''; var n = $('.tv-now', TV); if (n) n.textContent = new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }); }
  function tv(on) { document.body.classList.toggle('tvm', on); closePop();
    if (on) { if (!TV) { TV = h('div', 'tvx'); TV.setAttribute('role', 'dialog'); TV.setAttribute('aria-label', 'Modo TV');
        var tb = h('header', 'tv-hb'), lg = h('div', 'tv-lg'); lg.innerHTML = '<img src="logo-nav.webp" alt=""><b>MAGNA <em>ARENA</em></b>'; tb.appendChild(lg); tb.appendChild(h('span', 'tv-now', '')); var sp = h('span', 'sp'); tb.appendChild(sp);
        var nav = h('div', 'tv-nv'); var pv = h('button', 'tv-b', '‹'), nx = h('button', 'tv-b', '›'); pv.type = nx.type = 'button'; pv.title = 'Partido anterior'; nx.title = 'Partido siguiente'; pv.onclick = function () { step(-1); }; nx.onclick = function () { step(1); }; nav.appendChild(pv); nav.appendChild(nx); tb.appendChild(nav);
        tb.appendChild(sndBtn()); var out = h('button', 'vv-out', '✕ Salir'); out.type = 'button'; out.onclick = function () { tv(false); }; tb.appendChild(out); TV.appendChild(tb);
        TV.appendChild(h('div', 'tv-bd')); TV.appendChild(h('footer', 'tv-ft')); document.body.appendChild(TV); }
      TVMID = curMid(); draw(true); clearInterval(TVI); TVI = setInterval(tick, 1000); idle();
      var el = document.documentElement; if (el.requestFullscreen && !document.fullscreenElement) el.requestFullscreen().catch(function () {}); }
    else { clearInterval(TVI); if (TV) { TV.remove(); TV = null; } if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(function () {}); } }
  function step(d) { var L = tvMatches(), i = L.map(function (m) { return m.id; }).indexOf(TVMID); if (!L.length) return; pick(L[(i + d + L.length) % L.length].id); }
  function idle() { clearTimeout(TVT); if (!TV) return; TV.classList.remove('idle'); TVT = setTimeout(function () { if (TV) TV.classList.add('idle'); }, 3500); }
  document.addEventListener('pointermove', function () { if (TV) idle(); }, { passive: true });
  window.addEventListener('magna:update', function () { if (TV) setTimeout(function () { draw(false); }, 350); });
  window.addEventListener('magna:moment', function (e) { if (!TV || !e.detail) return; var d = e.detail; if (d.k === 'goal' || d.k === 'sub') { var p = pl(d.k === 'goal' ? d.pid : (d.e || {}).in); if (d.k === 'goal') { var o = h('div', 'tv-goal'); o.style.setProperty('--tc', p ? col(p.teamId) : '#c6ff1a'); o.appendChild(h('b', null, '¡GOOOL!')); o.appendChild(h('span', null, p ? p.name + ' · ' + M().teamName(p.teamId) : '')); TV.appendChild(o); setTimeout(function () { o.remove(); }, 3200); }
      setTimeout(function () { var r = p && $('.tv-p[data-p="' + p.id + '"]', TV); if (r) { r.classList.add('hit'); setTimeout(function () { r.classList.remove('hit'); }, 2400); } }, 500); } });
  document.addEventListener('fullscreenchange', function () { if (!document.fullscreenElement && document.body.classList.contains('tvm')) tv(false); });
  document.addEventListener('keydown', function (e) { if (!document.body.classList.contains('tvm')) return; if (e.key === 'Escape') tv(false); if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); });

  // ---------- 6. ficha rápida del equipo ----------
  function teamPop(t, anchor) { closePop(); var S = M().S, PS = M().playerStats ? M().playerStats() : {}, PT = M().teamPoints ? M().teamPoints() : {}, rk = S.teams.slice().sort(function (a, b) { return ((PT[b.id] || {}).pts || 0) - ((PT[a.id] || {}).pts || 0); }).indexOf(t) + 1;
    var sq = S.players.filter(function (p) { return p.teamId === t.id && p.kind !== 'coach'; }), coach = S.players.filter(function (p) { return p.id === t.coach; })[0];
    var c = h('div', 'vv-pop'); c.style.setProperty('--tc', col(t.id)); c.setAttribute('role', 'dialog'); c.setAttribute('aria-label', t.name);
    var x = h('button', 'x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Cerrar'); x.onclick = closePop; c.appendChild(x);
    var hd = h('div', 'hd'), cr = h('span', 'cr'), u = M().crestUrl ? M().crestUrl(t.id) : null; if (u) cr.style.backgroundImage = 'url("' + u + '")'; else cr.textContent = t.name.slice(0, 2).toUpperCase(); hd.appendChild(cr);
    var tt = h('div'); tt.appendChild(h('b', null, t.name)); tt.appendChild(h('small', null, (rk ? '#' + rk + ' del ranking · ' : '') + ((PT[t.id] || {}).pts || 0).toLocaleString('es-CO') + ' pts')); hd.appendChild(tt); c.appendChild(hd);
    var fm = anchor.closest('.bt') && anchor.closest('.bt').querySelector('.form'); if (fm && fm.children.length) { var fr = h('div', 'fm'); fr.appendChild(h('small', null, 'Últimos partidos')); fr.appendChild(fm.cloneNode(true)); c.appendChild(fr); }
    var ls = h('div', 'sq'); ls.appendChild(h('small', null, 'Plantilla')); sq.slice(0, 6).forEach(function (p) { var r = h('a', 'pr'); r.href = (window.MAGNA_COS && MAGNA_COS.profileUrl) ? MAGNA_COS.profileUrl(p.id) : 'jugador.html?id=' + p.id; r.appendChild(h('i', null, p.name.slice(0, 2).toUpperCase())); r.appendChild(h('span', null, p.name)); var md = (PS[p.id] || {}).media; r.appendChild(h('em', null, md != null ? String(md) : '—')); ls.appendChild(r); }); if (!sq.length) ls.appendChild(h('p', null, 'Sin jugadores registrados.')); c.appendChild(ls);
    if (coach) c.appendChild(h('p', 'dt', 'DT: ' + coach.name));
    var go = h('a', 'go', 'Ver equipo completo →'); go.href = 'equipo.html?id=' + t.id; c.appendChild(go);
    document.body.appendChild(c); var r0 = anchor.getBoundingClientRect(), w = Math.min(320, innerWidth - 24); c.style.width = w + 'px'; c.style.left = Math.max(12, Math.min(innerWidth - w - 12, r0.left + r0.width / 2 - w / 2)) + 'px'; c.style.top = (r0.bottom + scrollY + 10) + 'px';
    setTimeout(function () { document.addEventListener('click', outside, true); }, 0); }
  function outside(e) { var p = $('.vv-pop'); if (p && !p.contains(e.target)) closePop(); }
  function closePop() { var p = $('.vv-pop'); if (p) p.remove(); document.removeEventListener('click', outside, true); }
  document.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('#bN1, #bN2'); if (!b) return; var t = teamBy(b.textContent); if (t) { e.stopPropagation(); teamPop(t, b); } });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePop(); });

  // ---------- utilidades y arranque ----------
  function toast(t) { var w = $('.vv-toasts') || document.body.appendChild(h('div', 'vv-toasts')), x = h('div', 'vv-toast', t); w.appendChild(x); setTimeout(function () { x.classList.add('out'); setTimeout(function () { x.remove(); }, 400); }, 2400); }
  function controls() { var row = $('#marcador .bn-row'); if (row && !row.querySelector('.vv-tv')) { var g = h('div', 'vv-ctl'); g.appendChild(tvBtn()); g.appendChild(sndBtn()); row.appendChild(g); }
    $$('#bN1, #bN2').forEach(function (b) { if (!b.dataset.vv) { b.dataset.vv = '1'; b.setAttribute('role', 'button'); b.tabIndex = 0; b.title = 'Ver ficha del equipo'; b.addEventListener('keydown', function (e) { if (e.key === 'Enter') b.click(); }); } }); }
  function run() { crests(); controls(); }
  var tm = null, mo = new MutationObserver(function () { clearTimeout(tm); tm = setTimeout(run, 200); });
  function start() { run(); var m = $('main'); if (m) mo.observe(m, { childList: true, subtree: true }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(start, 400); }); else setTimeout(start, 400);
})();
