import * as THREE from 'three';
import { PressableButton } from './interaction';

export interface InteractiveObject {
  id: string;
  type: 'DEVICE_PICKUP' | 'SWITCH_GATE' | 'VALVE_DRAIN' | 'REACTOR_A' | 'REACTOR_B' | 'MIRA_RECONNECT';
  position: THREE.Vector3;
  radius: number;
  prompt: string;
  mesh: THREE.Object3D;
  indicatorMesh?: THREE.Mesh;
}

export class MetroWorld {
  public scene: THREE.Scene;
  public colliders: THREE.Box3[] = [];
  public interactives: InteractiveObject[] = [];
  public buttons: PressableButton[] = [];

  // Dynamic meshes for animations and puzzles
  public securityDoorMesh: THREE.Group = new THREE.Group();
  public securityDoorOpenAmount: number = 0; // 0 (closed) to 1 (open)

  public canalWaterMesh: THREE.Mesh | null = null;
  public canalWaterLevel: number = 0; // 0 is drained, 1 is flooded

  public retractableBridgeMesh: THREE.Mesh | null = null;
  public bridgeExtensionAmount: number = 0; // 0 to 1

  public reactorCoreMesh: THREE.Mesh | null = null;
  public reactorDoorMesh: THREE.Group = new THREE.Group();
  public reactorDoorOpenAmount: number = 0;

  public temporalBridgeMesh: THREE.Mesh | null = null;
  public finalBridgeFormed: number = 0;

  public miraSilhouetteMesh: THREE.Group = new THREE.Group();

  // Animated lights & particles
  private flickeringLights: THREE.PointLight[] = [];
  private ambientParticles: THREE.Points | null = null;
  private particlePositions: Float32Array | null = null;

