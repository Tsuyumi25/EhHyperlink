import { GM_addValueChangeListener, GM_openInTab, GM_removeValueChangeListener } from '$'
import { readGoogleResults } from '@/core/source/googleResults'
import { isFresh, requestFor, searchKey, searchOf, type PreviewAnswer, type PreviewRequest } from '@/core/source/preview'
import { storageGet, storageRemove, storageSet } from '@/services/gmStorage'

const REQUESTS_KEY = 'ehl_preview_requests_v1'
const answerKey = (id: string): string => `ehl_preview_answer_${id}`

/** How long the gallery page waits for the tab before closing it. */
const ANSWER_TIMEOUT_MS = 20_000
/** How long the Google tab waits for results to render. */
const RENDER_TIMEOUT_MS = 8_000

async function readRequests(): Promise<PreviewRequest[]> {
  const raw = await storageGet(REQUESTS_KEY)
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as PreviewRequest[]) : []
  } catch {
    return []
  }
}

function readAnswer(raw: string | null): PreviewAnswer | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as PreviewAnswer
  } catch {
    return null
  }
}

/**
 * Resolve with the tab's answer as soon as it is written: through the
 * manager's change event where it has one, by reading again every half second
 * where it does not.
 */
function waitForAnswer(id: string): Promise<PreviewAnswer | null> {
  const { promise, resolve } = Promise.withResolvers<PreviewAnswer | null>()
  let listener: string | number | undefined
  let poll: number | undefined
  const finish = (answer: PreviewAnswer | null): void => {
    window.clearTimeout(timer)
    window.clearInterval(poll)
    if (listener !== undefined) GM_removeValueChangeListener(listener)
    resolve(answer)
  }
  const timer = window.setTimeout(() => finish(null), ANSWER_TIMEOUT_MS)
  if (typeof GM_addValueChangeListener === 'function') {
    listener = GM_addValueChangeListener(answerKey(id), (_name, _old, value) => finish(readAnswer(value as string)))
    return promise
  }
  poll = window.setInterval(() => {
    void storageGet(answerKey(id)).then((raw) => {
      const answer = readAnswer(raw)
      if (answer) finish(answer)
    })
  }, 500)
  return promise
}

/**
 * Open the search in a background tab of the reader's own browser — signed in,
 * past any consent page they already accepted — and bring back what the page
 * shows. Null when the tab did not answer in time.
 */
export async function previewGoogle(url: string): Promise<PreviewAnswer | null> {
  // An installed dev loader older than the current grant list hands the script
  // no GM API at all; say so instead of throwing.
  if (typeof GM_openInTab !== 'function') return { status: 'unavailable', results: [] }
  const key = searchKey(new URL(url)) ?? ''
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
  const now = Date.now()
  const requests = (await readRequests()).filter((request) => isFresh(request, now))
  requests.push({ id, key, at: now })
  await storageSet(REQUESTS_KEY, JSON.stringify(requests))
  const answer = waitForAnswer(id)
  const tab = GM_openInTab(url, { active: false, insert: true })
  const result = await answer
  tab.close()
  await storageRemove(answerKey(id))
  return result
}

/** Wait for the first result title to render, at most `RENDER_TIMEOUT_MS`. */
async function renderedResults(): Promise<void> {
  const started = Date.now()
  while (!document.querySelector('#search a h3')) {
    if (Date.now() - started > RENDER_TIMEOUT_MS) return
    const { promise, resolve } = Promise.withResolvers<void>()
    window.setTimeout(resolve, 250)
    await promise
  }
}

/**
 * On a Google search page: answer the gallery page's request for this search,
 * if it made one. Any other Google search the reader runs is left alone after
 * one storage read.
 */
export async function answerGooglePreview(): Promise<void> {
  const asked = searchOf(new URL(location.href))
  if (!asked) return
  const request = requestFor(await readRequests(), asked.key, Date.now())
  if (!request) return
  if (asked.blocked) {
    await storageSet(answerKey(request.id), JSON.stringify({ status: 'blocked', results: [] } satisfies PreviewAnswer))
    return
  }
  await renderedResults()
  const results = readGoogleResults(document)
  const answer: PreviewAnswer = { status: results.length > 0 ? 'ok' : 'empty', results }
  await storageSet(answerKey(request.id), JSON.stringify(answer))
}
