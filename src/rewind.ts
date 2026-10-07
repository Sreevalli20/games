import * as THREE from 'three';
import { PlayerFrame, WorldStateFrame } from './types';
import { EchoEntity } from './echo';
import { sound } from './audio';

export class RewindManager {
  private maxHistoryDuration: number = 9.0; // Exact 9-second rolling window
  private playerHistory: PlayerFrame[] = [];
  private worldHistory: WorldStateFrame[] = [];
  public echoes: EchoEntity[] = [];
  private maxEchoes: number = 3;

  private scene: THREE.Scene;
  private echoCounter: number = 0;
  private cooldown: number = 0;

  // Visual rewind flash state
  public rewindFlashTimer: number = 0;
  public rewindFlashActive: boolean = false;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public recordFrame(playerFrame: PlayerFrame, worldFrame: WorldStateFrame): void {
    this.playerHistory.push(playerFrame);
    this.worldHistory.push(worldFrame);

    // Prune history older than 9.0 seconds
    const cutoffTime = playerFrame.timestamp - this.maxHistoryDuration;
    while (this.playerHistory.length > 2 && this.playerHistory[0].timestamp < cutoffTime) {
      this.playerHistory.shift();
    }
    while (this.worldHistory.length > 2 && this.worldHistory[0].timestamp < cutoffTime) {
      this.worldHistory.shift();
    }
  }

  public canRewind(hasDevice: boolean): boolean {
    if (!hasDevice) return false;
    if (this.cooldown > 0) return false;
    if (this.playerHistory.length < 15) return false; // Need at least ~0.5s of recorded data
    return true;
  }

  public getHistoryDuration(): number {
    if (this.playerHistory.length < 2) return 0;
    return this.playerHistory[this.playerHistory.length - 1].timestamp - this.playerHistory[0].timestamp;
  }

  public triggerRewind(hasDevice: boolean): WorldStateFrame | null {
    if (!this.canRewind(hasDevice)) return null;

    sound.playRewind();
    this.cooldown = 2.0; // 2-second cooldown between rewinds
    this.rewindFlashActive = true;
    this.rewindFlashTimer = 0.6; // Glitch flash duration

    // 1. Capture the recorded slice to spawn an Echo
    const recordedSlice = [...this.playerHistory];

    // Maintain max 3 echoes
    if (this.echoes.length >= this.maxEchoes) {
      const oldest = this.echoes.shift();
      if (oldest) {
        oldest.destroy(this.scene);
      }
    }

    this.echoCounter++;
    const newEcho = new EchoEntity(this.scene, recordedSlice, `echo_${this.echoCounter}`);
    this.echoes.push(newEcho);
    sound.playEchoSpawn();

    // 2. Retrieve the world state from 9 seconds ago (or the oldest in current buffer)
    const pastWorldState = this.worldHistory.length > 0 ? this.worldHistory[0] : null;

    // Reset current history buffers to begin recording anew from the present
    // Keep only the most recent frame so continuous recording continues smoothly
    const latestPlayerFrame = this.playerHistory[this.playerHistory.length - 1];
    const latestWorldFrame = this.worldHistory[this.worldHistory.length - 1];
    this.playerHistory = latestPlayerFrame ? [latestPlayerFrame] : [];
    this.worldHistory = latestWorldFrame ? [latestWorldFrame] : [];

    return pastWorldState;
  }

  public update(delta: number, runTime: number): void {
    if (this.cooldown > 0) {
      this.cooldown -= delta;
    }

    if (this.rewindFlashTimer > 0) {
      this.rewindFlashTimer -= delta;
      if (this.rewindFlashTimer <= 0) {
        this.rewindFlashActive = false;
      }
    }

    // Update active echoes
    for (let i = this.echoes.length - 1; i >= 0; i--) {
      const echo = this.echoes[i];
      // Echo updates with its relative playback progress
      echo.update(echo['duration'] ? (delta * 1) : 0, delta);
    }
  }

  public updateEchoesWithPlayback(delta: number): void {
    for (let i = this.echoes.length - 1; i >= 0; i--) {
      const echo = this.echoes[i];
      // Increment elapsed playback time inside echo
      const currentPlayback = (echo as unknown as { _playbackTime?: number })._playbackTime || 0;
      const nextPlayback = currentPlayback + delta;
      (echo as unknown as { _playbackTime: number })._playbackTime = nextPlayback;

      echo.update(nextPlayback, delta);

      if (echo.isCompleted) {
        echo.destroy(this.scene);
        this.echoes.splice(i, 1);
      }
    }
  }

  public clearAllEchoes(): void {
    for (const echo of this.echoes) {
      echo.destroy(this.scene);
    }
    this.echoes = [];
    this.playerHistory = [];
    this.worldHistory = [];
  }
}
