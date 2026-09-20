// startup_gate.rs
//
// WHY THIS FILE EXISTS: security-guard.js performs an environment check and
// a version check from JavaScript, but that JavaScript ships as a plain,
// readable file inside the app's bundled web assets. Publicly available
// tools can extract Tauri's bundled frontend, delete the single
// <script src="security-guard.js"> line from login-desktop.html, and
// repackage — which would disable both checks with no JavaScript knowledge
// at all. This module repeats both checks natively in compiled Rust, which
// runs unconditionally before the login window is ever shown. A patched
// copy of the web assets does not touch this code path.
//
// This is a second, independent layer — it does NOT replace
// security-guard.js, which still keeps the environment/version state fresh
// throughout an active session (this gate only fires once, at launch).

use crate::secure_network;
use crate::security_checks;

#[cfg(target_os = "windows")]
#[link(name = "user32")]
extern "system" {
    fn MessageBoxW(hwnd: *mut std::ffi::c_void, text: *const u16, caption: *const u16, utype: u32) -> i32;
}

const MB_ICONERROR: u32 = 0x10;

fn wide(s: &str) -> Vec<u16> {
    s.encode_utf16().chain(std::iter::once(0)).collect()
}

/// Shows a native OS dialog — not a web page, so nothing in the bundled
/// web assets needs to exist or be intact for the user to see this.
pub fn show_native_blocked_dialog(message: &str, title: &str) {
    #[cfg(target_os = "windows")]
    unsafe {
        MessageBoxW(std::ptr::null_mut(), wide(message).as_ptr(), wide(title).as_ptr(), MB_ICONERROR);
    }
    #[cfg(not(target_os = "windows"))]
    {
        eprintln!("{title}: {message}");
    }
}

/// Spawns a background OS thread that re-runs the same environment check
/// every 5-8 seconds (randomized, so the interval can't be timed around)
/// for the entire lifetime of the process — not just once at launch.
///
/// WHY THIS EXISTS: the one-time gate above only catches a bad environment
/// that already existed at startup. It does not catch someone who opens
/// the app in a clean environment (passing the gate honestly), then
/// launches Cheat Engine / Wireshark / a debugger mid-session to attack a
/// program that is already running and already past its checks. This
/// closes that gap. It runs as a plain OS thread (no Tauri async runtime,
/// no window handle needed) precisely so it keeps working even if
/// something else in the process is being tampered with.
///
/// Deliberately a hard stop (native dialog + exit), consistent with the
/// startup gate, rather than a silent degrade: unlike the tool's own
/// distributed checks (which are about licensing/piracy and should stay
/// invisible), a tool actively being attacked while a real session is open
/// is treated the same way a compromised session always is.
pub fn spawn_periodic_watch() {
    std::thread::spawn(|| loop {
        std::thread::sleep(std::time::Duration::from_millis(random_delay_ms(5_000, 8_000)));

        let (clean, _category) = security_checks::environment_is_clean();
        if !clean {
            show_native_blocked_dialog(
                "YK PubEngine detected a change in its running environment and must close.\n\nاكتشف برنامج YK PubEngine تغييرًا في بيئة تشغيله ويجب أن يُغلق.",
                "Closing — الإغلاق",
            );
            std::process::exit(0);
        }
    });
}

fn random_delay_ms(min_ms: u64, max_ms: u64) -> u64 {
    let mut buf = [0u8; 2];
    if getrandom::fill(&mut buf).is_err() {
        return min_ms; // couldn't get randomness — fail toward the more frequent (safer) side
    }
    let range = max_ms - min_ms;
    let value = u16::from_le_bytes(buf) as u64;
    min_ms + (value % (range + 1))
}

fn version_at_least(current: &str, required: &str) -> bool {
    let parse = |s: &str| -> Vec<u32> { s.split('.').map(|p| p.parse().unwrap_or(0)).collect() };
    let c = parse(current);
    let r = parse(required);
    let len = c.len().max(r.len());
    for i in 0..len {
        let cv = c.get(i).copied().unwrap_or(0);
        let rv = r.get(i).copied().unwrap_or(0);
        if cv > rv { return true; }
        if cv < rv { return false; }
    }
    true
}

async fn min_version_from_firebase() -> Option<String> {
    let body = serde_json::json!({ "platform": "windows" }).to_string();
    let raw = secure_network::secure_api_request("/minVersion".to_string(), body).await.ok()?;
    let outer: serde_json::Value = serde_json::from_str(&raw).ok()?;
    let inner_str = outer.get("body")?.as_str()?;
    let inner: serde_json::Value = serde_json::from_str(inner_str).ok()?;
    inner.get("minVersion")?.as_str().map(|s| s.to_string())
}

/// Runs both gates and returns Ok(()) to proceed, or Err(reason) to block.
/// `reason` is only ever logged locally / shown in the native dialog text —
/// never sent anywhere, consistent with never revealing which specific
/// check tripped to a would-be attacker.
pub async fn evaluate() -> Result<(), &'static str> {
    let (clean, _category) = security_checks::environment_is_clean();
    if !clean {
        return Err("environment");
    }

    let local_version = secure_network::get_app_version();
    let fb_min = min_version_from_firebase().await;
    let gh_min = secure_network::fetch_github_min_version("windows".to_string()).await.ok();

    let mut required = String::from("0.0.0");
    for v in [fb_min, gh_min].into_iter().flatten() {
        if !version_at_least(&required, &v) {
            required = v;
        }
    }

    // Both sources unreachable — fail open exactly like the JS layer does;
    // a network hiccup at launch must never lock out a legitimate owner.
    if required == "0.0.0" {
        return Ok(());
    }

    if version_at_least(&local_version, &required) {
        Ok(())
    } else {
        Err("outdated")
    }
}
