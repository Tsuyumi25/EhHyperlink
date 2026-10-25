<script setup lang="ts">
import { ref } from 'vue'
import { CircleQuestionMark, Languages, Minus, Plus } from '@lucide/vue'
import type { LocaleChoice } from '@/core/locale'
import { t, type MessageKey } from '@/i18n'
import { isMaxRequests, settings, VIEWS, type View } from '@/settings'

const VIEW_KEY: Record<View, MessageKey> = {
  list: 'viewList',
  covers: 'viewCovers',
}

/** Each language named in itself: a reader stuck in one they cannot read still finds their own. */
const LOCALE_OPTIONS: { value: LocaleChoice; label: string }[] = [
  { value: 'zh-TW', label: '繁體中文' },
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
]

/** The Paging Enlargement note, shown only when asked for: most readers never need it. */
const perkHelpOpen = ref(false)

function stepMaxRequests(by: number): void {
  const value = settings.maxRequests + by
  if (isMaxRequests(value)) settings.maxRequests = value
}
</script>

<template>
  <div class="ehl-settings" translate="no">
    <label class="ehl-settings__row ehl-settings__language">
      <span class="ehl-settings__label"><Languages :size="12" aria-hidden="true" /> {{ t('settingLanguage') }}</span>
      <select v-model="settings.locale" class="ehl-settings__select">
        <option value="auto">{{ t('settingLanguageAuto') }}</option>
        <option v-for="option in LOCALE_OPTIONS" :key="option.value" :value="option.value" :lang="option.value">{{ option.label }}</option>
      </select>
    </label>
    <section class="ehl-settings__group">
      <h3 class="ehl-settings__heading">{{ t('settingGroupRelated') }}</h3>
      <div class="ehl-settings__row">
        <span class="ehl-settings__label">{{ t('settingView') }}</span>
        <div class="ehl-settings__segments" role="radiogroup" :aria-label="t('settingView')">
          <label v-for="view in VIEWS" :key="view" class="ehl-settings__segment">
            <input v-model="settings.view" type="radio" name="ehl-view" :value="view" />
            <span>{{ t(VIEW_KEY[view]) }}</span>
          </label>
        </div>
      </div>
      <label class="ehl-settings__row ehl-settings__row--toggle">
        <span class="ehl-settings__label">{{ t('settingShowExcludedLanguages') }}</span>
        <input v-model="settings.languages" class="ehl-settings__switch" type="checkbox" role="switch" true-value="all" false-value="account" />
      </label>
      <div class="ehl-settings__row">
        <span class="ehl-settings__label">
          {{ t('settingMaxRequests') }}
          <button
            type="button"
            class="ehl-settings__help"
            :class="{ 'ehl-settings__help--open': perkHelpOpen }"
            :title="t('pagingPerksTitle')"
            :aria-label="t('pagingPerksTitle')"
            :aria-expanded="perkHelpOpen"
            @click="perkHelpOpen = !perkHelpOpen"
          >
            <CircleQuestionMark :size="12" aria-hidden="true" />
          </button>
        </span>
        <div class="ehl-settings__stepper">
          <button type="button" :aria-label="t('decrease')" :disabled="!isMaxRequests(settings.maxRequests - 1)" @click="stepMaxRequests(-1)">
            <Minus :size="11" aria-hidden="true" />
          </button>
          <output>{{ settings.maxRequests }}</output>
          <button type="button" :aria-label="t('increase')" @click="stepMaxRequests(1)">
            <Plus :size="11" aria-hidden="true" />
          </button>
        </div>
      </div>
      <!-- Each search reads only its first page of results; the perk makes that page longer. -->
      <div v-if="perkHelpOpen" class="ehl-settings__note">
        <p>
          <strong>{{ t('pagingPerksTitle') }}</strong>
          {{ t('pagingPerksDescription') }}
        </p>
        <p>{{ t('pagingPerkI') }}<br />{{ t('pagingPerkII') }}</p>
        <p class="ehl-settings__links">
          <a href="https://e-hentai.org/hathperks.php" target="_blank" rel="noopener">{{ t('hathPerks') }}</a>
          <a href="https://ehwiki.org/wiki/Hath_Perks" target="_blank" rel="noopener">{{ t('pagingPerksDetails') }}</a>
        </p>
      </div>
    </section>

    <section class="ehl-settings__group">
      <h3 class="ehl-settings__heading">{{ t('settingGroupSources') }}</h3>
      <label class="ehl-settings__row ehl-settings__row--toggle">
        <span class="ehl-settings__label">{{ t('settingDebug') }}</span>
        <input v-model="settings.debug" class="ehl-settings__switch" type="checkbox" role="switch" />
      </label>
    </section>
  </div>
</template>

<style>
/* The host page styles bare p, h3, input and button; every one used here is
   reset to what this popup draws. Colours come from currentColor and the
   page's own background, so both the light and the dark site read right. */
