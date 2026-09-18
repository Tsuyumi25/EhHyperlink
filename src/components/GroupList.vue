<script setup lang="ts">
import type { Book, EditionGroup } from '@/core/pipeline'
import { displayTitle, subtitle } from '@/settings'
import { locale, t } from '@/i18n'

defineProps<{ groups: EditionGroup[]; showScore: boolean }>()

function percent(score: number): string {
  return `${Math.round(score * 100)}%`
}

/** Border colours cycle so two books that sit next to each other never share one. */
const BOOK_COLOURS = 4

/**
 * A frame says "these rows are one book", which only means something when another
 * book stands beside it. One book holding every row is either a list that really
 * is one book, or a grouping that failed to split — and in both cases a frame
 * around everything says nothing, so it is left off.
 */
function framed(group: EditionGroup, book: Book): boolean {
  return group.books.length > 1 && book.releases.length > 1
}
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
        <li
          v-for="(book, index) in group.books"
          :key="book.releases[0].hit.gid"
          :class="framed(group, book) ? `ehl-book ehl-book--${index % BOOK_COLOURS}` : 'ehl-books'"
        >
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
      </ul>
    </section>
  </div>
</template>
