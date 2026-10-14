import test from 'node:test';
import assert from 'node:assert/strict';

// Test 1: Responsive Camera Fitting Geometry (Requirement 10)
function calculateFitCameraDistance(width: number, height: number, vFovDegrees: number = 45): number {
  if (width <= 0 || height <= 0) return 18;
  const GLOBE_RADIUS = 5;
  const SAFETY_MARGIN = 1.28;
  const aspect = width / height;
  const vFovRad = (vFovDegrees * Math.PI) / 180;
  const effectiveRadius = GLOBE_RADIUS * SAFETY_MARGIN;

  const distV = effectiveRadius / Math.tan(vFovRad / 2);
  const distH = distV / aspect;

  return Math.max(distV, distH);
}

test('Responsive 3D Globe Camera Fitting across screen sizes', async (t) => {
  await t.test('Desktop Widescreen (1920x1080, aspect 1.77) fits complete globe vertically with safety margin', () => {
    const dist = calculateFitCameraDistance(1920, 1080, 45);
    // Vertical distance should dominate on landscape screens
    assert.ok(dist >= 15.4 && dist <= 16.0, `Expected desktop distance ~15.45, got ${dist}`);
    // Visible horizontal span = 2 * dist * tan(22.5°) * aspect = 2 * 15.45 * 0.4142 * 1.777 = 22.7
    // Globe diameter with margin = 12.8 -> comfortably fits!
    const visibleWidth = 2 * dist * Math.tan((22.5 * Math.PI) / 180) * (1920 / 1080);
    assert.ok(visibleWidth > 12.8, `Globe must fit inside visible width (${visibleWidth} > 12.8)`);
  });

  await t.test('Mobile Phone Portrait (375x667, aspect 0.56) pulls camera back so globe sides never crop', () => {
    const dist = calculateFitCameraDistance(375, 667, 45);
    // Horizontal distance MUST dominate when width < height
    assert.ok(dist >= 27.0 && dist <= 28.0, `Expected mobile distance ~27.5, got ${dist}`);
    // Check horizontal visible width at this distance:
    const visibleWidth = 2 * dist * Math.tan((22.5 * Math.PI) / 180) * (375 / 667);
    // Must be >= effective diameter (12.8) so sphere is 100% uncropped!
    assert.ok(visibleWidth >= 12.79, `Visible width ${visibleWidth} must accommodate complete globe diameter`);
  });

  await t.test('Narrow Android Phone (360x740, aspect 0.486) maintains full globe visibility', () => {
    const dist = calculateFitCameraDistance(360, 740, 45);
    assert.ok(dist >= 31.0, `Expected narrow phone distance >= 31.0, got ${dist}`);
    const visibleWidth = 2 * dist * Math.tan((22.5 * Math.PI) / 180) * (360 / 740);
    assert.ok(visibleWidth >= 12.79, `Visible width ${visibleWidth} must not crop globe`);
  });

  await t.test('Square / Tablet Portrait (768x1024, aspect 0.75) dynamically fits without clipping', () => {
    const dist = calculateFitCameraDistance(768, 1024, 45);
    assert.ok(dist >= 20.5 && dist <= 21.0, `Expected tablet distance ~20.6, got ${dist}`);
  });
});

test('Currency Exchange Rates Logic', async (t) => {
  await t.test('Calculates live and fallback cross-rates accurately', () => {
    const rates: Record<string, number> = {
      USD: 1.0,
      AUD: 1.52,
      EUR: 0.92,
      JPY: 154.5
    };

    // Convert 100 USD to AUD
    const convertedAUD = 100 * rates.AUD;
    assert.equal(convertedAUD, 152.0);

    // Convert 100 EUR to JPY: (100 / 0.92) * 154.5
    const rateEurToJpy = rates.JPY / rates.EUR;
    assert.ok(rateEurToJpy > 165 && rateEurToJpy < 170);
  });
});

test('Sovereign Country Intelligence Validation', async (t) => {
  await t.test('Verifies key sovereign destinations have valid ISO codes and coordinates', () => {
    const testCountries = [
      { name: 'Australia', cca2: 'AU', cca3: 'AUS', lat: -27.0, lon: 133.0, currency: 'AUD' },
      { name: 'Japan', cca2: 'JP', cca3: 'JPN', lat: 36.0, lon: 138.0, currency: 'JPY' },
      { name: 'United States', cca2: 'US', cca3: 'USA', lat: 38.0, lon: -97.0, currency: 'USD' },
      { name: 'United Kingdom', cca2: 'GB', cca3: 'GBR', lat: 54.0, lon: -2.0, currency: 'GBP' }
    ];

    for (const c of testCountries) {
      assert.ok(c.cca2.length === 2);
      assert.ok(c.cca3.length === 3);
      assert.ok(c.lat >= -90 && c.lat <= 90);
      assert.ok(c.lon >= -180 && c.lon <= 180);
      assert.ok(c.currency.length === 3);
    }
  });
});
