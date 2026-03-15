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
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, 256, 256);
  ctx.strokeStyle = "rgba(64,36,36,.74)";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(78, 102);
  ctx.quadraticCurveTo(102, 92, 124, 100);
  ctx.moveTo(132, 100);
  ctx.quadraticCurveTo(154, 90, 180, 100);
  ctx.stroke();
  ctx.fillStyle = "#24191a";
  ctx.beginPath();
  ctx.ellipse(100, 122, 9, 12, 0, 0, Math.PI * 2);
  ctx.ellipse(156, 122, 9, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(132,86,82,.62)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(128, 128);
  ctx.quadraticCurveTo(138, 150, 126, 164);
  ctx.stroke();
  ctx.strokeStyle = female ? "rgba(170,88,104,.86)" : "rgba(122,82,76,.82)";
  ctx.beginPath();
  ctx.moveTo(92, 190);
  ctx.quadraticCurveTo(128, 206, 164, 188);
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
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.32), material);
  plane.position.set(0, 0.02, 0.18);
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

  const torsoMat = new THREE.MeshStandardMaterial({ color: spec.torso, roughness: 0.84, metalness: 0.04 });
  const legsMat = new THREE.MeshStandardMaterial({ color: spec.legs, roughness: 0.82, metalness: 0.03 });
  const skinMat = new THREE.MeshStandardMaterial({ color: spec.skin, roughness: 0.9, metalness: 0.02 });
  const hairMat = new THREE.MeshStandardMaterial({ color: spec.hair, roughness: 0.88, metalness: 0.04 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: spec.shoes, roughness: 0.92, metalness: 0.04 });

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.44, 6, 10), torsoMat);
  torso.position.set(0, 1.03, 0);
  group.add(torso);

  const hip = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.18, 0.2), legsMat);
  hip.position.set(0, 0.7, 0);
  group.add(hip);

  const legGeo = new THREE.CapsuleGeometry(0.08, 0.44, 5, 8);
  const leftLeg = new THREE.Mesh(legGeo, legsMat);
  leftLeg.position.set(-0.1, 0.34, 0);
  const rightLeg = leftLeg.clone();
  rightLeg.position.x = 0.1;
  group.add(leftLeg, rightLeg);

  const shoeGeo = new THREE.BoxGeometry(0.12, 0.06, 0.22);
  const shoeL = new THREE.Mesh(shoeGeo, shoeMat);
  shoeL.position.set(-0.1, 0.04, 0.04);
  const shoeR = shoeL.clone();
  shoeR.position.x = 0.1;
  group.add(shoeL, shoeR);

  const armGeo = new THREE.CapsuleGeometry(0.055, 0.36, 4, 8);
  const leftArm = new THREE.Mesh(armGeo, skinMat);
  leftArm.position.set(-0.24, 1.02, 0.01);
  leftArm.rotation.z = 0.16;
  const rightArm = leftArm.clone();
  rightArm.position.x = 0.24;
  rightArm.rotation.z = -0.16;
  group.add(leftArm, rightArm);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 24, 24), skinMat);
  head.position.set(0, 1.48, 0);
  group.add(head);

  const hair = new THREE.Mesh(new THREE.SphereGeometry(spec.female ? 0.205 : 0.198, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.75), hairMat);
  hair.position.set(0, 1.53, -0.02);
  hair.rotation.x = -0.08;
  group.add(hair);

  if (spec.female) {
    const sideHairL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.26, 0.06), hairMat);
    sideHairL.position.set(-0.17, 1.38, 0);
    const sideHairR = sideHairL.clone();
    sideHairR.position.x = 0.17;
    group.add(sideHairL, sideHairR);
  }

  const face = createFacePlane(makeFaceTexture({ female: spec.female }));
  face.position.y = 1.48;
  group.add(face);

  if (spec.highlight) {
    const glow = createGlowPlane("rgba(255,234,184,1)", 1.2, 1.8, 0.28);
    glow.position.set(0.12, 1.14, -0.08);
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
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.32 })
  );
  ring.rotation.x = Math.PI / 2;
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.42 })
  );
  group.add(ring, core);
  group.visible = false;
  return group;
}

