# -*- coding: utf-8 -*-
"""
YK PubEngine — مولّد الكوبونات
بدون python-bidi — معالجة RTL يدوية.
"""

import json
import os
import secrets
import threading
import urllib.request
import urllib.error

from kivy.app import App
from kivy.clock import Clock
from kivy.core.text import LabelBase
from kivy.metrics import dp
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.button import Button
from kivy.uix.checkbox import CheckBox
from kivy.uix.label import Label
from kivy.uix.textinput import TextInput

# ===== إعدادات =====
ADMIN_KEY = "YOUNESKING"
ENDPOINT = "https://yk-pubengine-v1.onrender.com/admin/createCoupon"
CHARSET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"

# ===== الخط العربي =====
_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
_FONT = os.path.join(_BASE_DIR, "assets", "Arabic.ttf")
if os.path.exists(_FONT):
    LabelBase.register(name="Arabic", fn_regular=_FONT)
    FONT_NAME = "Arabic"
else:
    FONT_NAME = None


def ar(text: str) -> str:
    """
    معالجة النص العربي بدون python-bidi.
    نستخدم arabic_reshaper لتوصيل الحروف، ثم نعكس ترتيب المقاطع
    يدويًا لعرض RTL صحيح في Kivy.
    """
    try:
        import arabic_reshaper
        reshaped = arabic_reshaper.reshape(text)
        # عكس يدوي للنص لعرضه من اليمين لليسار
        return reshaped[::-1]
    except Exception:
        return text


def generate_code() -> str:
    def group():
        return "".join(secrets.choice(CHARSET) for _ in range(4))
    return f"YKPE-{group()}-{group()}-{group()}"


class CouponRoot(BoxLayout):
    def __init__(self, **kw):
        super().__init__(
            orientation="vertical",
            padding=[dp(24)] * 4,
            spacing=dp(12),
            **kw,
        )
        self.platform = "windows"

        # العنوان
        self.add_widget(Label(
            text=ar("YK PubEngine — مولّد الكوبونات"),
            font_name=FONT_NAME,
            font_size=dp(18),
            bold=True,
            size_hint_y=None,
            height=dp(48),
        ))

        # اختيار المنصة
        for value, label_ar in [
            ("windows", "حاسوب (Windows)"),
            ("android", "أندرويد"),
            ("dual",    "مزدوج (حاسوب + أندرويد)"),
        ]:
            row = BoxLayout(
                orientation="horizontal",
                size_hint_y=None,
                height=dp(40),
                spacing=dp(8),
            )
            cb = CheckBox(
                group="platform",
                active=(value == "windows"),
                size_hint_x=None,
                width=dp(40),
            )
            cb.bind(active=lambda inst, active, v=value: self._on_platform(v, active))
            row.add_widget(cb)
            row.add_widget(Label(
                text=ar(label_ar),
                font_name=FONT_NAME,
                halign="right",
            ))
            self.add_widget(row)

        # زر التوليد
        gen = Button(
            text=ar("توليد كود جديد"),
            font_name=FONT_NAME,
            size_hint_y=None,
            height=dp(52),
        )
        gen.bind(on_release=self._on_generate)
        self.add_widget(gen)

        # حقل الكود
        self.code_field = TextInput(
            text="",
            hint_text=ar("سيظهر الكود هنا"),
            font_name=FONT_NAME,
            font_size=dp(20),
            multiline=False,
            halign="center",
            size_hint_y=None,
            height=dp(52),
        )
        self.add_widget(self.code_field)

        # زر الحفظ
        save = Button(
            text=ar("حفظ في Firebase"),
            font_name=FONT_NAME,
            size_hint_y=None,
            height=dp(52),
        )
        save.bind(on_release=self._on_save)
        self.add_widget(save)

        # حالة
        self.status = Label(
            text="",
            font_name=FONT_NAME,
            size_hint_y=None,
            height=dp(64),
            halign="center",
        )
        self.add_widget(self.status)

    def _on_platform(self, value, active):
        if active:
            self.platform = value

    def _on_generate(self, *_):
        self.code_field.text = generate_code()
        self.status.text = ""

    def _on_save(self, *_):
        code = self.code_field.text.strip()
        if not code:
            self.status.text = ar("ولّد كودًا أولًا أو اكتب واحدًا يدويًا")
            return
        self.status.text = ar("جارٍ الحفظ...")
        threading.Thread(
            target=self._save,
            args=(code, self.platform),
            daemon=True,
        ).start()

    def _save(self, code, platform):
        try:
            body = json.dumps({
                "code": code,
                "platform": platform,
                "adminKey": ADMIN_KEY,
            }).encode("utf-8")

            req = urllib.request.Request(
                ENDPOINT,
                data=body,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=60) as resp:
                ok = (resp.status == 200)

            msg = ar(f"تم الحفظ: {code}") if ok else ar("فشل الحفظ — تحقق من الخادم")
        except urllib.error.HTTPError as e:
            msg = ar(f"فشل الحفظ (رمز: {e.code})")
        except Exception as e:
            msg = ar(f"خطأ اتصال: {e}")
        Clock.schedule_once(lambda dt: setattr(self.status, "text", msg))


class CouponApp(App):
    def build(self):
        self.title = "YK Coupons"
        return CouponRoot()


if __name__ == "__main__":
    CouponApp().run()
