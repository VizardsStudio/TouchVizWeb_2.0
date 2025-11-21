<template>
  <div class="bottom-nav">
    <div class="nav-btn" :class="{ active: activeTab === 'home' }" @click="$emit('update:activeTab', 'home')">{{
      $t("Home") }}</div>
    <div class="nav-btn" :class="{ active: activeTab === 'filter' }" @click="$emit('toggleFilter')">{{
      $t("Filtering") }}</div>
    <div class="nav-btn" :class="{ active: activeTab === 'details' }" @click="$emit('update:activeTab', 'details')">
      {{ $t("Details") }}</div>
    <div class="nav-btn" :class="{ active: activeTab === 'surroundings' }"
      @click="$emit('update:activeTab', 'surroundings')">{{ $t("Surroundings") }}</div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

function ActivateFiltering() {
  emit('update:activeTab', 'filter')
}

defineExpose({ ActivateFiltering })

defineProps<{ activeTab: string }>()
const emit = defineEmits<{
  (e: 'update:activeTab', value: string): void
  (e: 'toggleFilter'): void
}>()
</script>

<style scoped>
/* copy BottomNav CSS */
</style>
