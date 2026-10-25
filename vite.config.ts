import { fileURLToPath, URL } from 'url'

import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import monkey from 'vite-plugin-monkey'
import pkg from './package.json'
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync } from 'node:fs'

/** Hash of every source file, so the cache key changes whenever a rule does. */
function buildHash(): string {
  const hash = createHash('sha256')
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir).sort()) {
      const path = `${dir}/${entry}`
      if (statSync(path).isDirectory()) walk(path)
      else if (/\.(ts|vue|json)$/.test(entry)) hash.update(readFileSync(path))
    }
  }
  walk('src')
  walk('data')
  return hash.digest('hex').slice(0, 12)
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    // Any code change invalidates every cached response: a rule change has to
    // show up on the next page load rather than after the cache expires.
    __BUILD_HASH__: JSON.stringify(buildHash()),
  },
  plugins: [
    vue(),
    monkey({
      entry: 'src/main.ts',
      userscript: {
        namespace: 'https://github.com/Tsuyumi25/EhHyperlink',
        // Gallery pages, plus the search pages that answer the gallery page's
        // preview (src/services/preview.ts) and do nothing otherwise.
        match: ['https://exhentai.org/g/*', 'https://e-hentai.org/g/*', 'https://www.dlsite.com/*/fsr/*', 'https://html.duckduckgo.com/html/*'],
        // Regexes where a match pattern cannot say it: Google may redirect
        // `www.google.com/search` to a country domain (seen: `www.google.com.hk`,
        // keeping `q` and adding `sei`), and pixiv serves English readers under `/en/`.
        include: [/^https:\/\/www\.google\.[a-z.]+\/search/, /^https:\/\/www\.pixiv\.net\/(en\/)?search/],
        // pixiv thumbnails, fetched with pixiv as the referrer (src/services/thumb.ts);
        // `self` for Google's result redirects, resolved on whichever country
        // domain the search landed on (src/services/redirect.ts).
        connect: ['i.pximg.net', 'self'],
        name: 'EhHyperlink',
        description: {
          '': 'Inspired by TranslatedJump: besides other language editions, also finds the series, source magazine and chapters of an E-Hentai / ExHentai gallery, and searches Google, DuckDuckGo, DLsite and pixiv for its source',
          'zh-TW': '受 TranslatedJump 啟發的 E-Hentai / ExHentai 畫廊關聯腳本：除了其他語言版本，也找同系列、原刊雜誌與收錄作品，並用 Google、DuckDuckGo、DLsite、pixiv 找來源',
          'zh-CN': '受 TranslatedJump 启发的 E-Hentai / ExHentai 画廊关联脚本：除了其他语言版本，也找同系列、原刊杂志与收录作品，并用 Google、DuckDuckGo、DLsite、pixiv 搜索来源',
          ja: 'TranslatedJump に着想を得た E-Hentai / ExHentai ギャラリー関連スクリプト：他言語版に加え、同シリーズ・掲載誌・収録作品も探し、Google・DuckDuckGo・DLsite・pixiv で出典を検索',
          ko: 'TranslatedJump에서 영감을 받은 E-Hentai / ExHentai 갤러리 연결 스크립트: 다른 언어판뿐 아니라 같은 시리즈, 원본 잡지와 수록작도 찾고, Google·DuckDuckGo·DLsite·pixiv로 출처를 검색',
        },
        author: 'tsuyumi',
        license: 'MIT',
        icon: 'https://e-hentai.org/favicon.ico',
        homepageURL: 'https://github.com/Tsuyumi25/EhHyperlink',
        supportURL: 'https://github.com/Tsuyumi25/EhHyperlink/issues',
        'run-at': 'document-end',
      },
      build: {
        metaFileName: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/test-setup.ts'],
  },
})
