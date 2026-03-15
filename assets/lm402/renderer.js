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

function makeSprite(draw, width = 220, height = 440) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  draw(ctx, width, height);
  return canvas;
}

function buildSprites() {
  return {
    senior: makeSprite((ctx, w, h) => {
      const skin = "#e2b99d";
      const hair = "#241918";
      const shirt = "#38506e";
      const pants = "#10161f";
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(0,0,0,.22)";
      ctx.beginPath();
      ctx.ellipse(w / 2, h - 28, 64, 16, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = shirt;
      ctx.beginPath();
      ctx.moveTo(w * 0.33, h * 0.36);
      ctx.quadraticCurveTo(w * 0.5, h * 0.28, w * 0.67, h * 0.36);
      ctx.lineTo(w * 0.72, h * 0.69);
      ctx.quadraticCurveTo(w * 0.5, h * 0.75, w * 0.28, h * 0.69);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = pants;
      ctx.fillRect(w * 0.37, h * 0.68, 28, 126);
      ctx.fillRect(w * 0.52, h * 0.68, 28, 126);
      ctx.fillStyle = skin;
      ctx.fillRect(w * 0.3, h * 0.42, 20, 124);
      ctx.fillRect(w * 0.68, h * 0.42, 20, 124);
      ctx.beginPath();
      ctx.ellipse(w / 2, h * 0.18, 62, 70, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = hair;
      ctx.beginPath();
      ctx.moveTo(w * 0.25, h * 0.2);
      ctx.quadraticCurveTo(w * 0.31, h * 0.06, w * 0.5, h * 0.07);
      ctx.quadraticCurveTo(w * 0.73, h * 0.07, w * 0.78, h * 0.23);
      ctx.lineTo(w * 0.74, h * 0.15);
      ctx.quadraticCurveTo(w * 0.61, h * 0.11, w * 0.49, h * 0.12);
      ctx.quadraticCurveTo(w * 0.34, h * 0.13, w * 0.27, h * 0.22);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(55,32,28,.55)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(w * 0.39, h * 0.18);
      ctx.lineTo(w * 0.46, h * 0.175);
      ctx.moveTo(w * 0.54, h * 0.175);
      ctx.lineTo(w * 0.61, h * 0.18);
      ctx.stroke();
      ctx.fillStyle = "#1d1918";
      ctx.beginPath();
      ctx.ellipse(w * 0.43, h * 0.205, 7, 9, 0, 0, TAU);
      ctx.ellipse(w * 0.57, h * 0.205, 7, 9, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "rgba(106,54,48,.64)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(w * 0.43, h * 0.24);
      ctx.quadraticCurveTo(w * 0.5, h * 0.255, w * 0.57, h * 0.24);
      ctx.stroke();
    }),
    junior: makeSprite((ctx, w, h) => {
      const skin = "#f0cab3";
      const hair = "#201515";
      const shirt = "#f7f4ee";
      const shorts = "#5d83b6";
      ctx.clearRect(0, 0, w, h);
      const glow = ctx.createRadialGradient(w * 0.58, h * 0.18, 20, w * 0.56, h * 0.18, 150);
      glow.addColorStop(0, "rgba(255,236,184,.82)");
      glow.addColorStop(0.4, "rgba(255,225,166,.35)");
      glow.addColorStop(1, "rgba(255,225,166,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.ellipse(w * 0.58, h * 0.18, 120, 146, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,.18)";
      ctx.beginPath();
      ctx.ellipse(w / 2, h - 24, 60, 14, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = shirt;
      ctx.beginPath();
      ctx.moveTo(w * 0.35, h * 0.32);
      ctx.quadraticCurveTo(w * 0.5, h * 0.28, w * 0.65, h * 0.32);
      ctx.lineTo(w * 0.7, h * 0.62);
      ctx.quadraticCurveTo(w * 0.5, h * 0.69, w * 0.3, h * 0.62);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = shorts;
      ctx.fillRect(w * 0.36, h * 0.61, 35, 62);
      ctx.fillRect(w * 0.49, h * 0.61, 35, 62);
      ctx.fillStyle = skin;
      ctx.fillRect(w * 0.37, h * 0.67, 26, 128);
      ctx.fillRect(w * 0.5, h * 0.67, 26, 128);
      ctx.fillRect(w * 0.3, h * 0.37, 20, 115);
      ctx.fillRect(w * 0.68, h * 0.36, 20, 110);
      ctx.beginPath();
      ctx.ellipse(w * 0.51, h * 0.18, 56, 70, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = hair;
      ctx.beginPath();
      ctx.moveTo(w * 0.29, h * 0.19);
      ctx.quadraticCurveTo(w * 0.3, h * 0.04, w * 0.52, h * 0.05);
      ctx.quadraticCurveTo(w * 0.72, h * 0.06, w * 0.74, h * 0.22);
      ctx.lineTo(w * 0.69, h * 0.31);
      ctx.quadraticCurveTo(w * 0.59, h * 0.27, w * 0.51, h * 0.27);
      ctx.quadraticCurveTo(w * 0.42, h * 0.27, w * 0.34, h * 0.31);
      ctx.lineTo(w * 0.3, h * 0.23);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(w * 0.25, h * 0.19, 24, 108);
      ctx.fillRect(w * 0.73, h * 0.2, 18, 96);
      ctx.strokeStyle = "rgba(59,24,24,.52)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(w * 0.41, h * 0.18);
      ctx.lineTo(w * 0.47, h * 0.172);
      ctx.moveTo(w * 0.55, h * 0.172);
      ctx.lineTo(w * 0.61, h * 0.18);
      ctx.stroke();
      ctx.fillStyle = "#251a18";
      ctx.beginPath();
      ctx.ellipse(w * 0.44, h * 0.205, 6, 9, 0, 0, TAU);
      ctx.ellipse(w * 0.58, h * 0.205, 6, 9, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "rgba(152,94,92,.62)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(w * 0.43, h * 0.246);
      ctx.quadraticCurveTo(w * 0.5, h * 0.26, w * 0.58, h * 0.244);
      ctx.stroke();
    }),
    fatherEcho: makeSprite((ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const glow = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, 180);
      glow.addColorStop(0, "rgba(255,216,170,.42)");
      glow.addColorStop(1, "rgba(255,216,170,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "rgba(255,230,200,.2)";
      ctx.beginPath();
      ctx.ellipse(w / 2, h * 0.18, 58, 74, 0, 0, TAU);
      ctx.fill();
      ctx.fillRect(w * 0.34, h * 0.33, w * 0.32, h * 0.38);
    }),
    auntEcho: makeSprite((ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const glow = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, 180);
      glow.addColorStop(0, "rgba(255,182,202,.4)");
      glow.addColorStop(1, "rgba(255,182,202,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "rgba(255,224,234,.22)";
      ctx.beginPath();
      ctx.ellipse(w * 0.52, h * 0.18, 56, 76, 0, 0, TAU);
      ctx.fill();
      ctx.fillRect(w * 0.35, h * 0.32, w * 0.3, h * 0.42);
    }),
    hotspot: makeSprite((ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const grad = ctx.createRadialGradient(w / 2, h / 2, 12, w / 2, h / 2, 84);
      grad.addColorStop(0, "rgba(255,248,238,.82)");
      grad.addColorStop(0.2, "rgba(255,244,224,.26)");
      grad.addColorStop(1, "rgba(255,244,224,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 88, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,248,236,.66)";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 42, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,248,236,.22)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 62, 0, TAU);
      ctx.stroke();
    }, 180, 180),
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
  if (cam.z <= 14) {
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
  for (let z = 120; z <= 1500; z += 90) {
    const alpha = 0.14 + ((z / 1600) * 0.12);
    const color = z < 330 ? "rgba(210,214,226," : "rgba(146,148,152,";
    const p1 = project({ x: WORLD.minX, y: 0.6, z }, camera, width, height, focal);
    const p2 = project({ x: WORLD.maxX, y: 0.6, z }, camera, width, height, focal);
    if (!p1 || !p2) {
      continue;
    }
    ctx.strokeStyle = `${color}${alpha})`;
    ctx.lineWidth = z < 330 ? 1.3 : 1;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }
  for (let x = -520; x <= 340; x += 86) {
    const p1 = project({ x, y: 0.6, z: WORLD.minZ }, camera, width, height, focal);
    const p2 = project({ x, y: 0.6, z: WORLD.maxZ }, camera, width, height, focal);
    if (!p1 || !p2) {
      continue;
    }
    ctx.strokeStyle = x < -220 ? "rgba(208,214,228,.12)" : "rgba(142,136,124,.07)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }
  ctx.restore();
}

function makeCharacterState(scene) {
  return {
    senior: scene.characters.senior,
    junior: scene.characters.junior,
    fatherEcho: scene.characters.fatherEcho,
    auntEcho: scene.characters.auntEcho,
  };
}

function buildEnvironment(commands, camera, width, height, focal, scene) {
  for (let z = WORLD.minZ; z < WORLD.maxZ; z += 92) {
    const z2 = Math.min(z + 92, WORLD.maxZ);
    const classroomTone = z % 184 === 0 ? "rgba(120,110,94,.9)" : "rgba(110,102,88,.86)";
    const corridorTone = z % 184 === 0 ? "rgba(176,182,196,.95)" : "rgba(168,174,188,.92)";
    pushQuad(
      commands,
      camera,
      width,
      height,
      focal,
      [
        { x: -220, y: 0, z },
        { x: 340, y: 0, z },
        { x: 340, y: 0, z: z2 },
        { x: -220, y: 0, z: z2 },
      ],
      classroomTone
    );
    pushQuad(
      commands,
      camera,
      width,
      height,
      focal,
      [
        { x: WORLD.minX, y: 0, z },
        { x: -220, y: 0, z },
        { x: -220, y: 0, z: z2 },
        { x: WORLD.minX, y: 0, z: z2 },
      ],
      corridorTone
    );
    pushQuad(
      commands,
      camera,
      width,
      height,
      focal,
      [
        { x: WORLD.maxX, y: 0, z },
        { x: WORLD.maxX, y: 0, z: z2 },
        { x: WORLD.maxX, y: 264, z: z2 },
        { x: WORLD.maxX, y: 264, z },
      ],
      "rgba(216,208,198,.86)"
    );
    pushQuad(
      commands,
      camera,
      width,
      height,
      focal,
      [
        { x: WORLD.minX, y: 0, z },
        { x: WORLD.minX, y: 0, z: z2 },
        { x: WORLD.minX, y: 264, z: z2 },
        { x: WORLD.minX, y: 264, z },
      ],
      "rgba(188,194,208,.82)"
    );
  }

  pushQuad(
    commands,
    camera,
    width,
    height,
    focal,
    [
      { x: WORLD.minX, y: 0, z: WORLD.minZ },
      { x: WORLD.maxX, y: 0, z: WORLD.minZ },
      { x: WORLD.maxX, y: 264, z: WORLD.minZ },
      { x: WORLD.minX, y: 264, z: WORLD.minZ },
    ],
    "rgba(220,220,224,.74)"
  );

  const dividerSegments = [
    { z1: WORLD.minZ, z2: WORLD.frontDoor.z1 },
    { z1: WORLD.frontDoor.z2, z2: WORLD.backDoor.z1 },
    { z1: WORLD.backDoor.z2, z2: WORLD.maxZ },
  ];
  dividerSegments.forEach((segment) => {
    pushQuad(
      commands,
      camera,
      width,
      height,
      focal,
      [
        { x: WORLD.dividerX, y: 0, z: segment.z1 },
        { x: WORLD.dividerX, y: 0, z: segment.z2 },
        { x: WORLD.dividerX, y: 250, z: segment.z2 },
        { x: WORLD.dividerX, y: 250, z: segment.z1 },
      ],
      "rgba(205,210,214,.88)"
    );
  });

  pushQuad(
    commands,
    camera,
    width,
    height,
    focal,
    [
      { x: -220, y: 0, z: WORLD.frontDoor.z1 },
      { x: -220, y: 0, z: WORLD.frontDoor.z2 },
      { x: -220, y: 220, z: WORLD.frontDoor.z2 },
      { x: -220, y: 220, z: WORLD.frontDoor.z1 },
    ],
    "rgba(252,250,246,.06)",
    "rgba(255,255,255,.18)"
  );
  pushQuad(
    commands,
    camera,
    width,
    height,
    focal,
    [
      { x: -220, y: 0, z: WORLD.backDoor.z1 },
      { x: -220, y: 0, z: WORLD.backDoor.z2 },
      { x: -220, y: 220, z: WORLD.backDoor.z2 },
      { x: -220, y: 220, z: WORLD.backDoor.z1 },
    ],
    "rgba(252,250,246,.04)",
    "rgba(255,255,255,.18)"
  );

  pushQuad(
    commands,
    camera,
    width,
    height,
    focal,
    [
      { x: WORLD.board.x1, y: WORLD.board.y1, z: WORLD.board.z },
      { x: WORLD.board.x2, y: WORLD.board.y1, z: WORLD.board.z },
      { x: WORLD.board.x2, y: WORLD.board.y2, z: WORLD.board.z },
      { x: WORLD.board.x1, y: WORLD.board.y2, z: WORLD.board.z },
    ],
    "rgba(32,56,44,.94)",
    "rgba(182,206,190,.22)"
  );

  WORLD.windows.forEach((windowPanel) => {
    pushQuad(
      commands,
      camera,
      width,
      height,
      focal,
      [
        { x: WORLD.maxX - 2, y: windowPanel.y1, z: windowPanel.z - 80 },
        { x: WORLD.maxX - 2, y: windowPanel.y1, z: windowPanel.z + 80 },
        { x: WORLD.maxX - 2, y: windowPanel.y2, z: windowPanel.z + 80 },
        { x: WORLD.maxX - 2, y: windowPanel.y2, z: windowPanel.z - 80 },
      ],
      "rgba(255,244,214,.36)"
    );
  });

  WORLD.lightBeams.forEach((beam) => {
    pushQuad(
      commands,
      camera,
      width,
      height,
      focal,
      [
        { x: WORLD.maxX - 3, y: 216, z: beam.z - beam.width / 2 },
        { x: WORLD.maxX - 3, y: 216, z: beam.z + beam.width / 2 },
        { x: WORLD.maxX - beam.reach, y: 0, z: beam.z + beam.width * 0.9 },
        { x: WORLD.maxX - beam.reach + 36, y: 0, z: beam.z - beam.width * 0.92 },
      ],
      `rgba(255,227,160,${beam.alpha})`
    );
  });

  WORLD.desks.forEach((desk) => {
    const x1 = desk.x - 52;
    const x2 = desk.x + 52;
    const z1 = desk.z - 38;
    const z2 = desk.z + 38;
    pushQuad(
      commands,
      camera,
      width,
      height,
      focal,
      [
        { x: x1, y: 74, z: z1 },
        { x: x2, y: 74, z: z1 },
        { x: x2, y: 74, z: z2 },
        { x: x1, y: 74, z: z2 },
      ],
      "rgba(126,88,52,.96)",
      "rgba(64,36,22,.28)"
    );
    pushQuad(
      commands,
      camera,
      width,
      height,
      focal,
      [
        { x: x1, y: 0, z: z2 },
        { x: x2, y: 0, z: z2 },
        { x: x2, y: 74, z: z2 },
        { x: x1, y: 74, z: z2 },
      ],
      "rgba(74,52,34,.74)"
    );
    pushQuad(
      commands,
      camera,
      width,
      height,
      focal,
      [
        { x: x2, y: 0, z: z1 },
        { x: x2, y: 0, z: z2 },
        { x: x2, y: 74, z: z2 },
        { x: x2, y: 74, z: z1 },
      ],
      "rgba(88,58,36,.66)"
    );
  });

  pushQuad(
    commands,
    camera,
    width,
    height,
    focal,
    [
      { x: WORLD.plaque.x - 30, y: 162, z: WORLD.plaque.z - 2 },
      { x: WORLD.plaque.x + 30, y: 162, z: WORLD.plaque.z - 2 },
      { x: WORLD.plaque.x + 30, y: 210, z: WORLD.plaque.z - 2 },
      { x: WORLD.plaque.x - 30, y: 210, z: WORLD.plaque.z - 2 },
    ],
    "rgba(52,62,74,.96)",
    "rgba(255,255,255,.18)"
  );

  const characterState = makeCharacterState(scene);
  if (characterState.fatherEcho.alpha > 0.02) {
    pushBillboard(
      commands,
      camera,
      width,
      height,
      focal,
      characterState.fatherEcho.position,
      scene.sprites.fatherEcho,
      { w: 18, h: 46 },
      characterState.fatherEcho.alpha
    );
  }
  if (characterState.auntEcho.alpha > 0.02) {
    pushBillboard(
      commands,
      camera,
      width,
      height,
      focal,
      characterState.auntEcho.position,
      scene.sprites.auntEcho,
      { w: 18, h: 46 },
      characterState.auntEcho.alpha
    );
  }

  pushBillboard(
    commands,
    camera,
    width,
    height,
    focal,
    characterState.senior.position,
    scene.sprites.senior,
    { w: 16, h: 44 },
    0.98,
    { type: "character", id: "senior" }
  );
  pushBillboard(
    commands,
    camera,
    width,
    height,
    focal,
    characterState.junior.position,
    scene.sprites.junior,
    { w: 16, h: 42 },
    0.98,
    { type: "character", id: "junior", glow: scene.phase === "eye_contact" ? 1 : 0 }
  );

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
      { x: hotspot.x, y: hotspot.y + 18, z: hotspot.z },
      scene.sprites.hotspot,
      { w: hotspot.active ? 42 : 34, h: hotspot.active ? 42 : 34 },
      hotspot.active ? 0.9 : 0.4,
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
      ctx.shadowBlur = 32;
      ctx.shadowColor = "rgba(255,230,184,.7)";
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
    const screen = project({ x: hotspot.x, y: hotspot.y + 34, z: hotspot.z }, camera, width, height, focal);
    if (!screen) {
      return;
    }
    ctx.save();
    ctx.translate(screen.x, screen.y);
    const label = hotspot.label;
    ctx.font = "500 12px 'DM Mono', monospace";
    const textWidth = ctx.measureText(label).width;
    ctx.fillStyle = hotspot.active ? "rgba(7,14,14,.92)" : "rgba(10,10,14,.78)";
    ctx.strokeStyle = hotspot.active ? "rgba(255,242,218,.42)" : "rgba(255,255,255,.12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(-textWidth / 2 - 12, -14, textWidth + 24, 28, 14);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = hotspot.active ? "rgba(255,244,216,.96)" : "rgba(236,236,236,.74)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, 0, 1);
    ctx.restore();
  });
}

function drawScreenFx(ctx, width, height, scene) {
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, scene.mode === "intro" ? "#0e0d16" : "#d6d9e4");
  sky.addColorStop(0.36, scene.mode === "intro" ? "#14131d" : "#eef0f4");
  sky.addColorStop(1, scene.mode === "intro" ? "#09090d" : "#c1b39b");
  ctx.globalCompositeOperation = "destination-over";
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = "source-over";

  const haze = ctx.createRadialGradient(width * 0.78, height * 0.2, 40, width * 0.7, height * 0.28, width * 0.7);
  haze.addColorStop(0, "rgba(255,232,190,.42)");
  haze.addColorStop(0.45, "rgba(255,232,190,.11)");
  haze.addColorStop(1, "rgba(255,232,190,0)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(255,255,255,.03)";
  for (let index = 0; index < scene.dust.length; index += 1) {
    const dust = scene.dust[index];
    ctx.beginPath();
    ctx.arc(dust.x * width, dust.y * height, dust.radius, 0, TAU);
    ctx.fill();
  }
}

function renderIntro(ctx, width, height, scene) {
  const t = clamp(scene.intro.progress, 0, 1);
  ctx.clearRect(0, 0, width, height);
  const background = ctx.createLinearGradient(0, 0, 0, height);
  background.addColorStop(0, "#06060a");
  background.addColorStop(0.45, "#0d101a");
  background.addColorStop(1, "#040406");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  const centerX = width * lerp(0.25, 0.57, smoothstep(0.18, 0.82, t));
  const centerY = height * lerp(0.72, 0.46, smoothstep(0.05, 0.88, t));

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(lerp(-0.65, 0.18, t));
  for (let index = 0; index < 24; index += 1) {
    const p = index / 23;
    const alpha = 0.08 + p * 0.06;
    const px = lerp(-width * 0.34, width * 0.34, p);
    const py = Math.sin(p * Math.PI * 2.2 + t * 6) * 42;
    ctx.strokeStyle = `rgba(255,${Math.round(110 + p * 70)},${Math.round(120 + p * 30)},${alpha})`;
    ctx.lineWidth = 6 - p * 2.5;
    ctx.beginPath();
    ctx.moveTo(px - 56, py - 8);
    ctx.quadraticCurveTo(px, py, px + 56, py + 8);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.translate(width * 0.54, height * 0.54);
  const scale = lerp(0.22, 1, smoothstep(0.52, 0.98, t));
  ctx.scale(scale, scale);
  ctx.globalAlpha = smoothstep(0.44, 0.92, t);
  ctx.fillStyle = "rgba(236,240,248,.16)";
  ctx.fillRect(-260, -96, 520, 192);
  ctx.fillStyle = "rgba(255,248,236,.32)";
  ctx.fillRect(-180, -84, 30, 40);
  ctx.fillRect(-144, -84, 30, 40);
  ctx.fillStyle = "rgba(54,68,86,.78)";
  ctx.fillRect(-210, -18, 76, 56);
  ctx.fillStyle = "rgba(90,88,86,.8)";
  ctx.fillRect(-210, 44, 360, 18);
  ctx.restore();

  const glow = ctx.createRadialGradient(width * 0.72, height * 0.32, 10, width * 0.72, height * 0.32, width * 0.32);
  glow.addColorStop(0, "rgba(255,236,196,.58)");
  glow.addColorStop(0.4, "rgba(255,236,196,.14)");
  glow.addColorStop(1, "rgba(255,236,196,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
}

export function createLm402Renderer(canvas) {
  const ctx = canvas.getContext("2d");
  const sprites = buildSprites();
  const dust = Array.from({ length: 42 }, (_, index) => ({
    x: (index * 0.173) % 1,
    y: (index * 0.097) % 1,
    radius: 0.8 + (index % 3) * 0.8,
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
    const focal = Math.min(displayWidth, displayHeight) * 1.18;

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
        const bloom = ctx.createRadialGradient(projected.x, projected.y - 80, 20, projected.x, projected.y - 80, 180);
        bloom.addColorStop(0, `rgba(255,236,190,${0.22 * scene.cinematicGlow})`);
        bloom.addColorStop(0.55, `rgba(255,236,190,${0.08 * scene.cinematicGlow})`);
        bloom.addColorStop(1, "rgba(255,236,190,0)");
        ctx.fillStyle = bloom;
        ctx.fillRect(0, 0, displayWidth, displayHeight);
      }
    }

    return { width: displayWidth, height: displayHeight, sprites, dust };
  }

  return { render };
}
