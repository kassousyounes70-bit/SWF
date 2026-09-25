// security_checks.rs
// Runtime-environment protections for the Windows desktop build.
// Mirrors the intent of Android's SecurityChecks.kt: refuse to hand the
// smart tool to a virtual machine, a debugger, or a known
// network-interception / reverse-engineering tool.
//
// Everything here is 100% local (registry reads, WinAPI, local process
// list). No server round-trip is required or performed.

use serde::Serialize;

#[cfg(target_os = "windows")]
#[link(name = "kernel32")]
extern "system" {
    fn IsDebuggerPresent() -> i32;
}

#[derive(Serialize)]
pub struct SecurityCheckResult {
    pub blocked: bool,
    // Coarse category only (never the exact process name), so a blocked
    // response never hands an analyst a signature of what tripped it.
    pub category: &'static str,
}

#[cfg(target_os = "windows")]
fn read_reg_string(root: &winreg::RegKey, path: &str, name: &str) -> String {
    root.open_subkey(path)
        .ok()
        .and_then(|key| key.get_value::<String, _>(name).ok())
        .map(|v: String| v.trim().to_lowercase())
        .filter(|v| !v.is_empty())
        .unwrap_or_default()
}

#[cfg(target_os = "windows")]
fn is_virtual_machine() -> bool {
    use winreg::enums::HKEY_LOCAL_MACHINE;
    use winreg::RegKey;

    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    let bios_path = "HARDWARE\\DESCRIPTION\\System\\BIOS";

    let manufacturer = read_reg_string(&hklm, bios_path, "SystemManufacturer");
    let product = read_reg_string(&hklm, bios_path, "SystemProductName");
    let bb_manufacturer = read_reg_string(&hklm, bios_path, "BaseBoardManufacturer");
    let bb_product = read_reg_string(&hklm, bios_path, "BaseBoardProduct");
    let bios_vendor = read_reg_string(&hklm, bios_path, "BIOSVendor");

    let haystack = [manufacturer, product, bb_manufacturer, bb_product, bios_vendor].join(" | ");

    const VM_MARKERS: [&str; 11] = [
        "vmware",
        "virtualbox",
        "vbox",
        "qemu",
        "kvm",
        "xen",
        "innotek gmbh",
        "parallels",
        "virtual machine",
        "microsoft corporation virtual",
        "bochs",
    ];

    VM_MARKERS.iter().any(|marker| haystack.contains(marker))
}

#[cfg(target_os = "windows")]
fn is_debugger_attached() -> bool {
    unsafe { IsDebuggerPresent() != 0 }
}

#[cfg(target_os = "windows")]
fn has_analysis_tool_running() -> bool {
    use std::os::windows::process::CommandExt;
    use std::process::Command;

    // CREATE_NO_WINDOW (0x08000000) is mandatory here: this process is a
    // GUI-subsystem app, so spawning a console program like tasklist without
    // this flag makes Windows pop a brand-new console window for a fraction
    // of a second — the "cmd window flash" users were seeing at launch and
    // every time the periodic watcher re-ran this check.
    const CREATE_NO_WINDOW: u32 = 0x0800_0000;

    // "tasklist" is a built-in Windows binary; no extra dependency needed.
    let mut command = Command::new("tasklist");
    command.creation_flags(CREATE_NO_WINDOW);
    let output = match command.output() {
        Ok(o) => o,
        Err(e) => {
            crate::diagnostics::warn(format!("tasklist enumeration failed: {e}"));
            return false; // fail open on the enumeration itself; never crash the app
        }
    };

    let list = String::from_utf8_lossy(&output.stdout).to_lowercase();

    const WATCHED_PROCESSES: [&str; 17] = [
        "wireshark.exe",
        "fiddler.exe",
        "charles.exe",
        "mitmproxy.exe",
        "mitmdump.exe",
        "httpdebuggerui.exe",
        "procmon.exe",
        "procmon64.exe",
        "processhacker.exe",
        "x64dbg.exe",
        "x32dbg.exe",
        "ollydbg.exe",
        "ida.exe",
        "ida64.exe",
        "dnspy.exe",
        "de4dot.exe",
        "cheatengine-x86_64.exe",
    ];

    WATCHED_PROCESSES.iter().any(|proc_name| list.contains(proc_name))
}

// Reusable by both the JS-callable command below AND the Rust-native
// startup gate in startup_gate.rs — one implementation, two call sites,
// so the two layers can never silently drift apart.
pub fn environment_is_clean() -> (bool, &'static str) {
    #[cfg(target_os = "windows")]
    {
        if is_debugger_attached() {
            crate::diagnostics::warn("environment check: debugger attached");
            return (false, "debugger");
        }
        if is_virtual_machine() {
            crate::diagnostics::warn("environment check: virtual machine detected");
            return (false, "virtual_machine");
        }
        if has_analysis_tool_running() {
            crate::diagnostics::warn("environment check: analysis tool detected");
            return (false, "analysis_tool");
        }
        (true, "clean")
    }
    #[cfg(not(target_os = "windows"))]
    { (true, "clean") }
}

#[tauri::command]
pub fn run_security_checks() -> SecurityCheckResult {
    let (clean, category) = environment_is_clean();
    SecurityCheckResult { blocked: !clean, category }
}
