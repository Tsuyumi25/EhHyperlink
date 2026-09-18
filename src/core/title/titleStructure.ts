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
  /**
   * The ASCII pair is rare (1,454 fields) and unbalanced in 255 of them, almost
   * all `<3` and `->`. Those become bad samples, which is what the balance rule
   * already does with an unclosed bracket; the 1,220 balanced ones are worth it.
   */
  '<': '>',
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
/**
 * Context blocks: a parody, a note, a marker — never the work title itself, and
 * the marker table is allowed to claim them.
 *
 * The angle brackets belong here rather than with the title quotes. `〈…〉` holds
 * a marker in the corpus (842 pairs: `2d图集` 47, `前編` 42, `後編` 36, `第1話` 24,
 * `総集編` 18), and so does the ASCII `<…>` (1,220 pairs, 710 of them the
 * AI-generated marker) — while `《…》` holds the work title itself (2,894 pairs,
 * its top entries are work names) and stays a title quote. Reading them as title
 * text put the marker into a search phrase, and kept it out of reach of the
 * marker table, which skips title quotes on purpose.
 */
const CONTEXT_PAIRS: Record<string, true> = {
  '()': true,
  '<>': true,
  '〈〉': true,
  '︵︶': true,
  '⟮⟯': true,
  '₍₎': true,
  '﹙﹚': true,
  '﴿﴾': true,
}
const TITLE_QUOTE_PAIRS: Record<string, true> = {
  '「」': true,
  '『』': true,
  '《》': true,
  '〝〟': true,
  '❬❭': true,
  '❰❱': true,
  '⟨⟩': true,
  '⟪⟫': true,
  '༺༻': true,
}

const ALNUM_RE = compile(anyOf(letter, unicode('N')))

/**
 * Marks that wrap a block by appearing twice rather than as an opening and a
 * closing form. What they wrap is a subtitle, a part name, a platform tag or a
 * scanlator signature — never the work itself — so a search phrase drops it.
 *
 * Corpus: 226,601 titles carry a mark exactly twice with text between, and the
 * three conditions below narrow that to 170,287. Marks left out: `"` wraps the
 * work and puts the creator outside it (`"…" by …`, 4,121 cases), while `|` `/`
 * `+` `–` are separators, wrapping tightly in only 1.3% / 13.4% / 3.1% / 3.4%
 * of their occurrences. `&` is out too: its 1,445 tight cases are an artefact of
 * undecoded `&#039;` entities.
 */
const MIRRORED_MARKS = '-~～〜―－●★◆=*❤♥'

/** ehwiki: a translated title follows the original after a spaced vertical bar. */
export const TITLE_BAR = ' | '

/**
 * The wrapped block out of one run of text, collecting what was wrapped.
 *
 * Three conditions, each measured: the mark appears exactly twice and opens on a
 * word boundary; it sits tight against what it wraps, which is what tells a
 * wrapper from a separator (76.2% of candidates); and text survives outside it,
 * because in 1.4% of cases the wrapper is the whole title (`~作品乙~`,
 * `-Work Beta-`, `★作品丙★`) and dropping it would leave nothing.
 *
 * Only a block before the bar is collected. The translated half wraps the
 * translation of the same subtitle (`~副題甲~` / `~Subtitle Alpha~`), so it
 * varies release to release; 2.7% of barred titles wrap on both sides.
 */
function stripMirroredBlocks(text: string, wrapped: string[]): string {
  let out = text
  for (const mark of MIRRORED_MARKS) {
    const first = out.indexOf(mark)
    const last = out.lastIndexOf(mark)
    if (first === -1 || first === last || out.indexOf(mark, first + 1) !== last) continue
    // the opening mark starts a token and the closing one ends one
    if (first > 0 && ALNUM_RE.test(out.slice(first - 1, first))) continue
    const afterLast = out.slice(last + 1, last + 2)
    if (afterLast && ALNUM_RE.test(afterLast)) continue
    const inner = out.slice(first + 1, last)
    if (!ALNUM_RE.test(inner) || inner !== inner.trim()) continue
    const outside = (out.slice(0, first) + ' ' + out.slice(last + 1)).trim()
    if (!ALNUM_RE.test(outside)) continue
    const bar = out.indexOf(TITLE_BAR)
    if (bar === -1 || first < bar) wrapped.push(inner)
    out = outside
  }
  return out
}

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
  /**
   * What a mirrored mark wrapped in the original half of the title: a subtitle
   * that is sometimes the only thing separating two books of one series.
   */
  wrapped: string[]
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
    return { core: normalizeTitleText(value), identity: '', context: '', coreSegments: text ? [text] : [], wrapped: [], contextText: '', balanced: false }
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

  const written = core.map((text) => text.split(whitespaceRun).filter(Boolean).join(' ')).filter(Boolean)
  // the wrapped block leaves `core` alone: scoring compares the whole work text,
  // while a search phrase drops what the marks wrapped
  const wrapped: string[] = []
  const coreSegments = written.map((text) => stripMirroredBlocks(text, wrapped)).filter(Boolean)
  const contextText = context.join(' ').split(whitespaceRun).filter(Boolean).join(' ')
  return {
    core: normalizeTitleText(written.join(' ')),
    identity: normalizeTitleText(identity.join(' ')),
    context: normalizeTitleText(contextText),
    coreSegments,
    wrapped,
    contextText,
    balanced: true,
  }
}
