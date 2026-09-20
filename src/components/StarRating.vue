<script setup lang="ts">
import { computed } from 'vue'

/**
 * EH tints a gallery's stars by where its rating lands, one letter per landing
 * position: its own `RRGGB` reads as red up to 2, green through 4, blue at 4.5 and 5.
 * A reader who chose another combination chose it in their EH account, which no page
 * hands out, so what gets drawn is a default of ours.
 */
const STAR_COLOURS = 'RRBYY'

const props = defineProps<{ rating: number }>()

const colour = computed(() => `ehl-stars--${STAR_COLOURS[Math.ceil(props.rating) - 1].toLowerCase()}`)
</script>

<template>
  <span class="ehl-stars" :class="colour" :title="`${rating.toFixed(2)} / 5`">
    <span class="ehl-stars-on" :style="{ width: `${(rating / 5) * 100}%` }">★★★★★</span>
    ★★★★★
  </span>
</template>
