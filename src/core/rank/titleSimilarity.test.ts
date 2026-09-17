import { describe, expect, it } from 'vitest'
import { galleryTitleSimilarity, SIMILARITY_THRESHOLD, titleSimilarity } from './titleSimilarity'

// Every title below is invented; each case keeps the structural shape of a corpus pattern.

describe('gallery title similarity', () => {
  it('keeps near-identical full titles', () => {
    const score = galleryTitleSimilarity(
      '[Circle Alpha] Work Beta - Sub Beta',
      '[サークル甲] 作品乙',
      '[Circle Alpha] Work Beta - Sub Beta -',
      '[サークル甲] 作品乙',
    )
    expect(score).toBeGreaterThanOrEqual(SIMILARITY_THRESHOLD)
  })

  it('keeps creator and work title across a romanization variant and a sequel suffix', () => {
    const score = galleryTitleSimilarity(
      '(C61) [Circle Beta] Alpharakuyou (Series Beta)',
      '(C61) [サークル乙] 作品甲 (系列乙)',
      '[Circle Beta] Betarakuyou (Series Beta / Series Beta EN)',
      '[サークル乙] 作品甲 其の弐 (系列乙)',
    )
    expect(score).toBeGreaterThanOrEqual(SIMILARITY_THRESHOLD)
  })

  it('rejects unrelated full titles sharing a short phrase', () => {
    const score = galleryTitleSimilarity(
      "[Circle Alpha] Work Alpha (Series Alpha!!) [Thai ภาษาไทย] [Someone] [Decensored]",
      "[サークル甲] Work Alpha (Series Alpha!!) [タイ翻訳] [無修正]",
      "[Someone Else] Work Alpha: The Longer Version Explained [Norwegian]",
      '',
    )
    expect(score).toBeLessThan(SIMILARITY_THRESHOLD)
  })

  it('rejects the same core under conflicting creator structure', () => {
    const score = titleSimilarity(
      '(C70) [Gamma Lab (Gamma)] Work Kiss (Kiss Series)',
      '(C70) [Delta Seisaku (Delta Person)] Work Kiss. (KissSeries)',
    )
    expect(score).toBeLessThan(SIMILARITY_THRESHOLD)
  })

  it('rejects a candidate missing the source creator identity', () => {
    const score = galleryTitleSimilarity('[Artist Alpha] pixiv fanbox gallery', '[作者甲] pixiv fanbox', 'dum pixiv Fanbox Gallery', '')
    expect(score).toBe(0)
  })

  it('rejects shared secondary boilerplate without primary support', () => {
    const score = galleryTitleSimilarity('Person Alpha [AI Generated]', "Alpha's AI (alphaai)", "Beta's Mom [AI Generated]", "Alpha's AI (alphaai)")
    expect(score).toBe(0)
  })

  it('rejects AI-generated gallery relationships whichever bracket carries the marker', () => {
    const score = galleryTitleSimilarity(
      'person alpha [AI Generated]',
      '[Alpha PATREON更新中] & 12345678',
      '[Beta] person alpha(75p) (Patreon) (AI Generated)',
      '',
    )
    expect(score).toBe(0)
  })

  it('accepts swapped title field alignment', () => {
    const score = galleryTitleSimilarity('[Circle] Work Title', '[サークル] 作品名', '[サークル] 作品名', '[Circle] Work Title')
    expect(score).toBe(1)
  })

  it('matches a platform-prefixed source against a bare creator edition', () => {
    const score = galleryTitleSimilarity('[Pixiv] [Artistalpha] Work Beta (Series Gamma)', '', '[Artistalpha.] Work Beta [Spanish] [Some Scans]', '')
    expect(score).toBeGreaterThanOrEqual(SIMILARITY_THRESHOLD)
  })

  it('treats a short CJK work name with and without a space before its counter as one series', () => {
    const score = galleryTitleSimilarity('[サークル甲] 作品乙 18 (系列甲)', '', '[サークル甲] 作品乙18 SS (系列甲)', '', 'same')
    expect(score).toBeGreaterThanOrEqual(SIMILARITY_THRESHOLD)
  })
})
