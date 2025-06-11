<template>
  <div class="tierlist-content">
    <section v-for="tier in filteredTiers" :key="tier.label" class="tier-box" style="position:relative;">
      <div :class="['tier-label', tier.label.toLowerCase()]">{{ tier.label }}</div>
      <div :id="`tier-${tier.label.toLowerCase()}`" class="tier-container">
        <div v-for="hero in tier.heroes" :key="hero.id" class="hero-card" @click="$emit('show-hero', hero)">
          <img :src="hero.img" :alt="hero.name" />
          <span>{{ hero.name }}</span>
        </div>
      </div>
    </section>
    <div v-if="!hasHeroes" class="no-results">Nenhum herói encontrado.</div>
  </div>
</template>

<script setup>
import { computed, reactive } from 'vue'
// Mock de dados de heróis
const allHeroes = [
  { id: 1, name: 'Layla', img: 'https://static.wikia.nocookie.net/mobile-legends/images/7/7e/Layla-MLBB.png', tier: 'S', role: 'marksman', lane: 'gold' },
  { id: 2, name: 'Tigreal', img: 'https://static.wikia.nocookie.net/mobile-legends/images/2/2e/Tigreal-MLBB.png', tier: 'A', role: 'tank', lane: 'roam' },
  { id: 3, name: 'Gusion', img: 'https://static.wikia.nocookie.net/mobile-legends/images/2/2e/Gusion-MLBB.png', tier: 'SS', role: 'assassin', lane: 'mid' },
  // Adicione mais heróis conforme necessário
]
const tiers = [
  { label: 'SS', heroes: [] },
  { label: 'S', heroes: [] },
  { label: 'A', heroes: [] },
  { label: 'B', heroes: [] },
  { label: 'C', heroes: [] }
]
// Exemplo de filtro simples (pode ser reativo e vir de props)
const filters = reactive({ role: '', lane: '' })
const filteredTiers = computed(() => {
  // Limpa as listas
  tiers.forEach(t => t.heroes = [])
  allHeroes.forEach(hero => {
    if ((filters.role === '' || hero.role === filters.role) && (filters.lane === '' || hero.lane === filters.lane)) {
      const tier = tiers.find(t => t.label === hero.tier)
      if (tier) tier.heroes.push(hero)
    }
  })
  return tiers
})
const hasHeroes = computed(() => filteredTiers.value.some(t => t.heroes.length > 0))
</script>
