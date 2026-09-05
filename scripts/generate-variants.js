const fs = require("fs");
const path = require("path");
const JavaScriptObfuscator = require("javascript-obfuscator");

const VARIANT_COUNT = 50;

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
  const originalScript = scriptMatch[1];

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
