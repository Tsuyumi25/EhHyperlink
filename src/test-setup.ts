/**
 * `vite-plugin-monkey` replaces `__MONKEY_WINDOW_KEY__` at build time, and its
 * `$` module reads it at import time. Anything that reaches `gmStorage` — the
 * settings store, the response cache — pulls that module in, so a unit test of a
 * pure parser two imports away would fail on a missing global.
 */
;(globalThis as Record<string, unknown>).__MONKEY_WINDOW_KEY__ = 'ehl-test'
