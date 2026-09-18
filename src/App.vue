<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import GroupList from '@/components/GroupList.vue'
import SettingsPopup from '@/components/SettingsPopup.vue'
import { Activity, CircleSlash2, Settings } from '@lucide/vue'
import { locale, t, LANGUAGE_PRIORITY } from '@/i18n'
import { readSourceGallery } from '@/core/eh/galleryPage'
import { findEditions, type EditionGroup, type JumpResult, type MetadataRequest, type SearchRequest } from '@/core/pipeline'
import { displayTitle, subtitle } from '@/settings'

const state = ref<'searching' | 'done' | 'noTitle' | 'failed'>('searching')
const result = ref<JumpResult | null>(null)
/** Tab id whose panel is shown: a hovered list tab previews, a clicked tab stays; one panel at a time. */
const pinned = ref<string | null>(null)
const hovered = ref<string | null>(null)
const open = computed(() => hovered.value ?? pinned.value)

onMounted(async () => {
  const source = readSourceGallery()
  if (!source) {
    state.value = 'noTitle'
    return
  }
  try {
    const found = await findEditions(source, location.origin, LANGUAGE_PRIORITY[locale])
    result.value = found
    state.value = found.plan.editionTerms.length === 0 && found.plan.containerTerms.length === 0 ? 'noTitle' : 'done'
  } catch (error) {
    console.error('[EhHyperlink]', error)
    state.value = 'failed'
  }
})

interface Badge {
  id: string
  label: string
  title: string
  groups: EditionGroup[]
  showScore: boolean
}

/** One badge per meaning; the edition badge reads as the language codes found. */
const badges = computed<Badge[]>(() => {
  if (!result.value) return []
  const list: Badge[] = []
  if (result.value.editions.length > 0) {
    list.push({ id: 'editions', label: result.value.editions.map((group) => group.language.code).join(' · '), title: t('editionsTitle'), groups: result.value.editions, showScore: true })
  }
  if (result.value.series.length > 0) list.push({ id: 'series', label: t('series'), title: t('seriesTitle'), groups: result.value.series, showScore: true })
  if (result.value.chapters.length > 0) list.push({ id: 'chapters', label: t('chapters'), title: t('chaptersTitle'), groups: result.value.chapters, showScore: false })
  return list
})

/** The request panel reads the two kinds apart; each keeps the order they were sent in. */
const requests = computed(() => result.value?.requests ?? [])
const searchRequests = computed(() => requests.value.filter((request): request is SearchRequest => request.kind === 'search'))
const metadataRequests = computed(() => requests.value.filter((request): request is MetadataRequest => request.kind === 'metadata'))

const hasResults = computed(() => badges.value.length > 0 || (result.value?.containers.length ?? 0) > 0)

const status = computed(() => {
  if (state.value === 'searching') return t('searching')
  if (state.value === 'noTitle') return t('noTitle')
  if (state.value === 'failed') return t('failed')
  return hasResults.value ? null : t('notFound')
})

function toggle(id: string): void {
  pinned.value = pinned.value === id ? null : id
}
</script>

