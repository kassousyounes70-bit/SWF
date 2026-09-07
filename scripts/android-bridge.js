(function () {
  if (typeof AndroidBridge === 'undefined') return;

  // 1. اعتراض الاستدعاء البرمجي المباشر a.click() من الذاكرة
  var originalClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    var href = this.href || '';
    var filename = this.getAttribute('download') || 'ملف-محفوظ';

    if (href.indexOf('blob:') === 0 || href.indexOf('data:') === 0) {
      processAndSave(href, filename);
      return;
    }
    originalClick.apply(this, arguments);
  };

  // 2. تحويل الـ Blob إلى Base64 وإرساله للجسر
  function processAndSave(href, filename) {
    fetch(href)
      .then(function (r) { return r.blob(); })
      .then(function (blob) {
        var reader = new FileReader();
        reader.onload = function () {
          var base64 = reader.result;
          var mime = blob.type || 'application/octet-stream';
          AndroidBridge.saveBase64(base64, filename, mime);
        };
        reader.readAsDataURL(blob);
      })
      .catch(function (err) {
        console.error('فشل معالجة التحميل:', err);
      });
  }
})();
