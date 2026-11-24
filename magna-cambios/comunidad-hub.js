'use strict';
// Comunidad: Noticias, Apuestas, Tienda, Ranking y Equipos en una sola página (banners con datos en vivo)
(function () {
  var H = HUB, el = H.el, S = H.S, NEWS_L = null;
  var COL = { news: '#22b8ff', bet: '#ff5a36', shop: '#ff4fa3', rank: '#ffd23f', team: '#2ee59d' };
  var ICO = { color: '🎨', plate: '🏷️', frame: '🖼️', title: '🔤' }, RAR = { comun: 'Común', rara: 'Rara', epica: 'Épica', legendaria: 'Legendaria', mitica: 'Mítica' }, RO = { comun: 0, rara: 1, epica: 2, legendaria: 3, mitica: 4 };
  function bg(c) { return 'radial-gradient(circle at 25% 40%,' + c + '88,transparent 65%),radial-gradient(circle at 80% 10%,' + c + '44,transparent 60%)'; }
  function ranking() { var P = MAGNA.teamPoints ? MAGNA.teamPoints() : {}; return (S().teams || []).map(function (t) { return { id: t.id, pts: (P[t.id] || {}).pts || 0 }; }).sort(function (a, b) { return b.pts - a.pts || String(MAGNA.teamName(a.id)).localeCompare(String(MAGNA.teamName(b.id)), 'es'); }); }
  function shopNow() { var now = Date.now(); return (S().shop || []).filter(function (x) { return x.active !== false && !x.tempOff && !x.packOnly && !x.raffle && !x.award && !x.upg && x.price; })
    .map(function (x) { x._sale = x.saleUntil && H.when(x.saleUntil) > now; return x; }).sort(function (a, b) { return (b._sale ? 1 : 0) - (a._sale ? 1 : 0) || (RO[b.rarity] || 0) - (RO[a.rarity] || 0) || b.price - a.price; }); }
  function betable() { return (S().matches || []).filter(function (m) { return m.status === 'scheduled' && m.at && H.when(m.at) > Date.now(); }).sort(function (a, b) { return String(a.at).localeCompare(String(b.at)); }); }
  function prob(m) { try { var p = MAGNA.matchPreview(m).p; return Math.max(5, Math.min(95, Math.round(p * 100))); } catch (e) { return 50; } }
  function pbRow(m) { var r = el('div', 'pb'), a = el('div', 'a'), b = el('div', 'b'), p = prob(m), br = el('div', 'br'); a.appendChild(H.crest(m.home)); a.appendChild(el('span', null, H.short(m.home))); b.appendChild(H.crest(m.away)); b.appendChild(el('span', null, H.short(m.away)));
    var i1 = el('i', null, p + '%'), i2 = el('i', null, (100 - p) + '%'); i1.style.flex = p; i2.style.flex = 100 - p; br.appendChild(i1); br.appendChild(i2); r.appendChild(a); r.appendChild(br); r.appendChild(b); return r; }
  function agentName(a) { try { return window.NEWS && NEWS.agentOf ? NEWS.agentOf(a).name : 'Magna Sports'; } catch (e) { return 'Magna Sports'; } }
  function render() {
    var T = S().teams || [], Pl = S().players || [], RK = ranking(), SH = shopNow(), BT = betable(), live = (S().matches || []).filter(function (m) { return m.status === 'live'; });
    H.stats([[T.length, 'Equipos', '#2ee59d'], [Pl.length, 'Jugadores', '#b18cff'], [NEWS_L ? NEWS_L.length : 0, 'Noticias', '#22b8ff'], [SH.length, 'En la tienda', '#ff4fa3']]);
    var lp = H.$('#lvp'); lp.hidden = !live.length; lp.textContent = live.length + ' en vivo';
    // ahora mismo
    var sl = [];
    if (NEWS_L && NEWS_L[0]) { var n0 = NEWS_L[0]; sl.push({ href: 'noticias.html#n-' + n0.id, color: COL.news, bg: n0.cover_url ? 'url("' + n0.cover_url + '")' : bg(COL.news), chips: [['📰 Última noticia'], [agentName(n0), 'w']], body: H.quote(n0.title, n0.summary || ''), foot: H.ago(n0.publish_at), cta: 'Leer →' }); }
    if (BT[0]) { var m = BT[0], p = prob(m); sl.push({ href: 'apuestas.html', color: COL.bet, bg: bg(COL.bet), chips: [['🎲 Apuesta ya'], [p >= 50 ? MAGNA.teamName(m.home) + ' ' + p + '%' : MAGNA.teamName(m.away) + ' ' + (100 - p) + '%', 'w']], body: H.vs(m.home, m.away, 'VS'), foot: 'Cierra al empezar', at: m.at, pre: '⏱ ' }); }
    if (RK[0]) sl.push({ href: 'ranking.html', color: COL.rank, bg: bg(COL.rank), chips: [['👑 Nº 1 del ranking']], body: H.hero(H.crest(RK[0].id), MAGNA.teamName(RK[0].id), H.fmt(RK[0].pts) + ' pts'), foot: RK[1] ? 'Le sigue ' + MAGNA.teamName(RK[1].id) : '', cta: 'Ver ranking →' });
    if (SH[0]) { var it = SH[0]; sl.push({ href: 'tienda.html', color: COL.shop, bg: bg(COL.shop), chips: [[it._sale ? '🔥 En oferta' : '✨ Destacado'], [RAR[it.rarity] || 'Cosmético', 'w']], body: H.quote((ICO[it.type] || '✨') + ' ' + it.name, 'Cosmético para tu perfil'), foot: H.fmt(it.price) + ' Bits', cta: 'Ir a la tienda →' }); }
    H.spot('⚡ Ahora mismo', sl, 'Pronto habrá novedades en la comunidad.');
    // cinta de noticias
    H.ticker((NEWS_L || []).slice(0, 8).map(function (a) { return { href: 'noticias.html#n-' + a.id, tag: agentName(a), text: a.title }; }), 'Noticias');
    // banners
    var g = H.$('#cg'); g.innerHTML = ''; var i = 0;
    var nb = H.pv('Lo último', NEWS_L ? NEWS_L.length + ' publicaciones' : 'Cargando…');
    if (NEWS_L && NEWS_L.length) NEWS_L.slice(0, 4).forEach(function (a, k) { nb.appendChild(H.prow(k + 1, el('span', 'ic', '📰'), a.title, H.ago(a.publish_at), agentName(a))); });
    else nb.appendChild(el('div', 'pv-e', NEWS_L ? 'Todavía no hay noticias publicadas' : 'Cargando las noticias…'));
    g.appendChild(H.card({ i: i++, title: 'Noticias', color: COL.news, bg: bg(COL.news), tro: 'mascota/senalando.webp', mascot: true, href: 'noticias.html', status: 'Al día', on: true, ph: 'Cuentas oficiales y periodistas', ed: 'Comunicados, crónicas y análisis', body: nb, oneCol: true, foot: NEWS_L && NEWS_L[0] ? '📰 Última ' + H.ago(NEWS_L[0].publish_at) : '📰 Noticias de la comunidad', cta: 'Leer noticias' }));
    var bb = H.pv('Próximos partidos para apostar', 'Probabilidad'); BT.slice(0, 4).forEach(function (m) { bb.appendChild(pbRow(m)); }); if (!BT.length) bb.appendChild(el('div', 'pv-e', 'No hay partidos abiertos para apostar ahora'));
    g.appendChild(H.card({ i: i++, title: 'Apuestas', color: COL.bet, bg: bg(COL.bet), tro: 'mascota/jugando.webp', mascot: true, href: 'apuestas.html', status: BT.length ? BT.length + ' partidos abiertos' : 'Sin partidos abiertos', on: BT.length > 0, live: live.length > 0, ph: 'Con Bits ficticios', ed: 'Pronósticos, parleys y cash out', body: bb, oneCol: true, foot: BT[0] ? '⏱ Siguiente cierre ' : '🎲 Apuesta con tus Bits', footAt: BT[0] ? BT[0].at : null, cta: 'Apostar' }));
    var sb = H.pv(SH.some(function (x) { return x._sale; }) ? '🔥 Ofertas y destacados' : 'Destacados', 'Bits'); SH.slice(0, 4).forEach(function (x, k) { var r = H.prow(k + 1, el('span', 'ic', ICO[x.type] || '✨'), x.name, H.fmt(x.price), (RAR[x.rarity] || '') + (x._sale ? ' · Oferta' : '')); r.querySelector('small').className = 'rar-' + x.rarity; sb.appendChild(r); });
    if (!SH.length) sb.appendChild(el('div', 'pv-e', 'La tienda se está surtiendo'));
    g.appendChild(H.card({ i: i++, title: 'Tienda', color: COL.shop, bg: bg(COL.shop), tro: 'mascota/pulgar-arriba.webp', mascot: true, href: 'tienda.html', status: SH.length + ' artículos', on: true, ph: 'Colores, placas, marcos y títulos', ed: 'Personaliza tu perfil con Bits', body: sb, foot: SH.some(function (x) { return x._sale; }) ? '🔥 Hay ofertas activas' : '🪙 Paga con tus Bits', cta: 'Ir a la tienda' }));
    var rb = H.pv('Ranking de equipos', 'Puntos'); RK.slice(0, 6).forEach(function (x, k) { rb.appendChild(H.prow(k + 1, H.crest(x.id), MAGNA.teamName(x.id), H.fmt(x.pts))); });
    g.appendChild(H.card({ i: i++, title: 'Ranking', color: COL.rank, bg: bg(COL.rank), tro: 'mascota/trofeo.webp', mascot: true, href: 'ranking.html', status: 'Temporada', on: true, ph: 'Equipos, jugadores y Bits', ed: 'Quién manda en Magna', body: rb, cols: true, foot: RK[0] ? '👑 Líder: ' + MAGNA.teamName(RK[0].id) : '', cta: 'Ver ranking' }));
    var eb = H.pv(T.length + ' equipos', Pl.length + ' jugadores'), wall = el('div', 'wall'); T.slice().sort(function (a, b) { return String(a.name).localeCompare(String(b.name), 'es'); }).forEach(function (t) { var c = H.crest(t.id); c.title = t.name; wall.appendChild(c); }); eb.appendChild(wall);
    g.appendChild(H.card({ i: i++, title: 'Equipos', color: COL.team, bg: bg(COL.team), tro: 'mascota/brazos-cruzados.webp', mascot: true, href: 'equipos.html', status: T.length + ' equipos', on: true, ph: 'Plantillas, fotos y trofeos', ed: 'También perfiles de jugadores', body: eb, foot: '🛡️ Conoce cada plantilla', cta: 'Ver equipos' }));
    var TV = (S().matches || []).filter(function (m) { return m.stream && m.status !== 'cancelled'; }), tvL = TV.filter(function (m) { return m.status === 'live'; }), tvB = H.pv(tvL.length ? 'En vivo ahora' : 'Transmisiones', TV.length + '');
    TV.slice().sort(function (a, b) { return (a.status === 'live' ? 0 : 1) - (b.status === 'live' ? 0 : 1) || String(b.at || '').localeCompare(String(a.at || '')); }).slice(0, 4).forEach(function (m) { tvB.appendChild(H.prow(m.status === 'live' ? '●' : m.status === 'finished' ? '▶' : '⏰', H.crest(m.home), MAGNA.teamName(m.home) + ' vs ' + MAGNA.teamName(m.away), m.status === 'scheduled' ? '' : (m.hs || 0) + '-' + (m.as || 0), m.status === 'live' ? 'En vivo' : m.status === 'finished' ? 'Repetición' : 'Próxima')); });
    if (!TV.length) tvB.appendChild(el('div', 'pv-e', 'Pronto los partidos se podrán ver aquí'));
    g.appendChild(H.card({ i: i++, title: 'Transmisiones', color: '#ff3b30', bg: bg('#ff3b30'), tro: 'mascota/senalando.webp', mascot: true, href: 'transmisiones.html', status: tvL.length ? tvL.length + ' en vivo' : TV.length ? TV.length + ' videos' : 'Muy pronto', on: TV.length > 0, live: tvL.length > 0, ph: 'YouTube, Twitch y Kick', ed: 'Partidos en vivo y repeticiones', body: tvB, oneCol: true, foot: tvL.length ? '📺 ¡Hay partido en vivo!' : '📺 Mira los partidos aquí', cta: 'Ver transmisiones' }));
    H.$('#cnt').textContent = i + ' secciones'; H.done(); }
  render();
  function loadNews() { if (!window.NEWS || !NEWS.listPublic) return; NEWS.listPublic().then(function (r) { NEWS_L = (r && r.data) || []; render(); }, function () { NEWS_L = []; render(); }); }
  if (document.readyState === 'complete') loadNews(); else addEventListener('load', loadNews);
  window.addEventListener('magna:update', render);
})();
