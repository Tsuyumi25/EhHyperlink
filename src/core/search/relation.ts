import { CHAPTER_WORDS, stripChapterMarkers } from '../title/chapter'
import { TITLE_BAR } from './searchPlan'
import { analyzeTitle, normalizeTitleText } from '../title/titleStructure'

/**
 * Whether a matched gallery is the same book in another language / release
 * (`edition`) or another book of the same series (`series`).
 *
 * Same work: some title field of each side shares a chapter-stripped work phrase
 * (either side of a ` | ` translated title) and the removed counter is the same —
 * `Ch. 10` against `Ch.10` is the same book, `Ch. 10` against `Ch. 9` or against
 * no counter at all is a sibling.
 */
export type Relation = 'edition' | 'series'

/** One ` | ` segment of a title's work text: the chapter-stripped phrase and the counter that was removed. */
interface WorkKey {
  term: string
  counter: string
}

const LABELS: readonly string[] = CHAPTER_WORDS

/** Tokens of `full` that `stripped` lost, minus the chapter label: `ch 10` and `10` both read as `10`. */
function counterOf(full: string, stripped: string): string {
  const remaining = stripped.split(' ').filter(Boolean)
  const counter: string[] = []
  for (const token of full.split(' ').filter(Boolean)) {
    const index = remaining.indexOf(token)
    if (index === -1) {
      if (!LABELS.includes(token)) counter.push(token)
    } else remaining.splice(index, 1)
  }
  return counter.join(' ')
}

function workKeysOf(gallery: { title: string; titleJpn: string }): WorkKey[] {
  const keys: WorkKey[] = []
  for (const value of [gallery.title, gallery.titleJpn]) {
    if (!value) continue
    for (const segment of analyzeTitle(value).coreText.split(TITLE_BAR)) {
      const term = normalizeTitleText(stripChapterMarkers(segment))
      if (!term) continue
      keys.push({ term, counter: counterOf(normalizeTitleText(segment), term) })
    }
  }
  return keys
}

export function relationOf(source: { title: string; titleJpn: string }, hit: { title: string; titleJpn: string }): Relation {
  const hitKeys = workKeysOf(hit)
  for (const left of workKeysOf(source)) {
    if (hitKeys.some((right) => right.term === left.term && right.counter === left.counter)) return 'edition'
  }
  return 'series'
}
