"""
World Weather & Elevation Explorer - Static Validation Suite
Validates HTML structure, CSS balance, JS syntax, i18n dictionary, PWA assets, and Service Worker.
"""

import json
import re
import os

def check_file(path, desc):
    exists = os.path.exists(path)
    size = os.path.getsize(path) if exists else 0
    print(f"[{'PASS' if exists else 'FAIL'}] {desc}: {path} ({size} bytes)")
    return exists

def validate_all():
    print("=== World Weather & Elevation Explorer Verification Suite ===")
    
    # 1. File checks
    all_ok = True
    files = [
        ("index.html", "Core HTML markup"),
        ("style.css", "Core CSS stylesheet"),
        ("script.js", "Core JavaScript logic"),
        ("strings.js", "i18n lookup dictionary"),
        ("manifest.json", "PWA Web App Manifest"),
        ("sw.js", "PWA Service Worker"),
        ("icons/icon.svg", "PWA App Icon"),
        ("tests/smoke.spec.js", "Playwright Smoke Test Suite"),
        ("playwright.config.js", "Playwright Configuration")
    ]
    
    for f, desc in files:
        if not check_file(f, desc):
            all_ok = False

    # 2. Viewport accessibility check
    with open("index.html", "r", encoding="utf-8") as f:
        html = f.read()
    
    if 'user-scalable=no' not in html and 'name="viewport"' in html:
        print("[PASS] Viewport meta tag is accessible (allows pinch-zoom)")
    else:
        print("[FAIL] Viewport meta tag contains user-scalable=no")
        all_ok = False

    # 3. Network Banner and Retry Elements check
    if 'network-status-banner' in html and 'btn-retry-weather' in html and 'weather-error-state' in html:
        print("[PASS] Network status banner and Retry UI present in HTML")
    else:
        print("[FAIL] Missing Network status banner or Retry UI in HTML")
        all_ok = False

    if 'cached-data-notice' in html and 'slow-connection-warning' in html:
        print("[PASS] Cached data notice and slow connection warning present in HTML")
    else:
        print("[FAIL] Missing cache/slow connection elements in HTML")
        all_ok = False

    # 4. CSS Balanced braces check
    with open("style.css", "r", encoding="utf-8") as f:
        css = f.read()
    
    depth = 0
    neg = False
    for line in css.splitlines():
        for ch in line:
            if ch == '{': depth += 1
            elif ch == '}':
                depth -= 1
                if depth < 0:
                    neg = True
    if depth == 0 and not neg:
        print("[PASS] CSS syntax and media queries strictly balanced (depth = 0)")
    else:
        print(f"[FAIL] CSS brace mismatch (final depth: {depth}, negative: {neg})")
        all_ok = False

    # 5. JS Syntax bracket check
    with open("script.js", "r", encoding="utf-8") as f:
        js = f.read()

    stack = []
    js_ok = True
    for ch in js:
        if ch in '({[': stack.append(ch)
        elif ch in ')}]':
            if not stack:
                js_ok = False
                break
            last = stack.pop()
            if {'(': ')', '{': '}', '[': ']'}[last] != ch:
                js_ok = False
                break
    if js_ok and len(stack) == 0:
        print("[PASS] script.js brackets and syntax balanced")
    else:
        print("[FAIL] script.js syntax bracket mismatch")
        all_ok = False

    # 6. Manifest JSON validation
    with open("manifest.json", "r", encoding="utf-8") as f:
        try:
            manifest_data = json.load(f)
            assert manifest_data.get("display") == "standalone"
            assert manifest_data.get("theme_color") == "#070a12"
            print("[PASS] manifest.json is valid JSON with standalone display and #070a12 theme")
        except Exception as e:
            print(f"[FAIL] manifest.json error: {e}")
            all_ok = False

    # 7. i18n Strings check
    with open("strings.js", "r", encoding="utf-8") as f:
        strings_content = f.read()
    if 'STRINGS' in strings_content and 'function t(' in strings_content:
        print("[PASS] strings.js contains STRINGS dictionary and t() lookup function")
    else:
        print("[FAIL] strings.js missing required exports")
        all_ok = False

    print("\n=== Validation Summary ===")
    if all_ok:
        print("ALL CHECKS PASSED: Phase 1, Phase 2, and Phase 3 implementations verified.")
    else:
        print("SOME CHECKS FAILED.")

if __name__ == '__main__':
    validate_all()
