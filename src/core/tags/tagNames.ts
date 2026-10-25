import { isRecord } from '../eh/validation'

/**
 * Chinese names for E-Hentai tags from EhTagTranslation's database
 * (`db.text.json`, the plain-text release), reduced to the names alone. The
 * `rows` section names the namespaces themselves (`female` → `女性`).
 */
export interface TagNames {
  namespaces: Record<string, string>
  /** by `namespace:tag`, as galleries list their tags */
  tags: Record<string, string>
}

const NAMESPACE_SECTION = 'rows'

function nameOf(entry: unknown): string | null {
  return isRecord(entry) && typeof entry.name === 'string' && entry.name ? entry.name : null
}

/** The names in a parsed `db.text.json`; null when it does not have the release's shape. */
export function readTagNames(db: unknown): TagNames | null {
  if (!isRecord(db) || !Array.isArray(db.data)) return null
  const names: TagNames = { namespaces: {}, tags: {} }
  for (const section of db.data) {
    if (!isRecord(section) || typeof section.namespace !== 'string' || !isRecord(section.data)) return null
    const namespace = section.namespace
    for (const [raw, entry] of Object.entries(section.data)) {
      const name = nameOf(entry)
      if (name === null) continue
      if (namespace === NAMESPACE_SECTION) names.namespaces[raw] = name
      else names.tags[`${namespace}:${raw}`] = name
    }
  }
  return names
}
