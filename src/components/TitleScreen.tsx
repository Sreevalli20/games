import React from 'react';
import { sound } from '../audio';

interface TitleScreenProps {
  onPlay: () => void;
  onOpenControls: () => void;
  onOpenSettings: () => void;
  onOpenCredits: () => void;
  onOpenMusic: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onPlay,
  onOpenControls,
  onOpenSettings,
  onOpenCredits,
  onOpenMusic,
}) => {
  const handlePlayClick = () => {
    sound.init();
    sound.playButtonSwitch();
    onPlay();
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between p-8 md:p-14 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-mono text-xs text-cyan-400 tracking-widest uppercase">
            TEMPORAL STATION ZERO // PROTOCOL 9
          </span>
        </div>
        <span className="font-mono text-xs text-slate-500">CLIENT-SIDE JAM BUILD</span>
      </div>

      {/* Main Title Hero */}
      <div className="max-w-xl my-auto">
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-cyan-200 to-cyan-500 font-sans">
          ECHO<span className="text-cyan-400">//</span>9
        </h1>
        <p className="mt-3 text-lg md:text-xl font-medium tracking-widest text-cyan-300 uppercase font-mono">
          Rewind. Reimagine. Reconnect.
        </p>
        <p className="mt-4 text-sm text-slate-400 leading-relaxed max-w-md">
          Trapped in an abandoned underground transit station, you hold the RESONANCE device:
          the world rewinds 9 seconds, but you remain. Cooperate with your temporal Echoes to reach Mira.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handlePlayClick}
            className="px-8 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold tracking-wider text-sm rounded shadow-lg shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer uppercase font-mono"
          >
            INITIALIZE RUN
          </button>
          <button
            onClick={onOpenControls}
            className="px-6 py-3.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-medium tracking-wider text-sm rounded transition-colors cursor-pointer uppercase font-mono"
          >
            CONTROLS
          </button>
          <button
            onClick={onOpenSettings}
            className="px-6 py-3.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-medium tracking-wider text-sm rounded transition-colors cursor-pointer uppercase font-mono"
          >
            SETTINGS
          </button>
          <button
            onClick={onOpenCredits}
            className="px-6 py-3.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-medium tracking-wider text-sm rounded transition-colors cursor-pointer uppercase font-mono"
          >
            CREDITS
          </button>
          <button
            onClick={onOpenMusic}
            className="px-6 py-3.5 bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-700/70 font-semibold tracking-wider text-sm rounded transition-colors cursor-pointer uppercase font-mono flex items-center justify-center gap-1.5"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            SOUNDTRACK
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs font-mono text-slate-500 border-t border-slate-900 pt-4">
        <span>WASD = MOVE · MOUSE = LOOK · E = INTERACT · R = REWIND 9s</span>
        <span className="mt-2 sm:mt-0">100% CLIENT-SIDE WEBGL · THREE.JS · WEB AUDIO</span>
      </div>
    </div>
  );
};
