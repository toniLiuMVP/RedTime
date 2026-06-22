/**
 * debug-character-inspect.js — 角色 mesh material 檢查工具
 *
 * 對應 PENDING B-VIS-001:學長腿穿出褲子背面看膚色露出。
 * Source 設計male leg 是純藍 box(`legs: #3d5c8a`),不該有膚色。但 toni 截圖看到膚色。
 *
 * 用 console `__INSPECT_CHARS__()` 列當前所有角色的 mesh hierarchy:
 *   - 每個 mesh 的 uuid / name / position / scale
 *   - material 類型 + color (hex) + roughness / metalness 等 PBR 屬性
 *   - 比對 source S() 函數 expected color → 找出實際偏離
 *
 * 不影響 runtime — 純 read-only inspect。
 */

import * as THREE from "./vendor-three.module.js";

const EXPECTED_COLORS = {
  Go: { name: "學長",       legs: "#3d5c8a", torso: "#f8f8f8", skin: "#f2d8c8", hair: "#1a1214" },
  Co: { name: "學妹 29 歲", legs: "#1c2e46", torso: "#f6f4f0", skin: "#fce4d4", hair: "#2a1d15" },
  Bo: { name: "父親回聲",   legs: "#ffe9d5", torso: "#f2c49e", skin: "#f0c7ab", hair: "#533f3c" },
  ko: { name: "阿姨回聲",   legs: "#ffd8e4", torso: "#???",    skin: "#???",    hair: "#???"    },
};

/**
 * 列出 character group 內所有 mesh 的 material color
 * @param {THREE.Object3D} char - character root group
 * @param {string} label - 角色標籤(Go/Co/Bo/ko)
 */
function inspectCharacter(char, label) {
  if (!char) {
    console.warn(`[inspect] ${label} not found`);
    return;
  }

  const expected = EXPECTED_COLORS[label] || {};
  const groups = { skin: [], legs: [], torso: [], hair: [], other: [] };
  let total = 0;

  char.traverse((m) => {
    if (!m.material) return;
    total++;
    const mat = Array.isArray(m.material) ? m.material[0] : m.material;
    const colorHex = mat.color ? "#" + mat.color.getHexString() : "(no color)";
    const entry = {
      name: m.name || "(unnamed)",
      type: m.type,
      color: colorHex,
      pos: m.position ? `(${m.position.x.toFixed(2)}, ${m.position.y.toFixed(2)}, ${m.position.z.toFixed(2)})` : "?",
      visible: m.visible,
      uuid: m.uuid.slice(0, 8),
    };

    // 推斷類別(顏色比對 expected)
    if (expected.legs && colorHex.toLowerCase() === expected.legs.toLowerCase()) {
      groups.legs.push(entry);
    } else if (expected.skin && colorHex.toLowerCase() === expected.skin.toLowerCase()) {
      groups.skin.push(entry);
    } else if (expected.torso && colorHex.toLowerCase() === expected.torso.toLowerCase()) {
      groups.torso.push(entry);
    } else if (expected.hair && colorHex.toLowerCase() === expected.hair.toLowerCase()) {
      groups.hair.push(entry);
    } else {
      groups.other.push(entry);
    }
  });

  console.group(
    `%c[${label}] ${expected.name || "(unknown)"} — ${total} meshes`,
    "color:#ffd49c;font-weight:bold;"
  );
  console.log(`%cExpected colors:`, "color:#a8c5ff;", expected);
  ["legs", "skin", "torso", "hair", "other"].forEach((cat) => {
    if (groups[cat].length === 0) return;
    console.group(`%c${cat} (${groups[cat].length})`, "color:#9ce0a8;");
    console.table(groups[cat]);
    console.groupEnd();
  });
  console.groupEnd();
}

/**
 * Console API:`__INSPECT_CHARS__()` 一鍵列所有角色
 * 從 window.__SCENE__ 找 character groups
 */
