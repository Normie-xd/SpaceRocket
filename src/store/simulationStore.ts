import { create } from 'zustand'
import type { TelemetryFrame, SimulationEvent } from '../types/simulation'

export type SimulationState = 'idle' | 'running' | 'paused' | 'completed' | 'failed' | 'aborted'
export type TimeScale = 1 | 2 | 4 | 8 | 16 | 32

interface SimulationStore {
  // State
  state: SimulationState
  timeScale: TimeScale
  elapsedTime: number         // simulation seconds since launch

  // Telemetry
  telemetry: TelemetryFrame[]
  latestFrame: TelemetryFrame | null

  // Events (stage separation, Max-Q, MECO, orbit insertion, etc.)
  events: SimulationEvent[]

  // Camera target (which stage/component to follow)
  cameraTarget: string | null

  // Actions
  setState: (state: SimulationState) => void
  setTimeScale: (scale: TimeScale) => void
  pushTelemetry: (frame: TelemetryFrame) => void
  pushEvent: (event: SimulationEvent) => void
  setCameraTarget: (target: string | null) => void
  resetSimulation: () => void
}

export const useSimulationStore = create<SimulationStore>((set) => ({
  state: 'idle',
  timeScale: 1,
  elapsedTime: 0,
  telemetry: [],
  latestFrame: null,
  events: [],
  cameraTarget: null,

  setState: (state) => set({ state }),
  setTimeScale: (timeScale) => set({ timeScale }),

  pushTelemetry: (frame) =>
    set((s) => ({
      // Keep last 10 000 frames in memory; older frames are flushed for export
      telemetry: s.telemetry.length < 10000 ? [...s.telemetry, frame] : [...s.telemetry.slice(-9999), frame],
      latestFrame: frame,
      elapsedTime: frame.timestamp
    })),

  pushEvent: (event) =>
    set((s) => ({ events: [...s.events, event] })),

  setCameraTarget: (cameraTarget) => set({ cameraTarget }),

  resetSimulation: () =>
    set({ state: 'idle', elapsedTime: 0, telemetry: [], latestFrame: null, events: [], cameraTarget: null })
}))
