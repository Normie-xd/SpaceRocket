import { create } from 'zustand'

export type UnitSystem = 'metric' | 'imperial'
export type SimulationFidelity = 'standard' | 'high'
export type GraphicsQuality = 'low' | 'medium' | 'high' | 'ultra'

interface SettingsStore {
  // Units
  unitSystem: UnitSystem

  // Simulation
  simulationFidelity: SimulationFidelity
  enableAtmosphericTurbulence: boolean
  enableThermalModeling: boolean

  // Graphics
  graphicsQuality: GraphicsQuality
  enableAtmosphericScattering: boolean
  enableVolumetricExhaust: boolean
  enableShadows: boolean
  enablePostProcessing: boolean

  // UI
  showTelemetryGrid: boolean
  showTrajectoryArc: boolean
  showOrbitElements: boolean

  // Actions
  setUnitSystem: (system: UnitSystem) => void
  setSimulationFidelity: (fidelity: SimulationFidelity) => void
  setGraphicsQuality: (quality: GraphicsQuality) => void
  toggleSetting: (key: keyof Omit<SettingsStore, 'unitSystem' | 'simulationFidelity' | 'graphicsQuality' | 'setUnitSystem' | 'setSimulationFidelity' | 'setGraphicsQuality' | 'toggleSetting'>) => void
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  unitSystem: 'metric',
  simulationFidelity: 'standard',
  enableAtmosphericTurbulence: false,
  enableThermalModeling: true,

  graphicsQuality: 'high',
  enableAtmosphericScattering: true,
  enableVolumetricExhaust: true,
  enableShadows: true,
  enablePostProcessing: true,

  showTelemetryGrid: true,
  showTrajectoryArc: true,
  showOrbitElements: true,

  setUnitSystem: (unitSystem) => set({ unitSystem }),
  setSimulationFidelity: (simulationFidelity) => set({ simulationFidelity }),
  setGraphicsQuality: (graphicsQuality) => set({ graphicsQuality }),
  toggleSetting: (key) => set((s) => ({ [key]: !s[key as keyof SettingsStore] } as Partial<SettingsStore>))
}))
