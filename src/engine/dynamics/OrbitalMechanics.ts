/**
 * Orbital Mechanics & Keplerian State Conversion
 * 
 * Computes the 6 classical Keplerian orbital elements from state vectors [r, v]:
 * 1. a - Semi-major axis (m)
 * 2. e - Eccentricity (dimensionless)
 * 3. i - Inclination (degrees)
 * 4. Omega (RAAN) - Right Ascension of the Ascending Node (degrees)
 * 5. omega - Argument of periapsis (degrees)
 * 6. nu - True anomaly (degrees)
 * 
 * Also computes:
 * - Apoapsis & Periapsis altitudes
 * - Orbital period (T)
 * - Circularization delta-v (Hohmann transfer insertion burn)
 */

import { Vector3D } from '../math/Vector3D';
import { CELESTIAL_BODIES, type CelestialBody } from '../../types/celestial';

export interface KeplerianElements {
  semiMajorAxis: number;       // a (m)
  eccentricity: number;        // e (dimensionless)
  inclination: number;         // i (degrees)
  raan: number;                // RAAN Omega (degrees)
  argumentOfPeriapsis: number; // omega (degrees)
  trueAnomaly: number;         // nu (degrees)
  periapsisAltitude: number;   // r_p - R_body (m)
  apoapsisAltitude: number;    // r_a - R_body (m)
  orbitalPeriod: number;       // T (seconds, Infinity if hyperbolic/parabolic)
  specificEnergy: number;      // E (J/kg)
  isOrbital: boolean;          // true if closed orbit (0 <= e < 1 and r_p > 0)
}

/**
 * Converts Cartesian inertial state vectors [r, v] in ECI into Keplerian orbital elements.
 * 
 * @param position ECI position vector (m)
 * @param velocity ECI velocity vector (m/s)
 * @param body Celestial body (default 'earth')
 */
export function stateVectorsToKeplerian(
  position: Vector3D,
  velocity: Vector3D,
  body: CelestialBody = 'earth'
): KeplerianElements {
  const data = CELESTIAL_BODIES[body];
  const mu = data.mu;
  const R_body = data.radius;

  const r = position.magnitude();
  const v = velocity.magnitude();

  if (r < 1e-3 || v < 1e-3) {
    return {
      semiMajorAxis: 0,
      eccentricity: 0,
      inclination: 0,
      raan: 0,
      argumentOfPeriapsis: 0,
      trueAnomaly: 0,
      periapsisAltitude: -R_body,
      apoapsisAltitude: -R_body,
      orbitalPeriod: 0,
      specificEnergy: 0,
      isOrbital: false
    };
  }

  // 1. Specific angular momentum: h = r x v
  const hVec = position.cross(velocity);
  const h = hVec.magnitude();

  // 2. Node line vector: n = k x h = [-h_y, h_x, 0]
  const nVec = new Vector3D(-hVec.y, hVec.x, 0);
  const n = nVec.magnitude();

  // 3. Eccentricity vector: e = (1 / mu) * [ (v^2 - mu/r)*r - (r . v)*v ]
  const v2_mu_r = v * v - mu / r;
  const r_dot_v = position.dot(velocity);
  const eVec = position.scale(v2_mu_r).subtract(velocity.scale(r_dot_v)).scale(1.0 / mu);
  const e = eVec.magnitude();

  // 4. Specific mechanical energy: epsilon = v^2 / 2 - mu / r
  const specificEnergy = (v * v) * 0.5 - mu / r;

  // 5. Semi-major axis: a = -mu / (2 * epsilon)
  let a: number;
  if (Math.abs(specificEnergy) > 1e-8) {
    a = -mu / (2.0 * specificEnergy);
  } else {
    a = Infinity; // Parabolic trajectory
  }

  const radToDeg = 180.0 / Math.PI;

  // 6. Inclination: i = arccos(h_z / h)
  const iRad = Math.acos(Math.max(-1.0, Math.min(1.0, hVec.z / Math.max(1e-12, h))));
  const inclination = iRad * radToDeg;

  // 7. Longitude of Ascending Node (RAAN): Omega = arccos(n_x / n)
  let raan = 0;
  if (n > 1e-8) {
    const cosOmega = Math.max(-1.0, Math.min(1.0, nVec.x / n));
    raan = Math.acos(cosOmega) * radToDeg;
    if (nVec.y < 0) {
      raan = 360.0 - raan;
    }
  }

  // 8. Argument of Periapsis: omega = arccos(n . e / (n * e))
  let argumentOfPeriapsis = 0;
  if (n > 1e-8 && e > 1e-6) {
    const cosArg = Math.max(-1.0, Math.min(1.0, nVec.dot(eVec) / (n * e)));
    argumentOfPeriapsis = Math.acos(cosArg) * radToDeg;
    if (eVec.z < 0) {
      argumentOfPeriapsis = 360.0 - argumentOfPeriapsis;
    }
  }

  // 9. True Anomaly: nu = arccos(e . r / (e * r))
  let trueAnomaly = 0;
  if (e > 1e-6) {
    const cosNu = Math.max(-1.0, Math.min(1.0, eVec.dot(position) / (e * r)));
    trueAnomaly = Math.acos(cosNu) * radToDeg;
    if (r_dot_v < 0) {
      trueAnomaly = 360.0 - trueAnomaly;
    }
  }

  // Periapsis & Apoapsis
  const periapsisRadius = a * (1.0 - e);
  const periapsisAltitude = periapsisRadius - R_body;

  let apoapsisAltitude: number;
  let orbitalPeriod: number;

  if (e < 1.0) {
    const apoapsisRadius = a * (1.0 + e);
    apoapsisAltitude = apoapsisRadius - R_body;
    orbitalPeriod = 2.0 * Math.PI * Math.sqrt(Math.pow(Math.max(0, a), 3) / mu);
  } else {
    apoapsisAltitude = Infinity;
    orbitalPeriod = Infinity;
  }

  // Closed orbit requires 0 <= e < 1 and periapsis above surface
  const isOrbital = e < 1.0 && periapsisAltitude > 0;

  return {
    semiMajorAxis: a,
    eccentricity: e,
    inclination,
    raan,
    argumentOfPeriapsis,
    trueAnomaly,
    periapsisAltitude,
    apoapsisAltitude,
    orbitalPeriod,
    specificEnergy,
    isOrbital
  };
}

/**
 * Calculates Delta-V required to circularize an eccentric orbit at apoapsis:
 * Delta_v = v_circ(r_a) - v_apoapsis
 * where v_circ = sqrt(mu / r_a) and v_apoapsis = sqrt(mu * (2/r_a - 1/a))
 */
export function calculateApoapsisCircularizationDeltaV(
  semiMajorAxis: number,
  eccentricity: number,
  body: CelestialBody = 'earth'
): number {
  if (eccentricity >= 1.0 || eccentricity <= 1e-6 || semiMajorAxis <= 0) return 0;
  const mu = CELESTIAL_BODIES[body].mu;
  const r_a = semiMajorAxis * (1.0 + eccentricity);

  const v_circ = Math.sqrt(mu / r_a);
  const v_apo = Math.sqrt(Math.max(0, mu * (2.0 / r_a - 1.0 / semiMajorAxis)));

  return Math.abs(v_circ - v_apo);
}
