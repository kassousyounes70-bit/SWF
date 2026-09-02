// منطق التحقق من الكوبون والاتصال بخادم Render
// يُستخدم فقط داخل "الملف الغبي" (شاشة تسجيل الدخول)
(function () {
  const VALIDATE_URL = "https://yk-pubengine-v1.onrender.com/validateCoupon";

  function getDeviceId() {
    if (typeof AndroidBridge !== "undefined" && AndroidBridge.getDeviceId) {
      return AndroidBridge.getDeviceId();
    }
    return "web-unknown-device"; // احتياطي فقط لو فُتح خارج تطبيق الأندرويد
  }

  window.submitCoupon = function (couponCode, email, password) {
    const deviceId = getDeviceId();

    return fetch(VALIDATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ couponCode, deviceId, email }),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .catch(function (err) {
        return { ok: false, data: { error: "تعذّر الاتصال بالخادم" } };
      });
  };
})();
