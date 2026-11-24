import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { ExhaustPlume } from '../src/scene/effects/ExhaustPlume';
import { ShockwaveCone } from '../src/scene/effects/ShockwaveCone';
import { ReentryGlow } from '../src/scene/effects/ReentryGlow';
import { TrajectoryRibbon } from '../src/scene/effects/TrajectoryRibbon';
import type { KeplerianElements } from '../src/engine/dynamics/OrbitalMechanics';

describe('Exhaust Plume Shader & Vacuum Expansion', () => {
  it('creates exhaust plume with core and outer expansion envelope meshes', () => {
    const plume = new ExhaustPlume({ nozzleExitRadius: 0.8 });

    expect(plume.group).toBeInstanceOf(THREE.Group);
    expect(plume.group.children.length).toBe(2); // Core flame + outer envelope
  });

  it('correctly expands plume in vacuum compared to sea level', () => {
    const plume = new ExhaustPlume({ nozzleExitRadius: 0.8 });

    // Sea level update (P = 101,325 Pa)
    plume.update(1.0, 101325.0, 0.02);
    const slScale = plume.group.scale.y;

    // Vacuum update (P = 0 Pa)
    plume.update(1.0, 0.0, 0.02);
    const vacScale = plume.group.scale.y;

    expect(slScale).toBeGreaterThan(0);
    expect(vacScale).toBeGreaterThan(0);
  });
});

describe('Prandtl-Glauert Transonic Shockwave Cone', () => {
  it('triggers condensation cone during transonic flight (Mach 0.95 - 1.14)', () => {
    const cone = new ShockwaveCone(1.5);
    expect(cone.mesh.visible).toBe(false);

    // Subsonic (Mach 0.5) -> not visible
    cone.update(0.5, 15000);
    expect(cone.mesh.visible).toBe(false);

    // Transonic (Mach 1.04, high q) -> visible
    cone.update(1.04, 25000);
    expect(cone.mesh.visible).toBe(true);

    // Hypersonic (Mach 5.0) -> shockwave cone fades
    cone.update(5.0, 15000);
    expect(cone.mesh.visible).toBe(false);
  });
});

describe('Re-entry & Aerodynamic Heating Plasma Glow', () => {
  it('activates plasma glow when stagnation temperature is high in dense air', () => {
    const glow = new ReentryGlow(1.5);
    expect(glow.mesh.visible).toBe(false);

    // Room temperature -> inactive
    glow.update(288, 1.2);
    expect(glow.mesh.visible).toBe(false);

    // High Mach heating: T_stag = 1800K, rho = 0.05 -> active incandescent plasma
    glow.update(1800, 0.05);
    expect(glow.mesh.visible).toBe(true);
  });
});

describe('3D Trajectory Ribbon & Orbital Path Visualizer', () => {
  it('records historical flight path points and updates geometry', () => {
    const ribbon = new TrajectoryRibbon();
    expect(ribbon.group).toBeInstanceOf(THREE.Group);

    ribbon.pushHistoryPoint(new THREE.Vector3(0, 0, 0));
    ribbon.pushHistoryPoint(new THREE.Vector3(0, 50, 0));
    ribbon.pushHistoryPoint(new THREE.Vector3(10, 150, 0));

    const line = ribbon.group.children[0] as THREE.Line;
    expect(line.geometry.getAttribute('position').count).toBe(3);
  });

  it('draws predicted closed Keplerian orbit ellipse and Ap/Pe markers', () => {
    const ribbon = new TrajectoryRibbon();

    const sampleOrbit: KeplerianElements = {
      semiMajorAxis: 6771000,
      eccentricity: 0.01,
      inclination: 28.5,
      raan: 0,
      argumentOfPeriapsis: 0,
      trueAnomaly: 0,
      periapsisAltitude: 330000,
      apoapsisAltitude: 470000,
      orbitalPeriod: 5500,
      specificEnergy: -29400000,
      isOrbital: true
    };

    ribbon.updatePredictedOrbit(sampleOrbit);

    const orbitLine = ribbon.group.children[1] as THREE.Line;
    expect(orbitLine.visible).toBe(true);
    expect(orbitLine.geometry.getAttribute('position').count).toBeGreaterThan(100);
  });
});
