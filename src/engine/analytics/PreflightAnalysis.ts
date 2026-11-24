/**
 * Pre-Flight Aerospace Analytics & Performance Calculator
 * 
 * Analyzes a full rocket design prior to launch:
 * - Stage-by-stage Delta-V budget (Tsiolkovsky equation accounting for upper stage payload mass)
 * - Sea-level & vacuum Thrust-to-Weight Ratio (TWR)
 * - Mass breakdown: Dry structural mass, Propellant mass, Payload mass fraction
 * - Barrowman Aerodynamic Stability Margin (calibers)
 * - Flight feasibility assessment (LEO capable, Suborbital, Unstable, Insufficient TWR)
 */

import { computeTsiolkovskyDeltaV } from '../propulsion/Engine';
import { calculateBarrowmanStability, type StabilityReport } from '../aerodynamics/Stability';
import { G0 } from '../atmosphere/ISA';
import type { RocketDesign, Engine, PropellantTank } from '../../types/rocket';

export interface StagePerformance {
  stageIndex: number;
  name: string;
  stageWetMass: number;        // kg (including all stages above it)
  stageDryMass: number;        // kg (including all stages above it at burnout)
  propellantMass: number;      // kg
  structuralMass: number;      // kg (just this stage)
  thrustSeaLevel: number;      // N
  thrustVacuum: number;        // N
  twrSeaLevel: number;         // TWR at liftoff/ignition
  twrVacuum: number;           // TWR in vacuum
  averageIsp: number;          // seconds
  burnTime: number;            // seconds
  deltaV: number;              // m/s
}

export interface PreflightReport {
  totalWetMass: number;        // kg
  totalDryMass: number;        // kg
  totalPropellantMass: number; // kg
  propellantFraction: number;  // 0.0 to 1.0
  totalDeltaV: number;         // m/s
  liftoffTWR: number;          // TWR at T=0
  stages: StagePerformance[];
  stability: StabilityReport;
  flightFeasibility: {
    canLiftoff: boolean;
    isStable: boolean;
    isOrbitCapable: boolean;   // Delta-V > 9,000 m/s for Earth LEO
    summary: string;
    warnings: string[];
  };
}

