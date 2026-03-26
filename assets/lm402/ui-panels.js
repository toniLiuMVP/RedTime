/**
 * LM402 unified floating panel system.
 * - Transcript: desktop/mobile drag, resize, maximize, reset
 * - Objective / hint / focus / ambience / subtitle / cinematic subtitle: drag
 * - Layouts are stored per viewport bucket so desktop does not inherit mobile values.
 */

const STORAGE_KEY = "lm402_panel_layouts_v2";
const STORAGE_VERSION = 2;
const MOBILE_BREAKPOINT = 800;
const registry = new Map();

let initialized = false;
let globalPointerCleanupAttached = false;
let rafSync = 0;

const activeGesture = {
  panelId: null,
  pointerId: null,
  mode: null,
  started: false,
  startX: 0,
  startY: 0,
  originX: 0,
  originY: 0,
  originW: 0,
  originH: 0,
};

if (typeof window !== "undefined") {
  window.__LM402_PANEL_SYSTEM_ACTIVE__ = true;
}
if (typeof document !== "undefined" && document?.documentElement) {
  document.documentElement.dataset.lm402PanelSystem = "active";
}

function isMobile() {
  return window.innerWidth < MOBILE_BREAKPOINT;
}

function getViewportBucket() {
  if (!isMobile()) return "desktop";
  return window.innerWidth >= window.innerHeight
    ? "mobile_landscape"
    : "mobile_portrait";
}

function readStore() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(payload) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {}
}

function getBucketPayload(store = readStore()) {
  const bucket = getViewportBucket();
  const entry = store[bucket];
  if (!entry || entry.version !== STORAGE_VERSION) {
    return { bucket, panels: {} };
  }
  return { bucket, panels: entry.panels || {} };
}

function saveLayouts() {
  const store = readStore();
  const bucket = getViewportBucket();
  const panels = {};
  registry.forEach((panel, id) => {
    if (!panel.state.pos && !panel.state.size && !panel.state.maximized) return;
    panels[id] = {};
    if (panel.state.pos) {
      panels[id].x = Math.round(panel.state.pos.x);
      panels[id].y = Math.round(panel.state.pos.y);
    }
    if (panel.state.size) {
      panels[id].w = Math.round(panel.state.size.w);
      panels[id].h = Math.round(panel.state.size.h);
    }
    if (panel.state.maximized) {
      panels[id].maximized = true;
    }
  });
  store[bucket] = {
    version: STORAGE_VERSION,
    panels,
  };
  writeStore(store);
}

