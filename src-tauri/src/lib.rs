//! Standup Pet — macOS menu bar app with floating focus HUD + screen-edge flash overlay.

use std::time::Duration;

use tauri::{
    image::Image,
    menu::{Menu, MenuItem},
    path::BaseDirectory,
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, LogicalPosition, LogicalSize, Manager, PhysicalPosition, Rect, RunEvent,
    WebviewWindow, WindowEvent,
};

#[cfg(target_os = "macos")]
use tauri::ActivationPolicy;

const MAIN_LABEL: &str = "main";
const HUD_LABEL: &str = "focus_hud";
const FLASH_LABEL: &str = "flash_overlay";
const TRAY_ID: &str = "main-tray";

// ---------- tray icons ----------

fn tray_icon_path(app: &AppHandle, pet: &str, animation: &str) -> Option<std::path::PathBuf> {
    let file = format!("icons/tray/{pet}-{animation}.png");
    if let Ok(p) = app.path().resolve(&file, BaseDirectory::Resource) {
        if p.exists() {
            return Some(p);
        }
    }
    let manifest = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR")).join(&file);
    if manifest.exists() {
        return Some(manifest);
    }
    None
}

fn apply_tray_icon(app: &AppHandle, pet: &str, animation: &str) -> Result<(), String> {
    let tray = app
        .tray_by_id(TRAY_ID)
        .ok_or_else(|| "tray icon not found".to_string())?;

    let path = tray_icon_path(app, pet, animation)
        .ok_or_else(|| format!("tray icon not found for {pet}-{animation}"))?;

    let icon = Image::from_path(&path).map_err(|e| e.to_string())?;
    tray.set_icon(Some(icon)).map_err(|e| e.to_string())?;
    tray.set_icon_as_template(false).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn set_tray_icon(app: AppHandle, pet: String, animation: String) -> Result<(), String> {
    apply_tray_icon(&app, &pet, &animation)
}

// ---------- main popover ----------

fn position_popover_near_tray(window: &WebviewWindow, tray_rect: Rect) {
    let Ok(window_size) = window.outer_size() else {
        return;
    };
    let scale = window.scale_factor().unwrap_or(1.0);
    let pos = tray_rect.position.to_physical::<i32>(scale);
    let tray_size = tray_rect.size.to_physical::<u32>(scale);

    let x = pos.x + (tray_size.width as i32 / 2) - (window_size.width as i32 / 2);
    let y = pos.y + tray_size.height as i32 + 4;

    let _ = window.set_position(PhysicalPosition::new(x.max(0), y.max(0)));
}

fn toggle_popover(app: &tauri::AppHandle, tray_rect: Option<Rect>) {
    let Some(window) = app.get_webview_window(MAIN_LABEL) else {
        return;
    };
    if window.is_visible().unwrap_or(false) {
        let _ = window.hide();
        return;
    }
    if let Some(rect) = tray_rect {
        position_popover_near_tray(&window, rect);
    }
    let _ = window.show();
    let _ = window.set_focus();
}

#[tauri::command]
fn show_main_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(MAIN_LABEL) {
        let _ = window.show();
        let _ = window.set_focus();
    }
    Ok(())
}

// ---------- focus HUD positioning ----------

#[tauri::command]
fn position_focus_hud(app: AppHandle) -> Result<(), String> {
    let Some(window) = app.get_webview_window(HUD_LABEL) else {
        return Err("focus hud window missing".into());
    };
    // Bottom-center of primary monitor.
    if let Ok(Some(monitor)) = window.current_monitor() {
        let scale = monitor.scale_factor();
        let size = monitor.size();
        let win_size = window.outer_size().unwrap_or_default();
        let logical_w = (size.width as f64) / scale;
        let logical_h = (size.height as f64) / scale;
        let win_logical_w = (win_size.width as f64) / scale;
        let win_logical_h = (win_size.height as f64) / scale;
        let x = (logical_w - win_logical_w) / 2.0;
        let y = logical_h - win_logical_h - 32.0;
        let _ = window.set_position(LogicalPosition::new(x, y));
    }
    Ok(())
}

// ---------- screen-edge flash overlay ----------

