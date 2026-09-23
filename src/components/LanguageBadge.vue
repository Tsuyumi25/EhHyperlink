<script setup lang="ts">
import type { Language } from '@/core/rank/languages'
import { locale } from '@/i18n'

defineProps<{ language: Language }>()
</script>

<template>
  <span class="ehl-language" :data-language="language.value" :title="language.name[locale]" :aria-label="language.name[locale]">{{ language.code }}</span>
</template>
