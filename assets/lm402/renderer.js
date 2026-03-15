import { WORLD } from "./data.js";

const TAU = Math.PI * 2;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function smoothstep(a, b, x) {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

function makeSprite(draw, width = 280, height = 520) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  draw(ctx, width, height);
  return canvas;
}

function drawFace(ctx, centerX, centerY, faceW, faceH, colors, expression = "calm") {
  ctx.fillStyle = colors.skin;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, faceW, faceH, 0, 0, TAU);
  ctx.fill();

  const cheekGlow = ctx.createRadialGradient(centerX + faceW * 0.24, centerY, 4, centerX, centerY, faceW * 1.2);
  cheekGlow.addColorStop(0, "rgba(255,238,226,.26)");
  cheekGlow.addColorStop(1, "rgba(255,238,226,0)");
  ctx.fillStyle = cheekGlow;
  ctx.fillRect(centerX - faceW * 1.4, centerY - faceH * 1.2, faceW * 2.8, faceH * 2.8);

  ctx.strokeStyle = "rgba(80,44,40,.42)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(centerX - faceW * 0.36, centerY - faceH * 0.12);
  ctx.quadraticCurveTo(centerX - faceW * 0.22, centerY - faceH * 0.18, centerX - faceW * 0.06, centerY - faceH * 0.12);
  ctx.moveTo(centerX + faceW * 0.06, centerY - faceH * 0.12);
  ctx.quadraticCurveTo(centerX + faceW * 0.22, centerY - faceH * 0.18, centerX + faceW * 0.36, centerY - faceH * 0.12);
  ctx.stroke();

  ctx.fillStyle = "#251b1b";
  ctx.beginPath();
  ctx.ellipse(centerX - faceW * 0.18, centerY, faceW * 0.08, faceH * 0.1, 0, 0, TAU);
  ctx.ellipse(centerX + faceW * 0.18, centerY, faceW * 0.08, faceH * 0.1, 0, 0, TAU);
  ctx.fill();

  ctx.strokeStyle = "rgba(120,78,72,.55)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - faceH * 0.02);
  ctx.quadraticCurveTo(centerX + faceW * 0.03, centerY + faceH * 0.15, centerX - faceW * 0.02, centerY + faceH * 0.2);
  ctx.stroke();

  ctx.strokeStyle = expression === "soft-smile" ? "rgba(152,94,92,.72)" : "rgba(118,80,74,.64)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  const mouthCurve = expression === "soft-smile" ? faceH * 0.12 : faceH * 0.06;
  ctx.moveTo(centerX - faceW * 0.18, centerY + faceH * 0.34);
  ctx.quadraticCurveTo(centerX, centerY + faceH * 0.34 + mouthCurve, centerX + faceW * 0.18, centerY + faceH * 0.32);
  ctx.stroke();
}

function drawBodyShadow(ctx, w, h, width = 72, alpha = 0.22) {
  ctx.fillStyle = `rgba(0,0,0,${alpha})`;
  ctx.beginPath();
  ctx.ellipse(w / 2, h - 26, width, 16, 0, 0, TAU);
  ctx.fill();
}

function drawSeniorSprite(ctx, w, h) {
  const colors = {
    skin: "#e2b99d",
    hair: "#241918",
    shirt: "#425b78",
    inner: "#cad2df",
    pants: "#111924",
    shoes: "#201919",
  };
  ctx.clearRect(0, 0, w, h);
  drawBodyShadow(ctx, w, h, 76, 0.2);

  ctx.fillStyle = colors.pants;
  ctx.beginPath();
  ctx.moveTo(w * 0.39, h * 0.54);
  ctx.lineTo(w * 0.49, h * 0.54);
  ctx.lineTo(w * 0.46, h * 0.88);
  ctx.lineTo(w * 0.36, h * 0.88);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(w * 0.51, h * 0.54);
  ctx.lineTo(w * 0.61, h * 0.54);
  ctx.lineTo(w * 0.64, h * 0.88);
  ctx.lineTo(w * 0.54, h * 0.88);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = colors.shoes;
  ctx.fillRect(w * 0.34, h * 0.86, 32, 14);
  ctx.fillRect(w * 0.54, h * 0.86, 34, 14);

  ctx.fillStyle = colors.shirt;
  ctx.beginPath();
  ctx.moveTo(w * 0.28, h * 0.28);
  ctx.quadraticCurveTo(w * 0.5, h * 0.2, w * 0.72, h * 0.3);
  ctx.lineTo(w * 0.68, h * 0.56);
  ctx.quadraticCurveTo(w * 0.5, h * 0.64, w * 0.32, h * 0.56);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = colors.inner;
  ctx.beginPath();
  ctx.moveTo(w * 0.46, h * 0.29);
  ctx.lineTo(w * 0.5, h * 0.39);
  ctx.lineTo(w * 0.54, h * 0.29);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = colors.skin;
  ctx.beginPath();
  ctx.moveTo(w * 0.26, h * 0.34);
  ctx.lineTo(w * 0.31, h * 0.34);
  ctx.lineTo(w * 0.28, h * 0.59);
  ctx.lineTo(w * 0.22, h * 0.58);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(w * 0.69, h * 0.33);
  ctx.lineTo(w * 0.74, h * 0.34);
  ctx.lineTo(w * 0.79, h * 0.57);
  ctx.lineTo(w * 0.72, h * 0.58);
  ctx.closePath();
  ctx.fill();

  drawFace(ctx, w * 0.5, h * 0.16, 60, 76, colors);

  ctx.fillStyle = colors.hair;
  ctx.beginPath();
  ctx.moveTo(w * 0.28, h * 0.16);
  ctx.quadraticCurveTo(w * 0.33, h * 0.02, w * 0.5, h * 0.03);
  ctx.quadraticCurveTo(w * 0.71, h * 0.04, w * 0.76, h * 0.19);
  ctx.lineTo(w * 0.72, h * 0.13);
  ctx.quadraticCurveTo(w * 0.58, h * 0.08, w * 0.48, h * 0.08);
  ctx.quadraticCurveTo(w * 0.36, h * 0.08, w * 0.29, h * 0.18);
  ctx.closePath();
  ctx.fill();
}

