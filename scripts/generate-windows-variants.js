const fs = require("fs");
const path = require("path");
const JavaScriptObfuscator = require("javascript-obfuscator");

const VARIANT_COUNT = 50;

const MASCOT_TOUR_PATH = path.join(__dirname, "..", "web-source", "mascot-tour-windows.js");
// IMPORTANT: Windows keeps the same Yuki/Kira event dialogues; only the tour layout is desktop-specific.
const MASCOT_EVENTS_PATH = path.join(__dirname, "..", "web-source", "mascot-events.js");

const LANGUAGES = [
  {
    code: "ar",
    srcHtml: path.join(__dirname, "..", "web-source", "kdp-tool-windows-ar.html"),
    outDir: path.join(__dirname, "..", "functions", "tool-variants-windows-ar"),
  },
  {
    code: "en",
    srcHtml: path.join(__dirname, "..", "web-source", "kdp-tool-windows-en.html"),
    outDir: path.join(__dirname, "..", "functions", "tool-variants-windows-en"),
  },
];

function readRequired(filePath, label) {
  if (!fs.existsSync(filePath)) {
    console.error(`Missing ${label}: ${filePath}`);
    process.exit(1);
  }
  return fs.readFileSync(filePath, "utf-8");
}

function generateVariantsForLanguage(lang) {
  console.log(`\n=== Windows variants: ${lang.code} ===`);
  const html = readRequired(lang.srcHtml, `Windows ${lang.code} source`);
  const tourScript = readRequired(MASCOT_TOUR_PATH, "Windows mascot tour");
  const eventsScript = readRequired(MASCOT_EVENTS_PATH, "shared mascot events");

  const scriptMatches = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  const scriptMatch = scriptMatches[scriptMatches.length - 1];
  if (!scriptMatch) {
    console.error(`No final plain <script> block found in ${lang.srcHtml}`);
    process.exit(1);
  }

  let originalScript = scriptMatch[1];
  originalScript += "\n\n// --- WINDOWS MASCOT TOUR INJECTION ---\n" + tourScript;
  originalScript += "\n\n// --- SHARED MASCOT EVENTS INJECTION ---\n" + eventsScript;

  fs.mkdirSync(lang.outDir, { recursive: true });

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

    const finalHtml = html.replace(
      scriptMatch[0],
      () => `<script>${obfuscated}</script>`
    );
    fs.writeFileSync(path.join(lang.outDir, `variant-${i}.html`), finalHtml, "utf-8");
  }

  console.log(`Generated ${VARIANT_COUNT} Windows ${lang.code} variants in ${lang.outDir}`);
}

for (const lang of LANGUAGES) generateVariantsForLanguage(lang);
console.log(`\nWindows generation complete: ${VARIANT_COUNT * LANGUAGES.length} variants.`);
