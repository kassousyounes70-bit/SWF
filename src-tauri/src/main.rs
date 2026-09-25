#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use sha2::{Digest, Sha256};
use tauri::Manager;

mod diagnostics;
mod secure_network;
mod security_checks;
mod startup_gate;
mod crash_report;

#[cfg(target_os = "windows")]
const DPAPI_LOCAL_MACHINE: u32 = 0x4;

#[cfg(target_os = "windows")]
#[repr(C)]
struct DataBlob {
    cb_data: u32,
    pb_data: *mut u8,
}

#[cfg(target_os = "windows")]
#[link(name = "crypt32")]
extern "system" {
    fn CryptProtectData(
        data_in: *const DataBlob,
        description: *const u16,
        entropy: *const DataBlob,
        reserved: *mut std::ffi::c_void,
        prompt: *const std::ffi::c_void,
        flags: u32,
        data_out: *mut DataBlob,
    ) -> i32;

    fn CryptUnprotectData(
        data_in: *const DataBlob,
        description: *mut *mut u16,
        entropy: *const DataBlob,
        reserved: *mut std::ffi::c_void,
        prompt: *const std::ffi::c_void,
        flags: u32,
        data_out: *mut DataBlob,
    ) -> i32;
}

#[cfg(target_os = "windows")]
#[link(name = "kernel32")]
extern "system" {
    fn LocalFree(hmem: *mut std::ffi::c_void) -> *mut std::ffi::c_void;
}

#[cfg(target_os = "windows")]
fn dpapi_protect(input: &[u8]) -> Result<Vec<u8>, String> {
    unsafe {
        let input_blob = DataBlob {
            cb_data: input.len() as u32,
            pb_data: input.as_ptr() as *mut u8,
        };
        let mut output_blob = DataBlob { cb_data: 0, pb_data: std::ptr::null_mut() };

        let ok = CryptProtectData(
            &input_blob,
            std::ptr::null(),
            std::ptr::null(),
            std::ptr::null_mut(),
            std::ptr::null(),
            DPAPI_LOCAL_MACHINE,
            &mut output_blob,
        );

        if ok == 0 || output_blob.pb_data.is_null() {
            return Err("Windows could not protect the device key".to_string());
        }

        let result = std::slice::from_raw_parts(output_blob.pb_data, output_blob.cb_data as usize).to_vec();
        LocalFree(output_blob.pb_data as *mut std::ffi::c_void);
        Ok(result)
    }
}

#[cfg(target_os = "windows")]
fn dpapi_unprotect(input: &[u8]) -> Result<Vec<u8>, String> {
    unsafe {
        let input_blob = DataBlob {
            cb_data: input.len() as u32,
            pb_data: input.as_ptr() as *mut u8,
        };
        let mut output_blob = DataBlob { cb_data: 0, pb_data: std::ptr::null_mut() };
        let mut description: *mut u16 = std::ptr::null_mut();

        let ok = CryptUnprotectData(
            &input_blob,
            &mut description,
            std::ptr::null(),
            std::ptr::null_mut(),
            std::ptr::null(),
            0,
            &mut output_blob,
        );

        if ok == 0 || output_blob.pb_data.is_null() {
            return Err("Windows could not unlock the device key".to_string());
        }

        let result = std::slice::from_raw_parts(output_blob.pb_data, output_blob.cb_data as usize).to_vec();
        LocalFree(output_blob.pb_data as *mut std::ffi::c_void);
        if !description.is_null() {
            LocalFree(description as *mut std::ffi::c_void);
        }
        Ok(result)
    }
}

#[cfg(target_os = "windows")]
fn read_reg_string(root: &winreg::RegKey, path: &str, name: &str) -> String {
    root.open_subkey(path)
        .ok()
        .and_then(|key| key.get_value::<String, _>(name).ok())
        .map(|v| v.trim().to_string())
        .filter(|v| !v.is_empty())
        .unwrap_or_default()
}

