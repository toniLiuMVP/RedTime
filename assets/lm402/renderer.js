import * as THREE from "./vendor-three.module.js";
import { WORLD, CINEMATIC_TIMELINE } from "./data.js";

export const WORLD_SCALE = 1 / 80;

const FLOOR_Y = 0;
const PLAYER_EYE = 1.62;

const tempVecA = new THREE.Vector3();
const tempVecB = new THREE.Vector3();
const tempVecC = new THREE.Vector3();
const tempBox = new THREE.Box3();
const tempSize2D = new THREE.Vector2();
const tempDrawSize2D = new THREE.Vector2();

function scaled(value) {
  return value * WORLD_SCALE;
}

function worldPoint(x, y, z) {
  return new THREE.Vector3(scaled(x), scaled(y), scaled(z));
}

function makeFaceTexture({ female = false, referenceJunior = false } = {}) {
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

  ctx.strokeStyle = female ? (referenceJunior ? "rgba(112,84,74,.68)" : "rgba(82,48,47,.7)") : "rgba(74,43,40,.72)";
  ctx.lineWidth = female ? (referenceJunior ? 3.2 : 6) : 7;
  ctx.beginPath();
  ctx.moveTo(92, referenceJunior ? 124 : 116);
  ctx.quadraticCurveTo(118, female ? (referenceJunior ? 112 : 94) : 100, 142, referenceJunior ? 120 : 110);
  ctx.moveTo(178, referenceJunior ? 120 : 110);
  ctx.quadraticCurveTo(202, female ? (referenceJunior ? 112 : 94) : 100, 228, referenceJunior ? 124 : 116);
  ctx.stroke();

  ctx.fillStyle = "#24191a";
  ctx.beginPath();
  ctx.ellipse(114, referenceJunior ? 152 : 146, referenceJunior ? 17.5 : 15, referenceJunior ? 13.4 : 12, -0.02, 0, Math.PI * 2);
  ctx.ellipse(206, referenceJunior ? 152 : 146, referenceJunior ? 17.5 : 15, referenceJunior ? 13.4 : 12, 0.02, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = female ? (referenceJunior ? "#5b3929" : "#3f231f") : "#35201d";
  ctx.beginPath();
  ctx.ellipse(114, referenceJunior ? 152 : 146, referenceJunior ? 7.2 : 6, referenceJunior ? 8.8 : 7, 0, 0, Math.PI * 2);
  ctx.ellipse(206, referenceJunior ? 152 : 146, referenceJunior ? 7.2 : 6, referenceJunior ? 8.8 : 7, 0, 0, Math.PI * 2);
  ctx.fill();

  if (female) {
    ctx.strokeStyle = referenceJunior ? "rgba(64,38,34,.72)" : "rgba(39,20,18,.7)";
    ctx.lineWidth = referenceJunior ? 2.1 : 2;
    ctx.beginPath();
    ctx.moveTo(94, referenceJunior ? 158 : 154);
    ctx.quadraticCurveTo(114, referenceJunior ? 164 : 162, 134, referenceJunior ? 158 : 154);
    ctx.moveTo(186, referenceJunior ? 158 : 154);
    ctx.quadraticCurveTo(206, referenceJunior ? 164 : 162, 226, referenceJunior ? 158 : 154);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(255,255,255,.94)";
  ctx.beginPath();
  ctx.ellipse(110, referenceJunior ? 145 : 142, referenceJunior ? 3.9 : 3, referenceJunior ? 3.9 : 3, 0, 0, Math.PI * 2);
  ctx.ellipse(202, referenceJunior ? 145 : 142, referenceJunior ? 3.9 : 3, referenceJunior ? 3.9 : 3, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = referenceJunior ? "rgba(152,104,96,.46)" : "rgba(144,97,91,.52)";
  ctx.lineWidth = referenceJunior ? 5 : 6;
  ctx.beginPath();
  ctx.moveTo(160, 146);
  ctx.quadraticCurveTo(172, 180, 156, 194);
  ctx.stroke();

  ctx.fillStyle = female ? (referenceJunior ? "rgba(242,178,186,.16)" : "rgba(232,164,174,.2)") : "rgba(196,126,120,.14)";
  ctx.beginPath();
  ctx.ellipse(102, referenceJunior ? 190 : 188, referenceJunior ? 20 : 22, referenceJunior ? 12 : 14, 0, 0, Math.PI * 2);
  ctx.ellipse(218, referenceJunior ? 190 : 188, referenceJunior ? 20 : 22, referenceJunior ? 12 : 14, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = female ? (referenceJunior ? "rgba(186,126,132,.7)" : "rgba(176,86,112,.92)") : "rgba(126,82,76,.86)";
  ctx.lineWidth = female ? (referenceJunior ? 4.8 : 7) : 6;
  ctx.beginPath();
  ctx.moveTo(referenceJunior ? 130 : 116, referenceJunior ? 236 : 236);
  ctx.quadraticCurveTo(160, referenceJunior ? 244 : 258, referenceJunior ? 190 : 208, referenceJunior ? 236 : 236);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,.18)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(referenceJunior ? 136 : 126, referenceJunior ? 232 : 234);
  ctx.quadraticCurveTo(160, referenceJunior ? 239 : 248, referenceJunior ? 184 : 194, referenceJunior ? 232 : 234);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createFacePlane(texture, opacity = 1) {
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity,
    depthWrite: false,
  });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(0.27, 0.3), material);
  plane.position.set(0, 0.01, 0.176);
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
  const referenceJunior = Boolean(spec.referenceJunior);
  const realisticJunior = spec.female && referenceJunior;

  const torsoMat = new THREE.MeshPhysicalMaterial({
    color: spec.torso,
    roughness: spec.female ? 0.42 : 0.5,
    metalness: 0.02,
    clearcoat: spec.female ? 0.14 : 0.06,
    clearcoatRoughness: 0.52,
  });
  const accentMat = new THREE.MeshPhysicalMaterial({
    color: spec.torsoAccent ?? spec.torso,
    roughness: spec.female ? 0.36 : 0.42,
    metalness: 0.03,
    clearcoat: spec.female ? 0.18 : 0.08,
    clearcoatRoughness: 0.44,
  });
  const legsMat = new THREE.MeshPhysicalMaterial({
    color: spec.legs,
    roughness: spec.female ? 0.44 : 0.54,
    metalness: 0.02,
    clearcoat: spec.female ? 0.1 : 0.04,
    clearcoatRoughness: 0.4,
  });
  const skinMat = new THREE.MeshPhysicalMaterial({
    color: spec.skin,
    roughness: realisticJunior ? 0.19 : 0.32,
    metalness: 0,
    clearcoat: realisticJunior ? 0.52 : 0.28,
    clearcoatRoughness: realisticJunior ? 0.28 : 0.52,
    sheen: realisticJunior ? 0.44 : 0.12,
    sheenRoughness: realisticJunior ? 0.32 : 0.72,
    sheenColor: new THREE.Color(spec.female ? '#ffcfb8' : '#e8b8a4'),
  });
  const blushMat = new THREE.MeshPhysicalMaterial({ color: spec.female ? "#f3c3bc" : "#d7a18f", roughness: 0.56, metalness: 0, transparent: true, opacity: spec.female ? 0.26 : 0.14, sheen: 0.1 });
  const hairMat = new THREE.MeshPhysicalMaterial({
    color: spec.hair,
    roughness: realisticJunior ? 0.12 : 0.34,
    metalness: realisticJunior ? 0.06 : 0.08,
    clearcoat: realisticJunior ? 0.58 : 0.12,
    clearcoatRoughness: realisticJunior ? 0.14 : 0.3,
    sheen: realisticJunior ? 0.32 : 0,
    sheenRoughness: realisticJunior ? 0.28 : 1,
    sheenColor: new THREE.Color(realisticJunior ? '#a07060' : '#000'),
  });
  const shoeMat = new THREE.MeshPhysicalMaterial({ color: spec.shoes, roughness: 0.56, metalness: 0.1, clearcoat: 0.12, clearcoatRoughness: 0.4 });
  const buttonMat = new THREE.MeshPhysicalMaterial({ color: "#f6ede3", roughness: 0.42, metalness: 0.06, clearcoat: 0.16, clearcoatRoughness: 0.28 });

  const waist = new THREE.Mesh(new THREE.CapsuleGeometry(spec.female ? 0.126 : 0.132, 0.18, 5, 10), torsoMat);
  waist.position.set(0, 0.84, 0);
  waist.scale.set(spec.female ? 1.04 : 1.14, 1.02, 0.86);
  group.add(waist);

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(spec.female ? 0.172 : 0.166, spec.female ? 0.62 : 0.6, 8, 18), torsoMat);
  torso.position.set(0, 1.08, 0);
  torso.scale.set(spec.female ? 0.98 : 1.1, 1.04, spec.female ? 0.82 : 0.9);
  group.add(torso);

  const chest = new THREE.Mesh(new THREE.SphereGeometry(spec.female ? 0.172 : 0.158, 22, 22), accentMat);
  chest.position.set(0, 1.13, 0.038);
  chest.scale.set(1.06, spec.female ? 0.64 : 0.58, spec.female ? 0.52 : 0.58);
  group.add(chest);

  const skirtOrHip = new THREE.Mesh(
    new THREE.CylinderGeometry(spec.female ? 0.166 : 0.158, spec.female ? 0.208 : 0.174, spec.female ? 0.24 : 0.22, 16),
    legsMat
  );
  skirtOrHip.position.set(0, spec.female ? 0.71 : 0.74, 0);
  group.add(skirtOrHip);

  const legGeo = new THREE.CapsuleGeometry(spec.female ? 0.064 : 0.072, spec.female ? 0.74 : 0.68, 6, 12);
  const leftLeg = new THREE.Mesh(legGeo, skinMat);
  leftLeg.position.set(spec.female ? -0.085 : -0.092, spec.female ? 0.36 : 0.34, 0.01);
  leftLeg.rotation.z = 0.02;
  const rightLeg = leftLeg.clone();
  rightLeg.position.x = spec.female ? 0.085 : 0.092;
  rightLeg.rotation.z = -0.02;
  group.add(leftLeg, rightLeg);

  const shorts = new THREE.Mesh(
    new THREE.BoxGeometry(spec.female ? 0.32 : 0.38, spec.female ? 0.16 : 0.22, spec.female ? 0.25 : 0.27),
    legsMat
  );
  shorts.position.set(0, spec.female ? 0.66 : 0.63, 0.01);
  group.add(shorts);

  if (!spec.female) {
    const trouserLeft = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.66, 0.18), legsMat);
    trouserLeft.position.set(-0.095, 0.36, 0.008);
    const trouserRight = trouserLeft.clone();
    trouserRight.position.x = 0.095;
    const belt = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.05, 0.18),
      new THREE.MeshStandardMaterial({ color: "#181a20", roughness: 0.58, metalness: 0.06 })
    );
    belt.position.set(0, 0.72, 0.016);
    group.add(trouserLeft, trouserRight, belt);
  }

  const shoeGeo = new THREE.BoxGeometry(0.13, 0.06, 0.25);
  const shoeL = new THREE.Mesh(shoeGeo, shoeMat);
  shoeL.position.set(spec.female ? -0.094 : -0.102, 0.042, 0.055);
  shoeL.rotation.x = 0.04;
  const shoeR = shoeL.clone();
  shoeR.position.x = spec.female ? 0.094 : 0.102;
  group.add(shoeL, shoeR);

  const shoulderL = new THREE.Mesh(new THREE.SphereGeometry(spec.female ? 0.086 : 0.102, 18, 18), torsoMat);
  shoulderL.position.set(spec.female ? -0.188 : -0.252, 1.18, 0);
  const shoulderR = shoulderL.clone();
  shoulderR.position.x = spec.female ? 0.188 : 0.236;
  group.add(shoulderL, shoulderR);

  const armGeo = new THREE.CapsuleGeometry(spec.female ? 0.048 : 0.056, spec.female ? 0.42 : 0.46, 5, 10);
  const leftArm = new THREE.Mesh(armGeo, skinMat);
  leftArm.position.set(spec.female ? -0.228 : -0.266, 1.0, 0.02);
  leftArm.rotation.z = spec.female ? 0.12 : 0.15;
  const rightArm = leftArm.clone();
  rightArm.position.x = spec.female ? 0.228 : 0.246;
  rightArm.rotation.z = spec.female ? -0.12 : -0.15;
  group.add(leftArm, rightArm);

  const handGeo = new THREE.SphereGeometry(spec.female ? 0.048 : 0.054, 18, 18);
  const leftHand = new THREE.Mesh(handGeo, skinMat);
  leftHand.position.set(spec.female ? -0.264 : -0.302, 0.71, 0.04);
  const rightHand = leftHand.clone();
  rightHand.position.x = spec.female ? 0.264 : 0.286;
  group.add(leftHand, rightHand);

  const sleeveGeo = new THREE.CylinderGeometry(spec.female ? 0.072 : 0.078, spec.female ? 0.078 : 0.084, 0.2, 14);
  const leftSleeve = new THREE.Mesh(sleeveGeo, accentMat);
  leftSleeve.position.set(spec.female ? -0.18 : -0.2, 1.1, 0.02);
  leftSleeve.rotation.z = 1.06;
  const rightSleeve = leftSleeve.clone();
  rightSleeve.position.x = spec.female ? 0.18 : 0.2;
  rightSleeve.rotation.z = -1.06;
  group.add(leftSleeve, rightSleeve);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.08, 0.14, 18), skinMat);
  neck.position.set(0, 1.33, 0.02);
  group.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(spec.female ? 0.168 : 0.182, 48, 48), skinMat);
  head.position.set(0, 1.56, 0);
  head.scale.set(
    spec.female ? (referenceJunior ? 0.76 : 0.94) : 0.98,
    spec.female ? (referenceJunior ? 1.2 : 1.08) : 1.04,
    spec.female ? (referenceJunior ? 0.82 : 0.91) : 0.9
  );
  group.add(head);
  if (realisticJunior) {
    head.scale.set(0.73, 1.18, 0.8);
  }

  const jaw = new THREE.Mesh(new THREE.SphereGeometry(spec.female ? 0.14 : 0.154, 36, 36), skinMat);
  jaw.position.set(0, spec.female ? 1.47 : 1.48, 0.02);
  jaw.scale.set(
    spec.female ? (referenceJunior ? 0.6 : 0.92) : 1.02,
    spec.female ? (referenceJunior ? 0.52 : 0.78) : 0.84,
    spec.female ? (referenceJunior ? 0.7 : 0.88) : 0.92
  );
  group.add(jaw);
  if (realisticJunior) {
    jaw.position.set(0, 1.474, 0.024);
    jaw.scale.set(0.56, 0.5, 0.68);
  }

  const earGeo = new THREE.SphereGeometry(0.032, 16, 16);
  const earL = new THREE.Mesh(earGeo, skinMat);
  earL.position.set(-0.165, 1.55, 0.01);
  earL.scale.set(0.72, 1.02, 0.56);
  const earR = earL.clone();
  earR.position.x = 0.165;
  group.add(earL, earR);
  if (realisticJunior) {
    earL.position.set(-0.142, 1.548, -0.004);
    earR.position.set(0.142, 1.548, -0.004);
    earL.scale.set(0.62, 0.92, 0.5);
    earR.scale.copy(earL.scale);
  }

  const nose = new THREE.Mesh(new THREE.ConeGeometry(spec.female ? (referenceJunior ? 0.0105 : 0.024) : 0.026, spec.female ? (referenceJunior ? 0.034 : 0.062) : 0.07, 12), skinMat);
  nose.position.set(0, referenceJunior ? 1.538 : 1.54, referenceJunior ? 0.149 : 0.154);
  nose.rotation.x = Math.PI * 0.5;
  group.add(nose);

  const noseBridge = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, 0.08, 0.012),
    new THREE.MeshPhysicalMaterial({ color: "#fff8f2", roughness: 0.28, metalness: 0, transparent: true, opacity: 0.24, clearcoat: 0.22, clearcoatRoughness: 0.16 })
  );
  noseBridge.position.set(0, referenceJunior ? 1.578 : 1.57, referenceJunior ? 0.142 : 0.135);
  group.add(noseBridge);

  const lip = new THREE.Mesh(
    new THREE.TorusGeometry(spec.female ? (referenceJunior ? 0.038 : 0.045) : 0.045, spec.female ? (referenceJunior ? 0.0065 : 0.009) : 0.009, 8, 18, Math.PI),
    new THREE.MeshStandardMaterial({ color: spec.female ? "#cc7282" : "#ae7670", roughness: 0.5, metalness: 0.03 })
  );
  lip.position.set(0, referenceJunior ? 1.446 : 1.46, referenceJunior ? 0.154 : 0.148);
  lip.rotation.x = Math.PI;
  group.add(lip);

  if (realisticJunior) {
    const lowerLip = new THREE.Mesh(
      new THREE.SphereGeometry(0.024, 14, 14),
      new THREE.MeshStandardMaterial({ color: "#f3b6bc", roughness: 0.48, metalness: 0.02, transparent: true, opacity: 0.72 })
    );
    lowerLip.position.set(0, 1.433, 0.153);
    lowerLip.scale.set(1.64, 0.42, 0.42);
    group.add(lowerLip);
  }

  const browGeo = new THREE.BoxGeometry(spec.female ? (referenceJunior ? 0.062 : 0.08) : 0.09, 0.012, 0.02);
  const browMat = new THREE.MeshStandardMaterial({ color: spec.female ? "#3a2422" : "#31201e", roughness: 0.7, metalness: 0.02 });
  const browL = new THREE.Mesh(browGeo, browMat);
  browL.position.set(referenceJunior ? -0.067 : -0.074, referenceJunior ? 1.616 : 1.62, 0.136);
  browL.rotation.z = referenceJunior ? -0.02 : -0.08;
  const browR = browL.clone();
  browR.position.x = referenceJunior ? 0.067 : 0.072;
  browR.rotation.z = referenceJunior ? 0.02 : 0.08;
  group.add(browL, browR);
  if (realisticJunior) {
    browL.position.set(-0.064, 1.612, 0.138);
    browR.position.set(0.064, 1.612, 0.138);
  }

  const lidGeo = new THREE.TorusGeometry(spec.female ? (referenceJunior ? 0.034 : 0.032) : 0.032, 0.004, 6, 18, Math.PI);
  const lidMat = new THREE.MeshStandardMaterial({ color: spec.female ? "#3a1f20" : "#2f1d1e", roughness: 0.54, metalness: 0.02 });
  const lidL = new THREE.Mesh(lidGeo, lidMat);
  lidL.position.set(referenceJunior ? -0.068 : -0.062, referenceJunior ? 1.57 : 1.57, 0.168);
  lidL.rotation.z = Math.PI;
  const lidR = lidL.clone();
  lidR.position.x = referenceJunior ? 0.064 : 0.062;
  group.add(lidL, lidR);

  const eyeWhiteMat = new THREE.MeshPhysicalMaterial({ color: "#fcfcfd", roughness: 0.18, metalness: 0.01, clearcoat: 0.14, clearcoatRoughness: 0.12 });
  const irisMat = new THREE.MeshPhysicalMaterial({ color: spec.iris ?? (spec.female ? "#3a261f" : "#2b1c18"), roughness: 0.34, metalness: 0.02, clearcoat: 0.12, clearcoatRoughness: 0.2 });
  const eyeWhiteL = new THREE.Mesh(new THREE.SphereGeometry(spec.female ? (referenceJunior ? 0.025 : 0.022) : 0.022, 12, 12), eyeWhiteMat);
  eyeWhiteL.position.set(referenceJunior ? -0.068 : -0.062, referenceJunior ? 1.56 : 1.56, referenceJunior ? 0.158 : 0.15);
  eyeWhiteL.scale.set(spec.female && referenceJunior ? 1.56 : 1.35, spec.female && referenceJunior ? 1.02 : 0.9, 0.5);
  const eyeWhiteR = eyeWhiteL.clone();
  eyeWhiteR.position.x = referenceJunior ? 0.068 : 0.062;
  const irisL = new THREE.Mesh(new THREE.SphereGeometry(spec.female && referenceJunior ? 0.0122 : 0.011, 10, 10), irisMat);
  irisL.position.set(referenceJunior ? -0.068 : -0.062, referenceJunior ? 1.558 : 1.56, referenceJunior ? 0.175 : 0.166);
  const irisR = irisL.clone();
  irisR.position.x = referenceJunior ? 0.068 : 0.062;
  group.add(eyeWhiteL, eyeWhiteR, irisL, irisR);
  if (realisticJunior) {
    eyeWhiteL.position.set(-0.064, 1.557, 0.16);
    eyeWhiteR.position.set(0.064, 1.557, 0.16);
    eyeWhiteL.scale.set(1.52, 1.06, 0.52);
    eyeWhiteR.scale.copy(eyeWhiteL.scale);
    irisL.position.set(-0.064, 1.555, 0.177);
    irisR.position.set(0.064, 1.555, 0.177);
  }

  if (spec.female) {
    const lashMat = new THREE.MeshStandardMaterial({ color: "#241618", roughness: 0.52, metalness: 0.02 });
    const lashL = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.01, 0.014), lashMat);
  lashL.position.set(referenceJunior ? -0.068 : -0.062, referenceJunior ? 1.585 : 1.586, 0.174);
  lashL.rotation.z = referenceJunior ? -0.012 : -0.03;
  const lashR = lashL.clone();
  lashR.position.x = referenceJunior ? 0.068 : 0.062;
  lashR.rotation.z = referenceJunior ? 0.012 : 0.03;
    group.add(lashL, lashR);
  }

  const cheekGeo = new THREE.SphereGeometry(0.028, 12, 12);
  const cheekL = new THREE.Mesh(cheekGeo, blushMat);
  cheekL.position.set(referenceJunior ? -0.084 : -0.094, 1.488, 0.148);
  cheekL.scale.set(referenceJunior ? 1.34 : 1.7, referenceJunior ? 0.84 : 1.2, 0.38);
  const cheekR = cheekL.clone();
  cheekR.position.x = referenceJunior ? 0.084 : 0.094;
  group.add(cheekL, cheekR);

  const eyeSparkleMat = new THREE.MeshStandardMaterial({ color: "#ffffff", emissive: "#ffffff", emissiveIntensity: 0.12, roughness: 0.2, metalness: 0.02 });
  const eyeSparkleL = new THREE.Mesh(new THREE.SphereGeometry(realisticJunior ? 0.0055 : 0.004, 8, 8), eyeSparkleMat);
  eyeSparkleL.position.set(referenceJunior ? -0.058 : -0.055, realisticJunior ? 1.573 : 1.568, realisticJunior ? 0.184 : 0.176);
  const eyeSparkleR = eyeSparkleL.clone();
  eyeSparkleR.position.x = referenceJunior ? 0.072 : 0.069;
  group.add(eyeSparkleL, eyeSparkleR);

  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(spec.female ? 0.194 : 0.188, 28, 28, 0, Math.PI * 2, 0, Math.PI * 0.72),
    hairMat
  );
  hairCap.position.set(0, 1.62, -0.01);
  hairCap.rotation.x = -0.1;
  group.add(hairCap);

  const hairBack = new THREE.Mesh(new THREE.SphereGeometry(spec.female ? 0.214 : 0.182, 28, 28), hairMat);
  hairBack.position.set(0, spec.female ? 1.5 : 1.61, spec.female ? -0.08 : -0.1);
  hairBack.scale.set(0.88, spec.female ? 1.42 : 0.42, spec.female ? 0.7 : 0.52);
  group.add(hairBack);

  const fringe = new THREE.Mesh(new THREE.BoxGeometry(spec.female ? (referenceJunior ? 0.154 : 0.2) : 0.144, referenceJunior ? 0.162 : 0.08, 0.05), hairMat);
  fringe.position.set(0, referenceJunior ? 1.622 : 1.612, referenceJunior ? 0.134 : 0.12);
  group.add(fringe);
  if (realisticJunior) {
    fringe.position.set(0, 1.618, 0.138);
    fringe.scale.set(1.04, 1.08, 1);
  }

  const sideHairL = new THREE.Mesh(new THREE.BoxGeometry(spec.female ? (referenceJunior ? 0.058 : 0.076) : 0.058, spec.female ? (referenceJunior ? 0.38 : 0.42) : 0.22, 0.06), hairMat);
  sideHairL.position.set(referenceJunior ? -0.108 : -0.14, spec.female ? 1.458 : 1.49, 0.05);
  const sideHairR = sideHairL.clone();
  sideHairR.position.x = referenceJunior ? 0.108 : 0.15;
  group.add(sideHairL, sideHairR);
  if (realisticJunior) {
    sideHairL.position.set(-0.102, 1.462, 0.06);
    sideHairR.position.set(0.102, 1.462, 0.06);
    sideHairL.scale.set(0.96, 1.04, 1);
    sideHairR.scale.copy(sideHairL.scale);
  }

  const crownShine = new THREE.Mesh(
    new THREE.SphereGeometry(spec.female ? 0.16 : 0.15, 20, 20),
    new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.2, metalness: 0.02, transparent: true, opacity: 0.08 })
  );
  crownShine.position.set(0.02, 1.66, 0.04);
  crownShine.scale.set(0.82, 0.42, 0.5);
  group.add(crownShine);

  const face = createFacePlane(
    makeFaceTexture({ female: spec.female, referenceJunior }),
    realisticJunior ? 0.5 : 0.86
  );
  face.position.y = realisticJunior ? 1.556 : 1.55;
  face.position.z = realisticJunior ? 0.19 : spec.female ? 0.178 : 0.172;
  face.scale.setScalar(realisticJunior ? 0.84 : spec.female ? 0.95 : 0.92);
  group.add(face);
  if (realisticJunior) {
    face.position.set(0, 1.554, 0.194);
    face.scale.setScalar(0.87);
  }

  const browShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.18, 0.06),
    new THREE.MeshBasicMaterial({ color: "#5a3d3c", transparent: true, opacity: 0.08, depthWrite: false })
  );
  browShadow.position.set(0, 1.59, 0.17);
  group.add(browShadow);

  if (spec.female) {
    const backStrand = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.64, 0.08), hairMat);
    backStrand.position.set(0, 1.22, -0.11);
    backStrand.scale.set(1, 1.06, 0.82);
    group.add(backStrand);

    const wispL = new THREE.Mesh(new THREE.BoxGeometry(0.028, realisticJunior ? 0.32 : 0.26, 0.028), hairMat);
    wispL.position.set(realisticJunior ? -0.102 : -0.112, realisticJunior ? 1.44 : 1.46, realisticJunior ? 0.124 : 0.118);
    wispL.rotation.z = -0.12;
    const wispR = wispL.clone();
    wispR.position.x = realisticJunior ? 0.104 : 0.112;
    wispR.rotation.z = 0.12;
    group.add(wispL, wispR);

    if (realisticJunior) {
      const frontWispL = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.24, 0.018), hairMat);
      frontWispL.position.set(-0.046, 1.512, 0.158);
      frontWispL.rotation.z = -0.02;
      const frontWispR = frontWispL.clone();
      frontWispR.position.x = 0.05;
      frontWispR.rotation.z = 0.02;
      group.add(frontWispL, frontWispR);
    }

    const midStrandL = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.34, 0.032), hairMat);
    midStrandL.position.set(-0.152, 1.36, 0.02);
    midStrandL.rotation.z = -0.08;
    const midStrandR = midStrandL.clone();
    midStrandR.position.x = 0.152;
    midStrandR.rotation.z = 0.08;
    group.add(midStrandL, midStrandR);

    const collar = new THREE.Mesh(
      new THREE.TorusGeometry(0.1, 0.018, 8, 20, Math.PI),
      new THREE.MeshStandardMaterial({ color: "#fffef8", roughness: 0.76, metalness: 0.01 })
    );
    collar.position.set(0, 1.2, 0.08);
    collar.rotation.x = Math.PI * 0.54;
    group.add(collar);

    const blouse = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.164, 0.48, 8, 16),
      new THREE.MeshPhysicalMaterial({ color: "#fffdfa", roughness: 0.3, metalness: 0.01, clearcoat: 0.2, clearcoatRoughness: 0.24 })
    );
    blouse.position.set(0, 1.06, 0.02);
    blouse.scale.set(referenceJunior ? 0.92 : 0.94, referenceJunior ? 1.05 : 0.92, 0.8);
    group.add(blouse);

    const blouseHem = new THREE.Mesh(new THREE.TorusGeometry(0.146, 0.012, 8, 20), buttonMat);
    blouseHem.position.set(0, 0.84, 0.02);
    blouseHem.rotation.x = Math.PI / 2;
    group.add(blouseHem);

    const blouseFold = new THREE.Mesh(
      new THREE.PlaneGeometry(0.12, 0.34),
      new THREE.MeshPhysicalMaterial({ color: "#efe7dc", roughness: 0.54, metalness: 0, transparent: true, opacity: 0.22, clearcoat: 0.08, clearcoatRoughness: 0.22 })
    );
    blouseFold.position.set(0, 1.02, 0.2);
    group.add(blouseFold);

    [-0.02, 0.1, 0.22].forEach((offsetY) => {
      const button = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 10), buttonMat);
      button.position.set(0, 1.12 - offsetY, 0.2);
      group.add(button);
    });

    const cuffLeft = new THREE.Mesh(new THREE.TorusGeometry(0.046, 0.012, 8, 18), buttonMat);
    cuffLeft.position.set(-0.232, 0.83, 0.03);
    cuffLeft.rotation.z = 1.52;
    const cuffRight = cuffLeft.clone();
    cuffRight.position.x = 0.232;
    group.add(cuffLeft, cuffRight);

    const sockMat = new THREE.MeshStandardMaterial({ color: "#faf7f1", roughness: 0.76, metalness: 0.01 });
    const leftSock = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.072, 0.14, 14), sockMat);
    leftSock.position.set(-0.085, 0.11, 0.008);
    const rightSock = leftSock.clone();
    rightSock.position.x = 0.085;
    group.add(leftSock, rightSock);

    const ponytailBase = new THREE.Mesh(new THREE.SphereGeometry(0.056, 18, 18), hairMat);
    ponytailBase.position.set(0.028, 1.698, -0.17);
    group.add(ponytailBase);

    const scrunchie = new THREE.Mesh(
      new THREE.TorusGeometry(0.052, 0.016, 8, 20),
      new THREE.MeshStandardMaterial({ color: "#1f1a22", roughness: 0.7, metalness: 0.04 })
    );
    scrunchie.position.set(0.028, 1.698, -0.17);
    scrunchie.rotation.x = Math.PI / 2;
    group.add(scrunchie);

    const ponytail = new THREE.Mesh(new THREE.CapsuleGeometry(realisticJunior ? 0.044 : 0.05, realisticJunior ? 0.74 : 0.62, 6, 12), hairMat);
    ponytail.position.set(realisticJunior ? 0.1 : 0.092, realisticJunior ? 1.286 : 1.24, realisticJunior ? -0.246 : -0.24);
    ponytail.rotation.z = realisticJunior ? -0.02 : -0.18;
    ponytail.rotation.x = 0.1;
    ponytail.scale.set(realisticJunior ? 0.8 : 0.86, realisticJunior ? 1.42 : 1.24, realisticJunior ? 0.76 : 0.8);
    group.add(ponytail);

    const ponytailTail = new THREE.Mesh(new THREE.CapsuleGeometry(realisticJunior ? 0.029 : 0.036, realisticJunior ? 0.56 : 0.42, 6, 10), hairMat);
    ponytailTail.position.set(realisticJunior ? 0.154 : 0.14, realisticJunior ? 0.98 : 0.92, realisticJunior ? -0.102 : -0.16);
    ponytailTail.rotation.z = realisticJunior ? -0.03 : -0.22;
    ponytailTail.rotation.x = -0.04;
    ponytailTail.scale.set(realisticJunior ? 0.78 : 0.84, realisticJunior ? 1.42 : 1.28, realisticJunior ? 0.76 : 0.82);
    group.add(ponytailTail);

    if (realisticJunior) {
      ponytailBase.position.set(0.02, 1.692, -0.164);
      scrunchie.position.set(0.02, 1.692, -0.164);
      ponytail.position.set(0.094, 1.304, -0.234);
      ponytail.scale.set(0.82, 1.46, 0.8);
      ponytailTail.position.set(0.144, 1.012, -0.09);
      ponytailTail.scale.set(0.82, 1.46, 0.8);
    }
  }

  if (!spec.female) {
    const shirtPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, 0.52, 0.03),
      new THREE.MeshPhysicalMaterial({ color: "#5f7893", roughness: 0.42, metalness: 0.03, clearcoat: 0.12, clearcoatRoughness: 0.28, transparent: true, opacity: 0.94 })
    );
    shirtPanel.position.set(0, 1.08, 0.19);
    group.add(shirtPanel);

    const shirtCollar = new THREE.Mesh(
      new THREE.TorusGeometry(0.092, 0.014, 8, 20, Math.PI),
      new THREE.MeshPhysicalMaterial({ color: "#e4ebf2", roughness: 0.44, metalness: 0.02, clearcoat: 0.08, clearcoatRoughness: 0.2 })
    );
    shirtCollar.position.set(0, 1.2, 0.08);
    shirtCollar.rotation.x = Math.PI * 0.54;
    group.add(shirtCollar);

    const maleFringe = new THREE.Mesh(new THREE.BoxGeometry(0.136, 0.084, 0.054), hairMat);
    maleFringe.position.set(0, 1.616, 0.122);
    group.add(maleFringe);

    const sideburnL = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.18, 0.028), hairMat);
    sideburnL.position.set(-0.132, 1.5, 0.06);
    sideburnL.rotation.z = -0.06;
    const sideburnR = sideburnL.clone();
    sideburnR.position.x = 0.128;
    sideburnR.rotation.z = 0.06;
    const nape = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.07, 0.06), hairMat);
    nape.position.set(0, 1.52, -0.164);
    group.add(sideburnL, sideburnR, nape);
  }

  if (spec.phone) {
    rightArm.position.set(0.18, 1.16, 0.02);
    rightArm.rotation.z = -0.6;
    rightArm.rotation.x = -0.52;
    rightSleeve.position.set(0.164, 1.2, 0.03);
    rightSleeve.rotation.z = -0.78;
    rightSleeve.rotation.x = -0.46;
    rightHand.position.set(0.19, 1.24, 0.08);
    const phone = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.12, 0.018),
      new THREE.MeshStandardMaterial({ color: "#141518", roughness: 0.38, metalness: 0.28 })
    );
    phone.position.set(0.16, 1.38, 0.07);
    phone.rotation.set(-0.24, 0.16, 0.18);
    group.add(phone);
  }

  if (spec.highlight) {
    const glow = createGlowPlane("rgba(255,234,184,1)", 1.2, 1.8, 0.28);
    glow.position.set(0.12, 1.16, -0.08);
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

  group.scale.setScalar(spec.scale ?? 0.95);
  group.userData.pose = {
    waist,
    torso,
    chest,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    leftHand,
    rightHand,
    head,
    jaw,
    hairBack,
    fringe,
    shoulderL,
    shoulderR,
    female: Boolean(spec.female),
    hasPhone: Boolean(spec.phone),
  };
  setShadow(group);
  return group;
}

