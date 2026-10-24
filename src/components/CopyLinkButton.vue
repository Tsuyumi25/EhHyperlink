<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { Check, Copy } from '@lucide/vue'
import { t, type MessageKey } from '@/i18n'

const props = withDefaults(defineProps<{ href: string; label?: MessageKey }>(), { label: 'copyLink' })

/** How long the tick stays after a copy, long enough to be seen without waiting on it. */
const COPIED_MS = 1500

const copied = ref(false)
let reset: ReturnType<typeof setTimeout> | undefined
// The search page writes the link as it served it; resolving it makes a pasted link work anywhere.
const url = computed(() => new URL(props.href, location.origin).href)

async function copy(): Promise<void> {
  await navigator.clipboard.writeText(url.value)
  copied.value = true
  clearTimeout(reset)
  reset = setTimeout(() => (copied.value = false), COPIED_MS)
}

onBeforeUnmount(() => clearTimeout(reset))
</script>

<template>
  <button
    type="button"
    class="ehl-copy"
    :class="{ 'ehl-copy--done': copied }"
    :title="copied ? t('linkCopied') : t(label)"
    :aria-label="copied ? t('linkCopied') : t(label)"
    @click="copy"
  >
    <Check v-if="copied" :size="12" aria-hidden="true" />
    <Copy v-else :size="12" aria-hidden="true" />
  </button>
</template>
