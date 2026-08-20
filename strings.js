/**
 * World Weather & Elevation Explorer - Lightweight i18n Lookup Dictionary
 * Default language: 'en'
 */

const STRINGS = {
  en: {
    // App Brand & Navigation
    appTitle: 'World Explorer',
    appBadge: 'Weather & Elevation',
    searchPlaceholder: 'Search city, mountain, island, landmark...',
    btnMyLocation: 'My Location',
    btnSaved: 'Saved',
    btnLayers: 'Layers',
    btnSettings: 'Settings',

    // GIS & Map Layers
    gisHeaderTitle: 'GIS & Map Layers',
    liveGsdLabel: 'Ground GSD:',
    weatherClickMode: 'Weather Click Mode',
    weatherClickDesc: 'Click map to inspect weather',

    // Weather Conditions (WMO mapping)
    wmo_0: 'Clear Sky',
    wmo_1: 'Mainly Clear',
    wmo_2: 'Partly Cloudy',
    wmo_3: 'Overcast',
    wmo_45: 'Fog & Mist',
    wmo_48: 'Depositing Rime Fog',
    wmo_51: 'Light Drizzle',
    wmo_53: 'Moderate Drizzle',
    wmo_55: 'Dense Drizzle',
    wmo_56: 'Freezing Drizzle',
    wmo_57: 'Dense Freezing Drizzle',
    wmo_61: 'Slight Rain',
    wmo_63: 'Moderate Rain',
    wmo_65: 'Heavy Rain',
    wmo_66: 'Freezing Rain',
    wmo_67: 'Heavy Freezing Rain',
    wmo_71: 'Slight Snow Fall',
    wmo_73: 'Moderate Snow Fall',
    wmo_75: 'Heavy Snow Fall',
    wmo_77: 'Snow Grains',
    wmo_80: 'Slight Rain Showers',
    wmo_81: 'Moderate Rain Showers',
    wmo_82: 'Violent Rain Showers',
    wmo_85: 'Slight Snow Showers',
    wmo_86: 'Heavy Snow Showers',
    wmo_95: 'Thunderstorm',
    wmo_96: 'Thunderstorm with Slight Hail',
    wmo_99: 'Thunderstorm with Heavy Hail',

    // Weather Metrics & UI Labels
    feelsLike: 'Feels like',
    high: 'H:',
    low: 'L:',
    day: 'Day',
    night: 'Night',
    elevation: 'Elevation',
    localTime: 'Local Time',
    humidity: 'Humidity',
    wind: 'Wind',
    dewPoint: 'Dew point:',
    aboveSeaLevel: 'Above mean sea level',
    oceanLevel: 'Ocean / Sea Level',

    // Forecasts & Astronomy
    next24Hours: 'Next 24 Hours',
    sevenDayForecast: '7-Day Forecast',
    today: 'Today',
    sunAndMoon: 'Sun & Moon Astronomy',
    sunrise: 'Sunrise',
    sunset: 'Sunset',
    daylight: 'Daylight',

    // Error & Notice States
    weatherUnavailable: 'Weather Unavailable',
    weatherFetchError: 'Weather data could not be fetched for this spot.',
    retry: 'Retry',
    offlineNotice: 'No internet connection. Some features may be limited.',
    onlineNotice: 'Back online. Live updates restored.',
    slowConnectionNotice: 'Still loading, the connection seems slow...',
    showingCachedNotice: 'Showing cached data from',
    customLocation: 'Custom Location'
  }
};

/**
 * Global translation lookup function with fallback
 * @param {string} key - Dictionary key identifier
 * @param {string} [fallback] - Fallback text if key not found
 * @param {string} [lang='en'] - Target language code
 * @returns {string} Translated string
 */
function t(key, fallback = '', lang = 'en') {
  const dict = STRINGS[lang] || STRINGS['en'];
  if (dict && dict[key] !== undefined) {
    return dict[key];
  }
  return fallback || key;
}

// Expose globally for browser environment
if (typeof window !== 'undefined') {
  window.STRINGS = STRINGS;
  window.t = t;
}
