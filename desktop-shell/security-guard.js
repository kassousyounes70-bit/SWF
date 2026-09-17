// security-guard.js
// Loaded AFTER desktop-auth.js (which supplies window.desktopSecureRequest)
// and BEFORE the login form becomes meaningfully usable. Runs two
// independent gates in order:
//   1) Version gate — refuses to run an outdated copy at all.
//   2) Runtime-environment gate — VM / debugger / analysis-tool detection.
// Either gate replaces the page with a static screen and stops there — no
// login call, no ticket, no tool is ever requested past that point.
(function () {
  function texts() {
    var lang = (document.documentElement.lang || "ar").toLowerCase();
    if (lang.indexOf("en") === 0) {
      return {
        dir: "ltr",
        blockedTitle: "This copy can't run here",
        blockedBody: "YK PubEngine can't start in this environment. Please run the application on a regular Windows PC, outside any virtual machine, debugger, or network-analysis tool, then try again.",
        updateTitle: "An update is required",
        updateBody: "This copy of YK PubEngine is out of date and can no longer be used. Please download the latest version from the page you purchased it from.",
      };
    }
    return {
      dir: "rtl",
      blockedTitle: "تعذّر تشغيل هذه النسخة هنا",
      blockedBody: "لا يمكن لبرنامج YK PubEngine أن يعمل في هذه البيئة. الرجاء تشغيل البرنامج على جهاز ويندوز عادي، خارج أي بيئة افتراضية أو أداة تصحيح أو أداة تحليل شبكة، ثم إعادة المحاولة.",
      updateTitle: "التحديث مطلوب",
      updateBody: "هذه النسخة من YK PubEngine قديمة ولم يعد بالإمكان استخدامها. الرجاء تحميل أحدث إصدار من نفس الصفحة التي حصلت منها على البرنامج.",
    };
  }

  function lockOutLoginFunctions() {
    window.createAccount = window.loginAccount = window.getDesktopTool = function () {
      return Promise.resolve({ ok: false, data: { error: "blocked" } });
    };
  }

  function showScreen(icon, title, body, linkUrl) {
    var t = texts();
    document.documentElement.dir = t.dir;
    var linkHtml = linkUrl
      ? '<a href="' + linkUrl + '" target="_blank" rel="noopener" ' +
        'style="display:inline-block;margin-top:20px;padding:12px 22px;background:#5ec98f;' +
        'color:#0d0d0d;text-decoration:none;font-weight:bold;border-radius:4px;">' +
        (t.dir === "rtl" ? "تحميل آخر إصدار" : "Download the latest version") + "</a>" +
        '<p style="font-size:12px;color:#888;margin-top:10px;word-break:break-all;">' + linkUrl + "</p>"
      : "";
    document.body.innerHTML =
      '<div style="position:fixed;inset:0;background:#0d0d0d;color:#fff;' +
      'display:flex;align-items:center;justify-content:center;text-align:center;' +
      'font-family:system-ui,-apple-system,Segoe UI,sans-serif;padding:32px;z-index:999999;">' +
      '<div style="max-width:420px;">' +
      '<div style="font-size:48px;margin-bottom:16px;">' + icon + '</div>' +
      '<h1 style="font-size:20px;margin:0 0 12px;">' + title + "</h1>" +
      '<p style="font-size:15px;line-height:1.6;color:#ccc;margin:0;">' + body + "</p>" +
      linkHtml +
      "</div></div>";
    // Belt-and-suspenders: make sure nothing else on the page can still
    // reach the login/coupon functions even if some other script already
    // registered them on window before this check completed.
    lockOutLoginFunctions();
  }

  // --- Version comparison: "1.2.10" > "1.2.9", etc. ---
  function versionAtLeast(current, required) {
    var c = String(current).split(".").map(function (n) { return parseInt(n, 10) || 0; });
    var r = String(required).split(".").map(function (n) { return parseInt(n, 10) || 0; });
    var len = Math.max(c.length, r.length);
    for (var i = 0; i < len; i++) {
      var cv = c[i] || 0, rv = r[i] || 0;
      if (cv > rv) return true;
      if (cv < rv) return false;
    }
    return true; // equal
  }

  async function fetchFirebaseMinVersion() {
    try {
      var result = await window.desktopSecureRequest("/minVersion", { platform: "windows" });
      if (result && result.ok && result.data && result.data.minVersion) {
        return { minVersion: result.data.minVersion, downloadUrl: result.data.downloadUrl || "" };
      }
    } catch (e) { /* fall through to null */ }
    return null; // could not reach this source — do not let it raise the bar
  }

  async function fetchGithubMinVersion() {
    try {
      if (window.__TAURI__ && window.__TAURI__.core) {
        return await window.__TAURI__.core.invoke("fetch_github_min_version", { platform: "windows" });
      }
    } catch (e) { /* fall through to null */ }
    return null;
  }

  // Effective minimum = the highest of whichever sources actually answered.
  // A single source being unreachable never lowers the bar below what the
  // other source already confirmed, and never blocks a legitimate user on
  // its own — but both would have to be spoofed together to let an old
  // build through.
  async function runVersionGate() {
    if (!window.__TAURI__ || !window.__TAURI__.core) return { ok: true }; // no bridge, nothing to gate on
    var localVersion = "0.0.0";
    try {
      localVersion = await window.__TAURI__.core.invoke("get_app_version");
    } catch (e) { return { ok: true }; } // can't even read our own version — fail open

    var [fbResult, ghMin] = await Promise.all([fetchFirebaseMinVersion(), fetchGithubMinVersion()]);
    var fbMin = fbResult ? fbResult.minVersion : null;
    var downloadUrl = fbResult ? fbResult.downloadUrl : "";

    var required = "0.0.0";
    [fbMin, ghMin].forEach(function (v) {
      if (v && !versionAtLeast(required, v)) required = v;
    });

    if (required === "0.0.0") return { ok: true }; // neither source reachable — fail open
    return { ok: versionAtLeast(localVersion, required), downloadUrl: downloadUrl };
  }

  async function runEnvironmentGate() {
    try {
      if (!window.__TAURI__ || !window.__TAURI__.core ||
          typeof window.__TAURI__.core.invoke !== "function") {
        return true; // no bridge — fail open, the pinned network layer remains the backstop
      }
      var result = await window.__TAURI__.core.invoke("run_security_checks");
      return !(result && result.blocked);
    } catch (err) {
      console.error("تعذّر تنفيذ فحص بيئة التشغيل:", err);
      return true; // fail open on a check error, never on a real detection
    }
  }

  async function runGuard() {
    var t = texts();
    var versionCheck = await runVersionGate();
    if (!versionCheck.ok) {
      showScreen("⬆️", t.updateTitle, t.updateBody, versionCheck.downloadUrl);
      return;
    }
    var environmentOK = await runEnvironmentGate();
    if (!environmentOK) {
      showScreen("🛑", t.blockedTitle, t.blockedBody);
    }
  }

  // Loaded in <head>, before <body> exists — wait for the DOM so
  // showScreen() always has a real document.body to replace.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runGuard);
  } else {
    runGuard();
  }
})();
