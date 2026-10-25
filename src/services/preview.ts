import { GM_addValueChangeListener, GM_openInTab, GM_removeValueChangeListener } from '$'
import { freshRequestIdOf, isFresh, isTraced, newRequestId, requestFor, requestIdOf, withDebugTrace, withRequestId, withWebLinksOnly, type PreviewAnswer, type PreviewRequest } from '@/core/source/preview'
import { debugLog, describeError, untraced, type Trace } from '@/services/debugLog'
import { settings } from '@/settings'
import { storageGet, storageKeys, storageRemove, storageSet } from '@/services/gmStorage'
import type { PreviewSite } from '@/services/previewSites'

/**
 * One storage key per request. The panel starts all its searches at once, and
 * a single shared list written read-modify-write loses every request but the
 * last one to be written: the other tabs then find no request and never answer.
 */
const REQUEST_PREFIX = 'ehl_preview_request_'
const requestKey = (id: string): string => `${REQUEST_PREFIX}${id}`
const answerKey = (id: string): string => `ehl_preview_answer_${id}`

/** How long the gallery page waits for the tab before closing it. */
const ANSWER_TIMEOUT_MS = 20_000

function parseRequest(raw: string | null): PreviewRequest | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as PreviewRequest
    return typeof parsed.id === 'string' && typeof parsed.key === 'string' && typeof parsed.at === 'number' ? parsed : null
  } catch {
    return null
  }
}

/** Every stored request; a page that lost its fragment has to look through them all. */
async function readAllRequests(): Promise<PreviewRequest[]> {
  const keys = (await storageKeys()).filter((key) => key.startsWith(REQUEST_PREFIX))
  const requests = await Promise.all(keys.map(async (key) => parseRequest(await storageGet(key))))
  return requests.filter((request): request is PreviewRequest => request !== null)
}

/**
 * The request this page answers: the one its fragment names, taken from the
 * fragment alone, or — for a page that lost it — the newest stored request
 * for its search.
 */
async function requestIdFor(here: URL, key: string): Promise<string | null> {
  const now = Date.now()
  if (requestIdOf(here) !== null) return freshRequestIdOf(here, now)
  return requestFor(await readAllRequests(), key, now)?.id ?? null
}

/** Requests left behind by a gallery page that closed before its tab answered. */
async function dropExpiredRequests(now: number): Promise<void> {
  for (const request of await readAllRequests()) {
    if (!isFresh(request, now)) await storageRemove(requestKey(request.id))
  }
}

function readAnswer(raw: string | null): PreviewAnswer | null {
  if (!raw) return null
  try {
    return withWebLinksOnly(JSON.parse(raw) as PreviewAnswer)
  } catch {
    return null
  }
}

/** Where a page writes its trace, if the reader turned the debug log on (gallery) or the request asks for one (a site's tab). */
function traceFor(id: string, enabled: boolean): Trace {
  return enabled ? (event, detail) => void debugLog(id, event, detail) : untraced
}

/**
 * Resolve with the tab's answer as soon as it is written: through the
 * manager's change event where it has one, by reading again every half second
 * where it does not. With the debug log on, both run, so the log tells a
 * change event that never came from an answer that was never written.
 */
function waitForAnswer(id: string, trace: Trace, closed: Promise<void>): Promise<PreviewAnswer | null> {
  const { promise, resolve } = Promise.withResolvers<PreviewAnswer | null>()
  let listener: string | number | undefined
  let poll: number | undefined
  const finish = (answer: PreviewAnswer | null): void => {
    window.clearTimeout(timer)
    window.clearInterval(poll)
    if (listener !== undefined) GM_removeValueChangeListener(listener)
    resolve(answer)
  }
  const timer = window.setTimeout(() => {
    trace('timeout', `${ANSWER_TIMEOUT_MS} ms without an answer`)
    finish(null)
  }, ANSWER_TIMEOUT_MS)
  // A tab closed under it will never answer; waiting out the timeout would only spin.
  void closed.then(() => finish({ status: 'closed', results: [] }))
  const hasListener = typeof GM_addValueChangeListener === 'function'
  if (hasListener) {
    listener = GM_addValueChangeListener(answerKey(id), (_name, _old, value, remote) => {
      trace('change event', `remote=${String(remote)} length=${typeof value === 'string' ? value.length : typeof value}`)
      finish(readAnswer(value as string))
    })
  }
  if (!hasListener || trace !== untraced) {
    poll = window.setInterval(() => {
      void storageGet(answerKey(id)).then((raw) => {
        const answer = readAnswer(raw)
        if (!answer) return
        trace('answer read by polling', hasListener ? 'the change event did not deliver it' : 'no change events in this manager')
        finish(answer)
      })
    }, 500)
  }
  return promise
}

