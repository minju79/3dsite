import * as THREE from 'three';

export interface TextureBundle {
  tigerBody: THREE.CanvasTexture;
  tigerFace: THREE.CanvasTexture;
  tigerTail: THREE.CanvasTexture;
  tigerFurBump: THREE.CanvasTexture;
  roadAlbedo: THREE.CanvasTexture;
  roadBump: THREE.CanvasTexture;
  stoneWall: THREE.CanvasTexture;
  rattanAlbedo: THREE.CanvasTexture;
  saekdongScarf: THREE.CanvasTexture;
  indigoWaveScarf: THREE.CanvasTexture;
  taegeukgiFlag: THREE.CanvasTexture;
  heartSprite: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  petalSprite: THREE.CanvasTexture;
  dispose: () => void;
}

function finalizeColorTexture(
  canvas: HTMLCanvasElement,
  anisotropy: number,
  repeatX = 1,
  repeatY = 1
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  if (repeatX !== 1 || repeatY !== 1) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
  }
  tex.needsUpdate = true;
  return tex;
}

function finalizeDataTexture(
  canvas: HTMLCanvasElement,
  anisotropy: number,
  repeatX = 1,
  repeatY = 1
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.NoColorSpace;
  tex.anisotropy = anisotropy;
  if (repeatX !== 1 || repeatY !== 1) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
  }
  tex.needsUpdate = true;
  return tex;
}

function drawFurStrokes(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  count: number,
  alpha: number
) {
  ctx.save();
  for (let i = 0; i < count; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const len = 6 + Math.random() * 14;
    ctx.strokeStyle =
      Math.random() > 0.5
        ? `rgba(255, 226, 175, ${alpha})`
        : `rgba(165, 76, 12, ${alpha * 0.85})`;
    ctx.lineWidth = 1 + Math.random() * 1.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 4, y + len);
    ctx.stroke();
  }
  ctx.restore();
}

function createTigerBodyCanvas(): HTMLCanvasElement {
  const w = 512;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Warm Korean tiger orange-amber coat
  const grad = ctx.createLinearGradient(0, 0, w, 0);
  grad.addColorStop(0.0, '#eb7f23');
  grad.addColorStop(0.25, '#f6932e');
  grad.addColorStop(0.5, '#f99e3a');
  grad.addColorStop(0.75, '#f6932e');
  grad.addColorStop(1.0, '#eb7f23');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Soft fur texture strokes
  drawFurStrokes(ctx, w, h, 2400, 0.14);

  // Cream-ivory chest/belly stripe down the front center (u = 0.25 or 0.75 depending on UV)
  // On Three.js SphereGeometry: u=0.25 is +Z (front) when unrotated? Wait: SphereGeometry phi starts at -X?
  // Actually let's check: Three.js SphereGeometry vertex x = -r cos(phi) sin(theta), z = r sin(phi) sin(theta).
  // So phi=0 (u=0) -> -X; phi=PI/2 (u=0.25) -> +Z (front!); phi=PI (u=0.5) -> +X; phi=3PI/2 (u=0.75) -> -Z (back!).
  // Wait: let's keep belly as a separate sculpted cream belly patch mesh so UV alignment is 100% foolproof,
  // and put rich organic tiger stripes wrapping nicely around the torso & limbs!
  ctx.fillStyle = '#231b16';
  const stripeRows = 7;
  for (let r = 0; r < stripeRows; r++) {
    const yBase = 48 + r * 62;
    for (let s = 0; s < 5; s++) {
      const xCenter = (s + 0.5) * (w / 5) + (r % 2) * 38;
      ctx.save();
      ctx.translate(xCenter % w, yBase);
      ctx.rotate((s % 2 === 0 ? 1 : -1) * 0.14);
      ctx.beginPath();
      const sw = 32 + Math.sin(r * 1.7 + s) * 14;
      const sh = 9 + (r % 3) * 2;
      ctx.moveTo(-sw, 0);
      ctx.quadraticCurveTo(0, -sh, sw, 0);
      ctx.quadraticCurveTo(0, sh * 0.85, -sw, 0);
      ctx.fill();
      ctx.restore();
    }
  }

  return canvas;
}

