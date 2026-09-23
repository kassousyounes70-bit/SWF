# -*- coding: utf-8 -*-
"""
YK PubEngine — مولّد الكوبونات
ملف واحد مستقل: الواجهة + توليد الكود + الحفظ على الخادم.
لا يعتمد على أي ملف إضافي في المستودع (الخط العربي يُنزَّل تلقائيًا عند الحاجة).
"""

import os
import json
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

# ============================ الإعدادات ============================
ADMIN_KEY = "YOUNESKING"
ENDPOINT = "https://yk-pubengine-v1.onrender.com/admin/createCoupon"
CHARSET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"

FONT_URLS = (
    "https://github.com/google/fonts/raw/main/ofl/notonaskharabic/NotoNaskhArabic%5Bwght%5D.ttf",
    "https://github.com/aliftype/amiri/raw/main/Amiri-Regular.ttf",
)

_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
_WRITABLE_DIR = os.path.join(os.path.expanduser("~"), ".ykcoupons")


# ============================ الخط العربي ============================
def _find_font():
    for path in (
        os.path.join(_BASE_DIR, "assets", "Arabic.ttf"),
        os.path.join(_BASE_DIR, "Arabic.ttf"),
        os.path.join(os.getcwd(), "assets", "Arabic.ttf"),
        os.path.join(_WRITABLE_DIR, "Arabic.ttf"),
    ):
        if os.path.isfile(path):
            return path
    return None


def _download_font():
    try:
        os.makedirs(_WRITABLE_DIR, exist_ok=True)
    except Exception:
        return None
    target = os.path.join(_WRITABLE_DIR, "Arabic.ttf")
    for url in FONT_URLS:
        try:
            with urllib.request.urlopen(url, timeout=60) as resp:
                data = resp.read()
            if len(data) > 10000:
                with open(target, "wb") as fh:
                    fh.write(data)
                return target
        except Exception:
            continue
    return None


def _register_font():
    path = _find_font() or _download_font()
    if not path:
        return None
    try:
        LabelBase.register(name="Arabic", fn_regular=path)
        return "Arabic"
    except Exception:
        return None


FONT_NAME = _register_font()


def _font_kwargs():
    return {"font_name": FONT_NAME} if FONT_NAME else {}


# ============================ معالجة النص العربي ============================
# نعتمد على arabic_reshaper لتوصيل الحروف، ثم نطبّق ترتيبًا بصريًا (RTL)
# يدويًا بالكامل — بلا python-bidi وبلا أي مكتبة خارجية إضافية.
_RTL_RANGES = (
    (0x0600, 0x06FF),
    (0x0750, 0x077F),
    (0x08A0, 0x08FF),
    (0xFB50, 0xFDFF),
    (0xFE70, 0xFEFF),
)


def _is_rtl(ch):
    code = ord(ch)
    for low, high in _RTL_RANGES:
        if low <= code <= high:
            return True
    return False


def _visual_order(text):
    runs = []
    current = ""
    current_rtl = None
    for ch in text:
        is_rtl = _is_rtl(ch)
        if current_rtl is None:
            current, current_rtl = ch, is_rtl
        elif is_rtl == current_rtl or ch in " \t":
            current += ch
        else:
            runs.append((current, current_rtl))
            current, current_rtl = ch, is_rtl
    if current:
        runs.append((current, current_rtl))

    if not any(is_rtl for _, is_rtl in runs):
        return text

    visual = ""
    for run, is_rtl in reversed(runs):
        visual += run[::-1] if is_rtl else run
    return visual


def ar(text):
    try:
        import arabic_reshaper
        shaped = arabic_reshaper.reshape(text)
    except Exception:
        shaped = text
    try:
        return _visual_order(shaped)
    except Exception:
        return shaped


# ============================ توليد الكود ============================
def generate_code():
    def group():
        return "".join(secrets.choice(CHARSET) for _ in range(4))

    return "YKPE-{0}-{1}-{2}".format(group(), group(), group())


# ============================ الواجهة ============================
class CouponRoot(BoxLayout):
    def __init__(self, **kw):
        super().__init__(
            orientation="vertical",
            padding=[dp(24)] * 4,
            spacing=dp(12),
            **kw
        )
        self.platform = "windows"

        self.add_widget(self._title("YK PubEngine — مولّد الكوبونات"))

        for value, label in (
            ("windows", "الحاسوب"),
            ("android", "أندرويد"),
            ("dual", "مزدوج للحاسوب وأندرويد"),
        ):
            self.add_widget(self._platform_row(value, label))

        self.add_widget(self._button("توليد كود جديد", self._on_generate))

        self.code_field = TextInput(
            text="",
            hint_text=ar("سيظهر الكود هنا"),
            font_size=dp(20),
            multiline=False,
            halign="center",
            size_hint_y=None,
            height=dp(52),
            **_font_kwargs()
        )
        self.add_widget(self.code_field)

        self.add_widget(self._button("حفظ في الخادم", self._on_save))

        self.status = Label(
            text="",
            font_size=dp(15),
            size_hint_y=None,
            height=dp(72),
            halign="center",
            valign="middle",
            **_font_kwargs()
        )
        self.status.bind(size=lambda w, s: setattr(w, "text_size", (s[0], s[1])))
        self.add_widget(self.status)

    def _title(self, text):
        label = Label(
            text=ar(text),
            font_size=dp(18),
            bold=True,
            size_hint_y=None,
            height=dp(48),
            halign="center",
            **_font_kwargs()
        )
        label.bind(size=lambda w, s: setattr(w, "text_size", (s[0], s[1])))
        return label

    def _platform_row(self, value, text):
        row = BoxLayout(
            orientation="horizontal",
            size_hint_y=None,
            height=dp(44),
            spacing=dp(8),
        )
        box = CheckBox(
            group="platform",
            active=(value == "windows"),
            size_hint_x=None,
            width=dp(40),
        )
        box.bind(active=lambda inst, active, v=value: self._on_platform(v, active))
        label = Label(
            text=ar(text),
            halign="right",
            valign="middle",
            **_font_kwargs()
        )
        label.bind(size=lambda w, s: setattr(w, "text_size", (s[0], s[1])))
        row.add_widget(box)
        row.add_widget(label)
        return row

    def _button(self, text, callback):
        button = Button(
            text=ar(text),
            size_hint_y=None,
            height=dp(52),
            **_font_kwargs()
        )
        button.bind(on_release=callback)
        return button

    # ---------- المنطق ----------
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

            request = urllib.request.Request(
                ENDPOINT,
                data=body,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(request, timeout=90) as response:
                ok = (response.status == 200)

            if ok:
                message = ar("تم الحفظ بنجاح") + "\n" + code
            else:
                message = ar("فشل الحفظ، تحقّق من الخادم")
        except urllib.error.HTTPError as exc:
            if exc.code == 409:
                message = ar("هذا الكود موجود بالفعل")
            elif exc.code == 403:
                message = ar("مفتاح الإدارة غير صحيح")
            else:
                message = ar("فشل الحفظ، رمز الخطأ") + ": " + str(exc.code)
        except Exception as exc:
            message = ar("خطأ في الاتصال") + ":\n" + str(exc)

        Clock.schedule_once(lambda dt: setattr(self.status, "text", message))


class CouponApp(App):
    def build(self):
        self.title = "YK Coupons"
        return CouponRoot()


if __name__ == "__main__":
    CouponApp().run()
