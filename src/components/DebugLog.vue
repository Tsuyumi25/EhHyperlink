<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { t } from '@/i18n'
import { clearDebugLog, readDebugLog, type DebugEntry } from '@/services/debugLog'

/** How often the open log reads the entries again; the tabs keep writing while it is shown. */
const REFRESH_MS = 1000

const entries = ref<DebugEntry[]>([])

async function refresh(): Promise<void> {
  entries.value = await readDebugLog()
}

const timer = window.setInterval(() => void refresh(), REFRESH_MS)
onBeforeUnmount(() => window.clearInterval(timer))
void refresh()

/** Entries grouped by request, each with times counted from its own first entry. */
const requests = computed(() => {
  const groups = new Map<string, DebugEntry[]>()
  for (const entry of entries.value) groups.set(entry.id, [...(groups.get(entry.id) ?? []), entry])
  return [...groups].map(([id, list]) => ({ id, start: list[0].at, entries: list }))
})

function asText(): string {
  return requests.value
    .map(({ id, start, entries: list }) =>
      [`# ${id} ${new Date(start).toISOString()}`, ...list.map((entry) => `+${entry.at - start}ms ${entry.where} ${entry.event} ${entry.detail}`)].join('\n'),
    )
    .join('\n\n')
}

async function copy(): Promise<void> {
  await navigator.clipboard.writeText(asText())
}

async function clear(): Promise<void> {
  await clearDebugLog()
  await refresh()
}
</script>

<template>
  <div class="ehl-debug">
    <div class="ehl-debug__actions">
      <button type="button" class="ehl-pages__more" @click="copy">{{ t('debugCopy') }}</button>
      <button type="button" class="ehl-pages__more" @click="clear">{{ t('debugClear') }}</button>
    </div>
    <p v-if="requests.length === 0" class="ehl-pages__note">{{ t('debugEmpty') }}</p>
    <section v-for="request in requests" :key="request.id" class="ehl-debug__request">
      <h4 class="ehl-debug__id">{{ request.id }}</h4>
      <table>
        <tr v-for="(entry, index) in request.entries" :key="index">
          <td class="ehl-debug__time">+{{ entry.at - request.start }}ms</td>
          <td class="ehl-debug__where">{{ entry.where }}</td>
          <td class="ehl-debug__event">{{ entry.event }}</td>
          <td class="ehl-debug__detail">{{ entry.detail }}</td>
        </tr>
      </table>
    </section>
  </div>
</template>

<style>
.ehl-debug__actions {
  display: flex;
  gap: 6px;
}
.ehl-debug__actions .ehl-pages__more {
  margin: 0;
}
.ehl-debug__request {
  margin-top: 8px;
}
.ehl-debug__id {
  margin: 0 0 2px;
  font-size: 11px;
}
.ehl-debug table {
  border-collapse: collapse;
  font-family: monospace;
  font-size: 11px;
}
.ehl-debug td {
  padding: 0 8px 0 0;
  vertical-align: top;
}
.ehl-debug__time {
  text-align: right;
  white-space: nowrap;
  opacity: 0.7;
}
.ehl-debug__where {
  white-space: nowrap;
  opacity: 0.7;
}
.ehl-debug__event {
  font-weight: 700;
  white-space: nowrap;
}
.ehl-debug__detail {
  word-break: break-all;
}
</style>
