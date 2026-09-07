const fs = require("fs");
const path = require("path");
const JavaScriptObfuscator = require("javascript-obfuscator");

const VARIANT_COUNT = 50;

// ✅ مسارات ملفات المرشد البكسلي والجهاز العصبي (يُفترض وضعهما في مجلد web-source)
const MASCOT_TOUR_PATH = path.join(__dirname, "..", "web-source", "mascot-tour.js");
const MASCOT_EVENTS_PATH = path.join(__dirname, "..", "web-source", "mascot-events.js");

// ✅ جسر تنزيل الملفات لأندرويد — يجب دمجه هنا لأن الأداة تُحقن عبر document.write
// الذي يمحو أي مستمعي أحداث كانت مسجَّلة سابقًا على شاشة تسجيل الدخول (login.html)
const ANDROID_BRIDGE_PATH = path.join(__dirname, "..", "scripts", "android-bridge.js");

// ✅ مصدران منفصلان: عربي وإنجليزي، كل منهما يُخرج 50 نسخة في مجلده الخاص
const LANGUAGES = [
  {
    code: "ar",
    srcHtml: path.join(__dirname, "..", "web-source", "kdp-tool-v2-25-ar-final.html"),
    outDir: path.join(__dirname, "..", "functions", "tool-variants-ar"),
  },
  {
    code: "en",
    srcHtml: path.join(__dirname, "..", "web-source", "kdp-tool-en-final.html"),
    outDir: path.join(__dirname, "..", "functions", "tool-variants-en"),
  },
];

function generateVariantsForLanguage(lang) {
  console.log(`\n=== توليد نسخ اللغة: ${lang.code} ===`);

  const html = fs.readFileSync(lang.srcHtml, "utf-8");

  const scriptMatches = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  const scriptMatch = scriptMatches[scriptMatches.length - 1];

  if (!scriptMatch) {
    console.error(`لم يتم العثور على وسم <script> داخل ملف ${lang.code}`);
    process.exit(1);
  }
  
  let originalScript = scriptMatch[1];

  // ✅ قراءة ودمج ملف المرشد البكسلي (الجولة والفيزياء)
  if (fs.existsSync(MASCOT_TOUR_PATH)) {
    console.log(`  تم العثور على mascot-tour.js، جاري الدمج في الذاكرة...`);
    const mascotScript = fs.readFileSync(MASCOT_TOUR_PATH, "utf-8");
    originalScript = originalScript + "\n\n// --- MASCOT TOUR INJECTION ---\n" + mascotScript;
  } else {
    console.warn(`  ⚠️ تحذير: ملف mascot-tour.js غير موجود في المسار (${MASCOT_TOUR_PATH}).`);
  }

  // ✅ قراءة ودمج ملف ردود الأفعال والحوارات (الجهاز العصبي)
  if (fs.existsSync(MASCOT_EVENTS_PATH)) {
    console.log(`  تم العثور على mascot-events.js، جاري الدمج في الذاكرة...`);
    const eventsScript = fs.readFileSync(MASCOT_EVENTS_PATH, "utf-8");
    originalScript = originalScript + "\n\n// --- MASCOT EVENTS INJECTION ---\n" + eventsScript;
  } else {
    console.warn(`  ⚠️ تحذير: ملف mascot-events.js غير موجود في المسار (${MASCOT_EVENTS_PATH}).`);
  }

  // ✅ قراءة ودمج جسر تنزيل الملفات لأندرويد (PDF/ZIP/MP4/.kdp)
  if (fs.existsSync(ANDROID_BRIDGE_PATH)) {
    console.log(`  تم العثور على android-bridge.js، جاري الدمج في الذاكرة...`);
    const bridgeScript = fs.readFileSync(ANDROID_BRIDGE_PATH, "utf-8");
    originalScript = originalScript + "\n\n// --- ANDROID DOWNLOAD BRIDGE INJECTION ---\n" + bridgeScript;
  } else {
    console.warn(`  ⚠️ تحذير: ملف android-bridge.js غير موجود في المسار (${ANDROID_BRIDGE_PATH}).`);
  }

  if (!fs.existsSync(lang.outDir)) fs.mkdirSync(lang.outDir, { recursive: true });

  for (let i = 1; i <= VARIANT_COUNT; i++) {
    const obfuscated = JavaScriptObfuscator.obfuscate(originalScript, {
      compact: true,
      controlFlowFlattening: false,
      deadCodeInjection: false,
      stringArray: true,
      stringArrayEncoding: ["base64"],
      stringArrayThreshold: 0.75,
      identifierNamesGenerator: "hexadecimal",
      renameGlobals: false,
      selfDefending: false,
      disableConsoleOutput: true,
    }).getObfuscatedCode();

    // ✅ دالة بدل نص في .replace() لتفادي تفسير أنماط $ الخاصة
    const finalHtml = html.replace(scriptMatch[0], () => `<script>${obfuscated}</script>`);
    fs.writeFileSync(path.join(lang.outDir, `variant-${i}.html`), finalHtml, "utf-8");
    console.log(`  تم إنشاء variant-${i}.html (${lang.code})`);
  }

  console.log(`اكتمل توليد ${VARIANT_COUNT} نسخة ${lang.code} في ${lang.outDir}`);
}

for (const lang of LANGUAGES) {
  generateVariantsForLanguage(lang);
}

console.log(`\n✅ اكتمل توليد ${VARIANT_COUNT * LANGUAGES.length} نسخة إجمالًا (${VARIANT_COUNT} عربي + ${VARIANT_COUNT} إنجليزي)`);
