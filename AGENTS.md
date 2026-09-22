# EhHyperlink — AI agent rules

Rules for AI coding assistants (Claude Code, Codex, Cursor, ...) working in
this repository. The document is in English; the code it describes is not —
see Language below.

## What this is

A userscript bundled by `vite-plugin-monkey` and injected into
`e-hentai.org` / `exhentai.org` gallery pages. It finds galleries related to
the one on screen — the same book in other languages, other books of the
series, the magazine a chapter came from, the chapters a magazine contains —
by structured analysis of gallery titles, and shows them as badges on the
title box.

The rules were derived from a census of the public
[URenko/e-hentai-db](https://github.com/URenko/e-hentai-db) SQLite snapshot
(4.9 million title strings, 2026-09). Numbers quoted in comments and in this
file come from that census.

## Scope — what the matcher promises and what it does not

- The target is "galleries with enough correct information find their
  relatives", not "every gallery is handled". Titles are maintained by
  people; the ehwiki `Renaming` grammar is the spec and rename petitions push
  the corpus toward it. Corpus census (2026-09): 99.4% of titles carry
  unwrapped work text; the 0.6% that do not (unbalanced brackets, block-only
  titles, digit-only titles) are bad samples and get no search.
- Do not add a rule for a single gallery. A rule earns its place with a
  corpus count: the marker table, the sequel-word list and the trailing
  numeral rules all cite how often the pattern occurs and how often it has a
  same-creator sibling. Rerun the census against the nightly snapshot before
  adding to a table.
- Do not add semantic judgement (LLM, embeddings) anywhere in the matching
  path. The whole point of the project is that structure + tables are enough
  for the maintained part of the corpus.
- A trailing run of one to three kanji that is not in the sequel-word list
  is a subtitle about half the time and a series marker the other half; such
  tokens are deliberately not stripped. `chapter.ts` lists the words the
  corpus does support.
- Only the current gallery is expanded into containers / chapters. Results
  are never expanded in turn.
- Direct discovery takes precedence over work matching. A `cosplayer:` source
  searches each cosplayer tag independently and excludes hits matching either
  complete source title; keep punctuation, counters and context in that
  comparison. Do not apply book similarity or creator verdicts to these hits.
- An `other:realporn` source uses `f_sh=on` and the exact same tag on every
  search. Without cosplayer tags, search raw leading identity blocks separately;
  without identity blocks, use the existing minimum fragments. Direct discovery
  uses tags or identity independently of usable work text, bypasses the
  container chain, and represents unscored results with `score: null`.

## Host page

We are a guest on someone else's document:

- The host DOM is a black box. Classes, `onclick` handlers, list-mode markup
  and API shapes were learned by observation; record what you learn in a
  comment, that knowledge cannot be recovered from our source.
- Never trust visible text for anything a page translator can rewrite. The
  category is read from the badge's `onclick` navigation target and `ct<N>`
  class (`src/core/eh/category.ts`); titles come from `#gn` / `#gj` and are
  re-fetched through the metadata API for candidates.
- Search pages: one `fetch` per quoted phrase or cosplayer tag, first page only,
  any of the five list display modes must parse. Metadata: `api.e-hentai.org` gdata,
  25 galleries per request, pause after 4 requests
  (https://ehwiki.org/wiki/API). The API sends CORS for both hosts, so plain
  `fetch` works; no `@connect` needed.
- The root element carries `translate="no"`; mount points read the host's
  painted background and border into `--ehl-bg` / `--ehl-border` so the box
  is opaque on both the light and the dark site.

## Readability

The next person to read a line matters more here than anything that line saves.
Two shapes are banned outright:

- **A condition that joins clauses.** An `&&` or `||` between two clauses, and
  above all a negated one, gets extracted into a predicate named for what it
  decides (Fowler, *Decompose Conditional*).
  `source.category !== CONTAINER_CATEGORY && !source.tags.includes(ANTHOLOGY_TAG)`
  makes the reader apply De Morgan to find out it means "not a Manga and not an
  anthology"; `inContainerChain(source)` states it. The predicate's doc comment
  is where the domain reason for each clause belongs — one clause is a category
  convention, the other is a tag, and the condition alone cannot say that.
  A predicate earns its name by joining clauses; wrapping one call does not.
  `source.tags.includes(ANTHOLOGY_TAG)` already reads as itself.
- **A boolean parameter**, and any parameter the callee can derive from what it
  already has. `planContainerSearch(source, hasLetters, terms, true)` tells the
  call site nothing, and `source` was already carrying the tag that `true` stood
  for.

The regex policy below is this same rule with a whole file's worth of syntax
behind it.

## Regex policy

- Regex syntax is written in exactly one file, `src/core/title/pattern.ts`.
  Everything else builds patterns with [magic-regexp](https://github.com/unjs/magic-regexp)
  (`exactly`, `anyOf`, `maybe`, `.times`, `.notAfter`, ...) and takes
  character classes from that file — magic-regexp's own `letter` / `digit` /
  `whitespace` / `wordBoundary` are ASCII and this corpus is mostly kana and
  CJK.
- `src/regexBudget.test.ts` enforces this: a regex literal, `new RegExp`, or
  an ASCII-class import outside `pattern.ts` fails the suite.
- Lay a rule out as one statement per named concept, chained with indentation
  that mirrors the grouping (see `chapter.ts`). Neither a one-line chain nor
  one constant per atom.
- Domain vocabulary (markers, sequel words, chapter labels) lives in tables
  and arrays, never inside a pattern string.

## Public repository — synthetic corpus with explained cases

The corpus describes title rules and their boundaries. Organizing cases by
rule and explaining expected outcomes lets maintainers compare cases,
identify the conditions that matter, and check for missing scenarios.

Consistent fictional stand-ins make creator, work and publication roles easy
to recognize and let cases vary one condition while holding the others
constant. Cases derived from real observations must preserve the structural
and textual features that affect behavior. Replacing names alone does not
increase test coverage.

Use these stand-ins consistently across tests, fixtures, comments, README
and commit messages:

- **No real gallery titles, circle names, artist names or gids** anywhere in
  the repo. Tests use invented stand-ins (`Circle Alpha`, `Work Beta`,
  `作品乙`, `COMIC Alphabeta Monthly`); the search-page fixture copies the
  live markup structure with made-up content. A name that merely sounds
  invented — a plausible two-word Japanese phrase — usually collides with a
  real work; stick to the Alpha/Beta/甲/乙 vocabulary.
- Convention names from the ehwiki table (`C104`, `例大祭`, `天狗様のお仕事`)
  and category / namespace names are fine; they are not works.
- No concrete tag values as examples beyond the namespace prefixes
  (`artist:`, `language:`, `other:rough translation`).
- Turn observed title and relationship cases into synthetic examples in
  `src/core/corpus/`. Preserve the structure that causes the behavior:
  brackets, markers, character classes, and any lengths or shared text that
  affect slicing or similarity. Keep real names and gallery identifiers out
  of both the sample and its explanation.
- Every case or group of cases must have a preceding comment explaining
  the rule being exercised and why the expected outcome follows. A shared
  explanation can cover adjacent cases of the same rule; explain separately
  when a case exercises a different boundary.
- Put title parsing and whole-phrase search planning in `wholePhrase.test.ts`,
  single-creator fragment search planning in `fixedRange.test.ts`, and result
  classification, grouping and ordering in `results.test.ts`. The container
  branch's planning and matching cases belong in `container.test.ts`; direct
  cosplayer/realporn planning and query cases belong in `directSearch.test.ts`.
- Write cases as standalone `operation(input).expect(expected)` calls, with
  blank lines and explanatory comments between groups. Do not wrap the cases
  in a shared array. Every `hit` / `hits` candidate must explicitly carry its
  synthetic `gid`, so expected results refer directly to visible input data.

## Language

- Identifiers, file names, type names: English.
- Comments: Traditional Chinese or English, nothing else. Explain the WHY;
  host-page quirks, corpus numbers and corpus case expectations count as WHY.
- Commit messages: Traditional Chinese, `type(scope): effect`. The subject
  states the effect, not the action; a body only for a real WHY.
- User-facing strings: through `src/i18n.ts` (en / zh / ja). A new key goes
  to all three.

## Architecture

- `src/core/title/` — how a title is read: bracket parser, marker table,
  chapter / sequel / numeral rules, `pattern.ts`
- `src/core/search/` — what to search and how a hit relates to the source:
  search plan, direct-discovery filtering, Manga container rules, edition-vs-series relation
- `src/core/rank/` — scoring, creator verdict, language detection, grouping
- `src/core/eh/` — talking to E-Hentai: search page, metadata API, URL,
  gallery page, category
- `src/core/pipeline.ts` — the flow only: plan → search → enrich → classify
  → group. No title logic here; add a module and call it.
- `src/settings.ts`, `src/components/` — settings store, badges, lists,
  settings popup
- Title and relationship tests live in `src/core/corpus/` under the rules
  above. Other tests sit next to the module they cover. The live site is
  checked by hand with a built script injected into a headless tab.

## Setup

```
pnpm install
pnpm dev        # dev server; the URL it prints installs into a script manager
pnpm build      # vue-tsc --noEmit && vite build → dist/eh-hyperlink.user.js
pnpm test       # vitest
```

Type checking runs `vue-tsc`, not bare `tsc` — the latter does not
understand `.vue` and reports phantom missing modules.
