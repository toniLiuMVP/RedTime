// babylon-junior.js — 平行世界「絕對天花板」線 · 程序學妹(Babylon.js 重建)
// 2026-05-31 r67 P2:在 Babylon 重建學妹(2005 年 29 歲,白校服 + 深棕馬尾)。
// 身分色票抓自 Three.js 源碼(skin #f9e7da / hair #3c2a22 / 校服 #f8f8f8 / 唇 #f1627d)。
// P2 用 PBRMetallicRoughnessMaterial 立骨架;P3 升級 SSS 皮膚 + IBL + 真實毛髮 + 表情。
//
// export buildJunior(BABYLON, scene) → { root, headCenter }(headCenter 供相機對焦一眼瞬間)。
// 純幾何模組:無 CJK 字串字面、無 innerHTML、無外部資源。

// 學妹身分(source-of-truth 色票)
const ID = {
  skin: "#f9e7da",
  skinShadow: "#e8b89c",
  blush: "#ffd0c0",
  hair: "#3c2a22",
  hairHi: "#5a4030",
  blouse: "#f8f8f8",
  collar: "#eef0f4",
  skirt: "#2c3a52",   // 2005 校服深藍褶裙
  lip: "#d96b74",
  brow: "#3a2a22",
  eyeWhite: "#f4f1ee",
  iris: "#5b3a26",
  shoe: "#2a2622",
};

function pbr(BABYLON, scene, name, hex, rough, metal) {
  const m = new BABYLON.PBRMetallicRoughnessMaterial(name, scene);
  m.baseColor = BABYLON.Color3.FromHexString(hex);
  m.roughness = rough == null ? 0.6 : rough;
  m.metallic = metal == null ? 0.0 : metal;
  return m;
}

