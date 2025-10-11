<template>
  <div class="filter-panel" :class="{ active: filtering }">
    <!-- Floor -->
    <div class="filter-group">
      <label>Floor</label>
      <VueSlider
        v-model="floorRange"
        :min="1"
        :max="50"
        range
        :tooltip="'always'"
        :dot-size="18"
        :height="6"
        @change="onRangeChange('floor', floorRange)"
      />
    </div>

    <!-- Area -->
    <div class="filter-group">
      <label>Area</label>
      <VueSlider
        v-model="areaRange"
        :min="110"
        :max="570"
        range
        :tooltip="'always'"
        :dot-size="18"
        :height="6"        
        @change="onRangeChange('area', areaRange)"
      />
    </div>

    <!-- Bedrooms -->
    <div class="filter-group">
      <label>Bedrooms</label>
      <VueSlider
        v-model="bedRange"
        :min="1"
        :max="7"
        range
        :tooltip="'always'"
        :dot-size="18"
        :height="6"
        @change="onRangeChange('bed', bedRange)"
      />
    </div>

    <!-- Typology -->
    <div class="filter-group small-section">
      <label>Typology</label>
      <div class="toggle-row">
        <button
          v-for="t in typologies"
          :key="t"
          class="toggle"
          :class="{ active: selectedTypologies.includes(t) }"
          @click="toggleTypology(t)"
        >
          {{ t }}
        </button>
      </div>
    </div>

    <!-- View -->
    <div class="filter-group small-section">
      <label>View</label>
      <div class="toggle-row">
        <button
          v-for="v in views"
          :key="v"
          class="toggle"
          :class="{ active: selectedViews.includes(v) }"
          @click="toggleView(v)"
        >
          {{ v }}
        </button>
      </div>
    </div>

    <!-- Reset -->
    <div class="filter-group">
      <button class="reset-btn" @click="resetAll">Reset</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import VueSlider from 'vue-3-slider-component'

// Props (unchanged)
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
  (e: 'update:areaMin', value: number): void
  (e: 'update:areaMax', value: number): void
  (e: 'update:floorMin', value: number): void
  (e: 'update:floorMax', value: number): void
  (e: 'update:bedMin', value: number): void
  (e: 'update:bedMax', value: number): void
  (e: 'typology-change', value: string[]): void
  (e: 'view-change', value: string[]): void
  (e: 'reset'): void
}>()

// Ranges
const areaRange = ref<[number, number]>([110, 570])
const floorRange = ref<[number, number]>([1, 50])
const bedRange = ref<[number, number]>([1, 7])

// Watch for prop changes
watch(() => [props.areaMin, props.areaMax], ([min, max]) => areaRange.value = [min, max])
watch(() => [props.floorMin, props.floorMax], ([min, max]) => floorRange.value = [min, max])
watch(() => [props.bedMin, props.bedMax], ([min, max]) => bedRange.value = [min, max])

// Emit range changes
function onRangeChange(type: 'area' | 'floor' | 'bed', range: [number, number]) {
  switch (type) {
    case 'area':
      emit('update:areaMin', range[0])
      emit('update:areaMax', range[1])
      break
    case 'floor':
      emit('update:floorMin', range[0])
      emit('update:floorMax', range[1])
      break
    case 'bed':
      emit('update:bedMin', range[0])
      emit('update:bedMax', range[1])
      break
  }
}

// Typology + View (mutually inclusive)
const typologies = ['Apartment', 'Duplex', 'Penthouse']
const views = ['Dijla', 'City']

const selectedTypologies = ref<string[]>([])
const selectedViews = ref<string[]>([])

function toggleTypology(t: string) {
  const idx = selectedTypologies.value.indexOf(t)
  if (idx === -1) selectedTypologies.value.push(t)
  else selectedTypologies.value.splice(idx, 1)
  emit('typology-change', selectedTypologies.value)
}

function toggleView(v: string) {
  const idx = selectedViews.value.indexOf(v)
  if (idx === -1) selectedViews.value.push(v)
  else selectedViews.value.splice(idx, 1)
  emit('view-change', selectedViews.value)
}

// Reset
function resetAll() {
  areaRange.value = [110, 570]
  floorRange.value = [1, 50]
  bedRange.value = [1, 7]
  selectedTypologies.value = []
  selectedViews.value = []

  onRangeChange('area', areaRange.value)
  onRangeChange('floor', floorRange.value)
  onRangeChange('bed', bedRange.value)

  emit('typology-change', [])
  emit('view-change', [])
  emit('reset')
}
</script>

<style>
.filter-group label {
  text-align: center;
}

.filter-panel {
  position: absolute;
  bottom: 5rem;
  left: 50%;
  transform: translateX(-50%) translateY(20px);
  width: 90%;
  max-width: 480px;
  max-height: 60%;
  background: rgba(0, 0, 0, 0.85);
  padding: 1.5rem;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  overflow: scroll;
  opacity: 0;
  pointer-events: none;
  visibility: hidden;
  transition: opacity 0.3s ease, transform 0.3s ease, visibility 0.3s ease;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.filter-panel::-webkit-scrollbar {
  display: none;
}
.filter-panel.active {
  opacity: 1;
  pointer-events: auto;
  visibility: visible;
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

.toggle-row {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

.toggle {
  background: #95a9a6;
  color: #ffffff;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  box-shadow: none;
}

.toggle.active {
  background: #c9b59a;
  color: #3b2b1c;
}

.reset-btn {
  width: 100%;
  padding: 10px;
  border-radius: 6px;
  border: none;
  background: #e9e6e4;
  color: #7a5a2a;
  font-weight: 600;
  cursor: pointer;
}
</style>
