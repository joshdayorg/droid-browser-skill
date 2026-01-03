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

async function getAccessibilityTree(page) {
  // First, inject data-ref attributes on all interactive elements
  await page.evaluate(() => {
    const interactiveSelectors = 'a, button, input, select, textarea, [role="button"], [role="link"], [role="checkbox"], [role="radio"], [role="tab"], [role="menuitem"], [onclick]';
    const elements = document.querySelectorAll(interactiveSelectors);
    elements.forEach((el, i) => {
      el.setAttribute('data-ref', `e${i + 1}`);
    });
  });
  
  const snapshot = await page.accessibility.snapshot();
  if (!snapshot) return '';
  
  const refs = { count: 0 };
  return formatNode(snapshot, 0, refs);
}

function formatNode(node, depth = 0, refs = { count: 0 }) {
  const indent = '  '.repeat(depth);
  let result = '';
  
  // Build the node representation
  let line = indent;
  
  // Role
  const role = node.role || 'generic';
  if (role !== 'generic' && role !== 'none') {
    line += `- ${role}`;
  } else {
    line += `- element`;
  }
  
  // Name (accessible name)
  if (node.name) {
    line += ` "${node.name.slice(0, 80)}${node.name.length > 80 ? '...' : ''}"`;
  }
  
  // Ref for interactive elements
  const interactiveRoles = ['link', 'button', 'textbox', 'checkbox', 'radio', 'combobox', 'menuitem', 'tab', 'searchbox', 'slider', 'spinbutton', 'switch'];
  if (interactiveRoles.includes(role) || node.focused) {
    refs.count++;
    line += ` [ref=e${refs.count}]`;
  }
  
  // States
  if (node.checked) line += ' [checked]';
  if (node.disabled) line += ' [disabled]';
  if (node.expanded !== undefined) line += node.expanded ? ' [expanded]' : ' [collapsed]';
  if (node.selected) line += ' [selected]';
  if (node.pressed) line += ' [pressed]';
  if (node.level) line += ` [level=${node.level}]`;
  
  // Value for inputs
  if (node.value && node.value !== node.name) {
    line += `\n${indent}  /value: "${node.value.slice(0, 50)}${node.value.length > 50 ? '...' : ''}"`;
  }
  
  result += line + '\n';
  
  // Process children
  if (node.children) {
    for (const child of node.children) {
      result += formatNode(child, depth + 1, refs);
    }
  }
  
  return result;
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

  const title = await page.title();
  const url = page.url();
  
  console.log(`\n📄 Page: ${title}`);
  console.log(`🔗 URL: ${url}\n`);
  console.log('─'.repeat(60));
  console.log('ACCESSIBILITY TREE (LLM-friendly DOM snapshot)');
  console.log('─'.repeat(60));
  console.log('');
  
  const tree = await getAccessibilityTree(page);
  console.log(tree);
  
  console.log('─'.repeat(60));
  console.log('Use [ref=eN] values with eval.js to interact with elements:');
  console.log('');
  console.log('  Click:  eval.js "document.querySelector(\'[data-ref=e8]\').click()"');
  console.log('  Type:   eval.js "document.querySelector(\'[data-ref=e35]\').value = \'test@example.com\'"');
  console.log('  Read:   eval.js "document.querySelector(\'[data-ref=e8]\').textContent"');
  
  browser.disconnect();
}

main().catch(err => {
  console.error('Error:', err.message);
  console.error('Make sure Chrome is running with: start.js');
  process.exit(1);
});
