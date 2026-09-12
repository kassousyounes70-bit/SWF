(function () {
  const BASE_URL = "https://yk-pubengine-v1.onrender.com";
  let cachedDeviceId = null;

  async function getDeviceId() {
    if (cachedDeviceId) return cachedDeviceId;
    try {
      if (window.__TAURI__ && window.__TAURI__.core &&
          typeof window.__TAURI__.core.invoke === "function") {
        cachedDeviceId = await window.__TAURI__.core.invoke("get_device_id");
        return cachedDeviceId;
      }
    } catch (err) {
      console.error("تعذّر الحصول على معرّف جهاز Windows:", err);
    }
    return "windows-unknown-device";
  }

  async function callServer(path, payload) {
    try {
      const res = await fetch(BASE_URL + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      return { ok: res.ok, data };
    } catch (err) {
      return { ok: false, data: { error: "تعذّر الاتصال بالخادم" } };
    }
  }

  window.createAccount = async function (couponCode, email, password) {
    return callServer("/createAccount", {
      couponCode, deviceId: await getDeviceId(), email, password, platform: "windows"
    });
  };

  window.loginAccount = async function (couponCode, email, password) {
    return callServer("/login", {
      couponCode, deviceId: await getDeviceId(), email, password, platform: "windows"
    });
  };

  window.getDesktopDeviceId = getDeviceId;
})();
