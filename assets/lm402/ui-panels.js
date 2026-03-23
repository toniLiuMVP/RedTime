/**
 * LM402 Draggable & Resizable UI Panel System
 * Desktop-only: floating panels can be freely repositioned
 * Transcript panel is resizable with one-click maximize/minimize
 */

const STORAGE_KEY = 'lm402_panel_positions_v1';
const isMobile = () => window.innerWidth < 800;
const panels = new Map();

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}

function save() {
  const data = {};
  panels.forEach((cfg, id) => {
    if (cfg.pos) {
      data[id] = { x: cfg.pos.x, y: cfg.pos.y };
      if (cfg.size) { data[id].w = cfg.size.w; data[id].h = cfg.size.h; }
    }
  });
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

function clamp(x, y, el) {
  const r = el.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(x, window.innerWidth - Math.min(r.width, window.innerWidth))),
    y: Math.max(0, Math.min(y, window.innerHeight - Math.min(r.height, window.innerHeight)))
  };
}

function applyPos(el, cfg) {
  if (!cfg.pos) return;
  el.style.position = 'fixed';
  el.style.left = cfg.pos.x + 'px';
  el.style.top = cfg.pos.y + 'px';
  el.style.right = 'auto';
  el.style.bottom = 'auto';
  el.style.transform = 'none';
  el.classList.add('ui-has-pos');
}

function resetPos(el, cfg) {
  cfg.pos = null; cfg.size = null;
  el.style.cssText = '';
  el.classList.remove('ui-has-pos');
  save();
}

function makeDraggable(el, handle, id) {
  if (!el || !handle) return;
  const cfg = { pos: null, size: null };
  panels.set(id, cfg);

  const saved = load()[id];
  if (saved?.x !== undefined) {
    cfg.pos = { x: saved.x, y: saved.y };
    applyPos(el, cfg);
    if (saved.w) { cfg.size = { w: saved.w, h: saved.h }; el.style.width = saved.w + 'px'; }
    if (saved.h) { el.style.height = saved.h + 'px'; el.style.maxHeight = saved.h + 'px'; }
  }

  el.classList.add('ui-draggable');
  handle.classList.add('ui-drag-handle');

  // Reset button
  const rb = document.createElement('button');
  rb.className = 'ui-reset-btn'; rb.textContent = '↺'; rb.title = '重設位置';
  rb.onclick = (e) => { e.stopPropagation(); resetPos(el, cfg); };
  el.appendChild(rb);

  let sx, sy, sl, st, dragging = false;
  handle.addEventListener('pointerdown', (e) => {
    if (isMobile() || e.button !== 0) return;
    e.preventDefault(); dragging = true; el.classList.add('ui-dragging');
    const r = el.getBoundingClientRect();
    sx = e.clientX; sy = e.clientY; sl = r.left; st = r.top;
    handle.setPointerCapture(e.pointerId);
  });
  handle.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    cfg.pos = clamp(sl + e.clientX - sx, st + e.clientY - sy, el);
    applyPos(el, cfg);
  });
  handle.addEventListener('pointerup', () => {
    if (!dragging) return;
    dragging = false; el.classList.remove('ui-dragging'); save();
  });
  return cfg;
}

function makeResizable(el, id, { minW = 280, minH = 120, maxW = 900, maxH = 700 } = {}) {
  if (!el) return;
  const h = document.createElement('div');
  h.className = 'ui-resize-handle'; el.appendChild(h);

  const mb = document.createElement('button');
  mb.className = 'ui-max-btn'; mb.innerHTML = '⤢'; mb.title = '放大 / 縮小';
  let maximized = false, pre = null;
  mb.onclick = (e) => {
    e.stopPropagation();
    const cfg = panels.get(id);
    if (maximized) {
      if (pre) { el.style.width = pre.w + 'px'; el.style.height = pre.h + 'px'; el.style.maxHeight = pre.h + 'px'; if (cfg) cfg.size = pre; }
      mb.innerHTML = '⤢'; maximized = false;
    } else {
      const r = el.getBoundingClientRect();
      pre = { w: r.width, h: r.height };
      const fw = Math.min(maxW, window.innerWidth - 40);
      const fh = Math.min(maxH, window.innerHeight - 40);
      el.style.width = fw + 'px'; el.style.height = fh + 'px'; el.style.maxHeight = fh + 'px';
      if (cfg) cfg.size = { w: fw, h: fh };
      mb.innerHTML = '⤡'; maximized = true;
    }
    save();
  };
  el.appendChild(mb);

  let resizing = false, sx, sy, sw, sh;
  h.addEventListener('pointerdown', (e) => {
    if (isMobile()) return;
    e.preventDefault(); e.stopPropagation(); resizing = true;
    const r = el.getBoundingClientRect();
    sx = e.clientX; sy = e.clientY; sw = r.width; sh = r.height;
    h.setPointerCapture(e.pointerId); el.classList.add('ui-dragging');
  });
  h.addEventListener('pointermove', (e) => {
    if (!resizing) return;
    const w = Math.max(minW, Math.min(maxW, sw + (e.clientX - sx)));
    const ht = Math.max(minH, Math.min(maxH, sh + (e.clientY - sy)));
    el.style.width = w + 'px'; el.style.height = ht + 'px'; el.style.maxHeight = ht + 'px';
    const cfg = panels.get(id);
    if (cfg) cfg.size = { w, h: ht };
  });
  h.addEventListener('pointerup', () => {
    if (!resizing) return;
    resizing = false; el.classList.remove('ui-dragging'); maximized = false; mb.innerHTML = '⤢'; save();
  });
}

export function initPanelSystem() {
  if (isMobile()) return;

  // Transcript - draggable + resizable
  const tr = document.getElementById('transcript-dock');
  const tt = document.getElementById('transcript-toggle');
  if (tr && tt) {
    makeDraggable(tr, tt, 'transcript');
    makeResizable(tr, 'transcript', { minW: 300, minH: 100, maxW: 800, maxH: 600 });
  }

  // Bottom dock (subtitles) - draggable
  const bd = document.getElementById('bottom-dock');
  if (bd) {
    const bh = bd.querySelector('.ambience-chip') || bd;
    makeDraggable(bd, bh, 'bottom-dock');
  }

  // Objective prompt - draggable
  const obj = document.getElementById('objective-prompt');
  if (obj) {
    const ok = obj.querySelector('.objective-kicker') || obj;
    makeDraggable(obj, ok, 'objective');
  }

  // HUD - draggable
  const hud = document.getElementById('hud');
  const ht = document.getElementById('hud-toggle');
  if (hud && ht) makeDraggable(hud, ht, 'hud');

  // Reclaim on resize
  window.addEventListener('resize', () => {
    if (isMobile()) return;
    panels.forEach((cfg) => {
      if (!cfg.pos) return;
      const elId = [...panels.entries()].find(([, v]) => v === cfg)?.[0];
      if (!elId) return;
      const idMap = { 'transcript': 'transcript-dock', 'bottom-dock': 'bottom-dock', 'objective': 'objective-prompt', 'hud': 'hud' };
      const el = document.getElementById(idMap[elId] || elId);
      if (el) { cfg.pos = clamp(cfg.pos.x, cfg.pos.y, el); applyPos(el, cfg); }
    });
  });
}
