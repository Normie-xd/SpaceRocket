use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

// ─── Path helpers ──────────────────────────────────────────────────────────────

fn rockets_dir(app: &AppHandle) -> PathBuf {
    app.path().app_data_dir().unwrap().join("rockets")
}

fn missions_dir(app: &AppHandle) -> PathBuf {
    app.path().app_data_dir().unwrap().join("missions")
}

fn exports_dir(app: &AppHandle) -> PathBuf {
    app.path().app_data_dir().unwrap().join("exports")
}

// ─── Response types ────────────────────────────────────────────────────────────

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct RocketMeta {
    pub id: String,
    pub name: String,
    #[serde(rename = "updatedAt")]
    pub updated_at: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct MissionMeta {
    pub id: String,
    #[serde(rename = "missionName")]
    pub mission_name: String,
    pub timestamp: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SaveResult {
    pub id: String,
    pub path: String,
}

// ─── Rocket Design Commands ────────────────────────────────────────────────────

#[tauri::command]
pub fn save_rocket(app: AppHandle, data: Value) -> Result<SaveResult, String> {
    let dir = rockets_dir(&app);
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;

    let id = data["id"].as_str().ok_or("Missing 'id' field")?.to_string();
    let path = dir.join(format!("{}.json", id));
    let json = serde_json::to_string_pretty(&data).map_err(|e| e.to_string())?;
    fs::write(&path, json).map_err(|e| e.to_string())?;

    Ok(SaveResult {
        id,
        path: path.to_string_lossy().to_string(),
    })
}

#[tauri::command]
pub fn load_rocket(app: AppHandle, id: String) -> Result<Option<Value>, String> {
    let path = rockets_dir(&app).join(format!("{}.json", id));
    if !path.exists() {
        return Ok(None);
    }
    let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
    let data: Value = serde_json::from_str(&content).map_err(|e| e.to_string())?;
    Ok(Some(data))
}

#[tauri::command]
pub fn list_rockets(app: AppHandle) -> Result<Vec<RocketMeta>, String> {
    let dir = rockets_dir(&app);
    if !dir.exists() {
        return Ok(vec![]);
    }

    let mut metas: Vec<RocketMeta> = fs::read_dir(dir)
        .map_err(|e| e.to_string())?
        .flatten()
        .filter(|e| {
            e.path()
                .extension()
                .map(|ext| ext == "json")
                .unwrap_or(false)
        })
        .filter_map(|entry| {
            let content = fs::read_to_string(entry.path()).ok()?;
            let data: Value = serde_json::from_str(&content).ok()?;
            Some(RocketMeta {
                id: data["id"].as_str().unwrap_or("").to_string(),
                name: data["name"].as_str().unwrap_or("Unnamed").to_string(),
                updated_at: data["updatedAt"].as_str().unwrap_or("").to_string(),
            })
        })
        .collect();

    // Sort by updatedAt descending (newest first)
    metas.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    Ok(metas)
}

#[tauri::command]
pub fn delete_rocket(app: AppHandle, id: String) -> Result<(), String> {
    let path = rockets_dir(&app).join(format!("{}.json", id));
    if path.exists() {
        fs::remove_file(path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

// ─── Mission Log Commands ──────────────────────────────────────────────────────

#[tauri::command]
pub fn save_mission(app: AppHandle, data: Value) -> Result<SaveResult, String> {
    let dir = missions_dir(&app);
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;

    let id = data["id"].as_str().ok_or("Missing 'id' field")?.to_string();
    let path = dir.join(format!("{}.json", id));
    let json = serde_json::to_string_pretty(&data).map_err(|e| e.to_string())?;
    fs::write(&path, json).map_err(|e| e.to_string())?;

    Ok(SaveResult {
        id,
        path: path.to_string_lossy().to_string(),
    })
}

#[tauri::command]
pub fn load_mission(app: AppHandle, id: String) -> Result<Option<Value>, String> {
    let path = missions_dir(&app).join(format!("{}.json", id));
    if !path.exists() {
        return Ok(None);
    }
    let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
    let data: Value = serde_json::from_str(&content).map_err(|e| e.to_string())?;
    Ok(Some(data))
}

#[tauri::command]
pub fn list_missions(app: AppHandle) -> Result<Vec<MissionMeta>, String> {
    let dir = missions_dir(&app);
    if !dir.exists() {
        return Ok(vec![]);
    }

    let mut metas: Vec<MissionMeta> = fs::read_dir(dir)
        .map_err(|e| e.to_string())?
        .flatten()
        .filter(|e| {
            e.path()
                .extension()
                .map(|ext| ext == "json")
                .unwrap_or(false)
        })
        .filter_map(|entry| {
            let content = fs::read_to_string(entry.path()).ok()?;
            let data: Value = serde_json::from_str(&content).ok()?;
            Some(MissionMeta {
                id: data["id"].as_str().unwrap_or("").to_string(),
                mission_name: data["missionName"].as_str().unwrap_or("Unnamed Mission").to_string(),
                timestamp: data["timestamp"].as_str().unwrap_or("").to_string(),
            })
        })
        .collect();

    metas.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
    Ok(metas)
}

#[tauri::command]
pub fn delete_mission(app: AppHandle, id: String) -> Result<(), String> {
    let path = missions_dir(&app).join(format!("{}.json", id));
    if path.exists() {
        fs::remove_file(path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

// ─── Export Commands ───────────────────────────────────────────────────────────

#[tauri::command]
pub fn write_export_file(app: AppHandle, filename: String, content: String) -> Result<String, String> {
    let dir = exports_dir(&app);
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let path = dir.join(&filename);
    fs::write(&path, content).map_err(|e| e.to_string())?;
    Ok(path.to_string_lossy().to_string())
}

// ─── App Utility Commands ──────────────────────────────────────────────────────

#[tauri::command]
pub fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[tauri::command]
pub fn open_data_folder(app: AppHandle) -> Result<(), String> {
    let data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;

    #[cfg(target_os = "windows")]
    std::process::Command::new("explorer")
        .arg(data_dir)
        .spawn()
        .map_err(|e| e.to_string())?;

    #[cfg(target_os = "macos")]
    std::process::Command::new("open")
        .arg(data_dir)
        .spawn()
        .map_err(|e| e.to_string())?;

    #[cfg(target_os = "linux")]
    std::process::Command::new("xdg-open")
        .arg(data_dir)
        .spawn()
        .map_err(|e| e.to_string())?;

    Ok(())
}

// ─── App Entry ────────────────────────────────────────────────────────────────

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Ensure data directories exist
            let data_dir = app.path().app_data_dir()?;
            for subdir in ["rockets", "missions", "exports"] {
                fs::create_dir_all(data_dir.join(subdir))?;
            }

            // Show window after setup (avoids white flash)
            let window = app.get_webview_window("main").unwrap();
            window.maximize()?;
            window.show()?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Rocket designs
            save_rocket,
            load_rocket,
            list_rockets,
            delete_rocket,
            // Mission logs
            save_mission,
            load_mission,
            list_missions,
            delete_mission,
            // Export
            write_export_file,
            // App utilities
            get_app_version,
            open_data_folder,
        ])
        .run(tauri::generate_context!())
        .expect("error while running SpaceRocket")
}
