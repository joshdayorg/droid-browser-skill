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

// Parse args - if first arg is a number, it's wait time; otherwise it's URL
const arg2 = process.argv[2];
const arg3 = process.argv[3];

let url = null;
let waitTime = 15;

if (arg2) {
  if (/^\d+$/.test(arg2)) {
    waitTime = parseInt(arg2);
  } else {
    url = arg2;
    if (arg3) waitTime = parseInt(arg3);
  }
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

  // Storage for collected events
  const consoleLogs = [];
  const jsErrors = [];
  const networkErrors = [];
  const allRequests = [];

  // Listen for console messages
  page.on('console', msg => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()?.url ? `${msg.location().url}:${msg.location().lineNumber}` : null,
    });
  });

  // Listen for JavaScript errors (uncaught exceptions)
  page.on('pageerror', error => {
    jsErrors.push({
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n'),
    });
  });

  // Listen for network requests and responses
  page.on('requestfinished', async request => {
    const response = request.response();
    const status = response?.status() || 0;
    
    allRequests.push({
      url: request.url(),
      method: request.method(),
      status,
      statusText: response?.statusText() || '',
      resourceType: request.resourceType(),
    });

    // Track failed requests (4xx and 5xx)
    if (status >= 400) {
      let responseBody = null;
      try {
        responseBody = await response.text();
        if (responseBody.length > 500) {
          responseBody = responseBody.substring(0, 500) + '...';
        }
      } catch (e) {}

      networkErrors.push({
        url: request.url(),
        method: request.method(),
        status,
        statusText: response?.statusText() || '',
        responseBody,
      });
    }
  });

  // Listen for failed requests (network errors, not HTTP errors)
  page.on('requestfailed', request => {
    networkErrors.push({
      url: request.url(),
      method: request.method(),
      status: 0,
      statusText: 'Network Error',
      failure: request.failure()?.errorText || 'Unknown error',
    });
  });

  // Navigate or refresh
  const targetUrl = url || page.url();
  console.log(`\n🔍 Debugging: ${targetUrl}`);
  console.log(`   Listening for ${waitTime} seconds...\n`);

  if (url) {
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
  } else {
    await page.reload({ waitUntil: 'domcontentloaded' });
  }
  
  // Wait for events to accumulate
  await new Promise(resolve => setTimeout(resolve, waitTime * 1000));

  // Output results
  console.log('═'.repeat(60));
  
  // Console errors/warnings
  const consoleErrors = consoleLogs.filter(l => l.type === 'error' || l.type === 'warning');
  if (consoleErrors.length > 0) {
    console.log('\n📋 CONSOLE ERRORS & WARNINGS:');
    consoleErrors.forEach(log => {
      const icon = log.type === 'error' ? '❌' : '⚠️';
      console.log(`   ${icon} [${log.type}] ${log.text}`);
      if (log.location) console.log(`      at ${log.location}`);
    });
  } else {
    console.log('\n📋 CONSOLE ERRORS & WARNINGS: None');
  }

  // JavaScript errors
  if (jsErrors.length > 0) {
    console.log('\n💥 JAVASCRIPT ERRORS:');
    jsErrors.forEach(err => {
      console.log(`   ❌ ${err.message}`);
      if (err.stack) {
        err.stack.split('\n').slice(1, 4).forEach(line => {
          console.log(`      ${line.trim()}`);
        });
      }
    });
  } else {
    console.log('\n💥 JAVASCRIPT ERRORS: None');
  }

  // Network errors
  if (networkErrors.length > 0) {
    console.log('\n🌐 FAILED NETWORK REQUESTS:');
    networkErrors.forEach(req => {
      console.log(`   ❌ ${req.method} ${req.url}`);
      console.log(`      → ${req.status} ${req.statusText}`);
      if (req.failure) console.log(`      → ${req.failure}`);
      if (req.responseBody) console.log(`      → ${req.responseBody.substring(0, 200)}`);
    });
  } else {
    console.log('\n🌐 FAILED NETWORK REQUESTS: None');
  }

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log(`📊 SUMMARY: ${consoleErrors.length} console issues, ${jsErrors.length} JS errors, ${networkErrors.length} failed requests`);
  console.log(`   Total requests: ${allRequests.length}`);
  
  // Return structured data for programmatic use
  const result = {
    url: targetUrl,
    consoleLogs: consoleErrors,
    jsErrors,
    networkErrors,
    totalRequests: allRequests.length,
  };
  
  console.log('\n📦 JSON OUTPUT:');
  console.log(JSON.stringify(result, null, 2));

  browser.disconnect();
}

main().catch(err => {
  console.error('Error:', err.message);
  console.error('Make sure Chrome is running with: start.js');
  process.exit(1);
});
