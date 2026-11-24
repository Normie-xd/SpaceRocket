import { describe, it, expect } from 'vitest';
import { Vector3D } from '../src/engine/math/Vector3D';
import { stateVectorsToKeplerian, calculateApoapsisCircularizationDeltaV } from '../src/engine/dynamics/OrbitalMechanics';

describe('Orbital Mechanics & Keplerian State Conversion', () => {
  it('correctly converts Low Earth Circular Orbit state vectors to orbital elements', () => {
    const R_E = 6_371_000;
    const alt = 400_000; // 400 km orbit
    const rOrbit = R_E + alt;
    const mu = 3.986004418e14;
    const vCirc = Math.sqrt(mu / rOrbit); // ~7.67 km/s

    // Equatorial orbit along XY plane
    const position = new Vector3D(rOrbit, 0, 0);
    const velocity = new Vector3D(0, vCirc, 0);

    const elements = stateVectorsToKeplerian(position, velocity, 'earth');

    expect(elements.semiMajorAxis).toBeCloseTo(rOrbit, -2);
    expect(elements.eccentricity).toBeCloseTo(0.0, 3); // Circular orbit
    expect(elements.inclination).toBeCloseTo(0.0, 2);  // Equatorial
    expect(elements.periapsisAltitude).toBeCloseTo(alt, -2);
    expect(elements.apoapsisAltitude).toBeCloseTo(alt, -2);
    expect(elements.isOrbital).toBe(true);

    // Orbital period for 400 km ~ 92.5 minutes (5550 s)
    expect(elements.orbitalPeriod).toBeCloseTo(5550, -2);
  });

  it('accurately resolves an eccentric elliptical transfer orbit (GTO style)', () => {
    const R_E = 6_371_000;
    const r_p = R_E + 200_000;    // Periapsis at 200 km LEO
    const r_a = R_E + 35_786_000; // Apoapsis at Geostationary altitude ~35,786 km

    const a = (r_p + r_a) / 2.0;
    const e = (r_a - r_p) / (r_a + r_p);
    const mu = 3.986004418e14;

    // Velocity at periapsis: v_p = sqrt(mu * (2/r_p - 1/a))
    const v_p = Math.sqrt(mu * (2.0 / r_p - 1.0 / a));

    const position = new Vector3D(r_p, 0, 0);
    const velocity = new Vector3D(0, v_p, 0);

    const elements = stateVectorsToKeplerian(position, velocity, 'earth');

    expect(elements.eccentricity).toBeCloseTo(e, 3); // Highly eccentric ~0.72
    expect(elements.periapsisAltitude).toBeCloseTo(200_000, -3);
    expect(elements.apoapsisAltitude).toBeCloseTo(35_786_000, -3);
    expect(elements.isOrbital).toBe(true);

    // Circularization Delta-V at apoapsis should be ~1460 m/s for GTO
    const circDeltaV = calculateApoapsisCircularizationDeltaV(elements.semiMajorAxis, elements.eccentricity, 'earth');
    expect(circDeltaV).toBeCloseTo(1460, -2);
  });
});
