import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import * as THREE from "../assets/lm402/vendor-three.module.js";
import { GLTFExporter } from "./GLTFExporter.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const exportDir = path.resolve(
  __dirname,
  "../assets/lm402/characters/junior/exports",
);

const COLORS = {
  skin: "#f4dccb",
  skinFace: "#f8e5d7",
  blush: "#dca4a1",
  hair: "#2f201a",
  hairWarm: "#5b4032",
  shirt: "#f8f6f2",
  shirtShadow: "#d7d0c7",
  denim: "#56789d",
  denimShadow: "#2c3f59",
  shoes: "#f6f3eb",
  scrunchie: "#efe7df",
  eyeWhite: "#fffdf9",
  iris: "#5a3f31",
  brow: "#341f1a",
  lip: "#bf8f92",
};

if (typeof globalThis.FileReader === "undefined") {
  globalThis.FileReader = class FileReader {
    constructor() {
      this.result = null;
      this.onloadend = null;
    }

    async readAsArrayBuffer(blob) {
      this.result = await blob.arrayBuffer();
      this.onloadend?.();
    }

    async readAsDataURL(blob) {
      const buffer = Buffer.from(await blob.arrayBuffer());
      this.result = `data:${blob.type || "application/octet-stream"};base64,${buffer.toString("base64")}`;
      this.onloadend?.();
    }
  };
}

function setMaterialName(material, name) {
  material.name = name;
  return material;
}

function softPhysicalMaterial(name, color, overrides = {}) {
  return setMaterialName(
    new THREE.MeshPhysicalMaterial({
      color,
      roughness: 0.5,
      metalness: 0,
      clearcoat: 0.14,
      clearcoatRoughness: 0.28,
      sheen: 0.2,
      sheenRoughness: 0.4,
      ...overrides,
    }),
    name,
  );
}

function makeMesh(geometry, material, name) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function cloneMaterial(material, name, overrides = {}) {
  const clone = material.clone();
  clone.name = name;
  Object.assign(clone, overrides);
  return clone;
}

function createStrand(points, radius, material, tubularSegments = 18) {
  const curve = new THREE.CatmullRomCurve3(
    points.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
  );
  return makeMesh(
    new THREE.TubeGeometry(curve, tubularSegments, radius, 8, false),
    material,
    "hair_strand",
  );
}