  // Phantom train
  public phantomTrain: THREE.Group = new THREE.Group();
  public phantomTrainActive: boolean = false;
  public phantomTrainZ: number = -60;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.buildLightingAndFog();
    this.buildArrivalPlatform();
    this.buildMaintenanceCorridor();
    this.buildFloodedTunnel();
    this.buildReactorChamber();
    this.buildFinalTimelineChamber();
    this.setupAtmosphericParticles();
    this.setupPhantomTrain();
  }

  private buildLightingAndFog(): void {
    // Metro atmospheric deep blue fog
    this.scene.background = new THREE.Color(0x040810);
    this.scene.fog = new THREE.FogExp2(0x050a14, 0.024);

    // Ambient light - low, cool
    const ambLight = new THREE.AmbientLight(0x0c1e30, 0.85);
    this.scene.add(ambLight);

    // Directional rim light from broken ceiling grates
    const moonDir = new THREE.DirectionalLight(0x1a456b, 0.45);
    moonDir.position.set(10, 30, -20);
    this.scene.add(moonDir);
  }

  private addBoxCollider(min: THREE.Vector3, max: THREE.Vector3): void {
    this.colliders.push(new THREE.Box3(min, max));
  }

  private buildArrivalPlatform(): void {
    // Area 1: Platform [X: -10 to 10, Z: -20 to 10]
    const concreteMat = new THREE.MeshStandardMaterial({
      color: 0x1b222a,
      roughness: 0.85,
      metalness: 0.1,
    });

    const tileFloorMat = new THREE.MeshStandardMaterial({
      color: 0x141a22,
      roughness: 0.7,
      metalness: 0.2,
    });

    const yellowWarningMat = new THREE.MeshStandardMaterial({
      color: 0xd4a017,
      roughness: 0.6,
      emissive: 0x3d2c00,
      emissiveIntensity: 0.2,
    });

    // Floor Platform
    const platformFloorGeom = new THREE.BoxGeometry(16, 1, 30);
    const platformFloor = new THREE.Mesh(platformFloorGeom, tileFloorMat);
    platformFloor.position.set(0, -0.5, -5);
    this.scene.add(platformFloor);
    this.addBoxCollider(new THREE.Vector3(-8, -1, -20), new THREE.Vector3(8, 0, 10));

    // Platform edge safety strip
    const safetyStripGeom = new THREE.BoxGeometry(0.6, 1.02, 30);
    const safetyStrip = new THREE.Mesh(safetyStripGeom, yellowWarningMat);
    safetyStrip.position.set(-7.7, -0.5, -5);
    this.scene.add(safetyStrip);

    // Train Track Depression [X: -16 to -8]
    const trackFloorGeom = new THREE.BoxGeometry(10, 1, 30);
    const trackFloor = new THREE.Mesh(trackFloorGeom, concreteMat);
    trackFloor.position.set(-13, -2.5, -5);
    this.scene.add(trackFloor);
    this.addBoxCollider(new THREE.Vector3(-18, -3, -20), new THREE.Vector3(-8, -1.8, 10));

    // Steel Rails
    const railMat = new THREE.MeshStandardMaterial({ color: 0x5a6572, roughness: 0.3, metalness: 0.85 });
    for (const rx of [-11, -15]) {
      const railGeom = new THREE.BoxGeometry(0.3, 0.4, 30);
      const rail = new THREE.Mesh(railGeom, railMat);
      rail.position.set(rx, -1.8, -5);
      this.scene.add(rail);
    }

    // Platform Back Wall [X: 8]
    const wallGeom = new THREE.BoxGeometry(1, 8, 30);
    const backWall = new THREE.Mesh(wallGeom, concreteMat);
    backWall.position.set(8.5, 3, -5);
    this.scene.add(backWall);
    this.addBoxCollider(new THREE.Vector3(8, 0, -20), new THREE.Vector3(9, 7, 10));

    // Outer Track Wall [X: -18]
    const outerWallGeom = new THREE.BoxGeometry(1, 10, 30);
    const outerWall = new THREE.Mesh(outerWallGeom, concreteMat);
    outerWall.position.set(-18.5, 2, -5);
    this.scene.add(outerWall);
    this.addBoxCollider(new THREE.Vector3(-19, -2, -20), new THREE.Vector3(-18, 7, 10));

    // Ceiling [Y: 7]
    const ceilGeom = new THREE.BoxGeometry(30, 1, 30);
    const ceiling = new THREE.Mesh(ceilGeom, concreteMat);
    ceiling.position.set(-5, 7.5, -5);
    this.scene.add(ceiling);
    this.addBoxCollider(new THREE.Vector3(-20, 7, -20), new THREE.Vector3(10, 8, 10));

    // South End Wall [Z: 10]
    const southWallGeom = new THREE.BoxGeometry(28, 8, 1);
    const southWall = new THREE.Mesh(southWallGeom, concreteMat);
    southWall.position.set(-5, 3, 10.5);
    this.scene.add(southWall);
    this.addBoxCollider(new THREE.Vector3(-19, 0, 10), new THREE.Vector3(9, 7, 11));

    // Platform Pillars
    const pillarGeom = new THREE.BoxGeometry(0.9, 7, 0.9);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x25303d, roughness: 0.5, metalness: 0.4 });
    for (const pz of [-15, -5, 5]) {
      const pillar = new THREE.Mesh(pillarGeom, pillarMat);
      pillar.position.set(2, 3.5, pz);
      this.scene.add(pillar);
      this.addBoxCollider(new THREE.Vector3(1.5, 0, pz - 0.5), new THREE.Vector3(2.5, 7, pz + 0.5));
    }

    // Overhead Departure Sign
    const signGeom = new THREE.BoxGeometry(5, 1.2, 0.4);
    const signMat = new THREE.MeshStandardMaterial({
      color: 0x07111a,
      emissive: 0x00334d,
      emissiveIntensity: 0.8,
    });
    const sign = new THREE.Mesh(signGeom, signMat);
    sign.position.set(2, 5.8, -2);
    this.scene.add(sign);

    // Glowing Neon Lamp Strips
    const lampGeom = new THREE.BoxGeometry(0.3, 0.15, 6);
    const lampMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 1.5,
    });
    const lamp = new THREE.Mesh(lampGeom, lampMat);
    lamp.position.set(2, 6.8, -5);
    this.scene.add(lamp);

    const platformPointLight = new THREE.PointLight(0x00d8ff, 1.8, 18);
    platformPointLight.position.set(2, 6.2, -5);
    this.scene.add(platformPointLight);
    this.flickeringLights.push(platformPointLight);

    // Resonance Device Pedestal at [X: 0, Z: -12]
    const pedestalGeom = new THREE.CylinderGeometry(0.45, 0.55, 1.0, 8);
    const pedestalMat = new THREE.MeshStandardMaterial({ color: 0x1f2b38, roughness: 0.3, metalness: 0.7 });
    const pedestal = new THREE.Mesh(pedestalGeom, pedestalMat);
    pedestal.position.set(0, 0.5, -12);
    this.scene.add(pedestal);
    this.addBoxCollider(new THREE.Vector3(-0.5, 0, -12.5), new THREE.Vector3(0.5, 1.2, -11.5));

    // Floating Resonance Device Mesh
    const deviceCoreGeom = new THREE.OctahedronGeometry(0.28, 0);
    const deviceMat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00e5ff,
      emissiveIntensity: 1.8,
      roughness: 0.1,
    });
    const deviceMesh = new THREE.Mesh(deviceCoreGeom, deviceMat);
    deviceMesh.position.set(0, 1.35, -12);
    this.scene.add(deviceMesh);

    // Platform Diagnostic PressableButton at [X: 1.5, Y: 1.4, Z: -5.0] on pillar
    const diagButton = new PressableButton(
      'diag_button_platform',
      'Platform Test Switch',
      new THREE.Vector3(1.5, 1.4, -5.0),
      'TOGGLE PLATFORM LIGHTS',
      false
    );
    diagButton.group.rotation.y = -Math.PI / 2;
    this.scene.add(diagButton.group);
    this.buttons.push(diagButton);

    // Interactive pickup
    this.interactives.push({
      id: 'device_pickup',
      type: 'DEVICE_PICKUP',
      position: new THREE.Vector3(0, 1.35, -12),
      radius: 2.2,
      prompt: 'TAKE RESONANCE DEVICE',
      mesh: deviceMesh,
    });
  }

  private setupPhantomTrain(): void {
    // Phantom train running along tracks at [X: -13]
    const trainBodyGeom = new THREE.BoxGeometry(3.6, 3.8, 24);
    const trainMat = new THREE.MeshStandardMaterial({
      color: 0x041824,
      emissive: 0x005577,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.45,
    });
    const trainBody = new THREE.Mesh(trainBodyGeom, trainMat);
    this.phantomTrain.add(trainBody);

    // Train Windows glow
    const winGeom = new THREE.BoxGeometry(3.65, 1.0, 20);
    const winMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.65,
    });
    const win = new THREE.Mesh(winGeom, winMat);
    win.position.y = 0.4;
    this.phantomTrain.add(win);

    // Front Headlight
    const light = new THREE.SpotLight(0x00f0ff, 4.0, 40, Math.PI / 4, 0.5);
    light.position.set(0, 0, 12);
    light.target.position.set(0, 0, 30);
    this.phantomTrain.add(light);
    this.phantomTrain.add(light.target);

    this.phantomTrain.position.set(-13, 0.4, -60);
    this.scene.add(this.phantomTrain);
  }

  private buildMaintenanceCorridor(): void {
    // Area 2: Corridor from Z: -20 to -50, X: -2 to 4
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x1e242c, roughness: 0.6, metalness: 0.5 });
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0x886a10, roughness: 0.7 });

    // Corridor Floor
    const floorGeom = new THREE.BoxGeometry(6, 1, 30);
    const floor = new THREE.Mesh(floorGeom, metalMat);
    floor.position.set(1, -0.5, -35);
    this.scene.add(floor);
    this.addBoxCollider(new THREE.Vector3(-2, -1, -50), new THREE.Vector3(4, 0, -20));

    // Left Corridor Wall [X: -2]
    const leftWallGeom = new THREE.BoxGeometry(1, 6, 30);
    const leftWall = new THREE.Mesh(leftWallGeom, metalMat);
    leftWall.position.set(-2.5, 2.5, -35);
    this.scene.add(leftWall);
    this.addBoxCollider(new THREE.Vector3(-3, 0, -50), new THREE.Vector3(-2, 6, -20));

    // Right Corridor Wall [X: 4]
    const rightWallGeom = new THREE.BoxGeometry(1, 6, 30);
    const rightWall = new THREE.Mesh(rightWallGeom, metalMat);
    rightWall.position.set(4.5, 2.5, -35);
    this.scene.add(rightWall);
    this.addBoxCollider(new THREE.Vector3(4, 0, -50), new THREE.Vector3(5, 6, -20));

    // Ceiling [Y: 5.5]
    const ceilGeom = new THREE.BoxGeometry(8, 1, 30);
    const ceil = new THREE.Mesh(ceilGeom, metalMat);
    ceil.position.set(1, 5.5, -35);
    this.scene.add(ceil);
    this.addBoxCollider(new THREE.Vector3(-3, 5, -50), new THREE.Vector3(5, 6, -20));

    // Wall Pipes
    const pipeGeom = new THREE.CylinderGeometry(0.12, 0.12, 30, 8);
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0x3d4957, roughness: 0.4, metalness: 0.8 });
    const pipe1 = new THREE.Mesh(pipeGeom, pipeMat);
    pipe1.rotation.x = Math.PI / 2;
    pipe1.position.set(-1.8, 3.8, -35);
    this.scene.add(pipe1);

    // Fluorescent Corridor Light
    const corLight = new THREE.PointLight(0xffa834, 1.4, 14);
    corLight.position.set(1, 4.5, -32);
    this.scene.add(corLight);
    this.flickeringLights.push(corLight);

    // PUZZLE 1: SECURITY BLAST GATE at [Z: -48]
    // Door Frame
    const doorFrameGeom = new THREE.BoxGeometry(6, 5, 0.8);
    const frameMesh = new THREE.Mesh(doorFrameGeom, stripeMat);
    frameMesh.position.set(1, 2.5, -48);
    this.scene.add(frameMesh);

    // Left and Right Sliding Door Panels
    const doorPanelMat = new THREE.MeshStandardMaterial({
      color: 0x2b3846,
      roughness: 0.4,
      metalness: 0.8,
      emissive: 0x002233,
      emissiveIntensity: 0.2,
    });

    const leftPanelGeom = new THREE.BoxGeometry(2.5, 4.2, 0.4);
    const leftDoor = new THREE.Mesh(leftPanelGeom, doorPanelMat);
    leftDoor.position.set(-0.5, 2.1, -48);
    this.securityDoorMesh.add(leftDoor);

    const rightDoor = new THREE.Mesh(leftPanelGeom, doorPanelMat);
    rightDoor.position.set(2.5, 2.1, -48);
    this.securityDoorMesh.add(rightDoor);
    this.scene.add(this.securityDoorMesh);

    // Initial Gate Collider (removes or shifts when open)
    this.addBoxCollider(new THREE.Vector3(-2, 0, -48.6), new THREE.Vector3(4, 5, -47.4));

    // PUZZLE 1 SWITCH CONSOLE: Located back along the corridor at [X: 3.5, Z: -26]
    const switchBaseGeom = new THREE.BoxGeometry(0.6, 1.2, 0.6);
    const switchBase = new THREE.Mesh(switchBaseGeom, metalMat);
    switchBase.position.set(3.5, 0.6, -26);
    this.scene.add(switchBase);
    this.addBoxCollider(new THREE.Vector3(3.1, 0, -26.4), new THREE.Vector3(3.9, 1.3, -25.6));

    const gateButton = new PressableButton(
      'switch_gate_1',
      'Security Gate Override',
      new THREE.Vector3(3.18, 0.8, -26),
      'ACTIVATE GATE OVERRIDE [3.5s]',
      true,
      3.5
    );
    gateButton.group.rotation.y = -Math.PI / 2;
    this.scene.add(gateButton.group);
    this.buttons.push(gateButton);

    this.interactives.push({
      id: 'switch_gate_1',
      type: 'SWITCH_GATE',
      position: new THREE.Vector3(3.2, 0.8, -26),
      radius: 2.2,
      prompt: 'ACTIVATE GATE OVERRIDE [3.5s]',
      mesh: gateButton.buttonCapMesh,
      indicatorMesh: gateButton.buttonCapMesh,
    });
  }

  private buildFloodedTunnel(): void {
    // Area 3: Flooded Tunnel from Z: -50 to -85, X: -6 to 8
    const wetRockMat = new THREE.MeshStandardMaterial({ color: 0x141b22, roughness: 0.95 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x222a35, roughness: 0.5, metalness: 0.7 });

    // Flooded Basin Floor [Y: -3]
    const basinFloorGeom = new THREE.BoxGeometry(16, 1, 35);
    const basinFloor = new THREE.Mesh(basinFloorGeom, wetRockMat);
    basinFloor.position.set(1, -3.5, -67.5);
    this.scene.add(basinFloor);
    this.addBoxCollider(new THREE.Vector3(-7, -4, -85), new THREE.Vector3(9, -2.8, -50));

    // Tunnel Walls
    const leftWallGeom = new THREE.BoxGeometry(1, 9, 35);
    const leftWall = new THREE.Mesh(leftWallGeom, wetRockMat);
    leftWall.position.set(-6.5, 1.5, -67.5);
    this.scene.add(leftWall);
    this.addBoxCollider(new THREE.Vector3(-7, -3, -85), new THREE.Vector3(-6, 6, -50));

    const rightWallGeom = new THREE.BoxGeometry(1, 9, 35);
    const rightWall = new THREE.Mesh(rightWallGeom, wetRockMat);
    rightWall.position.set(8.5, 1.5, -67.5);
    this.scene.add(rightWall);
    this.addBoxCollider(new THREE.Vector3(8, -3, -85), new THREE.Vector3(9, 6, -50));

    // Entry Platform at [Z: -52, Y: 0]
    const entryPlatGeom = new THREE.BoxGeometry(8, 1, 4);
    const entryPlat = new THREE.Mesh(entryPlatGeom, metalMat);
    entryPlat.position.set(1, -0.5, -52);
    this.scene.add(entryPlat);
    this.addBoxCollider(new THREE.Vector3(-3, -1, -54), new THREE.Vector3(5, 0, -50));

    // Exit Platform at [Z: -83, Y: 0]
    const exitPlatGeom = new THREE.BoxGeometry(8, 1, 4);
    const exitPlat = new THREE.Mesh(exitPlatGeom, metalMat);
    exitPlat.position.set(1, -0.5, -83);
    this.scene.add(exitPlat);
    this.addBoxCollider(new THREE.Vector3(-3, -1, -85), new THREE.Vector3(5, 0, -81));

    // Electrified Flooded Water Surface [Y: -0.6 initially, lowers to -2.6 when drained]
    const waterGeom = new THREE.PlaneGeometry(14, 27);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x004566,
      emissive: 0x002233,
      emissiveIntensity: 0.6,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.75,
    });
    this.canalWaterMesh = new THREE.Mesh(waterGeom, waterMat);
    this.canalWaterMesh.rotation.x = -Math.PI / 2;
    this.canalWaterMesh.position.set(1, -0.6, -67.5);
    this.scene.add(this.canalWaterMesh);

    // Retractable High Catwalk Bridge [X: 1, Z: -67.5, spans 27m]
    const bridgeGeom = new THREE.BoxGeometry(2.8, 0.3, 27);
    const bridgeMat = new THREE.MeshStandardMaterial({
      color: 0x2e3845,
      roughness: 0.4,
      metalness: 0.8,
    });
    this.retractableBridgeMesh = new THREE.Mesh(bridgeGeom, bridgeMat);
    this.retractableBridgeMesh.position.set(1, -0.15, -67.5);
    // Initially retracted (hidden or non-walkable)
    this.retractableBridgeMesh.scale.set(0.1, 1, 1);
    this.scene.add(this.retractableBridgeMesh);

    // PUZZLE 2 DRAINAGE VALVE CONSOLE: Located on entry platform at [X: -2, Z: -52]
    const valveBaseGeom = new THREE.CylinderGeometry(0.35, 0.4, 1.1, 8);
    const valveBase = new THREE.Mesh(valveBaseGeom, metalMat);
    valveBase.position.set(-2, 0.55, -52);
    this.scene.add(valveBase);
    this.addBoxCollider(new THREE.Vector3(-2.4, 0, -52.4), new THREE.Vector3(-1.6, 1.2, -51.6));

    const wheelGeom = new THREE.TorusGeometry(0.26, 0.05, 8, 16);
    const wheelMat = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      emissive: 0xaa5500,
      emissiveIntensity: 1.0,
      metalness: 0.8,
    });
    const wheel = new THREE.Mesh(wheelGeom, wheelMat);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(-2, 1.1, -52);
    this.scene.add(wheel);

    this.interactives.push({
      id: 'valve_drain_2',
      type: 'VALVE_DRAIN',
      position: new THREE.Vector3(-2, 1.1, -52),
      radius: 2.2,
      prompt: 'ENGAGE DRAINAGE TURBINE [HOLD TO DRAIN]',
      mesh: wheel,
      indicatorMesh: wheel,
    });

    // Ambient blue water glow light
    const waterLight = new THREE.PointLight(0x0099cc, 1.6, 20);
    waterLight.position.set(1, 1.5, -67.5);
    this.scene.add(waterLight);
  }

  private buildReactorChamber(): void {
    // Area 4: Hexagonal Reactor Chamber [Z: -85 to -125, X: -16 to 18]
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x161e27, roughness: 0.7, metalness: 0.4 });
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x1a2330, roughness: 0.5, metalness: 0.5 });

    // Reactor Chamber Arena Floor
    const chamberFloorGeom = new THREE.BoxGeometry(34, 1, 40);
    const chamberFloor = new THREE.Mesh(chamberFloorGeom, floorMat);
    chamberFloor.position.set(1, -0.5, -105);
    this.scene.add(chamberFloor);
    this.addBoxCollider(new THREE.Vector3(-16, -1, -125), new THREE.Vector3(18, 0, -85));

    // Outer Boundary Walls
    // North Wall [Z: -125]
    const northWallGeom = new THREE.BoxGeometry(34, 8, 1);
    const northWall = new THREE.Mesh(northWallGeom, wallMat);
    northWall.position.set(1, 3.5, -125.5);
    this.scene.add(northWall);
    this.addBoxCollider(new THREE.Vector3(-16, 0, -126), new THREE.Vector3(18, 8, -125));

    // Left Wall [X: -16]
    const leftWallGeom = new THREE.BoxGeometry(1, 8, 40);
    const leftWall = new THREE.Mesh(leftWallGeom, wallMat);
    leftWall.position.set(-16.5, 3.5, -105);
    this.scene.add(leftWall);
    this.addBoxCollider(new THREE.Vector3(-17, 0, -125), new THREE.Vector3(-16, 8, -85));

    // Right Wall [X: 18]
    const rightWallGeom = new THREE.BoxGeometry(1, 8, 40);
    const rightWall = new THREE.Mesh(rightWallGeom, wallMat);
    rightWall.position.set(18.5, 3.5, -105);
    this.scene.add(rightWall);
    this.addBoxCollider(new THREE.Vector3(18, 0, -125), new THREE.Vector3(19, 8, -85));

    // Central Resonator Core [X: 1, Z: -105]
    const coreGeom = new THREE.CylinderGeometry(2.0, 2.4, 6.0, 12);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x0088cc,
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.9,
    });
    this.reactorCoreMesh = new THREE.Mesh(coreGeom, coreMat);
    this.reactorCoreMesh.position.set(1, 3.0, -105);
    this.scene.add(this.reactorCoreMesh);
    this.addBoxCollider(new THREE.Vector3(-1.2, 0, -107.2), new THREE.Vector3(3.2, 6, -102.8));

    // Pulsing Core Point Light
    const coreLight = new THREE.PointLight(0x00e5ff, 2.5, 26);
    coreLight.position.set(1, 4.0, -105);
    this.scene.add(coreLight);
    this.flickeringLights.push(coreLight);

    // Conductor Pylon ALPHA [X: -10, Z: -105]
    this.buildConductorPylon(-10, -105, 'reactor_alpha', 'REACTOR_A', 'OVERLOAD PYLON ALPHA');

    // Conductor Pylon BETA [X: 12, Z: -105]
    this.buildConductorPylon(12, -105, 'reactor_beta', 'REACTOR_B', 'OVERLOAD PYLON BETA');

    // Reactor Exit Blast Gate [Z: -124, X: 1]
    const gateFrameGeom = new THREE.BoxGeometry(7, 5, 0.8);
    const gateFrame = new THREE.Mesh(gateFrameGeom, wallMat);
    gateFrame.position.set(1, 2.5, -124.5);
    this.scene.add(gateFrame);

    const doorMat = new THREE.MeshStandardMaterial({ color: 0x223040, roughness: 0.5, metalness: 0.7 });
    const panelGeom = new THREE.BoxGeometry(3.0, 4.2, 0.4);
    const lPanel = new THREE.Mesh(panelGeom, doorMat);
    lPanel.position.set(-0.6, 2.1, -124.5);
    this.reactorDoorMesh.add(lPanel);

    const rPanel = new THREE.Mesh(panelGeom, doorMat);
    rPanel.position.set(2.6, 2.1, -124.5);
    this.reactorDoorMesh.add(rPanel);
    this.scene.add(this.reactorDoorMesh);

    // Collider for closed reactor door
    this.addBoxCollider(new THREE.Vector3(-2, 0, -125), new THREE.Vector3(4, 5, -124));
  }

  private buildConductorPylon(
    x: number,
    z: number,
    id: string,
    type: 'REACTOR_A' | 'REACTOR_B',
    prompt: string
  ): void {
    const pylonGeom = new THREE.BoxGeometry(1.2, 3.5, 1.2);
    const pylonMat = new THREE.MeshStandardMaterial({ color: 0x1f2733, roughness: 0.4, metalness: 0.8 });
    const pylon = new THREE.Mesh(pylonGeom, pylonMat);
    pylon.position.set(x, 1.75, z);
    this.scene.add(pylon);
    this.addBoxCollider(new THREE.Vector3(x - 0.7, 0, z - 0.7), new THREE.Vector3(x + 0.7, 4, z + 0.7));

    const sphereGeom = new THREE.SphereGeometry(0.35, 16, 16);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 1.6,
    });
    const sphere = new THREE.Mesh(sphereGeom, sphereMat);
    sphere.position.set(x, 3.8, z);
    this.scene.add(sphere);

    this.interactives.push({
      id,
      type,
      position: new THREE.Vector3(x, 1.5, z),
      radius: 2.5,
      prompt,
      mesh: sphere,
      indicatorMesh: sphere,
    });
  }

  private buildFinalTimelineChamber(): void {
    // Area 5: Final Chamber [Z: -125 to -180, X: -20 to 22]
    // Shattered station platform over a cosmic temporal abyss
    const platformMat = new THREE.MeshStandardMaterial({ color: 0x121720, roughness: 0.6, metalness: 0.6 });

    // Starting Promontory Platform [Z: -125 to -145, X: -10 to 12]
    const promontoryGeom = new THREE.BoxGeometry(22, 1, 20);
    const promontory = new THREE.Mesh(promontoryGeom, platformMat);
    promontory.position.set(1, -0.5, -135);
    this.scene.add(promontory);
    this.addBoxCollider(new THREE.Vector3(-10, -1, -145), new THREE.Vector3(12, 0, -125));

    // Left Console at [X: -7, Z: -142]
    this.buildTemporalConsole(-7, -142, 'final_console_a', 'REACTOR_A', 'STABILIZE LEFT CONDUIT');

    // Right Console at [X: 9, Z: -142]
    this.buildTemporalConsole(9, -142, 'final_console_b', 'REACTOR_B', 'STABILIZE RIGHT CONDUIT');

    // Far Reconnection Island across the rift [Z: -165 to -180, X: -6 to 8]
    const farIslandGeom = new THREE.BoxGeometry(14, 1, 15);
    const farIsland = new THREE.Mesh(farIslandGeom, platformMat);
    farIsland.position.set(1, -0.5, -172.5);
    this.scene.add(farIsland);
    this.addBoxCollider(new THREE.Vector3(-6, -1, -180), new THREE.Vector3(8, 0, -165));

    // Floating Subway Car Wreckage in the Abyss
    const wreckGeom = new THREE.BoxGeometry(3.2, 3.2, 12);
    const wreckMat = new THREE.MeshStandardMaterial({ color: 0x1d2732, roughness: 0.7, metalness: 0.7 });
    const wreck = new THREE.Mesh(wreckGeom, wreckMat);
    wreck.position.set(-14, 4, -155);
    wreck.rotation.set(0.4, 0.6, 0.2);
    this.scene.add(wreck);

    // Glowing Temporal Light Bridge between Promontory [Z: -145] and Far Island [Z: -165]
    const bridgeGeom = new THREE.BoxGeometry(3.5, 0.2, 20);
    const bridgeMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00d8ff,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.2, // Becomes 0.95 when synchronized
    });
    this.temporalBridgeMesh = new THREE.Mesh(bridgeGeom, bridgeMat);
    this.temporalBridgeMesh.position.set(1, -0.4, -155);
    this.scene.add(this.temporalBridgeMesh);

    // MIRA Silhouette Mesh on the Far Island [X: 1, Z: -172]
    const miraMat = new THREE.MeshStandardMaterial({
      color: 0xffaa44, // Warm orange (+9s past)
      emissive: 0xff8800,
      emissiveIntensity: 1.2,
      transparent: true,
      opacity: 0.85,
    });

    const miraHead = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.3, 0.28), miraMat);
    miraHead.position.y = 1.35;
    this.miraSilhouetteMesh.add(miraHead);

    const miraBody = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.65, 0.25), miraMat);
    miraBody.position.y = 0.85;
    this.miraSilhouetteMesh.add(miraBody);

    const miraHalo = new THREE.Mesh(
      new THREE.RingGeometry(0.35, 0.45, 24),
      new THREE.MeshBasicMaterial({ color: 0xffaa44, side: THREE.DoubleSide })
    );
    miraHalo.position.set(0, 1.45, 0);
    this.miraSilhouetteMesh.add(miraHalo);

    this.miraSilhouetteMesh.position.set(1, 0, -172);
    this.scene.add(this.miraSilhouetteMesh);

    // Warm orange light on Mira
    const miraLight = new THREE.PointLight(0xff9922, 2.0, 16);
    miraLight.position.set(1, 2.2, -172);
    this.scene.add(miraLight);

    // Reconnection interaction
    this.interactives.push({
      id: 'mira_reconnect',
      type: 'MIRA_RECONNECT',
      position: new THREE.Vector3(1, 1.0, -172),
      radius: 2.8,
      prompt: 'SYNCHRONIZE AND RECONNECT WITH MIRA',
      mesh: this.miraSilhouetteMesh,
    });
  }

  private buildTemporalConsole(
    x: number,
    z: number,
    id: string,
    type: 'REACTOR_A' | 'REACTOR_B',
    prompt: string
  ): void {
    const consoleGeom = new THREE.BoxGeometry(1.2, 1.3, 0.8);
    const consoleMat = new THREE.MeshStandardMaterial({ color: 0x1f2732, roughness: 0.4, metalness: 0.8 });
    const consoleMesh = new THREE.Mesh(consoleGeom, consoleMat);
    consoleMesh.position.set(x, 0.65, z);
    this.scene.add(consoleMesh);
    this.addBoxCollider(new THREE.Vector3(x - 0.7, 0, z - 0.5), new THREE.Vector3(x + 0.7, 1.4, z + 0.5));

    const screenGeom = new THREE.PlaneGeometry(0.8, 0.5);
    const screenMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 1.5,
    });
    const screen = new THREE.Mesh(screenGeom, screenMat);
    screen.position.set(x, 1.05, z + 0.41);
    this.scene.add(screen);

    this.interactives.push({
      id,
      type,
      position: new THREE.Vector3(x, 1.0, z),
      radius: 2.2,
      prompt,
      mesh: screen,
      indicatorMesh: screen,
    });
  }

  private setupAtmosphericParticles(): void {
    const count = 400;
    const geom = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 36;
      pos[i * 3 + 1] = Math.random() * 8;
      pos[i * 3 + 2] = -Math.random() * 180;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.particlePositions = pos;

    const mat = new THREE.PointsMaterial({
      color: 0x00d8ff,
      size: 0.08,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
    });

    this.ambientParticles = new THREE.Points(geom, mat);
    this.scene.add(this.ambientParticles);
  }

  public update(delta: number, runTime: number): void {
    // 1. Animate subtle light flickers
    this.flickeringLights.forEach((light, idx) => {
      const flicker = Math.sin(runTime * 8 + idx * 3) * 0.15 + (Math.random() - 0.5) * 0.1;
      light.intensity = Math.max(0.6, 1.6 + flicker);
    });

    // 2. Animate ambient floating dust particles
    if (this.ambientParticles && this.particlePositions) {
      const posAttr = this.ambientParticles.geometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < arr.length; i += 3) {
        arr[i + 1] -= delta * 0.2;
        if (arr[i + 1] < 0) {
          arr[i + 1] = 8;
        }
      }
      posAttr.needsUpdate = true;
    }

    // 3. Phantom train movement in intro or ambient
    if (this.phantomTrainActive) {
      this.phantomTrain.position.z += delta * 36;
      if (this.phantomTrain.position.z > 30) {
        this.phantomTrainActive = false;
        this.phantomTrain.position.z = -60;
      }
    }

    // 4. Update Security Door sliding animation
    const lDoor = this.securityDoorMesh.children[0];
    const rDoor = this.securityDoorMesh.children[1];
    if (lDoor && rDoor) {
      lDoor.position.x = THREE.MathUtils.lerp(lDoor.position.x, -0.5 - this.securityDoorOpenAmount * 2.5, delta * 6);
      rDoor.position.x = THREE.MathUtils.lerp(rDoor.position.x, 2.5 + this.securityDoorOpenAmount * 2.5, delta * 6);
    }

    // 5. Update Flooded Canal Water height
    if (this.canalWaterMesh) {
      // canalWaterLevel: 1 = high (-0.6), 0 = drained (-2.8)
      const targetY = -2.8 + this.canalWaterLevel * 2.2;
      this.canalWaterMesh.position.y = THREE.MathUtils.lerp(this.canalWaterMesh.position.y, targetY, delta * 4);
    }

    // 6. Update Retractable Bridge
    if (this.retractableBridgeMesh) {
      const targetScaleX = 0.05 + this.bridgeExtensionAmount * 0.95;
      this.retractableBridgeMesh.scale.x = THREE.MathUtils.lerp(
        this.retractableBridgeMesh.scale.x,
        targetScaleX,
        delta * 5
      );
    }

    // 7. Update Reactor Door
    const lReact = this.reactorDoorMesh.children[0];
    const rReact = this.reactorDoorMesh.children[1];
    if (lReact && rReact) {
      lReact.position.x = THREE.MathUtils.lerp(lReact.position.x, -0.6 - this.reactorDoorOpenAmount * 2.6, delta * 6);
      rReact.position.x = THREE.MathUtils.lerp(rReact.position.x, 2.6 + this.reactorDoorOpenAmount * 2.6, delta * 6);
    }

    // 8. Update Temporal Bridge across the rift
    if (this.temporalBridgeMesh) {
      const bridgeMat = this.temporalBridgeMesh.material as THREE.MeshStandardMaterial;
      const targetOpacity = 0.15 + this.finalBridgeFormed * 0.8;
      bridgeMat.opacity = THREE.MathUtils.lerp(bridgeMat.opacity, targetOpacity, delta * 6);
    }

    // 9. Mira silhouette subtle floating
    if (this.miraSilhouetteMesh) {
      this.miraSilhouetteMesh.position.y = Math.sin(runTime * 2.0) * 0.08;
    }

    // 10. Reactor core rotation
    if (this.reactorCoreMesh) {
      this.reactorCoreMesh.rotation.y += delta * 0.8;
    }

    // 11. Update Interactive Buttons
    this.buttons.forEach((btn) => btn.update(delta));
  }

  public setBridgeCollider(active: boolean): void {
    // When final bridge is formed, add collider across the rift
    const existingIndex = this.colliders.findIndex(
      (c) => c.min.z <= -164 && c.max.z >= -146 && c.min.x >= -1.0
    );
    if (active && existingIndex === -1) {
      this.colliders.push(new THREE.Box3(new THREE.Vector3(-1.0, -1.0, -165), new THREE.Vector3(3.0, 0, -145)));
    }
  }
}
