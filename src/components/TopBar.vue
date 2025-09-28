<template>
  <div class="top-bar">
    <div class="logo">
      <img src="../Logo.png" class="logo-img" alt="">
      Burj Nawas
    </div>
    <Transition name="fade">
      <div class="time-toggle" v-show="showTime">
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
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref } from 'vue'

//===========state===============


defineProps<{ time: 'day' | 'night', showTime: boolean }>()
const emit = defineEmits<{ (e: 'update:time', value: 'day' | 'night'): void }>()
</script>

<style scoped>
/* copy your TopBar CSS */
</style>
