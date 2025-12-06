/**
 * Screenshot Generator for Browser Extension Stores
 * 
 * Generates promotional screenshots for Chrome Web Store and Firefox Add-ons.
 * 
 * Usage:
 *   cd promo
 *   npm install
 *   npm run screenshots
 * 
 * Output:
 *   screenshots/
 *     screenshot-1.png   (1280x800 @ 2x) - Popup in browser
 *     screenshot-2.png   (1280x800 @ 2x) - Features
 *     screenshot-3.png   (1280x800 @ 2x) - How it works
 *     promo-marquee.png  (1400x560 @ 2x) - Large promo tile
 *     promo-small.png    (440x280 @ 2x)  - Small promo tile
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname, 'screenshots');
const HTML_FILE = path.join(__dirname, 'screenshots.html');
const SCALE = 2;

const SCREENSHOTS = [
  { id: 'screenshot-browser', file: 'screenshot-1.png' },
  { id: 'screenshot-features', file: 'screenshot-2.png' },
  { id: 'screenshot-how', file: 'screenshot-3.png' },
  { id: 'promo-marquee', file: 'promo-marquee.png' },
  { id: 'promo-small', file: 'promo-small.png' },
];

async function main() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Set large viewport to fit all elements
    await page.setViewport({ 
      width: 1600, 
      height: 4000, 
      deviceScaleFactor: SCALE 
    });

    await page.goto(`file://${HTML_FILE}`, { waitUntil: 'networkidle0' });

    console.log('\n📸 Generating screenshots...\n');

    // Capture each element
    for (const { id, file } of SCREENSHOTS) {
      const element = await page.$(`#${id}`);
      if (!element) {
        console.log(`  ✗ Element #${id} not found`);
        continue;
      }

      await element.screenshot({ path: path.join(OUTPUT_DIR, file) });
      
      const stats = fs.statSync(path.join(OUTPUT_DIR, file));
      console.log(`  ✓ ${file} (${(stats.size / 1024).toFixed(1)} KB)`);
    }

    console.log(`\n✅ Done! Output: ${OUTPUT_DIR}\n`);

  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
