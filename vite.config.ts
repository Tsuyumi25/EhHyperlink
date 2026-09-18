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
        match: ['https://exhentai.org/g/*', 'https://e-hentai.org/g/*'],
        name: {
          '': 'EH Hyperlink',
          'zh-TW': 'EH 語言版本跳轉',
          'zh-CN': 'EH 语言版本跳转',
          ja: 'EH 言語版ジャンプ',
        },
        description: {
          '': 'Jump to other language editions of the current E-Hentai / ExHentai gallery, matched by structured title analysis',
          'zh-TW': '在 E-Hentai / ExHentai 畫廊頁一鍵跳轉到其他語言版本，以標題結構分析比對',
          'zh-CN': '在 E-Hentai / ExHentai 画廊页一键跳转到其他语言版本，以标题结构分析比对',
          ja: 'E-Hentai / ExHentai のギャラリーから他言語版へジャンプ。タイトル構造解析で照合',
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
