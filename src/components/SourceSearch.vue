<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronDown, Eye, LoaderCircle, Trash2, X } from '@lucide/vue'
import { t, type MessageKey } from '@/i18n'
import type { SourceGallery } from '@/core/eh/galleryPage'
import { citeOrigin } from '@/core/source/googleResults'
import type { PreviewAnswer } from '@/core/source/preview'
import { googleSearchUrl, SEARCH_SITES } from '@/core/source/sites'
import { googleQuery, searchTerms, type SearchTerm, type TermKind } from '@/core/source/terms'
import { previewGoogle } from '@/services/googlePreview'
import SiteIcon from './SiteIcon.vue'

const props = defineProps<{ source: SourceGallery }>()
const emit = defineEmits<{ close: [] }>()

const KIND_LABEL: Record<TermKind, MessageKey> = {
  work: 'termWork',
  circle: 'termCircle',
  artist: 'termArtist',
}
const KINDS: readonly TermKind[] = ['work', 'circle', 'artist']

const terms = ref<SearchTerm[]>(searchTerms(props.source))

const rows = computed(() =>
  terms.value.map((term, index) => ({
    index,
    term,
    links: term.text.trim() ? SEARCH_SITES.map((site) => ({ site, url: site.url(term) })) : [],
  })),
)

function setText(index: number, event: Event): void {
  terms.value[index].text = (event.target as HTMLInputElement).value.trim()
}

/** The whole title as one Google search, previewed here a page at a time. */
const query = ref(googleQuery(props.source))

type Page = { state: 'loading' } | { state: 'timeout' } | ({ state: 'answered' } & PreviewAnswer)
/** Pages fetched so far for `query`, in order; a new query starts over. */
const pages = ref<Page[]>([])

const PAGE_STATUS: Record<'timeout' | 'empty' | 'blocked' | 'unavailable', MessageKey> = {
  timeout: 'previewTimeout',
  empty: 'previewEmpty',
  blocked: 'previewBlocked',
  unavailable: 'previewUnavailable',
}

/** The line to show instead of a page's results, or null when it has results to list. */
function pageNote(page: Page): MessageKey | null {
  if (page.state === 'loading') return 'previewLoading'
  if (page.state === 'timeout') return PAGE_STATUS.timeout
  return page.status === 'ok' ? null : PAGE_STATUS[page.status]
}

const loading = computed(() => pages.value.some((page) => page.state === 'loading'))

/** Another page is worth asking for only after a page that had results. */
const canPageOn = computed(() => {
  const last = pages.value.at(-1)
  return last?.state === 'answered' && last.status === 'ok'
})

function setQuery(event: Event): void {
  query.value = (event.target as HTMLInputElement).value.trim()
  pages.value = []
}

/** Fetch the page after the last one shown; the first press fetches the first page. */
async function fetchPage(): Promise<void> {
  const index = pages.value.length
  pages.value.push({ state: 'loading' })
  const answer = await previewGoogle(googleSearchUrl(query.value, index))
  pages.value[index] = answer ? { state: 'answered', ...answer } : { state: 'timeout' }
}

function previewFirstPage(): void {
  pages.value = []
  void fetchPage()
}
</script>

<template>
  <div class="ehl-source" translate="no">
    <header class="ehl-source__header">
      <span>{{ t('sourceSearch') }}</span>
      <button type="button" class="ehl-source__icon" :title="t('close')" @click="emit('close')">
        <X :size="14" aria-hidden="true" />
      </button>
    </header>
    <section class="ehl-source__google">
      <div class="ehl-source__term">
        <span class="ehl-source__kind">Google</span>
        <input class="ehl-source__input" :value="query" @change="setQuery($event)" />
      </div>
      <div class="ehl-source__preview">
        <a :href="googleSearchUrl(query)" target="_blank" rel="noopener"><SiteIcon :href="googleSearchUrl(query)" />Google</a>
        <button type="button" class="ehl-source__chip" :disabled="loading" @click="previewFirstPage()">
          <Eye :size="11" aria-hidden="true" />
          {{ t('previewGoogle') }}
        </button>
      </div>
      <div v-for="(page, index) in pages" :key="index" class="ehl-source__page">
        <h4 v-if="index > 0" class="ehl-source__page-head">{{ t('previewPage').replace('{n}', String(index + 1)) }}</h4>
        <p v-if="pageNote(page)" class="ehl-source__note">
          <LoaderCircle v-if="page.state === 'loading'" :size="11" class="ehl-source__spin" aria-hidden="true" />
          {{ t(pageNote(page)!) }}
        </p>
        <ol v-else-if="page.state === 'answered'" class="ehl-source__results">
          <li v-for="result in page.results" :key="result.href">
            <a :href="result.href" target="_blank" rel="noopener"><SiteIcon v-if="citeOrigin(result.cite)" :href="citeOrigin(result.cite)!" />{{ result.title }}</a>
            <span class="ehl-source__cite">{{ result.cite }}</span>
            <span class="ehl-source__snippet">{{ result.snippet }}</span>
          </li>
        </ol>
      </div>
      <button v-if="canPageOn" type="button" class="ehl-source__chip ehl-source__more" :disabled="loading" @click="fetchPage()">
        <ChevronDown :size="11" aria-hidden="true" />
        {{ t('previewNextPage') }}
      </button>
    </section>
    <div v-for="row in rows" :key="row.index" class="ehl-source__row">
      <div class="ehl-source__term">
        <span class="ehl-source__kind">{{ t(KIND_LABEL[row.term.kind]) }}</span>
        <input class="ehl-source__input" :value="row.term.text" @change="setText(row.index, $event)" />
        <button type="button" class="ehl-source__icon" :title="t('termRemove')" @click="terms.splice(row.index, 1)">
          <Trash2 :size="12" aria-hidden="true" />
        </button>
      </div>
      <ul class="ehl-source__links">
        <li v-for="link in row.links" :key="link.site.id">
          <a :href="link.url" target="_blank" rel="noopener"><SiteIcon :href="link.url" />{{ link.site.name }}</a>
        </li>
      </ul>
    </div>
    <div class="ehl-source__add">
      <span>{{ t('termAdd') }}</span>
      <button v-for="kind in KINDS" :key="kind" type="button" class="ehl-source__chip" @click="terms.push({ kind, text: '' })">{{ t(KIND_LABEL[kind]) }}</button>
    </div>
  </div>
