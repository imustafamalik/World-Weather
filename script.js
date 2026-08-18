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

  // Map Tile Layer Providers
  const TILE_LAYERS = {
    voyager: {
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      options: {
        maxZoom: 19,
        subdomains: 'abcd',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      }
    },
    dark: {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      options: {
        maxZoom: 19,
        subdomains: 'abcd',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      }
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      options: {
        maxZoom: 18,
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      }
    },
    osm: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      options: {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }
    }
  };

  // -------------------------------------------------------------------
  // 2. APPLICATION STATE
  // -------------------------------------------------------------------
  const state = {
    map: null,
    activeTileLayer: null,
    currentMarker: null,
    selectedLocation: null,   // { lat, lng, name, subname, country, countryCode, flag }
    currentWeatherData: null,
    currentElevationData: null,
    userLocation: null,       // { lat, lng }
    favorites: [],
    recentLocations: [],
    settings: {
      tempUnit: 'c',          // 'c' | 'f'
      windUnit: 'kmh',        // 'kmh' | 'mph' | 'ms' | 'knots'
      elevUnit: 'm',          // 'm' | 'ft'
      mapLayer: 'voyager',    // 'voyager' | 'dark' | 'satellite' | 'osm'
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
    return {
      desc: entry.desc,
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
  // 5. MAP INITIALIZATION & LAYER SWITCHING
  // -------------------------------------------------------------------
  function initMap() {
    const initialCoords = [20, 0];
    const initialZoom = 2;

    state.map = L.map('map', {
      center: initialCoords,
      zoom: initialZoom,
      minZoom: 2,
      maxZoom: 18,
      zoomControl: false,
      worldCopyJump: true
    });

    setMapLayer(state.settings.mapLayer || 'voyager');

    // Map Click Handler
    state.map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      const normalizedLng = ((lng + 180) % 360 + 360) % 360 - 180;
      selectLocation(lat, normalizedLng, { panTo: true, zoom: state.map.getZoom() < 6 ? 6 : null });
    });

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

    // Layer Switcher Menu
    const layerToggleBtn = document.getElementById('ctrl-layer-toggle');
    const layerMenu = document.getElementById('layer-menu');
    layerToggleBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      layerMenu?.classList.toggle('hidden');
    });

    document.querySelectorAll('.layer-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const layerKey = btn.dataset.layer;
        if (layerKey && TILE_LAYERS[layerKey]) {
          setMapLayer(layerKey);
          state.settings.mapLayer = layerKey;
          saveSettings();
          applySettingsToUI();
          layerMenu?.classList.add('hidden');
        }
      });
    });

    document.addEventListener('click', (e) => {
      if (!layerMenu?.contains(e.target) && !layerToggleBtn?.contains(e.target)) {
        layerMenu?.classList.add('hidden');
      }
    });
  }

  function setMapLayer(layerKey) {
    const config = TILE_LAYERS[layerKey] || TILE_LAYERS.voyager;
    if (state.activeTileLayer) {
      state.map.removeLayer(state.activeTileLayer);
    }
    state.activeTileLayer = L.tileLayer(config.url, config.options).addTo(state.map);

    document.querySelectorAll('.layer-option').forEach(btn => {
      if (btn.dataset.layer === layerKey) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
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
  // 7. LOCATION SELECTION ENGINE & DATA ORCHESTRATION
  // -------------------------------------------------------------------
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
    document.getElementById('weather-skeleton')?.classList.remove('hidden');

    // Expand mobile bottom sheet if on mobile
    if (window.innerWidth <= 767) {
      infoPanel?.classList.remove('collapsed');
    }

    // Move map & marker
    if (options.panTo !== false) {
      const targetZoom = options.zoom || (state.map.getZoom() < 5 ? 6 : state.map.getZoom());
      state.map.flyTo([roundedLat, roundedLng], targetZoom, {
        duration: state.settings.animations ? 1.2 : 0,
        easeLinearity: 0.25
      });
    }

    const placeNameCandidate = options.placeName || 'Loading location...';
    updateMapMarker(roundedLat, roundedLng, placeNameCandidate);

    updateURLState(roundedLat, roundedLng);
    updateCoordinatesUI(roundedLat, roundedLng);

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
      
      try { updateWeatherUI(weatherResult.value); } catch (e) { console.error('Weather UI error:', e); }
      try { updateCelestialUI(weatherResult.value); } catch (e) { console.error('Celestial UI error:', e); }
      try { updateForecastHourlyUI(weatherResult.value); } catch (e) { console.error('Hourly Forecast UI error:', e); }
      try { updateForecastDailyUI(weatherResult.value); } catch (e) { console.error('Daily Forecast UI error:', e); }
      try { startLocalClock(weatherResult.value.timezone, weatherResult.value.utc_offset_seconds); } catch (e) { console.error('Clock error:', e); }
      try { startFreshnessTicker(); } catch (e) {}
    } else {
      showWeatherError(weatherResult.reason?.message || 'Weather data unavailable.');
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
    // 1. Primary Service: BigDataCloud Client Reverse Geocode
    try {
      const url = `${API.reverseGeocodePrimary}?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
      const res = await fetch(url, { signal });
      if (res.ok) {
        const data = await res.json();
        const city = data.city || data.locality || data.principalSubdivision || '';
        const country = data.countryName || '';
        const countryCode = data.countryCode || '';
        const flag = countryCode ? countryCodeToEmoji(countryCode) : '📍';
        const name = city || (country ? country : 'Custom Location');
        const subname = city && country ? `${city}, ${country}` : (country || 'Coordinates Point');

        return { name, subname, country, countryCode, flag };
      }
    } catch (e) {
      if (e.name === 'AbortError') throw e;
    }

    // 2. Fallback Service: Nominatim OSM
    try {
      const fallbackUrl = `${API.reverseGeocodeFallback}?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`;
      const res = await fetch(fallbackUrl, { signal });
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const city = addr.city || addr.town || addr.village || addr.county || addr.state || '';
        const country = addr.country || '';
        const countryCode = (addr.country_code || '').toUpperCase();
        const flag = countryCode ? countryCodeToEmoji(countryCode) : '📍';
        const name = city || (country ? country : 'Custom Location');
        const subname = data.display_name ? data.display_name.split(',').slice(0, 3).join(',') : (country || 'Custom Spot');

        return { name, subname, country, countryCode, flag };
      }
    } catch (e) {
      if (e.name === 'AbortError') throw e;
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
  // 18. APPLICATION BOOTSTRAP
  // -------------------------------------------------------------------
  function bootstrap() {
    loadStoredData();
    initMap();
    initSearch();
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
