# 🌍 World Weather & Elevation Explorer

> A high-performance, glassmorphic single-page web application for interactive geographic exploration of live weather, terrain elevation, 24-hour hourly curves, 7-day extended forecasts, local times, and sun/moon celestial cycles for any coordinate on Earth.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![Vanilla JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Leaflet.js](https://img.shields.io/badge/Leaflet.js-199900?style=flat&logo=leaflet&logoColor=white)
![Open-Meteo](https://img.shields.io/badge/Open--Meteo_APIs-Free_&_Open-06b6d4?style=flat)

---

## ✨ Features

- **Interactive Global Canvas**:
  - Fullscreen interactive world map powered by Leaflet.js with smooth zooming, panning, and world wrapping.
  - Multi-layer map styling: **Standard Detailed (Carto Voyager)**, **Dark Night (Carto Dark Matter)**, **Satellite Imagery (Esri World Imagery)**, and **OpenStreetMap Standard**.
  - Precision Center Crosshair mode for millimeter pinpointing.
  - Custom pulsing pin marker with animated radar glow and popup summaries.

- **Instant Click-to-Explore**:
  - Click anywhere on land or sea to inspect coordinates formatted to 4 decimal places with directional indicators ($N/S, E/W$).
  - Parallel non-blocking data fetching with `Promise.allSettled()` and stale request cancellation via `AbortController`.

- **Comprehensive Weather Metrics**:
  - **Hero Condition Card**: Current temperature, weather condition label, day/night accent indicator, feels-like temperature, and daily high/low range.
  - **Atmospheric Grid**: Relative humidity, dew point, wind speed, wind gusts, compass wind direction arrow, sea-level pressure, cloud cover, visibility in km, and precipitation.
  - **Complete WMO 0–99 Mapping**: Detailed classification for clear skies, rain, freezing drizzle, snowfall, snow grains, and severe thunderstorms with hail.

- **24-Hour Hourly Forecast & Interactive SVG Curve**:
  - Continuous Bezier spline temperature trend line with gradient fill.
  - Horizontally scrollable 24-hour carousel with time, weather icons, temperatures, and precipitation probability badges.

- **7-Day Weekly Outlook**:
  - Proportional temperature range bars visually comparing daily minimum and maximum spans across the week.
  - Rain probability indicators and condition icons.

- **Terrain Elevation & Ocean Detection**:
  - Accurate elevation retrieved from the Open-Meteo Elevation API.
  - Intelligent ocean and sea-level recognition (e.g. Mariana Trench, ocean baselines, low-lying coastal plains, and alpine peaks).
  - Dynamic SVG terrain profile gauge comparing ground level to mean sea level.

- **Celestial & Daylight Tracking**:
  - Automatic local sunrise and sunset calculations.
  - Total day length calculation ($X\text{h } Y\text{m}$).
  - Live Golden Hour detector pill.
  - Visual daylight progression bar.

- **Timezone & Live Local Clock**:
  - Automatic timezone detection (`timezone=auto`).
  - Live ticking local clock with 12-hour AM/PM formatting and UTC offset badge.

- **Fast Geocoding & Autocomplete**:
  - Search any city, country, mountain, island, or landmark with a 350ms debounced search bar.
  - Keyboard navigation support ($\uparrow, \downarrow, \text{Enter}, \text{Esc}$) and country flag emojis.
  - Free automatic client-side reverse geocoding with graceful fallback to "Custom Location".

- **Unit Conversions (Instant Client-Side)**:
  - **Temperature**: Celsius ($^\circ\text{C}$) $\longleftrightarrow$ Fahrenheit ($^\circ\text{F}$)
  - **Wind Speed**: $\text{km/h} \longleftrightarrow \text{mph} \longleftrightarrow \text{m/s} \longleftrightarrow \text{knots}$
  - **Elevation**: Meters ($\text{m}$) $\longleftrightarrow$ Feet ($\text{ft}$)
  - All unit toggles update instantaneously without repeating API calls.

- **Location Sharing & Favorites**:
  - **Deep-linking URL State**: `index.html?lat=33.6844&lng=73.0479` loads and centers directly on the chosen coordinates.
  - **One-click Share**: Uses the native Web Share API with clipboard URL fallback.
  - **Copy Coordinates**: Copies `lat, lng` directly to the clipboard with visual toast feedback.
  - **Saved Favorites & Recent History**: Persisted in `localStorage` with click-to-fly navigation.

- **Responsive Mobile Bottom Sheet**:
  - Desktop: Top-right floating glass panel ($410\text{px}$ width).
  - Mobile: Collapsible bottom sheet with peek preview bar, drag handle, and expandable $85\text{vh}$ view.

---

## 🛠️ Technology Stack & Dependencies

- **HTML5 & CSS3**: Semantic elements, CSS Custom Properties (Variables), Flexbox, CSS Grid, Glassmorphism backdrop filters.
- **Vanilla JavaScript (ES6+)**: Zero framework overhead, native `fetch`, `AbortController`, `Intl.DateTimeFormat`, `localStorage`, SVG manipulation.
- **Leaflet.js (v1.9.4)**: Lightweight open-source mapping engine loaded via unpkg CDN.
- **No Build Step / No API Keys Required**: 100% client-side static application.

---

## 📡 APIs & Tile Providers Used

| Service | Endpoint / URL | Purpose | Auth / Key |
| :--- | :--- | :--- | :--- |
| **Open-Meteo Forecast** | `https://api.open-meteo.com/v1/forecast` | Current weather, hourly 24h forecast, 7-day daily forecast, timezone | **None required (Free & Open)** |
| **Open-Meteo Elevation** | `https://api.open-meteo.com/v1/elevation` | Terrain height above mean sea level | **None required (Free & Open)** |
| **Open-Meteo Geocoding** | `https://geocoding-api.open-meteo.com/v1/search` | Search autocomplete for cities, mountains, and places | **None required (Free & Open)** |
| **BigDataCloud Reverse Geocoding** | `https://api.bigdatacloud.net/data/reverse-geocode-client` | Reverse geocoding clicked coordinates to locality names | **None required (Free & Open)** |
| **CartoDB Voyager / Dark** | `https://{s}.basemaps.cartocdn.com/rastertiles/...` | Standard and Dark night map tiles | **Free with attribution** |
| **Esri World Imagery** | `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/...` | Satellite imagery map layer | **Free with attribution** |
| **OpenStreetMap** | `https://{s}.tile.openstreetmap.org/...` | Standard OSM map layer | **ODbL License** |

---

## 🚀 How to Run

### Method 1: Direct File Opening
Double-click `index.html` in your file explorer to open it in Google Chrome, Microsoft Edge, Mozilla Firefox, or Apple Safari.

### Method 2: Local Static Server (Recommended)
Using Python:
```bash
# Python 3
python -m http.server 8000
```
Or using Node `npx serve`:
```bash
npx serve .
```
Then visit: `http://localhost:8000`

---

## 📂 Project Structure

```text
/world-weather-explorer
│
├── index.html       # Semantic HTML5 layout, floating controls, modals, and SVG templates
├── style.css        # Modern glassmorphic dark theme, animations, and responsive breakpoints
├── script.js        # Modular Vanilla JS application engine & API orchestrator
└── README.md        # Documentation, feature guide, and API reference
```

---

## 🔒 Privacy & Security

- **No Tracking**: No telemetry, analytics, or third-party user tracking.
- **On-Demand Geolocation**: Location permissions are only queried if the user explicitly clicks **"My Location"**.
- **Safe DOM Injection**: All external strings are sanitized and injected via `textContent` or controlled nodes.

---

## 📜 Attribution & Licenses

- Map tiles by [OpenStreetMap](https://www.openstreetmap.org/copyright), [CARTO](https://carto.com/attributions), and [Esri](https://www.esri.com/).
- Weather & Elevation data by [Open-Meteo](https://open-meteo.com/) under [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- Typography: Outfit & Inter by Google Fonts.
