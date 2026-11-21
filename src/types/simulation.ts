// ─── Simulation Types ─────────────────────────────────────────────────────────

/**
 * One sample of telemetry data recorded at a simulation timestep.
 * Stored in-memory and later exported to CSV/JSON.
 */
export interface TelemetryFrame {
  timestamp: number          // simulation elapsed time (s)

  // Position (ECI frame, m)
  positionX: number
  positionY: number
  positionZ: number

  // Velocity (inertial, m/s)
  velocityX: number
  velocityY: number
  velocityZ: number

  // Scalars
  altitude: number           // m above surface (geodetic)
  speed: number              // m/s (inertial)
  surfaceSpeed: number       // m/s (relative to rotating Earth)
  mach: number               // dimensionless
  dynamicPressure: number    // Pa (q = 0.5 * rho * v²)

  // Acceleration
  acceleration: number       // m/s² (total magnitude)
  gForce: number             // dimensionless (a / g0)
  axialAcceleration: number  // m/s² along rocket axis

  // Propulsion
  thrust: number             // N (net from all active engines)
  massFlowRate: number       // kg/s (propellant consumption)
  isp: number                // s (effective specific impulse)

  // Mass
  totalMass: number          // kg
  propellantMass: number     // kg (remaining)
  dryMass: number            // kg (structural)

  // Attitude
  pitch: number              // degrees from vertical
  yaw: number                // degrees
  roll: number               // degrees
  angleOfAttack: number      // degrees

  // Trajectory
  downrange: number          // m
  flightPathAngle: number    // degrees from local horizontal

  // Atmosphere
  atmosphericPressure: number  // Pa
  atmosphericDensity: number   // kg/m³
  temperature: number          // K

  // Heating
  stagnationTemperature: number  // K (nose cone stagnation point)
  heatFlux: number               // W/m²

  // Active stage index
  activeStage: number

  // Orbital elements (once in space)
  orbitalAltitude: number | null     // m (mean, null if suborbital)
  periapsis: number | null           // m above surface
  apoapsis: number | null            // m above surface
  orbitalVelocity: number | null     // m/s
  eccentricity: number | null
  inclination: number | null         // degrees
}

// ─── Simulation Events ────────────────────────────────────────────────────────
export type SimulationEventType =
  | 'launch'
  | 'maxQ'
  | 'mainEngineCutoff'       // MECO
  | 'stageSeparation'
  | 'secondStageIgnition'
  | 'fairingJettison'
  | 'orbitInsertion'
  | 'apogeeReached'
  | 'perigeeReached'
  | 'atmosphericExit'        // Karman line (100 km)
  | 'atmosphericEntry'       // re-entry
  | 'touchdown'
  | 'missionSuccess'
  | 'missionFailure'
  | 'abort'
  | 'custom'

export interface SimulationEvent {
  id: string
  type: SimulationEventType
  timestamp: number          // simulation time (s)
  altitude: number           // m
  description: string
  data?: Record<string, number | string>
}

// ─── Simulation Configuration ─────────────────────────────────────────────────
export interface SimulationConfig {
  timeStep: number           // s — integration step (0.01–0.1 for standard, 0.001 for high fidelity)
  maxSimulationTime: number  // s — hard cutoff
  enableAtmosphere: boolean
  enableThermalModeling: boolean
  enableAtmosphericTurbulence: boolean
  referenceFrame: 'ECI' | 'ECEF' | 'launchSite'
}