function createHead(detail = 1, materials = {}) {
  const group = new THREE.Group();
  group.name = "junior_head";

  const head = makeMesh(
    new THREE.SphereGeometry(0.162, 30 + detail * 8, 30 + detail * 8),
    materials.skinFace,
    "head_main",
  );
  head.position.set(0, 1.57, 0.004);
  head.scale.set(0.82, 1.12, 0.8);
  group.add(head);

  const jaw = makeMesh(
    new THREE.SphereGeometry(0.13, 24 + detail * 6, 24 + detail * 6),
    materials.skinFace,
    "head_jaw",
  );
  jaw.position.set(0, 1.468, 0.03);
  jaw.scale.set(0.48, 0.34, 0.56);
  group.add(jaw);

  const chin = makeMesh(
    new THREE.SphereGeometry(0.025, 18, 18),
    materials.skinFace,
    "chin",
  );
  chin.position.set(0, 1.438, 0.146);
  chin.scale.set(1.55, 0.42, 0.42);
  group.add(chin);

  const blushMaterial = cloneMaterial(materials.blush, "skin_face_blush", {
    transparent: true,
    opacity: 0.36,
  });
  const leftBlush = makeMesh(
    new THREE.SphereGeometry(0.028, 18, 18),
    blushMaterial,
    "cheek_blush_l",
  );
  leftBlush.position.set(-0.078, 1.476, 0.144);
  leftBlush.scale.set(0.9, 0.64, 0.34);
  const rightBlush = leftBlush.clone();
  rightBlush.position.x = 0.078;
  group.add(leftBlush, rightBlush);

  const earGeometry = new THREE.SphereGeometry(0.028, 18, 18);
  const leftEar = makeMesh(earGeometry, materials.skinFace, "ear_l");
  leftEar.position.set(-0.126, 1.514, 0.008);
  leftEar.scale.set(0.44, 0.66, 0.42);
  const rightEar = leftEar.clone();
  rightEar.position.x = 0.126;
  group.add(leftEar, rightEar);

  const noseBridge = makeMesh(
    new THREE.CapsuleGeometry(0.0052, 0.042, 4, 8),
    materials.skinFace,
    "nose_bridge",
  );
  noseBridge.position.set(0, 1.535, 0.094);
  noseBridge.scale.set(0.56, 0.84, 0.7);
  group.add(noseBridge);

  const noseTip = makeMesh(
    new THREE.SphereGeometry(0.014, 18, 18),
    materials.skinFace,
    "nose_tip",
  );
  noseTip.position.set(0, 1.492, 0.108);
  noseTip.scale.set(1.08, 0.74, 1.18);
  group.add(noseTip);

  const lip = makeMesh(
    new THREE.TorusGeometry(0.039, 0.006, 8, 22, Math.PI),
    materials.lip,
    "lip_arc",
  );
  lip.position.set(0, 1.447, 0.152);
  lip.rotation.x = Math.PI;
  group.add(lip);

  const eyeWhiteGeometry = new THREE.SphereGeometry(0.026, 18, 18);
  const irisGeometry = new THREE.SphereGeometry(0.012, 14, 14);
  const leftEye = makeMesh(eyeWhiteGeometry, materials.eyeWhite, "eye_white_l");
  leftEye.position.set(-0.064, 1.558, 0.16);
  leftEye.scale.set(1.64, 1.08, 0.56);
  const rightEye = leftEye.clone();
  rightEye.position.x = 0.064;
  const leftIris = makeMesh(irisGeometry, materials.iris, "eye_iris_l");
  leftIris.position.set(-0.062, 1.554, 0.176);
  leftIris.scale.set(1.1, 1.02, 0.88);
  const rightIris = leftIris.clone();
  rightIris.position.x = 0.062;
  group.add(leftEye, rightEye, leftIris, rightIris);

  const browMaterial = materials.brow;
  const leftBrow = makeMesh(
    new THREE.CapsuleGeometry(0.0038, 0.045, 4, 8),
    browMaterial,
    "brow_l",
  );
  leftBrow.position.set(-0.06, 1.592, 0.152);
  leftBrow.rotation.z = -1.28;
  const rightBrow = leftBrow.clone();
  rightBrow.position.x = 0.06;
  rightBrow.rotation.z = 1.28;
  group.add(leftBrow, rightBrow);

  const eyelashMaterial = cloneMaterial(materials.brow, "hair_cards_lash", {
    roughness: 0.46,
  });
  const leftLash = makeMesh(
    new THREE.TorusGeometry(0.034, 0.0038, 6, 18, Math.PI),
    eyelashMaterial,
    "eyelash_l",
  );
  leftLash.position.set(-0.064, 1.57, 0.168);
  leftLash.rotation.z = Math.PI;
  const rightLash = leftLash.clone();
  rightLash.position.x = 0.064;
  group.add(leftLash, rightLash);

  const sparkleMaterial = cloneMaterial(materials.eyeWhite, "eye_glint", {
    emissive: new THREE.Color("#ffffff"),
    emissiveIntensity: 0.14,
  });
  const glintL = makeMesh(
    new THREE.SphereGeometry(0.0052, 10, 10),
    sparkleMaterial,
    "eye_glint_l",
  );
  glintL.position.set(-0.058, 1.572, 0.184);
  const glintR = glintL.clone();
  glintR.position.x = 0.072;
  group.add(glintL, glintR);

  return group;
}