#[cfg(target_os = "windows")]
fn get_or_create_device_secret() -> Result<Vec<u8>, String> {
    use winreg::enums::HKEY_CURRENT_USER;
    use winreg::{RegKey, RegValue};

    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let key = hkcu
        .create_subkey("Software\\YK PubEngine\\DeviceIdentity")
        .map_err(|e| format!("Unable to open device identity storage: {e}"))?
        .0;

    if let Ok(value) = key.get_raw_value("ProtectedSecret") {
        if let Ok(secret) = dpapi_unprotect(&value.bytes) {
            if secret.len() == 32 {
                return Ok(secret);
            }
        }
    }

    let mut secret = [0u8; 32];
    getrandom::fill(&mut secret).map_err(|e| format!("Unable to generate device secret: {e}"))?;
    let protected = dpapi_protect(&secret)?;
    key.set_raw_value("ProtectedSecret", &RegValue { vtype: winreg::enums::RegType::REG_BINARY, bytes: protected })
        .map_err(|e| format!("Unable to store device identity: {e}"))?;

    Ok(secret.to_vec())
}

// Diagnostic-only helper: checks the standard Evergreen WebView2 registry
// locations (per-machine 32/64-bit and per-user) for an installed runtime.
// A missing runtime is the most common real-world cause of a Tauri window
// that opens normally but shows a blank/black client area — the native
// window frame is drawn by Windows, but there is no WebView2 control
// available to render the page inside it.
#[cfg(target_os = "windows")]
fn detect_webview2_runtime() -> Option<String> {
    use winreg::enums::{HKEY_CURRENT_USER, HKEY_LOCAL_MACHINE};
    use winreg::RegKey;

    const CLIENT_GUID: &str = "{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}";

    let try_path = |root: winreg::RegKey, subpath: String| -> Option<String> {
        let key = root.open_subkey(&subpath).ok()?;
        let pv: String = key.get_value("pv").ok()?;
        let pv = pv.trim().to_string();
        if pv.is_empty() || pv == "0.0.0.0" { None } else { Some(pv) }
    };

    try_path(RegKey::predef(HKEY_LOCAL_MACHINE), format!("SOFTWARE\\WOW6432Node\\Microsoft\\EdgeUpdate\\Clients\\{CLIENT_GUID}"))
        .or_else(|| try_path(RegKey::predef(HKEY_LOCAL_MACHINE), format!("SOFTWARE\\Microsoft\\EdgeUpdate\\Clients\\{CLIENT_GUID}")))
        .or_else(|| try_path(RegKey::predef(HKEY_CURRENT_USER), format!("SOFTWARE\\Microsoft\\EdgeUpdate\\Clients\\{CLIENT_GUID}")))
}

#[tauri::command]
fn log_from_frontend(message: String) {
    diagnostics::log(format!("FRONTEND: {message}"));
}

#[tauri::command]
fn get_device_id() -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        use winreg::enums::HKEY_LOCAL_MACHINE;
        use winreg::RegKey;

        let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
        let machine_guid = read_reg_string(&hklm, "SOFTWARE\\Microsoft\\Cryptography", "MachineGuid");
        if machine_guid.is_empty() {
            return Err("Windows device identity is unavailable".to_string());
        }

        // These values are additional signals. Some PCs legitimately expose an empty value,
        // so they are included when present and never used alone.
        let bios_path = "HARDWARE\\DESCRIPTION\\System\\BIOS";
        let manufacturer = read_reg_string(&hklm, bios_path, "SystemManufacturer");
        let product = read_reg_string(&hklm, bios_path, "SystemProductName");
        let baseboard_manufacturer = read_reg_string(&hklm, bios_path, "BaseBoardManufacturer");
        let baseboard_product = read_reg_string(&hklm, bios_path, "BaseBoardProduct");
        let processor = read_reg_string(&hklm, "HARDWARE\\DESCRIPTION\\System\\CentralProcessor\\0", "ProcessorNameString");

        // The secret is generated once and then protected by Windows DPAPI with machine scope.
        // Copying the registry value to another Windows machine does not make the secret usable there.
        let secret = get_or_create_device_secret()?;

        let mut hasher = Sha256::new();
        hasher.update(b"YK-PubEngine-Windows-Device-v2\n");
        for value in [
            machine_guid,
            manufacturer,
            product,
            baseboard_manufacturer,
            baseboard_product,
            processor,
        ] {
            hasher.update(value.as_bytes());
            hasher.update(b"\n");
        }
        hasher.update(&secret);

        let digest = hasher.finalize();
        return Ok(format!("win2-{:x}", digest));
    }

    #[cfg(not(target_os = "windows"))]
    {
        Err("Windows device identity is unavailable on this platform".to_string())
    }
}

