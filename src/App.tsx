import React, { useEffect, useRef, useState } from 'react';
import { EchoGame, GameUIState } from './game';
import { HUD } from './components/HUD';
import { TitleScreen } from './components/TitleScreen';
import { PauseMenu } from './components/PauseMenu';
import { ControlsModal } from './components/ControlsModal';
import { SettingsModal } from './components/SettingsModal';
import { CreditsModal } from './components/CreditsModal';
import { EndingScreen } from './components/EndingScreen';
import { MusicGeneratorModal } from './components/MusicGeneratorModal';

const initialUIState: GameUIState = {
  stage: 'TITLE',
  health: 100,
  maxHealth: 100,
  hasDevice: false,
  historyDuration: 0,
  echoCount: 0,
  canRewind: false,
  interactionPrompt: null,
  currentObjective: 'Investigate the abandoned platform',
  isPaused: false,
  checkpointName: 'Sector 0: Arrival Platform',
  subtitle: null,
  blackScreenOpacity: 0,
  rewindFlashActive: false,
  isPointerLocked: false,
  bloomEnabled: true,
  bloomStrength: 0.85,
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef<EchoGame | null>(null);
  const [uiState, setUiState] = useState<GameUIState>(initialUIState);

  // Modal overlays
  const [showControls, setShowControls] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showCredits, setShowCredits] = useState<boolean>(false);
  const [showMusic, setShowMusic] = useState<boolean>(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const game = new EchoGame(canvasRef.current, (state) => {
      setUiState({ ...state });
    });
    gameRef.current = game;

    return () => {
      game.destroy();
    };
  }, []);

  const handleStartPlay = () => {
    if (gameRef.current) {
      gameRef.current.startNewGame();
    }
  };

  const handleResume = () => {
    if (gameRef.current) {
      gameRef.current.resumeGame();
    }
  };

  const handleRestartCheckpoint = () => {
    if (gameRef.current) {
      gameRef.current.restartAtCheckpoint();
    }
  };

  const handleQuitToTitle = () => {
    if (gameRef.current) {
      gameRef.current.stage = 'TITLE';
      gameRef.current.isPaused = false;
      gameRef.current.cameraController.unlock();
      setUiState((prev) => ({ ...prev, stage: 'TITLE', isPaused: false }));
    }
  };

  const handleReturnToTitleFromEnding = () => {
    handleQuitToTitle();
  };

  const handleRequestPointerLock = () => {
    if (gameRef.current && uiState.stage === 'PLAYING') {
      gameRef.current.cameraController.requestLock();
    }
  };

  const handleSensitivityChange = (val: number) => {
    if (gameRef.current) {
      gameRef.current.setMouseSensitivity(val);
    }
  };

  const handleSkipIntro = () => {
    if (gameRef.current) {
      gameRef.current.cinematicController.skipIntro();
    }
  };

  const handleBloomToggle = (enabled: boolean) => {
    if (gameRef.current) {
      gameRef.current.setBloomEnabled(enabled);
      setUiState((prev) => ({ ...prev, bloomEnabled: enabled }));
    }
  };

  const handleBloomStrengthChange = (strength: number) => {
    if (gameRef.current) {
      gameRef.current.setBloomStrength(strength);
      setUiState((prev) => ({ ...prev, bloomStrength: strength }));
    }
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        onClick={handleRequestPointerLock}
        className="w-full h-full block cursor-crosshair"
      />

      {/* Cinematic Black Screen Overlay (for Intro & Ending) */}
      {uiState.blackScreenOpacity > 0.01 && (
        <div
          className="absolute inset-0 bg-black pointer-events-none transition-opacity duration-300 z-20 flex flex-col items-center justify-end pb-16"
          style={{ opacity: uiState.blackScreenOpacity }}
        >
          {uiState.stage === 'INTRO_CINEMATIC' && (
            <button
              onClick={handleSkipIntro}
              className="pointer-events-auto px-4 py-2 bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/80 text-xs font-mono rounded tracking-wider uppercase cursor-pointer"
            >
              [PRESS TO SKIP INTRO]
            </button>
          )}
        </div>
      )}

      {/* Title Screen Overlay */}
      {uiState.stage === 'TITLE' && (
        <TitleScreen
          onPlay={handleStartPlay}
          onOpenControls={() => setShowControls(true)}
          onOpenSettings={() => setShowSettings(true)}
          onOpenCredits={() => setShowCredits(true)}
          onOpenMusic={() => setShowMusic(true)}
        />
      )}

      {/* In-Game HUD */}
      {uiState.stage === 'PLAYING' && (
        <HUD state={uiState} onRequestPointerLock={handleRequestPointerLock} />
      )}

      {/* Pause Menu */}
      {(uiState.stage === 'PAUSED' || uiState.isPaused) && (
        <PauseMenu
          checkpointName={uiState.checkpointName}
          onResume={handleResume}
          onRestartCheckpoint={handleRestartCheckpoint}
          onOpenControls={() => setShowControls(true)}
          onOpenSettings={() => setShowSettings(true)}
          onOpenMusic={() => setShowMusic(true)}
          onQuitToTitle={handleQuitToTitle}
        />
      )}

      {/* Controls Modal */}
      {showControls && <ControlsModal onClose={() => setShowControls(false)} />}

      {/* Settings Modal with Bloom Post-Processing configuration */}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onSensitivityChange={handleSensitivityChange}
          currentSensitivity={gameRef.current?.cameraController.sensitivity || 0.0022}
          bloomEnabled={uiState.bloomEnabled}
          bloomStrength={uiState.bloomStrength}
          onBloomToggle={handleBloomToggle}
          onBloomStrengthChange={handleBloomStrengthChange}
        />
      )}

      {/* Credits Modal */}
      {showCredits && <CreditsModal onClose={() => setShowCredits(false)} />}

      {/* Lyria Music Generator Modal */}
      {showMusic && <MusicGeneratorModal onClose={() => setShowMusic(false)} />}

      {/* Final Ending Screen */}
      {uiState.stage === 'CREDITS' && (
        <EndingScreen onReturnToTitle={handleReturnToTitleFromEnding} />
      )}
    </main>
  );
}
