import { describe, it, expect } from 'vitest';
import { computePreflightAnalysis } from '../src/engine/analytics/PreflightAnalysis';
import { ROCKET_PRESETS } from '../src/views/RocketBuilder/RocketPresets';

describe('Pre-Flight Aerospace Analytics Engine', () => {
  it('correctly evaluates Zephyr-1 Two-Stage Orbital Launcher', () => {
    const zephyr1 = ROCKET_PRESETS[1];
    const report = computePreflightAnalysis(zephyr1);

    // 1. Total Mass properties
    expect(report.totalWetMass).toBeGreaterThan(450_000); // ~500 tons class
    expect(report.propellantFraction).toBeGreaterThan(0.85); // High mass ratio required for orbit

    // 2. Liftoff TWR
    expect(report.liftoffTWR).toBeGreaterThan(1.2); // Capable of positive liftoff
    expect(report.flightFeasibility.canLiftoff).toBe(true);

    // 3. Stage Delta-V & Total Delta-V
    expect(report.stages.length).toBe(2);
    expect(report.totalDeltaV).toBeGreaterThan(9000); // Full Earth LEO orbit capable
    expect(report.flightFeasibility.isOrbitCapable).toBe(true);

    // 4. Stability
    expect(report.stability.isStable).toBe(true);
    expect(report.stability.staticMarginCalibers).toBeGreaterThan(1.0);
  });

  it('correctly assesses Sounding Rocket Alpha as suborbital vehicle', () => {
    const sounding = ROCKET_PRESETS[0];
    const report = computePreflightAnalysis(sounding);

    expect(report.totalWetMass).toBeLessThan(1000); // Light sounding rocket
    expect(report.flightFeasibility.canLiftoff).toBe(true);
    expect(report.flightFeasibility.isOrbitCapable).toBe(false); // Suborbital
    expect(report.stages.length).toBe(1);
  });
});
