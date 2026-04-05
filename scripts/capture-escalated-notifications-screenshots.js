const { chromium, firefox } = require('playwright');
const fs = require('fs');
const path = require('path');
const http = require('http');

const SCREENSHOTS_DIR = path.join(__dirname, '../screenshots');
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Check if server is running
function checkServer(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(5000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function captureScreenshots() {
  console.log('🎬 Starting screenshot capture...\n');
  console.log(`🌐 Target URL: ${BASE_URL}`);
  console.log('📁 Screenshots will be saved to:', SCREENSHOTS_DIR);
  console.log('');

  // Check if server is running
  console.log('🔍 Checking if development server is running...');
  const serverRunning = await checkServer(BASE_URL);
  if (!serverRunning) {
    console.error('❌ Development server is not running!');
    console.error(`   Please start the client server first:`);
    console.error(`   cd client && npm run dev`);
    console.error(`   Then visit: ${BASE_URL}`);
    process.exit(1);
  }
  console.log('✅ Server is running\n');

  // Try to launch browser (Firefox first, then Chromium)
  let browser;
  try {
    console.log('🌐 Trying to launch Firefox...');
    browser = await firefox.launch({ 
      headless: true,
      args: ['--disable-gpu']
    });
    console.log('✅ Firefox launched successfully\n');
  } catch (firefoxError) {
    console.log('⚠️  Firefox failed, trying Chromium...');
    try {
      browser = await chromium.launch({ 
        headless: true,
        args: ['--disable-gpu', '--no-sandbox', '--disable-setuid-sandbox']
      });
      console.log('✅ Chromium launched successfully\n');
    } catch (chromiumError) {
      console.error('❌ Both Firefox and Chromium failed to launch.');
      console.error('This is likely due to missing system libraries in the container environment.');
      console.error('\n🔧 Solutions:');
      console.error('1. Use manual screenshots (recommended for dev containers):');
      console.error('   - Start dev server: cd client && npm run dev');
      console.error('   - Visit http://localhost:5173/uptime/create');
      console.error('   - Manually screenshot the escalated notifications section');
      console.error('   - Save as 01-empty-escalated-notifications.png, etc.');
      console.error('\n2. Install system dependencies (if you have sudo access):');
      console.error('   sudo apt-get update && sudo apt-get install -y libatk-bridge2.0-0 libdrm2 libxkbcommon0 libgtk-3-0 libgbm1');
      console.error('\nFirefox error:', firefoxError.message);
      console.error('Chromium error:', chromiumError.message);
      process.exit(1);
    }
  }
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🎬 Starting screenshot capture...\n');

    // 1. Capture Empty Escalated Notifications State
    console.log('📸 Screenshot 1: Empty Escalated Notifications State');
    await page.goto(`${BASE_URL}/uptime/create`);
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      const notificationBox = document.evaluate(
        "//h2[contains(text(), 'Notifications')]",
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue;
      if (notificationBox) {
        notificationBox.scrollIntoView({ behavior: 'smooth' });
      }
    });

    await page.waitForTimeout(1000);

    await page.evaluate(() => {
      const escalatedBox = Array.from(document.querySelectorAll('h2, h3, div')).find(
        el => el.textContent?.includes('Escalated Notifications')
      );
      if (escalatedBox) {
        escalatedBox.scrollIntoView({ behavior: 'smooth' });
      }
    });

    await page.waitForTimeout(1500);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '01-empty-escalated-notifications.png'),
      fullPage: false,
    });
    console.log('✅ Saved: 01-empty-escalated-notifications.png\n');

    // 2. Fill in monitor details and add escalation levels
    console.log('📸 Screenshot 2: Configured Escalation Levels');
    await page.fill('input[name="name"]', 'Production API Server');
    await page.fill('input[name="url"]', 'https://api.example.com');

    await page.evaluate(() => {
      const escalatedBox = Array.from(document.querySelectorAll('h2, h3, div')).find(
        el => el.textContent?.includes('Escalated Notifications')
      );
      if (escalatedBox) {
        escalatedBox.scrollIntoView({ behavior: 'smooth' });
      }
    });

    await page.waitForTimeout(500);
    await page.click('button:has-text("Add Escalation Level")');
    await page.waitForTimeout(500);

    await page.fill('input[name="escalatedNotifications.0.delayMinutes"]', '5');
    await page.click('input[placeholder*="Select notifications"]');
    await page.waitForTimeout(300);

    const firstOption = await page.$('[role="option"]');
    if (firstOption) {
      await firstOption.click();
      await page.waitForTimeout(300);
    }

    await page.click('body');
    await page.waitForTimeout(500);

    await page.click('button:has-text("Add Escalation Level")');
    await page.waitForTimeout(500);
    await page.fill('input[name="escalatedNotifications.1.delayMinutes"]', '15');

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '02-configured-escalations.png'),
      fullPage: false,
    });
    console.log('✅ Saved: 02-configured-escalations.png\n');

    // 3. Capture with 3 escalation levels
    console.log('📸 Screenshot 3: Multiple Escalation Levels');
    await page.click('button:has-text("Add Escalation Level")');
    await page.waitForTimeout(500);
    await page.fill('input[name="escalatedNotifications.2.delayMinutes"]', '30');

    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '03-multiple-escalations.png'),
      fullPage: false,
    });
    console.log('✅ Saved: 03-multiple-escalations.png\n');

    // 4. Capture full form view
    console.log('📸 Screenshot 4: Full Monitor Form with Escalations');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '04-full-form-view.png'),
      fullPage: true,
    });
    console.log('✅ Saved: 04-full-form-view.png\n');

    // 5. Highlight the Escalated Notifications Component
    console.log('📸 Screenshot 5: Escalated Notifications Component Focus');
    await page.evaluate(() => {
      const escalatedBox = Array.from(document.querySelectorAll('div')).find(
        el => el.textContent?.includes('Escalated Notifications') &&
              el.querySelector('[name*="escalatedNotifications"]')
      );
      if (escalatedBox) {
        escalatedBox.style.boxShadow = '0 0 20px 5px rgba(76, 175, 80, 0.5)';
        escalatedBox.scrollIntoView({ behavior: 'smooth' });
      }
    });

    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '05-component-highlight.png'),
      fullPage: false,
    });
    console.log('✅ Saved: 05-component-highlight.png\n');

    // 6. Mobile view
    console.log('📸 Screenshot 6: Responsive Design - Mobile View');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.evaluate(() => {
      const escalatedBox = Array.from(document.querySelectorAll('div')).find(
        el => el.textContent?.includes('Escalated Notifications') &&
              el.querySelector('[name*="escalatedNotifications"]')
      );
      if (escalatedBox) {
        escalatedBox.scrollIntoView({ behavior: 'smooth' });
      }
    });

    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '06-mobile-view.png'),
      fullPage: false,
    });
    console.log('✅ Saved: 06-mobile-view.png\n');

    console.log('\n✨ All screenshots captured successfully!');
    console.log(`📁 Screenshots saved to: ${SCREENSHOTS_DIR}\n`);

    console.log('📋 Screenshot Summary:');
    console.log('  01-empty-escalated-notifications.png - Initial empty state');
    console.log('  02-configured-escalations.png - 2 escalation levels configured');
    console.log('  03-multiple-escalations.png - 3 escalation levels configured');
    console.log('  04-full-form-view.png - Complete monitor form');
    console.log('  05-component-highlight.png - Component highlighted');
    console.log('  06-mobile-view.png - Mobile responsive view\n');
  } catch (error) {
    console.error('❌ Error during screenshot capture:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

captureScreenshots().catch(console.error);