<template>
  <div class="ehl-box" translate="no">
    <div class="ehl-tabs">
      <div v-if="result" class="ehl-unit" :class="{ 'ehl-unit--open': open === 'requests' }" @mouseenter="hovered = 'requests'" @mouseleave="hovered = null">
        <button type="button" class="ehl-icon" :class="{ 'ehl-icon--active': open === 'requests' }" :title="requests.length === 0 ? t('noRequests') : t('requestsTitle')" @click="toggle('requests')">
          <CircleSlash2 v-if="requests.length === 0" :size="14" aria-hidden="true" />
          <Activity v-else :size="14" aria-hidden="true" />
        </button>
        <div class="ehl-list">
          <section v-if="searchRequests.length > 0" class="ehl-section">
            <h4 class="ehl-head">{{ t('searchRequests') }}<span class="ehl-count">{{ searchRequests.length }}</span></h4>
            <ul>
              <li v-for="request in searchRequests" :key="request.url">
                <a class="ehl-url" :href="request.url" target="_blank" rel="noopener">
                  "{{ request.term }}"
                  <span class="ehl-subtitle">{{ request.url }}</span>
                </a>
              </li>
            </ul>
          </section>
          <section v-if="metadataRequests.length > 0" class="ehl-section">
            <h4 class="ehl-head">{{ t('metadataRequests') }}<span class="ehl-count">{{ metadataRequests.length }}</span></h4>
            <ul>
              <li v-for="(request, index) in metadataRequests" :key="index">
                <span class="ehl-url">
                  {{ request.galleries }} {{ t('galleriesUnit') }}
                  <span class="ehl-subtitle">{{ request.url }}</span>
                </span>
              </li>
            </ul>
          </section>
          <p v-if="requests.length === 0" class="ehl-head">{{ t('noRequests') }}</p>
        </div>
      </div>
      <span v-if="status" class="ehl-status">{{ status }}</span>
      <template v-if="result">
        <div v-for="badge in badges" :key="badge.id" class="ehl-unit" :class="{ 'ehl-unit--open': open === badge.id }" @mouseenter="hovered = badge.id" @mouseleave="hovered = null">
          <button type="button" class="ehl-badge" :title="badge.title" @click="toggle(badge.id)">{{ badge.label }}</button>
          <GroupList :groups="badge.groups" :show-score="badge.showScore" />
        </div>
        <div v-if="result.containers.length > 0" class="ehl-unit" :class="{ 'ehl-unit--open': open === 'containers' }" @mouseenter="hovered = 'containers'" @mouseleave="hovered = null">
          <button type="button" class="ehl-badge ehl-badge--container" :title="t('containerTitle')" @click="toggle('containers')">{{ t('container') }}</button>
          <div class="ehl-list">
            <ul>
              <li v-for="hit in result.containers" :key="hit.gid">
                <a class="ehl-title" :href="hit.href" target="_blank" rel="noopener">
                  {{ displayTitle(hit) }}
                  <span v-if="subtitle(hit)" class="ehl-subtitle">{{ subtitle(hit) }}</span>
                </a>
                <span v-if="hit.pages !== null" class="ehl-meta">{{ hit.pages }}{{ t('pages') }}</span>
              </li>
            </ul>
          </div>
        </div>
      </template>
      <div class="ehl-unit">
        <button type="button" class="ehl-icon" :class="{ 'ehl-icon--active': pinned === 'settings' }" :title="t('settings')" @click="toggle('settings')">
          <Settings :size="14" aria-hidden="true" />
        </button>
        <SettingsPopup v-if="open === 'settings'" />
      </div>
    </div>
  </div>
</template>

<style>
/* Same column as `.gm` (g.css: min-width 720, max-width 1200, margin auto; narrower
   at the two breakpoints) so the bar lines up with the box below. `.gm`'s own
   top margin moves up here so the bar touches the box; the badges are centred
   to sit close to the title. */
#ehl-app {
  min-width: 720px;
  max-width: 1200px;
  margin: 10px auto 0;
  box-sizing: border-box;
}
#ehl-app + .gm {
  margin-top: 0;
}
@media screen and (max-width: 1230px) {
  #ehl-app {
    max-width: 960px;
  }
}
@media screen and (max-width: 990px) {
  #ehl-app {
    max-width: 720px;
  }
}
/* Positioned so the popovers below centre on the whole column, i.e. on the page. */
.ehl-box {
  position: relative;
  display: flex;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  text-align: left;
}
/* The tab group owns the frame and the `.gm` corner radius; buttons inside only
   draw the separator on their left edge. */
