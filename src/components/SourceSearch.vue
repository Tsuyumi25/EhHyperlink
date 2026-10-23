<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Eye, Trash2, X } from '@lucide/vue'
import { t, type MessageKey } from '@/i18n'
import type { SourceGallery } from '@/core/eh/galleryPage'
import { googleSearchUrl } from '@/core/source/google'
import { SEARCH_SITES } from '@/core/source/sites'
import { googleQuery, searchTerms, type SearchTerm, type TermKind } from '@/core/source/terms'
import { previewSiteFor } from '@/services/previewSites'
import PreviewPages from './PreviewPages.vue'
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

/** Whether the popup can preview this link's results in place. */
function previewable(url: string): boolean {
  return previewSiteFor(new URL(url)) !== null
}

const rows = computed(() =>
  terms.value.map((term, index) => ({
    key: `term-${index}`,
    index,
    term,
    links: term.text.trim() ? SEARCH_SITES.map((site) => ({ site, url: site.url(term), previewable: previewable(site.url(term)) })) : [],
  })),
)

function setText(index: number, event: Event): void {
  terms.value[index].text = (event.target as HTMLInputElement).value.trim()
  opened[`term-${index}`] = undefined
}

/** Rows are keyed by position, so removing one closes every term preview rather than moving it to a neighbour. */
function removeTerm(index: number): void {
  terms.value.splice(index, 1)
  for (const key of Object.keys(opened)) if (key.startsWith('term-')) opened[key] = undefined
}

/** The whole title as one Google search. */
const query = ref(googleQuery(props.source))
const googleUrl = computed(() => googleSearchUrl(query.value))

function setQuery(event: Event): void {
  query.value = (event.target as HTMLInputElement).value.trim()
  if (opened.google) opened.google = googleUrl.value
}

/**
 * The search each row is previewing, if any: one per row, so opening another
 * site's preview on the same term replaces it.
 */
const opened = reactive<Record<string, string | undefined>>({})

function togglePreview(row: string, url: string): void {
  opened[row] = opened[row] === url ? undefined : url
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
      <ul class="ehl-source__links">
        <li>
          <a :href="googleUrl" target="_blank" rel="noopener"><SiteIcon :href="googleUrl" />Google</a>
          <button type="button" class="ehl-source__peek" :class="{ 'ehl-source__peek--open': opened.google === googleUrl }" :title="t('previewPages')" @click="togglePreview('google', googleUrl)">
            <Eye :size="11" aria-hidden="true" />
          </button>
        </li>
      </ul>
      <PreviewPages v-if="opened.google" :key="opened.google" class="ehl-source__previews" :url="opened.google" />
    </section>
    <div v-for="row in rows" :key="row.index" class="ehl-source__row">
      <div class="ehl-source__term">
        <span class="ehl-source__kind">{{ t(KIND_LABEL[row.term.kind]) }}</span>
        <input class="ehl-source__input" :value="row.term.text" @change="setText(row.index, $event)" />
        <button type="button" class="ehl-source__icon" :title="t('termRemove')" @click="removeTerm(row.index)">
          <Trash2 :size="12" aria-hidden="true" />
        </button>
      </div>
      <ul class="ehl-source__links">
        <li v-for="link in row.links" :key="link.site.id">
          <a :href="link.url" target="_blank" rel="noopener"><SiteIcon :href="link.url" />{{ link.site.name }}</a>
          <button
            v-if="link.previewable"
            type="button"
            class="ehl-source__peek"
            :class="{ 'ehl-source__peek--open': opened[row.key] === link.url }"
            :title="t('previewPages')"
            @click="togglePreview(row.key, link.url)"
          >
            <Eye :size="11" aria-hidden="true" />
          </button>
        </li>
      </ul>
      <PreviewPages v-if="opened[row.key]" :key="opened[row.key]" class="ehl-source__previews" :url="opened[row.key]!" />
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
.ehl-source__links li {
  display: inline-flex;
  align-items: center;
  gap: 1px;
}
.ehl-source__peek {
  display: inline-flex;
  align-items: center;
  margin: 0;
  padding: 0 2px;
  color: inherit;
  background: none;
  border: 0;
  border-radius: 3px;
  cursor: pointer;
  opacity: 0.45;
}
.ehl-source__peek:hover,
.ehl-source__peek--open {
  opacity: 1;
}
.ehl-source__peek--open {
  box-shadow: inset 0 -2px 0 currentColor;
}
.ehl-source__previews {
  margin: 4px 0 0 calc(5em + 6px);
}
</style>
