<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ tags: readonly string[] }>()

/**
 * The API hands tags over as `namespace:tag` in one flat list; the host page shows
 * them one namespace per line, and so do we. A tag with no colon keeps an empty
 * label, which is how a namespace-less tag reads there too.
 */
const groups = computed(() => {
  const byNamespace = new Map<string, string[]>()
  for (const tag of props.tags) {
    const colon = tag.indexOf(':')
    const namespace = colon === -1 ? '' : tag.slice(0, colon)
    const value = colon === -1 ? tag : tag.slice(colon + 1)
    const bucket = byNamespace.get(namespace)
    if (bucket) bucket.push(value)
    else byNamespace.set(namespace, [value])
  }
  return [...byNamespace].map(([namespace, values]) => ({ namespace, values }))
})
</script>

<template>
  <div class="ehl-tags">
    <div v-for="group in groups" :key="group.namespace" class="ehl-tags__row">
      <span class="ehl-tags__label">{{ group.namespace }}:</span>
      <span class="ehl-tags__cells">
        <span v-for="value in group.values" :key="value" class="ehl-tags__chip">{{ value }}</span>
      </span>
    </div>
  </div>
</template>
