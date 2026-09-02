package com.nostgames.kdptool

import android.content.Context
import android.os.Build
import java.io.File

object SecurityChecks {

    private val knownSnifferPackages = arrayOf(
        "com.guoshi.httpcanary",
        "com.guoshi.httpcanary.premium",
        "app.greyshirts.sslcapture",
        "com.emanuelef.remote_capture"
    )

    fun isRooted(): Boolean {
        val rootPaths = arrayOf(
            "/system/app/Superuser.apk", "/sbin/su", "/system/bin/su",
            "/system/xbin/su", "/data/local/xbin/su", "/data/local/bin/su",
            "/system/sd/xbin/su", "/system/bin/failsafe/su", "/data/local/su",
            "/su/bin/su", "/system/xbin/busybox"
        )
        for (path in rootPaths) {
            if (File(path).exists()) return true
        }
        val buildTags = Build.TAGS
        if (buildTags != null && buildTags.contains("test-keys")) return true

        return try {
            val process = Runtime.getRuntime().exec(arrayOf("which", "su"))
            process.inputStream.bufferedReader().readLine() != null
        } catch (e: Exception) {
            false
        }
    }

    fun isEmulator(): Boolean {
        return (Build.FINGERPRINT.startsWith("generic")
            || Build.FINGERPRINT.startsWith("unknown")
            || Build.MODEL.contains("google_sdk")
            || Build.MODEL.contains("Emulator")
            || Build.MODEL.contains("Android SDK built for x86")
            || Build.MANUFACTURER.contains("Genymotion")
            || (Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic"))
            || Build.PRODUCT == "google_sdk")
    }

    fun hasNetworkSnifferInstalled(context: Context): Boolean {
        val pm = context.packageManager
        for (pkg in knownSnifferPackages) {
            try {
                pm.getPackageInfo(pkg, 0)
                return true
            } catch (e: Exception) {
                // غير مثبت، تابع الفحص التالي
            }
        }
        return false
    }

    fun hasActiveProxy(): Boolean {
        val host = System.getProperty("http.proxyHost")
        val port = System.getProperty("http.proxyPort")
        return !host.isNullOrEmpty() && !port.isNullOrEmpty()
    }

    fun getBlockReason(context: Context): String? {
        if (isRooted()) return "root"
        if (isEmulator()) return "emulator"
        if (hasNetworkSnifferInstalled(context)) return "sniffer"
        if (hasActiveProxy()) return "proxy"
        return null
    }
}
