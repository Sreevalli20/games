export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface PlayerFrame {
  timestamp: number; // in seconds
  x: number;
  y: number;
  z: number;
  rotationY: number; // player yaw
  pitch: number;     // camera pitch
  isSprinting: boolean;
  isAttacking: boolean;
  isInteracting: boolean;
  isGrounded: boolean;
}

export interface WorldStateFrame {
  timestamp: number;
  switches: Record<string, boolean>;
  doors: Record<string, number>; // open progress 0 to 1
  canalWaterLevel: number;
  bridgeExtended: number;
  reactorStabilizedA: boolean;
  reactorStabilizedB: boolean;
  enemyAlive: boolean;
  enemyHealth: number;
  enemyX: number;
  enemyY: number;
  enemyZ: number;
}

export type GameStage = 
  | 'TITLE'
  | 'INTRO_CINEMATIC'
  | 'PLAYING'
  | 'PAUSED'
  | 'ENDING_CINEMATIC'
  | 'CREDITS';

export type CheckpointId = 
  | 'START_PLATFORM'
  | 'SECURITY_GATE'
  | 'FLOODED_CANAL'
  | 'REACTOR_ROOM'
  | 'FINAL_CHAMBER';

export interface CheckpointData {
  id: CheckpointId;
  name: string;
  playerPosition: Vector3D;
  playerRotationY: number;
  hasDevice: boolean;
  puzzlesCleared: {
    puzzle1: boolean;
    puzzle2: boolean;
    puzzle3: boolean;
    finalBridge: boolean;
  };
  health: number;
}

export interface DialogueMessage {
  id: string;
  speaker: 'MIRA' | 'SYSTEM' | 'PROTAGONIST';
  speakerLabel: string;
  text: string;
  duration: number; // seconds
  offsetLabel?: string;
}
