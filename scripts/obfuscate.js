// يُشغَّل تلقائيًا داخل GitHub Actions فقط (يحتاج تثبيت javascript-obfuscator عبر npm أولًا)
const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

const SRC_HTML = process.env.KDP_SOURCE_HTML || 'login.html';
const srcPath = path.join(__dirname, '..', 'web-source', SRC_HTML);
const bridgePath = path.join(__dirname, 'android-bridge.js');
const outPath = path.join(__dirname, '..', 'app', 'src', 'main', 'assets', 'index.html');

if (!fs.existsSync(srcPath)) {
  console.error('لم أجد ملف المصدر:', srcPath);
  process.exit(1);
}

let html = fs.readFileSync(srcPath, 'utf-8');

let blockIndex = 0;
html = html.replace(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g, (match, attrs, code) => {
  if (!code.trim()) return match; // كتلة فارغة أو خارجية (src=...) تُترك كما هي
  blockIndex++;
  console.log(`تشويه كتلة سكربت رقم ${blockIndex} (طول: ${code.length} حرفًا)...`);
  const result = JavaScriptObfuscator.obfuscate(code, {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.5,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.2,
    stringArray: true,
    stringArrayEncoding: ['base64'],
    stringArrayThreshold: 0.75,
    identifierNamesGenerator: 'hexadecimal',
    // مهم جدًا: لا نُعيد تسمية المتغيرات/الخصائص العامة (window.KDP_*) حتى لا نكسر أي شيء
    renameGlobals: false,
    selfDefending: true,
    disableConsoleOutput: false,
    target: 'browser'
  });
  return `<script${attrs}>${result.getObfuscatedCode()}</script>`;
});

if (blockIndex === 0) {
  console.warn('تحذير: لم يُعثر على أي كتلة سكربت داخلية لتشويهها!');
}

// ✅ قراءة كلا الملفين
const bridgeCode = fs.readFileSync(bridgePath, 'utf-8');
const couponAuthPath = path.join(__dirname, 'coupon-auth.js');
const couponAuthCode = fs.readFileSync(couponAuthPath, 'utf-8');

// ✅ حقن كلا الملفين (coupon-auth.js أولاً ثم android-bridge.js)
html = html.replace('</body>', `<script>\n${couponAuthCode}\n</script>\n<script>\n${bridgeCode}\n</script>\n</body>`);

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, html, 'utf-8');
console.log('تم إنشاء index.html المشوَّه بنجاح في:', outPath);
