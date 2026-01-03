#!/usr/bin/env node
import puppeteer from 'puppeteer-core';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { CHROME_URL } from './config.js';

const STATE_FILE = join(tmpdir(), 'browser-skill-active-tab.json');
function getActiveTab() {
  if (existsSync(STATE_FILE)) {
    try { return JSON.parse(readFileSync(STATE_FILE, 'utf8')).activeTab || 0; } catch (e) {}
  }
  return 0;
}

const code = process.argv[2];

if (!code) {
  console.error('Usage: eval.js "<javascript expression>"');
  console.error('Example: eval.js "document.title"');
  process.exit(1);
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

  try {
    const result = await page.evaluate(code);
    if (result !== undefined) {
      console.log(typeof result === 'object' ? JSON.stringify(result, null, 2) : result);
    }
  } catch (err) {
    console.error('Evaluation error:', err.message);
    process.exit(1);
  }
  
  browser.disconnect();
}

main().catch(err => {
  console.error('Error:', err.message);
  console.error('Make sure Chrome is running with: start.js');
  process.exit(1);
});
