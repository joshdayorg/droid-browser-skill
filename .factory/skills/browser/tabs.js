#!/usr/bin/env node
import puppeteer from 'puppeteer-core';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { CHROME_URL } from './config.js';

const arg = process.argv[2];
const STATE_FILE = join(tmpdir(), 'browser-skill-active-tab.json');

// Save active tab index
function saveActiveTab(index) {
  writeFileSync(STATE_FILE, JSON.stringify({ activeTab: index }));
}

// Load active tab index
function loadActiveTab() {
  if (existsSync(STATE_FILE)) {
    try {
      return JSON.parse(readFileSync(STATE_FILE, 'utf8')).activeTab || 0;
    } catch (e) {}
  }
  return 0;
}

async function main() {
  const browser = await puppeteer.connect({
    browserURL: CHROME_URL,
    defaultViewport: null,
  });

  const pages = await browser.pages();
  
  if (pages.length === 0) {
    console.error('No tabs open');
    process.exit(1);
  }

  const activeTab = loadActiveTab();

  // No argument - list all tabs
  if (!arg) {
    console.log('\n📑 Open Tabs:\n');
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const title = await page.title();
      const url = page.url();
      const marker = i === activeTab ? '→' : ' ';
      console.log(`${marker} [${i + 1}] ${title || '(no title)'}`);
      console.log(`     ${url}\n`);
    }
    console.log(`Active tab: ${activeTab + 1}`);
    console.log(`\nUsage: tabs.js <number|url|close>`);
    browser.disconnect();
    return;
  }

  // Close current tab
  if (arg === 'close') {
    if (pages.length === 1) {
      console.error('Cannot close the only tab');
      process.exit(1);
    }
    const page = pages[activeTab];
    const title = await page.title();
    await page.close();
    console.log(`✓ Closed tab: ${title}`);
    // Switch to previous tab or first tab
    const newActive = activeTab > 0 ? activeTab - 1 : 0;
    saveActiveTab(newActive);
    browser.disconnect();
    return;
  }

  // Switch by number
  if (/^\d+$/.test(arg)) {
    const tabNum = parseInt(arg) - 1; // Convert to 0-indexed
    if (tabNum < 0 || tabNum >= pages.length) {
      console.error(`Tab ${arg} doesn't exist. You have ${pages.length} tabs.`);
      process.exit(1);
    }
    const page = pages[tabNum];
    await page.bringToFront();
    saveActiveTab(tabNum);
    const title = await page.title();
    console.log(`✓ Switched to tab ${arg}: ${title}`);
    console.log(`  ${page.url()}`);
    browser.disconnect();
    return;
  }

  // Switch by URL match
  const searchTerm = arg.toLowerCase();
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const url = page.url().toLowerCase();
    const title = (await page.title()).toLowerCase();
    if (url.includes(searchTerm) || title.includes(searchTerm)) {
      await page.bringToFront();
      saveActiveTab(i);
      console.log(`✓ Switched to tab ${i + 1}: ${await page.title()}`);
      console.log(`  ${page.url()}`);
      browser.disconnect();
      return;
    }
  }

  console.error(`No tab found matching "${arg}"`);
  process.exit(1);
}

main().catch(err => {
  console.error('Error:', err.message);
  console.error('Make sure Chrome is running with: start.js');
  process.exit(1);
});
