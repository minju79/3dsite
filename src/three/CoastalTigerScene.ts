import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  ATMOSPHERE_PRESETS,
  BIKE_DIMS,
  type CameraPreset,
  type SceneHUDState,
  type TimeOfDay,
} from './constants';
import { createBicycle, type BicycleRig } from './createBicycle';
import { createCoastalEnvironment, type CoastalEnvironment } from './createEnvironment';
import { createTiger, type TigerActionTimers, type TigerRig } from './createTiger';
import { createCoastalRoadTrack, type RoadTrack } from './roadTrack';
import { CoastalSoundEngine } from './soundEngine';
import { createTextureBundle, type TextureBundle } from './textures';

// Pre-allocated math objects for zero-GC render loop
const _pos = new THREE.Vector3();
const _tan = new THREE.Vector3();
const _right = new THREE.Vector3();
const _posAhead = new THREE.Vector3();
const _posBehind = new THREE.Vector3();
const _prevBikePos = new THREE.Vector3();
const _deltaMove = new THREE.Vector3();
const _gripL = new THREE.Vector3();
const _gripR = new THREE.Vector3();
const _desiredCamPos = new THREE.Vector3();
const _desiredTarget = new THREE.Vector3();
const _forwardXZ = new THREE.Vector3();
const _rightXZ = new THREE.Vector3();
const _sunDir = new THREE.Vector3();
const _rayMouse = new THREE.Vector2();

function detectSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export class CoastalTigerScene {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private isSoftwareGl: boolean;

  private textures: TextureBundle;
  private roadTrack: RoadTrack;
  private environment: CoastalEnvironment;
  private bicycle: BicycleRig;
  private tiger: TigerRig;
  private bikeRoot: THREE.Group;
  private soundEngine: CoastalSoundEngine;

  private sunLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private rimLight: THREE.DirectionalLight;
  private fog: THREE.FogExp2;
  private envRT: THREE.WebGLRenderTarget;

  private raycaster = new THREE.Raycaster();
  private clickableObjects: THREE.Object3D[] = [];
  private lastRaycastMs = 0;

  // Simulation state
  private frameId = 0;
  private lastTimestamp = 0;
  private elapsedTime = 0;
  private distanceMeters = 0;
  private wheelAngle = 0;
  private crankAngle = 0;
  private baseSpeedKmh = 15.5;
  private paceMultiplier = 1.0;
  private currentSpeedKmh = 15.5;
  private paused = false;

  private autoLane = true;
  private blossomsEnabled = true;
  private laneOffset = 2.25;
  private laneVel = 0;
  private uiSteerDir = 0; // -1 left, +1 right from UI hold buttons
  private steerAngle = 0;
  private rollAngle = 0;

  private bellTimer = 0;
  private jumpTimer = 0;
  private actions: TigerActionTimers = {
    happyTimer: 0,
    waveTimer: 0,
    petTimer: 0,
    manseTimer: 0,
    roarTimer: 0,
    snackTimer: 0,
  };

  private cameraPreset: CameraPreset = 'follow';
  private timeOfDay: TimeOfDay = 'morning';
  private soundEnabled = false;
  private musicEnabled = false;
  private cameraTransitionActive = true;
  private followModeAutoAlign = true;

  private keysPressed = new Set<string>();
  private hudCallback: (state: SceneHUDState) => void;
  private lastHudEmit = 0;
  private contextLost = false;
  private disposed = false;

  constructor(
    container: HTMLElement,
    onHudUpdate: (state: SceneHUDState) => void
  ) {
    this.container = container;
    this.hudCallback = onHudUpdate;
    this.isSoftwareGl = detectSoftwareWebGL();

    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = ATMOSPHERE_PRESETS.morning.exposure;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.fog = new THREE.FogExp2(
      ATMOSPHERE_PRESETS.morning.fogColor,
      ATMOSPHERE_PRESETS.morning.fogDensity
    );
    this.scene.fog = this.fog;

    // Mandatory RoomEnvironment IBL setup
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
    this.scene.environment = this.envRT.texture;
    pmrem.dispose();

    this.camera = new THREE.PerspectiveCamera(46, width / height, 0.15, 700);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.06;
    this.controls.minDistance = 1.6;
    this.controls.maxDistance = 36;
    this.controls.maxPolarAngle = Math.PI * 0.485;
    this.controls.enablePan = false;

    this.controls.addEventListener('start', () => {
      this.cameraTransitionActive = false;
      this.followModeAutoAlign = false;
    });

    // 3-Point + Hemisphere Coastal Lighting Rig
    this.hemiLight = new THREE.HemisphereLight(
      ATMOSPHERE_PRESETS.morning.hemiSky,
      ATMOSPHERE_PRESETS.morning.hemiGround,
      ATMOSPHERE_PRESETS.morning.hemiIntensity
    );
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(
      ATMOSPHERE_PRESETS.morning.sunColor,
      ATMOSPHERE_PRESETS.morning.sunIntensity
    );
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    const d = 14;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.camera.near = 2;
    this.sunLight.shadow.camera.far = 90;
    this.sunLight.shadow.bias = -0.0004;
    this.sunLight.shadow.normalBias = 0.025;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    this.rimLight = new THREE.DirectionalLight(
      ATMOSPHERE_PRESETS.morning.rimColor,
      ATMOSPHERE_PRESETS.morning.rimIntensity
    );
    this.scene.add(this.rimLight);
    this.scene.add(this.rimLight.target);

    // Build modular scene assets
    this.textures = createTextureBundle(this.renderer);
    this.roadTrack = createCoastalRoadTrack(this.textures);
    this.scene.add(this.roadTrack.group);

    this.environment = createCoastalEnvironment(this.roadTrack, this.textures);
    this.scene.add(this.environment.group);

    this.bikeRoot = new THREE.Group();
    this.scene.add(this.bikeRoot);

    this.bicycle = createBicycle(this.textures);
    this.bikeRoot.add(this.bicycle.group);

    this.tiger = createTiger(this.textures);
    this.bicycle.group.add(this.tiger.group);

    this.soundEngine = new CoastalSoundEngine();

    // Collect interactive hit meshes (tiger head, tiger body, basket, bell)
    this.tiger.group.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        this.clickableObjects.push(obj);
      }
    });
    this.bicycle.bellGroup.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        this.clickableObjects.push(obj);
      }
    });
    this.bicycle.basketGroup.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        this.clickableObjects.push(obj);
      }
    });

    // Place rider right near the scenic wooden signpost & milestone vista
    this.distanceMeters = this.roadTrack.length * 0.088;
    this.applyAtmosphere('morning');
    this.updateRiderTransform(0);
    this.snapCameraToPreset('follow');

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.bindEvents();
    this.emitHud(true);
    this.startLoop();
  }

  private bindEvents() {
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    this.renderer.domElement.addEventListener('pointermove', this.onPointerMove);
    this.renderer.domElement.addEventListener('click', this.onCanvasClick);
    this.renderer.domElement.addEventListener('webglcontextlost', this.onContextLost);
    this.renderer.domElement.addEventListener('webglcontextrestored', this.onContextRestored);
  }

  private onContextLost = (e: Event) => {
    e.preventDefault();
    this.contextLost = true;
  };

  private onContextRestored = () => {
    this.contextLost = false;
  };

  private onResize = () => {
    if (this.disposed) return;
    const w = Math.max(this.container.clientWidth, 1);
    const h = Math.max(this.container.clientHeight, 1);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
    );
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (
      e.target instanceof HTMLElement &&
      e.target.closest('input, textarea, select, button, a')
    ) {
      return;
    }
    this.keysPressed.add(e.code);
    switch (e.code) {
      case 'KeyB':
        this.ringBell();
        break;
      case 'KeyF':
        this.triggerHop();
        break;
      case 'KeyR':
        this.triggerRoar();
        break;
      case 'KeyJ':
        this.triggerManse();
        break;
      case 'KeyP':
        this.triggerPet();
        break;
      case 'KeyT':
        this.triggerSnack();
        break;
      case 'KeyM':
        this.toggleMusic();
        break;
      case 'Digit1':
        this.setCameraPreset('follow');
        break;
      case 'Digit2':
        this.setCameraPreset('side');
        break;
      case 'Digit3':
        this.setCameraPreset('front');
        break;
      case 'Digit4':
        this.setCameraPreset('aerial');
        break;
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keysPressed.delete(e.code);
  };

  private onPointerMove = (e: PointerEvent) => {
    const now = performance.now();
    if (now - this.lastRaycastMs < 60) return;
    this.lastRaycastMs = now;

    const rect = this.renderer.domElement.getBoundingClientRect();
    _rayMouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    _rayMouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(_rayMouse, this.camera);
    const hits = this.raycaster.intersectObjects(this.clickableObjects, false);
    this.renderer.domElement.style.cursor = hits.length > 0 ? 'pointer' : 'grab';
  };

  private onCanvasClick = (e: MouseEvent) => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    _rayMouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    _rayMouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(_rayMouse, this.camera);
    const hits = this.raycaster.intersectObjects(this.clickableObjects, false);
    if (hits.length === 0) return;

    const tag = hits[0].object.userData.interactive;
    if (tag === 'tiger-head') {
      this.triggerPet();
    } else if (tag === 'tiger-body') {
      this.triggerManse();
    } else if (tag === 'basket') {
      this.triggerSnack();
    } else {
      this.ringBell();
    }
  };

  // Interactive Public API
  public setPaceMultiplier(mult: number) {
    this.paceMultiplier = THREE.MathUtils.clamp(mult, 0, 2.5);
    if (mult > 0.05 && this.paused) {
      this.paused = false;
    }
    this.emitHud(true);
  }

  public togglePause() {
    this.paused = !this.paused;
    this.emitHud(true);
  }

  public toggleAutoLane() {
    this.autoLane = !this.autoLane;
    this.emitHud(true);
  }

  public setManualSteerDir(dir: number) {
    this.uiSteerDir = dir;
    if (dir !== 0 && this.autoLane) {
      this.autoLane = false;
      this.emitHud(true);
    }
  }

  public toggleBlossoms() {
    this.blossomsEnabled = !this.blossomsEnabled;
    this.environment.setBlossomsEnabled(this.blossomsEnabled);
    this.emitHud(true);
  }

  public setCameraPreset(preset: CameraPreset) {
    this.cameraPreset = preset;
    this.cameraTransitionActive = true;
    this.followModeAutoAlign = preset === 'follow';
    this.emitHud(true);
  }

  public setTimeOfDay(mode: TimeOfDay) {
    this.timeOfDay = mode;
    this.applyAtmosphere(mode);
    this.emitHud(true);
  }

  public toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    this.soundEngine.setSoundEnabled(this.soundEnabled);
    this.emitHud(true);
  }

  public toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    this.soundEngine.setMusicEnabled(this.musicEnabled);
    this.emitHud(true);
  }

  public ringBell() {
    this.bellTimer = 0.55;
    this.actions.happyTimer = 1.4;
    this.soundEngine.ringBell();
  }

  public triggerWave() {
    this.actions.waveTimer = 2.0;
    this.actions.happyTimer = 1.5;
    this.soundEngine.playSparkle([659.25, 783.99]);
  }

  public triggerPet() {
    this.actions.petTimer = 2.2;
    this.actions.happyTimer = 2.0;
    this.soundEngine.playSparkle([523.25, 659.25, 783.99, 987.77]);
  }

  public triggerManse() {
    this.actions.manseTimer = 2.0;
    this.actions.happyTimer = 1.8;
    this.soundEngine.playSparkle([523.25, 659.25, 783.99, 1046.5]);
  }

  public triggerRoar() {
    this.actions.roarTimer = 1.4;
    this.actions.happyTimer = 1.2;
    this.soundEngine.playRoar();
  }

  public triggerHop() {
    if (this.jumpTimer <= 0.02) {
      this.jumpTimer = 0.72;
      this.actions.happyTimer = 1.0;
      this.soundEngine.playHop();
    }
  }

  public triggerSnack() {
    this.actions.snackTimer = 2.2;
    this.actions.happyTimer = 1.8;
    this.soundEngine.playSparkle([587.33, 739.99, 880.0]);
  }

  public resetView() {
    this.laneOffset = 2.25;
    this.autoLane = true;
    this.setCameraPreset('follow');
  }

  private applyAtmosphere(mode: TimeOfDay) {
    const p = ATMOSPHERE_PRESETS[mode];
    const el = THREE.MathUtils.degToRad(p.sunElevationDeg);
    const az = THREE.MathUtils.degToRad(p.sunAzimuthDeg);

    _sunDir.set(
      Math.cos(el) * Math.cos(az),
      Math.sin(el),
      Math.cos(el) * Math.sin(az)
    ).normalize();

    this.sunLight.color.setHex(p.sunColor);
    this.sunLight.intensity = p.sunIntensity;
    this.hemiLight.color.setHex(p.hemiSky);
    this.hemiLight.groundColor.setHex(p.hemiGround);
    this.hemiLight.intensity = p.hemiIntensity;
    this.rimLight.color.setHex(p.rimColor);
    this.rimLight.intensity = p.rimIntensity;

    this.fog.color.setHex(p.fogColor);
    this.fog.density = p.fogDensity;
    this.renderer.toneMappingExposure = p.exposure;

    this.bicycle.headlightSpot.intensity = p.headlightIntensity;
    this.bicycle.headlightBulbMat.emissiveIntensity =
      p.headlightIntensity > 0.2 ? 2.6 : 0.25;

    this.environment.applyAtmosphere(p, _sunDir);
  }

  private getPresetOffsets(preset: CameraPreset) {
    switch (preset) {
      case 'follow':
        return { fwd: -3.55, side: 1.85, up: 1.75, targetUp: 0.92, targetFwd: 0.3 };
      case 'side':
        return { fwd: 0.15, side: 3.15, up: 0.85, targetUp: 0.65, targetFwd: 0.0 };
      case 'front':
        return { fwd: 3.05, side: 0.95, up: 1.28, targetUp: 0.98, targetFwd: 0.1 };
      case 'aerial':
        return { fwd: -9.5, side: 7.5, up: 8.6, targetUp: 0.8, targetFwd: 2.0 };
    }
  }

  private computePresetVectors(preset: CameraPreset) {
    const off = this.getPresetOffsets(preset);
    _forwardXZ.set(0, 0, 1).applyQuaternion(this.bikeRoot.quaternion);
    _forwardXZ.y = 0;
    if (_forwardXZ.lengthSq() < 1e-5) _forwardXZ.set(0, 0, 1);
    _forwardXZ.normalize();

    _rightXZ.crossVectors(_forwardXZ, THREE.Object3D.DEFAULT_UP).normalize();

    _desiredTarget
      .copy(this.bikeRoot.position)
      .addScaledVector(_forwardXZ, off.targetFwd);
    _desiredTarget.y += off.targetUp;

    _desiredCamPos
      .copy(this.bikeRoot.position)
      .addScaledVector(_forwardXZ, off.fwd)
      .addScaledVector(_rightXZ, off.side);
    _desiredCamPos.y += off.up;
  }

  private snapCameraToPreset(preset: CameraPreset) {
    this.computePresetVectors(preset);
    this.camera.position.copy(_desiredCamPos);
    this.controls.target.copy(_desiredTarget);
    this.controls.update();
  }

  private updateRiderTransform(dt: number) {
    // Keyboard pace adjustment
    if (this.keysPressed.has('KeyW') || this.keysPressed.has('ArrowUp')) {
      this.paceMultiplier = Math.min(2.5, this.paceMultiplier + 0.9 * dt);
      if (this.paused) this.paused = false;
    }
    if (this.keysPressed.has('KeyS') || this.keysPressed.has('ArrowDown')) {
      this.paceMultiplier = Math.max(0.2, this.paceMultiplier - 0.9 * dt);
    }

    const steerLeft =
      this.keysPressed.has('KeyA') ||
      this.keysPressed.has('ArrowLeft') ||
      this.uiSteerDir < 0;
    const steerRight =
      this.keysPressed.has('KeyD') ||
      this.keysPressed.has('ArrowRight') ||
      this.uiSteerDir > 0;
    const manualSteerInput = (steerLeft ? -1 : 0) + (steerRight ? 1 : 0);

    if (manualSteerInput !== 0 && this.autoLane) {
      this.autoLane = false;
    }

    const desiredGoalKmh = this.paused
      ? 0
      : this.baseSpeedKmh * this.paceMultiplier;
    this.currentSpeedKmh = THREE.MathUtils.damp(
      this.currentSpeedKmh,
      desiredGoalKmh,
      4.5,
      dt
    );

    const speedMs = this.currentSpeedKmh / 3.6;
    const speedNorm = THREE.MathUtils.clamp(this.currentSpeedKmh / 24, 0, 1.3);

    this.distanceMeters += speedMs * dt;
    const u = ((this.distanceMeters / this.roadTrack.length) % 1 + 1) % 1;

    // Exact wheel & pedal crank sync
    const dWheel = (speedMs * dt) / BIKE_DIMS.wheelRadius;
    this.wheelAngle += dWheel;
    this.crankAngle = this.wheelAngle / BIKE_DIMS.gearRatio;

    const curvature = this.roadTrack.sampleAt(u, _pos, _tan, _right);

    // Auto Lane gently centers in the red coastal bike lane with subtle scenic weaving,
    // or manual steering shifts freely across the road!
    let targetLaneVel = manualSteerInput * 2.15 * (0.35 + 0.65 * speedNorm);
    if (this.autoLane) {
      const targetLane = 2.25 + Math.sin(this.elapsedTime * 0.45) * 0.24;
      targetLaneVel = (targetLane - this.laneOffset) * 1.8;
    }
    this.laneVel = THREE.MathUtils.damp(this.laneVel, targetLaneVel, 8, dt);
    this.laneOffset = THREE.MathUtils.clamp(
      this.laneOffset + this.laneVel * dt,
      -2.6,
      3.05
    );
    if (
      (this.laneOffset <= -2.59 && this.laneVel < 0) ||
      (this.laneOffset >= 3.04 && this.laneVel > 0)
    ) {
      this.laneVel = 0;
    }

    const stepU = 1.4 / this.roadTrack.length;
    this.roadTrack.curve.getPointAt((u + stepU) % 1, _posAhead);
    this.roadTrack.curve.getPointAt(((u - stepU) % 1 + 1) % 1, _posBehind);
    const roadPitch = Math.atan2(_posAhead.y - _posBehind.y, 2.8);

    // Bicycle Bunny Hop ("점프") vertical arc & nose pitch
    let jumpY = 0;
    let jumpPitch = 0;
    if (this.jumpTimer > 0) {
      this.jumpTimer = Math.max(0, this.jumpTimer - dt);
      const p = 1 - this.jumpTimer / 0.72; // 0..1
      jumpY = Math.sin(p * Math.PI) * 0.56;
      jumpPitch = Math.cos(p * Math.PI) * 0.24;
    }

    _prevBikePos.copy(this.bikeRoot.position);
    this.bikeRoot.position.set(
      _pos.x + _right.x * this.laneOffset,
      _pos.y + 0.005 + jumpY,
      _pos.z + _right.z * this.laneOffset
    );

    const lateralYaw = -Math.atan2(this.laneVel, Math.max(speedMs, 3.0)) * 0.7;
    const roadYaw = Math.atan2(_tan.x, _tan.z);
    this.bikeRoot.rotation.set(0, roadYaw + lateralYaw, 0);

    const roadSteer = THREE.MathUtils.clamp(curvature * 0.11, -0.28, 0.28);
    const manualSteer = THREE.MathUtils.clamp(
      -this.laneVel * 0.2,
      -0.34,
      0.34
    );
    const targetSteer = THREE.MathUtils.clamp(
      roadSteer + manualSteer,
      -0.44,
      0.44
    );
    this.steerAngle = THREE.MathUtils.damp(this.steerAngle, targetSteer, 9.5, dt);

    const targetRoll = THREE.MathUtils.clamp(
      this.steerAngle * 0.55 * (0.25 + 0.75 * speedNorm),
      -0.25,
      0.25
    );
    this.rollAngle = THREE.MathUtils.damp(this.rollAngle, targetRoll, 7.5, dt);

    this.bicycle.group.rotation.x = -roadPitch - jumpPitch;
    this.bicycle.group.rotation.z = -this.rollAngle;

    this.bicycle.frontWheel.rotation.x = this.wheelAngle;
    this.bicycle.rearWheel.rotation.x = this.wheelAngle;
    this.bicycle.crankGroup.rotation.x = this.crankAngle;
    this.bicycle.leftPedal.rotation.x = -this.crankAngle;
    this.bicycle.rightPedal.rotation.x = -this.crankAngle;
    this.bicycle.forkSteerGroup.rotation.y = this.steerAngle;

    // Flutter mini Taegeukgi flag in the basket breeze
    this.bicycle.flagMesh.rotation.y =
      Math.PI * 0.48 + Math.sin(this.elapsedTime * (5 + speedNorm * 6)) * 0.18;
    this.bicycle.flagMesh.rotation.z =
      Math.cos(this.elapsedTime * (4 + speedNorm * 5)) * 0.08;

    // Bell hammer ring animation
    if (this.bellTimer > 0) {
      this.bellTimer = Math.max(0, this.bellTimer - dt);
      this.bicycle.bellHammer.rotation.y = Math.sin(this.bellTimer * 60) * 0.45;
    } else {
      this.bicycle.bellHammer.rotation.y = 0;
    }

    // Decay action timers
    this.actions.happyTimer = Math.max(0, this.actions.happyTimer - dt);
    this.actions.waveTimer = Math.max(0, this.actions.waveTimer - dt);
    this.actions.petTimer = Math.max(0, this.actions.petTimer - dt);
    this.actions.manseTimer = Math.max(0, this.actions.manseTimer - dt);
    this.actions.roarTimer = Math.max(0, this.actions.roarTimer - dt);
    this.actions.snackTimer = Math.max(0, this.actions.snackTimer - dt);

    this.bikeRoot.updateMatrixWorld(true);
    this.bicycle.gripLeftAnchor.getWorldPosition(_gripL);
    this.bicycle.gripRightAnchor.getWorldPosition(_gripR);
    this.bicycle.group.worldToLocal(_gripL);
    this.bicycle.group.worldToLocal(_gripR);

    this.tiger.updateKinematics({
      crankAngle: this.crankAngle,
      steerAngle: this.steerAngle,
      speedNormalized: speedNorm,
      time: this.elapsedTime,
      actions: this.actions,
      leftGripLocal: _gripL,
      rightGripLocal: _gripR,
      bikeGroup: this.bicycle.group,
    });

    // Follow rider with sun & rim lighting
    this.sunLight.target.position.copy(this.bikeRoot.position);
    this.sunLight.position
      .copy(this.bikeRoot.position)
      .addScaledVector(_sunDir, 44);
    this.rimLight.position
      .copy(this.bikeRoot.position)
      .addScaledVector(_sunDir, -24);
    this.rimLight.position.y += 14;
    this.rimLight.target.position.copy(this.bikeRoot.position);

    return speedNorm;
  }

  private updateCamera(dt: number) {
    _deltaMove.subVectors(this.bikeRoot.position, _prevBikePos);
    this.camera.position.add(_deltaMove);
    this.controls.target.add(_deltaMove);

    if (
      this.cameraTransitionActive ||
      (this.cameraPreset === 'follow' && this.followModeAutoAlign)
    ) {
      this.computePresetVectors(this.cameraPreset);
      const dampLambda = this.cameraTransitionActive ? 5.2 : 1.65;
      this.camera.position.x = THREE.MathUtils.damp(
        this.camera.position.x,
        _desiredCamPos.x,
        dampLambda,
        dt
      );
      this.camera.position.y = THREE.MathUtils.damp(
        this.camera.position.y,
        _desiredCamPos.y,
        dampLambda,
        dt
      );
      this.camera.position.z = THREE.MathUtils.damp(
        this.camera.position.z,
        _desiredCamPos.z,
        dampLambda,
        dt
      );

      this.controls.target.x = THREE.MathUtils.damp(
        this.controls.target.x,
        _desiredTarget.x,
        dampLambda + 1.5,
        dt
      );
      this.controls.target.y = THREE.MathUtils.damp(
        this.controls.target.y,
        _desiredTarget.y,
        dampLambda + 1.5,
        dt
      );
      this.controls.target.z = THREE.MathUtils.damp(
        this.controls.target.z,
        _desiredTarget.z,
        dampLambda + 1.5,
        dt
      );

      if (
        this.cameraTransitionActive &&
        this.camera.position.distanceTo(_desiredCamPos) < 0.06
      ) {
        this.cameraTransitionActive = false;
      }
    }

    this.controls.update();

    const minCamY =
      Math.max(
        0.45,
        this.roadTrack.getTerrainHeight(
          this.camera.position.x,
          this.camera.position.z
        )
      ) + 0.5;
    if (this.camera.position.y < minCamY) {
      this.camera.position.y = minCamY;
    }
  }

  private emitHud(force = false) {
    const now = performance.now();
    if (!force && now - this.lastHudEmit < 120) return;
    this.lastHudEmit = now;

    this.hudCallback({
      speedKmh: this.currentSpeedKmh,
      paceMultiplier: this.paceMultiplier,
      paused: this.paused,
      autoLane: this.autoLane,
      blossomsEnabled: this.blossomsEnabled,
      cameraPreset: this.cameraPreset,
      timeOfDay: this.timeOfDay,
      soundEnabled: this.soundEnabled,
      musicEnabled: this.musicEnabled,
      steeringAngleDeg: Math.round(THREE.MathUtils.radToDeg(this.steerAngle)),
      distanceMeters: Math.round(this.distanceMeters),
    });
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== 'function') {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) {
        if (sync) gl.deleteSync(sync);
        return;
      }
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private startLoop() {
    this.lastTimestamp = performance.now();
    const tick = () => {
      if (this.disposed) return;

      const now = performance.now();
      const dt = Math.min((now - this.lastTimestamp) / 1000, 0.06);
      this.lastTimestamp = now;

      if (!this.contextLost) {
        this.elapsedTime += dt;
        const speedNorm = this.updateRiderTransform(dt);
        this.updateCamera(dt);
        this.environment.update(
          this.elapsedTime,
          dt,
          this.bikeRoot.position,
          speedNorm
        );
        this.soundEngine.update(this.elapsedTime, speedNorm);
        this.emitHud(false);
        this.renderer.render(this.scene, this.camera);
      }

      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      this.afterDraw(tick);
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  public dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.renderer.domElement.removeEventListener('pointermove', this.onPointerMove);
    this.renderer.domElement.removeEventListener('click', this.onCanvasClick);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.onContextLost);
    this.renderer.domElement.removeEventListener('webglcontextrestored', this.onContextRestored);

    this.controls.dispose();
    this.tiger.dispose();
    this.bicycle.dispose();
    this.environment.dispose();
    this.roadTrack.dispose();
    this.textures.dispose();
    this.soundEngine.dispose();
    this.envRT.dispose();
    this.renderer.dispose();

    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