.ehl-settings {
  position: absolute;
  top: 100%;
  right: var(--ehl-inset, 0);
  box-sizing: border-box;
  width: 300px;
  max-width: calc(100vw - 20px);
  margin: 0;
  padding: 4px 12px 10px;
  font-size: 12px;
  font-weight: 400;
  line-height: 1.4;
  text-align: left;
  background: var(--ehl-bg, #fff);
  border: 1px solid var(--ehl-border, currentColor);
  border-radius: 0 0 9px 9px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.22);
  /* above the bar's lists (App.vue), which may be open beside it */
  z-index: 21;
}
.ehl-settings__group + .ehl-settings__group {
  border-top: 1px solid color-mix(in srgb, currentColor 15%, transparent);
}
.ehl-settings__heading {
  margin: 8px 0 2px;
  padding: 0;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  opacity: 0.55;
}
.ehl-settings__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 28px;
}
.ehl-settings__row--toggle {
  cursor: pointer;
}
.ehl-settings__label {
  flex: 1;
  min-width: 0;
}

/* Segmented control: the radios stay in the form for the keyboard and screen
   readers, the labels draw the buttons. */
.ehl-settings__segments {
  display: inline-flex;
  flex: none;
  padding: 2px;
  background: color-mix(in srgb, currentColor 8%, transparent);
  border-radius: 6px;
}
.ehl-settings__segment {
  position: relative;
  cursor: pointer;
}
.ehl-settings__segment input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}
.ehl-settings__segment span {
  display: block;
  padding: 2px 9px;
  border-radius: 4px;
  opacity: 0.65;
  white-space: nowrap;
}
.ehl-settings__segment:hover span {
  opacity: 1;
}
.ehl-settings__segment input:checked + span {
  font-weight: 700;
  background: var(--ehl-bg, #fff);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.18);
  opacity: 1;
}
.ehl-settings__segment input:focus-visible + span {
  outline: 2px solid color-mix(in srgb, currentColor 45%, transparent);
  outline-offset: 1px;
}

/* A checkbox drawn as a switch: track, and a knob that slides right when on. */
.ehl-settings__switch {
  position: relative;
  flex: none;
  width: 28px;
  height: 16px;
  margin: 0;
  padding: 0;
  color: inherit;
  background: color-mix(in srgb, currentColor 20%, transparent);
  border: 0;
  border-radius: 8px;
  cursor: pointer;
  appearance: none;
  transition: background 0.15s;
}
.ehl-settings__switch::before {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 12px;
  height: 12px;
  background: var(--ehl-bg, #fff);
  border-radius: 50%;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
  content: '';
  transition: transform 0.15s;
}
.ehl-settings__switch:checked {
  background: currentColor;
}
.ehl-settings__switch:checked::before {
  transform: translateX(12px);
}
.ehl-settings__switch:focus-visible {
  outline: 2px solid color-mix(in srgb, currentColor 45%, transparent);
  outline-offset: 2px;
}

.ehl-settings__stepper {
  display: inline-flex;
  flex: none;
  align-items: center;
  border: 1px solid color-mix(in srgb, currentColor 30%, transparent);
  border-radius: 6px;
}
.ehl-settings__stepper button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 20px;
  margin: 0;
  padding: 0;
  color: inherit;
  background: none;
  border: 0;
  cursor: pointer;
  opacity: 0.7;
}
.ehl-settings__stepper button:hover:not(:disabled) {
  opacity: 1;
}
.ehl-settings__stepper button:disabled {
  cursor: default;
  opacity: 0.25;
}
.ehl-settings__stepper output {
  min-width: 2ch;
  font-weight: 700;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.ehl-settings__help {
  display: inline-flex;
  margin: 0 0 0 2px;
  padding: 1px;
  color: inherit;
  vertical-align: -2px;
  background: none;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  opacity: 0.5;
}
.ehl-settings__help:hover,
.ehl-settings__help--open {
  opacity: 1;
}
.ehl-settings__language {
  padding-top: 6px;
}
.ehl-settings__language .ehl-settings__label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
/* The host page draws selects with its own border and background; this one
   follows the popup's colours like the stepper beside it. */
.ehl-settings__select {
  height: 22px;
  margin: 0;
  padding: 0 4px;
  font: inherit;
  color: inherit;
  background: var(--ehl-bg, #fff);
  border: 1px solid color-mix(in srgb, currentColor 30%, transparent);
  border-radius: 6px;
  cursor: pointer;
}
.ehl-settings__note {
  margin: 2px 0 4px;
  padding: 6px 8px;
  font-size: 11px;
  background: color-mix(in srgb, currentColor 6%, transparent);
  border-radius: 6px;
}
.ehl-settings__note p {
  margin: 0;
  padding: 0;
  opacity: 0.85;
}
.ehl-settings__note p + p {
  margin-top: 4px;
}
.ehl-settings__links {
  display: flex;
  gap: 10px;
}
.ehl-settings__links a {
  text-decoration: underline;
  text-underline-offset: 2px;
}
</style>