</template>

<style>
/* Hangs under its bar button like the settings popup, kept to the right edge of
   the column; it scrolls once the Google pages outgrow the screen. Long enough
   to reach the ad slot under `.gm`, whose iframe (`#pdapap`) is
   `position: relative; z-index: 260` (observed 2026-10). */
.ehl-source {
  position: absolute;
  top: 100%;
  right: var(--ehl-inset, 0);
  width: min(640px, calc(100vw - 40px));
  max-height: 70vh;
  overflow-y: auto;
  margin: 0;
  padding: 6px 10px 8px;
  box-sizing: border-box;
  font-size: 12px;
  font-weight: 400;
  text-align: left;
  background: var(--ehl-bg, #fff);
  border: 1px solid var(--ehl-border, currentColor);
  border-radius: 0 0 9px 9px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.25);
  z-index: 300;
}
.ehl-source__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
  font-weight: 700;
}
.ehl-source__row + .ehl-source__row {
  margin-top: 6px;
}
.ehl-source__term {
  display: flex;
  align-items: center;
  gap: 6px;
}
.ehl-source__kind {
  flex-shrink: 0;
  min-width: 5em;
  font-weight: 700;
}
.ehl-source__input {
  flex: 1;
  min-width: 0;
  font: inherit;
}
.ehl-source__links {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 12px;
  margin: 3px 0 0;
  padding: 0 0 0 calc(5em + 6px);
  list-style: none;
}
.ehl-source__links a {
  font-weight: 700;
  text-decoration: none;
}
.ehl-source__add {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
}
.ehl-source__icon,
.ehl-source__chip {
  display: inline-flex;
  align-items: center;
  margin: 0;
  padding: 1px 3px;
  font: inherit;
  color: inherit;
  background: none;
  border: 0;
  cursor: pointer;
  opacity: 0.7;
}
.ehl-source__chip {
  padding: 0 6px;
  border: 1px solid currentColor;
  border-radius: 3px;
}
.ehl-source__icon:hover,
.ehl-source__chip:hover {
  opacity: 1;
}
.ehl-source__google {
  padding-bottom: 8px;
  margin-bottom: 6px;
  border-bottom: 1px dashed var(--ehl-border, currentColor);
}
.ehl-source__preview {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 4px 0 0 calc(5em + 6px);
}
.ehl-source__preview a {
  font-weight: 700;
  text-decoration: none;
}
.ehl-source__page {
  margin-left: calc(5em + 6px);
}
.ehl-source__page-head {
  margin: 6px 0 0;
  font-size: 11px;
  font-weight: 700;
  opacity: 0.7;
}
.ehl-source__more {
  margin: 6px 0 0 calc(5em + 6px);
}
.ehl-source__chip:disabled {
  cursor: default;
}
.ehl-source__spin {
  animation: ehl-source-spin 1s linear infinite;
}
@keyframes ehl-source-spin {
  to {
    transform: rotate(360deg);
  }
}
.ehl-source__note {
  margin: 4px 0 0;
  opacity: 0.7;
}
.ehl-source__results {
  margin: 4px 0 0;
  padding: 0;
  list-style: none;
}
.ehl-source__results li {
  display: flex;
  flex-direction: column;
  padding: 3px 0;
}
.ehl-source__results li + li {
  border-top: 1px dashed currentColor;
  border-top-color: color-mix(in srgb, currentColor 25%, transparent);
}
.ehl-source__results a {
  font-weight: 700;
  text-decoration: none;
}
.ehl-source__cite {
  font-size: 8pt;
  opacity: 0.7;
}
/* Two lines of the snippet are enough to tell a store page from a forum thread. */
.ehl-source__snippet {
  display: -webkit-box;
  overflow: hidden;
  font-size: 8pt;
  opacity: 0.85;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
</style>
