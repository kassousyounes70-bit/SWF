package com.nostgames.kdptool

import android.annotation.SuppressLint
import android.app.Activity
import android.content.ContentValues
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.util.Base64
import android.util.Log
import android.view.KeyEvent
import android.view.View
import android.webkit.CookieManager
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.RenderProcessGoneDetail
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebStorage
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import java.io.OutputStream

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private var fileChooserCallback: ValueCallback<Array<Uri>>? = null

    companion object {
        private const val FILE_CHOOSER_REQUEST_CODE = 5173
        private const val TAG = "KdpToolApp"
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // فحوصات الأمان أولًا — قبل أي بناء للواجهة الفعلية
        val blockReason = SecurityChecks.getBlockReason(this)
        if (blockReason != null) {
            setContentView(R.layout.activity_blocked)
            val msg = findViewById<TextView>(R.id.blockMessage)
            val btn = findViewById<Button>(R.id.downloadBtn)
            when (blockReason) {
                "root" -> msg.text = "تم اكتشاف صلاحيات روت على جهازك. لأسباب أمنية، لا يمكن تشغيل التطبيق على أجهزة معدَّلة. يرجى استخدام جهاز غير مروَّت، أو تحميل النسخة الأصلية من الرابط أدناه."
                "emulator" -> msg.text = "يبدو أنك تشغّل التطبيق داخل بيئة محاكاة. يُرجى تشغيله على جهاز أندرويد حقيقي."
                "sniffer" -> msg.text = "تم اكتشاف تطبيق لاعتراض الشبكة على جهازك. يرجى إزالته لتشغيل التطبيق."
                "proxy" -> msg.text = "تم اكتشاف اتصال عبر وكيل شبكة (Proxy). يرجى تعطيله من إعدادات الواي فاي لتشغيل التطبيق."
            }
            btn.visibility = View.VISIBLE
            btn.setOnClickListener {
                val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://yourdownloadlink.example.com"))
                startActivity(intent)
            }
            return
        }

        // 1. التعقيم الاستباقي قبل بناء الواجهة لضمان بيئة نظيفة تماماً
        clearAllWebData()

        setContentView(R.layout.activity_main)

        // منع أدوات التنقيح عن بُعد (Chrome DevTools) في نسخة الإصدار
        WebView.setWebContentsDebuggingEnabled(false)

        webView = findViewById(R.id.webview)
        val settings: WebSettings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.allowFileAccess = false
        // يجب تفعيل content access حتى تتمكن الأداة من قراءة الملفات/الصور
        // المختارة عبر <input type="file"> (تبلغ URI بصيغة content://)
        settings.allowContentAccess = true
        settings.mediaPlaybackRequiresUserGesture = false
        settings.setSupportZoom(false)
        settings.builtInZoomControls = false

        // منع تحديد النص أو ظهور قائمة "حفظ الصورة/نسخ" عند الضغط المطوّل
        webView.isLongClickable = false
        webView.setOnLongClickListener { true }
        webView.isHapticFeedbackEnabled = false

        // إضافة متصيد انهيار محرك العرض (OOM Watchdog)
        webView.webViewClient = object : WebViewClient() {
            override fun onRenderProcessGone(view: WebView?, detail: RenderProcessGoneDetail?): Boolean {
                val reason = if (detail?.didCrash() == true) {
                    "انهيار محرك العرض: تم استنفاد ذاكرة الرسوميات (GPU/WebGL OOM)."
                } else {
                    "تم إغلاق الأداة قسرياً بواسطة الأندرويد لتوفير الذاكرة."
                }
                Log.e(TAG, reason)
                Toast.makeText(this@MainActivity, "⚠️ $reason", Toast.LENGTH_LONG).show()

                // إعادة تهيئة الواجهة بدلاً من خروج التطبيق بالكامل
                view?.loadUrl("file:///android_asset/index.html")
                return true // إخبار النظام بأننا تعاملنا مع الخطأ بأمان
            }
        }

        // جسر حفظ الملفات (PDF / MP4 / .kdp) من JavaScript إلى تخزين الجهاز
        webView.addJavascriptInterface(AndroidBridge(this), "AndroidBridge")

        webView.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                fileChooserCallback?.onReceiveValue(null)
                fileChooserCallback = filePathCallback
                return try {
                    val intent = buildFilePickerIntent(fileChooserParams)
                    startActivityForResult(intent, FILE_CHOOSER_REQUEST_CODE)
                    true
                } catch (e: Exception) {
                    // تشخيص: نُظهر نص الاستثناء الفعلي مباشرة على الشاشة
                    Toast.makeText(
                        this@MainActivity,
                        "⚠️ خطأ عند فتح منتقي الملفات: ${e.javaClass.simpleName} — ${e.message}",
                        Toast.LENGTH_LONG
                    ).show()
                    Log.e(TAG, "onShowFileChooser exception", e)
                    fileChooserCallback = null
                    false
                }
            }

            override fun onPermissionRequest(request: PermissionRequest?) {
                request?.deny()
            }
        }

        webView.loadUrl("file:///android_asset/index.html")
    }

    @Deprecated("Deprecated in Java")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == FILE_CHOOSER_REQUEST_CODE) {
            val results: Array<Uri>? = if (resultCode == Activity.RESULT_OK && data != null) {
                val clipData = data.clipData
                if (clipData != null && clipData.itemCount > 0) {
                    // اختيار عدة ملفات دفعة واحدة: تأتي عبر clipData وليس data.data
                    Array(clipData.itemCount) { i -> clipData.getItemAt(i).uri }
                } else {
                    // اختيار ملف واحد: يأتي عادة عبر data.data
                    val uri = data.data
                    if (uri != null) arrayOf(uri) else null
                }
            } else null

            if (results == null) {
                Toast.makeText(this, "ℹ️ لم يُختر أي ملف (resultCode=$resultCode)", Toast.LENGTH_SHORT).show()
            }

            fileChooserCallback?.onReceiveValue(results)
            fileChooserCallback = null
            return
        }
        super.onActivityResult(requestCode, resultCode, data)
    }

    // بناء نافذة اختيار الملف يدويًا بدلًا من createIntent():
    // createIntent() يضع امتدادًا مخصصًا مثل ".kdp" كـ MIME داخل الـ Intent،
    // ولا يوجد تطبيق في النظام يتعامل معه، لذلك لا تُفتح النافذة إطلاقًا.
    private fun buildFilePickerIntent(params: WebChromeClient.FileChooserParams?): Intent {
        val mode = params?.mode ?: WebChromeClient.FileChooserParams.MODE_OPEN
        val rawTypes = params?.acceptTypes?.toList() ?: emptyList()

        // نحتفظ فقط بأنواع MIME الصالحة (تحتوي "/") ونتجاهل الامتدادات المخصصة مثل ".kdp"
        val validTypes = rawTypes.filter { it.contains("/") }

        val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = when {
                validTypes.isEmpty() -> "*/*" // يفتح المنتقي دائمًا حتى مع امتداد مخصص
                validTypes.size == 1 -> validTypes[0]
                else -> {
                    putExtra(Intent.EXTRA_MIME_TYPES, validTypes.toTypedArray())
                    "*/*"
                }
            }
            addFlags(
                Intent.FLAG_GRANT_READ_URI_PERMISSION
                    or Intent.FLAG_GRANT_WRITE_URI_PERMISSION
                    or Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION
            )
            if (mode == WebChromeClient.FileChooserParams.MODE_OPEN_MULTIPLE) {
                putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true)
            }
        }
        return intent
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_BACK && this::webView.isInitialized && webView.canGoBack()) {
            webView.goBack()
            return true
        }
        return super.onKeyDown(keyCode, event)
    }

    // 2. التعقيم النهائي عند الخروج
    override fun onDestroy() {
        clearAllWebData()
        if (this::webView.isInitialized) {
            webView.destroy()
        }
        super.onDestroy()
    }

    private fun clearAllWebData() {
        try {
            WebStorage.getInstance().deleteAllData()
            CookieManager.getInstance().removeAllCookies(null)
            CookieManager.getInstance().flush()
            if (this::webView.isInitialized) {
                webView.clearCache(true)
                webView.clearFormData()
                webView.clearHistory()
            }
        } catch (e: Exception) {
            Log.e(TAG, "فشل تعقيم بيئة WebView", e)
        }
    }

    class AndroidBridge(private val activity: MainActivity) {
        @JavascriptInterface
        fun saveBase64(base64Data: String, filename: String, mimeType: String) {
            try {
                val cleanBase64 = if (base64Data.contains(",")) {
                    base64Data.substringAfter(",")
                } else base64Data
                val bytes = Base64.decode(cleanBase64, Base64.DEFAULT)

                val resolver = activity.contentResolver
                val values = ContentValues().apply {
                    put(MediaStore.MediaColumns.DISPLAY_NAME, filename)
                    put(MediaStore.MediaColumns.MIME_TYPE, mimeType)
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
                    }
                }
                val collection = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    MediaStore.Downloads.EXTERNAL_CONTENT_URI
                } else {
                    MediaStore.Files.getContentUri("external")
                }
                val uri: Uri? = resolver.insert(collection, values)
                if (uri != null) {
                    val out: OutputStream? = resolver.openOutputStream(uri)
                    out?.use { it.write(bytes) }
                    Log.i(TAG, "تم حفظ الملف: $filename")
                }
            } catch (e: Exception) {
                Log.e(TAG, "فشل حفظ الملف: ${e.message}", e)
            }
        }

        @JavascriptInterface
        fun getDeviceId(): String {
            return android.provider.Settings.Secure.getString(
                activity.contentResolver,
                android.provider.Settings.Secure.ANDROID_ID
            ) ?: "unknown-device"
        }
    }
}
