import * as THREE from 'three';
import { BIKE_DIMS, TIGER_DIMS } from './constants';
import type { TextureBundle } from './textures';

export interface TigerActionTimers {
  happyTimer: number;
  waveTimer: number;
  petTimer: number;
  manseTimer: number;
  roarTimer: number;
  snackTimer: number;
}

export interface TigerRig {
  group: THREE.Group;
  headGroup: THREE.Group;
  bodyHitRoot: THREE.Group;
  updateKinematics: (params: {
    crankAngle: number;
    steerAngle: number;
    speedNormalized: number;
    time: number;
    actions: TigerActionTimers;
    leftGripLocal: THREE.Vector3;
    rightGripLocal: THREE.Vector3;
    bikeGroup: THREE.Group;
  }) => void;
  dispose: () => void;
}

// Pre-allocated math helpers for zero-GC animation loop
const _downVec = new THREE.Vector3(0, -1, 0);
const _shL = new THREE.Vector3();
const _shR = new THREE.Vector3();
const _targetL = new THREE.Vector3();
const _targetR = new THREE.Vector3();
const _waveTargetR = new THREE.Vector3();
const _manseTargetL = new THREE.Vector3();
const _manseTargetR = new THREE.Vector3();
const _snackTargetL = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _perp = new THREE.Vector3();
const _elbow = new THREE.Vector3();
const _bendHintL = new THREE.Vector3(0.72, -0.32, -0.62).normalize();
const _bendHintR = new THREE.Vector3(-0.72, -0.32, -0.62).normalize();
const _segDir1 = new THREE.Vector3();
const _segDir2 = new THREE.Vector3();
const _quat = new THREE.Quaternion();

interface LegChain {
  hipPivot: THREE.Group;
  thighGroup: THREE.Group;
  shinGroup: THREE.Group;
  pawGroup: THREE.Group;
}

interface ArmChain {
  shoulderAnchor: THREE.Object3D;
  upperArmGroup: THREE.Group;
  forearmGroup: THREE.Group;
  pawGroup: THREE.Group;
}