function resetCharacterPose(person) {
  const pose = person.userData.pose;
  if (!pose) {
    return;
  }
  pose.waist.rotation.set(0, 0, 0);
  pose.torso.rotation.set(0, 0, 0);
  pose.chest.rotation.set(0, 0, 0);
  pose.leftArm.rotation.set(0, 0, pose.female ? 0.12 : 0.15);
  pose.rightArm.rotation.set(0, 0, pose.female ? -0.12 : -0.15);
  pose.leftLeg.rotation.set(0, 0, 0.02);
  pose.rightLeg.rotation.set(0, 0, -0.02);
  pose.leftHand.rotation.set(0, 0, 0);
  pose.rightHand.rotation.set(0, 0, 0);
  pose.head.rotation.set(0, 0, 0);
  pose.jaw.rotation.set(0, 0, 0);
  pose.hairBack.rotation.set(0, 0, 0);
  pose.fringe.rotation.set(0, 0, 0);
  person.position.y = 0;
}

function applyWalkingPose(person, stride, sway = 1) {
  const pose = person.userData.pose;
  if (!pose) {
    return;
  }
  // Leg swing — larger amplitude for more natural, full-stride look
  const legAmp = pose.female ? 0.58 : 0.48;
  // Arm counter-swing — delayed quarter-cycle for realism
  const armDelay = Math.sin(Math.asin(Math.max(-1, Math.min(1, stride))) - 0.18);
  const armAmp = pose.hasPhone ? 0.14 : 0.42;
  pose.leftLeg.rotation.x = stride * legAmp;
  pose.rightLeg.rotation.x = -stride * legAmp;
  // Slightly bent knees (positive rotation) when leg is behind
  pose.leftLeg.rotation.z = 0.02 + Math.max(0, stride) * 0.04;
  pose.rightLeg.rotation.z = -0.02 - Math.max(0, -stride) * 0.04;
  // Arm swing
  pose.leftArm.rotation.x = -armDelay * armAmp;
  pose.rightArm.rotation.x = pose.hasPhone ? -0.56 + stride * 0.06 : armDelay * armAmp;
  // Body rotation and sway — torso counter-rotates to hips for realism
  pose.torso.rotation.z = -stride * 0.04 * sway;
  pose.torso.rotation.x = Math.abs(stride) * 0.025;
  pose.torso.rotation.y = stride * 0.06 * sway;
  pose.waist.rotation.z = stride * 0.06 * sway;
  pose.waist.rotation.y = -stride * 0.05 * sway;
  // Chest follows hips in opposite rotation
  pose.chest.rotation.y = -stride * 0.08 * sway;
  // Head stays level but follows gaze direction gently
  pose.head.rotation.z = stride * 0.028 * sway;
  pose.head.rotation.y = stride * 0.05 * sway;
  // Shoulder roll
  pose.shoulderL.rotation.z = -stride * 0.06;
  pose.shoulderR.rotation.z = stride * 0.06;
  // Realistic vertical bob: body rises on push-off, falls on landing (2x per stride cycle)
  const bob = Math.abs(Math.cos(Math.asin(Math.max(-1, Math.min(1, stride))))) * 0.024;
  const lateral = stride * 0.016 * sway;
  person.position.y = bob + Math.abs(stride) * 0.018;
}

