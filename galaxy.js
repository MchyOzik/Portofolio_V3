/* Galaxy berputar: hitam putih + sedikit bintang merah (dipakai Home dan About) */
(function () {
  const canvas = document.getElementById("galaxy");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const useShooting = canvas.dataset.shooting === "true";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const whites = ["#ffffff", "#ffffff", "#e6e6e6", "#bdbdbd", "#8f8f8f"];
  const red = "#ff2a2a";

  let w, h, cx, cy;
  let stars = [];
  let shooting = [];
  let rot = 0, mx = 0, my = 0;

  function build() {
    const count = w < 700 ? 450 : (useShooting ? 1100 : 850);
    const maxR = Math.hypot(w, h) / 2;
    stars = [];
    for (let i = 0; i < count; i++) {
      const arm = i % 3;
      const r = Math.pow(Math.random(), 0.7) * maxR;
      const spread = (Math.random() - 0.5) * 0.9;
      const isRed = Math.random() < 0.07;          // ~7% bintang merah
      stars.push({
        r: r,
        a: (arm / 3) * Math.PI * 2 + r * 0.004 + spread,
        size: Math.random() * 1.6 + 0.3,
        tw: Math.random() * Math.PI * 2,
        sp: Math.random() * 0.03 + 0.01,
        c: isRed ? red : whites[Math.floor(Math.random() * whites.length)],
        red: isRed
      });
    }
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = w / 2;
    cy = h / 2;
    build();
  }

  if (useShooting) {
    window.addEventListener("mousemove", function (e) {
      mx = (e.clientX / w - 0.5) * 20;
      my = (e.clientY / h - 0.5) * 20;
    });
  }

  function frame() {
    ctx.clearRect(0, 0, w, h);

    // inti galaxy: merah gelap + putih redup
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.55);
    g.addColorStop(0, "rgba(255,255,255,.06)");
    g.addColorStop(0.35, "rgba(160,0,25,.10)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    if (!reduce) rot += 0.00035;

    for (const s of stars) {
      const ang = s.a + rot * (1 + 40 / (s.r + 40));
      const x = cx + Math.cos(ang) * s.r + mx * (s.size * 0.4);
      const y = cy + Math.sin(ang) * s.r * 0.75 + my * (s.size * 0.4);
      s.tw += s.sp;
      ctx.globalAlpha = 0.4 + Math.sin(s.tw) * 0.5;
      ctx.fillStyle = s.c;
      ctx.shadowBlur = s.size > 1.4 ? 8 : 0;       // bintang besar bersinar
      ctx.shadowColor = s.red ? "rgba(255,30,50,.9)" : "rgba(255,255,255,.9)";
      ctx.beginPath();
      ctx.arc(x, y, s.size, 0, 6.2832);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    // bintang jatuh (khusus Home)
    if (useShooting && !reduce) {
      if (Math.random() < 0.006) {
        shooting.push({ x: Math.random() * w, y: Math.random() * h * 0.5, l: 0, v: 8 + Math.random() * 6 });
      }
      for (let i = shooting.length - 1; i >= 0; i--) {
        const s = shooting[i];
        s.x += s.v;
        s.y += s.v * 0.5;
        s.l++;
        const grad = ctx.createLinearGradient(s.x, s.y, s.x - 90, s.y - 45);
        grad.addColorStop(0, "rgba(255,255,255,.95)");
        grad.addColorStop(0.5, "rgba(255,40,60,.5)");
        grad.addColorStop(1, "rgba(255,0,0,0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - 90, s.y - 45);
        ctx.stroke();
        if (s.l > 50) shooting.splice(i, 1);
      }
    }

    requestAnimationFrame(frame);
  }

  window.addEventListener("resize", resize);
  resize();
  frame();
})();