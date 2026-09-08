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

    fetch(href)
      .then(function (r) { return r.blob(); })
      .then(function (blob) {
        var reader = new FileReader();
        reader.onload = function () {
          var base64 = reader.result;
          var mime = blob.type || 'application/octet-stream';
          try {
            AndroidBridge.saveBase64(base64, filename, mime);
          } catch (bridgeErr) { /* صامت في الإنتاج */ }
        };
        reader.readAsDataURL(blob);
      })
      .catch(function () { /* صامت في الإنتاج */ });
  }, true);
})();
