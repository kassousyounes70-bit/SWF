// جسر التنزيل لتطبيق أندرويد — لا يُشوَّه عمدًا (بسيط وصغير، لا داعي لإخفائه)
// يعمل فقط عند وجود AndroidBridge (أي داخل تطبيق الأندرويد الذي يحقنه)، ولا يؤثر إطلاقًا
// عند فتح نفس الملف في متصفح عادي (يبقى سلوك <a download> الطبيعي كما هو).
(function () {
  if (typeof AndroidBridge === 'undefined') return;

  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[download]') : null;
    if (!a || !a.href) return;
    var href = a.href;
    if (href.indexOf('blob:') !== 0 && href.indexOf('data:') !== 0) return;

    e.preventDefault();
    e.stopPropagation();
    var filename = a.getAttribute('download') || 'ملف-محفوظ';

    fetch(href).then(function (r) { return r.blob(); }).then(function (blob) {
      var reader = new FileReader();
      reader.onload = function () {
        var base64 = reader.result; // بصيغة data:...;base64,XXXX
        var mime = blob.type || 'application/octet-stream';
        AndroidBridge.saveBase64(base64, filename, mime);
      };
      reader.readAsDataURL(blob);
    }).catch(function (err) {
      console.error('فشل تجهيز الملف للحفظ عبر Android:', err);
    });
  }, true);
})();
