# EhHyperlink

[English](README.md) | [Sleazy Fork](https://sleazyfork.org/zh-TW/scripts/602046-ehhyperlink)

受 [TranslatedJump](https://github.com/EhTagTranslation/UserScripts/tree/master/TranslatedJump) 啟發的 E-Hentai / ExHentai 畫廊關聯腳本：除了其他語言版本，也找同系列、原刊雜誌與收錄作品，並用 Google、DuckDuckGo、DLsite、pixiv 找來源

## 截圖
<img width="3196" height="1147" alt="Image" src="https://github.com/user-attachments/assets/4bcc7194-0197-491a-8e37-2a7600160c6c" />
<img width="3044" height="1366" alt="Image" src="https://github.com/user-attachments/assets/d29c4c51-a27b-452a-82f0-8c7739c62bb0" />

## 功能

- [x] 畫廊的其他語言版本、同系列、原刊雜誌與收錄作品
- [x] 同作者、同 cosplayer 的相關作品
- [x] 用 Google、DuckDuckGo、DLsite、pixiv 找來源
- [x] 封面預覽，tag 顯示 [EhTagTranslation](https://github.com/EhTagTranslation/Database) 的中文名稱
- [x] 繁體中文、簡體中文、英文、日文、韓文介面
- [x] 支援 E-Hentai 與 ExHentai

## 安裝

需要 [Tampermonkey](https://www.tampermonkey.net/) 或相容的腳本管理器，以及 [Eh View Refined](https://sleazyfork.org/scripts/601247-eh-view-refined)，並將它排在執行順序的最前面。

（EhHyperlink 直接請求 Extended 模式的搜尋列表來取得畫廊資料，這會把網站的顯示模式切成 Extended；Eh View Refined 會在網站維持 Extended 的同時，照你選的排版顯示。）

- [x] [Sleazy Fork](https://sleazyfork.org/zh-TW/scripts/602046-ehhyperlink)
- [x] [GitHub Releases](https://github.com/Tsuyumi25/EhHyperlink/releases)

## 開發

```bash
git clone https://github.com/Tsuyumi25/EhHyperlink.git
cd EhHyperlink
pnpm install
pnpm dev       # 啟動 dev server，瀏覽器會自動安裝開發用 userscript
pnpm build     # 產出 dist/eh-hyperlink.user.js
pnpm test      # vitest
```

## 技術棧

- TypeScript + Vue 3 + Vite
- [vite-plugin-monkey](https://github.com/lisonge/vite-plugin-monkey)
- [magic-regexp](https://github.com/unjs/magic-regexp)

## 致謝

- [EhTagTranslation/Database](https://github.com/EhTagTranslation/Database) — tag 翻譯資料庫（CC BY-NC-SA 3.0）
- [BYVoid/OpenCC](https://github.com/BYVoid/OpenCC) — 簡繁轉換字典（Apache-2.0）
- [URenko/e-hentai-db](https://github.com/URenko/e-hentai-db)

## 靈感來源

- [EhTagTranslation/UserScripts — TranslatedJump](https://github.com/EhTagTranslation/UserScripts/tree/master/TranslatedJump)
- [sk2589822/Exhentai-Enhancer](https://github.com/sk2589822/Exhentai-Enhancer) — 技術棧參考

## 授權

MIT
