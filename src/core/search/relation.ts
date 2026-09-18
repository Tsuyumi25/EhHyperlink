import { readWorkText, type WorkText } from '../title/chapter'
import { TITLE_BAR } from './searchPlan'
import { analyzeTitle, normalizeTitleText } from '../title/titleStructure'

/**
 * Whether a matched gallery is the same book in another language / release
 * (`edition`) or another book of the same series (`series`).
 *
 * Same work: some title field of each side reads as the same work phrase with the
 * same counter — `Ch. 10` against `Ch.10` is the same book, `Ch. 10` against
 * `Ch. 9` or against no counter at all is a sibling.
 */
export type Relation = 'edition' | 'series'

function workKeysOf(gallery: { title: string; titleJpn: string }): WorkText[] {
  const keys: WorkText[] = []
  for (const value of [gallery.title, gallery.titleJpn]) {
    if (!value) continue
    for (const segment of analyzeTitle(value).coreSegments) {
      for (const part of segment.split(TITLE_BAR)) {
        const { phrase, counter } = readWorkText(normalizeTitleText(part))
        if (!phrase) continue
        keys.push({ phrase, counter })
      }
    }
  }
  return keys
}

export function relationOf(source: { title: string; titleJpn: string }, hit: { title: string; titleJpn: string }): Relation {
  const hitKeys = workKeysOf(hit)
  for (const left of workKeysOf(source)) {
    if (hitKeys.some((right) => right.phrase === left.phrase && right.counter === left.counter)) return 'edition'
  }
  return 'series'
}