function applyIdlePose(person, time, emphasis = 1) {
  const pose = person.userData.pose;
  if (!pose) {
    return;
  }
  const breathe = Math.sin(time * 1.4) * 0.02 * emphasis;
  const breathe2 = Math.sin(time * 1.4 + 0.3) * 0.012 * emphasis;
  pose.torso.rotation.x = breathe;
  pose.chest.rotation.x = breathe * 0.7 + breathe2 * 0.3;
  pose.waist.rotation.x = breathe * 0.2;
  pose.head.rotation.y = Math.sin(time * 0.7) * 0.045 * emphasis;
  pose.head.rotation.x = Math.sin(time * 0.9) * 0.012 * emphasis;
  pose.hairBack.rotation.z = Math.sin(time * 1.1) * 0.024 * emphasis;
  pose.shoulderL.rotation.z = Math.sin(time * 1.2 + 0.5) * 0.008 * emphasis;
  pose.shoulderR.rotation.z = -Math.sin(time * 1.2 + 0.5) * 0.008 * emphasis;
  person.position.y = Math.abs(Math.sin(time * 1.4)) * 0.014 * emphasis;
}

function applyFlyingPose(person, progress) {
  const pose = person.userData.pose;
  if (!pose) {
    return;
  }
  const wing = Math.sin(progress * Math.PI * 5.4) * 0.06;
  pose.torso.rotation.x = -1.02;
  pose.chest.rotation.x = -0.56;
  pose.waist.rotation.x = -0.34;
  pose.leftArm.rotation.x = -1.6 + wing * 0.06;
  pose.rightArm.rotation.x = -1.64 - wing * 0.04;
  pose.leftArm.rotation.z = 0.11;
  pose.rightArm.rotation.z = -0.11;
  pose.leftHand.rotation.x = -0.3;
  pose.rightHand.rotation.x = -0.34;
  pose.leftLeg.rotation.x = 0.1 - wing * 0.04;
  pose.rightLeg.rotation.x = 0.12 + wing * 0.04;
  pose.head.rotation.x = 0.16;
  pose.hairBack.rotation.x = 0.54;
  pose.fringe.rotation.x = -0.2;
  person.position.y = Math.sin(progress * Math.PI * 4.2) * 0.08;
}

