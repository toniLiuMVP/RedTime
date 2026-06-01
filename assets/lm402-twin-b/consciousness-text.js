/**
 * consciousness-text.js — 意識菜市場 · 文字派（雙時空 B4）
 *
 * 學妹周圍漂浮她意識中各年紀的內心話。
 * 文字內容來自 data.js 的「意識菜市場」對白（toni 原文，不自創）：
 *   18 歲的聲音 → 暖橙（青春）
 *   29 歲的聲音 → 暖白（現在主體）
 *   33 歲的聲音 → 淡綠（記憶）
 *   39 歲的聲音 → 淡紫（夢境）
 *   49 歲的聲音 → 月光藍（未來）
 *
 * 跟 B3 光柱、B2 粒子並行運作 → 「七嘴八舌」抽象視覺化的最後一塊。
 *
 * 技術：CanvasTexture + Three.js Sprite（永遠朝相機）
 *   - 預建 N 個 phrase texture（pool）
 *   - 12 個 sprite 在學妹周圍循環 lifecycle
 *   - lifecycle: spawn (random pos) → fade in 0.8s → drift 5s → fade out 1.2s → respawn (新 phrase)
 *
 * 公開 API：
 *   const t = createConsciousnessText({ parent, anchor });
 *   t.update(time);
 *   t.setIntensity(0.5);
 *   t.dispose();
 */

import * as THREE from "./vendor-three.module.js";

// 5 個年紀的詩意短句（從 data.js「意識菜市場」對白精選，toni 原文）
const VOICE_PHRASES = [
  // 18 歲（青春）
  { text: "我好怕搞砸",       color: "#ffd49c", age: 18 },
  { text: "心臟跳好快",        color: "#ffd49c", age: 18 },
  // 29 歲（現在主體）
  { text: "坐好",             color: "#fff5e8", age: 29 },
  { text: "保持微笑",          color: "#fff5e8", age: 29 },
  { text: "他會打電話",        color: "#fff5e8", age: 29 },
  { text: "不要逃，也不要做奇怪的事", color: "#fff5e8", age: 29 },
  // 33 歲（記憶）
  { text: "喜歡不是佔有",      color: "#bff0c5", age: 33 },
  { text: "靠近需要同意",      color: "#bff0c5", age: 33 },
  { text: "讓他自己走過來",    color: "#bff0c5", age: 33 },
  // 39 歲（夢境）
  { text: "先活著",           color: "#d8b8ff", age: 39 },
  { text: "後來的事後來再說",  color: "#d8b8ff", age: 39 },
  { text: "難的是「站好」",    color: "#d8b8ff", age: 39 },
  // 49 歲（未來）
  { text: "不要怕",           color: "#a8c5ff", age: 49 },
  { text: "留一點空白給命運",  color: "#a8c5ff", age: 49 },
  { text: "所有心跳都從這裡長出來", color: "#a8c5ff", age: 49 },
];

const SPRITE_COUNT = 12; // 同時運作的 sprite 數
const PHRASE_TEX_W = 768;
const PHRASE_TEX_H = 96;

// ─── 預建每個 phrase 的 CanvasTexture ───
let _phraseTextures = null;
function buildAllPhraseTextures() {
  if (_phraseTextures) return _phraseTextures;
  _phraseTextures = VOICE_PHRASES.map((phrase) => {
    const c = document.createElement("canvas");
    c.width = PHRASE_TEX_W;
    c.height = PHRASE_TEX_H;
    const ctx = c.getContext("2d");
    // 透明背景
    ctx.clearRect(0, 0, PHRASE_TEX_W, PHRASE_TEX_H);
    // 文字
    ctx.font = '34px "Noto Serif TC", "PingFang TC", serif';
    ctx.fillStyle = phrase.color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // 微微暈光（同色雙層）
    ctx.shadowColor = phrase.color;
    ctx.shadowBlur = 16;
    ctx.fillText(phrase.text, PHRASE_TEX_W / 2, PHRASE_TEX_H / 2);
    // 主體再畫一遍（避免 shadow 過糊）
    ctx.shadowBlur = 0;
    ctx.fillText(phrase.text, PHRASE_TEX_W / 2, PHRASE_TEX_H / 2);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return { tex, ...phrase };
  });
  return _phraseTextures;
}

