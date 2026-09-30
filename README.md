# Nua

A calm, customizable new tab for Chrome, built with [Plasmo](https://docs.plasmo.com/), React and Tailwind.

## Widgets

Turn each widget on or off in the popup (toolbar icon → **Widgets**):

- **Background photo**: Unsplash search with a color filter, and ♥ favorites you can cycle through
- **News**: Hacker News plus RSS/Atom feeds; add, remove and reorder feeds in the popup
- **Pomodoro**: focus, short break and long break; finishes and notifies from the background worker
- **Work day bar**: progress through your working hours (bar or ring)
- **Notes & to-do**: a scratchpad and task list, stored locally
- **Currency**: any Twelve Data ticker, 1D to full history, area, line or candlestick chart
- **Clock**, **quick links** and a **search bar** that uses your default search engine

## API keys

Photos and prices need free keys from [Unsplash](https://unsplash.com/oauth/applications) (Access Key) and [Twelve Data](https://twelvedata.com/register). Enter them in the popup → **API keys**. They are stored in `chrome.storage.local` on your device only.

Keys are **not** bundled into the build: anything in an extension package can be read by whoever installs it. Don't reintroduce `PLASMO_PUBLIC_*` variables for secrets, because Plasmo inlines them into the bundle.

## Development

```bash
npm install
npm run dev      # watch build in build/chrome-mv3-dev
```

In `chrome://extensions`, turn on **Developer mode**, click **Load unpacked**, and select `build/chrome-mv3-dev`.

## Production build

```bash
npm run build    # build/chrome-mv3-prod
npm run package  # build/chrome-mv3-prod.zip, the file you upload
```

## Releasing to the Chrome Web Store

Store copy, permission justifications and privacy answers are in [`STORE_LISTING.md`](STORE_LISTING.md). The privacy policy is [`PRIVACY.md`](PRIVACY.md), and the promo tile is in [`store-assets/`](store-assets/).

For each release:

1. Bump `version` in `package.json` (the store rejects a version it has already seen).
2. Run `npm run build && npm run package`.
3. Check that no secret made it into the zip. This should print `0`:
   ```bash
   unzip -p build/chrome-mv3-prod.zip | grep -c -E "PLASMO_PUBLIC|Client-ID [A-Za-z0-9_-]{20,}" || true
   ```
4. Upload `build/chrome-mv3-prod.zip` in the [Developer Dashboard](https://chrome.google.com/webstore/devconsole) and submit it for review.

### Screenshots

The store needs 1280×800 (or 640×400) screenshots. Load the production build, open a new tab, open DevTools (⌥⌘I), turn on the device toolbar (⇧⌘M), set **Responsive** to 1280 × 800, then use ⋮ → **Capture screenshot**. Take a few: the full dashboard, the news widget, the Pomodoro popover, the chart, and the settings popup.

### Automated publishing (optional)

After the first manual upload, `.github/workflows/submit.yml` can publish with [Plasmo's bpp action](https://docs.plasmo.com/framework/workflows/submit). Uncomment it and add a `SUBMIT_KEYS` secret with your Chrome Web Store API credentials.
