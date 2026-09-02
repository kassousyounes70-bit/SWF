const fs = require("fs");
const path = require("path");
const JavaScriptObfuscator = require("javascript-obfuscator");

const SRC_HTML = path.join(__dirname, "..", "web-source", "kdp-tool-v2-25.html");
const OUT_DIR = path.join(__dirname, "..", "functions", "tool-variants");
const VARIANT_COUNT = 50;

const html = fs.readFileSync(SRC_HTML, "utf-8");

// ✅ التصحيح: اختيار آخر وسم <script> (وهو منطق الأداة)
const scriptMatches = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
const scriptMatch = scriptMatches[scriptMatches.length - 1]; // آخر وسم <script> بلا src، وهو منطق الأداة

if (!scriptMatch) {
  console.error("لم يتم العثور على وسم <script> داخل الملف");
  process.exit(1);
}
const originalScript = scriptMatch[1];

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

for (let i = 1; i <= VARIANT_COUNT; i++) {
  const obfuscated = JavaScriptObfuscator.obfuscate(originalScript, {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.75,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.4,
    stringArray: true,
    stringArrayEncoding: ["base64"],
    stringArrayThreshold: 0.75,
    identifierNamesGenerator: "hexadecimal",
    renameGlobals: false,
    selfDefending: true,
    disableConsoleOutput: true,
  }).getObfuscatedCode();

  const finalHtml = html.replace(scriptMatch[0], `<script>${obfuscated}</script>`);
  fs.writeFileSync(path.join(OUT_DIR, `variant-${i}.html`), finalHtml, "utf-8");
  console.log(`تم إنشاء variant-${i}.html`);
}

console.log(`اكتمل توليد ${VARIANT_COUNT} نسخة في ${OUT_DIR}`);