function getViewportPadding() {
  return isMobile() ? 12 : 18;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function clampRect(x, y, width, height) {
  const pad = getViewportPadding();
  const safeWidth = Math.min(width, Math.max(120, window.innerWidth - pad * 2));
  const safeHeight = Math.min(
    height,
    Math.max(72, window.innerHeight - pad * 2),
  );
  return {
    x: clamp(Math.round(x), pad, Math.max(pad, window.innerWidth - safeWidth - pad)),
    y: clamp(Math.round(y), pad, Math.max(pad, window.innerHeight - safeHeight - pad)),
    width: Math.round(safeWidth),
    height: Math.round(safeHeight),
  };
}

function currentRect(el) {
  const rect = el.getBoundingClientRect();
  return {
    x: Math.round(rect.left),
    y: Math.round(rect.top),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
}

function transcriptDefaultRect(el) {
  const pad = getViewportPadding();
  const measured = currentRect(el);
  const width = clamp(
    measured.width || (isMobile() ? window.innerWidth * 0.84 : 420),
    isMobile() ? 280 : 320,
    Math.max(320, window.innerWidth - pad * 2),
  );
  const height = clamp(
    measured.height || (isMobile() ? window.innerHeight * 0.34 : 240),
    isMobile() ? 186 : 180,
    Math.max(180, window.innerHeight - pad * 2),
  );
  const top = isMobile()
    ? Math.max(pad, Math.round(window.innerHeight - height - 132))
    : Math.max(pad, Math.round(window.innerHeight - height - 36));
  return clampRect(
    isMobile() ? Math.round((window.innerWidth - width) / 2) : 24,
    top,
    width,
    height,
  );
}

function genericDefaultRect(el) {
  const rect = currentRect(el);
  if (!rect.width || !rect.height) {
    const fallbackWidth = Math.min(360, window.innerWidth - getViewportPadding() * 2);
    return clampRect(
      getViewportPadding(),
      getViewportPadding(),
      fallbackWidth,
      64,
    );
  }
  return clampRect(rect.x, rect.y, rect.width, rect.height);
}

function ensureTranscriptControls(panel) {
  const { el, handle } = panel;
  el.classList.add("ui-panel-managed", "ui-draggable", "ui-resizable");
  handle?.classList.add("ui-drag-handle");

  if (!panel.maxButton) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ui-max-btn";
    btn.textContent = "⤢";
    btn.title = "放大 / 還原";
    btn.setAttribute("aria-label", "放大或還原文字視窗");
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleTranscriptMaximize(panel.id);
    });
    el.appendChild(btn);
    panel.maxButton = btn;
  }

  if (!panel.resizeHandle) {
    const resizeHandle =
      document.getElementById("transcript-resize-handle") ||
      document.createElement("div");
    resizeHandle.classList.add("transcript-resize-handle");
    resizeHandle.setAttribute("aria-hidden", "true");
    if (!resizeHandle.parentElement) el.appendChild(resizeHandle);
    panel.resizeHandle = resizeHandle;
  }

  if (panel.resetButton) {
    panel.resetButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      resetPanelLayout(panel.id);
    });
  }
}

function applyElementRect(el, rect, panel) {
  el.style.position = "fixed";
  el.style.left = `${rect.x}px`;
  el.style.top = `${rect.y}px`;
  el.style.right = "auto";
  el.style.bottom = "auto";
  el.style.transform = "none";
  if (panel.resizable) {
    el.style.width = `${rect.width}px`;
    el.style.maxWidth = `${rect.width}px`;
    if (!panel.isCollapsed?.()) {
      el.style.height = `${rect.height}px`;
      el.style.maxHeight = `${rect.height}px`;
    } else {
      el.style.height = "auto";
      el.style.maxHeight = "none";
    }
  }
  el.classList.add("ui-has-pos");
}

function syncTranscriptInternals(panel) {
  const box = panel.box;
  const list = panel.list;
  if (!box || !list) return;
  if (panel.isCollapsed?.()) {
    panel.el.style.height = "auto";
    panel.el.style.maxHeight = "none";
    box.style.maxHeight = "";
    box.style.height = "";
    list.style.maxHeight = "";
    return;
  }

  const hostHeight =
    panel.state.size?.h ||
    panel.el.getBoundingClientRect().height ||
    transcriptDefaultRect(panel.el).height;
  const handleHeight = panel.handle?.getBoundingClientRect().height || 0;
  const toggleHeight = panel.toggle?.getBoundingClientRect().height || 0;
  const chrome = handleHeight + toggleHeight + 26;
  const boxHeight = Math.max(96, Math.round(hostHeight - chrome));
  const listHeight = Math.max(72, boxHeight - 42);

  panel.el.style.height = `${Math.round(hostHeight)}px`;
  panel.el.style.maxHeight = `${Math.round(hostHeight)}px`;
  box.style.maxHeight = `${boxHeight}px`;
  box.style.height = `${boxHeight}px`;
  box.style.minHeight = "0";
  list.style.maxHeight = `${listHeight}px`;
  list.style.minHeight = "0";
  list.style.overflowY = "auto";
}

