import React from 'react';
import { sound } from '../audio';

interface PauseMenuProps {
  checkpointName: string;
  onResume: () => void;
  onRestartCheckpoint: () => void;
  onOpenControls: () => void;
  onOpenSettings: () => void;
  onOpenMusic: () => void;
  onQuitToTitle: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  checkpointName,
  onResume,
  onRestartCheckpoint,
  onOpenControls,
  onOpenSettings,
  onOpenMusic,
  onQuitToTitle,
}) => {
  const handleAction = (action: () => void) => {
    sound.playButtonSwitch();
    action();
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/75 backdrop-blur-md pointer-events-auto select-none">
      <div className="w-full max-w-sm bg-slate-950 border border-slate-800 p-6 rounded-xl shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-xs font-mono text-cyan-400 tracking-widest uppercase mb-1">
            STASIS ACTIVATED
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-sans">
            TRANSMISSION PAUSED
          </h2>
          <p className="text-xs font-mono text-slate-400 mt-2 truncate">
            {checkpointName}
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => handleAction(onResume)}
            className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold tracking-wider text-sm rounded transition-colors cursor-pointer uppercase font-mono"
          >
            RESUME
          </button>
          <button
            onClick={() => handleAction(onRestartCheckpoint)}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-medium tracking-wider text-xs rounded transition-colors cursor-pointer uppercase font-mono"
          >
            RESTART CHECKPOINT
          </button>
          <button
            onClick={() => handleAction(onOpenControls)}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-medium tracking-wider text-xs rounded transition-colors cursor-pointer uppercase font-mono"
          >
            CONTROLS
          </button>
          <button
            onClick={() => handleAction(onOpenSettings)}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-medium tracking-wider text-xs rounded transition-colors cursor-pointer uppercase font-mono"
          >
            SETTINGS
          </button>
          <button
            onClick={() => handleAction(onOpenMusic)}
            className="w-full py-2.5 bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-700/70 font-semibold tracking-wider text-xs rounded transition-colors cursor-pointer uppercase font-mono flex items-center justify-center gap-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            SOUNDTRACK (LYRIA)
          </button>
          <button
            onClick={() => handleAction(onQuitToTitle)}
            className="w-full py-2.5 bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-800/40 font-medium tracking-wider text-xs rounded transition-colors cursor-pointer uppercase font-mono mt-2"
          >
            QUIT TO TITLE
          </button>
        </div>
      </div>
    </div>
  );
};
