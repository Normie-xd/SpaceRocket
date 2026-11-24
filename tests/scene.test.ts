import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { buildProceduralRocketMesh } from '../src/scene/rocket/ProceduralRocketMesh';
import { createStarfield } from '../src/scene/bodies/Starfield';
import { createLaunchPad } from '../src/scene/environment/LaunchPad';
import { EarthMesh } from '../src/scene/bodies/Earth';
import { ROCKET_PRESETS } from '../src/views/RocketBuilder/RocketPresets';

describe('3D Procedural Rocket Mesh Generator', () => {
  it('generates a complete 3D rocket mesh group for Zephyr-1', () => {
    const zephyr1 = ROCKET_PRESETS[1];
    const result = buildProceduralRocketMesh(zephyr1);

    expect(result.group).toBeInstanceOf(THREE.Group);
    expect(result.group.children.length).toBeGreaterThan(5); // Multiple tanks, engines, fins
    expect(result.totalHeight).toBeGreaterThan(30); // ~50m tall orbital rocket
    expect(result.engineNozzles.length).toBeGreaterThan(0); // Engine bells detected
  });

  it('generates a valid mesh group for Sounding Rocket Alpha', () => {
    const sounding = ROCKET_PRESETS[0];
    const result = buildProceduralRocketMesh(sounding);

    expect(result.group).toBeInstanceOf(THREE.Group);
    expect(result.totalHeight).toBeLessThan(10); // Small sounding rocket
    expect(result.engineNozzles.length).toBe(1); // Single solid nozzle
  });
});

describe('3D Planetary & Space Environment', () => {
  it('creates an astronomical starfield with thousands of vertices', () => {
    const starfield = createStarfield(5000, 100_000);

    expect(starfield).toBeInstanceOf(THREE.Points);
    const posAttr = starfield.geometry.getAttribute('position');
    expect(posAttr.count).toBe(5000);

    const colAttr = starfield.geometry.getAttribute('color');
    expect(colAttr.count).toBe(5000);
  });

  it('generates a detailed launch complex with gantry tower and flame trench', () => {
    const pad = createLaunchPad();

    expect(pad).toBeInstanceOf(THREE.Group);
    expect(pad.children.length).toBeGreaterThan(6); // Ground, table, opening, trench, tower, arms, clamps
  });

  it('creates Earth mesh with atmospheric scattering shell and clouds', () => {
    const earth = new EarthMesh({ radius: 10_000 });

    expect(earth.group).toBeInstanceOf(THREE.Group);
    expect(earth.surfaceMesh).toBeInstanceOf(THREE.Mesh);
    expect(earth.cloudMesh).toBeInstanceOf(THREE.Mesh);
    expect(earth.atmosphereMesh).toBeInstanceOf(THREE.Mesh);
  });
});
