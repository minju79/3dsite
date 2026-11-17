import {
  ArrowUp,
  Bell,
  Camera,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Citrus,
  Flame,
  Hand,
  Heart,
  Maximize2,
  Minimize2,
  Moon,
  Music,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { CameraPreset, SceneHUDState, TimeOfDay } from '../three/constants';

interface ControlDockProps {
  hud: SceneHUDState;
  collapsed: boolean;
  fullscreen?: boolean;
  hideTopLeftTelemetry?: boolean;
  onToggleFullscreen?: () => void;
  onToggleCollapse: () => void;
  onTogglePause: () => void;
  onPaceChange: (mult: number) => void;
  onToggleAutoLane: () => void;
  onSteerDir: (dir: number) => void;
  onCameraChange: (preset: CameraPreset) => void;
  onTimeChange: (mode: TimeOfDay) => void;
  onRingBell: () => void;
  onWave: () => void;
  onPet: () => void;
  onManse: () => void;
  onRoar: () => void;
  onHop: () => void;
  onSnack: () => void;
  onToggleBlossoms: () => void;
  onToggleMusic: () => void;
  onToggleSound: () => void;
  onResetView: () => void;
}

const CAMERA_OPTIONS: { id: CameraPreset; label: string }[] = [
  { id: 'follow', label: 'Chase' },
  { id: 'side', label: 'Side' },
  { id: 'front', label: 'Front' },
  { id: 'aerial', label: 'Scenic' },
];

const TIME_OPTIONS: { id: TimeOfDay; label: string; Icon: typeof Sun }[] = [
  { id: 'morning', label: 'Morning', Icon: Sun },
  { id: 'golden', label: 'Golden', Icon: Sunrise },
  { id: 'sunset', label: 'Sunset', Icon: Sunset },
  { id: 'night', label: 'Night', Icon: Moon },
];

export function ControlDock({
  hud,
  collapsed,
  fullscreen = false,
  hideTopLeftTelemetry = false,
  onToggleFullscreen,
  onToggleCollapse,
  onTogglePause,
  onPaceChange,
  onToggleAutoLane,
  onSteerDir,
  onCameraChange,
  onTimeChange,
  onRingBell,
  onWave,
  onPet,
  onManse,
  onRoar,
  onHop,
  onSnack,
  onToggleBlossoms,
  onToggleMusic,
  onToggleSound,
  onResetView,
}: ControlDockProps) {
  const posClass = fullscreen ? 'fixed' : 'absolute';

  return (
    <>
      {!hideTopLeftTelemetry && (
        <div
          className={`pointer-events-none ${posClass} top-4 left-5 z-20 flex flex-col gap-0.5`}
        >
          <div className="font-display text-base font-semibold tracking-tight text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.65)]">
            모든AI부동산중개사무소 · 3D 해안도로 투어
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/85 drop-shadow-[0_1px_4px_rgba(0,0,0,0.75)]">
            <span className="font-mono-tabular">
              {hud.speedKmh.toFixed(1)} km/h
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular">
              {(hud.distanceMeters / 1000).toFixed(2)} km
            </span>
          </div>
        </div>
      )}

      {onToggleFullscreen && (
        <button
          type="button"
          onClick={onToggleFullscreen}
          title={fullscreen ? '기본 보기로 축소' : '3D 전체화면'}
          className={`${posClass} top-4 right-5 z-20 flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#0e1b26]/90 px-3.5 py-2 text-xs font-medium text-white shadow-lg transition-colors hover:bg-[#162939] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-amber-400`}
        >
          {fullscreen ? (
            <>
              <Minimize2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>기본 화면</span>
            </>
          ) : (
            <>
              <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>3D 전체화면</span>
            </>
          )}
        </button>
      )}

      {/* Collapsible Unified Bottom Control Dock */}
      <div
        className={`pointer-events-none ${posClass} bottom-3 left-1/2 z-20 flex w-[min(960px,95%)] -translate-x-1/2 flex-col items-center transition-transform duration-300 ease-out`}
        style={{
          transform: collapsed
            ? 'translate(-50%, calc(100% - 26px))'
            : 'translate(-50%, 0)',
        }}
      >
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-expanded={!collapsed}
          className="pointer-events-auto mb-1.5 flex items-center gap-1.5 rounded-t-lg rounded-b-md border border-white/15 bg-[#0e1b26]/92 px-3.5 py-1 text-xs font-medium text-white/90 shadow-lg transition-colors hover:bg-[#162939] hover:text-white focus-visible:outline-2 focus-visible:outline-amber-400 whitespace-nowrap shrink-0"
        >
          {collapsed ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              <span>컨트롤 열기</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              <span>컨트롤 접기</span>
            </>
          )}
        </button>

        <div className="pointer-events-auto flex w-full flex-col gap-2 rounded-xl border border-white/14 bg-[#0d1924]/92 px-4 py-2.5 text-white shadow-2xl">
          {/* Row 1: Camera View, Light Preset, Pace & Play/Pause */}
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 text-xs font-medium text-white/70 whitespace-nowrap">
                <Camera className="h-3.5 w-3.5 text-white/60" aria-hidden="true" />
                <span>View</span>
              </div>
              <div className="flex items-center rounded-lg bg-white/8 p-0.5">
                {CAMERA_OPTIONS.map((cam) => {
                  const active = hud.cameraPreset === cam.id;
                  return (
                    <button
                      key={cam.id}
                      type="button"
                      onClick={() => onCameraChange(cam.id)}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-amber-400 ${
                        active
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'text-white/75 hover:text-white'
                      }`}
                    >
                      {cam.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 text-xs font-medium text-white/70 whitespace-nowrap">
                <Sun className="h-3.5 w-3.5 text-white/60" aria-hidden="true" />
                <span>Sky</span>
              </div>
              <div className="flex items-center rounded-lg bg-white/8 p-0.5">
                {TIME_OPTIONS.map(({ id, label, Icon }) => {
                  const active = hud.timeOfDay === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onTimeChange(id)}
                      className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-amber-400 ${
                        active
                          ? 'bg-emerald-500 text-slate-950 shadow-sm'
                          : 'text-white/75 hover:text-white'
                      }`}
                    >
                      <Icon className="h-3 w-3 hidden sm:inline" aria-hidden="true" />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={onTogglePause}
                title={hud.paused ? '주행 재개' : '일시정지'}
                aria-label={hud.paused ? '주행 재개' : '일시정지'}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-slate-950 transition-colors hover:bg-amber-400 focus-visible:outline-2 focus-visible:outline-amber-300 shrink-0"
              >
                {hud.paused ? (
                  <Play className="h-3.5 w-3.5 fill-current" />
                ) : (
                  <Pause className="h-3.5 w-3.5 fill-current" />
                )}
              </button>

              <label
                htmlFor="coastal-pace"
                className="text-xs font-medium text-white/70 whitespace-nowrap"
              >
                Pace
              </label>
              <input
                id="coastal-pace"
                type="range"
                min={0.2}
                max={2.5}
                step={0.1}
                value={hud.paceMultiplier}
                onChange={(e) => onPaceChange(Number(e.target.value))}
                className="coastal-slider w-20 sm:w-24"
              />
              <span className="font-mono-tabular w-9 text-right text-xs font-semibold text-white/90">
                {hud.paceMultiplier.toFixed(1)}x
              </span>
            </div>
          </div>

          {/* Row 2: Steering, Interactive Tricks, Blossoms & Cherry-Blossom Music */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onPointerDown={() => onSteerDir(-1)}
              onPointerUp={() => onSteerDir(0)}
              onPointerLeave={() => onSteerDir(0)}
              onPointerCancel={() => onSteerDir(0)}
              className="flex items-center gap-0.5 rounded-lg border border-white/14 bg-white/8 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-white/16 active:bg-amber-500 active:text-slate-950 whitespace-nowrap shrink-0"
            >
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Left</span>
            </button>

            <button
              type="button"
              onPointerDown={() => onSteerDir(1)}
              onPointerUp={() => onSteerDir(0)}
              onPointerLeave={() => onSteerDir(0)}
              onPointerCancel={() => onSteerDir(0)}
              className="flex items-center gap-0.5 rounded-lg border border-white/14 bg-white/8 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-white/16 active:bg-amber-500 active:text-slate-950 whitespace-nowrap shrink-0"
            >
              <span>Right</span>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={onToggleAutoLane}
              className={`rounded-lg border px-2 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                hud.autoLane
                  ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-300'
                  : 'border-white/14 bg-white/8 text-white/75 hover:bg-white/16 hover:text-white'
              }`}
            >
              Auto Lane: {hud.autoLane ? 'On' : 'Off'}
            </button>

            <button
              type="button"
              onClick={onRingBell}
              className="flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-semibold text-slate-950 transition-colors hover:bg-amber-400 whitespace-nowrap shrink-0"
            >
              <Bell className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Bell</span>
            </button>

            <button
              type="button"
              onClick={onWave}
              className="flex items-center gap-1 rounded-lg border border-white/14 bg-white/8 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-white/16 whitespace-nowrap shrink-0"
            >
              <Hand className="h-3.5 w-3.5 text-sky-300" aria-hidden="true" />
              <span>Wave</span>
            </button>

            <button
              type="button"
              onClick={onPet}
              className="flex items-center gap-1 rounded-lg border border-rose-400/40 bg-rose-500/18 px-2 py-1 text-xs font-medium text-rose-200 transition-colors hover:bg-rose-500/28 whitespace-nowrap shrink-0"
            >
              <Heart className="h-3.5 w-3.5 text-rose-400" aria-hidden="true" />
              <span>쓰다듬기</span>
            </button>

            <button
              type="button"
              onClick={onManse}
              className="flex items-center gap-1 rounded-lg border border-amber-400/40 bg-amber-500/18 px-2 py-1 text-xs font-medium text-amber-200 transition-colors hover:bg-amber-500/28 whitespace-nowrap shrink-0"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
              <span>만세</span>
            </button>

            <button
              type="button"
              onClick={onRoar}
              className="flex items-center gap-1 rounded-lg border border-orange-400/40 bg-orange-500/18 px-2 py-1 text-xs font-medium text-orange-200 transition-colors hover:bg-orange-500/28 whitespace-nowrap shrink-0"
            >
              <Flame className="h-3.5 w-3.5 text-orange-400" aria-hidden="true" />
              <span>어흥</span>
            </button>

            <button
              type="button"
              onClick={onHop}
              className="flex items-center gap-1 rounded-lg border border-teal-400/40 bg-teal-500/18 px-2 py-1 text-xs font-medium text-teal-200 transition-colors hover:bg-teal-500/28 whitespace-nowrap shrink-0"
            >
              <ArrowUp className="h-3.5 w-3.5 text-teal-300" aria-hidden="true" />
              <span>점프</span>
            </button>

            <button
              type="button"
              onClick={onSnack}
              className="flex items-center gap-1 rounded-lg border border-yellow-400/40 bg-yellow-500/18 px-2 py-1 text-xs font-medium text-yellow-200 transition-colors hover:bg-yellow-500/28 whitespace-nowrap shrink-0"
            >
              <Citrus className="h-3.5 w-3.5 text-yellow-300" aria-hidden="true" />
              <span>감귤 간식</span>
            </button>

            <button
              type="button"
              onClick={onToggleBlossoms}
              className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                hud.blossomsEnabled
                  ? 'border-pink-400/50 bg-pink-500/22 text-pink-200'
                  : 'border-white/14 bg-white/8 text-white/70 hover:bg-white/16 hover:text-white'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-pink-300" aria-hidden="true" />
              <span>벚꽃</span>
            </button>

            <button
              type="button"
              onClick={onToggleMusic}
              title="벚꽃 선율 음악 재생/정지 (M)"
              className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                hud.musicEnabled
                  ? 'border-pink-400/60 bg-pink-500/25 text-pink-100'
                  : 'border-white/14 bg-white/8 text-white/80 hover:bg-white/16 hover:text-white'
              }`}
            >
              <Music className="h-3.5 w-3.5 text-pink-300" aria-hidden="true" />
              <span>{hud.musicEnabled ? '벚꽃 음악 On' : '벚꽃 음악'}</span>
            </button>

            <button
              type="button"
              onClick={onToggleSound}
              title="파도 소리 켜기/끄기"
              className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                hud.soundEnabled
                  ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200'
                  : 'border-white/14 bg-white/8 text-white/75 hover:bg-white/16 hover:text-white'
              }`}
            >
              {hud.soundEnabled ? (
                <Volume2 className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
              ) : (
                <VolumeX className="h-3.5 w-3.5 text-white/60" aria-hidden="true" />
              )}
              <span>Surf</span>
            </button>

            <button
              type="button"
              onClick={onResetView}
              title="카메라 및 주행 위치 초기화"
              aria-label="카메라 및 주행 위치 초기화"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/14 bg-white/8 text-white/75 transition-colors hover:bg-white/16 hover:text-white shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
