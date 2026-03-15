import * as THREE from "./vendor-three.module.js";
import { WORLD } from "./data.js";

export const WORLD_SCALE = 1 / 80;

const FLOOR_Y = 0;
const PLAYER_EYE = 1.62;

const tempVecA = new THREE.Vector3();
const tempVecB = new THREE.Vector3();
const tempVecC = new THREE.Vector3();
const tempBox = new THREE.Box3();

function scaled(value) {
  return value * WORLD_SCALE;
}

function worldPoint(x, y, z) {
  return new THREE.Vector3(scaled(x), scaled(y), scaled(z));
}

function makeFaceTexture({ female = false } = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 320;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, 320, 320);

  const skinGradient = ctx.createRadialGradient(160, 132, 24, 160, 188, 164);
  skinGradient.addColorStop(0, female ? "rgba(255,237,230,.3)" : "rgba(255,234,224,.22)");
  skinGradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = skinGradient;
  ctx.fillRect(0, 0, 320, 320);

  ctx.strokeStyle = female ? "rgba(82,48,47,.7)" : "rgba(74,43,40,.72)";
  ctx.lineWidth = female ? 6 : 7;
  ctx.beginPath();
  ctx.moveTo(86, 116);
  ctx.quadraticCurveTo(114, female ? 94 : 100, 140, 110);
  ctx.moveTo(180, 110);
  ctx.quadraticCurveTo(208, female ? 94 : 100, 236, 116);
  ctx.stroke();

  ctx.fillStyle = "#24191a";
  ctx.beginPath();
  ctx.ellipse(112, 146, 15, 12, -0.06, 0, Math.PI * 2);
  ctx.ellipse(208, 146, 15, 12, 0.06, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = female ? "#3f231f" : "#35201d";
  ctx.beginPath();
  ctx.ellipse(112, 146, 6, 7, 0, 0, Math.PI * 2);
  ctx.ellipse(208, 146, 6, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  if (female) {
    ctx.strokeStyle = "rgba(39,20,18,.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(96, 154);
    ctx.quadraticCurveTo(112, 162, 128, 154);
    ctx.moveTo(192, 154);
    ctx.quadraticCurveTo(208, 162, 224, 154);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(255,255,255,.92)";
  ctx.beginPath();
  ctx.ellipse(106, 142, 3, 3, 0, 0, Math.PI * 2);
  ctx.ellipse(202, 142, 3, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(144,97,91,.52)";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(160, 146);
  ctx.quadraticCurveTo(172, 180, 156, 194);
  ctx.stroke();

  ctx.fillStyle = female ? "rgba(232,164,174,.2)" : "rgba(196,126,120,.14)";
  ctx.beginPath();
  ctx.ellipse(102, 188, 22, 14, 0, 0, Math.PI * 2);
  ctx.ellipse(218, 188, 22, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = female ? "rgba(176,86,112,.92)" : "rgba(126,82,76,.86)";
  ctx.lineWidth = female ? 7 : 6;
  ctx.beginPath();
  ctx.moveTo(116, 236);
  ctx.quadraticCurveTo(160, 258, 208, 236);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,.18)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(126, 234);
  ctx.quadraticCurveTo(160, 248, 194, 234);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createFacePlane(texture) {
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(0.31, 0.31), material);
  plane.position.set(0, 0.01, 0.184);
  return plane;
}

function setShadow(object, cast = true, receive = true) {
  object.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = cast;
      child.receiveShadow = receive;
    }
  });
}

function createGlowPlane(color, width, height, opacity = 0.35) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(128, 128, 12, 128, 128, 120);
  gradient.addColorStop(0, color.replace("1)", `${opacity})`));
  gradient.addColorStop(0.35, color.replace("1)", `${opacity * 0.4})`));
  gradient.addColorStop(1, color.replace("1)", "0)"));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
}

