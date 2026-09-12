(function () {
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
      if (!window.__TAURI__ || !window.__TAURI__.core ||
          typeof window.__TAURI__.core.invoke !== "function") {
        return { ok: false, data: { error: "واجهة Windows الآمنة غير متاحة" } };
      }

      const raw = await window.__TAURI__.core.invoke("secure_api_request", {
        path,
        body: JSON.stringify(payload)
      });
      const result = JSON.parse(raw);
      let data = {};
      try { data = JSON.parse(result.body); } catch (_) { data = { raw: result.body }; }
      return { ok: result.ok === true, data };
    } catch (err) {
      console.error("فشل الاتصال الآمن بالخادم:", err);
      return { ok: false, data: { error: "تعذّر الاتصال الآمن بالخادم" } };
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

  window.resetPasswordDesktop = async function (email) {
    return callServer("/resetPassword", { email });
  };

  window.getDesktopDeviceId = getDeviceId;
  window.desktopSecureRequest = callServer;
})();
