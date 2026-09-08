// YK PubEngine — Android download bridge
// يعمل فقط داخل WebView الذي يوفر AndroidBridge.
// يوجد حارس لمنع تثبيت المستمع أكثر من مرة عند إعادة حقن الجسر.

(function () {
  if (typeof AndroidBridge === 'undefined') return;
  if (window.__YK_ANDROID_DOWNLOAD_BRIDGE_INSTALLED__) return;

  window.__YK_ANDROID_DOWNLOAD_BRIDGE_INSTALLED__ = true;

  var CHUNK_SIZE = 256 * 1024; // 256 KB

  function logError(message, error) {
    try {
      console.error(
        '[YK Android Download] ' +
        message +
        (error ? ' ' + (error.message || String(error)) : '')
      );
    } catch (_) {}
  }

  function sendBlobToAndroid(blob, filename) {
    var mime = blob.type || 'application/octet-stream';
    var total = blob.size || 0;

    try {
      var beginResult = AndroidBridge.beginDownload(
        filename || 'ملف-محفوظ',
        mime,
        total
      );

      if (beginResult !== 'OK') {
        throw new Error(
          'Android beginDownload failed: ' + beginResult
        );
      }
    } catch (err) {
      logError('تعذر بدء تنزيل الملف.', err);
      return;
    }

    var offset = 0;

    function readNextChunk() {
      if (offset >= total) {
        try {
          var finishResult = AndroidBridge.finishDownload();

          if (finishResult !== 'OK') {
            throw new Error(
              'Android finishDownload failed: ' + finishResult
            );
          }

          console.log(
            '[YK Android Download] تم حفظ الملف: ' +
            filename +
            ' (' +
            total +
            ' bytes)'
          );
        } catch (err) {
          logError('تعذر إنهاء حفظ الملف.', err);

          try {
            AndroidBridge.cancelDownload();
          } catch (_) {}
        }

        return;
      }

      var end = Math.min(offset + CHUNK_SIZE, total);
      var chunk = blob.slice(offset, end);
      var reader = new FileReader();

      reader.onload = function () {
        try {
          var dataUrl = reader.result;
          var comma = dataUrl.indexOf(',');

          if (comma < 0) {
            throw new Error('صيغة Base64 غير صالحة.');
          }

          var base64 = dataUrl.substring(comma + 1);

          var result = AndroidBridge.writeChunk(base64);

          if (result !== 'OK') {
            throw new Error(
              'Android writeChunk failed: ' + result
            );
          }

          offset = end;

          // إعطاء WebView فرصة للتنفس بين الأجزاء.
          setTimeout(readNextChunk, 0);
        } catch (err) {
          logError('فشل إرسال جزء من الملف.', err);

          try {
            AndroidBridge.cancelDownload();
          } catch (_) {}
        }
      };

      reader.onerror = function () {
        logError('فشل قراءة جزء من الملف.');

        try {
          AndroidBridge.cancelDownload();
        } catch (_) {}
      };

      reader.readAsDataURL(chunk);
    }

    readNextChunk();
  }

  // ✅ استدعاء مباشر يمكن لأي كود في الأداة استخدامه (مثل jsPDF's doc.output('blob'))
  // بدل الاعتماد فقط على نقر <a download> — ضروري لأن jsPDF's doc.save() ينقر
  // داخليًا على عنصر غير متصل بـDOM فلا يصل أي حدث لمستمع النقر أدناه.
  window.KDP_saveBlob = function (blob, filename) {
    sendBlobToAndroid(blob, filename);
  };

  document.addEventListener(
    'click',
    function (e) {
      var a = e.target && e.target.closest
        ? e.target.closest('a[download]')
        : null;

      if (!a || !a.href) return;

      var href = a.href;

      if (
        href.indexOf('blob:') !== 0 &&
        href.indexOf('data:') !== 0
      ) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      var filename =
        a.getAttribute('download') || 'ملف-محفوظ';

      fetch(href)
        .then(function (response) {
          if (!response.ok) {
            throw new Error(
              'HTTP ' + response.status
            );
          }

          return response.blob();
        })
        .then(function (blob) {
          sendBlobToAndroid(blob, filename);
        })
        .catch(function (err) {
          logError('فشل تجهيز الملف للحفظ عبر Android.', err);
        });
    },
    true
  );
})();
