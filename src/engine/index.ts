/**
 * SpaceRocket Physics Engine Core Export
 * 
 * Phase 1 Physics Modules:
 * - Atmosphere: US Standard Atmosphere 1976 (ISA)
 * - Aerodynamics: Mach-dependent drag coefficient (Cd) & dynamic pressure
 * - Propulsion: Rocket thrust equation, Isp(P_a), mass flow rate, Tsiolkovsky delta-v
 * - Dynamics: Celestial gravity, WGS84 J2 model, orbital velocity
 * - Integrator: Runge-Kutta 4th Order (RK4) numerical ODE solver
 * 
 * Phase 2 Dynamics & Staging:
 * - Math: 3D Vectors & Quaternions
 * - Aerodynamics: Barrowman stability equations (CoM vs CoP)
 * - Dynamics: 6-DOF rigid-body translational and rotational integrator
 * - Orbital Mechanics: Keplerian orbital elements (a, e, i, Omega, omega, nu)
 * - Propulsion: Multi-stage flight sequencing controller
 */

export * from './atmosphere/ISA';
export * from './aerodynamics/DragModel';
export * from './aerodynamics/Stability';
export * from './propulsion/Engine';
export * from './propulsion/StagingController';
export * from './dynamics/Gravity';
export * from './dynamics/OrbitalMechanics';
export * from './dynamics/SixDOF';
export * from './integrator/RungeKutta4';
export * from './math/Vector3D';
export * from './math/Quaternion';

export const ENGINE_VERSION = '0.3.0';
