<template>
  <div class="tierlist-content">
    <section v-for="tier in tiers" :key="tier.label" class="tier-box" style="position:relative;">
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
import { computed } from 'vue'
// Exemplo de dados, substitua pelo fetch real ou props
const tiers = [
  { label: 'SS', heroes: [] },
  { label: 'S', heroes: [] },
  { label: 'A', heroes: [] },
  { label: 'B', heroes: [] },
  { label: 'C', heroes: [] }
]
const hasHeroes = computed(() => tiers.some(t => t.heroes.length > 0))
</script>
