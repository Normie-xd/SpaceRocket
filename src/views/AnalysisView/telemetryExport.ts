/**
 * Post-Flight Telemetry Analysis & Export Utilities
 * 
 * - Computes mission summary statistics (Max Altitude, Max Speed, Max-Q, Peak G-Force, etc.)
 * - Serializes TelemetryFrame[] to CSV and JSON formats
 * - Generates sample flight telemetry for offline inspection
 */

import type { TelemetryFrame, SimulationEvent } from '../../types/simulation';
import { writeExportFile } from '../../lib/storage';

export interface PostFlightSummary {
  durationSeconds: number;
  maxAltitudeMeters: number;
  maxSpeedMps: number;
  maxMach: number;
  maxDynamicPressurePa: number;
  maxGForce: number;
  peakThrustNewtons: number;
  finalApoapsisMeters: number | null;
  finalPeriapsisMeters: number | null;
  finalEccentricity: number | null;
  sampleCount: number;
}

export function computePostFlightSummary(frames: TelemetryFrame[]): PostFlightSummary {
  if (frames.length === 0) {
    return {
      durationSeconds: 0,
      maxAltitudeMeters: 0,
      maxSpeedMps: 0,
      maxMach: 0,
      maxDynamicPressurePa: 0,
      maxGForce: 0,
      peakThrustNewtons: 0,
      finalApoapsisMeters: null,
      finalPeriapsisMeters: null,
      finalEccentricity: null,
      sampleCount: 0
    };
  }

  let maxAltitudeMeters = 0;
  let maxSpeedMps = 0;
  let maxMach = 0;
  let maxDynamicPressurePa = 0;
  let maxGForce = 0;
  let peakThrustNewtons = 0;

  for (const f of frames) {
    if (f.altitude > maxAltitudeMeters) maxAltitudeMeters = f.altitude;
    if (f.speed > maxSpeedMps) maxSpeedMps = f.speed;
    if (f.mach > maxMach) maxMach = f.mach;
    if (f.dynamicPressure > maxDynamicPressurePa) maxDynamicPressurePa = f.dynamicPressure;
    if (f.gForce > maxGForce) maxGForce = f.gForce;
    if (f.thrust > peakThrustNewtons) peakThrustNewtons = f.thrust;
  }

  const last = frames[frames.length - 1];
  return {
    durationSeconds: last.timestamp,
    maxAltitudeMeters,
    maxSpeedMps,
    maxMach,
    maxDynamicPressurePa,
    maxGForce,
    peakThrustNewtons,
    finalApoapsisMeters: last.apoapsis,
    finalPeriapsisMeters: last.periapsis,
    finalEccentricity: last.eccentricity,
    sampleCount: frames.length
  };
}

export function telemetryToCSV(frames: TelemetryFrame[]): string {
  const headers = [
    'timestamp_s',
    'altitude_m',
    'downrange_m',
    'speed_mps',
    'mach',
    'dynamic_pressure_pa',
    'g_force',
    'thrust_n',
    'total_mass_kg',
    'propellant_mass_kg',
    'pitch_deg',
    'active_stage',
    'apoapsis_m',
    'periapsis_m',
    'eccentricity'
  ];

  const rows = frames.map((f) =>
    [
      f.timestamp.toFixed(3),
      f.altitude.toFixed(2),
      f.downrange.toFixed(2),
      f.speed.toFixed(2),
      f.mach.toFixed(3),
      f.dynamicPressure.toFixed(2),
      f.gForce.toFixed(3),
      f.thrust.toFixed(1),
      f.totalMass.toFixed(2),
      f.propellantMass.toFixed(2),
      f.pitch.toFixed(2),
      f.activeStage,
      f.apoapsis !== null ? f.apoapsis.toFixed(1) : '',
      f.periapsis !== null ? f.periapsis.toFixed(1) : '',
      f.eccentricity !== null ? f.eccentricity.toFixed(5) : ''
    ].join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

export function telemetryToJSON(frames: TelemetryFrame[], events: SimulationEvent[]): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      summary: computePostFlightSummary(frames),
      events,
      telemetry: frames
    },
    null,
    2
  );
}

/**
 * Exports telemetry to disk via Tauri IPC, falling back to browser download if outside Tauri.
 */