function createPerson(spec) {
  const group = new THREE.Group();
  group.userData.baseY = 0;

  const torsoMat = new THREE.MeshStandardMaterial({ color: spec.torso, roughness: 0.72, metalness: 0.04 });
  const accentMat = new THREE.MeshStandardMaterial({ color: spec.torsoAccent ?? spec.torso, roughness: 0.66, metalness: 0.06 });
  const legsMat = new THREE.MeshStandardMaterial({ color: spec.legs, roughness: 0.82, metalness: 0.03 });
  const skinMat = new THREE.MeshStandardMaterial({ color: spec.skin, roughness: 0.82, metalness: 0.01 });
  const hairMat = new THREE.MeshStandardMaterial({ color: spec.hair, roughness: 0.7, metalness: 0.08 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: spec.shoes, roughness: 0.88, metalness: 0.08 });

  const waist = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.16, 4, 10), torsoMat);
  waist.position.set(0, 0.86, 0);
  waist.scale.set(1.16, 1.06, 0.9);
  group.add(waist);

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(spec.female ? 0.185 : 0.176, 0.58, 7, 14), torsoMat);
  torso.position.set(0, 1.1, 0);
  torso.scale.set(spec.female ? 1.0 : 1.03, 1.04, 0.88);
  group.add(torso);

  const chest = new THREE.Mesh(new THREE.SphereGeometry(spec.female ? 0.2 : 0.16, 20, 20), accentMat);
  chest.position.set(0, 1.14, 0.03);
  chest.scale.set(1.08, spec.female ? 0.72 : 0.62, 0.58);
  group.add(chest);

  const skirtOrHip = new THREE.Mesh(
    new THREE.CylinderGeometry(spec.female ? 0.18 : 0.165, spec.female ? 0.22 : 0.18, spec.female ? 0.28 : 0.2, 14),
    legsMat
  );
  skirtOrHip.position.set(0, spec.female ? 0.71 : 0.75, 0);
  group.add(skirtOrHip);

  const legGeo = new THREE.CapsuleGeometry(spec.female ? 0.073 : 0.079, spec.female ? 0.66 : 0.6, 6, 10);
  const leftLeg = new THREE.Mesh(legGeo, skinMat);
  leftLeg.position.set(-0.1, 0.33, 0.01);
  leftLeg.rotation.z = 0.02;
  const rightLeg = leftLeg.clone();
  rightLeg.position.x = 0.1;
  rightLeg.rotation.z = -0.02;
  group.add(leftLeg, rightLeg);

  const shorts = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.18, 0.26), legsMat);
  shorts.position.set(0, 0.64, 0.01);
  group.add(shorts);

  const shoeGeo = new THREE.BoxGeometry(0.14, 0.07, 0.28);
  const shoeL = new THREE.Mesh(shoeGeo, shoeMat);
  shoeL.position.set(-0.11, 0.045, 0.065);
  shoeL.rotation.x = 0.04;
  const shoeR = shoeL.clone();
  shoeR.position.x = 0.11;
  group.add(shoeL, shoeR);

  const shoulderL = new THREE.Mesh(new THREE.SphereGeometry(0.1, 18, 18), torsoMat);
  shoulderL.position.set(-0.22, 1.2, 0);
  const shoulderR = shoulderL.clone();
  shoulderR.position.x = 0.22;
  group.add(shoulderL, shoulderR);

  const armGeo = new THREE.CapsuleGeometry(0.055, 0.4, 5, 10);
  const leftArm = new THREE.Mesh(armGeo, skinMat);
  leftArm.position.set(-0.25, 1.0, 0.02);
  leftArm.rotation.z = 0.16;
  const rightArm = leftArm.clone();
  rightArm.position.x = 0.25;
  rightArm.rotation.z = -0.16;
  group.add(leftArm, rightArm);

  const sleeveGeo = new THREE.CylinderGeometry(0.08, 0.085, 0.22, 12);
  const leftSleeve = new THREE.Mesh(sleeveGeo, accentMat);
  leftSleeve.position.set(-0.21, 1.1, 0.02);
  leftSleeve.rotation.z = 1.1;
  const rightSleeve = leftSleeve.clone();
  rightSleeve.position.x = 0.21;
  rightSleeve.rotation.z = -1.1;
  group.add(leftSleeve, rightSleeve);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.08, 0.14, 18), skinMat);
  neck.position.set(0, 1.34, 0.02);
  group.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(spec.female ? 0.176 : 0.182, 30, 30), skinMat);
  head.position.set(0, 1.58, 0);
  head.scale.set(0.98, 1.08, 0.93);
  group.add(head);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.062, 12), skinMat);
  nose.position.set(0, 1.56, 0.162);
  nose.rotation.x = Math.PI * 0.5;
  group.add(nose);

  const lip = new THREE.Mesh(
    new THREE.TorusGeometry(0.045, 0.009, 8, 18, Math.PI),
    new THREE.MeshStandardMaterial({ color: spec.female ? "#cc7282" : "#ae7670", roughness: 0.5, metalness: 0.03 })
  );
  lip.position.set(0, 1.48, 0.155);
  lip.rotation.x = Math.PI;
  group.add(lip);

  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(spec.female ? 0.194 : 0.188, 28, 28, 0, Math.PI * 2, 0, Math.PI * 0.72),
    hairMat
  );
  hairCap.position.set(0, 1.64, -0.01);
  hairCap.rotation.x = -0.1;
  group.add(hairCap);

  const hairBack = new THREE.Mesh(new THREE.SphereGeometry(spec.female ? 0.204 : 0.186, 26, 26), hairMat);
  hairBack.position.set(0, spec.female ? 1.54 : 1.6, -0.08);
  hairBack.scale.set(0.94, spec.female ? 1.18 : 0.86, 0.72);
  group.add(hairBack);

  const fringe = new THREE.Mesh(new THREE.BoxGeometry(spec.female ? 0.22 : 0.18, 0.08, 0.05), hairMat);
  fringe.position.set(0, 1.64, 0.13);
  group.add(fringe);

  const sideHairL = new THREE.Mesh(new THREE.BoxGeometry(spec.female ? 0.08 : 0.06, spec.female ? 0.36 : 0.2, 0.07), hairMat);
  sideHairL.position.set(-0.15, spec.female ? 1.48 : 1.52, 0.02);
  const sideHairR = sideHairL.clone();
  sideHairR.position.x = 0.15;
  group.add(sideHairL, sideHairR);

  const face = createFacePlane(makeFaceTexture({ female: spec.female }));
  face.position.y = 1.58;
  group.add(face);

  if (spec.highlight) {
    const glow = createGlowPlane("rgba(255,234,184,1)", 1.2, 1.8, 0.28);
    glow.position.set(0.14, 1.18, -0.1);
    group.add(glow);
    group.userData.glow = glow;
  }

  if (spec.echo) {
    group.traverse((child) => {
      if (child.isMesh) {
        child.material = child.material.clone();
        child.material.transparent = true;
        child.material.opacity = spec.echoOpacity ?? 0.35;
        child.material.emissive = new THREE.Color(spec.echoColor ?? "#ffcfb1");
        child.material.emissiveIntensity = 0.16;
      }
    });
  }

  setShadow(group);
  return group;
}

function createTree({ scale: treeScale = 1 }) {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09 * treeScale, 0.14 * treeScale, 1.25 * treeScale, 10),
    new THREE.MeshStandardMaterial({ color: "#6e4b34", roughness: 0.92, metalness: 0.02 })
  );
  trunk.position.y = 0.62 * treeScale;
  group.add(trunk);

  const leafMat = new THREE.MeshStandardMaterial({ color: "#557b49", roughness: 0.98, metalness: 0.01 });
  [
    [0, 1.66, 0, 0.68, 0.88, 0.64],
    [-0.24, 1.48, 0.08, 0.54, 0.62, 0.5],
    [0.28, 1.54, -0.06, 0.58, 0.68, 0.54],
    [0.02, 1.92, -0.1, 0.48, 0.44, 0.42],
  ].forEach(([x, y, z, sx, sy, sz]) => {
    const cluster = new THREE.Mesh(new THREE.SphereGeometry(0.44 * treeScale, 18, 18), leafMat);
    cluster.position.set(x * treeScale, y * treeScale, z * treeScale);
    cluster.scale.set(sx, sy, sz);
    group.add(cluster);
  });

  setShadow(group);
  return group;
}

function buildCanvasTexture(width, height, draw, repeatX = 1, repeatY = 1) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  draw(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  return texture;
}

function makeConcreteTexture({ base, accent, line, warm = false } = {}) {
  return buildCanvasTexture(
    512,
    512,
    (ctx, width, height) => {
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, width, height);
      for (let index = 0; index < 1200; index += 1) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const alpha = 0.04 + Math.random() * 0.08;
        ctx.fillStyle = warm ? `rgba(165,142,118,${alpha})` : `rgba(116,128,144,${alpha})`;
        ctx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2);
      }
      ctx.strokeStyle = line;
      ctx.lineWidth = 1;
      for (let index = 0; index < 9; index += 1) {
        const y = (height / 9) * index + 8;
        ctx.globalAlpha = 0.1;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y + (Math.random() * 8 - 4));
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = accent;
      ctx.fillRect(0, height - 10, width, 10);
    },
    3.5,
    3.5
  );
}

function makeTileTexture({ base, line, speck } = {}) {
  return buildCanvasTexture(
    512,
    512,
    (ctx, width, height) => {
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, width, height);
      const tile = 84;
      ctx.strokeStyle = line;
      ctx.lineWidth = 3;
      for (let x = 0; x <= width; x += tile) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += tile) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      for (let index = 0; index < 1600; index += 1) {
        ctx.fillStyle = `${speck}${(0.05 + Math.random() * 0.08).toFixed(2)})`;
        ctx.fillRect(Math.random() * width, Math.random() * height, 1.5, 1.5);
      }
    },
    4,
    6
  );
}

