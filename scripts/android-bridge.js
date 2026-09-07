(function () {
  if (typeof AndroidBridge === 'undefined') return;

  // 1. إنشاء صندوق تشخيصي ظاهر على الشاشة لرصد عمليات التصدير والتحميل
  var dbg = document.createElement('div');
  dbg.id = 'kdpBridgeDebug';
  dbg.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:999999;' +
    'background:#000;color:#0f0;font-size:11px;font-family:monospace;padding:6px;' +
    'max-height:130px;overflow:auto;direction:ltr;text-align:left;white-space:pre-wrap;';

  function mount() {
    if (document.body) {
      document.body.appendChild(dbg);
    } else {
      document.addEventListener('DOMContentLoaded', function () {
        document.body.appendChild(dbg);
      });
    }
  }
  mount();

  function log(msg) {
    if (dbg) {
      dbg.textContent += msg + '\n';
      dbg.scrollTop = dbg.scrollHeight;
    }
  }

  log('✅ جسر أندرويد (النسخة التشخيصية الكاملة) مُفعَّل — بانتظار طلبات التصدير...');

  // 2. دالة جلب البيانات من رابط Blob/Data وتحويلها لـ Base64 ثم تمريرها إلى Kotlin
  function handleDownload(href, filename) {
    log('⏳ جاري جلب الملف (fetch) لتحويله إلى Base64: ' + filename);

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
            log('✅ تم نقل البيانات بنجاح إلى AndroidBridge في MainActivity.kt');
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
  }

  // 3. اعتراض الاستدعاء البرمجي المباشر a.click() للروابط المنشأة في الذاكرة
  var originalClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    var href = this.href || '';
    var filename = this.getAttribute('download') || 'ملف-محفوظ';

    if (href.indexOf('blob:') === 0 || href.indexOf('data:') === 0) {
      log('🔘 تم اعتراض a.click() برمجياً من الذاكرة — الملف: ' + filename);
      handleDownload(href, filename);
      return;
    }
    originalClick.apply(this, arguments);
  };

  // 4. اعتراض النقرات التفاعلية المباشرة على عناصر <a> الموجودة في الشجرة (DOM)
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[download]') : null;
    if (!a || !a.href) return;

    var href = a.href;
    if (href.indexOf('blob:') !== 0 && href.indexOf('data:') !== 0) {
      log('⏭️ href ليس blob:/data: — تم تجاهله بواسطة الجسر (يتصرف WebView افتراضيًا)');
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    var filename = a.getAttribute('download') || 'ملف-محفوظ';
    log('🔘 رُصد نقر تفاعلي عادي على a[download] — الملف: ' + filename);
    handleDownload(href, filename);
  }, true);
})();
