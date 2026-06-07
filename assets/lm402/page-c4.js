// lm402.html inline classic #4 外部化（CSP 撤 unsafe-inline）
// Cinematic letterbox observer — watches intro/ending state to toggle bars
(function () {
  var body = document.body;
  var introFx = document.getElementById("intro-fx");
  var endingOverlay = document.getElementById("ending-overlay");

  function updateCinematic() {
var introActive = introFx && introFx.classList.contains("intro-fx-active");
var endingVisible = endingOverlay && !endingOverlay.hidden;
if (introActive || endingVisible) {
  body.classList.add("cinematic-mode");
} else {
  body.classList.remove("cinematic-mode");
}
  }

  // Observe intro-fx class changes
  if (introFx) {
new MutationObserver(updateCinematic).observe(introFx, { attributes: true, attributeFilter: ["class"] });
  }
  // Observe ending-overlay hidden attribute
  if (endingOverlay) {
new MutationObserver(updateCinematic).observe(endingOverlay, { attributes: true, attributeFilter: ["hidden"] });
  }

  updateCinematic();
})();
