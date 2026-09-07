// يُشغَّل تلقائيًا داخل GitHub Actions فقط
// يحتاج تثبيت javascript-obfuscator عبر npm أولًا

const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

const SRC_HTML = process.env.KDP_SOURCE_HTML || 'login.html';

const srcPath = path.join(
  __dirname,
  '..',
  'web-source',
  SRC_HTML
);

const bridgePath = path.join(
  __dirname,
  'android-bridge.js'
);

const couponAuthPath = path.join(
  __dirname,
  'coupon-auth.js'
);

const outPath = path.join(
  __dirname,
  '..',
  'app',
  'src',
  'main',
  'assets',
  'index.html'
);

// =========================================================
// التحقق من الملفات المطلوبة
// =========================================================

if (!fs.existsSync(srcPath)) {
  console.error('لم أجد ملف المصدر:', srcPath);
  process.exit(1);
}

if (!fs.existsSync(bridgePath)) {
  console.error('لم أجد android-bridge.js:', bridgePath);
  process.exit(1);
}

if (!fs.existsSync(couponAuthPath)) {
  console.error('لم أجد coupon-auth.js:', couponAuthPath);
  process.exit(1);
}

// =========================================================
// قراءة HTML الأصلي
// =========================================================

let html = fs.readFileSync(
  srcPath,
  'utf-8'
);

// =========================================================
// تشويه جميع كتل JavaScript الداخلية
// =========================================================

let blockIndex = 0;

html = html.replace(
  /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g,
  (match, attrs, code) => {

    if (!code.trim()) {
      return match;
    }

    blockIndex++;

    console.log(
      `تشويه كتلة سكربت رقم ${blockIndex} ` +
      `(طول: ${code.length} حرفًا)...`
    );

    const result =
      JavaScriptObfuscator.obfuscate(
        code,
        {
          compact: true,

          controlFlowFlattening: true,
          controlFlowFlatteningThreshold: 0.5,

          deadCodeInjection: true,
          deadCodeInjectionThreshold: 0.2,

          stringArray: true,
          stringArrayEncoding: ['base64'],
          stringArrayThreshold: 0.75,

          identifierNamesGenerator: 'hexadecimal',

          // لا تعِد تسمية المتغيرات العامة
          // حتى لا تنكسر واجهات مثل window.KDP_*
          renameGlobals: false,

          selfDefending: true,

          disableConsoleOutput: false,

          target: 'browser'
        }
      );

    return (
      `<script${attrs}>` +
      result.getObfuscatedCode() +
      `</script>`
    );
  }
);

if (blockIndex === 0) {
  console.warn(
    'تحذير: لم يُعثر على أي كتلة سكربت داخلية لتشويهها!'
  );
}

// =========================================================
// قراءة ملفات الحقن
// =========================================================

const bridgeCode = fs.readFileSync(
  bridgePath,
  'utf-8'
);

const couponAuthCode = fs.readFileSync(
  couponAuthPath,
  'utf-8'
);

// =========================================================
// نسخ android-bridge.js إلى Android assets
//
// مهم:
// MainActivity.kt يعيد قراءة هذا الملف وحقنه بعد
// انتقال login.html إلى أداة KDP.
//
// لذلك يجب أن يكون الملف موجودًا هنا:
// app/src/main/assets/android-bridge.js
// =========================================================

const assetsDir = path.join(
  __dirname,
  '..',
  'app',
  'src',
  'main',
  'assets'
);

fs.mkdirSync(
  assetsDir,
  {
    recursive: true
  }
);

const bridgeAssetPath = path.join(
  assetsDir,
  'android-bridge.js'
);

fs.writeFileSync(
  bridgeAssetPath,
  bridgeCode,
  'utf-8'
);

console.log(
  'تم نسخ android-bridge.js إلى Android assets:',
  bridgeAssetPath
);

// =========================================================
// حقن coupon-auth.js ثم android-bridge.js
//
// كلاهما يُترك بدون obfuscation.
// =========================================================

const injection =
  `<script>\n` +
  `${couponAuthCode}\n` +
  `</script>\n` +
  `<script>\n` +
  `${bridgeCode}\n` +
  `</script>`;

if (html.includes('</body>')) {

  html = html.replace(
    '</body>',
    `${injection}\n</body>`
  );

} else {

  console.warn(
    'تحذير: لم يتم العثور على </body>، ' +
    'سيتم إلحاق ملفات الحقن في نهاية HTML.'
  );

  html += `\n${injection}\n`;
}

// =========================================================
// إنشاء مجلد assets إذا لم يكن موجودًا
// =========================================================

fs.mkdirSync(
  path.dirname(outPath),
  {
    recursive: true
  }
);

// =========================================================
// كتابة index.html النهائي
// =========================================================

fs.writeFileSync(
  outPath,
  html,
  'utf-8'
);

console.log(
  'تم إنشاء index.html المشوَّه بنجاح في:',
  outPath
);

console.log(
  'تم تجهيز Android download bridge بنجاح.'
);
