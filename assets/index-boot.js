// RedTime index.html page boot
// 抽自 index.html line 2818-3042 inline script(round 26 CSP 收斂)
// 對應 § 安全紀律補強 #2:CSP 'unsafe-inline' 收斂(index.html script-src 'self' only)

// NAV scroll
window.addEventListener(
  "scroll",
  () => {
    document
      .getElementById("nav")
      .classList.toggle("scrolled", window.scrollY > 40);
  },
  { passive: true },
);

// Reveal on scroll
const ro = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        ro.unobserve(e.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -60px 0px" },
);
document.querySelectorAll(".reveal").forEach((el) => ro.observe(el));

// Homepage font scale
(() => {
  const KEY = "redtime_home_font_scale_v1";
  const LEVELS = {
    small: 0.92,
    medium: 1,
    large: 1.08,
    xlarge: 1.16,
    xxlarge: 1.24,
  };
  const buttons = Array.from(
    document.querySelectorAll("[data-font-scale]"),
  );
  const applyScale = (level) => {
    const scale = LEVELS[level] || LEVELS.medium;
    document.body.dataset.fontScale = level;
    document.documentElement.style.setProperty(
      "--page-font-scale",
      String(scale),
    );
    document.body.style.zoom = String(scale);
    buttons.forEach((button) => {
      button.classList.toggle(
        "active",
        button.dataset.fontScale === level,
      );
    });
  };
  let saved = "medium";
  try {
    saved = localStorage.getItem(KEY) || "medium";
  } catch {}
  applyScale(saved);
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const level = button.dataset.fontScale || "medium";
      try {
        localStorage.setItem(KEY, level);
      } catch {}
      applyScale(level);
    });
  });
})();

// Hero particle canvas — with red thread of fate
(function () {
  var cvs = document.getElementById("hero-canvas"),
    ctx = cvs.getContext("2d");
  var W, H, pts = [], frame = 0;
  var COLS = [
    "#16a864","#c89010","#a8a49c","#b84820",
    "#3880ff","#9040f0","#ff4858","#e8cc10"
  ];

  // Red thread control points (normalized 0-1)
  var threadSeeds = [];
  for (var i = 0; i < 7; i++) {
    threadSeeds.push({
      nx: 0.08 + i * 0.14,
      ny: 0.35 + (i % 2 === 0 ? -0.12 : 0.12) + Math.random() * 0.06,
      phase: Math.random() * Math.PI * 2,
      amp: 8 + Math.random() * 14
    });
  }

  function resize() {
    W = cvs.width = cvs.offsetWidth;
    H = cvs.height = cvs.offsetHeight;
  }

  // Get thread point at normalized position t (0..1)
  function threadY(t, time) {
    var baseY = H * 0.48;
    var wave = Math.sin(t * Math.PI * 2.2 + time * 0.3) * H * 0.06;
    var drift = Math.sin(t * Math.PI * 1.1 + time * 0.15) * H * 0.03;
    return baseY + wave + drift;
  }

  function drawThread(time) {
    var segments = 120;
    var breathe = 0.5 + 0.5 * Math.sin(time * 0.4);

    // Outer glow
    ctx.save();
    ctx.globalAlpha = 0.06 + breathe * 0.04;
    ctx.strokeStyle = "#ff4858";
    ctx.lineWidth = 12;
    ctx.shadowColor = "#ff4858";
    ctx.shadowBlur = 40;
    ctx.beginPath();
    for (var i = 0; i <= segments; i++) {
      var t = i / segments;
      var x = t * W;
      var y = threadY(t, time);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    // Core line
    ctx.save();
    ctx.globalAlpha = 0.12 + breathe * 0.08;
    ctx.strokeStyle = "#ff6080";
    ctx.lineWidth = 1.2;
    ctx.shadowColor = "#ff4858";
    ctx.shadowBlur = 16;
    ctx.beginPath();
    for (var i = 0; i <= segments; i++) {
      var t = i / segments;
      var x = t * W;
      var y = threadY(t, time);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    // Sparkle nodes along thread
    for (var i = 0; i < 5; i++) {
      var st = (i + 1) / 6;
      var sparklePhase = time * 0.8 + i * 1.3;
      var sparkleAlpha = 0.15 + 0.25 * Math.pow(Math.sin(sparklePhase), 2);
      var sx = st * W;
      var sy = threadY(st, time);
      ctx.save();
      ctx.globalAlpha = sparkleAlpha;
      ctx.fillStyle = "#ff8fa0";
      ctx.shadowColor = "#ff4858";
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(sx, sy, 2 + Math.sin(sparklePhase) * 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function mkP() {
    // 20% of particles are born near the red thread
    var nearThread = Math.random() < 0.2;
    var px, py;
    if (nearThread && W && H) {
      var t = Math.random();
      px = t * W;
      py = threadY(t, frame * 0.016) + (Math.random() - 0.5) * 60;
    } else {
      px = Math.random() * W;
      py = Math.random() * H;
    }
    var isRed = nearThread && Math.random() < 0.5;
    return {
      x: px, y: py,
      r: Math.random() * 1.8 + 0.2,
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.12,
      c: isRed ? "#ff4858" : COLS[Math.floor(Math.random() * COLS.length)],
      a: isRed ? Math.random() * 0.3 + 0.12 : Math.random() * 0.35 + 0.04,
      life: Math.random() * 320 + 120,
      age: 0
    };
  }
  for (var i = 0; i < 150; i++) pts.push(mkP());

  function draw() {
    frame++;
    /* 當 hero 完全滾出視野時暫停繪製，節省 CPU/電池 */
    if (cvs.getBoundingClientRect().bottom < 0) {
      requestAnimationFrame(draw);
      return;
    }
    var time = frame * 0.016;
    ctx.clearRect(0, 0, W, H);

    // Draw the red thread behind particles
    drawThread(time);

    // Draw particles
    pts = pts.filter(function(p) {
      p.x += p.vx;
      p.y += p.vy;
      p.age++;
      var f = Math.min(p.age / 40, 1) *
              Math.min(1 - (p.age - p.life + 40) / 40, 1);
      if (f <= 0) return false;
      ctx.globalAlpha = p.a * f;
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      return true;
    });
    while (pts.length < 150) pts.push(mkP());
    requestAnimationFrame(draw);
  }
  resize();
  draw();
  window.addEventListener("resize", resize, { passive: true });
})();
