import React, { useState } from 'react';
import { proceduralMusic, OST_THEMES, OSTThemeInfo } from '../musicSynth';
import { sound } from '../audio';

interface MusicGeneratorModalProps {
  onClose: () => void;
}

export const MusicGeneratorModal: React.FC<MusicGeneratorModalProps> = ({ onClose }) => {
  const [selectedTheme, setSelectedTheme] = useState<OSTThemeInfo>(OST_THEMES[0]);
  const [isPlayingInGame, setIsPlayingInGame] = useState<boolean>(proceduralMusic.currentTheme !== null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportedUrl, setExportedUrl] = useState<string | null>(null);

  const handleSelectTheme = (theme: OSTThemeInfo) => {
    sound.playButtonSwitch();
    setSelectedTheme(theme);
    setExportedUrl(null);
    if (isPlayingInGame) {
      proceduralMusic.playTheme(theme.id);
    }
  };

  const handleTogglePlay = () => {
    sound.playButtonSwitch();
    if (isPlayingInGame && proceduralMusic.currentTheme === selectedTheme.id) {
      proceduralMusic.stop();
      setIsPlayingInGame(false);
    } else {
      proceduralMusic.playTheme(selectedTheme.id);
      setIsPlayingInGame(true);
    }
  };

  const handleExportWav = async () => {
    sound.playButtonSwitch();
    setIsExporting(true);
    try {
      const blob = await proceduralMusic.renderWav(selectedTheme.id);
      const url = URL.createObjectURL(blob);
      setExportedUrl(url);
    } catch (e) {
      console.error('Export error:', e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 pointer-events-auto select-none">
      <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-2xl flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-850 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[11px] font-mono text-cyan-400 tracking-widest uppercase">
                RESONANCE SOUNDTRACK SYNTHESIZER
              </span>
            </div>
            <h2 className="text-xl font-bold text-white font-sans mt-0.5">IN-GAME SOUNDTRACK</h2>
          </div>
          <button
            onClick={() => {
              sound.playButtonSwitch();
              onClose();
            }}
            className="text-slate-400 hover:text-white px-2 py-1 text-sm font-mono cursor-pointer"
          >
            [CLOSE]
          </button>
        </div>

        {/* Info banner */}
        <div className="bg-cyan-950/30 border border-cyan-800/40 p-3 rounded text-xs text-cyan-300 font-mono">
          <span className="font-bold">100% CLIENT-SIDE SYNTHESIS:</span> Procedural dark sci-fi OST generated
          in real-time via Web Audio API. Zero external network requests, zero API key required.
        </div>

        {/* Theme Presets Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-mono text-slate-300">SELECT STATION SOUNDTRACK</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {OST_THEMES.map((theme) => {
              const isSelected = selectedTheme.id === theme.id;
              const isThemeActive = isPlayingInGame && proceduralMusic.currentTheme === theme.id;

              return (
                <button
                  key={theme.id}
                  onClick={() => handleSelectTheme(theme)}
                  className={`p-3 text-left rounded border transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                    isSelected
                      ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white font-mono">{theme.name}</span>
                    <span className="text-[10px] font-mono text-cyan-400">{theme.bpm} BPM</span>
                  </div>
                  <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {theme.description}
                  </div>
                  {isThemeActive && (
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-emerald-400 font-mono font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      PLAYING IN GAME
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Theme Actions */}
        <div className="flex flex-col gap-2.5 pt-1">
          <div className="flex gap-2">
            <button
              onClick={handleTogglePlay}
              className={`flex-1 py-3 text-xs font-mono font-bold rounded cursor-pointer transition-all uppercase tracking-wider ${
                isPlayingInGame && proceduralMusic.currentTheme === selectedTheme.id
                  ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-lg shadow-cyan-500/20'
              }`}
            >
              {isPlayingInGame && proceduralMusic.currentTheme === selectedTheme.id
                ? 'PAUSE SOUNDTRACK'
                : `PLAY "${selectedTheme.name}" IN-GAME`}
            </button>

            <button
              onClick={handleExportWav}
              disabled={isExporting}
              className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-mono rounded cursor-pointer transition-colors whitespace-nowrap"
            >
              {isExporting ? 'RENDERING...' : 'EXPORT WAV'}
            </button>
          </div>

          {/* Export result */}
          {exportedUrl && (
            <div className="p-3 bg-slate-900 border border-cyan-500/40 rounded flex items-center justify-between animate-fade-in">
              <span className="text-xs font-mono text-cyan-300">Track Rendered (12s Lossless WAV)</span>
              <div className="flex items-center gap-2">
                <audio src={exportedUrl} controls className="h-6 w-36" />
                <a
                  href={exportedUrl}
                  download={`${selectedTheme.id}_echo9_ost.wav`}
                  className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-mono font-bold rounded cursor-pointer"
                >
                  SAVE
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
