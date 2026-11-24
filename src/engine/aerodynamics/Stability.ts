/**
 * Barrowman Stability Equations & Center of Pressure (CoP) Analysis
 * 
 * Implements the standard James Barrowman method (1966) for calculating:
 * - Normal force coefficient slope (C_Na) for nose cones, body tubes, transitions, and fins
 * - Longitudinal location of Center of Pressure (X_cp) measured from nose tip
 * - Longitudinal location of Center of Mass (X_cg)
 * - Static stability margin in calibers (calibers = (X_cp - X_cg) / D_ref)
 * 
 * Stability rule of thumb:
 * - Margin >= 1.0 calibers: Aerodynamically stable (rocket points into relative wind)
 * - Margin between 0 and 1.0: Marginally stable
 * - Margin < 0: Aerodynamically unstable (will tumble without active TVC gimbal control)
 */

import type { RocketDesign, NoseCone, Fin, BodyTube, PropellantTank, Engine } from '../../types/rocket';

export interface StabilityReport {
  centerOfMass: number;      // X_cg from nose tip (m)
  centerOfPressure: number;  // X_cp from nose tip (m)
  staticMarginCalibers: number; // (X_cp - X_cg) / D_ref
  referenceDiameter: number; // D_ref (m)
  totalNormalForceSlope: number; // C_Na (per radian)
  isStable: boolean;
  warning?: string;
}

/**
 * Computes the Center of Pressure (CoP) using the Barrowman method.
 * Assumes components are arranged sequentially from nose to tail.
 */
