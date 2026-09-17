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
// إنشاء حساب جديد وربطه بالكوبون
app.post("/createAccount", async (req, res) => {
  const { couponCode, deviceId, email, password, platform } = req.body;
  if (!couponCode || !deviceId || !email || !password) return res.status(400).json({ error: "بيانات ناقصة" });

  const requestedPlatform = platform === "windows" ? "windows" : "android";
  const ref = db.ref(`coupons/${couponCode}`);
  const snapshot = await ref.get();
  if (!snapshot.exists()) return res.status(404).json({ error: "الكوبون غير صحيح" });

  const coupon = snapshot.val() || {};
  const couponPlatform = coupon.platform || "android";
  if (!["android","windows","dual"].includes(couponPlatform))
    return res.status(403).json({ error: "نوع الكوبون غير مدعوم" });
  if (couponPlatform !== "dual" && couponPlatform !== requestedPlatform)
    return res.status(403).json({ error: "هذا الكوبون غير مخصص لهذه المنصة" });

  // Android: the existing legacy behavior remains the Android path.
  if (requestedPlatform === "android") {
    if (coupon.used === true)
      return res.status(403).json({ error: "هذا الكوبون مستخدم بالفعل", errorCode: "COUPON_USED" });

    try {
      const userRecord = await admin.auth().createUser({ email, password });
      await ref.update({
        used: true, boundUid: userRecord.uid, boundDeviceId: deviceId,
        boundEmail: email, activatedAt: admin.database.ServerValue.TIMESTAMP
      });
      if (couponPlatform === "dual") {
        await ref.update({
          androidUsed: true, androidDeviceId: deviceId, androidUid: userRecord.uid,
          androidEmail: email, androidActivatedAt: admin.database.ServerValue.TIMESTAMP
        });
      }
      return res.json({ success: true, message: "تم إنشاء الحساب وتفعيل الكوبون بنجاح" });
    } catch (err) {
      console.error("خطأ إنشاء الحساب من Firebase:", err);
      return res.status(400).json({ error: err.message });
    }
  }

  // Windows: independent Windows slot.
  if (coupon.windowsUsed === true)
    return res.status(403).json({ error: "هذا الكوبون مستخدم بالفعل على Windows", errorCode: "WINDOWS_COUPON_USED" });

  try {
    let uid;
    if (couponPlatform === "dual" && coupon.boundUid) {
      const authRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${WEB_API_KEY}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true })
      });
      const authData = await authRes.json();
      if (!authRes.ok || authData.localId !== coupon.boundUid)
        return res.status(403).json({ error: "بيانات الحساب لا تطابق الحساب المرتبط بالكوبون" });
      uid = coupon.boundUid;
    } else {
      const userRecord = await admin.auth().createUser({ email, password });
      uid = userRecord.uid;
    }

    await ref.update({
      windowsUsed: true, windowsDeviceId: deviceId, windowsUid: uid,
      windowsEmail: email, windowsActivatedAt: admin.database.ServerValue.TIMESTAMP
    });
    return res.json({ success: true, message: "تم إنشاء الحساب وتفعيل الكوبون على Windows بنجاح" });
  } catch (err) {
    console.error("خطأ إنشاء حساب Windows من Firebase:", err);
    return res.status(400).json({ error: err.message });
  }
});