function createTree({ scale: treeScale = 1 }) {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08 * treeScale, 0.2 * treeScale, 2.18 * treeScale, 14),
    new THREE.MeshStandardMaterial({ color: "#6e4b34", roughness: 0.92, metalness: 0.02 })
  );
  trunk.position.y = 1.09 * treeScale;
  group.add(trunk);

  const trunkHighlight = new THREE.Mesh(
    new THREE.CylinderGeometry(0.056 * treeScale, 0.074 * treeScale, 1.76 * treeScale, 10),
    new THREE.MeshStandardMaterial({ color: "#8b6445", roughness: 0.84, metalness: 0.02, transparent: true, opacity: 0.36 })
  );
  trunkHighlight.position.set(-0.02 * treeScale, 1.18 * treeScale, 0.09 * treeScale);
  group.add(trunkHighlight);

  const leafMat = new THREE.MeshStandardMaterial({ color: "#567a48", roughness: 0.94, metalness: 0.01 });
  [
    [0, 2.84, 0, 1.04, 1.2, 0.92],
    [-0.4, 2.46, 0.18, 0.86, 0.92, 0.74],
    [0.46, 2.52, -0.14, 0.9, 1.02, 0.78],
    [0.06, 3.28, -0.16, 0.82, 0.84, 0.72],
    [-0.26, 3.02, -0.26, 0.7, 0.72, 0.62],
    [0.24, 2.94, 0.32, 0.68, 0.7, 0.6],
    [-0.52, 2.82, -0.22, 0.78, 0.82, 0.68],
    [0.58, 2.86, 0.18, 0.74, 0.8, 0.66],
  ].forEach(([x, y, z, sx, sy, sz]) => {
    const cluster = new THREE.Mesh(new THREE.SphereGeometry(0.52 * treeScale, 20, 20), leafMat);
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

function buildWallLabel(text, width = 0.92, height = 0.26) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, 512, 160);
  ctx.fillStyle = "rgba(255,255,255,.92)";
  ctx.font = "600 84px DM Mono";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 256, 80);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
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
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const quality = {
    shadowMapSize: coarse ? 640 : 1024,
    maxPixelRatio: coarse ? 0.96 : 1,
    dustCount: coarse ? 42 : 64,
  };
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.14;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#d4dfeb");
  scene.fog = new THREE.Fog("#d6e1eb", 12, 58);

  const camera = new THREE.PerspectiveCamera(74, 1, 0.03, 180);
  camera.rotation.order = "YXZ";

  const raycaster = new THREE.Raycaster();
  const occluders = [];
  const colliders = [];
  const hotspotNodes = new Map();
  let lastDebugSnapshot = {
    camera: { x: 0, y: 0, z: 0, yaw: 0, pitch: 0 },
    viewport: { width: 0, height: 0 },
    cssViewport: { width: 0, height: 0 },
    projectedNodes: {},
    hotspotLOS: {},
    colliders: 0,
    mobileBlackRegionDetected: false,
  };

  const worldGroup = new THREE.Group();
  const actorGroup = new THREE.Group();
  const introGroup = new THREE.Group();
  const glowGroup = new THREE.Group();
  scene.add(worldGroup, actorGroup, introGroup, glowGroup);

  const minX = scaled(WORLD.minX);
  const maxX = scaled(WORLD.maxX);
  const minZ = scaled(WORLD.minZ);
  const maxZ = scaled(WORLD.maxZ);
  const dividerX = scaled(WORLD.dividerX);
  const corridorMinX = minX;
  const corridorMaxX = dividerX;
  const classroomMinX = dividerX;
  const classroomMaxX = maxX;
  const corridorWidth = corridorMaxX - corridorMinX;
  const corridorCenterX = (corridorMinX + corridorMaxX) / 2;
  const roomDepth = classroomMaxX - classroomMinX;
  const floorLength = maxZ - minZ;
  const floorCenterZ = (minZ + maxZ) / 2;
  const corridorHeight = 2.92;
  const wallThickness = 0.12;
  const parapetHeight = scaled(WORLD.corridor.parapetHeight);
  const boardZ = scaled(WORLD.board.z);
  const boardX1 = scaled(WORLD.board.x1);
  const boardX2 = scaled(WORLD.board.x2);
  const boardCenterX = (boardX1 + boardX2) / 2;
  const frontDoorZ1 = scaled(WORLD.frontDoor.z1);
  const frontDoorZ2 = scaled(WORLD.frontDoor.z2);
  const backDoorZ1 = scaled(WORLD.backDoor.z1);
  const backDoorZ2 = scaled(WORLD.backDoor.z2);
  const lm402Room = WORLD.floorRooms.find((room) => room.interactive) ?? WORLD.floorRooms[0];
  const lm402Z1 = scaled(lm402Room.z1);
  const lm402Z2 = scaled(lm402Room.z2);
  const frontStairZ1 = scaled(WORLD.stairs.front.z1);
  const frontStairZ2 = scaled(WORLD.stairs.front.z2);
  const backStairZ1 = scaled(WORLD.stairs.back.z1);
  const backStairZ2 = scaled(WORLD.stairs.back.z2);

  const worldPointScaled = (x, y, z) => new THREE.Vector3(scaled(x), scaled(y), scaled(z));
  const roomCenter = (room) => scaled((room.z1 + room.z2) / 2);
  const openingFromPanel = (panel, side) => ({
    side,
    z1: scaled(panel.z - panel.width / 2 + 18),
    z2: scaled(panel.z + panel.width / 2 - 18),
    y1: scaled(panel.y1 + 6),
    y2: scaled(panel.y2 - 4),
  });

  const buildWallWithOpenings = ({ x, zStart, zEnd, openings, material, label }) => {
    const zEdges = [zStart, zEnd];
    openings.forEach((opening) => {
      if (opening.z2 <= zStart || opening.z1 >= zEnd) {
        return;
      }
      zEdges.push(Math.max(zStart, opening.z1), Math.min(zEnd, opening.z2));
    });
    const sortedZ = [...new Set(zEdges.map((value) => Number(value.toFixed(4))))].sort((a, b) => a - b);

    for (let zIndex = 0; zIndex < sortedZ.length - 1; zIndex += 1) {
      const segZ1 = sortedZ[zIndex];
      const segZ2 = sortedZ[zIndex + 1];
      if (segZ2 - segZ1 <= 0.01) {
        continue;
      }
      const midZ = (segZ1 + segZ2) / 2;
      const overlapping = openings.filter((opening) => midZ >= opening.z1 && midZ <= opening.z2);
      const yEdges = [0, corridorHeight];
      overlapping.forEach((opening) => {
        yEdges.push(opening.y1, opening.y2);
      });
      const sortedY = [...new Set(yEdges.map((value) => Number(value.toFixed(4))))].sort((a, b) => a - b);

      for (let yIndex = 0; yIndex < sortedY.length - 1; yIndex += 1) {
        const segY1 = sortedY[yIndex];
        const segY2 = sortedY[yIndex + 1];
        if (segY2 - segY1 <= 0.01) {
          continue;
        }
        const midY = (segY1 + segY2) / 2;
        const insideOpening = overlapping.some((opening) => midY > opening.y1 && midY < opening.y2);
        if (insideOpening) {
          continue;
        }
        addBox(
          worldGroup,
          occluders,
          new THREE.BoxGeometry(wallThickness, segY2 - segY1, segZ2 - segZ1),
          material,
          new THREE.Vector3(x, segY1 + (segY2 - segY1) / 2, segZ1 + (segZ2 - segZ1) / 2),
          null,
          colliders,
          { minX: x - wallThickness / 2, maxX: x + wallThickness / 2, minZ: segZ1, maxZ: segZ2, label }
        );
      }
    }
  };

  const hemiLight = new THREE.HemisphereLight(0xf5f7fc, 0x7a6c52, 1.16);
  scene.add(hemiLight);

  const ambient = new THREE.AmbientLight(0xfff8ee, 0.38);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xffe4b6, 2.28);
  sun.position.set(-11.2, 10.8, 5.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(quality.shadowMapSize, quality.shadowMapSize);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 68;
  sun.shadow.camera.left = -22;
  sun.shadow.camera.right = 16;
  sun.shadow.camera.top = 18;
  sun.shadow.camera.bottom = -16;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);

  const corridorFill = new THREE.PointLight(0xd8e7f4, 1.28, 58, 2);
  corridorFill.position.set(corridorMinX + 2.42, 3.64, scaled(WORLD.frontDoor.center.z - 122));
  scene.add(corridorFill);

  const corridorSun = new THREE.PointLight(0xffe9b8, 1.72, 68, 2);
  corridorSun.position.set(minX - 1.72, 6.42, scaled(WORLD.frontDoor.center.z - 8));
  scene.add(corridorSun);

  const classroomAccent = new THREE.PointLight(0xffd9ab, 1.58, 46, 2);
  classroomAccent.position.set(classroomMaxX - 1.46, 2.78, scaled(WORLD.classroom.lightWellZ + 64));
  scene.add(classroomAccent);

  const backdoorAccent = new THREE.PointLight(0xffefcf, 1.42, 36, 2);
  backdoorAccent.position.set(classroomMinX + 1.56, 2.44, scaled(WORLD.backDoor.center.z + 28));
  scene.add(backdoorAccent);

  const windowBounce = new THREE.PointLight(0xffeacc, 0.62, 28, 2);
  windowBounce.position.set(classroomMaxX - 3.8, 0.22, scaled(WORLD.classroom.lightWellZ));
  scene.add(windowBounce);

  // Extra lights for new end-wall glass windows (z1 back and z2 front)
  const backEndWindowLight = new THREE.PointLight(0xfff4e0, 1.44, 38, 2);
  backEndWindowLight.position.set((classroomMinX + classroomMaxX) / 2, 1.82, lm402Z1 + 1.6);
  scene.add(backEndWindowLight);

  const frontEndWindowLight = new THREE.PointLight(0xfffaeb, 1.22, 34, 2);
  frontEndWindowLight.position.set((classroomMinX + classroomMaxX) / 2, 1.82, lm402Z2 - 1.6);
  scene.add(frontEndWindowLight);

  const midClassLight = new THREE.PointLight(0xffecc4, 0.72, 32, 2);
  midClassLight.position.set((classroomMinX + classroomMaxX) / 2, 2.6, (lm402Z1 + lm402Z2) / 2);
  scene.add(midClassLight);

  const corridorBounce = new THREE.PointLight(0xf0e8dd, 0.48, 22, 2);
  corridorBounce.position.set(corridorCenterX, 0.18, scaled(WORLD.frontDoor.center.z - 60));
  scene.add(corridorBounce);

  const classroomFloorTex = makeWoodTexture({ base: "#856549", dark: "#5c422d", highlight: "#b18a63" });
  const corridorFloorTex = makeTileTexture({ base: "#bcc5d0", line: "rgba(244,246,249,.76)", speck: "rgba(124,136,148," });
  const wallTex = makeConcreteTexture({ base: "#e8e1d7", accent: "rgba(255,255,255,.12)", line: "rgba(174,162,145,.22)", warm: true });
  const corridorWallTex = makeConcreteTexture({ base: "#cbd4dd", accent: "rgba(255,255,255,.12)", line: "rgba(132,145,160,.22)" });
  const stoneTex = makeConcreteTexture({ base: "#ddd7cf", accent: "rgba(255,255,255,.12)", line: "rgba(126,118,104,.2)", warm: true });
  const woodTex = makeWoodTexture({ base: "#8f663f", dark: "#57381f", highlight: "#b08556" });
  const boardTex = makeBoardTexture();
  const lawnTex = makeConcreteTexture({ base: "#6e8d5a", accent: "rgba(255,255,255,.02)", line: "rgba(84,112,70,.16)", warm: true });
  const plazaTex = makeTileTexture({ base: "#cbd1d7", line: "rgba(244,246,249,.72)", speck: "rgba(124,136,148," });

  const classroomFloorMat = new THREE.MeshStandardMaterial({ color: "#856649", map: classroomFloorTex, roughness: 0.92, metalness: 0.02 });
  const corridorFloorMat = new THREE.MeshStandardMaterial({ color: "#b9c2cc", map: corridorFloorTex, roughness: 0.9, metalness: 0.02 });
  const wallMat = new THREE.MeshStandardMaterial({ color: "#e8e0d5", map: wallTex, roughness: 0.95, metalness: 0.01 });
  const corridorWallMat = new THREE.MeshStandardMaterial({ color: "#cbd6df", map: corridorWallTex, roughness: 0.92, metalness: 0.02 });
  const woodMat = new THREE.MeshStandardMaterial({ color: "#916740", map: woodTex, roughness: 0.84, metalness: 0.04 });
  const metalMat = new THREE.MeshStandardMaterial({ color: "#7a7f87", roughness: 0.6, metalness: 0.32 });
  const boardMat = new THREE.MeshStandardMaterial({ color: "#264339", map: boardTex, roughness: 0.9, metalness: 0.02 });
  const stoneMat = new THREE.MeshStandardMaterial({ color: "#dcd6cd", map: stoneTex, roughness: 0.93, metalness: 0.03 });
  const beamMat = new THREE.MeshStandardMaterial({ color: "#f0e9de", map: wallTex, roughness: 0.9, metalness: 0.02 });
  const lawnMat = new THREE.MeshStandardMaterial({ color: "#708e5d", map: lawnTex, roughness: 1, metalness: 0.01 });
  const plazaMat = new THREE.MeshStandardMaterial({ color: "#c7cdd3", map: plazaTex, roughness: 0.96, metalness: 0.02 });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: "#ffffff",
    roughness: 0.001,
    transmission: 1,
    transparent: true,
    opacity: 0,
    thickness: 0.02,
    ior: 1.05,
    clearcoat: 0,
    clearcoatRoughness: 0,
    reflectivity: 0,
    envMapIntensity: 0,
    side: THREE.DoubleSide,
    attenuationColor: new THREE.Color("#ffffff"),
    attenuationDistance: 100,
    depthWrite: false,
  });

  const campusDepth = scaled(WORLD.corridor.campusDepth);
  addBox(
    worldGroup,
    [],
    new THREE.BoxGeometry(campusDepth, 0.12, floorLength * 1.14),
    lawnMat,
    new THREE.Vector3(minX - campusDepth * 0.54, FLOOR_Y - 0.1, floorCenterZ),
    null,
    null,
    null,
    false,
    true
  );
  addBox(
    worldGroup,
    [],
    new THREE.BoxGeometry(campusDepth * 0.44, 0.06, floorLength * 0.92),
    plazaMat,
    new THREE.Vector3(minX - campusDepth * 0.26, FLOOR_Y - 0.04, floorCenterZ + 0.26),
    null,
    null,
    null,
    false,
    true
  );

  const skyWall = new THREE.Mesh(
    new THREE.PlaneGeometry(floorLength * 1.04, 8.2),
    new THREE.MeshBasicMaterial({ color: "#dce7f2", transparent: true, opacity: 0.95, side: THREE.DoubleSide })
  );
  skyWall.position.set(minX - campusDepth * 0.22, 3.5, floorCenterZ);
  skyWall.rotation.y = Math.PI / 2;
  worldGroup.add(skyWall);

  const sunGlow = createGlowPlane("rgba(255,233,192,1)", 9.6, 6.2, 0.34);
  sunGlow.position.set(minX - campusDepth * 0.18, 4.2, scaled(720));
  sunGlow.rotation.y = Math.PI / 2;
  worldGroup.add(sunGlow);

  const canopyGlow = createGlowPlane("rgba(255,240,210,1)", 8.4, 4.8, 0.18);
  canopyGlow.position.set(minX - campusDepth * 0.16, 2.8, scaled(1740));
  canopyGlow.rotation.y = Math.PI / 2;
  worldGroup.add(canopyGlow);

  addBox(
    worldGroup,
    occluders,
    new THREE.BoxGeometry(corridorWidth, 0.08, floorLength),
    corridorFloorMat,
    new THREE.Vector3(corridorCenterX, FLOOR_Y - 0.04, floorCenterZ),
    null,
    colliders,
    null,
    false,
    true
  );
  addBox(
    worldGroup,
    occluders,
    new THREE.BoxGeometry(roomDepth, 0.08, floorLength),
    classroomFloorMat,
    new THREE.Vector3((classroomMinX + classroomMaxX) / 2, FLOOR_Y - 0.04, floorCenterZ),
    null,
    colliders,
    null,
    false,
    true
  );

  addBox(
    worldGroup,
    occluders,
    new THREE.BoxGeometry(maxX - minX, corridorHeight, wallThickness),
    wallMat,
    new THREE.Vector3((minX + maxX) / 2, corridorHeight / 2, minZ),
    null,
    colliders,
    { minX, maxX, minZ: minZ - wallThickness / 2, maxZ: minZ + wallThickness / 2, label: "floor_front" }
  );
  addBox(
    worldGroup,
    occluders,
    new THREE.BoxGeometry(maxX - minX, corridorHeight, wallThickness),
    wallMat,
    new THREE.Vector3((minX + maxX) / 2, corridorHeight / 2, maxZ),
    null,
    colliders,
    { minX, maxX, minZ: maxZ - wallThickness / 2, maxZ: maxZ + wallThickness / 2, label: "floor_back" }
  );

  addBox(
    worldGroup,
    occluders,
    new THREE.BoxGeometry(wallThickness, parapetHeight, floorLength),
    stoneMat,
    new THREE.Vector3(minX, parapetHeight / 2, floorCenterZ),
    null,
    colliders,
    { minX: minX - wallThickness / 2, maxX: minX + wallThickness / 2, minZ, maxZ, label: "parapet" }
  );
  addBox(
    worldGroup,
    occluders,
    new THREE.BoxGeometry(0.18, 0.1, floorLength),
    beamMat,
    new THREE.Vector3(minX + 0.06, parapetHeight + 0.06, floorCenterZ),
    null,
    colliders,
    null
  );

  addBox(
    worldGroup,
    [],
    new THREE.BoxGeometry(0.92, 0.012, floorLength * 0.98),
    new THREE.MeshBasicMaterial({ color: "#fff1cf", transparent: true, opacity: 0.1 }),
    new THREE.Vector3(minX + 0.48, 0.014, floorCenterZ),
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

  const parapetShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.96, floorLength * 0.98),
    new THREE.MeshBasicMaterial({ color: "#8694a4", transparent: true, opacity: 0.12, side: THREE.DoubleSide })
  );
  parapetShadow.position.set(minX + 1.02, 0.018, floorCenterZ);
  parapetShadow.rotation.x = -Math.PI / 2;
  worldGroup.add(parapetShadow);

  const stairWoodMat = new THREE.MeshStandardMaterial({ color: "#b08d67", map: woodTex, roughness: 0.78, metalness: 0.04 });
  const stairRailMat = new THREE.MeshPhysicalMaterial({ color: "#ded4c2", roughness: 0.56, metalness: 0.06, clearcoat: 0.14 });
  const stairRiserMat = new THREE.MeshStandardMaterial({ color: "#d8cfc2", roughness: 0.88, metalness: 0.01 });
  const balusterMat = new THREE.MeshPhysicalMaterial({ color: "#c8bfaf", roughness: 0.48, metalness: 0.08, clearcoat: 0.18 });

  const stairZones = [
    { id: "back_stair", z1: backStairZ1, z2: backStairZ2, direction: -1 },
    { id: "front_stair", z1: frontStairZ1, z2: frontStairZ2, direction: 1 },
  ];
  stairZones.forEach((zone) => {
    const zoneCenter = (zone.z1 + zone.z2) / 2;
    const zoneLen = zone.z2 - zone.z1;

    // Landing platform
    const landing = new THREE.Mesh(new THREE.BoxGeometry(corridorWidth - 0.28, 0.06, zoneLen), stairRiserMat);
    landing.position.set(corridorCenterX, FLOOR_Y - 0.03, zoneCenter);
    landing.receiveShadow = true;
    worldGroup.add(landing);

    const stairCount = 9;
    const stepW = corridorWidth * 0.86;
    const stepH = 0.14;
    const stepD = (zoneLen - 0.24) / stairCount;

    for (let index = 0; index < stairCount; index += 1) {
      const zOffset = zone.direction > 0
        ? THREE.MathUtils.lerp(zone.z1 + 0.12, zone.z2 - 0.24, index / stairCount)
        : THREE.MathUtils.lerp(zone.z2 - 0.12, zone.z1 + 0.24, index / stairCount);
      const stepY = FLOOR_Y - stepH * 0.5 - index * stepH;

      // Tread (horizontal surface)
      const tread = new THREE.Mesh(new THREE.BoxGeometry(stepW, 0.04, stepD + 0.02), stairWoodMat);
      tread.position.set(corridorCenterX, stepY, zOffset + zone.direction * stepD * 0.5);
      tread.receiveShadow = true;
      tread.castShadow = false;
      worldGroup.add(tread);

      // Riser (vertical face)
      const riser = new THREE.Mesh(new THREE.BoxGeometry(stepW, stepH, 0.02), stairRiserMat);
      riser.position.set(corridorCenterX, stepY - stepH * 0.5, zOffset + zone.direction * 0.01);
      worldGroup.add(riser);
    }

    // Handrail system — top rail
    const railH = 0.9;
    const topRail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, zoneLen - 0.18), stairRailMat);
    topRail.position.set(corridorMinX + 0.9, FLOOR_Y + railH - stepH * stairCount * 0.5, zoneCenter);
    worldGroup.add(topRail);

    const bottomRail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, zoneLen - 0.18), balusterMat);
    bottomRail.position.set(corridorMinX + 0.9, FLOOR_Y + railH * 0.3 - stepH * stairCount * 0.5, zoneCenter);
    worldGroup.add(bottomRail);

    // Balusters (vertical posts every ~0.22m)
    const balusterSpacing = 0.22;
    const balusterCount = Math.floor((zoneLen - 0.3) / balusterSpacing);
    for (let bi = 0; bi <= balusterCount; bi++) {
      const bz = zone.z1 + 0.15 + (bi / balusterCount) * (zoneLen - 0.3);
      const bHeight = railH * 0.9;
      const baluster = new THREE.Mesh(new THREE.BoxGeometry(0.03, bHeight, 0.03), balusterMat);
      baluster.position.set(corridorMinX + 0.9, FLOOR_Y - stepH * stairCount * 0.5 + bHeight / 2, bz);
      worldGroup.add(baluster);
    }

    // Newel posts at each end
    const newelGeo = new THREE.BoxGeometry(0.08, railH + 0.04, 0.08);
    const newelStart = new THREE.Mesh(newelGeo, stairRailMat);
    newelStart.position.set(corridorMinX + 0.9, FLOOR_Y + (railH + 0.04) / 2, zone.z1 + 0.08);
    worldGroup.add(newelStart);
    const newelEnd = new THREE.Mesh(newelGeo, stairRailMat);
    newelEnd.position.set(corridorMinX + 0.9, FLOOR_Y + (railH + 0.04) / 2, zone.z2 - 0.08);
    worldGroup.add(newelEnd);

    // Wall grab rail on corridor wall side
    const wallRail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, zoneLen - 0.22), stairRailMat);
    wallRail.position.set(minX + 0.06, FLOOR_Y + 0.88, zoneCenter);
    worldGroup.add(wallRail);

    // Stair wall (back wall of stairwell)
    const stairWall = new THREE.Mesh(new THREE.BoxGeometry(0.22, corridorHeight, zoneLen), corridorWallMat);
    stairWall.position.set(classroomMinX, corridorHeight / 2, zoneCenter);
    stairWall.castShadow = true;
    stairWall.receiveShadow = true;
    worldGroup.add(stairWall);
    addCollider(colliders, classroomMinX - 0.11, classroomMinX + 0.11, zone.z1, zone.z2, `${zone.id}_wall`);

    addCollider(
      colliders,
      corridorMinX + 0.36,
      classroomMinX - 0.2,
      zone.direction > 0 ? zone.z1 + 0.06 : zone.z1,
      zone.direction > 0 ? zone.z1 + 0.22 : zone.z2 - 0.22,
      `${zone.id}_guard`
    );
  });

  const room = lm402Room;
  const z1 = lm402Z1;
  const z2 = lm402Z2;
  const roomLength = z2 - z1;
  const centerZ = (z1 + z2) / 2;
  const openings = [
    { ...WORLD.frontDoor, kind: "front", z1: frontDoorZ1, z2: frontDoorZ2 },
    { ...WORLD.backDoor, kind: "back", z1: backDoorZ1, z2: backDoorZ2 },
  ].sort((a, b) => a.z1 - b.z1);

  // ── Helper: build an end-wall (running along X axis) with 4 large window openings ──
  // winGap: glass window height range [y1, y2]
  // doorOpening: { x1, x2 } in scene units (where the door gap is, no wall placed here)
  const doorMat = new THREE.MeshPhysicalMaterial({
    color: "#d4c8b4",
    roughness: 0.62,
    metalness: 0.04,
    clearcoat: 0.12,
    clearcoatRoughness: 0.44,
  });

  const buildEndWall = (wallZ, inwardDir, doorXCenter, doorXHalfWidth) => {
    const winY1 = scaled(84);
    const winY2 = scaled(256);
    const winH = winY2 - winY1;
    const winCY = (winY1 + winY2) / 2;
    const totalX = roomDepth; // classroomMaxX - classroomMinX
    // 4 windows evenly spaced across the room, with door gap excluded
    const margins = 0.22;
    const gap = 0.14; // gap between window frames
    const doorClearX1 = doorXCenter - doorXHalfWidth - 0.14;
    const doorClearX2 = doorXCenter + doorXHalfWidth + 0.14;

    // Create window segments across the full wall (skipping over door gap if any)
    // We create: [classroomMinX..doorClearX1] window zone + [doorClearX2..classroomMaxX] window zone
    // Then add solid wall above/below window height and at narrow pillars
    const buildWindowZone = (fromX, toX) => {
      const zoneWidth = toX - fromX;
      if (zoneWidth < 0.5) return;
      const numWin = zoneWidth > 2.0 ? 2 : 1;
      const winWidth = (zoneWidth - (numWin + 1) * gap) / numWin;
      for (let wi = 0; wi < numWin; wi++) {
        const wx = fromX + gap + (winWidth + gap) * wi + winWidth / 2;
        // Glass
        const gp = new THREE.Mesh(new THREE.PlaneGeometry(winWidth, winH), glassMat);
        gp.position.set(wx, winCY, wallZ + inwardDir * 0.045);
        gp.castShadow = false; gp.receiveShadow = false;
        worldGroup.add(gp);
        // Highlight shimmer
        const hl = createGlowPlane("rgba(255,255,255,1)", winWidth * 0.72, winH * 0.78, 0.07);
        hl.position.set(wx, winCY + winH * 0.02, wallZ + inwardDir * 0.09);
        worldGroup.add(hl);
        // Frame
        const fr = new THREE.Mesh(new THREE.BoxGeometry(winWidth + 0.12, winH + 0.14, 0.10), beamMat);
        fr.position.set(wx, winCY, wallZ);
        worldGroup.add(fr);
        // Solid wall above window (transom strip)
        const above = new THREE.Mesh(
          new THREE.BoxGeometry(winWidth + 0.04, corridorHeight - winY2 + 0.04, wallThickness),
          wallMat
        );
        above.position.set(wx, winY2 + (corridorHeight - winY2) / 2, wallZ);
        worldGroup.add(above);
        // Solid wall below window (sill strip)
        const below = new THREE.Mesh(
          new THREE.BoxGeometry(winWidth + 0.04, winY1 + 0.02, wallThickness),
          wallMat
        );
        below.position.set(wx, winY1 / 2, wallZ);
        worldGroup.add(below);
      }
      // Narrow pillar at left edge
      const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(gap, corridorHeight, wallThickness), wallMat);
      leftPillar.position.set(fromX + gap / 2, corridorHeight / 2, wallZ);
      worldGroup.add(leftPillar);
      // Narrow pillar at right edge
      const rightPillar = leftPillar.clone();
      rightPillar.position.set(toX - gap / 2, corridorHeight / 2, wallZ);
      worldGroup.add(rightPillar);
      // Add collider for this window zone (thin wall)
      if (inwardDir > 0) {
        addCollider(colliders, fromX, toX, wallZ - wallThickness / 2, wallZ + wallThickness / 2, "end_wall_win");
      } else {
        addCollider(colliders, fromX, toX, wallZ - wallThickness / 2, wallZ + wallThickness / 2, "end_wall_win");
      }
    };

    // Left window zone (before door gap)
    if (doorClearX1 > classroomMinX + 0.5) {
      buildWindowZone(classroomMinX, doorClearX1);
    }
    // Right window zone (after door gap)
    if (doorClearX2 < classroomMaxX - 0.5) {
      buildWindowZone(doorClearX2, classroomMaxX);
    }
    // Door lintel (solid wall above door opening, full height above door)
    const lintelY = 2.20; // top of door opening
    const lintelH = corridorHeight - lintelY;
    const lintel = new THREE.Mesh(
      new THREE.BoxGeometry(doorXHalfWidth * 2 + 0.04, lintelH, wallThickness),
      wallMat
    );
    lintel.position.set(doorXCenter, lintelY + lintelH / 2, wallZ);
    worldGroup.add(lintel);
    addCollider(colliders, doorXCenter - doorXHalfWidth - 0.02, doorXCenter + doorXHalfWidth + 0.02, wallZ - wallThickness / 2, wallZ + wallThickness / 2, "end_wall_lintel");
  };

  // ── Helper: add an open door mesh (hinged to one jamb, swung inward 90°) ──
  const addOpenDoor = (hingeX, hingeZ, swingDir, facingZ) => {
    const doorW = 0.92; // door leaf width
    const doorH = 2.18;
    // Door is swung 90° — hinged at the jamb, flat against the wall
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.04, doorH, doorW), doorMat);
    door.position.set(hingeX + swingDir * 0.02, doorH / 2, hingeZ + doorW / 2);
    door.castShadow = true;
    door.receiveShadow = true;
    worldGroup.add(door);
  };

  // Front door opening: in the corridorWallMat (classroomMinX) at frontDoorZ1..frontDoorZ2
  // The corridor side wall (classroomMinX) has the door at z ≈ frontDoorZ1..frontDoorZ2
  // End wall z2 (back of classroom / board wall) — no door on this end wall
  // End wall z1 — back of classroom (deeper into building) — no door on this end wall either
  // Doors are on the corridor-side wall (classroomMinX), not the end walls.

  // Front/back end walls — both get 4 windows spanning the room width (no door in end walls)
  buildEndWall(z1, 1, (classroomMinX + classroomMaxX) / 2, 0); // back wall (no door in end wall)
  buildEndWall(z2, -1, (classroomMinX + classroomMaxX) / 2, 0); // front wall (no door in end wall, board here)

  const leftWindowOpenings = WORLD.leftWallWindows.map((panel) => openingFromPanel(panel, "left"));
  const rightWindowOpenings = WORLD.rightWallWindows.map((panel) => openingFromPanel(panel, "right"));
  const doorOpenings = openings.map((door) => ({
    z1: door.z1 - 0.50,
    z2: door.z2 + 0.50,
    y1: 0,
    y2: 2.50,
  }));

  buildWallWithOpenings({
    x: classroomMaxX,
    zStart: z1,
    zEnd: z2,
    openings: rightWindowOpenings,
    material: wallMat,
    label: "right_wall",
  });

  const dividerSegments = [];
  if (minZ < z1) {
    dividerSegments.push([minZ, z1]);
  }
  if (z2 < maxZ) {
    dividerSegments.push([z2, maxZ]);
  }
  dividerSegments.forEach(([start, end]) => {
    if (end <= start) {
      return;
    }
    addBox(
      worldGroup,
      occluders,
      new THREE.BoxGeometry(wallThickness, corridorHeight, end - start),
      corridorWallMat,
      new THREE.Vector3(classroomMinX, corridorHeight / 2, start + (end - start) / 2),
      null,
      colliders,
      { minX: classroomMinX - wallThickness / 2, maxX: classroomMinX + wallThickness / 2, minZ: start, maxZ: end, label: "divider_wall" }
    );
  });

  buildWallWithOpenings({
    x: classroomMinX,
    zStart: z1,
    zEnd: z2,
    openings: [...doorOpenings, ...leftWindowOpenings],
    material: corridorWallMat,
    label: "divider_wall",
  });

  // ── Physical open doors at front and back door positions ──
  // Front door: corridor side, door swings into classroom (toward +x)
  addOpenDoor(classroomMinX, frontDoorZ1 + 0.02, 1, 1);
  // Back door: corridor side, door swings into classroom (toward +x)
  addOpenDoor(classroomMinX, backDoorZ1 + 0.02, 1, 1);


  const plaque = buildTextPlane("LM402", 1.72, 0.42, { bg: "#4a5562", fg: "#fff6de" });
  plaque.position.set(scaled(WORLD.plaque.x), scaled(WORLD.plaque.y), scaled(WORLD.plaque.z));
  plaque.rotation.y = Math.PI / 2;
  plaque.material = plaque.material.clone();
  plaque.material.emissive = new THREE.Color("#8a7959");
  plaque.material.emissiveIntensity = 0.56;
  worldGroup.add(plaque);

  const plaqueBacker = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.58, 1.54),
    new THREE.MeshStandardMaterial({ color: "#ded6cb", map: wallTex, roughness: 0.9, metalness: 0.01 })
  );
  plaqueBacker.position.set(classroomMinX + 0.012, scaled(WORLD.plaque.y) - 0.06, scaled(WORLD.plaque.z));
  worldGroup.add(plaqueBacker);

  const plaqueLight = new THREE.PointLight(0xfff1cf, 0.34, 6, 2);
  plaqueLight.position.set(classroomMinX + 0.54, scaled(WORLD.plaque.y) + 0.08, scaled(WORLD.plaque.z));
  worldGroup.add(plaqueLight);

  const noticeBoard = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.92, 1.12),
    new THREE.MeshStandardMaterial({ color: "#9b744b", map: woodTex, roughness: 0.82, metalness: 0.02 })
  );
  noticeBoard.position.set(classroomMinX + 0.02, 1.42, scaled(660));
  worldGroup.add(noticeBoard);

  const noticeSheet = new THREE.Mesh(
    new THREE.PlaneGeometry(0.84, 0.62),
    new THREE.MeshStandardMaterial({ color: "#f4efe5", roughness: 0.94, metalness: 0.01, side: THREE.DoubleSide })
  );
  noticeSheet.position.set(classroomMinX + 0.06, 1.42, scaled(660));
  noticeSheet.rotation.y = Math.PI / 2;
  worldGroup.add(noticeSheet);

  WORLD.floorRooms
    .filter((room) => !room.interactive)
    .forEach((room, index) => {
      const roomCenterZ = roomCenter(room);
      const plaqueText = room.label;
      const roomPlaque = buildTextPlane(plaqueText, 1.04, 0.26, { bg: "#5c6672", fg: "#f7f0de" });
      roomPlaque.position.set(classroomMinX - 0.31, 1.92, roomCenterZ + 0.22);
      roomPlaque.rotation.y = Math.PI / 2;
      worldGroup.add(roomPlaque);
    });

  WORLD.wallLabels.forEach((label) => {
    const labelNode = buildWallLabel(label.id);
    labelNode.position.set(scaled(label.x), scaled(label.y), scaled(label.z));
    labelNode.rotation.y = label.rotateY ?? 0;
    worldGroup.add(labelNode);
  });

  WORLD.rightWallWindows.forEach((panel) => {
    const centerPanelZ = scaled(panel.z);
    const height = scaled(panel.y2 - panel.y1);
    const centerY = scaled((panel.y1 + panel.y2) / 2);
    const width = scaled(panel.width);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(width, height), glassMat);
    glass.position.set(classroomMaxX - 0.045, centerY, centerPanelZ);
    glass.rotation.y = -Math.PI / 2;
    glass.castShadow = false;
    glass.receiveShadow = false;
    worldGroup.add(glass);
    const highlight = createGlowPlane("rgba(255,255,255,1)", width * 0.72, height * 0.78, 0.08);
    highlight.position.set(classroomMaxX - 0.08, centerY + height * 0.02, centerPanelZ - 0.02);
    highlight.rotation.y = -Math.PI / 2;
    highlight.rotation.z = -0.06;
    worldGroup.add(highlight);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.12, height + 0.18, width + 0.16), beamMat);
    frame.position.set(classroomMaxX - 0.06, centerY, centerPanelZ);
    frame.scale.x = 0.78;
    worldGroup.add(frame);
    const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.06, height + 0.08, 0.028), beamMat);
    mullion.position.set(classroomMaxX - 0.022, centerY, centerPanelZ);
    worldGroup.add(mullion);
    const transom = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.06, width - 0.06), beamMat);
    transom.position.set(classroomMaxX - 0.022, centerY + height * 0.08, centerPanelZ);
    worldGroup.add(transom);
  });

  WORLD.leftWallWindows.forEach((panel) => {
    const centerPanelZ = scaled(panel.z);
    const height = scaled(panel.y2 - panel.y1);
    const centerY = scaled((panel.y1 + panel.y2) / 2);
    const width = scaled(panel.width);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(width, height), glassMat);
    glass.position.set(classroomMinX + 0.04, centerY, centerPanelZ);
    glass.rotation.y = Math.PI / 2;
    glass.castShadow = false;
    glass.receiveShadow = false;
    worldGroup.add(glass);
    const highlight = createGlowPlane("rgba(255,255,255,1)", width * 0.72, height * 0.78, 0.07);
    highlight.position.set(classroomMinX + 0.08, centerY + height * 0.02, centerPanelZ + 0.02);
    highlight.rotation.y = Math.PI / 2;
    highlight.rotation.z = 0.06;
    worldGroup.add(highlight);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.12, height + 0.18, width + 0.16), beamMat);
    frame.position.set(classroomMinX + 0.06, centerY, centerPanelZ);
    frame.scale.x = 0.78;
    worldGroup.add(frame);
    const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.06, height + 0.08, 0.028), beamMat);
    mullion.position.set(classroomMinX + 0.022, centerY, centerPanelZ);
    worldGroup.add(mullion);
    const transom = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.06, width - 0.06), beamMat);
    transom.position.set(classroomMinX + 0.022, centerY + height * 0.08, centerPanelZ);
    worldGroup.add(transom);
  });

  // ── Front wall (z2) and back wall (z1) transparent windows ──
  // These are the short end-walls of the classroom (perpendicular to the corridor).
  // We add two windows per wall (left half and right half), skipping the board area.
  const endWallWindowData = [
    // Back wall at z1 – two windows spanning the right half of the room
    { z: z1, facing: 1,  xSets: [
      { cx: classroomMinX + (roomDepth * 0.22), w: roomDepth * 0.34 },
      { cx: classroomMinX + (roomDepth * 0.74), w: roomDepth * 0.34 },
    ]},
    // Front wall at z2 – windows flanking the blackboard
    { z: z2, facing: -1, xSets: [
      { cx: classroomMinX + (roomDepth * 0.14), w: roomDepth * 0.22 },
      { cx: classroomMinX + (roomDepth * 0.86), w: roomDepth * 0.22 },
    ]},
  ];
  const glassWinY1 = scaled(84);
  const glassWinY2 = scaled(258);
  const glassWinH = glassWinY2 - glassWinY1;
  const glassWinCY = (glassWinY1 + glassWinY2) / 2;
  endWallWindowData.forEach(({ z: wallZ, facing, xSets }) => {
    xSets.forEach(({ cx, w }) => {
      // Glass plane
      const gp = new THREE.Mesh(new THREE.PlaneGeometry(w, glassWinH), glassMat);
      gp.position.set(cx, glassWinCY, wallZ + facing * 0.045);
      gp.castShadow = false;
      gp.receiveShadow = false;
      worldGroup.add(gp);
      // Highlight shimmer
      const hl = createGlowPlane("rgba(255,255,255,1)", w * 0.72, glassWinH * 0.78, 0.07);
      hl.position.set(cx, glassWinCY + glassWinH * 0.02, wallZ + facing * 0.09);
      worldGroup.add(hl);
      // Window frame
      const fr = new THREE.Mesh(new THREE.BoxGeometry(w + 0.16, glassWinH + 0.18, 0.12), beamMat);
      fr.position.set(cx, glassWinCY, wallZ + facing * 0.04);
      fr.scale.z = 0.78;
      worldGroup.add(fr);
      // Vertical mullion
      const ml = new THREE.Mesh(new THREE.BoxGeometry(0.028, glassWinH + 0.08, 0.06), beamMat);
      ml.position.set(cx, glassWinCY, wallZ + facing * 0.022);
      worldGroup.add(ml);
    });
  });

  addBox(
    worldGroup,
    occluders,
    new THREE.BoxGeometry(boardX2 - boardX1 + 0.22, corridorHeight, wallThickness),
    wallMat,
    new THREE.Vector3((boardX1 + boardX2) / 2, corridorHeight / 2, z2),
    null,
    colliders,
    { minX: boardX1 - 0.12, maxX: boardX2 + 0.12, minZ: z2 - wallThickness / 2, maxZ: z2 + wallThickness / 2, label: "board_wall" }
  );

  addBox(
    worldGroup,
    occluders,
    new THREE.BoxGeometry(boardX2 - boardX1, scaled(WORLD.board.y2 - WORLD.board.y1), 0.06),
    boardMat,
    new THREE.Vector3(boardCenterX, scaled((WORLD.board.y1 + WORLD.board.y2) / 2), boardZ - 0.02),
    null,
    colliders,
    null
  );
  addBox(
    worldGroup,
    occluders,
    new THREE.BoxGeometry(boardX2 - boardX1 + 0.18, 0.07, 0.16),
    beamMat,
    new THREE.Vector3(boardCenterX, scaled(WORLD.board.y1) - 0.12, boardZ - 0.1),
    null,
    colliders,
    null
  );

  const lectern = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.98, 0.72), woodMat);
  lectern.position.set(boardCenterX - 4.2, 0.49, boardZ - 0.86);
  lectern.castShadow = true;
  lectern.receiveShadow = true;
  worldGroup.add(lectern);
  addCollider(colliders, lectern.position.x - 0.36, lectern.position.x + 0.36, lectern.position.z - 0.31, lectern.position.z + 0.31, "lectern");

  const clock = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 0.05, 32),
    new THREE.MeshStandardMaterial({ color: "#f6efe5", roughness: 0.9, metalness: 0.02 })
  );
  clock.rotation.z = Math.PI / 2;
  clock.position.set(boardCenterX + 6.1, 2.14, boardZ - 0.02);
  worldGroup.add(clock);

  WORLD.lightBeams.forEach((beam, index) => {
    const beamMaterial = new THREE.MeshBasicMaterial({
      color: beam.side === "right" ? "#ffd79f" : "#f7e2be",
      transparent: true,
      opacity: beam.alpha,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(scaled(beam.width), scaled(beam.reach)), beamMaterial);
    if (beam.side === "right") {
      plane.position.set(classroomMaxX - 0.18, 1.3, scaled(beam.z));
      plane.rotation.x = -Math.PI / 2.76;
      plane.rotation.z = 0.12;
    } else {
      plane.position.set(classroomMinX + 0.44, 1.24, scaled(beam.z));
      plane.rotation.x = Math.PI / 2.7;
      plane.rotation.z = -0.12;
    }
    plane.rotation.y = index % 2 ? 0.06 : -0.06;
    worldGroup.add(plane);
  });

  const corridorSunPatch = createGlowPlane("rgba(255,232,178,1)", 8.4, 3.8, 0.4);
  corridorSunPatch.position.set(minX + 1.96, 0.018, scaled(WORLD.frontDoor.center.z - 28));
  corridorSunPatch.rotation.x = -Math.PI / 2;
  corridorSunPatch.rotation.z = 0.12;
  worldGroup.add(corridorSunPatch);

  const parapetSunPatch = createGlowPlane("rgba(255,240,205,1)", 8.8, 4.2, 0.34);
  parapetSunPatch.position.set(minX + 0.72, 1.56, scaled(WORLD.frontDoor.center.z + 44));
  parapetSunPatch.rotation.y = Math.PI / 2;
  parapetSunPatch.rotation.z = 0.04;
  worldGroup.add(parapetSunPatch);

  const corridorWallLight = createGlowPlane("rgba(255,232,182,1)", 4.8, 3.2, 0.3);
  corridorWallLight.position.set(classroomMinX + 0.12, 1.74, scaled(WORLD.frontDoor.center.z - 32));
  corridorWallLight.rotation.y = Math.PI / 2;
  worldGroup.add(corridorWallLight);

  const doorwayGlow = createGlowPlane("rgba(255,241,210,1)", 3.6, 2.8, 0.32);
  doorwayGlow.position.set(classroomMinX + 0.48, 1.52, scaled(WORLD.frontDoor.center.z + 8));
  doorwayGlow.rotation.y = Math.PI / 2;
  worldGroup.add(doorwayGlow);

  const classroomSunPatch = createGlowPlane("rgba(255,226,174,1)", 8.6, 3.4, 0.34);
  classroomSunPatch.position.set(classroomMaxX - 3.18, 0.019, scaled(WORLD.classroom.lightWellZ + 84));
  classroomSunPatch.rotation.x = -Math.PI / 2;
  classroomSunPatch.rotation.z = -0.16;
  worldGroup.add(classroomSunPatch);

  const leftClassroomSunPatch = createGlowPlane("rgba(255,236,196,1)", 6.2, 2.8, 0.22);
  leftClassroomSunPatch.position.set(classroomMinX + 2.16, 0.018, scaled(WORLD.classroom.lightWellZ - 104));
  leftClassroomSunPatch.rotation.x = -Math.PI / 2;
  leftClassroomSunPatch.rotation.z = 0.14;
  worldGroup.add(leftClassroomSunPatch);

  const backdoorSunPatch = createGlowPlane("rgba(255,240,198,1)", 3.8, 2.1, 0.22);
  backdoorSunPatch.position.set(classroomMinX + 1.12, 0.018, scaled(WORLD.backDoor.center.z));
  backdoorSunPatch.rotation.x = -Math.PI / 2;
  backdoorSunPatch.rotation.z = 0.08;
  worldGroup.add(backdoorSunPatch);

  const seatSunPatch = createGlowPlane("rgba(255,226,184,1)", 4.4, 2.2, 0.24);
  seatSunPatch.position.set(scaled(1896), 0.02, scaled(2058));
  seatSunPatch.rotation.x = -Math.PI / 2;
  seatSunPatch.rotation.z = -0.22;
  worldGroup.add(seatSunPatch);

  WORLD.desks.forEach((desk, index) => {
    const x = scaled(desk.x);
    const z = scaled(desk.z);
    const deskGroup = new THREE.Group();
    deskGroup.position.set(x, 0, z);

    const top = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.08, 0.84), woodMat);
    top.position.set(0, 0.78, 0.08);
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.05, 0.24), woodMat);
    shelf.position.set(0, 0.48, 0.1);
    const modesty = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.24, 0.04), woodMat);
    modesty.position.set(0, 0.64, -0.16);
    const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.05, 0.3), woodMat);
    chairSeat.position.set(0, 0.49, -0.42);
    const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.44, 0.05), woodMat);
    chairBack.position.set(0, 0.78, -0.56);
    deskGroup.add(top, shelf, modesty, chairSeat, chairBack);

    [
      [-0.24, -0.2],
      [0.24, -0.2],
      [-0.24, 0.28],
      [0.24, 0.28],
    ].forEach(([dx, dz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.78, 0.06), metalMat);
      leg.position.set(dx, 0.39, dz);
      deskGroup.add(leg);
    });

    [
      [-0.12, -0.54],
      [0.12, -0.54],
      [-0.12, -0.3],
      [0.12, -0.3],
    ].forEach(([dx, dz]) => {
      const chairLeg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.46, 0.04), metalMat);
      chairLeg.position.set(dx, 0.23, dz);
      deskGroup.add(chairLeg);
    });

    if (index % 4 === 2) {
      const notebook = new THREE.Mesh(
        new THREE.BoxGeometry(0.19, 0.018, 0.14),
        new THREE.MeshStandardMaterial({ color: "#f2eee8", roughness: 0.94, metalness: 0.01 })
      );
      notebook.position.set(0.1, 0.83, 0.14);
      notebook.rotation.y = 0.26;
      deskGroup.add(notebook);
    }

    setShadow(deskGroup, false, true);
    worldGroup.add(deskGroup);
    addCollider(colliders, x - 0.38, x + 0.38, z - 0.66, z + 0.5, `desk_${index}`);
  });

  WORLD.notes.forEach((note) => {
    const page = new THREE.Mesh(
      new THREE.PlaneGeometry(0.22, 0.18),
      new THREE.MeshStandardMaterial({ color: "#f4efe6", roughness: 0.96, metalness: 0.01, side: THREE.DoubleSide })
    );
    page.rotation.x = -Math.PI / 2;
    page.position.set(scaled(note.x), scaled(note.y) + 0.01, scaled(note.z));
    worldGroup.add(page);
  });

  WORLD.campusTrees.forEach((tree, index) => {
    const treeNode = createTree({ scale: tree.scale });
    treeNode.position.set(scaled(tree.x), 0, scaled(tree.z));
    treeNode.rotation.y = index * 0.6;
    setShadow(treeNode, false, true);
    worldGroup.add(treeNode);
  });

  const distantAcademicBlock = new THREE.Mesh(
    new THREE.BoxGeometry(4.8, 2.2, floorLength * 0.54),
    new THREE.MeshStandardMaterial({ color: "#b7bec7", roughness: 0.95, metalness: 0.02 })
  );
  distantAcademicBlock.position.set(minX - campusDepth * 0.34, 1.12, floorCenterZ + 0.2);
  distantAcademicBlock.receiveShadow = true;
  worldGroup.add(distantAcademicBlock);

  const dustGeometry = new THREE.BufferGeometry();
  const dustPositions = [];
  for (let index = 0; index < quality.dustCount; index += 1) {
    dustPositions.push(
      THREE.MathUtils.lerp(minX + 0.24, maxX - 0.2, Math.random()),
      THREE.MathUtils.lerp(0.26, 2.84, Math.random()),
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

  const debugAnchors = {
    senior: new THREE.Vector3(),
    junior: new THREE.Vector3(),
    frontDoor: worldPointScaled(WORLD.frontDoor.center.x, WORLD.frontDoor.center.y, WORLD.frontDoor.center.z),
    backDoor: worldPointScaled(WORLD.backDoor.center.x, WORLD.backDoor.center.y, WORLD.backDoor.center.z),
    doorPlaque: worldPointScaled(WORLD.plaque.x, WORLD.plaque.y, WORLD.plaque.z),
    parapetBand: new THREE.Vector3(minX + 0.22, scaled(WORLD.corridor.parapetHeight) + 0.32, scaled(WORLD.frontDoor.center.z - 8)),
    boardWall: new THREE.Vector3(boardCenterX, scaled((WORLD.board.y1 + WORLD.board.y2) / 2), boardZ - 0.02),
  };

  const senior = createPerson({
    torso: "#f6f7fb",
    torsoAccent: "#dde4ee",
    legs: "#273140",
    skin: "#f0d5c7",
    hair: "#23191a",
    shoes: "#f4f5f6",
    iris: "#5c463b",
    female: false,
    phone: true,
    scale: 1.08,
  });
  const junior = createPerson({
    torso: "#fffdfa",
    torsoAccent: "#ffffff",
    legs: "#2f5b84",
    skin: "#f8e2d2",
    hair: "#4a3330",
    shoes: "#fffefb",
    iris: "#604434",
    female: true,
    highlight: true,
    referenceJunior: true,
    scale: 1.09,
  });
  const fatherEcho = createPerson({
    torso: "#f2c49e",
    torsoAccent: "#ffd8b8",
    legs: "#ffe9d5",
    skin: "#f0c7ab",
    hair: "#533f3c",
    shoes: "#4b4040",
    female: false,
    echo: true,
    echoOpacity: 0.28,
    echoColor: "#ffd5b0",
    scale: 0.98,
  });
  const auntEcho = createPerson({
    torso: "#ffd8e4",
    torsoAccent: "#ffe8ef",
    legs: "#ffd8e4",
    skin: "#f0cab4",
    hair: "#5a4648",
    shoes: "#5a4749",
    female: true,
    echo: true,
    echoOpacity: 0.26,
    echoColor: "#ffc0d6",
    scale: 1,
  });
  actorGroup.add(senior, junior, fatherEcho, auntEcho);

  const hotspotColorMap = {
    scene: 0xfbe3b8,
    memory: 0x9ad8ff,
  };
  [
    { id: "front_call", type: "scene" },
    { id: "plaque", type: "memory" },
    { id: "board", type: "memory" },
    { id: "seat", type: "memory" },
    { id: "notes", type: "memory" },
    { id: "junior", type: "scene" },
    { id: "backdoor", type: "scene" },
  ].forEach((meta) => {
    const ring = createRing(hotspotColorMap[meta.type]);
    hotspotNodes.set(meta.id, ring);
    glowGroup.add(ring);
  });

  const introCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(minX - campusDepth * 0.74, 12.2, scaled(3050)),
    new THREE.Vector3(minX - campusDepth * 0.62, 11.0, scaled(2820)),
    new THREE.Vector3(minX - campusDepth * 0.52, 9.8, scaled(2520)),
    new THREE.Vector3(minX - campusDepth * 0.42, 8.8, scaled(2140)),
    new THREE.Vector3(minX - campusDepth * 0.32, 7.6, scaled(1780)),
    new THREE.Vector3(minX - campusDepth * 0.2, 6.6, scaled(1430)),
    new THREE.Vector3(minX - campusDepth * 0.1, 5.6, scaled(1100)),
    new THREE.Vector3(minX + 0.08, 4.7, scaled(860)),
    new THREE.Vector3(minX + 0.62, 3.94, scaled(1380)),
    new THREE.Vector3(corridorMinX + 1.42, 3.14, scaled(1780)),
    new THREE.Vector3(corridorMinX + 2.28, 2.42, scaled(WORLD.frontDoor.center.z - 214)),
    new THREE.Vector3(corridorMinX + 2.06, 2.06, scaled(WORLD.frontDoor.center.z - 146)),
  ]);
  const introTube = new THREE.Mesh(
    new THREE.TubeGeometry(introCurve, 220, 0.074, 12, false),
    new THREE.MeshStandardMaterial({
      color: "#f1627d",
      emissive: "#f1627d",
      emissiveIntensity: 1.72,
      roughness: 0.2,
      metalness: 0.08,
      transparent: true,
      opacity: 0.96,
    })
  );
  introGroup.add(introTube);

  const introDaughter = createPerson({
    torso: "#f7ddd6",
    torsoAccent: "#fff3ee",
    legs: "#f5e7dc",
    skin: "#efd3c3",
    hair: "#2d2324",
    shoes: "#f7efe6",
    iris: "#3a241f",
    female: true,
    scale: 0.96,
  });
  introGroup.add(introDaughter);

  const introSenior = createPerson({
    torso: "#f5f7fb",
    torsoAccent: "#dde4ee",
    legs: "#28313e",
    skin: "#ecd0c1",
    hair: "#20181b",
    shoes: "#f3f5f8",
    female: false,
    phone: false,
    scale: 1.07,
  });
  introGroup.add(introSenior);

  const introAura = createGlowPlane("rgba(255,116,142,1)", 1.8, 2.4, 0.44);
  const introBloom = createGlowPlane("rgba(255,223,176,1)", 5.8, 4.6, 0.28);
  const introSpark = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 16, 16),
    new THREE.MeshBasicMaterial({ color: "#ffd8e6" })
  );
  const introWake = createGlowPlane("rgba(255,157,182,1)", 3.2, 1.8, 0.22);
  introGroup.add(introAura, introBloom, introSpark, introWake);

  const introRibbon = createGlowPlane("rgba(255,100,136,1)", 4.8, 2.2, 0.18);
  introGroup.add(introRibbon);

  function resize() {
    const host = canvas.parentElement ?? canvas;
    const rect = host.getBoundingClientRect();
    const visual = window.visualViewport;
    const width = Math.max(
      1,
      Math.round(rect.width || 0),
      Math.round(visual?.width || 0),
      Math.round(window.innerWidth || 0)
    );
    const height = Math.max(
      1,
      Math.round(rect.height || 0),
      Math.round(visual?.height || 0),
      Math.round(window.innerHeight || 0)
    );
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality.maxPixelRatio));
    renderer.setSize(width, height, false);
    renderer.setViewport(0, 0, width, height);
    renderer.setScissor(0, 0, width, height);
    renderer.setScissorTest(false);
    renderer.domElement.style.width = `${width}px`;
    renderer.domElement.style.height = `${height}px`;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function resolveMotion(current, desired, radius = 0.28) {
    let x = desired.x;
    let z = desired.z;
    let collided = false;
    let label = null;

    const boundaryMinX = minX + 0.26;
    const boundaryMaxX = maxX - 0.22;
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
      ring.position.y += Math.sin(time * 1.6 + hotspot.z * 0.18) * 0.04 + 0.16;
      ring.scale.setScalar(hotspot.id === activeId ? 0.98 : 0.72);
      ring.children[0].material.opacity = hotspot.id === activeId ? 0.34 : 0.08;
      ring.children[1].material.opacity = hotspot.id === activeId ? 0.22 : 0.06;
    });
  }

  function updateCharacters(game) {
    const isIntro = game.mode === "intro";
    senior.visible = !isIntro;
    junior.visible = !isIntro;
    fatherEcho.visible = !isIntro && game.characters.fatherEcho.alpha > 0.02;
    auntEcho.visible = !isIntro && game.characters.auntEcho.alpha > 0.02;
    introSenior.visible = isIntro;
    introDaughter.visible = isIntro;
    introAura.visible = isIntro;
    introBloom.visible = isIntro;
    introSpark.visible = isIntro;
    introWake.visible = isIntro;
    introRibbon.visible = isIntro;

    senior.position.set(game.characters.senior.x, 0, game.characters.senior.z);
    senior.rotation.y = game.characters.senior.rotationY ?? 0;
    junior.position.set(game.characters.junior.x, 0, game.characters.junior.z);
    junior.rotation.y = game.characters.junior.rotationY ?? 0;
    fatherEcho.position.set(game.characters.fatherEcho.x, 0, game.characters.fatherEcho.z);
    auntEcho.position.set(game.characters.auntEcho.x, 0, game.characters.auntEcho.z);
    fatherEcho.traverse((child) => {
      if (child.material) child.material.opacity = game.characters.fatherEcho.alpha;
    });
    auntEcho.traverse((child) => {
      if (child.material) child.material.opacity = game.characters.auntEcho.alpha;
    });
    if (junior.userData.glow) {
      junior.userData.glow.material.opacity = game.phase === "eye_contact" || game.ending === "perfect" ? 0.42 + game.cinematicGlow * 0.18 : 0.18;
    }

    resetCharacterPose(senior);
    resetCharacterPose(junior);
    resetCharacterPose(introSenior);
    resetCharacterPose(introDaughter);

    if (isIntro) {
      applyIdlePose(junior, game.time * 0.4, 0.4);
    } else if (game.endingSequence?.type === "perfect") {
      const seniorWalkT = THREE.MathUtils.smoothstep(game.endingSequence.time, 0.12, 8.2);
      const juniorWalkT = THREE.MathUtils.smoothstep(game.endingSequence.time, 0.24, 5.4);
      if (game.endingSequence.time < 8.2) {
        applyWalkingPose(senior, Math.sin(game.endingSequence.time * 7.2) * 0.9, 0.9);
      } else {
        applyIdlePose(senior, game.time, 0.8);
      }
      if (game.endingSequence.time < 5.4) {
        applyWalkingPose(junior, Math.sin(game.endingSequence.time * 6.6 + 0.8) * 0.84, 0.7);
      } else {
        applyIdlePose(junior, game.time * 0.84, 0.92);
      }
      senior.position.y += seniorWalkT * 0.01;
      junior.position.y += juniorWalkT * 0.014;
    } else if (game.phase === "front_call") {
      if (game.phaseClock < 3.6) {
        applyWalkingPose(senior, Math.sin(game.time * 7.4) * 0.82, 0.82);
      } else {
        applyIdlePose(senior, game.time * 0.9, 0.76);
      }
      applyIdlePose(junior, game.time * 0.72, 0.9);
    } else if (game.phase === "rear_wait") {
      const walk = Math.sin(game.time * 7.1);
      applyWalkingPose(senior, walk * 0.76, 0.8);
      applyWalkingPose(junior, Math.sin(game.time * 6.4 + 0.7) * 0.68, 0.66);
    } else {
      applyWalkingPose(senior, Math.sin(game.time * 6.2) * 0.34, 0.5);
      applyIdlePose(junior, game.time * 0.9, 1);
    }

    debugAnchors.senior.copy(senior.position).add(new THREE.Vector3(0, 1.34, 0));
    debugAnchors.junior.copy(junior.position).add(new THREE.Vector3(0, 1.34, 0));
  }

  function applyPlayerCamera(player, time = 0, allowBob = true) {
    const motion = Math.hypot(player.velocity?.x || 0, player.velocity?.z || 0);
    const bobStrength = allowBob ? Math.min(0.032, motion * 0.01) : 0;
    const bobY = bobStrength ? Math.sin(time * 8.4) * bobStrength : 0;
    const bobX = bobStrength ? Math.cos(time * 4.2) * bobStrength * 0.35 : 0;
    const roll = bobStrength ? Math.sin(time * 4.2) * bobStrength * 0.4 : 0;
    const landingDip = !allowBob ? 0 : Math.max(0, 0.015 - motion * 0.04) * Math.exp(-time * 2);
    camera.position.set(player.x + bobX, PLAYER_EYE + bobY - landingDip, player.z);
    camera.rotation.y = player.yaw;
    camera.rotation.x = player.pitch;
    camera.rotation.z = roll;
  }

