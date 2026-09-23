<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import GroupList from '@/components/GroupList.vue'
import LanguageBadge from '@/components/LanguageBadge.vue'
import SettingsPopup from '@/components/SettingsPopup.vue'
import { Activity, CircleSlash2, RefreshCw, Settings } from '@lucide/vue'
import { locale, t, LANGUAGE_PRIORITY, type MessageKey } from '@/i18n'
import { readSourceGallery, type SourceGallery } from '@/core/eh/galleryPage'
import { findEditions, type EditionGroup, type JumpResult, type MetadataRequest, type SearchProgress, type SearchRequest } from '@/core/pipeline'
import { displayTitle, subtitle } from '@/settings'

const state = ref<'searching' | 'done' | 'noTitle' | 'failed'>('searching')
const result = ref<JumpResult | null>(null)
/** How far the search has got, so the status line counts rather than just spins. */
const progress = ref<SearchProgress | null>(null)
/** Tab id whose panel is shown: a hovered list tab previews, a clicked tab stays; one panel at a time. */
const pinned = ref<string | null>(null)
const hovered = ref<string | null>(null)
const open = computed(() => hovered.value ?? pinned.value)

/** Kept so the refetch button can run the same search again. */
const source = ref<SourceGallery | null>(null)

async function run(force: boolean): Promise<void> {
  const gallery = source.value
  if (!gallery) return
  state.value = 'searching'
  progress.value = null
  try {
    const found = await findEditions(gallery, location.origin, LANGUAGE_PRIORITY[locale], {
      force,
      onProgress: (next) => (progress.value = next),
      onResult: (next) => (result.value = next),
    })
    result.value = found
    state.value = found.plan.editionTerms.length === 0 && found.plan.containerTerms.length === 0 ? 'noTitle' : 'done'
  } catch (error) {
    console.error('[EhHyperlink]', error)
    state.value = 'failed'
  } finally {
    progress.value = null
  }
}

onMounted(async () => {
  source.value = readSourceGallery()
  if (!source.value) {
    state.value = 'noTitle'
    return
  }
  await run(false)
})

interface Badge {
  id: string
  label: string
  title: string
  groups: EditionGroup[]
}

const RELATED_TITLES: Record<JumpResult['plan']['mode'], MessageKey> = {
  work: 'relatedTitle',
  cosplayer: 'cosplayerRelatedTitle',
  realporn: 'directRelatedTitle',
}

/** One badge per meaning; the edition badge shows the languages found. */
const badges = computed<Badge[]>(() => {
  if (!result.value) return []
  const list: Badge[] = []
  if (result.value.editions.length > 0) {
    list.push({ id: 'editions', label: result.value.editions.map((group) => group.language.name[locale]).join(' · '), title: t('editionsTitle'), groups: result.value.editions })
  }
  if (result.value.series.length > 0) list.push({ id: 'series', label: t('series'), title: t('seriesTitle'), groups: result.value.series })
  if (result.value.related.length > 0) {
    list.push({ id: 'related', label: t('related'), title: t(RELATED_TITLES[result.value.plan.mode]), groups: result.value.related })
  }
  if (result.value.chapters.length > 0) list.push({ id: 'chapters', label: t('chapters'), title: t('chaptersTitle'), groups: result.value.chapters })
  return list
})

/** The request panel reads the two kinds apart; each keeps the order they were sent in. */
const requests = computed(() => result.value?.requests ?? [])
const searchRequests = computed(() => requests.value.filter((request): request is SearchRequest => request.kind === 'search'))
const metadataRequests = computed(() => requests.value.filter((request): request is MetadataRequest => request.kind === 'metadata'))
/** Galleries the cache answered for; the API never heard of them this run. */
const metadataFromCache = computed(() => result.value?.metadataFromCache ?? 0)
/**
 * Requests that left the browser. A cached search is listed in the panel but
 * counts as nothing here, which is what the icon and the empty-state line read.
 */
const sentCount = computed(() => requests.value.filter((request) => !(request.kind === 'search' && request.cached)).length)

const hasResults = computed(() => badges.value.length > 0 || (result.value?.containers.length ?? 0) > 0)

const status = computed(() => {
  if (state.value === 'searching') {
    const seen = progress.value
    return seen && seen.total > 0 ? `${t('searching')} ${seen.done}/${seen.total}` : t('searching')
  }
  if (state.value === 'noTitle') return t('noTitle')
  if (state.value === 'failed') return t('failed')
  return hasResults.value ? null : t('notFound')
})

