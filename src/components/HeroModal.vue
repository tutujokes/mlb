<template>
  <div class="hero-modal" tabindex="-1" aria-modal="true" role="dialog">
    <div class="hero-modal-content">
      <button class="hero-modal-close" aria-label="Fechar modal" @click="$emit('close')">&times;</button>
      <div class="hero-modal-body">
        <div class="hero-modal-header">
          <div class="hero-modal-smallmap-row">
            <div class="hero-modal-smallmap-circle" :style="{ backgroundImage: `url('${hero?.img}')` }"></div>
            <div class="hero-modal-smallmap-info">
              <span class="hero-modal-smallmap-name">{{ hero?.name }}</span>
              <span class="hero-modal-smallmap-story">{{ hero?.desc }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  hero: Object
})
</script>
