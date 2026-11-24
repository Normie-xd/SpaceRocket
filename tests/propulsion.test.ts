import { describe, it, expect } from 'vitest';
import {
  computeEnginePerformance,
  computeTsiolkovskyDeltaV,
  computeRequiredPropellantMass,
  calculateNozzleExitArea,
  SEA_LEVEL_PRESSURE
} from '../src/engine/propulsion/Engine';
import type { EngineParams } from '../src/types/rocket';

describe('Propulsion Engine & Tsiolkovsky Rocket Equation', () => {
  // Representative kerosene/LOX rocket engine (Merlin 1D style)
  const merlin1D: EngineParams = {
    thrustSeaLevel: 845_000,    // 845 kN
    thrustVacuum: 914_000,      // 914 kN
    ispSeaLevel: 282,           // 282 s
    ispVacuum: 311,             // 311 s
    nozzleExitDiameter: 0.92,   // 0.92 m
    nozzleThroatDiameter: 0.2,
    expansionRatio: 16,
    gimbalRange: 5,
    mass: 470,
    burnTime: 180,
    restartable: true,
    quantity: 9,                // Falcon 9 octaweb cluster
    propellantType: 'RP1',
    oxidiserType: 'LOX',
    cycleType: 'gasGenerator',
    chamberPressure: 9_700_000
  };

  it('computes sea-level vs vacuum performance accurately', () => {
    // Sea level performance (P = 101,325 Pa)
    const slState = computeEnginePerformance(merlin1D, SEA_LEVEL_PRESSURE, 1.0);
    expect(slState.thrust).toBeCloseTo(845_000 * 9, -2);
    expect(slState.currentIsp).toBeCloseTo(287.5, 1); // Real calculated sea-level Isp
    expect(slState.massFlowRate).toBeGreaterThan(0);

    // Vacuum performance (P = 0 Pa)
    const vacState = computeEnginePerformance(merlin1D, 0.0, 1.0);
    expect(vacState.thrust).toBeCloseTo(914_000 * 9, -2);
    expect(vacState.currentIsp).toBeCloseTo(311, 1);

    // Vacuum thrust & Isp must strictly exceed sea-level values
    expect(vacState.thrust).toBeGreaterThan(slState.thrust);
    expect(vacState.currentIsp).toBeGreaterThan(slState.currentIsp);
  });

  it('scales thrust linearly with throttle fraction', () => {
    const fullThrottle = computeEnginePerformance(merlin1D, 0.0, 1.0);
    const halfThrottle = computeEnginePerformance(merlin1D, 0.0, 0.5);

    expect(halfThrottle.thrust).toBeCloseTo(fullThrottle.thrust * 0.5, 1);
    expect(halfThrottle.massFlowRate).toBeCloseTo(fullThrottle.massFlowRate * 0.5, 1);
    // Specific impulse remains the same at constant pressure
    expect(halfThrottle.currentIsp).toBeCloseTo(fullThrottle.currentIsp, 1);
  });

  it('calculates analytical Tsiolkovsky delta-v accurately', () => {
    const isp = 300; // seconds
    const m0 = 100_000; // 100 tons initial mass
    const mf = 10_000;  // 10 tons dry mass (mass ratio 10:1)

    // Delta_v = 300 * 9.80665 * ln(10) ~ 6773.7 m/s
    const deltaV = computeTsiolkovskyDeltaV(isp, m0, mf);
    expect(deltaV).toBeCloseTo(6773.7, 0);
  });

  it('inverts the rocket equation to compute required propellant mass', () => {
    const isp = 300;
    const m0 = 100_000;
    const mf = 10_000;
    const expectedPropMass = m0 - mf;

    // Full round-trip test without float truncation
    const exactDeltaV = computeTsiolkovskyDeltaV(isp, m0, mf);
    const propMass = computeRequiredPropellantMass(exactDeltaV, isp, mf);
    expect(propMass).toBeCloseTo(expectedPropMass, 3);
  });
});
