<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Eye, LoaderCircle, Trash2, X } from '@lucide/vue'
import { t, type MessageKey } from '@/i18n'
import type { SourceGallery } from '@/core/eh/galleryPage'
import { citeOrigin } from '@/core/source/googleResults'
import type { PreviewAnswer } from '@/core/source/preview'
import { GOOGLE, SEARCH_SITES } from '@/core/source/sites'
import { searchTerms, type SearchTerm, type TermKind } from '@/core/source/terms'
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
    google: term.text.trim() ? GOOGLE.url(term) : null,
  })),
)

function setText(index: number, event: Event): void {
  terms.value[index].text = (event.target as HTMLInputElement).value.trim()
}

/** A preview per Google search URL, so editing a term back to an earlier text shows that text's results again. */
type Preview = { state: 'loading' } | { state: 'timeout' } | ({ state: 'answered' } & PreviewAnswer)
const previews = reactive<Record<string, Preview>>({})

const PREVIEW_STATUS: Record<'timeout' | 'empty' | 'blocked' | 'unavailable', MessageKey> = {
  timeout: 'previewTimeout',
  empty: 'previewEmpty',
  blocked: 'previewBlocked',
  unavailable: 'previewUnavailable',
}

/** The line to show instead of results, or null when there are results to list. */
function previewNote(preview: Preview): MessageKey | null {
  if (preview.state === 'loading') return 'previewLoading'
  if (preview.state === 'timeout') return PREVIEW_STATUS.timeout
  return preview.status === 'ok' ? null : PREVIEW_STATUS[preview.status]
}

async function preview(url: string): Promise<void> {
  previews[url] = { state: 'loading' }
  const answer = await previewGoogle(url)
  previews[url] = answer ? { state: 'answered', ...answer } : { state: 'timeout' }
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
      <div v-if="row.google" class="ehl-source__preview">
        <button type="button" class="ehl-source__chip" :disabled="previews[row.google]?.state === 'loading'" @click="preview(row.google)">
          <LoaderCircle v-if="previews[row.google]?.state === 'loading'" :size="11" class="ehl-source__spin" aria-hidden="true" />
          <Eye v-else :size="11" aria-hidden="true" />
          {{ t('previewGoogle') }}
        </button>
        <template v-if="previews[row.google]">
          <p v-if="previewNote(previews[row.google])" class="ehl-source__note">{{ t(previewNote(previews[row.google])!) }}</p>
          <ol v-else-if="previews[row.google].state === 'answered'" class="ehl-source__results">
            <li v-for="result in (previews[row.google] as PreviewAnswer).results" :key="result.href">
              <a :href="result.href" target="_blank" rel="noopener"><SiteIcon v-if="citeOrigin(result.cite)" :href="citeOrigin(result.cite)!" />{{ result.title }}</a>
              <span class="ehl-source__cite">{{ result.cite }}</span>
              <span class="ehl-source__snippet">{{ result.snippet }}</span>
            </li>
          </ol>
        </template>
      </div>
    </div>
    <div class="ehl-source__add">
      <span>{{ t('termAdd') }}</span>
      <button v-for="kind in KINDS" :key="kind" type="button" class="ehl-source__chip" @click="terms.push({ kind, text: '' })">{{ t(KIND_LABEL[kind]) }}</button>
    </div>
  </div>
</template>

<style>
/* Hangs under its bar button like the settings popup, kept to the right edge of
   the column; tall enough for three terms with a page of results each before
   it scrolls. Long enough to reach the ad slot under `.gm`, whose iframe
   (`#pdapap`) is `position: relative; z-index: 260` (observed 2026-10). */
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
.ehl-source__preview {
  margin: 4px 0 0 calc(5em + 6px);
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