function createTigerFaceCanvas(): HTMLCanvasElement {
  const w = 512;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Base warm orange
  ctx.fillStyle = '#f6932e';
  ctx.fillRect(0, 0, w, h);
  drawFurStrokes(ctx, w, h, 2000, 0.15);

  // On SphereGeometry: u=0.25 (x = 128) is +Z (front of face!) if unrotated,
  // OR if we rotate head mesh Y by -PI/2 so +Z aligns with u=0.5 (x = 256), centering the face texture at x=256 is super clean!
  // Let's draw the face centered at x = 256 (u = 0.5) and rotate head sphere geometry by +Math.PI / 2?
  // Wait: at phi = PI (u = 0.5): x = -r cos(PI) = +r (+X), z = r sin(PI) = 0.
  // Rotating sphere around Y by -PI/2 maps +X to +Z! Let's verify: (x, 0, 0) rotated -PI/2 around Y -> (0, 0, +x). YES!
  const cx = 256;

  // Creamy white cheek & lower muzzle glow
  const cheekGrad = ctx.createRadialGradient(cx, 310, 20, cx, 315, 115);
  cheekGrad.addColorStop(0, '#fff7e8');
  cheekGrad.addColorStop(0.75, '#fcede0');
  cheekGrad.addColorStop(1, 'rgba(246, 147, 46, 0)');
  ctx.fillStyle = cheekGrad;
  ctx.beginPath();
  ctx.ellipse(cx, 318, 122, 88, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cute Korean folk-tiger "王" (King) forehead stripes centered at (cx, 155)
  ctx.strokeStyle = '#231b16';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Three horizontal bars of 王
  ctx.lineWidth = 9;
  const bars = [
    { y: 126, hw: 26 },
    { y: 152, hw: 20 },
    { y: 178, hw: 30 },
  ];
  for (const b of bars) {
    ctx.beginPath();
    ctx.moveTo(cx - b.hw, b.y);
    ctx.quadraticCurveTo(cx, b.y + 4, cx + b.hw, b.y);
    ctx.stroke();
  }
  // Vertical spine of 王
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(cx, 125);
  ctx.lineTo(cx, 180);
  ctx.stroke();

  // Cheek stripes (3 curved stripes each side)
  ctx.fillStyle = '#231b16';
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const y = 240 + i * 28;
      ctx.save();
      ctx.translate(cx + side * 125, y);
      ctx.rotate(side * (-0.18 + i * 0.14));
      ctx.beginPath();
      ctx.ellipse(0, 0, 36, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Back-of-head stripes
    for (let i = 0; i < 4; i++) {
      const y = 140 + i * 52;
      ctx.save();
      ctx.translate(cx + side * 210, y);
      ctx.beginPath();
      ctx.ellipse(0, 0, 40, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  return canvas;
}

function createTigerTailCanvas(): HTMLCanvasElement {
  const w = 256;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f6932e';
  ctx.fillRect(0, 0, w, h);

  // Dark stripes along V (y)
  ctx.fillStyle = '#231b16';
  for (let i = 0; i < 5; i++) {
    const y = 22 + i * 48;
    ctx.fillRect(0, y, w, 18);
  }
  drawFurStrokes(ctx, w, h, 800, 0.12);
  return canvas;
}

function createTigerFurBumpCanvas(): HTMLCanvasElement {
  const w = 256;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 3200; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const shade = 90 + Math.floor(Math.random() * 110);
    ctx.strokeStyle = `rgb(${shade},${shade},${shade})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 2, y + 5 + Math.random() * 7);
    ctx.stroke();
  }
  return canvas;
}

function createRoadAlbedoCanvas(): HTMLCanvasElement {
  const w = 512;
  const h = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Base coastal asphalt
  ctx.fillStyle = '#3c424a';
  ctx.fillRect(0, 0, w, h);

  // Subtle asphalt aggregate noise
  for (let i = 0; i < 16000; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const v = 48 + Math.floor(Math.random() * 34);
    ctx.fillStyle = `rgb(${v},${v + 3},${v + 7})`;
    ctx.fillRect(x, y, 2, 2);
  }

  // Left-side (inland) white edge line (x = 24)
  ctx.fillStyle = '#e8edf2';
  ctx.fillRect(22, 0, 10, h);

  // Center yellow dashed line separating car lanes (x = 185)
  ctx.fillStyle = '#f2b830';
  for (let y = 30; y < h; y += 170) {
    ctx.fillRect(180, y, 10, 95);
  }

  // Divider crisp line before coastal bike lane (x = 345)
  ctx.fillStyle = '#f5f7fa';
  ctx.fillRect(340, 0, 8, h);

  // Korean coastal coral-terracotta bicycle lane ("자전거 도로") on the ocean-facing side (x = 352 to 494)
  ctx.fillStyle = '#dd654b';
  ctx.fillRect(352, 0, 140, h);

  // Subtle surface grain on bike lane paint
  for (let i = 0; i < 3500; i++) {
    const x = 352 + Math.random() * 140;
    const y = Math.random() * h;
    ctx.fillStyle =
      Math.random() > 0.5 ? 'rgba(255,235,220,0.08)' : 'rgba(130,36,20,0.09)';
    ctx.fillRect(x, y, 2, 2);
  }

  // Outer white edge line on sea side
  ctx.fillStyle = '#f5f7fa';
  ctx.fillRect(492, 0, 10, h);

  // White bicycle stencil icon painted on the bike lane
  const drawBikeStencil = (cy: number) => {
    ctx.save();
    ctx.translate(422, cy);
    ctx.strokeStyle = 'rgba(248, 252, 255, 0.88)';
    ctx.fillStyle = 'rgba(248, 252, 255, 0.88)';
    ctx.lineWidth = 5;
    // Two wheels
    ctx.beginPath();
    ctx.arc(0, 32, 16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -32, 16, 0, Math.PI * 2);
    ctx.stroke();
    // Frame lines
    ctx.beginPath();
    ctx.moveTo(0, 32);
    ctx.lineTo(-14, 0);
    ctx.lineTo(0, -32);
    ctx.moveTo(-14, 0);
    ctx.lineTo(14, 0);
    ctx.lineTo(0, 32);
    ctx.stroke();
    // Directional chevron arrow ahead
    ctx.beginPath();
    ctx.moveTo(-18, -72);
    ctx.lineTo(0, -96);
    ctx.lineTo(18, -72);
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.restore();
  };

  drawBikeStencil(280);
  drawBikeStencil(790);

  return canvas;
}

function createRoadBumpCanvas(): HTMLCanvasElement {
  const w = 256;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 9000; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const g = 96 + Math.floor(Math.random() * 64);
    ctx.fillStyle = `rgb(${g},${g},${g})`;
    ctx.fillRect(x, y, 2, 2);
  }
  return canvas;
}

function createStoneWallCanvas(): HTMLCanvasElement {
  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Dark volcanic mortar shadow
  ctx.fillStyle = '#25282c';
  ctx.fillRect(0, 0, w, h);

  // Stacked Jeju-style basalt stones
  const rows = 4;
  const rowH = h / rows;
  for (let r = 0; r < rows; r++) {
    let x = (r % 2) * -35;
    while (x < w) {
      const stoneW = 58 + Math.random() * 44;
      const stoneH = rowH - 8;
      const shade = 64 + Math.floor(Math.random() * 34);
      ctx.fillStyle = `rgb(${shade}, ${shade + 2}, ${shade + 5})`;
      ctx.beginPath();
      ctx.roundRect(x + 4, r * rowH + 4, stoneW - 6, stoneH, 10);
      ctx.fill();

      // Porous basalt highlight specks
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      for (let p = 0; p < 8; p++) {
        ctx.fillRect(
          x + 10 + Math.random() * (stoneW - 20),
          r * rowH + 8 + Math.random() * (stoneH - 12),
          3,
          2
        );
      }
      x += stoneW;
    }
  }
  return canvas;
}

function createRattanCanvas(): HTMLCanvasElement {
  const w = 256;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#b47a42';
  ctx.fillRect(0, 0, w, h);

  const step = 16;
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const even = ((x + y) / step) % 2 === 0;
      ctx.fillStyle = even ? '#d39b5d' : '#9b6431';
      ctx.fillRect(x + 1, y + 2, step - 2, step - 4);
      ctx.fillStyle = 'rgba(255, 232, 195, 0.25)';
      ctx.fillRect(x + 2, y + 3, step - 4, 3);
    }
  }
  return canvas;
}

function createSaekdongCanvas(): HTMLCanvasElement {
  const w = 256;
  const h = 128;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Traditional Korean Saekdong stripe palette
  const stripes = [
    '#d93b3b', // crimson
    '#f4b932', // saffron gold
    '#2a7f62', // jade green
    '#244e8c', // royal indigo
    '#f7f1e3', // warm ivory
    '#e46d31', // persimmon
  ];
  const sw = w / (stripes.length * 2);
  for (let i = 0; i < stripes.length * 2; i++) {
    ctx.fillStyle = stripes[i % stripes.length];
    ctx.fillRect(i * sw, 0, sw + 1, h);
  }
  // Subtle woven fabric texture
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  for (let y = 0; y < h; y += 4) {
    ctx.fillRect(0, y, w, 1);
  }
  return canvas;
}

function createContactShadowCanvas(): HTMLCanvasElement {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 124);
  grad.addColorStop(0, 'rgba(6, 12, 18, 0.62)');
  grad.addColorStop(0.55, 'rgba(6, 12, 18, 0.26)');
  grad.addColorStop(1, 'rgba(6, 12, 18, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

function createPetalSpriteCanvas(): HTMLCanvasElement {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 28);
  grad.addColorStop(0, 'rgba(255, 244, 248, 1)');
  grad.addColorStop(0.5, 'rgba(255, 206, 224, 0.85)');
  grad.addColorStop(1, 'rgba(255, 206, 224, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(32, 32, 22, 14, 0.4, 0, Math.PI * 2);
  ctx.fill();
  return canvas;
}

function createIndigoWaveScarfCanvas(): HTMLCanvasElement {
  const w = 256;
  const h = 128;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#223866';
  ctx.fillRect(0, 0, w, h);

  // Korean traditional white wave & cloud folk motifs
  ctx.strokeStyle = 'rgba(244, 248, 255, 0.88)';
  ctx.lineWidth = 3.5;
  for (let row = 0; row < 4; row++) {
    const y = 18 + row * 30;
    for (let x = -20; x < w + 20; x += 48) {
      ctx.beginPath();
      ctx.arc(x + (row % 2) * 24, y, 16, Math.PI, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + (row % 2) * 24, y + 6, 9, Math.PI, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillRect(0, 4, w, 3);
  ctx.fillRect(0, h - 7, w, 3);
  return canvas;
}

function createTaegeukgiCanvas(): HTMLCanvasElement {
  const w = 256;
  const h = 170;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const R = 42;

  // Taegeuk circle: top half red, bottom half blue + interlocking halves
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.45);

  ctx.fillStyle = '#cd2e3a';
  ctx.beginPath();
  ctx.arc(0, 0, R, Math.PI, 0, false);
  ctx.fill();

  ctx.fillStyle = '#0047a0';
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, Math.PI, false);
  ctx.fill();

  ctx.fillStyle = '#cd2e3a';
  ctx.beginPath();
  ctx.arc(-R / 2, 0, R / 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0047a0';
  ctx.beginPath();
  ctx.arc(R / 2, 0, R / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Four Geon-Gon-Gam-Ri trigrams
  const drawTrigram = (ang: number, bars: [boolean, boolean, boolean]) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ang);
    ctx.fillStyle = '#111111';
    for (let i = 0; i < 3; i++) {
      const y = -68 - i * 8;
      if (bars[i]) {
        ctx.fillRect(-16, y, 32, 4.5);
      } else {
        ctx.fillRect(-16, y, 14, 4.5);
        ctx.fillRect(2, y, 14, 4.5);
      }
    }
    ctx.restore();
  };

  drawTrigram(-0.68, [true, true, true]); // Geon
  drawTrigram(Math.PI - 0.68, [false, false, false]); // Gon
  drawTrigram(0.68, [false, true, false]); // Gam
  drawTrigram(Math.PI + 0.68, [true, false, true]); // Ri

  return canvas;
}

function createHeartSpriteCanvas(): HTMLCanvasElement {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ff5a7e';
  ctx.beginPath();
  ctx.moveTo(32, 52);
  ctx.bezierCurveTo(10, 38, 6, 20, 18, 12);
  ctx.bezierCurveTo(25, 7, 32, 14, 32, 19);
  ctx.bezierCurveTo(32, 14, 39, 7, 46, 12);
  ctx.bezierCurveTo(58, 20, 54, 38, 32, 52);
  ctx.fill();
  return canvas;
}

export function createTextureBundle(renderer: THREE.WebGLRenderer): TextureBundle {
  const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  const tigerBody = finalizeColorTexture(createTigerBodyCanvas(), anisotropy);
  const tigerFace = finalizeColorTexture(createTigerFaceCanvas(), anisotropy);
  const tigerTail = finalizeColorTexture(createTigerTailCanvas(), anisotropy);
  const tigerFurBump = finalizeDataTexture(createTigerFurBumpCanvas(), anisotropy, 2, 2);

  const roadAlbedo = finalizeColorTexture(createRoadAlbedoCanvas(), anisotropy, 1, 64);
  const roadBump = finalizeDataTexture(createRoadBumpCanvas(), anisotropy, 4, 180);

  const stoneWall = finalizeColorTexture(createStoneWallCanvas(), anisotropy, 3, 1);
  const rattanAlbedo = finalizeColorTexture(createRattanCanvas(), anisotropy, 3, 2);
  const saekdongScarf = finalizeColorTexture(createSaekdongCanvas(), anisotropy, 2, 1);
  const indigoWaveScarf = finalizeColorTexture(createIndigoWaveScarfCanvas(), anisotropy, 2, 1);
  const taegeukgiFlag = finalizeColorTexture(createTaegeukgiCanvas(), anisotropy);
  const heartSprite = finalizeColorTexture(createHeartSpriteCanvas(), 1);
  const contactShadow = finalizeColorTexture(createContactShadowCanvas(), 1);
  const petalSprite = finalizeColorTexture(createPetalSpriteCanvas(), 1);

  return {
    tigerBody,
    tigerFace,
    tigerTail,
    tigerFurBump,
    roadAlbedo,
    roadBump,
    stoneWall,
    rattanAlbedo,
    saekdongScarf,
    indigoWaveScarf,
    taegeukgiFlag,
    heartSprite,
    contactShadow,
    petalSprite,
    dispose: () => {
      tigerBody.dispose();
      tigerFace.dispose();
      tigerTail.dispose();
      tigerFurBump.dispose();
      roadAlbedo.dispose();
      roadBump.dispose();
      stoneWall.dispose();
      rattanAlbedo.dispose();
      saekdongScarf.dispose();
      indigoWaveScarf.dispose();
      taegeukgiFlag.dispose();
      heartSprite.dispose();
      contactShadow.dispose();
      petalSprite.dispose();
    },
  };
}
