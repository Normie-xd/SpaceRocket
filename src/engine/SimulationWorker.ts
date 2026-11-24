/**
 * SpaceRocket Simulation Web Worker
 * 
 * Runs the 6-DOF physics simulation loop off the main UI/rendering thread:
 * - Computes real-time 6-DOF trajectory propagation
 * - Detects simulation milestones (Liftoff, Max-Q, MECO, Stage Separation, Karman line, Orbit Insertion)
 * - Emits TelemetryFrame objects to the renderer and UI stores
 */

import { Vector3D } from './math/Vector3D';
import { Quaternion } from './math/Quaternion';
import { step6DOF, type SixDOFState, type GuidanceCommand, type RocketPhysicalProperties } from './dynamics/SixDOF';
import { StagingController } from './propulsion/StagingController';
import { stateVectorsToKeplerian } from './dynamics/OrbitalMechanics';
import { computeISA } from './atmosphere/ISA';
import { computeEnginePerformance } from './propulsion/Engine';
import type { TelemetryFrame, SimulationEvent } from '../types/simulation';
import type { RocketDesign } from '../types/rocket';
import type { CelestialBody } from '../types/celestial';

export interface SimWorkerInitMessage {
  type: 'INIT';
  design: RocketDesign;
  body: CelestialBody;
  launchSiteLatitude: number;
}

export interface SimWorkerCommandMessage {
  type: 'START' | 'PAUSE' | 'RESUME' | 'RESET' | 'STAGE' | 'SET_TIMESCALE';
  timeScale?: number;
}

// Global worker simulation state
let isRunning = false;
let timeScale = 1;
let dt = 0.02; // 50 Hz physics integration step

let stagingController: StagingController | null = null;
let currentState: SixDOFState | null = null;
let rocketProps: RocketPhysicalProperties | null = null;
let celestialBody: CelestialBody = 'earth';
let maxQDetected = false;
let maxQValue = 0;
let karmanLineCrossed = false;

function resetSim(design: RocketDesign, body: CelestialBody = 'earth', lat: number = 28.6): void {
  celestialBody = body;
  stagingController = new StagingController(design);
  maxQDetected = false;
  maxQValue = 0;
  karmanLineCrossed = false;

  // Approximate physical properties from design
  let totalMass = 0;
  let totalLength = 0;
  let maxDiameter = 1.0;

  for (const comp of design.components) {
    const p = comp.parameters as any;
    if (p.length) totalLength += p.length;
    if (p.outerDiameter) maxDiameter = Math.max(maxDiameter, p.outerDiameter);
    if (p.baseDiameter) maxDiameter = Math.max(maxDiameter, p.baseDiameter);
    if (p.mass) totalMass += p.mass;
    if (p.structuralMass) totalMass += p.structuralMass;
    if (p.propellantMass) totalMass += p.propellantMass;
    if (p.oxidiserMass) totalMass += p.oxidiserMass;
  }

  const radius = maxDiameter * 0.5;
  const refArea = Math.PI * radius * radius;

  // Moment of inertia for solid/hollow cylinder approximation
  // I_pitch = (1/12) * m * (3*r^2 + L^2)
  const I_pitch = (1.0 / 12.0) * totalMass * (3.0 * radius * radius + totalLength * totalLength);
  const I_roll = 0.5 * totalMass * radius * radius;

  rocketProps = {
    length: Math.max(5.0, totalLength),
    diameter: maxDiameter,
    dryMass: totalMass * 0.15, // Default ~15% dry mass fraction
    referenceArea: refArea,
    baseCd: 0.25,
    centerOfMass: totalLength * 0.55,
    centerOfPressure: totalLength * 0.65,
    momentOfInertiaPitch: Math.max(100, I_pitch),
    momentOfInertiaRoll: Math.max(50, I_roll)
  };

  // Launch pad position in ECI (on equator/specified latitude)
  const earthRadius = 6_371_000;
  const latRad = (lat * Math.PI) / 180.0;
  const r0 = earthRadius;
  const initialPos = new Vector3D(r0 * Math.cos(latRad), 0, r0 * Math.sin(latRad));

  // Initial surface velocity due to Earth rotation: v = omega x r
  const initialVel = new Vector3D(0, 7.292115e-5 * initialPos.x, 0);

  // Initial attitude: pointing vertical (upward along radial position vector)
  const initialAtt = Quaternion.fromAxisAngle(new Vector3D(0, 1, 0), -latRad);

  currentState = {
    time: 0,
    position: initialPos,
    velocity: initialVel,
    attitude: initialAtt,
    angularVelocity: new Vector3D(0, 0, 0),
    mass: totalMass,
    thrust: 0,
    drag: 0,
    dynamicPressure: 0,
    mach: 0,
    altitude: 0,
    downrange: 0
  };
}

