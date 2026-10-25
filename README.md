# EhHyperlink

[繁體中文](README.zh-TW.md) | [Sleazy Fork](https://sleazyfork.org/zh-TW/scripts/602046-ehhyperlink)

Inspired by [TranslatedJump](https://github.com/EhTagTranslation/UserScripts/tree/master/TranslatedJump): besides other language editions, also finds the series, source magazine and chapters of an E-Hentai / ExHentai gallery, and searches Google, DuckDuckGo, DLsite and pixiv for its source

## Screenshots
<img width="3196" height="1147" alt="Image" src="https://github.com/user-attachments/assets/4bcc7194-0197-491a-8e37-2a7600160c6c" />
<img width="3044" height="1366" alt="Image" src="https://github.com/user-attachments/assets/d29c4c51-a27b-452a-82f0-8c7739c62bb0" />

## Features

- [x] Other language editions, series, source magazine and chapters of a gallery
- [x] Related works by the same creator or cosplayer
- [x] Source search on Google, DuckDuckGo, DLsite and pixiv
- [x] Cover preview with Chinese tag names from [EhTagTranslation](https://github.com/EhTagTranslation/Database)
- [x] Traditional Chinese, Simplified Chinese, English, Japanese, and Korean UI
- [x] E-Hentai and ExHentai support

## Install

Requires [Tampermonkey](https://www.tampermonkey.net/) or a compatible userscript manager, and [Eh View Refined](https://sleazyfork.org/scripts/601247-eh-view-refined) placed first in the execution order.

(EhHyperlink reads gallery data from search lists requested in Extended mode, which switches the site to Extended; Eh View Refined keeps showing your chosen layout while the site stays in Extended.)

- [x] [Sleazy Fork](https://sleazyfork.org/zh-TW/scripts/602046-ehhyperlink)
- [x] [GitHub Releases](https://github.com/Tsuyumi25/EhHyperlink/releases)

## Development

```bash
git clone https://github.com/Tsuyumi25/EhHyperlink.git
cd EhHyperlink
pnpm install
pnpm dev       # Start dev server; the browser will auto-install the dev userscript
pnpm build     # Output dist/eh-hyperlink.user.js
pnpm test      # vitest
```

## Tech Stack

- TypeScript + Vue 3 + Vite
- [vite-plugin-monkey](https://github.com/lisonge/vite-plugin-monkey)
- [magic-regexp](https://github.com/unjs/magic-regexp)

## Credits

- [EhTagTranslation/Database](https://github.com/EhTagTranslation/Database) — Tag translation database (CC BY-NC-SA 3.0)
- [BYVoid/OpenCC](https://github.com/BYVoid/OpenCC) — Simplified/Traditional conversion dictionaries (Apache-2.0)
- [URenko/e-hentai-db](https://github.com/URenko/e-hentai-db)

## Inspiration

- [EhTagTranslation/UserScripts — TranslatedJump](https://github.com/EhTagTranslation/UserScripts/tree/master/TranslatedJump)
- [sk2589822/Exhentai-Enhancer](https://github.com/sk2589822/Exhentai-Enhancer) — Tech stack reference

## License

MIT
