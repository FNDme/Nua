# Chrome Web Store listing: copy and answers

Text to paste into the Chrome Web Store Developer Dashboard. Keep it in sync
with the code when permissions change.

## Store listing tab

**Name:** Nua (from `displayName` in package.json)

**Summary** (manifest description, max 132 characters):
> A calm new tab: beautiful photos, news, a Pomodoro timer, notes, to-dos and a currency chart. You choose the widgets.

**Category:** Productivity
**Language:** English

**Description:**

```
Nua turns every new tab into a calm, useful dashboard. Show only the widgets you want and hide the rest.

WIDGETS
• Background photos from Unsplash: search any theme, filter by color, save favorites with ♥ and cycle through only those.
• News: Hacker News top stories plus RSS/Atom feeds (The Verge, Ars Technica, TechCrunch and BBC News by default). Add your own, reorder the tabs, and page through stories.
• Pomodoro timer: focus sessions and short and long breaks, with notifications, even when no tab is open.
• Work day bar: progress through your working hours, with the time left.
• Quick notes and to-do list, saved on your device.
• Currency and ticker chart: forex, crypto or stocks, from 1 day to the full history, as an area, line or candlestick chart.
• Clock, quick links, and a search bar that uses your default search engine.

YOUR KEYS, YOUR DATA
Nua has no servers, accounts or analytics. Photos and prices use free API keys from Unsplash and Twelve Data. Paste your keys in Nua's settings; they stay on your device and are sent only to their own service. Notes, to-dos and favorites never leave your browser.

SETUP
1. Open a new tab.
2. Click Nua's toolbar icon, then API keys, and paste your Unsplash and Twelve Data keys (the "Get a free key" links help you create them).
3. Choose your widgets, background theme, feeds and timer lengths in the other tabs.
```

**Graphics:** made from the anime.js scene in `store-assets/promo/`. Run `render.mjs` there to regenerate the tile, the MP4 and the GIF.

| Asset | Size | Required | File |
| --- | --- | --- | --- |
| Store icon | 128×128 PNG | yes | `build/chrome-mv3-prod/icon128.plasmo.*.png` |
| Screenshots | 1280×800 (or 640×400), 1–5 | at least 1 | take from the real extension (see README) |
| Small promo tile | 440×280 PNG | yes | `store-assets/promo-small-440x280.png` (final frame of the promo scene) |
| Promo video | YouTube link | no | upload `store-assets/nua-promo.mp4` to YouTube and paste the link |
| Marquee promo tile | 1400×560 PNG | no | not made |

## Privacy practices tab

**Single purpose:**
> Replaces Chrome's new tab page with a customizable dashboard of widgets (background photo, news, timers, notes, currency chart, clock, search and quick links).

**Permission justifications:**

- **storage**: Saves the user's settings, notes, to-dos, favorite backgrounds and API keys in extension storage.
- **search**: The new tab's search bar sends the query to the user's default search engine via chrome.search.
- **activeTab**: When the user opens the popup to add or edit quick links, checks whether the current tab is already the new tab page, so another tab isn't opened.
- **alarms**: Ends each Pomodoro phase on time, even when no new tab page is open.
- **notifications**: Tells the user when a Pomodoro focus session or break ends. It can be turned off in settings.
- **Host permissions** (theverge.com, feeds.arstechnica.com, techcrunch.com, feeds.bbci.co.uk): Fetch the default RSS/Atom feeds for the news widget. These sites don't allow cross-origin requests, so host access is needed.
- **Optional host permission** (`https://*/*`): Requested only when the user adds a custom news feed, and only for that feed's site (chrome.permissions.request). Released when the feed is removed.

**Are you using remote code?** No. All JavaScript is in the package.

**Data usage:**

- Tick **Authentication information**: the user's own Unsplash/Twelve Data API keys are stored locally and sent only to the service that issued them.
- Leave the other categories unticked. Notes, to-dos and favorites stay on the device, and searches go to the user's own search engine through Chrome.
- Tick all three certifications: not sold to third parties; not used or transferred for purposes unrelated to the item's single purpose; not used to determine creditworthiness or for lending.

**Privacy policy URL:** a public link to `PRIVACY.md` (see the README release steps).
