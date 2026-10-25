import { describe, expect, it } from 'vitest'
import { readTagNames } from './tagNames'

describe('readTagNames', () => {
  it('keys tags by namespace and reads namespace names from rows', () => {
    const db = {
      data: [
        { namespace: 'rows', data: { female: { name: '女性', intro: '', links: '' } } },
        { namespace: 'female', data: { 'some tag': { name: '某标签', intro: '說明', links: '' }, blank: { name: '' } } },
      ],
    }
    expect(readTagNames(db)).toEqual({ namespaces: { female: '女性' }, tags: { 'female:some tag': '某标签' } })
  })

  // A changed release format reads as no names, not as a half-read table.
  it('rejects a file without the release shape', () => {
    expect(readTagNames({ data: [{ namespace: 'female' }] })).toBeNull()
    expect(readTagNames([])).toBeNull()
  })
})
