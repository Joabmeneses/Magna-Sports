'use strict';
// Cuentas con usuario + código: entrar, mi cuenta, gestión (solo admins) y Bits.
window.ACCOUNTS = (function () {
  function sb() { return window.MAGNA_SB(); }
  function chk(r) { if (r && r.error) throw r.error; return r; }
  function login(username, code) {
    return fetch(MAGNA.cloud.url + '/functions/v1/entrar', { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: MAGNA.cloud.key, Authorization: 'Bearer ' + MAGNA.cloud.key }, body: JSON.stringify({ username: username, code: code }) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || !j.access_token) throw new Error(j.error || 'No se pudo entrar'); return j; }); })
      .then(function (j) { return sb().then(function (c) { return c.auth.setSession({ access_token: j.access_token, refresh_token: j.refresh_token }).then(chk).then(function () { if (window.MAGNA_ME) MAGNA_ME.refresh(); return j.role; }); }); });
  }
  function me() { return sb().then(function (c) { return c.auth.getSession().then(function (r) { var s = r.data && r.data.session; if (!s || s.user.is_anonymous) return null; return c.rpc('my_account').then(function (x) { return (x.data && x.data[0]) || null; }); }); }).catch(function () { return null; }); }
  function logout() { return sb().then(function (c) { return c.auth.signOut(); }).then(function (r) { if (window.MAGNA_ME) MAGNA_ME.refresh(); return r; }); }
  function list() { return sb().then(function (c) { return c.rpc('admin_accounts').then(chk).then(function (r) { return r.data || []; }); }); }
  function manage(action, body) { return sb().then(function (c) { return c.functions.invoke('cuentas', { body: Object.assign({ action: action }, body || {}) }).then(function (r) {
    if (r.error) { var ctx = r.error.context; if (ctx && ctx.json) return ctx.json().then(function (j) { throw new Error(j.error || r.error.message); }, function () { throw r.error; }); throw r.error; }
    if (r.data && r.data.error) throw new Error(r.data.error); return r.data; }); }); }
  function setBits(id, bits) { return sb().then(function (c) { return c.rpc('admin_set_bits', { p_account: id, p_bits: bits }).then(chk); }); }
  function gift(ids, amount, message) { return sb().then(function (c) { return c.rpc('admin_gift_bits', { p_accounts: ids, p_amount: amount, p_message: message || null }).then(chk).then(function (r) { return r.data; }); }); }
  // Acciones del coach (DT): alineación, fichar, liberar y ofertas. Las valida la base de datos.
  function coach(fn, args) { return sb().then(function (c) { return c.rpc(fn, args || {}).then(chk).then(function (r) { return r.data; }); }); }
  function pullState() { return sb().then(function (c) { return c.from('site_state').select('data').eq('id', 1).single().then(function (r) { if (r.data && r.data.data) { MAGNA.cloud.applyRemote(r.data.data); try { window.dispatchEvent(new CustomEvent('magna:update', { detail: { remote: true } })); } catch (e) {} } return r.data && r.data.data; }); }); }
  function playerBits() { return sb().then(function (c) { return c.rpc('player_bits').then(function (r) { var o = {}; (r.data || []).forEach(function (x) { o[x.player_id] = x.bits; }); return o; }); }).catch(function () { return {}; }); }
  function myBets() { return sb().then(function (c) { return c.from('bets').select('*').order('created_at', { ascending: false }).limit(100).then(chk).then(function (r) { return r.data || []; }); }); }
  function placeBet(matchId, side, stake) { return sb().then(function (c) { return c.rpc('place_bet', { p_match: matchId, p_side: side, p_stake: stake }).then(chk).then(function (r) { return r.data; }); }); }
  function cashOut(id) { return sb().then(function (c) { return c.rpc('cash_out', { p_bet: id }).then(chk).then(function (r) { return r.data; }); }); }
  // Diálogo con usuario y código para copiar
  function codeBox(h, acc) {
    var w = h('div', 'cbox');
    [['Usuario', acc.username], ['Código', acc.code]].forEach(function (x) { var r = h('div', 'crow'); r.appendChild(h('span', 'cl', x[0])); r.appendChild(h('b', 'cv' + (x[0] === 'Código' ? ' code' : ''), x[1] || '—'));
      var b = h('button', 'b sm', 'Copiar'); b.type = 'button'; b.onclick = function () { copy(x[1], b); }; r.appendChild(b); w.appendChild(r); });
    var all = h('button', 'b o', 'Copiar usuario y código'); all.type = 'button'; all.onclick = function () { copy('Magna Arena · Usuario: ' + acc.username + ' · Código: ' + acc.code, all); }; w.appendChild(all);
    return w;
  }
  function copy(text, btn) {
    function done() { var t = btn.textContent; btn.textContent = '¡Copiado!'; setTimeout(function () { btn.textContent = t; }, 1600); }
    (navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(text) : Promise.reject()).then(done, function () { var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) {} ta.remove(); });
  }
  return { login: login, me: me, logout: logout, list: list, manage: manage, setBits: setBits, gift: gift, coach: coach, pullState: pullState, playerBits: playerBits, myBets: myBets, placeBet: placeBet, cashOut: cashOut, codeBox: codeBox, copy: copy };
})();
