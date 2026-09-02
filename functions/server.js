const express = require("express");
const admin = require("firebase-admin");

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://yk-pubengine-default-rtdb.firebaseio.com",
});

const db = admin.database();
const app = express();

// ✅ إضافة دعم CORS لطلبات من مصدر file://
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.use(express.json());

const WEB_API_KEY = process.env.FIREBASE_WEB_API_KEY;

// إنشاء حساب جديد وربطه بالكوبون لأول مرة
app.post("/createAccount", async (req, res) => {
  const { couponCode, deviceId, email, password } = req.body;
  if (!couponCode || !deviceId || !email || !password) {
    return res.status(400).json({ error: "بيانات ناقصة" });
  }

  const ref = db.ref(`coupons/${couponCode}`);
  const snapshot = await ref.get();

  if (!snapshot.exists()) {
    return res.status(404).json({ error: "الكوبون غير صحيح" });
  }
  if (snapshot.val().used === true) {
    return res.status(403).json({ error: "هذا الكوبون مستخدم بالفعل" });
  }

  try {
    const userRecord = await admin.auth().createUser({ email, password });

    await ref.update({
      used: true,
      boundUid: userRecord.uid,
      boundDeviceId: deviceId,
      boundEmail: email,
      activatedAt: admin.database.ServerValue.TIMESTAMP,
    });

    return res.json({ success: true, message: "تم إنشاء الحساب وتفعيل الكوبون بنجاح" });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// تسجيل دخول لاحق (بعد إنشاء الحساب أول مرة)
app.post("/login", async (req, res) => {
  const { couponCode, deviceId, email, password } = req.body;
  if (!couponCode || !deviceId || !email || !password) {
    return res.status(400).json({ error: "بيانات ناقصة" });
  }

  try {
    const authRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${WEB_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    );
    const authData = await authRes.json();

    if (!authRes.ok) {
      return res.status(401).json({ error: "بريد إلكتروني أو كلمة مرور غير صحيحة" });
    }

    const ref = db.ref(`coupons/${couponCode}`);
    const snapshot = await ref.get();
    if (!snapshot.exists()) {
      return res.status(404).json({ error: "الكوبون غير صحيح" });
    }

    const coupon = snapshot.val();
    if (coupon.boundUid !== authData.localId || coupon.boundDeviceId !== deviceId) {
      return res.status(403).json({ error: "هذا الكوبون غير مرتبط بهذا الحساب أو الجهاز" });
    }

    return res.json({ success: true, message: "تسجيل دخول ناجح" });
  } catch (err) {
    return res.status(500).json({ error: "تعذّر تسجيل الدخول" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
