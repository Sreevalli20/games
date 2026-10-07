import React from 'react';

interface CreditsModalProps {
  onClose: () => void;
}

export const CreditsModal: React.FC<CreditsModalProps> = ({ onClose }) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 pointer-events-auto select-none">
      <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-2xl flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-slate-850 pb-3">
          <div>
            <span className="text-[11px] font-mono text-cyan-400 tracking-widest uppercase">
              SUBMISSION SPECIFICATION
            </span>
            <h2 className="text-xl font-bold text-white font-sans">CREDITS & CONTEXT</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white px-2 py-1 text-sm font-mono cursor-pointer"
          >
            [CLOSE]
          </button>
        </div>

        <div className="flex flex-col gap-3 text-xs text-slate-300">
          <div>
            <span className="font-mono text-cyan-400 font-bold block mb-0.5">GAME TITLE</span>
            <span className="text-sm font-bold text-white">ECHO//9</span>
          </div>

          <div>
            <span className="font-mono text-cyan-400 font-bold block mb-0.5">THEME</span>
            <p className="text-slate-200">
              <strong className="text-cyan-300">REWIND:</strong> Revert the environment 9 seconds while you remain.<br />
              <strong className="text-cyan-300">REIMAGINE:</strong> Collaborate with past iterations of yourself.<br />
              <strong className="text-cyan-300">RECONNECT:</strong> Bridge temporal gaps to reach Mira.
            </p>
          </div>

          <div>
            <span className="font-mono text-cyan-400 font-bold block mb-0.5">TECHNICAL ARCHITECTURE</span>
            <p className="text-slate-400">
              100% Client-Side WebGL, Three.js, procedural Web Audio API synthesis.
              Zero backend, zero external gameplay network requests.
            </p>
          </div>

          <div>
            <span className="font-mono text-cyan-400 font-bold block mb-0.5">DEVELOPMENT</span>
            <p className="text-slate-400">
              Engineered for the Game Jam: "Rewind. Reimagine. Reconnect."
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-2 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold tracking-wider text-xs rounded transition-colors cursor-pointer uppercase font-mono"
        >
          RETURN TO TERMINAL
        </button>
      </div>
    </div>
  );
};
