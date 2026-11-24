/**
 * SpaceRocket Physics Engine Core Export
 * 
 * Phase 1 Physics Modules:
 * - Atmosphere: US Standard Atmosphere 1976 (ISA)
 * - Aerodynamics: Mach-dependent drag coefficient (Cd) & dynamic pressure
 * - Propulsion: Rocket thrust equation, Isp(P_a), mass flow rate, Tsiolkovsky delta-v
 * - Dynamics: Celestial gravity, WGS84 J2 model, orbital velocity
 * - Integrator: Runge-Kutta 4th Order (RK4) numerical ODE solver
 */

export * from './atmosphere/ISA';
export * from './aerodynamics/DragModel';
export * from './propulsion/Engine';
export * from './dynamics/Gravity';
export * from './integrator/RungeKutta4';

export const ENGINE_VERSION = '0.2.0';
