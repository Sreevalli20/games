import React from 'react';
import { sound } from '../audio';

interface ControlsModalProps {
  onClose: () => void;
}

export const ControlsModal: React.FC<ControlsModalProps> = ({ onClose }) => {
  const handleClose = () => {
    sound.playButtonSwitch();
    onClose();
  };

  const controls = [
    { key: 'W / A / S / D', action: 'Move forward, strafe left/right, backward' },
    { key: 'MOUSE', action: 'Look around (First-person camera)' },
    { key: 'E', action: 'Interact with switches, valves, and devices' },
    { key: 'R', action: 'Rewind the world 9 seconds & manifest an Echo' },
    { key: 'LEFT CLICK / F', action: 'Resonance pulse attack (combats anomalies)' },
    { key: 'LEFT SHIFT', action: 'Sprint' },
    { key: 'SPACE', action: 'Jump' },
    { key: 'ESC', action: 'Pause / Resume menu' },
  ];

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 pointer-events-auto select-none">
      <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-2xl flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-slate-850 pb-3">
          <div>
            <span className="text-[11px] font-mono text-cyan-400 tracking-widest uppercase">
              RESONANCE INTERFACE
            </span>
            <h2 className="text-xl font-bold text-white font-sans">CONTROLS & DIRECTIVES</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white px-2 py-1 text-sm font-mono cursor-pointer"
          >
            [CLOSE]
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          {controls.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded bg-slate-900/60 border border-slate-850"
            >
              <kbd className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-xs rounded font-bold shadow-inner">
                {item.key}
              </kbd>
              <span className="text-xs text-slate-300 font-medium text-right max-w-[280px]">
                {item.action}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-cyan-950/30 border border-cyan-800/40 p-3 rounded text-xs text-cyan-300/90 leading-relaxed font-mono">
          <span className="font-bold text-cyan-400">TEMPORAL MECHANIC DIRECTIVE:</span> When you press [R],
          the station environment reverses 9 seconds, but your body stays here. Your transparent Echo will
          repeat whatever you just did—holding switches, pressing valves, or attacking anomalies.
        </div>

        <button
          onClick={handleClose}
          className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold tracking-wider text-xs rounded transition-colors cursor-pointer uppercase font-mono"
        >
          RETURN
        </button>
      </div>
    </div>
  );
};
