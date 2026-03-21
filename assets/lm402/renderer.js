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

// Cached vectors/colors to avoid per-frame allocations
const _introAuraOff = new THREE.Vector3(0, 0.32, -0.18);
const _introBloomOff = new THREE.Vector3(-0.2, 0.34, -0.48);
const _introRibbonOff = new THREE.Vector3(-0.14, 0.22, -0.74);
const _introWakeOff = new THREE.Vector3(0.1, 0.14, -0.56);
const _sparkCoolColor = new THREE.Color("#e0d8ff");
const _sparkWarmColor = new THREE.Color("#ffd8a0");
const _endingCenterOff = new THREE.Vector3(0, 1.5, 0);
const _endingSeniorEyeOff = new THREE.Vector3(0.03, 1.57, 0.04);
const _endingShoulderOff = new THREE.Vector3(0.18, 0.08, -0.12);
const _endingHoldOff = new THREE.Vector3(0.02, 0.012, 0.004);
const _endingCloseOff = new THREE.Vector3(0.008, 0.006, 0);
const _endingFaceOff = new THREE.Vector3(0.004, 0.018, 0);

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

  // --- Eyebrows ---
  if (referenceJunior) {
    // More defined eyebrow shape: thick at inner end, tapering thin at outer end
    ctx.fillStyle = "rgba(112,84,74,.72)";
    // Left eyebrow
    ctx.beginPath();
    ctx.moveTo(88, 128);
    ctx.quadraticCurveTo(104, 112, 144, 117);
    ctx.lineTo(144, 123);
    ctx.quadraticCurveTo(104, 118, 90, 130);
    ctx.closePath();
    ctx.fill();
    // Right eyebrow (mirrored)
    ctx.beginPath();
    ctx.moveTo(232, 128);
    ctx.quadraticCurveTo(216, 112, 176, 117);
    ctx.lineTo(176, 123);
    ctx.quadraticCurveTo(216, 118, 230, 130);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.strokeStyle = female ? "rgba(82,48,47,.7)" : "rgba(74,43,40,.72)";
    ctx.lineWidth = female ? 6 : 7;
    ctx.beginPath();
    ctx.moveTo(92, 116);
    ctx.quadraticCurveTo(118, female ? 94 : 100, 142, 110);
    ctx.moveTo(178, 110);
    ctx.quadraticCurveTo(202, female ? 94 : 100, 228, 116);
    ctx.stroke();
  }

  // Eye whites visible behind dark pupils for referenceJunior — 20% larger for expressive Vivian Hsu-style eyes
  if (referenceJunior) {
    ctx.fillStyle = "rgba(255,255,255,.85)";
    ctx.beginPath();
    ctx.ellipse(114, 152, 26, 17, -0.02, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(206, 152, 26, 17, 0.02, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#24191a";
  ctx.beginPath();
  ctx.ellipse(114, referenceJunior ? 152 : 146, referenceJunior ? 21 : 15, referenceJunior ? 16 : 12, -0.02, 0, Math.PI * 2);
  ctx.ellipse(206, referenceJunior ? 152 : 146, referenceJunior ? 21 : 15, referenceJunior ? 16 : 12, 0.02, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = female ? (referenceJunior ? "#5b3929" : "#3f231f") : "#35201d";
  ctx.beginPath();
  ctx.ellipse(114, referenceJunior ? 152 : 146, referenceJunior ? 8.6 : 6, referenceJunior ? 10.6 : 7, 0, 0, Math.PI * 2);
  ctx.ellipse(206, referenceJunior ? 152 : 146, referenceJunior ? 8.6 : 6, referenceJunior ? 10.6 : 7, 0, 0, Math.PI * 2);
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

    // Eyelash detail — thin curved strokes above the eyes
    ctx.strokeStyle = referenceJunior ? "rgba(36,22,24,.82)" : "rgba(39,20,18,.68)";
    ctx.lineWidth = referenceJunior ? 3.6 : 2.4;
    ctx.lineCap = "round";
    // Left eye lashes
    ctx.beginPath();
    ctx.moveTo(referenceJunior ? 82 : 88, referenceJunior ? 140 : 136);
    ctx.quadraticCurveTo(referenceJunior ? 100 : 104, referenceJunior ? 130 : 128, referenceJunior ? 120 : 124, referenceJunior ? 136 : 132);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(referenceJunior ? 108 : 112, referenceJunior ? 134 : 130);
    ctx.quadraticCurveTo(referenceJunior ? 126 : 128, referenceJunior ? 128 : 124, referenceJunior ? 140 : 142, referenceJunior ? 134 : 132);
    ctx.stroke();
    // Right eye lashes
    ctx.beginPath();
    ctx.moveTo(referenceJunior ? 200 : 196, referenceJunior ? 140 : 136);
    ctx.quadraticCurveTo(referenceJunior ? 218 : 216, referenceJunior ? 130 : 128, referenceJunior ? 238 : 232, referenceJunior ? 136 : 132);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(referenceJunior ? 180 : 178, referenceJunior ? 134 : 130);
    ctx.quadraticCurveTo(referenceJunior ? 198 : 196, referenceJunior ? 128 : 124, referenceJunior ? 212 : 210, referenceJunior ? 134 : 132);
    ctx.stroke();

    if (referenceJunior) {
      // Double eyelid crease — subtle curved line above each eye
      ctx.strokeStyle = "rgba(120,80,70,.35)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(88, 134);
      ctx.quadraticCurveTo(114, 126, 140, 134);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(180, 134);
      ctx.quadraticCurveTo(206, 126, 232, 134);
      ctx.stroke();

      // Longer eyelashes — multiple thin curved lines from outer eye corners
      ctx.strokeStyle = "rgba(36,22,24,.7)";
      ctx.lineWidth = 1.4;
      // Left eye outer lashes
      ctx.beginPath();
      ctx.moveTo(78, 144);
      ctx.quadraticCurveTo(72, 136, 68, 130);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(82, 142);
      ctx.quadraticCurveTo(74, 132, 72, 126);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(86, 140);
      ctx.quadraticCurveTo(80, 130, 78, 124);
      ctx.stroke();
      // Right eye outer lashes
      ctx.beginPath();
      ctx.moveTo(242, 144);
      ctx.quadraticCurveTo(248, 136, 252, 130);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(238, 142);
      ctx.quadraticCurveTo(246, 132, 248, 126);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(234, 140);
      ctx.quadraticCurveTo(240, 130, 242, 124);
      ctx.stroke();
    }
  }

  ctx.fillStyle = "rgba(255,255,255,.94)";
  ctx.beginPath();
  ctx.ellipse(110, referenceJunior ? 145 : 142, referenceJunior ? 4.6 : 3, referenceJunior ? 4.6 : 3, 0, 0, Math.PI * 2);
  ctx.ellipse(202, referenceJunior ? 145 : 142, referenceJunior ? 4.6 : 3, referenceJunior ? 4.6 : 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Nose bridge line for referenceJunior — higher, longer, more defined (高鼻梁)
  if (referenceJunior) {
    ctx.strokeStyle = "rgba(180,140,130,.28)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(160, 122);
    ctx.bezierCurveTo(161, 148, 159, 174, 157, 198);
    ctx.stroke();
    // Subtle nose bridge highlight on left side
    ctx.strokeStyle = "rgba(255,255,255,.12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(158, 124);
    ctx.bezierCurveTo(159, 148, 157, 172, 155, 196);
    ctx.stroke();
  }

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

  // Subtle cheek highlights for referenceJunior
  if (referenceJunior) {
    ctx.fillStyle = "rgba(255,255,255,.09)";
    ctx.beginPath();
    ctx.ellipse(96, 180, 14, 10, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(224, 180, 14, 10, 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Beauty mark (美人痣) — small dark dot below left eye, like 徐若瑄
    ctx.fillStyle = "rgba(62,38,32,.72)";
    ctx.beginPath();
    ctx.arc(126, 174, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Fuller, more defined lips with bezier curves for referenceJunior
  if (referenceJunior) {
    // Upper lip (cupid's bow shape)
    ctx.fillStyle = "rgba(212,135,122,.6)";
    ctx.beginPath();
    ctx.moveTo(130, 226);
    ctx.bezierCurveTo(140, 218, 155, 216, 160, 220);
    ctx.bezierCurveTo(165, 216, 180, 218, 190, 226);
    ctx.bezierCurveTo(178, 230, 165, 232, 160, 230);
    ctx.bezierCurveTo(155, 232, 142, 230, 130, 226);
    ctx.closePath();
    ctx.fill();
    // Lower lip (fuller)
    ctx.fillStyle = "rgba(212,135,122,.48)";
    ctx.beginPath();
    ctx.moveTo(134, 230);
    ctx.bezierCurveTo(142, 228, 155, 232, 160, 230);
    ctx.bezierCurveTo(165, 232, 178, 228, 186, 230);
    ctx.bezierCurveTo(178, 244, 165, 248, 160, 247);
    ctx.bezierCurveTo(155, 248, 142, 244, 134, 230);
    ctx.closePath();
    ctx.fill();
    // Lip highlight
    ctx.fillStyle = "rgba(255,255,255,.14)";
    ctx.beginPath();
    ctx.ellipse(160, 237, 16, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = female ? (referenceJunior ? "rgba(186,126,132,.7)" : "rgba(176,86,112,.92)") : "rgba(126,82,76,.86)";
  ctx.lineWidth = female ? (referenceJunior ? 4.8 : 7) : 6;
  ctx.beginPath();
  // referenceJunior: subtle upward-curved smile suggesting slight nervousness
  ctx.moveTo(referenceJunior ? 132 : 116, referenceJunior ? 238 : 236);
  ctx.quadraticCurveTo(160, referenceJunior ? 242 : 258, referenceJunior ? 188 : 208, referenceJunior ? 238 : 236);
  ctx.stroke();
  if (referenceJunior) {
    // Corner smile lines — slight upward ticks at mouth corners
    ctx.strokeStyle = "rgba(186,126,132,.4)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(132, 238);
    ctx.quadraticCurveTo(128, 236, 126, 232);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(188, 238);
    ctx.quadraticCurveTo(192, 236, 194, 232);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(255,255,255,.18)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(referenceJunior ? 136 : 126, referenceJunior ? 234 : 234);
  ctx.quadraticCurveTo(160, referenceJunior ? 238 : 248, referenceJunior ? 184 : 194, referenceJunior ? 234 : 234);
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

function createRealisticJuniorHologram() {
  const group = new THREE.Group();
  group.userData.baseY = 0;

  const holoMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.1,
    roughness: 0.2,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    emissive: 0x2255aa,
    emissiveIntensity: 0.6,
    clearcoat: 1.0,
    side: THREE.DoubleSide
  });

  holoMat.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <dithering_fragment>',
      `
      #include <dithering_fragment>
      float slice = sin(vWorldPosition.y * 120.0 - cameraPosition.y * 10.0) * 0.5 + 0.5;
      slice = pow(slice, 8.0);
      gl_FragColor.rgb += vec3(0.2, 0.5, 1.0) * slice * 0.8;
      gl_FragColor.a *= (0.7 + slice * 0.3);
      `
    );
    shader.vertexShader = `varying vec3 vWorldPosition;\n` + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <worldpos_vertex>',
      `
      #include <worldpos_vertex>
      vWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
      `
    );
  };

  const hairMat = holoMat.clone(); hairMat.color.setHex(0x221111); hairMat.emissive.setHex(0x112244);
  const skinMat = holoMat.clone(); skinMat.color.setHex(0xffebe0); skinMat.emissive.setHex(0x331111);
  const shirtMat = holoMat.clone(); shirtMat.color.setHex(0xffffff); shirtMat.opacity = 0.9;
  const pantsMat = holoMat.clone(); pantsMat.color.setHex(0x1f344d); pantsMat.opacity = 0.95;
  const shoesMat = holoMat.clone(); shoesMat.color.setHex(0xeeeeee);

  const headGrp = new THREE.Group(); headGrp.position.set(0, 1.54, 0);
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.105, 32, 32), skinMat); face.scale.set(1, 1.15, 1.05); headGrp.add(face);
  const hairBase = new THREE.Mesh(new THREE.SphereGeometry(0.11, 32, 32), hairMat); hairBase.scale.set(1.02, 1.1, 1.05); hairBase.position.set(0, 0.02, -0.01); headGrp.add(hairBase);
  for(let i=0; i<8; i++) {
    const bang = new THREE.Mesh(new THREE.CapsuleGeometry(0.015, 0.06, 8, 8), hairMat);
    bang.position.set(-0.07 + i*0.02, 0.06 - Math.abs(i-3.5)*0.005, 0.1);
    bang.rotation.z = (i-3.5)*0.1; bang.rotation.x = 0.2; headGrp.add(bang);
  }
  const ponytail = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.25, 16, 16), hairMat); ponytail.position.set(0, -0.05, -0.15); ponytail.rotation.x = 0.3;
  const scrunchie = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.015, 16, 32), pantsMat); scrunchie.position.set(0, 0.05, -0.12); scrunchie.rotation.x = 1.2;
  headGrp.add(ponytail, scrunchie); group.add(headGrp); group.userData.head = headGrp;

  const torsoGrp = new THREE.Group(); torsoGrp.position.set(0, 1.15, 0);
  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.25, 32), shirtMat); chest.position.set(0, 0.15, 0); chest.scale.set(1, 1, 0.7); torsoGrp.add(chest);
  const abdomen = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.2, 32), shirtMat); abdomen.position.set(0, -0.05, 0); abdomen.scale.set(1, 1, 0.75); torsoGrp.add(abdomen);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.015, 16, 32), shirtMat); collar.position.set(0, 0.27, 0.02); collar.rotation.x = 1.3; torsoGrp.add(collar);
  group.add(torsoGrp);

  const pelvisGrp = new THREE.Group(); pelvisGrp.position.set(0, 0.95, 0);
  const shorts = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.135, 0.18, 32), pantsMat); shorts.scale.set(1, 1, 0.8); pelvisGrp.add(shorts); group.add(pelvisGrp);

  function createLimb(rT, rB, len, mat) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rT, rB, len, 32), mat); mesh.position.y = -len/2;
    const pivot = new THREE.Group(); pivot.add(mesh); return { pivot, mesh };
  }

  const armL = createLimb(0.035, 0.025, 0.25, shirtMat); armL.pivot.position.set(-0.15, 1.35, 0); armL.pivot.rotation.z = 0.2;
  const forearmL = createLimb(0.025, 0.02, 0.22, skinMat); forearmL.pivot.position.set(0, -0.25, 0); forearmL.pivot.rotation.x = -0.1;
  armL.mesh.add(forearmL.pivot); group.add(armL.pivot); group.userData.armL = armL.pivot;

  const armR = createLimb(0.035, 0.025, 0.25, shirtMat); armR.pivot.position.set(0.15, 1.35, 0); armR.pivot.rotation.z = -0.2;
  const forearmR = createLimb(0.025, 0.02, 0.22, skinMat); forearmR.pivot.position.set(0, -0.25, 0); forearmR.pivot.rotation.x = -0.1;
  armR.mesh.add(forearmR.pivot); group.add(armR.pivot); group.userData.armR = armR.pivot;

  const legL = createLimb(0.06, 0.045, 0.45, skinMat); legL.pivot.position.set(-0.06, 0.85, 0);
  const calfL = createLimb(0.04, 0.03, 0.4, skinMat); calfL.pivot.position.set(0, -0.45, 0); legL.mesh.add(calfL.pivot);
  const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.11), shoesMat); shoeL.position.set(0, -0.4, 0.02); calfL.mesh.add(shoeL);
  group.add(legL.pivot); group.userData.legL = legL.pivot;

  const legR = createLimb(0.06, 0.045, 0.45, skinMat); legR.pivot.position.set(0.06, 0.85, 0);
  const calfR = createLimb(0.04, 0.03, 0.4, skinMat); calfR.pivot.position.set(0, -0.45, 0); legR.mesh.add(calfR.pivot);
  const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.11), shoesMat); shoeR.position.set(0, -0.4, 0.02); calfR.mesh.add(shoeR);
  group.add(legR.pivot); group.userData.legR = legR.pivot;

  return group;
}

