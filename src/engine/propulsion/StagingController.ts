/**
 * Multi-Stage Rocket Sequencing & Staging Controller
 * 
 * Manages the flight phases of a multi-stage rocket:
 * - Engine ignition and throttle control
 * - Stage propellant exhaustion detection (MECO: Main Engine Cut-Off)
 * - Stage separation (jettison of spent booster stage mass)
 * - Interstage separation delay & ullage / upper stage ignition
 * - Fairing jettison when exiting dense atmosphere (e.g. altitude > 100 km)
 */

import type { RocketDesign, RocketComponent, PropellantTank, Engine, Separator, Fairing } from '../../types/rocket';

export interface StageDefinition {
  stageIndex: number;          // 0 = booster / first stage, 1 = second stage, etc.
  name: string;
  dryMass: number;             // kg
  initialPropellantMass: number;// kg
  currentPropellantMass: number;// kg
  engines: Engine[];
  tanks: PropellantTank[];
  separator?: Separator;
  isIgnited: boolean;
  isSpent: boolean;
  isJettisoned: boolean;
}

export class StagingController {
  public stages: StageDefinition[] = [];
  public activeStageIndex: number = 0;
  public fairingJettisoned: boolean = false;
  public fairingMass: number = 0;
  public fairingAltitudeThreshold: number = 100_000; // 100 km default

  constructor(design: RocketDesign) {
    this.buildStagesFromDesign(design);
  }

  private buildStagesFromDesign(design: RocketDesign): void {
    // Collect stages based on separators or grouped components
    let currentStageIndex = 0;
    let currentStage: StageDefinition = {
      stageIndex: currentStageIndex,
      name: `Stage ${currentStageIndex + 1}`,
      dryMass: 0,
      initialPropellantMass: 0,
      currentPropellantMass: 0,
      engines: [],
      tanks: [],
      isIgnited: currentStageIndex === 0,
      isSpent: false,
      isJettisoned: false
    };

    for (const comp of design.components) {
      if (comp.type === 'separator') {
        const sep = comp as Separator;
        currentStage.separator = sep;
        this.stages.push(currentStage);

        currentStageIndex++;
        currentStage = {
          stageIndex: currentStageIndex,
          name: `Stage ${currentStageIndex + 1}`,
          dryMass: 0,
          initialPropellantMass: 0,
          currentPropellantMass: 0,
          engines: [],
          tanks: [],
          isIgnited: false,
          isSpent: false,
          isJettisoned: false
        };
      } else if (comp.type === 'engine') {
        const eng = comp as Engine;
        currentStage.engines.push(eng);
        currentStage.dryMass += (eng.parameters.mass || 500) * (eng.parameters.quantity || 1);
      } else if (comp.type === 'propellantTank') {
        const tank = comp as PropellantTank;
        currentStage.tanks.push(tank);
        const prop = tank.parameters.propellantMass + (tank.parameters.oxidiserMass || 0);
        currentStage.initialPropellantMass += prop;
        currentStage.currentPropellantMass += prop;
        currentStage.dryMass += tank.parameters.structuralMass;
      } else if (comp.type === 'fairing') {
        const fairing = comp as Fairing;
        this.fairingMass = fairing.parameters.mass || 1500;
        this.fairingAltitudeThreshold = fairing.parameters.jettisionAltitude || 100_000;
      } else {
        const generic = comp as any;
        currentStage.dryMass += generic.parameters?.mass || 50;
      }
    }

    this.stages.push(currentStage);
  }

  public getActiveStage(): StageDefinition | null {
    if (this.activeStageIndex < this.stages.length) {
      return this.stages[this.activeStageIndex];
    }
    return null;
  }

  /**
   * Consumes propellant from active stage tanks.
   * Returns true if propellant still remains, false if depleted (MECO).
   */
  public consumePropellant(consumedMass: number): boolean {
    const stage = this.getActiveStage();
    if (!stage) return false;

    stage.currentPropellantMass = Math.max(0, stage.currentPropellantMass - consumedMass);
    if (stage.currentPropellantMass <= 0) {
      stage.isSpent = true;
      return false; // Depleted
    }
    return true;
  }

  /**
   * Triggers staging: jettisons current stage and ignites the next stage.
   * Returns mass jettisoned in kg.
   */
  public separateStage(): number {
    const current = this.getActiveStage();
    if (!current) return 0;

    current.isJettisoned = true;
    current.isIgnited = false;
    const jettisonedMass = current.dryMass + current.currentPropellantMass;

    this.activeStageIndex++;
    const next = this.getActiveStage();
    if (next) {
      next.isIgnited = true;
    }

    return jettisonedMass;
  }

  /**
   * Checks if fairing should be jettisoned based on current altitude.
   * Returns fairing mass shed if jettisoned on this call, or 0 if already shed or not yet at altitude.
   */
  public checkFairingJettison(altitude: number): number {
    if (!this.fairingJettisoned && altitude >= this.fairingAltitudeThreshold && this.fairingMass > 0) {
      this.fairingJettisoned = true;
      return this.fairingMass;
    }
    return 0;
  }
}