function applyIntroCamera(intro) {
  const progress = THREE.MathUtils.clamp(intro.progress, 0, 1);
  const speedCurve = 0.5 + 0.5 * Math.sin(progress * Math.PI * 2.6 - Math.PI * 0.5);
  const cameraT = THREE.MathUtils.smoothstep(THREE.MathUtils.clamp(progress * (0.7 + speedCurve * 0.3), 0, 1), 0.02, 0.98);
  const camPos = introCurve.getPoint(cameraT);
  const target = introCurve.getPoint(THREE.MathUtils.clamp(cameraT + 0.06, 0, 1));
  const heartbeat = Math.sin(progress * Math.PI * 8.4) * Math.exp(-progress * 1.8) * 4;
  const baseFov = THREE.MathUtils.lerp(108, 42, THREE.MathUtils.smoothstep(progress, 0.06, 0.92));
  camera.fov = baseFov + heartbeat;
  camera.updateProjectionMatrix();
  camera.position.copy(camPos);
  const settleT = THREE.MathUtils.smoothstep(progress, 0.7, 1);
  const settleTarget = new THREE.Vector3(
    THREE.MathUtils.lerp(
      target.x + THREE.MathUtils.lerp(3.24, 0.08, progress),
      debugAnchors.senior.x * 0.28 + debugAnchors.doorPlaque.x * 0.38 + debugAnchors.frontDoor.x * 0.12 + debugAnchors.parapetBand.x * 0.22,
      settleT
    ),
    THREE.MathUtils.lerp(4.18, 1.42, progress),
    THREE.MathUtils.lerp(
      target.z + THREE.MathUtils.lerp(-0.86, -0.12, progress),
      debugAnchors.senior.z * 0.26 + debugAnchors.doorPlaque.z * 0.34 + debugAnchors.frontDoor.z * 0.14 + debugAnchors.parapetBand.z * 0.26,
      settleT
    )
  );
  camera.lookAt(settleTarget);
  const spiralRoll = Math.sin(progress * Math.PI * 3.2) * THREE.MathUtils.lerp(0.56, 0.006, progress);
  const microShake = Math.sin(progress * Math.PI * 18) * THREE.MathUtils.lerp(0.02, 0, progress) * 0.3;
  camera.rotateZ(spiralRoll + microShake);

    introGroup.visible = true;
    const threadPulse = 0.5 + 0.5 * Math.sin(progress * Math.PI * 6.2);
    introTube.material.opacity = THREE.MathUtils.lerp(0.92, 0.18, progress) * (0.85 + threadPulse * 0.15);
    introTube.material.emissiveIntensity = THREE.MathUtils.lerp(2.6, 0.62, progress) * (0.8 + threadPulse * 0.2);
    const daughterT = THREE.MathUtils.clamp(progress + 0.03, 0, 1);
    const daughterPos = introCurve.getPoint(daughterT);
    const daughterNext = introCurve.getPoint(THREE.MathUtils.clamp(daughterT + 0.015, 0, 1));
    const flyBob = Math.sin(progress * Math.PI * 5.4) * 0.14;
    const flyDrift = Math.cos(progress * Math.PI * 3.8) * 0.06;
    introDaughter.position.copy(daughterPos).add(new THREE.Vector3(flyDrift, flyBob, 0));
    introDaughter.lookAt(daughterNext);
    introDaughter.rotateY(Math.PI);
    introDaughter.rotation.z = Math.sin(progress * Math.PI * 4.2) * 0.22;
    introDaughter.rotation.x = Math.sin(progress * Math.PI * 2.8) * 0.16;
    applyFlyingPose(introDaughter, progress);
    introAura.position.copy(daughterPos).add(new THREE.Vector3(0, 0.32, -0.18));
    introAura.lookAt(camera.position);
    introAura.material.opacity = THREE.MathUtils.lerp(0.92, 0.24, progress) * (0.8 + threadPulse * 0.2);
    introBloom.position.copy(daughterPos).add(new THREE.Vector3(-0.2, 0.34, -0.48));
    introBloom.lookAt(camera.position);
    introBloom.material.opacity = THREE.MathUtils.lerp(0.62, 0.18, progress);
    introRibbon.position.copy(daughterPos).add(new THREE.Vector3(-0.14, 0.22, -0.74));
    introRibbon.lookAt(camera.position);
    introRibbon.material.opacity = THREE.MathUtils.lerp(0.42, 0.06, progress);
    introSpark.position.copy(introCurve.getPoint(THREE.MathUtils.clamp(progress + 0.08, 0, 1)));
    introSpark.scale.setScalar(1 + Math.sin(progress * Math.PI * 6) * 0.42);
    introWake.position.copy(daughterPos).add(new THREE.Vector3(0.1, 0.14, -0.56));
    introWake.lookAt(camera.position);
    introWake.material.opacity = THREE.MathUtils.lerp(0.42, 0.08, progress);

    const seniorWalkT = THREE.MathUtils.smoothstep(progress, 0.56, 0.96);
    const seniorStart = new THREE.Vector3(scaled(-474), 0, scaled(WORLD.stairs.front.landingZ + 8));
    const seniorEnd = new THREE.Vector3(scaled(-520), 0, scaled(WORLD.frontDoor.center.z - 286));
    introSenior.position.lerpVectors(seniorStart, seniorEnd, seniorWalkT);
    introSenior.rotation.y = Math.atan2(
      -(scaled(WORLD.frontDoor.center.x) - introSenior.position.x),
      -(scaled(WORLD.frontDoor.center.z) - introSenior.position.z)
    );
    applyWalkingPose(introSenior, Math.sin(progress * Math.PI * 10.4) * 0.84, 0.92);
  }