function createDoomSprite(frontUrl, sideUrl, backUrl, scaleHeight) {
  const group = new THREE.Group();
  group.userData.isDoomSprite = true;
  group.userData.baseY = 0;
  const textures = { front: null, side: null, back: null };

  function processTex(url, key) {
    const img = new Image();
    img.src = url;
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      const w = canvas.width, h = canvas.height;
      const visited = new Uint8Array(w * h);
      const stack = [];
      const pushV = (x, y) => {
        if(x<0||x>=w||y<0||y>=h) return;
        const idx = y*w+x; if(visited[idx]) return;
        const p = idx*4;
        if(data[p]>220 && data[p+1]>220 && data[p+2]>220) {
          visited[idx] = 1; data[p+3] = 0; stack.push(x, y);
        }
      };
      for(let x=0; x<w; x++){ pushV(x,0); pushV(x,h-1); }
      for(let y=0; y<h; y++){ pushV(0,y); pushV(w-1,y); }
      while(stack.length > 0) {
        const cy = stack.pop(), cx = stack.pop();
        pushV(cx+1,cy); pushV(cx-1,cy); pushV(cx,cy+1); pushV(cx,cy-1);
      }
      ctx.putImageData(imgData, 0, 0);
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      textures[key] = tex;
      if (key === 'front' && group.userData.material) {
        group.userData.material.map = tex;
        group.userData.material.needsUpdate = true;
      }
    };
  }

  processTex(frontUrl, 'front');
  if(sideUrl) processTex(sideUrl, 'side');
  if(backUrl) processTex(backUrl, 'back');

  const material = new THREE.MeshBasicMaterial({ transparent: true, side: THREE.DoubleSide, alphaTest: 0.05, depthWrite: false });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(scaleHeight * 1.777, scaleHeight), material);
  plane.position.y = scaleHeight / 2;
  group.add(plane);

  group.userData.textures = textures;
  group.userData.plane = plane;
  group.userData.material = material;
  return group;
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
    roughness: realisticJunior ? 0.72 : (spec.female ? 0.44 : 0.54),
    metalness: realisticJunior ? 0.02 : 0.02,
    clearcoat: spec.female ? 0.1 : 0.04,
    clearcoatRoughness: 0.4,
  });
  const skinBaseColor = realisticJunior
    ? new THREE.Color(spec.skin).lerp(new THREE.Color('#ffe0c8'), 0.12) // warm undertone
    : new THREE.Color(spec.skin);
  const skinMat = new THREE.MeshPhysicalMaterial({
    color: skinBaseColor,
    roughness: realisticJunior ? 0.12 : 0.32,
    metalness: 0,
    clearcoat: realisticJunior ? 0.58 : 0.28,
    clearcoatRoughness: realisticJunior ? 0.22 : 0.52,
    sheen: realisticJunior ? 0.72 : 0.12,
    sheenRoughness: realisticJunior ? 0.24 : 0.72,
    sheenColor: new THREE.Color(realisticJunior ? '#ffd4b8' : (spec.female ? '#ffcfb8' : '#e8b8a4')),
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
    sheenColor: new THREE.Color(realisticJunior ? '#7a5a3a' : '#000'),
  });
  const shoeMat = new THREE.MeshPhysicalMaterial({ color: spec.shoes, roughness: 0.56, metalness: 0.1, clearcoat: 0.12, clearcoatRoughness: 0.4 });
  const buttonMat = new THREE.MeshPhysicalMaterial({ color: "#f6ede3", roughness: 0.42, metalness: 0.06, clearcoat: 0.16, clearcoatRoughness: 0.28 });

  const waist = new THREE.Mesh(new THREE.CapsuleGeometry(spec.female ? (realisticJunior ? 0.118 : 0.126) : 0.132, 0.18, 5, 10), torsoMat);
  waist.position.set(0, 0.84, 0);
  waist.scale.set(spec.female ? (realisticJunior ? 0.96 : 1.04) : 1.14, 1.02, realisticJunior ? 0.82 : 0.86);
  group.add(waist);

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(spec.female ? 0.172 : 0.166, spec.female ? 0.62 : 0.6, 8, 18), torsoMat);
  torso.position.set(0, 1.08, 0);
  torso.scale.set(spec.female ? 0.98 : 1.1, 1.04, spec.female ? 0.82 : 0.9);
  group.add(torso);

  const chest = new THREE.Mesh(new THREE.SphereGeometry(spec.female ? 0.172 : 0.158, 22, 22), accentMat);
  chest.position.set(0, 1.13, 0.038);
  chest.scale.set(1.06, spec.female ? 0.64 : 0.58, spec.female ? 0.52 : 0.58);
  group.add(chest);

  let skirtGeo;
  if (realisticJunior) {
    // Shorter denim shorts — height 0.16 for exposed legs
    skirtGeo = new THREE.CylinderGeometry(0.166, 0.19, 0.16, 24, 1, false);
    // Slightly perturb bottom ring vertices for denim hem fraying
    const posAttr = skirtGeo.getAttribute('position');
    for (let i = 0; i < posAttr.count; i++) {
      const y = posAttr.getY(i);
      if (y < -0.07) { // bottom ring vertices
        const angle = Math.atan2(posAttr.getZ(i), posAttr.getX(i));
        const wave = Math.sin(angle * 6) * 0.005 + Math.sin(angle * 12) * 0.002;
        posAttr.setY(i, y + wave);
      }
    }
    posAttr.needsUpdate = true;
    skirtGeo.computeVertexNormals();
  } else {
    skirtGeo = new THREE.CylinderGeometry(spec.female ? 0.166 : 0.158, spec.female ? 0.208 : 0.174, spec.female ? 0.24 : 0.22, 16);
  }
  const skirtOrHip = new THREE.Mesh(skirtGeo, legsMat);
  skirtOrHip.position.set(0, realisticJunior ? 0.75 : (spec.female ? 0.71 : 0.74), 0);
  group.add(skirtOrHip);

  // Waistband detail for female characters — subtle band between torso and skirt
  if (spec.female) {
    const waistbandMat = new THREE.MeshPhysicalMaterial({
      color: spec.legs,
      roughness: 0.38,
      metalness: 0.03,
      clearcoat: 0.16,
      clearcoatRoughness: 0.3,
    });
    const waistband = new THREE.Mesh(
      new THREE.TorusGeometry(0.138, 0.014, 8, 24),
      waistbandMat
    );
    waistband.position.set(0, 0.83, 0);
    waistband.rotation.x = Math.PI / 2;
    group.add(waistband);
  }

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

  // Proper shoulder joint detail for realisticJunior
  if (realisticJunior) {
    const shoulderJointMat = skinMat.clone();
    const shoulderJointL = new THREE.Mesh(new THREE.SphereGeometry(0.036, 14, 14), shoulderJointMat);
    shoulderJointL.position.set(-0.206, 1.2, 0.01);
    shoulderJointL.scale.set(1.1, 0.9, 0.85);
    const shoulderJointR = shoulderJointL.clone();
    shoulderJointR.position.x = 0.206;
    group.add(shoulderJointL, shoulderJointR);
  }

  const armGeo = new THREE.CapsuleGeometry(spec.female ? (realisticJunior ? 0.042 : 0.048) : 0.056, spec.female ? 0.42 : 0.46, 5, 10);
  const leftArm = new THREE.Mesh(armGeo, skinMat);
  leftArm.position.set(spec.female ? -0.228 : -0.266, 1.0, 0.02);
  leftArm.rotation.z = spec.female ? 0.12 : 0.15;
  const rightArm = leftArm.clone();
  rightArm.position.x = spec.female ? 0.228 : 0.246;
  rightArm.rotation.z = spec.female ? -0.12 : -0.15;
  group.add(leftArm, rightArm);

  // Wrist detail for realisticJunior — small torus rings
  if (realisticJunior) {
    const wristMat = new THREE.MeshPhysicalMaterial({ color: skinBaseColor, roughness: 0.18, metalness: 0, clearcoat: 0.4, clearcoatRoughness: 0.2 });
    const wristL = new THREE.Mesh(new THREE.TorusGeometry(0.034, 0.006, 8, 16), wristMat);
    wristL.position.set(-0.252, 0.75, 0.035);
    wristL.rotation.z = 0.12;
    const wristR = wristL.clone();
    wristR.position.x = 0.252;
    wristR.rotation.z = -0.12;
    group.add(wristL, wristR);
  }

  const handGeo = new THREE.SphereGeometry(spec.female ? 0.048 : 0.054, 18, 18);
  const leftHand = new THREE.Mesh(handGeo, skinMat);
  leftHand.position.set(spec.female ? -0.264 : -0.302, 0.71, 0.04);
  const rightHand = leftHand.clone();
  rightHand.position.x = spec.female ? 0.264 : 0.286;
  // Elongated feminine hands for realisticJunior
  if (realisticJunior) {
    leftHand.scale.set(0.8, 1.0, 1.2);
    rightHand.scale.set(0.8, 1.0, 1.2);
  }
  group.add(leftHand, rightHand);

  // Finger suggestion for realisticJunior — thin cylinders extending from hands
  if (realisticJunior) {
    const fingerMat = skinMat.clone();
    const fingerGeo = new THREE.CylinderGeometry(0.008, 0.006, 0.06, 8);
    const fingerL = new THREE.Mesh(fingerGeo, fingerMat);
    fingerL.position.set(-0.264, 0.676, 0.06);
    fingerL.rotation.x = Math.PI * 0.38;
    const fingerR = fingerL.clone();
    fingerR.position.x = 0.264;
    group.add(fingerL, fingerR);
  }

  const sleeveGeo = new THREE.CylinderGeometry(spec.female ? 0.072 : 0.078, spec.female ? 0.078 : 0.084, 0.2, 14);
  const leftSleeve = new THREE.Mesh(sleeveGeo, accentMat);
  leftSleeve.position.set(spec.female ? -0.18 : -0.2, 1.1, 0.02);
  leftSleeve.rotation.z = 1.06;
  const rightSleeve = leftSleeve.clone();
  rightSleeve.position.x = spec.female ? 0.18 : 0.2;
  rightSleeve.rotation.z = -1.06;
  group.add(leftSleeve, rightSleeve);

  const neckSkinMat = skinMat.clone();
  neckSkinMat.color = new THREE.Color(spec.skin).lerp(new THREE.Color('#e8b89c'), 0.12);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.08, 0.14, 18), neckSkinMat);
  neck.position.set(0, 1.33, 0.02);
  group.add(neck);

  // Collar detail — small ring-shaped mesh at the neckline
  const necklineCollar = new THREE.Mesh(
    new THREE.TorusGeometry(0.082, 0.01, 8, 24),
    new THREE.MeshPhysicalMaterial({ color: spec.female ? "#fffdf6" : "#e6ebf0", roughness: 0.52, metalness: 0.01, clearcoat: 0.1 })
  );
  necklineCollar.position.set(0, 1.26, 0.02);
  necklineCollar.rotation.x = Math.PI / 2;
  group.add(necklineCollar);

  const head = new THREE.Mesh(new THREE.SphereGeometry(spec.female ? 0.168 : 0.182, 48, 48), skinMat);
  head.position.set(0, 1.56, 0);
  head.scale.set(
    spec.female ? (referenceJunior ? 0.76 : 0.94) : 0.98,
    spec.female ? (referenceJunior ? 1.2 : 1.08) : 1.04,
    spec.female ? (referenceJunior ? 0.82 : 0.91) : 0.9
  );
  group.add(head);
  if (realisticJunior) {
    head.scale.set(0.92, 1.0, 0.88);
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
    new THREE.SphereGeometry(spec.female ? (realisticJunior ? 0.202 : 0.194) : 0.188, 28, 28, 0, Math.PI * 2, 0, Math.PI * 0.72),
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

  // Hair shine highlights for referenceJunior — additional thin mesh layer with high clearcoat
  if (referenceJunior) {
    const hairShineMat = new THREE.MeshPhysicalMaterial({
      color: spec.hair,
      roughness: 0.06,
      metalness: 0.04,
      clearcoat: 0.92,
      clearcoatRoughness: 0.06,
      transparent: true,
      opacity: 0.28,
      sheen: 0.6,
      sheenRoughness: 0.18,
      sheenColor: new THREE.Color('#8b6b4a'),
    });
    const hairShineLayer = new THREE.Mesh(
      new THREE.SphereGeometry(spec.female ? 0.198 : 0.192, 28, 28, 0, Math.PI * 2, 0, Math.PI * 0.72),
      hairShineMat
    );
    hairShineLayer.position.set(0, 1.625, -0.008);
    hairShineLayer.rotation.x = -0.1;
    hairShineLayer.scale.set(1.01, 1.01, 1.01);
    group.add(hairShineLayer);

    // Fuller hair volume — scale up hair geometry slightly and add longer back portion
    hairCap.scale.set(1.04, 1.03, 1.04);
    hairBack.scale.set(
      hairBack.scale.x * 1.06,
      hairBack.scale.y * 1.08,
      hairBack.scale.z * 1.06
    );
    // Extend the back hair down slightly for a longer back portion
    hairBack.position.y -= 0.02;
  }

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

    // Collar spread detail for realisticJunior — V-neck opening with triangular flaps (白襯衫)
    if (realisticJunior) {
      const collarFlapMat = new THREE.MeshPhysicalMaterial({ color: "#ffffff", roughness: 0.42, metalness: 0.01, clearcoat: 0.16, clearcoatRoughness: 0.2 });
      // Triangular collar flaps — wider and more visible
      const collarFlapGeo = new THREE.BufferGeometry();
      const flapVerts = new Float32Array([
        0, 0, 0,       // tip at center
        -0.06, 0.04, 0, // upper outer
        -0.05, -0.02, 0 // lower outer
      ]);
      collarFlapGeo.setAttribute('position', new THREE.BufferAttribute(flapVerts, 3));
      collarFlapGeo.computeVertexNormals();
      const collarFlapL = new THREE.Mesh(collarFlapGeo, collarFlapMat);
      collarFlapL.position.set(-0.01, 1.22, 0.14);
      collarFlapL.rotation.y = 0.3;
      collarFlapL.rotation.z = -0.1;
      group.add(collarFlapL);
      // Right flap (mirrored)
      const collarFlapGeoR = new THREE.BufferGeometry();
      const flapVertsR = new Float32Array([
        0, 0, 0,
        0.06, 0.04, 0,
        0.05, -0.02, 0
      ]);
      collarFlapGeoR.setAttribute('position', new THREE.BufferAttribute(flapVertsR, 3));
      collarFlapGeoR.computeVertexNormals();
      const collarFlapR = new THREE.Mesh(collarFlapGeoR, collarFlapMat);
      collarFlapR.position.set(0.01, 1.22, 0.14);
      collarFlapR.rotation.y = -0.3;
      collarFlapR.rotation.z = 0.1;
      group.add(collarFlapR);
    }

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

    const buttonOffsets = realisticJunior ? [-0.02, 0.08, 0.16, 0.24] : [-0.02, 0.1, 0.22];
    buttonOffsets.forEach((offsetY) => {
      const button = new THREE.Mesh(new THREE.SphereGeometry(realisticJunior ? 0.01 : 0.012, 10, 10), buttonMat);
      button.position.set(0, 1.12 - offsetY, 0.2);
      group.add(button);
    });

    // Long sleeves covering the forearms (white button-up shirt per 2005 reference)
    const forearmSleeveGeo = new THREE.CapsuleGeometry(0.054, 0.34, 5, 10);
    const forearmSleeveMat = new THREE.MeshPhysicalMaterial({
      color: "#fffdfa", roughness: 0.32, metalness: 0.01,
      clearcoat: 0.18, clearcoatRoughness: 0.24
    });
    const leftForearmSleeve = new THREE.Mesh(forearmSleeveGeo, forearmSleeveMat);
    leftForearmSleeve.position.set(-0.246, 0.88, 0.03);
    leftForearmSleeve.rotation.z = 0.12;
    const rightForearmSleeve = leftForearmSleeve.clone();
    rightForearmSleeve.position.x = 0.246;
    rightForearmSleeve.rotation.z = -0.12;
    group.add(leftForearmSleeve, rightForearmSleeve);

    const cuffLeft = new THREE.Mesh(new THREE.TorusGeometry(0.046, 0.012, 8, 18), buttonMat);
    cuffLeft.position.set(-0.254, 0.74, 0.03);
    cuffLeft.rotation.z = 1.52;
    const cuffRight = cuffLeft.clone();
    cuffRight.position.x = 0.254;
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

    if (realisticJunior) {
      // Enhanced multi-segment ponytail with glossy hair material
      const ponytailSheenMat = new THREE.MeshPhysicalMaterial({
        color: spec.hair,
        roughness: 0.08,
        metalness: 0.05,
        clearcoat: 0.72,
        clearcoatRoughness: 0.08,
        sheen: 0.48,
        sheenRoughness: 0.2,
        sheenColor: new THREE.Color('#7a5a3a'),
      });

      ponytailBase.position.set(0.02, 1.692, -0.164);
      scrunchie.position.set(0.02, 1.692, -0.164);

      // Hair tie detail — small torus at ponytail base
      const hairTie = new THREE.Mesh(
        new THREE.TorusGeometry(0.038, 0.01, 12, 24),
        new THREE.MeshPhysicalMaterial({ color: "#2a1418", roughness: 0.3, metalness: 0.08, clearcoat: 0.4 })
      );
      hairTie.position.set(0.02, 1.62, -0.19);
      hairTie.rotation.x = Math.PI * 0.35;
      hairTie.rotation.z = -0.05;
      group.add(hairTie);

      // Segment 1 — widest, near base
      const ptSeg1 = new THREE.Mesh(new THREE.CapsuleGeometry(0.042, 0.22, 8, 14), ponytailSheenMat);
      ptSeg1.position.set(0.04, 1.52, -0.22);
      ptSeg1.rotation.x = 0.35;
      ptSeg1.rotation.z = -0.04;
      ptSeg1.scale.set(0.82, 1.0, 0.72);
      group.add(ptSeg1);

      // Segment 2 — slightly thinner
      const ptSeg2 = new THREE.Mesh(new THREE.CapsuleGeometry(0.036, 0.22, 8, 14), ponytailSheenMat);
      ptSeg2.position.set(0.08, 1.32, -0.2);
      ptSeg2.rotation.x = 0.15;
      ptSeg2.rotation.z = -0.06;
      ptSeg2.scale.set(0.78, 1.0, 0.68);
      group.add(ptSeg2);

      // Segment 3 — thinner still
      const ptSeg3 = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.2, 8, 12), ponytailSheenMat);
      ptSeg3.position.set(0.12, 1.14, -0.14);
      ptSeg3.rotation.x = -0.12;
      ptSeg3.rotation.z = -0.04;
      ptSeg3.scale.set(0.76, 1.0, 0.66);
      group.add(ptSeg3);

      // Segment 4 — tip, thinnest
      const ptSeg4 = new THREE.Mesh(new THREE.CapsuleGeometry(0.022, 0.18, 8, 10), ponytailSheenMat);
      ptSeg4.position.set(0.15, 0.97, -0.08);
      ptSeg4.rotation.x = -0.28;
      ptSeg4.rotation.z = -0.03;
      ptSeg4.scale.set(0.74, 1.0, 0.62);
      group.add(ptSeg4);
    } else {
      const ponytail = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.62, 6, 12), hairMat);
      ponytail.position.set(0.092, 1.24, -0.24);
      ponytail.rotation.z = -0.18;
      ponytail.rotation.x = 0.1;
      ponytail.scale.set(0.86, 1.24, 0.8);
      group.add(ponytail);

      const ponytailTail = new THREE.Mesh(new THREE.CapsuleGeometry(0.036, 0.42, 6, 10), hairMat);
      ponytailTail.position.set(0.14, 0.92, -0.16);
      ponytailTail.rotation.z = -0.22;
      ponytailTail.rotation.x = -0.04;
      ponytailTail.scale.set(0.84, 1.28, 0.82);
      group.add(ponytailTail);
    }
  }

  if (!spec.female) {
    // Senior's collared shirt — casual university style (2005)
    const shirtPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, 0.52, 0.03),
      new THREE.MeshPhysicalMaterial({ color: "#5f7893", roughness: 0.42, metalness: 0.03, clearcoat: 0.12, clearcoatRoughness: 0.28, transparent: true, opacity: 0.94 })
    );
    shirtPanel.position.set(0, 1.08, 0.19);
    group.add(shirtPanel);

    // Shirt body overlay — adds thickness and shape
    const shirtBody = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.162, 0.52, 8, 16),
      new THREE.MeshPhysicalMaterial({ color: "#eef2f7", roughness: 0.38, metalness: 0.02, clearcoat: 0.1, clearcoatRoughness: 0.22 })
    );
    shirtBody.position.set(0, 1.06, 0.02);
    shirtBody.scale.set(1.08, 0.94, 0.88);
    group.add(shirtBody);

    const shirtCollar = new THREE.Mesh(
      new THREE.TorusGeometry(0.092, 0.016, 8, 20, Math.PI),
      new THREE.MeshPhysicalMaterial({ color: "#e4ebf2", roughness: 0.44, metalness: 0.02, clearcoat: 0.12, clearcoatRoughness: 0.18 })
    );
    shirtCollar.position.set(0, 1.2, 0.08);
    shirtCollar.rotation.x = Math.PI * 0.54;
    group.add(shirtCollar);

    // Collar flaps (folded collar detail)
    const collarFlapGeo = new THREE.BoxGeometry(0.06, 0.04, 0.03);
    const collarFlapMat = new THREE.MeshPhysicalMaterial({ color: "#e8edf4", roughness: 0.42, metalness: 0.02, clearcoat: 0.1 });
    const collarFlapL = new THREE.Mesh(collarFlapGeo, collarFlapMat);
    collarFlapL.position.set(-0.06, 1.22, 0.12);
    collarFlapL.rotation.z = -0.3;
    collarFlapL.rotation.x = -0.2;
    const collarFlapR = collarFlapL.clone();
    collarFlapR.position.x = 0.06;
    collarFlapR.rotation.z = 0.3;
    group.add(collarFlapL, collarFlapR);

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
  const clampedStride = Math.max(-1, Math.min(1, stride));
  const absStride = Math.abs(clampedStride);
  const stridePhase = Math.asin(clampedStride);

  // Leg swing — larger amplitude for natural, full-stride look
  const legAmp = pose.female ? 0.58 : 0.48;
  // Arm counter-swing — delayed quarter-cycle for realism
  const armDelay = Math.sin(stridePhase - 0.22);
  const armAmp = pose.hasPhone ? 0.14 : 0.42;

  // Leg swing with knee bend on trailing leg
  pose.leftLeg.rotation.x = clampedStride * legAmp;
  pose.rightLeg.rotation.x = -clampedStride * legAmp;
  // Bent knee when leg is behind (trailing) — simulates push-off
  const kneeL = Math.max(0, clampedStride) * 0.08;
  const kneeR = Math.max(0, -clampedStride) * 0.08;
  pose.leftLeg.rotation.z = 0.02 + kneeL;
  pose.rightLeg.rotation.z = -0.02 - kneeR;

  // Arm swing with natural wrist follow-through
  pose.leftArm.rotation.x = -armDelay * armAmp;
  pose.rightArm.rotation.x = pose.hasPhone ? -0.56 + clampedStride * 0.06 : armDelay * armAmp;
  // Elbows bend slightly on backward swing
  pose.leftArm.rotation.z = (pose.female ? 0.12 : 0.15) + Math.max(0, armDelay) * 0.06;
  pose.rightArm.rotation.z = -(pose.female ? 0.12 : 0.15) - Math.max(0, -armDelay) * 0.06;
  // Hand follow-through
  pose.leftHand.rotation.x = armDelay * 0.12;
  pose.rightHand.rotation.x = pose.hasPhone ? 0 : -armDelay * 0.12;

  // Body rotation and sway — torso counter-rotates to hips for realism
  pose.torso.rotation.z = -clampedStride * 0.04 * sway;
  pose.torso.rotation.x = absStride * 0.028;
  pose.torso.rotation.y = clampedStride * 0.07 * sway;
  // Waist/hip rotation — pelvis leads the walk cycle
  pose.waist.rotation.z = clampedStride * 0.07 * sway;
  pose.waist.rotation.y = -clampedStride * 0.06 * sway;
  // Hip drop on swing leg side (Trendelenburg-like natural gait)
  pose.waist.rotation.x = absStride * 0.02;

  // Chest follows hips in opposite rotation
  pose.chest.rotation.y = -clampedStride * 0.09 * sway;
  // Head stays level — vestibular reflex keeps gaze steady
  pose.head.rotation.z = clampedStride * 0.022 * sway;
  pose.head.rotation.y = clampedStride * 0.035 * sway;
  // Slight forward lean of head when walking
  pose.head.rotation.x = absStride * 0.012;

  // Shoulder roll — natural arm-shoulder coupling
  pose.shoulderL.rotation.z = -clampedStride * 0.07;
  pose.shoulderR.rotation.z = clampedStride * 0.07;
  // Shoulders also rise/fall slightly with arm swing
  pose.shoulderL.rotation.x = armDelay * 0.03;
  pose.shoulderR.rotation.x = -armDelay * 0.03;

  // Hair sway for female characters
  if (pose.female) {
    pose.hairBack.rotation.z = clampedStride * 0.04;
    pose.hairBack.rotation.x = absStride * 0.02;
    pose.fringe.rotation.z = -clampedStride * 0.015;
  }

  // Realistic vertical bob: double-sine pattern — body rises on push-off, dips at mid-stance
  const pushOff = Math.abs(Math.cos(stridePhase));
  const bob = pushOff * 0.026 + absStride * 0.016;
  // Lateral weight shift toward stance leg
  const lateral = clampedStride * 0.014 * sway;
  person.position.y = bob;
  person.position.x += lateral;
}

