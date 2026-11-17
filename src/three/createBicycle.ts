import * as THREE from 'three';
import { BIKE_DIMS } from './constants';
import type { TextureBundle } from './textures';

export interface BicycleRig {
  group: THREE.Group;
  frontWheel: THREE.Group;
  rearWheel: THREE.Group;
  crankGroup: THREE.Group;
  leftPedal: THREE.Group;
  rightPedal: THREE.Group;
  forkSteerGroup: THREE.Group;
  gripLeftAnchor: THREE.Object3D;
  gripRightAnchor: THREE.Object3D;
  bellGroup: THREE.Group;
  bellHammer: THREE.Mesh;
  basketGroup: THREE.Group;
  flagMesh: THREE.Mesh;
  headlightBulbMat: THREE.MeshStandardMaterial;
  headlightSpot: THREE.SpotLight;
  dispose: () => void;
}

function makeTubeBetween(
  p1: THREE.Vector3,
  p2: THREE.Vector3,
  radius: number,
  material: THREE.Material,
  radialSegs = 12
): THREE.Mesh {
  const dir = new THREE.Vector3().subVectors(p2, p1);
  const len = dir.length();
  const geo = new THREE.CylinderGeometry(radius, radius, len, radialSegs);
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.copy(p1).addScaledVector(dir, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function createBicycle(textures: TextureBundle): BicycleRig {
  const group = new THREE.Group();
  const disposables: { dispose: () => void }[] = [];

  // Materials with clear roughness/metalness differentiation
  const framePaintMat = new THREE.MeshPhysicalMaterial({
    color: 0x4f6d52, // Vintage Korean olive-sage bicycle paint
    roughness: 0.25,
    metalness: 0.34,
    clearcoat: 0.92,
    clearcoatRoughness: 0.12,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe6ecf2,
    roughness: 0.16,
    metalness: 0.94,
  });

  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x2b3036,
    roughness: 0.42,
    metalness: 0.72,
  });

  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x242629,
    roughness: 0.88,
    metalness: 0.04,
  });

  const creamSidewallMat = new THREE.MeshStandardMaterial({
    color: 0xf1e6cf,
    roughness: 0.78,
    metalness: 0.02,
  });

  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x7b4524,
    roughness: 0.64,
    metalness: 0.05,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xe2b14c,
    roughness: 0.22,
    metalness: 0.88,
  });

  const rattanMat = new THREE.MeshStandardMaterial({
    map: textures.rattanAlbedo,
    roughness: 0.84,
    metalness: 0.02,
  });

  const reflectorAmberMat = new THREE.MeshStandardMaterial({
    color: 0xff8c1a,
    emissive: 0xff5500,
    emissiveIntensity: 0.35,
    roughness: 0.2,
    metalness: 0.1,
  });

  const taillightMat = new THREE.MeshStandardMaterial({
    color: 0xd92626,
    emissive: 0x990f0f,
    emissiveIntensity: 0.45,
    roughness: 0.22,
    metalness: 0.15,
  });

  const headlightBulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff5d6,
    emissive: 0xffe094,
    emissiveIntensity: 0.3,
    roughness: 0.15,
    metalness: 0.1,
  });

  disposables.push(
    framePaintMat,
    chromeMat,
    darkMetalMat,
    tireMat,
    creamSidewallMat,
    leatherMat,
    brassMat,
    rattanMat,
    reflectorAmberMat,
    taillightMat,
    headlightBulbMat
  );

  // Helper to build a spoked wheel centered at local (0,0,0), rolling around X axis
  function buildWheel(includeRearCog: boolean): THREE.Group {
    const wGroup = new THREE.Group();
    const R = BIKE_DIMS.wheelRadius;
    const tubeR = BIKE_DIMS.tireTubeRadius;

    // Tire (torus lives in XY plane by default, rotate Y by PI/2 so it sits in YZ plane)
    const tireGeo = new THREE.TorusGeometry(R - tubeR, tubeR, 18, 48);
    tireGeo.rotateY(Math.PI / 2);
    const tire = new THREE.Mesh(tireGeo, tireMat);
    tire.castShadow = true;
    tire.receiveShadow = true;
    wGroup.add(tire);
    disposables.push(tireGeo);

    // Cream sidewall accent rings on both sides
    const wallGeo = new THREE.TorusGeometry(R - tubeR * 1.45, tubeR * 0.45, 10, 44);
    wallGeo.rotateY(Math.PI / 2);
    const wall = new THREE.Mesh(wallGeo, creamSidewallMat);
    wGroup.add(wall);
    disposables.push(wallGeo);

    // Aluminum rim
    const rimGeo = new THREE.TorusGeometry(R - tubeR * 1.85, 0.015, 12, 44);
    rimGeo.rotateY(Math.PI / 2);
    const rim = new THREE.Mesh(rimGeo, chromeMat);
    rim.castShadow = true;
    wGroup.add(rim);
    disposables.push(rimGeo);

    // Hub barrel + axle nuts
    const hubGeo = new THREE.CylinderGeometry(0.026, 0.026, 0.11, 14);
    hubGeo.rotateZ(Math.PI / 2);
    const hub = new THREE.Mesh(hubGeo, chromeMat);
    wGroup.add(hub);
    disposables.push(hubGeo);

    // 16 spokes
    const spokeCount = 16;
    const spokeLen = R - tubeR * 1.9;
    const spokeGeo = new THREE.CylinderGeometry(0.0028, 0.0028, spokeLen, 6);
    spokeGeo.translate(0, spokeLen * 0.5, 0);
    disposables.push(spokeGeo);

    for (let i = 0; i < spokeCount; i++) {
      const ang = (i / spokeCount) * Math.PI * 2;
      const spoke = new THREE.Mesh(spokeGeo, chromeMat);
      const flangeX = i % 2 === 0 ? 0.028 : -0.028;
      spoke.position.set(flangeX, 0, 0);
      spoke.rotation.x = ang;
      spoke.rotation.z = i % 2 === 0 ? 0.09 : -0.09;
      wGroup.add(spoke);
    }

    // Orange spoke reflector (makes rotation clearly visible!)
    const refGeo = new THREE.BoxGeometry(0.012, 0.052, 0.024);
    const ref = new THREE.Mesh(refGeo, reflectorAmberMat);
    ref.position.set(0, R * 0.62, 0);
    wGroup.add(ref);
    disposables.push(refGeo);

    if (includeRearCog) {
      const cogGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.014, 18);
      cogGeo.rotateZ(Math.PI / 2);
      const cog = new THREE.Mesh(cogGeo, darkMetalMat);
      cog.position.set(-0.055, 0, 0);
      wGroup.add(cog);
      disposables.push(cogGeo);
    }

    return wGroup;
  }

  // Contact shadow disc directly beneath bicycle tires
  const shadowGeo = new THREE.PlaneGeometry(1.05, 1.95);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: textures.contactShadow,
    transparent: true,
    depthWrite: false,
    opacity: 0.55,
  });
  const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
  contactShadow.position.set(0, 0.015, 0.02);
  group.add(contactShadow);
  disposables.push(shadowGeo, shadowMat);

  // Rear wheel
  const rearWheel = buildWheel(true);
  rearWheel.position.set(0, BIKE_DIMS.wheelRadius, BIKE_DIMS.rearAxleZ);
  group.add(rearWheel);

  // Frame key nodes
  const bbPos = new THREE.Vector3(0, BIKE_DIMS.bbY, BIKE_DIMS.bbZ);
  const rearAxleLeft = new THREE.Vector3(0.062, BIKE_DIMS.wheelRadius, BIKE_DIMS.rearAxleZ);
  const rearAxleRight = new THREE.Vector3(-0.062, BIKE_DIMS.wheelRadius, BIKE_DIMS.rearAxleZ);
  const seatCluster = new THREE.Vector3(0, 0.57, -0.17);
  const headPivotPos = new THREE.Vector3(0, 0.66, 0.48);
  const headTop = new THREE.Vector3(0, 0.70, 0.467);
  const headBot = new THREE.Vector3(0, 0.56, 0.511);

  // Seat tube, down tube, top tube, head tube
  group.add(makeTubeBetween(bbPos, seatCluster, 0.021, framePaintMat));
  group.add(makeTubeBetween(bbPos, headBot, 0.023, framePaintMat));
  group.add(makeTubeBetween(seatCluster, headTop, 0.019, framePaintMat));
  group.add(makeTubeBetween(headBot, headTop, 0.025, framePaintMat));

  // Chain stays & Seat stays
  const bbLeft = new THREE.Vector3(0.04, BIKE_DIMS.bbY, BIKE_DIMS.bbZ);
  const bbRight = new THREE.Vector3(-0.04, BIKE_DIMS.bbY, BIKE_DIMS.bbZ);
  group.add(makeTubeBetween(bbLeft, rearAxleLeft, 0.013, framePaintMat));
  group.add(makeTubeBetween(bbRight, rearAxleRight, 0.013, framePaintMat));
  group.add(makeTubeBetween(seatCluster, rearAxleLeft, 0.012, framePaintMat));
  group.add(makeTubeBetween(seatCluster, rearAxleRight, 0.012, framePaintMat));

  // Bottom bracket housing
  const bbGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.095, 16);
  bbGeo.rotateZ(Math.PI / 2);
  const bbMesh = new THREE.Mesh(bbGeo, darkMetalMat);
  bbMesh.position.copy(bbPos);
  group.add(bbMesh);
  disposables.push(bbGeo);

  // Seatpost + Spring Leather Saddle
  const postTop = new THREE.Vector3(0, BIKE_DIMS.saddleY - 0.02, BIKE_DIMS.saddleZ);
  group.add(makeTubeBetween(seatCluster, postTop, 0.014, chromeMat));

  const saddleGroup = new THREE.Group();
  saddleGroup.position.set(0, BIKE_DIMS.saddleY, BIKE_DIMS.saddleZ);
  const saddleBaseGeo = new THREE.SphereGeometry(0.115, 20, 14);
  saddleBaseGeo.scale(1.1, 0.36, 1.38);
  const saddleMesh = new THREE.Mesh(saddleBaseGeo, leatherMat);
  saddleMesh.castShadow = true;
  saddleGroup.add(saddleMesh);

  // Saddle springs
  const springGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.045, 10);
  for (const sx of [-0.055, 0.055]) {
    const sp = new THREE.Mesh(springGeo, chromeMat);
    sp.position.set(sx, -0.032, -0.07);
    saddleGroup.add(sp);
  }
  group.add(saddleGroup);
  disposables.push(saddleBaseGeo, springGeo);

  // Rear Mudguard (Fender)
  const fenderGeo = new THREE.TorusGeometry(
    BIKE_DIMS.wheelRadius + 0.032,
    0.036,
    10,
    28,
    Math.PI * 0.92
  );
  fenderGeo.rotateY(Math.PI / 2);
  const rearFender = new THREE.Mesh(fenderGeo, framePaintMat);
  rearFender.position.set(0, BIKE_DIMS.wheelRadius, BIKE_DIMS.rearAxleZ);
  rearFender.rotation.x = -Math.PI * 0.08;
  rearFender.castShadow = true;
  group.add(rearFender);
  disposables.push(fenderGeo);

  // Rear Luggage Rack + Taillight
  const rackY = BIKE_DIMS.wheelRadius + 0.41;
  group.add(
    makeTubeBetween(
      new THREE.Vector3(0.07, rackY, -0.35),
      new THREE.Vector3(0.07, rackY, -0.78),
      0.008,
      chromeMat
    ),
    makeTubeBetween(
      new THREE.Vector3(-0.07, rackY, -0.35),
      new THREE.Vector3(-0.07, rackY, -0.78),
      0.008,
      chromeMat
    ),
    makeTubeBetween(
      new THREE.Vector3(0.07, rackY, -0.78),
      new THREE.Vector3(-0.07, rackY, -0.78),
      0.008,
      chromeMat
    ),
    makeTubeBetween(
      new THREE.Vector3(0.07, rackY, -0.75),
      rearAxleLeft,
      0.007,
      chromeMat
    ),
    makeTubeBetween(
      new THREE.Vector3(-0.07, rackY, -0.75),
      rearAxleRight,
      0.007,
      chromeMat
    )
  );

  // Rear taillight
  const tailGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.03, 12);
  tailGeo.rotateX(Math.PI / 2);
  const taillight = new THREE.Mesh(tailGeo, taillightMat);
  taillight.position.set(0, rackY - 0.03, -0.80);
  group.add(taillight);
  disposables.push(tailGeo);

  // Chain visual (upper & lower chain runs on right side x = -0.055)
  group.add(
    makeTubeBetween(
      new THREE.Vector3(-0.055, BIKE_DIMS.bbY + 0.082, BIKE_DIMS.bbZ),
      new THREE.Vector3(-0.055, BIKE_DIMS.wheelRadius + 0.04, BIKE_DIMS.rearAxleZ),
      0.006,
      darkMetalMat,
      6
    ),
    makeTubeBetween(
      new THREE.Vector3(-0.055, BIKE_DIMS.bbY - 0.082, BIKE_DIMS.bbZ),
      new THREE.Vector3(-0.055, BIKE_DIMS.wheelRadius - 0.04, BIKE_DIMS.rearAxleZ),
      0.006,
      darkMetalMat,
      6
    )
  );

  // Crankset + Chainring + Counter-rotating Pedals
  const crankGroup = new THREE.Group();
  crankGroup.position.copy(bbPos);
  group.add(crankGroup);

  const ringGeo = new THREE.TorusGeometry(0.082, 0.009, 8, 28);
  ringGeo.rotateY(Math.PI / 2);
  const chainring = new THREE.Mesh(ringGeo, chromeMat);
  chainring.position.set(-0.055, 0, 0);
  crankGroup.add(chainring);
  disposables.push(ringGeo);

  // 5 chainring spider spokes
  const spiderGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.16, 6);
  for (let i = 0; i < 3; i++) {
    const sp = new THREE.Mesh(spiderGeo, chromeMat);
    sp.position.set(-0.055, 0, 0);
    sp.rotation.x = (i / 3) * Math.PI;
    crankGroup.add(sp);
  }
  disposables.push(spiderGeo);

  // Crank arms: left (+X) points to +Z, right (-X) points to -Z
  const crankArmGeo = new THREE.BoxGeometry(0.016, 0.026, BIKE_DIMS.crankLen);
  const leftArm = new THREE.Mesh(crankArmGeo, chromeMat);
  leftArm.position.set(0.072, 0, BIKE_DIMS.crankLen * 0.5);
  leftArm.castShadow = true;
  crankGroup.add(leftArm);

  const rightArm = new THREE.Mesh(crankArmGeo, chromeMat);
  rightArm.position.set(-0.072, 0, -BIKE_DIMS.crankLen * 0.5);
  rightArm.castShadow = true;
  crankGroup.add(rightArm);
  disposables.push(crankArmGeo);

  function buildPedal(): THREE.Group {
    const pGroup = new THREE.Group();
    const bodyGeo = new THREE.BoxGeometry(0.092, 0.024, 0.078);
    const body = new THREE.Mesh(bodyGeo, darkMetalMat);
    body.castShadow = true;
    pGroup.add(body);

    const refGeo = new THREE.BoxGeometry(0.05, 0.012, 0.082);
    const ref = new THREE.Mesh(refGeo, reflectorAmberMat);
    pGroup.add(ref);
    disposables.push(bodyGeo, refGeo);
    return pGroup;
  }

  const leftPedal = buildPedal();
  leftPedal.position.set(BIKE_DIMS.pedalOffsetX, 0, BIKE_DIMS.crankLen);
  crankGroup.add(leftPedal);

  const rightPedal = buildPedal();
  rightPedal.position.set(-BIKE_DIMS.pedalOffsetX, 0, -BIKE_DIMS.crankLen);
  crankGroup.add(rightPedal);

  // Steerable Front Fork Assembly
  // Head pivot at (0, 0.66, 0.48) tilted by rotation.x = -0.31 so -0.336 Y lands at (0, 0.34, 0.5825)
  const forkRakeGroup = new THREE.Group();
  forkRakeGroup.position.copy(headPivotPos);
  forkRakeGroup.rotation.x = -0.31;
  group.add(forkRakeGroup);

  const forkSteerGroup = new THREE.Group();
  forkRakeGroup.add(forkSteerGroup);

  const forkLen = 0.336;
  const frontWheel = buildWheel(false);
  frontWheel.position.set(0, -forkLen, 0);
  // Undo rake tilt for wheel mesh? No, wheel rotates around X axis, which is perpendicular to steering axis anyway!
  forkSteerGroup.add(frontWheel);

  // Front fork crown & blades
  const crownGeo = new THREE.BoxGeometry(0.14, 0.026, 0.042);
  const crown = new THREE.Mesh(crownGeo, chromeMat);
  crown.position.set(0, -0.06, 0);
  forkSteerGroup.add(crown);
  disposables.push(crownGeo);

  forkSteerGroup.add(
    makeTubeBetween(
      new THREE.Vector3(0.058, -0.06, 0),
      new THREE.Vector3(0.058, -forkLen, 0),
      0.013,
      framePaintMat
    ),
    makeTubeBetween(
      new THREE.Vector3(-0.058, -0.06, 0),
      new THREE.Vector3(-0.058, -forkLen, 0),
      0.013,
      framePaintMat
    )
  );

  // Front Fender
  const frontFenderGeo = new THREE.TorusGeometry(
    BIKE_DIMS.wheelRadius + 0.032,
    0.034,
    10,
    24,
    Math.PI * 0.72
  );
  frontFenderGeo.rotateY(Math.PI / 2);
  const frontFender = new THREE.Mesh(frontFenderGeo, framePaintMat);
  frontFender.position.set(0, -forkLen, 0);
  frontFender.rotation.x = -Math.PI * 0.14;
  forkSteerGroup.add(frontFender);
  disposables.push(frontFenderGeo);

  // Handlebar Stem & Swept Cruiser Bars
  const stemTop = new THREE.Vector3(0, 0.21, 0);
  forkSteerGroup.add(
    makeTubeBetween(new THREE.Vector3(0, 0.02, 0), stemTop, 0.014, chromeMat)
  );

  // Curved cruiser handlebar using CatmullRomCurve3
  const barCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.24, 0.25, -0.17), // Left grip end
    new THREE.Vector3(0.19, 0.255, -0.08),
    new THREE.Vector3(0.08, 0.22, -0.01),
    stemTop,
    new THREE.Vector3(-0.08, 0.22, -0.01),
    new THREE.Vector3(-0.19, 0.255, -0.08),
    new THREE.Vector3(-0.24, 0.25, -0.17), // Right grip end
  ]);
  const barGeo = new THREE.TubeGeometry(barCurve, 32, 0.0125, 10, false);
  const barMesh = new THREE.Mesh(barGeo, chromeMat);
  barMesh.castShadow = true;
  forkSteerGroup.add(barMesh);
  disposables.push(barGeo);

  // Leather Grips + IK Grip Anchors
  const gripGeo = new THREE.CylinderGeometry(0.0185, 0.0185, 0.11, 12);
  disposables.push(gripGeo);

  const gripLeftAnchor = new THREE.Object3D();
  gripLeftAnchor.position.set(0.225, 0.253, -0.13);
  forkSteerGroup.add(gripLeftAnchor);

  const leftGrip = new THREE.Mesh(gripGeo, leatherMat);
  leftGrip.position.copy(gripLeftAnchor.position);
  leftGrip.rotation.set(Math.PI * 0.44, 0.38, 0);
  forkSteerGroup.add(leftGrip);

  const gripRightAnchor = new THREE.Object3D();
  gripRightAnchor.position.set(-0.225, 0.253, -0.13);
  forkSteerGroup.add(gripRightAnchor);

  const rightGrip = new THREE.Mesh(gripGeo, leatherMat);
  rightGrip.position.copy(gripRightAnchor.position);
  rightGrip.rotation.set(Math.PI * 0.44, -0.38, 0);
  forkSteerGroup.add(rightGrip);

  // Interactive Brass Bicycle Bell near right handlebar
  const bellGroup = new THREE.Group();
  bellGroup.position.set(-0.13, 0.25, -0.05);
  bellGroup.userData.interactive = 'bell';
  const bellDomeGeo = new THREE.SphereGeometry(0.028, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58);
  const bellDome = new THREE.Mesh(bellDomeGeo, brassMat);
  bellDome.userData.interactive = 'bell';
  bellGroup.add(bellDome);

  const bellBaseGeo = new THREE.CylinderGeometry(0.027, 0.027, 0.012, 16);
  const bellBase = new THREE.Mesh(bellBaseGeo, darkMetalMat);
  bellBase.position.y = -0.004;
  bellBase.userData.interactive = 'bell';
  bellGroup.add(bellBase);

  const hammerGeo = new THREE.BoxGeometry(0.012, 0.008, 0.034);
  const bellHammer = new THREE.Mesh(hammerGeo, darkMetalMat);
  bellHammer.position.set(0.016, -0.002, -0.015);
  bellHammer.userData.interactive = 'bell';
  bellGroup.add(bellHammer);
  forkSteerGroup.add(bellGroup);
  disposables.push(bellDomeGeo, bellBaseGeo, hammerGeo);

  // Woven Rattan Front Basket + Jeju Hallabong Tangerines!
  const basketGroup = new THREE.Group();
  basketGroup.position.set(0, 0.14, 0.14);
  basketGroup.rotation.x = 0.25; // level out against fork rake
  forkSteerGroup.add(basketGroup);

  const basketOuterGeo = new THREE.CylinderGeometry(0.14, 0.105, 0.17, 16, 1, true);
  const basketOuter = new THREE.Mesh(basketOuterGeo, rattanMat);
  basketOuter.material.side = THREE.DoubleSide;
  basketOuter.castShadow = true;
  basketOuter.receiveShadow = true;
  basketGroup.add(basketOuter);

  const basketBottomGeo = new THREE.CylinderGeometry(0.105, 0.105, 0.014, 16);
  const basketBottom = new THREE.Mesh(basketBottomGeo, rattanMat);
  basketBottom.position.y = -0.08;
  basketGroup.add(basketBottom);

  const basketRimGeo = new THREE.TorusGeometry(0.14, 0.013, 10, 24);
  basketRimGeo.rotateX(Math.PI / 2);
  const basketRim = new THREE.Mesh(basketRimGeo, rattanMat);
  basketRim.position.y = 0.085;
  basketGroup.add(basketRim);
  disposables.push(basketOuterGeo, basketBottomGeo, basketRimGeo);

  // Two cute Jeju Hallabong tangerines in the basket!
  const fruitMat = new THREE.MeshStandardMaterial({
    color: 0xff7b1a,
    roughness: 0.45,
    metalness: 0.02,
  });
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x2f8a3c,
    roughness: 0.6,
  });
  const fruitGeo = new THREE.SphereGeometry(0.044, 14, 12);
  const topBumpGeo = new THREE.SphereGeometry(0.016, 10, 8);
  const leafGeo = new THREE.ConeGeometry(0.012, 0.032, 6);
  disposables.push(fruitMat, leafMat, fruitGeo, topBumpGeo, leafGeo);

  for (const [fx, fy, fz] of [
    [-0.048, 0.02, 0.03],
    [0.052, 0.015, -0.02],
  ]) {
    const halla = new THREE.Group();
    halla.position.set(fx, fy, fz);
    const body = new THREE.Mesh(fruitGeo, fruitMat);
    body.scale.set(1, 0.92, 1);
    body.castShadow = true;
    halla.add(body);
    const bump = new THREE.Mesh(topBumpGeo, fruitMat);
    bump.position.y = 0.042;
    halla.add(bump);
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.set(0.012, 0.05, 0);
    leaf.rotation.z = -0.6;
    halla.add(leaf);
    basketGroup.add(halla);
  }

  // Cheerful yellow & white coastal wildflowers in the wicker basket
  const flowerCenterMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.6 });
  const petalYellowMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.55 });
  const petalWhiteMat = new THREE.MeshStandardMaterial({ color: 0xfffbeb, roughness: 0.55 });
  const stemGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.13, 6);
  const fCenterGeo = new THREE.SphereGeometry(0.014, 10, 8);
  const fPetalGeo = new THREE.SphereGeometry(0.014, 8, 6);
  fPetalGeo.scale(1.5, 0.35, 0.65);
  disposables.push(flowerCenterMat, petalYellowMat, petalWhiteMat, stemGeo, fCenterGeo, fPetalGeo);

  const flowerPositions = [
    [-0.06, 0.09, -0.03, true],
    [0.0, 0.115, 0.04, false],
    [0.058, 0.105, 0.015, true],
    [-0.02, 0.125, -0.045, false],
    [0.025, 0.095, 0.06, true],
  ] as const;

  for (const [fx, fy, fz, isYellow] of flowerPositions) {
    const fl = new THREE.Group();
    fl.position.set(fx, fy, fz);
    fl.rotation.set((Math.random() - 0.5) * 0.35, Math.random() * Math.PI, (Math.random() - 0.5) * 0.35);

    const stem = new THREE.Mesh(stemGeo, leafMat);
    stem.position.y = -0.06;
    fl.add(stem);

    const center = new THREE.Mesh(fCenterGeo, flowerCenterMat);
    fl.add(center);

    const pMat = isYellow ? petalYellowMat : petalWhiteMat;
    for (let p = 0; p < 6; p++) {
      const ang = (p / 6) * Math.PI * 2;
      const pet = new THREE.Mesh(fPetalGeo, pMat);
      pet.position.set(Math.cos(ang) * 0.02, 0, Math.sin(ang) * 0.02);
      pet.rotation.y = -ang;
      fl.add(pet);
    }
    basketGroup.add(fl);
  }

  // Mini Korean Taegeukgi flag fluttering on the front basket
  const flagPoleGeo = new THREE.CylinderGeometry(0.0045, 0.0045, 0.28, 8);
  const flagPole = new THREE.Mesh(flagPoleGeo, chromeMat);
  flagPole.position.set(-0.085, 0.16, 0.02);
  basketGroup.add(flagPole);

  const flagGeo = new THREE.PlaneGeometry(0.14, 0.095, 8, 4);
  flagGeo.translate(0.07, 0, 0);
  const flagMat = new THREE.MeshStandardMaterial({
    map: textures.taegeukgiFlag,
    side: THREE.DoubleSide,
    roughness: 0.72,
  });
  const flagMesh = new THREE.Mesh(flagGeo, flagMat);
  flagMesh.position.set(-0.085, 0.25, 0.02);
  flagMesh.rotation.y = Math.PI * 0.45;
  flagMesh.castShadow = true;
  basketGroup.add(flagMesh);
  disposables.push(flagPoleGeo, flagGeo, flagMat);

  basketGroup.traverse((obj) => {
    obj.userData.interactive = 'basket';
  });

  // Vintage Chrome Bullet Headlamp + Dynamic SpotLight
  const lampGroup = new THREE.Group();
  lampGroup.position.set(0, -0.035, 0.065);
  lampGroup.rotation.x = 0.31; // Level forward
  forkSteerGroup.add(lampGroup);

  const lampHousingGeo = new THREE.SphereGeometry(0.038, 16, 12);
  lampHousingGeo.scale(1, 1, 1.35);
  const lampHousing = new THREE.Mesh(lampHousingGeo, chromeMat);
  lampGroup.add(lampHousing);

  const lampLensGeo = new THREE.CircleGeometry(0.033, 16);
  const lampLens = new THREE.Mesh(lampLensGeo, headlightBulbMat);
  lampLens.position.set(0, 0, 0.052);
  lampGroup.add(lampLens);
  disposables.push(lampHousingGeo, lampLensGeo);

  const headlightSpot = new THREE.SpotLight(0xffe6a8, 0, 26, Math.PI / 5, 0.55, 1.4);
  headlightSpot.position.set(0, 0, 0.06);
  const spotTarget = new THREE.Object3D();
  spotTarget.position.set(0, -0.65, 9.5);
  lampGroup.add(spotTarget);
  headlightSpot.target = spotTarget;
  lampGroup.add(headlightSpot);

  return {
    group,
    frontWheel,
    rearWheel,
    crankGroup,
    leftPedal,
    rightPedal,
    forkSteerGroup,
    gripLeftAnchor,
    gripRightAnchor,
    bellGroup,
    bellHammer,
    basketGroup,
    flagMesh,
    headlightBulbMat,
    headlightSpot,
    dispose: () => {
      for (const d of disposables) d.dispose();
    },
  };
}
