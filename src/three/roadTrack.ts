import * as THREE from 'three';
import { ROAD_CONFIG } from './constants';
import type { TextureBundle } from './textures';

export interface RoadTrack {
  curve: THREE.CatmullRomCurve3;
  length: number;
  group: THREE.Group;
  sampleAt: (
    u: number,
    outPos: THREE.Vector3,
    outTangent: THREE.Vector3,
    outRight: THREE.Vector3
  ) => number; // returns signed curvature
  getTerrainHeight: (x: number, z: number) => number;
  getNearestRoadDistance: (x: number, z: number) => { dist: number; roadY: number; u: number };
  dispose: () => void;
}

const UP = new THREE.Vector3(0, 1, 0);

export function createCoastalRoadTrack(textures: TextureBundle): RoadTrack {
  const controlPoints: THREE.Vector3[] = [];
  const numCtrl = 24;
  const baseR = ROAD_CONFIG.loopRadius;

  for (let i = 0; i < numCtrl; i++) {
    const theta = (i / numCtrl) * Math.PI * 2;
    // Organic Korean coastline peninsula undulations
    const r =
      baseR +
      Math.sin(theta * 2 + 0.4) * 14 +
      Math.cos(theta * 3 - 0.7) * 9 +
      Math.sin(theta * 5) * 4.5;
    // Gentle coastal elevation changes (2.4m to 5.4m above sea level)
    const y = 3.6 + Math.sin(theta * 2 + 1.1) * 1.15 + Math.cos(theta * 4) * 0.45;
    const x = Math.cos(theta) * r;
    const z = -Math.sin(theta) * r;
    controlPoints.push(new THREE.Vector3(x, y, z));
  }

  const curve = new THREE.CatmullRomCurve3(controlPoints, true, 'catmullrom', 0.5);
  const length = curve.getLength();

  // Precompute dense lookup samples for fast terrain blending & nearest-road queries
  const lookupCount = 360;
  const lookupPts: THREE.Vector3[] = [];
  for (let i = 0; i < lookupCount; i++) {
    lookupPts.push(curve.getPointAt(i / lookupCount));
  }

  function getNearestRoadDistance(x: number, z: number) {
    let minDistSq = Infinity;
    let bestIdx = 0;
    for (let i = 0; i < lookupCount; i++) {
      const p = lookupPts[i];
      const dx = x - p.x;
      const dz = z - p.z;
      const d2 = dx * dx + dz * dz;
      if (d2 < minDistSq) {
        minDistSq = d2;
        bestIdx = i;
      }
    }
    return {
      dist: Math.sqrt(minDistSq),
      roadY: lookupPts[bestIdx].y,
      u: bestIdx / lookupCount,
    };
  }

  function getTerrainHeight(x: number, z: number): number {
    const { dist, roadY } = getNearestRoadDistance(x, z);
    const halfW = ROAD_CONFIG.roadWidth * 0.5;
    const radialDist = Math.sqrt(x * x + z * z);

    // Estimate local coastline radius at angle
    const angle = Math.atan2(-z, x);
    const approxRoadR =
      baseR +
      Math.sin(angle * 2 + 0.4) * 14 +
      Math.cos(angle * 3 - 0.7) * 9 +
      Math.sin(angle * 5) * 4.5;

    // Inland hills (inside the loop) vs coastal cliff drop (outside toward ocean)
    const inlandFactor = THREE.MathUtils.clamp((approxRoadR - radialDist) / 26, 0, 1);
    const seaDropFactor = THREE.MathUtils.clamp((radialDist - (approxRoadR + halfW + 1.5)) / 11, 0, 1);

    const hillNoise =
      Math.sin(x * 0.045) * Math.cos(z * 0.045) * 6.5 +
      Math.sin(x * 0.11 + z * 0.09) * 2.2 +
      Math.cos(x * 0.025 - z * 0.03) * 4.0;

    // Gentle hill inside the loop, dropping to -2.2m seafloor outside
    let naturalY =
      roadY +
      inlandFactor * (9.5 + Math.max(0, hillNoise)) -
      seaDropFactor * (roadY + 2.6);

    // Subtle rocky shelf near waterline
    if (seaDropFactor > 0.15 && seaDropFactor < 0.7) {
      naturalY += Math.sin(x * 0.35) * Math.cos(z * 0.35) * 0.45;
    }

    // Smoothly flatten terrain to match roadbed height across the road corridor
    const roadBlend = 1 - THREE.MathUtils.smoothstep(dist, halfW + 0.4, halfW + 6.5);
    // Keep roadbed slightly recessed by 0.03m under the raised asphalt surface so terrain never Z-fights
    return THREE.MathUtils.lerp(naturalY, roadY - 0.04, roadBlend);
  }

  const group = new THREE.Group();
  const disposables: { dispose: () => void }[] = [];

  // 1. Road ribbon geometry (with raised concrete curbs on both sides)
  const segments = ROAD_CONFIG.samples;
  const halfRoad = ROAD_CONFIG.roadWidth * 0.5;
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const curbPositions: number[] = [];
  const curbNormals: number[] = [];
  const curbUvs: number[] = [];
  const curbIndices: number[] = [];

  const wallPositions: number[] = [];
  const wallNormals: number[] = [];
  const wallUvs: number[] = [];
  const wallIndices: number[] = [];

  const p = new THREE.Vector3();
  const t = new THREE.Vector3();
  const right = new THREE.Vector3();

  for (let i = 0; i <= segments; i++) {
    const u = (i % segments) / segments;
    curve.getPointAt(u, p);
    curve.getTangentAt(u, t).normalize();
    right.crossVectors(t, UP).normalize();

    const vCoord = i / segments;

    // Left edge (inland) & Right edge (ocean side)
    const lx = p.x - right.x * halfRoad;
    const ly = p.y;
    const lz = p.z - right.z * halfRoad;

    const rx = p.x + right.x * halfRoad;
    const ry = p.y;
    const rz = p.z + right.z * halfRoad;

    positions.push(lx, ly, lz, rx, ry, rz);
    normals.push(0, 1, 0, 0, 1, 0);
    uvs.push(0, vCoord, 1, vCoord);

    if (i < segments) {
      const base = i * 2;
      indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
    }

    // Concrete sidewalk/curb shoulders on both sides (each 0.55m wide, 0.14m tall)
    const curbInner = halfRoad;
    const curbOuter = halfRoad + 0.58;
    const curbTop = 0.14;
    const curbBot = -0.25;

    // Sea-side curb (4 vertices per slice: bot-in, top-in, top-out, bot-out)
    for (const side of [-1, 1]) {
      const sIn = side * curbInner;
      const sOut = side * curbOuter;
      const baseV = curbPositions.length / 3;

      curbPositions.push(
        p.x + right.x * sIn,
        p.y + curbBot,
        p.z + right.z * sIn,
        p.x + right.x * sIn,
        p.y + curbTop,
        p.z + right.z * sIn,
        p.x + right.x * sOut,
        p.y + curbTop,
        p.z + right.z * sOut,
        p.x + right.x * sOut,
        p.y + curbBot,
        p.z + right.z * sOut
      );

      curbNormals.push(
        -right.x * side,
        0.3,
        -right.z * side,
        0,
        1,
        0,
        0,
        1,
        0,
        right.x * side,
        0.3,
        right.z * side
      );

      curbUvs.push(0, vCoord * 80, 0.25, vCoord * 80, 0.75, vCoord * 80, 1, vCoord * 80);

      if (i < segments) {
        const nextStride = 8; // 2 sides * 4 verts
        const a = baseV;
        const b = baseV + nextStride;
        for (let k = 0; k < 3; k++) {
          if (side === 1) {
            curbIndices.push(a + k, b + k, a + k + 1, a + k + 1, b + k, b + k + 1);
          } else {
            curbIndices.push(a + k, a + k + 1, b + k, a + k + 1, b + k + 1, b + k);
          }
        }
      }
    }

    // Jeju volcanic basalt stone wall (Doldam) along the ocean cliff edge (offset +halfRoad + 0.35)
    const wallOffset = halfRoad + 0.34;
    const wallHalfThick = 0.22;
    const wallH = 0.68;
    const wBase = wallPositions.length / 3;
    const wIn = wallOffset - wallHalfThick;
    const wOut = wallOffset + wallHalfThick;

    wallPositions.push(
      p.x + right.x * wIn,
      p.y + 0.1,
      p.z + right.z * wIn,
      p.x + right.x * wIn,
      p.y + wallH,
      p.z + right.z * wIn,
      p.x + right.x * wOut,
      p.y + wallH,
      p.z + right.z * wOut,
      p.x + right.x * wOut,
      p.y + 0.1,
      p.z + right.z * wOut
    );
    wallNormals.push(
      -right.x,
      0.2,
      -right.z,
      -right.x * 0.3,
      1,
      -right.z * 0.3,
      right.x * 0.3,
      1,
      right.z * 0.3,
      right.x,
      0.2,
      right.z
    );
    wallUvs.push(0, vCoord * 60, 0.35, vCoord * 60, 0.65, vCoord * 60, 1, vCoord * 60);

    if (i < segments) {
      const a = wBase;
      const b = wBase + 4;
      for (let k = 0; k < 3; k++) {
        wallIndices.push(a + k, b + k, a + k + 1, a + k + 1, b + k, b + k + 1);
      }
    }
  }

  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  roadGeo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  roadGeo.setIndex(indices);
  roadGeo.computeVertexNormals();

  const roadMat = new THREE.MeshStandardMaterial({
    map: textures.roadAlbedo,
    bumpMap: textures.roadBump,
    bumpScale: 0.015,
    roughness: 0.82,
    metalness: 0.05,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const roadMesh = new THREE.Mesh(roadGeo, roadMat);
  roadMesh.receiveShadow = true;
  group.add(roadMesh);
  disposables.push(roadGeo, roadMat);

  const curbGeo = new THREE.BufferGeometry();
  curbGeo.setAttribute('position', new THREE.Float32BufferAttribute(curbPositions, 3));
  curbGeo.setAttribute('normal', new THREE.Float32BufferAttribute(curbNormals, 3));
  curbGeo.setAttribute('uv', new THREE.Float32BufferAttribute(curbUvs, 2));
  curbGeo.setIndex(curbIndices);
  curbGeo.computeVertexNormals();

  const curbMat = new THREE.MeshStandardMaterial({
    color: 0xc2c7cc,
    roughness: 0.88,
    metalness: 0.02,
  });
  const curbMesh = new THREE.Mesh(curbGeo, curbMat);
  curbMesh.receiveShadow = true;
  curbMesh.castShadow = true;
  group.add(curbMesh);
  disposables.push(curbGeo, curbMat);

  // Jeju Doldam stone wall along the sea edge
  const wallGeo = new THREE.BufferGeometry();
  wallGeo.setAttribute('position', new THREE.Float32BufferAttribute(wallPositions, 3));
  wallGeo.setAttribute('normal', new THREE.Float32BufferAttribute(wallNormals, 3));
  wallGeo.setAttribute('uv', new THREE.Float32BufferAttribute(wallUvs, 2));
  wallGeo.setIndex(wallIndices);
  wallGeo.computeVertexNormals();

  const wallMat = new THREE.MeshStandardMaterial({
    map: textures.stoneWall,
    roughness: 0.92,
    metalness: 0.04,
  });
  const wallMesh = new THREE.Mesh(wallGeo, wallMat);
  wallMesh.castShadow = true;
  wallMesh.receiveShadow = true;
  group.add(wallMesh);
  disposables.push(wallGeo, wallMat);

  // 2. Crisp white Korean coastal guardrail posts & horizontal rail along the sea edge
  const postCount = 90;
  const postGeo = new THREE.BoxGeometry(0.085, 0.92, 0.085);
  postGeo.translate(0, 0.46, 0);
  const postMat = new THREE.MeshStandardMaterial({
    color: 0xf1f4f8,
    roughness: 0.42,
    metalness: 0.15,
  });
  const reflectorGeo = new THREE.BoxGeometry(0.09, 0.075, 0.09);
  reflectorGeo.translate(0, 0.82, 0);
  const reflectorMat = new THREE.MeshStandardMaterial({
    color: 0xffa326,
    emissive: 0xff7700,
    emissiveIntensity: 0.4,
    roughness: 0.25,
    metalness: 0.2,
  });

  const postInst = new THREE.InstancedMesh(postGeo, postMat, postCount);
  const refInst = new THREE.InstancedMesh(reflectorGeo, reflectorMat, postCount);
  postInst.castShadow = true;
  const dummy = new THREE.Object3D();

  const railCurvePts: THREE.Vector3[] = [];
  for (let i = 0; i < postCount; i++) {
    const u = i / postCount;
    curve.getPointAt(u, p);
    curve.getTangentAt(u, t).normalize();
    right.crossVectors(t, UP).normalize();

    const rx = p.x + right.x * (halfRoad + 0.08);
    const ry = p.y + 0.1;
    const rz = p.z + right.z * (halfRoad + 0.08);
    railCurvePts.push(new THREE.Vector3(rx, ry + 0.72, rz));

    dummy.position.set(rx, ry, rz);
    dummy.rotation.set(0, Math.atan2(t.x, t.z), 0);
    dummy.updateMatrix();
    postInst.setMatrixAt(i, dummy.matrix);
    refInst.setMatrixAt(i, dummy.matrix);
  }
  postInst.instanceMatrix.needsUpdate = true;
  refInst.instanceMatrix.needsUpdate = true;
  postInst.computeBoundingSphere();
  refInst.computeBoundingSphere();
  group.add(postInst, refInst);

  // Continuous white horizontal coastal guardrail bar
  const railCurve = new THREE.CatmullRomCurve3(railCurvePts, true);
  const railGeo = new THREE.TubeGeometry(railCurve, 260, 0.042, 8, true);
  const railMesh = new THREE.Mesh(railGeo, postMat);
  railMesh.castShadow = true;
  group.add(railMesh);

  disposables.push(postGeo, postMat, reflectorGeo, reflectorMat, railGeo);

  const _tNext = new THREE.Vector3();

  function sampleAt(
    u: number,
    outPos: THREE.Vector3,
    outTangent: THREE.Vector3,
    outRight: THREE.Vector3
  ): number {
    const wrapped = ((u % 1) + 1) % 1;
    const uNext = (wrapped + 0.005) % 1;
    curve.getPointAt(wrapped, outPos);
    curve.getTangentAt(wrapped, outTangent).normalize();
    outRight.crossVectors(outTangent, UP).normalize();

    curve.getTangentAt(uNext, _tNext).normalize();
    // Signed yaw delta around UP: positive = turning left (+X in local bike frame)
    const crossY = outTangent.z * _tNext.x - outTangent.x * _tNext.z;
    return crossY / 0.005;
  }

  return {
    curve,
    length,
    group,
    sampleAt,
    getTerrainHeight,
    getNearestRoadDistance,
    dispose: () => {
      for (const d of disposables) d.dispose();
    },
  };
}
