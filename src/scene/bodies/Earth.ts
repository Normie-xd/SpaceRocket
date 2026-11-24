/**
 * Earth & Planetary Body 3D Mesh with Atmospheric Scattering
 * 
 * Renders Earth with:
 * - PBR Earth surface with continents, oceans, and day/night shading
 * - Custom Rayleigh atmospheric limb glow shader (fresnel edge scattering)
 * - Cloud layer with independent rotational velocity
 */

import * as THREE from 'three';

export interface EarthMeshOptions {
  radius?: number; // Default 6,371,000 meters
}

export class EarthMesh {
  public group: THREE.Group;
  public surfaceMesh: THREE.Mesh;
  public atmosphereMesh: THREE.Mesh;
  public cloudMesh: THREE.Mesh;
  public radius: number;

  constructor(options: EarthMeshOptions = {}) {
    this.radius = options.radius || 6_371_000;
    this.group = new THREE.Group();

    // 1. Earth Surface (Procedural PBR shader / Canvas texture)
    const surfaceGeo = new THREE.SphereGeometry(this.radius, 64, 64);
    const surfaceMat = this.createSurfaceMaterial();
    this.surfaceMesh = new THREE.Mesh(surfaceGeo, surfaceMat);
    this.surfaceMesh.receiveShadow = true;
    this.group.add(this.surfaceMesh);

    // 2. Cloud Layer (slightly above surface)
    const cloudGeo = new THREE.SphereGeometry(this.radius * 1.002, 64, 64);
    const cloudMat = this.createCloudMaterial();
    this.cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    this.group.add(this.cloudMesh);

    // 3. Atmospheric Scattering Outer Shell (Rayleigh glow)
    const atmoGeo = new THREE.SphereGeometry(this.radius * 1.015, 64, 64);
    const atmoMat = this.createAtmosphereMaterial();
    this.atmosphereMesh = new THREE.Mesh(atmoGeo, atmoMat);
    this.group.add(this.atmosphereMesh);
  }

  private createSurfaceMaterial(): THREE.Material {
    // In headless test environments without DOM
    if (typeof document === 'undefined') {
      return new THREE.MeshStandardMaterial({
        color: 0x0d3b66,
        roughness: 0.7,
        metalness: 0.1
      });
    }

    // Generate high-resolution procedural Earth texture canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Deep ocean blue gradient
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, 512);
    oceanGrad.addColorStop(0, '#0a2342');
    oceanGrad.addColorStop(0.5, '#0d3b66');
    oceanGrad.addColorStop(1, '#0a2342');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, 1024, 512);

    // Stylized landmass continents
    ctx.fillStyle = '#2d5a27'; // Forest green
    // North America
    ctx.beginPath();
    ctx.ellipse(250, 160, 120, 80, 0, 0, Math.PI * 2);
    ctx.fill();
    // South America
    ctx.beginPath();
    ctx.ellipse(320, 340, 70, 110, 0.3, 0, Math.PI * 2);
    ctx.fill();
    // Eurasia / Africa
    ctx.beginPath();
    ctx.ellipse(600, 180, 160, 90, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c2a649'; // Sahara / Desert sands
    ctx.beginPath();
    ctx.ellipse(550, 260, 90, 80, 0, 0, Math.PI * 2);
    ctx.fill();
    // Southern Africa
    ctx.fillStyle = '#2d5a27';
    ctx.beginPath();
    ctx.ellipse(580, 360, 50, 80, 0, 0, Math.PI * 2);
    ctx.fill();
    // Australia
    ctx.fillStyle = '#b85d19'; // Outback
    ctx.beginPath();
    ctx.ellipse(820, 360, 60, 45, 0, 0, Math.PI * 2);
    ctx.fill();

    // Polar ice caps
    ctx.fillStyle = '#e8f4f8';
    ctx.fillRect(0, 0, 1024, 30);
    ctx.fillRect(0, 485, 1024, 27);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    return new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.7,
      metalness: 0.1
    });
  }

  private createCloudMaterial(): THREE.Material {
    if (typeof document === 'undefined') {
      return new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.6
      });
    }

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, 512, 256);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';

    // Swirling cloud bands
    for (let i = 0; i < 40; i++) {
      const cx = Math.random() * 512;
      const cy = 40 + Math.random() * 176;
      const rx = 30 + Math.random() * 60;
      const ry = 10 + Math.random() * 25;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, Math.random() * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    const cloudTex = new THREE.CanvasTexture(canvas);
    cloudTex.wrapS = THREE.RepeatWrapping;

    return new THREE.MeshStandardMaterial({
      map: cloudTex,
      transparent: true,
      opacity: 0.65,
      blending: THREE.NormalBlending,
      depthWrite: false
    });
  }

  private createAtmosphereMaterial(): THREE.ShaderMaterial {
    // Custom Rayleigh Limb Glow Shader
    return new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vec3 viewDir = normalize(-vPosition);
          // Fresnel rim power for atmospheric limb glow
          float rim = 1.0 - max(0.0, dot(vNormal, viewDir));
          float intensity = pow(rim, 3.5);
          // Rayleigh blue haze color (0.2, 0.6, 1.0)
          vec3 atmoColor = vec3(0.2, 0.6, 1.0);
          gl_FragColor = vec4(atmoColor, intensity * 0.85);
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false
    });
  }

  public update(delta: number): void {
    // Slowly rotate clouds
    this.cloudMesh.rotation.y += delta * 0.001;
  }
}
