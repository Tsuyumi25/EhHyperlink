import { fileURLToPath, URL } from 'url'

import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import monkey from 'vite-plugin-monkey'
import pkg from './package.json'

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
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
  },
})
