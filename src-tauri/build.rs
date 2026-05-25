fn main() {
    tauri_build::try_build(
        tauri_build::Attributes::new().app_manifest(
            tauri_build::AppManifest::new().commands(&[
                "set_tray_icon",
                "flash_border",
                "show_main_window",
                "position_focus_hud",
            ]),
        ),
    )
    .expect("error while building tauri application");
}
