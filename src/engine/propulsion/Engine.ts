/**
 * Propulsion & Rocket Engine Physics
 * 
 * Accurately models:
 * - Real rocket thrust equation: F = F_vac - P_ambient * A_exit
 * - Ambient-pressure dependent specific impulse Isp(P_a)
 * - Fuel mass flow rate: m_dot = F_vac / (Isp_vac * g0)
 * - Cluster engine calculations (quantity * per-engine thrust)
 * - Tsiolkovsky delta-v equation: Delta_v = Isp * g0 * ln(m0 / mf)
 */

import { G0 } from '../atmosphere/ISA';
import type { EngineParams } from '../../types/rocket';

export const SEA_LEVEL_PRESSURE = 101325.0; // Pa (1 atm)

export interface EngineState {
  thrust: number;           // Current net thrust (N)
  massFlowRate: number;     // Total propellant consumption rate (kg/s)
  currentIsp: number;       // Current effective specific impulse (s)
  exhaustVelocity: number;  // Effective exhaust velocity c = Isp * g0 (m/s)
  ambientPressure: number;  // Ambient atmospheric pressure (Pa)
  isFiring: boolean;
}

/**
 * Calculates the nozzle exit area given sea level and vacuum parameters,
 * or from geometric nozzle exit diameter if provided.
 */
export function calculateNozzleExitArea(engine: EngineParams): number {
  // If both vacuum and sea level thrust are explicitly specified,
  // derive the effective exit area to match the exact specified sea level thrust:
  // F_vac - F_sl = P_sl * A_exit
  if (engine.thrustVacuum > engine.thrustSeaLevel && engine.thrustSeaLevel > 0) {
    return (engine.thrustVacuum - engine.thrustSeaLevel) / SEA_LEVEL_PRESSURE;
  }

  // Geometric area from diameter
  if (engine.nozzleExitDiameter && engine.nozzleExitDiameter > 0) {
    const radius = engine.nozzleExitDiameter / 2.0;
    return Math.PI * radius * radius;
  }

  // Fallback for vacuum-only or theoretical engines
  return 0.1; // m^2 default
}

/**
 * Computes instantaneous engine performance at a given ambient atmospheric pressure.
 * 
 * @param engine Engine configuration parameters
 * @param ambientPressure Ambient atmospheric pressure Pa (0 in vacuum, 101,325 Pa at SL)
 * @param throttle Current throttle fraction (0.0 to 1.0)
 */
export function computeEnginePerformance(
  engine: EngineParams,
  ambientPressure: number,
  throttle: number = 1.0
): EngineState {
  const t = Math.max(0.0, Math.min(1.0, throttle));
  const Pa = Math.max(0.0, ambientPressure);
  const qty = Math.max(1, engine.quantity || 1);

  if (t === 0.0) {
    return {
      thrust: 0.0,
      massFlowRate: 0.0,
      currentIsp: engine.ispVacuum,
      exhaustVelocity: engine.ispVacuum * G0,
      ambientPressure: Pa,
      isFiring: false
    };
  }

  const exitArea = calculateNozzleExitArea(engine);

  // Single engine vacuum thrust & mass flow
  // m_dot = F_vac / (Isp_vac * g0)
  const singleMassFlow = engine.thrustVacuum / (engine.ispVacuum * G0);
  const totalMassFlow = singleMassFlow * qty * t;

  // Single engine thrust at pressure Pa:
  // F(Pa) = F_vac - Pa * A_exit
  // Note: Rocket thrust doesn't drop below 0 if ambient pressure is extreme (e.g. Venus),
  // flow separation occurs, so we clamp thrust to non-negative.
  const singleThrustAtPa = Math.max(0.0, engine.thrustVacuum - Pa * exitArea);
  const totalThrust = singleThrustAtPa * qty * t;

  // Effective Isp at current pressure:
  // Isp(Pa) = F / (m_dot * g0)
  const effectiveIsp = totalMassFlow > 0 ? totalThrust / (totalMassFlow * G0) : engine.ispVacuum;
  const exhaustVelocity = effectiveIsp * G0;

  return {
    thrust: totalThrust,
    massFlowRate: totalMassFlow,
    currentIsp: effectiveIsp,
    exhaustVelocity,
    ambientPressure: Pa,
    isFiring: totalThrust > 0
  };
}

/**
 * Calculates ideal Tsiolkovsky delta-v for a stage.
 * Delta_v = Isp * g0 * ln(m0 / mf)
 * 
 * @param isp Specific impulse (seconds)
 * @param initialMass Wet mass m0 (kg)
 * @param finalMass Dry/burnout mass mf (kg)
 */
export function computeTsiolkovskyDeltaV(
  isp: number,
  initialMass: number,
  finalMass: number
): number {
  if (finalMass <= 0 || initialMass <= finalMass || isp <= 0) {
    return 0;
  }
  return isp * G0 * Math.log(initialMass / finalMass);
}

/**
 * Calculates the required propellant mass to achieve a desired delta-v.
 * m_prop = m_dry * (exp(Delta_v / (Isp * g0)) - 1)
 */
export function computeRequiredPropellantMass(
  targetDeltaV: number,
  isp: number,
  dryMass: number
): number {
  if (targetDeltaV <= 0 || isp <= 0 || dryMass <= 0) return 0;
  const massRatio = Math.exp(targetDeltaV / (isp * G0));
  return dryMass * (massRatio - 1.0);
}
