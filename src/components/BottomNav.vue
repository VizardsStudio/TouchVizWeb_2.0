<template>
  <div class="bottom-nav">
    <div class="nav-btn" :class="{ active: activeTab === 'home' }" @click="$emit('update:activeTab', 'home')">Home</div>
    <div class="nav-btn" :class="{ active: activeTab === 'filter' }" @click="$emit('toggleFilter')">Filtering</div>
    <div class="nav-btn" :class="{ active: activeTab === 'details' }" @click="$emit('update:activeTab', 'details')">Details</div>
    <div class="nav-btn" :class="{ active: activeTab === 'surroundings' }" @click="$emit('update:activeTab', 'surroundings')">Surroundings</div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

defineProps<{ activeTab: string }>()
const emit = defineEmits<{
  (e: 'update:activeTab', value: string): void
  (e: 'toggleFilter'): void
}>()
</script>

<style scoped>
/* copy BottomNav CSS */
</style>
