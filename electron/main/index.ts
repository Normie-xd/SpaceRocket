import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, unlinkSync } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

// ─── Data Directory Setup ──────────────────────────────────────────────────────
const DATA_DIR = join(app.getPath('userData'), 'SpaceRocket')
const ROCKETS_DIR = join(DATA_DIR, 'rockets')
const MISSIONS_DIR = join(DATA_DIR, 'missions')
const EXPORTS_DIR = join(DATA_DIR, 'exports')

function ensureDataDirs(): void {
  for (const dir of [DATA_DIR, ROCKETS_DIR, MISSIONS_DIR, EXPORTS_DIR]) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  }
}

// ─── Window ───────────────────────────────────────────────────────────────────
function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    minWidth: 1280,
    minHeight: 720,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#0a0a0f',
    title: 'SpaceRocket',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    mainWindow.maximize()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ─── App Lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.spacerocket.app')
  ensureDataDirs()

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ─── IPC Handlers ─────────────────────────────────────────────────────────────
function registerIpcHandlers(): void {

  // ── App info ────────────────────────────────────────────────────────────────
  ipcMain.handle('app:version', () => app.getVersion())
  ipcMain.handle('app:openDataFolder', () => shell.openPath(DATA_DIR))

  // ── Rocket Designs (JSON files) ─────────────────────────────────────────────
  ipcMain.handle('rocket:save', (_, data: { id: string; [key: string]: unknown }) => {
    const filePath = join(ROCKETS_DIR, `${data.id}.json`)
    writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
    return { id: data.id, path: filePath }
  })

  ipcMain.handle('rocket:load', (_, id: string) => {
    const filePath = join(ROCKETS_DIR, `${id}.json`)
    if (!existsSync(filePath)) return null
    return JSON.parse(readFileSync(filePath, 'utf-8'))
  })

  ipcMain.handle('rocket:list', () => {
    if (!existsSync(ROCKETS_DIR)) return []
    return readdirSync(ROCKETS_DIR)
      .filter((f) => f.endsWith('.json'))
      .map((f) => {
        try {
          const data = JSON.parse(readFileSync(join(ROCKETS_DIR, f), 'utf-8'))
          return { id: data.id, name: data.name, updatedAt: data.updatedAt }
        } catch {
          return null
        }
      })
      .filter(Boolean)
  })

  ipcMain.handle('rocket:delete', (_, id: string) => {
    const filePath = join(ROCKETS_DIR, `${id}.json`)
    if (existsSync(filePath)) unlinkSync(filePath)
  })

  // ── Mission Logs (JSON files) ───────────────────────────────────────────────
  ipcMain.handle('mission:save', (_, data: { id: string; [key: string]: unknown }) => {
    const filePath = join(MISSIONS_DIR, `${data.id}.json`)
    writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
    return { id: data.id }
  })

  ipcMain.handle('mission:load', (_, id: string) => {
    const filePath = join(MISSIONS_DIR, `${id}.json`)
    if (!existsSync(filePath)) return null
    return JSON.parse(readFileSync(filePath, 'utf-8'))
  })

  ipcMain.handle('mission:list', () => {
    if (!existsSync(MISSIONS_DIR)) return []
    return readdirSync(MISSIONS_DIR)
      .filter((f) => f.endsWith('.json'))
      .map((f) => {
        try {
          const data = JSON.parse(readFileSync(join(MISSIONS_DIR, f), 'utf-8'))
          return { id: data.id, name: data.missionName, timestamp: data.timestamp }
        } catch {
          return null
        }
      })
      .filter(Boolean)
  })

  // ── Telemetry Export ────────────────────────────────────────────────────────
  ipcMain.handle('export:csv', async (_, data: { filename: string; csv: string }) => {
    const { filePath, canceled } = await dialog.showSaveDialog({
      defaultPath: join(EXPORTS_DIR, data.filename ?? 'telemetry.csv'),
      filters: [{ name: 'CSV', extensions: ['csv'] }]
    })
    if (!canceled && filePath) {
      writeFileSync(filePath, data.csv, 'utf-8')
      return { success: true, filePath }
    }
    return { success: false }
  })

  ipcMain.handle('export:json', async (_, data: { filename: string; json: string }) => {
    const { filePath, canceled } = await dialog.showSaveDialog({
      defaultPath: join(EXPORTS_DIR, data.filename ?? 'telemetry.json'),
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })
    if (!canceled && filePath) {
      writeFileSync(filePath, data.json, 'utf-8')
      return { success: true, filePath }
    }
    return { success: false }
  })

  // ── Dialogs ─────────────────────────────────────────────────────────────────
  ipcMain.handle('dialog:showSave', (_, options: Electron.SaveDialogOptions) =>
    dialog.showSaveDialog(options)
  )
  ipcMain.handle('dialog:showOpen', (_, options: Electron.OpenDialogOptions) =>
    dialog.showOpenDialog(options)
  )
}
