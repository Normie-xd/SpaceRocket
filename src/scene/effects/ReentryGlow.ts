/**
 * Aerodynamic Heating & Re-Entry Plasma Glow Effect
 * 
 * Generates an incandescent thermal plasma sheath when the vehicle travels
 * at hypersonic speeds through the atmosphere (re-entry or high-speed ascent):
 * - Activates when stagnation temperature T_stag > 600 K
 * - Transitions from cherry-red heat (800K) -> brilliant incandescent orange (1500K) -> white-hot plasma (3000K+)
 */

import * as THREE from 'three';

export class ReentryGlow {
  public mesh: THREE.Mesh;
  private material: THREE.ShaderMaterial;
  private intensityUniform: { value: number } = { value: 0 };
  private tempUniform: { value: number } = { value: 300 };

  constructor(rocketRadius: number = 1.5) {
    // Hemispherical bow shock cap over nose
    const capGeo = new THREE.SphereGeometry(rocketRadius * 1.3, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uIntensity: this.intensityUniform,
        uTemp: this.tempUniform
      },
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
        uniform float uIntensity;
        uniform float uTemp;
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          if (uIntensity <= 0.01) discard;

          vec3 viewDir = normalize(-vPosition);
          float fresnel = 1.0 - max(0.0, dot(vNormal, viewDir));

          // Blackbody-inspired plasma radiation color palette
          vec3 dullRed = vec3(0.9, 0.15, 0.05);
          vec3 brightOrange = vec3(1.0, 0.55, 0.1);
          vec3 whiteHot = vec3(1.0, 0.95, 0.85);

          float tNorm = clamp((uTemp - 700.0) / 2000.0, 0.0, 1.0);
          vec3 plasmaCol = mix(dullRed, brightOrange, smoothstep(0.0, 0.5, tNorm));
          plasmaCol = mix(plasmaCol, whiteHot, smoothstep(0.5, 1.0, tNorm));

          float alpha = pow(fresnel, 2.0) * uIntensity * 0.85;
          gl_FragColor = vec4(plasmaCol, alpha);
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.mesh = new THREE.Mesh(capGeo, this.material);
    this.mesh.visible = false;
  }

  /**
   * Updates thermal glow based on aerodynamic stagnation temperature and air density.
   * 
   * @param stagnationTemp Stagnation temperature T_stag in Kelvin
   * @param airDensity Air density rho in kg/m^3
   */
  public update(stagnationTemp: number, airDensity: number): void {
    if (stagnationTemp > 650 && airDensity > 1e-4) {
      this.tempUniform.value = stagnationTemp;
      const tNorm = Math.min(1.0, (stagnationTemp - 650) / 1500.0);
      const densityNorm = Math.min(1.0, airDensity / 0.1);

      this.intensityUniform.value = tNorm * densityNorm;
      this.mesh.visible = this.intensityUniform.value > 0.02;
    } else {
      this.intensityUniform.value = 0;
      this.mesh.visible = false;
    }
  }
}
