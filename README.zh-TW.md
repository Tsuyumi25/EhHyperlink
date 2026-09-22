# EhHyperlink

[English](README.md)

從 E-Hentai / ExHentai 的畫廊頁一鍵跳到它的其他語言版本、同系列、原刊雜誌和收錄作品。

## 安裝

需要 [Tampermonkey](https://www.tampermonkey.net/) 或相容的 userscript manager。

- [ ] Sleazy Fork
- [ ] GitHub Releases

還沒發佈之前：`pnpm build` 之後安裝 `dist/eh-hyperlink.user.js`。

## 開發

```bash
git clone https://github.com/Tsuyumi25/EhHyperlink.git
cd EhHyperlink
pnpm install
pnpm dev       # 啟動 dev server，瀏覽器會自動安裝開發版 userscript
pnpm build     # 輸出 dist/eh-hyperlink.user.js
pnpm test      # vitest
```

貢獻規範、範圍和「測試／fixture 不引用真實作品」的政策在 [AGENTS.md](AGENTS.md)。

## 技術棧

- TypeScript + Vue 3 + Vite
- [vite-plugin-monkey](https://github.com/lisonge/vite-plugin-monkey)
- [magic-regexp](https://github.com/unjs/magic-regexp)

## 致謝

- [URenko/e-hentai-db](https://github.com/URenko/e-hentai-db)

## 靈感來源

- [EhTagTranslation/UserScripts — TranslatedJump](https://github.com/EhTagTranslation/UserScripts/tree/master/TranslatedJump)
- [Exhentai-Enhancer](https://github.com/sk2589822/Exhentai-Enhancer) — 技術棧參考

## 授權

MIT