function isLiveTab(tab: { closed: boolean }, result: PreviewAnswer | null): boolean {
  return result !== null && !tab.closed
}

/**
 * Open `url` — a search of `site` — in a background tab of the reader's own
 * browser, signed in and past any check they already passed, and bring back
 * what it shows. The gallery page closes the tab itself: a tab the manager
 * opened cannot always close itself with `window.close()`. Null when the tab
 * did not answer in time.
 */
export async function previewPage(site: PreviewSite, url: string): Promise<PreviewAnswer | null> {
  // An installed dev loader older than the current grant list hands the script
  // no GM API at all; say so instead of throwing.
  if (typeof GM_openInTab !== 'function') return { status: 'unavailable', results: [] }
  const key = site.searchOf(new URL(url))?.key ?? ''
  const now = Date.now()
  const id = newRequestId(now, Math.random().toString(36).slice(2, 8))
  const trace = traceFor(id, settings.debug)
  await dropExpiredRequests(now)
  await storageSet(requestKey(id), JSON.stringify({ id, key, at: now } satisfies PreviewRequest))
  trace('request stored', key)
  const closedEarly = Promise.withResolvers<void>()
  const answer = waitForAnswer(id, trace, closedEarly.promise)
  const target = withRequestId(url, id)
  const tab = GM_openInTab(trace === untraced ? target : withDebugTrace(target), { active: false, insert: true })
  trace('tab opened', target)
  let closing = false
  tab.onclose = () => {
    trace(closing ? 'tab closed' : 'tab closed by something else', `closed=${String(tab.closed)}`)
    if (!closing) closedEarly.resolve()
  }
  const result = await answer
  trace(result ? 'answer received' : 'gave up', result ? `${result.status}, ${result.results.length} results` : '')
  // A traced tab that never answered stays open, so its console can be read.
  if (isLiveTab(tab, result) || trace === untraced) {
    closing = true
    tab.close()
  }
  await storageRemove(requestKey(id))
  await storageRemove(answerKey(id))
  return result
}

/**
 * On one of a site's search pages: answer the gallery page's request for this
 * search, if it made one. A search the reader runs on their own carries no
 * fragment, so it costs one listing of the stored keys.
 */
export async function answerPreview(site: PreviewSite): Promise<void> {
  const here = new URL(location.href)
  const trace = traceFor(requestIdOf(here) ?? 'no fragment', isTraced(here))
  const asked = site.searchOf(here)
  if (!asked) {
    trace('not a search page', here.href)
    return
  }
  const id = await requestIdFor(here, asked.key)
  if (id === null) {
    trace('no request to answer', `key=${asked.key}`)
    return
  }
  trace('reading', `${site.id}${asked.blocked ? ' (blocked page)' : ''}`)
  let answer: PreviewAnswer
  try {
    answer = asked.blocked ? { status: 'blocked', results: [] } : await site.read(here, trace)
  } catch (error) {
    // A reader that throws would leave the gallery page spinning until it gives up.
    trace('read failed', describeError(error))
    answer = { status: 'unreadable', results: [] }
  }
  trace('read done', `${answer.status}, ${answer.results.length} results`)
  await storageSet(answerKey(id), JSON.stringify(answer))
  trace('answer written', `${answerKey(id)}`)
}
