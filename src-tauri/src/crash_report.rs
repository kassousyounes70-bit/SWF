// crash_report.rs
//
// Two entry points, sharing one mechanism:
//   - on_crash(...)     — called from the panic hook in main.rs
//   - contact_support(...) — called on demand from the UI (a "Contact
//     support" button), via the Tauri command below
//
// Design choices, and why:
//   - The diagnostic text is sent to OUR OWN SERVER (not just opened in an
//     email draft) precisely because a customer's machine may have no
//     default mail client configured at all — the report must not depend
//     on that to reach us.
//   - We ALSO open a pre-filled Gmail compose page in the user's default
//     browser (not a hardcoded browser) so the customer can add their own
//     words and actually start a two-way conversation if they choose to.
//     Opening a compose draft is inherently consent-friendly: nothing is
//     sent from it unless the customer presses Send themselves.
//   - This uses a plain (non certificate-pinned) blocking HTTPS client,
//     deliberately simpler than secure_network.rs's pinned client. This
//     traffic is a best-effort diagnostic report, not a licensing decision,
//     so it doesn't carry the same stakes that justified building and
//     maintaining pinning for the login/session/export path.

use std::sync::{Mutex, OnceLock};

const SUPPORT_EMAIL: &str = "kassousyounes70@gmail.com";
const REPORT_ENDPOINT: &str = "https://yk-pubengine-v1.onrender.com/reportIssue";

fn current_email_slot() -> &'static Mutex<Option<String>> {
    static SLOT: OnceLock<Mutex<Option<String>>> = OnceLock::new();
    SLOT.get_or_init(|| Mutex::new(None))
}

/// Called once, right after a successful login, so a crash report (or a
/// support click) later in the same session can be tied to who was using
/// the app. Never written to disk — memory only, cleared when the process
/// exits.
#[tauri::command]
pub fn set_current_user_email(email: String) {
    if let Ok(mut slot) = current_email_slot().lock() {
        *slot = Some(email);
    }
}

fn current_email() -> String {
    current_email_slot()
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner())
        .clone()
        .unwrap_or_else(|| "not_logged_in".to_string())
}

fn percent_encode(input: &str) -> String {
    let mut out = String::with_capacity(input.len());
    for byte in input.as_bytes() {
        match byte {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                out.push(*byte as char);
            }
            _ => out.push_str(&format!("%{:02X}", byte)),
        }
    }
    out
}

#[cfg(target_os = "windows")]
#[link(name = "shell32")]
extern "system" {
    fn ShellExecuteW(
        hwnd: *mut std::ffi::c_void,
        lp_operation: *const u16,
        lp_file: *const u16,
        lp_parameters: *const u16,
        lp_directory: *const u16,
        n_show_cmd: i32,
    ) -> *mut std::ffi::c_void;
}

fn wide(s: &str) -> Vec<u16> {
    s.encode_utf16().chain(std::iter::once(0)).collect()
}

/// Opens a Gmail compose draft in the user's DEFAULT browser (never a
/// hardcoded one — ShellExecute's "open" verb on an https:// URL always
/// respects whatever browser Windows is configured to use).
fn open_support_compose(subject: &str) {
    let url = format!(
        "https://mail.google.com/mail/?view=cm&fs=1&to={}&su={}",
        percent_encode(SUPPORT_EMAIL),
        percent_encode(subject)
    );

    #[cfg(target_os = "windows")]
    unsafe {
        ShellExecuteW(
            std::ptr::null_mut(),
            wide("open").as_ptr(),
            wide(&url).as_ptr(),
            std::ptr::null(),
            std::ptr::null(),
            1, // SW_SHOWNORMAL
        );
    }
}

/// Best-effort: send the diagnostic text to our server so it reaches us
/// even if the customer's machine has no mail client configured, or they
/// close the browser draft without sending it.
///
/// Runs the actual network call on its own freshly-spawned OS thread (the
/// panic hook calling this may itself be running on a thread that was
/// driving async/Tokio work at the moment it panicked, and calling
/// reqwest::blocking::Client directly there panics at runtime — "Cannot
/// start a runtime from within a runtime"; a brand-new thread never
/// carries that context). Unlike a pure fire-and-forget spawn, this
/// function WAITS (up to `max_wait`) for that thread before returning:
/// Cargo.toml sets `panic = "abort"`, so the whole process terminates the
/// instant the panic hook returns, which would otherwise kill the send
/// mid-flight almost every time.
fn send_report(kind: &str, details: &str) {
    let email = current_email();
    let kind = kind.to_string();
    let details = details.to_string();
    let payload = serde_json::json!({
        "email": email,
        "kind": kind,
        "appVersion": env!("CARGO_PKG_VERSION"),
        "os": std::env::consts::OS,
        "arch": std::env::consts::ARCH,
        "details": details,
    });

    let (tx, rx) = std::sync::mpsc::channel();
    std::thread::spawn(move || {
        let client = reqwest::blocking::Client::builder()
            .https_only(true)
            .timeout(std::time::Duration::from_secs(15))
            .build();
        if let Ok(client) = client {
            let _ = client.post(REPORT_ENDPOINT).json(&payload).send();
        }
        let _ = tx.send(()); // best-effort — the receiver may already have timed out
    });

    // Bounded wait, not a real timeout on the request itself: if the send
    // above is still stuck past this, we give up waiting (and the process
    // may still abort mid-flight for a genuinely slow/asleep server), but
    // we never hang the crash dialog indefinitely over a reporting failure.
    let _ = rx.recv_timeout(std::time::Duration::from_secs(12));
}

/// Called from the panic hook. Shows a native Yes/No dialog; only sends
/// anything and opens the browser if the customer chooses "Yes".
pub fn on_crash(panic_message: &str, location: &str) {
    #[cfg(target_os = "windows")]
    {
        use std::ffi::c_void;
        #[link(name = "user32")]
        extern "system" {
            fn MessageBoxW(hwnd: *mut c_void, text: *const u16, caption: *const u16, utype: u32) -> i32;
        }
        const MB_YESNO_ICONERROR: u32 = 0x4 | 0x10;
        const IDYES: i32 = 6;

        let text = "An unexpected error occurred and YK PubEngine must close.\nWould you like to contact support?\n\nحدث خطأ غير متوقع ويجب إغلاق البرنامج.\nهل تريد التواصل مع الدعم؟";
        let caption = "YK PubEngine — Error / خطأ";

        let choice = unsafe {
            MessageBoxW(
                std::ptr::null_mut(),
                wide(text).as_ptr(),
                wide(caption).as_ptr(),
                MB_YESNO_ICONERROR,
            )
        };

        if choice == IDYES {
            let details = format!("{panic_message} | {location}");
            send_report("crash", &details);
            open_support_compose("YK PubEngine - Automatic Crash Report");
        }
    }
}

/// Called on demand from the UI (a "Contact support" button), for a
/// non-crash problem. `note` is whatever short context the customer typed,
/// if anything.
#[tauri::command]
pub fn contact_support_manual(note: String) {
    send_report("manual", &note);
    open_support_compose("YK PubEngine - Support Request");
}
