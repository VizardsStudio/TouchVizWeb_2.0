<template>
  <div class="filter-panel" :class="{ active: filtering }">
    <!-- Area -->
    <div class="filter-group">
      <label>Area (m²)</label>
      <input type="range" :value="areaMin" @input="onInput($event, 'areaMin')" min="50" max="300" />
      <input type="range" :value="areaMax" @input="onInput($event, 'areaMax')" min="50" max="300" />
      <div class="range-values"><span>{{ areaMin }}</span><span>{{ areaMax }}</span></div>
    </div>

    <!-- Floor -->
    <div class="filter-group">
      <label>Floor</label>
      <input type="range" :value="floorMin" @input="onInput($event, 'floorMin')" min="1" max="30" />
      <input type="range" :value="floorMax" @input="onInput($event, 'floorMax')" min="1" max="30" />
      <div class="range-values"><span>{{ floorMin }}</span><span>{{ floorMax }}</span></div>
    </div>

    <!-- Bedrooms -->
    <div class="filter-group">
      <label>Bedrooms</label>
      <input type="range" :value="bedMin" @input="onInput($event, 'bedMin')" min="1" max="5" />
      <input type="range" :value="bedMax" @input="onInput($event, 'bedMax')" min="1" max="5" />
      <div class="range-values"><span>{{ bedMin }}</span><span>{{ bedMax }}</span></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

// Props
const props = defineProps<{
  filtering: boolean
  areaMin: number
  areaMax: number
  floorMin: number
  floorMax: number
  bedMin: number
  bedMax: number
}>()

// Emits
const emit = defineEmits<{
  (e: 'update:filtering', value: boolean): void
  (e: 'update:areaMin', value: number): void
  (e: 'update:areaMax', value: number): void
  (e: 'update:floorMin', value: number): void
  (e: 'update:floorMax', value: number): void
  (e: 'update:bedMin', value: number): void
  (e: 'update:bedMax', value: number): void
}>()

// ✅ Slider property type
type SliderProps = 'areaMin' | 'areaMax' | 'floorMin' | 'floorMax' | 'bedMin' | 'bedMax'

// TS-safe input handler
function onInput(e: Event, prop: SliderProps) {
  const val = +(e.target as HTMLInputElement).value

  // Explicitly call the correct emit
  switch (prop) {
    case 'areaMin': emit('update:areaMin', val); break
    case 'areaMax': emit('update:areaMax', val); break
    case 'floorMin': emit('update:floorMin', val); break
    case 'floorMax': emit('update:floorMax', val); break
    case 'bedMin': emit('update:bedMin', val); break
    case 'bedMax': emit('update:bedMax', val); break
  }
}
</script>

<style >
/* ====== Filtering Panel ====== */
.filter-panel {
  position: absolute;
  bottom: 6rem;
  left: 50%;
  transform: translateX(-50%) translateY(20px);
  width: 90%;
  max-width: 480px;
  background: rgba(0, 0, 0, 0.85);
  padding: 1.5rem;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);

  opacity: 0;
  pointer-events: none;
  visibility: hidden; /* hides from layout but keeps it for transitions */
  transition: opacity 0.3s ease, transform 0.3s ease, visibility 0.3s ease;
}

.filter-panel.active {
  opacity: 1;
  pointer-events: auto;
  visibility: visible; /* now it’s visible */
  transform: translateX(-50%) translateY(0);
}


.filter-group {
  margin-bottom: 1.2rem;
}

.filter-group label {
  display: block;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.range-values {
  font-size: 0.8rem;
  display: flex;
  justify-content: space-between;
  margin-top: 0.3rem;
}

input[type=range] {
  width: 100%;
  pointer-events: auto;
}

</style>
