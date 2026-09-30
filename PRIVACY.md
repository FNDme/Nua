# Nua privacy policy

_Last updated: October 1, 2026_

Nua is a Chrome extension that replaces the new tab page with a customizable
dashboard. This policy explains what data Nua handles and where it goes.

**In short: Nua has no servers, no accounts, no analytics and no ads. The
developer never receives any of your data.**

## Data stored in your browser

Nua saves the following with Chrome's extension storage so it's there the next
time you open a new tab:

| Data | Where it's stored |
| --- | --- |
| Settings: visible widgets, background search, ticker, chart style, work hours, Pomodoro durations, news feed list, quick links | Chrome sync storage. If you use Chrome Sync, Google syncs it to your other signed-in browsers. |
| API keys you enter (Unsplash, Twelve Data) | Local storage on this device only (not synced) |
| Notes, to-do items, favorite backgrounds, Pomodoro timer state | Local storage on this device only (not synced) |
| Cached photos, prices and news | Local storage on this device only; replaced automatically |

Only Nua can read this storage. Uninstalling Nua deletes it.

## Data sent to other services

To show its widgets, Nua connects directly from your browser to these
services. Each receives only what it needs:

- **Unsplash** (`api.unsplash.com`, `images.unsplash.com`): your background
  search terms, your Unsplash API key, and the photos you view (as required by
  Unsplash's API guidelines). [Unsplash privacy policy](https://unsplash.com/privacy)
- **Twelve Data** (`api.twelvedata.com`): the ticker you chose, your time zone
  and your Twelve Data API key. [Twelve Data privacy policy](https://twelvedata.com/privacy)
- **Hacker News** (`hacker-news.firebaseio.com`): requests for the current top
  stories. No personal data.
- **News feeds** (The Verge, Ars Technica, TechCrunch, BBC News and any feed
  you add): requests for the feed. No personal data. Nua only contacts a feed's
  site after you grant it access.
- **Your default search engine**: what you type in the search bar, sent
  through Chrome's search API, as with any search from the address bar.

These services see your IP address and browser details, as with any web
request. Their own privacy policies apply.

## What Nua does not do

- It does not collect or sell personal data, or share it with the developer.
- It does not read your browsing history or the pages you visit.
- It does not use your data for advertising, credit or lending decisions.
- It does not load or run code from outside the extension package.

## Permissions

- **storage**: saves your settings, notes and favorites.
- **search**: runs searches from the search bar with your default search engine.
- **activeTab**: when you open Nua's popup, checks whether the current tab is
  already the new tab page.
- **alarms, notifications**: end Pomodoro phases on time and notify you. You can
  turn notifications off.
- **Access to theverge.com, arstechnica.com, techcrunch.com, bbci.co.uk**: loads
  the default news feeds.
- **Optional access to other https sites**: requested one site at a time, only
  when you add a news feed from that site. It is released when you remove the
  feed.

## Contact

Questions about this policy: [your contact email]

If this policy changes, the new version will be posted here with a new date.
