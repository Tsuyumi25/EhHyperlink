import { createApp, watch } from 'vue'
import App from '@/App.vue'
import { loadSettings } from '@/settings'
import { locale } from '@/i18n'
import { prepareTagNames } from '@/services/tagNames'
import { answerPreview } from '@/services/preview'
import { isTraced, requestIdOf } from '@/core/source/preview'
import { debugLog, describeError } from '@/services/debugLog'
import { previewSiteFor } from '@/services/previewSites'

/** `transparent` or an rgba() with zero alpha, as getComputedStyle reports unpainted backgrounds. */
function isTransparent(color: string): boolean {
  if (color === 'transparent') return true
  return color.startsWith('rgba(') && color.replaceAll(' ', '').endsWith(',0)')
}

/** First painted background walking up from `element`; EH paints `.gm` itself, but stay safe on themes that paint an ancestor. */
function opaqueBackground(element: HTMLElement): string {
  for (let current: HTMLElement | null = element; current; current = current.parentElement) {
    const color = getComputedStyle(current).backgroundColor
    if (!isTransparent(color)) return color
  }
  return '#fff'
}

// The bar sits right before `.gm` in normal flow: every column inside `.gm`
// (`#gleft` z-index 1, `#gmid` / `#gd2` z-index 2) stays a stacking context of its
// own, and the popovers here compete only in the root context.
async function mountGalleryPage(): Promise<void> {
  const host = document.querySelector<HTMLElement>('.gm')
  if (!host) return
  await loadSettings()
  const container = document.createElement('div')
  container.id = 'ehl-app'
  container.style.setProperty('--ehl-bg', opaqueBackground(host))
  container.style.setProperty('--ehl-border', getComputedStyle(host).borderTopColor)
  host.before(container)
  // `.gm`'s width comes from g.css (content-box 1200 / 960 / 720 by breakpoint)
  // and whatever user styles or other scripts lay over it; copying the numbers
  // left the bar wider than the box in Chrome, so follow its painted width.
  new ResizeObserver(([entry]) => {
    container.style.width = `${entry.borderBoxSize[0].inlineSize}px`
  }).observe(host, { box: 'border-box' })
  createApp(App).mount(container)
  // Fetched ahead of the first cover preview, which is where tag names show.
  watch(locale, (current) => void prepareTagNames(current), { immediate: true })
}

/**
 * A tab opened for a traced request logs that the script ran at all, what URL
 * it ended up on, and anything thrown on the page while it works: the first
 * thing to know about a search that never answers.
 */
function traceTab(here: URL, siteId: string | null): void {
  const id = requestIdOf(here)
  if (id === null || !isTraced(here)) return
  void debugLog(id, 'script started', `${here.href} readyState=${document.readyState} visibility=${document.visibilityState} site=${siteId ?? 'none matches this URL'}`)
  window.addEventListener('error', (event) => void debugLog(id, 'page error', describeError(event.error ?? event.message)))
  window.addEventListener('unhandledrejection', (event) => void debugLog(id, 'unhandled rejection', describeError(event.reason)))
}

// A search page of a previewed site only answers the gallery page's request, if it is one.
const previewSite = previewSiteFor(new URL(location.href))
traceTab(new URL(location.href), previewSite?.id ?? null)
if (previewSite) await answerPreview(previewSite)
else await mountGalleryPage()
