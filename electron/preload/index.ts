import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Expose electron utilities to renderer via context bridge
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('electronAPI', {
      platform: process.platform,

      // ── Rocket Designs (JSON files) ────────────────────────────────────────
      saveRocket: (data: unknown) => ipcRenderer.invoke('rocket:save', data),
      loadRocket: (id: string) => ipcRenderer.invoke('rocket:load', id),
      listRockets: () => ipcRenderer.invoke('rocket:list'),
      deleteRocket: (id: string) => ipcRenderer.invoke('rocket:delete', id),

      // ── Mission Logs (JSON files) ──────────────────────────────────────────
      saveMissionLog: (data: unknown) => ipcRenderer.invoke('mission:save', data),
      listMissionLogs: () => ipcRenderer.invoke('mission:list'),
      loadMissionLog: (id: string) => ipcRenderer.invoke('mission:load', id),

      // ── File System: Export ────────────────────────────────────────────────
      exportTelemetryCSV: (data: unknown) => ipcRenderer.invoke('export:csv', data),
      exportTelemetryJSON: (data: unknown) => ipcRenderer.invoke('export:json', data),
      showSaveDialog: (options: unknown) => ipcRenderer.invoke('dialog:showSave', options),
      showOpenDialog: (options: unknown) => ipcRenderer.invoke('dialog:showOpen', options),

      // ── App ────────────────────────────────────────────────────────────────
      getVersion: () => ipcRenderer.invoke('app:version'),
      openDataFolder: () => ipcRenderer.invoke('app:openDataFolder')
    })
  } catch (error) {
    console.error('[Preload] Context bridge error:', error)
  }
} else {
  console.warn('[Preload] Context isolation is disabled')
}
