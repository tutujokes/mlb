<template>
  <HeaderMoba />
  <main class="main-moba">
    <h1 class="main-title">Tier List - Mobile Legends</h1>
    <FiltersRow />
    <TierListContent @show-hero="showHeroModal" />
    <HeroModal :hero="selectedHero" v-if="showModal" @close="showModal = false" />
  </main>
  <FooterMoba />
</template>

<script setup>
import { ref } from 'vue'
import HeaderMoba from './components/HeaderMoba.vue'
import FiltersRow from './components/FiltersRow.vue'
import TierListContent from './components/TierListContent.vue'
import HeroModal from './components/HeroModal.vue'
import FooterMoba from './components/FooterMoba.vue'

const showModal = ref(false)
const selectedHero = ref(null)

function showHeroModal(hero) {
  selectedHero.value = hero
  showModal.value = true
}
</script>
