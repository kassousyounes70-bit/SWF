#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use sha2::{Digest, Sha256};

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
fn read_reg_string(root: winreg::RegKey, path: &str, name: &str) -> String {
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
        use winreg::{RegKey, RegValue};

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
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_device_id])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
