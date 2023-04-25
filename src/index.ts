import { mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { config } from "dotenv";
import puppeteer from "puppeteer";

import { logger } from "@adapters/logger";

import { scrollPageDown } from "./scroll-page-down";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config();

const SCREEN_SHOT_HEIGHT = 7000;

const main = async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto("https://www.apple.com/jp/ipad/");
  const url = new URL(page.url());

  const pageHeight = await page.evaluate(() => document.body.clientHeight);
  await page.setViewport({ width: 390, height: 900 });
  await page.waitForNetworkIdle({ timeout: 100000 });

  await scrollPageDown(page, { size: 400, delay: 250, stepsLimit: 300 });

  const clip = await page.evaluate(() => {
    const el = document.body;
    const { width, height, top: y, left: x } = el.getBoundingClientRect();

    return { width, height, x, y };
  });

  let currentHeight = 0;
  while (currentHeight < pageHeight) {
    await page.waitForNetworkIdle({
      idleTime: 1000,
    });
    const path = join(__dirname, url.hostname.replace(".", "-"), `./screenshot-${currentHeight}.png`);
    const dir = dirname(path);
    logger.debug(path, dir);

    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    const buffer = await page.screenshot({
      type: "png",
      path,
      clip: {
        x: clip.x,
        y: currentHeight,
        width: clip.width,
        height: SCREEN_SHOT_HEIGHT,
      },
    });

    logger.info(path, buffer.byteLength);

    currentHeight += SCREEN_SHOT_HEIGHT;
  }

  await page.close();
};

void main();
