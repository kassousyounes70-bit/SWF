const fs = require("fs");
const path = require("path");
const JavaScriptObfuscator = require("javascript-obfuscator");

const VARIANT_COUNT = 50;
const TOUR_PATH = path.join(__dirname, "..", "web-source", "mascot-tour-windows.js");
const EVENTS_PATH = path.join(__dirname, "..", "web-source", "mascot-events.js");
const HELP_PATH = path.join(__dirname, "..", "web-source", "mascot-help-windows.js");

const LANGUAGES = [
  { code: "ar", srcHtml: path.join(__dirname, "..", "web-source", "kdp-tool-windows-ar.html"), outDir: path.join(__dirname, "..", "functions", "tool-variants-windows-ar") },
  { code: "en", srcHtml: path.join(__dirname, "..", "web-source", "kdp-tool-windows-en.html"), outDir: path.join(__dirname, "..", "functions", "tool-variants-windows-en") },
];

function readIfExists(filePath, label) {
  if (!fs.existsSync(filePath)) throw new Error(`${label} غير موجود: ${filePath}`);
  return fs.readFileSync(filePath, "utf-8");
}

function generate(lang) {
  console.log(`\n=== Windows ${lang.code}: توليد ${VARIANT_COUNT} نسخة ===`);
  const html = readIfExists(lang.srcHtml, `مصدر HTML (${lang.code})`);
  const matches = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  if (!matches.length) throw new Error(`لم يتم العثور على كتلة script داخل ${lang.srcHtml}`);
  const match = matches[matches.length - 1];
  let originalScript = match[1];

  originalScript += "\n\n// --- WINDOWS MASCOT TOUR ---\n" + readIfExists(TOUR_PATH, "mascot-tour-windows.js");
  originalScript += "\n\n// --- SHARED MASCOT EVENTS ---\n" + readIfExists(EVENTS_PATH, "mascot-events.js");
  originalScript += "\n\n// --- WINDOWS MASCOT HELP ---\n" + readIfExists(HELP_PATH, "mascot-help-windows.js");

  fs.mkdirSync(lang.outDir, { recursive: true });
  for (let i = 1; i <= VARIANT_COUNT; i++) {
    const result = JavaScriptObfuscator.obfuscate(originalScript, {
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

    const finalHtml = html.replace(match[0], `<script>\n${result}\n</script>`);
    fs.writeFileSync(path.join(lang.outDir, `variant-${i}.html`), finalHtml, "utf-8");
    if (i === 1 || i === VARIANT_COUNT) console.log(`  ${lang.code} variant-${i}.html`);
  }
}

for (const lang of LANGUAGES) generate(lang);
console.log("\nتم إنشاء 50 نسخة Windows عربية + 50 نسخة Windows إنجليزية.");
