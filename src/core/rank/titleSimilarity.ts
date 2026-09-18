import { markerOf } from '../title/titleMarkers'
import { readWorkText } from '../title/chapter'
import { analyzeTitle, normalizeTitleText, parseTitleSegments, TITLE_BAR } from '../title/titleStructure'

export const SIMILARITY_THRESHOLD = 0.5
export const IDENTITY_MISMATCH_FLOOR = 0.45
export const CONTEXT_MISMATCH_FLOOR = 0.8
export const TITLE_ALIGNMENT_COMPONENT_FLOOR = 0.15
export const IDENTITY_REQUIRED_SIMILARITY = 0.5

/** Any bracket block the marker table reads as the AI-generated indicator. */
export function hasAiGeneratedMarker(value: string): boolean {
  const segments = parseTitleSegments(value)
  if (segments === null) return false
  return segments.some((segment) => segment.kind === 'block' && markerOf(segment.text)?.role === 'ai')
}

/** Spaces are dropped first: `作品乙 5` and `作品乙5` are one work, and a short CJK core has too few trigrams to survive a spacing difference. */
function trigramCounts(value: string): Map<string, number> {
  const counts = new Map<string, number>()
  const characters = [...value.replaceAll(' ', '')]
  if (characters.length === 0) return counts
  if (characters.length < 3) {
    counts.set(characters.join(''), 1)
    return counts
  }
  for (let index = 0; index + 3 <= characters.length; index += 1) {
    const trigram = characters.slice(index, index + 3).join('')
    counts.set(trigram, (counts.get(trigram) ?? 0) + 1)
  }
  return counts
}

/** Character-trigram Dice coefficient in [0, 1]. */
export function trigramDice(left: string, right: string): number {
  const leftCounts = trigramCounts(left)
  const rightCounts = trigramCounts(right)
  let leftTotal = 0
  let rightTotal = 0
  let overlap = 0
  for (const count of leftCounts.values()) leftTotal += count
  for (const count of rightCounts.values()) rightTotal += count
  const total = leftTotal + rightTotal
  if (total === 0) return 0
  for (const [trigram, count] of leftCounts) overlap += Math.min(count, rightCounts.get(trigram) ?? 0)
  return (2 * overlap) / total
}

function identitiesOf(title: string, titleJpn: string): string[] {
  const identities: string[] = []
  for (const value of [title, titleJpn]) {
    if (!value) continue
    const identity = analyzeTitle(value).identity
    if (identity) identities.push(identity)
  }
  return identities
}

/**
 * What the creator tags of two galleries say before any title is compared.
 * `artist:` / `group:` tags survive pen-name changes that the title identity
 * cannot follow; when both sides carry them, they decide.
 */
export type CreatorVerdict = 'same' | 'different' | 'unknown'

const CREATOR_NAMESPACES = ['artist:', 'group:']

function creatorTags(tags: readonly string[]): string[] {
  return tags.filter((tag) => CREATOR_NAMESPACES.some((namespace) => tag.startsWith(namespace))).map((tag) => tag.replaceAll('_', ' '))
}

export function creatorVerdict(sourceTags: readonly string[], candidateTags: readonly string[]): CreatorVerdict {
  const source = creatorTags(sourceTags)
  const candidate = creatorTags(candidateTags)
  if (source.length === 0 || candidate.length === 0) return 'unknown'
  return source.some((tag) => candidate.includes(tag)) ? 'same' : 'different'
}

/** The `other:ai generated` tag, with either underscore or space as EH writes it in ids and in the API. */
export function hasAiGeneratedTag(tags: readonly string[]): boolean {
  return tags.some((tag) => tag.replaceAll('_', ' ') === 'other:ai generated')
}

/** Strongest identity-block agreement across the title fields, or null when a side names no creator. */
function identityAgreement(sourceTitle: string, sourceTitleJpn: string, candidateTitle: string, candidateTitleJpn: string): number | null {
  const sourceIdentities = identitiesOf(sourceTitle, sourceTitleJpn)
  const candidateIdentities = identitiesOf(candidateTitle, candidateTitleJpn)
  if (sourceIdentities.length === 0 || candidateIdentities.length === 0) return null
  let best = 0
  for (const source of sourceIdentities) {
    for (const candidate of candidateIdentities) best = Math.max(best, trigramDice(source, candidate))
  }
  return best
}

