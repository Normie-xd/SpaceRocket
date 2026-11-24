/**
 * SpaceRocket 3D Scene Module (Three.js)
 * 
 * Exports:
 * - SceneManager: WebGL PBR pipeline, multi-mode camera, tone mapping
 * - ProceduralRocketMesh: Parametric 3D rocket geometry generator from RocketDesign
 * - EarthMesh: PBR Earth surface with Rayleigh atmospheric scattering limb glow
 * - Starfield: 10,000-star deep space celestial background
 * - LaunchPad: Procedural launch complex, gantry umbilical tower, flame trench
 * 
 * Phase 5 Visual Effects:
 * - ExhaustPlume: Altitude-dependent rocket exhaust plume with vacuum expansion
 * - ShockwaveCone: Prandtl-Glauert transonic condensation vapor cone
 * - ReentryGlow: Hypersonic aerodynamic heating plasma glow
 * - TrajectoryRibbon: Real-time 3D flight path trail & predicted Keplerian orbit
 */

export * from './SceneManager';
export * from './bodies/Starfield';
export * from './bodies/Earth';
export * from './environment/LaunchPad';
export * from './rocket/ProceduralRocketMesh';
export * from './effects/ExhaustPlume';
export * from './effects/ShockwaveCone';
export * from './effects/ReentryGlow';
export * from './effects/TrajectoryRibbon';

export const SCENE_VERSION = '0.5.0';
