import { CheckpointData, CheckpointId } from './types';

const CHECKPOINT_STORAGE_KEY = 'echo9_checkpoint_data';

export const CHECKPOINTS: Record<CheckpointId, CheckpointData> = {
  START_PLATFORM: {
    id: 'START_PLATFORM',
    name: 'Sector 0: Arrival Platform',
    playerPosition: { x: 0, y: 1.6, z: 0 },
    playerRotationY: 0,
    hasDevice: false,
    puzzlesCleared: {
      puzzle1: false,
      puzzle2: false,
      puzzle3: false,
      finalBridge: false,
    },
    health: 100,
  },
  SECURITY_GATE: {
    id: 'SECURITY_GATE',
    name: 'Sector 1: Security Gate Passed',
    playerPosition: { x: 1, y: 1.6, z: -52 },
    playerRotationY: 0,
    hasDevice: true,
    puzzlesCleared: {
      puzzle1: true,
      puzzle2: false,
      puzzle3: false,
      finalBridge: false,
    },
    health: 100,
  },
  FLOODED_CANAL: {
    id: 'FLOODED_CANAL',
    name: 'Sector 2: Drainage Canal Cleared',
    playerPosition: { x: 1, y: 1.6, z: -86 },
    playerRotationY: 0,
    hasDevice: true,
    puzzlesCleared: {
      puzzle1: true,
      puzzle2: true,
      puzzle3: false,
      finalBridge: false,
    },
    health: 100,
  },
  REACTOR_ROOM: {
    id: 'REACTOR_ROOM',
    name: 'Sector 3: Reactor Chamber Stabilized',
    playerPosition: { x: 1, y: 1.6, z: -128 },
    playerRotationY: 0,
    hasDevice: true,
    puzzlesCleared: {
      puzzle1: true,
      puzzle2: true,
      puzzle3: true,
      finalBridge: false,
    },
    health: 100,
  },
  FINAL_CHAMBER: {
    id: 'FINAL_CHAMBER',
    name: 'Sector 4: Temporal Chamber',
    playerPosition: { x: 1, y: 1.6, z: -136 },
    playerRotationY: 0,
    hasDevice: true,
    puzzlesCleared: {
      puzzle1: true,
      puzzle2: true,
      puzzle3: true,
      finalBridge: false,
    },
    health: 100,
  },
};

export class CheckpointManager {
  private currentCheckpoint: CheckpointData;

  constructor() {
    this.currentCheckpoint = { ...CHECKPOINTS.START_PLATFORM };
    this.loadFromStorage();
  }

  public saveCheckpoint(id: CheckpointId): CheckpointData {
    const data = CHECKPOINTS[id];
    if (data) {
      this.currentCheckpoint = { ...data };
      try {
        localStorage.setItem(CHECKPOINT_STORAGE_KEY, JSON.stringify(this.currentCheckpoint));
      } catch (e) {
        console.warn('LocalStorage save failed:', e);
      }
    }
    return this.currentCheckpoint;
  }

  public getCurrent(): CheckpointData {
    return { ...this.currentCheckpoint };
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem(CHECKPOINT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id && CHECKPOINTS[parsed.id as CheckpointId]) {
          this.currentCheckpoint = parsed;
        }
      }
    } catch {
      // Fallback to start
      this.currentCheckpoint = { ...CHECKPOINTS.START_PLATFORM };
    }
  }

  public resetToStart(): CheckpointData {
    this.currentCheckpoint = { ...CHECKPOINTS.START_PLATFORM };
    try {
      localStorage.removeItem(CHECKPOINT_STORAGE_KEY);
    } catch {
      // ignore
    }
    return this.currentCheckpoint;
  }
}
