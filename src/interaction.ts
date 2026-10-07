import * as THREE from 'three';
import { sound } from './audio';

export interface Interactable {
  id: string;
  name: string;
  prompt: string;
  mesh: THREE.Object3D;
  interact: () => void;
  setHighlighted?: (highlighted: boolean) => void;
  canInteract?: () => boolean;
}

/**
 * A physical 3D button switch that can be activated and deactivated
 * with physical depression animation, light emissive state changes, and sound.
 */
export class PressableButton implements Interactable {
  public id: string;
  public name: string;
  public prompt: string;
  public group: THREE.Group;
  public buttonCapMesh: THREE.Mesh;
  public baseMesh: THREE.Mesh;
  public isActive: boolean = false;

  private activeColor: number = 0x00ff88;
  private inactiveColor: number = 0x00f0ff;
  private capMaterial: THREE.MeshStandardMaterial;

  public onToggle?: (isActive: boolean) => void;
  public onActivate?: () => void;
  public onDeactivate?: () => void;

  private isAutoReset: boolean = false;
  private resetDelay: number = 3.5;
  private resetTimer: number = 0;

  constructor(
    id: string,
    name: string,
    position: THREE.Vector3,
    prompt: string = 'PRESS BUTTON',
    autoReset: boolean = false,
    resetDelay: number = 3.5
  ) {
    this.id = id;
    this.name = name;
    this.prompt = prompt;
    this.isAutoReset = autoReset;
    this.resetDelay = resetDelay;

    this.group = new THREE.Group();
    this.group.position.copy(position);

    // Button Base Mounting Plate
    const baseGeom = new THREE.BoxGeometry(0.5, 0.5, 0.15);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.5,
      metalness: 0.8,
    });
    this.baseMesh = new THREE.Mesh(baseGeom, baseMat);
    this.group.add(this.baseMesh);

    // Movable Button Cap
    const capGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.12, 16);
    this.capMaterial = new THREE.MeshStandardMaterial({
      color: this.inactiveColor,
      emissive: this.inactiveColor,
      emissiveIntensity: 1.2,
      roughness: 0.2,
      metalness: 0.8,
    });
    this.buttonCapMesh = new THREE.Mesh(capGeom, this.capMaterial);
    this.buttonCapMesh.rotation.x = Math.PI / 2;
    this.buttonCapMesh.position.z = 0.08;
    this.group.add(this.buttonCapMesh);

    // Store reference on root mesh for raycasting
    this.buttonCapMesh.userData.interactable = this;
    this.baseMesh.userData.interactable = this;
  }

  get mesh(): THREE.Object3D {
    return this.buttonCapMesh;
  }

  public activate(): void {
    if (this.isActive) return;
    this.isActive = true;
    this.capMaterial.color.setHex(this.activeColor);
    this.capMaterial.emissive.setHex(this.activeColor);
    this.buttonCapMesh.position.z = 0.02; // Physically depressed
    sound.playButtonSwitch();

    if (this.isAutoReset) {
      this.resetTimer = this.resetDelay;
    }

    if (this.onActivate) this.onActivate();
    if (this.onToggle) this.onToggle(true);
  }

  public deactivate(): void {
    if (!this.isActive) return;
    this.isActive = false;
    this.capMaterial.color.setHex(this.inactiveColor);
    this.capMaterial.emissive.setHex(this.inactiveColor);
    this.buttonCapMesh.position.z = 0.08; // Released position
    sound.playButtonSwitch();

    if (this.onDeactivate) this.onDeactivate();
    if (this.onToggle) this.onToggle(false);
  }

  public toggle(): void {
    if (this.isActive) {
      this.deactivate();
    } else {
      this.activate();
    }
  }

  public interact(): void {
    if (this.isAutoReset) {
      this.activate();
    } else {
      this.toggle();
    }
  }

  public setHighlighted(highlighted: boolean): void {
    this.capMaterial.emissiveIntensity = highlighted ? 2.2 : 1.2;
  }

  public update(delta: number): void {
    if (this.isAutoReset && this.isActive) {
      this.resetTimer -= delta;
      if (this.resetTimer <= 0) {
        this.deactivate();
      }
    }
  }
}

/**
 * Camera Raycast Interaction System.
 * Casts a ray from the camera center to find interactable objects in player crosshair.
 */
export class InteractionSystem {
  private raycaster: THREE.Raycaster;
  private camera: THREE.Camera;
  private interactables: Interactable[] = [];
  public currentTarget: Interactable | null = null;
  public maxDistance: number = 3.5; // Max raycast interaction distance

  constructor(camera: THREE.Camera) {
    this.camera = camera;
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = this.maxDistance;
  }

  public register(interactable: Interactable): void {
    if (!this.interactables.includes(interactable)) {
      this.interactables.push(interactable);
    }
  }

  public unregister(id: string): void {
    this.interactables = this.interactables.filter((item) => item.id !== id);
  }

  public update(): Interactable | null {
    // Cast ray from screen center (0, 0)
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);

    const targetMeshes: THREE.Object3D[] = [];
    for (const item of this.interactables) {
      if (item.canInteract && !item.canInteract()) continue;
      targetMeshes.push(item.mesh);
      if (item instanceof PressableButton) {
        targetMeshes.push(item.baseMesh);
      }
    }

    const intersects = this.raycaster.intersectObjects(targetMeshes, true);

    let hitInteractable: Interactable | null = null;

    if (intersects.length > 0) {
      const firstHit = intersects[0];
      if (firstHit.distance <= this.maxDistance) {
        let current: THREE.Object3D | null = firstHit.object;
        while (current) {
          if (current.userData && current.userData.interactable) {
            hitInteractable = current.userData.interactable as Interactable;
            break;
          }
          current = current.parent;
        }

        // If not found in userData, search direct reference
        if (!hitInteractable) {
          hitInteractable = this.interactables.find(
            (item) => item.mesh === firstHit.object || item.mesh.children.includes(firstHit.object)
          ) || null;
        }
      }
    }

    // Update highlight states
    if (this.currentTarget !== hitInteractable) {
      if (this.currentTarget && this.currentTarget.setHighlighted) {
        this.currentTarget.setHighlighted(false);
      }
      this.currentTarget = hitInteractable;
      if (this.currentTarget && this.currentTarget.setHighlighted) {
        this.currentTarget.setHighlighted(true);
      }
    }

    return this.currentTarget;
  }

  public triggerInteract(): boolean {
    if (this.currentTarget) {
      this.currentTarget.interact();
      return true;
    }
    return false;
  }
}
