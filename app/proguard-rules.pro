# =========================================================
# YK PubEngine — AndroidBridge / WebView
# =========================================================

# الاحتفاظ بفئة AndroidBridge نفسها واسمها
-keep class com.nostgames.kdptool.MainActivity$AndroidBridge {
    *;
}

# الاحتفاظ بكل دوال JavaScript Interface
-keepclassmembers class com.nostgames.kdptool.MainActivity$AndroidBridge {
    @android.webkit.JavascriptInterface <methods>;
}

# حماية أي دوال JavascriptInterface مستقبلية في المشروع
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# WebView APIs
-keep class android.webkit.** { *; }

# =========================================================
# تقليل سجلات Debug/Verbose/Info في Release
# لا نحذف Log.e / Log.w حتى تبقى أخطاء Android قابلة للتشخيص.
# =========================================================

-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}
