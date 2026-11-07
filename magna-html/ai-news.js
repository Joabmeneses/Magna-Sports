'use strict';
// Redactor IA del panel: pide a la función "noticias-ia" de Supabase que convierta lo que pasa
// (resultados, campeones, fichajes, avances de torneo) en borradores de noticia para revisar.
(function () {
  var KEY_AUTO = 'magna_ai_auto', last = null, timer = null, running = false, listeners = [];
  var KINDS = /^(match_result|tournament_bracket|tournament_created|tournament_finished|trophy|transfer|market|friendly|coach)$/;
  function sb() { return window.MAGNA_ADMIN && MAGNA_ADMIN.sb; }
  function auto() { try { return localStorage.getItem(KEY_AUTO) !== '0'; } catch (e) { return true; } }
  function setAuto(v) { try { localStorage.setItem(KEY_AUTO, v ? '1' : '0'); } catch (e) {} emit(); }
  function emit(ev) { listeners.forEach(function (f) { try { f(ev || {}); } catch (e) {} }); }
  function call(action) {
    var c = sb(); if (!c || !c.functions) return Promise.reject(new Error('El redactor IA solo funciona en la web publicada.'));
    return c.functions.invoke('noticias-ia', { body: { action: action } }).then(function (r) {
      if (r.error) { var ctx = r.error.context; if (ctx && typeof ctx.json === 'function') return ctx.json().then(function (j) { var e = new Error(j.message || j.error || r.error.message); e.code = j.error; throw e; }, function () { throw r.error; }); throw r.error; }
      return r.data; });
  }
  function toast(html, link) {
    var t = document.createElement('div'); t.setAttribute('role', 'status');
    t.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:120;max-width:min(380px,calc(100vw - 36px));background:linear-gradient(135deg,#2a1f6e,#141a3d);border:1px solid #8b5cf6;color:#f1f3fb;border-radius:18px;padding:14px 16px;font:600 14px Archivo,sans-serif;box-shadow:0 18px 40px rgba(0,0,0,.5);display:flex;gap:12px;align-items:center';
    t.textContent = html; if (link) { var b = document.createElement('button'); b.type = 'button'; b.textContent = 'Revisar'; b.style.cssText = 'margin-left:auto;background:#8b5cf6;border:0;color:#fff;border-radius:999px;padding:8px 14px;font:700 13px Archivo,sans-serif;cursor:pointer'; b.onclick = function () { t.remove(); link(); }; t.appendChild(b); }
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 9000);
  }
  function run(manual) {
    if (running) return Promise.resolve(null); clearTimeout(timer); timer = null; running = true; emit({ running: true });
    return call('run').then(function (r) { running = false; var n = (r && r.created || []).length;
      if (n) toast('🤖 La IA redactó ' + n + (n === 1 ? ' borrador nuevo' : ' borradores nuevos') + ' de noticia.', function () { if (window.ADMIN_GO) ADMIN_GO('noticias'); else location.hash = 'noticias'; });
      else if (manual) toast(r && r.error ? '⚠ ' + r.error : 'No hay novedades nuevas para redactar.');
      emit({ result: r }); return r; },
      function (e) { running = false; if (manual || e.code !== 'no_key') toast('⚠ ' + (e.code === 'no_key' ? 'Falta configurar la clave de Claude.' : e.message)); emit({ error: e }); throw e; });
  }
  function newest() { var n = (window.MAGNA && MAGNA.S.news) || []; return n.filter(function (x) { return KINDS.test(x.kind); }).reduce(function (m, x) { return Math.max(m, x.id || 0); }, 0); }
  // automático: cuando aparecen novedades, espera 90 s (para juntar los eventos de un partido) y redacta
  function watch() {
    var nw = newest(); if (last === null) { last = nw; return; }
    if (nw > last) { last = nw; if (auto()) { clearTimeout(timer); timer = setTimeout(function () { run(false).catch(function () {}); }, 90000); emit({ scheduled: true }); } }
  }
  function boot() { if (!sb()) return setTimeout(boot, 1000);
    // al abrir el panel, si quedó algo sin redactar (por ejemplo fichajes que hicieron los DT), se redacta
    setTimeout(function () { if (!auto()) return; call('status').then(function (s) { if (s && s.configured && s.pending > 0) run(false).catch(function () {}); }, function () {}); }, 8000);
    setInterval(watch, 15000); watch(); }
  window.AI_NEWS = { status: function () { return call('status'); }, run: function () { return run(true); }, auto: auto, setAuto: setAuto, busy: function () { return running; }, scheduled: function () { return !!timer; }, on: function (f) { listeners.push(f); return function () { listeners = listeners.filter(function (x) { return x !== f; }); }; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
