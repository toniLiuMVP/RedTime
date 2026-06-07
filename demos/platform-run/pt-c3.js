// platform-run 外部化 inline script #3（CSP 撤 unsafe-inline）
/* C10:platform-run 新手引路 tutorial JS */
(function () {
/* TOUR_KEY removed (manual trigger, no first-time gating per review) */
const TOUR_STEPS = 4;
let currentStep = 1;

window.openPTTutorial = function (e) {
  if (e) { e.stopPropagation(); e.preventDefault(); }
  const overlay = document.getElementById("pt-tutorial");
  if (!overlay) return;
  overlay.hidden = false;
  currentStep = 1;
  updatePTTourStep();
  document.body.style.overflow = "hidden";
  setTimeout(function () {
    const closeBtn = overlay.querySelector(".pt-tutorial-close");
    if (closeBtn) closeBtn.focus();
  }, 50);
};

window.closePTTutorial = function (e) {
  if (e) { e.stopPropagation(); }
  const overlay = document.getElementById("pt-tutorial");
  if (!overlay) return;
  overlay.hidden = true;
  document.body.style.overflow = "";
  /* Codex: manual trigger, no first-time gating; localStorage 寫入移除 */
};

window.ptTourNext = function (e) {
  if (e) e.stopPropagation();
  if (currentStep < TOUR_STEPS) {
    currentStep++;
    updatePTTourStep();
  }
};

window.ptTourPrev = function (e) {
  if (e) e.stopPropagation();
  if (currentStep > 1) {
    currentStep--;
    updatePTTourStep();
  }
};

function updatePTTourStep() {
  const overlay = document.getElementById("pt-tutorial");
  if (!overlay) return;
  overlay.querySelectorAll(".pt-tutorial-step").forEach(function (s) {
    const n = parseInt(s.dataset.step, 10);
    s.classList.toggle("active", n === currentStep);
  });
  overlay.querySelectorAll(".pt-dot").forEach(function (d) {
    const n = parseInt(d.dataset.step, 10);
    d.classList.toggle("active", n === currentStep);
    d.classList.toggle("done", n < currentStep);
  });
  const prev = overlay.querySelector(".pt-btn-prev");
  const next = overlay.querySelector(".pt-btn-next");
  const indicator = overlay.querySelector(".pt-step-indicator");
  if (prev) prev.hidden = currentStep === 1;
  if (next) {
    if (currentStep === TOUR_STEPS) {
      next.textContent = "☆ OK 開始跑";
      next.onclick = function (e) { window.closePTTutorial(e); };
    } else {
      next.textContent = "下一步 →";
      next.onclick = function (e) { window.ptTourNext(e); };
    }
  }
  if (indicator) indicator.textContent = currentStep + " / " + TOUR_STEPS;
}

document.addEventListener("DOMContentLoaded", function () {
  document.addEventListener("keydown", function (e) {
    const overlay = document.getElementById("pt-tutorial");
    if (e.key === "Escape" && overlay && !overlay.hidden) {
      window.closePTTutorial();
    }
  });
  const overlay = document.getElementById("pt-tutorial");
  if (overlay) {
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) window.closePTTutorial();
    });
  }
});
})();

// CSP 收斂：tutorial 控制鈕改 addEventListener（取代 inline onclick）
(function () {
  function _wire(sel, fn) { var el = document.querySelector(sel); if (el) el.addEventListener("click", fn); }
  _wire("#pt-tutorial-trigger", function (e) { openPTTutorial(e); });
  _wire(".pt-tutorial-close", function (e) { closePTTutorial(e); });
  _wire(".pt-btn-prev", function (e) { ptTourPrev(e); });
  _wire(".pt-btn-next", function (e) { ptTourNext(e); });
  _wire(".pt-skip", function () { location.href = "../../reader.html#ep-36"; });
  _wire(".title-read", function (e) { e.stopPropagation(); });
})();
