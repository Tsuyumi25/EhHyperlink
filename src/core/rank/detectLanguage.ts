import { markerOf } from '../title/titleMarkers'
import { parseTitleSegments } from '../title/titleStructure'

const NON_LANGUAGE_TAGS: Record<string, true> = { translated: true, rewrite: true, speechless: true, 'text cleaned': true }

/** Languages named by `language:` tags, with `translated`-style pseudo tags removed. */
export function languagesFromTags(tags: readonly string[]): string[] {
  const languages: string[] = []
  for (const tag of tags) {
    if (!tag.startsWith('language:')) continue
    const value = tag.slice('language:'.length).replaceAll('_', ' ')
    if (!(value in NON_LANGUAGE_TAGS)) languages.push(value)
  }
  return languages
}

/** Language named by a bracket marker in the title (`[Chinese]`, `[英訳]`, …), or null. */
export function languageFromTitle(title: string): string | null {
  const segments = parseTitleSegments(title)
  if (segments === null) return null
  for (const segment of segments) {
    if (segment.kind !== 'block') continue
    const marker = markerOf(segment.text)
    if (marker?.lang) return marker.lang
  }
  return null
}

/**
 * Tags win, then a title marker; a tagged gallery with neither and without
 * `language:translated` is a Japanese original. Everything else is `unknown`.
 */
export function detectLanguage(title: string, tags: readonly string[]): string {
  const [tagged] = languagesFromTags(tags)
  if (tagged) return tagged
  const marked = languageFromTitle(title)
  if (marked) return marked
  if (tags.length > 0 && !tags.includes('language:translated') && !tags.includes('language:rewrite')) return 'japanese'
  return 'unknown'
}
