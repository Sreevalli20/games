import * as THREE from 'three';
import { sound } from './audio';
import { PlayerFrame } from './types';

export class EchoEntity {
  public id: string;
  public group: THREE.Group;
  private frames: PlayerFrame[];
  private currentFrameIndex: number = 0;
  private startTime: number = 0;
  private duration: number = 0;
  public isCompleted: boolean = false;

  // Visual meshes
  private materials: THREE.Material[] = [];
  private pulseMesh: THREE.Mesh | null = null;
  private trailLine: THREE.Line | null = null;
  private headMesh: THREE.Mesh;
  private bodyMesh: THREE.Mesh;
  private leftArm: THREE.Mesh;
  private rightArm: THREE.Mesh;

  public currentPosition: THREE.Vector3 = new THREE.Vector3();
  public currentRotationY: number = 0;
  public isAttacking: boolean = false;
  public isInteracting: boolean = false;
  public isSprinting: boolean = false;

  constructor(scene: THREE.Scene, recordedFrames: PlayerFrame[], id: string) {
    this.id = id;
    this.frames = [...recordedFrames];
    this.group = new THREE.Group();

    if (this.frames.length > 0) {
      this.startTime = this.frames[0].timestamp;
      this.duration = this.frames[this.frames.length - 1].timestamp - this.startTime;
      this.currentPosition.set(this.frames[0].x, this.frames[0].y, this.frames[0].z);
      this.currentRotationY = this.frames[0].rotationY;
    }

    // Create Holographic Humanoid Body
    const cyanHoloMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00d8ff,
      emissiveIntensity: 0.65,
      transparent: true,
      opacity: 0.55,
      roughness: 0.2,
      metalness: 0.8,
      wireframe: false,
    });
    this.materials.push(cyanHoloMat);

    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    this.materials.push(wireMat);

    // Head
    const headGeom = new THREE.BoxGeometry(0.3, 0.32, 0.32);
    this.headMesh = new THREE.Mesh(headGeom, cyanHoloMat);
    this.headMesh.position.y = 0.55;
    this.group.add(this.headMesh);

    // Visor glow
    const visorGeom = new THREE.BoxGeometry(0.24, 0.08, 0.1);
    const visorMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
    const visor = new THREE.Mesh(visorGeom, visorMat);
    visor.position.set(0, 0.56, -0.16);
    this.group.add(visor);

    // Torso
    const bodyGeom = new THREE.BoxGeometry(0.48, 0.65, 0.3);
    this.bodyMesh = new THREE.Mesh(bodyGeom, cyanHoloMat);
    this.bodyMesh.position.y = 0;
    this.group.add(this.bodyMesh);

    // Inner wireframe core
    const coreGeom = new THREE.OctahedronGeometry(0.2, 0);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      wireframe: true,
      transparent: true,
      opacity: 0.8,
    });
    const core = new THREE.Mesh(coreGeom, coreMat);
    core.position.y = 0.05;
    this.group.add(core);

    // Arms
    const armGeom = new THREE.BoxGeometry(0.14, 0.6, 0.14);
    this.leftArm = new THREE.Mesh(armGeom, cyanHoloMat);
    this.leftArm.position.set(-0.35, 0, 0);
    this.group.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeom, cyanHoloMat);
    this.rightArm.position.set(0.35, 0, 0);
    this.group.add(this.rightArm);

    // Legs
    const legGeom = new THREE.BoxGeometry(0.18, 0.7, 0.18);
    const leftLeg = new THREE.Mesh(legGeom, cyanHoloMat);
    leftLeg.position.set(-0.16, -0.65, 0);
    this.group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeom, cyanHoloMat);
    rightLeg.position.set(0.16, -0.65, 0);
    this.group.add(rightLeg);

    // Attack Pulse effect mesh for Echo
    const pulseGeom = new THREE.RingGeometry(0.3, 1.2, 16);
    const pulseMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    this.pulseMesh = new THREE.Mesh(pulseGeom, pulseMat);
    this.pulseMesh.visible = false;
    scene.add(this.pulseMesh);

    // Temporal Trail Line
    if (this.frames.length > 2) {
      const trailPoints: THREE.Vector3[] = [];
      const step = Math.max(1, Math.floor(this.frames.length / 30));
      for (let i = 0; i < this.frames.length; i += step) {
        trailPoints.push(new THREE.Vector3(this.frames[i].x, this.frames[i].y - 0.7, this.frames[i].z));
      }
      const trailGeom = new THREE.BufferGeometry().setFromPoints(trailPoints);
      const trailMat = new THREE.LineBasicMaterial({
        color: 0x00d8ff,
        transparent: true,
        opacity: 0.4,
      });
      this.trailLine = new THREE.Line(trailGeom, trailMat);
      scene.add(this.trailLine);
    }

    this.group.position.copy(this.currentPosition);
    scene.add(this.group);
  }

  public update(playbackElapsedTime: number, delta: number): void {
    if (this.isCompleted || this.frames.length === 0) return;

    if (playbackElapsedTime >= this.duration) {
      this.isCompleted = true;
      this.fadeOut();
      return;
    }

    // Interpolate along recorded timeline
    const targetTimestamp = this.startTime + playbackElapsedTime;

    while (
      this.currentFrameIndex < this.frames.length - 1 &&
      this.frames[this.currentFrameIndex + 1].timestamp <= targetTimestamp
    ) {
      this.currentFrameIndex++;
    }

    const frameA = this.frames[this.currentFrameIndex];
    const frameB = this.frames[Math.min(this.frames.length - 1, this.currentFrameIndex + 1)];

    let alpha = 0;
    const timeDiff = frameB.timestamp - frameA.timestamp;
    if (timeDiff > 0.0001) {
      alpha = Math.max(0, Math.min(1, (targetTimestamp - frameA.timestamp) / timeDiff));
    }

    // Interpolate position
    this.currentPosition.set(
      THREE.MathUtils.lerp(frameA.x, frameB.x, alpha),
      THREE.MathUtils.lerp(frameA.y, frameB.y, alpha) - 0.8, // Center offset
      THREE.MathUtils.lerp(frameA.z, frameB.z, alpha)
    );

    // Interpolate yaw
    this.currentRotationY = THREE.MathUtils.lerp(frameA.rotationY, frameB.rotationY, alpha);

    this.group.position.copy(this.currentPosition);
    this.group.rotation.y = this.currentRotationY;

    // States
    this.isAttacking = frameA.isAttacking || frameB.isAttacking;
    this.isInteracting = frameA.isInteracting || frameB.isInteracting;
    this.isSprinting = frameA.isSprinting;

    // Subtle limb bobbing during movement
    const isMoving = Math.abs(frameB.x - frameA.x) > 0.01 || Math.abs(frameB.z - frameA.z) > 0.01;
    if (isMoving) {
      const armSwing = Math.sin(playbackElapsedTime * 10) * 0.4;
      this.leftArm.rotation.x = armSwing;
      this.rightArm.rotation.x = -armSwing;
    } else {
      this.leftArm.rotation.x = 0;
      this.rightArm.rotation.x = 0;
    }

    // Echo attack recreation
    if (this.isAttacking && this.pulseMesh) {
      this.pulseMesh.visible = true;
      const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.currentRotationY);
      this.pulseMesh.position.copy(this.currentPosition).add(forward.clone().multiplyScalar(1.2));
      this.pulseMesh.rotation.y = this.currentRotationY;
      (this.pulseMesh.material as THREE.MeshBasicMaterial).opacity = 0.8;
    } else if (this.pulseMesh && this.pulseMesh.visible) {
      const mat = this.pulseMesh.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, mat.opacity - delta * 4);
      if (mat.opacity <= 0.01) {
        this.pulseMesh.visible = false;
      }
    }
  }

  private fadeOut(): void {
    this.materials.forEach((m) => {
      if ('opacity' in m) {
        (m as { opacity: number }).opacity = 0;
      }
    });
    this.group.visible = false;
    if (this.pulseMesh) this.pulseMesh.visible = false;
    if (this.trailLine) this.trailLine.visible = false;
  }

  public destroy(scene: THREE.Scene): void {
    scene.remove(this.group);
    if (this.pulseMesh) scene.remove(this.pulseMesh);
    if (this.trailLine) scene.remove(this.trailLine);
  }
}
