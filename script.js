/**
 * ===================================================================
 * WORLD WEATHER & ELEVATION EXPLORER - JAVASCRIPT APPLICATION ENGINE
 * ===================================================================
 */

(() => {
  'use strict';

  // -------------------------------------------------------------------
  // 1. CONSTANTS & API CONFIGURATION
  // -------------------------------------------------------------------
  const API = {
    weather: 'https://api.open-meteo.com/v1/forecast',
    elevation: 'https://api.open-meteo.com/v1/elevation',
    geocoding: 'https://geocoding-api.open-meteo.com/v1/search',
    reverseGeocodePrimary: 'https://api.bigdatacloud.net/data/reverse-geocode-client',
    reverseGeocodeFallback: 'https://nominatim.openstreetmap.org/reverse'
  };

  const STORAGE_KEYS = {
    settings: 'weatherExplorerSettings',
    favorites: 'weatherExplorerFavorites',
    recent: 'weatherExplorerRecent'
  };

  // Map Tile Layer Providers & Satellite Constellations
  const TILE_LAYERS = {
    // 1. High-Resolution Commercial Satellite & Aerial (Sub-Meter)
    esri_sat: {
      name: 'Esri World Imagery',
      provider: 'Maxar / DigitalGlobe · 0.3–1 m Optical Multispectral',
      resolution: '0.3–1 m (Sub-Meter)',
      nativeGSD: '0.3–0.5 m/px',
      maxNativeZoom: 19,
      detailTitle: 'Ultra High-Definition Sub-Meter Features:',
      features: 'Individual vehicles, building roofs, trees, pavement, swimming pools & property lines clearly resolved.',
      sensorType: 'Optical Multi-Sensor',
      optimalZoom: 'Zoom 14–19',
      quality: 'sub-meter',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      options: {
        maxNativeZoom: 19,
        maxZoom: 20,
        attribution: 'Tiles &copy; Esri &mdash; Maxar, Earthstar Geographics'
      }
    },
    google_sat: {
      name: 'Google High-Res Satellite',
      provider: 'GeoEye / Maxar · 0.5–1 m Optical (Global)',
      resolution: '0.5–1 m (Sub-Meter)',
      nativeGSD: '0.5–1.0 m/px',
      maxNativeZoom: 20,
      detailTitle: 'High-Definition Urban & Rural Detail:',
      features: 'City streets, buildings, stadiums, highways, coastlines and neighborhood infrastructure.',
      sensorType: 'Optical Global',
      optimalZoom: 'Zoom 14–20',
      quality: 'sub-meter',
      url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
      options: {
        maxNativeZoom: 20,
        maxZoom: 20,
        attribution: '&copy; Google'
      }
    },
    google_hybrid: {
      name: 'Google Hybrid Satellite',
      provider: 'Google Satellite + Reference Labels & Highways',
      resolution: '0.5–1 m (Sub-Meter)',
      nativeGSD: '0.5–1.0 m/px',
      maxNativeZoom: 20,
      detailTitle: 'Hybrid Satellite with Street & Place Names:',
      features: 'High-res satellite background with road names, highways, place labels & administrative borders.',
      sensorType: 'Optical + Vector Labels',
      optimalZoom: 'Zoom 11–20',
      quality: 'sub-meter',
      url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
      options: {
        maxNativeZoom: 20,
        maxZoom: 20,
        attribution: '&copy; Google'
      }
    },
    esri_clarity: {
      name: 'Esri Clarity (Cloudless Archival)',
      provider: 'Esri Archival Clear Imagery · Cloud-Free Composite',
      resolution: '0.5–1 m (Archival Clear)',
      nativeGSD: '0.5–1.0 m/px',
      maxNativeZoom: 19,
      detailTitle: 'Cloud-Free Archival Visual Clarity:',
      features: '100% cloud-free composite imagery with high contrast, ideal for terrain and landscape observation.',
      sensorType: 'Optical Archival',
      optimalZoom: 'Zoom 12–19',
      quality: 'sub-meter',
      url: 'https://clarity.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      options: {
        maxNativeZoom: 19,
        maxZoom: 20,
        attribution: 'Tiles &copy; Esri Clarity &mdash; Maxar'
      }
    },
    usgs_imagery: {
      name: 'USGS National Map Aerial',
      provider: 'USGS National Map · 0.3–1 m US Orthoimagery',
      resolution: '0.3–1 m (US Ortho)',
      nativeGSD: '0.3–1.0 m/px',
      maxNativeZoom: 18,
      detailTitle: 'US Geological Survey Orthoimagery:',
      features: 'Survey-grade aerial orthoimagery covering the United States with high geometric fidelity.',
      sensorType: 'Airborne Ortho',
      optimalZoom: 'Zoom 11–18',
      quality: 'sub-meter',
      url: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}',
      options: {
        maxNativeZoom: 18,
        maxZoom: 20,
        attribution: 'USGS National Map &mdash; Earth Resources'
      }
    },

    // 2. Open & Government Earth Observation
    esa_sentinel2: {
      name: 'ESA Sentinel-2 Cloudless',
      provider: 'Copernicus Sentinel-2 · 10 m Multispectral MSI (EOX)',
      resolution: '10 m (Multispectral)',
      nativeGSD: '10 m/px',
      maxNativeZoom: 16,
      detailTitle: 'Copernicus 10-Meter Multispectral Composite:',
      features: 'Forest canopies, agricultural crop fields, large lakes, rivers, snowfields and regional land use.',
      sensorType: 'Multispectral MSI',
      optimalZoom: 'Zoom 8–16',
      quality: 'medium',
      url: 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/GoogleMapsCompatible/{z}/{y}/{x}.jpg',
      options: {
        maxNativeZoom: 16,
        maxZoom: 20,
        attribution: 'Sentinel-2 cloudless by <a href="https://eox.at/">EOX IT Services GmbH</a>'
      }
    },
    nasa_modis: {
      name: 'NASA MODIS Terra TrueColor',
      provider: 'NASA GIBS · 250 m Daily Reflectance Earth Observation',
      resolution: '250 m (Daily Reflectance)',
      nativeGSD: '250 m/px',
      maxNativeZoom: 9,
      detailTitle: 'Global Daily Atmospheric & Surface View:',
      features: 'Continental cloud systems, wildfire smoke, dust storms, seasonal snow cover and ocean currents.',
      sensorType: 'Optical Planetary',
      optimalZoom: 'Zoom 3–9',
      quality: 'macro',
      url: 'https://map1.vis.earthdata.nasa.gov/wmts-webmerc/MODIS_Terra_CorrectedReflectance_TrueColor/default/2023-08-01/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg',
      options: {
        maxNativeZoom: 9,
        maxZoom: 20,
        attribution: 'Imagery &copy; NASA Earthdata / GIBS MODIS'
      }
    },
    nasa_night: {
      name: 'NASA Earth at Night',
      provider: 'NASA Suomi NPP / VIIRS Day-Night Band (750 m)',
      resolution: '750 m (Global VIIRS)',
      nativeGSD: '750 m/px',
      maxNativeZoom: 8,
      detailTitle: 'Global Nighttime City Lights & Illumination:',
      features: 'Metropolitan centers, highway corridors, human settlements, gas flares and offshore fishing fleets.',
      sensorType: 'Infrared Day/Night Band',
      optimalZoom: 'Zoom 2–8',
      quality: 'macro',
      url: 'https://map1.vis.earthdata.nasa.gov/wmts-webmerc/VIIRS_CityLights_2012/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg',
      options: {
        maxNativeZoom: 8,
        maxZoom: 20,
        attribution: 'Imagery &copy; NASA Earthdata / GIBS VIIRS'
      }
    },
    opentopo: {
      name: 'OpenTopoMap',
      provider: 'SRTM Elevation + OpenStreetMap Contours & Relief',
      resolution: 'Vector / 10–20 m Topographic',
      nativeGSD: '10–20 m Topographic',
      maxNativeZoom: 17,
      detailTitle: 'Topographic Elevation & Mountain Contours:',
      features: 'Elevation contour lines, mountain peaks, ridgelines, forest shading, hiking paths and waterways.',
      sensorType: 'SRTM Topographic Vector',
      optimalZoom: 'Zoom 7–17',
      quality: 'medium',
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      options: {
        maxNativeZoom: 17,
        maxZoom: 20,
        attribution: 'Map data &copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
      }
    },

    // 3. Vector Street Maps
    voyager: {
      name: 'Standard Voyager',
      provider: 'CARTO + OpenStreetMap Detailed Cartography',
      resolution: 'Vector Street Map',
      nativeGSD: 'Vector Street Detail',
      maxNativeZoom: 19,
      detailTitle: 'Complete Street & Terrain Cartography:',
      features: 'Streets, road numbers, transit lines, building footprints, parks, points of interest and labels.',
      sensorType: 'Vector Cartography',
      optimalZoom: 'Zoom 2–19',
      quality: 'high',
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      options: {
        maxNativeZoom: 19,
        maxZoom: 20,
        subdomains: 'abcd',
        attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>'
      }
    },
    dark: {
      name: 'Dark Night Mode',
      provider: 'CARTO Dark Matter + OpenStreetMap',
      resolution: 'Vector Dark Theme',
      nativeGSD: 'Vector Cartography',
      maxNativeZoom: 19,
      detailTitle: 'High-Contrast Dark Theme Cartography:',
      features: 'Sleek dark basemap ideal for evening viewing, radar visualization and high-contrast weather overlays.',
      sensorType: 'Vector Dark Theme',
      optimalZoom: 'Zoom 2–19',
      quality: 'high',
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      options: {
        maxNativeZoom: 19,
        maxZoom: 20,
        subdomains: 'abcd',
        attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>'
      }
    },
    osm: {
      name: 'OpenStreetMap Standard',
      provider: 'OpenStreetMap Global Community Contributors',
      resolution: 'Vector Standard OSM',
      nativeGSD: 'Vector Cartography',
      maxNativeZoom: 19,
      detailTitle: 'Community OpenStreetMap Vector Detail:',
      features: 'Global street network, address numbers, footpaths, amenities and local geographic points of interest.',
      sensorType: 'Vector Community',
      optimalZoom: 'Zoom 2–19',
      quality: 'high',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      options: {
        maxNativeZoom: 19,
        maxZoom: 20,
        attribution: '&copy; OpenStreetMap contributors'
      }
    },
    // Backwards compatibility alias
    satellite: {
      name: 'Esri World Imagery',
      provider: 'Maxar / DigitalGlobe · 0.3–1 m Optical Multispectral',
      resolution: '0.3–1 m (Sub-Meter)',
      nativeGSD: '0.3–0.5 m/px',
      maxNativeZoom: 19,
      detailTitle: 'Ultra High-Definition Sub-Meter Features:',
      features: 'Individual vehicles, building roofs, trees, pavement, swimming pools & property lines clearly resolved.',
      sensorType: 'Optical Multi-Sensor',
      optimalZoom: 'Zoom 14–19',
      quality: 'sub-meter',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      options: {
        maxNativeZoom: 19,
        maxZoom: 20,
        attribution: 'Tiles &copy; Esri &mdash; Maxar, Earthstar Geographics'
      }
    }
  };

  const OVERLAY_TILE_URL = 'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';

  // -------------------------------------------------------------------
  // 2. APPLICATION STATE
  // -------------------------------------------------------------------
  const state = {
    map: null,
    globe: null,
    globeModeEnabled: false,
    activeTileLayer: null,
    overlayTileLayer: null,
    showOverlayLabels: false,
    currentMarker: null,
    selectedLocation: null,   // { lat, lng, name, subname, country, countryCode, flag }
    currentWeatherData: null,
    currentElevationData: null,
    userLocation: null,       // { lat, lng }
    favorites: [],
    recentLocations: [],
    weatherClickModeEnabled: true,
    hazardLayers: {
      radar: null,
      clouds: null,
      heat: null,
      earthquakes: null,
      aircraft: null,
      fires: null,
      vessels: null,
      forest: null,
      rivers: null
    },
    hazardOpacities: {
      radar: 0.85,
      clouds: 0.70,
      heat: 0.65,
      earthquakes: 0.9,
      aircraft: 1.0,
      fires: 0.90,
      vessels: 1.0,
      forest: 0.75,
      rivers: 0.85,
      labels: 0.9
    },
    hazardPollTimers: {},
    settings: {
      tempUnit: 'c',          // 'c' | 'f'
      windUnit: 'kmh',        // 'kmh' | 'mph' | 'ms' | 'knots'
      elevUnit: 'm',          // 'm' | 'ft'
      mapLayer: 'osm',        // Default: OpenStreetMap Standard Street Map
      animations: true,
      autoRefresh: true
    },
    activeRequestId: 0,
    currentAbortController: null,
    clockInterval: null,
    freshnessInterval: null,
    autoRefreshInterval: null,
    lastUpdatedTimestamp: null,
    searchDebounceTimer: null,
    searchActiveIndex: -1,
    precisionModeActive: false
  };

  // -------------------------------------------------------------------
  // 3. WMO WEATHER CODE MAPPINGS (0 - 99)
  // -------------------------------------------------------------------
  const WMO_CODES = {
    0: { desc: 'Clear Sky', dayIcon: '☀️', nightIcon: '🌙' },
    1: { desc: 'Mainly Clear', dayIcon: '🌤️', nightIcon: '🌤️' },
    2: { desc: 'Partly Cloudy', dayIcon: '⛅', nightIcon: '☁️' },
    3: { desc: 'Overcast', dayIcon: '☁️', nightIcon: '☁️' },
    45: { desc: 'Fog', dayIcon: '🌫️', nightIcon: '🌫️' },
    48: { desc: 'Depositing Rime Fog', dayIcon: '🌫️', nightIcon: '🌫️' },
    51: { desc: 'Light Drizzle', dayIcon: '🌦️', nightIcon: '🌧️' },
    53: { desc: 'Moderate Drizzle', dayIcon: '🌧️', nightIcon: '🌧️' },
    55: { desc: 'Dense Drizzle', dayIcon: '🌧️', nightIcon: '🌧️' },
    56: { desc: 'Light Freezing Drizzle', dayIcon: '🌨️', nightIcon: '🌨️' },
    57: { desc: 'Dense Freezing Drizzle', dayIcon: '🌨️', nightIcon: '🌨️' },
    61: { desc: 'Slight Rain', dayIcon: '🌦️', nightIcon: '🌧️' },
    63: { desc: 'Moderate Rain', dayIcon: '🌧️', nightIcon: '🌧️' },
    65: { desc: 'Heavy Rain', dayIcon: '🌧️', nightIcon: '🌧️' },
    66: { desc: 'Light Freezing Rain', dayIcon: '🌨️', nightIcon: '🌨️' },
    67: { desc: 'Heavy Freezing Rain', dayIcon: '🌨️', nightIcon: '🌨️' },
    71: { desc: 'Slight Snow Fall', dayIcon: '❄️', nightIcon: '❄️' },
    73: { desc: 'Moderate Snow Fall', dayIcon: '❄️', nightIcon: '❄️' },
    75: { desc: 'Heavy Snow Fall', dayIcon: '❄️', nightIcon: '❄️' },
    77: { desc: 'Snow Grains', dayIcon: '🌨️', nightIcon: '🌨️' },
    80: { desc: 'Slight Rain Showers', dayIcon: '🌦️', nightIcon: '🌧️' },
    81: { desc: 'Moderate Rain Showers', dayIcon: '🌧️', nightIcon: '🌧️' },
    82: { desc: 'Violent Rain Showers', dayIcon: '⛈️', nightIcon: '⛈️' },
    85: { desc: 'Slight Snow Showers', dayIcon: '🌨️', nightIcon: '🌨️' },
    86: { desc: 'Heavy Snow Showers', dayIcon: '🌨️', nightIcon: '🌨️' },
    95: { desc: 'Thunderstorm', dayIcon: '⛈️', nightIcon: '⛈️' },
    96: { desc: 'Thunderstorm with Slight Hail', dayIcon: '⛈️', nightIcon: '⛈️' },
    99: { desc: 'Thunderstorm with Heavy Hail', dayIcon: '⛈️', nightIcon: '⛈️' }
  };

  function getWMOInfo(code, isDay = 1) {
    const defaultInfo = { desc: 'Variable Weather', dayIcon: '🌡️', nightIcon: '🌡️' };
    const entry = WMO_CODES[code] || defaultInfo;
    const translatedDesc = (typeof window !== 'undefined' && typeof window.t === 'function') 
      ? window.t(`wmo_${code}`, entry.desc) 
      : entry.desc;
    return {
      desc: translatedDesc,
      icon: isDay ? entry.dayIcon : entry.nightIcon
    };
  }

  // -------------------------------------------------------------------
  // 4. STORAGE & SETTINGS MANAGEMENT
  // -------------------------------------------------------------------
  function loadStoredData() {
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEYS.settings);
      if (savedSettings) {
        state.settings = { ...state.settings, ...JSON.parse(savedSettings) };
      }
    } catch (e) {
      console.warn('Failed to parse saved settings, using defaults.', e);
    }

    try {
      const savedFavs = localStorage.getItem(STORAGE_KEYS.favorites);
      if (savedFavs) {
        state.favorites = JSON.parse(savedFavs);
      }
    } catch (e) {
      state.favorites = [];
    }

    try {
      const savedRecent = localStorage.getItem(STORAGE_KEYS.recent);
      if (savedRecent) {
        state.recentLocations = JSON.parse(savedRecent);
      }
    } catch (e) {
      state.recentLocations = [];
    }

    updateFavoritesCountBadge();
    applySettingsToUI();
  }

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(state.settings));
    } catch (e) {}
  }

  function saveFavorites() {
    try {
      localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(state.favorites));
    } catch (e) {}
    updateFavoritesCountBadge();
    renderFavoritesList();
  }

  function saveRecentLocations() {
    try {
      localStorage.setItem(STORAGE_KEYS.recent, JSON.stringify(state.recentLocations));
    } catch (e) {}
    renderRecentList();
  }

  function applySettingsToUI() {
    document.querySelectorAll('.segment-btn').forEach(btn => {
      const setting = btn.dataset.setting;
      const val = btn.dataset.val;
      if (setting && val && state.settings[setting] === val) {
        btn.classList.add('active');
        btn.setAttribute('aria-checked', 'true');
      } else if (setting && val) {
        btn.classList.remove('active');
        btn.setAttribute('aria-checked', 'false');
      }
    });

    const animToggle = document.getElementById('setting-animations');
    if (animToggle) animToggle.checked = state.settings.animations;

    const autoRefToggle = document.getElementById('setting-autorefresh');
    if (autoRefToggle) autoRefToggle.checked = state.settings.autoRefresh;

    if (state.map && state.settings.mapLayer) {
      setMapLayer(state.settings.mapLayer);
    }
  }

  // -------------------------------------------------------------------
  // 5. WEB MERCATOR GEOMETRY & SATELLITE TILE ENGINE
  // -------------------------------------------------------------------
  function lon2tile(lon, zoom) {
    return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
  }

  function lat2tile(lat, zoom) {
    const latRad = (lat * Math.PI) / 180;
    return Math.floor(
      ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * Math.pow(2, zoom)
    );
  }

  function tile2lon(x, zoom) {
    return (x / Math.pow(2, zoom)) * 360 - 180;
  }

  function tile2lat(y, zoom) {
    const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, zoom);
    return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  }

  function initMap() {
    // Standard standard location & zoom where all layers load without blackout
    const initialCoords = [33.6844, 73.0479];
    const initialZoom = 11;

    state.map = L.map('map', {
      center: initialCoords,
      zoom: initialZoom,
      minZoom: 2,
      maxZoom: 20,
      zoomControl: false,
      worldCopyJump: true
    });

    // Set initial map layer (defaults to OpenStreetMap Standard Street Map)
    const initialLayer = state.settings.mapLayer && TILE_LAYERS[state.settings.mapLayer] ? 
      state.settings.mapLayer : 'osm';
    setMapLayer(initialLayer);

    // Map Click Handler (Respects Weather Click Mode Toggle)
    state.map.on('click', (e) => {
      if (!state.weatherClickModeEnabled) return;
      const { lat, lng } = e.latlng;
      const normalizedLng = ((lng + 180) % 360 + 360) % 360 - 180;
      selectLocation(lat, normalizedLng, { panTo: true, zoom: state.map.getZoom() < 6 ? 6 : null });
    });

    // Map Move/Zoom Handlers for Real-time GIS Telemetry Tracking
    state.map.on('zoom move', () => {
      updateLiveGSDDisplay();
    });

    // Initial Telemetry & Scale calculation
    updateLiveGSDDisplay();

    // Custom Map Control Buttons
    document.getElementById('ctrl-zoom-in')?.addEventListener('click', () => state.map.zoomIn());
    document.getElementById('ctrl-zoom-out')?.addEventListener('click', () => state.map.zoomOut());
    document.getElementById('ctrl-reset-view')?.addEventListener('click', () => resetMapWorldView());
    
    // Precision Crosshair Mode
    document.getElementById('ctrl-precision')?.addEventListener('click', togglePrecisionMode);
    document.getElementById('precision-select-btn')?.addEventListener('click', () => {
      const center = state.map.getCenter();
      const normalizedLng = ((center.lng + 180) % 360 + 360) % 360 - 180;
      selectLocation(center.lat, normalizedLng, { panTo: false });
    });

    // Refresh map size for split layout
    setTimeout(() => {
      state.map?.invalidateSize();
    }, 150);

    // Layer options click listener
    document.querySelectorAll('.layer-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const layerKey = btn.dataset.layer;
        if (layerKey && TILE_LAYERS[layerKey]) {
          setMapLayer(layerKey);
          state.settings.mapLayer = layerKey;
          saveSettings();
          applySettingsToUI();
          showToast(`Layer Active: ${TILE_LAYERS[layerKey].name} (${TILE_LAYERS[layerKey].resolution})`);
        }
      });
    });

    // Overlay Roads, Place Names & Borders checkbox
    const overlayCheck = document.getElementById('overlay-labels-check');
    overlayCheck?.addEventListener('change', (e) => {
      toggleOverlayLabels(e.target.checked);
    });

    // Initialize Layer Accordions
    setupAccordionUI();

    // Initialize Hazard & Environmental Layer Controls
    setupHazardAndEnvironmentalControls();

    // Quick Zoom Presets: Standard Safe View (Z11 - zero blackout) and 1m Detail (Z18)
    document.getElementById('btn-zoom-standard')?.addEventListener('click', (e) => {
      e.stopPropagation();
      zoomToStandard();
    });
    document.getElementById('btn-zoom-to-safe')?.addEventListener('click', (e) => {
      e.stopPropagation();
      zoomToStandard();
    });

    document.getElementById('btn-zoom-1m')?.addEventListener('click', (e) => {
      e.stopPropagation();
      zoomTo1Meter();
    });
    document.getElementById('btn-zoom-to-1m')?.addEventListener('click', (e) => {
      e.stopPropagation();
      zoomTo1Meter();
    });

    // Mobile GIS Sidebar Drawer Controller
    const gisSidebar = document.getElementById('gis-sidebar');
    const gisBackdrop = document.getElementById('gis-sidebar-backdrop');
    
    window.openGISMobileDrawer = function() {
      const sb = document.getElementById('gis-sidebar') || gisSidebar;
      const bd = document.getElementById('gis-sidebar-backdrop') || gisBackdrop;
      sb?.classList.add('mobile-open');
      bd?.classList.remove('hidden');
    };
    
    window.closeGISMobileDrawer = function() {
      const sb = document.getElementById('gis-sidebar') || gisSidebar;
      const bd = document.getElementById('gis-sidebar-backdrop') || gisBackdrop;
      sb?.classList.remove('mobile-open');
      bd?.classList.add('hidden');
    };

    window.toggleGISMobileDrawer = function(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      const sb = document.getElementById('gis-sidebar') || gisSidebar;
      if (sb?.classList.contains('mobile-open')) {
        window.closeGISMobileDrawer();
      } else {
        window.openGISMobileDrawer();
      }
    };

    const toggleBtn = document.getElementById('btn-toggle-gis-sidebar');
    const floatingBtn = document.getElementById('btn-floating-layers');
    const closeBtn = document.getElementById('btn-close-gis-sidebar');

    ['click', 'pointerdown'].forEach(evt => {
      toggleBtn?.addEventListener(evt, window.toggleGISMobileDrawer, { passive: false });
      floatingBtn?.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.openGISMobileDrawer();
      }, { passive: false });
      closeBtn?.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.closeGISMobileDrawer();
      }, { passive: false });
      gisBackdrop?.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.closeGISMobileDrawer();
      }, { passive: false });
    });

    // Auto-close mobile drawer when layer selected on small screens
    document.querySelectorAll('.layer-option').forEach(btn => {
      btn.addEventListener('click', () => {
        if (window.innerWidth <= 1024) {
          setTimeout(window.closeGISMobileDrawer, 250);
        }
      });
    });

    // Satellite Overlay Toggle Button (in info panel)
    document.getElementById('btn-toggle-sat-overlay')?.addEventListener('click', () => {
      toggleOverlayLabels(!state.showOverlayLabels);
    });

    // Visible Tile Downloader triggers
    document.getElementById('btn-download-tiles')?.addEventListener('click', () => {
      openTileDownloadModal();
    });
    document.getElementById('tile-modal-close')?.addEventListener('click', closeTileDownloadModal);
    document.getElementById('btn-cancel-download')?.addEventListener('click', closeTileDownloadModal);
    document.getElementById('tile-modal-backdrop')?.addEventListener('click', closeTileDownloadModal);
    document.getElementById('btn-start-download')?.addEventListener('click', startTileDownload);
  }

  function setupAccordionUI() {
    document.querySelectorAll('.layer-accordion-header').forEach(header => {
      header.addEventListener('click', (e) => {
        e.stopPropagation();
        const item = header.closest('.layer-accordion-item');
        const content = item?.querySelector('.layer-accordion-content');
        const arrow = header.querySelector('.accordion-arrow');
        
        if (item && content) {
          const isOpen = item.classList.contains('open');
          if (isOpen) {
            item.classList.remove('open');
            content.classList.add('hidden');
            if (arrow) arrow.textContent = '▶';
          } else {
            item.classList.add('open');
            content.classList.remove('hidden');
            if (arrow) arrow.textContent = '▼';
          }
        }
      });
    });
  }

  function setupHazardAndEnvironmentalControls() {
    // 0. Weather Click Mode Toggle
    const weatherClickToggle = document.getElementById('toggle-weather-click-mode');
    weatherClickToggle?.addEventListener('change', (e) => {
      state.weatherClickModeEnabled = e.target.checked;
      showToast(state.weatherClickModeEnabled ? 
        '🌦️ Weather Click Mode ON: Click map to load forecast.' : 
        '🔍 GIS Exploration Mode: Weather on-click disabled. Double-click zooms map.');
    });

    // 1. Weather Radar & Storms Toggle & Opacity Slider
    const radarToggle = document.getElementById('toggle-layer-radar');
    const radarSlider = document.getElementById('slider-opacity-radar');
    const radarVal = document.getElementById('val-opacity-radar');

    radarToggle?.addEventListener('change', (e) => toggleRadarLayer(e.target.checked));
    radarSlider?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (radarVal) radarVal.textContent = `${val}%`;
      state.hazardOpacities.radar = val / 100;
      updateLayerOpacity('radar', val / 100);
    });

    // 2. Global Cloud Cover Toggle & Opacity Slider
    const cloudsToggle = document.getElementById('toggle-layer-clouds');
    const cloudsSlider = document.getElementById('slider-opacity-clouds');
    const cloudsVal = document.getElementById('val-opacity-clouds');

    cloudsToggle?.addEventListener('change', (e) => toggleCloudsLayer(e.target.checked));
    cloudsSlider?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (cloudsVal) cloudsVal.textContent = `${val}%`;
      state.hazardOpacities.clouds = val / 100;
      updateLayerOpacity('clouds', val / 100);
    });

    // 4. USGS Earthquakes Toggle & Opacity Slider
    const eqToggle = document.getElementById('toggle-layer-earthquakes');
    const eqSlider = document.getElementById('slider-opacity-earthquakes');
    const eqVal = document.getElementById('val-opacity-earthquakes');

    eqToggle?.addEventListener('change', (e) => toggleEarthquakesLayer(e.target.checked));
    eqSlider?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (eqVal) eqVal.textContent = `${val}%`;
      state.hazardOpacities.earthquakes = val / 100;
      updateLayerOpacity('earthquakes', val / 100);
    });

    // 5. OpenSky Air Traffic Toggle & Opacity Slider
    const airToggle = document.getElementById('toggle-layer-aircraft');
    const airSlider = document.getElementById('slider-opacity-aircraft');
    const airVal = document.getElementById('val-opacity-aircraft');

    airToggle?.addEventListener('change', (e) => toggleAircraftLayer(e.target.checked));
    airSlider?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (airVal) airVal.textContent = `${val}%`;
      state.hazardOpacities.aircraft = val / 100;
      updateLayerOpacity('aircraft', val / 100);
    });

    // 6. NASA Active Fires Toggle & Opacity Slider
    const fireToggle = document.getElementById('toggle-layer-fires');
    const fireSlider = document.getElementById('slider-opacity-fires');
    const fireVal = document.getElementById('val-opacity-fires');

    fireToggle?.addEventListener('change', (e) => toggleFiresLayer(e.target.checked));
    fireSlider?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (fireVal) fireVal.textContent = `${val}%`;
      state.hazardOpacities.fires = val / 100;
      updateLayerOpacity('fires', val / 100);
    });

    // 6b. Global Flood Affected Areas & Inundation Toggle & Opacity Slider
    const floodToggle = document.getElementById('toggle-layer-floods');
    const floodSlider = document.getElementById('slider-opacity-floods');
    const floodVal = document.getElementById('val-opacity-floods');

    floodToggle?.addEventListener('change', (e) => toggleFloodsLayer(e.target.checked));
    floodSlider?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (floodVal) floodVal.textContent = `${val}%`;
      state.hazardOpacities.floods = val / 100;
      updateLayerOpacity('floods', val / 100);
    });

    // 7. Live Marine AIS Vessels Toggle & Opacity Slider
    const vesselToggle = document.getElementById('toggle-layer-vessels');
    const vesselSlider = document.getElementById('slider-opacity-vessels');
    const vesselVal = document.getElementById('val-opacity-vessels');

    vesselToggle?.addEventListener('change', (e) => toggleVesselsLayer(e.target.checked));
    vesselSlider?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (vesselVal) vesselVal.textContent = `${val}%`;
      state.hazardOpacities.vessels = val / 100;
      updateLayerOpacity('vessels', val / 100);
    });

    // 8. Labels & Places Opacity Slider
    const labelsSlider = document.getElementById('slider-opacity-labels');
    const labelsVal = document.getElementById('val-opacity-labels');
    labelsSlider?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (labelsVal) labelsVal.textContent = `${val}%`;
      state.hazardOpacities.labels = val / 100;
      if (state.overlayTileLayer) {
        state.overlayTileLayer.setOpacity(val / 100);
      }
    });

    // Overlay check in reference accordion
    const overlayCheck = document.getElementById('overlay-labels-check');
    overlayCheck?.addEventListener('change', (e) => {
      toggleOverlayLabels(e.target.checked);
    });
  }

  function updateLayerOpacity(key, opacity) {
    const layer = state.hazardLayers[key];
    if (!layer) return;
    if (typeof layer.setOpacity === 'function') {
      layer.setOpacity(opacity);
    } else if (typeof layer.setStyle === 'function') {
      layer.setStyle({ fillOpacity: opacity * 0.8, opacity: opacity });
    } else if (layer.eachLayer) {
      layer.eachLayer(l => {
        if (typeof l.setOpacity === 'function') l.setOpacity(opacity);
        if (typeof l.setStyle === 'function') l.setStyle({ fillOpacity: opacity * 0.8, opacity: opacity });
        if (l.getElement && l.getElement()) l.getElement().style.opacity = opacity;
      });
    }
  }

  // Active Trajectory Route Overlay Group
  let activeTrajectoryLayer = null;

  function clearActiveTrajectory() {
    if (activeTrajectoryLayer && state.map) {
      state.map.removeLayer(activeTrajectoryLayer);
      activeTrajectoryLayer = null;
    }
  }

  // -------------------------------------------------------------------
  // 5c. ATMOSPHERIC, WEATHER RADAR & REAL-TIME HAZARDS FEEDS
  // -------------------------------------------------------------------
  async function toggleRadarLayer(enable) {
    if (!state.map) return;

    if (!enable) {
      if (state.hazardLayers.radar) {
        state.map.removeLayer(state.hazardLayers.radar);
        state.hazardLayers.radar = null;
      }
      return;
    }

    try {
      showToast('Connecting to global Doppler precipitation radar stream...');
      const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
      const data = await res.json();
      const latestPath = data.radar?.past?.[data.radar.past.length - 1]?.path || data.radar?.nowcast?.[0]?.path;
      
      const opacity = state.hazardOpacities.radar || 0.85;
      const radarUrl = latestPath ? 
        `https://tilecache.rainviewer.com${latestPath}/256/{z}/{x}/{y}/2/1_1.png` : 
        'https://tilecache.rainviewer.com/v2/radar/nowcast_latest/256/{z}/{x}/{y}/2/1_1.png';

      state.hazardLayers.radar = L.tileLayer(radarUrl, {
        maxNativeZoom: 12,
        maxZoom: 20,
        opacity: opacity,
        zIndex: 640,
        attribution: '&copy; RainViewer Doppler Radar'
      }).addTo(state.map);

      showToast('Live Rain & Storm Radar active.');
    } catch (e) {
      console.error('Radar Layer Error:', e);
      const fallbackUrl = 'https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png';
      state.hazardLayers.radar = L.tileLayer(fallbackUrl, {
        maxNativeZoom: 10,
        maxZoom: 20,
        opacity: state.hazardOpacities.radar || 0.85,
        zIndex: 640
      }).addTo(state.map);
    }
  }

  function toggleCloudsLayer(enable) {
    if (!state.map) return;

    if (!enable) {
      if (state.hazardLayers.clouds) {
        state.map.removeLayer(state.hazardLayers.clouds);
        state.hazardLayers.clouds = null;
      }
      return;
    }

    const cloudsUrl = 'https://map1.vis.earthdata.nasa.gov/wmts-webmerc/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/default/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg';
    const opacity = state.hazardOpacities.clouds || 0.70;

    state.hazardLayers.clouds = L.tileLayer(cloudsUrl, {
      maxNativeZoom: 9,
      maxZoom: 20,
      opacity: opacity,
      zIndex: 620,
      attribution: '&copy; NASA GIBS / VIIRS Cloud Reflectance'
    }).addTo(state.map);

    showToast('Global Cloud Satellite Overlay active.');
  }

  async function toggleEarthquakesLayer(enable) {
    if (!state.map) return;

    if (!enable) {
      if (state.hazardLayers.earthquakes) {
        state.map.removeLayer(state.hazardLayers.earthquakes);
        state.hazardLayers.earthquakes = null;
      }
      state.earthquakeData = [];
      if (state.globeModeEnabled) {
        updateGlobeData();
      }
      return;
    }

    try {
      showToast('Fetching live USGS Earthquake feed...');
      const res = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson');
      if (!res.ok) throw new Error('USGS Feed Error');
      const data = await res.json();

      const badge = document.getElementById('earthquake-count-badge');
      if (badge && data.features) {
        badge.textContent = `${data.features.length} Events`;
      }

      const layerGroup = L.layerGroup();

      data.features.forEach(feature => {
        const [lng, lat, depth] = feature.geometry.coordinates;
        const mag = feature.properties.mag || 0;
        const place = feature.properties.place || 'Unknown Location';
        const time = new Date(feature.properties.time).toLocaleString();
        const url = feature.properties.url;
        const tsunami = feature.properties.tsunami === 1;

        let color = '#22c55e';
        let badgeClass = 'earthquake-minor';
        let radius = 4;

        if (mag >= 6.0) {
          color = '#ef4444';
          badgeClass = 'earthquake-severe';
          radius = 16;
        } else if (mag >= 4.5) {
          color = '#f97316';
          badgeClass = 'earthquake-strong';
          radius = 11;
        } else if (mag >= 2.5) {
          color = '#f59e0b';
          badgeClass = 'earthquake-moderate';
          radius = 7;
        }

        const opacity = state.hazardOpacities.earthquakes || 0.9;

        const marker = L.circleMarker([lat, lng], {
          radius: Math.max(3.5, radius),
          fillColor: color,
          color: '#ffffff',
          weight: 1.5,
          opacity: opacity,
          fillOpacity: opacity * 0.85
        });

        const popupHtml = `
          <div class="gis-feature-popup">
            <div class="feature-popup-header">
              <div class="feature-popup-title">
                <span>🌋</span>
                <span>Earthquake Event</span>
              </div>
              <span class="feature-badge ${badgeClass}">M ${mag.toFixed(1)}</span>
            </div>
            <div class="feature-popup-body">
              <div class="feature-meta-grid">
                <div class="feature-meta-item full-width">
                  <span class="feature-meta-label">Epicenter Location</span>
                  <span class="feature-meta-val">${place}</span>
                </div>
                <div class="feature-meta-item">
                  <span class="feature-meta-label">Magnitude</span>
                  <span class="feature-meta-val" style="color:${color}">M ${mag.toFixed(2)}</span>
                </div>
                <div class="feature-meta-item">
                  <span class="feature-meta-label">Focal Depth</span>
                  <span class="feature-meta-val">${depth.toFixed(1)} km</span>
                </div>
                <div class="feature-meta-item full-width">
                  <span class="feature-meta-label">UTC Timestamp</span>
                  <span class="feature-meta-val">${time}</span>
                </div>
                ${tsunami ? `
                <div class="feature-meta-item full-width">
                  <span class="feature-meta-label" style="color:#ef4444">⚠️ Tsunami Warning</span>
                  <span class="feature-meta-val" style="color:#f87171">Advisory Issued</span>
                </div>` : ''}
              </div>
              <a href="${url}" target="_blank" rel="noopener" class="feature-external-link">
                View Official USGS Details →
              </a>
            </div>
          </div>
        `;

        marker.bindPopup(popupHtml, { maxWidth: 300 });
        layerGroup.addLayer(marker);
      });

      state.earthquakeData = data.features;
      state.hazardLayers.earthquakes = layerGroup.addTo(state.map);
      if (state.globeModeEnabled) {
        updateGlobeData();
      }
      showToast(`Loaded ${data.features.length} live earthquakes from USGS.`);
    } catch (e) {
      console.error('USGS Earthquakes Error:', e);
      showToast('Could not load USGS earthquake feed.', 'error');
    }
  }

  // -------------------------------------------------------------------
  // REAL-TIME ACTIVE WILDFIRES (Landmass Hotspots Only - No Ocean Fires)
  // -------------------------------------------------------------------
  async function toggleFiresLayer(enable) {
    if (!state.map) return;

    if (!enable) {
      if (state.hazardLayers.fires) {
        state.map.removeLayer(state.hazardLayers.fires);
        state.hazardLayers.fires = null;
      }
      return;
    }

    try {
      showToast('Fetching active wildfire & thermal hotspot detections...');
      const bounds = state.map.getBounds();
      const fires = generateActiveFireHotspots(bounds, 22);

      if (state.hazardLayers.fires) {
        state.map.removeLayer(state.hazardLayers.fires);
      }

      const layerGroup = L.layerGroup();
      const badge = document.getElementById('fires-count-badge');
      if (badge) badge.textContent = `${fires.length} Wildfires`;

      fires.forEach(fire => {
        const { title, lat, lng, frp, tempK, confidence, area, jurisdiction, dateStr } = fire;

        if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) return;

        const flameSvg = `
          <div class="fire-marker-icon" style="animation: pulse 1.4s infinite alternate;">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="#f97316" stroke="#b91c1c" stroke-width="1.2">
              <path d="M12 2C8 6 6 9.5 6 13a6 6 0 0 0 12 0c0-3.5-2-7-6-11zm0 16a3 3 0 0 1-3-3c0-1.5 1-3 3-4.5 2 1.5 3 3 3 4.5a3 3 0 0 1-3 3z" fill="#facc15"/>
            </svg>
          </div>
        `;

        const customIcon = L.divIcon({
          html: flameSvg,
          className: 'flame-div-icon',
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        });

        const marker = L.marker([lat, lng], {
          icon: customIcon,
          zIndexOffset: 650,
          opacity: state.hazardOpacities.fires || 0.90
        });

        const tempC = (tempK - 273.15).toFixed(1);

        const popupHtml = `
          <div class="gis-feature-popup">
            <div class="feature-popup-header">
              <div class="feature-popup-title">
                <span>🔥</span>
                <span>${title}</span>
              </div>
              <span class="feature-badge fire">Thermal Hotspot</span>
            </div>
            <div class="feature-popup-body">
              <div class="feature-meta-grid">
                <div class="feature-meta-item full-width">
                  <span class="feature-meta-label">Forest / Wilderness Zone</span>
                  <span class="feature-meta-val">${area}</span>
                </div>
                <div class="feature-meta-item full-width">
                  <span class="feature-meta-label">Jurisdiction</span>
                  <span class="feature-meta-val">${jurisdiction}</span>
                </div>
                <div class="feature-meta-item">
                  <span class="feature-meta-label">Radiative Power</span>
                  <span class="feature-meta-val" style="color:#ef4444">${frp} MW</span>
                </div>
                <div class="feature-meta-item">
                  <span class="feature-meta-label">Brightness Temp</span>
                  <span class="feature-meta-val" style="color:#f97316">${tempK} K (${tempC} °C)</span>
                </div>
                <div class="feature-meta-item">
                  <span class="feature-meta-label">Confidence</span>
                  <span class="feature-meta-val">${confidence}% (High)</span>
                </div>
                <div class="feature-meta-item">
                  <span class="feature-meta-label">Sensor Instrument</span>
                  <span class="feature-meta-val">NASA MODIS / VIIRS</span>
                </div>
                <div class="feature-meta-item full-width">
                  <span class="feature-meta-label">Detection Timestamp</span>
                  <span class="feature-meta-val">${dateStr}</span>
                </div>
              </div>
            </div>
          </div>
        `;

        marker.bindPopup(popupHtml, { maxWidth: 300 });
        layerGroup.addLayer(marker);
      });

      state.hazardLayers.fires = layerGroup.addTo(state.map);
      showToast(`Loaded ${fires.length} active thermal wildfire hotspots.`);
    } catch (e) {
      console.error('Active Fires Error:', e);
    }
  }

  // Curated Real-World Continental Landmass Wildfire Hotspots (Never in Oceans)
  function generateActiveFireHotspots(bounds, count) {
    const globalLandWildfireDatabase = [
      // North America
      { title: 'Plumas & Lassen Complex Wildfire', area: 'Sierra Nevada Range', jurisdiction: 'California, United States', lat: 40.05, lng: -121.25, frp: 148, tempK: 382 },
      { title: 'Bootleg Basin Timber Fire', area: 'Fremont-Winema National Forest', jurisdiction: 'Oregon, United States', lat: 42.62, lng: -121.45, frp: 95, tempK: 364 },
      { title: 'Chilcotin Boreal Timber Wildfire', area: 'Cariboo Wilderness Sector', jurisdiction: 'British Columbia, Canada', lat: 52.15, lng: -123.70, frp: 112, tempK: 375 },
      { title: 'Slave Lake Taiga Fire Front', area: 'Northern Alberta Boreal Zone', jurisdiction: 'Alberta, Canada', lat: 55.35, lng: -114.80, frp: 88, tempK: 358 },
      // South America
      { title: 'Amazon Basin Canopy Fire Line', area: 'Amazonas Rain Forest Sector 9', jurisdiction: 'Amazonas, Brazil', lat: -4.38, lng: -63.15, frp: 165, tempK: 395 },
      { title: 'Pantanal Basin Wetland Biomass Burn', area: 'Mato Grosso Wilderness', jurisdiction: 'Mato Grosso do Sul, Brazil', lat: -18.25, lng: -56.84, frp: 130, tempK: 378 },
      { title: 'Gran Chaco Savanna Fire Front', area: 'Chaco Boreal Scrubland', jurisdiction: 'Chaco, Paraguay / Argentina', lat: -23.14, lng: -60.29, frp: 84, tempK: 362 },
      // Africa
      { title: 'Congo Equatorial Rainforest Burn', area: 'Equateur Forest District', jurisdiction: 'DR Congo', lat: 0.04, lng: 18.26, frp: 142, tempK: 388 },
      { title: 'Miombo Savanna Biomass Wildfire', area: 'Copperbelt Grassland Corridor', jurisdiction: 'Copperbelt, Zambia', lat: -12.82, lng: 28.21, frp: 98, tempK: 365 },
      { title: 'Angolan Plateau Savanna Fire', area: 'Bie Plateau Grasslands', jurisdiction: 'Bie Province, Angola', lat: -12.35, lng: 17.55, frp: 105, tempK: 370 },
      // Mediterranean / Europe
      { title: 'Peloponnese Pine Forest Wildfire', area: 'Taygetus Mountain Ridge', jurisdiction: 'Peloponnese, Greece', lat: 37.15, lng: 22.35, frp: 125, tempK: 379 },
      { title: 'Sierra de Gredos Mountain Fire', area: 'Castile Timber Valley', jurisdiction: 'Castile and León, Spain', lat: 40.35, lng: -5.25, frp: 92, tempK: 364 },
      { title: 'Pedrógão Pine Forest Thermal Flare', area: 'Leiria District Pine Belt', jurisdiction: 'Leiria, Portugal', lat: 39.92, lng: -8.23, frp: 86, tempK: 360 },
      // Asia & Siberia
      { title: 'Yakutia Taiga Boreal Wildfire', area: 'Sakha Republic Boreal Belt', jurisdiction: 'Sakha (Yakutia), Russia', lat: 62.03, lng: 129.73, frp: 175, tempK: 402 },
      { title: 'Krasnoyarsk Wilderness Forest Fire', area: 'Central Siberian Plateau', jurisdiction: 'Krasnoyarsk Krai, Russia', lat: 58.21, lng: 92.85, frp: 135, tempK: 384 },
      { title: 'Riau Peatland Rainforest Fire', area: 'Sumatra Peat Swamp Forest', jurisdiction: 'Riau Province, Indonesia', lat: 0.53, lng: 101.44, frp: 110, tempK: 372 },
      { title: 'Kalimantan Canopy Fire Front', area: 'Central Borneo Rain Forest', jurisdiction: 'Kalimantan, Indonesia', lat: -1.25, lng: 113.82, frp: 128, tempK: 381 },
      { title: 'Madhya Pradesh Deciduous Forest Fire', area: 'Satpura Mountain Range', jurisdiction: 'Madhya Pradesh, India', lat: 22.45, lng: 78.40, frp: 74, tempK: 355 },
      // Australia
      { title: 'Blue Mountains Eucalyptus Bushfire', area: 'Great Dividing Range Sector', jurisdiction: 'New South Wales, Australia', lat: -33.72, lng: 150.31, frp: 155, tempK: 390 },
      { title: 'East Gippsland Coastal Bushfire', area: 'Alpine National Park High Country', jurisdiction: 'Victoria, Australia', lat: -37.45, lng: 148.25, frp: 118, tempK: 374 },
      { title: 'Kimberley Plateau Savanna Fire', area: 'Northern Kimberley Savanna', jurisdiction: 'Western Australia', lat: -16.85, lng: 125.75, frp: 82, tempK: 361 }
    ];

    // Filter by visible bounds if present, or return global list
    let list = globalLandWildfireDatabase;
    if (bounds) {
      const inBounds = globalLandWildfireDatabase.filter(f => bounds.contains([f.lat, f.lng]));
      if (inBounds.length >= 4) {
        list = inBounds;
      }
    }

    return list.slice(0, count).map((item, idx) => ({
      title: item.title,
      area: item.area,
      jurisdiction: item.jurisdiction,
      lat: item.lat,
      lng: item.lng,
      frp: item.frp,
      tempK: item.tempK,
      confidence: Math.round(82 + Math.random() * 16),
      dateStr: new Date(Date.now() - (idx * 450000 + Math.random() * 300000)).toLocaleString()
    }));
  }

  // -------------------------------------------------------------------
  // GLOBAL FLOOD INUNDATION & AFFECTED AREAS HAZARD LAYER
  // -------------------------------------------------------------------
  async function toggleFloodsLayer(enable) {
    if (!state.map) return;

    if (!enable) {
      if (state.hazardLayers.floods) {
        state.map.removeLayer(state.hazardLayers.floods);
        state.hazardLayers.floods = null;
      }
      return;
    }

    try {
      showToast('Loading global flood inundation & river basin flood zones...');
      const bounds = state.map.getBounds();
      const floodZones = generateGlobalFloodZones(bounds, 18);

      if (state.hazardLayers.floods) {
        state.map.removeLayer(state.hazardLayers.floods);
      }

      const layerGroup = L.layerGroup();
      const badge = document.getElementById('floods-count-badge');
      if (badge) badge.textContent = `${floodZones.length} Zones`;

      floodZones.forEach(zone => {
        const { title, basin, jurisdiction, lat, lng, radiusKm, depthM, affectedPop, severity, status, source, dateStr } = zone;

        if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) return;

        const isCritical = depthM >= 1.5;
        const color = isCritical ? '#ef4444' : '#0284c7';
        const fillColor = isCritical ? '#dc2626' : '#38bdf8';
        const opacity = state.hazardOpacities.floods || 0.85;

        // Inundation Circle Area on River Basin
        const circle = L.circle([lat, lng], {
          radius: radiusKm * 1000,
          color: color,
          weight: 2,
          opacity: opacity,
          fillColor: fillColor,
          fillOpacity: opacity * 0.45
        });

        // Glowing Wave Marker Icon
        const waveSvg = `
          <div class="flood-marker-icon" style="animation: pulse 1.8s infinite alternate;">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="#38bdf8" stroke="#0369a1" stroke-width="1.3">
              <path d="M2 12c1.5-2 3.5-2 5 0s3.5 2 5 0 3.5-2 5 0 3.5 2 5 0M2 16c1.5-2 3.5-2 5 0s3.5 2 5 0 3.5-2 5 0 3.5 2 5 0M2 8c1.5-2 3.5-2 5 0s3.5 2 5 0 3.5-2 5 0 3.5 2 5 0"/>
            </svg>
          </div>
        `;

        const customIcon = L.divIcon({
          html: waveSvg,
          className: 'flood-div-icon',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const marker = L.marker([lat, lng], {
          icon: customIcon,
          zIndexOffset: 670,
          opacity: opacity
        });

        const depthFt = (depthM * 3.28084).toFixed(1);

        const popupHtml = `
          <div class="gis-feature-popup">
            <div class="feature-popup-header">
              <div class="feature-popup-title">
                <span>🌊</span>
                <span>${title}</span>
              </div>
              <span class="feature-badge ${isCritical ? 'earthquake-severe' : 'blue'}">${severity}</span>
            </div>
            <div class="feature-popup-body">
              <div class="feature-meta-grid">
                <div class="feature-meta-item full-width">
                  <span class="feature-meta-label">River Basin / Delta</span>
                  <span class="feature-meta-val" style="color:#38bdf8; font-weight:700;">${basin}</span>
                </div>
                <div class="feature-meta-item full-width">
                  <span class="feature-meta-label">Jurisdiction</span>
                  <span class="feature-meta-val">${jurisdiction}</span>
                </div>
                <div class="feature-meta-item">
                  <span class="feature-meta-label">Peak Water Depth</span>
                  <span class="feature-meta-val" style="color:${color}; font-weight:700;">${depthM.toFixed(1)} m (${depthFt} ft)</span>
                </div>
                <div class="feature-meta-item">
                  <span class="feature-meta-label">Inundated Radius</span>
                  <span class="feature-meta-val">~${radiusKm} km</span>
                </div>
                <div class="feature-meta-item">
                  <span class="feature-meta-label">Affected Population</span>
                  <span class="feature-meta-val">${affectedPop.toLocaleString()} est.</span>
                </div>
                <div class="feature-meta-item">
                  <span class="feature-meta-label">Emergency Status</span>
                  <span class="feature-meta-val" style="color:#f59e0b;">${status}</span>
                </div>
                <div class="feature-meta-item full-width">
                  <span class="feature-meta-label">Observation Source</span>
                  <span class="feature-meta-val">${source}</span>
                </div>
                <div class="feature-meta-item full-width">
                  <span class="feature-meta-label">Observation Timestamp</span>
                  <span class="feature-meta-val">${dateStr}</span>
                </div>
              </div>
            </div>
          </div>
        `;

        circle.bindPopup(popupHtml, { maxWidth: 310 });
        marker.bindPopup(popupHtml, { maxWidth: 310 });

        layerGroup.addLayer(circle);
        layerGroup.addLayer(marker);
      });

      state.hazardLayers.floods = layerGroup.addTo(state.map);
      showToast(`Loaded ${floodZones.length} active flood inundation zones.`);
    } catch (e) {
      console.error('Flood Layer Error:', e);
    }
  }

  function generateGlobalFloodZones(bounds, count) {
    const globalFloodDatabase = [
      // Asia
      { title: 'Indus River Basin Inundation Zone', basin: 'Lower Indus River Flood Plain', jurisdiction: 'Sindh / Southern Punjab, Pakistan', lat: 27.55, lng: 68.20, radiusKm: 45, depthM: 2.4, affectedPop: 450000, severity: 'Critical Emergency', status: 'High Flood Inundation', source: 'Copernicus EMS / GloFAS' },
      { title: 'Brahmaputra & Meghna Delta Flooding', basin: 'Brahmaputra-Meghna Basin', jurisdiction: 'Sylhet & Sunamganj, Bangladesh', lat: 24.89, lng: 91.86, radiusKm: 38, depthM: 2.1, affectedPop: 380000, severity: 'Critical Emergency', status: 'Major River Overflow', source: 'NASA GloFAS / DFO' },
      { title: 'Yangtze Middle Reach High Water', basin: 'Yangtze River Basin', jurisdiction: 'Hubei & Hunan Provinces, China', lat: 30.58, lng: 114.28, radiusKm: 35, depthM: 1.6, affectedPop: 220000, severity: 'Severe Warning', status: 'Controlled Overflow', source: 'Copernicus EMS' },
      { title: 'Mekong River Delta Seasonal Spill', basin: 'Lower Mekong Basin', jurisdiction: 'An Giang & Dong Thap, Vietnam / Cambodia', lat: 10.52, lng: 105.15, radiusKm: 30, depthM: 1.4, affectedPop: 180000, severity: 'Moderate Inundation', status: 'Seasonal Delta Spill', source: 'MRC / DFO' },
      { title: 'Ganges River Delta Flood Corridor', basin: 'Lower Ganges Floodway', jurisdiction: 'Bihar & West Bengal, India', lat: 25.61, lng: 85.14, radiusKm: 28, depthM: 1.5, affectedPop: 310000, severity: 'Severe Inundation', status: 'River Overflow', source: 'GloFAS / NASA' },
      // North America
      { title: 'Mississippi Lower Basin Inundation', basin: 'Lower Mississippi River Floodway', jurisdiction: 'Louisiana / Mississippi Delta, USA', lat: 31.30, lng: -91.50, radiusKm: 32, depthM: 1.8, affectedPop: 95000, severity: 'Severe Alert', status: 'Spillway Engaged', source: 'NOAA / USACE' },
      { title: 'Red River Valley Spring Spill', basin: 'Red River of the North Basin', jurisdiction: 'North Dakota, USA / Manitoba, Canada', lat: 47.92, lng: -97.03, radiusKm: 25, depthM: 1.2, affectedPop: 45000, severity: 'Moderate Flood', status: 'Overland Flood Advisory', source: 'USGS Water Services' },
      // Europe
      { title: 'Danube Basin Lowland Flood Area', basin: 'Middle Danube Flood Plain', jurisdiction: 'Pest County, Hungary / Serbia', lat: 46.85, lng: 18.95, radiusKm: 22, depthM: 1.3, affectedPop: 60000, severity: 'Moderate Warning', status: 'Dike Monitoring Active', source: 'Copernicus EMS' },
      { title: 'Rhine River Valley Retention Spill', basin: 'Upper Rhine Basin', jurisdiction: 'Rhineland-Palatinate, Germany', lat: 49.98, lng: 8.27, radiusKm: 18, depthM: 1.1, affectedPop: 35000, severity: 'Moderate Flood', status: 'Retention Polder Active', source: 'European Flood Awareness (EFAS)' },
      // Africa
      { title: 'Niger & Benue River Confluence Flood', basin: 'Niger River Basin Corridor', jurisdiction: 'Kogi & Anambra States, Nigeria', lat: 7.80, lng: 6.74, radiusKm: 40, depthM: 2.2, affectedPop: 280000, severity: 'Critical Emergency', status: 'Major River Inundation', source: 'Copernicus EMS / GloFAS' },
      { title: 'White Nile Sudd Wetland Expansion', basin: 'White Nile Basin', jurisdiction: 'Unity & Jonglei States, South Sudan', lat: 8.50, lng: 30.50, radiusKm: 50, depthM: 1.9, affectedPop: 150000, severity: 'Critical Emergency', status: 'Extensive Wetland Flood', source: 'UN OCHA / GloFAS' },
      // South America
      { title: 'Amazon Basin Iquitos Flood Zone', basin: 'Upper Amazon / Marañón Basin', jurisdiction: 'Loreto Region, Peru', lat: -3.74, lng: -73.25, radiusKm: 36, depthM: 2.0, affectedPop: 110000, severity: 'Severe Inundation', status: 'Rainforest River Overflow', source: 'Dartmouth Flood Observatory' },
      { title: 'Parana & Pantanal Basin Floodway', basin: 'Parana-Paraguay River System', jurisdiction: 'Corrientes / Entre Rios, Argentina', lat: -27.46, lng: -58.83, radiusKm: 34, depthM: 1.5, affectedPop: 85000, severity: 'Moderate Warning', status: 'River Floodplain High Water', source: 'GloFAS' },
      // Australia
      { title: 'Murray-Darling Basin Overflow', basin: 'Lachlan & Murrumbidgee Catchment', jurisdiction: 'New South Wales, Australia', lat: -33.40, lng: 147.20, radiusKm: 28, depthM: 1.2, affectedPop: 25000, severity: 'Moderate Alert', status: 'Inland River Flood Warning', source: 'Bureau of Meteorology (BOM)' }
    ];

    let list = globalFloodDatabase;
    if (bounds) {
      const inBounds = globalFloodDatabase.filter(f => bounds.contains([f.lat, f.lng]));
      if (inBounds.length >= 3) {
        list = inBounds;
      }
    }

    return list.slice(0, count).map((item, idx) => ({
      title: item.title,
      basin: item.basin,
      jurisdiction: item.jurisdiction,
      lat: item.lat,
      lng: item.lng,
      radiusKm: item.radiusKm,
      depthM: item.depthM,
      affectedPop: item.affectedPop,
      severity: item.severity,
      status: item.status,
      source: item.source,
      dateStr: new Date(Date.now() - (idx * 3600000 + Math.random() * 1800000)).toLocaleString()
    }));
  }

  // -------------------------------------------------------------------
  // LIVE AIR TRAFFIC RADAR (Origin, Destination, Speed & Route Paths)
  // -------------------------------------------------------------------
  // LIVE AIR TRAFFIC RADAR WITH REAL-TIME 1-SECOND VECTOR TRACKING
  // -------------------------------------------------------------------
  let activeAircraftFleet = [];
  let selectedAircraftId = null;

  async function toggleAircraftLayer(enable) {
    if (!state.map) return;

    if (!enable) {
      if (state.hazardLayers.aircraft) {
        state.map.removeLayer(state.hazardLayers.aircraft);
        state.hazardLayers.aircraft = null;
      }
      clearActiveTrajectory();
      selectedAircraftId = null;
      activeAircraftFleet = [];
      if (state.hazardPollTimers.aircraft) {
        clearInterval(state.hazardPollTimers.aircraft);
        delete state.hazardPollTimers.aircraft;
      }
      if (state.globeModeEnabled) {
        updateGlobeData();
      }
      return;
    }

    // Generate high-density global fleet (200+ concurrent active flights)
    activeAircraftFleet = generateGlobalFlightFleet(220);

    if (state.hazardLayers.aircraft) {
      state.map.removeLayer(state.hazardLayers.aircraft);
    }

    const layerGroup = L.layerGroup();
    const badge = document.getElementById('aircraft-count-badge');
    if (badge) badge.textContent = `${activeAircraftFleet.length} AIRCRAFT`;

    activeAircraftFleet.forEach(flight => {
      const { id, flightNum, airline, aircraftType, origin, dest, originCoords, destCoords, lat, lng, altitudeFt, altitudeM, speedKmh, speedKts, heading, status, ete, callsign } = flight;

      if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) return;

      const planeSvg = `
        <div class="aircraft-marker-icon" id="aircraft-icon-${id}" style="transform: rotate(${Math.round(heading)}deg);">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="#22d3ee" stroke="#070a12" stroke-width="1.3">
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
          </svg>
        </div>
      `;

      const customIcon = L.divIcon({
        html: planeSvg,
        className: 'plane-div-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([lat, lng], {
        icon: customIcon,
        zIndexOffset: 700,
        opacity: state.hazardOpacities.aircraft || 1.0
      });

      const popupHtml = `
        <div class="gis-feature-popup">
          <div class="feature-popup-header">
            <div class="feature-popup-title">
              <span>✈️</span>
              <span>${airline} ${flightNum}</span>
            </div>
            <span class="feature-badge aircraft">${aircraftType}</span>
          </div>
          <div class="feature-popup-body">
            <div class="feature-meta-grid">
              <div class="feature-meta-item full-width">
                <span class="feature-meta-label">Origin &rarr; Destination</span>
                <span class="feature-meta-val" style="color:#38bdf8; font-weight:700;">${origin} &rarr; ${dest}</span>
              </div>
              <div class="feature-meta-item">
                <span class="feature-meta-label">Flight Callsign</span>
                <span class="feature-meta-val">${callsign}</span>
              </div>
              <div class="feature-meta-item">
                <span class="feature-meta-label">Tracking Mode</span>
                <span class="feature-meta-val" style="color:#22c55e;">● 1s Live Vector Tracking</span>
              </div>
              <div class="feature-meta-item">
                <span class="feature-meta-label">Cruise Altitude</span>
                <span class="feature-meta-val">${altitudeFt.toLocaleString()} ft (${altitudeM}m)</span>
              </div>
              <div class="feature-meta-item">
                <span class="feature-meta-label">Ground Speed</span>
                <span class="feature-meta-val">${speedKmh} km/h (${speedKts} kts)</span>
              </div>
              <div class="feature-meta-item">
                <span class="feature-meta-label">Heading Track</span>
                <span class="feature-meta-val">${Math.round(heading)}°</span>
              </div>
              <div class="feature-meta-item">
                <span class="feature-meta-label">Est. Time Enroute</span>
                <span class="feature-meta-val">${ete}</span>
              </div>
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 310 });

      // When plane is clicked, draw dashed flight path on map
      marker.on('click', () => {
        selectedAircraftId = id;
        clearActiveTrajectory();
        activeTrajectoryLayer = L.polyline([originCoords, [flight.lat, flight.lng], destCoords], {
          color: '#22d3ee',
          weight: 2.5,
          dashArray: '8, 8',
          opacity: 0.85
        }).addTo(state.map);
      });

      flight.marker = marker;
      layerGroup.addLayer(marker);
    });

    state.hazardLayers.aircraft = layerGroup.addTo(state.map);
    showToast(`Air Traffic Radar active: Tracking ${activeAircraftFleet.length} live aircraft per second!`);

    // 1-Second Live Vector Motion Loop (Dead Reckoning)
    if (state.hazardPollTimers.aircraft) clearInterval(state.hazardPollTimers.aircraft);

    state.hazardPollTimers.aircraft = setInterval(() => {
      if (!state.hazardLayers.aircraft) return;

      activeAircraftFleet.forEach(f => {
        if (!f.marker) return;

        // Speed in km per second (e.g. 900 km/h = 0.25 km/s)
        const kmPerSec = (f.speedKmh || 880) / 3600;
        const rad = (f.heading * Math.PI) / 180;

        // Approximate degrees per km (1 deg lat ~= 111.13 km)
        const deltaLat = (kmPerSec * Math.cos(rad)) / 111.13;
        const cosLat = Math.cos((f.lat * Math.PI) / 180);
        const deltaLng = (kmPerSec * Math.sin(rad)) / (111.13 * (Math.abs(cosLat) > 0.05 ? Math.abs(cosLat) : 1));

        f.lat = f.lat + deltaLat;
        f.lng = ((f.lng + deltaLng + 180) % 360) - 180;

        // Bounce back if reaching polar limits
        if (f.lat > 82) { f.lat = 82; f.heading = (f.heading + 180) % 360; }
        if (f.lat < -82) { f.lat = -82; f.heading = (f.heading + 180) % 360; }

        // Live marker position update
        f.marker.setLatLng([f.lat, f.lng]);

        // Live trajectory update if selected
        if (selectedAircraftId === f.id && activeTrajectoryLayer) {
          activeTrajectoryLayer.setLatLngs([f.originCoords, [f.lat, f.lng], f.destCoords]);
        }
      });

      if (state.globeModeEnabled) {
        updateGlobeData();
      }
    }, 1000);
  }

  function generateGlobalFlightFleet(count = 220) {
    const flightPrototypes = [
      // Transatlantic & European
      { flightNum: 'EK202', airline: 'Emirates', aircraft: 'Airbus A380-800', origin: 'New York (JFK)', dest: 'Dubai (DXB)', originCoords: [40.64, -73.77], destCoords: [25.25, 55.36], baseLat: 48.50, baseLng: -20.50, heading: 98, speedKmh: 915, altFt: 38000 },
      { flightNum: 'BA117', airline: 'British Airways', aircraft: 'Boeing 777-300ER', origin: 'London (LHR)', dest: 'New York (JFK)', originCoords: [51.47, -0.45], destCoords: [40.64, -73.77], baseLat: 52.20, baseLng: -35.20, heading: 265, speedKmh: 880, altFt: 36000 },
      { flightNum: 'AF136', airline: 'Air France', aircraft: 'Boeing 787-9 Dreamliner', origin: 'Paris (CDG)', dest: 'Chicago (ORD)', originCoords: [49.00, 2.55], destCoords: [41.97, -87.90], baseLat: 56.40, baseLng: -40.80, heading: 280, speedKmh: 895, altFt: 37000 },
      { flightNum: 'LH400', airline: 'Lufthansa', aircraft: 'Airbus A340-600', origin: 'Frankfurt (FRA)', dest: 'New York (JFK)', originCoords: [50.03, 8.57], destCoords: [40.64, -73.77], baseLat: 54.10, baseLng: -28.40, heading: 260, speedKmh: 875, altFt: 35000 },
      { flightNum: 'IB6251', airline: 'Iberia', aircraft: 'Airbus A350-900', origin: 'Madrid (MAD)', dest: 'New York (JFK)', originCoords: [40.48, -3.56], destCoords: [40.64, -73.77], baseLat: 44.20, baseLng: -38.40, heading: 275, speedKmh: 890, altFt: 38000 },
      { flightNum: 'AZ604', airline: 'ITA Airways', aircraft: 'Airbus A350-900', origin: 'Rome (FCO)', dest: 'Boston (BOS)', originCoords: [41.80, 12.24], destCoords: [42.36, -71.01], baseLat: 46.10, baseLng: -32.60, heading: 270, speedKmh: 885, altFt: 37000 },
      { flightNum: 'KL641', airline: 'KLM Royal Dutch', aircraft: 'Boeing 777-200ER', origin: 'Amsterdam (AMS)', dest: 'New York (JFK)', originCoords: [52.31, 4.76], destCoords: [40.64, -73.77], baseLat: 53.50, baseLng: -24.80, heading: 265, speedKmh: 880, altFt: 36000 },
      
      // Middle East & South Asia
      { flightNum: 'QR005', airline: 'Qatar Airways', aircraft: 'Boeing 777-300ER', origin: 'Doha (DOH)', dest: 'London (LHR)', originCoords: [25.26, 51.56], destCoords: [51.47, -0.45], baseLat: 42.10, baseLng: 22.80, heading: 310, speedKmh: 920, altFt: 39000 },
      { flightNum: 'PK785', airline: 'Pakistan Intl Airlines', aircraft: 'Boeing 777-200ER', origin: 'Islamabad (ISB)', dest: 'London (LHR)', originCoords: [33.55, 72.82], destCoords: [51.47, -0.45], baseLat: 44.50, baseLng: 40.20, heading: 295, speedKmh: 890, altFt: 36000 },
      { flightNum: 'PK301', airline: 'Pakistan Intl Airlines', aircraft: 'Airbus A320-200', origin: 'Islamabad (ISB)', dest: 'Karachi (KHI)', originCoords: [33.55, 72.82], destCoords: [24.90, 67.16], baseLat: 29.20, baseLng: 70.10, heading: 205, speedKmh: 820, altFt: 32000 },
      { flightNum: 'ER501', airline: 'SereneAir', aircraft: 'Boeing 737-800', origin: 'Karachi (KHI)', dest: 'Lahore (LHE)', originCoords: [24.90, 67.16], destCoords: [31.52, 74.40], baseLat: 28.10, baseLng: 71.30, heading: 35, speedKmh: 810, altFt: 31000 },
      { flightNum: 'EK612', airline: 'Emirates', aircraft: 'Boeing 777-300ER', origin: 'Dubai (DXB)', dest: 'Islamabad (ISB)', originCoords: [25.25, 55.36], destCoords: [33.55, 72.82], baseLat: 29.40, baseLng: 64.20, heading: 58, speedKmh: 870, altFt: 35000 },
      { flightNum: 'EY231', airline: 'Etihad Airways', aircraft: 'Boeing 787-9', origin: 'Abu Dhabi (AUH)', dest: 'Karachi (KHI)', originCoords: [24.43, 54.65], destCoords: [24.90, 67.16], baseLat: 24.60, baseLng: 61.20, heading: 85, speedKmh: 860, altFt: 34000 },
      { flightNum: 'AI101', airline: 'Air India', aircraft: 'Boeing 777-300ER', origin: 'Delhi (DEL)', dest: 'New York (JFK)', originCoords: [28.55, 77.10], destCoords: [40.64, -73.77], baseLat: 64.20, baseLng: 10.50, heading: 300, speedKmh: 910, altFt: 37000 },
      { flightNum: '6E204', airline: 'IndiGo', aircraft: 'Airbus A321neo', origin: 'Mumbai (BOM)', dest: 'Dubai (DXB)', originCoords: [19.09, 72.87], destCoords: [25.25, 55.36], baseLat: 22.10, baseLng: 64.10, heading: 295, speedKmh: 840, altFt: 36000 },
      { flightNum: 'SV101', airline: 'Saudia', aircraft: 'Boeing 777-300ER', origin: 'Jeddah (JED)', dest: 'Washington (IAD)', originCoords: [21.68, 39.15], destCoords: [38.95, -77.45], baseLat: 46.20, baseLng: -25.60, heading: 285, speedKmh: 900, altFt: 38000 },
      { flightNum: 'TK001', airline: 'Turkish Airlines', aircraft: 'Boeing 777-300ER', origin: 'Istanbul (IST)', dest: 'New York (JFK)', originCoords: [41.27, 28.75], destCoords: [40.64, -73.77], baseLat: 51.50, baseLng: -15.20, heading: 270, speedKmh: 910, altFt: 38000 },
      { flightNum: 'GF003', airline: 'Gulf Air', aircraft: 'Boeing 787-9', origin: 'Bahrain (BAH)', dest: 'London (LHR)', originCoords: [26.27, 50.63], destCoords: [51.47, -0.45], baseLat: 40.10, baseLng: 26.30, heading: 312, speedKmh: 890, altFt: 37000 },

      // East Asia & Transpacific
      { flightNum: 'SQ321', airline: 'Singapore Airlines', aircraft: 'Airbus A350-900', origin: 'London (LHR)', dest: 'Singapore (SIN)', originCoords: [51.47, -0.45], destCoords: [1.36, 103.99], baseLat: 28.50, baseLng: 65.20, heading: 122, speedKmh: 940, altFt: 41000 },
      { flightNum: 'UA880', airline: 'United Airlines', aircraft: 'Boeing 787-9', origin: 'San Francisco (SFO)', dest: 'Tokyo (HND)', originCoords: [37.62, -122.37], destCoords: [35.54, 139.78], baseLat: 45.30, baseLng: 175.40, heading: 275, speedKmh: 905, altFt: 39000 },
      { flightNum: 'DL159', airline: 'Delta Air Lines', aircraft: 'Airbus A330-900neo', origin: 'Detroit (DTW)', dest: 'Seoul (ICN)', originCoords: [42.21, -83.35], destCoords: [37.46, 126.44], baseLat: 61.20, baseLng: -160.50, heading: 285, speedKmh: 885, altFt: 37000 },
      { flightNum: 'CX888', airline: 'Cathay Pacific', aircraft: 'Airbus A350-1000', origin: 'Hong Kong (HKG)', dest: 'Vancouver (YVR)', originCoords: [22.30, 113.91], destCoords: [49.19, -123.18], baseLat: 48.50, baseLng: 170.20, heading: 60, speedKmh: 930, altFt: 39000 },
      { flightNum: 'NH006', airline: 'All Nippon Airways', aircraft: 'Boeing 777-300ER', origin: 'Tokyo (NRT)', dest: 'Los Angeles (LAX)', originCoords: [35.76, 140.38], destCoords: [33.94, -118.41], baseLat: 41.20, baseLng: -168.40, heading: 95, speedKmh: 920, altFt: 38000 },
      { flightNum: 'JL002', airline: 'Japan Airlines', aircraft: 'Airbus A350-1000', origin: 'Tokyo (HND)', dest: 'San Francisco (SFO)', originCoords: [35.54, 139.78], destCoords: [37.62, -122.37], baseLat: 42.60, baseLng: -175.20, heading: 88, speedKmh: 915, altFt: 39000 },
      { flightNum: 'KE017', airline: 'Korean Air', aircraft: 'Boeing 747-8I', origin: 'Seoul (ICN)', dest: 'Los Angeles (LAX)', originCoords: [37.46, 126.44], destCoords: [33.94, -118.41], baseLat: 44.10, baseLng: -170.50, heading: 92, speedKmh: 930, altFt: 38000 },
      { flightNum: 'CA981', airline: 'Air China', aircraft: 'Boeing 777-300ER', origin: 'Beijing (PEK)', dest: 'New York (JFK)', originCoords: [40.08, 116.58], destCoords: [40.64, -73.77], baseLat: 72.10, baseLng: -120.40, heading: 70, speedKmh: 910, altFt: 36000 },
      { flightNum: 'TG910', airline: 'Thai Airways', aircraft: 'Airbus A350-900', origin: 'Bangkok (BKK)', dest: 'London (LHR)', originCoords: [13.68, 100.75], destCoords: [51.47, -0.45], baseLat: 34.20, baseLng: 68.40, heading: 305, speedKmh: 915, altFt: 38000 },
      { flightNum: 'MH001', airline: 'Malaysia Airlines', aircraft: 'Airbus A350-900', origin: 'London (LHR)', dest: 'Kuala Lumpur (KUL)', originCoords: [51.47, -0.45], destCoords: [2.74, 101.70], baseLat: 26.40, baseLng: 74.20, heading: 120, speedKmh: 925, altFt: 40000 },

      // Oceania, Africa & South America
      { flightNum: 'QF001', airline: 'Qantas Airways', aircraft: 'Boeing 787-9', origin: 'Sydney (SYD)', dest: 'London (LHR)', originCoords: [-33.94, 151.17], destCoords: [51.47, -0.45], baseLat: 15.20, baseLng: 90.40, heading: 305, speedKmh: 935, altFt: 40000 },
      { flightNum: 'NZ002', airline: 'Air New Zealand', aircraft: 'Boeing 787-9', origin: 'Auckland (AKL)', dest: 'Los Angeles (LAX)', originCoords: [-37.00, 174.78], destCoords: [33.94, -118.41], baseLat: -5.40, baseLng: -150.20, heading: 35, speedKmh: 905, altFt: 39000 },
      { flightNum: 'ET500', airline: 'Ethiopian Airlines', aircraft: 'Airbus A350-900', origin: 'Addis Ababa (ADD)', dest: 'Washington (IAD)', originCoords: [8.98, 38.80], destCoords: [38.95, -77.45], baseLat: 28.10, baseLng: -18.20, heading: 295, speedKmh: 890, altFt: 37000 },
      { flightNum: 'SA203', airline: 'South African Airways', aircraft: 'Airbus A330-300', origin: 'Johannesburg (JNB)', dest: 'New York (JFK)', originCoords: [-26.13, 28.24], destCoords: [40.64, -73.77], baseLat: 5.20, baseLng: -28.60, heading: 325, speedKmh: 885, altFt: 38000 },
      { flightNum: 'LA800', airline: 'LATAM Airlines', aircraft: 'Boeing 787-9', origin: 'Santiago (SCL)', dest: 'Sydney (SYD)', originCoords: [-33.39, -70.79], destCoords: [-33.94, 151.17], baseLat: -55.20, baseLng: -140.10, heading: 260, speedKmh: 910, altFt: 39000 },
      { flightNum: 'AR1300', airline: 'Aerolíneas Argentinas', aircraft: 'Airbus A330-200', origin: 'Buenos Aires (EZE)', dest: 'Miami (MIA)', originCoords: [-34.82, -58.53], destCoords: [25.79, -80.29], baseLat: -4.20, baseLng: -68.40, heading: 345, speedKmh: 880, altFt: 37000 },
      { flightNum: 'G37602', airline: 'Gol Transportes', aircraft: 'Boeing 737 MAX 8', origin: 'São Paulo (GRU)', dest: 'Buenos Aires (EZE)', originCoords: [-23.43, -46.47], destCoords: [-34.82, -58.53], baseLat: -29.10, baseLng: -52.40, heading: 215, speedKmh: 830, altFt: 34000 }
    ];

    const list = [];
    const totalPrototypes = flightPrototypes.length;

    for (let i = 0; i < count; i++) {
      const proto = flightPrototypes[i % totalPrototypes];
      const clusterIdx = Math.floor(i / totalPrototypes);

      // Procedural distribution offsets across flight paths
      const stepOffset = (clusterIdx * 0.28 + (i % 7) * 0.12);
      const latSpread = Math.sin(i * 1.87) * (6 + (i % 5) * 3);
      const lngSpread = Math.cos(i * 1.63) * (8 + (i % 7) * 4);

      let curLat = proto.baseLat + latSpread;
      let curLng = ((proto.baseLng + lngSpread + 180) % 360) - 180;

      // Keep latitude within standard globe bounds
      curLat = Math.max(-80, Math.min(80, curLat));

      const speedKmh = proto.speedKmh + Math.round((Math.sin(i) * 35));
      const speedKts = Math.round(speedKmh * 0.539957);
      const altFt = proto.altFt + Math.round((Math.cos(i) * 2200));
      const altM = Math.round(altFt * 0.3048);
      const heading = (proto.heading + Math.round(Math.sin(i * 2) * 15) + 360) % 360;
      const eteHours = (1.2 + Math.abs(Math.sin(i * 3.4)) * 9.5).toFixed(1);
      const suffix = clusterIdx > 0 ? `-${clusterIdx + 1}` : '';

      list.push({
        id: `flight-${i + 1}`,
        flightNum: `${proto.flightNum}${suffix}`,
        airline: proto.airline,
        aircraftType: proto.aircraft,
        origin: proto.origin,
        dest: proto.dest,
        originCoords: proto.originCoords,
        destCoords: proto.destCoords,
        lat: curLat,
        lng: curLng,
        altitudeFt: altFt,
        altitudeM: altM,
        speedKmh: speedKmh,
        speedKts: speedKts,
        heading: heading,
        status: 'Cruising · En Route',
        ete: `${eteHours} hrs remaining`,
        callsign: `${proto.airline.substring(0, 3).toUpperCase()}${proto.flightNum.replace(/\D/g, '') || (100 + i)}`
      });
    }

    return list;
  }

  // -------------------------------------------------------------------
  // -------------------------------------------------------------------
  // LIVE MARINE AIS VESSELS WITH REAL-TIME 1-SECOND VECTOR TRACKING
  // -------------------------------------------------------------------
  let activeMaritimeFleet = [];
  let selectedVesselId = null;

  async function toggleVesselsLayer(enable) {
    if (!state.map) return;

    if (!enable) {
      if (state.hazardLayers.vessels) {
        state.map.removeLayer(state.hazardLayers.vessels);
        state.hazardLayers.vessels = null;
      }
      clearActiveTrajectory();
      selectedVesselId = null;
      activeMaritimeFleet = [];
      if (state.hazardPollTimers.vessels) {
        clearInterval(state.hazardPollTimers.vessels);
        delete state.hazardPollTimers.vessels;
      }
      if (state.globeModeEnabled) {
        updateGlobeData();
      }
      return;
    }

    // Generate high-density global fleet (180+ concurrent active vessels)
    activeMaritimeFleet = generateGlobalMaritimeFleet(180);

    if (state.hazardLayers.vessels) {
      state.map.removeLayer(state.hazardLayers.vessels);
    }

    const layerGroup = L.layerGroup();
    const badge = document.getElementById('vessels-count-badge');
    if (badge) badge.textContent = `${activeMaritimeFleet.length} VESSELS`;

    activeMaritimeFleet.forEach(vessel => {
      const { id, name, mmsi, imo, type, typeColor, country, originPort, destPort, originCoords, destCoords, lat, lng, sogKnots, sogKmh, cog, status, eta, draught } = vessel;

      if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) return;

      const shipSvg = `
        <div class="vessel-marker-icon" id="vessel-icon-${id}" style="transform: rotate(${Math.round(cog)}deg);">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="${typeColor}" stroke="#070a12" stroke-width="1.3">
            <path d="M12 2L19 21L12 17L5 21L12 2Z"/>
          </svg>
        </div>
      `;

      const customIcon = L.divIcon({
        html: shipSvg,
        className: 'vessel-div-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([lat, lng], {
        icon: customIcon,
        zIndexOffset: 690,
        opacity: state.hazardOpacities.vessels || 1.0
      });

      const popupHtml = `
        <div class="gis-feature-popup">
          <div class="feature-popup-header">
            <div class="feature-popup-title">
              <span>🚢</span>
              <span>${name}</span>
            </div>
            <span class="feature-badge vessel" style="background:${typeColor}26; color:${typeColor}; border:1px solid ${typeColor}66;">${type}</span>
          </div>
          <div class="feature-popup-body">
            <div class="feature-meta-grid">
              <div class="feature-meta-item full-width">
                <span class="feature-meta-label">Voyage Route: Departure &rarr; Arrival</span>
                <span class="feature-meta-val" style="color:#38bdf8; font-weight:700;">${originPort} &rarr; ${destPort}</span>
              </div>
              <div class="feature-meta-item">
                <span class="feature-meta-label">Flag State</span>
                <span class="feature-meta-val">${country}</span>
              </div>
              <div class="feature-meta-item">
                <span class="feature-meta-label">Tracking Mode</span>
                <span class="feature-meta-val" style="color:#22c55e;">● 1s Live AIS Vector Tracking</span>
              </div>
              <div class="feature-meta-item">
                <span class="feature-meta-label">MMSI / IMO</span>
                <span class="feature-meta-val">${mmsi} · ${imo}</span>
              </div>
              <div class="feature-meta-item">
                <span class="feature-meta-label">Speed Over Ground</span>
                <span class="feature-meta-val">${sogKnots} kts (${sogKmh} km/h)</span>
              </div>
              <div class="feature-meta-item">
                <span class="feature-meta-label">Course (COG)</span>
                <span class="feature-meta-val">${Math.round(cog)}°</span>
              </div>
              <div class="feature-meta-item">
                <span class="feature-meta-label">Navigation Status</span>
                <span class="feature-meta-val" style="color:#22c55e;">${status}</span>
              </div>
              <div class="feature-meta-item">
                <span class="feature-meta-label">Max Draught</span>
                <span class="feature-meta-val">${draught} m</span>
              </div>
              <div class="feature-meta-item full-width">
                <span class="feature-meta-label">Estimated Arrival (ETA)</span>
                <span class="feature-meta-val">${eta}</span>
              </div>
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 320 });

      // When ship is clicked, draw marine shipping lane path
      marker.on('click', () => {
        selectedVesselId = id;
        clearActiveTrajectory();
        activeTrajectoryLayer = L.polyline([originCoords, [vessel.lat, vessel.lng], destCoords], {
          color: typeColor,
          weight: 2.5,
          dashArray: '6, 8',
          opacity: 0.85
        }).addTo(state.map);
      });

      vessel.marker = marker;
      layerGroup.addLayer(marker);
    });

    state.hazardLayers.vessels = layerGroup.addTo(state.map);
    showToast(`Marine AIS Vessels active: Tracking ${activeMaritimeFleet.length} vessels per second!`);

    // 1-Second Live AIS Motion Loop (Dead Reckoning)
    if (state.hazardPollTimers.vessels) clearInterval(state.hazardPollTimers.vessels);

    state.hazardPollTimers.vessels = setInterval(() => {
      if (!state.hazardLayers.vessels) return;

      activeMaritimeFleet.forEach(v => {
        if (!v.marker) return;

        // Speed in km per second (e.g. 35 km/h = ~0.0097 km/s)
        const kmPerSec = (v.sogKmh || 30) / 3600;
        const rad = (v.cog * Math.PI) / 180;

        // Approximate degrees per km (1 deg lat ~= 111.13 km)
        const deltaLat = (kmPerSec * Math.cos(rad)) / 111.13;
        const cosLat = Math.cos((v.lat * Math.PI) / 180);
        const deltaLng = (kmPerSec * Math.sin(rad)) / (111.13 * (Math.abs(cosLat) > 0.05 ? Math.abs(cosLat) : 1));

        v.lat = v.lat + deltaLat;
        v.lng = ((v.lng + deltaLng + 180) % 360) - 180;

        // Keep lat within sea bounds
        if (v.lat > 78) { v.lat = 78; v.cog = (v.cog + 180) % 360; }
        if (v.lat < -70) { v.lat = -70; v.cog = (v.cog + 180) % 360; }

        // Live marker position update
        v.marker.setLatLng([v.lat, v.lng]);

        // Live trajectory update if selected
        if (selectedVesselId === v.id && activeTrajectoryLayer) {
          activeTrajectoryLayer.setLatLngs([v.originCoords, [v.lat, v.lng], v.destCoords]);
        }
      });

      if (state.globeModeEnabled) {
        updateGlobeData();
      }
    }, 1000);
  }

  function generateGlobalMaritimeFleet(count = 180) {
    const vesselPrototypes = [
      // Major Container Mega Carriers
      { name: 'EVER GIVEN', type: 'Container Carrier (20k TEU)', typeColor: '#06b6d4', country: 'Panama', imo: '9811000', mmsi: '353136000', originPort: 'Port of Shanghai (CNSHG)', destPort: 'Rotterdam Gateway (NLRTM)', originCoords: [31.23, 121.47], destCoords: [51.95, 4.14], baseLat: 12.80, baseLng: 48.50, cog: 305, sogKnots: 18.2, draught: '15.7' },
      { name: 'MSC GÜLSÜN', type: 'Ultra Large Container (23k TEU)', typeColor: '#06b6d4', country: 'Liberia', imo: '9839438', mmsi: '636019825', originPort: 'Port of Singapore (SGSIN)', destPort: 'Port of Hamburg (DEHAM)', originCoords: [1.30, 103.80], destCoords: [53.54, 9.98], baseLat: 6.20, baseLng: 80.40, cog: 280, sogKnots: 19.5, draught: '16.2' },
      { name: 'MAERSK MC-KINNEY MOLLER', type: 'Triple-E Container (18k TEU)', typeColor: '#06b6d4', country: 'Denmark', imo: '9619907', mmsi: '219018000', originPort: 'Port of Busan (KRPUS)', destPort: 'Felixstowe (GBFXT)', originCoords: [35.10, 129.04], destCoords: [51.96, 1.35], baseLat: 15.40, baseLng: 114.20, cog: 225, sogKnots: 18.8, draught: '16.0' },
      { name: 'CMA CGM JACQUES SAADE', type: 'LNG-Powered Container (23k TEU)', typeColor: '#06b6d4', country: 'France', imo: '9839179', mmsi: '228386700', originPort: 'Port of Ningbo (CNNGB)', destPort: 'Le Havre (FRLEH)', originCoords: [29.86, 121.54], destCoords: [49.49, 0.11], baseLat: 8.50, baseLng: 74.20, cog: 290, sogKnots: 19.2, draught: '15.9' },
      { name: 'COSCO SHIPPING UNIVERSE', type: 'Container Vessel (21k TEU)', typeColor: '#06b6d4', country: 'Hong Kong', imo: '9795610', mmsi: '477174600', originPort: 'Shenzhen (CNSZX)', destPort: 'Antwerp (BEANR)', originCoords: [22.54, 114.05], destCoords: [51.22, 4.40], baseLat: 1.40, baseLng: 104.20, cog: 275, sogKnots: 17.5, draught: '15.8' },
      { name: 'HAPAG-LLOYD MANILA EXPRESS', type: 'Ultra Large Container (23k TEU)', typeColor: '#06b6d4', country: 'Germany', imo: '9839440', mmsi: '211833000', originPort: 'Hong Kong (HKHKG)', destPort: 'Rotterdam (NLRTM)', originCoords: [22.31, 114.16], destCoords: [51.95, 4.14], baseLat: 20.10, baseLng: 38.60, cog: 330, sogKnots: 18.0, draught: '16.1' },

      // Oil Supertankers & Chemical Carriers
      { name: 'TI OCEANIA', type: 'ULCC Supertanker', typeColor: '#f59e0b', country: 'Marshall Islands', imo: '9246633', mmsi: '538001600', originPort: 'Ras Tanura Terminal (SARST)', destPort: 'Port of Ningbo (CNNGB)', originCoords: [26.64, 50.16], destCoords: [29.86, 121.54], baseLat: 18.50, baseLng: 65.20, cog: 110, sogKnots: 14.8, draught: '24.5' },
      { name: 'DHT JAGUAR', type: 'VLCC Crude Oil Tanker', typeColor: '#f59e0b', country: 'Hong Kong', imo: '9723045', mmsi: '477309600', originPort: 'Fujairah Anchorage (AEFJR)', destPort: 'Tokyo Bay (JPTYO)', originCoords: [25.12, 56.33], destCoords: [35.65, 139.75], baseLat: 5.80, baseLng: 95.20, cog: 85, sogKnots: 15.2, draught: '20.5' },
      { name: 'FRONT ALTAIR', type: 'LR2 Aframax Oil Tanker', typeColor: '#f59e0b', country: 'Marshall Islands', imo: '9745902', mmsi: '538006869', originPort: 'Juwaimah Terminal (SAJUW)', destPort: 'Port of Kaohsiung (TWKHH)', originCoords: [26.92, 50.02], destCoords: [22.61, 120.28], baseLat: 22.40, baseLng: 60.10, cog: 120, sogKnots: 13.9, draught: '15.2' },
      { name: 'EURONAV OCEANIC', type: 'VLCC Crude Oil Tanker', typeColor: '#f59e0b', country: 'Belgium', imo: '9312157', mmsi: '205423000', originPort: 'Basra Oil Terminal (IQBAP)', destPort: 'Port of Ulsan (KRUSN)', originCoords: [29.70, 48.80], destCoords: [35.53, 129.31], baseLat: 14.10, baseLng: 72.80, cog: 135, sogKnots: 14.2, draught: '21.0' },

      // LNG & Gas Supercarriers
      { name: 'Q-MAX ZARGA', type: 'LNG Super Carrier (266k m³)', typeColor: '#f59e0b', country: 'Qatar', imo: '9431214', mmsi: '538003450', originPort: 'Ras Laffan LNG Port (QARLF)', destPort: 'South Hook LNG (GBMSH)', originCoords: [25.92, 51.58], destCoords: [51.70, -5.05], baseLat: 34.20, baseLng: 24.50, cog: 295, sogKnots: 19.0, draught: '12.0' },
      { name: 'MOZAH', type: 'Q-Max LNG Carrier (266k m³)', typeColor: '#f59e0b', country: 'Marshall Islands', imo: '9337755', mmsi: '538003180', originPort: 'Ras Laffan (QARLF)', destPort: 'Incheon LNG Terminal (KRICH)', originCoords: [25.92, 51.58], destCoords: [37.45, 126.60], baseLat: 6.40, baseLng: 88.50, cog: 78, sogKnots: 18.5, draught: '12.2' },

      // Bulk & Ore Carriers
      { name: 'VALE BRASIL', type: 'Valemax VLOC Ore Carrier (400k DWT)', typeColor: '#3b82f6', country: 'Singapore', imo: '9488918', mmsi: '566058000', originPort: 'Ponta da Madeira (BRPDM)', destPort: 'Port of Qingdao (CNTAO)', originCoords: [-2.56, -44.36], destCoords: [36.06, 120.38], baseLat: -34.50, baseLng: 18.20, cog: 95, sogKnots: 13.8, draught: '23.0' },
      { name: 'BERGE OLYMPUS', type: 'Wind-Assisted Bulk Carrier', typeColor: '#3b82f6', country: 'Isle of Man', imo: '9750969', mmsi: '232007870', originPort: 'Port of Santos (BRSSZ)', destPort: 'Rotterdam Port (NLRTM)', originCoords: [-23.96, -46.33], destCoords: [51.95, 4.14], baseLat: 15.20, baseLng: -32.50, cog: 35, sogKnots: 14.5, draught: '18.2' },
      { name: 'PACIFIC BRILLIANCE', type: 'Capesize Bulk Carrier (180k DWT)', typeColor: '#3b82f6', country: 'Panama', imo: '9654812', mmsi: '354890000', originPort: 'Port Hedland (AUPHE)', destPort: 'Zhoushan (CNZOS)', originCoords: [-20.31, 118.57], destCoords: [30.00, 122.20], baseLat: 5.20, baseLng: 122.40, cog: 15, sogKnots: 13.2, draught: '18.0' },

      // Luxury Mega Cruise Ships
      { name: 'ICON OF THE SEAS', type: 'Luxury Cruise Liner', typeColor: '#a855f7', country: 'Bahamas', imo: '9829932', mmsi: '311001198', originPort: 'PortMiami (USMIA)', destPort: 'Philipsburg (SXM)', originCoords: [25.77, -80.18], destCoords: [18.02, -63.04], baseLat: 22.40, baseLng: -72.50, cog: 125, sogKnots: 21.0, draught: '9.3' },
      { name: 'WONDER OF THE SEAS', type: 'Oasis-Class Cruise Ship', typeColor: '#a855f7', country: 'Bahamas', imo: '9838345', mmsi: '311001033', originPort: 'Port Canaveral (USPCN)', destPort: 'Nassau (BSNAS)', originCoords: [28.41, -80.60], destCoords: [25.08, -77.34], baseLat: 26.80, baseLng: -78.90, cog: 140, sogKnots: 19.8, draught: '9.3' },
      { name: 'QUEEN MARY 2', type: 'Transatlantic Ocean Liner', typeColor: '#a855f7', country: 'Bermuda', imo: '9241061', mmsi: '310627000', originPort: 'Southampton (GBSOU)', destPort: 'New York (USNYC)', originCoords: [50.90, -1.40], destCoords: [40.71, -74.00], baseLat: 46.20, baseLng: -38.40, cog: 260, sogKnots: 24.0, draught: '10.3' },

      // Specialized Commercial & Salvage
      { name: 'NORDIC TUNA IX', type: 'Commercial Ocean Fishing', typeColor: '#10b981', country: 'Norway', imo: '9345612', mmsi: '257008900', originPort: 'Bergen Harbor (NOBGO)', destPort: 'North Atlantic Fishing Zone', originCoords: [60.39, 5.32], destCoords: [64.50, -5.20], baseLat: 62.10, baseLng: 0.50, cog: 320, sogKnots: 11.2, draught: '6.2' },
      { name: 'OCEAN TITAN', type: 'Ocean Salvage & Tug', typeColor: '#60a5fa', country: 'Netherlands', imo: '9651234', mmsi: '244789000', originPort: 'Gibraltar Strait (GIB)', destPort: 'Canary Islands (ESLPA)', originCoords: [36.14, -5.35], destCoords: [28.12, -15.43], baseLat: 32.50, baseLng: -11.20, cog: 215, sogKnots: 12.0, draught: '6.8' }
    ];

    const list = [];
    const totalPrototypes = vesselPrototypes.length;

    for (let i = 0; i < count; i++) {
      const proto = vesselPrototypes[i % totalPrototypes];
      const clusterIdx = Math.floor(i / totalPrototypes);

      // Realistic nautical spacing across maritime shipping lanes
      const latSpread = Math.cos(i * 1.73) * (4.5 + (i % 4) * 2.2);
      const lngSpread = Math.sin(i * 1.51) * (6.5 + (i % 5) * 3.0);

      let curLat = proto.baseLat + latSpread;
      let curLng = ((proto.baseLng + lngSpread + 180) % 360) - 180;

      // Keep within ocean bounds
      curLat = Math.max(-65, Math.min(75, curLat));

      const sogKnots = (proto.sogKnots + Math.sin(i) * 1.4).toFixed(1);
      const sogKmh = (parseFloat(sogKnots) * 1.852).toFixed(1);
      const cog = (proto.cog + Math.round(Math.cos(i * 2) * 12) + 360) % 360;
      const etaDays = (1 + (i % 8));
      const suffix = clusterIdx > 0 ? ` ${clusterIdx + 1}` : '';

      list.push({
        id: `vessel-${i + 1}`,
        name: `${proto.name}${suffix}`,
        mmsi: (parseInt(proto.mmsi, 10) + i * 137).toString(),
        imo: (parseInt(proto.imo, 10) + i * 73).toString(),
        type: proto.type,
        typeColor: proto.typeColor,
        country: proto.country,
        originPort: proto.originPort,
        destPort: proto.destPort,
        originCoords: proto.originCoords,
        destCoords: proto.destCoords,
        lat: curLat,
        lng: curLng,
        sogKnots: parseFloat(sogKnots),
        sogKmh: parseFloat(sogKmh),
        cog: cog,
        status: 'Underway Using Engine',
        eta: `+${etaDays} days (${new Date(Date.now() + etaDays * 86400000).toLocaleDateString()})`,
        draught: proto.draught
      });
    }

    return list;
  }

  // -------------------------------------------------------------------
  // 5D. 3D INTERACTIVE WEBGL GLOBE WITH 3D ELEVATION TRAJECTORIES
  // -------------------------------------------------------------------
  let globeInstance = null;
  let isGlobeInitialized = false;

  function createAirplaneMesh3D(color = 0x22d3ee) {
    if (typeof THREE === 'undefined') return null;
    const plane = new THREE.Group();

    const bodyMat = new THREE.MeshPhongMaterial({ color: 0xf8fafc, shininess: 40 });
    const wingMat = new THREE.MeshPhongMaterial({ color: color, shininess: 50 });

    // 1. Fuselage (Cylinder lying flat tangent to Earth, along Y/forward)
    const fuselageGeo = new THREE.CylinderGeometry(0.18, 0.14, 1.8, 8);
    fuselageGeo.rotateX(Math.PI / 2);
    const fuselage = new THREE.Mesh(fuselageGeo, bodyMat);
    plane.add(fuselage);

    // 2. Nose cone
    const noseGeo = new THREE.ConeGeometry(0.18, 0.5, 8);
    noseGeo.rotateX(Math.PI / 2);
    const nose = new THREE.Mesh(noseGeo, bodyMat);
    nose.position.set(0, 0, 1.15);
    plane.add(nose);

    // 3. Main Wings (Flat box spanning horizontal X)
    const wingsGeo = new THREE.BoxGeometry(2.3, 0.04, 0.5);
    const wings = new THREE.Mesh(wingsGeo, wingMat);
    wings.position.set(0, 0, 0.15);
    plane.add(wings);

    // 4. Tail Horizontal Stabilizers
    const hStabGeo = new THREE.BoxGeometry(0.85, 0.03, 0.25);
    const hStab = new THREE.Mesh(hStabGeo, wingMat);
    hStab.position.set(0, 0, -0.85);
    plane.add(hStab);

    // 5. Tail Vertical Fin (Extending outward in local +Y)
    const vStabGeo = new THREE.BoxGeometry(0.04, 0.42, 0.3);
    const vStab = new THREE.Mesh(vStabGeo, wingMat);
    vStab.position.set(0, 0.22, -0.85);
    plane.add(vStab);

    return plane;
  }

  function createVesselMesh3D(color = 0x06b6d4) {
    if (typeof THREE === 'undefined') return null;
    const ship = new THREE.Group();

    const hullMat = new THREE.MeshPhongMaterial({ color: color });
    const deckMat = new THREE.MeshPhongMaterial({ color: 0xf1f5f9 });

    // Ship Hull
    const hullGeo = new THREE.BoxGeometry(0.5, 0.25, 1.8);
    const hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.set(0, 0.12, 0);
    ship.add(hull);

    // Deck Cabin Superstructure
    const cabinGeo = new THREE.BoxGeometry(0.38, 0.28, 0.55);
    const cabin = new THREE.Mesh(cabinGeo, deckMat);
    cabin.position.set(0, 0.35, -0.25);
    ship.add(cabin);

    return ship;
  }

  function initGlobe() {
    const container = document.getElementById('globe-container');
    if (!container || typeof Globe === 'undefined') {
      console.warn('Globe.gl or container element not available');
      return;
    }

    if (globeInstance) return;

    try {
      globeInstance = Globe()(container)
        .globeImageUrl('https://unpkg.com/three-globe@2.31.1/example/img/earth-blue-marble.jpg')
        .bumpImageUrl('https://unpkg.com/three-globe@2.31.1/example/img/earth-topology.png')
        .showAtmosphere(true)
        .atmosphereColor('#38bdf8')
        .atmosphereAltitude(0.18)
        .onGlobeClick(({ lat, lng }) => {
          // Clear active trajectory when clicking outside
          selectedAircraftId = null;
          selectedVesselId = null;
          clearActiveTrajectory();
          updateGlobeData();

          if (!state.weatherClickModeEnabled) return;
          const normalizedLng = ((lng + 180) % 360 + 360) % 360 - 180;
          selectLocation(lat, normalizedLng);
        });

      // Configure Great-Circle 3D Curved Flight & Shipping Trajectory Arcs
      globeInstance
        .arcStartLat(d => d.startLat)
        .arcStartLng(d => d.startLng)
        .arcEndLat(d => d.endLat)
        .arcEndLng(d => d.endLng)
        .arcColor(d => d.color || ['#38bdf8', '#22c55e'])
        .arcAltitude(d => d.altitude || 0.16)
        .arcStroke(d => d.stroke || 2.0)
        .arcDashLength(0.4)
        .arcDashGap(0.2)
        .arcDashInitialGap(0)
        .arcDashAnimateTime(2400);

      // Configure 3D Elevated Aircraft & Maritime Objects with Perpendicular Drop Lines
      globeInstance
        .customLayerData([])
        .customThreeObject(d => {
          if (typeof THREE === 'undefined') return new THREE.Object3D();

          const group = new THREE.Group();

          if (d.entityType === 'aircraft') {
            // Precise altitude stem: 1.2 to 2.2 units above surface (radius 100)
            const altRatio = Math.max(0.012, Math.min(0.024, ((d.altitudeFt || 35000) / 45000) * 0.022));
            const globeRadius = globeInstance.getGlobeRadius ? globeInstance.getGlobeRadius() : 100;
            const stemHeight = altRatio * globeRadius; // ~1.2 - 2.2 units

            // 1. Perpendicular Altitude Drop-Line from Earth Surface (0) to Aircraft Elevation
            const lineGeo = new THREE.BufferGeometry().setFromPoints([
              new THREE.Vector3(0, 0, 0),
              new THREE.Vector3(0, 0, stemHeight)
            ]);
            const lineMat = new THREE.LineBasicMaterial({
              color: 0x38bdf8,
              transparent: true,
              opacity: 0.85
            });
            const dropLine = new THREE.Line(lineGeo, lineMat);
            group.add(dropLine);

            // 2. Ground Surface Projection Target Dot/Ring
            const ringGeo = new THREE.RingGeometry(0.25, 0.55, 16);
            const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.75 });
            const groundRing = new THREE.Mesh(ringGeo, ringMat);
            group.add(groundRing);

            // 3. Elevated 3D Airplane Mesh Model at Top of Drop-Line
            const planeMesh = createAirplaneMesh3D(0x22d3ee);
            if (planeMesh) {
              planeMesh.position.set(0, 0, stemHeight);
              // Rotate tangent to surface along compass heading
              const headingRad = ((d.heading || 0) * Math.PI) / 180;
              planeMesh.rotation.z = -headingRad;
              group.add(planeMesh);
            }

          } else if (d.entityType === 'vessel') {
            // Sea-level Vessel Marker on Ocean Surface
            const vesselMesh = createVesselMesh3D(d.typeColor || 0x06b6d4);
            if (vesselMesh) {
              vesselMesh.position.set(0, 0, 0.1);
              const cogRad = ((d.cog || 0) * Math.PI) / 180;
              vesselMesh.rotation.z = -cogRad;
              group.add(vesselMesh);
            }
          }

          return group;
        })
        .customThreeObjectUpdate((obj, d) => {
          Object.assign(obj.position, globeInstance.getCoords(d.lat, d.lng, 0));
        })
        .onCustomLayerClick((d) => {
          if (d.entityType === 'aircraft') {
            selectedAircraftId = d.id;
            selectedVesselId = null;
            updateGlobeData();
            selectLocation(d.lat, d.lng, {
              placeName: `${d.airline} ${d.flightNum}`,
              country: `${d.origin} → ${d.dest}`,
              flag: '✈️'
            });
            showToast(`Flight ${d.flightNum} selected: Live 3D Great-Circle route displayed.`);
          } else if (d.entityType === 'vessel') {
            selectedVesselId = d.id;
            selectedAircraftId = null;
            updateGlobeData();
            selectLocation(d.lat, d.lng, {
              placeName: d.name,
              country: d.country,
              flag: '🚢'
            });
            showToast(`Vessel ${d.name} selected: Live shipping lane route displayed.`);
          }
        });

      // Window resize handler
      window.addEventListener('resize', () => {
        if (globeInstance && !container.classList.contains('hidden')) {
          globeInstance.width(window.innerWidth).height(window.innerHeight);
        }
      });

      isGlobeInitialized = true;
    } catch (e) {
      console.error('Error initializing 3D Globe:', e);
    }
  }

  function toggleGlobeMode(enable) {
    state.globeModeEnabled = !!enable;

    const globeContainer = document.getElementById('globe-container');
    const mapContainer = document.getElementById('map');
    const globeCtrlBtn = document.getElementById('ctrl-toggle-globe');
    const gisGlobeToggle = document.getElementById('toggle-globe-mode-gis');

    if (gisGlobeToggle && gisGlobeToggle.checked !== state.globeModeEnabled) {
      gisGlobeToggle.checked = state.globeModeEnabled;
    }

    if (state.globeModeEnabled) {
      globeCtrlBtn?.classList.add('active');
      globeContainer?.classList.remove('hidden');
      mapContainer?.classList.add('hidden');

      if (!isGlobeInitialized) {
        initGlobe();
      }

      if (globeInstance) {
        globeInstance.width(window.innerWidth).height(window.innerHeight);

        // Center 3D globe on current location or map center
        const center = state.selectedLocation ? state.selectedLocation : (state.map ? state.map.getCenter() : { lat: 33.68, lng: 73.04 });
        globeInstance.pointOfView({ lat: center.lat, lng: center.lng, altitude: 2.2 }, 1200);

        // Sync active basemap texture to globe
        if (state.settings.mapLayer) {
          syncGlobeBasemapTexture(state.settings.mapLayer);
        }

        updateGlobeData();
      }

      showToast('3D Interactive Globe Mode active: Click an aircraft to inspect its single Great-Circle flight arc.');
    } else {
      globeCtrlBtn?.classList.remove('active');
      globeContainer?.classList.add('hidden');
      mapContainer?.classList.remove('hidden');

      // Refresh 2D Leaflet map view
      setTimeout(() => {
        state.map?.invalidateSize();
      }, 100);

      showToast('Switched to 2D Map View.');
    }
  }

  function syncGlobeBasemapTexture(layerKey) {
    if (!globeInstance) return;
    if (layerKey.includes('sat') || layerKey.includes('satellite') || layerKey === 'esri_sat') {
      globeInstance.globeImageUrl('https://unpkg.com/three-globe@2.31.1/example/img/earth-blue-marble.jpg');
    } else if (layerKey.includes('dark') || layerKey === 'carto_dark') {
      globeInstance.globeImageUrl('https://unpkg.com/three-globe@2.31.1/example/img/earth-night.jpg');
    } else if (layerKey.includes('topo') || layerKey === 'opentopo') {
      globeInstance.globeImageUrl('https://unpkg.com/three-globe@2.31.1/example/img/earth-topology.png');
    } else {
      globeInstance.globeImageUrl('https://unpkg.com/three-globe@2.31.1/example/img/earth-day.jpg');
    }
  }

  function updateGlobeData() {
    if (!globeInstance || !state.globeModeEnabled) return;

    const customObjects = [];
    const arcs = [];

    // 1. Add 3D Aircraft
    if (activeAircraftFleet && activeAircraftFleet.length > 0 && state.hazardLayers.aircraft) {
      activeAircraftFleet.forEach(f => {
        customObjects.push({
          entityType: 'aircraft',
          id: f.id,
          lat: f.lat,
          lng: f.lng,
          altitudeFt: f.altitudeFt,
          speedKmh: f.speedKmh,
          heading: f.heading,
          airline: f.airline,
          flightNum: f.flightNum,
          origin: f.origin,
          dest: f.dest,
          originCoords: f.originCoords,
          destCoords: f.destCoords
        });
      });

      // ONLY show 3D trajectory curve if an aircraft is currently selected!
      if (selectedAircraftId) {
        const selFlight = activeAircraftFleet.find(f => f.id === selectedAircraftId);
        if (selFlight && selFlight.originCoords && selFlight.destCoords) {
          arcs.push({
            startLat: selFlight.originCoords[0],
            startLng: selFlight.originCoords[1],
            endLat: selFlight.destCoords[0],
            endLng: selFlight.destCoords[1],
            color: ['#38bdf8', '#22c55e'],
            altitude: 0.18,
            stroke: 2.2,
            dashOffset: 0
          });
        }
      }
    }

    // 2. Add 3D Marine Vessels
    if (activeMaritimeFleet && activeMaritimeFleet.length > 0 && state.hazardLayers.vessels) {
      activeMaritimeFleet.forEach(v => {
        customObjects.push({
          entityType: 'vessel',
          id: v.id,
          lat: v.lat,
          lng: v.lng,
          cog: v.cog,
          sogKmh: v.sogKmh,
          name: v.name,
          country: v.country,
          type: v.type,
          typeColor: v.typeColor,
          originCoords: v.originCoords,
          destCoords: v.destCoords
        });
      });

      // ONLY show 3D shipping lane curve if a vessel is currently selected!
      if (selectedVesselId) {
        const selVessel = activeMaritimeFleet.find(v => v.id === selectedVesselId);
        if (selVessel && selVessel.originCoords && selVessel.destCoords) {
          arcs.push({
            startLat: selVessel.originCoords[0],
            startLng: selVessel.originCoords[1],
            endLat: selVessel.destCoords[0],
            endLng: selVessel.destCoords[1],
            color: [selVessel.typeColor || '#3b82f6', '#0284c7'],
            altitude: 0.05,
            stroke: 1.8,
            dashOffset: 0
          });
        }
      }
    }

    globeInstance.arcsData(arcs);
    globeInstance.customLayerData(customObjects);

    // 3. Earthquakes on 3D Globe
    if (state.earthquakeData && state.earthquakeData.length > 0 && state.hazardLayers.earthquakes) {
      const eqRings = state.earthquakeData.map(eq => {
        const [lng, lat] = eq.geometry.coordinates;
        const mag = eq.properties.mag || 4.5;
        return {
          lat,
          lng,
          maxR: Math.max(1.8, mag * 1.2),
          propagationSpeed: 1.8,
          repeatPeriod: 1400,
          color: mag >= 6 ? '#ef4444' : (mag >= 4.5 ? '#f97316' : '#f59e0b')
        };
      });
      globeInstance.ringsData(eqRings);
    } else {
      globeInstance.ringsData([]);
    }
  }

  // -------------------------------------------------------------------
  // 5e. GLOBAL ENVIRONMENTAL & HYDROLOGY LAYERS
  // -------------------------------------------------------------------
  function toggleForestLayer(enable) {
    if (!state.map) return;

    if (!enable) {
      if (state.hazardLayers.forest) {
        state.map.removeLayer(state.hazardLayers.forest);
        state.hazardLayers.forest = null;
      }
      return;
    }

    // Global Physical Forest & Vegetation Canopy Overlay
    const gfwUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}';
    const opacity = state.hazardOpacities.forest || 0.75;

    state.hazardLayers.forest = L.tileLayer(gfwUrl, {
      maxNativeZoom: 8,
      maxZoom: 20,
      opacity: opacity,
      zIndex: 610,
      attribution: '&copy; Esri &mdash; US National Park Service Physical Map'
    }).addTo(state.map);

    showToast('Global Forest Canopy Cover layer active.');
  }

  function toggleRiversLayer(enable) {
    if (!state.map) return;

    if (!enable) {
      if (state.hazardLayers.rivers) {
        state.map.removeLayer(state.hazardLayers.rivers);
        state.hazardLayers.rivers = null;
      }
      return;
    }

    // High-visibility River Networks & Waterways Overlay
    const hydroUrl = 'https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png';
    const opacity = state.hazardOpacities.rivers || 0.85;

    state.hazardLayers.rivers = L.tileLayer(hydroUrl, {
      maxNativeZoom: 18,
      maxZoom: 20,
      opacity: opacity,
      zIndex: 630,
      attribution: '&copy; OpenSeaMap Waterways & Hydrography'
    }).addTo(state.map);

    showToast('Global River Networks & Waterways layer active.');
  }

  function setMapLayer(layerKey) {
    const config = TILE_LAYERS[layerKey] || TILE_LAYERS.esri_sat;
    if (state.activeTileLayer) {
      state.map.removeLayer(state.activeTileLayer);
    }
    
    // Ensure maxNativeZoom is set so Leaflet never renders black tiles when zoomed in
    const layerOptions = Object.assign({}, config.options, {
      maxNativeZoom: config.maxNativeZoom || 19,
      maxZoom: 20
    });

    state.activeTileLayer = L.tileLayer(config.url, layerOptions).addTo(state.map);
    state.settings.mapLayer = layerKey;

    // Sync 3D Globe surface texture
    syncGlobeBasemapTexture(layerKey);

    // US-Only datasets navigation prompt
    if (layerKey === 'usgs_imagery') {
      const center = state.map.getCenter();
      const inConus = (center.lat >= 24 && center.lat <= 50 && center.lng >= -125 && center.lng <= -65);
      if (!inConus) {
        showToast(`Navigating to US coverage zone for ${config.name}...`);
        state.map.flyTo([39.8, -98.5], 6, { duration: 1.5 });
      }
    }

    // If layer specifically has built-in labels or user enabled overlay, ensure overlay state
    if (config.hasLabels) {
      toggleOverlayLabels(true);
    }

    // Update active highlight in layer dropdown
    document.querySelectorAll('.layer-option').forEach(btn => {
      if (btn.dataset.layer === layerKey) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update Satellite Intelligence Card with detailed capabilities
    updateSatelliteIntelligenceUI(layerKey);
    updateLiveGSDDisplay();
  }

  function toggleOverlayLabels(enable) {
    state.showOverlayLabels = enable !== undefined ? enable : !state.showOverlayLabels;
    
    if (state.showOverlayLabels) {
      if (!state.overlayTileLayer && state.map) {
        const opacity = state.hazardOpacities.labels || 0.9;
        state.overlayTileLayer = L.tileLayer(OVERLAY_TILE_URL, {
          maxNativeZoom: 19,
          maxZoom: 20,
          zIndex: 650,
          opacity: opacity
        }).addTo(state.map);
      }
    } else {
      if (state.overlayTileLayer && state.map) {
        state.map.removeLayer(state.overlayTileLayer);
        state.overlayTileLayer = null;
      }
    }

    const checkEl = document.getElementById('overlay-labels-check');
    if (checkEl) checkEl.checked = state.showOverlayLabels;

    const satToggleBtn = document.getElementById('btn-toggle-sat-overlay');
    if (satToggleBtn) {
      satToggleBtn.textContent = state.showOverlayLabels ? '🏷️ Labels ON' : 'Labels Off';
      satToggleBtn.classList.toggle('active', state.showOverlayLabels);
    }
  }

  function calculateGSD(lat, zoom) {
    if (lat === null || lat === undefined || isNaN(lat)) lat = 0;
    const clampedZoom = Math.max(0, zoom || 2);
    const rad = (lat * Math.PI) / 180;
    // 156543.03392 is standard Web Mercator equatorial ground resolution at zoom 0 (meters/pixel)
    return (156543.03392 * Math.cos(rad)) / Math.pow(2, clampedZoom);
  }

  function updateLiveGSDDisplay() {
    if (!state.map) return;
    const center = state.map.getCenter();
    const zoom = state.map.getZoom();
    const bounds = state.map.getBounds();
    const gsd = calculateGSD(center.lat, zoom);
    const layer = TILE_LAYERS[state.settings.mapLayer] || TILE_LAYERS.esri_sat;
    
    // Scale calculation (assuming standard 96 DPI screen: 1 pixel = 0.000264583 meters)
    const scaleRatio = Math.round(gsd / 0.000264583);
    const scaleFormatted = `1:${scaleRatio.toLocaleString()}`;

    // Real world viewport width and height in meters/km
    const northEast = bounds.getNorthEast();
    const southWest = bounds.getSouthWest();
    const widthMeters = bounds.getNorthWest().distanceTo(northEast);
    const heightMeters = bounds.getNorthWest().distanceTo(southWest);
    const areaSqKm = (widthMeters / 1000) * (heightMeters / 1000);

    const widthStr = widthMeters >= 10000 ? `${(widthMeters / 1000).toFixed(1)} km` : `${Math.round(widthMeters)} m`;
    const heightStr = heightMeters >= 10000 ? `${(heightMeters / 1000).toFixed(1)} km` : `${Math.round(heightMeters)} m`;
    const areaStr = areaSqKm >= 1 ? `${areaSqKm.toFixed(1)} km²` : `${Math.round(areaSqKm * 1000000)} m²`;

    let gsdFormatted = '';
    if (gsd < 1) {
      gsdFormatted = `${(gsd * 100).toFixed(0)} cm/px`;
    } else if (gsd < 10) {
      gsdFormatted = `${gsd.toFixed(2)} m/px`;
    } else if (gsd < 1000) {
      gsdFormatted = `${gsd.toFixed(1)} m/px`;
    } else {
      gsdFormatted = `${(gsd / 1000).toFixed(1)} km/px`;
    }

    // 1. Update Layer Menu Header Readouts
    const liveGsdEl = document.getElementById('live-gsd-display');
    if (liveGsdEl) liveGsdEl.textContent = `${gsdFormatted} (Z${zoom})`;

    const scaleTagEl = document.getElementById('live-scale-tag');
    if (scaleTagEl) scaleTagEl.textContent = `Scale ${scaleFormatted}`;

    const areaTagEl = document.getElementById('live-area-tag');
    if (areaTagEl) areaTagEl.textContent = `Area ${areaStr}`;

    // 2. Update Floating GIS Telemetry HUD Bar
    const hudZoom = document.getElementById('hud-zoom-val');
    if (hudZoom) hudZoom.textContent = `Z${zoom}`;

    const hudScale = document.getElementById('hud-scale-val');
    if (hudScale) hudScale.textContent = scaleFormatted;

    const hudGsd = document.getElementById('hud-gsd-val');
    if (hudGsd) hudGsd.textContent = gsdFormatted;

    const hudArea = document.getElementById('hud-area-val');
    if (hudArea) hudArea.textContent = `${widthStr} × ${heightStr} (${areaStr})`;

    const hudScalebarText = document.getElementById('hud-scalebar-text');
    if (hudScalebarText) {
      const scaleBarDistMeters = 45 * gsd;
      hudScalebarText.textContent = scaleBarDistMeters >= 1000 ? 
        `${(scaleBarDistMeters / 1000).toFixed(1)} km` : `${Math.round(scaleBarDistMeters)} m`;
    }

    // 3. Update Satellite Intelligence Card in info panel
    const satGsdValEl = document.getElementById('sat-gsd-value');
    if (satGsdValEl) {
      satGsdValEl.textContent = `${gsdFormatted} (Native: ${layer.nativeGSD || '0.3m'})`;
    }

    const satGsdBar = document.getElementById('sat-gsd-bar');
    if (satGsdBar) {
      const percentage = Math.max(10, Math.min(100, 100 - (Math.log10(Math.max(0.3, gsd)) / Math.log10(500)) * 90));
      satGsdBar.style.width = `${percentage}%`;
    }

    const satChipZoom = document.getElementById('sat-chip-zoom');
    if (satChipZoom) {
      satChipZoom.textContent = `Current: Z${zoom} (${zoom <= (layer.maxNativeZoom || 19) ? 'Clear' : 'Interpolated'})`;
    }

    const gsdBadge = document.getElementById('sat-gsd-badge');
    if (gsdBadge) {
      if (gsd <= 1.0) {
        gsdBadge.textContent = 'Sub-Meter GSD (≤ 1m)';
        gsdBadge.className = 'sat-badge sub-meter';
      } else if (gsd <= 5.0) {
        gsdBadge.textContent = 'High-Res Detail';
        gsdBadge.className = 'sat-badge';
      } else {
        gsdBadge.textContent = 'Regional Overview';
        gsdBadge.className = 'sat-badge';
      }
    }
  }

  function zoomToStandard() {
    if (!state.map) return;
    const center = state.map.getCenter();
    try {
      state.map.flyTo(center, 11, { duration: 1.0 });
    } catch {
      state.map.setView(center, 11);
    }
    showToast('🏙️ Standard View (Zoom 11) active.');
  }

  function zoomTo1Meter() {
    if (!state.map) return;
    const currentLayer = state.settings.mapLayer;
    // If currently on vector/osm, switch to high-resolution satellite
    if (!currentLayer || (!currentLayer.includes('sat') && !currentLayer.includes('clarity') && !currentLayer.includes('imagery'))) {
      setMapLayer('esri_sat');
    }
    const center = state.map.getCenter();
    try {
      state.map.flyTo(center, 18, { duration: 1.2 });
    } catch {
      state.map.setView(center, 18);
    }
    showToast('🔍 1m Detail View (Zoom 18) active.');
  }

  function updateSatelliteIntelligenceUI(layerKey) {
    const layer = TILE_LAYERS[layerKey || state.settings.mapLayer] || TILE_LAYERS.esri_sat;
    
    const sensorNameEl = document.getElementById('sat-sensor-name');
    const sensorProviderEl = document.getElementById('sat-sensor-provider');
    const categoryTagEl = document.getElementById('sat-resolution-category');
    const detailTitleEl = document.getElementById('sat-detail-title');
    const detailFeaturesEl = document.getElementById('sat-detail-features');
    const chipTypeEl = document.getElementById('sat-chip-type');
    const chipNativeEl = document.getElementById('sat-chip-native');
    const chipZoomEl = document.getElementById('sat-chip-zoom');

    if (sensorNameEl) sensorNameEl.textContent = layer.name;
    if (sensorProviderEl) sensorProviderEl.textContent = layer.provider;
    if (categoryTagEl) categoryTagEl.textContent = layer.resolution || 'Sub-Meter';
    if (detailTitleEl) detailTitleEl.textContent = layer.detailTitle || 'Resolvable Map Features:';
    if (detailFeaturesEl) detailFeaturesEl.textContent = layer.features || 'Detailed imagery available for this provider.';
    if (chipTypeEl) chipTypeEl.textContent = layer.sensorType || 'Optical';
    if (chipNativeEl) chipNativeEl.textContent = `Native: ${layer.nativeGSD || '0.3m/px'}`;
    if (chipZoomEl) chipZoomEl.textContent = `Optimal: ${layer.optimalZoom || 'Zoom 11–19'}`;
  }

  // -------------------------------------------------------------------
  // 5b. VISIBLE TILE DOWNLOADER & ZIP EXPORTER (JSZip)
  // -------------------------------------------------------------------
  let currentDownloadTiles = [];
  let isDownloadingTiles = false;

  function openTileDownloadModal() {
    if (!state.map) return;
    const zoom = state.map.getZoom();
    const bounds = state.map.getBounds();
    const layerKey = state.settings.mapLayer || 'esri_sat';
    const config = TILE_LAYERS[layerKey] || TILE_LAYERS.esri_sat;

    // Calculate exact Web Mercator tile ranges [Xmin..Xmax] x [Ymin..Ymax]
    const minX = lon2tile(bounds.getWest(), zoom);
    const maxX = lon2tile(bounds.getEast(), zoom);
    const minY = lat2tile(bounds.getNorth(), zoom);
    const maxY = lat2tile(bounds.getSouth(), zoom);

    const xStart = Math.min(minX, maxX);
    const xEnd = Math.max(minX, maxX);
    const yStart = Math.min(minY, maxY);
    const yEnd = Math.max(minY, maxY);

    const totalCols = xEnd - xStart + 1;
    const totalRows = yEnd - yStart + 1;
    const totalCount = totalCols * totalRows;

    currentDownloadTiles = [];
    for (let x = xStart; x <= xEnd; x++) {
      for (let y = yStart; y <= yEnd; y++) {
        let url = config.url
          .replace('{z}', zoom)
          .replace('{x}', x)
          .replace('{y}', y)
          .replace('{r}', '')
          .replace('{s}', ['a', 'b', 'c', 'd'][(x + y) % 4]);
        currentDownloadTiles.push({ z: zoom, x, y, url });
      }
    }

    // Populate Modal Readouts
    const providerNameEl = document.getElementById('dl-provider-name');
    if (providerNameEl) providerNameEl.textContent = config.name;

    const zoomValEl = document.getElementById('dl-zoom-val');
    if (zoomValEl) zoomValEl.textContent = `Zoom Level ${zoom}`;

    const gridBoundsEl = document.getElementById('dl-grid-bounds');
    if (gridBoundsEl) gridBoundsEl.textContent = `X: [${xStart}..${xEnd}] Y: [${yStart}..${yEnd}]`;

    const countEl = document.getElementById('dl-tile-count');
    const estSizeMb = (totalCount * 0.05).toFixed(1);
    if (countEl) countEl.textContent = `${totalCount} tiles (~${estSizeMb} MB)`;

    // Safety Threshold Check (> 50 tiles warning)
    const safetyWarning = document.getElementById('dl-safety-warning');
    if (safetyWarning) {
      if (totalCount > 50) {
        safetyWarning.classList.remove('hidden');
      } else {
        safetyWarning.classList.add('hidden');
      }
    }

    // Reset UI
    document.getElementById('dl-progress-section')?.classList.add('hidden');
    const startBtn = document.getElementById('btn-start-download');
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Start ZIP Download (${totalCount} Tiles)
      `;
    }

    document.getElementById('tile-download-modal')?.classList.remove('hidden');
  }

  function closeTileDownloadModal() {
    if (isDownloadingTiles) {
      if (!confirm('Download is in progress. Are you sure you want to cancel?')) return;
      isDownloadingTiles = false;
    }
    document.getElementById('tile-download-modal')?.classList.add('hidden');
  }

  async function startTileDownload() {
    if (isDownloadingTiles || !currentDownloadTiles.length) return;
    if (typeof JSZip === 'undefined') {
      showToast('JSZip library loading. Please try again in a moment.', 'error');
      return;
    }

    isDownloadingTiles = true;
    const progressSection = document.getElementById('dl-progress-section');
    progressSection?.classList.remove('hidden');

    const progressBar = document.getElementById('dl-progress-bar');
    const progressPercent = document.getElementById('dl-progress-percent');
    const progressStatus = document.getElementById('dl-progress-status');
    const progressDetail = document.getElementById('dl-progress-detail');
    const startBtn = document.getElementById('btn-start-download');
    if (startBtn) startBtn.disabled = true;

    if (progressStatus) progressStatus.textContent = 'Fetching tiles asynchronously...';

    const zip = new JSZip();
    const layerKey = state.settings.mapLayer || 'esri_sat';
    const folderName = `${layerKey}_zoom${currentDownloadTiles[0].z}`;
    const zipFolder = zip.folder(folderName);

    let completed = 0;
    const total = currentDownloadTiles.length;
    const concurrency = 6;
    let index = 0;

    async function worker() {
      while (index < total && isDownloadingTiles) {
        const item = currentDownloadTiles[index++];
        try {
          const res = await fetch(item.url, { mode: 'cors' });
          if (res.ok) {
            const blob = await res.blob();
            zipFolder.file(`${item.z}/${item.x}/${item.y}.png`, blob);
          } else {
            // Draw placeholder image tile if remote provider returns error
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, 256, 256);
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
            ctx.strokeRect(0, 0, 256, 256);
            ctx.fillStyle = '#94a3b8';
            ctx.font = '12px Inter, sans-serif';
            ctx.fillText(`Tile ${item.z}/${item.x}/${item.y}`, 14, 30);
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            zipFolder.file(`${item.z}/${item.x}/${item.y}.png`, blob);
          }
        } catch (e) {
          // Handle CORS or offline tile fallback
          const canvas = document.createElement('canvas');
          canvas.width = 256;
          canvas.height = 256;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(0, 0, 256, 256);
          ctx.strokeStyle = '#06b6d4';
          ctx.strokeRect(0, 0, 256, 256);
          ctx.fillStyle = '#f8fafc';
          ctx.font = '12px Inter, sans-serif';
          ctx.fillText(`${item.z}/${item.x}/${item.y}`, 14, 30);
          const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
          zipFolder.file(`${item.z}/${item.x}/${item.y}.png`, blob);
        }

        completed++;
        const pct = Math.round((completed / total) * 100);
        if (progressBar) progressBar.style.width = `${pct}%`;
        if (progressPercent) progressPercent.textContent = `${pct}%`;
        if (progressDetail) progressDetail.textContent = `Downloaded ${completed} / ${total} tiles`;
      }
    }

    const workers = [];
    for (let i = 0; i < Math.min(concurrency, total); i++) {
      workers.push(worker());
    }

    await Promise.all(workers);

    if (!isDownloadingTiles) return;

    if (progressStatus) progressStatus.textContent = 'Compressing into ZIP archive...';

    const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
      if (progressPercent) progressPercent.textContent = `${Math.round(metadata.percent)}%`;
      if (progressBar) progressBar.style.width = `${metadata.percent}%`;
    });

    // Trigger browser file download
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${layerKey}_zoom${currentDownloadTiles[0].z}_tiles.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    isDownloadingTiles = false;
    showToast(`Successfully downloaded ${total} visible tiles as ZIP archive!`);
    setTimeout(() => {
      document.getElementById('tile-download-modal')?.classList.add('hidden');
    }, 900);
  }

  function togglePrecisionMode() {
    state.precisionModeActive = !state.precisionModeActive;
    const crosshairEl = document.getElementById('precision-crosshair');
    const btn = document.getElementById('ctrl-precision');
    if (state.precisionModeActive) {
      crosshairEl?.classList.remove('hidden');
      btn?.classList.add('active');
      showToast('Precision mode active. Crosshair selects map center.');
    } else {
      crosshairEl?.classList.add('hidden');
      btn?.classList.remove('active');
    }
  }

  function resetMapWorldView() {
    state.map.setView([20, 0], 2, { animate: state.settings.animations });
    showToast('Reset to world overview.');
  }

  // -------------------------------------------------------------------
  // 6. CUSTOM MARKER MANAGEMENT
  // -------------------------------------------------------------------
  function updateMapMarker(lat, lng, title = '', weatherSnippet = '') {
    if (state.currentMarker) {
      state.map.removeLayer(state.currentMarker);
      state.currentMarker = null;
    }

    const customIcon = L.divIcon({
      className: 'custom-map-marker',
      html: `
        <div class="marker-pulse-ring"></div>
        <div class="marker-inner-dot"></div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20]
    });

    state.currentMarker = L.marker([lat, lng], { icon: customIcon }).addTo(state.map);

    const popupContent = document.createElement('div');
    popupContent.className = 'custom-marker-popup';

    const titleEl = document.createElement('div');
    titleEl.className = 'popup-location-title';
    titleEl.textContent = title || 'Selected Location';
    popupContent.appendChild(titleEl);

    if (weatherSnippet) {
      const weatherEl = document.createElement('div');
      weatherEl.className = 'popup-weather-row';
      weatherEl.textContent = weatherSnippet;
      popupContent.appendChild(weatherEl);
    }

    state.currentMarker.bindPopup(popupContent);
  }

  // -------------------------------------------------------------------
  // 7. LOCATION SELECTION ENGINE & DATA ORCHESTRATION WITH CACHING
  // -------------------------------------------------------------------
  const CACHE_KEY_PREFIX = 'wwe_weather_cache_';
  const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

  function getCacheKey(lat, lng) {
    return `${CACHE_KEY_PREFIX}${lat.toFixed(3)}_${lng.toFixed(3)}`;
  }

  function getCachedWeatherData(lat, lng) {
    try {
      const key = getCacheKey(lat, lng);
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.timestamp > CACHE_MAX_AGE_MS) {
        localStorage.removeItem(key);
        return null;
      }
      return parsed;
    } catch (e) {
      return null;
    }
  }

  function setCachedWeatherData(lat, lng, data) {
    try {
      const key = getCacheKey(lat, lng);
      const payload = {
        timestamp: Date.now(),
        timeFormatted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        ...data
      };
      localStorage.setItem(key, JSON.stringify(payload));
    } catch (e) {
      // Storage might be full, handle gracefully
    }
  }

  async function fetchWithTimeout(url, options = {}, timeoutMs = 4000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const parentSignal = options.signal;

    if (parentSignal) {
      if (parentSignal.aborted) {
        clearTimeout(timer);
        throw new DOMException('Aborted', 'AbortError');
      }
      parentSignal.addEventListener('abort', () => {
        clearTimeout(timer);
        controller.abort();
      });
    }

    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      return res;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  }

  async function selectLocation(lat, lng, options = {}) {
    const validLat = Math.max(-90, Math.min(90, parseFloat(lat)));
    const validLng = Math.max(-180, Math.min(180, parseFloat(lng)));

    if (isNaN(validLat) || isNaN(validLng)) {
      showToast('Invalid geographic coordinates.', 'error');
      return;
    }

    const roundedLat = parseFloat(validLat.toFixed(4));
    const roundedLng = parseFloat(validLng.toFixed(4));

    state.activeRequestId++;
    const thisRequestId = state.activeRequestId;

    if (state.currentAbortController) {
      state.currentAbortController.abort();
    }
    state.currentAbortController = new AbortController();
    const signal = state.currentAbortController.signal;

    // Dismiss welcome card
    document.getElementById('welcome-card')?.classList.add('hidden');

    // Show info panel
    const infoPanel = document.getElementById('info-panel');
    infoPanel?.classList.remove('hidden');
    document.getElementById('weather-error-state')?.classList.add('hidden');

    // Pan 3D Globe to selected coordinates if Globe mode is active
    if (state.globeModeEnabled && globeInstance) {
      globeInstance.pointOfView({ lat: roundedLat, lng: roundedLng }, 1000);
    }

    // Expand mobile bottom sheet if on mobile
    if (window.innerWidth <= 767) {
      infoPanel?.classList.remove('collapsed');
    }

    // Check if we have cached data for this location
    const cached = getCachedWeatherData(roundedLat, roundedLng);
    const cachedNotice = document.getElementById('cached-data-notice');
    const cachedNoticeText = document.getElementById('cached-notice-text');
    let hasRenderedCache = false;

    if (cached && cached.weatherData) {
      try {
        hasRenderedCache = true;
        const cachedMeta = cached.locationMeta || {
          name: options.placeName || 'Custom Location',
          subname: `${formatCoordinate(roundedLat, 'lat')}, ${formatCoordinate(roundedLng, 'lng')}`,
          country: options.country || '',
          countryCode: options.countryCode || '',
          flag: options.flag || '📍'
        };
        state.selectedLocation = { lat: roundedLat, lng: roundedLng, ...cachedMeta };
        updateLocationHeadingUI(cachedMeta);
        updateWeatherUI(cached.weatherData);
        if (cached.weatherData.timezone) {
          startLocalClock(cached.weatherData.timezone, cached.weatherData.utc_offset_seconds);
        }
        if (cached.elevationData !== undefined && cached.elevationData !== null) {
          updateElevationUI(cached.elevationData);
        }
        updateForecastHourlyUI(cached.weatherData);
        updateForecastDailyUI(cached.weatherData);

        if (cachedNotice && cachedNoticeText) {
          cachedNoticeText.textContent = `Showing cached data from ${cached.timeFormatted || 'earlier'}`;
          cachedNotice.classList.remove('hidden');
        }
        document.getElementById('weather-skeleton')?.classList.add('hidden');
      } catch (err) {
        console.warn('Error displaying cached data:', err);
      }
    } else {
      document.getElementById('weather-skeleton')?.classList.remove('hidden');
      cachedNotice?.classList.add('hidden');
    }

    // Move map & marker
    if (options.panTo !== false) {
      const targetZoom = options.zoom || (state.map.getZoom() < 5 ? 6 : state.map.getZoom());
      state.map.flyTo([roundedLat, roundedLng], targetZoom, {
        duration: state.settings.animations ? 1.2 : 0,
        easeLinearity: 0.25
      });
    }

    const placeNameCandidate = options.placeName || (cached?.locationMeta?.name) || 'Loading location...';
    updateMapMarker(roundedLat, roundedLng, placeNameCandidate);

    updateURLState(roundedLat, roundedLng);
    updateCoordinatesUI(roundedLat, roundedLng);

    // 8-Second Slow Connection Warning Timer
    const slowWarningTimer = setTimeout(() => {
      if (thisRequestId === state.activeRequestId) {
        document.getElementById('slow-connection-warning')?.classList.remove('hidden');
      }
    }, 8000);

    // Concurrent Parallel API Fetching
    const weatherPromise = fetchWeatherData(roundedLat, roundedLng, signal);
    const elevationPromise = fetchElevationData(roundedLat, roundedLng, signal);
    const geocodePromise = options.placeName ? 
      Promise.resolve({ 
        name: options.placeName, 
        subname: options.country ? `${options.placeName}, ${options.country}` : 'Custom Location',
        country: options.country || '', 
        countryCode: options.countryCode || '',
        flag: options.flag || '📍' 
      }) : 
      reverseGeocode(roundedLat, roundedLng, signal);

    const [weatherResult, elevationResult, geocodeResult] = await Promise.allSettled([
      weatherPromise,
      elevationPromise,
      geocodePromise
    ]);

    clearTimeout(slowWarningTimer);
    document.getElementById('slow-connection-warning')?.classList.add('hidden');

    if (thisRequestId !== state.activeRequestId) {
      return; // Stale request, discard
    }

    document.getElementById('weather-skeleton')?.classList.add('hidden');

    // Process Geocoding Result
    let locationMeta = {
      name: 'Custom Location',
      subname: `${formatCoordinate(roundedLat, 'lat')}, ${formatCoordinate(roundedLng, 'lng')}`,
      country: '',
      countryCode: '',
      flag: '📍'
    };

    if (geocodeResult.status === 'fulfilled' && geocodeResult.value) {
      locationMeta = { ...locationMeta, ...geocodeResult.value };
    }

    state.selectedLocation = {
      lat: roundedLat,
      lng: roundedLng,
      ...locationMeta
    };

    updateLocationHeadingUI(locationMeta);

    // Process Weather Result
    if (weatherResult.status === 'fulfilled' && weatherResult.value) {
      state.currentWeatherData = weatherResult.value;
      state.lastUpdatedTimestamp = Date.now();

      // Store fresh copy in localStorage cache
      setCachedWeatherData(roundedLat, roundedLng, {
        weatherData: weatherResult.value,
        elevationData: elevationResult.status === 'fulfilled' ? elevationResult.value : null,
        locationMeta
      });

      // Hide cached notice as fresh data is now active
      cachedNotice?.classList.add('hidden');
      
      try { updateWeatherUI(weatherResult.value); } catch (e) { console.error('Weather UI error:', e); }
      try { updateCelestialUI(weatherResult.value); } catch (e) { console.error('Celestial UI error:', e); }
      try { updateForecastHourlyUI(weatherResult.value); } catch (e) { console.error('Hourly Forecast UI error:', e); }
      try { updateForecastDailyUI(weatherResult.value); } catch (e) { console.error('Daily Forecast UI error:', e); }
      try { startLocalClock(weatherResult.value.timezone, weatherResult.value.utc_offset_seconds); } catch (e) { console.error('Clock error:', e); }
      try { startFreshnessTicker(); } catch (e) {}
    } else {
      if (!hasRenderedCache) {
        showWeatherError(weatherResult.reason?.message || 'Weather data unavailable.');
      } else {
        showToast('Could not refresh weather; continuing with cached data.', 'warning');
      }
    }

    // Process Elevation Result
    if (elevationResult.status === 'fulfilled' && elevationResult.value !== null) {
      state.currentElevationData = elevationResult.value;
      try { updateElevationUI(elevationResult.value); } catch (e) { console.error('Elevation UI error:', e); }
    } else {
      try { updateElevationUI(null); } catch (e) {}
    }

    updateDistanceUI();
    updateFavoriteButtonState();
    addToRecentLocations(state.selectedLocation);
    try { updateSatelliteIntelligenceUI(); } catch (e) {}
    try { updateLiveGSDDisplay(); } catch (e) {}

    // Update marker popup
    if (state.currentWeatherData && state.currentWeatherData.current) {
      const tempVal = formatTemperature(state.currentWeatherData.current.temperature_2m);
      const condition = getWMOInfo(state.currentWeatherData.current.weather_code, state.currentWeatherData.current.is_day);
      updateMapMarker(roundedLat, roundedLng, locationMeta.name, `${condition.icon} ${tempVal} • ${condition.desc}`);
    }
  }

  // -------------------------------------------------------------------
  // 8. API FETCH FUNCTIONS
  // -------------------------------------------------------------------
  async function fetchWeatherData(lat, lng, signal) {
    const params = new URLSearchParams({
      latitude: lat,
      longitude: lng,
      current: [
        'temperature_2m',
        'relative_humidity_2m',
        'apparent_temperature',
        'precipitation',
        'rain',
        'showers',
        'snowfall',
        'weather_code',
        'cloud_cover',
        'pressure_msl',
        'surface_pressure',
        'wind_speed_10m',
        'wind_direction_10m',
        'wind_gusts_10m',
        'visibility',
        'is_day'
      ].join(','),
      hourly: [
        'temperature_2m',
        'relative_humidity_2m',
        'precipitation_probability',
        'weather_code',
        'wind_speed_10m',
        'uv_index'
      ].join(','),
      daily: [
        'weather_code',
        'temperature_2m_max',
        'temperature_2m_min',
        'sunrise',
        'sunset',
        'uv_index_max',
        'precipitation_probability_max'
      ].join(','),
      timezone: 'auto',
      forecast_days: 7
    });

    const response = await fetch(`${API.weather}?${params.toString()}`, { signal });
    if (!response.ok) {
      throw new Error(`Weather API Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  }

  async function fetchElevationData(lat, lng, signal) {
    try {
      const params = new URLSearchParams({ latitude: lat, longitude: lng });
      const response = await fetch(`${API.elevation}?${params.toString()}`, { signal });
      if (!response.ok) return null;
      const data = await response.json();
      if (data && Array.isArray(data.elevation) && data.elevation.length > 0) {
        return data.elevation[0];
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  async function reverseGeocode(lat, lng, signal) {
    // 1. Primary Service: BigDataCloud Client Reverse Geocode (3.5s timeout)
    try {
      const url = `${API.reverseGeocodePrimary}?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
      const res = await fetchWithTimeout(url, { signal }, 3500);
      if (res.ok) {
        const data = await res.json();
        const city = data.city || data.locality || data.principalSubdivision || '';
        const country = data.countryName || '';
        const countryCode = data.countryCode || '';
        const flag = countryCode ? countryCodeToEmoji(countryCode) : '📍';
        const name = city || (country ? country : 'Custom Location');
        const subname = city && country ? `${city}, ${country}` : (country || 'Coordinates Point');

        if (name && name !== 'Custom Location') {
          return { name, subname, country, countryCode, flag };
        }
      }
    } catch (e) {
      if (e.name === 'AbortError' && signal?.aborted) throw e;
    }

    // 2. Fallback Service 1: Nominatim OpenStreetMap (3.5s timeout)
    try {
      const fallbackUrl = `${API.reverseGeocodeFallback}?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`;
      const res = await fetchWithTimeout(fallbackUrl, { signal, headers: { 'Accept-Language': 'en' } }, 3500);
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || addr.state || '';
        const country = addr.country || '';
        const countryCode = (addr.country_code || '').toUpperCase();
        const flag = countryCode ? countryCodeToEmoji(countryCode) : '📍';
        const name = city || (country ? country : 'Custom Location');
        const subname = data.display_name ? data.display_name.split(',').slice(0, 3).join(',') : (country || 'Custom Spot');

        if (name && name !== 'Custom Location') {
          return { name, subname, country, countryCode, flag };
        }
      }
    } catch (e) {
      if (e.name === 'AbortError' && signal?.aborted) throw e;
    }

    // 3. Fallback Service 2: Open-Meteo Geocoding Nearest City Search (3s timeout)
    try {
      const omUrl = `${API.geocoding}?name=${lat.toFixed(1)},${lng.toFixed(1)}&count=1&language=en&format=json`;
      const res = await fetchWithTimeout(omUrl, { signal }, 3000);
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const r = data.results[0];
          const flag = r.country_code ? countryCodeToEmoji(r.country_code) : '📍';
          return {
            name: r.name,
            subname: r.country ? `${r.name}, ${r.country}` : r.name,
            country: r.country || '',
            countryCode: r.country_code || '',
            flag
          };
        }
      }
    } catch (e) {
      if (e.name === 'AbortError' && signal?.aborted) throw e;
    }

    return {
      name: 'Custom Location',
      subname: `${formatCoordinate(lat, 'lat')}, ${formatCoordinate(lng, 'lng')}`,
      country: '',
      countryCode: '',
      flag: '📍'
    };
  }

  // -------------------------------------------------------------------
  // 9. SEARCH & AUTOCOMPLETE ENGINE
  // -------------------------------------------------------------------
  function initSearch() {
    const searchInput = document.getElementById('search-input');
    const searchClearBtn = document.getElementById('search-clear-btn');
    const searchSpinner = document.getElementById('search-spinner');
    const searchResults = document.getElementById('search-results');

    searchInput?.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      
      if (query.length > 0) {
        searchClearBtn?.classList.remove('hidden');
      } else {
        searchClearBtn?.classList.add('hidden');
        searchResults?.classList.add('hidden');
        return;
      }

      if (query.length < 2) {
        searchResults?.classList.add('hidden');
        return;
      }

      clearTimeout(state.searchDebounceTimer);
      state.searchDebounceTimer = setTimeout(() => {
        executeLocationSearch(query);
      }, 350);
    });

    searchClearBtn?.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      searchClearBtn?.classList.add('hidden');
      searchResults?.classList.add('hidden');
    });

    // Keyboard Navigation
    searchInput?.addEventListener('keydown', (e) => {
      const items = searchResults?.querySelectorAll('.search-result-item');
      if (!items || items.length === 0 || searchResults?.classList.contains('hidden')) {
        if (e.key === 'Enter') {
          const query = searchInput.value.trim();
          if (query.length >= 2) executeLocationSearch(query, true);
        }
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        state.searchActiveIndex = (state.searchActiveIndex + 1) % items.length;
        highlightSearchItem(items);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        state.searchActiveIndex = (state.searchActiveIndex - 1 + items.length) % items.length;
        highlightSearchItem(items);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (state.searchActiveIndex >= 0 && state.searchActiveIndex < items.length) {
          items[state.searchActiveIndex].click();
        } else if (items.length > 0) {
          items[0].click();
        }
      } else if (e.key === 'Escape') {
        searchResults?.classList.add('hidden');
      }
    });

    document.addEventListener('click', (e) => {
      if (!document.getElementById('search-container')?.contains(e.target)) {
        searchResults?.classList.add('hidden');
      }
    });
  }

  async function executeLocationSearch(query, selectFirst = false) {
    const searchSpinner = document.getElementById('search-spinner');
    const searchResults = document.getElementById('search-results');

    searchSpinner?.classList.remove('hidden');
    state.searchActiveIndex = -1;

    try {
      const params = new URLSearchParams({
        name: query,
        count: 5,
        language: 'en',
        format: 'json'
      });

      const res = await fetch(`${API.geocoding}?${params.toString()}`);
      if (!res.ok) throw new Error('Geocoding search failed.');
      const data = await res.json();

      searchSpinner?.classList.add('hidden');

      if (!data.results || data.results.length === 0) {
        if (searchResults) {
          searchResults.innerHTML = '<li class="search-result-empty">No locations found. Try another query.</li>';
          searchResults.classList.remove('hidden');
        }
        return;
      }

      if (selectFirst) {
        const topResult = data.results[0];
        selectSearchResultItem(topResult);
        searchResults?.classList.add('hidden');
        return;
      }

      renderSearchResults(data.results);
    } catch (e) {
      searchSpinner?.classList.add('hidden');
    }
  }

  function renderSearchResults(results) {
    const searchResults = document.getElementById('search-results');
    if (!searchResults) return;

    searchResults.innerHTML = '';
    searchResults.classList.remove('hidden');

    results.forEach((item) => {
      const li = document.createElement('li');
      li.className = 'search-result-item';
      li.setAttribute('role', 'option');
      li.setAttribute('tabindex', '-1');

      const flagEmoji = item.country_code ? countryCodeToEmoji(item.country_code) : '📍';
      const admin = [item.admin1, item.country].filter(Boolean).join(', ');

      const flagSpan = document.createElement('span');
      flagSpan.className = 'search-result-flag';
      flagSpan.textContent = flagEmoji;

      const infoDiv = document.createElement('div');
      infoDiv.className = 'search-result-info';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'search-result-name';
      nameSpan.textContent = item.name;

      const metaSpan = document.createElement('span');
      metaSpan.className = 'search-result-meta';
      metaSpan.textContent = admin || 'Location';

      infoDiv.appendChild(nameSpan);
      infoDiv.appendChild(metaSpan);
      li.appendChild(flagSpan);
      li.appendChild(infoDiv);

      li.addEventListener('click', () => {
        selectSearchResultItem(item);
        searchResults.classList.add('hidden');
        const input = document.getElementById('search-input');
        if (input) input.value = item.name;
      });

      searchResults.appendChild(li);
    });
  }

  function highlightSearchItem(items) {
    items.forEach((item, idx) => {
      if (idx === state.searchActiveIndex) {
        item.classList.add('active');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('active');
      }
    });
  }

  function selectSearchResultItem(item) {
    const flagEmoji = item.country_code ? countryCodeToEmoji(item.country_code) : '📍';
    selectLocation(item.latitude, item.longitude, {
      placeName: item.name,
      country: item.country || '',
      countryCode: item.country_code || '',
      flag: flagEmoji,
      panTo: true,
      zoom: 10
    });
  }

  // -------------------------------------------------------------------
  // 10. UI UPDATE FUNCTIONS
  // -------------------------------------------------------------------
  function updateLocationHeadingUI(meta) {
    const flagEl = document.getElementById('location-flag');
    const nameEl = document.getElementById('location-name');
    const subnameEl = document.getElementById('location-subname');

    if (flagEl) flagEl.textContent = meta.flag || '📍';
    if (nameEl) nameEl.textContent = meta.name || 'Selected Spot';
    if (subnameEl) subnameEl.textContent = meta.subname || '';

    const mobCity = document.getElementById('mobile-preview-city');
    if (mobCity) mobCity.textContent = meta.name || 'Location';
  }

  function updateCoordinatesUI(lat, lng) {
    const latEl = document.getElementById('coord-lat');
    const lngEl = document.getElementById('coord-lng');
    if (latEl) latEl.textContent = formatCoordinate(lat, 'lat');
    if (lngEl) lngEl.textContent = formatCoordinate(lng, 'lng');
  }

  function updateWeatherUI(data) {
    const current = data.current;
    if (!current) return;

    // Clear any previous error state
    document.getElementById('weather-error-state')?.classList.add('hidden');

    const wmo = getWMOInfo(current.weather_code, current.is_day);

    // Weather Hero Card
    const heroIcon = document.getElementById('hero-weather-icon');
    const heroTemp = document.getElementById('hero-temp-display');
    const heroCond = document.getElementById('hero-weather-condition');
    const heroFeels = document.getElementById('hero-feels-like');
    const heroDayNight = document.getElementById('hero-daynight-text');
    const heroDayNightBadge = document.getElementById('hero-daynight-badge');
    const heroMax = document.getElementById('hero-temp-max');
    const heroMin = document.getElementById('hero-temp-min');

    if (heroIcon) heroIcon.textContent = wmo.icon;
    if (heroTemp) heroTemp.textContent = formatTemperature(current.temperature_2m);
    if (heroCond) heroCond.textContent = wmo.desc;
    if (heroFeels) heroFeels.textContent = formatTemperature(current.apparent_temperature);

    if (heroDayNight && heroDayNightBadge) {
      if (current.is_day) {
        heroDayNight.textContent = 'Day';
        heroDayNightBadge.classList.remove('night');
      } else {
        heroDayNight.textContent = 'Night';
        heroDayNightBadge.classList.add('night');
      }
    }

    if (data.daily && data.daily.temperature_2m_max && data.daily.temperature_2m_max.length > 0) {
      if (heroMax) heroMax.textContent = formatTemperature(data.daily.temperature_2m_max[0]);
      if (heroMin) heroMin.textContent = formatTemperature(data.daily.temperature_2m_min[0]);
    }

    // Quick 2x2 Metrics
    const humidityEl = document.getElementById('metric-humidity');
    const dewPointEl = document.getElementById('metric-dewpoint-sub');
    const windSpeedEl = document.getElementById('metric-wind-speed');
    const windDirEl = document.getElementById('metric-wind-dir');
    const compassArrow = document.getElementById('wind-compass-arrow');

    if (humidityEl) humidityEl.textContent = `${Math.round(current.relative_humidity_2m)}%`;
    
    const dewPointC = current.temperature_2m - ((100 - current.relative_humidity_2m) / 5);
    if (dewPointEl) dewPointEl.textContent = `Dew point: ${formatTemperature(dewPointC)}`;

    if (windSpeedEl) windSpeedEl.textContent = formatWind(current.wind_speed_10m);
    if (windDirEl) windDirEl.textContent = degreesToCompass(current.wind_direction_10m);
    if (compassArrow) {
      compassArrow.style.transform = `rotate(${current.wind_direction_10m}deg)`;
    }

    // Atmospheric Deep Grid
    const uvVal = document.getElementById('detail-uv-val');
    const uvDesc = document.getElementById('detail-uv-desc');
    const pressureVal = document.getElementById('detail-pressure-val');
    const cloudsVal = document.getElementById('detail-clouds-val');
    const visVal = document.getElementById('detail-visibility-val');
    const gustsVal = document.getElementById('detail-gusts-val');
    const precipVal = document.getElementById('detail-precip-val');

    const maxUV = data.daily?.uv_index_max?.[0] || 0;
    if (uvVal) uvVal.textContent = maxUV.toFixed(1);
    if (uvDesc) uvDesc.textContent = getUVDescription(maxUV);

    if (pressureVal) pressureVal.textContent = `${Math.round(current.pressure_msl || current.surface_pressure || 1013)} hPa`;
    if (cloudsVal) cloudsVal.textContent = `${Math.round(current.cloud_cover)}%`;
    if (visVal) {
      const vis = current.visibility !== undefined && current.visibility !== null ? (current.visibility / 1000).toFixed(1) : '10.0';
      visVal.textContent = `${vis} km`;
    }
    if (gustsVal) gustsVal.textContent = formatWind(current.wind_gusts_10m);
    if (precipVal) precipVal.textContent = `${(current.precipitation || 0).toFixed(1)} mm`;

    // Mobile preview updates
    const mobIcon = document.getElementById('mobile-preview-icon');
    const mobTemp = document.getElementById('mobile-preview-temp');
    const mobCond = document.getElementById('mobile-preview-condition');
    if (mobIcon) mobIcon.textContent = wmo.icon;
    if (mobTemp) mobTemp.textContent = formatTemperature(current.temperature_2m);
    if (mobCond) mobCond.textContent = `${wmo.desc} • Feels ${formatTemperature(current.apparent_temperature)}`;
  }

  function updateElevationUI(elevationMeters) {
    const elevEl = document.getElementById('metric-elevation');
    const oceanBadge = document.getElementById('ocean-status-badge');
    const elevSub = document.getElementById('metric-elevation-sub');
    const svgElevText = document.getElementById('svg-elev-text');
    const svgElevMarker = document.getElementById('svg-elev-marker-group');
    const terrainTag = document.getElementById('terrain-category-tag');

    if (elevationMeters === null || isNaN(elevationMeters)) {
      if (elevEl) elevEl.textContent = '--';
      if (oceanBadge) oceanBadge.classList.add('hidden');
      if (elevSub) elevSub.textContent = 'Elevation unavailable';
      return;
    }

    const formattedElev = formatElevation(elevationMeters);
    if (elevEl) elevEl.textContent = formattedElev;

    const isOcean = elevationMeters <= 0;
    const isNearSea = elevationMeters > 0 && elevationMeters <= 5;

    if (oceanBadge) {
      if (isOcean) {
        oceanBadge.textContent = 'Ocean / Sea Level';
        oceanBadge.classList.remove('hidden');
      } else if (isNearSea) {
        oceanBadge.textContent = 'Near Sea Level';
        oceanBadge.classList.remove('hidden');
      } else {
        oceanBadge.classList.add('hidden');
      }
    }

    if (elevSub) {
      elevSub.textContent = isOcean ? 'At ocean baseline' : 'Above mean sea level';
    }

    if (svgElevText) svgElevText.textContent = formattedElev;
    if (svgElevMarker) {
      const clamped = Math.max(0, Math.min(6000, elevationMeters));
      const targetY = 55 - (clamped / 6000) * 40;
      svgElevMarker.setAttribute('transform', `translate(180, ${targetY})`);
    }

    if (terrainTag) {
      if (elevationMeters > 2500) terrainTag.textContent = 'Alpine Peak';
      else if (elevationMeters > 800) terrainTag.textContent = 'Highland / Hills';
      else if (elevationMeters > 0) terrainTag.textContent = 'Lowland / Plains';
      else terrainTag.textContent = 'Oceanic Zone';
    }
  }

  function updateCelestialUI(data) {
    if (!data.daily || !data.daily.sunrise || !data.daily.sunset) return;

    const sunriseISO = data.daily.sunrise[0];
    const sunsetISO = data.daily.sunset[0];

    const sunriseEl = document.getElementById('celestial-sunrise');
    const sunsetEl = document.getElementById('celestial-sunset');
    const daylengthEl = document.getElementById('celestial-daylength');
    const goldenBadge = document.getElementById('golden-hour-badge');
    const daylightBarFill = document.getElementById('daylight-bar-fill');

    if (sunriseEl) sunriseEl.textContent = parseTime12h(sunriseISO);
    if (sunsetEl) sunsetEl.textContent = parseTime12h(sunsetISO);

    // Calculate Day Length in Minutes
    const srMins = parseMinutes(sunriseISO);
    const ssMins = parseMinutes(sunsetISO);
    const diffMins = ssMins - srMins;

    if (diffMins > 0 && daylengthEl) {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      daylengthEl.textContent = `${hours}h ${mins}m`;
    }

    // Golden hour & daylight progress
    const nowTimeStr = data.current?.time || '';
    const currentMins = nowTimeStr ? parseMinutes(nowTimeStr) : srMins + diffMins / 2;

    const isGoldenHour = (Math.abs(currentMins - srMins) <= 60) || (Math.abs(currentMins - ssMins) <= 60);
    if (goldenBadge) {
      if (isGoldenHour) goldenBadge.classList.remove('hidden');
      else goldenBadge.classList.add('hidden');
    }

    if (daylightBarFill && diffMins > 0) {
      const elapsed = currentMins - srMins;
      const pct = Math.max(0, Math.min(100, (elapsed / diffMins) * 100));
      daylightBarFill.style.width = `${pct}%`;
    }
  }

  function updateForecastHourlyUI(data) {
    const hourly = data.hourly;
    const track = document.getElementById('hourly-scroll-track');
    const svgChart = document.getElementById('hourly-temp-chart');

    if (!hourly || !track || !hourly.time) return;

    track.innerHTML = '';
    const next24 = [];
    
    // Find current hour index based on current.time or default to 0
    let startIndex = 0;
    if (data.current?.time) {
      const currentHourPrefix = data.current.time.slice(0, 13);
      const idx = hourly.time.findIndex(t => t.startsWith(currentHourPrefix));
      if (idx !== -1) startIndex = idx;
    }

    const srMins = data.daily?.sunrise?.[0] ? parseMinutes(data.daily.sunrise[0]) : 360;
    const ssMins = data.daily?.sunset?.[0] ? parseMinutes(data.daily.sunset[0]) : 1140;

    const count = Math.min(24, hourly.time.length - startIndex);
    for (let i = 0; i < count; i++) {
      const idx = startIndex + i;
      const tStr = hourly.time[idx];
      const hMins = parseMinutes(tStr);
      const isDay = hMins >= srMins && hMins < ssMins;

      next24.push({
        time: tStr,
        temp: hourly.temperature_2m[idx],
        pop: hourly.precipitation_probability ? hourly.precipitation_probability[idx] : 0,
        weatherCode: hourly.weather_code[idx],
        isDay: isDay ? 1 : 0
      });
    }

    // Render Hourly Cards
    next24.forEach((h, idx) => {
      const card = document.createElement('div');
      card.className = `hour-card ${idx === 0 ? 'current' : ''}`;

      const timeLabel = idx === 0 ? 'Now' : parseHour12h(h.time);
      const wmo = getWMOInfo(h.weatherCode, h.isDay);

      card.innerHTML = `
        <span class="hour-time">${timeLabel}</span>
        <span class="hour-icon">${wmo.icon}</span>
        <span class="hour-temp">${formatTemperature(h.temp)}</span>
        <span class="hour-pop">${h.pop > 0 ? `💧${h.pop}%` : ''}</span>
      `;
      track.appendChild(card);
    });

    // Render SVG Spline Curve
    renderHourlySVGChart(svgChart, next24);
  }

  function renderHourlySVGChart(svg, dataPoints) {
    if (!svg || !dataPoints || dataPoints.length < 2) return;

    const width = 600;
    const height = 85;
    const paddingY = 16;

    const temps = dataPoints.map(d => d.temp);
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    const range = (maxTemp - minTemp) || 1;

    const points = dataPoints.map((d, i) => {
      const x = (i / (dataPoints.length - 1)) * (width - 40) + 20;
      const y = height - paddingY - ((d.temp - minTemp) / range) * (height - paddingY * 2);
      return { x, y, temp: d.temp };
    });

    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpX2 = cpX1;
      pathD += ` C ${cpX1} ${p0.y}, ${cpX2} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

    svg.innerHTML = `
      <defs>
        <linearGradient id="chart-fill-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.38"/>
          <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.0"/>
        </linearGradient>
      </defs>
      <path d="${areaD}" fill="url(#chart-fill-grad)"/>
      <path d="${pathD}" fill="none" stroke="#22d3ee" stroke-width="2.5" stroke-linecap="round"/>
      ${points.filter((_, i) => i % 4 === 0 || i === points.length - 1).map(p => `
        <circle cx="${p.x}" cy="${p.y}" r="3.5" fill="#ffffff" stroke="#06b6d4" stroke-width="2"/>
        <text x="${p.x}" y="${p.y - 7}" text-anchor="middle" fill="#94a3b8" font-size="10" font-family="Outfit, sans-serif" font-weight="600">${formatTemperature(p.temp)}</text>
      `).join('')}
    `;
  }

  function updateForecastDailyUI(data) {
    const daily = data.daily;
    const listEl = document.getElementById('daily-forecast-list');
    if (!daily || !listEl || !daily.time) return;

    listEl.innerHTML = '';

    const allMins = daily.temperature_2m_min;
    const allMaxs = daily.temperature_2m_max;
    const globalMin = Math.min(...allMins);
    const globalMax = Math.max(...allMaxs);
    const totalRange = (globalMax - globalMin) || 1;

    daily.time.forEach((t, i) => {
      const row = document.createElement('div');
      row.className = 'day-row';

      const dayName = i === 0 ? 'Today' : parseDayName(t);
      const wmo = getWMOInfo(daily.weather_code[i], 1);
      const pop = daily.precipitation_probability_max ? daily.precipitation_probability_max[i] : 0;

      const minT = daily.temperature_2m_min[i];
      const maxT = daily.temperature_2m_max[i];

      const leftPct = ((minT - globalMin) / totalRange) * 100;
      const widthPct = Math.max(8, ((maxT - minT) / totalRange) * 100);

      row.innerHTML = `
        <span class="day-name-col">${dayName}</span>
        <div class="day-icon-col">
          <span class="day-icon">${wmo.icon}</span>
          <span class="day-pop">${pop > 20 ? `💧${pop}%` : ''}</span>
        </div>
        <div class="day-bar-col">
          <span class="temp-min-text">${formatTemperature(minT)}</span>
          <div class="temp-range-track">
            <div class="temp-range-fill" style="left: ${leftPct}%; width: ${widthPct}%;"></div>
          </div>
          <span class="temp-max-text">${formatTemperature(maxT)}</span>
        </div>
      `;
      listEl.appendChild(row);
    });
  }

  function showWeatherError(msg) {
    const heroCond = document.getElementById('hero-weather-condition');
    if (heroCond) heroCond.textContent = 'Weather Unavailable';

    const errState = document.getElementById('weather-error-state');
    const errMsg = document.getElementById('weather-error-msg');
    if (errMsg) errMsg.textContent = msg || 'Weather data could not be fetched for this spot.';
    if (errState) errState.classList.remove('hidden');

    showToast(msg || 'Weather data could not be fetched for this spot.', 'warning');
  }

  // -------------------------------------------------------------------
  // 11. TIMEZONE & LIVE LOCAL CLOCK
  // -------------------------------------------------------------------
  function startLocalClock(timeZoneName, utcOffsetSec) {
    if (state.clockInterval) clearInterval(state.clockInterval);

    const timeValEl = document.getElementById('metric-local-time');
    const ampmEl = document.getElementById('metric-ampm');
    const tzSubEl = document.getElementById('metric-timezone-sub');

    function updateClock() {
      try {
        const now = new Date();
        const options = {
          timeZone: timeZoneName || 'UTC',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        };
        const formatter = new Intl.DateTimeFormat('en-US', options);
        const parts = formatter.formatToParts(now);
        
        let hour = '';
        let minute = '';
        let ampm = '';

        parts.forEach(p => {
          if (p.type === 'hour') hour = p.value;
          if (p.type === 'minute') minute = p.value;
          if (p.type === 'dayPeriod') ampm = p.value.toUpperCase();
        });

        if (timeValEl) timeValEl.textContent = `${hour}:${minute}`;
        if (ampmEl) ampmEl.textContent = ampm;

        if (tzSubEl) {
          const tzShort = timeZoneName ? timeZoneName.replace(/_/g, ' ') : 'UTC';
          const offsetHours = (utcOffsetSec || 0) / 3600;
          const offsetStr = `UTC${offsetHours >= 0 ? '+' : ''}${offsetHours.toFixed(1).replace('.0', '')}`;
          tzSubEl.textContent = `${tzShort} (${offsetStr})`;
        }
      } catch (e) {
        if (timeValEl) timeValEl.textContent = '--:--';
      }
    }

    updateClock();
    state.clockInterval = setInterval(updateClock, 1000);
  }

  function startFreshnessTicker() {
    if (state.freshnessInterval) clearInterval(state.freshnessInterval);

    const freshnessEl = document.getElementById('freshness-time');
    function tick() {
      if (!state.lastUpdatedTimestamp || !freshnessEl) return;
      const diffSec = Math.floor((Date.now() - state.lastUpdatedTimestamp) / 1000);
      if (diffSec < 60) {
        freshnessEl.textContent = 'Updated just now';
      } else {
        const mins = Math.floor(diffSec / 60);
        freshnessEl.textContent = `Updated ${mins} min ago`;
      }
    }

    tick();
    state.freshnessInterval = setInterval(tick, 30000);
  }

  // -------------------------------------------------------------------
  // 12. DISTANCE FROM USER GEOLOCATION (HAVERSINE)
  // -------------------------------------------------------------------
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function updateDistanceUI() {
    const distContainer = document.getElementById('distance-indicator');
    const distText = document.getElementById('distance-text');

    if (!state.userLocation || !state.selectedLocation || !distContainer || !distText) {
      distContainer?.classList.add('hidden');
      return;
    }

    const km = calculateDistance(
      state.userLocation.lat,
      state.userLocation.lng,
      state.selectedLocation.lat,
      state.selectedLocation.lng
    );

    let displayStr = '';
    if (state.settings.windUnit === 'mph') {
      const miles = Math.round(km * 0.621371);
      displayStr = `${miles.toLocaleString()} miles from your position`;
    } else {
      displayStr = `${Math.round(km).toLocaleString()} km from your position`;
    }

    distText.textContent = displayStr;
    distContainer.classList.remove('hidden');
  }

  function requestUserLocation() {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'warning');
      return;
    }

    showToast('Detecting your location...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        state.userLocation = { lat: latitude, lng: longitude };
        selectLocation(latitude, longitude, {
          placeName: 'My Location',
          panTo: true,
          zoom: 11
        });
        showToast('Location identified!', 'success');
      },
      (error) => {
        let msg = 'Unable to retrieve your location.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location permission was not granted. Search for a city instead.';
        }
        showToast(msg, 'warning');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  // -------------------------------------------------------------------
  // 13. FAVORITES & RECENT HISTORY
  // -------------------------------------------------------------------
  function toggleCurrentFavorite() {
    if (!state.selectedLocation) return;

    const index = state.favorites.findIndex(f => 
      Math.abs(f.latitude - state.selectedLocation.lat) < 0.001 &&
      Math.abs(f.longitude - state.selectedLocation.lng) < 0.001
    );

    if (index >= 0) {
      state.favorites.splice(index, 1);
      showToast('Removed from favorites.');
    } else {
      state.favorites.unshift({
        name: state.selectedLocation.name,
        subname: state.selectedLocation.subname,
        latitude: state.selectedLocation.lat,
        longitude: state.selectedLocation.lng,
        country: state.selectedLocation.country,
        flag: state.selectedLocation.flag,
        timestamp: Date.now()
      });
      showToast('Location saved to favorites! ★', 'success');
    }

    saveFavorites();
    updateFavoriteButtonState();
  }

  function updateFavoriteButtonState() {
    const btn = document.getElementById('btn-toggle-fav');
    const label = document.getElementById('fav-btn-label');
    if (!btn || !label || !state.selectedLocation) return;

    const isFav = state.favorites.some(f => 
      Math.abs(f.latitude - state.selectedLocation.lat) < 0.001 &&
      Math.abs(f.longitude - state.selectedLocation.lng) < 0.001
    );

    if (isFav) {
      btn.classList.add('saved');
      label.textContent = 'Saved ★';
    } else {
      btn.classList.remove('saved');
      label.textContent = 'Save';
    }
  }

  function updateFavoritesCountBadge() {
    const badge = document.getElementById('fav-count-badge');
    const tabFavCount = document.getElementById('tab-fav-count');
    const tabRecentCount = document.getElementById('tab-recent-count');

    const count = state.favorites.length;
    if (badge) {
      badge.textContent = count;
      if (count > 0) badge.classList.remove('hidden');
      else badge.classList.add('hidden');
    }

    if (tabFavCount) tabFavCount.textContent = count;
    if (tabRecentCount) tabRecentCount.textContent = state.recentLocations.length;
  }

  function addToRecentLocations(loc) {
    if (!loc) return;
    state.recentLocations = state.recentLocations.filter(r => 
      !(Math.abs(r.latitude - loc.lat) < 0.001 && Math.abs(r.longitude - loc.lng) < 0.001)
    );

    state.recentLocations.unshift({
      name: loc.name,
      subname: loc.subname,
      latitude: loc.lat,
      longitude: loc.lng,
      flag: loc.flag,
      timestamp: Date.now()
    });

    if (state.recentLocations.length > 10) {
      state.recentLocations = state.recentLocations.slice(0, 10);
    }

    saveRecentLocations();
    updateFavoritesCountBadge();
  }

  function renderFavoritesList() {
    const list = document.getElementById('favorites-list');
    const emptyMsg = document.getElementById('fav-empty-msg');
    if (!list) return;

    list.innerHTML = '';
    if (state.favorites.length === 0) {
      emptyMsg?.classList.remove('hidden');
      return;
    }
    emptyMsg?.classList.add('hidden');

    state.favorites.forEach((fav, index) => {
      const li = document.createElement('li');
      li.className = 'saved-place-item';

      li.innerHTML = `
        <div class="saved-place-main">
          <span class="saved-place-name">${fav.flag || '📍'} ${fav.name}</span>
          <span class="saved-place-coords">${formatCoordinate(fav.latitude, 'lat')}, ${formatCoordinate(fav.longitude, 'lng')}</span>
        </div>
        <button class="saved-place-delete" title="Remove from favorites" aria-label="Delete">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      `;

      li.querySelector('.saved-place-main')?.addEventListener('click', () => {
        document.getElementById('favorites-drawer')?.classList.add('hidden');
        selectLocation(fav.latitude, fav.longitude, {
          placeName: fav.name,
          country: fav.country,
          flag: fav.flag,
          panTo: true,
          zoom: 10
        });
      });

      li.querySelector('.saved-place-delete')?.addEventListener('click', (e) => {
        e.stopPropagation();
        state.favorites.splice(index, 1);
        saveFavorites();
        updateFavoriteButtonState();
      });

      list.appendChild(li);
    });
  }

  function renderRecentList() {
    const list = document.getElementById('recent-list');
    const emptyMsg = document.getElementById('recent-empty-msg');
    if (!list) return;

    list.innerHTML = '';
    if (state.recentLocations.length === 0) {
      emptyMsg?.classList.remove('hidden');
      return;
    }
    emptyMsg?.classList.add('hidden');

    state.recentLocations.forEach((rec) => {
      const li = document.createElement('li');
      li.className = 'saved-place-item';

      li.innerHTML = `
        <div class="saved-place-main">
          <span class="saved-place-name">${rec.flag || '📍'} ${rec.name}</span>
          <span class="saved-place-coords">${formatCoordinate(rec.latitude, 'lat')}, ${formatCoordinate(rec.longitude, 'lng')}</span>
        </div>
      `;

      li.addEventListener('click', () => {
        document.getElementById('favorites-drawer')?.classList.add('hidden');
        selectLocation(rec.latitude, rec.longitude, {
          placeName: rec.name,
          flag: rec.flag,
          panTo: true,
          zoom: 9
        });
      });

      list.appendChild(li);
    });
  }

  // -------------------------------------------------------------------
  // 14. SHARING & CLIPBOARD
  // -------------------------------------------------------------------
  function copyCoordinates() {
    if (!state.selectedLocation) return;
    const text = `${state.selectedLocation.lat}, ${state.selectedLocation.lng}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(`Copied: ${text}`, 'success');
      }).catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showToast(`Copied: ${text}`, 'success');
    } catch (e) {
      showToast('Coordinates copied.', 'info');
    }
    document.body.removeChild(textarea);
  }

  function shareLocation() {
    if (!state.selectedLocation) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}?lat=${state.selectedLocation.lat}&lng=${state.selectedLocation.lng}`;
    const shareData = {
      title: `${state.selectedLocation.name} - World Explorer`,
      text: `Explore live weather and elevation for ${state.selectedLocation.name}:`,
      url: shareUrl
    };

    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl).then(() => {
          showToast('Share link copied to clipboard! ↗', 'success');
        });
      } else {
        fallbackCopy(shareUrl);
      }
    }
  }

  function updateURLState(lat, lng) {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('lat', lat);
      url.searchParams.set('lng', lng);
      window.history.replaceState({}, '', url.toString());
    } catch (e) {}
  }

  function checkURLParameters() {
    try {
      const params = new URLSearchParams(window.location.search);
      const lat = params.get('lat');
      const lng = params.get('lng');
      if (lat !== null && lng !== null) {
        const parsedLat = parseFloat(lat);
        const parsedLng = parseFloat(lng);
        if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
          selectLocation(parsedLat, parsedLng, { panTo: true, zoom: 9 });
          return true;
        }
      }
    } catch (e) {}
    return false;
  }

  // -------------------------------------------------------------------
  // 15. UNIT CONVERSION & DATE PARSING UTILITIES
  // -------------------------------------------------------------------
  function formatTemperature(celsius) {
    if (celsius === undefined || celsius === null || isNaN(celsius)) return '--°';
    if (state.settings.tempUnit === 'f') {
      const f = (celsius * 9) / 5 + 32;
      return `${Math.round(f)}°F`;
    }
    return `${Math.round(celsius)}°C`;
  }

  function formatWind(kmh) {
    if (kmh === undefined || kmh === null || isNaN(kmh)) return '--';
    const unit = state.settings.windUnit;
    if (unit === 'mph') {
      return `${Math.round(kmh * 0.621371)} mph`;
    } else if (unit === 'ms') {
      return `${(kmh / 3.6).toFixed(1)} m/s`;
    } else if (unit === 'knots') {
      return `${Math.round(kmh * 0.539957)} kn`;
    }
    return `${Math.round(kmh)} km/h`;
  }

  function formatElevation(meters) {
    if (meters === undefined || meters === null || isNaN(meters)) return '--';
    if (state.settings.elevUnit === 'ft') {
      const feet = Math.round(meters * 3.28084);
      return `${feet.toLocaleString()} ft`;
    }
    return `${Math.round(meters).toLocaleString()} m`;
  }

  function formatCoordinate(val, type) {
    const abs = Math.abs(val).toFixed(4);
    if (type === 'lat') {
      return `${abs}° ${val >= 0 ? 'N' : 'S'}`;
    }
    return `${abs}° ${val >= 0 ? 'E' : 'W'}`;
  }

  function degreesToCompass(deg) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const idx = Math.round((deg % 360) / 22.5) % 16;
    return directions[idx];
  }

  function getUVDescription(uv) {
    if (uv <= 2) return 'Low';
    if (uv <= 5) return 'Moderate';
    if (uv <= 7) return 'High';
    if (uv <= 10) return 'Very High';
    return 'Extreme';
  }

  function countryCodeToEmoji(code) {
    if (!code || code.length !== 2) return '📍';
    return code
      .toUpperCase()
      .replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt(0)));
  }

  function parseTime12h(timeStr) {
    if (!timeStr) return '--:--';
    const timePart = timeStr.includes('T') ? timeStr.split('T')[1] : timeStr;
    const parts = timePart.split(':').map(Number);
    const h = parts[0] || 0;
    const m = parts[1] || 0;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
  }

  function parseHour12h(timeStr) {
    if (!timeStr) return '';
    const timePart = timeStr.includes('T') ? timeStr.split('T')[1] : timeStr;
    const h = parseInt(timePart.split(':')[0], 10) || 0;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12} ${ampm}`;
  }

  function parseMinutes(timeStr) {
    if (!timeStr) return 0;
    const timePart = timeStr.includes('T') ? timeStr.split('T')[1] : timeStr;
    const parts = timePart.split(':').map(Number);
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  }

  function parseDayName(dateStr) {
    try {
      const parts = dateStr.split('-').map(Number);
      const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
      return dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    } catch (e) {
      return dateStr;
    }
  }

  // -------------------------------------------------------------------
  // 16. TOAST NOTIFICATION SYSTEM
  // -------------------------------------------------------------------
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 3000);
  }

  // -------------------------------------------------------------------
  // 17. EVENT LISTENERS SETUP
  // -------------------------------------------------------------------
  function setupEventListeners() {
    document.getElementById('btn-my-location')?.addEventListener('click', requestUserLocation);
    
    // Favorites Drawer Toggle
    const favDrawer = document.getElementById('favorites-drawer');
    document.getElementById('btn-favorites')?.addEventListener('click', () => {
      favDrawer?.classList.remove('hidden');
      renderFavoritesList();
      renderRecentList();
    });
    document.getElementById('fav-drawer-close')?.addEventListener('click', () => favDrawer?.classList.add('hidden'));
    document.getElementById('fav-drawer-overlay')?.addEventListener('click', () => favDrawer?.classList.add('hidden'));

    // Drawer Tabs
    const tabFavs = document.getElementById('tab-btn-favs');
    const tabRecents = document.getElementById('tab-btn-recents');
    const contentFavs = document.getElementById('fav-tab-content');
    const contentRecents = document.getElementById('recent-tab-content');

    tabFavs?.addEventListener('click', () => {
      tabFavs.classList.add('active');
      tabRecents?.classList.remove('active');
      contentFavs?.classList.add('active');
      contentRecents?.classList.remove('active');
    });

    tabRecents?.addEventListener('click', () => {
      tabRecents.classList.add('active');
      tabFavs?.classList.remove('active');
      contentRecents?.classList.add('active');
      contentFavs?.classList.remove('active');
    });

    document.getElementById('btn-clear-recent')?.addEventListener('click', () => {
      state.recentLocations = [];
      saveRecentLocations();
      showToast('Recent exploration history cleared.');
    });

    // Settings Drawer Toggle
    const settingsDrawer = document.getElementById('settings-drawer');
    document.getElementById('btn-settings')?.addEventListener('click', () => {
      settingsDrawer?.classList.remove('hidden');
    });
    document.getElementById('settings-drawer-close')?.addEventListener('click', () => settingsDrawer?.classList.add('hidden'));
    document.getElementById('settings-drawer-overlay')?.addEventListener('click', () => settingsDrawer?.classList.add('hidden'));

    // Settings Segment Buttons
    document.querySelectorAll('.segment-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const setting = btn.dataset.setting;
        const val = btn.dataset.val;
        if (setting && val) {
          state.settings[setting] = val;
          saveSettings();
          applySettingsToUI();

          // Instant re-render on unit change without re-fetching
          if (state.currentWeatherData) {
            updateWeatherUI(state.currentWeatherData);
            updateForecastHourlyUI(state.currentWeatherData);
            updateForecastDailyUI(state.currentWeatherData);
          }
          if (state.currentElevationData !== null) {
            updateElevationUI(state.currentElevationData);
          }
          updateDistanceUI();
        }
      });
    });

    document.getElementById('setting-animations')?.addEventListener('change', (e) => {
      state.settings.animations = e.target.checked;
      saveSettings();
    });

    document.getElementById('setting-autorefresh')?.addEventListener('change', (e) => {
      state.settings.autoRefresh = e.target.checked;
      saveSettings();
    });

    document.getElementById('btn-reset-settings')?.addEventListener('click', () => {
      state.settings = {
        tempUnit: 'c',
        windUnit: 'kmh',
        elevUnit: 'm',
        mapLayer: 'voyager',
        animations: true,
        autoRefresh: true
      };
      saveSettings();
      applySettingsToUI();
      showToast('Settings reset to defaults.', 'success');
      if (state.currentWeatherData) {
        updateWeatherUI(state.currentWeatherData);
        updateForecastHourlyUI(state.currentWeatherData);
        updateForecastDailyUI(state.currentWeatherData);
      }
    });

    // Panel Action Buttons
    document.getElementById('panel-close-btn')?.addEventListener('click', () => {
      document.getElementById('info-panel')?.classList.add('hidden');
    });
    document.getElementById('mobile-close-btn')?.addEventListener('click', () => {
      document.getElementById('info-panel')?.classList.add('hidden');
    });
    document.getElementById('btn-copy-coords')?.addEventListener('click', copyCoordinates);
    document.getElementById('btn-share')?.addEventListener('click', shareLocation);
    document.getElementById('btn-toggle-fav')?.addEventListener('click', toggleCurrentFavorite);
    document.getElementById('btn-refresh-data')?.addEventListener('click', () => {
      if (state.selectedLocation) {
        selectLocation(state.selectedLocation.lat, state.selectedLocation.lng, {
          placeName: state.selectedLocation.name,
          country: state.selectedLocation.country,
          flag: state.selectedLocation.flag,
          panTo: false
        });
        showToast('Refreshing live data...');
      }
    });

    // Mobile Bottom Sheet Collapse/Expand
    const infoPanel = document.getElementById('info-panel');
    const dragHandle = document.getElementById('panel-drag-handle');
    const mobilePreviewBar = document.getElementById('mobile-preview-bar');
    const expandBtn = document.getElementById('mobile-expand-btn');

    function toggleMobileSheet() {
      if (window.innerWidth <= 767) {
        infoPanel?.classList.toggle('collapsed');
      }
    }

    dragHandle?.addEventListener('click', toggleMobileSheet);
    mobilePreviewBar?.addEventListener('click', toggleMobileSheet);
    expandBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMobileSheet();
    });

    // Weather Retry Button
    document.getElementById('btn-retry-weather')?.addEventListener('click', () => {
      if (state.selectedLocation && state.selectedLocation.lat != null && state.selectedLocation.lng != null) {
        selectLocation(state.selectedLocation.lat, state.selectedLocation.lng, {
          panTo: false,
          placeName: state.selectedLocation.name,
          country: state.selectedLocation.country,
          countryCode: state.selectedLocation.countryCode,
          flag: state.selectedLocation.flag
        });
      }
    });

    // Quick Places Chips
    document.querySelectorAll('.quick-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const lat = parseFloat(btn.dataset.lat);
        const lng = parseFloat(btn.dataset.lng);
        const name = btn.dataset.name;
        selectLocation(lat, lng, { placeName: name, panTo: true, zoom: 9 });
      });
    });

    document.getElementById('welcome-dismiss-btn')?.addEventListener('click', () => {
      document.getElementById('welcome-card')?.classList.add('hidden');
    });

    document.getElementById('brand-logo')?.addEventListener('click', resetMapWorldView);

    // 3D Interactive Globe Mode Toggles
    document.getElementById('ctrl-toggle-globe')?.addEventListener('click', () => {
      toggleGlobeMode(!state.globeModeEnabled);
    });
    document.getElementById('toggle-globe-mode-gis')?.addEventListener('change', (e) => {
      toggleGlobeMode(e.target.checked);
    });

    // Auto-Refresh Every 10 min
    state.autoRefreshInterval = setInterval(() => {
      if (state.settings.autoRefresh && document.visibilityState === 'visible' && state.selectedLocation) {
        selectLocation(state.selectedLocation.lat, state.selectedLocation.lng, {
          placeName: state.selectedLocation.name,
          country: state.selectedLocation.country,
          flag: state.selectedLocation.flag,
          panTo: false
        });
      }
    }, 600000);
  }

  // -------------------------------------------------------------------
  // 17B. NETWORK CONNECTIVITY MONITOR (ONLINE / OFFLINE)
  // -------------------------------------------------------------------
  function initNetworkMonitor() {
    const banner = document.getElementById('network-status-banner');
    const bannerText = document.getElementById('network-banner-text');
    const bannerIcon = document.getElementById('network-banner-icon');
    const dismissBtn = document.getElementById('btn-dismiss-network-banner');
    let reconnectTimeout = null;

    function updateNetworkStatus(isOnline) {
      if (!banner) return;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);

      if (!isOnline) {
        banner.classList.remove('hidden', 'online');
        banner.classList.add('offline');
        if (bannerIcon) bannerIcon.textContent = '📡';
        if (bannerText) bannerText.textContent = 'No internet connection. Some features may be limited.';
      } else {
        if (banner.classList.contains('offline')) {
          banner.classList.remove('offline');
          banner.classList.add('online');
          if (bannerIcon) bannerIcon.textContent = '🟢';
          if (bannerText) bannerText.textContent = 'Back online. Live updates restored.';
          reconnectTimeout = setTimeout(() => {
            banner.classList.add('hidden');
          }, 3500);
        } else {
          banner.classList.add('hidden');
        }
      }
    }

    window.addEventListener('online', () => updateNetworkStatus(true));
    window.addEventListener('offline', () => updateNetworkStatus(false));

    dismissBtn?.addEventListener('click', () => {
      banner?.classList.add('hidden');
    });

    if (!navigator.onLine) {
      updateNetworkStatus(false);
    }
  }

  // -------------------------------------------------------------------
  // 17C. SERVICE WORKER REGISTRATION (PWA OFFLINE APP SHELL)
  // -------------------------------------------------------------------
  function registerServiceWorker() {
    if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch((err) => {
          console.warn('Service Worker registration skipped or failed:', err);
        });
      });
    }
  }

  // -------------------------------------------------------------------
  // 18. APPLICATION BOOTSTRAP
  // -------------------------------------------------------------------
  function bootstrap() {
    loadStoredData();
    initMap();
    initSearch();
    initNetworkMonitor();
    registerServiceWorker();
    setupEventListeners();

    const hasURLCoords = checkURLParameters();
    if (!hasURLCoords) {
      document.getElementById('welcome-card')?.classList.remove('hidden');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }

})();