function createHair(detail = 1, materials = {}, options = {}) {
  const { hero = false } = options;
  const group = new THREE.Group();
  group.name = "junior_hair";

  const hairCap = makeMesh(
    new THREE.SphereGeometry(0.206, 24 + detail * 6, 24 + detail * 6, 0, Math.PI * 2, 0, Math.PI * 0.72),
    materials.hair,
    "hair_cap",
  );
  hairCap.position.set(0, 1.604, 0.024);
  hairCap.scale.set(0.88, 0.86, 0.84);
  hairCap.rotation.x = -0.1;
  group.add(hairCap);

  const backHair = makeMesh(
    new THREE.SphereGeometry(0.214, 24 + detail * 6, 24 + detail * 6),
    materials.hair,
    "hair_back",
  );
  backHair.position.set(0, 1.472, -0.116);
  backHair.scale.set(0.78, 1.08, 0.52);
  group.add(backHair);

  const fringeCore = makeMesh(
    new THREE.CapsuleGeometry(0.018, 0.056, 4, 8),
    materials.hair,
    "hair_fringe_core",
  );
  fringeCore.position.set(0, 1.606, 0.132);
  fringeCore.scale.set(0.84, 0.92, 0.82);
  fringeCore.rotation.set(0.18, 0, -0.04);
  group.add(fringeCore);

  const sideL = makeMesh(
    new THREE.CapsuleGeometry(0.012, hero ? 0.12 : 0.2, 4, 10),
    materials.hair,
    "hair_side_l",
  );
  sideL.position.set(-0.118, hero ? 1.506 : 1.452, hero ? 0.07 : 0.062);
  sideL.scale.set(hero ? 0.72 : 0.86, hero ? 0.82 : 0.98, 0.82);
  sideL.rotation.set(hero ? 0.08 : 0.02, 0, hero ? 0.1 : 0.16);
  const sideR = sideL.clone();
  sideR.position.x = 0.122;
  sideR.rotation.z = hero ? -0.1 : -0.16;
  group.add(sideL, sideR);

  const ponyBase = makeMesh(
    new THREE.CapsuleGeometry(0.03, 0.18, 6, 10),
    materials.hair,
    "hair_pony_base",
  );
  ponyBase.position.set(0.038, 1.6, -0.145);
  ponyBase.rotation.set(0.78, -0.2, -0.06);
  group.add(ponyBase);

  const ponyStrands = [
    [
      [0.036, 1.56, -0.146],
      [0.074, 1.5, -0.19],
      [0.088, 1.42, -0.208],
      [0.072, 1.34, -0.182],
    ],
    [
      [0.024, 1.56, -0.146],
      [0.062, 1.48, -0.176],
      [0.074, 1.38, -0.188],
      [0.052, 1.28, -0.158],
    ],
  ];
  (!hero ? ponyStrands : ponyStrands.slice(0, 1)).forEach((points, index) => {
    const strand = createStrand(
      hero
        ? points.map(([x, y, z]) => [x * 0.78, y + 0.1, z * 0.62])
        : points,
      hero ? 0.01 : index === 0 ? 0.018 : 0.014,
      materials.hair,
      hero ? 10 + detail * 2 : 16 + detail * 4,
    );
    strand.name = `hair_pony_strand_${index + 1}`;
    group.add(strand);
  });

  const bangs = [
    [
      [-0.058, 1.606, 0.134],
      [-0.046, 1.566, 0.144],
      [-0.042, 1.51, 0.156],
    ],
    [
      [-0.016, 1.614, 0.14],
      [-0.01, 1.57, 0.154],
      [-0.006, 1.516, 0.16],
    ],
    [
      [0.028, 1.606, 0.134],
      [0.034, 1.566, 0.144],
      [0.038, 1.512, 0.156],
    ],
  ];
  bangs.forEach((points, index) => {
    const strand = createStrand(points, 0.004, materials.hairWarm, 12);
    strand.name = `hair_bang_${index + 1}`;
    group.add(strand);
  });

  const scrunchie = makeMesh(
    new THREE.TorusGeometry(0.022, 0.008, 10, 20),
    materials.scrunchie,
    "scrunchie",
  );
  scrunchie.position.set(0.034, 1.58, -0.13);
  scrunchie.rotation.set(1.1, 0.2, 0.2);
  group.add(scrunchie);

  return group;
}

