<script setup lang="ts">
import { t } from '@/i18n'
import { settings, TITLE_LANGUAGES, type TitleLanguage } from '@/settings'

const LABEL_KEY: Record<TitleLanguage, 'titleRomanized' | 'titleJapanese'> = {
  romanized: 'titleRomanized',
  japanese: 'titleJapanese',
}
</script>

<template>
  <div class="ehl-settings" translate="no">
    <div class="ehl-settings__row">
      <span class="ehl-settings__label">{{ t('settingTitleLanguage') }}</span>
      <label v-for="language in TITLE_LANGUAGES" :key="language" class="ehl-settings__option">
        <input v-model="settings.titleLanguage" type="radio" name="ehl-title-language" :value="language" />
        {{ t(LABEL_KEY[language]) }}
      </label>
    </div>
    <label class="ehl-settings__row ehl-settings__option">
      <input v-model="settings.showSubtitle" type="checkbox" />
      {{ t('settingSubtitle') }}
    </label>
  </div>
</template>

<style>
.ehl-settings {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  width: max-content;
  margin: 0 auto;
  padding: 8px 10px;
  font-size: 12px;
  font-weight: 400;
  text-align: left;
  white-space: nowrap;
  background: var(--ehl-bg, #fff);
  border: 1px solid var(--ehl-border, currentColor);
  border-radius: 0 0 9px 9px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.25);
  z-index: 10;
}
.ehl-settings__row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ehl-settings__label {
  font-weight: 700;
}
.ehl-settings__option {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  cursor: pointer;
}
.ehl-settings__option input {
  margin: 0;
}
</style>
