// منطق التحقق من الكوبون والاتصال بخادم Render
// يُستخدم فقط داخل "الملف الغبي" (شاشة تسجيل الدخول/إنشاء الحساب)
(function () {
  const BASE_URL = "https://yk-pubengine-v1.onrender.com";

  function getDeviceId() {
    if (typeof AndroidBridge !== "undefined" && AndroidBridge.getDeviceId) {
      return AndroidBridge.getDeviceId();
    }
    return "web-unknown-device"; // احتياطي فقط لو فُتح خارج تطبيق الأندرويد
  }

  function callServer(path, payload) {
    return fetch(BASE_URL + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .catch(function () {
        return { ok: false, data: { error: "تعذّر الاتصال بالخادم" } };
      });
  }

  window.createAccount = function (couponCode, email, password) {
    return callServer("/createAccount", {
      couponCode: couponCode,
      deviceId: getDeviceId(),
      email: email,
      password: password,
    });
  };

  window.loginAccount = function (couponCode, email, password) {
    return callServer("/login", {
      couponCode: couponCode,
      deviceId: getDeviceId(),
      email: email,
      password: password,
    });
  };
})();
