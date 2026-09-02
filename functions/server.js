const express = require("express");
const admin = require("firebase-admin");

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://yk-pubengine-default-rtdb.firebaseio.com",
});

const db = admin.database();
const app = express();
app.use(express.json());

app.post("/validateCoupon", async (req, res) => {
  const { couponCode, deviceId, email } = req.body;

  if (!couponCode || !deviceId || !email) {
    return res.status(400).json({ error: "بيانات ناقصة" });
  }

  const ref = db.ref(`coupons/${couponCode}`);
  const snapshot = await ref.get();

  if (!snapshot.exists()) {
    return res.status(404).json({ error: "الكوبون غير صحيح" });
  }

  const coupon = snapshot.val();

  if (coupon.used === true) {
    if (coupon.boundDeviceId === deviceId && coupon.boundEmail === email) {
      return res.json({ success: true, message: "تسجيل دخول ناجح" });
    }
    return res.status(403).json({ error: "هذا الكوبون مستخدم بالفعل على جهاز آخر" });
  }

  await ref.update({
    used: true,
    boundDeviceId: deviceId,
    boundEmail: email,
    activatedAt: admin.database.ServerValue.TIMESTAMP,
  });

  return res.json({ success: true, message: "تم تفعيل الكوبون بنجاح" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
