'use strict';
// Inicio: debajo de las alineaciones, si el partido ya tiene planilla del juez, la gente puede darle de 1 a 5 estrellas.
(function () {
  if (!window.MAGNA) return;
  var box = null, last = '', busy = false;
  function h(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function css() { if (document.getElementById('jv-css')) return; var s = document.createElement('style'); s.id = 'jv-css'; s.textContent =
    '.jv{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin:14px 0 26px;padding:12px 16px;background:#f1ead8;background-image:radial-gradient(rgba(0,0,0,.07) 1px,transparent 1.3px);background-size:7px 7px;color:#0d0d10;border:3px solid #0d0d10;border-radius:12px;box-shadow:6px 6px 0 #22b8ff;font-family:Archivo,sans-serif}' +
    '.jv-w{display:flex;align-items:center;gap:10px;min-width:0;flex:1 1 260px}.jv-w>i{flex:none;font-style:normal;font-size:26px}.jv-w b{display:block;font:italic 900 16px Archivo,sans-serif;text-transform:uppercase}.jv-w small{display:block;color:#5b574c;font-weight:700;font-size:12.5px}' +
    '.jv-avg{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;background:#0d0d10;color:#ffd23f;border-radius:999px;font:900 13px Archivo,sans-serif}' +
    '.jv-s{display:flex;gap:2px}.jv-s button{border:0;background:none;padding:2px;font-size:30px;line-height:1;cursor:pointer;color:#cfc6ad;transition:transform .12s,color .12s;-webkit-text-stroke:1.5px #0d0d10}' +
    '.jv-s button.on{color:#ffd23f}.jv-s button:hover{transform:scale(1.2) rotate(-8deg)}.jv-s button:disabled{cursor:default}.jv-q{font:800 13px Archivo,sans-serif;color:#3a372f}' +
    '.jv-pop{animation:jvP .5s cubic-bezier(.2,1.6,.4,1)}@keyframes jvP{40%{transform:scale(1.35) rotate(-12deg)}}';
    document.head.appendChild(s); }
  function stars(n) { var f = Math.round(n * 2) / 2, s = ''; for (var i = 1; i <= 5; i++) s += i <= f ? '★' : (i - .5 === f ? '⯪' : '☆'); return s; }
  function draw() {
    var al = document.getElementById('alineaciones'); if (!al) return; var mid = Number(al.dataset.mid), m = mid && MAGNA.by(MAGNA.S.matches, mid), J = m && m.live && m.live.judged;
    var key = mid + '|' + (J ? J.id + J.at : ''); if (key === last && box && box.isConnected) return; last = key;
    if (!J || !J.id) { if (box) { box.remove(); box = null; } return; }
    css(); if (!box) { box = h('section', 'jv'); box.setAttribute('aria-label', 'Califica al juez'); } if (box.previousElementSibling !== al) al.parentNode.insertBefore(box, al.nextSibling);
    box.innerHTML = ''; var w = h('div', 'jv-w'); w.appendChild(h('i', null, '⚖️')); var t = h('div'); t.appendChild(h('b', null, 'Juez: ' + J.by)); var sm = h('small', null, 'Puso las notas, los goles y el MVP de este partido.'); t.appendChild(sm); w.appendChild(t); box.appendChild(w);
    var avg = h('span', 'jv-avg', '★ —'); avg.title = 'Promedio del juez'; box.appendChild(avg);
    var q = h('span', 'jv-q', '¿Qué tal juzgó?'), st = h('div', 'jv-s'); box.appendChild(q); box.appendChild(st);
    var mine = 0; function paint(n) { [].forEach.call(st.children, function (b, i) { b.classList.toggle('on', i < n); }); }
    for (var i = 1; i <= 5; i++) (function (i) { var b = h('button', null, '★'); b.type = 'button'; b.setAttribute('aria-label', i + (i === 1 ? ' estrella' : ' estrellas'));
      b.onmouseenter = function () { paint(i); }; b.onmouseleave = function () { paint(mine); };
      b.onclick = function () { if (busy || !window.ACCOUNTS) return; busy = true; ACCOUNTS.rateJudge(mid, i).then(function () { mine = i; paint(i); b.classList.remove('jv-pop'); void b.offsetWidth; b.classList.add('jv-pop'); q.textContent = '¡Gracias! Tu voto: ' + i + '★'; load(); },
        function (e) { q.textContent = (e && e.message) || 'No se pudo votar'; }).then(function () { busy = false; }); };
      st.appendChild(b); })(i);
    function load() { if (!window.ACCOUNTS || !ACCOUNTS.judgeStars) return; ACCOUNTS.judgeStars(mid).then(function (L) { var r = L.filter(function (x) { return x.judge_id === J.id; })[0]; if (!r) { avg.textContent = '★ Sin votos'; return; }
      avg.textContent = r.votes ? stars(Number(r.avg_stars)) + ' ' + String(r.avg_stars).replace('.', ',') + ' (' + r.votes + ')' : '★ Sin votos aún';
      if (r.my_vote) { mine = r.my_vote; paint(mine); q.textContent = 'Tu voto: ' + mine + '★ · puedes cambiarlo'; } }, function () {}); }
    if (window.ACCOUNTS) ACCOUNTS.me().then(function (a) { if (!a) { q.textContent = 'Entra con tu cuenta para calificar al juez'; [].forEach.call(st.children, function (b) { b.disabled = true; }); } });
    load();
  }
  var tt = null; function sch() { clearTimeout(tt); tt = setTimeout(draw, 250); }
  addEventListener('magna:update', sch); new MutationObserver(sch).observe(document.body, { childList: true, subtree: false });
  setInterval(draw, 4000); setTimeout(draw, 1200);
})();
