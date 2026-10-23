/**
 * Sites that answer `/favicon.ico` with 404 and declare their icon in the
 * page head instead (checked 2026-10).
 */
const DECLARED_ICONS: Record<string, string> = {
  'https://www.dlsite.com': 'https://www.dlsite.com/images/web/common/favicon.ico',
}

/**
 * The site's own icon, asked of that site alone (callers load it without a
 * referrer): an icon service would learn every domain the reader's searches
 * touch. A site that keeps its icon elsewhere and is not listed
 * above shows none.
 */
export function faviconUrl(href: string): string | null {
  let origin: string
  try {
    origin = new URL(href).origin
  } catch {
    return null
  }
  return DECLARED_ICONS[origin] ?? `${origin}/favicon.ico`
}