// تسجيل دخول لاحق (بعد إنشاء الحساب أول مرة)
// تسجيل دخول لاحق
app.post("/login", async (req, res) => {
  const { couponCode, deviceId, email, password, platform } = req.body;
  if (!couponCode || !deviceId || !email || !password) return res.status(400).json({ error: "بيانات ناقصة" });

  const requestedPlatform = platform === "windows" ? "windows" : "android";

  try {
    const authRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${WEB_API_KEY}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true })
    });
    const authData = await authRes.json();
    if (!authRes.ok) {
      console.error("خطأ تسجيل الدخول من جوجل:", JSON.stringify(authData));
      return res.status(401).json({ error: authData.error ? authData.error.message : "فشل غير معروف" });
    }

    const ref = db.ref(`coupons/${couponCode}`);
    const snapshot = await ref.get();
    if (!snapshot.exists()) return res.status(404).json({ error: "الكوبون غير صحيح" });

    const coupon = snapshot.val() || {};
    const couponPlatform = coupon.platform || "android";
    if (!["android","windows","dual"].includes(couponPlatform))
      return res.status(403).json({ error: "نوع الكوبون غير مدعوم" });
    if (couponPlatform !== "dual" && couponPlatform !== requestedPlatform)
      return res.status(403).json({ error: "هذا الكوبون غير مخصص لهذه المنصة" });

    // Android: same legacy binding check.
    if (requestedPlatform === "android") {
      if (coupon.boundUid !== authData.localId || coupon.boundDeviceId !== deviceId)
        return res.status(403).json({ error: "هذا الكوبون غير مرتبط بهذا الحساب أو الجهاز" });
    }

    // Windows: separate Windows binding check.
    if (requestedPlatform === "windows") {
      const boundUid = coupon.windowsUid || (couponPlatform === "dual" ? coupon.boundUid : "");
      const boundDeviceId = coupon.windowsDeviceId || "";
      if (!boundUid || boundUid !== authData.localId || boundDeviceId !== deviceId)
        return res.status(403).json({ error: "هذا الكوبون غير مرتبط بهذا الحساب أو جهاز Windows" });
    }

    const ticket = crypto.randomBytes(24).toString("hex");
    await db.ref(`tickets/${ticket}`).set({
      deviceId, platform: requestedPlatform, couponCode, uid: authData.localId,
      createdAt: admin.database.ServerValue.TIMESTAMP, used: false
    });
    return res.json({ success: true, message: "تسجيل دخول ناجح", ticket });
  } catch (err) {
    console.error("خطأ في الخادم:", err);
    return res.status(500).json({ error: "تعذّر تسجيل الدخول" });
  }
});

// ✅ نقطة استرجاع الأداة الذكية باستخدام التذكرة (اختيار عشوائي من 50 نسخة، حسب اللغة المطلوبة)
// نقطة استرجاع الأداة الذكية باستخدام التذكرة
app.post("/getTool", async (req, res) => {
  const { ticket, deviceId, lang, platform } = req.body;
  if (!ticket || !deviceId) return res.status(400).json({ error: "بيانات ناقصة" });

  const requestedLang = (lang === "en") ? "en" : "ar";
  const requestedPlatform = platform === "windows" ? "windows" : "android";
  const ref = db.ref(`tickets/${ticket}`);
  const snapshot = await ref.get();
  if (!snapshot.exists()) return res.status(404).json({ error: "تذكرة غير صالحة" });

  const data = snapshot.val();
  const AGE_LIMIT_MS = 5 * 60 * 1000;
  if (data.used === true) return res.status(403).json({ error: "هذه التذكرة مستخدمة بالفعل" });
  if (data.deviceId !== deviceId) return res.status(403).json({ error: "هذه التذكرة غير مرتبطة بهذا الجهاز" });

  // Old Android tickets remain Android-compatible.
  const ticketPlatform = data.platform || "android";
  if (ticketPlatform !== requestedPlatform)
    return res.status(403).json({ error: "هذه التذكرة غير صالحة لهذه المنصة" });

  if (Date.now() - data.createdAt > AGE_LIMIT_MS) {
    await ref.remove();
    return res.status(403).json({ error: "انتهت صلاحية هذه التذكرة" });
  }

  await ref.update({ used: true });

  try {
    // IMPORTANT: Android and Windows must never share the same tool directory.
    // Windows will only receive a Windows-specific variant.
    const variantsDir = requestedPlatform === "windows"
      ? path.join(__dirname, `tool-variants-windows-${requestedLang}`)
      : path.join(__dirname, `tool-variants-${requestedLang}`);

    if (!fs.existsSync(variantsDir)) {
      console.error(`مجلد أداة المنصة غير موجود: ${variantsDir}`);
      return res.status(503).json({ error: "نسخة أداة هذه المنصة غير جاهزة بعد" });
    }

    const files = fs.readdirSync(variantsDir).filter(f => f.endsWith(".html"));
    if (files.length === 0) {
      console.error(`لا توجد نسخ HTML داخل: ${variantsDir}`);
      return res.status(503).json({ error: "نسخة أداة هذه المنصة غير متاحة حالياً" });
    }

    const randomFile = files[Math.floor(Math.random() * files.length)];
    const toolHtml = fs.readFileSync(path.join(variantsDir, randomFile), "utf-8");

    // ✅ سرّ جلسة قصير العمر، يُستخدم لاحقًا من داخل الأداة نفسها لتجديد صلاحية
    // العمل كل بضع دقائق (/verifySession) دون إعادة إرسال كلمة المرور أبدًا.
    const sessionSecret = crypto.randomBytes(24).toString("hex");
    await db.ref(`sessions/${sessionSecret}`).set({
      uid: data.uid, deviceId, platform: requestedPlatform, couponCode: data.couponCode,
      createdAt: admin.database.ServerValue.TIMESTAMP,
    });

    return res.json({
      success: true,
      platform: requestedPlatform,
      lang: requestedLang,
      variant: randomFile,
      html: toolHtml,
      sessionSecret
    });
  } catch (err) {
    console.error("خطأ في قراءة ملف الأداة:", err);
    return res.status(500).json({ error: "تعذّر تحميل الأداة" });
  }
});

