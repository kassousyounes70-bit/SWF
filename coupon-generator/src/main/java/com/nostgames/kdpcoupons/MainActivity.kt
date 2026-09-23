package com.nostgames.kdpcoupons

import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.RadioGroup
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.security.SecureRandom
import javax.net.ssl.HttpsURLConnection

class MainActivity : AppCompatActivity() {

    // نفس المفتاح يجب ضبطه كمتغيّر بيئة على Render باسم COUPON_ADMIN_KEY.
    // هذه أداة داخلية خاصة بك فقط على جهازك الشخصي، لذا تضمين المفتاح مباشرة
    // هنا مقبول (المستودع خاص، ولا يصل هذا الملف لأي عميل إطلاقًا) — على
    // عكس أي سرّ يخص العملاء أنفسهم.
    private val adminKey = "YOUNESKING"
    private val endpoint = "https://yk-pubengine-v1.onrender.com/admin/createCoupon"

    // بلا 0/O و1/I/L لتفادي التباس القراءة والكتابة اليدوية لاحقًا من العميل.
    private val charset = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"
    private val random = SecureRandom()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val platformGroup = findViewById<RadioGroup>(R.id.platformGroup)
        val codeField = findViewById<EditText>(R.id.codeField)
        val statusText = findViewById<TextView>(R.id.statusText)

        findViewById<Button>(R.id.generateBtn).setOnClickListener {
            codeField.setText(generateCode())
            statusText.text = ""
        }

        findViewById<Button>(R.id.saveBtn).setOnClickListener {
            val code = codeField.text.toString().trim()
            if (code.isEmpty()) {
                statusText.text = "ولّد كودًا أولًا أو اكتب واحدًا يدويًا"
                return@setOnClickListener
            }
            val platform = when (platformGroup.checkedRadioButtonId) {
                R.id.radioAndroid -> "android"
                R.id.radioDual -> "dual"
                else -> "windows"
            }
            statusText.text = "جارٍ الحفظ..."
            saveCoupon(code, platform, statusText)
        }
    }

    private fun generateCode(): String {
        fun group() = (1..4).map { charset[random.nextInt(charset.length)] }.joinToString("")
        return "YKPE-${group()}-${group()}-${group()}"
    }

    private fun saveCoupon(code: String, platform: String, statusText: TextView) {
        Thread {
            var message: String
            try {
                val url = URL(endpoint)
                val conn = url.openConnection() as HttpsURLConnection
                conn.requestMethod = "POST"
                conn.setRequestProperty("Content-Type", "application/json")
                conn.doOutput = true
                conn.connectTimeout = 15000
                conn.readTimeout = 60000 // خادم Render قد يكون نائمًا (نوم بعد ~15 دقيقة خمول)

                val body = JSONObject().apply {
                    put("code", code)
                    put("platform", platform)
                    put("adminKey", adminKey)
                }
                conn.outputStream.use { it.write(body.toString().toByteArray()) }

                val ok = conn.responseCode == HttpURLConnection.HTTP_OK
                message = if (ok) "✅ تم الحفظ: $code" else "❌ فشل الحفظ (رمز: ${conn.responseCode})"
                conn.disconnect()
            } catch (e: Exception) {
                message = "❌ خطأ اتصال: ${e.message}"
            }
            runOnUiThread { statusText.text = message }
        }.start()
    }
}