/** How old the oldest response in this result is, in the reader's locale. */
const dataAge = computed(() => {
  const at = result.value?.dataAt
  if (at === undefined) return ''
  return new Date(at).toLocaleString(locale === 'zh' ? 'zh-TW' : locale === 'ja' ? 'ja-JP' : 'en-GB', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
})

function toggle(id: string): void {
  pinned.value = pinned.value === id ? null : id
}
</script>

<template>
  <div class="ehl-box" translate="no">
    <div class="ehl-tabs">
      <div v-if="result" class="ehl-unit" :class="{ 'ehl-unit--open': open === 'requests' }" @mouseenter="hovered = 'requests'" @mouseleave="hovered = null">
        <button type="button" class="ehl-icon" :class="{ 'ehl-icon--active': open === 'requests', 'ehl-tab--pinned': pinned === 'requests' }" :title="t('requestsTitle')" @click="toggle('requests')">
          <CircleSlash2 v-if="requests.length === 0" :size="14" aria-hidden="true" />
          <Activity v-else :size="14" aria-hidden="true" />
        </button>
        <div class="ehl-list">
          <!-- the age of what is on screen, and the one control that discards it -->
          <h4 class="ehl-head ehl-asof">
            {{ t('dataAsOf') }} {{ dataAge }}
            <button type="button" class="ehl-refetch" :disabled="state === 'searching'" :title="t('refetchTitle')" @click="run(true)">
              <RefreshCw :size="11" aria-hidden="true" />
              {{ t('refetch') }}
            </button>
          </h4>
          <section v-if="searchRequests.length > 0" class="ehl-section">
            <h4 class="ehl-head">{{ t('searchRequests') }}<span class="ehl-count">{{ searchRequests.length }}</span></h4>
            <ul>
              <li v-for="request in searchRequests" :key="request.url">
                <a class="ehl-url" :href="request.url" target="_blank" rel="noopener">
                  {{ request.term }}
                  <span class="ehl-subtitle">{{ request.url }}</span>
                </a>
                <span v-if="request.cached" class="ehl-facts"><span class="ehl-meta">{{ t('fromCache') }}</span></span>
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
          <p v-if="metadataFromCache > 0" class="ehl-head">{{ metadataFromCache }} {{ t('galleriesUnit') }} · {{ t('fromCache') }}</p>
          <p v-if="requests.length === 0" class="ehl-head">{{ t('noRequests') }}</p>
          <p v-else-if="sentCount === 0" class="ehl-head">{{ t('nothingSent') }}</p>
        </div>
      </div>
      <span v-if="status" class="ehl-status">{{ status }}</span>
      <template v-if="result">
        <div v-for="badge in badges" :key="badge.id" class="ehl-unit" :class="{ 'ehl-unit--open': open === badge.id }" @mouseenter="hovered = badge.id" @mouseleave="hovered = null">
          <button type="button" class="ehl-badge" :class="{ 'ehl-tab--pinned': pinned === badge.id }" :title="badge.title" :aria-label="badge.label" @click="toggle(badge.id)">
            <template v-if="badge.id === 'editions'">
              <LanguageBadge v-for="group in badge.groups" :key="group.language.value" :language="group.language" />
            </template>
            <template v-else>{{ badge.label }}</template>
          </button>
          <GroupList :groups="badge.groups" />
        </div>
        <div v-if="result.containers.length > 0" class="ehl-unit" :class="{ 'ehl-unit--open': open === 'containers' }" @mouseenter="hovered = 'containers'" @mouseleave="hovered = null">
          <button type="button" class="ehl-badge ehl-badge--container" :class="{ 'ehl-tab--pinned': pinned === 'containers' }" :title="t('containerTitle')" @click="toggle('containers')">{{ t('container') }}</button>
          <div class="ehl-list">
            <ul>
              <li v-for="hit in result.containers" :key="hit.gid">
                <a class="ehl-title" :href="hit.href" target="_blank" rel="noopener">
                  {{ displayTitle(hit) }}
                  <span v-if="subtitle(hit)" class="ehl-subtitle">{{ subtitle(hit) }}</span>
                </a>
                <span v-if="hit.pages !== null" class="ehl-facts"><span class="ehl-meta">{{ hit.pages }}{{ t('pages') }}</span></span>
              </li>
            </ul>
          </div>
        </div>
      </template>
      <div class="ehl-unit">
        <button type="button" class="ehl-icon" :class="{ 'ehl-icon--active': open === 'settings', 'ehl-tab--pinned': pinned === 'settings' }" :title="t('settings')" @click="toggle('settings')">
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
  gap: 4px;
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
/* A clicked tab stays open after the pointer leaves, and a hovered one does not —
   so the pinned one needs a mark a hover never puts there. An inset line along
   the bottom edge, the way a selected tab meets its panel; the colour is the
   host's own text colour, which reads on both the light and the dark site. */
.ehl-tab--pinned {
  box-shadow: inset 0 -2px 0 currentColor;
  opacity: 1;
}
/* The list stays a DOM child of its unit, so moving the pointer from the badge
   down into it keeps the unit hovered; visually it hangs centred under the bar.
   It overlaps the top of `.gm`, whose columns are stacking contexts of their own
   (`#gleft` 1, `#gmid` / `#gd2` 2, ehs `#gright` 3), so it needs a higher index. */
.ehl-list {
  /* How big a cover is, in both views. In `em` so the host page's font size and a
     reader's own zoom of it move the covers the same way they move the titles. */
  --ehl-cover-h: 10em;
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
/* The as-of row holds the age of what is on screen and the one control that
   throws it away, so they read as one statement. */
.ehl-asof {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 4px;
  border-bottom: 1px dashed var(--ehl-border, currentColor);
}
.ehl-refetch {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 1px 5px;
  font: inherit;
  font-size: 10px;
  font-weight: 700;
  color: inherit;
  background: none;
  border: 1px solid currentColor;
  border-radius: 3px;
  cursor: pointer;
  opacity: 0.8;
}
.ehl-refetch:hover:not(:disabled) {
  opacity: 1;
}
.ehl-refetch:disabled {
  opacity: 0.35;
  cursor: default;
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
.ehl-language {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-sizing: border-box;
  min-width: 22px;
  height: 18px;
  padding: 0 4px;
  border-radius: 3px;
  color: #fff;
  background: #64748b;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0;
  vertical-align: middle;
}
.ehl-language[data-language='chinese'] {
  background: #be185d;
}
.ehl-language[data-language='japanese'] {
  background: #7c3aed;
}
.ehl-language[data-language='english'] {
  background: #b45309;
}
.ehl-language[data-language='korean'] {
  background: #2563eb;
}
.ehl-head > .ehl-language {
  margin-right: 4px;
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
.ehl-list li {
  display: block;
  padding: 2px 0;
}
/* The link inside carries the padding instead, so its hover shape reaches the row's
   own edges. */
.ehl-list li.ehl-row {
  padding: 0;
}
/* One hit area over the cover, the title and the facts. `min-height` levels the rows
   at the cover's height: past five lines of text the floor is the taller of the two,
   so every row reaches it, nothing has to be measured, and no row hands its own cover
   a different size. */
.ehl-rowlink {
  display: flex;
  align-items: stretch;
  gap: 6px;
  min-height: var(--ehl-cover-h);
  padding: 2px 3px;
  border-radius: 3px;
}
/* The row being a hit area has to be visible, or the cursor is the only clue. Mixed
   from `currentColor`, so it reads on the light site, on the dark one, and over a
   book frame's own tint. */
.ehl-rowlink:hover {
  background: color-mix(in srgb, currentColor 12%, transparent);
}
/* The space a cover gets, and nothing drawn: it holds the column open for a gallery
   the metadata API handed no cover for, and gives the cover inside it something to be
   positioned against. The width comes off the same `em` as the row's height, at the
   5:7 an EH cover runs, so a standard cover very nearly fills it. */
.ehl-thumb {
  position: relative;
  flex: 0 0 auto;
  width: calc(var(--ehl-cover-h) * 5 / 7);
}
/* The border belongs to the cover, so it has to be the cover's own size: `object-fit`
   would leave the image its full 100% box and draw the border around the empty part
   too, so the box is sized by `max-*` instead and the ratio comes from the file. Out
   of flow, because a replaced element in flow brings its own intrinsic height and
   would set the flex line's height rather than follow it. Top edge, centred, so the
   slack a cover with a different ratio leaves all ends up at the bottom. */
.ehl-thumb img,
.ehl-cover-art img {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  box-sizing: border-box;
  max-width: 100%;
  max-height: 100%;
  border: 1px solid var(--ehl-border, currentColor);
  border-radius: 2px;
}
/* Six to a row: the panel is `width: max-content`, so `auto-fill` would read every
   cover's contribution and lay the whole group out on one line. Six of them plus the
   panel's own padding stay inside the 720px column the bar is aligned to. */
.ehl-covers {
  display: grid;
  grid-template-columns: repeat(6, calc(var(--ehl-cover-h) * 5 / 7));
  gap: 4px;
}
/* A cell stacks the cover over the same facts line a row carries. Grid items stretch,
   so cells in one row stay the same height however many lines of flags they wrap to. */
.ehl-cover {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
/* Same frame as a row's cover, on its own rather than beside text. */
.ehl-cover-art {
  position: relative;
  flex: 0 0 auto;
  height: var(--ehl-cover-h);
}
/* The grid has no other way to say which cover the name in the preview belongs to. */
.ehl-cover:hover .ehl-cover-art img {
  border-color: currentColor;
  box-shadow: 0 0 0 2px color-mix(in srgb, currentColor 30%, transparent);
}
/* A row stacks: the title takes as many lines as it needs, everything else goes under
   it. `min-width: 0` because a flex item defaults to `auto` and would refuse to let
   the title wrap at its own `max-width`. */
.ehl-rowtext {
  display: block;
  min-width: 0;
}
.ehl-title {
  display: block;
  max-width: 520px;
  white-space: normal;
  overflow-wrap: anywhere;
}
.ehl-facts {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 2px;
}
/* The meta spans carry their own left margin for the days they sat on the title
   line; inside the facts line the first one has to start at the title's edge. */
.ehl-facts > :first-child {
  margin-left: 0;
}
/* One cover, in one place: the row or grid cell under the pointer fills it. Pinned to
   the viewport, so it stays put while the grid scrolls under the pointer and its own
   right edge cannot run off a narrow window; `left` / `top` / `max-*` are measured in
   `GroupList`, which puts it beside the list when there is room. `pointer-events:
   none` keeps it from stealing the hover that feeds it. */
.ehl-preview {
  position: fixed;
  display: flex;
  flex-direction: column;
  gap: 4px;
  box-sizing: border-box;
  padding: 5px;
  border: 1px solid var(--ehl-border, currentColor);
  border-radius: 4px;
  background: var(--ehl-bg, #fff);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.25);
  pointer-events: none;
  z-index: 11;
}
/* The cover is what gives way when the text below needs the room: the text is the
   part a reader cannot get anywhere else. A gallery carrying thirty tags can outrun
   the card all the same, so the text block shrinks too and clips rather than spilling
   past the viewport it is pinned to. */
.ehl-preview img {
  min-height: 0;
  width: 100%;
  object-fit: contain;
  object-position: top;
}
.ehl-preview-text {
  flex: 0 1 auto;
  min-height: 0;
  overflow: hidden;
  white-space: normal;
  overflow-wrap: anywhere;
}
.ehl-preview-title {
  display: block;
  font-size: 11px;
  line-height: 1.25;
}
/* Namespaces down one column, their tags down the other. The grid sits on the
   container and each row is `display: contents`, so every label shares one auto-sized
   column and their colons line up; a grid per row would size each label on its own.
   The shape is the host's own taglist: 9pt, bold chips, `1px 4px`, 5px radius. */
.ehl-tags {
  display: grid;
  grid-template-columns: auto 1fr;
  column-gap: 6px;
  align-items: start;
  margin-top: 3px;
  font-size: 9pt;
}
.ehl-tags__row {
  display: contents;
}
.ehl-tags__label {
  padding-top: 3px;
  text-align: right;
  white-space: nowrap;
  opacity: 0.7;
}
.ehl-tags__cells {
  display: flex;
  flex-wrap: wrap;
  min-width: 0;
}
.ehl-tags__chip {
  margin: 0 2px 3px;
  padding: 1px 4px;
  background: color-mix(in srgb, currentColor 8%, transparent);
  border: 1px solid var(--ehl-border, currentColor);
  border-radius: 5px;
  white-space: nowrap;
}
/* Five outlined stars with the rated share of them filled in over the top: a
   fractional rating (`4.71`) needs a partial star, which a count of glyphs cannot
   give. The outline is drawn behind the fill, so a star keeps its whole shape at
   whatever `-webkit-text-stroke` eats of the glyph, and the fill colour is free to be
   the pale one the unrated stars use. Both layers inherit it, which is what carries
   the outline across the cut where the filled layer ends mid-star. */
.ehl-stars {
  position: relative;
  display: inline-block;
  font-size: 11px;
  line-height: 14px;
  letter-spacing: 1px;
  color: color-mix(in srgb, currentColor 35%, transparent);
  -webkit-text-stroke: 0.5px currentColor;
  paint-order: stroke fill;
  white-space: nowrap;
}
.ehl-stars-on {
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;
  color: var(--ehl-star);
}
/* The letter EH names each colour by, at a saturation that reads on the light site
   and the dark one. */
.ehl-stars--r {
  --ehl-star: hsl(0 75% 55%);
}
.ehl-stars--g {
  --ehl-star: hsl(140 55% 45%);
}
.ehl-stars--b {
  --ehl-star: hsl(210 70% 55%);
}
.ehl-stars--y {
  --ehl-star: hsl(45 90% 55%);
}
/* The wrapper around a book's rows carries no shape of its own; only a framed
   book overrides this. */
.ehl-books {
  display: block;
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
</style>
