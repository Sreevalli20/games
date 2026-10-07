import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { FirstPersonCamera } from './camera';
import { MetroWorld, InteractiveObject } from './world';
import { Player } from './player';
import { RewindManager } from './rewind';
import { PuzzleManager } from './puzzles';
import { TemporalAnomaly } from './enemy';
import { CinematicController } from './cinematics';
import { CheckpointManager } from './checkpoints';
import { sound } from './audio';
import { GameStage, CheckpointData } from './types';
import { InteractionSystem, PressableButton } from './interaction';

export interface GameUIState {
  stage: GameStage;
  health: number;
  maxHealth: number;
  hasDevice: boolean;
  historyDuration: number;
  echoCount: number;
  canRewind: boolean;
  interactionPrompt: string | null;
  currentObjective: string;
  isPaused: boolean;
  checkpointName: string;
  subtitle: { speaker: string; text: string; offset?: string } | null;
  blackScreenOpacity: number;
  rewindFlashActive: boolean;
  isPointerLocked: boolean;
  bloomEnabled: boolean;
  bloomStrength: number;
}

export class EchoGame {
  public scene: THREE.Scene;
  public renderer: THREE.WebGLRenderer;
  public cameraController: FirstPersonCamera;
  public world: MetroWorld;
  public player: Player;
  public rewindManager: RewindManager;
  public puzzleManager: PuzzleManager;
  public enemy: TemporalAnomaly;
  public cinematicController: CinematicController;
  public checkpointManager: CheckpointManager;
  public interactionSystem: InteractionSystem;

  // Post-processing pipeline with Bloom pass
  public composer: EffectComposer;
  public bloomPass: UnrealBloomPass;
  public bloomEnabled: boolean = true;
  public bloomStrength: number = 0.85;

  public stage: GameStage = 'TITLE';
  public isPaused: boolean = false;
  private isRunning: boolean = false;
  private isRespawning: boolean = false;
  private lastTime: number = 0;
  private totalRunTime: number = 0;

  // Active interaction near player
  public activeInteractive: InteractiveObject | null = null;
  public currentObjective: string = 'Investigate the abandoned platform';

  // React state sync callback
  private onStateChange: ((state: GameUIState) => void) | null = null;

  constructor(canvas: HTMLCanvasElement, onStateChange: (state: GameUIState) => void) {
    this.onStateChange = onStateChange;

    // 1. Setup Three.js Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    // 2. Setup Scene & Camera
    this.scene = new THREE.Scene();
    this.cameraController = new FirstPersonCamera(canvas);

    // 3. Setup Three.js Post-Processing Pipeline (UnrealBloomPass)
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.cameraController.camera);
    this.composer.addPass(renderPass);

