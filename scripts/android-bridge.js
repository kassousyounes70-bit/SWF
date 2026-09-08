// ⚠️ نسخة تشخيصية v3 — نفس منطق الإصلاح النهائي (KDP_saveBlob) + سجلّ مرئي كامل
(function () {
  var dbg = document.createElement('div');
  dbg.id = 'kdpBridgeDebug';
  dbg.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:999999;' +
    'background:#000;color:#0f0;font-size:10px;font-family:monospace;padding:6px;' +
    'max-height:160px;overflow:auto;direction:ltr;text-align:left;white-space:pre-wrap;';
  function mount() {
    if (document.body) document.body.appendChild(dbg);
    else document.addEventListener('DOMContentLoaded', function () { document.body.appendChild(dbg); });
  }
  mount();
  function log(msg) { dbg.textContent += msg + '\n'; dbg.scrollTop = dbg.scrollHeight; }

  log('🔎 v3 مُفعَّل — فحص وجود AndroidBridge أولًا...');

  if (typeof AndroidBridge === 'undefined') {
    log('❌❌❌ AndroidBridge غير معرَّف إطلاقًا في هذا السياق! (typeof = undefined)');
    log('   هذا يعني أن addJavascriptInterface لم يُربَط بهذا الـWebView تحديدًا،');
    log('   أو أن هذا السكربت يعمل في سياق مختلف (مثل تبويب/نافذة أخرى).');
    return;
  }
  log('✅ AndroidBridge معرَّف. النوع: ' + typeof AndroidBridge);
  log('   هل يحتوي saveBase64؟ ' + (typeof AndroidBridge.saveBase64));

  function blobToBase64AndSave(blob, filename) {
    log('📦 blobToBase64AndSave استُدعيت — الملف: ' + filename + '، الحجم: ' + blob.size);
    var reader = new FileReader();
    reader.onload = function () {
      var mime = blob.type || 'application/octet-stream';
      log('📤 قراءة FileReader اكتملت، جاري استدعاء saveBase64 (mime=' + mime + ')...');
      try {
        AndroidBridge.saveBase64(reader.result, filename, mime);
        log('✅ استُدعي saveBase64 بدون استثناء JS — راقب الآن مجلد Downloads');
      } catch (bridgeErr) {
        log('❌ استثناء عند استدعاء الجسر: ' + bridgeErr.message);
      }
    };
    reader.onerror = function () { log('❌ فشل FileReader'); };
    reader.readAsDataURL(blob);
  }

  window.KDP_saveBlob = function (blob, filename) {
    log('🟢 window.KDP_saveBlob استُدعيت من كود الأداة — الملف: ' + filename);
    blobToBase64AndSave(blob, filename);
  };
  log('✅ تم تعريف window.KDP_saveBlob بنجاح: ' + (typeof window.KDP_saveBlob));

  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[download]') : null;
    if (!a || !a.href) return;
    var href = a.href;
    log('🔘 نقر a[download]: ' + href.substring(0, 25));
    if (href.indexOf('blob:') !== 0 && href.indexOf('data:') !== 0) { log('⏭️ تجاهل (ليس blob/data)'); return; }
    e.preventDefault();
    e.stopPropagation();
    var filename = a.getAttribute('download') || 'ملف-محفوظ';
    fetch(href).then(function (r) { return r.blob(); })
      .then(function (blob) { blobToBase64AndSave(blob, filename); })
      .catch(function (err) { log('❌ فشل fetch: ' + err.message); });
  }, true);

  log('⏳ بانتظار نقرك على زر تحميل PDF الآن...');
})();
