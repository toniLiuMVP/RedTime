// lm402.html inline classic #8 外部化（CSP 撤 unsafe-inline）
/* C10:LM402 新手引路 tutorial JS(對位 modal 紀律) */
(function () {
const TOUR_KEY = "redtime_lm402_newcomer_done";
const TOUR_STEPS = 5;
let currentStep = 1;

window.openLM402Tutorial = function () {
  const overlay = document.getElementById("lm402-tutorial");
  if (!overlay) return;
  overlay.hidden = false;
  currentStep = 1;
  updateLM402TourStep();
  document.body.style.overflow = "hidden";
  setTimeout(function () {
const closeBtn = overlay.querySelector(".lm402-tutorial-close");
if (closeBtn) closeBtn.focus();
  }, 50);
};

window.closeLM402Tutorial = function () {
  const overlay = document.getElementById("lm402-tutorial");
  if (!overlay) return;
  overlay.hidden = true;
  document.body.style.overflow = "";
  try { localStorage.setItem(TOUR_KEY, "1"); } catch (e) {}
};

window.lm402TourNext = function () {
  if (currentStep < TOUR_STEPS) {
currentStep++;
updateLM402TourStep();
  }
};

window.lm402TourPrev = function () {
  if (currentStep > 1) {
currentStep--;
updateLM402TourStep();
  }
};

function updateLM402TourStep() {
  const overlay = document.getElementById("lm402-tutorial");
  if (!overlay) return;
  overlay.querySelectorAll(".lm402-tutorial-step").forEach(function (s) {
const n = parseInt(s.dataset.step, 10);
s.classList.toggle("active", n === currentStep);
  });
  overlay.querySelectorAll(".lt-dot").forEach(function (d) {
const n = parseInt(d.dataset.step, 10);
d.classList.toggle("active", n === currentStep);
d.classList.toggle("done", n < currentStep);
  });
  const prev = overlay.querySelector(".lt-btn-prev");
  const next = overlay.querySelector(".lt-btn-next");
  const indicator = overlay.querySelector(".lt-step-indicator");
  if (prev) prev.hidden = currentStep === 1;
  if (next) {
if (currentStep === TOUR_STEPS) {
  next.textContent = "☆ 開始玩 →";
  next.onclick = function () { window.closeLM402Tutorial(); };
} else {
  next.textContent = "下一步 →";
  next.onclick = function () { window.lm402TourNext(); };
}
  }
  if (indicator) {
indicator.textContent = currentStep + " / " + TOUR_STEPS;
  }
}

document.addEventListener("DOMContentLoaded", function () {
  document.addEventListener("keydown", function (e) {
const overlay = document.getElementById("lm402-tutorial");
if (e.key === "Escape" && overlay && !overlay.hidden) {
  window.closeLM402Tutorial();
}
  });
  const overlay = document.getElementById("lm402-tutorial");
  if (overlay) {
overlay.addEventListener("click", function (e) {
  if (e.target === overlay) window.closeLM402Tutorial();
});
  }
});
})();
