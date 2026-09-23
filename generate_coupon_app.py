#!/usr/bin/env python3
"""
generate_coupon_app.py
(تم تحديث الكود لطباعة رد الخادم عند حدوث خطأ)
"""

from pathlib import Path

PROJECT_DIR = Path("coupon-generator")
PACKAGE_PATH = "com/nostgames/kdpcoupons"

FILES: dict[str, str] = {}

# ---------------------------------------------------------------------------
# جذر المشروع المستقل
# ---------------------------------------------------------------------------

FILES["settings.gradle"] = """\
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "yk-coupon-generator"
include ':app'
"""

FILES["build.gradle"] = """\
plugins {
    id 'com.android.application' version '8.5.0' apply false
    id 'org.jetbrains.kotlin.android' version '1.9.24' apply false
}

tasks.register("clean", Delete) {
    delete rootProject.layout.buildDirectory
}
"""

FILES["gradle.properties"] = """\
org.gradle.jvmargs=-Xmx2048m
android.useAndroidX=true
kotlin.code.style=official
"""

FILES["app/build.gradle"] = """\
plugins {
    id 'com.android.application'
    id 'org.jetbrains.kotlin.android'
}

android {
    namespace 'com.nostgames.kdpcoupons'
    compileSdk 34

    defaultConfig {
        applicationId "com.nostgames.kdpcoupons"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0"
    }

    buildTypes {
        debug {
            minifyEnabled false
        }
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = '17'
    }
}

dependencies {
    implementation 'androidx.core:core-ktx:1.13.1'
    implementation 'androidx.appcompat:appcompat:1.7.0'
    implementation 'com.google.android.material:material:1.12.0'
}
"""

FILES["app/src/main/AndroidManifest.xml"] = """\
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />

    <application
        android:allowBackup="false"
        android:label="YK Coupons"
        android:icon="@android:drawable/sym_def_app_icon"
        android:theme="@style/Theme.Material3.DayNight.NoActionBar">

        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>
"""

FILES[f"app/src/main/java/{PACKAGE_PATH}/MainActivity.kt"] = """\
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

    private val adminKey = "YOUNESKING"
    private val endpoint = "https://yk-pubengine-v1.onrender.com/admin/createCoupon"

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
                conn.readTimeout = 60000

                val body = JSONObject().apply {
                    put("code", code)
                    put("platform", platform)
                    put("adminKey", adminKey)
                }
                conn.outputStream.use { it.write(body.toString().toByteArray()) }

                val responseCode = conn.responseCode
                // قراءة رد الخادم سواء كان نجاحًا أو خطأ
                val stream = if (responseCode == HttpURLConnection.HTTP_OK) conn.inputStream else conn.errorStream
                val responseBody = stream?.bufferedReader()?.use { it.readText() } ?: "لا يوجد رد من الخادم"

                message = if (responseCode == HttpURLConnection.HTTP_OK) {
                    "\u2705 تم الحفظ: $code"
                } else {
                    "\u274c فشل الحفظ (رمز: $responseCode)\nرد الخادم: $responseBody"
                }
                conn.disconnect()
            } catch (e: Exception) {
                message = "\u274c خطأ اتصال: ${e.message}"
            }
            runOnUiThread { statusText.text = message }
        }.start()
    }
}
"""

FILES["app/src/main/res/layout/activity_main.xml"] = """\
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="24dp"
    android:gravity="center_horizontal">

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="YK PubEngine — مولّد الكوبونات"
        android:textSize="18sp"
        android:textStyle="bold"
        android:layout_marginBottom="24dp" />

    <RadioGroup
        android:id="@+id/platformGroup"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="vertical"
        android:layout_marginBottom="16dp">

        <RadioButton
            android:id="@+id/radioWindows"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:text="حاسوب (Windows)"
            android:checked="true" />

        <RadioButton
            android:id="@+id/radioAndroid"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:text="أندرويد" />

        <RadioButton
            android:id="@+id/radioDual"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:text="مزدوج (حاسوب + أندرويد)" />

    </RadioGroup>

    <Button
        android:id="@+id/generateBtn"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="توليد كود جديد"
        android:layout_marginBottom="16dp" />

    <EditText
        android:id="@+id/codeField"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:textSize="20sp"
        android:textStyle="bold"
        android:gravity="center"
        android:inputType="textCapCharacters"
        android:hint="سيظهر الكود هنا"
        android:layout_marginBottom="16dp" />

    <Button
        android:id="@+id/saveBtn"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="حفظ في Firebase"
        android:layout_marginBottom="16dp" />

    <TextView
        android:id="@+id/statusText"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:textAlignment="center"
        android:textColor="#666666" />

</LinearLayout>
"""


def main() -> None:
    for relative_path, content in FILES.items():
        target = PROJECT_DIR / relative_path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8")
        print(f"كُتب: {target}")
    print(f"\nتم توليد المشروع كاملًا داخل: {PROJECT_DIR}/")


if __name__ == "__main__":
    main()
