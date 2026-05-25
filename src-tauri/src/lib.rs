//! Standup Pet — macOS menu bar app with tray popover.

use tauri::{
    image::Image,
    menu::{Menu, MenuItem},
    path::BaseDirectory,
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager, PhysicalPosition, Rect, RunEvent, WebviewWindow, WindowEvent,
};

#[cfg(target_os = "macos")]
use tauri::ActivationPolicy;

const WINDOW_LABEL: &str = "main";
const TRAY_ID: &str = "main-tray";

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

    let path = tray_icon_path(app, pet, animation).ok_or_else(|| {
        format!("tray icon not found for {pet}-{animation}")
    })?;

    let icon = Image::from_path(&path).map_err(|e| e.to_string())?;
    tray.set_icon(Some(icon)).map_err(|e| e.to_string())?;
    // Colored pixel pets — not a monochrome template.
    tray.set_icon_as_template(false).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn set_tray_icon(app: AppHandle, pet: String, animation: String) -> Result<(), String> {
    apply_tray_icon(&app, &pet, &animation)
}

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
    let Some(window) = app.get_webview_window(WINDOW_LABEL) else {
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

fn setup_tray(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let quit = MenuItem::with_id(app, "quit", "Quit Standup Pet", true, None::<&str>)?;
    let tray_menu = Menu::with_items(app, &[&quit])?;

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
        .on_menu_event(|app, event| {
            if event.id() == "quit" {
                app.exit(0);
            }
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

    let window = app
        .get_webview_window(WINDOW_LABEL)
        .ok_or("main window not found")?;

    let _ = window.hide();

    let window_for_events = window.clone();
    window.on_window_event(move |event| {
        match event {
            WindowEvent::CloseRequested { api, .. } => {
                api.prevent_close();
                let _ = window_for_events.hide();
            }
            WindowEvent::Focused(false) => {
                let _ = window_for_events.hide();
            }
            _ => {}
        }
    });

    #[cfg(target_os = "macos")]
    app.set_activation_policy(ActivationPolicy::Accessory);

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut app = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![set_tray_icon])
        .setup(|app| setup_tray(app))
        .build(tauri::generate_context!())
        .expect("error while running tauri application");

    #[cfg(target_os = "macos")]
    app.set_activation_policy(ActivationPolicy::Accessory);

    app.run(|app_handle, event| {
        match event {
            RunEvent::ExitRequested { api, .. } => {
                api.prevent_exit();
            }
            RunEvent::Reopen { .. } => {
                toggle_popover(app_handle, None);
            }
            _ => {}
        }
    });
}
