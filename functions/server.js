const express = require("express");
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://yk-pubengine-default-rtdb.firebaseio.com",
});

const db = admin.database();
const app = express();

// ✅ دعم CORS لطلبات من مصدر file://
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
    return res.status(403).json({ error: "هذا الكوبون مستخدم بالفعل", errorCode: "COUPON_USED" });
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
    console.error("خطأ إنشاء الحساب من Firebase:", err);
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
      console.error("خطأ تسجيل الدخول من جوجل:", JSON.stringify(authData));
      return res.status(401).json({ error: authData.error ? authData.error.message : "فشل غير معروف" });
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

    // ✅ إنشاء تذكرة جديدة عند نجاح تسجيل الدخول
    const ticket = crypto.randomBytes(24).toString("hex");
    await db.ref(`tickets/${ticket}`).set({
      deviceId: deviceId,
      createdAt: admin.database.ServerValue.TIMESTAMP,
      used: false,
    });

    return res.json({ success: true, message: "تسجيل دخول ناجح", ticket: ticket });
  } catch (err) {
    console.error("خطأ في الخادم:", err);
    return res.status(500).json({ error: "تعذّر تسجيل الدخول" });
  }
});

// ✅ نقطة استرجاع الأداة الذكية باستخدام التذكرة (اختيار عشوائي من 50 نسخة، حسب اللغة المطلوبة)
app.post("/getTool", async (req, res) => {
  const { ticket, deviceId, lang } = req.body;
  if (!ticket || !deviceId) {
    return res.status(400).json({ error: "بيانات ناقصة" });
  }

  // ✅ اللغة المطلوبة: عربي افتراضيًا لو لم تُرسَل أو كانت قيمة غير مدعومة
  const requestedLang = (lang === "en") ? "en" : "ar";

  const ref = db.ref(`tickets/${ticket}`);
  const snapshot = await ref.get();

  if (!snapshot.exists()) {
    return res.status(404).json({ error: "تذكرة غير صالحة" });
  }

  const data = snapshot.val();
  const AGE_LIMIT_MS = 5 * 60 * 1000; // 5 دقائق

  if (data.used === true) {
    return res.status(403).json({ error: "هذه التذكرة مستخدمة بالفعل" });
  }
  if (data.deviceId !== deviceId) {
    return res.status(403).json({ error: "هذه التذكرة غير مرتبطة بهذا الجهاز" });
  }
  if (Date.now() - data.createdAt > AGE_LIMIT_MS) {
    await ref.remove();
    return res.status(403).json({ error: "انتهت صلاحية هذه التذكرة" });
  }

  // ✅ استهلاك التذكرة فوراً قبل إرسال الملف
  await ref.update({ used: true });

  try {
    // ✅ اختيار عشوائي من 50 نسخة مشوشة، من مجلد اللغة الصحيحة
    const variantsDir = path.join(__dirname, `tool-variants-${requestedLang}`);
    const files = fs.readdirSync(variantsDir).filter(f => f.endsWith(".html"));
    const randomFile = files[Math.floor(Math.random() * files.length)];
    const toolHtml = fs.readFileSync(
      path.join(variantsDir, randomFile),
      "utf-8"
    );
    return res.json({ success: true, html: toolHtml });
  } catch (err) {
    console.error("خطأ في قراءة ملف الأداة:", err);
    return res.status(500).json({ error: "تعذّر تحميل الأداة" });
  }
});

// ✅ استعادة كلمة المرور عبر Firebase Auth
app.post("/resetPassword", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "البريد الإلكتروني مطلوب" });
  }

  try {
    const resetRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${WEB_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestType: "PASSWORD_RESET", email: email }),
      }
    );
    const resetData = await resetRes.json();

    if (!resetRes.ok) {
      console.error("خطأ استعادة كلمة المرور من جوجل:", JSON.stringify(resetData));
      // لا نكشف إن كان البريد مسجَّلًا أم لا (حماية خصوصية قياسية)
      return res.json({ success: true, message: "إن كان البريد مسجَّلًا، ستصلك رسالة استعادة قريبًا" });
    }

    return res.json({ success: true, message: "تم إرسال رابط استعادة كلمة المرور إلى بريدك" });
  } catch (err) {
    console.error("خطأ في الخادم عند استعادة كلمة المرور:", err);
    return res.status(500).json({ error: "تعذّر إرسال رابط الاستعادة" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
