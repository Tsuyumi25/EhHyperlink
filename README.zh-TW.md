# EhHyperlink

[English](README.md)

從 E-Hentai / ExHentai 的畫廊頁一鍵跳到它的其他語言版本、同系列、原刊雜誌和收錄作品。

## 找來源

圖庫沒人貼來源時，按設定鈕左邊的剪貼簿按鈕，會彈出用標題切出的作品、社團、作者組好的搜尋連結，每一列都能搜 DLsite、FANZA、Melonbooks、虎之穴、BOOTH、pixiv、Ci-en、Fantia、X、Misskey、Google。關鍵字可以改。最上面是整個標題的 Google 搜尋：只留社團／作者區塊和作品名，去掉前面的場次和後面的語言、版本標記。按「預覽 Google」會用你自己的瀏覽器（帶著你的登入）在背景分頁打開這個搜尋，把結果列在彈出框裡再把分頁關掉；按「下一頁」會用同樣的方式再抓一頁。

## 安裝

需要 [Tampermonkey](https://www.tampermonkey.net/) 或相容的 userscript manager。

另需安裝 **Eh View Refined**，並將它排在 EhHyperlink 之前執行。EhHyperlink 透過 Extended search request 取得圖庫 metadata；Eh View Refined 會在網站維持 Extended 模式的同時模擬其他原生排版，保留使用者選擇的瀏覽方式。

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
