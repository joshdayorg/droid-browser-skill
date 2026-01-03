#!/usr/bin/env node
import puppeteer from 'puppeteer-core';
import { CHROME_URL } from './config.js';

const url = process.argv[2];
const openNew = process.argv.includes('--new');

if (!url) {
  console.error('Usage: nav.js <url> [--new]');
  process.exit(1);
}

async function main() {
  const browser = await puppeteer.connect({
    browserURL: CHROME_URL,
    defaultViewport: null,
  });

  let page;
  if (openNew) {
    page = await browser.newPage();
  } else {
    const pages = await browser.pages();
    page = pages[0] || await browser.newPage();
  }

  await page.goto(url, { waitUntil: 'domcontentloaded' });
  console.log(`✓ Navigated to: ${url}`);
  
  browser.disconnect();
}

main().catch(err => {
  console.error('Error:', err.message);
  console.error('Make sure Chrome is running with: start.js');
  process.exit(1);
});