function makeWoodTexture({ base, dark, highlight } = {}) {
  return buildCanvasTexture(
    512,
    512,
    (ctx, width, height) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, highlight);
      gradient.addColorStop(0.42, base);
      gradient.addColorStop(1, dark);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      for (let index = 0; index < 80; index += 1) {
        const y = Math.random() * height;
        ctx.strokeStyle = `rgba(74,45,24,${0.08 + Math.random() * 0.1})`;
        ctx.lineWidth = 1 + Math.random() * 2;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(width * 0.3, y + Math.random() * 16, width * 0.7, y - Math.random() * 16, width, y + Math.random() * 8);
        ctx.stroke();
      }
      for (let index = 0; index < 14; index += 1) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        ctx.strokeStyle = "rgba(58,33,18,.16)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(x, y, 18 + Math.random() * 16, 10 + Math.random() * 8, Math.random(), 0, Math.PI * 2);
        ctx.stroke();
      }
    },
    3,
    6
  );
}

function makeBoardTexture() {
  return buildCanvasTexture(
    512,
    512,
    (ctx, width, height) => {
      ctx.fillStyle = "#29453a";
      ctx.fillRect(0, 0, width, height);
      for (let index = 0; index < 120; index += 1) {
        ctx.fillStyle = `rgba(255,255,255,${0.01 + Math.random() * 0.02})`;
        ctx.fillRect(Math.random() * width, Math.random() * height, 12 + Math.random() * 48, 1 + Math.random() * 2);
      }
      ctx.strokeStyle = "rgba(214,226,218,.12)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(36, 102);
      ctx.lineTo(196, 114);
      ctx.moveTo(218, 180);
      ctx.lineTo(468, 162);
      ctx.moveTo(128, 322);
      ctx.lineTo(404, 336);
      ctx.stroke();
    },
    1.4,
    1.2
  );
}

function buildTextPlane(text, width = 0.82, height = 0.26, { bg = "#44505f", fg = "#f7ecd1" } = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 160);
  ctx.fillStyle = fg;
  ctx.font = "600 86px DM Mono";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 256, 88);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.7,
    metalness: 0.02,
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
}

function addCollider(colliders, minX, maxX, minZ, maxZ, label) {
  colliders.push({ minX, maxX, minZ, maxZ, label });
}

function addBox(scene, occluders, geometry, material, position, rotation, colliders, collider, castShadow = true, receiveShadow = true) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);
  if (rotation) {
    mesh.rotation.set(rotation.x, rotation.y, rotation.z);
  }
  mesh.castShadow = castShadow;
  mesh.receiveShadow = receiveShadow;
  scene.add(mesh);
  if (collider) {
    addCollider(colliders, collider.minX, collider.maxX, collider.minZ, collider.maxZ, collider.label);
  }
  if (!mesh.material.transparent) {
    occluders.push(mesh);
  }
  return mesh;
}

function createRing(color = 0xfbe3b8) {
  const group = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.18, 0.014, 12, 32),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.14 })
  );
  ring.rotation.x = Math.PI / 2;
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18 })
  );
  group.add(ring, core);
  group.visible = false;
  return group;
}

function buildIntroCurve() {
  return new THREE.CatmullRomCurve3([
    new THREE.Vector3(-15.2, 7.8, -13.8),
    new THREE.Vector3(-14.1, 7.2, -8.2),
    new THREE.Vector3(-12.6, 6.5, -1.4),
    new THREE.Vector3(-11.4, 5.2, 5.8),
    new THREE.Vector3(-10.6, 4.5, 11.4),
    new THREE.Vector3(-9.4, 3.9, 17.2),
    new THREE.Vector3(-8.0, 3.2, 21.6),
    new THREE.Vector3(-6.8, 2.42, 25.6),
    new THREE.Vector3(-5.8, 1.96, 28.7),
    new THREE.Vector3(-5.12, 1.78, 31.2),
  ]);
}

