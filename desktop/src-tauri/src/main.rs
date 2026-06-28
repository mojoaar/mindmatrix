#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // Clear WKWebView data store to prevent stale Next.js chunks
    if let Ok(home) = std::env::var("HOME") {
        let _ = std::fs::remove_dir_all(format!("{}/Library/WebKit/ai.mindmatrix.desktop", home));
    }
    mindmatrix_desktop_lib::run()
}
