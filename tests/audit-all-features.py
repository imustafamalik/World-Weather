import re
import sys

def audit():
    print("=== Starting Full Mobile & Desktop Feature Audit ===")
    
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()
        
    with open('style.css', 'r', encoding='utf-8') as f:
        css = f.read()
        
    with open('script.js', 'r', encoding='utf-8') as f:
        js = f.read()

    # 1. Extract all getElementById calls
    get_elem_pattern = re.compile(r"document\.getElementById\(['\"]([^'\"]+)['\"]\)")
    js_ids = set(get_elem_pattern.findall(js))
    
    # Extract all IDs from HTML
    html_id_pattern = re.compile(r'id=["\']([^"\']+)["\']')
    html_ids = set(html_id_pattern.findall(html))
    
    missing_in_html = []
    for elem_id in sorted(js_ids):
        if elem_id not in html_ids:
            missing_in_html.append(elem_id)
            
    print(f"Total document.getElementById references in script.js: {len(js_ids)}")
    if missing_in_html:
        print(f"[WARN] IDs in JS but not found statically in HTML: {missing_in_html}")
    else:
        print("[PASS] All getElementById references match elements in index.html!")

    # 2. Check Mobile Responsive CSS Rules
    mobile_queries = [
        "@media (max-width: 767px)",
        "@media (max-width: 480px)"
    ]
    for q in mobile_queries:
        if q in css:
            print(f"[PASS] Found responsive breakpoint: {q}")
        else:
            print(f"[FAIL] Missing responsive breakpoint: {q}")

    # 3. Check 3D Globe elements and controls
    globe_checks = [
        ("globe-container", html),
        ("ctrl-toggle-globe", html),
        ("toggle-globe-mode-gis", html),
        ("toggleGlobeMode", js),
        ("syncGlobeBasemapTexture", js),
        ("createAirplaneMesh3D", js),
        ("createVesselMesh3D", js)
    ]
    for name, content in globe_checks:
        if name in content:
            print(f"[PASS] 3D Globe feature verified: {name}")
        else:
            print(f"[FAIL] Missing 3D Globe feature: {name}")

    # 4. Check Mobile Bottom Sheet & Drawer interactions
    mobile_interactions = [
        ("toggleMobileSheet", js),
        ("panel-drag-handle", html),
        ("mobile-preview-bar", html),
        ("mobile-expand-btn", html),
        ("btn-floating-layers", html),
        ("btn-close-gis-sidebar", html),
        ("toggleGISMobileDrawer", html)
    ]
    for name, content in mobile_interactions:
        if name in content:
            print(f"[PASS] Mobile interaction verified: {name}")
        else:
            print(f"[FAIL] Missing mobile interaction: {name}")

    # 5. Check Error Handling & Fallbacks
    fallbacks = [
        ("showWeatherError", js),
        ("btn-retry-weather", html),
        ("initNetworkMonitor", js),
        ("network-status-banner", html),
        ("cached-data-notice", html),
        ("slow-connection-warning", html)
    ]
    for name, content in fallbacks:
        if name in content:
            print(f"[PASS] Reliability & fallback verified: {name}")
        else:
            print(f"[FAIL] Missing fallback feature: {name}")

    print("\n=== Audit Complete ===")

if __name__ == '__main__':
    audit()
