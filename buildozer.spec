[app]
title = YK Coupons
package.name = ykcoupons
package.domain = com.nostgames
source.dir = .
source.include_exts = py,png,jpg,kv,atlas,ttf,json
source.exclude_dirs = app,functions,scripts,src-tauri,desktop-shell,web-source,coupon-generator,gradle,.github,.buildozer,bin,__pycache__,.git,.venv
version = 1.0
requirements = python3,kivy==2.3.0,arabic-reshaper
orientation = portrait
fullscreen = 0
android.permissions = INTERNET
android.api = 34
android.minapi = 24
android.ndk = 28c
android.archs = arm64-v8a
android.allow_backup = False
android.accept_sdk_license = True
android.enable_androidx = True
p4a.branch = develop

[buildozer]
log_level = 2
warn_on_root = 1
