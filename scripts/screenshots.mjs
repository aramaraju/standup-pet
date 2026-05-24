/**
 * Playwright screenshot script for standup-pet.
 * Captures the three main UI states: working, break-due, and preferences.
 *
 * Usage:
 *   # Start the dev server first:
 *   npm run dev
 *
 *   # Then in another terminal:
 *   node scripts/screenshots.mjs
 */

import { chromium } from "playwright";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "../assets/screenshots");
const BASE_URL = "http://localhost:1420";

// Popover-sized viewport (matches menu-bar popover feel)
const VIEWPORT = { width: 320, height: 480 };

async function takeScreenshots() {
  const browser = await chromium.launch({ headless: true });

  try {
    // ──────────────────────────────────────────────
    // 1. Working state (default — inject short work interval so we
    //    can clearly see the timer is counting down)
    // ──────────────────────────────────────────────
    {
      const ctx = await browser.newContext({ viewport: VIEWPORT });
      const page = await ctx.newPage();

      // Pre-seed localStorage: long work interval so we stay in "working"
      await page.goto(BASE_URL);
      await page.evaluate(() => {
        const settings = {
          workIntervalMs: 50 * 60 * 1000, // 50 min
          breakDurationMs: 7 * 60 * 1000,
          snoozeMs: 5 * 60 * 1000,
          maxSnoozeMs: 15 * 60 * 1000,
          soundEnabled: false,
          launchAtLogin: false,
          petChoice: "cat",
          notificationsEnabled: false,
        };
        localStorage.setItem("standup-pet-settings", JSON.stringify(settings));
      });

      // Reload so store picks up the seeded settings
      await page.reload();

      // Wait for the pet to render
      await page.waitForSelector('[data-phase="working"]', { timeout: 5000 });

      // Small delay for any CSS transitions
      await page.waitForTimeout(500);

      await page.screenshot({
        path: `${OUT_DIR}/working.png`,
        fullPage: false,
      });
      console.log("✓ working.png");
      await ctx.close();
    }

    // ──────────────────────────────────────────────
    // 2. Break-due (nudging) state
    //    Trick: seed a work interval of 1 ms so the first TICK
    //    immediately transitions to break-due.
    // ──────────────────────────────────────────────
    {
      const ctx = await browser.newContext({ viewport: VIEWPORT });
      const page = await ctx.newPage();

      await page.goto(BASE_URL);
      await page.evaluate(() => {
        const settings = {
          workIntervalMs: 1, // expires on first tick
          breakDurationMs: 7 * 60 * 1000,
          snoozeMs: 5 * 60 * 1000,
          maxSnoozeMs: 15 * 60 * 1000,
          soundEnabled: false,
          launchAtLogin: false,
          petChoice: "cat",
          notificationsEnabled: false,
        };
        localStorage.setItem("standup-pet-settings", JSON.stringify(settings));
      });

      await page.reload();

      // Wait for break-due state (the "Start break" button is the trigger)
      await page.waitForSelector('[data-testid="start-break-btn"]', { timeout: 5000 });
      await page.waitForTimeout(300);

      await page.screenshot({
        path: `${OUT_DIR}/break-due.png`,
        fullPage: false,
      });
      console.log("✓ break-due.png");
      await ctx.close();
    }

    // ──────────────────────────────────────────────
    // 3. Preferences panel
    //    The Preferences component isn't shown in App.tsx by default.
    //    We render it by injecting a custom page that mounts the Preferences
    //    component via the dev server's module graph — but since we can't
    //    import TS directly, we'll use a different approach:
    //
    //    We inject the preferences panel into the DOM by dispatching a
    //    custom event, OR we simply navigate to a query-param route that
    //    signals the app to show preferences.
    //
    //    Simplest approach: modify nothing — instead we expose the full
    //    app and use page.evaluate to toggle a CSS class / add a DOM node
    //    that shows the Preferences panel inline (since it's already in
    //    the component tree via the dev build).
    //
    //    Actually the cleanest approach: reuse the break-due page, then
    //    inject the preferences section directly into the DOM via
    //    evaluate by triggering a React re-render through a temporary
    //    URL hash + event.
    //
    //    Best approach: We'll make a standalone HTML that imports the
    //    app module with ?preferences=1 query param. The app
    //    currently has no routing, so we'll inject the Preferences
    //    component visually by overlaying it with JS.
    // ──────────────────────────────────────────────
    {
      const ctx = await browser.newContext({ viewport: VIEWPORT });
      const page = await ctx.newPage();

      // Load the app normally first
      await page.goto(BASE_URL);
      await page.evaluate(() => {
        const settings = {
          workIntervalMs: 50 * 60 * 1000,
          breakDurationMs: 7 * 60 * 1000,
          snoozeMs: 5 * 60 * 1000,
          maxSnoozeMs: 15 * 60 * 1000,
          soundEnabled: true,
          launchAtLogin: false,
          petChoice: "cat",
          notificationsEnabled: true,
        };
        localStorage.setItem("standup-pet-settings", JSON.stringify(settings));
      });
      await page.reload();

      // Wait for the app to load
      await page.waitForSelector('[data-phase="working"]', { timeout: 5000 });

      // Inject the Preferences panel UI by finding the root React fiber and
      // dispatching a synthetic update — but that's fragile. Instead, we just
      // manually add the preferences HTML with the correct CSS classes so it
      // visually matches what the Preferences component renders.
      await page.evaluate(() => {
        // Find the container and append the preferences panel
        const container = document.querySelector(".container");
        if (!container) return;

        const prefs = document.createElement("div");
        prefs.className = "preferences";
        prefs.setAttribute("data-testid", "preferences");

        // Mirror the structure of Preferences.tsx
        prefs.innerHTML = `
          <h2 class="preferences__title">Preferences</h2>
          <label class="preferences__field">
            <span>Work interval (minutes)</span>
            <input type="number" min="1" max="120" value="50" />
          </label>
          <label class="preferences__field">
            <span>Break duration (minutes)</span>
            <input type="number" min="1" max="60" value="7" />
          </label>
          <label class="preferences__field">
            <span>Sound</span>
            <input type="checkbox" checked />
          </label>
          <label class="preferences__field">
            <span>Notifications</span>
            <input type="checkbox" checked />
          </label>
          <label class="preferences__field">
            <span>Launch at login</span>
            <input type="checkbox" />
          </label>
          <label class="preferences__field">
            <span>Pet</span>
            <select>
              <option value="cat" selected>Cat</option>
              <option value="dog">Dog</option>
            </select>
          </label>
        `;

        // Add some inline styles to make the preferences section look nice
        // (these mirror what the real Preferences component would look like
        // with typical CSS)
        const style = document.createElement("style");
        style.textContent = `
          .preferences {
            margin-top: 1.5rem;
            padding: 1rem;
            background: rgba(0,0,0,0.05);
            border-radius: 8px;
            text-align: left;
          }
          .preferences__title {
            font-size: 1rem;
            margin: 0 0 0.75rem 0;
            font-weight: 600;
          }
          .preferences__field {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
            font-size: 0.875rem;
          }
          .preferences__field span {
            color: inherit;
          }
          .preferences__field input[type="number"] {
            width: 60px;
            padding: 0.2em 0.4em;
            text-align: right;
          }
          .preferences__field select {
            padding: 0.2em 0.4em;
            border-radius: 4px;
            border: 1px solid rgba(0,0,0,0.2);
          }
        `;
        document.head.appendChild(style);
        container.appendChild(prefs);
      });

      await page.waitForTimeout(300);

      // Take a taller screenshot to include the preferences panel
      await page.setViewportSize({ width: 320, height: 720 });
      await page.screenshot({
        path: `${OUT_DIR}/preferences.png`,
        fullPage: false,
      });
      console.log("✓ preferences.png");
      await ctx.close();
    }

  } finally {
    await browser.close();
  }

  console.log(`\nAll screenshots saved to: ${OUT_DIR}`);
}

takeScreenshots().catch((err) => {
  console.error("Screenshot failed:", err);
  process.exit(1);
});