// ✅ تجديد صلاحية جلسة العمل — تُستدعى دوريًا من داخل الأداة نفسها (كل ~10
// دقائق) طوال مدة الاستخدام. نسخة مُلتقَطة من الذاكرة بعد تفعيل حقيقي ستستمر
// بالعمل بجودة كاملة فقط حتى انتهاء صلاحية آخر تجديد ناجح (~15 دقيقة)، ثم
// تتحول تلقائيًا لوضع التخريب الصامت لأنها لا تستطيع تجديد الصلاحية بنفسها.
app.post("/verifySession", async (req, res) => {
  const { sessionSecret, deviceId } = req.body;
  if (!sessionSecret || !deviceId) return res.json({ valid: false });

  try {
    const sessSnap = await db.ref(`sessions/${sessionSecret}`).get();
    if (!sessSnap.exists()) return res.json({ valid: false });

    const session = sessSnap.val();
    if (session.deviceId !== deviceId) return res.json({ valid: false });

    // إعادة التحقق الحي من أن الكوبون ما زال مرتبطًا بنفس هذا الجهاز فعليًا —
    // يغطي حالة قيام الإدارة بمسح البصمة يدويًا (نقل ترخيص، أو إبطال كوبون).
    const couponSnap = await db.ref(`coupons/${session.couponCode}`).get();
    const coupon = couponSnap.exists() ? couponSnap.val() : {};
    const currentBoundDevice = session.platform === "windows"
      ? coupon.windowsDeviceId : coupon.boundDeviceId;
    if (currentBoundDevice !== deviceId) return res.json({ valid: false });

    const SESSION_LIFETIME_MS = 15 * 60 * 1000;
    return res.json({ valid: true, expiresAt: Date.now() + SESSION_LIFETIME_MS });
  } catch (err) {
    console.error("خطأ في تجديد جلسة العمل:", err);
    // عطل تقني في هذا الفحص وحده لا يُسقط جلسة عمل نشطة لعميل شرعي.
    return res.json({ valid: true, expiresAt: Date.now() + 5 * 60 * 1000, degraded: true });
  }
});