function inspectAll() {
  if (typeof window === "undefined") return;

  console.info(
    "%c[inspect-chars] B-VIS-001 學長腿穿出褲子 debug",
    "color:#ffd49c;font-weight:bold;font-size:13px;",
    "\n比對 source EXPECTED_COLORS vs 實際 mesh material color。" +
    "\n如果學長 Go 的 'skin' 類有出現在腿部位置(y < 0.7),就是 mesh bug。"
  );

  // Try to access character refs from various exposure points
  const sources = [
    { ref: window.__GO__,    label: "Go" },
    { ref: window.__CO__,    label: "Co" },
    { ref: window.__BO__,    label: "Bo" },
    { ref: window.__KO__,    label: "ko" },
  ];

  let found = 0;
  sources.forEach(({ ref, label }) => {
    if (ref) {
      inspectCharacter(ref, label);
      found++;
    }
  });

  if (found === 0) {
    console.warn(
      "[inspect-chars] 找不到角色 refs — renderer.js 需要 expose:" +
      "\n  window.__GO__ = Go; window.__CO__ = Co; window.__BO__ = Bo; window.__KO__ = ko;"
    );
  } else {
    console.info(`[inspect-chars] inspected ${found}/4 characters`);
  }
}

/**
 * 過濾 sub-tree:列特定 character 在某 y 範圍內的所有 skin material mesh
 * 用法:`__INSPECT_LEGS__('Go')` — 列學長 y < 0.7 範圍(腿部高度)的所有 mesh
 *
 * 預期:legs 範圍內應該全是 i material(藍 #3d5c8a),不該有 skin material(膚色 #f2d8c8)
 */
function inspectLegs(label = "Go") {
  if (typeof window === "undefined") return;
  const ref = window[`__${label.toUpperCase()}__`];
  if (!ref) {
    console.warn(`[inspect-legs] window.__${label.toUpperCase()}__ not found`);
    return;
  }

  const expected = EXPECTED_COLORS[label] || {};
  const inLegRange = [];

  ref.traverse((m) => {
    if (!m.material) return;
    const mat = Array.isArray(m.material) ? m.material[0] : m.material;
    if (!mat.color) return;

    // 取 world position(group transform 後)
    const wp = new THREE.Vector3();
    m.getWorldPosition(wp);
    const localY = m.position?.y ?? 0;

    if (localY < 0.7 && localY > 0.02) {
      inLegRange.push({
        name: m.name || "(unnamed)",
        type: m.type,
        color: "#" + mat.color.getHexString(),
        localPos: `(${m.position.x.toFixed(2)}, ${localY.toFixed(2)}, ${m.position.z.toFixed(2)})`,
        worldPos: `(${wp.x.toFixed(2)}, ${wp.y.toFixed(2)}, ${wp.z.toFixed(2)})`,
        expectedLegsColor: expected.legs,
        match: ("#" + mat.color.getHexString()).toLowerCase() === (expected.legs || "").toLowerCase(),
      });
    }
  });

  console.group(
    `%c[inspect-legs] ${label} 腿部範圍 (localY 0.02-0.7) — ${inLegRange.length} meshes`,
    "color:#ffd49c;font-weight:bold;"
  );
  console.table(inLegRange);
  const mismatches = inLegRange.filter((e) => !e.match);
  if (mismatches.length > 0) {
    console.warn(
      `❌ ${mismatches.length} mesh 顏色不對 — 應該都是 ${expected.legs}`,
      mismatches
    );
  } else {
    console.info("✅ 所有腿部 mesh 都符合 expected legs color");
  }
  console.groupEnd();
}

if (typeof window !== "undefined") {
  window.__INSPECT_CHARS__ = inspectAll;
  window.__INSPECT_LEGS__ = inspectLegs;
}

export { inspectAll, inspectCharacter, inspectLegs, EXPECTED_COLORS };