export function createTiger(textures: TextureBundle): TigerRig {
  const group = new THREE.Group();
  const disposables: { dispose: () => void }[] = [];

  // Materials
  const furBodyMat = new THREE.MeshPhysicalMaterial({
    map: textures.tigerBody,
    bumpMap: textures.tigerFurBump,
    bumpScale: 0.008,
    roughness: 0.84,
    metalness: 0.0,
    sheen: 0.72,
    sheenRoughness: 0.68,
    sheenColor: new THREE.Color(0xffdcb8),
  });

  const furFaceMat = new THREE.MeshPhysicalMaterial({
    map: textures.tigerFace,
    bumpMap: textures.tigerFurBump,
    bumpScale: 0.006,
    roughness: 0.82,
    metalness: 0.0,
    sheen: 0.72,
    sheenRoughness: 0.65,
    sheenColor: new THREE.Color(0xffe4c4),
  });

  const furTailMat = new THREE.MeshPhysicalMaterial({
    map: textures.tigerTail,
    bumpMap: textures.tigerFurBump,
    bumpScale: 0.007,
    roughness: 0.84,
    metalness: 0.0,
    sheen: 0.65,
    sheenRoughness: 0.7,
    sheenColor: new THREE.Color(0xffdcb8),
  });

  const creamMat = new THREE.MeshPhysicalMaterial({
    color: 0xfff4e2,
    roughness: 0.86,
    metalness: 0.0,
    sheen: 0.55,
    sheenRoughness: 0.75,
    sheenColor: new THREE.Color(0xffffff),
  });

  const darkStripeMat = new THREE.MeshStandardMaterial({
    color: 0x221a15,
    roughness: 0.85,
    metalness: 0.02,
  });

  const noseMat = new THREE.MeshStandardMaterial({
    color: 0xe66d63,
    roughness: 0.42,
    metalness: 0.04,
  });

  const mouthInnerMat = new THREE.MeshStandardMaterial({
    color: 0x8d242f,
    roughness: 0.65,
  });

  const tongueMat = new THREE.MeshStandardMaterial({
    color: 0xf47a87,
    roughness: 0.5,
  });

  const eyeWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.18,
  });

  const eyePupilMat = new THREE.MeshStandardMaterial({
    color: 0x171311,
    roughness: 0.1,
    metalness: 0.1,
  });

  const innerEarMat = new THREE.MeshStandardMaterial({
    color: 0xf4a89d,
    roughness: 0.78,
  });

  const scarfMat = new THREE.MeshPhysicalMaterial({
    map: textures.indigoWaveScarf,
    roughness: 0.86,
    metalness: 0.0,
    sheen: 0.45,
    sheenRoughness: 0.8,
    side: THREE.DoubleSide,
  });

  const leatherPackMat = new THREE.MeshStandardMaterial({
    color: 0x7c4a26,
    roughness: 0.68,
    metalness: 0.05,
  });

  const strapLeatherMat = new THREE.MeshStandardMaterial({
    color: 0x3b2618,
    roughness: 0.72,
    metalness: 0.05,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd9a74a,
    roughness: 0.24,
    metalness: 0.86,
  });

  const goggleLensMat = new THREE.MeshPhysicalMaterial({
    color: 0x99ccee,
    roughness: 0.08,
    metalness: 0.25,
    clearcoat: 1.0,
    transparent: true,
    opacity: 0.68,
  });

  const matRollMat = new THREE.MeshStandardMaterial({
    color: 0x627359,
    roughness: 0.88,
  });

  const charmMat = new THREE.MeshStandardMaterial({
    map: textures.saekdongScarf,
    roughness: 0.72,
  });

  disposables.push(
    furBodyMat,
    furFaceMat,
    furTailMat,
    creamMat,
    darkStripeMat,
    noseMat,
    mouthInnerMat,
    tongueMat,
    eyeWhiteMat,
    eyePupilMat,
    innerEarMat,
    scarfMat,
    leatherPackMat,
    strapLeatherMat,
    brassMat,
    goggleLensMat,
    matRollMat,
    charmMat
  );

  // 1. Pelvis & Seated Torso
  const pelvisGroup = new THREE.Group();
  pelvisGroup.position.set(0, TIGER_DIMS.hipY, TIGER_DIMS.hipZ);
  group.add(pelvisGroup);

  const torsoGroup = new THREE.Group();
  torsoGroup.rotation.x = 0.42;
  pelvisGroup.add(torsoGroup);

  // Chubby pear-shaped tiger body
  const torsoGeo = new THREE.SphereGeometry(0.188, 24, 20);
  torsoGeo.scale(0.94, 1.24, 0.96);
  const torsoMesh = new THREE.Mesh(torsoGeo, furBodyMat);
  torsoMesh.position.set(0, 0.17, 0.01);
  torsoMesh.rotation.y = -Math.PI / 2;
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  torsoGroup.add(torsoMesh);
  disposables.push(torsoGeo);

  // Cream belly & chest patch
  const bellyGeo = new THREE.SphereGeometry(0.148, 20, 16);
  bellyGeo.scale(0.84, 1.15, 0.52);
  const bellyMesh = new THREE.Mesh(bellyGeo, creamMat);
  bellyMesh.position.set(0, 0.16, 0.105);
  bellyMesh.castShadow = true;
  torsoGroup.add(bellyMesh);
  disposables.push(bellyGeo);

  // Shoulder anchors inside torsoGroup for exact 3D arm IK
  const leftShoulderAnchor = new THREE.Object3D();
  leftShoulderAnchor.position.set(TIGER_DIMS.shoulderX, 0.28, 0.02);
  torsoGroup.add(leftShoulderAnchor);

  const rightShoulderAnchor = new THREE.Object3D();
  rightShoulderAnchor.position.set(-TIGER_DIMS.shoulderX, 0.28, 0.02);
  torsoGroup.add(rightShoulderAnchor);

  // Brown Leather Explorer Backpack + Rolled Mat + Norigae Charm
  const backpackGroup = new THREE.Group();
  backpackGroup.position.set(0, 0.19, -0.17);
  backpackGroup.rotation.x = -0.1;
  torsoGroup.add(backpackGroup);

  const packBodyGeo = new THREE.BoxGeometry(0.21, 0.23, 0.12);
  const packBody = new THREE.Mesh(packBodyGeo, leatherPackMat);
  packBody.castShadow = true;
  backpackGroup.add(packBody);

  const packFlapGeo = new THREE.SphereGeometry(0.115, 16, 12);
  packFlapGeo.scale(1.0, 0.65, 0.68);
  const packFlap = new THREE.Mesh(packFlapGeo, leatherPackMat);
  packFlap.position.set(0, 0.08, 0.0);
  packFlap.castShadow = true;
  backpackGroup.add(packFlap);

  // Twin brass backpack buckles
  const buckleGeo = new THREE.BoxGeometry(0.022, 0.03, 0.018);
  for (const bx of [-0.052, 0.052]) {
    const b = new THREE.Mesh(buckleGeo, brassMat);
    b.position.set(bx, 0.02, -0.062);
    backpackGroup.add(b);
  }

  // Rolled travel sleeping mat strapped on top
  const rollGeo = new THREE.CylinderGeometry(0.044, 0.044, 0.25, 14);
  rollGeo.rotateZ(Math.PI / 2);
  const rollMesh = new THREE.Mesh(rollGeo, matRollMat);
  rollMesh.position.set(0, 0.145, -0.01);
  rollMesh.castShadow = true;
  backpackGroup.add(rollMesh);

  // Backpack shoulder straps wrapping torso
  const strapGeo = new THREE.TorusGeometry(0.14, 0.014, 8, 20, Math.PI * 1.15);
  strapGeo.rotateY(Math.PI / 2);
  for (const sx of [-0.095, 0.095]) {
    const st = new THREE.Mesh(strapGeo, strapLeatherMat);
    st.position.set(sx, 0.21, 0.01);
    st.rotation.x = -0.35;
    torsoGroup.add(st);
  }

  // Dangling Korean Norigae / Saekdong charm on backpack side
  const charmPivot = new THREE.Group();
  charmPivot.position.set(0.115, 0.02, -0.02);
  backpackGroup.add(charmPivot);
  const charmTopGeo = new THREE.SphereGeometry(0.016, 10, 8);
  const charmTop = new THREE.Mesh(charmTopGeo, charmMat);
  charmPivot.add(charmTop);
  const charmTasselGeo = new THREE.ConeGeometry(0.022, 0.068, 8);
  const charmTassel = new THREE.Mesh(charmTasselGeo, charmMat);
  charmTassel.position.y = -0.042;
  charmPivot.add(charmTassel);

  disposables.push(
    packBodyGeo,
    packFlapGeo,
    buckleGeo,
    rollGeo,
    strapGeo,
    charmTopGeo,
    charmTasselGeo
  );

  // 2. Indigo Korean Wave Bandana Scarf around neck + billowing ribbon tail
  const scarfCollarGeo = new THREE.TorusGeometry(0.142, 0.038, 12, 24);
  scarfCollarGeo.rotateX(Math.PI / 2 - 0.18);
  const scarfCollar = new THREE.Mesh(scarfCollarGeo, scarfMat);
  scarfCollar.position.set(0, 0.355, 0.025);
  scarfCollar.castShadow = true;
  torsoGroup.add(scarfCollar);
  disposables.push(scarfCollarGeo);

  const scarfTailSegments: THREE.Group[] = [];
  const scarfSegGeo = new THREE.BoxGeometry(0.11, 0.014, 0.105);
  scarfSegGeo.translate(0, 0, -0.052);
  disposables.push(scarfSegGeo);

  let scarfParent: THREE.Object3D = torsoGroup;
  for (let i = 0; i < 5; i++) {
    const segGroup = new THREE.Group();
    if (i === 0) {
      segGroup.position.set(0.05, 0.36, -0.09);
      segGroup.rotation.y = 0.25;
    } else {
      segGroup.position.set(0, 0, -0.095);
    }
    const segMesh = new THREE.Mesh(scarfSegGeo, scarfMat);
    segMesh.scale.set(1 + i * 0.08, 1, 1);
    segMesh.castShadow = true;
    segGroup.add(segMesh);
    scarfParent.add(segGroup);
    scarfTailSegments.push(segGroup);
    scarfParent = segGroup;
  }

  // 3. Cute Korean Tiger Head + Aviator Goggles + Animated Smile/Roar Mouth
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.415, 0.035);
  headGroup.rotation.x = -0.32;
  torsoGroup.add(headGroup);

  const headGeo = new THREE.SphereGeometry(0.198, 28, 24);
  headGeo.scale(1.08, 0.94, 0.98);
  headGeo.rotateY(-Math.PI / 2);
  const headMesh = new THREE.Mesh(headGeo, furFaceMat);
  headMesh.position.set(0, 0.12, 0);
  headMesh.castShadow = true;
  headMesh.receiveShadow = true;
  headGroup.add(headMesh);
  disposables.push(headGeo);

  // Cute puffy cheeks / muzzle pads
  const muzzleGeo = new THREE.SphereGeometry(0.064, 16, 14);
  muzzleGeo.scale(1.15, 0.88, 0.95);
  disposables.push(muzzleGeo);

  for (const side of [-1, 1]) {
    const muzzle = new THREE.Mesh(muzzleGeo, creamMat);
    muzzle.position.set(side * 0.048, 0.075, 0.168);
    muzzle.castShadow = true;
    headGroup.add(muzzle);
  }

  // Happy open smile / lower jaw + tongue + cute tiny fangs
  const jawGroup = new THREE.Group();
  jawGroup.position.set(0, 0.056, 0.155);
  headGroup.add(jawGroup);

  const mouthInteriorGeo = new THREE.SphereGeometry(0.044, 14, 10);
  mouthInteriorGeo.scale(1.18, 0.72, 0.8);
  const mouthInterior = new THREE.Mesh(mouthInteriorGeo, mouthInnerMat);
  mouthInterior.position.set(0, -0.008, 0.018);
  jawGroup.add(mouthInterior);

  const tongueGeo = new THREE.SphereGeometry(0.028, 12, 10);
  tongueGeo.scale(1.15, 0.45, 1.0);
  const tongueMesh = new THREE.Mesh(tongueGeo, tongueMat);
  tongueMesh.position.set(0, -0.018, 0.032);
  jawGroup.add(tongueMesh);

  const chinGeo = new THREE.SphereGeometry(0.046, 14, 10);
  chinGeo.scale(1.22, 0.62, 0.92);
  const chin = new THREE.Mesh(chinGeo, creamMat);
  chin.position.set(0, -0.032, 0.008);
  jawGroup.add(chin);

  const fangGeo = new THREE.ConeGeometry(0.008, 0.018, 8);
  fangGeo.rotateX(Math.PI);
  for (const fx of [-0.026, 0.026]) {
    const fang = new THREE.Mesh(fangGeo, eyeWhiteMat);
    fang.position.set(fx, 0.014, 0.048);
    jawGroup.add(fang);
  }
  disposables.push(mouthInteriorGeo, tongueGeo, chinGeo, fangGeo);

  // Pink-terracotta cute nose
  const noseGeo = new THREE.SphereGeometry(0.026, 14, 12);
  noseGeo.scale(1.28, 0.84, 0.92);
  const nose = new THREE.Mesh(noseGeo, noseMat);
  nose.position.set(0, 0.105, 0.212);
  headGroup.add(nose);
  disposables.push(noseGeo);

  // Whiskers
  const whiskerGeo = new THREE.CylinderGeometry(0.0018, 0.001, 0.115, 5);
  whiskerGeo.rotateZ(Math.PI / 2);
  disposables.push(whiskerGeo);
  for (const side of [-1, 1]) {
    for (let w = -1; w <= 1; w++) {
      const wh = new THREE.Mesh(whiskerGeo, darkStripeMat);
      wh.position.set(side * 0.128, 0.075 + w * 0.015, 0.17);
      wh.rotation.y = side * -0.25;
      wh.rotation.z = side * w * 0.14;
      headGroup.add(wh);
    }
  }

  // Big soulful expressive eyes + catchlights + blinking eyelids
  const eyeScleraGeo = new THREE.SphereGeometry(0.036, 16, 14);
  eyeScleraGeo.scale(0.95, 1.08, 0.65);
  const pupilGeo = new THREE.SphereGeometry(0.026, 14, 12);
  pupilGeo.scale(0.95, 1.06, 0.65);
  const catchGeo = new THREE.SphereGeometry(0.0085, 10, 8);
  const eyelidGeo = new THREE.SphereGeometry(0.039, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.52);
  disposables.push(eyeScleraGeo, pupilGeo, catchGeo, eyelidGeo);

  const eyelids: THREE.Mesh[] = [];
  for (const side of [-1, 1]) {
    const eyePivot = new THREE.Group();
    eyePivot.position.set(side * 0.078, 0.145, 0.165);
    eyePivot.rotation.y = side * 0.22;
    headGroup.add(eyePivot);

    const sclera = new THREE.Mesh(eyeScleraGeo, eyeWhiteMat);
    eyePivot.add(sclera);

    const pupil = new THREE.Mesh(pupilGeo, eyePupilMat);
    pupil.position.set(0, 0, 0.012);
    eyePivot.add(pupil);

    const catchlight = new THREE.Mesh(catchGeo, eyeWhiteMat);
    catchlight.position.set(0.009, 0.011, 0.026);
    eyePivot.add(catchlight);

    const catchlight2 = new THREE.Mesh(catchGeo, eyeWhiteMat);
    catchlight2.scale.setScalar(0.5);
    catchlight2.position.set(-0.008, -0.008, 0.025);
    eyePivot.add(catchlight2);

    const eyelid = new THREE.Mesh(eyelidGeo, furFaceMat);
    eyelid.rotation.x = -Math.PI * 0.55;
    eyePivot.add(eyelid);
    eyelids.push(eyelid);
  }

  // Cute rounded ears with cream-pink inner cups
  const earOuterGeo = new THREE.SphereGeometry(0.058, 16, 14);
  earOuterGeo.scale(1.0, 1.05, 0.58);
  const earInnerGeo = new THREE.SphereGeometry(0.037, 14, 10);
  earInnerGeo.scale(1.0, 1.05, 0.45);
  disposables.push(earOuterGeo, earInnerGeo);

  const ears: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const earGroup = new THREE.Group();
    earGroup.position.set(side * 0.148, 0.268, 0.01);
    earGroup.rotation.z = side * -0.42;
    earGroup.rotation.y = side * 0.22;

    const outer = new THREE.Mesh(earOuterGeo, furBodyMat);
    outer.castShadow = true;
    earGroup.add(outer);

    const inner = new THREE.Mesh(earInnerGeo, innerEarMat);
    inner.position.set(0, -0.004, 0.018);
    earGroup.add(inner);

    headGroup.add(earGroup);
    ears.push(earGroup);
  }

  // Vintage Brass & Leather Aviator Goggles perched on the forehead!
  const gogglesGroup = new THREE.Group();
  gogglesGroup.position.set(0, 0.245, 0.115);
  gogglesGroup.rotation.x = -0.38;
  headGroup.add(gogglesGroup);

  const goggleBandGeo = new THREE.TorusGeometry(0.185, 0.014, 8, 28);
  goggleBandGeo.rotateX(Math.PI / 2);
  const goggleBand = new THREE.Mesh(goggleBandGeo, strapLeatherMat);
  goggleBand.position.set(0, -0.02, -0.105);
  goggleBand.scale.set(1.08, 1.0, 1.02);
  gogglesGroup.add(goggleBand);

  const goggleFrameGeo = new THREE.TorusGeometry(0.048, 0.011, 12, 24);
  const goggleLensGeo = new THREE.CircleGeometry(0.044, 20);
  const bridgeGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.04, 8);
  bridgeGeo.rotateZ(Math.PI / 2);
  const bridge = new THREE.Mesh(bridgeGeo, strapLeatherMat);
  bridge.position.set(0, 0, 0.01);
  gogglesGroup.add(bridge);

  for (const side of [-1, 1]) {
    const cup = new THREE.Group();
    cup.position.set(side * 0.062, 0, 0.008);
    cup.rotation.y = side * 0.18;
    const rim = new THREE.Mesh(goggleFrameGeo, brassMat);
    rim.castShadow = true;
    cup.add(rim);
    const lens = new THREE.Mesh(goggleLensGeo, goggleLensMat);
    lens.position.z = 0.002;
    cup.add(lens);
    gogglesGroup.add(cup);
  }
  disposables.push(goggleBandGeo, goggleFrameGeo, goggleLensGeo, bridgeGeo);

  // Floating Hearts for "쓰다듬기" (Petting)
  const heartsGroup = new THREE.Group();
  heartsGroup.visible = false;
  headGroup.add(heartsGroup);
  const heartMat = new THREE.SpriteMaterial({
    map: textures.heartSprite,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });
  disposables.push(heartMat);
  const heartSprites: THREE.Sprite[] = [];
  for (let i = 0; i < 5; i++) {
    const sp = new THREE.Sprite(heartMat);
    sp.scale.setScalar(0.075);
    heartsGroup.add(sp);
    heartSprites.push(sp);
  }

  // Golden Roar Soundwave Rings for "어흥"
  const roarRingGeo = new THREE.TorusGeometry(0.14, 0.012, 8, 28);
  const roarRingMat = new THREE.MeshBasicMaterial({
    color: 0xffb347,
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
  });
  const roarRing = new THREE.Mesh(roarRingGeo, roarRingMat);
  roarRing.position.set(0, 0.08, 0.24);
  roarRing.visible = false;
  headGroup.add(roarRing);
  disposables.push(roarRingGeo, roarRingMat);

  // 4. Articulated Striped Tail
  const tailBase = new THREE.Group();
  tailBase.position.set(0, -0.02, -0.14);
  pelvisGroup.add(tailBase);

  const tailSegments: THREE.Group[] = [];
  const segLen = 0.095;
  let tailParent: THREE.Object3D = tailBase;
  for (let i = 0; i < 6; i++) {
    const tSeg = new THREE.Group();
    if (i > 0) {
      tSeg.position.set(0, 0, -segLen * 0.88);
    }
    const r0 = 0.044 - i * 0.0038;
    const r1 = 0.040 - i * 0.0038;
    const cylGeo = new THREE.CylinderGeometry(r1, r0, segLen, 12);
    cylGeo.rotateX(Math.PI / 2);
    cylGeo.translate(0, 0, -segLen * 0.48);
    disposables.push(cylGeo);

    const mat = i === 5 ? darkStripeMat : i % 2 === 1 ? darkStripeMat : furTailMat;
    const mesh = new THREE.Mesh(cylGeo, mat);
    mesh.castShadow = true;
    tSeg.add(mesh);

    if (i === 5) {
      const tipGeo = new THREE.SphereGeometry(r1 * 1.05, 12, 10);
      const tip = new THREE.Mesh(tipGeo, darkStripeMat);
      tip.position.set(0, 0, -segLen * 0.92);
      tip.castShadow = true;
      tSeg.add(tip);
      disposables.push(tipGeo);
    }

    tailParent.add(tSeg);
    tailSegments.push(tSeg);
    tailParent = tSeg;
  }

  // 5. Articulated Hind Legs (Thigh -> Shin -> Paw) for exact 2-Bone Pedal IK
  function buildLeg(sideSign: number): LegChain {
    const hipPivot = new THREE.Group();
    hipPivot.position.set(sideSign * TIGER_DIMS.hipX, TIGER_DIMS.hipY, TIGER_DIMS.hipZ);
    group.add(hipPivot);

    const thighGroup = new THREE.Group();
    hipPivot.add(thighGroup);

    const thighGeo = new THREE.CapsuleGeometry(0.064, TIGER_DIMS.thighLen - 0.09, 8, 14);
    const thighMesh = new THREE.Mesh(thighGeo, furBodyMat);
    thighMesh.position.y = -TIGER_DIMS.thighLen * 0.5;
    thighMesh.castShadow = true;
    thighMesh.receiveShadow = true;
    thighGroup.add(thighMesh);
    disposables.push(thighGeo);

    const shinGroup = new THREE.Group();
    shinGroup.position.set(0, -TIGER_DIMS.thighLen, 0);
    thighGroup.add(shinGroup);

    const shinGeo = new THREE.CapsuleGeometry(0.048, TIGER_DIMS.shinLen - 0.075, 8, 14);
    const shinMesh = new THREE.Mesh(shinGeo, furBodyMat);
    shinMesh.position.y = -TIGER_DIMS.shinLen * 0.5;
    shinMesh.castShadow = true;
    shinMesh.receiveShadow = true;
    shinGroup.add(shinMesh);
    disposables.push(shinGeo);

    const pawGroup = new THREE.Group();
    pawGroup.position.set(0, -TIGER_DIMS.shinLen, 0);
    shinGroup.add(pawGroup);

    const pawGeo = new THREE.SphereGeometry(0.052, 14, 12);
    pawGeo.scale(0.95, 0.62, 1.32);
    const pawMesh = new THREE.Mesh(pawGeo, creamMat);
    pawMesh.position.set(0, -0.005, 0.025);
    pawMesh.castShadow = true;
    pawGroup.add(pawMesh);
    disposables.push(pawGeo);

    const toeGeo = new THREE.SphereGeometry(0.014, 8, 8);
    disposables.push(toeGeo);
    for (let t = -1; t <= 1; t++) {
      const toe = new THREE.Mesh(toeGeo, creamMat);
      toe.position.set(t * 0.02, -0.015, 0.076);
      pawGroup.add(toe);
    }

    return { hipPivot, thighGroup, shinGroup, pawGroup };
  }

  const leftLeg = buildLeg(1);
  const rightLeg = buildLeg(-1);

  // 6. Articulated Front Arms (Upper Arm -> Forearm -> Front Paw)
  function buildArm(): ArmChain {
    const upperArmGroup = new THREE.Group();
    group.add(upperArmGroup);

    const upperGeo = new THREE.CapsuleGeometry(0.048, TIGER_DIMS.upperArmLen - 0.065, 8, 12);
    const upperMesh = new THREE.Mesh(upperGeo, furBodyMat);
    upperMesh.position.y = -TIGER_DIMS.upperArmLen * 0.5;
    upperMesh.castShadow = true;
    upperArmGroup.add(upperMesh);
    disposables.push(upperGeo);

    const forearmGroup = new THREE.Group();
    group.add(forearmGroup);

    const foreGeo = new THREE.CapsuleGeometry(0.042, TIGER_DIMS.forearmLen - 0.06, 8, 12);
    const foreMesh = new THREE.Mesh(foreGeo, furBodyMat);
    foreMesh.position.y = -TIGER_DIMS.forearmLen * 0.5;
    foreMesh.castShadow = true;
    forearmGroup.add(foreMesh);
    disposables.push(foreGeo);

    const pawGroup = new THREE.Group();
    group.add(pawGroup);

    const pawGeo = new THREE.SphereGeometry(0.046, 14, 12);
    pawGeo.scale(0.98, 0.82, 1.14);
    const pawMesh = new THREE.Mesh(pawGeo, creamMat);
    pawMesh.castShadow = true;
    pawGroup.add(pawMesh);
    disposables.push(pawGeo);

    return { shoulderAnchor: leftShoulderAnchor, upperArmGroup, forearmGroup, pawGroup };
  }

  const leftArm = buildArm();
  leftArm.shoulderAnchor = leftShoulderAnchor;
  const rightArm = buildArm();
  rightArm.shoulderAnchor = rightShoulderAnchor;

  // Held Tangerine Snack inside left front paw (visible during "감귤 간식")
  const snackTangerine = new THREE.Group();
  snackTangerine.visible = false;
  const snackFruitGeo = new THREE.SphereGeometry(0.042, 14, 12);
  const snackFruitMat = new THREE.MeshStandardMaterial({ color: 0xff8018, roughness: 0.4 });
  const snackMesh = new THREE.Mesh(snackFruitGeo, snackFruitMat);
  snackMesh.position.set(0, 0.025, 0.032);
  snackTangerine.add(snackMesh);
  leftArm.pawGroup.add(snackTangerine);
  disposables.push(snackFruitGeo, snackFruitMat);

  // Tag interactive hit targets cleanly: head ('tiger-head') vs body ('tiger-body')
  group.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      obj.userData.interactive = 'tiger-body';
    }
  });
  headGroup.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      obj.userData.interactive = 'tiger-head';
    }
  });

  function solveLegIK(
    leg: LegChain,
    hipX: number,
    hipY: number,
    hipZ: number,
    pedalX: number,
    pedalY: number,
    pedalZ: number
  ) {
    leg.hipPivot.position.set(hipX, hipY, hipZ);

    const L1 = TIGER_DIMS.thighLen;
    const L2 = TIGER_DIMS.shinLen;
    const dx = pedalX - hipX;
    const dy = pedalY - hipY;
    const dz = pedalZ - hipZ;

    leg.hipPivot.rotation.z = Math.atan2(dx, -dy);

    const dYZ = Math.sqrt(dy * dy + dz * dz);
    const dClamped = THREE.MathUtils.clamp(dYZ, Math.abs(L1 - L2) + 0.01, L1 + L2 - 0.008);

    const baseAngle = Math.atan2(dz, -dy);
    const cosAlpha = THREE.MathUtils.clamp(
      (L1 * L1 + dClamped * dClamped - L2 * L2) / (2 * L1 * dClamped),
      -1,
      1
    );
    const alpha = Math.acos(cosAlpha);

    const thighAngle = baseAngle + alpha;
    leg.thighGroup.rotation.x = -thighAngle;

    const kneeY = hipY - L1 * Math.cos(thighAngle);
    const kneeZ = hipZ + L1 * Math.sin(thighAngle);
    const shinAngle = Math.atan2(pedalZ - kneeZ, -(pedalY - kneeY));

    leg.shinGroup.rotation.x = -(shinAngle - thighAngle);

    const ankleTilt = -0.12 * Math.sin(thighAngle);
    leg.pawGroup.rotation.x = shinAngle + ankleTilt;
  }

  function solveArmIK(
    arm: ArmChain,
    shoulderPos: THREE.Vector3,
    gripPos: THREE.Vector3,
    bendHint: THREE.Vector3,
    steerAngle: number
  ) {
    const L1 = TIGER_DIMS.upperArmLen;
    const L2 = TIGER_DIMS.forearmLen;

    _dir.subVectors(gripPos, shoulderPos);
    const rawDist = _dir.length();
    const d = THREE.MathUtils.clamp(rawDist, 0.08, L1 + L2 - 0.006);
    _dir.multiplyScalar(1 / Math.max(rawDist, 1e-5));

    const cosA = THREE.MathUtils.clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1);
    const a = L1 * cosA;
    const h = L1 * Math.sqrt(Math.max(0, 1 - cosA * cosA));

    const dot = bendHint.dot(_dir);
    _perp.copy(bendHint).addScaledVector(_dir, -dot).normalize();

    _elbow.copy(shoulderPos).addScaledVector(_dir, a).addScaledVector(_perp, h);

    _segDir1.subVectors(_elbow, shoulderPos).normalize();
    arm.upperArmGroup.position.copy(shoulderPos);
    _quat.setFromUnitVectors(_downVec, _segDir1);
    arm.upperArmGroup.quaternion.copy(_quat);

    _segDir2.subVectors(gripPos, _elbow).normalize();
    arm.forearmGroup.position.copy(_elbow);
    _quat.setFromUnitVectors(_downVec, _segDir2);
    arm.forearmGroup.quaternion.copy(_quat);

    arm.pawGroup.position.copy(gripPos);
    arm.pawGroup.rotation.set(0.25, steerAngle, 0);
  }

  let nextBlinkTime = 2.4;

  function envelope01(remaining: number, total: number): number {
    if (remaining <= 0) return 0;
    const p = 1 - remaining / total;
    // Smooth ramp-in (0..0.18) and smooth ramp-out (0.78..1.0)
    const inEnv = THREE.MathUtils.smoothstep(p, 0, 0.18);
    const outEnv = 1 - THREE.MathUtils.smoothstep(p, 0.78, 1.0);
    return inEnv * outEnv;
  }

  function updateKinematics({
    crankAngle,
    steerAngle,
    speedNormalized,
    time,
    actions,
    leftGripLocal,
    rightGripLocal,
    bikeGroup,
  }: {
    crankAngle: number;
    steerAngle: number;
    speedNormalized: number;
    time: number;
    actions: TigerActionTimers;
    leftGripLocal: THREE.Vector3;
    rightGripLocal: THREE.Vector3;
    bikeGroup: THREE.Group;
  }) {
    const waveBlend = envelope01(actions.waveTimer, 2.0);
    const manseBlend = envelope01(actions.manseTimer, 2.0);
    const petBlend = envelope01(actions.petTimer, 2.2);
    const roarBlend = envelope01(actions.roarTimer, 1.4);
    const snackBlend = envelope01(actions.snackTimer, 2.2);

    // 1. Subtle natural hip rock & torso bob
    const cadenceBob = Math.abs(Math.sin(crankAngle)) * 0.011 * (0.4 + 0.6 * speedNormalized);
    const hipRoll = Math.sin(crankAngle) * 0.042 * (0.35 + 0.65 * speedNormalized);
    const hipY = TIGER_DIMS.hipY + cadenceBob;

    pelvisGroup.position.set(0, hipY, TIGER_DIMS.hipZ);
    pelvisGroup.rotation.z = hipRoll;

    const breath = Math.sin(time * 2.6) * 0.014;
    // Lift chest slightly during Manse / Roar
    torsoGroup.rotation.x =
      0.38 +
      speedNormalized * 0.09 +
      breath -
      manseBlend * 0.18 -
      roarBlend * 0.22;
    torsoGroup.rotation.y = steerAngle * 0.18 + waveBlend * -0.1;

    // Head looks smoothly into turns & performs expressive poses
    const happyBoost =
      actions.happyTimer > 0 ? Math.sin(actions.happyTimer * 18) * 0.1 : 0;
    const petTilt = petBlend * Math.sin(time * 7.5) * 0.16;
    const snackNod = snackBlend * Math.sin(time * 12) * 0.1;

    headGroup.rotation.y =
      steerAngle * 0.56 +
      Math.sin(time * 1.1) * 0.05 +
      waveBlend * -0.18 +
      snackBlend * 0.15;
    headGroup.rotation.x =
      -0.32 -
      speedNormalized * 0.05 +
      happyBoost * 0.35 -
      roarBlend * 0.28 +
      snackNod;
    headGroup.rotation.z = -hipRoll * 0.55 + Math.sin(time * 2.1) * 0.03 + petTilt;

    // Jaw opens wider when roaring or snacking!
    jawGroup.rotation.x =
      0.16 +
      roarBlend * 0.42 +
      manseBlend * 0.18 +
      snackBlend * (0.14 + 0.16 * Math.abs(Math.sin(time * 11)));

    // Roar soundwave ring pulse
    if (actions.roarTimer > 0) {
      roarRing.visible = true;
      const p = 1 - actions.roarTimer / 1.4;
      const sc = 0.6 + p * 3.8;
      roarRing.scale.setScalar(sc);
      roarRing.position.z = 0.24 + p * 0.55;
      roarRingMat.opacity = Math.max(0, (1 - p) * 0.78);
    } else {
      roarRing.visible = false;
    }

    // Floating hearts when petting ("쓰다듬기")
    if (actions.petTimer > 0) {
      heartsGroup.visible = true;
      const p = 1 - actions.petTimer / 2.2;
      heartMat.opacity = Math.sin(p * Math.PI) * 0.95;
      for (let i = 0; i < heartSprites.length; i++) {
        const phase = (p * 1.4 + i * 0.22) % 1;
        heartSprites[i].position.set(
          Math.sin(i * 2.1 + time * 3) * 0.18,
          0.32 + phase * 0.36,
          0.08 + Math.cos(i * 1.7) * 0.08
        );
      }
    } else {
      heartsGroup.visible = false;
    }

    // Ear perk & wind twitch
    for (let i = 0; i < ears.length; i++) {
      const side = i === 0 ? -1 : 1;
      const twitch =
        Math.sin(time * 4.5 + i * 2.1) * 0.04 +
        (actions.happyTimer > 0 ? 0.12 : 0) +
        petBlend * -0.18;
      ears[i].rotation.x = -0.15 * speedNormalized - twitch;
      ears[i].rotation.z = side * (-0.42 + twitch * 0.4);
    }

    // Eye blinking + happy squint during petting
    let blinkAmount = 0;
    if (petBlend > 0.1) {
      blinkAmount = Math.max(blinkAmount, petBlend * 0.92);
    }
    if (time >= nextBlinkTime) {
      const dtBlink = time - nextBlinkTime;
      if (dtBlink < 0.16) {
        blinkAmount = Math.max(blinkAmount, Math.sin((dtBlink / 0.16) * Math.PI));
      } else {
        nextBlinkTime = time + 2.6 + Math.sin(time * 7.3) * 1.1 + 1.1;
      }
    }
    const lidRot = THREE.MathUtils.lerp(-Math.PI * 0.55, 0.2, blinkAmount);
    for (const lid of eyelids) {
      lid.rotation.x = lidRot;
    }

    // 2. Swaying Striped Tail
    const tailFreq =
      2.8 +
      speedNormalized * 2.6 +
      (actions.happyTimer > 0 || petBlend > 0.1 ? 6.5 : 0);
    const tailAmp =
      0.14 +
      speedNormalized * 0.08 +
      (actions.happyTimer > 0 || petBlend > 0.1 ? 0.16 : 0);
    for (let i = 0; i < tailSegments.length; i++) {
      const phase = time * tailFreq - i * 0.52;
      tailSegments[i].rotation.y = Math.sin(phase) * tailAmp * (0.65 + i * 0.12);
      tailSegments[i].rotation.x = 0.18 + Math.cos(phase * 0.7) * 0.06;
    }

    // 3. Fluttering Indigo Wave Scarf & Backpack Norigae Charm
    const windFreq = 4.5 + speedNormalized * 7.5;
    const windAmp = 0.07 + speedNormalized * 0.15;
    for (let i = 0; i < scarfTailSegments.length; i++) {
      const phase = time * windFreq - i * 0.75;
      scarfTailSegments[i].rotation.x =
        -0.15 + speedNormalized * 0.3 + Math.sin(phase) * windAmp;
      scarfTailSegments[i].rotation.y = Math.cos(phase * 0.85) * windAmp * 0.75;
    }
    charmPivot.rotation.z = 0.12 + Math.sin(time * (4 + speedNormalized * 5)) * 0.16;
    charmPivot.rotation.x = -0.15 - speedNormalized * 0.28;

    // 4. Exact Pedal Targets in bikeGroup local space
    const sinC = Math.sin(crankAngle);
    const cosC = Math.cos(crankAngle);
    const L = BIKE_DIMS.crankLen;
    const soleOff = TIGER_DIMS.pawSoleOffset;

    const leftPedalX = BIKE_DIMS.pedalOffsetX;
    const leftPedalY = BIKE_DIMS.bbY - L * sinC + soleOff;
    const leftPedalZ = BIKE_DIMS.bbZ + L * cosC;

    const rightPedalX = -BIKE_DIMS.pedalOffsetX;
    const rightPedalY = BIKE_DIMS.bbY + L * sinC + soleOff;
    const rightPedalZ = BIKE_DIMS.bbZ - L * cosC;

    const cosR = Math.cos(hipRoll);
    const sinR = Math.sin(hipRoll);
    const hx = TIGER_DIMS.hipX;

    solveLegIK(
      leftLeg,
      hx * cosR,
      hipY + hx * sinR,
      TIGER_DIMS.hipZ,
      leftPedalX,
      leftPedalY,
      leftPedalZ
    );

    solveLegIK(
      rightLeg,
      -hx * cosR,
      hipY - hx * sinR,
      TIGER_DIMS.hipZ,
      rightPedalX,
      rightPedalY,
      rightPedalZ
    );

    // 5. Front Arm IK: Handlebar grips blended smoothly with Wave, Manse, or Snack!
    pelvisGroup.updateMatrixWorld(true);
    leftShoulderAnchor.getWorldPosition(_shL);
    rightShoulderAnchor.getWorldPosition(_shR);
    bikeGroup.worldToLocal(_shL);
    bikeGroup.worldToLocal(_shR);

    _targetL.copy(leftGripLocal);
    _targetR.copy(rightGripLocal);

    if (waveBlend > 0.001) {
      _waveTargetR.set(
        -0.28 + Math.sin(time * 11) * 0.085,
        1.27 + Math.cos(time * 11) * 0.03,
        0.13
      );
      _targetR.lerp(_waveTargetR, waveBlend);
    }

    if (manseBlend > 0.001) {
      const wiggle = Math.sin(time * 12) * 0.04;
      _manseTargetL.set(0.24 + wiggle, 1.33, 0.07);
      _manseTargetR.set(-0.24 - wiggle, 1.33, 0.07);
      _targetL.lerp(_manseTargetL, manseBlend);
      _targetR.lerp(_manseTargetR, manseBlend);
    }

    if (snackBlend > 0.001) {
      snackTangerine.visible = true;
      _snackTargetL.set(0.08, 1.07 + Math.sin(time * 10) * 0.025, 0.27);
      _targetL.lerp(_snackTargetL, snackBlend);
    } else {
      snackTangerine.visible = false;
    }

    solveArmIK(leftArm, _shL, _targetL, _bendHintL, steerAngle);
    solveArmIK(rightArm, _shR, _targetR, _bendHintR, steerAngle);
  }

  return {
    group,
    headGroup,
    bodyHitRoot: torsoGroup,
    updateKinematics,
    dispose: () => {
      for (const d of disposables) d.dispose();
    },
  };
}
