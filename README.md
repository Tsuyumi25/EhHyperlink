# EhHyperlink

[繁體中文](README.zh-TW.md)

Jump from an E-Hentai / ExHentai gallery to its other language editions, its series, the magazine it came from, and the chapters it contains.

## Install

Requires [Tampermonkey](https://www.tampermonkey.net/) or a compatible userscript manager.

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
