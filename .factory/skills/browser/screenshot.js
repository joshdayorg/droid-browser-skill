#!/usr/bin/env node
import puppeteer from 'puppeteer-core';
import { tmpdir } from 'os';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import { CHROME_URL } from './config.js';

const STATE_FILE = join(tmpdir(), 'browser-skill-active-tab.json');
function getActiveTab() {
  if (existsSync(STATE_FILE)) {
    try { return JSON.parse(readFileSync(STATE_FILE, 'utf8')).activeTab || 0; } catch (e) {}
  }
  return 0;
}

async function main() {
  const browser = await puppeteer.connect({
    browserURL: CHROME_URL,
    defaultViewport: null,
  });

  const pages = await browser.pages();
  const page = pages[getActiveTab()] || pages[0];
  
  if (!page) {
    console.error('No active page found');
    process.exit(1);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `screenshot-${timestamp}.png`;
  const filepath = join(tmpdir(), filename);
  
  await page.screenshot({ path: filepath });
  console.log(`✓ Screenshot saved: ${filepath}`);
  
  browser.disconnect();
}

main().catch(err => {
  console.error('Error:', err.message);
  console.error('Make sure Chrome is running with: start.js');
  process.exit(1);
});
