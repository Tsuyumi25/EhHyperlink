/**
 * EH gallery category as the API names it (https://ehwiki.org/wiki/API), read from
 * the category badge element. The badge text is what a page translator rewrites,
 * so the value comes from the `onclick` navigation target (`…/manga`) first and
 * from the `ct<N>` class second; the visible text is the last resort.
 */

export const CATEGORY_BY_PATH: Record<string, string> = {
  doujinshi: 'Doujinshi',
  manga: 'Manga',
  artistcg: 'Artist CG',
  gamecg: 'Game CG',
  western: 'Western',
  'non-h': 'Non-H',
  imageset: 'Image Set',
  cosplay: 'Cosplay',
  asianporn: 'Asian Porn',
  misc: 'Misc',
}

/** `ct<N>` class suffix as EH assigns them in `.cs` / `.cn` badges. */
const CATEGORY_BY_CLASS: Record<string, string> = {
  ct1: 'Misc',
  ct2: 'Doujinshi',
  ct3: 'Manga',
  ct4: 'Artist CG',
  ct5: 'Game CG',
  ct6: 'Image Set',
  ct7: 'Cosplay',
  ct8: 'Asian Porn',
  ct9: 'Non-H',
  cta: 'Western',
}

function fromOnclick(onclick: string): string | null {
  const start = onclick.indexOf("document.location='")
  if (start === -1) return null
  const rest = onclick.slice(start + "document.location='".length)
  const path = rest.slice(0, rest.indexOf("'")).split('/').filter(Boolean).pop() ?? ''
  return CATEGORY_BY_PATH[path.toLowerCase()] ?? null
}

export function readCategory(element: Element | null): string {
  if (!element) return ''
  const byClick = fromOnclick(element.getAttribute('onclick') ?? '')
  if (byClick) return byClick
  for (const name of element.classList) {
    const byClass = CATEGORY_BY_CLASS[name]
    if (byClass) return byClass
  }
  return element.textContent?.trim() ?? ''
}