function createUpperBody(materials = {}, detail = 1, options = {}) {
  const { hero = false } = options;
  const group = new THREE.Group();
  group.name = "junior_upper";

  const torso = makeMesh(
    new THREE.CapsuleGeometry(hero ? 0.148 : 0.172, hero ? 0.34 : 0.62, 8, 18),
    materials.shirt,
    "torso_main",
  );
  torso.position.set(0, hero ? 1.12 : 1.08, hero ? 0.01 : 0);
  torso.scale.set(hero ? 0.96 : 0.98, hero ? 0.88 : 1.04, 0.82);
  group.add(torso);

  const chest = makeMesh(
    new THREE.SphereGeometry(0.172, 22 + detail * 4, 22 + detail * 4),
    materials.shirtShadow,
    "torso_chest",
  );
  chest.position.set(0, hero ? 1.15 : 1.13, 0.038);
  chest.scale.set(hero ? 0.92 : 1.06, hero ? 0.5 : 0.64, 0.52);
  group.add(chest);

  if (!hero) {
    const pelvis = makeMesh(
      new THREE.CapsuleGeometry(0.118, 0.18, 5, 10),
      materials.shirt,
      "pelvis_base",
    );
    pelvis.position.set(0, 0.84, 0);
    pelvis.scale.set(0.96, 1.02, 0.82);
    group.add(pelvis);
  }

  const neck = makeMesh(
    new THREE.CylinderGeometry(0.072, 0.078, 0.2, 14),
    materials.skin,
    "neck",
  );
  neck.position.set(0, 1.33, 0.02);
  group.add(neck);

  const collar = makeMesh(
    new THREE.TorusGeometry(0.082, 0.01, 8, 24),
    cloneMaterial(materials.shirtShadow, "shirt_white_collar", {
      roughness: 0.46,
      clearcoat: 0.08,
    }),
    "shirt_collar",
  );
  collar.position.set(0, 1.26, 0.02);
  collar.rotation.x = Math.PI / 2;
  group.add(collar);

  const shoulderGeo = new THREE.SphereGeometry(hero ? 0.064 : 0.086, 18, 18);
  const leftSleeve = makeMesh(
    shoulderGeo,
    materials.shirt,
    "shirt_sleeve_l",
  );
  leftSleeve.position.set(hero ? -0.128 : -0.188, hero ? 1.18 : 1.18, 0);
  leftSleeve.scale.set(hero ? 1.24 : 1, hero ? 0.9 : 1, 0.88);
  const rightSleeve = leftSleeve.clone();
  rightSleeve.position.x = Math.abs(leftSleeve.position.x);
  group.add(leftSleeve, rightSleeve);

  if (!hero) {
    const armGeo = new THREE.CapsuleGeometry(0.042, 0.42, 5, 10);
    const leftArm = makeMesh(armGeo, materials.skin, "arm_l");
    leftArm.position.set(-0.228, 1, 0.02);
    leftArm.rotation.z = 0.12;
    const rightArm = leftArm.clone();
    rightArm.position.x = 0.228;
    rightArm.rotation.z = -0.12;
    group.add(leftArm, rightArm);

    const wristRingGeo = new THREE.TorusGeometry(0.034, 0.006, 8, 16);
    const leftWrist = makeMesh(
      wristRingGeo,
      materials.skin,
      "wrist_l",
    );
    leftWrist.position.set(-0.252, 0.75, 0.035);
    leftWrist.rotation.z = 0.12;
    const rightWrist = leftWrist.clone();
    rightWrist.position.x = 0.252;
    rightWrist.rotation.z = -0.12;
    group.add(leftWrist, rightWrist);

    const handGeo = new THREE.SphereGeometry(0.048, 18, 18);
    const leftHand = makeMesh(handGeo, materials.skin, "hand_l");
    leftHand.position.set(-0.264, 0.71, 0.04);
    leftHand.scale.set(0.8, 1, 1.2);
    const rightHand = leftHand.clone();
    rightHand.position.x = 0.264;
    group.add(leftHand, rightHand);
  }

  return group;
}