function perfectEndingPhase(time) {
  if (time < (CINEMATIC_TIMELINE.perfectOrbitStart ?? 8)) {
    return "walk-in";
  }
  if (time < (CINEMATIC_TIMELINE.perfectOrbitEnd ?? 24)) {
    return "orbit";
  }
  if (time < (CINEMATIC_TIMELINE.perfectSeniorPovEnd ?? 32)) {
    return "senior_pov_hold";
  }
  return "eyes";
}

function applyPerfectEndingCamera(game) {
  const totalTime = game.endingSequence?.time ?? 0;
  const orbitStart = CINEMATIC_TIMELINE.perfectOrbitStart ?? 8;
  const orbitEnd = CINEMATIC_TIMELINE.perfectOrbitEnd ?? 24;
  const seniorPovEnd = CINEMATIC_TIMELINE.perfectSeniorPovEnd ?? 32;
  const center = junior.position.clone().add(new THREE.Vector3(0, 1.5, 0));
  const faceForward = new THREE.Vector3(Math.sin(junior.rotation.y), 0, Math.cos(junior.rotation.y));
  const eyeTarget = center.clone().add(faceForward.clone().multiplyScalar(0.138)).add(new THREE.Vector3(0.004, 0.018, 0));
  const seniorEye = senior.position.clone().add(new THREE.Vector3(0.03, 1.57, 0.04));
  const orbitStartAngle = -1.48;
  const orbitRadiusStart = 7.2;
  const orbitRadiusEnd = 3.84;

  const breatheSway = Math.sin(totalTime * 0.42) * 0.0008;
  const breatheRise = Math.sin(totalTime * 0.38) * 0.0006;

  if (totalTime < orbitStart) {
    const walkT = THREE.MathUtils.clamp(totalTime / orbitStart, 0, 1);
    const eased = THREE.MathUtils.smoothstep(walkT, 0, 1);
    const sideOffset = new THREE.Vector3(-3.1, 0.26, 2.8);
    const startPos = center.clone().add(sideOffset);
    const settlePos = center.clone().add(new THREE.Vector3(-4.8, 0.38, 3.48));
    camera.position.lerpVectors(startPos, settlePos, eased);
    camera.position.y += breatheRise;
    camera.position.x += breatheSway;
    camera.fov = THREE.MathUtils.lerp(52, 36, eased);
    camera.updateProjectionMatrix();
    camera.lookAt(center.x + 0.1, center.y - 0.03, center.z - 0.02);
    camera.rotateZ(Math.sin(totalTime * 0.8) * 0.003);
    return;
  }

  if (totalTime < orbitEnd) {
    const orbitT = THREE.MathUtils.clamp((totalTime - orbitStart) / (orbitEnd - orbitStart), 0, 1);
    // Slow in the first quarter, uniform in the middle, hold at the end
    const slowT = orbitT < 0.12 ? orbitT * 0.5 : 0.06 + (orbitT - 0.12) * (0.94 / 0.88);
    const eased = THREE.MathUtils.smoothstep(THREE.MathUtils.clamp(slowT, 0, 1), 0.02, 0.98);
    // Tight radius so junior is always in frame — start close, pull back slightly for mid-orbit, return close
    const radiusPulse = 1.0 + Math.sin(eased * Math.PI) * 0.8; // 1.0 → 1.8 → 1.0
    const radius = 2.0 + radiusPulse;
    const angle = orbitStartAngle + eased * Math.PI * 2;
    // Camera height: stays at junior mid-body level and gently rises
    const camY = THREE.MathUtils.lerp(1.52, 1.82, THREE.MathUtils.smoothstep(orbitT, 0.15, 0.85)) + breatheRise;
    camera.position.set(
      center.x + Math.cos(angle) * radius + breatheSway,
      camY,
      center.z + Math.sin(angle) * radius
    );
    // Always look at junior's head — zoom in toward face by the end of orbit
    const lookTarget = center.clone().lerp(eyeTarget, THREE.MathUtils.smoothstep(orbitT, 0.6, 1.0));
    camera.fov = THREE.MathUtils.lerp(42, 20, THREE.MathUtils.smoothstep(orbitT, 0.2, 1));
    camera.updateProjectionMatrix();
    camera.lookAt(lookTarget.x, lookTarget.y, lookTarget.z);
    // Gentle cinematic roll
    const orbitRoll = Math.sin(eased * Math.PI * 2) * 0.008 * (1 - orbitT * 0.7);
    camera.rotateZ(orbitRoll);
    return;
  }

  if (totalTime < seniorPovEnd) {
    const holdT = THREE.MathUtils.clamp((totalTime - orbitEnd) / (seniorPovEnd - orbitEnd), 0, 1);
    const seniorHoldPos = seniorEye.clone().add(new THREE.Vector3(0.022, 0.014, 0.004));
    const heartSway = Math.sin(totalTime * 1.1) * 0.0014 * (1 + holdT * 0.5);
    const heartRise = Math.cos(totalTime * 0.82) * 0.001;
    seniorHoldPos.y += heartRise;
    seniorHoldPos.x += heartSway;
    camera.position.copy(seniorHoldPos);
    camera.fov = THREE.MathUtils.lerp(14, 11.8, THREE.MathUtils.smoothstep(holdT, 0.2, 0.9));
    camera.updateProjectionMatrix();
    camera.lookAt(eyeTarget.x, eyeTarget.y + 0.0012, eyeTarget.z);
    camera.rotateZ(Math.sin(totalTime * 0.6) * 0.002);
    return;
  }

  const eyesElapsed = totalTime - seniorPovEnd;
  const eyeHoldPos = seniorEye.clone().add(new THREE.Vector3(0.022, 0.014, 0.004));
  const tremble = Math.min(1, eyesElapsed * 0.12);
  eyeHoldPos.y += Math.sin(totalTime * 0.3) * 0.0014 + Math.sin(totalTime * 2.2) * 0.0004 * tremble;
  eyeHoldPos.x += Math.cos(totalTime * 0.16) * 0.001 + Math.cos(totalTime * 1.8) * 0.0003 * tremble;
  camera.position.copy(eyeHoldPos);
  camera.fov = THREE.MathUtils.lerp(12.8, 10.4, THREE.MathUtils.smoothstep(eyesElapsed, 0, 8));
  camera.updateProjectionMatrix();
  camera.lookAt(eyeTarget.x, eyeTarget.y + 0.0015, eyeTarget.z);
  camera.rotateZ(Math.sin(totalTime * 0.4) * 0.0015 * tremble);
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
      if (facing < 0.75) {
        return;
      }
      raycaster.set(camera.position, toHotspot);
      const hits = raycaster.intersectObjects(occluders, false);
      if (hits.length && hits[0].distance < dist - 0.16) {
        return;
      }
      const score = facing * 2.12 - dist;
      if (!best || score > best.score || (hotspot.id === activeId && score > best.score - 0.18)) {
        best = { id: hotspot.id, score, distance: dist, label: hotspot.label, prompt: hotspot.prompt };
      }
    });

    return best;
  }

  function getDebugSnapshot() {
    return lastDebugSnapshot;
  }

  function projectNode(name, point, viewportWidth, viewportHeight) {
    tempVecC.copy(point).project(camera);
    return {
      name,
      visible: tempVecC.z >= -1 && tempVecC.z <= 1 && Math.abs(tempVecC.x) <= 1.2 && Math.abs(tempVecC.y) <= 1.2,
      ndcX: Number(tempVecC.x.toFixed(4)),
      ndcY: Number(tempVecC.y.toFixed(4)),
      screenX: Math.round((tempVecC.x * 0.5 + 0.5) * viewportWidth),
      screenY: Math.round((-tempVecC.y * 0.5 + 0.5) * viewportHeight),
    };
  }

  function hasLineOfSight(target) {
    tempVecB.copy(target).sub(camera.position);
    const distance = tempVecB.length();
    const direction = tempVecB.normalize();
    raycaster.set(camera.position, direction);
    const hits = raycaster.intersectObjects(occluders, false);
    return !hits.length || hits[0].distance >= distance - 0.12;
  }

  function buildHotspotLOS(game) {
    const result = {};
    (game.hotspots || []).forEach((hotspot) => {
      if (!hotspot.visible) {
        result[hotspot.id] = false;
        return;
      }
      result[hotspot.id] = hasLineOfSight(new THREE.Vector3(hotspot.x, hotspot.y, hotspot.z));
    });
    return result;
  }

  function render(game) {
    resize();
    const time = game.time ?? 0;
    updateCharacters(game);
    updateHotspots(game.hotspots, game.activeHotspotId, time);

    const isIntro = game.mode === "intro";
    if (isIntro) {
      applyIntroCamera(game.intro);
    } else if (game.endingSequence?.type === "perfect") {
      introGroup.visible = false;
      applyPerfectEndingCamera(game);
    } else {
      introGroup.visible = false;
      const targetFov = game.phase === "front_call" ? 42 : game.phase === "eye_contact" ? 46 : 56;
      if (camera.fov !== targetFov) {
        camera.fov = targetFov;
        camera.updateProjectionMatrix();
      }
      applyPlayerCamera(game.player, time, true);
    }

    const daylight = isIntro ? THREE.MathUtils.lerp(0.34, 1, game.intro.progress) : 1;
    sun.intensity = 1.96 * daylight + (game.phase === "eye_contact" || game.ending === "perfect" ? 0.68 : game.phase === "front_call" ? 0.26 : 0.12);
    ambient.intensity = 0.28 + daylight * 0.2;
    corridorFill.intensity = isIntro ? 0.66 : 0.98;
    corridorSun.intensity = game.ending === "perfect" ? 2.02 : game.phase === "front_call" ? 2.28 : 1.32;
    classroomAccent.intensity = game.phase === "eye_contact" || game.ending === "perfect" ? 2.04 : game.phase === "front_call" ? 1.64 : 1.18;
    backdoorAccent.intensity = game.phase === "eye_contact" || game.ending === "perfect" ? 1.34 : 0.8;
    corridorSunPatch.material.opacity = game.ending === "perfect" ? 0.72 : game.phase === "front_call" ? 0.94 : 0.36;
    parapetSunPatch.material.opacity = game.phase === "front_call" ? 0.82 : game.ending === "perfect" ? 0.54 : 0.24;
    classroomSunPatch.material.opacity = game.phase === "eye_contact" || game.ending === "perfect" ? 0.86 : 0.54;
    leftClassroomSunPatch.material.opacity = game.phase === "eye_contact" || game.ending === "perfect" ? 0.66 : 0.34;
    seatSunPatch.material.opacity = game.ending === "perfect" ? 0.72 : game.phase === "eye_contact" ? 0.48 : 0.26;
    backdoorSunPatch.material.opacity = game.ending === "perfect" ? 0.58 : game.phase === "eye_contact" ? 0.4 : 0.2;
    scene.background.setStyle(isIntro ? "#090d16" : "#dde8f2");
    scene.fog.color.setStyle(isIntro ? "#121722" : "#d6e1eb");
    scene.fog.near = isIntro ? 3 : 16;
    scene.fog.far = isIntro ? 20 : 68;

    dust.visible = game.endingSequence?.type !== "perfect";
    dust.rotation.y = time * 0.018;
    dust.position.x = Math.sin(time * 0.12) * 0.08;

    const stageRect = (canvas.parentElement ?? canvas).getBoundingClientRect();
    const cssRect = canvas.getBoundingClientRect();
    const logicalViewport = renderer.getSize(tempSize2D);
    const drawViewport = renderer.getDrawingBufferSize(tempDrawSize2D);
    const viewportWidth = renderer.domElement.width || drawViewport.x || 0;
    const viewportHeight = renderer.domElement.height || drawViewport.y || 0;
    const cssWidth = Math.round(cssRect.width);
    const cssHeight = Math.round(cssRect.height);
    const stageWidth = Math.round(stageRect.width);
    const stageHeight = Math.round(stageRect.height);
    const mobileBlackRegionDetected =
      (stageWidth > 0 && cssWidth > 0 && Math.abs(stageWidth - cssWidth) > 4) ||
      (stageHeight > 0 && cssHeight > 0 && Math.abs(stageHeight - cssHeight) > 4) ||
      Math.abs(cssWidth - canvas.clientWidth) > 4 ||
      Math.abs(cssHeight - canvas.clientHeight) > 4 ||
      Math.abs(Math.round(logicalViewport.x) - stageWidth) > 4 ||
      Math.abs(Math.round(logicalViewport.y) - stageHeight) > 4;

    lastDebugSnapshot = {
      camera: {
        x: Number(camera.position.x.toFixed(3)),
        y: Number(camera.position.y.toFixed(3)),
        z: Number(camera.position.z.toFixed(3)),
        yaw: Number(camera.rotation.y.toFixed(3)),
        pitch: Number(camera.rotation.x.toFixed(3)),
      },
      viewport: { width: viewportWidth, height: viewportHeight },
      cssViewport: { width: cssWidth, height: cssHeight },
      stageViewport: { width: stageWidth, height: stageHeight },
      webglViewport: { width: Math.round(logicalViewport.x), height: Math.round(logicalViewport.y) },
      projectedNodes: {
        senior: projectNode("senior", debugAnchors.senior, viewportWidth, viewportHeight),
        junior: projectNode("junior", debugAnchors.junior, viewportWidth, viewportHeight),
        frontDoor: projectNode("frontDoor", debugAnchors.frontDoor, viewportWidth, viewportHeight),
        backDoor: projectNode("backDoor", debugAnchors.backDoor, viewportWidth, viewportHeight),
        doorPlaque: projectNode("doorPlaque", debugAnchors.doorPlaque, viewportWidth, viewportHeight),
        parapetBand: projectNode("parapetBand", debugAnchors.parapetBand, viewportWidth, viewportHeight),
        boardWall: projectNode("boardWall", debugAnchors.boardWall, viewportWidth, viewportHeight),
      },
      hotspotLOS: buildHotspotLOS(game),
      currentRoomIds: WORLD.floorRooms.map((room) => room.id),
      endingShotPhase:
        game.endingSequence?.type === "perfect"
          ? perfectEndingPhase(game.endingSequence.time)
          : null,
      colliders: colliders.length,
      mobileBlackRegionDetected,
    };

    renderer.render(scene, camera);
  }

  return {
    render,
    resize,
    resolveMotion,
    pickHotspot,
    getDebugSnapshot,
    worldBounds: { minX: minX + 0.26, maxX: maxX - 0.22, minZ: minZ + 0.22, maxZ: maxZ - 0.22 },
  };
}
