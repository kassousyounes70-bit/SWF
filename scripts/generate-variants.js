const fs = require("fs");
const path = require("path");

const SRC_HTML = path.join(__dirname, "..", "web-source", "kdp-tool-v2-25.html");
const OUT_DIR = path.join(__dirname, "..", "functions", "tool-variants");

const html = fs.readFileSync(SRC_HTML, "utf-8");

const scriptMatches = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
const scriptMatch = scriptMatches[scriptMatches.length - 1];

if (!scriptMatch) {
  console.error("لم يتم العثور على وسم <script> داخل الملف");
  process.exit(1);
}
const originalScript = scriptMatch[1];

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// === اختبار تشخيصي فقط: بدون أي تمويه، نعيد حقن نفس الكود الأصلي حرفيًا ===
const finalHtml = html.replace(scriptMatch[0], `<script>${originalScript}</script>`);
fs.writeFileSync(path.join(OUT_DIR, "variant-nooptest.html"), finalHtml, "utf-8");
console.log("تم إنشاء variant-nooptest.html (بدون تمويه — اختبار تشخيصي فقط)");
