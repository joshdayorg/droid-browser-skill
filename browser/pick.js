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

const prompt = process.argv[2] || 'Select an element';

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

  console.log(`\n${prompt}`);
  console.log('Click to select, Cmd/Ctrl+Click for multi-select, press Enter in terminal when done.\n');

  // Inject picker UI
  await page.evaluate(() => {
    window.__pickedElements = [];
    
    const style = document.createElement('style');
    style.id = '__picker_style';
    style.textContent = `
      .__picker_highlight { outline: 3px solid #ff6b6b !important; outline-offset: 2px; }
      .__picker_selected { outline: 3px solid #4ecdc4 !important; outline-offset: 2px; }
      .__picker_banner {
        position: fixed; top: 0; left: 0; right: 0; z-index: 999999;
        background: #333; color: white; padding: 10px; text-align: center;
        font-family: system-ui; font-size: 14px;
      }
    `;
    document.head.appendChild(style);
    
    const banner = document.createElement('div');
    banner.className = '__picker_banner';
    banner.textContent = 'Element Picker Active - Click to select, Cmd/Ctrl+Click for multi-select';
    document.body.appendChild(banner);
    
    let lastHighlight = null;
    
    document.addEventListener('mouseover', (e) => {
      if (lastHighlight && !lastHighlight.classList.contains('__picker_selected')) {
        lastHighlight.classList.remove('__picker_highlight');
      }
      e.target.classList.add('__picker_highlight');
      lastHighlight = e.target;
    }, true);
    
    document.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const el = e.target;
      if (el.classList.contains('__picker_banner')) return;
      
      if (!e.metaKey && !e.ctrlKey) {
        document.querySelectorAll('.__picker_selected').forEach(s => s.classList.remove('__picker_selected'));
        window.__pickedElements = [];
      }
      
      el.classList.add('__picker_selected');
      el.classList.remove('__picker_highlight');
      
      window.__pickedElements.push({
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        classes: Array.from(el.classList).filter(c => !c.startsWith('__picker')),
        text: el.textContent?.slice(0, 100)?.trim() || null,
        href: el.href || null,
        selector: getSelector(el),
      });
    }, true);
    
    function getSelector(el) {
      if (el.id) return `#${el.id}`;
      let selector = el.tagName.toLowerCase();
      if (el.className) {
        const classes = Array.from(el.classList)
          .filter(c => !c.startsWith('__picker'))
          .slice(0, 2)
          .join('.');
        if (classes) selector += '.' + classes;
      }
      return selector;
    }
  });

  // Wait for user input
  process.stdin.setRawMode(true);
  process.stdin.resume();
  
  await new Promise(resolve => {
    process.stdin.on('data', (data) => {
      if (data[0] === 13 || data[0] === 10) resolve(); // Enter key
      if (data[0] === 3) process.exit(); // Ctrl+C
    });
  });

  // Get results
  const results = await page.evaluate(() => {
    document.querySelector('.__picker_banner')?.remove();
    document.querySelector('#__picker_style')?.remove();
    document.querySelectorAll('.__picker_highlight, .__picker_selected').forEach(el => {
      el.classList.remove('__picker_highlight', '__picker_selected');
    });
    return window.__pickedElements;
  });

  console.log('\nSelected elements:');
  console.log(JSON.stringify(results, null, 2));
  
  browser.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err.message);
  console.error('Make sure Chrome is running with: start.js');
  process.exit(1);
});
