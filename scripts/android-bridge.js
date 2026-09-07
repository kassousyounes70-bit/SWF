// ⚠️ نسخة تشخيصية مؤقتة — احذفها واستبدلها بالنسخة الأصلية بعد انتهاء التشخيص
(function () {
  if (typeof AndroidBridge === 'undefined') return;

  // صندوق تشخيص ظاهر على الشاشة (يتجاوز console المعطَّل بواسطة التمويه)
  var dbg = document.createElement('div');
  dbg.id = 'kdpBridgeDebug';
  dbg.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:999999;' +
    'background:#000;color:#0f0;font-size:11px;font-family:monospace;padding:6px;' +
    'max-height:130px;overflow:auto;direction:ltr;text-align:left;white-space:pre-wrap;';
  function mount() {
    if (document.body) document.body.appendChild(dbg);
    else document.addEventListener('DOMContentLoaded', function () { document.body.appendChild(dbg); });
  }
  mount();

  function log(msg) {
    dbg.textContent += msg + '\n';
    dbg.scrollTop = dbg.scrollHeight;
  }

  log('✅ جسر أندرويد (نسخة تشخيصية) مُفعَّل — بانتظار نقر على زر تحميل...');

  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[download]') : null;
    if (!a || !a.href) return;

    var href = a.href;
    log('🔘 رُصد نقر a[download] — href يبدأ بـ: ' + href.substring(0, 25));

    if (href.indexOf('blob:') !== 0 && href.indexOf('data:') !== 0) {
      log('⏭️ href ليس blob:/data: — تم تجاهله بواسطة الجسر (سيتصرف WebView افتراضيًا)');
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    var filename = a.getAttribute('download') || 'ملف-محفوظ';
    log('⏳ جاري جلب الملف (fetch) لتحويله إلى base64...');

    fetch(href)
      .then(function (r) { return r.blob(); })
      .then(function (blob) {
        log('✅ نجح fetch — الحجم: ' + blob.size + ' بايت، النوع: ' + (blob.type || 'غير معروف'));
        var reader = new FileReader();
        reader.onload = function () {
          var base64 = reader.result;
          var mime = blob.type || 'application/octet-stream';
          log('📤 استدعاء AndroidBridge.saveBase64("' + filename + '", ' + mime + ')...');
          try {
            AndroidBridge.saveBase64(base64, filename, mime);
            log('✅ تم استدعاء saveBase64 بدون أي استثناء من جهة JS');
            log('   (إذا لم يظهر الملف في مجلد Downloads الآن، فالمشكلة 100% داخل saveBase64 في MainActivity.kt)');
          } catch (bridgeErr) {
            log('❌ استثناء عند استدعاء الجسر من JS: ' + bridgeErr.message);
          }
        };
        reader.onerror = function () {
          log('❌ فشل FileReader.readAsDataURL');
        };
        reader.readAsDataURL(blob);
      })
      .catch(function (err) {
        log('❌ فشل fetch/blob: ' + err.message);
      });
  }, true);
})();
