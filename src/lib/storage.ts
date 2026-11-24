/**
 * Storage — Tauri IPC wrapper
 *
 * Thin TypeScript wrappers around Rust commands exposed via Tauri's invoke().
 * All file I/O happens in Rust (safe, no native Node.js dependencies).
 *
 * Data is stored at:
 *   Windows: %APPDATA%\com.spacerocket.app\
 *   macOS:   ~/Library/Application Support/com.spacerocket.app/
 *   Linux:   ~/.local/share/com.spacerocket.app/
 */

import { invoke } from '@tauri-apps/api/core'
import type { RocketDesign } from '../types/rocket'

// ─── Types matching Rust response structs ─────────────────────────────────────

export interface RocketMeta {
  id: string
  name: string
  updatedAt: string
}

export interface MissionMeta {
  id: string
  missionName: string
  timestamp: string
}

export interface SaveResult {
  id: string
  path: string
}

// ─── Rocket Design Storage ────────────────────────────────────────────────────

export async function saveRocket(design: RocketDesign): Promise<SaveResult> {
  return invoke<SaveResult>('save_rocket', { data: design })
}

export async function loadRocket(id: string): Promise<RocketDesign | null> {
  return invoke<RocketDesign | null>('load_rocket', { id })
}

export async function listRockets(): Promise<RocketMeta[]> {
  return invoke<RocketMeta[]>('list_rockets')
}

export async function deleteRocket(id: string): Promise<void> {
  return invoke('delete_rocket', { id })
}

// ─── Mission Log Storage ──────────────────────────────────────────────────────

export async function saveMission(data: Record<string, unknown>): Promise<SaveResult> {
  return invoke<SaveResult>('save_mission', { data })
}

export async function loadMission(id: string): Promise<Record<string, unknown> | null> {
  return invoke<Record<string, unknown> | null>('load_mission', { id })
}

export async function listMissions(): Promise<MissionMeta[]> {
  return invoke<MissionMeta[]>('list_missions')
}

export async function deleteMission(id: string): Promise<void> {
  return invoke('delete_mission', { id })
}

// ─── Export ───────────────────────────────────────────────────────────────────

export async function writeExportFile(filename: string, content: string): Promise<string> {
  return invoke<string>('write_export_file', { filename, content })
}

// ─── App Utilities ────────────────────────────────────────────────────────────

export async function getAppVersion(): Promise<string> {
  return invoke<string>('get_app_version')
}

export async function openDataFolder(): Promise<void> {
  return invoke('open_data_folder')
}
