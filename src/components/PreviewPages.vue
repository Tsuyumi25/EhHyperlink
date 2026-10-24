<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ResultThumb from './ResultThumb.vue'
import { ChevronDown, LoaderCircle } from '@lucide/vue'
import CopyLinkButton from './CopyLinkButton.vue'
import { t, type MessageKey } from '@/i18n'
import type { PreviewAnswer } from '@/core/source/preview'
import { previewPage } from '@/services/preview'
import { previewSiteFor } from '@/services/previewSites'
import SiteIcon from './SiteIcon.vue'
import MarkedText from './MarkedText.vue'

/** Page 1 of a search. Shown only once the reader asks for the preview, so it fetches page 1 right away. */
const props = defineProps<{ url: string; words: readonly string[] }>()
/** How the search is going, for the site list beside it: still loading, and how many results so far. */
const emit = defineEmits<{ progress: [loading: boolean, count: number] }>()

const site = computed(() => previewSiteFor(new URL(props.url)))

type Page = { state: 'loading' } | { state: 'timeout' } | ({ state: 'answered' } & PreviewAnswer)
/** Pages fetched so far for `url`, in order; another search starts over. */
const pages = ref<Page[]>([])

const PAGE_STATUS: Record<'timeout' | 'empty' | 'blocked' | 'unreadable' | 'unavailable' | 'closed', MessageKey> = {
  timeout: 'previewTimeout',
  empty: 'previewEmpty',
  blocked: 'previewBlocked',
  unreadable: 'previewUnreadable',
  unavailable: 'previewUnavailable',
  closed: 'previewClosed',
}

/** The line to show instead of a page's results, or null when it has results to list. */
function pageNote(page: Page): MessageKey | null {
  if (page.state === 'loading') return 'previewLoading'
  if (page.state === 'timeout') return PAGE_STATUS.timeout
  return page.status === 'ok' ? null : PAGE_STATUS[page.status]
}

const loading = computed(() => pages.value.some((page) => page.state === 'loading'))
const count = computed(() => pages.value.reduce((total, page) => total + (page.state === 'answered' ? page.results.length : 0), 0))
watch([loading, count], () => emit('progress', loading.value, count.value), { immediate: true })

/**
 * How a page lays its results out: creators with their latest works as rows,
 * works with covers as a grid of cards, text results as a list.
 */
function layoutOf(page: PreviewAnswer): 'rows' | 'grid' | 'list' {
  if (page.results.some((result) => result.works.length > 0)) return 'rows'
  if (page.results.some((result) => result.thumb !== null)) return 'grid'
  return 'list'
}

function isFollowedByMore(page: Page | undefined): boolean {
  return page?.state === 'answered' && page.status === 'ok' && page.last !== true
}

/** Another page is worth asking for only after a page that had results and, where the site says so, has a page after it. */
const canPageOn = computed(() => isFollowedByMore(pages.value.at(-1)))

/** Fetch the page after the last one shown; the first press fetches the first page. */
async function fetchPage(): Promise<void> {
  const target = site.value
  if (!target) return
  const index = pages.value.length
  pages.value.push({ state: 'loading' })
  const answer = await previewPage(target, target.pageUrl(props.url, index))
  pages.value[index] = answer ? { state: 'answered', ...answer } : { state: 'timeout' }
}

function previewFirstPage(): void {
  pages.value = []
  void fetchPage()
}

// An edited term is another search: start it over from its first page.
watch(() => props.url, previewFirstPage)
previewFirstPage()
</script>

