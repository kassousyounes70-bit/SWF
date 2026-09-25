(function () {
  // ---------------------------------------------------------------
  // Diagnostics bootstrap. This file is the first script loaded on the
  // desktop login shell, so it installs the global error handlers and the
  // window.ykDiag() bridge before any page logic runs. Everything ykDiag
  // logs ends up in the same file as the Rust startup stages
  // (YK-PubEngine-startup.log), which is what makes a black-screen / flash
  // report actually diagnosable on a customer machine.
  // ---------------------------------------------------------------
  function ykLog(level, message) {
    var text = String(message);
    try {
      if (window.__TAURI__ && window.__TAURI__.core &&
          typeof window.__TAURI__.core.invoke === "function") {
        var pending = window.__TAURI__.core.invoke("log_js_event", { level: String(level), message: text });
        // Swallow failures: an unhandled rejection here would re-enter the
        // unhandledrejection handler below and could loop.
        if (pending && typeof pending.catch === "function") pending.catch(function () {});
      }
    } catch (_) { /* logging must never break the page */ }
    try { console.log("[YK][" + level + "] " + text); } catch (_) {}
  }
  window.ykDiag = ykLog;

  // Visible last-resort error panel. Without this, any uncaught error while
  // the black splash is up looks identical to "the app opened to a black
  // screen" with no clue. z-index above the splash (300) on purpose.
  function ykShowFatal(message) {
    try {
      if (document.getElementById("ykFatalOverlay")) return;
      var box = document.createElement("div");
      box.id = "ykFatalOverlay";
      box.setAttribute("dir", "rtl");
      box.style.cssText = "position:fixed;inset:0;z-index:2147483647;background:#1a0000;color:#ffd7d7;" +
        "font-family:system-ui,Segoe UI,sans-serif;padding:28px;overflow:auto;direction:rtl;text-align:right;";
      box.innerHTML =
        '<h1 style="font-size:18px;margin:0 0 12px;">حدث خطأ في واجهة البرنامج</h1>' +
        '<p style="font-size:14px;color:#ffbdbd;margin:0 0 14px;">The interface hit an error. ' +
        'A diagnostic log (YK-PubEngine-startup.log) was written next to the program.</p>' +
        '<pre style="white-space:pre-wrap;word-break:break-word;font-size:12px;background:#2a0a0a;' +
        'padding:12px;border:1px solid #551515;direction:ltr;text-align:left;">' +
        String(message).replace(/[<>&]/g, function (c) {
          return { "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c];
        }) +
        '</pre>';
      document.body.appendChild(box);
    } catch (_) {}
  }
  window.ykShowFatal = ykShowFatal;

  // capture=true so this also fires for failed <script>/<img>/font loads.
  window.addEventListener("error", function (event) {
    var target = event.target || {};
    var where = event.filename || target.src || target.href || "";
    var isRuntimeError = !!event.message;
    var detail = (event.message || "resource failed to load") +
      (where ? " @ " + where : "") +
      (isRuntimeError ? ":" + (event.lineno || 0) + ":" + (event.colno || 0) : "");
    ykLog(isRuntimeError ? "ERROR" : "WARN", "window.error: " + detail);
    // Browser-level noise that is harmless: log it, but don't throw the big
    // red panel over a normal session for it.
    var benign = /ResizeObserver|Script error\.?$/i.test(event.message || "");
    if (isRuntimeError && !benign) {
      ykShowFatal(event.message + "\n\n" + (where ? where + ":" + (event.lineno || 0) : ""));
    }
  }, true);

  window.addEventListener("unhandledrejection", function (event) {
    var reason = event.reason;
    var text = reason && reason.message ? reason.message : String(reason);
    ykLog("ERROR", "unhandledrejection: " + text);
  });

  function ykLogBoot() {
    try {
      var bridge = !!(window.__TAURI__ && window.__TAURI__.core &&
        typeof window.__TAURI__.core.invoke === "function");
      ykLog("INFO", "boot: readyState=" + document.readyState +
        " tauriBridge=" + bridge +
        " dpr=" + window.devicePixelRatio +
        " viewport=" + window.innerWidth + "x" + window.innerHeight +
        " ua=" + navigator.userAgent);
      if (!bridge) {
        ykLog("WARN", "boot: window.__TAURI__ bridge is MISSING (withGlobalTauri off, or page opened outside the app)");
      }
    } catch (_) {}
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ykLogBoot);
  } else {
    ykLogBoot();
  }

  // ---------------------------------------------------------------
  // Secure request helpers.
  // ---------------------------------------------------------------
  let cachedDeviceId = null;

  async function getDeviceId() {
    if (cachedDeviceId) return cachedDeviceId;
    try {
      if (window.__TAURI__ && window.__TAURI__.core &&
          typeof window.__TAURI__.core.invoke === "function") {
        cachedDeviceId = await window.__TAURI__.core.invoke("get_device_id");
        ykLog("INFO", "device id resolved");
        return cachedDeviceId;
      }
    } catch (err) {
      ykLog("ERROR", "device id lookup failed: " + (err && err.message ? err.message : err));
      console.error("تعذّر الحصول على معرّف جهاز Windows:", err);
    }
    return "windows-unknown-device";
  }

  async function callServer(path, payload) {
    try {
      if (!window.__TAURI__ || !window.__TAURI__.core ||
          typeof window.__TAURI__.core.invoke !== "function") {
        ykLog("ERROR", "callServer(" + path + "): Tauri bridge unavailable");
        return { ok: false, data: { error: "واجهة Windows الآمنة غير متاحة" } };
      }

      const raw = await window.__TAURI__.core.invoke("secure_api_request", {
        path,
        body: JSON.stringify(payload)
      });
      const result = JSON.parse(raw);
      let data = {};
      try { data = JSON.parse(result.body); } catch (_) { data = { raw: result.body }; }
      ykLog(result.ok === true ? "INFO" : "WARN",
        "callServer(" + path + "): status=" + result.status + " ok=" + (result.ok === true));
      return { ok: result.ok === true, data };
    } catch (err) {
      ykLog("ERROR", "callServer(" + path + ") failed: " + (err && err.message ? err.message : err));
      console.error("فشل الاتصال الآمن بالخادم:", err);
      return { ok: false, data: { error: "تعذّر الاتصال الآمن بالخادم" } };
    }
  }

  function notifyRustOfEmail(email) {
    try {
      if (window.__TAURI__ && window.__TAURI__.core) {
        var pending = window.__TAURI__.core.invoke("set_current_user_email", { email: email || "" });
        if (pending && typeof pending.catch === "function") pending.catch(function () {});
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

  ykLog("INFO", "desktop-auth.js: helpers installed");
})();
