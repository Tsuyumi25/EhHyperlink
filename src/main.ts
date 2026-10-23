import { createApp } from 'vue'
import App from '@/App.vue'
import { loadSettings } from '@/settings'
import { answerGooglePreview } from '@/services/googlePreview'

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
  createApp(App).mount(container)
}

/** `www.google.com` or a country domain it redirects to (`www.google.com.hk`). */
function isGoogle(hostname: string): boolean {
  return hostname.startsWith('www.google.')
}

// A Google search page only answers the gallery page's preview request, if it is one.
if (isGoogle(location.hostname)) await answerGooglePreview()
else await mountGalleryPage()
