/* ============================================================
   SWORD STORM — kontrol pedang dengan tangan lewat webcam
   Hand tracking: MediaPipe Hands (jalan di browser, tanpa upload)
   ============================================================ */
(function () {
  "use strict";

  var CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/";
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- ANGKA YANG BISA KAMU SETEL ---------- */
  var THUMB_OUT = 0.8;        // jempol dianggap "terbuka" kalau jaraknya > ini x panjang telapak
  var THUMB_UP = 0.72;        // jempol dianggap "mengacung ke atas" kalau searah telapak (0 sampai 1, makin besar makin ketat)
  var WINGS_TOGETHER = 0.4;   // 2 jari dianggap "rapat" kalau jarak ujungnya < ini x panjang telapak
  var PINCH = 0.32;           // jempol & telunjuk dianggap "menyentuh" (OK sign) kalau jarak < ini x panjang telapak
  var HEART_JOIN = 3.0;       // dua half heart menyatu kalau jarak tangan < ini x ukuran tangan
  var LOTUS_NEAR = 2.2;       // dua telapak terbuka jadi teratai kalau jarak tangan < ini x ukuran tangan (lebih jauh = infinity)
  var SQUARE_SIZE = 4;        // sisi persegi (1 jari) = ini x ukuran tangan
  var BASE_H = 28;            // tinggi dasar pedang (piksel, pada layar 720p)

  var stage = $("gmStage"), video = $("gmVideo"), cv = $("gmFx"), ctx = cv.getContext("2d");
  var overlay = $("gmOverlay"), startBtn = $("gmStart"), stopBtn = $("gmStop");
  var msg = $("gmMsg"), hint = $("gmHint"), hudL = $("gmHudL"), hudR = $("gmHudR");
  var shotBtn = $("gmShot"), fsBtn = $("gmFull");
  var countRange = $("gmCount"), countVal = $("gmCountVal");
  var sizeRange = $("gmSize"), sizeVal = $("gmSizeVal");
  var speedRange = $("gmSpeed"), speedVal = $("gmSpeedVal");
  var feedChk = $("gmFeed"), skelChk = $("gmSkel");
  var styleBtns = document.querySelectorAll("#gmStyle button");

  var GINFO = {
    open:  { n: "OPEN PALM",   m: "GALAXY" },
    fist:  { n: "FIST",        m: "SHIELD" },
    point: { n: "1 FINGER",    m: "SQUARE" },
    wings: { n: "2 FINGERS",   m: "WINGS" },
    fan:   { n: "V SIGN",      m: "BLADE FAN" },
    half:  { n: "HALF HEART",  m: "HALF LOVE" },
    tri:   { n: "3 FINGERS",   m: "TRIANGLE" },
    rock:  { n: "ROCK SIGN",   m: "LIGHTNING" },
    ring:  { n: "OK SIGN",     m: "RING" },
    sword: { n: "PINKY UP",    m: "GREAT SWORD" },
    wave:  { n: "SHAKA",       m: "OCEAN WAVE" },
    web:   { n: "SPIDER SIGN", m: "WEB" },
    star:  { n: "THUMBS UP",   m: "STAR" }
  };
  /* pose yang sama di dua tangan -> bentuk gabungan */
  var PAIR = {
    half:  { id: "heart",    name: "FULL HEART" },
    open:  { id: "infinity", name: "INFINITY" },      // kalau didekatkan: lotus (lihat di frame)
    fist:  { id: "binary",   name: "BINARY STAR" },
    point: { id: "wall",     name: "SWORD WALL" },
    wings: { id: "wings2",   name: "GREAT WINGS" },
    fan:   { id: "sun",      name: "SUNBURST" },
    tri:   { id: "hexa",     name: "HEXAGRAM" },
    rock:  { id: "bolt",     name: "LIGHTNING LINK" },
    ring:  { id: "rings",    name: "LINKED RINGS" },
    sword: { id: "cross",    name: "CROSSED SWORDS" },
    wave:  { id: "ocean",    name: "OCEAN" },
    web:   { id: "webpair",  name: "GIANT WEB" },
    star:  { id: "penta",    name: "PENTAGRAM" }
  };
  var LOTUS = { id: "lotus", name: "BLOOMING LOTUS" };
  /* semua pedang ikut bentuk gabungan */
  var ALL_PAIR = { heart: 1, infinity: 1, wall: 1, wings2: 1, sun: 1, hexa: 1, bolt: 1, lotus: 1, ocean: 1, webpair: 1, penta: 1 };
  /* 1 dari N pedang jadi cincin luar / riak air */
  var RING_SHARE = { binary: 4, hexa: 5, penta: 5, lotus: 6 };

  var CONN = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],
              [9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];

  /* ---------- state ---------- */
  var W = 640, H = 360, dpr = 1, sc = 0.5;
  var vw = 1280, vh = 720, vsc = 1, offX = 0, offY = 0;
  var stream = null, running = false, handsObj = null;
  var hands = [], lastHandsAt = 0;
  var swords = [], rings = [];
  var styleMode = "mix", sizeMul = 1, speedMul = 1;
  var T = 0, last = performance.now(), fps = 60, lastHud = "";
  var lastPair = null, lotusT = 0;

  var TWO_PI = Math.PI * 2;
  function lerpAngle(a, b, t) {
    var d = (((b - a + Math.PI) % TWO_PI) + TWO_PI) % TWO_PI - Math.PI;
    return a + d * t;
  }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function msgShow(t) { msg.textContent = t || ""; }

  /* ---------- sprite pedang (digambar sekali, dipakai ribuan kali) ---------- */
  /* 0 = putih + cahaya biru, 1 = biru menyala, 2 = merah menyala */
  var PAL = [
    { glow: "rgba(80,170,255,.95)", g0: "#9fb8d6", g1: "#ffffff", g2: "#bcd0ea", fuller: "rgba(40,110,200,.35)", guard: "#4da6ff" },
    { glow: "rgba(40,140,255,1)",   g0: "#0a4fb3", g1: "#6fd2ff", g2: "#0b5fd0", fuller: "rgba(255,255,255,.5)", guard: "#ffffff" },
    { glow: "rgba(255,30,60,.95)",  g0: "#7a0010", g1: "#ff5266", g2: "#a00018", fuller: "rgba(255,255,255,.4)", guard: "#ffffff" }
  ];
  function makeSprite(p) {
    var c = document.createElement("canvas");
    c.width = 64; c.height = 224;
    var g = c.getContext("2d"), cx = 32;

    g.shadowColor = p.glow;
    g.shadowBlur = 12;

    var gr = g.createLinearGradient(cx - 8, 0, cx + 8, 0);
    gr.addColorStop(0, p.g0); gr.addColorStop(.5, p.g1); gr.addColorStop(1, p.g2);
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(cx, 10); g.lineTo(cx + 8, 42); g.lineTo(cx + 8, 150);
    g.lineTo(cx - 8, 150); g.lineTo(cx - 8, 42); g.closePath(); g.fill();

    g.shadowBlur = 0;
    g.fillStyle = p.fuller; g.fillRect(cx - 1, 40, 2, 106);

    g.shadowBlur = 8;
    g.fillStyle = p.guard; g.fillRect(cx - 22, 150, 44, 8);

    g.shadowBlur = 0;
    g.fillStyle = "#1b2330"; g.fillRect(cx - 4, 158, 8, 40);
    g.fillStyle = "#3a4a66";
    for (var y = 162; y < 196; y += 8) g.fillRect(cx - 4, y, 8, 2);

    g.shadowBlur = 8;
    g.fillStyle = p.guard;
    g.beginPath(); g.arc(cx, 205, 7, 0, 6.2832); g.fill();
    return c;
  }
  var SPR = PAL.map(makeSprite);

  /* ---------- pedang ---------- */
  function makeSword() {
    return {
      x: W / 2 + (Math.random() - 0.5) * W, y: H / 2 + (Math.random() - 0.5) * H,
      vx: 0, vy: 0, a: Math.random() * 6.28,
      gp: Math.random(),            // penentu "milik tangan mana" (tetap, jadi pembagian stabil)
      rf: Math.random(), sz: Math.random(), k: 30 + Math.random() * 60,
      grp: 2, gi: 0, pg: -1
    };
  }
  function setCount(n) {
    while (swords.length < n) swords.push(makeSword());
    swords.length = n;
    countVal.textContent = n;
  }

  /* ---------- ukuran panggung & pemetaan video -> layar ---------- */
  function layout() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = stage.clientWidth || 640; H = stage.clientHeight || 360;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    vsc = Math.min(W / vw, H / vh);
    offX = (W - vw * vsc) / 2; offY = (H - vh * vsc) / 2;
    sc = H / 720;
  }
  if ("ResizeObserver" in window) new ResizeObserver(layout).observe(stage);
  window.addEventListener("resize", layout);

  function toStage(lm) {
    return { x: offX + (1 - lm.x) * vw * vsc, y: offY + lm.y * vh * vsc };  // cermin
  }

  /* ---------- baca gestur tangan ---------- */
  function analyze(lm) {
    var p = lm.map(toStage);
    var d = function (a, b) { return Math.hypot(a.x - b.x, a.y - b.y); };
    var w = p[0];
    var S = Math.max(28, d(p[0], p[9]));

    var ext = function (t, j) { return d(p[t], w) > d(p[j], w) * 1.1; };
    var i = ext(8, 6), m = ext(12, 10), r = ext(16, 14), q = ext(20, 18);
    var n = i + m + r + q;
    var thumbOut = d(p[4], p[5]) > S * THUMB_OUT;
    var together = d(p[8], p[12]) < S * WINGS_TOGETHER;
    var pinch = d(p[4], p[8]) < S * PINCH;

    /* jempol searah telapak = jempol ke atas */
    var tvx = p[4].x - p[2].x, tvy = p[4].y - p[2].y;
    var avx = p[9].x - p[0].x, avy = p[9].y - p[0].y;
    var thumbUp = (tvx * avx + tvy * avy) / ((Math.hypot(tvx, tvy) || 1) * (Math.hypot(avx, avy) || 1)) > THUMB_UP;

    var raw;
    if (pinch && m && r && q) raw = "ring";                            // OK sign
    else if (n === 4) raw = "open";
    else if (i && q && !m && !r) raw = thumbOut ? "web" : "rock";      // telunjuk + kelingking (+ jempol = spider)
    else if (i && m && r && !q) raw = "tri";                           // 3 jari
    else if (i && m && !r && !q) raw = together ? "wings" : "fan";     // 2 jari
    else if (q && !i && !m && !r) raw = thumbOut ? "wave" : "sword";   // kelingking saja (+ jempol = shaka)
    else if (!m && !r && !q) raw = thumbOut ? ((!i && thumbUp) ? "star" : "half") : (i ? "point" : "fist");
    else raw = "fan";

    var cx = (p[0].x + p[5].x + p[9].x + p[13].x + p[17].x) / 5;
    var cy = (p[0].y + p[5].y + p[9].y + p[13].y + p[17].y) / 5;
    var dir = raw === "point"
      ? Math.atan2(p[8].y - p[5].y, p[8].x - p[5].x)
      : Math.atan2(p[9].y - p[0].y, p[9].x - p[0].x);
    return { cx: cx, cy: cy, S: S, dir: dir, raw: raw, pts: p, tipx: p[8].x, tipy: p[8].y };
  }

  function onResults(res) {
    var lms = res.multiHandLandmarks || [];
    if (!lms.length) return;
    lastHandsAt = performance.now();

    var found = lms.map(analyze).sort(function (a, b) { return a.cx - b.cx; });
    hands.forEach(function (h) { h.used = false; });

    hands = found.map(function (f) {
      var prev = null, best = W * 0.35;
      for (var k = 0; k < hands.length; k++) {
        var p = hands[k];
        if (p.used) continue;
        var dd = Math.hypot(p.cx - f.cx, p.cy - f.cy);
        if (dd < best) { best = dd; prev = p; }
      }
      if (!prev) {
        f.g = f.raw; f.cand = f.raw; f.candN = 0; f.burst = false; f.used = true;
        f.born = performance.now();      // tangan yang lebih tua = tangan utama
        return f;
      }
      prev.used = true;
      var m = 0.55;
      prev.cx += (f.cx - prev.cx) * m; prev.cy += (f.cy - prev.cy) * m;
      prev.S += (f.S - prev.S) * m;
      prev.tipx += (f.tipx - prev.tipx) * m; prev.tipy += (f.tipy - prev.tipy) * m;
      prev.dir = lerpAngle(prev.dir, f.dir, m);
      prev.pts = f.pts;

      /* gestur harus stabil 3 frame supaya tidak berkedip */
      if (f.raw === prev.g) { prev.candN = 0; }
      else {
        if (f.raw === prev.cand) prev.candN++; else { prev.cand = f.raw; prev.candN = 1; }
        if (prev.candN >= 3) {
          if (prev.g === "fist" && f.raw === "open") prev.burst = true;
          prev.g = f.raw; prev.candN = 0;
        }
      }
      return prev;
    });
  }

  /* ---------- kamera + AI ---------- */
  async function startCamera() {
    msgShow("");
    if (!window.isSecureContext) {
      msgShow("The camera only works on HTTPS or localhost. Open this page via http://localhost:PORT or an HTTPS address.");
      return;
    }
    if (typeof Hands === "undefined") {
      msgShow("The hand tracking library could not be loaded. Check your internet connection and refresh.");
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      msgShow("This browser does not support camera access.");
      return;
    }

    startBtn.disabled = true;
    startBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Requesting camera...';

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" }, audio: false
      });
    } catch (err) {
      resetStartBtn();
      msgShow("Camera permission was denied or no camera was found. Allow camera access in your browser and try again.");
      return;
    }

    video.srcObject = stream;
    try { await video.play(); } catch (e) { /* abaikan */ }
    vw = video.videoWidth || 1280; vh = video.videoHeight || 720;
    stage.style.setProperty("--ar", (vw / vh).toFixed(4));
    stage.classList.add("live");
    layout();

    startBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading AI model...';
    try {
      if (!handsObj) {
        handsObj = new Hands({ locateFile: function (f) { return CDN + f; } });
        handsObj.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.6, minTrackingConfidence: 0.5 });
        handsObj.onResults(onResults);
        await handsObj.initialize();
      }
    } catch (err) {
      stopCamera();
      msgShow("The AI model failed to load. Check your internet connection and try again.");
      return;
    }

    running = true;
    overlay.classList.add("hide");
    stopBtn.disabled = false;
    resetStartBtn();
    detectLoop();
  }
  function resetStartBtn() {
    startBtn.disabled = false;
    startBtn.innerHTML = '<i class="fa-solid fa-video"></i> Start Camera';
  }

  async function detectLoop() {
    if (!running) return;
    if (video.readyState >= 2 && video.videoWidth) {
      try { await handsObj.send({ image: video }); } catch (e) { /* lewati frame */ }
    }
    requestAnimationFrame(detectLoop);
  }

  function stopCamera() {
    running = false;
    if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
    video.srcObject = null;
    stage.classList.remove("live");
    overlay.classList.remove("hide");
    stopBtn.disabled = true;
    hands = []; hint.hidden = true;
    resetStartBtn();
  }

  /* ============================================================
     BENTUK-BENTUK PEDANG
     Tiap fungsi mengisi O: x, y (target), a (sudut, null = ikut arah gerak),
     hs (tinggi pedang px, 0 = standar), k (kekakuan pegas).
     j = nomor pedang di dalam grupnya, c = jumlah pedang di grup itu.
     Posisi dihitung dari j/c (rata, bukan acak) supaya bentuknya rapi.
     ============================================================ */
  var O = { x: 0, y: 0, a: null, hs: 0, k: 1, fade: 1 };
  function setO(x, y, a, hs, k) { O.x = x; O.y = y; O.a = a; O.hs = hs || 0; O.k = k || 1; }

  /* galaksi: 3 lengan spiral */
  function fGalaxy(j, c, cx, cy, S) {
    var arms = 3, arm = j % arms, m = Math.ceil(c / arms);
    var v = (Math.floor(j / arms) + 0.5) / m;
    var r = S * (0.6 + Math.pow(v, 0.85) * 3.4);
    var a = arm * TWO_PI / arms + v * 3.4 + T * 0.8;
    var sx = Math.cos(a), sy = Math.sin(a);
    setO(cx + sx * r, cy + sy * r * 0.5, Math.atan2(0.5 * sx, -sy) + Math.PI / 2, (BASE_H - 2 + (1 - v) * 8) * sc, 1);
  }

  /* shield: 6 cincin berputar bergantian arah, ujung ke luar */
  function fShield(j, c, cx, cy, S) {
    var rn = 6, ring = j % rn, m = Math.ceil(c / rn), idx = Math.floor(j / rn);
    var a = (idx + 0.5) / m * TWO_PI + T * (1.2 + ring * 0.2) * (ring % 2 ? 1 : -1);
    var r = S * (1.0 + ring * 0.3) * (1 + 0.025 * Math.sin(T * 5));
    setO(cx + Math.cos(a) * r, cy + Math.sin(a) * r, a + Math.PI / 2, (22 + ring * 2) * sc, 1.8);
  }

  /* persegi diam, searah jari */
  function fSquare(j, c, h) {
    var cols = Math.ceil(Math.sqrt(c)), rows = Math.ceil(c / cols);
    var col = j % cols, row = Math.floor(j / cols);
    var side = h.S * SQUARE_SIZE;
    var fx = Math.cos(h.dir), fy = Math.sin(h.dir);
    var ccx = h.tipx + fx * (side / 2 + h.S * 0.45), ccy = h.tipy + fy * (side / 2 + h.S * 0.45);
    var lat = (cols > 1 ? col / (cols - 1) - 0.5 : 0) * side;
    var fw = (rows > 1 ? row / (rows - 1) - 0.5 : 0) * side;
    setO(ccx - fy * lat + fx * fw, ccy + fx * lat + fy * fw, h.dir + Math.PI / 2,
         Math.max(8, Math.min(70, side / Math.max(cols - 1, 1) * 1.6)), 2.2);
  }

  /* kipas: 8 baris busur */
  function fFan(j, c, h) {
    var rn = 8, row = j % rn, idx = Math.floor(j / rn), m = Math.ceil(c / rn);
    var a = h.dir + (m > 1 ? idx / (m - 1) - 0.5 : 0) * 1.9;
    var d = h.S * (0.9 + row * 0.45) * (1 + 0.03 * Math.sin(T * 3));
    setO(h.cx + Math.cos(a) * d, h.cy + Math.sin(a) * d, a + Math.PI / 2, (22 + row * 1.5) * sc, 1.5);
  }

  /* sayap: tulang sayap melengkung, bulu menggantung berlapis 3 */
  function wing(jj, cc, R, P, S) {
    var layers = 3, layer = jj % layers, idx = Math.floor(jj / layers), m = Math.ceil(cc / layers);
    var u = (idx + 0.5) / m, iu = 1 - u;
    var dx = P.x - R.x, dy = P.y - R.y, len = Math.hypot(dx, dy) || 1;
    var Qx = R.x + dx * 0.45, Qy = R.y + dy * 0.5 - len * 0.38;
    var bx = iu * iu * R.x + 2 * iu * u * Qx + u * u * P.x;
    var by = iu * iu * R.y + 2 * iu * u * Qy + u * u * P.y;
    var tx = 2 * iu * (Qx - R.x) + 2 * u * (P.x - Qx), ty = 2 * iu * (Qy - R.y) + 2 * u * (P.y - Qy);
    var tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    var nx = -ty, ny = tx;
    if (ny < 0) { nx = -nx; ny = -ny; }                       // normal selalu menunjuk ke bawah
    var off = layer * S * 0.5 * (0.5 + u * 0.7);
    var fx = nx + tx * 0.45, fy = ny + ty * 0.45;
    setO(bx + nx * off, by + ny * off, Math.atan2(fy, fx) + Math.PI / 2, (18 + 26 * u + layer * 8) * sc, 1.8);
  }
  var wR = { x: 0, y: 0 }, wP = { x: 0, y: 0 };
  function fWingsSingle(j, c, h) {
    var side = (j % 2) ? 1 : -1, jj = Math.floor(j / 2), cc = Math.ceil(c / 2);
    var span = Math.min(h.S * 6, W * 0.42);
    wR.x = h.cx; wR.y = h.cy + h.S * 0.3;
    wP.x = h.cx + side * span; wP.y = h.cy - h.S * 1.4 + Math.sin(T * 2.2) * h.S * 0.9;
    wing(jj, cc, wR, wP, h.S);
  }
  function fWingsPair(j, c, A, B, mx, my, S) {
    var side = (j % 2) ? 1 : -1, jj = Math.floor(j / 2), cc = Math.ceil(c / 2);
    var tgt = side < 0 ? A : B;
    wR.x = mx; wR.y = my + S * 0.3;
    wP.x = side < 0 ? Math.min(tgt.cx, mx - S * 1.5) : Math.max(tgt.cx, mx + S * 1.5);
    wP.y = tgt.cy + Math.sin(T * 2.2) * S * 0.5;
    wing(jj, cc, wR, wP, S);
  }

  /* segitiga di dalam segitiga */
  function fTri(j, c, h) {
    var layer = j % 2, jj = Math.floor(j / 2), cc = Math.ceil(c / 2);
    var e = jj % 3, idx = Math.floor(jj / 3), mm = Math.ceil(cc / 3), u = (idx + 0.5) / mm;
    var R = h.S * 1.5 * (layer ? 0.5 : 1);
    var cx = h.cx + Math.cos(h.dir) * h.S * 2.3, cy = h.cy + Math.sin(h.dir) * h.S * 2.3;
    var a0 = h.dir + T * 0.4 + (layer ? Math.PI : 0) + e * TWO_PI / 3, a1 = a0 + TWO_PI / 3;
    var x0 = cx + Math.cos(a0) * R, y0 = cy + Math.sin(a0) * R;
    var x1 = cx + Math.cos(a1) * R, y1 = cy + Math.sin(a1) * R;
    setO(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, Math.atan2(y1 - y0, x1 - x0) + Math.PI / 2, 22 * sc, 1.6);
  }

  /* petir zigzag dari (bx,by) ke (ex,ey) */
  function vOff(k, K, S) {
    if (k <= 0 || k >= K) return 0;
    return (k % 2 ? 1 : -1) * S * (0.42 + 0.14 * Math.sin(T * 9 + k * 2.1));
  }
  function fBolt(j, c, bx, by, ex, ey, S, K) {
    var strands = 5, st = j % strands, jj = Math.floor(j / strands), m = Math.ceil(c / strands);
    var u = (jj + 0.5) / m;
    var dx = ex - bx, dy = ey - by, L = Math.hypot(dx, dy) || 1;
    var ux = dx / L, uy = dy / L, px = -uy, py = ux;
    var pos = u * K, k = Math.min(K - 1, Math.floor(pos)), f = pos - k;
    var o0 = vOff(k, K, S), o1 = vOff(k + 1, K, S);
    var x0 = bx + ux * L * k / K + px * o0, y0 = by + uy * L * k / K + py * o0;
    var x1 = bx + ux * L * (k + 1) / K + px * o1, y1 = by + uy * L * (k + 1) / K + py * o1;
    var sdx = x1 - x0, sdy = y1 - y0, sl = Math.hypot(sdx, sdy) || 1;
    var off = (st - 2) * S * 0.12;
    setO(x0 + sdx * f - sdy / sl * off, y0 + sdy * f + sdx / sl * off, Math.atan2(sdy, sdx) + Math.PI / 2, 22 * sc, 2.2);
  }

  /* cincin (OK sign): 3 lapis konsentris */
  function fRing(j, c, cx, cy, R) {
    var layers = 3, layer = j % layers, idx = Math.floor(j / layers), m = Math.ceil(c / layers);
    var a = (idx + 0.5) / m * TWO_PI + T * 0.7 * (layer === 1 ? -1 : 1);
    var r = R * (1 - layer * 0.22);
    setO(cx + Math.cos(a) * r, cy + Math.sin(a) * r, layer === 1 ? a + Math.PI / 2 : a + Math.PI, 22 * sc, 1.6);
  }
  /* cincin tunggal tipis */
  function fRingThin(j, c, cx, cy, R, dirSign) {
    var a = (j + 0.5) / c * TWO_PI + T * 0.9 * dirSign;
    setO(cx + Math.cos(a) * R, cy + Math.sin(a) * R, a + Math.PI, 22 * sc, 1.6);
  }

  /* hati. half: 0 = utuh, 1 = setengah kiri, 2 = setengah kanan. Hw = setengah lebar (px) */
  var hp1 = { x: 0, y: 0 }, hp2 = { x: 0, y: 0 };
  function heartPt(t, o) {
    var st = Math.sin(t);
    o.x = 16 * st * st * st;
    o.y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
  }
  function fHeart(j, c, Cx, Cy, Hw, half) {
    var R = Hw / 16, yc = -2.5, u = (j + 0.5) / c;
    var t = half === 0 ? u * TWO_PI : (half === 2 ? u * Math.PI : Math.PI + u * Math.PI);
    var fillOn = (j % 5 === 0);                                    // 1 dari 5 pedang mengisi bagian dalam
    var fill = fillOn ? 0.3 + 0.55 * ((j * 0.6180339) % 1) : 1;
    var pulse = 1 + 0.05 * Math.sin(T * 6);                        // detak jantung

    heartPt(t, hp1); heartPt(t + 0.03, hp2);
    var X = hp1.x * fill, Y = yc + (hp1.y - yc) * fill;
    var tdx = (hp2.x - hp1.x) * fill, tdy = -(hp2.y - hp1.y) * fill;
    var tl = Math.hypot(tdx, tdy) || 1;
    var jit = fillOn ? 0 : (((j * 0.37) % 1) - 0.5) * R * 0.8;      // garis hati sedikit tebal
    setO(Cx + X * R * pulse + (-tdy / tl) * jit, Cy - (Y - yc) * R * pulse + (tdx / tl) * jit,
         Math.atan2(tdy, tdx) + Math.PI / 2, 22 * sc, 1.8);
  }

  /* infinity (lemniscate) */
  var lp0 = { x: 0, y: 0 }, lp1 = { x: 0, y: 0 };
  function lem(t, a, o) {
    var s = Math.sin(t), co = Math.cos(t), d = 1 + s * s;
    o.x = a * co / d; o.y = a * s * co / d;
  }
  function fInfinity(j, c, mx, my, a, ang, S) {
    var st = j % 5, jj = Math.floor(j / 5), m = Math.ceil(c / 5);
    var t = (jj + 0.5) / m * TWO_PI + T * 0.7;
    lem(t, a, lp0); lem(t + 0.03, a, lp1);
    var dx = lp1.x - lp0.x, dy = lp1.y - lp0.y, tl = Math.hypot(dx, dy) || 1;
    var off = (st - 2) * S * 0.12;
    var x = lp0.x - dy / tl * off, y = lp0.y + dx / tl * off;
    var ca = Math.cos(ang), sa = Math.sin(ang);
    setO(mx + x * ca - y * sa, my + x * sa + y * ca, Math.atan2(dy, dx) + ang + Math.PI / 2, 22 * sc, 1.6);
  }

  /* dinding pedang di antara dua jari */
  function fWall(j, c, cx, cy, Wd, Ht, ang) {
    var cols = Math.max(2, Math.round(Math.sqrt(c * Wd / Ht))), rows = Math.ceil(c / cols);
    var col = j % cols, row = Math.floor(j / cols);
    var lat = (col / (cols - 1) - 0.5) * Wd;
    var fw = (rows > 1 ? row / (rows - 1) - 0.5 : 0) * Ht;
    var dx = Math.cos(ang), dy = Math.sin(ang), ux = dy, uy = -dx;     // "atas" tegak lurus garis tangan
    setO(cx + dx * lat + ux * fw, cy + dy * lat + uy * fw, Math.atan2(uy, ux) + Math.PI / 2,
         Math.max(8, Math.min(60, Ht / Math.max(rows - 1, 1) * 1.6)), 2);
  }

  /* matahari: 24 sinar, selang-seling panjang */
  function fSun(j, c, cx, cy, r0, r1) {
    var rays = 24, ray = j % rays, m = Math.ceil(c / rays), idx = Math.floor(j / rays);
    var v = (idx + 0.5) / m;
    var rr = r0 + (r1 - r0) * (ray % 2 ? 0.6 : 1) * v;
    var a = ray / rays * TWO_PI + T * 0.25;
    setO(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, a + Math.PI / 2, 22 * sc, 1.6);
  }

  /* hexagram: dua segitiga saling terbalik */
  function fHexa(j, c, cx, cy, R) {
    var tri = j % 2, jj = Math.floor(j / 2), cc = Math.ceil(c / 2);
    var e = jj % 3, idx = Math.floor(jj / 3), mm = Math.ceil(cc / 3), u = (idx + 0.5) / mm;
    var a0 = -Math.PI / 2 + tri * Math.PI + e * TWO_PI / 3 + T * 0.3, a1 = a0 + TWO_PI / 3;
    var x0 = cx + Math.cos(a0) * R, y0 = cy + Math.sin(a0) * R;
    var x1 = cx + Math.cos(a1) * R, y1 = cy + Math.sin(a1) * R;
    setO(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, Math.atan2(y1 - y0, x1 - x0) + Math.PI / 2, 22 * sc, 1.6);
  }

  /* bintang segilima (pentagram): 2 lapis, lapis dalam diputar 36 derajat */
  function fStar(j, c, cx, cy, R, rot) {
    var layer = j % 2, jj = Math.floor(j / 2), cc = Math.ceil(c / 2);
    var e = jj % 5, idx = Math.floor(jj / 5), mm = Math.max(1, Math.ceil(cc / 5));
    var u = Math.min(0.9999, (idx + 0.5) / mm);
    var Rl = R * (layer ? 0.55 : 1);
    var base = -Math.PI / 2 + rot + (layer ? Math.PI / 5 : 0);
    var a0 = base + ((2 * e) % 5) * TWO_PI / 5, a1 = base + ((2 * e + 2) % 5) * TWO_PI / 5;
    var x0 = cx + Math.cos(a0) * Rl, y0 = cy + Math.sin(a0) * Rl;
    var x1 = cx + Math.cos(a1) * Rl, y1 = cy + Math.sin(a1) * Rl;
    setO(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, Math.atan2(y1 - y0, x1 - x0) + Math.PI / 2, 22 * sc, 1.6);
  }

  /* jaring laba-laba: 8 jari-jari + 4 cincin segi delapan */
  function fWeb(j, c, cx, cy, R) {
    var rot = T * 0.12, br = 1 + 0.02 * Math.sin(T * 2);
    var x, y, th;
    if ((j % 5) < 2) {
      var js = Math.floor(j / 5) * 2 + (j % 5);
      var ms = Math.max(1, Math.ceil(c * 0.4 / 8));
      var spoke = js % 8, t = Math.min(1, (Math.floor(js / 8) + 0.5) / ms);
      var a = rot + spoke * TWO_PI / 8;
      x = cx + Math.cos(a) * R * t * br; y = cy + Math.sin(a) * R * t * br; th = a + Math.PI / 2;
    } else {
      var jr = Math.floor(j / 5) * 3 + (j % 5 - 2);
      var mr = Math.max(1, Math.ceil(c * 0.6 / 4));
      var ring = jr % 4, u = Math.min(0.9999, (Math.floor(jr / 4) + 0.5) / mr);
      var rk = R * (ring + 1) / 4 * br, pos = u * 8, e = Math.floor(pos), f = pos - e;
      var a0 = rot + e * TWO_PI / 8, a1 = a0 + TWO_PI / 8;
      var x0 = cx + Math.cos(a0) * rk, y0 = cy + Math.sin(a0) * rk;
      var x1 = cx + Math.cos(a1) * rk, y1 = cy + Math.sin(a1) * rk;
      x = x0 + (x1 - x0) * f; y = y0 + (y1 - y0) * f; th = Math.atan2(y1 - y0, x1 - x0) + Math.PI / 2;
    }
    setO(x, y, th, 18 * sc, 1.6);
  }

  /* gelombang laut: 6 lapis, bergerak */
  function fWave(j, c, x0, x1, y0, y1, amp, gap) {
    var lines = 6, line = j % lines, idx = Math.floor(j / lines), m = Math.max(1, Math.ceil(c / lines));
    var u = (idx + 0.5) / m;
    var ph = u * TWO_PI * 2 - T * 2.2 + line * 0.55;
    var x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u + line * gap + Math.sin(ph) * amp;
    var dx = x1 - x0, dy = (y1 - y0) + Math.cos(ph) * amp * TWO_PI * 2;
    setO(x, y, Math.atan2(dy, dx) + Math.PI / 2, 20 * sc, 1.6);
  }

  /* pedang raksasa: bilah (7 lajur), pelindung, gagang, pommel. Gagang berada di (cx,cy). */
  function fSword(j, c, cx, cy, dir, L, S) {
    var jb = Math.floor(c * 0.72), jg = Math.floor(c * 0.12), jr = Math.floor(c * 0.10);
    var ca = Math.cos(dir), sa = Math.sin(dir), nx = -sa, ny = ca;
    var al, sd, th, hs;
    if (j < jb) {
      var cols = 7, row = Math.floor(j / cols), col = j % cols, rt = Math.max(1, Math.ceil(jb / cols));
      var t = (row + 0.5) / rt;
      var w = S * 0.9 * (t < 0.88 ? 1 : Math.max(0.05, (1 - t) / 0.12));   // ujung bilah meruncing
      al = S * 0.9 + t * L; sd = ((col + 0.5) / cols * 2 - 1) * w / 2;
      th = dir + Math.PI / 2;
      hs = Math.max(10, Math.min(34, L / rt * 1.8));
    } else if (j < jb + jg) {
      var jj = j - jb, cg = Math.max(1, jg), st = jj % 3, mm = Math.max(1, Math.ceil(cg / 3)), idx = Math.floor(jj / 3);
      var lat = ((idx + 0.5) / mm * 2 - 1) * S * 1.0;
      al = S * 0.6 + (st - 1) * S * 0.1; sd = lat;
      th = dir + (lat >= 0 ? Math.PI : 0);                                  // ujung pedang menghadap ke samping
      hs = 16 * sc;
    } else if (j < jb + jg + jr) {
      var j2 = j - jb - jg, cr = Math.max(1, jr), st2 = j2 % 3, mm2 = Math.max(1, Math.ceil(cr / 3)), idx2 = Math.floor(j2 / 3);
      al = -S * 0.6 + ((idx2 + 0.5) / mm2) * S * 1.1; sd = (st2 - 1) * S * 0.1;
      th = dir + Math.PI / 2; hs = 14 * sc;
    } else {
      var jp = j - jb - jg - jr, cp = Math.max(1, c - jb - jg - jr);
      var a = (jp + 0.5) / cp * TWO_PI + T;
      al = -S * 0.95 + Math.cos(a) * S * 0.26; sd = Math.sin(a) * S * 0.26;
      th = dir + a + Math.PI; hs = 12 * sc;
    }
    setO(cx + ca * al + nx * sd, cy + sa * al + ny * sd, th, hs, 2);
  }

  /* ---------- TERATAI ---------- */
  var PET = [
    { n: 8, spread: 1.40, len: 1.00, half: true  },   // baris luar, terlebar
    { n: 8, spread: 1.00, len: 0.82, half: false },
    { n: 6, spread: 0.66, len: 0.62, half: false },
    { n: 4, spread: 0.34, len: 0.42, half: false }    // kuncup di tengah
  ];
  var lpA = { x: 0, y: 0 }, lpB = { x: 0, y: 0 };

  /* titik pada garis tepi kelopak (bentuk daun runcing). u: 0..0.5 sisi kanan naik, 0.5..1 sisi kiri turun */
  function petalPt(u, L, Wp, th, bx, by, o) {
    var t, sgn;
    if (u < 0.5) { t = u * 2; sgn = 1; } else { t = 1 - (u - 0.5) * 2; sgn = -1; }
    var w = Wp * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.8)), 0.9);
    var al = t * L, ca = Math.cos(th), sa = Math.sin(th);
    o.x = bx + ca * al - sa * w * sgn;
    o.y = by + sa * al + ca * w * sgn;
  }

  /* bt = lama mekar (detik). Kelopak luar mekar lebih dulu, kuncup dalam menyusul. */
  function fLotus(j, c, bx, by, Rl, bt) {
    var P = 26, p = j % P, idx = Math.floor(j / P), m = Math.max(1, Math.ceil(c / P));
    var row, k;
    if (p < 8) { row = 0; k = p; } else if (p < 16) { row = 1; k = p - 8; }
    else if (p < 22) { row = 2; k = p - 16; } else { row = 3; k = p - 22; }
    var pt = PET[row];
    var pos = pt.half ? (k + 0.5) / pt.n * 2 - 1 : (k + 1) / (pt.n + 1) * 2 - 1;
    var e = easeOut(Math.max(0, Math.min(1, bt / 2.4 - row * 0.12)));
    var br = 1 + 0.03 * Math.sin(T * 1.6 + row);                    // bunga "bernapas"
    var L = Rl * pt.len * (0.55 + 0.45 * e) * br;
    var Wp = L * (0.15 + 0.15 * e);
    var th = -Math.PI / 2 + pos * pt.spread * (0.1 + 0.9 * e);

    if (idx % 4 === 3) {
      /* 1 dari 4 pedang berbaris di tulang tengah kelopak */
      var mm = Math.max(1, Math.floor(m / 4)), v = Math.min(1, (Math.floor(idx / 4) + 0.5) / mm);
      var al = v * L * 0.92;
      setO(bx + Math.cos(th) * al, by + Math.sin(th) * al, th + Math.PI / 2, 18 * sc, 1.7);
    } else {
      /* sisanya menggaris tepi kelopak */
      var io = idx - Math.floor((idx + 1) / 4), mo = Math.max(1, m - Math.floor(m / 4));
      var u = Math.min(0.9999, (io + 0.5) / mo);
      petalPt(u, L, Wp, th, bx, by, lpA);
      petalPt((u + 0.02) % 1, L, Wp, th, bx, by, lpB);
      setO(lpA.x, lpA.y, Math.atan2(lpB.y - lpA.y, lpB.x - lpA.x) + Math.PI / 2, 18 * sc, 1.7);
    }
  }

  /* riak air di bawah teratai: 3 elips konsentris */
  function fRipple(j, c, cx, cy, Rx) {
    var ring = j % 3, idx = Math.floor(j / 3), m = Math.max(1, Math.ceil(c / 3));
    var a = (idx + 0.5) / m * TWO_PI + T * 0.5 * (ring % 2 ? 1 : -1);
    var rx = Rx * (0.7 + ring * 0.3) * (1 + 0.04 * Math.sin(T * 2 - ring)), ry = rx * 0.2;
    setO(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, Math.atan2(ry * Math.cos(a), -rx * Math.sin(a)) + Math.PI / 2, 16 * sc, 1.2);
  }

  /* ---------- loop utama: pembagian grup + fisika + gambar ---------- */
  function frame(now) {
    var dt = Math.min(0.033, (now - last) / 1000);
    last = now; T += dt * speedMul;
    fps += (1 / Math.max(dt, 0.001) - fps) * 0.05;

    if (hands.length && now - lastHandsAt > 350) hands = [];
    var hc = hands.length, n = swords.length;

    var burstHands = [false, false];
    for (var b = 0; b < hc; b++) {
      var hb = hands[b];
      if (hb.burst) { burstHands[b] = true; hb.burst = false; rings.push({ x: hb.cx, y: hb.cy, t: 0 }); }
    }

    /* pose yang sama di dua tangan -> bentuk gabungan */
    var pair = null, pairName = "", A = null, B = null, mx = 0, my = 0, pd = 0, sAvg = 1, pAng = 0;
    if (hc === 2) {
      A = hands[0]; B = hands[1];
      sAvg = (A.S + B.S) / 2;
      pd = Math.hypot(A.cx - B.cx, A.cy - B.cy);
      mx = (A.cx + B.cx) / 2; my = (A.cy + B.cy) / 2;
      pAng = Math.atan2(B.cy - A.cy, B.cx - A.cx);
      if (A.g === B.g) {
        var pinfo = PAIR[A.g];
        if (A.g === "open" && pd < sAvg * LOTUS_NEAR) pinfo = LOTUS;     // telapak didekatkan = teratai
        if (pinfo && (A.g !== "half" || pd < sAvg * HEART_JOIN)) { pair = pinfo.id; pairName = pinfo.name; }
      }
    }
    if (pair !== lastPair) { if (pair) rings.push({ x: mx, y: my, t: 0 }); lastPair = pair; }
    if (pair === "lotus") lotusT += dt * (0.5 + 0.5 * speedMul); else lotusT = 0;   // timer mekar

    /* ukuran bentuk gabungan */
    var pairR = Math.max(sAvg * 2.4, pd * 0.55);
    var lotusBy = my + sAvg * 0.7;
    var lotusRl = Math.min(Math.max(sAvg * 3.2, pd * 1.15), Math.max(80, lotusBy - 24));
    var crossX = 0, crossY = 0;
    if (pair === "cross") {
      crossX = mx + Math.sin(pAng) * sAvg * 3.2;     // titik silang di atas kedua tangan
      crossY = my - Math.cos(pAng) * sAvg * 3.2;
    }

    /* pembagian pedang: tangan paling lama = tangan utama. Pedang punya "gp" tetap,
       jadi saat tangan kedua muncul hanya sebagian pedang yang pindah. Total tidak bertambah. */
    var ord = [];
    for (var q = 0; q < hc; q++) ord.push(q);
    ord.sort(function (a, b2) { return hands[a].born - hands[b2].born; });

    var allMode = hc === 0 || (pair && ALL_PAIR[pair]);
    var rshare = (pair && RING_SHARE[pair]) || 0;
    var cnt = [0, 0, 0, 0];          // grup 0/1 = tangan, 2 = semua, 3 = cincin luar / riak
    for (var i0 = 0; i0 < n; i0++) {
      var s0 = swords[i0], gr0;
      if (rshare && i0 % rshare === rshare - 1) gr0 = 3;
      else if (allMode) gr0 = 2;
      else gr0 = ord[Math.min(hc - 1, Math.floor(s0.gp * hc))];
      s0.grp = gr0; s0.gi = cnt[gr0]++;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    /* kerangka tangan */
    if (skelChk.checked && hc) {
      ctx.lineWidth = 1.5;
      for (var hi = 0; hi < hc; hi++) {
        var P = hands[hi].pts;
        ctx.strokeStyle = "rgba(160,210,255,.4)";
        ctx.beginPath();
        for (var cc2 = 0; cc2 < CONN.length; cc2++) {
          ctx.moveTo(P[CONN[cc2][0]].x, P[CONN[cc2][0]].y);
          ctx.lineTo(P[CONN[cc2][1]].x, P[CONN[cc2][1]].y);
        }
        ctx.stroke();
        ctx.fillStyle = "#ff3b3b";
        for (var jj2 = 0; jj2 < 21; jj2++) { ctx.beginPath(); ctx.arc(P[jj2].x, P[jj2].y, 2.6, 0, 6.2832); ctx.fill(); }
      }
    }

    /* pedang */
    ctx.globalCompositeOperation = "lighter";
    var kMul = 0.5 + 0.5 * speedMul;
    var rotRate = 10 * kMul;

    for (var i = 0; i < n; i++) {
      var s = swords[i], gr = s.grp, j = s.gi, c = cnt[gr];
      O.a = null; O.hs = 0; O.k = 1; O.fade = 1;

      if (gr === 3) {
        /* cincin luar / riak air */
        if (pair === "binary") fRingThin(j, c, mx, my, pd / 2 + sAvg * 1.7, 1);
        else if (pair === "lotus") fRipple(j, c, mx, lotusBy + sAvg * 0.35, lotusRl * 1.1);
        else fRingThin(j, c, mx, my, pairR * 1.18, -1);                  // hexagram & pentagram
      } else if (gr === 2) {
        if (hc === 0) {
          fGalaxy(j, c, W / 2, H / 2, H * 0.2);
          O.fade = 0.55; O.k = 0.4;
        } else if (pair === "heart")    fHeart(j, c, mx, my - sAvg * 0.2, Math.max(sAvg * 2.2, pd * 0.8), 0);
        else if (pair === "infinity")   fInfinity(j, c, mx, my, Math.max(pd / 1.1, sAvg * 3.2), pAng, sAvg);
        else if (pair === "lotus")      fLotus(j, c, mx, lotusBy, lotusRl, lotusT);
        else if (pair === "wall")       fWall(j, c, mx, my, Math.max(pd, sAvg * 3), sAvg * 3.2, pAng);
        else if (pair === "wings2")     fWingsPair(j, c, A, B, mx, my, sAvg);
        else if (pair === "sun")        fSun(j, c, mx, my, sAvg * 0.8, Math.max(pd * 0.8, sAvg * 3.5));
        else if (pair === "hexa")       fHexa(j, c, mx, my, pairR);
        else if (pair === "penta")      fStar(j, c, mx, my, pairR, T * 0.35);
        else if (pair === "bolt")       fBolt(j, c, A.cx, A.cy, B.cx, B.cy, sAvg, Math.max(6, Math.round(pd / (sAvg * 0.6))));
        else if (pair === "webpair")    fWeb(j, c, mx, my, Math.max(pd * 0.6, sAvg * 3));
        else if (pair === "ocean")      fWave(j, c, Math.max(10, A.cx - sAvg), Math.min(W - 10, B.cx + sAvg), A.cy - sAvg * 0.9, B.cy - sAvg * 0.9, sAvg * 0.55, sAvg * 0.35);
        else                            fGalaxy(j, c, W / 2, H / 2, H * 0.2);
      } else {
        var h = hands[gr], S = h.S, g = h.g;
        if (g === "open") fGalaxy(j, c, h.cx, h.cy, S);
        else if (g === "fist") fShield(j, c, h.cx, h.cy, S);
        else if (g === "point") fSquare(j, c, h);
        else if (g === "wings") fWingsSingle(j, c, h);
        else if (g === "tri") fTri(j, c, h);
        else if (g === "rock") {
          var Lb = Math.min(S * 7, Math.min(W, H) * 0.6);
          fBolt(j, c, h.cx, h.cy, h.cx + Math.cos(h.dir) * Lb, h.cy + Math.sin(h.dir) * Lb, S, 7);
        } else if (g === "ring") {
          fRing(j, c, h.cx, h.cy, pair === "rings" ? Math.max(S * 2.2, pd * 0.62) : S * 2.2);
        } else if (g === "sword") {
          if (pair === "cross") {
            var cdx = crossX - h.cx, cdy = crossY - h.cy;
            fSword(j, c, h.cx, h.cy, Math.atan2(cdy, cdx), Math.hypot(cdx, cdy) * 1.4, S);   // bilah saling menyilang
          } else {
            fSword(j, c, h.cx, h.cy, h.dir, Math.min(S * 8, Math.min(W, H) * 0.7), S);
          }
        } else if (g === "wave") {
          fWave(j, c, Math.max(10, h.cx - W * 0.32), Math.min(W - 10, h.cx + W * 0.32), h.cy - S * 0.9, h.cy - S * 0.9, S * 0.55, S * 0.35);
        } else if (g === "web") {
          fWeb(j, c, h.cx + Math.cos(h.dir) * S * 2.6, h.cy + Math.sin(h.dir) * S * 2.6, S * 2.2);
        } else if (g === "star") {
          fStar(j, c, h.cx + Math.cos(h.dir) * S * 2.6, h.cy + Math.sin(h.dir) * S * 2.6, S * 1.6, T * 0.4);
        } else if (g === "half") {
          var side2 = hc === 2 ? (gr === 0 ? 1 : 2) : (h.cx < W / 2 ? 1 : 2);
          var Hw = S * 2.2;
          fHeart(j, c, side2 === 1 ? h.cx + Hw * 0.5 : h.cx - Hw * 0.5, h.cy - S * 0.2, Hw, side2);
        } else fFan(j, c, h);

        /* ledakan saat kepalan dibuka cepat */
        if (burstHands[gr]) {
          var ba = Math.atan2(s.y - h.cy, s.x - h.cx) + (Math.random() - 0.5) * 0.6;
          var imp = (900 + Math.random() * 1800) * sc;
          s.vx += Math.cos(ba) * imp; s.vy += Math.sin(ba) * imp;
        }
      }

      /* pedang pindah grup (mis. ke tangan kedua): terbang melengkung */
      if (s.pg !== gr) {
        if (s.pg !== -1) {
          var mdx = O.x - s.x, mdy = O.y - s.y, mdl = Math.hypot(mdx, mdy) || 1;
          if (mdl > 100 * sc) {
            var sg = s.rf < 0.5 ? -1 : 1, mag = (300 + 400 * s.sz) * sc;
            s.vx += (-mdy / mdl) * sg * mag; s.vy += (mdx / mdl) * sg * mag;
          }
        }
        s.pg = gr;
      }

      /* pegas: pedang "mengejar" posisi bentuknya */
      var k = Math.min(700, s.k * O.k * kMul), damp = 2 * Math.sqrt(k) * 0.7;
      s.vx += ((O.x - s.x) * k - s.vx * damp) * dt;
      s.vy += ((O.y - s.y) * k - s.vy * damp) * dt;
      s.x += s.vx * dt; s.y += s.vy * dt;

      var desired;
      if (O.a !== null) desired = O.a;
      else {
        var v2 = s.vx * s.vx + s.vy * s.vy;
        desired = v2 > 400 ? Math.atan2(s.vy, s.vx) + Math.PI / 2 : s.a;
      }
      s.a = lerpAngle(s.a, desired, 1 - Math.exp(-rotRate * dt));

      /* gambar */
      var hgt = Math.max(8, (O.hs ? O.hs : BASE_H * sc * (0.9 + 0.2 * s.sz)) * sizeMul);
      var wid = hgt * 64 / 224;
      var kind = styleMode === "white" ? 0 : styleMode === "blue" ? 1 : styleMode === "red" ? 2
               : Math.min(2, Math.floor((j + 0.5) / c * 3));       // Mix = gradasi putih > biru > merah
      var co = Math.cos(s.a), si = Math.sin(s.a);
      ctx.globalAlpha = 0.9 * O.fade;
      ctx.setTransform(co * dpr, si * dpr, -si * dpr, co * dpr, s.x * dpr, s.y * dpr);
      ctx.drawImage(SPR[kind], -wid / 2, -hgt / 2, wid, hgt);
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 1;

    /* gelombang kejut (biru + merah) */
    for (var ri = rings.length - 1; ri >= 0; ri--) {
      var rg = rings[ri];
      rg.t += dt * 1.6;
      if (rg.t >= 1) { rings.splice(ri, 1); continue; }
      var rr = rg.t * 420 * sc + 20;
      ctx.strokeStyle = "rgba(110,190,255," + (1 - rg.t) + ")";
      ctx.lineWidth = 3 + (1 - rg.t) * 5;
      ctx.beginPath(); ctx.arc(rg.x, rg.y, rr, 0, 6.2832); ctx.stroke();
      ctx.strokeStyle = "rgba(255,60,80," + (1 - rg.t) * 0.85 + ")";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(rg.x, rg.y, rr * 0.82, 0, 6.2832); ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";

    /* label di dekat tangan + label bentuk gabungan */
    if (hc) {
      ctx.font = '600 12px "Courier New", monospace';
      ctx.textAlign = "center";
      for (var li = 0; li < hc; li++) {
        var hh = hands[li], gi = GINFO[hh.g];
        drawLabel(gi.n + "  //  " + gi.m, hh.cx, hh.cy + hh.S * 1.05);
      }
      if (pair) drawLabel("// " + pairName + " //", mx, Math.max(24, my - sAvg * 1.9));
    }

    updateHud(hc, pairName);
    requestAnimationFrame(frame);
  }

  function drawLabel(txt, x, y) {
    var tw = ctx.measureText(txt).width + 16;
    ctx.fillStyle = "rgba(0,0,0,.7)";
    ctx.fillRect(x - tw / 2, y - 12, tw, 20);
    ctx.strokeStyle = "rgba(255,70,90,.75)";
    ctx.strokeRect(x - tw / 2, y - 12, tw, 20);
    ctx.fillStyle = "#fff";
    ctx.fillText(txt, x, y + 2);
  }

  /* ---------- HUD ---------- */
  function updateHud(hc, pairName) {
    var html = '<span class="gm-pill">SWORDS <b>' + swords.length + '</b></span>';
    for (var i = 0; i < hc; i++) {
      html += '<span class="gm-pill">HAND ' + (i + 1) + ' <b>' + GINFO[hands[i].g].n + '</b></span>';
    }
    if (pairName) html += '<span class="gm-pill"><b>' + pairName + '</b></span>';
    var right = '<span class="gm-pill">FPS <b>' + Math.round(fps) + '</b></span>';
    var key = html + right;
    if (key !== lastHud) { lastHud = key; hudL.innerHTML = html; hudR.innerHTML = right; }
    hint.hidden = !(running && hc === 0);
  }

  /* ---------- kontrol ---------- */
  startBtn.addEventListener("click", startCamera);
  stopBtn.addEventListener("click", stopCamera);

  countRange.addEventListener("input", function () { setCount(parseInt(countRange.value, 10)); });
  sizeRange.addEventListener("input", function () {
    sizeMul = parseFloat(sizeRange.value);
    sizeVal.textContent = sizeMul.toFixed(1) + "x";
  });
  speedRange.addEventListener("input", function () {
    speedMul = parseFloat(speedRange.value);
    speedVal.textContent = speedMul.toFixed(1) + "x";
  });
  styleBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      styleBtns.forEach(function (x) { x.classList.remove("active"); });
      b.classList.add("active");
      styleMode = b.dataset.style;
    });
  });
  feedChk.addEventListener("change", function () { stage.classList.toggle("nofeed", !feedChk.checked); });

  fsBtn.addEventListener("click", function () {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    } else {
      (stage.requestFullscreen || stage.webkitRequestFullscreen).call(stage);
    }
  });

  shotBtn.addEventListener("click", function () {
    var out = document.createElement("canvas");
    out.width = cv.width; out.height = cv.height;
    var o = out.getContext("2d");
    o.fillStyle = "#000"; o.fillRect(0, 0, out.width, out.height);
    if (running && feedChk.checked) {
      o.save();
      o.translate((offX + vw * vsc) * dpr, offY * dpr);
      o.scale(-vsc * dpr, vsc * dpr);
      o.drawImage(video, 0, 0, vw, vh);
      o.restore();
    }
    o.drawImage(cv, 0, 0);
    var a = document.createElement("a");
    a.download = "sword-storm.png";
    a.href = out.toDataURL("image/png");
    a.click();
  });

  /* ---------- mulai ---------- */
  layout();
  setCount(1000);
  requestAnimationFrame(function (t) { last = t; requestAnimationFrame(frame); });
})();