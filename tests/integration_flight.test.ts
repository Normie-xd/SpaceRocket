import { describe, it, expect } from 'vitest';
import { Vector3D } from '../src/engine/math/Vector3D';
import { Quaternion } from '../src/engine/math/Quaternion';
import { step6DOF, type SixDOFState, type RocketPhysicalProperties, type GuidanceCommand } from '../src/engine/dynamics/SixDOF';
import { StagingController } from '../src/engine/propulsion/StagingController';
import { stateVectorsToKeplerian } from '../src/engine/dynamics/OrbitalMechanics';
import { computeEnginePerformance } from '../src/engine/propulsion/Engine';
import type { RocketDesign } from '../src/types/rocket';

describe('End-to-End Flight Trajectory Integration Test', () => {
  const orbitalRocket: RocketDesign = {
    id: 'e2e-orbital-rocket',
    name: 'Orbital Test Vehicle',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    components: [
      // Stage 1
      {
        id: 'tank-1',
        type: 'propellantTank',
        name: 'Booster Tank',
        parameters: {
          length: 20.0,
          outerDiameter: 3.0,
          wallThickness: 0.004,
          material: 'aluminiumAlloy',
          structuralMass: 15_000,
          propellantType: 'RP1',
          oxidiserType: 'LOX',
          propellantMass: 60_000,
          oxidiserMass: 140_000,
          mixtureRatio: 2.33,
          ullagePercent: 5,
          pressurisation: 'regulated',
          operatingPressure: 4_000_000
        }
      },
      {
        id: 'eng-1',
        type: 'engine',
        name: 'Booster Engine',
        parameters: {
          thrustSeaLevel: 3_500_000,
          thrustVacuum: 3_800_000,
          ispSeaLevel: 280,
          ispVacuum: 310,
          nozzleExitDiameter: 1.2,
          nozzleThroatDiameter: 0.2,
          expansionRatio: 16,
          gimbalRange: 5,
          mass: 3000,
          burnTime: 160,
          restartable: true,
          quantity: 1,
          propellantType: 'RP1',
          oxidiserType: 'LOX',
          cycleType: 'gasGenerator',
          chamberPressure: 9_700_000
        }
      },
      {
        id: 'sep-1',
        type: 'separator',
        name: 'Stage Separator',
        parameters: {
          mass: 300,
          separationImpulse: 10_000,
          stageNumber: 0
        }
      },
      // Stage 2
      {
        id: 'tank-2',
        type: 'propellantTank',
        name: 'Upper Stage Tank',
        parameters: {
          length: 8.0,
          outerDiameter: 3.0,
          wallThickness: 0.003,
          material: 'aluminiumAlloy',
          structuralMass: 3000,
          propellantType: 'RP1',
          oxidiserType: 'LOX',
          propellantMass: 15_000,
          oxidiserMass: 35_000,
          mixtureRatio: 2.33,
          ullagePercent: 5,
          pressurisation: 'regulated',
          operatingPressure: 3_000_000
        }
      },
      {
        id: 'eng-2',
        type: 'engine',
        name: 'Upper Stage Engine',
        parameters: {
          thrustSeaLevel: 0,
          thrustVacuum: 450_000,
          ispSeaLevel: 200,
          ispVacuum: 348,
          nozzleExitDiameter: 1.5,
          nozzleThroatDiameter: 0.15,
          expansionRatio: 100,
          gimbalRange: 5,
          mass: 600,
          burnTime: 380,
          restartable: true,
          quantity: 1,
          propellantType: 'RP1',
          oxidiserType: 'LOX',
          cycleType: 'gasGenerator',
          chamberPressure: 9_700_000
        }
      }
    ]
  };

  it('simulates launch, liftoff, gravity turn, staging, and suborbital/orbital climb', () => {
    const staging = new StagingController(orbitalRocket);

    // Initial parameters
    const totalMass = 15_000 + 60_000 + 140_000 + 3000 + 300 + 3000 + 15_000 + 35_000 + 600; // ~271.9 tons
    const dryMass = 15_000 + 3000 + 300 + 3000 + 600; // ~21.9 tons

    const rocketProps: RocketPhysicalProperties = {
      length: 28.0,
      diameter: 3.0,
      dryMass,
      referenceArea: Math.PI * 1.5 * 1.5, // ~7.07 m^2
      baseCd: 0.25,
      centerOfMass: 15.0,
      centerOfPressure: 19.0,
      momentOfInertiaPitch: 100_000,
      momentOfInertiaRoll: 10_000
    };

    // Initial position on Earth surface (equator)
    const R_E = 6_371_000;
    let state: SixDOFState = {
      time: 0,
      position: new Vector3D(R_E, 0, 0),
      velocity: new Vector3D(0, 465, 0), // Surface rotation
      attitude: Quaternion.identity(),
      angularVelocity: new Vector3D(0, 0, 0),
      mass: totalMass,
      thrust: 0,
      drag: 0,
      dynamicPressure: 0,
      mach: 0,
      altitude: 0,
      downrange: 0
    };

    const dt = 0.5; // Integration step
    let maxMachReached = 0;
    let maxDynamicPressure = 0;
    let stagingTriggered = false;

    // Simulate 200 seconds of powered flight
    for (let t = 0; t < 200; t += dt) {
      const stage = staging.getActiveStage();
      let thrustVac = 0;
      let massFlow = 0;

      if (stage && stage.isIgnited && !stage.isSpent) {
        for (const eng of stage.engines) {
          const perf = computeEnginePerformance(eng.parameters, 0, 1.0);
          thrustVac += perf.thrust;
          massFlow += perf.massFlowRate;
        }
      }

      // Gravity turn guidance curve
      let targetPitch = 0;
      if (state.altitude > 1000 && state.altitude < 60000) {
        targetPitch = 80.0 * Math.sqrt((state.altitude - 1000) / 59000);
      } else if (state.altitude >= 60000) {
        targetPitch = 85.0;
      }

      const guidance: GuidanceCommand = {
        throttle: stage?.isSpent ? 0.0 : 1.0,
        gimbalPitchDeg: 0,
        gimbalYawDeg: 0,
        targetPitchDeg: targetPitch
      };

      state = step6DOF(state, rocketProps, thrustVac, massFlow, guidance, dt, 'earth');

      if (state.mach > maxMachReached) maxMachReached = state.mach;
      if (state.dynamicPressure > maxDynamicPressure) maxDynamicPressure = state.dynamicPressure;

      // Consume propellant
      if (massFlow > 0 && stage) {
        const hasFuel = staging.consumePropellant(massFlow * dt);
        if (!hasFuel && !stagingTriggered && staging.activeStageIndex === 0) {
          stagingTriggered = true;
          const shedMass = staging.separateStage();
          state.mass = Math.max(rocketProps.dryMass, state.mass - shedMass);
        }
      }
    }

    // 1. Vehicle lifted off and gained altitude
    expect(state.altitude).toBeGreaterThan(50_000); // Exceeded 50 km (mesosphere)

    // 2. Trajectory reached supersonic/hypersonic speeds
    expect(maxMachReached).toBeGreaterThan(3.0);

    // 3. Max-Q was experienced in the lower atmosphere
    expect(maxDynamicPressure).toBeGreaterThan(10_000); // > 10 kPa

    // 4. Staging separation occurred
    expect(stagingTriggered).toBe(true);
    expect(staging.activeStageIndex).toBe(1);

    // 5. Orbital analysis at high altitude
    const kepler = stateVectorsToKeplerian(state.position, state.velocity, 'earth');
    expect(kepler.apoapsisAltitude).toBeGreaterThan(100_000); // Apoapsis safely in space
  });
});
