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

  const torsoMat = new THREE.MeshStandardMaterial({ color: spec.torso, roughness: 0.64, metalness: 0.04 });
  const accentMat = new THREE.MeshStandardMaterial({ color: spec.torsoAccent ?? spec.torso, roughness: 0.58, metalness: 0.05 });
  const legsMat = new THREE.MeshStandardMaterial({ color: spec.legs, roughness: 0.72, metalness: 0.04 });
  const skinMat = new THREE.MeshStandardMaterial({ color: spec.skin, roughness: 0.68, metalness: 0.01 });
  const blushMat = new THREE.MeshStandardMaterial({ color: spec.female ? "#f3c3bc" : "#d7a18f", roughness: 0.72, metalness: 0.01, transparent: true, opacity: spec.female ? 0.26 : 0.14 });
  const hairMat = new THREE.MeshStandardMaterial({ color: spec.hair, roughness: 0.56, metalness: 0.09 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: spec.shoes, roughness: 0.76, metalness: 0.1 });
  const buttonMat = new THREE.MeshStandardMaterial({ color: "#f6ede3", roughness: 0.48, metalness: 0.12 });

  const waist = new THREE.Mesh(new THREE.CapsuleGeometry(spec.female ? 0.126 : 0.132, 0.18, 5, 10), torsoMat);
  waist.position.set(0, 0.84, 0);
  waist.scale.set(spec.female ? 1.04 : 1.14, 1.02, 0.86);
  group.add(waist);

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(spec.female ? 0.172 : 0.166, spec.female ? 0.62 : 0.6, 8, 18), torsoMat);
  torso.position.set(0, 1.08, 0);
  torso.scale.set(spec.female ? 0.98 : 1.04, 1.02, 0.82);
  group.add(torso);

  const chest = new THREE.Mesh(new THREE.SphereGeometry(spec.female ? 0.172 : 0.146, 22, 22), accentMat);
  chest.position.set(0, 1.13, 0.038);
  chest.scale.set(1.06, spec.female ? 0.64 : 0.52, 0.52);
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

  const shorts = new THREE.Mesh(new THREE.BoxGeometry(spec.female ? 0.32 : 0.36, spec.female ? 0.16 : 0.2, 0.25), legsMat);
  shorts.position.set(0, spec.female ? 0.66 : 0.63, 0.01);
  group.add(shorts);

  const shoeGeo = new THREE.BoxGeometry(0.13, 0.06, 0.25);
  const shoeL = new THREE.Mesh(shoeGeo, shoeMat);
  shoeL.position.set(spec.female ? -0.094 : -0.102, 0.042, 0.055);
  shoeL.rotation.x = 0.04;
  const shoeR = shoeL.clone();
  shoeR.position.x = spec.female ? 0.094 : 0.102;
  group.add(shoeL, shoeR);

  const shoulderL = new THREE.Mesh(new THREE.SphereGeometry(spec.female ? 0.086 : 0.094, 18, 18), torsoMat);
  shoulderL.position.set(spec.female ? -0.188 : -0.212, 1.18, 0);
  const shoulderR = shoulderL.clone();
  shoulderR.position.x = spec.female ? 0.188 : 0.212;
  group.add(shoulderL, shoulderR);

  const armGeo = new THREE.CapsuleGeometry(spec.female ? 0.048 : 0.052, spec.female ? 0.42 : 0.44, 5, 10);
  const leftArm = new THREE.Mesh(armGeo, skinMat);
  leftArm.position.set(spec.female ? -0.228 : -0.246, 1.0, 0.02);
  leftArm.rotation.z = spec.female ? 0.12 : 0.15;
  const rightArm = leftArm.clone();
  rightArm.position.x = spec.female ? 0.228 : 0.246;
  rightArm.rotation.z = spec.female ? -0.12 : -0.15;
  group.add(leftArm, rightArm);

  const handGeo = new THREE.SphereGeometry(spec.female ? 0.048 : 0.054, 18, 18);
  const leftHand = new THREE.Mesh(handGeo, skinMat);
  leftHand.position.set(spec.female ? -0.264 : -0.286, 0.71, 0.04);
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

  const head = new THREE.Mesh(new THREE.SphereGeometry(spec.female ? 0.168 : 0.176, 34, 34), skinMat);
  head.position.set(0, 1.56, 0);
  head.scale.set(spec.female ? 0.94 : 0.98, 1.08, 0.91);
  group.add(head);

  const jaw = new THREE.Mesh(new THREE.SphereGeometry(spec.female ? 0.14 : 0.146, 28, 28), skinMat);
  jaw.position.set(0, spec.female ? 1.47 : 1.48, 0.02);
  jaw.scale.set(spec.female ? 0.92 : 0.98, 0.78, 0.88);
  group.add(jaw);

  const earGeo = new THREE.SphereGeometry(0.032, 16, 16);
  const earL = new THREE.Mesh(earGeo, skinMat);
  earL.position.set(-0.165, 1.55, 0.01);
  earL.scale.set(0.72, 1.02, 0.56);
  const earR = earL.clone();
  earR.position.x = 0.165;
  group.add(earL, earR);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.062, 12), skinMat);
  nose.position.set(0, 1.54, 0.154);
  nose.rotation.x = Math.PI * 0.5;
  group.add(nose);

  const noseBridge = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, 0.08, 0.012),
    new THREE.MeshStandardMaterial({ color: "#fff8f2", roughness: 0.34, metalness: 0.01, transparent: true, opacity: 0.2 })
  );
  noseBridge.position.set(0, 1.57, 0.135);
  group.add(noseBridge);

  const lip = new THREE.Mesh(
    new THREE.TorusGeometry(0.045, 0.009, 8, 18, Math.PI),
    new THREE.MeshStandardMaterial({ color: spec.female ? "#cc7282" : "#ae7670", roughness: 0.5, metalness: 0.03 })
  );
  lip.position.set(0, 1.46, 0.148);
  lip.rotation.x = Math.PI;
  group.add(lip);

  const browGeo = new THREE.BoxGeometry(spec.female ? 0.08 : 0.09, 0.014, 0.02);
  const browMat = new THREE.MeshStandardMaterial({ color: spec.female ? "#3a2422" : "#31201e", roughness: 0.7, metalness: 0.02 });
  const browL = new THREE.Mesh(browGeo, browMat);
  browL.position.set(-0.072, 1.62, 0.13);
  browL.rotation.z = -0.12;
  const browR = browL.clone();
  browR.position.x = 0.072;
  browR.rotation.z = 0.12;
  group.add(browL, browR);

  const lidGeo = new THREE.TorusGeometry(0.032, 0.004, 6, 18, Math.PI);
  const lidMat = new THREE.MeshStandardMaterial({ color: spec.female ? "#3a1f20" : "#2f1d1e", roughness: 0.54, metalness: 0.02 });
  const lidL = new THREE.Mesh(lidGeo, lidMat);
  lidL.position.set(-0.062, 1.57, 0.162);
  lidL.rotation.z = Math.PI;
  const lidR = lidL.clone();
  lidR.position.x = 0.062;
  group.add(lidL, lidR);

  const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: "#fcfcfd", roughness: 0.36, metalness: 0.02 });
  const irisMat = new THREE.MeshStandardMaterial({ color: spec.iris ?? (spec.female ? "#3a261f" : "#2b1c18"), roughness: 0.48, metalness: 0.02 });
  const eyeWhiteL = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 12), eyeWhiteMat);
  eyeWhiteL.position.set(-0.062, 1.56, 0.15);
  eyeWhiteL.scale.set(1.35, 0.9, 0.5);
  const eyeWhiteR = eyeWhiteL.clone();
  eyeWhiteR.position.x = 0.062;
  const irisL = new THREE.Mesh(new THREE.SphereGeometry(0.011, 10, 10), irisMat);
  irisL.position.set(-0.062, 1.56, 0.166);
  const irisR = irisL.clone();
  irisR.position.x = 0.062;
  group.add(eyeWhiteL, eyeWhiteR, irisL, irisR);

  if (spec.female) {
    const lashMat = new THREE.MeshStandardMaterial({ color: "#241618", roughness: 0.52, metalness: 0.02 });
    const lashL = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.01, 0.014), lashMat);
    lashL.position.set(-0.062, 1.585, 0.168);
    lashL.rotation.z = -0.06;
    const lashR = lashL.clone();
    lashR.position.x = 0.062;
    lashR.rotation.z = 0.06;
    group.add(lashL, lashR);
  }

  const cheekGeo = new THREE.SphereGeometry(0.028, 12, 12);
  const cheekL = new THREE.Mesh(cheekGeo, blushMat);
  cheekL.position.set(-0.094, 1.48, 0.142);
  cheekL.scale.set(1.7, 1.2, 0.4);
  const cheekR = cheekL.clone();
  cheekR.position.x = 0.094;
  group.add(cheekL, cheekR);

  const eyeSparkleMat = new THREE.MeshStandardMaterial({ color: "#ffffff", emissive: "#ffffff", emissiveIntensity: 0.12, roughness: 0.2, metalness: 0.02 });
  const eyeSparkleL = new THREE.Mesh(new THREE.SphereGeometry(0.004, 8, 8), eyeSparkleMat);
  eyeSparkleL.position.set(-0.055, 1.568, 0.176);
  const eyeSparkleR = eyeSparkleL.clone();
  eyeSparkleR.position.x = 0.069;
  group.add(eyeSparkleL, eyeSparkleR);

  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(spec.female ? 0.194 : 0.188, 28, 28, 0, Math.PI * 2, 0, Math.PI * 0.72),
    hairMat
  );
  hairCap.position.set(0, 1.62, -0.01);
  hairCap.rotation.x = -0.1;
  group.add(hairCap);

  const hairBack = new THREE.Mesh(new THREE.SphereGeometry(spec.female ? 0.214 : 0.188, 28, 28), hairMat);
  hairBack.position.set(0, spec.female ? 1.5 : 1.58, -0.08);
  hairBack.scale.set(0.88, spec.female ? 1.38 : 0.88, 0.7);
  group.add(hairBack);

  const fringe = new THREE.Mesh(new THREE.BoxGeometry(spec.female ? 0.2 : 0.16, 0.08, 0.05), hairMat);
  fringe.position.set(0, 1.61, 0.12);
  group.add(fringe);

  const sideHairL = new THREE.Mesh(new THREE.BoxGeometry(spec.female ? 0.076 : 0.058, spec.female ? 0.42 : 0.22, 0.06), hairMat);
  sideHairL.position.set(-0.14, spec.female ? 1.45 : 1.49, 0.02);
  const sideHairR = sideHairL.clone();
  sideHairR.position.x = 0.15;
  group.add(sideHairL, sideHairR);

  const crownShine = new THREE.Mesh(
    new THREE.SphereGeometry(spec.female ? 0.16 : 0.15, 20, 20),
    new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.2, metalness: 0.02, transparent: true, opacity: 0.08 })
  );
  crownShine.position.set(0.02, 1.66, 0.04);
  crownShine.scale.set(0.82, 0.42, 0.5);
  group.add(crownShine);

  const face = createFacePlane(makeFaceTexture({ female: spec.female }));
  face.position.y = 1.55;
  face.scale.setScalar(0.94);
  group.add(face);

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

    const wispL = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.26, 0.028), hairMat);
    wispL.position.set(-0.112, 1.46, 0.118);
    wispL.rotation.z = -0.12;
    const wispR = wispL.clone();
    wispR.position.x = 0.112;
    wispR.rotation.z = 0.12;
    group.add(wispL, wispR);

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
      new THREE.MeshStandardMaterial({ color: "#fffdf7", roughness: 0.58, metalness: 0.02 })
    );
    blouse.position.set(0, 1.06, 0.02);
    blouse.scale.set(0.94, 0.92, 0.76);
    group.add(blouse);

    const blouseHem = new THREE.Mesh(new THREE.TorusGeometry(0.146, 0.012, 8, 20), buttonMat);
    blouseHem.position.set(0, 0.84, 0.02);
    blouseHem.rotation.x = Math.PI / 2;
    group.add(blouseHem);

    const blouseFold = new THREE.Mesh(
      new THREE.PlaneGeometry(0.12, 0.34),
      new THREE.MeshStandardMaterial({ color: "#efe7dc", roughness: 0.74, metalness: 0.01, transparent: true, opacity: 0.24 })
    );
    blouseFold.position.set(0, 1.02, 0.2);
    group.add(blouseFold);
  }

  if (!spec.female) {
    const shirtPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, 0.52, 0.03),
      new THREE.MeshStandardMaterial({ color: "#637d9c", roughness: 0.58, metalness: 0.03, transparent: true, opacity: 0.92 })
    );
    shirtPanel.position.set(0, 1.08, 0.19);
    group.add(shirtPanel);

    const shirtCollar = new THREE.Mesh(
      new THREE.TorusGeometry(0.092, 0.014, 8, 20, Math.PI),
      new THREE.MeshStandardMaterial({ color: "#dbe4ee", roughness: 0.66, metalness: 0.02 })
    );
    shirtCollar.position.set(0, 1.2, 0.08);
    shirtCollar.rotation.x = Math.PI * 0.54;
    group.add(shirtCollar);
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
  const legAmp = pose.female ? 0.42 : 0.36;
  const armAmp = pose.hasPhone ? 0.16 : 0.34;
  pose.leftLeg.rotation.x = stride * legAmp;
  pose.rightLeg.rotation.x = -stride * legAmp;
  pose.leftArm.rotation.x = -stride * armAmp;
  pose.rightArm.rotation.x = pose.hasPhone ? -0.56 + stride * 0.08 : stride * armAmp;
  pose.torso.rotation.z = stride * 0.05 * sway;
  pose.waist.rotation.z = stride * 0.03 * sway;
  pose.head.rotation.z = -stride * 0.04 * sway;
  person.position.y = Math.abs(stride) * 0.03;
}

