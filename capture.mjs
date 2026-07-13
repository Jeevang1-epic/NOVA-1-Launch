import puppeteer from 'puppeteer';

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  console.log('Navigating to http://localhost:3000?sequenceDebug=1');
  await page.goto('http://localhost:3000?sequenceDebug=1', { waitUntil: 'networkidle0' });

  console.log('Waiting for INITIALIZING VISUAL SYSTEM to disappear...');
  await page.waitForFunction(() => {
    return !document.body.innerText.includes('INITIALIZING VISUAL SYSTEM');
  }, { timeout: 30000 });

  console.log('Visual system loaded.');

  const getDebugText = async () => {
    return await page.evaluate(() => {
      const debugDiv = document.querySelector('.z-50');
      return debugDiv ? debugDiv.innerText.replace(/\n/g, ' | ') : 'No debug info';
    });
  };

  const scrollAndCapture = async (progress, name) => {
    console.log(`Scrolling to ${progress * 100}%...`);
    await page.evaluate((p) => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo(0, totalScroll * p);
    }, progress);
    
    // Wait for GSAP and RAF to catch up
    await new Promise(r => setTimeout(r, 1500));
    
    const debugInfo = await getDebugText();
    console.log(`[${name}] Debug Info: ${debugInfo}`);
    
    await page.screenshot({ path: `screenshot_${name}.jpg`, type: 'jpeg', quality: 80 });
  };

  await scrollAndCapture(0, '0_percent');
  await scrollAndCapture(0.25, '25_percent');
  await scrollAndCapture(0.50, '50_percent');
  await scrollAndCapture(0.75, '75_percent');
  await scrollAndCapture(1.0, '100_percent');
  
  // Reverse
  await scrollAndCapture(0.50, '50_percent_reverse');

  // Print raw document height info to prove scrollability
  const heights = await page.evaluate(() => ({
    scrollHeight: document.documentElement.scrollHeight,
    innerHeight: window.innerHeight,
  }));
  console.log(`\nDocument scrollHeight: ${heights.scrollHeight}px`);
  console.log(`Window innerHeight: ${heights.innerHeight}px`);
  console.log(`Scrollable Distance: ${heights.scrollHeight - heights.innerHeight}px`);

  await browser.close();
  console.log('Done.');
})();
