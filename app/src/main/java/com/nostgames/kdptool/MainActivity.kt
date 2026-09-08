package com.nostgames.kdptool

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.ContentValues
import android.content.Intent
import android.content.pm.PackageManager
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
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import java.io.OutputStream

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private var fileChooserCallback: ValueCallback<Array<Uri>>? = null

    companion object {
        private const val FILE_CHOOSER_REQUEST_CODE = 5173
        private const val CREATE_FILE_REQUEST_CODE = 5174
        private const val TAG = "KdpToolApp"
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // فحوصات الأمان أولًا
        val blockReason = SecurityChecks.getBlockReason(this)

        if (blockReason != null) {
            setContentView(R.layout.activity_blocked)

            val msg = findViewById<TextView>(R.id.blockMessage)
            val btn = findViewById<Button>(R.id.downloadBtn)

            when (blockReason) {
                "root" -> {
                    msg.text =
                        "تم اكتشاف صلاحيات روت على جهازك. لأسباب أمنية، لا يمكن تشغيل التطبيق على أجهزة معدَّلة. يرجى استخدام جهاز غير مروَّت، أو تحميل النسخة الأصلية من الرابط أدناه."
                }

                "emulator" -> {
                    msg.text =
                        "يبدو أنك تشغّل التطبيق داخل بيئة محاكاة. يُرجى تشغيله على جهاز أندرويد حقيقي."
                }

                "sniffer" -> {
                    msg.text =
                        "تم اكتشاف تطبيق لاعتراض الشبكة على جهازك. يرجى إزالته لتشغيل التطبيق."
                }

                "proxy" -> {
                    msg.text =
                        "تم اكتشاف اتصال عبر وكيل شبكة (Proxy). يرجى تعطيله من إعدادات الواي فاي لتشغيل التطبيق."
                }
            }

            btn.visibility = View.VISIBLE

            btn.setOnClickListener {
                val intent = Intent(
                    Intent.ACTION_VIEW,
                    Uri.parse("https://yourdownloadlink.example.com")
                )
                startActivity(intent)
            }

            return
        }

        clearAllWebData()

        // ✅ طلب إذن إظهار الإشعارات (إلزامي من أندرويد 13/API 33 فما فوق،
        // وإلا فلن يظهر إشعار "تم تحميل الملف" حتى لو كان الكود صحيحًا)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED
        ) {
            ActivityCompat.requestPermissions(
                this,
                arrayOf(Manifest.permission.POST_NOTIFICATIONS),
                5175
            )
        }

        setContentView(R.layout.activity_main)

        WebView.setWebContentsDebuggingEnabled(true)

        webView = findViewById(R.id.webview)

        val settings: WebSettings = webView.settings

        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true

        settings.allowFileAccess = true
        settings.allowContentAccess = true

        settings.mediaPlaybackRequiresUserGesture = false

        settings.setSupportZoom(false)
        settings.builtInZoomControls = false

        webView.isLongClickable = false
        webView.setOnLongClickListener { true }
        webView.isHapticFeedbackEnabled = false

        /*
         * AndroidBridge يبقى مربوطًا بالـWebView حتى بعد انتقال
         * الصفحة من login.html إلى أداة KDP.
         */
        webView.addJavascriptInterface(
            AndroidBridge(this),
            "AndroidBridge"
        )

        webView.webViewClient = object : WebViewClient() {

            override fun onPageFinished(
                view: WebView?,
                url: String?
            ) {
                super.onPageFinished(view, url)

                /*
                 * الجسر القديم كان موجودًا داخل login.html فقط.
                 * عندما تستخدم الصفحة document.open()/document.write()
                 * يتم استبدال DOM، وبالتالي يختفي مستمع a[download].
                 *
                 * هنا نعيد حقن الجسر في كل صفحة بعد اكتمال تحميلها.
                 */
                injectAndroidDownloadBridge()
            }

            override fun onRenderProcessGone(
                view: WebView?,
                detail: RenderProcessGoneDetail?
            ): Boolean {

                val reason =
                    if (detail?.didCrash() == true) {
                        "انهيار محرك العرض: تم استنفاد ذاكرة الرسوميات (GPU/WebGL OOM)."
                    } else {
                        "تم إغلاق الأداة قسرياً بواسطة الأندرويد لتوفير الذاكرة."
                    }

                Log.e(TAG, reason)

                Toast.makeText(
                    this@MainActivity,
                    "⚠️ $reason",
                    Toast.LENGTH_LONG
                ).show()

                view?.loadUrl(
                    "file:///android_asset/index.html"
                )

                return true
            }
        }

        webView.webChromeClient =
            object : WebChromeClient() {

                override fun onShowFileChooser(
                    webView: WebView?,
                    filePathCallback: ValueCallback<Array<Uri>>?,
                    fileChooserParams: FileChooserParams?
                ): Boolean {

                    fileChooserCallback?.onReceiveValue(null)

                    fileChooserCallback = filePathCallback

                    return try {
                        val intent =
                            buildFilePickerIntent(fileChooserParams)

                        startActivityForResult(
                            intent,
                            FILE_CHOOSER_REQUEST_CODE
                        )

                        true

                    } catch (e: Exception) {

                        Toast.makeText(
                            this@MainActivity,
                            "⚠️ خطأ عند فتح منتقي الملفات: ${e.javaClass.simpleName} — ${e.message}",
                            Toast.LENGTH_LONG
                        ).show()

                        Log.e(
                            TAG,
                            "onShowFileChooser exception",
                            e
                        )

                        fileChooserCallback = null

                        false
                    }
                }

                override fun onPermissionRequest(
                    request: PermissionRequest?
                ) {
                    request?.deny()
                }
            }

        webView.loadUrl(
            "file:///android_asset/index.html"
        )
    }

    /**
     * إظهار لوحة Eruda لتشخيص الأخطاء فورياً.
     */
    fun showErudaConsole() {
        runOnUiThread {
            if (this::webView.isInitialized) {
                webView.evaluateJavascript(
                    "try { if (typeof eruda !== 'undefined') { eruda.show(); eruda.get('console').log('Android Bridge Active'); } } catch(e) {}",
                    null
                )
            }
        }
    }

    /**
     * يقرأ جسر التنزيل الموجود داخل assets
     * ثم يحقنه في الصفحة الحالية.
     */
    private fun injectAndroidDownloadBridge() {
        if (!this::webView.isInitialized) return

        try {
            val bridgeCode =
                assets.open("android-bridge.js")
                    .bufferedReader()
                    .use { it.readText() }

            webView.evaluateJavascript(
                bridgeCode,
                null
            )

            Log.d(
                TAG,
                "Android download bridge injected"
            )

        } catch (e: Exception) {

            Log.e(
                TAG,
                "فشل حقن Android download bridge",
                e
            )
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onActivityResult(
        requestCode: Int,
        resultCode: Int,
        data: Intent?
    ) {
        if (requestCode == FILE_CHOOSER_REQUEST_CODE) {

            val results: Array<Uri>? =
                if (
                    resultCode == Activity.RESULT_OK &&
                    data != null
                ) {

                    val clipData = data.clipData

                    if (
                        clipData != null &&
                        clipData.itemCount > 0
                    ) {

                        Array(clipData.itemCount) { i ->
                            clipData.getItemAt(i).uri
                        }

                    } else {

                        val uri = data.data

                        if (uri != null) {
                            arrayOf(uri)
                        } else {
                            null
                        }
                    }

                } else {
                    null
                }

            if (results == null) {
                Toast.makeText(
                    this,
                    "ℹ️ لم يُختر أي ملف (resultCode=$resultCode)",
                    Toast.LENGTH_SHORT
                ).show()
            }

            fileChooserCallback?.onReceiveValue(results)
            fileChooserCallback = null

            return
        }

        super.onActivityResult(
            requestCode,
            resultCode,
            data
        )
    }

    private fun buildFilePickerIntent(
        params: WebChromeClient.FileChooserParams?
    ): Intent {

        val mode =
            params?.mode
                ?: WebChromeClient.FileChooserParams.MODE_OPEN

        val rawTypes =
            params?.acceptTypes?.toList()
                ?: emptyList()

        val validTypes =
            rawTypes.filter {
                it.contains("/")
            }

        return Intent(
            Intent.ACTION_OPEN_DOCUMENT
        ).apply {

            addCategory(
                Intent.CATEGORY_OPENABLE
            )

            type = when {
                validTypes.isEmpty() -> "*/*"

                validTypes.size == 1 ->
                    validTypes[0]

                else -> {
                    putExtra(
                        Intent.EXTRA_MIME_TYPES,
                        validTypes.toTypedArray()
                    )
                    "*/*"
                }
            }

            addFlags(
                Intent.FLAG_GRANT_READ_URI_PERMISSION or
                    Intent.FLAG_GRANT_WRITE_URI_PERMISSION or
                    Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION
            )

            if (
                mode ==
                WebChromeClient.FileChooserParams.MODE_OPEN_MULTIPLE
            ) {
                putExtra(
                    Intent.EXTRA_ALLOW_MULTIPLE,
                    true
                )
            }
        }
    }

    override fun onKeyDown(
        keyCode: Int,
        event: KeyEvent?
    ): Boolean {

        if (
            keyCode == KeyEvent.KEYCODE_BACK &&
            this::webView.isInitialized &&
            webView.canGoBack()
        ) {
            webView.goBack()
            return true
        }

        return super.onKeyDown(
            keyCode,
            event
        )
    }

    override fun onDestroy() {

        /*
         * إغلاق أي تنزيل كان مفتوحًا قبل تدمير النشاط.
         */
        if (this::webView.isInitialized) {
            try {
                webView.evaluateJavascript(
                    "try{if(window.AndroidBridge){AndroidBridge.cancelDownload();}}catch(e){}",
                    null
                )
            } catch (_: Exception) {
            }
        }

        clearAllWebData()

        if (this::webView.isInitialized) {
            webView.destroy()
        }

        super.onDestroy()
    }

    private fun clearAllWebData() {
        try {

            WebStorage
                .getInstance()
                .deleteAllData()

            CookieManager
                .getInstance()
                .removeAllCookies(null)

            CookieManager
                .getInstance()
                .flush()

            if (this::webView.isInitialized) {
                webView.clearCache(true)
                webView.clearFormData()
                webView.clearHistory()
            }

        } catch (e: Exception) {

            Log.e(
                TAG,
                "فشل تعقيم بيئة WebView",
                e
            )
        }
    }

    /**
     * AndroidBridge
     *
     * التنزيل هنا يتم على مراحل:
     *
     * beginDownload()
     *      ↓
     * writeChunk()
     *      ↓
     * writeChunk()
     *      ↓
     * ...
     *      ↓
     * finishDownload()
     *
     * بدل إرسال الملف كاملًا في استدعاء JavaScript واحد.
     */
    class AndroidBridge(
        private val activity: MainActivity
    ) {

        private var currentUri: Uri? = null
        private var currentOutput: OutputStream? = null
        private var currentFilename: String? = null
        private var currentBytes: Long = 0L

        /**
         * بدء ملف جديد.
         */
        @Synchronized
        @JavascriptInterface
        fun beginDownload(
            filename: String,
            mimeType: String,
            expectedSize: Long
        ): String {

            try {

                // فتح لوحة Eruda لتتبع العملية في الواجهة فور البدء
                activity.showErudaConsole()

                /*
                 * إذا كان هناك تنزيل سابق لم ينتهِ،
                 * نلغيه أولًا حتى لا تبقى ملفات ناقصة.
                 */
                cancelDownloadInternal()

                val safeFilename =
                    sanitizeFilename(filename)

                val safeMime =
                    if (
                        mimeType.isNotBlank() &&
                        mimeType.contains("/")
                    ) {
                        mimeType
                    } else {
                        "application/octet-stream"
                    }

                val values =
                    ContentValues().apply {

                        put(
                            MediaStore.MediaColumns.DISPLAY_NAME,
                            safeFilename
                        )

                        put(
                            MediaStore.MediaColumns.MIME_TYPE,
                            safeMime
                        )

                        if (
                            Build.VERSION.SDK_INT >=
                            Build.VERSION_CODES.Q
                        ) {

                            put(
                                MediaStore.MediaColumns.RELATIVE_PATH,
                                Environment.DIRECTORY_DOWNLOADS
                            )

                            put(
                                MediaStore.MediaColumns.IS_PENDING,
                                1
                            )
                        }
                    }

                val collection =
                    if (
                        Build.VERSION.SDK_INT >=
                        Build.VERSION_CODES.Q
                    ) {
                        MediaStore
                            .Downloads
                            .EXTERNAL_CONTENT_URI
                    } else {
                        MediaStore
                            .Files
                            .getContentUri("external")
                    }

                val uri =
                    activity.contentResolver.insert(
                        collection,
                        values
                    )
                        ?: return "ERROR:INSERT_FAILED"

                val output =
                    activity.contentResolver
                        .openOutputStream(uri)
                        ?: run {
                            try {
                                activity.contentResolver.delete(
                                    uri,
                                    null,
                                    null
                                )
                            } catch (_: Exception) {
                            }

                            return "ERROR:OUTPUT_STREAM_FAILED"
                        }

                currentUri = uri
                currentOutput = output
                currentFilename = safeFilename
                currentBytes = 0L

                Log.d(
                    TAG,
                    "DOWNLOAD_BEGIN name=$safeFilename expected=$expectedSize mime=$safeMime"
                )

                return "OK"

            } catch (e: Exception) {

                Log.e(
                    TAG,
                    "DOWNLOAD_BEGIN_FAILED",
                    e
                )

                cancelDownloadInternal()

                return "ERROR:${e.javaClass.simpleName}"
            }
        }

        /**
         * استقبال جزء Base64 صغير وكتابته مباشرةً
         * إلى الملف بدل الاحتفاظ بالملف كاملًا في الذاكرة.
         */
        @Synchronized
        @JavascriptInterface
        fun writeChunk(
            base64Chunk: String
        ): String {

            try {

                val output =
                    currentOutput
                        ?: return "ERROR:NO_ACTIVE_DOWNLOAD"

                if (base64Chunk.isEmpty()) {
                    return "OK"
                }

                val bytes =
                    Base64.decode(
                        base64Chunk,
                        Base64.DEFAULT
                    )

                output.write(bytes)
                currentBytes += bytes.size.toLong()

                return "OK"

            } catch (e: Exception) {

                Log.e(
                    TAG,
                    "DOWNLOAD_CHUNK_FAILED bytes=$currentBytes",
                    e
                )

                cancelDownloadInternal()

                return "ERROR:${e.javaClass.simpleName}"
            }
        }

        /**
         * إنهاء الملف وإظهاره في Downloads.
         */
        @Synchronized
        @JavascriptInterface
        fun finishDownload(): String {

            try {

                val uri =
                    currentUri
                        ?: return "ERROR:NO_ACTIVE_DOWNLOAD"

                currentOutput?.flush()
                currentOutput?.close()

                currentOutput = null

                if (
                    Build.VERSION.SDK_INT >=
                    Build.VERSION_CODES.Q
                ) {

                    val values =
                        ContentValues().apply {
                            put(
                                MediaStore.MediaColumns.IS_PENDING,
                                0
                            )
                        }

                    activity.contentResolver.update(
                        uri,
                        values,
                        null,
                        null
                    )
                }

                activity.runOnUiThread {
                    Toast.makeText(
                        activity,
                        "✅ تم حفظ الملف بنجاح: $currentFilename",
                        Toast.LENGTH_LONG
                    ).show()

                    showDownloadCompleteNotification(
                        activity,
                        currentFilename ?: "ملف",
                        uri
                    )
                }

                Log.d(
                    TAG,
                    "DOWNLOAD_FINISHED name=$currentFilename bytes=$currentBytes uri=$uri"
                )

                currentUri = null
                currentFilename = null
                currentBytes = 0L

                return "OK"

            } catch (e: Exception) {

                Log.e(
                    TAG,
                    "DOWNLOAD_FINISH_FAILED",
                    e
                )

                cancelDownloadInternal()

                return "ERROR:${e.javaClass.simpleName}"
            }
        }

        /**
         * إلغاء تنزيل غير مكتمل وحذف الملف الجزئي.
         */
        @Synchronized
        @JavascriptInterface
        fun cancelDownload(): String {

            cancelDownloadInternal()

            return "OK"
        }

        @Synchronized
        private fun cancelDownloadInternal() {

            try {
                currentOutput?.close()
            } catch (_: Exception) {
            }

            currentOutput = null

            val uri = currentUri

            if (uri != null) {
                try {
                    activity.contentResolver.delete(
                        uri,
                        null,
                        null
                    )
                } catch (e: Exception) {
                    Log.e(
                        TAG,
                        "فشل حذف الملف غير المكتمل",
                        e
                    )
                }
            }

            currentUri = null
            currentFilename = null
            currentBytes = 0L
        }

        private fun sanitizeFilename(
            filename: String
        ): String {

            var result =
                filename
                    .replace(
                        Regex("[\\\\/:*?\"<>|]"),
                        "_"
                    )
                    .trim()

            if (result.isEmpty()) {
                result = "ملف-محفوظ"
            }

            return result
        }

        /**
         * يستخدمه login.html للحصول على معرف الجهاز.
         */
        @JavascriptInterface
        fun getDeviceId(): String {

            return android.provider.Settings.Secure.getString(
                activity.contentResolver,
                android.provider.Settings.Secure.ANDROID_ID
            ) ?: "unknown-device"
        }
    }
}

/**
 * إشعار نظام حقيقي (يبقى في شريط الإشعارات حتى يُضغَط عليه أو يُزال يدويًا)
 * يؤكد نجاح تحميل الملف فعليًا، ويفتح الملف مباشرة عند الضغط عليه.
 */
private fun showDownloadCompleteNotification(
    activity: Activity,
    filename: String,
    uri: Uri
) {
    val channelId = "kdp_downloads"

    val notificationManager =
        activity.getSystemService(Activity.NOTIFICATION_SERVICE) as NotificationManager

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val channel = NotificationChannel(
            channelId,
            "التنزيلات",
            NotificationManager.IMPORTANCE_DEFAULT
        )
        notificationManager.createNotificationChannel(channel)
    }

    val mimeType = activity.contentResolver.getType(uri) ?: "*/*"

    val openIntent = Intent(Intent.ACTION_VIEW).apply {
        setDataAndType(uri, mimeType)
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }

    val pendingIntent = PendingIntent.getActivity(
        activity,
        filename.hashCode(),
        openIntent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    val notification = NotificationCompat.Builder(activity, channelId)
        .setSmallIcon(android.R.drawable.stat_sys_download_done)
        .setContentTitle("تم تحميل الملف")
        .setContentText(filename)
        .setContentIntent(pendingIntent)
        .setAutoCancel(true)
        .build()

    val hasPermission =
        Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
            ContextCompat.checkSelfPermission(
                activity,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED

    if (hasPermission) {
        NotificationManagerCompat.from(activity).notify(filename.hashCode(), notification)
    }
}