export function calculateBarrowmanStability(design: RocketDesign): StabilityReport {
  let currentX = 0; // Cumulative distance from nose tip (m)
  let sumCNa_Xcp = 0;
  let totalCNa = 0;
  let referenceDiameter = 0.1; // Default fallback

  let totalMass = 0;
  let sumMass_Xcg = 0;

  for (const comp of design.components) {
    switch (comp.type) {
      case 'noseCone': {
        const nc = comp as NoseCone;
        const L = nc.parameters.length;
        const d = nc.parameters.baseDiameter;
        referenceDiameter = Math.max(referenceDiameter, d);

        // Barrowman Nose Cone formulas:
        // C_Na = 2.0 (for virtually all sharp nose cone shapes at low angle of attack)
        const C_Na = 2.0;
        let x_cp_local = 0;

        if (nc.parameters.shape === 'conical') {
          x_cp_local = (2.0 / 3.0) * L;
        } else if (nc.parameters.shape === 'ogive' || nc.parameters.shape === 'parabolic') {
          x_cp_local = 0.466 * L;
        } else if (nc.parameters.shape === 'vonKarman') {
          x_cp_local = 0.5 * L;
        } else {
          x_cp_local = 0.466 * L;
        }

        const x_cp_global = currentX + x_cp_local;
        sumCNa_Xcp += C_Na * x_cp_global;
        totalCNa += C_Na;

        // Mass contribution
        const m = nc.parameters.mass || 10;
        const x_cg_comp = currentX + L * 0.5;
        sumMass_Xcg += m * x_cg_comp;
        totalMass += m;

        currentX += L;
        break;
      }

      case 'bodyTube': {
        const bt = comp as BodyTube;
        const L = bt.parameters.length;
        const d = bt.parameters.outerDiameter;
        referenceDiameter = Math.max(referenceDiameter, d);

        // Body tubes contribute negligible normal force at small angles of attack
        const m = bt.parameters.mass || 50;
        const x_cg_comp = currentX + L * 0.5;
        sumMass_Xcg += m * x_cg_comp;
        totalMass += m;

        currentX += L;
        break;
      }

      case 'propellantTank': {
        const pt = comp as PropellantTank;
        const L = pt.parameters.length;
        const d = pt.parameters.outerDiameter;
        referenceDiameter = Math.max(referenceDiameter, d);

        // Mass = structural + current propellants
        const m = pt.parameters.structuralMass + pt.parameters.propellantMass + (pt.parameters.oxidiserMass || 0);
        const x_cg_comp = currentX + L * 0.5;
        sumMass_Xcg += m * x_cg_comp;
        totalMass += m;

        currentX += L;
        break;
      }

      case 'engine': {
        const eng = comp as Engine;
        const m = (eng.parameters.mass || 500) * (eng.parameters.quantity || 1);
        const L = 1.5; // Approximate engine length
        const x_cg_comp = currentX + L * 0.6;
        sumMass_Xcg += m * x_cg_comp;
        totalMass += m;

        currentX += L;
        break;
      }

      case 'fin': {
        const fin = comp as Fin;
        const p = fin.parameters;
        const N = p.quantity || 4;
        const cr = p.rootChord;
        const ct = p.tipChord;
        const s = p.span;
        const d = referenceDiameter;
        const r0 = d * 0.5;

        // Barrowman Fin normal force coefficient:
        // C_Na_fin = (1 + R / (s + R)) * [ (4 * N * (s / d)^2) / (1 + sqrt(1 + (2 * LF / (cr + ct))^2)) ]
        // where LF = mid-chord line length = sqrt( s^2 + (gamma - 0.5*cr + 0.5*ct)^2 )
        const sweepRad = ((p.sweepAngle || 30) * Math.PI) / 180.0;
        const deltaX = s * Math.tan(sweepRad);
        const LF = Math.sqrt(s * s + Math.pow(deltaX + 0.5 * ct - 0.5 * cr, 2));

        const bodyInterference = 1.0 + r0 / (s + r0);
        const denom = 1.0 + Math.sqrt(1.0 + Math.pow((2.0 * LF) / (cr + ct), 2));
        const C_Na_fin = bodyInterference * ((4.0 * N * Math.pow(s / d, 2)) / denom);

        // Fin Center of Pressure (measured from root chord leading edge)
        const x_cp_fin_local =
          (deltaX / 3.0) * ((cr + 2.0 * ct) / (cr + ct)) +
          (1.0 / 6.0) * (cr + ct - (cr * ct) / (cr + ct));

        // Global position of fin attachment
        const finAttachX = p.attachPosition !== undefined ? p.attachPosition : currentX - cr;
        const x_cp_global = finAttachX + x_cp_fin_local;

        sumCNa_Xcp += C_Na_fin * x_cp_global;
        totalCNa += C_Na_fin;

        // Fin mass
        const m = p.mass || 20;
        sumMass_Xcg += m * (finAttachX + cr * 0.5);
        totalMass += m;
        break;
      }

      default: {
        // Generic mass contribution
        const generic = comp as any;
        const m = generic.parameters?.mass || 10;
        sumMass_Xcg += m * currentX;
        totalMass += m;
        break;
      }
    }
  }

  const centerOfMass = totalMass > 0 ? sumMass_Xcg / totalMass : currentX * 0.5;
  const centerOfPressure = totalCNa > 0 ? sumCNa_Xcp / totalCNa : currentX * 0.6;
  const staticMarginCalibers = referenceDiameter > 0 ? (centerOfPressure - centerOfMass) / referenceDiameter : 0;
  const isStable = staticMarginCalibers >= 1.0;

  let warning: string | undefined;
  if (staticMarginCalibers < 0) {
    warning = 'Aerodynamically unstable! Center of pressure is ahead of center of mass. Requires active TVC.';
  } else if (staticMarginCalibers < 1.0) {
    warning = 'Marginally stable. Margin is less than 1.0 caliber; high wind shear may cause instability.';
  } else if (staticMarginCalibers > 4.0) {
    warning = 'Over-stable. Rocket may turn aggressively into crosswinds (weathercocking).';
  }

  return {
    centerOfMass,
    centerOfPressure,
    staticMarginCalibers,
    referenceDiameter,
    totalNormalForceSlope: totalCNa,
    isStable,
    warning
  };
}
