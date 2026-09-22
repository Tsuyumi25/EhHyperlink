import { expect } from 'vitest'
import { readWorkText } from '../title/chapter'
import { parseCjkNumeral } from '../title/cjkNumeral'
import { markerOf, type Marker } from '../title/titleMarkers'
import { analyzeTitle, type TitleParts } from '../title/titleStructure'
import { defineCase } from './check'

export const titleReads = defineCase<string, Partial<TitleParts>>(
  '標題結構',
  analyzeTitle,
  (actual, expected) => { expect(actual).toMatchObject(expected) },
)

export const workText = defineCase('作品文字', (title: string) => analyzeTitle(title).core)

export const workRuns = defineCase('搜尋文字段落', (title: string) => analyzeTitle(title).coreSegments)

export const wrappedSubtitles = defineCase<string, string[]>('wrapped subtitles', (title) => analyzeTitle(title).wrapped)

export const bracketsBalanced = defineCase<string, boolean>('brackets balanced', (title) => analyzeTitle(title).balanced)

export const blockMarker = defineCase<string, Marker | null>('block marker', markerOf)

export const numeralValue = defineCase<string, number | null>('numeral value', parseCjkNumeral)

export const workPhrase = defineCase<string, string>('work phrase', (text) => readWorkText(text).phrase)

export const partCounter = defineCase<string, string>('part counter', (text) => readWorkText(text).counter)

export const workAndPart = defineCase('作品與章號', readWorkText)

export const phraseInsideSegment = defineCase<string, boolean>('phrase inside segment', (segment) => segment.includes(readWorkText(segment).phrase))
