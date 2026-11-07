'use strict';
// Partidos apostables a partir de los datos del panel. Apuestas y saldo viven en este navegador (Bits ficticios).
window.MAGNA_BETS_MS = function () {
  var S = MAGNA.S, by = MAGNA.by, KEY = 'magna_bets_v1', COL = ['#8b5cf6', '#3b4bff', '#2ee59d', '#ffd23f', '#ff5a36', '#22d3ee'];
  var sv = null; try { sv = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
  // reembolso de apuestas abiertas sobre partidos que ya no existen o fueron cancelados
  if (sv && sv.B) {
    var ch = false; sv.B.forEach(function (b) { var m = by(S.matches, b.mid); if (b.st === 'open' && (!m || m.status === 'cancelled')) { b.st = 'cash'; b.pay = b.stake; sv.bal += b.stake; ch = true; } });
    if (ch) try { localStorage.setItem(KEY, JSON.stringify(sv)); } catch (e) {}
  }
  var ref = {}; if (sv && sv.B) sv.B.forEach(function (b) { if (b.st === 'open') ref[b.mid] = 1; });
  function wr(t) { var f = S.matches.filter(function (m) { return m.status === 'finished' && (m.home === t || m.away === t); }); if (!f.length) return .5; return f.filter(function (m) { return m.home === t ? m.hs > m.as : m.as > m.hs; }).length / f.length; }
  var list = S.matches.filter(function (m) { return m.status === 'live' || m.status === 'scheduled' || ref[m.id]; })
    .sort(function (a, b) { return (b.status === 'live') - (a.status === 'live') || String(a.at || '9').localeCompare(String(b.at || '9')); }).slice(0, 12);
  var cols = {}, n = 0;
  return list.map(function (m) {
    var c = MAGNA.compOf(m), name = c ? c.name : '—'; if (!cols[name]) cols[name] = COL[n++ % COL.length];
    var live = m.status === 'live', fin = m.status === 'finished', el = live ? MAGNA.liveSecs(m) : 0, L = m.live || {};
    var hu = MAGNA.crestUrl(m.home), au = MAGNA.crestUrl(m.away), pv = MAGNA.matchPreview(m);
    return { id: m.id, lg: name, c: cols[name], h: MAGNA.teamName(m.home), a: MAGNA.teamName(m.away), hi: hu ? 'url:' + hu : 'e', ai: au ? 'url:' + au : 'e', live: live || fin ? 1 : 0, fin: fin ? 1 : 0,
      t: fin ? 5400 : live ? Math.max(0, Math.min(el, 5399)) : 0, s: [m.hs || 0, m.as || 0], phase: L.phase || (live ? '1T' : 'pre'), mode: L.mode || null, min: live ? MAGNA.liveMinute(m) : 0, run: !!(L.clock && L.clock.run), closed: live && (L.phase === 'HT' || L.phase === '2T'), cx: m.status === 'cancelled' ? 1 : 0, sd: pv.sd, an: pv, ph: 0,
      when: m.at ? new Date(m.at.replace(' ', 'T') + 'Z').toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Sin fecha' };
  });
};
// Datos actualizados de un partido (para el tiempo real).
window.MAGNA_BET_STATE = function (id) {
  var m = MAGNA.by(MAGNA.S.matches, id); if (!m) return null; var L = m.live || {}, live = m.status === 'live';
  return { live: live || m.status === 'finished' ? 1 : 0, fin: m.status === 'finished' ? 1 : 0, cx: m.status === 'cancelled' ? 1 : 0, s: [m.hs || 0, m.as || 0], t: m.status === 'finished' ? 5400 : live ? Math.max(0, Math.min(MAGNA.liveSecs(m), 5399)) : 0,
    phase: L.phase || (live ? '1T' : 'pre'), mode: L.mode || null, min: live ? MAGNA.liveMinute(m) : 0, run: !!(L.clock && L.clock.run), closed: live && (L.phase === 'HT' || L.phase === '2T') };
};