function buildIntroCurve() {
  return new THREE.CatmullRomCurve3([
    new THREE.Vector3(-7.8, 4.4, -5.5),
    new THREE.Vector3(-5.4, 3.6, -1.8),
    new THREE.Vector3(-3.6, 2.8, 2.2),
    new THREE.Vector3(-2.4, 2.0, 6.0),
    new THREE.Vector3(-1.5, 1.72, 10.2),
    new THREE.Vector3(-1.4, 1.68, 16.2),
    new THREE.Vector3(-2.2, 1.66, 21.0),
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
  scene.background = new THREE.Color("#9ba8b9");
  scene.fog = new THREE.Fog("#adb6c3", 8, 30);

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

  const hemiLight = new THREE.HemisphereLight(0xd6e0f0, 0x605142, 1.02);
  scene.add(hemiLight);

  const ambient = new THREE.AmbientLight(0xffffff, 0.26);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xffe5b6, 2.35);
  sun.position.set(8.4, 8.6, 6.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 40;
  sun.shadow.camera.left = -12;
  sun.shadow.camera.right = 12;
  sun.shadow.camera.top = 12;
  sun.shadow.camera.bottom = -12;
  scene.add(sun);

  const corridorFill = new THREE.PointLight(0x8fa6ff, 0.7, 18, 2);
  corridorFill.position.set(-5.8, 2.8, 5.6);
  scene.add(corridorFill);

  const classroomFloorMat = new THREE.MeshStandardMaterial({ color: "#816448", roughness: 0.92, metalness: 0.02 });
  const corridorFloorMat = new THREE.MeshStandardMaterial({ color: "#b0bac8", roughness: 0.88, metalness: 0.02 });
  const wallMat = new THREE.MeshStandardMaterial({ color: "#e3dfd6", roughness: 0.94, metalness: 0.01 });
  const corridorWallMat = new THREE.MeshStandardMaterial({ color: "#c6d0dc", roughness: 0.92, metalness: 0.02 });
  const woodMat = new THREE.MeshStandardMaterial({ color: "#8a643b", roughness: 0.82, metalness: 0.04 });
  const metalMat = new THREE.MeshStandardMaterial({ color: "#7c7f85", roughness: 0.6, metalness: 0.34 });
  const boardMat = new THREE.MeshStandardMaterial({ color: "#29453a", roughness: 0.88, metalness: 0.02 });
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
  const corridorCenterX = (minX + dividerX) / 2;
  const corridorWidth = Math.abs(dividerX - minX);
  const classroomCenterX = (dividerX + maxX) / 2;
  const classroomWidth = Math.abs(maxX - dividerX);
  const length = Math.abs(maxZ - minZ);
  const roomCenterZ = (minZ + maxZ) / 2;

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

  const ceiling = new THREE.Mesh(
    new THREE.BoxGeometry(maxX - minX, 0.12, length),
    new THREE.MeshStandardMaterial({ color: "#e8e8ea", roughness: 0.95, metalness: 0.01 })
  );
  ceiling.position.set((minX + maxX) / 2, 2.9, roomCenterZ);
  ceiling.receiveShadow = true;
  worldGroup.add(ceiling);

  const wallThickness = 0.14;
  const wallHeight = 2.84;

  addBox(
    worldGroup,
    occluders,
    new THREE.BoxGeometry(wallThickness, wallHeight, length),
    corridorWallMat,
    new THREE.Vector3(minX, wallHeight / 2, roomCenterZ),
    null,
    colliders,
    { minX: minX - wallThickness / 2, maxX: minX + wallThickness / 2, minZ, maxZ, label: "corridor_wall" }
  );
  addBox(
    worldGroup,
    occluders,
    new THREE.BoxGeometry(wallThickness, wallHeight, length),
    wallMat,
    new THREE.Vector3(maxX, wallHeight / 2, roomCenterZ),
    null,
    colliders,
    { minX: maxX - wallThickness / 2, maxX: maxX + wallThickness / 2, minZ, maxZ, label: "window_wall" }
  );
  addBox(
    worldGroup,
    occluders,
    new THREE.BoxGeometry(maxX - minX, wallHeight, wallThickness),
    wallMat,
    new THREE.Vector3((minX + maxX) / 2, wallHeight / 2, minZ),
    null,
    colliders,
    { minX, maxX, minZ: minZ - wallThickness / 2, maxZ: minZ + wallThickness / 2, label: "front_wall" }
  );
  addBox(
    worldGroup,
    occluders,
    new THREE.BoxGeometry(maxX - minX, wallHeight, wallThickness),
    wallMat,
    new THREE.Vector3((minX + maxX) / 2, wallHeight / 2, maxZ),
    null,
    colliders,
    { minX, maxX, minZ: maxZ - wallThickness / 2, maxZ: maxZ + wallThickness / 2, label: "back_wall" }
  );

  const dividerSegments = [
    [minZ, scaled(WORLD.frontDoor.z1)],
    [scaled(WORLD.frontDoor.z2), scaled(WORLD.backDoor.z1)],
    [scaled(WORLD.backDoor.z2), maxZ],
  ];
  dividerSegments.forEach(([zStart, zEnd]) => {
    const segmentLength = zEnd - zStart;
    addBox(
      worldGroup,
      occluders,
      new THREE.BoxGeometry(wallThickness, wallHeight, segmentLength),
      corridorWallMat,
      new THREE.Vector3(dividerX, wallHeight / 2, zStart + segmentLength / 2),
      null,
      colliders,
      { minX: dividerX - wallThickness / 2, maxX: dividerX + wallThickness / 2, minZ: zStart, maxZ: zEnd, label: "divider_wall" }
    );
  });

  const doorFrames = [
    { z1: scaled(WORLD.frontDoor.z1), z2: scaled(WORLD.frontDoor.z2) },
    { z1: scaled(WORLD.backDoor.z1), z2: scaled(WORLD.backDoor.z2) },
  ];
  doorFrames.forEach(({ z1, z2 }) => {
    const doorCenterZ = (z1 + z2) / 2;
    const doorDepth = z2 - z1;
    addBox(
      worldGroup,
      occluders,
      new THREE.BoxGeometry(0.26, 2.32, 0.18),
      new THREE.MeshStandardMaterial({ color: "#ece4d4", roughness: 0.9, metalness: 0.02 }),
      new THREE.Vector3(dividerX - 0.04, 1.16, z1),
      null,
      colliders,
      { minX: dividerX - 0.18, maxX: dividerX + 0.08, minZ: z1 - 0.08, maxZ: z1 + 0.08, label: "door_frame" }
    );
    addBox(
      worldGroup,
      occluders,
      new THREE.BoxGeometry(0.26, 2.32, 0.18),
      new THREE.MeshStandardMaterial({ color: "#ece4d4", roughness: 0.9, metalness: 0.02 }),
      new THREE.Vector3(dividerX - 0.04, 1.16, z2),
      null,
      colliders,
      { minX: dividerX - 0.18, maxX: dividerX + 0.08, minZ: z2 - 0.08, maxZ: z2 + 0.08, label: "door_frame" }
    );
    addBox(
      worldGroup,
      occluders,
      new THREE.BoxGeometry(0.24, 0.18, doorDepth),
      new THREE.MeshStandardMaterial({ color: "#f1ecde", roughness: 0.86, metalness: 0.01 }),
      new THREE.Vector3(dividerX - 0.04, 2.32, doorCenterZ),
      null,
      colliders,
      null
    );
  });

  const boardX1 = scaled(WORLD.board.x1);
  const boardX2 = scaled(WORLD.board.x2);
  const boardY1 = scaled(WORLD.board.y1);
  const boardY2 = scaled(WORLD.board.y2);
  const boardZ = scaled(WORLD.board.z);

  addBox(
    worldGroup,
    occluders,
    new THREE.BoxGeometry(boardX2 - boardX1, boardY2 - boardY1, 0.06),
    boardMat,
    new THREE.Vector3((boardX1 + boardX2) / 2, (boardY1 + boardY2) / 2, boardZ),
    null,
    colliders,
    null
  );
  addBox(
    worldGroup,
    occluders,
    new THREE.BoxGeometry(boardX2 - boardX1 + 0.14, 0.06, 0.16),
    new THREE.MeshStandardMaterial({ color: "#d2c8b8", roughness: 0.9, metalness: 0.02 }),
    new THREE.Vector3((boardX1 + boardX2) / 2, boardY1 - 0.12, boardZ + 0.04),
    null,
    colliders,
    null
  );

  const clock = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 0.05, 32),
    new THREE.MeshStandardMaterial({ color: "#f4eee4", roughness: 0.9, metalness: 0.02 })
  );
  clock.rotation.x = Math.PI / 2;
  clock.position.set(-0.2, 2.18, minZ + 0.1);
  worldGroup.add(clock);

  WORLD.windows.forEach((panel) => {
    const centerZ = scaled(panel.z);
    const y1 = scaled(panel.y1);
    const y2 = scaled(panel.y2);
    const height = y2 - y1;
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.62, height), glassMat);
    glass.position.set(maxX - 0.05, y1 + height / 2, centerZ);
    glass.rotation.y = -Math.PI / 2;
    worldGroup.add(glass);
    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 1.66), wallMat);
    frameTop.position.set(maxX - 0.08, y2 + 0.04, centerZ);
    const frameBottom = frameTop.clone();
    frameBottom.position.y = y1 - 0.04;
    const frameLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, height + 0.14, 0.08), wallMat);
    frameLeft.position.set(maxX - 0.08, y1 + height / 2, centerZ - 0.83);
    const frameRight = frameLeft.clone();
    frameRight.position.z = centerZ + 0.83;
    worldGroup.add(frameTop, frameBottom, frameLeft, frameRight);
  });

  WORLD.lightBeams.forEach((beam) => {
    const beamMat = new THREE.MeshBasicMaterial({
      color: "#ffdc9b",
      transparent: true,
      opacity: beam.alpha * 0.65,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const geo = new THREE.PlaneGeometry(scaled(beam.reach), scaled(beam.width * 1.05));
    const plane = new THREE.Mesh(geo, beamMat);
    plane.position.set(maxX - scaled(beam.reach) * 0.54, 1.08, scaled(beam.z));
    plane.rotation.y = Math.PI / 2;
    plane.rotation.z = -0.42;
    worldGroup.add(plane);
  });

  WORLD.desks.forEach((desk, index) => {
    const x = scaled(desk.x);
    const z = scaled(desk.z);
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.08, 0.76), woodMat);
    top.position.set(x, 0.78, z);
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.05, 0.26), woodMat);
    shelf.position.set(x, 0.46, z + 0.22);
    worldGroup.add(top, shelf);
    const legGeo = new THREE.BoxGeometry(0.06, 0.78, 0.06);
    [
      [-0.44, -0.28],
      [0.44, -0.28],
      [-0.44, 0.28],
      [0.44, 0.28],
    ].forEach(([dx, dz]) => {
      const leg = new THREE.Mesh(legGeo, metalMat);
      leg.position.set(x + dx, 0.39, z + dz);
      worldGroup.add(leg);
    });
    addCollider(colliders, x - 0.55, x + 0.55, z - 0.4, z + 0.4, `desk_${index}`);
  });

  WORLD.notes.forEach((note) => {
    const page = new THREE.Mesh(
      new THREE.PlaneGeometry(0.22, 0.16),
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

  const dustGeometry = new THREE.BufferGeometry();
  const dustPositions = [];
  for (let index = 0; index < 120; index += 1) {
    dustPositions.push(
      THREE.MathUtils.lerp(minX + 0.2, maxX - 0.2, Math.random()),
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
    legs: "#151c26",
    skin: "#deb497",
    hair: "#251a19",
    shoes: "#1b1717",
    female: false,
  });
  const junior = createPerson({
    torso: "#f4f1eb",
    legs: "#6d8dc4",
    skin: "#efcab4",
    hair: "#211717",
    shoes: "#f7f0e8",
    female: true,
    highlight: true,
  });
  const fatherEcho = createPerson({
    torso: "#f4c39e",
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
    torso: "#f5d6cb",
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
      ring.scale.setScalar(hotspot.id === activeId ? 1.16 : 0.84);
      ring.children[0].material.opacity = hotspot.id === activeId ? 0.74 : 0.18;
      ring.children[1].material.opacity = hotspot.id === activeId ? 0.5 : 0.16;
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
    camera.lookAt(target.x + 0.6, THREE.MathUtils.lerp(1.8, 1.55, progress), target.z + 0.25);

    introGroup.visible = true;
    introTube.material.opacity = THREE.MathUtils.lerp(0.84, 0.18, progress);
    introTube.material.emissiveIntensity = THREE.MathUtils.lerp(1.5, 0.48, progress);
    const daughterT = THREE.MathUtils.clamp(progress + 0.04, 0, 1);
    const daughterPos = introCurve.getPoint(daughterT);
    const daughterNext = introCurve.getPoint(THREE.MathUtils.clamp(daughterT + 0.02, 0, 1));
    introDaughter.position.copy(daughterPos);
    introDaughter.lookAt(daughterNext);
    introDaughter.rotateY(Math.PI);
    introAura.position.copy(daughterPos).add(new THREE.Vector3(0, 0.34, -0.12));
    introAura.lookAt(camera.position);
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
    sun.intensity = 1.4 * daylight + (game.phase === "eye_contact" ? 0.22 : 0);
    ambient.intensity = 0.18 + daylight * 0.12;
    corridorFill.intensity = isIntro ? 0.46 : 0.6;
    scene.background.setStyle(isIntro ? "#0a0d16" : "#98a7b8");
    scene.fog.color.setStyle(isIntro ? "#121722" : "#abb7c5");
    scene.fog.near = isIntro ? 2.5 : 8;
    scene.fog.far = isIntro ? 18 : 30;

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
