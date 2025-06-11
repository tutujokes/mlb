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
import { computed, reactive, ref, onMounted, watch } from 'vue'

const props = defineProps({
  filters: Object,
  rank: String,
  days: String,
  criterio: String
})

const loading = ref(false)
const error = ref(null)
const allHeroes = ref([])
const tiers = ref([
  { label: 'SS', heroes: [] },
  { label: 'S', heroes: [] },
  { label: 'A', heroes: [] },
  { label: 'B', heroes: [] },
  { label: 'C', heroes: [] }
])

async function fetchTierList() {
  loading.value = true
  error.value = null
  try {
    const url = `https://mlbb-proxy.vercel.app/api/hero-rank?source=rank&days=${props.days||7}&rank=${props.rank||'mythic'}&size=130&sort_field=win_rate&sort_order=desc`
    const res = await fetch(url)
    const json = await res.json()
    const records = json.data.records || []
    allHeroes.value = records.map(entry => {
      const hero = entry.data.main_hero.data
      return {
        id: hero.hero_id || hero.id,
        name: hero.name,
        img: hero.head,
        tier: entry.data.tier || entry.data.main_hero_tier || '',
        role: entry.data.role || '',
        lane: entry.data.lane || '',
        winRate: entry.data.main_hero_win_rate,
        ...entry.data
      }
    })
    updateTiers()
  } catch (e) {
    error.value = 'Erro ao carregar heróis.'
  } finally {
    loading.value = false
  }
}

function updateTiers() {
  // Limpa as listas
  tiers.value.forEach(t => t.heroes = [])
  allHeroes.value.forEach(hero => {
    // Filtros: role, lane, outros
    if ((props.filters.role === '' || hero.role === props.filters.role) &&
        (props.filters.lane === '' || hero.lane === props.filters.lane)) {
      const tier = tiers.value.find(t => t.label === (hero.tier || '').toUpperCase())
      if (tier) tier.heroes.push(hero)
    }
  })
}

const filteredTiers = computed(() => tiers.value)
const hasHeroes = computed(() => filteredTiers.value.some(t => t.heroes.length > 0))

onMounted(fetchTierList)
watch(() => [props.filters.role, props.filters.lane, props.rank, props.days, props.criterio], fetchTierList)
</script>
