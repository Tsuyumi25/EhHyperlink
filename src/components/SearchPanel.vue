<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { LoaderCircle, ScrollText, X } from '@lucide/vue'
import { settings } from '@/settings'
import DebugLog from './DebugLog.vue'
import { t, type MessageKey } from '@/i18n'
import type { SourceGallery } from '@/core/eh/galleryPage'
import { searchRecipe, type RecipeSearch, type RecipeSiteId } from '@/core/source/recipe'
import { matchWords } from '@/core/source/highlight'
import { searchTerms } from '@/core/source/terms'
import PreviewPages from './PreviewPages.vue'
import SiteIcon from './SiteIcon.vue'

/** Mounted only when the reader presses the button: every search below starts right away. */
const props = defineProps<{ source: SourceGallery }>()
const emit = defineEmits<{ close: [] }>()

const SITE_NAME: Record<RecipeSiteId, string> = { google: 'Google', googleJp: 'Google .jp', duckduckgo: 'DuckDuckGo', dlsite: 'DLsite', pixiv: 'pixiv' }
const KIND_LABEL: Record<RecipeSearch['kind'], MessageKey> = {
  title: 'termTitle',
  work: 'termWork',
  circle: 'termCircle',
  artist: 'termArtist',
}

const recipe = searchRecipe(props.source)
/** Every result marks this gallery's work, circle and artist names wherever they appear, whichever search found it. */
const words = matchWords(searchTerms(props.source).map((term) => term.text))
const sites = (['google', 'googleJp', 'duckduckgo', 'dlsite', 'pixiv'] as const)
  .map((id) => ({ id, name: SITE_NAME[id], searches: recipe.filter((search) => search.site === id) }))
  .filter((site) => site.searches.length > 0)

const selected = ref<RecipeSiteId | 'log' | null>(sites[0]?.id ?? null)

/** Each search's progress, by URL, as its result list reports it. */
const progress = reactive<Record<string, { loading: boolean; count: number }>>({})

/** What the site list shows beside a site: a spinner while any of its searches loads, then how many results came back. */
const siteState = computed(() =>
  Object.fromEntries(
    sites.map((site) => {
      const states = site.searches.map((search) => progress[search.url])
      return [site.id, { loading: states.some((state) => state?.loading !== false), count: states.reduce((total, state) => total + (state?.count ?? 0), 0) }]
    }),
  ),
)
</script>

<template>
  <div class="ehl-search" translate="no">
    <nav class="ehl-search__nav">
      <button
        v-for="site in sites"
        :key="site.id"
        type="button"
        class="ehl-search__site-tab"
        :class="{ 'ehl-search__site-tab--selected': selected === site.id }"
        @click="selected = site.id"
      >
        <SiteIcon :href="site.searches[0].url" />
        <span class="ehl-search__site-name">{{ site.name }}</span>
        <LoaderCircle v-if="siteState[site.id].loading" :size="11" class="ehl-pages__spin" aria-hidden="true" />
        <span v-else class="ehl-search__count">{{ siteState[site.id].count }}</span>
      </button>
      <button
        v-if="settings.debug"
        type="button"
        class="ehl-search__site-tab"
        :class="{ 'ehl-search__site-tab--selected': selected === 'log' }"
        @click="selected = 'log'"
      >
        <ScrollText :size="12" aria-hidden="true" />
        <span class="ehl-search__site-name">{{ t('debugLog') }}</span>
      </button>
      <button type="button" class="ehl-search__close" :title="t('close')" @click="emit('close')">
        <X :size="14" aria-hidden="true" />
      </button>
    </nav>
    <!-- Every site stays mounted, so the searches all run at once and keep their pages when another site is shown. -->
    <section v-for="site in sites" v-show="selected === site.id" :key="site.id" class="ehl-search__content">
      <div v-for="search in site.searches" :key="search.url" class="ehl-search__search">
        <a class="ehl-search__query" :href="search.url" target="_blank" rel="noopener">
          <span class="ehl-search__kind">{{ t(KIND_LABEL[search.kind]) }}</span>{{ search.text }}
        </a>
        <PreviewPages :url="search.url" :words="words" @progress="(loading, count) => (progress[search.url] = { loading, count })" />
      </div>
    </section>
    <section v-if="settings.debug && selected === 'log'" class="ehl-search__content">
      <DebugLog />
    </section>
  </div>
</template>

<style>
/* Takes the place of `.gm` while it is open (App.vue hides `.gm`): the same
   column, frame and corners, and as tall as its results need. */
.ehl-search {
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr);
  min-height: 330px;
  box-sizing: border-box;
  font-size: 12px;
  font-weight: 400;
  text-align: left;
  background: var(--ehl-bg, #fff);
  border: 1px solid var(--ehl-border, currentColor);
  border-radius: 9px;
}
.ehl-search__nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 6px;
  border-right: 1px solid var(--ehl-border, currentColor);
}
.ehl-search__site-tab {
  display: flex;
  align-items: center;
  gap: 2px;
  margin: 0;
  padding: 5px 6px;
  font: inherit;
  font-weight: 700;
  color: inherit;
  text-align: left;
  background: none;
  border: 0;
  border-radius: 5px;
  cursor: pointer;
  opacity: 0.7;
}
.ehl-search__site-tab:hover {
  opacity: 1;
}
.ehl-search__site-tab--selected {
  opacity: 1;
  background: color-mix(in srgb, currentColor 12%, transparent);
}
.ehl-search__site-name {
  flex: 1;
}
.ehl-search__count {
  font-size: 10px;
  opacity: 0.7;
}
.ehl-search__close {
  align-self: flex-start;
  display: inline-flex;
  margin: auto 0 0;
  padding: 4px 6px;
  color: inherit;
  background: none;
  border: 0;
  cursor: pointer;
  opacity: 0.7;
}
.ehl-search__close:hover {
  opacity: 1;
}
.ehl-search__content {
  min-width: 0;
  padding: 8px 12px 12px;
}
.ehl-search__search {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  column-gap: 10px;
}
/* The result pages flow beside the query: a first page that is only a line
   ("no results", "loading") stays on the query's line, a page of results
   takes a line of its own below it. */
.ehl-search__search > .ehl-pages {
  display: contents;
}
.ehl-search__search .ehl-pages__page {
  flex: 1 0 100%;
  min-width: 0;
}
.ehl-search__search .ehl-pages__page--note {
  flex: 0 1 auto;
}
.ehl-search__search .ehl-pages__page--note .ehl-pages__note {
  margin: 0;
}
.ehl-search__search + .ehl-search__search {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed var(--ehl-border, currentColor);
}
.ehl-search__query {
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
}
.ehl-search__kind {
  display: inline-block;
  margin-right: 6px;
  padding: 0 4px;
  font-size: 10px;
  font-weight: 700;
  border: 1px solid currentColor;
  border-radius: 3px;
  opacity: 0.7;
}
</style>
