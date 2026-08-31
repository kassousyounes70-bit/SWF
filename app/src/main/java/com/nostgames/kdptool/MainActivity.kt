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
        settings.allowContentAccess = false
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
                    val intent = fileChooserParams?.createIntent()
                    if (intent != null) {
                        startActivityForResult(intent, FILE_CHOOSER_REQUEST_CODE)
                        true
                    } else {
                        fileChooserCallback = null
                        false
                    }
                } catch (e: Exception) {
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
                val uri = data.data
                if (uri != null) arrayOf(uri) else null
            } else null
            fileChooserCallback?.onReceiveValue(results)
            fileChooserCallback = null
            return
        }
        super.onActivityResult(requestCode, resultCode, data)
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack()
            return true
        }
        return super.onKeyDown(keyCode, event)
    }

    // 2. التعقيم النهائي عند الخروج
    override fun onDestroy() {
        clearAllWebData()
        webView.destroy()
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
    }
}