function loadLayoutIntoState(panel) {
  const { panels } = getBucketPayload();
  const saved = panels[panel.id];
  if (!saved || typeof saved !== "object") return;
  if (Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
    panel.state.pos = { x: saved.x, y: saved.y };
  }
  if (panel.resizable && Number.isFinite(saved.w) && Number.isFinite(saved.h)) {
    panel.state.size = { w: saved.w, h: saved.h };
  }
  panel.state.maximized = saved.maximized === true;
}

function getPanelRect(panel) {
  const baseRect =
    panel.resizable && panel.state.size
      ? {
          width: panel.state.size.w,
          height: panel.state.size.h,
        }
      : currentRect(panel.el);
  const fallback = panel.getDefaultRect(panel.el);
  const pos = panel.state.pos || { x: fallback.x, y: fallback.y };
  const width = panel.resizable
    ? panel.state.size?.w || fallback.width
    : baseRect.width || fallback.width;
  const height = panel.resizable
    ? panel.state.size?.h || fallback.height
    : baseRect.height || fallback.height;
  return clampRect(pos.x, pos.y, width, height);
}

function maximizeTranscript(panel) {
  const pad = getViewportPadding();
  const target = clampRect(
    pad,
    pad,
    window.innerWidth - pad * 2,
    window.innerHeight - pad * 2,
  );
  panel.state.restorePos = panel.state.pos
    ? { ...panel.state.pos }
    : { x: target.x, y: target.y };
  panel.state.restoreSize = panel.state.size
    ? { ...panel.state.size }
    : { w: target.width, h: target.height };
  panel.state.pos = { x: target.x, y: target.y };
  panel.state.size = { w: target.width, h: target.height };
  panel.state.maximized = true;
  applyPanelLayout(panel);
  saveLayouts();
}

function restoreTranscript(panel) {
  const fallback = transcriptDefaultRect(panel.el);
  panel.state.pos = panel.state.restorePos || { x: fallback.x, y: fallback.y };
  panel.state.size = panel.state.restoreSize || {
    w: fallback.width,
    h: fallback.height,
  };
  panel.state.maximized = false;
  applyPanelLayout(panel);
  saveLayouts();
}

function toggleTranscriptMaximize(id = "transcript") {
  const panel = registry.get(id);
  if (!panel) return;
  if (panel.state.maximized) restoreTranscript(panel);
  else maximizeTranscript(panel);
}

function applyPanelLayout(panel) {
  if (!panel?.el) return;
  const rect = getPanelRect(panel);
  panel.state.pos = { x: rect.x, y: rect.y };
  if (panel.resizable) {
    panel.state.size = { w: rect.width, h: rect.height };
  }
  applyElementRect(panel.el, rect, panel);
  panel.maxButton &&
    (panel.maxButton.textContent = panel.state.maximized ? "⤡" : "⤢");
  if (panel.resizable) {
    syncTranscriptInternals(panel);
  }
}

function resetPanelLayout(id) {
  const panel = registry.get(id);
  if (!panel) return;
  panel.state.pos = null;
  panel.state.size = null;
  panel.state.maximized = false;
  panel.state.restorePos = null;
  panel.state.restoreSize = null;
  if (panel.resizable) {
    panel.el.style.width = "";
    panel.el.style.height = "";
    panel.el.style.maxHeight = "";
    panel.el.style.maxWidth = "";
  }
  panel.el.style.position = "";
  panel.el.style.left = "";
  panel.el.style.top = "";
  panel.el.style.right = "";
  panel.el.style.bottom = "";
  panel.el.style.transform = "";
  panel.el.classList.remove("ui-has-pos");
  if (panel.box) {
    panel.box.style.maxHeight = "";
    panel.box.style.height = "";
  }
  if (panel.list) {
    panel.list.style.maxHeight = "";
  }
  applyPanelLayout(panel);
  saveLayouts();
}

