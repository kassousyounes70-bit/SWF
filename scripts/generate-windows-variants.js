const fs=require("fs");
const path=require("path");
const JavaScriptObfuscator=require("javascript-obfuscator");
const VARIANT_COUNT=50;
const ROOT=path.resolve(__dirname,"..");
const sources={ar:path.join(ROOT,"web-source","kdp-tool-windows-ar.html"),en:path.join(ROOT,"web-source","kdp-tool-windows-en.html")};
const outputs={ar:path.join(ROOT,"functions","tool-variants-windows-ar"),en:path.join(ROOT,"functions","tool-variants-windows-en")};
const tour=fs.readFileSync(path.join(ROOT,"web-source","mascot-tour-windows.js"),"utf8");
const events=fs.readFileSync(path.join(ROOT,"web-source","mascot-events.js"),"utf8");
const helpPath=path.join(ROOT,"web-source","mascot-help-windows.js");
const help=fs.existsSync(helpPath)?fs.readFileSync(helpPath,"utf8"):"";
function inlineScripts(html){
 return [...html.matchAll(/<script(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>({full:m[0],body:m[1]}));
}
function mainScript(scripts){
 const candidates=scripts.filter(s=>s.body.length>10000).sort((a,b)=>b.body.length-a.body.length);
 if(!candidates.length) throw new Error("لم يتم العثور على سكربت التطبيق الرئيسي.");
 return candidates[0];
}
function obfuscate(code){
 return JavaScriptObfuscator.obfuscate(code,{compact:true,controlFlowFlattening:false,deadCodeInjection:false,stringArray:true,stringArrayEncoding:["base64"],stringArrayThreshold:0.75,identifierNamesGenerator:"hexadecimal",renameGlobals:false,selfDefending:false,disableConsoleOutput:true}).getObfuscatedCode();
}
for(const lang of ["ar","en"]){
 const html=fs.readFileSync(sources[lang],"utf8");
 const main=mainScript(inlineScripts(html));
 console.log(`${lang}: main inline script = ${main.body.length} chars`);
 const combined=[main.body,"\n/* Windows mascot tour */\n",tour,"\n/* Shared mascot events */\n",events,"\n/* Windows mascot help */\n",help].join("\n");
 const output=html.replace(main.full,main.full.replace(main.body,obfuscate(combined)));
 fs.rmSync(outputs[lang],{recursive:true,force:true}); fs.mkdirSync(outputs[lang],{recursive:true});
 for(let i=1;i<=VARIANT_COUNT;i++) fs.writeFileSync(path.join(outputs[lang],`variant-${i}.html`),output,"utf8");
 console.log(`generated ${VARIANT_COUNT} ${lang} variants`);
}