fn fit_overlay_to_screen(window: &WebviewWindow) {
    if let Ok(Some(monitor)) = window.current_monitor() {
        let scale = monitor.scale_factor();
        let size = monitor.size();
        let logical_w = (size.width as f64) / scale;
        let logical_h = (size.height as f64) / scale;
        let _ = window.set_size(LogicalSize::new(logical_w, logical_h));
        let _ = window.set_position(LogicalPosition::new(0.0, 0.0));
    }
}

#[tauri::command]
fn flash_border(app: AppHandle, color: String, duration_ms: u64) -> Result<(), String> {
    let Some(window) = app.get_webview_window(FLASH_LABEL) else {
        return Err("flash overlay missing".into());
    };
    fit_overlay_to_screen(&window);
    // Click-through so it doesn't block the user's work.
    let _ = window.set_ignore_cursor_events(true);
    let _ = window.set_always_on_top(true);
    let _ = window.show();
    // Tell the webview to run its fade animation with this color.
    let _ = app.emit_to(FLASH_LABEL, "flash:play", FlashPayload { color, duration_ms });

    let app_handle = app.clone();
    let total = duration_ms + 200;
    tauri::async_runtime::spawn(async move {
        tokio::time::sleep(Duration::from_millis(total)).await;
        if let Some(w) = app_handle.get_webview_window(FLASH_LABEL) {
            let _ = w.hide();
        }
    });

    Ok(())
}

#[derive(serde::Serialize, Clone)]
struct FlashPayload {
    color: String,
    duration_ms: u64,
}

// ---------- setup ----------

fn setup_tray(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let show_item = MenuItem::with_id(app, "show", "Open Standup Pet", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit Standup Pet", true, None::<&str>)?;
    let tray_menu = Menu::with_items(app, &[&show_item, &quit])?;

    let fallback_icon = app
        .default_window_icon()
        .cloned()
        .ok_or("missing default window icon")?;

    let _tray = TrayIconBuilder::with_id(TRAY_ID)
        .icon(fallback_icon)
        .icon_as_template(false)
        .menu(&tray_menu)
        .show_menu_on_left_click(false)
        .tooltip("Standup Pet")
        .on_menu_event(|app, event| match event.id().as_ref() {
            "quit" => app.exit(0),
            "show" => toggle_popover(app, None),
            _ => {}
        })
        .on_tray_icon_event(move |tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                rect,
                ..
            } = event
            {
                toggle_popover(tray.app_handle(), Some(rect));
            }
        })
        .build(app)?;

    let app_handle = app.handle().clone();
    let _ = apply_tray_icon(&app_handle, "cat", "idle");

    // Main popover: hidden until tray-click.
    if let Some(window) = app.get_webview_window(MAIN_LABEL) {
        let _ = window.hide();
        let win = window.clone();
        window.on_window_event(move |event| match event {
            WindowEvent::CloseRequested { api, .. } => {
                api.prevent_close();
                let _ = win.hide();
            }
            WindowEvent::Focused(false) => {
                let _ = win.hide();
            }
            _ => {}
        });
    }

    // Flash overlay: never steals focus, always click-through.
    if let Some(window) = app.get_webview_window(FLASH_LABEL) {
        let _ = window.hide();
        let _ = window.set_ignore_cursor_events(true);
        let _ = window.set_always_on_top(true);
    }

    // Focus HUD: snap to bottom-center of primary screen on launch.
    if let Some(window) = app.get_webview_window(HUD_LABEL) {
        let _ = window.set_always_on_top(true);
        let app_for_pos = app_handle.clone();
        tauri::async_runtime::spawn(async move {
            tokio::time::sleep(Duration::from_millis(250)).await;
            let _ = position_focus_hud(app_for_pos);
        });
    }

    #[cfg(target_os = "macos")]
    app.set_activation_policy(ActivationPolicy::Accessory);

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut app = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            set_tray_icon,
            flash_border,
            show_main_window,
            position_focus_hud
        ])
        .setup(|app| setup_tray(app))
        .build(tauri::generate_context!())
        .expect("error while running tauri application");

    #[cfg(target_os = "macos")]
    app.set_activation_policy(ActivationPolicy::Accessory);

    app.run(|app_handle, event| match event {
        RunEvent::ExitRequested { api, .. } => {
            api.prevent_exit();
        }
        RunEvent::Reopen { .. } => {
            toggle_popover(app_handle, None);
        }
        _ => {}
    });
}
