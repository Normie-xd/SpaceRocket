import React, { useEffect, useRef } from 'react';
import { Viewport3D } from './Viewport3D';
import { HUDOverlay } from './HUDOverlay';
import { useRocketStore } from '../../store/rocketStore';
import { useSimulationStore } from '../../store/simulationStore';
import { useMissionStore } from '../../store/missionStore';
import { ROCKET_PRESETS } from '../RocketBuilder/RocketPresets';

interface SimulationViewProps {
  onBack: () => void;
}

export const SimulationView: React.FC<SimulationViewProps> = ({ onBack }) => {
  const { currentDesign } = useRocketStore();
  const { latestFrame, timeScale, state, pushTelemetry, pushEvent, resetSimulation, setState, setTimeScale } = useSimulationStore();
  const { activeCelestialBody } = useMissionStore();

  const workerRef = useRef<Worker | null>(null);
  const design = currentDesign || ROCKET_PRESETS[1]; // Zephyr-1 default

  // Keyboard shortcuts: Space (Pause/Resume), G (Stage), 1-6 (Time Scale)
  useEffect(() => {
    const scaleMap: Record<string, 1 | 2 | 4 | 8 | 16 | 32> = {
      '1': 1,
      '2': 2,
      '3': 4,
      '4': 8,
      '5': 16,
      '6': 32
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setState(state === 'paused' ? 'running' : 'paused');
      } else if (e.key === 'g' || e.key === 'G') {
        workerRef.current?.postMessage({ type: 'STAGE' });
      } else if (scaleMap[e.key]) {
        setTimeScale(scaleMap[e.key]);
        setState('running');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, setState, setTimeScale]);

  useEffect(() => {
    // 1. Instantiate the Simulation Web Worker
    let worker: Worker;
    try {
      worker = new Worker(new URL('../../engine/SimulationWorker.ts', import.meta.url), { type: 'module' });
      workerRef.current = worker;

      worker.onmessage = (e: MessageEvent) => {
        const msg = e.data;
        if (msg.type === 'TELEMETRY' && msg.frame) {
          pushTelemetry(msg.frame);
        } else if (msg.type === 'EVENT' && msg.event) {
          pushEvent(msg.event);
        }
      };

      // 2. Initialize and start simulation
      worker.postMessage({
        type: 'INIT',
        design,
        body: activeCelestialBody || 'earth',
        launchSiteLatitude: 28.6 // KSC latitude
      });

      worker.postMessage({ type: 'START' });
      setState('running');
    } catch (err) {
      console.error('[SimulationView] Failed to start Web Worker:', err);
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.postMessage({ type: 'RESET' });
        workerRef.current.terminate();
        workerRef.current = null;
      }
      resetSimulation();
    };
  }, [design, activeCelestialBody, pushTelemetry, pushEvent, resetSimulation, setState]);

  // Sync timescale with worker
  useEffect(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'SET_TIMESCALE', timeScale });
    }
  }, [timeScale]);

  // Sync play/pause with worker
  useEffect(() => {
    if (workerRef.current) {
      if (state === 'paused') {
        workerRef.current.postMessage({ type: 'PAUSE' });
      } else if (state === 'running') {
        workerRef.current.postMessage({ type: 'START' });
      }
    }
  }, [state]);

  const handleStage = () => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'STAGE' });
    }
  };

  const handleReset = () => {
    if (workerRef.current) {
      workerRef.current.postMessage({
        type: 'INIT',
        design,
        body: activeCelestialBody || 'earth',
        launchSiteLatitude: 28.6
      });
      workerRef.current.postMessage({ type: 'START' });
      resetSimulation();
      setState('running');
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#050508' }}>
      {/* 3D Visual Viewport */}
      <Viewport3D
        design={design}
        rocketAltitude={latestFrame?.altitude || 0}
        rocketPitchDeg={latestFrame?.pitch || 0}
        rocketYawDeg={latestFrame?.yaw || 0}
        rocketRollDeg={latestFrame?.roll || 0}
      />

      {/* Flight Telemetry HUD Overlay */}
      <HUDOverlay
        onStage={handleStage}
        onReset={handleReset}
        onExit={onBack}
      />
    </div>
  );
};