    const bloomResolution = new THREE.Vector2(window.innerWidth, window.innerHeight);
    // UnrealBloomPass: (resolution, strength, radius, threshold)
    // Enhances futuristic cyan holograms, neon platform lamps, reactor cores, and specular metal reflections
    this.bloomPass = new UnrealBloomPass(bloomResolution, this.bloomStrength, 0.45, 0.22);
    this.composer.addPass(this.bloomPass);

    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);

    // 4. Setup World & Subsystems
    this.world = new MetroWorld(this.scene);
    this.player = new Player(this.scene);
    this.rewindManager = new RewindManager(this.scene);
    this.puzzleManager = new PuzzleManager(this.world);
    this.enemy = new TemporalAnomaly(this.scene);
    this.cinematicController = new CinematicController(this.cameraController, this.world);
    this.checkpointManager = new CheckpointManager();

    // 5. Setup Interaction Raycasting System
    this.interactionSystem = new InteractionSystem(this.cameraController.camera);
    this.registerInteractables();

    // 6. Bind event listeners
    this.setupWindowListeners();

    // 7. Start main loop
    this.isRunning = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.gameLoop);
  }

  private registerInteractables(): void {
    // Register physical buttons
    for (const btn of this.world.buttons) {
      this.interactionSystem.register(btn);
      btn.onActivate = () => {
        if (btn.id === 'switch_gate_1') {
          this.puzzleManager.handlePlayerInteraction(btn.id);
        }
      };
    }

    // Register interactive scene objects
    for (const obj of this.world.interactives) {
      this.interactionSystem.register({
        id: obj.id,
        name: obj.prompt,
        prompt: obj.prompt,
        mesh: obj.mesh,
        interact: () => this.handleObjectInteraction(obj),
      });
    }
  }

  private handleObjectInteraction(item: InteractiveObject): void {
    sound.playInteract();

    if (item.type === 'DEVICE_PICKUP') {
      this.player.hasDevice = true;
      this.world.scene.remove(item.mesh);
      this.world.interactives = this.world.interactives.filter((i) => i.id !== item.id);
      this.interactionSystem.unregister(item.id);
      sound.playEchoSpawn();
      this.cinematicController.triggerRadioMessage({
        id: 'dev_acquired',
        speaker: 'MIRA',
        speakerLabel: 'MIRA',
        text: 'You found the RESONANCE. Press [R] to rewind the world 9 seconds.',
        duration: 4.5,
        offsetLabel: 'OFFSET: -9.00s',
      });
      this.currentObjective = 'Bypass the Security Blast Gate (Use R to Rewind)';
      this.checkpointManager.saveCheckpoint('START_PLATFORM');
    } else if (item.type === 'MIRA_RECONNECT') {
      this.stage = 'ENDING_CINEMATIC';
      this.cinematicController.startEnding(() => {
        this.stage = 'CREDITS';
        this.cameraController.unlock();
      });
    } else {
      this.puzzleManager.handlePlayerInteraction(item.id);
    }
  }

  private setupWindowListeners(): void {
    window.addEventListener('resize', () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      this.renderer.setSize(width, height);
      this.composer.setSize(width, height);
      this.bloomPass.resolution.set(width, height);
      this.cameraController.handleResize(width, height);
    });

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') {
        if (this.stage === 'PLAYING') {
          this.togglePause();
        }
      }
    });
  }

  public startNewGame(): void {
    sound.init();
    this.checkpointManager.resetToStart();
    this.loadCheckpoint(this.checkpointManager.getCurrent());

    this.stage = 'INTRO_CINEMATIC';
    this.currentObjective = 'Investigate the subway platform';

    this.cinematicController.startIntro(() => {
      this.stage = 'PLAYING';
      this.cinematicController.triggerRadioMessage({
        id: 'start_tut',
        speaker: 'SYSTEM',
        speakerLabel: 'TERMINAL',
        text: 'Retrieve the RESONANCE core from the platform pedestal.',
        duration: 4.0,
      });
    });
  }

  public resumeGame(): void {
    this.isPaused = false;
    this.stage = 'PLAYING';
  }

  public togglePause(): void {
    if (this.stage !== 'PLAYING' && this.stage !== 'PAUSED') return;

    this.isPaused = !this.isPaused;
    this.stage = this.isPaused ? 'PAUSED' : 'PLAYING';

    if (this.isPaused) {
      this.cameraController.unlock();
    }
  }

  public restartAtCheckpoint(): void {
    const cp = this.checkpointManager.getCurrent();
    this.loadCheckpoint(cp);
    this.isPaused = false;
    this.stage = 'PLAYING';
  }

  public loadCheckpoint(cp: CheckpointData): void {
    this.player.teleport(cp.playerPosition.x, cp.playerPosition.y, cp.playerPosition.z, cp.playerRotationY);
    this.player.hasDevice = cp.hasDevice;
    this.player.reset(cp.health);
    this.isRespawning = false;
    this.rewindManager.clearAllEchoes();

    // Restore puzzle states
    this.puzzleManager.puzzle1Cleared = cp.puzzlesCleared.puzzle1;
    this.puzzleManager.puzzle2Cleared = cp.puzzlesCleared.puzzle2;
    this.puzzleManager.puzzle3Cleared = cp.puzzlesCleared.puzzle3;
    this.puzzleManager.finalBridgeFormed = cp.puzzlesCleared.finalBridge;

    if (cp.puzzlesCleared.puzzle1) {
      this.world.securityDoorOpenAmount = 1.0;
    }
    if (cp.puzzlesCleared.puzzle2) {
      this.world.canalWaterLevel = 0;
      this.world.bridgeExtensionAmount = 1.0;
    }
    if (cp.puzzlesCleared.puzzle3) {
      this.world.reactorDoorOpenAmount = 1.0;
      this.enemy.die();
    } else {
      this.enemy.reset(3, new THREE.Vector3(1, 1.2, -105));
    }
    if (cp.puzzlesCleared.finalBridge) {
      this.world.finalBridgeFormed = 1.0;
      this.world.setBridgeCollider(true);
    }

    this.updateObjectiveByCheckpoint(cp);
  }

  private updateObjectiveByCheckpoint(cp: CheckpointData): void {
    if (!cp.hasDevice) {
      this.currentObjective = 'Acquire the RESONANCE device [E]';
    } else if (!cp.puzzlesCleared.puzzle1) {
      this.currentObjective = 'Bypass the Security Blast Gate (Use R to Rewind)';
    } else if (!cp.puzzlesCleared.puzzle2) {
      this.currentObjective = 'Drain the flooded canal and cross high walkway';
    } else if (!cp.puzzlesCleared.puzzle3) {
      this.currentObjective = 'Overload Reactor Pylons or neutralize the Anomaly';
    } else if (!cp.puzzlesCleared.finalBridge) {
      this.currentObjective = 'Synchronize Left and Right temporal consoles';
    } else {
      this.currentObjective = 'Cross the temporal bridge to reconnect with Mira';
    }
  }

  private gameLoop = (currentTime: number): void => {
    if (!this.isRunning) return;

    const delta = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    if (!this.isPaused && (this.stage === 'PLAYING' || this.stage === 'INTRO_CINEMATIC' || this.stage === 'ENDING_CINEMATIC')) {
      this.totalRunTime += delta;
      this.update(delta);
    }

    // Render 3D Scene with Bloom Post-Processing
    if (this.bloomEnabled) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.cameraController.camera);
    }

    // Sync React UI State
    this.emitUIState();

    requestAnimationFrame(this.gameLoop);
  };

  private update(delta: number): void {
    // 1. Cinematics Update
    this.cinematicsUpdate(delta);

    // If still in pure intro black screen, skip gameplay logic
    if (this.stage === 'INTRO_CINEMATIC' && this.cinematicController.blackScreenOpacity > 0.95) {
      return;
    }

    // 2. Player Input & Physics
    const isPlayerControllable = this.stage === 'PLAYING' && !this.player.isDead;
    let playerFrame;
    if (isPlayerControllable) {
      playerFrame = this.player.update(
        delta,
        this.cameraController.yaw,
        this.cameraController.pitch,
        this.world.colliders,
        this.totalRunTime
      );
    } else {
      // In cinematic, player stays stationary
      playerFrame = {
        timestamp: this.totalRunTime,
        x: this.player.position.x,
        y: this.player.position.y,
        z: this.player.position.z,
        rotationY: this.cameraController.yaw,
        pitch: this.cameraController.pitch,
        isSprinting: false,
        isAttacking: false,
        isInteracting: false,
        isGrounded: true,
      };
    }

    // 3. Camera Update
    const isMoving = this.player.velocity.lengthSq() > 0.05;
    this.cameraController.update(this.player.position, delta, isMoving, this.player.isSprinting);

    // 4. World Frame & Rewind Recording
    const worldFrame = this.puzzleManager.getWorldFrame(
      this.totalRunTime,
      this.enemy.isAlive,
      this.enemy.health,
      this.enemy.position
    );

    if (this.player.hasDevice && isPlayerControllable) {
      this.rewindManager.recordFrame(playerFrame, worldFrame);
    }

    // 5. Rewind Trigger Handling (R Key)
    if (isPlayerControllable && this.player.keys.rewind) {
      this.player.keys.rewind = false; // consume trigger
      if (this.rewindManager.canRewind(this.player.hasDevice)) {
        const pastWorldState = this.rewindManager.triggerRewind(this.player.hasDevice);
        if (pastWorldState) {
          // Restore world to state from 9 seconds ago
          this.puzzleManager.restoreWorldFrame(pastWorldState);
          // Also restore enemy if applicable
          if (pastWorldState.enemyAlive !== undefined) {
            this.enemy.reset(
              pastWorldState.enemyHealth,
              new THREE.Vector3(pastWorldState.enemyX, pastWorldState.enemyY, pastWorldState.enemyZ)
            );
          }
        }
        this.cameraController.addShake(0.35);
      }
    }

    // 6. Update Rewind Manager & Active Echoes
    this.rewindManager.update(delta, this.totalRunTime);
    this.rewindManager.updateEchoesWithPlayback(delta);

    // 7. Check Echo Interactions with Puzzles
    this.puzzleManager.checkEchoInteractions(this.rewindManager.echoes);

    // 8. Player Interaction Detection (E Key)
    this.checkPlayerInteractions();

    // 9. Update Puzzles Logic
    this.puzzleManager.update(delta, this.player);

    // 10. Update Enemy AI & Combat
    this.enemy.update(delta, this.totalRunTime, this.player, this.rewindManager.echoes);

    // 11. Update Metro World Dynamic Models and Lights
    this.world.update(delta, this.totalRunTime);

    // 12. Check Checkpoints & Sector Progress
    this.checkSectorCheckpoints();

    // 13. Check Player Death
    if (this.player.isDead && this.stage === 'PLAYING' && !this.isRespawning) {
      this.isRespawning = true;
      // Single delayed checkpoint respawn
      setTimeout(() => {
        const cp = this.checkpointManager.getCurrent();
        this.loadCheckpoint(cp);
        this.isRespawning = false;
      }, 1200);
    }
  }

  private cinematicsUpdate(delta: number): void {
    this.cinematicController.update(delta);
  }

  private checkPlayerInteractions(): void {
    // 1. Precise camera raycasting detection
    const raycastHit = this.interactionSystem.update();

    // 2. Proximity fallback detection
    let proximityItem: InteractiveObject | null = null;
    let minDist = 999;
    for (const obj of this.world.interactives) {
      const dist = this.player.position.distanceTo(obj.position);
      if (dist <= obj.radius && dist < minDist) {
        minDist = dist;
        proximityItem = obj;
      }
    }

    this.activeInteractive = proximityItem;

    // 3. Execute interaction when 'E' key is pressed
    if (this.player.keys.interact) {
      this.player.keys.interact = false; // consume trigger

      if (raycastHit) {
        this.interactionSystem.triggerInteract();
      } else if (proximityItem) {
        this.handleObjectInteraction(proximityItem);
      }
    }
  }

  private checkSectorCheckpoints(): void {
    // Checkpoint 1: Security Gate Passed
    if (this.puzzleManager.puzzle1Cleared && this.player.position.z < -52 && this.checkpointManager.getCurrent().id === 'START_PLATFORM') {
      this.checkpointManager.saveCheckpoint('SECURITY_GATE');
      this.currentObjective = 'Drain the flooded canal and cross high walkway';
      this.cinematicController.triggerRadioMessage({
        id: 'sector_1_clear',
        speaker: 'MIRA',
        speakerLabel: 'MIRA',
        text: 'You made it through. But the lower tunnel is flooded with temporal radiation.',
        duration: 4.2,
        offsetLabel: 'OFFSET: -9.00s',
      });
    }

    // Checkpoint 2: Flooded Canal Cleared
    if (this.puzzleManager.puzzle2Cleared && this.player.position.z < -86 && this.checkpointManager.getCurrent().id === 'SECURITY_GATE') {
      this.checkpointManager.saveCheckpoint('FLOODED_CANAL');
      this.currentObjective = 'Overload Reactor Pylons or neutralize the Anomaly';
      this.cinematicController.triggerRadioMessage({
        id: 'sector_2_clear',
        speaker: 'MIRA',
        speakerLabel: 'MIRA',
        text: 'A temporal anomaly is guarding the reactor. Distract it with an Echo or attack together!',
        duration: 4.5,
        offsetLabel: 'OFFSET: -9.00s',
      });
    }

    // Checkpoint 3: Reactor Room Cleared
    if (this.puzzleManager.puzzle3Cleared && this.player.position.z < -126 && this.checkpointManager.getCurrent().id === 'FLOODED_CANAL') {
      this.checkpointManager.saveCheckpoint('REACTOR_ROOM');
      this.currentObjective = 'Synchronize Left and Right temporal consoles in the final chamber';
      this.cinematicController.triggerRadioMessage({
        id: 'sector_3_clear',
        speaker: 'MIRA',
        speakerLabel: 'MIRA',
        text: 'I can see your timeline forming... Synchronize both consoles!',
        duration: 4.5,
        offsetLabel: 'TIMELINES CONVERGING',
      });
    }
  }

  private emitUIState(): void {
    if (!this.onStateChange) return;

    const historyDuration = this.rewindManager.getHistoryDuration();
    const canRewind = this.rewindManager.canRewind(this.player.hasDevice);

    const cp = this.checkpointManager.getCurrent();

    this.onStateChange({
      stage: this.stage,
      health: Math.round(this.player.health),
      maxHealth: this.player.maxHealth,
      hasDevice: this.player.hasDevice,
      historyDuration,
      echoCount: this.rewindManager.echoes.length,
      canRewind,
      interactionPrompt: this.interactionSystem.currentTarget
        ? `[E] ${this.interactionSystem.currentTarget.prompt}`
        : (this.activeInteractive ? `[E] ${this.activeInteractive.prompt}` : null),
      currentObjective: this.currentObjective,
      isPaused: this.isPaused,
      checkpointName: cp.name,
      subtitle: this.cinematicController.currentDialogue
        ? {
            speaker: this.cinematicController.currentDialogue.speakerLabel,
            text: this.cinematicController.currentDialogue.text,
            offset: this.cinematicController.currentDialogue.offsetLabel,
          }
        : null,
      blackScreenOpacity: this.cinematicController.blackScreenOpacity,
      rewindFlashActive: this.rewindManager.rewindFlashActive,
      isPointerLocked: this.cameraController.isLocked,
      bloomEnabled: this.bloomEnabled,
      bloomStrength: this.bloomStrength,
    });
  }

  public setMouseSensitivity(val: number): void {
    this.cameraController.sensitivity = val;
  }

  public setBloomEnabled(enabled: boolean): void {
    this.bloomEnabled = enabled;
  }

  public setBloomStrength(strength: number): void {
    this.bloomStrength = strength;
    this.bloomPass.strength = strength;
  }

  public destroy(): void {
    this.isRunning = false;
    this.rewindManager.clearAllEchoes();
    this.enemy.destroy();
    this.renderer.dispose();
  }
}
