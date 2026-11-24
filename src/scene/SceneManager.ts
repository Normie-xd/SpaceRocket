/**
 * Three.js Scene Manager
 * 
 * Manages the WebGL rendering pipeline, PBR lighting, and multi-mode camera system:
 * - Camera modes: 'follow' (chase cam), 'orbit' (interactive 360 inspect), 'launchpad' (pad view), 'free'
 * - High dynamic range tone mapping (ACESFilmicToneMapping)
 * - Anti-aliasing and depth buffer precision for multi-kilometer scale scenes
 */

import * as THREE from 'three';

export type CameraMode = 'follow' | 'orbit' | 'launchpad' | 'free';

export interface SceneManagerOptions {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

export class SceneManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public cameraMode: CameraMode = 'follow';

  // Camera targets & offsets
  public targetPosition: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public followOffset: THREE.Vector3 = new THREE.Vector3(0, 5, 25);
  public orbitRadius: number = 25;
  public orbitTheta: number = 0; // Azimuthal angle
  public orbitPhi: number = Math.PI / 4; // Polar angle

  // Lighting
  public sunLight: THREE.DirectionalLight;
  public ambientLight: THREE.AmbientLight;

  private isDragging: boolean = false;
  private previousMousePosition: { x: number; y: number } = { x: 0, y: 0 };
  private animationFrameId: number | null = null;
  private onRenderCallbacks: Array<(delta: number) => void> = [];

  constructor(options: SceneManagerOptions) {
    const { canvas, width, height } = options;

    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050508);

    // 2. Camera setup (near: 0.1m, far: 50,000,000m for space scale)
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50_000_000);
    this.camera.position.set(0, 5, 30);

    // 3. Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      logarithmicDepthBuffer: true // Prevents z-fighting across planetary scales
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. Celestial Sun & Ambient Lighting
    this.sunLight = new THREE.DirectionalLight(0xfffaed, 2.5);
    this.sunLight.position.set(100, 300, 150);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 1000;
    this.sunLight.shadow.bias = -0.0001;
    this.scene.add(this.sunLight);

    // Ambient space light (soft Earth-reflected / starlight fill)
    this.ambientLight = new THREE.AmbientLight(0x1a1a2e, 0.4);
    this.scene.add(this.ambientLight);

    // Setup input listeners for orbit camera
    this.setupInputHandlers(canvas);
  }

  private setupInputHandlers(canvas: HTMLCanvasElement): void {
    canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;

      const deltaX = e.clientX - this.previousMousePosition.x;
      const deltaY = e.clientY - this.previousMousePosition.y;

      this.orbitTheta -= deltaX * 0.008;
      this.orbitPhi = Math.max(0.05, Math.min(Math.PI - 0.05, this.orbitPhi + deltaY * 0.008));

      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.orbitRadius = Math.max(3, Math.min(500, this.orbitRadius * (1.0 + e.deltaY * 0.001)));
    }, { passive: false });
  }

  public setCameraMode(mode: CameraMode): void {
    this.cameraMode = mode;
  }

  public setTargetPosition(pos: THREE.Vector3): void {
    this.targetPosition.copy(pos);
  }

  public updateCamera(): void {
    switch (this.cameraMode) {
      case 'follow': {
        // Smoothly chase the rocket from behind and above
        const desiredPos = this.targetPosition.clone().add(this.followOffset);
        this.camera.position.lerp(desiredPos, 0.1);
        this.camera.lookAt(this.targetPosition);
        break;
      }

      case 'orbit': {
        // Spherical orbit coordinates around target
        const sinPhi = Math.sin(this.orbitPhi);
        const cosPhi = Math.cos(this.orbitPhi);
        const sinTheta = Math.sin(this.orbitTheta);
        const cosTheta = Math.cos(this.orbitTheta);

        const camX = this.targetPosition.x + this.orbitRadius * sinPhi * sinTheta;
        const camY = this.targetPosition.y + this.orbitRadius * cosPhi;
        const camZ = this.targetPosition.z + this.orbitRadius * sinPhi * cosTheta;

        this.camera.position.set(camX, camY, camZ);
        this.camera.lookAt(this.targetPosition);
        break;
      }

      case 'launchpad': {
        // Ground camera looking up at the rocket
        this.camera.position.set(20, 2, 40);
        this.camera.lookAt(this.targetPosition);
        break;
      }

      case 'free':
        // Left free to external controls
        break;
    }
  }

  public onRender(callback: (delta: number) => void): void {
    this.onRenderCallbacks.push(callback);
  }

  public startRenderLoop(): void {
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 1000.0;
      lastTime = currentTime;

      // Update camera
      this.updateCamera();

      // Trigger user callbacks
      for (const cb of this.onRenderCallbacks) {
        cb(delta);
      }

      // Render scene
      this.renderer.render(this.scene, this.camera);

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  public stopRenderLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public dispose(): void {
    this.stopRenderLoop();
    this.renderer.dispose();
  }
}
