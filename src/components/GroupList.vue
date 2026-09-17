<script setup lang="ts">
import { locale, t } from '@/i18n'
import type { EditionGroup } from '@/core/pipeline'
import { displayTitle, subtitle } from '@/settings'

defineProps<{ groups: EditionGroup[]; showScore: boolean }>()

function percent(score: number): string {
  return `${Math.round(score * 100)}%`
}
</script>

<template>
  <div class="ehl-list">
    <section v-for="group in groups" :key="group.language.value" class="ehl-section">
      <h4 class="ehl-head">
        <span class="ehl-code">{{ group.language.code }}</span>
        {{ group.language.name[locale] }}
        <span class="ehl-count">{{ group.items.length }}</span>
      </h4>
      <ul>
        <li v-for="edition in group.items" :key="edition.hit.gid">
          <a class="ehl-title" :href="edition.hit.href" target="_blank" rel="noopener">
            {{ displayTitle(edition.hit) }}
            <span v-if="subtitle(edition.hit)" class="ehl-subtitle">{{ subtitle(edition.hit) }}</span>
          </a>
          <span v-for="flag in edition.flags" :key="flag" class="ehl-flag">{{ t(flag === 'rewrite' ? 'rewrite' : 'roughTranslation') }}</span>
          <span v-if="showScore" class="ehl-meta">{{ percent(edition.score) }}</span>
          <span v-if="edition.hit.pages !== null" class="ehl-meta">{{ edition.hit.pages }}{{ t('pages') }}</span>
          <a v-if="edition.hit.torrentHref" class="ehl-torrent" :href="edition.hit.torrentHref" target="_blank" rel="noopener" :title="t('torrent')">⇩</a>
        </li>
      </ul>
    </section>
  </div>
</template>
