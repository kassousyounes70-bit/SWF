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
    use std::process::Command;

    // "tasklist" is a built-in Windows binary; no extra dependency needed.
    let output = match Command::new("tasklist").output() {
        Ok(o) => o,
        Err(_) => return false, // fail open on the enumeration itself; never crash the app
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

#[tauri::command]
pub fn run_security_checks() -> SecurityCheckResult {
    #[cfg(target_os = "windows")]
    {
        if is_debugger_attached() {
            return SecurityCheckResult { blocked: true, category: "debugger" };
        }
        if is_virtual_machine() {
            return SecurityCheckResult { blocked: true, category: "virtual_machine" };
        }
        if has_analysis_tool_running() {
            return SecurityCheckResult { blocked: true, category: "analysis_tool" };
        }
        return SecurityCheckResult { blocked: false, category: "clean" };
    }

    #[cfg(not(target_os = "windows"))]
    {
        SecurityCheckResult { blocked: false, category: "clean" }
    }
}
