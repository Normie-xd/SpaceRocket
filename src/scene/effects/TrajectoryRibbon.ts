/**
 * 3D Trajectory Ribbon & Orbital Path Visualizer
 * 
 * Renders:
 * - Historical trajectory trail trailing behind the active rocket
 * - Predicted future orbital trajectory arc (Keplerian ellipse)
 * - Apoapsis (Ap) and Periapsis (Pe) 3D coordinate marker nodes
 */

import * as THREE from 'three';
import { Vector3D } from '../../engine/math/Vector3D';
import type { KeplerianElements } from '../../engine/dynamics/OrbitalMechanics';

export class TrajectoryRibbon {
  public group: THREE.Group;
  private historyLine: THREE.Line;
  private predictedOrbitLine: THREE.Line;
  private historyPoints: THREE.Vector3[] = [];
  private maxHistoryPoints: number = 1000;

  // Apoapsis & Periapsis markers
  private apoapsisMarker: THREE.Mesh;
  private periapsisMarker: THREE.Mesh;

  constructor() {
    this.group = new THREE.Group();

    // 1. Historical Path Line (Cyan glowing line)
    const historyGeo = new THREE.BufferGeometry();
    const historyMat = new THREE.LineBasicMaterial({
      color: 0x00d4ff,
      linewidth: 2,
      transparent: true,
      opacity: 0.85
    });
    this.historyLine = new THREE.Line(historyGeo, historyMat);
    this.group.add(this.historyLine);

    // 2. Predicted Orbit Line (Translucent Orange / Green ellipse)
    const orbitGeo = new THREE.BufferGeometry();
    const orbitMat = new THREE.LineBasicMaterial({
      color: 0x00ff88,
      linewidth: 1,
      transparent: true,
      opacity: 0.6
    });
    this.predictedOrbitLine = new THREE.Line(orbitGeo, orbitMat);
    this.group.add(this.predictedOrbitLine);

    // 3. Ap / Pe Markers
    const markerGeo = new THREE.SphereGeometry(1.5, 12, 12);
    const apMat = new THREE.MeshBasicMaterial({ color: 0xff6b35 }); // Orange Ap
    const peMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff }); // Cyan Pe

    this.apoapsisMarker = new THREE.Mesh(markerGeo, apMat);
    this.periapsisMarker = new THREE.Mesh(markerGeo, peMat);
    this.apoapsisMarker.visible = false;
    this.periapsisMarker.visible = false;

    this.group.add(this.apoapsisMarker);
    this.group.add(this.periapsisMarker);
  }

  /**
   * Adds a new real-time position point to the historical flight path trail.
   */
  public pushHistoryPoint(pos: Vector3D | THREE.Vector3): void {
    const v = pos instanceof THREE.Vector3 ? pos : new THREE.Vector3(pos.x, pos.y, pos.z);

    // Downsample if point is very close to last recorded point
    if (this.historyPoints.length > 0) {
      const last = this.historyPoints[this.historyPoints.length - 1];
      if (last.distanceTo(v) < 5.0) return;
    }

    this.historyPoints.push(v);
    if (this.historyPoints.length > this.maxHistoryPoints) {
      this.historyPoints.shift();
    }

    this.historyLine.geometry.setFromPoints(this.historyPoints);
  }

  /**
   * Updates the predicted Keplerian orbital path arc and Ap/Pe markers.
   */
  public updatePredictedOrbit(kepler: KeplerianElements, planetCenter: THREE.Vector3 = new THREE.Vector3(0, 0, 0)): void {
    if (!kepler.isOrbital || kepler.semiMajorAxis <= 0 || kepler.eccentricity >= 1.0) {
      this.predictedOrbitLine.visible = false;
      this.apoapsisMarker.visible = false;
      this.periapsisMarker.visible = false;
      return;
    }

    this.predictedOrbitLine.visible = true;

    // Generate points along the Keplerian ellipse
    const points: THREE.Vector3[] = [];
    const segments = 120;
    const a = kepler.semiMajorAxis;
    const e = kepler.eccentricity;
    const p = a * (1.0 - e * e); // Semi-latus rectum

    for (let i = 0; i <= segments; i++) {
      const nu = (i / segments) * Math.PI * 2.0; // True anomaly
      const r = p / (1.0 + e * Math.cos(nu));

      // Orbit plane coords
      const x = r * Math.cos(nu);
      const y = r * Math.sin(nu);

      points.push(new THREE.Vector3(planetCenter.x + x, planetCenter.y + y, planetCenter.z));
    }

    this.predictedOrbitLine.geometry.setFromPoints(points);

    // Update Ap & Pe markers
    const r_a = a * (1.0 + e);
    const r_p = a * (1.0 - e);

    this.apoapsisMarker.position.set(planetCenter.x - r_a, planetCenter.y, planetCenter.z);
    this.periapsisMarker.position.set(planetCenter.x + r_p, planetCenter.y, planetCenter.z);
    this.apoapsisMarker.visible = true;
    this.periapsisMarker.visible = true;
  }

  public reset(): void {
    this.historyPoints = [];
    this.historyLine.geometry.setFromPoints([]);
    this.predictedOrbitLine.geometry.setFromPoints([]);
    this.apoapsisMarker.visible = false;
    this.periapsisMarker.visible = false;
  }
}
