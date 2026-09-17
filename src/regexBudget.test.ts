import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Regex policy: regex syntax is written in exactly one place, `core/title/pattern.ts`.
 * Every other file expresses patterns through magic-regexp builders plus the
 * Unicode inputs from `core/title/pattern.ts`, never a regex literal or `new RegExp`.
 * magic-regexp's own character classes are ASCII (`letter` = [a-zA-Z], `digit` = \d,
 * `whitespace` = \s, `word*` = \b / \w) and are off limits outside pattern.ts.
 */
const REGEX_HOME = 'core/title/pattern.ts'
const ASCII_INPUTS = ['letter', 'digit', 'whitespace', 'word', 'wordChar', 'wordBoundary', 'not', 'char']

const SRC = dirname(fileURLToPath(import.meta.url))

function* sourceFiles(directory: string): Generator<string> {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry)
    if (statSync(path).isDirectory()) yield* sourceFiles(path)
    else if ((path.endsWith('.ts') || path.endsWith('.vue')) && !path.endsWith('.test.ts')) yield path
  }
}

/** Regex literals at the positions this codebase could use (`= /`, `(/`, `, /`). */
function regexLiterals(source: string): string[] {
  const found: string[] = []
  const openers = ['= ', '(', ', ']
  for (let index = 0; index < source.length; index += 1) {
    if (source[index] !== '/') continue
    const before = source.slice(Math.max(0, index - 2), index)
    if (!openers.some((opener) => before.endsWith(opener))) continue
    if (source[index + 1] === '/' || source[index + 1] === '*') continue
    let end = index + 1
    while (end < source.length && source[end] !== '/' && source[end] !== '\n') {
      if (source[end] === '\\') end += 1
      end += 1
    }
    if (source[end] !== '/') continue
    found.push(source.slice(index, end + 1))
    index = end
  }
  return found
}

describe('regex budget', () => {
  it('keeps regex syntax inside core/title/pattern.ts and ASCII classes out of rule files', () => {
    const offenders: string[] = []
    for (const file of sourceFiles(SRC)) {
      const relative = file.slice(SRC.length + 1)
      if (relative === REGEX_HOME) continue
      const source = readFileSync(file, 'utf-8')
      for (const literal of regexLiterals(source)) offenders.push(`${relative}: ${literal}`)
      if (source.includes('new RegExp(')) offenders.push(`${relative}: new RegExp(...)`)
      for (const line of source.split('\n')) {
        if (!line.includes("from 'magic-regexp'")) continue
        const names = line.slice(line.indexOf('{') + 1, line.indexOf('}')).split(',').map((name) => name.trim().split(' ')[0])
        for (const name of names) if (ASCII_INPUTS.includes(name)) offenders.push(`${relative}: imports ASCII '${name}' from magic-regexp`)
      }
    }
    expect(offenders).toEqual([])
  })
})