function drawJuniorSprite(ctx, w, h) {
  const colors = {
    skin: "#f0cab3",
    hair: "#1f1616",
    shirt: "#f5f1eb",
    shirtShade: "#d9d5cf",
    shorts: "#6788bc",
    shoes: "#f6eee6",
  };
  ctx.clearRect(0, 0, w, h);
  const glow = ctx.createRadialGradient(w * 0.54, h * 0.22, 18, w * 0.56, h * 0.2, 178);
  glow.addColorStop(0, "rgba(255,236,186,.92)");
  glow.addColorStop(0.28, "rgba(255,228,170,.4)");
  glow.addColorStop(1, "rgba(255,228,170,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(w * 0.56, h * 0.24, 150, 178, 0, 0, TAU);
  ctx.fill();

  drawBodyShadow(ctx, w, h, 74, 0.18);

  ctx.fillStyle = colors.skin;
  ctx.beginPath();
  ctx.moveTo(w * 0.42, h * 0.62);
  ctx.lineTo(w * 0.49, h * 0.62);
  ctx.lineTo(w * 0.47, h * 0.9);
  ctx.lineTo(w * 0.39, h * 0.9);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(w * 0.54, h * 0.62);
  ctx.lineTo(w * 0.61, h * 0.62);
  ctx.lineTo(w * 0.64, h * 0.9);
  ctx.lineTo(w * 0.55, h * 0.9);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = colors.shoes;
  ctx.fillRect(w * 0.38, h * 0.88, 34, 12);
  ctx.fillRect(w * 0.56, h * 0.88, 34, 12);

  ctx.fillStyle = colors.shorts;
  ctx.beginPath();
  ctx.moveTo(w * 0.36, h * 0.52);
  ctx.lineTo(w * 0.64, h * 0.52);
  ctx.lineTo(w * 0.62, h * 0.66);
  ctx.lineTo(w * 0.38, h * 0.66);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = colors.shirt;
  ctx.beginPath();
  ctx.moveTo(w * 0.3, h * 0.28);
  ctx.quadraticCurveTo(w * 0.5, h * 0.22, w * 0.7, h * 0.28);
  ctx.lineTo(w * 0.67, h * 0.54);
  ctx.quadraticCurveTo(w * 0.5, h * 0.6, w * 0.33, h * 0.54);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = colors.shirtShade;
  ctx.beginPath();
  ctx.moveTo(w * 0.48, h * 0.29);
  ctx.lineTo(w * 0.5, h * 0.41);
  ctx.lineTo(w * 0.52, h * 0.29);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = colors.skin;
  ctx.beginPath();
  ctx.moveTo(w * 0.29, h * 0.32);
  ctx.lineTo(w * 0.34, h * 0.32);
  ctx.lineTo(w * 0.3, h * 0.56);
  ctx.lineTo(w * 0.24, h * 0.54);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(w * 0.67, h * 0.31);
  ctx.lineTo(w * 0.72, h * 0.31);
  ctx.lineTo(w * 0.76, h * 0.53);
  ctx.lineTo(w * 0.7, h * 0.55);
  ctx.closePath();
  ctx.fill();

  drawFace(ctx, w * 0.52, h * 0.18, 56, 74, colors, "soft-smile");

  ctx.fillStyle = colors.hair;
  ctx.beginPath();
  ctx.moveTo(w * 0.3, h * 0.18);
  ctx.quadraticCurveTo(w * 0.33, h * 0.02, w * 0.52, h * 0.03);
  ctx.quadraticCurveTo(w * 0.7, h * 0.03, w * 0.76, h * 0.18);
  ctx.lineTo(w * 0.71, h * 0.32);
  ctx.quadraticCurveTo(w * 0.6, h * 0.28, w * 0.51, h * 0.28);
  ctx.quadraticCurveTo(w * 0.43, h * 0.28, w * 0.34, h * 0.31);
  ctx.lineTo(w * 0.3, h * 0.22);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(w * 0.24, h * 0.18, 22, 120);
  ctx.fillRect(w * 0.74, h * 0.18, 18, 110);

  const highlight = ctx.createLinearGradient(w * 0.58, h * 0.08, w * 0.76, h * 0.42);
  highlight.addColorStop(0, "rgba(255,246,228,.4)");
  highlight.addColorStop(1, "rgba(255,246,228,0)");
  ctx.fillStyle = highlight;
  ctx.beginPath();
  ctx.ellipse(w * 0.56, h * 0.16, 84, 108, 0, 0, TAU);
  ctx.fill();
}

function drawEchoSprite(ctx, w, h, glowColor, edgeColor) {
  ctx.clearRect(0, 0, w, h);
  const glow = ctx.createRadialGradient(w / 2, h * 0.28, 18, w / 2, h * 0.34, 210);
  glow.addColorStop(0, glowColor);
  glow.addColorStop(1, "rgba(255,220,210,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "rgba(255,236,224,.16)";
  ctx.beginPath();
  ctx.ellipse(w * 0.52, h * 0.18, 56, 74, 0, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(w * 0.32, h * 0.32);
  ctx.quadraticCurveTo(w * 0.5, h * 0.26, w * 0.67, h * 0.34);
  ctx.lineTo(w * 0.62, h * 0.72);
  ctx.quadraticCurveTo(w * 0.48, h * 0.78, w * 0.36, h * 0.7);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = edgeColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(w * 0.34, h * 0.16);
  ctx.quadraticCurveTo(w * 0.5, h * 0.08, w * 0.67, h * 0.18);
  ctx.stroke();
}

function drawHotspotSprite(ctx, w, h) {
  ctx.clearRect(0, 0, w, h);
  const grad = ctx.createRadialGradient(w / 2, h / 2, 8, w / 2, h / 2, 64);
  grad.addColorStop(0, "rgba(255,246,236,.28)");
  grad.addColorStop(0.45, "rgba(255,244,224,.08)");
  grad.addColorStop(1, "rgba(255,244,224,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 68, 0, TAU);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,248,236,.42)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 24, 0, TAU);
  ctx.stroke();
}

function buildSprites() {
  return {
    senior: makeSprite(drawSeniorSprite),
    junior: makeSprite(drawJuniorSprite),
    fatherEcho: makeSprite((ctx, w, h) => drawEchoSprite(ctx, w, h, "rgba(255,216,170,.42)", "rgba(255,230,198,.22)")),
    auntEcho: makeSprite((ctx, w, h) => drawEchoSprite(ctx, w, h, "rgba(255,186,210,.42)", "rgba(255,232,240,.22)")),
    hotspot: makeSprite(drawHotspotSprite, 160, 160),
  };
}

function rotateYaw(dx, dz, yaw) {
  const sin = Math.sin(yaw);
  const cos = Math.cos(yaw);
  return { x: dx * cos - dz * sin, z: dz * cos + dx * sin };
}

function toCamera(point, camera) {
  const dx = point.x - camera.x;
  const dy = point.y - camera.y;
  const dz = point.z - camera.z;
  const yawed = rotateYaw(dx, dz, -camera.yaw);
  const sinPitch = Math.sin(-camera.pitch);
  const cosPitch = Math.cos(-camera.pitch);
  return {
    x: yawed.x,
    y: dy * cosPitch - yawed.z * sinPitch,
    z: yawed.z * cosPitch + dy * sinPitch,
  };
}

function project(point, camera, width, height, focal) {
  const cam = toCamera(point, camera);
  if (cam.z <= 12) {
    return null;
  }
  return {
    x: width / 2 + (cam.x / cam.z) * focal,
    y: height / 2 - (cam.y / cam.z) * focal,
    z: cam.z,
  };
}

function pushQuad(commands, camera, width, height, focal, points, fill, stroke = null, alpha = 1) {
  const projected = points.map((point) => project(point, camera, width, height, focal));
  if (projected.some((point) => !point)) {
    return;
  }
  const depth = projected.reduce((sum, point) => sum + point.z, 0) / projected.length;
  commands.push({ type: "poly", points: projected, fill, stroke, alpha, depth });
}

function pushBillboard(commands, camera, width, height, focal, point, sprite, size, alpha = 1, meta = null) {
  const projected = project(point, camera, width, height, focal);
  if (!projected) {
    return;
  }
  const scale = focal / projected.z;
  const drawWidth = size.w * scale;
  const drawHeight = size.h * scale;
  commands.push({
    type: "sprite",
    sprite,
    x: projected.x - drawWidth / 2,
    y: projected.y - drawHeight,
    w: drawWidth,
    h: drawHeight,
    alpha,
    depth: projected.z,
    meta,
  });
}

function drawPolygon(ctx, command) {
  const points = command.points;
  ctx.save();
  ctx.globalAlpha = command.alpha;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let index = 1; index < points.length; index += 1) {
    ctx.lineTo(points[index].x, points[index].y);
  }
  ctx.closePath();
  ctx.fillStyle = command.fill;
  ctx.fill();
  if (command.stroke) {
    ctx.strokeStyle = command.stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
}

function drawFloorGrid(ctx, camera, width, height, focal) {
  ctx.save();
  for (let z = 120; z <= 1500; z += 88) {
    const alpha = z < 340 ? 0.18 : 0.08;
    const p1 = project({ x: WORLD.minX, y: 0.6, z }, camera, width, height, focal);
    const p2 = project({ x: WORLD.maxX, y: 0.6, z }, camera, width, height, focal);
    if (!p1 || !p2) {
      continue;
    }
    ctx.strokeStyle = z < 340 ? `rgba(184,188,198,${alpha})` : `rgba(120,120,126,${alpha})`;
    ctx.lineWidth = z < 340 ? 1.4 : 1;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }
  for (let x = -540; x <= 320; x += 84) {
    const p1 = project({ x, y: 0.6, z: WORLD.minZ }, camera, width, height, focal);
    const p2 = project({ x, y: 0.6, z: WORLD.maxZ }, camera, width, height, focal);
    if (!p1 || !p2) {
      continue;
    }
    ctx.strokeStyle = x < -220 ? "rgba(178,186,198,.09)" : "rgba(128,110,92,.06)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }
  ctx.restore();
}

function pushDoorFrame(commands, camera, width, height, focal, z1, z2) {
  const left = WORLD.dividerX - 10;
  const right = WORLD.dividerX + 10;
  pushQuad(commands, camera, width, height, focal, [
    { x: left, y: 0, z: z1 },
    { x: right, y: 0, z: z1 },
    { x: right, y: 228, z: z1 },
    { x: left, y: 228, z: z1 },
  ], "rgba(226,226,224,.9)");
  pushQuad(commands, camera, width, height, focal, [
    { x: left, y: 0, z: z2 },
    { x: right, y: 0, z: z2 },
    { x: right, y: 228, z: z2 },
    { x: left, y: 228, z: z2 },
  ], "rgba(218,218,214,.88)");
  pushQuad(commands, camera, width, height, focal, [
    { x: left, y: 228, z: z1 },
    { x: right, y: 228, z: z1 },
    { x: right, y: 228, z: z2 },
    { x: left, y: 228, z: z2 },
  ], "rgba(232,230,226,.96)");
}

function buildEnvironment(commands, camera, width, height, focal, scene) {
  for (let z = WORLD.minZ; z < WORLD.maxZ; z += 92) {
    const z2 = Math.min(z + 92, WORLD.maxZ);
    const classroomTone = z % 184 === 0 ? "rgba(94,84,72,.96)" : "rgba(82,74,64,.94)";
    const corridorTone = z % 184 === 0 ? "rgba(150,158,172,.96)" : "rgba(138,146,160,.94)";
    pushQuad(commands, camera, width, height, focal, [
      { x: -220, y: 0, z },
      { x: 340, y: 0, z },
      { x: 340, y: 0, z: z2 },
      { x: -220, y: 0, z: z2 },
    ], classroomTone);
    pushQuad(commands, camera, width, height, focal, [
      { x: WORLD.minX, y: 0, z },
      { x: -220, y: 0, z },
      { x: -220, y: 0, z: z2 },
      { x: WORLD.minX, y: 0, z: z2 },
    ], corridorTone);
    pushQuad(commands, camera, width, height, focal, [
      { x: WORLD.maxX, y: 0, z },
      { x: WORLD.maxX, y: 0, z: z2 },
      { x: WORLD.maxX, y: 272, z: z2 },
      { x: WORLD.maxX, y: 272, z },
    ], "rgba(202,194,182,.88)");
    pushQuad(commands, camera, width, height, focal, [
      { x: WORLD.minX, y: 0, z },
      { x: WORLD.minX, y: 0, z: z2 },
      { x: WORLD.minX, y: 272, z: z2 },
      { x: WORLD.minX, y: 272, z },
    ], "rgba(164,172,186,.84)");
    pushQuad(commands, camera, width, height, focal, [
      { x: WORLD.minX, y: 0, z },
      { x: WORLD.maxX, y: 0, z },
      { x: WORLD.maxX, y: 8, z },
      { x: WORLD.minX, y: 8, z },
    ], "rgba(52,48,46,.34)");
  }

  pushQuad(commands, camera, width, height, focal, [
    { x: WORLD.minX, y: 0, z: WORLD.minZ },
    { x: WORLD.maxX, y: 0, z: WORLD.minZ },
    { x: WORLD.maxX, y: 272, z: WORLD.minZ },
    { x: WORLD.minX, y: 272, z: WORLD.minZ },
  ], "rgba(200,200,204,.66)");

  pushQuad(commands, camera, width, height, focal, [
    { x: WORLD.minX, y: 272, z: WORLD.minZ },
    { x: WORLD.maxX, y: 272, z: WORLD.minZ },
    { x: WORLD.maxX, y: 272, z: WORLD.maxZ },
    { x: WORLD.minX, y: 272, z: WORLD.maxZ },
  ], "rgba(166,166,172,.3)");

  const dividerSegments = [
    { z1: WORLD.minZ, z2: WORLD.frontDoor.z1 },
    { z1: WORLD.frontDoor.z2, z2: WORLD.backDoor.z1 },
    { z1: WORLD.backDoor.z2, z2: WORLD.maxZ },
  ];
  dividerSegments.forEach((segment) => {
    pushQuad(commands, camera, width, height, focal, [
      { x: WORLD.dividerX, y: 0, z: segment.z1 },
      { x: WORLD.dividerX, y: 0, z: segment.z2 },
      { x: WORLD.dividerX, y: 252, z: segment.z2 },
      { x: WORLD.dividerX, y: 252, z: segment.z1 },
    ], "rgba(212,216,220,.9)");
  });

  pushDoorFrame(commands, camera, width, height, focal, WORLD.frontDoor.z1, WORLD.frontDoor.z2);
  pushDoorFrame(commands, camera, width, height, focal, WORLD.backDoor.z1, WORLD.backDoor.z2);

  pushQuad(commands, camera, width, height, focal, [
    { x: WORLD.board.x1, y: WORLD.board.y1, z: WORLD.board.z },
    { x: WORLD.board.x2, y: WORLD.board.y1, z: WORLD.board.z },
    { x: WORLD.board.x2, y: WORLD.board.y2, z: WORLD.board.z },
    { x: WORLD.board.x1, y: WORLD.board.y2, z: WORLD.board.z },
  ], "rgba(30,54,42,.96)", "rgba(190,214,198,.22)");
  pushQuad(commands, camera, width, height, focal, [
    { x: WORLD.board.x1 - 6, y: WORLD.board.y1 - 10, z: WORLD.board.z + 1 },
    { x: WORLD.board.x2 + 6, y: WORLD.board.y1 - 10, z: WORLD.board.z + 1 },
    { x: WORLD.board.x2 + 6, y: WORLD.board.y1 - 4, z: WORLD.board.z + 1 },
    { x: WORLD.board.x1 - 6, y: WORLD.board.y1 - 4, z: WORLD.board.z + 1 },
  ], "rgba(214,214,210,.86)");
  pushQuad(commands, camera, width, height, focal, [
    { x: WORLD.board.x1 + 16, y: WORLD.board.y1 - 18, z: WORLD.board.z + 2 },
    { x: WORLD.board.x2 - 16, y: WORLD.board.y1 - 18, z: WORLD.board.z + 2 },
    { x: WORLD.board.x2 - 16, y: WORLD.board.y1 - 12, z: WORLD.board.z + 2 },
    { x: WORLD.board.x1 + 16, y: WORLD.board.y1 - 12, z: WORLD.board.z + 2 },
  ], "rgba(246,238,226,.42)");

  pushQuad(commands, camera, width, height, focal, [
    { x: -86, y: 0, z: 132 },
    { x: -8, y: 0, z: 132 },
    { x: -8, y: 86, z: 132 },
    { x: -86, y: 86, z: 132 },
  ], "rgba(104,72,40,.88)");
  pushQuad(commands, camera, width, height, focal, [
    { x: -92, y: 86, z: 92 },
    { x: 6, y: 86, z: 92 },
    { x: 6, y: 86, z: 148 },
    { x: -92, y: 86, z: 148 },
  ], "rgba(132,94,58,.94)");

  WORLD.windows.forEach((windowPanel) => {
    pushQuad(commands, camera, width, height, focal, [
      { x: WORLD.maxX - 2, y: windowPanel.y1, z: windowPanel.z - 80 },
      { x: WORLD.maxX - 2, y: windowPanel.y1, z: windowPanel.z + 80 },
      { x: WORLD.maxX - 2, y: windowPanel.y2, z: windowPanel.z + 80 },
      { x: WORLD.maxX - 2, y: windowPanel.y2, z: windowPanel.z - 80 },
    ], "rgba(255,240,208,.34)");
    pushQuad(commands, camera, width, height, focal, [
      { x: WORLD.maxX - 10, y: windowPanel.y1, z: windowPanel.z - 80 },
      { x: WORLD.maxX - 2, y: windowPanel.y1, z: windowPanel.z - 80 },
      { x: WORLD.maxX - 2, y: windowPanel.y2, z: windowPanel.z - 80 },
      { x: WORLD.maxX - 10, y: windowPanel.y2, z: windowPanel.z - 80 },
    ], "rgba(190,184,176,.82)");
    pushQuad(commands, camera, width, height, focal, [
      { x: WORLD.maxX - 10, y: windowPanel.y1, z: windowPanel.z + 80 },
      { x: WORLD.maxX - 2, y: windowPanel.y1, z: windowPanel.z + 80 },
      { x: WORLD.maxX - 2, y: windowPanel.y2, z: windowPanel.z + 80 },
      { x: WORLD.maxX - 10, y: windowPanel.y2, z: windowPanel.z + 80 },
    ], "rgba(190,184,176,.82)");
    pushQuad(commands, camera, width, height, focal, [
      { x: WORLD.maxX - 4, y: windowPanel.y1, z: windowPanel.z - 2 },
      { x: WORLD.maxX - 4, y: windowPanel.y1, z: windowPanel.z + 2 },
      { x: WORLD.maxX - 4, y: windowPanel.y2, z: windowPanel.z + 2 },
      { x: WORLD.maxX - 4, y: windowPanel.y2, z: windowPanel.z - 2 },
    ], "rgba(212,206,196,.24)");
  });

  WORLD.lightBeams.forEach((beam) => {
    pushQuad(commands, camera, width, height, focal, [
      { x: WORLD.maxX - 4, y: 224, z: beam.z - beam.width / 2 },
      { x: WORLD.maxX - 4, y: 224, z: beam.z + beam.width / 2 },
      { x: WORLD.maxX - beam.reach, y: 0, z: beam.z + beam.width * 0.94 },
      { x: WORLD.maxX - beam.reach + 42, y: 0, z: beam.z - beam.width * 0.88 },
    ], `rgba(255,219,148,${beam.alpha * 0.78})`);
  });

  WORLD.desks.forEach((desk) => {
    const x1 = desk.x - 54;
    const x2 = desk.x + 54;
    const z1 = desk.z - 40;
    const z2 = desk.z + 40;
    pushQuad(commands, camera, width, height, focal, [
      { x: x1, y: 74, z: z1 },
      { x: x2, y: 74, z: z1 },
      { x: x2, y: 74, z: z2 },
      { x: x1, y: 74, z: z2 },
    ], "rgba(144,100,58,.98)", "rgba(72,42,24,.28)");
    pushQuad(commands, camera, width, height, focal, [
      { x: x1 + 8, y: 42, z: z2 + 16 },
      { x: x2 - 8, y: 42, z: z2 + 16 },
      { x: x2 - 8, y: 48, z: z2 + 34 },
      { x: x1 + 8, y: 48, z: z2 + 34 },
    ], "rgba(112,80,48,.7)");
    [
      { x: x1 + 8, z: z1 + 6 },
      { x: x2 - 8, z: z1 + 6 },
      { x: x1 + 8, z: z2 - 6 },
      { x: x2 - 8, z: z2 - 6 },
    ].forEach((leg) => {
      pushQuad(commands, camera, width, height, focal, [
        { x: leg.x, y: 0, z: leg.z },
        { x: leg.x + 4, y: 0, z: leg.z },
        { x: leg.x + 4, y: 74, z: leg.z },
        { x: leg.x, y: 74, z: leg.z },
      ], "rgba(78,54,34,.68)");
    });
  });

  WORLD.notes.forEach((note, index) => {
    pushQuad(commands, camera, width, height, focal, [
      { x: note.x - 12, y: note.y, z: note.z - 10 },
      { x: note.x + 12, y: note.y, z: note.z - 4 },
      { x: note.x + 10, y: note.y, z: note.z + 8 },
      { x: note.x - 14, y: note.y, z: note.z + 2 },
    ], index === 0 ? "rgba(244,236,224,.94)" : "rgba(250,248,244,.92)");
  });

  pushQuad(commands, camera, width, height, focal, [
    { x: WORLD.plaque.x - 30, y: 162, z: WORLD.plaque.z - 2 },
    { x: WORLD.plaque.x + 30, y: 162, z: WORLD.plaque.z - 2 },
    { x: WORLD.plaque.x + 30, y: 210, z: WORLD.plaque.z - 2 },
    { x: WORLD.plaque.x - 30, y: 210, z: WORLD.plaque.z - 2 },
  ], "rgba(54,66,82,.98)", "rgba(255,255,255,.2)");
  pushQuad(commands, camera, width, height, focal, [
    { x: WORLD.plaque.x - 22, y: 178, z: WORLD.plaque.z - 1 },
    { x: WORLD.plaque.x + 22, y: 178, z: WORLD.plaque.z - 1 },
    { x: WORLD.plaque.x + 22, y: 184, z: WORLD.plaque.z - 1 },
    { x: WORLD.plaque.x - 22, y: 184, z: WORLD.plaque.z - 1 },
  ], "rgba(255,244,220,.36)");

  const characterState = {
    senior: scene.characters.senior,
    junior: scene.characters.junior,
    fatherEcho: scene.characters.fatherEcho,
    auntEcho: scene.characters.auntEcho,
  };

  if (characterState.fatherEcho.alpha > 0.02) {
    pushBillboard(commands, camera, width, height, focal, characterState.fatherEcho.position, scene.sprites.fatherEcho, { w: 21, h: 48 }, characterState.fatherEcho.alpha);
  }
  if (characterState.auntEcho.alpha > 0.02) {
    pushBillboard(commands, camera, width, height, focal, characterState.auntEcho.position, scene.sprites.auntEcho, { w: 20, h: 48 }, characterState.auntEcho.alpha);
  }

  pushBillboard(commands, camera, width, height, focal, characterState.senior.position, scene.sprites.senior, { w: 18, h: 46 }, 0.98, { type: "character", id: "senior" });
  pushBillboard(commands, camera, width, height, focal, characterState.junior.position, scene.sprites.junior, { w: 18, h: 46 }, 0.99, { type: "character", id: "junior", glow: scene.phase === "eye_contact" ? 1 : 0 });

  scene.hotspots.forEach((hotspot) => {
    if (!hotspot.visible) {
      return;
    }
    pushBillboard(
      commands,
      camera,
      width,
      height,
      focal,
      { x: hotspot.x, y: hotspot.y + 12, z: hotspot.z },
      scene.sprites.hotspot,
      { w: hotspot.active ? 28 : 20, h: hotspot.active ? 28 : 20 },
      hotspot.active ? 0.72 : 0.16,
      { type: "hotspot", id: hotspot.id, label: hotspot.label }
    );
  });
}

function drawCommands(ctx, commands) {
  commands.sort((a, b) => b.depth - a.depth);
  commands.forEach((command) => {
    if (command.type === "poly") {
      drawPolygon(ctx, command);
      return;
    }
    ctx.save();
    ctx.globalAlpha = command.alpha;
    if (command.meta?.glow) {
      ctx.shadowBlur = 40;
      ctx.shadowColor = "rgba(255,232,188,.78)";
    }
    ctx.drawImage(command.sprite, command.x, command.y, command.w, command.h);
    ctx.restore();
  });
}

function drawOverlayLabels(ctx, camera, width, height, focal, scene) {
  scene.hotspots.forEach((hotspot) => {
    if (!hotspot.visible || (!hotspot.active && !hotspot.alwaysLabel)) {
      return;
    }
    const screen = project({ x: hotspot.x, y: hotspot.y + 28, z: hotspot.z }, camera, width, height, focal);
    if (!screen) {
      return;
    }
    ctx.save();
    ctx.translate(screen.x, screen.y);
    const label = hotspot.label;
    ctx.font = "500 12px 'DM Mono', monospace";
    const textWidth = ctx.measureText(label).width;
    ctx.fillStyle = hotspot.active ? "rgba(8,12,18,.9)" : "rgba(10,10,14,.58)";
    ctx.strokeStyle = hotspot.active ? "rgba(255,242,218,.42)" : "rgba(255,255,255,.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(-textWidth / 2 - 12, -14, textWidth + 24, 28, 14);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = hotspot.active ? "rgba(255,244,216,.96)" : "rgba(236,236,236,.64)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, 0, 1);
    ctx.restore();
  });
}

function drawScreenFx(ctx, width, height, scene) {
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, scene.mode === "intro" ? "#09080f" : "#8f9eb4");
  sky.addColorStop(0.38, scene.mode === "intro" ? "#13131a" : "#cfd6df");
  sky.addColorStop(1, scene.mode === "intro" ? "#08070a" : "#756957");
  ctx.globalCompositeOperation = "destination-over";
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = "source-over";

  const warmSun = ctx.createRadialGradient(width * 0.88, height * 0.14, 20, width * 0.76, height * 0.22, width * 0.66);
  warmSun.addColorStop(0, scene.mode === "intro" ? "rgba(255,228,172,.34)" : "rgba(255,226,172,.42)");
  warmSun.addColorStop(0.4, scene.mode === "intro" ? "rgba(255,228,172,.12)" : "rgba(255,226,172,.14)");
  warmSun.addColorStop(1, "rgba(255,228,172,0)");
  ctx.fillStyle = warmSun;
  ctx.fillRect(0, 0, width, height);

  const corridorCool = ctx.createLinearGradient(0, 0, width * 0.34, height);
  corridorCool.addColorStop(0, "rgba(58,74,112,.22)");
  corridorCool.addColorStop(1, "rgba(86,104,144,0)");
  ctx.fillStyle = corridorCool;
  ctx.fillRect(0, 0, width, height);

  const lowerShade = ctx.createLinearGradient(0, height * 0.4, 0, height);
  lowerShade.addColorStop(0, "rgba(12,14,18,0)");
  lowerShade.addColorStop(1, scene.mode === "intro" ? "rgba(8,8,10,.18)" : "rgba(8,8,10,.24)");
  ctx.fillStyle = lowerShade;
  ctx.fillRect(0, 0, width, height);

  for (let index = 0; index < scene.dust.length; index += 1) {
    const dust = scene.dust[index];
    ctx.fillStyle = `rgba(255,247,232,${0.06 + (dust.radius * 0.02)})`;
    ctx.beginPath();
    ctx.arc(dust.x * width, dust.y * height, dust.radius, 0, TAU);
    ctx.fill();
  }

  const vignette = ctx.createRadialGradient(width * 0.5, height * 0.48, height * 0.12, width * 0.5, height * 0.48, height * 0.76);
  vignette.addColorStop(0.56, "rgba(0,0,0,0)");
  vignette.addColorStop(1, scene.mode === "intro" ? "rgba(3,4,8,.44)" : "rgba(3,4,8,.28)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

function drawIntroRibbons(ctx, width, height, time) {
  ctx.save();
  ctx.translate(width * 0.5, height * 0.48);
  for (let index = 0; index < 18; index += 1) {
    const p = index / 17;
    const alpha = 0.1 + p * 0.08;
    const spread = lerp(width * 0.18, width * 0.42, p);
    ctx.strokeStyle = `rgba(255,${Math.round(104 + p * 80)},${Math.round(120 + p * 36)},${alpha})`;
    ctx.lineWidth = 5 - p * 2.1;
    ctx.beginPath();
    ctx.moveTo(-spread, Math.sin((p * 2.4 + time * 1.8) * Math.PI) * 24 - 12);
    ctx.bezierCurveTo(
      -spread * 0.34,
      -84 + Math.sin(time * 2.2 + p * 5) * 18,
      spread * 0.18,
      82 + Math.cos(time * 1.6 + p * 4.4) * 22,
      spread,
      Math.sin((p * 2.8 + time * 2.1) * Math.PI) * 34 + 12
    );
    ctx.stroke();
  }
  ctx.restore();
}

function drawIntroDaughter(ctx, width, height, t) {
  const alpha = 1 - smoothstep(0.82, 1, t);
  if (alpha <= 0) {
    return;
  }
  ctx.save();
  ctx.globalAlpha = 0.9 * alpha;
  ctx.translate(width * lerp(0.28, 0.44, smoothstep(0.02, 0.44, t)), height * lerp(0.72, 0.52, smoothstep(0.02, 0.44, t)));
  ctx.rotate(lerp(-0.6, -0.12, t));
  ctx.strokeStyle = "rgba(255,110,132,.68)";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(-56, 18);
  ctx.quadraticCurveTo(-18, -48, 48, -12);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,222,202,.28)";
  ctx.beginPath();
  ctx.ellipse(0, -6, 18, 24, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "rgba(255,242,226,.22)";
  ctx.beginPath();
  ctx.moveTo(-16, 18);
  ctx.quadraticCurveTo(0, -22, 22, 16);
  ctx.quadraticCurveTo(4, 40, -16, 18);
  ctx.fill();
  ctx.restore();
}

function drawIntroCorridor(ctx, width, height, t) {
  const corridorT = smoothstep(0.28, 0.78, t);
  if (corridorT <= 0) {
    return;
  }
  ctx.save();
  ctx.globalAlpha = corridorT;
  const vanishX = lerp(width * 0.68, width * 0.55, corridorT);
  const floorTop = lerp(height * 0.68, height * 0.58, corridorT);
  ctx.fillStyle = "rgba(190,196,208,.78)";
  ctx.beginPath();
  ctx.moveTo(width * 0.06, height * 0.9);
  ctx.lineTo(vanishX, floorTop);
  ctx.lineTo(vanishX, height * 0.16);
  ctx.lineTo(width * 0.06, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(236,230,220,.68)";
  ctx.beginPath();
  ctx.moveTo(width * 0.42, height * 0.92);
  ctx.lineTo(vanishX, floorTop);
  ctx.lineTo(vanishX, height * 0.18);
  ctx.lineTo(width * 0.94, 0);
  ctx.lineTo(width, 0);
  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(58,70,88,.94)";
  ctx.fillRect(width * 0.36, height * 0.33, width * 0.12, height * 0.08);
  ctx.fillStyle = "rgba(255,244,220,.66)";
  ctx.font = `600 ${Math.round(Math.max(18, width * 0.022))}px "DM Mono", monospace`;
  ctx.fillText("LM402", width * 0.378, height * 0.384);

  for (let index = 0; index < 6; index += 1) {
    const lineY = lerp(height * 0.1, height * 0.88, index / 5);
    ctx.strokeStyle = `rgba(255,255,255,${0.04 + index * 0.014})`;
    ctx.lineWidth = index === 0 ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(width * 0.06, lineY);
    ctx.lineTo(vanishX, lerp(height * 0.14, floorTop, index / 5));
    ctx.stroke();
  }
  ctx.restore();
}

function drawIntroSunlight(ctx, width, height, t) {
  const sunT = smoothstep(0.52, 0.94, t);
  if (sunT <= 0) {
    return;
  }
  const sunlight = ctx.createRadialGradient(width * 0.82, height * 0.18, 20, width * 0.76, height * 0.24, width * 0.4);
  sunlight.addColorStop(0, `rgba(255,236,188,${0.78 * sunT})`);
  sunlight.addColorStop(0.4, `rgba(255,228,170,${0.22 * sunT})`);
  sunlight.addColorStop(1, "rgba(255,228,170,0)");
  ctx.fillStyle = sunlight;
  ctx.fillRect(0, 0, width, height);

  for (let index = 0; index < 4; index += 1) {
    const offset = index * width * 0.042;
    ctx.fillStyle = `rgba(255,228,170,${0.08 + index * 0.026})`;
    ctx.beginPath();
    ctx.moveTo(width * 0.82 + offset, height * 0.14);
    ctx.lineTo(width * 0.88 + offset, height * 0.16);
    ctx.lineTo(width * 0.56 - index * 20, height * 0.96);
    ctx.lineTo(width * 0.5 - index * 18, height * 0.96);
    ctx.closePath();
    ctx.fill();
  }
}

function renderIntro(ctx, width, height, scene) {
  const t = clamp(scene.intro.progress, 0, 1);
  const time = scene.intro.time || 0;
  ctx.clearRect(0, 0, width, height);

  const background = ctx.createLinearGradient(0, 0, 0, height);
  background.addColorStop(0, "#030307");
  background.addColorStop(0.42, "#0d1118");
  background.addColorStop(1, "#06070a");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  drawIntroRibbons(ctx, width, height, time);
  drawIntroDaughter(ctx, width, height, t);
  drawIntroCorridor(ctx, width, height, t);
  drawIntroSunlight(ctx, width, height, t);

  const settle = smoothstep(0.74, 1, t);
  if (settle > 0) {
    ctx.save();
    ctx.globalAlpha = settle;
    ctx.fillStyle = "rgba(14,18,26,.54)";
    ctx.fillRect(width * 0.02, height * 0.68, width * 0.96, height * 0.18);
    ctx.fillStyle = "rgba(255,246,226,.16)";
    ctx.fillRect(width * 0.02, height * 0.72, width * 0.96, height * 0.012);
    ctx.restore();
  }
}

export function createLm402Renderer(canvas) {
  const ctx = canvas.getContext("2d");
  const sprites = buildSprites();
  const dust = Array.from({ length: 58 }, (_, index) => ({
    x: (index * 0.173) % 1,
    y: (index * 0.097) % 1,
    radius: 0.8 + (index % 4) * 0.8,
  }));
  let width = 0;
  let height = 0;
  let dpr = 1;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;
    width = Math.max(1, Math.round(rect.width * dpr));
    height = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }

  function render(scene) {
    resize();
    const displayWidth = width / dpr;
    const displayHeight = height / dpr;
    ctx.clearRect(0, 0, displayWidth, displayHeight);
    const focalScale = scene.layout?.focalScale ?? 1.08;
    const focal = Math.min(displayWidth, displayHeight) * focalScale;

    if (scene.mode === "intro") {
      renderIntro(ctx, displayWidth, displayHeight, scene);
      drawScreenFx(ctx, displayWidth, displayHeight, { mode: "intro", dust });
      return { width: displayWidth, height: displayHeight, sprites, dust };
    }

    const commands = [];
    const renderScene = { ...scene, sprites, dust };
    drawFloorGrid(ctx, scene.camera, displayWidth, displayHeight, focal);
    buildEnvironment(commands, scene.camera, displayWidth, displayHeight, focal, renderScene);
    drawCommands(ctx, commands);
    drawOverlayLabels(ctx, scene.camera, displayWidth, displayHeight, focal, renderScene);
    drawScreenFx(ctx, displayWidth, displayHeight, renderScene);

    if (scene.phase === "eye_contact" && scene.cinematicGlow > 0.02) {
      const projected = project(scene.characters.junior.position, scene.camera, displayWidth, displayHeight, focal);
      if (projected) {
        const bloom = ctx.createRadialGradient(projected.x + 18, projected.y - 82, 20, projected.x + 18, projected.y - 82, 210);
        bloom.addColorStop(0, `rgba(255,236,190,${0.34 * scene.cinematicGlow})`);
        bloom.addColorStop(0.55, `rgba(255,236,190,${0.14 * scene.cinematicGlow})`);
        bloom.addColorStop(1, "rgba(255,236,190,0)");
        ctx.fillStyle = bloom;
        ctx.fillRect(0, 0, displayWidth, displayHeight);
      }
    }

    return { width: displayWidth, height: displayHeight, sprites, dust };
  }

  return { render };
}
