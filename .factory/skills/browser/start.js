#!/usr/bin/env node
import { spawn, execSync } from 'child_process';
import { existsSync, mkdirSync, cpSync } from 'fs';
import { homedir, tmpdir, platform } from 'os';
import { join } from 'path';
import { WINDOW, CHROME_PORT } from './config.js';

const useProfile = process.argv.includes('--profile');

function getChromePath() {
  const paths = {
    darwin: [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
    ],
    linux: [
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
    ],
    win32: [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    ],
  };
  
  for (const p of paths[platform()] || []) {
    if (existsSync(p)) return p;
  }
  throw new Error('Chrome not found');
}

function getDefaultProfilePath() {
  const paths = {
    darwin: join(homedir(), 'Library/Application Support/Google/Chrome'),
    linux: join(homedir(), '.config/google-chrome'),
    win32: join(homedir(), 'AppData/Local/Google/Chrome/User Data'),
  };
  return paths[platform()];
}

async function main() {
  const chromePath = getChromePath();
  const tempDir = join(tmpdir(), `chrome-debug-${Date.now()}`);
  mkdirSync(tempDir, { recursive: true });

  let userDataDir = tempDir;
  
  if (useProfile) {
    const defaultProfile = getDefaultProfilePath();
    if (existsSync(defaultProfile)) {
      const profileDest = join(tempDir, 'profile');
      mkdirSync(profileDest, { recursive: true });
      try {
        cpSync(defaultProfile, profileDest, { recursive: true });
        userDataDir = profileDest;
        console.log('✓ Copied Chrome profile for authenticated sessions');
      } catch (e) {
        console.log('⚠ Could not copy profile, using fresh profile');
      }
    }
  }

  const args = [
    `--remote-debugging-port=${CHROME_PORT}`,
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    `--window-size=${WINDOW.width},${WINDOW.height}`,
    `--window-position=${WINDOW.x},${WINDOW.y}`,
  ];

  const chrome = spawn(chromePath, args, {
    detached: true,
    stdio: 'ignore',
  });
  
  chrome.unref();
  
  // Wait for Chrome to start
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log(`✓ Chrome started on :9222${useProfile ? ' with your profile' : ''}`);
  console.log(`  User data dir: ${userDataDir}`);
}

main().catch(console.error);
