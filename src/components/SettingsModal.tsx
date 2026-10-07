import React, { useState } from 'react';
import { sound } from '../audio';

interface SettingsModalProps {
  onClose: () => void;
  onSensitivityChange: (val: number) => void;
  currentSensitivity: number;
  bloomEnabled: boolean;
  bloomStrength: number;
  onBloomToggle: (enabled: boolean) => void;
  onBloomStrengthChange: (strength: number) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  onSensitivityChange,
  currentSensitivity,
  bloomEnabled,
  bloomStrength,
  onBloomToggle,
  onBloomStrengthChange,
}) => {
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [sensitivity, setSensitivity] = useState(currentSensitivity);
  const [bloom, setBloom] = useState(bloomEnabled);
  const [strength, setStrength] = useState(bloomStrength);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    sound.setVolume(val);
  };

  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const handleSensitivityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setSensitivity(val);
    onSensitivityChange(val);
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 pointer-events-auto select-none">
      <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-2xl flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-slate-850 pb-3">
          <div>
            <span className="text-[11px] font-mono text-cyan-400 tracking-widest uppercase">
              SYSTEM CONFIG
            </span>
            <h2 className="text-xl font-bold text-white font-sans">SETTINGS</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white px-2 py-1 text-sm font-mono cursor-pointer"
          >
            [CLOSE]
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Master Volume */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300">MASTER AUDIO</span>
              <span className="text-cyan-400">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Mute button */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-mono text-slate-300">MUTE SOUND</span>
            <button
              onClick={handleToggleMute}
              className={`px-3 py-1 rounded text-xs font-mono font-semibold cursor-pointer ${
                isMuted ? 'bg-red-900/60 text-red-300 border border-red-700/60' : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              {isMuted ? 'MUTED' : 'UNMUTED'}
            </button>
          </div>

          {/* Mouse Sensitivity */}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-900">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300">MOUSE SENSITIVITY</span>
              <span className="text-cyan-400">{(sensitivity * 1000).toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0.0008"
              max="0.005"
              step="0.0002"
              value={sensitivity}
              onChange={handleSensitivityChange}
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Three.js Bloom Post-Processing */}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-300">BLOOM GLOW (POST-PROCESSING)</span>
              <button
                onClick={() => {
                  const next = !bloom;
                  setBloom(next);
                  onBloomToggle(next);
                }}
                className={`px-3 py-1 rounded text-xs font-mono font-semibold cursor-pointer ${
                  bloom ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500' : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {bloom ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>
            {bloom && (
              <div className="flex flex-col gap-1.5 mt-1">
                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>BLOOM INTENSITY</span>
                  <span className="text-cyan-400">{(strength).toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="2.0"
                  step="0.05"
                  value={strength}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setStrength(val);
                    onBloomStrengthChange(val);
                  }}
                  className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Fullscreen Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-900">
            <span className="text-xs font-mono text-slate-300">DISPLAY MODE</span>
            <button
              onClick={handleFullscreen}
              className="px-3 py-1 rounded text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
            >
              TOGGLE FULLSCREEN
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-2 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold tracking-wider text-xs rounded transition-colors cursor-pointer uppercase font-mono"
        >
          CONFIRM & CLOSE
        </button>
      </div>
    </div>
  );
};
