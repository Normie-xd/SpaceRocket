/**
 * Aerodynamic Drag & Dynamic Pressure Model
 * 
 * Accurately models the drag coefficient (Cd) across aerodynamic regimes:
 * - Subsonic (M < 0.8)
 * - Transonic drag rise / wave drag peak (0.8 <= M < 1.2)
 * - Supersonic decay (1.2 <= M < 5.0)
 * - Hypersonic asymptote (M >= 5.0)
 * 
 * Also calculates:
 * - Dynamic pressure q = 0.5 * rho * v^2
 * - Aerodynamic drag force F_drag = q * Cd * Area
 * - Stagnation temperature T_stag = T * (1 + 0.5 * (gamma - 1) * M^2)
 */

import { GAMMA_AIR } from '../atmosphere/ISA';

export interface AerodynamicForces {
  mach: number;
  dragCoefficient: number;
  dynamicPressure: number; // Pa (q)
  dragForce: number;       // Newtons (opposite to velocity vector)
  stagnationTemperature: number; // K
}

/**
 * Calculates the drag coefficient Cd for a streamlined rocket body as a function of Mach number.
 * 
 * @param mach Mach number (v / a)
 * @param cdSubsonic Base subsonic drag coefficient (typically 0.20 to 0.35 for a rocket)
 * @returns Mach-adjusted drag coefficient Cd
 */
export function calculateRocketCd(mach: number, cdSubsonic: number = 0.25): number {
  const M = Math.max(0, mach);

  if (M < 0.8) {
    // Pure subsonic: slight compressibility rise
    // Prandtl-Glauert compressibility correction up to critical Mach
    const compressibility = 1.0 / Math.sqrt(Math.max(0.1, 1.0 - 0.5 * M * M));
    return cdSubsonic * compressibility * 0.95;
  } else if (M < 1.05) {
    // Transonic rise (wave drag forms rapidly)
    // Steep rise from M=0.8 to transonic peak around M=1.05
    const t = (M - 0.8) / 0.25; // normalized 0 to 1
    // Smooth step (Hermite interpolation)
    const smoothT = t * t * (3 - 2 * t);
    const cdPeak = cdSubsonic * 2.3; // Peak drag roughly 2.3x subsonic
    const cd08 = cdSubsonic * 1.1;
    return cd08 + smoothT * (cdPeak - cd08);
  } else if (M < 1.4) {
    // Transonic peak to early supersonic drop
    const t = (M - 1.05) / 0.35;
    const cdPeak = cdSubsonic * 2.3;
    const cd14 = cdSubsonic * 1.7;
    return cdPeak - t * (cdPeak - cd14);
  } else if (M < 5.0) {
    // Supersonic decay: roughly follows 1 / sqrt(M^2 - 1) behavior
    // Wave drag decreases as shock angle steepens
    const cdPeakSupersonic = cdSubsonic * 1.7;
    const factor = 1.4 / Math.sqrt(M * M - 1.0 + 1.2);
    return Math.max(cdSubsonic * 1.1, cdPeakSupersonic * factor);
  } else {
    // Hypersonic regime (M >= 5.0)
    // Modified Newtonian impact theory: Cd flattens to a constant asymptotic value
    return cdSubsonic * 1.15;
  }
}

/**
 * Computes aerodynamic parameters given atmospheric state and rocket kinematics.
 * 
 * @param velocity Relative airspeed (m/s)
 * @param atmosphericDensity Air density rho (kg/m^3)
 * @param speedOfSound Local speed of sound a (m/s)
 * @param ambientTemperature Local ambient temperature T (K)
 * @param crossSectionalArea Rocket frontal reference area A (m^2)
 * @param baseCd Subsonic drag coefficient baseline (default 0.25)
 */
export function computeAerodynamics(
  velocity: number,
  atmosphericDensity: number,
  speedOfSound: number,
  ambientTemperature: number,
  crossSectionalArea: number,
  baseCd: number = 0.25
): AerodynamicForces {
  const v = Math.max(0, velocity);
  const a = Math.max(1, speedOfSound);
  const mach = v / a;

  // Dynamic pressure q = 0.5 * rho * v^2
  const dynamicPressure = 0.5 * atmosphericDensity * v * v;

  // Cd adjusted for Mach
  const dragCoefficient = calculateRocketCd(mach, baseCd);

  // Drag Force = q * Cd * A
  const dragForce = dynamicPressure * dragCoefficient * crossSectionalArea;

  // Adiabatic stagnation temperature (aerodynamic heating)
  // T_stag = T_amb * (1 + 0.5 * (gamma - 1) * M^2)
  const stagnationTemperature = ambientTemperature * (1 + 0.5 * (GAMMA_AIR - 1) * mach * mach);

  return {
    mach,
    dragCoefficient,
    dynamicPressure,
    dragForce,
    stagnationTemperature
  };
}