function applyIdlePose(person, time, emphasis = 1) {
  const pose = person.userData.pose;
  if (!pose) {
    return;
  }
  const breathe = Math.sin(time * 1.4) * 0.018 * emphasis;
  pose.torso.rotation.x = breathe;
  pose.chest.rotation.x = breathe * 0.6;
  pose.head.rotation.y = Math.sin(time * 0.7) * 0.04 * emphasis;
  pose.hairBack.rotation.z = Math.sin(time * 1.1) * 0.02 * emphasis;
  person.position.y = Math.abs(Math.sin(time * 1.4)) * 0.012 * emphasis;
}

function applyFlyingPose(person, progress) {
  const pose = person.userData.pose;
  if (!pose) {
    return;
  }
  const wing = Math.sin(progress * Math.PI * 5.8) * 0.08;
  pose.torso.rotation.x = -0.72;
  pose.chest.rotation.x = -0.34;
  pose.waist.rotation.x = -0.22;
  pose.leftArm.rotation.x = -1.42 + wing * 0.18;
  pose.rightArm.rotation.x = -1.42 - wing * 0.18;
  pose.leftArm.rotation.z = 0.06;
  pose.rightArm.rotation.z = -0.06;
  pose.leftHand.rotation.x = -0.36;
  pose.rightHand.rotation.x = -0.36;
  pose.leftLeg.rotation.x = 0.42 - wing * 0.1;
  pose.rightLeg.rotation.x = 0.42 + wing * 0.1;
  pose.head.rotation.x = 0.22;
  pose.hairBack.rotation.x = 0.34;
  pose.fringe.rotation.x = -0.1;
  person.position.y = Math.sin(progress * Math.PI * 4.6) * 0.08;
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
    shadowMapSize: coarse ? 448 : 576,
    maxPixelRatio: coarse ? 0.96 : 0.88,
    dustCount: coarse ? 38 : 46,
  };
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

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

  const hemiLight = new THREE.HemisphereLight(0xf5f7fc, 0x70624d, 1.08);
  scene.add(hemiLight);

  const ambient = new THREE.AmbientLight(0xffffff, 0.32);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xffe4b6, 2.1);
  sun.position.set(-11.2, 10.8, 5.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(quality.shadowMapSize, quality.shadowMapSize);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 68;
  sun.shadow.camera.left = -22;
  sun.shadow.camera.right = 16;
  sun.shadow.camera.top = 18;
  sun.shadow.camera.bottom = -16;
  scene.add(sun);

  const corridorFill = new THREE.PointLight(0xbad0e2, 0.82, 34, 2);
  corridorFill.position.set(corridorMinX + 2.2, 2.72, scaled(WORLD.frontDoor.center.z - 20));
  scene.add(corridorFill);

  const corridorSun = new THREE.PointLight(0xffe6b0, 0.9, 32, 2);
  corridorSun.position.set(minX - 0.7, 3.5, scaled(WORLD.frontDoor.center.z));
  scene.add(corridorSun);

  const classroomAccent = new THREE.PointLight(0xffd5a2, 0.82, 22, 2);
  classroomAccent.position.set(classroomMaxX - 1.84, 2.3, scaled(WORLD.classroom.lightWellZ));
  scene.add(classroomAccent);

  const backdoorAccent = new THREE.PointLight(0xffefcf, 0.72, 18, 2);
  backdoorAccent.position.set(classroomMinX + 1.12, 2.04, scaled(WORLD.backDoor.center.z));
  scene.add(backdoorAccent);

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
    color: "#fff3d9",
    roughness: 0.08,
    transmission: 0.68,
    transparent: true,
    opacity: 0.28,
    thickness: 0.08,
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

  const sunGlow = createGlowPlane("rgba(255,233,192,1)", 8.4, 5.4, 0.3);
  sunGlow.position.set(minX - campusDepth * 0.18, 4.2, scaled(720));
  sunGlow.rotation.y = Math.PI / 2;
  worldGroup.add(sunGlow);

  const canopyGlow = createGlowPlane("rgba(255,240,210,1)", 7.2, 4.2, 0.16);
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

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(maxX - minX, 0.12, floorLength),
    new THREE.MeshStandardMaterial({ color: "#efeae0", map: wallTex, roughness: 0.96, metalness: 0.01 })
  );
  roof.position.set((minX + maxX) / 2, corridorHeight + 0.06, floorCenterZ);
  roof.receiveShadow = true;
  worldGroup.add(roof);

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

  const stairWoodMat = new THREE.MeshStandardMaterial({ color: "#b08d67", map: woodTex, roughness: 0.82, metalness: 0.03 });
  const stairRailMat = new THREE.MeshStandardMaterial({ color: "#f1ece3", map: wallTex, roughness: 0.84, metalness: 0.02 });
  const stairZones = [
    { id: "back_stair", z1: backStairZ1, z2: backStairZ2, direction: -1 },
    { id: "front_stair", z1: frontStairZ1, z2: frontStairZ2, direction: 1 },
  ];
  stairZones.forEach((zone) => {
    const zoneCenter = (zone.z1 + zone.z2) / 2;
    const landing = new THREE.Mesh(new THREE.BoxGeometry(corridorWidth - 0.28, 0.08, zone.z2 - zone.z1), corridorFloorMat);
    landing.position.set(corridorCenterX, FLOOR_Y - 0.035, zoneCenter);
    landing.receiveShadow = true;
    worldGroup.add(landing);

    const stairCount = 7;
    for (let index = 0; index < stairCount; index += 1) {
      const t = index / stairCount;
      const treadZ =
        zone.direction > 0
          ? THREE.MathUtils.lerp(zone.z1 + 0.12, zone.z2 - 0.18, t)
          : THREE.MathUtils.lerp(zone.z2 - 0.12, zone.z1 + 0.18, t);
      const step = new THREE.Mesh(
        new THREE.BoxGeometry(corridorWidth * 0.74, 0.09, 0.18),
        stairWoodMat
      );
      step.position.set(corridorCenterX - 0.08, FLOOR_Y - 0.08 - index * 0.064, treadZ);
      step.receiveShadow = true;
      step.castShadow = false;
      worldGroup.add(step);
    }

    const stairRail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.96, zone.z2 - zone.z1 - 0.22), stairRailMat);
    stairRail.position.set(corridorMinX + 1.18, 0.44, zoneCenter);
    worldGroup.add(stairRail);

    const stairWall = new THREE.Mesh(new THREE.BoxGeometry(0.22, corridorHeight, zone.z2 - zone.z1), corridorWallMat);
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

  addBox(
    worldGroup,
    occluders,
    new THREE.BoxGeometry(roomDepth, corridorHeight, wallThickness),
    wallMat,
    new THREE.Vector3((classroomMinX + classroomMaxX) / 2, corridorHeight / 2, z1),
    null,
    colliders,
    { minX: classroomMinX, maxX: classroomMaxX, minZ: z1 - wallThickness / 2, maxZ: z1 + wallThickness / 2, label: `${room.id}_back_wall` }
  );
  addBox(
    worldGroup,
    occluders,
    new THREE.BoxGeometry(roomDepth, corridorHeight, wallThickness),
    wallMat,
    new THREE.Vector3((classroomMinX + classroomMaxX) / 2, corridorHeight / 2, z2),
    null,
    colliders,
    { minX: classroomMinX, maxX: classroomMaxX, minZ: z2 - wallThickness / 2, maxZ: z2 + wallThickness / 2, label: `${room.id}_front_wall` }
  );

  addBox(
    worldGroup,
    occluders,
    new THREE.BoxGeometry(wallThickness, corridorHeight, roomLength),
    wallMat,
    new THREE.Vector3(classroomMaxX, corridorHeight / 2, centerZ),
    null,
    colliders,
    { minX: classroomMaxX - wallThickness / 2, maxX: classroomMaxX + wallThickness / 2, minZ: z1, maxZ: z2, label: "right_wall" }
  );

  const dividerSegments = [];
  if (minZ < z1) {
    dividerSegments.push([minZ, z1]);
  }
  let cursor = z1;
  openings.forEach((opening) => {
    if (opening.z1 > cursor) {
      dividerSegments.push([cursor, opening.z1]);
    }
    cursor = Math.max(cursor, opening.z2);
  });
  if (cursor < z2) {
    dividerSegments.push([cursor, z2]);
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

  openings.forEach((door) => {
    const dz1 = door.z1;
    const dz2 = door.z2;
    const centerDoorZ = (dz1 + dz2) / 2;
    addBox(
      worldGroup,
      occluders,
      new THREE.BoxGeometry(0.22, 2.28, 0.18),
      beamMat,
      new THREE.Vector3(classroomMinX - 0.02, 1.14, dz1),
      null,
      colliders,
      { minX: classroomMinX - 0.14, maxX: classroomMinX + 0.08, minZ: dz1 - 0.08, maxZ: dz1 + 0.08, label: "door_frame" }
    );
    addBox(
      worldGroup,
      occluders,
      new THREE.BoxGeometry(0.22, 2.28, 0.18),
      beamMat,
      new THREE.Vector3(classroomMinX - 0.02, 1.14, dz2),
      null,
      colliders,
      { minX: classroomMinX - 0.14, maxX: classroomMinX + 0.08, minZ: dz2 - 0.08, maxZ: dz2 + 0.08, label: "door_frame" }
    );
    addBox(
      worldGroup,
      occluders,
      new THREE.BoxGeometry(0.22, 0.16, dz2 - dz1),
      beamMat,
      new THREE.Vector3(classroomMinX - 0.02, 2.28, centerDoorZ),
      null,
      colliders,
      null
    );
    const leaf = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 2.08, (dz2 - dz1) * 0.9),
      new THREE.MeshStandardMaterial({ color: "#dfd8ce", map: wallTex, roughness: 0.84, metalness: 0.02 })
    );
    const isFrontDoor = door.kind === "front";
    leaf.position.set(classroomMinX + 0.3, 1.04, centerDoorZ + (isFrontDoor ? 0.1 : -0.06));
    leaf.rotation.y = isFrontDoor ? -1.06 : 0.94;
    worldGroup.add(leaf);

    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.08, 0.02),
      new THREE.MeshStandardMaterial({ color: "#8f8f8c", roughness: 0.34, metalness: 0.58 })
    );
    handle.position.set(classroomMinX + 0.32, 1.08, centerDoorZ + (isFrontDoor ? 0.16 : -0.16));
    worldGroup.add(handle);
  });

  const plaque = buildTextPlane("LM402", 1.26, 0.34, { bg: "#4c5967", fg: "#fff4da" });
  plaque.position.set(scaled(WORLD.plaque.x), scaled(WORLD.plaque.y), scaled(WORLD.plaque.z));
  plaque.rotation.y = Math.PI / 2;
  plaque.material = plaque.material.clone();
  plaque.material.emissive = new THREE.Color("#6b5f47");
  plaque.material.emissiveIntensity = 0.18;
  worldGroup.add(plaque);

  const plaqueBacker = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.46, 1.18),
    new THREE.MeshStandardMaterial({ color: "#ded6cb", map: wallTex, roughness: 0.9, metalness: 0.01 })
  );
  plaqueBacker.position.set(classroomMinX + 0.01, 1.94, scaled(WORLD.plaque.z));
  worldGroup.add(plaqueBacker);

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
      const plaqueText = `4F-${String.fromCharCode(65 + index)}`;
      const doorPanel = new THREE.Mesh(
        new THREE.BoxGeometry(0.036, 2.12, 0.68),
        new THREE.MeshStandardMaterial({ color: "#dfd8ce", map: wallTex, roughness: 0.84, metalness: 0.02 })
      );
      doorPanel.position.set(classroomMinX + 0.02, 1.06, roomCenterZ);
      worldGroup.add(doorPanel);

      const roomPlaque = buildTextPlane(plaqueText, 0.8, 0.22, { bg: "#5c6672", fg: "#f7f0de" });
      roomPlaque.position.set(classroomMinX - 0.29, 1.92, roomCenterZ + 0.22);
      roomPlaque.rotation.y = Math.PI / 2;
      worldGroup.add(roomPlaque);
    });

  WORLD.wallLabels.forEach((label) => {
    const labelNode = buildWallLabel(label.id);
    labelNode.position.set(scaled(label.x), scaled(label.y), scaled(label.z));
    labelNode.rotation.y = label.rotateY ?? 0;
    worldGroup.add(labelNode);
  });

  const ceilingLight = new THREE.Mesh(
    new THREE.BoxGeometry(1.48, 0.04, 0.32),
    new THREE.MeshStandardMaterial({ color: "#fff8ea", roughness: 0.42, metalness: 0.08, emissive: "#fff1d7", emissiveIntensity: 0.2 })
  );
  ceilingLight.position.set(corridorCenterX + 1.5, corridorHeight - 0.18, centerZ + 0.04);
  worldGroup.add(ceilingLight);

  [
    scaled(560),
    scaled(648),
    scaled(736),
  ].forEach((windowCenterZ) => {
    const exteriorGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.52, 1.24), glassMat);
    exteriorGlass.position.set(classroomMaxX - 0.04, 1.54, windowCenterZ);
    exteriorGlass.rotation.y = -Math.PI / 2;
    worldGroup.add(exteriorGlass);
    const windowFrame = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.36, 1.64), beamMat);
    windowFrame.position.set(classroomMaxX - 0.06, 1.5, windowCenterZ);
    windowFrame.scale.x = 0.8;
    worldGroup.add(windowFrame);
  });

  WORLD.rightWallWindows.forEach((panel) => {
    const centerPanelZ = scaled(panel.z);
    const height = scaled(panel.y2 - panel.y1);
    const centerY = scaled((panel.y1 + panel.y2) / 2);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(scaled(panel.width), height), glassMat);
    glass.position.set(classroomMaxX - 0.045, centerY, centerPanelZ);
    glass.rotation.y = -Math.PI / 2;
    worldGroup.add(glass);
  });

  WORLD.leftWallWindows.forEach((panel) => {
    const centerPanelZ = scaled(panel.z);
    const height = scaled(panel.y2 - panel.y1);
    const centerY = scaled((panel.y1 + panel.y2) / 2);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.54, height), glassMat);
    glass.position.set(classroomMinX + 0.04, centerY, centerPanelZ);
    glass.rotation.y = Math.PI / 2;
    worldGroup.add(glass);
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

  const corridorSunPatch = createGlowPlane("rgba(255,232,178,1)", 5.8, 2.8, 0.3);
  corridorSunPatch.position.set(minX + 1.42, 0.018, scaled(WORLD.frontDoor.center.z));
  corridorSunPatch.rotation.x = -Math.PI / 2;
  corridorSunPatch.rotation.z = 0.12;
  worldGroup.add(corridorSunPatch);

  const parapetSunPatch = createGlowPlane("rgba(255,240,205,1)", 6.6, 3.2, 0.24);
  parapetSunPatch.position.set(minX + 0.72, 1.12, scaled(WORLD.frontDoor.center.z + 42));
  parapetSunPatch.rotation.y = Math.PI / 2;
  parapetSunPatch.rotation.z = 0.04;
  worldGroup.add(parapetSunPatch);

  const corridorWallLight = createGlowPlane("rgba(255,232,182,1)", 3.2, 2.6, 0.2);
  corridorWallLight.position.set(classroomMinX + 0.06, 1.42, scaled(742));
  corridorWallLight.rotation.y = Math.PI / 2;
  worldGroup.add(corridorWallLight);

  const classroomSunPatch = createGlowPlane("rgba(255,226,174,1)", 8.6, 3.4, 0.34);
  classroomSunPatch.position.set(classroomMaxX - 3.4, 0.019, scaled(684));
  classroomSunPatch.rotation.x = -Math.PI / 2;
  classroomSunPatch.rotation.z = -0.16;
  worldGroup.add(classroomSunPatch);

  const backdoorSunPatch = createGlowPlane("rgba(255,240,198,1)", 3.8, 2.1, 0.22);
  backdoorSunPatch.position.set(classroomMinX + 1.04, 0.018, scaled(WORLD.backDoor.center.z));
  backdoorSunPatch.rotation.x = -Math.PI / 2;
  backdoorSunPatch.rotation.z = 0.08;
  worldGroup.add(backdoorSunPatch);

  const seatSunPatch = createGlowPlane("rgba(255,226,184,1)", 4.4, 2.2, 0.24);
  seatSunPatch.position.set(scaled(1560), 0.02, scaled(620));
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
    torso: "#45617f",
    torsoAccent: "#7893b3",
    legs: "#151c26",
    skin: "#ebccb6",
    hair: "#1f1618",
    shoes: "#161316",
    iris: "#463027",
    female: false,
    phone: true,
    scale: 1.01,
  });
  const junior = createPerson({
    torso: "#fffefb",
    torsoAccent: "#fffef9",
    legs: "#8ba6df",
    skin: "#f6dbcf",
    hair: "#1f1617",
    shoes: "#fbf6ef",
    iris: "#5a3426",
    female: true,
    highlight: true,
    scale: 1.1,
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
    new THREE.Vector3(minX - campusDepth * 0.58, 9.4, scaled(2110)),
    new THREE.Vector3(minX - campusDepth * 0.48, 8.9, scaled(1980)),
    new THREE.Vector3(minX - campusDepth * 0.38, 8.1, scaled(1810)),
    new THREE.Vector3(minX - campusDepth * 0.28, 6.9, scaled(1540)),
    new THREE.Vector3(minX - campusDepth * 0.18, 5.9, scaled(1280)),
    new THREE.Vector3(minX - campusDepth * 0.08, 5.2, scaled(1048)),
    new THREE.Vector3(minX + 0.3, 4.5, scaled(930)),
    new THREE.Vector3(minX + 1.1, 3.52, scaled(848)),
    new THREE.Vector3(corridorMinX + 1.88, 2.46, scaled(796)),
    new THREE.Vector3(corridorMinX + 2.86, 2.04, scaled(770)),
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
    torso: "#455c7b",
    torsoAccent: "#6c88aa",
    legs: "#1a212b",
    skin: "#e7c0a8",
    hair: "#24191b",
    shoes: "#171317",
    female: false,
    phone: false,
    scale: 0.98,
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
      const seniorWalkT = THREE.MathUtils.smoothstep(game.endingSequence.time, 0.12, 4.2);
      const juniorWalkT = THREE.MathUtils.smoothstep(game.endingSequence.time, 0.24, 3.2);
      if (game.endingSequence.time < 4.2) {
        applyWalkingPose(senior, Math.sin(game.endingSequence.time * 7.2) * 0.9, 0.9);
      } else {
        applyIdlePose(senior, game.time, 0.8);
      }
      if (game.endingSequence.time < 3.2) {
        applyWalkingPose(junior, Math.sin(game.endingSequence.time * 6.6 + 0.8) * 0.84, 0.7);
      } else {
        applyIdlePose(junior, game.time * 0.84, 0.92);
      }
      senior.position.y += seniorWalkT * 0.01;
      junior.position.y += juniorWalkT * 0.014;
    } else if (game.phase === "front_call") {
      applyIdlePose(senior, game.time * 0.9, 0.76);
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
    const bobStrength = allowBob ? Math.min(0.028, motion * 0.008) : 0;
    const bob = bobStrength ? Math.sin(time * 8.4) * bobStrength : 0;
    camera.position.set(player.x, PLAYER_EYE + bob, player.z);
    camera.rotation.y = player.yaw;
    camera.rotation.x = player.pitch;
  }

  function applyIntroCamera(intro) {
    const progress = THREE.MathUtils.clamp(intro.progress, 0, 1);
    const cameraT = THREE.MathUtils.smoothstep(progress, 0.02, 0.98);
    const camPos = introCurve.getPoint(cameraT);
    const target = introCurve.getPoint(THREE.MathUtils.clamp(cameraT + 0.06, 0, 1));
    camera.fov = THREE.MathUtils.lerp(88, 64, THREE.MathUtils.smoothstep(progress, 0.08, 0.94));
    camera.updateProjectionMatrix();
    camera.position.copy(camPos);
    const settleT = THREE.MathUtils.smoothstep(progress, 0.7, 1);
    const settleTarget = new THREE.Vector3(
      THREE.MathUtils.lerp(
        target.x + THREE.MathUtils.lerp(2.2, 0.22, progress),
        debugAnchors.senior.x * 0.48 + debugAnchors.doorPlaque.x * 0.34 + debugAnchors.parapetBand.x * 0.18,
        settleT
      ),
      THREE.MathUtils.lerp(3.4, 1.56, progress),
      THREE.MathUtils.lerp(
        target.z + THREE.MathUtils.lerp(-0.18, -0.04, progress),
        debugAnchors.senior.z * 0.54 + debugAnchors.doorPlaque.z * 0.18 + debugAnchors.parapetBand.z * 0.28,
        settleT
      )
    );
    camera.lookAt(settleTarget);
    camera.rotateZ(Math.sin(progress * Math.PI * 3.2) * THREE.MathUtils.lerp(0.3, 0.02, progress));

    introGroup.visible = true;
    introTube.material.opacity = THREE.MathUtils.lerp(0.88, 0.14, progress);
    introTube.material.emissiveIntensity = THREE.MathUtils.lerp(2.1, 0.58, progress);
    const daughterT = THREE.MathUtils.clamp(progress + 0.03, 0, 1);
    const daughterPos = introCurve.getPoint(daughterT);
    const daughterNext = introCurve.getPoint(THREE.MathUtils.clamp(daughterT + 0.015, 0, 1));
    introDaughter.position.copy(daughterPos).add(new THREE.Vector3(0, Math.sin(progress * Math.PI * 5.4) * 0.12, 0));
    introDaughter.lookAt(daughterNext);
    introDaughter.rotateY(Math.PI);
    introDaughter.rotation.z = Math.sin(progress * Math.PI * 4.2) * 0.18;
    introDaughter.rotation.x = Math.sin(progress * Math.PI * 2.8) * 0.12;
    applyFlyingPose(introDaughter, progress);
    introAura.position.copy(daughterPos).add(new THREE.Vector3(0, 0.32, -0.18));
    introAura.lookAt(camera.position);
    introAura.material.opacity = THREE.MathUtils.lerp(0.82, 0.2, progress);
    introBloom.position.copy(daughterPos).add(new THREE.Vector3(-0.2, 0.34, -0.48));
    introBloom.lookAt(camera.position);
    introBloom.material.opacity = THREE.MathUtils.lerp(0.5, 0.14, progress);
    introRibbon.position.copy(daughterPos).add(new THREE.Vector3(-0.14, 0.22, -0.74));
    introRibbon.lookAt(camera.position);
    introRibbon.material.opacity = THREE.MathUtils.lerp(0.32, 0.04, progress);
    introSpark.position.copy(introCurve.getPoint(THREE.MathUtils.clamp(progress + 0.08, 0, 1)));
    introSpark.scale.setScalar(1 + Math.sin(progress * Math.PI * 6) * 0.32);
    introWake.position.copy(daughterPos).add(new THREE.Vector3(0.1, 0.14, -0.56));
    introWake.lookAt(camera.position);
    introWake.material.opacity = THREE.MathUtils.lerp(0.34, 0.06, progress);

    const seniorWalkT = THREE.MathUtils.smoothstep(progress, 0.56, 0.96);
    const seniorStart = new THREE.Vector3(scaled(-468), 0, scaled(WORLD.stairs.front.landingZ - 26));
    const seniorEnd = new THREE.Vector3(scaled(-346), 0, scaled(WORLD.frontDoor.center.z + 10));
    introSenior.position.lerpVectors(seniorStart, seniorEnd, seniorWalkT);
    introSenior.rotation.y = Math.atan2(
      -(scaled(WORLD.frontDoor.center.x) - introSenior.position.x),
      -(scaled(WORLD.frontDoor.center.z) - introSenior.position.z)
    );
    applyWalkingPose(introSenior, Math.sin(progress * Math.PI * 10.4) * 0.82, 0.9);
  }

  function applyPerfectEndingCamera(game) {
    const totalTime = game.endingSequence?.time ?? 0;
    const holdDuration = 5;
    const orbitDuration = Math.max(1, CINEMATIC_TIMELINE.perfectDuration - holdDuration);
    const center = junior.position.clone().add(new THREE.Vector3(0, 1.5, 0));
    const eyeTarget = center.clone().add(new THREE.Vector3(0.01, 0.015, 0.145));
    if (totalTime < orbitDuration) {
      const orbitT = THREE.MathUtils.clamp(totalTime / orbitDuration, 0, 1);
      const eased = THREE.MathUtils.smoothstep(orbitT, 0.04, 0.94);
      const radius = THREE.MathUtils.lerp(3.22, 0.92, THREE.MathUtils.smoothstep(orbitT, 0.12, 0.92));
      const startAngle = -1.18;
      const angle = THREE.MathUtils.lerp(startAngle, startAngle + Math.PI * 2, eased);
      camera.position.set(
        center.x + Math.cos(angle) * radius,
        THREE.MathUtils.lerp(1.54, 1.76, orbitT),
        center.z + Math.sin(angle) * radius
      );
      const lookTarget = center.clone().lerp(eyeTarget, THREE.MathUtils.smoothstep(orbitT, 0.72, 1));
      camera.fov = THREE.MathUtils.lerp(62, 34, THREE.MathUtils.smoothstep(orbitT, 0.54, 0.98));
      camera.updateProjectionMatrix();
      camera.lookAt(lookTarget.x, lookTarget.y, lookTarget.z);
      return;
    }

    const holdT = THREE.MathUtils.clamp((totalTime - orbitDuration) / holdDuration, 0, 1);
    const startPos = new THREE.Vector3(center.x + 0.72, 1.72, center.z + 0.28);
    const endPos = new THREE.Vector3(center.x + 0.06, 1.58, center.z + 0.16);
    camera.position.lerpVectors(startPos, endPos, THREE.MathUtils.smoothstep(holdT, 0, 1));
    camera.fov = THREE.MathUtils.lerp(34, 22, holdT);
    camera.updateProjectionMatrix();
    camera.lookAt(eyeTarget.x, eyeTarget.y, eyeTarget.z);
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
      const targetFov = game.phase === "front_call" ? 62 : game.phase === "eye_contact" ? 58 : 64;
      if (camera.fov !== targetFov) {
        camera.fov = targetFov;
        camera.updateProjectionMatrix();
      }
      applyPlayerCamera(game.player, time, true);
    }

    const daylight = isIntro ? THREE.MathUtils.lerp(0.34, 1, game.intro.progress) : 1;
    sun.intensity = 1.96 * daylight + (game.phase === "eye_contact" || game.ending === "perfect" ? 0.62 : game.phase === "front_call" ? 0.18 : 0.12);
    ambient.intensity = 0.28 + daylight * 0.2;
    corridorFill.intensity = isIntro ? 0.66 : 0.98;
    corridorSun.intensity = game.ending === "perfect" ? 1.42 : game.phase === "front_call" ? 1.36 : 1.02;
    classroomAccent.intensity = game.phase === "eye_contact" || game.ending === "perfect" ? 1.34 : 0.94;
    backdoorAccent.intensity = game.phase === "eye_contact" || game.ending === "perfect" ? 1.04 : 0.62;
    corridorSunPatch.material.opacity = game.ending === "perfect" ? 0.42 : game.phase === "front_call" ? 0.46 : 0.24;
    parapetSunPatch.material.opacity = game.phase === "front_call" ? 0.32 : game.ending === "perfect" ? 0.24 : 0.14;
    classroomSunPatch.material.opacity = game.phase === "eye_contact" || game.ending === "perfect" ? 0.6 : 0.38;
    seatSunPatch.material.opacity = game.ending === "perfect" ? 0.46 : game.phase === "eye_contact" ? 0.36 : 0.22;
    backdoorSunPatch.material.opacity = game.ending === "perfect" ? 0.38 : game.phase === "eye_contact" ? 0.3 : 0.18;
    scene.background.setStyle(isIntro ? "#090d16" : "#dde8f2");
    scene.fog.color.setStyle(isIntro ? "#121722" : "#d6e1eb");
    scene.fog.near = isIntro ? 3 : 16;
    scene.fog.far = isIntro ? 20 : 68;

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