<template>
  <div v-if="site" class="ehl-pages">
    <div v-for="(page, index) in pages" :key="index" class="ehl-pages__page" :class="{ 'ehl-pages__page--note': index === 0 && pageNote(page) !== null }">
      <h4 v-if="index > 0" class="ehl-pages__page-head">{{ t('previewPage').replace('{n}', String(index + 1)) }}</h4>
      <p v-if="pageNote(page)" class="ehl-pages__note">
        <LoaderCircle v-if="page.state === 'loading'" :size="11" class="ehl-pages__spin" aria-hidden="true" />
        {{ t(pageNote(page)!) }}
      </p>
      <ol v-else-if="page.state === 'answered'" class="ehl-pages__results" :class="`ehl-pages__results--${layoutOf(page)}`">
        <li v-for="result in page.results" :key="result.href">
          <CopyLinkButton :href="result.href" label="copyResultLink" />
          <a v-if="result.thumb" class="ehl-pages__thumb" :href="result.href" target="_blank" rel="noopener" tabindex="-1"><ResultThumb :url="result.thumb" /></a>
          <div class="ehl-pages__text">
            <a class="ehl-pages__title" :href="result.href" target="_blank" rel="noopener">
              <img v-if="result.icon" class="ehl-favicon" :src="result.icon" alt="" />
              <SiteIcon v-else-if="result.origin" :href="result.origin" /><MarkedText :text="result.title" :words="words" />
            </a>
            <span v-if="result.byline" class="ehl-pages__byline"><MarkedText :text="result.byline" :words="words" /></span>
            <span v-if="result.snippet" class="ehl-pages__snippet"><MarkedText :text="result.snippet" :words="words" /></span>
          </div>
          <ul v-if="result.works.length > 0" class="ehl-pages__works">
            <li v-for="work in result.works" :key="work.href">
              <a :href="work.href" :title="work.title" target="_blank" rel="noopener"><ResultThumb :url="work.thumb" /></a>
            </li>
          </ul>
        </li>
      </ol>
    </div>
    <button v-if="canPageOn" type="button" class="ehl-pages__more" :disabled="loading" @click="fetchPage()">
      <ChevronDown :size="11" aria-hidden="true" />
      {{ t('previewNextPage') }}
    </button>
  </div>
</template>

<style>
.ehl-pages__page-head {
  margin: 6px 0 0;
  font-size: 11px;
  font-weight: 700;
  opacity: 0.7;
}
.ehl-pages__spin {
  animation: ehl-pages-spin 1s linear infinite;
}
@keyframes ehl-pages-spin {
  to {
    transform: rotate(360deg);
  }
}
.ehl-pages__note {
  margin: 4px 0 0;
  opacity: 0.7;
}
.ehl-pages__results {
  margin: 4px 0 0;
  padding: 0;
  list-style: none;
}
.ehl-pages__results > li {
  display: flex;
  flex-direction: column;
  padding: 3px 0;
}
.ehl-pages__results > li + li {
  border-top: 1px dashed color-mix(in srgb, currentColor 25%, transparent);
}
.ehl-pages__results a {
  font-weight: 700;
  text-decoration: none;
}
.ehl-pages__results > li {
  position: relative;
}
/* The copy button shows on the result the pointer is on, as on the gallery rows. */
.ehl-pages__results > li:hover > .ehl-copy {
  opacity: 0.8;
}
/* A result laid out as a row ends in a square copy button as tall as the row.
   Pinned by top and bottom: an absolutely positioned box with both gets a
   definite height for aspect-ratio to turn into a width, which a stretched flex
   item does not (it stayed 14px wide). A card keeps the gallery's corner
   button over its cover. */
.ehl-pages__results--list > li > .ehl-copy,
.ehl-pages__results--rows > li > .ehl-copy {
  top: 0;
  right: 0;
  bottom: 0;
  width: auto;
  height: auto;
  aspect-ratio: 1;
}
.ehl-pages__text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
/* Covers small enough for a row of six or more across the view. */
.ehl-pages__results--grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 104px);
  gap: 8px;
}
.ehl-pages__results--grid > li {
  gap: 2px;
  padding: 0;
  font-size: 11px;
}
.ehl-pages__results--grid > li + li {
  border-top: 0;
}
/* Card titles are long store titles; two lines tell two works apart. */
.ehl-pages__results--grid .ehl-pages__title {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
/* A creator per row: avatar, name, then a strip of their latest works. */
.ehl-pages__results--rows > li {
  flex-direction: row;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
}
.ehl-pages__results--rows .ehl-pages__thumb {
  flex: 0 0 48px;
}
.ehl-pages__results--rows .ehl-pages__thumb .ehl-thumb {
  border-radius: 50%;
}
.ehl-pages__results--rows .ehl-pages__text {
  flex: 0 0 140px;
}
.ehl-pages__works {
  display: flex;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.ehl-pages__works li {
  flex: 0 0 72px;
}
.ehl-pages__byline {
  font-size: 8pt;
  opacity: 0.7;
}
/* Two lines of the snippet are enough to tell a store page from a forum thread. */
.ehl-pages__snippet {
  display: -webkit-box;
  overflow: hidden;
  font-size: 8pt;
  opacity: 0.85;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.ehl-pages__more {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin: 6px 0 0;
  padding: 0 6px;
  font: inherit;
  font-size: 11px;
  color: inherit;
  background: none;
  border: 1px solid currentColor;
  border-radius: 3px;
  cursor: pointer;
  opacity: 0.7;
}
.ehl-pages__more:hover {
  opacity: 1;
}
.ehl-pages__more:disabled {
  cursor: default;
}
</style>
