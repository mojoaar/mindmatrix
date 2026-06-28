use tauri::Manager;
use tauri::menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder};
use tauri::tray::{TrayIconBuilder, MouseButton, MouseButtonState, TrayIconEvent};
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_fs::FsExt;
use serde::Serialize;

#[derive(Serialize, Clone)]
struct ImportNote {
    title: String,
    content: String,
}

#[tauri::command]
async fn import_markdown_files(app: tauri::AppHandle) -> Result<Vec<ImportNote>, String> {
    let files = app.dialog().file()
        .add_filter("Markdown", &["md", "markdown", "txt"])
        .blocking_pick_files();

    match files {
        Some(paths) => {
            let mut notes = Vec::new();
            for path in paths {
                let content = app.fs().read_text_file(path.clone())
                    .map_err(|e| format!("Failed to read {}: {}", path.display(), e))?;
                let title = path.file_stem()
                    .and_then(|s| s.to_str())
                    .unwrap_or("Untitled")
                    .to_string();
                notes.push(ImportNote { title, content });
            }
            Ok(notes)
        }
        None => Ok(Vec::new()),
    }
}

#[tauri::command]
async fn export_note_file(app: tauri::AppHandle, content: String, default_name: String) -> Result<bool, String> {
    let file_path = app.dialog().file()
        .add_filter("Markdown", &["md"])
        .set_file_name(&format!("{}.md", default_name))
        .blocking_save_file();

    match file_path {
        Some(path) => {
            app.fs().write_text_file(path, content)
                .map_err(|e| format!("Failed to write: {}", e))?;
            Ok(true)
        }
        None => Ok(false),
    }
}

#[tauri::command]
fn handle_menu_event(app: tauri::AppHandle, event: String) {
    let window = app.get_webview_window("main");
    match event.as_str() {
        "new_note" => {
            if let Some(w) = window {
                let _ = w.eval("document.dispatchEvent(new CustomEvent('mindmatrix:new-note'))");
            }
        }
        "settings" => {
            if let Some(w) = window {
                let _ = w.eval("window.location.href = '/dashboard/settings'");
            }
        }
        "reload" => {
            if let Some(w) = window {
                let _ = w.eval("location.reload()");
            }
        }
        _ => {}
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            import_markdown_files,
            export_note_file,
            handle_menu_event,
        ])
        .setup(|app| {
            // Menu bar
            let file_menu = SubmenuBuilder::new(app, "File")
                .item(&MenuItemBuilder::with_id("new_note", "New Note").accelerator("CmdOrCtrl+N").build(app)?)
                .item(&MenuItemBuilder::with_id("import_md", "Import Markdown…").accelerator("CmdOrCtrl+O").build(app)?)
                .item(&MenuItemBuilder::with_id("export_note", "Export Current Note…").accelerator("CmdOrCtrl+Shift+S").build(app)?)
                .separator()
                .item(&MenuItemBuilder::with_id("settings", "Settings").accelerator("CmdOrCtrl+,").build(app)?)
                .separator()
                .item(&MenuItemBuilder::with_id("close", "Close Window").accelerator("CmdOrCtrl+W").build(app)?)
                .build()?;

            let edit_menu = SubmenuBuilder::new(app, "Edit")
                .undo().redo().separator().cut().copy().paste().select_all()
                .build()?;

            let view_menu = SubmenuBuilder::new(app, "View")
                .item(&MenuItemBuilder::with_id("reload", "Reload").accelerator("CmdOrCtrl+R").build(app)?)
                .build()?;

            let help_menu = SubmenuBuilder::new(app, "Help")
                .item(&MenuItemBuilder::with_id("about", "About MindMatrix Desktop").build(app)?)
                .item(&MenuItemBuilder::with_id("check_updates", "Check for Updates").build(app)?)
                .build()?;

            let menu = MenuBuilder::new(app)
                .item(&file_menu).item(&edit_menu).item(&view_menu).item(&help_menu)
                .build()?;
            app.set_menu(menu)?;

            // Tray
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .on_menu_event(|app, event| {
                    let _ = handle_menu_event(app.clone(), event.id().to_string());
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } = event {
                        if let Some(w) = tray.app_handle().get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .on_menu_event(|app, event| {
            let _ = handle_menu_event(app.clone(), event.id().to_string());
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
