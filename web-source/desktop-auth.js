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

  function notifyRustOfEmail(email) {
    try {
      if (window.__TAURI__ && window.__TAURI__.core) {
        window.__TAURI__.core.invoke("set_current_user_email", { email: email || "" });
      }
    } catch (err) { /* best-effort only — never block login on this */ }
  }

  window.createAccount = async function (couponCode, email, password) {
    const result = await callServer("/createAccount", {
      couponCode, deviceId: await getDeviceId(), email, password, platform: "windows"
    });
    if (result.ok && result.data && result.data.success) notifyRustOfEmail(email);
    return result;
  };

  window.loginAccount = async function (couponCode, email, password) {
    const result = await callServer("/login", {
      couponCode, deviceId: await getDeviceId(), email, password, platform: "windows"
    });
    if (result.ok && result.data && result.data.success) notifyRustOfEmail(email);
    return result;
  };

  window.resetPasswordDesktop = async function (email) {
    return callServer("/resetPassword", { email });
  };

  // W6: request the Windows-specific tool only after the server-issued ticket
  // has been obtained by a successful Windows login.
  window.getDesktopTool = async function (ticket, lang) {
    const requestedLang = lang === "en" ? "en" : "ar";
    return callServer("/getTool", {
      ticket,
      deviceId: await getDeviceId(),
      lang: requestedLang,
      platform: "windows"
    });
  };

  window.getDesktopDeviceId = getDeviceId;
  window.desktopSecureRequest = callServer;
})();
