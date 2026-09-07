const fs = require('fs');
const path = require('path');

let JavaScriptObfuscator;
try {
  JavaScriptObfuscator = require('javascript-obfuscator');
} catch (e) {
  JavaScriptObfuscator = null;
}

const projectRoot = path.join(__dirname, '..');

// المسارات الأساسية للملفات والمجلدات
const arSourcePath = path.join(projectRoot, 'web-source', 'kdp-tool-v2-25-ar-final.html');
const enSourcePath = path.join(projectRoot, 'web-source', 'kdp-tool-en-final.html');

const bridgePath = path.join(projectRoot, 'scripts', 'android-bridge.js');
const mascotTourPath = path.join(projectRoot, 'web-source', 'mascot-tour.js');
const mascotEventsPath = path.join(projectRoot, 'web-source', 'mascot-events.js');

const arOutputDir = path.join(projectRoot, 'functions', 'tool-variants-ar');
const enOutputDir = path.join(projectRoot, 'functions', 'tool-variants-en');

// إنشاء مجلدات المخرجات إن لم تكن موجودة
if (!fs.existsSync(arOutputDir)) {
  fs.mkdirSync(arOutputDir, { recursive: true });
}
if (!fs.existsSync(enOutputDir)) {
  fs.mkdirSync(enOutputDir, { recursive: true });
}

// قراءة السكريبتات المراد حقنها في الأداة الذكية
const bridgeScript = fs.existsSync(bridgePath) ? fs.readFileSync(bridgePath, 'utf8') : '';
const mascotTour = fs.existsSync(mascotTourPath) ? fs.readFileSync(mascotTourPath, 'utf8') : '';
const mascotEvents = fs.existsSync(mascotEventsPath) ? fs.readFileSync(mascotEventsPath, 'utf8') : '';

// تجميع كافة السكريبتات المحقونة
const combinedInjectedJs = `
<script>
${bridgeScript}
${mascotTour}
${mascotEvents}
</script>
`;

function injectScripts(htmlContent) {
  // استخدام دالة السهم () => لتجنب تفسير متتابعات مثل $' في النص
  return htmlContent.replace('</body>', () => combinedInjectedJs + '\n</body>');
}

function generateVariantsForFile(sourcePath, outputDir, languageName) {
  if (!fs.existsSync(sourcePath)) {
    console.error(`❌ لم يتم العثور على الملف المصدر: ${sourcePath}`);
    return;
  }

  const rawHtml = fs.readFileSync(sourcePath, 'utf8');
  const htmlWithScripts = injectScripts(rawHtml);

  console.log(`🔨 جاري توليد 50 نسخة مموَّهة للغة ${languageName}...`);

  for (let i = 1; i <= 50; i++) {
    let processedHtml = htmlWithScripts;

    if (JavaScriptObfuscator) {
      // تمويه السكريبتات المدمجة داخل وسوم <script>
      processedHtml = processedHtml.replace(/<script>([\s\S]*?)<\/script>/gi, (match, jsCode) => {
        if (!jsCode.trim()) return match;
        try {
          const obfuscated = JavaScriptObfuscator.obfuscate(jsCode, {
            compact: true,
            controlFlowFlattening: false,
            deadCodeInjection: false,
            debugProtection: false,
            disableConsoleOutput: false,
            identifierNamesGenerator: 'hexadecimal',
            log: false,
            renameGlobals: false,
            rotateStringArray: true,
            selfDefending: false,
            stringArray: true,
            stringArrayThreshold: 0.75
          }).getObfuscatedCode();
          return `<script>${obfuscated}</script>`;
        } catch (err) {
          return match;
        }
      });
    }

    const fileName = `variant-${i}.html`;
    const outputPath = path.join(outputDir, fileName);
    fs.writeFileSync(outputPath, processedHtml, 'utf8');
  }

  console.log(`✅ تم إنشاء 50 نسخة بنجاح في: ${outputDir}`);
}

// تنفيذ التوليد للنسختين العربية والإنجليزية
generateVariantsForFile(arSourcePath, arOutputDir, 'العربية');
generateVariantsForFile(enSourcePath, enOutputDir, 'الإنكليزية');
