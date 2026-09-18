// diagnostics.rs
// Temporary startup diagnostics for Windows desktop testing.
// The log is always created beside the EXE (next to yk-pubengine.exe).
// It contains startup stages and error messages, but not secrets, tokens,
// device IDs, or full process names.

use std::fs::OpenOptions;
use std::io::Write;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};

fn log_path() -> Option<PathBuf> {
    let exe = std::env::current_exe().ok()?;
    Some(exe.parent()?.join("YK-PubEngine-startup.log"))
}

pub fn log(message: impl AsRef<str>) {
    let Some(path) = log_path() else { return; };

    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);

    if let Ok(mut file) = OpenOptions::new()
        .create(true)
        .append(true)
        .open(path)
    {
        let _ = writeln!(file, "[unix={now}] {}", message.as_ref());
        let _ = file.flush();
    }
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

    log(format!("OS={}", std::env::consts::OS));
    log(format!("ARCH={}", std::env::consts::ARCH));
}