function createLowerBody(materials = {}, mobile = false) {
  const group = new THREE.Group();
  group.name = "junior_lower";

  const hip = makeMesh(
    new THREE.CylinderGeometry(0.166, 0.19, 0.16, mobile ? 12 : 24),
    materials.denim,
    "shorts_hip",
  );
  hip.position.set(0, 0.75, 0);
  group.add(hip);

  const waistband = makeMesh(
    new THREE.TorusGeometry(0.138, 0.014, 8, 24),
    cloneMaterial(materials.denim, "shorts_denim_waist", {
      roughness: 0.38,
      clearcoat: 0.14,
    }),
    "shorts_waistband",
  );
  waistband.position.set(0, 0.83, 0);
  waistband.rotation.x = Math.PI / 2;
  group.add(waistband);

  const legGeo = new THREE.CapsuleGeometry(0.064, 0.74, 6, 12);
  const leftLeg = makeMesh(legGeo, materials.skin, "leg_l");
  leftLeg.position.set(-0.085, 0.36, 0.01);
  leftLeg.rotation.z = 0.02;
  const rightLeg = leftLeg.clone();
  rightLeg.position.x = 0.085;
  rightLeg.rotation.z = -0.02;
  group.add(leftLeg, rightLeg);

  const shoeGeo = new THREE.BoxGeometry(0.13, 0.06, 0.25);
  const leftShoe = makeMesh(shoeGeo, materials.shoes, "shoe_l");
  leftShoe.position.set(-0.094, 0.042, 0.055);
  leftShoe.rotation.x = 0.04;
  const rightShoe = leftShoe.clone();
  rightShoe.position.x = 0.094;
  group.add(leftShoe, rightShoe);

  return group;
}

