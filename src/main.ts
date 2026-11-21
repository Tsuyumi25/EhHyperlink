import { createApp, watch } from 'vue'
import App from '@/App.vue'
import { loadSettings } from '@/settings'
import { locale } from '@/i18n'
import { prepareTagNames } from '@/services/tagNames'
import { answerPreview } from '@/services/preview'
import { isTraced, requestIdOf } from '@/core/source/preview'
import { debugLog, describeError } from '@/services/debugLog'
import { previewSiteFor } from '@/services/previewSites'
import { readSourceGallery, type SourceGallery } from '@/core/eh/galleryPage'
import { galleryRef, mpvGalleryId } from '@/core/eh/ehUrl'

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
function mountBar(host: HTMLElement, source: SourceGallery | null): () => void {
  const container = document.createElement('div')
  container.id = 'ehl-app'
  container.style.setProperty('--ehl-bg', opaqueBackground(host))
  container.style.setProperty('--ehl-border', getComputedStyle(host).borderTopColor)
  host.before(container)
  // `.gm`'s width comes from g.css (content-box 1200 / 960 / 720 by breakpoint)
  // and from whatever lays over it: layout userscripts set its `max-width` inline
  // to fit their thumbnail grid. Copying g.css's numbers left the bar wider than
  // the box, so follow its painted width.
  const resize = new ResizeObserver(([entry]) => {
    const width = entry.borderBoxSize[0].inlineSize
    // The search view hides `.gm` (App.vue) and a hidden box measures 0; the
    // view takes its place, so it keeps the box's last width.
    if (width === 0) return
    container.style.width = `${width}px`
  })
  resize.observe(host, { box: 'border-box' })
  const app = createApp(App, { source })
  app.mount(container)
  return () => {
    app.unmount()
    resize.disconnect()
    container.remove()
  }
}

/** Settings load once per page: loadSettings registers the watchers that save them. */
async function prepareBar(): Promise<void> {
  await loadSettings()
  // Fetched ahead of the first cover preview, which is where tag names show.
  watch(locale, (current) => void prepareTagNames(current), { immediate: true })
}

async function mountGalleryPage(): Promise<void> {
  const host = document.querySelector<HTMLElement>('.gm')
  if (!host) return
  await prepareBar()
  const ref = galleryRef(location.pathname)
  mountBar(host, ref ? readSourceGallery(document, ref.gid) : null)
}

// The Multi-Page Viewer has no `.gm` of its own. One appears only when another
// script lays the gallery's `.gm` over the viewer (EhQuickTag does on the user's
// click) and goes away when it is put away, so the page is watched for as long as
// it lives. The viewer's own URL names the gallery.
async function followMpvGallery(gid: number): Promise<void> {
  await prepareBar()
  let mounted: { host: HTMLElement, unmount: () => void } | null = null
  const sync = (): void => {
    const host = document.querySelector<HTMLElement>('.gm')
    if (mounted?.host === host) return
    mounted?.unmount()
    mounted = host ? { host, unmount: mountBar(host, readSourceGallery(host, gid)) } : null
  }
  sync()
  new MutationObserver(sync).observe(document.body, { childList: true, subtree: true })
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
const mpvGid = mpvGalleryId(location.pathname)
if (previewSite) await answerPreview(previewSite)
else if (mpvGid !== null) await followMpvGallery(mpvGid)
else await mountGalleryPage()
