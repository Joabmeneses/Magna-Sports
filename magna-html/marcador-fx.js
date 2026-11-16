'use strict';
// Animaciones dentro del banner del marcador (portada). Cada evento nuevo del partido elegido se ve con su
// propia animación: gol, casi gol, atajada, jugada, contraataque, polémica, muro, afición, último minuto,
// narración libre, cambio, inicio, medio tiempo, 2.º tiempo, final, modo y MVP. También mantiene el marcador al día.
// Todo se anima con transform/opacity y se borra al terminar, para no dar lag.
(function () {
  if (!window.MAGNA || !window.MAGNA_BN) return;
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches, BN = window.MAGNA_BN;
  function h(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function host() { var b = document.getElementById('marcador'); return b && b.offsetParent ? b : null; }
  function mt() { var id = window.__HOME_SEL; return id ? MAGNA.by(MAGNA.S.matches, id) : null; }
  function tid(m, sd) { return m ? (sd === 'a' ? m.away : m.home) : null; }
  function tcol(m, sd) { var t = tid(m, sd); return t ? MAGNA.teamColor(t) : '#c6ff1a'; }
  function tnm(m, sd) { var t = tid(m, sd); if (t) return MAGNA.teamName(t); var x = BN.M[BN.cur()] || {}; return sd === 'a' ? x.a : x.h; }
  function pn(id) { return id ? (MAGNA.playerName(id) || '') : ''; }
  function score(m) { if (m) return (m.hs || 0) + ' - ' + (m.as || 0); var x = BN.M[BN.cur()] || { s: [0, 0] }; return x.s[0] + ' - ' + x.s[1]; }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  var CSS = '' +
    '.bfx{position:absolute;inset:0;z-index:9;border-radius:inherit;overflow:hidden;pointer-events:none;contain:layout paint;background:radial-gradient(120% 90% at 50% 40%,color-mix(in srgb,var(--tc) 55%,#0a0d18) 0,#080a16 78%);animation:bfxIn .32s cubic-bezier(.7,0,.2,1) both}' +
    '.bfx:before{content:"";position:absolute;inset:-20%;background:repeating-conic-gradient(from 0deg at 50% 42%,rgba(255,255,255,.06) 0 8deg,transparent 8deg 16deg);animation:bfxRot 14s linear infinite}' +
    '.bfx.out{animation:bfxOut .4s ease-in forwards}' +
    '@keyframes bfxIn{from{clip-path:circle(0 at 50% 45%)}to{clip-path:circle(80% at 50% 45%)}}@keyframes bfxOut{to{opacity:0;transform:scale(1.05)}}@keyframes bfxRot{to{transform:rotate(1turn)}}' +
    '.bfx-st{position:absolute;z-index:2;left:0;right:0;top:0;height:58%}' +
    '.bfx-t{position:absolute;left:4%;right:4%;bottom:11%;z-index:5;display:grid;justify-items:center;gap:10px;text-align:center;transform:rotate(-3deg)}' +
    '.bfx-t b{display:block;max-width:100%;font:italic 900 clamp(30px,9.5vw,78px)/.92 Archivo,sans-serif;font-stretch:125%;color:#fff;-webkit-text-stroke:2px #0d0d10;paint-order:stroke fill;text-shadow:4px 4px 0 var(--tc),0 0 30px color-mix(in srgb,var(--tc) 70%,transparent);text-transform:uppercase;text-wrap:balance;animation:bfxSlam .62s var(--td,.25s) cubic-bezier(.2,1.5,.4,1) both}' +
    '.bfx-t span{padding:6px 14px;border-radius:9px;background:#0d0d10;color:#c6ff1a;font:900 clamp(11px,3.3vw,15px)/1.15 Archivo,sans-serif;text-transform:uppercase;letter-spacing:.06em;box-shadow:3px 3px 0 var(--tc);max-width:100%;animation:bfxUp .4s calc(var(--td,.25s) + .3s) both}' +
    '@keyframes bfxSlam{0%{opacity:0;transform:scale(2.6) rotate(8deg)}55%{opacity:1;transform:scale(.92)}75%{transform:scale(1.04)}100%{transform:none}}@keyframes bfxUp{from{opacity:0;transform:translateY(16px)}}' +
    '.bfx.bf-shk .bfx-st,.bfx.bf-shk .bfx-t{animation:bfxShk .45s var(--sd,.7s) both}@keyframes bfxShk{20%{transform:translate(-7px,4px)}40%{transform:translate(6px,-4px)}60%{transform:translate(-4px,2px)}80%{transform:translate(2px,-1px)}}' +
    '.bfx-e{position:absolute;line-height:1;will-change:transform}' +
    // casi gol: portería, balón al palo, impacto
    '.nf-g{position:absolute;right:8%;top:16%;width:30%;height:62%;border:6px solid #fff;border-bottom:0;border-radius:6px 6px 0 0;background:repeating-linear-gradient(45deg,rgba(255,255,255,.2) 0 2px,transparent 2px 12px),repeating-linear-gradient(-45deg,rgba(255,255,255,.2) 0 2px,transparent 2px 12px);box-shadow:0 0 22px rgba(255,255,255,.25);transform:perspective(500px) rotateY(-22deg);animation:nfIn .4s .1s both,nfPost .5s .78s both}' +
    '@keyframes nfIn{from{opacity:0;transform:perspective(500px) rotateY(-22deg) translateX(40px)}}@keyframes nfPost{20%{transform:perspective(500px) rotateY(-22deg) translateX(6px) rotate(2deg)}45%{transform:perspective(500px) rotateY(-22deg) translateX(-5px) rotate(-1.5deg)}70%{transform:perspective(500px) rotateY(-22deg) translateX(3px)}}' +
    '.nf-b{left:6%;top:70%;font-size:clamp(28px,7vw,46px);animation:nfBall 1.7s .15s cubic-bezier(.35,.6,.45,1) both}' +
    '@keyframes nfBall{0%{transform:translate(0,0) rotate(0) scale(.8)}38%{transform:translate(var(--hx),var(--hy)) rotate(560deg) scale(1)}100%{transform:translate(var(--ox),var(--oy)) rotate(820deg) scale(.7);opacity:0}}' +
    '.nf-x{width:90px;height:90px;margin:-45px 0 0 -45px;background:radial-gradient(circle,#fff 0 18%,#ffd23f 19% 40%,transparent 41%);clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);animation:nfX .5s .78s cubic-bezier(.2,1.6,.4,1) both}@keyframes nfX{0%{opacity:0;transform:scale(0) rotate(-40deg)}50%{opacity:1;transform:scale(1.3)}100%{opacity:0;transform:scale(1.6) rotate(20deg)}}' +
    '.nf-u{font:italic 900 clamp(16px,4.5vw,26px) Archivo,sans-serif;color:#ffd23f;-webkit-text-stroke:1.5px #0d0d10;paint-order:stroke fill;animation:nfU 1s .85s both}@keyframes nfU{0%{opacity:0;transform:translate(-50%,0) scale(.4)}30%{opacity:1;transform:translate(-50%,-24px) scale(1.15) rotate(-8deg)}100%{opacity:0;transform:translate(-50%,-50px) rotate(-8deg)}}' +
    // atajada: balón al centro, guante que lo atrapa, ondas
    '.sv-b{left:50%;top:45%;font-size:clamp(30px,8vw,50px);animation:svB .7s .1s cubic-bezier(.3,.7,.4,1) both}@keyframes svB{from{transform:translate(calc(-50% + var(--sx)),calc(-50% - 60px)) scale(.4) rotate(-300deg)}to{transform:translate(-50%,-50%) scale(1.05)}}' +
    '.sv-g{left:50%;top:45%;font-size:clamp(64px,17vw,120px);animation:svG .55s .45s cubic-bezier(.2,1.5,.4,1) both,svSq .3s 1s both}@keyframes svG{from{opacity:0;transform:translate(-130%,40%) rotate(-50deg) scale(.5)}to{opacity:1;transform:translate(-50%,-50%) rotate(-12deg)}}@keyframes svSq{50%{transform:translate(-50%,-50%) rotate(-12deg) scale(1.12,.9)}}' +
    '.sv-r{left:50%;top:45%;width:80px;height:80px;margin:-40px 0 0 -40px;border-radius:50%;border:4px solid var(--tc);animation:svR 1s .95s ease-out both}@keyframes svR{0%{opacity:1;transform:scale(.6)}100%{opacity:0;transform:scale(3.2);border-width:1px}}' +
    // jugada: estallido de cómic con chispas
    '.jg-s{left:50%;top:50%;width:min(62%,250px);aspect-ratio:1;margin-left:calc(min(62%,250px)/-2);background:radial-gradient(circle,#fff 0 22%,#ffd23f 23% 48%,var(--tc) 49%);clip-path:polygon(50% 0,57% 30%,80% 8%,70% 36%,100% 30%,76% 50%,100% 70%,70% 64%,80% 92%,57% 70%,50% 100%,43% 70%,20% 92%,30% 64%,0 70%,24% 50%,0 30%,30% 36%,20% 8%,43% 30%);transform:translateY(-50%);animation:jgS .6s .1s cubic-bezier(.2,1.6,.4,1) both,jgR 5s .7s linear}' +
    '@keyframes jgS{from{transform:translateY(-50%) scale(0) rotate(-90deg)}}@keyframes jgR{to{transform:translateY(-50%) rotate(60deg)}}' +
    '.jg-i{left:50%;top:50%;font-size:clamp(40px,11vw,70px);animation:jgI .5s .35s cubic-bezier(.2,1.6,.4,1) both}@keyframes jgI{from{transform:translate(-50%,-50%) scale(0)}to{transform:translate(-50%,-50%)}}' +
    '.jg-k{font-size:clamp(16px,4.6vw,28px);animation:jgK .9s var(--d) both}@keyframes jgK{0%{opacity:0;transform:scale(0) rotate(-60deg)}40%{opacity:1;transform:scale(1.25)}100%{opacity:0;transform:scale(.6) rotate(40deg) translateY(-20px)}}' +
    // contraataque: líneas de velocidad, rayo, título que entra rápido
    '.ca-l{left:0;height:3px;border-radius:3px;background:linear-gradient(90deg,transparent,#fff);animation:caL var(--du) var(--d) cubic-bezier(.5,0,.5,1) both}@keyframes caL{from{transform:translateX(110vw)}to{transform:translateX(-110%)}}' +
    '.ca-z{left:50%;top:50%;font-size:clamp(60px,16vw,110px);animation:caZ .5s .3s steps(1) both,jgI .35s .3s cubic-bezier(.2,1.6,.4,1) both}@keyframes caZ{0%,40%,80%{opacity:1}20%,60%{opacity:.2}}' +
    '.ca-ar{right:6%;top:50%;font:900 clamp(30px,9vw,60px) Archivo,sans-serif;color:var(--tc);letter-spacing:-.1em;animation:caA .6s .2s ease-in-out 3 both}@keyframes caA{0%{opacity:0;transform:translate(-30px,-50%)}50%{opacity:1}100%{opacity:0;transform:translate(20px,-50%)}}' +
    '.bfx.bf-ca .bfx-t b{animation:caT .5s .35s cubic-bezier(.2,1.3,.4,1) both}@keyframes caT{from{opacity:0;transform:translateX(-120%) skewX(-30deg)}70%{transform:translateX(4%) skewX(8deg)}to{transform:none}}' +
    // polémica: monitor de revisión con barrido, REC y texto con glitch
    '.vr-m{left:12%;right:12%;top:12%;bottom:6%;border:3px solid rgba(255,255,255,.85);border-radius:10px;background:repeating-linear-gradient(0deg,rgba(255,255,255,.07) 0 2px,transparent 2px 5px),#05060c;animation:nfIn .35s .05s both}' +
    '.vr-m:after{content:"";position:absolute;left:0;right:0;top:0;height:30%;background:linear-gradient(transparent,rgba(120,255,255,.22),transparent);animation:vrS 1.1s .3s linear 2 both}@keyframes vrS{from{transform:translateY(-100%)}to{transform:translateY(340%)}}' +
    '.vr-r{position:absolute;left:10px;top:8px;font:700 11px "JetBrains Mono",monospace;letter-spacing:.14em;color:#fff}.vr-r i{display:inline-block;width:9px;height:9px;margin-right:6px;border-radius:50%;background:#ff3b47;animation:vrB .6s steps(1) infinite}@keyframes vrB{50%{opacity:0}}' +
    '.vr-e{left:50%;top:54%;font-size:clamp(40px,11vw,70px);animation:jgI .4s .35s cubic-bezier(.2,1.6,.4,1) both,vrG .3s .9s steps(2) 3}@keyframes vrG{50%{transform:translate(calc(-50% + 4px),calc(-50% - 2px))}}' +
    '.bfx.bf-vr .bfx-t b{animation:bfxSlam .62s .25s cubic-bezier(.2,1.5,.4,1) both,vrT .24s .95s steps(2) 4}@keyframes vrT{50%{text-shadow:-4px 0 0 #22e0ff,4px 0 0 #ff2f8e;transform:translateX(3px)}}' +
    // muro: ladrillos que caen y el balón rebota
    '.mu-w{left:50%;top:14%;width:min(70%,300px);display:grid;grid-template-columns:repeat(6,1fr);gap:4px;transform:translateX(-50%)}' +
    '.mu-w i{height:clamp(16px,4.5vw,26px);border-radius:3px;background:linear-gradient(#ffb17a,#d4622f);box-shadow:inset 0 -3px 0 rgba(0,0,0,.25),0 2px 0 rgba(0,0,0,.3);animation:muD .45s var(--d) cubic-bezier(.3,1.4,.5,1) both}.mu-w i:nth-child(n+7):nth-child(-n+12){transform:translateX(50%)}' +
    '@keyframes muD{from{opacity:0;translate:0 -160px}}' +
    '.mu-b{right:4%;top:28%;font-size:clamp(26px,7vw,42px);animation:muB 1.2s .75s cubic-bezier(.4,.1,.5,1) both}@keyframes muB{0%{opacity:0;transform:translateX(60px)}10%{opacity:1}45%{transform:translateX(calc(var(--wx) * -1)) rotate(-300deg)}100%{opacity:0;transform:translate(40px,-60px) rotate(-500deg)}}' +
    '.mu-s{left:50%;top:22%;font-size:clamp(46px,13vw,80px);animation:jgI .45s 1.1s cubic-bezier(.2,1.6,.4,1) both}' +
    // afición: ola de público, megáfono y gritos
    '.af-c{left:0;right:0;bottom:-6%;display:flex;justify-content:center;gap:clamp(2px,1vw,8px)}' +
    '.af-c i{flex:none;width:clamp(16px,4.6vw,30px);height:clamp(34px,10vw,62px);border-radius:999px 999px 6px 6px;background:var(--c);position:relative;animation:afW .55s var(--d) ease-in-out 4 both}.af-c i:before{content:"";position:absolute;left:50%;top:-38%;width:80%;aspect-ratio:1;margin-left:-40%;border-radius:50%;background:var(--c)}' +
    '@keyframes afW{0%,100%{transform:translateY(30%)}45%{transform:translateY(-22%)}}' +
    '.af-m{left:8%;top:14%;font-size:clamp(40px,11vw,70px);animation:afM .3s .2s ease-in-out 7 alternate both}@keyframes afM{from{transform:rotate(-18deg) scale(.95)}to{transform:rotate(-4deg) scale(1.08)}}' +
    '.af-y{font:italic 900 clamp(14px,4vw,22px) Archivo,sans-serif;color:#fff;-webkit-text-stroke:1.5px #0d0d10;paint-order:stroke fill;animation:afY 1.3s var(--d) both}@keyframes afY{0%{opacity:0;transform:translateY(20px) scale(.5) rotate(var(--r))}25%{opacity:1;transform:translateY(0) scale(1.1) rotate(var(--r))}100%{opacity:0;transform:translateY(-36px) rotate(var(--r))}}' +
    // último minuto: reloj con aguja rápida y pulso rojo
    '.um-v{inset:0;background:radial-gradient(circle,transparent 35%,rgba(255,40,60,.55));animation:umP .5s .1s ease-in-out 5 alternate both}@keyframes umP{from{opacity:.15}to{opacity:1}}' +
    '.um-c{left:50%;top:50%;width:clamp(84px,24vw,140px);aspect-ratio:1;border-radius:50%;border:6px solid #fff;background:#0d0d10;box-shadow:0 0 0 4px #ff3b47,0 0 30px rgba(255,59,71,.7);transform:translate(-50%,-50%);animation:jgS .55s .05s cubic-bezier(.2,1.6,.4,1) both}' +
    '.um-c:before{content:"";position:absolute;left:50%;bottom:50%;width:4px;height:42%;margin-left:-2px;border-radius:4px;background:#ff3b47;transform-origin:50% 100%;animation:umH 1.6s .3s cubic-bezier(.3,0,.2,1) both}@keyframes umH{from{transform:rotate(0)}to{transform:rotate(1050deg)}}' +
    '.um-c b{position:absolute;inset:0;display:grid;place-items:center;padding-top:44%;font:900 clamp(14px,4vw,22px) Archivo,sans-serif;color:#fff}' +
    // narración libre: micrófono y globo con texto que se escribe
    '.bfx.bf-say{background:radial-gradient(120% 90% at 50% 40%,color-mix(in srgb,var(--tc) 40%,#0a0d18) 0,rgba(8,10,22,.92) 80%)}' +
    '.sy-w{position:absolute;left:5%;right:5%;top:50%;transform:translateY(-50%);display:flex;align-items:center;gap:12px;z-index:5}' +
    '.sy-i{flex:none;width:clamp(52px,14vw,78px);aspect-ratio:1;border-radius:50%;display:grid;place-items:center;background:var(--tc);font-size:clamp(26px,7vw,40px);box-shadow:0 0 0 4px #0d0d10,0 0 0 7px #fff;animation:jgS .5s .1s cubic-bezier(.2,1.6,.4,1) both}' +
    '.sy-b{position:relative;flex:1;min-width:0;padding:14px 16px;border-radius:18px;background:#fff;color:#0d0d10;font:900 clamp(16px,4.6vw,26px)/1.15 Archivo,sans-serif;box-shadow:5px 5px 0 var(--tc);animation:syB .45s .3s cubic-bezier(.2,1.4,.4,1) both;overflow-wrap:anywhere}' +
    '.sy-b:before{content:"";position:absolute;left:-12px;top:50%;margin-top:-10px;border:10px solid transparent;border-right:14px solid #fff;border-left:0}.sy-b small{display:block;margin-bottom:4px;font:700 11px "JetBrains Mono",monospace;letter-spacing:.12em;text-transform:uppercase;color:#5b6079}' +
    '.sy-b em{font-style:normal;display:inline-block;width:3px;height:1em;margin-left:2px;vertical-align:-2px;background:#0d0d10;animation:vrB .5s steps(1) infinite}@keyframes syB{from{opacity:0;transform:scale(.5) translateX(-40px)}}' +
    // cambio: tablero del cuarto árbitro
    '.bfx.bf-sb{display:grid;place-items:center}.sb-b{position:relative;z-index:5;width:min(340px,88%);border-radius:16px;overflow:hidden;background:#05060c;border:3px solid #fff;box-shadow:0 0 0 3px #0d0d10,0 18px 40px rgba(0,0,0,.6);animation:sbIn .6s .1s cubic-bezier(.2,1.4,.4,1) both}' +
    '@keyframes sbIn{from{opacity:0;transform:perspective(600px) rotateX(85deg) scale(.6)}}' +
    '.sb-h{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 14px;background:var(--tc);color:#fff;font:900 13px Archivo,sans-serif;letter-spacing:.12em;text-transform:uppercase;text-shadow:0 1px 0 rgba(0,0,0,.4)}.sb-h i{font-style:normal;font-size:20px;display:inline-block;animation:bfxRot 1s linear 3}' +
    '.sb-r{display:flex;align-items:center;gap:12px;padding:11px 14px;font:900 clamp(17px,5vw,24px)/1.1 "JetBrains Mono",Archivo,monospace;text-transform:uppercase;letter-spacing:.02em;min-width:0}.sb-r span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.sb-r em{flex:none;width:30px;height:30px;display:grid;place-items:center;border-radius:8px;font:900 15px Archivo,sans-serif;font-style:normal}' +
    '.sb-r.in{color:#2ee59d;text-shadow:0 0 10px rgba(46,229,157,.7);animation:sbR .45s .55s both,sbG .5s 1.4s steps(2) 3}.sb-r.in em{background:#2ee59d;color:#062417}' +
    '.sb-r.out{color:#ff5a6a;text-shadow:0 0 10px rgba(255,90,106,.6);border-top:1px dashed rgba(255,255,255,.18);animation:sbR .45s .75s both,sbO .5s 1.9s ease-in forwards}.sb-r.out em{background:#ff3b47;color:#fff}' +
    '@keyframes sbR{from{opacity:0;transform:translateX(-40px)}}@keyframes sbG{50%{opacity:.35}}@keyframes sbO{to{opacity:.35;transform:translateX(24px)}}' +
    '.sb-a{left:50%;top:7%;font:900 clamp(22px,6vw,34px) Archivo,sans-serif;color:#2ee59d;text-shadow:0 2px 0 #0d0d10;animation:sbA 1.1s 1.2s ease-out 2 both}@keyframes sbA{0%{opacity:0;transform:translate(-50%,24px)}30%{opacity:1}100%{opacity:0;transform:translate(-50%,-14px)}}' +
    // inicio: ondas desde el silbato
    '.in-r{left:50%;top:50%;width:90px;height:90px;margin:-45px 0 0 -45px;border-radius:50%;border:5px solid #fff;animation:svR 1.2s var(--d) ease-out both}' +
    '.in-w{left:50%;top:50%;font-size:clamp(50px,13vw,84px);animation:jgI .5s .1s cubic-bezier(.2,1.6,.4,1) both,inW .12s .6s linear 8}@keyframes inW{50%{transform:translate(calc(-50% + 3px),-50%) rotate(4deg)}}' +
    // medio tiempo / 2.º tiempo: persianas
    '.sh{left:0;right:0;height:50%;background:repeating-linear-gradient(90deg,#11142a 0 22px,#181c38 22px 44px);z-index:1}.sh.t{top:0;border-bottom:4px solid var(--tc)}.sh.b{bottom:0;border-top:4px solid var(--tc)}' +
    '.bfx.bf-ht .sh.t{animation:shT .5s .05s cubic-bezier(.6,0,.3,1.3) both}.bfx.bf-ht .sh.b{animation:shB .5s .05s cubic-bezier(.6,0,.3,1.3) both}@keyframes shT{from{transform:translateY(-100%)}}@keyframes shB{from{transform:translateY(100%)}}' +
    '.bfx.bf-t2 .bfx-t{animation:t2O .35s 1.1s ease-in forwards}@keyframes t2O{to{opacity:0;translate:0 -30px}}' +
    '.bfx.bf-t2 .sh.t{animation:shT .6s 1.3s cubic-bezier(.6,0,.3,1) reverse both}.bfx.bf-t2 .sh.b{animation:shB .6s 1.3s cubic-bezier(.6,0,.3,1) reverse both}' +
    '.bfx.bf-ht .bfx-t,.bfx.bf-t2 .bfx-t{top:50%;bottom:auto;transform:translateY(-50%) rotate(-3deg)}' +
    '.sh-s{display:block;font:900 clamp(26px,8vw,52px)/1 Archivo,sans-serif;color:#fff;letter-spacing:.04em;animation:bfxUp .4s .6s both}' +
    // final: bandera a cuadros, confeti y ganador
    '.fn-f{left:-10%;right:-10%;top:30%;height:clamp(40px,11vw,70px);background:repeating-conic-gradient(#fff 0 25%,#0d0d10 0 50%) 0 0/clamp(20px,5.5vw,35px) clamp(20px,5.5vw,35px);transform:rotate(-8deg);box-shadow:0 6px 0 rgba(0,0,0,.3);animation:fnF 1.2s .05s cubic-bezier(.3,.7,.3,1) both,fnW 1.4s 1.25s ease-in-out infinite alternate}' +
    '@keyframes fnF{from{transform:translateX(-110%) rotate(-8deg)}}@keyframes fnW{to{transform:rotate(-5deg) translateY(6px)}}' +
    '.cf{left:50%;top:40%;width:8px;height:13px;border-radius:2px;animation:cfF var(--du) var(--d) cubic-bezier(.2,.7,.3,1) both}@keyframes cfF{0%{opacity:1;transform:translate(0,0) rotate(0)}70%{opacity:1}100%{opacity:0;transform:translate(var(--dx),var(--dy)) rotate(var(--r))}}' +
    // modo: franjas del color del modo
    '.md-s{top:-20%;bottom:-20%;width:16%;background:var(--mc);transform:skewX(-18deg);animation:mdS .55s var(--d) cubic-bezier(.6,0,.3,1) both;opacity:.85}@keyframes mdS{from{transform:skewX(-18deg) translateY(-120%)}}' +
    '.md-i{left:50%;top:48%;font-size:clamp(46px,12vw,76px);animation:jgI .5s .55s cubic-bezier(.2,1.6,.4,1) both}' +
    // MVP: estrella que gira y rayos dorados
    '.mv-s{left:50%;top:50%;font-size:clamp(64px,17vw,110px);filter:drop-shadow(0 0 18px #ffd23f);animation:mvS .9s .1s cubic-bezier(.2,1.4,.4,1) both}@keyframes mvS{from{opacity:0;transform:translate(-50%,-50%) scale(0) rotate(-200deg)}to{transform:translate(-50%,-50%)}}' +
    '.mv-r{left:50%;top:50%;width:min(80%,320px);aspect-ratio:1;margin-left:calc(min(80%,320px)/-2);transform:translateY(-50%);border-radius:50%;background:repeating-conic-gradient(rgba(255,210,63,.55) 0 6deg,transparent 6deg 18deg);-webkit-mask:radial-gradient(circle,transparent 18%,#000 20%,transparent 70%);mask:radial-gradient(circle,transparent 18%,#000 20%,transparent 70%);animation:jgS .6s .2s cubic-bezier(.2,1.6,.4,1) both,jgR 6s .8s linear}' +
    // gol: marcador que salta al final
    '.gl-n{display:grid;gap:2px;line-height:1.05}.gl-s{font:700 clamp(10px,3vw,13px)/1.2 "JetBrains Mono",ui-monospace,monospace;font-style:normal;color:#c6ff1a;letter-spacing:.04em;text-transform:uppercase}.gl-s:empty{display:none}' +
    '.bn-demo{flex-wrap:wrap}.bn-demo [data-fx]{font-size:11px;padding:6px 10px}' +
    '@media(prefers-reduced-motion:reduce){.bfx *,.bfx:before{animation:none!important}.bfx{animation:none!important}.nf-b,.sv-b,.ca-l,.mu-b,.cf,.af-y,.nf-u,.nf-x,.sv-r,.in-r{display:none}}';
  var st = h('style'); st.textContent = CSS; document.head.appendChild(st);

  // ---------- cola: un evento a la vez ----------
  var Q = [], busy = false;
  function push(fn) { if (Q.length > 3) Q.splice(0, Q.length - 3); Q.push(fn); if (!busy) next(); }
  function next() { var f = Q.shift(); if (!f) { busy = false; return; } busy = true; var d = 0; try { d = f() || 0; } catch (e) { d = 0; } setTimeout(next, d + 300); }
  function layer(cls, tc, dur) { var b = host(); if (!b) return null; var o = h('div', 'bfx ' + cls.split(' ').map(function (c) { return 'bf-' + c; }).join(' ')); o.style.setProperty('--tc', tc || '#c6ff1a');
    // cubre solo el marcador (hasta el reloj), no el panel del modo de juego
    var tm = b.querySelector('.bn-time'); if (tm && tm.offsetParent) { var bt = b.offsetHeight - (tm.offsetTop + tm.offsetHeight + 18); if (bt > 0) { o.style.bottom = bt + 'px'; o.style.borderRadius = '32px 32px 18px 18px'; } } b.appendChild(o);
    setTimeout(function () { o.classList.add('out'); setTimeout(function () { o.remove(); }, 420); }, RM ? Math.min(dur, 2200) : dur); return o; }
  function stage(o) { var s = h('div', 'bfx-st'); o.appendChild(s); return s; }
  function title(o, big, small, td) { var t = h('div', 'bfx-t'); if (td != null) t.style.setProperty('--td', td + 's'); t.appendChild(h('b', null, big)); if (small) t.appendChild(h('span', null, small)); o.appendChild(t); return t; }
  function e(par, cls, txt) { var x = h('span', 'bfx-e ' + cls, txt); par.appendChild(x); return x; }
  function buzz(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (er) {} }
  function sub(m, sd, extra) { var n = tnm(m, sd); return [extra, n].filter(Boolean).join(' · '); }

  // ---------- animaciones ----------
  var FX = {
    near: function (m, sd) { var o = layer('nf shk', tcol(m, sd), 2900); if (!o) return 0; o.style.setProperty('--sd', '.78s'); var s = stage(o), W = o.clientWidth, H = s.clientHeight;
      var g = h('div', 'nf-g'); s.appendChild(g); var b = e(s, 'nf-b', '⚽'), bx = W * .06, by = H * .7, px = W * (1 - .08 - .30) + 4, py = H * .16 + H * .62 * .35;
      b.style.setProperty('--hx', (px - bx - 20) + 'px'); b.style.setProperty('--hy', (py - by) + 'px'); b.style.setProperty('--ox', (px - bx - W * .32) + 'px'); b.style.setProperty('--oy', (-by - 30) + 'px');
      var x = e(s, 'nf-x'); x.style.left = px + 'px'; x.style.top = py + 'px'; var u = e(s, 'nf-u', '¡UYYY!'); u.style.left = (px - 10) + 'px'; u.style.top = (py - 40) + 'px';
      title(o, '¡Casi gol!', sub(m, sd, '¡Al palo!'), .9); setTimeout(function () { buzz([20, 30, 60]); }, 780); return 2900; },
    save: function (m, sd) { var o = layer('sv', tcol(m, sd), 2800); if (!o) return 0; var s = stage(o); var b = e(s, 'sv-b', '⚽'); b.style.setProperty('--sx', (Math.random() > .5 ? 1 : -1) * 120 + 'px');
      e(s, 'sv-g', '🧤'); var r1 = e(s, 'sv-r'), r2 = e(s, 'sv-r'); r2.style.animationDelay = '1.15s'; title(o, '¡Atajadón!', sub(m, sd, 'Paradón'), .95); setTimeout(function () { buzz(30); }, 1000); return 2800; },
    play: function (m, sd) { var o = layer('jg', tcol(m, sd), 2700); if (!o) return 0; var s = stage(o); e(s, 'jg-s'); e(s, 'jg-i', '💥');
      for (var i = 0; i < 6; i++) { var k = e(s, 'jg-k', ['✨', '⭐', '💫'][i % 3]); k.style.left = rnd(8, 86) + '%'; k.style.top = rnd(8, 80) + '%'; k.style.setProperty('--d', (.35 + i * .12) + 's'); }
      title(o, '¡Qué jugada!', sub(m, sd), .55); return 2700; },
    counter: function (m, sd) { var o = layer('ca', tcol(m, sd), 2600); if (!o) return 0; var s = stage(o);
      for (var i = 0; i < 12; i++) { var l = e(o, 'ca-l'); l.style.top = rnd(4, 94) + '%'; l.style.width = rnd(25, 60) + '%'; l.style.opacity = rnd(.35, .9); l.style.setProperty('--du', rnd(.35, .6) + 's'); l.style.setProperty('--d', rnd(0, 1.4) + 's'); }
      e(s, 'ca-z', '⚡'); e(s, 'ca-ar', '›››'); title(o, '¡Contraataque!', sub(m, sd), .35); return 2600; },
    contro: function (m, sd) { var o = layer('vr', '#ff2f8e', 2900); if (!o) return 0; var s = stage(o), mo = e(s, 'vr-m'); var r = h('span', 'vr-r'); r.appendChild(h('i')); r.appendChild(document.createTextNode('Revisión')); mo.appendChild(r);
      e(s, 'vr-e', '😱'); title(o, '¡Polémica!', sub(m, sd, 'Se revisa la jugada'), .5); return 2900; },
    wall: function (m, sd) { var o = layer('mu shk', tcol(m, sd), 2900); if (!o) return 0; o.style.setProperty('--sd', '1.25s'); var s = stage(o), w = e(s, 'mu-w');
      for (var i = 0; i < 18; i++) { var k = h('i'); k.style.setProperty('--d', (.05 + (2 - Math.floor(i / 6)) * .16 + (i % 6) * .03) + 's'); w.appendChild(k); }
      var b = e(s, 'mu-b', '⚽'); b.style.setProperty('--wx', (o.clientWidth * .2) + 'px'); e(s, 'mu-s', '🛡️'); title(o, '¡Defensa de muro!', sub(m, sd, 'No pasa nadie'), 1.15); return 2900; },
    crowd: function (m, sd) { var c = tcol(m, sd), o = layer('af', c, 3000); if (!o) return 0; var s = stage(o), row = e(o, 'af-c'), n = Math.max(10, Math.min(22, Math.round(o.clientWidth / 30)));
      for (var i = 0; i < n; i++) { var p = h('i'); p.style.setProperty('--c', i % 3 === 1 ? '#fff' : i % 3 === 2 ? '#ffd23f' : c); p.style.setProperty('--d', (i * .05) + 's'); row.appendChild(p); }
      e(s, 'af-m', '📣'); ['¡OLÉ!', '¡VAMOS!', '¡DALE!', '¡OLÉ!'].forEach(function (t, i) { var y = e(s, 'af-y', t); y.style.left = (30 + i * 16) + '%'; y.style.top = (18 + (i % 2) * 26) + '%'; y.style.setProperty('--d', (.3 + i * .35) + 's'); y.style.setProperty('--r', (i % 2 ? 8 : -8) + 'deg'); });
      var t = title(o, '¡La afición enloquece!', sub(m, sd), .3); t.style.bottom = '30%'; return 3000; },
    clock: function (m, sd) { var o = layer('um', '#ff3b47', 2800); if (!o) return 0; var s = stage(o); e(o, 'um-v'); var c = e(s, 'um-c'); c.appendChild(h('b', null, "90'"));
      title(o, '¡Último minuto!', sub(m, sd, 'Todo o nada'), .45); setTimeout(function () { buzz([15, 60, 15, 60, 15]); }, 400); return 2800; },
    say: function (m, sd, txt) { txt = String(txt || '').trim(); if (!txt) return 0; var dur = Math.min(5200, 2200 + txt.length * 40), o = layer('say', tcol(m, sd), dur); if (!o) return 0;
      var w = h('div', 'sy-w'); w.appendChild(h('span', 'sy-i', '🎙️')); var bb = h('div', 'sy-b'); bb.appendChild(h('small', null, 'Narración' + (sd ? ' · ' + tnm(m, sd) : ''))); var tx = h('span'); bb.appendChild(tx); bb.appendChild(h('em')); w.appendChild(bb); o.appendChild(w);
      if (RM) tx.textContent = txt; else { var i = 0, step = Math.max(18, Math.min(45, 1300 / txt.length)); setTimeout(function tp() { i++; tx.textContent = txt.slice(0, i); if (i < txt.length) setTimeout(tp, step); }, 650); }
      return dur; },
    sub: function (m, sd, ev) { var o = layer('sb', tcol(m, sd), 3300); if (!o) return 0; var b = h('div', 'sb-b'), hd = h('div', 'sb-h'); hd.appendChild(h('span', null, 'Cambio · ' + (tnm(m, sd) || ''))); hd.appendChild(h('i', null, '⇄')); b.appendChild(hd);
      var r1 = h('div', 'sb-r in'); r1.appendChild(h('em', null, '▲')); r1.appendChild(h('span', null, pn(ev.in) || 'Entra')); b.appendChild(r1);
      var r2 = h('div', 'sb-r out'); r2.appendChild(h('em', null, '▼')); r2.appendChild(h('span', null, pn(ev.out) || 'Sale')); b.appendChild(r2); o.appendChild(b); e(o, 'sb-a', '▲'); return 3300; },
    start: function (m) { var o = layer('in', '#2ee59d', 2700); if (!o) return 0; var s = stage(o); [0, .3, .6].forEach(function (d) { var r = e(s, 'in-r'); r.style.setProperty('--d', (.5 + d) + 's'); }); e(s, 'in-w', '📯');
      title(o, '¡Arranca el partido!', tnm(m, 'h') + ' vs ' + tnm(m, 'a'), .55); setTimeout(function () { buzz([40, 40, 40]); }, 600); return 2700; },
    ht: function (m) { var o = layer('ht', '#ffd23f', 3000); if (!o) return 0; o.style.background = 'transparent'; e(o, 'sh t'); e(o, 'sh b'); var t = title(o, '¡Medio tiempo!', tnm(m, 'h') + ' · ' + tnm(m, 'a'), .4); t.insertBefore(h('em', 'sh-s', score(m)), t.lastChild); return 3000; },
    resume: function (m) { var o = layer('t2', '#2ee59d', 2800); if (!o) return 0; o.style.background = 'transparent'; e(o, 'sh t'); e(o, 'sh b'); var t = title(o, '¡2.º tiempo!', '¡Sigue el partido!', .1); t.style.zIndex = 2; return 2800; },
    end: function (m) { var hs = m ? m.hs || 0 : 0, as = m ? m.as || 0 : 0, w = hs > as ? 'h' : as > hs ? 'a' : null, o = layer('fn', w ? tcol(m, w) : '#ffd23f', 4200); if (!o) return 0; var s = stage(o); e(s, 'fn-f');
      var cs = [o.style.getPropertyValue('--tc'), '#fff', '#ffd23f', '#c6ff1a', '#ff4fa3'];
      if (!RM) for (var i = 0; i < 36; i++) { var c = e(o, 'cf'); c.style.background = cs[i % cs.length]; var a = rnd(0, 6.283), d = rnd(80, Math.max(200, o.clientWidth * .5)); c.style.setProperty('--dx', Math.cos(a) * d + 'px'); c.style.setProperty('--dy', (Math.sin(a) * d * .7 + 120) + 'px'); c.style.setProperty('--r', rnd(-720, 720) + 'deg'); c.style.setProperty('--du', rnd(1.3, 2) + 's'); c.style.setProperty('--d', rnd(.5, .9) + 's'); }
      var t = title(o, '¡Final!', w ? '🏆 Gana ' + tnm(m, w) : '🤝 ¡Empate!', .5); t.insertBefore(h('em', 'sh-s', tnm(m, 'h') + '  ' + score(m) + '  ' + tnm(m, 'a')), t.lastChild); setTimeout(function () { buzz([60, 40, 60, 40, 200]); }, 500); return 4200; },
    mode: function (m, sd, ev) { var mc = (MAGNA.MODE_COLOR || {})[ev.mode] || '#8b5cf6', o = layer('md', mc, 2700); if (!o) return 0; o.style.setProperty('--mc', mc); var s = stage(o);
      for (var i = 0; i < 7; i++) { var x = e(o, 'md-s'); x.style.left = (i * 16 - 6) + '%'; x.style.setProperty('--d', (i * .05) + 's'); x.style.opacity = i % 2 ? .55 : .85; }
      e(s, 'md-i', '🎮'); title(o, ev.mode || 'Nuevo modo', 'Nuevo modo de juego' + (ev.map ? ' · ' + ev.map : ''), .6); return 2700; },
    mvp: function (m, sd, ev) { var p = ev.pid ? MAGNA.by(MAGNA.S.players, ev.pid) : null, o = layer('mv', p ? MAGNA.teamColor(p.teamId) : '#ffd23f', 3600); if (!o) return 0; var s = stage(o); e(s, 'mv-r'); e(s, 'mv-s', '⭐');
      title(o, p ? p.name : 'MVP', '⭐ MVP del partido' + (p ? ' · ' + MAGNA.teamName(p.teamId) : ''), .6); return 3600; },
    goal: function (m, sd, ev) { var x = BN.M[BN.cur()]; if (m && x) { x.s = [m.hs || 0, m.as || 0]; x.live = 1; } BN.render();
      BN.goalFx(sd === 'a' ? 'a' : 'h', { who: pn(ev.player), min: ev.min, score: ev.score || (m ? score(m) : '') }); buzz([30, 40, 30]); return 3200; }
  };
  var NOTE = [['🔥', 'near'], ['🧤', 'save'], ['💥', 'play'], ['⚡', 'counter'], ['😱', 'contro'], ['🛡', 'wall'], ['📣', 'crowd'], ['⏱', 'clock']];
  function play(m, ev) { var k = ev.k, sd = ev.side;
    if (k === 'note') { var t = String(ev.text || ''), f = NOTE.filter(function (x) { return t.indexOf(x[0]) === 0; })[0]; if (f) return push(function () { return FX[f[1]](m, sd, ev); });
      var clean = sd ? t.replace(new RegExp(' · ' + tnm(m, sd).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'), '') : t; return push(function () { return FX.say(m, sd, clean); }); }
    if (k === 'resume') k = 'resume'; if (FX[k]) return push(function () { return FX[k](m, sd, ev); });
    var tx = MAGNA.eventText(m, ev); if (tx) push(function () { return FX.say(m, sd, tx); });
  }

  // ---------- detectar eventos nuevos ----------
  var SEEN = {};
  function mark(m) { if (!m) return; var L = m.live || {}; SEEN[m.id] = { n: (L.ev || []).length, mvp: L.mvp || null, st: m.status, hs: m.hs || 0, as: m.as || 0 }; }
  function syncBanner(m) { var x = BN.M[BN.cur()]; if (!m || !x || x.mid !== m.id) return; var on = m.status === 'live' || m.status === 'finished';
    if (x.s[0] !== (m.hs || 0) || x.s[1] !== (m.as || 0) || !!x.live !== on) { x.s = [m.hs || 0, m.as || 0]; x.live = on ? 1 : 0; x.fin = m.status === 'finished' ? 1 : 0; BN.render(); }
    var lt = document.getElementById('bLiveT'); if (lt) lt.textContent = m.status === 'finished' ? 'Finalizado' : m.status === 'live' ? 'En vivo' : 'Próximo'; var bl = document.getElementById('bLive'); if (bl) bl.classList.toggle('up', m.status !== 'live'); }
  function check() { var m = mt(); if (!m) return; var p = SEEN[m.id]; if (!p) return mark(m); var L = m.live || {}, ev = L.ev || [];
    if (ev.length > p.n) { var goalSeen = false; ev.slice(p.n).forEach(function (x) { if (x.k === 'goal') goalSeen = true; play(m, x); });
      // un gol sin evento (marcador cambiado a mano) también se celebra
      if (!goalSeen && ((m.hs || 0) + (m.as || 0)) > p.hs + p.as) play(m, { k: 'goal', side: (m.hs || 0) > p.hs ? 'h' : 'a' }); }
    else if (((m.hs || 0) + (m.as || 0)) > p.hs + p.as) play(m, { k: 'goal', side: (m.hs || 0) > p.hs ? 'h' : 'a' });
    if (L.mvp && L.mvp !== p.mvp) play(m, { k: 'mvp', pid: L.mvp });
    if (m.status === 'finished' && p.st === 'live' && !ev.slice(p.n).some(function (x) { return x.k === 'end'; })) play(m, { k: 'end' });
    mark(m); syncBanner(m); }
  window.addEventListener('magna:update', function () { setTimeout(check, 30); });
  window.addEventListener('magna:homesel', function () { Q.length = 0; var m = mt(); mark(m); syncBanner(m); });
  var m0 = mt(); mark(m0); syncBanner(m0);

  // ---------- botones de prueba (solo administración) ----------
  var DEMO = [['near', '🔥 Casi gol'], ['save', '🧤 Atajada'], ['play', '💥 Jugada'], ['counter', '⚡ Contra'], ['contro', '😱 Polémica'], ['wall', '🛡️ Muro'], ['crowd', '📣 Afición'], ['clock', '⏱️ Últ. minuto'], ['say', '🎙️ Narración'], ['sub', '⇄ Cambio'], ['start', '▶ Inicio'], ['ht', '⏸ Medio t.'], ['resume', '▶ 2.º t.'], ['end', '🏁 Final'], ['mode', '🎮 Modo'], ['mvp', '⭐ MVP']];
  function demoEv(k) { var m = mt(), L = (m && m.live) || {}, ids = ((L.lineup && L.lineup.h) || []), sd = Math.random() > .5 ? 'a' : 'h';
    if (k === 'sub') { var lh = (L.lineup && L.lineup[sd]) || []; return { k: 'sub', side: sd, in: lh[1] || lh[0], out: lh[0] }; }
    if (k === 'say') return { k: 'say', side: sd, text: '¡Qué partidazo se está jugando en Magna Arena!' };
    if (k === 'mode') { var ms = Object.keys(MAGNA.MODE_COLOR || {}); return { k: 'mode', mode: ms[Math.floor(Math.random() * ms.length)] || 'Balón Brawl' }; }
    if (k === 'mvp') return { k: 'mvp', pid: L.mvp || ids[0] };
    return { k: k, side: sd }; }
  function demo() { var row = document.querySelector('#marcador .bn-demo'); if (!row || row.querySelector('[data-fx]')) return;
    DEMO.forEach(function (d) { var b = h('button', 'pill mono', d[1]); b.type = 'button'; b.dataset.fx = d[0]; b.onclick = function () { var m = mt(), ev = demoEv(d[0]); if (d[0] === 'say') push(function () { return FX.say(m, ev.side, ev.text); }); else push(function () { return FX[d[0]](m, ev.side, ev); }); }; row.appendChild(b); }); }
  demo();
  window.MAGNA_BNFX = { play: function (ev) { play(mt(), ev); }, fx: FX };
})();