function attachGlobalPointerCleanup() {
  if (globalPointerCleanupAttached) return;
  globalPointerCleanupAttached = true;

  const finishGesture = () => {
    if (!activeGesture.panelId) return;
    const panel = registry.get(activeGesture.panelId);
    if (panel?.handle?.releasePointerCapture && activeGesture.pointerId != null) {
      try {
        panel.handle.releasePointerCapture(activeGesture.pointerId);
      } catch {}
    }
    if (panel?.resizeHandle?.releasePointerCapture && activeGesture.pointerId != null) {
      try {
        panel.resizeHandle.releasePointerCapture(activeGesture.pointerId);
      } catch {}
    }
    panel?.el?.classList.remove("ui-dragging");
    activeGesture.panelId = null;
    activeGesture.pointerId = null;
    activeGesture.mode = null;
    activeGesture.started = false;
    saveLayouts();
  };

  window.addEventListener("pointerup", finishGesture);
  window.addEventListener("pointercancel", finishGesture);
  window.addEventListener("pointermove", (event) => {
    if (!activeGesture.panelId) return;
    const panel = registry.get(activeGesture.panelId);
    if (!panel) return;

    if (!activeGesture.started) {
      const distance = Math.hypot(
        event.clientX - activeGesture.startX,
        event.clientY - activeGesture.startY,
      );
      if (distance < 4) return;
      activeGesture.started = true;
      panel.el.classList.add("ui-dragging");
    }

    event.preventDefault();
    if (activeGesture.mode === "drag") {
      const rect = panel.resizable
        ? {
            width: panel.state.size?.w || transcriptDefaultRect(panel.el).width,
            height: panel.isCollapsed?.()
              ? currentRect(panel.el).height
              : panel.state.size?.h || transcriptDefaultRect(panel.el).height,
          }
        : currentRect(panel.el);
      const next = clampRect(
        activeGesture.originX + (event.clientX - activeGesture.startX),
        activeGesture.originY + (event.clientY - activeGesture.startY),
        rect.width,
        rect.height,
      );
      panel.state.pos = { x: next.x, y: next.y };
      applyPanelLayout(panel);
      return;
    }

    if (activeGesture.mode === "resize" && panel.resizable) {
      const minW = panel.minW ?? 300;
      const minH = panel.minH ?? 180;
      const maxW = window.innerWidth - getViewportPadding() * 2;
      const maxH = window.innerHeight - getViewportPadding() * 2;
      const nextRect = clampRect(
        panel.state.pos?.x ?? activeGesture.originX,
        panel.state.pos?.y ?? activeGesture.originY,
        clamp(
          activeGesture.originW + (event.clientX - activeGesture.startX),
          minW,
          maxW,
        ),
        clamp(
          activeGesture.originH + (event.clientY - activeGesture.startY),
          minH,
          maxH,
        ),
      );
      panel.state.size = { w: nextRect.width, h: nextRect.height };
      if (!panel.state.pos) {
        panel.state.pos = { x: nextRect.x, y: nextRect.y };
      }
      panel.state.maximized = false;
      applyPanelLayout(panel);
    }
  });
}

function beginGesture(panel, event, mode) {
  if (!panel?.el || event.button > 0) return;
  if (event.target.closest("button")) return;
  activeGesture.panelId = panel.id;
  activeGesture.pointerId = event.pointerId;
  activeGesture.mode = mode;
  activeGesture.started = false;
  activeGesture.startX = event.clientX;
  activeGesture.startY = event.clientY;
  const rect = currentRect(panel.el);
  activeGesture.originX = rect.x;
  activeGesture.originY = rect.y;
  activeGesture.originW = rect.width;
  activeGesture.originH = rect.height;

  const captureTarget = mode === "resize" ? panel.resizeHandle : panel.handle;
  if (captureTarget?.setPointerCapture) {
    try {
      captureTarget.setPointerCapture(event.pointerId);
    } catch {}
  }
}

