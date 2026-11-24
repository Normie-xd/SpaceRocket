/**
 * Prandtl-Glauert Transonic Shockwave Condensation Cone
 * 
 * Visualizes the classic aerodynamic vapor cone that forms around the rocket
 * as it punches through the sound barrier (Mach 0.95 to 1.15) in dense atmosphere:
 * - Dynamically activates around Mach 1.0
 * - Scales with dynamic pressure (q)
 * - Fades completely once in thin upper atmosphere
 */

import * as THREE from 'three';

export class ShockwaveCone {
  public mesh: THREE.Mesh;
  private material: THREE.ShaderMaterial;
  private opacityUniform: { value: number } = { value: 0 };

  constructor(rocketRadius: number = 1.5) {
    // Conical frustum representing shock wave geometry
    const coneGeo = new THREE.CylinderGeometry(
      rocketRadius * 1.05,
      rocketRadius * 3.2,
      rocketRadius * 2.5,
      32,
      1,
      true
    );

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uOpacity: this.opacityUniform
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        varying vec2 vUv;
        void main() {
          if (uOpacity <= 0.005) discard;
          // Thin condensation sheet with soft falloff edges
          float edgeFade = sin(vUv.y * 3.14159);
          vec3 vaporColor = vec3(0.92, 0.95, 1.0);
          gl_FragColor = vec4(vaporColor, edgeFade * uOpacity * 0.45);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.NormalBlending,
      depthWrite: false
    });

    this.mesh = new THREE.Mesh(coneGeo, this.material);
    this.mesh.visible = false;
  }

  /**
   * Updates shockwave visibility and condensation intensity based on Mach and dynamic pressure.
   * 
   * @param mach Current Mach number
   * @param dynamicPressure Current dynamic pressure q (Pa)
   */
  public update(mach: number, dynamicPressure: number): void {
    // Active only in transonic window: Mach 0.94 to 1.14
    if (mach >= 0.94 && mach <= 1.14 && dynamicPressure > 3000) {
      // Bell curve peaking at Mach 1.04
      const deltaM = Math.abs(mach - 1.04);
      const intensity = Math.max(0, 1.0 - (deltaM / 0.1));
      const qFactor = Math.min(1.0, dynamicPressure / 25000);

      this.opacityUniform.value = intensity * qFactor;
      this.mesh.visible = this.opacityUniform.value > 0.02;
    } else {
      this.opacityUniform.value = 0;
      this.mesh.visible = false;
    }
  }
}
