// ==UserScript==
// @name               EhHyperlink
// @namespace          https://github.com/Tsuyumi25/EhHyperlink
// @version            0.2.4
// @author             tsuyumi
// @description        Inspired by TranslatedJump: besides other language editions, also finds the series, source magazine and chapters of an E-Hentai / ExHentai gallery, and searches Google, DuckDuckGo, DLsite and pixiv for its source
// @description:zh-TW  受 TranslatedJump 啟發的 E-Hentai / ExHentai 畫廊關聯腳本：除了其他語言版本，也找同系列、原刊雜誌與收錄作品，並用 Google、DuckDuckGo、DLsite、pixiv 找來源
// @description:zh-CN  受 TranslatedJump 启发的 E-Hentai / ExHentai 画廊关联脚本：除了其他语言版本，也找同系列、原刊杂志与收录作品，并用 Google、DuckDuckGo、DLsite、pixiv 搜索来源
// @description:ja     TranslatedJump に着想を得た E-Hentai / ExHentai ギャラリー関連スクリプト：他言語版に加え、同シリーズ・掲載誌・収録作品も探し、Google・DuckDuckGo・DLsite・pixiv で出典を検索
// @description:ko     TranslatedJump에서 영감을 받은 E-Hentai / ExHentai 갤러리 연결 스크립트: 다른 언어판뿐 아니라 같은 시리즈, 원본 잡지와 수록작도 찾고, Google·DuckDuckGo·DLsite·pixiv로 출처를 검색
// @license            MIT
// @icon               https://e-hentai.org/favicon.ico
// @homepageURL        https://github.com/Tsuyumi25/EhHyperlink
// @supportURL         https://github.com/Tsuyumi25/EhHyperlink/issues
// @include            /^https:\/\/www\.google\.[a-z.]+\/search/
// @include            /^https:\/\/www\.pixiv\.net\/(en\/)?search/
// @match              https://exhentai.org/g/*
// @match              https://e-hentai.org/g/*
// @match              https://www.dlsite.com/*/fsr/*
// @match              https://html.duckduckgo.com/html/*
// @connect            i.pximg.net
// @connect            self
// @grant              GM.deleteValue
// @grant              GM.getValue
// @grant              GM.listValues
// @grant              GM.setValue
// @grant              GM_addStyle
// @grant              GM_addValueChangeListener
// @grant              GM_openInTab
// @grant              GM_removeValueChangeListener
// @grant              GM_xmlhttpRequest
// @run-at             document-end
// ==/UserScript==