export function computePreflightAnalysis(design: RocketDesign): PreflightReport {
  const warnings: string[] = [];

  // 1. Group components into stages based on Separator elements
  // Standard rocketry convention: if Nose Cone/Fairing is first, rocket is ordered top-to-bottom.
  // In that case, reverse components so we process from bottom booster stage (Stage 1) up to upper stage.
  const isTopDown = design.components.length > 0 &&
    (design.components[0].type === 'noseCone' || design.components[0].type === 'fairing' || design.components[0].type === 'payload');

  const orderedComponents = isTopDown ? [...design.components].reverse() : [...design.components];

  interface RawStage {
    index: number;
    name: string;
    engines: Engine[];
    tanks: PropellantTank[];
    structuralMass: number;
    propellantMass: number;
  }

  const rawStages: RawStage[] = [];
  let currentStage: RawStage = {
    index: 0,
    name: 'Stage 1 (Booster)',
    engines: [],
    tanks: [],
    structuralMass: 0,
    propellantMass: 0
  };

  for (const comp of orderedComponents) {
    if (comp.type === 'separator') {
      rawStages.push(currentStage);
      currentStage = {
        index: rawStages.length,
        name: `Stage ${rawStages.length + 1}`,
        engines: [],
        tanks: [],
        structuralMass: (comp.parameters as any).mass || 200,
        propellantMass: 0
      };
    } else if (comp.type === 'engine') {
      const eng = comp as Engine;
      currentStage.engines.push(eng);
      currentStage.structuralMass += (eng.parameters.mass || 500) * (eng.parameters.quantity || 1);
    } else if (comp.type === 'propellantTank') {
      const tank = comp as PropellantTank;
      currentStage.tanks.push(tank);
      const prop = tank.parameters.propellantMass + (tank.parameters.oxidiserMass || 0);
      currentStage.propellantMass += prop;
      currentStage.structuralMass += tank.parameters.structuralMass || 1000;
    } else {
      const generic = comp as any;
      currentStage.structuralMass += generic.parameters?.mass || 50;
    }
  }
  rawStages.push(currentStage);

  // 2. Compute masses from top stage down to bottom stage
  let cumulativeMassAbove = 0;
  const stagePerformances: StagePerformance[] = [];
  let totalDeltaV = 0;

  for (let i = rawStages.length - 1; i >= 0; i--) {
    const raw = rawStages[i];
    const initialMass = raw.structuralMass + raw.propellantMass + cumulativeMassAbove;
    const burnoutMass = raw.structuralMass + cumulativeMassAbove;

    let totalThrustVac = 0;
    let totalThrustSL = 0;
    let weightedIspSum = 0;
    let totalMassFlow = 0;

    for (const eng of raw.engines) {
      const qty = eng.parameters.quantity || 1;
      const fVac = eng.parameters.thrustVacuum * qty;
      const fSL = eng.parameters.thrustSeaLevel * qty;
      const ispVac = eng.parameters.ispVacuum;

      totalThrustVac += fVac;
      totalThrustSL += fSL;

      const mdot = fVac / (ispVac * G0);
      totalMassFlow += mdot;
      weightedIspSum += ispVac * mdot;
    }

    const avgIsp = totalMassFlow > 0 ? weightedIspSum / totalMassFlow : 300;
    const burnTime = totalMassFlow > 0 ? raw.propellantMass / totalMassFlow : 0;
    const stageDeltaV = computeTsiolkovskyDeltaV(avgIsp, initialMass, burnoutMass);
    totalDeltaV += stageDeltaV;

    const twrSL = initialMass > 0 ? totalThrustSL / (initialMass * G0) : 0;
    const twrVac = initialMass > 0 ? totalThrustVac / (initialMass * G0) : 0;

    stagePerformances.unshift({
      stageIndex: raw.index,
      name: raw.name,
      stageWetMass: initialMass,
      stageDryMass: burnoutMass,
      propellantMass: raw.propellantMass,
      structuralMass: raw.structuralMass,
      thrustSeaLevel: totalThrustSL,
      thrustVacuum: totalThrustVac,
      twrSeaLevel: twrSL,
      twrVacuum: twrVac,
      averageIsp: avgIsp,
      burnTime,
      deltaV: stageDeltaV
    });

    cumulativeMassAbove = initialMass;
  }

  // 3. Overall mass properties
  let totalWetMass = 0;
  let totalDryMass = 0;
  let totalPropellantMass = 0;

  for (const s of rawStages) {
    totalDryMass += s.structuralMass;
    totalPropellantMass += s.propellantMass;
  }
  totalWetMass = totalDryMass + totalPropellantMass;
  const propellantFraction = totalWetMass > 0 ? totalPropellantMass / totalWetMass : 0;

  // 4. Barrowman Stability
  const stability = calculateBarrowmanStability(design);

  // 5. Feasibility checks
  const liftoffTWR = stagePerformances[0]?.twrSeaLevel || 0;
  const canLiftoff = liftoffTWR >= 1.15;
  const isStable = stability.isStable;
  const isOrbitCapable = totalDeltaV >= 9000; // Standard LEO budget (including ~1.5km/s gravity/drag losses)

  if (liftoffTWR < 1.0) {
    warnings.push(`Liftoff TWR is ${liftoffTWR.toFixed(2)} (< 1.0). The rocket cannot overcome gravity and will not lift off the pad.`);
  } else if (liftoffTWR < 1.2) {
    warnings.push(`Low liftoff TWR (${liftoffTWR.toFixed(2)}). Rocket will ascend slowly, incurring heavy gravitational delta-v losses.`);
  }

  if (!isStable) {
    warnings.push(`Aerodynamic instability detected (${stability.staticMarginCalibers.toFixed(1)} calibers). Center of Pressure is ahead of Center of Mass.`);
  }

  if (totalDeltaV < 3000) {
    warnings.push(`Low total Delta-V (${Math.round(totalDeltaV)} m/s). Vehicle is limited to suborbital sounding flights.`);
  }

  let summary = 'Ready for Flight';
  if (!canLiftoff) {
    summary = 'Launch Blocked — Insufficient Thrust';
  } else if (!isStable) {
    summary = 'Caution — Aerodynamically Unstable';
  } else if (isOrbitCapable) {
    summary = 'Orbital Launch Capable (LEO)';
  } else {
    summary = 'Suborbital Trajectory Capable';
  }

  return {
    totalWetMass,
    totalDryMass,
    totalPropellantMass,
    propellantFraction,
    totalDeltaV,
    liftoffTWR,
    stages: stagePerformances,
    stability,
    flightFeasibility: {
      canLiftoff,
      isStable,
      isOrbitCapable,
      summary,
      warnings
    }
  };
}
