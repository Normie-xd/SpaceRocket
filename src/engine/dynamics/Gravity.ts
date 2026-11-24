/**
 * Celestial Gravity & Orbital Dynamics Models
 * 
 * Implements:
 * - Inverse-square law gravity for any celestial body: g = mu / r^2
 * - WGS84 Earth gravity with altitude variation: g(h) = g0 * (R_E / (R_E + h))^2
 * - J2 perturbation effect (Earth oblateness equatorial bulge)
 * - Orbital velocity and escape velocity equations:
 *   v_circ = sqrt(mu / r)
 *   v_esc = sqrt(2 * mu / r)
 * - Earth rotational surface velocity at latitude phi
 */

import { CELESTIAL_BODIES, type CelestialBody } from '../../types/celestial';

// WGS84 Earth Parameters
export const WGS84_A = 6378137.0;            // Semi-major axis (m)
export const WGS84_B = 6356752.314245;       // Semi-minor axis (m)
export const WGS84_F = 1.0 / 298.257223563;  // Flattening
export const WGS84_MU = 3.986004418e14;      // Geocentric gravitational constant (m^3/s^2)
export const WGS84_J2 = 1.08262668e-3;       // Second zonal harmonic (oblateness)
export const EARTH_OMEGA = 7.292115e-5;      // Earth angular rotation rate (rad/s)

/**
 * Computes the gravitational acceleration magnitude at a given altitude above surface.
 * 
 * @param altitude Altitude above body surface (m)
 * @param body Celestial body identifier (default 'earth')
 */
export function computeGravity(altitude: number, body: CelestialBody = 'earth'): number {
  const data = CELESTIAL_BODIES[body];
  const r = Math.max(1.0, data.radius + altitude);
  return data.mu / (r * r);
}

/**
 * Computes circular orbit velocity at a given orbital radius.
 * v = sqrt(mu / r)
 */
export function computeCircularOrbitVelocity(altitude: number, body: CelestialBody = 'earth'): number {
  const data = CELESTIAL_BODIES[body];
  const r = Math.max(1.0, data.radius + altitude);
  return Math.sqrt(data.mu / r);
}

/**
 * Computes escape velocity at a given orbital radius.
 * v_esc = sqrt(2 * mu / r)
 */
export function computeEscapeVelocity(altitude: number, body: CelestialBody = 'earth'): number {
  const data = CELESTIAL_BODIES[body];
  const r = Math.max(1.0, data.radius + altitude);
  return Math.sqrt((2.0 * data.mu) / r);
}

/**
 * Computes Earth's surface rotational speed at a given latitude (Eastward assist for launch).
 * v_rot = omega * R_eff * cos(latitude)
 * 
 * @param latitudeDegrees Geodetic latitude in degrees (-90 to +90)
 */
export function computeSurfaceRotationalSpeed(latitudeDegrees: number): number {
  const latRad = (latitudeDegrees * Math.PI) / 180.0;
  // Radius at latitude phi considering Earth flattening
  const cosLat = Math.cos(latRad);
  const sinLat = Math.sin(latRad);
  const a = WGS84_A;
  const b = WGS84_B;
  const rAtLat = (a * b) / Math.sqrt((b * cosLat) ** 2 + (a * sinLat) ** 2);
  return EARTH_OMEGA * rAtLat * cosLat;
}

/**
 * Gravitational acceleration vector in Earth-Centered Inertial (ECI) coordinates,
 * including J2 oblateness perturbation.
 * 
 * @param x ECI X position (m)
 * @param y ECI Y position (m)
 * @param z ECI Z position (m) - polar axis
 */
export function computeGravityVectorJ2(x: number, y: number, z: number): [number, number, number] {
  const r2 = x * x + y * y + z * z;
  const r = Math.sqrt(r2);
  if (r < 1.0) return [0, 0, 0];

  const mu = WGS84_MU;
  const a = WGS84_A;
  const j2 = WGS84_J2;

  const invR = 1.0 / r;
  const invR3 = invR / r2;
  const z2_r2 = (z * z) / r2;

  // J2 factor: 1.5 * J2 * (a / r)^2
  const j2Factor = 1.5 * j2 * ((a * a) / r2);

  // Acceleration components with J2 correction:
  // a_x = - (mu / r^3) * x * (1 - j2Factor * (5 * (z/r)^2 - 1))
  // a_y = - (mu / r^3) * y * (1 - j2Factor * (5 * (z/r)^2 - 1))
  // a_z = - (mu / r^3) * z * (1 - j2Factor * (5 * (z/r)^2 - 3))
  const commonTerm = 1.0 - j2Factor * (5.0 * z2_r2 - 1.0);
  const zTerm = 1.0 - j2Factor * (5.0 * z2_r2 - 3.0);

  const ax = -mu * invR3 * x * commonTerm;
  const ay = -mu * invR3 * y * commonTerm;
  const az = -mu * invR3 * z * zTerm;

  return [ax, ay, az];
}