function registerPanel(id, config) {
  const el = config.element;
  if (!el) return null;

  const existing = registry.get(id);
  if (existing) return existing;

  const panel = {
    id,
    el,
    handle: config.handle || el,
    box: config.box || null,
    list: config.list || null,
    toggle: config.toggle || null,
    resetButton: config.resetButton || null,
    resizeHandle: config.resizeHandle || null,
    resizable: Boolean(config.resizable),
    minW: config.minW,
    minH: config.minH,
    getDefaultRect: config.getDefaultRect || genericDefaultRect,
    isCollapsed:
      config.isCollapsed ||
      (() =>
        Boolean(config.toggle?.getAttribute("aria-expanded") === "false") ||
        Boolean(config.box?.hidden)),
    state: {
      pos: null,
      size: null,
      maximized: false,
      restorePos: null,
      restoreSize: null,
    },
  };

  loadLayoutIntoState(panel);

  panel.handle?.classList.add("ui-drag-handle");
  panel.handle?.addEventListener("pointerdown", (event) => {
    beginGesture(panel, event, "drag");
  });

  if (panel.resizable) {
    ensureTranscriptControls(panel);
    panel.resizeHandle?.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      beginGesture(panel, event, "resize");
    });
  }

  registry.set(id, panel);
  applyPanelLayout(panel);
  return panel;
}

function queueSync() {
  if (rafSync) return;
  rafSync = window.requestAnimationFrame(() => {
    rafSync = 0;
    syncPanelSystem();
  });
}

export function syncPanelSystem() {
  registry.forEach((panel) => {
    if (!panel.el) return;
    applyPanelLayout(panel);
  });
  saveLayouts();
}

export function getPanelDebugSnapshot() {
  const snapshot = {};
  registry.forEach((panel, id) => {
    snapshot[id] = {
      x: panel.state.pos?.x ?? null,
      y: panel.state.pos?.y ?? null,
      w: panel.state.size?.w ?? null,
      h: panel.state.size?.h ?? null,
      maximized: Boolean(panel.state.maximized),
      visible: !panel.el.hidden,
    };
  });
  return {
    bucket: getViewportBucket(),
    panels: snapshot,
  };
}

export function initPanelSystem() {
  attachGlobalPointerCleanup();

  if (!initialized) {
    registerPanel("transcript", {
      element: document.getElementById("transcript-dock"),
      handle: document.getElementById("transcript-dock-bar"),
      toggle: document.getElementById("transcript-toggle"),
      box: document.getElementById("transcript-box"),
      list: document.getElementById("transcript-list"),
      resetButton: document.getElementById("transcript-dock-reset"),
      resizeHandle: document.getElementById("transcript-resize-handle"),
      resizable: true,
      minW: 300,
      minH: 180,
      getDefaultRect: transcriptDefaultRect,
    });

    registerPanel("objective", {
      element: document.getElementById("objective-prompt"),
      handle:
        document.getElementById("objective-kicker") ||
        document.getElementById("objective-prompt"),
    });

    registerPanel("hint", {
      element: document.getElementById("hint-pill"),
    });

    registerPanel("focus", {
      element: document.getElementById("focus-prompt"),
    });

    registerPanel("ambience", {
      element: document.getElementById("ambience-box"),
    });

    registerPanel("subtitle", {
      element: document.getElementById("subtitle-box"),
    });

    registerPanel("cinematicSubtitle", {
      element:
        document.querySelector("#cinematic-subtitle-layer .cinematic-subtitle-card"),
    });

    initialized = true;
  }

  queueSync();

  const api = {
    managesTranscript: true,
    sync: syncPanelSystem,
    getLayouts: getPanelDebugSnapshot,
    reset: resetPanelLayout,
    toggleTranscriptMaximize,
  };
  window.__LM402_PANEL_SYSTEM__ = api;

  window.addEventListener("resize", queueSync, { passive: true });
  window.visualViewport?.addEventListener("resize", queueSync, { passive: true });

  return api;
}
