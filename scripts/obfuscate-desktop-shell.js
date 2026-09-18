// obfuscate-desktop-shell.js
// يُشغَّل تلقائيًا داخل GitHub Actions فقط، قبل خطوة "tauri build" مباشرة.
// يحتاج تثبيت javascript-obfuscator عبر npm أولًا (كما في obfuscate.js
// الخاص بأندرويد).
//
// لماذا هذا السكربت موجود:
// login-desktop.html كان يُحمِّل desktop-auth.js وsecurity-guard.js عبر
// وسمي <script src=...> منفصلين وواضحين تمامًا. حذف سطر واحد من هذين
// الوسمين يُلغي كل فحوصات الدخول (الإصدار وبيئة التشغيل) دون أي حاجة لفهم
// جافاسكريبت إطلاقًا. هذا السكربت يدمج الملفات الثلاثة في كتلة واحدة
// مموَّهة، بنفس مبدأ ما يفعله scripts/obfuscate.js لنسخة أندرويد.
//
// web-source/*.html و *.js تبقى المصدر المقروء الذي نُعدِّله دائمًا.
// desktop-shell/login-desktop.html هو الناتج النهائي فقط، يُعاد توليده في
// كل بناء ولا يُعدَّل يدويًا أبدًا بعد هذه الخطوة.

const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

const webSourceDir = path.join(__dirname, '..', 'web-source');
const shellDir = path.join(__dirname, '..', 'desktop-shell');

const htmlPath = path.join(webSourceDir, 'login-desktop.html');
const authPath = path.join(webSourceDir, 'desktop-auth.js');
const guardPath = path.join(webSourceDir, 'security-guard.js');
const outPath = path.join(shellDir, 'login-desktop.html');

for (const p of [htmlPath, authPath, guardPath]) {
  if (!fs.existsSync(p)) {
    console.error('لم أجد الملف المطلوب:', p);
    process.exit(1);
  }
}

let html = fs.readFileSync(htmlPath, 'utf-8');
const authCode = fs.readFileSync(authPath, 'utf-8');
const guardCode = fs.readFileSync(guardPath, 'utf-8');

// إزالة وسمي <script src="..."> الخاصين بالملفين — لن يعودا موجودين
// كملفين منفصلين في الناتج النهائي إطلاقًا.
const beforeLength = html.length;
html = html.replace(/<script src="desktop-auth\.js"><\/script>\s*/, '');
html = html.replace(/<script src="security-guard\.js"><\/script>\s*/, '');
if (html.length === beforeLength) {
  console.warn('تحذير: لم يُعثر على وسمَي <script src> المتوقَّعين — تحقق يدويًا من login-desktop.html.');
}

// استخراج الكتلة المضمَّنة الوحيدة (منطق الدخول نفسه) بدون لمس أي وسم فيه src=
const inlineScriptRegex = /<script>([\s\S]*?)<\/script>/;
const inlineMatch = html.match(inlineScriptRegex);
if (!inlineMatch) {
  console.error('لم أجد كتلة <script> المضمَّنة الرئيسية داخل login-desktop.html.');
  process.exit(1);
}
const inlineCode = inlineMatch[1];

// الدمج بترتيب التنفيذ المنطقي: desktop-auth أولًا (يعرّف window.createAccount
// وwindow.desktopSecureRequest وغيرها)، ثم security-guard (يستخدمها فور
// التحميل)، ثم منطق الصفحة نفسه أخيرًا.
const combined = `${authCode}\n${guardCode}\n${inlineCode}`;

console.log(`تمويه الكتلة المدموجة (الطول: ${combined.length} حرفًا)...`);

const result = JavaScriptObfuscator.obfuscate(combined, {
  compact: true,

  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.5,

  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.2,

  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.75,

  identifierNamesGenerator: 'hexadecimal',

  // لا تُعِد تسمية المتغيرات العامة — window.createAccount, window.loginAccount,
  // window.resetPasswordDesktop, window.getDesktopTool, window.desktopSecureRequest,
  // window.KDP_sessionAlive وغيرها يجب أن تبقى بأسمائها كما هي.
  renameGlobals: false,

  selfDefending: true,

  disableConsoleOutput: false,

  target: 'browser'
});

html = html.replace(inlineScriptRegex, `<script>${result.getObfuscatedCode()}</script>`);

fs.mkdirSync(shellDir, { recursive: true });
fs.writeFileSync(outPath, html, 'utf-8');
console.log('تم إنشاء login-desktop.html المموَّه والمدموج بنجاح في:', outPath);

// إزالة أي نسخة قديمة منفصلة من الملفين من مجلد desktop-shell — لم يعودا
// مُستخدَمين هناك إطلاقًا بعد الدمج أعلاه، ووجودهما هناك كنص مقروء بلا داعٍ
// كان جزءًا من الثغرة الأصلية.
for (const leftover of ['desktop-auth.js', 'security-guard.js']) {
  const leftoverPath = path.join(shellDir, leftover);
  if (fs.existsSync(leftoverPath)) {
    fs.unlinkSync(leftoverPath);
    console.log('تم حذف النسخة المنفصلة غير المستخدَمة:', leftoverPath);
  }
}
