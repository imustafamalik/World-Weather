const { test, expect } = require('@playwright/test');

test.describe('World Weather & Elevation Explorer - Smoke Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to local app
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('1. Application shell and interactive Leaflet map load', async ({ page }) => {
    // Verify title and brand header
    await expect(page).toHaveTitle(/World Weather & Elevation Explorer/i);
    const header = page.locator('#app-header');
    await expect(header).toBeVisible();

    // Verify map canvas is rendered
    const map = page.locator('#map');
    await expect(map).toBeVisible();
  });

  test('2. Clicking a location coordinate/chip populates the weather panel', async ({ page }) => {
    // Click Islamabad quick chip
    const quickChip = page.locator('button.quick-chip', { hasText: 'Islamabad' });
    if (await quickChip.isVisible()) {
      await quickChip.click();
    } else {
      // Direct coordinate selection fallback
      await page.evaluate(() => {
        window.selectLocation(33.6844, 73.0479, { placeName: 'Islamabad, Pakistan' });
      });
    }

    // Wait for info panel to be visible
    const infoPanel = page.locator('#info-panel');
    await expect(infoPanel).toBeVisible({ timeout: 10000 });

    // Verify location title and temperature display are populated
    const locationName = page.locator('#location-name');
    await expect(locationName).toContainText(/Islamabad|Custom Location/i);

    const tempDisplay = page.locator('#hero-temp-display');
    await expect(tempDisplay).not.toHaveText('--°', { timeout: 10000 });
  });

  test('3. Search bar returns autocomplete suggestions for city search', async ({ page }) => {
    const searchInput = page.locator('#search-input');
    await searchInput.fill('Tokyo');

    // Wait for dropdown suggestions list to appear
    const searchResults = page.locator('#search-results');
    await expect(searchResults).toBeVisible({ timeout: 10000 });

    const resultItems = searchResults.locator('li');
    await expect(resultItems.first()).toBeVisible({ timeout: 10000 });
  });

  test('4. Graceful degradation and visible Retry button when weather API fails', async ({ page }) => {
    // Mock Open-Meteo forecast API failure
    await page.route('**/v1/forecast*', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: true, reason: 'Simulated API Downtime' })
      });
    });

    // Attempt to inspect location
    await page.evaluate(() => {
      // Clear localStorage cache to force fresh network call
      localStorage.clear();
      window.selectLocation(51.5074, -0.1278, { placeName: 'London' });
    });

    // Verify error state appears with Retry button
    const errorState = page.locator('#weather-error-state');
    await expect(errorState).toBeVisible({ timeout: 10000 });

    const retryBtn = page.locator('#btn-retry-weather');
    await expect(retryBtn).toBeVisible();
    await expect(retryBtn).toHaveText(/Retry/i);
  });

});