/**
 * Hard blockers: AI-generated galleries, creators the tags call different, and —
 * when tags cannot decide — a candidate missing or contradicting the source
 * creator in its title.
 */
export function relationshipIsBlocked(
  sourceTitle: string,
  sourceTitleJpn: string,
  candidateTitle: string,
  candidateTitleJpn: string,
  creators: CreatorVerdict = 'unknown',
): boolean {
  for (const value of [sourceTitle, sourceTitleJpn, candidateTitle, candidateTitleJpn]) {
    if (value && hasAiGeneratedMarker(value)) return true
  }
  if (creators === 'different') return true
  if (creators === 'same') return false
  if (identitiesOf(sourceTitle, sourceTitleJpn).length === 0) return false
  const agreement = identityAgreement(sourceTitle, sourceTitleJpn, candidateTitle, candidateTitleJpn)
  return agreement === null || agreement < IDENTITY_REQUIRED_SIMILARITY
}

/** The creator is settled as the same person: by tags, or by the creator blocks of both titles. */
export function creatorsAgree(
  sourceTitle: string,
  sourceTitleJpn: string,
  candidateTitle: string,
  candidateTitleJpn: string,
  creators: CreatorVerdict = 'unknown',
): boolean {
  if (creators !== 'unknown') return creators === 'same'
  const agreement = identityAgreement(sourceTitle, sourceTitleJpn, candidateTitle, candidateTitleJpn)
  return agreement !== null && agreement >= IDENTITY_REQUIRED_SIMILARITY
}

/** Work text of a title with spaces removed: the core alone, and the core plus context together. */
function workTexts(title: string, titleJpn: string): { core: string; all: string }[] {
  const texts: { core: string; all: string }[] = []
  for (const value of [title, titleJpn]) {
    if (!value) continue
    const parts = analyzeTitle(value)
    const core = parts.core.replaceAll(' ', '')
    if (core) texts.push({ core, all: core + parts.context.replaceAll(' ', '') })
  }
  return texts
}

/** At least this many characters (spaces removed) before a core can be looked for inside another title. */
const MENTION_MIN_LENGTH = 3

/**
 * One title names the other's work: a core of at least three characters appears
 * inside the other side's work or context text, in either direction. This is
 * how a chapter points at its tankoubon and a spin-off at its series when the
 * cores themselves share nothing; in a 600k-title sample, 3.1% of same-creator
 * titles with a `()` block reference another same-creator core this way.
 */
export function mentionsWork(sourceTitle: string, sourceTitleJpn: string, candidateTitle: string, candidateTitleJpn: string): boolean {
  const sources = workTexts(sourceTitle, sourceTitleJpn)
  const candidates = workTexts(candidateTitle, candidateTitleJpn)
  for (const source of sources) {
    for (const candidate of candidates) {
      if (source.core.length >= MENTION_MIN_LENGTH && candidate.all.includes(source.core)) return true
      if (candidate.core.length >= MENTION_MIN_LENGTH && source.all.includes(candidate.core)) return true
    }
  }
  return false
}

/** The searchable work phrase of each title field, spaces removed, both sides of a bar. */
function workPhrases(title: string, titleJpn: string): string[] {
  const phrases: string[] = []
  for (const value of [title, titleJpn]) {
    if (!value) continue
    for (const segment of analyzeTitle(value).coreSegments) {
      for (const half of segment.split(TITLE_BAR)) {
        const phrase = normalizeTitleText(readWorkText(half).phrase).replaceAll(' ', '')
        if (phrase.length >= MENTION_MIN_LENGTH) phrases.push(phrase)
      }
    }
  }
  return phrases
}

