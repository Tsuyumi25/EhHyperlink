<script setup lang="ts">
import { computed } from 'vue'
import { markKeywords } from '@/core/source/highlight'

/** `text` with the runs matching `words` (from `matchWords`) marked, as a search engine bolds its query. */
const props = defineProps<{ text: string; words: readonly string[] }>()
const parts = computed(() => markKeywords(props.text, props.words))
</script>

<template>
  <template v-for="(part, index) in parts" :key="index">
    <mark v-if="part.hit" class="ehl-mark">{{ part.text }}</mark>
    <template v-else>{{ part.text }}</template>
  </template>
</template>

<style>
/* Titles are already bold; a tint marks the match in them as in plain text. */
.ehl-mark {
  padding: 0 1px;
  font-weight: 700;
  color: inherit;
  background: color-mix(in srgb, currentColor 16%, transparent);
  border-radius: 2px;
}
</style>