export async function saveTelemetryExport(
  filename: string,
  content: string,
  mimeType: string
): Promise<{ method: 'tauri' | 'browser'; path?: string }> {
  try {
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      const savedPath = await writeExportFile(filename, content);
      return { method: 'tauri', path: savedPath };
    }
  } catch {
    // Fallback to browser download
  }

  if (typeof document !== 'undefined') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
  return { method: 'browser' };
}

/**
 * Generates realistic representative 2-stage orbital ascent telemetry for preview/inspection.
 */
export function generateSampleFlightTelemetry(): { frames: TelemetryFrame[]; events: SimulationEvent[] } {
  const frames: TelemetryFrame[] = [];
  const totalSteps = 120; // 240 seconds sampled every 2s

  for (let i = 0; i <= totalSteps; i++) {
    const t = i * 2;
    const isStage2 = t >= 150;
    const stageTime = isStage2 ? t - 150 : t;

    const altitude = isStage2
      ? 68_000 + stageTime * 1550 + 0.5 * 8 * stageTime * stageTime
      : 0.5 * 6.0 * t * t;
    const speed = isStage2
      ? 1850 + stageTime * 34
      : 465 + t * 9.2;
    const mach = speed / (altitude < 50_000 ? 310 : 295);
    const airDensity = Math.max(0, 1.225 * Math.exp(-altitude / 8500));
    const dynamicPressure = 0.5 * airDensity * speed * speed;
    const thrust = isStage2 ? 981_000 : 7_605_000;
    const totalMass = isStage2 ? 105_000 - stageTime * 300 : 510_000 - t * 2400;
    const propellantMass = isStage2 ? Math.max(0, 96_000 - stageTime * 300) : Math.max(0, 410_000 - t * 2400);

    frames.push({
      timestamp: t,
      positionX: 6_371_000 + altitude,
      positionY: t * 465,
      positionZ: 0,
      velocityX: speed * 0.6,
      velocityY: speed * 0.8,
      velocityZ: 0,
      altitude,
      speed,
      surfaceSpeed: Math.max(0, speed - 465),
      mach,
      dynamicPressure,
      acceleration: thrust / totalMass,
      gForce: thrust / (totalMass * 9.80665),
      axialAcceleration: thrust / totalMass,
      thrust,
      massFlowRate: isStage2 ? 300 : 2400,
      isp: isStage2 ? 348 : 295,
      totalMass,
      propellantMass,
      dryMass: 30_000,
      pitch: Math.min(85, t * 0.45),
      yaw: 0,
      roll: 0,
      angleOfAttack: 0.5,
      downrange: t * speed * 0.35,
      flightPathAngle: Math.max(5, 90 - t * 0.45),
      atmosphericPressure: 101325 * Math.exp(-altitude / 8500),
      atmosphericDensity: airDensity,
      temperature: 288.15,
      stagnationTemperature: 288.15 * (1 + 0.2 * mach * mach),
      heatFlux: 0.5 * airDensity * Math.pow(speed, 3) * 0.001,
      activeStage: isStage2 ? 1 : 0,
      orbitalAltitude: altitude > 100_000 ? altitude : null,
      periapsis: altitude > 100_000 ? 185_000 : -200_000,
      apoapsis: altitude > 100_000 ? 220_000 : altitude + 25_000,
      orbitalVelocity: altitude > 100_000 ? speed : null,
      eccentricity: altitude > 100_000 ? 0.0026 : 0.85,
      inclination: 28.6
    });
  }

  const events: SimulationEvent[] = [
    { id: 'ev-1', type: 'launch', timestamp: 0, altitude: 0, description: 'Liftoff — Main Engines Full Thrust' },
    { id: 'ev-2', type: 'maxQ', timestamp: 58, altitude: 11_200, description: 'Max-Q Reached (34.2 kPa)' },
    { id: 'ev-3', type: 'mainEngineCutoff', timestamp: 148, altitude: 65_700, description: 'Main Engine Cut-Off (MECO)' },
    { id: 'ev-4', type: 'stageSeparation', timestamp: 150, altitude: 68_000, description: 'Stage 1 Separation & Stage 2 Ignition' },
    { id: 'ev-5', type: 'atmosphericExit', timestamp: 170, altitude: 102_200, description: 'Crossed Karman Line (100 km)' }
  ];

  return { frames, events };
}
