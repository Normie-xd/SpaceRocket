import { describe, it, expect, beforeEach } from 'vitest';
import { useSimulationStore } from '../src/store/simulationStore';
import type { TelemetryFrame, SimulationEvent } from '../src/types/simulation';

describe('Simulation Store & Real-Time Telemetry Pipeline', () => {
  beforeEach(() => {
    useSimulationStore.getState().resetSimulation();
  });

  it('initializes with default idle state and 1x timeScale', () => {
    const store = useSimulationStore.getState();
    expect(store.state).toBe('idle');
    expect(store.timeScale).toBe(1);
    expect(store.telemetry.length).toBe(0);
    expect(store.latestFrame).toBeNull();
  });

  it('updates timescale up to 32x for user time controls', () => {
    const { setTimeScale } = useSimulationStore.getState();

    setTimeScale(2);
    expect(useSimulationStore.getState().timeScale).toBe(2);

    setTimeScale(16);
    expect(useSimulationStore.getState().timeScale).toBe(16);

    setTimeScale(32);
    expect(useSimulationStore.getState().timeScale).toBe(32);
  });

  it('buffers telemetry frames and tracks latest frame', () => {
    const { pushTelemetry } = useSimulationStore.getState();

    const sampleFrame: TelemetryFrame = {
      timestamp: 10.5,
      positionX: 6371000,
      positionY: 500,
      positionZ: 0,
      velocityX: 50,
      velocityY: 465,
      velocityZ: 0,
      altitude: 500,
      speed: 467,
      surfaceSpeed: 50,
      mach: 0.15,
      dynamicPressure: 1500,
      acceleration: 15,
      gForce: 1.53,
      axialAcceleration: 15,
      thrust: 7500000,
      massFlowRate: 2500,
      isp: 282,
      totalMass: 450000,
      propellantMass: 380000,
      dryMass: 70000,
      pitch: 5.0,
      yaw: 0,
      roll: 0,
      angleOfAttack: 0.2,
      downrange: 120,
      flightPathAngle: 85,
      atmosphericPressure: 95000,
      atmosphericDensity: 1.15,
      temperature: 284,
      stagnationTemperature: 285,
      heatFlux: 500,
      activeStage: 0,
      orbitalAltitude: null,
      periapsis: null,
      apoapsis: null,
      orbitalVelocity: null,
      eccentricity: null,
      inclination: null
    };

    pushTelemetry(sampleFrame);

    const store = useSimulationStore.getState();
    expect(store.telemetry.length).toBe(1);
    expect(store.latestFrame).toEqual(sampleFrame);
    expect(store.elapsedTime).toBe(10.5);
  });

  it('logs simulation events in real-time', () => {
    const { pushEvent } = useSimulationStore.getState();

    const sampleEvent: SimulationEvent = {
      id: 'event-1',
      type: 'maxQ',
      timestamp: 62.4,
      altitude: 12500,
      description: 'Max-Q Reached: 35.2 kPa'
    };

    pushEvent(sampleEvent);

    const store = useSimulationStore.getState();
    expect(store.events.length).toBe(1);
    expect(store.events[0].type).toBe('maxQ');
    expect(store.events[0].altitude).toBe(12500);
  });
});
