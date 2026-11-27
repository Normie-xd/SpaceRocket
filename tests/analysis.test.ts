import { describe, it, expect } from 'vitest';
import {
  computePostFlightSummary,
  telemetryToCSV,
  telemetryToJSON,
  generateSampleFlightTelemetry
} from '../src/views/AnalysisView/telemetryExport';
import { useSettingsStore } from '../src/store/settingsStore';

describe('Post-Flight Analysis & Telemetry Export', () => {
  it('computes accurate summary metrics from flight telemetry', () => {
    const { frames } = generateSampleFlightTelemetry();
    const summary = computePostFlightSummary(frames);

    expect(summary.sampleCount).toBe(frames.length);
    expect(summary.durationSeconds).toBe(240);
    expect(summary.maxAltitudeMeters).toBeGreaterThan(100_000);
    expect(summary.maxSpeedMps).toBeGreaterThan(3000);
    expect(summary.maxMach).toBeGreaterThan(5);
    expect(summary.maxDynamicPressurePa).toBeGreaterThan(1000);
    expect(summary.maxGForce).toBeGreaterThan(1.0);
  });

  it('serializes telemetry frames to valid CSV with headers', () => {
    const { frames } = generateSampleFlightTelemetry();
    const csv = telemetryToCSV(frames);
    const lines = csv.split('\n');

    expect(lines.length).toBe(frames.length + 1);
    expect(lines[0]).toContain('timestamp_s,altitude_m,downrange_m,speed_mps,mach');
    expect(lines[1].split(',').length).toBe(15);
  });

  it('serializes telemetry and events to valid JSON export payload', () => {
    const { frames, events } = generateSampleFlightTelemetry();
    const jsonStr = telemetryToJSON(frames, events);
    const parsed = JSON.parse(jsonStr);

    expect(parsed.summary.sampleCount).toBe(frames.length);
    expect(parsed.events.length).toBe(events.length);
    expect(parsed.telemetry.length).toBe(frames.length);
  });
});

describe('Settings Store Configuration', () => {
  it('supports metric/imperial toggling and fidelity settings', () => {
    const store = useSettingsStore.getState();
    expect(store.unitSystem).toBe('metric');

    store.setUnitSystem('imperial');
    expect(useSettingsStore.getState().unitSystem).toBe('imperial');

    store.setSimulationFidelity('high');
    expect(useSettingsStore.getState().simulationFidelity).toBe('high');

    store.setUnitSystem('metric');
    store.setSimulationFidelity('standard');
  });
});