/**
 * One title's work phrase appears in the other, as one unbroken run of text.
 *
 * This is the whole admission test once the creator tags agree, in place of the
 * similarity threshold. The search asked the host for
 * `title:"<phrase>" a:"<creator>"`, and a phrase search on EH is exact — a row
 * that came back carries that run of text and that creator, so a trigram score
 * can only take away what the host already granted.
 *
 * It takes plenty. Over 20,521 corpus pairs sharing a creator block and a work
 * phrase, the threshold admits 92.8% and this test admits 100.0%; 4.7% of the
 * pairs are lost outright, because each part of a series carries its own event
 * prefix and its own subtitle and the shared name is a small share of the
 * trigrams — such pairs score as low as 0.25. Measured against 63,771 pairs by
 * one creator with *different* work phrases, the two admit alike: 4.3% for this
 * test, 4.4% for the threshold, and the samples are series siblings whose
 * phrases differ by a suffix.
 *
 * The phrase has to land in the other title's *work* text, not in a context
 * block. A chapter names its magazine there, and a magazine's own phrase is the
 * name without the issue number (`COMIC … Monthly` out of `… Vol. 5`), so
 * matching context admitted every chapter of every issue at a score of 0 — the
 * chapters of this issue reach the reader through `matchExtractedChapters`,
 * which compares the container name in full. Corpus: of 72,167 same-creator
 * pairs, 204 pass on a context block alone, and `mentionsWork` still takes 118
 * of those.
 *
 * The score still describes the pair — it decides nothing here, and grouping
 * reads it as before.
 */
export function sharesWorkPhrase(sourceTitle: string, sourceTitleJpn: string, candidateTitle: string, candidateTitleJpn: string): boolean {
  const sourceCores = workTexts(sourceTitle, sourceTitleJpn).map((text) => text.core)
  const candidateCores = workTexts(candidateTitle, candidateTitleJpn).map((text) => text.core)
  for (const phrase of workPhrases(sourceTitle, sourceTitleJpn)) {
    if (candidateCores.some((core) => core.includes(phrase))) return true
  }
  for (const phrase of workPhrases(candidateTitle, candidateTitleJpn)) {
    if (sourceCores.some((core) => core.includes(phrase))) return true
  }
  return false
}

/** Core similarity, damped by identity disagreement (unless the tags settled it) and by context disagreement. */
export function titleSimilarity(left: string, right: string, creators: CreatorVerdict = 'unknown'): number {
  const leftParts = analyzeTitle(left)
  const rightParts = analyzeTitle(right)
  let score = trigramDice(leftParts.core, rightParts.core)
  if (creators !== 'same' && leftParts.identity && rightParts.identity) {
    score *= IDENTITY_MISMATCH_FLOOR + (1 - IDENTITY_MISMATCH_FLOOR) * trigramDice(leftParts.identity, rightParts.identity)
  }
  if (leftParts.context && rightParts.context) {
    score *= CONTEXT_MISMATCH_FLOOR + (1 - CONTEXT_MISMATCH_FLOOR) * trigramDice(leftParts.context, rightParts.context)
  }
  return score
}

/** Strongest guarded alignment between the available title fields of two galleries. */
export function galleryTitleSimilarity(
  sourceTitle: string,
  sourceTitleJpn: string,
  candidateTitle: string,
  candidateTitleJpn: string,
  creators: CreatorVerdict = 'unknown',
): number {
  if (relationshipIsBlocked(sourceTitle, sourceTitleJpn, candidateTitle, candidateTitleJpn, creators)) return 0

  const score = (left: string, right: string) => titleSimilarity(left, right, creators)
  const sources = [sourceTitle, sourceTitleJpn].filter(Boolean)
  const candidates = [candidateTitle, candidateTitleJpn].filter(Boolean)
  if (sources.length === 0 || candidates.length === 0) return 0
  if (sources.length < 2 || candidates.length < 2) {
    let best = 0
    for (const source of sources) {
      for (const candidate of candidates) best = Math.max(best, score(source, candidate))
    }
    return best
  }

  const primary = score(sources[0], candidates[0])
  const direct: [number, number] = [primary, score(sources[1], candidates[1])]
  const cross: [number, number] = [score(sources[0], candidates[1]), score(sources[1], candidates[0])]
  let best = primary
  for (const pair of [direct, cross]) {
    if (Math.min(...pair) >= TITLE_ALIGNMENT_COMPONENT_FLOOR) best = Math.max(best, (pair[0] + pair[1]) / 2)
  }
  return best
}
