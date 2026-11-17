import * as THREE from 'three';
import { ATMOSPHERE_PRESETS, ROAD_CONFIG, type AtmospherePreset } from './constants';
import type { RoadTrack } from './roadTrack';
import type { TextureBundle } from './textures';

export interface CoastalEnvironment {
  group: THREE.Group;
  update: (time: number, dt: number, bikePos: THREE.Vector3, speedNorm: number) => void;
  applyAtmosphere: (preset: AtmospherePreset, sunDir: THREE.Vector3) => void;
  setBlossomsEnabled: (enabled: boolean) => void;
  dispose: () => void;
}

interface SeagullInstance {
  group: THREE.Group;
  leftWing: THREE.Mesh;
  rightWing: THREE.Mesh;
  centerX: number;
  centerZ: number;
  radius: number;
  altitude: number;
  speed: number;
  phase: number;
}

export function createCoastalEnvironment(
  roadTrack: RoadTrack,
  textures: TextureBundle
): CoastalEnvironment {
  const group = new THREE.Group();
  const disposables: { dispose: () => void }[] = [];

  const tmpPos = new THREE.Vector3();
  const tmpTan = new THREE.Vector3();
  const tmpRight = new THREE.Vector3();

  // 1. Procedural Sky Dome Shader
  const skyUniforms = {
    uTopColor: { value: new THREE.Color(ATMOSPHERE_PRESETS.morning.skyTop) },
    uHorizonColor: { value: new THREE.Color(ATMOSPHERE_PRESETS.morning.skyHorizon) },
    uSunDir: { value: new THREE.Vector3(0.5, 0.5, 0.5).normalize() },
    uSunColor: { value: new THREE.Color(ATMOSPHERE_PRESETS.morning.sunColor) },
    uStarOpacity: { value: 0.0 },
    uTime: { value: 0 },
  };

  const skyGeo = new THREE.SphereGeometry(520, 32, 24);
  const skyMat = new THREE.ShaderMaterial({
    uniforms: skyUniforms,
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: `
      varying vec3 vWorldDir;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldDir = normalize(position);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform vec3 uTopColor;
      uniform vec3 uHorizonColor;
      uniform vec3 uSunDir;
      uniform vec3 uSunColor;
      uniform float uStarOpacity;
      uniform float uTime;
      varying vec3 vWorldDir;

      float hash(vec3 p) {
        p = fract(p * 0.3183099 + 0.1);
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }

      void main() {
        vec3 dir = normalize(vWorldDir);
        float h = clamp(dir.y, 0.0, 1.0);
        vec3 col = mix(uHorizonColor, uTopColor, pow(h, 0.55));

        // Solar / Lunar glow disc
        float sunDot = max(dot(dir, normalize(uSunDir)), 0.0);
        col += uSunColor * pow(sunDot, 10.0) * 0.32;
        col += uSunColor * smoothstep(0.9965, 0.9994, sunDot) * 1.4;

        // Subtle twinkling stars at sunset/night
        if (uStarOpacity > 0.01 && dir.y > 0.04) {
          vec3 grid = floor(dir * 260.0);
          float n = hash(grid);
          if (n > 0.9945) {
            float twinkle = 0.65 + 0.35 * sin(uTime * 3.0 + n * 120.0);
            col += vec3(0.9, 0.95, 1.0) * uStarOpacity * twinkle * smoothstep(0.04, 0.25, dir.y);
          }
        }

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const skyDome = new THREE.Mesh(skyGeo, skyMat);
  group.add(skyDome);
  disposables.push(skyGeo, skyMat);

  // 2. Sculpted Korean Coastal Peninsula Terrain
  const terrainSize = 440;
  const terrainSegs = 148;
  const terrainGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, terrainSegs, terrainSegs);
  terrainGeo.rotateX(-Math.PI / 2);

  const posAttr = terrainGeo.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(posAttr.count * 3);
  const cGrass1 = new THREE.Color(0x4b7d42);
  const cGrass2 = new THREE.Color(0x375f37);
  const cSand = new THREE.Color(0xdcc79c);
  const cBasalt = new THREE.Color(0x3a3f46);
  const tmpCol = new THREE.Color();

  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);
    const y = roadTrack.getTerrainHeight(x, z);
    posAttr.setY(i, y);

    // Slope / elevation coloring
    if (y < 0.75) {
      tmpCol.copy(cSand).lerp(cBasalt, THREE.MathUtils.clamp((0.75 - y) * 0.45, 0, 0.5));
    } else if (y < 2.2) {
      tmpCol.copy(cBasalt).lerp(cGrass2, THREE.MathUtils.smoothstep(y, 0.8, 2.2));
    } else {
      const n = 0.5 + 0.5 * Math.sin(x * 0.08 + z * 0.06);
      tmpCol.copy(cGrass2).lerp(cGrass1, n);
    }

    colors[i * 3] = tmpCol.r;
    colors[i * 3 + 1] = tmpCol.g;
    colors[i * 3 + 2] = tmpCol.b;
  }

  terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  terrainGeo.computeVertexNormals();

  const terrainMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.92,
    metalness: 0.02,
  });
  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.receiveShadow = true;
  terrainMesh.castShadow = true;
  group.add(terrainMesh);
  disposables.push(terrainGeo, terrainMat);

  // 3. Dynamic Animated Ocean (East Sea / Jeju Coastal Waves)
  const oceanUniforms = {
    uTime: { value: 0 },
    uSunDir: { value: new THREE.Vector3(0.5, 0.5, 0.5).normalize() },
    uDeepColor: { value: new THREE.Color(ATMOSPHERE_PRESETS.morning.oceanDeep) },
    uShallowColor: { value: new THREE.Color(ATMOSPHERE_PRESETS.morning.oceanShallow) },
    uSpecularColor: { value: new THREE.Color(ATMOSPHERE_PRESETS.morning.oceanSpecular) },
    uSkyHorizon: { value: new THREE.Color(ATMOSPHERE_PRESETS.morning.skyHorizon) },
    uFogColor: { value: new THREE.Color(ATMOSPHERE_PRESETS.morning.fogColor) },
    uFogDensity: { value: ATMOSPHERE_PRESETS.morning.fogDensity },
  };

  const oceanGeo = new THREE.PlaneGeometry(920, 920, 140, 140);
  oceanGeo.rotateX(-Math.PI / 2);

  const oceanMat = new THREE.ShaderMaterial({
    uniforms: oceanUniforms,
    vertexShader: `
      uniform float uTime;
      varying vec3 vWorldPos;
      varying float vWaveH;

      void main() {
        vec3 pos = position;
        float w1 = sin(pos.x * 0.09 + uTime * 1.35) * cos(pos.z * 0.07 + uTime * 0.9) * 0.24;
        float w2 = sin((pos.x * 0.7 + pos.z * 0.7) * 0.16 - uTime * 1.9) * 0.14;
        float w3 = cos(pos.z * 0.24 - pos.x * 0.12 + uTime * 2.3) * 0.07;
        float wave = w1 + w2 + w3;
        pos.y += wave;
        vWaveH = wave;

        vec4 wp = modelMatrix * vec4(pos, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uSunDir;
      uniform vec3 uDeepColor;
      uniform vec3 uShallowColor;
      uniform vec3 uSpecularColor;
      uniform vec3 uSkyHorizon;
      uniform vec3 uFogColor;
      uniform float uFogDensity;

      varying vec3 vWorldPos;
      varying float vWaveH;

      void main() {
        // Compute fine procedural surface normal for shimmering sea ripples
        float sx = cos(vWorldPos.x * 0.38 + uTime * 2.1) * 0.12
                 + cos((vWorldPos.x + vWorldPos.z) * 0.65 - uTime * 2.8) * 0.07;
        float sz = sin(vWorldPos.z * 0.35 + uTime * 1.9) * 0.12
                 + sin((vWorldPos.z - vWorldPos.x) * 0.72 + uTime * 2.5) * 0.07;
        vec3 N = normalize(vec3(-sx, 1.0, -sz));
        vec3 V = normalize(cameraPosition - vWorldPos);
        vec3 L = normalize(uSunDir);

        // Shallow turquoise near peninsula (~96-118m radius) -> deep offshore ocean
        float distCenter = length(vWorldPos.xz);
        float shallowMask = 1.0 - smoothstep(104.0, 155.0, distCenter);
        vec3 waterBase = mix(uDeepColor, uShallowColor, shallowMask * 0.85);

        // Fresnel sky reflection
        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 4.0);
        vec3 col = mix(waterBase, uSkyHorizon, fresnel * 0.68);

        // Sparkling sun/moon specular path on waves
        vec3 H = normalize(L + V);
        float spec = pow(max(dot(N, H), 0.0), 140.0);
        float broadSpec = pow(max(dot(N, H), 0.0), 18.0) * 0.18;
        col += uSpecularColor * (spec * 1.45 + broadSpec);

        // Shoreline & wave-crest sea foam
        float foamZone = smoothstep(126.0, 102.0, distCenter);
        float foamWave = smoothstep(0.14, 0.34, vWaveH + sin(distCenter * 0.35 - uTime * 2.2) * 0.12);
        col = mix(col, vec3(0.94, 0.98, 1.0), foamZone * foamWave * 0.55);

        // Exponential squared fog matching Three.js FogExp2
        float fogDist = length(cameraPosition - vWorldPos);
        float fogFactor = 1.0 - exp(-uFogDensity * uFogDensity * fogDist * fogDist);
        col = mix(col, uFogColor, clamp(fogFactor, 0.0, 1.0));

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });

  const oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
  oceanMesh.position.y = 0;
  group.add(oceanMesh);
  disposables.push(oceanGeo, oceanMat);

  // 4. Composite Korean Landmarks
  // A. Traditional Korean Coastal Pavilion (Jeongja / 정자) overlooking the sea
  const lanternLights: THREE.PointLight[] = [];
  const lanternBulbMats: THREE.MeshStandardMaterial[] = [];

  function buildKoreanPavilion(uParam: number) {
    roadTrack.sampleAt(uParam, tmpPos, tmpTan, tmpRight);
    // Place on inland scenic bluff (-10.5m inward from centerline)
    const px = tmpPos.x - tmpRight.x * 10.5;
    const pz = tmpPos.z - tmpRight.z * 10.5;
    const py = roadTrack.getTerrainHeight(px, pz);

    const pav = new THREE.Group();
    pav.position.set(px, py - 0.1, pz);
    pav.lookAt(tmpPos.x + tmpRight.x * 20, py, tmpPos.z + tmpRight.z * 20);

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x9fa4aa, roughness: 0.9 });
    const dancheongRedMat = new THREE.MeshStandardMaterial({ color: 0xb9372c, roughness: 0.62 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x6f4325, roughness: 0.78 });
    const giwaRoofMat = new THREE.MeshStandardMaterial({
      color: 0x2c343d,
      roughness: 0.55,
      metalness: 0.18,
    });
    const dancheongJadeMat = new THREE.MeshStandardMaterial({ color: 0x2d7f6e, roughness: 0.6 });
    const lanternMat = new THREE.MeshStandardMaterial({
      color: 0xffe4aa,
      emissive: 0xff9e3b,
      emissiveIntensity: 0.2,
      roughness: 0.4,
    });
    lanternBulbMats.push(lanternMat);
    disposables.push(stoneMat, dancheongRedMat, woodMat, giwaRoofMat, dancheongJadeMat, lanternMat);

    // Granite stone dais
    const baseGeo = new THREE.CylinderGeometry(3.4, 3.7, 0.75, 6);
    const base = new THREE.Mesh(baseGeo, stoneMat);
    base.position.y = 0.375;
    base.castShadow = true;
    base.receiveShadow = true;
    pav.add(base);
    disposables.push(baseGeo);

    // Wooden floor deck
    const deckGeo = new THREE.CylinderGeometry(3.15, 3.15, 0.16, 6);
    const deck = new THREE.Mesh(deckGeo, woodMat);
    deck.position.y = 0.82;
    deck.receiveShadow = true;
    pav.add(deck);
    disposables.push(deckGeo);

    // 6 vermilion pillars
    const pillarGeo = new THREE.CylinderGeometry(0.14, 0.16, 2.55, 12);
    disposables.push(pillarGeo);
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const col = new THREE.Mesh(pillarGeo, dancheongRedMat);
      col.position.set(Math.cos(ang) * 2.55, 2.1, Math.sin(ang) * 2.55);
      col.castShadow = true;
      pav.add(col);
    }

    // Dancheong jade eaves ring
    const eavesGeo = new THREE.CylinderGeometry(3.25, 3.05, 0.26, 6);
    const eaves = new THREE.Mesh(eavesGeo, dancheongJadeMat);
    eaves.position.y = 3.42;
    pav.add(eaves);
    disposables.push(eavesGeo);

    // Curved Korean Giwa tiled roof (2 tiers)
    const roof1Geo = new THREE.ConeGeometry(4.25, 1.35, 6);
    const roof1 = new THREE.Mesh(roof1Geo, giwaRoofMat);
    roof1.position.y = 4.18;
    roof1.castShadow = true;
    pav.add(roof1);

    const roofCapGeo = new THREE.ConeGeometry(1.5, 0.85, 6);
    const roofCap = new THREE.Mesh(roofCapGeo, giwaRoofMat);
    roofCap.position.y = 4.88;
    pav.add(roofCap);

    const finialGeo = new THREE.SphereGeometry(0.18, 12, 10);
    const finial = new THREE.Mesh(finialGeo, stoneMat);
    finial.position.y = 5.34;
    pav.add(finial);
    disposables.push(roof1Geo, roofCapGeo, finialGeo);

    // Hanging Korean Paper Lantern
    const lanternGeo = new THREE.SphereGeometry(0.28, 14, 12);
    lanternGeo.scale(0.9, 1.25, 0.9);
    const lantern = new THREE.Mesh(lanternGeo, lanternMat);
    lantern.position.y = 2.95;
    pav.add(lantern);
    disposables.push(lanternGeo);

    const pLight = new THREE.PointLight(0xff9c38, 0, 16, 1.6);
    pLight.position.y = 2.85;
    pav.add(pLight);
    lanternLights.push(pLight);

    group.add(pav);
  }
  buildKoreanPavilion(0.14);
  buildKoreanPavilion(0.68);

  // B. Red & White Korean Coastal Lighthouse (Deungdae / 등대) on rocky promontory
  let lighthouseBeamGroup: THREE.Group | null = null;
  let lighthouseConeMat: THREE.MeshBasicMaterial | null = null;
  let lighthousePoint: THREE.PointLight | null = null;

  function buildLighthouse(uParam: number) {
    roadTrack.sampleAt(uParam, tmpPos, tmpTan, tmpRight);
    const lx = tmpPos.x + tmpRight.x * 16.5;
    const lz = tmpPos.z + tmpRight.z * 16.5;

    const lh = new THREE.Group();
    lh.position.set(lx, 0, lz);

    const rockMat = new THREE.MeshStandardMaterial({ color: 0x383d44, roughness: 0.92 });
    const whitePaintMat = new THREE.MeshStandardMaterial({ color: 0xf4f6f8, roughness: 0.48 });
    const redPaintMat = new THREE.MeshStandardMaterial({ color: 0xd6362c, roughness: 0.48 });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xfff2c2,
      emissive: 0xffd269,
      emissiveIntensity: 0.35,
      roughness: 0.15,
    });
    lanternBulbMats.push(glassMat);
    disposables.push(rockMat, whitePaintMat, redPaintMat, glassMat);

    // Rocky sea-stack foundation
    const moundGeo = new THREE.DodecahedronGeometry(4.6, 1);
    moundGeo.scale(1.25, 0.55, 1.15);
    const mound = new THREE.Mesh(moundGeo, rockMat);
    mound.position.y = 1.2;
    mound.castShadow = true;
    mound.receiveShadow = true;
    lh.add(mound);
    disposables.push(moundGeo);

    // Striped Lighthouse Tower (white-red-white-red-gallery)
    const segHeights = [
      { y: 3.1, h: 2.2, rB: 1.55, rT: 1.38, mat: whitePaintMat },
      { y: 5.3, h: 2.2, rB: 1.38, rT: 1.22, mat: redPaintMat },
      { y: 7.5, h: 2.2, rB: 1.22, rT: 1.06, mat: whitePaintMat },
      { y: 9.6, h: 2.0, rB: 1.06, rT: 0.92, mat: redPaintMat },
    ];
    for (const s of segHeights) {
      const geo = new THREE.CylinderGeometry(s.rT, s.rB, s.h, 16);
      const m = new THREE.Mesh(geo, s.mat);
      m.position.y = s.y;
      m.castShadow = true;
      m.receiveShadow = true;
      lh.add(m);
      disposables.push(geo);
    }

    // Observation gallery
    const galGeo = new THREE.CylinderGeometry(1.28, 1.05, 0.36, 16);
    const gal = new THREE.Mesh(galGeo, whitePaintMat);
    gal.position.y = 10.75;
    lh.add(gal);

    // Lantern glass room + dome cap
    const roomGeo = new THREE.CylinderGeometry(0.75, 0.75, 1.15, 14);
    const room = new THREE.Mesh(roomGeo, glassMat);
    room.position.y = 11.48;
    lh.add(room);

    const capGeo = new THREE.ConeGeometry(0.95, 0.85, 14);
    const cap = new THREE.Mesh(capGeo, redPaintMat);
    cap.position.y = 12.48;
    lh.add(cap);
    disposables.push(galGeo, roomGeo, capGeo);

    // Rotating lighthouse light beam
    lighthouseBeamGroup = new THREE.Group();
    lighthouseBeamGroup.position.y = 11.5;
    lh.add(lighthouseBeamGroup);

    const coneGeo = new THREE.ConeGeometry(4.2, 24, 18, 1, true);
    coneGeo.translate(0, -12, 0);
    coneGeo.rotateX(Math.PI / 2);
    lighthouseConeMat = new THREE.MeshBasicMaterial({
      color: 0xffe49e,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const beam1 = new THREE.Mesh(coneGeo, lighthouseConeMat);
    const beam2 = new THREE.Mesh(coneGeo, lighthouseConeMat);
    beam2.rotation.y = Math.PI;
    lighthouseBeamGroup.add(beam1, beam2);
    disposables.push(coneGeo, lighthouseConeMat);

    lighthousePoint = new THREE.PointLight(0xffdd88, 0, 28, 1.4);
    lighthousePoint.position.y = 11.5;
    lh.add(lighthousePoint);

    group.add(lh);
  }
  buildLighthouse(0.46);

  // C. Jeju Dolhareubang (돌하르방) Stone Guardians + Coastal Signposts
  function buildDolhareubang(uParam: number, sideOffset: number) {
    roadTrack.sampleAt(uParam, tmpPos, tmpTan, tmpRight);
    const dx = tmpPos.x + tmpRight.x * sideOffset;
    const dz = tmpPos.z + tmpRight.z * sideOffset;
    const dy = roadTrack.getTerrainHeight(dx, dz);

    const dol = new THREE.Group();
    dol.position.set(dx, dy - 0.04, dz);
    dol.lookAt(tmpPos.x, dy, tmpPos.z);

    const basaltMat = new THREE.MeshStandardMaterial({
      color: 0x4b4f56,
      roughness: 0.94,
      metalness: 0.04,
    });
    disposables.push(basaltMat);

    const bodyGeo = new THREE.CylinderGeometry(0.32, 0.38, 1.15, 12);
    const body = new THREE.Mesh(bodyGeo, basaltMat);
    body.position.y = 0.575;
    body.castShadow = true;
    dol.add(body);

    const headGeo = new THREE.SphereGeometry(0.31, 14, 12);
    const head = new THREE.Mesh(headGeo, basaltMat);
    head.position.y = 1.32;
    head.castShadow = true;
    dol.add(head);

    const hatGeo = new THREE.CylinderGeometry(0.36, 0.42, 0.16, 14);
    const hat = new THREE.Mesh(hatGeo, basaltMat);
    hat.position.y = 1.62;
    hat.castShadow = true;
    dol.add(hat);

    // Wide rounded basalt nose
    const noseGeo = new THREE.BoxGeometry(0.11, 0.16, 0.12);
    const nose = new THREE.Mesh(noseGeo, basaltMat);
    nose.position.set(0, 1.32, 0.28);
    dol.add(nose);

    disposables.push(bodyGeo, headGeo, hatGeo, noseGeo);
    group.add(dol);
  }
  buildDolhareubang(0.84, -4.9);
  buildDolhareubang(0.86, -4.9);
  buildDolhareubang(0.26, -4.9);

  // Korean Wooden Directional Signpost + Carved Granite "해안도로" Milestone + Mugunghwa Flowers
  function buildWoodenDirectionalPost(uParam: number) {
    roadTrack.sampleAt(uParam, tmpPos, tmpTan, tmpRight);
    const sx = tmpPos.x - tmpRight.x * (ROAD_CONFIG.roadWidth * 0.5 + 1.15);
    const sz = tmpPos.z - tmpRight.z * (ROAD_CONFIG.roadWidth * 0.5 + 1.15);
    const sy = roadTrack.getTerrainHeight(sx, sz);

    const postGroup = new THREE.Group();
    postGroup.position.set(sx, sy - 0.05, sz);
    postGroup.lookAt(sx - tmpTan.x * 10, sy, sz - tmpTan.z * 10);

    const woodPostMat = new THREE.MeshStandardMaterial({ color: 0x5d3d28, roughness: 0.88 });
    const graniteMat = new THREE.MeshStandardMaterial({ color: 0xa4a9ad, roughness: 0.9 });
    const petalPinkMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.55 });
    const flowerEyeMat = new THREE.MeshStandardMaterial({ color: 0xbe185d, roughness: 0.5 });
    const leafGreenMat = new THREE.MeshStandardMaterial({ color: 0x3b7a3d, roughness: 0.72 });
    disposables.push(woodPostMat, graniteMat, petalPinkMat, flowerEyeMat, leafGreenMat);

    // Tall wooden signpost
    const postGeo = new THREE.CylinderGeometry(0.08, 0.095, 2.75, 10);
    const postMesh = new THREE.Mesh(postGeo, woodPostMat);
    postMesh.position.y = 1.375;
    postMesh.castShadow = true;
    postGroup.add(postMesh);
    disposables.push(postGeo);

    const boards = [
      { y: 2.38, label: '해동구룡포  3.8km →' },
      { y: 2.02, label: '감포항      7.2km →' },
      { y: 1.66, label: '문무대왕릉 12.5km →' },
    ];
    const plankGeo = new THREE.BoxGeometry(1.42, 0.27, 0.05);
    disposables.push(plankGeo);

    for (const b of boards) {
      const c = document.createElement('canvas');
      c.width = 320;
      c.height = 64;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#5c3c24';
      ctx.fillRect(0, 0, 320, 64);
      ctx.strokeStyle = '#d9c3a3';
      ctx.lineWidth = 3;
      ctx.strokeRect(4, 4, 312, 56);
      ctx.fillStyle = '#fff9ef';
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.label, 160, 33);

      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75 });
      const plank = new THREE.Mesh(plankGeo, mat);
      plank.position.set(0.24, b.y, 0);
      plank.castShadow = true;
      postGroup.add(plank);
      disposables.push(tex, mat);
    }

    // Carved Granite "해안도로" Milestone Stone beside signpost
    const stoneCanvas = document.createElement('canvas');
    stoneCanvas.width = 256;
    stoneCanvas.height = 256;
    const sctx = stoneCanvas.getContext('2d')!;
    sctx.fillStyle = '#adb2b6';
    sctx.fillRect(0, 0, 256, 256);
    sctx.fillStyle = '#25292e';
    sctx.font = 'bold 48px sans-serif';
    sctx.textAlign = 'center';
    sctx.fillText('해안도로', 128, 122);
    sctx.strokeStyle = '#25292e';
    sctx.lineWidth = 6;
    sctx.beginPath();
    sctx.moveTo(64, 160);
    sctx.quadraticCurveTo(96, 142, 128, 160);
    sctx.quadraticCurveTo(160, 178, 192, 160);
    sctx.stroke();

    const stoneTex = new THREE.CanvasTexture(stoneCanvas);
    stoneTex.colorSpace = THREE.SRGBColorSpace;
    const stoneFaceMat = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.88 });
    const rockGeo = new THREE.BoxGeometry(0.86, 1.15, 0.42);
    const rockStone = new THREE.Mesh(rockGeo, [
      graniteMat,
      graniteMat,
      graniteMat,
      graniteMat,
      stoneFaceMat,
      graniteMat,
    ]);
    rockStone.position.set(-0.78, 0.56, 0.25);
    rockStone.rotation.y = 0.22;
    rockStone.castShadow = true;
    postGroup.add(rockStone);
    disposables.push(stoneTex, stoneFaceMat, rockGeo);

    // Pink Korean Mugunghwa (Rose of Sharon) flower cluster at the milestone base
    const mPetGeo = new THREE.SphereGeometry(0.065, 8, 6);
    mPetGeo.scale(1.2, 0.25, 0.85);
    const mEyeGeo = new THREE.SphereGeometry(0.025, 8, 6);
    disposables.push(mPetGeo, mEyeGeo);

    for (let f = 0; f < 5; f++) {
      const fl = new THREE.Group();
      fl.position.set(-0.68 + f * 0.24, 0.28 + (f % 2) * 0.16, 0.54);
      fl.rotation.x = 0.65;
      for (let p = 0; p < 5; p++) {
        const a = (p / 5) * Math.PI * 2;
        const pet = new THREE.Mesh(mPetGeo, petalPinkMat);
        pet.position.set(Math.cos(a) * 0.055, 0, Math.sin(a) * 0.055);
        pet.rotation.y = -a;
        fl.add(pet);
      }
      const center = new THREE.Mesh(mEyeGeo, flowerEyeMat);
      center.position.y = 0.015;
      fl.add(center);
      postGroup.add(fl);
    }

    group.add(postGroup);
  }
  buildWoodenDirectionalPost(0.11);
  buildWoodenDirectionalPost(0.57);

  // Colorful Korean Coastal Fishing Village (감포항 style harbor houses & pier)
  const boatMeshes: { mesh: THREE.Group; baseY: number; phase: number }[] = [];
  function buildFishingHarbor(uParam: number) {
    roadTrack.sampleAt(uParam, tmpPos, tmpTan, tmpRight);
    const hx = tmpPos.x + tmpRight.x * 24;
    const hz = tmpPos.z + tmpRight.z * 24;

    const harbor = new THREE.Group();
    harbor.position.set(hx, 0, hz);
    harbor.lookAt(tmpPos.x, 0, tmpPos.z);

    const pierMat = new THREE.MeshStandardMaterial({ color: 0xc2c5ca, roughness: 0.88 });
    const houseColors = [0xf59e8b, 0x8ecae6, 0xfde68a, 0xa7f3d0, 0xf8fafc];
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x3b4d63, roughness: 0.65 });
    const boatWoodMat = new THREE.MeshStandardMaterial({ color: 0x2d6a8e, roughness: 0.55 });
    const boatTrimMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.45 });
    disposables.push(pierMat, roofMat, boatWoodMat, boatTrimMat);

    // Concrete harbor pier
    const pierGeo = new THREE.BoxGeometry(22, 1.3, 10);
    const pier = new THREE.Mesh(pierGeo, pierMat);
    pier.position.set(0, 0.45, 0);
    pier.receiveShadow = true;
    harbor.add(pier);
    disposables.push(pierGeo);

    // Colorful seaside village houses
    const houseGeo = new THREE.BoxGeometry(3.2, 2.3, 2.8);
    const hRoofGeo = new THREE.ConeGeometry(2.55, 1.25, 4);
    hRoofGeo.rotateY(Math.PI / 4);
    disposables.push(houseGeo, hRoofGeo);

    for (let i = 0; i < 5; i++) {
      const hMat = new THREE.MeshStandardMaterial({ color: houseColors[i], roughness: 0.72 });
      disposables.push(hMat);
      const hGroup = new THREE.Group();
      hGroup.position.set(-7.5 + i * 3.8, 1.1, -1.5 + (i % 2) * 1.4);

      const wall = new THREE.Mesh(houseGeo, hMat);
      wall.position.y = 1.15;
      wall.castShadow = true;
      hGroup.add(wall);

      const roof = new THREE.Mesh(hRoofGeo, roofMat);
      roof.position.y = 2.88;
      roof.castShadow = true;
      hGroup.add(roof);
      harbor.add(hGroup);
    }

    // Bobbing fishing boats anchored beside the pier
    const hullGeo = new THREE.BoxGeometry(1.5, 0.75, 3.6);
    const cabinGeo = new THREE.BoxGeometry(1.05, 0.85, 1.35);
    disposables.push(hullGeo, cabinGeo);

    for (let b = 0; b < 3; b++) {
      const boat = new THREE.Group();
      boat.position.set(-5.5 + b * 5.2, 0.15, 8.2 + (b % 2) * 2.5);
      boat.rotation.y = (b - 1) * 0.22;
      const hull = new THREE.Mesh(hullGeo, boatWoodMat);
      hull.castShadow = true;
      boat.add(hull);
      const cabin = new THREE.Mesh(cabinGeo, boatTrimMat);
      cabin.position.set(0, 0.65, -0.35);
      cabin.castShadow = true;
      boat.add(cabin);
      harbor.add(boat);
      boatMeshes.push({ mesh: boat, baseY: 0.15, phase: b * 1.9 });
    }

    group.add(harbor);
  }
  buildFishingHarbor(0.32);

  // 5. Instanced Korean Red Pine Trees (Sonamu), Blossom Trees & Coastal Basalt Rocks
  const dummy = new THREE.Object3D();
  const cInstance = new THREE.Color();

  // Pine trees
  const pineCount = 96;
  const trunkGeo = new THREE.CylinderGeometry(0.14, 0.24, 3.2, 8);
  trunkGeo.translate(0, 1.6, 0);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x7c4a32, roughness: 0.9 });

  const crownLowGeo = new THREE.SphereGeometry(1.65, 10, 8);
  crownLowGeo.scale(1.25, 0.62, 1.25);
  crownLowGeo.translate(0, 3.35, 0);

  const crownHighGeo = new THREE.SphereGeometry(1.18, 10, 8);
  crownHighGeo.scale(1.2, 0.68, 1.2);
  crownHighGeo.translate(0.25, 4.15, 0.15);

  const pineNeedleMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 });

  const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, pineCount);
  const crownLowInst = new THREE.InstancedMesh(crownLowGeo, pineNeedleMat, pineCount);
  const crownHighInst = new THREE.InstancedMesh(crownHighGeo, pineNeedleMat, pineCount);
  trunkInst.castShadow = true;
  crownLowInst.castShadow = true;
  crownHighInst.castShadow = true;
  crownLowInst.receiveShadow = true;

  let placedPines = 0;
  let attempts = 0;
  while (placedPines < pineCount && attempts < 1400) {
    attempts++;
    const angle = Math.random() * Math.PI * 2;
    const rad = 18 + Math.random() * 82;
    const x = Math.cos(angle) * rad;
    const z = Math.sin(angle) * rad;
    const { dist } = roadTrack.getNearestRoadDistance(x, z);
    if (dist < 7.2) continue;

    const y = roadTrack.getTerrainHeight(x, z);
    if (y < 2.2) continue;

    const s = 0.85 + Math.random() * 0.55;
    dummy.position.set(x, y - 0.15, z);
    dummy.rotation.set((Math.random() - 0.5) * 0.12, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.12);
    dummy.scale.set(s, s * (0.9 + Math.random() * 0.25), s);
    dummy.updateMatrix();

    trunkInst.setMatrixAt(placedPines, dummy.matrix);
    crownLowInst.setMatrixAt(placedPines, dummy.matrix);
    crownHighInst.setMatrixAt(placedPines, dummy.matrix);

    cInstance.setHSL(0.32 + (Math.random() - 0.5) * 0.05, 0.42, 0.22 + Math.random() * 0.09);
    crownLowInst.setColorAt(placedPines, cInstance);
    cInstance.offsetHSL(0, 0.03, 0.04);
    crownHighInst.setColorAt(placedPines, cInstance);

    placedPines++;
  }
  trunkInst.count = placedPines;
  crownLowInst.count = placedPines;
  crownHighInst.count = placedPines;
  trunkInst.instanceMatrix.needsUpdate = true;
  crownLowInst.instanceMatrix.needsUpdate = true;
  crownHighInst.instanceMatrix.needsUpdate = true;
  if (crownLowInst.instanceColor) crownLowInst.instanceColor.needsUpdate = true;
  if (crownHighInst.instanceColor) crownHighInst.instanceColor.needsUpdate = true;
  trunkInst.computeBoundingSphere();
  crownLowInst.computeBoundingSphere();
  crownHighInst.computeBoundingSphere();
  group.add(trunkInst, crownLowInst, crownHighInst);
  disposables.push(trunkGeo, trunkMat, crownLowGeo, crownHighGeo, pineNeedleMat);

  // Coastal Cherry / Camellia Blossom Trees near the roadside
  const blossomCount = 34;
  const bTrunkGeo = new THREE.CylinderGeometry(0.11, 0.17, 2.5, 8);
  bTrunkGeo.translate(0, 1.25, 0);
  const bCrownGeo = new THREE.IcosahedronGeometry(1.45, 1);
  bCrownGeo.scale(1.18, 0.85, 1.18);
  bCrownGeo.translate(0, 2.85, 0);
  const bCrownMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.78 });

  const bTrunkInst = new THREE.InstancedMesh(bTrunkGeo, trunkMat, blossomCount);
  const bCrownInst = new THREE.InstancedMesh(bCrownGeo, bCrownMat, blossomCount);
  bTrunkInst.castShadow = true;
  bCrownInst.castShadow = true;

  for (let i = 0; i < blossomCount; i++) {
    const u = (i + 0.35) / blossomCount;
    roadTrack.sampleAt(u, tmpPos, tmpTan, tmpRight);
    const sideDist = 6.2 + (i % 3) * 2.8;
    const x = tmpPos.x - tmpRight.x * sideDist;
    const z = tmpPos.z - tmpRight.z * sideDist;
    const y = roadTrack.getTerrainHeight(x, z);
    const s = 0.85 + (i % 4) * 0.12;

    dummy.position.set(x, y - 0.12, z);
    dummy.rotation.set(0, i * 1.4, 0);
    dummy.scale.setScalar(s);
    dummy.updateMatrix();
    bTrunkInst.setMatrixAt(i, dummy.matrix);
    bCrownInst.setMatrixAt(i, dummy.matrix);

    // Soft pink Korean cherry blossom & camellia variation
    cInstance.setHSL(0.94 + (i % 3) * 0.02, 0.68, 0.78 - (i % 2) * 0.08);
    bCrownInst.setColorAt(i, cInstance);
  }
  bTrunkInst.instanceMatrix.needsUpdate = true;
  bCrownInst.instanceMatrix.needsUpdate = true;
  if (bCrownInst.instanceColor) bCrownInst.instanceColor.needsUpdate = true;
  bTrunkInst.computeBoundingSphere();
  bCrownInst.computeBoundingSphere();
  group.add(bTrunkInst, bCrownInst);
  disposables.push(bTrunkGeo, bCrownGeo, bCrownMat);

  // Coastal Basalt Rocks & Sea Stacks along the ocean cliffline
  const rockCount = 135;
  const rockGeo = new THREE.DodecahedronGeometry(1.15, 1);
  const rockPos = rockGeo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < rockPos.count; i++) {
    const vx = rockPos.getX(i);
    const vy = rockPos.getY(i);
    const vz = rockPos.getZ(i);
    const jag = 0.8 + 0.3 * Math.sin(vx * 3.1 + vy * 2.4 + vz * 1.9);
    rockPos.setXYZ(i, vx * jag, vy * jag * 0.75, vz * jag);
  }
  rockGeo.computeVertexNormals();
  const rockMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.94, metalness: 0.04 });
  const rockInst = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
  rockInst.castShadow = true;
  rockInst.receiveShadow = true;

  for (let i = 0; i < rockCount; i++) {
    const u = (i / rockCount + Math.sin(i * 7.1) * 0.01) % 1;
    roadTrack.sampleAt(u, tmpPos, tmpTan, tmpRight);
    const outDist = 8.5 + (i % 5) * 3.4;
    const x = tmpPos.x + tmpRight.x * outDist;
    const z = tmpPos.z + tmpRight.z * outDist;
    const y = Math.max(-0.5, roadTrack.getTerrainHeight(x, z));

    dummy.position.set(x, y, z);
    dummy.rotation.set(i * 0.6, i * 1.7, i * 0.3);
    dummy.scale.set(
      0.8 + (i % 3) * 0.75,
      0.6 + (i % 4) * 0.45,
      0.8 + ((i + 1) % 3) * 0.75
    );
    dummy.updateMatrix();
    rockInst.setMatrixAt(i, dummy.matrix);

    const shade = 0.19 + (i % 5) * 0.035;
    cInstance.setRGB(shade, shade + 0.01, shade + 0.02);
    rockInst.setColorAt(i, cInstance);
  }
  rockInst.instanceMatrix.needsUpdate = true;
  if (rockInst.instanceColor) rockInst.instanceColor.needsUpdate = true;
  rockInst.computeBoundingSphere();
  group.add(rockInst);
  disposables.push(rockGeo, rockMat);

  // 6. Animated Soaring Seagulls over the coast
  const seagulls: SeagullInstance[] = [];
  const gullBodyGeo = new THREE.CapsuleGeometry(0.08, 0.32, 4, 8);
  gullBodyGeo.rotateX(Math.PI / 2);
  const gullWingGeo = new THREE.BoxGeometry(0.45, 0.02, 0.14);
  const gullMat = new THREE.MeshStandardMaterial({ color: 0xf7f9fb, roughness: 0.6 });
  disposables.push(gullBodyGeo, gullWingGeo, gullMat);

  for (let i = 0; i < 8; i++) {
    const gGroup = new THREE.Group();
    const body = new THREE.Mesh(gullBodyGeo, gullMat);
    gGroup.add(body);

    const lw = new THREE.Mesh(gullWingGeo, gullMat);
    lw.geometry = gullWingGeo;
    lw.position.set(0.22, 0, 0);
    gGroup.add(lw);

    const rw = new THREE.Mesh(gullWingGeo, gullMat);
    rw.position.set(-0.22, 0, 0);
    gGroup.add(rw);

    const u = i / 8;
    roadTrack.sampleAt(u, tmpPos, tmpTan, tmpRight);
    group.add(gGroup);

    seagulls.push({
      group: gGroup,
      leftWing: lw,
      rightWing: rw,
      centerX: tmpPos.x + tmpRight.x * 18,
      centerZ: tmpPos.z + tmpRight.z * 18,
      radius: 10 + (i % 3) * 5,
      altitude: 11 + (i % 4) * 3.2,
      speed: 0.38 + (i % 3) * 0.11,
      phase: i * 1.3,
    });
  }

  // 7. Drifting Sea-Breeze Blossom Petals around the rider
  const petalCount = 160;
  const petalSpread = 34;
  const petalGeo = new THREE.BufferGeometry();
  const petalPos = new Float32Array(petalCount * 3);
  const petalVel = new Float32Array(petalCount * 3);
  for (let i = 0; i < petalCount; i++) {
    petalPos[i * 3] = (Math.random() - 0.5) * petalSpread;
    petalPos[i * 3 + 1] = Math.random() * 8 + 0.5;
    petalPos[i * 3 + 2] = (Math.random() - 0.5) * petalSpread;
    petalVel[i * 3] = (Math.random() - 0.5) * 1.4;
    petalVel[i * 3 + 1] = -0.35 - Math.random() * 0.45;
    petalVel[i * 3 + 2] = (Math.random() - 0.5) * 1.4;
  }
  petalGeo.setAttribute('position', new THREE.BufferAttribute(petalPos, 3));
  const petalMat = new THREE.PointsMaterial({
    size: 0.24,
    map: textures.petalSprite,
    transparent: true,
    opacity: 0.78,
    depthWrite: false,
  });
  const petalPoints = new THREE.Points(petalGeo, petalMat);
  petalPoints.frustumCulled = false;
  group.add(petalPoints);
  disposables.push(petalGeo, petalMat);

  function update(time: number, dt: number, bikePos: THREE.Vector3, speedNorm: number) {
    skyUniforms.uTime.value = time;
    oceanUniforms.uTime.value = time;

    // Rotate lighthouse beacon
    if (lighthouseBeamGroup) {
      lighthouseBeamGroup.rotation.y = time * 0.75;
    }

    // Update soaring seagulls
    for (const g of seagulls) {
      const ang = time * g.speed + g.phase;
      const nx = g.centerX + Math.cos(ang) * g.radius;
      const nz = g.centerZ + Math.sin(ang) * g.radius;
      const ny = g.altitude + Math.sin(ang * 2.0) * 1.1;

      g.group.position.set(nx, ny, nz);
      g.group.rotation.y = -ang;
      const flap = Math.sin(time * 7.5 + g.phase) * 0.45;
      g.leftWing.rotation.z = flap;
      g.rightWing.rotation.z = -flap;
    }

    // Gently bob coastal fishing boats on waves
    for (const b of boatMeshes) {
      b.mesh.position.y = b.baseY + Math.sin(time * 1.8 + b.phase) * 0.12;
      b.mesh.rotation.z = Math.sin(time * 1.4 + b.phase) * 0.05;
      b.mesh.rotation.x = Math.cos(time * 1.2 + b.phase) * 0.035;
    }

    // Keep blossom petals circulating gently around the tiger's coastal corridor
    if (petalPoints.visible) {
      const pAttr = petalGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < petalCount; i++) {
        let x = pAttr.getX(i) + (petalVel[i * 3] + Math.sin(time + i) * 0.5) * dt;
        let y = pAttr.getY(i) + petalVel[i * 3 + 1] * dt * (1 + speedNorm * 0.3);
        let z = pAttr.getZ(i) + (petalVel[i * 3 + 2] + Math.cos(time + i) * 0.5) * dt;

        if (y < bikePos.y - 0.5) {
          y = bikePos.y + 4.5 + Math.random() * 4.5;
          x = bikePos.x + (Math.random() - 0.5) * petalSpread;
          z = bikePos.z + (Math.random() - 0.5) * petalSpread;
        } else {
          if (x - bikePos.x > petalSpread * 0.5) x -= petalSpread;
          if (x - bikePos.x < -petalSpread * 0.5) x += petalSpread;
          if (z - bikePos.z > petalSpread * 0.5) z -= petalSpread;
          if (z - bikePos.z < -petalSpread * 0.5) z += petalSpread;
        }
        pAttr.setXYZ(i, x, y, z);
      }
      pAttr.needsUpdate = true;
    }
  }

  function setBlossomsEnabled(enabled: boolean) {
    petalPoints.visible = enabled;
  }

  function applyAtmosphere(preset: AtmospherePreset, sunDir: THREE.Vector3) {
    skyUniforms.uTopColor.value.setHex(preset.skyTop);
    skyUniforms.uHorizonColor.value.setHex(preset.skyHorizon);
    skyUniforms.uSunColor.value.setHex(preset.sunColor);
    skyUniforms.uSunDir.value.copy(sunDir).normalize();
    skyUniforms.uStarOpacity.value = preset.starOpacity;

    oceanUniforms.uSunDir.value.copy(sunDir).normalize();
    oceanUniforms.uDeepColor.value.setHex(preset.oceanDeep);
    oceanUniforms.uShallowColor.value.setHex(preset.oceanShallow);
    oceanUniforms.uSpecularColor.value.setHex(preset.oceanSpecular);
    oceanUniforms.uSkyHorizon.value.setHex(preset.skyHorizon);
    oceanUniforms.uFogColor.value.setHex(preset.fogColor);
    oceanUniforms.uFogDensity.value = preset.fogDensity;

    for (const pl of lanternLights) {
      pl.intensity = preset.lanternIntensity;
    }
    for (const bm of lanternBulbMats) {
      bm.emissiveIntensity = preset.lanternIntensity > 0.1 ? 1.6 : 0.2;
    }
    if (lighthouseConeMat && lighthousePoint) {
      const active = preset.lanternIntensity > 0.1;
      lighthouseConeMat.opacity = active ? (preset.starOpacity > 0.5 ? 0.24 : 0.12) : 0.0;
      lighthousePoint.intensity = active ? 3.5 : 0.0;
    }
  }

  return {
    group,
    update,
    applyAtmosphere,
    setBlossomsEnabled,
    dispose: () => {
      for (const d of disposables) d.dispose();
    },
  };
}
