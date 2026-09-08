// ⚠️ نسخة تشخيصية v2 — تسجّل كل نقرة بدون فلترة لتحديد مكان الانقطاع بدقة
(function () {
  if (typeof AndroidBridge === 'undefined') return;

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

  var counter = 0;
  function log(msg) {
    dbg.textContent += msg + '\n';
    dbg.scrollTop = dbg.scrollHeight;
  }

  log('✅ v2 مُفعَّل — سيسجّل كل نقرة تصل إلى document (بدون استثناء)');

  // 🔎 مستمع تشخيصي شامل: يسجل أي نقرة وصلت، أيًا كان هدفها
  document.addEventListener('click', function (e) {
    counter++;
    var t = e.target;
    var info = t.tagName || 'unknown';
    if (t.id) info += '#' + t.id;
    if (t.className && typeof t.className === 'string') info += '.' + t.className.split(' ').join('.');
    if (t.hasAttribute && t.hasAttribute('download')) info += ' [لديه download]';
    log('👆 نقرة #' + counter + ' على: ' + info);
  }, true);

  // المستمع الفعلي لجسر الحفظ (نفس منطق النسخة السابقة)
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[download]') : null;
    if (!a || !a.href) return;

    var href = a.href;
    log('🔘 مطابقة a[download] — href: ' + href.substring(0, 25));

    if (href.indexOf('blob:') !== 0 && href.indexOf('data:') !== 0) {
      log('⏭️ href ليس blob:/data: — تم تجاهله');
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    var filename = a.getAttribute('download') || 'ملف-محفوظ';
    log('⏳ جاري fetch...');

    fetch(href)
      .then(function (r) { return r.blob(); })
      .then(function (blob) {
        log('✅ نجح fetch — الحجم: ' + blob.size + ' بايت');
        var reader = new FileReader();
        reader.onload = function () {
          var base64 = reader.result;
          var mime = blob.type || 'application/octet-stream';
          log('📤 استدعاء saveBase64...');
          try {
            AndroidBridge.saveBase64(base64, filename, mime);
            log('✅ استُدعي saveBase64 بدون استثناء JS');
          } catch (bridgeErr) {
            log('❌ استثناء عند استدعاء الجسر: ' + bridgeErr.message);
          }
        };
        reader.onerror = function () { log('❌ فشل FileReader'); };
        reader.readAsDataURL(blob);
      })
      .catch(function (err) {
        log('❌ فشل fetch/blob: ' + err.message);
      });
  }, true);
})();
