<template>
  <div class="top-bar">
    <div class="logo">
      <img src="../assets/Logo.png" class="logo-img" alt="">
      Burj Nawas
    </div>
    <div class="time-toggle">
      <div
        class="toggle-btn"
        :class="{ active: time === 'day' }"
        @click="emit('update:time', 'day')"
      >Day</div>
      <div
        class="toggle-btn"
        :class="{ active: time === 'night' }"
        @click="emit('update:time', 'night')"
      >Night</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

defineProps<{ time: 'day' | 'night' }>()
const emit = defineEmits<{ (e: 'update:time', value: 'day' | 'night'): void }>()
</script>

<style scoped>
/* copy your TopBar CSS */
</style>
