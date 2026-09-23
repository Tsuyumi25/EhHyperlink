export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function isStrings(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string')
}

export function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === 'string'
}

export function isGalleryId(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
}

export function isNullableNumber(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isFinite(value))
}

export function isRating(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= 5
}

export function isNullableRating(value: unknown): value is number | null {
  return value === null || isRating(value)
}

export function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

export function isOptionalStrings(value: unknown): value is string[] | undefined {
  return value === undefined || isStrings(value)
}
