import * as THREE from 'three';
import { sound } from './audio';
import { PlayerFrame } from './types';

export class Player {
  public position: THREE.Vector3 = new THREE.Vector3(0, 1.6, 0);
  public velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public rotationY: number = 0;
  public pitch: number = 0;

  public height: number = 1.75;
  public radius: number = 0.45;

  public isGrounded: boolean = true;
  public isSprinting: boolean = false;
  public isAttacking: boolean = false;
  public isInteracting: boolean = false;

  public hasDevice: boolean = false;
  public health: number = 100;
  public maxHealth: number = 100;
  public isDead: boolean = false;

  // Pulse attack cooldown
  public attackCooldown: number = 0;
  public attackPulseMesh: THREE.Mesh | null = null;
  public attackPulseTime: number = 0;

  // Key states
  public keys: Record<string, boolean> = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
    jump: false,
    interact: false,
    attack: false,
    rewind: false,
  };

  private distanceSinceLastFootstep: number = 0;
  private timeSinceLastDamage: number = 0;

  constructor(scene: THREE.Scene) {
    this.setupInputs();
    this.setupAttackMesh(scene);
  }

  private setupAttackMesh(scene: THREE.Scene): void {
    const geom = new THREE.RingGeometry(0.3, 1.2, 16);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    this.attackPulseMesh = new THREE.Mesh(geom, mat);
    this.attackPulseMesh.visible = false;
    scene.add(this.attackPulseMesh);
  }

  private setupInputs(): void {
    window.addEventListener('keydown', (e) => {
      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') this.keys.forward = true;
      if (code === 'KeyS' || code === 'ArrowDown') this.keys.backward = true;
      if (code === 'KeyA' || code === 'ArrowLeft') this.keys.left = true;
      if (code === 'KeyD' || code === 'ArrowRight') this.keys.right = true;
      if (code === 'ShiftLeft' || code === 'ShiftRight') this.keys.sprint = true;
      if (code === 'Space') this.keys.jump = true;
      if (code === 'KeyE') this.keys.interact = true;
      if (code === 'KeyF') this.keys.attack = true;
      if (code === 'KeyR') this.keys.rewind = true;
    });

    window.addEventListener('keyup', (e) => {
      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') this.keys.forward = false;
      if (code === 'KeyS' || code === 'ArrowDown') this.keys.backward = false;
      if (code === 'KeyA' || code === 'ArrowLeft') this.keys.left = false;
      if (code === 'KeyD' || code === 'ArrowRight') this.keys.right = false;
      if (code === 'ShiftLeft' || code === 'ShiftRight') this.keys.sprint = false;
      if (code === 'Space') this.keys.jump = false;
      if (code === 'KeyE') this.keys.interact = false;
      if (code === 'KeyF') this.keys.attack = false;
      if (code === 'KeyR') this.keys.rewind = false;
    });

    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.keys.attack = true;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.keys.attack = false;
      }
    });
  }

  public takeDamage(amount: number): void {
    if (this.isDead) return;
    this.health = Math.max(0, this.health - amount);
    this.timeSinceLastDamage = 0;
    sound.playPlayerDamage();

    if (this.health <= 0) {
      this.isDead = true;
    }
  }

  public triggerAttack(): boolean {
    if (this.attackCooldown > 0 || !this.hasDevice) return false;

    this.attackCooldown = 0.5; // Cooldown 0.5s
    this.isAttacking = true;
    sound.playPulseAttack();

    if (this.attackPulseMesh) {
      this.attackPulseMesh.visible = true;
      this.attackPulseTime = 0.25;
    }
    return true;
  }

  public update(
    delta: number,
    yaw: number,
    pitch: number,
    colliders: THREE.Box3[],
    time: number
  ): PlayerFrame {
    this.rotationY = yaw;
    this.pitch = pitch;

    if (this.attackCooldown > 0) {
      this.attackCooldown -= delta;
      if (this.attackCooldown <= 0.3) {
        this.isAttacking = false;
      }
    }

    // Health passive regeneration after 4 seconds
    this.timeSinceLastDamage += delta;
    if (this.timeSinceLastDamage > 4.0 && this.health < this.maxHealth && !this.isDead) {
      this.health = Math.min(this.maxHealth, this.health + delta * 6);
    }

    // Movement calculation
    this.isSprinting = this.keys.sprint;
    const moveSpeed = this.isSprinting ? 7.2 : 4.4;

    const moveVector = new THREE.Vector3();
    if (this.keys.forward) moveVector.z -= 1;
    if (this.keys.backward) moveVector.z += 1;
    if (this.keys.left) moveVector.x -= 1;
    if (this.keys.right) moveVector.x += 1;

    const isMoving = moveVector.lengthSq() > 0.001;
    if (isMoving) {
      moveVector.normalize();
      moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotationY);
      moveVector.multiplyScalar(moveSpeed);

      // Footstep sound trigger
      const stepDistance = (this.isSprinting ? 2.4 : 1.7);
      this.distanceSinceLastFootstep += moveSpeed * delta;
      if (this.distanceSinceLastFootstep >= stepDistance && this.isGrounded) {
        sound.playFootstep(this.isSprinting);
        this.distanceSinceLastFootstep = 0;
      }
    } else {
      this.distanceSinceLastFootstep = 0;
    }

    // Horizontal acceleration & damping
    const targetVelX = moveVector.x;
    const targetVelZ = moveVector.z;
    this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, targetVelX, delta * 14);
    this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, targetVelZ, delta * 14);

    // Gravity & Jump
    const gravity = -18.0;
    if (!this.isGrounded) {
      this.velocity.y += gravity * delta;
    }

    if (this.keys.jump && this.isGrounded) {
      this.velocity.y = 6.2;
      this.isGrounded = false;
      sound.playJump();
    }

    // Handle Attack input
    if (this.keys.attack) {
      this.triggerAttack();
    }

    // Update attack visual mesh
    if (this.attackPulseMesh && this.attackPulseTime > 0) {
      this.attackPulseTime -= delta;
      const progress = 1 - (this.attackPulseTime / 0.25);
      const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotationY);
      const pulsePos = this.position.clone().add(forward.clone().multiplyScalar(1.2 + progress * 2.5));
      pulsePos.y = this.position.y - 0.2;
      this.attackPulseMesh.position.copy(pulsePos);
      this.attackPulseMesh.rotation.y = this.rotationY;
      const scale = 1 + progress * 2.2;
      this.attackPulseMesh.scale.set(scale, scale, scale);
      (this.attackPulseMesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - progress);
      if (this.attackPulseTime <= 0) {
        this.attackPulseMesh.visible = false;
      }
    }

    // Resolve collision step by step
    this.resolveCollisions(delta, colliders);

    return {
      timestamp: time,
      x: this.position.x,
      y: this.position.y,
      z: this.position.z,
      rotationY: this.rotationY,
      pitch: this.pitch,
      isSprinting: this.isSprinting,
      isAttacking: this.isAttacking,
      isInteracting: this.keys.interact,
      isGrounded: this.isGrounded,
    };
  }

  private resolveCollisions(delta: number, colliders: THREE.Box3[]): void {
    // 1. Move X and resolve X collisions
    const nextX = this.position.x + this.velocity.x * delta;
    const playerBoxX = new THREE.Box3(
      new THREE.Vector3(nextX - this.radius, this.position.y - 1.4, this.position.z - this.radius),
      new THREE.Vector3(nextX + this.radius, this.position.y + 0.2, this.position.z + this.radius)
    );

    let hitX = false;
    for (const box of colliders) {
      if (playerBoxX.intersectsBox(box)) {
        hitX = true;
        this.velocity.x = 0;
        break;
      }
    }
    if (!hitX) {
      this.position.x = nextX;
    }

    // 2. Move Z and resolve Z collisions
    const nextZ = this.position.z + this.velocity.z * delta;
    const playerBoxZ = new THREE.Box3(
      new THREE.Vector3(this.position.x - this.radius, this.position.y - 1.4, nextZ - this.radius),
      new THREE.Vector3(this.position.x + this.radius, this.position.y + 0.2, nextZ + this.radius)
    );

    let hitZ = false;
    for (const box of colliders) {
      if (playerBoxZ.intersectsBox(box)) {
        hitZ = true;
        this.velocity.z = 0;
        break;
      }
    }
    if (!hitZ) {
      this.position.z = nextZ;
    }

    // 3. Move Y (vertical) and resolve ground / ceiling
    const nextY = this.position.y + this.velocity.y * delta;
    const playerBoxY = new THREE.Box3(
      new THREE.Vector3(this.position.x - this.radius * 0.8, nextY - 1.5, this.position.z - this.radius * 0.8),
      new THREE.Vector3(this.position.x + this.radius * 0.8, nextY + 0.1, this.position.z + this.radius * 0.8)
    );

    let hitY = false;
    for (const box of colliders) {
      if (playerBoxY.intersectsBox(box)) {
        hitY = true;
        if (this.velocity.y < 0) {
          // Landing on floor
          this.position.y = box.max.y + 1.5;
          this.velocity.y = 0;
          this.isGrounded = true;
        } else if (this.velocity.y > 0) {
          // Hit ceiling
          this.position.y = box.min.y - 0.2;
          this.velocity.y = 0;
        }
        break;
      }
    }

    if (!hitY) {
      this.position.y = nextY;
      // If falling below ground plane
      if (this.position.y <= 1.6) {
        this.position.y = 1.6;
        this.velocity.y = 0;
        this.isGrounded = true;
      } else {
        this.isGrounded = false;
      }
    }
  }

  public teleport(x: number, y: number, z: number, yaw?: number): void {
    this.position.set(x, y, z);
    this.velocity.set(0, 0, 0);
    if (yaw !== undefined) {
      this.rotationY = yaw;
    }
  }

  public reset(hp: number = 100): void {
    this.health = hp;
    this.isDead = false;
    this.velocity.set(0, 0, 0);
    this.attackCooldown = 0;
  }
}
