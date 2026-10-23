<script setup lang="ts">
import { computed, ref } from 'vue'
import { faviconUrl } from '@/core/favicon'
import './favicon.css'

const props = defineProps<{ href: string }>()

const src = computed(() => faviconUrl(props.href))
/** An icon that failed to load (none where `faviconUrl` looks) is left out. */
const failed = ref(false)
</script>

<template>
  <img v-if="src !== null && !failed" class="ehl-favicon" :src="src" alt="" referrerpolicy="no-referrer" @error="failed = true" />
</template>
