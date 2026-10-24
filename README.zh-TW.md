# EhHyperlink

[English](README.md)

從 E-Hentai / ExHentai 的畫廊頁一鍵跳到它的其他語言版本、同系列、原刊雜誌和收錄作品。

## 找來源

圖庫沒人貼來源時，按設定鈕左邊的「搜索」就會直接開始搜：Google 搜整個標題（只留社團／作者區塊和作品名，去掉前面的場次和後面的語言、版本標記），DLsite 和 pixiv 搜標題切出來的作品、社團、作者。每個搜尋都用你自己的瀏覽器（帶著你的登入）在背景分頁打開，圖庫框會換成搜尋畫面：左邊列出三個網站，右邊是該網站的結果，DLsite 和 pixiv 附上封面與縮圖，背景分頁隨後關掉；按「下一頁」會用同樣的方式再抓一頁。結果裡出現這本的作品、社團、作者名時會標起來，就像搜尋引擎把關鍵字標粗；滑鼠移到一筆結果上會出現複製網址的按鈕，Google 的結果複製的是原站網址，不是 Google 的轉址。

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
