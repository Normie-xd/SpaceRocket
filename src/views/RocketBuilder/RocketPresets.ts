/**
 * Pre-defined Rocket Design Presets
 * 
 * Provides physically accurate reference rocket configurations:
 * 1. Sounding Rocket Alpha — Single stage suborbital atmospheric probe
 * 2. Zephyr-1 Orbital Launcher — 2-stage medium-lift LEO vehicle (Falcon-style)
 * 3. Titan-Heavy Trans-Lunar Vehicle — 3-stage heavy lift architecture
 */

import type { RocketDesign } from '../../types/rocket';

export const ROCKET_PRESETS: RocketDesign[] = [
  {
    id: 'preset-sounding-alpha',
    name: 'Sounding Rocket Alpha (Suborbital)',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    components: [
      {
        id: 'nc-1',
        type: 'noseCone',
        name: 'Ogive Research Nose Cone',
        parameters: {
          shape: 'ogive',
          length: 1.2,
          baseDiameter: 0.4,
          wallThickness: 0.003,
          material: 'carbonFibreComposite',
          mass: 8.0
        }
      },
      {
        id: 'payload-1',
        type: 'payload',
        name: 'Atmospheric Sensor Suite',
        parameters: {
          mass: 25.0,
          length: 0.6,
          diameter: 0.38,
          description: 'High-altitude atmospheric temperature and pressure sensors'
        }
      },
      {
        id: 'tank-1',
        type: 'propellantTank',
        name: 'Solid Propellant Casing',
        parameters: {
          length: 3.5,
          outerDiameter: 0.4,
          wallThickness: 0.004,
          material: 'aluminiumAlloy',
          structuralMass: 45.0,
          propellantType: 'solidAPCTHB',
          oxidiserType: null,
          propellantMass: 380.0,
          oxidiserMass: 0,
          mixtureRatio: 1.0,
          ullagePercent: 2,
          pressurisation: 'blowdown',
          operatingPressure: 5_000_000
        }
      },
      {
        id: 'eng-1',
        type: 'engine',
        name: 'Solid Rocket Motor Nozzle',
        parameters: {
          thrustSeaLevel: 32_000,
          thrustVacuum: 35_000,
          ispSeaLevel: 245,
          ispVacuum: 268,
          nozzleExitDiameter: 0.28,
          nozzleThroatDiameter: 0.06,
          expansionRatio: 12,
          gimbalRange: 0,
          mass: 18.0,
          burnTime: 32,
          restartable: false,
          quantity: 1,
          propellantType: 'solidAPCTHB',
          oxidiserType: null,
          cycleType: 'solid',
          chamberPressure: 6_000_000
        }
      },
      {
        id: 'fin-1',
        type: 'fin',
        name: 'Trapezoidal Tail Fins',
        parameters: {
          shape: 'trapezoidal',
          quantity: 4,
          rootChord: 0.5,
          tipChord: 0.2,
          span: 0.3,
          sweepAngle: 35,
          thickness: 0.006,
          material: 'aluminiumAlloy',
          mass: 12.0,
          attachPosition: 4.8
        }
      }
    ]
  },
  {
    id: 'preset-zephyr-1',
    name: 'Zephyr-1 Two-Stage Orbital Launcher',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    components: [
      {
        id: 'fairing-z1',
        type: 'fairing',
        name: 'Aerodynamic Payload Fairing',
        parameters: {
          length: 12.0,
          diameter: 4.0,
          wallThickness: 0.004,
          material: 'carbonFibreComposite',
          mass: 1500,
          jettisionAltitude: 100_000,
          separationVelocity: 4.5
        }
      },
      {
        id: 'payload-z1',
        type: 'payload',
        name: 'LEO Communications Satellite',
        parameters: {
          mass: 3500,
          length: 4.0,
          diameter: 2.8,
          description: '3.5-ton commercial communications satellite for 400 km orbit'
        }
      },
      // Upper Stage (Stage 2)
      {
        id: 'tank-z2',
        type: 'propellantTank',
        name: 'Upper Stage Cryogenic Tank',
        parameters: {
          length: 8.0,
          outerDiameter: 3.7,
          wallThickness: 0.004,
          material: 'aluminiumAlloy',
          structuralMass: 4000,
          propellantType: 'RP1',
          oxidiserType: 'LOX',
          propellantMass: 28_000,
          oxidiserMass: 68_000,
          mixtureRatio: 2.43,
          ullagePercent: 4,
          pressurisation: 'regulated',
          operatingPressure: 3_000_000
        }
      },
      {
        id: 'eng-z2',
        type: 'engine',
        name: 'Vacuum Expansion Engine',
        parameters: {
          thrustSeaLevel: 0,
          thrustVacuum: 981_000,
          ispSeaLevel: 200,
          ispVacuum: 348,
          nozzleExitDiameter: 2.4,
          nozzleThroatDiameter: 0.18,
          expansionRatio: 165,
          gimbalRange: 6,
          mass: 950,
          burnTime: 397,
          restartable: true,
          quantity: 1,
          propellantType: 'RP1',
          oxidiserType: 'LOX',
          cycleType: 'gasGenerator',
          chamberPressure: 9_700_000
        }
      },
      // Interstage
      {
        id: 'sep-z1',
        type: 'separator',
        name: 'Pneumatic Interstage Ring',
        parameters: {
          mass: 650,
          separationImpulse: 25_000,
          stageNumber: 0
        }
      },
      // Booster (Stage 1)
      {
        id: 'tank-z1',
        type: 'propellantTank',
        name: 'First Stage Main Booster Tank',
        parameters: {
          length: 28.0,
          outerDiameter: 3.7,
          wallThickness: 0.005,
          material: 'aluminiumAlloy',
          structuralMass: 24_000,
          propellantType: 'RP1',
          oxidiserType: 'LOX',
          propellantMass: 120_000,
          oxidiserMass: 290_000,
          mixtureRatio: 2.42,
          ullagePercent: 4,
          pressurisation: 'regulated',
          operatingPressure: 4_500_000
        }
      },
      {
        id: 'eng-z1',
        type: 'engine',
        name: 'Octaweb 9-Engine Cluster',
        parameters: {
          thrustSeaLevel: 7_605_000,
          thrustVacuum: 8_226_000,
          ispSeaLevel: 282,
          ispVacuum: 311,
          nozzleExitDiameter: 0.92,
          nozzleThroatDiameter: 0.2,
          expansionRatio: 16,
          gimbalRange: 5,
          mass: 470,
          burnTime: 162,
          restartable: true,
          quantity: 9,
          propellantType: 'RP1',
          oxidiserType: 'LOX',
          cycleType: 'gasGenerator',
          chamberPressure: 9_700_000
        }
      },
      {
        id: 'fin-z1',
        type: 'fin',
        name: 'Base Aerodynamic Fins',
        parameters: {
          shape: 'swept',
          quantity: 4,
          rootChord: 1.8,
          tipChord: 0.6,
          span: 0.9,
          sweepAngle: 40,
          thickness: 0.02,
          material: 'titaniumAlloyTi6Al4V',
          mass: 380,
          attachPosition: 39.0
        }
      }
    ]
  }
];
