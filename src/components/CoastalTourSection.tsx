import { ArrowDown, Music } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { CoastalTigerScene } from '../three/CoastalTigerScene';
import type { CameraPreset, SceneHUDState, TimeOfDay } from '../three/constants';
import { ControlDock } from './ControlDock';

const INITIAL_HUD: SceneHUDState = {
  speedKmh: 15.5,
  paceMultiplier: 1.0,
  paused: false,
  autoLane: true,
  blossomsEnabled: true,
  cameraPreset: 'follow',
  timeOfDay: 'morning',
  soundEnabled: false,
  musicEnabled: false,
  steeringAngleDeg: 0,
  distanceMeters: 0,
};

interface CoastalTourSectionProps {
  onExploreListings: () => void;
}

export function CoastalTourSection({ onExploreListings }: CoastalTourSectionProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<CoastalTigerScene | null>(null);
  const [hud, setHud] = useState<SceneHUDState>(INITIAL_HUD);
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const engine = new CoastalTigerScene(container, (nextHud) => {
      setHud(nextHud);
    });
    sceneRef.current = engine;

    const ro = new ResizeObserver(() => {
      window.dispatchEvent(new Event('resize'));
    });
    if (wrapperRef.current) {
      ro.observe(wrapperRef.current);
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLElement &&
        e.target.closest('input, textarea, select, button, a')
      ) {
        return;
      }
      if (e.code === 'KeyH') {
        setDockCollapsed((prev) => !prev);
      } else if (e.key === 'Escape') {
        setFullscreen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      ro.disconnect();
      window.removeEventListener('keydown', onKeyDown);
      engine.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 60);
    return () => window.clearTimeout(id);
  }, [fullscreen]);

  const estimatedRpm = Math.round(hud.speedKmh * 4.3);

  return (
    <section
      id="tour"
      ref={wrapperRef}
      className={
        fullscreen
          ? 'fixed inset-0 z-50 bg-[#0e1a24]'
          : 'relative h-[calc(100vh-64px)] min-h-[640px] w-full overflow-hidden bg-[#0e1a24]'
      }
    >
      {/* Full-bleed interactive 3D bicycle scene */}
      <div
        ref={mountRef}
        className="h-full w-full"
        aria-label="모든AI부동산중개사무소 3D 해안 바이크로드 투어"
      />

      {/* Left editorial hero scrim & headline overlay (matching screenshot layout) */}
      {!fullscreen && (
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-full max-w-3xl items-center bg-gradient-to-r from-slate-950/68 via-slate-950/32 to-transparent px-6 pb-28 sm:px-10">
          <div className="pointer-events-auto max-w-xl">
            <p className="text-xs font-semibold tracking-wide text-amber-300 drop-shadow-[0_1px_4px_rgba(0,0,0,0.75)]">
              모든AI부동산중개사무소 · 전남광주통합특별시 서구 상무중앙로 7, 5층
            </p>
            <h1 className="mt-2.5 font-display text-[clamp(1.75rem,3.1vw,2.75rem)] font-bold leading-[1.2] tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)] break-keep">
              <span className="block sm:whitespace-nowrap">바다와 벚꽃사이를 달리는</span>
              <span className="block sm:whitespace-nowrap">프리미엄 부동산3D 투어</span>
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/90 drop-shadow-[0_1px_6px_rgba(0,0,0,0.75)] sm:text-base">
              상무지구 핵심 매물부터 동해안 오션뷰 주택까지 — 벚꽃이 흩날리는 3D
              해안도로 주행과 함께 검증된 매물을 먼저 만나보세요.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onExploreListings}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg transition-colors hover:bg-amber-400 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-amber-300"
              >
                <span>추천 매물 살펴보기</span>
                <ArrowDown className="h-4 w-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => sceneRef.current?.toggleMusic()}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-4 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-pink-300 ${
                  hud.musicEnabled
                    ? 'border-pink-300 bg-pink-500/85 text-white'
                    : 'border-white/25 bg-[#0e1b26]/85 text-white hover:bg-[#162939]'
                }`}
              >
                <Music className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{hud.musicEnabled ? '벚꽃 선율 재생 중' : '벚꽃 음악 켜기'}</span>
              </button>

              <span className="font-mono-tabular text-xs font-medium text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]">
                실시간 주행 {hud.speedKmh.toFixed(1)} km/h · {estimatedRpm} rpm
              </span>
            </div>
          </div>
        </div>
      )}

      <ControlDock
        hud={hud}
        collapsed={dockCollapsed}
        fullscreen={fullscreen}
        hideTopLeftTelemetry={!fullscreen}
        onToggleFullscreen={() => setFullscreen((prev) => !prev)}
        onToggleCollapse={() => setDockCollapsed((prev) => !prev)}
        onTogglePause={() => sceneRef.current?.togglePause()}
        onPaceChange={(mult) => sceneRef.current?.setPaceMultiplier(mult)}
        onToggleAutoLane={() => sceneRef.current?.toggleAutoLane()}
        onSteerDir={(dir) => sceneRef.current?.setManualSteerDir(dir)}
        onCameraChange={(preset: CameraPreset) =>
          sceneRef.current?.setCameraPreset(preset)
        }
        onTimeChange={(mode: TimeOfDay) => sceneRef.current?.setTimeOfDay(mode)}
        onRingBell={() => sceneRef.current?.ringBell()}
        onWave={() => sceneRef.current?.triggerWave()}
        onPet={() => sceneRef.current?.triggerPet()}
        onManse={() => sceneRef.current?.triggerManse()}
        onRoar={() => sceneRef.current?.triggerRoar()}
        onHop={() => sceneRef.current?.triggerHop()}
        onSnack={() => sceneRef.current?.triggerSnack()}
        onToggleBlossoms={() => sceneRef.current?.toggleBlossoms()}
        onToggleMusic={() => sceneRef.current?.toggleMusic()}
        onToggleSound={() => sceneRef.current?.toggleSound()}
        onResetView={() => sceneRef.current?.resetView()}
      />
    </section>
  );
}
