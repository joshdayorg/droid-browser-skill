---
name: browser
description: Minimal Chrome DevTools Protocol tools for browser automation and scraping. Use when you need to start Chrome, navigate pages, execute JavaScript, take screenshots, or interactively pick DOM elements.
---

# Browser Tools

Minimal CDP tools for collaborative site exploration and scraping.

**IMPORTANT**: All scripts are located in `.factory/skills/browser/` and must be called with full paths.

## Configuration

Edit `config.js` to customize window/viewport size. Default is configured for 27" Apple Studio Display (right half):

```javascript
export const VIEWPORT = { width: 1280, height: 1340 };
export const WINDOW = { width: 1280, height: 1440, x: 1280, y: 0 };
```

## Start Chrome

```bash
.factory/skills/browser/start.js              # Fresh profile
.factory/skills/browser/start.js --profile    # Copy your profile (cookies, logins)
```

Start Chrome on `:9222` with remote debugging.

## Navigate

```bash
.factory/skills/browser/nav.js https://example.com
.factory/skills/browser/nav.js https://example.com --new
```

Navigate current tab or open new tab.

## Evaluate JavaScript

```bash
.factory/skills/browser/eval.js 'document.title'
.factory/skills/browser/eval.js 'document.querySelectorAll("a").length'
```

Execute JavaScript in active tab (async context).

**IMPORTANT**: The code must be a single expression or use IIFE for multiple statements:

- Single expression: `'document.title'`
- Multiple statements: `'(() => { const x = 1; return x + 1; })()'`
- Avoid newlines in the code string - keep it on one line

## Screenshot

```bash
.factory/skills/browser/screenshot.js
```

Screenshot current viewport, returns temp file path.

## Pick Elements

```bash
.factory/skills/browser/pick.js "Click the submit button"
```

Interactive element picker. Click to select, Cmd/Ctrl+Click for multi-select, Enter to finish.

## Debug Page

```bash
.factory/skills/browser/debug.js                      # Debug current page (15 sec)
.factory/skills/browser/debug.js https://example.com  # Debug specific URL (15 sec)
.factory/skills/browser/debug.js https://example.com 5 # Custom wait time
```

Refreshes the page and captures:
- Console errors and warnings
- JavaScript exceptions
- Failed network requests (4xx, 5xx, network errors)

Use when: "What's wrong with this page?", "Why is this page blank?", "Why isn't my button working?"

## Manage Tabs

```bash
.factory/skills/browser/tabs.js              # List all tabs
.factory/skills/browser/tabs.js 2            # Switch to tab 2
.factory/skills/browser/tabs.js heartandsoil # Switch by URL/title match
.factory/skills/browser/tabs.js close        # Close current tab
```

All other scripts (eval, screenshot, debug, pick) operate on the active tab.

## Usage Notes

- Start Chrome first before using other tools
- The `--profile` flag syncs your actual Chrome profile so you're logged in everywhere
- JavaScript evaluation runs in an async context in the page
- Pick tool allows you to visually select DOM elements by clicking on them
