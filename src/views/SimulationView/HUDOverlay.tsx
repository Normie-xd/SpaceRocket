/**
 * Flight Telemetry HUD Overlay & Mission Control Interface
 * 
 * Displays live digital flight gauges over the 3D simulation viewport:
 * - Altitude (ASL/AGL), Speed (Inertial & Surface), Mach number, G-force, Dynamic Pressure (q)
 * - Thrust, Propellant remaining %, Mass, Pitch/Yaw/Roll, Flight Path Angle
 * - Orbital elements: Periapsis, Apoapsis, Inclination
 * - Time controls (1x to 32x, Pause, Resume, Reset) and Manual Staging trigger
 * - Supports Metric (SI) and Imperial unit systems
 */

import React from 'react';
import { useSimulationStore, type TimeScale } from '../../store/simulationStore';
import { useSettingsStore } from '../../store/settingsStore';
import type { TelemetryFrame } from '../../types/simulation';

interface HUDOverlayProps {
  onStage: () => void;
  onReset: () => void;
  onExit: () => void;
}

export const HUDOverlay: React.FC<HUDOverlayProps> = ({ onStage, onReset, onExit }) => {
  const { state, timeScale, latestFrame, events, setTimeScale, setState } = useSimulationStore();
  const { unitSystem, setUnitSystem } = useSettingsStore();

  const isMetric = unitSystem === 'metric';

  // Fallback frame at T=0
  const f: TelemetryFrame = latestFrame || {
    timestamp: 0,
    positionX: 0,
    positionY: 0,
    positionZ: 0,
    velocityX: 0,
    velocityY: 0,
    velocityZ: 0,
    altitude: 0,
    speed: 0,
    surfaceSpeed: 0,
    mach: 0,
    dynamicPressure: 0,
    acceleration: 0,
    gForce: 1.0,
    axialAcceleration: 0,
    thrust: 0,
    massFlowRate: 0,
    isp: 300,
    totalMass: 1000,
    propellantMass: 800,
    dryMass: 200,
    pitch: 0,
    yaw: 0,
    roll: 0,
    angleOfAttack: 0,
    downrange: 0,
    flightPathAngle: 90,
    atmosphericPressure: 101325,
    atmosphericDensity: 1.225,
    temperature: 288.15,
    stagnationTemperature: 288.15,
    heatFlux: 0,
    activeStage: 0,
    orbitalAltitude: null,
    periapsis: null,
    apoapsis: null,
    orbitalVelocity: null,
    eccentricity: null,
    inclination: null
  };

  // Format Helpers
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `T+ ${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const formatAlt = (meters: number) => {
    if (isMetric) {
      if (meters >= 10_000) return `${(meters / 1000).toFixed(2)} km`;
      return `${Math.round(meters).toLocaleString()} m`;
    }
    // Imperial (feet or miles)
    const feet = meters * 3.28084;
    if (feet >= 52800) return `${(feet / 5280).toFixed(2)} mi`;
    return `${Math.round(feet).toLocaleString()} ft`;
  };

  const formatSpeed = (mps: number) => {
    if (isMetric) {
      if (mps >= 1000) return `${(mps / 1000).toFixed(2)} km/s`;
      return `${Math.round(mps).toLocaleString()} m/s`;
    }
    const mph = mps * 2.23694;
    return `${Math.round(mph).toLocaleString()} mph`;
  };

  const timeScales: TimeScale[] = [1, 2, 4, 8, 16, 32];

  return (
    <div style={containerStyle}>
      {/* ─── Top Control Bar ─────────────────────────────────────────────── */}
      <div style={topBarStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn-ghost" onClick={onExit} style={{ fontSize: 13 }}>
            ← Back to Builder
          </button>
          <button className="btn-ghost" onClick={onReset} style={{ fontSize: 13 }}>
            ↺ Reset Flight
          </button>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
            {formatTime(f.timestamp)}
          </div>
        </div>

        {/* Time Acceleration Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-elevated)', padding: 4, borderRadius: 6 }}>
          <button
            className={state === 'paused' ? 'btn-primary' : 'btn-ghost'}
            onClick={() => setState(state === 'paused' ? 'running' : 'paused')}
            style={{ fontSize: 12, padding: '4px 10px' }}
          >
            {state === 'paused' ? '▶ Resume' : '⏸ Pause'}
          </button>

          {timeScales.map((scale) => (
            <button
              key={scale}
              className={timeScale === scale && state === 'running' ? 'btn-primary' : 'btn-ghost'}
              onClick={() => {
                setTimeScale(scale);
                setState('running');
              }}
              style={{ fontSize: 11, padding: '3px 7px', fontFamily: 'var(--font-mono)' }}
            >
              {scale}×
            </button>
          ))}
        </div>

        {/* Units Toggle & Staging */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            className="btn-ghost"
            onClick={() => setUnitSystem(isMetric ? 'imperial' : 'metric')}
            style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}
          >
            Units: {isMetric ? 'SI (Metric)' : 'US (Imperial)'}
          </button>

          <button
            className="btn-primary"
            onClick={onStage}
            style={{ background: 'var(--accent-orange)', color: '#fff', fontSize: 13, padding: '6px 14px' }}
          >
            ⚡ Stage Vehicle
          </button>
        </div>
      </div>

      {/* ─── Left Telemetry Flight Gauges ─────────────────────────────────── */}
      <div style={leftGaugeStyle}>
        <div className="panel" style={gaugeBoxStyle}>
          <div style={labelStyle}>Altitude (ASL)</div>
          <div style={valueStyle}>{formatAlt(f.altitude)}</div>
          <div style={subValueStyle}>Downrange: {formatAlt(f.downrange)}</div>
        </div>

        <div className="panel" style={gaugeBoxStyle}>
          <div style={labelStyle}>Velocity (Inertial)</div>
          <div style={{ ...valueStyle, color: 'var(--accent-green)' }}>{formatSpeed(f.speed)}</div>
          <div style={subValueStyle}>Surface: {formatSpeed(f.surfaceSpeed)}</div>
        </div>

        <div className="panel" style={gaugeBoxStyle}>
          <div style={labelStyle}>Mach Number</div>
          <div style={{ ...valueStyle, color: f.mach >= 1.0 ? 'var(--accent-orange)' : 'var(--text-primary)' }}>
            M {f.mach.toFixed(2)}
          </div>
          <div style={subValueStyle}>
            {f.mach < 0.8 ? 'Subsonic' : f.mach < 1.2 ? 'Transonic' : f.mach < 5.0 ? 'Supersonic' : 'Hypersonic'}
          </div>
        </div>

        <div className="panel" style={gaugeBoxStyle}>
          <div style={labelStyle}>Dynamic Pressure (q)</div>
          <div style={valueStyle}>{(f.dynamicPressure / 1000).toFixed(1)} kPa</div>
          <div style={subValueStyle}>Load: {f.gForce.toFixed(2)} G</div>
        </div>
      </div>

      {/* ─── Right Propulsion & Orbital Elements Panel ─────────────────────── */}
      <div style={rightGaugeStyle}>
        <div className="panel" style={gaugeBoxStyle}>
          <div style={labelStyle}>Thrust Output</div>
          <div style={{ ...valueStyle, color: 'var(--accent-orange)' }}>
            {f.thrust >= 1_000_000 ? `${(f.thrust / 1_000_000).toFixed(2)} MN` : `${Math.round(f.thrust / 1000)} kN`}
          </div>
          <div style={subValueStyle}>Active Stage: {f.activeStage + 1}</div>
        </div>

        <div className="panel" style={gaugeBoxStyle}>
          <div style={labelStyle}>Vehicle Mass</div>
          <div style={valueStyle}>{(f.totalMass / 1000).toFixed(1)} t</div>
          <div style={subValueStyle}>Propellant: {Math.round(f.propellantMass).toLocaleString()} kg</div>
        </div>

        <div className="panel" style={gaugeBoxStyle}>
          <div style={labelStyle}>Attitude (Pitch / Yaw / Roll)</div>
          <div style={{ ...valueStyle, fontSize: 14 }}>
            {f.pitch.toFixed(1)}° / {f.yaw.toFixed(1)}° / {f.roll.toFixed(1)}°
          </div>
          <div style={subValueStyle}>FPA: {f.flightPathAngle.toFixed(1)}°</div>
        </div>

        <div className="panel" style={gaugeBoxStyle}>
          <div style={labelStyle}>Orbit Ap / Pe</div>
          <div style={{ ...valueStyle, fontSize: 13, color: 'var(--accent-cyan)' }}>
            {f.apoapsis !== null && f.apoapsis > 0 ? `Ap: ${formatAlt(f.apoapsis)}` : 'Ap: --'}
          </div>
          <div style={subValueStyle}>
            {f.periapsis !== null && f.periapsis > 0 ? `Pe: ${formatAlt(f.periapsis)}` : 'Pe: Suborbital'}
          </div>
        </div>
      </div>

      {/* ─── Bottom Mission Event Feed ────────────────────────────────────── */}
      <div style={bottomEventStyle}>
        {events.slice(-3).map((ev) => (
          <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
              {formatTime(ev.timestamp)}:
            </span>
            <span style={{ fontWeight: 600 }}>{ev.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Styles
const containerStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  padding: 16
};

const topBarStyle: React.CSSProperties = {
  pointerEvents: 'auto',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 16px',
  background: 'rgba(10, 10, 15, 0.85)',
  backdropFilter: 'blur(10px)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--border)'
};

const leftGaugeStyle: React.CSSProperties = {
  pointerEvents: 'auto',
  position: 'absolute',
  top: 76,
  left: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  width: 170
};

const rightGaugeStyle: React.CSSProperties = {
  pointerEvents: 'auto',
  position: 'absolute',
  top: 76,
  right: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  width: 180
};

const gaugeBoxStyle: React.CSSProperties = {
  padding: '8px 12px',
  background: 'rgba(15, 15, 26, 0.8)',
  backdropFilter: 'blur(6px)'
};

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em'
};

const valueStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  fontFamily: 'var(--font-mono)',
  color: 'var(--text-primary)',
  marginTop: 2
};

const subValueStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--text-secondary)',
  fontFamily: 'var(--font-mono)',
  marginTop: 2
};

const bottomEventStyle: React.CSSProperties = {
  pointerEvents: 'auto',
  alignSelf: 'center',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  padding: '8px 16px',
  background: 'rgba(15, 15, 26, 0.85)',
  backdropFilter: 'blur(8px)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border)',
  minWidth: 320,
  textAlign: 'center'
};
