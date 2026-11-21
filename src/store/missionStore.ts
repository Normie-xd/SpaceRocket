import { create } from 'zustand'
import type { CelestialBody, LaunchSite, MissionParameters } from '../types/celestial'

interface MissionStore {
  missionParameters: MissionParameters | null
  activeCelestialBody: CelestialBody
  launchSites: LaunchSite[]

  setMissionParameters: (params: MissionParameters) => void
  setActiveCelestialBody: (body: CelestialBody) => void
  addLaunchSite: (site: LaunchSite) => void
  removeLaunchSite: (id: string) => void
  updateLaunchSite: (id: string, updates: Partial<LaunchSite>) => void
}

const DEFAULT_LAUNCH_SITES: LaunchSite[] = [
  {
    id: 'ksc',
    name: 'Kennedy Space Center LC-39A',
    latitude: 28.6080,
    longitude: -80.6042,
    altitude: 0,
    celestialBody: 'earth'
  },
  {
    id: 'baikonur',
    name: 'Baikonur Cosmodrome Site 1',
    latitude: 45.9200,
    longitude: 63.3420,
    altitude: 90,
    celestialBody: 'earth'
  },
  {
    id: 'guiana',
    name: 'Guiana Space Centre ELA-3',
    latitude: 5.2367,
    longitude: -52.7694,
    altitude: 15,
    celestialBody: 'earth'
  },
  {
    id: 'vandenberg',
    name: 'Vandenberg SLC-4E',
    latitude: 34.6321,
    longitude: -120.6107,
    altitude: 60,
    celestialBody: 'earth'
  }
]

export const useMissionStore = create<MissionStore>((set) => ({
  missionParameters: null,
  activeCelestialBody: 'earth',
  launchSites: DEFAULT_LAUNCH_SITES,

  setMissionParameters: (missionParameters) => set({ missionParameters }),
  setActiveCelestialBody: (activeCelestialBody) => set({ activeCelestialBody }),

  addLaunchSite: (site) =>
    set((s) => ({ launchSites: [...s.launchSites, site] })),

  removeLaunchSite: (id) =>
    set((s) => ({ launchSites: s.launchSites.filter((ls) => ls.id !== id) })),

  updateLaunchSite: (id, updates) =>
    set((s) => ({
      launchSites: s.launchSites.map((ls) => (ls.id === id ? { ...ls, ...updates } : ls))
    }))
}))