export function createLm402Scene(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#cbd8e6");
  scene.fog = new THREE.Fog("#d3dee8", 10, 36);

  const camera = new THREE.PerspectiveCamera(67, 1, 0.03, 120);
  camera.rotation.order = "YXZ";

  const raycaster = new THREE.Raycaster();
  const occluders = [];
  const colliders = [];
  const hotspotNodes = new Map();
  const hotspotLabels = new Map();

  const worldGroup = new THREE.Group();
  const actorGroup = new THREE.Group();
  const introGroup = new THREE.Group();
  const glowGroup = new THREE.Group();
  scene.add(worldGroup, actorGroup, introGroup, glowGroup);

  const hemiLight = new THREE.HemisphereLight(0xe8eef7, 0x655343, 1.08);
  scene.add(hemiLight);

  const ambient = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xffe0ad, 2.55);
  sun.position.set(7.6, 9.2, 4.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 40;
  sun.shadow.camera.left = -12;
  sun.shadow.camera.right = 12;
  sun.shadow.camera.top = 12;
  sun.shadow.camera.bottom = -12;
  scene.add(sun);

  const corridorFill = new THREE.PointLight(0x8ea7cc, 0.78, 20, 2);
  corridorFill.position.set(-7.2, 2.5, 7.8);
  scene.add(corridorFill);

  const exteriorBounce = new THREE.PointLight(0xfff0c8, 0.72, 16, 2);
  exteriorBounce.position.set(-10.2, 2.4, 10.8);
  scene.add(exteriorBounce);

  const classroomAccent = new THREE.PointLight(0xffd6ad, 0.44, 12, 2);
  classroomAccent.position.set(3.8, 1.9, 12.8);
  scene.add(classroomAccent);

  const classroomFloorTex = makeWoodTexture({ base: "#8a694c", dark: "#5d422c", highlight: "#a98562" });
  const corridorFloorTex = makeTileTexture({ base: "#b3bcc8", line: "rgba(229,235,240,.72)", speck: "rgba(124,136,148," });
  const wallTex = makeConcreteTexture({ base: "#e5e1d7", accent: "rgba(255,255,255,.12)", line: "rgba(168,155,136,.22)", warm: true });
  const corridorWallTex = makeConcreteTexture({ base: "#cad3dd", accent: "rgba(255,255,255,.12)", line: "rgba(132,145,160,.22)" });
  const stoneTex = makeConcreteTexture({ base: "#d7d2c8", accent: "rgba(255,255,255,.12)", line: "rgba(126,118,104,.2)", warm: true });
  const woodTex = makeWoodTexture({ base: "#8d653c", dark: "#5c3d22", highlight: "#aa8257" });
  const boardTex = makeBoardTexture();
  const lawnTex = makeConcreteTexture({ base: "#708e5d", accent: "rgba(255,255,255,.02)", line: "rgba(86,112,72,.16)", warm: true });
  const plazaTex = makeTileTexture({ base: "#c6ccd3", line: "rgba(243,246,248,.7)", speck: "rgba(128,136,146," });

  const classroomFloorMat = new THREE.MeshStandardMaterial({ color: "#816448", map: classroomFloorTex, roughness: 0.92, metalness: 0.02 });
  const corridorFloorMat = new THREE.MeshStandardMaterial({ color: "#b0bac8", map: corridorFloorTex, roughness: 0.88, metalness: 0.02 });
  const wallMat = new THREE.MeshStandardMaterial({ color: "#e3dfd6", map: wallTex, roughness: 0.94, metalness: 0.01 });
  const corridorWallMat = new THREE.MeshStandardMaterial({ color: "#c6d0dc", map: corridorWallTex, roughness: 0.92, metalness: 0.02 });
  const woodMat = new THREE.MeshStandardMaterial({ color: "#8a643b", map: woodTex, roughness: 0.82, metalness: 0.04 });
  const metalMat = new THREE.MeshStandardMaterial({ color: "#7c7f85", roughness: 0.6, metalness: 0.34 });
  const boardMat = new THREE.MeshStandardMaterial({ color: "#29453a", map: boardTex, roughness: 0.88, metalness: 0.02 });
  const stoneMat = new THREE.MeshStandardMaterial({ color: "#d4d0c7", map: stoneTex, roughness: 0.92, metalness: 0.03 });
  const beamMat = new THREE.MeshStandardMaterial({ color: "#ece8df", map: wallTex, roughness: 0.88, metalness: 0.02 });
  const lawnMat = new THREE.MeshStandardMaterial({ color: "#708e5d", map: lawnTex, roughness: 1, metalness: 0.01 });
  const plazaMat = new THREE.MeshStandardMaterial({ color: "#c3c9cf", map: plazaTex, roughness: 0.96, metalness: 0.02 });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: "#fff6d8",
    roughness: 0.08,
    transmission: 0.62,
    transparent: true,
    opacity: 0.34,
    thickness: 0.08,
  });

  const minX = scaled(WORLD.minX);
  const maxX = scaled(WORLD.maxX);
  const minZ = scaled(WORLD.minZ);
  const maxZ = scaled(WORLD.maxZ);
  const dividerX = scaled(WORLD.dividerX);
  const corridorMinX = minX;
  const corridorMaxX = dividerX;
  const classroomMinX = dividerX;
  const classroomMaxX = maxX;
  const corridorCenterX = (corridorMinX + corridorMaxX) / 2;
  const corridorWidth = corridorMaxX - corridorMinX;
  const classroomCenterX = (classroomMinX + classroomMaxX) / 2;
  const classroomWidth = classroomMaxX - classroomMinX;
  const length = Math.abs(maxZ - minZ);
  const roomCenterZ = (minZ + maxZ) / 2;
  const corridorHeight = 2.88;
  const wallThickness = 0.12;
  const boardX = scaled(WORLD.board.x);
  const boardZ1 = scaled(WORLD.board.z1);
  const boardZ2 = scaled(WORLD.board.z2);

  addBox(
    worldGroup,
    occluders,
    new THREE.BoxGeometry(corridorWidth, 0.08, length),
    corridorFloorMat,
    new THREE.Vector3(corridorCenterX, FLOOR_Y - 0.04, roomCenterZ),
    null,
    colliders,
    null,
    false,
    true
  );
  addBox(
    worldGroup,
    occluders,
    new THREE.BoxGeometry(classroomWidth, 0.08, length),
    classroomFloorMat,
    new THREE.Vector3(classroomCenterX, FLOOR_Y - 0.04, roomCenterZ),
    null,
    colliders,
    null,
    false,
    true
  );

  const campusDepth = scaled(WORLD.corridor.campusDepth);
  addBox(
    worldGroup,
    [],
    new THREE.BoxGeometry(campusDepth, 0.1, length * 1.2),
    lawnMat,
    new THREE.Vector3(minX - campusDepth * 0.52, FLOOR_Y - 0.1, roomCenterZ),
    null,
    null,
    null,
    false,
    true
  );
  addBox(
    worldGroup,
    [],
    new THREE.BoxGeometry(campusDepth * 0.42, 0.06, length * 0.9),
    plazaMat,
    new THREE.Vector3(minX - campusDepth * 0.24, FLOOR_Y - 0.04, roomCenterZ + 0.4),
    null,
    null,
    null,
    false,
    true
  );

  const skyWall = new THREE.Mesh(
    new THREE.PlaneGeometry(length * 0.9, 7.4),
    new THREE.MeshBasicMaterial({ color: "#dce6f4", transparent: true, opacity: 0.92, side: THREE.DoubleSide })
  );
  skyWall.position.set(minX - campusDepth * 0.26, 3.1, roomCenterZ + 0.6);
  skyWall.rotation.y = Math.PI / 2;
  worldGroup.add(skyWall);

  const sunGlow = createGlowPlane("rgba(255,229,185,1)", 6.1, 4.8, 0.34);
  sunGlow.position.set(minX - campusDepth * 0.18, 3.5, scaled(612));
  sunGlow.rotation.y = Math.PI / 2;
  worldGroup.add(sunGlow);

  const treeGlow = createGlowPlane("rgba(255,241,208,1)", 4.6, 3.4, 0.16);
  treeGlow.position.set(minX - campusDepth * 0.14, 2.4, scaled(1040));
  treeGlow.rotation.y = Math.PI / 2;
  worldGroup.add(treeGlow);

  const buildingShell = new THREE.Mesh(
    new THREE.BoxGeometry(maxX - minX, 0.12, length),
    new THREE.MeshStandardMaterial({ color: "#efece4", map: wallTex, roughness: 0.94, metalness: 0.01 })
  );
  buildingShell.position.set((minX + maxX) / 2, corridorHeight + 0.06, roomCenterZ);
  buildingShell.receiveShadow = true;
  worldGroup.add(buildingShell);

  addBox(
    worldGroup,
    occluders,
    new THREE.BoxGeometry(maxX - minX, corridorHeight, wallThickness),
    wallMat,
    new THREE.Vector3((minX + maxX) / 2, corridorHeight / 2, minZ),
    null,
    colliders,
    { minX, maxX, minZ: minZ - wallThickness / 2, maxZ: minZ + wallThickness / 2, label: "front_wall" }
  );
  addBox(
    worldGroup,
    occluders,
    new THREE.BoxGeometry(maxX - minX, corridorHeight, wallThickness),
    wallMat,
    new THREE.Vector3((minX + maxX) / 2, corridorHeight / 2, maxZ),
    null,
    colliders,
    { minX, maxX, minZ: maxZ - wallThickness / 2, maxZ: maxZ + wallThickness / 2, label: "back_wall" }
  );

  const parapetHeight = scaled(WORLD.corridor.parapetHeight);
  addBox(
    worldGroup,
    occluders,
    new THREE.BoxGeometry(wallThickness, parapetHeight, length),
    stoneMat,
    new THREE.Vector3(minX, parapetHeight / 2, roomCenterZ),
    null,
    colliders,
    { minX: minX - wallThickness / 2, maxX: minX + wallThickness / 2, minZ, maxZ, label: "parapet" }
  );
  addBox(
    worldGroup,
    occluders,
    new THREE.BoxGeometry(0.18, 0.1, length),
    beamMat,
    new THREE.Vector3(minX + 0.06, parapetHeight + 0.06, roomCenterZ),
    null,
    colliders,
    null
  );

  addBox(
    worldGroup,
    [],
    new THREE.BoxGeometry(0.72, 0.012, length * 0.96),
    new THREE.MeshBasicMaterial({ color: "#fff1cf", transparent: true, opacity: 0.12 }),
    new THREE.Vector3(minX + 0.42, 0.014, roomCenterZ),
    { x: -Math.PI / 2, y: 0, z: 0 },
    null,
    null,
    false,
    false
  );

  WORLD.corridor.columnZs.forEach((zValue) => {
    const z = scaled(zValue);
    const column = new THREE.Mesh(new THREE.BoxGeometry(0.24, corridorHeight, 0.24), beamMat);
    column.position.set(minX + 0.08, corridorHeight / 2, z);
    column.castShadow = true;
    column.receiveShadow = true;
    worldGroup.add(column);
    addCollider(colliders, column.position.x - 0.12, column.position.x + 0.12, z - 0.12, z + 0.12, "column");
  });

  addBox(
    worldGroup,
    occluders,
    new THREE.BoxGeometry(0.18, 0.16, length),
    beamMat,
    new THREE.Vector3(classroomMinX, corridorHeight - 0.08, roomCenterZ),
    null,
    colliders,
    null
  );

  const dividerSegments = [
    [minZ, scaled(WORLD.frontDoor.z1)],
    [scaled(WORLD.frontDoor.z2), scaled(WORLD.leftRearWindows[0].z - WORLD.leftRearWindows[0].width / 2)],
    [scaled(WORLD.leftRearWindows[0].z + WORLD.leftRearWindows[0].width / 2), scaled(WORLD.backDoor.z1)],
    [scaled(WORLD.backDoor.z2), scaled(WORLD.leftRearWindows[1].z - WORLD.leftRearWindows[1].width / 2)],
    [scaled(WORLD.leftRearWindows[1].z + WORLD.leftRearWindows[1].width / 2), maxZ],
  ];
  dividerSegments.forEach(([start, end]) => {
    if (end <= start) {
      return;
    }
    const segmentLength = end - start;
    addBox(
      worldGroup,
      occluders,
      new THREE.BoxGeometry(wallThickness, corridorHeight, segmentLength),
      corridorWallMat,
      new THREE.Vector3(classroomMinX, corridorHeight / 2, start + segmentLength / 2),
      null,
      colliders,
      { minX: classroomMinX - wallThickness / 2, maxX: classroomMinX + wallThickness / 2, minZ: start, maxZ: end, label: "divider_wall" }
    );
  });

  [WORLD.frontDoor, WORLD.backDoor].forEach((door) => {
    const z1 = scaled(door.z1);
    const z2 = scaled(door.z2);
    const centerZ = (z1 + z2) / 2;
    const doorSpan = z2 - z1;
    addBox(
      worldGroup,
      occluders,
      new THREE.BoxGeometry(0.22, 2.28, 0.18),
      beamMat,
      new THREE.Vector3(classroomMinX - 0.02, 1.14, z1),
      null,
      colliders,
      { minX: classroomMinX - 0.14, maxX: classroomMinX + 0.08, minZ: z1 - 0.08, maxZ: z1 + 0.08, label: "door_frame" }
    );
    addBox(
      worldGroup,
      occluders,
      new THREE.BoxGeometry(0.22, 2.28, 0.18),
      beamMat,
      new THREE.Vector3(classroomMinX - 0.02, 1.14, z2),
      null,
      colliders,
      { minX: classroomMinX - 0.14, maxX: classroomMinX + 0.08, minZ: z2 - 0.08, maxZ: z2 + 0.08, label: "door_frame" }
    );
    addBox(
      worldGroup,
      occluders,
      new THREE.BoxGeometry(0.22, 0.16, doorSpan),
      beamMat,
      new THREE.Vector3(classroomMinX - 0.02, 2.28, centerZ),
      null,
      colliders,
      null
    );

    const doorLeaf = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 2.08, doorSpan * 0.88),
      new THREE.MeshStandardMaterial({ color: "#d9d6cf", map: wallTex, roughness: 0.84, metalness: 0.02 })
    );
    doorLeaf.position.set(classroomMinX + 0.34, 1.04, centerZ + (door === WORLD.frontDoor ? doorSpan * 0.18 : -doorSpan * 0.1));
    doorLeaf.rotation.y = door === WORLD.frontDoor ? -0.78 : 0.62;
    doorLeaf.castShadow = true;
    doorLeaf.receiveShadow = true;
    worldGroup.add(doorLeaf);
  });

  WORLD.leftRearWindows.forEach((panel) => {
    const centerZ = scaled(panel.z);
    const width = scaled(panel.width);
    const y1 = scaled(panel.y1);
    const y2 = scaled(panel.y2);
    const height = y2 - y1;
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(width, height), glassMat);
    glass.position.set(classroomMinX + 0.035, y1 + height / 2, centerZ);
    glass.rotation.y = Math.PI / 2;
    worldGroup.add(glass);
    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, width + 0.08), beamMat);
    frameTop.position.set(classroomMinX + 0.04, y2 + 0.04, centerZ);
    const frameBottom = frameTop.clone();
    frameBottom.position.y = y1 - 0.04;
    const frameStart = new THREE.Mesh(new THREE.BoxGeometry(0.08, height + 0.12, 0.08), beamMat);
    frameStart.position.set(classroomMinX + 0.04, y1 + height / 2, centerZ - width / 2);
    const frameEnd = frameStart.clone();
    frameEnd.position.z = centerZ + width / 2;
    worldGroup.add(frameTop, frameBottom, frameStart, frameEnd);
  });

  addBox(
    worldGroup,
    occluders,
    new THREE.BoxGeometry(wallThickness, corridorHeight, scaled(WORLD.board.z2 - WORLD.board.z1) + 0.2),
    wallMat,
    new THREE.Vector3(maxX, corridorHeight / 2, (boardZ1 + boardZ2) / 2),
    null,
    colliders,
    { minX: maxX - wallThickness / 2, maxX: maxX + wallThickness / 2, minZ: boardZ1 - 0.1, maxZ: boardZ2 + 0.1, label: "board_wall" }
  );

  const rightWindowSegments = [
    [boardZ2 + 0.16, scaled(WORLD.rightWindows[0].z - WORLD.rightWindows[0].width / 2)],
    [scaled(WORLD.rightWindows[0].z + WORLD.rightWindows[0].width / 2), scaled(WORLD.rightWindows[1].z - WORLD.rightWindows[1].width / 2)],
    [scaled(WORLD.rightWindows[1].z + WORLD.rightWindows[1].width / 2), scaled(WORLD.rightWindows[2].z - WORLD.rightWindows[2].width / 2)],
    [scaled(WORLD.rightWindows[2].z + WORLD.rightWindows[2].width / 2), maxZ],
  ];
  rightWindowSegments.forEach(([start, end]) => {
    if (end <= start) {
      return;
    }
    const segmentLength = end - start;
    addBox(
      worldGroup,
      occluders,
      new THREE.BoxGeometry(wallThickness, corridorHeight, segmentLength),
      wallMat,
      new THREE.Vector3(maxX, corridorHeight / 2, start + segmentLength / 2),
      null,
      colliders,
      { minX: maxX - wallThickness / 2, maxX: maxX + wallThickness / 2, minZ: start, maxZ: end, label: "window_wall" }
    );
  });

  WORLD.rightWindows.forEach((panel) => {
    const centerZ = scaled(panel.z);
    const width = scaled(panel.width);
    const y1 = scaled(panel.y1);
    const y2 = scaled(panel.y2);
    const height = y2 - y1;
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(width, height), glassMat);
    glass.position.set(maxX - 0.035, y1 + height / 2, centerZ);
    glass.rotation.y = -Math.PI / 2;
    worldGroup.add(glass);
    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, width + 0.08), beamMat);
    frameTop.position.set(maxX - 0.04, y2 + 0.04, centerZ);
    const frameBottom = frameTop.clone();
    frameBottom.position.y = y1 - 0.04;
    const frameStart = new THREE.Mesh(new THREE.BoxGeometry(0.08, height + 0.12, 0.08), beamMat);
    frameStart.position.set(maxX - 0.04, y1 + height / 2, centerZ - width / 2);
    const frameEnd = frameStart.clone();
    frameEnd.position.z = centerZ + width / 2;
    worldGroup.add(frameTop, frameBottom, frameStart, frameEnd);

    const sill = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, width + 0.14), stoneMat);
    sill.position.set(maxX - 0.11, y1 - 0.08, centerZ);
    sill.castShadow = true;
    sill.receiveShadow = true;
    worldGroup.add(sill);
  });

  addBox(
    worldGroup,
    occluders,
    new THREE.BoxGeometry(0.06, scaled(WORLD.board.y2 - WORLD.board.y1), scaled(WORLD.board.z2 - WORLD.board.z1)),
    boardMat,
    new THREE.Vector3(boardX - 0.02, scaled((WORLD.board.y1 + WORLD.board.y2) / 2), (boardZ1 + boardZ2) / 2),
    null,
    colliders,
    null
  );
  addBox(
    worldGroup,
    occluders,
    new THREE.BoxGeometry(0.16, 0.07, scaled(WORLD.board.z2 - WORLD.board.z1) + 0.18),
    beamMat,
    new THREE.Vector3(boardX - 0.1, scaled(WORLD.board.y1) - 0.12, (boardZ1 + boardZ2) / 2),
    null,
    colliders,
    null
  );

  const lectern = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.92, 0.56), woodMat);
  lectern.position.set(boardX - 0.96, 0.46, scaled(324));
  lectern.castShadow = true;
  lectern.receiveShadow = true;
  worldGroup.add(lectern);
  addCollider(colliders, lectern.position.x - 0.25, lectern.position.x + 0.25, lectern.position.z - 0.28, lectern.position.z + 0.28, "lectern");

  const clock = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.2, 0.05, 32),
    new THREE.MeshStandardMaterial({ color: "#f4eee4", roughness: 0.9, metalness: 0.02 })
  );
  clock.rotation.z = Math.PI / 2;
  clock.position.set(boardX - 0.12, 2.2, scaled(178));
  worldGroup.add(clock);

  const chalkTrayDust = new THREE.Mesh(
    new THREE.PlaneGeometry(2.1, 0.16),
    new THREE.MeshBasicMaterial({ color: "#f5ead8", transparent: true, opacity: 0.18 })
  );
  chalkTrayDust.position.set(boardX - 0.12, scaled(WORLD.board.y1) - 0.09, (boardZ1 + boardZ2) / 2);
  chalkTrayDust.rotation.x = -Math.PI / 2;
  chalkTrayDust.rotation.z = Math.PI / 2;
  worldGroup.add(chalkTrayDust);

  WORLD.lightBeams.forEach((beam) => {
    const beamMat = new THREE.MeshBasicMaterial({
      color: beam.side === "right" ? "#ffd992" : "#f4d9b7",
      transparent: true,
      opacity: beam.alpha * 0.68,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const geo = new THREE.PlaneGeometry(scaled(beam.reach), scaled(beam.width));
    const plane = new THREE.Mesh(geo, beamMat);
    if (beam.side === "right") {
      plane.position.set(maxX - scaled(beam.reach) * 0.48, 1.18, scaled(beam.z));
      plane.rotation.y = Math.PI / 2;
      plane.rotation.z = -0.46;
    } else {
      plane.position.set(classroomMinX + scaled(beam.reach) * 0.42, 1.16, scaled(beam.z));
      plane.rotation.y = Math.PI / 2;
      plane.rotation.z = 0.4;
    }
    worldGroup.add(plane);
  });

  WORLD.desks.forEach((desk, index) => {
    const x = scaled(desk.x);
    const z = scaled(desk.z);
    const deskGroup = new THREE.Group();
    deskGroup.position.set(x, 0, z);
    deskGroup.rotation.y = -Math.PI / 2;

    const top = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.08, 0.74), woodMat);
    top.position.set(0, 0.78, 0);
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.05, 0.22), woodMat);
    shelf.position.set(0.14, 0.46, 0);
    deskGroup.add(top, shelf);

    const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.05, 0.32), woodMat);
    chairSeat.position.set(-0.5, 0.48, 0);
    const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.36, 0.32), woodMat);
    chairBack.position.set(-0.64, 0.74, 0);
    deskGroup.add(chairSeat, chairBack);

    const legGeo = new THREE.BoxGeometry(0.06, 0.78, 0.06);
    [
      [-0.42, -0.26],
      [0.42, -0.26],
      [-0.42, 0.26],
      [0.42, 0.26],
    ].forEach(([dx, dz]) => {
      const leg = new THREE.Mesh(legGeo, metalMat);
      leg.position.set(dx, 0.39, dz);
      deskGroup.add(leg);
    });

    setShadow(deskGroup);
    worldGroup.add(deskGroup);
    addCollider(colliders, x - 0.48, x + 0.56, z - 0.46, z + 0.46, `desk_${index}`);
  });

  WORLD.notes.forEach((note) => {
    const page = new THREE.Mesh(
      new THREE.PlaneGeometry(0.24, 0.18),
      new THREE.MeshStandardMaterial({ color: "#f4efe6", roughness: 0.96, metalness: 0.01, side: THREE.DoubleSide })
    );
    page.rotation.x = -Math.PI / 2;
    page.position.set(scaled(note.x), scaled(note.y) + 0.01, scaled(note.z));
    worldGroup.add(page);
  });

  const plaque = buildTextPlane("LM402");
  plaque.position.copy(worldPoint(WORLD.plaque.x, WORLD.plaque.y, WORLD.plaque.z - 2));
  plaque.rotation.y = Math.PI / 2;
  worldGroup.add(plaque);

  WORLD.campusTrees.forEach((tree, index) => {
    const treeNode = createTree({ scale: tree.scale });
    treeNode.position.set(scaled(tree.x), 0, scaled(tree.z));
    treeNode.rotation.y = index * 0.7;
    worldGroup.add(treeNode);
  });

  const parapetShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.8, length * 0.9),
    new THREE.MeshBasicMaterial({ color: "#8392a3", transparent: true, opacity: 0.12, side: THREE.DoubleSide })
  );
  parapetShadow.position.set(minX + 0.96, 0.018, roomCenterZ);
  parapetShadow.rotation.x = -Math.PI / 2;
  worldGroup.add(parapetShadow);

  const distantBuilding = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 1.8, 10.2),
    new THREE.MeshStandardMaterial({ color: "#b0b6be", roughness: 0.96, metalness: 0.02 })
  );
  distantBuilding.position.set(minX - campusDepth * 0.38, 0.88, roomCenterZ + 0.6);
  distantBuilding.castShadow = false;
  distantBuilding.receiveShadow = true;
  worldGroup.add(distantBuilding);

  const dustGeometry = new THREE.BufferGeometry();
  const dustPositions = [];
  for (let index = 0; index < 160; index += 1) {
    dustPositions.push(
      THREE.MathUtils.lerp(minX + 0.24, maxX - 0.2, Math.random()),
      THREE.MathUtils.lerp(0.2, 2.7, Math.random()),
      THREE.MathUtils.lerp(minZ + 0.2, maxZ - 0.2, Math.random())
    );
  }
  dustGeometry.setAttribute("position", new THREE.Float32BufferAttribute(dustPositions, 3));
  const dustMaterial = new THREE.PointsMaterial({
    color: "#fff0d6",
    size: 0.035,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  });
  const dust = new THREE.Points(dustGeometry, dustMaterial);
  worldGroup.add(dust);

  const senior = createPerson({
    torso: "#425b78",
    torsoAccent: "#58759c",
    legs: "#151c26",
    skin: "#deb497",
    hair: "#251a19",
    shoes: "#1b1717",
    female: false,
  });
  const junior = createPerson({
    torso: "#f4f2ef",
    torsoAccent: "#fbfaf7",
    legs: "#7f9ed2",
    skin: "#efcab4",
    hair: "#1f1516",
    shoes: "#f7f0e8",
    female: true,
    highlight: true,
  });
  const fatherEcho = createPerson({
    torso: "#f4c39e",
    torsoAccent: "#ffd7b8",
    legs: "#ffe6d1",
    skin: "#f1c6aa",
    hair: "#533f3c",
    shoes: "#4b4040",
    female: false,
    echo: true,
    echoOpacity: 0.28,
    echoColor: "#ffd5b0",
  });
  const auntEcho = createPerson({
    torso: "#ffd8e4",
    torsoAccent: "#ffe7ee",
    legs: "#ffd8e4",
    skin: "#f0cab4",
    hair: "#5a4648",
    shoes: "#5a4749",
    female: true,
    echo: true,
    echoOpacity: 0.26,
    echoColor: "#ffc0d6",
  });
  actorGroup.add(senior, junior, fatherEcho, auntEcho);

  const hotspotColorMap = {
    scene: 0xfbe3b8,
    memory: 0x9ad8ff,
  };

  const hotspotMeta = [
    { id: "front_call", type: "scene" },
    { id: "plaque", type: "memory" },
    { id: "board", type: "memory" },
    { id: "seat", type: "memory" },
    { id: "notes", type: "memory" },
    { id: "junior", type: "scene" },
    { id: "backdoor", type: "scene" },
  ];
  hotspotMeta.forEach((meta) => {
    const ring = createRing(hotspotColorMap[meta.type]);
    hotspotNodes.set(meta.id, ring);
    glowGroup.add(ring);
  });

  const introCurve = buildIntroCurve();
  const introTube = new THREE.Mesh(
    new THREE.TubeGeometry(introCurve, 180, 0.06, 10, false),
    new THREE.MeshStandardMaterial({
      color: "#f1627d",
      emissive: "#f1627d",
      emissiveIntensity: 1.4,
      roughness: 0.2,
      metalness: 0.1,
      transparent: true,
      opacity: 0.96,
    })
  );
  introGroup.add(introTube);

  const introDaughter = createPerson({
    torso: "#f5d7cf",
    torsoAccent: "#fff0ea",
    legs: "#f3e4d8",
    skin: "#efcfbc",
    hair: "#2f2426",
    shoes: "#f7efe6",
    female: true,
  });
  introDaughter.scale.setScalar(0.94);
  introGroup.add(introDaughter);

  const introAura = createGlowPlane("rgba(255,116,142,1)", 1.8, 2.4, 0.44);
  introGroup.add(introAura);

  const introSpark = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 16, 16),
    new THREE.MeshBasicMaterial({ color: "#ffd8e6" })
  );
  introGroup.add(introSpark);

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    if (canvas.width !== width || canvas.height !== height) {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
  }

  function resolveMotion(current, desired, radius = 0.28) {
    let x = desired.x;
    let z = desired.z;
    let collided = false;
    let label = null;

    const boundaryMinX = minX + 0.26;
    const boundaryMaxX = maxX - 0.26;
    const boundaryMinZ = minZ + 0.22;
    const boundaryMaxZ = maxZ - 0.22;

    if (x < boundaryMinX || x > boundaryMaxX || z < boundaryMinZ || z > boundaryMaxZ) {
      collided = true;
      label = "boundary_wall";
    }
    x = THREE.MathUtils.clamp(x, boundaryMinX, boundaryMaxX);
    z = THREE.MathUtils.clamp(z, boundaryMinZ, boundaryMaxZ);

    for (let pass = 0; pass < 2; pass += 1) {
      colliders.forEach((box) => {
        const nearestX = THREE.MathUtils.clamp(x, box.minX, box.maxX);
        const nearestZ = THREE.MathUtils.clamp(z, box.minZ, box.maxZ);
        const dx = x - nearestX;
        const dz = z - nearestZ;
        const distSq = dx * dx + dz * dz;
        if (distSq >= radius * radius) {
          return;
        }
        collided = true;
        label = box.label;
        if (distSq > 0.00001) {
          const dist = Math.sqrt(distSq);
          const push = radius - dist + 0.001;
          x += (dx / dist) * push;
          z += (dz / dist) * push;
          return;
        }
        const pushLeft = Math.abs(x - box.minX);
        const pushRight = Math.abs(box.maxX - x);
        const pushBack = Math.abs(z - box.minZ);
        const pushFront = Math.abs(box.maxZ - z);
        const minPush = Math.min(pushLeft, pushRight, pushBack, pushFront);
        if (minPush === pushLeft) {
          x = box.minX - radius;
        } else if (minPush === pushRight) {
          x = box.maxX + radius;
        } else if (minPush === pushBack) {
          z = box.minZ - radius;
        } else {
          z = box.maxZ + radius;
        }
      });
      x = THREE.MathUtils.clamp(x, boundaryMinX, boundaryMaxX);
      z = THREE.MathUtils.clamp(z, boundaryMinZ, boundaryMaxZ);
    }

    return { x, z, collided, label };
  }

  function updateHotspots(hotspots, activeId, time) {
    hotspots.forEach((hotspot) => {
      const ring = hotspotNodes.get(hotspot.id);
      if (!ring) {
        return;
      }
      ring.visible = hotspot.visible;
      ring.position.set(hotspot.x, hotspot.y, hotspot.z);
      ring.position.y += Math.sin(time * 1.8 + hotspot.z * 0.15) * 0.05 + 0.18;
      ring.scale.setScalar(hotspot.id === activeId ? 1.04 : 0.8);
      ring.children[0].material.opacity = hotspot.id === activeId ? 0.48 : 0.1;
      ring.children[1].material.opacity = hotspot.id === activeId ? 0.3 : 0.1;
    });
  }

  function updateCharacters(game) {
    senior.position.set(game.characters.senior.x, 0, game.characters.senior.z);
    senior.rotation.y = game.characters.senior.rotationY ?? 0;
    junior.position.set(game.characters.junior.x, 0, game.characters.junior.z);
    junior.rotation.y = game.characters.junior.rotationY ?? 0;
    fatherEcho.position.set(game.characters.fatherEcho.x, 0, game.characters.fatherEcho.z);
    auntEcho.position.set(game.characters.auntEcho.x, 0, game.characters.auntEcho.z);
    fatherEcho.visible = game.characters.fatherEcho.alpha > 0.02;
    auntEcho.visible = game.characters.auntEcho.alpha > 0.02;
    fatherEcho.traverse((child) => {
      if (child.material) child.material.opacity = game.characters.fatherEcho.alpha;
    });
    auntEcho.traverse((child) => {
      if (child.material) child.material.opacity = game.characters.auntEcho.alpha;
    });
    if (junior.userData.glow) {
      junior.userData.glow.material.opacity = game.phase === "eye_contact" ? 0.42 + game.cinematicGlow * 0.18 : 0.24;
    }
  }

  function applyPlayerCamera(player) {
    camera.position.set(player.x, PLAYER_EYE, player.z);
    camera.rotation.y = player.yaw;
    camera.rotation.x = player.pitch;
  }

  function applyIntroCamera(intro) {
    const progress = THREE.MathUtils.clamp(intro.progress, 0, 1);
    const cameraT = THREE.MathUtils.smoothstep(progress, 0.02, 0.94);
    const targetT = THREE.MathUtils.clamp(cameraT + 0.08, 0, 1);
    const camPos = introCurve.getPoint(cameraT);
    const target = introCurve.getPoint(targetT);
    camera.position.copy(camPos);
    const lookX = THREE.MathUtils.lerp(target.x + 0.96, target.x + 0.18, THREE.MathUtils.smoothstep(progress, 0.34, 0.96));
    const lookY = THREE.MathUtils.lerp(2.22, 1.48, progress);
    const lookZ = target.z + THREE.MathUtils.lerp(0.72, 0.12, progress);
    camera.lookAt(lookX, lookY, lookZ);

    introGroup.visible = true;
    introTube.material.opacity = THREE.MathUtils.lerp(0.84, 0.18, progress);
    introTube.material.emissiveIntensity = THREE.MathUtils.lerp(1.5, 0.48, progress);
    const daughterT = THREE.MathUtils.clamp(progress + 0.04, 0, 1);
    const daughterPos = introCurve.getPoint(daughterT);
    const daughterNext = introCurve.getPoint(THREE.MathUtils.clamp(daughterT + 0.02, 0, 1));
    introDaughter.position.copy(daughterPos).add(new THREE.Vector3(0, Math.sin(progress * Math.PI * 5) * 0.08, 0));
    introDaughter.lookAt(daughterNext);
    introDaughter.rotateY(Math.PI);
    introAura.position.copy(daughterPos).add(new THREE.Vector3(0, 0.32, -0.18));
    introAura.lookAt(camera.position);
    introAura.material.opacity = THREE.MathUtils.lerp(0.48, 0.2, progress);
    introSpark.position.copy(introCurve.getPoint(THREE.MathUtils.clamp(progress + 0.08, 0, 1)));
  }

  function pickHotspot(candidates, player, activeId) {
    applyPlayerCamera(player);
    camera.updateMatrixWorld();
    const cameraDir = camera.getWorldDirection(tempVecA);
    let best = null;

    candidates.forEach((hotspot) => {
      const ring = hotspotNodes.get(hotspot.id);
      if (!ring || !hotspot.visible) {
        return;
      }
      const dist = camera.position.distanceTo(ring.position);
      if (dist > hotspot.radius) {
        return;
      }
      const toHotspot = tempVecB.copy(ring.position).sub(camera.position).normalize();
      const facing = cameraDir.dot(toHotspot);
      if (facing < 0.78) {
        return;
      }
      raycaster.set(camera.position, toHotspot);
      const hits = raycaster.intersectObjects(occluders, false);
      if (hits.length && hits[0].distance < dist - 0.18) {
        return;
      }
      const score = facing * 2.2 - dist;
      if (!best || score > best.score || (hotspot.id === activeId && score > best.score - 0.2)) {
        best = { id: hotspot.id, score, distance: dist, label: hotspot.label, prompt: hotspot.prompt };
      }
    });

    return best;
  }

  function getDebugSnapshot() {
    return {
      camera: {
        x: Number(camera.position.x.toFixed(3)),
        y: Number(camera.position.y.toFixed(3)),
        z: Number(camera.position.z.toFixed(3)),
        yaw: Number(camera.rotation.y.toFixed(3)),
        pitch: Number(camera.rotation.x.toFixed(3)),
      },
      colliders: colliders.length,
    };
  }

  function render(game) {
    resize();
    const time = game.time ?? 0;
    updateCharacters(game);
    updateHotspots(game.hotspots, game.activeHotspotId, time);

    const isIntro = game.mode === "intro";
    if (isIntro) {
      applyIntroCamera(game.intro);
    } else {
      introGroup.visible = false;
      applyPlayerCamera(game.player);
    }

    const daylight = isIntro ? THREE.MathUtils.lerp(0.38, 1, game.intro.progress) : 1;
    sun.intensity = 1.48 * daylight + (game.phase === "eye_contact" ? 0.28 : 0);
    ambient.intensity = 0.2 + daylight * 0.14;
    corridorFill.intensity = isIntro ? 0.52 : 0.72;
    exteriorBounce.intensity = isIntro ? 0.32 : 0.72;
    classroomAccent.intensity = game.phase === "eye_contact" ? 0.82 : 0.42;
    scene.background.setStyle(isIntro ? "#090d16" : "#dbe7f1");
    scene.fog.color.setStyle(isIntro ? "#121722" : "#d8e2eb");
    scene.fog.near = isIntro ? 2.5 : 12;
    scene.fog.far = isIntro ? 18 : 44;

    dust.rotation.y = time * 0.02;
    dust.position.x = Math.sin(time * 0.12) * 0.08;

    renderer.render(scene, camera);
  }

  return {
    render,
    resize,
    resolveMotion,
    pickHotspot,
    getDebugSnapshot,
    worldBounds: { minX: minX + 0.26, maxX: maxX - 0.26, minZ: minZ + 0.22, maxZ: maxZ - 0.22 },
  };
}
