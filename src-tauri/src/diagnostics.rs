// diagnostics.rs
//
// Detailed startup / runtime diagnostics for the Windows desktop build.
// This is intentionally always-on (debug AND release): the previous version
// only proved useful when someone could read the log next to the EXE, and it
// silently did nothing when that folder was read-only (e.g. the EXE was run
// from Program Files, a network share, or a protected download folder).
//
// What changed and why:
//   - The log now tries several locations in order (next to the EXE first,
//     then %LOCALAPPDATA%\YKPubEngine\logs, then %TEMP%) and keeps the first
//     one it can actually write to. If your desktop/Downloads folder is
//     locked down, the log still lands somewhere findable.
//   - Every line carries a millisecond timestamp, a level and the OS thread
//     id, so a hang (no more lines for N seconds) is easy to spot and an
//     interleaved JS/Rust call is easy to follow.
//   - On Windows the WebView2 runtime version is captured at startup. A
//     missing / ancient WebView2 is one of the most common causes of a
//     window that opens as a black rectangle, so it is recorded explicitly.
//   - The frontend can push its own lines through `log_js_event`, which means
//     uncaught JS errors, failed resource loads and page lifecycle events end
//     up in the same file as the Rust startup stages.
//
// The log never contains secrets, tokens, device IDs or full process names.

use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::PathBuf;
use std::sync::OnceLock;
use std::time::{SystemTime, UNIX_EPOCH};

static ACTIVE_LOG: OnceLock<Option<PathBuf>> = OnceLock::new();

fn candidate_paths() -> Vec<PathBuf> {
    let mut paths = Vec::new();

    if let Ok(exe) = std::env::current_exe() {
        if let Some(dir) = exe.parent() {
            paths.push(dir.join("YK-PubEngine-startup.log"));
        }
    }

    if let Some(local) = std::env::var_os("LOCALAPPDATA") {
        paths.push(
            PathBuf::from(local)
                .join("YKPubEngine")
                .join("logs")
                .join("YK-PubEngine-startup.log"),
        );
    }

    paths.push(std::env::temp_dir().join("YK-PubEngine-startup.log"));
    paths
}

fn writable(path: &PathBuf) -> bool {
    if let Some(parent) = path.parent() {
        let _ = fs::create_dir_all(parent);
    }
    OpenOptions::new().create(true).append(true).open(path).is_ok()
}

fn active_log_path() -> Option<&'static PathBuf> {
    ACTIVE_LOG
        .get_or_init(|| candidate_paths().into_iter().find(writable))
        .as_ref()
}

fn timestamp() -> String {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    format!("{}.{:03}", now.as_secs(), now.subsec_millis())
}

fn write_line(level: &str, message: &str) {
    let Some(path) = active_log_path() else { return; };

    let thread = std::thread::current();
    let thread_name = thread.name().unwrap_or("unnamed");
    let line = format!(
        "[{}][{}][tid={:?} {}] {}",
        timestamp(),
        level,
        thread.id(),
        thread_name,
        message
    );

    if let Ok(mut file) = OpenOptions::new().create(true).append(true).open(path) {
        let _ = writeln!(file, "{line}");
        let _ = file.flush();
    }
}

pub fn log(message: impl AsRef<str>) {
    write_line("INFO", message.as_ref());
}

pub fn warn(message: impl AsRef<str>) {
    write_line("WARN", message.as_ref());
}

pub fn error(message: impl AsRef<str>) {
    write_line("ERROR", message.as_ref());
}

/// Where the log actually ended up (empty string if no location was writable).
pub fn path_display() -> String {
    active_log_path()
        .map(|p| p.display().to_string())
        .unwrap_or_default()
}

#[cfg(target_os = "windows")]
fn webview2_version() -> String {
    use winreg::enums::{HKEY_CURRENT_USER, HKEY_LOCAL_MACHINE};
    use winreg::RegKey;

    const CLIENT_ID: &str = "{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}";
    let sub_keys = [
        (HKEY_LOCAL_MACHINE, format!("SOFTWARE\\WOW6432Node\\Microsoft\\EdgeUpdate\\Clients\\{CLIENT_ID}")),
        (HKEY_LOCAL_MACHINE, format!("SOFTWARE\\Microsoft\\EdgeUpdate\\Clients\\{CLIENT_ID}")),
        (HKEY_CURRENT_USER, format!("SOFTWARE\\Microsoft\\EdgeUpdate\\Clients\\{CLIENT_ID}")),
    ];

    for (root, path) in sub_keys {
        let hk = RegKey::predef(root);
        if let Ok(key) = hk.open_subkey(path) {
            if let Ok(version) = key.get_value::<String, _>("pv") {
                if !version.trim().is_empty() {
                    return version.trim().to_string();
                }
            }
        }
    }

    "<not found>".to_string()
}

#[tauri::command]
pub fn log_js_event(level: String, message: String) {
    match level.to_uppercase().as_str() {
        "ERROR" | "FATAL" => error(format!("[js] {message}")),
        "WARN" => warn(format!("[js] {message}")),
        _ => log(format!("[js] {message}")),
    }
}

#[tauri::command]
pub fn diagnostics_log_path() -> String {
    path_display()
}

pub fn begin() {
    // This line is intentionally recognizable so each new launch can be
    // separated from previous attempts without deleting the old evidence.
    log("============================================================");
    log("STARTUP BEGIN");

    if let Ok(exe) = std::env::current_exe() {
        log(format!("EXE={}", exe.display()));
    } else {
        log("EXE=<unable to determine current executable path>");
    }

    log(format!("LOG={}", path_display()));
    log(format!("APP_VERSION={}", env!("CARGO_PKG_VERSION")));
    log(format!("OS={}", std::env::consts::OS));
    log(format!("ARCH={}", std::env::consts::ARCH));

    if let Ok(cwd) = std::env::current_dir() {
        log(format!("CWD={}", cwd.display()));
    }

    #[cfg(target_os = "windows")]
    log(format!("WEBVIEW2_RUNTIME={}", webview2_version()));

    // A writable-log check is itself useful: if this ever reads "false" then
    // the EXE folder is locked down and the LOCALAPPDATA/TEMP fallback is
    // what is keeping diagnostics alive.
    if let Ok(exe) = std::env::current_exe() {
        if let Some(dir) = exe.parent() {
            let probe = dir.join("YK-PubEngine-startup.log");
            log(format!("EXE_DIR_WRITABLE={}", writable(&probe)));
        }
    }
}
