<script setup lang="ts">
import { locale, t } from '@/i18n'
import type { EditionGroup } from '@/core/pipeline'
import { displayTitle, subtitle } from '@/settings'

defineProps<{ groups: EditionGroup[]; showScore: boolean }>()

function percent(score: number): string {
  return `${Math.round(score * 100)}%`
}

/** Border colours cycle so two books that sit next to each other never share one. */
const BOOK_COLOURS = 4
</script>

<template>
  <div class="ehl-list">
    <section v-for="group in groups" :key="group.language.value" class="ehl-section">
      <h4 class="ehl-head">
        <span class="ehl-code">{{ group.language.code }}</span>
        {{ group.language.name[locale] }}
        <span class="ehl-count">{{ group.books.length }}</span>
      </h4>
      <ul>
        <!-- several releases of one book get a frame around them; a lone release needs none -->
        <template v-for="(book, index) in group.books" :key="book.releases[0].hit.gid">
          <li v-if="book.releases.length === 1">
            <a class="ehl-title" :href="book.releases[0].hit.href" target="_blank" rel="noopener">
              {{ displayTitle(book.releases[0].hit) }}
              <span v-if="subtitle(book.releases[0].hit)" class="ehl-subtitle">{{ subtitle(book.releases[0].hit) }}</span>
            </a>
            <span v-for="flag in book.releases[0].flags" :key="flag" class="ehl-flag">{{ t(flag === 'rewrite' ? 'rewrite' : 'roughTranslation') }}</span>
            <span v-if="showScore" class="ehl-meta">{{ percent(book.releases[0].score) }}</span>
            <span v-if="book.releases[0].hit.pages !== null" class="ehl-meta">{{ book.releases[0].hit.pages }}{{ t('pages') }}</span>
            <a v-if="book.releases[0].hit.torrentHref" class="ehl-torrent" :href="book.releases[0].hit.torrentHref" target="_blank" rel="noopener" :title="t('torrent')">⇩</a>
          </li>
          <li v-else class="ehl-book" :class="`ehl-book--${index % BOOK_COLOURS}`">
            <ul>
              <li v-for="release in book.releases" :key="release.hit.gid">
                <a class="ehl-title" :href="release.hit.href" target="_blank" rel="noopener">
                  {{ displayTitle(release.hit) }}
                  <span v-if="subtitle(release.hit)" class="ehl-subtitle">{{ subtitle(release.hit) }}</span>
                </a>
                <span v-for="flag in release.flags" :key="flag" class="ehl-flag">{{ t(flag === 'rewrite' ? 'rewrite' : 'roughTranslation') }}</span>
                <span v-if="showScore" class="ehl-meta">{{ percent(release.score) }}</span>
                <span v-if="release.hit.pages !== null" class="ehl-meta">{{ release.hit.pages }}{{ t('pages') }}</span>
                <a v-if="release.hit.torrentHref" class="ehl-torrent" :href="release.hit.torrentHref" target="_blank" rel="noopener" :title="t('torrent')">⇩</a>
              </li>
            </ul>
          </li>
        </template>
      </ul>
    </section>
  </div>
</template>
