import { describe, it, expect } from 'vitest';
import { StagingController } from '../src/engine/propulsion/StagingController';
import type { RocketDesign } from '../src/types/rocket';

describe('Multi-Stage Sequencing & Staging Controller', () => {
  const twoStageRocket: RocketDesign = {
    id: 'two-stage-test',
    name: 'Two Stage Orbital Launcher',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    components: [
      // Stage 1 (Booster)
      {
        id: 'tank-s1',
        type: 'propellantTank',
        name: 'Stage 1 Booster Tank',
        parameters: {
          length: 25.0,
          outerDiameter: 3.7,
          wallThickness: 0.005,
          material: 'aluminiumAlloy',
          structuralMass: 25_000,
          propellantType: 'RP1',
          oxidiserType: 'LOX',
          propellantMass: 100_000,
          oxidiserMass: 250_000,
          mixtureRatio: 2.5,
          ullagePercent: 5,
          pressurisation: 'regulated',
          operatingPressure: 4_000_000
        }
      },
      {
        id: 'eng-s1',
        type: 'engine',
        name: 'Booster Engine Cluster',
        parameters: {
          thrustSeaLevel: 7_600_000,
          thrustVacuum: 8_200_000,
          ispSeaLevel: 282,
          ispVacuum: 311,
          nozzleExitDiameter: 1.0,
          nozzleThroatDiameter: 0.2,
          expansionRatio: 16,
          gimbalRange: 5,
          mass: 4500,
          burnTime: 160,
          restartable: true,
          quantity: 9,
          propellantType: 'RP1',
          oxidiserType: 'LOX',
          cycleType: 'gasGenerator',
          chamberPressure: 9_700_000
        }
      },
      // Interstage Separator
      {
        id: 'sep-1',
        type: 'separator',
        name: 'Interstage Pneumatic Separator',
        parameters: {
          mass: 500,
          separationImpulse: 20_000,
          stageNumber: 0
        }
      },
      // Stage 2 (Upper Stage)
      {
        id: 'tank-s2',
        type: 'propellantTank',
        name: 'Stage 2 Upper Tank',
        parameters: {
          length: 10.0,
          outerDiameter: 3.7,
          wallThickness: 0.004,
          material: 'aluminiumAlloy',
          structuralMass: 4000,
          propellantType: 'RP1',
          oxidiserType: 'LOX',
          propellantMass: 25_000,
          oxidiserMass: 65_000,
          mixtureRatio: 2.6,
          ullagePercent: 5,
          pressurisation: 'regulated',
          operatingPressure: 3_000_000
        }
      },
      {
        id: 'eng-s2',
        type: 'engine',
        name: 'Vacuum Upper Engine',
        parameters: {
          thrustSeaLevel: 0,
          thrustVacuum: 981_000,
          ispSeaLevel: 200,
          ispVacuum: 348,
          nozzleExitDiameter: 2.4,
          nozzleThroatDiameter: 0.2,
          expansionRatio: 165,
          gimbalRange: 5,
          mass: 900,
          burnTime: 390,
          restartable: true,
          quantity: 1,
          propellantType: 'RP1',
          oxidiserType: 'LOX',
          cycleType: 'gasGenerator',
          chamberPressure: 9_700_000
        }
      },
      // Payload Fairing
      {
        id: 'fairing',
        type: 'fairing',
        name: 'Composite Payload Fairing',
        parameters: {
          length: 13.0,
          diameter: 5.2,
          wallThickness: 0.003,
          material: 'carbonFibreComposite',
          mass: 1700,
          jettisionAltitude: 100_000, // 100 km
          separationVelocity: 5.0
        }
      }
    ]
  };

  it('correctly constructs multi-stage structure and tracks active stage', () => {
    const controller = new StagingController(twoStageRocket);

    expect(controller.stages.length).toBe(2);
    expect(controller.activeStageIndex).toBe(0);

    const stage1 = controller.getActiveStage();
    expect(stage1?.isIgnited).toBe(true);
    expect(stage1?.currentPropellantMass).toBe(350_000);
  });

  it('detects propellant exhaustion (MECO) and handles staging separation', () => {
    const controller = new StagingController(twoStageRocket);
    const stage1 = controller.getActiveStage()!;

    // Burn all Stage 1 fuel
    const fuelRemaining = controller.consumePropellant(350_000);
    expect(fuelRemaining).toBe(false);
    expect(stage1.isSpent).toBe(true);

    // Trigger stage separation
    const jettisonedMass = controller.separateStage();
    expect(jettisonedMass).toBeGreaterThan(25_000); // Jettisons dry booster
    expect(controller.activeStageIndex).toBe(1);

    // Stage 2 is now active and ignited
    const stage2 = controller.getActiveStage()!;
    expect(stage2.stageIndex).toBe(1);
    expect(stage2.isIgnited).toBe(true);
    expect(stage2.currentPropellantMass).toBe(90_000);
  });

  it('jettisons payload fairing when exceeding Karman line threshold', () => {
    const controller = new StagingController(twoStageRocket);

    expect(controller.fairingJettisoned).toBe(false);

    // Below 100 km: no fairing jettison
    const shedBelow = controller.checkFairingJettison(80_000);
    expect(shedBelow).toBe(0);
    expect(controller.fairingJettisoned).toBe(false);

    // Above 100 km: fairing is jettisoned
    const shedAbove = controller.checkFairingJettison(105_000);
    expect(shedAbove).toBe(1700);
    expect(controller.fairingJettisoned).toBe(true);

    // Subsequent calls return 0 (already shed)
    expect(controller.checkFairingJettison(110_000)).toBe(0);
  });
});
