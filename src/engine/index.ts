/**
 * SpaceRocket Physics Engine
 *
 * This module will house the full physics simulation engine.
 * Implemented across Phase 1 and Phase 2.
 *
 * Module structure (to be built out):
 *
 *   engine/
 *   ├── SimulationWorker.ts      Phase 1  — Web Worker entry, simulation loop
 *   ├── integrator/
 *   │   └── RungeKutta4.ts       Phase 1  — RK4 ODE integrator
 *   ├── atmosphere/
 *   │   ├── ISA.ts               Phase 1  — US Standard Atmosphere 1976 (0–86 km)
 *   │   ├── NRLMSISE00.ts        Phase 1  — Upper atmosphere (86 km–1000 km)
 *   │   └── PlanetaryAtmosphere.ts Phase 2 — Mars, Venus, Titan models
 *   ├── aerodynamics/
 *   │   ├── DragModel.ts         Phase 1  — Mach-dependent Cd lookup
 *   │   ├── Stability.ts         Phase 2  — Barrowman equations (CoM vs CoP)
 *   │   └── AeroHeating.ts       Phase 2  — Stagnation temperature, heat flux
 *   ├── propulsion/
 *   │   ├── Engine.ts            Phase 1  — Thrust, Isp, mass flow equations
 *   │   ├── PropellantBurn.ts    Phase 1  — Propellant depletion, tank mass
 *   │   └── StagingController.ts Phase 2  — Multi-stage sequencing
 *   ├── dynamics/
 *   │   ├── SixDOF.ts            Phase 2  — 6-DOF rigid body state equations
 *   │   ├── Gravity.ts           Phase 1  — WGS84 gravity + inverse square law
 *   │   └── OrbitalMechanics.ts  Phase 2  — Kepler, Hohmann, orbital elements
 *   └── thermal/
 *       └── HeatModel.ts         Phase 2  — Re-entry heat shield, thermal soak
 */

export const ENGINE_VERSION = '0.1.0'
