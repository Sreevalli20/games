import * as THREE from 'three';
import { sound } from './audio';
import { EchoEntity } from './echo';
import { Player } from './player';

export type EnemyState = 'PATROL' | 'CHASE' | 'ATTACK' | 'STUNNED' | 'DEAD';

export class TemporalAnomaly {
  public group: THREE.Group;
  public position: THREE.Vector3 = new THREE.Vector3(1, 1.2, -105);
  public health: number = 3;
  public maxHealth: number = 3;
  public state: EnemyState = 'PATROL';
  public isAlive: boolean = true;

  private scene: THREE.Scene;
  private patrolWaypoints: THREE.Vector3[] = [
    new THREE.Vector3(-6, 1.2, -98),
    new THREE.Vector3(8, 1.2, -98),
    new THREE.Vector3(8, 1.2, -114),
    new THREE.Vector3(-6, 1.2, -114),
  ];
  private currentWaypointIndex: number = 0;

  // Visual meshes
  private coreMesh: THREE.Mesh;
  private outerCubes: THREE.Mesh[] = [];
  private eyeMesh: THREE.Mesh;
  private glowLight: THREE.PointLight;

  private attackCooldown: number = 0;
  private stunTimer: number = 0;
  private attackRange: number = 2.4;
  private detectionRange: number = 16.0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // Dark obsidian / crimson anomaly body
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x12040a,
      roughness: 0.2,
      metalness: 0.9,
    });

    const crimsonGlowMat = new THREE.MeshStandardMaterial({
      color: 0xff0044,
      emissive: 0xff0044,
      emissiveIntensity: 1.8,
      roughness: 0.3,
    });

    // Central shifting core
    const coreGeom = new THREE.DodecahedronGeometry(0.55, 0);
    this.coreMesh = new THREE.Mesh(coreGeom, crimsonGlowMat);
    this.group.add(this.coreMesh);

    // Orbiting anomaly fracture shards
    const shardGeom = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    for (let i = 0; i < 6; i++) {
      const shard = new THREE.Mesh(shardGeom, bodyMat);
      this.outerCubes.push(shard);
      this.group.add(shard);
    }

    // Glowing Cyclopean eye
    const eyeGeom = new THREE.SphereGeometry(0.18, 12, 12);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff2266 });
    this.eyeMesh = new THREE.Mesh(eyeGeom, eyeMat);
    this.eyeMesh.position.set(0, 0.1, -0.45);
    this.group.add(this.eyeMesh);

    // Point Light
    this.glowLight = new THREE.PointLight(0xff0044, 2.0, 10);
    this.group.add(this.glowLight);

    this.group.position.copy(this.position);
    this.scene.add(this.group);
  }

  public takeDamage(amount: number = 1): void {
    if (!this.isAlive) return;

    this.health -= amount;
    this.stunTimer = 0.8;
    this.state = 'STUNNED';
    sound.playEnemyHit();

    // Visual flicker
    this.coreMesh.scale.set(1.4, 1.4, 1.4);

    if (this.health <= 0) {
      this.die();
    }
  }

  public die(): void {
    this.isAlive = false;
    this.state = 'DEAD';
    this.group.visible = false;
    this.glowLight.intensity = 0;
    sound.playEnemyDefeated();
  }

  public reset(hp: number = 3, pos?: THREE.Vector3): void {
    this.health = hp;
    this.isAlive = true;
    this.state = 'PATROL';
    this.group.visible = true;
    this.glowLight.intensity = 2.0;
    if (pos) {
      this.position.copy(pos);
      this.group.position.copy(pos);
    }
  }

  public update(delta: number, runTime: number, player: Player, echoes: EchoEntity[]): void {
    if (!this.isAlive) return;

    // Orbiting shard animation
    this.outerCubes.forEach((cube, i) => {
      const angle = runTime * 3 + (i * Math.PI) / 3;
      const radius = 0.85 + Math.sin(runTime * 4 + i) * 0.15;
      cube.position.set(Math.cos(angle) * radius, Math.sin(angle * 1.5) * 0.4, Math.sin(angle) * radius);
      cube.rotation.x += delta * 2;
      cube.rotation.y += delta * 3;
    });

    if (this.coreMesh.scale.x > 1.0) {
      this.coreMesh.scale.lerp(new THREE.Vector3(1, 1, 1), delta * 8);
    }

    if (this.stunTimer > 0) {
      this.stunTimer -= delta;
      return;
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown -= delta;
    }

    // Check hit by Player attack
    if (player.isAttacking && player.hasDevice) {
      const distToPlayer = this.position.distanceTo(player.position);
      if (distToPlayer < 4.8) {
        // Check if player is facing enemy
        const toEnemy = this.position.clone().sub(player.position).normalize();
        const playerForward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), player.rotationY);
        if (toEnemy.dot(playerForward) > 0.4) {
          this.takeDamage(1);
          return;
        }
      }
    }

    // Check hit by Echo attack (temporal cooperation!)
    for (const echo of echoes) {
      if (echo.isAttacking) {
        const distToEcho = this.position.distanceTo(echo.currentPosition);
        if (distToEcho < 4.8) {
          this.takeDamage(1);
          return;
        }
      }
    }

    // Target Selection: Player or Nearest Echo
    let targetPos = player.position;
    let targetDist = this.position.distanceTo(player.position);
    let targetIsPlayer = true;

    for (const echo of echoes) {
      const d = this.position.distanceTo(echo.currentPosition);
      if (d < targetDist) {
        targetDist = d;
        targetPos = echo.currentPosition;
        targetIsPlayer = false;
      }
    }

    // State Machine
    if (targetDist < this.detectionRange) {
      if (this.state === 'PATROL') {
        sound.playEnemyAlert();
      }
      this.state = 'CHASE';

      // Move toward target
      const dir = targetPos.clone().sub(this.position);
      dir.y = 0;
      dir.normalize();

      const moveSpeed = 3.6;
      this.position.addScaledVector(dir, moveSpeed * delta);
      this.group.position.copy(this.position);

      // Look at target
      this.group.rotation.y = Math.atan2(dir.x, dir.z) + Math.PI;

      // Attack if in range
      if (targetDist < this.attackRange && this.attackCooldown <= 0) {
        this.attackCooldown = 1.6;
        if (targetIsPlayer) {
          player.takeDamage(25);
        }
      }
    } else {
      this.state = 'PATROL';
      // Patrol between waypoints
      const wp = this.patrolWaypoints[this.currentWaypointIndex];
      const distToWp = this.position.distanceTo(wp);

      if (distToWp < 1.0) {
        this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.patrolWaypoints.length;
      } else {
        const dir = wp.clone().sub(this.position);
        dir.y = 0;
        dir.normalize();
        this.position.addScaledVector(dir, 2.0 * delta);
        this.group.position.copy(this.position);
        this.group.rotation.y = Math.atan2(dir.x, dir.z) + Math.PI;
      }
    }
  }

  public destroy(): void {
    this.scene.remove(this.group);
  }
}
