(function () {
  "use strict";

  var canvas = document.getElementById("game");
  var ctx = canvas.getContext("2d");
  var screen = document.getElementById("screen");
  var screenKicker = document.getElementById("screenKicker");
  var screenTitle = document.getElementById("screenTitle");
  var screenCopy = document.getElementById("screenCopy");
  var primaryAction = document.getElementById("primaryAction");
  var secondaryAction = document.getElementById("secondaryAction");
  var levelName = document.getElementById("levelName");
  var cellCount = document.getElementById("cellCount");
  var heartsEl = document.getElementById("hearts");
  var timer = document.getElementById("timer");
  var pauseBtn = document.getElementById("pauseBtn");
  var restartBtn = document.getElementById("restartBtn");

  var W = 960;
  var H = 540;
  var dpr = 1;
  var keys = {};
  var taps = {};
  var touch = {};
  var mode = "menu";
  var runTime = 0;
  var levelTime = 0;
  var levelNo = 0;
  var camera = { x: 0, y: 0 };
  var player;
  var level;

  var maps = [
    {
      name: "Dockline",
      w: 2700,
      h: 680,
      spawn: [110, 500],
      need: 8,
      p: [[0, 560, 540, 120], [640, 560, 410, 120], [1160, 560, 460, 120], [1760, 560, 940, 120], [315, 460, 190, 22], [590, 400, 160, 22], [870, 345, 190, 22], [1180, 440, 170, 22], [1450, 380, 220, 22], [1775, 460, 175, 22], [2050, 410, 230, 22], [2370, 350, 180, 22]],
      c: [[350, 420], [635, 360], [925, 305], [1235, 398], [1518, 336], [1830, 420], [2115, 370], [2428, 310], [2520, 510], [1410, 510]],
      hzd: [[550, 590, 72, 36], [1070, 590, 72, 36], [1665, 590, 86, 36]],
      e: [[720, 520, 660, 990, 72], [2005, 520, 1810, 2240, 96]],
      gate: [2590, 466, 52, 94],
      cp: [[1395, 560]]
    },
    {
      name: "Glassworks",
      w: 3180,
      h: 760,
      spawn: [95, 548],
      need: 9,
      p: [[0, 622, 460, 138], [620, 622, 390, 138], [1120, 622, 360, 138], [1590, 622, 420, 138], [2190, 622, 990, 138], [285, 510, 140, 22], [520, 445, 150, 22], [800, 390, 170, 22], [1125, 505, 160, 22], [1375, 455, 160, 22], [1685, 397, 175, 22], [2005, 470, 155, 22], [2350, 510, 180, 22], [2660, 430, 170, 22]],
      c: [[320, 470], [560, 405], [850, 350], [995, 475], [1182, 465], [1430, 415], [1735, 355], [2070, 430], [2410, 470], [2710, 390], [2910, 578]],
      hzd: [[470, 650, 140, 38], [1018, 650, 96, 38], [1495, 650, 86, 38], [2020, 650, 160, 38]],
      e: [[715, 582, 645, 968, 90], [2270, 582, 2220, 2580, 108]],
      gate: [3050, 528, 52, 94],
      cp: [[1660, 622]]
    },
    {
      name: "Relay Crown",
      w: 3500,
      h: 820,
      spawn: [95, 598],
      need: 10,
      p: [[0, 672, 410, 148], [570, 672, 350, 148], [1085, 672, 330, 148], [1550, 672, 310, 148], [1995, 672, 420, 148], [2710, 672, 790, 148], [255, 560, 135, 22], [520, 500, 150, 22], [810, 440, 165, 22], [1120, 535, 150, 22], [1390, 470, 165, 22], [1700, 405, 180, 22], [2050, 520, 165, 22], [2320, 455, 170, 22], [2615, 390, 160, 22], [2940, 500, 180, 22]],
      c: [[290, 520], [560, 460], [865, 400], [1040, 540], [1180, 495], [1445, 430], [1760, 365], [2110, 480], [2375, 415], [2660, 350], [3010, 460], [3270, 628]],
      hzd: [[420, 700, 142, 38], [930, 700, 146, 38], [1426, 700, 110, 38], [1875, 700, 110, 38], [2428, 700, 270, 38]],
      e: [[620, 632, 590, 880, 110], [2030, 632, 2020, 2380, 112], [2860, 632, 2760, 3300, 126]],
      gate: [3380, 578, 54, 94],
      cp: [[1620, 672], [2760, 672]]
    }
  ];

  function rect(a) { return { x: a[0], y: a[1], w: a[2], h: a[3] }; }
  function hit(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function clock(t) { t = Math.floor(t); return String(Math.floor(t / 60)).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0"); }

  function load(n) {
    var m = maps[n];
    levelNo = n;
    level = {
      name: m.name,
      w: m.w,
      h: m.h,
      need: m.need,
      platforms: m.p.map(rect),
      cells: m.c.map(function (c) { return { x: c[0], y: c[1], got: false }; }),
      hazards: m.hzd.map(rect),
      enemies: m.e.map(function (e) { return { x: e[0], y: e[1], w: 42, h: 32, min: e[2], max: e[3], s: e[4], d: 1, live: true }; }),
      gate: rect(m.gate),
      cps: m.cp.map(function (c) { return { x: c[0], y: c[1], on: false }; }),
      spawn: { x: m.spawn[0], y: m.spawn[1] },
      got: 0
    };
    player = { x: level.spawn.x, y: level.spawn.y, w: 34, h: 46, vx: 0, vy: 0, face: 1, ground: false, coy: 0, buf: 0, dash: 1, dashT: 0, inv: 0, hp: 3, cp: { x: level.spawn.x, y: level.spawn.y } };
    levelTime = 0;
    camera.x = 0;
    camera.y = 0;
    mode = "play";
    screen.classList.remove("is-visible");
    hud();
  }

  function hud() {
    levelName.textContent = level ? level.name : "Relay Run";
    cellCount.textContent = level ? level.got + "/" + level.need : "0/0";
    timer.textContent = clock(runTime + levelTime);
    heartsEl.innerHTML = "";
    for (var i = 0; i < 3; i += 1) {
      var h = document.createElement("span");
      h.className = "heart" + (player && i >= player.hp ? " is-empty" : "");
      heartsEl.appendChild(h);
    }
  }

  function show(title, copy, button) {
    screenKicker.textContent = level ? level.name : "Relay Run";
    screenTitle.textContent = title;
    screenCopy.textContent = copy;
    primaryAction.textContent = button;
    secondaryAction.classList.toggle("is-hidden", mode !== "pause" && mode !== "clear");
    screen.classList.add("is-visible");
  }

  function hurt() {
    if (player.inv > 0 || mode !== "play") return;
    player.hp -= 1;
    if (player.hp <= 0) {
      mode = "dead";
      show("Run Lost", "The relay can still be recovered from this stage.", "Retry");
    } else {
      player.x = player.cp.x;
      player.y = player.cp.y;
      player.vx = 0;
      player.vy = 0;
      player.inv = 1.2;
    }
    hud();
  }

  function move(dt) {
    var left = keys.left || touch.left;
    var right = keys.right || touch.right;
    var jump = keys.jump || touch.jump;
    var mx = (right ? 1 : 0) - (left ? 1 : 0);
    if (taps.jump) player.buf = 0.13;
    player.buf -= dt;
    player.coy = player.ground ? 0.12 : player.coy - dt;
    if (mx) {
      player.vx += mx * (player.ground ? 2800 : 1800) * dt;
      player.face = mx;
    } else {
      player.vx *= player.ground ? 0.82 : 0.96;
    }
    if (player.buf > 0 && player.coy > 0) {
      player.vy = -760;
      player.ground = false;
      player.buf = 0;
      player.coy = 0;
    }
    if (!jump && player.vy < -260) player.vy = -260;
    if (taps.dash && player.dash) {
      player.vx = (mx || player.face) * 900;
      player.vy = Math.min(player.vy, -70);
      player.dash = 0;
      player.dashT = 0.16;
    }
    player.dashT -= dt;
    player.vy += (player.dashT > 0 ? 360 : 2200) * dt;
    player.vx = clamp(player.vx, -900, 900);
    player.vy = clamp(player.vy, -980, 1200);
    player.inv -= dt;

    player.x += player.vx * dt;
    level.platforms.forEach(function (p) {
      if (!hit(player, p)) return;
      if (player.vx > 0) player.x = p.x - player.w;
      if (player.vx < 0) player.x = p.x + p.w;
      player.vx = 0;
    });
    player.y += player.vy * dt;
    player.ground = false;
    level.platforms.forEach(function (p) {
      if (!hit(player, p)) return;
      if (player.vy > 0) {
        player.y = p.y - player.h;
        player.ground = true;
        player.dash = 1;
      } else {
        player.y = p.y + p.h;
      }
      player.vy = 0;
    });
    if (player.y > level.h + 120) hurt();
  }

  function update(dt) {
    if (mode !== "play") {
      taps = {};
      return;
    }
    levelTime += dt;
    move(dt);
    level.cells.forEach(function (c) {
      var dx = player.x + player.w / 2 - c.x;
      var dy = player.y + player.h / 2 - c.y;
      if (!c.got && dx * dx + dy * dy < 1200) {
        c.got = true;
        level.got += 1;
        hud();
      }
    });
    level.cps.forEach(function (c) {
      if (hit(player, { x: c.x - 12, y: c.y - 60, w: 38, h: 66 })) {
        c.on = true;
        player.cp.x = c.x;
        player.cp.y = c.y - player.h;
      }
    });
    level.hazards.forEach(function (h) { if (hit(player, { x: h.x + 8, y: h.y + 7, w: h.w - 16, h: h.h - 4 })) hurt(); });
    level.enemies.forEach(function (e) {
      if (!e.live) return;
      e.x += e.s * e.d * dt;
      if (e.x < e.min || e.x + e.w > e.max) e.d *= -1;
      if (hit(player, e)) {
        if (player.vy > 150 && player.y + player.h - e.y < 24) {
          e.live = false;
          player.vy = -560;
        } else {
          hurt();
        }
      }
    });
    if (level.got >= level.need && hit(player, level.gate)) {
      runTime += levelTime;
      mode = "clear";
      show("Gate Open", levelNo === maps.length - 1 ? "Final time " + clock(runTime) + "." : "Clean jump line. The next rooftop is hot.", levelNo === maps.length - 1 ? "Play Again" : "Next Stage");
    }
    camera.x += (clamp(player.x - W * 0.42, 0, level.w - W) - camera.x) * 0.09;
    camera.y += (clamp(player.y - H * 0.58, 0, level.h - H) - camera.y) * 0.09;
    timer.textContent = clock(runTime + levelTime);
    taps = {};
  }

  function sky() {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#191520");
    g.addColorStop(0.6, "#273b3e");
    g.addColorStop(1, "#c86f5a");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(97,211,148,.22)";
    for (var i = -2; i < 18; i += 1) ctx.fillRect(i * 160 - camera.x * 0.18 % 160, H - 115 - (i % 4) * 18, 90, 180);
  }

  function draw() {
    sky();
    if (!level) return;
    ctx.save();
    ctx.translate(-camera.x, -camera.y);
    level.platforms.forEach(function (p) {
      ctx.fillStyle = "#222733";
      ctx.fillRect(p.x, p.y + 8, p.w, p.h - 8);
      ctx.fillStyle = "#2e3440";
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = "#61d394";
      ctx.fillRect(p.x, p.y, p.w, 7);
    });
    level.hazards.forEach(function (h) {
      ctx.fillStyle = "#ef476f";
      for (var x = h.x; x < h.x + h.w; x += 22) {
        ctx.beginPath();
        ctx.moveTo(x, h.y + h.h);
        ctx.lineTo(x + 11, h.y);
        ctx.lineTo(x + 22, h.y + h.h);
        ctx.fill();
      }
    });
    level.cells.forEach(function (c) {
      if (c.got) return;
      ctx.save();
      ctx.translate(c.x, c.y + Math.sin(levelTime * 4 + c.x) * 5);
      ctx.fillStyle = "#ffd166";
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(14, 0);
      ctx.lineTo(0, 18);
      ctx.lineTo(-14, 0);
      ctx.fill();
      ctx.restore();
    });
    level.cps.forEach(function (c) {
      ctx.fillStyle = "#151822";
      ctx.fillRect(c.x - 5, c.y - 52, 10, 54);
      ctx.fillStyle = c.on ? "#61d394" : "#118ab2";
      ctx.fillRect(c.x + 2, c.y - 50, 28, 18);
    });
    level.enemies.forEach(function (e) {
      if (!e.live) return;
      ctx.fillStyle = "#201b27";
      ctx.fillRect(e.x, e.y, e.w, e.h);
      ctx.fillStyle = "#ef476f";
      ctx.fillRect(e.x, e.y, e.w, 6);
      ctx.fillStyle = "#ffd166";
      ctx.fillRect(e.x + (e.d > 0 ? 25 : 7), e.y + 11, 10, 8);
    });
    ctx.fillStyle = level.got >= level.need ? "rgba(97,211,148,.82)" : "rgba(255,255,255,.24)";
    ctx.fillRect(level.gate.x, level.gate.y, level.gate.w, level.gate.h);
    if (player.inv <= 0 || Math.floor(levelTime * 18) % 2) {
      ctx.save();
      ctx.translate(player.x + 17, player.y + 23);
      ctx.scale(player.face, 1);
      ctx.fillStyle = "#118ab2";
      ctx.fillRect(-14, -2, 28, 24);
      ctx.fillStyle = "#f7f3e8";
      ctx.fillRect(-12, -22, 24, 25);
      ctx.fillStyle = "#ffd166";
      ctx.fillRect(1, -14, 13, 8);
      ctx.fillStyle = "#1b1b24";
      ctx.fillRect(-12, 22, 9, 10);
      ctx.fillRect(4, 22, 9, 10);
      ctx.restore();
    }
    ctx.restore();
  }

  function resize() {
    W = Math.max(320, innerWidth);
    H = Math.max(420, innerHeight);
    dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  var keymap = { ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right", ArrowUp: "jump", Space: "jump", KeyW: "jump", ShiftLeft: "dash", ShiftRight: "dash", KeyK: "dash", KeyP: "pause", Escape: "pause", KeyR: "restart", Enter: "enter" };
  addEventListener("keydown", function (e) {
    var a = keymap[e.code];
    if (!a) return;
    if (!keys[a]) taps[a] = true;
    keys[a] = true;
    if (a === "pause") pause();
    if (a === "restart" && level) load(levelNo);
    if (a === "enter" && mode !== "play") primary();
    e.preventDefault();
  });
  addEventListener("keyup", function (e) { if (keymap[e.code]) keys[keymap[e.code]] = false; });

  document.querySelectorAll("[data-hold], [data-press]").forEach(function (b) {
    function set(on) {
      var h = b.getAttribute("data-hold");
      var p = b.getAttribute("data-press");
      if (h) touch[h] = on;
      if (on && p) taps[p] = true;
      b.classList.toggle("is-active", on);
    }
    b.addEventListener("pointerdown", function (e) { b.setPointerCapture(e.pointerId); set(true); e.preventDefault(); });
    b.addEventListener("pointerup", function () { set(false); });
    b.addEventListener("pointercancel", function () { set(false); });
  });

  function pause() {
    if (mode === "play") {
      mode = "pause";
      show("Paused", "The route is waiting where you left it.", "Resume");
    } else if (mode === "pause") {
      mode = "play";
      screen.classList.remove("is-visible");
    }
  }

  function primary() {
    if (mode === "menu" || (mode === "clear" && levelNo === maps.length - 1)) {
      runTime = 0;
      load(0);
    } else if (mode === "dead") {
      load(levelNo);
    } else if (mode === "pause") {
      pause();
    } else if (mode === "clear") {
      load(levelNo + 1);
    }
  }

  primaryAction.addEventListener("click", primary);
  secondaryAction.addEventListener("click", function () { if (level) load(levelNo); });
  pauseBtn.addEventListener("click", pause);
  restartBtn.addEventListener("click", function () { if (level) load(levelNo); });
  addEventListener("resize", resize);
  resize();
  hud();
  show("Relay Run", "A three-stage platform sprint through bright factory rooftops.", "Start Run");

  var last = performance.now();
  function frame(now) {
    var dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}());