function buildJunior({ hero = false, mobile = false } = {}) {
  const detail = hero ? 3 : mobile ? 1 : 2;
  const root = new THREE.Group();
  root.name = hero ? "junior_hero_closeup" : mobile ? "junior_runtime_mobile" : "junior_runtime";

  const materials = {
    skin: softPhysicalMaterial("skin_body", COLORS.skin, {
      roughness: 0.24,
      clearcoat: 0.34,
      clearcoatRoughness: 0.2,
      sheen: 0.82,
      sheenRoughness: 0.18,
      sheenColor: new THREE.Color("#ffc9a8"),
    }),
    skinFace: softPhysicalMaterial("skin_face", COLORS.skinFace, {
      roughness: 0.16,
      clearcoat: 0.46,
      clearcoatRoughness: 0.16,
      sheen: 0.9,
      sheenRoughness: 0.14,
      sheenColor: new THREE.Color("#ffd1b2"),
    }),
    blush: softPhysicalMaterial("skin_face", COLORS.blush, {
      roughness: 0.6,
      clearcoat: 0.02,
      sheen: 0,
    }),
    hair: softPhysicalMaterial("hair_cards", COLORS.hair, {
      roughness: 0.14,
      clearcoat: 0.78,
      clearcoatRoughness: 0.1,
      sheen: 0.36,
      sheenRoughness: 0.16,
      sheenColor: new THREE.Color("#9b795c"),
    }),
    hairWarm: softPhysicalMaterial("hair_cards", COLORS.hairWarm, {
      roughness: 0.2,
      clearcoat: 0.56,
      clearcoatRoughness: 0.14,
      sheen: 0.28,
    }),
    shirt: softPhysicalMaterial("shirt_white", COLORS.shirt, {
      roughness: 0.42,
      clearcoat: 0.18,
      clearcoatRoughness: 0.28,
    }),
    shirtShadow: softPhysicalMaterial("shirt_white", COLORS.shirtShadow, {
      roughness: 0.46,
      clearcoat: 0.12,
      clearcoatRoughness: 0.3,
    }),
    denim: softPhysicalMaterial("shorts_denim", COLORS.denim, {
      roughness: 0.68,
      clearcoat: 0.08,
      clearcoatRoughness: 0.34,
    }),
    shoes: softPhysicalMaterial("shoes", COLORS.shoes, {
      roughness: 0.52,
      clearcoat: 0.12,
      clearcoatRoughness: 0.38,
    }),
    scrunchie: softPhysicalMaterial("scrunchie", COLORS.scrunchie, {
      roughness: 0.38,
      clearcoat: 0.24,
      clearcoatRoughness: 0.2,
    }),
    eyeWhite: softPhysicalMaterial("skin_face", COLORS.eyeWhite, {
      roughness: 0.22,
      clearcoat: 0.08,
      sheen: 0,
    }),
    iris: softPhysicalMaterial("skin_face", COLORS.iris, {
      roughness: 0.34,
      clearcoat: 0.1,
      sheen: 0,
    }),
    brow: softPhysicalMaterial("hair_cards", COLORS.brow, {
      roughness: 0.42,
      clearcoat: 0.06,
      sheen: 0,
    }),
    lip: softPhysicalMaterial("skin_face", COLORS.lip, {
      roughness: 0.5,
      clearcoat: 0.08,
      sheen: 0,
    }),
  };

  root.add(createUpperBody(materials, detail, { hero }));
  if (!hero) root.add(createLowerBody(materials, mobile));
  root.add(createHead(detail, materials));
  root.add(createHair(detail, materials, { hero }));

  if (hero) {
    root.position.set(0, 0, 0);
  } else if (mobile) {
    root.scale.setScalar(0.99);
  }

  root.userData.characterId = "junior2005";
  root.userData.variant = hero ? "hero_closeup" : mobile ? "mobile" : "runtime";
  return root;
}

async function exportVariant(fileName, options) {
  const scene = new THREE.Scene();
  const character = buildJunior(options);
  scene.add(character);

  const exporter = new GLTFExporter();
  const result = await new Promise((resolve, reject) => {
    exporter.parse(
      scene,
      resolve,
      reject,
      {
        binary: true,
        onlyVisible: true,
        includeCustomExtensions: false,
        trs: false,
      },
    );
  });

  const outputBuffer =
    result instanceof ArrayBuffer
      ? Buffer.from(result)
      : Buffer.from(JSON.stringify(result, null, 2));

  await writeFile(path.join(exportDir, fileName), outputBuffer);
}

async function main() {
  await mkdir(exportDir, { recursive: true });
  await exportVariant("junior_2005_runtime.glb", { hero: false, mobile: false });
  await exportVariant("junior_2005_hero_closeup.glb", { hero: true, mobile: false });
  await exportVariant("junior_2005_runtime_mobile.glb", {
    hero: false,
    mobile: true,
  });
  await writeFile(
    path.join(exportDir, "junior_2005_export_manifest.json"),
    JSON.stringify(
      {
        characterId: "junior2005",
        source: "tools/generate_junior_glb.mjs",
        exports: [
          "junior_2005_runtime.glb",
          "junior_2005_hero_closeup.glb",
          "junior_2005_runtime_mobile.glb",
        ],
      },
      null,
      2,
    ),
  );
  console.log("Generated junior GLB exports in", exportDir);
}

await main();
