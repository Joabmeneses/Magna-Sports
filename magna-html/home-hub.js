'use strict';
// Portada: bloques con lo que pasa en la comunidad (competiciones, ranking, noticias, mercado, equipos).
// Se muestran siempre debajo del partido destacado; si aún no hay partidos, hacen de portada completa.
(function () {
  if (!window.MAGNA) return;
  var S = MAGNA.S, RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function h(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function a(href, c, x) { var e = h('a', c, x); e.href = href; return e; }
  function fmt(n) { return String(Math.round(Number(n || 0))).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function fdt(s) { if (!s) return 'Fecha por confirmar'; var d = new Date(String(s).replace(' ', 'T') + (/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? '' : 'Z')); return isNaN(d) ? s : d.toLocaleString('es', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }
  function ago(s) { var d = new Date(String(s).replace(' ', 'T') + (/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? '' : 'Z')), m = Math.round((Date.now() - d) / 60000); if (isNaN(m)) return ''; if (m < 1) return 'ahora'; if (m < 60) return 'hace ' + m + ' min'; if (m < 1440) return 'hace ' + Math.round(m / 60) + ' h'; var dd = Math.round(m / 1440); return dd === 1 ? 'ayer' : 'hace ' + dd + ' días'; }
  function crest(id, sz) { var c = h('span', 'hh-cr'), u = MAGNA.crestUrl(id), col = MAGNA.teamColor ? MAGNA.teamColor(id) : '#8b5cf6'; c.style.setProperty('--s', sz + 'px'); c.style.setProperty('--tc', col);
    if (u) { var i = h('img'); i.src = u; i.alt = ''; i.loading = 'lazy'; c.appendChild(i); } else c.textContent = MAGNA.teamName(id).slice(0, 2).toUpperCase(); return c; }
  function sec(root, title, more, href, color) { var s = h('section', 'hh-sec'); s.style.setProperty('--h', color); var hd = h('div', 'hh-hd'); hd.appendChild(h('h2', 'x', title)); if (more) hd.appendChild(a(href, 'hh-more', more + ' →')); s.appendChild(hd); root.appendChild(s); return s; }
  function countUp(el, to) { if (RM || !to) { el.textContent = fmt(to); return; } var t0 = null; function f(t) { if (!t0) t0 = t; var k = Math.min(1, (t - t0) / 1000); el.textContent = fmt(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f); } requestAnimationFrame(f); }
  var CSS = '' +
    '.hh{margin-top:34px;display:grid;grid-template-columns:minmax(0,1fr);gap:34px}.hh>*{min-width:0}.vacio .hh{margin-top:24px}.vacio .vac{display:none!important}' +
    '.hh-hero{position:relative;overflow:hidden;border-radius:32px;padding:clamp(26px,5vw,52px) clamp(18px,4vw,48px);border:1px solid rgba(255,255,255,.14);background:radial-gradient(70% 90% at 0 0,rgba(255,90,54,.55),transparent 62%),radial-gradient(60% 80% at 100% 10%,rgba(59,75,255,.55),transparent 65%),radial-gradient(70% 70% at 70% 120%,rgba(255,79,163,.45),transparent 70%),#1c1a5a}' +
    '.hh-hero:before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(115deg,transparent 0 26px,rgba(255,255,255,.03) 26px 27px);pointer-events:none}' +
    '.hh-hero .hh-wm{position:absolute;right:-2%;bottom:-16%;font:900 clamp(120px,22vw,300px)/1 Archivo,sans-serif;font-stretch:125%;color:rgba(255,255,255,.05);white-space:nowrap;pointer-events:none}' +
    '.hh-hero .hh-in{position:relative;display:grid;grid-template-columns:1fr auto;gap:24px;align-items:center}.hh-hero img.hh-lg{width:clamp(90px,14vw,150px);height:auto;filter:drop-shadow(0 12px 30px rgba(255,140,0,.45));animation:hhF 4s ease-in-out infinite}@keyframes hhF{50%{transform:translateY(-8px) rotate(-3deg)}}' +
    '.hh-hero .hh-ey{font:700 12px "JetBrains Mono",monospace;letter-spacing:.16em;text-transform:uppercase;color:#ffd0c2}.hh-hero h1{margin:12px 0 10px;font-size:clamp(36px,7vw,78px);line-height:.92}.hh-hero p{margin:0;color:#dcdff2;max-width:56ch;font-size:clamp(15px,1.8vw,18px)}' +
    '.hh-cta{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px}.hh-cta a{display:inline-flex;align-items:center;gap:8px;padding:12px 20px;border-radius:999px;font:800 14px Archivo,sans-serif;text-decoration:none;color:#fff;border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.1)}.hh-cta a.o{background:#ff5a36;border-color:#ff5a36}.hh-cta a:hover{transform:translateY(-1px)}' +
    '.hh-kp{position:relative;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:26px}.hh-kp div{background:rgba(10,13,24,.35);border:1px solid rgba(255,255,255,.16);border-radius:18px;padding:14px 16px;min-width:0}.hh-kp b{display:block;font:900 clamp(24px,3.6vw,36px)/1 Archivo,sans-serif;font-stretch:120%}.hh-kp small{display:block;margin-top:6px;color:#d0d4ea;font:500 10px "JetBrains Mono",monospace;letter-spacing:.1em;text-transform:uppercase}' +
    '.hh-sec{--h:#8b5cf6}.hh-hd{display:flex;align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px}.hh-hd h2{margin:0;font-size:clamp(24px,3.6vw,34px);background:linear-gradient(90deg,#fff,color-mix(in srgb,var(--h) 55%,#fff));-webkit-background-clip:text;background-clip:text;color:transparent}' +
    '.hh-more{color:color-mix(in srgb,var(--h) 60%,#fff);font:700 14px Archivo,sans-serif;text-decoration:none}.hh-more:hover{text-decoration:underline}' +
    '.hh-cr{width:var(--s);height:var(--s);flex:none;border-radius:50%;display:grid;place-items:center;overflow:hidden;background:color-mix(in srgb,var(--tc) 35%,#1b1d57);border:2px solid var(--tc);font:900 calc(var(--s)*.34) Archivo,sans-serif;color:#fff}.hh-cr img{width:100%;height:100%;object-fit:cover}' +
    // competiciones
    '.hh-comp{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}' +
    '.hh-cc{position:relative;overflow:hidden;display:flex;flex-direction:column;gap:10px;padding:18px;border-radius:22px;text-decoration:none;color:#f1f3fb;border:1px solid color-mix(in srgb,var(--c) 50%,transparent);background:radial-gradient(90% 80% at 100% 0,color-mix(in srgb,var(--c) 40%,transparent),transparent 70%),color-mix(in srgb,var(--c) 14%,#171a4a);transition:transform .2s,box-shadow .2s}' +
    '.hh-cc:hover{transform:translateY(-3px);box-shadow:0 16px 40px -14px var(--c)}.hh-cc .hh-ic{font-size:30px;line-height:1}.hh-cc b{font:900 20px/1.1 Archivo,sans-serif;text-transform:uppercase;font-stretch:115%}.hh-cc small{color:#cfd3ea;font-size:13px}' +
    '.hh-cc .hh-st{position:absolute;top:14px;right:14px;font:700 10px "JetBrains Mono",monospace;letter-spacing:.1em;text-transform:uppercase;padding:4px 9px;border-radius:999px;background:rgba(10,13,24,.45)}.hh-cc .hh-st.hh-on{background:#2ee59d;color:#0a0d18}' +
    '.hh-cc .hh-cs{display:flex;margin-top:auto}.hh-cc .hh-cs .hh-cr{margin-left:-8px;border-width:2px;box-shadow:0 0 0 2px #171a4a}.hh-cc .hh-cs .hh-cr:first-child{margin-left:0}.hh-cc .hh-cs em{font-style:normal;margin-left:8px;align-self:center;color:#cfd3ea;font-size:12px}' +
    // partidos
    '.hh-ms{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px}.hh-m{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;padding:12px 14px;border-radius:18px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:inherit;text-decoration:none}.hh-m b{display:block;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.hh-m small{color:#b9bed6;font-size:12px}.hh-m .hh-sc{font:900 18px Archivo,sans-serif;font-variant-numeric:tabular-nums}.hh-m>div{min-width:0}.hh-m .hh-lv{color:#ff5a36;font:700 11px "JetBrains Mono",monospace}' +
    // ranking
    '.hh-two{display:grid;grid-template-columns:1fr 1fr;gap:16px}.hh-two>div{min-width:0}@media(max-width:820px){.hh-two{grid-template-columns:1fr}}' +
    '.hh-box{border-radius:24px;padding:16px;background:linear-gradient(135deg,color-mix(in srgb,var(--h) 30%,#1b1d57),color-mix(in srgb,var(--h) 8%,#1b1d57) 70%);border:1px solid color-mix(in srgb,var(--h) 45%,transparent)}.hh-box h3{margin:0 0 10px;font-size:16px;color:#e8eafb;display:flex;justify-content:space-between;align-items:center}' +
    '.hh-rk{display:grid;grid-template-columns:30px auto 1fr auto;gap:10px;align-items:center;padding:9px 6px;border-radius:14px;text-decoration:none;color:inherit;animation:hhIn .5s cubic-bezier(.2,.9,.2,1) both}.hh-rk:hover{background:rgba(255,255,255,.07)}.hh-rk .hh-p{font:900 18px Archivo,sans-serif;font-stretch:120%;color:#b9bed6;text-align:center}.hh-rk:nth-child(2) .hh-p{color:#ffd23f}.hh-rk:nth-child(3) .hh-p{color:#d6dbe8}.hh-rk:nth-child(4) .hh-p{color:#e3a36b}' +
    '.hh-rk b{font-size:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block}.hh-rk small{color:#b9bed6;font-size:12px}.hh-rk .hh-v{font:800 15px Archivo,sans-serif;font-variant-numeric:tabular-nums;color:#ffd23f;white-space:nowrap}.hh-rk>div{min-width:0}' +
    '.hh-pav{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;font:900 13px Archivo,sans-serif;color:#fff;background:conic-gradient(var(--kc) calc(var(--pc)*1%),rgba(255,255,255,.14) 0);position:relative}.hh-pav i{position:absolute;inset:3px;border-radius:50%;background:#22255e;display:grid;place-items:center;font-style:normal}' +
    '@keyframes hhIn{from{opacity:0;transform:translateY(10px)}}' +
    // noticias
    '.hh-news{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}.hh-n{display:flex;flex-direction:column;border-radius:20px;overflow:hidden;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);text-decoration:none;color:inherit;transition:transform .2s}.hh-n:hover{transform:translateY(-3px)}' +
    '.hh-n .hh-cv{aspect-ratio:16/9;background:linear-gradient(135deg,#ff5a36,#8b5cf6) center/cover}.hh-n .hh-tx{padding:14px}.hh-n small{color:#ffb39e;font:700 10px "JetBrains Mono",monospace;letter-spacing:.1em;text-transform:uppercase}.hh-n b{display:block;margin:6px 0;font-size:17px;line-height:1.2}.hh-n p{margin:0;color:#c3c8df;font-size:13px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}' +
    '.hh-feed{display:grid;gap:8px}.hh-f{display:flex;gap:12px;align-items:center;padding:12px 14px;border-radius:16px;background:rgba(255,255,255,.05);border-left:3px solid var(--fc,#8b5cf6);font-size:14px}.hh-f span{font-size:20px}.hh-f small{margin-left:auto;color:#9aa0b8;font-size:12px;white-space:nowrap}' +
    // accesos
    '.hh-go{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}@media(max-width:820px){.hh-go{grid-template-columns:1fr 1fr}}' +
    '.hh-g{position:relative;overflow:hidden;display:flex;flex-direction:column;gap:6px;padding:18px 16px;border-radius:22px;text-decoration:none;color:#fff;background:linear-gradient(150deg,var(--c),color-mix(in srgb,var(--c) 30%,#1b1d57));min-height:140px;transition:transform .2s}.hh-g:hover{transform:translateY(-3px) rotate(-.5deg)}' +
    '.hh-g .hh-ic{font-size:30px}.hh-g b{font:900 19px Archivo,sans-serif;text-transform:uppercase;font-stretch:115%;margin-top:auto}.hh-g small{color:rgba(255,255,255,.85);font-size:12px}.hh-g .hh-bg{position:absolute;right:-10px;bottom:-24px;font-size:90px;opacity:.16;pointer-events:none}' +
    '.hh-g .hh-tag{position:absolute;top:12px;right:12px;font:700 10px "JetBrains Mono",monospace;letter-spacing:.08em;text-transform:uppercase;background:rgba(10,13,24,.4);border-radius:999px;padding:4px 9px}' +
    // equipos
    '.hh-mq{overflow:hidden;-webkit-mask:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent);mask:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent)}.hh-mq .hh-tr{display:flex;gap:12px;width:max-content;animation:hhM var(--d,40s) linear infinite}.hh-mq:hover .hh-tr{animation-play-state:paused}@keyframes hhM{to{transform:translateX(-50%)}}' +
    '.hh-t{display:flex;align-items:center;gap:10px;padding:8px 16px 8px 8px;border-radius:999px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);text-decoration:none;color:#f1f3fb;font:700 14px Archivo,sans-serif;white-space:nowrap}.hh-t:hover{border-color:var(--tc)}' +
    '.hh-empty{color:#b9bed6;font-size:14px;padding:16px;border-radius:18px;border:1px dashed rgba(255,255,255,.2);text-align:center}' +
    '@media(max-width:640px){.hh-hero .hh-in{grid-template-columns:1fr}.hh-hero img.hh-lg{order:-1;width:84px}.hh-kp{grid-template-columns:1fr 1fr}.hh-g{min-height:120px;padding:14px}.hh-g b{font-size:16px}}' +
    '@media(prefers-reduced-motion:reduce){.hh *{animation:none!important;transition:none!important}}';
  var st = h('style'); st.textContent = CSS; document.head.appendChild(st);

  function build() {
    S = MAGNA.S; var main = document.getElementById('partidos'); if (!main) return; var old = document.getElementById('hh'); if (old) old.remove();
    var root = h('div', 'hh'); root.id = 'hh'; var empty = document.body.classList.contains('vacio');
    var PT = MAGNA.teamPoints ? MAGNA.teamPoints() : {}, PS = MAGNA.playerStats ? MAGNA.playerStats() : {};
    var fin = S.matches.filter(function (m) { return m.status === 'finished'; }), comps = S.leagues.map(function (c) { return { c: c, k: 'league' }; }).concat(S.tournaments.filter(function (c) { return c.status !== 'draft'; }).map(function (c) { return { c: c, k: 'tournament' }; }));
    var players = S.players.filter(function (p) { return !MAGNA.plays || MAGNA.plays(p); });

    // 1) portada de bienvenida (solo cuando no hay partido destacado)
    if (empty) {
      var hero = h('section', 'hh-hero'); hero.appendChild(h('div', 'hh-wm', 'MAGNA')); var inn = h('div', 'hh-in'), tx = h('div');
      tx.appendChild(h('div', 'hh-ey', 'Comunidad de Brawl Stars · Magna Sports')); tx.appendChild(h('h1', 'x', 'Bienvenido a Magna Arena'));
      tx.appendChild(h('p', null, 'Ligas, torneos, Champions y Mundial de la comunidad, con ranking de equipos, fichajes y pronósticos con Bits. Todo se actualiza en vivo con cada resultado.'));
      var cta = h('div', 'hh-cta'); cta.appendChild(a('calendario.html', 'o', '📅 Ver calendario')); cta.appendChild(a('equipos.html', null, '🛡️ Conocer equipos')); cta.appendChild(a('ranking.html', null, '🏆 Ranking'));
      var me = window.MAGNA_ME && MAGNA_ME.get(); if (!me) cta.appendChild(a('cuenta.html', null, '👤 Entrar'));
      tx.appendChild(cta); inn.appendChild(tx); var lg = h('img', 'hh-lg'); lg.src = 'logo.png'; lg.alt = ''; inn.appendChild(lg); hero.appendChild(inn);
      var kp = h('div', 'hh-kp'), cnt = [];
      [[S.teams.length, 'Equipos'], [players.length, 'Jugadores'], [comps.length, 'Competiciones'], [fin.length + (S.history || []).reduce(function (n, e) { return n + ((e.matches || []).length); }, 0), 'Partidos jugados']].forEach(function (x) { var d = h('div'), b = h('b', null, '0'); d.appendChild(b); d.appendChild(h('small', null, x[1])); kp.appendChild(d); cnt.push([b, x[0]]); });
      hero.appendChild(kp); root.appendChild(hero); setTimeout(function () { cnt.forEach(function (c) { countUp(c[0], c[1]); }); }, 150);
    }

    // 2) accesos rápidos
    var mk = MAGNA.marketState ? MAGNA.marketState() : { open: false };
    var go = sec(root, empty ? 'Explora' : 'Accesos rápidos', null, null, '#ff5a36'), gg = h('div', 'hh-go');
    [['apuestas.html', '🎲', 'Apuestas', 'Pronostica con tus Bits', '#ff5a36', null], ['mercado.html', '🔁', 'Fichajes', 'Medias y mercado', '#8b5cf6', mk.open ? 'Abierto' : 'Cerrado'], ['ranking.html', '🏆', 'Ranking', 'Equipos, jugadores y Bits', '#e0a800', null], ['noticias.html', '📰', 'Noticias', 'Lo último de la comunidad', '#0ea5a4', null]].forEach(function (x) {
      var g = a(x[0], 'hh-g'); g.style.setProperty('--c', x[4]); g.appendChild(h('span', 'hh-ic', x[1])); g.appendChild(h('b', null, x[2])); g.appendChild(h('small', null, x[3])); g.appendChild(h('span', 'hh-bg', x[1])); if (x[5]) g.appendChild(h('span', 'hh-tag', x[5])); gg.appendChild(g); });
    go.appendChild(gg);

    // 3) competiciones
    var cs = sec(root, 'Competiciones', 'Ver todas', 'competiciones.html', '#22d3ee'), cg = h('div', 'hh-comp');
    var FM = { champions: ['⭐', '#22d3ee', 'Champions'], groups_knockout: ['🌍', '#2ee59d', 'Mundial'], knockout: ['⚔️', '#ffd23f', 'Eliminatoria'], round_robin: ['🔁', '#ff9d00', 'Todos contra todos'] };
    comps.sort(function (x, y) { return (y.c.status === 'active') - (x.c.status === 'active'); }).slice(0, 6).forEach(function (x) {
      var c = x.c, f = x.k === 'league' ? ['📋', '#8b5cf6', 'Liga'] : FM[c.format] || ['🏆', '#ffd23f', 'Torneo'], href = x.k === 'league' ? 'ligas.html' : c.format === 'groups_knockout' ? 'mundial.html' : c.format === 'champions' ? 'champions.html?t=' + c.id : 'competiciones.html';
      var card = a(href, 'hh-cc'); card.style.setProperty('--c', f[1]); card.appendChild(h('span', 'hh-ic', f[0])); card.appendChild(h('b', null, c.name));
      var ph = c.state && c.state.phase === 'done' ? '🏆 ' + MAGNA.teamName(c.state.champion) : c.state && c.state.round && c.state.phase !== 'groups' ? c.state.round : f[2];
      card.appendChild(h('small', null, ph + ' · ' + (c.teamIds || []).length + ' equipos'));
      card.appendChild(h('span', 'hh-st' + (c.status === 'active' ? ' on' : ''), c.status === 'active' ? 'En juego' : c.status === 'finished' ? 'Finalizada' : c.status === 'paused' ? 'En pausa' : 'Próximamente'));
      var row = h('div', 'hh-cs'); (c.teamIds || []).slice(0, 6).forEach(function (t) { row.appendChild(crest(t, 30)); }); if ((c.teamIds || []).length > 6) row.appendChild(h('em', null, '+' + ((c.teamIds || []).length - 6))); card.appendChild(row); cg.appendChild(card); });
    if (!comps.length) cg.appendChild(h('div', 'hh-empty', 'Aún no hay competiciones. Cuando la administración cree una liga o un torneo, aparecerá aquí.'));
    cs.appendChild(cg);

    // 4) próximos partidos y resultados (si hay)
    var up = S.matches.filter(function (m) { return m.status === 'scheduled' || m.status === 'live'; }).sort(function (x, y) { return (y.status === 'live') - (x.status === 'live') || String(x.at || '9').localeCompare(String(y.at || '9')); }).slice(0, 6);
    var last = fin.slice().sort(function (x, y) { return String(y.at || '').localeCompare(String(x.at || '')); }).slice(0, 6);
    if (up.length || last.length) {
      var ms = sec(root, up.length ? 'Próximos partidos' : 'Últimos resultados', 'Calendario', 'calendario.html', '#ff4fa3'), mg = h('div', 'hh-ms');
      (up.length ? up : last).forEach(function (m) { var r = a('calendario.html', 'hh-m'), cp = MAGNA.compOf(m); r.appendChild(crest(m.home, 34)); var t = h('div'); t.appendChild(h('b', null, MAGNA.teamName(m.home) + ' vs ' + MAGNA.teamName(m.away))); t.appendChild(h('small', null, (cp ? cp.name : '') + ' · ' + (m.status === 'finished' ? fdt(m.at) : fdt(m.at)))); r.appendChild(t);
        r.appendChild(m.status === 'finished' ? h('span', 'hh-sc', m.hs + '-' + m.as) : m.status === 'live' ? h('span', 'hh-lv', '● VIVO') : crest(m.away, 34)); mg.appendChild(r); });
      ms.appendChild(mg);
    }

    // 5) ranking
    var rs = sec(root, 'Los mejores', 'Ranking completo', 'ranking.html', '#ffd23f'), two = h('div', 'hh-two');
    var tb = h('div', 'hh-box'), th = h('h3'); th.appendChild(document.createTextNode('🛡️ Equipos por puntos')); tb.appendChild(th);
    var tr = S.teams.map(function (t) { return { t: t, p: (PT[t.id] || {}).pts || 0 }; }).sort(function (x, y) { return y.p - x.p || x.t.name.localeCompare(y.t.name); }).slice(0, 5);
    if (!tr.length) tb.appendChild(h('div', 'hh-empty', 'Aún no hay equipos.'));
    tr.forEach(function (x, i) { var r = a('equipo.html?id=' + x.t.id, 'hh-rk'); r.style.animationDelay = i * 60 + 'ms'; r.appendChild(h('span', 'hh-p', String(i + 1))); r.appendChild(crest(x.t.id, 36)); var d = h('div'); d.appendChild(h('b', null, x.t.name)); d.appendChild(h('small', null, MAGNA.teamTrophies ? MAGNA.teamTrophies(x.t.id).length + ' trofeos' : '')); r.appendChild(d); r.appendChild(h('span', 'hh-v', fmt(x.p) + ' pts')); tb.appendChild(r); });
    var pb = h('div', 'hh-box'), ph2 = h('h3'); ph2.appendChild(document.createTextNode('⭐ Jugadores por media')); pb.appendChild(ph2);
    var pr = players.map(function (p) { var x = PS[p.id] || {}; return { p: p, m: p.media != null ? p.media : x.media != null ? x.media : 10 }; }).sort(function (x, y) { return y.m - x.m || x.p.name.localeCompare(y.p.name); }).slice(0, 5);
    if (!pr.length) pb.appendChild(h('div', 'hh-empty', 'Aún no hay jugadores.'));
    pr.forEach(function (x, i) { var tier = MAGNA.tierOf ? MAGNA.tierOf(x.m) : { color: '#8b5cf6', name: '' }, r = a(MAGNA_COS.profileUrl(x.p.id), 'hh-rk'); r.style.animationDelay = i * 60 + 'ms'; r.appendChild(h('span', 'hh-p', String(i + 1)));
      var av = h('span', 'hh-pav'); av.style.setProperty('--kc', tier.color); av.style.setProperty('--pc', Math.max(4, Math.min(100, x.m))); av.appendChild(h('i', null, x.p.name.slice(0, 2).toUpperCase())); r.appendChild(av);
      var d = h('div'), nb = h('b'); nb.appendChild(MAGNA_COS.pn(x.p.name, x.p.id, { plain: true })); d.appendChild(nb); d.appendChild(h('small', null, (x.p.teamId ? MAGNA.teamName(x.p.teamId) : 'Agente libre') + (tier.name ? ' · ' + tier.name : ''))); r.appendChild(d); var v = h('span', 'hh-v', String(x.m)); v.style.color = tier.color; r.appendChild(v); pb.appendChild(r); });
    two.appendChild(tb); two.appendChild(pb); rs.appendChild(two);

    // 6) noticias (artículos publicados) o, si no hay, la actividad reciente
    var ns = sec(root, 'Noticias', 'Ver noticias', 'noticias.html', '#2ee59d'), nb = h('div'); ns.appendChild(nb);
    function feed() { nb.innerHTML = ''; var ev = (S.news || []).filter(function (n) { return !/gift|role|announcement/.test(n.kind); }).slice(0, 6);
      var IC = { match_result: ['⚽', '#ff5a36'], tournament_bracket: ['🏆', '#ffd23f'], trophy: ['🏆', '#ffd23f'], transfer: ['🔁', '#8b5cf6'], market: ['🛒', '#8b5cf6'], tournament_created: ['🆕', '#22d3ee'], friendly: ['🤝', '#2ee59d'], mvp: ['⭐', '#ffd23f'] };
      if (!ev.length) { nb.appendChild(h('div', 'hh-empty', 'Todavía no hay noticias. Aquí verás resultados, fichajes y campeones en cuanto pasen.')); return; }
      var fd = h('div', 'hh-feed'); ev.forEach(function (n) { var ic = IC[n.kind] || ['📣', '#8b5cf6'], r = h('div', 'hh-f'); r.style.setProperty('--fc', ic[1]); r.appendChild(h('span', null, ic[0])); r.appendChild(h('div', null, n.text)); r.appendChild(h('small', null, ago(n.at))); fd.appendChild(r); }); nb.appendChild(fd); }
    feed();
    if (window.MAGNA_SB) window.MAGNA_SB().then(function (c) { return c.from('articles').select('id,title,summary,category,cover_url,publish_at').in('status', ['published', 'scheduled']).lte('publish_at', new Date().toISOString()).order('publish_at', { ascending: false }).limit(3); }).then(function (r) {
      var rows = (r && r.data) || []; if (!rows.length) return; nb.innerHTML = ''; var g = h('div', 'hh-news');
      rows.forEach(function (x) { var n = a('noticias.html#n-' + x.id, 'hh-n'), cv = h('div', 'hh-cv'); if (x.cover_url && /^https:\/\//.test(x.cover_url)) cv.style.backgroundImage = 'url("' + x.cover_url.replace(/"/g, '') + '")'; n.appendChild(cv); var t = h('div', 'hh-tx'); t.appendChild(h('small', null, (x.category || 'Noticia') + ' · ' + ago(x.publish_at))); t.appendChild(h('b', null, x.title)); if (x.summary) t.appendChild(h('p', null, x.summary)); n.appendChild(t); g.appendChild(n); });
      nb.appendChild(g); }, function () {});

    // 7) equipos en desfile
    if (S.teams.length) { var es = sec(root, 'Equipos de la comunidad', 'Ver equipos', 'equipos.html', '#ff9d00'), mq = h('div', 'hh-mq'), trk = h('div', 'hh-tr'); trk.style.setProperty('--d', Math.max(20, S.teams.length * 3.2) + 's');
      var list = S.teams.slice().sort(function (x, y) { return x.name.localeCompare(y.name); }); list.concat(list).forEach(function (t, i) { var l = a('equipo.html?id=' + t.id, 'hh-t'); l.style.setProperty('--tc', MAGNA.teamColor ? MAGNA.teamColor(t.id) : '#8b5cf6'); if (i >= list.length) { l.setAttribute('aria-hidden', 'true'); l.tabIndex = -1; } l.appendChild(crest(t.id, 32)); l.appendChild(document.createTextNode(t.name)); trk.appendChild(l); });
      mq.appendChild(trk); es.appendChild(mq); }

    var note = main.querySelector('p.note'); if (note) main.insertBefore(root, note); else main.appendChild(root);
  }
  function boot() { try { build(); } catch (e) { if (window.console) console.error(e); } }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 0); }); else setTimeout(boot, 0);
  window.addEventListener('magna:update', boot);
})();
