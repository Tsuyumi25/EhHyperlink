import { compile, digit, start, whitespaceRun } from './pattern'
import table from '../../../data/title_markers.json'

export type MarkerRole = 'event' | 'language' | 'translator' | 'release' | 'platform' | 'placeholder' | 'ai'

export interface Marker {
  role: MarkerRole
  /** ehwiki language tag name; present only for language entries */
  lang?: string
}

const PREFIX_SEPARATORS = ' ☆★・-/,'
const ORDINAL_SUFFIXES = ['st', 'nd', 'rd', 'th']
const DIGIT_RE = compile(start.and(digit))

export function normalizeMarkerText(value: string): string {
  return value.normalize('NFKC').toLowerCase().split(whitespaceRun).filter(Boolean).join(' ')
}

interface Entry {
  value: string
  role: string
  kind: string
  lang?: string
}

const exact = new Map<string, Marker>()
const prefixes: Array<[string, Marker]> = []
const suffixes: Array<[string, Marker]> = []
for (const entry of table.entries as Entry[]) {
  const value = normalizeMarkerText(entry.value)
  const marker: Marker = entry.lang ? { role: entry.role as MarkerRole, lang: entry.lang } : { role: entry.role as MarkerRole }
  if (entry.kind === 'exact') exact.set(value, marker)
  else if (entry.kind === 'prefix_number') prefixes.push([value, marker])
  else if (entry.kind === 'suffix') suffixes.push([value, marker])
  else throw new Error(`unknown marker kind ${entry.kind} for ${entry.value}`)
}
// Longest stem first so `comic1` wins over `c` when both could apply.
prefixes.sort((a, b) => b[0].length - a[0].length)
suffixes.sort((a, b) => b[0].length - a[0].length)

/** `13`, `2016 winter`, `4th stage` qualify; `7sfm`, `43d`, `2.inc` do not. */
function isNumberedRemainder(remainder: string): boolean {
  let start = 0
  while (start < remainder.length && PREFIX_SEPARATORS.includes(remainder[start])) start += 1
  let digits = start
  while (digits < remainder.length && DIGIT_RE.test(remainder[digits])) digits += 1
  if (digits === start) return false
  let rest = remainder.slice(digits)
  for (const suffix of ORDINAL_SUFFIXES) {
    if (rest.startsWith(suffix)) {
      rest = rest.slice(suffix.length)
      break
    }
  }
  return rest === '' || PREFIX_SEPARATORS.includes(rest[0])
}

/** Marker claimed by one bracket segment, or null when unclaimed. */
export function markerOf(segment: string): Marker | null {
  const text = normalizeMarkerText(segment)
  if (!text) return null
  const direct = exact.get(text)
  if (direct) return direct
  for (const [stem, marker] of prefixes) {
    if (text.startsWith(stem) && isNumberedRemainder(text.slice(stem.length))) return marker
  }
  for (const [suffix, marker] of suffixes) {
    if (text.endsWith(suffix)) return marker
  }
  return null
}
