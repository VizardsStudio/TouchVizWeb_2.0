<template>
  <div class="unit-widget" :class="{ active: unitSelected }">
    <h3>{{ unit.name }}</h3>
    <p>Area: {{ unit.area }} m²</p>
    <p>Floor: {{ unit.floor }}</p>
    <p>Bedrooms: {{ unit.bedrooms }}</p>
    <button @click="$emit('close')">Close</button>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

defineProps<{
  unit: { name: string, area: number, floor: number, bedrooms: number }
  unitSelected: boolean
}>()

const emit = defineEmits<{ (e: 'close'): void }>()
</script>

<style scoped>
/* copy UnitWidget CSS */
</style>