fn main() {
    // Rustls has two possible crypto backends (ring / aws-lc-rs). Since
    // rustls 0.23, if more than one ends up compiled in transitively (as
    // happens here between our direct rustls dependency and reqwest's
    // rustls-tls feature), it refuses to guess which one to use
    // process-wide — this must run before ANY HTTPS connection is
    // attempted (Firebase / GitHub Gist checks included), or the process
    // panics on first use, exactly as the diagnostic log below caught.
    let _ = rustls::crypto::ring::default_provider().install_default();

    diagnostics::begin();
    diagnostics::log("Rustls default crypto provider installed (ring)");

    // Release builds use the Windows GUI subsystem, so a panic would normally
    // disappear with no useful message. Record the panic beside the EXE so
    // the next test tells us exactly where startup failed.
    std::panic::set_hook(Box::new(|panic_info| {
        let message = if let Some(s) = panic_info.payload().downcast_ref::<&str>() {
            (*s).to_string()
        } else if let Some(s) = panic_info.payload().downcast_ref::<String>() {
            s.clone()
        } else {
            "<non-string panic payload>".to_string()
        };

        let location = if let Some(location) = panic_info.location() {
            let loc = format!("file={} line={} column={}", location.file(), location.line(), location.column());
            diagnostics::log(format!("PANIC: {message} | {loc}"));
            loc
        } else {
            diagnostics::log(format!("PANIC: {message} | location=<unknown>"));
            "location=<unknown>".to_string()
        };

        // Debug-only diagnostics above are silent in a release build (see
        // diagnostics.rs) — this is what actually reaches us for a crash a
        // real customer hits, since it doesn't depend on anyone reading a
        // log file beside the EXE.
        crash_report::on_crash(&message, &location);
    }));

    diagnostics::log("Creating Tauri builder");

    tauri::Builder::default()
        .setup(|app| {
            diagnostics::log("SETUP: entered Tauri setup callback");
            // Native, Rust-level gate — runs before the (hidden-at-launch)
            // window is ever shown. See startup_gate.rs for why this exists
            // as a second, independent copy of the environment/version
            // checks: it does not depend on any bundled JS/HTML file being
            // present or unmodified.
            let window = match app.get_webview_window("main") {
                Some(window) => {
                    diagnostics::log("SETUP: main window found");
                    match (window.inner_size(), window.outer_size(), window.scale_factor()) {
                        (Ok(inner), Ok(outer), Ok(scale)) => diagnostics::log(format!(
                            "WINDOW: inner_size={}x{} outer_size={}x{} scale_factor={scale}",
                            inner.width, inner.height, outer.width, outer.height
                        )),
                        _ => diagnostics::log("WINDOW: could not read size/scale_factor"),
                    }
                    window
                }
                None => {
                    diagnostics::log("SETUP ERROR: main window is missing from tauri.conf.json");
                    panic!("main window is missing from tauri.conf.json");
                }
            };

            {
                let win_for_events = window.clone();
                window.on_window_event(move |event| {
                    diagnostics::log(format!("WINDOW EVENT: {event:?}"));
                    if let tauri::WindowEvent::Resized(size) = event {
                        if let Ok(scale) = win_for_events.scale_factor() {
                            diagnostics::log(format!(
                                "WINDOW EVENT: resized to {}x{} (scale_factor={scale})",
                                size.width, size.height
                            ));
                        }
                    }
                });
            }

            #[cfg(target_os = "windows")]
            match detect_webview2_runtime() {
                Some(v) => diagnostics::log(format!("WEBVIEW2: runtime detected, version={v}")),
                None => diagnostics::log("WEBVIEW2: runtime NOT detected in registry (this is the leading suspect for a blank/black window)"),
            }

            diagnostics::log("SETUP: starting startup_gate::evaluate()");
            let gate_result = tauri::async_runtime::block_on(startup_gate::evaluate());
            diagnostics::log(format!("SETUP: startup_gate result={gate_result:?}"));

            match gate_result {
                Ok(()) => {
                    diagnostics::log("SETUP: gate passed; showing main window");
                    if let Err(e) = window.show() {
                        diagnostics::log(format!("SETUP ERROR: failed to show main window: {e}"));
                        return Err(e.into());
                    }
                    diagnostics::log("SETUP: main window show() succeeded");

                    let diag_script = r#"
                        (function () {
                            function report(msg) {
                                try {
                                    if (window.__TAURI_INTERNALS__ && window.__TAURI_INTERNALS__.invoke) {
                                        window.__TAURI_INTERNALS__.invoke('log_from_frontend', { message: msg });
                                    }
                                } catch (e) {}
                            }
                            window.onerror = function (msg, src, line, col, err) {
                                report('JS ERROR: ' + msg + ' at ' + src + ':' + line + ':' + col + (err && err.stack ? (' | stack=' + err.stack) : ''));
                            };
                            function reportDimensions(tag) {
                                var b = document.body;
                                var h = document.documentElement;
                                report(
                                    'PAGE[' + tag + ']: readyState=' + document.readyState +
                                    ' window=' + window.innerWidth + 'x' + window.innerHeight +
                                    ' html=' + (h ? (h.scrollWidth + 'x' + h.scrollHeight) : '<none>') +
                                    ' body=' + (b ? (b.scrollWidth + 'x' + b.scrollHeight) : '<none>') +
                                    ' url=' + location.href
                                );
                            }
                            reportDimensions('immediate');
                            window.addEventListener('load', function () { reportDimensions('window-load'); });
                            document.addEventListener('DOMContentLoaded', function () { reportDimensions('dom-content-loaded'); });
                            setTimeout(function () { reportDimensions('after-1s'); }, 1000);
                        })();
                    "#;
                    if let Err(e) = window.eval(diag_script) {
                        diagnostics::log(format!("SETUP: failed to inject diagnostic script: {e}"));
                    } else {
                        diagnostics::log("SETUP: diagnostic script injected");
                    }

                    startup_gate::spawn_periodic_watch();
                    diagnostics::log("SETUP: periodic environment watch started");
                }
                Err("outdated") => {
                    diagnostics::log("SETUP: gate blocked startup because the version is outdated");
                    startup_gate::show_native_blocked_dialog(
                        "This copy of YK PubEngine is out of date and can no longer be used. Please download the latest version from the page you purchased it from.\n\nهذه النسخة قديمة ولم يعد بالإمكان استخدامها. الرجاء تحميل أحدث إصدار.",
                        "Update required — التحديث مطلوب",
                    );
                    std::process::exit(0);
                }
                Err(reason) => {
                    diagnostics::log(format!("SETUP: gate blocked startup; reason={reason}"));
                    startup_gate::show_native_blocked_dialog(
                        "YK PubEngine can't start in this environment.\n\nلا يمكن لبرنامج YK PubEngine أن يعمل في هذه البيئة.",
                        "Cannot start — تعذّر التشغيل",
                    );
                    std::process::exit(0);
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_device_id,
            log_from_frontend,
            secure_network::secure_api_request,
            secure_network::fetch_github_min_version,
            secure_network::get_app_version,
            security_checks::run_security_checks,
            crash_report::set_current_user_email,
            crash_report::contact_support_manual
        ])
        .run(tauri::generate_context!())
        .unwrap_or_else(|e| {
            diagnostics::log(format!("TAURI RUN ERROR: {e}"));
            std::process::exit(1);
        });
}
