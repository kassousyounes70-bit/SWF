const functions = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.database();

exports.validateCoupon = functions.onCall(async (request) => {
  const { couponCode, deviceId, email } = request.data;

  if (!couponCode || !deviceId || !email) {
    throw new functions.HttpsError("invalid-argument", "بيانات ناقصة");
  }

  const ref = db.ref(`coupons/${couponCode}`);
  const snapshot = await ref.get();

  if (!snapshot.exists()) {
    throw new functions.HttpsError("not-found", "الكوبون غير صحيح");
  }

  const coupon = snapshot.val();

  if (coupon.used === true) {
    // كوبون مُستخدم سابقًا: نسمح فقط لنفس الجهاز والبريد بالدخول مجددًا
    if (coupon.boundDeviceId === deviceId && coupon.boundEmail === email) {
      return { success: true, message: "تسجيل دخول ناجح" };
    }
    throw new functions.HttpsError(
      "permission-denied",
      "هذا الكوبون مستخدم بالفعل على جهاز آخر"
    );
  }

  // كوبون جديد: نربطه بهذا الجهاز والبريد لأول مرة
  await ref.update({
    used: true,
    boundDeviceId: deviceId,
    boundEmail: email,
    activatedAt: admin.database.ServerValue.TIMESTAMP,
  });

  return { success: true, message: "تم تفعيل الكوبون بنجاح" };
});
