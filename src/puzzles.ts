import * as THREE from 'three';
import { sound } from './audio';
import { MetroWorld } from './world';
import { EchoEntity } from './echo';
import { Player } from './player';
import { WorldStateFrame } from './types';

export class PuzzleManager {
  private world: MetroWorld;

  // Puzzle 1: Security Gate
  public gateSwitchActive: boolean = false;
  public gateOpenTimer: number = 0;
  public puzzle1Cleared: boolean = false;

  // Puzzle 2: Flooded Canal Turbine
  public turbineActive: boolean = false;
  public turbineTimer: number = 0;
  public puzzle2Cleared: boolean = false;

  // Puzzle 3: Reactor Conductor Pylons
  public pylonAActive: boolean = false;
  public pylonBActive: boolean = false;
  public pylonATimer: number = 0;
  public pylonBTimer: number = 0;
  public puzzle3Cleared: boolean = false;

  // Puzzle 4: Final Timeline Consoles
  public finalConsoleAActive: boolean = false;
  public finalConsoleBActive: boolean = false;
  public finalConsoleATimer: number = 0;
  public finalConsoleBTimer: number = 0;
  public finalBridgeFormed: boolean = false;

  constructor(world: MetroWorld) {
    this.world = world;
  }

  public getWorldFrame(
    time: number,
    enemyAlive: boolean,
    enemyHp: number,
    enemyPos: { x: number; y: number; z: number }
  ): WorldStateFrame {
    return {
      timestamp: time,
      switches: {
        gateSwitch: this.gateSwitchActive,
        turbine: this.turbineActive,
        pylonA: this.pylonAActive,
        pylonB: this.pylonBActive,
        finalA: this.finalConsoleAActive,
        finalB: this.finalConsoleBActive,
      },
      doors: {
        securityDoor: this.world.securityDoorOpenAmount,
        reactorDoor: this.world.reactorDoorOpenAmount,
      },
      canalWaterLevel: this.world.canalWaterLevel,
      bridgeExtended: this.world.bridgeExtensionAmount,
      reactorStabilizedA: this.pylonAActive,
      reactorStabilizedB: this.pylonBActive,
      enemyAlive,
      enemyHealth: enemyHp,
      enemyX: enemyPos.x,
      enemyY: enemyPos.y,
      enemyZ: enemyPos.z,
    };
  }

  public restoreWorldFrame(frame: WorldStateFrame): void {
    this.gateSwitchActive = frame.switches.gateSwitch || false;
    this.turbineActive = frame.switches.turbine || false;
    this.pylonAActive = frame.switches.pylonA || false;
    this.pylonBActive = frame.switches.pylonB || false;
    this.finalConsoleAActive = frame.switches.finalA || false;
    this.finalConsoleBActive = frame.switches.finalB || false;

    this.world.securityDoorOpenAmount = frame.doors.securityDoor || 0;
    this.world.reactorDoorOpenAmount = frame.doors.reactorDoor || 0;
    this.world.canalWaterLevel = frame.canalWaterLevel ?? 1;
    this.world.bridgeExtensionAmount = frame.bridgeExtended ?? 0;
  }

  public handlePlayerInteraction(interactiveId: string): void {
    if (interactiveId === 'switch_gate_1') {
      this.gateSwitchActive = true;
      this.gateOpenTimer = 4.2; // Gate stays open 4.2s
      sound.playButtonSwitch();
      sound.playDoorOpen();
    } else if (interactiveId === 'valve_drain_2') {
      this.turbineActive = true;
      this.turbineTimer = 6.0; // Turbine runs 6.0s
      sound.playButtonSwitch();
    } else if (interactiveId === 'reactor_alpha') {
      this.pylonAActive = true;
      this.pylonATimer = 6.0;
      sound.playButtonSwitch();
    } else if (interactiveId === 'reactor_beta') {
      this.pylonBActive = true;
      this.pylonBTimer = 6.0;
      sound.playButtonSwitch();
    } else if (interactiveId === 'final_console_a') {
      this.finalConsoleAActive = true;
      this.finalConsoleATimer = 5.0;
      sound.playButtonSwitch();
    } else if (interactiveId === 'final_console_b') {
      this.finalConsoleBActive = true;
      this.finalConsoleBTimer = 5.0;
      sound.playButtonSwitch();
    }
  }

