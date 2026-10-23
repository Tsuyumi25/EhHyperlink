<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ChevronDown, LoaderCircle } from '@lucide/vue'
import { t, type MessageKey } from '@/i18n'
import type { PreviewAnswer } from '@/core/source/preview'
import { previewPage } from '@/services/preview'
import { previewSiteFor } from '@/services/previewSites'
import SiteIcon from './SiteIcon.vue'

/** Page 1 of a search. Shown only once the reader asks for the preview, so it fetches page 1 right away. */
const props = defineProps<{ url: string }>()

const site = computed(() => previewSiteFor(new URL(props.url)))

type Page = { state: 'loading' } | { state: 'timeout' } | ({ state: 'answered' } & PreviewAnswer)
/** Pages fetched so far for `url`, in order; another search starts over. */
const pages = ref<Page[]>([])

const PAGE_STATUS: Record<'timeout' | 'empty' | 'blocked' | 'unreadable' | 'unavailable', MessageKey> = {
  timeout: 'previewTimeout',
  empty: 'previewEmpty',
  blocked: 'previewBlocked',
  unreadable: 'previewUnreadable',
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
    <div v-for="(page, index) in pages" :key="index" class="ehl-pages__page">
      <h4 v-if="index > 0" class="ehl-pages__page-head">{{ t('previewPage').replace('{n}', String(index + 1)) }}</h4>
      <p v-if="pageNote(page)" class="ehl-pages__note">
        <LoaderCircle v-if="page.state === 'loading'" :size="11" class="ehl-pages__spin" aria-hidden="true" />
        {{ t(pageNote(page)!) }}
      </p>
      <ol v-else-if="page.state === 'answered'" class="ehl-pages__results">
        <li v-for="result in page.results" :key="result.href">
          <a :href="result.href" target="_blank" rel="noopener"><SiteIcon v-if="result.origin" :href="result.origin" />{{ result.title }}</a>
          <span v-if="result.byline" class="ehl-pages__byline">{{ result.byline }}</span>
          <span v-if="result.snippet" class="ehl-pages__snippet">{{ result.snippet }}</span>
        </li>
      </ol>
    </div>
    <button v-if="canPageOn" type="button" class="ehl-source__chip ehl-pages__more" :disabled="loading" @click="fetchPage()">
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
.ehl-pages__results li {
  display: flex;
  flex-direction: column;
  padding: 3px 0;
}
.ehl-pages__results li + li {
  border-top: 1px dashed color-mix(in srgb, currentColor 25%, transparent);
}
.ehl-pages__results a {
  font-weight: 700;
  text-decoration: none;
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
  margin-top: 6px;
}
.ehl-pages__more:disabled {
  cursor: default;
}
</style>
