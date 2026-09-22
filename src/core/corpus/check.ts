import { expect, test } from 'vitest'

export function defineCase<Input, Output>(
  name: string,
  evaluate: (input: Input) => Output,
  verify: (actual: Output, expected: Output) => void = (actual, expected) => {
    expect(actual).toEqual(expected)
  },
) {
  return (input: Input) => ({
    expect(expected: Output): void {
      test(`${name}: ${JSON.stringify(input)} → ${JSON.stringify(expected)}`, () => {
        verify(evaluate(input), expected)
      })
    },
  })
}
