// diagnostics.rs
//
// Detailed startup / runtime diagnostics for the Windows desktop build.
// This is intentionally always-on (debug AND release): the previous version
// only proved useful when someone could read the log next to the EXE, and it
// silently did nothing when that folder was read-only (e.g. the EXE was run
// from Program Files, a network share, or a protected download folder).
//
// What changed and why:
//   - The log is written to EVERY writable location at once (next to the EXE,
//     %LOCALAPPDATA%\YKPubEngine\logs, and %TEMP%) so it is always findable,
//     even if one folder is read-only (Program Files, a network share or a
//     protected download folder).
//   - Every line carries a millisecond timestamp, a level and the OS thread
//     id, so a hang (no more lines for N seconds) is easy to spot and an
//     interleaved JS/Rust call is easy to follow.
//   - On Windows the OS edition/version/build and the WebView2 runtime
//     version are captured at startup. A missing / ancient WebView2 is one of
//     the most common causes of a window that opens as a black rectangle, so
//     it is recorded explicitly.
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

static ACTIVE_LOGS: OnceLock<Vec<PathBuf>> = OnceLock::new();

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

// Every candidate location that is writable is used at once, not just the
// first one. Duplicating the (small) log means the file is findable both next
// to the EXE and in %LOCALAPPDATA% / %TEMP%, which matters when a tester is
// asked to "look for the log" on a machine we cannot inspect ourselves.
fn active_log_paths() -> &'static [PathBuf] {
    ACTIVE_LOGS
        .get_or_init(|| {
            let mut chosen: Vec<PathBuf> = Vec::new();
            for path in candidate_paths() {
                if !chosen.iter().any(|existing| existing == &path) && writable(&path) {
                    chosen.push(path);
                }
            }
            chosen
        })
        .as_slice()
}

fn timestamp() -> String {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    format!("{}.{:03}", now.as_secs(), now.subsec_millis())
}

fn write_line(level: &str, message: &str) {
    let paths = active_log_paths();
    if paths.is_empty() {
        return;
    }

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

    for path in paths {
        if let Ok(mut file) = OpenOptions::new().create(true).append(true).open(path) {
            let _ = writeln!(file, "{line}");
            let _ = file.flush();
        }
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

/// Primary log location (empty string if no location was writable).
pub fn path_display() -> String {
    active_log_paths()
        .first()
        .map(|p| p.display().to_string())
        .unwrap_or_default()
}

/// All locations the log is written to, joined for display.
pub fn paths_display() -> String {
    let paths = active_log_paths();
    if paths.is_empty() {
        return "<none writable>".to_string();
    }
    paths
        .iter()
        .map(|p| p.display().to_string())
        .collect::<Vec<_>>()
        .join(" ; ")
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

// Windows edition / version / build. ProductName alone is unreliable (it can
// still say "Windows 10" on Windows 11), so the build number is used to decide
// the marketing name. Everything is best-effort: an unreadable registry value
// just yields an empty field rather than failing diagnostics.
#[cfg(target_os = "windows")]
fn windows_version_info() -> String {
    use winreg::enums::HKEY_LOCAL_MACHINE;
    use winreg::RegKey;

    let hk = RegKey::predef(HKEY_LOCAL_MACHINE);
    let key = match hk.open_subkey("SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion") {
        Ok(key) => key,
        Err(_) => return "<unreadable>".to_string(),
    };

    let get_str = |name: &str| key.get_value::<String, _>(name).ok().unwrap_or_default();

    let mut product = get_str("ProductName");
    let display_version = {
        let dv = get_str("DisplayVersion");
        if dv.is_empty() { get_str("ReleaseId") } else { dv }
    };
    let build = {
        let b = get_str("CurrentBuildNumber");
        if b.is_empty() { get_str("CurrentBuild") } else { b }
    };
    let ubr: u32 = key.get_value("UBR").unwrap_or(0);
    let edition = get_str("EditionID");
    let installation = get_str("InstallationType");

    let build_num: u32 = build.parse().unwrap_or(0);
    let marketing = if build_num >= 22000 {
        "Windows 11"
    } else if build_num > 0 {
        "Windows 10"
    } else {
        ""
    };
    if !marketing.is_empty() {
        if product.starts_with("Windows 10") || product.starts_with("Windows 11") {
            let suffix = product.splitn(3, ' ').nth(2).unwrap_or("");
            product = if suffix.is_empty() {
                marketing.to_string()
            } else {
                format!("{marketing} {suffix}")
            };
        } else if product.is_empty() {
            product = marketing.to_string();
        }
    }

    format!(
        "product='{product}' displayVersion='{display_version}' build='{build}.{ubr}' edition='{edition}' installation='{installation}'"
    )
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

    log(format!("LOG_PATHS={}", paths_display()));
    log(format!("APP_VERSION={}", env!("CARGO_PKG_VERSION")));
    log(format!("OS={}", std::env::consts::OS));
    log(format!("ARCH={}", std::env::consts::ARCH));

    if let Ok(cwd) = std::env::current_dir() {
        log(format!("CWD={}", cwd.display()));
    }

    #[cfg(target_os = "windows")]
    {
        log(format!("WINDOWS_VERSION={}", windows_version_info()));
        log(format!("WEBVIEW2_RUNTIME={}", webview2_version()));
        for var in ["PROCESSOR_ARCHITECTURE", "PROCESSOR_IDENTIFIER"] {
            if let Ok(value) = std::env::var(var) {
                log(format!("{var}={value}"));
            }
        }
    }

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
