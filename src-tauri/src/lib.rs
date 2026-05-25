//! Standup Pet — macOS menu bar app with tray popover.

use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, PhysicalPosition, Rect, RunEvent, WebviewWindow, WindowEvent,
};

#[cfg(target_os = "macos")]
use tauri::ActivationPolicy;

const WINDOW_LABEL: &str = "main";
const TRAY_ID: &str = "main-tray";

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

    let icon = app
        .default_window_icon()
        .cloned()
        .ok_or("missing default window icon")?;

    let _tray = TrayIconBuilder::with_id(TRAY_ID)
        .icon(icon)
        .icon_as_template(true)
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
