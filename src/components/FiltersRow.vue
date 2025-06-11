<template>
  <div class="filters-row bg-alt">
    <span class="filter-title">Filtrar por Função e Rota</span>
    <div class="filter-group">
      <label for="rank">Rank:</label>
      <select id="rank" v-model="filters.rank">
        <option value="mythic">Mítico</option>
        <option value="legend">Lenda</option>
        <option value="epic">Épico</option>
        <option value="grandmaster">Grão-mestre</option>
        <option value="master">Mestre</option>
        <option value="elite">Elite</option>
        <option value="warrior">Guerreiro</option>
      </select>
    </div>
    <div class="filter-group">
      <label for="days">Dias:</label>
      <select id="days" v-model="filters.days">
        <option value="1">1</option>
        <option value="3">3</option>
        <option value="7">7</option>
        <option value="15">15</option>
        <option value="30">30</option>
      </select>
    </div>
    <div class="filter-group">
      <label for="role">Função:</label>
      <select id="role" v-model="filters.role">
        <option value="">Todas</option>
        <option value="mage">Mago</option>
        <option value="marksman">Atirador</option>
        <option value="tank">Tanque</option>
        <option value="assassin">Assassino</option>
        <option value="fighter">Lutador</option>
        <option value="support">Suporte</option>
      </select>
    </div>
    <div class="filter-group">
      <label for="lane">Rota:</label>
      <select id="lane" v-model="filters.lane">
        <option value="">Todas</option>
        <option value="mid">Meio</option>
        <option value="gold">Ouro</option>
        <option value="exp">EXP</option>
        <option value="jungle">Selva</option>
        <option value="roam">Roteação</option>
      </select>
    </div>
    <div class="filter-group">
      <label for="criterio" class="filter-title" style="position:relative;display:flex;align-items:center;gap:6px;">
        <span>Critério:</span>
        <span class="criterio-info-icon" tabindex="0" aria-label="Info" @click="showPopover = !showPopover">i</span>
        <div class="criterio-info-popover" v-if="showPopover" role="tooltip">
          <b>Probabilidade Bayesiana (BR):</b>
          <span>Calcula o desempenho considerando o winrate, popularidade e média global, reduzindo distorções de poucos jogos.</span>
          <b>Tierlist Normal (WR):</b>
          <span>Usa apenas o winrate para classificar os heróis, sem ajuste por popularidade.</span>
        </div>
      </label>
      <select id="criterio" v-model="filters.criterio">
        <option value="bayes">Probabilidade Bayesiana</option>
        <option value="normal">Tierlist Normal</option>
      </select>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const filters = ref({
  rank: 'mythic',
  days: '7',
  role: '',
  lane: '',
  criterio: 'normal'
})
const showPopover = ref(false)
</script>
