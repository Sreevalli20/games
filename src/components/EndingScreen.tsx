import React, { useEffect } from 'react';

interface EndingScreenProps {
  onReturnToTitle: () => void;
}

export const EndingScreen: React.FC<EndingScreenProps> = ({ onReturnToTitle }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.code === 'Space') {
        onReturnToTitle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onReturnToTitle]);

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black p-8 text-center select-none pointer-events-auto animate-fade-in">
      <div className="max-w-xl flex flex-col items-center">
        {/* Title Card */}
        <h1 className="text-6xl md:text-8xl font-black tracking-tight text-white font-sans">
          ECHO<span className="text-cyan-400">//</span>9
        </h1>

        <div className="mt-8 flex flex-col gap-2 font-mono tracking-widest text-lg md:text-xl font-bold">
          <span className="text-cyan-400">REWIND.</span>
          <span className="text-amber-400">REIMAGINE.</span>
          <span className="text-white">RECONNECT.</span>
        </div>

        <p className="mt-8 text-sm md:text-base text-slate-400 font-serif italic max-w-md">
          "The timelines have aligned. Two souls, separated by nine seconds of eternity, are finally one."
        </p>

        <div className="mt-14">
          <button
            onClick={onReturnToTitle}
            className="px-8 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold tracking-widest text-xs rounded transition-all transform hover:-translate-y-0.5 cursor-pointer uppercase font-mono shadow-lg shadow-cyan-500/20"
          >
            Press Enter to return to title
          </button>
        </div>
      </div>
    </div>
  );
};
