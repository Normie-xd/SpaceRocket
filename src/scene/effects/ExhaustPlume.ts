/**
 * Rocket Engine Exhaust Plume & Vacuum Expansion Shader
 * 
 * Simulates realistic rocket propulsion visuals:
 * - High-speed supersonic core with shock diamonds
 * - Ambient-pressure dependent plume expansion (narrow column at sea level -> massive glowing bell in vacuum)
 * - Color gradient: White/cyan throat -> Brilliant yellow/orange combustion zone -> Reddish cooling trail
 * - Throttle scaling and turbulent flame flicker
 */

import * as THREE from 'three';

export interface ExhaustPlumeOptions {
  nozzleExitRadius?: number; // meters
  maxPlumeLength?: number;   // meters
}

export class ExhaustPlume {
  public group: THREE.Group;
  private coreMesh: THREE.Mesh;
  private outerPlumeMesh: THREE.Mesh;
  private coreMaterial: THREE.ShaderMaterial;
  private outerMaterial: THREE.ShaderMaterial;

  public exitRadius: number;
  public maxPlumeLength: number;
  private timeUniform: { value: number } = { value: 0 };
  private throttleUniform: { value: number } = { value: 1.0 };
  private expansionUniform: { value: number } = { value: 1.0 }; // 1.0 at SL -> 4.5 in vacuum

  constructor(options: ExhaustPlumeOptions = {}) {
    this.exitRadius = options.nozzleExitRadius || 0.5;
    this.maxPlumeLength = options.maxPlumeLength || 16.0;
    this.group = new THREE.Group();

    // 1. Inner Superheated Core Shader (White-Blue with Mach diamond standing waves)
    this.coreMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: this.timeUniform,
        uThrottle: this.throttleUniform
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uThrottle;
        varying vec2 vUv;
        void main() {
          if (uThrottle <= 0.01) discard;
          float y = vUv.y;
          // Standing shock waves (Mach diamonds periodic brightness)
          float diamond = sin(y * 35.0 - uTime * 25.0) * 0.3 + 0.7;
          float fade = pow(1.0 - y, 1.8);
          vec3 coreColor = mix(vec3(0.5, 0.85, 1.0), vec3(1.0, 1.0, 1.0), diamond);
          gl_FragColor = vec4(coreColor, fade * uThrottle * 0.95);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const coreGeo = new THREE.CylinderGeometry(this.exitRadius * 0.4, this.exitRadius * 0.1, this.maxPlumeLength * 0.6, 16, 1, true);
    // Position below nozzle
    coreGeo.translate(0, -this.maxPlumeLength * 0.3, 0);
    this.coreMesh = new THREE.Mesh(coreGeo, this.coreMaterial);
    this.group.add(this.coreMesh);

    // 2. Outer Luminous Expansion Envelope (Orange / Yellow with vacuum bloom)
    this.outerMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: this.timeUniform,
        uThrottle: this.throttleUniform,
        uExpansion: this.expansionUniform
      },
      vertexShader: `
        uniform float uExpansion;
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
          vUv = uv;
          vNormal = normal;
          vec3 pos = position;
          // Plume expands radially as it moves away from nozzle (especially in vacuum)
          float expandFactor = pow(uv.y, 0.7) * (uExpansion - 1.0);
          pos.x *= (1.0 + expandFactor);
          pos.z *= (1.0 + expandFactor);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uThrottle;
        uniform float uExpansion;
        varying vec2 vUv;
        void main() {
          if (uThrottle <= 0.01) discard;
          float y = vUv.y;
          float fade = pow(1.0 - y, 1.4);
          // Color shift from hot yellow-orange to cool red
          vec3 yellow = vec3(1.0, 0.85, 0.2);
          vec3 orange = vec3(1.0, 0.45, 0.05);
          vec3 red = vec3(0.85, 0.15, 0.02);
          vec3 plumeColor = mix(yellow, orange, smoothstep(0.0, 0.4, y));
          plumeColor = mix(plumeColor, red, smoothstep(0.4, 1.0, y));

          // In vacuum bloom, dilute opacity as volume expands
          float vacuumFade = 1.0 / sqrt(uExpansion);
          float alpha = fade * uThrottle * 0.75 * vacuumFade;
          gl_FragColor = vec4(plumeColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const outerGeo = new THREE.CylinderGeometry(this.exitRadius * 0.9, this.exitRadius * 1.5, this.maxPlumeLength, 24, 1, true);
    outerGeo.translate(0, -this.maxPlumeLength * 0.5, 0);
    this.outerPlumeMesh = new THREE.Mesh(outerGeo, this.outerMaterial);
    this.group.add(this.outerPlumeMesh);
  }

  /**
   * Updates plume visuals based on engine throttle, altitude, and ambient atmospheric pressure.
   * 
   * @param throttle Engine throttle (0.0 to 1.0)
   * @param ambientPressure Atmospheric pressure (101,325 Pa at SL down to 0 in space)
   * @param delta Frame delta time (seconds)
   */
  public update(throttle: number, ambientPressure: number, delta: number): void {
    this.timeUniform.value += delta;
    this.throttleUniform.value = Math.max(0, Math.min(1.0, throttle));

    // Under-expanded vacuum plume expansion factor:
    // At SL (P = 101,325 Pa): expansion ~ 1.0 (collimated stream)
    // In space (P = 0 Pa): expansion ~ 4.5 (broad spherical vacuum plume bloom)
    const p0 = 101325.0;
    const pRatio = Math.max(0, Math.min(1.0, ambientPressure / p0));
    const expansion = 1.0 + 3.5 * (1.0 - pRatio);
    this.expansionUniform.value = expansion;

    // Scale plume length with throttle
    const lengthScale = 0.3 + 0.7 * this.throttleUniform.value;
    this.group.scale.set(1.0, lengthScale, 1.0);
  }

  public setVisible(visible: boolean): void {
    this.group.visible = visible;
  }
}
