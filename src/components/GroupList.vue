<script setup lang="ts">
import { ref } from 'vue'
import type { Book, Edition, EditionFlag, EditionGroup } from '@/core/pipeline'
import { displayTitle, otherTitle, settings, subtitle } from '@/settings'
import { locale, type MessageKey, t } from '@/i18n'
import StarRating from '@/components/StarRating.vue'
import TagList from '@/components/TagList.vue'

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
 * Cover, titles, facts and tags of the row under the pointer, `position: fixed` so
 * that where and how big it is gets measured rather than declared.
 *
 * It sits beside the list and is free to use the window's whole height — the list's
 * own top no longer holds it down, because what fills the card is a tag list of any
 * length rather than a cover. As wide as the room beside the list allows, up to
 * `PREVIEW_MAX_WIDTH`; below `PREVIEW_MIN_WIDTH` that room is not worth having, and
 * the card moves against the window's right edge and overlaps the list — the one case
 * where it hides text, and better than running off screen.
 *
 * The width is still capped by that height at the cover's own 5:7, which now only
 * bites in a window under about 490px tall — enough to keep a card there from going
 * wide and letterboxed. `max-height` rather than `height`, so a gallery carrying two
 * tags gets a short card.
 */
const PREVIEW_MAX_WIDTH = 340
const PREVIEW_MIN_WIDTH = 160
const COVER_HEIGHT_OVER_WIDTH = 7 / 5
const GAP = 8

const listEl = ref<HTMLElement | null>(null)
const preview = ref<Edition | null>(null)
const previewStyle = ref<Record<string, string>>({})

/** The row or cover under the pointer, `null` on the way out. */
function showPreview(release: Edition | null): void {
  preview.value = release
  const box = listEl.value?.getBoundingClientRect()
  if (!release || !box) return
  const height = window.innerHeight - GAP * 2
  const beside = box.right + GAP
  const room = window.innerWidth - beside - GAP
  const width = Math.min(PREVIEW_MAX_WIDTH, Math.round(height / COVER_HEIGHT_OVER_WIDTH), Math.max(room, PREVIEW_MIN_WIDTH))
  previewStyle.value = {
    left: `${Math.round(room >= width ? beside : Math.max(GAP, window.innerWidth - width - GAP))}px`,
    top: `${GAP}px`,
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
      <!-- A cell says everything a row says except the name, which is the one thing
           that needs a line of its own; that goes to the preview. Releases of one book
           stay adjacent here because that is the order the books hand them over in,
           but they carry no frame: a grid cell has no room for one. -->
      <div v-if="settings.view === 'covers'" class="ehl-covers">
        <a
          v-for="release in group.books.flatMap((book) => book.releases)"
          :key="release.hit.gid"
          class="ehl-cover"
          :href="release.hit.href"
          target="_blank"
          rel="noopener"
          @mouseenter="showPreview(release)"
          @mouseleave="showPreview(null)"
        >
          <span class="ehl-cover-art">
            <img v-if="release.hit.thumb" :src="release.hit.thumb" loading="lazy" decoding="async" fetchpriority="low" referrerpolicy="no-referrer" alt="" />
          </span>
          <span class="ehl-facts">
            <StarRating v-if="release.hit.rating !== null" :rating="release.hit.rating" />
            <span v-if="showScore" class="ehl-meta">{{ percent(release.score) }}</span>
            <span v-if="release.hit.pages !== null" class="ehl-meta">{{ release.hit.pages }}{{ t('pages') }}</span>
            <span v-for="flag in release.flags" :key="flag" class="ehl-flag">{{ t(FLAG_LABELS[flag]) }}</span>
          </span>
        </a>
      </div>
      <ul v-else>
        <li
          v-for="(book, index) in group.books"
          :key="book.releases[0].hit.gid"
          :class="framed(book) ? `ehl-book ehl-book--${index % BOOK_COLOURS}` : 'ehl-books'"
        >
          <ul>
            <li v-for="release in book.releases" :key="release.hit.gid" class="ehl-row" @mouseenter="showPreview(release)" @mouseleave="showPreview(null)">
              <!-- One link over the whole row: a reader aiming at the rating or the page
                   count is aiming at the gallery, and a row that only answers on its title
                   line reads as if the rest belongs to something else. The price is that
                   nothing interactive may sit inside, which is what the torrent link was. -->
              <a class="ehl-rowlink" :href="release.hit.href" target="_blank" rel="noopener">
                <!-- The panel is `display: none` until its unit opens, so `lazy` asks for
                     nothing until a reader has actually opened it and scrolled the row into
                     view. The preview beside the list reads this same URL out of the HTTP
                     cache, which is why hovering shows a cover rather than an empty frame. -->
                <span class="ehl-thumb">
                  <img v-if="release.hit.thumb" :src="release.hit.thumb" loading="lazy" decoding="async" fetchpriority="low" referrerpolicy="no-referrer" alt="" />
                </span>
                <span class="ehl-rowtext">
                  <span class="ehl-title">
                    {{ displayTitle(release.hit) }}
                    <span v-if="subtitle(release.hit)" class="ehl-subtitle">{{ subtitle(release.hit) }}</span>
                  </span>
                  <span class="ehl-facts">
                    <StarRating v-if="release.hit.rating !== null" :rating="release.hit.rating" />
                    <span v-if="showScore" class="ehl-meta">{{ percent(release.score) }}</span>
                    <span v-if="release.hit.pages !== null" class="ehl-meta">{{ release.hit.pages }}{{ t('pages') }}</span>
                    <span v-for="flag in release.flags" :key="flag" class="ehl-flag">{{ t(FLAG_LABELS[flag]) }}</span>
                  </span>
                </span>
              </a>
            </li>
          </ul>
        </li>
      </ul>
    </section>
    <!-- One preview for both views, pinned to the viewport so it stays in one place
         while the list scrolls under the pointer. It names the gallery, which is what
         a cover on its own cannot. -->
    <div v-if="preview" class="ehl-preview" :style="previewStyle">
      <img v-if="preview.hit.thumb" :src="preview.hit.thumb" alt="" referrerpolicy="no-referrer" />
      <div class="ehl-preview-text">
        <span class="ehl-preview-title">{{ displayTitle(preview.hit) }}</span>
        <!-- Both titles whatever the list setting says: the preview is where a reader
             goes to be sure which book this is, and the other field is what separates
             two releases whose work text reads the same. -->
        <span v-if="otherTitle(preview.hit)" class="ehl-subtitle">{{ otherTitle(preview.hit) }}</span>
        <span class="ehl-facts">
          <StarRating v-if="preview.hit.rating !== null" :rating="preview.hit.rating" />
          <span v-for="flag in preview.flags" :key="flag" class="ehl-flag">{{ t(FLAG_LABELS[flag]) }}</span>
        </span>
        <TagList v-if="preview.hit.tags.length > 0" :tags="preview.hit.tags" />
      </div>
    </div>
  </div>
</template>
