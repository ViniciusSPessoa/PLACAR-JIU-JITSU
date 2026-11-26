#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    webview::NewWindowResponse,
    Manager, WebviewWindowBuilder,
};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _, _| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }))
        .setup(|app| {
            let config = &app.config().app.windows[0];
            let profile = app.path().app_local_data_dir()?.join("WebView2");
            WebviewWindowBuilder::from_config(app, config)?
                .data_directory(profile)
                .on_navigation(|url| {
                    url.scheme() == "https"
                        && url.host_str() == Some("tauri.localhost")
                        && url.port().is_none()
                })
                .on_new_window(|_, _| NewWindowResponse::Deny)
                .initialization_script(
                    "document.addEventListener('contextmenu', event => event.preventDefault());",
                )
                .build()?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Falha ao iniciar o Placar BJJ");
}
