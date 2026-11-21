/// <reference types="vite/client" />

// ── Window API (exposed by Electron preload) ──────────────────────────────────
interface Window {
  electronAPI: {
    platform: string

    // Rocket designs
    saveRocket: (data: unknown) => Promise<{ id: string }>
    loadRocket: (id: string) => Promise<unknown>
    listRockets: () => Promise<unknown[]>
    deleteRocket: (id: string) => Promise<void>

    // Mission logs
    saveMissionLog: (data: unknown) => Promise<{ id: string }>
    listMissionLogs: () => Promise<unknown[]>

    // File system / export
    exportTelemetryCSV: (data: unknown, filePath: string) => Promise<void>
    exportTelemetryJSON: (data: unknown, filePath: string) => Promise<void>
    showSaveDialog: (options: unknown) => Promise<{ filePath?: string; canceled: boolean }>
    showOpenDialog: (options: unknown) => Promise<{ filePaths: string[]; canceled: boolean }>
  }
}

// ── GLSL shader imports ───────────────────────────────────────────────────────
declare module '*.glsl' {
  const content: string
  export default content
}
declare module '*.vert' {
  const content: string
  export default content
}
declare module '*.frag' {
  const content: string
  export default content
}
