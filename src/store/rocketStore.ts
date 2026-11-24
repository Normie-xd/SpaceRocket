import { create } from 'zustand'
import type {
  RocketDesign,
  RocketComponent
} from '../types/rocket'

interface RocketStore {
  // Active design being edited
  currentDesign: RocketDesign | null

  // All saved designs (from DB)
  savedDesigns: RocketDesign[]

  // Actions
  newDesign: (name: string) => void
  setCurrentDesign: (design: RocketDesign | null) => void
  setSavedDesigns: (designs: RocketDesign[]) => void

  addComponent: (component: RocketComponent) => void
  removeComponent: (id: string) => void
  updateComponent: (id: string, params: Partial<RocketComponent['parameters']>) => void
  reorderComponents: (fromIndex: number, toIndex: number) => void
}

export const useRocketStore = create<RocketStore>((set) => ({
  currentDesign: null,
  savedDesigns: [],

  newDesign: (name) =>
    set({
      currentDesign: {
        id: crypto.randomUUID(),
        name,
        components: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }),

  setCurrentDesign: (design) => set({ currentDesign: design }),
  setSavedDesigns: (designs) => set({ savedDesigns: designs }),

  addComponent: (component) =>
    set((s) => ({
      currentDesign: s.currentDesign
        ? {
            ...s.currentDesign,
            components: [...s.currentDesign.components, component],
            updatedAt: new Date().toISOString()
          }
        : null
    })),

  removeComponent: (id) =>
    set((s) => ({
      currentDesign: s.currentDesign
        ? {
            ...s.currentDesign,
            components: s.currentDesign.components.filter((c) => c.id !== id),
            updatedAt: new Date().toISOString()
          }
        : null
    })),

  updateComponent: (id, params) =>
    set((s) => ({
      currentDesign: s.currentDesign
        ? {
            ...s.currentDesign,
            components: s.currentDesign.components.map((c) =>
              c.id === id
                ? ({ ...c, parameters: { ...c.parameters, ...params } } as RocketComponent)
                : c
            ),
            updatedAt: new Date().toISOString()
          }
        : null
    })),

  reorderComponents: (fromIndex, toIndex) =>
    set((s) => {
      if (!s.currentDesign) return {}
      const components = [...s.currentDesign.components]
      const [moved] = components.splice(fromIndex, 1)
      components.splice(toIndex, 0, moved)
      return {
        currentDesign: { ...s.currentDesign, components, updatedAt: new Date().toISOString() }
      }
    })
}))
