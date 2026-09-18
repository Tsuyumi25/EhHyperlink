<script setup lang="ts">
import { ref } from 'vue'
import type { Book, EditionFlag, EditionGroup } from '@/core/pipeline'
import { displayTitle, subtitle } from '@/settings'
import { locale, type MessageKey, t } from '@/i18n'

/** Flag labels, one key each: the set is small and closed, so a table beats a branch. */
const FLAG_LABELS: Record<EditionFlag, MessageKey> = {
  rewrite: 'rewrite',
  'rough translation': 'roughTranslation',
  'extraneous ads': 'extraneousAds',
}

defineProps<{ groups: EditionGroup[]; showScore: boolean }>()

function percent(score: number): string {
  return `${Math.round(score * 100)}%`
}

/** Border colours cycle so two books that sit next to each other never share one. */
const BOOK_COLOURS = 4

/**
 * A frame says "these rows are one book". One book holding every row is a
 * legitimate result — a single work with several releases found — so the frame
 * is drawn whenever a book has more than one release.
 */
function framed(book: Book): boolean {
  return book.releases.length > 1
}

/**
 * Cover of the row under the pointer, `position: fixed` so that where and how
 * big it is gets measured rather than declared.
 *
 * It sits beside the list, top-aligned with it, as wide as the room there allows
 * up to `PREVIEW_MAX_WIDTH`. Below `PREVIEW_MIN_WIDTH` the room is not worth
 * having, and it moves against the window's right edge and overlaps the list —
 * the one case where it hides text, and better than running off screen.
 *
 * The width is also capped by the height below the list: a cover is portrait
 * (EH thumbnails run about 5:7), so a width implies a height, and `max-height`
 * catches the rare cover taller than that.
 */
const PREVIEW_MAX_WIDTH = 340
const PREVIEW_MIN_WIDTH = 160
const COVER_HEIGHT_OVER_WIDTH = 7 / 5
const GAP = 8

const listEl = ref<HTMLElement | null>(null)
const preview = ref('')
const previewStyle = ref<Record<string, string>>({})

function showPreview(thumb: string): void {
  preview.value = thumb
  const box = listEl.value?.getBoundingClientRect()
  if (!thumb || !box) return
  const top = Math.max(GAP, box.top)
  const height = window.innerHeight - top - GAP
  const beside = box.right + GAP
  const room = window.innerWidth - beside - GAP
  const width = Math.min(PREVIEW_MAX_WIDTH, Math.round(height / COVER_HEIGHT_OVER_WIDTH), Math.max(room, PREVIEW_MIN_WIDTH))
  previewStyle.value = {
    left: `${Math.round(room >= width ? beside : Math.max(GAP, window.innerWidth - width - GAP))}px`,
    top: `${Math.round(top)}px`,
    width: `${width}px`,
    maxHeight: `${Math.round(height)}px`,
  }
}
</script>

<template>
  <div ref="listEl" class="ehl-list">
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
          :class="framed(book) ? `ehl-book ehl-book--${index % BOOK_COLOURS}` : 'ehl-books'"
        >
          <ul>
            <li v-for="release in book.releases" :key="release.hit.gid" @mouseenter="showPreview(release.hit.thumb)" @mouseleave="showPreview('')">
              <a class="ehl-title" :href="release.hit.href" target="_blank" rel="noopener">
                {{ displayTitle(release.hit) }}
                <span v-if="subtitle(release.hit)" class="ehl-subtitle">{{ subtitle(release.hit) }}</span>
              </a>
              <span class="ehl-facts">
                <span v-if="release.hit.rating !== null" class="ehl-stars" :title="`${release.hit.rating.toFixed(2)} / 5`">
                  <span class="ehl-stars-on" :style="{ width: `${(release.hit.rating / 5) * 100}%` }">★★★★★</span>
                  ★★★★★
                </span>
                <span v-if="showScore" class="ehl-meta">{{ percent(release.score) }}</span>
                <span v-if="release.hit.pages !== null" class="ehl-meta">{{ release.hit.pages }}{{ t('pages') }}</span>
                <span v-for="flag in release.flags" :key="flag" class="ehl-flag">{{ t(FLAG_LABELS[flag]) }}</span>
                <a v-if="release.hit.torrentHref" class="ehl-torrent" :href="release.hit.torrentHref" target="_blank" rel="noopener" :title="t('torrent')">⇩</a>
              </span>
            </li>
          </ul>
        </li>
      </ul>
    </section>
    <img v-if="preview" class="ehl-preview" :src="preview" :style="previewStyle" alt="" referrerpolicy="no-referrer" />
  </div>
</template>
