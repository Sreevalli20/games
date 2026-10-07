import React from 'react';
import { GameUIState } from '../game';

interface HUDProps {
  state: GameUIState;
  onRequestPointerLock: () => void;
}

export const HUD: React.FC<HUDProps> = ({ state, onRequestPointerLock }) => {
  if (state.stage !== 'PLAYING') return null;

  const healthPercent = Math.max(0, Math.min(100, (state.health / state.maxHealth) * 100));
  const bufferProgress = Math.min(1, state.historyDuration / 9.0);

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 font-sans">
      {/* Rewind Chromatic Glitch Flash Overlay */}
      {state.rewindFlashActive && (
        <div className="absolute inset-0 bg-cyan-400/20 mix-blend-screen pointer-events-none animate-pulse" />
      )}

      {/* Damage vignette if health low */}
      {state.health < 40 && (
        <div className="absolute inset-0 border-8 border-red-600/40 pointer-events-none transition-all duration-300" />
      )}

      {/* Click to capture mouse lock if lost */}
      {!state.isPointerLocked && !state.isPaused && (
        <div
          onClick={onRequestPointerLock}
          className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-black/45 backdrop-blur-[2px] cursor-pointer"
        >
          <div className="bg-slate-900/90 border border-cyan-500/40 px-6 py-4 rounded-lg text-center shadow-2xl">
            <p className="text-cyan-400 font-mono text-sm tracking-widest uppercase mb-1">Cursor Free</p>
            <p className="text-white text-base font-medium">Click screen to look and move</p>
          </div>
        </div>
      )}

      {/* Center Reticle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/80 ring-2 ring-cyan-500/30" />
      </div>

      {/* Contextual Interaction Prompt */}
      {state.interactionPrompt && (
        <div className="absolute top-[58%] left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-950/85 border border-cyan-500/50 rounded shadow-lg backdrop-blur-sm animate-bounce">
          <p className="text-cyan-300 font-mono text-xs tracking-wider uppercase">
            {state.interactionPrompt}
          </p>
        </div>
      )}

      {/* Top Left: Objective & Sector Info */}
      <div className="absolute top-6 left-6 flex flex-col gap-1 max-w-md">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 tracking-wider uppercase">
          <span className="text-cyan-400 font-semibold">{state.checkpointName}</span>
        </div>
        <div className="bg-slate-950/75 border border-slate-800/80 px-3 py-2 rounded backdrop-blur-sm">
          <div className="text-[10px] uppercase font-mono text-cyan-400 tracking-widest">Active Objective</div>
          <div className="text-sm font-medium text-slate-200 mt-0.5">{state.currentObjective}</div>
        </div>
      </div>

      {/* Bottom Left: Vitals / Health */}
      <div className="absolute bottom-6 left-6 flex flex-col gap-1 w-64 bg-slate-950/75 border border-slate-800/80 p-3 rounded backdrop-blur-sm">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span>INTEGRITY</span>
          <span className={state.health < 30 ? 'text-red-400 font-bold' : 'text-slate-200'}>
            {state.health}%
          </span>
        </div>
        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-200 ${
              state.health < 30 ? 'bg-red-500' : 'bg-cyan-400'
            }`}
            style={{ width: `${healthPercent}%` }}
          />
        </div>
      </div>

      {/* Bottom Right: RESONANCE Device / 9-Second Rewind Gauge */}
      {state.hasDevice && (
        <div className="absolute bottom-6 right-6 flex flex-col gap-2 w-72 bg-slate-950/80 border border-cyan-500/40 p-3.5 rounded shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-cyan-400 tracking-widest uppercase font-semibold">RESONANCE // 9.0s</span>
            <span className={state.canRewind ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
              {state.canRewind ? '[R] READY' : 'RECORDING'}
            </span>
          </div>

          {/* 9-Second Rolling Gauge Bar */}
          <div className="h-2 w-full bg-slate-900 border border-slate-800 rounded-sm overflow-hidden flex">
            <div
              className={`h-full transition-all duration-100 ${
                state.canRewind ? 'bg-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.7)]' : 'bg-cyan-700/60'
              }`}
              style={{ width: `${bufferProgress * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>RECORDED: {state.historyDuration.toFixed(1)}s / 9.0s</span>
            <span className="text-cyan-300">ECHOES: {state.echoCount}/3</span>
          </div>
        </div>
      )}

      {/* Bottom Center: Radio Dialog Subtitle */}
      {state.subtitle && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 max-w-xl w-[90%] bg-slate-950/90 border border-cyan-500/50 rounded-lg p-4 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-1">
            <span className="text-cyan-400 font-mono text-xs font-bold tracking-widest uppercase">
              RADIO // {state.subtitle.speaker}
            </span>
            {state.subtitle.offset && (
              <span className="text-amber-400 font-mono text-[11px] tracking-wider">
                {state.subtitle.offset}
              </span>
            )}
          </div>
          <p className="text-slate-100 text-sm md:text-base font-medium leading-relaxed">
            "{state.subtitle.text}"
          </p>
        </div>
      )}
    </div>
  );
};
