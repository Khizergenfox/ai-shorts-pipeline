import puppeteer, { Browser } from "puppeteer";
import { Scene } from "./types";

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-web-security",
      ],
    });
  }
  return browser;
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

/**
 * Screenshots a URL and returns the PNG buffer.
 * Uses full-page capture capped at 3000px height.
 */
export async function screenshotUrl(
  url: string,
  darkMode = true
): Promise<Buffer> {
  console.log(`📸  Screenshotting: ${url}`);
  const b = await getBrowser();
  const page = await b.newPage();

  try {
    // 540x960 viewport @ 2x = 1080x1920 native pixels
    await page.setViewport({ width: 540, height: 960, deviceScaleFactor: 2 });

    if (darkMode) {
      await page.emulateMediaFeatures([
        { name: "prefers-color-scheme", value: "dark" },
      ]);
    }

    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    // Wait a bit for lazy-loaded content
    await new Promise((r) => setTimeout(r, 1500));

    // Cap screenshot height to avoid massive images
    const bodyHeight = await page.evaluate(
      () => Math.min(document.body.scrollHeight, 3000)
    );
    await page.setViewport({
      width: 540,
      height: Math.min(bodyHeight, 960),
      deviceScaleFactor: 2,
    });

    const screenshot = await page.screenshot({
      type: "png",
      fullPage: false,
      clip: { x: 0, y: 0, width: 540, height: Math.min(bodyHeight, 1500) },
    });

    console.log(`✅  Screenshot captured for ${url}`);
    return screenshot as Buffer;
  } finally {
    await page.close();
  }
}

/**
 * Screenshots all scenes that have a screenshotUrl.
 * Returns a map of sceneId → PNG buffer.
 */
export async function captureAllScreenshots(
  scenes: Scene[]
): Promise<Map<string, Buffer>> {
  const results = new Map<string, Buffer>();
  const toCapture = scenes.filter((s) => s.screenshotUrl);

  // Run in parallel (max 3 concurrent)
  const chunkSize = 3;
  for (let i = 0; i < toCapture.length; i += chunkSize) {
    const chunk = toCapture.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map(async (scene) => {
        try {
          const buf = await screenshotUrl(scene.screenshotUrl!);
          results.set(scene.id, buf);
        } catch (err) {
          console.error(`❌  Screenshot failed for ${scene.screenshotUrl}:`, err);
        }
      })
    );
  }

  return results;
}
