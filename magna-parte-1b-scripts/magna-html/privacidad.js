'use strict';
fetch('/api/public/privacy').then(function (r) { return r.json(); }).then(function (d) {
  if (d.contact) { var p = document.getElementById('ct'); if (p) p.textContent = 'Contacto de privacidad de la comunidad: ' + d.contact; }
});
