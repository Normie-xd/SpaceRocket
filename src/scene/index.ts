/**
 * SpaceRocket 3D Scene (Three.js)
 *
 * This module contains the entire Three.js rendering layer.
 * Implemented in Phase 4 and Phase 5.
 *
 * Module structure (to be built out):
 *
 *   scene/
 *   ├── SceneManager.ts          Phase 4  — Scene init, render loop, camera
 *   ├── bodies/
 *   │   ├── Earth.ts             Phase 4  — PBR Earth (Blue Marble + atmosphere)
 *   │   ├── Moon.ts              Phase 4  — Moon surface rendering
 *   │   ├── Mars.ts              Phase 4  — Mars surface + dust haze
 *   │   └── SkyDome.ts           Phase 4  — Starfield, sun, dynamic sky
 *   ├── rocket/
 *   │   ├── RocketMesh.ts        Phase 4  — Procedural rocket geometry builder
 *   │   ├── NoseConeGeometry.ts  Phase 4  — Parametric nose cone (ogive, VK, etc.)
 *   │   ├── FinGeometry.ts       Phase 4  — Parametric fin mesh
 *   │   └── EngineBellGeometry.ts Phase 4 — Parabolic nozzle lathe geometry
 *   ├── effects/
 *   │   ├── ExhaustPlume.ts      Phase 5  — Volumetric exhaust particle shader
 *   │   ├── ShockwaveCone.ts     Phase 5  — Prandtl-Glauert condensation cone
 *   │   ├── ReentryGlow.ts       Phase 5  — Heat shield plasma shader
 *   │   └── StageSeparation.ts   Phase 5  — Separation pyro flash effect
 *   ├── environment/
 *   │   ├── LaunchPad.ts         Phase 4  — Procedural launch complex geometry
 *   │   ├── Terrain.ts           Phase 4  — Ground plane with terrain texture
 *   │   └── DynamicSky.ts        Phase 4  — Time-of-day sky (Rayleigh scattering)
 *   ├── ui/
 *   │   ├── TrajectoryArc.ts     Phase 6  — Predicted + actual trajectory line
 *   │   ├── OrbitRing.ts         Phase 6  — Target orbit visualisation ring
 *   │   └── TelemetrySprites.ts  Phase 6  — World-space text labels
 *   └── shaders/
 *       ├── atmosphere.vert      Phase 4  — Atmospheric scattering vertex shader
 *       ├── atmosphere.frag      Phase 4  — Atmospheric scattering fragment shader
 *       ├── exhaust.vert         Phase 5  — Exhaust plume vertex shader
 *       ├── exhaust.frag         Phase 5  — Exhaust plume fragment shader
 *       ├── reentry.vert         Phase 5  — Re-entry heat vertex shader
 *       └── reentry.frag         Phase 5  — Re-entry heat fragment shader
 */

export const SCENE_VERSION = '0.1.0'
