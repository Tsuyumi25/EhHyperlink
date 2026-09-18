import { describe, expect, it } from 'vitest'
import { markerOf } from './titleMarkers'
import { analyzeTitle, DELIMITER_PAIRS } from './titleStructure'

// Every title below is invented; only the bracket structure matters.

describe('structural title cleaning', () => {
  it('recognizes fullwidth and corner bracket variants', () => {
    expect(analyzeTitle('［Circle］ 「Work Title」 （Series） ［English］').core).toBe('work title')
  })

  it('preserves title quote contents', () => {
    expect(analyzeTitle('『人生』 《第二章》').core).toBe('人生 第二章')
  })

  it('discards nested identity metadata', () => {
    expect(analyzeTitle('[Circle (Artist)] Work Title').core).toBe('work title')
  })

  it('keeps block-only and unbalanced titles conservative', () => {
    expect(analyzeTitle('[Only Title]').core).toBe('only title')
    expect(analyzeTitle('[Broken Title').core).toBe('broken title')
    expect(analyzeTitle('[Broken Title').balanced).toBe(false)
  })

  it('round-trips every supported delimiter pair', () => {
    for (const [opening, closing] of Object.entries(DELIMITER_PAIRS)) {
      expect(analyzeTitle(`${opening}Only Title${closing}`).core, opening + closing).toBe('only title')
    }
  })

  it('keeps each run of top-level text apart, as written', () => {
    const parts = analyzeTitle("[Circle Alpha] Work Alpha (Series Alpha!!) [Thai ภาษาไทย] [Decensored]")
    expect(parts.coreSegments).toEqual(['Work Alpha'])
    expect(parts.core).toBe('work alpha')
    expect(parts.contextText).toBe('Series Alpha!!')
  })

  it('never joins two runs a bracket block separated', () => {
    // the title wrote `Work Alpha` before the block and `7.6 MB` after it, so no
    // gallery carries the two side by side and no phrase may put them there
    const parts = analyzeTitle('[Circle Alpha] Work Alpha (Series Beta) [Chinese] [DL版]7.6 MB')
    expect(parts.coreSegments).toEqual(['Work Alpha', '7.6 MB'])
  })

  it('drops a block the same mark wrapped tightly, keeping it out of search only', () => {
    // subtitle, part name, platform tag, scanlator signature — never the work
    expect(analyzeTitle('[Circle Alpha] Work Beta ~作品乙~').coreSegments).toEqual(['Work Beta'])
    expect(analyzeTitle('[Circle Alpha] Work Beta -Gamma-').coreSegments).toEqual(['Work Beta'])
    expect(analyzeTitle('[Circle Alpha] ★Signature★ Work Beta').coreSegments).toEqual(['Work Beta'])
    // scoring still sees the whole written work text
    expect(analyzeTitle('[Circle Alpha] Work Beta ~作品乙~').core).toBe('work beta 作品乙')
  })

  it('keeps a wrapper that is the whole work text', () => {
    expect(analyzeTitle('[Circle Alpha] ~作品乙~').coreSegments).toEqual(['~作品乙~'])
    expect(analyzeTitle('[Circle Alpha] -Work Beta-').coreSegments).toEqual(['-Work Beta-'])
  })

  it('leaves a mark that separates rather than wraps', () => {
    // loose spacing marks a separator, and `|` splits translated titles
    expect(analyzeTitle('[Circle Alpha] Work Beta - Gamma -').coreSegments).toEqual(['Work Beta - Gamma -'])
    expect(analyzeTitle('[Circle Alpha] Work Beta | 作品乙').coreSegments).toEqual(['Work Beta | 作品乙'])
  })
})

describe('marker claiming', () => {
  it('never lets a platform block become creator identity', () => {
    const parts = analyzeTitle('[Pixiv] [Artist Alpha] Alpha-sensei (Series Beta -Serib-) [Chinese] [某某個人翻譯]')
    expect(parts.identity).toBe('artist alpha')
    expect(parts.core).toBe('alpha sensei')
    expect(parts.context).toBe('series beta serib')
  })

  it('reads creator plus series with no work text as an empty core', () => {
    const parts = analyzeTitle('[Circle Beta] (Series Beta)')
    expect(parts.identity).toBe('circle beta')
    expect(parts.core).toBe('')
    expect(parts.context).toBe('')
  })

  it('claims event and translator markers in any bracket', () => {
    const parts = analyzeTitle('[C81] Work Title [Japanese] (某某汉化组)')
    expect(parts.identity).toBe('')
    expect(parts.context).toBe('')
    expect(parts.core).toBe('work title')
  })

  it('requires digits then a boundary after an event stem', () => {
    expect(markerOf('SC2016 Winter')?.role).toBe('event')
    expect(markerOf("Bang Dreamer's Party! 4th Stage")?.role).toBe('event')
    expect(markerOf('C104 Day 2')?.role).toBe('event')
    expect(markerOf('FF7SFM')).toBeNull()
    expect(markerOf('C17H18F3NO')).toBeNull()
  })

  it('names the language a marker indicates', () => {
    expect(markerOf('英訳')?.lang).toBe('english')
    expect(markerOf('中国翻訳')?.lang).toBe('chinese')
    expect(markerOf('Thai ภาษาไทย')?.lang).toBe('thai')
    expect(markerOf('Decensored')?.lang).toBeUndefined()
  })
})
