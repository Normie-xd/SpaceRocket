import { describe, it, expect } from 'vitest';
import {
  computeISA,
  geometricToGeopotential,
  geopotentialToGeometric,
  G0,
  R_AIR,
  GAMMA_AIR
} from '../src/engine/atmosphere/ISA';

describe('US Standard Atmosphere 1976 (ISA)', () => {
  it('correctly calculates sea level reference values', () => {
    const seaLevel = computeISA(0);

    // Standard Sea Level constants (ISO 2533 / US Standard 1976)
    expect(seaLevel.temperature).toBeCloseTo(288.15, 2);
    expect(seaLevel.pressure).toBeCloseTo(101325, 0);
    expect(seaLevel.density).toBeCloseTo(1.225, 3);
    expect(seaLevel.speedOfSound).toBeCloseTo(340.294, 1);
    expect(seaLevel.geopotentialAltitude).toBe(0);
  });

  it('matches standard values at the Tropopause boundary (11,000 geopotential meters)', () => {
    const tropopauseH = 11000;
    const geomAlt = geopotentialToGeometric(tropopauseH);
    const state = computeISA(geomAlt);

    // At 11,000m: T = 216.65 K, P = 22632 Pa, rho ~ 0.3639 kg/m^3
    expect(state.temperature).toBeCloseTo(216.65, 1);
    expect(state.pressure).toBeCloseTo(22632.1, -1);
    expect(state.density).toBeCloseTo(0.3639, 2);
    expect(state.speedOfSound).toBeCloseTo(295.07, 1);
  });

  it('matches standard values at Stratosphere boundary (20,000 geopotential meters)', () => {
    const h20k = geopotentialToGeometric(20000);
    const state = computeISA(h20k);

    // In isothermal layer (11km - 20km), temperature remains 216.65 K
    expect(state.temperature).toBeCloseTo(216.65, 1);
    expect(state.pressure).toBeCloseTo(5474.89, -1);
    expect(state.density).toBeCloseTo(0.08803, 3);
  });

  it('correctly handles high altitude up to Karman line and vacuum transition', () => {
    // 50,000 m (Stratopause)
    const state50k = computeISA(50000);
    expect(state50k.temperature).toBeGreaterThan(250); // Stratosphere warms up due to ozone layer
    expect(state50k.pressure).toBeLessThan(100);       // Less than 1 mbar

    // 100,000 m (Karman Line - Space edge)
    const state100k = computeISA(100000);
    expect(state100k.pressure).toBeLessThan(0.1);
    expect(state100k.density).toBeLessThan(1e-5);
  });

  it('correctly converts between geometric and geopotential altitudes', () => {
    const h = 50000; // 50 km
    const H = geometricToGeopotential(h);
    expect(H).toBeLessThan(h); // Geopotential is always slightly less than geometric

    const hReconstructed = geopotentialToGeometric(H);
    expect(hReconstructed).toBeCloseTo(h, 4);
  });
});
