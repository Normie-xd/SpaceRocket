import { describe, it, expect } from 'vitest';
import { calculateRocketCd, computeAerodynamics } from '../src/engine/aerodynamics/DragModel';

describe('Aerodynamics & Drag Model', () => {
  it('exhibits realistic subsonic drag baseline', () => {
    const cdSubsonic = 0.25;
    const cdMach03 = calculateRocketCd(0.3, cdSubsonic);
    const cdMach06 = calculateRocketCd(0.6, cdSubsonic);

    expect(cdMach03).toBeCloseTo(cdSubsonic, 1);
    expect(cdMach06).toBeGreaterThanOrEqual(cdMach03); // Slight compressibility rise
  });

  it('captures the transonic drag rise (wave drag peak)', () => {
    const cdSubsonic = 0.25;
    const cdMach07 = calculateRocketCd(0.7, cdSubsonic);
    const cdMach105 = calculateRocketCd(1.05, cdSubsonic); // Transonic peak

    // Transonic drag should be significantly higher than subsonic (typically ~2x to 2.5x)
    expect(cdMach105).toBeGreaterThan(cdMach07 * 1.8);
    expect(cdMach105).toBeGreaterThanOrEqual(0.5);
  });

  it('shows supersonic drag decay after transonic shock peak', () => {
    const cdSubsonic = 0.25;
    const cdMach105 = calculateRocketCd(1.05, cdSubsonic);
    const cdMach20 = calculateRocketCd(2.0, cdSubsonic);
    const cdMach40 = calculateRocketCd(4.0, cdSubsonic);

    // Cd decreases as Mach increases beyond Mach 1.05
    expect(cdMach20).toBeLessThan(cdMach105);
    expect(cdMach40).toBeLessThan(cdMach20);
  });

  it('calculates dynamic pressure and drag force accurately', () => {
    const density = 1.225; // kg/m^3 (sea level)
    const velocity = 100;  // m/s (~360 km/h)
    const area = 10.0;     // m^2 (e.g. Falcon 9 class rocket ~ 10.5 m^2)
    const speedOfSound = 340.0;
    const temp = 288.15;

    const aero = computeAerodynamics(velocity, density, speedOfSound, temp, area, 0.25);

    // q = 0.5 * rho * v^2 = 0.5 * 1.225 * 100^2 = 6125 Pa
    expect(aero.dynamicPressure).toBeCloseTo(6125, 1);
    expect(aero.mach).toBeCloseTo(100 / 340, 3);

    // F_drag = q * Cd * A
    expect(aero.dragForce).toBeCloseTo(6125 * aero.dragCoefficient * area, 1);
    expect(aero.stagnationTemperature).toBeGreaterThan(temp);
  });
});
