'use strict';
// Service worker de Magna Arena: la app abre rápido y funciona aunque la conexión sea mala.
// Páginas: primero la red (para ver siempre lo último) y, si no hay, la copia guardada o la página sin conexión.
// Estilos, scripts e imágenes: se sirven al instante desde la copia y se actualizan en segundo plano.
var V = 'magna-v2', CORE = ['offline.html', 'site.css', 'cos.css', 'arena.css', 'nav.js', 'store.js', 'cos.js', 'site.js', 'logo-nav.webp', 'bits.webp', 'img/app/icon-192.png'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(V).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== V; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); })); });
function put(req, res) { if (res && res.ok && res.type === 'basic') { var cp = res.clone(); caches.open(V).then(function (c) { c.put(req, cp); }); } return res; }
self.addEventListener('fetch', function (e) {
  var r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;            // base de datos y otros sitios: siempre directo
  if (/\/admin/.test(u.pathname) || u.pathname.indexOf('middleware') >= 0) return; // el panel nunca se guarda
  if (r.mode === 'navigate' || /\.html$/.test(u.pathname) || u.pathname.slice(-1) === '/') {
    e.respondWith(fetch(r).then(function (res) { return put(r, res); }).catch(function () { var o = { ignoreSearch: true, ignoreVary: true }, f = u.pathname.split('/').pop() || 'index.html'; return caches.match(r, o).then(function (m) { return m || caches.match(f, o); }).then(function (m) { return m || caches.match('offline.html'); }); }));
    return; }
  e.respondWith(caches.match(r).then(function (m) { var net = fetch(r).then(function (res) { return put(r, res); }).catch(function () { return m; }); return m || net; }));
});
// tocar un aviso abre (o enfoca) la página del partido
self.addEventListener('notificationclick', function (e) { e.notification.close(); var url = (e.notification.data && e.notification.data.url) || 'index.html';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (cs) { for (var i = 0; i < cs.length; i++) { if ('focus' in cs[i]) { cs[i].navigate && cs[i].navigate(url); return cs[i].focus(); } } return self.clients.openWindow(url); })); });