.ehl-tabs {
  display: flex;
  align-items: stretch;
  background: var(--ehl-bg, #fff);
  border: 1px solid var(--ehl-border, currentColor);
  border-bottom: 0;
  border-radius: 9px 9px 0 0;
}
.ehl-status {
  display: flex;
  align-items: center;
  height: 22px;
  padding: 0 8px;
  opacity: 0.7;
  white-space: nowrap;
}
.ehl-unit {
  display: flex;
}
/* Text and icon tabs share one height and centre their content, so the label
   baseline and the glyph line up. */
.ehl-badge,
.ehl-icon {
  display: flex;
  align-items: center;
  height: 22px;
  margin: 0;
  font: inherit;
  line-height: 1;
  color: inherit;
  background: transparent;
  border: 0;
  cursor: pointer;
  white-space: nowrap;
}
.ehl-tabs > :not(:first-child) > .ehl-badge,
.ehl-tabs > :not(:first-child) > .ehl-icon,
.ehl-tabs > :not(:first-child).ehl-status {
  border-left: 1px solid var(--ehl-border, currentColor);
}
.ehl-badge {
  padding: 0 8px;
  font-size: 11px;
  letter-spacing: 0.04em;
}
.ehl-icon {
  padding: 0 6px;
  opacity: 0.6;
}
.ehl-icon:hover,
.ehl-icon--active {
  opacity: 1;
}
/* The list stays a DOM child of its unit, so moving the pointer from the badge
   down into it keeps the unit hovered; visually it hangs centred under the bar.
   It overlaps the top of `.gm`, whose columns are stacking contexts of their own
   (`#gleft` 1, `#gmid` / `#gd2` 2, ehs `#gright` 3), so it needs a higher index. */
.ehl-list {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  width: max-content;
  margin: 0 auto;
  padding: 4px 10px 8px;
  white-space: nowrap;
  background: var(--ehl-bg, #fff);
  border: 1px solid var(--ehl-border, currentColor);
  border-radius: 0 0 9px 9px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.25);
  z-index: 10;
}
.ehl-unit--open .ehl-list {
  display: block;
}
.ehl-section + .ehl-section {
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px dashed var(--ehl-border, currentColor);
}
.ehl-head {
  margin: 0 0 2px;
  font-size: 11px;
  font-weight: 700;
  line-height: 18px;
}
.ehl-code {
  display: inline-block;
  min-width: 22px;
  margin-right: 4px;
  padding: 0 4px;
  text-align: center;
  border: 1px solid currentColor;
  border-radius: 3px;
}
.ehl-count {
  margin-left: 4px;
  font-weight: 400;
  opacity: 0.7;
}
.ehl-list ul {
  margin: 0;
  padding: 0;
  list-style: none;
}
/* Row items align on the main title's baseline; the subtitle is a second line
   inside the same link, so the metadata stays beside the first line. */
.ehl-list li {
  display: flex;
  align-items: baseline;
  padding: 2px 0;
}
/* Releases of one book sit inside a frame. The colour cycles so two books next
   to each other never share one; mid-saturation hues read on both the light and
   the dark site. */
.ehl-book {
  display: block;
  margin: 4px 0;
  padding: 0 5px 0 0;
  border: 1px solid var(--ehl-book);
  border-left-width: 3px;
  border-radius: 3px;
  background: color-mix(in srgb, var(--ehl-book) 14%, transparent);
}
/* `.ehl-list ul` zeroes padding for the flat lists; the framed one needs its own,
   or the rows sit against the coloured border. */
.ehl-book ul {
  padding-left: 8px;
}
.ehl-book--0 {
  --ehl-book: hsl(205 65% 55%);
}
.ehl-book--1 {
  --ehl-book: hsl(145 50% 48%);
}
.ehl-book--2 {
  --ehl-book: hsl(32 75% 55%);
}
.ehl-book--3 {
  --ehl-book: hsl(285 50% 62%);
}
.ehl-box a {
  text-decoration: none;
}
.ehl-subtitle {
  display: block;
  font-size: 11px;
  opacity: 0.7;
}
/* Request URLs run far past any gallery title, so this is the one row that wraps:
   the popover is centred on the column and would otherwise overflow the page. */
.ehl-url {
  display: block;
  max-width: 560px;
  white-space: normal;
  overflow-wrap: anywhere;
}
.ehl-meta {
  margin-left: 6px;
  opacity: 0.7;
}
.ehl-flag {
  margin-left: 6px;
  padding: 0 4px;
  font-size: 10px;
  line-height: 14px;
  border: 1px solid currentColor;
  border-radius: 3px;
  opacity: 0.85;
}
.ehl-torrent {
  margin-left: 4px;
}
</style>
