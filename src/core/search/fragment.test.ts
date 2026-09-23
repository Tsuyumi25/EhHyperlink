import { expect, it } from 'vitest'
import { fragmentsOf } from './fragment'

it('數字片段跨過空白取得可搜尋字元', () => {
  expect(fragmentsOf('20 甲乙')).toEqual(['20 甲', '甲乙'])
  expect(fragmentsOf('甲乙 25')).toEqual(['甲乙', '乙 25'])
})

it('標題尾端的年份保留三位數', () => {
  expect(fragmentsOf('甲乙2025')).toEqual(['甲乙', '025'])
})
