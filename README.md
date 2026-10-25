# EhHyperlink

[繁體中文](README.zh-TW.md)

Jump from an E-Hentai / ExHentai gallery to its other language editions, its series, the magazine it came from, and the chapters it contains.

The interface is in Traditional Chinese, Simplified Chinese, English, Japanese or Korean, picked in the settings or taken from the browser. In Chinese, the tags in the cover preview show their names from [EhTagTranslation](https://github.com/EhTagTranslation/Database), the database EhSyringe uses — converted to Traditional with [OpenCC](https://github.com/BYVoid/OpenCC)'s dictionaries for the Traditional interface. Both are downloaded the first time they are needed and kept for a week.

## Source search

When nobody has posted where a gallery comes from, **Search** left of the settings button searches for it right away: Google and DuckDuckGo with the whole title (creator block and work, without the event, language or release tags around them), DLsite and pixiv with the work, circle and artist read from the title. Each search opens in a background tab of your own browser, signed in as you are; the gallery box gives way to a view with the sites listed on the left and each site's results on the right — store covers and pixiv thumbnails as cards — and the tab is closed. **Next page** fetches one more page the same way. Wherever the gallery's work, circle or artist names appear in a result, they are marked, as a search engine bolds its query; hovering a result shows a button that copies its link — for Google, the site's own address rather than Google's redirect.

## Install

Requires [Tampermonkey](https://www.tampermonkey.net/) or a compatible userscript manager.

Also requires **Eh View Refined**, placed before EhHyperlink in the userscript execution order. EhHyperlink uses Extended search requests for gallery metadata; Eh View Refined preserves the user's chosen layout by simulating other native views while the site stays in Extended mode.

- [ ] Sleazy Fork
- [ ] GitHub Releases

Until a release exists: `pnpm build` and install `dist/eh-hyperlink.user.js`.

## Development

```bash
git clone https://github.com/Tsuyumi25/EhHyperlink.git
cd EhHyperlink
pnpm install
pnpm dev       # Start dev server; the browser will auto-install the dev userscript
pnpm build     # Output dist/eh-hyperlink.user.js
pnpm test      # vitest
```

Contributor rules, scope and the no-real-works policy for tests and fixtures are in [AGENTS.md](AGENTS.md).

## Tech Stack

- TypeScript + Vue 3 + Vite
- [vite-plugin-monkey](https://github.com/lisonge/vite-plugin-monkey)
- [magic-regexp](https://github.com/unjs/magic-regexp)

## Credits

- [URenko/e-hentai-db](https://github.com/URenko/e-hentai-db)

## Inspiration

- [EhTagTranslation/UserScripts — TranslatedJump](https://github.com/EhTagTranslation/UserScripts/tree/master/TranslatedJump)
- [Exhentai-Enhancer](https://github.com/sk2589822/Exhentai-Enhancer) — Tech stack reference

## License

MIT