function physicsStep(): void {
  if (!currentState || !rocketProps || !stagingController) return;

  const stage = stagingController.getActiveStage();
  let thrustVac = 0;
  let massFlow = 0;

  if (stage && stage.isIgnited && !stage.isSpent) {
    for (const eng of stage.engines) {
      const perf = computeEnginePerformance(eng.parameters, 0, 1.0);
      thrustVac += perf.thrust;
      massFlow += perf.massFlowRate;
    }
  }

  // Guidance: Gravity Turn Pitch Program
  // Pitch over gently between 1 km and 60 km
  let targetPitch = 0;
  const alt = currentState.altitude;
  if (alt > 1000 && alt < 70000) {
    const fraction = (alt - 1000) / 69000;
    targetPitch = 85.0 * Math.sqrt(fraction); // Gravity turn curve
  } else if (alt >= 70000) {
    targetPitch = 85.0; // Near horizontal orbital burn
  }

  const guidance: GuidanceCommand = {
    throttle: stage?.isSpent ? 0.0 : 1.0,
    gimbalPitchDeg: 0,
    gimbalYawDeg: 0,
    targetPitchDeg: targetPitch
  };

  // Propagate 6-DOF
  currentState = step6DOF(
    currentState,
    rocketProps,
    thrustVac,
    massFlow,
    guidance,
    dt,
    celestialBody
  );

  // Consume propellant
  if (massFlow > 0) {
    const hasFuel = stagingController.consumePropellant(massFlow * dt);
    if (!hasFuel) {
      emitEvent('mainEngineCutoff', currentState.altitude, 'Main Engine Cut-Off (MECO)');
    }
  }

  // Check Max-Q
  if (currentState.dynamicPressure > maxQValue) {
    maxQValue = currentState.dynamicPressure;
  } else if (!maxQDetected && maxQValue > 5000 && currentState.dynamicPressure < maxQValue * 0.95) {
    maxQDetected = true;
    emitEvent('maxQ', currentState.altitude, `Max-Q reached: ${(maxQValue / 1000).toFixed(1)} kPa`);
  }

  // Check Karman Line
  if (!karmanLineCrossed && currentState.altitude >= 100_000) {
    karmanLineCrossed = true;
    emitEvent('atmosphericExit', currentState.altitude, 'Crossed Karman Line (100 km) — Edge of Space');
  }

  // Check Fairing Jettison
  const fairingShed = stagingController.checkFairingJettison(currentState.altitude);
  if (fairingShed > 0) {
    currentState.mass = Math.max(rocketProps.dryMass, currentState.mass - fairingShed);
    emitEvent('fairingJettison', currentState.altitude, 'Payload Fairing Jettisoned');
  }

  // Build Telemetry Frame
  const kepler = stateVectorsToKeplerian(currentState.position, currentState.velocity, celestialBody);
  const atmo = computeISA(currentState.altitude);
  const euler = currentState.attitude.toEulerDegrees();

  const frame: TelemetryFrame = {
    timestamp: currentState.time,
    positionX: currentState.position.x,
    positionY: currentState.position.y,
    positionZ: currentState.position.z,
    velocityX: currentState.velocity.x,
    velocityY: currentState.velocity.y,
    velocityZ: currentState.velocity.z,
    altitude: currentState.altitude,
    speed: currentState.velocity.magnitude(),
    surfaceSpeed: currentState.velocity.magnitude(),
    mach: currentState.mach,
    dynamicPressure: currentState.dynamicPressure,
    acceleration: currentState.thrust / Math.max(1, currentState.mass),
    gForce: (currentState.thrust / Math.max(1, currentState.mass)) / 9.80665,
    axialAcceleration: currentState.thrust / Math.max(1, currentState.mass),
    thrust: currentState.thrust,
    massFlowRate: massFlow,
    isp: 300,
    totalMass: currentState.mass,
    propellantMass: stage ? stage.currentPropellantMass : 0,
    dryMass: rocketProps.dryMass,
    pitch: euler.pitch,
    yaw: euler.yaw,
    roll: euler.roll,
    angleOfAttack: 0,
    downrange: currentState.downrange,
    flightPathAngle: 90.0 - euler.pitch,
    atmosphericPressure: atmo.pressure,
    atmosphericDensity: atmo.density,
    temperature: atmo.temperature,
    stagnationTemperature: atmo.temperature,
    heatFlux: 0,
    activeStage: stagingController.activeStageIndex,
    orbitalAltitude: kepler.isOrbital ? (kepler.periapsisAltitude + kepler.apoapsisAltitude) * 0.5 : null,
    periapsis: kepler.periapsisAltitude,
    apoapsis: kepler.apoapsisAltitude,
    orbitalVelocity: kepler.isOrbital ? currentState.velocity.magnitude() : null,
    eccentricity: kepler.eccentricity,
    inclination: kepler.inclination
  };

  self.postMessage({ type: 'TELEMETRY', frame });
}

function emitEvent(type: any, altitude: number, description: string): void {
  const event: SimulationEvent = {
    id: crypto.randomUUID(),
    type,
    timestamp: currentState?.time || 0,
    altitude,
    description
  };
  self.postMessage({ type: 'EVENT', event });
}

// Worker message dispatcher
self.onmessage = (e: MessageEvent) => {
  const msg = e.data;
  switch (msg.type) {
    case 'INIT':
      resetSim(msg.design, msg.body, msg.launchSiteLatitude);
      break;
    case 'START':
      isRunning = true;
      runLoop();
      break;
    case 'PAUSE':
      isRunning = false;
      break;
    case 'STAGE':
      if (stagingController && currentState) {
        const shedMass = stagingController.separateStage();
        currentState.mass = Math.max(10, currentState.mass - shedMass);
        emitEvent('stageSeparation', currentState.altitude, `Stage ${stagingController.activeStageIndex} Separated`);
      }
      break;
    case 'SET_TIMESCALE':
      timeScale = msg.timeScale || 1;
      break;
    case 'RESET':
      isRunning = false;
      break;
  }
};

function runLoop(): void {
  if (!isRunning) return;

  // Number of sub-steps based on timeScale
  const stepsToExecute = Math.min(32, Math.round(timeScale));
  for (let i = 0; i < stepsToExecute; i++) {
    physicsStep();
  }

  setTimeout(runLoop, 20); // ~50 fps message rate
}
