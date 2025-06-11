<template>
  <header class="header-moba">
    <div class="logo-moba">MLBB Tier List</div>
    <div class="header-actions">
      <button class="theme-switch" title="Alternar tema" @click="toggleTheme">
        <i :class="themeIcon"></i>
      </button>
      <div class="lang-switch-wrap">
        <button class="lang-switch" aria-label="Selecionar idioma" @click="toggleLangDropdown">
          <span class="flag" :style="{ backgroundImage: `url('${currentFlag}')` }"></span>
        </button>
        <div class="flag-dropdown" v-if="showLangDropdown">
          <span class="flag-option" :class="{selected: lang==='br'}" style="background-image: url('https://cdn.jsdelivr.net/gh/hjnilsson/country-flags/svg/br.svg')" @click="setLang('br')" tabindex="0" aria-label="Português"></span>
          <span class="flag-option" :class="{selected: lang==='us'}" style="background-image: url('https://cdn.jsdelivr.net/gh/hjnilsson/country-flags/svg/us.svg')" @click="setLang('us')" tabindex="0" aria-label="English"></span>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'
const theme = ref('light')
const lang = ref('br')
const showLangDropdown = ref(false)

const themeIcon = computed(() => theme.value === 'light' ? 'fa-solid fa-moon' : 'fa-solid fa-sun')
const currentFlag = computed(() =>
  lang.value === 'br'
    ? 'https://cdn.jsdelivr.net/gh/hjnilsson/country-flags/svg/br.svg'
    : 'https://cdn.jsdelivr.net/gh/hjnilsson/country-flags/svg/us.svg'
)

function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  document.documentElement.classList.toggle('dark-theme', theme.value === 'dark')
}
function toggleLangDropdown() {
  showLangDropdown.value = !showLangDropdown.value
}
function setLang(l) {
  lang.value = l
  showLangDropdown.value = false
}
</script>