  public checkEchoInteractions(echoes: EchoEntity[]): void {
    for (const echo of echoes) {
      if (!echo.isInteracting && !echo.isAttacking) continue;

      const pos = echo.currentPosition;

      // Echo near Security Switch
      if (pos.distanceTo(new THREE.Vector3(3.2, 0.8, -26)) < 2.5) {
        if (!this.gateSwitchActive || this.gateOpenTimer < 1.0) {
          this.gateSwitchActive = true;
          this.gateOpenTimer = 4.2;
          sound.playButtonSwitch();
          sound.playDoorOpen();
        }
      }

      // Echo near Drainage Valve
      if (pos.distanceTo(new THREE.Vector3(-2, 1.1, -52)) < 2.5) {
        if (!this.turbineActive || this.turbineTimer < 1.0) {
          this.turbineActive = true;
          this.turbineTimer = 6.0;
          sound.playButtonSwitch();
        }
      }

      // Echo near Reactor Pylons
      if (pos.distanceTo(new THREE.Vector3(-10, 1.5, -105)) < 3.0) {
        this.pylonAActive = true;
        this.pylonATimer = 6.0;
      }
      if (pos.distanceTo(new THREE.Vector3(12, 1.5, -105)) < 3.0) {
        this.pylonBActive = true;
        this.pylonBTimer = 6.0;
      }

      // Echo near Final Chamber Consoles
      if (pos.distanceTo(new THREE.Vector3(-7, 1.0, -142)) < 3.0) {
        this.finalConsoleAActive = true;
        this.finalConsoleATimer = 5.0;
      }
      if (pos.distanceTo(new THREE.Vector3(9, 1.0, -142)) < 3.0) {
        this.finalConsoleBActive = true;
        this.finalConsoleBTimer = 5.0;
      }
    }
  }

  public update(delta: number, player: Player): void {
    // 1. Puzzle 1: Security Gate
    if (this.gateOpenTimer > 0) {
      this.gateOpenTimer -= delta;
      this.world.securityDoorOpenAmount = 1.0;
      if (this.gateOpenTimer <= 0) {
        this.gateSwitchActive = false;
        if (!this.puzzle1Cleared) {
          this.world.securityDoorOpenAmount = 0;
        }
      }
    }

    // Check if player passed through gate
    if (player.position.z < -49.5 && !this.puzzle1Cleared) {
      this.puzzle1Cleared = true;
      this.world.securityDoorOpenAmount = 1.0;
      sound.playPuzzleSuccess();
    }

    // 2. Puzzle 2: Drainage Turbine
    if (this.turbineTimer > 0) {
      this.turbineTimer -= delta;
      this.world.canalWaterLevel = 0; // Drained
      this.world.bridgeExtensionAmount = 1.0; // Extended bridge
      if (this.turbineTimer <= 0) {
        this.turbineActive = false;
        if (!this.puzzle2Cleared) {
          this.world.canalWaterLevel = 1;
          this.world.bridgeExtensionAmount = 0;
        }
      }
    } else if (!this.puzzle2Cleared) {
      this.world.canalWaterLevel = 1;
      this.world.bridgeExtensionAmount = 0;
    }

    // Check if player crossed flooded canal
    if (player.position.z < -81.5 && !this.puzzle2Cleared) {
      this.puzzle2Cleared = true;
      this.world.canalWaterLevel = 0;
      this.world.bridgeExtensionAmount = 1.0;
      sound.playPuzzleSuccess();
    }

    // 3. Puzzle 3: Reactor Pylons
    if (this.pylonATimer > 0) {
      this.pylonATimer -= delta;
      if (this.pylonATimer <= 0) this.pylonAActive = false;
    }
    if (this.pylonBTimer > 0) {
      this.pylonBTimer -= delta;
      if (this.pylonBTimer <= 0) this.pylonBActive = false;
    }

    if (this.pylonAActive && this.pylonBActive && !this.puzzle3Cleared) {
      this.puzzle3Cleared = true;
      this.world.reactorDoorOpenAmount = 1.0;
      sound.playPuzzleSuccess();
      sound.playDoorOpen();
    }

    if (this.puzzle3Cleared) {
      this.world.reactorDoorOpenAmount = 1.0;
    }

    // 4. Puzzle 4: Final Chamber Synchronization
    if (this.finalConsoleATimer > 0) {
      this.finalConsoleATimer -= delta;
      if (this.finalConsoleATimer <= 0) this.finalConsoleAActive = false;
    }
    if (this.finalConsoleBTimer > 0) {
      this.finalConsoleBTimer -= delta;
      if (this.finalConsoleBTimer <= 0) this.finalConsoleBActive = false;
    }

    if (this.finalConsoleAActive && this.finalConsoleBActive && !this.finalBridgeFormed) {
      this.finalBridgeFormed = true;
      this.world.finalBridgeFormed = 1.0;
      this.world.setBridgeCollider(true);
      sound.playPuzzleSuccess();
      sound.playEndingHarmony();
    }
  }
}