export function createConsciousnessText(options = {}) {
  const parent = options.parent;
  const anchor = options.anchor || { x: 0, y: 1.4, z: 0 };
  const radius = options.radius ?? 0.7;
  const heightRange = options.heightRange ?? 1.0;
  if (!parent) {
    console.warn("[consciousness-text] no parent provided");
    return makeNoOp();
  }

  const phraseData = buildAllPhraseTextures();

  // ─── 建立 12 個 sprite，各自獨立 lifecycle ───
  const sprites = [];
  for (let i = 0; i < SPRITE_COUNT; i++) {
    const mat = new THREE.SpriteMaterial({
      map: phraseData[0].tex,
      transparent: true,
      depthWrite: false,
      opacity: 0,
      blending: THREE.NormalBlending,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(0.6, 0.075, 1); // 8:1 比例配合 canvas 768x96
    sprite.renderOrder = 20; // 在粒子之後（粒子 19）
    sprite.userData = {
      life: Math.random(),       // 初始隨機 life（避免一齊出現）
      lifespan: 5 + Math.random() * 3, // 壽命 5-8 秒
      vx: 0, vy: 0, vz: 0,
      phraseIndex: 0,
    };
    parent.add(sprite);
    sprites.push(sprite);
    respawnSprite(sprite, anchor, radius, heightRange, phraseData);
  }
  let masterIntensity = 1.0;

  let lastTime = 0;
  function update(time) {
    if (lastTime === 0) lastTime = time;
    const dt = Math.min(0.05, time - lastTime);
    lastTime = time;

    for (const sprite of sprites) {
      const ud = sprite.userData;
      ud.life += dt / ud.lifespan;
      if (ud.life >= 1.0) {
        respawnSprite(sprite, anchor, radius, heightRange, phraseData);
        continue;
      }
      // lifecycle alpha：sin(life * PI) 平滑 0→1→0（0.9 → 0.55，fix「文字蓋過學妹」）
      sprite.material.opacity = Math.sin(ud.life * Math.PI) * masterIntensity * 0.55;
      // drift
      sprite.position.x += ud.vx * dt;
      sprite.position.y += ud.vy * dt;
      sprite.position.z += ud.vz * dt;
    }
  }

  function setIntensity(v) {
    masterIntensity = Math.max(0, Math.min(1, v));
  }

  function dispose() {
    sprites.forEach((s) => {
      parent.remove(s);
      s.material.dispose();
    });
    sprites.length = 0;
  }

  return {
    update,
    setIntensity,
    dispose,
    sprites,
    inspectPhrases: () => VOICE_PHRASES.map((p) => `[${p.age}] ${p.text}`),
  };
}

function respawnSprite(sprite, anchor, radius, heightRange, phraseData) {
  // 隨機選一句（隨年紀混合）
  const idx = Math.floor(Math.random() * phraseData.length);
  const phrase = phraseData[idx];
  sprite.material.map = phrase.tex;
  sprite.userData.phraseIndex = idx;

  // 隨機在學妹周圍位置（球面分布）
  const theta = Math.random() * Math.PI * 2;
  const r = radius * (0.6 + Math.random() * 0.6);
  sprite.position.set(
    anchor.x + Math.cos(theta) * r,
    anchor.y + (Math.random() - 0.4) * heightRange,
    anchor.z + Math.sin(theta) * r
  );
  // 緩慢往上 + 微擾動
  sprite.userData.vx = (Math.random() - 0.5) * 0.04;
  sprite.userData.vy = 0.04 + Math.random() * 0.03;
  sprite.userData.vz = (Math.random() - 0.5) * 0.04;
  sprite.userData.life = 0;
  sprite.userData.lifespan = 5 + Math.random() * 3;
  sprite.material.opacity = 0;
  sprite.material.needsUpdate = true;
}

function makeNoOp() {
  return {
    update: () => {}, setIntensity: () => {}, dispose: () => {},
    sprites: [], inspectPhrases: () => [],
  };
}
