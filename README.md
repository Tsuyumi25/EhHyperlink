# EhHyperlink

[繁體中文](README.zh-TW.md)

Jump from an E-Hentai / ExHentai gallery to its other language editions, its series, the magazine it came from, and the chapters it contains.

## Source search

When nobody has posted where a gallery comes from, the clipboard button left of the settings button opens search links for the work, circle and artist read from the title, each searching DLsite, FANZA, Melonbooks, Toranoana, BOOTH, pixiv, Ci-en, Fantia, X, Misskey and Google. On top, the whole title — creator block and work, without the event, language or release tags around them — goes to Google. The terms are editable. The eye after a Google, DLsite or pixiv link previews that search right in the popup: it opens in a background tab of your own browser, signed in as you are, its results are listed under the term and the tab is closed; **Next page** fetches one more page the same way.

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