function applyIdlePose(person, time, emphasis = 1) {
  const pose = person.userData.pose;
  if (!pose) {
    return;
  }
  // Natural breathing — inhale raises chest, exhale drops it
  const breathe = Math.sin(time * 1.4) * 0.022 * emphasis;
  const breathe2 = Math.sin(time * 1.4 + 0.3) * 0.014 * emphasis;
  pose.torso.rotation.x = breathe;
  pose.chest.rotation.x = breathe * 0.8 + breathe2 * 0.4;
  pose.waist.rotation.x = breathe * 0.18;

  // Subtle weight shift — body sways gently side to side
  const weightShift = Math.sin(time * 0.42) * 0.008 * emphasis;
  pose.waist.rotation.z = weightShift;
  pose.torso.rotation.z = -weightShift * 0.5;

  // Head micro-movements — looking around naturally
  pose.head.rotation.y = Math.sin(time * 0.7) * 0.048 * emphasis + Math.sin(time * 1.9) * 0.008 * emphasis;
  pose.head.rotation.x = Math.sin(time * 0.9) * 0.014 * emphasis;
  pose.head.rotation.z = Math.sin(time * 0.55) * 0.006 * emphasis;

  // Hair sway — responds to breathing and head movement
  pose.hairBack.rotation.z = Math.sin(time * 1.1) * 0.026 * emphasis;
  pose.hairBack.rotation.x = Math.sin(time * 0.8) * 0.01 * emphasis;
  if (pose.female) {
    pose.fringe.rotation.z = Math.sin(time * 1.3 + 0.4) * 0.008 * emphasis;
  }

  // Shoulders rise/fall with breath
  pose.shoulderL.rotation.z = Math.sin(time * 1.4 + 0.5) * 0.01 * emphasis;
  pose.shoulderR.rotation.z = -Math.sin(time * 1.4 + 0.5) * 0.01 * emphasis;
  // Arms have micro-sway
  pose.leftArm.rotation.x = Math.sin(time * 0.6) * 0.01 * emphasis;
  pose.rightArm.rotation.x = pose.hasPhone ? -0.56 : Math.sin(time * 0.6 + 0.4) * 0.01 * emphasis;

  // Gentle body rise with breathing
  person.position.y = Math.abs(Math.sin(time * 1.4)) * 0.012 * emphasis;
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

function createTree({ scale: treeScale = 1, colorVariant = 0 }) {
  const group = new THREE.Group();

  // Trunk with natural taper and bark texture
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07 * treeScale, 0.22 * treeScale, 2.4 * treeScale, 14),
    new THREE.MeshStandardMaterial({ color: "#5e3f28", roughness: 0.94, metalness: 0.02 })
  );
  trunk.position.y = 1.2 * treeScale;
  group.add(trunk);

  // Bark highlight strip
  const trunkHighlight = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05 * treeScale, 0.08 * treeScale, 1.9 * treeScale, 10),
    new THREE.MeshStandardMaterial({ color: "#7a5638", roughness: 0.84, metalness: 0.02, transparent: true, opacity: 0.32 })
  );
  trunkHighlight.position.set(-0.02 * treeScale, 1.24 * treeScale, 0.08 * treeScale);
  group.add(trunkHighlight);

  // Low branches for realism
  const branchMat = new THREE.MeshStandardMaterial({ color: "#5e3f28", roughness: 0.92, metalness: 0.02 });
  const branch1 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02 * treeScale, 0.04 * treeScale, 0.8 * treeScale, 6),
    branchMat
  );
  branch1.position.set(0.2 * treeScale, 1.9 * treeScale, 0.1 * treeScale);
  branch1.rotation.z = -0.7;
  group.add(branch1);

  const branch2 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018 * treeScale, 0.035 * treeScale, 0.7 * treeScale, 6),
    branchMat
  );
  branch2.position.set(-0.18 * treeScale, 2.1 * treeScale, -0.12 * treeScale);
  branch2.rotation.z = 0.65;
  group.add(branch2);

  // Color variants for natural variation between trees
  const leafColors = ["#4a7040", "#567a48", "#628c4e", "#3e6338", "#5a8244"];
  const baseColor = leafColors[colorVariant % leafColors.length];
  const r = parseInt(baseColor.slice(1, 3), 16);
  const g = parseInt(baseColor.slice(3, 5), 16);
  const b = parseInt(baseColor.slice(5, 7), 16);
  const lighterColor = `#${Math.min(255, r + 22).toString(16).padStart(2, "0")}${Math.min(255, g + 18).toString(16).padStart(2, "0")}${Math.min(255, b + 14).toString(16).padStart(2, "0")}`;
  const darkerColor = `#${Math.max(0, r - 16).toString(16).padStart(2, "0")}${Math.max(0, g - 12).toString(16).padStart(2, "0")}${Math.max(0, b - 10).toString(16).padStart(2, "0")}`;

  const leafMatBase = new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.94, metalness: 0.01 });
  const leafMatLight = new THREE.MeshStandardMaterial({ color: lighterColor, roughness: 0.92, metalness: 0.01 });
  const leafMatDark = new THREE.MeshStandardMaterial({ color: darkerColor, roughness: 0.96, metalness: 0.01 });
  const leafMats = [leafMatBase, leafMatLight, leafMatDark];

  // Multiple overlapping sphere clusters for organic canopy shape
  [
    // Main canopy mass
    [0, 2.9, 0, 1.1, 1.24, 1.0, 0],
    [-0.38, 2.5, 0.2, 0.9, 0.96, 0.78, 1],
    [0.44, 2.56, -0.16, 0.94, 1.06, 0.82, 2],
    // Upper crown
    [0.06, 3.42, -0.14, 0.86, 0.88, 0.76, 1],
    [-0.2, 3.16, -0.28, 0.72, 0.76, 0.66, 0],
    [0.28, 3.1, 0.3, 0.7, 0.74, 0.64, 2],
    // Side extensions
    [-0.56, 2.76, -0.2, 0.8, 0.84, 0.7, 2],
    [0.6, 2.82, 0.16, 0.76, 0.82, 0.68, 1],
    // Fill clusters for density
    [-0.14, 2.68, 0.36, 0.68, 0.72, 0.6, 0],
    [0.32, 2.44, -0.34, 0.64, 0.68, 0.58, 2],
    [-0.42, 3.06, 0.12, 0.6, 0.64, 0.56, 1],
    [0.12, 3.56, 0.08, 0.58, 0.6, 0.52, 0],
  ].forEach(([x, y, z, sx, sy, sz, matIdx]) => {
    const cluster = new THREE.Mesh(new THREE.SphereGeometry(0.52 * treeScale, 18, 18), leafMats[matIdx]);
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

  const ambient = new THREE.AmbientLight(0xfff4e0, 0.38);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xffd9a0, 2.48);
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

  const classroomAccent = new THREE.PointLight(0xffd9ab, 2.2, 46, 2);
  classroomAccent.position.set(classroomMaxX - 1.46, 2.78, scaled(WORLD.classroom.lightWellZ + 64));
  scene.add(classroomAccent);

  const backdoorAccent = new THREE.PointLight(0xffefcf, 1.9, 36, 2);
  backdoorAccent.position.set(classroomMinX + 1.56, 2.44, scaled(WORLD.backDoor.center.z + 28));
  scene.add(backdoorAccent);

  const windowBounce = new THREE.PointLight(0xffeacc, 0.9, 28, 2);
  windowBounce.position.set(classroomMaxX - 3.8, 0.22, scaled(WORLD.classroom.lightWellZ));
  scene.add(windowBounce);

  // Extra lights for new end-wall glass windows (z1 back and z2 front)
  const backEndWindowLight = new THREE.PointLight(0xfff4e0, 1.8, 38, 2);
  backEndWindowLight.position.set((classroomMinX + classroomMaxX) / 2, 1.82, lm402Z1 + 1.6);
  scene.add(backEndWindowLight);

  const frontEndWindowLight = new THREE.PointLight(0xfffaeb, 1.6, 34, 2);
  frontEndWindowLight.position.set((classroomMinX + classroomMaxX) / 2, 1.82, lm402Z2 - 1.6);
  scene.add(frontEndWindowLight);

  const midClassLight = new THREE.PointLight(0xffecc4, 1.1, 32, 2);
  midClassLight.position.set((classroomMinX + classroomMaxX) / 2, 2.6, (lm402Z1 + lm402Z2) / 2);
  scene.add(midClassLight);

  const corridorBounce = new THREE.PointLight(0xf0e8dd, 0.48, 22, 2);
  corridorBounce.position.set(corridorCenterX, 0.18, scaled(WORLD.frontDoor.center.z - 60));
  scene.add(corridorBounce);

  // Rim light — subtle back-light behind classroom for character rim lighting during ending
  const rimLight = new THREE.PointLight(0xffeedd, 0.8, 12, 2);
  rimLight.position.set(scaled(200), 2.8, scaled(WORLD.backDoor.center.z + 100));
  scene.add(rimLight);

  const classroomFloorTex = makeWoodTexture({ base: "#856549", dark: "#5c422d", highlight: "#b18a63" });
  const corridorFloorTex = makeTileTexture({ base: "#bcc5d0", line: "rgba(244,246,249,.76)", speck: "rgba(124,136,148," });
  const wallTex = makeConcreteTexture({ base: "#e8e1d7", accent: "rgba(255,255,255,.12)", line: "rgba(174,162,145,.22)", warm: true });
  const corridorWallTex = makeConcreteTexture({ base: "#cbd4dd", accent: "rgba(255,255,255,.12)", line: "rgba(132,145,160,.22)" });
  const stoneTex = makeConcreteTexture({ base: "#ddd7cf", accent: "rgba(255,255,255,.12)", line: "rgba(126,118,104,.2)", warm: true });
  const woodTex = makeWoodTexture({ base: "#8f663f", dark: "#57381f", highlight: "#b08556" });
  const boardTex = makeBoardTexture();
  const lawnTex = makeConcreteTexture({ base: "#6e8d5a", accent: "rgba(255,255,255,.02)", line: "rgba(84,112,70,.16)", warm: true });
  const plazaTex = makeTileTexture({ base: "#cbd1d7", line: "rgba(244,246,249,.72)", speck: "rgba(124,136,148," });

  const classroomFloorMat = new THREE.MeshStandardMaterial({ color: "#9a7252", map: classroomFloorTex, roughness: 0.78, metalness: 0.04 });
  const corridorFloorMat = new THREE.MeshStandardMaterial({ color: "#c2c9d2", map: corridorFloorTex, roughness: 0.82, metalness: 0.03 });
  const wallMat = new THREE.MeshStandardMaterial({ color: "#f2f0ec", map: wallTex, roughness: 0.88, metalness: 0.01 });
  const corridorWallMat = new THREE.MeshStandardMaterial({ color: "#f0eeea", map: corridorWallTex, roughness: 0.86, metalness: 0.02 });
  const woodMat = new THREE.MeshStandardMaterial({ color: "#a07248", map: woodTex, roughness: 0.72, metalness: 0.06 });
  const metalMat = new THREE.MeshStandardMaterial({ color: "#8a9098", roughness: 0.48, metalness: 0.44 });
  const boardMat = new THREE.MeshStandardMaterial({ color: "#1e3b30", map: boardTex, roughness: 0.82, metalness: 0.03 });
  const stoneMat = new THREE.MeshStandardMaterial({ color: "#e2dcd2", map: stoneTex, roughness: 0.88, metalness: 0.03 });
  const beamMat = new THREE.MeshStandardMaterial({ color: "#f5ede0", map: wallTex, roughness: 0.84, metalness: 0.02 });
  const lawnMat = new THREE.MeshStandardMaterial({ color: "#7a9a64", map: lawnTex, roughness: 0.96, metalness: 0.01 });
  const plazaMat = new THREE.MeshStandardMaterial({ color: "#cdd3d9", map: plazaTex, roughness: 0.90, metalness: 0.02 });


  const campusDepth = scaled(WORLD.corridor.campusDepth);

  // Campus ground — 4 stories below the 4th floor corridor (~12 m down)
  const campusGroundY = FLOOR_Y - 12;

  // Building facade below corridor (floors 1–3, visible below parapet)
  const facadeHeight = 9; // 3 floors × 3m each
  const facadeMat = new THREE.MeshStandardMaterial({ color: '#d4cfc6', roughness: 0.85, metalness: 0.02 });
  const facade = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, facadeHeight, floorLength),
    facadeMat
  );
  facade.position.set(minX - 0.08, FLOOR_Y - facadeHeight / 2, floorCenterZ);
  worldGroup.add(facade);

  // Window rows on the facade (3 floors below corridor)
  const windowMat = new THREE.MeshStandardMaterial({
    color: '#8ab4d6',
    emissive: '#4a6a8a',
    emissiveIntensity: 0.15,
    roughness: 0.3,
  });
  for (let floor = 0; floor < 3; floor++) {
    const floorY = FLOOR_Y - (floor + 1) * 3 + 1.5;
    for (let i = 0; i < 12; i++) {
      const winZ = minZ + (i + 0.5) * (floorLength / 12);
      const win = new THREE.Mesh(
        new THREE.PlaneGeometry(1.2, 1.5),
        windowMat
      );
      win.position.set(minX - 0.16, floorY, winZ);
      win.rotation.y = -Math.PI / 2;
      worldGroup.add(win);
    }
  }

  // Plaza strip at ground level below the building
  const groundPlaza = new THREE.Mesh(
    new THREE.BoxGeometry(campusDepth * 0.44, 0.06, floorLength * 0.92),
    plazaMat
  );
  groundPlaza.position.set(minX - campusDepth * 0.26, campusGroundY + 0.03, floorCenterZ + 0.26);
  groundPlaza.receiveShadow = true;
  worldGroup.add(groundPlaza);

  // Sun glow — keep but shift slightly
  const sunGlow = createGlowPlane("rgba(255,233,192,1)", 9.6, 6.2, 0.34);
  sunGlow.position.set(minX - campusDepth * 0.5, 4.2, scaled(720));
  sunGlow.rotation.y = Math.PI / 2;
  worldGroup.add(sunGlow);

  const canopyGlow = createGlowPlane("rgba(255,240,210,1)", 8.4, 4.8, 0.18);
  canopyGlow.position.set(minX - campusDepth * 0.5, -4, scaled(1740));
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
    new THREE.MeshStandardMaterial({ color: "#a8a29e", map: stoneTex, roughness: 0.92, metalness: 0.02 }),
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

    // Air wall — invisible full-width barrier blocking player from going down stairs
    addCollider(
      colliders,
      corridorMinX,
      classroomMinX,
      zone.direction > 0 ? zone.z2 - 0.06 : zone.z1 + 0.06,
      zone.direction > 0 ? zone.z2 + 0.06 : zone.z1 - 0.06,
      `${zone.id}_airwall`
    );

    // ── Stairs going DOWN (floors 3F, 2F, 1F below current 4F) ──
    for (let floor = 1; floor <= 3; floor++) {
      const floorBaseY = FLOOR_Y - floor * (stepH * stairCount + 0.06);
      // Landing for this floor level
      const downLanding = new THREE.Mesh(
        new THREE.BoxGeometry(corridorWidth - 0.28, 0.06, zoneLen * 0.4),
        stairRiserMat
      );
      downLanding.position.set(corridorCenterX, floorBaseY, zoneCenter);
      downLanding.receiveShadow = true;
      worldGroup.add(downLanding);

      // Steps going down from landing
      for (let si = 0; si < stairCount; si++) {
        const sz = zone.direction > 0
          ? THREE.MathUtils.lerp(zone.z1 + 0.12, zone.z2 - 0.24, si / stairCount)
          : THREE.MathUtils.lerp(zone.z2 - 0.12, zone.z1 + 0.24, si / stairCount);
        const sy = floorBaseY - stepH * 0.5 - si * stepH;
        const downTread = new THREE.Mesh(
          new THREE.BoxGeometry(stepW, 0.04, stepD + 0.02),
          stairWoodMat
        );
        downTread.position.set(corridorCenterX, sy, sz + zone.direction * stepD * 0.5);
        downTread.receiveShadow = true;
        worldGroup.add(downTread);
        const downRiser = new THREE.Mesh(
          new THREE.BoxGeometry(stepW, stepH, 0.02),
          stairRiserMat
        );
        downRiser.position.set(corridorCenterX, sy - stepH * 0.5, sz + zone.direction * 0.01);
        worldGroup.add(downRiser);
      }

      // Side wall for this floor section
      const downWall = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, stepH * stairCount + 0.1, zoneLen),
        corridorWallMat
      );
      downWall.position.set(classroomMinX, floorBaseY - (stepH * stairCount) / 2, zoneCenter);
      worldGroup.add(downWall);
    }

    // ── Stairs going UP to 5F ──
    const upBaseY = FLOOR_Y + 0.06;
    for (let si = 0; si < stairCount; si++) {
      const sz = zone.direction > 0
        ? THREE.MathUtils.lerp(zone.z2 - 0.24, zone.z1 + 0.12, si / stairCount)
        : THREE.MathUtils.lerp(zone.z1 + 0.24, zone.z2 - 0.12, si / stairCount);
      const sy = upBaseY + stepH * 0.5 + si * stepH;
      const upTread = new THREE.Mesh(
        new THREE.BoxGeometry(stepW, 0.04, stepD + 0.02),
        stairWoodMat
      );
      upTread.position.set(corridorCenterX, sy, sz - zone.direction * stepD * 0.5);
      upTread.receiveShadow = true;
      worldGroup.add(upTread);
      const upRiser = new THREE.Mesh(
        new THREE.BoxGeometry(stepW, stepH, 0.02),
        stairRiserMat
      );
      upRiser.position.set(corridorCenterX, sy - stepH * 0.5, sz - zone.direction * 0.01);
      worldGroup.add(upRiser);
    }

    // Floor number labels on stair walls
    const floorLabels = [
      { text: "3F", y: FLOOR_Y - 1 * (stepH * stairCount + 0.06) + 0.6 },
      { text: "5F", y: FLOOR_Y + stepH * stairCount + 0.3 },
    ];
    floorLabels.forEach((fl) => {
      const labelPlane = buildTextPlane(fl.text, 0.5, 0.2, { bg: "#5c6672", fg: "#f7f0de" });
      labelPlane.position.set(classroomMinX - 0.01, fl.y, zoneCenter);
      labelPlane.rotation.y = Math.PI / 2;
      worldGroup.add(labelPlane);
    });
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

  // ── Shared window geometry constants ──
  const winY1 = scaled(84);
  const winY2 = scaled(256);
  const winH = winY2 - winY1;
  const winCY = (winY1 + winY2) / 2;
  const pillarW = 0.10;



  // ── Helper: solid strip above/below window zone ──
  const addEndStrip = (x, y, wz, w, h) => {
    const s = new THREE.Mesh(new THREE.BoxGeometry(w, h, wallThickness), wallMat);
    s.position.set(x, y, wz);
    s.castShadow = true; s.receiveShadow = true;
    worldGroup.add(s);
  };

  // ── Helper: build window row on an end wall ──
  const buildEndWallWindows = (wallZ, inward, fromX, toX, nWin) => {
    const totalW = toX - fromX;
    const ww = (totalW - pillarW * (nWin + 1)) / nWin;
    for (let i = 0; i < nWin; i++) {
      const wx = fromX + pillarW + (ww + pillarW) * i + ww / 2;

      addEndStrip(wx, winY2 + (corridorHeight - winY2) / 2, wallZ, ww + 0.02, corridorHeight - winY2 + 0.02);
      addEndStrip(wx, winY1 / 2, wallZ, ww + 0.02, winY1 + 0.01);
    }
    for (let i = 0; i <= nWin; i++) {
      const px = fromX + pillarW / 2 + (ww + pillarW) * i;
      const p = new THREE.Mesh(new THREE.BoxGeometry(pillarW, corridorHeight, wallThickness), wallMat);
      p.position.set(px, corridorHeight / 2, wallZ);
      worldGroup.add(p);
    }
    addCollider(colliders, fromX, toX, wallZ - wallThickness / 2, wallZ + wallThickness / 2, "end_wall");
  };

  // ═══ BACK END WALL (z1) — 4 windows ═══
  buildEndWallWindows(z1, 1, classroomMinX, classroomMaxX, 4);

  // ═══ FRONT END WALL (z2) — board center + 2 windows each side ═══
  if (boardX1 - classroomMinX > 0.6) {
    buildEndWallWindows(z2, -1, classroomMinX, boardX1 - 0.06, 2);
  }
  if (classroomMaxX - boardX2 > 0.6) {
    buildEndWallWindows(z2, -1, boardX2 + 0.06, classroomMaxX, 2);
  }

  // ═══ SIDE WALLS — with door openings + windows ═══
  const leftWindowOpenings = WORLD.leftWallWindows.map((panel) => openingFromPanel(panel, "left"));
  const rightWindowOpenings = WORLD.rightWallWindows.map((panel) => openingFromPanel(panel, "right"));
  const doorOpenings = openings.map((door) => ({
    z1: door.z1 - 0.50, z2: door.z2 + 0.50, y1: 0, y2: corridorHeight,
  }));

  buildWallWithOpenings({
    x: classroomMaxX, zStart: z1, zEnd: z2,
    openings: rightWindowOpenings, material: wallMat, label: "right_wall",
  });

  const dividerSegments = [];
  if (minZ < z1) dividerSegments.push([minZ, z1]);
  if (z2 < maxZ) dividerSegments.push([z2, maxZ]);
  dividerSegments.forEach(([start, end]) => {
    if (end <= start) return;
    addBox(worldGroup, occluders,
      new THREE.BoxGeometry(wallThickness, corridorHeight, end - start),
      corridorWallMat,
      new THREE.Vector3(classroomMinX, corridorHeight / 2, start + (end - start) / 2),
      null, colliders,
      { minX: classroomMinX - wallThickness / 2, maxX: classroomMinX + wallThickness / 2, minZ: start, maxZ: end, label: "divider_wall" }
    );
  });

  buildWallWithOpenings({
    x: classroomMinX, zStart: z1, zEnd: z2,
    openings: [...doorOpenings, ...leftWindowOpenings],
    material: corridorWallMat, label: "divider_wall",
  });




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

  // Wall labels removed (LM401/LM403/LM404 plaques and wall labels)
  // Only the LM402 plaque (interactive element) is kept above

  // ═══ TRANSPARENT GLASS WINDOWS ═══
  // Glass material — physically-based transparent glass that lets sunlight through
  // and allows the senior to see the junior from the corridor
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: "#e8f0f8",
    roughness: 0.05,
    metalness: 0.0,
    transmission: 0.92,
    thickness: 0.06,
    transparent: true,
    opacity: 0.18,
    ior: 1.5,
    clearcoat: 1.0,
    clearcoatRoughness: 0.02,
    envMapIntensity: 0.3,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const glassFrameMat = new THREE.MeshStandardMaterial({
    color: "#c8bfaf", roughness: 0.56, metalness: 0.12,
  });

  // Left wall windows (corridor-to-classroom — senior sees junior through these)
  WORLD.leftWallWindows.forEach((panel) => {
    const opening = openingFromPanel(panel, "left");
    const ow = opening.z2 - opening.z1;
    const oh = opening.y2 - opening.y1;
    const ocz = (opening.z1 + opening.z2) / 2;
    const ocy = (opening.y1 + opening.y2) / 2;
    // Glass pane
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(ow - 0.04, oh - 0.04), glassMat);
    pane.position.set(classroomMinX, ocy, ocz);
    pane.rotation.y = Math.PI / 2;
    worldGroup.add(pane);
    // Window frame (thin border around the opening)
    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, ow + 0.02), glassFrameMat);
    frameTop.position.set(classroomMinX, opening.y2 + 0.01, ocz);
    const frameBot = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, ow + 0.02), glassFrameMat);
    frameBot.position.set(classroomMinX, opening.y1 - 0.02, ocz);
    const frameSideL = new THREE.Mesh(new THREE.BoxGeometry(0.04, oh + 0.06, 0.03), glassFrameMat);
    frameSideL.position.set(classroomMinX, ocy, opening.z1 - 0.01);
    const frameSideR = frameSideL.clone();
    frameSideR.position.z = opening.z2 + 0.01;
    // Cross-bar (horizontal divider halfway up the window)
    const crossBar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.025, ow - 0.02), glassFrameMat);
    crossBar.position.set(classroomMinX, ocy, ocz);
    worldGroup.add(frameTop, frameBot, frameSideL, frameSideR, crossBar);
  });

  // Right wall windows (exterior — sunlight comes through these)
  WORLD.rightWallWindows.forEach((panel) => {
    const opening = openingFromPanel(panel, "right");
    const ow = opening.z2 - opening.z1;
    const oh = opening.y2 - opening.y1;
    const ocz = (opening.z1 + opening.z2) / 2;
    const ocy = (opening.y1 + opening.y2) / 2;
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(ow - 0.04, oh - 0.04), glassMat);
    pane.position.set(classroomMaxX, ocy, ocz);
    pane.rotation.y = Math.PI / 2;
    worldGroup.add(pane);
    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, ow + 0.02), glassFrameMat);
    frameTop.position.set(classroomMaxX, opening.y2 + 0.01, ocz);
    const frameBot = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, ow + 0.02), glassFrameMat);
    frameBot.position.set(classroomMaxX, opening.y1 - 0.02, ocz);
    const frameSideL = new THREE.Mesh(new THREE.BoxGeometry(0.04, oh + 0.06, 0.03), glassFrameMat);
    frameSideL.position.set(classroomMaxX, ocy, opening.z1 - 0.01);
    const frameSideR = frameSideL.clone();
    frameSideR.position.z = opening.z2 + 0.01;
    const crossBar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.025, ow - 0.02), glassFrameMat);
    crossBar.position.set(classroomMaxX, ocy, ocz);
    worldGroup.add(frameTop, frameBot, frameSideL, frameSideR, crossBar);
  });

  // End wall window glass (back z1 and front z2 — built by buildEndWallWindows)
  const addEndWallGlass = (wallZ, fromX, toX, nWin) => {
    const totalW = toX - fromX;
    const ww = (totalW - pillarW * (nWin + 1)) / nWin;
    for (let i = 0; i < nWin; i++) {
      const wx = fromX + pillarW + (ww + pillarW) * i + ww / 2;
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(ww - 0.04, winH - 0.04), glassMat);
      pane.position.set(wx, winCY, wallZ);
      worldGroup.add(pane);
      // Frame
      const fTop = new THREE.Mesh(new THREE.BoxGeometry(ww + 0.02, 0.03, 0.04), glassFrameMat);
      fTop.position.set(wx, winY2 + 0.01, wallZ);
      const fBot = new THREE.Mesh(new THREE.BoxGeometry(ww + 0.02, 0.05, 0.04), glassFrameMat);
      fBot.position.set(wx, winY1 - 0.02, wallZ);
      worldGroup.add(fTop, fBot);
    }
  };
  addEndWallGlass(z1, classroomMinX, classroomMaxX, 4);
  if (boardX1 - classroomMinX > 0.6) {
    addEndWallGlass(z2, classroomMinX, boardX1 - 0.06, 2);
  }
  if (classroomMaxX - boardX2 > 0.6) {
    addEndWallGlass(z2, boardX2 + 0.06, classroomMaxX, 2);
  }

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
      opacity: beam.alpha * 1.25,
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

  const corridorSunPatch = createGlowPlane("rgba(255,228,168,1)", 9.2, 4.4, 0.56);
  corridorSunPatch.position.set(minX + 1.96, 0.018, scaled(WORLD.frontDoor.center.z - 28));
  corridorSunPatch.rotation.x = -Math.PI / 2;
  corridorSunPatch.rotation.z = 0.12;
  worldGroup.add(corridorSunPatch);

  const parapetSunPatch = createGlowPlane("rgba(255,236,195,1)", 9.6, 4.8, 0.48);
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

  const classroomSunPatch = createGlowPlane("rgba(255,220,162,1)", 9.4, 4.0, 0.48);
  classroomSunPatch.position.set(classroomMaxX - 3.18, 0.019, scaled(WORLD.classroom.lightWellZ + 84));
  classroomSunPatch.rotation.x = -Math.PI / 2;
  classroomSunPatch.rotation.z = -0.16;
  worldGroup.add(classroomSunPatch);

  const leftClassroomSunPatch = createGlowPlane("rgba(255,232,186,1)", 7.0, 3.4, 0.32);
  leftClassroomSunPatch.position.set(classroomMinX + 2.16, 0.018, scaled(WORLD.classroom.lightWellZ - 104));
  leftClassroomSunPatch.rotation.x = -Math.PI / 2;
  leftClassroomSunPatch.rotation.z = 0.14;
  worldGroup.add(leftClassroomSunPatch);

  const backdoorSunPatch = createGlowPlane("rgba(255,240,198,1)", 3.8, 2.1, 0.22);
  backdoorSunPatch.position.set(classroomMinX + 1.12, 0.018, scaled(WORLD.backDoor.center.z));
  backdoorSunPatch.rotation.x = -Math.PI / 2;
  backdoorSunPatch.rotation.z = 0.08;
  worldGroup.add(backdoorSunPatch);

  const seatSunPatch = createGlowPlane("rgba(255,220,172,1)", 5.2, 2.8, 0.36);
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
    // Trees rooted at ground level, scaled up so canopies reach ~floor 2–3 height
    const treeNode = createTree({ scale: tree.scale * 2.5, colorVariant: index });
    treeNode.position.set(scaled(tree.x), campusGroundY, scaled(tree.z));
    treeNode.rotation.y = index * 0.6;
    setShadow(treeNode, false, true);
    worldGroup.add(treeNode);
  });

  const distantAcademicBlock = new THREE.Mesh(
    new THREE.BoxGeometry(4.8, 6, floorLength * 0.54),
    new THREE.MeshStandardMaterial({ color: "#b7bec7", roughness: 0.95, metalness: 0.02 })
  );
  distantAcademicBlock.position.set(minX - campusDepth * 0.34, campusGroundY + 3, floorCenterZ + 0.2);
  distantAcademicBlock.receiveShadow = true;
  worldGroup.add(distantAcademicBlock);

  // ── Enhanced campus scenery ──

  // Campus ground plane — textured grass with walking paths and garden beds
  const campusGroundCanvas = document.createElement("canvas");
  campusGroundCanvas.width = 512;
  campusGroundCanvas.height = 512;
  const cgCtx = campusGroundCanvas.getContext("2d");
  cgCtx.fillStyle = "#5a7a48";
  cgCtx.fillRect(0, 0, 512, 512);
  // Subtle grass colour variation patches
  for (let gi = 0; gi < 120; gi++) {
    const gx = Math.random() * 512;
    const gy = Math.random() * 512;
    const gr = 8 + Math.random() * 20;
    cgCtx.beginPath();
    cgCtx.arc(gx, gy, gr, 0, Math.PI * 2);
    cgCtx.fillStyle = Math.random() > 0.5 ? "rgba(80,120,60,0.15)" : "rgba(50,90,40,0.12)";
    cgCtx.fill();
  }
  // Walking paths — lighter concrete strips
  cgCtx.fillStyle = "#b8b0a4";
  cgCtx.fillRect(80, 0, 18, 512);
  cgCtx.fillRect(320, 0, 14, 512);
  cgCtx.fillRect(0, 240, 512, 16);
  cgCtx.save();
  cgCtx.translate(256, 256);
  cgCtx.rotate(0.4);
  cgCtx.fillRect(-300, -7, 600, 14);
  cgCtx.restore();
  cgCtx.strokeStyle = "rgba(100,90,78,0.3)";
  cgCtx.lineWidth = 1;
  cgCtx.strokeRect(80, 0, 18, 512);
  cgCtx.strokeRect(320, 0, 14, 512);
  cgCtx.strokeRect(0, 240, 512, 16);
  // Garden / flower bed patches
  const gardenColors = ["rgba(140,80,60,0.25)", "rgba(120,60,80,0.2)", "rgba(90,110,50,0.22)"];
  [[140, 100, 30, 22], [380, 340, 26, 18], [200, 420, 24, 20], [440, 140, 20, 28]].forEach(([fx, fy, fw, fh]) => {
    cgCtx.fillStyle = gardenColors[Math.floor(Math.random() * gardenColors.length)];
    cgCtx.beginPath();
    cgCtx.ellipse(fx, fy, fw, fh, 0, 0, Math.PI * 2);
    cgCtx.fill();
    for (let fi = 0; fi < 6; fi++) {
      cgCtx.beginPath();
      cgCtx.arc(fx + (Math.random() - 0.5) * fw * 1.4, fy + (Math.random() - 0.5) * fh * 1.4, 2 + Math.random() * 2, 0, Math.PI * 2);
      cgCtx.fillStyle = ["rgba(220,60,80,0.5)", "rgba(240,200,60,0.5)", "rgba(220,120,200,0.4)"][fi % 3];
      cgCtx.fill();
    }
  });
  const campusGroundTex = new THREE.CanvasTexture(campusGroundCanvas);
  campusGroundTex.colorSpace = THREE.SRGBColorSpace;
  campusGroundTex.wrapS = THREE.RepeatWrapping;
  campusGroundTex.wrapT = THREE.RepeatWrapping;
  campusGroundTex.repeat.set(3, 3);
  const campusGroundMat = new THREE.MeshStandardMaterial({ color: "#5a7a48", map: campusGroundTex, roughness: 0.92, metalness: 0.01 });
  const campusGround = new THREE.Mesh(
    new THREE.PlaneGeometry(campusDepth * 4, floorLength * 3),
    campusGroundMat
  );
  campusGround.rotation.x = -Math.PI / 2;
  campusGround.position.set(minX - campusDepth * 0.8, campusGroundY, floorCenterZ);
  campusGround.receiveShadow = true;
  worldGroup.add(campusGround);

  // ── Distant campus buildings with window textures ──
  function makeBuildingTexture(wallColor, windowRows, windowCols, texW, texH) {
    const bCanvas = document.createElement("canvas");
    bCanvas.width = texW || 192;
    bCanvas.height = texH || 128;
    const bCtx = bCanvas.getContext("2d");
    bCtx.fillStyle = wallColor;
    bCtx.fillRect(0, 0, bCanvas.width, bCanvas.height);
    for (let wi = 0; wi < 30; wi++) {
      bCtx.fillStyle = `rgba(${128 + Math.random() * 40},${128 + Math.random() * 40},${128 + Math.random() * 40},0.06)`;
      bCtx.fillRect(Math.random() * bCanvas.width, Math.random() * bCanvas.height, 4 + Math.random() * 12, 2 + Math.random() * 6);
    }
    const wMX = bCanvas.width * 0.08;
    const wMY = bCanvas.height * 0.06;
    const wSX = (bCanvas.width - wMX * 2) / windowCols;
    const wSY = (bCanvas.height - wMY * 2) / windowRows;
    const wW = wSX * 0.55;
    const wH = wSY * 0.52;
    for (let wr = 0; wr < windowRows; wr++) {
      for (let wc = 0; wc < windowCols; wc++) {
        const wx = wMX + wc * wSX + (wSX - wW) / 2;
        const wy = wMY + wr * wSY + (wSY - wH) / 2;
        bCtx.fillStyle = "rgba(60,70,80,0.4)";
        bCtx.fillRect(wx - 1, wy - 1, wW + 2, wH + 2);
        const isLit = Math.random() > 0.4;
        bCtx.fillStyle = isLit ? "rgba(180,210,230,0.7)" : "rgba(90,110,130,0.6)";
        bCtx.fillRect(wx, wy, wW, wH);
        if (isLit) {
          bCtx.fillStyle = "rgba(255,255,255,0.15)";
          bCtx.fillRect(wx + 1, wy + 1, wW * 0.3, wH * 0.4);
        }
      }
    }
    const bTex = new THREE.CanvasTexture(bCanvas);
    bTex.colorSpace = THREE.SRGBColorSpace;
    return bTex;
  }

  // 5 buildings — heights relative to 4th-floor eye level (~scaled(320))
  const campusBuildings = [
    { wall: "#c4bfb6", w: 3.6, h: scaled(520), d: 8.4, px: 0.72, pz: 900, wr: 6, wc: 5, roof: "flat" },
    { wall: "#b8c2ca", w: 5.2, h: scaled(440), d: 6.8, px: 0.88, pz: 1800, wr: 5, wc: 7, roof: "ledge" },
    { wall: "#d2ccc4", w: 4.4, h: scaled(280), d: 10.2, px: 0.64, pz: 2700, wr: 3, wc: 6, roof: "flat" },
    { wall: "#c8bfb0", w: 3.0, h: scaled(480), d: 5.6, px: 0.82, pz: 1350, wr: 5, wc: 4, roof: "ledge" },
    { wall: "#d4c8bc", w: 6.0, h: scaled(240), d: 7.4, px: 0.56, pz: 3200, wr: 2, wc: 8, roof: "flat" },
  ];

  campusBuildings.forEach((bDef) => {
    const bTex = makeBuildingTexture(bDef.wall, bDef.wr, bDef.wc, 192, 128);
    // Aerial perspective — blue-tint distant buildings
    const distFactor = bDef.px;
    const bR = parseInt(bDef.wall.slice(1, 3), 16);
    const bG = parseInt(bDef.wall.slice(3, 5), 16);
    const bB = parseInt(bDef.wall.slice(5, 7), 16);
    const hR = Math.round(bR + (0xd4 - bR) * distFactor * 0.3);
    const hG = Math.round(bG + (0xe8 - bG) * distFactor * 0.3);
    const hB = Math.round(bB + (0xf0 - bB) * distFactor * 0.3);
    const hazedColor = `#${hR.toString(16).padStart(2, "0")}${hG.toString(16).padStart(2, "0")}${hB.toString(16).padStart(2, "0")}`;

    const bMat = new THREE.MeshStandardMaterial({ color: hazedColor, map: bTex, roughness: 0.9, metalness: 0.03 });
    const bMesh = new THREE.Mesh(new THREE.BoxGeometry(bDef.w, bDef.h, bDef.d), bMat);
    bMesh.position.set(minX - campusDepth * bDef.px, campusGroundY + bDef.h / 2, scaled(bDef.pz));
    bMesh.receiveShadow = true;
    bMesh.castShadow = true;
    worldGroup.add(bMesh);

    if (bDef.roof === "ledge") {
      const ledge = new THREE.Mesh(
        new THREE.BoxGeometry(bDef.w + 0.2, 0.08, bDef.d + 0.2),
        new THREE.MeshStandardMaterial({ color: "#a0988e", roughness: 0.88, metalness: 0.04 })
      );
      ledge.position.set(minX - campusDepth * bDef.px, campusGroundY + bDef.h + 0.04, scaled(bDef.pz));
      worldGroup.add(ledge);
      const parapet = new THREE.Mesh(
        new THREE.BoxGeometry(bDef.w + 0.16, 0.18, bDef.d + 0.16),
        new THREE.MeshStandardMaterial({ color: "#b8b0a6", roughness: 0.9, metalness: 0.02 })
      );
      parapet.position.set(minX - campusDepth * bDef.px, campusGroundY + bDef.h + 0.12, scaled(bDef.pz));
      worldGroup.add(parapet);
    } else {
      const roofCap = new THREE.Mesh(
        new THREE.BoxGeometry(bDef.w + 0.1, 0.06, bDef.d + 0.1),
        new THREE.MeshStandardMaterial({ color: "#8a8480", roughness: 0.92, metalness: 0.03 })
      );
      roofCap.position.set(minX - campusDepth * bDef.px, campusGroundY + bDef.h + 0.03, scaled(bDef.pz));
      worldGroup.add(roofCap);
    }
  });

  // ── Sky dome with realistic gradient and clouds ──
  const skyDomeGeo = new THREE.SphereGeometry(120, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const skyCanvas = document.createElement("canvas");
  skyCanvas.width = 512;
  skyCanvas.height = 512;
  const skyCtx = skyCanvas.getContext("2d");
  const skyGrad = skyCtx.createLinearGradient(0, 0, 0, 512);
  skyGrad.addColorStop(0, "#4a7ab5");
  skyGrad.addColorStop(0.25, "#6a9ec8");
  skyGrad.addColorStop(0.45, "#87CEEB");
  skyGrad.addColorStop(0.65, "#a8d8f0");
  skyGrad.addColorStop(0.8, "#d4e8f0");
  skyGrad.addColorStop(0.92, "#e8f0f4");
  skyGrad.addColorStop(1.0, "#eef4f7");
  skyCtx.fillStyle = skyGrad;
  skyCtx.fillRect(0, 0, 512, 512);
  // Sun glow — upper-right area
  const sunCX = 380, sunCY = 60;
  const sunGrad2 = skyCtx.createRadialGradient(sunCX, sunCY, 0, sunCX, sunCY, 80);
  sunGrad2.addColorStop(0, "rgba(255,255,240,0.95)");
  sunGrad2.addColorStop(0.1, "rgba(255,250,220,0.8)");
  sunGrad2.addColorStop(0.3, "rgba(255,240,180,0.4)");
  sunGrad2.addColorStop(0.6, "rgba(255,220,150,0.15)");
  sunGrad2.addColorStop(1, "rgba(255,200,120,0)");
  skyCtx.fillStyle = sunGrad2;
  skyCtx.beginPath();
  skyCtx.arc(sunCX, sunCY, 80, 0, Math.PI * 2);
  skyCtx.fill();
  const sunCore = skyCtx.createRadialGradient(sunCX, sunCY, 0, sunCX, sunCY, 18);
  sunCore.addColorStop(0, "rgba(255,255,255,1)");
  sunCore.addColorStop(0.5, "rgba(255,255,240,0.9)");
  sunCore.addColorStop(1, "rgba(255,250,220,0)");
  skyCtx.fillStyle = sunCore;
  skyCtx.beginPath();
  skyCtx.arc(sunCX, sunCY, 18, 0, Math.PI * 2);
  skyCtx.fill();
  // Cloud shapes — soft blurred ellipses
  [
    [120, 100, 50, 18, 0.5], [140, 96, 40, 14, 0.4], [100, 104, 35, 12, 0.35],
    [300, 140, 60, 20, 0.45], [320, 136, 45, 16, 0.4], [280, 145, 38, 14, 0.35],
    [420, 80, 44, 16, 0.42], [440, 76, 36, 14, 0.38],
    [200, 200, 55, 18, 0.3], [220, 196, 42, 14, 0.28],
    [380, 220, 48, 16, 0.32], [60, 180, 40, 14, 0.34],
    [460, 160, 52, 18, 0.36], [470, 156, 38, 12, 0.3],
  ].forEach(([cx, cy, rx, ry, op]) => {
    const cGrad = skyCtx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
    cGrad.addColorStop(0, `rgba(255,255,255,${op})`);
    cGrad.addColorStop(0.5, `rgba(255,255,255,${op * 0.6})`);
    cGrad.addColorStop(1, "rgba(255,255,255,0)");
    skyCtx.fillStyle = cGrad;
    skyCtx.beginPath();
    skyCtx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    skyCtx.fill();
  });
  const skyTexture = new THREE.CanvasTexture(skyCanvas);
  skyTexture.colorSpace = THREE.SRGBColorSpace;
  const skyDomeMat = new THREE.MeshBasicMaterial({
    map: skyTexture,
    side: THREE.BackSide,
    fog: false,
    depthWrite: false,
  });
  const skyDome = new THREE.Mesh(skyDomeGeo, skyDomeMat);
  skyDome.position.set(minX - campusDepth * 0.3, campusGroundY, floorCenterZ);
  worldGroup.add(skyDome);

  // ── Animated cloud planes ──
  const skyBaseX = minX - campusDepth * 0.3;
  const skyBaseZ = floorCenterZ;
  const animatedClouds = [];
  const cloudDefs = [
    { x: -20, y: 38, z: -30, w: 12, h: 4 },
    { x: 15, y: 42, z: -20, w: 10, h: 3 },
    { x: -35, y: 35, z: 10, w: 14, h: 5 },
    { x: 25, y: 40, z: 25, w: 11, h: 3.5 },
    { x: -10, y: 44, z: -40, w: 9, h: 3 },
    { x: 40, y: 36, z: 5, w: 13, h: 4.5 },
  ];
  cloudDefs.forEach((cd) => {
    const cc = document.createElement("canvas");
    cc.width = 256; cc.height = 128;
    const cctx = cc.getContext("2d");
    const cg = cctx.createRadialGradient(128, 64, 10, 128, 64, 100);
    cg.addColorStop(0, "rgba(255,255,255,0.7)");
    cg.addColorStop(0.4, "rgba(255,255,255,0.35)");
    cg.addColorStop(1, "rgba(255,255,255,0)");
    cctx.fillStyle = cg;
    cctx.fillRect(0, 0, 256, 128);
    [[90, 58, 60], [166, 58, 55], [128, 48, 50]].forEach(([px, py, r]) => {
      const pg = cctx.createRadialGradient(px, py, 4, px, py, r);
      pg.addColorStop(0, "rgba(255,255,255,0.5)");
      pg.addColorStop(1, "rgba(255,255,255,0)");
      cctx.fillStyle = pg;
      cctx.beginPath();
      cctx.arc(px, py, r, 0, Math.PI * 2);
      cctx.fill();
    });
    const ctex = new THREE.CanvasTexture(cc);
    ctex.colorSpace = THREE.SRGBColorSpace;
    const cloudMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(cd.w, cd.h),
      new THREE.MeshBasicMaterial({ map: ctex, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide, fog: false })
    );
    cloudMesh.position.set(skyBaseX + cd.x, campusGroundY + cd.y, skyBaseZ + cd.z);
    cloudMesh.rotation.x = -0.15;
    cloudMesh.userData.startX = cloudMesh.position.x;
    cloudMesh.userData.speed = 0.15 + Math.random() * 0.2;
    worldGroup.add(cloudMesh);
    animatedClouds.push(cloudMesh);
  });

  // ── Animated birds (V-shaped) ──
  const animatedBirds = [];
  for (let bi = 0; bi < 4; bi++) {
    const birdGroup = new THREE.Group();
    const wingMat = new THREE.MeshBasicMaterial({ color: "#2a2a2a", side: THREE.DoubleSide, fog: false });
    const wingL = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.08), wingMat);
    wingL.position.set(-0.18, 0, 0); wingL.rotation.z = 0.3;
    const wingR = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.08), wingMat);
    wingR.position.set(0.18, 0, 0); wingR.rotation.z = -0.3;
    birdGroup.add(wingL, wingR);
    birdGroup.position.set(
      skyBaseX - 30 + bi * 18,
      campusGroundY + 32 + bi * 3,
      skyBaseZ - 20 + bi * 12
    );
    birdGroup.userData.startX = birdGroup.position.x;
    birdGroup.userData.startZ = birdGroup.position.z;
    birdGroup.userData.wingL = wingL;
    birdGroup.userData.wingR = wingR;
    birdGroup.userData.speed = 0.6 + Math.random() * 0.4;
    birdGroup.userData.phase = Math.random() * Math.PI * 2;
    worldGroup.add(birdGroup);
    animatedBirds.push(birdGroup);
  }

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

  // ── Classroom ceiling ──
  const ceiling = new THREE.Mesh(
    new THREE.BoxGeometry(roomDepth, 0.08, roomLength),
    new THREE.MeshStandardMaterial({ color: '#f5f3ef', roughness: 0.9 })
  );
  ceiling.position.set((classroomMinX + classroomMaxX) / 2, corridorHeight - 0.04, centerZ);
  ceiling.receiveShadow = true;
  worldGroup.add(ceiling);

  // ── Corridor ceiling ──
  const corridorCeiling = new THREE.Mesh(
    new THREE.BoxGeometry(corridorWidth, 0.08, floorLength),
    new THREE.MeshStandardMaterial({ color: '#f0eeea', roughness: 0.9 })
  );
  corridorCeiling.position.set(corridorCenterX, corridorHeight - 0.04, floorCenterZ);
  corridorCeiling.receiveShadow = true;
  worldGroup.add(corridorCeiling);

  // ── Desk lights (every other desk for performance) ──
  WORLD.desks.forEach((desk, idx) => {
    if (idx % 2 !== 0) return; // skip alternating desks
    const dx = scaled(desk.x);
    const dz = scaled(desk.z);
    // Light fixture (small white box on ceiling)
    const fixture = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.04, 0.3),
      new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0.5 })
    );
    fixture.position.set(dx, corridorHeight - 0.06, dz);
    worldGroup.add(fixture);
    // Point light
    const deskLight = new THREE.PointLight(0xfff8ee, 0.15, 4, 2);
    deskLight.position.set(dx, corridorHeight - 0.1, dz);
    scene.add(deskLight);
  });

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
    torso: "#ffffff",
    torsoAccent: "#ffffff",
    legs: "#5b7fa6",
    skin: "#f8e2d2",
    hair: "#2a1f1a",
    shoes: "#fffefb",
    iris: "#604434",
    female: true,
    highlight: true,
    referenceJunior: true,
    scale: 1.0,
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
    senior.visible = !isIntro && (game.characters.senior.alpha ?? 1) > 0.02;
    junior.visible = !isIntro;
    fatherEcho.visible = !isIntro && game.characters.fatherEcho.alpha > 0.02;
    auntEcho.visible = !isIntro && game.characters.auntEcho.alpha > 0.02;


    introAura.visible = isIntro;
    introBloom.visible = isIntro;
    introSpark.visible = isIntro;
    introWake.visible = isIntro;
    introRibbon.visible = isIntro;

    senior.position.set(game.characters.senior.x, 0, game.characters.senior.z);
    senior.rotation.y = game.characters.senior.rotationY ?? 0;
    if ((game.characters.senior.alpha ?? 1) < 1) {
      senior.traverse((child) => {
        if (child.material) child.material.opacity = game.characters.senior.alpha;
      });
    }
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



    if (isIntro) {
      applyIdlePose(junior, game.time * 0.4, 0.4);
    } else if (game.endingSequence?.type === "perfect") {
      const seniorWalkT = THREE.MathUtils.smoothstep(game.endingSequence.time, 0.12, 11.7);
      const juniorWalkT = THREE.MathUtils.smoothstep(game.endingSequence.time, 0.24, 7.7);
      if (game.endingSequence.time < 11.7) {
        applyWalkingPose(senior, Math.sin(game.endingSequence.time * 3.53) * 0.9, 0.9);
      } else {
        applyIdlePose(senior, game.time, 0.8);
      }
      if (game.endingSequence.time < 7.7) {
        applyWalkingPose(junior, Math.sin(game.endingSequence.time * 3.23 + 0.8) * 0.84, 0.7);
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

  // ── Cinematic speed curve: slow-fast-slow with dramatic acceleration bursts ──
  const speedCurve = 0.5 + 0.5 * Math.sin(progress * Math.PI * 2.6 - Math.PI * 0.5);
  // Time warp effect — brief "frozen moment" near 30% then burst forward
  const timeWarp = progress < 0.28 ? progress
    : progress < 0.32 ? 0.28 + (progress - 0.28) * 0.3  // slow-motion pause
    : 0.292 + (progress - 0.32) * 1.04;                   // burst forward
  const effectiveProgress = THREE.MathUtils.clamp(timeWarp, 0, 1);

  const cameraT = THREE.MathUtils.smoothstep(
    THREE.MathUtils.clamp(effectiveProgress * (0.7 + speedCurve * 0.3), 0, 1), 0.02, 0.98
  );
  const camPos = introCurve.getPoint(cameraT);
  const target = introCurve.getPoint(THREE.MathUtils.clamp(cameraT + 0.06, 0, 1));

  // ── Heartbeat FOV — stronger at start (time-travel turbulence), fading to calm ──
  const heartbeat = Math.sin(progress * Math.PI * 8.4) * Math.exp(-progress * 1.6) * 5;
  // Dramatic FOV: ultra-wide at start (wormhole), narrowing to intimate
  const baseFov = THREE.MathUtils.lerp(118, 42, THREE.MathUtils.smoothstep(progress, 0.04, 0.88));
  // FOV "punch" during the burst — simulates crossing a time barrier
  const barrierPunch = progress > 0.30 && progress < 0.40
    ? Math.sin((progress - 0.30) / 0.10 * Math.PI) * 12 : 0;
  camera.fov = baseFov + heartbeat + barrierPunch;
  camera.updateProjectionMatrix();
  camera.position.copy(camPos);

  // ── Settle phase: camera finds LM402 and the senior ──
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

  // ── Spiral roll — dramatic barrel roll at start, stabilizing at end ──
  const spiralRoll = Math.sin(progress * Math.PI * 3.2) * THREE.MathUtils.lerp(0.62, 0.004, progress);
  // Chromatic-aberration-like micro-shake during time-travel
  const turbulence = Math.sin(progress * Math.PI * 22) * THREE.MathUtils.lerp(0.025, 0, progress) * 0.4;
  // Time-barrier crossing shake
  const barrierShake = progress > 0.30 && progress < 0.38
    ? Math.sin((progress - 0.30) * 200) * 0.012 * (1 - (progress - 0.30) / 0.08) : 0;
  camera.rotateZ(spiralRoll + turbulence + barrierShake);

  // ── Intro visual effects ──
  introGroup.visible = true;
  const threadPulse = 0.5 + 0.5 * Math.sin(progress * Math.PI * 6.2);

  // Red thread — pulsing with increasing intensity near barriers
  const threadGlow = progress > 0.28 && progress < 0.36
    ? 1.4 + Math.sin((progress - 0.28) / 0.08 * Math.PI * 4) * 0.6 : 1;
  introTube.material.opacity = THREE.MathUtils.lerp(0.96, 0.16, progress) * (0.85 + threadPulse * 0.15) * threadGlow;
  introTube.material.emissiveIntensity = THREE.MathUtils.lerp(3.2, 0.52, progress) * (0.8 + threadPulse * 0.2) * threadGlow;

  // Daughter's glow — she leads the way through time
  const daughterT = THREE.MathUtils.clamp(effectiveProgress + 0.03, 0, 1);
  const daughterPos = introCurve.getPoint(daughterT);

  introAura.position.copy(daughterPos).add(_introAuraOff);
  introAura.lookAt(camera.position);
  introAura.material.opacity = THREE.MathUtils.lerp(0.96, 0.22, progress) * (0.8 + threadPulse * 0.2);

  introBloom.position.copy(daughterPos).add(_introBloomOff);
  introBloom.lookAt(camera.position);
  // Bloom intensifies during barrier crossing
  const bloomBoost = progress > 0.29 && progress < 0.37 ? 1.6 : 1;
  introBloom.material.opacity = THREE.MathUtils.lerp(0.72, 0.16, progress) * bloomBoost;

  introRibbon.position.copy(daughterPos).add(_introRibbonOff);
  introRibbon.lookAt(camera.position);
  introRibbon.material.opacity = THREE.MathUtils.lerp(0.48, 0.04, progress);

  // Spark races ahead along the thread
  introSpark.position.copy(introCurve.getPoint(THREE.MathUtils.clamp(effectiveProgress + 0.08, 0, 1)));
  introSpark.scale.setScalar(1 + Math.sin(progress * Math.PI * 6) * 0.5);
  // Spark color shifts from cool white to warm gold as we arrive
  introSpark.material.color.lerpColors(
    _sparkCoolColor, _sparkWarmColor,
    THREE.MathUtils.smoothstep(progress, 0.5, 0.9)
  );

  introWake.position.copy(daughterPos).add(_introWakeOff);
  introWake.lookAt(camera.position);
  introWake.material.opacity = THREE.MathUtils.lerp(0.46, 0.06, progress);

  }

function perfectEndingPhase(time) {
  const seniorPovEnd = CINEMATIC_TIMELINE.perfectSeniorPovEnd ?? 28;
  if (time < 2) return "establishing";
  if (time < 12) return "orbit";
  if (time < 14) return "orbit_transition";
  if (time < seniorPovEnd) return "senior_pov_hold";
  return "eyes";
}

function applyPerfectEndingCamera(game) {
  const totalTime = game.endingSequence?.time ?? 0;
  const seniorPovEnd = CINEMATIC_TIMELINE.perfectSeniorPovEnd ?? 28;
  const center = junior.position.clone().add(_endingCenterOff);
  const faceForward = tempVecA.set(Math.sin(junior.rotation.y), 0, Math.cos(junior.rotation.y));
  const seniorEye = senior.position.clone().add(_endingSeniorEyeOff);

  // Face direction for orbit calculations
  const faceDir = new THREE.Vector3(Math.sin(junior.rotation.y), 0, Math.cos(junior.rotation.y));
  // Orbit center at body center (waist height) for full-body framing
  const orbitCenter = junior.position.clone()
    .add(new THREE.Vector3(0, 0.85, 0))  // waist/body center height
    .add(faceDir.clone().multiplyScalar(0.05));  // less forward offset
  // Eye target remains at face height for senior POV phases
  const eyeTarget = junior.position.clone()
    .add(new THREE.Vector3(0, 1.55, 0))
    .add(faceDir.clone().multiplyScalar(0.12));

  // ── Phase 0 (0–2s): Establishing shot — camera behind senior, looking at junior ──
  if (totalTime < 2) {
    const phaseT = totalTime / 2;
    const eased = THREE.MathUtils.smoothstep(phaseT, 0, 1);
    const shoulderOffset = _endingShoulderOff.clone();
    shoulderOffset.multiplyScalar(1 - eased * 0.5);
    const camPos = seniorEye.clone().add(shoulderOffset);
    const breathe = Math.sin(totalTime * 0.9) * 0.003 * (1 - eased * 0.4);
    const heartPound = Math.sin(totalTime * 1.8) * 0.0018;
    camPos.y += breathe + heartPound;
    camPos.x += Math.sin(totalTime * 0.5) * 0.002;
    camera.position.copy(camPos);
    camera.fov = THREE.MathUtils.lerp(28, 22, THREE.MathUtils.smoothstep(phaseT, 0.1, 0.9));
    camera.updateProjectionMatrix();
    const lookBlend = THREE.MathUtils.smoothstep(phaseT, 0.2, 0.8);
    const generalDir = senior.position.clone().add(
      tempVecA.set(Math.sin(senior.rotation.y), 0, Math.cos(senior.rotation.y)).multiplyScalar(3)
    ).add(tempVecB.set(0, 1.4, 0));
    const lookTarget = generalDir.clone().lerp(eyeTarget, lookBlend);
    camera.lookAt(lookTarget);
    camera.rotateZ(Math.sin(totalTime * 0.4) * 0.003 * (1 + eased * 0.5));
    return;
  }

  // ── Phase 1 (2–12s): 360° slow-motion orbit around junior's face ──
  // The key cinematic moment — camera circles her face in a full revolution
  // before the senior even speaks. Time feels suspended.
  if (totalTime < 12) {
    const orbitT = (totalTime - 2) / 10; // 0 to 1 over 10 seconds
    const easedT = THREE.MathUtils.smoothstep(orbitT, 0, 1);
    const angle = easedT * Math.PI * 2; // Full 360° with sine easing
    const orbitRadius = 2.2; // Much further back to capture full body

    // Calculate orbit position, anchored to junior's facing direction
    const baseAngle = angle + junior.rotation.y;
    const orbitX = orbitCenter.x + Math.sin(baseAngle) * orbitRadius;
    const orbitZ = orbitCenter.z + Math.cos(baseAngle) * orbitRadius;
    // Dynamic camera height — starts above eye level, dips during orbit for cinematic feel
    const orbitY = orbitCenter.y + 0.4 + Math.sin(orbitT * Math.PI) * 0.3;

    camera.position.set(orbitX, orbitY, orbitZ);

    // Wider FOV to capture full body in frame
    camera.fov = THREE.MathUtils.lerp(38, 32, THREE.MathUtils.smoothstep(orbitT, 0, 1));
    camera.updateProjectionMatrix();

    // Look at face area even though orbit center is at body center
    const lookTarget = junior.position.clone().add(new THREE.Vector3(0, 1.45, 0));
    camera.lookAt(lookTarget);

    // Heartbeat sway — subtle roll oscillation
    const heartbeat = Math.sin(totalTime * 1.8) * 0.002;
    camera.rotateZ(heartbeat);
    return;
  }

  // ── Phase 2 (12–14s): Transition back to senior's POV ──
  // Camera smoothly moves from orbit end position back to senior's eye line
  if (totalTime < 14) {
    const phaseT = (totalTime - 12) / 2;
    const eased = THREE.MathUtils.smoothstep(phaseT, 0, 1);

    // Orbit end position (full circle returns to front) — matches new orbit radius
    const endAngle = Math.PI * 2 + junior.rotation.y;
    const orbitEndPos = new THREE.Vector3(
      orbitCenter.x + Math.sin(endAngle) * 2.2,
      orbitCenter.y + 0.4,  // matches orbit end height
      orbitCenter.z + Math.cos(endAngle) * 2.2
    );

    // Senior hold position
    const seniorHoldPos = seniorEye.clone().add(_endingHoldOff);

    // Blend from orbit end to senior's eye
    const camPos = orbitEndPos.clone().lerp(seniorHoldPos, eased);
    const breathe = Math.sin(totalTime * 0.8) * 0.002;
    camPos.y += breathe;
    camera.position.copy(camPos);

    // FOV transitions from orbit end FOV to approach FOV
    camera.fov = THREE.MathUtils.lerp(32, 16, eased);
    camera.updateProjectionMatrix();

    // Look target blends from orbit center to eye target
    const lookTarget = orbitCenter.clone().lerp(eyeTarget, eased);
    camera.lookAt(lookTarget);

    // Gentle roll fade-out
    const roll = Math.sin(totalTime * 1.8) * 0.002 * (1 - eased);
    camera.rotateZ(roll);
    return;
  }

  // ── Phase 3 (14–22s): Senior's POV approach — slow-motion toward her face ──
  // "也太像徐若瑄了吧" is triggered here. Senior sees her up close.
  if (totalTime < 22) {
    const phaseT = (totalTime - 14) / 8;
    const eased = THREE.MathUtils.smoothstep(phaseT, 0, 1);
    const seniorHoldPos = seniorEye.clone().add(_endingHoldOff);
    const closePos = seniorHoldPos.clone().lerp(eyeTarget, eased * 0.52);
    const heartRate = 1.2 + phaseT * 0.3;
    const heartSway = Math.sin(totalTime * heartRate) * 0.002 * (1 + phaseT * 0.8);
    const heartRise = Math.cos(totalTime * heartRate * 0.7) * 0.0015;
    closePos.y += heartRise;
    closePos.x += heartSway;
    camera.position.copy(closePos);
    camera.fov = THREE.MathUtils.lerp(16, 10, THREE.MathUtils.smoothstep(phaseT, 0.05, 0.95));
    camera.updateProjectionMatrix();
    camera.lookAt(eyeTarget.x, eyeTarget.y + 0.001, eyeTarget.z);
    const emotionalRoll = Math.sin(totalTime * 0.5) * 0.003 * (0.5 + phaseT * 0.5);
    camera.rotateZ(emotionalRoll);
    return;
  }

  // ── Phase 4 (22–seniorPovEnd): Hold on her eyes — the "one glance" moment ──
  // Camera barely moves. Just breathing. Just her eyes. Time stops.
  if (totalTime < seniorPovEnd) {
    const phaseT = (totalTime - 22) / (seniorPovEnd - 22);
    const eyeHoldPos = seniorEye.clone().lerp(eyeTarget, 0.52).add(_endingCloseOff);
    const tremble = THREE.MathUtils.smoothstep(phaseT, 0, 0.5);
    const trembleX = Math.sin(totalTime * 2.8) * 0.0004 * tremble;
    const trembleY = Math.sin(totalTime * 3.1 + 1.2) * 0.0003 * tremble;
    const deepBreath = Math.sin(totalTime * 0.6) * 0.0012;
    eyeHoldPos.y += deepBreath + trembleY;
    eyeHoldPos.x += Math.cos(totalTime * 0.2) * 0.0006 + trembleX;
    camera.position.copy(eyeHoldPos);
    camera.fov = THREE.MathUtils.lerp(10, 9, THREE.MathUtils.smoothstep(phaseT, 0, 0.8));
    camera.updateProjectionMatrix();
    camera.lookAt(eyeTarget.x, eyeTarget.y + 0.001, eyeTarget.z);
    camera.rotateZ(Math.sin(totalTime * 0.35) * 0.0012 * tremble);
    return;
  }

  // ── Phase 5 (after seniorPovEnd): Lingering — camera pulls back slightly, world returns ──
  const eyesElapsed = totalTime - seniorPovEnd;
  const fadeBack = THREE.MathUtils.smoothstep(eyesElapsed, 0, 4);
  const eyeHoldPos = seniorEye.clone().lerp(eyeTarget, 0.52 - fadeBack * 0.08);
  eyeHoldPos.add(tempVecA.set(0.01 + fadeBack * 0.02, 0.008 + fadeBack * 0.01, 0));
  const tremble = Math.min(1, eyesElapsed * 0.08);
  eyeHoldPos.y += Math.sin(totalTime * 0.3) * 0.001 + Math.sin(totalTime * 2.2) * 0.0003 * tremble;
  eyeHoldPos.x += Math.cos(totalTime * 0.16) * 0.0008;
  camera.position.copy(eyeHoldPos);
  camera.fov = THREE.MathUtils.lerp(9, 12, THREE.MathUtils.smoothstep(eyesElapsed, 0, 5));
  camera.updateProjectionMatrix();
  camera.lookAt(eyeTarget.x, eyeTarget.y + 0.001, eyeTarget.z);
  camera.rotateZ(Math.sin(totalTime * 0.4) * 0.001 * tremble);
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

  let activeHologram = null;
  let hologramStartTime = 0;

  function disposeObject3D(obj) {
    obj.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach(m => { if (m.map) m.map.dispose(); m.dispose(); });
      }
    });
  }

  function spawnHologram(type, time) {
    if (activeHologram) {
      disposeObject3D(activeHologram);
      scene.remove(activeHologram);
      activeHologram = null;
    }

    if (type === "seat" || type === "notes") {
      activeHologram = createRealisticJuniorHologram();
      if (type === "seat") {
        activeHologram.position.set(23.7, 0, 25.72); // scale(1896), 0, scale(2058)
        activeHologram.rotation.y = 0.03;
        applyIdlePose(activeHologram, 0, 1.0);
      } else if (type === "notes") {
        activeHologram.position.set(23.7, 0, 25.72);
        activeHologram.rotation.y = -Math.PI / 2;
        applyIdlePose(activeHologram, 0, 1.0);
      }
    } else if (type === "board") {
      activeHologram = createSilhouette({
        phone: true, hairColor: "#11100f", shirtColor: "#323846", pantsColor: "#1d222a", shoesColor: "#383634",
        echo: true, echoOpacity: 0.8, echoColor: "#88ccff", scale: 1.05
      });
      activeHologram.position.set(-4.2, 0, 28.65); // scale(-336), 0, frontDoor.center.z - 42
      activeHologram.rotation.y = Math.PI / 2;
      applyIdlePose(activeHologram, 0, 1.0);
    }

    if (activeHologram) {
      scene.add(activeHologram);
      hologramStartTime = time;
    }
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

    // Animate clouds — slow horizontal drift
    animatedClouds.forEach((cloud) => {
      cloud.position.x = cloud.userData.startX + Math.sin(time * 0.02 * cloud.userData.speed) * 8 + time * cloud.userData.speed * 0.1;
    });
    // Animate birds — fly across sky with wing flapping
    animatedBirds.forEach((bird) => {
      const bt = time * bird.userData.speed;
      bird.position.x = bird.userData.startX + bt * 2;
      bird.position.z = bird.userData.startZ + Math.sin(bt * 0.5 + bird.userData.phase) * 6;
      bird.position.y += Math.sin(bt + bird.userData.phase) * 0.002;
      // Wing flap
      bird.userData.wingL.rotation.z = 0.3 + Math.sin(bt * 6 + bird.userData.phase) * 0.4;
      bird.userData.wingR.rotation.z = -0.3 - Math.sin(bt * 6 + bird.userData.phase) * 0.4;
      // Wrap around when too far
      if (bird.position.x > bird.userData.startX + 120) {
        bird.position.x = bird.userData.startX - 40;
      }
    });

    if (activeHologram) {
      const elapsed = time - hologramStartTime;
      let targetOpacity = 0;
      if (elapsed > 5.0 && elapsed <= 6.0) {
        targetOpacity = (6.0 - elapsed) * 0.8;
      } else if (elapsed > 1.0 && elapsed <= 5.0) {
        targetOpacity = 0.8 + Math.sin(time * 4) * 0.12;
      } else if (elapsed >= 0 && elapsed <= 1.0) {
        targetOpacity = elapsed * 0.8;
      } else if (elapsed > 6.0) {
        scene.remove(activeHologram);
        activeHologram = null;
      }
      
      if (activeHologram) {
        activeHologram.position.y = Math.sin(time * 2) * 0.02;
        activeHologram.traverse((child) => {
          if (child.material) {
            child.material.opacity = targetOpacity;
          }
        });
      }
    }

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
    spawnHologram,
    worldBounds: { minX: minX + 0.26, maxX: maxX - 0.22, minZ: minZ + 0.22, maxZ: maxZ - 0.22 },
  };
}
