'use strict';
// Carga la librería de Supabase (una sola vez) y entrega el cliente.
window.MAGNA_SB = (function () {
  var SRC = ['https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4', 'https://unpkg.com/@supabase/supabase-js@2.45.4/dist/umd/supabase.js'], p = null, client = null;
  function load(i) {
    return new Promise(function (res, rej) {
      if (window.supabase && window.supabase.createClient) return res();
      var s = document.createElement('script'); s.src = SRC[i]; s.async = true; s.onload = function () { res(); };
      s.onerror = function () { s.remove(); if (i + 1 < SRC.length) load(i + 1).then(res, rej); else rej(new Error('No se pudo cargar Supabase')); };
      document.head.appendChild(s);
    });
  }
  return function () {
    if (!p) p = load(0).then(function () { client = window.supabase.createClient(MAGNA.cloud.url, MAGNA.cloud.key, { auth: { persistSession: true, autoRefreshToken: true }, realtime: { params: { eventsPerSecond: 10 } } }); return client; });
    return p;
  };
})();
