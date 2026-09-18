import { anyOf } from 'magic-regexp'
import { compile, letter, unicode, whitespaceRun } from './pattern'
import { markerOf } from './titleMarkers'

export const DELIMITER_PAIRS: Record<string, string> = {
  '[': ']',
  '［': '］',
  '(': ')',
  '（': '）',
  '{': '}',
  '｛': '｝',
  '【': '】',
  '「': '」',
  '『': '』',
  '《': '》',
  '〈': '〉',
  '〔': '〕',
  '｢': '｣',
  '〖': '〗',
  '〝': '〟',
  '︵': '︶',
  '༼': '༽',
  '༺': '༻',
  '⟮': '⟯',
  '₍': '₎',
  '❲': '❳',
  '❬': '❭',
  '❰': '❱',
  '⟨': '⟩',
  '⟪': '⟫',
  '﹙': '﹚',
  '〘': '〙',
  '﴿': '﴾',
  '⁽': '⁾',
  '﹃': '﹄',
}

const OPEN_BY_CLOSE: Record<string, string> = Object.fromEntries(
  Object.entries(DELIMITER_PAIRS).map(([opening, closing]) => [closing, opening]),
)
const IDENTITY_PAIRS: Record<string, true> = { '[]': true, '【】': true, '〔〕': true, '〖〗': true, '〘〙': true, '❲❳': true }
const CONTEXT_PAIRS: Record<string, true> = { '()': true, '︵︶': true, '⟮⟯': true, '₍₎': true, '﹙﹚': true, '﴿﴾': true }
const TITLE_QUOTE_PAIRS: Record<string, true> = {
  '「」': true,
  '『』': true,
  '《》': true,
  '〈〉': true,
  '〝〟': true,
  '❬❭': true,
  '❰❱': true,
  '⟨⟩': true,
  '⟪⟫': true,
  '༺༻': true,
}

const ALNUM_RE = compile(anyOf(letter, unicode('N')))

export interface TitleSegment {
  kind: 'text' | 'block'
  text: string
  /** opening + closing delimiter for blocks, empty for text */
  pair: string
}

export interface TitleParts {
  /** searchable work title, normalized; empty when the title carries no work text */
  core: string
  /** creator identity read from a leading identity-family block, normalized */
  identity: string
  /** series / container read from a context-family block after the core, normalized */
  context: string
  /**
   * Core as written in the title, one entry per run of top-level text
   * (whitespace collapsed). A bracket block between two runs means the title
   * never wrote them next to each other, so a search phrase built from both
   * would be a string no gallery carries — they stay apart.
   */
  coreSegments: string[]
  /** context as written in the title, for container searches */
  contextText: string
  balanced: boolean
}

export function normalizeTitleText(value: string): string {
  const lowered = value.normalize('NFKC').toLowerCase()
  let out = ''
  for (const character of lowered) out += ALNUM_RE.test(character) ? character : ' '
  return out.split(whitespaceRun).filter(Boolean).join(' ')
}

/** Split a title into top-level text and bracket blocks; null when delimiters do not balance. */
export function parseTitleSegments(value: string): TitleSegment[] | null {
  const normalized = value.normalize('NFKC')
  const segments: TitleSegment[] = []
  const stack: string[] = []
  let textStart = 0
  let blockStart = 0
  const characters = [...normalized]

  for (let index = 0; index < characters.length; index += 1) {
    const character = characters[index]
    if (character in DELIMITER_PAIRS) {
      if (stack.length === 0) {
        if (index > textStart) segments.push({ kind: 'text', text: characters.slice(textStart, index).join(''), pair: '' })
        blockStart = index
      }
      stack.push(character)
      continue
    }
    const opening = OPEN_BY_CLOSE[character]
    if (!opening) continue
    if (stack.length === 0 || stack[stack.length - 1] !== opening) return null
    stack.pop()
    if (stack.length === 0) {
      segments.push({ kind: 'block', text: characters.slice(blockStart + 1, index).join(''), pair: opening + character })
      textStart = index + 1
    }
  }

  if (stack.length > 0) return null
  if (textStart < characters.length) segments.push({ kind: 'text', text: characters.slice(textStart).join(''), pair: '' })
  return segments
}

function isClaimedMarker(segment: TitleSegment): boolean {
  if (segment.kind !== 'block' || segment.pair in TITLE_QUOTE_PAIRS) return false
  return markerOf(segment.text) !== null
}

export function analyzeTitle(value: string): TitleParts {
  const parsed = parseTitleSegments(value)
  if (parsed === null) {
    const text = value.normalize('NFKC').trim()
    return { core: normalizeTitleText(value), identity: '', context: '', coreSegments: text ? [text] : [], contextText: '', balanced: false }
  }

  // Claim first: any block the marker table recognizes carries no work identity
  // and never reaches the positional rules below.
  const unclaimed = parsed.filter((segment) => ALNUM_RE.test(segment.text) && !isClaimedMarker(segment))

  const core: string[] = []
  const identity: string[] = []
  const context: string[] = []
  let seenCore = false

  for (const segment of unclaimed) {
    if (segment.kind === 'text' || segment.pair in TITLE_QUOTE_PAIRS) {
      core.push(segment.text)
      seenCore = true
    } else if (segment.pair in IDENTITY_PAIRS && !seenCore) {
      identity.push(segment.text)
    } else if (segment.pair in CONTEXT_PAIRS && seenCore) {
      context.push(segment.text)
    }
  }

  if (core.length === 0) {
    // Block-only title. A lone block is read as the work; two or more unclaimed blocks
    // are creator + series with no work text (corpus census: 5,702 of 10,243 such titles),
    // so the first identity-family block keeps its creator reading and the core stays empty.
    identity.length = 0
    context.length = 0
    if (unclaimed.length === 1) core.push(unclaimed[0].text)
    else {
      const firstIdentity = unclaimed.find((segment) => segment.pair in IDENTITY_PAIRS)
      if (firstIdentity) identity.push(firstIdentity.text)
    }
  }

  const coreSegments = core.map((text) => text.split(whitespaceRun).filter(Boolean).join(' ')).filter(Boolean)
  const contextText = context.join(' ').split(whitespaceRun).filter(Boolean).join(' ')
  return {
    core: normalizeTitleText(coreSegments.join(' ')),
    identity: normalizeTitleText(identity.join(' ')),
    context: normalizeTitleText(contextText),
    coreSegments,
    contextText,
    balanced: true,
  }
}