// ✅ استعادة كلمة المرور عبر Firebase Auth
app.post("/resetPassword", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "البريد الإلكتروني مطلوب" });
  }

  try {
    const link = await admin.auth().generatePasswordResetLink(email);

    const htmlContent = `<div style="margin:0;padding:32px 16px;background:#13131a;font-family:Arial,Helvetica,sans-serif;color:#ece7d8;line-height:1.6;">

  <div style="max-width:600px;margin:0 auto;background:#1e1e27;border:3px solid #08080b;box-shadow:6px 6px 0 #08080b;">

    <div style="height:6px;background:#5ec98f;"></div>

    <div style="padding:28px 24px 20px;text-align:center;">
      <div style="display:inline-block;padding:10px 14px;background:#262631;border:3px solid #08080b;box-shadow:4px 4px 0 #08080b;font-size:22px;font-weight:bold;letter-spacing:2px;color:#5ec98f;">
        YP
      </div>

      <div style="margin-top:20px;font-size:22px;font-weight:bold;color:#ece7d8;">
        Password Reset
      </div>

      <div style="margin-top:8px;font-size:13px;color:#9d97a8;">
        YK PubEngine
      </div>
    </div>

    <div style="padding:0 24px 28px;">

      <div style="border-top:2px solid #08080b;padding-top:24px;">

        <p style="margin:0 0 16px;color:#ece7d8;font-size:15px;">
          Hello,
        </p>

        <p style="margin:0 0 18px;color:#ece7d8;font-size:15px;">
          We received a request to reset the password for your
          <strong style="color:#5ec98f;">${email}</strong>
          account on <strong style="color:#5ec98f;">YK PubEngine</strong>.
        </p>

        <p style="margin:0 0 22px;color:#9d97a8;font-size:14px;">
          If you requested this password reset, use the button below to continue.
        </p>

        <div style="text-align:center;margin:28px 0;">

          <a href="${link}"
             style="display:inline-block;padding:14px 22px;background:#5ec98f;color:#13131a;text-decoration:none;font-size:14px;font-weight:bold;border:3px solid #08080b;box-shadow:4px 4px 0 #08080b;">
            RESET PASSWORD
          </a>

        </div>

        <p style="margin:24px 0 0;padding:16px;background:#262631;border-left:4px solid #ffb454;color:#9d97a8;font-size:13px;">
          If you did not request a password reset, you can safely ignore this email.
          No changes will be made to your account.
        </p>

        <p style="margin:24px 0 0;color:#9d97a8;font-size:12px;word-break:break-word;">
          If the button does not work, you can use the following link:
        </p>

        <p style="margin:8px 0 0;font-size:11px;word-break:break-all;">
          <a href="${link}" style="color:#5ec98f;text-decoration:none;">
            ${link}
          </a>
        </p>

      </div>

      <div style="margin-top:28px;padding-top:18px;border-top:2px solid #08080b;text-align:center;color:#9d97a8;font-size:12px;">
        <strong style="color:#5ec98f;">YK PubEngine</strong><br>
        The YK PubEngine Team
      </div>

    </div>

  </div>

</div>`;

    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.SENDER_EMAIL || "YK PubEngine <onboarding@resend.dev>",
          to: [email],
          subject: "Password Reset — YK PubEngine",
          html: htmlContent,
        }),
      });

      if (!emailRes.ok) {
        const errorData = await emailRes.json();
        console.error("خطأ في إرسال البريد عبر Resend:", JSON.stringify(errorData));
        return res.status(500).json({ error: "تعذّر إرسال البريد الإلكتروني" });
      }
    } else {
      console.warn("تنبيه: لم يتم ضبط RESEND_API_KEY في متغيرات البيئة");
    }

    return res.json({ success: true, message: "تم إرسال رابط استعادة كلمة المرور إلى بريدك" });
  } catch (err) {
    console.error("خطأ في الخادم عند استعادة كلمة المرور:", err);
    if (err.code === "auth/user-not-found") {
      return res.json({ success: true, message: "إن كان البريد مسجَّلًا، ستصلك رسالة استعادة قريبًا" });
    }
    return res.status(500).json({ error: "تعذّر إرسال رابط الاستعادة" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// ✅ الحد الأدنى للإصدار المسموح — يُستخدم قبل أي محاولة دخول على أي منصة.
// يُقرأ من Firebase Realtime Database تحت المسار config/minVersion، مثال:
//   { "windows": "1.1.0", "android": "1.0.3" }
// حدِّث هذه القيمة يدويًا من Firebase Console كلما رفعت إصدارًا يجب إجباره.
app.post("/minVersion", async (req, res) => {
  const requestedPlatform = req.body?.platform === "windows" ? "windows" : "android";
  try {
    const [versionSnap, urlSnap] = await Promise.all([
      db.ref(`config/minVersion/${requestedPlatform}`).get(),
      db.ref(`config/downloadUrl/${requestedPlatform}`).get(),
    ]);
    const minVersion = versionSnap.exists() ? String(versionSnap.val()) : "0.0.0";
    const downloadUrl = urlSnap.exists() ? String(urlSnap.val()) : "";
    return res.json({ success: true, minVersion, downloadUrl, platform: requestedPlatform });
  } catch (err) {
    console.error("خطأ في جلب الحد الأدنى للإصدار:", err);
    // لا نمنع تسجيل الدخول بسبب عطل في هذا الفحص وحده — فقط لا نُصعّد الحد الأدنى.
    return res.json({ success: true, minVersion: "0.0.0", downloadUrl: "", platform: requestedPlatform, degraded: true });
  }
});
