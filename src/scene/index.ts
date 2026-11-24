/**
 * SpaceRocket 3D Scene Module (Three.js)
 * 
 * Exports:
 * - SceneManager: WebGL PBR pipeline, multi-mode camera, tone mapping
 * - ProceduralRocketMesh: Parametric 3D rocket geometry generator from RocketDesign
 * - EarthMesh: PBR Earth surface with Rayleigh atmospheric scattering limb glow
 * - Starfield: 10,000-star deep space celestial background
 * - LaunchPad: Procedural launch complex, gantry umbilical tower, flame trench
 */

export * from './SceneManager';
export * from './bodies/Starfield';
export * from './bodies/Earth';
export * from './environment/LaunchPad';
export * from './rocket/ProceduralRocketMesh';

export const SCENE_VERSION = '0.4.0';
