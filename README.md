# Browser Automation Skill for Factory Droids

Give Droid the ability to see and control your browser.

## What is this?

This skill lets you ask [Droid](https://docs.factory.ai) to browse websites, debug pages, take screenshots, and interact with web apps - all through natural conversation.

**New to Droid?** [Droid](https://docs.factory.ai) is an AI coding assistant that runs in your terminal. Install it at [factory.ai](https://www.factory.ai).

## Quick Start

**Prerequisites:** Node.js 18+, Google Chrome, [Droid CLI](https://docs.factory.ai)

```bash
# Install the skill
git clone https://github.com/joshdayorg/droid-browser-skill.git /tmp/droid-browser-skill
cp -r /tmp/droid-browser-skill/browser ~/.factory/skills/browser
cd ~/.factory/skills/browser && npm install
rm -rf /tmp/droid-browser-skill
```

**Try it:**

1. Start Droid in your terminal: `droid`
2. Say: *"Start the browser"*
3. Say: *"Go to google.com"*

That's it! Droid is now controlling Chrome.

## What Can You Ask Droid?

Once the browser skill is installed, just talk naturally:

| You say... | Droid does... |
|------------|---------------|
| "Start the browser" | Launches Chrome |
| "Go to example.com" | Navigates to the URL |
| "What's wrong with this page?" | Debugs console errors, JS exceptions, network failures |
| "Take a screenshot" | Captures the viewport |
| "Show me the page structure" | Returns LLM-friendly DOM snapshot |
| "Open a new tab and go to github.com" | Opens new tab, navigates |
| "Switch to the google tab" | Switches between tabs |
| "Click the login button" | Interacts with elements |
| "Fill in the email field with test@example.com" | Types into inputs |

## Enhancements

Based on [Factory's browser skill](https://docs.factory.ai/cli/configuration/skills/browser), with:

- **Page debugger** - `debug.js` captures console errors, JS exceptions, and failed network requests in one command
- **LLM-friendly DOM snapshots** - `snapshot.js` returns an accessibility tree with element refs for easy interaction
- **Multi-tab support** - `tabs.js` to list, switch, and close tabs; all scripts operate on the active tab
- **Full-size viewport** - Uses `defaultViewport: null` so the page fills the browser window
- **Configurable window size** - `config.js` to customize for your monitor
- **15-second debug default** - Captures more issues than the typical 5-second window

---

## Scripts Reference

| Script | Description |
|--------|-------------|
| `start.js` | Launch Chrome with remote debugging on port 9222 |
| `nav.js` | Navigate to URLs, open new tabs |
| `eval.js` | Execute JavaScript in the browser |
| `screenshot.js` | Capture viewport screenshots |
| `pick.js` | Interactive visual element picker |
| `debug.js` | Full page debugging - console errors, JS exceptions, failed network requests |
| `tabs.js` | List, switch, and close browser tabs |
| `snapshot.js` | LLM-friendly DOM snapshot - accessibility tree with element refs |

## Installation Options

### Option A: Personal Skills (follows you across projects)

```bash
git clone https://github.com/joshdayorg/droid-browser-skill.git /tmp/droid-browser-skill
cp -r /tmp/droid-browser-skill/browser ~/.factory/skills/browser
cd ~/.factory/skills/browser && npm install
rm -rf /tmp/droid-browser-skill
```

### Option B: Project Skills (shared via git)

```bash
git clone https://github.com/joshdayorg/droid-browser-skill.git /tmp/droid-browser-skill
mkdir -p .factory/skills
cp -r /tmp/droid-browser-skill/browser .factory/skills/browser
cd .factory/skills/browser && npm install
rm -rf /tmp/droid-browser-skill
git add .factory/skills/browser
git commit -m "Add browser automation skill"
```

## Configuration

Edit `config.js` to customize for your monitor:

```javascript
// Default: Right half of 27" Apple Studio Display (2560x1440 effective)
export const VIEWPORT = { width: 1280, height: 1340 };
export const WINDOW = { width: 1280, height: 1440, x: 1280, y: 0 };
```

### Common Configurations

**Full screen (any monitor):**
```javascript
export const WINDOW = { width: 1920, height: 1080, x: 0, y: 0 };
```

**Left half of screen:**
```javascript
export const WINDOW = { width: 1280, height: 1440, x: 0, y: 0 };
```

**Smaller window:**
```javascript
export const WINDOW = { width: 1024, height: 768, x: 100, y: 100 };
```

## Detailed Usage

### Start Chrome

```bash
# Fresh profile
.factory/skills/browser/start.js

# Use your existing Chrome profile (keeps logins, cookies)
.factory/skills/browser/start.js --profile
```

### Navigate

```bash
# Navigate current tab
.factory/skills/browser/nav.js https://example.com

# Open in new tab
.factory/skills/browser/nav.js https://example.com --new
```

### Execute JavaScript

```bash
# Get page title
.factory/skills/browser/eval.js "document.title"

# Count links
.factory/skills/browser/eval.js "document.querySelectorAll('a').length"

# Click a button
.factory/skills/browser/eval.js "document.querySelector('button').click()"
```

### Take Screenshot

```bash
.factory/skills/browser/screenshot.js
# Output: ✓ Screenshot saved: /tmp/screenshot-2024-01-15T10-30-00.png
```

### Debug Page (Console, JS Errors, Network)

```bash
# Debug current page (15 second capture)
.factory/skills/browser/debug.js

# Debug specific URL
.factory/skills/browser/debug.js https://example.com

# Custom capture time (5 seconds)
.factory/skills/browser/debug.js https://example.com 5
```

**Example output:**
```
🔍 Debugging: https://example.com
   Listening for 15 seconds...

════════════════════════════════════════════════════════════

📋 CONSOLE ERRORS & WARNINGS:
   ❌ [error] Failed to load resource: 404

💥 JAVASCRIPT ERRORS:
   ❌ TypeError: Cannot read property 'map' of undefined
      at App.js:42

🌐 FAILED NETWORK REQUESTS:
   ❌ GET /api/users → 401 Unauthorized

════════════════════════════════════════════════════════════
📊 SUMMARY: 1 console issues, 1 JS errors, 1 failed requests
```

### Manage Tabs

```bash
# List all tabs
.factory/skills/browser/tabs.js

# Switch to tab 2
.factory/skills/browser/tabs.js 2

# Switch by URL or title match
.factory/skills/browser/tabs.js google
.factory/skills/browser/tabs.js "My App"

# Close current tab
.factory/skills/browser/tabs.js close
```

### Pick Elements

```bash
.factory/skills/browser/pick.js "Select the login button"
# Click elements in browser, press Enter in terminal when done
# Returns: tag, id, classes, text, selector for each picked element
```

### DOM Snapshot (LLM-friendly)

```bash
.factory/skills/browser/snapshot.js
```

Returns an accessibility tree optimized for AI understanding:

```
- button "SHOP" [ref=e8]
- link "Learn More" [ref=e13]
- textbox "Email" [ref=e35]
- heading "Products" [level=2]
```

Interact with elements using their refs:

```bash
# Click a button
.factory/skills/browser/eval.js "document.querySelector('[data-ref=e8]').click()"

# Fill a text field
.factory/skills/browser/eval.js "document.querySelector('[data-ref=e35]').value = 'test@example.com'"
```

## How It Works

This skill uses **Puppeteer Core** to connect to Chrome via the Chrome DevTools Protocol (CDP). Unlike full Puppeteer, it doesn't bundle Chromium - it connects to your existing Chrome installation.

Key design decisions:
- **`defaultViewport: null`** - Viewport matches window size, no weird small content areas
- **Stateful tab tracking** - Scripts remember which tab is active
- **15-second debug default** - Captures most page load issues without being too slow

## Troubleshooting

**Chrome won't start:**
- Make sure Chrome is installed
- Check if port 9222 is already in use: `lsof -i :9222`

**Scripts timeout:**
- Chrome may be unresponsive; restart with `start.js`
- Kill stuck Chrome: `pkill -f "chrome-debug"`

**Viewport is wrong size:**
- Edit `config.js` to match your monitor
- Restart Chrome after changing config

## License

MIT
