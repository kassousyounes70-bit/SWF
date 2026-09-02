# قواعد Proguard مخصّصة

# الحفاظ على واجهة الجافاسكربت (AndroidBridge) — ضروري وإلا ستفشل استدعاءات JS
-keepclassmembers class com.nostgames.kdptool.MainActivity$AndroidBridge {
    @android.webkit.JavascriptInterface <methods>;
}

# الحفاظ على أسماء فئات WebView الأساسية لتفادي مشاكل التوافق
-keep class android.webkit.** { *; }

# تقليل السجلات في نسخة الإصدار (اختياري لكنه يزيد التمويه أيضًا)
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}
