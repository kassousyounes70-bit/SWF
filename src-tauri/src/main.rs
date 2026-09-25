// Always build as a GUI-subsystem executable on Windows, even for debug /
// test builds. With the old `not(debug_assertions)` condition, any local
// debug build opened a full console window alongside the app — one of the
// "a cmd window flashes" reports. All diagnostics are written to a log file
// (see diagnostics.rs), so nothing is lost by having no console.
#![cfg_attr(target_os = "windows", windows_subsystem = "windows")]

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

        // The diagnostic log above always records the panic (debug and
        // release — see diagnostics.rs). On top of that, this reaches us
        // even if nobody opens the log file: a native dialog with an
        // optional best-effort report to the server.
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
                    window
                }
                None => {
                    diagnostics::log("SETUP ERROR: main window is missing from tauri.conf.json");
                    panic!("main window is missing from tauri.conf.json");
                }
            };

            // Log every native window event. If the app ever opens as a black
            // rectangle again, this is what tells us whether the window was
            // actually shown/focused/resized, or whether it stayed hidden.
            window.on_window_event(|event| {
                diagnostics::log(format!("WINDOW EVENT: {event:?}"));
            });

            let app_handle = app.handle().clone();

            // The gate is run on the async runtime, NOT inline with
            // `block_on`. Blocking the main thread there stops the event loop
            // from starting, so the WebView cannot render while the version
            // check waits on the network (Render's free tier can take up to
            // 60s to wake) — a very plausible cause of the black window.
            // Now the event loop starts immediately and the window is only
            // shown once the gate has actually passed.
            diagnostics::log("SETUP: spawning non-blocking startup gate");
            tauri::async_runtime::spawn(async move {
                diagnostics::log("GATE: evaluate() starting");
                let gate_result = startup_gate::evaluate().await;
                diagnostics::log(format!("GATE: result={gate_result:?}"));

                match gate_result {
                    Ok(()) => {
                        match app_handle.get_webview_window("main") {
                            Some(window) => {
                                diagnostics::log("GATE: gate passed; showing main window");
                                if let Err(e) = window.show() {
                                    diagnostics::error(format!("GATE ERROR: failed to show main window: {e}"));
                                } else {
                                    diagnostics::log("GATE: main window show() succeeded");
                                }
                                let _ = window.set_focus();
                            }
                            None => {
                                diagnostics::error("GATE ERROR: main window disappeared before show()");
                            }
                        }
                        startup_gate::spawn_periodic_watch();
                        diagnostics::log("GATE: periodic environment watch started");
                    }
                    Err("outdated") => {
                        diagnostics::log("GATE: blocked startup because the version is outdated");
                        startup_gate::show_native_blocked_dialog(
                            "This copy of YK PubEngine is out of date and can no longer be used. Please download the latest version from the page you purchased it from.\n\nهذه النسخة قديمة ولم يعد بالإمكان استخدامها. الرجاء تحميل أحدث إصدار.",
                            "Update required — التحديث مطلوب",
                        );
                        std::process::exit(0);
                    }
                    Err(reason) => {
                        diagnostics::log(format!("GATE: blocked startup; reason={reason}"));
                        startup_gate::show_native_blocked_dialog(
                            "YK PubEngine can't start in this environment.\n\nلا يمكن لبرنامج YK PubEngine أن يعمل في هذه البيئة.",
                            "Cannot start — تعذّر التشغيل",
                        );
                        std::process::exit(0);
                    }
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_device_id,
            secure_network::secure_api_request,
            secure_network::fetch_github_min_version,
            secure_network::get_app_version,
            security_checks::run_security_checks,
            crash_report::set_current_user_email,
            crash_report::contact_support_manual,
            diagnostics::log_js_event,
            diagnostics::diagnostics_log_path
        ])
        .run(tauri::generate_context!())
        .unwrap_or_else(|e| {
            diagnostics::log(format!("TAURI RUN ERROR: {e}"));
            std::process::exit(1);
        });
}
