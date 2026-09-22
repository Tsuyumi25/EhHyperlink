import { expect } from 'vitest'
import { planSearch, type SearchPlan } from '../search/searchPlan'
import { defineCase } from './check'
import { gallery, type GalleryInput } from './gallery'

export const search = defineCase<GalleryInput, Partial<SearchPlan>>(
  '搜尋計畫',
  (input) => planSearch(gallery(input)),
  (actual, expected) => { expect(actual).toMatchObject(expected) },
)
