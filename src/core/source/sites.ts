import type { SearchTerm, TermKind } from './terms'

export interface SearchSite {
  id: string
  name: string
  /** the search for this term; sites with separate work and creator searches pick by `term.kind` */
  url: (term: SearchTerm) => string
}

const encode = encodeURIComponent

/** A quoted phrase, so the engine keeps the term whole instead of matching its words apart. */
function phrase(text: string): string {
  return encode(`"${text}"`)
}

function isCreator(kind: TermKind): boolean {
  return kind !== 'work'
}

/** Melonbooks narrows one search box by `text_type`; `all` is its default for a title. */
const MELONBOOKS_TEXT_TYPE: Record<TermKind, string> = {
  work: 'all',
  circle: 'maker',
  artist: 'author',
}

const GOOGLE: SearchSite = {
  id: 'google',
  name: 'Google',
  url: (term) => `https://www.google.com/search?q=${phrase(term.text)}`,
}

/**
 * Store and profile searches offered as links, every site for every
 * term. Each URL shape was observed on the live site (2026-10): the DLsite
 * `fsr` keyword path, FANZA's `searchstr` segment (served behind its age check,
 * which redirects back), the Toranoana adult catalogue (`tora_r`), Melonbooks'
 * `text_type` switch, Ci-en's search (article mode by default), Misskey's note
 * search route (`q`), and X's latest-first search (`f=live`). pixiv and Fantia
 * keep works and creators apart: pixiv's artwork search (`tag_tc`) against its
 * user search (`s_mode=s_usr`), Fantia's `/products` against `/fanclubs`
 * (`keyword`, both signed-in only).
 */
export const SEARCH_SITES: readonly SearchSite[] = [
  {
    id: 'dlsite',
    name: 'DLsite',
    // A space in the keyword path must be `+`: DLsite answers `%20` there with 403
    // (checked 2026-10), and reads `+` as the space its own search form sends.
    url: (term) => `https://www.dlsite.com/maniax/fsr/=/keyword/${encode(term.text).replaceAll('%20', '+')}/`,
  },
  {
    id: 'fanza',
    name: 'FANZA',
    url: (term) => `https://www.dmm.co.jp/dc/doujin/-/list/search/=/searchstr=${encode(term.text)}/`,
  },
  {
    id: 'melonbooks',
    name: 'Melonbooks',
    url: (term) => `https://www.melonbooks.co.jp/search/search.php?name=${encode(term.text)}&text_type=${MELONBOOKS_TEXT_TYPE[term.kind]}`,
  },
  {
    id: 'toranoana',
    name: 'Toranoana',
    url: (term) => `https://ec.toranoana.jp/tora_r/ec/app/catalog/list?searchWord=${encode(term.text)}`,
  },
  {
    id: 'booth',
    name: 'BOOTH',
    url: (term) => `https://booth.pm/ja/search/${encode(term.text)}`,
  },
  {
    id: 'pixiv',
    name: 'pixiv',
    // A work goes to the artwork search over tags, title and caption at once
    // (`tag_tc`), where a sample post carries the book's title; a circle or
    // artist goes to the user search.
    url: (term) =>
      isCreator(term.kind)
        ? `https://www.pixiv.net/search/users?nick=${encode(term.text)}&s_mode=s_usr`
        : `https://www.pixiv.net/search?q=${encode(term.text)}&s_mode=tag_tc&type=artwork&r=1`,
  },
  {
    id: 'ci-en',
    name: 'Ci-en',
    url: (term) => `https://ci-en.dlsite.com/search?keyword=${encode(term.text)}`,
  },
  {
    id: 'fantia',
    name: 'Fantia',
    url: (term) => `https://fantia.jp/${isCreator(term.kind) ? 'fanclubs' : 'products'}?keyword=${encode(term.text)}`,
  },
  {
    id: 'x',
    name: 'X',
    url: (term) => `https://x.com/search?q=${phrase(term.text)}&f=live`,
  },
  {
    // misskey.io: the largest Japanese instance, where circles announce new books
    id: 'misskey',
    name: 'Misskey',
    url: (term) => `https://misskey.io/search?q=${encode(term.text)}`,
  },
  GOOGLE,
]
