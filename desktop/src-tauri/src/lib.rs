use tauri::Manager;
use tauri::Emitter;
use tauri::menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder, PredefinedMenuItem};
use tauri::tray::{TrayIconBuilder, MouseButton, MouseButtonState, TrayIconEvent};
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_fs::FsExt;
use serde::Serialize;

#[derive(Serialize)]
struct AuthResult {
    ok: bool,
    set_cookie: String,
    error: String,
}

fn la(msg: &str) {
    let prev = std::fs::read_to_string("/tmp/tauri-auth.log").unwrap_or_default();
    let _ = std::fs::write("/tmp/tauri-auth.log", format!("{}{}\n", prev, msg));
}

#[tauri::command]
async fn auth_signin(url: String, email: String, password: String) -> Result<AuthResult, String> {
    la("SIGNIN");
    let client = reqwest::Client::builder()
        .danger_accept_invalid_certs(true)
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| { la(&format!("CLIENT_ERR {}", e)); format!("{}", e) })?;
    la("CLIENT_OK");
    let url_signed = format!("{}/api/auth/sign-in/email", url.trim_end_matches('/'));
    let res = client
        .post(&url_signed)
        .json(&serde_json::json!({"email": email, "password": password}))
        .send()
        .await
        .map_err(|e| { la(&format!("FETCH_ERR {}", e)); format!("{}", e) })?;
    let status = res.status();
    la(&format!("STATUS {}", status));
    let ok = status.is_success();
    let cookie = res.headers().get("set-cookie")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("")
        .to_string();
    let body = res.text().await.unwrap_or_default();
    la(&format!("BODY {}", &body[..body.len().min(200)]));
    la(&format!("COOKIE {}", &cookie[..cookie.len().min(200)]));
    if ok {
        Ok(AuthResult { ok: true, set_cookie: cookie, error: String::new() })
    } else {
        let err_msg = body[..body.len().min(200)].to_string();
        Ok(AuthResult { ok: false, set_cookie: String::new(), error: if err_msg.is_empty() { "Invalid email or password.".into() } else { err_msg } })
    }
}

#[tauri::command]
async fn auth_verify_token(url: String, token: String) -> Result<AuthResult, String> {
    la("VERIFY");
    let client = reqwest::Client::builder()
        .danger_accept_invalid_certs(true)
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| format!("{}", e))?;

    let verify_url = format!("{}/api/profile", url.trim_end_matches('/'));
    la(&format!("GET {}", verify_url));
    let res = client
        .get(&verify_url)
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
        .map_err(|e| { la(&format!("ERR {}", e)); format!("{}", e) })?;
    la(&format!("PROFILE {}", res.status()));
    if !res.status().is_success() {
        return Ok(AuthResult { ok: false, set_cookie: String::new(), error: "Invalid API token.".into() });
    }

    let session_url = format!("{}/api/auth/session-from-token", url.trim_end_matches('/'));
    la(&format!("POST {}", session_url));
    let session_res = client
        .post(&session_url)
        .json(&serde_json::json!({ "token": token }))
        .send()
        .await
        .map_err(|e| { la(&format!("SESSION_ERR {}", e)); format!("{}", e) })?;
    la(&format!("SESSION {}", session_res.status()));

    let cookie = session_res.headers()
        .get("set-cookie")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");
    la(&format!("COOKIE {}", &cookie[..cookie.len().min(200)]));

    let ok = session_res.status().is_success();
    Ok(AuthResult { ok, set_cookie: cookie.to_string(), error: if !ok { "Failed to create session.".into() } else { String::new() } })
}

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
                let content = app.fs().read_to_string(path.clone())
                    .map_err(|e| format!("Failed to read file: {}", e))?;
                let title = path.as_path()
                    .and_then(|p| p.file_stem())
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
            if let Some(p) = path.as_path() {
                std::fs::write(p, content)
                    .map_err(|e| format!("Failed to write: {}", e))?;
            }
            Ok(true)
        }
        None => Ok(false),
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
            auth_signin,
            auth_verify_token,
            import_markdown_files,
            export_note_file,
        ])
        .setup(|app| {
            // App menu (macOS — first menu, named after the app)
            let app_menu = SubmenuBuilder::new(app, "MindMatrix Desktop")
                .item(&MenuItemBuilder::with_id("about", "About MindMatrix Desktop").build(app)?)
                .separator()
                .item(&MenuItemBuilder::with_id("settings", "Preferences\u{2026}").accelerator("CmdOrCtrl+,").build(app)?)
                .separator()
                .quit()
                .build()?;

            // File menu
            let file_menu = SubmenuBuilder::new(app, "File")
                .item(&MenuItemBuilder::with_id("new_note", "New Note").accelerator("CmdOrCtrl+N").build(app)?)
                .item(&MenuItemBuilder::with_id("import_md", "Import Markdown\u{2026}").accelerator("CmdOrCtrl+O").build(app)?)
                .item(&MenuItemBuilder::with_id("export_note", "Export Current Note\u{2026}").accelerator("CmdOrCtrl+Shift+S").build(app)?)
                .separator()
                .item(&PredefinedMenuItem::close_window(app, Some("Close Window"))?)
                .build()?;

            // Edit menu
            let edit_menu = SubmenuBuilder::new(app, "Edit")
                .undo().redo().separator().cut().copy().paste().select_all()
                .build()?;

            // View menu
            let view_menu = SubmenuBuilder::new(app, "View")
                .item(&MenuItemBuilder::with_id("reload", "Reload").accelerator("CmdOrCtrl+R").build(app)?)
                .item(&MenuItemBuilder::with_id("toggle_devtools", "Toggle Developer Tools")
                    .accelerator("CmdOrCtrl+Shift+I").build(app)?)
                .build()?;

            // Help menu
            let help_menu = SubmenuBuilder::new(app, "Help")
                .item(&MenuItemBuilder::with_id("about", "About MindMatrix Desktop").build(app)?)
                .build()?;

            let menu = MenuBuilder::new(app)
                .item(&app_menu)
                .item(&file_menu)
                .item(&edit_menu)
                .item(&view_menu)
                .item(&help_menu)
                .build()?;
            app.set_menu(menu)?;

            // System tray — click to show/focus window
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
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
            let id = event.id().0.as_str();
            match id {
                "new_note" => {
                    if let Some(w) = app.get_webview_window("main") {
                        let _ = w.eval("document.dispatchEvent(new CustomEvent('mindmatrix:new-note'))");
                    }
                }
                "import_md" => {
                    let handle = app.clone();
                    tauri::async_runtime::spawn(async move {
                        match import_markdown_files(handle).await {
                            Ok(_) => {}
                            Err(e) => eprintln!("Import failed: {}", e),
                        }
                    });
                }
                "export_note" => {
                    let _ = app.emit("request-export-content", ());
                }
                "settings" => {
                    if let Some(w) = app.get_webview_window("main") {
                        let _ = w.eval("window.location.href = '/dashboard/settings'");
                    }
                }
                "reload" => {
                    if let Some(w) = app.get_webview_window("main") {
                        let _ = w.eval("location.reload()");
                    }
                }
                "toggle_devtools" => {
                    if let Some(w) = app.get_webview_window("main") {
                        w.open_devtools();
                    }
                }
                _ => {}
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
