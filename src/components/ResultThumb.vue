<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { thumbSource } from '@/services/thumb'

const props = defineProps<{ url: string }>()

const src = ref<string | null>(null)
const failed = ref(false)

watchEffect(() => {
  const url = props.url
  src.value = null
  void thumbSource(url).then((resolved) => {
    if (props.url === url) src.value = resolved
  })
})
</script>

<template>
  <div class="ehl-result-thumb">
    <img v-if="src && !failed" :src="src" alt="" loading="lazy" referrerpolicy="no-referrer" @error="failed = true" />
  </div>
</template>

<style>
.ehl-result-thumb {
  aspect-ratio: 1;
  overflow: hidden;
  background: color-mix(in srgb, currentColor 8%, transparent);
  border-radius: 4px;
}
.ehl-result-thumb img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
