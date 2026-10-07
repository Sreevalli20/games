import * as THREE from 'three';

export class FirstPersonCamera {
  public camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;
  public yaw: number = 0;
  public pitch: number = 0;
  public sensitivity: number = 0.0022;
  public isLocked: boolean = false;

  // Head bobbing & camera effects
  private bobTimer: number = 0;
  public bobOffset: THREE.Vector3 = new THREE.Vector3();
  private shakeIntensity: number = 0;
  private shakeDecay: number = 5.0;
  private baseFov: number = 75;
  private targetFov: number = 75;

  constructor(domElement: HTMLElement) {
    this.domElement = domElement;
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
    this.camera.rotation.order = 'YXZ';

    this.setupPointerLock();
  }

  private lastLockAttemptTime: number = 0;

  private setupPointerLock(): void {
    const onMouseMove = (event: MouseEvent) => {
      if (!this.isLocked) return;

      const movementX = event.movementX || 0;
      const movementY = event.movementY || 0;

      this.yaw -= movementX * this.sensitivity;
      this.pitch -= movementY * this.sensitivity;

      // Clamp pitch to prevent somersaults (-85 to +85 degrees)
      const maxPitch = (Math.PI / 2) - 0.05;
      this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
    };

    const onPointerLockChange = () => {
      this.isLocked = document.pointerLockElement === this.domElement;
    };

    const onPointerLockError = () => {
      // Browser rejected pointer lock (e.g. gesture required or throttled)
      this.isLocked = false;
    };

    document.addEventListener('mousemove', onMouseMove, false);
    document.addEventListener('pointerlockchange', onPointerLockChange, false);
    document.addEventListener('pointerlockerror', onPointerLockError, false);
  }

  public requestLock(): void {
    if (!this.domElement || document.pointerLockElement === this.domElement) {
      return;
    }

    // Require an active user activation (user gesture) before attempting Pointer Lock
    if (typeof navigator !== 'undefined' && 'userActivation' in navigator) {
      const activation = (navigator as unknown as { userActivation?: { isActive: boolean } }).userActivation;
      if (activation && !activation.isActive) {
        return;
      }
    }

    const now = performance.now();
    // Throttle to at most one request every 1.5 seconds to satisfy browser rate limits
    if (now - this.lastLockAttemptTime < 1500) {
      return;
    }
    this.lastLockAttemptTime = now;

    try {
      const res = this.domElement.requestPointerLock() as unknown;
      if (res && typeof (res as Promise<void>).catch === 'function') {
        (res as Promise<void>).catch(() => {
          // Gracefully handled without logging errors
        });
      }
    } catch {
      // Gracefully handled for browsers that throw synchronously
    }
  }

  public unlock(): void {
    if (document.exitPointerLock && this.isLocked) {
      document.exitPointerLock();
    }
  }

  public addShake(intensity: number): void {
    this.shakeIntensity = Math.min(this.shakeIntensity + intensity, 0.45);
  }

  public setFovOffset(offset: number): void {
    this.targetFov = this.baseFov + offset;
  }

  public update(
    position: THREE.Vector3,
    delta: number,
    isMoving: boolean,
    isSprinting: boolean
  ): void {
    // Smooth FOV transitions
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, this.targetFov, delta * 8);
    this.camera.updateProjectionMatrix();

    // Head bobbing calculation
    if (isMoving) {
      const bobSpeed = isSprinting ? 14 : 9;
      const bobAmountY = isSprinting ? 0.07 : 0.04;
      const bobAmountX = isSprinting ? 0.04 : 0.02;

      this.bobTimer += delta * bobSpeed;
      this.bobOffset.set(
        Math.cos(this.bobTimer * 0.5) * bobAmountX,
        Math.sin(this.bobTimer) * bobAmountY,
        0
      );
    } else {
      this.bobOffset.lerp(new THREE.Vector3(0, 0, 0), delta * 8);
    }

    // Camera shake calculation
    const shakeVector = new THREE.Vector3();
    if (this.shakeIntensity > 0.001) {
      shakeVector.set(
        (Math.random() - 0.5) * this.shakeIntensity,
        (Math.random() - 0.5) * this.shakeIntensity,
        (Math.random() - 0.5) * this.shakeIntensity
      );
      this.shakeIntensity = Math.max(0, this.shakeIntensity - delta * this.shakeDecay);
    }

    // Update Camera Transform
    this.camera.position.copy(position).add(this.bobOffset).add(shakeVector);
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }

  public handleResize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  public setRotation(yaw: number, pitch: number = 0): void {
    this.yaw = yaw;
    this.pitch = pitch;
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }
}
