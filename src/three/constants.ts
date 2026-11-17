export type TimeOfDay = 'morning' | 'golden' | 'sunset' | 'night';
export type CameraPreset = 'follow' | 'side' | 'front' | 'aerial';

export interface SceneHUDState {
  speedKmh: number;
  paceMultiplier: number;
  paused: boolean;
  autoLane: boolean;
  blossomsEnabled: boolean;
  cameraPreset: CameraPreset;
  timeOfDay: TimeOfDay;
  soundEnabled: boolean;
  musicEnabled: boolean;
  steeringAngleDeg: number;
  distanceMeters: number;
}

export const BIKE_DIMS = {
  wheelRadius: 0.34,
  tireTubeRadius: 0.042,
  rearAxleZ: -0.54,
  frontAxleZ: 0.58,
  bbY: 0.32,
  bbZ: -0.04,
  crankLen: 0.13,
  pedalOffsetX: 0.142,
  saddleY: 0.66,
  saddleZ: -0.20,
  headTubeZ: 0.42,
  headTubeY: 0.64,
  headRakeRad: 0.27, // ~15.5 degrees rake tilted back
  gearRatio: 1.9, // wheel revolutions per crank revolution
} as const;

export const TIGER_DIMS = {
  hipX: 0.125,
  hipY: 0.725,
  hipZ: -0.185,
  thighLen: 0.315,
  shinLen: 0.305,
  pawSoleOffset: 0.032,
  shoulderX: 0.14,
  shoulderY: 1.01,
  shoulderZ: -0.02,
  upperArmLen: 0.195,
  forearmLen: 0.195,
} as const;

export interface AtmospherePreset {
  label: string;
  skyTop: number;
  skyHorizon: number;
  fogColor: number;
  fogDensity: number;
  sunColor: number;
  sunIntensity: number;
  sunElevationDeg: number;
  sunAzimuthDeg: number;
  hemiSky: number;
  hemiGround: number;
  hemiIntensity: number;
  rimColor: number;
  rimIntensity: number;
  oceanDeep: number;
  oceanShallow: number;
  oceanSpecular: number;
  lanternIntensity: number;
  headlightIntensity: number;
  exposure: number;
  starOpacity: number;
}

export const ATMOSPHERE_PRESETS: Record<TimeOfDay, AtmospherePreset> = {
  morning: {
    label: 'Morning',
    skyTop: 0x3b86d1,
    skyHorizon: 0xcbe8f6,
    fogColor: 0xc5e3f2,
    fogDensity: 0.0026,
    sunColor: 0xfff3db,
    sunIntensity: 2.35,
    sunElevationDeg: 46,
    sunAzimuthDeg: 38,
    hemiSky: 0x9cd8ff,
    hemiGround: 0x5c6d58,
    hemiIntensity: 0.95,
    rimColor: 0xcceeff,
    rimIntensity: 0.55,
    oceanDeep: 0x0b4f78,
    oceanShallow: 0x1ca3a8,
    oceanSpecular: 0xfff8e6,
    lanternIntensity: 0.0,
    headlightIntensity: 0.0,
    exposure: 1.08,
    starOpacity: 0.0,
  },
  golden: {
    label: 'Golden',
    skyTop: 0x4569a8,
    skyHorizon: 0xffd2a1,
    fogColor: 0xf7cfa4,
    fogDensity: 0.0029,
    sunColor: 0xffcf87,
    sunIntensity: 2.55,
    sunElevationDeg: 24,
    sunAzimuthDeg: 52,
    hemiSky: 0xffdfb8,
    hemiGround: 0x544b48,
    hemiIntensity: 0.88,
    rimColor: 0xffe4b5,
    rimIntensity: 0.78,
    oceanDeep: 0x10416b,
    oceanShallow: 0x268c94,
    oceanSpecular: 0xffe3a8,
    lanternIntensity: 0.9,
    headlightIntensity: 0.4,
    exposure: 1.07,
    starOpacity: 0.0,
  },
  sunset: {
    label: 'Sunset',
    skyTop: 0x324376,
    skyHorizon: 0xf4996b,
    fogColor: 0xe69872,
    fogDensity: 0.0033,
    sunColor: 0xff9e54,
    sunIntensity: 2.45,
    sunElevationDeg: 11,
    sunAzimuthDeg: 64,
    hemiSky: 0xffb78a,
    hemiGround: 0x3a3242,
    hemiIntensity: 0.78,
    rimColor: 0xffd09c,
    rimIntensity: 0.95,
    oceanDeep: 0x152c4e,
    oceanShallow: 0x2f6c78,
    oceanSpecular: 0xffb766,
    lanternIntensity: 2.4,
    headlightIntensity: 1.6,
    exposure: 1.06,
    starOpacity: 0.18,
  },
  night: {
    label: 'Night',
    skyTop: 0x070d1d,
    skyHorizon: 0x192a47,
    fogColor: 0x16253f,
    fogDensity: 0.0038,
    sunColor: 0xb7d2ff,
    sunIntensity: 0.95,
    sunElevationDeg: 32,
    sunAzimuthDeg: 45,
    hemiSky: 0x3a5480,
    hemiGround: 0x101824,
    hemiIntensity: 0.55,
    rimColor: 0x8bb6ff,
    rimIntensity: 0.75,
    oceanDeep: 0x061327,
    oceanShallow: 0x0e2a45,
    oceanSpecular: 0xcbe0ff,
    lanternIntensity: 3.4,
    headlightIntensity: 5.5,
    exposure: 1.0,
    starOpacity: 1.0,
  },
};

export const ROAD_CONFIG = {
  loopRadius: 96,
  roadWidth: 7.4,
  bikeLaneWidth: 2.1,
  samples: 360,
} as const;