export function buildJunior(BABYLON, scene) {
  const V3 = BABYLON.Vector3;
  const root = new BABYLON.TransformNode("junior", scene);

  // ── 材質 ──
  const matSkin = pbr(BABYLON, scene, "j-skin", ID.skin, 0.52, 0);
  const matHair = pbr(BABYLON, scene, "j-hair", ID.hair, 0.42, 0);
  const matBlouse = pbr(BABYLON, scene, "j-blouse", ID.blouse, 0.7, 0);
  const matCollar = pbr(BABYLON, scene, "j-collar", ID.collar, 0.62, 0);
  const matSkirt = pbr(BABYLON, scene, "j-skirt", ID.skirt, 0.74, 0);
  const matLip = pbr(BABYLON, scene, "j-lip", ID.lip, 0.4, 0);
  const matBrow = pbr(BABYLON, scene, "j-brow", ID.brow, 0.5, 0);
  const matEyeW = pbr(BABYLON, scene, "j-eyew", ID.eyeWhite, 0.28, 0);
  const matIris = pbr(BABYLON, scene, "j-iris", ID.iris, 0.2, 0);
  const matShoe = pbr(BABYLON, scene, "j-shoe", ID.shoe, 0.45, 0.05);

  const add = (mesh, mat, parent) => {
    mesh.material = mat;
    mesh.parent = parent || root;
    return mesh;
  };

  // 比例:站姿,腳 y=0,頭頂 ~1.66。headCenter ≈ y 1.5。
  // ── 頭 ──
  const head = BABYLON.MeshBuilder.CreateSphere("j-head", { diameterX: 0.40, diameterY: 0.46, diameterZ: 0.42, segments: 48 }, scene);
  head.position = new V3(0, 1.46, 0);
  add(head, matSkin);
  // 下顎收一點(scale 下半)
  const jaw = BABYLON.MeshBuilder.CreateSphere("j-jaw", { diameterX: 0.34, diameterY: 0.3, diameterZ: 0.36, segments: 40 }, scene);
  jaw.position = new V3(0, 1.37, 0.01);
  add(jaw, matSkin);

  // ── 五官(掛在 head 局部座標,臉朝 +Z)──
  const faceZ = 0.205;
  // 眼睛(白 + 虹膜)
  for (const sx of [-1, 1]) {
    const ew = BABYLON.MeshBuilder.CreateSphere("j-eyew" + sx, { diameter: 0.072, segments: 24 }, scene);
    ew.position = new V3(sx * 0.082, 1.49, faceZ - 0.01);
    ew.scaling = new V3(1.25, 0.85, 0.7);
    add(ew, matEyeW);
    const ir = BABYLON.MeshBuilder.CreateSphere("j-iris" + sx, { diameter: 0.04, segments: 20 }, scene);
    ir.position = new V3(sx * 0.082, 1.49, faceZ + 0.012);
    ir.scaling = new V3(1, 1, 0.5);
    add(ir, matIris);
    // 眉
    const br = BABYLON.MeshBuilder.CreateBox("j-brow" + sx, { width: 0.085, height: 0.012, depth: 0.02 }, scene);
    br.position = new V3(sx * 0.085, 1.535, faceZ);
    br.rotation = new V3(0, 0, sx * -0.12);
    add(br, matBrow);
  }
  // 鼻
  const nose = BABYLON.MeshBuilder.CreateSphere("j-nose", { diameter: 0.05, segments: 20 }, scene);
  nose.position = new V3(0, 1.455, faceZ + 0.018);
  nose.scaling = new V3(0.7, 1.1, 0.9);
  add(nose, matSkin);
  // 唇(上下)
  const lipU = BABYLON.MeshBuilder.CreateSphere("j-lipU", { diameter: 0.06, segments: 20 }, scene);
  lipU.position = new V3(0, 1.405, faceZ + 0.004);
  lipU.scaling = new V3(1.3, 0.4, 0.5);
  add(lipU, matLip);
  const lipL = BABYLON.MeshBuilder.CreateSphere("j-lipL", { diameter: 0.06, segments: 20 }, scene);
  lipL.position = new V3(0, 1.388, faceZ + 0.004);
  lipL.scaling = new V3(1.15, 0.5, 0.55);
  add(lipL, matLip);
  // 腮紅(淡,薄圓盤貼臉)
  for (const sx of [-1, 1]) {
    const bl = BABYLON.MeshBuilder.CreateDisc("j-blush" + sx, { radius: 0.045, tessellation: 24 }, scene);
    bl.position = new V3(sx * 0.11, 1.44, faceZ + 0.005);
    const mBl = pbr(BABYLON, scene, "j-blushM" + sx, ID.blush, 0.6, 0);
    mBl.alpha = 0.35;
    bl.material = mBl;
    bl.parent = root;
  }

  // ── 馬尾(髮帽 + 後束 + 髮圈)──
  const cap = BABYLON.MeshBuilder.CreateSphere("j-haircap", { diameterX: 0.44, diameterY: 0.5, diameterZ: 0.46, segments: 40 }, scene);
  cap.position = new V3(0, 1.5, -0.02);
  cap.scaling = new V3(1, 1, 1);
  // 髮帽只蓋上後方:用一個略大球往後上偏
  add(cap, matHair);
  // 瀏海(前額一片)
  const bang = BABYLON.MeshBuilder.CreateSphere("j-bang", { diameterX: 0.42, diameterY: 0.2, diameterZ: 0.24, segments: 32 }, scene);
  bang.position = new V3(0, 1.56, 0.12);
  add(bang, matHair);
  // 髮圈
  const tie = BABYLON.MeshBuilder.CreateTorus("j-tie", { diameter: 0.1, thickness: 0.035, tessellation: 24 }, scene);
  tie.position = new V3(0, 1.55, -0.2);
  tie.rotation = new V3(Math.PI / 2, 0, 0);
  add(tie, matHair);
  // 馬尾主體(往後下垂的錐柱)
  const tail = BABYLON.MeshBuilder.CreateCylinder("j-tail", { height: 0.6, diameterTop: 0.16, diameterBottom: 0.08, tessellation: 24 }, scene);
  tail.position = new V3(0, 1.28, -0.3);
  tail.rotation = new V3(-0.5, 0, 0);
  add(tail, matHair);

  // ── 頸 ──
  const neck = BABYLON.MeshBuilder.CreateCylinder("j-neck", { height: 0.16, diameterTop: 0.13, diameterBottom: 0.16, tessellation: 24 }, scene);
  neck.position = new V3(0, 1.26, 0);
  add(neck, matSkin);

  // ── 軀幹:白校服上衣 ──
  const torso = BABYLON.MeshBuilder.CreateCylinder("j-torso", { height: 0.62, diameterTop: 0.34, diameterBottom: 0.4, tessellation: 32 }, scene);
  torso.position = new V3(0, 0.92, 0);
  add(torso, matBlouse);
  // 衣領
  const collar = BABYLON.MeshBuilder.CreateTorus("j-collar", { diameter: 0.24, thickness: 0.05, tessellation: 28 }, scene);
  collar.position = new V3(0, 1.18, 0.02);
  collar.rotation = new V3(Math.PI / 2, 0, 0);
  collar.scaling = new V3(1, 0.7, 1);
  add(collar, matCollar);

  // ── 褶裙(深藍,flared)──
  const skirt = BABYLON.MeshBuilder.CreateCylinder("j-skirt", { height: 0.34, diameterTop: 0.42, diameterBottom: 0.66, tessellation: 40 }, scene);
  skirt.position = new V3(0, 0.5, 0);
  add(skirt, matSkirt);

  // ── 手臂(上臂 + 前臂 + 手)──
  for (const sx of [-1, 1]) {
    const upper = BABYLON.MeshBuilder.CreateCylinder("j-upArm" + sx, { height: 0.32, diameterTop: 0.12, diameterBottom: 0.1, tessellation: 20 }, scene);
    upper.position = new V3(sx * 0.26, 1.0, 0);
    upper.rotation = new V3(0, 0, sx * 0.18);
    add(upper, matBlouse);
    const fore = BABYLON.MeshBuilder.CreateCylinder("j-foreArm" + sx, { height: 0.3, diameterTop: 0.085, diameterBottom: 0.07, tessellation: 20 }, scene);
    fore.position = new V3(sx * 0.34, 0.68, 0.02);
    fore.rotation = new V3(0.12, 0, sx * 0.12);
    add(fore, matSkin);
    const hand = BABYLON.MeshBuilder.CreateSphere("j-hand" + sx, { diameter: 0.1, segments: 18 }, scene);
    hand.position = new V3(sx * 0.38, 0.52, 0.04);
    hand.scaling = new V3(0.8, 1.1, 0.5);
    add(hand, matSkin);
  }

  // ── 腿(大腿 + 小腿 + 鞋)──
  for (const sx of [-1, 1]) {
    const thigh = BABYLON.MeshBuilder.CreateCylinder("j-thigh" + sx, { height: 0.38, diameterTop: 0.15, diameterBottom: 0.12, tessellation: 20 }, scene);
    thigh.position = new V3(sx * 0.11, 0.28, 0);
    add(thigh, matSkin);
    const calf = BABYLON.MeshBuilder.CreateCylinder("j-calf" + sx, { height: 0.36, diameterTop: 0.11, diameterBottom: 0.075, tessellation: 20 }, scene);
    calf.position = new V3(sx * 0.11, -0.08, 0.01);
    add(calf, matSkin);
    // 鞋(鞋底 box + 鞋頭 sphere)
    const sole = BABYLON.MeshBuilder.CreateBox("j-sole" + sx, { width: 0.11, height: 0.04, depth: 0.24 }, scene);
    sole.position = new V3(sx * 0.11, -0.28, 0.05);
    add(sole, matShoe);
    const toe = BABYLON.MeshBuilder.CreateSphere("j-toe" + sx, { diameter: 0.12, segments: 16 }, scene);
    toe.position = new V3(sx * 0.11, -0.26, 0.15);
    toe.scaling = new V3(0.9, 0.7, 1.0);
    add(toe, matShoe);
  }

  return { root, headCenter: new V3(0, 1.46, 0) };
}
